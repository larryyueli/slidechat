<?php
require("db.php");

$id = $_GET['id'];


$stm = $db->prepare("SELECT * FROM course WHERE id=:id");
$stm->bindParam(':id',$id);
$stm->execute();

$result = $stm->fetchAll();
echo json_encode($result);

?>