var http = require("http"),
    url = require("url"),
    path = require("path"),
    fs = require("fs")
    port = process.argv[2] || 8888;


function handleLogin(request, response) {
  request.addListener("data", function(chunk) {
    request.content += chunk;
  });
   
    request.addListener("end", function() {
      console.log('Data: ', request.content);

    response.writeHead(200, {"Content-Type": "text/html"});
    response.end("No data to return.");

  });
}

function handleREST(uri, request, response)
{
    console.log('Handling REST:', uri);
    if (uri == '/login') {
      return handleLogin(request, response);
    }

    response.writeHead(404, {"Content-Type": "text/plain"});
    response.write("404 Not Found\n");
    response.end();
}

String.prototype.endsWith = function(suffix) {
    return this.indexOf(suffix, this.length - suffix.length) !== -1;
};

function getContentType(filename) {
	if (filename.endsWith('.html') || filename.endsWith('.htm') ) {
		return 'text/html';
	} else if (filename.endsWith('.js')) {
		return 'application/javascript';
	} else if (filename.endsWith('.css')) {
		return 'text/css';
	}
	return 'text/plain';
}
 
http.createServer(function(request, response) {
  request.setEncoding("utf8");
  request.content = '';

  var uri = url.parse(request.url).pathname
    , filename = path.join(process.cwd(), 'htdocs', uri);

  path.exists(filename, function(exists) {
    if(!exists) {
      handleREST(uri, request, response);
      return;
    }

    console.log('Requesting filename: ', filename);

    if (fs.statSync(filename).isDirectory()) filename += '/index.html';
 
    fs.readFile(filename, "binary", function(err, file) {
      if(err) {        
        response.writeHead(500, {"Content-Type": "text/plain"});
        response.write(err + "\n");
        response.end();
        return;
      }
 
      response.writeHead(200, {"Content-Type": getContentType(filename)});
      response.write(file, "binary");
      response.end();
    });
  });
}).listen(parseInt(port, 10));
 
console.log("Static file server running at\n  => http://localhost:" + port + "/\nCTRL + C to shutdown");
