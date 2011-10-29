
var argv = require('optimist').argv;
var fs = require('fs');
var config = require('./config/config.defaults.js');

if (argv['h'])         { config.serverHost        = argv['h']; } 
if (argv['host'])      { config.serverHost        = argv['host']; }

if (argv['p'])         { config.serverPort        = argv['p']; } 
if (argv['port'])      { config.serverPort        = argv['port']; } 

if (argv['d'])         { config.fileServerBaseDir = argv['d']; } 
if (argv['file-dir'])  { config.fileServerBaseDir = argv['file-dir']; } 

if (argv['file-port']) { config.fileServerPort    = argv['file-port']; }

try {
    /* Makes sure the path exists and gets rid of any trailing slashes. */
    config.fileServerBaseDir = fs.realpathSync(config.fileServerBaseDir);
} catch (e) {
    console.log(e.message);
    process.exit(1);
}

if (!config.serverHost) {
    console.error("Please specify a valid hostname or IP for your computer using the \"-h\" command-line parameter.");
    return;
}

var server = require('./server/server.js');
var debugFileServer = require('./server/debug-file-server.js');

server.run();
debugFileServer.run();
