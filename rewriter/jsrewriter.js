'use strict';

var fs = require('fs');
var path = require('path');
var jstok = require('./jstokenizer.js');

var debugStatementTemplate =
    fs.readFileSync(path.join(__dirname, 'templates/debug-template.js')).toString().trim();
var exceptionInterceptorTemplate =
    fs.readFileSync(path.join(__dirname, 'templates/exception-template.js')).toString().replace(/\n\r?/g, '').replace(/ {4}/g, ' ');

var exceptionInterceptorParts = exceptionInterceptorTemplate.split('SPLIT');
var exceptionInterceptorStart = exceptionInterceptorParts[0].trim();
var exceptionInterceptorEnd = exceptionInterceptorParts[1].trim();

function buildExceptionInterceptorStart(functionName, file, line) {
    return exceptionInterceptorStart
                .replace('__FUNCTION__', functionName)
                .replace('__FILE__', file)
                .replace('__LINE__', line);
}

function addDebugStatements(filePath, text) {
    var nestingDepth = [0];
    var out = [];
    var line = 1;
    var semicolonOrFunctionBoundryEncountered = true;
    var newlineEncountered = true;
    var functionEncountered = false;
    var wordAfterFunction = null;
	var prevToken = null;
	var openSwitch = false;
	var openCase = false;

	var invalidTokens = ['(', '[', ',', '=', ':', 'return', '|', '?'];

	var breakpoints = [];

	function buildDebugStatement(file, line, isDebuggerStatement) {
		breakpoints.push(line);
		return debugStatementTemplate
			.replace('__FILE__', file)
			.replace('__LINE__', line)
			.replace('__DEBUGGER__', isDebuggerStatement ? 'true' : 'false');
	}

    jstok.tokenize(text, function(token, type) {
        /* drop carriage returns... we don't need them. */
        if (token === '\r') {
            return;
        }

		if (token == 'switch') {
			openSwitch = true;
		}
		if (token == 'case') {
			openCase = true;
		}

        if (token == '"use strict"' || token == "'use strict'") {
            token = '/* Aardwolf cannot work in strict mode. Disabling. '+token.split('').join('_')+' */';
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
            if (type != 'char' &&
                token != 'else' &&
                semicolonOrFunctionBoundryEncountered &&
                newlineEncountered)
            {
                var isDebuggerStatement = token === 'debugger';
                out.push(buildDebugStatement(filePath, line, isDebuggerStatement));

                if (isDebuggerStatement) {
                    /* Comment out the debugger statement to avoid triggering any native debuggers */
                    token = '/*' + token + '*/';
                }
            }

            semicolonOrFunctionBoundryEncountered = false;
            newlineEncountered = false;
        }

        if (type == 'word') {
            if (functionEncountered) {
                wordAfterFunction = token;
            }
            functionEncountered = false;
        }

        if (token === 'function') {
            /* keep a separate nesting depth counter for each nested function */
            nestingDepth.push(0);
            out.push(token);

            functionEncountered = true;
            wordAfterFunction = null;
        }
        else if (token === '{') {
            ++nestingDepth[nestingDepth.length-1];

            out.push(token);

            /* we have just entered a function body - insert the first part of the exception interception block */
            if (nestingDepth.length > 1 && nestingDepth[nestingDepth.length-1] === 1) {
                out.push(buildExceptionInterceptorStart(wordAfterFunction || '<anonymous>', filePath, line));
            }

			if (openSwitch) {
				openSwitch = false;
			} else if (invalidTokens.indexOf(prevToken) < 0) {
				semicolonOrFunctionBoundryEncountered = true;
			}
        }
        else if (token === '}') {
            --nestingDepth[nestingDepth.length-1];

            /* we are about to exit a function body - insert the last part of the exception interception block */
            if (nestingDepth.length > 1 && nestingDepth[nestingDepth.length-1] === 0) {
                out.push(exceptionInterceptorEnd);
                nestingDepth.pop();
            }
			semicolonOrFunctionBoundryEncountered = true;

            out.push(token);
        }
		else if (token === ':' && openCase) {
			openCase = false;
			semicolonOrFunctionBoundryEncountered = true;
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
            else if (type == 'comment') {
                /* comments can span multiple lines so we need to adjust line count accordingly */
                var parts = token.split('\n');
                line += parts.length - 1;
            }
            out.push(token);
        }
		if (type != 'comment' && type != 'whitespace' && type != 'newline') {
			prevToken = token;
		}
    });


	return {
		file: buildExceptionInterceptorStart('<toplevel>', filePath, 0) + out.join('') + exceptionInterceptorEnd,
		breakpoints: breakpoints
	};
}


module.exports = {
    addDebugStatements: addDebugStatements
};

