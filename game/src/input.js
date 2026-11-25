// input.js — keyboard + mouse input for Sizzle & Serve.
// One job: turn keys and clicks into a clean state the game reads each frame.
(function () {
  'use strict';
  var keys = {};
  var mouse = { x: 0, y: 0, clicked: false, down: false };
  var interactPressed = false; // edge-triggered: true for one frame after E / click
  var KEYMAP = { KeyW: 'up', ArrowUp: 'up', KeyS: 'down', ArrowDown: 'down',
    KeyA: 'left', ArrowLeft: 'left', KeyD: 'right', ArrowRight: 'right' };

  window.addEventListener('keydown', function (e) {
    if (KEYMAP[e.code]) { keys[KEYMAP[e.code]] = true; e.preventDefault(); }
    if (e.code === 'KeyE' || e.code === 'Space' || e.code === 'Enter') {
      if (!e.repeat) interactPressed = true;
      e.preventDefault();
    }
    if (e.code === 'KeyR') window.SizzleInput.restartPressed = true;
    if (e.code === 'KeyM') window.SizzleInput.mutePressed = true;
  });
  window.addEventListener('keyup', function (e) {
    if (KEYMAP[e.code]) keys[KEYMAP[e.code]] = false;
  });
  window.addEventListener('blur', function () { keys = {}; mouse.down = false; });

  function canvasPos(e) {
    var c = document.getElementById('game');
    if (!c) return { x: 0, y: 0 };
    var r = c.getBoundingClientRect();
    return { x: (e.clientX - r.left) * (c.width / r.width),
             y: (e.clientY - r.top) * (c.height / r.height) };
  }
  window.addEventListener('mousedown', function (e) {
    var p = canvasPos(e); mouse.x = p.x; mouse.y = p.y; mouse.down = true;
    mouse.clicked = true; interactPressed = true;
  });
  window.addEventListener('mouseup', function () { mouse.down = false; });
  window.addEventListener('mousemove', function (e) {
    var p = canvasPos(e); mouse.x = p.x; mouse.y = p.y;
  });

  window.SizzleInput = {
    keys: keys, mouse: mouse,
    get interact() { return interactPressed; },
    get restartPressed() { return !!this._restart; },
    set restartPressed(v) { this._restart = v; },
    get mutePressed() { return !!this._mute; },
    set mutePressed(v) { this._mute = v; },
    // Called once per frame by the game loop: clears edge triggers.
    endFrame: function () { interactPressed = false; mouse.clicked = false;
      this._restart = false; this._mute = false; },
    axis: function () {
      var x = (keys.right ? 1 : 0) - (keys.left ? 1 : 0);
      var y = (keys.down ? 1 : 0) - (keys.up ? 1 : 0);
      if (x && y) { x *= 0.7071; y *= 0.7071; }
      return { x: x, y: y };
    },
  };
})();

// input.js (part 2) — touch support so the game also answers on a tap.
// Tapping a station walks the chef toward it; tapping again interacts.
(function () {
  'use strict';
  var Input = window.SizzleInput;
  Input.tapTarget = null; // {x,y} the chef should walk to, or null
  window.addEventListener('touchstart', function (e) {
    var t = e.touches[0]; if (!t) return;
    var c = document.getElementById('game'); if (!c) return;
    var r = c.getBoundingClientRect();
    Input.tapTarget = { x: (t.clientX - r.left) * (c.width / r.width),
                        y: (t.clientY - r.top) * (c.height / r.height) };
    Input.mouse.x = Input.tapTarget.x; Input.mouse.y = Input.tapTarget.y;
  }, { passive: true });
})();
