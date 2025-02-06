import React, { useState, useRef, useEffect } from 'react';
import {
    Box,
    Paper,
    Typography,
    IconButton,
    TextField,
    CircularProgress,
    Button,
    styled,
} from '@mui/material';
import { SVG } from '@svgdotjs/svg.js';
import {
    Send as SendIcon,
    Speed as SpeedIcon,
} from '@mui/icons-material';
import VolumeUpIcon from '@mui/icons-material/VolumeUp';
import VolumeOffIcon from '@mui/icons-material/VolumeDown';
import StopIcon from '@mui/icons-material/Stop';
import { Canvas } from '@react-three/fiber';
import { useGLTF, OrbitControls } from '@react-three/drei';
import AnimationController from '../utils/animationController';
import { MicNone as MicIcon, MicOff as MicOffIcon } from '@mui/icons-material';  // Add this import at the top with other imports

// Define expressions object
const expressions = {
  neutral: [0, 0, 0, 0, 0],
  questioning: [0.1, 0.2, 0.3, 0.4, 0.5],
  emphasizing: [0.2, 0.3, 0.4, 0.5, 0.6],
  thinking: [0.3, 0.4, 0.5, 0.6, 0.7],
  explaining: [0.4, 0.5, 0.6, 0.7, 0.8],
  reading: [0.5, 0.6, 0.7, 0.8, 0.9],
  encouraging: [0.6, 0.7, 0.8, 0.9, 1.0],
  listening: [0.7, 0.8, 0.9, 1.0, 1.1]
};

// Styled components
// Remove unused styled components
// const SidebarButton and MessageBubble can be removed

const CANVAS_WIDTH = 950; // Increased from 850
const CANVAS_HEIGHT = window.innerHeight - 200; // Increased padding

// Update canvas dimensions calculation
const getCanvasDimensions = (width, height) => {
  const containerWidth = {
    xs: width * 0.98,    // Increased from 95%
    sm: width * 0.95,    // Increased from 90%
    md: width * 0.90,    // Increased from 85%
    lg: width * 0.85     // Increased from 80%
  };
  
  const breakpoint = width < 600 ? 'xs' : 
                     width < 960 ? 'sm' : 
                     width < 1280 ? 'md' : 'lg';
                     
  return {
    width: Math.min(containerWidth[breakpoint], 1600), // Increased from 1400px
    height: Math.max(500, height * 0.7)
  };
};

// Add this after the existing styled components and before the ChatInterface component
const visualizationBoxStyle = {
  flex: 1,
  p: { xs: 1, sm: 2, md: 3 },
  overflow: 'auto',
  width: {
    xs: '98%',    // Increased from 95%
    sm: '95%',    // Increased from 90%
    md: '90%',
    lg: '85%'     // Increased from 80%
  },
  height: {
    xs: '85vh',
    sm: '88vh',
    md: '90vh',
    lg: '90vh'
  },
  maxWidth: '1600px', // Increased from 1400px
  minHeight: '500px',
  margin: '0 auto',
  backgroundColor: 'black',
  border: '20px solid',
  borderRadius: '12px',
  borderColor: '#8B4513',
  mx: 'auto',
  my: { xs: 2, sm: 3, md: 4 },
  // Add these scrollbar styles
  '&::-webkit-scrollbar': {
    width: '8px',
    backgroundColor: 'transparent'
  },
  '&::-webkit-scrollbar-thumb': {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: '4px',
    '&:hover': {
      backgroundColor: 'rgba(255, 255, 255, 0.2)'
    }
  },
  // For Firefox
  scrollbarWidth: 'thin',
  scrollbarColor: 'rgba(255, 255, 255, 0.1) transparent'
};

// Add this class before the ChatInterface component
const SpeedIndicator = styled('div')(({ theme }) => ({
  position: 'absolute',
  bottom: -8,
  right: -8,
  backgroundColor: theme.palette.primary.main,
  color: 'white',
  borderRadius: '50%',
  width: 20,
  height: 20,
  fontSize: '0.7rem',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  fontWeight: 'bold'
}));

// Update expressions with more natural reading states
// Update lerp function to include easing
const lerp = (start, end, t) => {
  // Smoothstep easing
  t = t * t * (3 - 2 * t);
  return start * (1 - t) + end * t;
};

// Add spring animation helper
const spring = (target, current, velocity, stiffness = 0.15, damping = 0.8) => {
  const acceleration = (target - current) * stiffness;
  velocity = (velocity + acceleration) * damping;
  return [current + velocity, velocity];
};

