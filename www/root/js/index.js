
function sendGet(url, callback) {
    fetch(url, {
        method: 'GET',
    }).then(response => response.json())
    .then(data => {
        callback(data);
    });
}

function load() {
    window.sessionStorage.removeItem("session_id");

    let mainDiv = document.getElementById("main");
    sendGet("/sessions", (data) => {
        for(let sessionId in data) {
            let card = document.createElement("div");

            let title = document.createElement("span");
            let description = document.createElement("span");

            let access = document.createElement("button");

            card.setAttribute("class", "card");
            title.setAttribute("class", "card-title");
            description.setAttribute("class", "card-desc");
            access.setAttribute("class", "card-access-btn");

            title.innerText = data[sessionId].name;
            description.innerText = data[sessionId].description;
            access.innerText = "Accéder";

            access.onclick = (e) => {
                window.location = sessionId + "/index.html";
            }

            card.appendChild(title);
            card.appendChild(description);
            card.appendChild(access);
            mainDiv.appendChild(card);
        }
    });
}

load();
