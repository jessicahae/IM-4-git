<?php
/*****************************************************
 * diaper.php
 * Empfängt Windel-Ereignisse vom ESP32 als JSON
 *
 * Erwartetes JSON:
 * {
 *   "type": "nass",
 *   "sensors_number": 67
 * }
 *
 * Mögliche type-Werte:
 * - nass
 * - voll
 * - trocken
 *****************************************************/

require_once("../../system/config.php");

###################################### JSON empfangen

$inputJSON = file_get_contents('php://input');
$input = json_decode($inputJSON, true);

###################################### Prüfen, ob JSON gültig ist

if ($input === null) {
    http_response_code(400);
    echo "Ungueltiges JSON.";
    exit;
}

###################################### Werte auslesen

$type = $input["type"] ?? null;
$sensors_number = $input["sensors_number"] ?? null;

###################################### Pflichtfelder prüfen

if ($type === null || $sensors_number === null) {
    http_response_code(400);
    echo "Fehlende Werte. Erwartet: type und sensors_number.";
    exit;
}

###################################### Type validieren

$allowedTypes = ["nass", "voll", "trocken"];

if (!in_array($type, $allowedTypes, true)) {
    http_response_code(400);
    echo "Ungueltiger type. Erlaubt sind: nass, voll, trocken.";
    exit;
}

###################################### In Datenbank schreiben

$sql = "INSERT INTO diaper_event (type, sensors_number) VALUES (?, ?)";
$stmt = $pdo->prepare($sql);
$stmt->execute([$type, $sensors_number]);

echo "OK";
?>