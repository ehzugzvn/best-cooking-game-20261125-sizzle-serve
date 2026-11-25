// render.js — canvas drawing for Sizzle & Serve.
// One job: draw(state) — kitchen, stations, orders, player, HUD. No logic.
(function () {
  'use strict';
  var CFG = window.SizzleConfig, C = CFG.C, ING = CFG.ING;
  var S = window.SizzleState.state, SS = window.SizzleState;

  var cv, ctx;
  function init() { cv = document.getElementById('game'); ctx = cv.getContext('2d'); }
  function rr(x, y, w, h, r) {
    ctx.beginPath();
    ctx.moveTo(x + r, y); ctx.arcTo(x + w, y, x + w, y + h, r);
    ctx.arcTo(x + w, y + h, x, y + h, r); ctx.arcTo(x, y + h, x, y, r);
    ctx.arcTo(x, y, x + w, y, r); ctx.closePath();
  }
  function text(s, x, y, size, color, align, bold) {
    ctx.fillStyle = color || '#222'; ctx.font = (bold ? 'bold ' : '') + size + 'px Trebuchet MS, sans-serif';
    ctx.textAlign = align || 'center'; ctx.textBaseline = 'middle';
    ctx.fillText(s, x, y);
  }
  function foodIcon(id, x, y, r) {
    // Simple drawn food: coloured disc + label dot, no borrowed art.
    var col = CFG.COOK_LABEL[id] ? (id === 'pattyCooked' ? '#6e3b1f' : '#f2c14e')
      : (ING[id] ? ING[id].color : '#ccc');
    ctx.fillStyle = col; ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2); ctx.fill();
    ctx.strokeStyle = 'rgba(0,0,0,.35)'; ctx.lineWidth = 2; ctx.stroke();
    if (id === 'bun') { ctx.fillStyle = '#f7d9a0'; ctx.beginPath(); ctx.arc(x, y - r * 0.25, r * 0.55, Math.PI, 0); ctx.fill(); }
    if (id === 'lettuce') { ctx.strokeStyle = '#2e7d32'; ctx.lineWidth = 3;
      ctx.beginPath(); ctx.arc(x, y, r * 0.55, 0.3, Math.PI - 0.3); ctx.stroke(); }
    if (id === 'tomato') { ctx.fillStyle = '#b71c1c'; ctx.beginPath(); ctx.arc(x, y, r * 0.3, 0, Math.PI * 2); ctx.fill(); }
    if (id === 'cheese') { ctx.fillStyle = '#ffe082'; ctx.fillRect(x - r * 0.6, y - r * 0.25, r * 1.2, r * 0.5); }
    if (id === 'friesCooked') { ctx.strokeStyle = '#f9a825'; ctx.lineWidth = 4;
      for (var i = -1; i <= 1; i++) { ctx.beginPath(); ctx.moveTo(x + i * 7, y + 8); ctx.lineTo(x + i * 7, y - 9); ctx.stroke(); } }
    if (id === 'pattyCooked') { ctx.fillStyle = '#8a4b2d'; ctx.beginPath(); ctx.arc(x, y, r * 0.7, 0, Math.PI * 2); ctx.fill(); }
  }
  function bar(x, y, w, h, frac, color) {
    ctx.fillStyle = 'rgba(0,0,0,.25)'; rr(x, y, w, h, 4); ctx.fill();
    ctx.fillStyle = color; rr(x, y, Math.max(0, w * Math.min(1, frac)), h, 4); ctx.fill();
  }
  function draw() {
    if (!ctx) init();
    drawFloor();
    window.SizzleRender.drawStations(); window.SizzleRender.drawPlayer();
    window.SizzleRender.drawOrders(); window.SizzleRender.drawHUD();
    if (S.phase === 'title') window.SizzleRender.drawTitle();
    if (S.phase === 'over' || S.phase === 'win') window.SizzleRender.drawEnd();
    if (S.flash > 0) { ctx.fillStyle = 'rgba(220,40,40,' + (S.flash * 0.35) + ')';
      ctx.fillRect(0, 0, C.W, C.H); }
  }
  function drawFloor() {
    ctx.fillStyle = '#f3e2c7'; ctx.fillRect(0, 0, C.W, C.H);
    // checkerboard floor
    for (var y = 0; y < 8; y++) for (var x = 0; x < 16; x++) {
      if ((x + y) % 2 === 0) { ctx.fillStyle = '#e8d3ae'; ctx.fillRect(x * 80, 280 + y * 65, 80, 65); }
    }
    // top wall + order rail
    ctx.fillStyle = '#7a4a2b'; ctx.fillRect(0, 0, C.W, 150);
    ctx.fillStyle = '#a06a3f'; ctx.fillRect(0, 150, C.W, 20);
    text('SIZZLE & SERVE  —  DINER', 640, 28, 26, '#ffe8b0', 'center', true);
    text('WASD / arrows to move  •  E or click to use a station  •  R to restart  •  M to mute',
      640, 58, 14, '#ffd9a0');
  }
  window.SizzleRender = { draw: draw, foodIcon: foodIcon, init: init };
})();

