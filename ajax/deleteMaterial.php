<?php
include("db.php");
$data = json_encode(file_get_contents("php://input"));
$sth = $db->query("DELETE FROM material WHERE id = {$data}");
echo true;
?>