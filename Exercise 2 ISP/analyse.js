const audioFiles = [
    "sounds/Ex2_sound1.wav",
    "sounds/Ex2_sound2.wav",
    "sounds/Ex2_sound3.wav",
    "sounds/Kalte_Ohren_(_Remix_).mp3"
  ];
  
  const featureNames = [
    "rms",
    "zcr",
    "energy",
    "amplitudeSpectrum",
    "powerSpectrum",
    "spectralCentroid",
    "spectralFlatness",
    "spectralSlope",
    "spectralRolloff",
    "spectralSpread",
    "spectralSkewness",
    "spectralKurtosis",
    "spectralCrest",
    "chroma",
    "loudness",
    "perceptualSpread",
    "perceptualSharpness",
  ];
  
  async function analyzeAudioFiles() {
    const results = [];
    for (const file of audioFiles) {
      console.log(`Processing: ${file}`);
      const response = await fetch(file);
      const arrayBuffer = await response.arrayBuffer();
      const audioContext = new AudioContext();
      const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);
  
      const offlineContext = new OfflineAudioContext(
        audioBuffer.numberOfChannels,
        audioBuffer.sampleRate * 2, // Limit to 2 seconds of audio
        audioBuffer.sampleRate
      );
      const source = offlineContext.createBufferSource();
      source.buffer = audioBuffer;
      source.connect(offlineContext.destination);
      source.start();
  
      const analyzer = Meyda.createMeydaAnalyzer({
        audioContext: offlineContext,
        source: source,
        bufferSize: 512,
        featureExtractors: featureNames,
      });
  
      // Aggregated data for variance computation
      const featureSums = {};
      const featureSquares = {};
      let frameCount = 0;
  
      featureNames.forEach((feature) => {
        featureSums[feature] = 0;
        featureSquares[feature] = 0;
      });
  
      await offlineContext.startRendering();
  
      let frame;
      while ((frame = analyzer.get())) {
        frameCount++;
        featureNames.forEach((feature) => {
          const value = frame[feature] || 0;
          featureSums[feature] += value;
          featureSquares[feature] += value * value;
        });
  
        // Skip frames for better performance
        if (frameCount % 10 === 0) break;
      }
  
      // Calculate mean and variance
      const featureVariances = featureNames.map((feature) => {
        const mean = featureSums[feature] / frameCount;
        const variance =
          featureSquares[feature] / frameCount - mean * mean;
        return { feature, variance };
      });
  
      // Sort and pick top 3 features
      featureVariances.sort((a, b) => b.variance - a.variance);
      const topFeatures = featureVariances.slice(0, 17);
  
      results.push({ file, topFeatures });
      console.log(`Top Features for ${file}:`, topFeatures);
    }
  
    console.log("Feature Analysis Complete:", results);
    return results;
  }
  
  analyzeAudioFiles();
  

  
  
  