
var http = require('http');
var path = require('path');
var fs = require('fs');

var config = require('../config/config.defaults.js');
var jsrewriter = require('../jsrewriter/jsrewriter.js');

function run() {
    if (!path.existsSync(config.jsFileServerBaseDir)) {
        console.error('ERROR: Path does not exist: ' + config.jsFileServerBaseDir);
        process.exit(1);
    }
    
    /* Serves JS files with debug statements inserted */
    http.createServer(DebugFileServer).listen(config.jsFileServerPort, null, function() {
        console.log('JS file server listening for requests on port '+config.jsFileServerPort+'.');
    });
}


function DebugFileServer(req, res) {
    var requestedFile = req.url;
    var jsFileServerBaseDir = path.normalize(config.jsFileServerBaseDir);
    var fullRequestedFilePath = path.join(jsFileServerBaseDir, requestedFile);
    
    /* alias for serving the debug library */
    if (requestedFile.toLowerCase() == '/aardwolf.js') {
        var js = fs.readFileSync(path.join(__dirname, '../js/aardwolf.js'))
            .toString()
            .replace('__SERVER_HOST__', config.serverHost)
            .replace('__SERVER_PORT__', config.serverPort);
        
        res.writeHead(200, {'Content-Type': 'application/javascript'});
        res.end(js);
    }
    /* File must exist and must be located inside the jsFileServerBaseDir */
    else if (path.existsSync(fullRequestedFilePath) &&
             fullRequestedFilePath.indexOf(jsFileServerBaseDir) === 0)
    {
        var content = fs.readFileSync(fullRequestedFilePath).toString();
        if (requestedFile.substr(-3) == '.js') {
            content = jsrewriter.addDebugStatements(requestedFile, content);
            res.writeHead(200, {'Content-Type': 'application/javascript'});
        } else if (requestedFile.substr(-4) == '.html') {
            res.writeHead(200, {'Content-Type': 'text/html'});
        }
        res.end(content);
    }
    else {
        res.writeHead(404, {'Content-Type': 'text/plain'});
        res.end('NOT FOUND');
    }
}


module.exports.run = run;
