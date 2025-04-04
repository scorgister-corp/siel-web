const urlParams = new URLSearchParams(window.location.search);

var NEXT_STOP = Date.now() / 1000;
var IN_STATION = false;
var NEXT_STOP_NAME = "";
var CURRENT_STOP_I = 0;
var FIRST_STOP_I = 0;

var DIRECTION = undefined;
var LINE = undefined;

var THEORETICAL = false;

var TRIP_ID = urlParams.get("tripid");

function load() {
    if(TRIP_ID == null || TRIP_ID == "") {
        alert("trip id not foud");
        window.location = "index.html";
    }

    sendGet("/trip?tripid=" + TRIP_ID, (success, result) => {
        var lineElt = document.getElementById("line");
        lineElt.innerHTML = "";


        if(result != undefined && result.length > 0 && result != null) {
            document.getElementById("line-id").style = "display: initial;";
            document.getElementById("next-stop").style = "display: initial;";
            document.getElementById("vehicle-id").style = "display: initial; text-decoration: underline;";
            document.getElementById("line").style = "display: flex;";
            document.getElementById("terminated").style = "display: None;";

            lineElt.setAttribute("class", "route route-" + result[0]["route_short_name"]);

            document.getElementById("line-id").innerText = result[0]["station_name"] + " - " + result[result.length-1]["station_name"];
            document.getElementById("vehicle-id").innerText = result[0]["vehicle_id"];
            document.getElementById("vehicle-id-link").setAttribute("href", "info.html?vehiculeid=" + result[0]["vehicle_id"]);
            
            if(result[0].trip_color) {
                lineElt.setAttribute("style", lineElt.getAttribute("style") + "background-color: #" + result[0].trip_color + ";");
            }
        }else {
            document.getElementById("line-id").style = "display: None;";
            document.getElementById("next-stop").style = "display: None;";
            document.getElementById("vehicle-id").style = "display: None;";
            document.getElementById("line").style = "display: None;";
            document.getElementById("terminated").style = "display: unset;";
            return;
        }

        var i = 0;
        var first = true;
        var inStation = false;
        FIRST_STOP_I = 0;
        THEORETICAL = result[0].theoretical;
        DIRECTION = result[result.length-1].station_name;
        LINE = result[0].route_id;

        result.forEach(element => {
            var stationElt = document.createElement("div");

            if(element.schedule_relationship == 1) {
                stationElt.setAttribute("class", "station skipped");
                if(first) {
                    FIRST_STOP_I++;
                }
            }else {
                switch(element.state) {
                    case -1:
                        stationElt.setAttribute("class", "station visited");
                        break;
                    case 0:
                        stationElt.setAttribute("class", "station not-visited-or-in-station");
                        IN_STATION = true;
                        NEXT_STOP_NAME = element["station_name"];
                        NEXT_STOP = element["departure_time"];
                        inStation = true;
                        break;
                    case 1:
                        if(first && !inStation) {
                            stationElt.setAttribute("class", "station approche");
                            NEXT_STOP = element["departure_time"];
                            NEXT_STOP_NAME = element["station_name"];
                            IN_STATION = false;
                            first = false;
                            CURRENT_STOP_I = i;
                        }else {
                            stationElt.setAttribute("class", "station not-visited-or-in-station");
                        }
                        break;

                }
            }
            stationElt.style = '--ratio: ' + i / (result.length - 1) * 100 + '%;';
            stationElt.setAttribute("value", element["departure_time"]);
            
            var nameElt = document.createElement("div");
            let a = document.createElement("a");

            nameElt.setAttribute("class", "station-name");
            a.innerText = element.station_name;
            
            let directions = {};
            directions[LINE] = [DIRECTION];
            a.href = "index.html?stop_name=" + element.station_name + "&directions=" + JSON.stringify(directions) + "&skip=true&highlight=" + TRIP_ID;
            nameElt.appendChild(a);
            stationElt.appendChild(nameElt);
            lineElt.appendChild(stationElt)

            i++;
        });

        lineElt.style.setProperty("--line-height", (i * 150 / 20) + "vh");
        updateTimer();
    });
}

function updateTimer() {
    let sec = NEXT_STOP - Math.floor(Date.now() / 1000)
    if(IN_STATION) {
        document.getElementById("next-stop").innerText = "A quai: " + NEXT_STOP_NAME + " (" + sec + " s)" + (THEORETICAL?"*":"");
    }else {
        if(CURRENT_STOP_I == FIRST_STOP_I)
            document.getElementById("next-stop").innerText = "Départ: " + NEXT_STOP_NAME + " (" + sec + " s)" + (THEORETICAL?"*":"");
        else
            document.getElementById("next-stop").innerText = "Prochain arret: " + NEXT_STOP_NAME + " (" + sec + " s)" + (THEORETICAL?"*":"");
    }
}

load()
setInterval(load, 6000);
setInterval(updateTimer, 1000);
