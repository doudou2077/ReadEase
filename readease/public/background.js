
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
