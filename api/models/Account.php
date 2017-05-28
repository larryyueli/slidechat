<?php

class Account
{

    private $db;
    private $user;
    private $password;
    private $token;



    function __construct($dbinstance)
    {
        $db = $dbinstance;
    }

    function saltGenerator($password){
        return hash('sha512', $password);
    }

    function login($username, $password){
        return $this->saltGenerator($password);
    }

}