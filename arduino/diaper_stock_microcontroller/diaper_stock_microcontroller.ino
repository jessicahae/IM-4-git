/************************************************************************
 * Gesamtcode:
 * Feuchtigkeitssensor + MQ-135 + HX711 Waage + kleine LED + LED-Ring + WLAN/DB
 *
 * Pinbelegung:
 * GPIO2 = WS2812B LED-Ring
 * GPIO3 = kleine LED für Waagen-Referenz
 * GPIO4 = Gas-Sensor MQ-135
 * GPIO5 = Feuchtigkeitssensor
 * GPIO6 = HX711 DT
 * GPIO7 = HX711 SCK
 *
 * Datenbank-Endpunkte:
 *
 * Windel-Events:
 * POST an /api/load/diaper.php
 * JSON:
 * {
 *   "type": "nass" | "voll" | "trocken",
 *   "sensors_number": 67
 * }
 *
 * Bestand:
 * POST an /api/load/stock.php
 * JSON:
 * {
 *   "sensors_number": 69,
 *   "amount": 7
 * }
 *
 * Event-Logik:
 * - Feuchtigkeit bestätigt: type = "nass" wird direkt gesendet
 * - Gas zusätzlich bestätigt: type = "voll" wird direkt gesendet
 * - Wieder trocken bestätigt: type = "trocken" wird gesendet
 *
 * LED bei Waage:
 * - Am Anfang aus = Waage ist im Tare-Modus (Waage muss leer sein)
 * - Led geht an = 1 Windel auf Waage legen, um Gewicht von 1 Windel zu ermitteln
 * - Nach 10 Sekunden: Led geht aus = Alle Windeln des Vorrats könne raufgelegt werden und der Windel-Vorrat wird automatisch berechnet und aktualisiert
 *
 * LED-Ring:
 * - Während Gas-Kalibrierung: blau
 * - Status "nichts": grün
 * - Status "nass": gelb
 * - Status "voll": rot
 ************************************************************************/

#include <WiFi.h>
#include <HTTPClient.h>
#include <Arduino_JSON.h>
#include <Adafruit_NeoPixel.h>
#include "HX711.h"

// --------------------------------------------------
// WLAN / Server
// --------------------------------------------------

const char* ssid = "tinkergarden"; // Name des WLAN-Netzwerks, mit dem sich der ESP32 verbinden soll
const char* pass = "strenggeheim"; // Passwort des WLAN-Netzwerks

const char* diaperURL = "https://im4-follevindl.jessicahaeseli.ch/api/load/diaper.php"; // API-Endpunkt für Windel-Ereignisse wie "nass", "voll" oder "trocken"
const char* stockURL  = "https://im4-follevindl.jessicahaeseli.ch/api/load/stock.php"; // API-Endpunkt für den aktuellen Windelbestand

// Speichert, ob der ESP32 aktuell mit dem WLAN verbunden ist
bool isWlanConnected = false;


// --------------------------------------------------
// Sensor-Nummern für Datenbank
// --------------------------------------------------

const int diaperSensorNumber = 67; // Sensor-ID des Windelsensors in der Datenbank
const int stockSensorNumber = 69; // Sensor-ID des Gewichtssensors / Bestandssensors in der Datenbank

// --------------------------------------------------
// Pins
// --------------------------------------------------

const int ledRingPin = 2;
const int referenceLedPin = 3;
const int gasPin = 4;
const int moisturePin = 5;
const int HX_DT = 6;
const int HX_SCK = 7;

const int wifiLedPin = LED_BUILTIN;


// --------------------------------------------------
// LED-Ring
// --------------------------------------------------

#define NUM_PIXELS 12

Adafruit_NeoPixel strip = Adafruit_NeoPixel(NUM_PIXELS, ledRingPin, NEO_GRB + NEO_KHZ800);

const unsigned long ledRingInterval = 80; // Zeitabstand zwischen zwei LED-Animationsschritten in Millisekunden
unsigned long lastLedRingUpdate = 0; // Speichert den Zeitpunkt der letzten LED-Ring-Aktualisierung
int ledStep = 0; // Zähler für die LED-Animation, damit die Farben leicht pulsieren / wandern

// --------------------------------------------------
// Waage
// --------------------------------------------------

HX711 scale;

