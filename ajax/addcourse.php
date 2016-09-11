<?php

include("db.php");

$data = json_decode(file_get_contents("php://input"));

$coursename = $data->courseN;
$token = $data->tok;

$userstuff = $db->query("SELECT id, postingToken FROM accounts WHERE token={$token}");
$row = $userstuff->fetchAll(PDO::FETCH_ASSOC);

$id = $row[0]['id'];
$pt = $row[0]['postingToken'];

if(count($userstuff) == 1){
    
    $urll = $pt.uniqid()."*^!".uniqid();
    
    //echo $pdflink;
    $updateDataBase = "INSERT INTO course (urllink,instructor_id,name) VALUES (:urllink, :id, :coursename)";
    $stmt = $db->prepare($updateDataBase);
    $stmt->bindParam(":urllink", $urll);
    $stmt->bindParam(":id", $id);
    $stmt->bindParam(":coursename", $coursename);
    
    $stmt->execute();
    
}
else{
    echo "error";
}
?>