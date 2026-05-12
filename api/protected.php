<?php
session_start();
header('Content-Type: application/json; charset=utf-8');

if (!isset($_SESSION['id_users'])) {
    http_response_code(401);
    header('Content-Type: application/json');
    echo json_encode(["error" => "Unauthorized"]);
    exit;
}

echo json_encode([
    "status" => "success",
    "user_id" => $_SESSION['id_users'],
    "email" => $_SESSION['email']
]);