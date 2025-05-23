<?php
$ip = $_SERVER['REMOTE_ADDR'];
$r= file_get_contents("http://ip-api.com/json/$ip");
header('Content-Type: application/json');
echo $r;
?>
