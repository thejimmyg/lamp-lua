<?php
require './config.php';

$filename = isset($_GET["filename"]) ? $_GET["filename"] : '';
switch ($filename) {
    case '':
	$PAGE_TITLE = "Home";
        include (PATH_TO_LIB . '/tpl/home.php');
        break;

    case 'db':
	$PAGE_TITLE = "DB";
        include (PATH_TO_LIB . '/inc/db.php');
        include (PATH_TO_LIB . '/tpl/db.php');
        break;

    default:
	$PAGE_TITLE = "Not Found";
        header('HTTP/1.1 404 Not Found');
        include (PATH_TO_LIB . '/tpl/404.php');
        break;
}
