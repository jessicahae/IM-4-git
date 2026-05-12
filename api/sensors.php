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
    $stmt = $pdo->prepare("
        SELECT id, number, type
        FROM sensors
        WHERE type = 'stock'
        ORDER BY id ASC
    ");

    $stmt->execute();

    echo json_encode([
        'status' => 'success',
        'sensors' => $stmt->fetchAll(PDO::FETCH_ASSOC)
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

    $id = $data['id'] ?? '';
    $number = trim($data['number'] ?? '');

    if ($id === '' || $number === '') {
        http_response_code(400);
        echo json_encode(['status' => 'error', 'message' => 'Sensor-ID und Nummer sind erforderlich']);
        exit;
    }

    $stmt = $pdo->prepare("
        UPDATE sensors
        SET number = :number
        WHERE id = :id AND type = 'stock'
    ");

    $stmt->execute([
        ':id' => $id,
        ':number' => $number
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
