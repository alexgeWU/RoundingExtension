document.addEventListener('DOMContentLoaded', async () => {
    const toggleSwitch = document.getElementById("toggle");
    const statusText = document.getElementById("status");
  
    // Get the current state of rounding from chrome.storage.local
    const { isEnabled } = await chrome.storage.local.get("isEnabled");
  
    // Ensure 'isEnabled' is initialized if it's not set
    if (isEnabled === undefined) {
      chrome.storage.local.set({ isEnabled: true });
    }
  
    // Set the toggle state based on 'isEnabled'
    toggleSwitch.checked = isEnabled;
  
    // Update the status message based on the current state
    if (isEnabled) {
      statusText.textContent = "Rounding is currently enabled.";
    } else {
      statusText.textContent = "Rounding is currently disabled.";
    }
  
    // Handle the toggle switch change event
    toggleSwitch.addEventListener("change", async () => {
      const newState = toggleSwitch.checked;  // Get the new state of the toggle
  
      // Save the updated state to chrome.storage.local
      await chrome.storage.local.set({ isEnabled: newState });
  
      // Update status text based on the new state
      if (newState) {
        statusText.textContent = "Rounding is now enabled.";
      } else {
        statusText.textContent = "Rounding is now disabled.";
      }
  
      // Optionally update the extension's badge or any other indicators
      chrome.runtime.sendMessage({ type: "updateBadge", enabled: newState });
    });
  });
  