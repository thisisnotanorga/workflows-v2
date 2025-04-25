<?php
define('MIN_PERCENTAGE', 80);
define('MAX_PERCENTAGE', 100);
define('MAX_REQUESTS_PER_MINUTE', 3);
define('WARNING_TIMEOUT', 300); // seconds btw
define('DISCORD_WEBHOOK_URL', 'WBK_URL');

if (!isset($_GET['percentage']) || !isset($_GET['name'])) {
    die('Error: Missing parameters "percentage" or "name".');
}

$percentage = $_GET['percentage'];
$name = $_GET['name'];
$ip = $_SERVER['REMOTE_ADDR'];
$userAgent = $_SERVER['HTTP_USER_AGENT'];
$currentTime = time();

$mysqli = new mysqli('dbhost', 'dbuser', 'dbpwd', 'dbname');

if ($mysqli->connect_error) {
    die('Connection failed: ' . $mysqli->connect_error);
}

setupDatabase($mysqli);

$stmt = $mysqli->prepare("SELECT id, status, warn_time FROM users WHERE ip = ? AND user_agent = ?");
$stmt->bind_param("ss", $ip, $userAgent);
$stmt->execute();
$result = $stmt->get_result();

if ($result->num_rows > 0) {
    $user = $result->fetch_assoc();
    $userId = $user['id'];
    $userStatus = $user['status'];
    $warnTime = $user['warn_time'] ? strtotime($user['warn_time']) : 0;
} else {
    $stmt = $mysqli->prepare("INSERT INTO users (ip, user_agent, status) VALUES (?, ?, 'safe')");
    $stmt->bind_param("ss", $ip, $userAgent);
    $stmt->execute();
    $userId = $mysqli->insert_id;
    $userStatus = 'safe';
    $warnTime = 0;
}
$stmt->close();

if ($userStatus === 'ban') {
    header('HTTP/1.1 403 Forbidden');
    die('Access forbidden');
}

$oneMinuteAgo = date('Y-m-d H:i:s', $currentTime - 60);
$stmt = $mysqli->prepare("SELECT COUNT(*) AS request_count FROM requests WHERE user_id = ? AND request_time > ?");
$stmt->bind_param("is", $userId, $oneMinuteAgo);
$stmt->execute();
$result = $stmt->get_result();
$requestCount = $result->fetch_assoc()['request_count'];
$stmt->close();

$stmt = $mysqli->prepare("INSERT INTO requests (user_id, request_time) VALUES (?, NOW())");
$stmt->bind_param("i", $userId);
$stmt->execute();
$stmt->close();

$shouldWarn = false;
$shouldBan = false;
$actionReason = "";

if ($percentage < MIN_PERCENTAGE || $percentage > MAX_PERCENTAGE) {
    $actionReason = "Invalid percentage value";
    if ($userStatus === 'warn') {
        $shouldBan = true;
    } else {
        $shouldWarn = true;
    }
}

if ($requestCount >= MAX_REQUESTS_PER_MINUTE) {
    $actionReason = "Rate limit exceeded";
    if ($userStatus === 'warn') {
        $shouldBan = true;
    } else {
        $shouldWarn = true;
    }
}

if ($userStatus === 'warn' && $warnTime > 0 && ($currentTime - $warnTime) <= WARNING_TIMEOUT) {
    $shouldBan = true;
    $actionReason = "Multiple violations within warning period";
}

if ($shouldBan) {
    $stmt = $mysqli->prepare("UPDATE users SET status = 'ban', warn_time = NULL WHERE id = ?");
    $stmt->bind_param("i", $userId);
    $stmt->execute();
    $stmt->close();

    $stmt = $mysqli->prepare("INSERT INTO warnings (user_id, reason, warning_time) VALUES (?, ?, NOW())");
    $stmt->bind_param("is", $userId, $actionReason);
    $stmt->execute();
    $stmt->close();

    sendDiscordBanNotification($name, $ip, $userAgent, $actionReason);

    header('HTTP/1.1 403 Forbidden');
    die('Access forbidden');
}

