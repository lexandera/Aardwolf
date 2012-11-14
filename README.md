Aardwolf
========

Aardwolf is a remote JavaScript debugger for Android / iOS / Windows Phone 7 / BlackBerry OS 6+ and is written in JavaScript. It's available under the MIT license.

Home page: http://lexandera.com/aardwolf/

Currently it supports:

* breakpoints
* code evaluation at breakpoint
* break on next
* step/continue execution control
* stack listing
* exception reporting (also for exceptions thrown in async calls)
* JavaScript console remoting


It consists of the following parts:

* a server for communication between the mobile device and the UI
* a code rewriter which injects debug info into your existing source code
* a debug library which can break execution of your scripts, report execution progress, evaluate code, etc.
* a UI for setting breakpoints, stepping through code and seeing the current position within the script


In order to run the examples you will need:

* Node.js. Get it here: http://nodejs.org/#download
* An Android 2.x/iOS/WindowsPhone7 device or emulator (although running them from a Firefox/Chrome/Safari window will also work)


Setting it up
----------------------------------------------------------------------------------------------------

* Begin by installing node.js and Git
* Get the Aardwolf source code from GitHub: 
`git clone git://github.com/lexandera/Aardwolf.git`
* Download the required libraries by running "npm link" in the checked-out directory
* Start the server by running "node app.js -h &lt;ip-or-hostname-of-your-computer&gt;"
* After the server starts up, open http://localhost:8000 in your desktop browser. The debugger UI should appear.
* Open http://ip-or-hostname-of-your-computer:8500/calc.html on your phone and wait for the page to load. The line "Mobile device connected." should appear in the UI's output pane.
* You're now debugging the "calculator" example script.


If you're having problems opening the example, make sure that access to the port 8500 on your computer is not blocked by a firewall and that the address you entered into the config file can really be accessed from your phone. This is where your phone will load the samples from, so it must work.

You will get best results by connecting both you computer and your phone to the same WiFi network.


CoffeeScript support
----------------------------------------------------------------------------------------------------

Aardwolf now also contains extrememly basic CoffeeScript support. It probably can't handle any serious real-world code, but it's a good starting point if someone wishes to fork the source and work on it.

The steps for debugging the CoffeeScript example are the same as the steps described above, except:

* Replace calc.html with calc-coffee.html in the final step when opening the example.


Debugging your own code
----------------------------------------------------------------------------------------------------

The procedure is the same as above, except:

* When starting the server, add an additional parameter called -d or --file-dir, like this:  
    `node app.js -h <ip-or-hostname-of-your-computer> -d </path/to/www/root>`
* In your HTML page include the aardwolf.js debug library as the very first JS file and change the paths of included files to point to the files modified by Aardwolf:
    <pre>
    &lt;script type="text/javascript" src="http://ip-or-hostname-of-your-computer:8500/aardwolf.js"&gt; &lt;/script&gt;
    &lt;script type="text/javascript" src="http://ip-or-hostname-of-your-computer:8500/some-script.js"&gt; &lt;/script&gt;
    &lt;script type="text/javascript" src="http://ip-or-hostname-of-your-computer:8500/some-other-script.js"&gt; &lt;/script&gt;
    </pre>
* Reload the debugger UI first, then reload the page you just modified. The line "Mobile device connected." should appear in the UI's output pane.
* You should now be able to evaluate code remotely, set breakpoints, etc.


Debugging processed or minified code
----------------------------------------------------------------------------------------------------

If you wish to debug code which gets concatenated into a single file, minified, or transformed in some other way, you can still use Aardwolf, but you'll need to make a minor change in the part of your application which reads the code before it gets transformed.

It is important that Aardwolf can access source files before they are processed. Therefore you will need to set it up just as described in the previous section, with the '-d' parameter pointing to the directory containing unprocessed files, then change the processing code in you application so it reads files served by Aardwolf instead of reading them straight from the filesystem.

For example, if your code looks something like this:

    jscode += readFile('some-script.js');
    jscode += readFile('some-other-script.js');

you would need to change it to something like this:
    
    jscode += readFile('http://aardwolf-host:8500/aardwolf.js'); // Don't forget to include this!
    jscode += readFile('http://aardwolf-host:8500/some-script.js');
    jscode += readFile('http://aardwolf-host:8500/some-other-script.js');

In most languages, making the modification should be pretty straightforward. PHP's `file_get_contents($url)` and Clojure's `(slurp url)` will handle the change from local paths to URLs transparently. In Scala you can use `io.Source.fromURL(url).mkString`, Ruby has the 'OpenURI' module and in NodeJS you should be able to read remote files using the 'request' module.

Now you should be ready to debug processed code. And since Aardwolf has access to the original files, its UI will display the original, unprocessed code for easier debugging.


How it works
----------------------------------------------------------------------------------------------------

Breaking code execution and evaluating code at that point is enabled by code rewriting. Aardwolf's server contains a rather simple code rewriter which inserts debug hooks in front of every statement in the source code. These debug statements look like this:

    Aardwolf.updatePosition(  
        "/calc.js", // File path  
        7,          // Line number  
        false,      // Is current line a "debugger;" statement?  
        function(aardwolfEval) {       // This closure captures the current scope and makes it  
            return eval(aardwolfEval); // possible to pass it into another function.  
        }  
    );  

The first two parameters – file path and line number – should be self explanatory. Every time `Aardwolf.updatePosition()` is called, the given file and line number are checked against a list of breakpoints, and if a match is found, script execution is halted by performing a synchronous XMLHttpRequest to the server.

The third parameter signals whether the current line contains a `debugger;` statement. If it does, we must break execution even if there is no breakpoint set on that line.

Finally, the last parameter is a closure which captures the scope it's defined in and allows us to pass it around. When a string is passed to this function for evaluation, it will be eval'd in the same scope where this closure was defined, thus enabling us to evaluate code at the point where script execution was halted.