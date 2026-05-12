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

updateStock();

async function updateStock() {
    try {
        const response = await fetch("api/get_stock.php");
        const data = await response.json();

        if (data.status === "success") {
            const bestand = data.bestand;
            const avgGesamt = data.durchschnittProTagGesamt; // Der berechnete Wert aus der DB
            
            // Wir berechnen die Reichweite: Bestand / Durchschnitt
            // Falls der Durchschnitt 0 ist (keine Daten), nehmen wir 1 zur Sicherheit
            const tageReichweite = Math.floor(bestand / (avgGesamt > 0 ? avgGesamt : 1));

            // UI-Update
            // 1. Aktueller Bestand
            document.querySelector(".stock-grid .info-box:nth-child(1) strong").textContent = `${bestand} Windeln`;
            
            // 2. Durchschnittlicher Verbrauch (jetzt dynamisch aus DB)
            document.querySelector(".stock-grid .info-box:nth-child(2) strong").textContent = avgGesamt;
            
            // 3. Reicht für X Tage
            document.querySelector(".stock-grid .info-box:nth-child(3) strong").textContent = `${tageReichweite} Tage`;

            // Status-Logik & Farbe
            const stockSection = document.querySelector(".stock-section");
            const statusText = document.querySelector(".stock-status");

            if (tageReichweite <= 3) {
                // Pinker Alarm-Modus
                stockSection.style.backgroundColor = "#ff66b2"; 
                stockSection.style.color = "white";
                statusText.textContent = "Status: Windeln nachkaufen!";
                statusText.style.fontWeight = "bold";
            } else {
                // Normaler Modus
                stockSection.style.backgroundColor = "";
                stockSection.style.color = "";
                statusText.textContent = "Status: Vorrat okay";
            }
        }
    } catch (error) {
        console.error("Fehler beim Laden der Vorratsdaten:", error);
    }
}

// Initialer Aufruf und Intervall
updateStock();
setInterval(updateStock, 30000); // Alle 30 Sek. prüfen