<!DOCTYPE html>
<html lang="de">
<head>
    <title>HBG Statistiken</title>

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
    <meta name="viewport" content="width=device-width, initial-scale=1.0">

    <?php
        //connection
        include 'db_conn.php';
        $conn = getConn();

        $query = 'SELECT * FROM locations';
        $result = mysqli_query($conn, $query) or die(mysqli_error($conn));

        //get sticker count
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

        function get(name){
            if(name=(new RegExp('[?&]'+encodeURIComponent(name)+'=([^&]*)')).exec(location.search))
                return decodeURIComponent(name[1]);
        }
    </script>

    <script src="https://cdn.jsdelivr.net/npm/chart.js"></script>
</head>
<body>

<canvas id="stickerCount" style="width:100%;max-width:1000px"></canvas>

<script>
    const data = get("data");

    const stickers = getStickers();
    let categoryCounts = new Map();

    function populateCounts(item, idx, arr) {
        if (data === "names") {
            const sticker_names = item.name.split("&");
            sticker_names.forEach(name => {
                let trimmed_name = name.trim();
                if (categoryCounts.has(trimmed_name)) {
                    categoryCounts.set(trimmed_name, categoryCounts.get(trimmed_name) + 1);
                } else {
                    categoryCounts.set(trimmed_name, 1);
                }
            });
        } else if (data === "countries") {
            if (categoryCounts.has(item.country)) {
                categoryCounts.set(item.country, categoryCounts.get(item.country) + 1);
            } else {
                categoryCounts.set(item.country, 1);
            }
        }
    }

    stickers.forEach(populateCounts);
    document.getElementById('stickerCount').style.height = categoryCounts.size * 20 + 'px';

    const sortedCounts = new Map([...categoryCounts].sort((a, b) => b[1] - a[1]));

    const xValues = Array.from(sortedCounts.keys());
    const datasets = [{
        backgroundColor: "#55b6ff",
        data: Array.from(sortedCounts.values()),
        label: "Geklebte Sticker"
    }]

    const ctx = document.getElementById("stickerCount").getContext("2d");
    let title;
    if (data === "names") {
        title = "Geklebte Sticker pro Person";
    } else if (data === "countries") {
        title = "Geklebte Sticker pro Land";
    }

    const stickerChart = new Chart(ctx, {
        type: "bar",
        data: {
            labels: xValues,
            datasets
        },
        options: {
            indexAxis: 'y',
            plugins: {
                legend: {display: false},
                title: {
                    display: true,
                    text: title,
                }
            }
        },
        plugins:[{
            id: 'click-anywhere',
            afterEvent(chart, args) {
                if (args.event.type === 'click') {
                    let {x, y} = chart.scales;
                    let value = x.getValueForPixel(args.event.x);
                    let yVal = y.getLabelForValue(y.getValueForPixel(args.event.y))
                    //console.log('value: ' + value + ', rounded: ' + Math.round(value) + ', x label: ' + yVal);
                    if (value < 0) {
                        if (data === "names") {
                            window.open("https://intern.diehbg.de/karte?name=" + yVal, "Karte")
                        }
                    }
                }
            }
        }]
    });
</script>
</body>
</html>