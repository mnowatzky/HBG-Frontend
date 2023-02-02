<!DOCTYPE html>
<html>
<head>
    <title>HBG Sticker</title>

    <link rel="apple-touch-icon" sizes="57x57" href="/bilder/favicon/apple-icon-57x57.png">
    <link rel="apple-touch-icon" sizes="60x60" href="/bilder/favicon/apple-icon-60x60.png">
    <link rel="apple-touch-icon" sizes="72x72" href="/bilder/favicon/apple-icon-72x72.png">
    <link rel="apple-touch-icon" sizes="76x76" href="/bilder/favicon/apple-icon-76x76.png">
    <link rel="apple-touch-icon" sizes="114x114" href="/bilder/favicon/apple-icon-114x114.png">
    <link rel="apple-touch-icon" sizes="120x120" href="/bilder/favicon/apple-icon-120x120.png">
    <link rel="apple-touch-icon" sizes="144x144" href="/bilder/favicon/apple-icon-144x144.png">
    <link rel="apple-touch-icon" sizes="152x152" href="/bilder/favicon/apple-icon-152x152.png">
    <link rel="apple-touch-icon" sizes="180x180" href="/bilder/favicon/apple-icon-180x180.png">
    <link rel="icon" type="image/png" sizes="192x192"  href="/bilder/favicon/android-icon-192x192.png">
    <link rel="icon" type="image/png" sizes="32x32" href="/bilder/favicon/favicon-32x32.png">
    <link rel="icon" type="image/png" sizes="96x96" href="/bilder/favicon/favicon-96x96.png">
    <link rel="icon" type="image/png" sizes="16x16" href="/bilder/favicon/favicon-16x16.png">
    <link href="css/duDialog.min.css" rel="stylesheet">
    <link rel="stylesheet" href="css/main.css">


    <meta name="msapplication-TileColor" content="#ffffff">
    <meta name="msapplication-TileImage" content="/ms-icon-144x144.png">
    <meta name="theme-color" content="#ffffff">
    
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    
    <script src="js/duDialog.min.js"></script>
    <script src="https://ajax.googleapis.com/ajax/libs/jquery/3.3.1/jquery.min.js"></script>

    <script>
        function showLoading() {
            document.getElementById('loader').style.display = 'block';
            document.getElementById("submit").disabled = true;
            document.getElementById("content").style.filter = 'blur(5px)';
        }

        function hideLoading() {
            document.getElementById('loader').style.display = 'none';
            document.getElementById("submit").disabled = false;
            document.getElementById("content").style.filter = 'none';
        }

        function getLocation() {
            const name = document.getElementById("name").value;

            //check if name is empty
            if (!name.trim()) {
                new duDialog('Fehler', 'Bitte gib einen Namen ein!');
            } else if (name.length > 30) {
            	new duDialog('Fehler', 'Der Name ist zu lang!');
            } else if (!navigator.onLine) {
            	new duDialog('Fehler', 'Du bist nicht online!');
            }
            else {
                //get location
                if (navigator.geolocation) {
                    showLoading();
                    const locationOptions = {maximumAge:600000, timeout:5000, enableHighAccuracy: true};
                    navigator.geolocation.getCurrentPosition(savePosition,errorCallback_high_accuracy,locationOptions);
                } else {
                    new duDialog('Fehler', 'Standort kann nicht ermittelt werden');
                }
            }
        }

        function errorCallback_high_accuracy(error) {
            new duDialog('Fehler', 'Hohe Standortgenauigkeit fehlgeschlagen');
        }

        const reverseGeocode = async (lat, long) => {
            const url = 'https://nominatim.openstreetmap.org/reverse?format=json&email=malte.now@gmx.de&zoom=10&lat=' + lat + '&lon=' + long;
            const response = await fetch(url);
            const myJson = await response.json(); //extract JSON from the http response
            let city = myJson.address.city;
            if (city === undefined) {
                if (myJson.address.town === undefined) {
                    if (myJson.address.village === undefined) {
                        if (myJson.address.municipality === undefined) {
                            if (myJson.address.region === undefined) {
                                if (myJson.address.county === undefined) {
                                    city = myJson.address.state;
                                } else {
                                    city = myJson.address.county;
                                }
                            } else {
                                city = myJson.address.region;
                            }
                        } else {
                            city = myJson.address.municipality;
                        }
                    } else {
                        city = myJson.address.village;
                    }
                } else {
                    city = myJson.address.town;
                }
            } else {
                city = myJson.address.city;
            }
            let state = myJson.address.state;
            if (state === undefined) {
                if (myJson.address.state_district === undefined) {
                    state = myJson.address.county;
                } else {
                    state = myJson.address.state_district;
                }
            }

            return {city: city, state: state, country:myJson.address.country};
        }

        function savePosition(position) {
            //save lat, long and name into variables
            const lat = position.coords.latitude;
            const long = position.coords.longitude;
            const name = $('#name').val();
            //asynchronously get city, state and country from coords and save into database
            reverseGeocode(lat, long).then(function (address) {
                //insert variables into database
                $.ajax({
                    url:'insert.php',
                    method:'POST',
                    data:{
                        lat:lat,
                        long:long,
                        name:name,
                        city:address.city,
                        state:address.state,
                        country:address.country
                    },
                    //feedback
                    success:function(data){
                        hideLoading();
                        if (data == "Sticker gespeichert") {
                            new duDialog('Fertig', data);
                        } else {
                            new duDialog('Fehler', data);
                        }

                    }
                });
            });
        }

    </script>
</head>
<body>

    <div id="content">
        <img src="bilder/Sticker_header.svg" class="logo" alt="HBG Logo"><br>
        <div id="divider"></div>
        <input type="text" id="name" name="name" placeholder="Name (max. 30 Zeichen)" class="name"><br>
        <label for="name" style="margin: 10px">Mehrere Namen mit "&" trennen</label>
        <br>
        <span>
            <button onclick="getLocation()" class="button" id="submit"><p>Sticker speichern</p></button>
            <a href="/karte"><button class="button"><p class="buttontext">Karte</p></button></a>
            <a href="/stats"><button class="button"><p class="buttontext">Statistik</p></button></a>
        </span>
    </div>
    <div id="loader" style="display: none"></div>

</body>
</html>