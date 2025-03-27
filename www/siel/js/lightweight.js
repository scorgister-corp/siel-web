const urlParams = new URLSearchParams(window.location.search);
stopName = urlParams.get('stop_name');
const direction = urlParams.get('direction');
const line = urlParams.get('line');

function updateInfosLightweight() {
    getInfos();
}

if (stopName === null || direction === null || line === null) {
    alert("No stop name, direction or line provided");
}else {
    lines = line.split(",");
    directions = direction.split(",");
    
    if(lines.length == 0 || directions.length == 0) {
        alert("No stop name, direction or line provided");

    }else {
        load(2);
    
        updateInfosLightweight();
        setInterval(updateInfosLightweight, 10000);
    }
}

