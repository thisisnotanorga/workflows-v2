<?php
if (!isset($_GET['percentage']) || !isset($_GET['name'])) {
    die('Error: Missing parameters "percentage" or "name".');
}

$percentage = $_GET['percentage'];
$name = $_GET['name'];
$ip = $_SERVER['REMOTE_ADDR'];

$mysqli = new mysqli('dbhost', 'dbuser', 'dbpassword', 'dbname');

if ($mysqli->connect_error) {
    die('Connection failed: ' . $mysqli->connect_error);
}

$tableExists = $mysqli->query("SHOW TABLES LIKE 'cert'")->num_rows > 0;
if (!$tableExists) {
    $createTableSql = "CREATE TABLE cert (
        id INT(11) AUTO_INCREMENT PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        percentage DECIMAL(5,2) NOT NULL,
        ip VARCHAR(45) NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )";
    if (!$mysqli->query($createTableSql)) {
        die('Error creating table: ' . $mysqli->error);
    }
}

$stmt = $mysqli->prepare("INSERT INTO cert (name, percentage, ip) VALUES (?, ?, ?)");
$stmt->bind_param("sds", $name, $percentage, $ip);
$stmt->execute();
$stmt->close();

$svgPath = '../../assets/img/certificate.svg';
if (!file_exists($svgPath)) {
    die('Error: SVG file not found.');
}

$svgContent = file_get_contents($svgPath);

$date = date('Y-m-d');
$certNumber = str_pad($mysqli->insert_id, 5, '0', STR_PAD_LEFT);
$svgContent = str_replace(['{{DATE}}', '{{CERTNB}}', '{{PERCENT}}', '{{USER}}'], [$date, $certNumber, $percentage, $name], $svgContent);

$tempSvgPath = tempnam(sys_get_temp_dir(), 'cert_') . '.svg';
file_put_contents($tempSvgPath, $svgContent);

$pngPath = '../../assets/img/cert_' . $certNumber . '.png';
$command = "rsvg-convert -o $pngPath $tempSvgPath";
exec($command, $output, $return_var);

if ($return_var !== 0) {
    die('Error converting SVG to PNG: ' . implode("\n", $output));
}

header('Content-Type: image/png');
header('Content-Disposition: attachment; filename="cert_' . $certNumber . '.png"');
readfile($pngPath);

unlink($pngPath);
unlink($tempSvgPath);

$mysqli->close();
?>