const long referenceDetectThreshold = 300; // Mindest-Rohwert, ab dem ein aufgelegtes Referenzgewicht erkannt wird
const long emptyThreshold = 150; // Werte unterhalb dieser Grenze gelten als Rauschen beziehungsweise als leere Waage

const unsigned long referenceMeasureTime = 10000; // 10 Sekunden Referenzmessung
const unsigned long stockCheckInterval = 2000;    // alle 2 Sekunden Bestand prüfen
const unsigned long stockStableTime = 5000;       // 5 Sekunden stabil, bevor DB-Eintrag

long wertProWindel = 0; // Rohwert, der dem Gewicht von einer Windel entspricht
bool referenceReady = false; // Gibt an, ob die Referenzmessung abgeschlossen und die Waage bereit ist
bool waitingForReference = true; // Gibt an, ob das System aktuell auf das Auflegen der Referenzwindel wartet

int lastSentDiaperCount = -1; // Zuletzt erfolgreich an die Datenbank gesendeter Windelbestand
int candidateDiaperCount = -1; // Möglicher neuer Windelbestand, der gerade auf Stabilität geprüft wird

unsigned long candidateSince = 0; // Zeitpunkt, seit dem der mögliche neue Bestand erkannt wurde
unsigned long lastStockCheck = 0; // Zeitpunkt der letzten Bestandsprüfung
unsigned long lastScalePrint = 0; // Zeitpunkt der letzten Waagen-Ausgabe im Serial Monitor

// --------------------------------------------------
// Sensor-Schwellenwerte
// --------------------------------------------------

const int moistureThreshold = 1900; // Feuchtigkeitswert, unterhalb dessen die Windel als feucht gilt
const int gasChangeThreshold = 300; // Mindeständerung des Gaswerts gegenüber der Baseline, damit Gas als erkannt gilt

// --------------------------------------------------
// Zeiten Sensorlogik
// --------------------------------------------------

// Dauer der Gas-Kalibrierung zur Ermittlung des Ausgangswerts
const unsigned long calibrationTime = 60000;   // 60 Sekunden Gas-Kalibrierung

// Dauer, über die Feuchtigkeit oder Gas stabil erkannt werden muss
const unsigned long confirmTime = 3000;        // 3 Sekunden bestätigen

// Dauer, über die Trockenheit stabil erkannt werden muss
const unsigned long dryConfirmTime = 5000;     // 5 Sekunden trocken bestätigen

// --------------------------------------------------
// Sensorwerte
// --------------------------------------------------

int gasValue = 0; // Aktueller Messwert des Gassensors
int moistureValue = 0; // Aktueller Messwert des Feuchtigkeitssensors
int gasBaseline = 0; // Kalibrierter Ausgangswert des Gassensors

// --------------------------------------------------
// Ereignisstatus
// --------------------------------------------------

bool eventActive = false; // Gibt an, ob aktuell ein Windelereignis läuft
bool eventConfirmed = false; // Gibt an, ob ein erkanntes Ereignis bereits bestätigt wurde
bool gasCalibrationActive = false; // Gibt an, ob gerade die Gas-Kalibrierung läuft

String currentStatus = "nichts"; // Aktueller Windelstatus für Logik und LED-Ring. mögliche Werte: "nichts", "klein", "gross" 
bool fullEventAlreadySent = false; // Merkt, ob für das aktuelle Ereignis schon "voll" gesendet wurde

// --------------------------------------------------
// Setup
// --------------------------------------------------

void setup() {
  Serial.begin(115200);
  delay(1000);

  pinMode(referenceLedPin, OUTPUT);
  digitalWrite(referenceLedPin, LOW);

  strip.begin();
  strip.setBrightness(50);
  strip.clear();
  strip.show();

  Serial.println("System startet...");
  Serial.println("Pinbelegung: GPIO3 Referenz-LED, GPIO4 Gas, GPIO5 Feuchtigkeit, GPIO6 DT, GPIO7 SCK, GPIO2 LED-Ring");
  Serial.println("------------------------------");

  connectWiFi();
  setupScale();
  calibrateGasSensor();
}


// --------------------------------------------------
// Loop
// --------------------------------------------------

