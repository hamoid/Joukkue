var http = require('http');
var Duplex = require('stream').Duplex;
var browserChannel = require('browserchannel').server;
var express = require('express');
var livedb = require('livedb');
var sharejs = require('share');
var shareCodeMirror = require('share-codemirror');

var backend = livedb.client(livedb.memory());
var share = sharejs.server.createClient({backend: backend});

var app = express();

app.use(express.static(__dirname));
app.use(express.static(shareCodeMirror.scriptsDir));
app.use(express.static(__dirname + '/node_modules/codemirror'));
app.use(express.static(sharejs.scriptsDir));

// Most of this code comes from
// https://github.com/share/share-codemirror/blob/master/examples/server.js

// ╔═╗┬ ┬┌─┐┬─┐┌─┐  ┬┌─┐
// ╚═╗├─┤├─┤├┬┘├┤   │└─┐
// ╚═╝┴ ┴┴ ┴┴└─└─┘o└┘└─┘

app.use(browserChannel(function (client) {
  console.log('connected to code channel ' + client.id);

  var stream = new Duplex({objectMode: true});
  stream._write = function (chunk, encoding, callback) {
    if (client.state !== 'closed') {
      client.send(chunk);
    }
    callback();
  };
  stream._read = function () {
  };
  stream.headers = client.headers;
  stream.remoteAddress = stream.address;
  client.on('message', function (data) {
    stream.push(data);
  });
  stream.on('error', function (msg) {
    client.stop();
  });
  client.on('close', function (reason) {
    stream.emit('close');
    stream.emit('end');
    stream.end();
  });
  return share.listen(stream);
}));


// ╔╦╗┌─┐┌┬┐┌─┐  ┌─┐┬ ┬┌─┐┌┐┌┌┐┌┌─┐┬
// ║║║├┤  │ ├─┤  │  ├─┤├─┤││││││├┤ │
// ╩ ╩└─┘ ┴ ┴ ┴  └─┘┴ ┴┴ ┴┘└┘┘└┘└─┘┴─┘

var allSessions = {};

app.use(browserChannel({ base: '/meta'}, function(session) {
  console.log('connected to meta channel ' + session.id);
  allSessions[session.id] = session;

  session.on('message', function (data) {
    if(data && data.op && data.arg) {
      console.log(data.op, data.arg);
      switch(data.op) {
        case 'others':
          for(var id in allSessions) {
            if(id != session.id) {
              allSessions[id].send({ op: 'say', arg: data.arg });
            }
          }
         break;

        case 'all':
          for(var id in allSessions) {
            allSessions[id].send({ op: 'say', arg: data.arg });
          }
          break;

        case 'run':
          for(var id in allSessions) {
            if(id != session.id) {
              allSessions[id].send({ op: 'run', arg: data.arg });
            }
          }
          break;
      }
    }
  });
  session.on('close', function (reason) {
    delete allSessions[session.id];
    console.log(session.id + ' is gone because ' + reason);
  });

  return session;
}));


var server = http.createServer(app);
server.listen(3000, function (err) {
  if (err) throw err;

  console.log('Listening on http://%s:%s', server.address().address, server.address().port);
});
