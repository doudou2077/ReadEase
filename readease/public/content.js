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
hoverIcon.style.width = "64px";
hoverIcon.style.height = "64px";
hoverIcon.style.backgroundColor = "#007bff";
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
  alert("Hover icon clicked!");
  hoverIcon.remove(); // Remove the icon after click
});
