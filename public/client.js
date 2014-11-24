//  ╦  ┌─┐┬ ┬┌─┐┬─┐╔╦╗┌─┐┌┬┐┌─┐┬
//  ║  ├─┤└┬┘├┤ ├┬┘║║║│ │ ││├┤ │
//  ╩═╝┴ ┴ ┴ └─┘┴└─╩ ╩└─┘─┴┘└─┘┴─┘

var LayerModel = function() {
  this.layers = {};
  this.layersSorted = [];

  var _this = this;
  this.Layer = function(name) {
    this.name = name;
    this.enabled = true;
    this.crashed = false;
    this.depth = _this.getNextDepth();
  }
}
LayerModel.prototype.createLayer = function() {
  var name = string.genID();
  var l = new this.Layer(name);
  this.layers[name] = l;
  return l;
}
LayerModel.prototype.setVars = function(name, txt) {
  this.layers[name] = this.layers[name] || new this.Layer(name);
  eval("var obj = " + (txt || "{}"));
  this.layers[name].vars = obj;
}
LayerModel.prototype.setDraw = function(name, txt) {
  this.layers[name] = this.layers[name] || new this.Layer(name);
  eval("var f = function(d) { " + txt + " }");
  this.layers[name].draw = f;
  this.layers[name].crashed = false;
  this.sortLayers();
}
LayerModel.prototype.draw = function(err_cb) {
  var _this = this;
  this.layersSorted.forEach(function(name) {
    push();
    try {
      _this.layers[name].draw(_this.layers[name].vars);
    } catch(err) {
      _this.setCrashed(name);
      err_cb(name, err);
    }
    pop();
  });
}
LayerModel.prototype.remove = function(name) {
  delete this.layers[name];
  this.sortLayers();
}
LayerModel.prototype.setDepth = function(name, dep) {
  this.layers[name].depth = dep;
  this.sortLayers();
}
LayerModel.prototype.setEnabled = function(name, enabled) {
  this.layers[name].enabled = enabled;
  this.sortLayers();
}
LayerModel.prototype.setLayers = function(lyr) {
  this.layers = lyr;
  this.sortLayers();
}
LayerModel.prototype.getNextDepth = function() {
  var layers = this.layers;
  var depths = Object.keys(layers).map(function(name) {
    return layers[name].depth;
  });
  return Math.max.apply(Math, depths) + 2;
}
LayerModel.prototype.setCrashed = function(name) {
  this.layers[name].crashed = true;
  this.sortLayers();
}
LayerModel.prototype.sortLayers = function() {
  var layers = this.layers;
  var activeLayerNames = Object.keys(layers).filter(function(name) {
    return layers[name].enabled && !layers[name].crashed;
  });
  var sortedDepths = activeLayerNames.map(function(name) {
    return { name: name, depth: layers[name].depth }
  });
  sortedDepths.sort(function(a, b) { return a.depth - b.depth});
  this.layersSorted = sortedDepths.map(function(o) { return o.name; })
};

//   ╦┌─┐┬ ┬┬┌─┬┌─┬ ┬┌─┐
//   ║│ ││ │├┴┐├┴┐│ │├┤
//  ╚╝└─┘└─┘┴ ┴┴ ┴└─┘└─┘

