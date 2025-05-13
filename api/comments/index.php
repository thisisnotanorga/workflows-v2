<?php

/*

=============================
DB SETUP
=============================

-- posts
CREATE TABLE IF NOT EXISTS comments_posts (
    id INT AUTO_INCREMENT PRIMARY KEY,
    author VARCHAR(100) NOT NULL,
    content TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    user_fingerprint VARCHAR(255) NOT NULL,
    likes INT DEFAULT 0,
    dislikes INT DEFAULT 0,
    ip_address VARCHAR(45) NOT NULL DEFAULT '0.0.0.0'
);

-- like/dislike
CREATE TABLE IF NOT EXISTS comments_reactions (
    id INT AUTO_INCREMENT PRIMARY KEY,
    comment_id INT NOT NULL,
    user_fingerprint VARCHAR(255) NOT NULL,
    reaction_type ENUM('like', 'dislike') NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (comment_id) REFERENCES comments_posts(id) ON DELETE CASCADE,
    UNIQUE KEY unique_reaction (comment_id, user_fingerprint)
);

-- uses
CREATE TABLE IF NOT EXISTS comments_users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_fingerprint VARCHAR(255) NOT NULL,
    last_comment_date DATE NOT NULL,
    ip_address VARCHAR(45) NOT NULL DEFAULT '0.0.0.0',
    UNIQUE KEY unique_user (user_fingerprint)
);

-- bl ip
CREATE TABLE IF NOT EXISTS comments_blocked_ips (
    id INT AUTO_INCREMENT PRIMARY KEY,
    ip_address VARCHAR(45) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE KEY unique_ip (ip_address)
);
*/

header('Content-Type: application/json');

define('DB_HOST', 'dbhost');
define('DB_USER', 'dbuser');
define('DB_PASS', 'dbpwd');
define('DB_NAME', 'dbname');

$conn = new mysqli(DB_HOST, DB_USER, DB_PASS, DB_NAME);

if ($conn->connect_error) {
    http_response_code(500);
    echo json_encode(['error' => 'Database connection failed: ' . $conn->connect_error]);
    exit;
}

function getBadWords() {
    $badWordsFile = './bw.txt';
    if (!file_exists($badWordsFile)) {
        return [];
    }

    $content = file_get_contents($badWordsFile);
    if ($content === false) {
        return [];
    }

    $badWords = array_filter(array_map('trim', explode("\n", $content)));
    return $badWords;
}

function censorBadWords($text) {
    $badWords = getBadWords();
    if (empty($badWords)) {
        return $text;
    }

    foreach ($badWords as $word) {
        if (empty($word)) continue;

        $pattern = '/\b' . preg_quote($word, '/') . '\b/i';
        $replacement = str_repeat('#', strlen($word));

        $text = preg_replace($pattern, $replacement, $text);
    }

    return $text;
}

function getUserFingerprint() {
    $ip = $_SERVER['REMOTE_ADDR'];
    $userAgent = $_SERVER['HTTP_USER_AGENT'];
    return md5($ip . $userAgent);
}

function isIpBlocked($conn, $ip) {
    $sql = "SELECT * FROM comments_blocked_ips WHERE ip_address = ?";
    $stmt = $conn->prepare($sql);
    $stmt->bind_param("s", $ip);
    $stmt->execute();
    $result = $stmt->get_result();

    return $result->num_rows > 0;
}

function blockIp($conn, $ip) {
    $sql = "INSERT INTO comments_blocked_ips (ip_address) VALUES (?)";
    $stmt = $conn->prepare($sql);
    $stmt->bind_param("s", $ip);
    $stmt->execute();
}

$userFingerprint = getUserFingerprint();
$ip = $_SERVER['REMOTE_ADDR'];

if (isIpBlocked($conn, $ip)) {
    http_response_code(403);
    echo json_encode(['error' => 'Your IP address has been blocked']);
    exit;
}

$method = $_SERVER['REQUEST_METHOD'];

$action = isset($_GET['action']) ? $_GET['action'] : null;
$commentId = isset($_GET['id']) ? intval($_GET['id']) : 0;

switch($method) {
    case 'GET':
        if ($action === 'like' || $action === 'dislike' || $action === 'none') {
            handleReaction($conn, $commentId, $userFingerprint, $action);
        } else {
            getComments($conn, $userFingerprint);
        }
        break;
    case 'POST':
        addComment($conn, $userFingerprint, $ip);
        break;
    default:
        http_response_code(405);
        echo json_encode(['error' => 'Method not allowed']);
        break;
}

function getComments($conn, $userFingerprint) {
    $sql = "SELECT cp.id, cp.author, cp.content, cp.created_at as date,
            cp.likes, cp.dislikes,
            (SELECT reaction_type FROM comments_reactions WHERE comment_id = cp.id AND user_fingerprint = ?) as user_reaction
            FROM comments_posts cp
            ORDER BY cp.created_at DESC";

    $stmt = $conn->prepare($sql);
    $stmt->bind_param("s", $userFingerprint);
    $stmt->execute();
    $result = $stmt->get_result();

    if ($result === false) {
        http_response_code(500);
        echo json_encode(['error' => 'Error fetching comments: ' . $conn->error]);
        return;
    }

    $comments = [];
    while ($row = $result->fetch_assoc()) {
        $row['content'] = htmlspecialchars($row['content'], ENT_QUOTES, 'UTF-8');
        $row['author'] = htmlspecialchars($row['author'], ENT_QUOTES, 'UTF-8');
        $comments[] = $row;
    }

    echo json_encode($comments);
}

