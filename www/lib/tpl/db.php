<?php 
include (PATH_TO_LIB . '/partial/1.php');
if ($json) {
    $stmt = $conn->prepare("SELECT JSON_ARRAYAGG(SCHEMA_NAME) as json FROM INFORMATION_SCHEMA.SCHEMATA WHERE SCHEMA_NAME = ?");
    $n = 1;
    $stmt->bind_param("s",  $json); // "s" means that $json is bound as a string
    $stmt->execute();
    $stmt->bind_result($out_json);
    while ($stmt->fetch()) {
      echo htmlspecialchars($out_json, ENT_QUOTES | ENT_SUBSTITUTE | ENT_HTML5);
      break;
    }
} else {
    $sql = "SELECT '{\"hello\": \"world\"}' as json;" ; //JSON_ARRAYAGG(SCHEMA_NAME) as json FROM INFORMATION_SCHEMA.SCHEMATA";
    $result = $conn->query($sql);
    if ($result->num_rows > 0) {
        while($row = $result->fetch_assoc()) {
            echo htmlspecialchars($row["json"], ENT_QUOTES | ENT_SUBSTITUTE | ENT_HTML5);
    	break;
        }
    } else {
        echo "{}";
    }
}
include (PATH_TO_LIB . '/partial/2.php');
