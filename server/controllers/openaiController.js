// const { OpenAI } = require('openai');
// const path = require('path');
// const TextToSVG = require('text-to-svg');

// const openai = new OpenAI({
//     apiKey: process.env.OPENAI_API_KEY,
//     timeout: 30000, // 30 second timeout
//     maxRetries: 3   // Add retries
// });

// const CANVAS_WIDTH = 1200; // Update server-side canvas width to match client
// const CANVAS_HEIGHT = 380;
// const LINE_HEIGHT = 60;  // Increased from 40 to 60

// const generateAndVisualize = async (req, res) => {
//     let retries = 3;
//     while (retries > 0) {
//         try {
//             if (!process.env.OPENAI_API_KEY) {
//                 throw new Error("OpenAI API key is not configured");
//             }

//             const response = await openai.chat.completions.create({
//                 model: 'gpt-3.5-turbo',
//                 messages: [{ 
//                     role: 'user', 
//                     content: "Describe basketball in simple sentences" 
//                 }],
//             });

//             // Split text into sentences and format
//             const sentences = response.choices[0].message.content
//                 .split(/(?<=[.!?])\s+/)
//                 .filter(sentence => sentence.trim());
                
//             // Create pairs of sentences
//             const formattedText = sentences.map(sentence => sentence.trim()).join('\n');
            
//             const svgData = await generateSVGPath(formattedText);

//             res.json({
//                 message: "Text generated and visualized",
//                 text: formattedText,
//                 svgPaths: svgData,
//                 animationCompleted: svgData.length === 0,
//             });
            
//             break; // Exit loop on success
//         } catch (error) {
//             retries--;
//             console.error(`OpenAI Error (${retries} retries left):`, error);
            
//             if (retries === 0) {
//                 return res.status(503).json({
//                     message: "Service temporarily unavailable. Please try again later.",
//                     error: error.message
//                 });
//             }
            
//             // Wait 2 seconds before retrying
//             await new Promise(resolve => setTimeout(resolve, 2000));
//         }
//     }
// };

// const generatePath = async (req, res) => {
//     try {
//         const textInput = req.query.text;
//         const svgData = await generateSVGPath(textInput);
//         res.json(svgData);
//     } catch (error) {
//         console.error('Error generating SVG path:', error);
//         res.status(500).json({ error: 'Internal Server Error' });
//     }
// };

// // Update the font path in generateSVGPath function
// async function generateSVGPath(textInput) {
//     const fontPath = path.join(__dirname, '..', 'fonts', 'times new roman.ttf');
//     const textToSVG = TextToSVG.loadSync(fontPath);
//     const fontSize = 64; // Increased from 44 to 64
//     const options = { 
//         fontSize, 
//         anchor: 'top', 
//         attributes: { 
//             fill: 'none',
//             stroke: 'white', // Change stroke to white
//             'stroke-width': '1',
//             'font-family': 'TimesNewRoman'
//         } 
//     };

//     const sentences = textInput.split('\n');
//     let xOffset = 20; // Start with margin
//     let yOffset = 40; // Initial vertical position
//     let svgWords = [];
//     let svgLetters = [];
//     let currentContent = [];

//     for (const sentence of sentences) {
//         // Reset x position for each new sentence
//         xOffset = 20;
        
//         const words = sentence.split(' ');
//         for (const word of words) {
//             const wordWidth = textToSVG.getMetrics(word, options).width;

//             // Check if word exceeds canvas width
//             if (xOffset + wordWidth > CANVAS_WIDTH - 40) {
//                 xOffset = 20;
//                 yOffset += LINE_HEIGHT;
//             }

//             // Check if we've reached bottom of canvas
//             if (yOffset + fontSize > CANVAS_HEIGHT) {
//                 currentContent.push({ svgWords, svgLetters });
//                 svgWords = [];
//                 svgLetters = [];
//                 yOffset = 40; // Reset for next page
//             }

//             const wordPathString = textToSVG.getD(word, { ...options, x: xOffset, y: yOffset });
//             svgWords.push(wordPathString);

//             // Add each letter
//             for (const letter of word) {
//                 const letterPathString = textToSVG.getD(letter, { ...options, x: xOffset, y: yOffset });
//                 svgLetters.push(letterPathString);
//                 xOffset += textToSVG.getMetrics(letter, options).width + 1;
//             }

//             xOffset += 10; // Space between words
//         }

//         // Add extra vertical space between sentences
//         yOffset += LINE_HEIGHT * 1.5;
//     }

//     currentContent.push({ svgWords, svgLetters });
//     return currentContent;
// }

// module.exports = {
//     generateAndVisualize,
//     generatePath
// };