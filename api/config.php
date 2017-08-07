<?php

date_default_timezone_set('America/Toronto');
// enter database credentials here
try {
    $dbconn = pg_connect('host=localhost port=5432 dbname=slidechat user=arjundhiman password=123456');
} catch (Exception $e) {
    echo $e->getMessage();
}
