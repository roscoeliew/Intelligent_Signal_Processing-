// audio.js
let filter, filterGain, delay, distortion, distortionGain, reverb,reverbGain, compressor, compressorGain, masterVolume;
let recorder;
let isRecording = false; // To track the recording state
let isReversed = false; // Manual tracking of reverse state
let filterType = "lowpass"; // Default filter type
let reverbDuration = 3; // Default reverb duration
let reverbDecay = 2;    // Default reverb decay

let fftOriginal, fftProcessed;

let mic, micGain; // Microphone input and gain for the mic
let isMicActive = false; // Track whether the microphone is active
let sourceSelector; // Dropdown to select the audio source (mic or file)

function setupAudio() {
// Low-Pass Filter
filter = new p5.LowPass();
filter.freq(20000); // Set default frequency (no filtering)
filter.res(0);    // Set default resonance
filter.drywet(0);    // Fully dry by default
filterGain = new p5.Gain();
filterGain.amp(1.5);  // Full volume

// Distortion
distortion = new p5.Distortion();
distortion.set(0); // Set default amount (no distortion)
distortion.drywet(0); // Fully dry by default
distortionGain = new p5.Gain();
distortionGain.amp(1.5); // Full volume

// Delay Effect
delay = new p5.Delay();
delay.delayTime(0.5); // Set delay time
delay.feedback(0.4);  // Set feedback
delay.drywet(0.5);    // Set dry/wet mix

// Compressor
compressor = new p5.Compressor();
compressor.attack(0.01);  // Default attack
compressor.release(0.1); // Default release
compressor.threshold(0); // Default threshold
compressor.ratio(1);       // Default ratio
compressor.knee(0);       // Default knee
compressor.drywet(0);      // Fully dry by default
compressorGain = new p5.Gain();
compressorGain.amp(1.5);     // Full volume

// Reverb
reverb = new p5.Reverb();
reverb.set(reverbDuration, reverbDecay, false);         // Default duration and decay time
reverb.drywet(0);          // Fully dry by default
reverbGain = new p5.Gain();
reverbGain.amp(1.5);         // Full volume

// Final Gain (Master Volume)
finalGain = new p5.Gain();
finalGain.amp(1.5);          // Full volume (no attenuation)

// Initialize Microphone
mic = new p5.AudioIn(); // Create a microphone input
micGain = new p5.Gain(); // Gain for the mic
micGain.amp(1); // Full volume for the mic by default
mic.connect(micGain); // Connect the mic to the gain node

  // Create an amplitude analyzer
  amplitude = new p5.Amplitude();

recorder = new p5.SoundRecorder();

fftOriginal = new p5.FFT(); // FFT for the original sound
fftProcessed = new p5.FFT(); // FFT for the processed sound
// Chain the Effects in Sequence
soundFile.disconnect(); // Disconnect default audio path
filter.disconnect();
filterGain.disconnect();
distortion.disconnect();
distortionGain.disconnect();
delay.disconnect()
compressor.disconnect();
compressorGain.disconnect();
reverb.disconnect();
reverbGain.disconnect();
finalGain.disconnect();

soundFile.connect(filter); // Sound file → Low-pass filter
filter.connect(filterGain);          // Low-pass filter → Filter Gain
filterGain.connect(distortion);      // Filter Gain → Distortion
distortion.connect(distortionGain);  // Distortion → Distortion Gain
distortionGain.connect(delay);       // Distortion Gain → Delay
delay.connect(compressor);           // Delay →  Compressor
compressor.connect(compressorGain);  // Compressor → Compressor Gain
compressorGain.connect(reverb);      // Compressor Gain → Reverb
reverb.connect(reverbGain);          // Reverb → Reverb Gain
reverbGain.connect(finalGain);       // Reverb Gain → Final Gain
finalGain.connect();                 // Final Gain → Audio Output

recorder.setInput(finalGain);

fftOriginal.setInput(soundFile); // Analyze the original input sound
fftProcessed.setInput(finalGain); // Analyze the final processed output
}

function playAudio() {
  if (!soundFile || !soundFile.isLoaded()) {
    console.error('Sound file is not loaded yet');
    return;
  }
  soundFile.play();
}

function pauseAudio() {
  soundFile.pause();
}

function stopAudio() {
  soundFile.stop();
}