if ($shouldWarn) {
    $stmt = $mysqli->prepare("UPDATE users SET status = 'warn', warn_time = NOW() WHERE id = ?");
    $stmt->bind_param("i", $userId);
    $stmt->execute();
    $stmt->close();

    $stmt = $mysqli->prepare("INSERT INTO warnings (user_id, reason, warning_time) VALUES (?, ?, NOW())");
    $stmt->bind_param("is", $userId, $actionReason);
    $stmt->execute();
    $stmt->close();

    sendDiscordWarningNotification($name, $ip, $userAgent, $actionReason);

    $warningPath = '../../assets/img/warning.png';
    if (file_exists($warningPath)) {
        header('Content-Type: image/png');
        readfile($warningPath);
        exit;
    } else {
        die('Warning image not found');
    }
}

if ($userStatus === 'warn' && $warnTime > 0 && ($currentTime - $warnTime) > WARNING_TIMEOUT) {
    $stmt = $mysqli->prepare("UPDATE users SET status = 'safe', warn_time = NULL WHERE id = ?");
    $stmt->bind_param("i", $userId);
    $stmt->execute();
    $stmt->close();
    $userStatus = 'safe';
}

$stmt = $mysqli->prepare("INSERT INTO cert (name, percentage, ip, user_id) VALUES (?, ?, ?, ?)");
$stmt->bind_param("sdsi", $name, $percentage, $ip, $userId);
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

sendDiscordNotification($certNumber, $name, $countryEmoji, $userStatus, $pngPath);

header('Content-Type: image/png');
header('Content-Disposition: attachment; filename="cert_' . $certNumber . '.png"');
readfile($pngPath);

unlink($tempSvgPath);
unlink($pngPath);

$mysqli->close();

