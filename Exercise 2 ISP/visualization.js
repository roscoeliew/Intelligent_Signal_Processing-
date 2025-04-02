let audioFile;
let audioFeatures;
let analyzer;
let selectedFile;
let shape = "circle"; // Default shape
let bgColor = [30, 30, 30]; // Default background color

// Define the prominent features for each audio file
const prominentFeaturesMap = {
  "sounds/Ex2_sound1.wav": ["perceptualSpread", "energy","spectralCentroid" ],
  "sounds/Ex2_sound2.wav": ["spectralKurtosis", "spectralRolloff", "spectralCentroid"],
  "sounds/Ex2_sound3.wav": ["spectralCentroid", "spectralRolloff",  "spectralSpread"],
  "sounds/Kalte_Ohren_(_Remix_).mp3": ["spectralCrest", "perceptualSharpness", "spectralSpread"],
};

function preload() {
  // Preload the three audio files
  sound1 = loadSound("sounds/Ex2_sound1.wav");
  sound2 = loadSound("sounds/Ex2_sound2.wav");
  sound3 = loadSound("sounds/Ex2_sound3.wav");
  sound4 = loadSound("sounds/Kalte_Ohren_(_Remix_).mp3");
}

function setup() {
  createCanvas(800, 400);

  // Attach event listeners to buttons
  select("#loadSound1").mousePressed(() => loadAudioFile("sounds/Ex2_sound1.wav", sound1));
  select("#loadSound2").mousePressed(() => loadAudioFile("sounds/Ex2_sound2.wav", sound2));
  select("#loadSound3").mousePressed(() => loadAudioFile("sounds/Ex2_sound3.wav", sound3));
  select("#kalteohren").mousePressed(() => loadAudioFile("sounds/Kalte_Ohren_(_Remix_).mp3", sound4));
  select("#startVisualization").mousePressed(startVisualization);

  // Initialize speech recognition
  speechRec = new p5.SpeechRec("en-US", handleSpeech);
  speechRec.onEnd = () => {
    console.log("Speech recognition stopped. Restarting...");
    speechRec.start(true, true); // Restart in continuous mode
  };

  speechRec.start(true, true);

  noLoop(); // Visualization will run only when triggered
}

function handleSpeech() {
  const command = speechRec.resultString.toLowerCase();
  console.log("Voice Command:", command);

  // Change background color
  const colorMap = {
    black: [0, 0, 0],
    white: [255, 255, 255],
    red: [255, 0, 0],
    blue: [0, 0, 255],
    green: [0, 255, 0],
  };

  if (colorMap[command]) {
    bgColor = colorMap[command];
  }

  // Change shape
  const shapes = ["circle", "square", "triangle", "pentagon"];
  if (shapes.includes(command)) {
    shape = command;
  }
}

function loadAudioFile(filePath, sound) {
  if (audioFile) {
    audioFile.stop(); // Stop any currently playing audio
  }
  if (analyzer) {
    analyzer.stop(); // Stop the analyzer
    analyzer = null; // Reset analyzer
  }
  audioFile = sound;
  selectedFile = filePath;  // Set selected file
  audioFeatures = null; // Reset audio features
  background(30); // Clear the canvas
  console.log("Audio file loaded: " + filePath);
}

function startVisualization() {
  if (!audioFile) {
    console.error("No audio file loaded!");
    return;
  }

  audioFile.play();

  // Get the prominent features for the selected file
  const featureExtractors = prominentFeaturesMap[selectedFile];

  // Initialize Meyda Analyzer with dynamic featureExtractors based on selected file
  analyzer = Meyda.createMeydaAnalyzer({
    audioContext: getAudioContext(),
    source: audioFile,
    bufferSize: 512,
    featureExtractors: featureExtractors, // Use only the relevant features for this file
    callback: (features) => {
      audioFeatures = features;
      redraw(); // Trigger visualization
    },
  });

  analyzer.start();
 
}


function draw() {
  background(bgColor); 

  if (!audioFeatures || !selectedFile) {
    fill(255);
    textAlign(CENTER, CENTER);
    text("Loading audio features...", width / 2, height / 2);
    return;
  }

  // Get prominent features for the selected file
  const prominentFeatures = prominentFeaturesMap[selectedFile];

  if (!prominentFeatures) {
    console.error("No prominent features found for the current file.");
    return;
  }

  // Normalize feature values based on their respective ranges
  const featureRanges = {
    spectralCentroid: [0, 256],
    spectralRolloff: [0, 22050],
    spectralSpread: [0, 256],
    energy: [0, 512],
    perceptualSpread: [0, 1],
    spectralKurtosis: [-100,400],
    perceptualSharpness: [0, 1],
    spectralCrest: [0, 20],
  };

  const normalizedFeatures = prominentFeatures.map((feature) => {
    const [min, max] = featureRanges[feature] || [0, 1];
    return map(audioFeatures[feature] || 0, min, max, 0, 1); // Normalize to 0–1 range
  });

  // Extract normalized values
  const [feature1, feature2, feature3] = normalizedFeatures;

  // Circular Spectrum Visualization
  push();
  translate(width / 2, height / 2);

  const baseRadius = 100;
  const maxRadius = 200;
  const spikeCount = 60;
  const angleStep = TWO_PI / spikeCount;

  for (let i = 0; i < spikeCount; i++) {
    const spikeLength = map(feature1, 0, 1, 10, 100); // Use normalized feature1
    const angle = i * angleStep;

    const x1 = cos(angle) * baseRadius;
    const y1 = sin(angle) * baseRadius;
    const x2 = cos(angle) * (baseRadius + spikeLength);
    const y2 = sin(angle) * (baseRadius + spikeLength);

    strokeWeight(2);
    stroke(map(i, 0, spikeCount, 50, 255), map(feature2, 0, 1, 50, 255), 255);
    line(x1, y1, x2, y2);
  }
  pop();

  // Bar Spectrum Visualization
  const barCount = 10;
  const barSpacing = width / (barCount + 2);

  for (let i = 0; i < barCount; i++) {
    const barHeight = map(feature3, 0, 1, 50, height / 2); // Use normalized feature3
    const barX = (i + 1) * barSpacing;
    const barColor = map(i, 0, barCount, 50, 255);

    push();
    fill(barColor, 100, 255 - barColor, 200);
    noStroke();
    rect(barX - 10, height - barHeight, barSpacing - 20, barHeight);
    pop();
  }

  push();
  translate(width / 2, height / 2);

  // Map feature1 to color and feature2 to opacity
  const circleColor = map(feature1, 0, 1, 0, 255); // Map feature1 to a color range
  const circleOpacity = map(feature2, 0, 1, 50, 255); // Map feature2 to opacity range

  fill(circleColor, 100, 255 - circleColor, circleOpacity); // Apply color and opacity
  noStroke();
  
  if (shape === "circle") {
    ellipse(0, 0, 100);
  } else if (shape === "square") {
    rectMode(CENTER);
    rect(0, 0, 100, 100);
  } else if (shape === "triangle") {
    triangle(-50, 50, 50, 50, 0, -50);
  } else if (shape === "pentagon") {
    beginShape();
    for (let i = 0; i < 5; i++) {
      const angle = map(i, 0, 5, 0, TWO_PI) - HALF_PI;
      vertex(cos(angle) * 50, sin(angle) * 50);
    }
    endShape(CLOSE);
  }
  pop();
}