void loop() {
  is_wlan_connected();

  gasValue = analogRead(gasPin);
  moistureValue = analogRead(moisturePin);

  updateLedRing();
  updateScaleLogic();

  // --------------------------------------------------
  // Kein Ereignis aktiv: auf Feuchtigkeit warten
  // --------------------------------------------------

  if (!eventActive) {
    if (moistureValue < moistureThreshold) {
      Serial.println("Moegliche Feuchtigkeit erkannt.");

      bool moistureConfirmed = confirmMoisture();

      if (moistureConfirmed) {
        Serial.println("Feuchtigkeit wurde bestaetigt.");
        Serial.println("Sende Windelstatus: nass");

        eventActive = true;
        eventConfirmed = true;
        currentStatus = "klein";
        fullEventAlreadySent = false;

        sendDiaperEventToDatabase("nass");

        bool gasConfirmed = confirmGasChange();

        if (gasConfirmed) {
          currentStatus = "gross";
          fullEventAlreadySent = true;

          Serial.println("Gas wurde ebenfalls bestaetigt.");
          Serial.println("Sende Windelstatus: voll");

          sendDiaperEventToDatabase("voll");
        }
      } else {
        Serial.println("Feuchtigkeit war nur eine Schwankung.");
        currentStatus = "nichts";
      }
    } else {
      currentStatus = "nichts";
    }
  }

  // --------------------------------------------------
  // Ereignis aktiv: weiter beobachten
  // --------------------------------------------------

  if (eventActive && eventConfirmed) {

    // Falls es bisher nur nass war, kann es währenddessen noch voll werden
    if (currentStatus == "klein" && fullEventAlreadySent == false) {
      int gasDifference = gasValue - gasBaseline;

      if (abs(gasDifference) >= gasChangeThreshold) {
        Serial.println("Moegliche Gasveraenderung waehrend Ereignis erkannt.");

        bool gasConfirmedLater = confirmGasChange();

        if (gasConfirmedLater) {
          currentStatus = "gross";
          fullEventAlreadySent = true;

          Serial.println("Ereignis wurde von nass auf voll aktualisiert.");
          Serial.println("Sende Windelstatus: voll");

          sendDiaperEventToDatabase("voll");
        } else {
          Serial.println("Gasveraenderung war nicht stabil. Ereignis bleibt nass.");
        }
      }
    }

    // Trockenheit prüfen
    if (moistureValue > moistureThreshold) {
      Serial.println("Moegliche Trockenheit erkannt.");

      bool dryConfirmed = confirmDry();

      if (dryConfirmed) {
        Serial.println("Trockenheit wurde bestaetigt.");
        Serial.println("Sende Windelstatus: trocken");

        sendDiaperEventToDatabase("trocken");

        currentStatus = "nichts";
        eventActive = false;
        eventConfirmed = false;
        fullEventAlreadySent = false;

        Serial.println("Starte neue Gas-Kalibrierung...");
        calibrateGasSensor();
      } else {
        Serial.println("Trockenheit war nur eine Schwankung. Ereignis bleibt aktiv.");
      }
    }
  }

  delay(50);
}


// --------------------------------------------------
// WLAN
// --------------------------------------------------

void connectWiFi() {
  Serial.print("Verbinde mit WLAN: ");
  Serial.println(ssid);

  WiFi.begin(ssid, pass);

  int attempts = 0;

  while (WiFi.status() != WL_CONNECTED && attempts < 40) {
    delay(500);
    Serial.print(".");
    attempts++;
  }

  if (WiFi.status() == WL_CONNECTED) {
    isWlanConnected = true;

    Serial.println();
    Serial.println("WiFi verbunden.");
    Serial.print("SSID: ");
    Serial.println(ssid);
    Serial.print("IP-Adresse: ");
    Serial.println(WiFi.localIP());

    setWifiLed(true);
  } else {
    isWlanConnected = false;

    Serial.println();
    Serial.println("WiFi Verbindung fehlgeschlagen.");

    setWifiLed(false);
  }
}

// --------------------------------------------------
// Waage Setup
// --------------------------------------------------

void setupScale() {
  Serial.println("------------------------------");
  Serial.println("Waage startet. Bitte Waage leer lassen.");
  Serial.println("------------------------------");

  digitalWrite(referenceLedPin, LOW);

  scale.begin(HX_DT, HX_SCK);
  scale.set_gain(128);

  delay(2000);

  Serial.println("Setze Tare...");
  digitalWrite(referenceLedPin, LOW);
  scale.tare(20);

  Serial.println("Tare gesetzt.");
  Serial.println("READY: Jetzt genau 1 Windel als Referenz auflegen.");
  Serial.println("------------------------------");

  waitingForReference = true;
  referenceReady = false;
  wertProWindel = 0;

  lastSentDiaperCount = -1;
  candidateDiaperCount = -1;
  candidateSince = 0;

  digitalWrite(referenceLedPin, HIGH);
}


