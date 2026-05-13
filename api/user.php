<?php
session_start();
header('Content-Type: application/json; charset=utf-8');

require_once '../system/config.php';

if (!isset($_SESSION['id_users'])) {
    http_response_code(401);
    echo json_encode(['status' => 'error', 'message' => 'Nicht eingeloggt']);
    exit;
}

$userId = $_SESSION['id_users'];
$method = $_SERVER['REQUEST_METHOD'];

if ($method === 'GET') {
    $stmt = $pdo->prepare("
        SELECT id, name, email
        FROM users
        WHERE id = :id
    ");

    $stmt->execute([':id' => $userId]);
    $user = $stmt->fetch(PDO::FETCH_ASSOC);

    echo json_encode([
        'status' => 'success',
        'user' => $user
    ]);
    exit;
}

if ($method === 'PUT') {
    $data = json_decode(file_get_contents('php://input'), true);

    $name = trim($data['name'] ?? '');
    $email = trim($data['email'] ?? '');
    $password = trim($data['password'] ?? '');

    if ($name === '' || $email === '') {
        http_response_code(400);
        echo json_encode(['status' => 'error', 'message' => 'Name und E-Mail sind erforderlich']);
        exit;
    }

    if ($password !== '') {
        $hashedPassword = password_hash($password, PASSWORD_DEFAULT);

        $stmt = $pdo->prepare("
            UPDATE users
            SET name = :name, email = :email, password = :password
            WHERE id = :id
        ");

        $stmt->execute([
            ':name' => $name,
            ':email' => $email,
            ':password' => $hashedPassword,
            ':id' => $userId
        ]);
    } else {
        $stmt = $pdo->prepare("
            UPDATE users
            SET name = :name, email = :email
            WHERE id = :id
        ");

        $stmt->execute([
            ':name' => $name,
            ':email' => $email,
            ':id' => $userId
        ]);
    }

    $_SESSION['email'] = $email;

    echo json_encode(['status' => 'success']);
    exit;
}

http_response_code(405);
echo json_encode(['status' => 'error', 'message' => 'Methode nicht erlaubt']);
