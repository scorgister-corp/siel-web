const urlParams = new URLSearchParams(window.location.search);
stopName = urlParams.get('stop_name');
const direction = urlParams.get('direction');
const line = urlParams.get('line');

function updateInfosLightweight() {
    getInfos(stopName, destinations, lines, 2);
}

if (stopName === null || direction === null || line === null) {
    alert("No stop name, direction or line provided");
}else {
    lines = line.split(",");
    destinations = direction.split(",");
    
    if(lines.length == 0 || destinations.length == 0) {
        alert("No stop name, direction or line provided");

    }else {
        load(2);
    
        updateInfosLightweight();
        setInterval(updateInfosLightweight, 10000);
    }
}

