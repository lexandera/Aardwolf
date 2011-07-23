
var fs = require('fs');
var path = require('path');

function addDebugStatements(filePath, text) {
    var lines = text.split('\n');
    var out = [];
    lines.forEach(function(line, i) {
        if (line.match(/[a-zA-Z0-9=,.]/i)) {
            out.push(buildDebugStatement(filePath, i+1));
        }
        out.push(line);
    });
    return out.join('\n');
}

var debugStatementStart = "/*AARDWOLF_DEBUG_BEGIN*/";
var debugStatementEnd = "/*AARDWOLF_DEBUG_END*/";
var debugStatementTemplate = fs.readFileSync(path.join(__dirname, '../js/debug-template.js')).toString();

function buildDebugStatement(file, line) {
    return  debugStatementStart +
            debugStatementTemplate.replace('__FILE__', file).replace('__LINE__', line) +
            debugStatementEnd;
}

module.exports = {
    addDebugStatements: addDebugStatements
};

