import textReadability from 'text-readability';

console.log("Content script loaded");

export function getReadingLevelDescription(gradeLevel) {
  if (gradeLevel < 0) return "Below Kindergarten (K)";
  if (gradeLevel <= 5) return "Elementary (1-5)";
  if (gradeLevel <= 8) return "Middle School (6-8)";
  if (gradeLevel <= 12) return "High School (9-12)";
  if (gradeLevel <= 16) return "College (13-16)";
  return "College Graduate (17+)";
}


// Variable to store the selected text
let lastSelectedText = '';

const isTextCurrentlySelected = () => {
  const selection = window.getSelection();
  const currentText = selection ? selection.toString().trim() : '';
  return currentText === lastSelectedText && currentText.length > 0;
};

// Add a selection change listener
document.addEventListener('selectionchange', () => {
  const selection = window.getSelection();
  const newText = selection ? selection.toString().trim() : '';
  lastSelectedText = newText;  // Update lastSelectedText even if empty
  console.log("Text selection changed:", lastSelectedText);
});

// Function to create modal
const createModal = (selectedText) => {
  // Remove existing modal if it exists
  const existingModal = document.getElementById("readease-modal");
  if (existingModal) existingModal.remove();

  // Create a modal window
  const modal = document.createElement("div");
  modal.id = "readease-modal";
  modal.style.position = "fixed";
  modal.style.left = "85%";
  modal.style.top = "75%";
  modal.style.transform = "translate(-50%, -50%)";
  modal.style.backgroundColor = "white";
  modal.style.border = "1px solid #ccc";
  modal.style.padding = "20px";
  modal.style.zIndex = "10000";
  modal.style.width = "13%";
  modal.style.boxShadow = "0 4px 6px rgba(0, 0, 0, 0.1)";

  // Create buttons
  const createButton = (text) => {
    const button = document.createElement("button");
    button.textContent = text;
    button.style.width = "90%";
    button.style.margin = "10px";
    button.style.padding = "10px";
    button.style.border = "2px solid #ca80e8";
    button.style.backgroundColor = "#ca80e8";
    button.style.color = "white";
    button.style.borderRadius = "5px";
    button.style.cursor = "pointer";
    return button;
  };

  const simplifyButton = createButton("Simplify");
  const summarizeButton = createButton("Summarize");
  const textToSpeechButton = createButton("Text-to-Speech");

  // Add event listeners for buttons
  simplifyButton.addEventListener("click", () => {
    if (isTextCurrentlySelected()) {
      // Calculate readability level
      const gradeLevel = textReadability.fleschKincaidGrade(lastSelectedText);
      const readingLevel = getReadingLevelDescription(gradeLevel);

      // Add check for already simple text
      if (readingLevel === "Below Kindergarten") {
        alert("This text is already at the simplest level possible.");
        modal.remove();
        return;
      }

      console.log("Text Readability:", {
        text: lastSelectedText,
        gradeLevel: gradeLevel,
        readingLevel: readingLevel
      });

      console.log("Sending text to background:", lastSelectedText);
      chrome.runtime.sendMessage({
        action: "openSidePanel",
        feature: "simplify",
        text: lastSelectedText,
        readability: {
          gradeLevel: gradeLevel,
          readingLevel: readingLevel
        }
      }, (response) => {
        if (chrome.runtime.lastError) {
          console.error("Runtime error:", chrome.runtime.lastError);
        } else {
          console.log("Message sent successfully");
          modal.remove();
        }
      });
    } else {
      console.log("No text currently selected");
      alert("Please select some text first.");
      modal.remove();
    }
  });


  summarizeButton.addEventListener("click", () => {
    if (isTextCurrentlySelected()) {
      console.log("Summarize button clicked");
      chrome.runtime.sendMessage({
        action: "openSidePanel",
        feature: "summarize",
        text: lastSelectedText
      }, () => {
        modal.remove();
      });
    } else {
      console.log("No text currently selected");
      alert("Please select some text first.");
      modal.remove();
    }
  });

  textToSpeechButton.addEventListener("click", () => {
    if (isTextCurrentlySelected()) {
      console.log("Text-to-Speech button clicked");
      chrome.runtime.sendMessage({
        action: "openSidePanel",
        feature: "tts",
        text: lastSelectedText
      }, () => {
        modal.remove();
      });
    } else {
      console.log("No text currently selected");
      alert("Please select some text first.");
      modal.remove();
    }
  });

  // Append buttons to modal
  modal.appendChild(simplifyButton);
  modal.appendChild(summarizeButton);
  modal.appendChild(textToSpeechButton);

  // Append modal to document body
  document.body.appendChild(modal);

  return modal;
};
// Function to create a floating button
const createFloatingButton = () => {
  const button = document.createElement("button");
  button.textContent = "Simplify";
  button.style.position = "fixed";
  button.style.backgroundColor = "#ca80e8";
  button.style.color = "white";
  button.style.border = "none";
  button.style.borderRadius = "5px";
  button.style.padding = "10px";
  button.style.zIndex = "10000";
  button.style.cursor = "pointer";
  button.style.display = "none"; // Initially hidden

  // Add click event listener to the button
  button.addEventListener("click", () => {
    if (isTextCurrentlySelected()) {
      // Calculate readability level
      const gradeLevel = textReadability.fleschKincaidGrade(lastSelectedText);
      const readingLevel = getReadingLevelDescription(gradeLevel);

      // Add check for already simple text
      if (readingLevel === "Below Kindergarten") {
        alert("This text is already at the simplest level possible.");

        return;
      }

      console.log("Text Readability:", {
        text: lastSelectedText,
        gradeLevel: gradeLevel,
        readingLevel: readingLevel
      });

      console.log("Sending text to background:", lastSelectedText);
      chrome.runtime.sendMessage({
        action: "openSidePanel",
        feature: "simplify",
        text: lastSelectedText,
        readability: {
          gradeLevel: gradeLevel,
          readingLevel: readingLevel
        }
      }, (response) => {
        if (chrome.runtime.lastError) {
          console.error("Runtime error:", chrome.runtime.lastError);
        } else {
          console.log("Message sent successfully");

        }
      });
    } else {
      console.log("No text currently selected");
      alert("Please select some text first.");

    }
  });

  document.body.appendChild(button);
  return button;
};

