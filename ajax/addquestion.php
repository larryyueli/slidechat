<?php
date_default_timezone_set('America/New_York');
include("db.php");

$data = json_decode(file_get_contents("php://input"));

$date = date("F j, Y, g:i a");

$query = "INSERT INTO questions (qid,question,writer,date) VALUES (:qid, :question, :name, :date)";
$info = $db->prepare($query);
$info->bindParam(":qid", $data->tok);
$info->bindParam(":name", $data->name);
$info->bindParam(":question", $data->comment);
$info->bindParam(":date", $date);
$info->execute();

echo $data->name;


?>