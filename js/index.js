const showFormButton = document.getElementById("showAddChildForm");
const addChildForm = document.getElementById("addChildForm");
const cancelButton = document.getElementById("cancelAddChild");
const childrenSwitcher = document.getElementById("childrenSwitcher");

showFormButton.addEventListener("click", () => {
  addChildForm.hidden = false;
  document.getElementById("childName").focus();
});

cancelButton.addEventListener("click", () => {
  addChildForm.reset();
  addChildForm.hidden = true;
});

addChildForm.addEventListener("submit", (event) => {
  event.preventDefault();

  const childName = document.getElementById("childName").value.trim();
  const sensorId = document.getElementById("sensorId").value.trim();

  if (!childName || !sensorId) return;

  document.querySelectorAll(".child-button").forEach((button) => {
    button.classList.remove("active");
  });

  const childButton = document.createElement("button");
  childButton.type = "button";
  childButton.className = "child-button active";
  childButton.textContent = childName;
  childButton.dataset.sensorId = sensorId;

  childrenSwitcher.insertBefore(childButton, showFormButton);

  addChildForm.reset();
  addChildForm.hidden = true;
});
