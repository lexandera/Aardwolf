
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
    
    // TODO: fix address!
    req.open('POST', 'http://192.168.0.10:8000/desktop/outgoing', false);
    
    req.setRequestHeader('Content-Type', 'application/json');
    req.send(JSON.stringify(payload));
}

function listenToServer() {
    var req = new XMLHttpRequest();
    
    // TODO: fix address!
    req.open('GET', 'http://192.168.0.10:8000/desktop/incoming', true);
    
    req.onreadystatechange = function () {
        if (req.readyState == 4) {
            writeOutput(req.responseText);
            listenToServer();
        }
    };
    req.send(null);
}

var lineNum = 0;
function writeOutput(msg) {
    $('<div></div>').text((++lineNum) +': ' +msg).prependTo($('#output'));
}
