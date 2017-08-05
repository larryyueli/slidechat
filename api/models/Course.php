<?php

class Course
{

    private $db;

    function __construct($dbinstance)
    {
        $this->db = $dbinstance;
    }

    function addCourse($courseName, $token){

try{
      pg_prepare($this->db, "add_course", 'INSERT INTO course(name, instructor_token) VALUES($1,$2)');

    $result = pg_execute($this->db, "add_course", array($courseName,$token));

       if($result){
         return true;
       }
       else{
         return false;
       }
     }
     catch(Exception $e){
       echo $e->getMessage();
     }
    }

    function deleteCourse(){

    }

    function updateCourse(){

    }

}
