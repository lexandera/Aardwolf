
window.Aardwolf = new function() {
    var serverHost = '__SERVER_HOST__';
    var serverPort = __SERVER_PORT__;
    var serverUrl = 'http://' + serverHost + ':' + serverPort
    var breakpoints = {};
    
    function sendToServer(path, payload) {
        req = new XMLHttpRequest();
        req.open('POST', serverUrl+path, false);
        req.send(JSON.stringify(payload));
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
    
    this.init = function() {
        replaceConsole();
    };
    
    this.updatePosition = function(file, line) {
        var breakpoint = breakpoints[file] && breakpoints[file][line];
        if (breakpoint) {
            sendToServer('/console', { type: 'POSITION', message: file+', line ' + line });
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
