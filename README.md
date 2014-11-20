# Joukkue - Collaborative Creative Coding

Work in progress.

## To do

* on cell blur, highlight cell border
* Scroll to bottom when editing last field

* If someone edits same cell as you, indicate changed (but don't rewrite your work without notice)
  * ESC cancels your edit (jumps between grid and chat)
  * CTRL+ENTER sends your edit
* Show where people are editing
* Indicate crashed layer
* Indicate disabled layer
* When I start typing in a layer, add myself as editor to server. When I save or loose focus, remove myself as editor. Server sends editor list for each field. Clients should visualize editors.

* Send noiseSeed, randomSeed
* Meta: code can listen to coders coding :)

* implement
  * .on .off .name .new .delete
  * .up .down .top .bottom
  * .rooms
  * .save - http://www.websector.de/blog/2011/12/22/pushing-binary-image-data-using-node-js-and-socket-io/

## Done

* Save layers on server to database on disk
* When entering the chat room, send all layers in that room
* Give automatic name to user, allow renaming
  * Create name generator
* Show chat in GUI
* Show layer crashes in chat.
* Chat, highlight on focus.
* implement: .who .where .help .room
* ESC toggle between edit/chat
* on cell focus, restore selection
* on cell blur, store selection
