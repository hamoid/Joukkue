# Joukkue - Collaborative Creative Coding

Work in progress.

## To do

* show layers dirty (yellow border):
  * layer.editors = { abe: true, ram: true }
  * border width = number of editors
  * toServer.setEditor(layer, true)
  * fromServer.setEditors(layer, [] )
  * cell.onKeyPress, compare .length || content is diff, cell.editors.push(myself). Server sends editor list for each cell.

* implement .up .down .top .bottom, remove column #3

* how to set some vars, but not all? AND let new users receive all?
  * forward sent messages, but stack them in DB.
  * also stack them upon reception (don't overwrite object)

* BUG? layer renamed itself as another layer. check.
* Send noiseSeed, randomSeed
* Meta: code can listen to coders coding :)
* .save - http://www.websector.de/blog/2011/12/22/pushing-binary-image-data-using-node-js-and-socket-io/
* chat: show different colors for cpu, local and others

## Done

* Save layers on server to database on disk
* When entering the chat room, send all layers in that room
* Give automatic name to user, allow renaming
  * Create name generator
* Show chat in GUI
* Show layer crashes in chat.
* Chat, highlight on focus.
* Implement: .who .where .help .room .new
* ESC toggle between edit/chat
* On cell focus, restore selection
* On cell blur, store selection
* Scroll to bottom when editing last field
* On cell blur, highlight border (used by .on, .off, .delete ...)
* Implement .on .off commands and css
* Implement .delete .rooms
* Implement .name
* Flash received cell
* When we receive vars|draw, do not overwrite them with a function|obj, but keep html version to be able to undo and to compare current html with the received html. Create drawFunc|varsObj instead.
* implement .revert alt+r
* when we receive vars, draw, update original html. if current==original, change too, otherwise orange border (conflict)
* add 'crashed' style to td
* try evaling before sending (no point sending broken code)

## Links

* [node.js](http://nodejs.org/)
* [socket.io](http://socket.io)
* [NeDB](https://github.com/louischatriot/nedb)
* [P5.js](http://p5js.org)
* [Text to ASCII Art Generator](http://patorjk.com/software/taag/)