var Joukkue = function() {
  this.socket = io();
  this.lastEditAreaId = undefined;
  this.lastEditSelection = undefined;
  this.animPlaying = true;
  this.reservedVSpace = 0;
  this.layerModel = new LayerModel();

  var _this = this;

  // Listen to socket events

  this.socket.on('connect', function() {
    _this.socket.emit(constants.CMD_ADD_USER, string.genRandomName());
  });

  this.socket.on(constants.CMD_SAY, function(username, msg){
    _this.addTextToChat(username + ': ' + msg);
  });

  this.socket.on(constants.CMD_SET_VARS, function(name, html) {
    var cell = $('#' + name + '_vars');
    cell.html(html);
    _this.layerModel.setVars(name, cell.text());
  });

  this.socket.on(constants.CMD_SET_DRAW, function(name, html) {
    var cell = $('#' + name + '_draw');
    cell.html(html);
    _this.layerModel.setDraw(name, cell.text());
  });

  this.socket.on(constants.CMD_REMOVE, function(name) {
    // if focused on disappearing layer, focus somewhere else
    if(cc.lastEditAreaId.attr('id').indexOf(name) == 0) {
      $('#but_help').focus();
    }

    _this.layerModel.remove(name);
    $('#' + name + '_draw').unbind();
    $('#' + name + '_vars').unbind();
    $('#' + name + '_depth').unbind();
    $('#' + name + '_draw').parent().remove();
  });

  this.socket.on(constants.CMD_SET_DEPTH, function(name, dep) {
    dep = parseFloat(dep) || 666;
    _this.layerModel.setDepth(name, dep);
    $('#' + name + '_depth').text(dep);
  });

  this.socket.on(constants.CMD_SET_ENABLED, function(name, enabled) {
    _this.layerModel.setEnabled(name, enabled);
    var tr = $('#' + name + '_draw').parent();
    if(enabled) {
      tr.removeClass('disabled');
    } else {
      tr.addClass('disabled');
    }
  });


  this.socket.on(constants.CMD_SET_LAYERS, function(lyr) {
    $('#grid tr.editable').remove();

    for(var l in lyr) {
      _this.addLayerToDOM(lyr[l]);

      var drawTxt = $('#' + lyr[l].name + '_draw').text();
      var varsTxt = $('#' + lyr[l].name + '_vars').text();

      // make real function/object out of strings
      eval("lyr[l].draw = function(d) { " + drawTxt + " }");
      eval("lyr[l].vars = " + (varsTxt || "{}"));
    };

    _this.layerModel.setLayers(lyr);
  });
};


//  ╔╦╗╔═╗╔╦╗   ┬┬ ┬┌─┐┌─┐┬  ┬┌┐┌┌─┐
//   ║║║ ║║║║   ││ ││ ┬│ ┬│  │││││ ┬
//  ═╩╝╚═╝╩ ╩  └┘└─┘└─┘└─┘┴─┘┴┘└┘└─┘

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

Joukkue.prototype.addTextToChat = function(msg) {
  $('#row_chatView').append(msg + '<br/>');
  $('#row_chatView').scrollTop($('#row_chatView')[0].scrollHeight);
};

Joukkue.prototype.addCrashToChat = function(name, err) {
  this.addTextToChat(string.fmt(txt.layerCrashed, name, err));
};

