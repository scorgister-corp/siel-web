const http = require("http");
const mime = require("mime");
const fs = require("fs");
const Handler = require("./handler");

var beta = false;

const requestListener = function(req, res) {
    const method = req.method;
    const endPoint = req.url

    const handler = Handler.getHandler(endPoint);
    if(handler == undefined) {
        res.statusCode = 404;
        res.end();
        return;
    }

    handler._doSomething(req, res, method);
    
}
function start(host, port, isBeta=false) {
    beta = isBeta;
    const server = http.createServer(requestListener)
    server.listen(port, host, () => {
        console.log(`Server listening on http://${host}:${port}`);
    });
}

class WWWHandler extends Handler {
    /**
     * betaBannerPath is relative to defaultRep
     * @param {String} endPoint 
     * @param {Boolean} tokenable 
     * @param {String} defaultRep 
     * @param {String} betaBannerPath 
     */
    constructor(endPoint, tokenable, defaultRep = "./www/", betaBannerPath = "../beta-banner.html") {
        super(endPoint, tokenable);
        this.defaultRep = defaultRep;
        if(fs.existsSync(defaultRep + betaBannerPath))
            this.betaBanner = fs.readFileSync(defaultRep + betaBannerPath);
        else
            this.betaBanner = "";
    }

    doGet(req, res) {
        var endPoint = req.url.substring(this.endPoint.length);
        if(endPoint == "")
            endPoint = "index.html";

        endPoint = decodeURI(endPoint);
            
        endPoint = endPoint.split("?")[0];
        
        try {
            this.sendFile(res, endPoint);
            return;
        }catch(e) {
            this.send404(res);
            return;
        }
    }

    doPost(req, res) {
        this.doGet(req, res);
    }

    send404(res) {
        if(fs.existsSync("404.html")) {
            this.sendFile(res, "404.html", 404);
        }else
            super.send404(res);
    }

    send401(res) {
        if(fs.existsSync("401.html")) {
            this.sendFile(res, "401.html", 401);
        }else {
            super.send401(res);
        }
    }

    sendFile(res, filePath, statusCode = 200) {
        try {
            var bufferFile = fs.readFileSync(this.defaultRep + filePath);
            var mimeType = mime.getType(filePath);

            if(beta && mimeType == "text/html") {
                var a = "";
                var b = "";
                if(bufferFile.toString().indexOf("<body>") > 0) {
                    var bufStrSplit =  bufferFile.toString().split("<body>");
                    a = bufStrSplit[0];
                    b = "";
                    
                    for(var i = 1; i < bufStrSplit.length; i++)
                        b += "<body>" + bufStrSplit[i];
                }else
                    b = bufferFile.toString();
                
                bufferFile = a + this.betaBanner + b;
            }

            this.send(res, bufferFile, statusCode, mimeType, true);
        }catch(e) {            
            this.send404(res);
        }
    }

}

module.exports.start = start;
module.exports.WWWHandler = WWWHandler;
module.exports.Handler = Handler;