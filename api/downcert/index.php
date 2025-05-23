<?php
/*
To migrate from a database that still uses an old api, run those sql commands:
---------------------------------

ALTER TABLE cert ADD COLUMN IF NOT EXISTS verification_key VARCHAR(255) AFTER ip;

CREATE TABLE IF NOT EXISTS requests (
    id INT(11) AUTO_INCREMENT PRIMARY KEY,
    ip VARCHAR(45) NOT NULL,
    user_agent TEXT NOT NULL,
    request_time DATETIME NOT NULL,
    INDEX idx_request_time (ip, request_time)
);

*/

define('MIN_PERCENTAGE', 80);
define('MAX_PERCENTAGE', 100);
define('MAX_REQUESTS_PER_MINUTE', 3);
define('DISCORD_WEBHOOK_URL', 'WBK_URL');
define('DB_HOST', 'dbhost');
define('DB_USER', 'dbuser');
define('DB_PASS', 'dbpwd');
define('DB_NAME', 'dbname');
define('TURNSTILE_SECRET_KEY', 'turnstile_secret_key');
define('TURNSTILE_VERIFY_URL', 'https://challenges.cloudflare.com/turnstile/v0/siteverify');

date_default_timezone_set('UTC');

if (!isset($_GET['percentage']) || !isset($_GET['name'])) {
    die('Error: Missing parameters "percentage" or "name".');
}

$percentage = $_GET['percentage'];
$name = $_GET['name'];
$turnstileToken = $_GET['turnstile_token'] ?? null;
$ip = $_SERVER['REMOTE_ADDR'];
$userAgent = $_SERVER['HTTP_USER_AGENT'];
$currentTime = time();

if (!$turnstileToken) {
    header('HTTP/1.1 403 Forbidden');
    die('Turnstile token required');
}

$turnstileValid = verifyTurnstile($turnstileToken, $ip);
if (!$turnstileValid) {
    header('HTTP/1.1 403 Forbidden');
    die('Turnstile verification failed');
}

$mysqli = new mysqli(DB_HOST, DB_USER, DB_PASS, DB_NAME);

if ($mysqli->connect_error) {
    die('Connection failed: ' . $mysqli->connect_error);
}

setupDatabase($mysqli);

$oneMinuteAgo = gmdate('Y-m-d H:i:s', $currentTime - 60);
$stmt = $mysqli->prepare("SELECT COUNT(*) AS request_count FROM requests WHERE ip = ? AND request_time > ?");
$stmt->bind_param("ss", $ip, $oneMinuteAgo);
$stmt->execute();
$result = $stmt->get_result();
$requestCount = $result->fetch_assoc()['request_count'];
$stmt->close();

if ($requestCount >= MAX_REQUESTS_PER_MINUTE) {
    header('HTTP/1.1 429 Too Many Requests');
    die('Rate limit exceeded');
}

$stmt = $mysqli->prepare("INSERT INTO requests (ip, user_agent, request_time) VALUES (?, ?, UTC_TIMESTAMP())");
$stmt->bind_param("ss", $ip, $userAgent);
$stmt->execute();
$stmt->close();

if ($percentage < MIN_PERCENTAGE || $percentage > MAX_PERCENTAGE) {
    header('HTTP/1.1 400 Bad Request');
    die('Invalid percentage value');
}

$verificationKey = generateVerificationKey($name, $currentTime);

$stmt = $mysqli->prepare("INSERT INTO cert (name, percentage, ip, verification_key) VALUES (?, ?, ?, ?)");
$stmt->bind_param("sdss", $name, $percentage, $ip, $verificationKey);
$stmt->execute();
$insertId = $mysqli->insert_id;
$stmt->close();

$svgPath = '../../assets/img/certificate.svg';
if (!file_exists($svgPath)) {
    die('Error: SVG file not found.');
}

$svgContent = file_get_contents($svgPath);

$date = gmdate('Y-m-d');
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

appendVerificationKeyToPng($pngPath, $verificationKey);

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