Joukkue.prototype.addLayerToDOM = function(l) {
  $('#grid').append(
    string.fmt('<tr class="editable %s">', l.enabled ? '' : 'disabled')
    + string.fmt('<td id="%s_vars" class="c2" contentEditable="true">%s</td>', l.name, l.vars || '')
    + string.fmt('<td id="%s_draw" class="c3" contentEditable="true">%s</td>', l.name, l.draw || '')
    + string.fmt('<td id="%s_depth" class="c4" contentEditable="true">%s</td>', l.name, l.depth || '')
    + '</tr>'
  );

  $('#' + l.name + '_vars').focus(this.onFocusEditable).blur(this.onBlurEditable).mouseup(this.onMouseUpEditable);
  $('#' + l.name + '_draw').focus(this.onFocusEditable).blur(this.onBlurEditable).mouseup(this.onMouseUpEditable);
  $('#' + l.name + '_depth').focus(this.onFocusEditable).blur(this.onBlurEditable).mouseup(this.onMouseUpEditable);
  $('#' + l.name + '_draw').focus();
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

// A fix for the unexpected selection of text when
// click-on-last-cell auto scroll up
Joukkue.prototype.onMouseUpEditable = function() {
  var r = window.getSelection().getRangeAt(0);
  r.collapse();
}

Joukkue.prototype.onWindowResize = function() {
  $('#row_grid').height($(window).height() - this.reservedVSpace);
}

Joukkue.prototype.onPressEnter = function() {
  var cmd = $('#row_chatBox').text(),
      idParts,
      cmdParts;
  if(cmd.charAt(0) == '.' && cmd.length > 1) {
    cmdParts = cmd.split(' ');
    idParts = cc.lastEditAreaId.attr('id').split('_');
    switch(cmdParts[0].substr(1)) {

      case 'delete':
      case 'remove':
        cc.socket.emit(constants.CMD_REMOVE, idParts[0]);
        break;

      case 'help':
        this.addTextToChat(txt.help.replace(/_/g, '&nbsp;'));
        break;

      case 'name':
        if(cmdParts[1].match(/\w+/)) {
          this.socket.emit(constants.CMD_SET_NEW_NAME, cmdParts[1]);
        } else {
          this.addTextToChat(txt.nameHowto);
        }
        break;

      case 'new':
        this.addLayerToDOM(this.layerModel.createLayer());
        break;

      case 'off':
        this.socket.emit(constants.CMD_SET_ENABLED, idParts[0], false);
        break;

      case 'on':
        this.socket.emit(constants.CMD_SET_ENABLED, idParts[0], true);
        break;

      case 'room':
        if(cmdParts[1].match(/\w+/)) {
          this.socket.emit(constants.CMD_JOIN_ROOM, cmdParts[1]);
        } else {
          this.addTextToChat(txt.roomHowto);
        }
        break;

      case 'rooms':
        this.socket.emit(constants.CMD_LIST_ROOMS);
        break;

      case 'top':
        console.log('top', idParts[0]);
        break;

      case 'bottom':
        console.log('bottom', idParts[0]);
        break;

      case 'up':
        console.log('up', idParts[0]);
        break;

      case 'down':
        console.log('down', idParts[0]);
        break;

      case 'where':
      case 'who':
        this.socket.emit(constants.CMD_REQ_ROOM_INFO);
        break;
    }
  } else {
    cc.socket.emit(constants.CMD_SAY, cmd);
  }
}


//  ╔═╗╔═╕  ┬┌─┐
//  ╠═╝╚═╗  │└─┐
//  ╩  ╘═╝o└┘└─┘

function setup() {
  createCanvas(540, 540);
  background(0);
  var img = loadImage("/joukkue.png", function(i) {
    image(i, width/2-i.width/2, height/2-i.height/2)
  });
}

function draw() {
  cc.layerModel.draw(cc.addCrashToChat);
}


//  ╔╦╗╔═╗╔╦╗  ┌─┐┬  ┬┌─┐┌┐┌┬┐┌─┐   ┬   ┌┐ ┌─┐┌─┐┌┬┐
//   ║║║ ║║║║  ├┤ └┐┌┘├┤ ││││ └─┐  ┌┼─  ├┴┐│ ││ │ │
//  ═╩╝╚═╝╩ ╩  └─┘ └┘ └─┘┘└┘┴ └─┘  └┘   └─┘└─┘└─┘ ┴

$(function() {

  $('#but_help').val(txt.label_help);

  $('#but_play_pause').val(txt.label_pause);
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

  $('#but_new_layer').val(txt.label_new_layer);
  $('#but_new_layer').click(function() {
    cc.addLayerToDOM(cc.layerModel.createLayer());
  });

  $('#grid').keydown(function(e) {
    var idParts, layerName, varType, contentHTML,
        k = e.keyCode || e.charCode;

    if(k == 27) {
      // ESC
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

  $('#row_chatBox').focus(cc.onFocusEditable).blur(cc.onBlurEditable);
  $('#row_chatBox').keydown(function(e) {
    var k = e.keyCode || e.charCode;

    if(k == 10 || k == 13) {
      // ENTER
      cc.onPressEnter();
      $('#row_chatBox').text('');
      e.preventDefault();

    } else if(k == 27) {
      // ESC
      cc.lastEditAreaId.focus();
      cc.restoreSelection(cc.lastEditSelection);
    }
  });

  // resize grid matching window size
  cc.reservedVSpace = $('#row_menu').outerHeight(true) +
    $('#row_chatView').outerHeight(true) +
    $('#row_chatBox').outerHeight(true) + 8;
  cc.onWindowResize();

  $(window).resize(function() {
    cc.onWindowResize();
  });

  // show welcome
  cc.addTextToChat(txt.welcome);
});


var cc = new Joukkue();
