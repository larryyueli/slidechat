<?php

try{
//Connect to databse
$db = new PDO('mysql:host=localhost;dbname=slidechat;port=3306', "root", "root");
}
catch(Exception $e){
    echo "Error occured during connected to database.";
}
?>