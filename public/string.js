(function(c){

  c.fmt = function(msg, etc) {
    var i = 1;
    var args = arguments;
    return msg.replace(/%((%)|s)/g, function (m) { return m[2] || args[i++] })
  };
  c.genID = function() {
    return 'Lxxxxxxxx'.replace(/[xy]/g, function(c) {
      var r = Math.random()*16|0, v = c == 'x' ? r : (r&0x3|0x8);
      return v.toString(16);
    });
  };
  c.genRandomName = function() {
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


})(typeof exports === 'undefined' ? this['string'] = {} : exports);
