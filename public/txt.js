(function(c){

  c.serverName =    'cpu';

  c.someoneIsHere = '%s is here';
  c.someoneIsGone = '%s is gone';
  c.youAreIn =      'You are now in the %s room ';
  c.byYourself =    'by yourself';
  c.wentToRoom =    '%s went to room %s',
  c.with =          'with';
  c.nameChanged =   '%s is %s from now on';
  c.roomInfo =      'Hi %s!\nYou are in the %s room %s';
  c.roomList =      'These are the existing rooms: %s';
  c.unknownCmd =    'No idea what %s means. Maybe use .help ?';

  c.layerCrashed =  'Layer %s crashed with %s';
  c.layerModifiedRemotely = 'The layer with orange borders was '
  + 'changed remotely! Use .revert (alt+r) to accept their version '
  + 'or click on the layer and press alt+enter to send your version';
  c.roomHowto =     'use: .room roomName';
  c.nameHowto =     'use: .name newName';

  c.help =          '<br/>Available commands:<br/>'
  + '_.rooms _ _ _ _ List available rooms<br/>'
  + '_.room roomName Go to new room<br/>'
  + '_.name newName_ Change nickname<br/>'
  + '_.who / where _ Show room name and participants<br/>'
  + '_.new / .delete Create / delete layer<br/>'
  + '_.on  / .off _ _Enable / disable layer<br/>'
  + '_.up  / .down _ Increase / decrease layer z-depth<br/>'
  + '_.top / .bottom Put layer on top / bottom<br/>'
  + '_.help _ _ _ _ _Show this help<br/>';

  c.listeningAt =    'Joukkue listening at http://%s:%s';

  c.welcome =        'Welcome to <a target="joukkue" '
  + 'href="https://github.com/hamoid/joukkue">Joukkue</a> v0.1!';

  c.label_new_layer = 'new layer';
  c.label_help      = 'help';
  c.label_play      = 'play animation';
  c.label_pause     = 'pause animation';

})(typeof exports === 'undefined' ? this['txt'] = {} : exports);
