/* ==========================================================
   MAIN  — game init, tick loop & orchestrator
   ========================================================== */
(function (G) {
  'use strict';

  /* ==========================================================
     GAME INIT / RESET
     ========================================================== */
  G.initGame = function (m) {
    G.mode = m;
    G.score = [0, 0];
    G.lastLoser = -1;
    G.lastScorer = -1;
    G.p1 = G.makePlayer(G.P1_HOME, 'yo', 1);
    G.p2 = G.makePlayer(G.P2_HOME, 'me', -1);
    resetRound();
    G.startIngameBgm();
  };

  function resetRound() {
    G.p1.x = G.P1_HOME; G.p1.y = G.GROUND_Y; G.p1.vx = 0; G.p1.vy = 0; G.p1.grounded = true; G.p1.anim = 'stand';
    G.p2.x = G.P2_HOME; G.p2.y = G.GROUND_Y; G.p2.vx = 0; G.p2.vy = 0; G.p2.grounded = true; G.p2.anim = 'stand';
    G.aiTouches = 0;
    G.aiBallWasOnMySide = false;

    var side = Math.random() < 0.5 ? 0 : 1;
    G.ball.x = (side === 0) ? G.P1_HOME : G.P2_HOME;
    G.ball.y = 60;
    G.ball.vx = 0; G.ball.vy = 0; G.ball.rot = 0; G.ball.dead = false;

    G.stateTimer = G.SERVE_MS;
    G.state = 'SERVE';
  }

  /* ==========================================================
     SCORE / STATE TRANSITIONS
     ========================================================== */
  function handlePoint() {
    var side = G.ball.x < G.NET_X ? 0 : 1;
    var scorer = side === 0 ? 1 : 0;
    G.score[scorer]++;
    G.lastLoser = side;
    G.lastScorer = scorer;
    G.stateTimer = G.POINT_MS;
    G.state = 'POINT';

    var winP = scorer === 0 ? G.p1 : G.p2;
    winP.anim = 'celebrate';
    if (winP.grounded) { winP.vy = G.PLYR_JUMP * 0.55; winP.grounded = false; }
  }

  function checkWin() {
    if (G.score[0] >= G.WIN_SCORE) return 0;
    if (G.score[1] >= G.WIN_SCORE) return 1;
    return -1;
  }

  function startCelebration(w) {
    G.state = 'CELEBRATION';
    G.celebWinner = w;
    G.stateTimer = 0;
    var winP = w === 0 ? G.p1 : G.p2;
    winP.anim = 'celebrate';
    var loseP = w === 0 ? G.p2 : G.p1;
    loseP.anim = 'stand'; loseP.vx = 0;
  }

  /* ==========================================================
     MAIN UPDATE (tick)
     ========================================================== */
  function tick() {
    if (G.state === 'SERVE' || G.state === 'PLAYING') {
      G.updatePlayer(G.p1, G.p1Input());
      if (G.mode === 1) G.updateAI(G.p2); else G.updatePlayer(G.p2, G.p2Input());
      G.applyPlayerPhysics(G.p1, G.PLYR_R, G.NET_X - G.NET_HW - G.PLYR_R);
      G.applyPlayerPhysics(G.p2, G.NET_X + G.NET_HW + G.PLYR_R, G.GW - G.PLYR_R);
    }

    if (G.state === 'SERVE') {
      G.stateTimer -= G.FDT;
      if (G.stateTimer <= 0) G.state = 'PLAYING';
      G.ball.y = 60 + Math.sin(G.animT * 0.004) * 8;
    }

    if (G.state === 'PLAYING') {
      G.updateBall();
      if (G.ball.dead) handlePoint();
    }

    if (G.state === 'POINT') {
      G.stateTimer -= G.FDT;
      var sP = G.lastScorer === 0 ? G.p1 : G.p2;
      sP.anim = 'celebrate';
      if (!sP.grounded) {
        sP.vy += G.GRAVITY;
        sP.y += sP.vy;
        if (sP.y >= G.GROUND_Y) { sP.y = G.GROUND_Y; sP.vy = 0; sP.grounded = true; }
      } else if (G.stateTimer > 600) {
        sP.vy = G.PLYR_JUMP * 0.55;
        sP.grounded = false;
      }
      if (G.stateTimer <= 0) {
        var w = checkWin();
        if (w >= 0) startCelebration(w);
        else resetRound();
      }
    }

    if (G.state === 'CELEBRATION') {
      G.stateTimer += G.FDT;
      var winP = G.celebWinner === 0 ? G.p1 : G.p2;
      winP.anim = 'celebrate';
      if (winP.grounded) { winP.vy = G.PLYR_JUMP * 0.6; winP.grounded = false; }
      if (!winP.grounded) {
        winP.vy += G.GRAVITY;
        winP.y += winP.vy;
        if (winP.y >= G.GROUND_Y) { winP.y = G.GROUND_Y; winP.vy = 0; winP.grounded = true; }
      }
    }

    G.animT += G.FDT;
  }

  /* ==========================================================
     MAIN LOOP
     ========================================================== */
  function loop(ts) {
    var dt = ts - G.lastTS;
    G.lastTS = ts;
    if (dt > 200) dt = 200;
    G.accum += dt;
    while (G.accum >= G.FDT) { tick(); G.accum -= G.FDT; }
    G.render();
    requestAnimationFrame(loop);
  }

  /* ==========================================================
     CLICK → return to intro after celebration
     ========================================================== */
  G.canvasEl.addEventListener('click', function () {
    if (G.state === 'CELEBRATION' && G.stateTimer > 2000) G.returnToIntro();
  });
  G.canvasEl.addEventListener('touchend', function () {
    if (G.state === 'CELEBRATION' && G.stateTimer > 2000) G.returnToIntro();
  });

  /* ==========================================================
     INIT
     ========================================================== */
  function init() {
    G.detectMobile();
    G.setupInput();
    G.setupMobile();
    G.initAudio();
    G.setupGlobalUnlock();

    G.btn1P.addEventListener('click', function () { G.startGame(1); });
    if (G.btn2P) G.btn2P.addEventListener('click', function () { G.startGame(2); });

    G.loadImages(function () {
      G.showSplash();
      requestAnimationFrame(function (ts) { G.lastTS = ts; loop(ts); });
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})(window.G);
