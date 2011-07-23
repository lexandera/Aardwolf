
window.Aardwolf = new function() {
    var serverHost = '__SERVER_HOST__';
    var serverPort = __SERVER_PORT__;
    var serverUrl = 'http://' + serverHost + ':' + serverPort;
    
    var breakpoints = {};
    
    function sendToServer(path, payload) {
        req = new XMLHttpRequest();
        req.open('POST', serverUrl+path, false);
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
    
    function processCommandFromServer(cmd) {
        if (cmd.command == 'set-breakpoints') {
            breakpoints = cmd.data;
        }
    }
    
    this.init = function() {
        replaceConsole();
        var cmd = sendToServer('/init', {});
        if (cmd && cmd.command) {
            processCommandFromServer(cmd);
        }
    };
    
    this.updatePosition = function(file, line, isDebuggerStatement) {
        while (true) {
            var breakpoint = (breakpoints[file] && breakpoints[file][line]) || isDebuggerStatement;
            if (breakpoint) {
                var cmd = sendToServer('/breakpoint', { file: file, line: line });
                
                if (cmd && cmd.command) {
                    if (cmd.command == 'eval') {
                        /* pass eval to debug loop which called updatePosition() */
                        return cmd;
                    }
                    else {
                        processCommandFromServer(cmd);
                    }
                } else {
                    break;
                }
            } else {
                break;
            }
        }
    };
    
    this.doEval = function(evalFunc) {
        var aardwolfEvalResult;
        try {
            aardwolfEvalResult = evalFunc();
        } catch (ex) {
            aardwolfEvalResult = 'ERROR: ' + ex.toString();
        }
        sendToServer('/console', { type: 'EVAL', message: aardwolfEvalResult });
    };
    
};

Aardwolf.init();
