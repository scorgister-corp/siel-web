const server = require('./server');

new server.WWWHandler("/siel/", false, "./www/siel/");
new server.WWWHandler("/", false, "./www/root/");
server.start("::", 8100, false);

