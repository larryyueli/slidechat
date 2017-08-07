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

$app->post('/checktoken', function () use ($app) {
  $body = $app->request->getBody();
  $request = json_decode($body);

  $token = $request->token->token;

  pg_prepare($app->db, 'checkTok', 'SELECT token FROM accounts WHERE token = $1');
  $result = pg_execute($app->db, 'checkTok', array($token));

  if ($result) {
      echo 'authorized';
  } else {
      echo 'unauthorized';
  }

});

$app->post('/login', function () use ($app) {
  $body = $app->request->getBody();
  $request = json_decode($body);

  if ($request == null) { // if json_decode returned null, it was not able to decode input string
      $response = array('success' => false, 'msg' => 'Request body not valid JSON.');
  } else {
      $account = new Account($app->db, $request->email, $request->password);
      $validation = $account->validate();

      if ($validation) {
          if ($account->genToken()) {
              $response = array('success' => true, 'msg' => 'Account found', 'token' => $account->getToken());
          }
      } else {
          $response = array('success' => false, 'msg' => 'Failed to login');
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
  }

  echo json_encode($response);
});

$app->post('/panel', function () use ($app) {
  $body = $app->request->getBody();
  $request = json_decode($body);

$course = new Course($app->db, $request->token);
$uid = $course->userId();

//courses
$resultCourses = pg_query($app->db, "SELECT id,name FROM course WHERE instructor_id='$uid' ");
 if ($resultCourses) {
     $courses = pg_fetch_all($resultCourses);
 } else {
     echo 'empty';
 }

// //material
  $resultMaterial = pg_query($app->db, 'SELECT * FROM material');
  if ($resultMaterial) {
      $material = pg_fetch_all($resultMaterial);
  } else {
      echo 'empty';
  }

  $datas = array(
      'course' => $courses,
      'materials' => $material,
  );

  echo json_encode($datas);

});

$app->post('/addcourse', function () use ($app) {
  $body = $app->request->getBody();
  $request = json_decode($body);

  $tokenKey = $request->tok->token;

  if ($app->db) {
      $course = new Course($app->db, $tokenKey);

      echo $course->addCourse($request->courseN);
  } else {
      throw Exception('Something went wrong');
  }

});

$app->post('/deletecourse', function () use ($app) {
  $body = $app->request->getBody();
  $request = json_decode($body);

  $course = new Course($app->db, $request->tok);

  if ($course->deletecourse($request->link)) {
      echo json_encode(array('sucess' => true, 'msg' => 'course deleted'));
  } else {
      echo json_encode(array('sucess' => false, 'msg' => 'Error'));
  }

});

$app->post('/uploadfile', function () use ($app) {
  $body = $app->request->getBody();
  $request = json_decode($body);

try {
    if (!empty($_FILES)) {
        echo 'filed exists';

        $tempPath = $_FILES['file']['tmp_name'];
        $uploadPath = '../slides/'.$_FILES['file']['name'];

        if (move_uploaded_file($tempPath, $uploadPath)) {
            echo 'L';
        } else {
            echo 'Failed to upload!';
        }
    } else {
        echo 'Error occured';
    }
} catch (Exception $e) {
    echo $e->getMessage();
}

});

$app->post('/addmaterial', function () use ($app) {
  $body = $app->request->getBody();
  $request = json_decode($body);

   $pid = $request->pid;
   $uid = $request->pid.uniqid().'*^!'.uniqid();
   $path = 'slides/'.$request->fileName;
   $token = $request->userToken;
   $filename = $request->fileName;

try {
    pg_prepare($app->db, 'add_material', 'INSERT INTO material (filepath,filename,cui,cid,pagenumber) VALUES ($1,$2, $3, $4,$5)');
    $result = pg_execute($app->db, 'add_material', array($path, $filename, $uid, $pid, 0));

    if ($result) {
        echo 'done';
    } else {
        echo 'failed';
    }
} catch (Exception $e) {
    echo $e->getMessage();
}

});

$app->post('/deletematerial', function () use ($app) {
  $body = $app->request->getBody();
  $request = json_decode($body);

  pg_prepare($app->db, 'delete_id', 'DELETE FROM material WHERE id = $1');
  $result = pg_execute($app->db, 'delete_id', array($request->did));

  if ($result) {
      echo json_encode(array('sucess' => true, 'msg' => 'item deleted'));
  } else {
      echo json_encode(array('sucess' => false, 'msg' => 'something went wrong'));
  }

});

$app->post('/viewer', function () use ($app) {
  $body = $app->request->getBody();
  $request = json_decode($body);

  pg_prepare($app->db, 'viewer_q', 'SELECT filepath,filename FROM material WHERE cui=$1');
  $result = pg_execute($app->db, 'viewer_q', array($request->id));

  if ($result) {
      $row = pg_fetch_all($result);
      echo json_encode($row);
  } else {
      throw ErrorException('something went wrong');
  }

});

$app->post('/addquestion', function () use ($app) {
  $body = $app->request->getBody();
  $request = json_decode($body);

  var_dump($request);

$date = date('F j, Y, g:i a');

try {
    pg_prepare($app->db, 'pans', 'INSERT INTO questions (uid,question,writer,date,pagenumber) VALUES ($1, $2, $3, $4, $5)');
    $result = pg_execute($app->db, 'pans', array($request->tok, $request->question, $request->name, $date, $request->pagenum));
//
if ($result) {
    echo 'question added';
} else {
    echo 'something went wrong';
}
//
pg_prepare($app->db, 'A', 'SELECT numquestions FROM material WHERE cui=$1');
    $r = pg_execute($app->db, 'A', $request->tok);
//
$get = pg_fetch_all($r);
    $num = intval($get[0]['numquestions']);
//
$newnum = $num + 1;
    pg_prepare($app->db, 'update_nq', 'UPDATE material SET numquestions =$1  WHERE cui = $2');
    $re = pg_execute($app->db, 'update_nq', arrary($newnum, $request->tok));
} catch (Exception $e) {
    echo $e->getMessage();
}

});

$app->post('/getquestions', function () use ($app) {
  $body = $app->request->getBody();
  $request = json_decode($body);

  pg_prepare($app->db, 'quests', 'SELECT id,question,writer,date,uid,numanswers FROM questions WHERE uid=$1 AND pagenumber=$2');
  $result = pg_execute($app->db, 'quests', array($request->id, $request->pagenumber));

  if ($result) {
      $questions = pg_fetch_all($result);
  } else {
      echo 'error';
  }

  if (pg_num_rows($result) > 0) {

    //make a call to db to get answer / question

    pg_prepare($app->db, 'answers', 'SELECT * FROM answers WHERE uid=$1 AND pagenumber=$2');
      $r = pg_execute($app->db, 'answers', array($request->id, $request->pagenumber));

      $ans = pg_fetch_all($r);

      $output = array('questions' => $questions,
                   'answers' => $ans, );

    //Output the json formated material back to client
    echo json_encode($output);
  }
});

$app->post('/addanswer', function () use ($app) {
  $body = $app->request->getBody();
  $request = json_decode($body);

//  var_dump($request);
  $date = date('F j, Y, g:i a');

  try {
      pg_prepare($app->db, 'aq', 'INSERT INTO answers (qid,answer,date,uid,pagenumber) VALUES ($1, $2, $3, $4, $5)');
      $result = pg_execute($app->db, 'aq', array($request->id, $request->answer, $date, $request->unqiueId, $request->slideid));

      if ($result) {
          echo 'good';
      } else {
          echo 'failed';
      }

      pg_prepare($app->db, 'ea', 'SELECT numanswers FROM questions WHERE id=$1');
      $r = pg_execute($app->db, 'ea', array($request->id));
      $get = pg_fetch_all($r);

      $num = intval($get[0]['numanswers']);

      $newnum = $num + 1;
      pg_prepare($app->db, 'da', 'UPDATE questions SET numanswers = $1  WHERE id = $2');
      $ae = pg_execute($app->db, 'da', array($newnum, $request->id));
  } catch (Exception $e) {
      echo $e->getMessage();
  }

});

$app->run();
