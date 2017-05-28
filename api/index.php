<?php

require 'vendor/slim/slim/Slim/Slim.php';
require_once 'models/Account.php';
require_once 'models/Course.php';
require_once 'models/Material.php';
require_once 'models/Viewer.php';
require_once 'config.php';
\Slim\Slim::registerAutoloader();

$app = new \Slim\Slim();

$app->db = $dbconn;

$app->post('/login', function () use ($app) {
  $body = $app->request->getBody();
  $request = json_decode($body);

  if ($request == null) { // if json_decode returned null, it was not able to decode input string
      $response = array('success' => false, 'msg' => 'Request body not valid JSON.');
  } else {
      $response = array('success' => true);
      // $account = new Account($app->db);
      // $account->populate($request);
      // $validation = $account->validate();
      //
      // if ($validation != "OK") {
      //     $response = array("success" => false, "msg" => $validation);
      // } else {
      //     if (!$account->exists()) {
      //         if ($account->insert()) {
      //             $response = array("success" => true, "token" => $account->token, "msg" => "OK");
      //         } else {
      //             $response = array("success" => false, "msg" => "Unable to communicate with database, please try again later.");
      //         }
      //     } else {
      //         $response = array("success" => false, "msg" => "Account with this email already exists.");
      //     }
      // }
  }

  echo json_encode($response);
});


$app->post('/register', function () use ($app) {
  $body = $app->request->getBody();
  $request = json_decode($body);

  if ($request == null) { // if json_decode returned null, it was not able to decode input string
      $response = array('success' => false, 'msg' => 'Request body not valid JSON.');
  } else {
      $response = array('success' => true);
      // $account = new Account($app->db);
      // $account->populate($request);
      // $validation = $account->validate();
      //
      // if ($validation != "OK") {
      //     $response = array("success" => false, "msg" => $validation);
      // } else {
      //     if (!$account->exists()) {
      //         if ($account->insert()) {
      //             $response = array("success" => true, "token" => $account->token, "msg" => "OK");
      //         } else {
      //             $response = array("success" => false, "msg" => "Unable to communicate with database, please try again later.");
      //         }
      //     } else {
      //         $response = array("success" => false, "msg" => "Account with this email already exists.");
      //     }
      // }
  }

  echo json_encode($response);
});



$app->post('/logout', function () use ($app) {
  $body = $app->request->getBody();
  $request = json_decode($body);

  if ($request == null) { // if json_decode returned null, it was not able to decode input string
      $response = array('success' => false, 'msg' => 'Request body not valid JSON.');
  } else {
      $response = array('success' => true);
      // $account = new Account($app->db);
      // $account->populate($request);
      // $validation = $account->validate();
      //
      // if ($validation != "OK") {
      //     $response = array("success" => false, "msg" => $validation);
      // } else {
      //     if (!$account->exists()) {
      //         if ($account->insert()) {
      //             $response = array("success" => true, "token" => $account->token, "msg" => "OK");
      //         } else {
      //             $response = array("success" => false, "msg" => "Unable to communicate with database, please try again later.");
      //         }
      //     } else {
      //         $response = array("success" => false, "msg" => "Account with this email already exists.");
      //     }
      // }
  }

  echo json_encode($response);
});



$app->run();
