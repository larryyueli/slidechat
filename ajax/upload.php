<?php

include("db.php");

print_r($_FILES);

if(!empty($_FILES)){
    
    //check if the instructor has a folder
    //print_r($_FILES);
   
    //echo json_encode($_FILES);
    
    $tempPath = $_FILES['file']['tmp_name'];
    
    $uploadPath = "../slides/".$_FILES['file']['name'];
   
    if(move_uploaded_file($tempPath, $uploadPath)){
        echo "L";
        
    }
    else{
        echo "Failed to upload!";
    }
}
else{
    echo "Error occured";
}



?>