<!DOCTYPE html>
<html>
<head>
    <title>Sticker</title>

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


    <meta name="msapplication-TileColor" content="#ffffff">
    <meta name="msapplication-TileImage" content="/ms-icon-144x144.png">
    <meta name="theme-color" content="#ffffff">
    
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    
    <script src="js/duDialog.min.js"></script>
    <script src="https://ajax.googleapis.com/ajax/libs/jquery/3.3.1/jquery.min.js"></script>
    <style type="text/css">
        body {
            font-family: Roboto;
            font-size: 17px;
        }
        .content {
            width: 80%;
            margin-right: auto;
            margin-left: auto;
        }
        .button {
            width: 30%;
            min-height: 4em;
            margin: 20px;
            margin-top: 10px;
/*            padding: 6px 15px;*/
            border: 5px solid #000000;
            background-color: #ffffff;
            color: black;
            cursor: pointer;
        }
        .name {
            width: 80%;
            font-size: 1.2em;
            max-width: 580px;
            margin: 20px;
            margin-bottom: 10px;
        }
        .logo {
            width: 80%;
            margin-left: auto;
            margin-right: auto;
        }
        .buttontext {
            height: 2em;
        }
    </style>
</head>
<body>

    <div id="content">
        <img src="bilder/Logo_final.jpg" class="logo">
        <input type="text" id="name" name="name" placeholder="Name (max. 30 Zeichen)" class="name">
        <label for="name">Mehrere Namen mit "&" trennen</label>
        <br>
        <span>
            <button onclick="getLocation()" class="button" id="submit"><p class="buttontext">Sticker speichern</p></button>
            <a href="/karte"><button class="button"><p class="buttontext">Karte</p></button></a>
            <a href="/stats"><button class="button"><p class="buttontext">Statistik</p></button></a>
        </span>
    </div>
    

    <script>
        // Get the input field
        var input = document.getElementById("name");

        // Execute a function when the user releases a key on the keyboard
        input.addEventListener("keyup", function(event) {
          // Number 13 is the "Enter" key on the keyboard
          if (event.keyCode === 13) {
            // Cancel the default action, if needed
            event.preventDefault();
            // Trigger the button element with a click
            document.getElementById("submit").click();
          }
        });

        function getLocation() {

            var name = document.getElementById("name").value;

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
                    navigator.geolocation.getCurrentPosition(savePosition);
                } else {
                    new duDialog('Fehler', 'Standort kann nicht ermittelt werden');
                }
            }
        }

        const reverseGeocode = async (lat, long) => {
            const url = 'https://nominatim.openstreetmap.org/reverse?format=json&email=malte.now@gmx.de&zoom=14&lat=' + lat + '&lon=' + long;
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

</body>
</html>