
$(function() {
    $('#breakpoints').val(JSON.stringify([['/sample1.js', 3], ['/sample1.js', 6]]));
    $('#eval').val("'foo'.toUpperCase()");
    
    $('#btn-start').click(initDebugger);
    $('#btn-eval').click(evalCodeRemotely);
    $('#btn-continue').click(breakpointContinue);
    $('#btn-step').click(breakpointStep);
});

var jsFiles = {};

function initDebugger() {
    var fileList = getFromServer('/files/list');
    jsFiles = {};
    
    fileList.files.forEach(function(f) {
        var fdata = getFromServer('/files/data/'+f)
        jsFiles[f] = fdata.data;
    });
    
    
    postToServer({ command: 'set-breakpoints', data: JSON.parse($('#breakpoints').val()) });
    listenToServer();
}

function evalCodeRemotely() {
    postToServer({ command: 'eval', data: $('#eval').val() });
}

function breakpointContinue() {
    postToServer({ command: 'breakpoint-continue' });
}

function breakpointStep() {
    postToServer({ command: 'breakpoint-step' });
}

function postToServer(payload) {
    var req = new XMLHttpRequest();
    req.open('POST', '/desktop/outgoing', false);
    req.setRequestHeader('Content-Type', 'application/json');
    req.send(JSON.stringify(payload));
}

function getFromServer(path) {
    var req = new XMLHttpRequest();
    req.open('GET', path, false);
    req.send();
    return JSON.parse(req.responseText);
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
            msg = '<b>'+data.type + '</b>: ' + data.message;
            break;
        case 'print-eval-result':
            msg = '<b>EVAL</b> INPUT: ' + data.input + ' RESULT: ' + data.result;
            break;
        case 'report-breakpoint':
            msg = '<b>BREAKPOINT</b> AT: ' + data.file + ', line ' + data.line + '<br/>'+
                  '<i>' + jsFiles[data.file.substr(1)].split('\n')[data.line - 1] +'</i><br/>' +
                  'stack: ' + data.stack.join(' / ');
            break;
    }
    
    $('<div></div>').html((++lineNum) + ': ' + msg).prependTo($('#output'));
}


