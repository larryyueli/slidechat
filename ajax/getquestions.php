<?php
require("db.php");

$id = $_GET['id'];

$count = 0;
// cui = content unquie id

$stm = $db->prepare("SELECT id,question,writer,date,qid FROM questions WHERE qid=:id");
$stm->bindParam(':id',$id);
$stm->execute();

$result = $stm->fetchAll(PDO::FETCH_ASSOC);
if(count($result) > 0){
    echo json_encode($result);
}
header("HTTP/1.0 404 Not Found");
exit();
?>