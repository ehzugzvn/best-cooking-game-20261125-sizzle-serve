// audio.js — tiny WebAudio bleeps for Sizzle & Serve.
// One job: short synthesized sounds, no audio files, muted on M.
(function () {
  'use strict';
  var S = window.SizzleState.state;
  var ac = null;
  function ctx() {
    if (!ac) {
      var AC = window.AudioContext || window.webkitAudioContext;
      if (!AC) return null;
      ac = new AC();
    }
    if (ac.state === 'suspended') ac.resume();
    return ac;
  }
  function tone(freq, dur, type, vol) {
    if (S.muted) return;
    var c = ctx(); if (!c) return;
    try {
      var o = c.createOscillator(), g = c.createGain();
      o.type = type || 'sine'; o.frequency.value = freq;
      g.gain.setValueAtTime(vol || 0.12, c.currentTime);
      g.gain.exponentialRampToValueAtTime(0.001, c.currentTime + dur);
      o.connect(g); g.connect(c.destination);
      o.start(); o.stop(c.currentTime + dur);
    } catch (e) { /* audio is optional */ }
  }
  window.SizzleAudio = {
    blip: function (f, d) { tone(f || 520, d || 0.06, 'sine', 0.1); },
    serve: function () { tone(660, 0.08); setTimeout(function () { tone(880, 0.12); }, 90); },
    win: function () { [523, 659, 784].forEach(function (f, i) {
      setTimeout(function () { tone(f, 0.15, 'triangle', 0.12); }, i * 120); }); },
    toggleMute: function () { S.muted = !S.muted; return S.muted; },
  };
})();

// audio.js (part 2) — M key toggles mute; expose a soft "ding" for cookers.
(function () {
  'use strict';
  var A = window.SizzleAudio;
  A.ding = function () { A.blip(990, 0.12); };
  A.chop = function () { A.blip(240, 0.04); };
  // Mute state is read by the game loop each frame via SizzleInput.mutePressed.
  window.SizzleAudio.toggleMuteKey = function () { return A.toggleMute(); };
})();
