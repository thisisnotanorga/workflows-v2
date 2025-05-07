<?php
//Be sure of having the database set up before checking if a cert is valid

define('DB_HOST', 'dbhost');
define('DB_USER', 'dbuser');
define('DB_PASS', 'dbpwd');
define('DB_NAME', 'dbname');

function extractVerificationKeyFromPng($fileContent) {
    if (substr($fileContent, 0, 8) !== "\x89\x50\x4E\x47\x0D\x0A\x1A\x0A") {
        return null;
    }
    
    $position = 8;
    $length = strlen($fileContent);
    
    while ($position < $length) {
        $chunkLength = unpack("N", substr($fileContent, $position, 4))[1];
        $chunkType = substr($fileContent, $position + 4, 4);
        
        if ($chunkType === 'tEXt') {
            $chunkData = substr($fileContent, $position + 8, $chunkLength);
            $nullPos = strpos($chunkData, "\0");
            
            if ($nullPos !== false) {
                $keyword = substr($chunkData, 0, $nullPos);
                $value = substr($chunkData, $nullPos + 1);
                
                if ($keyword === 'noskid-key') {
                    return extractVerificationKey($value);
                }
            }
        }
        
        $position += 8 + $chunkLength + 4;
    }
    
    return null;
}



function extractVerificationKey($text) {
    if (preg_match('/-*BEGIN NOSKID KEY-*\s*([a-f0-9]{64})/i', $text, $matches)) {
        return $matches[1];
    }
    
    return null;
}

