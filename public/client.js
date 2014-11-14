// an graphical interface will make this much simpler.
// even if there's no autocomplete.
// choose=click, list&print not necessary (visible already)
// vars&draw=typing in box + ctrl+enter
// remove=ctrl+del
// have field for author, name, depth

// arrays get holes when you delete! not good.
// newest approach:
// currentLayer = "cir"
// layers = { bg: {}, cir: {}, bla: {}}  (unsorted) +
// layerOrder = ["bg", "cir", "bla"]
// both must be saved on server side

var CreativeCodeChat = function() {
  this.socket = io();

  this.layers = {};
  this.layersSorted = [];
  this.currentLayer = undefined;

  this.msg = {
    undefinedLayer: 'Call cc.choose("someLayer"); first',
    layerNotFound:  'Layer %s not found, but I will keep my eyes open.',
    layerCrashed:   'Layer %s crashed',
    currentLayerIs: '%s is now the current layer',
    drawHowto:      'use: cc.draw(function(d) { line(d.x, d.y, 0, 0); })',
    depthHowto:     'use: cc.depth("layerName", layerDepth)',
    varsHowto:      'use: cc.vars({ x:10, y:10 })',
    chooseHowto:    'use: cc.choose("layerName")',
    help:           'CreativeCodeChat uses p5.js and is based on layers.\n'
    + 'These are the available commands:\n'
    + '  cc.choose("layerName")  // select existing or new layer to work on\n'
    + '  cc.list()               // list existing layer names\n'
    + '  cc.print()              // print content of selected layer\n'
    + '  cc.vars({ x:0, y:0 })   // set properties of selected layer\n'
    + '  cc.draw(function(d) { line(d.x, d.y, 100, 100); }) // set draw function of selected layer\n'
    + '  cc.remove()             // get rid of selected layer\n'
    + '  cc.depth(3)             // set z depth of selected layer\n'
    + '  cc.say("hello coders!") // talk to other players\n'
    + '  cc.joinRoom("roomName") // go play to a different room',
    welcome:        'Welcome to CreativeCodeChat v0.1 - https://github.com/hamoid/creativecodechat',
    prompt:         'How should we call you today?',
    promptB:        'How should we call you today? (letters / numbers only)',
  };

  var _this = this;

  // Socket events

  this.socket.on('connect', function() {
    window.setTimeout(function() {
      var name = null;
      var question = _this.msg.prompt;
      while(name == null || !name.match(/\w+/)) {
        name = prompt(question)
        question = _this.msg.promptB;
      }
      _this.socket.emit('addUser', name);
    }, 2000);
  });

  this.socket.on('say', function(username, msg){
    console.log(username + ": " + msg);
  });

  this.socket.on('vars', function(name, obj) {
    console.log(name + ".vars = " + JSON.stringify(obj));
    _this.layers[name] = _this.layers[name] || { name: name };
    _this.layers[name].vars = _this.layers[name].vars || {};
    for(var k in obj) {
      _this.layers[name].vars[k] = obj[k];
    }
  });

  this.socket.on('draw', function(name, func, lyrSorted) {
    console.log(name + '.draw = ' + func);
    eval("var f = " + func);
    _this.layers[name] = _this.layers[name] || { name: name };
    _this.layers[name].draw = f;

    _this.layersSorted = lyrSorted;
  });

  this.socket.on('remove', function(name, lyrSorted) {
    console.log('remove ', name);
    _this.layersSorted = lyrSorted;
    delete _this.layers[name];
  });

  this.socket.on('depth', function(name, dep, lyrSorted) {
    console.log(name + '.depth = ', dep);
    _this.layersSorted = lyrSorted;
  });

  this.socket.on('allLayers', function(lyrSorted, lyr) {
    // make real functions out of strings
    Object.getOwnPropertyNames(lyr).forEach(function(l) {
      eval("var f = " + lyr[l].draw);
      lyr[l].draw = f;
    });
    _this.layers = lyr;
    _this.layersSorted = lyrSorted;
  });
};



// Helpers

CreativeCodeChat.prototype.fmt = function(msg, etc) {
  var i = 1;
  var args = arguments;
  return msg.replace(/%((%)|s)/g, function (m) { return m[2] || args[i++] })
}



// Commands

CreativeCodeChat.prototype.list = function() {
  console.log(this.layersSorted.join(", "));
  return " . ";
};
CreativeCodeChat.prototype.print = function() {
  if(this.currentLayer == undefined) {
    return this.msg.undefinedLayer;
  }
  return "cc.vars(" + JSON.stringify(this.layers[this.currentLayer].vars) + ");\n\n"
  + "cc.draw(" + this.layers[this.currentLayer].draw.toString() + ");";
};
CreativeCodeChat.prototype.vars = function(obj) {
  if(this.currentLayer == undefined) {
    return this.msg.undefinedLayer;
  }
  if(arguments.length != 1 || typeof obj !== "object") {
    return this.msg.varsHowto;
  }
  this.socket.emit('vars', this.currentLayer, obj);
  return " . ";
};

CreativeCodeChat.prototype.draw = function(func) {
  if(this.currentLayer == undefined) {
    return this.msg.undefinedLayer;
  }
  if(arguments.length != 1 || typeof func !== "function") {
    return this.msg.drawHowto;
  }
  this.socket.emit('draw', this.currentLayer, func.toString());
  return " . ";
}

CreativeCodeChat.prototype.choose = function(name) {
  if(arguments.length != 1 || typeof name !== "string") {
    return this.msg.chooseHowto;
  }
  this.currentLayer = name;
  return this.fmt(this.msg.currentLayerIs, name);
};

CreativeCodeChat.prototype.remove = function() {
  if(this.currentLayer == undefined) {
    return this.msg.undefinedLayer;
  }
  if(this.layers[this.currentLayer] == undefined) {
    return this.fmt(this.msg.layerNotFound, this.currentLayer);
  }
  this.socket.emit('remove', this.currentLayer);
  return " . ";
};

CreativeCodeChat.prototype.depth = function(dep) {
  if(arguments.length != 1 || typeof dep !== "number") {
    return this.msg.depthHowto;
  } else {
    this.socket.emit('depth', this.currentLayer, dep);
    return " . ";
  }
};

CreativeCodeChat.prototype.say = function(msg) {
  this.socket.emit('say', msg);
  return " . ";
};

CreativeCodeChat.prototype.joinRoom = function(roomName) {
  this.socket.emit('joinRoom', roomName);
  return " . ";
};

CreativeCodeChat.prototype.help = function() {
  return this.msg.help;
};

var cc = new CreativeCodeChat();



// p5.js

function setup() {
  createCanvas(800, 400);
  background(0);
  var img = loadImage("/creativeCodeChatLogo.png", function(i) {
    image(i, width/2-i.width/2, height/2-i.height/2)
  });
}
function draw() {
  cc.layersSorted.forEach(function(n) {
    try {
      push();
      cc.layers[n].draw(cc.layers[n].vars);
      pop();
    } catch(e) {
      console.log(cc.fmt(cc.msg.layerCrashed, n));
      // if crash, remove from layersSorted to avoid rendering
      cc.layersSorted.splice(cc.layersSorted.indexOf(n), 1);
    }
  });
}

// welcome message

console.log(cc.msg.welcome);
