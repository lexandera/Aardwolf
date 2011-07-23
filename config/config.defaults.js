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

/* Full path to directory holding JS source files you wish to debug */
config.jsFileServerPort = 8500;
config.jsFileServerBaseDir = '';




module.exports = config;


var path = require('path');
var localConf = path.join(__dirname, 'config.local.js');
if (path.existsSync(localConf)) {
    require(localConf);
}
