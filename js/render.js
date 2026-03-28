/* ==========================================================
   RENDER  — drawing functions (mobile-optimized)
   ========================================================== */
(function (G) {
  'use strict';

  /* --- Pre-scaled sprite cache --- */
  var sprCache = {};  // key → { canvas, w, h }

  function getScaled(im, h) {
    if (!im || !im.complete || !im.naturalHeight) return null;
    var key = im.src + '|' + h;
    if (sprCache[key]) return sprCache[key];
    var w = Math.round(h * (im.naturalWidth / im.naturalHeight));
    var c = document.createElement('canvas');
    c.width = w; c.height = h;
    c.getContext('2d').drawImage(im, 0, 0, w, h);
    sprCache[key] = { canvas: c, w: w, h: h };
    return sprCache[key];
  }

  /* Also pre-scale flipped versions */
  function getScaledFlip(im, h) {
    if (!im || !im.complete || !im.naturalHeight) return null;
    var key = im.src + '|' + h + '|flip';
    if (sprCache[key]) return sprCache[key];
    var w = Math.round(h * (im.naturalWidth / im.naturalHeight));
    var c = document.createElement('canvas');
    c.width = w; c.height = h;
    var fc = c.getContext('2d');
    fc.translate(w, 0);
    fc.scale(-1, 1);
    fc.drawImage(im, 0, 0, w, h);
    sprCache[key] = { canvas: c, w: w, h: h };
    return sprCache[key];
  }

  /* Square-scaled cache for ball (original draws ball as square) */
  function getScaledSquare(im, size) {
    if (!im || !im.complete || !im.naturalHeight) return null;
    var key = im.src + '|sq' + size;
    if (sprCache[key]) return sprCache[key];
    var c = document.createElement('canvas');
    c.width = size; c.height = size;
    c.getContext('2d').drawImage(im, 0, 0, size, size);
    sprCache[key] = { canvas: c, w: size, h: size };
    return sprCache[key];
  }

  /* --- Offscreen canvas for static background (bg + net) --- */
  var bgCache = null;

  function buildBgCache() {
    var cw = G.canvasEl.width, ch = G.canvasEl.height;
    var c = document.createElement('canvas');
    c.width = cw; c.height = ch;
    var bctx = c.getContext('2d');
    bctx.drawImage(G.img['ingame-bg'], 0, 0, cw, ch);
    // Pre-render net
    var netImg = G.img['net'];
    if (netImg.complete && netImg.naturalHeight) {
      var sx = cw / G.GW, sy = ch / G.GH;
      var netH = (G.GROUND_Y - G.NET_TOP) * sy;
      var netW = netH * (netImg.naturalWidth / netImg.naturalHeight);
      var netX = G.NET_X * sx - netW / 2;
      bctx.drawImage(netImg, netX, G.NET_TOP * sy, netW, netH);
    }
    bgCache = c;
  }

  /* --- Score text cache --- */
  var scoreCache = null;
  var scoreCacheKey = '';

  function buildScoreCache(s0, s1) {
    var key = s0 + '-' + s1;
    if (scoreCache && scoreCacheKey === key) return;
    scoreCacheKey = key;
    if (!scoreCache) {
      scoreCache = document.createElement('canvas');
      scoreCache.width = 200; scoreCache.height = 50;
    }
    var sc = scoreCache.getContext('2d');
    sc.clearRect(0, 0, 200, 50);
    sc.font = 'bold 32px "Arial Black", sans-serif';
    sc.textAlign = 'center';
    sc.lineWidth = 4;
    sc.strokeStyle = '#000';
    sc.fillStyle = '#fff';
    var stxt = s0 + '  -  ' + s1;
    sc.strokeText(stxt, 100, 36);
    sc.fillText(stxt, 100, 36);
  }

  /* Pre-build sprite caches after images loaded */
  G.prebuildSpriteCache = function () {
    var keys = Object.keys(G.img);
    for (var i = 0; i < keys.length; i++) {
      var k = keys[i];
      var im = G.img[k];
      if (!im.complete || !im.naturalHeight) continue;
      // Determine render height per sprite type
      var h = 0;
      if (k.indexOf('da-') === 0) h = G.DA_H;
      else if (k.indexOf('yo-') === 0 || k.indexOf('me-') === 0) h = G.PLYR_H;
      else if (k.indexOf('ball-') === 0) h = G.BALL_R * 2;
      if (h > 0) {
        getScaled(im, h);
        getScaledFlip(im, h);
      }
    }
  };

  G.render = function () {
    var ctx = G.ctx;
    ctx.clearRect(0, 0, G.GW, G.GH);
    if (G.state === 'SERVE' || G.state === 'PLAYING' || G.state === 'POINT' || G.state === 'CELEBRATION') {
      if (!bgCache) buildBgCache();
      drawGame(ctx);
    }
  };

  function drawGame(ctx) {
    // Draw bgCache at native pixel resolution (no transform scaling)
    ctx.save();
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.drawImage(bgCache, 0, 0);
    ctx.restore();

    var aFrame = Math.floor(G.animT / G.ANIM_MS) % 2;
    var daKey = (G.state === 'CELEBRATION' || G.state === 'POINT') ? (aFrame === 0 ? 'da-1' : 'da-2') : 'da-2';
    drawSpr(ctx, G.img[daKey], G.NET_X, G.GROUND_Y, G.DA_H, false);

    drawPlayer(ctx, G.p1, aFrame);
    drawPlayer(ctx, G.p2, aFrame);

    // Net on top of characters
    var netImg = G.img['net'];
    if (netImg.complete && netImg.naturalHeight) {
      var netH = G.GROUND_Y - G.NET_TOP;
      var netW = netH * (netImg.naturalWidth / netImg.naturalHeight);
      ctx.drawImage(netImg, G.NET_X - netW / 2, G.NET_TOP, netW, netH);
    }

    // ball
    var ballKey = (G.state === 'POINT' && G.ball.dead) ? 'ball-2' : 'ball-1';
    drawBall(ctx, G.img[ballKey], G.ball.x, G.ball.y, G.BALL_R, G.ball.rot);

    // score
    buildScoreCache(G.score[0], G.score[1]);
    ctx.drawImage(scoreCache, G.GW / 2 - 100, 0);

    if (G.state === 'CELEBRATION') {
      ctx.save();
      ctx.font = 'bold 78px sans-serif';
      ctx.textAlign = 'center';
      ctx.lineWidth = 6;
      ctx.strokeStyle = '#000';
      var wt = G.celebWinner === 0 ? 'YOGOM WIN!' : 'MEH-NEY WIN!';
      ctx.fillStyle = G.celebWinner === 0 ? '#80b8e4' : '#ffde7c';
      ctx.strokeText(wt, G.GW / 2, 150);
      ctx.fillText(wt, G.GW / 2, 150);

      if (G.stateTimer > 2000) {
        ctx.font = '16px sans-serif';
        ctx.fillStyle = 'rgba(255,255,255,0.8)';
        ctx.fillText('\ud074\ub9ad \ub610\ub294 \uc544\ubb34 \ud0a4\ub97c \ub20c\ub7ec \ub3cc\uc544\uac00\uae30', G.GW / 2, G.GH - 24);
      }
      ctx.restore();
    }
  }

  function drawPlayer(ctx, p, aFrame) {
    var key;
    switch (p.anim) {
      case 'walk':      key = p.prefix + '-wk' + (aFrame + 1); break;
      case 'jump':      key = p.prefix + '-jp'; break;
      case 'celebrate': key = p.prefix + '-hr' + (aFrame + 1); break;
      default:          key = p.prefix + '-st';
    }
    var flip = (p.faceDir !== p.faceDef);
    drawSpr(ctx, G.img[key], p.x, p.y, G.PLYR_H, flip);
  }

  function drawSpr(ctx, im, x, y, h, flip) {
    var cached = flip ? getScaledFlip(im, h) : getScaled(im, h);
    if (!cached) return;
    ctx.drawImage(cached.canvas, x - cached.w / 2, y - cached.h);
  }

  function drawBall(ctx, im, x, y, r, rot) {
    if (!im || !im.complete) return;
    var s = r * 2;
    var cached = getScaledSquare(im, s);
    if (cached && rot === 0) {
      ctx.drawImage(cached.canvas, x - r, y - r);
    } else if (cached) {
      ctx.save();
      ctx.translate(x, y);
      ctx.rotate(rot);
      ctx.drawImage(cached.canvas, -r, -r);
      ctx.restore();
    }
  }
})(window.G);