// Replace the existing createBlinkAnimation function with this improved version
const createBlinkAnimation = () => {
  const now = Date.now();
  const baseBlinkInterval = 4000; // Base time between blinks
  const randomOffset = Math.random() * 2000; // Random variation
  const blinkDuration = 200; // Total blink duration
  
  // Add natural randomness to blink timing
  const shouldBlink = Math.random() > 0.7; // 30% chance to skip a blink
  const interval = shouldBlink ? baseBlinkInterval : baseBlinkInterval + 2000;
  
  const timeSinceLastBlink = now % (interval + randomOffset);
  
  if (timeSinceLastBlink < blinkDuration) {
    const phase = timeSinceLastBlink / blinkDuration;
    
    // Smooth easing for blink animation
    if (phase < 0.5) {
      // Closing phase - ease in
      return Math.pow(phase * 2, 2);
    } else {
      // Opening phase - ease out
      return Math.pow(2 * (1 - phase), 2);
    }
  }
  return 0;
};

// Add updateExpression function before animateWriting
const updateExpression = (letter, setModelExpression) => {
  if (letter === '?') {
    setModelExpression('questioning');
  } else if (letter === '!') {
    setModelExpression('emphasizing');
  } else if (letter === '.') {
    setModelExpression('thinking');
  } else if (Math.random() < 0.3) {
    const expressions = ['explaining', 'reading', 'encouraging', 'emphasizing', 'listening'];
    const randomExpression = expressions[Math.floor(Math.random() * expressions.length)];
    setModelExpression(randomExpression);
  }
};

// Update the Model function
function Model({ expression = 'neutral' }) {
  const { scene } = useGLTF('/stylish.glb');
  const [headRotation, setHeadRotation] = useState([0, 0, 0]);
  const currentWeights = useRef(expressions.neutral);
  const frameRef = useRef(0);
  const velocityRef = useRef([0, 0, 0]);
  
  useEffect(() => {
    let animationFrame;
    const targetWeights = expressions[expression] || expressions.neutral;
    
    const updateMorphTargets = () => {
      const blinkAmount = createBlinkAnimation();
      const now = Date.now() * 0.001; // Current time in seconds
      
      scene.traverse((obj) => {
        if (obj.morphTargetDictionary) {
          // Calculate reading-specific lip and eye movements
          const readingLipMove = expression.includes('reading') 
            ? (Math.sin(now * 2.5) * 0.08 + Math.sin(now * 1.5) * 0.04) // More natural lip movement
            : 0;
          
          const readingEyeSquint = expression.includes('reading')
            ? 0.15 + Math.sin(now * 0.7) * 0.05 // Slower eye movement
            : 0;

          // Combine expressions with natural movements
          const combinedWeights = targetWeights.map((weight, index) => {
            if (index === 4) {
              return Math.max(weight, blinkAmount);
            } else if (index === 0 || index === 1) {
              return weight + readingLipMove;
            } else if (index === 3) {
              return weight + readingEyeSquint;
            }
            return weight;
          });

          // Smooth transition
          currentWeights.current = currentWeights.current.map((weight, index) => {
            const transitionSpeed = index === 4 ? 0.7 :
                                  index === 0 || index === 1 ? 0.1 :
                                  0.05;
            return lerp(weight, combinedWeights[index], transitionSpeed);
          });
          
          // Apply weights
          currentWeights.current.forEach((weight, index) => {
            if (obj.morphTargetInfluences && obj.morphTargetInfluences[index] !== undefined) {
              obj.morphTargetInfluences[index] = weight;
            }
          });
        }
      });

      // Handle head movement based on expression
      if (expression.includes('reading')) {
        const time = now * 0.001;
        // More natural reading head movements
        const targetRotation = [
          Math.sin(time * 0.7) * 0.02 + Math.sin(time * 0.3) * 0.01, // Subtle nod
          Math.sin(time * 0.5) * 0.025 + Math.cos(time * 0.2) * 0.015, // Gentle side-to-side
          Math.sin(time * 0.4) * 0.015 // Slight tilt
        ];

        // Add occasional focused movement
        if (Math.sin(time * 0.1) > 0.8) {
          targetRotation[0] += Math.sin(time * 2) * 0.01; // Quick focus adjustment
        }

        const newRotation = headRotation.map((rot, i) => {
          const [newPos, newVel] = spring(
            targetRotation[i],
            rot,
            velocityRef.current[i],
            0.06, // Lower stiffness for smoother movement
            0.88  // Higher damping for more controlled motion
          );
          velocityRef.current[i] = newVel;
          return newPos;
        });

        setHeadRotation(newRotation);
      } else if (expression === 'speaking') {
        const time = now * 0.001;
        const targetRotation = [
          Math.sin(time * 0.8) * 0.02,
          Math.sin(time * 0.5) * 0.03,
          Math.cos(time * 0.6) * 0.015
        ];

        const newRotation = headRotation.map((rot, i) => {
          const [newPos, newVel] = spring(
            targetRotation[i],
            rot,
            velocityRef.current[i],
            0.1,
            0.9
          );
          velocityRef.current[i] = newVel;
          return newPos;
        });

        setHeadRotation(newRotation);
      } else {
        const newRotation = headRotation.map((rot, i) => {
          const [newPos, newVel] = spring(0, rot, velocityRef.current[i], 0.06, 0.95);
          velocityRef.current[i] = newVel;
          return newPos;
        });
        setHeadRotation(newRotation);
      }

      frameRef.current = requestAnimationFrame(updateMorphTargets);
    };

    updateMorphTargets();
    return () => {
      cancelAnimationFrame(frameRef.current);
    };
  }, [expression, scene, headRotation]);

  return <primitive 
    object={scene} 
    scale={1.4}
    position={[0, -0.8, 0]}
    rotation={headRotation}
  />;
}