// render.js (part 2) — stations, player, orders, HUD, title/end screens.
(function () {
  'use strict';
  var CFG = window.SizzleConfig, C = CFG.C, ING = CFG.ING;
  var S = window.SizzleState.state, SS = window.SizzleState;
  var R = window.SizzleRender;

  // Stations are drawn with the shared context via a fresh lookup each call.
  function drawStations() {
    var cv = document.getElementById('game'), ctx = cv.getContext('2d');
    CFG.STATIONS.forEach(function (st) {
      var fill = '#fff8ec';
      if (st.kind === 'grill') fill = S.grill.state === 'ready' ? '#ffe082' : S.grill.state === 'burnt' ? '#5d4037' : '#cfd8dc';
      if (st.kind === 'fryer') fill = S.fryer.state === 'ready' ? '#ffe082' : S.fryer.state === 'burnt' ? '#5d4037' : '#b3e5fc';
      if (st.kind === 'plate') fill = '#e8f5e9';
      if (st.kind === 'serve') fill = '#fff3e0';
      ctx.fillStyle = fill; ctx.strokeStyle = '#5d3a1a'; ctx.lineWidth = 3;
      ctx.beginPath(); ctx.roundRect(st.x, st.y, st.w, st.h, 10); ctx.fill(); ctx.stroke();
      ctx.fillStyle = '#3e2723'; ctx.font = 'bold 13px Trebuchet MS, sans-serif';
      ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      ctx.fillText(st.label, st.x + st.w / 2, st.y + 16);
      if (st.kind === 'bin') {
        R.foodIcon(st.item, st.x + st.w / 2, st.y + 52, 22);
        ctx.fillStyle = '#6d4c41'; ctx.font = '13px Trebuchet MS, sans-serif';
        ctx.fillText(ING[st.item].label, st.x + st.w / 2, st.y + st.h - 12);
      }
      if (st.kind === 'chop') {
        if (S.chop.item) {
          R.foodIcon(S.chop.item, st.x + st.w / 2, st.y + 52, 20);
          ctx.fillStyle = '#222';
          ctx.fillRect(st.x + 20, st.y + st.h - 18, st.w - 40, 8);
          ctx.fillStyle = '#ff7043';
          ctx.fillRect(st.x + 20, st.y + st.h - 18, (st.w - 40) * (S.chop.t / C.CHOP_TIME), 8);
          ctx.fillStyle = '#3e2723'; ctx.font = 'bold 12px Trebuchet MS, sans-serif';
          ctx.fillText('CHOPPING…', st.x + st.w / 2, st.y + 36);
        } else {
          ctx.fillStyle = '#8d6e63'; ctx.font = '13px Trebuchet MS, sans-serif';
          ctx.fillText('Bring lettuce / tomato', st.x + st.w / 2, st.y + 52);
        }
      }
      if (st.kind === 'grill' || st.kind === 'fryer') {
        var slot = st.kind === 'grill' ? S.grill : S.fryer;
        var cookT = st.kind === 'grill' ? C.GRILL_TIME : C.FRY_TIME;
        if (slot.state !== 'empty') {
          R.foodIcon(slot.item, st.x + st.w / 2, st.y + 52, 20);
          var frac = slot.state === 'cooking' ? slot.t / cookT : 1;
          ctx.fillStyle = '#222'; ctx.fillRect(st.x + 20, st.y + st.h - 18, st.w - 40, 8);
          ctx.fillStyle = slot.state === 'burnt' ? '#d32f2f' : slot.state === 'ready' ? '#43a047' : '#ff9800';
          ctx.fillRect(st.x + 20, st.y + st.h - 18, (st.w - 40) * Math.min(1, frac), 8);
          ctx.fillStyle = '#3e2723'; ctx.font = 'bold 12px Trebuchet MS, sans-serif';
          ctx.fillText(slot.state === 'burnt' ? 'BURNT!' : slot.state === 'ready' ? 'READY — GRAB IT!' : 'COOKING…',
            st.x + st.w / 2, st.y + 36);
        } else {
          ctx.fillStyle = '#6d4c41'; ctx.font = '13px Trebuchet MS, sans-serif';
          ctx.fillText(st.kind === 'grill' ? 'Raw patty here' : 'Raw fries here', st.x + st.w / 2, st.y + 52);
        }
      }
      if (st.kind === 'plate') {
        // the plate: a white disc with the assembled items on it
        ctx.fillStyle = '#ffffff'; ctx.beginPath(); ctx.arc(st.x + st.w / 2, st.y + 82, 52, 0, Math.PI * 2); ctx.fill();
        ctx.strokeStyle = '#b0bec5'; ctx.lineWidth = 3; ctx.stroke();
        S.plate.forEach(function (it, i) {
          R.foodIcon(it, st.x + 62 + i * 36, st.y + 82, 15);
        });
        var rec = SS.recipeForPlate(S.plate);
        ctx.fillStyle = rec ? '#2e7d32' : '#6d4c41'; ctx.font = 'bold 12px Trebuchet MS, sans-serif';
        ctx.fillText(rec ? '✓ ' + rec.name.toUpperCase() + ' — SERVE!' : 'Plate: ' + S.plate.length + ' item(s)',
          st.x + st.w / 2, st.y + st.h - 12);
      }
      if (st.kind === 'serve') {
        ctx.fillStyle = '#6d4c41'; ctx.font = '13px Trebuchet MS, sans-serif';
        ctx.fillText('Serve finished plates here', st.x + st.w / 2, st.y + 52);
        ctx.fillText('→ matching order pays', st.x + st.w / 2, st.y + 72);
      }
    });
    // nearest-station hint ring
    var near = window.SizzleWorld.nearestStation();
    if (near && S.phase === 'playing') {
      ctx.strokeStyle = '#ff7043'; ctx.lineWidth = 3; ctx.setLineDash([6, 5]);
      ctx.beginPath(); ctx.roundRect(near.x - 5, near.y - 5, near.w + 10, near.h + 10, 12); ctx.stroke();
      ctx.setLineDash([]);
    }
  }
  function drawPlayer() {
    var cv = document.getElementById('game'), ctx = cv.getContext('2d');
    var p = S.player;
    ctx.fillStyle = 'rgba(0,0,0,.18)';
    ctx.beginPath(); ctx.ellipse(p.x, p.y + 26, 24, 8, 0, 0, Math.PI * 2); ctx.fill();
    // chef: white hat, apron, face
    ctx.fillStyle = '#ffffff'; ctx.beginPath(); ctx.arc(p.x, p.y - 18, 16, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#f5f5f5'; ctx.fillRect(p.x - 18, p.y - 30, 36, 12);
    ctx.fillStyle = '#ffcc9e'; ctx.beginPath(); ctx.arc(p.x, p.y, 14, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#222'; ctx.beginPath(); ctx.arc(p.x - 5, p.y - 2, 2, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.arc(p.x + 5, p.y - 2, 2, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#1976d2';
    ctx.beginPath(); ctx.roundRect(p.x - 16, p.y + 10, 32, 26, 8); ctx.fill();
    ctx.fillStyle = '#ffffff'; ctx.fillRect(p.x - 10, p.y + 14, 20, 18);
    if (S.hand) {
      R.foodIcon(S.hand, p.x + p.dir * 26, p.y - 6, 13);
      ctx.fillStyle = '#222'; ctx.font = 'bold 11px Trebuchet MS, sans-serif'; ctx.textAlign = 'center';
      ctx.fillText(window.SizzleWorld.itemLabel(S.hand), p.x, p.y - 38);
    }
  }
  function drawOrders() {
    var cv = document.getElementById('game'), ctx = cv.getContext('2d');
    ctx.fillStyle = 'rgba(0,0,0,.55)';
    ctx.beginPath(); ctx.roundRect(720, 78, 520, 62, 10); ctx.fill();
    ctx.fillStyle = '#ffe8b0'; ctx.font = 'bold 14px Trebuchet MS, sans-serif'; ctx.textAlign = 'left';
    ctx.fillText('ORDER BOARD', 736, 100);
    if (!S.orders.length) {
      ctx.fillStyle = '#fff'; ctx.font = '13px Trebuchet MS, sans-serif';
      ctx.fillText('No orders yet — first customer is coming…', 736, 124);
    }
    S.orders.forEach(function (o, i) {
      var x = 736 + i * 128, frac = Math.max(0, o.patience / o.max);
      ctx.fillStyle = o.recipe.color;
      ctx.beginPath(); ctx.roundRect(x, 108, 118, 26, 6); ctx.fill();
      ctx.fillStyle = '#222'; ctx.font = 'bold 12px Trebuchet MS, sans-serif'; ctx.textAlign = 'center';
      ctx.fillText(o.recipe.name, x + 59, 121);
      ctx.fillStyle = '#222'; ctx.fillRect(x, 136, 118, 5);
      ctx.fillStyle = frac > 0.5 ? '#43a047' : frac > 0.25 ? '#ff9800' : '#d32f2f';
      ctx.fillRect(x, 136, 118 * frac, 5);
    });
    ctx.textAlign = 'center';
  }
  function drawHUD() {
    var cv = document.getElementById('game'), ctx = cv.getContext('2d');
    // shift timer — big, top-left under the wall
    var left = SS.timeLeft(), urgent = left < 30;
    ctx.fillStyle = urgent ? '#d32f2f' : '#3e2723';
    ctx.beginPath(); ctx.roundRect(40, 78, 190, 62, 10); ctx.fill();
    ctx.fillStyle = '#fff'; ctx.font = 'bold 26px Trebuchet MS, sans-serif'; ctx.textAlign = 'center';
    ctx.fillText('⏱ ' + SS.fmtTime(left), 135, 102);
    ctx.font = '12px Trebuchet MS, sans-serif'; ctx.fillStyle = '#ffe8b0';
    ctx.fillText('SHIFT TIME LEFT', 135, 126);
    // score + served / lost
    ctx.fillStyle = '#3e2723'; ctx.beginPath(); ctx.roundRect(250, 78, 200, 62, 10); ctx.fill();
    ctx.fillStyle = '#fff'; ctx.font = 'bold 24px Trebuchet MS, sans-serif';
    ctx.fillText('$' + S.score, 350, 102);
    ctx.font = '12px Trebuchet MS, sans-serif'; ctx.fillStyle = '#ffe8b0';
    ctx.fillText('Served ' + S.served + '  •  Lost ' + S.lost + '/' + C.MAX_LOST, 350, 126);
    // recipe cheat-sheet strip
    ctx.fillStyle = 'rgba(255,255,255,.75)';
    ctx.beginPath(); ctx.roundRect(470, 78, 230, 62, 10); ctx.fill();
    ctx.fillStyle = '#3e2723'; ctx.font = 'bold 12px Trebuchet MS, sans-serif'; ctx.textAlign = 'left';
    ctx.fillText('MENU', 482, 94);
    ctx.font = '11px Trebuchet MS, sans-serif';
    ctx.fillText('Classic: bun+patty+lettuce', 482, 110);
    ctx.fillText('Cheese: +cheese  •  Salad: lettuce+tomato', 482, 126);
    ctx.textAlign = 'center';
    // feedback message
    if (S.msgT > 0 && S.msg) {
      ctx.fillStyle = 'rgba(0,0,0,.65)';
      ctx.beginPath(); ctx.roundRect(440, 300, 400, 34, 17); ctx.fill();
      ctx.fillStyle = '#fff'; ctx.font = 'bold 15px Trebuchet MS, sans-serif';
      ctx.fillText(S.msg, 640, 317);
    }
  }
  function drawTitle() {
    var cv = document.getElementById('game'), ctx = cv.getContext('2d');
    ctx.fillStyle = 'rgba(40,20,5,.72)'; ctx.fillRect(0, 0, C.W, C.H);
    ctx.fillStyle = '#ffe8b0'; ctx.font = 'bold 64px Trebuchet MS, sans-serif'; ctx.textAlign = 'center';
    ctx.fillText('SIZZLE & SERVE', 640, 300);
    ctx.fillStyle = '#fff'; ctx.font = '24px Trebuchet MS, sans-serif';
    ctx.fillText('The diner rush is on. Chop, grill, fry, plate — and serve it hot!', 640, 350);
    ctx.font = '18px Trebuchet MS, sans-serif'; ctx.fillStyle = '#ffd9a0';
    ctx.fillText('Move: WASD / arrows   •   Use a station: E or click   •   Lose 3 orders and the shift ends', 640, 400);
    ctx.fillStyle = '#ff7043'; ctx.beginPath(); ctx.roundRect(520, 440, 240, 56, 12); ctx.fill();
    ctx.fillStyle = '#fff'; ctx.font = 'bold 22px Trebuchet MS, sans-serif';
    ctx.fillText('▶  START SHIFT  (E / click)', 640, 469);
    ctx.fillStyle = '#ffe8b0'; ctx.font = '15px Trebuchet MS, sans-serif';
    ctx.fillText('3-minute shift  •  Tips for fast service  •  Orders get faster as the rush builds', 640, 530);
  }
  function drawEnd() {
    var cv = document.getElementById('game'), ctx = cv.getContext('2d');
    ctx.fillStyle = 'rgba(40,20,5,.72)'; ctx.fillRect(0, 0, C.W, C.H);
    var win = S.phase === 'win';
    ctx.fillStyle = win ? '#aeea00' : '#ff8a65'; ctx.font = 'bold 56px Trebuchet MS, sans-serif'; ctx.textAlign = 'center';
    ctx.fillText(win ? 'SHIFT COMPLETE!' : 'SHIFT OVER!', 640, 300);
    ctx.fillStyle = '#fff'; ctx.font = '26px Trebuchet MS, sans-serif';
    ctx.fillText('Score $' + S.score + '   •   Served ' + S.served + ' dishes   •   Lost ' + S.lost + ' orders', 640, 360);
    ctx.font = '18px Trebuchet MS, sans-serif'; ctx.fillStyle = '#ffd9a0';
    ctx.fillText(win ? 'The diner survived the rush. Same time tomorrow, chef?' : 'Three customers walked out. The rush beat us this time.', 640, 400);
    ctx.fillStyle = '#ff7043'; ctx.beginPath(); ctx.roundRect(520, 440, 240, 56, 12); ctx.fill();
    ctx.fillStyle = '#fff'; ctx.font = 'bold 22px Trebuchet MS, sans-serif';
    ctx.fillText('↻  PLAY AGAIN  (R)', 640, 469);
  }
  window.SizzleRender.drawStations = drawStations;
  window.SizzleRender.drawPlayer = drawPlayer;
  window.SizzleRender.drawOrders = drawOrders;
  window.SizzleRender.drawHUD = drawHUD;
  window.SizzleRender.drawTitle = drawTitle;
  window.SizzleRender.drawEnd = drawEnd;
})();
