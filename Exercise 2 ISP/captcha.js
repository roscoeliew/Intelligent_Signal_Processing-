let audioFiles = [
  { path: "sounds/my_name_is_david.wav", correctAnswer: "my name is david" },
  { path: "sounds/i_love_computer_science.wav", correctAnswer: "i love computer science" },
];

let currentAudioIndex = 0;
let captchaAudio;
let isAudioReady = false;
let filter, noise, noiseAmp, distortion;
let speechRec;

function setup() {
  noCanvas();

  // Attach listener to the 'Play Captcha' button
  const playButton = select("#playCaptcha");
  playButton.mousePressed(playCaptcha);

  // Attach listener to the 'Refresh' button
  const refreshButton = select("#refreshCaptcha");
  refreshButton.mousePressed(refreshCaptcha);

  // Attach listener to the 'Submit Captcha' button
  const submitButton = select("#submitCaptcha");
  submitButton.mousePressed(checkCaptcha);

  // Create a low-pass filter for scrambling
  filter = new p5.LowPass();

  // Create a distortion effect
  distortion = new p5.Distortion();
  distortion.set(0.5); // Set moderate distortion

  // Create a noise generator for background noise
  noise = new p5.Noise("white");
  noise.start();
  noise.amp(0);


  // Load the first audio file
  loadAudioFile();

  speechRec = new p5.SpeechRec('en-US', gotSpeech);
  speechRec.continuous = false; // Process one recognition session at a time
  speechRec.interimResults = false; // Only return final results

}
  
function loadAudioFile() {
  const currentAudio = audioFiles[currentAudioIndex];

  captchaAudio = loadSound(
    currentAudio.path,
    () => {
      isAudioReady = true;
      console.log(`Audio file "${currentAudio.path}" loaded successfully.`);
    },
    (err) => {
      console.error("Error loading audio file:", err);
    }
  );
}

function playCaptcha() {
  if (!isAudioReady) {
    console.error("Audio is not ready yet. Please refresh the captcha.");
    return;
  }

  console.log("Playing captcha audio with scrambling and background noise...");

  // Configure noise
  noise.amp(0.1, 0.5); // Fade in noise over 0.5 seconds

  captchaAudio.disconnect(); // Disconnect from default output
  captchaAudio.connect(filter); // Connect to the filter
  filter.connect(distortion); // Apply distortion after the filter

  // Apply scrambling effects
  filter.freq(random(300, 1200)); // Random cutoff frequency
  filter.res(random(5, 10)); // Random resonance
  captchaAudio.rate(random(0.7, 1)); // Random playback speed
  captchaAudio.pan(random(-1, 1)); // Random stereo panning
  captchaAudio.setVolume(1); // Normalize captcha audio volume

  speechRec.start();
  captchaAudio.play();

  captchaAudio.onended(() => {
  // Turn off noise after audio ends
  noise.amp(0, 0.5); // Gradually fade out noise over 0.5 seconds
  speechRec.stop()

  });
}

function checkCaptcha() {
  const userInput = select("#captchaInput").value().toLowerCase().trim();
  const correctAnswer = audioFiles[currentAudioIndex].correctAnswer;

  const status = select("#captchaStatus");
  if (userInput === correctAnswer || speechRec.resultString?.toLowerCase() === correctAnswer) {
    status.html("Captcha Verified! ✅");
    status.style("color", "green");
  } else {
    status.html("Captcha Failed! ❌ Try Again.");
    status.style("color", "red");
  }
}

function refreshCaptcha() {
  currentAudioIndex = Math.floor(Math.random() * audioFiles.length);

  // Load a new audio file
  isAudioReady = false;
  loadAudioFile();

  console.log("Captcha audio refreshed.");
}

function gotSpeech() {
  if (speechRec.resultValue) {
    resultText = speechRec.resultString;
    console.log(`Recognized Speech: "${resultText}"`);
  } else {
    console.log("Speech recognition failed.");
    resultText = "";
  }
}