<?php

date_default_timezone_set('America/Toronto');
// enter database credentials here
$dbconn = pg_connect("dbname={PUT DATABASE NAME HERE} user={PUT USER NAME HERE} password={PUT PASSWORD HERE}");
