<?php
require("db.php");

$id = $_GET['id'];
$pagenum = $_GET['pnum'];


$count = 0;
// cui = content unquie id

$stm = $db->prepare("SELECT id,question,writer,date,uid,numanswers FROM questions WHERE uid=:id AND pagenumber=:pnum");
$stm->bindParam(':id',$id);
$stm->bindParam(':pnum',$pagenum);
$stm->execute();

$result = $stm->fetchAll(PDO::FETCH_ASSOC);
if(count($result) > 0){
    $data = array("question" => htmlspecialchars($result[0]['question']),
                  "rest" => $result);
    
    
    //make a call to db to get answer / question
    
    $st2 = $db->prepare("SELECT * FROM answers WHERE uid=:id AND pagenumber=:pnum");
    $st2->bindParam(':id',$id);
    $st2->bindParam(':pnum',$pagenum);
    $st2->execute();
    
    $ans = $st2->fetchAll(PDO::FETCH_ASSOC);
    
    $output = array("questions" =>  $result,
                   "answers" => $ans);
    
    //Output the json formated material back to client
    echo json_encode($output);
    
}
header("HTTP/1.0 404 Not Found");
exit();
?>