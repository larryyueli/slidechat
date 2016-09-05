<?php

include("db.php");

$data = json_decode(file_get_contents("php://input"));

$token = $data->token;
$db->query("UPDATE accounts SET token='' WHERE token=$token");
echo "success";


?>