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
                $timestamp = strtotime($row['date']);
                echo '{name: "', $row['name'], '", lat: ', $row['latitude'], ', long: ', $row['longitude'],
                ', city: "', $row['city'], '", state: "', $row['state'], '", country: "', $row['country'],
                '", month: ', date("n", $timestamp), ', year: ', date("Y", $timestamp), '},
                ';
            }
            echo "];";
            ?>
        }
    </script>
    <script type="text/javascript">
        const stickers = getStickers();
        const stickerCount = {total: stickers.length, currMonth: 0, lastMonth: 0};
        const cities = {total: new Set(), currMonth: new Set(), lastMonth: new Set()};
        const countries = {total: new Set(), currMonth: new Set(), lastMonth: new Set()};
        const names = {total: new Set(), currMonth: new Set(), lastMonth: new Set()};

        const d = new Date();
        const thisMonth = d.getMonth() + 1;
        const thisYear = d.getFullYear();

        stickers.forEach(getCounts);

        function getCounts(item, idx, arr) {
            cities.total.add(item.city);
            countries.total.add(item.country);
            const sticker_names = item.name.split("&");
            sticker_names.forEach(name => names.total.add(name.trim()));

            if (item.month === thisMonth && item.year === thisYear) {
                stickerCount.currMonth++;
                cities.currMonth.add(item.city);
                countries.currMonth.add(item.country);
                const sticker_names = item.name.split("&");
                sticker_names.forEach(name => names.currMonth.add(name.trim()));
            }

            let lastMonth = thisMonth - 1;
            let lastYear = thisYear;
            if (lastMonth === 0) {
                lastMonth = 12;
                lastYear--;
            }

            if (item.month === lastMonth && item.year === lastYear) {
                stickerCount.lastMonth++;
                cities.lastMonth.add(item.city);
                countries.lastMonth.add(item.country);
                const sticker_names = item.name.split("&");
                sticker_names.forEach(name => names.lastMonth.add(name.trim()));
            }
        }

        function styleDiff (textID, arrowID, diff) {
            const arrow_up = "bilder/arrow_up.svg";
            const arrow_down = "bilder/arrow_down.svg";
            const arrow_neutral = "bilder/arrow_neutral.svg";

            document.getElementById(textID).innerText = diff.toString();

            if (diff < 0) {
                document.getElementById(arrowID).src = arrow_down;
                document.getElementById(textID).style.color = 'red';
            } else if (diff > 0) {
                document.getElementById(arrowID).src = arrow_up;
                document.getElementById(textID).style.color = 'lime';
            } else {
                document.getElementById(arrowID).src = arrow_neutral;
                document.getElementById(textID).style.color = 'gray';
            }
        }

        window.onload = function () {
            document.getElementById("stickercount").innerText = stickerCount.total;
            document.getElementById("citycount").innerText = cities.total.size.toString();
            document.getElementById("countrycount").innerText = countries.total.size.toString();
            document.getElementById("namecount").innerText = names.total.size.toString();

            styleDiff("total_diff","total_arrow",stickerCount.currMonth - stickerCount.lastMonth);
            styleDiff("city_diff","city_arrow",cities.currMonth.size - cities.lastMonth.size);
            styleDiff("country_diff","country_arrow",countries.currMonth.size - countries.lastMonth.size);
            styleDiff("name_diff","name_arrow",names.currMonth.size - names.lastMonth.size);
        }
    </script>
</head>
<body>

<img src="bilder/Sticker_header.svg" class="logo" alt="HBG Logo"><br>
<div id="divider"></div>
<div id="content">
    <a class="card">
        <p id="stickercount" class="stat_int">1571</p>
        <p id="total_diff" class="diff">31</p>
        <img src="bilder/arrow_up.svg" alt="Pfeil nach oben" class="change_arrow" id="total_arrow">
        <p class="stat_desc">Geklebte Sticker</p>
    </a>
    <a class="card">
        <p id="citycount" class="stat_int">238</p>
        <p id="city_diff" class="diff">2</p>
        <img src="bilder/arrow_up.svg" alt="Pfeil nach oben" class="change_arrow" id="city_arrow">
        <p class="stat_desc">Beklebte Städte</p>
    </a>
    <a class="card" href="/bar_chart_exp?data=countries">
        <p id="countrycount" class="stat_int">12</p>
        <p id="country_diff" class="diff" style="color: red;">1</p>
        <img src="bilder/arrow_down.svg" alt="Pfeil nach unten" class="change_arrow" id="country_arrow">
        <p class="stat_desc">Eroberte Länder</p>
    </a>
    <a class="card" href="/bar_chart_exp?data=names">
        <p id="namecount" class="stat_int">31</p>
        <p id="name_diff" class="diff" style="color: gray;">0</p>
        <img src="bilder/arrow_neutral.svg" alt="Pfeil nach rechts" class="change_arrow" id="name_arrow">
        <p class="stat_desc">Stickerverteiler</p>
    </a>
</div>

</body>
</html>