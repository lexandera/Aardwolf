
window.Aardwolf = new (function() {
    var serverHost = '__SERVER_HOST__';
    var serverPort = '__SERVER_PORT__';
    var serverUrl = 'http://' + serverHost + ':' + serverPort;
    
    var breakpoints = {};
    var breakOnNext = false;
    
    function sendToServer(path, payload) {
        var req = new XMLHttpRequest();
        req.open('POST', serverUrl + '/mobile' + path, false);
        req.setRequestHeader('Content-Type', 'application/json');
        req.send(JSON.stringify(payload));
        return JSON.parse(req.responseText);
    }
    
    function replaceConsole() {
        ['info', 'log', 'warn', 'error'].forEach(function(f) {
            var oldFunc = window.console[f];
            
            window.console[f] = function() {
                var args = Array.prototype.slice.call(arguments);
                var out = oldFunc.apply(window.console, args);
                sendToServer('/console', { command: 'print-message', type: f.toUpperCase(), message: args.toString() });
                return out; 
            };
        });
    }
    
    function processCommand(cmd) {
        switch (cmd.command) {
            case 'set-breakpoints':
                breakpoints = {};
                cmd.data.forEach(function(bp) {
                    var file = bp[0];
                    var line = bp[1];
                    if (!breakpoints[file]) {
                        breakpoints[file] = {};
                    }
                    breakpoints[file][line] = true;
                });
                return true;
                
            case 'breakpoint-continue':
                breakOnNext = false;
                return false;
            
            case 'breakpoint-step':
                breakOnNext = true;
                return false;
        }
    }
    
    function doEval(evalScopeFunc, cmd) {
        var evalResult;
        try {
            evalResult = evalScopeFunc(cmd.data);
        } catch (ex) {
            evalResult = 'ERROR: ' + ex.toString();
        }  
        sendToServer('/console', { command: 'print-eval-result', input: cmd.data, result: evalResult });
    }
    
    function getStack() {
        var callstack = [];
        var currentFunction = arguments.callee;
        while (currentFunction = currentFunction.caller) {
            var fname = currentFunction.name || '<anonymous>';
            callstack.push(fname);
        }
        return callstack;
    };
    
    this.init = function() {
        replaceConsole();
        var cmd = sendToServer('/init', {});
        if (cmd) {
            processCommand(cmd)
        }
    };
    
    this.updatePosition = function(file, line, isDebuggerStatement, evalScopeFunc) {
        while (true) {
            var shouldBreak = (breakpoints[file] && breakpoints[file][line]) || isDebuggerStatement || breakOnNext;
            if (!shouldBreak) {
                return;
            }
            
            var cmd = sendToServer('/breakpoint', { command: 'report-breakpoint', file: file, line: line, stack: getStack().slice(1) });
            if (!cmd) {
                return;
            }                
                
            if (cmd.command == 'eval') {
                doEval(evalScopeFunc, cmd);
            }
            else {
                var isInternalCommand = processCommand(cmd);
                if (!isInternalCommand) {
                    return;
                }
            }
        }
    };
    
})();

Aardwolf.init();
