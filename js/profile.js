const profileChildrenList = document.getElementById("profileChildrenList");

async function loadProfileChildren() {
  const response = await fetch("api/children.php", {
    credentials: "include",
  });

  const result = await response.json();

  if (result.status !== "success") return;

  profileChildrenList.innerHTML = "";

  result.children.forEach((child) => {
    profileChildrenList.appendChild(createChildPanel(child));
  });
}

function createChildPanel(child) {
  const panel = document.createElement("article");
  panel.className = "profile-panel";

  panel.innerHTML = `
    <h4>${child.name}</h4>

    <div class="profile-row">
      <input type="text" value="${child.id_sensor}" class="sensor-input" />
      <button type="button" class="profile-action-button">Ändern</button>
    </div>

    <button type="button" class="delete-button">Papierkorb</button>
  `;

  const sensorInput = panel.querySelector(".sensor-input");
  const editButton = panel.querySelector(".profile-action-button");
  const deleteButton = panel.querySelector(".delete-button");

  editButton.addEventListener("click", () => {
    updateChildSensor(child.id, sensorInput.value);
  });

  deleteButton.addEventListener("click", () => {
    deleteChild(child.id);
  });

  return panel;
}

async function updateChildSensor(childId, sensorId) {
  const response = await fetch("api/children.php", {
    method: "PUT",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      id: childId,
      id_sensor: sensorId,
    }),
  });

  const result = await response.json();

  if (result.status === "success") {
    loadProfileChildren();
  } else {
    alert(result.message || "Sensor konnte nicht geändert werden.");
  }
}

async function deleteChild(childId) {
  const response = await fetch(`api/children.php?id=${childId}`, {
    method: "DELETE",
    credentials: "include",
  });

  const result = await response.json();

  if (result.status === "success") {
    loadProfileChildren();
  } else {
    alert(result.message || "Kind konnte nicht gelöscht werden.");
  }
}

loadProfileChildren();