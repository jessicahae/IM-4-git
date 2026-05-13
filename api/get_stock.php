<?php
require_once("../system/config.php");
header('Content-Type: application/json');

// Wir holen die Sensor-ID aus der Anfrage (z.B. get_stock.php?sensor_id=1)
$sensorId = isset($_GET['sensor_id']) ? intval($_GET['sensor_id']) : 0;

if ($sensorId === 0) {
    echo json_encode(["status" => "error", "message" => "Keine Sensor-ID übergeben"]);
    exit;
}

try {
    // 1. BESTAND für den AKTIVEN Sensor
    $stmtStock = $pdo->prepare("
    SELECT amount
    FROM stock
    WHERE sensors_number = ?
    ORDER BY time DESC, id DESC
    LIMIT 1
");

    $stmtStock->execute([$sensorId]);
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
    $stmtAvg->execute([$sensorId]);
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