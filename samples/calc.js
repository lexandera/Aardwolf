
var $number1;
var $number2;
var $number3;
var $result;

$(function() {
    $number1 = $('#number1');
    $number2 = $('#number2');
    $number3 = $('#number3');
    $result = $('#result');
    
    $('#calculate').click(calculate);
    $('#reset').click(reset);
});


function calculate() {
    var a = Number($number1.val());
    var b = Number($number2.val());
    var c = Number($number3.val());

    function performAddition(n1, n2) {
        console.log('Performing addition of '+n1+' and '+n2+'.');
        return n1 + n2;
    }
    
    function performMultiplication(n1, n2) {
        console.log('Performing multiplication of '+n1+' and '+n2+'.');
        
        setTimeout(function() {
            nonExistingObjectForExceptionReportingDemonstration.bar();
        }, 1000);
        
        return n1 * n2;
    }
    
    var sum = performAddition(a, b);
    var total = performMultiplication(sum, c);
    
    $result.text(total);
}


function reset() {
    debugger;
    $number1.val('');
    $number2.val('');
    $number3.val('');
    $result.text('');
}

