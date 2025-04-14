import { generateContent } from './api.js';
import { GRADE_LEVELS, SIMPLIFICATION_PROMPTS } from './gradeConfig.js';

// Function to update simplification level
export const updateSimplificationLevel = (level) => {
    chrome.storage.local.set({ simplificationLevel: level }, () => {
        console.log('Simplification level set to:', level);
    });
}

chrome.action.onClicked.addListener((tab) => {
    if (tab.id != null && tab.url && !tab.url.startsWith("chrome://")) {
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
let prompt = '';

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

        // Split text into bullet points if it contains them
        const lines = message.text.split('\n');
        const bulletPoints = lines.filter(line => line.trim().startsWith('*'));
        const isInBulletFormat = bulletPoints.length > 0;

        let prompt;
        if (isInBulletFormat) {
            // Create a prompt that maintains bullet point format
            const promptTemplate = SIMPLIFICATION_PROMPTS[message.currentLevel];
            if (!promptTemplate) {
                console.error("No prompt template found for level:", message.currentLevel);
                sendResponse({ error: "Invalid grade level" });
                return true;
            }
            prompt = `${promptTemplate}
            Please simplify each bullet point while maintaining the exact same format. Keep the structure with "*" bullet points but use simpler language for each point:
            ${message.text}
            Response format:
            Summary
            [Heading]
            * Simplified point 1
            * Simplified point 2
            etc.`;
        } else {
            // Use regular prompt for non-bullet point text
            const promptTemplate = SIMPLIFICATION_PROMPTS[message.currentLevel];
            if (!promptTemplate) {
                console.error("No prompt template found for level:", message.currentLevel);
                sendResponse({ error: "Invalid grade level" });
                return true;
            }
            prompt = promptTemplate.replace('{{text}}', message.text);
        }

        console.log("Using prompt:", prompt);

        // Validate input
        if (!message.text || !message.currentLevel) {
            console.error("Invalid message format:", message);
            sendResponse({ error: "Invalid message format" });
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

        generateContent(prompt)
            .then(response => {
                console.log("=== API Response ===");
                console.log("Raw response:", response);

                // Parse the response
                const lines = response.split('\n');
                console.log("Split lines:", lines);

                // Find the line that starts with 'Simplified text:'
                const simplifiedTextStartIndex = lines.findIndex(l => l.startsWith('Simplified text:'));
                
                // Extract all text after 'Simplified text:' until the next section
                let simplifiedText = '';
                if (simplifiedTextStartIndex !== -1) {
                    // Get the first line after removing the 'Simplified text:' prefix
                    simplifiedText = lines[simplifiedTextStartIndex].replace('Simplified text:', '').trim();
                    
                    // Add all subsequent lines until we hit another section or end of response
                    for (let i = simplifiedTextStartIndex + 1; i < lines.length; i++) {
                        // Stop if we hit another section header
                        if (lines[i].startsWith('Current Grade Level:') || 
                            lines[i].includes('Remaining simplification levels:')) {
                            break;
                        }
                        // Add the line to the simplified text
                        simplifiedText += '\n' + lines[i].trim();
                    }
                }
                
                // Clean up any remaining "Current Grade Level" or "Remaining simplification levels" text
                simplifiedText = simplifiedText.replace(/Current Grade Level:.*$/gm, '');
                simplifiedText = simplifiedText.replace(/Remaining simplification levels:.*$/gm, '');
                simplifiedText = simplifiedText.trim();
                
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
    if (message && message.feature === "simplify") {
        console.log("=== Initial Simplify Handler ===");
        console.log("Message received:", message);

        if (!sender.tab || typeof sender.tab.windowId !== 'number') {
            console.error("Invalid sender or window ID");
            return;
        }

        chrome.sidePanel.open({ windowId: sender.tab.windowId })
            .then(() => {
                console.log("Side panel opened, waiting for ready state");
                // Wait for sidepanel to be ready
                return new Promise((resolve) => {
                    const checkReady = () => {
                        if (sidePanelReady) {
                            console.log("Side panel ready");
                            resolve();
                        } else {
                            console.log("Waiting for side panel...");
                            setTimeout(checkReady, 100);
                        }
                    };
                    checkReady();
                });
            })
            .then(async () => {
                // Show loading spinner first
                chrome.runtime.sendMessage({
                    target: "sidepanel",
                    action: "showLoading",
                    feature: message.feature
                });
                let promptTemplate;
                let currentLevel;
                let getSimplificationLevelAndPrompt;
                console.log("Processing with level:", currentLevel);

                if (!message.text) {
                    console.error("No text provided in message");
                    return;
                }

                switch (message.feature) {
                    case "simplify":
                        currentLevel = message.readability.readingLevel;
                        console.log("Current text level:", currentLevel);

                        // Check if already at kindergarten level
                        if (currentLevel === GRADE_LEVELS.BELOW_KINDERGARTEN ||
                            currentLevel === "Kindergarten (K)") {
                            console.log("Text already at simplest level, returning original");
                            // Send response back to sidepanel
                            chrome.runtime.sendMessage({
                                target: "sidepanel",
                                feature: message.feature,
                                text: message.text,
                                response: message.text, // Send the original text
                                currentLevel: GRADE_LEVELS.BELOW_KINDERGARTEN,
                                remainingLevels: 0,
                                readability: message.readability
                            });
                            return true;
                        }

                        promptTemplate = SIMPLIFICATION_PROMPTS[currentLevel];
                        console.log("Selected prompt for level:", currentLevel, promptTemplate);

                        if (!promptTemplate) {
                            console.error('No prompt found for grade level:', currentLevel);
                            promptTemplate = "Please simplify the following text while maintaining its meaning:";
                        }

                        getSimplificationLevelAndPrompt = async () => {
                            const result = await chrome.storage.local.get(['simplificationLevel']);
                            console.log("Retrieved from storage:", result);
                            const simplificationLevel = result.simplificationLevel; // Get the simplification level
                            console.log('Current simplification level:', simplificationLevel);

                            // If the current simplification level is null, simplify the selected text by one level
                            if (simplificationLevel === null) {
                                console.log("No simplification level set, using default behavior");
                                // Use the prompt to simplify the text
                                prompt = promptTemplate.replace('{{text}}', message.text);
                                console.log("Using prompt:", prompt);
                                //update simplication level to the reading level of the original text
                                switch (simplificationLevel) {
                                    case 'College Graduate (17+)':
                                        updateSimplificationLevel(1);
                                        break;
                                    case 'College (13-16)':
                                        updateSimplificationLevel(2);
                                        break;
                                    case 'High School (9-12)':
                                        updateSimplificationLevel(3);
                                        break;
                                    case 'Middle School (6-8)':
                                        updateSimplificationLevel(4);
                                        break;
                                    case 'Elementary (1-5)':
                                        updateSimplificationLevel(5);
                                        break;
                                }

                            } else {
                                // Handle the case where simplificationLevel is not null
                                console.log("Using stored simplification level:", simplificationLevel);
                                switch (simplificationLevel) {
                                    case 1:
                                        promptTemplate = SIMPLIFICATION_PROMPTS["College Graduate (17+)"];
                                        break;
                                    case 2:
                                        promptTemplate = SIMPLIFICATION_PROMPTS["College (13-16)"];
                                        break;
                                    case 3:
                                        promptTemplate = SIMPLIFICATION_PROMPTS["High School (9-12)"];
                                        break;
                                    case 4:
                                        promptTemplate = SIMPLIFICATION_PROMPTS["Middle School (6-8)"];
                                        break;
                                    case 5:
                                        promptTemplate = SIMPLIFICATION_PROMPTS["Elementary (1-5)"];
                                        break;
                                }
                                // Get prompt template based on current level
                                console.log("Final prompt template:", promptTemplate);
                                console.log("Final prompt:", prompt);

                                if (!promptTemplate) {
                                    console.error("No prompt template found for level:", message.currentLevel);
                                    sendResponse({ error: "Invalid grade level" });
                                    return true;
                                }

                                prompt = promptTemplate.replace('{{text}}', message.text);
                                console.log("Using prompt:", prompt);
                            }
                        };
                        // Call the function
                        await getSimplificationLevelAndPrompt();

                        console.log("=== Calling API ===");
                        generateContent(prompt)
                            .then(response => {
                                console.log("=== Simplify API Response ===");
                                console.log("Raw response:", response);

                                // Parse the response
                                const lines = response.split('\n');
                                console.log("Split lines:", lines);

                                // Find the line that starts with 'Simplified text:'
                                const simplifiedTextStartIndex = lines.findIndex(l => l.startsWith('Simplified text:'));
                                
                                // Extract all text after 'Simplified text:' until the next section
                                let simplifiedText = '';
                                if (simplifiedTextStartIndex !== -1) {
                                    // Get the first line after removing the 'Simplified text:' prefix
                                    simplifiedText = lines[simplifiedTextStartIndex].replace('Simplified text:', '').trim();
                                    
                                    // Add all subsequent lines until we hit another section or end of response
                                    for (let i = simplifiedTextStartIndex + 1; i < lines.length; i++) {
                                        // Stop if we hit another section header
                                        if (lines[i].startsWith('Current Grade Level:') || 
                                            lines[i].includes('Remaining simplification levels:')) {
                                            break;
                                        }
                                        // Add the line to the simplified text
                                        simplifiedText += '\n' + lines[i].trim();
                                    }
                                }
                                
                                // Clean up any remaining "Current Grade Level" or "Remaining simplification levels" text
                                simplifiedText = simplifiedText.replace(/Current Grade Level:.*$/gm, '');
                                simplifiedText = simplifiedText.replace(/Remaining simplification levels:.*$/gm, '');
                                simplifiedText = simplifiedText.trim();
                                
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

                                console.log("Sending message to sidepanel");
                                console.log("Parsed response:", { simplifiedText, currentLevel, remainingLevels });
                                return chrome.runtime.sendMessage({
                                    target: "sidepanel",
                                    feature: message.feature,
                                    text: message.text,
                                    response: simplifiedText,
                                    currentLevel: currentLevel,
                                    remainingLevels: remainingLevels,
                                    readability: message.readability
                                }, () => {
                                    if (chrome.runtime.lastError) {
                                        console.error("Runtime error:", chrome.runtime.lastError);
                                    } else {
                                        console.log("Message sent successfully to sidepanel");
                                    }
                                });
                            })
                            .catch(error => {
                                console.error("Error in API call or parsing:", error);
                                // Send error to sidepanel
                                return chrome.runtime.sendMessage({
                                    target: "sidepanel",
                                    feature: message.feature,
                                    error: error.message
                                }, () => {
                                    if (chrome.runtime.lastError) {
                                        console.error("Runtime error when sending error:", chrome.runtime.lastError);
                                    }
                                });
                            });
                        return true;
                }
            });
    }
    if (message.action === "openSidePanel" && message.feature === "summarize") {
        console.log("=== Background summarize Handler ===");
        console.log("Message received:", message);
        if (message.isUrl) {
            console.log("Summarizing URL:", message.text);
        } else {
            console.log("Summarizing text:", message.text);
        }
        if (!sender.tab || typeof sender.tab.windowId !== 'number') {
            console.error("Invalid sender or window ID");
            return;
        }

        chrome.sidePanel.open({ windowId: sender.tab.windowId })
            .then(() => {
                console.log("Side panel opened for summarize, waiting for ready state");
                // Wait for sidepanel to be ready
                return new Promise((resolve) => {
                    const checkReady = () => {
                        if (sidePanelReady) {
                            console.log("Side panel ready for summarization");
                            resolve();
                        } else {
                            console.log("Waiting for side panel...");
                            setTimeout(checkReady, 100);
                        }
                    };
                    checkReady();
                });
            })
            .then(async () => {
                if (!message.text) {
                    console.error("No text provided in message");
                    return;
                }

                let basePrompt = `As an advanced AI with expertise in language comprehension and summarization, 
                your assignment is to analyze the text below or the url and distill it into a succinct abstract paragraph. 
                Your summary should encapsulate the most critical points, 
                offering a coherent and easily understandable synopsis that allows one to grasp the crux of the matter without having to peruse the entire text. 
                Exclude any irrelevant details or off-topic points. Furnish only the output, free of superfluous information or quotation marks. or formatting.
                Use bullet points for clarity and readability on key aspects with headings.`;

                let summarizePrompt;

                if (message.isUrl) {
                    console.log("Summarizing URL:", message.text);
                    summarizePrompt = `${basePrompt}

                                        Please visit the following URL and provide a concise summary of its main content based on the above instructions:
                                        ${message.text}`;
                } else {
                    console.log("Summarizing text:", message.text);
                    summarizePrompt = `${basePrompt}

                                        Content to summarize:
                                        ${message.text}`;
                }

                console.log("=== Calling API for Summarization ===");
                generateContent(summarizePrompt)
                    .then(response => {
                        // Send to content script for readability calculation
                        chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
                            if (!tabs || tabs.length === 0) {
                                console.error("No active tabs found");
                                // Send response directly to sidepanel if no active tab is found
                                chrome.runtime.sendMessage({
                                    target: "sidepanel",
                                    feature: "summarize",
                                    text: message.text,
                                    response: response,
                                    type: message.isUrl ? "url" : "text"
                                });
                                return;
                            }
                            
                            try {
                                chrome.tabs.sendMessage(tabs[0].id, {
                                    action: "calculateReadabilityAndSendToSidepanel",
                                    text: response,
                                    originalText: message.text,
                                    isUrl: message.isUrl,
                                    type: message.isUrl ? "url" : "text"
                                }, (callbackResponse) => {
                                    // Check if there was an error sending the message
                                    if (chrome.runtime.lastError) {
                                        console.error("Error sending message to content script:", chrome.runtime.lastError);
                                        // Send response directly to sidepanel if content script is not available
                                        chrome.runtime.sendMessage({
                                            target: "sidepanel",
                                            feature: "summarize",
                                            text: message.text,
                                            response: response,
                                            type: message.isUrl ? "url" : "text"
                                        });
                                    }
                                });
                            } catch (error) {
                                console.error("Error in content script communication:", error);
                                // Send response directly to sidepanel if there's an error
                                chrome.runtime.sendMessage({
                                    target: "sidepanel",
                                    feature: "summarize",
                                    text: message.text,
                                    response: response,
                                    type: message.isUrl ? "url" : "text"
                                });
                            }
                        });
                    })
                    .catch(error => {
                        console.error("Error in summarization API call:", error);
                        return chrome.runtime.sendMessage({
                            target: "sidepanel",
                            feature: "summarize",
                            error: error.message
                        });
                    });
            });
        return true;
    }
}); 