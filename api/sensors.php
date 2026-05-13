<?php
session_start();
header('Content-Type: application/json; charset=utf-8');

require_once '../system/config.php';

if (!isset($_SESSION['id_users'])) {
    http_response_code(401);
    echo json_encode(['status' => 'error', 'message' => 'Nicht eingeloggt']);
    exit;
}

$method = $_SERVER['REQUEST_METHOD'];

if ($method === 'GET') {
    $userId = $_SESSION['id_users'];

    $userStmt = $pdo->prepare("
        SELECT stock_sensor_number
        FROM users
        WHERE id = :id
    ");

    $userStmt->execute([
        ':id' => $userId
    ]);

    $connectedSensorNumber = $userStmt->fetchColumn();

    $stmt = $pdo->prepare("
        SELECT id, number, type
        FROM sensors
        WHERE type = 'stock'
        ORDER BY id ASC
    ");

    $stmt->execute();
    $sensors = $stmt->fetchAll(PDO::FETCH_ASSOC);

    foreach ($sensors as &$sensor) {
        $sensor['connected'] = ((int)$sensor['number'] === (int)$connectedSensorNumber);
    }

    echo json_encode([
        'status' => 'success',
        'sensors' => $sensors,
        'connected_sensor_number' => $connectedSensorNumber
    ]);
    exit;
}


if ($method === 'POST') {
    $data = json_decode(file_get_contents('php://input'), true);
    $number = trim($data['number'] ?? '');

    if ($number === '') {
        http_response_code(400);
        echo json_encode(['status' => 'error', 'message' => 'Sensor-Nummer fehlt']);
        exit;
    }

    $stmt = $pdo->prepare("
        INSERT INTO sensors (number, type)
        VALUES (:number, 'stock')
    ");

    $stmt->execute([':number' => $number]);

    echo json_encode([
        'status' => 'success',
        'sensor' => [
            'id' => $pdo->lastInsertId(),
            'number' => $number,
            'type' => 'stock'
        ]
    ]);
    exit;
}

if ($method === 'PUT') {
    $data = json_decode(file_get_contents('php://input'), true);

    $number = trim($data['number'] ?? '');

    if ($number === '') {
        http_response_code(400);
        echo json_encode(['status' => 'error', 'message' => 'Sensor-Nummer fehlt']);
        exit;
    }

    $checkStmt = $pdo->prepare("
        SELECT COUNT(*)
        FROM sensors
        WHERE number = :number AND type = 'stock'
    ");

    $checkStmt->execute([
        ':number' => $number
    ]);

    if ((int)$checkStmt->fetchColumn() === 0) {
        http_response_code(400);
        echo json_encode(['status' => 'error', 'message' => 'Dieser Vorratssensor existiert nicht']);
        exit;
    }

    $stmt = $pdo->prepare("
        UPDATE users
        SET stock_sensor_number = :number
        WHERE id = :id_users
    ");

    $stmt->execute([
        ':number' => $number,
        ':id_users' => $_SESSION['id_users']
    ]);

    echo json_encode(['status' => 'success']);
    exit;
}


if ($method === 'DELETE') {
    $id = $_GET['id'] ?? '';

    if ($id === '') {
        http_response_code(400);
        echo json_encode(['status' => 'error', 'message' => 'Sensor-ID fehlt']);
        exit;
    }

    $stmt = $pdo->prepare("
        DELETE FROM sensors
        WHERE id = :id AND type = 'stock'
    ");

    $stmt->execute([':id' => $id]);

    echo json_encode(['status' => 'success']);
    exit;
}

http_response_code(405);
echo json_encode(['status' => 'error', 'message' => 'Methode nicht erlaubt']);
