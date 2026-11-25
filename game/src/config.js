// config.js — tuning, recipes, stations and ingredient data for Sizzle & Serve.
// One job: every number and name the rest of the game reads lives here.
(function () {
  'use strict';
  var C = {
    W: 1280, H: 800,
    SHIFT_LEN: 180,          // seconds per shift
    MAX_LOST: 3,             // lost orders ends the shift
    MAX_ORDERS: 4,
    SPAWN_START: 13, SPAWN_MIN: 7, SPAWN_STEP: 0.55, // seconds between orders
    PATIENCE_START: 62, PATIENCE_MIN: 34, PATIENCE_STEP: 1.1,
    CHOP_TIME: 2.2,          // seconds holding at the board
    GRILL_TIME: 7, FRY_TIME: 6, BURN_AFTER: 7, // cook then burn window
    PLAYER_SPEED: 250,
    TIP_MAX: 12,
  };
  // Ingredients: id, label, colour, where it comes from, needs chop?
  var ING = {
    bun:     { label: 'Bun',    color: '#e8b06a', from: 'bin',  chop: false },
    patty:   { label: 'Patty',  color: '#8a4b2d', from: 'bin',  chop: false },
    lettuce: { label: 'Lettuce',color: '#58b368', from: 'bin',  chop: true  },
    tomato:  { label: 'Tomato', color: '#e2543e', from: 'bin',  chop: true  },
    cheese:  { label: 'Cheese', color: '#f5c542', from: 'bin',  chop: false },
    fries:   { label: 'Fries',  color: '#f2d06b', from: 'bin',  chop: false },
  };
  // Cooked forms produced by grill / fryer.
  var COOKED = { patty: 'pattyCooked', fries: 'friesCooked' };
  var COOK_LABEL = { pattyCooked: 'Grilled Patty', friesCooked: 'Crispy Fries' };
  // Recipes: name, required components (in any order), base points, colour.
  var RECIPES = [
    { id: 'classic', name: 'Classic Burger', needs: ['bun', 'pattyCooked', 'lettuce'],
      points: 30, color: '#e8a34c', blurb: 'Bun + grilled patty + lettuce' },
    { id: 'cheese', name: 'Cheese Burger', needs: ['bun', 'pattyCooked', 'cheese', 'lettuce'],
      points: 40, color: '#f5c542', blurb: 'Bun + patty + cheese + lettuce' },
    { id: 'salad', name: 'Garden Salad', needs: ['lettuce', 'tomato'],
      points: 25, color: '#58b368', blurb: 'Chopped lettuce + tomato' },
    { id: 'fries', name: 'Fries Basket', needs: ['friesCooked'],
      points: 18, color: '#f2d06b', blurb: 'Golden fries, straight from the fryer' },
  ];
  window.SizzleConfig = { C: C, ING: ING, COOKED: COOKED, COOK_LABEL: COOK_LABEL, RECIPES: RECIPES };
})();

// Stations: x,y,w,h in canvas pixels, plus what each one does.
// Layout: bins along the bottom, grill/fryer/chop along the top, plating
// centre-right, serving window top-right. Floor is the open middle.
(function () {
  'use strict';
  var S = window.SizzleConfig;
  S.STATIONS = [
    { id: 'bin-bun',     kind: 'bin', item: 'bun',     x: 40,  y: 668, w: 110, h: 92, label: 'BUNS' },
    { id: 'bin-patty',   kind: 'bin', item: 'patty',   x: 160, y: 668, w: 110, h: 92, label: 'PATTIES' },
    { id: 'bin-lettuce', kind: 'bin', item: 'lettuce', x: 280, y: 668, w: 110, h: 92, label: 'LETTUCE' },
    { id: 'bin-tomato',  kind: 'bin', item: 'tomato',  x: 400, y: 668, w: 110, h: 92, label: 'TOMATO' },
    { id: 'bin-cheese',  kind: 'bin', item: 'cheese',  x: 520, y: 668, w: 110, h: 92, label: 'CHEESE' },
    { id: 'bin-fries',   kind: 'bin', item: 'fries',   x: 640, y: 668, w: 110, h: 92, label: 'FRIES' },
    { id: 'chop',        kind: 'chop',  x: 40,  y: 170, w: 170, h: 96, label: 'CHOPPING BOARD' },
    { id: 'grill',       kind: 'grill', x: 250, y: 170, w: 200, h: 96, label: 'GRILL' },
    { id: 'fryer',       kind: 'fryer', x: 490, y: 170, w: 200, h: 96, label: 'FRYER' },
    { id: 'plate',       kind: 'plate', x: 800, y: 330, w: 210, h: 150, label: 'PLATING COUNTER' },
    { id: 'serve',       kind: 'serve', x: 1030, y: 170, w: 210, h: 96, label: 'SERVING WINDOW' },
  ];
  S.stationById = function (id) {
    for (var i = 0; i < S.STATIONS.length; i++) if (S.STATIONS[i].id === id) return S.STATIONS[i];
    return null;
  };
})();
