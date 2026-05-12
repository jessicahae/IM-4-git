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
  
  // Prüfen, ob genau ein Kind-Button angeklickt wurde
  if (event.target.classList.contains("child-button")) {
    
    // 1. Allen Buttons die "active" Farbe wegnehmen
    document.querySelectorAll(".child-button").forEach(b => b.classList.remove("active"));
    
    // 2. Dem angeklickten Button die "active" Farbe geben
    event.target.classList.add("active");
    
    // 3. Den Namen des angeklickten Buttons auslesen
    const clickedName = event.target.textContent;
    
    // 4. Den Namen überall im Dashboard aktualisieren!
    document.querySelectorAll(".childNameDisplay").forEach(el => el.textContent = clickedName);
    
  }
});

refreshDashboardStock();

async function refreshDashboardStock() {
    try {
        const response = await fetch("api/get_stock.php");
        const data = await response.json();

        if (data.status === "success") {
            // Werte aus dem PHP (data.bestand und data.durchschnitt)
            const bestand = data.bestand;
            const avg = data.durchschnitt;
            const tage = avg > 0 ? Math.floor(bestand / avg) : 0;

            // UI-Update: Wir befüllen die 3 Boxen nacheinander
            const infoBoxes = document.querySelectorAll(".stock-grid .info-box strong");
            if (infoBoxes.length >= 3) {
                infoBoxes[0].textContent = `${bestand} Windeln`;
                infoBoxes[1].textContent = avg;
                infoBoxes[2].textContent = `${tage} Tage`;
            }

            // Design-Check: Pinker Alarm
            const stockSection = document.querySelector(".stock-section");
            const statusText = document.querySelector(".stock-status");

            if (tage <= 3) {
                stockSection.style.backgroundColor = "#ff66b2"; // Pink
                stockSection.style.color = "white";
                statusText.textContent = "Status: Windeln nachkaufen!";
            } else {
                stockSection.style.backgroundColor = ""; // Standard (weiß/beige)
                stockSection.style.color = "";
                statusText.textContent = "Status: Vorrat okay";
            }
        } else {
            console.error("Datenbank meldet:", data.message);
        }
    } catch (err) {
        console.error("Verbindung zum Server fehlgeschlagen");
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
