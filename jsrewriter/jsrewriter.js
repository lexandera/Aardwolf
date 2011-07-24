
var fs = require('fs');
var path = require('path');

function addDebugStatements(filePath, text) {
    var lines = text.split('\n');
    var out = [];
    lines.forEach(function(line, i) {
        if (line.match(/[a-zA-Z0-9=,.]/i)) {
            var isDebuggerStatement = line.match(/^\s*\bdebugger\b/);
            out.push(buildDebugStatement(filePath, i+1, isDebuggerStatement));
        }
        out.push(line);
    });
    return out.join('\n');
}

var debugStatementTemplate = fs.readFileSync(path.join(__dirname, '../js/debug-template.js')).toString().trim();

function buildDebugStatement(file, line, isDebuggerStatement) {
    return debugStatementTemplate
                .replace('__FILE__', file)
                .replace('__LINE__', line)
                .replace('__DEBUGGER__', isDebuggerStatement ? 'true' : 'false');
}

module.exports = {
    addDebugStatements: addDebugStatements
};

