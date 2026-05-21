# Folle Vindl – WebApp

## Kurzbeschreibung des Projekts

* **Modul:** Interaktive Medien 4 an der Fachhochschule Graubünden (FS26)  
* **Themenfeld:** IoT-Applikation zum Thema Eltern mit kleinen Kindern  
* **Name des Projekts:** Folle Vindl  
* **Team Physical Computing:** Jana Gerber, Thierry Ehrsam  
* **Team WebApp:** Benjamin Zuberbühler, Jessica Häseli

Folle Vindl ist eine mobile-first WebApp für junge Eltern. Die Anwendung hilft dabei, den Windelstatus sowie den gemeinsamen Windelvorrat mehrerer Kinder übersichtlich zu verwalten.

Das Projekt löst ein alltägliches Problem von Eltern mit kleinen Kindern: Sie erhalten eine schnelle Übersicht darüber, ob eine Windel trocken, nass oder voll ist und wie lange der vorhandene Windelvorrat ungefähr noch reicht. Der Sinn des Systems besteht darin, Sensordaten aus dem Physical-Computing-Teil in einer Datenbank zu speichern und diese in der WebApp verständlich aufzubereiten.

Eltern sollen auf einen Blick sehen:

* ob eine Windel trocken, nass oder voll ist
* wie viele Windeln noch vorhanden sind
* wie lange der Vorrat ungefähr noch reicht
* wie hoch der durchschnittliche Windelverbrauch pro Kind ist

### UX & Konzeption

Die WebApp wurde mobile-first konzipiert, da sie vor allem schnell und unkompliziert auf dem Smartphone genutzt werden soll. Für grössere Bildschirme wurden responsive Anpassungen ergänzt.

#### Design & UI

Gestalterisch orientiert sich die App an einem skizzenhaften Comic-Stil, inspiriert von «Gregs Tagebuch». Die Oberfläche arbeitet mit:

* liniertem Papierhintergrund
* schwarzen Umrandungen und leicht versetzten Schatten
* handschriftlicher Schrift
* simplen Icons

#### WebApp-Ablauf / Screenflow

Der grundlegende Ablauf zur Nutzung der App ist wie folgt aufgebaut:

1. **Registrieren** eines neuen Accounts.
2. **Einloggen** in das Dashboard.
3. **Kind(er) hinzufügen**: Dabei die Sensornummer `67` wählen.
4. **Vorratssensor verbinden**: Über den Hinweis bei «Vorrat» unter «Profil» den Vorratssensor mit der Nummer `69` verbinden.
5. **Dashboard nutzen**: Alle Live-Daten und Statistiken werden übersichtlich dargestellt.
6. **Profilverwaltung nutzen**: Auf der Profilseite können das eigene Profilbild sowie persönliche Benutzerdaten wie Name, E-Mail und Passwort angepasst werden.

* **Figma:** https://www.figma.com/design/uJjbZn30EALlgVJli1hM1l/IM-4-%E2%80%93-App-Konzeption-Vorlage?node-id=152-143&t=UIo34B0GKdiUiSTJ-1
* **User Flow:** https://www.figma.com/design/uJjbZn30EALlgVJli1hM1l/IM-4-%E2%80%93-App-Konzeption-Vorlage?node-id=152-143&t=UIo34B0GKdiUiSTJ-1
* **Angedachte Features:** Verwaltung von Windelstatus, Windelvorrat, Verbrauchsstatistik und Profilinformationen.

### Setup

