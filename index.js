// ╔═╗┬ ┬┌─┐┬─┐┌─┐  ┬┌─┐
// ╚═╗├─┤├─┤├┬┘├┤   │└─┐
// ╚═╝┴ ┴┴ ┴┴└─└─┘o└┘└─┘

var editorSocket = new BCSocket(null, {
  reconnect: true
});
var shareJsConnection = new window.sharejs.Connection(editorSocket);

function addNewEditor(room, layer, id) {
  var ed = {};

  // add new textarea to the editor
  var column = document.getElementById("right_column");
  var textarea = document.createElement("textarea");
  textarea.id = id;
  column.appendChild(textarea);

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
  // our own flag to know whether this editor's code is runnable
  ed.clean = true;

  // attach ShareJS to CodeMirror
  ed.doc = shareJsConnection.get(room, layer);
  ed.doc.subscribe();
  ed.doc.whenReady(function () {
    if (!ed.doc.type) ed.doc.create('text');
    if (ed.doc.type && ed.doc.type.name === 'text') {
      ed.doc.attachCodeMirror(ed.cm);
    }
  });

  return ed;
}


// ╔╦╗┌─┐┌┬┐┌─┐  ┌─┐┬ ┬┌─┐┌┐┌┌┐┌┌─┐┬  
// ║║║├┤  │ ├─┤  │  ├─┤├─┤││││││├┤ │  
// ╩ ╩└─┘ ┴ ┴ ┴  └─┘┴ ┴┴ ┴┘└┘┘└┘└─┘┴─┘

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
      default:
        console.log('unknown message', msg.data);
    }
  }
}


//  ╔═╗╔═╕  ┬┌─┐
//  ╠═╝╚═╗  │└─┐
//  ╩  ╘═╝o└┘└─┘

function setup() {
  createCanvas(540, 540);
  background(0);
  loadImage("/public/joukkue.png", function(i) {
    image(i, width/2-i.width/2, height/2-i.height/2)
  });
}

function draw() {
    for (var i=0; i < editors.length; i++) {
        if (editors[i].clean && editors[i].code) {
            try {
                editors[i].code();
            } catch(e) {
                editors[i].clean = false;
                editors[i].cm.getWrapperElement().classList.add("error");
            } 
        }
    }
}


//   ╦┌─┐┬ ┬┬┌─┬┌─┬ ┬┌─┐
//   ║│ ││ │├┴┐├┴┐│ │├┤
//  ╚╝└─┘└─┘┴ ┴┴ ┴└─┘└─┘

var editors = [];
for(var i=0; i<20; i++) {
    editors.push(addNewEditor('room1', 'code'+i, i));
}

// handler for alt-enter
CodeMirror.commands.joukkueEval = function(cm) {
    var code = cm.doc.getValue();
    var which = int(cm.joukkue_index);
    
    var editor = editors[which];
    try {
        eval('f = function(d) { ' + code + ' }');
        editor.code = f;
        editor.clean = true;
        editor.cm.getWrapperElement().classList.remove("error");
    } catch(e) {
        editor.clean = false;
        editor.cm.getWrapperElement().classList.add("error");
    }
}

