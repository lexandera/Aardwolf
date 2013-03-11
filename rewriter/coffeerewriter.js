'use strict';

var fs = require('fs');
var path = require('path');

var debugStatementTemplate = 
    fs.readFileSync(path.join(__dirname, 'templates/debug-template.coffee')).toString().trim();
var exceptionInterceptorTemplate = 
    fs.readFileSync(path.join(__dirname, 'templates/exception-template.coffee')).toString().replace(/\n\r?/g, '').replace(/ {4}/g, ' ');

var exceptionInterceptorParts = exceptionInterceptorTemplate.split('SPLIT');
var exceptionInterceptorStart = exceptionInterceptorParts[0].trim();
var exceptionInterceptorEnd = exceptionInterceptorParts[1].trim();


function addDebugStatements(filePath, text) {
    var coffee = require('coffee-script');
    var lines = text.split('\n');
    var out = [];
    
    var breakpoints = [];
    
    function buildDebugStatement(file, line, isDebuggerStatement) {
        breakpoints.push(line);
        
        return debugStatementTemplate
                    .replace('__FILE__', file)
                    .replace('__LINE__', line)
                    .replace('__DEBUGGER__', isDebuggerStatement ? 'true' : 'false');
    }
    
    
    lines.forEach(function(line, i) {
        var parts;
        var lineNum = i+1;
        
        if (line.match(/^\s*#/)) {
            return;
        }
        
        if (parts = line.match(/^(\s*)[^\s]+/)) {
            var match = line.match(/^(\s*)(debugger.*)$/);
            var isDebuggerStatement = !!match; 
            out.push((parts[1] || '') + '('+ buildDebugStatement(filePath, lineNum, isDebuggerStatement) +');');
            
            if (isDebuggerStatement) {
                /* Comment out the debugger statement to avoid triggering any native debuggers */
                line = match[1] + '#' + match[2];
            }
            
            out.push(line);
        }
    });

    return {
        file: exceptionInterceptorStart + coffee.compile(out.join('\n')) + exceptionInterceptorEnd,
        breakpoints: breakpoints
    };
}


module.exports = {
    addDebugStatements: addDebugStatements
};

