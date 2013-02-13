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

if (argv['white-list']){ config.whiteList = argv['white-list'].split(','); }

try {
    /* Makes sure the path exists and gets rid of any trailing slashes. */
    config.fileServerBaseDir = fs.realpathSync(config.fileServerBaseDir);
} catch (e) {
    console.error(e.message);
    process.exit(1);
}

Array.prototype.equals = function (otherArray) {
	return !(this < otherArray || otherArray < this);
}

var ips = scanAvailableIPs();

if (config.serverHost && ips.indexOf(config.serverHost) < 0) {
	console.error('Configured host', config.serverHost, 'is not valid. You don\'t have that IP');
	console.error('Available IPs are:', ips);
	process.exit(1);
}

if (!config.serverHost) {

	if (ips.length > 1) {
		console.log("Cannot decide which IP to use, please specify one of these");
		ips.forEach(function(ip, i) {
			console.log('[', i + 1, ']:', ip);
		})

		var prompt = require('prompt');
		prompt.start();
		prompt.get({name: 'selection', validator: /^\d{1}$/, empty: false}, function(err, result) {
			var ip = ips[result.selection - 1];
			console.log('Choosen option', ip);
			config.serverHost = ip;
			startApp();
		})
	} else {
		config.serverHost = ips[0];
		startApp();
	}
} else {
	startApp();
}

function scanAvailableIPs() {
	var os = require('os');
	var interfaces = os.networkInterfaces(),
		ips = [];
	for (var dev in interfaces) {
		interfaces[dev].forEach(function(details){
			if (details.family == 'IPv4' && details.address != '127.0.0.1') {
				ips.push(details.address);
			}
		});
	}
	return ips;
}

function startApp() {
	var server = require('./server/server.js');
	server.run();

	var rewriterServer = require('./server/rewriter-server.js');
	rewriterServer.run();

	/*var debugFileServer = require('./server/debug-file-server.js');
	 debugFileServer.run();*/
}





