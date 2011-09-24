
var files = {};
var $codeContainer;
var $code;

var $continueBtn;
var $stepBtn;
var $stackTrace;

$(function() {
    $('#breakpoints').val(JSON.stringify([['/calc.js', 11], ['/calc.js', 25], ['/calc.js', 37]]));
    $('#eval').val("");
    
    $('#btn-update-breakpoints').click(updateBreakpoints);
    $('#btn-breakon-next').click(setBreakOnNext);
    $('#btn-eval').click(evalCodeRemotely);
    $('#btn-continue').click(breakpointContinue);
    $('#btn-step').click(breakpointStep);
    
    $continueBtn = $('#btn-continue'); 
    $stepBtn = $('#btn-step');
    $stackTrace = $('#stack');
    
    $codeContainer = $('#code-container');
    $code = $('#code');
    
    listenToServer();
});

function initDebugger() {
    var fileList = getFromServer('/files/list');
    files = {};
    
    fileList.files.forEach(function(f) {
        var fdata = getFromServer('/files/data/'+f)
        files[f] = fdata.data;
    });
    
    postToServer({ command: 'set-breakpoints', data: JSON.parse($('#breakpoints').val()) });
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
    disableContinueAndStep();
    clearStackTrace();
    postToServer({ command: 'breakpoint-continue' });
}

function breakpointStep() {
    removeLineHightlight();
    disableContinueAndStep();
    clearStackTrace();
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
    var codeTokens = [];
    var keywordList = [
        'var', 'function', 'if', 'else', 'while', 'for', 'do', 'in', 'break', 'continue',
        'switch', 'return', 'debugger', 'try', 'catch', 'throw', 'true', 'false'
    ];
    
    var tokenize = data.file.substr(-7) == '.coffee' ? tokenize_coffeescript : tokenize_js;
    
    tokenize(files[data.file.substr(1)], function(token, type) {
        var pre = '';
        var post = '';
        
        if (type === 'word' && keywordList.indexOf(token) > -1) {
            pre = '<span class="keyword">';
            post = '</span>';
        }
        else if (['string', 'comment', 'number'].indexOf(type) > -1) {
            pre = '<span class="'+type+'">';
            post = '</span>';
        }
        
        codeTokens.push(pre);
        codeTokens.push(token.replace(/</g, '&lt;'));
        codeTokens.push(post);
    });
    
    var codeLines = codeTokens
        .join('')
        .split('\n')
        .map(function(x, i) {
            var num = String(i+1);
            var paddedNum = '      '.substr(num.length) + '<span class="linenum">' + num + ' </span>';
            return paddedNum + ' ' + x;
        });

    $code.html(codeLines.join('\n'));
    $stackTrace.text(data.stack.join('\n'));
    
    var numLines = codeLines.length;
    var textAreaHeight = $codeContainer.height();
    var textAreaContentHeight = $codeContainer[0].scrollHeight;
    var codeHeight = $code.height();
    var heightPerLine = codeHeight / numLines;
    
    if (data.line) {
        highlightLine(data.line, numLines);
        enableContinueAndStep();
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
        'background-image': 'url("img/breakpoint-arrow.png"), url("img/breakpoint-bg.png")',
        'background-repeat': 'no-repeat, no-repeat, repeat-y',
        'background-size': '9px 7px, 100% '+Math.round(heightPerLine)+'px',
        'background-position': '5px '+Math.round((line - 1) * heightPerLine + ((heightPerLine - 7) / 2))+'px, '+
                               '0px '+Math.round((line - 1) * heightPerLine)+'px'
    });
}

function removeLineHightlight() {
    $code.css({ 'background-image': '' });
}

function enableContinueAndStep() {
    $continueBtn.attr('disabled', null);
    $stepBtn.attr('disabled', null);
}

function disableContinueAndStep() {
    $continueBtn.attr('disabled', true);
    $stepBtn.attr('disabled', true);
}

function clearStackTrace() {
    $stackTrace.text('');
}

function processOutput(data) {
    switch (data.command) {
        case 'mobile-connected':
            writeToConsole('Mobile device connected.');
            initDebugger();
            break;
        case 'print-message': 
            writeToConsole('<b>'+data.type + '</b>: ' + data.message);
            break;
        case 'print-eval-result':
            writeToConsole('<b>EVAL</b> INPUT: ' + data.input + ' RESULT: ' + data.result);
            break;
        case 'report-exception':
            writeToConsole('<b>EXCEPTION</b>: ' + data.message + ' at ' + data.file + ', line ' + data.line);
            break;
        case 'report-breakpoint':
            showBreakpoint(data);
            break;
    }
    
}


var lineNum = 0;
function writeToConsole(msg) {
    $('<div></div>').html((++lineNum) + ': ' + msg).appendTo($('#output'))[0].scrollIntoView();
}



