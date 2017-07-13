<?php
	include('db.php');
	$data = json_decode(file_get_contents("php://input"));
	$token = $data->token;

	$check = $db->query("SELECT token FROM accounts WHERE token=$token");
	$check = $check->fetchAll();

	if (count($check) == 1){
		echo "authorized";
	} else {
		echo "unauthorized";
	}

?>
