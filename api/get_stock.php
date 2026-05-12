<?php
require_once("../system/config.php");
header('Content-Type: application/json');

try {
    // 1. Aktuellen Bestand holen (Letzter Eintrag in der Tabelle 'stock')
    // Laut deinem Screenshot nutzen wir die Spalte 'bestand'
    $stmtStock = $pdo->query("SELECT amount FROM stock ORDER BY id_stock DESC LIMIT 1");
    $stockRow = $stmtStock->fetch(PDO::FETCH_ASSOC);
    $aktuellerBestand = $stockRow ? intval($stockRow['amount']) : 0;

    // 2. Durchschnittsverbrauch pro Kind berechnen
    // Wir nehmen die Summe aller 'amount'-Werte (verbrauchte Windeln) 
    // und teilen sie durch die Anzahl der Tage, an denen Daten existieren.
    // Danach teilen wir das durch die Anzahl der Kinder (angenommen du hast diese Info).
    
    // Einfachere Variante für den Anfang: Durchschnitt aller 'amount' Einträge pro Tag
    $stmtAvg = $pdo->query("SELECT AVG(daily_sum) as schnitt FROM (
                                SELECT SUM(amount) as daily_sum 
                                FROM stock 
                                GROUP BY DATE(time)
                            ) as daily_totals");
    $avgRow = $stmtAvg->fetch(PDO::FETCH_ASSOC);
    $durchschnittGesamt = $avgRow['schnitt'] ? floatval($avgRow['schnitt']) : 8.0;

    echo json_encode([
        "status" => "success",
        "amount" => $aktuellerBestand,
        "durchschnittProTagGesamt" => round($durchschnittGesamt, 1)
    ]);
} catch (Exception $e) {
    echo json_encode(["status" => "error", "message" => $e->getMessage()]);
}

?>