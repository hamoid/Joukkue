var Joukkue = function() {
  this.socket = io();
  this.layers = {};
  this.layersSorted = [];
  this.currentLayer = undefined;
  this.lastEditAreaId = undefined;
  this.lastEditSelection = { start:0, end:0 };
  this.animPlaying = true;
  this.reservedVSpace = 0;

  var _this = this;

  // Socket events

  this.socket.on('connect', function() {
    _this.socket.emit(constants.CMD_ADD_USER, string.genRandomName());
  });

  this.socket.on(constants.CMD_SAY, function(username, msg){
    _this.addToChat(username + ': ' + msg);
  });

  this.socket.on(constants.CMD_SET_VARS, function(name, html) {
    var id = '#' + name + '_vars';

    $(id).html(html);

    _this.layers[name] = _this.layers[name] || { name: name };

    var txt = $(id).text();
    eval("var obj = " + (txt || "{}"));
    _this.layers[name].vars = obj;
  });

  this.socket.on(constants.CMD_SET_DRAW, function(name, html) {
    var id = '#' + name + '_draw';

    $(id).html(html);

    _this.layers[name] = _this.layers[name] || { name: name };

    var txt = $(id).text();
    eval("var f = function(d) { " + txt + " }");
    _this.layers[name].draw = f;
    _this.buildLayersSorted();
  });

  this.socket.on(constants.CMD_REMOVE, function(name) {
    // TODO: only if focused on disappearing tr
    $('#but_help').focus();
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


  this.socket.on(constants.CMD_SET_LAYERS, function(lyr) {
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


// DOM

Joukkue.prototype.saveSelection = function() {
  if (window.getSelection) {
    sel = window.getSelection();
    if (sel.getRangeAt && sel.rangeCount) {
      return sel.getRangeAt(0);
    }
  } else if (document.selection && document.selection.createRange) {
    return document.selection.createRange();
  }
  return null;
}

Joukkue.prototype.restoreSelection = function(range) {
  if (range) {
    if (window.getSelection) {
      sel = window.getSelection();
      sel.removeAllRanges();
      sel.addRange(range);
    } else if (document.selection && range.select) {
      range.select();
    }
  }
}

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
  + string.fmt('<td id="%s_vars" class="c2" contentEditable="true">%s</td>', name, varsHTML || '')
  + string.fmt('<td id="%s_draw" class="c3" contentEditable="true">%s</td>', name, drawHTML || '')
  + string.fmt('<td id="%s_depth" class="c4" contentEditable="true">%s</td>', name, depth || '')
  + '</tr>';

  $('#grid').append(html);

  $('#' + name + '_vars').focus(this.onFocusEditable).blur(this.onBlurEditable).mouseup(this.onMouseUp);
  $('#' + name + '_draw').focus(this.onFocusEditable).blur(this.onBlurEditable).mouseup(this.onMouseUp);
  $('#' + name + '_depth').focus(this.onFocusEditable).blur(this.onBlurEditable).mouseup(this.onMouseUp);
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
  var t = $(e.currentTarget);
  var isGridElement = t.closest($('#grid')).length > 0;
  t.parent('tr').removeClass('editing');
  if(isGridElement) {
    cc.lastEditAreaId.addClass('target');
  }
};
Joukkue.prototype.onFocusEditable = function(e) {
  var t = $(e.currentTarget);
  var isGridElement = t.closest($('#grid')).length > 0;
  t.parent('tr').addClass('editing');

  if(isGridElement) {
    cc.lastEditAreaId = t;
    $('#grid td.target').removeClass('target');

    // auto scroll up when clicking on last entry (if out of view)
    var offset = t.position().top + t.height() - $('#row_chatView').position().top + 12;
    if(offset > 0) {
      $('#row_grid').scrollTop(offset + $('#row_grid').scrollTop());
    }
  } else {
    // here we can tell the server NOT EDITING
  }
};
Joukkue.prototype.onMouseUp = function() {
  var r = window.getSelection().getRangeAt(0);
  r.collapse();
}

Joukkue.prototype.onWindowResize = function() {
  $('#row_grid').height($(window).height() - this.reservedVSpace);
}

Joukkue.prototype.onPressEnter = function() {
  var txt = $('#row_chatBox').text();
  var part;
  if(txt.charAt(0) == '.' && txt.length > 1) {
    part = txt.split(' ');
    switch(part[0].substr(1)) {
      case 'bottom':
        break;
      case 'delete':
        console.log('delete', cc.lastEditAreaId.attr('id'));
        break;
      case 'down':
        break;
      case 'help':
        this.addToChat(txt.help.replace(/_/g, '&nbsp;'));
        break;
      case 'name':
        break;
      case 'new':
        this.createNewLayer(string.genID(), "", "", -1);
        break;
      case 'off':
        break;
      case 'on':
        break;
      case 'room':
        if(part[1].match(/\w+/)) {
          this.socket.emit(constants.CMD_JOIN_ROOM, part[1]);
        } else {
          this.addToChat(txt.roomHowto);
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
        this.socket.emit(constants.CMD_REQ_ROOM_INFO);
        break;
    }
  } else {
    cc.socket.emit(constants.CMD_SAY, txt);
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
      cc.addToChat(string.fmt(txt.layerCrashed, n, e));
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

  $('#but_play_pause').click(function() {
    cc.animPlaying = !cc.animPlaying;
    if(cc.animPlaying) {
      loop();
      $('#but_play_pause').val(txt.label_pause);
    } else {
      noLoop();
      $('#but_play_pause').val(txt.label_play);
    }
  });

  $('#but_new_layer').click(function() {
    cc.createNewLayer(string.genID(), "", "", -1);
  });

  $('#grid').keydown(function(e) {
    var idParts
    , layerName
    , varType
    , contentHTML
    , k = e.keyCode || e.charCode;

    if(k == 27) {
        cc.lastEditSelection = cc.saveSelection();
        $('#row_chatBox').focus();
    } else if(e.ctrlKey) {
      if(k == 10 || k == 13) {
        // CTRL + ENTER
        idParts = e.target.id.split('_');
        layerName = idParts[0];
        varType = idParts[1];
        contentHTML = $(e.target).html();
        cc.socket.emit(constants.GET_LAYER_SET_CMD[varType],
                       layerName, contentHTML);
      } else if(k == 8 || k == 46 ) {
        // CTRL + DEL
        idParts = e.target.id.split('_');
        layerName = idParts[0];
        cc.socket.emit(constants.CMD_REMOVE, layerName);
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
      cc.restoreSelection(cc.lastEditSelection);
    }
  });

  $('#row_chatBox').focus(cc.onFocusEditable).blur(cc.onBlurEditable);

  cc.reservedVSpace = $('#row_menu').outerHeight(true) +
    $('#row_chatView').outerHeight(true) +
    $('#row_chatBox').outerHeight(true) + 8;

  cc.onWindowResize();
  cc.addToChat(txt.welcome);
  $('#but_new_layer').val(txt.label_new_layer);
  $('#but_help').val(txt.label_help);
  $('#but_play_pause').val(txt.label_pause);
});
