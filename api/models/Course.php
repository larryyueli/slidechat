<?php

class Course{

  private $db;

  function __construct($dbinstance){
    $this->$db = $dbinstance;
  }

  function addCourse($courseName, $token){
  //  pg_prepare($this->db, "q1", 'SELECT id FROM accounts WHERE token=$1');
    //$result = pg_execute($this->db, "q1", array($this->token));

    //$row = pg_fetch_assoc($result);

    return "AS";

  }


}


 ?>
