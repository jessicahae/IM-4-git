async function init() {
  await loadChildren();
  refreshStock();
  loadUserAvatar();
}

const showFormButton = document.getElementById("showAddChildForm");
const addChildForm = document.getElementById("addChildForm");
const cancelButton = document.getElementById("cancelAddChild");
const childrenSwitcher = document.getElementById("childrenSwitcher");
let diaperChart = null;
let statusTimer = null;

function createChildButton(child, isActive = false) {
  const button = document.createElement("button");

  button.type = "button";
  button.className = isActive ? "child-button active" : "child-button";
  button.textContent = child.name;
  button.dataset.sensorNumber = child.sensor_number;

  return button;
}

async function loadChildren() {
  try {
    const response = await fetch("api/children.php", {
      credentials: "include",
    });

    const result = await response.json();

    if (result.status !== "success") return;

    document.querySelectorAll(".child-button").forEach((button) => {
      button.remove();
    });

    result.children.forEach((child, index) => {
      const button = createChildButton(child, index === 0);
      childrenSwitcher.insertBefore(button, showFormButton);
    });

    if (result.children.length > 0) {
      const firstChild = result.children[0];

      document.querySelectorAll(".childNameDisplay").forEach((el) => {
        el.textContent = firstChild.name;
      });

    loadDiaperStats(firstChild.sensor_number);
    loadDiaperChart(firstChild.sensor_number);

    loadDiaperStatus(firstChild.sensor_number);
    if (statusTimer) clearInterval(statusTimer);
statusTimer = setInterval(() => loadDiaperStatus(sensorNumber), 30000);
    }
  } catch (error) {
    console.error("Kinder konnten nicht geladen werden:", error);
  }
}

showFormButton.addEventListener("click", () => {
  addChildForm.hidden = false;
  document.getElementById("childName").focus();
});

cancelButton.addEventListener("click", () => {
  addChildForm.reset();
  addChildForm.hidden = true;
});

addChildForm.addEventListener("submit", async (e) => {
  e.preventDefault();

  const nameVal = document.getElementById("childName").value.trim();
  const sensorVal = document.getElementById("sensorId").value.trim();

  if (!nameVal || !sensorVal) return;

  try {
    const res = await fetch("api/children.php", {
      method: "POST", credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: nameVal, id_sensor: sensorVal })
    });

    if ((await res.json()).status === "success") {
      document.querySelectorAll(".child-button").forEach(b => b.classList.remove("active"));

      const btn = createChildButton(
        { name: nameVal, id_sensor: sensorVal },
        true
      );

      childrenSwitcher.insertBefore(btn, showFormButton);

      document.querySelectorAll(".childNameDisplay").forEach(span => {
        span.textContent = nameVal;
      });

      addChildForm.reset();
      addChildForm.hidden = true;
    }
  } catch {
    alert("Netzwerkfehler beim Speichern.");
  }
});

// Überwacht alle Klicks im Kinder-Menü oben
document.getElementById("childrenSwitcher").addEventListener("click", (event) => {

  if (event.target.classList.contains("child-button")) {
    // 1. CSS Klassen tauschen
    document.querySelectorAll(".child-button").forEach(b => b.classList.remove("active"));
    event.target.classList.add("active");

    const clickedName = event.target.textContent;
    const sensorNumber = event.target.dataset.sensorNumber;

    document.querySelectorAll(".childNameDisplay").forEach(el => el.textContent = clickedName);

loadDiaperStats(sensorNumber);
loadDiaperChart(sensorNumber);
loadDiaperStatus(sensorNumber);

    if (statusTimer) clearInterval(statusTimer);
    statusTimer = setInterval(() => loadDiaperStatus(sensorId), 30000);
  }
});

async function refreshStock() {
  try {
    const response = await fetch("api/get_stock.php?sensor_number=1");
    const data = await response.json();

    if (data.status !== "success") return;

    const bestand = data.bestand;
    const verbrauch = data.durchschnitt;
    const tage = verbrauch > 0 ? Math.floor(bestand / verbrauch) : 0;

    document.getElementById("display-bestand").textContent = `${bestand} Windeln`;
    document.getElementById("display-verbrauch").textContent = verbrauch;
    document.getElementById("display-reichweite").textContent = `${tage} Tage`;
    const stockSection = document.querySelector(".stock-section");
    const stockStatus = document.getElementById("display-status");
    if (tage <= 2) {
      stockStatus.textContent = "Vorrat nachkaufen!";
      stockSection.style.backgroundColor = "rgba(255, 214, 220, 0.4)"; // Pink mit 60% Transparenz
    } else if (tage <= 5) {
      stockStatus.textContent = "Vorrat hält nicht mehr lange";
      stockSection.style.backgroundColor = "rgba(255, 248, 201, 0.4)"; // Gelb mit 60% Transparenz
    } else {
      stockStatus.textContent = "Vorrat ausreichend";
      stockSection.style.backgroundColor = "";
    }


  } catch (error) {
    console.error("Fehler beim Abrufen der Bestandsdaten", error);
  }
}

async function loadUserAvatar() {
  const response = await fetch("api/user.php", {
    credentials: "include",
  });

  const result = await response.json();

  if (result.status !== "success") return;

  const avatar = result.user.avatar || "avatar-1.png";

  document.querySelectorAll(".user-avatar").forEach((image) => {
    image.src = `img/profile/${avatar}`;
  });
}

async function loadDiaperChart(sensorId = 1) {
  const response = await fetch(`api/diaper_chart.php?sensor=${sensorId}`, {
    credentials: "include",
  });

  const result = await response.json();

  if (result.status !== "success") return;

const chartCanvas = document.getElementById("diaperChart");

if (diaperChart) {
  diaperChart.destroy();
}

diaperChart = new Chart(chartCanvas, {
    type: "bar",
    data: {
      labels: result.labels,
      datasets: [
        {
          data: result.values,
          backgroundColor: "#FFB3D9",
          borderColor: "#000000",
          borderWidth: 3,
          borderSkipped: false,
        },
      ],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          display: false,
        },
      },
      scales: {
        x: {
          ticks: {
            color: "#000000",
            font: {
              family: "Patrick Hand",
              size: 16,
            },
          },
          grid: {
            color: "#000000",
          },
        },
        y: {
          beginAtZero: true,
          ticks: {
            stepSize: 1,
            color: "#000000",
            font: {
              family: "Patrick Hand",
              size: 16,
            },
          },
          grid: {
            color: "#000000",
          },
        },
      },
    },
  });
}

async function loadDiaperStats(sensorId) {
  const response = await fetch(`api/diaper_stats.php?sensor=${sensorId}`, {
    credentials: "include",
  });

  const result = await response.json();

  if (result.status !== "success") return;

  document.getElementById("diapersToday").textContent = `${result.today} Windeln`;
  document.getElementById("diapersWeek").textContent = `${result.week} Windeln`;
}

init();
setInterval(refreshStock, 30000);

async function loadDiaperStatus(sensorId) {
  try {
    const response = await fetch(`api/get_diaper_status.php?sensor=${sensorId}`, {
      credentials: "include",
    });

    const result = await response.json();

    if (result.status === "success") {
      // 1. Zuerst allen Boxen die pinke Farbe (.active) wegnehmen
      document.querySelectorAll(".status-box").forEach(box => {
        box.classList.remove("active");
      });

      // 2. Der aktuellen Box die pinke Farbe geben
      const currentBox = document.getElementById(`status-${result.type}`);
      if (currentBox) {
        currentBox.classList.add("active");
      }
    }
  } catch (error) {
    console.error("Fehler beim Laden des Windel-Status", error);
  }
}