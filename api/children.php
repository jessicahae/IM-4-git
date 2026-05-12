<?php
session_start();
header('Content-Type: application/json; charset=utf-8');

require_once '../system/config.php';

if (!isset($_SESSION['id_users'])) {
    http_response_code(401);
    echo json_encode([
        'status' => 'error',
        'message' => 'Nicht eingeloggt'
    ]);
    exit;
}

$userId = $_SESSION['id_users'];
$method = $_SERVER['REQUEST_METHOD'];

if ($method === 'POST') {
    $data = json_decode(file_get_contents('php://input'), true);

    $name = trim($data['name'] ?? '');
    $idSensor = trim($data['id_sensor'] ?? '');

    if ($name === '' || $idSensor === '') {
        http_response_code(400);
        echo json_encode([
            'status' => 'error',
            'message' => 'Name und Sensor-ID sind erforderlich'
        ]);
        exit;
    }

    $stmt = $pdo->prepare("
        INSERT INTO children (id_users, name, id_sensor)
        VALUES (:id_users, :name, :id_sensor)
    ");

    $stmt->execute([
        ':id_users' => $userId,
        ':name' => $name,
        ':id_sensor' => $idSensor
    ]);

    echo json_encode([
        'status' => 'success',
        'child' => [
            'id' => $pdo->lastInsertId(),
            'name' => $name,
            'id_sensor' => $idSensor
        ]
    ]);
    exit;
}

http_response_code(405);
echo json_encode([
    'status' => 'error',
    'message' => 'Methode nicht erlaubt'
]);


?>