function toggleRecording() {
  if (!isRecording) {
    // Ensure the final processed audio (finalGain) is set as the recorder's input
    recorder.setInput(finalGain);

    // Create a new sound file buffer for the recording
    recordedSound = new p5.SoundFile();

    // Start recording from the final processed sound
    recorder.record(recordedSound);
    isRecording = true;
    console.log("Recording started: capturing final processed sound.");
  } else {
    // Stop recording
    recorder.stop();

    // Check if the recording buffer contains valid data before saving
    setTimeout(() => {
      if (recordedSound && recordedSound.buffer && recordedSound.buffer.length > 0) {
        save(recordedSound, isMicActive ? "processed_mic_audio.wav" : "processed_file_audio.wav");
        console.log("Recording stopped and saved successfully.");
      } else {
        console.error("No valid recording data available to save.");
      }
      isRecording = false;
    }, 500); // Slight delay to ensure buffer processing completes
  }
}


//Filter
function setFilterType(type) {
  if (filter) {
    // Disconnect the current filter
    filter.disconnect();

    // Replace the filter with the selected type
    filter = type === "lowpass" 
      ? new p5.LowPass()
      : type === "highpass"
      ? new p5.HighPass()
      : new p5.BandPass();

    // Determine default frequency based on filter type
    let defaultFreq = type === "highpass" 
      ? 0.025  // High-pass removes frequencies below this
      : type === "bandpass" 
      ? 0.05 // Band-pass focuses around this frequency
      : 1; // Low-pass allows nearly all frequencies through

    // Apply default settings to the new filter
    filter.freq(defaultFreq);
    filter.res(0.1);    // Default resonance (wide Q-factor)
    filter.drywet(0); // Moderate dry/wet mix

    lp_cutOffSlider.value(defaultFreq); // Update slider for cutoff frequency

    // Reconnect the filter to the audio chain
    const currentSource = isMicActive ? micGain : soundFile; // Determine active source
    setupAudioChain(currentSource); // Reconnect the entire audio chain with the new filter

    // Log for debugging or UI feedback
    console.log(`Filter type changed to: ${type}`);
    console.log(`Cutoff Frequency: ${defaultFreq} Hz`);

    // Update slider and label values
    
    lp_resonanceSlider.value(0.1);      // Update slider for resonance
    cutOffLabel.html(`Cutoff Frequency: ${defaultFreq *20000} Hz`); // Update cutoff frequency label
    resonanceLabel.html("Resonance: 0.1"); // Update resonance label
  } else {
    console.error("Filter is not initialized.");
  }
}

function setFilterCutOff(value) {
  if (filter) {
    let freq = map(value, 0, 1, 20, 20000);
    filter.freq(freq);
    console.log('Low-pass Filter Cutoff Frequency set to:', freq, 'Hz');
  }
}

function setFilterResonance(value) {
  if (filter) {
    let res = value * 10;
    filter.res(res);
    console.log('Low-pass Filter Resonance set to:', res);
  }
}

function setFilterDryWet(value) {
  if (filter) {
    filter.drywet(value); 
    let dryWetPercentage = floor(value * 100); 
    console.log('Low-pass Filter Dry/Wet Mix set to:', dryWetPercentage, '%');
  }
}

function setFilterOutput(value) {
  if (filterGain) filterGain.amp(value); // Control filter output level
}

// Distortion
function setDistortionAmount(value) {
  if (distortion) {
    if (value < 0 || value > 1) {
      console.error("Distortion amount must be between 0 and 1.");
      return;
    }
    distortion.set(value);
    console.log("Distortion Amount set to:", value);
  } else {
    console.error("Distortion effect is not initialized.");
  }
}

function setDistortionOversample(value) {
  if (distortion) {
    if (typeof value !== "boolean") {
      console.error("Distortion oversample value must be true (4x) or false (none).");
      return;
    }
    const oversampleValue = value ? "4x" : "none";
    distortion.set(distortion.getAmount(), oversampleValue);
    console.log("Distortion Oversample set to:", oversampleValue);
  } else {
    console.error("Distortion effect is not initialized.");
  }
}

