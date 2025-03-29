let headers = {'Content-Type': 'application/json'};

function startSession() {};

let sessionId = window.location.pathname;
sessionId = sessionId.substring(1, sessionId.lastIndexOf("/"));

fetch("/session", {
    method: 'POST',
    headers: headers,
    body: JSON.stringify({session: sessionId})
}).then(response => response.json())
.then(data => {
    
    for(let key of Object.keys(data)) {
        window.sessionStorage.setItem(key, data[key]);
    }

    startSession();
});
