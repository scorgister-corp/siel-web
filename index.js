const server = require('./server');
const fs = require("fs");

if(!fs.existsSync("./session.json")) {
    fs.writeFileSync("./session.json", JSON.stringify([]));
}

const sessions = JSON.parse(fs.readFileSync("./session.json"));

let paths = [];

let ids = {};

for(let session of sessions) {
   // if(!paths.includes(session.path.toUpperCase())) {
    new server.WWWHandler("/" + session.id + "/", session.secure, session.path);
       // paths.push(session.path.toUpperCase());
    //}
    ids[session.id] = {name: session.name, description: session.description};
}


let sessionsHandler = new server.Handler("/sessions");
sessionsHandler.doGet = (req, res) => {
    sessionsHandler.send(res, ids);
}

let sessionHandler = new server.Handler("/session");
sessionHandler.doPost = (req, res) => {
    sessionHandler.readJSONBody(req, (error, data) => {
        let sess = data.session;
        if(error || sess== undefined || sess == "" || !Object.keys(ids).includes(sess)) {
            sessionHandler.send400(res);
            return;
        }

        for(let s of sessions) {
            if(s.id == sess) {
                sessionHandler.send(res, s.variables);
                return;
            }
        }

        sessionHandler.send400(res);
    });
}


new server.WWWHandler("/", false, "./www/root/");

server.start("::", 8100, false);

