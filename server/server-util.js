'use strict';

var fs = require('fs');
var path = require('path');
var config = require('../config/config.defaults.js');

function serveStaticFile(res, filename) {
    var ext = filename.split('.').reverse()[0];
    var ct = ext == 'js'   ? 'application/javascript' :
             ext == 'css'  ? 'text/css' :
             ext == 'html' ? 'text/html' :
             ext == 'png'  ? 'image/png' :
             ext == 'jpg'  ? 'image/jpeg' :
             ext == 'jpeg' ? 'image/jpeg' :
             'text/plain';

    var fdata = fs.readFileSync(filename);

    if (['png', 'jpg', 'jpeg'].indexOf(ext) == -1) {
        fdata = fdata
            .toString()
            .replace(/__SERVER_HOST__/g, config.serverHost)
            .replace(/__SERVER_PORT__/g, config.serverPort)
            .replace(/__FILE_SERVER_PORT__/g, config.fileServerPort);
    }

    res.writeHead(200, { 'Content-Type': ct });
    res.end(fdata);
}


function getFilesList() {
	return getAllFiles(['.js', '.coffee']);
}

function getAllFiles(extensions) {
	var files = [];
    var baseDir = path.normalize(config.fileServerBaseDir);

    function walk(dir) {
        var fileList = fs.readdirSync(dir);
        fileList.forEach(function(f) {
            var fullPath = path.join(dir, f);
            var stat = fs.statSync(fullPath);
			var listForDebug = !!extensions && extensions.length > 0;
			var include = false;
			var extension;
			var i;

			if (!validFile(fullPath)) {
				return;
			}

			if (listForDebug) {
				if (stat.isFile()) {
					for (i = 0; i < config.whiteList.length; i++) {

						if (fullPath.indexOf(config.whiteList[i]) < 0) {
							return;
						}
					}
				}
				for (i = 0; i < config.blackList.length; i++) {
					if (fullPath.indexOf(config.blackList[i]) >= 0) {
						return;
					}
				}
			}

            if (stat.isFile()) {
				if (listForDebug) {
					for (i = 0; i < extensions.length; i++) {
						extension = extensions[i];
						if (fullPath.substr(-(extension.length)) == extension) {
							include = true;
							break;
						}
					}
				} else {
					include = true;
				}
                if (include) {
                    files.push(fullPath.substr(baseDir.length));
                }
            }
            else {
				if (!listForDebug) {
					files.push(fullPath.substr(baseDir.length));
				}
                walk(fullPath);
            }
        });
    }

    walk(baseDir);

    /* Unixify paths */
    files = files.map(function(f) { return f.replace(/\\/g, '/'); });

    return files;
}

function validFile(path) {
	for (var i = 0; i < config.ignoreFiles.length; i++) {
		if (path.indexOf(config.ignoreFiles[i]) >= 0) {
			return false;
		}
	}
	return true;
}

function copyFileSync (srcFile, destFile) {
	var BUF_LENGTH = 64*1024;
	var buff = new Buffer(BUF_LENGTH);
	var fdr = fs.openSync(srcFile, 'r');
	var fdw = fs.openSync(destFile, 'w');
	var bytesRead = 1;
	var pos = 0
	while (bytesRead > 0) {
		bytesRead = fs.readSync(fdr, buff, 0, BUF_LENGTH, pos);
		fs.writeSync(fdw, buff, 0, bytesRead);
		pos += bytesRead;
	}
	fs.closeSync(fdr);
	fs.closeSync(fdw);
}

module.exports.serveStaticFile = serveStaticFile;
module.exports.getFilesList = getFilesList;
module.exports.getAllFiles = getAllFiles;
module.exports.copyFileSync = copyFileSync;

