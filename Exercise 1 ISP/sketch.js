//sketch.js
// playback controls
let pauseButton, playButton, stopButton, skipStartButton, skipEndButton, loopButton, recordButton;

// low-pass filter
let lp_cutOffSlider, lp_resonanceSlider, lp_dryWetSlider, lp_outputSlider;
let cutOffLabel, resonanceLabel, dryWetLabel, outputLabel;

// dynamic compressor
let dc_attackSlider, dc_kneeSlider, dc_releaseSlider, dc_ratioSlider, dc_thresholdSlider, dc_dryWetSlider, dc_outputSlider;
let compressorAttackLabel, compressorKneeLabel, compressorReleaseLabel, compressorRatioLabel, compressorThresholdLabel, compressorDryWetLabel, compressorOutputLabel;

// master volume
let mv_volumeSlider;

// reverb
let rv_durationSlider, rv_decaySlider, rv_dryWetSlider, rv_outputSlider, rv_reverseButton;
let reverbDurationLabel, reverbDecayLabel, reverbDryWetLabel, reverbOutputLabel;

// waveshaper distortion
let wd_amountSlider, wd_oversampleSlider, wd_dryWetSlider, wd_outputSlider;
let distortionAmountLabel, distortionOversampleLabel, distortionDryWetLabel, distortionOutputLabel;

