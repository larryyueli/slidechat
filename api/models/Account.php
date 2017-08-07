<?php

class Account
{
    private $db;
    private $email;
    private $password;
    private $token;

    public function __construct($dbinstance, $email, $pass)
    {
        $this->db = $dbinstance;
        $this->email = $email;
        $this->password = $pass;
    }

    public function getEmail()
    {
        return $this->email;
    }

    public function saltGenerator($password)
    {
        return hash('sha1', $password);
    }

    public function validate()
    {
        //check if account is in db
      pg_prepare($this->db, 'check_for_account', 'SELECT email FROM accounts WHERE email=$1 and password=$2');
        $result = pg_execute($this->db, 'check_for_account', array($this->email, $this->saltGenerator($this->password)));

        if ($result) {
            //if account exists
        $row = pg_fetch_assoc($result);
            if ($row['email'] == $this->email) {
                return true;
            } else {
                return false;
            }
        } else {
            //if account is does not
        return false;
        }
    }

    public function getToken()
    {
        return $this->token;
    }

    public function genToken()
    {
        //This means that the user is logged in and let's givem a token :D :D :D
        $newToken = $this->email.' | '.uniqid().uniqid().uniqid();

        pg_prepare($this->db, 'new_tok', 'UPDATE accounts SET token = $1 WHERE email= $2');
        $result = pg_execute($this->db, 'new_tok', array($newToken, $this->email));

        if ($result) {
            $this->token = $newToken;

            return true;
        } else {
            return false;
        }
    }

    public function login($username, $password)
    {
        return $this->saltGenerator($password);
    }

    public function checkToken($token)
    {
    }
}
