<?php

namespace App\Service;

final class Base {

    public $fqdn = null;
    //public static $fqdn = 'http://localhost/~richard/my_website';
    
    
    public $con;
    
    public $dbNameRussianWords = 'russian_words';

    public function __construct() {
        session_start();
    
        $dbhost = "localhost"; // this will ususally be 'localhost', but can sometimes differ
        $dbname = "my_website"; // the name of the database that you are going to use for this project
        $dbuser = "root"; // the username that you created, or were given, to access your database
        $dbpass = "pl0ske77"; // the password that you created, or were given, to access your database

        $mysqli = mysqli_connect($dbhost, $dbuser, $dbpass) or die("MySQL Error: " . mysqli_error());
        $mysqli->select_db($dbname) or die("MySQL Error: " . mysqli_error());

        $this->con = $mysqli;
        $this->con->set_charset("utf8");
    }
}