function gui_configuration() {
// Playback controls
pauseButton = createButton('pause');
pauseButton.position(10, 20);
playButton = createButton('play');
playButton.position(70, 20);
stopButton = createButton('stop');
stopButton.position(120, 20);
skipStartButton = createButton('skip to start');
skipStartButton.position(170, 20);
skipEndButton = createButton('skip to end');
skipEndButton.position(263, 20);
loopButton = createButton('loop');
loopButton.position(352, 20);
recordButton = createButton('record');
recordButton.position(440, 20);  

// Bind playback buttons
playButton.mousePressed(() => playAudio());
pauseButton.mousePressed(() => pauseAudio());
stopButton.mousePressed(() => stopAudio());
skipStartButton.mousePressed(() => {
  if (soundFile) soundFile.jump(0);
});
recordButton.mousePressed(() => toggleRecording());
skipEndButton.mousePressed(() => {
  if (soundFile) {
    let duration = soundFile.duration();
    soundFile.jump(duration - 0.1); // Jump near the end (avoid skipping the end due to precision)
  }
});
loopButton.mousePressed(() => {
  if (soundFile && soundFile.isLoaded()) {
    if (!soundFile.isLooping()) {
      // Enable looping
      soundFile.setLoop(true);
      console.log("Looping enabled");
      loopButton.html("Stop Loop");
    } else {
      // Disable looping
      soundFile.setLoop(false);
      console.log("Looping disabled");
      loopButton.html("Loop");
    }
  } else {
    console.error("Sound file is not loaded yet!");
  }
});


// Initialize Low-Pass Filter Labels
cutOffLabel = createP('Cutoff Frequency: 20000 Hz');
cutOffLabel.position(10, 110);
resonanceLabel = createP('Resonance: 0.0');
resonanceLabel.position(10, 155);
dryWetLabel = createP('Dry/Wet Mix: 0%');
dryWetLabel.position(10, 200);
outputLabel = createP('Output Level: 100%');
outputLabel.position(10, 245);

// Filter type dropdown
const filterTypeLabel = createP("Filter Type:");
filterTypeLabel.position(10, 50);
const filterTypeSelector = createSelect();
filterTypeSelector.position(10, 90);
filterTypeSelector.option("Low-pass");
filterTypeSelector.option("High-pass");
filterTypeSelector.option("Band-pass");
filterTypeSelector.selected("Low-pass");
filterTypeSelector.changed(() => {
  filterType = filterTypeSelector.value().toLowerCase().replace("-", "");
  setFilterType(filterType);
});

// Initialize Low-Pass Filter Sliders
lp_cutOffSlider = createSlider(0, 1, 1, 0.01);
lp_cutOffSlider.position(10, 110);
lp_cutOffSlider.input(() => {
  let cutoffFreq = floor(map(lp_cutOffSlider.value(), 0, 1, 20, 20000));
  setFilterCutOff(lp_cutOffSlider.value());
  cutOffLabel.html(`Cutoff Frequency: ${cutoffFreq} Hz`);
});

lp_resonanceSlider = createSlider(0, 1, 0, 0.01);
lp_resonanceSlider.position(10, 155);
lp_resonanceSlider.input(() => {
  let resonance = (lp_resonanceSlider.value() * 10).toFixed(1);
  setFilterResonance(lp_resonanceSlider.value());
  resonanceLabel.html(`Resonance: ${resonance}`);
});

lp_dryWetSlider = createSlider(0, 1, 0, 0.01);
lp_dryWetSlider.position(10, 200);
lp_dryWetSlider.input(() => {
  let dryWet = floor(lp_dryWetSlider.value() * 100);
  setFilterDryWet(lp_dryWetSlider.value());
  dryWetLabel.html(`Dry/Wet Mix: ${dryWet}%`);
});

lp_outputSlider = createSlider(0, 1, 1, 0.01);
lp_outputSlider.position(10, 245);
lp_outputSlider.input(() => {
  let outputLevel = floor(lp_outputSlider.value() * 100);
  setFilterOutput(lp_outputSlider.value());
  outputLabel.html(`Output Level: ${outputLevel}%`);
});

// Initialize Waveshaper Distortion Labels
const distortionTypeLabel = createP("Distortion:");
distortionTypeLabel.position(250, 300);
distortionAmountLabel = createP('Distortion Amount: 0');
distortionAmountLabel.position(250, 335);
distortionOversampleLabel = createP('Oversampling: Disabled');
distortionOversampleLabel.position(250, 380);
distortionDryWetLabel = createP('Dry/Wet Mix: 0%');
distortionDryWetLabel.position(250, 425);
distortionOutputLabel = createP('Output Level: 100%');
distortionOutputLabel.position(250, 470);

// Initialize Waveshaper Distortion Sliders
wd_amountSlider = createSlider(0, 1, 0, 0.01); // Default: 0 (no distortion)
wd_amountSlider.position(250, 335);
wd_amountSlider.input(() => {
let amount = wd_amountSlider.value();
setDistortionAmount(amount);
distortionAmountLabel.html(`Distortion Amount: ${amount}`);
});

// Distortion Oversample Slider
wd_oversampleSlider = createSlider(0, 2, 0, 1); // Range: 0 ('none'), 1 ('2x'), 2 ('4x')
wd_oversampleSlider.position(250, 380);
wd_oversampleSlider.input(() => {
  const oversampleValue = wd_oversampleSlider.value();
  const oversampleOptions = ['none', '2x', '4x'];
  const oversampleSetting = oversampleOptions[oversampleValue]; // Map slider value to setting
  setDistortionOversample(oversampleSetting); // Set the chosen oversample
  distortionOversampleLabel.html(`Oversampling: ${oversampleSetting}`); // Update label
});

// Dry/Wet Mix Slider
wd_dryWetSlider = createSlider(0, 1, 0, 0.01); // Default: 0 (no distortion mix)
wd_dryWetSlider.position(250, 425);
wd_dryWetSlider.input(() => {
let dryWet = floor(wd_dryWetSlider.value() * 100);
setDistortionDryWet(wd_dryWetSlider.value());
distortionDryWetLabel.html(`Dry/Wet Mix: ${dryWet}%`);
});

// Distortion Output Level Slider
wd_outputSlider = createSlider(0, 1, 1, 0.01); // Default: 1 (full output)
wd_outputSlider.position(250, 470);
wd_outputSlider.input(() => {
let outputLevel = floor(wd_outputSlider.value() * 100);
setDistortionOutput(wd_outputSlider.value());
distortionOutputLabel.html(`Output Level: ${outputLevel}%`);
});

// Compressor Section
// Initialize Compressor Labels
const compressorTypeLabel = createP("Compressor:");
compressorTypeLabel.position(250, 50);
compressorAttackLabel = createP('Attack: 0.01s');
compressorAttackLabel.position(250, 110);
compressorKneeLabel = createP('Knee: 30dB');
compressorKneeLabel.position(400, 110);
compressorReleaseLabel = createP('Release: 0.1s');
compressorReleaseLabel.position(250, 155);
compressorRatioLabel = createP('Ratio: 1:1');
compressorRatioLabel.position(250, 200);
compressorThresholdLabel = createP('Threshold: 0dB');
compressorThresholdLabel.position(400, 155);
compressorDryWetLabel = createP('Dry/Wet Mix: 0.0%');
compressorDryWetLabel.position(400, 200);
compressorOutputLabel = createP('Output Level: 100%');
compressorOutputLabel.position(250, 245);

// Initialize Compressor Sliders
// Attack
dc_attackSlider = createSlider(0.001, 1, 0.010, 0.001); // Min: 0.001s, Max: 1s
dc_attackSlider.position(250, 110);
dc_attackSlider.input(() => {
  let value = dc_attackSlider.value();
  setCompressorAttack(value);
  compressorAttackLabel.html(`Attack: ${value.toFixed(3)}s`);
});

// Knee
dc_kneeSlider = createSlider(0, 40, 0, 1); // Min: 0dB, Max: 40dB
dc_kneeSlider.position(400, 110);
dc_kneeSlider.input(() => {
  let value = dc_kneeSlider.value();
  setCompressorKnee(value);
  compressorKneeLabel.html(`Knee: ${value}dB`);
});

// Release
dc_releaseSlider = createSlider(0.001, 1, 0.100, 0.001); // Min: 0.001s, Max: 1s
dc_releaseSlider.position(250, 155);
dc_releaseSlider.input(() => {
  let value = dc_releaseSlider.value();
  setCompressorRelease(value);
  compressorReleaseLabel.html(`Release: ${value.toFixed(3)}s`);
});

// Ratio
dc_ratioSlider = createSlider(1, 20, 1, 0.1); // Min: 1:1, Max: 20:1
dc_ratioSlider.position(250, 200);
dc_ratioSlider.input(() => {
  let value = dc_ratioSlider.value();
  setCompressorRatio(value);
  compressorRatioLabel.html(`Ratio: ${value.toFixed(1)}:1`);
});

// Threshold
dc_thresholdSlider = createSlider(-100, 0, 0, 1); // Min: -100dB, Max: 0dB
dc_thresholdSlider.position(400, 155);
dc_thresholdSlider.input(() => {
  let value = dc_thresholdSlider.value();
  setCompressorThreshold(value);
  compressorThresholdLabel.html(`Threshold: ${value}dB`);
});

// Dry/Wet Mix
dc_dryWetSlider = createSlider(0, 1, 0, 0.01); // Min: 0%, Max: 100%
dc_dryWetSlider.position(400, 200);
dc_dryWetSlider.input(() => {
  let value = floor(dc_dryWetSlider.value() * 100);
  setCompressorDryWet(dc_dryWetSlider.value());
  compressorDryWetLabel.html(`Dry/Wet Mix: ${value}%`);
});

// Output Level
dc_outputSlider = createSlider(0, 1, 1, 0.01); // Min: 0%, Max: 100%
dc_outputSlider.position(250, 245);
dc_outputSlider.input(() => {
  let value = floor(dc_outputSlider.value() * 100);
  setCompressorOutput(dc_outputSlider.value());
  compressorOutputLabel.html(`Output Level: ${value}%`);
});

// Reverb Section
// Initialize Reverb Labels
let reverbDurationLabel, reverbDecayLabel, reverbDryWetLabel, reverbOutputLabel;

const reverbTypeLabel = createP("Reverb:");
reverbTypeLabel.position(10, 300);
reverbDurationLabel = createP('Duration: 3.0s');
reverbDurationLabel.position(10, 335);
reverbDecayLabel = createP('Decay: 2.0');
reverbDecayLabel.position(10, 380);
reverbDryWetLabel = createP('Dry/Wet Mix: 0%');
reverbDryWetLabel.position(10, 425);
reverbOutputLabel = createP('Output Level: 100%');
reverbOutputLabel.position(10, 470);

// Initialize Reverb Sliders
// Duration
rv_durationSlider = createSlider(0, 10, 3, 0.1); // Duration in seconds (0 to 10)
rv_durationSlider.position(10, 335);
rv_durationSlider.input(() => {
  const duration = rv_durationSlider.value();
  setReverbDuration(duration);
  reverbDurationLabel.html(`Duration: ${duration.toFixed(1)}s`);
});

// Decay
rv_decaySlider = createSlider(0, 5, 2, 0.1); // Decay time in seconds (0 to 5)
rv_decaySlider.position(10, 380);
rv_decaySlider.input(() => {
  const decay = rv_decaySlider.value();
  setReverbDecay(decay);
  reverbDecayLabel.html(`Decay: ${decay.toFixed(1)}`);
});

// Dry/Wet Mix
rv_dryWetSlider = createSlider(0, 1, 0, 0.01); // Dry/Wet mix (0% to 100%)
rv_dryWetSlider.position(10, 425);
rv_dryWetSlider.input(() => {
  const dryWet = floor(rv_dryWetSlider.value() * 100);
  setReverbDryWet(rv_dryWetSlider.value());
  reverbDryWetLabel.html(`Dry/Wet Mix: ${dryWet}%`);
});

// Output Level
rv_outputSlider = createSlider(0, 1, 1, 0.01); // Output level (0% to 100%)
rv_outputSlider.position(10, 470);
rv_outputSlider.input(() => {
  const outputLevel = floor(rv_outputSlider.value() * 100);
  setReverbOutput(rv_outputSlider.value());
  reverbOutputLabel.html(`Output Level: ${outputLevel}%`);
});

// Reverse Button
rv_reverseButton = createButton('Reverb Reverse');
rv_reverseButton.position(10, 520);
rv_reverseButton.mousePressed(() => {
  toggleReverbReverse();
});

// Master Volume
const masterVolumeTypeLabel = createP("Master Volume:");
masterVolumeTypeLabel.position(650, 50);
let masterVolumeLabel = createP('Volume Level: 100%');
masterVolumeLabel.position(650, 110);

// Master Volume Slider
mv_volumeSlider = createSlider(0, 1, 1, 0.01); // Default: 0.5
mv_volumeSlider.position(650, 110);
mv_volumeSlider.input(() => {
  let volumeLevel = floor(mv_volumeSlider.value() * 100);
  setMasterVolume(mv_volumeSlider.value());
  masterVolumeLabel.html(`Volume Level: ${volumeLevel}%`);
});

sourceSelector = createSelect(); // Create a dropdown
sourceSelector.position(510, 20); // Position it on the canvas
sourceSelector.option('Pre-recorded File', 'file'); // Option for audio file
sourceSelector.option('Microphone Input', 'mic'); // Option for microphone
sourceSelector.selected('file'); // Default selection is the audio file

// Add an event listener to handle source change
sourceSelector.changed(() => {
  let selectedSource = sourceSelector.value();
  handleSourceChange(selectedSource); // Call the handler in audio.js
});
}