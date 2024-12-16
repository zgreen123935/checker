const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
require('dotenv').config();
const { OpenAI } = require('openai');

// Load prompts configuration
const promptsPath = path.join(__dirname, 'prompts', 'thermostat-analysis.json');
const prompts = JSON.parse(fs.readFileSync(promptsPath, 'utf8'));

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
            await fs.promises.unlink(file.path);
        }
    } catch (error) {
        console.error('Error cleaning up files:', error);
    }
};

// Version info endpoint
app.get('/api/version', async (req, res) => {
    try {
        const versionData = await fs.promises.readFile(path.join(__dirname, '..', 'version.json'), 'utf8');
        res.json(JSON.parse(versionData));
    } catch (error) {
        res.status(500).json({ error: 'Could not read version info' });
    }
});

// Routes
app.post('/api/analyze', upload.array('images', 5), async (req, res) => {
    const startTime = Date.now();
    const files = req.files || [];
    
    try {
        const description = req.body.description;

        if (!description && files.length === 0) {
            return res.status(400).json({ error: 'No thermostat description or images provided' });
        }

        // Process thermostat analysis with GPT-4
        const messages = JSON.parse(JSON.stringify(prompts.imageAnalysis.messages));
        
        // Prepare the content array with the text description
        const content = [
            {
                type: "text",
                text: messages[1].content[0].text + `\n\nHere is the thermostat description:\n${description || "No text description provided."}`
            }
        ];

        // Add image content if files are provided
        if (files.length > 0) {
            for (const file of files) {
                const imageBase64 = await fs.promises.readFile(file.path, { encoding: 'base64' });
                content.push({
                    type: "image_url",
                    image_url: {
                        url: `data:${file.mimetype};base64,${imageBase64}`,
                        detail: "high"
                    }
                });
            }
        }

        // Update the messages content
        messages[1].content = content;

        // Get the analysis from GPT-4
        const response = await openai.chat.completions.create({
            model: prompts.imageAnalysis.model,
            messages: messages,
            max_tokens: prompts.imageAnalysis.max_tokens,
            temperature: prompts.imageAnalysis.temperature
        });

        const analysis = response.choices[0].message.content;
        
        // Process results summary
        const summaryMessages = JSON.parse(JSON.stringify(prompts.resultsSummary.messages));
        summaryMessages.push({
            role: "user",
            content: `Please summarize this thermostat analysis in a clear, natural format. Focus on compatibility status, confidence level, and key recommendations:\n\n${analysis}`
        });

        const summaryResponse = await openai.chat.completions.create({
            model: prompts.resultsSummary.model,
            messages: summaryMessages,
            max_tokens: prompts.resultsSummary.max_tokens,
            temperature: prompts.resultsSummary.temperature
        });

        const summary = summaryResponse.choices[0].message.content;

        // Clean up uploaded files
        if (files.length > 0) {
            await cleanupFiles(files);
        }

        // Extract compatibility information from the summary
        const compatibilityInfo = {
            thermostatType: summary.match(/type:?\s*([^.\\n]+)/i)?.[1]?.trim() || "Not specified",
            compatibility: summary.toLowerCase().includes("not compatible") ? "Not Compatible" : 
                         summary.toLowerCase().includes("compatible") ? "Compatible" : "Uncertain",
            confidence: parseFloat(summary.match(/confidence.*?(\d+)/i)?.[1] || "0") / 100,
            recommendations: summary.match(/recommendations?:?(.*?)(?:\n|$)/gi)?.map(r => 
                r.replace(/recommendations?:?\s*/i, '').trim()
            ).filter(Boolean) || []
        };

        res.json({
            results: [{
                analysis,
                summary,
                compatibility: compatibilityInfo,
                debug: {
                    timestamp: new Date().toISOString(),
                    model: prompts.imageAnalysis.model,
                    processingTime: Date.now() - startTime,
                    filesProcessed: files.length
                }
            }],
            count: 1,
            totalProcessingTime: Date.now() - startTime
        });
    } catch (error) {
        console.error('Error analyzing thermostat:', error);
        
        // Clean up files if they exist
        if (files.length > 0) {
            await cleanupFiles(files);
        }

        res.status(500).json({
            error: 'Error analyzing thermostat',
            details: error.message,
            debug: {
                timestamp: new Date().toISOString(),
                model: prompts.imageAnalysis.model,
                processingTime: Date.now() - startTime,
                error: error.message
            }
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
