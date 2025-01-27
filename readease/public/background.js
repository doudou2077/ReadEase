
// // Allows users to open the side panel by clicking on the action toolbar icon
// chrome.sidePanel
//   .setPanelBehavior({ openPanelOnActionClick: true })
//   .catch((error) => console.error(error));

chrome.action.onClicked.addListener((tab) => {
    if (tab.id !== undefined && !tab.url.startsWith("chrome://")) {
        chrome.scripting.executeScript({
            target: { tabId: tab.id },
            files: ["content.js"]
        });
    } else {
        console.error("Cannot execute script on chrome:// URLs.");
    }
});
// Listen for messages from content script
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.action === "openSidePanel") {
        // Open the side panel
        chrome.sidePanel.open({ windowId: sender.tab.windowId });
        
        // Send the feature type to the side panel
        chrome.runtime.sendMessage({ 
            target: "sidepanel",
            feature: message.feature,
            text: message.text 
        });
    }
});