function verifyTurnstile($token, $remoteIp) {
    if (empty($token)) {
        error_log('Turnstile verification failed: Empty token provided');
        return false;
    }
    
    if (empty($remoteIp)) {
        error_log('Turnstile verification failed: Empty IP provided');
        return false;
    }
    
    $postFields = [
        'secret' => TURNSTILE_SECRET_KEY,
        'response' => $token,
        'remoteip' => $remoteIp
    ];
    
    $ch = curl_init();
    
    curl_setopt_array($ch, [
        CURLOPT_URL => TURNSTILE_VERIFY_URL,
        CURLOPT_POST => true,
        CURLOPT_POSTFIELDS => http_build_query($postFields),
        CURLOPT_RETURNTRANSFER => true,
        CURLOPT_TIMEOUT => 10,
        CURLOPT_CONNECTTIMEOUT => 5,
        CURLOPT_HTTPHEADER => [
            'Content-Type: application/x-www-form-urlencoded',
            'User-Agent: PHP-Turnstile-Verifier/1.0'
        ],
        CURLOPT_SSL_VERIFYPEER => true,
        CURLOPT_SSL_VERIFYHOST => 2,
        CURLOPT_FOLLOWLOCATION => false,
        CURLOPT_MAXREDIRS => 0
    ]);
    
    $response = curl_exec($ch);
    $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    $curlError = curl_error($ch);
    curl_close($ch);
    
    if ($response === false || !empty($curlError)) {
        error_log('Turnstile verification failed: cURL error - ' . $curlError);
        return false;
    }
    
    if ($httpCode !== 200) {
        error_log('Turnstile verification failed: HTTP ' . $httpCode . ' - ' . $response);
        return false;
    }
    
    $result = json_decode($response, true);
    
    if ($result === null) {
        error_log('Turnstile verification failed: Invalid JSON response - ' . json_last_error_msg());
        return false;
    }
    
    if (!isset($result['success'])) {
        error_log('Turnstile verification failed: Missing success field in response');
        return false;
    }
    
    if (!$result['success']) {
        $errors = 'Unknown error';
        if (isset($result['error-codes']) && is_array($result['error-codes'])) {
            $errors = implode(', ', $result['error-codes']);
        }
        error_log('Turnstile verification failed: ' . $errors);
        return false;
    }
    
    if (isset($result['hostname']) && !empty($_SERVER['HTTP_HOST'])) {
        $expectedHostname = $_SERVER['HTTP_HOST'];
        if ($result['hostname'] !== $expectedHostname) {
            error_log('Turnstile verification failed: Hostname mismatch - expected: ' . $expectedHostname . ', got: ' . $result['hostname']);
            return false;
        }
    }
    
    if (isset($result['challenge_ts'])) {
        $challengeTime = strtotime($result['challenge_ts']);
        $currentTime = time();
        $maxAge = 300; // 5 minutes max
        
        if (($currentTime - $challengeTime) > $maxAge) {
            error_log('Turnstile verification failed: Token too old');
            return false;
        }
    }
        
    return true;
}

function generateVerificationKey($name, $timestamp) {
    $randomChars = bin2hex(random_bytes(32));
    
    global $mysqli;
    $result = $mysqli->query("SELECT AUTO_INCREMENT FROM information_schema.TABLES WHERE TABLE_SCHEMA = '" . DB_NAME . "' AND TABLE_NAME = 'cert'");
    $row = $result->fetch_assoc();
    $nextId = $row['AUTO_INCREMENT'];
    
    $certNumberData = "CERT-" . str_pad($nextId, 5, '0', STR_PAD_LEFT) . "-" . $name;
    $certBasedChars = base64_encode($certNumberData);
    $certBasedChars = str_pad($certBasedChars, 64, '=', STR_PAD_RIGHT);
    $certBasedChars = substr($certBasedChars, 0, 64);
    
    $dateTime = gmdate('Y-m-d H:i:s', $timestamp);
    $timeData = "CREATED-" . $dateTime;
    $timeBasedChars = base64_encode($timeData);
    $timeBasedChars = str_pad($timeBasedChars, 64, '=', STR_PAD_RIGHT);
    $timeBasedChars = substr($timeBasedChars, 0, 64);
    
    return $randomChars . '|' . $certBasedChars . '|' . $timeBasedChars;
}

