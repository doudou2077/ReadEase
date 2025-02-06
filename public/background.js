import { generateContent } from './api.js';

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
    if (message.action === "simplifyText") {
        const prompt = "Please simplify the following text further while maintaining its core meaning. Make it even simpler than before:";
        
        generateContent(prompt, message.text)
            .then(simplifiedText => {
                sendResponse({ simplifiedText });
            })
            .catch(error => {
                console.error("API Error:", error);
                sendResponse({ error: "Failed to simplify text" });
            });
        
        return true; // Required for async response
    }

    console.log("Background received text:", message.text);
    console.log("Background script received message:", message);
    if (message.action === "openSidePanel") {
        chrome.sidePanel.open({ windowId: sender.tab.windowId })
            .then(() => {
                // Wait for sidepanel to be ready
                return new Promise((resolve) => {
                    const checkReady = () => {
                        if (sidePanelReady) {
                            resolve();
                        } else {
                            setTimeout(checkReady, 100);
                        }
                    };
                    checkReady();
                });
            })
            .then(async () => {
                let prompt;
                switch (message.feature) {
                    case "simplify":
                        prompt = "Please simplify the following text while maintaining its meaning:";
                        break;
                    case "summarize":
                        prompt = "Please provide a concise summary of the following text:";
                        break;
                    case "tts":
                        prompt = "Please convert this text to a more speech-friendly format:";
                        break;
                }

                try {
                    const generatedContent = await generateContent(prompt, message.text);
                    return chrome.runtime.sendMessage({
                        target: "sidepanel",
                        feature: message.feature,
                        text: message.text,
                        response: generatedContent
                    });
                } catch (error) {
                    console.error("API Error:", error);
                    return chrome.runtime.sendMessage({
                        target: "sidepanel",
                        feature: message.feature,
                        text: message.text,
                        error: "Failed to generate content. Please try again."
                    });
                }
            })
            .then(() => {
                console.log("Message sent to side panel");
            })
            .catch((error) => {
                console.error("Error:", error);
            });
    }
    return true;
});