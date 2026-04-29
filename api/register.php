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

    $insert = $pdo->prepare("INSERT INTO users (email, password) VALUES (:email, :pass)");
    $insert->execute([
        ":email" => $email,
        ":pass" => $password
    ]);

    echo json_encode([
        "status" => "success",
        "email" => $email
    ]);
}
?>