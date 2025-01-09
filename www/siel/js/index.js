function updateClock() {
    var date = new Date();
    var hours = date.getHours();
    var min = date.getMinutes();
    
    if(hours.toString().length == 1)
        hours = "0" + hours;

    if(min.toString().length == 1)
        min = "0" + min;

    if(semiCol)
        document.getElementById("clock-text").innerText = hours + " " + min;
    else
        document.getElementById("clock-text").innerText = hours + ":" + min;

    semiCol = !semiCol;

}

load(0);


document.getElementById("stop-selection").onchange = changeStation;
document.getElementById("select-btn").onclick = updateDirections;
document.getElementById("routes").onclick = loadAlertPanel;


updateClock();

setInterval(updateClock, 500);
setInterval(updateInfos, 10000);
