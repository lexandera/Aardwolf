
var fs = require('fs');
var path = require('path');
var jstok = require('./jstokenizer.js');

var debugStatementTemplate = 
    fs.readFileSync(path.join(__dirname, '../js/debug-template.js')).toString().trim();
var exceptionInterceptorTemplate = 
    fs.readFileSync(path.join(__dirname, '../js/exception-template.js')).toString().replace(/\n\r?/g, '').replace(/    /g, ' ');

var exceptionInterceptorParts = exceptionInterceptorTemplate.split('SPLIT');
var exceptionInterceptorStart = exceptionInterceptorParts[0].trim();
var exceptionInterceptorEnd = exceptionInterceptorParts[1].trim();

function buildDebugStatement(file, line, isDebuggerStatement) {
    return debugStatementTemplate
                .replace('__FILE__', file)
                .replace('__LINE__', line)
                .replace('__DEBUGGER__', isDebuggerStatement ? 'true' : 'false');
}

function addDebugStatements(filePath, text) {
    var nestingDepth = [0];
    var out = [];
    var line = 1;
    var semicolonOrFunctionBoundryEncountered = true;
    var newlineEncountered = true;
    
    jstok.tokenize(text, function(token, type) {
        /* drop carriage returns... we don't need them. */
        if (token === '\r') {
            return;
        }
        
        /* 
            Whenever we encounter some code:
            - if it's after a semicolon and a newline, or at the beginning of a function, 
              insert a debug statement in front of it
            - it it's anywhere else, reset the semicolon and newline flags because we're not
              anywhere near a place where a debug statement should be inserted
            
            Yes, this rewriter assumes that you're using semicolons in your code.
        */
        if (['word', 'number', 'string', 'char'].indexOf(type) > -1) {
            if (semicolonOrFunctionBoundryEncountered && newlineEncountered) {
                var isDebuggerStatement = token === 'debugger';
                out.push(buildDebugStatement(filePath, line, isDebuggerStatement));
            }
            
            semicolonOrFunctionBoundryEncountered = false;
            newlineEncountered = false;
        }
        
        if (token === 'function') {
            /* keep a separate nesting depth counter for each nested function */
            nestingDepth.push(0);
            out.push(token);
        }
        else if (token === '{') {
            ++nestingDepth[nestingDepth.length-1];
            
            out.push(token);
            
            /* we have just entered a function body - insert the first part of the exception interception block */
            if (nestingDepth.length > 1 && nestingDepth[nestingDepth.length-1] === 1) {
                out.push(exceptionInterceptorStart);
                semicolonOrFunctionBoundryEncountered = true;
            }
        }
        else if (token === '}') {
            --nestingDepth[nestingDepth.length-1];
            
            /* we are about to exit a function body - insert the last part of the exception interception block */
            if (nestingDepth.length > 1 && nestingDepth[nestingDepth.length-1] === 0) {
                out.push(exceptionInterceptorEnd);
                nestingDepth.pop();
                semicolonOrFunctionBoundryEncountered = true;
            }
            
            out.push(token);
        }
        else {
            if (token === ';') {
                semicolonOrFunctionBoundryEncountered = true;
            }
            else if (token === '\n') {
                ++line;
                newlineEncountered = true;
            }
            out.push(token);
        }
    });

    return out.join('');
}


module.exports = {
    addDebugStatements: addDebugStatements
};

