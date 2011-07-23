
var http = require('http');
var path = require('path');
var fs = require('fs');

var config = require('../config/config.defaults.js');

http.createServer(FileServer).listen(config.jsFileServerPort, null, function() {
    console.log('JS file server listening for requests on port '+config.jsFileServerPort+'.');
});


function FileServer(req, res) {
    var jsFileServerBaseDir = path.normalize(config.jsFileServerBaseDir);
    var requestedFile = path.join(jsFileServerBaseDir, req.url);
    
    /* File must exist and must be located inside the jsFileServerBaseDir */
    if (path.existsSync(requestedFile) && requestedFile.indexOf(jsFileServerBaseDir) === 0) {
        fs.readFile(requestedFile, function(err, data) {
            if (err) {
                res.writeHead(500, {"Content-Type": "text/plain"});
                res.end('INTERNAL SERVER ERROR');
            } else {
                res.writeHead(200, {"Content-Type": "application/javascript"});
                res.end(data);
            }
        });
    } else {
        res.writeHead(404, {'Content-Type': 'text/plain'});
        res.end('NOT FOUND');
    }
}

