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
      $account = new Account($app->db, $request->email, $request->password);
     $validation = $account->validate();

       if ($validation) {
         if($account->genToken()){
          $response = array("success" => true, "msg" => "Account found", "token" => $account->getToken());
         }
       } else {
         $response = array("success" => false, "msg" => "Failed to login");
       }
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

$app->post('/panel',function() use ($app){
  $body = $app->request->getBody();
  $request = json_decode($body);

$course = new Course($app->db,$request->token);
$uid = $course->userId();

//courses
$resultCourses = pg_query($app->db, "SELECT id,name FROM course WHERE instructor_id='$uid' ");
 if($resultCourses){
   $courses = pg_fetch_all($resultCourses);
 }else{
   echo "empty";
 }

// //material
  $resultMaterial = pg_query($app->db, "SELECT * FROM material");
  if($resultMaterial){
    $material = pg_fetch_all($resultMaterial);
  }
  else{
    echo "empty";
  }

  $datas = array(
      "course" => $courses,
      "materials" => $material,
  );

  echo json_encode($datas);

});

$app->post('/addcourse', function () use ($app) {
  $body = $app->request->getBody();
  $request = json_decode($body);

  $tokenKey = $request->tok->token;

  if($app->db){
    $course = new Course($app->db, $tokenKey);

    echo $course->addCourse($request->courseN);
  }
  else{
    throw Exception("Something went wrong");
  }

});

$app->post('/deletecourse', function () use ($app) {
  $body = $app->request->getBody();
  $request = json_decode($body);

  $course = new Course($app->db, $request->tok);

  if($course->deletecourse($request->link)){
    echo json_encode(array("sucess" => true, "msg" => "course deleted"));
  }
  else{
    echo json_encode(array("sucess" => false, "msg" => "Error"));
  }

});


$app->post('/uploadfile', function () use ($app) {
  $body = $app->request->getBody();
  $request = json_decode($body);

  // print_r($_FILES);
  //
  // if(!empty($_FILES)){
  //
  //     //check if the instructor has a folder
  //     //print_r($_FILES);
  //
  //     //echo json_encode($_FILES);
  //
  //     $tempPath = $_FILES['file']['tmp_name'];
  //
  //     $uploadPath = "../slides/".$_FILES['file']['name'];
  //
  //     if(move_uploaded_file($tempPath, $uploadPath)){
  //         echo "L";
  //
  //     }
  //     else{
  //         echo "Failed to upload!";
  //     }
  // }
  // else{
  //     echo "Error occured";
  // }


});

$app->post('/addmaterial', function () use ($app) {
  $body = $app->request->getBody();
  $request = json_decode($body);

   $pid = $request->pid;
   $uid = $request->pid.uniqid()."*^!".uniqid();
   $path = "slides/".$request->fileName;
   $token = $request->userToken;
   $filename = $request->fileName;

try{
  pg_prepare($app->db, "add_material", "INSERT INTO material (filepath,filename,cui,cid,pagenumber) VALUES ($1,$2, $3, $4,$5)");
  $result = pg_execute($app->db, "add_material", array($path,$filename,$uid,$pid,0));

  //
    if($result){
      echo "done";
    }
    else{
      echo "failed";
    }

}catch(Exception $e){
  echo $e->getMessage();
}

});


$app->post('/deletematerial', function () use ($app) {
  $body = $app->request->getBody();
  $request = json_decode($body);

  echo "delete material";

});


$app->post('/viewer', function () use ($app) {
  $body = $app->request->getBody();
  $request = json_decode($body);

  pg_prepare($app->db, "viewer_q", "SELECT filepath,filename FROM material WHERE cui=$1");
  $result = pg_execute($app->db, "viewer_q", array($request->id));

  if($result){
    $row = pg_fetch_all($result);
    echo json_encode($row);
  }
  else{
    throw ErrorException("something went wrong");
  }


});



$app->run();
