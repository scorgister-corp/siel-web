var semiCol = false;

var possibleStopNames = [];

var stopName = "";
var directions = [];
var lines = [];

var alerts = {};

var localAlertIds = [];

var displayAlertSchedule = [];
var displayAlert = false;

var freezAlert = false;

var HIGHLIGHT_ID = undefined;
var FIRST_LOAD = true;

const AUDIO_URL = "/sound/";
const AUDIO_FORMAT = ".mp3";

var audioHistory = [];

function calcAlertDuration(textAlert) {
    return (textAlert.length * 15 / 80);
}

function getAlert() {
    if(lines.length == 0 || directions.length == 0) {
        return;
    }

    sendPost("/alert", {line: lines}, (success, result) => {
        if(!success) {
            console.log("Error [-1]");
            return;
        }

        let ids = [];
        result.forEach(elt => {
            let text = "Ligne " + elt.routeId + ": " + elt.text;
            let duration = calcAlertDuration(text);
            if(alerts[elt.alert_id] !== undefined) {
                alerts[elt.alert_id] = {
                    text: text,
                    duration: duration
                };
            }

            ids.push(elt.alert_id);
            if(!displayAlertSchedule.includes(elt.alert_id))
                displayAlertSchedule.push(elt.alert_id);
        });

        for(let i of Object.keys(alerts)) {
            if(!ids.includes(i) && !localAlertIds.includes(i)) {
                alerts[i] = undefined;
            }
        }

        updateAlert();
    });
}

function updateAlert() {
    if(alerts.length == 0 || displayAlertSchedule.length == 0) {
        return;
    }
    if(!displayAlert) {
        displayAlert = true;
        setAlert(displayAlertSchedule.pop());
    }
}

function setAlert(id) {
    let p = document.getElementById("marquee-rtl");

    while(alerts[id] === undefined && displayAlertSchedule.length > 0)
        id = displayAlertSchedule.pop();
    
    if(alerts[id] != undefined)
        displayAlertSchedule.push(id);

    if(displayAlertSchedule.length == 0) {
        p.hidden = true;
        displayAlert = false;
        return;
    }else
        p.hidden = false;

    var alert = alerts[id];
    
    let div = document.createElement("div");
    let animation = div.animate([{transform: "translateX(0)"}, {transform: "translateX(-100%)"}],
        {
            fill: "forwards",
            easing: "linear",
            duration: alert.duration * 1000
        }
    );

   animation.onfinish = e => {
        setAlert(displayAlertSchedule.pop());
    }

    div.innerText = alert.text;    
    
    p.innerText = "";
    p.appendChild(div);
    animation.play();
}

function updateStatusAlert(upt) {
    isUpdateDisplay = upt;
}

function removeAlert(alertId) {
    alerts[alertId] = undefined;
}

function updateInfos() {
    getInfos(stopName, directions, lines, 1);
}

