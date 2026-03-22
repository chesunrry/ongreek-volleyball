(function () {
  'use strict';

  /* ==========================================================
     CONSTANTS  (canvas 850×600, ratio ≈ 17:12 matching ingame-bg.png)
     ========================================================== */
  var GW = 850, GH = 600;
  var GROUND_Y = 530;
  var NET_X = 425, NET_TOP = 330, NET_HW = 6;
  var GRAVITY = 0.44;
  var PLYR_SPD = 5, PLYR_JUMP = -11.5;
  var PLYR_R = 52;            // collision radius
  var PLYR_H = 180;           // render height
  var BALL_R = 40;
  var BALL_HIT = 9;
  var MAX_BALL_SPD = 14;
  var DA_H = 340;
  var WIN_SCORE = 5;
  var ANIM_MS = 500;          // 0.5 s alternation
  var SERVE_MS = 1200;
  var POINT_MS = 1800;
  var SPLASH_DELAY = 3000;    // 3 s auto-advance
  var SPLASH_FADE  = 1600;

  /* ==========================================================
     DOM
     ========================================================== */
  var $ = function (id) { return document.getElementById(id); };
  var loadingScreen  = $('loading-screen');
  var loadBar        = $('load-bar');
  var splashScreen   = $('splash-screen');
  var introScreen    = $('intro-screen');
  var canvasEl       = $('game-canvas');
  var mobileCtrl     = $('mobile-controls');
  var btn1P          = $('btn-1p');
  var btn2P          = $('btn-2p');
  var ctx            = canvasEl.getContext('2d');
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = 'high';

  /* ==========================================================
     STATE
     ========================================================== */
  var state = 'LOADING';
  var mode  = 1;
  var score = [0, 0];
  var lastLoser = -1;
  var lastScorer = -1;        // who scored the last point (for set-end jump)
  var stateTimer = 0;
  var animT = 0;
  var isMobile = false;

  /* ==========================================================
     IMAGES  — all paths under assets/
     ========================================================== */
  var img = {};
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

  function loadImages(done) {
    var imgKeys = Object.keys(IMG_LIST);
    var total = imgKeys.length, loaded = 0;
    imgKeys.forEach(function (k) {
      var i = new Image();
      i.onload = i.onerror = function () {
        loaded++;
        loadBar.style.width = (loaded / total * 100) + '%';
        if (loaded >= total) done();
      };
      i.src = IMG_LIST[k];
      img[k] = i;
    });
  }

  /* ==========================================================
     AUDIO  — all paths under assets/audio/
     ========================================================== */
  var snd = {};

  function initAudio() {
    snd.btn   = new Audio('assets/audio/start_button_sound.ogg');
    snd.intro = new Audio('assets/audio/start_screen_bgm.wav');
    snd.intro.loop = true;
    snd.smash = new Audio('assets/audio/smash_sound.mp3');
    snd.bgm   = [
      new Audio('assets/audio/ingamebgm-1.mp3'),
      new Audio('assets/audio/ingamebgm-2.mp3'),
      new Audio('assets/audio/ingamebgm-3.mp3')
    ];
    snd._cur = null;
  }

  function play(a) { a.currentTime = 0; a.play().catch(function(){}); }

  function startIntroBgm()  { stopIngameBgm(); snd.intro.currentTime = 0; snd.intro.play().catch(function(){}); }
  function stopIntroBgm()   { snd.intro.pause(); snd.intro.currentTime = 0; }

  function startIngameBgm() { stopIntroBgm(); nextBgm(); }
  function nextBgm() {
    if (snd._cur) { snd._cur.pause(); snd._cur.onended = null; }
    var b = snd.bgm[Math.floor(Math.random() * 3)];
    b.currentTime = 0;
    b.onended = nextBgm;
    b.play().catch(function(){});
    snd._cur = b;
  }
  function stopIngameBgm() {
    if (snd._cur) { snd._cur.pause(); snd._cur.currentTime = 0; snd._cur.onended = null; snd._cur = null; }
  }
  function stopAllAudio() { stopIntroBgm(); stopIngameBgm(); }

  /* ==========================================================
     INPUT
     ========================================================== */
  var keys = {};
  var touch = { left: false, right: false, up: false, spike: false };

  function setupInput() {
    document.addEventListener('keydown', function (e) {
      keys[e.code] = true;
      if (['ArrowUp','ArrowDown','ArrowLeft','ArrowRight','Space','Enter'].indexOf(e.code) !== -1) e.preventDefault();
    });
    document.addEventListener('keyup', function (e) { keys[e.code] = false; });
  }

  function p1Input() {
    if (mode === 2) {
      return { left: keys['KeyD'], right: keys['KeyG'], up: keys['KeyR'], spike: keys['KeyZ'] };
    }
    return {
      left:  keys['ArrowLeft']  || touch.left,
      right: keys['ArrowRight'] || touch.right,
      up:    keys['ArrowUp']    || touch.up,
      spike: keys['Enter']      || touch.spike
    };
  }
  function p2Input() {
    if (mode === 2) {
      return { left: keys['ArrowLeft'], right: keys['ArrowRight'], up: keys['ArrowUp'], spike: keys['Enter'] };
    }
    return null;
  }

  /* ==========================================================
     MOBILE
     ========================================================== */
  function detectMobile() {
    isMobile = ('ontouchstart' in window) || navigator.maxTouchPoints > 0;
  }

  function setupMobile() {
    if (!isMobile) return;
    function bind(id, key) {
      var el = $(id);
      el.addEventListener('touchstart', function (e) { e.preventDefault(); touch[key] = true; }, { passive: false });
      el.addEventListener('touchend',   function (e) { e.preventDefault(); touch[key] = false; }, { passive: false });
      el.addEventListener('touchcancel', function (e) { touch[key] = false; });
    }
    bind('m-left',  'left');
    bind('m-right', 'right');
    bind('m-jump',  'up');
    bind('m-spike', 'spike');
  }

  /* ==========================================================
     PLAYER OBJECTS
     ========================================================== */
  var P1_HOME = 210, P2_HOME = 640;

  function makePlayer(x, prefix, faceDef) {
    return {
      x: x, y: GROUND_Y,
      vx: 0, vy: 0,
      grounded: true,
      spiking: false,
      prefix: prefix,
      faceDef: faceDef,
      faceDir: faceDef,
      anim: 'stand'
    };
  }

  var p1, p2;

  /* ==========================================================
     BALL
     ========================================================== */
  var ball = { x: 0, y: 0, vx: 0, vy: 0, rot: 0, dead: false };

  /* ==========================================================
     GAME INIT / RESET
     ========================================================== */
  function initGame(m) {
    mode = m;
    score = [0, 0];
    lastLoser = -1;
    lastScorer = -1;
    p1 = makePlayer(P1_HOME, 'yo', 1);
    p2 = makePlayer(P2_HOME, 'me', -1);
    resetRound();
    startIngameBgm();
  }

  function resetRound() {
    p1.x = P1_HOME; p1.y = GROUND_Y; p1.vx = 0; p1.vy = 0; p1.grounded = true; p1.anim = 'stand';
    p2.x = P2_HOME; p2.y = GROUND_Y; p2.vx = 0; p2.vy = 0; p2.grounded = true; p2.anim = 'stand';

    // Ball drops above a random character's head
    var side = Math.random() < 0.5 ? 0 : 1;
    ball.x = (side === 0) ? P1_HOME : P2_HOME;
    ball.y = 60;
    ball.vx = 0; ball.vy = 0; ball.rot = 0; ball.dead = false;

    stateTimer = SERVE_MS;
    state = 'SERVE';
  }

  /* ==========================================================
     UPDATE — PLAYERS
     ========================================================== */
  function updatePlayer(p, inp) {
    if (!inp) return;
    p.vx = 0;
    if (inp.left)  p.vx = -PLYR_SPD;
    if (inp.right) p.vx =  PLYR_SPD;
    if (inp.up && p.grounded) {
      p.vy = PLYR_JUMP;
      p.grounded = false;
    }
    p.spiking = !p.grounded && !!inp.spike;
  }

  function applyPlayerPhysics(p, minX, maxX) {
    if (!p.grounded) {
      p.vy += GRAVITY;
      p.y += p.vy;
      if (p.y >= GROUND_Y) { p.y = GROUND_Y; p.vy = 0; p.grounded = true; }
    }
    p.x += p.vx;
    if (p.x < minX) p.x = minX;
    if (p.x > maxX) p.x = maxX;

    if (!p.grounded)         p.anim = 'jump';
    else if (p.vx !== 0)     p.anim = 'walk';
    else                     p.anim = 'stand';

    if (p.vx > 0)      p.faceDir = 1;
    else if (p.vx < 0) p.faceDir = -1;
    else                p.faceDir = p.faceDef;
  }

  /* ==========================================================
     AI  — predict ball landing, move under it, jump to hit
     ========================================================== */
  function predictBallX() {
    // simulate ball forward to find where it will be at player's height
    var bx = ball.x, by = ball.y, bvx = ball.vx, bvy = ball.vy;
    for (var t = 0; t < 300; t++) {
      bvy += GRAVITY;
      bx += bvx;
      by += bvy;
      if (bx < BALL_R) { bx = BALL_R; bvx = -bvx; }
      if (bx > GW - BALL_R) { bx = GW - BALL_R; bvx = -bvx; }
      if (by < BALL_R) { by = BALL_R; bvy = Math.abs(bvy); }
      // net
      if (by + BALL_R > NET_TOP && Math.abs(bx - NET_X) < NET_HW + BALL_R) {
        if (bx < NET_X) { bx = NET_X - NET_HW - BALL_R; bvx = -Math.abs(bvx); }
        else { bx = NET_X + NET_HW + BALL_R; bvx = Math.abs(bvx); }
      }
      // reached player height area or ground
      if (by >= GROUND_Y - PLYR_H * 0.6) return bx;
    }
    return bx;
  }

  function updateAI(p) {
    var minAIX = NET_X + NET_HW + PLYR_R;
    var maxAIX = GW - PLYR_R;
    var targetX = P2_HOME;
    var shouldJump = false;

    // Always track the ball when it's heading right or already on AI's side
    var ballComingRight = ball.vx > 0;
    var ballOnMySide = ball.x > NET_X;

    if (ballOnMySide || ballComingRight) {
      var landX = predictBallX();
      if (landX > NET_X) {
        // Stand to the RIGHT of the ball so collision angle pushes ball left (over net)
        targetX = clamp(landX + 45, minAIX, maxAIX);
      }
    }

    // Move to target
    var dx = targetX - p.x;
    p.vx = 0;
    if (dx > 4)       p.vx =  PLYR_SPD;
    else if (dx < -4) p.vx = -PLYR_SPD;

    // Jump decision: ball is on AI side, close enough, and above
    var headY = p.y - PLYR_H * 0.5;
    var distX = Math.abs(p.x - ball.x);

    if (p.grounded && ball.x > NET_X) {
      var ballClose = distX < PLYR_R + BALL_R + 80;
      var ballAbove = ball.y < p.y;
      var ballDescending = ball.vy > 0;
      // Jump when ball is nearby, descending, and above ground
      if (ballClose && ballAbove && ballDescending) {
        shouldJump = true;
      }
      // Jump if ball is close overhead
      if (distX < PLYR_R + BALL_R + 50 && ball.y < headY + 120 && ball.y > 0) {
        shouldJump = true;
      }
    }

    if (shouldJump && p.grounded) {
      p.vy = PLYR_JUMP;
      p.grounded = false;
    }

    // AI spikes randomly (not during SERVE) when airborne and ball is within reach
    p.spiking = false;
    if (!p.grounded && state === 'PLAYING') {
      var sDx = Math.abs(p.x - ball.x);
      var sHead = p.y - PLYR_H * 0.45;
      var sDy = ball.y - sHead;
      if (sDx < PLYR_R + BALL_R + 20 && Math.abs(sDy) < PLYR_R + BALL_R + 20) {
        if (Math.random() < 0.35) p.spiking = true;
      }
    }
  }

  function clamp(v, mn, mx) { return v < mn ? mn : v > mx ? mx : v; }

  /* ==========================================================
     BALL PHYSICS
     ========================================================== */
  function updateBall() {
    ball.vy += GRAVITY;
    ball.x += ball.vx;
    ball.y += ball.vy;
    ball.rot += ball.vx * 0.04;

    if (ball.x - BALL_R < 0)       { ball.x = BALL_R;       ball.vx = Math.abs(ball.vx); }
    if (ball.x + BALL_R > GW)      { ball.x = GW - BALL_R;  ball.vx = -Math.abs(ball.vx); }
    if (ball.y - BALL_R < 0)       { ball.y = BALL_R;       ball.vy = Math.abs(ball.vy); }

    // net collision
    if (ball.y + BALL_R > NET_TOP) {
      var dnet = ball.x - NET_X;
      if (Math.abs(dnet) < NET_HW + BALL_R) {
        if (ball.y - BALL_R < NET_TOP + 4) {
          ball.y = NET_TOP - BALL_R;
          ball.vy = -Math.abs(ball.vy) * 0.6;
        } else {
          if (dnet < 0) { ball.x = NET_X - NET_HW - BALL_R; ball.vx = -Math.abs(ball.vx); }
          else           { ball.x = NET_X + NET_HW + BALL_R; ball.vx =  Math.abs(ball.vx); }
        }
      }
    }

    ballPlayerHit(p1);
    ballPlayerHit(p2);

    var spd = Math.sqrt(ball.vx * ball.vx + ball.vy * ball.vy);
    if (spd > MAX_BALL_SPD) { ball.vx = ball.vx / spd * MAX_BALL_SPD; ball.vy = ball.vy / spd * MAX_BALL_SPD; }

    if (ball.y + BALL_R >= GROUND_Y) {
      ball.y = GROUND_Y - BALL_R;
      ball.vy = 0; ball.vx = 0;
      ball.dead = true;
    }
  }

  function ballPlayerHit(p) {
    var pcx = p.x;
    var pcy = p.y - PLYR_H * 0.45;
    var dx = ball.x - pcx;
    var dy = ball.y - pcy;
    var dist = Math.sqrt(dx * dx + dy * dy);
    var minD = BALL_R + PLYR_R;
    if (dist < minD && dist > 0) {
      var nx = dx / dist, ny = dy / dist;
      var overlap = minD - dist + 1;
      ball.x += nx * overlap;
      ball.y += ny * overlap;

      if (p.spiking) {
        // Spike: strong downward hit toward opponent's side
        play(snd.smash);
        var spikeDir = (p.x < NET_X) ? 1 : -1;  // toward opponent
        var spikeSpd = MAX_BALL_SPD;
        ball.vx = spikeDir * spikeSpd * 0.75;
        ball.vy = spikeSpd * 0.65;
      } else {
        play(snd.smash);
        var spd = BALL_HIT + Math.abs(p.vx) * 0.35 + (p.vy < 0 ? Math.abs(p.vy) * 0.4 : 0);
        spd = Math.min(spd, MAX_BALL_SPD);
        ball.vx = nx * spd;
        ball.vy = ny * spd;
        if (ball.vy > 2) ball.vy = -2;
      }
    }
  }

  /* ==========================================================
     SCORE / STATE TRANSITIONS
     ========================================================== */
  function handlePoint() {
    var side = ball.x < NET_X ? 0 : 1;
    var scorer = side === 0 ? 1 : 0;
    score[scorer]++;
    lastLoser = side;
    lastScorer = scorer;
    stateTimer = POINT_MS;
    state = 'POINT';

    // Set-end jump: the scoring player does a jump
    var winP = scorer === 0 ? p1 : p2;
    winP.anim = 'celebrate';
    if (winP.grounded) { winP.vy = PLYR_JUMP * 0.55; winP.grounded = false; }
  }

  function checkWin() {
    if (score[0] >= WIN_SCORE) return 0;
    if (score[1] >= WIN_SCORE) return 1;
    return -1;
  }

  /* ==========================================================
     MAIN UPDATE
     ========================================================== */
  var lastTS = 0;
  var FDT = 1000 / 60;
  var accum = 0;

  function tick() {
    if (state === 'SERVE' || state === 'PLAYING') {
      updatePlayer(p1, p1Input());
      if (mode === 1) updateAI(p2); else updatePlayer(p2, p2Input());
      applyPlayerPhysics(p1, PLYR_R, NET_X - NET_HW - PLYR_R);
      applyPlayerPhysics(p2, NET_X + NET_HW + PLYR_R, GW - PLYR_R);
    }

    if (state === 'SERVE') {
      stateTimer -= FDT;
      if (stateTimer <= 0) state = 'PLAYING';
      ball.y = 60 + Math.sin(animT * 0.004) * 8;
    }

    if (state === 'PLAYING') {
      updateBall();
      if (ball.dead) handlePoint();
    }

    // POINT: scorer celebrates with jump, then next round or game-end
    if (state === 'POINT') {
      stateTimer -= FDT;
      var sP = lastScorer === 0 ? p1 : p2;
      sP.anim = 'celebrate';
      if (!sP.grounded) {
        sP.vy += GRAVITY;
        sP.y += sP.vy;
        if (sP.y >= GROUND_Y) { sP.y = GROUND_Y; sP.vy = 0; sP.grounded = true; }
      } else if (stateTimer > 600) {
        sP.vy = PLYR_JUMP * 0.55;
        sP.grounded = false;
      }
      if (stateTimer <= 0) {
        var w = checkWin();
        if (w >= 0) startCelebration(w);
        else resetRound();
      }
    }

    if (state === 'CELEBRATION') {
      stateTimer += FDT;
      var winP = celebWinner === 0 ? p1 : p2;
      winP.anim = 'celebrate';
      if (winP.grounded) { winP.vy = PLYR_JUMP * 0.6; winP.grounded = false; }
      if (!winP.grounded) {
        winP.vy += GRAVITY;
        winP.y += winP.vy;
        if (winP.y >= GROUND_Y) { winP.y = GROUND_Y; winP.vy = 0; winP.grounded = true; }
      }
    }

    animT += FDT;
  }

  var celebWinner = 0;
  function startCelebration(w) {
    state = 'CELEBRATION';
    celebWinner = w;
    stateTimer = 0;
    var winP = w === 0 ? p1 : p2;
    winP.anim = 'celebrate';
    var loseP = w === 0 ? p2 : p1;
    loseP.anim = 'stand'; loseP.vx = 0;
  }

  /* ==========================================================
     RENDER
     ========================================================== */
  function render() {
    ctx.clearRect(0, 0, GW, GH);
    if (state === 'SERVE' || state === 'PLAYING' || state === 'POINT' || state === 'CELEBRATION') {
      drawGame();
    }
  }

  function drawGame() {
    ctx.drawImage(img['ingame-bg'], 0, 0, GW, GH);

    // DA (squirrel referee — centered behind net, large)
    var aFrame = Math.floor(animT / ANIM_MS) % 2;
    var daKey = (state === 'CELEBRATION' || state === 'POINT') ? (aFrame === 0 ? 'da-1' : 'da-2') : 'da-2';
    drawSpr(img[daKey], NET_X, GROUND_Y, DA_H, false);

    drawPlayer(p1);
    drawPlayer(p2);

    // net
    var netImg = img['net'];
    if (netImg.complete && netImg.naturalHeight) {
      var netH = GROUND_Y - NET_TOP;
      var netW = netH * (netImg.naturalWidth / netImg.naturalHeight);
      ctx.drawImage(netImg, NET_X - netW / 2, NET_TOP, netW, netH);
    }

    // ball
    var ballKey = (state === 'POINT' && ball.dead) ? 'ball-2' : 'ball-1';
    drawBall(img[ballKey], ball.x, ball.y, BALL_R, ball.rot);

    // score UI
    ctx.save();
    ctx.font = 'bold 32px "Arial Black", sans-serif';
    ctx.textAlign = 'center';
    ctx.lineWidth = 4;
    ctx.strokeStyle = '#000';
    ctx.fillStyle = '#fff';
    var stxt = score[0] + '  -  ' + score[1];
    ctx.strokeText(stxt, GW / 2, 40);
    ctx.fillText(stxt, GW / 2, 40);

    if (state === 'CELEBRATION') {
      ctx.font = 'bold 78px sans-serif';
      ctx.lineWidth = 6;
      var wt = celebWinner === 0 ? 'YOGOM WIN!' : 'MEH-NEY WIN!';
      ctx.fillStyle = celebWinner === 0 ? '#80b8e4' : '#ffde7c';
      ctx.strokeText(wt, GW / 2, 150);
      ctx.fillText(wt, GW / 2, 150);

      if (stateTimer > 2000) {
        ctx.font = '16px sans-serif';
        ctx.fillStyle = 'rgba(255,255,255,0.8)';
        ctx.fillText('\ud074\ub9ad\ud558\uc5ec \ub3cc\uc544\uac00\uae30', GW / 2, GH - 24);
      }
    }
    ctx.restore();
  }

  function drawPlayer(p) {
    var aFrame = Math.floor(animT / ANIM_MS) % 2;
    var key;
    switch (p.anim) {
      case 'walk':      key = p.prefix + '-wk' + (aFrame + 1); break;
      case 'jump':      key = p.prefix + '-jp'; break;
      case 'celebrate': key = p.prefix + '-hr' + (aFrame + 1); break;
      default:          key = p.prefix + '-st';
    }
    var flip = (p.faceDir !== p.faceDef);
    drawSpr(img[key], p.x, p.y, PLYR_H, flip);
  }

  function drawSpr(im, x, y, h, flip) {
    if (!im || !im.complete || !im.naturalHeight) return;
    var w = h * (im.naturalWidth / im.naturalHeight);
    ctx.save();
    if (flip) {
      ctx.translate(x, y - h);
      ctx.scale(-1, 1);
      ctx.drawImage(im, -w / 2, 0, w, h);
    } else {
      ctx.drawImage(im, x - w / 2, y - h, w, h);
    }
    ctx.restore();
  }

  function drawBall(im, x, y, r, rot) {
    if (!im || !im.complete) return;
    var s = r * 2;
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(rot);
    ctx.drawImage(im, -r, -r, s, s);
    ctx.restore();
  }

  /* ==========================================================
     SCREEN TRANSITIONS
     ========================================================== */
  function showSplash() {
    loadingScreen.classList.add('hidden');
    splashScreen.classList.remove('hidden');
    state = 'SPLASH';

    // Auto-advance after 3 seconds
    setTimeout(function () {
      if (state !== 'SPLASH') return;
      state = 'SPLASH_FADE';
      play(snd.btn);
      splashScreen.classList.add('fade-out');
      setTimeout(function () {
        splashScreen.classList.add('hidden');
        showIntro();
      }, SPLASH_FADE);
    }, SPLASH_DELAY);
  }

  function showIntro() {
    introScreen.classList.remove('hidden');
    canvasEl.classList.add('hidden');
    mobileCtrl.classList.add('hidden');
    state = 'INTRO';
    startIntroBgm();
  }

  function startGame(m) {
    play(snd.btn);
    stopIntroBgm();
    introScreen.classList.add('hidden');
    canvasEl.classList.remove('hidden');
    if (isMobile) mobileCtrl.classList.remove('hidden');
    initGame(m);
  }

  function returnToIntro() {
    stopAllAudio();
    canvasEl.classList.add('hidden');
    mobileCtrl.classList.add('hidden');
    showIntro();
  }

  /* ==========================================================
     MAIN LOOP
     ========================================================== */
  function loop(ts) {
    var dt = ts - lastTS;
    lastTS = ts;
    if (dt > 200) dt = 200;
    accum += dt;
    while (accum >= FDT) { tick(); accum -= FDT; }
    render();
    requestAnimationFrame(loop);
  }

  /* ==========================================================
     CLICK → return to intro after celebration
     ========================================================== */
  canvasEl.addEventListener('click', function () {
    if (state === 'CELEBRATION' && stateTimer > 2000) returnToIntro();
  });
  canvasEl.addEventListener('touchend', function () {
    if (state === 'CELEBRATION' && stateTimer > 2000) returnToIntro();
  });

  /* ==========================================================
     INIT
     ========================================================== */
  function init() {
    detectMobile();
    setupInput();
    setupMobile();
    initAudio();

    btn1P.addEventListener('click', function () { startGame(1); });
    if (btn2P) btn2P.addEventListener('click', function () { startGame(2); });

    loadImages(function () {
      showSplash();
      requestAnimationFrame(function (ts) { lastTS = ts; loop(ts); });
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
