<?php
header('Content-Type: text/plain');
header('Access-Control-Allow-Origin: noskid.today');
header('Access-Control-Allow-Methods: GET');
header('Access-Control-Allow-Headers: Content-Type');

require_once '../config.php';

if (!defined('DB_HOST') || !defined('DB_USER') || !defined('DB_PASS') || !defined('DB_NAME')) {
    echo '0';
    exit;
}

try {
    $mysqli = new mysqli(DB_HOST, DB_USER, DB_PASS, DB_NAME);
    
    if ($mysqli->connect_error) {
        echo '0';
        exit;
    }
    
    $tableExists = $mysqli->query("SHOW TABLES LIKE 'cert'")->num_rows > 0;
    if (!$tableExists) {
        echo '0';
        $mysqli->close();
        exit;
    }
    
    $result = $mysqli->query("SELECT id FROM cert ORDER BY id DESC LIMIT 1");
    
    if ($result && $row = $result->fetch_assoc()) {
        echo str_pad($row['id'], 5, '0', STR_PAD_LEFT);
    } else {
        echo '00000';
    }
    
    $mysqli->close();
    
} catch (Exception $e) {
    echo '00000';
}
?>