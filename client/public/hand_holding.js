const playButton = document.getElementById('playButton');
const continueButton = document.getElementById('continueButton');
const hand = document.getElementById('hand');
const svgContainer = document.getElementById('svgCanvas');

const CANVAS_WIDTH = 780;
const CANVAS_HEIGHT = 380;

const canvas = document.getElementById('svgCanvas');
const draw = SVG().addTo(canvas).size(CANVAS_WIDTH, CANVAS_HEIGHT);

let pathSegments = [];
let currentSegmentIndex = 0;
let currentPathNode, currentPathLength;
let animationFrameId;
let finalData = []; // Full text data as an array of letters
let currentIndex = 0; // Tracks the current starting letter index
let lineHeight = 40; // Line height for wrapping
let xOffset = 0; // Horizontal position
let yOffset = 0; // Vertical position

// Fetch data from server
const getData = async () => {
    const response = await fetch('http://localhost:3000/generate-and-visualize');
    const data = await response.json();
    finalData = data.text.split(''); // Split text into letters
};

// Helper function to find the last space within the slice limit
function findLastSpaceIndex(limitIndex) {
    let spaceIndex = limitIndex;
    // Look backwards for the nearest space character
    while (spaceIndex > 0 && finalData[spaceIndex] !== ' ') {
        spaceIndex--;
    }
    return spaceIndex;
}

// Generate SVG paths starting from a specific index
async function generateSVGPathFromIndex(startIndex) {
    try {
        // Clear the canvas
        draw.clear();
        resetBackground();

        // Calculate the end index based on a 250-character limit, ensuring words are not split
        let endIndex = startIndex + 300;
        if (endIndex >= finalData.length) {
            endIndex = finalData.length; // If there are fewer than 250 characters remaining, take the rest
        } else {
            // Find the nearest space before the limit
            endIndex = findLastSpaceIndex(endIndex);
        }

        const textInput = finalData.slice(startIndex, endIndex).join(''); // Slice text for the current animation
        if (textInput.trim() === '') {
            console.log('No more content to animate.');
            return;
        }

        console.log('Generating SVG path for:', textInput);

        const response = await fetch(`http://localhost:3000/generate-path?text=${encodeURIComponent(textInput)}`);
        const data = await response.json();

        if (Array.isArray(data) && data.length > 0) {
            // Clear any old pathSegments to avoid overlap
            pathSegments = []; // Clear existing path segments

            data.forEach((item) => {
                if (item.svgLetters && Array.isArray(item.svgLetters)) {
                    item.svgLetters.forEach((letterPathData) => {
                        const letterPath = draw.path(letterPathData)
                            .stroke({ width: 2, color: 'white', linecap: 'round', linejoin: 'round' })
                            .fill('none')
                            .opacity(0); // Initially hidden

                        pathSegments.push({
                            path: letterPath,
                            pathLength: letterPath.node.getTotalLength(),
                        });
                    });
                }
            });
            startAnimation(); // Begin letter-by-letter animation
        } else {
            console.log('No data received for the next segment.');
        }
    } catch (error) {
        console.error('Error fetching path data:', error);
    }
}

// Start animating paths
function startAnimation() {
    playButton.disabled = true;
    continueButton.style.display = 'none';

    if (pathSegments.length === 0) return;

    currentSegmentIndex = 0;
    currentPathNode = pathSegments[currentSegmentIndex].path.node;
    currentPathLength = pathSegments[currentSegmentIndex].pathLength;

    hand.style.display = 'block';
    animatePathSegment(0); // Start from the first letter
}

// Animate each path segment (letter)
function animatePathSegment(progress) {
    const speed = 15; // Slower speed for more natural writing

    const point = currentPathNode.getPointAtLength(progress);
    xOffset = point.x;
    yOffset = point.y;

    if (progress <= currentPathLength && xOffset <= CANVAS_WIDTH && yOffset <= CANVAS_HEIGHT) {
        // Adjust hand position to align with text
        hand.style.left = `${xOffset - 20}px`;
        hand.style.top = `${yOffset - 40}px`;
        
        // Add slight rotation variation for more natural movement
        const rotationAngle = -45 + Math.sin(progress * 0.1) * 5;
        hand.style.transform = `rotate(${rotationAngle}deg)`;

        pathSegments[currentSegmentIndex].path.opacity(1);
        pathSegments[currentSegmentIndex].path.stroke({ 
            dasharray: `${progress} ${currentPathLength}`,
            width: 2,
            color: 'white',
            linecap: 'round',
            linejoin: 'round'
        });

        animationFrameId = requestAnimationFrame(() => animatePathSegment(progress + speed));
    } else {
        currentSegmentIndex++;
        if (currentSegmentIndex < pathSegments.length) {
            currentPathNode = pathSegments[currentSegmentIndex].path.node;
            currentPathLength = pathSegments[currentSegmentIndex].pathLength;
            animatePathSegment(0); // Move to the next letter
        } else {
            // Show "Continue" button if animation reaches the end
            if (currentIndex < finalData.length) {
                stopAnimation();
                continueButton.style.display = 'block';
            } else {
                console.log('All text animated.');
            }
        }
    }
}

// Stop the animation
function stopAnimation() {
    hand.style.display = 'none';
    if (animationFrameId) {
        cancelAnimationFrame(animationFrameId);
    }
}

// Reset the canvas background
function resetBackground() {
    draw.rect(CANVAS_WIDTH, CANVAS_HEIGHT).fill('black').attr({ id: 'svgCanvas' });
}

// Continue button logic
continueButton.addEventListener('click', async () => {
    stopAnimation(); // Ensure the animation is stopped cleanly
    resetBackground();

    // Hide the "Continue" button while generating the next animation
    continueButton.style.display = 'none';

    // Update currentIndex and generate the next segment
    currentIndex = findLastSpaceIndex(currentIndex + 300);
    await generateSVGPathFromIndex(currentIndex);
});

// Play button logic
playButton.addEventListener('click', async () => {
    await getData();
    currentIndex = 0; // Reset to the start
    generateSVGPathFromIndex(currentIndex);
});