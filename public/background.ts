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
let prompt = ''

// Listen for messages from sidepanel to know when it's ready
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.action === "sidepanel_ready") {
        sidePanelReady = true;
        return;
    }

    if (message.action === "simplifyFurther") {
        console.log("=== Background simplifyFurther Handler ===");
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

        prompt = promptTemplate.replace('{{text}}', message.text);
        console.log("Using prompt:", prompt);
    }

    //     generateContent(prompt)
    //         .then(response => {
    //             console.log("=== Simplify further API Response ===");
    //             console.log("Raw response:", response);

    //             // Parse the response
    //             const lines = response.split('\n');
    //             const simplifiedText = lines.find(l => l.startsWith('Simplified text:'))?.replace('Simplified text:', '').trim();
    //             const currentLevel = lines.find(l => l.startsWith('Current Grade Level:'))?.split('.')[0].replace('Current Grade Level:', '').trim();
    //             const remainingLevels = parseInt(lines.find(l => l.includes('Remaining simplification levels:'))?.split(':')[1].trim());

    //             console.log("Parsed values:", {
    //                 simplifiedText: !!simplifiedText,
    //                 currentLevel,
    //                 remainingLevels
    //             });

    //             if (!simplifiedText || !currentLevel) {
    //                 throw new Error('Invalid API response format');
    //             }

    //             console.log("Parsed response:", { simplifiedText, currentLevel, remainingLevels });
    //             // sendResponse({
    //             //     simplifiedText,
    //             //     currentLevel,
    //             //     remainingLevels
    //             // });
    //             chrome.runtime.sendMessage({
    //                 target: "sidepanel",
    //                 feature: message.feature,
    //                 text: message.text,
    //                 response: simplifiedText,
    //                 currentLevel: currentLevel,
    //                 remainingLevels: remainingLevels,
    //                 readability: message.readability
    //             }, (response) => {
    //                 if (chrome.runtime.lastError) {
    //                     console.error("Error sending message to side panel:", chrome.runtime.lastError);
    //                 } else {
    //                     console.log("Message sent successfully to side panel:", response);
    //                 }
    //             })
    //         })
    //         .catch(error => {
    //             console.error("=== Error in simplifyFurther ===");
    //             console.error("Error details:", error);
    //             sendResponse({
    //                 error: error.message || "Failed to simplify text"
    //             });
    //         });

            
    // }

    console.log("Background received text:", message.text);
    if (message && message.feature === "simplify") {
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
                let promptTemplate;
                let currentLevel;  
                let getSimplificationLevelAndPrompt;  

                switch (message.feature) {
                    case "simplify":
                        currentLevel = message.readability.readingLevel;
                        promptTemplate = SIMPLIFICATION_PROMPTS[currentLevel];
                        console.log("Selected prompt for level:", currentLevel, promptTemplate);
                        
                        if (!promptTemplate) {
                            console.error('No prompt found for grade level:', currentLevel);
                            promptTemplate = "Please simplify the following text while maintaining its meaning:";
                        }

                        getSimplificationLevelAndPrompt = async () => {
                            const result = await chrome.storage.local.get(['simplificationLevel']);
                            const simplificationLevel = result.simplificationLevel; // Get the simplification level
                            console.log('Current simplification level:', simplificationLevel);

                            // If the current simplification level is null, simplify the selected text by one level
                            if (simplificationLevel === null) {
                                // Use the prompt to simplify the text
                                prompt = promptTemplate.replace('{{text}}', message.text);
                                console.log("Using prompt:", prompt);
                            } else {
                                // Handle the case where simplificationLevel is not null
                                console.log("Simplification level is set:", simplificationLevel);
                                switch(simplificationLevel) {
                                    case 1:
                                        promptTemplate = SIMPLIFICATION_PROMPTS["College Graduate (17+)"]
                                        break
                                    case 2:
                                        promptTemplate = SIMPLIFICATION_PROMPTS["College (13-16)"]
                                        break
                                    case 3:
                                        promptTemplate = SIMPLIFICATION_PROMPTS["High School (9-12)"]
                                        break
                                    case 4:
                                        promptTemplate = SIMPLIFICATION_PROMPTS["Middle School (6-8)"]
                                        break
                                    case 5:
                                        promptTemplate = SIMPLIFICATION_PROMPTS["Elementary (1-5)"]
                                        break
                                }
                                // Get prompt template based on current level
                                console.log("Prompt template found:", !!promptTemplate);

                                if (!promptTemplate) {
                                    console.error("No prompt template found for level:", message.currentLevel);
                                    sendResponse({ error: "Invalid grade level" });
                                    return true;
                                }

                                prompt = promptTemplate.replace('{{text}}', message.text);
                                console.log("Using prompt:", prompt);
                            }
                        }
                        // Call the function
                        getSimplificationLevelAndPrompt();
                        return true; // Indicate that the response will be sent asynchronously
                    case "summarize":
                        prompt = "Please provide a concise summary of the following text:";
                        break;
                    case "tts":
                        prompt = "Please convert this text to a more speech-friendly format:";
                        break;
                }
            })
    }
    generateContent(prompt)
            .then(response => {
                console.log("=== Simplify API Response ===");
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
                chrome.runtime.sendMessage({
                    target: "sidepanel",
                    feature: message.feature,
                    text: message.text,
                    response: simplifiedText,
                    currentLevel: currentLevel,
                    remainingLevels: remainingLevels,
                    readability: message.readability
                }, (response) => {
                    if (chrome.runtime.lastError) {
                        console.error("Error sending message to side panel:", chrome.runtime.lastError);
                    } else {
                        console.log("Message sent successfully to side panel:", response);
                    }
                })
            })

        // return chrome.runtime.sendMessage({
        //     target: "sidepanel",
        //     feature: message.feature,
        //     text: message.text,
        //     response: simplifiedText,
        //     currentLevel: currentLevel,
        //     remainingLevels: remainingLevels,
        //     readability: message.readability
        // });
        // Send the message to the side panel
        
    return true
})
