// main.js
let soundFile;

function preload() {
  soundFile = loadSound('sampleaudio.mp3', 
    () => {
      console.log('Audio loaded successfully');
      isAudioReady = true; // Set the flag to true
    },
    (err) => {
      console.error('Failed to load audio:', err);
    }
  );
}

function setup() {
  createCanvas(1200, 1000);
  background(180);

    // Wait until soundFile is loaded
    if (soundFile.isLoaded()) {
      setupAudio();
    } else {
      let checkInterval = setInterval(() => {
        if (soundFile.isLoaded()) {
          setupAudio();
          clearInterval(checkInterval);
          console.log('Audio setup complete.');
        }
      }, 100); // Check every 100ms
    }
  
  // Setup GUI
  gui_configuration();

  console.log('Audio setup complete.');
}

function draw() {
background(180);

// Spectrum In (Original Sound)
let spectrumOriginal = fftOriginal.analyze(); // Analyze original input sound
textSize(14);
fill(255); // White text
noStroke();
text('spectrum in', 500, 300); // Label position for "spectrum in"

// Draw original spectrum
noFill();
stroke(0, 255, 0); // Green stroke for original spectrum
let barWidth = (width - 600 - 300) / spectrumOriginal.length; // Adjust bar width
for (let i = 0; i < spectrumOriginal.length; i++) {
  let x = map(i, 0, spectrumOriginal.length, 600, width - 300); // Map index to canvas width
  let h = map(spectrumOriginal[i], 0, 255, 0, 100); // Map amplitude to bar height
  rect(x, 320, barWidth, -h); // Position and height adjusted
}

// Spectrum Out (Processed Sound)
let spectrumProcessed = fftProcessed.analyze(); // Analyze processed output
textSize(14);
fill(255); // White text
noStroke();
text('spectrum out', 500, 450); // Label position for "spectrum out"

// Draw processed spectrum
noFill();
stroke(255, 0, 0); // Red stroke for processed spectrum
for (let i = 0; i < spectrumProcessed.length; i++) {
  let x = map(i, 0, spectrumProcessed.length, 600, width - 300); // Map index to canvas width
  let h = map(spectrumProcessed[i], 0, 255, 0, 100); // Map amplitude to bar height
  rect(x, 470, barWidth, -h); // Position and height adjusted
}

fftOriginal.smooth();
fftProcessed.smooth();

let avgOriginal = spectrumOriginal.reduce((sum, val) => sum + val, 0) / spectrumOriginal.length;
let avgProcessed = spectrumProcessed.reduce((sum, val) => sum + val, 0) / spectrumProcessed.length;
//console.log("Avg Magnitude - Original:", avgOriginal, "Processed:", avgProcessed);

// Get the current amplitude level of the final output
  let level = amplitude.getLevel();

  // Log the level to the console
  console.log(`Final Output Amplitude Level: ${level.toFixed(3)}`);

}
  