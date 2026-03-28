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

  G.p1Input = function () {
    if (G.mode === 2) {
      return { left: G.keys['KeyD'], right: G.keys['KeyG'], up: G.keys['KeyR'], spike: G.keys['KeyZ'] };
    }
    return {
      left:  G.keys['ArrowLeft']  || G.touch.left,
      right: G.keys['ArrowRight'] || G.touch.right,
      up:    G.keys['ArrowUp']    || G.touch.up,
      spike: G.keys['Enter']      || G.touch.spike
    };
  };

  G.p2Input = function () {
    if (G.mode === 2) {
      return { left: G.keys['ArrowLeft'], right: G.keys['ArrowRight'], up: G.keys['ArrowUp'], spike: G.keys['Enter'] };
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
