// Remove existing hover icon if it exists
const existingIcon = document.getElementById("hover-icon");
if (existingIcon) existingIcon.remove();

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
hoverIcon.textContent = "R"; // Display text "H" for "Hover"

// Append the hover icon to the document body
document.body.appendChild(hoverIcon);

// Add a click handler to the hover icon
hoverIcon.addEventListener("click", () => {
  // Create a modal window
  const modal = document.createElement("div");
  modal.style.position = "fixed";
  modal.style.left = "85%"; // Adjusted to bring it closer to the hover icon
  modal.style.top = "75%";
  modal.style.transform = "translate(-50%, -50%)";
  modal.style.backgroundColor = "white";
  modal.style.border = "1px solid #ccc";
  modal.style.padding = "20px";
  modal.style.zIndex = "10000"; // Ensure it appears above other elements
  modal.style.width = "13%"; // Set a fixed width to prevent wrapping

  // Create buttons
  const simplifyButton = document.createElement("button");
  simplifyButton.textContent = "Simplify";
  simplifyButton.style.marginRight = "10px"; // Add space to the right
  simplifyButton.style.border = "2px solid #ca80e8"; // Add border
  simplifyButton.style.backgroundColor = "#ca80e8"; // Background color
  simplifyButton.style.color = "white"; // Text color
  simplifyButton.style.padding = "10px"; // Padding for button size
  simplifyButton.style.margin = "10px";
  simplifyButton.style.borderRadius = "5px"; // Rounded corners
  simplifyButton.style.cursor = "pointer"; // Pointer cursor on hover
  simplifyButton.style.width = "90%"; // Full width


  const summarizeButton = document.createElement("button");
  summarizeButton.textContent = "Summarize";
  summarizeButton.style.marginRight = "10px"; // Add space to the right
  summarizeButton.style.border = "2px solid #ca80e8"; // Add border
  summarizeButton.style.backgroundColor = "#ca80e8"; // Background color
  summarizeButton.style.color = "white"; // Text color
  summarizeButton.style.padding = "10px"; // Padding for button size
  summarizeButton.style.margin = "10px";
  summarizeButton.style.borderRadius = "5px"; // Rounded corners
  summarizeButton.style.cursor = "pointer"; // Pointer cursor on hover
  summarizeButton.style.width = "90%"; // Full width


  const textToSpeechButton = document.createElement("button");
  textToSpeechButton.textContent = "Text-to-Speech";
  textToSpeechButton.style.border = "2px solid #ca80e8"; // Add border
  textToSpeechButton.style.backgroundColor = "#ca80e8"; // Background color
  textToSpeechButton.style.color = "white"; // Text color
  textToSpeechButton.style.padding = "10px"; // Padding for button size
  textToSpeechButton.style.margin = "10px";
  textToSpeechButton.style.borderRadius = "5px"; // Rounded corners
  textToSpeechButton.style.cursor = "pointer"; // Pointer cursor on hover
  textToSpeechButton.style.width = "90%"; // Full width

  // Create a container for the first three buttons
  const buttonContainer = document.createElement("div");
  buttonContainer.style.display = "flex"; // Use flexbox for horizontal alignment
  buttonContainer.style.marginBottom = "10px"; // Add space below the button container

  // Append buttons to the modal, each on a new line
  modal.appendChild(simplifyButton);
  modal.appendChild(summarizeButton);
  modal.appendChild(textToSpeechButton);

  // Append the modal to the document body
  document.body.appendChild(modal);

  // Create a container for the confirm button
  // const confirmButtonContainer = document.createElement("div");
  // confirmButtonContainer.style.display = "flex"; // Use flexbox for centering
  // confirmButtonContainer.style.justifyContent = "center"; // Center the confirm button

  // // Append the confirm button to the container
  // const confirmButton = document.createElement("button");
  // confirmButton.textContent = "Confirm";
  // confirmButton.style.border = "2px solid #57B9FF"; // Add border
  // confirmButton.style.backgroundColor = "#57B9FF"; // Background color
  // confirmButton.style.color = "white"; // Text color
  // confirmButton.style.padding = "10px"; // Padding for button size
  // confirmButton.style.borderRadius = "5px"; // Rounded corners
  // confirmButton.style.cursor = "pointer"; // Pointer cursor on hover

  // confirmButtonContainer.appendChild(confirmButton);
  // modal.appendChild(confirmButtonContainer); // Append the container to the modal

  // Add event listeners for buttons (you can define the actions later)
  simplifyButton.addEventListener("click", () => {
    //   alert("Simplify clicked!");
      // Add your simplify logic here
      chrome.runtime.sendMessage({ action: "openSidePanel", feature: "simplify" });
  });

  summarizeButton.addEventListener("click", () => {
    //   alert("Summarize clicked!");
      // Add your summarize logic here
      chrome.runtime.sendMessage({ action: "openSidePanel", feature: "summarize" });
  });

  textToSpeechButton.addEventListener("click", () => {
      alert("Text-to-Speech clicked!");
      // Add your text-to-speech logic here
  });

  confirmButton.addEventListener("click", () => {
      alert("Confirm clicked!");
      // Add your confirm logic here
      document.body.removeChild(modal); // Close the modal
  });
});
