<?php

date_default_timezone_set('America/Toronto');
// enter database credentials here

try{
$dbconn = pg_connect("host={PUT HOST HERE} port=5432 dbname=slidechat user={PUT USERNAME HERE} password={PUT PASSWORD HERE}");
}
catch(Exception $e){
  echo $e->getMessage();
}
