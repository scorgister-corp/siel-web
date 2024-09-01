const server = require('./server');

new server.WWWHandler("/siel/", false, "./www/siel/");
server.start("::", 8100, false);

