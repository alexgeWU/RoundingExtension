function updateBadge(enabled) { chrome.action.setBadgeText({ text: enabled ? "ON" : "OFF" }); chrome.action.setBadgeBackgroundColor({ color: enabled ? "#0a0" : "#a00" }); }
chrome.runtime.onInstalled.addListener(() => {
    chrome.storage.local.set({ enabled: true });
    updateBadge(true);
});

chrome.runtime.onInstalled.addListener(() => {
    console.log("Extension installed");
  });
  
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.type === "updateBadge") {
      const enabled = message.enabled ? "ON" : "OFF";
      chrome.action.setBadgeText({ text: enabled });
      chrome.action.setBadgeBackgroundColor({ color: enabled === "ON" ? "#0a0" : "#a00" });
    }
  });  

chrome.commands.onCommand.addListener((command) => {
    if (command === "toggle-rounding") {
        chrome.storage.local.get("enabled", ({ enabled }) => {
            const newState = !enabled;
            chrome.storage.local.set({ enabled: newState });
            updateBadge(newState);
        });
    }
});

chrome.storage.onChanged.addListener((changes) => {
    if (changes.enabled) {
        updateBadge(changes.enabled.newValue);
    }
});