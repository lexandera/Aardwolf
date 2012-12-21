'use strict';

var files = {};
var $codeContainer;
var $code;

var $continueBtn;
var $stepBtn;
var $stepOverBtn;
var $stepInBtn;
var $stepOutBtn;
var $stackTrace;

$(function() {
	$('#sidebar').resizable({
		handles: 'w',
		stop: function(e, ui) {
			$('#sidebar').css('width', 'auto')
            $('#sidebar').css('height', 'auto');
        }
	});
    $('#breakpoints').val("[]");
	$('#breakpoints').keydown(function(e) {
		e.stopPropagation();
	});
    $('#eval').val("");

	$('#eval').keydown(function(e) {
		e.stopPropagation();
	});

    $('#btn-update-breakpoints').click(updateBreakpoints);
    $('#btn-breakon-next').click(setBreakOnNext);
    $('#btn-eval').click(evalCodeRemotely);
    $('#btn-continue').click(breakpointContinue);
    $('#btn-step').click(breakpointStep);
    $('#btn-step-over').click(breakpointStepOver);
    $('#btn-step-in').click(breakpointStepIn);
    $('#btn-step-out').click(breakpointStepOut);
    $('#file-switcher').change(switcherSwitchFile);

    $continueBtn = $('#btn-continue');
    $stepBtn = $('#btn-step');
    $stepOverBtn = $('#btn-step-over');
    $stepInBtn = $('#btn-step-in');
    $stepOutBtn = $('#btn-step-out');
    $stackTrace = $('#stack');
    $codeContainer = $('#code-container');
    $code = $('#code');

	$(window).keydown(function(e) {
		switch(e.which) {
			case 80: // P - Continue
				if ($continueBtn.attr('disabled') == null) {
					breakpointContinue();
				}
				break;
			case 79: // O- Over
				if ($stepOverBtn.attr('disabled') == null) {
					breakpointStepOver();
				}
				break;
			case 78: // I- In
				if ($stepInBtn.attr('disabled') == null) {
					breakpointStepIn();
				}
				break;
			case 77: // U- Out
				if ($stepOutBtn.attr('disabled') == null) {
					breakpointStepOut();
				}
				break;
		}
	});

    loadSourceFiles();
    listenToServer();

    showFile({ file: $('#file-switcher').val() });
});

function initDebugger() {
    loadSourceFiles();
    postToServer({ command: 'set-breakpoints', data: JSON.parse($('#breakpoints').val()) });
}

function loadSourceFiles() {
    var fileList = getFromServer('/files/list');
    files = {};

    $('#file-switcher option').remove();
    addToFileSwitcher('', '<select file>');

    fileList && fileList.files.forEach(function(f) {
        var fdata = getFromServer('/files/data/'+f);
        files[f] = fdata.data;
        addToFileSwitcher(f, f);
    });
}

function updateBreakpoints() {
    postToServer({ command: 'set-breakpoints', data: JSON.parse($('#breakpoints').val()) });
    paintBreakpoints($('#file-switcher').val());
}

function setBreakOnNext() {
    postToServer({ command: 'break-on-next', data: JSON.parse($('#breakpoints').val()) });
}

function evalCodeRemotely() {
	var data =  $('#eval').val();

	data = data.replace(/\bthis\b/, '__this');
    postToServer({ command: 'eval', data: data});
}

function breakpointContinue() {
    removeLineHightlight();
    disableContinueAndStep();
    clearStackTrace();
    postToServer({ command: 'breakpoint-continue' });
}

function breakpointStepCommand(command) {
    removeLineHightlight();
    disableContinueAndStep();
    clearStackTrace();
    postToServer({ command: command });
}

function breakpointStep(command) {
    breakpointStepCommand('breakpoint-step');
}

function breakpointStepOver() {
    breakpointStepCommand('breakpoint-step-over');
}

function breakpointStepIn() {
    breakpointStepCommand('breakpoint-step-in');
}

function breakpointStepOut() {
    breakpointStepCommand('breakpoint-step-out');
}

function addToFileSwitcher(filePath, fileLabel) {
    $('<option></option>').val(filePath).text(fileLabel).appendTo($('#file-switcher'));
}

function switcherSwitchFile() {
    showFile({ file: $('#file-switcher').val() });
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
    return safeJSONParse(req.responseText);
}

function listenToServer() {
    var req = new XMLHttpRequest();
    req.open('GET', '/desktop/incoming', true);
    req.onreadystatechange = function () {
        if (req.readyState == 4) {
            var data = safeJSONParse(req.responseText);
            if (data) {
                processOutput(data);
            }
            listenToServer();
        }
    };
    req.send(null);
}

function showBreakpoint(data) {
    showFile(data);
    $('#file-switcher').val(data.file);
    $stackTrace.text(data.stack.join('\n'));
}

