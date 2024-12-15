require('dotenv').config();
const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const multer = require('multer');
const path = require('path');
const fs = require('fs').promises;
const { OpenAI } = require('openai');

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(bodyParser.json());

// Configure multer for handling file uploads
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, 'uploads/');
    },
    filename: function (req, file, cb) {
        cb(null, `${Date.now()}-${file.originalname}`);
    }
});

// File filter for images
const fileFilter = (req, file, cb) => {
    const allowedTypes = ['image/jpeg', 'image/png', 'image/heic'];
    if (allowedTypes.includes(file.mimetype)) {
        cb(null, true);
    } else {
        cb(new Error('Invalid file type. Only JPG, PNG and HEIC files are allowed.'), false);
    }
};

const upload = multer({ 
    storage: storage,
    fileFilter: fileFilter,
    limits: {
        fileSize: 5 * 1024 * 1024 // 5MB limit
    }
});

// Initialize OpenAI
const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY
});

// Helper function to clean up uploaded files
const cleanupFiles = async (files) => {
    try {
        for (const file of files) {
            await fs.unlink(file.path);
        }
    } catch (error) {
        console.error('Error cleaning up files:', error);
    }
};

// Version info endpoint
app.get('/api/version', async (req, res) => {
    try {
        const versionData = await fs.readFile(path.join(__dirname, '..', 'version.json'), 'utf8');
        res.json(JSON.parse(versionData));
    } catch (error) {
        res.status(500).json({ error: 'Could not read version info' });
    }
});

// Routes
app.post('/api/analyze', upload.array('images', 2), async (req, res) => {
    try {
        const files = req.files;
        
        if (!files || files.length === 0) {
            return res.status(400).json({ 
                error: 'No images uploaded',
                details: 'Please upload at least one image of your thermostat.'
            });
        }

        if (files.length > 2) {
            await cleanupFiles(files);
            return res.status(400).json({ 
                error: 'Too many files',
                details: 'Maximum of 2 images allowed.'
            });
        }

        // Process images with OpenAI Vision API
        const imageAnalyses = await Promise.all(files.map(async (file) => {
            const imageData = await fs.readFile(file.path, { encoding: 'base64' });
            
            const response = await openai.chat.completions.create({
                model: "gpt-4-turbo",
                messages: [
                    {
                        role: "user",
                        content: [
                            {
                                type: "text",
                                text: "Analyze this thermostat image. First, describe what you see in detail. Then tell me: 1) What type/model of thermostat it is, 2) Whether it's likely compatible with Mysa's smart thermostats, 3) What's your confidence level in this assessment, and 4) Any specific recommendations or concerns for installation."
                            },
                            {
                                type: "image_url",
                                image_url: {
                                    url: `data:${file.mimetype};base64,${imageData}`
                                }
                            }
                        ]
                    }
                ],
                max_tokens: 1000
            });

            return response.choices[0].message.content;
        }));

        // Process the API responses
        const combinedAnalysis = imageAnalyses.join('\n\n');
        
        // Extract key information using another GPT call
        const analysisResponse = await openai.chat.completions.create({
            model: "gpt-4",
            messages: [
                {
                    role: "system",
                    content: `You are a thermostat compatibility analyzer. Analyze the thermostat description and provide two things:
1. A natural language explanation of the compatibility
2. A JSON object with the following structure (ensure it's valid JSON with double quotes):
{
    "thermostatType": "type of thermostat",
    "compatibility": "Compatible/Not Compatible/Uncertain",
    "confidence": 0.95,
    "recommendations": ["recommendation 1", "recommendation 2"]
}
Always include the JSON object at the end of your response, separated by a newline.`
                },
                {
                    role: "user",
                    content: combinedAnalysis
                }
            ],
            max_tokens: 1000
        });

        const fullResponse = analysisResponse.choices[0].message.content;
        
        // Extract JSON from the response by finding the last occurrence of a JSON-like structure
        const jsonMatch = fullResponse.match(/\{[\s\S]*\}/g);
        let analysis;
        
        if (jsonMatch) {
            try {
                // Get the last match (in case there are multiple JSON structures)
                const lastJson = jsonMatch[jsonMatch.length - 1];
                analysis = JSON.parse(lastJson);
                
                // Validate the required fields
                if (!analysis.thermostatType || !analysis.compatibility || 
                    !analysis.confidence || !Array.isArray(analysis.recommendations)) {
                    throw new Error('Invalid analysis structure');
                }
                
                // Ensure confidence is a number between 0 and 1
                analysis.confidence = parseFloat(analysis.confidence);
                if (isNaN(analysis.confidence)) {
                    analysis.confidence = 0.5; // Default to 50% if invalid
                }
            } catch (err) {
                console.error('Error parsing JSON from response:', err);
                console.error('Response content:', fullResponse);
                
                // Create a fallback analysis
                analysis = {
                    thermostatType: "Unknown",
                    compatibility: "Uncertain",
                    confidence: 0.5,
                    recommendations: ["Could not determine compatibility with certainty", "Please contact support for manual verification"]
                };
            }
        } else {
            console.error('No JSON found in response:', fullResponse);
            throw new Error('Could not extract analysis results');
        }

        // Clean up files after processing
        await cleanupFiles(files);

        // Send both the structured analysis and full response
        res.json({
            ...analysis,
            fullAnalysis: fullResponse.replace(jsonMatch[jsonMatch.length - 1], '').trim(),
            rawAnalyses: imageAnalyses,
            debug: process.env.NODE_ENV === 'development' ? {
                timestamp: new Date().toISOString(),
                processingTime: Date.now() - req.startTime,
                imageCount: files.length,
            } : undefined
        });
    } catch (error) {
        // Clean up files if there's an error
        if (req.files) {
            await cleanupFiles(req.files);
        }

        console.error('Error processing request:', error);
        res.status(500).json({ 
            error: 'Error analyzing images',
            details: process.env.NODE_ENV === 'development' ? error.message : 'An unexpected error occurred.'
        });
    }
});

// Health check endpoint
app.get('/api/health', (req, res) => {
    res.json({ 
        status: 'healthy',
        timestamp: new Date().toISOString()
    });
});

// Error handling middleware
app.use((err, req, res, next) => {
    if (err instanceof multer.MulterError) {
        if (err.code === 'LIMIT_FILE_SIZE') {
            return res.status(400).json({
                error: 'File too large',
                details: 'Maximum file size is 5MB.'
            });
        }
    }
    
    console.error('Unhandled error:', err);
    res.status(500).json({
        error: 'Internal server error',
        details: process.env.NODE_ENV === 'development' ? err.message : 'An unexpected error occurred.'
    });
});

// Start server
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