// --------------------------------------------------
// Gas-Kalibrierung
// --------------------------------------------------

void calibrateGasSensor() {
  Serial.println("------------------------------");
  Serial.println("Gas-Kalibrierung startet.");
  Serial.println("LED-Ring ist blau: System noch nicht ready.");
  Serial.println("------------------------------");

  currentStatus = "nichts";
  gasCalibrationActive = true;

  unsigned long startTime = millis();
  unsigned long sampleCount = 0;
  long gasSum = 0;

  while (millis() - startTime < calibrationTime) {
    int currentGasValue = analogRead(gasPin);
    gasSum += currentGasValue;
    sampleCount++;

    updateLedRing();
    updateScaleLogic();

    delay(100);
  }

  if (sampleCount > 0) {
    gasBaseline = gasSum / sampleCount;
  }

  gasCalibrationActive = false;

  Serial.println("------------------------------");
  Serial.println("Gas-Kalibrierung abgeschlossen.");
  Serial.print("Neue Gas-Baseline: ");
  Serial.println(gasBaseline);
  Serial.println("System ready.");
  Serial.println("------------------------------");

  lastStatusPrint = millis();
}

// --------------------------------------------------
// Waagen-Logik
// --------------------------------------------------

void updateScaleLogic() {
  if (!scale.is_ready()) {
    return;
  }

  long rawValue = scale.get_value(10);
  long rawPositive = abs(rawValue);

  if (rawPositive < emptyThreshold) {
    rawPositive = 0;
  }

  // --------------------------------------------------
  // Phase 1: Warten auf Referenz
  // --------------------------------------------------

  if (waitingForReference) {
    digitalWrite(referenceLedPin, HIGH);

    if (rawPositive >= referenceDetectThreshold) {
      Serial.println("------------------------------");
      Serial.println("Referenzgewicht erkannt.");
      Serial.println("Starte 10 Sekunden Referenzmessung...");
      Serial.println("------------------------------");

      digitalWrite(referenceLedPin, HIGH);

      wertProWindel = measureReferenceValue();

      Serial.println("------------------------------");
      Serial.println("Referenzmessung abgeschlossen.");
      Serial.print("Wert pro Windel: ");
      Serial.println(wertProWindel);
      Serial.println("Jetzt koennen mehrere Windeln aufgelegt werden.");
      Serial.println("Bestand 1 wird NICHT an die DB gesendet.");
      Serial.println("------------------------------");

      digitalWrite(referenceLedPin, LOW);

      referenceReady = true;
      waitingForReference = false;

      // Direkt nach Referenzmessung liegt 1 Windel auf der Waage.
      // Diese 1 ist nur die Referenz und wird nicht als Bestand gesendet.
      lastSentDiaperCount = 1;
      candidateDiaperCount = -1;
      candidateSince = 0;
      lastStockCheck = millis();
    }

    return;
  }

  // --------------------------------------------------
  // Phase 2: Bestand alle 2 Sekunden prüfen
  // --------------------------------------------------

  if (referenceReady) {
    digitalWrite(referenceLedPin, LOW);

    if (millis() - lastStockCheck >= stockCheckInterval) {
      lastStockCheck = millis();
      checkAndSendDiaperStockStable();
    }

    // Wenn Waage wieder komplett leer ist, neue Referenz erlauben
    if (rawPositive == 0) {
      Serial.println("------------------------------");
      Serial.println("Waage ist wieder leer.");
      Serial.println("Neue Referenz kann aufgelegt werden.");
      Serial.println("------------------------------");

      referenceReady = false;
      waitingForReference = true;
      wertProWindel = 0;

      lastSentDiaperCount = -1;
      candidateDiaperCount = -1;
      candidateSince = 0;

      digitalWrite(referenceLedPin, HIGH);
    }
  }
}

// --------------------------------------------------
// Referenzmessung Waage
// --------------------------------------------------

