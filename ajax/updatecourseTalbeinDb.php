<?php

include("db.php");

$data = json_decode(file_get_contents("php://input"));

$coursename = $data->courseName;
$token = $data->userToken;
$filename = $data->fileName;

$userstuff = $db->query("SELECT id, postingToken FROM accounts WHERE token={$token}");
$row = $userstuff->fetchAll(PDO::FETCH_ASSOC);

$id = $row[0]['id'];
$pt = $row[0]['postingToken'];

if(count($userstuff) == 1){
    
    $pdflink = "../slides/".$pt."/".$filename;
    $urll = $pt.uniqid()."*^!".uniqid();
    
    //echo $pdflink;
    $updateDataBase = "INSERT INTO course (pdflink,urllink,instructor_id,name) VALUES (:pdflink, :urllink, :id, :coursename)";
    $stmt = $db->prepare($updateDataBase);
    $stmt->bindParam(":pdflink", $pdflink);
    $stmt->bindParam(":urllink", $urll);
    $stmt->bindParam(":id", $id);
    $stmt->bindParam(":coursename", $coursename);
    
    $stmt->execute();
    
}
else{
    echo "error";
}
?>