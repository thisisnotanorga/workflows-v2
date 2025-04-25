<?php
if (!isset($_GET['percentage']) || !isset($_GET['name'])) {
    die('Error: Missing parameters "percentage" or "name".');
}

$percentage = $_GET['percentage'];
$name = $_GET['name'];
$ip = $_SERVER['REMOTE_ADDR'];

$mysqli = new mysqli('dbname', 'dbuser', 'dbpwd', 'dbname');

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
$insertId = $mysqli->insert_id;
$stmt->close();

$svgPath = '../../assets/img/certificate.svg';
if (!file_exists($svgPath)) {
    die('Error: SVG file not found.');
}

$svgContent = file_get_contents($svgPath);

$date = date('Y-m-d');
$certNumber = str_pad($insertId, 5, '0', STR_PAD_LEFT);
$svgContent = str_replace(['{{DATE}}', '{{CERTNB}}', '{{PERCENT}}', '{{USER}}'], [$date, $certNumber, $percentage, $name], $svgContent);

$tempSvgPath = tempnam(sys_get_temp_dir(), 'cert_') . '.svg';
file_put_contents($tempSvgPath, $svgContent);

$pngPath = '../../assets/img/cert_' . $certNumber . '.png';
$command = "rsvg-convert -o $pngPath $tempSvgPath";
exec($command, $output, $return_var);

if ($return_var !== 0) {
    die('Error converting SVG to PNG: ' . implode("\n", $output));
}

$ipApiUrl = "http://ip-api.com/json/{$ip}?fields=countryCode";
$ipApiResponse = @file_get_contents($ipApiUrl);
$countryInfo = json_decode($ipApiResponse, true);

$countryCode = isset($countryInfo['countryCode']) ? $countryInfo['countryCode'] : 'XX';
$countryEmoji = getCountryEmoji($countryCode);

sendDiscordNotification($certNumber, $name, $countryEmoji, $pngPath);

header('Content-Type: image/png');
header('Content-Disposition: attachment; filename="cert_' . $certNumber . '.png"');
readfile($pngPath);

unlink($tempSvgPath);
unlink($pngPath);

$mysqli->close();

function getCountryEmoji($countryCode) {
    if ($countryCode == 'XX' || strlen($countryCode) != 2) {
        return '❔';
    }
    
    $firstLetter = ord(strtoupper($countryCode[0])) - ord('A') + 0x1F1E6;
    $secondLetter = ord(strtoupper($countryCode[1])) - ord('A') + 0x1F1E6;
    
    $emoji = mb_convert_encoding('&#' . $firstLetter . ';&#' . $secondLetter . ';', 'UTF-8', 'HTML-ENTITIES');
    
    return $emoji;
}

function sendDiscordNotification($certNumber, $username, $countryEmoji, $pngPath) {
    $webhookUrl = 'WBK URL';
    
    $message = [
        'content' => "New certificate generated!",
        'embeds' => [
            [
                'title' => 'Certificate Details',
                'color' => 0xf9f7f0,
                'fields' => [
                    [
                        'name' => 'Number',
                        'value' => '#' . $certNumber,
                        'inline' => true
                    ],
                    [
                        'name' => 'User',
                        'value' => $username,
                        'inline' => true
                    ],
                    [
                        'name' => 'Country',
                        'value' => $countryEmoji,
                        'inline' => true
                    ]
                ],
                'timestamp' => date('c')
            ]
        ]
    ];
    
    $boundary = '----WebKitFormBoundary' . md5(microtime());
    
    $payload = '';
    $payload .= '--' . $boundary . "\r\n";
    $payload .= 'Content-Disposition: form-data; name="payload_json"' . "\r\n";
    $payload .= 'Content-Type: application/json' . "\r\n\r\n";
    $payload .= json_encode($message) . "\r\n";
    
    if (file_exists($pngPath)) {
        $fileContent = file_get_contents($pngPath);
        $filename = basename($pngPath);
        
        $payload .= '--' . $boundary . "\r\n";
        $payload .= 'Content-Disposition: form-data; name="file"; filename="' . $filename . '"' . "\r\n";
        $payload .= 'Content-Type: image/png' . "\r\n\r\n";
        $payload .= $fileContent . "\r\n";
    }
    
    $payload .= '--' . $boundary . '--';
    
    $ch = curl_init($webhookUrl);
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
    curl_setopt($ch, CURLOPT_POST, true);
    curl_setopt($ch, CURLOPT_POSTFIELDS, $payload);
    curl_setopt($ch, CURLOPT_HTTPHEADER, [
        'Content-Type: multipart/form-data; boundary=' . $boundary,
        'Content-Length: ' . strlen($payload)
    ]);
    
    $response = curl_exec($ch);
    $error = curl_error($ch);
    curl_close($ch);
    
    if ($error) {
        error_log('Discord webhook error: ' . $error);
    }
}
?>