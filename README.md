# 👶 Folle Vindl - WebApp

Unser Semesterprojekt ist eine mobile-first WebApp, die sich an junge Eltern richtet und dabei hilft, den Windelstatus sowie den gemeinsamen Windelvorrat mehrerer Kinder übersichtlich zu verwalten. 

🚀 **Live Demo:** [https://im4-follevindl.jessicahaeseli.ch/](https://im4-follevindl.jessicahaeseli.ch/)

---

## 💡 Über das Projekt
Die zentrale Idee des Projekts ist es, Daten aus dem Physical-Computing-Teil (Hardware-Sensoren) in einer Datenbank zu speichern und in der WebApp verständlich darzustellen. Eltern sollen auf einen Blick sehen:
* Ob eine Windel trocken, nass oder voll ist.
* Wie viele Windeln noch vorhanden sind.
* Wie lange der Vorrat ungefähr noch reicht.
* Wie hoch der durchschnittliche Windelverbrauch pro Kind ist.

### 🎨 Design & UI
Gestalterisch orientiert sich die App an einem skizzenhaften Comic-Stil, inspiriert von *„Gregs Tagebuch“*. Die Oberfläche arbeitet mit:
* Liniertem Papierhintergrund
* Schwarzen Umrandungen und leicht versetzten Schatten
* Handschriftlicher Schrift und simplen Icons

Die WebApp wurde **mobile-first** aufgebaut, da sie vor allem schnell und unkompliziert auf dem Smartphone genutzt werden soll. Für grössere Bildschirme wurden responsive Anpassungen ergänzt.

---

## 📱 WebApp Ablauf (Screenflow)
Der grundlegende Ablauf zur Nutzung der App gestaltet sich wie folgt (ein genauer Screenflow ist zudem auf unserem Projektvideo ersichtlich):

1. **Registrieren** eines neuen Accounts.
2. **Einloggen** in das Dashboard.
3. **Kind(er) hinzufügen** -> Dabei bitte die Sensornummer `67` wählen.
4. **Vorratssensor verbinden** -> Über den Hinweis bei „Vorrat“ unter „Profil“ den Vorratssensor mit der Nummer `69` verbinden.
5. **Dashboard nutzen** -> Alle Live-Daten und Statistiken werden nun übersichtlich dargestellt.
6. **Profilverwaltung nutzen** -> Auf der Profilseite können jederzeit das eigene Profilbild (Auswahl aus verschiedenen Avataren) sowie die persönlichen Benutzerdaten (Name, E-Mail, Passwort) individuell angepasst werden.

---

## 🛠️ Projektstruktur & Technologien
Technisch basiert die WebApp auf **HTML, CSS, JavaScript, PHP und MySQL**. Die Projektstruktur ist bewusst simpel und modular gehalten:

* **Frontend:** Jede Hauptseite besteht aus einer HTML-Datei und einer passenden JavaScript-Datei. Die wichtigsten Seiten sind `index.html` (Dashboard), `profile.html` (Profilverwaltung) sowie die Login- und Registrierungsseiten.
* **Backend (`/api`):** Die PHP-Dateien im Ordner `api` übernehmen die Kommunikation mit der Datenbank.
* **Benutzerverwaltung:** Registrierung und Login schützen die App über Sessions. Nur eingeloggte Benutzer können das Dashboard und Profil nutzen. Profilbilder werden global im Header, Dashboard und Profil synchronisiert.

### 🗄️ Datenbank
Die MySQL-Datenbank enthält unter anderem folgende wichtige Tabellen:
* `users`: Speichert die Benutzerdaten.
* `children`: Speichert die Kinder eines Benutzers und verweist auf einen spezifischen Windelsensor.
* `sensors`: Enthält die manuell erfassten Sensoren mit Nummer und Typ (Diaper- oder Stocksensor).
* `diaper_event`: Speichert Statusmeldungen der Windelsensoren (z. B. trocken, nass, voll).
* `stock`: Speichert Messwerte des Vorratssensors (Sensor-Nummer, Anzahl Windeln und Zeitpunkt).

---

## 🔌 Datenschnittstelle zum Physical Computing
Ein wichtiger Teil war die Datenschnittstelle zwischen WebApp und Hardware. Die WebApp liest die in der Datenbank gespeicherten Sensordaten über PHP aus und verarbeitet diese für das Frontend:
* **Windelstatus:** Es wird jeweils der neuste Eintrag aus `diaper_event` für die passende Sensor-Nummer ausgelesen.
* **Statistik:** Die Events pro Tag werden gezählt und mit **Chart.js** als übersichtliches Balkendiagramm dargestellt.
* **Vorrat:** Der neuste Eintrag aus der Tabelle `stock` zeigt den aktuellen Bestand. Aus den Tagesdifferenzen berechnet die Logik zudem den durchschnittlichen Verbrauch pro Tag.

---

## 🧠 Schwierigkeiten & Learnings

Im Umsetzungsprozess haben wir viel darüber gelernt, wie wichtig klare Datenstrukturen und eindeutige Begriffe sind. Einige Herausforderungen und Lösungsansätze:

* **Sensor-ID vs. Sensor-Nummer:** In der Tabelle `sensors` gibt es eine interne ID und eine externe Sensor-Nummer. Die Kinder-Tabelle speichert die interne ID, während die Event-Tabellen mit der Sensor-Nummer arbeiten. Dies führte anfangs zu falschen Datenabfragen. Gelöst wurde das Problem mit einem sauberen `JOIN` in der `children.php`, sodass das Dashboard durchgehend mit der korrekten Sensor-Nummer arbeiten kann.
* **Vereinfachung der Profilseite:** Ursprünglich war geplant, Vorratssensoren über die WebApp komplett verwalten (erstellen/löschen) zu können. Da diese aber primär manuell in der Datenbank erfasst werden, wurde die Logik angepasst: Benutzer können nun nur noch vorhandene Sensoren mit ihrem Profil verbinden. 
* **Allgemeine Learnings:** Durch intensives Debugging wurde klar, dass Backend und Frontend exakt dieselbe Logik verwenden müssen, um reibungslos zu funktionieren. Zudem haben wir gelernt, dass Dummy-Daten zwar zum Testen helfen, aber reale Sensordaten und -bedingungen nochmals eigene Herausforderungen mit sich bringen.

---

## ⚙️ Reproduzierbarkeit des Systems (Architektur & Workflow)

Um unser System nachzuvollziehen und reproduzieren zu können, ist das Verständnis unseres technischen Workflows und der Datenarchitektur zentral. Unser Vorgehen teilt sich in drei Hauptschritte auf:

### 1. Datenbank-Setup mit phpMyAdmin
Im ersten Schritt haben wir unsere Entwicklungsumgebung aufgesetzt und die MySQL-Datenbank mithilfe von **phpMyAdmin** strukturiert. Dabei haben wir die grundlegenden Tabellen (`users`, `children`, `sensors`, `diaper_event`, `stock`) definiert. Wichtig war hierbei die Festlegung der korrekten Datentypen und primären/sekundären Schlüssel (wie z. B. die Sensor-Nummern), um eine saubere Zuordnung und Beziehung zwischen gewissen Tabellen zu ermöglichen.

### 2. Datenübergabe (Physical Computing)
Die Daten wurden uns direkt vom Physical-Computing-Team zur Verfügung gestellt. Sie haben dafür gesorgt, dass die Sensordaten (für Windelstatus und Vorrat) fortlaufend und passend in unsere beiden dafür vorgesehenen Datenbanktabellen (`diaper_event` und `stock`) eingespielt wurden.

### 3. Datenabruf durch die WebApp (`load.php`)
Die Kernaufgabe der WebApp besteht darin, diese fortlaufend aktualisierte Datenbank auszulesen und visuell aufzubereiten. Dafür haben wir spezifische PHP-Skripte (wie z. B. `load.php` und unsere Dateien im `api/`-Ordner) geschrieben. 
* Diese Skripte stellen die Verbindung zur Datenbank her und ziehen (via `SELECT`-Abfragen) immer die aktuellsten Datensätze für den jeweils eingeloggten Benutzer und seine verknüpften Sensoren.
* Die ausgelesenen Daten werden anschliessend im JSON-Format an das JavaScript im Frontend übergeben.
* Das Frontend verarbeitet diese Daten live weiter und aktualisiert damit das Dashboard, die Status-Anzeigen sowie die Chart.js-Statistiken.

**Live-Umgebung:** 
Das Resultat dieses Workflows ist bereits vollständig auf einem Webserver gehostet und kann direkt über unseren Link aufgerufen werden: [https://im4-follevindl.jessicahaeseli.ch/](https://im4-follevindl.jessicahaeseli.ch/)
