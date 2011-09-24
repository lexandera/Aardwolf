/* 
 * 
 * To change defaults set in this file create a file called config.local.js 
 * in the same directory and override values like this:
 * 
 *     var config = require('../config/config.defaults.js');
 *     config.setting = 'new_value';
 * 
 */

var config = {};
var path = require('path');

/* Hostname or IP of the local machine */
config.serverHost = '';
/* port on which the server listens for requests */
config.serverPort = 8000;

/* Full path to directory holding source files you wish to debug */
config.fileServerBaseDir = path.join(__dirname, '../samples');
/* Port on which files will be served */
config.fileServerPort = 8500;



module.exports = config;

/* Load overrides from config.local.js if it exists */
var localConf = path.join(__dirname, 'config.local.js');
if (path.existsSync(localConf)) {
    require(localConf);
}