long measureReferenceValue() {
  unsigned long startTime = millis();
  long sum = 0;
  unsigned long count = 0;

  digitalWrite(referenceLedPin, HIGH);

  while (millis() - startTime < referenceMeasureTime) {
    updateLedRing(); //Damit LED-Ring auch während Waage-Logik weiteranimiert bleibt

    if (scale.is_ready()) {
      long rawValue = scale.get_value(1);
      long rawPositive = abs(rawValue);

      if (rawPositive >= referenceDetectThreshold) {
        sum += rawPositive;
        count++;
      }
    }

    delay(200);
  }

  if (count == 0) {
    Serial.println("Fehler: Keine gueltigen Referenzwerte erhalten.");
    return 0;
  }

  long average = sum / count;

  if (average < referenceDetectThreshold) {
    Serial.println("Warnung: Referenzwert ist sehr klein.");
  }

  return average;
}

// --------------------------------------------------
// Bestand berechnen und erst nach 5 Sekunden stabil senden
// --------------------------------------------------

void checkAndSendDiaperStockStable() {
  if (!referenceReady || wertProWindel <= 0) {
    return;
  }

  long rawValue = scale.get_value(20);
  long rawPositive = abs(rawValue);

  if (rawPositive < emptyThreshold) {
    rawPositive = 0;
  }

  int diaperCount = round((float)rawPositive / wertProWindel);

  if (diaperCount < 0) {
    diaperCount = 0;
  }

  // Kein neues Senden, wenn es dem zuletzt gesendeten Bestand entspricht
  if (diaperCount == lastSentDiaperCount) {
    candidateDiaperCount = -1;
    candidateSince = 0;
    return;
  }

  // Neuer möglicher Bestand erkannt
  if (candidateDiaperCount != diaperCount) {
    candidateDiaperCount = diaperCount;
    candidateSince = millis();

    Serial.print("Moegliche Bestandsaenderung erkannt: ");
    Serial.println(candidateDiaperCount);
    Serial.println("Warte 5 Sekunden, ob der Wert stabil bleibt...");
    return;
  }

  // Gleicher Kandidat erneut gemessen
  if (millis() - candidateSince >= stockStableTime) {
    Serial.print("Bestand ist seit 5 Sekunden stabil: ");
    Serial.println(diaperCount);

    Serial.print("Sende Bestand an DB: ");
    Serial.println(diaperCount);

    sendStockToDatabase(diaperCount);

    lastSentDiaperCount = diaperCount;
    candidateDiaperCount = -1;
    candidateSince = 0;
  }
}


// --------------------------------------------------
// Feuchtigkeit bestätigen
// --------------------------------------------------

bool confirmMoisture() {
  Serial.println("Pruefe Feuchtigkeit fuer 3 Sekunden...");

  unsigned long startTime = millis();

  while (millis() - startTime < confirmTime) {
    int currentMoistureValue = analogRead(moisturePin);

    updateLedRing();
    updateScaleLogic();

    if (currentMoistureValue >= moistureThreshold) {
      Serial.println("Feuchtigkeit nicht stabil.");
      return false;
    }

    delay(100);
  }

  return true;
}

// --------------------------------------------------
// Gasänderung bestätigen
// --------------------------------------------------

bool confirmGasChange() {
  Serial.println("Pruefe Gasveraenderung fuer 3 Sekunden...");

  unsigned long startTime = millis();

  while (millis() - startTime < confirmTime) {
    int currentGasValue = analogRead(gasPin);
    int gasDifference = currentGasValue - gasBaseline;

    updateLedRing();
    updateScaleLogic();

    if (abs(gasDifference) < gasChangeThreshold) {
      Serial.println("Gasveraenderung nicht stabil oder zu klein.");
      return false;
    }

    delay(500);
  }

  Serial.println("Gasveraenderung wurde bestaetigt.");
  return true;
}

// --------------------------------------------------
// Trockenheit bestätigen
// --------------------------------------------------

bool confirmDry() {
  Serial.println("Pruefe Trockenheit fuer 5 Sekunden...");

  unsigned long startTime = millis();

  while (millis() - startTime < dryConfirmTime) {
    int currentMoistureValue = analogRead(moisturePin);

    updateLedRing();
    updateScaleLogic();

    if (currentMoistureValue <= moistureThreshold) {
      Serial.println("Trockenheit nicht stabil.");
      return false;
    }

    delay(100);
  }

  return true;
}

