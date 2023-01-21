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
            font-family: Roboto, sans-serif;
            font-size: 17px;
            margin: 0;
        }

        a:link { text-decoration: none; }
        a:visited { text-decoration: none; }
        a:hover { text-decoration: none; }
        a:active { text-decoration: none; }

       .button {
           align-items: center;
           appearance: none;
           background-color: #fff;
           border-radius: 24px;
           border-style: none;
           box-shadow: rgba(0, 0, 0, .2) 0 3px 5px -1px,rgba(0, 0, 0, .14) 0 6px 10px 0,rgba(0, 0, 0, .12) 0 1px 18px 0;
           box-sizing: border-box;
           color: #3c4043;
           cursor: pointer;
           display: inline-flex;
           fill: currentcolor;
           font-family: "Google Sans",Roboto,Arial,sans-serif;
           font-size: 14px;
           font-weight: 500;
           height: 48px;
           justify-content: center;
           letter-spacing: .25px;
           line-height: normal;
           max-width: 100%;
           overflow: visible;
           padding: 2px 24px;
           position: relative;
           text-align: center;
           text-transform: none;
           transition: box-shadow 280ms cubic-bezier(.4, 0, .2, 1),opacity 15ms linear 30ms,transform 270ms cubic-bezier(0, 0, .2, 1) 0ms;
           user-select: none;
           -webkit-user-select: none;
           touch-action: manipulation;
           width: auto;
           will-change: transform,opacity;
           z-index: 0;
           margin: 10px;
       }

        .button:hover {
            background: #F6F9FE;
            color: #174ea6;
        }

        .button:active {
            box-shadow: 0 4px 4px 0 rgb(60 64 67 / 30%), 0 8px 12px 6px rgb(60 64 67 / 15%);
            outline: none;
        }

        .button:focus {
            outline: none;
            border: 2px solid #4285f4;
        }

        .button:not(:disabled) {
            box-shadow: rgba(60, 64, 67, .3) 0 1px 3px 0, rgba(60, 64, 67, .15) 0 4px 8px 3px;
        }

        .button:not(:disabled):hover {
            box-shadow: rgba(60, 64, 67, .3) 0 2px 3px 0, rgba(60, 64, 67, .15) 0 6px 10px 4px;
        }

        .button:not(:disabled):focus {
            box-shadow: rgba(60, 64, 67, .3) 0 1px 3px 0, rgba(60, 64, 67, .15) 0 4px 8px 3px;
        }

        .button:not(:disabled):active {
            box-shadow: rgba(60, 64, 67, .3) 0 4px 4px 0, rgba(60, 64, 67, .15) 0 8px 12px 6px;
        }

        .button:disabled {
            box-shadow: rgba(60, 64, 67, .3) 0 1px 3px 0, rgba(60, 64, 67, .15) 0 4px 8px 3px;
        }

        .name {
            width: 90%;
            font-size: 1.2em;
            max-width: 800px;
            margin: 20px 10px 10px;
            padding: 0;
        }
        .logo {
            width: 90%;
            max-width: 600px;
            display: block;
            margin-top: 10px;
            margin-left: auto;
            margin-right: auto;
        }

        #divider {
            width: 100%;
            height: 5vh;
            background-image: url("bilder/diagonal_pattern.svg");
            background-repeat: repeat-x;
        }

        #loader {
            position: absolute;
            left: 50%;
            top: 50%;
            border: 16px solid #f3f3f3;
            border-radius: 50%;
            border-top: 16px solid #3498db;
            width: 100px;
            height: 100px;
            -webkit-animation: spin 2s linear infinite; /* Safari */
            animation: spin 2s linear infinite;
        }

        /* Safari */
        @-webkit-keyframes spin {
            0% {
                -webkit-transform-origin: 0 0;
                -webkit-transform: translate(-50%, -50%) rotate(0deg);
            }
            100% {
                -webkit-transform-origin: 0 0;
                -webkit-transform: translate(-50%, -50%) rotate(360deg);
            }
        }

        @keyframes spin {
            0% {
                transform-origin: 0 0;
                transform: rotate(0deg) translate(-50%, -50%);
            }
            100% {
                transform-origin: 0 0;
                transform: rotate(360deg) translate(-50%, -50%);
            }
        }
    </style>
</head>
<body>

    <div id="content" style="filter: none">
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


    <script>
        // Get the input field
        const input = document.getElementById("name");

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

</body>
</html>