function createTextChunk($keyword, $text) {
    $data = $keyword . "\0" . $text;
    $length = pack('N', strlen($data));
    $chunkType = 'tEXt';
    $crc = pack('N', crc32($chunkType . $data));
    return $length . $chunkType . $data . $crc;
}

function appendVerificationKeyToPng($pngPath, $verificationKey) {
    $keyParts = explode('|', $verificationKey);

    $verificationText = "-----BEGIN NOSKID KEY-----\n";
    $verificationText .= $keyParts[0] . "\n";
    $verificationText .= $keyParts[1] . "\n";
    $verificationText .= $keyParts[2] . "\n";
    $verificationText .= "-----END NOSKID KEY-----";

    $pngData = file_get_contents($pngPath);

    if (substr($pngData, 0, 8) !== "\x89PNG\x0D\x0A\x1A\x0A") {
        throw new Exception("Not a valid PNG file.");
    }

    $pos = 8;
    $chunks = [];

    while ($pos < strlen($pngData)) {
        $length = unpack('N', substr($pngData, $pos, 4))[1];
        $type = substr($pngData, $pos + 4, 4);
        $data = substr($pngData, $pos + 8, $length);
        $crc = substr($pngData, $pos + 8 + $length, 4);

        if ($type === 'IEND') {
            $textChunk = createTextChunk('noskid-key', $verificationText);
            $chunks[] = $textChunk;
        }

        $chunk = substr($pngData, $pos, 12 + $length);
        $chunks[] = $chunk;

        $pos += 12 + $length;
    }

    $newData = substr($pngData, 0, 8) . implode('', $chunks);
    file_put_contents($pngPath, $newData);
}

function setupDatabase($mysqli) {
    $requestsTableExists = $mysqli->query("SHOW TABLES LIKE 'requests'")->num_rows > 0;
    if (!$requestsTableExists) {
        $createRequestsTableSql = "CREATE TABLE requests (
            id INT(11) AUTO_INCREMENT PRIMARY KEY,
            ip VARCHAR(45) NOT NULL,
            user_agent TEXT NOT NULL,
            request_time DATETIME NOT NULL,
            INDEX idx_request_time (ip, request_time)
        )";
        if (!$mysqli->query($createRequestsTableSql)) {
            die('Error creating requests table: ' . $mysqli->error);
        }
    }

    $certTableExists = $mysqli->query("SHOW TABLES LIKE 'cert'")->num_rows > 0;
    if (!$certTableExists) {
        $createTableSql = "CREATE TABLE cert (
            id INT(11) AUTO_INCREMENT PRIMARY KEY,
            name VARCHAR(255) NOT NULL,
            percentage DECIMAL(5,2) NOT NULL,
            ip VARCHAR(45) NOT NULL,
            verification_key VARCHAR(255) NOT NULL,
            created_at TIMESTAMP DEFAULT UTC_TIMESTAMP()
        )";
        if (!$mysqli->query($createTableSql)) {
            die('Error creating cert table: ' . $mysqli->error);
        }
    } else {
        if (!$mysqli->query("SHOW COLUMNS FROM cert LIKE 'verification_key'")->num_rows) {
            $mysqli->query("ALTER TABLE cert ADD COLUMN verification_key VARCHAR(255) AFTER ip");
        }
    }
}

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
    $webhookUrl = DISCORD_WEBHOOK_URL;

    $message = [
        'content' => "New certificate generated!",
        'embeds' => [
            [
                'title' => 'Certificate Details',
                'color' => 0x00FF00,
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
                'timestamp' => gmdate('c')
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