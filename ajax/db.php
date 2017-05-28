<?php

try{
//Connect to databse
$db = new PDO('pgsql:host=localhost;dbname=slidechat;port=5432;user=arjundhiman;password=slide123');
}
catch(Exception $e){
    echo "Error occured during connected to database.";
}
?>
