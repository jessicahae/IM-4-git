/************************************************************************
 * Kombi: Feuchtigkeitssensor + MQ-135 Gassensor
 *
 * Gas-Sensor MQ-135:
 * AO   <-> ESP32-C6 GPIO4
 * VCC  <-> 5V
 * GND  <-> GND
 *
 * Feuchtigkeitssensor:
 * AOUT <-> ESP32-C6 GPIO10
 * +    <-> 3.3V
 * -    <-> GND
 *
 * Logik:
 * - Beim Start: 60 Sekunden Gas-Baseline kalibrieren
 * - Feuchtigkeit unter 1600 = mögliches Ereignis
 * - Feuchtigkeit muss 3 Sekunden stabil bleiben
 * - Gasänderung +/- 300 zur Baseline muss ebenfalls 3 Sekunden stabil bleiben
 * - Feuchtigkeit + Gas = gross
 * - Nur Feuchtigkeit = klein
 * - Trocken, sobald Feuchtigkeit wieder über 1600 ist
 * - Nach Trockenheit: neue 60-Sekunden-Gaskalibrierung
 ************************************************************************/

const int gasPin = 4;
const int moisturePin = 5;

// Schwellenwerte
const int moistureThreshold = 1600;
const int gasChangeThreshold = 300;

// Zeiten
const unsigned long calibrationTime = 60000;   // 60 Sekunden
const unsigned long confirmTime = 3000;        // 3 Sekunden
const unsigned long statusInterval = 2000;     // 2 Sekunden

// Sensorwerte
int gasValue = 0;
int moistureValue = 0;
int gasBaseline = 0;

// Ereignis-Tracking
int eventNumber = 1;
bool eventActive = false;
bool eventConfirmed = false;
String currentStatus = "nichts";

// Status-Timer
unsigned long lastStatusPrint = 0;

void setup() {
  Serial.begin(115200);
  delay(1000);

  Serial.println("System startet...");
  Serial.println("Gas-Sensor: GPIO4");
  Serial.println("Feuchtigkeitssensor: GPIO10");
  Serial.println("------------------------------");

  calibrateGasSensor();
}

void loop() {
  gasValue = analogRead(gasPin);
  moistureValue = analogRead(moisturePin);

  // Status alle 2 Sekunden ausgeben
  printStatusEveryTwoSeconds();

  // Wenn kein Ereignis aktiv ist, prüfen wir auf Feuchtigkeit
  if (!eventActive) {
    if (moistureValue < moistureThreshold) {
      Serial.println("Moegliche Feuchtigkeit erkannt.");
      Serial.print("Feuchtigkeitswert: ");
      Serial.println(moistureValue);

      bool moistureConfirmed = confirmMoisture();

      if (moistureConfirmed) {
        Serial.println("Feuchtigkeit wurde nach 3 Sekunden bestaetigt.");
        eventActive = true;

        bool gasConfirmed = confirmGasChange();

        if (gasConfirmed) {
          currentStatus = "gross";
          Serial.print("Ereignis Nummer ");
          Serial.print(eventNumber);
          Serial.println(" bestaetigt: gross");
        } else {
          currentStatus = "klein";
          Serial.print("Ereignis Nummer ");
          Serial.print(eventNumber);
          Serial.println(" bestaetigt: klein");
        }

        eventConfirmed = true;
      } else {
        Serial.println("Feuchtigkeit war nur eine Schwankung. Kein Ereignis.");
        currentStatus = "nichts";
      }
    } else {
      currentStatus = "nichts";
    }
  }

  // Wenn ein Ereignis aktiv ist, warten wir, bis es wieder trocken ist
  if (eventActive && eventConfirmed) {
    if (moistureValue > moistureThreshold) {
      Serial.println("Sensor ist wieder trocken.");
      Serial.print("Feuchtigkeitswert: ");
      Serial.println(moistureValue);

      Serial.print("Ereignis Nummer ");
      Serial.print(eventNumber);
      Serial.println(" abgeschlossen.");

      currentStatus = "nichts";

      // Neues Ereignis erst nach Trockenheit + Neukalibrierung erlauben
      eventNumber++;

      eventActive = false;
      eventConfirmed = false;

      Serial.println("Starte neue Gas-Kalibrierung...");
      calibrateGasSensor();
    }
  }

  delay(100);
}

void calibrateGasSensor() {
  Serial.println("------------------------------");
  Serial.println("Kalibrierung startet.");
  Serial.println("Waehrend der Kalibrierung werden keine Ereignisse erkannt.");
  Serial.println("Bitte Sensoren in Ausgangszustand lassen.");
  Serial.println("------------------------------");

  unsigned long startTime = millis();
  unsigned long sampleCount = 0;
  long gasSum = 0;

  while (millis() - startTime < calibrationTime) {
    int currentGasValue = analogRead(gasPin);
    gasSum += currentGasValue;
    sampleCount++;

    // Kleine Zwischenmeldung alle 10 Sekunden
    unsigned long elapsed = millis() - startTime;

    if (elapsed % 10000 < 100) {
      Serial.print("Kalibrierung laeuft... ");
      Serial.print(elapsed / 1000);
      Serial.println(" Sekunden");
    }

    delay(100);
  }

  if (sampleCount > 0) {
    gasBaseline = gasSum / sampleCount;
  }

  Serial.println("------------------------------");
  Serial.println("Kalibrierung abgeschlossen.");
  Serial.print("Neue Gas-Baseline: ");
  Serial.println(gasBaseline);
  Serial.println("------------------------------");

  lastStatusPrint = millis();
}

bool confirmMoisture() {
  Serial.println("Pruefe Feuchtigkeit fuer 3 Sekunden...");

  unsigned long startTime = millis();

  while (millis() - startTime < confirmTime) {
    int currentMoistureValue = analogRead(moisturePin);

    if (currentMoistureValue >= moistureThreshold) {
      Serial.println("Feuchtigkeit nicht stabil.");
      Serial.print("Aktueller Feuchtigkeitswert: ");
      Serial.println(currentMoistureValue);
      return false;
    }

    delay(100);
  }

  return true;
}

bool confirmGasChange() {
  Serial.println("Pruefe Gasveraenderung fuer 3 Sekunden...");

  unsigned long startTime = millis();

  while (millis() - startTime < confirmTime) {
    int currentGasValue = analogRead(gasPin);
    int gasDifference = currentGasValue - gasBaseline;

    Serial.print("Gaswert: ");
    Serial.print(currentGasValue);
    Serial.print(" | Baseline: ");
    Serial.print(gasBaseline);
    Serial.print(" | Differenz: ");
    Serial.println(gasDifference);

    if (abs(gasDifference) < gasChangeThreshold) {
      Serial.println("Gasveraenderung nicht stabil oder zu klein.");
      return false;
    }

    delay(500);
  }

  Serial.println("Gasveraenderung wurde bestaetigt.");
  return true;
}

void printStatusEveryTwoSeconds() {
  if (millis() - lastStatusPrint >= statusInterval) {
    Serial.print("Status: ");
    Serial.print(currentStatus);

    Serial.print(" | Ereignis Nummer: ");
    Serial.print(eventNumber);

    Serial.print(" | Feuchtigkeit: ");
    Serial.print(moistureValue);

    Serial.print(" | Gas: ");
    Serial.print(gasValue);

    Serial.print(" | Gas-Baseline: ");
    Serial.println(gasBaseline);

    lastStatusPrint = millis();
  }
}