
var x = 50;
var y = 100;

function printResultToConsole() {
    console.log('Result: ' + (x + y));
}

function executeFunction(fun) {
    fun();
}

executeFunction(printResultToConsole);

window.addEventListener('load', function() {
    document.body.innerHTML = ''+x+'+'+y+'='+(x+y);
}, false);
