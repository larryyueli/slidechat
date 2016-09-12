<?php
include("db.php");
$data = json_encode(file_get_contents("php://input"));
$sth = $db->query("DELETE FROM course WHERE id = {$data}");
?>