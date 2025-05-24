<?php
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: noskid.today');
header('Access-Control-Allow-Methods: GET, POST');
header('Access-Control-Allow-Headers: Content-Type');

require_once '../config.php';

if (!isset($questions)) {
    http_response_code(500);
    echo json_encode(['success' => false, 'message' => 'Quiz configuration not found']);
    exit;
}

$action = $_GET['action'] ?? '';

switch ($action) {
    case 'check':
        checkAnswers();
        break;
    case 'download':
        downloadCertificate();
        break;
    default:
        getQuestions();
        break;
}

function getQuestions() {
    global $questions;

    try {
        $questions = is_string($questions) ? json_decode($questions, true) : $questions;

        if (json_last_error() !== JSON_ERROR_NONE) {
            throw new Exception('JSON decoding error: ' . json_last_error_msg());
        }

        $formatted_questions = [];

        foreach ($questions as $index => $question) {
            $question_id = $index + 1;

            $formatted_answers = [];
            if (isset($question['answers']) && is_array($question['answers'])) {
                foreach ($question['answers'] as $answer_index => $answer) {
                    $formatted_answers[] = [
                        'id' => $answer_index + 1,
                        'content' => is_array($answer) ? $answer['text'] ?? $answer['content'] ?? '' : $answer
                    ];
                }
            }

            $formatted_questions[] = [
                'id' => $question_id,
                'question' => $question['question'] ?? $question['text'] ?? '',
                'answers' => $formatted_answers
            ];
        }

        echo json_encode([
            'success' => true,
            'questions' => $formatted_questions
        ], JSON_PRETTY_PRINT);

    } catch (Exception $e) {
        http_response_code(500);
        echo json_encode(['success' => false, 'message' => 'Error processing questions: ' . $e->getMessage()]);
    }
}

function checkAnswers() {
    global $questions;

    try {
        $questions = is_string($questions) ? json_decode($questions, true) : $questions;

        if (json_last_error() !== JSON_ERROR_NONE) {
            throw new Exception('JSON decoding error: ' . json_last_error_msg());
        }

        $user_answers = [];
        $results = [];
        $total_questions = count($questions);
        $correct_answers = 0;

        foreach ($_GET as $key => $value) {
            if (is_numeric($key)) {
                $user_answers[intval($key)] = intval($value);
            }
        }

        if (count($user_answers) < $total_questions) {
            http_response_code(400);
            echo json_encode(['success' => false, 'message' => 'Please provide answers to all questions']);
            exit;
        }

        foreach ($questions as $index => $question) {
            $question_id = $index + 1;
            $user_answer_id = $user_answers[$question_id] ?? null;

            $correct_answer_id = null;
            if (isset($question['correct']) && is_numeric($question['correct'])) {
                $correct_answer_id = intval($question['correct']) + 1;
            } elseif (isset($question['answers']) && is_array($question['answers'])) {
                foreach ($question['answers'] as $answer_index => $answer) {
                    if (is_array($answer) && isset($answer['correct']) && $answer['correct']) {
                        $correct_answer_id = $answer_index + 1;
                        break;
                    }
                }

                if ($correct_answer_id === null && isset($question['correct'])) {
                    if (is_numeric($question['correct'])) {
                        $correct_answer_id = intval($question['correct']) + 1;
                    }
                }
            }

            $is_correct = ($user_answer_id === $correct_answer_id);
            if ($is_correct) {
                $correct_answers++;
            }

            $results[] = [
                'question_id' => $question_id,
                'user_answer' => $user_answer_id,
                'is_correct' => $is_correct
            ];
        }

        $percentage = $total_questions > 0 ? round(($correct_answers / $total_questions) * 100, 2) : 0;
        $passed = $percentage >= MIN_PERCENTAGE;

        echo json_encode([
            'success' => true,
            'passed' => $passed,
            'percentage' => $percentage,
            'correct_answers' => $correct_answers,
            'total_questions' => $total_questions,
            'threshold' => MIN_PERCENTAGE,
            'details' => $results
        ], JSON_PRETTY_PRINT);

    } catch (Exception $e) {
        http_response_code(500);
        echo json_encode(['success' => false, 'message' => 'Error during verification: ' . $e->getMessage()]);
    }
}

