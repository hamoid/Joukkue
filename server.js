var app = require('express')();

app.get('/', function(req, res) {
    res.sendFile(__dirname + '/index.html');
});

app.get('/*.(js|css)', function(req, res) {
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
        + 'Use cc.join("roomName") to change rooms.');
    // to room
		socket.to(socket.room).emit('say', 'SERVER',
                username + ' is here');

    console.log('user identifies as ' + username);
  });


	socket.on('join', function(newroom){
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

  socket.on('vars', function(data) {
    console.log('setup', data.name, data.obj);
  });

  socket.on('draw', function(data) {
    console.log('draw', data.name, data.f);
  });

  socket.on('say', function(msg) {
    socket.broadcast.to(socket.room).emit('say', socket.username, msg);
  });

  socket.on('disconnect', function() {
    console.log('user disconnect ' + socket.username);

    //io.emit('some event', { for: 'everyone' });
    //socket.emit('sender')
    //socket.broadcast.emit('everyone but sender');
    //socket.to('room').emit('ppl in room');
  });

});

/*
  The server must keep a copy of all layers ON DISK.

  When someone connects, it will send all layers to that person.
*/
