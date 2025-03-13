const urlParams = new URLSearchParams(window.location.search);

var NEXT_STOP = Date.now() / 1000;
var IN_STATION = false;
var NEXT_STOP_NAME = "";
var CURRENT_STOP_I = 0;

var THEORETICAL = false;

function load() {
    if(urlParams.get("tripid") == null || urlParams.get("tripid") == "") {
        alert("trip id not foud");
        window.location = "index.html";
    }

    sendGet("/trip?tripid=" + urlParams.get("tripid"), (success, result) => {
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

        THEORETICAL = result[0].theoretical;
        result.forEach(element => {
            var stationElt = document.createElement("div");

            if(element.schedule_relationship == 1) {
                stationElt.setAttribute("class", "station skipped");
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
            nameElt.setAttribute("class", "station-name");
            nameElt.innerText = element.station_name;
            stationElt.appendChild(nameElt);
            lineElt.appendChild(stationElt)
            i++;
        });
    });
}

function updateTimer() {
    //console.log(NEXT_STOP - Math.floor(Date.now() / 1000));
    var sec = NEXT_STOP - Math.floor(Date.now() / 1000)
    if(IN_STATION) {
        document.getElementById("next-stop").innerText = "Stopped at " + NEXT_STOP_NAME + " (" + sec + " s)" + (THEORETICAL?"*":"");
    }else {
        if(CURRENT_STOP_I == 0)
            document.getElementById("next-stop").innerText = "Departure from " + NEXT_STOP_NAME + " (" + sec + " s)" + (THEORETICAL?"*":"");
        else
            document.getElementById("next-stop").innerText = "In transit to " + NEXT_STOP_NAME + " (" + sec + " s)" + (THEORETICAL?"*":"");
    }
}

load()
setInterval(load, 6000);
setInterval(updateTimer, 1000);
