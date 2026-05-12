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

addChildForm.addEventListener("submit", async (event) => {
  event.preventDefault();

  const childName = document.getElementById("childName").value.trim();
  const sensorId = document.getElementById("sensorId").value.trim();

  if (!childName || !sensorId) return;

  try {
    // 1. DATEN AN PHP SENDEN (Der fehlende Schritt)
    const response = await fetch("api/children.php", {
      method: "POST",
      credentials: 'include',
      headers: { 
        "Content-Type": "application/json" 
      },
      // Wir senden genau die Keys ('name' und 'id_sensor'), die dein PHP erwartet:
      body: JSON.stringify({ 
        name: childName, 
        id_sensor: sensorId 
      }),
    });

    const result = await response.json();

    // 2. WENN PHP ERFOLG MELDET -> WEBSITE AKTUALISIEREN
    if (result.status === "success") {
      
      document.querySelectorAll(".child-button").forEach((button) => {
        button.classList.remove("active");
      });

      const childButton = document.createElement("button");
      childButton.type = "button";
      childButton.className = "child-button active";
      childButton.textContent = childName;
      // Optional: Du könntest hier auch die neue Datenbank-ID speichern (result.child.id)
      childButton.dataset.sensorId = sensorId; 

      childrenSwitcher.insertBefore(childButton, showFormButton);

      addChildForm.reset();
      addChildForm.hidden = true;
      
    } else {
      // Wenn das PHP-Skript einen Fehler meldet (z.B. nicht eingeloggt)
      alert("Fehler: " + (result.message || "Konnte nicht gespeichert werden."));
    }

  } catch (error) {
    console.error("Fetch-Fehler:", error);
    alert("Netzwerkfehler: Es konnte keine Verbindung zum Server hergestellt werden.");
  }
});

document.getElementById("statusChildName").textContent = "Hanna";