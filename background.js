// Global settings object with default values
const globalSettings = {
    isEnabled: true,
    blacklist: [] // Initialize as empty array to prevent undefined errors
  };
  
  // Safe badge update function with more robust error checking
  function updateBadge(enabled) {
    try {
      if (typeof chrome !== 'undefined' && chrome.action && chrome.action.setBadgeText) {
        chrome.action.setBadgeText({ 
          text: enabled ? "ON" : "OFF" 
        });
        chrome.action.setBadgeBackgroundColor({ 
          color: enabled ? "#0a0" : "#a00" 
        });
      }
    } catch (error) {
      console.error("Error updating badge:", error);
    }
  }
  
  // Load settings from storage or use defaults
  function loadSettings() {
    chrome.storage.local.get(['isEnabled', 'blacklist'], (result) => {
      if (result.isEnabled !== undefined) {
        globalSettings.isEnabled = result.isEnabled;
      }
      
      if (Array.isArray(result.blacklist)) {
        globalSettings.blacklist = result.blacklist;
      }
      
      updateBadge(globalSettings.isEnabled);
    });
  }
  
  // Initialize extension
  chrome.runtime.onInstalled.addListener(() => {
    // Initialize default settings
    chrome.storage.local.set({
      isEnabled: true,
      blacklist: []
    });
    
    updateBadge(true);
    console.log("Extension installed");
  });
  
  // Handle messages from popup or content scripts
  chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.type === "updateBadge") {
      updateBadge(message.enabled);
    }
    
    // Always return true if you plan to respond asynchronously
    return true;
  });
  
  // Handle keyboard shortcuts safely
  try {
    if (typeof chrome !== 'undefined' && chrome.commands) {
      chrome.commands.onCommand.addListener((command) => {
        if (command === "toggle-rounding") {
          chrome.storage.local.get("isEnabled", ({ isEnabled }) => {
            const newState = !isEnabled;
            chrome.storage.local.set({ isEnabled: newState });
            updateBadge(newState);
          });
        }
      });
    }
  } catch (error) {
    console.error("Error setting up commands:", error);
  }
  
  // Listen for storage changes
  chrome.storage.onChanged.addListener((changes) => {
    if (changes.isEnabled) {
      globalSettings.isEnabled = changes.isEnabled.newValue;
      updateBadge(globalSettings.isEnabled);
    }
    
    if (changes.blacklist) {
      globalSettings.blacklist = changes.blacklist.newValue || [];
    }
  });
  
  // Load settings when background script starts
  loadSettings();