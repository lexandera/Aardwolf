
var http = require('http');
var path = require('path');
var fs = require('fs');

var config = require('../config/config.defaults.js');
var jsrewriter = require('../jsrewriter/jsrewriter.js');

if (!path.existsSync(config.jsFileServerBaseDir)) {
    console.error('ERROR: Path does not exist: ' + config.jsFileServerBaseDir);
    process.exit(1);
}

/* Server for web service ports and debugger UI */
http.createServer(AardwolfServer).listen(config.serverPort, null, function() {
    console.log('Server listening for requests on port '+config.serverPort+'.');
});

/* Serves JS files with debug statements inserted */
http.createServer(DebugFileServer).listen(config.jsFileServerPort, null, function() {
    console.log('JS file server listening for requests on port '+config.jsFileServerPort+'.');
});


var evals = [];

function AardwolfServer(req, res) {
    res.setHeader('Access-Control-Allow-Origin', '*');
    
    var body = '';
    req.on('data', function (chunk) { body += chunk; });
    req.on('end', function () { processPostedData(JSON.parse(body)); });
    
    function processPostedData(data) {
        switch (req.url) {
            case '/console':
                printConsoleMessage(data);
                break;
                
            case '/init':
                // TODO: un-hardcode; get from debug ui
                evals = [{ command: 'eval', data: '7*4' },
                         { command: 'eval', data: 'x * y' },
                         { command: 'eval', data: '"foo".toUpperCase()' },
                         { command: 'eval', data: 'foo + bar' }];
                
                res.writeHead(200, { 'Content-Type': 'application/json' });
                
                // TODO: un-hardcode; get breakpoints from debug ui
                res.end(JSON.stringify({
                    command: 'set-breakpoints',
                    data: { '/sample1.js': { 3: true } }
                }));
                
                break;
                
            case '/breakpoint':
                // TODO: do not continue automatically
            
                res.writeHead(200, { 'Content-Type': 'application/json' });
                var ev = evals.pop();
                if (ev) {
                    res.end(JSON.stringify(ev));
                } else {
                    res.end('{}');
                }
                    
                break;
                
            default:
                res.writeHead(404, {'Content-Type': 'text/plain'});
                res.end('NOT FOUND');
        }
    }
    
    function printConsoleMessage(data) {
        console.log('CONSOLE ' + data.type + ': '+data.message);
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({}));
    }
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
        var js = fs.readFileSync(fullRequestedFilePath).toString();
        js = jsrewriter.addDebugStatements(requestedFile, js);
        res.writeHead(200, {'Content-Type': 'application/javascript'});
        res.end(js);
    }
    else {
        res.writeHead(404, {'Content-Type': 'text/plain'});
        res.end('NOT FOUND');
    }
}

