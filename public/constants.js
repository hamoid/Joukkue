(function(c){

  c.DEFAULT_ROOM =      'default';

  c.CMD_SAY =           'say';
  c.CMD_JOIN_ROOM =     'joinRoom';
  c.CMD_SET_DRAW =      'setLayerDraw';
  c.CMD_SET_VARS =      'setLayerVars';
  c.CMD_SET_DEPTH =     'setLayerDepth';
  c.CMD_SET_ENABLED =   'setLayerEnabled';
  c.CMD_ADD_USER =      'addUser';
  c.CMD_REMOVE =        'removeLayer';
  c.CMD_REQ_ROOM_INFO = 'requestRoomInfo';
  c.CMD_SET_LAYERS =    'setAllLayers';

  c.GET_LAYER_SET_CMD = {
    'vars':  c.CMD_SET_VARS,
    'draw':  c.CMD_SET_DRAW,
    'depth': c.CMD_SET_DEPTH
  }

})(typeof exports === 'undefined' ? this['constants'] = {} : exports);
