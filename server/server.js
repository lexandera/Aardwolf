
var http = require('http');
var path = require('path');
var fs = require('fs');

var config = require('../config/config.defaults.js');
var util = require('./server-util.js');

function run() {
    /* Server for web service ports and debugger UI */
    http.createServer(AardwolfServer).listen(config.serverPort, null, function() {
        console.log('Server listening for requests on port ' + config.serverPort + '.');
    });
}

var mobileDispatcher = new Dispatcher();
var desktopDispatcher = new Dispatcher();

function AardwolfServer(req, res) {
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Headers', 'Origin, Content-Type');
    res.setHeader('Access-Control-Allow-Methods', 'POST, GET, OPTIONS');
    res.setHeader('Access-Control-Allow-Credentials', 'true');
    
    var body = '';
    
    if (req.method == 'OPTIONS') {
        res.end();
        return;
    }
    else if (req.method == 'POST') {
        req.on('data', function (chunk) { body += chunk; });
        req.on('end', function () { processPostedData(JSON.parse(body)); });
    }
    else {
        processPostedData();
    }
    
    function processPostedData(data) {
        switch (req.url) {
            case '/mobile/init':
                mobileDispatcher = new Dispatcher();
                /*desktopDispatcher = new Dispatcher();*/
                mobileDispatcher.setClient(res);
                desktopDispatcher.addMessage(data);
                break;
                
            case '/mobile/console':
                desktopDispatcher.addMessage(data);
                ok200();
                break;
                
            case '/mobile/breakpoint':
                desktopDispatcher.addMessage(data);
                mobileDispatcher.setClient(res);
                break;
                
            case '/mobile/incoming':
                mobileDispatcher.setClient(res);
                break;
                
            case '/desktop/outgoing':
                mobileDispatcher.addMessage(data);
                ok200();
                break;
                
            case '/desktop/incoming':
                desktopDispatcher.setClient(res);
                break;
                
            case '/files/list':
                ok200({ files: util.getJSFilesList() });
                break;
                
            case '/':
            case '/ui':
            case '/ui/':
                res.writeHead(302, {'Location': '/ui/index.html'});
                res.end();
                break;
                
            default:
                /* check if we need to serve a UI file */
                if (req.url.indexOf('/ui/') === 0) {
                    var requestedFile = req.url.substr(4);
                    var uiFilesDir = path.join(__dirname, '../ui/');
                    var fullRequestedFilePath = path.join(uiFilesDir, requestedFile);
                    
                    /* File must exist and must be located inside the uiFilesDir */
                    if (path.existsSync(fullRequestedFilePath) && fullRequestedFilePath.indexOf(uiFilesDir) === 0) {
                        util.serveStaticFile(res, fullRequestedFilePath);
                        break;
                    }
                }
                
                /* check if we need to serve a UI file */
                if (req.url.indexOf('/files/data/') === 0) {
                    var requestedFile = req.url.substr(11);
                    var jsFilesDir = path.normalize(config.jsFileServerBaseDir);
                    var fullRequestedFilePath = path.join(jsFilesDir, requestedFile);
                    
                    /* File must exist and must be located inside the jsFilesDir */
                    if (path.existsSync(fullRequestedFilePath) && fullRequestedFilePath.indexOf(jsFilesDir) === 0) {
                        ok200({ data: fs.readFileSync(fullRequestedFilePath).toString() });
                        break;
                    }
                }
                
                /* fallback... */
                res.writeHead(404, {'Content-Type': 'text/plain'});
                res.end('NOT FOUND');
        }
    }
    
    function ok200(data) {
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify(data || {}));
    }
}


function Dispatcher() {
    var queue = [];
    var client;
    
    this.setClient = function(c) {
        client = c;
        process();
    };
    
    this.addMessage = function(m) {
        queue.push(m);
        process();
    };
    
    function process() {
        if (client && queue.length > 0) {
            client.writeHead(200, { 'Content-Type': 'application/json' });
            var msg = queue.shift();
            client.end(JSON.stringify(msg));
            client = null;
        }
    }
}

module.exports.run = run;