function setupDatabase($mysqli) {
    $usersTableExists = $mysqli->query("SHOW TABLES LIKE 'users'")->num_rows > 0;
    if (!$usersTableExists) {
        $createUsersTableSql = "CREATE TABLE users (
            id INT(11) AUTO_INCREMENT PRIMARY KEY,
            ip VARCHAR(45) NOT NULL,
            user_agent TEXT NOT NULL,
            status ENUM('safe', 'warn', 'ban') NOT NULL DEFAULT 'safe',
            warn_time DATETIME NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
            UNIQUE KEY unique_user (ip, user_agent(255))
        )";
        if (!$mysqli->query($createUsersTableSql)) {
            die('Error creating users table: ' . $mysqli->error);
        }
    } elseif (!$mysqli->query("SHOW COLUMNS FROM users LIKE 'warn_time'")->num_rows) {
        $mysqli->query("ALTER TABLE users ADD COLUMN warn_time DATETIME NULL AFTER status");
    }

    $requestsTableExists = $mysqli->query("SHOW TABLES LIKE 'requests'")->num_rows > 0;
    if (!$requestsTableExists) {
        $createRequestsTableSql = "CREATE TABLE requests (
            id INT(11) AUTO_INCREMENT PRIMARY KEY,
            user_id INT(11) NOT NULL,
            request_time DATETIME NOT NULL,
            FOREIGN KEY (user_id) REFERENCES users(id)
        )";
        if (!$mysqli->query($createRequestsTableSql)) {
            die('Error creating requests table: ' . $mysqli->error);
        }
    }

    $warningsTableExists = $mysqli->query("SHOW TABLES LIKE 'warnings'")->num_rows > 0;
    if (!$warningsTableExists) {
        $createWarningsTableSql = "CREATE TABLE warnings (
            id INT(11) AUTO_INCREMENT PRIMARY KEY,
            user_id INT(11) NOT NULL,
            reason VARCHAR(255) NOT NULL,
            warning_time DATETIME NOT NULL,
            FOREIGN KEY (user_id) REFERENCES users(id)
        )";
        if (!$mysqli->query($createWarningsTableSql)) {
            die('Error creating warnings table: ' . $mysqli->error);
        }
    }

    $certTableExists = $mysqli->query("SHOW TABLES LIKE 'cert'")->num_rows > 0;
    if (!$certTableExists) {
        $createTableSql = "CREATE TABLE cert (
            id INT(11) AUTO_INCREMENT PRIMARY KEY,
            name VARCHAR(255) NOT NULL,
            percentage DECIMAL(5,2) NOT NULL,
            ip VARCHAR(45) NOT NULL,
            user_id INT(11) NOT NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (user_id) REFERENCES users(id)
        )";
        if (!$mysqli->query($createTableSql)) {
            die('Error creating cert table: ' . $mysqli->error);
        }
    } elseif (!$mysqli->query("SHOW COLUMNS FROM cert LIKE 'user_id'")->num_rows) {
        $mysqli->query("ALTER TABLE cert ADD COLUMN user_id INT(11) AFTER ip");
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

function sendDiscordNotification($certNumber, $username, $countryEmoji, $userStatus, $pngPath) {
    $webhookUrl = DISCORD_WEBHOOK_URL;

    $statusColor = [
        'safe' => 0xf9f7f0,
        'warn' => 0xFFFF00,
        'ban' => 0xFF0000
    ];

    $color = isset($statusColor[$userStatus]) ? $statusColor[$userStatus] : 0xf9f7f0;

    $message = [
        'content' => "New certificate generated!",
        'embeds' => [
            [
                'title' => 'Certificate Details',
                'color' => $color,
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
                    ],
                    [
                        'name' => 'Status',
                        'value' => ucfirst($userStatus),
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

function sendDiscordWarningNotification($username, $ip, $userAgent, $reason) {
    $webhookUrl = DISCORD_WEBHOOK_URL;

    $message = [
        'content' => "⚠️ Warning issued!",
        'embeds' => [
            [
                'title' => 'Warning Details',
                'color' => 0xFFFF00,
                'fields' => [
                    [
                        'name' => 'User',
                        'value' => $username,
                        'inline' => true
                    ],
                    [
                        'name' => 'IP',
                        'value' => '`' . $ip . '`',
                        'inline' => true
                    ],
                    [
                        'name' => 'Reason',
                        'value' => $reason,
                        'inline' => false
                    ],
                    [
                        'name' => 'User Agent',
                        'value' => substr($userAgent, 0, 100) . (strlen($userAgent) > 100 ? '...' : ''),
                        'inline' => false
                    ]
                ],
                'timestamp' => date('c')
            ]
        ]
    ];

    $ch = curl_init($webhookUrl);
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
    curl_setopt($ch, CURLOPT_POST, true);
    curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode($message));
    curl_setopt($ch, CURLOPT_HTTPHEADER, [
        'Content-Type: application/json'
    ]);

    $response = curl_exec($ch);
    $error = curl_error($ch);
    curl_close($ch);

    if ($error) {
        error_log('Discord webhook error: ' . $error);
    }
}

function sendDiscordBanNotification($username, $ip, $userAgent, $reason) {
    $webhookUrl = DISCORD_WEBHOOK_URL;

    $message = [
        'content' => "🚫 User banned!",
        'embeds' => [
            [
                'title' => 'Ban Details',
                'color' => 0xFF0000,
                'fields' => [
                    [
                        'name' => 'User',
                        'value' => $username,
                        'inline' => true
                    ],
                    [
                        'name' => 'IP',
                        'value' => '`' . $ip . '`',
                        'inline' => true
                    ],
                    [
                        'name' => 'Reason',
                        'value' => $reason,
                        'inline' => false
                    ],
                    [
                        'name' => 'User Agent',
                        'value' => substr($userAgent, 0, 100) . (strlen($userAgent) > 100 ? '...' : ''),
                        'inline' => false
                    ]
                ],
                'timestamp' => date('c')
            ]
        ]
    ];

    $ch = curl_init($webhookUrl);
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
    curl_setopt($ch, CURLOPT_POST, true);
    curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode($message));
    curl_setopt($ch, CURLOPT_HTTPHEADER, [
        'Content-Type: application/json'
    ]);

    $response = curl_exec($ch);
    $error = curl_error($ch);
    curl_close($ch);

    if ($error) {
        error_log('Discord webhook error: ' . $error);
    }
}
?>