function addComment($conn, $userFingerprint, $ip) {
    $today = date('Y-m-d');
    $sql = "SELECT * FROM comments_users WHERE user_fingerprint = ? AND last_comment_date = ?";
    $stmt = $conn->prepare($sql);
    $stmt->bind_param("ss", $userFingerprint, $today);
    $stmt->execute();
    $result = $stmt->get_result();

    if ($result->num_rows > 0) {
        http_response_code(429);
        echo json_encode(['error' => 'You can only post one comment per day']);
        return;
    }

    $data = json_decode(file_get_contents('php://input'), true);

    if (!isset($data['content']) || empty(trim($data['content']))) {
        http_response_code(400);
        echo json_encode(['error' => 'Comment content is required']);
        return;
    }

    $author = isset($data['author']) && !empty(trim($data['author'])) ?
              trim($data['author']) : 'Anonymous';

    // Censorship yeaahhh
    $content = censorBadWords(trim($data['content']));
    $author = censorBadWords(trim($author));

    $sql = "INSERT INTO comments_posts (author, content, user_fingerprint, ip_address) VALUES (?, ?, ?, ?)";
    $stmt = $conn->prepare($sql);
    $stmt->bind_param("ssss", $author, $content, $userFingerprint, $ip);

    if ($stmt->execute()) {
        $comment_id = $stmt->insert_id;

        $sql = "INSERT INTO comments_users (user_fingerprint, last_comment_date, ip_address)
                VALUES (?, ?, ?)
                ON DUPLICATE KEY UPDATE last_comment_date = ?, ip_address = ?";
        $stmt = $conn->prepare($sql);
        $stmt->bind_param("sssss", $userFingerprint, $today, $ip, $today, $ip);
        $stmt->execute();

        $sql = "SELECT id, author, content, created_at as date, likes, dislikes, NULL as user_reaction
                FROM comments_posts WHERE id = ?";
        $stmt = $conn->prepare($sql);
        $stmt->bind_param("i", $comment_id);
        $stmt->execute();
        $result = $stmt->get_result();
        $comment = $result->fetch_assoc();

        http_response_code(201);
        echo json_encode($comment);
    } else {
        http_response_code(500);
        echo json_encode(['error' => 'Error adding comment: ' . $conn->error]);
    }
}

function handleReaction($conn, $commentId, $userFingerprint, $reactionType) {
    $sql = "SELECT * FROM comments_posts WHERE id = ?";
    $stmt = $conn->prepare($sql);
    $stmt->bind_param("i", $commentId);
    $stmt->execute();
    $result = $stmt->get_result();

    if ($result->num_rows === 0) {
        http_response_code(404);
        echo json_encode(['error' => 'Comment not found']);
        return;
    }

    $conn->begin_transaction();

    try {
        $sql = "SELECT reaction_type FROM comments_reactions WHERE comment_id = ? AND user_fingerprint = ?";
        $stmt = $conn->prepare($sql);
        $stmt->bind_param("is", $commentId, $userFingerprint);
        $stmt->execute();
        $result = $stmt->get_result();
        $currentReaction = $result->num_rows > 0 ? $result->fetch_assoc()['reaction_type'] : null;

        if ($reactionType === 'none') {
            if ($currentReaction) {
                $sql = "DELETE FROM comments_reactions WHERE comment_id = ? AND user_fingerprint = ?";
                $stmt = $conn->prepare($sql);
                $stmt->bind_param("is", $commentId, $userFingerprint);
                $stmt->execute();

                $field = $currentReaction === 'like' ? 'likes' : 'dislikes';
                $sql = "UPDATE comments_posts SET $field = $field - 1 WHERE id = ?";
                $stmt = $conn->prepare($sql);
                $stmt->bind_param("i", $commentId);
                $stmt->execute();
            }
        }
        else {
            if ($currentReaction === null) {
                $sql = "INSERT INTO comments_reactions (comment_id, user_fingerprint, reaction_type) VALUES (?, ?, ?)";
                $stmt = $conn->prepare($sql);
                $stmt->bind_param("iss", $commentId, $userFingerprint, $reactionType);
                $stmt->execute();

                $field = $reactionType === 'like' ? 'likes' : 'dislikes';
                $sql = "UPDATE comments_posts SET $field = $field + 1 WHERE id = ?";
                $stmt = $conn->prepare($sql);
                $stmt->bind_param("i", $commentId);
                $stmt->execute();
            }
            elseif ($currentReaction !== $reactionType) {
                $sql = "UPDATE comments_reactions SET reaction_type = ? WHERE comment_id = ? AND user_fingerprint = ?";
                $stmt = $conn->prepare($sql);
                $stmt->bind_param("sis", $reactionType, $commentId, $userFingerprint);
                $stmt->execute();

                $oldField = $currentReaction === 'like' ? 'likes' : 'dislikes';
                $newField = $reactionType === 'like' ? 'likes' : 'dislikes';
                $sql = "UPDATE comments_posts SET $oldField = $oldField - 1, $newField = $newField + 1 WHERE id = ?";
                $stmt = $conn->prepare($sql);
                $stmt->bind_param("i", $commentId);
                $stmt->execute();
            }
        }

        $conn->commit();

        $sql = "SELECT id, likes, dislikes,
                (SELECT reaction_type FROM comments_reactions WHERE comment_id = ? AND user_fingerprint = ?) as user_reaction
                FROM comments_posts WHERE id = ?";
        $stmt = $conn->prepare($sql);
        $stmt->bind_param("isi", $commentId, $userFingerprint, $commentId);
        $stmt->execute();
        $result = $stmt->get_result();
        $comment = $result->fetch_assoc();

        echo json_encode($comment);
    } catch (Exception $e) {
        $conn->rollback();
        http_response_code(500);
        echo json_encode(['error' => 'Error handling reaction: ' . $e->getMessage()]);
    }
}

$conn->close();
?>
