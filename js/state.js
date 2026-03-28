/* ==========================================================
   STATE  — shared mutable state & DOM references
   ========================================================== */
(function (G) {
  'use strict';

  /* DOM helpers */
  var $ = function (id) { return document.getElementById(id); };
  G.loadingScreen = $('loading-screen');
  G.loadBar       = $('load-bar');
  G.splashScreen  = $('splash-screen');
  G.introScreen   = $('intro-screen');
  G.canvasEl      = $('game-canvas');
  G.mobileCtrl    = $('mobile-controls');
  G.btn1P         = $('btn-1p');
  G.btn2P         = $('btn-2p');
  G.ctx           = G.canvasEl.getContext('2d');
  G.ctx.imageSmoothingEnabled = true;
  G.ctx.imageSmoothingQuality = 'high';

  /* game state */
  G.state      = 'LOADING';
  G.mode       = 1;
  G.score      = [0, 0];
  G.menuSel    = 0;
  G.lastLoser  = -1;
  G.lastScorer = -1;
  G.stateTimer = 0;
  G.animT      = 0;
  G.isMobile   = false;

  /* objects */
  G.img   = {};
  G.snd   = {};
  G.keys  = {};
  G.touch = { left: false, right: false, up: false, spike: false };

  G.p1 = null;
  G.p2 = null;
  G.ball = { x: 0, y: 0, vx: 0, vy: 0, rot: 0, dead: false };

  /* AI state */
  G.AI_SPD            = G.PLYR_SPD + 2;
  G.aiTouches         = 0;
  G.aiBallWasOnMySide = false;
  G.aiLastHitSide     = -1;

  /* loop state */
  G.lastTS = 0;
  G.accum  = 0;

  /* celebration */
  G.celebWinner = 0;
})(window.G);
