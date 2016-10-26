<?php

include("db.php");

$data = json_decode(file_get_contents("php://input"));

$coursename = $data->courseN;
$token = $data->tok;

$userstuff = $db->query("SELECT id FROM accounts WHERE token={$token}");
$row = $userstuff->fetchAll(PDO::FETCH_ASSOC);

$id = $row[0]['id'];


if(count($userstuff) == 1){
    
    
    $updateDataBase = "INSERT INTO course (instructor_id,name) VALUES (:id, :coursename)";
    $stmt = $db->prepare($updateDataBase);
    $stmt->bindParam(":id", $id);
    $stmt->bindParam(":coursename", $coursename);
    
    $stmt->execute();
    
}
else{
    echo "error";
}
?>