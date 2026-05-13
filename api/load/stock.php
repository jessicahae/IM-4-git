<?php
/*****************************************************
 * stock.php
 * Empfängt Windelbestand vom ESP32 als JSON
 *
 * Erwartetes JSON:
 * {
 *   "sensors_number": 69,
 *   "amount": 7
 * }
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

$sensors_number = $input["sensors_number"] ?? null;
$amount = $input["amount"] ?? null;

###################################### Pflichtfelder prüfen

if ($sensors_number === null || $amount === null) {
    http_response_code(400);
    echo "Fehlende Werte. Erwartet: sensors_number und amount.";
    exit;
}

###################################### Werte validieren

if (!is_numeric($sensors_number) || !is_numeric($amount)) {
    http_response_code(400);
    echo "sensors_number und amount muessen Zahlen sein.";
    exit;
}

$sensors_number = (int)$sensors_number;
$amount = (int)$amount;

if ($amount < 0) {
    http_response_code(400);
    echo "amount darf nicht negativ sein.";
    exit;
}

###################################### In Datenbank schreiben

$sql = "INSERT INTO stock (sensors_number, amount) VALUES (?, ?)";
$stmt = $pdo->prepare($sql);
$stmt->execute([$sensors_number, $amount]);

echo "OK";
?>