
try {
  var aardwolfEvalFunc = function(aardwolfEval) { return eval(aardwolfEval); };
  SPLIT
} catch (aardwolfEx) {
    if (!aardwolfEx.rethrown) {
        Aardwolf.reportException(aardwolfEx);
    }
    aardwolfEx.rethrown = true;
    throw aardwolfEx;
}
