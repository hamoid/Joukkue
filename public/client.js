var Joukkue = function() {
  this.socket = io();
  this.layers = {};
  this.layersSorted = [];
  this.currentLayer = undefined;
  this.animPlaying = true;
  this.reservedVSpace = 0;

  this.msg = {
    layerCrashed:   'Layer %s crashed with %s',
    play:           'play animation',
    pause:          'pause animation'
  };

  var _this = this;

  // Socket events

  this.socket.on('connect', function() {
    _this.socket.emit('addUser', _this.randomName());
  });

  this.socket.on('say', function(username, msg){
    _this.addToChat(username + ': ' + msg);
  });

  this.socket.on('vars', function(name, html) {
    var id = '#' + name + '_vars';

    $(id).html(html);

    _this.layers[name] = _this.layers[name] || { name: name };

    var txt = $(id).text();
    eval("var obj = " + (txt || "{}"));
    _this.layers[name].vars = obj;
  });

  this.socket.on('draw', function(name, html) {
    var id = '#' + name + '_draw';

    $(id).html(html);

    _this.layers[name] = _this.layers[name] || { name: name };

    var txt = $(id).text();
    eval("var f = function(d) { " + txt + " }");
    _this.layers[name].draw = f;
    _this.buildLayersSorted();
  });

  this.socket.on('remove', function(name) {
    delete _this.layers[name];
    _this.buildLayersSorted();
    $('#' + name + '_draw').unbind();
    $('#' + name + '_vars').unbind();
    $('#' + name + '_depth').unbind();
    $('#' + name + '_draw').parent().remove();
  });

  this.socket.on('depth', function(name, dep) {
    dep = parseFloat(dep) || 666;
    _this.layers[name].depth = dep;
    $('#' + name + '_depth').text(dep);
    _this.buildLayersSorted();
  });


  this.socket.on('allLayers', function(lyr) {
    $('#grid tr.editable').remove();

    for(var l in lyr) {
      _this.createNewLayer(lyr[l].name, lyr[l].vars, lyr[l].draw, lyr[l].depth);

      var drawTxt = $('#' + lyr[l].name + '_draw').text();
      var varsTxt = $('#' + lyr[l].name + '_vars').text();

      // make real function/object out of strings
      eval("lyr[l].draw = function(d) { " + drawTxt + " }");
      eval("lyr[l].vars = " + (varsTxt || "{}"));
    };

    _this.layers = lyr;
    _this.buildLayersSorted();
  });
};


// String

Joukkue.prototype.fmt = function(msg, etc) {
  var i = 1;
  var args = arguments;
  return msg.replace(/%((%)|s)/g, function (m) { return m[2] || args[i++] })
};

Joukkue.prototype.genID = function() {
  return 'Lxxxxxxxx'.replace(/[xy]/g, function(c) {
    var r = Math.random()*16|0, v = c == 'x' ? r : (r&0x3|0x8);
    return v.toString(16);
  });
};

Joukkue.prototype.randomName = function() {
  var g1 = ['a', 'e', 'i', 'o', 'u', 'y'];
  var g2 = ['b', 'br', 'bl', 'c', 'cr', 'cl',
            'd', 'dr', 'f', 'fr', 'g', 'gl',
            'j', 'k', 'kr', 'l', 'm', 'n',
            'p', 'pr', 'pl', 's', 't', 'tr', 'v'];
  var g3 = ['s', 'l', 'n', 'm'];

  var r = function(a) {
    return a[Math.floor(Math.random() * a.length)];
  }
  var name;
  var rnd = Math.random();
  if(rnd < 0.25) {
    name = r(g1) + r(g2) + r(g1) + r(g3);
  } else if(rnd < 0.5) {
    name = r(g1) + r(g2) + r(g1) + r(g2) + r(g1);
  } else if(rnd < 0.5) {
    name = r(g2) + r(g1) + r(g2) + r(g1);
  } else {
    name = r(g2) + r(g1) + r(g2) + r(g1) + r(g3);
  }
  return name;
}


// DOM

Joukkue.prototype.addToChat = function(msg) {
  $('#row_chatView').append(msg + '<br/>');
  $('#row_chatView').scrollTop($('#row_chatView')[0].scrollHeight);
};

