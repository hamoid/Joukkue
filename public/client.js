var CreativeCodeChat = function() {
  this.socket = io();
  this.layersSorted = [];
  this.layers = {};
  this.currentLayer = undefined;
  this.msg = {
    undefinedLayer: 'Call cc.choose("someLayer"); first',
    layerNotFound:  'Layer %s not found, but I will keep my eyes open.',
    layerCrashed:   'Layer %s crashed',
    currentLayerIs: '%s is now the current layer',
    drawHowto:      'use: cc.draw(function(d) { line(d.x, d.y, 0, 0); })',
    depthHowto:     'use: cc.depth("layerName", layerDepth)',
    varsHowto:      'use: cc.vars({ x:10, y:10 })',
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
    + '  cc.joinRoom("roomName") // go play to a different room,
    welcome:        'Welcome to CreativeCodeChat v0.1 - https://github.com/hamoid/creativecodechat',
    prompt:         'How should we call you today?',
    promptB:        'How should we call you today? (letters / numbers only)',
  };

  var _this = this;

  // Socket events

  this.socket.on('connect', function() {
    var name = null;
    var question = _this.msg.prompt;
    while(name == null || !name.match(/\w+/)) {
      name = prompt(question)
      question = _this.msg.promptB;
    }
    _this.socket.emit('addUser', name);
  });

  this.socket.on('say', function(username, msg){
    console.log(username + ": " + msg);
  });

  this.socket.on('vars', function(name, obj) {
    console.log(name + ".vars = " + JSON.stringify(obj));
    if(_this.layers[name] == undefined) {
      _this.layers[name] = {};
      _this.layers[name].name = name;
    }
    if(_this.layers[name].vars == undefined) {
      _this.layers[name].vars = {};
    }
    for(var k in obj) {
      _this.layers[name].vars[k] = obj[k];
    }
  });

  this.socket.on('draw', function(name, func) {
    console.log(name + '.draw = ' + func);
    if(_this.layers[name] == undefined) {
      _this.layers[name] = {};
      _this.layers[name].name = name;
    }
    if(_this.layers[name].draw == undefined) {
      _this.layersSorted.push(_this.layers[name]);
    }
    eval("var f = " + func);
    _this.layers[name].draw = f;
  });

  this.socket.on('remove', function(name) {
    console.log('remove ', name);
    for(var i=_this.layersSorted.length-1; i>=0; i--) {
      if(_this.layersSorted[i] == _this.layers[name]) {
        _this.layersSorted.splice(i, 1);
      }
    }
    delete _this.layers[name];
  });

  this.socket.on('depth', function(name, dep) {
    if(dep < 0) {
      dep = 0;
    }
    if(dep > _this.layersSorted.length-1) {
      dep = _this.layersSorted.length-1;
    }
    console.log(name + '.depth = ', dep);
    var found = undefined;
    for(var i=_this.layersSorted.length-1; i>=0; i--) {
      if(_this.layersSorted[i] == _this.layers[name]) {
        found = _this.layersSorted.splice(i, 1)[0];
        break;
      }
    }
    if(found != undefined) {
      _this.layersSorted.splice(Math.floor(dep), 0, found);
    }
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
  for(var l in this.layersSorted) {
    if(this.layersSorted[l].name) {
      console.log(this.layersSorted[l].name);
    }
  }
};
CreativeCodeChat.prototype.print = function() {
  if(this.currentLayer == undefined) {
    return this.err.undefinedLayer;
  }
  return "cc.vars(" + JSON.stringify(this.layers[this.currentLayer].vars) + ");\n\n"
  + "cc.draw(" + this.layers[this.currentLayer].draw.toString() + ");";
};
CreativeCodeChat.prototype.vars = function(obj) {
  if(this.currentLayer == undefined) {
    return this.err.undefinedLayer;
  }
  if(arguments.length != 1 || typeof obj !== "object") {
    return this.msg.varsHowto;
  }
  this.socket.emit('vars', this.currentLayer, obj);
  return " . ";
};

CreativeCodeChat.prototype.draw = function(func) {
  if(this.currentLayer == undefined) {
    return this.err.undefinedLayer;
  }
  if(arguments.length != 1 || typeof func !== "function") {
    return this.err.drawHowto;
  } else {
    this.socket.emit('draw', this.currentLayer, func.toString());
    return " . ";
  }
}

CreativeCodeChat.prototype.choose = function(name) {
  this.currentLayer = name;
  return this.fmt(this.msg.currentLayerIs, name);
};

CreativeCodeChat.prototype.remove = function() {
  if(this.currentLayer == undefined) {
    return this.err.undefinedLayer;
  } else if(this.layers[this.currentLayer] == undefined) {
    return this.fmt(this.msg.layerNotFound, this.currentLayer);
  } else {
    this.socket.emit('remove', this.currentLayer);
    return " . ";
  }
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
  for(var i in cc.layersSorted) {
    try {
      push();
      cc.layersSorted[i].draw(cc.layersSorted[i].vars);
      pop();
    } catch(e) {
      println(this.fmt(this.msg.layerCrashed, cc.layersSorted[i].name));
      cc.layersSorted.splice(i, 1);
    }
  }
}

// welcome message

console.log(cc.msg.welcome);
