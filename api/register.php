<?php
// register.php
session_start();
header('Content-Type: application/json');

require_once '../system/config.php';

if ($_SERVER['REQUEST_METHOD'] === 'POST') {

    $data = json_decode(file_get_contents("php://input"), true);

    $email    = trim($data['email'] ?? '');
    $password = trim($data['password'] ?? '');
    $name     = trim($data['name'] ?? '');

    if (!$email || !$password || !$name) {
        echo json_encode(["status" => "error", "message" => "All fields are required"]);
        exit;
    }

    // Check if email already exists
    $stmt = $pdo->prepare("SELECT id FROM users WHERE email = :email");
    $stmt->execute([':email' => $email]);
    if ($stmt->fetch()) {
        echo json_encode(["status" => "error", "message" => "Email is already in use"]);
        exit;
    }

    // Hash the password
    $hashedPassword = password_hash($password, PASSWORD_DEFAULT);

    // Insert the new user
    $insert = $pdo->prepare("INSERT INTO users (email, password, name) VALUES (:email, :pass, :name)");
    $insert->execute([
        ':email' => $email,
        ':pass'  => $hashedPassword,
        ':name'  => $name
    ]);

    echo json_encode(["status" => "success"]);
} else {
    echo json_encode(["status" => "error", "message" => "Invalid request method"]);
}
