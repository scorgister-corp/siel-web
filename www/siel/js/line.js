const urlParams = new URLSearchParams(window.location.search);

function load() {    
    if(urlParams.get("tripid") == null || urlParams.get("tripid") == "") {
        alert("trip id not foud");
        window.location = "index.html";
    }

    sendGet("/trip?tripid=" + urlParams.get("tripid"), (success, result) => {
        var lineElt = document.getElementById("line");
        lineElt.innerHTML = "";
        if(result.length > 0)
            lineElt.setAttribute("class", "route-" + result[0]["route_short_name"]);
        var i = 0;
        var first = true;
        var inStation = false;
        result.forEach(element => {
            var stationElt = document.createElement("div");
            switch(element.state) {
                case -1:
                    stationElt.setAttribute("class", "station visited");
                    break;
                case 0:
                    stationElt.setAttribute("class", "station not-visited-or-in-station");
                    inStation = true;
                    break;
                case 1:
                    if(first && !inStation) {
                        stationElt.setAttribute("class", "station approche");
                        first = false;
                    }else
                        stationElt.setAttribute("class", "station not-visited-or-in-station");
                    break;

            }
            stationElt.style = 'left: ' + i / (result.length - 1) * 100 + '%';

            var nameElt = document.createElement("div");
            nameElt.setAttribute("class", "station-name");
            nameElt.innerText = element.station_name;
            stationElt.appendChild(nameElt);
            lineElt.appendChild(stationElt)
            i++;
        });
    });
}

load()
setInterval(load, 6000)