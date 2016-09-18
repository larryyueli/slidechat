<?php
require("db.php");

$id = $_GET['id'];

// cui = content unquie id

$stm = $db->prepare("SELECT filepath,filename FROM material WHERE cui=:id");
$stm->bindParam(':id',$id);
$stm->execute();

$result = $stm->fetchAll(PDO::FETCH_ASSOC);
if(count($result) > 0){
    echo json_encode($result);
}
header("HTTP/1.0 404 Not Found");
exit();
?>