* **WebApp:** [https://im4-follevindl.jessicahaeseli.ch/](https://im4-follevindl.jessicahaeseli.ch/)  
* **Video-Dokumentation:** Link

#### Installationsanleitung WebApp

Die WebApp basiert auf **HTML, CSS, JavaScript, PHP und MySQL**. Für die Installation auf einem eigenen Server wird eine Webserver-Umgebung mit PHP und MySQL benötigt.

1. **Infrastruktur bereitstellen**  
   Einen Webserver mit PHP-Unterstützung und MySQL-Datenbank verwenden. Für die Datenbankverwaltung kann phpMyAdmin genutzt werden.

2. **Projekt klonen oder hochladen**  
   Das Repository auf den Server kopieren oder per Git klonen.

3. **Dateien auf dem Webserver platzieren**  
   Die WebApp-Dateien in das gewünschte Webverzeichnis legen, sodass `index.html`, `profile.html` sowie die Login- und Registrierungsseiten erreichbar sind.

4. **Datenbank importieren**  
   Die MySQL-Datenbank in phpMyAdmin importieren oder dort manuell gemäss ERM erstellen. Die Datenbank benötigt unter anderem die Tabellen `users`, `children`, `sensors`, `diaper_event` und `stock`.

5. **DB-Credentials eintragen**  
   Die Zugangsdaten zur Datenbank in den zuständigen PHP-Konfigurationsdateien beziehungsweise API-Dateien eintragen.

6. **Sensoren vorbereiten**  
   In der Tabelle `sensors` müssen die benötigten Sensoren vorhanden sein. Für die WebApp-Nutzung sind im aktuellen Stand die Sensornummern `67` für den Windelsensor und `69` für den Vorratssensor relevant.

7. **WebApp testen**  
   Einen Account registrieren, einloggen, ein Kind mit der Sensornummer `67` hinzufügen und den Vorratssensor mit der Nummer `69` verbinden.

8. **Physisches Artefakt in Betrieb nehmen**  
   Das Physical-Computing-System muss Sensordaten fortlaufend in die Tabellen `diaper_event` und `stock` schreiben. Erst dadurch werden Live-Daten in der WebApp angezeigt.

#### Bauanleitung Physical Computing
1. **Arduino IDE aufsetzen**
    * Installiere unter https://www.arduino.cc/en/software Arduino IDE.
    * Öffne Ardunio IDE und lade die ESP-Boards unter Tools / Board / Board Manager -> esp32 von espressif suchen und installieren
    * Mikrocontrollerboard auswählen unter Tools / Board / esp32 / ESP32-C6 Dev Module
    * Danach im Bibliotheksmanager folgende Bibliotheken installieren:
    * HX711 -> Wägesensor
    * Adafruit NeoPixel -> LED-Ring
    * WiFi.h -> WLAN-Verbindung
    * HTTPClient.h -> API-Kommunikation
    * Arduino_JSON.h -> JSON-Verarbeitung
    * Code für Microcontroller ist unter arduino/diaper_stock_microcontoller/diaper_stock_microcontroller.ino abgelegt

2. **Verwendete Sensoren/Aktoren**
    * Bodenfeuchtigkeitssensor (Capacitive Soil Moisture Sensor) -> Erkennt wenn Baby kleine Geschäft verrichtet hat.
    * Gas-Sensor (MQ-135) -> Ergänzt Feuchtigkeitssensor, um grosses Geschäft zu erkennen.
    * Gewichtsensor (Wägesensor mit HX711) -> Misst aktuellen Windelstock
    * Bedrahtete LED -> Leuchtet so lange bis Referenzgewicht von einer Windel erfasst wurde
    * Lauflicht (WS2812B (“Neopixel”)) -> -	Leuchtet Gelb bei kleinem Geschäft und rot bei grossem Geschäft

3. **Komponenten in MC einstecken** 
    * Anschlüsse können dem Steckplan entnommen werden.

4. **Systemstart & Kalibrierung**
    * Waage muss beim Start leer sein (Tare/Nullpunkt).
    * Referenz-LED leuchtet -> genau eine Windel auflegen.
    * Das Gewicht wird 10 Sekunden gemessen und als Referenz gespeichert.
    * Danach kalibriert sich der MQ-135 für 60 Sekunden.
    * Währenddessen leuchtet der LED-Ring blau.

5. **LED-Status** 
    * Blau → Kalibrierung läuft
    * Grün → Alles normal
    * Gelb → Windel nass
    * Rot → Windel voll

6. **Datenübertragung**
    * api/load/diaper.php -> Ereignisse (nass, voll, trocken)
    * api/load/stock.php -> Windelbestand
    
7. **Hinweise**
    * Waage muss beim Start leer sein.
    * Referenz neu messen bei anderem Windeltyp.
    * Ereignisse werden erst nach stabiler Messung bestätigt.
    * Während der Kalibrierung können keine neuen Ereignisse erkannt werden.


* **Komponentenplan:** [Schaubild ergänzen]
  * eingesetzte Komponenten
  * verbundene Sensoren und Aktoren
  * Programme mit Dateinamen
  * Kommunikationswege
* **Steckplan:** [Fritzing-, Tinkercad- oder Wokwi-Plan ergänzen]
* **Bildmaterial:** [Bilder ergänzen]
* **Inbetriebnahme:** Das physische Artefakt muss die Messwerte für Windelstatus und Vorrat in die Datenbanktabellen `diaper_event` und `stock` übertragen.

## Technische Details

### Projektstruktur / Code-Struktur

* **Frontend:** Jede Hauptseite besteht aus einer HTML-Datei und einer passenden JavaScript-Datei. Die wichtigsten Seiten sind `index.html` für das Dashboard, `profile.html` für die Profilverwaltung sowie die Login- und Registrierungsseiten.
* **Backend (`/api`):** Die PHP-Dateien im Ordner `api` übernehmen die Kommunikation mit der Datenbank.
* **Benutzerverwaltung:** Registrierung und Login schützen die App über Sessions. Nur eingeloggte Benutzende können Dashboard und Profil nutzen.
* **Profilbilder:** Profilbilder werden global im Header, Dashboard und Profil synchronisiert.

### Datenbank

Die MySQL-Datenbank enthält unter anderem folgende wichtige Tabellen:

* `users`: Speichert die Benutzerdaten.
* `children`: Speichert die Kinder eines Benutzers und verweist auf einen spezifischen Windelsensor.
* `sensors`: Enthält die manuell erfassten Sensoren mit Nummer und Typ, zum Beispiel Diaper- oder Stocksensor.
* `diaper_event`: Speichert Statusmeldungen der Windelsensoren, zum Beispiel trocken, nass oder voll.
* `stock`: Speichert Messwerte des Vorratssensors, darunter Sensor-Nummer, Anzahl Windeln und Zeitpunkt.

### Datenschnittstelle zwischen WebApp und Physical Computing

Ein wichtiger Teil des Projekts ist die Datenschnittstelle zwischen WebApp und Hardware. Die WebApp liest die in der Datenbank gespeicherten Sensordaten über PHP aus und verarbeitet diese im Frontend.

* **Windelstatus:** Es wird jeweils der neuste Eintrag aus `diaper_event` für die passende Sensor-Nummer ausgelesen.
* **Statistik:** Die Events pro Tag werden gezählt und mit **Chart.js** als Balkendiagramm dargestellt.
* **Vorrat:** Der neuste Eintrag aus der Tabelle `stock` zeigt den aktuellen Bestand. Aus den Tagesdifferenzen berechnet die Logik den durchschnittlichen Verbrauch pro Tag.

### Architektur & Workflow

#### 1. Datenbank-Setup mit phpMyAdmin

Im ersten Schritt wurde die Entwicklungsumgebung aufgesetzt und die MySQL-Datenbank mithilfe von **phpMyAdmin** strukturiert. Dabei wurden die grundlegenden Tabellen `users`, `children`, `sensors`, `diaper_event` und `stock` definiert. Wichtig war die Festlegung korrekter Datentypen sowie primärer und sekundärer Schlüssel, damit eine saubere Zuordnung zwischen den Tabellen möglich ist.

#### 2. Datenübergabe durch Physical Computing

Die Sensordaten werden vom Physical-Computing-System bereitgestellt. Die Daten für Windelstatus und Vorrat werden fortlaufend in die dafür vorgesehenen Datenbanktabellen `diaper_event` und `stock` eingespielt.

#### 3. Datenabruf durch die WebApp

Die WebApp liest die fortlaufend aktualisierte Datenbank aus und bereitet die Daten visuell auf. Dafür werden PHP-Skripte wie `load.php` sowie weitere Dateien im Ordner `api/` verwendet.

* Die PHP-Skripte stellen die Verbindung zur Datenbank her.
* Via `SELECT`-Abfragen werden die aktuellsten Datensätze für den jeweils eingeloggten Benutzer und seine verknüpften Sensoren geladen.
* Die ausgelesenen Daten werden im JSON-Format an das JavaScript im Frontend übergeben.
* Das Frontend verarbeitet die Daten weiter und aktualisiert Dashboard, Status-Anzeigen sowie Chart.js-Statistiken.

### ERM

Die Datenbank besteht mindestens aus den Tabellen `users`, `children`, `sensors`, `diaper_event` und `stock`.

### Authentifizierung

Die Authentifizierung erfolgt über Registrierung und Login. Nur eingeloggte Benutzende können Dashboard und Profilverwaltung nutzen. Die App verwendet PHP-Sessions, um geschützte Bereiche abzusichern.

## Known bugs

* Die Unterscheidung zwischen interner Sensor-ID und externer Sensor-Nummer führte anfangs zu falschen Datenabfragen. Das Problem wurde mit einem sauberen `JOIN` in `children.php` gelöst.
* Die vollständige Verwaltung von Vorratssensoren über die WebApp wurde nicht umgesetzt. Vorratssensoren werden aktuell primär manuell in der Datenbank erfasst und können anschliessend mit einem Profil verbunden werden.
* Reale Sensordaten und reale Bedingungen können zusätzliche Herausforderungen verursachen, die mit diesen Daten nicht vollständig simuliert werden können.
* Die Waage muss beim Start leer sein, damit der Nullpunkt korrekt gesetzt werden kann. Für die Bestandsberechnung muss zudem genau eine Referenzwindel eingemessen werden.
* Sensorwerte können leicht schwanken. Deshalb werden Ereignisse und Bestandsänderungen erst nach einer stabilen Messdauer bestätigt.
* Der MQ-135 erkennt keine exakten medizinischen Werte, sondern nur Veränderungen gegenüber dem kalibrierten Ausgangswert. Während der Neukalibrierung können keine neuen Windelereignisse erkannt werden.
* Die Waage kann durch Positionierung, Bewegungen oder die Stromversorgung beeinflusst werden.
* Sensor-Nummern müssen bereits in der Tabelle `sensors` vorhanden sein, da sonst Foreign-Key-Fehler beim Speichern entstehen können.


## Umsetzungsprozess

### Reflexion / Erfahrung / Lernfortschritt

Im Umsetzungsprozess wurde deutlich, wie wichtig klare Datenstrukturen und eindeutige Begriffe sind. Besonders die Unterscheidung zwischen Sensor-ID und Sensor-Nummer war zentral, damit Backend und Frontend dieselbe Logik verwenden.

Das Team hat ausserdem gelernt, dass Dummy-Daten zwar beim Testen helfen, reale Sensordaten aber nochmals andere Anforderungen an Stabilität, Datenqualität und Fehlerbehandlung stellen.

Ausserdem zeigte sich, dass Sensorwerte in der Praxis oft schwanken und nicht immer eindeutig sind. Deshalb wurde eine zusätzliche Logik benötigt, welche Messwerte über eine gewisse Zeit überprüft und Ereignisse erst nach stabilen Messungen bestätigt.

Hilfreich war der schrittweise Aufbau des Systems. Die Sensoren wurden zuerst einzeln getestet und anschliessend schrittweise kombiniert. Dadurch konnten Fehler schneller erkannt und eingegrenzt werden. Für zukünftige Projekte wäre es sinnvoll, die Pinbelegung und die Datenbankstruktur bereits zu Beginn definitiv festzulegen, da spätere Änderungen zusätzlichen Aufwand verursachen.

### Herausforderungen & Lösungen

* **Sensor-ID vs. Sensor-Nummer:** In der Tabelle `sensors` gibt es eine interne ID und eine externe Sensor-Nummer. Die Tabelle `children` speichert die interne ID, während die Event-Tabellen mit der Sensor-Nummer arbeiten. Dies führte anfangs zu falschen Datenabfragen. Gelöst wurde das Problem mit einem `JOIN` in `children.php`, sodass das Dashboard durchgehend mit der korrekten Sensor-Nummer arbeiten kann.
* **Vereinfachung der Profilseite:** Ursprünglich war geplant, Vorratssensoren über die WebApp vollständig zu verwalten. Da diese primär manuell in der Datenbank erfasst werden, wurde die Logik angepasst. Benutzende können nun vorhandene Sensoren mit ihrem Profil verbinden.
* **Abgleich von Backend und Frontend:** Durch intensives Debugging wurde klar, dass Backend und Frontend exakt dieselbe Logik verwenden müssen, damit die Anwendung zuverlässig funktioniert.
* **Kombination mehrerer Sensoren:** Feuchtigkeits-, Gas- und Gewichtssensor mussten parallel funktionieren. Dafür wurde eine Ereignislogik umgesetzt, welche `nass`, `voll` und `trocken` abhängig von stabilen Sensorwerten speichert.
* **Schwankende Sensorwerte:** Da Sensoren keine konstanten Werte liefern, werden Ereignisse erst nach einer stabilen Messdauer bestätigt.
* **Bestandsmessung:** Statt fixer Rohwerte wird beim Start eine Referenzwindel gemessen. Dadurch kann der Bestand flexibler berechnet werden.
* **Datenbankabhängigkeiten:** Sensor-Nummern mussten zuerst in der Tabelle `sensors` vorhanden sein, bevor Daten in `diaper` oder `stock` gespeichert werden konnten.
* **Schrittweises Testen:** Die Sensoren wurden zuerst einzeln und danach gemeinsam getestet, wodurch Fehler einfacher gefunden werden konnten.


### KI-Einsatz

Mögliche Ergänzung:

* Unterstützung bei Formulierungen und Strukturierung der Projektdokumentation.
* Unterstützung beim Debugging oder bei der Erklärung technischer Zusammenhänge.
* Unterstützung bei der Vereinheitlichung der README-Struktur.
* Die KI half beim Kombinieren der Sensorcodes, beim Aufbau der Ereignislogik, beim Schreiben der PHP-Endpunkte.

### Fazit

Folle Vindl verbindet Physical Computing mit einer alltagsnahen WebApp. Die Anwendung zeigt, wie Sensordaten über eine Datenbank in eine verständliche Benutzeroberfläche übertragen werden können. Besonders wichtig waren dabei eine klare Datenstruktur, verständliche Schnittstellen und eine konsistente Logik zwischen Backend und Frontend.




