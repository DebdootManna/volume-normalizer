/**
 * Utility Module
 * General helper functions for the extension
 */

/**
 * Check if audio is actively playing in a tab
 * @param {number} tabId - The ID of the tab to check
 * @returns {Promise<boolean>} Whether audio is playing
 */
export const isTabPlayingAudio = async (tabId) => {
  try {
    const tab = await chrome.tabs.get(tabId);
    return tab.audible === true;
  } catch (error) {
    console.error(`[Volume Normalizer] Error checking if tab ${tabId} is playing audio:`, error);
    return false;
  }
};

/**
 * Get the ID of the currently active tab
 * @returns {Promise<number>} The ID of the active tab
 */
export const getActiveTabId = async () => {
  try {
    const [activeTab] = await chrome.tabs.query({ active: true, currentWindow: true });
    return activeTab?.id;
  } catch (error) {
    console.error('[Volume Normalizer] Error getting active tab:', error);
    return null;
  }
};

/**
 * Execute a content script in a tab
 * @param {number} tabId - The ID of the tab to inject into
 * @param {Object} details - Injection details
 * @returns {Promise<void>}
 */
export const executeScript = async (tabId, details) => {
  try {
    await chrome.scripting.executeScript({
      target: { tabId },
      ...details
    });
  } catch (error) {
    console.error(`[Volume Normalizer] Error executing script in tab ${tabId}:`, error);
  }
};

/**
 * Send a message to a specific tab
 * @param {number} tabId - The ID of the tab to message
 * @param {Object} message - The message to send
 * @returns {Promise<any>} The response
 */
export const sendMessageToTab = async (tabId, message) => {
  try {
    return await chrome.tabs.sendMessage(tabId, message);
  } catch (error) {
    console.error(`[Volume Normalizer] Error sending message to tab ${tabId}:`, error);
    return null;
  }
};

/**
 * Create a debounced version of a function
 * @param {Function} func - The function to debounce
 * @param {number} wait - The debounce delay in milliseconds
 * @returns {Function} The debounced function
 */
export const debounce = (func, wait) => {
  let timeout;
  return function(...args) {
    const context = this;
    clearTimeout(timeout);
    timeout = setTimeout(() => func.apply(context, args), wait);
  };
};

/**
 * Format a number as a decibel value
 * @param {number} value - The value to format
 * @returns {string} The formatted value
 */
export const formatDb = (value) => {
  return `${value.toFixed(1)} dB`;
};