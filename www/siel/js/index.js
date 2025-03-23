const urlParams = new URLSearchParams(window.location.search);
var selectedStop = urlParams.get('stop_name');
var selectedDirections = urlParams.get('direction');
var selectedLines = urlParams.get('line');
var skip = urlParams.get('skip');
var highlight = urlParams.get('highlight');

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

if(highlight != undefined)
    HIGHLIGHT_ID = highlight;

let clearURL = window.location.toString();
clearURL = clearURL.substring(0, clearURL.indexOf("?"));

window.history.replaceState({id: "100"}, "SIEL", clearURL);

load(0, () => {
    if(selectedStop !== null) {
        let ok = false;
        for(let stN of possibleStopNames) {            
            if(stN.toUpperCase() == selectedStop.toUpperCase()) {
                selectedStop = stN;
                ok = true;
                break;
            }
        }

        if(ok) {
            if(selectedDirections !== null) {
                selectedDirections = selectedDirections.split(",");
                if(selectedDirections.length != 0) {
                    directions = selectedDirections
                }
            }

            if(selectedLines !== null) {
                selectedLines = selectedLines.split(",");
                if(selectedLines.length != 0) {
                    lines = selectedLines;            
                }
            }

            document.getElementById("stop-selection").value = selectedStop;

            if(skip !== null && skip == "true") {
                stopName = selectedStop;
                updateDirections(skip);
            }else
                updateStation(selectedStop, 0); 
        }
    }
});

document.getElementById("stop-selection").addEventListener(
    "input",
    function (e) { 
        console.log(e);
          
        if(["insertText", "deleteContentBackward", "insertCompositionText"].includes(e.inputType))
            return;
        changeStation(e)
        e.target.blur();
    },
    false
);

document.getElementById("stop-selection").onfocus = (e) => {
    e.target.value = ""; 
}

document.getElementById("stop-selection").addEventListener("focusout", (e) => {
    if(stopName === undefined)
        e.target.value = "";
    else
        e.target.value = stopName;  
});

document.getElementById("select-btn").onclick = updateDirections;
document.getElementById("routes").onclick = loadAlertPanel;


updateClock();

setInterval(updateClock, 500);
setInterval(updateInfos, 10000);
