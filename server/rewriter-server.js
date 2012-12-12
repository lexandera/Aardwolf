'use strict';

/*
 * Serves source files with debug statements inserted.
 */

var path = require('path');
var fs = require('fs');

var config = require('../config/config.defaults.js');
var util = require('./server-util.js');
var rewriter = require('../rewriter/jsrewriter.js');


function run() {
    if (!fs.existsSync(config.fileServerBaseDir)) {
        console.error('ERROR: Path does not exist: ' + config.fileServerBaseDir);
        process.exit(1);
    }

	processFiles();

	// TODO: watch for file changes
}

function processFiles() {
	var files = util.getAllFiles(),
		serverBaseDir = path.normalize(config.fileServerBaseDir),
		destBaseDir = path.normalize(config.outputDir),
		content,
		origFilePath,
		destFilePath,
		fileName;

	if (!fs.existsSync(destBaseDir)) {
		fs.mkdirSync(destBaseDir);
	}

	for (var i = 0; i < files.length; i++) {
		fileName = files[i];

		if (validFile(fileName)) {
			origFilePath = path.join(serverBaseDir, fileName);
			destFilePath = path.join(destBaseDir, fileName);

			if (!fs.statSync(origFilePath).isFile()) {
				try {
					fs.mkdirSync(destFilePath);
				} catch(e) {
					// The folder already exists
				}
			} else if (fileName.substr(-3) === '.js' || fileName === config.indexFile) {
				content = fs.readFileSync(origFilePath).toString();
				if (fileName === config.indexFile) {
					// Inject aardwolf script in index
					var where = content.indexOf(config.whereToInsertAardwolf) + config.whereToInsertAardwolf.length;

					content = [content.slice(0, where), config.aarwolfScript, '\n', content.slice(where)].join('');
				} else {
					// Instrument JS code
					content = rewriter.addDebugStatements(fileName, content);
				}
				fs.writeFileSync(destFilePath, content);
			} else {
				util.copyFileSync(origFilePath, destFilePath);
			}
		}
	}

	// Copy Aardwolf script
	content =  fs.readFileSync(path.join(__dirname, '../js/aardwolf.js'));

	content = content
		.toString()
		.replace(/__SERVER_HOST__/g, config.serverHost)
		.replace(/__SERVER_PORT__/g, config.serverPort)
		.replace(/__FILE_SERVER_PORT__/g, config.fileServerPort);

	fs.writeFileSync(path.join(destBaseDir, 'aardwolf.js'), content);
}

function validFile(path) {
	for (var i = 0; i < config.ignoreFiles.length; i++) {
		if (path.indexOf(config.ignoreFiles[i]) >= 0) {
			return false;
		}
	}
	return true;
}


/*function DebugFileServer(req, res) {
    var requestedFile = url.parse(req.url).pathname;
    var fileServerBaseDir = path.normalize(config.fileServerBaseDir);
    var fullRequestedFilePath = path.join(fileServerBaseDir, requestedFile);


    if (requestedFile.toLowerCase() == '/aardwolf.js') {
        util.serveStaticFile(res, path.join(__dirname, '../js/aardwolf.js'));
    }
    else if (fs.existsSync(fullRequestedFilePath) &&
             fs.statSync(fullRequestedFilePath).isFile() &&
             fullRequestedFilePath.indexOf(fileServerBaseDir) === 0)
    {
        var rewriter;
        if (requestedFile.substr(-3) == '.js') {
            rewriter = require('../rewriter/jsrewriter.js');
        }
        else if (requestedFile.substr(-7) == '.coffee') {
            rewriter = require('../rewriter/coffeerewriter.js');
        }

        if (rewriter) {
            var content = fs.readFileSync(fullRequestedFilePath).toString();
            content = rewriter.addDebugStatements(requestedFile, content);
            res.writeHead(200, {'Content-Type': 'application/javascript'});
            res.end(content);
        }
        else {
            util.serveStaticFile(res, fullRequestedFilePath);
        }
    }
    else {
        res.writeHead(404, {'Content-Type': 'text/plain'});
        res.end('NOT FOUND');
    }
}*/


module.exports.run = run;
