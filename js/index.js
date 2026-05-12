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
      
      const btn = Object.assign(document.createElement("button"), {
        type: "button", className: "child-button active", textContent: nameVal
      });
      btn.dataset.sensorId = sensorVal;
      
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

async function loadDiaperChart() {
  const response = await fetch("api/diaper_chart.php?sensor=1");
  const result = await response.json();

  if (result.status !== "success") return;

  const ctx = document.getElementById("diaperChart");

  new Chart(ctx, {
    type: "bar",
    data: {
      labels: result.labels,
      datasets: [{
        data: result.values,
        backgroundColor: "#FFB3D9",
        borderColor: "#000000",
        borderWidth: 3,
        borderSkipped: false,
        barPercentage: 0.7,
        categoryPercentage: 0.8
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          display: false
        },
        tooltip: {
          callbacks: {
            label: (context) => `Windeln: ${context.raw}`
          }
        }
      },
      scales: {
        x: {
          grid: {
            color: "#000000",
            borderDash: [4, 4]
          },
          ticks: {
            color: "#000000",
            font: {
              family: "Patrick Hand",
              size: 16
            }
          }
        },
        y: {
          beginAtZero: true,
          ticks: {
            stepSize: 3,
            color: "#000000",
            font: {
              family: "Patrick Hand",
              size: 16
            }
          },
          grid: {
            color: "#000000",
            borderDash: [4, 4]
          }
        }
      }
    }
  });
}

loadDiaperChart();
