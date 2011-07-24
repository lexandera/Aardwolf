
$(function() {
    $('#breakpoints').val(JSON.stringify([['/sample1.js', 3], ['/sample1.js', 5]]));
    $('#eval').val("'foo'.toUpperCase()");
    
    $('#btn-start').click(initDebugger);
    $('#btn-eval').click(evalCodeRemotely);
    $('#btn-continue').click(breakpointContinue);
    $('#btn-step').click(breakpointStep);
});

function initDebugger() {
    sendToServer({ command: 'set-breakpoints', data: JSON.parse($('#breakpoints').val()) });
    listenToServer();
}

function evalCodeRemotely() {
    sendToServer({ command: 'eval', data: $('#eval').val() });
}

function breakpointContinue() {
    sendToServer({ command: 'breakpoint-continue' });
}

function breakpointStep() {
    sendToServer({ command: 'breakpoint-step' });
}

function sendToServer(payload) {
    var req = new XMLHttpRequest();
    req.open('POST', '/desktop/outgoing', false);
    req.setRequestHeader('Content-Type', 'application/json');
    req.send(JSON.stringify(payload));
}

function listenToServer() {
    var req = new XMLHttpRequest();
    req.open('GET', '/desktop/incoming', true);
    req.onreadystatechange = function () {
        if (req.readyState == 4) {
            writeOutput(JSON.parse(req.responseText));
            listenToServer();
        }
    };
    req.send(null);
}

var lineNum = 0;
function writeOutput(data) {
    var msg = '';
    
    switch (data.command) {
        case 'print-message': 
        msg = data.type + ': ' + data.message;
            break;
        case 'print-eval-result':
            msg = 'EVAL INPUT: ' + data.input + ' RESULT: ' + data.result;
            break;
        case 'report-breakpoint':
            msg = 'BREAKING AT: ' + data.file + ', line ' + data.line;
            break;
    }
    
    $('<div></div>').text((++lineNum) + ': ' + msg).prependTo($('#output'));
}


