const urlParams = new URLSearchParams(window.location.search);
stopName = urlParams.get('stop_name');
const directionsRaw = urlParams.get('directions');
//const line = urlParams.get('lines');

function updateInfosLightweight() {
    getInfos();
}

loadClientInfos(() => {
    if (stopName === null || directions === null) {
        alert("No stop name, directions provided");
    }else {
        //lines = line.split(",");
        directions = JSON.parse(directionsRaw);
        
        load(2);

        updateInfosLightweight();
        setInterval(updateInfosLightweight, 10000);
    }
});
