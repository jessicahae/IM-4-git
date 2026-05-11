<?php  

ini_set('session.cookie_secure', 1);
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
    $stmt = $pdo->prepare("SELECT id, email, password FROM users WHERE email = :email");
    $stmt->execute([":email" => $email]);
    $user = $stmt->fetch(PDO::FETCH_ASSOC);

    if ($user && password_verify($password, $user['password'])) {
        session_regenerate_id(true); 
        $_SESSION['user_id'] = $user['id'];
        $_SESSION['email'] = $user['email'];
  
        echo json_encode(["status" => "success", "message" => "Login successful"]);
} else {
        echo json_encode(["status" => "error", "message" => "Invalid email or password"]);
    }
}
?>