// Add this helper function after the component declarations
const scrollToBottom = (containerRef, smooth = false, metrics = {}) => {
  const { lineCount, paragraphCount, wordCount } = metrics;
  
  if (containerRef.current) {
    const scrollContainer = containerRef.current;
    const lineHeight = 60; // Match the line height used in animateWriting
    
    // Calculate scroll position considering paragraphs
    let scrollAmount = (lineCount * lineHeight);
    
    // Add extra space for paragraph breaks
    if (paragraphCount > 1) {
      scrollAmount += ((paragraphCount - 1) * lineHeight);
    }
    
    // Only scroll after certain amount of content
    if (lineCount > 5 || paragraphCount > 1 || wordCount > 15) {
      scrollContainer.scrollTo({
        top: scrollAmount - (scrollContainer.clientHeight / 2), // Keep middle of content visible
        behavior: smooth ? 'smooth' : 'auto'
      });
    }
  }
};

const ChatInterface = () => {
  const [message, setMessage] = useState('');
  const [messages, setMessages] = useState([]);
  const svgContainerRef = useRef(null);
  const handRef = useRef(null);
  const [draw, setDraw] = useState(null);
  const [boxSize, setBoxSize] = useState({ width: CANVAS_WIDTH, height: CANVAS_HEIGHT });
  const [isWriting, setIsWriting] = useState(false); // Add this new state
  const [isPreparing, setIsPreparing] = useState(false); // Add this new state
  const [isSpeaking, setIsSpeaking] = useState(false);
  const speechSynthesisRef = useRef(null);
  const [speechRate, setSpeechRate] = useState(0.8); // Changed from 1 to 0.8
  const animationController = useRef(new AnimationController());
  const [modelExpression, setModelExpression] = useState('neutral'); // Add this with other state declarations

  // Add window dimensions state
  const [windowDimensions, setWindowDimensions] = useState({
    width: window.innerWidth,
    height: window.innerHeight
  });

  const visualizerRef = useRef(null); // Add this ref

  // Add these new states with other state declarations
  const [isListening, setIsListening] = useState(false);
  const [recognition, setRecognition] = useState(null);
  
  // Add this useEffect after other useEffects
  useEffect(() => {
    if ('webkitSpeechRecognition' in window) {
      const recognition = new window.webkitSpeechRecognition();
      recognition.continuous = true;
      recognition.interimResults = true;
      
      recognition.onresult = (event) => {
        const transcript = Array.from(event.results)
          .map(result => result[0])
          .map(result => result.transcript)
          .join('');
        
        setMessage(transcript);
      };

      recognition.onerror = (event) => {
        console.error('Speech recognition error:', event.error);
        setIsListening(false);
      };

      recognition.onend = () => {
        setIsListening(false);
      };

      setRecognition(recognition);
    }
  }, []);

  // Add this new function with other handler functions
  const toggleListening = () => {
    if (!recognition) return;

    if (isListening) {
      recognition.stop();
      setIsListening(false);
    } else {
      setMessage('');
      recognition.start();
      setIsListening(true);
    }
  };

  useEffect(() => {
    if (svgContainerRef.current) {
      const container = svgContainerRef.current;
      const svgDraw = SVG().addTo(container).size('100%', '100%');
      setDraw(svgDraw);
      svgDraw.rect('100%', '100%').fill('black');
      
      // Update font to chawp
      const style = document.createElement('style');
      style.textContent = `
        @font-face {
          font-family: 'chawp';
          src: url('/fonts/chawp.ttf') format('truetype');
          font-weight: normal;
          font-style: normal;
        }
      `;
      document.head.appendChild(style);
    }
  }, []);

  const updateBoxSize = (text) => {
    const words = text.split(' ');
    const fontSize = 36; // Match the font size used in animateWriting
    const lineHeight = 60; // Match the line height from animateWriting
    const maxWidth = CANVAS_WIDTH - 80; // Increased padding
    const minPadding = 60; // Minimum padding top and bottom
    
    let currentLineWidth = 0;
    let lines = 1;
    
    words.forEach(word => {
      // More accurate word width calculation including spacing
      const wordWidth = (word.length * fontSize * 0.6) + 20; // Adjusted multiplier and spacing
      
      if (currentLineWidth + wordWidth > maxWidth) {
        currentLineWidth = wordWidth;
        lines++;
      } else {
        currentLineWidth += wordWidth;
      }
    });

    // Calculate height with extra padding for long content
    const contentHeight = (lines * lineHeight) + (minPadding * 2);
    const extraPadding = Math.max(0, Math.floor(lines / 10) * 40); // Add extra padding for longer content
    const newHeight = Math.max(CANVAS_HEIGHT, contentHeight + extraPadding);
    
    setBoxSize({ width: CANVAS_WIDTH, height: newHeight });

    // Update SVG canvas size
    if (draw) {
      draw.size(CANVAS_WIDTH, newHeight);
      draw.clear();
      draw.rect(CANVAS_WIDTH, newHeight).fill('black'); // Change to black background
    }
  };

  // Update animateWriting function to avoid unsafe loop references
const animateWriting = async (text, draw, handRef, onAnimationStart) => {
  animationController.current.start();
  onAnimationStart && onAnimationStart();
  
  const letters = text.split('');
  let currentLetterIndex = 0;
  let xPos = 40;
  let yPos = 60;
  const lineHeight = 60;
  const fontSize = '36px chawp';
  const maxWidth = CANVAS_WIDTH - 80; // Match with updateBoxSize maxWidth
  
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');
  ctx.font = fontSize;

  // Initialize doodle group
  const doodleGroup = draw.group();

  // Show hand at starting position
  if (handRef.current) {
      handRef.current.style.display = 'block';
      handRef.current.style.left = `${xPos - 20}px`;
      handRef.current.style.top = `${yPos - 40}px`;
      scrollToBottom(visualizerRef);
  }

  // Create text with doodle effect
  const createTextWithDoodle = (letter, x, y, opacity) => {
      // Create the main text
      const text = draw.text(letter)
          .font({
              family: 'chawp',
              size: 36,
              weight: 'normal'
          })
          .fill('white')
          .stroke({ color: 'white', width: 0.5 })
          .move(x, y)
          .opacity(opacity);

      // Add decorative doodles around the text
      if (Math.random() < 0.3 && letter !== ' ') {  // 30% chance for doodles
          const doodlePoints = animationController.current.createDoodlePath(
              x - 2, y + Math.random() * 10,
              x + ctx.measureText(letter).width + 2, y + Math.random() * 10
          );
          
          const doodlePath = draw.polyline(doodlePoints)
              .fill('none')
              .stroke(animationController.current.createDoodleStyle());

          // Animate the doodle
          doodlePath.animate(150).opacity(0.3);
          doodleGroup.add(doodlePath);
      }

      return text;
  };

  // Add initial decorative elements
  const addDecorations = () => {
      // Add random squiggles
      for (let i = 0; i < 3; i++) {
          const startX = Math.random() * CANVAS_WIDTH;
          const startY = Math.random() * CANVAS_HEIGHT;
          const doodlePoints = animationController.current.createDoodlePath(
              startX, startY,
              startX + Math.random() * 50, startY + Math.random() * 50
          );
          
          const doodle = draw.polyline(doodlePoints)
              .fill('none')
              .stroke({ color: 'white', width: 0.5, opacity: 0.1 });
          
          doodleGroup.add(doodle);
      }
  };

  addDecorations();

  // Define expressionInterval here, before using it
  const expressionInterval = setInterval(() => {
    if (animationController.current.isActive() && currentLetterIndex < letters.length) {
      updateExpression(letters[currentLetterIndex], setModelExpression);
    }
  }, 500);
  animationController.current.addTimeout(expressionInterval);

  let lineCount = 1; // Add line counter
  let paragraphCount = 1;
  let wordCount = 0;
  let lastCharWasNewline = false;

  // Main animation loop
  for (let i = 0; i < letters.length; i++) {
      currentLetterIndex = i; // Update the current letter index
      // Check if animation should stop
      if (!animationController.current.isActive()) {
        break;
      }

      const currentX = xPos;
      const currentY = yPos;
      await new Promise(resolve => {
          const timeout = setTimeout(() => {
            // Only create text if animation is still active
            if (animationController.current.isActive()) {
              const letter = letters[i];
              
              // Calculate actual width of the character
              const charWidth = ctx.measureText(letter).width;
              
              // More precise line wrapping
              if (letter === '\n' || xPos > CANVAS_WIDTH - 60) {
                  xPos = 20;
                  yPos += lineHeight;
                  lineCount++; // Increment line counter
                  // Pass line count to scroll function
                  scrollToBottom(visualizerRef, true, {
                    lineCount,
                    paragraphCount,
                    wordCount
                  });
              }

              // Animate hand with natural movement
              if (handRef.current) {
                  const randomAngle = 0 + Math.sin(i * 0.1) * 5 + (Math.random() - 0.5) * 3;
                  handRef.current.style.left = `${currentX - 20}px`;
                  handRef.current.style.top = `${currentY - 20}px`;
                  handRef.current.style.transform = `rotate(${randomAngle}deg)`;
              }

              // Create ghost text (preview)
              const ghost = createTextWithDoodle(letter, currentX, currentY, 0);
              ghost.animate(20).opacity(0.3); // Reduced from 50 to 20

              // Create main text with slight delay
              const text = createTextWithDoodle(letter, currentX, currentY, 0);
              text.animate(50).opacity(1); // Reduced from 100 to 50

              // Add slight random variations to position for natural look
              xPos += charWidth + (Math.random() * 2 - 1);
            }
            resolve();
          }, 75); // Reduced from 25 to 8 - Much faster writing speed
          animationController.current.addTimeout(timeout);
      });

      // Break the loop if animation was stopped
      if (!animationController.current.isActive()) {
        break;
      }

      // Add scroll behavior during writing
      // (remove or comment out the following if block)
      /*
      if (i % 20 === 0) {
        scrollToBottom(visualizerRef);
      }
      */
  }

  // Hide hand after animation
  if (handRef.current) {
      handRef.current.style.display = 'none';
  }

  // Cleanup
  if (expressionInterval) {
    clearInterval(expressionInterval);
  }
  setModelExpression('neutral');
};

  // Add function to stop speaking
  const stopSpeaking = () => {
    if (window.speechSynthesis.speaking) {
      window.speechSynthesis.cancel();
    }
    setIsSpeaking(false);
  };

  // Add this new function to reset visualizer
const resetVisualizer = (draw, containerRef) => {
  if (draw) {
    draw.clear();
    draw.size(CANVAS_WIDTH, CANVAS_HEIGHT);
    draw.rect(CANVAS_WIDTH, CANVAS_HEIGHT).fill('black');
  }
  if (containerRef.current) {
    containerRef.current.scrollTo({
      top: 0,
      behavior: 'instant'
    });
  }
};

// Update handleSubmit to reset first
const handleSubmit = async (e) => {
  e.preventDefault();
  if (!message.trim() || isWriting) return;

  // Stop mic if it's still on
  if (isListening) {
    recognition.stop();
    setIsListening(false);
  }

  stopSpeaking();
  setIsWriting(true);
  setIsPreparing(true);
  
  // Reset visualizer to initial state
  resetVisualizer(draw, visualizerRef);
  setBoxSize({ width: CANVAS_WIDTH, height: CANVAS_HEIGHT });
  
  const userMessage = { text: message, type: "user" };
  setMessages([userMessage]);

  try {
    const response = await fetch('http://localhost:8080/api/gemini/chat', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify({ message }),
        credentials: 'include',
        mode: 'cors'
    });

    if (!response.ok) throw new Error('Network response was not ok');
    const data = await response.json();

    if (draw) {
        draw.clear();
        draw.rect(CANVAS_WIDTH, CANVAS_HEIGHT).fill('black'); // Change to black
    }

    updateBoxSize(data.response);
    
    // Add small delay after scroll before starting animation
    await new Promise(resolve => setTimeout(resolve, 500));
    
    setIsPreparing(false); // Hide loader before starting animation

    if (draw) {
        if (handRef.current) {
            handRef.current.style.display = 'block';
        }
        // Start reading when animation begins
        await animateWriting(data.response, draw, handRef, () => {
          const utterance = new SpeechSynthesisUtterance(data.response);
          utterance.rate = speechRate;
          utterance.pitch = 1;
          utterance.onend = () => setIsSpeaking(false);
          window.speechSynthesis.speak(utterance);
          setIsSpeaking(true);
        });
        if (handRef.current) {
            handRef.current.style.display = 'none';
        }
    }

    const assistantMessage = { text: data.response, type: "assistant" };
    setMessages([userMessage, assistantMessage]);
  } catch (error) {
    console.error('Error:', error);
    const errorMessage = { text: "Sorry, I couldn't process your request.", type: "assistant" };
    setMessages([userMessage, errorMessage]);
    setIsPreparing(false); // Hide loader on error
  } finally {
    setIsWriting(false);
    setMessage('');
  }
};

  // Add this component inside ChatInterface
  const LoadingOverlay = () => (
    <Box
      sx={{
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: 'rgba(0, 0, 0, 0.7)',
        zIndex: 10,
      }}
    >
      <CircularProgress sx={{ color: 'white', mb: 2 }} />
      <Typography variant="h6" sx={{ color: 'white' }}>
        Preparing notes...
      </Typography>
    </Box>
  );

  // Update this function to handle new speed options
  const handleSpeedToggle = () => {
    const speeds = [0.4, 0.5, 0.6, 0.7, 0.8];  // 0.8 matches initial state
    const currentIndex = speeds.indexOf(speechRate);
    const nextIndex = (currentIndex + 1) % speeds.length;
    setSpeechRate(speeds[nextIndex]);
  };

  // Update handleSpeak function
  const handleSpeak = () => {
    if (isSpeaking) {
      stopSpeaking();
      setModelExpression('neutral');
      return;
    }  // Added missing closing brace

    // Get the last assistant message
    const lastAssistantMessage = messages.find(msg => msg.type === "assistant");
    if (!lastAssistantMessage) return;

    const utterance = new SpeechSynthesisUtterance(lastAssistantMessage.text);
    utterance.rate = speechRate; // Use the speech rate from state
    utterance.pitch = 1;
    
    // Add error handling
    utterance.onerror = () => {
      console.error('Speech synthesis error');
      stopSpeaking();
      setModelExpression('neutral');
    };

    // Add expression changes on speech boundaries
    utterance.onboundary = (event) => {
      const randomValue = Math.random();
      
      // More natural speaking patterns
      if (event.charIndex % 4 === 0) {  // Every few characters
        if (randomValue < 0.3) {
          setModelExpression('explaining');
        } else if (randomValue < 0.5) {
          setModelExpression('emphasizing');
        } else if (randomValue < 0.7) {
          setModelExpression('encouraging');
        } else if (randomValue < 0.9) {
          setModelExpression('questioning');
        } else {
          setModelExpression('listening');
        }
      }
    };

    utterance.onend = () => {
      setIsSpeaking(false);
      setModelExpression('neutral');
    };
    
    speechSynthesisRef.current = utterance;
    window.speechSynthesis.speak(utterance);
    setIsSpeaking(true);
  };

  // Update cleanup effect
  useEffect(() => {
    // Cleanup function for component unmount and page refresh
    const handleBeforeUnload = () => {
      stopSpeaking();
    };

    window.addEventListener('beforeunload', handleBeforeUnload);

    return () => {
      stopSpeaking();
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, []);

  // Update window resize handler
  useEffect(() => {
    const handleResize = () => {
      const width = window.innerWidth;
      const height = window.innerHeight;
      setWindowDimensions({ width, height });
      
      const dimensions = getCanvasDimensions(width, height);
      setBoxSize(dimensions);
      
      if (draw) {
        draw.size(dimensions.width, dimensions.height);
        draw.clear();
        draw.rect(dimensions.width, dimensions.height).fill('black');
      }
    };

    window.addEventListener('resize', handleResize);
    handleResize(); // Initial call
    return () => window.removeEventListener('resize', handleResize);
  }, [draw]);

  useEffect(() => {
    const controller = animationController.current;
    return () => {
        controller.stop();
    };
}, []);

  // Add this new keyboard handler
  useEffect(() => {
    const handleKeyDown = (e) => {
      // Space key toggles mic
      if (e.code === 'Space' && e.target.tagName !== 'TEXTAREA') {
        e.preventDefault(); // Prevent space from scrolling
        if (recognition) {
          toggleListening();
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [recognition, toggleListening]);

  // Update handleKeyPress to properly handle Enter and mic state
  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      
      // If there's no message and mic is off, don't do anything
      if (!message.trim() && !isListening) return;

      // If mic is on, stop it and submit whatever was transcribed
      if (isListening) {
        recognition.stop();
        setIsListening(false);
      }
      
      // Small delay to ensure final transcript is captured
      setTimeout(() => {
        handleSubmit(e);
      }, 100);
    }
  };

  // Add this new function to handle stopping everything
  const handleStop = () => {
    // Stop the animation
    animationController.current.stop();
    
    // Stop the speech
    stopSpeaking();
    
    // Reset states
    setIsWriting(false);
    setIsPreparing(false);
    
    // Hide the hand
    if (handRef.current) {
      handRef.current.style.display = 'none';
    }
  };

  return (
    <Box sx={{ 
      display: 'flex', 
      height: '100vh',
      overflow: 'hidden',
      bgcolor: 'background.default' 
    }}>
      {/* Sidebar */}
      <Paper
        elevation={1}
        sx={{
          width: 280,
          display: 'flex',
          flexDirection: 'column',
          borderRadius: 0,
        }}
      >
        {/* 3D Model Section */}
        <Box sx={{ 
          p: 3, 
          textAlign: 'center',
          height: 300,  // Fixed height for 3D viewer
          width: '90%',
          position: 'relative' // Add this
        }}>
          <Canvas
            camera={{ 
              position: [0, 11, 2.5], // Adjusted z from 3 to 2.5 to zoom in
              fov: 5, // Reduced from 6 to 5 for closer view
              near: 0.1,
              far: 1000
            }}
            style={{ 
              background: '#f5f5f5',
              borderRadius: '8px',
              height: '100%',
              width: '100%'
            }}
          >
            <ambientLight intensity={1} /> {/* Increased light intensity */}
            <directionalLight position={[0, 3, 3]} intensity={1} /> {/* Moved light up */}
            <Model expression={modelExpression} /> {/* Update the return JSX to pass expression to Model */}
            <OrbitControls 
              enableZoom={false}
              enablePan={false}
              minPolarAngle={Math.PI/2.2} // Adjusted vertical rotation limit
              maxPolarAngle={Math.PI/1.8}
              minAzimuthAngle={-Math.PI/4} // Limit horizontal rotation
              maxAzimuthAngle={Math.PI/4}
              rotateSpeed={false}
            />
          </Canvas>
        </Box>

        {/* Action Buttons */}
        {/* <List sx={{ flex: 1, px: 2 }}>
          <ListItem disablePadding>
            <SidebarButton
              startIcon={<AddIcon />}
              sx={{ color: 'primary.main' }}
            >
              Start new chat
            </SidebarButton>
          </ListItem>
          <ListItem disablePadding>
            <SidebarButton startIcon={<ShareIcon />}>
              Share your chat
            </SidebarButton>
          </ListItem>
          <ListItem disablePadding>
            <SidebarButton startIcon={<PersonIcon />}>
              Change Avatar
            </SidebarButton>
          </ListItem>
        </List> */}

        {/* Logout Button */}
        {/* <Divider /> */}
        {/* <Box sx={{ p: 2 }}>
          <SidebarButton startIcon={<LogoutIcon />}>
            Logout
          </SidebarButton>
        </Box> */}
      </Paper>

      {/* Main Chat Area */}
      <Box sx={{ 
        flex: 1,
        height: '100vh',
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
        // backgroundColor: 'green'
      }}>
        {/* Visualization Box */}
        <Box 
          ref={visualizerRef}
          sx={{
            ...visualizationBoxStyle,
            overflowY: 'auto',
            scrollBehavior: 'smooth'
          }}
        >
          <Paper 
            elevation={3}
            sx={{ 
              width: '100%', // Match parent width
              height: 'auto',
              minHeight: boxSize.height,
              margin: '0 auto',
              position: 'relative',
              backgroundColor: 'black', // Change to black background
              transition: 'all 0.3s ease',
              overflow: 'hidden',
              // border: { 
              //   xs: '20px solid', 
              //   sm: '25px solid',
              //   md: '30px solid' 
              // },
              // borderColor: '#966F33',
              // borderStyle: 'solid',
              // boxShadow: `
              //   0 0 0 6px #7C4A03,
              //   inset 0 0 0 6px #7C4A03
              // `,
              // borderRadius: '12px',
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center'
            }}
          >
            {isPreparing && <LoadingOverlay />} {/* Add loader here */}
            <svg 
              ref={svgContainerRef} 
              width="100%"
              height="100%"
              style={{ 
                position: 'absolute', 
                top: 0, 
                left: 0,
                transition: 'all 0.3s ease' 
              }}
            />
            <img 
              ref={handRef}
              src="/download.jpeg"
              alt="Writing hand"
              style={{
                position: 'absolute',
                width: '80px',
                height: 'auto',
                transform: 'rotate(-45deg)',
                pointerEvents: 'none',
                display: 'none'
              }}
            />
          </Paper>
        </Box>

        {/* Messages */}
        {/* <Box sx={{ flex: 1, p: 3, overflowY: 'auto' }}>
          {messages.map((msg, index) => (
            <MessageBubble 
              key={index}
              variant={msg.type === "user" ? "user" : undefined} 
              elevation={1} 
              sx={{ mb: 2 }}
            >
              <Typography>{msg.text}</Typography>
            </MessageBubble>
          ))}
        </Box> */}

        {/* Message Input */}
        <Paper 
          component="form" 
          onSubmit={handleSubmit}
          elevation={2}
          sx={{ 
            p: { xs: 1, sm: 2 },
            borderTop: 1, 
            borderColor: 'divider',
            backgroundColor: 'background.paper',
            position: 'sticky',
            bottom: 0,
            zIndex: 1
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <TextField
              fullWidth
              variant="outlined"
              placeholder={`${isListening ? 'Listening... Press Enter to send' : 'Type or press Space for voice input'}`}
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              onKeyPress={handleKeyPress}
              multiline
              minRows={1}
              maxRows={10}
              size="small"
              sx={{
                '& .MuiOutlinedInput-root': {
                  padding: '8px 14px',
                },
                '& .MuiInputBase-input': {
                  maxHeight: '120px', // Maximum height before scrolling
                  overflowY: 'auto',
                  lineHeight: 1.5,
                  fontSize: '0.875rem',
                }
              }}
            />
            <IconButton 
              color="default" 
              onClick={handleStop}
              disabled={!isWriting && !isSpeaking}
              sx={{
                color: 'error.main',
                '&.Mui-disabled': {
                  color: 'grey.500'
                }
              }}
            >
              <StopIcon />
            </IconButton>
            <IconButton
              color="default"
              onClick={toggleListening}
              disabled={!recognition}
              sx={{
                color: isListening ? 'error.main' : 'default',
                animation: isListening ? 'pulse 1.5s infinite' : 'none',
                '@keyframes pulse': {
                  '0%': { transform: 'scale(1)' },
                  '50%': { transform: 'scale(1.1)' },
                  '100%': { transform: 'scale(1)' }
                }
              }}
            >
              {isListening ? <MicIcon /> : <MicOffIcon />}
            </IconButton>
            <Box sx={{ position: 'relative' }}>
              <IconButton 
                color="default" 
                onClick={handleSpeedToggle}
                sx={{
                  color: 'primary.main',
                  '&:hover': {
                    backgroundColor: 'rgba(25, 118, 210, 0.04)'
                  }
                }}
              >
                <SpeedIcon />
                <SpeedIndicator>
                  {speechRate}
                </SpeedIndicator>
              </IconButton>
            </Box>
            <IconButton 
              color="default" 
              onClick={handleSpeak}
              // disabled={!messages.some(msg => msg.type === "assistant")}
              sx={{
                color: isSpeaking ? 'primary.main' : 'default',
              }}
            >
              {isSpeaking ? <VolumeUpIcon /> : <VolumeOffIcon />}
            </IconButton>
            <IconButton 
              type="submit" 
              color="primary"
              disabled={isWriting} // Disable button while writing
              sx={{ 
                bgcolor: isWriting ? 'grey.500' : 'primary.main', 
                color: 'white', 
                '&:hover': { 
                  bgcolor: isWriting ? 'grey.600' : 'primary.dark' 
                } 
              }}
            >
              <SendIcon />
            </IconButton>
          </Box>
        </Paper>
      </Box>
    </Box>
  );
};

export default ChatInterface;