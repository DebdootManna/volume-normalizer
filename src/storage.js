/**
 * Storage Module
 * Handles saving and loading preferences using Chrome's storage API
 */

class StorageManager {
  constructor() {
    this.defaults = {
      globalEnabled: true,
      tabSettings: {}
    };
  }

  /**
   * Get global extension settings
   * @returns {Promise<Object>} The global settings
   */
  async getGlobalSettings() {
    return new Promise((resolve) => {
      chrome.storage.sync.get(['globalEnabled'], (result) => {
        resolve({
          globalEnabled: result.globalEnabled !== undefined ? result.globalEnabled : this.defaults.globalEnabled
        });
      });
    });
  }

  /**
   * Save global extension settings
   * @param {Object} settings - The settings to save
   * @returns {Promise<void>}
   */
  async saveGlobalSettings(settings) {
    return new Promise((resolve) => {
      chrome.storage.sync.set({
        globalEnabled: settings.globalEnabled
      }, resolve);
    });
  }

  /**
   * Get settings for a specific tab
   * @param {number} tabId - The ID of the tab
   * @returns {Promise<Object>} The tab settings
   */
  async getTabSettings(tabId) {
    return new Promise((resolve) => {
      chrome.storage.sync.get(['tabSettings'], (result) => {
        const tabSettings = result.tabSettings || {};
        resolve({
          enabled: tabSettings[tabId] !== undefined ? tabSettings[tabId].enabled : true
        });
      });
    });
  }

  /**
   * Save settings for a specific tab
   * @param {number} tabId - The ID of the tab
   * @param {Object} settings - The settings to save
   * @returns {Promise<void>}
   */
  async saveTabSettings(tabId, settings) {
    return new Promise((resolve) => {
      chrome.storage.sync.get(['tabSettings'], (result) => {
        const tabSettings = result.tabSettings || {};
        
        tabSettings[tabId] = {
          enabled: settings.enabled
        };
        
        chrome.storage.sync.set({ tabSettings }, resolve);
      });
    });
  }

  /**
   * Remove settings for a specific tab
   * @param {number} tabId - The ID of the tab to remove settings for
   * @returns {Promise<void>}
   */
  async removeTabSettings(tabId) {
    return new Promise((resolve) => {
      chrome.storage.sync.get(['tabSettings'], (result) => {
        const tabSettings = result.tabSettings || {};
        
        if (tabSettings[tabId]) {
          delete tabSettings[tabId];
          chrome.storage.sync.set({ tabSettings }, resolve);
        } else {
          resolve();
        }
      });
    });
  }

  /**
   * Clear all stored settings
   * @returns {Promise<void>}
   */
  async clearAllSettings() {
    return new Promise((resolve) => {
      chrome.storage.sync.clear(resolve);
    });
  }
}

export default new StorageManager();