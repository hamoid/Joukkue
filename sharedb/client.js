var sharedb = require('sharedb/lib/client');
var StringBinding = require('sharedb-string-binding');

// Open WebSocket connection to ShareDB server
const WebSocket = require('reconnecting-websocket');
var socket = new WebSocket('ws://' + window.location.host);
var connection = new sharedb.Connection(socket);

var status = document.getElementById('status');
status.innerHTML = "Not Connected"
socket.onopen = function(){
  status.innerHTML = "Connected"
};

socket.onclose = function(){
  status.innerHTML = "Closed"
};

socket.onerror = function() {
  status.innerHTML = "Error"
}

var t = [], docs = [], bindings = [];
for(let i=0; i<2; i++) {
  let tt = document.getElementById('t' + i);
  let doc = connection.get('examples', 'text' + i);
  doc.subscribe(function(err) {
    if (err) throw err;

    let binding = new StringBinding(tt, doc, ['content']);
    binding.setup();
    bindings.push(binding);
  });

  t.push(tt);
  docs.push(doc);
}
