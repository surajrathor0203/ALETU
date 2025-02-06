const express = require('express');
const router = express.Router();
const rateLimit = require('express-rate-limit');
const { generateAndVisualize, generatePath } = require('../controllers/openaiController');
const OpenAI = require('openai');

// Add rate limiter
const limiter = rateLimit({
    windowMs: 60 * 1000, // 1 minute
    max: 5, // limit each IP to 5 requests per minute
    message: {
        error: 'Too many requests',
        details: 'Please wait a minute before trying again',
    }
});

// Validate API key before creating OpenAI instance
if (!process.env.OPENAI_API_KEY || !process.env.OPENAI_API_KEY.startsWith('sk-')) {
    console.error('Invalid or missing OpenAI API key format');
}

const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
    maxRetries: 3,
    timeout: 30000
});

// Add retry logic and exponential backoff
const retryRequest = async (fn, maxRetries = 3) => {
    for (let i = 0; i < maxRetries; i++) {
        try {
            return await fn();
        } catch (error) {
            if (error.code === 'insufficient_quota' || i === maxRetries - 1) {
                throw error;
            }
            // Exponential backoff: wait 2^i * 1000ms before retrying
            await new Promise(resolve => setTimeout(resolve, Math.pow(2, i) * 1000));
        }
    }
};

// Apply rate limiter to all routes
router.use(limiter);

router.get('/generate-and-visualize', generateAndVisualize);
router.get('/generate-path', generatePath);

router.post('/chat', async (req, res) => {
    try {
        const { message } = req.body;
        
        if (!message) {
            return res.status(400).json({ error: 'Message is required' });
        }

        if (!process.env.OPENAI_API_KEY || !process.env.OPENAI_API_KEY.startsWith('sk-')) {
            return res.status(500).json({ 
                error: 'Invalid OpenAI API key configuration',
                details: 'The API key format is invalid or missing'
            });
        }

        const response = await retryRequest(async () => {
            const completion = await openai.chat.completions.create({
                messages: [{ role: "user", content: message }],
                model: "gpt-3.5-turbo",
                max_tokens: 1000,
                temperature: 0.7,
            });

            if (!completion.choices || completion.choices.length === 0) {
                throw new Error('No response from OpenAI');
            }

            return completion;
        });

        res.json({ response: response.choices[0].message.content });
    } catch (error) {
        console.error('OpenAI API error:', error);
        
        switch(error.code) {
            case 'insufficient_quota':
                return res.status(429).json({
                    error: 'API quota exceeded',
                    details: 'Daily quota exceeded. Please try again tomorrow.',
                    retryAfter: '24h'
                });
            case 'rate_limit_exceeded':
                return res.status(429).json({
                    error: 'Rate limit exceeded',
                    details: 'Too many requests. Please wait before trying again.',
                    retryAfter: '1m'
                });
            default:
                return res.status(500).json({ 
                    error: 'Failed to get response from AI',
                    details: error.message 
                });
        }
    }
});

module.exports = router;