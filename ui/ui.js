
$(function() {
    $('#breakpoints').val(JSON.stringify([['/calc.js', 21], ['/calc.js', 32]]));
    $('#eval').val("");
    
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
            processOutput(JSON.parse(req.responseText));
            listenToServer();
        }
    };
    req.send(null);
}

function showBreakpoint(data) {
    var codeLines = jsFiles[data.file.substr(1)]
        .split('\n')
        .map(function(x, i) {
            var num = String(i+1);
            var paddedNum = '      '.substr(num.length) + num + ' ';
            return (i == data.line - 1 ? ' >>>>>>' : paddedNum) + ' ' + x;
        });

    var $code = $('#code');    
    $code.text(codeLines.join('\n'));
    $('#stack').text(data.stack.join('\n'));
    
    var numLines = codeLines.length;
    var textAreaHeight = $code.height();
    var textAreaContentHeight = $code[0].scrollHeight;
    
    if (textAreaContentHeight > textAreaHeight) {
        var heightPerLine = (textAreaContentHeight - textAreaHeight) / numLines;
        var scrollTo = data.line * heightPerLine;
        $code.scrollTop(scrollTo);
    }
}

function processOutput(data) {
    switch (data.command) {
        case 'print-message': 
            writeToConsole('<b>'+data.type + '</b>: ' + data.message);
            break;
        case 'print-eval-result':
            writeToConsole('<b>EVAL</b> INPUT: ' + data.input + ' RESULT: ' + data.result);
            break;
        case 'report-breakpoint':
            showBreakpoint(data);
            break;
    }
    
}


var lineNum = 0;
function writeToConsole(msg) {
    $('<div></div>').html((++lineNum) + ': ' + msg).prependTo($('#output'));
}



