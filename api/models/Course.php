<?php

class Course
{

    private $db;
    private $token;

    function __construct($dbinstance, $token)
    {
        $this->db = $dbinstance;
        $this->token = $token;
    }


        function userId(){
          pg_prepare($this->db, "get_id", "SELECT * FROM accounts WHERE token = $1");
          $result = pg_execute($this->db,"get_id", array($this->token));

          if($result){
            $row = pg_fetch_array($result);
            return $row['id'];
          }
          else{
            throw ErrorException("Something went wrong");
          }
        }


    function addCourse($courseName){

try{
      pg_prepare($this->db, "add_course", 'INSERT INTO course(name, instructor_id) VALUES($1,$2)');

    $result = pg_execute($this->db, "add_course", array($courseName,$this->userId()));

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

    function deleteCourse($id){
      pg_prepare($this->db, "delete_course", "DELETE FROM course WHERE id = $1");
      $result = pg_execute($this->db, "delete_course", array($id));
      if($result){
        return true;
      }
      else{
        return false;
      }
    }

    function updateCourse(){

    }

}
