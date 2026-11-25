// world.js — simulation: movement, station interaction, cooking, orders.
// One job: update(state, dt) — everything that changes over time lives here.
(function () {
  'use strict';
  var CFG = window.SizzleConfig, C = CFG.C, ING = CFG.ING;
  var S = window.SizzleState.state, SS = window.SizzleState;
  var Input = window.SizzleInput;

  function clampPlayer(p) {
    p.x = Math.max(30, Math.min(C.W - 30, p.x));
    p.y = Math.max(290, Math.min(C.H - 40, p.y)); // floor: below the top counters
  }
  function nearestStation() {
    var best = null, bd = 1e9;
    CFG.STATIONS.forEach(function (st) {
      var cx = st.x + st.w / 2, cy = st.y + st.h / 2;
      var d = Math.hypot(S.player.x - cx, S.player.y - cy);
      if (d < bd) { bd = d; best = st; }
    });
    return bd < 150 ? best : null;
  }
  function stationAtPoint(x, y) {
    for (var i = 0; i < CFG.STATIONS.length; i++) {
      var st = CFG.STATIONS[i];
      if (x >= st.x - 8 && x <= st.x + st.w + 8 && y >= st.y - 8 && y <= st.y + st.h + 8) return st;
    }
    return null;
  }
  function itemLabel(id) {
    return CFG.COOK_LABEL[id] || (ING[id] ? ING[id].label : id);
  }
  function chopResult(id) { return id; } // chopped veg keeps its id; flag below
  // Interact with a station. Holding E at the board chops; a tap does the rest.
  function interact(st) {
    if (!st) return;
    if (st.kind === 'bin') {
      if (S.hand) { SS.setMsg('Hands full — plate or serve what you hold first!'); return; }
      S.hand = st.item;
      SS.setMsg(itemLabel(st.item) + ' in hand.');
      window.SizzleAudio && window.SizzleAudio.blip(520, 0.05);
      return;
    }
    if (st.kind === 'chop') {
      if (S.chop.item) return; // already chopping; progress runs in update()
      if (!S.hand || !ING[S.hand] || !ING[S.hand].chop) {
        SS.setMsg('Chopping board needs lettuce or tomato in hand.');
        return;
      }
      S.chop.item = S.hand; S.chop.t = 0; S.hand = null;
      SS.setMsg('Chopping… hold on!');
      return;
    }
    if (st.kind === 'grill' || st.kind === 'fryer') {
      var slot = st.kind === 'grill' ? S.grill : S.fryer;
      var raw = st.kind === 'grill' ? 'patty' : 'fries';
      var cookT = st.kind === 'grill' ? C.GRILL_TIME : C.FRY_TIME;
      if (slot.state === 'empty') {
        if (S.hand !== raw) { SS.setMsg(st.label + ' needs a raw ' + raw + '.'); return; }
        slot.item = raw; slot.t = 0; slot.state = 'cooking'; S.hand = null;
        SS.setMsg(raw === 'patty' ? 'Patty on the grill!' : 'Fries in the fryer!');
        window.SizzleAudio && window.SizzleAudio.blip(300, 0.08);
        return;
      }
      if (slot.state === 'ready' || slot.state === 'burnt') {
        if (S.hand) { SS.setMsg('Hands full!'); return; }
        if (slot.state === 'burnt') {
          SS.setMsg('Burnt! Tossed in the bin. Watch the timer next time.');
          slot.item = null; slot.t = 0; slot.state = 'empty';
          return;
        }
        S.hand = CFG.COOKED[slot.item];
        SS.setMsg(itemLabel(S.hand) + ' ready!');
        slot.item = null; slot.t = 0; slot.state = 'empty';
        window.SizzleAudio && window.SizzleAudio.blip(660, 0.06);
        return;
      }
      SS.setMsg('Still cooking — watch the bar!');
      return;
    }
    if (st.kind === 'plate') {
      if (S.hand) {
        S.plate.push(S.hand);
        SS.setMsg(itemLabel(S.hand) + ' on the plate.');
        S.hand = null;
        window.SizzleAudio && window.SizzleAudio.blip(440, 0.05);
      } else if (S.plate.length) {
        S.hand = S.plate.pop(); // pick the last item back up
        SS.setMsg(itemLabel(S.hand) + ' back in hand.');
      } else SS.setMsg('Plating counter is empty — bring ingredients.');
      return;
    }
    if (st.kind === 'serve') {
      var recipe = SS.recipeForPlate(S.plate);
      if (!recipe) { SS.setMsg('That plate is not a finished dish yet.'); return; }
      var res = SS.servePlate(recipe);
      if (res.ok) {
        S.plate = [];
        window.SizzleAudio && window.SizzleAudio.serve();
      }
      return;
    }
  }
  window.SizzleWorld = { interact: interact, nearestStation: nearestStation,
    stationAtPoint: stationAtPoint, itemLabel: itemLabel, chopResult: chopResult };
})();