function showFile(data) {
    var codeTokens = [];
    var keywordList;
    var literalList;
    var tokenize;

    if (fileExt(data.file) == 'coffee') {
        keywordList = keywordListCoffeeScript;
        literalList = literalListCoffeScript;
        tokenize = tokenizeCoffeeScript;

        $('#controls-coffeescript').show();
        $('#controls-javascript').hide();
    }
    else {
        keywordList = keywordListJavaScript;
        literalList = literalListJavaScript;
        tokenize = tokenizeJavaScript;

        $('#controls-coffeescript').hide();
        $('#controls-javascript').show();
    }

    tokenize(files[data.file] || '', function(token, type) {
        var pre = '';
        var post = '';

        if (type === 'word' && keywordList.indexOf(token) > -1) {
            pre = '<span class="keyword">';
            post = '</span>';
        }
        else if (type === 'word' && literalList.indexOf(token) > -1) {
            pre = '<span class="literal">';
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
            var paddedNum = '<span class="linenum" file="'+data.file+'" line="'+num+'">' +
                            '      '.substr(num.length) + num + ' ' +
                            '</span>';
            return paddedNum + ' ' + x;
        });

    $code.html(codeLines.join('\n'));
    $code.find('.linenum').click(toggleBreakpoint);
    paintBreakpoints(data.file);

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

function paintBreakpoints(file) {
    $code.find('.linenum').each(function(i, elem) {
        if (existsBreakpoint(file, i+1)) {
            $(elem).addClass('breakpoint');
        }
        else {
            $(elem).removeClass('breakpoint');
        }
    });
}

function existsBreakpoint(f, l) {
    var breakpoints = safeJSONParse($('#breakpoints').val()) || [];
    return breakpoints.filter(function(b) { return b[0] == f && b[1] == l; }).length > 0;
}

function toggleBreakpoint() {
    var breakpoints = safeJSONParse($('#breakpoints').val());
    if (breakpoints === null) {
        alert('Could not parse the list of breakpoints!');
        return;
    }

    var $marker = $(this);
    var file = $marker.attr('file');
    var line = $marker.attr('line');
    if (existsBreakpoint(file, line)) {
        $(this).removeClass('breakpoint');

        breakpoints = breakpoints.filter(function(b) { return !(b[0] == file && b[1] == line); });
        $('#breakpoints').val(JSON.stringify(breakpoints));
    }
    else {
        $(this).addClass('breakpoint');

        breakpoints.push([file, line]);
        $('#breakpoints').val(JSON.stringify(breakpoints));
    }

    updateBreakpoints();
}

function enableContinueAndStep() {
    $continueBtn.attr('disabled', null);
    $stepBtn.attr('disabled', null);
    $stepOverBtn.attr('disabled', null);
    $stepInBtn.attr('disabled', null);
    $stepOutBtn.attr('disabled', null);
}

function disableContinueAndStep() {
    $continueBtn.attr('disabled', true);
    $stepBtn.attr('disabled', true);
    $stepOverBtn.attr('disabled', true);
    $stepInBtn.attr('disabled', true);
    $stepOutBtn.attr('disabled', true);
}

function clearStackTrace() {
    $stackTrace.text('');
}

function processOutput(data) {
    switch (data.command) {
        case 'mobile-connected':
            writeToConsole('Remote device connected.');
            initDebugger();
            break;
        case 'print-message':
            writeToConsole('<b>'+data.type + '</b>: ' + data.message);
            break;
			/* writeToConsole(
				'<b>INSPECT</b> INPUT: ' + data.input.replace(/\b__this\b/, 'this') +
				'<br/>&nbsp;&nbsp;&nbsp; RESULT: ' +
				JSON.stringify(JSON.parse(data.result), null, '\t')
					.replace(/\n/g, '<br>&nbsp;&nbsp;&nbsp;')
					.replace(/\t/g, '&nbsp;&nbsp;'));*/
        case 'print-eval-result':
            writeToConsole('<b>EVAL</b> INPUT: ' + data.input.replace(/\b__this\b/, 'this') + ' RESULT: ' + data.result);
            break;
        case 'report-exception':
            writeToConsole('<b>EXCEPTION</b>: ' + data.message + ' at ' + data.file + ', line ' + data.line);
            break;
        case 'report-breakpoint':
            showBreakpoint(data);
            break;
    }
}

function safeJSONParse(str) {
    try {
        return JSON.parse(str);
    } catch (ex) {
        return null;
    }
}

var lineNum = 0;
function writeToConsole(msg) {
    $('<div></div>').html((++lineNum) + ': ' + msg).appendTo($('#output'))[0].scrollIntoView();
}


function fileExt(fileName) {
    return fileName.split('.').slice(-1)[0];
}


