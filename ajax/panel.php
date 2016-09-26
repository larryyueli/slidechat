<?php 
    include("db.php");
    $token = json_decode(file_get_contents("php://input"));

    
    $stuff = $db->query("SELECT id FROM accounts WHERE token='$token'");
    $stuff = $stuff->fetchAll();

    $iid = $stuff[0][0];

	if (count($stuff) == 1){
     
        $Info = $db->query("SELECT id,name FROM course WHERE instructor_id='$iid'");
        
      $Info = $Info->fetchAll(PDO::FETCH_ASSOC);
    
       
       
        if(count($Info) == 0){
            echo "empty";
        }
        else{
            
            //get material info
            $mat = $db->query("SELECT * FROM material");
            $mat = $mat->fetchAll(PDO::FETCH_ASSOC);
            
     
         
            if(count($mat) == 0){
               // echo "empty";
            }
            
                $datas = array(
                    "course" => $Info,
                    "materials" => $mat,
                  
                );
          
 
    echo json_encode($datas);
           
        }
	} else {
	echo "ERROR";
	}


?>