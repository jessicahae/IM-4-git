const userForm = document.getElementById("userForm");
const profileTitleName = document.getElementById("profileTitleName");
const usernameInput = document.getElementById("username");
const emailInput = document.getElementById("profileEmail");
const passwordInput = document.getElementById("profilePassword");
const profileAvatar = document.getElementById("profileAvatar");
const showAvatarOptions = document.getElementById("showAvatarOptions");
const avatarOptions = document.getElementById("avatarOptions");

let selectedAvatar = "avatar-1.png";

showAvatarOptions.addEventListener("click", () => {
  avatarOptions.hidden = !avatarOptions.hidden;
});

avatarOptions.addEventListener("click", async (event) => {
  const button = event.target.closest("button");
  if (!button) return;

  selectedAvatar = button.dataset.avatar;
  updateAvatarImages(selectedAvatar);
  avatarOptions.hidden = true;

  await saveUserData();
});

function updateAvatarImages(avatar) {
  document.querySelectorAll(".user-avatar").forEach((image) => {
    image.src = `img/profile/${avatar}`;
  });
}

async function saveUserData() {
  const response = await fetch("api/user.php", {
    method: "PUT",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      name: usernameInput.value.trim(),
      email: emailInput.value.trim(),
      password: passwordInput.value.trim(),
      avatar: selectedAvatar,
    }),
  });

  const result = await response.json();

  if (result.status !== "success") {
    alert(result.message || "Benutzerdaten konnten nicht gespeichert werden.");
  }

  return result;
}

async function loadUserData() {
  const response = await fetch("api/user.php", {
    credentials: "include",
  });

  const result = await response.json();

  if (result.status !== "success") return;

  usernameInput.value = result.user.name;
  emailInput.value = result.user.email;
  passwordInput.value = "";

  profileTitleName.textContent = result.user.name;

  selectedAvatar = result.user.avatar || "avatar-1.png";
updateAvatarImages(selectedAvatar);

}

userForm.addEventListener("submit", async (event) => {
  event.preventDefault();

  const result = await saveUserData();

  if (result.status === "success") {
    passwordInput.value = "";
    loadUserData();
  }
});

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

const stockSensorList = document.getElementById("stockSensorList");
const showStockSensorForm = document.getElementById("showStockSensorForm");
const addStockSensorForm = document.getElementById("addStockSensorForm");
const cancelStockSensor = document.getElementById("cancelStockSensor");
const stockSensorNumber = document.getElementById("stockSensorNumber");

async function loadStockSensors() {
  const response = await fetch("api/sensors.php", {
    credentials: "include",
  });

  const result = await response.json();

  if (result.status !== "success") return;

  stockSensorList.innerHTML = "";

  result.sensors.forEach((sensor) => {
    stockSensorList.appendChild(createStockSensorPanel(sensor));
  });
}

function createStockSensorPanel(sensor) {
  const panel = document.createElement("article");
  panel.className = "profile-panel";

  panel.innerHTML = `
    <div class="profile-panel-header">
      <div>
        <h4>Vorrat-Sensor</h4>
        <span class="connection-status">Verbunden</span>
      </div>
      <button type="button" class="delete-button">Papierkorb</button>
    </div>

    <div class="profile-row">
      <input type="text" value="${sensor.number}" class="sensor-input" />
      <button type="button" class="profile-action-button">Ändern</button>
    </div>
  `;

  const sensorInput = panel.querySelector(".sensor-input");
  const editButton = panel.querySelector(".profile-action-button");
  const deleteButton = panel.querySelector(".delete-button");

  editButton.addEventListener("click", () => {
    updateStockSensor(sensor.id, sensorInput.value);
  });

  deleteButton.addEventListener("click", () => {
    deleteStockSensor(sensor.id);
  });

  return panel;
}

showStockSensorForm.addEventListener("click", () => {
  addStockSensorForm.hidden = false;
  stockSensorNumber.focus();
});

cancelStockSensor.addEventListener("click", () => {
  addStockSensorForm.reset();
  addStockSensorForm.hidden = true;
});

addStockSensorForm.addEventListener("submit", async (event) => {
  event.preventDefault();

  const number = stockSensorNumber.value.trim();
  if (!number) return;

  const response = await fetch("api/sensors.php", {
    method: "POST",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ number }),
  });

  const result = await response.json();

  if (result.status === "success") {
    addStockSensorForm.reset();
    addStockSensorForm.hidden = true;
    loadStockSensors();
  } else {
    alert(result.message || "Vorrat-Sensor konnte nicht gespeichert werden.");
  }
});

async function updateStockSensor(id, number) {
  const response = await fetch("api/sensors.php", {
    method: "PUT",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ id, number }),
  });

  const result = await response.json();

  if (result.status === "success") {
    loadStockSensors();
  } else {
    alert(result.message || "Vorrat-Sensor konnte nicht geändert werden.");
  }
}

async function deleteStockSensor(id) {
  const response = await fetch(`api/sensors.php?id=${id}`, {
    method: "DELETE",
    credentials: "include",
  });

  const result = await response.json();

  if (result.status === "success") {
    loadStockSensors();
  } else {
    alert(result.message || "Vorrat-Sensor konnte nicht gelöscht werden.");
  }
}

loadProfileChildren();
loadStockSensors();
loadUserData();
