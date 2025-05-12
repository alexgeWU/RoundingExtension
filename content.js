chrome.storage.local.get(['isEnabled'], ({ isEnabled }) => {
    // If isEnabled is undefined or false, skip the price modification logic
    if (!isEnabled) {
      console.log("[Rounding Extension] Rounding is disabled. Skipping price modification.");
      return;  // Exit without doing anything if the extension is disabled
    }
  
    // If rounding is enabled, proceed with the rounding logic
    const domain = location.hostname;
  
    const mode = 'smart';  // We're using only the smart rounding mode for this example
  
    // Function to round based on the provided rules
    function smartRoundPrice(symbol, rawAmount, rawCents) {
      let amount = parseFloat(rawAmount.replace(/,/g, ""));  // Convert raw amount to float
      let cents = parseInt(rawCents.padEnd(2, "0"));  // Convert cents to integer
  
      // Round up if cents are .97, .98, or .99 (or if the amount ends in a 9)
      if (cents >= 97 && cents <= 99) {
        amount = Math.ceil(amount);  // Round up to the nearest whole number
        cents = 0;
      }
      // Round .49 to .50
      else if (cents === 49) {
        amount = Math.floor(amount);
        cents = 50;
      }
  
      // If the amount ends with a .99, .98, or .97, round up
      if (amount % 1 === 0 && rawAmount.includes('9')) {
        amount = Math.ceil(amount); // Round up to the nearest whole number
      }
  
      // If it's a whole number (i.e., no cents), don't modify the price
      if (amount % 1 === 0) {
        return `${symbol}${amount.toFixed(2)}`;  // Ensure two decimals
      }
  
      // Round to the next multiple of 100 if the amount is close to those boundaries
      if (amount % 100 !== 0) {
        amount = Math.ceil(amount / 100) * 100;
      }
  
      // Apply rounding logic for larger amounts (199 → 200, 999 → 1000, etc.)
      if (amount % 100 === 0) {
        return `${symbol}${amount.toFixed(2)}`;
      }
  
      // Return the final formatted amount with two decimal places
      return `${symbol}${amount.toFixed(2)}`;
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
  