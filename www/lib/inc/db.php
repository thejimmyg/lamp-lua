<?php
require __DIR__ . '/../config.php';

$conn = new mysqli('p:' . MYSQL_HOST, MYSQL_USER, MYSQL_PASSWORD, MYSQL_DATABASE);
if ($conn->connect_error) {
    die("DB connection failed.");
}
$json = file_get_contents('php://input');
