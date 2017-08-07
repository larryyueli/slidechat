<?php

date_default_timezone_set('America/Toronto');
// enter database credentials here
<<<<<<< HEAD

try{
$dbconn = pg_connect("host=localhost port=5432 dbname=slidechat user=arjundhiman password=123456");
}
catch(Exception $e){
  echo $e->getMessage();
=======
try {
    $dbconn = pg_connect("host='' port='' dbname='' user='' password=''");
} catch (Exception $e) {
    echo $e->getMessage();
>>>>>>> 75eba1f602568b75077972947b0a9f25377969f1
}
