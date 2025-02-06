const express = require('express');
const router = express.Router();
const rateLimit = require('express-rate-limit');
const { GoogleGenerativeAI } = require('@google/generative-ai');
const path = require('path');
const TextToSVG = require('text-to-svg');

// Add rate limiter
const limiter = rateLimit({
    windowMs: 60 * 1000,
    max: 5,
    message: {
        error: 'Too many requests',
        details: 'Please wait a minute before trying again',
    }
});

// Initialize Gemini AI
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

// Apply rate limiter to all routes
router.use(limiter);

async function generateSVGPath(textInput) {
    const fontPath = path.join(__dirname, '..', 'public', 'fonts', 'chawp.ttf');
    const textToSVG = TextToSVG.loadSync(fontPath);
    const fontSize = 64;
    const options = { 
        fontSize, 
        anchor: 'top', 
        attributes: { 
            fill: 'none',
            stroke: 'white',
            'stroke-width': '1',
            'font-family': 'chawp'
        } 
    };

    // ...existing code...
}

router.post('/chat', async (req, res) => {
    try {
        const { message } = req.body;
        
        if (!message) {
            return res.status(400).json({ error: 'Message is required' });
        }

        if (!process.env.GEMINI_API_KEY) {
            throw new Error('Gemini API key is not configured');
        }

        // Initialize the model
        const model = genAI.getGenerativeModel({ model: "gemini-pro" });

        try {
            const result = await model.generateContent(message);
            const response = await result.response;
            const text = response.text();
            res.json({ response: text });
        } catch (aiError) {
            console.error('Gemini AI Error:', aiError);
            throw new Error('Failed to generate AI response');
        }
    } catch (error) {
        console.error('Server error:', error);
        res.status(500).json({ 
            error: 'Failed to get response from AI',
            details: error.message 
        });
    }
});

module.exports = router;