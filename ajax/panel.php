<?php 
    include("db.php");
    $token = json_decode(file_get_contents("php://input"));

    $stuff = $db->query("SELECT id FROM accounts WHERE token='$token'");
    $stuff = $stuff->fetchAll();


    $iid = $stuff[0][0];

	if (count($stuff) == 1){
     
        $Info = $db->query("SELECT id,name FROM course WHERE instructor_id='$iid'");
        $Info = $Info->fetch(PDO::FETCH_BOTH);
        
        print_r($Info);
        $appels = $Info;
        echo "Output: ".$apples;

        
        if(count($Info) == 0){
            echo "empty";
        }
        else{
            
            //get material info
            $mat = $db->query("SELECT * FROM material WHERE cid='2'");
            $mat = $mat->fetchAll();
         
            if(count($mat) == 0){
                echo "empty";
            }
            else{
                $export = array_merge($Info,$math);
            }
    echo json_encode($export);   
           
        }
	} else {
	echo "ERROR";
	}

?>