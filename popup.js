// Initialize the popup when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    const toggleElement = document.getElementById('toggle');
    const statusElement = document.getElementById('status');
    
    // Get current state from storage
    chrome.storage.local.get('isEnabled', function(data) {
      const isEnabled = data.isEnabled !== undefined ? data.isEnabled : true;
      
      // Update UI to match current state
      toggleElement.checked = isEnabled;
      statusElement.textContent = isEnabled ? 'Rounding is ON' : 'Rounding is OFF';
    });
    
    // Set up event listener for toggle change
    toggleElement.addEventListener('change', function() {
      const isEnabled = toggleElement.checked;
      
      // Update status text
      statusElement.textContent = isEnabled ? 'Rounding is ON' : 'Rounding is OFF';
      
      // Save to storage
      chrome.storage.local.set({ isEnabled: isEnabled });
      
      // Send message to background script to update badge
      chrome.runtime.sendMessage({
        type: 'updateBadge',
        enabled: isEnabled
      });
    });
  });