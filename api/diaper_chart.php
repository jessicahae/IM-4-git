<?php
session_start();
header('Content-Type: application/json; charset=utf-8');

require_once '../system/config.php';

if (!isset($_SESSION['id_users'])) {
    http_response_code(401);
    echo json_encode(['status' => 'error', 'message' => 'Nicht eingeloggt']);
    exit;
}

$sensorNumber = $_GET['sensor'] ?? 1;

$sql = "
    SELECT
        WEEKDAY(time) AS weekday,
        COUNT(*) AS amount
    FROM diaper_event
    WHERE sensors_number = :sensor
      AND time >= DATE_SUB(CURDATE(), INTERVAL WEEKDAY(CURDATE()) DAY)
    GROUP BY WEEKDAY(time)
    ORDER BY weekday
";

$stmt = $pdo->prepare($sql);
$stmt->execute([':sensor' => $sensorNumber]);

$days = ['Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa', 'So'];
$values = array_fill(0, 7, 0);

foreach ($stmt->fetchAll(PDO::FETCH_ASSOC) as $row) {
    $values[(int)$row['weekday']] = (int)$row['amount'];
}

echo json_encode([
    'status' => 'success',
    'labels' => $days,
    'values' => $values
]);
