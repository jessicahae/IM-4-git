<?php
session_start();
header('Content-Type: application/json; charset=utf-8');

require_once '../system/config.php';

if (!isset($_SESSION['id_users'])) {
    http_response_code(401);
    echo json_encode(['status' => 'error', 'message' => 'Nicht eingeloggt']);
    exit;
}

$sensorNumber = $_GET['sensor'] ?? '';

if ($sensorNumber === '') {
    http_response_code(400);
    echo json_encode(['status' => 'error', 'message' => 'Kein Sensor übergeben']);
    exit;
}

// Nur den letzten Status (trocken, nass, voll) abfragen
$stmt = $pdo->prepare("
    SELECT type
    FROM diaper_event
    WHERE sensors_number = :sensor
    ORDER BY time DESC
    LIMIT 1
");

$stmt->execute([':sensor' => $sensorNumber]);
$row = $stmt->fetch(PDO::FETCH_ASSOC);

// Falls es noch gar keine Einträge gibt, gehen wir von "trocken" aus
$currentType = $row ? strtolower($row['type']) : 'trocken';

echo json_encode([
    'status' => 'success',
    'type' => $currentType
]);