<?php

date_default_timezone_set('America/Toronto');
// enter database credentials here
try {
    $dbconn = pg_connect("host='' port='' dbname='' user='' password=''");
} catch (Exception $e) {
    echo $e->getMessage();
}
