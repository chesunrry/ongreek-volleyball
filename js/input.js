/* ==========================================================
   INPUT  — keyboard, touch & menu visual
   ========================================================== */
(function (G) {
  'use strict';

  G.updateMenuVisual = function () {
    G.btn1P.classList.toggle('menu-selected', G.menuSel === 0);
    if (G.btn2P) G.btn2P.classList.toggle('menu-selected', G.menuSel === 1);
  };

  G.setupInput = function () {
    document.addEventListener('keydown', function (e) {
      G.keys[e.code] = true;
      if (['ArrowUp','ArrowDown','ArrowLeft','ArrowRight','Space','Enter'].indexOf(e.code) !== -1) e.preventDefault();

      if (G.state === 'INTRO') {
        if (e.code === 'ArrowUp' || e.code === 'ArrowDown') {
          G.menuSel = G.menuSel === 0 ? 1 : 0;
          G.updateMenuVisual();
        }
        if (e.code === 'Enter' || e.code === 'Space') {
          G.startGame(G.menuSel === 0 ? 1 : 2);
        }
      }

      if (G.state === 'CELEBRATION' && G.stateTimer > 2000) {
        G.returnToIntro();
      }
    });
    document.addEventListener('keyup', function (e) { G.keys[e.code] = false; });
  };

  /* Pre-allocated input objects to avoid GC */
  var _p1inp = { left: false, right: false, up: false, spike: false };
  var _p1inp2 = { left: false, right: false, up: false, spike: false };
  var _p2inp = { left: false, right: false, up: false, spike: false };

  G.p1Input = function () {
    if (G.mode === 2) {
      _p1inp2.left = !!G.keys['KeyD']; _p1inp2.right = !!G.keys['KeyG'];
      _p1inp2.up = !!G.keys['KeyR']; _p1inp2.spike = !!G.keys['KeyZ'];
      return _p1inp2;
    }
    _p1inp.left  = !!(G.keys['ArrowLeft']  || G.touch.left);
    _p1inp.right = !!(G.keys['ArrowRight'] || G.touch.right);
    _p1inp.up    = !!(G.keys['ArrowUp']    || G.touch.up);
    _p1inp.spike = !!(G.keys['Enter']      || G.touch.spike);
    return _p1inp;
  };

  G.p2Input = function () {
    if (G.mode === 2) {
      _p2inp.left = !!G.keys['ArrowLeft']; _p2inp.right = !!G.keys['ArrowRight'];
      _p2inp.up = !!G.keys['ArrowUp']; _p2inp.spike = !!G.keys['Enter'];
      return _p2inp;
    }
    return null;
  };

  /* --- Mobile --- */

  G.detectMobile = function () {
    G.isMobile = ('ontouchstart' in window) || navigator.maxTouchPoints > 0;
    if (G.isMobile) G.ctx.imageSmoothingQuality = 'low';
  };

  G.setupMobile = function () {
    if (!G.isMobile) return;
    var $ = function (id) { return document.getElementById(id); };
    function bind(id, key) {
      var el = $(id);
      el.addEventListener('touchstart', function (e) { e.preventDefault(); G.touch[key] = true; }, { passive: false });
      el.addEventListener('touchend',   function (e) { e.preventDefault(); G.touch[key] = false; }, { passive: false });
      el.addEventListener('touchcancel', function (e) { G.touch[key] = false; });
    }
    bind('m-left',  'left');
    bind('m-right', 'right');
    bind('m-jump',  'up');
    bind('m-spike', 'spike');
  };
})(window.G);