function getInfos(stopName, direction, line, type) {
    if(stopName == undefined || direction.length == 0 || lines.length == 0)
        return;

    sendPost("/data", {stop_name: stopName, direction: direction, line: line}, (success, result) => {        
        if(!result || (result != null && result.length <= 0)) {
            showNonDesservie(stopName);
            return;
        }

        removeAlert(0); // remove non desservie alert

        var destinationMin = result[0]["trip_headsign"];
        var nameMin = result[0]["route_short_name"];

        var routes = [];
        var routeColors = {};
        result.forEach(element => {
            if(!routes.includes(element["route_short_name"])) {
                routes.push(element["route_short_name"]);
                routeColors[element["route_short_name"]] = element.trip_color;
            }
        });

        if(document.getElementById("routes") != undefined) {
            document.getElementById("routes").innerText = "";
            routes.forEach(element => {
                var spanRoute = document.createElement("span");
                spanRoute.setAttribute("class", "route-name route-" + element)
                spanRoute.setAttribute("style", "background-color: #" + routeColors[element] + ";");

                spanRoute.innerText = element;

                
                document.getElementById("routes").appendChild(spanRoute);
            });

            if(routes.length > 0) {
                document.getElementById("header").setAttribute("class", "header-" + routes[0]);
                document.getElementById("header").setAttribute("style", "border-color: #" + routeColors[routes[0]] + ";");
            }
        }
        document.getElementById("dest-min").innerText = destinationMin + (lines.length>1?(" (" + nameMin + ")"):"");
        
        var timeMin = result[0]["departure_time"] + "000";
        var timeMax = undefined;

        var tMin = new Date(Number(timeMin));
        
        var diffMin = dateDiff(new Date(), tMin);
        if(diffMin.hour > 0)
            document.getElementById("time-min").innerText = (result[0].theoretical?"*":"") + "+60";
        else
            document.getElementById("time-min").innerText = (result[0].theoretical?"*":"") + diffMin.min;

        if(HIGHLIGHT_ID != undefined && result[0].trip_id == HIGHLIGHT_ID) {
            document.getElementById("time-min").setAttribute("class", "time-number highlight");
        }else {
            document.getElementById("time-min").setAttribute("class", "time-number");
        }

        var v1ID = result[0]["vehicle_id"];
        document.getElementById("time-1").setAttribute("title", (v1ID==null?"no vehicle assigned":v1ID));
        document.getElementById("time-1-link").setAttribute("href", "line.html?tripid=" + result[0]["trip_id"]);
        
        if(result.length > 1) {
            var destinationMax = result[1]["trip_headsign"];
            var nameMax = result[1]["route_short_name"];
            
            document.getElementById("dest-max").innerText = destinationMax + (lines.length>1?(" (" + nameMax + ")"):"");
            
            timeMax = result[1]["departure_time"] + "000";
            var tMax = new Date(Number(timeMax));

            var diffMax = dateDiff(new Date(), tMax);
            if(diffMax.hour > 0)
                document.getElementById("time-max").innerText = (result[1].theoretical?"*":"") + "+60";
            else
                document.getElementById("time-max").innerText = (result[1].theoretical?"*":"") + diffMax.min;

            var v2ID = result[1]["vehicle_id"];
            document.getElementById("time-2").setAttribute("title", (v2ID==null?"no vehicle assigned":v2ID));
            document.getElementById("time-2-link").setAttribute("href", "line.html?tripid=" + result[1]["trip_id"]);

            if(HIGHLIGHT_ID != undefined && result[1].trip_id == HIGHLIGHT_ID) {
                document.getElementById("time-max").setAttribute("class", "time-number highlight");
            }else {
                document.getElementById("time-max").setAttribute("class", "time-number");
            }
    

        }else {
            document.getElementById("dest-max").innerText = "?";
            document.getElementById("time-max").innerText = "?";
            document.getElementById("time-2-link").href = "#";
            document.getElementById("time-max").setAttribute("class", "time-number");
        }

        if(document.getElementById("other") != undefined) {
            document.getElementById("other").innerText = "";

            for(var i = 2; i < result.length; i++) {
                var mainA = document.createElement("a");
                mainA.setAttribute("href", "line.html?tripid=" + result[i]["trip_id"]);

                var mainDiv = document.createElement("div");
                mainDiv.setAttribute("class", "other-container");
                mainDiv.id = result[i].trip_id;
                var divLeft = document.createElement("div");
                var divNum = document.createElement("div");
                divNum.setAttribute("class", "sub-count")

                var numSpan = document.createElement("span");
                numSpan.innerText = i+1;

                var e = document.createElement("sup");
                e.innerText = "e";

                var destinationSpan = document.createElement("span");
                destinationSpan.innerText = result[i]["trip_headsign"];

                if(FIRST_LOAD && HIGHLIGHT_ID != undefined && result[i].trip_id == HIGHLIGHT_ID) {
                    destinationSpan.setAttribute("class", "highlight");
                }

                numSpan.appendChild(e);
                numSpan.innerHTML += " ";

                divNum.appendChild(numSpan);
                divLeft.appendChild(divNum);
                divLeft.appendChild(destinationSpan);

                var time = result[i]["departure_time"] + "000";

                var t = new Date(Number(time));

                var diff = dateDiff(new Date(), t);

                var spanTime = document.createElement("span");
                if(diff.hour > 0) {
                    if(diff.min.toString().length == 1)
                        diff.min = "0" + diff.min
                    spanTime.innerHTML = (result[i].theoretical?"*":"") + diff.hour + "<sub>h</sub>" + diff.min;
                }else {
                    spanTime.innerHTML = (result[i].theoretical?"*":"") + diff.min + "<sub>min</sub>";
                }
                mainDiv.appendChild(divLeft);
                mainDiv.appendChild(spanTime);

                try {
                    var vID = result[i]["vehicle_id"];
                    mainDiv.setAttribute("title", (vID==null?"no vehicle assigned":vID));
                }catch(e) {
                    console.log(e);  
                }
                mainA.appendChild(mainDiv);
                document.getElementById("other").appendChild(mainA);
            }

            var mainDiv = document.createElement("div");
            mainDiv.setAttribute("class", "other-container");

            var but = document.createElement("button");
            if(getCookie("favorites") == null || !getCookie("favorites").includes(":" + stopName + ":"))
                but.innerText = "Add " + stopName + " as favorites";
            else
                but.innerText = "Remove " + stopName + " of favorites";
            but.value = stopName;
            but.onclick = favAction;
            but.setAttribute("class", "fav-btn")
            mainDiv.appendChild(but)

            document.getElementById("other").appendChild(mainDiv);
        }

        let highlightElt = document.getElementById(HIGHLIGHT_ID);
        if(FIRST_LOAD && highlightElt != undefined)
            highlightElt.scrollIntoView();

        clearAudioHistory();
        FIRST_LOAD = false;
        if(audioHistory.includes(result[0].trip_id))
            return;

        var next = undefined;
        for(var i = 1; i < result.length; i++) {
            if(result[i].trip_headsign == destinationMin) {
                next = result[i];
                break;
            }
        }

        if(diffMin.min != 2)
            return;

        var gender = ["F", "M"][Math.floor((Math.random()*2))];
        var audio = new Audio(AUDIO_URL + "D" + gender + destinationMin.toUpperCase() + "2" + AUDIO_FORMAT);
        audio.onended = (e) => {
            if(next == undefined)
                return;

            diff = dateDiff(new Date(), new Date(Number(next.departure_time + "000")));
            if(diff.day > 0 || diff.hour > 0)
                return;
    
            
            var audio = new Audio(AUDIO_URL + "N" + gender + diff.min + AUDIO_FORMAT);
            audio.play();
        }
        audio.play()

        audioHistory.push(result[0].trip_id);
    });
}

