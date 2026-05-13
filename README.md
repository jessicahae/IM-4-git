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

Die WebApp wurde **mobile-first** aufgebaut, da sie vor allem schnell und unkompliziert auf dem Smartphone genutzt werden soll. Für größere Bildschirme wurden responsive Anpassungen ergänzt.

---

## 📱 WebApp Ablauf (Screenflow)
Der grundlegende Ablauf zur Nutzung der App gestaltet sich wie folgt (ein genauer Screenflow ist zudem auf unserem Projektvideo ersichtlich):

1. **Registrieren** eines neuen Accounts.
2. **Einloggen** in das Dashboard.
3. **Kind(er) hinzufügen** -> Dabei z. B. die Sensornummer `67` wählen.
4. **Vorratssensor verbinden** -> Über den Hinweis bei „Vorrat“ unter „Profil“ den Vorratssensor mit der Nummer `69` verbinden.
5. **Dashboard nutzen** -> Alle Live-Daten und Statistiken werden nun übersichtlich dargestellt.

---

## 🛠️ Projektstruktur & Technologien
Technisch basiert die WebApp auf **HTML, CSS, JavaScript, PHP und MySQL**. Die Projektstruktur ist bewusst simpel und modular gehalten:

* **Frontend:** Jede Hauptseite besteht aus einer HTML-Datei und einer passenden JavaScript-Datei. Die wichtigsten Seiten sind `index.html` (Dashboard), `profile.html` (Profilverwaltung) sowie die Login- und Registrierungsseiten.
* **Backend (`/api`):** Die PHP-Dateien im Ordner `api` übernehmen die gesamte Kommunikation mit der Datenbank (z.B. für Kinder, Sensoren, Benutzerdaten, Windelstatistik und Vorrat).

### 🗄️ Datenbank
Die MySQL-Datenbank enthält unter anderem folgende wichtige Tabellen:
* `users`: Speichert die Benutzerdaten.
* `children`: Speichert die Kinder eines Benutzers und verweist auf einen spezifischen Windelsensor.
* `sensors`: Enthält die manuell erfassten Sensoren mit Nummer und Typ (Diaper- oder Stocksensor).
* `diaper_event`: Speichert die Status-Updates der Windelsensoren.
* `stock`: Speichert die Füllstände und Verbräuche des Vorratssensors.

---

## 🔌 Datenschnittstelle zum Physical-Computing (PC)
Die Brücke zwischen Hardware und Software: Die Sensordaten werden vom Hardware-Setup über HTTP-POST-Requests an unsere PHP-Schnittstellen (wie z. B. `api/get_stock.php` und `api/children.php`) gesendet und dort sicher in der MySQL-Datenbank gespeichert und verarbeitet.

---

## ⚙️ Reproduzierbarkeit & Lokales Setup
Die WebApp ist bereits vollständig lauffähig auf einem Webserver gehostet und kann direkt über unseren [Live-Link](https://im4-follevindl.jessicahaeseli.ch/) aufgerufen und getestet werden. Es ist somit keine eigene Installation zur Begutachtung notwendig.

Für die Entwicklung und eine allfällige theoretische lokale Reproduktion haben wir eine Serverumgebung mit **PHP** sowie **phpMyAdmin** zur Strukturierung und Verwaltung der MySQL-Datenbank genutzt.
