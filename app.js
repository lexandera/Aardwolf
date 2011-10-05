
var argv = require('optimist').argv;
var config = require('./config/config.defaults.js');

if (argv['h'])         { config.serverHost        = argv['h']; } 
if (argv['host'])      { config.serverHost        = argv['host']; }

if (argv['p'])         { config.serverPort        = argv['p']; } 
if (argv['port'])      { config.serverPort        = argv['port']; } 

if (argv['d'])         { config.fileServerBaseDir = argv['d']; } 
if (argv['file-dir'])  { config.fileServerBaseDir = argv['file-dir']; } 

if (argv['file-port']) { config.fileServerPort    = argv['file-port']; }


var server = require('./server/server.js');
var debugFileServer = require('./server/debug-file-server.js');

server.run();
debugFileServer.run();
