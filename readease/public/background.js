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

// Keep track of sidepanel state
let sidePanelReady = false;

// Listen for messages from sidepanel to know when it's ready
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.action === "sidepanel_ready") {
        sidePanelReady = true;
        return;
    }
});

// Listen for messages from content script
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    console.log("Background received text:", message.text);
    console.log("Background script received message:", message);
    if (message.action === "openSidePanel") {
        chrome.sidePanel.open({ windowId: sender.tab.windowId })
            .then(() => {
                // Wait for sidepanel to be ready before sending message
                return new Promise((resolve) => {
                    const checkReady = () => {
                        if (sidePanelReady) {
                            resolve();
                        } else {
                            setTimeout(checkReady, 100); // Check every 100ms
                        }
                    };
                    checkReady();
                });
            })
            .then(() => {
                console.log("Side panel ready, sending message");
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