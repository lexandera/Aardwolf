
window.Aardwolf = new (function() {
    var serverHost = '__SERVER_HOST__';
    var serverPort = '__SERVER_PORT__';
    var serverUrl = 'http://' + serverHost + ':' + serverPort;
    
    var breakpoints = {};
    var breakOnNext = false;
    
    function sendToServer(path, payload) {
        var req = new XMLHttpRequest();
        req.open('POST', serverUrl+path, false);
        req.setRequestHeader('Content-Type', 'application/json')
        req.send(JSON.stringify(payload));
        
        return JSON.parse(req.responseText);
    }
    
    function replaceConsole() {
        ['info', 'log', 'warn', 'error'].forEach(function(f) {
            var oldFunc = window.console[f];
            
            window.console[f] = function() {
                var args = Array.prototype.slice.call(arguments);
                var out = oldFunc.apply(window.console, args);
                sendToServer('/console', { type: f.toUpperCase(), message: args.toString() });
                return out; 
            };
        });
    }
    
    
    function processCommand(cmd) {
        switch (cmd.command) {
            case 'set-breakpoints':
                breakpoints = cmd.data;
                return true;
                
            case 'run':
                breakOnNext = false;
                return false;
            
            case 'step':
                breakOnNext = true;
                return false;
        }
    }
    
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
            
            var cmd = sendToServer('/breakpoint', { file: file, line: line });
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
    
    function doEval(evalScopeFunc, cmd) {
        var evalResult;
        try {
            evalResult = evalScopeFunc(cmd.data);
        } catch (ex) {
            evalResult = 'ERROR: ' + ex.toString();
        }  
        sendToServer('/console', { type: 'EVAL', message: evalResult });
    };
    
})();

Aardwolf.init();
