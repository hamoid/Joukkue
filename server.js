// database - https://github.com/louischatriot/nedb

var Datastore = require('nedb')
, dbLayers = new Datastore({ filename: 'layers.db', autoload: true })
, dbSorted = new Datastore({ filename: 'sorted.db', autoload: true });

dbLayers.persistence.setAutocompactionInterval(300 * 1000);
dbSorted.persistence.setAutocompactionInterval(300 * 1000);

// web server

var app = require('express')();

app.get('/', function(req, res) {
    res.sendFile(__dirname + '/index.html');
});

app.get('/*.(js|css|png)', function(req, res) {
    res.sendFile(__dirname + "/public" + req.url);
});

var server = app.listen(3000, function () {
  var host = server.address().address
  var port = server.address().port
  console.log('CreativeCodeChat listening at http://%s:%s', host, port)
});

// socket.io

var io = require('socket.io').listen(server);

io.on('connection', function(socket) {
  console.log('user connected');

  var layersSorted = {};
  var layers = {};

  function getUsersInRoom(user, room) {
    var names = [];
    var clients = io.sockets.adapter.rooms[room];
    for (var name in clients ) {
      var c = io.sockets.connected[name];
      if(user != c.username) {
        names.push(c.username);
      }
    }
    if(names.length > 0) {
      return "with " + names.join(", ");
    } else {
      return "by yourself"
    }
  }

  function sendLayersToUser() {
    if(layers[socket.room] == undefined) {
      layers[socket.room] = {};
      dbLayers.find({ room: socket.room }, function(err, layerData) {
        if (layerData.length > 0) {
          for(var i in layerData) {
            var n = layerData[i].name;
            layers[socket.room][n] = {
              name: n,
              vars: layerData[i].vars,
              draw: layerData[i].draw
            };
          }
        }
        dbSorted.findOne({ room: socket.room }, function(err, sortedData) {
          if(sortedData && sortedData.names) {
            layersSorted[socket.room] = sortedData.names;
          } else {
            layersSorted[socket.room] = [];
          }
          socket.emit('allLayers', layersSorted[socket.room], layers[socket.room]);
        });
      });
    } else {
      socket.emit('allLayers', layersSorted[socket.room], layers[socket.room]);
    }
  }

  socket.on('addUser', function(username) {
    socket.username = username;
    socket.room = 'default';
    socket.join(socket.room);
    sendLayersToUser();
    // to you
    socket.emit('say', 'SERVER', 'Hi ' + socket.username + '!\n'
                + 'You are in the ' + socket.room + ' room '
                + getUsersInRoom(socket.username, socket.room) + '.\n'
                + 'Use cc.joinRoom("roomName") to change rooms.\n'
                + 'Type cc.help() if you need it :)');
    // to room
    socket.to(socket.room).emit('say', 'SERVER', socket.username + ' is here');

    console.log('user identifies as ' + socket.username);
  });


	socket.on('joinRoom', function(newroom){
		socket.leave(socket.room);
		socket.join(newroom);

    // to you
		socket.emit('say', 'SERVER', 'Your are now in room '+ newroom);

    // to old room
		socket.broadcast.to(socket.room).emit('say', 'SERVER', socket.username + ' went to room ' + newroom);

    // to new room
		socket.broadcast.to(newroom).emit('say', 'SERVER', socket.username + ' is here');
		socket.room = newroom;
    sendLayersToUser();
	});

  socket.on('say', function(msg) {
    socket.broadcast.to(socket.room).emit('say', socket.username, msg);
  });

  socket.on('vars', function(name, obj) {
    dbLayers.update(
      { room: socket.room, name: name },
      { $set: { room: socket.room, name: name, vars: obj } },
      { upsert: true },
      function(err, numReplaced, newDoc) {
        console.log('vars', name, err, numReplaced, newDoc);
        io.to(socket.room).emit('vars', name, obj);
      }
    );
  });

  socket.on('draw', function(name, func) {
    if(layersSorted[socket.room].indexOf(name) == -1) {
      layersSorted[socket.room].push(name);
    }
    dbLayers.update(
      { room:socket.room, name: name },
      { $set: { room: socket.room, name: name, draw: func } },
      { upsert: true },
      function(err, numReplaced, newDoc) {
        console.log('update dbLayers', name, err, numReplaced, newDoc);
        dbSorted.update(
          { room:socket.room, name: name },
          { $set: { room: socket.room, name: name, names: layersSorted[socket.room] } },
          { upsert: true },
          function(err, numReplaced, newDoc) {
            console.log('update dbSorted', name, err, numReplaced, newDoc);
            io.to(socket.room).emit('draw', name, func, layersSorted[socket.room]);
          }
        );
      }
    );
  });

  socket.on('remove', function(name) {
    var idx = layersSorted[socket.room].indexOf(name);
    if(idx != -1) {
      layersSorted[socket.room].splice(idx, 1);
    }
    dbLayers.remove(
      { room:socket.room, name: name },
      { },
      function(err, numRemoved) {
        console.log("remove dbLayers", err, numRemoved);
        dbSorted.update(
          { room:socket.room, name: name },
          { $set: { room: socket.room, name: name, names: layersSorted[socket.room] } },
          { upsert: true },
          function(err, numReplaced, newDoc) {
            delete layers[socket.room][name];
            console.log('update dbSorted', name, err, numReplaced, newDoc);
            io.to(socket.room).emit('remove', name, layersSorted[socket.room]);
          }
        );
      }
    );
  });

  socket.on('depth', function(name, dep) {
    dep = Math.max(dep, 0);
    dep = Math.min(dep, layersSorted[socket.room].length - 1)

    var idx = layersSorted[socket.room].indexOf(name);
    if(idx != -1) {
      layersSorted[socket.room].splice(idx, 1);
    }
    layersSorted[socket.room].splice(Math.floor(dep), 0, name);

    dbSorted.update(
      { room:socket.room, name: name },
      { $set: { room: socket.room, name: name, names: layersSorted[socket.room] } },
      { upsert: true },
      function(err, numReplaced, newDoc) {
        console.log('update dbSorted', name, err, numReplaced, newDoc);
        io.to(socket.room).emit('depth', name, dep, layersSorted[socket.room]);
      }
    );
  });

  socket.on('disconnect', function() {
    console.log('user disconnect ' + socket.username);
  });

});

