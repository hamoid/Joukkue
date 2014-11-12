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

  console.log('CodeChat listening at http://%s:%s', host, port)
});


var io = require('socket.io').listen(server);
io.on('connection', function(socket) {
  console.log('user connected');

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

  socket.on('addUser', function(username) {
    socket.username = username;
    socket.room = 'default';
    socket.join(socket.room);

    // to you
    socket.emit('say', 'SERVER', 'Hi ' + username + '!\n'
                + 'You are in the ' + socket.room + ' room '
                + getUsersInRoom(username, socket.room) + '.\n'
                + 'Use cc.joinRoom("roomName") to change rooms.\n'
                + 'Type cc.help() if you need it :)');
    // to room
		socket.to(socket.room).emit('say', 'SERVER',
                username + ' is here');

    console.log('user identifies as ' + username);
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
	});

  socket.on('say', function(msg) {
    socket.broadcast.to(socket.room).emit('say', socket.username, msg);
  });

  socket.on('vars', function(name, obj) {
    console.log('vars', name, obj);
    io.to(socket.room).emit('vars', name, obj);
  });

  socket.on('draw', function(name, func) {
    console.log('draw', name, func);
    io.to(socket.room).emit('draw', name, func);
  });

  socket.on('remove', function(name) {
    console.log('remove', name);
    io.to(socket.room).emit('remove', name);
  });

  socket.on('depth', function(name, dep) {
    console.log('depth', name, dep)
    io.to(socket.room).emit('depth', name, dep);
  });

  socket.on('disconnect', function() {
    console.log('user disconnect ' + socket.username);
  });

});

/*
  1. Send commands back to user
  2. Keep a copy of all layer data.
  3. Keep data on disk.
     https://github.com/louischatriot/nedb
  4. Send all layer data to user upon connection.
*/
