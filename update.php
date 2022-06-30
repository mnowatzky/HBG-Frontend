<?php
include 'db_conn.php';
$conn = getConn();

if ($conn->connect_error) {
    die('Connect Error (' . $conn->connect_errno . ') '
        . $conn->connect_error);
}

$id = $_POST['id'];
$city = $conn->real_escape_string($_POST['city']);
$state = $conn->real_escape_string($_POST['state']);
$country = $conn->real_escape_string($_POST['country']);

$sql = "UPDATE locations SET city = '$city', state = '$state', country = '$country' WHERE id = $id";

if ($conn->query($sql) === TRUE) {
    echo "Werte aktualisiert";
} else {
    echo "Error: " . $sql . "<br>" . $conn->error;
}

$conn->close();
?>