Joukkue.prototype.createNewLayer = function(name, varsHTML, drawHTML, depth) {
  var html = '<tr class="editable">'
  + this.fmt('<td id="%s_vars" class="c2" contentEditable="true">%s</td>', name, varsHTML || '')
  + this.fmt('<td id="%s_draw" class="c3" contentEditable="true">%s</td>', name, drawHTML || '')
  + this.fmt('<td id="%s_depth" class="c4" contentEditable="true">%s</td>', name, depth || '')
  + '</tr>';

  $('#grid').append(html);

  $('#' + name + '_vars').focus(this.onFocusEditable).blur(this.onBlurEditable);
  $('#' + name + '_draw').focus(this.onFocusEditable).blur(this.onBlurEditable);
  $('#' + name + '_depth').focus(this.onFocusEditable).blur(this.onBlurEditable);
  //this.makeLayersFocusable();
  $('#' + name + '_draw').focus();
};

Joukkue.prototype.buildLayersSorted = function() {
  var tmp = [];
  for(var l in this.layers) {
    tmp.push({
      name: this.layers[l].name,
      depth: this.layers[l].depth
    });
  };
  tmp.sort(function(a,b) { return a.depth - b.depth});

  this.layersSorted = [];
  for (var i=0; i<tmp.length; i++) {
    this.layersSorted.push(tmp[i].name);
  }
};

Joukkue.prototype.onBlurEditable = function(e) {
  $('#thead').remove();
  $(e.currentTarget).parent('tr').removeClass('editing');
};
Joukkue.prototype.onFocusEditable = function(e) {
  var t = $(e.currentTarget);
  t.parent('tr').addClass('editing');

  if(t.closest($('#grid')).length > 0) {
    t.parent('tr').before('<tr id="thead"><th>vars</th><th>draw</th><th>order</th></tr>');
  }
};


Joukkue.prototype.onWindowResize = function() {
  $('#row_grid').height($(window).height() - this.reservedVSpace);
}


// Commands (DEPRECATED)

// add editable room: text + enter
Joukkue.prototype.joinRoom = function(roomName) {
  this.socket.emit('joinRoom', roomName);
  return " . ";
};

var cc = new Joukkue();

// p5.js

function setup() {
  createCanvas(540, 540);
  background(0);
  var img = loadImage("/joukkue.png", function(i) {
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
      cc.addToChat(cc.fmt(cc.msg.layerCrashed, n, e));
      // if crash, remove from layersSorted to avoid rendering
      cc.layersSorted.splice(cc.layersSorted.indexOf(n), 1);
    }
  });
}

// jQuery

$(function() {

  $(window).resize(function() {
    cc.onWindowResize();
  });

  $('#cmd_play_pause').click(function() {
    cc.animPlaying = !cc.animPlaying;
    if(cc.animPlaying) {
      loop();
      $('#cmd_play_pause').val(cc.msg.pause);
    } else {
      noLoop();
      $('#cmd_play_pause').val(cc.msg.play);
    }
  });

  $('#cmd_new_layer').click(function() {
    var nextDepth = 0;
    for(var l in cc.layers) {
      if(cc.layers[l].depth > nextDepth) {
        nextDepth = Math.floor(cc.layers[l].depth);
      }
    };
    nextDepth += 2;
    cc.createNewLayer(cc.genID(), "", "", nextDepth);
  });

  $('#grid').keydown(function(e) {
    var idParts = e.target.id.split('_');
    var layerName = idParts[0];
    var varType = idParts[1];
    var contentHTML = $(e.target).html();
    var k = e.keyCode || e.charCode;

    if(e.ctrlKey && (k == 10 || k == 13)) {
      // CTRL + ENTER
      cc.socket.emit(varType, layerName, contentHTML);
    } else if( e.ctrlKey && (k == 8 || k == 46 )) {
      // CTRL + DEL
      cc.socket.emit('remove', layerName);
      return false;
    }
  });

  $('#row_chatBox').keydown(function(e) {
    var k = e.keyCode || e.charCode;
    if(k == 10 || k == 13) {
      cc.socket.emit('say', $('#row_chatBox').text());
      $('#row_chatBox').text('');
      e.preventDefault();
    }
  });

  $('#row_chatBox').focus(cc.onFocusEditable).blur(cc.onBlurEditable);

  $('body').keydown(function(e) {
    var k = e.keyCode || e.charCode;
    if(k == 27) {
      cc.onBlurEditable();
    }
  });

  cc.reservedVSpace = $('#row_menu').outerHeight(true) +
    $('#row_chatView').outerHeight(true) +
    $('#row_chatBox').outerHeight(true) + 8;

  cc.onWindowResize();
});
