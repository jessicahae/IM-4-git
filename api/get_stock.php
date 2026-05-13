<?php
require_once("../system/config.php");
header('Content-Type: application/json');

// Wir holen die Sensor-Nummer aus der Anfrage (z.B. get_stock.php?sensor_number=1)
$sensorNumber = isset($_GET['sensor_number']) ? intval($_GET['sensor_number']) : 0;

if ($sensorNumber === 0) {
    echo json_encode(["status" => "error", "message" => "Keine Sensor-Nummer übergeben"]);
    exit;
}

try {
    // 1. BESTAND für den AKTIVEN Sensor
    $stmtStock = $pdo->prepare("
    SELECT amount
    FROM stock
    $stmtStock->execute([$sensorNumber]);
    ORDER BY time DESC, id DESC
    LIMIT 1
");

    $stmtStock->execute([$sensorNumber]);
    $stockRow = $stmtStock->fetch(PDO::FETCH_ASSOC);
    $aktuellerBestand = $stockRow ? intval($stockRow['amount']) : 0;

    // 2. DURCHSCHNITT für den AKTIVEN Sensor
$stmtAvg = $pdo->prepare("
    SELECT AVG(daily_usage) AS schnitt
    FROM (
        SELECT GREATEST(MAX(amount) - MIN(amount), 0) AS daily_usage
        FROM stock
        WHERE sensors_number = ?
        GROUP BY DATE(time)
    ) AS daily_totals
");
    $stmtAvg->execute([$sensorNumber]);
    $avgRow = $stmtAvg->fetch(PDO::FETCH_ASSOC);
    $durchschnitt = ($avgRow && $avgRow['schnitt'] > 0) ? floatval($avgRow['schnitt']) : 8.0;

    echo json_encode([
        "status" => "success",
        "bestand" => $aktuellerBestand,
        "durchschnitt" => round($durchschnitt, 1)
    ]);

} catch (Exception $e) {
    echo json_encode(["status" => "error", "message" => $e->getMessage()]);
}