function dateDiff(date1, date2){
	var diff = {};
	var tmp = date2 - date1;

	tmp = Math.floor(tmp/1000);
	diff.sec = tmp % 60;
	tmp = Math.floor((tmp-diff.sec)/60);
	diff.min = tmp % 60;

	tmp = Math.floor((tmp-diff.min)/60);
	diff.hour = tmp % 24;
	
	tmp = Math.floor((tmp-diff.hour)/24);
	diff.day = tmp;
	
	return diff;
}

function changeStation(e) {        
    updateStation(e.target.value);
}

function updateStation(stop_name, e) {    
    if(stopName !== undefined && stopName.toUpperCase() == stop_name.toString()) {
        return;
    }
    
    stopName = stop_name;
    audioHistory = [];
    clearAlert();
    loadAlertPanel(e);
}

function showNonDesservie(stopName) {
    clear();

    if(alerts[0] != undefined) {
        return;
    }

    let text = "La station " + stopName + " n'est actuellement pas desservie";
    if(lines !== undefined && lines.length > 0) {
        if(lines.length == 1) {
            text += " par la ligne " + lines[0]
        }else {
            text += " par les lignes " + lines[0];
            for(let i = 1; i < lines.length-1; i++)
                text += ", " + lines[i];
            text += " et " + lines[lines.length-1];
        }
    }

    if(directions !== undefined && directions.length > 0) {
        if(directions.length == 1) {
            text += " en direction de " + directions[0]
        }else {
            text += " en direction de " + directions[0];
            for(let i = 1; i < directions.length-1; i++)
                text += ", " + directions[i];
            text += " et " + directions[directions.length-1];
        }
    }
    text += ".";
    
    if(!localAlertIds.includes("0"))
        localAlertIds.push("0");

    alerts["0"] = {
        text: text,
        duration: calcAlertDuration(text)
    };

    if(!displayAlertSchedule.includes("0"))
        displayAlertSchedule.push("0");

    updateAlert();
}

