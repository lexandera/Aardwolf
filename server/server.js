
var http = require('http');
var config = require('../config/config.defaults.js');

http.createServer(FileServer).listen(config.jsFileServerPort, null, function() {
    console.log('JS file server listening for requests on port '+config.jsFileServerPort+'.');
});


function FileServer(req, res) {

}

