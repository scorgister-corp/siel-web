var DATA = [];

function arrived() {
    var stationName = getCurrentStationNameAndValue();
    
    DATA.push({
        "type": 0,
        "station_name": stationName[0],
        "arrival_delta": stationName[1] - Date.now() / 1000
    });
}

function departure() {
    var stationName = getCurrentStationNameAndValue();
    
    DATA.push({
        "type": 1,
        "station_name": stationName[0],
        "arrival_delta": stationName[1] - Date.now() / 1000
    });
}

function getCurrentStationNameAndValue() {
    var child = document.getElementById("line").children;
    for(var i = 0; i < child.length; i++) {
        if(child[i].getAttribute("class").includes("not-visited-or-in-station") || child[i].getAttribute("class").includes("approche")) {
            return [child[i].children[0].innerHTML, child[i].getAttribute("value")];
        }
    }
}

function send() {
    sendPost("/analyse", DATA, (success, result) => {
        DATA = [];
    });
}

document.getElementById("arrived").onclick = arrived;
document.getElementById("departure").onclick = departure;
document.getElementById("send").onclick = send;