function loadAlertPanel(e) {    
    if(stopName === undefined || stopName === "")
        return;

    sendPost("/stopdata", {stop_name: stopName}, (success, result) => {
        if(result && (result.directions.length == 0|| result.lines.length == 0)) {
            showNonDesservie(stopName);
            return;
        }

        document.getElementById("panel-body").innerText = "";
        document.getElementById("select-text").innerText = "Où voulez-vous aller depuis: " + stopName;

        if(e == null)
            directions = [];
        
        result.directions.forEach(element => {
            var div = document.createElement("div");
            div.setAttribute("class", "panel-elt dest-0");
            div.setAttribute("id", element);
            div.setAttribute("value", element);
            div.onclick = onclickDest;

            if(e != null && directions.includes(element))
                div.setAttribute("class", "panel-elt dest-1");
            
            var lab = document.createElement("span");
            lab.innerText = element;

            div.appendChild(lab);

            document.getElementById("panel-body").appendChild(div);
        });

        document.getElementById("line-body").innerText = "";
        document.getElementById("line-text-head").innerText = "En utilisant la/les ligne(s)";
        
        if(e == null)
            lines = [];
        
        result.lines.forEach(element => {
            var div = document.createElement("div");
            div.setAttribute("class", "panel-elt dest-0");
            div.setAttribute("id", element);
            div.setAttribute("value", element);
            div.onclick = onclickDest;

            if(e != null && lines.includes(element))
                div.setAttribute("class", "panel-elt dest-1");

            var lab = document.createElement("span");
            lab.innerText = element;

            div.appendChild(lab);

            document.getElementById("line-body").appendChild(div);
        });

        document.getElementById("alert-panel").hidden = false;
        document.getElementById("alert-bg").hidden = false;
    });
}

function onclickDest(e) {
    var d = e.target;
    if(d.id == "") {
        d = d.parentElement;
    }

    if(d.getAttribute("class").includes("dest-0"))
        d.setAttribute("class", "panel-elt dest-1");
    else
        d.setAttribute("class", "panel-elt dest-0");

    
}

function updateDirections(e) {
    if(e != "true") {
        directions = [];
        var count = 0;
        for(var i = 0; i < document.getElementById("panel-body").childElementCount; i++) {
            var elt = document.getElementById("panel-body").children[i];
            
            if(elt.getAttribute("class").includes("dest-1")) {
                directions.push(elt.id);
                count++;
            }
        }

        if(count == 0) {
            alert("You must select at least one destination !")
            return;    
        }

        lines = [];
        count = 0;
        for(var i = 0; i < document.getElementById("line-body").childElementCount; i++) {
            var elt = document.getElementById("line-body").children[i];
            if(elt.getAttribute("class").includes("dest-1")) {
                lines.push(elt.id);
                count++;
            }
        }

        if(count == 0) {
            alert("You must select at least one line !")
            return;    
        }
    }else {
        if(directions == undefined || directions.length == 0 || lines == undefined || lines.length == 0) {
            alert("You must select at least one line and one destination !")
            return;
        }
    }
    
    document.getElementById("alert-panel").hidden = true;
    document.getElementById("alert-bg").hidden = true;

    clear();
    clearAlert();
    

    updateInfos();
    getAlert();
}