// --------------------------------------------------
// DB senden: Windel-Events
// --------------------------------------------------

void sendDiaperEventToDatabase(String typeValue) {
  if (WiFi.status() != WL_CONNECTED) {
    Serial.println("DB-Senden Windelstatus nicht moeglich: WLAN nicht verbunden.");
    return;
  }

  JSONVar dataObject;
  dataObject["type"] = typeValue;
  dataObject["sensors_number"] = diaperSensorNumber;

  String jsonString = JSON.stringify(dataObject);

  Serial.println("------------------------------");
  Serial.println("Sende Windelstatus an Datenbank:");
  Serial.println(jsonString);
  Serial.println("------------------------------");

  HTTPClient http;
  http.begin(diaperURL);
  http.addHeader("Content-Type", "application/json");

  int httpResponseCode = http.POST(jsonString);

  if (httpResponseCode > 0) {
    String response = http.getString();

    Serial.print("HTTP Response code: ");
    Serial.println(httpResponseCode);

    Serial.print("Response: ");
    Serial.println(response);
  } else {
    Serial.print("Fehler beim Senden Windelstatus. HTTP-Code: ");
    Serial.println(httpResponseCode);
  }

  http.end();
}

// --------------------------------------------------
// DB senden: Bestand
// --------------------------------------------------

void sendStockToDatabase(int amountValue) {
  if (WiFi.status() != WL_CONNECTED) {
    Serial.println("DB-Senden Bestand nicht moeglich: WLAN nicht verbunden.");
    return;
  }

  JSONVar dataObject;
  dataObject["sensors_number"] = stockSensorNumber;
  dataObject["amount"] = amountValue;

  String jsonString = JSON.stringify(dataObject);

  Serial.println("------------------------------");
  Serial.println("Sende Bestand an Datenbank:");
  Serial.println(jsonString);
  Serial.println("------------------------------");

  HTTPClient http;
  http.begin(stockURL);
  http.addHeader("Content-Type", "application/json");

  int httpResponseCode = http.POST(jsonString);

  if (httpResponseCode > 0) {
    String response = http.getString();

    Serial.print("HTTP Response code: ");
    Serial.println(httpResponseCode);

    Serial.print("Response: ");
    Serial.println(response);
  } else {
    Serial.print("Fehler beim Senden Bestand. HTTP-Code: ");
    Serial.println(httpResponseCode);
  }

  http.end();
}

bool is_wlan_connected() {
  if (WiFi.status() != WL_CONNECTED) {
    if (isWlanConnected == true) {
      Serial.println("WiFi-Verbindung verloren, reconnect...");
      isWlanConnected = false;
      setWifiLed(false);
    }

    connectWiFi();
    return false;
  }

  if (isWlanConnected == false) {
    setWifiLed(true);
  }

  isWlanConnected = true;
  return true;
}

void setWifiLed(bool connected) {
  if (connected) {
    rgbLedWrite(wifiLedPin, 0, 80, 0); // grün
  } else {
    rgbLedWrite(wifiLedPin, 80, 0, 0); // rot
  }
}

// --------------------------------------------------
// LED-Ring Animation
// --------------------------------------------------

void updateLedRing() {
  if (millis() - lastLedRingUpdate < ledRingInterval) {
    return;
  }

  lastLedRingUpdate = millis();
  ledStep++;

  for (int i = 0; i < strip.numPixels(); i++) {
    int wave = (sin((ledStep + i * 20) * 0.1) + 1) * 30;

    int r = 0;
    int g = 0;
    int b = 0;

    if (gasCalibrationActive) {
      // Blau während Gas-Kalibrierung = System noch nicht ready
      r = 0;
      g = 20 + wave;
      b = 120 + wave;
    } else if (currentStatus == "nichts") {
      // Grün
      r = 0;
      g = 120 + wave;
      b = 0;
    } else if (currentStatus == "klein") {
      // Gelb = nass
      r = 150 + wave;
      g = 120 + wave;
      b = 0;
    } else if (currentStatus == "gross") {
      // Rot = voll
      r = 150 + wave;
      g = 0;
      b = 0;
    }

    r = constrain(r, 0, 255);
    g = constrain(g, 0, 255);
    b = constrain(b, 0, 255);

    strip.setPixelColor(i, strip.Color(r, g, b));
  }

  strip.show();
}