// world.js (part 2) — the per-frame update: movement, timers, spawning.
(function () {
  'use strict';
  var CFG = window.SizzleConfig, C = CFG.C;
  var S = window.SizzleState.state, SS = window.SizzleState;
  var Input = window.SizzleInput, W = window.SizzleWorld;

  function update(dt) {
    if (S.phase === 'title') {
      if (Input.interact || Input.restartPressed) { SS.reset(); }
      return;
    }
    if (S.phase === 'over' || S.phase === 'win') {
      if (Input.interact || Input.restartPressed) SS.reset();
      return;
    }
    // --- movement (keys, or walk toward a tap target) ---
    var a = Input.axis(), p = S.player;
    if (a.x || a.y) {
      p.x += a.x * C.PLAYER_SPEED * dt; p.y += a.y * C.PLAYER_SPEED * dt;
      if (a.x) p.dir = a.x > 0 ? 1 : -1;
      Input.tapTarget = null;
    } else if (Input.tapTarget) {
      var dx = Input.tapTarget.x - p.x, dy = Input.tapTarget.y - p.y;
      var d = Math.hypot(dx, dy);
      if (d > 12) { p.x += dx / d * C.PLAYER_SPEED * dt; p.y += dy / d * C.PLAYER_SPEED * dt; }
      else Input.tapTarget = null;
    }
    clamp(p);
    // --- click a station: walk is instant here — interact with what was tapped ---
    if (Input.mouse.clicked) {
      var st = W.stationAtPoint(Input.mouse.x, Input.mouse.y);
      if (st) {
        var cx = st.x + st.w / 2, cy = st.y + st.h + 24;
        // Teleport-free: only interact when close enough, else walk toward it.
        if (Math.hypot(p.x - cx, p.y - cy) < 170) W.interact(st);
        else Input.tapTarget = { x: cx, y: Math.min(cy, C.H - 50) };
      }
    }
    // --- E / Space interacts with the nearest station ---
    if (Input.interact) {
      var near = W.nearestStation();
      if (near) W.interact(near);
    }
    // --- chopping: hold near the board while something is on it ---
    if (S.chop.item) {
      var board = CFG.stationById('chop');
      var nearBoard = Math.hypot(p.x - (board.x + board.w / 2), p.y - (board.y + board.h / 2)) < 170;
      if (nearBoard) {
        S.chop.t += dt;
        if (S.chop.t >= C.CHOP_TIME) {
          S.hand = S.chop.item; // chopped veg returns to hand, ready to plate
          SS.setMsg(itemLabel2(S.chop.item) + ' chopped! Plate it.');
          S.chop.item = null; S.chop.t = 0;
          window.SizzleAudio && window.SizzleAudio.blip(700, 0.07);
        }
      }
    }
    // --- cookers ---
    tickCooker(S.grill, C.GRILL_TIME, dt);
    tickCooker(S.fryer, C.FRY_TIME, dt);
    // --- orders ---
    S.time += dt;
    S.spawnIn -= dt;
    if (S.spawnIn <= 0 && S.orders.length < C.MAX_ORDERS) SS.spawnOrder();
    for (var i = S.orders.length - 1; i >= 0; i--) {
      S.orders[i].patience -= dt;
      if (S.orders[i].patience <= 0) { SS.loseOrder(S.orders[i]); if (S.phase !== 'playing') break; }
    }
    if (S.msgT > 0) S.msgT -= dt;
    if (S.flash > 0) S.flash -= dt;
    if (SS.timeLeft() <= 0 && S.phase === 'playing') {
      S.phase = S.lost >= C.MAX_LOST ? 'over' : 'win';
      window.SizzleAudio && window.SizzleAudio.win();
    }
  }
  function clamp(p) {
    p.x = Math.max(30, Math.min(C.W - 30, p.x));
    p.y = Math.max(290, Math.min(C.H - 40, p.y));
  }
  function itemLabel2(id) { return W.itemLabel(id); }
  function tickCooker(slot, cookT, dt) {
    if (slot.state === 'cooking') {
      slot.t += dt;
      if (slot.t >= cookT) { slot.state = 'ready'; slot.t = cookT;
        SS.setMsg('Ding! ' + (slot.item === 'patty' ? 'Patty' : 'Fries') + ' ready — grab it!'); }
    } else if (slot.state === 'ready') {
      slot.t += dt;
      if (slot.t >= cookT + C.BURN_AFTER) { slot.state = 'burnt';
        SS.setMsg('Oh no — something burnt!'); }
    }
  }
  window.SizzleWorld.update = update;
})();
