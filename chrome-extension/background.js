// Create the context menu item when the extension is installed
chrome.runtime.onInstalled.addListener(() => {
  chrome.contextMenus.create({
    id: "rewrite-selection",
    title: "Rewrite with AI",
    contexts: ["selection"]
  });
});

// Handle the click on the context menu
chrome.contextMenus.onClicked.addListener((info, tab) => {
  if (info.menuItemId === "rewrite-selection") {
    // Save the selected text to local storage
    chrome.storage.local.set({ selectedText: info.selectionText });
    
    // Open the popup (or a new tab if popup isn't available)
    // In MV3, we can't open the popup programmatically, so we use a tab.
    const rewriteUrl = "https://rewrite-green.vercel.app/quick?text=" + encodeURIComponent(info.selectionText);
    chrome.tabs.create({ url: rewriteUrl });
  }
});