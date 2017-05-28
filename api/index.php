<?php
require 'vendor/slim/slim/Slim/Slim.php';
require_once('models/Account.php');
//require_once('models/Listing.php');
//require_once ('models/Profile.php');
require_once('config.php');
\Slim\Slim::registerAutoloader();

$app = new \Slim\Slim();

$app->db = $dbconn;

$app->post("/login", function () use ($app) {

    //$body = $app->request->getBody();

   // $request = json_decode($body);

    echo json_encode(array("HI"));

});

$app->run();