function setDistortionDryWet(value) {
  if (distortion) {
    if (value < 0 || value > 1) {
      console.error("Distortion dry/wet mix must be between 0 and 1.");
      return;
    }
    distortion.drywet(value);
    let dryWetPercentage = floor(value * 100);
    console.log("Distortion Dry/Wet Mix set to:", dryWetPercentage, "%");
  } else {
    console.error("Distortion effect is not initialized.");
  }
}

function setDistortionOutput(value) {
  if (distortionGain) {
    if (value < 0 || value > 2) {
      console.error("Distortion output level must be between 0 and 2.");
      return;
    }
    distortionGain.amp(value);
    console.log("Distortion Output Level set to:", value);
  } else {
    console.error("Distortion gain is not initialized.");
  }
}

// Compressor controls
function setCompressorAttack(value) {
  if (compressor) {
    if (value < 0 || value > 1) {
      console.error("Compressor attack value must be between 0 and 1.");
      return;
    }
    compressor.attack(value);
    console.log("Compressor Attack set to:", value);
  }
}

function setCompressorKnee(value) {
  if (compressor) {
    if (value < 0 || value > 40) {
      console.error("Compressor knee value must be between 0 and 40.");
      return;
    }
    compressor.knee(value);
    console.log("Compressor Knee set to:", value);
  }
}

function setCompressorRelease(value) {
  if (compressor) {
    if (value < 0 || value > 1) {
      console.error("Compressor release value must be between 0 and 1.");
      return;
    }
    compressor.release(value);
    console.log("Compressor Release set to:", value);
  }
}

function setCompressorRatio(value) {
  if (compressor) {
    if (value < 1 || value > 20) {
      console.error("Compressor ratio must be between 1 and 20.");
      return;
    }
    compressor.ratio(value);
    console.log("Compressor Ratio set to:", value);
  }
}

function setCompressorThreshold(value) {
  if (compressor) {
    if (value < -100 || value > 0) {
      console.error("Compressor threshold must be between -100 and 0 dB.");
      return;
    }
    compressor.threshold(value);
    console.log("Compressor Threshold set to:", value);
  }
}

function setCompressorDryWet(value) {
  if (compressor) {
    if (value < 0 || value > 1) {
      console.error("Compressor dry/wet mix must be between 0 and 1.");
      return;
    }
    compressor.drywet(value);
    let dryWetPercentage = floor(value * 100);
    console.log("Compressor Dry/Wet Mix set to:", dryWetPercentage + "%");
  }
}

function setCompressorOutput(value) {
  if (compressorGain) {
    if (value < 0 || value > 2) {
      console.error("Compressor output gain must be between 0 and 2.");
      return;
    }
    compressorGain.amp(value);
    console.log("Compressor Output Level set to:", value);
  }
}

// Master Volume
function setMasterVolume(value) {
  if (finalGain) {
    if (value < 0 || value > 2) {
      console.error("Master volume must be between 0 and 2.");
      return;
    }
    finalGain.amp(value);
    console.log("Master Volume set to:", value);
  } else {
    console.error("Final gain (master volume) is not initialized.");
  }
}

// Reverb
function setReverbDuration(value) {
  if (reverb) {
    if (value < 0.1 || value > 10) {
      console.error("Reverb duration must be between 0.1 and 10 seconds.");
      return;
    }
    reverbDuration = value;
    reverb.set(reverbDuration, reverbDecay, isReversed);
    console.log(`Reverb Duration set to: ${reverbDuration}s`);
  } else {
    console.error("Reverb is not initialized.");
  }
}

function setReverbDecay(value) {
  if (reverb) {
    if (value < 0.1 || value > 10) {
      console.error("Reverb decay must be between 0.1 and 10 seconds.");
      return;
    }
    reverbDecay = value;
    reverb.set(reverbDuration, reverbDecay, isReversed);
    console.log(`Reverb Decay set to: ${reverbDecay}`);
  } else {
    console.error("Reverb is not initialized.");
  }
}

function setReverbDryWet(value) {
  if (reverb) {
    if (value < 0 || value > 1) {
      console.error("Reverb dry/wet mix must be between 0 and 1.");
      return;
    }
    reverb.drywet(value);
    const dryWetPercentage = floor(value * 100);
    console.log(`Reverb Dry/Wet Mix set to: ${dryWetPercentage}%`);
  } else {
    console.error("Reverb is not initialized.");
  }
}

