
var fs = require('fs');
var path = require('path');
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


function getJSFilesList() {
    var jsFiles = [];
    var baseDir = path.normalize(config.jsFileServerBaseDir);
    
    function walk(dir) {
        var fileList = fs.readdirSync(dir);
        fileList.forEach(function(f) {
            var fullPath = path.join(dir, f);
            var stat = fs.statSync(fullPath);
            if (stat.isFile()) {
                if (fullPath.substr(-3) == '.js') {
                    jsFiles.push(fullPath.substr(baseDir.length +1));
                }
            }
            else {
                walk(fullPath);
            }
        });
    }
    
    walk(baseDir);
    
    /* Unixify paths */
    jsFiles = jsFiles.map(function(f) { return f.replace(/\\/g, '/'); });
    
    return jsFiles;
}


module.exports.serveStaticFile = serveStaticFile;
module.exports.getJSFilesList = getJSFilesList;

