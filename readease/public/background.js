chrome.action.onClicked.addListener((tab) => {
    // Inject the content script into the active tab
    if (tab.id !== undefined) {
        chrome.scripting.executeScript({
            target: { tabId: tab.id },
            files: ["content.js"]
        });
    }
  });

  