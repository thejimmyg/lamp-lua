<?php 
$conn = new mysqli('p:' . $_ENV["MYSQL_HOST"], $_ENV["MYSQL_USER"], $_ENV["MYSQL_PASSWORD"]);
if ($conn->connect_error) {
    die("Connection failed: " . $conn->connect_error);
} 
header("Content-Type: application/json");
$json = file_get_contents('php://input');
if ($json) {
    $stmt = $conn->prepare("SELECT JSON_ARRAYAGG(SCHEMA_NAME) as json FROM INFORMATION_SCHEMA.SCHEMATA WHERE SCHEMA_NAME = ?");
    $n = 1;
    $stmt->bind_param("s",  $json); // "s" means that $json is bound as a string
    $stmt->execute();
    $stmt->bind_result($out_json);
    while ($stmt->fetch()) {
      echo $out_json;
      break;
    }
} else {
    $sql = "SELECT JSON_ARRAYAGG(SCHEMA_NAME) as json FROM INFORMATION_SCHEMA.SCHEMATA";
    $result = $conn->query($sql);
    if ($result->num_rows > 0) {
        while($row = $result->fetch_assoc()) {
            echo $row["json"];
    	break;
        }
    } else {
        echo "{}";
    }
}
$conn->close();
?>
