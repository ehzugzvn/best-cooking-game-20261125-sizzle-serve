// shots.js — deterministic staged scenes for screenshots (?shot=...).
// One job: set up a fixed, readable scene per shot name, then freeze the clock.
(function () {
  'use strict';
  var CFG = window.SizzleConfig, C = CFG.C;
  var S = window.SizzleState.state, SS = window.SizzleState;

  function order(recipeId, patience, max) {
    var r = CFG.RECIPES.filter(function (x) { return x.id === recipeId; })[0];
    return { id: S.nextOrderId++, recipe: r, patience: patience, max: max, born: 0 };
  }
  function stage(shot) {
    SS.reset();
    S.phase = 'playing';
    if (shot === 'start') { S.phase = 'title'; return; }
    if (shot === 'play') {
      // Mid-play: two orders, a burger mid-assembly, patty on the grill.
      S.time = 42; S.score = 58; S.served = 2;
      S.orders = [order('classic', 38, 62), order('salad', 22, 55)];
      S.plate = ['bun', 'pattyCooked'];
      S.hand = 'lettuce';
      S.player = { x: 905, y: 430, dir: -1 };
      S.grill = { item: 'patty', t: 4.5, state: 'cooking' };
      S.fryer = { item: 'fries', t: 2, state: 'cooking' };
      SS.setMsg('Burger on the plate — add lettuce!');
      return;
    }
    if (shot === 'rush') {
      // Rush: four orders, two low on patience, grill + fryer both cooking.
      S.time = 132; S.score = 186; S.served = 7;
      S.orders = [order('cheese', 12, 40), order('classic', 9, 38),
        order('fries', 26, 36), order('salad', 31, 42)];
      S.plate = ['bun'];
      S.hand = 'pattyCooked';
      S.player = { x: 600, y: 430, dir: 1 };
      S.grill = { item: 'patty', t: 6.5, state: 'ready' };
      S.fryer = { item: 'fries', t: 5.5, state: 'ready' };
      S.chop = { item: 'tomato', t: 1.4 };
      SS.setMsg('Rush hour! Two orders almost out of time!');
      return;
    }
    if (shot === 'serve') {
      // Served plate: finished Cheese Burger on the plate, one order left.
      S.time = 88; S.score = 142; S.served = 4;
      S.orders = [order('cheese', 30, 50)];
      S.plate = ['bun', 'pattyCooked', 'cheese', 'lettuce'];
      S.player = { x: 1080, y: 300, dir: 1 };
      SS.setMsg('Cheese Burger ready — serve it at the window!');
      return;
    }
  }
  window.SizzleShots = {
    apply: function () {
      var q = new URLSearchParams(window.location.search);
      var shot = q.get('shot');
      if (!shot) return null;
      stage(shot);
      return shot;
    },
    // Freeze the staged scene (no timer drain) so screenshots are stable.
    freeze: function () { S._frozen = true; },
    isFrozen: function () { return !!S._frozen; },
  };
})();

// shots.js (part 2) — auto-freeze: a ?shot= scene holds still unless ?live=1.
(function () {
  'use strict';
  var S = window.SizzleState.state;
  window.addEventListener('load', function () {
    var q = new URLSearchParams(window.location.search);
    if (q.get('shot') && q.get('live') !== '1') {
      // Freeze after the first frame so the staged state is exactly as set.
      setTimeout(function () { S._frozen = true; }, 50);
    }
  });
})();
