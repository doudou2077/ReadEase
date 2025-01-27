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
    console.log("Background received text:", message.text);
    console.log("Background script received message:", message);
    if (message.action === "openSidePanel") {
        chrome.sidePanel.open({ windowId: sender.tab.windowId })
            .then(() => {
                console.log("Side panel opened, sending message");
                return chrome.runtime.sendMessage({
                    target: "sidepanel",
                    feature: message.feature,
                    text: message.text
                });
            })
            .then(() => {
                console.log("Message sent to side panel");
            })
            .catch((error) => {
                console.error("Error:", error);
            });
    }
    return true; // Keep the message channel open for async responses
});