const urlParams = new URLSearchParams(window.location.search);

var TRIP_ID = undefined;

function load() {
    if(urlParams.get("vehiculeid") == null || urlParams.get("vehiculeid") == "") {
        alert("vehicule id not foud");
        window.location = "index.html";
    }

    sendPost("/info", {vehicule_id: urlParams.get("vehiculeid")}, (success, result) => {
        if(result == null) {
            alert("vehicule not foud");
            window.location = "index.html";
            return;
        }

        document.getElementById("title").innerText = result["Numéro"];

        document.getElementById("model").innerText = result["Constructeur"] + " " + result["Modèle"];
        document.getElementById("livre").innerText = result["Livrée"];
        document.getElementById("comp").innerText = result["Infos complémentaires"];
        document.getElementById("long").innerText = result["Longueur"];
        document.getElementById("circu").innerText = result["Mise en circulation"];
        document.getElementById("alim").innerText = result["Alimentation"];
        document.getElementById("status").innerText = result["Statut"];
        document.getElementById("ecar").innerText = result["Écartement"];

        result["Composition"].forEach(elt => {
            var d = document.createElement("div");
            d.setAttribute("class", "comp-item");
            var s = document.createElement("span");
            s.setAttribute("class", "comp-item-info");
            s.innerText = elt;

            d.appendChild(s);
            document.getElementById("composition").appendChild(d);
        });

        document.getElementById("trip").innerHTML = "";

        if(!result["trip_id"]) {
            var s = document.createElement("span");
            s.setAttribute("class", "trip-title");
            s.innerText = "Pas de voyage en cours";
            document.getElementById("trip").appendChild(s)
            return;
        }
        TRIP_ID = result["trip_id"];
        updateTrip();
        setInterval(updateTrip, 6000);
    });
}

function updateTrip() {
    if(TRIP_ID == undefined)
        return;

    sendGet("/trip?tripid=" + TRIP_ID, (success, result) => {
        document.getElementById("trip").innerHTML = "";
        if(result == [] || result == null || result.length == 0) {
            var span = document.createElement("span");
            span.setAttribute("class", 'trip-title');

            span.innerText = "Voyage terminé";

            document.getElementById("trip").appendChild(span);
            return;
        }
        var title = document.createElement("span");
        var a = document.createElement("a");
        var span = document.createElement("span");
        a.setAttribute("class", "trip-title");
        span.setAttribute("class", "trip-data");
        title.innerText = result[0].station_name + " - " + result[result.length-1].station_name;

        a.href = "line.html?tripid=" + TRIP_ID;

        var th = document.createElement("span");
        var td = document.createElement("span");

        th.setAttribute("class", "trip-bold");
        td.setAttribute("class", "trip-station");
        for(var i = 0; i < result.length; i++) {
            if(result[i].state == 0) {
                th.innerText = "A quai: ";
                td.innerText = result[i].station_name;
                break;
            }

            if(result[i].state == 1) {
                if(i == 0) {
                    th.innerText = "Départ: ";
                    td.innerText = result[0].station_name;
                }else {
                    th.innerText = "Prochain arret: ";
                    td.innerText = result[i].station_name;
                }
                break;
            }
        }

        span.appendChild(th);
        span.appendChild(td);

        a.appendChild(title);
        document.getElementById("trip").appendChild(a);
        document.getElementById("trip").appendChild(document.createElement("br"));
        document.getElementById("trip").appendChild(span);
    });
}

load();