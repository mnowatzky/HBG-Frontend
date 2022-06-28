<?php
/**
 * reads credentials from file and returns mysqli connection
 * @return mysqli connection
 */
function getConn()
{
    $credentials = explode(",", file_get_contents('../credentials.txt'));
    $hostname = $credentials[0];
    $username = $credentials[1];
    $pw = $credentials[2];
    $db = $credentials[3];

    $conn = new mysqli($hostname, $username, $pw, $db);
    return $conn;
}
?>