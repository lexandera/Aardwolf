
try {
  SPLIT
} catch (aardwolfEx) {
    if (!aardwolfEx.rethrown) {
        Aardwolf.reportException(aardwolfEx);
    }
    aardwolfEx.rethrown = true;
    throw aardwolfEx;
}
