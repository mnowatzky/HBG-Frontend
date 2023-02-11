<!DOCTYPE html>
<html>
<head>
    <title>HBG Karte</title>

    <link rel="apple-touch-icon" sizes="57x57" href="/bilder/favicon/apple-icon-57x57.png">
    <link rel="apple-touch-icon" sizes="60x60" href="/bilder/favicon/apple-icon-60x60.png">
    <link rel="apple-touch-icon" sizes="72x72" href="/bilder/favicon/apple-icon-72x72.png">
    <link rel="apple-touch-icon" sizes="76x76" href="/bilder/favicon/apple-icon-76x76.png">
    <link rel="apple-touch-icon" sizes="114x114" href="/bilder/favicon/apple-icon-114x114.png">
    <link rel="apple-touch-icon" sizes="120x120" href="/bilder/favicon/apple-icon-120x120.png">
    <link rel="apple-touch-icon" sizes="144x144" href="/bilder/favicon/apple-icon-144x144.png">
    <link rel="apple-touch-icon" sizes="152x152" href="/bilder/favicon/apple-icon-152x152.png">
    <link rel="apple-touch-icon" sizes="180x180" href="/bilder/favicon/apple-icon-180x180.png">
    <link rel="icon" type="image/png" sizes="192x192" href="/bilder/favicon/android-icon-192x192.png">
    <link rel="icon" type="image/png" sizes="32x32" href="/bilder/favicon/favicon-32x32.png">
    <link rel="icon" type="image/png" sizes="96x96" href="/bilder/favicon/favicon-96x96.png">
    <link rel="icon" type="image/png" sizes="16x16" href="/bilder/favicon/favicon-16x16.png">

    <meta name="msapplication-TileColor" content="#ffffff">
    <meta name="msapplication-TileImage" content="/ms-icon-144x144.png">
    <meta name="theme-color" content="#ffffff">
    <meta name="viewport" content="initial-scale=1,maximum-scale=1,user-scalable=no">

    <script src='https://api.mapbox.com/mapbox-gl-js/v2.12.0/mapbox-gl.js'></script>
    <link href='https://api.mapbox.com/mapbox-gl-js/v2.12.0/mapbox-gl.css' rel='stylesheet' />

    <style>
        body {
            margin: 0;
            padding: 0;
        }

        #map {
            position: absolute;
            top: 0;
            bottom: 0;
            width: 100%;
        }
        #static {
            position: absolute;
            top: 0;
            bottom: 0;
            width: 100%;
            height: 100%;
            z-index: 1;
            background-size: 100% 100%;
        }
    </style>
    <?php
    include 'db_conn.php';
    $conn = getConn();
    $single = false;

    if (isset($_GET['name'])) {
        $selected_name = $_GET['name'];
        $single = true;
    }
    $query = 'SELECT * FROM locations ORDER BY date ASC';


    $result = mysqli_query($conn, $query) or die(mysqli_error($conn));
    $resultarr = mysqli_fetch_all($result, MYSQLI_ASSOC);

    //filter sticker data if specific name is selected
    $i = 0;
    if ($single) {
        while ($row = $resultarr[$i]) {
            $name = nl2br(stripslashes($row['name']));
            if (!str_contains($name, $selected_name)) {
                unset($resultarr[$i]);
            }
            $i++;
        }
        $resultarr = array_values($resultarr);
        $i = 0;
    }

    //get sticker count
    $length = sizeof($resultarr);
    ?>
</head>
<body>
<!-- Load the `mapbox-gl-geocoder` plugin. -->
<script src="https://api.mapbox.com/mapbox-gl-js/plugins/mapbox-gl-geocoder/v5.0.0/mapbox-gl-geocoder.min.js"></script>
<link rel="stylesheet"
      href="https://api.mapbox.com/mapbox-gl-js/plugins/mapbox-gl-geocoder/v5.0.0/mapbox-gl-geocoder.css"
      type="text/css">

<div id='map'></div>
<div id="static"></div>

