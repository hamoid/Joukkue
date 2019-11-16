# Nov 16 2019

I added the ace editor but it's not linked yet to sharedb.
I found https://github.com/jethrokuan/sharedb-ace and maybe I could make
it work. It seems like the integration with ace is not trivial.
The code seems to transform all the OT messages from one system (ACE)
to the other (shareDB) and back.
It's not clear how to run that sharedb-ace code. There is an example
repo, but I didn't know how to start the server part.

Next: look into integrating the code from sharedb-ace into my code,
which does work alreary for simple textarea objects.

My client.js file looks like
https://github.com/jethrokuan/sharedb-ace/blob/master/source/sharedb-ace.js
which the loads 
https://github.com/jethrokuan/sharedb-ace/blob/master/source/sharedb-ace-binding.js
So it uses that sharedb-ace binding instead of StringBinding.

The Ace API: https://ace.c9.io/#howto=&nav=howto


# May 18 2019

At the Creative Code Jam with Nuño we experimented with sharedb.
There are a bunch of repos using ace or codemirror with sharedb, but they are all
abandoned. The only repo that seems to be maintained is sharedb itself, with very
recent commits. sharedb comes with 4 examples. During this code jam we made
the textarea example work, then added a second textarea just for testing.

To run:

    cd sharedb
    npm run build && npm start

* Next step: see how they implemented sharedb in the ace/codemirror
examples to do something similar, so we can use a fancier code editor than a simple
textarea (for syntax highlighting), and maybe (optional) show cursors and selections
from other participants.

We talked about 4 layer types:
* material: vertex+fragment which affects following p5js layers
* p5js: allows drawing 2D and 3D shapes to the current Graphics.
* postprocessing: fragment shader, applied to the current Graphics. Would use
  multiple buffers, in case you want to chain multiple postprocessing layers.
* reset shader. Not sure if this is needed if we can call resetShader() in
  p5js.

* have two different presentation modes. 
  * stack of layers is processed sequentially and there is only one output canvas
  * grid of layers, each gets its own canvas, to be used in a workshop setting.
* Idea: 'solo' button to only render one layer on your computer (in case it's getting
confusing to figure out what you are contributing to the mix).

# Nov 18 2017

I have downloaded src/sharedb-codemirror and it seems to work by running npm start.
So I could try integrate it.
Idea: use only one textarea per user. They can then use //once for code that should run
only once. Could I wrap variables like var a; var b; inside their own space to avoid
name collisions?

---

layers move when others send code
cursor jumps to received layer
layers are not updated sometimes
having a layer owner, otherwise there are orfan layers who no one dares to delete.
showing layer name, layer owner

Firepad needs Firebase :(

OT - operational transformations
http://sharejs.org/

Use codemirror. 
http://codemirror.net/

And mixing both:
https://github.com/share/share-codemirror

Tested with 20 editors. Syncs fine.

Cursor sync'ing is missing:
https://github.com/share/ShareJS/issues/24

---

Concept:
  simple: no chat, no db, no hidden stuff.

CodeMirror:
  var c = doc.getCursor('head');
  doc.setCursor(c);
  var d = doc.getValue();
  doc.setValue(d);
  events: change? changes? cursorActivity? focus? blur?


Interact: 
  eye icon: to enable, disable, 
  delete: delete key on empty field
  sort: drag and drop http://jqueryui.com/sortable/
  room: get from URL
  move in grid: ESC > arrows

Saving:
  server: on click, save snapshot [room].js to disk. max 1 per 10 sec? name? delete?
  client: load snapshot

Avoid infinite loops:
  Set timeout(50ms?)
  Eval your code (alt+enter)
  On timeout, if code evaled, send code.
  If infinite loop or slow code, code is not sent.
  Would be good to have a presentation computer (it never receives infinite loops)

--- 18 Feb 2017 - Code Jam

DONE: 

* Fixed a bug with adding err css.

* Trying to install it another computer there seems to be 
  npm package issues. I fixed all the package versions.

TODO:

* Figure out if XCode is needed on OSX to install Joukkue.

* If I connect late, I need to evaluate all layers. How to know which layers are running?

* Avoid loosing layers if restarting the server

* Namespace environment by URL, to avoid different "rooms". See
  'room' in index.js.

* Be able to evaluate selection


// Test of assigning a variable one time.

if(!J.vars) {
  J.vars = {};
  J.vars.env = new p5.Env();
  J.vars.env.setADSR(0.001, 0.2, 0.2, 0.5);
  J.vars.env.setRange(1.0, 0.0);

  J.vars.triOsc = new p5.Oscillator('triangle');
  J.vars.triOsc.amp(J.vars.env);
  J.vars.triOsc.start();
  J.vars.triOsc.freq(random(200, 500));  
} else {
  if(frameCount % 60 == -1) {
	  J.vars.env.play();  
		background(random(255));
		noStroke();
		fill(random(255));
		ellipse(width/2, height/2, 300, 300);
  }
}
