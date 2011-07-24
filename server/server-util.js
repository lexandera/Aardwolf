
var fs = require('fs');
var config = require('../config/config.defaults.js');

function serveStaticFile(res, filename) {
    var fdata = fs.readFileSync(filename)
        .toString()
        .replace(/__SERVER_HOST__/g, config.serverHost)
        .replace(/__SERVER_PORT__/g, config.serverPort)
        .replace(/__JS_FILE_SERVER_PORT__/g, config.jsFileServerPort);
    
    var ext = filename.split('.').reverse()[0];
    var ct = ext == 'js'   ? 'application/javascript' :
             ext == 'css'  ? 'text/css' :
             ext == 'html' ? 'text/html' :
             'text/plain';
    
    res.writeHead(200, { 'Content-Type': ct });
    res.end(fdata);
}

module.exports.serveStaticFile = serveStaticFile;

