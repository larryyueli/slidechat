<?php

include("db.php");

$data = json_decode(file_get_contents("php://input"));

$token = $data->userToken;
$filename = $data->fileName;

$userstuff = $db->query("SELECT id FROM accounts WHERE token={$token}");
$row = $userstuff->fetchAll(PDO::FETCH_ASSOC);

$id = $row[0]['id'];

$s = $db->query("SELECT id FROM course WHERE instructor_id={$id}");
$rowd = $s->fetchAll(PDO::FETCH_ASSOC);

$cid = $rowd[0]['id'];


if(count($userstuff) == 1){
    
    $uid = $pt.uniqid()."*^!".uniqid();
    
    $path = "../slides/".$filename;
    
    //echo $pdflink;
    $updateDataBase = "INSERT INTO material (filepath,filename,cui,cid) VALUES (:path,:fname, :uid, :id)";
    $stmt = $db->prepare($updateDataBase);

    $stmt->bindParam(":path", $path);
    $stmt->bindParam(":uid", $uid);
    $stmt->bindParam(":id", $cid);
    $stmt->bindParam(":fname", $filename);
    
    $stmt->execute();
    
}
else{
    echo "error";
}
?>