function clear() {    
    document.getElementById("header").setAttribute("class", "");
    document.getElementById("header").setAttribute("style", "");
    placeDefaultRouteName();

    document.getElementById("dest-min").innerText = "?";
    document.getElementById("dest-max").innerText = "?";

    document.getElementById("time-min").innerText = "?";
    document.getElementById("time-max").innerText = "?";
    document.getElementById("other").innerText = "";

    document.getElementById("time-1-link").href = "#";
    document.getElementById("time-2-link").href = "#";
}

function placeDefaultRouteName() {
    document.getElementById("routes").innerText = "";
    let span = document.createElement("span");
    span.setAttribute("class", "route-name");
    span.innerText = "?";
    document.getElementById("routes").appendChild(span);
}

function clearAlert() {
    document.getElementById("marquee-rtl").innerText = "";
    document.getElementById("marquee-rtl").hidden = true;
    alerts = {};
    displayAlertSchedule = [];
    displayAlert = false;
}

function load(type, callBack) {
    if(type == 2)
        return;

    sendGet("/stops", (success, res) => {
        if(res == null || res.length <= 0) {
            console.log("Error [1]");
            return
        }

        document.getElementById("stop-names").innerHTML = "";

        var fav = getCookie("favorites");
        let favs = undefined;
        if(fav != null) {
            favs = fav.split(":");
            var ok = false;

            for(var i = 0; i < favs.length; i++) {
                if(favs[i] == "")
                    continue;
                var opt = document.createElement("option");
                opt.innerText = favs[i].toUpperCase();
                opt.value = favs[i];
    
                document.getElementById("stop-names").appendChild(opt);
                ok = true;
            }
        }
        
        for(var i = 0; i < res.length; i++) {
            var opt = document.createElement("option");
            if(favs !== undefined && favs.includes(res[i])) {
                opt.hidden = true;
            }
                
            opt.innerText = res[i];
            opt.value = res[i];

            document.getElementById("stop-names").appendChild(opt);
            possibleStopNames.push(res[i]);
        }

        document.getElementById("stop-selection").placeholder = "Sélectionnez votre station";
        document.getElementById("stop-selection").disabled = false;
        if(callBack != undefined) {
            callBack();
        }
    });
}

function clearAudioHistory() {
    if(audioHistory.length < 10)
        return;

    audioHistory.splice(0, audioHistory.length - 2);
}

function favAction(e) {
    let cookie = getCookie("favorites");
    let dataList = document.getElementById("stop-names");

    if(cookie == null) {
        setCookie("favorites", ":" + e.target.value + ":", 100000);
        e.target.innerText = "Remove " + e.target.value + " of favorites";
    }else if(!cookie.includes(":" + e.target.value + ":")) {
        setCookie("favorites", cookie + e.target.value + ":");
        e.target.innerText = "Remove " + e.target.value + " of favorites";
    }else {
        e.target.innerText = "Add " + e.target.value + " as favorites";
        cookie = cookie.substring(0, cookie.indexOf(":" + e.target.value + ":")) + cookie.substring(cookie.indexOf(":" + e.target.value + ":") + e.target.value.length + 1, cookie.length);
        setCookie("favorites", cookie, 100000);

        for(let data of dataList.children) {
            if(data.innerText == e.target.value.toUpperCase()) {
                dataList.removeChild(data);
                continue;
            }

            if(data.innerText.toUpperCase() == e.target.value.toUpperCase()) {
                data.hidden = false;
            }
        }

        return;
    }
    // do this if stop is add

    for(let data of dataList.children) {
        if(data.innerText.toUpperCase() == e.target.value.toUpperCase()) {
            data.hidden = true;
            data.innerText = data.innerText.toUpperCase();
            let offset;
            if(cookie == null || cookie == undefined || cookie == "")
                offset = 0;
            else
                offset = cookie.split(":").length-2;

            dataList.insertBefore(data, dataList.children[offset]);
        }
    }
}

placeDefaultRouteName();


getAlert();
setInterval(getAlert, 30000);
