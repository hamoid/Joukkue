var socket = io();
var layers = {};
var layersSorted = [];

var cc = {

  listLayers: function() {
    for(var l in layers) {
      // add author, age
      console.log(l);
    }
  },

  print: function(name) {
    if(arguments.length != 1 || typeof name !== "string") {
      return 'use: cc.print("layerName")';
    }
    return "cc.vars(\"" + name + "\", " + JSON.stringify(layers[name].vars) + ");\n\n"
        + "cc.draw(\"" + name + "\", " + layers[name].draw.toString() + ");";
  },

  vars: function(name, obj) {
    if(arguments.length != 2 || typeof name !== "string" || typeof obj !== "object") {
      return 'use: cc.vars("layerName", { x:10, y:10 })';
    }
    socket.emit('vars', name, obj);
    return " . ";
  },

  draw: function(name, func) {
    if(arguments.length != 2 || typeof name !== "string" || typeof func !== "function") {
      return 'use: cc.draw("layerName", function(d) { line(d.x, d.y, 0, 0); })';
    } else {
      socket.emit('draw', name, func.toString());
      return " . ";
    }
  },

  remove: function(name) {
    if(arguments.length != 1 || typeof name !== "string") {
      return 'use: cc.remove("layerName")';
    } else {
      socket.emit('remove', name);
      return " . ";
    }
  },

  depth: function(name, dep) {
    if(arguments.length != 2 || typeof name !== "string" || typeof dep !== "number") {
      return 'use: cc.depth("layerName", layerDepth)';
    } else {
      socket.emit('depth', name, dep);
      return " . ";
    }
  },

  say: function(msg) {
    socket.emit('say', msg);
    return " . ";
  },

  joinRoom: function(roomName) {
    socket.emit('joinRoom', roomName);
    return " . ";
  },

  help: function() {
    return "Here goes\nthe help";
  }
}

socket.on('connect', function() {
  var name = "";
  while(!name.match(/\w+/)) {
    name = prompt("Player name? [A-Za-z0-9_]")
  }
  socket.emit('addUser', name);
});

socket.on('say', function(username, msg){
  console.log(username + ": " + msg);
});

socket.on('vars', function(name, obj) {
  console.log(name + ".vars = " + JSON.stringify(obj));
  if(layers[name] == undefined) {
    layers[name] = {};
    layers[name].name = name;
  }
  if(layers[name].vars == undefined) {
    layers[name].vars = {};
  }
  for(var k in obj) {
    layers[name].vars[k] = obj[k];
  }
});

socket.on('draw', function(name, func) {
  console.log(name + '.draw = ' + func);
  if(layers[name] == undefined) {
    layers[name] = {};
    layers[name].name = name;
  }
  if(layers[name].draw == undefined) {
    layersSorted.push(layers[name]);
  }
  eval("var f = " + func);
  layers[name].draw = f;
});

socket.on('remove', function(name) {
  console.log('remove ', name);
  for(var i=layersSorted.length-1; i>=0; i--) {
    if(layersSorted[i] == layers[name]) {
      layersSorted.splice(i, 1);
    }
  }
  delete layers[name];
});

socket.on('depth', function(name, dep) {
  if(dep < 0) {
    dep = 0;
  }
  if(dep > layersSorted.length-1) {
    dep = layersSorted.length-1;
  }
  console.log(name + '.depth = ', dep);
  var found = undefined;
  for(var i=layersSorted.length-1; i>=0; i--) {
    if(layersSorted[i] == layers[name]) {
      found = layersSorted.splice(i, 1)[0];
      break;
    }
  }
  if(found != undefined) {
    layersSorted.splice(Math.floor(dep), 0, found);
  }
});


// p5.js

function setup() {
  createCanvas(800, 400);
}
function draw() {
  for(var i in layersSorted) {
    try {
      push();
      layersSorted[i].draw(layersSorted[i].vars);
      pop();
    } catch(e) {
      // todo add author
      println("Layer " + layersSorted[i].name + " crashed");
      layersSorted.splice(i, 1);
    }
  }
}

// welcome player

console.log("Welcome to CodeChat v0.1\nBy Abe Pazos\n\nType cc.help() if you need it :)");
