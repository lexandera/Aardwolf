'use strict';

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

if (argv['o'])		   { config.outputDir = argv['o']; }

if (argv['v'])		   { config.verbose = true; }

try {
    /* Makes sure the path exists and gets rid of any trailing slashes. */
    config.fileServerBaseDir = fs.realpathSync(config.fileServerBaseDir);
} catch (e) {
    console.error(e.message);
    process.exit(1);
}

if (!config.serverHost) {
    console.error("Please specify a valid hostname or IP for your computer using the \"-h\" command-line parameter.");
    process.exit(1);
}

Array.prototype.equals = function (otherArray) {
	return !(this < otherArray || otherArray < this);
}


var server = require('./server/server.js');
server.run();

var rewriterServer = require('./server/rewriter-server.js');
rewriterServer.run();


/*var debugFileServer = require('./server/debug-file-server.js');
debugFileServer.run();*/


