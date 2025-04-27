/**
 * Popup Script
 * Handles the popup UI and communicates with the background script
 */

import StorageManager from './src/storage.js';
import { getActiveTabId } from './src/utils.js';

document.addEventListener('DOMContentLoaded', async () => {
  const globalToggle = document.getElementById('globalToggle');
  const tabToggle = document.getElementById('tabToggle');
  const tabStatus = document.getElementById('tabStatus');
  const mediaCount = document.getElementById('mediaCount');
  
  let activeTabId = null;
  
  /**
   * Update the UI with the current status
   */
  const updateUI = async () => {
    try {
      // Get the active tab ID
      activeTabId = await getActiveTabId();
      
      if (!activeTabId) {
        return;
      }
      
      // Get global settings
      const { globalEnabled } = await StorageManager.getGlobalSettings();
      globalToggle.checked = globalEnabled;
      
      // Get tab settings
      const { enabled: tabEnabled } = await StorageManager.getTabSettings(activeTabId);
      tabToggle.checked = tabEnabled;
      
      // Get status from content script
      const status = await chrome.runtime.sendMessage({
        type: 'GET_TAB_STATUS',
        tabId: activeTabId
      });
      
      if (status) {
        if (status.isMonitored) {
          tabStatus.textContent = status.initialized ? 'Active' : 'Initializing...';
          tabStatus.className = status.initialized ? 'active' : '';
          mediaCount.textContent = status.mediaElementsCount || 0;
        } else {
          tabStatus.textContent = 'No audio detected';
          tabStatus.className = 'inactive';
          mediaCount.textContent = '0';
        }
      }
    } catch (error) {
      console.error('[Volume Normalizer] Error updating popup UI:', error);
    }
  };
  
  // Set up event listeners for toggles
  globalToggle.addEventListener('change', async () => {
    const enabled = globalToggle.checked;
    
    try {
      await chrome.runtime.sendMessage({
        type: 'UPDATE_GLOBAL_ENABLED',
        enabled
      });
      
      updateUI();
    } catch (error) {
      console.error('[Volume Normalizer] Error updating global enabled state:', error);
    }
  });
  
  tabToggle.addEventListener('change', async () => {
    const enabled = tabToggle.checked;
    
    try {
      await chrome.runtime.sendMessage({
        type: 'UPDATE_TAB_ENABLED',
        tabId: activeTabId,
        enabled
      });
      
      updateUI();
    } catch (error) {
      console.error('[Volume Normalizer] Error updating tab enabled state:', error);
    }
  });
  
  // Initial UI update
  await updateUI();
  
  // Set up periodic refresh
  setInterval(updateUI, 2000);
});