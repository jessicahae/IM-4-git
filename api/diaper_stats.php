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

$stmtToday = $pdo->prepare("
    SELECT COUNT(*)
    FROM diaper_event
    WHERE sensors_number = :sensor
        AND type = 'trocken'
      AND DATE(time) = CURDATE()
");

$stmtToday->execute([
    ':sensor' => $sensorNumber
]);

$today = (int)$stmtToday->fetchColumn();

$stmtWeek = $pdo->prepare("
    SELECT COUNT(*)
    FROM diaper_event
    WHERE sensors_number = :sensor
    AND type = 'trocken'
      AND time >= DATE_SUB(CURDATE(), INTERVAL WEEKDAY(CURDATE()) DAY)
");

$stmtWeek->execute([
    ':sensor' => $sensorNumber
]);

$week = (int)$stmtWeek->fetchColumn();

echo json_encode([
    'status' => 'success',
    'today' => $today,
    'week' => $week
]);
