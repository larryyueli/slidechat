<?php

include("db.php");

$data = json_decode(file_get_contents("php://input"));

//var_dump($data);

$date = date("F j, Y, g:i a");

$query = "INSERT INTO answers (qid,answer,date,uid) VALUES (:qid, :answer, :date, :uid)";
$info = $db->prepare($query);
$info->bindParam(":qid", $data->id);
$info->bindParam(":answer", $data->answer);
$info->bindParam(":uid", $data->unqiueId);
$info->bindParam(":date", $date);
$info->execute();


$f = "SELECT numanswers FROM questions WHERE id=:qid";
$in = $db->prepare($f);
$in->bindParam(":qid", $data->id);
$in->execute();

$get = $in->fetchAll(PDO::FETCH_ASSOC);
$num = intval($get[0]['numanswers']);


$fa =  "UPDATE questions SET numanswers =:noa  WHERE id = :q";

$i = $db->prepare($fa);

$newnum = $num + 1;

$i->bindParam(":noa", $newnum);

$i->bindParam(":q", $data->id);
$i->execute();

?>