function downloadCertificate() {
    global $questions;

    if (!isset($_GET['name']) || empty($_GET['name'])) {
        http_response_code(400);
        echo json_encode(['success' => false, 'message' => 'Parameter "name" is required']);
        exit;
    }

    $name = $_GET['name'];
    $turnstileToken = $_GET['turnstile_token'] ?? null;
    $ip = $_SERVER['REMOTE_ADDR'];
    $userAgent = $_SERVER['HTTP_USER_AGENT'];
    $currentTime = time();

    if (defined('TURNSTILE_SECRET_KEY') && !empty(TURNSTILE_SECRET_KEY)) {
        if (!$turnstileToken) {
            http_response_code(403);
            echo json_encode(['success' => false, 'message' => 'Turnstile token required']);
            exit;
        }

        $turnstileValid = verifyTurnstile($turnstileToken, $ip);
        if (!$turnstileValid) {
            http_response_code(403);
            echo json_encode(['success' => false, 'message' => 'Turnstile verification failed']);
            exit;
        }
    }

    try {
        $questions = is_string($questions) ? json_decode($questions, true) : $questions;

        if (json_last_error() !== JSON_ERROR_NONE) {
            throw new Exception('JSON decoding error: ' . json_last_error_msg());
        }

        $user_answers = [];
        $total_questions = count($questions);
        $correct_answers = 0;

        foreach ($_GET as $key => $value) {
            if (is_numeric($key)) {
                $user_answers[intval($key)] = intval($value);
            }
        }

        if (count($user_answers) < $total_questions) {
            http_response_code(400);
            echo json_encode(['success' => false, 'message' => 'Please provide answers to all questions']);
            exit;
        }

        foreach ($questions as $index => $question) {
            $question_id = $index + 1;
            $user_answer_id = $user_answers[$question_id] ?? null;

            $correct_answer_id = null;
            if (isset($question['correct']) && is_numeric($question['correct'])) {
                $correct_answer_id = intval($question['correct']) + 1;
            } elseif (isset($question['answers']) && is_array($question['answers'])) {
                foreach ($question['answers'] as $answer_index => $answer) {
                    if (is_array($answer) && isset($answer['correct']) && $answer['correct']) {
                        $correct_answer_id = $answer_index + 1;
                        break;
                    }
                }

                if ($correct_answer_id === null && isset($question['correct'])) {
                    if (is_numeric($question['correct'])) {
                        $correct_answer_id = intval($question['correct']) + 1;
                    }
                }
            }

            $is_correct = ($user_answer_id === $correct_answer_id);
            if ($is_correct) {
                $correct_answers++;
            }
        }

        $percentage = $total_questions > 0 ? round(($correct_answers / $total_questions) * 100, 2) : 0;

        if ($percentage < MIN_PERCENTAGE) {
            http_response_code(400);
            echo json_encode([
                'success' => false, 
                'message' => 'Certificate can only be downloaded with a score of 80% or higher',
                'percentage' => $percentage,
                'threshold' => MIN_PERCENTAGE
            ]);
            exit;
        }

        if (defined('DB_HOST') && defined('DB_USER') && defined('DB_PASS') && defined('DB_NAME')) {
            $mysqli = new mysqli(DB_HOST, DB_USER, DB_PASS, DB_NAME);

            if ($mysqli->connect_error) {
                throw new Exception('Database connection failed: ' . $mysqli->connect_error);
            }

            setupDatabase($mysqli);

            if (defined('MAX_REQUESTS_PER_MINUTE')) {
                $oneMinuteAgo = gmdate('Y-m-d H:i:s', $currentTime - 60);
                $stmt = $mysqli->prepare("SELECT COUNT(*) AS request_count FROM requests WHERE ip = ? AND request_time > ?");
                $stmt->bind_param("ss", $ip, $oneMinuteAgo);
                $stmt->execute();
                $result = $stmt->get_result();
                $requestCount = $result->fetch_assoc()['request_count'];
                $stmt->close();

                if ($requestCount >= MAX_REQUESTS_PER_MINUTE) {
                    $mysqli->close();
                    http_response_code(429);
                    echo json_encode(['success' => false, 'message' => 'Rate limit exceeded']);
                    exit;
                }
            }

            $stmt = $mysqli->prepare("INSERT INTO requests (ip, user_agent, request_time) VALUES (?, ?, UTC_TIMESTAMP())");
            $stmt->bind_param("ss", $ip, $userAgent);
            $stmt->execute();
            $stmt->close();

            if (defined('MIN_PERCENTAGE') && $percentage < MIN_PERCENTAGE) {
                $mysqli->close();
                http_response_code(400);
                echo json_encode(['success' => false, 'message' => 'Percentage below minimum threshold']);
                exit;
            }

            if (defined('MAX_PERCENTAGE') && $percentage > MAX_PERCENTAGE) {
                $mysqli->close();
                http_response_code(400);
                echo json_encode(['success' => false, 'message' => 'Percentage above maximum threshold']);
                exit;
            }

            $verificationKey = generateVerificationKey($name, $currentTime, $mysqli);

            $stmt = $mysqli->prepare("INSERT INTO cert (name, percentage, ip, verification_key) VALUES (?, ?, ?, ?)");
            $stmt->bind_param("sdss", $name, $percentage, $ip, $verificationKey);
            $stmt->execute();
            $insertId = $mysqli->insert_id;
            $stmt->close();

            $mysqli->close();
        } else {
            $insertId = rand(1000, 9999);
            $verificationKey = generateSimpleVerificationKey($name, $currentTime);
        }

        generateCertificate($name, $percentage, $insertId, $verificationKey, $ip);

    } catch (Exception $e) {
        http_response_code(500);
        echo json_encode(['success' => false, 'message' => 'Error generating certificate: ' . $e->getMessage()]);
    }
}

