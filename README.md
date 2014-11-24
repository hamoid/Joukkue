# Joukkue - Collaborative Creative Coding

Work in progress.

## To do

* layers contain more data:
  * changedBy (server) = ['name1']
* to server
  * addEditor(layer)
  * removeEditor(layer)
* from server
  * setEditors(layer, [] )
* cell.onKeyPress, compare .length || content is diff, cell.editors.push(myself). Server sends editor list for each cell.
* show crashed layers (red border)
* show changed cells (yellow border)
* show conflict cell (orange border)
  * don't rewrite, resolve. CTRL+ENTER=mine SHIFT+ESC=theirs
* implement .up .down .top .bottom
* implement .revert

* BUG? layer renamed itself as another layer. check.
* Send noiseSeed, randomSeed
* Meta: code can listen to coders coding :)
* .save - http://www.websector.de/blog/2011/12/22/pushing-binary-image-data-using-node-js-and-socket-io/

## Done

* Save layers on server to database on disk
* When entering the chat room, send all layers in that room
* Give automatic name to user, allow renaming
  * Create name generator
* Show chat in GUI
* Show layer crashes in chat.
* Chat, highlight on focus.
* implement: .who .where .help .room .new
* ESC toggle between edit/chat
* on cell focus, restore selection
* on cell blur, store selection
* Scroll to bottom when editing last field
* on cell blur, highlight border (used by .on, .off, .delete ...)
* implement .on .off commands and css
* implement .delete .rooms
* implement .name
* flash received cell

## Links

* [node.js](http://nodejs.org/)
* [socket.io](http://socket.io)
* [NeDB](https://github.com/louischatriot/nedb)
* [P5.js](http://p5js.org)
* [Text to ASCII Art Generator](http://patorjk.com/software/taag/)
