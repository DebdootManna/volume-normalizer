/**
 * Content Script
 * Runs in the context of web pages and handles audio normalization
 */

// Import will be handled by the extension system
// in production code, we'd use a bundler to handle this
const initializeAudioNormalizer = async () => {
  let isEnabled = true;
  let audioContext = null;
  let mediaElements = new Map();
  
  const compressorSettings = {
    threshold: -24,
    knee: 30,
    ratio: 12,
    attack: 0.003,
    release: 0.25
  };

  /**
   * Create a compressor node with optimal settings
   */
  const createCompressor = () => {
    const compressor = audioContext.createDynamicsCompressor();
    
    compressor.threshold.value = compressorSettings.threshold;
    compressor.knee.value = compressorSettings.knee;
    compressor.ratio.value = compressorSettings.ratio;
    compressor.attack.value = compressorSettings.attack;
    compressor.release.value = compressorSettings.release;
    
    return compressor;
  };

  /**
   * Connect a media element to the audio processing chain
   */
  const connectMediaElement = (element) => {
    if (mediaElements.has(element)) {
      return; // Already connected
    }

    try {
      const source = audioContext.createMediaElementSource(element);
      const compressor = createCompressor();
      
      source.connect(compressor);
      compressor.connect(audioContext.destination);
      
      mediaElements.set(element, { source, compressor });
      
      console.log('[Volume Normalizer] Connected media element to audio processor');
    } catch (error) {
      console.error('[Volume Normalizer] Failed to connect media element:', error);
    }
  };

  /**
   * Disconnect a media element from the audio processing chain
   */
  const disconnectMediaElement = (element) => {
    if (!mediaElements.has(element)) {
      return;
    }

    try {
      const { source, compressor } = mediaElements.get(element);
      source.disconnect();
      compressor.disconnect();
      mediaElements.delete(element);
      
      console.log('[Volume Normalizer] Disconnected media element from audio processor');
    } catch (error) {
      console.error('[Volume Normalizer] Failed to disconnect media element:', error);
    }
  };

  /**
   * Find and connect all media elements on the page
   */
  const findAndConnectMediaElements = () => {
    const audioElements = document.querySelectorAll('audio');
    const videoElements = document.querySelectorAll('video');
    
    audioElements.forEach(connectMediaElement);
    videoElements.forEach(connectMediaElement);
    
    console.log(`[Volume Normalizer] Found ${audioElements.length} audio and ${videoElements.length} video elements`);
  };

  /**
   * Initialize the audio context and start processing
   */
  const initialize = () => {
    if (!audioContext) {
      audioContext = new (window.AudioContext || window.webkitAudioContext)();
      console.log('[Volume Normalizer] Audio context initialized');
    }
    
    findAndConnectMediaElements();
    
    // Set up mutation observer to detect new media elements
    const observer = new MutationObserver((mutations) => {
      let shouldScan = false;
      
      for (const mutation of mutations) {
        if (mutation.addedNodes.length > 0) {
          shouldScan = true;
          break;
        }
      }
      
      if (shouldScan) {
        findAndConnectMediaElements();
      }
    });
    
    observer.observe(document.body, {
      childList: true,
      subtree: true
    });
    
    console.log('[Volume Normalizer] Initialized and observing for new media elements');
  };

  /**
   * Update the enabled state based on user preferences
   */
  const updateEnabled = (enabled) => {
    isEnabled = enabled;
    
    for (const [_, { compressor }] of mediaElements) {
      if (enabled) {
        // Apply compression settings
        compressor.threshold.value = compressorSettings.threshold;
        compressor.knee.value = compressorSettings.knee;
        compressor.ratio.value = compressorSettings.ratio;
        compressor.attack.value = compressorSettings.attack;
        compressor.release.value = compressorSettings.release;
      } else {
        // Disable compression by setting ratio to 1:1
        compressor.ratio.value = 1;
      }
    }
    
    console.log(`[Volume Normalizer] ${enabled ? 'Enabled' : 'Disabled'}`);
  };

  /**
   * Clean up resources
   */
  const cleanup = () => {
    // Disconnect all media elements
    for (const [element] of mediaElements) {
      disconnectMediaElement(element);
    }
    
    // Close audio context
    if (audioContext) {
      audioContext.close();
      audioContext = null;
    }
    
    console.log('[Volume Normalizer] Cleaned up resources');
  };

  // Set up message listener for communication with background script
  chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.type === 'INITIALIZE') {
      initialize();
      sendResponse({ success: true });
    } else if (message.type === 'SET_ENABLED') {
      updateEnabled(message.enabled);
      sendResponse({ success: true });
    } else if (message.type === 'GET_STATUS') {
      sendResponse({
        initialized: !!audioContext,
        enabled: isEnabled,
        mediaElementsCount: mediaElements.size
      });
    }
    
    return true; // Required for async sendResponse
  });

  // Initialize on page load if auto-start is enabled
  initialize();

  // Clean up when the page is unloaded
  window.addEventListener('unload', cleanup);
};

// Start the audio normalizer
initializeAudioNormalizer();