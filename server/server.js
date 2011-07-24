
var http = require('http');

var config = require('../config/config.defaults.js');

function run() {
    /* Server for web service ports and debugger UI */
    http.createServer(AardwolfServer).listen(config.serverPort, null, function() {
        console.log('Server listening for requests on port '+config.serverPort+'.');
    });
}


var evals = [];

function AardwolfServer(req, res) {
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Headers', 'Origin, Content-Type');
    res.setHeader('Access-Control-Allow-Methods', 'POST, GET, OPTIONS');
    res.setHeader('Access-Control-Allow-Credentials', 'true');
    
    if (req.method == 'OPTIONS') {
        res.end();
        return;
    }
    
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
                    data: { '/sample1.js': { 5: true } }
                }));
                
                break;
                
            case '/breakpoint':
                // TODO: do not continue automatically
            
                res.writeHead(200, { 'Content-Type': 'application/json' });
                var ev = evals.shift();
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

module.exports.run = run;
