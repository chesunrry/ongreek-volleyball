/* ==========================================================
   SCREENS  — splash, intro & game transitions
   ========================================================== */
(function (G) {
  'use strict';

  function fadeSplash() {
    if (G.state !== 'SPLASH') return;
    G.state = 'SPLASH_FADE';
    G.play(G.snd.btn);
    G.splashScreen.classList.add('fade-out');
    setTimeout(function () {
      G.splashScreen.classList.add('hidden');
      showIntro();
    }, G.SPLASH_FADE);
  }

  G.showSplash = function () {
    G.loadingScreen.classList.add('hidden');
    G.splashScreen.classList.remove('hidden');
    G.state = 'SPLASH';

    function onSplashInteract() {
      G.splashScreen.removeEventListener('click', onSplashInteract);
      G.splashScreen.removeEventListener('touchend', onSplashInteract);
      G.unlockAudio();
      fadeSplash();
    }
    G.splashScreen.addEventListener('click', onSplashInteract);
    G.splashScreen.addEventListener('touchend', onSplashInteract);

    setTimeout(function () { fadeSplash(); }, G.SPLASH_DELAY);
  };

  function showIntro() {
    G.introScreen.classList.remove('hidden');
    G.canvasEl.classList.add('hidden');
    G.mobileCtrl.classList.add('hidden');
    G.state = 'INTRO';
    G.menuSel = 0;
    G.updateMenuVisual();
    G.startIntroBgm();
  }

  G.startGame = function (m) {
    G.play(G.snd.btn);
    G.stopIntroBgm();
    G.introScreen.classList.add('hidden');
    G.canvasEl.classList.remove('hidden');
    if (G.isMobile) G.mobileCtrl.classList.remove('hidden');
    G.initGame(m);
  };

  G.returnToIntro = function () {
    G.stopAllAudio();
    G.canvasEl.classList.add('hidden');
    G.mobileCtrl.classList.add('hidden');
    showIntro();
  };
})(window.G);
