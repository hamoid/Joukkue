var socket = io();
var layers = {};
var layersSorted = [];

function createLayer(name) {
  layers[name] = {};
  layers[name].name = name;
  layers[name].vars = {};
  layersSorted.push(layers[name]);
}

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
    return JSON.stringify(layers[name].vars) + "\n\n" + layers[name].draw.toString();
  },

  vars: function(name, obj) {
    if(arguments.length != 2 || typeof name !== "string" || typeof obj !== "object") {
      return 'use: cc.vars("layerName", { x:10, y:10 })';
    }
    if(layers[name] == undefined) {
      createLayer(name);
    }
    for(var k in obj) {
      layers[name].vars[k] = obj[k];
    }
    socket.emit('vars', { name:name, obj:obj });
    return "vars." + name + " = " + JSON.stringify(obj);
  },

  draw: function(name, f) {
    if(arguments.length != 2 || typeof name !== "string" || typeof f !== "function") {
      return 'use: cc.draw("layerName", function(d) { line(d.x, d.y, 0, 0); })';
    }
    if(layers[name] == undefined) {
      createLayer(name);
    }
    layers[name].draw = f;
    // emit f
    return "draw." + name + f.toString();
  },

  remove: function(name) {
    if(arguments.length != 1 || typeof name !== "string") {
      return 'use: cc.remove("layerName")';
    }
    for(var i=layersSorted.length-1; i>=0; i--) {
      if(layersSorted[i] == layers[name]) {
        layersSorted.splice(i, 1);
      }
    }
    delete layers[name];
  },

  depth: function(name, dep) {
    if(arguments.length != 2 || typeof name !== "string" || typeof dep !== "number") {
      return 'use: cc.depth("layerName", layerDepth)';
    }
    if(dep < 0) {
      dep = 0;
    }
    if(dep > layersSorted.length-1) {
      dep = layersSorted.length-1;
    }
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
  },

  say: function(msg) {
    socket.emit('say', msg);
    return " . ";
  },

  join: function(roomName) {
    socket.emit('join', roomName);
    return " . ";
  },

  help: function() {
    return "Here goes\nthe help";
  }
}

// socket.emit('switchRoom', room);

// splice(index, howMany, elementToAdd)

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
