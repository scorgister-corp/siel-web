const API_HOST = "https://api.mtp.scorgister.net";
//const API_HOST = "http://localhost:8000";
//const API_HOST = "http://192.168.0.13:8000";

function sendPost(url, body, response = function() {}) {
    let headers = {'Content-Type': 'application/json', 'X-Application-UID': getUID()};

    fetch(API_HOST + url, {
        method: 'POST',
        headers: headers,
        body: JSON.stringify(body)
    }).then(response => response.json())
    .then(data => response(true, data));
}

function sendGet(url, response = function() {}) {
    let headers = {'X-Application-UID': getUID()};

    fetch(API_HOST + url, {
        method: 'GET',
        headers: headers
    }).then(response => response.json())
    .then(data => response(true, data));
}

function getUID() {
    let uid = localStorage.getItem("uid");
    if(uid == null) {
        let uid = generateUniqueId();
        localStorage.setItem("uid", uid);
    }

    return uid;
}

function generateUniqueId() {
    return 'id-' + Date.now().toString(16) + '-' + Math.random().toString(16).substring(2, 5);
}

function getCookie(cname) {
    let name = cname + "=";
    let decodedCookie = decodeURIComponent(document.cookie);
    let ca = decodedCookie.split(';');
    for(let i = 0; i < ca.length; i++) {
        let c = ca[i];
        while(c.charAt(0) == ' ')
            c = c.substring(1);

        if(c.indexOf(name) == 0)
            return c.substring(name.length, c.length);
    }

    return undefined;
}

function setCookie(name, value, days) {
    var expires = "";
    if(days) {
        var date = new Date();
        date.setTime(date.getTime() + (days*24*60*60*1000));        
        expires = "; expires=" + date.toUTCString();
    }
    document.cookie = name + "=" + (value || "")  + expires + "; path=/";
}

function eraseCookie(name) {
    document.cookie = name + '=; Max-Age=0'
}

const validateEmail = (email) => {
    return String(email)
      .toLowerCase()
      .match(
        /^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|.(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/
      );
  };

String.prototype.noaccent = function(){
    var accent = [
        /[\300-\306]/g, /[\340-\346]/g, // A, a
        /[\310-\313]/g, /[\350-\353]/g, // E, e
        /[\314-\317]/g, /[\354-\357]/g, // I, i
        /[\322-\330]/g, /[\362-\370]/g, // O, o
        /[\331-\334]/g, /[\371-\374]/g, // U, u
        /[\321]/g, /[\361]/g, // N, n
        /[\307]/g, /[\347]/g, // C, c
    ];
    var noaccent = ['A','a','E','e','I','i','O','o','U','u','N','n','C','c'];
     
    var str = this;
    for(var i = 0; i < accent.length; i++){
        str = str.replace(accent[i], noaccent[i]);
    }
     
    return str;
}

String.prototype.countocc = function(characterToCount) {
    let count = 0;
  
    for(let i = 0; i < this.length; i++) {
        if(this[i] === characterToCount) {
            count++;
        }
    }
  
    return count;
}

function hash(string) {
    return digest("sha-256", string)
}