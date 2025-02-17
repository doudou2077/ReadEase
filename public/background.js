import { generateContent } from './api.js';
import { GRADE_LEVELS, SIMPLIFICATION_PROMPTS } from './gradeConfig.js';

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
        console.log("=== Background SimplifyText Handler ===");
        console.log("Message received:", message);
        console.log("Available grade levels:", Object.values(GRADE_LEVELS));
        console.log("Looking for level:", message.currentLevel);

        // Validate input
        if (!message.text || !message.currentLevel) {
            console.error("Invalid message format:", message);
            sendResponse({ error: "Invalid message format" });
            return true;
        }

        // Check if already at kindergarten level
        if (message.currentLevel === GRADE_LEVELS.BELOW_KINDERGARTEN ||
            message.currentLevel === "Kindergarten (K)") {
            console.log("Text already at simplest level, sending response:", {
                error: "Text is already at the simplest level",
                currentLevel: GRADE_LEVELS.BELOW_KINDERGARTEN,
                remainingLevels: 0
            });
            sendResponse({
                error: "Text is already at the simplest level",
                currentLevel: GRADE_LEVELS.BELOW_KINDERGARTEN,
                remainingLevels: 0
            });
            return true;
        }

        // Get prompt template based on current level
        const promptTemplate = SIMPLIFICATION_PROMPTS[message.currentLevel];
        console.log("Prompt template found:", !!promptTemplate);

        if (!promptTemplate) {
            console.error("No prompt template found for level:", message.currentLevel);
            sendResponse({ error: "Invalid grade level" });
            return true;
        }

        const prompt = promptTemplate.replace('{{text}}', message.text);
        console.log("Using prompt:", prompt);

        generateContent(prompt)
            .then(response => {
                console.log("=== API Response ===");
                console.log("Raw response:", response);

                // Parse the response
                const lines = response.split('\n');
                const simplifiedText = lines.find(l => l.startsWith('Simplified text:'))?.replace('Simplified text:', '').trim();
                const currentLevel = lines.find(l => l.startsWith('Current Grade Level:'))?.split('.')[0].replace('Current Grade Level:', '').trim();
                const remainingLevels = parseInt(lines.find(l => l.includes('Remaining simplification levels:'))?.split(':')[1].trim());

                console.log("Parsed values:", {
                    simplifiedText: !!simplifiedText,
                    currentLevel,
                    remainingLevels
                });

                if (!simplifiedText || !currentLevel) {
                    throw new Error('Invalid API response format');
                }

                console.log("Parsed response:", { simplifiedText, currentLevel, remainingLevels });
                sendResponse({
                    simplifiedText,
                    currentLevel,
                    remainingLevels
                });
            })
            .catch(error => {
                console.error("=== Error in SimplifyText ===");
                console.error("Error details:", error);
                sendResponse({
                    error: error.message || "Failed to simplify text"
                });
            });


        return true;
    }

    console.log("Background received text:", message.text);
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
                        // Get the appropriate prompt based on the current grade level
                        const currentLevel = message.readability.readingLevel;
                        prompt = SIMPLIFICATION_PROMPTS[currentLevel];
                        console.log("Selected prompt for level:", currentLevel, prompt);
                        if (!prompt) {
                            console.error('No prompt found for grade level:', currentLevel);
                            prompt = "Please simplify the following text while maintaining its meaning:";
                        }
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
                    console.log("Raw API Response:", generatedContent);

                    // Parse the response
                    const lines = generatedContent.split('\n');
                    console.log("Split lines:", lines);
                    const simplifiedText = lines.find(l => l.startsWith('Simplified text:'))?.replace('Simplified text:', '').trim();
                    const currentLevel = lines.find(l => l.startsWith('Current Grade Level:'))?.split('.')[0].replace('Current Grade Level:', '').trim();
                    const remainingLevels = parseInt(lines.find(l => l.includes('Remaining simplification levels:'))?.split(':')[1].trim());

                    console.log("Parsed Response:", {
                        simplifiedText,
                        currentLevel,
                        remainingLevels
                    });

                    return chrome.runtime.sendMessage({
                        target: "sidepanel",
                        feature: message.feature,
                        text: message.text,
                        response: simplifiedText,
                        currentLevel: currentLevel,
                        remainingLevels: remainingLevels,
                        readability: message.readability
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