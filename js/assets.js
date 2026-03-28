/* ==========================================================
   ASSETS  — image loading & audio system
   ========================================================== */
(function (G) {
  'use strict';

  var IMG_LIST = {
    'chesunrry':  'assets/img/chesunrry.png',
    'ong-bg':     'assets/img/intro/ong-bg.png',
    'daegyul':    'assets/img/intro/daegyul.png',
    'ogbally':    'assets/img/intro/ogbally.png',
    '1p':         'assets/img/intro/1p.png',
    '2p':         'assets/img/intro/2p.png',
    'copyright':  'assets/img/intro/' + encodeURIComponent('\u00A9 2026 chesunrry. All rights reserved') + '.png',
    'ingame-bg':  'assets/img/ingame/ingame-bg.jpg',
    'net':        'assets/img/ingame/net.png',
    'da-1':       'assets/img/ingame/da/da-1.png',
    'da-2':       'assets/img/ingame/da/da-2.png',
    'ball-1':     'assets/img/ingame/ball/ball-1.png',
    'ball-2':     'assets/img/ingame/ball/ball-2.png',
    'yo-st':      'assets/img/ingame/yo/yo-st.png',
    'yo-wk1':     'assets/img/ingame/yo/yo-wk1.png',
    'yo-wk2':     'assets/img/ingame/yo/yo-wk2.png',
    'yo-jp':      'assets/img/ingame/yo/yo-jp.png',
    'yo-hr1':     'assets/img/ingame/yo/yo-hr1.png',
    'yo-hr2':     'assets/img/ingame/yo/yo-hr2.png',
    'me-st':      'assets/img/ingame/me/me-st.png',
    'me-wk1':     'assets/img/ingame/me/me-wk1.png',
    'me-wk2':     'assets/img/ingame/me/me-wk2.png',
    'me-jp':      'assets/img/ingame/me/me-jp.png',
    'me-hr1':     'assets/img/ingame/me/me-hr1.png',
    'me-hr2':     'assets/img/ingame/me/me-hr2.png'
  };

  G.loadImages = function (done) {
    var imgKeys = Object.keys(IMG_LIST);
    var total = imgKeys.length, loaded = 0;
    imgKeys.forEach(function (k) {
      var i = new Image();
      i.onload = i.onerror = function () {
        loaded++;
        G.loadBar.style.width = (loaded / total * 100) + '%';
        if (loaded >= total) done();
      };
      i.src = IMG_LIST[k];
      G.img[k] = i;
    });
  };

  /* --- Audio --- */

  G.initAudio = function () {
    G.snd.btn   = new Audio('assets/audio/start_button_sound.ogg');
    G.snd.intro = new Audio('assets/audio/start_screen_bgm.wav');
    G.snd.intro.loop = true;
    G.snd.smash = new Audio('assets/audio/smash_sound.mp3');
    G.snd.bgm   = [
      new Audio('assets/audio/ingamebgm-1.mp3'),
      new Audio('assets/audio/ingamebgm-2.mp3'),
      new Audio('assets/audio/ingamebgm-3.mp3')
    ];
    G.snd._cur = null;
  };

  var audioUnlocked = false;

  G.unlockAudio = function () {
    if (audioUnlocked) return;
    audioUnlocked = true;
    document.removeEventListener('click', _globalUnlock);
    document.removeEventListener('keydown', _globalUnlock);
    document.removeEventListener('touchstart', _globalUnlock);
  };

  function _globalUnlock() {
    G.unlockAudio();
    if (G.state === 'INTRO') G.startIntroBgm();
  }

  G.setupGlobalUnlock = function () {
    document.addEventListener('click', _globalUnlock);
    document.addEventListener('keydown', _globalUnlock);
    document.addEventListener('touchstart', _globalUnlock);
  };

  G.play = function (a) { a.currentTime = 0; a.play().catch(function () {}); };

  G.startIntroBgm = function () { G.stopIngameBgm(); G.snd.intro.currentTime = 0; G.snd.intro.play().catch(function () {}); };
  G.stopIntroBgm  = function () { G.snd.intro.pause(); G.snd.intro.currentTime = 0; };

  G.startIngameBgm = function () { G.stopIntroBgm(); nextBgm(); };
  function nextBgm() {
    if (G.snd._cur) { G.snd._cur.pause(); G.snd._cur.onended = null; }
    var b = G.snd.bgm[Math.floor(Math.random() * 3)];
    b.currentTime = 0;
    b.onended = nextBgm;
    b.play().catch(function () {});
    G.snd._cur = b;
  }
  G.stopIngameBgm = function () {
    G.snd.bgm.forEach(function (b) { b.pause(); b.currentTime = 0; b.onended = null; });
    G.snd._cur = null;
  };
  G.stopAllAudio = function () { G.stopIntroBgm(); G.stopIngameBgm(); };
})(window.G);
