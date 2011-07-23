
(function() {
    var aardwolfCmd = Aardwolf.updatePosition("__FILE__", __LINE__);
    if (aardwolfCmd && aardwolfCmd.command == "eval") {
        Aardwolf.doEval(function() { return eval(aardwolfCmd.data); });
        arguments.callee();
    }
})();
