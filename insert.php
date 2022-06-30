<?php
include 'db_conn.php';
$conn = getConn();

if ($conn->connect_error) {
    die('Connect Error (' . $conn->connect_errno . ') '
        . $conn->connect_error);
}

(string)$lat = $_POST['lat'];
(string)$long = $_POST['long'];
$name = $conn->real_escape_string($_POST['name']);
$city = $conn->real_escape_string($_POST['city']);
$state = $conn->real_escape_string($_POST['state']);
$country = $conn->real_escape_string($_POST['country']);
$name = trim($name);

$sql = "INSERT INTO locations (latitude, longitude, name, city, state, country) 
                       VALUES ('$lat', '$long', '$name', '$city', '$state', '$country')";

if ($conn->query($sql) === TRUE) {
    echo "Sticker gespeichert";
} else {
    echo "Error: " . $sql . "<br>" . $conn->error;
}

$conn->close();
?>