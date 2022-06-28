<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <title>Reverse Geocode</title>
    <script src="https://ajax.googleapis.com/ajax/libs/jquery/3.3.1/jquery.min.js"></script>
    <?php
    $conn = getConn();

    $query = 'SELECT * FROM locations WHERE country IS NULL OR country = " "';
    $result = mysqli_query($conn, $query) or die(mysqli_error($conn));
    $resultarr = mysqli_fetch_all($result, MYSQLI_ASSOC);
    ?>
</head>
<body>
<script>
    const timeout = 1500;
    function getStickers() {

        const stickers = [
            <?php
            reset($resultarr);
            while ($row = current($resultarr)) {
                next($resultarr);
                echo "{'id': " . $row['id'] . ", 'name': '" . $row['name'] . "', 'lat': " . $row['latitude'] . ", 'long': " . $row['longitude'] . "},";
            }
            ?>
        ];
        return stickers;

    }
    const reverseGeocode = async (lat, long) => {
        const url = 'https://nominatim.openstreetmap.org/reverse?format=jsonv2&email=malte.now@gmx.de&zoom=14&lat=' + lat + '&lon=' + long;
        const response = await fetch(url);
        const myJson = await response.json(); //extract JSON from the http response
        let city;
        if (myJson.address.city === undefined) {
            if (myJson.address.town === undefined) {
                if (myJson.address.village === undefined) {
                    city = myJson.address.state;
                } else {
                    city = myJson.address.village;
                }
            } else {
                city = myJson.address.town;
            }
        } else {
            city = myJson.address.city;

        }
        return {city: city, state:myJson.address.state, country:myJson.address.country};

    }
    const stickers = getStickers();
    if (stickers.length === 0) {
        console.log("all stickers are updated");
    }
    for (const idx in stickers) {
        reverseGeocode(stickers[idx].lat, stickers[idx].long).then(function (address) {
            //insert variables into database
            $.ajax({
                url:'update.php',
                method:'POST',
                data:{
                    id:stickers[idx].id,
                    city:address.city,
                    state:address.state,
                    country:address.country
                },
                //feedback
                success:function(data){
                    if (data === "Werte aktualisiert") {
                        console.log("Sticker " + stickers[idx].id + " updated.");
                    } else {
                        console.log(data);
                    }
                }
            });
        });
    }

</script>
</body>
</html>