function verifyCertificateKey($key) {
    if (empty($key)) {
        return [
            'success' => false,
            'message' => 'Invalid verification key'
        ];
    }

    $mysqli = new mysqli(DB_HOST, DB_USER, DB_PASS, DB_NAME);

    if ($mysqli->connect_error) {
        return [
            'success' => false,
            'message' => 'Database connection error'
        ];
    }

    $stmt = $mysqli->prepare("SELECT c.id, c.name, c.percentage, c.created_at, c.verification_key 
                            FROM cert c 
                            WHERE c.verification_key LIKE CONCAT(?, '|%')");

    if (!$stmt) {
        return [
            'success' => false,
            'message' => 'Database query preparation failed'
        ];
    }

    $stmt->bind_param("s", $key);
    $stmt->execute();
    $result = $stmt->get_result();

    if ($result->num_rows === 0) {
        $stmt->close();
        $mysqli->close();
        return [
            'success' => false,
            'message' => 'Certificate not found or invalid verification key'
        ];
    }

    $cert = $result->fetch_assoc();
    $stmt->close();
    $mysqli->close();

    $certNumber = str_pad($cert['id'], 5, '0', STR_PAD_LEFT);
    
    $creationDate = $cert['created_at'];

    return [
        'success' => true,
        'message' => 'Certificate is valid and verified',
        'data' => [
            'certificate_number' => $certNumber,
            'username' => $cert['name'],
            'percentage' => $cert['percentage'],
            'creationDate' => $creationDate
        ]
    ];
}

function getGithubFileContent($owner, $path) {
    $url = "https://raw.githubusercontent.com/{$owner}/{$owner}/master/{$path}";
    $content = @file_get_contents($url);
    
    if ($content === false) {
        return null;
    }
    
    return $content;
}

function getWebsiteFileContent($url, $path) {
    if (!preg_match('~^(?:f|ht)tps?://~i', $url)) {
        $url = "http://" . $url;
    }
    
    if (substr($url, -1) !== '/') {
        $url .= '/';
    }
    
    $fileUrl = $url . $path;
    
    $context = stream_context_create([
        'http' => [
            'follow_location' => true,
            'max_redirects' => 5
        ]
    ]);
    
    $content = @file_get_contents($fileUrl, false, $context);
    
    if ($content === false) {
        return null;
    }
    
    return $content;
}

function extractDomainName($url) {
    if (!preg_match('~^(?:f|ht)tps?://~i', $url)) {
        $url = "http://" . $url;
    }
    
    $parsedUrl = parse_url($url);
    if (isset($parsedUrl['host'])) {
        return preg_replace('/^www\./', '', $parsedUrl['host']);
    }
    
    return $url;
}

function serveErrorSvg($errorCode) {
    $svgPath = "../../assets/img/{$errorCode}.svg";
    
    if (file_exists($svgPath)) {
        header('Content-Type: image/svg+xml');
        header('Cache-Control: public, max-age=3600');
        header('Expires: ' . gmdate('D, d M Y H:i:s \G\M\T', time() + 3600));
        readfile($svgPath);
    } else {
        header('Content-Type: text/plain');
        echo "Error {$errorCode}";
    }
    exit;
}

if (isset($_GET['repo'])) {
    $repoPath = $_GET['repo'];
    $useOriginalName = isset($_GET['oname']) && ($_GET['oname'] === 'true' || $_GET['oname'] === '1');
    
    if (strpos($repoPath, '/') !== false) {
        list($owner, $repo) = explode('/', $repoPath, 2);
        
        $certificatePath = 'noskid/certificate.png';
        $certificateContent = getGithubFileContent($owner, $certificatePath);
        
        if ($certificateContent === null) {
            serveErrorSvg('404');
        }
        
        $verificationKey = extractVerificationKeyFromPng($certificateContent);
        
        if ($verificationKey === null) {
            serveErrorSvg('403');
        }
        
        $verificationResult = verifyCertificateKey($verificationKey);
        
        if (!$verificationResult['success']) {
            serveErrorSvg('403');
        }
        
        $certificateUsername = $verificationResult['data']['username'];
        $certificatePercentage = $verificationResult['data']['percentage'];
        
        if ($useOriginalName) {
            $displayUsername = $certificateUsername;
        } else {
            $displayUsername = $owner;
            if ($owner != $repo) {
                $displayUsername = "$repo's owner";
            }
        }
        
        if ($certificateUsername == $owner) {
            $svgTemplate = file_get_contents('../../assets/img/470x200.svg');
            if ($svgTemplate === false) {
                serveErrorSvg('422');
            }
            
            $svgContent = str_replace('{{USER}}', htmlspecialchars($displayUsername), $svgTemplate);
            $svgContent = str_replace('{{PERCENT}}', htmlspecialchars($certificatePercentage), $svgContent);
            
            header('Content-Type: image/svg+xml');
            header('Cache-Control: public, max-age=86400');
            header('Expires: ' . gmdate('D, d M Y H:i:s \G\M\T', time() + 86400));
            
            echo $svgContent;
            exit;
        } else {
            serveErrorSvg('403');
        }
    } else {
        serveErrorSvg('422');
    }
} elseif (isset($_GET['website'])) {
    $websiteUrl = $_GET['website'];
    $useOriginalName = isset($_GET['oname']) && ($_GET['oname'] === 'true' || $_GET['oname'] === '1');
    
    $certificatePath = 'noskid/certificate.png';
    $certificateContent = getWebsiteFileContent($websiteUrl, $certificatePath);
    
    if ($certificateContent === null) {
        serveErrorSvg('404');
    }
    
    $verificationKey = extractVerificationKeyFromPng($certificateContent);
    
    if ($verificationKey === null) {
        serveErrorSvg('403');
    }
    
    $verificationResult = verifyCertificateKey($verificationKey);
    
    if (!$verificationResult['success']) {
        serveErrorSvg('403');
    }
    
    $certificateUsername = $verificationResult['data']['username'];
    $certificatePercentage = $verificationResult['data']['percentage'];
    
    if ($useOriginalName) {
        $displayUsername = $certificateUsername;
    } else {
        $domainName = extractDomainName($websiteUrl);
        $displayUsername = "$domainName's owner";
    }
    
    $svgTemplate = file_get_contents('../../assets/img/470x200.svg');
    if ($svgTemplate === false) {
        serveErrorSvg('422');
    }
    
    $svgContent = str_replace('{{USER}}', htmlspecialchars($displayUsername), $svgTemplate);
    $svgContent = str_replace('{{PERCENT}}', htmlspecialchars($certificatePercentage), $svgContent);
    
    header('Content-Type: image/svg+xml');
    header('Cache-Control: public, max-age=86400');
    header('Expires: ' . gmdate('D, d M Y H:i:s \G\M\T', time() + 86400));
    
    echo $svgContent;
    exit;
}  else {
    serveErrorSvg('422');
}
?>