var http = require('http');
var fs = require('fs');
var path = require('path');
var mime = require('mime');

var cache = {};

function send404(res) {
  res.writeHead(404, { "Content-Type": "text/plain" });
  res.write("Error 404, не найдено!!!");
  res.end();
}

function sendFile(res, filePath, fileContent) {
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
      fs.readFile(absPath, serveFile);
    } else {
      send404(res); // not found
    }
  });
};

//TODO: check the refactored hell
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
    filePath = 'public/index.html';
  } else {
    filePath = 'public' + req.url;
  }
  var absPath = './' + filePath;
  serveStatic(res, cache, absPath);
});

server.listen(3000, 'localhost', function() {
  console.log('server listen on localhost:3000');
});
