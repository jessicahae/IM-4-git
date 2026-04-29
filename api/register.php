<?php  

session_start();
header("Content-Type: application/json");

require_once'../system/config.php';

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
 
// hier wollen wir die variabeln entpacken

// entpacke die Daten
    $data = json_decode(file_get_contents("php://input"), true);
    $email = $data['email'] ?? '';
    $password = $data['password'] ?? '';

    // hier wollen wir die variabeln in die datenbank speichern
    try {
        $stmt = $pdo->prepare("INSERT INTO users (email, password) VALUES (:email, :password)");
        $stmt->execute(['email' => $email, 'password' => password_hash($password, PASSWORD_DEFAULT)]);
        echo json_encode(["status" => "success", "message" => "User registered successfully"]);
    } catch (Exception $e) {
        echo json_encode(["status" => "error", "message" => "Database error: " . $e->getMessage()]);
    }
} else {
    echo json_encode(["status" => "error", "message" => "Invalid request method"]);
}



?>