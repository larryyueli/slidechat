<?php
date_default_timezone_set('America/New_York');
include("db.php");

$data = json_decode(file_get_contents("php://input"));


$date = date("F j, Y, g:i a");

$query = "INSERT INTO questions (uid,question,writer,date) VALUES (:qid, :question, :name, :date, :pagenum)";
$info = $db->prepare($query);
$info->bindParam(":qid", $data->tok);
$info->bindParam(":name", $data->name);
$info->bindParam(":question", $data->question);
$info->bindParam(":date", $date);
$info->bindParam(":pagenum", )
$info->execute();

$f = "SELECT numquestions FROM material WHERE cui=:qid";
$in = $db->prepare($f);
$in->bindParam(":qid", $data->tok);
$in->execute();

$get = $in->fetchAll(PDO::FETCH_ASSOC);
$num = intval($get[0]['numquestions']);


$fa =  "UPDATE material SET numquestions =:noa  WHERE cui = :q";

$i = $db->prepare($fa);

$newnum = $num + 1;

$i->bindParam(":noa", $newnum);

$i->bindParam(":q", $data->tok);
$i->execute();


?>