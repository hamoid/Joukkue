var Datastore = require('nedb')
, constants = require('./public/constants')
, string = require('./public/string')
, txt = require('./public/txt')
, dbLayers = new Datastore({ filename: 'layers.db', autoload: true });

dbLayers.persistence.setAutocompactionInterval(300 * 1000);


//  ┬ ┬┌─┐┌┐   ┌─┐┌─┐┬─┐┬  ┬┌─┐┬─┐
//  │││├┤ ├┴┐  └─┐├┤ ├┬┘└┐┌┘├┤ ├┬┘
//  └┴┘└─┘└─┘  └─┘└─┘┴└─ └┘ └─┘┴└─

var app = require('express')();
var modifiedCache = [];

app.get('/', function(req, res) {
    res.sendFile(__dirname + '/index.html');
});

app.get('/*.(js|css|png|gif)', function(req, res) {
    res.sendFile(__dirname + "/public" + req.url);
});

var server = app.listen(3000, function () {
  var host = server.address().address
  var port = server.address().port
  console.log(txt.listeningAt, host, port)
});


//  ┌─┐┌─┐┌─┐┬┌─┌─┐┌┬┐ ┬┌─┐
//  └─┐│ ││  ├┴┐├┤  │  ││ │
//  └─┘└─┘└─┘┴ ┴└─┘ ┴ o┴└─┘

var io = require('socket.io').listen(server);

