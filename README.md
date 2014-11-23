# Joukkue - Collaborative Creative Coding

Work in progress.

## To do

* BUG: layer renamed itself as another layer. check.
* layers contain more data:
  * isCrashed (local)
  * changedBy (server) = {name1:23}
  * // boolean or int? int implies more
  * // connections to the server
* commands to server
  * addEditor(layer)
  * removeEditor(layer)
* commands from server
  * setEditors(layer, { people })

* .shiftKey + ESC to .revert changes to layer
* If someone edits same cell as you, indicate changed (but don't rewrite your work without notice)
  * CTRL+ENTER sends your edit
* Show where people are editing
* Indicate crashed layer
* cell.onKeyPress, compare .length || content is diff, cell.editors.push(myself). Server sends editor list for each cell. Clients visualize editors.
* implement
  * .name .delete
  * .up .down .top .bottom
  * .rooms .revert

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

## Links

* [node.js](http://nodejs.org/)
* [socket.io](http://socket.io)
* [NeDB](https://github.com/louischatriot/nedb)
* [P5.js](http://p5js.org)
* [Text to ASCII Art Generator](http://patorjk.com/software/taag/)
