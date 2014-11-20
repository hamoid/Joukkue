var Joukkue = function() {
  this.socket = io();
  this.layers = {};
  this.layersSorted = [];
  this.currentLayer = undefined;
  this.lastEditAreaId = undefined;
  this.lastEditSelection = { start:0, end:0 };
  this.animPlaying = true;
  this.reservedVSpace = 0;

  this.msg = {
    layerCrashed:   'Layer %s crashed with %s',
    play:           'play animation',
    pause:          'pause animation',
    roomHowto:      'use: .room roomName',
    help:           'Available commands:<br/>'
    + '_.rooms _ _ _ _ List available rooms<br/>'
    + '_.room roomName Go to new room<br/>'
    + '_.name newName_ Change nickname<br/>'
    + '_.who / where _ Show room name and participants<br/>'
    + '_.new / .delete Create / delete layer<br/>'
    + '_.on  / .off _ _Enable / disable layer<br/>'
    + '_.up  / .down _ Increase / decrease layer z-depth<br/>'
    + '_.top / .bottom Put layer on top / bottom<br/>'
    + '_.help _ _ _ _ _Show this help<br/>'
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
    $('#cmd_help').focus();
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
  if(depth < 0) {
    for(var l in cc.layers) {
      if(cc.layers[l].depth >= depth) {
        depth = Math.floor(cc.layers[l].depth) + 2;
      }
    };
  }
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

  // if focused in a #grid cell
  if(t.closest($('#grid')).length > 0) {
    cc.lastEditAreaId = t;
    t.parent('tr').before('<tr id="thead"><th>vars</th><th>draw</th><th>order</th></tr>');
  }
};

Joukkue.prototype.onWindowResize = function() {
  $('#row_grid').height($(window).height() - this.reservedVSpace);
}

Joukkue.prototype.onPressEnter = function() {
  var txt = $('#row_chatBox').text();
  var part;
  console.log(txt.charAt(0), txt.length);
  if(txt.charAt(0) == '.' && txt.length > 1) {
    part = txt.split(' ');
    switch(part[0].substr(1)) {
      case 'bottom':
        break;
      case 'delete':
        break;
      case 'down':
        break;
      case 'help':
        this.addToChat(this.msg.help.replace(/_/g, '&nbsp;'));
        break;
      case 'name':
        break;
      case 'new':
        this.createNewLayer(cc.genID(), "", "", -1);
        break;
      case 'off':
        break;
      case 'on':
        break;
      case 'room':
        if(part[1].match(/\w+/)) {
          this.socket.emit('joinRoom', part[1]);
        } else {
          this.addToChat(this.msg.roomHowto);
        }
        break;
      case 'rooms':
        break;
      case 'top':
        break;
      case 'up':
        break;
      case 'where':
      case 'who':
        this.socket.emit('requestRoomInfo');
        break;
    }
  } else {
    cc.socket.emit('say', txt);
  }
}


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
    cc.createNewLayer(cc.genID(), "", "", -1);
  });

  $('#grid').keydown(function(e) {
    var idParts
    , layerName
    , varType
    , contentHTML
    , k = e.keyCode || e.charCode;

    if(k == 27) {
        $('#row_chatBox').focus();
    } else if(e.ctrlKey) {
      if(k == 10 || k == 13) {
        // CTRL + ENTER
        idParts = e.target.id.split('_');
        layerName = idParts[0];
        varType = idParts[1];
        contentHTML = $(e.target).html();
        cc.socket.emit(varType, layerName, contentHTML);
      } else if(k == 8 || k == 46 ) {
        // CTRL + DEL
        idParts = e.target.id.split('_');
        layerName = idParts[0];
        cc.socket.emit('remove', layerName);
        return false;
      }
    }
  });

  $('#row_chatBox').keydown(function(e) {
    var k = e.keyCode || e.charCode;
    if(k == 10 || k == 13) {
      cc.onPressEnter();
      $('#row_chatBox').text('');
      e.preventDefault();
    } else if(k == 27) {
      cc.lastEditAreaId.focus();
    }
  });

  $('#row_chatBox').focus(cc.onFocusEditable).blur(cc.onBlurEditable);

  cc.reservedVSpace = $('#row_menu').outerHeight(true) +
    $('#row_chatView').outerHeight(true) +
    $('#row_chatBox').outerHeight(true) + 8;

  cc.onWindowResize();
});
