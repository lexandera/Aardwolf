'use strict';

/*
 * Serves source files with debug statements inserted.
 */

var http = require('http');
var path = require('path');
var fs = require('fs');
var url = require('url');

var config = require('../config/config.defaults.js');
var util = require('./server-util.js');

var multirewriter = require('../rewriter/multirewriter.js')

function run() {
    if (!fs.existsSync(config.fileServerBaseDir)) {
        console.error('ERROR: Path does not exist: ' + config.fileServerBaseDir);
        process.exit(1);
    }

    http.createServer(DebugFileServer).listen(config.fileServerPort, null, function() {
        console.log('File server listening for requests on port ' + config.fileServerPort + '.');
    });
}


function DebugFileServer(req, res) {
    var requestedFile = url.parse(req.url).pathname;
    var fileServerBaseDir = path.normalize(config.fileServerBaseDir);
    var fullRequestedFilePath = path.join(fileServerBaseDir, requestedFile);

    
    /* alias for serving the debug library */
    if (requestedFile.toLowerCase() == '/aardwolf.js') {
        util.serveStaticFile(res, path.join(__dirname, '../js/aardwolf.js'));
    }
    /* File must exist and must be located inside the fileServerBaseDir */
    else if (fs.existsSync(fullRequestedFilePath) &&
             fs.statSync(fullRequestedFilePath).isFile() &&
             fullRequestedFilePath.indexOf(fileServerBaseDir) === 0)
    {
        if (multirewriter.isRewritable(requestedFile)) {
            var processedFile = multirewriter.getRewrittenContent(requestedFile);
            res.writeHead(200, {'Content-Type': 'application/javascript'});
            res.end(processedFile.file);
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