io.on('connection', function(socket) {

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
      return txt.with + ' ' + names.join(', ');
    } else {
      return txt.byYourself;
    }
  }

  function sendLayersToUser() {
    var layers = {};
    dbLayers.find({ room: socket.room }).sort({ depth: -1 }).exec(function(err, layerData) {
      if (layerData.length > 0) {
        for(var i in layerData) {
          layers[layerData[i].name] = layerData[i];
        }
      }
      socket.emit(constants.CMD_SET_LAYERS, layers, modifiedCache[socket.room]);
    });
  }

  function sendRoomInfo() {
    socket.emit(constants.CMD_SAY, txt.serverName, string.fmt(
      txt.roomInfo,
      socket.username,
      socket.room,
      getUsersInRoom(socket.username, socket.room)
    ));
  }

  function sendRoomList() {
    var rooms = {};
    dbLayers.find({}, { room: 1 }, function(err, layerData) {
      layerData.map(function(l) { rooms[l.room] = true; });
      socket.emit(constants.CMD_SAY, txt.serverName, string.fmt(
        txt.roomList,
        Object.keys(rooms).join(', ')
      ));
    });
  }

  socket.on(constants.CMD_REQ_ROOM_INFO, function() {
    sendRoomInfo();
  });

  socket.on(constants.CMD_LIST_ROOMS, function() {
    sendRoomList();
  });

  socket.on(constants.CMD_ADD_USER, function(username) {
    socket.username = username;
    socket.room = constants.DEFAULT_ROOM;
    socket.join(socket.room);
    sendLayersToUser();
    // to you
    sendRoomInfo();
    // to room
    socket.to(socket.room).emit(
      constants.CMD_SAY,
      txt.serverName,
      string.fmt(txt.someoneIsHere, socket.username)
    );
  });

  socket.on(constants.CMD_SET_NEW_NAME, function(username) {
    io.to(socket.room).emit(
      constants.CMD_SAY,
      txt.serverName,
      string.fmt(txt.nameChanged, socket.username, username)
    );
    socket.username = username;
  });


	socket.on(constants.CMD_JOIN_ROOM, function(newroom){
    // to you
		socket.emit(
      constants.CMD_SAY,
      txt.serverName,
      string.fmt(txt.youAreIn, newroom)
      + getUsersInRoom(socket.username, newroom)
      + '.\n');

    // to old room
		socket.broadcast.to(socket.room).emit(
      constants.CMD_SAY,
      txt.serverName,
      string.fmt(txt.wentToRoom, socket.username, newroom)
    );

    // to new room
		socket.broadcast.to(newroom).emit(
      constants.CMD_SAY,
      txt.serverName,
      string.fmt(txt.someoneIsHere, socket.username)
    );

		socket.leave(socket.room);
		socket.join(newroom);
		socket.room = newroom;
    sendLayersToUser();
	});

  socket.on(constants.CMD_SAY, function(msg) {
    socket.broadcast.to(socket.room).emit(
      constants.CMD_SAY, socket.username, msg
    );
    socket.emit(
      constants.CMD_SAY, socket.username, msg, true
    );
  });

  socket.on(constants.CMD_ADD_LAYER, function() {
    var layerName = string.genID();

    var onDepthsFound = function(err, depthData) {
      var depths = depthData.map(function(l) { return l.depth; });
      depths.push(0);
      var maxDepth = Math.max.apply(Math, depths);
      var newDepth = (maxDepth + 1000) / 2;
      dbLayers.insert(
        { room: socket.room, name: layerName, depth: newDepth },
        function(err, newDoc) {
          io.to(socket.room).emit(
            constants.CMD_ADD_LAYER, layerName, newDepth);
        }
      );
    }

    dbLayers.find({ room: socket.room }, { depth: 1 }, onDepthsFound);
  })

  socket.on(constants.CMD_SET_VARS, function(name, vars, selection) {
    dbLayers.update(
      { room: socket.room, name: name },
      { $set: { room: socket.room, name: name, vars: vars } },
      { upsert: true },
      function(err, numReplaced, newDoc) {
        io.to(socket.room).emit(
          constants.CMD_SET_VARS, name, vars, selection);
      }
    );
  });

  socket.on(constants.CMD_SET_DRAW, function(name, func) {
    dbLayers.update(
      { room:socket.room, name: name },
      { $set: { room: socket.room, name: name, draw: func } },
      { upsert: true },
      function(err, numReplaced, newDoc) {
        io.to(socket.room).emit(
          constants.CMD_SET_DRAW, name, func);
      }
    );
  });

  socket.on(constants.CMD_REMOVE, function(name) {
    dbLayers.remove(
      { room:socket.room, name: name },
      { },
      function(err, numRemoved) {
        io.to(socket.room).emit(
          constants.CMD_REMOVE, name);
      }
    );
  });

  socket.on(constants.CMD_SET_DEPTH, function(name, cmd) {
    // cmd can be: 'up' || 'down' || 'top' || 'bottom'

    var onDepthsFound = function(err, depthData) {
      var myDepth, newDepth, last;
      var depths = depthData.map(function(l) {
        if(l.name == name) myDepth = l.depth;
        return l.depth;
      });
      depths.push(0);
      depths.push(1000);
      depths.sort(function(a,b) { return a-b; });
      last = depths.length - 1;
      newDepth = myDepth;
      switch(cmd) {
        case 'top':
          newDepth = (depths[last] + depths[last-1]) / 2;
          break;
        case 'bottom':
          newDepth = (depths[0] + depths[1]) / 2;
          break;
        case 'up':
          var i = depths.indexOf(myDepth) + 1;
          if(i < last) {
            newDepth = (depths[i+1] + depths[i]) / 2;
          }
          break;
        case 'down':
          var i = depths.indexOf(myDepth) - 1;
          if(i>0) {
            newDepth = (depths[i-1] + depths[i]) / 2;
          }
          break;
      }
      dbLayers.update(
        { room:socket.room, name: name },
        { $set: { depth: newDepth  } },
        { },
        function(err) {
          io.to(socket.room).emit(
            constants.CMD_SET_DEPTH,
            name,
            newDepth
          );
        }
      );
    }
    dbLayers.find({ room: socket.room }, { name:1, depth:1 }, onDepthsFound);
  });

  socket.on(constants.CMD_SET_ENABLED, function(name, enabled) {
    dbLayers.update(
      { room:socket.room, name: name },
      { $set: { room: socket.room, name: name, enabled: enabled  } },
      { upsert: true },
      function(err, numReplaced, newDoc) {
        io.to(socket.room).emit(
          constants.CMD_SET_ENABLED,
          name,
          enabled
        );
      }
    );
  });

  socket.on(constants.CMD_SET_MODIFIED, function(id, modified) {
    var tooOld = Date.now() - 1000 * 60 * 5; // 5 min

    modifiedCache[socket.room] = modifiedCache[socket.room] || {};
    modifiedCache[socket.room][id] = modifiedCache[socket.room][id] || {};

    if(modified) {
      modifiedCache[socket.room][id][socket.username] = Date.now();
    } else {
      delete modifiedCache[socket.room][id][socket.username];
    }

    for(var lid in modifiedCache[socket.room]) {
      for(var user in modifiedCache[socket.room][lid]) {
        if(modifiedCache[socket.room][lid][user] < tooOld) {
          delete modifiedCache[socket.room][lid][user];
        }
      }
    }

    io.to(socket.room).emit(
      constants.CMD_SET_MODIFIED,
      id,
      Object.keys(modifiedCache[socket.room][id]).length
    );
  });

  socket.on('disconnect', function() {
    for(var lid in modifiedCache[socket.room]) {
      delete modifiedCache[socket.room][lid][socket.username];
    }

    socket.to(socket.room).emit(
      constants.CMD_SAY,
      txt.serverName,
      string.fmt(txt.someoneIsGone, socket.username)
    );
  });

});
