'use strict';

var files = {};
var breakpoints = [];
var $codeContainer;
var $code;

var $continueBtn;
var $stepBtn;
var $stepOverBtn;
var $stepInBtn;
var $stepOutBtn;

var clearOnConnect = true;
var lineNum = 0;
var evalBig = false;

var history = [];
var currentHistoryPos = 0;

$(function() {
	$('#sidebar').resizable({
		handles: 'w',
		start: function() {
			$(document.body).addClass('unselectable');
		},
		stop: function(e, ui) {
			var sidebar = $('#sidebar');
			sidebar.css('width', 'auto');
			sidebar.css('height', 'auto');
			$(document.body).removeClass('unselectable');

			$('#code-container').css('width', sidebar.position().left);
        }
	});

	$('#output').resizable({
		handles: 'n',
		start: function() {
			$(document.body).addClass('unselectable');
		},
		stop: function(e, ui) {
			$(document.body).removeClass('unselectable');
			$('#sidebar').css('bottom', $('#output').css('height'));

			var code = $('#code-container'),
				yCode,
				yOutput,
				codeHeight;

			yCode = code.position().top;
			yOutput = $('#output').position().top;
			codeHeight = yOutput - yCode;
			code.css('height', codeHeight);
		}
	});
    $('#eval').val("");

	$('#eval').keydown(function(e) {
		e.stopPropagation();

		switch (e.keyCode) {
			case 13: // Enter
				if (!evalBig) {
					e.preventDefault();
					if ($('#eval').val().match(/\S/)) {
						evalCodeRemotely();
						$('#eval').val("");
					}
				}
				break;
			case 38: // Up
				if (currentHistoryPos < history.length) {
					$('#eval').val(history[currentHistoryPos++]);

					if (currentHistoryPos === history.length) {
						currentHistoryPos--;
					}
				}
				break;
			case 40: // Down
				if (currentHistoryPos > 0) {
					$('#eval').val(history[--currentHistoryPos]);
				} else {
					if ($('#eval').val() === history[currentHistoryPos]) {
						$('#eval').val('');
					}
				}
		}
	});

	$('#btn-eval').hide();

	$('#btn-eval').click(function() {
		evalCodeRemotely();
		hideBigEval();
	});

	$('#showBig').click(function() {
		if (evalBig) {
			hideBigEval();
		} else {
			showBigEval();
		}
	});

    $('#btn-update-breakpoints').click(updateBreakpoints);
    $('#btn-breakon-next').click(setBreakOnNext);
    $('#btn-continue').click(breakpointContinue);
    $('#btn-step').click(breakpointStep);
    $('#btn-step-over').click(breakpointStepOver);
    $('#btn-step-in').click(breakpointStepIn);
    $('#btn-step-out').click(breakpointStepOut);
    $('#file-switcher').change(switcherSwitchFile);

	$('#btn-clear').click(clearConsole);

	$('#clearConsoleConnect').change(function(e) {
		clearOnConnect = $(this).attr('checked') !== undefined;
	});

	$('#redirectConsole').change(toggleRedirectConsole);

    $continueBtn = $('#btn-continue');
    $stepBtn = $('#btn-step');
    $stepOverBtn = $('#btn-step-over');
    $stepInBtn = $('#btn-step-in');
    $stepOutBtn = $('#btn-step-out');
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
    postToServer({ command: 'set-breakpoints', data: breakpoints});
}

function loadSourceFiles() {
	var prevSelected = $('#file-switcher').val();

    var fileList = getFromServer('/files/list');
    files = {};

    $('#file-switcher option').remove();
    addToFileSwitcher('', '<select file>');

	var isAvailable = false;
    fileList && fileList.files.forEach(function(f) {
		if (f === prevSelected) {
			isAvailable = true;
		}
        var fdata = getFromServer('/files/data/' + f);
        files[f] = {
			file: fdata.data,
			breakpoints: fdata.breakpoints
		};
        addToFileSwitcher(f, f);
    });

	if (isAvailable) {
		$('#file-switcher').val(prevSelected);
	}
}

function toggleRedirectConsole() {
	postToServer({command: 'update-redirect-console', data: $('#redirectConsole').attr('checked') !== undefined});
}

function updateBreakpoints() {
    postToServer({ command: 'set-breakpoints', data: breakpoints });
    paintBreakpoints($('#file-switcher').val());

	var ul = $('#breakpoints');
	ul.empty();
	breakpoints = breakpoints.sort(function(a, b) {
		if (a[0] > b[0]) {
			return 1;
		} else if (a[0] < b[0]) {
			return -1;
		} else {
			return (a[1] - b[1]);
		}
	});

	$(breakpoints).each(function(i, breakpoint) {
		ul.append(
			$('<li>')
				.append(
					$('<button>')
						.append('-')
						.click(function() {
							breakpoints.splice(i, 1);
							updateBreakpoints();
						})
				)
				.append(breakpoint[0] + ':' + breakpoint[1])
				.append('<br>')
				//.append('&nbsp;&nbsp;&nbsp;&nbsp;')
				.append(
					$('<span>').append(getLine(files[breakpoint[0]].file, breakpoint[1]))
				)
		);
	})
}

function setBreakOnNext() {
    postToServer({ command: 'break-on-next', data: breakpoints });
}

function evalCodeRemotely() {
	var data =  $('#eval').val();

	data = data.replace(/\bthis\b/, '__this');
	history.unshift(data);
	currentHistoryPos = 0;
    postToServer({ command: 'eval', data: data});
}

function breakpointContinue() {
    removeLineHightlight();
    disableContinueAndStep();
    postToServer({ command: 'breakpoint-continue' });
}

function breakpointStepCommand(command) {
    removeLineHightlight();
    disableContinueAndStep();
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
	if (!files[data.file]) {
		return;
	}
    tokenize(files[data.file].file || '', function(token, type) {
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

			var extraClass = '';
			if (files[data.file].breakpoints.indexOf(i + 1) < 0) {
				extraClass = ' no-breakpoint';
			}
            var paddedNum = '<span class="linenum'+ extraClass + '" file="'+data.file+'" line="'+num+'">' +
                            '      '.substr(num.length) + num + ' ' +
                            '</span>';
            return paddedNum + ' ' + x;
        });

    $code.html(codeLines.join('\n'));
    $code.find('.linenum:not(.no-breakpoint)').click(toggleBreakpoint);
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
    return breakpoints.filter(function(b) { return b[0] == f && b[1] == l; }).length > 0;
}

function toggleBreakpoint() {
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
    }
    else {
        $(this).addClass('breakpoint');

        breakpoints.push([file, line]);
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

function processOutput(data) {
    switch (data.command) {
        case 'mobile-connected':
			if (clearOnConnect) {
				clearConsole();
			}
			$('#redirectConsole').attr('checked', false);
            writeToConsole('Remote device connected.');
            initDebugger();
            break;
        case 'print-message':
            writeToConsole('<b>'+data.type + '</b>: ' + data.message);
            break;
        case 'print-eval-result':
			try {
				writeToConsole(
					'<br/>&nbsp;&nbsp;&nbsp; <b>INPUT:</b> ' + data.input.replace(/\b__this\b/, 'this') +
						'<br/>&nbsp;&nbsp;&nbsp; <b>RESULT:</b> ' +
						JSON.stringify(JSON.parse(data.result), null, '\t')
							.replace(/\n/g, '<br>&nbsp;&nbsp;&nbsp;')
							.replace(/\t/g, '&nbsp;&nbsp;'));
			} catch (e) {
           		writeToConsole('<b>INPUT:</b> ' + data.input.replace(/\b__this\b/, 'this') + ' <b>RESULT:</b> ' + data.result);
			}
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

function clearConsole() {
	lineNum = 0;
	$('#output-inner').empty();
}

function writeToConsole(msg) {
    $('<div></div>').html((++lineNum) + ': ' + msg).appendTo($('#output-inner'))[0].scrollIntoView();
}


function fileExt(fileName) {
    return fileName.split('.').slice(-1)[0];
}

function showBigEval() {
	evalBig = true;
	$('#showBig').html('&#8681;');
	$('#output-bar').addClass('big-bar');
	$('#btn-eval').show();
}
function hideBigEval() {
	evalBig = false;
	$('#showBig').html('&#8679;');
	$('#output-bar').removeClass('big-bar');
	$('#eval').val('');
	$('#btn-eval').hide();
}

function getLine(string, lineNo) {
	var newString = string;
	for (var i = 0; i < lineNo - 1; i++) {
		newString = newString.slice(newString.indexOf('\n') + 1);
	}
	return newString.substring(0, newString.indexOf('\n'));
}
