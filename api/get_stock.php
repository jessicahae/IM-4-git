<?php
session_start();
require_once("../system/config.php");
header('Content-Type: application/json');

if (!isset($_SESSION['id_users'])) {
    http_response_code(401);
    echo json_encode(["status" => "error", "message" => "Nicht eingeloggt"]);
    exit;
}

$userId = $_SESSION['id_users'];

$stmtSensor = $pdo->prepare("
    SELECT stock_sensor_number
    FROM users
    WHERE ID = :user_id
");

$stmtSensor->execute([
    ':user_id' => $userId
]);

$sensorNumber = $stmtSensor->fetchColumn();

if (!$sensorNumber) {
    echo json_encode([
        "status" => "error",
        "message" => "Kein Vorratssensor verbunden"
    ]);
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