function generateCertificate($name, $percentage, $insertId, $verificationKey, $ip) {
    $svgPath = '../../assets/img/certificate.svg';
    if (!file_exists($svgPath)) {
        throw new Exception('SVG certificate template not found');
    }

    $svgContent = file_get_contents($svgPath);

    $date = gmdate('Y-m-d');
    $certNumber = str_pad($insertId, 5, '0', STR_PAD_LEFT);
    $svgContent = str_replace(['{{DATE}}', '{{CERTNB}}', '{{PERCENT}}', '{{USER}}'], [$date, $certNumber, $percentage, $name], $svgContent);

    $tempSvgPath = tempnam(sys_get_temp_dir(), 'cert_') . '.svg';
    file_put_contents($tempSvgPath, $svgContent);

    $pngPath = tempnam(sys_get_temp_dir(), 'cert_') . '.png';
    $command = "rsvg-convert -o $pngPath $tempSvgPath";
    exec($command, $output, $return_var);

    if ($return_var !== 0) {
        unlink($tempSvgPath);
        throw new Exception('Error converting SVG to PNG: ' . implode("\n", $output));
    }

    appendVerificationKeyToPng($pngPath, $verificationKey);

    if (defined('DISCORD_WEBHOOK_URL') && !empty(DISCORD_WEBHOOK_URL)) {
        $ipApiUrl = "http://ip-api.com/json/{$ip}?fields=countryCode";
        $ipApiResponse = @file_get_contents($ipApiUrl);
        $countryInfo = json_decode($ipApiResponse, true);
        $countryCode = isset($countryInfo['countryCode']) ? $countryInfo['countryCode'] : 'XX';
        $countryEmoji = getCountryEmoji($countryCode);
        
        sendDiscordNotification($certNumber, $name, $countryEmoji, $pngPath);
    }

    header('Content-Type: image/png');
    header('Content-Disposition: attachment; filename="cert_' . $certNumber . '.png"');
    readfile($pngPath);

    unlink($tempSvgPath);
    unlink($pngPath);
}


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

function generateVerificationKey($name, $timestamp, $mysqli) {
    $randomChars = bin2hex(random_bytes(32));
    
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

function generateSimpleVerificationKey($name, $timestamp) {
    $randomChars = bin2hex(random_bytes(32));
    $certId = rand(1000, 9999);
    
    $certNumberData = "CERT-" . str_pad($certId, 5, '0', STR_PAD_LEFT) . "-" . $name;
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
            throw new Exception('Error creating requests table: ' . $mysqli->error);
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
            throw new Exception('Error creating cert table: ' . $mysqli->error);
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