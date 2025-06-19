var semiCol = false;

var possibleStopNames = [];

var stopName = "";
var directions = {};

var alerts = {};

var localAlertIds = [];

var displayAlertSchedule = [];
var displayAlert = false;

var freezAlert = false;

var HIGHLIGHT_ID = undefined;
var FIRST_LOAD = true;

var ASSETS_URL = "/";

const AUDIO_URL = "sound/";
const AUDIO_FORMAT = ".mp3";

var audioHistory = [];

var transportName = undefined;
var stationName = undefined;


function calcAlertDuration(textAlert) {
    return (textAlert.length * 15 / 80);
}

function getAllDirections() {
    let dirs = [];
    for(let route in directions)
        if(!dirs.includes(directions[route]))
            dirs.push(directions[route]);
    return dirs;
}

function getDirections(routeId) {
    let dirs = [];
    if(directions[routeId] != undefined)
        dirs = directions[routeId];
    return dirs;
}

function getAllRoutes() {
    return Object.keys(directions);
}

function getAlert() {
    if(getAllDirections().length == 0) {
        return;
    }

    sendPost("/alert", {line: getAllRoutes()}, (success, result) => {
        if(!success) {
            console.log("Error [-1]");
            return;
        }

        let ids = [];
        result.forEach(elt => {
            let text = "Ligne " + elt.route_short_name + ": " + elt.text;
            let duration = calcAlertDuration(text);

            if(alerts[elt.alert_id] == undefined) {
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
        setAlert();
    }
}

function setAlert() {
    let p = document.getElementById("marquee-rtl");

    let id = displayAlertSchedule.shift();
    
    while(alerts[id] === undefined && displayAlertSchedule.length > 0)
        id = displayAlertSchedule.shift();
    
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
        setAlert();
    }

    div.innerText = alert.text;    
    
    p.innerText = "";
    p.appendChild(div);
    animation.play();
    displayAlert = true;
}

function updateStatusAlert(upt) {
    isUpdateDisplay = upt;
}

function removeAlert(alertId) {
    alerts[alertId] = undefined;
}

function updateInfos() {
    getInfos();
}

function getInfos() {
    if(stopName == undefined || getAllDirections().length == 0)
        return;

    sendPost("/data", {stop_name: stopName, directions: directions}, (success, result) => {        
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
                if(element["route_short_name"] == undefined)
                    return;

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
        document.getElementById("dest-min").innerText = destinationMin + (getAllRoutes().length>1?(" (" + nameMin + ")"):"");
        if(result[0].modified)
            document.getElementById("dest-min").classList.add("modified");
        else 
            document.getElementById("dest-min").setAttribute("class", "");

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
        document.getElementById("time-1").setAttribute("title", (v1ID==null?"aucun véhicule attribué":v1ID));
        document.getElementById("time-1-link").setAttribute("href", "line.html?api=" + window.sessionStorage.getItem("API_HOST") + "&tripid=" + result[0]["trip_id"]);
        
        if(result.length > 1) {
            var destinationMax = result[1]["trip_headsign"];
            var nameMax = result[1]["route_short_name"];
            
            document.getElementById("dest-max").innerText = destinationMax + (getAllRoutes().length>1?(" (" + nameMax + ")"):"");
            if(result[1].modified)
                document.getElementById("dest-max").classList.add("modified");
            else 
                document.getElementById("dest-max").setAttribute("class", "");

            timeMax = result[1]["departure_time"] + "000";
            var tMax = new Date(Number(timeMax));

            var diffMax = dateDiff(new Date(), tMax);
            if(diffMax.hour > 0)
                document.getElementById("time-max").innerText = (result[1].theoretical?"*":"") + "+60";
            else
                document.getElementById("time-max").innerText = (result[1].theoretical?"*":"") + diffMax.min;

            var v2ID = result[1]["vehicle_id"];
            document.getElementById("time-2").setAttribute("title", (v2ID==null?"no vehicle assigned":v2ID));
            document.getElementById("time-2-link").setAttribute("href", "line.html?api=" + window.sessionStorage.getItem("API_HOST") + "&tripid=" + result[1]["trip_id"]);

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
                mainA.setAttribute("href", "line.html?api=" + window.sessionStorage.getItem("API_HOST") + "&tripid=" + result[i]["trip_id"]);

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
                if(result[i].modified)
                   destinationSpan.classList.add("modified");
                else
                    destinationSpan.setAttribute("class", "");

                if(FIRST_LOAD && HIGHLIGHT_ID != undefined && result[i].trip_id == HIGHLIGHT_ID) {
                    mainDiv.classList.add("highlight")
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
                    mainDiv.setAttribute("title", (vID==null?"aucun véhicule attribué":vID));
                }catch(e) {
                    console.log(e);  
                }
                mainA.appendChild(mainDiv);
                document.getElementById("other").appendChild(mainA);
            }

            var mainDiv = document.createElement("div");
            mainDiv.setAttribute("class", "other-container");

            var but = document.createElement("button");
            if(localStorage.getItem("favorites") == null || !JSON.parse(localStorage.favorites).includes(stopName))
                but.innerText = "Ajouter " + stopName + " aux favoris";
            else
                but.innerText = "Supprimer " + stopName + " des favoris";
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
        var audio = new Audio(ASSETS_URL + AUDIO_URL + "D" + gender + destinationMin.toUpperCase() + "2" + AUDIO_FORMAT);
        audio.onended = (e) => {
            if(next == undefined)
                return;

            diff = dateDiff(new Date(), new Date(Number(next.departure_time + "000")));
            if(diff.day > 0 || diff.hour > 0)
                return;
    
            
            var audio = new Audio(ASSETS_URL + AUDIO_URL + "N" + gender + diff.min + AUDIO_FORMAT);
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
    directions = {};
    clear();
    
    if(alerts[0] != undefined) {
        return;
    }
    
    clearAlert();
    let allRoute = getAllRoutes();

    let text = "La " + stationName + " " + stopName + " n'est actuellement pas desservie";
    if(allRoute !== undefined && allRoute.length > 0) {
        if(allRoute.length == 1) {
            text += " par la ligne " + allRoute[0]
        }else {
            text += " par les lignes " + allRoute[0];
            for(let i = 1; i < allRoute.length-1; i++)
                text += ", " + allRoute[i];
            text += " et " + allRoute[allRoute.length-1];
        }
    }

    let allDirections = getAllDirections();

    if(allDirections !== undefined && allDirections.length > 0) {
        if(allDirections.length == 1) {
            text += " en direction de " + allDirections[0]
        }else {
            text += " en direction de " + allDirections[0];
            for(let i = 1; i < allDirections.length-1; i++)
                text += ", " + allDirections[i];
            text += " et " + allDirections[allDirections.length-1];
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
        if(result === undefined || Object.keys(result) == 0) {
            showNonDesservie(stopName);
            return;
        }

        document.getElementById("panel-body").innerText = "";
        document.getElementById("select-text").innerText = "Où voulez-vous aller depuis: " + stopName;

        if(e == null)
            directions = {};

        let routes = [];
        for(let stopName in result) {
            for(let i = 0; i < result[stopName].length; i++)
                if(!routes.includes(result[stopName][i].id)) {
                    routes.push(result[stopName][i].id);
                    
                    let routeDiv = document.createElement("div");
                    routeDiv.setAttribute("class", "panel-body");
                    if(result[stopName][i].id === undefined || result[stopName][i].id === "")
                        routeDiv.id = "empty";
                    else
                        routeDiv.id = result[stopName][i].id;

                    let routeTitle = document.createElement("span");
                    routeTitle.setAttribute("class", "panel-elt-title");
                    routeTitle.onclick = (e) => {

                        for(let i = 0; i < e.target.parentElement.childElementCount; i++) {
                            if(e.target.parentElement.children[i] == e.target && i < e.target.parentElement.childElementCount - 1) {
                                let status = "0";
                                for(let elt of e.target.parentElement.children[i+1].children) {
                                    if(elt.getAttribute("class").includes("dest-0")) {
                                        status = "1";
                                        break;
                                    }
                                }
                                for(let elt of e.target.parentElement.children[i+1].children) {
                                    elt.setAttribute("class", "panel-elt dest-" + status);
                                }
                                
                            }
                        }
                        
                    };
                    routeTitle.innerText = result[stopName][i].long_name;
                    if(![undefined, ""].includes(result[stopName][i].short_name))
                        routeTitle.innerText += " (" + result[stopName][i].short_name + ")";

                    document.getElementById("panel-body").appendChild(routeTitle);
                    document.getElementById("panel-body").appendChild(routeDiv);
                }
        }

        for(let stationName in result) {
            let stationRoutes = result[stationName];
            
            for(let route of stationRoutes) {
                let div = document.createElement("div");
                div.setAttribute("class", "panel-elt dest-0");
                div.id = stationName;

                div.onclick = onclickDest;
                
                if(e != null && getDirections(route.id==""?"empty":route.id).includes(stationName) && (route.id == "" || getAllRoutes().includes(route.id)))
                    div.setAttribute("class", "panel-elt dest-1");

                let label = document.createElement("span");
                label.innerText = stationName;

                div.appendChild(label);
                if(route.id === undefined || route.id === "")
                    document.getElementById("empty").appendChild(div);
                else
                    document.getElementById(route.id).appendChild(div);
            }
        }

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
        directions = {};

        let count = 0;
        for(let i = 0; i < document.getElementById("panel-body").childElementCount; i++) {
            let routeElt = document.getElementById("panel-body").children[i];
            for(let j = 0; j < routeElt.childElementCount; j++) {
                if(routeElt.children[j].getAttribute("class").includes("dest-1")) {
                    if(routeElt.id == "empty") {
                        if(directions["empty"] === undefined)
                            directions[routeElt.id] = [];

                        directions["empty"].push(routeElt.children[j].id);
                    }else {
                        if(directions[routeElt.id] === undefined)
                            directions[routeElt.id] = [];

                        directions[routeElt.id].push(routeElt.children[j].id);
                    }

                    count++;
                }
            }
        }
        
        if(count == 0) {
            alert("Vous devez sélectionner au moins une destination !")
            return;    
        }

    }else {
        if(getAllDirections() == undefined || getAllDirections().length == 0) {
            alert("Vous devez sélectionner au moins une destination !")
            return;
        }
    }
    
    document.getElementById("alert-panel").hidden = true;
    document.getElementById("alert-bg").hidden = true;

    clear();
    clearAlert();

    //analytics endpoint
    sendPost("/choose", {stop_name: stopName, directions: directions}, (success, result) => {});

    updateInfos();
    getAlert();
}

function clear() {
    if(document.getElementById("header") != undefined) { 
        document.getElementById("header").setAttribute("class", "");
        document.getElementById("header").setAttribute("style", "");
        placeDefaultRouteName();
    }

    document.getElementById("dest-min").innerText = "?";
    document.getElementById("dest-max").innerText = "?";

    document.getElementById("time-min").innerText = "?";
    document.getElementById("time-max").innerText = "?";
    if(document.getElementById("other") != undefined)
        document.getElementById("other").innerText = "";

    document.getElementById("time-1-link").href = "#";
    document.getElementById("time-2-link").href = "#";

    document.getElementById("panel-body").innerText = "";
    document.getElementById("select-text").innerText = "";
}

function placeDefaultRouteName() {
    if(document.getElementById("routes") == undefined)
        return;

    document.getElementById("routes").innerText = "";
    let span = document.createElement("span");
    span.setAttribute("class", "route-name");
    span.innerText = "?";
    document.getElementById("routes").appendChild(span);
}

function clearAlert() {
    displayAlert = false;

    let marquee = document.getElementById("marquee-rtl");
    
    if(marquee.firstElementChild != undefined) {
        let animations = marquee.firstElementChild.getAnimations();
        if(animations.length > 0) {
            for (let i = 0; i < animations.length; i++) {
                const anim = animations[i];
                anim.onfinish = (e) => {};
            }
        }
    }

    marquee.innerText = "";
    marquee.hidden = true;

    alerts = {};
    displayAlertSchedule = [];
}

function loadClientInfos(callBack) {
    sendGet("/clientinfos", (success, result) => {
        if(Object.keys(result).length == 0) {
            console.error("Error [2]");
            return;
        }

        ASSETS_URL = result.assets_url;

        transportName = result.transport_name;
        stationName = result.station_name;

        if(document.getElementById("transport-type-1") != undefined && document.getElementById("transport-type-2") != undefined) {
            document.getElementById("transport-type-1").innerText = transportName;
            document.getElementById("transport-type-2").innerText = transportName;
        }
       
        callBack();
    });
}

function load(type, callBack) {
    if(type == 2)
        return;

    loadClientInfos(() => {
        sendGet("/stops", (success, res) => {
            if(res == null || res.length <= 0) {
                console.log("Error [1]");
                return
            }
    
            document.getElementById("stop-names").innerHTML = "";
    
            var favs = localStorage.getItem("favorites");
            if(favs != null) {
                favs = JSON.parse(favs);
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
                if(favs !== null && favs.includes(res[i])) {
                    opt.hidden = true;
                }
                    
                opt.innerText = res[i];
                opt.value = res[i];
    
                document.getElementById("stop-names").appendChild(opt);
                possibleStopNames.push(res[i]);
            }
    
            document.getElementById("stop-selection").placeholder = "Sélectionnez votre " + stationName;
            document.getElementById("stop-selection").disabled = false;

            if(callBack != undefined) {
                callBack();
            }
        });
    });
}

function clearAudioHistory() {
    if(audioHistory.length < 10)
        return;

    audioHistory.splice(0, audioHistory.length - 2);
}

function favAction(e) {
    let dataList = document.getElementById("stop-names");
    
    let favorites = [];
    if(localStorage.getItem("favorites") == null) {
        favorites.push(e.target.value);
    }else {
        favorites = JSON.parse(localStorage.favorites);
        for(let i = 0; i < favorites.length; i++) {
            if(favorites[i] == e.target.value) {
                favorites.splice(i, 1);
                localStorage.setItem("favorites", JSON.stringify(favorites));
                e.target.innerText = "Ajouter " + e.target.value + " aux favoris";

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
        }
        favorites.push(e.target.value);
    }
    
    localStorage.setItem("favorites", JSON.stringify(favorites));
    e.target.innerText = "Supprimer " + e.target.value + " des favoris";

    for(let data of dataList.children) {
        if(data.innerText.toUpperCase() == e.target.value.toUpperCase()) {
            data.hidden = true;
            data.innerText = data.innerText.toUpperCase();
            let offset = favorites.length - 1;
            dataList.insertBefore(data, dataList.children[offset]);
        }
    }
}

placeDefaultRouteName();


getAlert();
setInterval(getAlert, 30000);
