
var keywordListCoffeeScript = [
    'case', 'default', 'function', 'var', 'void', 'with', 'const', 'let', 'enum', 'export', 'import', 
    'native', '__hasProp', '__extends', '__slice', '__bind', '__indexOf', 'new', 'delete', 'typeof',
    'in', 'instanceof', 'return', 'throw', 'break', 'continue', 'debugger', 'if', 'else', 'switch',
    'for', 'while', 'do', 'try', 'catch', 'finally', 'class', 'extends', 'then', 'unless', 'until',
    'loop', 'of', 'by', 'when', 'and', 'or', 'is', 'isnt', 'not', 'this', 'super'
]; 

var literalListCoffeScript = [
    'true', 'false', 'null', 'undefined', 'yes', 'no', 'on', 'off'
];

function tokenizeCoffeeScript(str, onToken) {
    var len = str.length;
    var pos = 0;
    var validRegexPos = false;
    
    while (pos < len) {
        var c = str[pos];
        
        if (c === '"' || c === "'") {
            extractString(c);
        }
        else if (c === '#' && str[pos+1] === '#' && str[pos+2] === '#') {
            extractMultiLineComment();
        }
        else if (c === '#') {
            extractSingleLineComment();
        }
        else if (c === '/' && validRegexPos) {
            extractRegexLiteral();
        }
        else if (c === ' ' || c === '\t') {
            extractWhitespace();
        }
        else if ('0123456789'.indexOf(c) > -1) {
            extractNumber();
        }
        else if (c.match(/^[a-zA-Z_$]$/) !== null) {
            extractWord();
        }
        else {
            extractChar();
        }
    }
    
    function onTokenInternal(token, type) {
        /* A slash following an assigment operator, a semicolon or an 
           opening paren can be a regex literal delimiter. */
        if (type === 'char' && ':=;({'.indexOf(token) > -1) {
            validRegexPos = true;
        } else {
            validRegexPos = false;
        }
        
        onToken(token, type);
    }
    
    function extractSingleLineComment() {
        var endPos = str.indexOf("\n", pos);
        if (endPos === -1) {
            endPos = len - 1;
        }
        onTokenInternal(str.substring(pos, endPos), 'comment');
        pos = endPos;
    }
    
    function extractMultiLineComment() {
        var endPos = pos;
        while (!(str[++endPos] === '#' && str[endPos+1] === '#' && str[endPos+2] === '#'));
        endPos += 3;
        onTokenInternal(str.substring(pos, endPos), 'comment');
        pos = endPos;
    }
    
    function extractRegexLiteral() {
        var endPos = pos;
        /* regex literal body /.../ */
        while (str[++endPos] != '/') {
            if (str[endPos] == '\\') {
                ++endPos;
            }
        }
        /* flags following the body */
        while ('gimy'.indexOf(str[++endPos]) !== -1);
        onTokenInternal(str.substring(pos, endPos), 'regex');
        pos = endPos;
    }
    
    function extractString(quoteChar) {
        var endPos = pos;
        while (str[++endPos] != quoteChar) {
            if (str[endPos] == '\\') {
                ++endPos;
            }
        }
        ++endPos;
        onTokenInternal(str.substring(pos, endPos), 'string');
        pos = endPos;
    }
    
    function extractNumber() {
        var endPos = pos;
        while ('0123456789.eE'.indexOf(str[++endPos]) !== -1);
        onTokenInternal(str.substring(pos, endPos), 'number');
        pos = endPos;
    }
    
    function extractWord() {
        var endPos = pos;
        while (str[++endPos].match(/^[a-zA-Z_$0-9]$/) !== null);
        onTokenInternal(str.substring(pos, endPos), 'word');
        pos = endPos;
    }
    
    function extractWhitespace() {
        var endPos = pos;
        while (' \t'.indexOf(str[++endPos]) !== -1);
        onTokenInternal(str.substring(pos, endPos), 'whitespace');
        pos = endPos;
    }
    
    function extractChar() {
        var c = str.substr(pos, 1);
        onTokenInternal(c, c === '\n' ? 'newline' : 'char');
        ++pos;
    }
}
