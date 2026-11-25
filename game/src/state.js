// state.js — game state: orders, timer, score, hand, cookers, plate.
// One job: the single source of truth; world.js mutates it, render.js reads it.
(function () {
  'use strict';
  var CFG = window.SizzleConfig, C = CFG.C;

  function freshState() {
    return {
      phase: 'title',           // title | playing | over | win
      time: 0,                  // seconds since shift start
      shiftLeft: C.SHIFT_LEN,
      score: 0, served: 0, lost: 0, earned: 0,
      orders: [],               // {id, recipe, patience, max, born}
      nextOrderId: 1,
      spawnIn: 4,               // first order after 4s
      hand: null,               // item id in the chef's hand, or null
      chop: { item: null, t: 0 },       // chopping board progress
      grill: { item: null, t: 0, state: 'empty' }, // empty|cooking|ready|burnt
      fryer: { item: null, t: 0, state: 'empty' },
      plate: [],                // item ids on the plating counter
      player: { x: 640, y: 460, dir: 1 },
      msg: '', msgT: 0,         // floating feedback text + timer
      flash: 0,                 // red flash on lost order
      muted: false,
    };
  }

  var S = freshState();
  var RECIPES = CFG.RECIPES;

  function spawnScale() { // 0..1 difficulty ramp over the shift
    return Math.min(1, S.time / C.SHIFT_LEN);
  }
  function spawnInterval() {
    return Math.max(C.SPAWN_MIN, C.SPAWN_START - spawnScale() * 14);
  }
  function patienceFor() {
    return Math.max(C.PATIENCE_MIN, C.PATIENCE_START - spawnScale() * 26);
  }
  function pickRecipe() {
    // Early shift: easy recipes first; full menu once the rush builds.
    var pool = spawnScale() < 0.25 ? RECIPES.slice(0, 2)
      : spawnScale() < 0.55 ? RECIPES.slice(0, 3) : RECIPES;
    return pool[Math.floor(Math.random() * pool.length)];
  }
  function spawnOrder() {
    var r = pickRecipe(), p = patienceFor();
    S.orders.push({ id: S.nextOrderId++, recipe: r, patience: p, max: p,
      born: S.time });
    S.spawnIn = spawnInterval();
  }
  function recipeForPlate(plate) {
    // A plate matches a recipe when its items are exactly the recipe's needs.
    var sorted = plate.slice().sort().join('|');
    for (var i = 0; i < RECIPES.length; i++) {
      if (RECIPES[i].needs.slice().sort().join('|') === sorted) return RECIPES[i];
    }
    return null;
  }
  function setMsg(text) { S.msg = text; S.msgT = 2.2; }

  window.SizzleState = {
    state: S, freshState: freshState, spawnOrder: spawnOrder,
    recipeForPlate: recipeForPlate, spawnInterval: spawnInterval,
    patienceFor: patienceFor, setMsg: setMsg,
    reset: function () {
      var n = freshState();
      Object.keys(S).forEach(function (k) { delete S[k]; });
      Object.keys(n).forEach(function (k) { S[k] = n[k]; });
      S.phase = 'playing';
    },
  };
})();

// state.js (part 2) — scoring and order outcomes.
(function () {
  'use strict';
  var CFG = window.SizzleConfig, C = CFG.C, S = window.SizzleState.state;
  var SS = window.SizzleState;

  // Serve a ready plate: find the oldest matching order, pay base + tip.
  SS.servePlate = function (recipe) {
    for (var i = 0; i < S.orders.length; i++) {
      if (S.orders[i].recipe.id === recipe.id) {
        var o = S.orders[i];
        var tip = Math.round(C.TIP_MAX * (o.patience / o.max));
        var gain = recipe.points + tip;
        S.score += gain; S.earned += gain; S.served++;
        S.orders.splice(i, 1);
        SS.setMsg('Served ' + recipe.name + '! +$' + gain +
          (tip > 0 ? ' (tip $' + tip + ')' : ''));
        return { ok: true, gain: gain };
      }
    }
    SS.setMsg('No order wants a ' + recipe.name + ' right now!');
    return { ok: false };
  };
  // An order's patience ran out.
  SS.loseOrder = function (order) {
    var i = S.orders.indexOf(order);
    if (i >= 0) S.orders.splice(i, 1);
    S.lost++; S.flash = 0.6;
    SS.setMsg('Order lost! A customer walked out. (' + S.lost + '/' + C.MAX_LOST + ')');
    if (S.lost >= C.MAX_LOST) S.phase = 'over';
  };
  SS.timeLeft = function () { return Math.max(0, C.SHIFT_LEN - S.time); };
  SS.fmtTime = function (sec) {
    sec = Math.max(0, Math.ceil(sec));
    return Math.floor(sec / 60) + ':' + String(sec % 60).padStart(2, '0');
  };
})();
