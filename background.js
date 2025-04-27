/**
 * Background Script
 * Monitors tabs and manages the state of the extension
 */

import { isTabPlayingAudio, sendMessageToTab } from './src/utils.js';
import StorageManager from './src/storage.js';

// Keep track of tabs that are currently being monitored
const monitoredTabs = new Set();

/**
 * Initialize the audio normalizer in a tab
 * @param {number} tabId - The ID of the tab to initialize
 */
async function initializeTab(tabId) {
  if (monitoredTabs.has(tabId)) {
    return; // Already initialized
  }

  try {
    // Get settings for this tab
    const { globalEnabled } = await StorageManager.getGlobalSettings();
    const { enabled: tabEnabled } = await StorageManager.getTabSettings(tabId);
    const isEnabled = globalEnabled && tabEnabled;
    
    // Send initialization message to the content script
    const response = await sendMessageToTab(tabId, { type: 'INITIALIZE' });
    
    if (response && response.success) {
      monitoredTabs.add(tabId);
      
      // Set enabled state based on settings
      await sendMessageToTab(tabId, { type: 'SET_ENABLED', enabled: isEnabled });
      
      console.log(`[Volume Normalizer] Initialized tab ${tabId}`);
    }
  } catch (error) {
    console.error(`[Volume Normalizer] Failed to initialize tab ${tabId}:`, error);
  }
}

/**
 * Update the enabled state for a tab
 * @param {number} tabId - The ID of the tab to update
 * @param {boolean} enabled - Whether normalization should be enabled
 */
async function updateTabEnabled(tabId, enabled) {
  if (!monitoredTabs.has(tabId)) {
    await initializeTab(tabId);
  }
  
  try {
    await sendMessageToTab(tabId, { type: 'SET_ENABLED', enabled });
    console.log(`[Volume Normalizer] Updated tab ${tabId} to ${enabled ? 'enabled' : 'disabled'}`);
  } catch (error) {
    console.error(`[Volume Normalizer] Failed to update tab ${tabId}:`, error);
  }
}

/**
 * Clean up resources when a tab is closed
 * @param {number} tabId - The ID of the tab that was closed
 */
async function cleanupTab(tabId) {
  monitoredTabs.delete(tabId);
  await StorageManager.removeTabSettings(tabId);
  console.log(`[Volume Normalizer] Cleaned up tab ${tabId}`);
}

/**
 * Check all audible tabs and initialize them if needed
 */
async function checkAudibleTabs() {
  const tabs = await chrome.tabs.query({});
  
  for (const tab of tabs) {
    if (tab.audible && !monitoredTabs.has(tab.id)) {
      await initializeTab(tab.id);
    }
  }
}

// Listen for tab updates (e.g., when a tab starts playing audio)
chrome.tabs.onUpdated.addListener(async (tabId, changeInfo, tab) => {
  if (changeInfo.audible === true && !monitoredTabs.has(tabId)) {
    await initializeTab(tabId);
  }
});

// Listen for tab activation
chrome.tabs.onActivated.addListener(async ({ tabId }) => {
  const tab = await chrome.tabs.get(tabId);
  
  if (tab.audible && !monitoredTabs.has(tabId)) {
    await initializeTab(tabId);
  }
});

// Listen for tab removal
chrome.tabs.onRemoved.addListener(async (tabId) => {
  await cleanupTab(tabId);
});

// Listen for messages from popup or content scripts
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === 'UPDATE_GLOBAL_ENABLED') {
    (async () => {
      await StorageManager.saveGlobalSettings({ globalEnabled: message.enabled });
      
      // Update all monitored tabs
      for (const tabId of monitoredTabs) {
        const { enabled: tabEnabled } = await StorageManager.getTabSettings(tabId);
        await updateTabEnabled(tabId, message.enabled && tabEnabled);
      }
      
      sendResponse({ success: true });
    })();
    
    return true; // Required for async sendResponse
  } else if (message.type === 'UPDATE_TAB_ENABLED') {
    (async () => {
      const { tabId, enabled } = message;
      await StorageManager.saveTabSettings(tabId, { enabled });
      
      const { globalEnabled } = await StorageManager.getGlobalSettings();
      await updateTabEnabled(tabId, globalEnabled && enabled);
      
      sendResponse({ success: true });
    })();
    
    return true; // Required for async sendResponse
  } else if (message.type === 'GET_TAB_STATUS') {
    (async () => {
      const { tabId } = message;
      const isMonitored = monitoredTabs.has(tabId);
      
      let status = { initialized: false, mediaElementsCount: 0 };
      
      if (isMonitored) {
        try {
          status = await sendMessageToTab(tabId, { type: 'GET_STATUS' }) || status;
        } catch (error) {
          console.error(`[Volume Normalizer] Failed to get status for tab ${tabId}:`, error);
        }
      }
      
      sendResponse({
        isMonitored,
        ...status
      });
    })();
    
    return true; // Required for async sendResponse
  }
});

// Initialize extension
(async () => {
  // Check existing audible tabs
  await checkAudibleTabs();
  
  // Set up periodic check for audible tabs (every 30 seconds)
  setInterval(checkAudibleTabs, 30000);
  
  console.log('[Volume Normalizer] Background script initialized');
})();