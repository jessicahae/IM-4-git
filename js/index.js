async function init() {
    await loadChildren(); // Erst Kinder laden und Buttons erstellen
    refreshStock();       // Dann Bestand für das (nun aktive) Kind holen
}




const showFormButton = document.getElementById("showAddChildForm");
const addChildForm = document.getElementById("addChildForm");
const cancelButton = document.getElementById("cancelAddChild");
const childrenSwitcher = document.getElementById("childrenSwitcher");

function createChildButton(child, isActive = false) {
  const button = document.createElement("button");

  button.type = "button";
  button.className = isActive ? "child-button active" : "child-button";
  button.textContent = child.name;
  button.dataset.sensorId = child.id_sensor;

  return button;
}

async function loadChildren() {
  try {
    const response = await fetch("api/children.php", {
      credentials: "include",
    });

    const result = await response.json();

    if (result.status !== "success") return;

    result.children.forEach((child, index) => {
      const button = createChildButton(child, index === 0);
      childrenSwitcher.insertBefore(button, showFormButton);
    });

    if (result.children.length > 0) {
      document.querySelectorAll(".childNameDisplay").forEach((el) => {
        el.textContent = result.children[0].name;
      });
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
    
    // 2. Namen aktualisieren
    const clickedName = event.target.textContent;
    document.querySelectorAll(".childNameDisplay").forEach(el => el.textContent = clickedName);
    
    // 3. WICHTIG: Vorrat für DIESES Kind neu laden
    refreshStock(); 
  }
});

refreshStock();

async function refreshStock() {
  // 1. Den aktuell aktiven Kind-Button finden
  const activeChildButton = document.querySelector(".child-button.active");
  
  // Wenn kein Kind aktiv ist, können wir nichts laden
  if (!activeChildButton) return;

  const sensorId = activeChildButton.dataset.sensorId;

  try {
    // 2. Die Sensor-ID als Parameter an PHP schicken
    const response = await fetch(`api/get_stock.php?sensor_id=${sensorId}`);
    const data = await response.json();

    if (data.status === "success") {
      const bestand = data.bestand; 
      const verbrauch = data.durchschnitt;
      const tage = verbrauch > 0 ? Math.floor(bestand / verbrauch) : 0;

      document.getElementById("display-bestand").textContent = bestand + " Windeln";
      document.getElementById("display-verbrauch").textContent = verbrauch;
      document.getElementById("display-reichweite").textContent = tage + " Tage";

      const section = document.querySelector(".stock-section");
      const statusText = document.querySelector(".stock-status");

      if (tage <= 3) {
        section.style.backgroundColor = "#ff66b2";
        section.style.color = "white";
        statusText.textContent = "Status: Windeln nachkaufen!";
      } else {
        section.style.backgroundColor = ""; 
        section.style.color = "";
        statusText.textContent = "Status: Vorrat okay";
      }
    }
  } catch (e) {
    console.error("Fehler beim Abrufen der Bestandsdaten", e);
  }
}

async function loadDiaperChart(sensorId = 1) {
  const response = await fetch(`api/diaper_chart.php?sensor=${sensorId}`, {
    credentials: "include",
  });

  const result = await response.json();

  if (result.status !== "success") return;

  const chartCanvas = document.getElementById("diaperChart");

  new Chart(chartCanvas, {
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

loadChildren();
loadDiaperChart();
refreshDashboardStock();
setInterval(refreshDashboardStock, 15000);
