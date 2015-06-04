var http = require('http');
var fs = require('fs');
var path = require('path');
var mime = require('mime');
var jade = require('jade');

var cache = {};

function send404(res) {
  res.writeHead(404, { "Content-Type": "text/plain" });
  res.write("Error 404, не найдено!!!");
  res.end();
}

function sendFile(res, filePath, fileContent) {
  if (path.extname(filePath) === '.jade') {
    var fn = jade.compileFile(filePath);
    var html = fn();
    res.writeHead(200, { "Content-Type": "text/html" });
    res.end(html);
  }
  res.writeHead(
    200,
    { "Content-Type": mime.lookup(path.basename(filePath)) }
  );
  res.end(fileContent);
}

function serveFile(err, data) {
  if (err) {
    send404(res); // not found
  } else {
    cache[absPath] = data; // save in cache
    sendFile(res, absPath, cache[absPath]); // serve cached file
  }
};

function setFileToCache(res, cache, absPath) {
  fs.exists(absPath, function(exists) {
    if (exists) {
      fs.readFile(absPath, function(err, data) {
        if (err) {
          send404(res); // not found
        } else {
          cache[absPath] = data; // save in cache
          sendFile(res, absPath, cache[absPath]); // serve cached file
        }
      });
    } else {
      send404(res); // not found
    }
  });
};

//TODO: check this refactored hell
// serve static files, but first - let them to cache
function serveStatic(res, cache, absPath) {
  if (cache[absPath]) {
    sendFile(res, absPath, cache[absPath]); // serve cached file
  } else {
    setFileToCache(res, cache, absPath);
  }
}

var server = http.createServer(function(req, res) {
  var filePath = false;
  if (req.url == '/') {
    filePath = 'public/index.jade';
  } else {
    filePath = 'public' + req.url;
  }
  var absPath = './' + filePath;
  serveStatic(res, cache, absPath);
});

server.listen(3000, 'localhost', function() {
  console.log('server listen on localhost:3000');
});
