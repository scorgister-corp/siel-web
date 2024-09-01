var semiCol = false;

var stopName = "";
var destinations = [];

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

function updateInfos() {
    getInfos(stopName, destinations);
}

function getInfos(stopName, direction) {
    if(stopName == undefined || direction.length == 0)
        return;

    sendPost("/data", {stop_name: stopName, direction: direction}, (success, result) => {
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

        document.getElementById("routes").innerText = "";
        routes.forEach(element => {
            var spanRoute = document.createElement("span");
            spanRoute.setAttribute("class", "route-name route-" + element)
            spanRoute.innerText = element;

            
            document.getElementById("routes").appendChild(spanRoute);
        });

        if(routes.length > 0) {
            document.getElementById("header").setAttribute("class", "header-" + routes[0])
        }

        load(1);

        document.getElementById("dest-min").innerText = destinationMin + " (" + nameMin + ")";
        
        var timeMin = result[0]["departure_time"].split(":");
        var timeMax = undefined;

        var tMin = new Date();
        if(timeMin[0] < tMin.getHours())
            tMin.setDate(tMin.getDate() + 1);
        tMin.setHours(timeMin[0]);
        tMin.setMinutes(timeMin[1]);
        tMin.setSeconds(timeMin[2]);

        var diffMin = dateDiff(new Date(), tMin);
        if(diffMin.hour > 0)
            document.getElementById("time-min").innerText = "+60";
        else
            document.getElementById("time-min").innerText = diffMin.min;
        
        var tMax = new Date();
        if(result.length > 1) {
            var destinationMax = result[1]["trip_headsign"];
            var nameMax = result[1]["route_short_name"];

            document.getElementById("dest-max").innerText = destinationMax + " (" + nameMax + ")";

            timeMax = result[1]["departure_time"].split(":");
            
            if(timeMin[0] < tMax.getHours())
                tMax.setDate(tMax.getDate() + 1);
            tMax.setHours(timeMax[0]);
            tMax.setMinutes(timeMax[1]);
            tMax.setSeconds(timeMax[2]);

            var diffMax = dateDiff(new Date(), tMax);
            if(diffMax.hour > 0)
                document.getElementById("time-max").innerText = "+60";
            else
                document.getElementById("time-max").innerText = diffMax.min;
        }else {
            document.getElementById("time-max").innerText = "+60";
        }

        document.getElementById("other").innerText = "";

        for(var i = 2; i < result.length; i++) {
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

            var time = result[i]["departure_time"].split(":");

            var t = new Date();
            if(time[0] < t.getHours())
                t.setDate(tMin.getDate() + 1);
            t.setHours(time[0]);
            t.setMinutes(time[1]);
            t.setSeconds(time[2]);
    
            var diff = dateDiff(new Date(), t);

            var spanTime = document.createElement("span");
            if(diff.hour > 0) {
                if(diff.min.toString().length == 1)
                    diff.min = "0" + diff.min
                spanTime.innerHTML = diff.hour + "<sub>h</sub>" + diff.min;
            }else {
                spanTime.innerHTML = diff.min + "<sub>min</sub>";
            }
            mainDiv.appendChild(divLeft);
            mainDiv.appendChild(spanTime);

            document.getElementById("other").appendChild(mainDiv);

        }
        
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
    loadAlertPanel();
}

function loadAlertPanel(e) {
    sendPost("/directions", {stop_name: stopName}, (success, result) => {
        document.getElementById("panel-body").innerText = "";
        document.getElementById("select-text").innerText = "Select your destination(s) from: " + stopName;

        if(e == null)
            destinations = [];
        
        result.forEach(element => {
            var div = document.createElement("div");
            div.setAttribute("class", "panel-elt");

            var inp = document.createElement("input");
            inp.setAttribute("type", "checkbox");
            inp.setAttribute("name", element);
            inp.setAttribute("value", element);
            inp.id = element;

            if(e != null && destinations.includes(element))
                inp.checked = true;

            var lab = document.createElement("label");
            lab.setAttribute("for", element);
            lab.innerText = element;

            div.appendChild(inp);
            div.appendChild(lab);

            document.getElementById("panel-body").appendChild(div);
        });
        document.getElementById("alert-panel").hidden = false;
        document.getElementById("alert-bg").hidden = false;
    });
}

function updateDirections(e) {
    destinations = [];
    var count = 0;
    for(var i = 0; i < document.getElementById("panel-body").childElementCount; i++) {
        var elt = document.getElementById("panel-body").children[i];
        if(elt.children[0].checked) {
            destinations.push(elt.children[0].value);
            count++;
        }
    }

    if(count == 0) {
        alert("You must select at least one destination !")
        return;    
    }
    
    document.getElementById("alert-panel").hidden = true;
    document.getElementById("alert-bg").hidden = true;
    updateInfos();
}

function load(type) {
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

load(0);

document.getElementById("stop-selection").onchange = changeStation;
document.getElementById("select-btn").onclick = updateDirections;
document.getElementById("routes").onclick = loadAlertPanel
updateClock();
//updateStation("Charles de Gaulle");

setInterval(updateClock, 500);
setInterval(updateInfos, 10000);

