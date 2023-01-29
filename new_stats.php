<!DOCTYPE html>
<html lang="de">
<head>
    <title>HBG Statistiken</title>

    <meta name="msapplication-TileColor" content="#ffffff">
    <meta name="msapplication-TileImage" content="/ms-icon-144x144.png">
    <meta name="theme-color" content="#ffffff">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">

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

    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="https://fonts.googleapis.com/css2?family=Oswald:wght@400;700&display=swap" rel="stylesheet">


    <link rel="stylesheet" href="css/main.css">

    <?php
    //connection
    include 'db_conn.php';
    $conn = getConn();

    $query = 'SELECT * FROM locations';
    $result = mysqli_query($conn, $query) or die(mysqli_error($conn));

    $resultarr = mysqli_fetch_all($result, MYSQLI_ASSOC);
    $conn->close();
    ?>

    <script>
        function getStickers() {
            <?php
            echo "return [";
            foreach ($resultarr as $row) {
                echo '{name: "', $row['name'], '", lat: ', $row['latitude'], ', long: ', $row['longitude'],
                ', city: "', $row['city'], '", state: "', $row['state'], '", country: "', $row['country'], '"},
                ';
            }
            echo "];";
            ?>
        }
    </script>
    <script type="text/javascript">
        const stickers = getStickers();
        const cities = new Set();
        const countries = new Set();
        const names = new Set();

        stickers.forEach(getCounts);

        function getCounts(item, idx, arr) {
            cities.add(item.city);
            countries.add(item.country);
            const sticker_names = item.name.split("&");
            sticker_names.forEach(name => names.add(name.trim()));
        }
        window.onload = function () {
            document.getElementById("stickercount").innerText = stickers.length;
            document.getElementById("citycount").innerText = cities.size.toString();
            document.getElementById("countrycount").innerText = countries.size.toString();
            document.getElementById("namecount").innerText = names.size.toString();
        }
    </script>
</head>
<body>

<img src="bilder/Sticker_header.svg" class="logo" alt="HBG Logo"><br>
<div id="divider"></div>
<div id="content">
    <!-- TODO add monthly change indicator -->
    <a class="card">
        <p id="stickercount" class="stat_int">1571</p>
        <p class="stat_desc">Geklebte Sticker</p>
    </a>
    <a class="card">
        <p id="citycount" class="stat_int">238</p>
        <p class="stat_desc">Beklebte Städte</p>
    </a>
    <a class="card">
        <p id="countrycount" class="stat_int">12</p>
        <p class="stat_desc">Eroberte Länder</p>
    </a>
    <a class="card" href="/bar_chart">
        <p id="namecount" class="stat_int">31</p>
        <p class="stat_desc">Stickerverteiler</p>
    </a>
</div>

</body>
</html>