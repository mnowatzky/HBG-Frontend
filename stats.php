<!DOCTYPE html>
<html lang="de">
<head>
    <title>Statistiken</title>

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
    $length = sizeof($resultarr);
    $count_per_person = array("Malte" => 0);
    $i = 0;

    //add count per name
    while ($row = $resultarr[$i]) {
        $names_raw = $row['name'];
        //Regeln fuer Spitznamen
        $spitznamen = array("Kahlin", "Khalin", "Janni", "Timouw", "Le Nerd", "TT", "Paul Klotzke", "LX", "Stefanie Nowatzky", "Piet Nowatzky", "Hansivader");
        $klarnamen = array("Collin", "Collin", "Jan-Simon", "Timow", "Lennart", "Theresa", "Paul", "Henry", "Stefanie", "Piet", "Piet");
        //ersetzen von Spitznamen
        $names = str_replace($spitznamen, $klarnamen, $names_raw);
        //Sonderfall Timo
        if (stripos($names, "Timo ") !== false || strpos($names, " Timo") !== false || $names == "Timo") {
            $names = str_replace("Timo", "Timof", $names);
        }

        //mehrere Namen trennen
        $single_names = explode("&", $names);

        //Alle Namen im Eintrag durchgehen
        foreach ($single_names as $name) {
            $trimmed_name = trim($name);
            //checken, ob der Name vorhanden ist : sonst neuer Eintrag im Array
            $found = false;
            foreach ($count_per_person as $person => $count) {
                if (strtoupper($person) === strtoupper($trimmed_name)) {
                    $count_per_person[$trimmed_name]++;
                    $found = true;
                }
            }
            if (!$found) {
                $count_per_person[$trimmed_name] = 1;
            }
        }

        $i++;
    }

    //sort stats
    arsort($count_per_person);
    $conn->close();
    ?>


    <script src="https://cdn.jsdelivr.net/npm/chart.js"></script>
</head>
<body>

<canvas id="stickerCount" style="width:100%;max-width:1000px"></canvas>

<script>
    function getNames() {
        <?php
        echo "return [";
        foreach ($count_per_person as $person => $count) {
            echo "'" . $person . "', ";
        }
        echo "]";
        ?>
    }

    function getCounts() {
        <?php
        echo "return [";
        foreach ($count_per_person as $person => $count) {
            echo $count . ", ";
        }
        echo "]";
        ?>
    }

    document.getElementById('stickerCount').style.height = getNames().length * 20 + 'px';

    const xValues = getNames();
    const datasets = [{
        backgroundColor: "#215dba",
        data: getCounts(),
        label: "Geklebte Sticker"
    }]

    const ctx = document.getElementById("stickerCount").getContext("2d");

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
                    text: "Geklebte Sticker pro Person",
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
                        window.open("https://intern.diehbg.de/karte?name=" + yVal, "Karte")
                    }
                }
            }
        }]
    });
</script>

<p style="font-family: Roboto, sans-serif; font-size: 17px;">Anzahl Sticker gesamt: <?php echo $length ?></p>
</body>
</html>