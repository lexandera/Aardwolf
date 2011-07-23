
(function() {
    var aardwolfEvalCmd = Aardwolf.updatePosition("__FILE__", __LINE__, __DEBUGGER__);
    if (typeof aardwolfEvalCmd != 'undefined') {
        Aardwolf.doEval(function() { return eval(aardwolfEvalCmd.data); });
        arguments.callee();
    }
})();