<script>
    mapboxgl.accessToken = 'pk.eyJ1IjoicGl4bHBhaW50ZXIiLCJhIjoiY2p1bWV5ZjVtMHZiaDRmbDg3cW1ubmx3NCJ9.X5FRsatkHE11P2Zwk8zN0w';
    const clientHeight = Math.min(document.getElementById('static').clientHeight, 1280);
    const clientWidth = Math.min(document.getElementById('static').clientWidth, 1280);
    const staticImg = `https://api.mapbox.com/styles/v1/pixlpainter/clda7ilh1000i01ofotpgomzu/static/${getNewestStickerCoords()[0]},`
        + `${getNewestStickerCoords()[1]},5/${clientWidth}x${clientHeight}@2x?logo=false&access_token=${mapboxgl.accessToken}`;

    document.getElementById("static").style.backgroundImage = `url(${staticImg})`;

    const markerHeight = 25;
    const popupOffsets = {'bottom': [0, -markerHeight]};
    const map = new mapboxgl.Map({
        container: 'map', // container ID
        style: 'mapbox://styles/pixlpainter/clda7ilh1000i01ofotpgomzu', // style URL
        center: getNewestStickerCoords(), // starting position [lng, lat]
        zoom: 5, // starting zoom
        attributionControl: false
    });
    // Add search control to the map.
    map.addControl(
        new MapboxGeocoder({
            accessToken: mapboxgl.accessToken,
            mapboxgl: mapboxgl
        })
    );
    // zoom map to user location control
    map.addControl(new mapboxgl.GeolocateControl({
        positionOptions: {
            enableHighAccuracy: true
        },
        trackUserLocation: true,
        showUserHeading: true
    }));
    // add fullscreen control
    map.addControl(new mapboxgl.FullscreenControl({
        container: document.querySelector('body')
    }));
    // show Stickercount
    map.addControl(new mapboxgl.AttributionControl({
        customAttribution: <?php echo "'" . $length . " Sticker insgesamt'" ?>
    }));
    // Add zoom and rotation controls to the map.
    map.addControl(new mapboxgl.NavigationControl());

    //add markers
    map.on('load', () => {
        // Add source for marker geo data
        map.addSource('stickers', getStickersGeoJson());

        // Add a symbol layer for HBG markers
        map.addLayer({
            'id': 'stickers',
            'type': 'symbol',
            'source': 'stickers',
            'layout': {
                'icon-image': 'hbg-marker',
                'icon-allow-overlap': true,
                'icon-anchor': 'bottom',
                'icon-size': 0.3,
                'icon-padding': 0
            }
        });
        // When a click event occurs on a feature in the stickers layer, open a popup at the
        // location of the feature, with description HTML from its properties.
        map.on('click', 'stickers', (e) => {
            // Copy coordinates array.
            const coordinates = e.features[0].geometry.coordinates.slice();
            const description = e.features[0].properties.description;

            // Ensure that if the map is zoomed out such that multiple
            // copies of the feature are visible, the popup appears
            // over the copy being pointed to.
            while (Math.abs(e.lngLat.lng - coordinates[0]) > 180) {
                coordinates[0] += e.lngLat.lng > coordinates[0] ? 360 : -360;
            }
            // add Popup
            new mapboxgl.Popup({offset: popupOffsets})
                .setLngLat(coordinates)
                .setHTML(description)
                .addTo(map);
        });

        //open Popup for newest sticker
        if (getNewestStickerDesc() !== "no sticker") {
            new mapboxgl.Popup({offset: popupOffsets})
                .setLngLat(getNewestStickerCoords())
                .setHTML(getNewestStickerDesc())
                .addTo(map);
        }
        // Change the cursor to a pointer when the mouse is over the places layer.
        map.on('mouseenter', 'stickers', () => {
            map.getCanvas().style.cursor = 'pointer';
        });

        // Change it back when it leaves.
        map.on('mouseleave', 'stickers', () => {
            map.getCanvas().style.cursor = '';
        });

        //swap static image with dynamic map
        document.getElementById("static").style.visibility = 'hidden';
    });

    function getNewestStickerCoords() {
        let lat = <?php echo empty($resultarr) ? 51.1642292 : end($resultarr)['latitude'] ?>;
        let long = <?php echo empty($resultarr) ? 10.4541194 : end($resultarr)['longitude'] ?>;

        return [long, lat];
    }

    function getNewestStickerDesc() {
        return <?php echo empty($resultarr) ? "'no sticker'" : "'<b>Neuster Sticker</b><br/>von " . nl2br(stripslashes(end($resultarr)['name'])) . "'" ?>;
    }

    function getStickersGeoJson() {
        let stickers = {
            'type': 'geojson',
            'data': {
                'type': 'FeatureCollection',
                'features': [
                    <?php
                    //add markers to feature collection
                    while ($row = $resultarr[$i]) {
                        $i++;
                        $name = nl2br(stripslashes($row['name']));
                        $description = "von " . $name;
                        if ($i == $length) {
                            $description = "<b>Neuster Sticker</b><br/>von " . $name;
                        } elseif ($i % 100 == 0) {
                            $description = "<b>Sticker Nr. " . $i . "</b><br>von " . $name;
                        } elseif ($i == 420) {
                            $description = "<b>420 blaze it</b></br>von " . $name;
                        } elseif ($i == 69) {
                            $description = "<b>Sticker 69 (nice)</b></br>von " . $name;
                        } elseif ($i == 1) {
                            $description = "<b>Sticker Nr. 1</b></br>von " . $name;
                        }

                        echo "{
                           'type': 'Feature',
                           'properties': {
                               'description': '" . $description . "' 
                           },
                           'geometry': {
                               'type': 'Point',
                               'coordinates': [" . $row['longitude'] . "," . $row['latitude'] . "]
                           }
                       },\n";
                    }
                    $conn->close();
                    ?>
                ]
            }
        };

        return stickers;
    }
</script>
</body>
</html>