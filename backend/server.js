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
    try {
        const files = req.files;
        if (!files || files.length === 0) {
            return res.status(400).json({ error: 'No image files provided' });
        }

        // Process images with OpenAI Vision API
        const imageAnalyses = await Promise.all(files.map(async (file) => {
            // Read file buffer
            const imageBuffer = await fs.promises.readFile(file.path);
            const imageBase64 = imageBuffer.toString('base64');
            
            // Use prompts from config file
            const messages = JSON.parse(JSON.stringify(prompts.imageAnalysis.messages));
            messages[1].content[1].image_url.url = `data:${file.mimetype};base64,${imageBase64}`;

            const response = await openai.chat.completions.create({
                model: prompts.imageAnalysis.model,
                messages: messages,
                max_tokens: prompts.imageAnalysis.max_tokens
            });

            // Process results summary
            const analysis = response.choices[0].message.content;
            const summaryMessages = JSON.parse(JSON.stringify(prompts.resultsSummary.messages));
            summaryMessages[1].content = analysis;

            const summaryResponse = await openai.chat.completions.create({
                model: prompts.resultsSummary.model,
                messages: summaryMessages,
                max_tokens: prompts.resultsSummary.max_tokens
            });

            const summary = summaryResponse.choices[0].message.content;

            // Extract JSON from summary
            let compatibilityData = {};
            try {
                const jsonMatch = summary.match(/\{[\s\S]*\}/);
                if (jsonMatch) {
                    compatibilityData = JSON.parse(jsonMatch[0]);
                }
            } catch (error) {
                console.error('Error parsing compatibility JSON:', error);
                compatibilityData = {
                    thermostatType: "Unknown",
                    compatibility: "Uncertain",
                    confidence: 0,
                    recommendations: ["Error processing results"]
                };
            }

            return {
                analysis,
                summary,
                compatibility: compatibilityData,
                debug: {
                    timestamp: new Date().toISOString(),
                    model: prompts.imageAnalysis.model,
                    processingTime: Date.now() - req.startTime
                }
            };
        }));

        // Cleanup temporary files
        await cleanupFiles(files);

        res.json({
            results: imageAnalyses,
            count: imageAnalyses.length,
            totalProcessingTime: Date.now() - req.startTime
        });
    } catch (error) {
        console.error('Error analyzing images:', error);
        // Cleanup files even if there's an error
        if (req.files) {
            await cleanupFiles(req.files);
        }
        res.status(500).json({ error: 'Error analyzing images', details: error.message });
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
