// ╔═╗┬ ┬┌─┐┬─┐┌─┐  ┬┌─┐
// ╚═╗├─┤├─┤├┬┘├┤   │└─┐
// ╚═╝┴ ┴┴ ┴┴└─└─┘o└┘└─┘

var editorSocket = new BCSocket(null, {
  reconnect: true
});
var shareJsConnection = new window.sharejs.Connection(editorSocket);

/*
  Returns an editor object containing:
  - elem : the attached textarea
  - cm   : the associated CodeMirror object
  - doc  : the associated ShareJS object
*/

function getNewEditor(room, type, id) {
  var ed = {};

  // attach CodeMirror to the new textarea
  ed.elem = document.getElementById(id);

  ed.cm = CodeMirror.fromTextArea(ed.elem, {
    //lineNumbers: true,
    matchBrackets: true,
    autoCloseBrackets: true,
    styleActiveLine: true,
    extraKeys: {
      'Ctrl-Q': 'toggleComment',
      'Ctrl-Space': 'autocomplete',
      'Alt-Enter': 'joukkueEval'
    },
    tabSize: 2,
    theme: 'zenburn',
    mode: { name: 'javascript', json: false, globalVars: true }
  });
  // augment cm object with our index to find it later
  ed.cm.joukkue_index = id;

  // attach ShareJS to CodeMirror
  ed.doc = shareJsConnection.get(room, type + id);
  ed.doc.subscribe();
  ed.doc.whenReady(function () {
    if (!ed.doc.type) ed.doc.create('text');
    if (ed.doc.type && ed.doc.type.name === 'text') {
      ed.doc.attachCodeMirror(ed.cm);
    }
  });

  return ed;
}

function runLayer(name) {
  console.log('run', name);
  var layer = J.layerModel.layers[name];
  // TODO: figure out whether it's CODE or VARS that got published
  // (so far we have here only CODE).
  var editor = layer.editors[J.layerModel.CODE + name];
  var code = editor.cm.doc.getValue();
  try {
    eval('var f = function(d) { ' + code + ' }');
    layer.drawFunc = f;
    layer.crashed = false;
    editor.cm.getWrapperElement().classList.remove("error");
  } catch(e) {
    layer.crashed = true;
    editor.cm.getWrapperElement().classList.add("error");
  }
}

// ╔╦╗┌─┐┌┬┐┌─┐  ┌─┐┬ ┬┌─┐┌┐┌┌┐┌┌─┐┬
// ║║║├┤  │ ├─┤  │  ├─┤├─┤││││││├┤ │
// ╩ ╩└─┘ ┴ ┴ ┴  └─┘┴ ┴┴ ┴┘└┘┘└┘└─┘┴─┘

// Used to exchange the information that is not doing the text area
// synchronization.
// Messages coming from the server / other users.
var metaSocket = new BCSocket('/meta', {
  reconnect: true
});
metaSocket.onopen = function() {
}
metaSocket.onmessage = function(msg) {
  if(msg.data && msg.data.op && msg.data.arg) {
    switch(msg.data.op) {
      case 'say':
        console.log('server says', msg.data.arg);
        break;

      case 'run':
        runLayer(msg.data.arg);
        break;

      default:
        console.log('unknown message', msg.data);
    }
  }
}

//  ╦  ┌─┐┬ ┬┌─┐┬─┐╔╦╗┌─┐┌┬┐┌─┐┬
//  ║  ├─┤└┬┘├┤ ├┬┘║║║│ │ ││├┤ │
//  ╩═╝┴ ┴ ┴ └─┘┴└─╩ ╩└─┘─┴┘└─┘┴─┘

function LayerModel() {
  this.layers = {};
  this.layersSorted = [];
  this.VARS = 'vars';
  this.CODE = 'code';

  this.Layer = function(name) {
    this.name = name;
    this.enabled = true;
    this.crashed = false;
    this.editors = {};
    this.varsObj = {};
    this.drawFunc = function() {};
  }
}

LayerModel.prototype.createLayer = function(name) {
  var l = new this.Layer(name);

  // HTML: add new textarea to the editor
  var column = document.getElementById("right_column");
  var textarea = document.createElement("textarea");
  textarea.id = name;
  column.appendChild(textarea);

  // var varsEditor = getNewEditor('room', this.VARS, name);
  var codeEditor = getNewEditor('room', this.CODE, name);

  // l.editors[this.VARS] = varsEditor;
  l.editors[this.CODE + name] = codeEditor;

  this.layers[name] = l;
  this.layersSorted.push(l);
};

LayerModel.prototype.draw = function() {
  var layer;

  for (var i=0; i < this.layersSorted.length; i++) {
    push(); // p5
    layer = this.layersSorted[i];
    if (!layer.crashed && layer.drawFunc) {
      try {
        layer.drawFunc();
      } catch(e) {
        layer.crashed = true;
        layer.editors[this.CODE + layer.name].cm.getWrapperElement().classList.add("error");
      }
    }
    pop(); // p5
  }
};

LayerModel.prototype.publish = function(name) {
  runLayer(name);

  // send to others if not crashed
  if(!this.layers[name].crashed) {
    metaSocket.send({ op: 'run', arg: name });
  }
}


//   ╦┌─┐┬ ┬┬┌─┬┌─┬ ┬┌─┐
//   ║│ ││ │├┴┐├┴┐│ │├┤
//  ╚╝└─┘└─┘┴ ┴┴ ┴└─┘└─┘

function Joukkue() {
  var STARTING_LAYERS = 20;

  this.layerModel = new LayerModel();
  for(var i=0; i < STARTING_LAYERS; i++) {
    this.layerModel.createLayer("l_" + i);
  }
}

Joukkue.prototype.clearCanvas = function() {
  // p5
  background(0);
  loadImage("/public/joukkue.png", function(i) {
    image(i, width/2-i.width/2, height/2-i.height/2)
  });
};

Joukkue.prototype.draw = function() {
  this.layerModel.draw();
};

// ====
// CodeMirror handler for alt-enter
CodeMirror.commands.joukkueEval = function(cm) {
  var id = cm.joukkue_index;
  J.layerModel.publish(id);
}

// Start the engines. Vroom!
var J = new Joukkue();

//  ╔═╗╔═╕  ┬┌─┐
//  ╠═╝╚═╗  │└─┐
//  ╩  ╘═╝o└┘└─┘

function setup() {
  createCanvas(540, 540);
  J.clearCanvas();
}

function draw() {
  J.draw();
}