function setReverbOutput(value) {
  if (reverbGain) {
    if (value < 0 || value > 2) {
      console.error("Reverb output level must be between 0 and 2.");
      return;
    }
    reverbGain.amp(value);
    console.log(`Reverb Output Level set to: ${value}`);
  } else {
    console.error("Reverb gain is not initialized.");
  }
}

function toggleReverbReverse() {
  if (reverb && soundFile && soundFile.isLoaded()) {
    isReversed = !isReversed;
    reverb.set(reverbDuration, reverbDecay, isReversed);
    console.log(`Reverb Reverse toggled: ${isReversed ? 'Enabled' : 'Disabled'}`);
  } else {
    console.error("Reverb or sound file is not initialized or loaded.");
  }
}

function handleSourceChange(source) {
  if (source === "mic") {
    // Activate microphone input
    if (!mic.enabled) {
      mic.start(); // Start the mic
      console.log("Microphone input activated.");
    }

    // Set up the audio chain for the microphone
    mic.connect(micGain); // Ensure the mic is reconnected to the gain
    setupAudioChain(micGain);
    isMicActive = true;

    // Stop any playing sound file
    if (soundFile && soundFile.isPlaying()) {
      soundFile.stop();
      console.log("Sound file stopped.");
    }
  } else if (source === "file") {
    // Deactivate microphone input
    mic.disconnect();
    console.log("Microphone stopped:", mic.enabled);
    

    // Set up the audio chain for the sound file
    setupAudioChain(soundFile);
    isMicActive = false;
  } else {
    console.error("Unknown audio source selected.");
  }
}

function setupAudioChain(inputSource) {
  if (inputSource) {
    // Ensure the microphone is properly handled
    if (inputSource !== micGain && mic.enabled) {
      mic.stop(); // Explicitly stop the microphone if not using it
      console.log("Microphone deactivated.");
    } else if (inputSource === micGain && !mic.enabled) {
      mic.start(); // Ensure the microphone is activated if it's the input source
      console.log("Microphone activated.");
    }

    // Disconnect any previously connected sources
    inputSource.disconnect();
    if (filter) filter.disconnect();
    if (filterGain) filterGain.disconnect();
    if (distortion) distortion.disconnect();
    if (distortionGain) distortionGain.disconnect();
    if (delay) delay.disconnect();
    if (compressor) compressor.disconnect();
    if (compressorGain) compressorGain.disconnect();
    if (reverb) reverb.disconnect();
    if (reverbGain) reverbGain.disconnect();
    if (finalGain) finalGain.disconnect();

    // Connect the input source to the audio effects chain
    inputSource.connect(filter); // Input → Filter
    filter.connect(filterGain);          // Low-pass filter → Filter Gain
    filterGain.connect(distortion);      // Filter Gain → Distortion
    distortion.connect(distortionGain);  // Distortion → Distortion Gain
    distortionGain.connect(delay);       // Distortion Gain → Delay
    delay.connect(compressor);           // Delay →  Compressor
    compressor.connect(compressorGain);  // Compressor → Compressor Gain
    compressorGain.connect(reverb);      // Compressor Gain → Reverb
    reverb.connect(reverbGain);          // Reverb → Reverb Gain
    reverbGain.connect(finalGain);       // Reverb Gain → Final Gain
    finalGain.connect();                 // Final Gain → Audio Output

    // Set FFT to analyze the selected source
    fftOriginal.setInput(inputSource);
    fftProcessed.setInput(finalGain);

    console.log("Audio chain setup complete for the selected source.");
  } else {
    console.error("No input source provided to setupAudioChain.");
  }
}

// Delay
function setDelayTime(value) {
  if (delay) {
    let time = map(value, 0, 1, 0, 1); // Map slider range (0-1) to delay time (0-1 seconds)
    delay.delayTime(time);
    console.log(`Delay time set to: ${time} seconds`);
  }
}

function setDelayFeedback(value) {
  if (delay) {
    delay.feedback(value); // Set feedback (0-1)
    console.log(`Delay feedback set to: ${value}`);
  }
}

function setDelayDryWet(value) {
  if (delay) {
    delay.drywet(value); // Set dry/wet mix (0-1)
    console.log(`Delay dry/wet mix set to: ${value * 100}%`);
  }
}

