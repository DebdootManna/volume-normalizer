/**
 * Audio Normalizer Module
 * Handles the core audio processing functionality using Web Audio API
 */

class AudioNormalizer {
  constructor() {
    this.audioElements = new Map();
    this.videoElements = new Map();
    this.audioContext = null;
    this.enabled = true;
    this.compressorSettings = {
      threshold: -24,
      knee: 30,
      ratio: 12,
      attack: 0.003,
      release: 0.25
    };
  }

  /**
   * Initialize the audio context and start monitoring for media elements
   */
  initialize() {
    if (!this.audioContext) {
      this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
      console.log('[Volume Normalizer] Audio context initialized');
    }
    
    // Find and attach to existing media elements
    this.findAndAttachToMediaElements();
    
    // Set up mutation observer to detect new media elements
    this.setupMutationObserver();
    
    console.log('[Volume Normalizer] Initialized');
  }

  /**
   * Create a compressor node with the specified settings
   * @returns {DynamicsCompressorNode} A configured dynamics compressor
   */
  createCompressor() {
    const compressor = this.audioContext.createDynamicsCompressor();
    const { threshold, knee, ratio, attack, release } = this.compressorSettings;
    
    compressor.threshold.value = threshold;
    compressor.knee.value = knee;
    compressor.ratio.value = ratio;
    compressor.attack.value = attack;
    compressor.release.value = release;
    
    return compressor;
  }

  /**
   * Attach audio processing to a media element
   * @param {HTMLMediaElement} mediaElement - The audio or video element to process
   * @param {string} type - Either 'audio' or 'video'
   */
  attachToMediaElement(mediaElement, type) {
    if (this.audioElements.has(mediaElement) || this.videoElements.has(mediaElement)) {
      return; // Already attached
    }

    try {
      const source = this.audioContext.createMediaElementSource(mediaElement);
      const compressor = this.createCompressor();
      
      // Connect nodes: source -> compressor -> destination
      source.connect(compressor);
      compressor.connect(this.audioContext.destination);
      
      const processingNodes = { source, compressor };
      
      if (type === 'audio') {
        this.audioElements.set(mediaElement, processingNodes);
      } else {
        this.videoElements.set(mediaElement, processingNodes);
      }
      
      console.log(`[Volume Normalizer] Attached to ${type} element`, mediaElement);
      
      // Add event listener to handle when media element is removed
      mediaElement.addEventListener('remove', () => this.detachFromMediaElement(mediaElement, type));
    } catch (error) {
      console.error('[Volume Normalizer] Failed to attach to media element:', error);
    }
  }

  /**
   * Detach audio processing from a media element
   * @param {HTMLMediaElement} mediaElement - The audio or video element to detach from
   * @param {string} type - Either 'audio' or 'video'
   */
  detachFromMediaElement(mediaElement, type) {
    const elementsMap = type === 'audio' ? this.audioElements : this.videoElements;
    
    if (elementsMap.has(mediaElement)) {
      try {
        const { source, compressor } = elementsMap.get(mediaElement);
        source.disconnect();
        compressor.disconnect();
        elementsMap.delete(mediaElement);
        console.log(`[Volume Normalizer] Detached from ${type} element`);
      } catch (error) {
        console.error('[Volume Normalizer] Failed to detach from media element:', error);
      }
    }
  }

  /**
   * Find all existing media elements and attach to them
   */
  findAndAttachToMediaElements() {
    const audioElements = document.querySelectorAll('audio');
    const videoElements = document.querySelectorAll('video');
    
    audioElements.forEach(audio => this.attachToMediaElement(audio, 'audio'));
    videoElements.forEach(video => this.attachToMediaElement(video, 'video'));
    
    console.log(`[Volume Normalizer] Found ${audioElements.length} audio and ${videoElements.length} video elements`);
  }

  /**
   * Set up a mutation observer to detect new media elements
   */
  setupMutationObserver() {
    const observer = new MutationObserver(mutations => {
      let shouldScan = false;
      
      for (const mutation of mutations) {
        if (mutation.addedNodes.length > 0) {
          shouldScan = true;
          break;
        }
      }
      
      if (shouldScan) {
        this.findAndAttachToMediaElements();
      }
    });
    
    observer.observe(document.body, {
      childList: true,
      subtree: true
    });
    
    console.log('[Volume Normalizer] Mutation observer set up');
  }

  /**
   * Enable or disable audio normalization
   * @param {boolean} enabled - Whether normalization should be enabled
   */
  setEnabled(enabled) {
    this.enabled = enabled;
    
    const allElements = new Map([...this.audioElements, ...this.videoElements]);
    
    for (const [_, { compressor }] of allElements) {
      if (enabled) {
        // Apply compression settings
        Object.entries(this.compressorSettings).forEach(([key, value]) => {
          if (compressor[key]) {
            compressor[key].value = value;
          }
        });
      } else {
        // Disable compression by setting ratio to 1:1
        compressor.ratio.value = 1;
      }
    }
    
    console.log(`[Volume Normalizer] ${enabled ? 'Enabled' : 'Disabled'}`);
  }

  /**
   * Clean up resources when the page is unloaded
   */
  cleanup() {
    // Detach from all audio elements
    for (const [audio] of this.audioElements) {
      this.detachFromMediaElement(audio, 'audio');
    }
    
    // Detach from all video elements
    for (const [video] of this.videoElements) {
      this.detachFromMediaElement(video, 'video');
    }
    
    // Close audio context
    if (this.audioContext) {
      this.audioContext.close();
      this.audioContext = null;
    }
    
    console.log('[Volume Normalizer] Cleaned up resources');
  }
}

export default new AudioNormalizer();