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

    // checken, ob user schon registriert ist
    $stmt = $pdo->prepare("SELECT email FROM user WHERE email = :email");
    $stmt->execute([":email" => $email]);
    if ($stmt->fetch()) {
        echo json_encode([
            "status" => "error",
            "message" => "email is already registered"
        ]);
        exit;
    }

    $hashedPassword = password_hash($password, PASSWORD_DEFAULT);


// neuen user in die DB einfügen
    $insert = $pdo->prepare("INSERT INTO user (email, password) VALUES (:email, :pass)");
    $insert->execute([
        ":email" => $email,
        ":pass" => $hashedPassword
    ]);

    echo json_encode([
        "status" => "success",
        "email" => $email
    ]);
}
?>