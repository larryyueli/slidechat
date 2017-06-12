<?php

date_default_timezone_set('America/Toronto');
// enter database credentials here

try{
$dbconn = pg_connect("host=192.168.2.24 port=5432 dbname=slidechat user=arjun password=slide123");
}
catch(Exception $e){
  echo $e->getMessage();
}
