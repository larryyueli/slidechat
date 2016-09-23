<?php

include("db.php");

$data = json_decode(file_get_contents("php://input"));

var_dump($data);

$date = date("F j, Y, g:i a");

$query = "INSERT INTO answers (qid,answer,date,uid) VALUES (:qid, :answer, :date, :uid)";
$info = $db->prepare($query);
$info->bindParam(":qid", $data->id);
$info->bindParam(":answer", $data->answer);
$info->bindParam(":uid", $data->unqiueId);
$info->bindParam(":date", $date);
$info->execute();
echo "this script just ran";
?>