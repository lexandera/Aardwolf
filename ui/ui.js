
var jsFiles = {};
var $codeContainer;
var $code;

$(function() {
    $('#breakpoints').val(JSON.stringify([['/calc.js', 2], ['/calc.js', 21], ['/calc.js', 32]]));
    $('#eval').val("");
    
    $('#btn-start').click(initDebugger);
    $('#btn-update-breakpoints').click(updateBreakpoints);
    $('#btn-breakon-next').click(setBreakOnNext);
    $('#btn-eval').click(evalCodeRemotely);
    $('#btn-continue').click(breakpointContinue);
    $('#btn-step').click(breakpointStep);
    
    $codeContainer = $('#code-container');
    $code = $('#code');
});

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

function updateBreakpoints() {
    postToServer({ command: 'set-breakpoints', data: JSON.parse($('#breakpoints').val()) });
}

function setBreakOnNext() {
    postToServer({ command: 'break-on-next', data: JSON.parse($('#breakpoints').val()) });
}

function evalCodeRemotely() {
    postToServer({ command: 'eval', data: $('#eval').val() });
}

function breakpointContinue() {
    removeLineHightlight();
    postToServer({ command: 'breakpoint-continue' });
}

function breakpointStep() {
    removeLineHightlight();
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
            return paddedNum + ' ' + x;
        });

    $code.text(codeLines.join('\n'));
    $('#stack').text(data.stack.join('\n'));
    
    var numLines = codeLines.length;
    var textAreaHeight = $codeContainer.height();
    var textAreaContentHeight = $codeContainer[0].scrollHeight;
    var codeHeight = $code.height();
    var heightPerLine = codeHeight / numLines;
    
    if (data.line) {
        highlightLine(data.line, numLines)
    }
    
    if (textAreaContentHeight > textAreaHeight) {
        var scrollAmountPerLine = (textAreaContentHeight - textAreaHeight) / numLines;
        var scrollTo = Math.round(data.line * scrollAmountPerLine);
        $codeContainer.scrollTop(scrollTo);
    }
}

function highlightLine(line, numLines) {
    var codeHeight = $code.height();
    var heightPerLine = codeHeight / numLines;
    
    $code.css({
        'background-image': 'url("/ui/img/breakpoint-arrow.png"), url("/ui/img/breakpoint-bg.png")',
        'background-repeat': 'no-repeat, no-repeat',
        'background-size': '9px 7px, 100% '+Math.round(heightPerLine)+'px',
        'background-position': '3px '+Math.round((line - 1) * heightPerLine + ((heightPerLine - 7) / 2))+'px, '+
                               '0px '+Math.round((line - 1) * heightPerLine)+'px'
    });
}

function removeLineHightlight() {
    $code.css({ 'background-image': '' });
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