// Create the floating button
const floatingButton = createFloatingButton();

// Update the position of the floating button based on text selection
const updateFloatingButtonPosition = () => {
  const selection = window.getSelection();
  if (selection.rangeCount > 0) {
    const range = selection.getRangeAt(0);
    const rect = range.getBoundingClientRect();
    floatingButton.style.left = `${rect.right + 10}px`; // Offset to the right
    floatingButton.style.top = `${rect.top}px`; // Align with the top of the selection
    floatingButton.style.display = "block"; // Show the button
  } else {
    floatingButton.style.display = "none"; // Hide the button if no text is selected
  }
};

// Show the button when the mouse is released after selecting text
document.addEventListener('mouseup', () => {
  const selection = window.getSelection();
  const newText = selection ? selection.toString().trim() : '';
  lastSelectedText = newText; // Update lastSelectedText even if empty
  if (newText) {
    updateFloatingButtonPosition(); // Update position if text is selected
  } else {
    floatingButton.style.display = "none"; // Hide the button if no text is selected
  }
});

// Hide the button when clicking outside
document.addEventListener('click', (event) => {
  const selection = window.getSelection();
  if (!selection.toString().trim()) {
    floatingButton.style.display = "none"; // Hide the button if no text is selected
  }
});




// Function to create and initialize hover icon
function createHoverIcon() {
  // Remove existing hover icon and modal if they exist
  let existingIcon = document.getElementById("hover-icon");
  let existingModal = document.getElementById("readease-modal");
  if (existingIcon) existingIcon.remove();
  if (existingModal) existingModal.remove();

  // Create the hover icon
  const hoverIcon = document.createElement("div");
  hoverIcon.id = "hover-icon";
  hoverIcon.style.position = "fixed";
  hoverIcon.style.left = "95%";
  hoverIcon.style.top = "90%";
  hoverIcon.style.transform = "translate(-50%, -50%)";
  hoverIcon.style.width = "50px";
  hoverIcon.style.height = "50px";
  hoverIcon.style.backgroundColor = "#ca80e8";
  hoverIcon.style.borderRadius = "50%";
  hoverIcon.style.display = "flex";
  hoverIcon.style.justifyContent = "center";
  hoverIcon.style.alignItems = "center";
  hoverIcon.style.cursor = "pointer";
  hoverIcon.style.zIndex = "9999";
  hoverIcon.style.color = "white";
  hoverIcon.style.fontWeight = "bold";
  hoverIcon.style.fontSize = "24px";
  hoverIcon.textContent = "R";

  // Prevent text deselection when clicking the hover icon
  hoverIcon.addEventListener('mousedown', (e) => {
    e.preventDefault();  // prevents text deselection
  });

  // Add click handler to the hover icon
  hoverIcon.addEventListener("click", (e) => {
    e.preventDefault();  // Prevent any default behavior
    console.log("Hover icon clicked, last selected text:", lastSelectedText);

    if (lastSelectedText && lastSelectedText.length > 0) {
      // Calculate readability when text is selected
      const gradeLevel = textReadability.fleschKincaidGrade(lastSelectedText);
      const readingLevel = getReadingLevelDescription(gradeLevel);
      console.log("Text Readability:", {
        text: lastSelectedText,
        gradeLevel: gradeLevel,
        readingLevel: readingLevel
      });

      console.log("Creating modal with text:", lastSelectedText);
      chrome.storage.local.set({
        selectedText: lastSelectedText,
        readability: {
          gradeLevel: gradeLevel,
          readingLevel: readingLevel
        }
      }, () => {
        console.log("Text stored in local storage");
        if (chrome.runtime.lastError) {
          console.error("Storage error:", chrome.runtime.lastError);
        }
        createModal(lastSelectedText);
      });
    } else {
      console.log("No text selected");
      alert("Please select some text first.");
    }
  });

  // Append the hover icon to the document body
  document.body.appendChild(hoverIcon);
  console.log("Hover icon created and added to page");
  return hoverIcon;
}

// Create the hover icon when the script loads
const hoverIcon = createHoverIcon();

// Close modal when clicking outside
document.addEventListener('click', (event) => {
  const modal = document.getElementById('readease-modal');
  const hoverIcon = document.getElementById('hover-icon');

  if (modal && !modal.contains(event.target) && !hoverIcon.contains(event.target)) {
    modal.remove();
  }
});