var semiCol = false;

var stopName = "";
var destinations = [];
var lines = [];

var alerts = {};

var displayAlertSchedule = [];
var displayAlert = false;

var freezAlert = false;

const AUDIO_URL = "/sound/";
const AUDIO_FORMAT = ".m4a";

var audioHistory = [];

function getAlert() {
    if(lines.length == 0) {
        document.getElementById("marquee-rtl").hidden = true;
        return;
    }

    sendPost("/alert", {line: lines}, (success, result) => {
        if(!success) {
            console.log("Error [-1]");
            return;
        }

        alerts = {};
        result.forEach(elt => {
            var text = "Ligne " + elt.routeId + ": " + elt.text;
            var duration = text.length * 15 / 80;

            alerts[elt.alert_id] = {
                text: text,
                duration: duration
            };
            if(!displayAlertSchedule.includes(elt.alert_id))
                displayAlertSchedule.push(elt.alert_id);
        });

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

    while(alerts[id] == undefined && displayAlertSchedule.length > 0)
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
    div.setAttribute("style", `animation-duration: ${alert.duration}s;`);
    div.onanimationiteration = e => {
        setAlert(displayAlertSchedule.pop());
    }

    div.innerText = alert.text;

    p.innerText = "";
    p.appendChild(div);
}

function updateStatusAlert(upt) {
    isUpdateDisplay = upt;
}

function updateInfos() {
    getInfos(stopName, destinations, lines, 1);
}

function getInfos(stopName, direction, line, type) {
    if(stopName == undefined || direction.length == 0 || lines.length == 0)
        return;

    sendPost("/data", {stop_name: stopName, direction: direction, line: line}, (success, result) => {
        if(result != null && result.length <= 0) {
            console.log("Error [0]");
            return;
        }

        var destinationMin = result[0]["trip_headsign"];
        var nameMin = result[0]["route_short_name"];

        var routes = [];
        result.forEach(element => {
            if(!routes.includes(element["route_short_name"]))
                routes.push(element["route_short_name"]);
        });

        if(document.getElementById("routes") != undefined) {
            document.getElementById("routes").innerText = "";
            routes.forEach(element => {
                var spanRoute = document.createElement("span");
                spanRoute.setAttribute("class", "route-name route-" + element)
                spanRoute.innerText = element;

                
                document.getElementById("routes").appendChild(spanRoute);
            });

            if(routes.length > 0) {
                document.getElementById("header").setAttribute("class", "header-" + routes[0]);
            }

            load(type);
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

        }else {
            document.getElementById("time-max").innerText = "+60";
        }

        if(document.getElementById("other") != undefined) {
            document.getElementById("other").innerText = "";

            for(var i = 2; i < result.length; i++) {
                var mainA = document.createElement("a");
                mainA.setAttribute("href", "line.html?tripid=" + result[i]["trip_id"]);


                var mainDiv = document.createElement("div");
                mainDiv.setAttribute("class", "other-container");

                var divLeft = document.createElement("div");
                var divNum = document.createElement("div");
                divNum.setAttribute("class", "sub-count")

                var numSpan = document.createElement("span");
                numSpan.innerText = i+1;

                var e = document.createElement("sup");
                e.innerText = "e";

                var destinationSpan = document.createElement("span");
                destinationSpan.innerText = result[i]["trip_headsign"];

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

        clearAudioHistory();

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
        var audio = new Audio(AUDIO_URL + "D" + gender + destinationMin + "2" + AUDIO_FORMAT);
        audio.play();

        audioHistory.push(result[0].trip_id);
        if(next == undefined)
            return;

        diff = dateDiff(new Date(), new Date(Number(next.departure_time + "000")));
        if(diff.day > 0 || diff.hour > 0)
            return;

        setTimeout(() => {
            var audio = new Audio(AUDIO_URL + "N" + gender + diff.min + AUDIO_FORMAT);
            audio.play();
        }, 4000);
        
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

function updateStation(stop_name) {
    stopName = stop_name;
    audioHistory = [];
    displayAlert = false;
    alerts = {};
    document.getElementById("marquee-rtl").hidden = true;
    loadAlertPanel();
}

function loadAlertPanel(e) {
    sendPost("/stopdata", {stop_name: stopName}, (success, result) => {
        document.getElementById("panel-body").innerText = "";
        document.getElementById("select-text").innerText = "Select your destination(s) from: " + stopName;

        if(e == null)
            destinations = [];
        
        result.directions.forEach(element => {
            var div = document.createElement("div");
            div.setAttribute("class", "panel-elt dest-0");
            div.setAttribute("id", element);
            div.setAttribute("value", element);
            div.onclick = onclickDest;

            if(e != null && destinations.includes(element))
                div.setAttribute("class", "panel-elt dest-1");
            
            var lab = document.createElement("span");
            lab.innerText = element;

            div.appendChild(lab);

            document.getElementById("panel-body").appendChild(div);
        });

        document.getElementById("line-body").innerText = "";
        document.getElementById("line-text-head").innerText = "Using the line(s)";
    
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
    destinations = [];
    var count = 0;
    for(var i = 0; i < document.getElementById("panel-body").childElementCount; i++) {
        var elt = document.getElementById("panel-body").children[i];
        
        if(elt.getAttribute("class").includes("dest-1")) {
            destinations.push(elt.id);
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
    
    document.getElementById("alert-panel").hidden = true;
    document.getElementById("alert-bg").hidden = true;

    clear();

    updateInfos();
    getAlert();
}

function clear() {
    document.getElementById("header").setAttribute("class", "");
    document.getElementById("routes").innerText = "";

    document.getElementById("dest-min").innerText = "?";
    document.getElementById("dest-max").innerText = "?";

    document.getElementById("time-min").innerText = "?";
    document.getElementById("time-max").innerText = "?";
    document.getElementById("other").innerText = "";
}

function load(type) {
    if(type == 2)
        return;

    sendGet("/stops", (success, res) => {
        if(res == null || res.length <= 0) {
            console.log("Error [1]");
            return
        }

        document.getElementById("stop-selection").innerHTML = "";

        if(type == 0) {
            var defOpt = document.createElement("option");
            defOpt.innerText = "Select your station";
            
            document.getElementById("stop-selection").appendChild(defOpt);
        }

        var fav = getCookie("favorites");
        if(fav != null) {
            var favs = fav.split(":");
            var ok = false;

            var opt = document.createElement("option");
            opt.disabled = "true";
            opt.innerText = "----";
            document.getElementById("stop-selection").appendChild(opt);
            
            for(var i = 0; i < favs.length; i++) {
                if(favs[i] == "")
                    continue;
                var opt = document.createElement("option");
                opt.innerText = favs[i].toUpperCase();
                opt.value = favs[i];
    
                document.getElementById("stop-selection").appendChild(opt);
                ok = true;
            }
            if(ok) {
                var opt = document.createElement("option");
                opt.disabled = "true";
                opt.innerText = "----";
                document.getElementById("stop-selection").appendChild(opt);
            }
        }

        for(var i = 0; i < res.length; i++) {
            var opt = document.createElement("option");
            opt.innerText = res[i];

            document.getElementById("stop-selection").appendChild(opt);
        }

        if(stopName != undefined && stopName != "")
            document.getElementById("stop-selection").value = stopName;
        else if(type == 1)
            document.getElementById("stop-selection").value = "Select your station";

    });
}

function clearAudioHistory() {
    if(audioHistory.length < 10)
        return;

    audioHistory.splice(0, audioHistory.length - 2);
}

function favAction(e) {
    if(getCookie("favorites") == null) {
        setCookie("favorites", ":" + e.target.value + ":", 100000);
        e.target.innerText = "Remove " + e.target.value + " of favorites"
    }else if(!getCookie("favorites").includes(":" + e.target.value + ":")) {
        setCookie("favorites", getCookie("favorites") + e.target.value + ":");
        e.target.innerText = "Remove " + e.target.value + " of favorites"
    }else {
        e.target.innerText = "Add " + e.target.value + " as favorites"
        var c = getCookie("favorites");
        c = c.substring(0, c.indexOf(":" + e.target.value + ":")) + c.substring(c.indexOf(":" + e.target.value + ":") + e.target.value.length + 1, c.length);
        setCookie("favorites", c, 100000);
    }  
}


getAlert();

setInterval(getAlert, 30000);
