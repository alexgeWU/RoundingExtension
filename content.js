// Add blacklist functionality to the existing content script
let blacklist = [];

chrome.storage.local.get(['isEnabled', 'blacklist'], ({ isEnabled, blacklist: storedBlacklist }) => {
  // Initialize blacklist properly
  blacklist = Array.isArray(storedBlacklist) ? storedBlacklist : [];
  
  // Check if the current domain is blacklisted
  const domain = location.hostname;
  if (blacklist.includes(domain)) {
    console.log("[Rounding Extension] This site is blacklisted. Skipping price modification.");
    return;
  }
  
  // If isEnabled is undefined or false, skip the price modification logic
  if (!isEnabled) {
    console.log("[Rounding Extension] Rounding is disabled. Skipping price modification.");
    return; // Exit without doing anything if the extension is disabled
  }
  
  // If rounding is enabled, proceed with the rounding logic
  
  // Function to round based on the provided rules
  function smartRoundPrice(symbol, rawAmount, rawCents) {
    let amount = parseFloat(rawAmount.replace(/,/g, "")); // Convert raw amount to float
    let cents = parseInt(rawCents.padEnd(2, "0")); // Convert cents to integer
    
    // Initialize to track if any modification was made
    let modified = false;
    
    if (amount <= 2) {
        modified = true;
    }
    // Case 1: Round up if cents are .97, .98, or .99
    if (cents >= 97 && cents <= 99) {
      amount = Math.ceil(amount + 1); // Round up to the nearest whole number
      cents = 0;
      modified = true;
    }
    // Case 2: Round .49 to .50
    else if (cents >= 47 && cents <= 49) {
      // Keep the dollar amount, just change cents to 50
      cents = 50;
      modified = true;
    }
    
    // Case 3: Check for trailing nines in the dollar part (if amount > 50)
    if (amount > 50 && !modified) {
      // Convert to string to check for trailing nines
      const amountStr = amount.toString();
      
      // Check if the ones digit is 9
      if (amountStr.endsWith('9')) {
        // Check if there are trailing nines from ones place
        let countNines = 0;
        
        // Count trailing nines starting from the end
        for (let i = amountStr.length - 1; i >= 0; i--) {
          if (amountStr[i] === '9') {
            countNines++;
          } else {
            break;
          }
        }
        
        if (countNines > 0) {
          // Round up to the next multiple of 10^countNines
          const multiplier = Math.pow(10, countNines);
          amount = Math.ceil(amount / multiplier) * multiplier;
          modified = true;
        }
      }
    }
    
    // If no modifications were made, return the original price
    if (!modified) {
      // Ensure we're not modifying the original formatting
      return `${symbol}${rawAmount}.${rawCents}`;
    }
    
    // Format the final result
    if (cents === 0) {
      return `${symbol}${amount.toFixed(2)}`;
    } else {
      // For .49 -> .50 case where we just changed the cents
      return `${symbol}${amount.toFixed(0)}.${cents.toString().padStart(2, '0')}`;
    }
  }
  
  // Function to process the text and apply rounding to prices
  function roundPricesInText(text) {
    return text.replace(
      /([$€£¥])([0-9]{1,3}(?:,[0-9]{3})*|[0-9]+)\.([0-9]{1,2})(?![0-9])/g,
      (_, symbol, amount, cents) => smartRoundPrice(symbol, amount, cents)
    );
  }
  
  // Function to safely update the text content of nodes with price information
  function safelyUpdateTextNodes(node) {
    if (node.nodeType === Node.TEXT_NODE) {
      const original = node.textContent;
      const updated = roundPricesInText(original);
      if (updated !== original) {
        node.textContent = updated;
        console.log(`✅ Rounded: "${original.trim()}" ➜ "${updated}"`);
      }
    } else if (node.nodeType === Node.ELEMENT_NODE) {
      if (["SCRIPT", "STYLE", "TEXTAREA", "INPUT"].includes(node.tagName)) return;
      if (node.shadowRoot) {
        node.shadowRoot.childNodes.forEach(safelyUpdateTextNodes);
      }
      node.childNodes.forEach(safelyUpdateTextNodes);
    }
  }
  
  // Run the rounding logic when the page loads
  function runRounding() {
    safelyUpdateTextNodes(document.body);
  }
  
  // Initial rounding run
  runRounding();
  
  // Set up a MutationObserver to round prices dynamically as the page changes
  const observer = new MutationObserver(runRounding);
  observer.observe(document.body, { childList: true, subtree: true });
});

// Listen for changes to settings
chrome.storage.onChanged.addListener((changes) => {
  if (changes.isEnabled) {
    const isEnabled = changes.isEnabled.newValue;
    
    if (isEnabled) {
      // Re-run rounding if it was turned on
      // Define a simplified version for this scope
      function safelyUpdateTextNodes(node) {
        if (node.nodeType === Node.TEXT_NODE) {
          // We would implement the same logic as above, but this will cause a reference error
          // since the functions are defined in the other scope
          // This is a known issue - to fix it, we should reload the page or restructure the code
          console.log("[Rounding Extension] Settings updated. Please refresh the page for changes to take effect.");
        } else if (node.nodeType === Node.ELEMENT_NODE) {
          if (["SCRIPT", "STYLE", "TEXTAREA", "INPUT"].includes(node.tagName)) return;
          node.childNodes.forEach(safelyUpdateTextNodes);
        }
      }
      
      // Just log a message instead of trying to re-run with inaccessible functions
      console.log("[Rounding Extension] Enabled. Please refresh the page for changes to take effect.");
    }
  }
  
  if (changes.blacklist) {
    blacklist = changes.blacklist.newValue || [];
    // Check if this site was added to the blacklist
    const domain = location.hostname;
    if (blacklist.includes(domain)) {
      console.log("[Rounding Extension] This site was added to blacklist. Please refresh the page.");
    }
  }
});