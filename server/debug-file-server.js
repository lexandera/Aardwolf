
var http = require('http');
var path = require('path');
var fs = require('fs');
var url = require('url');

var config = require('../config/config.defaults.js');
var jsrewriter = require('../jsrewriter/jsrewriter.js');
var util = require('./server-util.js');

function run() {
    if (!path.existsSync(config.jsFileServerBaseDir)) {
        console.error('ERROR: Path does not exist: ' + config.jsFileServerBaseDir);
        process.exit(1);
    }
    
    /* Serves JS files with debug statements inserted */
    http.createServer(DebugFileServer).listen(config.jsFileServerPort, null, function() {
        console.log('JS file server listening for requests on port ' + config.jsFileServerPort + '.');
    });
}


function DebugFileServer(req, res) {
    var requestedFile = url.parse(req.url).pathname;
    var jsFileServerBaseDir = path.normalize(config.jsFileServerBaseDir);
    var fullRequestedFilePath = path.join(jsFileServerBaseDir, requestedFile);
    
    /* alias for serving the debug library */
    if (requestedFile.toLowerCase() == '/aardwolf.js') {
        util.serveStaticFile(res, path.join(__dirname, '../js/aardwolf.js'));
    }
    /* File must exist and must be located inside the jsFileServerBaseDir */
    else if (path.existsSync(fullRequestedFilePath) &&
             fullRequestedFilePath.indexOf(jsFileServerBaseDir) === 0)
    {
        if (requestedFile.substr(-3) == '.js') {
            var content = fs.readFileSync(fullRequestedFilePath).toString();
            content = jsrewriter.addDebugStatements(requestedFile, content);
            res.writeHead(200, {'Content-Type': 'application/javascript'});
            res.end(content);
        }
        else {
            util.serveStaticFile(res, fullRequestedFilePath);
        }
    }
    else {
        res.writeHead(404, {'Content-Type': 'text/plain'});
        res.end('NOT FOUND');
    }
}


module.exports.run = run;
