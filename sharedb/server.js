var http = require('http');
var express = require('express');
var ShareDB = require('sharedb');
var WebSocket = require('ws');
var WebSocketJSONStream = require('@teamwork/websocket-json-stream');

var docs = [];
var backend = new ShareDB();
createDoc(startServer);
var numDocs = 0;

// Create initial document then fire callback
function createDoc(callback) {
  var connection = backend.connect();

  for(let i=0; i<2; i++) {
    let doc = connection.get('examples', 'text' + i);
    doc.fetch(function(err) {
      if (err) throw err;
      if (doc.type === null) {
        doc.create({ content: '' }, function() {
          numDocs++;
          callback();
        });
        return;
      }
      callback();
    });
    docs.push(doc);
  }
}

function startServer() {
  if(numDocs < 2) {
    return;
  }
  var app = express();
  app.use(express.static('static'));
  var server = http.createServer(app);

  var wss = new WebSocket.Server({server: server});
  wss.on('connection', function(ws, req) {
    var stream = new WebSocketJSONStream(ws);
    backend.listen(stream);
  });

  server.listen(8080);
  console.log('Listening on http://localhost:8080');
}
