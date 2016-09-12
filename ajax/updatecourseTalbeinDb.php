<?php

include("db.php");

$data = json_decode(file_get_contents("php://input"));

$token = $data->userToken;
$id = $data->pid;
$filename = $data->fileName;
    
    $uid = $pt.uniqid()."*^!".uniqid();
    
    $path = "../slides/".$filename;
    
    //echo $pdflink;
    $updateDataBase = "INSERT INTO material (filepath,filename,cui,cid) VALUES (:path,:fname, :uid, :id)";
    $stmt = $db->prepare($updateDataBase);

    $stmt->bindParam(":path", $path);
    $stmt->bindParam(":uid", $uid);
    $stmt->bindParam(":id", $id);
    $stmt->bindParam(":fname", $filename);
    
    $stmt->execute();
    


?>