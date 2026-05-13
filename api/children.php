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

if ($method === 'GET') {
    $stmt = $pdo->prepare("
        SELECT 
            children.id,
            children.name,
            children.id_sensor,
            sensors.number AS sensor_number
        FROM children
        LEFT JOIN sensors ON children.id_sensor = sensors.id
        WHERE children.id_users = :id_users
        ORDER BY children.id ASC
    ");

    $stmt->execute([
        ':id_users' => $userId
    ]);

    echo json_encode([
        'status' => 'success',
        'children' => $stmt->fetchAll(PDO::FETCH_ASSOC)
    ]);
    exit;
}

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

    $sensorStmt = $pdo->prepare("
    SELECT id
    FROM sensors
    WHERE number = :number
      AND type = 'diaper'
    LIMIT 1
");

$sensorStmt->execute([
    ':number' => $idSensor
]);

$sensorId = $sensorStmt->fetchColumn();

if (!$sensorId) {
    http_response_code(400);
    echo json_encode(['status' => 'error', 'message' => 'Dieser Windel-Sensor existiert nicht']);
    exit;
}


    $stmt = $pdo->prepare("
        INSERT INTO children (id_users, name, id_sensor)
        VALUES (:id_users, :name, :id_sensor)
    ");

    $stmt->execute([
        ':id_users' => $userId,
        ':name' => $name,
':id_sensor' => $sensorId
    ]);

    echo json_encode([
        'status' => 'success',
        'child' => [
            'id' => $pdo->lastInsertId(),
            'name' => $name,
            'id_sensor' => $sensorId
        ]
    ]);
    exit;
}

if ($method === 'PUT') {
    $data = json_decode(file_get_contents('php://input'), true);

    $childId = $data['id'] ?? '';
    $idSensor = trim($data['id_sensor'] ?? '');

    if ($childId === '' || $idSensor === '') {
        http_response_code(400);
        echo json_encode(['status' => 'error', 'message' => 'Kind und Sensor-ID sind erforderlich']);
        exit;
    }

$sensorStmt = $pdo->prepare("
    SELECT id
    FROM sensors
    WHERE number = :number
      AND type = 'diaper'
    LIMIT 1
");

$sensorStmt->execute([
    ':number' => $idSensor
]);

$sensorId = $sensorStmt->fetchColumn();

if (!$sensorId) {
    http_response_code(400);
    echo json_encode(['status' => 'error', 'message' => 'Dieser Windel-Sensor existiert nicht']);
    exit;
}
    $stmt = $pdo->prepare("
    UPDATE children
    SET id_sensor = :id_sensor
    WHERE id = :id AND id_users = :id_users
");


    $stmt->execute([
    ':id_sensor' => $sensorId,
    ':id' => $childId,
    ':id_users' => $userId
    ]);

    echo json_encode(['status' => 'success']);
    exit;
}

if ($method === 'DELETE') {
    $childId = $_GET['id'] ?? '';

    if ($childId === '') {
        http_response_code(400);
        echo json_encode(['status' => 'error', 'message' => 'Kind-ID fehlt']);
        exit;
    }

    $countStmt = $pdo->prepare("
        SELECT COUNT(*)
        FROM children
        WHERE id_users = :id_users
    ");
    $countStmt->execute([':id_users' => $userId]);

    if ((int)$countStmt->fetchColumn() <= 1) {
        http_response_code(400);
        echo json_encode(['status' => 'error', 'message' => 'Das letzte Kind kann nicht gelöscht werden']);
        exit;
    }

    $stmt = $pdo->prepare("
        DELETE FROM children
        WHERE id = :id AND id_users = :id_users
    ");

    $stmt->execute([
        ':id' => $childId,
        ':id_users' => $userId
    ]);

    echo json_encode(['status' => 'success']);
    exit;
}

http_response_code(405);
echo json_encode([
    'status' => 'error',
    'message' => 'Methode nicht erlaubt'
]);


?>