<?php

include("db.php");


$data = json_decode(file_get_contents("php://input"));


$query = "SELECT accounttype FROM accounts WHERE token=:tok";
$a = $db->prepare($query);
$a->bindParam(":tok", $data);
$a->execute();


$get = $a->fetchAll(PDO::FETCH_ASSOC);
if(intval($get[0]['accounttype']) == 1){
    echo 1;
}
else{
echo 0;
}
?>