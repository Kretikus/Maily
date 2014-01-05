var http = require("http");
var url = require("url");
var path = require("path");
var fs = require("fs");
var ws = require("ws");

var Imap = require("imap");
var inspect = require('util').inspect;

var port = process.argv[2] || 8888;

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
  request.setEncoding('utf8');
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

// WEBSOCKET -----------------------------------------------

var WebSocketServer = require('ws').Server;
var wss = new WebSocketServer({port: port+1});

wss.on('connection', function(ws) {
    ws.on('message', function(message) {
        console.log('received: ', message);
        var parsedMsg = JSON.parse(message);
        if (parsedMsg['cmd'] == 'login') {
            var data = parsedMsg['params'];
            var loggedIn = false;
            if (data['username'] === 'roman' && data['password'] == '4321') {
                loggedIn = true;
            }
            ws.send(JSON.stringify({"cmd": "login", "reply": loggedIn ? 1 : 0}));
            return;
        }

        ws.send(JSON.stringify({"error": 1, "description": "Illegal command"}));
    });
});


// IMAP -----------------------------------------------


var cachedEmails = [];


var imap = new Imap({
    user: 'XXX',
    password: 'XXXX',
    host: 'XXX',
    port: 993,
    tls: true,
    tlsOptions: { rejectUnauthorized: false }
});

function openInbox(cb) {
  imap.openBox('INBOX', true, cb);
}

imap.once('ready', function() {
    openInbox(function(err, box) {
        if (err) throw err;
        var f = imap.seq.fetch('1:30', {
            bodies: 'HEADER.FIELDS (FROM TO SUBJECT DATE)',
            struct: false
        });
        f.on('message', function(msg, seqno) {
            console.log('Message #%d', seqno);
            var prefix = '(#' + seqno + ') ';
            msg.on('body', function(stream, info) {
                var buffer = '';
                stream.on('data', function(chunk) {
                    buffer += chunk.toString('utf8');
                });
                stream.once('end', function() {
                    var parsedHeader = inspect(Imap.parseHeader(buffer));
                    cachedEmails[seqno] = parsedHeader;
                    console.log(prefix + 'Parsed header: %s', parsedHeader);
                });
            });
            msg.once('attributes', function(attrs) {
                console.log(prefix + 'Attributes: %s', inspect(attrs, false, 8));
            });
            msg.once('end', function() {
                console.log(prefix + 'Finished');
            });
        });
        f.once('error', function(err) {
            console.log('Fetch error: ' + err);
        });
        f.once('end', function() {
            console.log('Done fetching all messages!');
            imap.end();
        });
    });
});

imap.once('error', function(err) {
    console.log(err);
});

imap.once('end', function() {
    console.log('Connection ended');
});

imap.connect();
