/* ==========================================================
   RENDER  — drawing functions (mobile-optimized)
   ========================================================== */
(function (G) {
  'use strict';

  /* --- Offscreen canvas for static background (bg + net) --- */
  var bgCache = null;
  var cachedNetW = 0, cachedNetH = 0, cachedNetX = 0;

  function buildBgCache() {
    var c = document.createElement('canvas');
    c.width = G.GW; c.height = G.GH;
    var bctx = c.getContext('2d');
    bctx.drawImage(G.img['ingame-bg'], 0, 0, G.GW, G.GH);
    // Pre-render net onto background
    var netImg = G.img['net'];
    if (netImg.complete && netImg.naturalHeight) {
      cachedNetH = G.GROUND_Y - G.NET_TOP;
      cachedNetW = cachedNetH * (netImg.naturalWidth / netImg.naturalHeight);
      cachedNetX = G.NET_X - cachedNetW / 2;
      bctx.drawImage(netImg, cachedNetX, G.NET_TOP, cachedNetW, cachedNetH);
    }
    bgCache = c;
  }

  /* --- Score text cache (only re-render when score changes) --- */
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

  G.render = function () {
    var ctx = G.ctx;
    ctx.clearRect(0, 0, G.GW, G.GH);
    if (G.state === 'SERVE' || G.state === 'PLAYING' || G.state === 'POINT' || G.state === 'CELEBRATION') {
      if (!bgCache) buildBgCache();
      drawGame(ctx);
    }
  };

  function drawGame(ctx) {
    // Cached background (bg + net) in one drawImage call
    ctx.drawImage(bgCache, 0, 0);

    var aFrame = Math.floor(G.animT / G.ANIM_MS) % 2;
    var daKey = (G.state === 'CELEBRATION' || G.state === 'POINT') ? (aFrame === 0 ? 'da-1' : 'da-2') : 'da-2';
    drawSpr(ctx, G.img[daKey], G.NET_X, G.GROUND_Y, G.DA_H, false);

    drawPlayer(ctx, G.p1, aFrame);
    drawPlayer(ctx, G.p2, aFrame);

    // Re-draw net on top of characters (layering)
    var netImg = G.img['net'];
    if (netImg.complete && netImg.naturalHeight) {
      ctx.drawImage(netImg, cachedNetX, G.NET_TOP, cachedNetW, cachedNetH);
    }

    // ball
    var ballKey = (G.state === 'POINT' && G.ball.dead) ? 'ball-2' : 'ball-1';
    drawBall(ctx, G.img[ballKey], G.ball.x, G.ball.y, G.BALL_R, G.ball.rot);

    // score UI — cached offscreen canvas
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
    if (!im || !im.complete || !im.naturalHeight) return;
    var w = h * (im.naturalWidth / im.naturalHeight);
    if (flip) {
      ctx.save();
      ctx.translate(x, y - h);
      ctx.scale(-1, 1);
      ctx.drawImage(im, -w / 2, 0, w, h);
      ctx.restore();
    } else {
      ctx.drawImage(im, x - w / 2, y - h, w, h);
    }
  }

  function drawBall(ctx, im, x, y, r, rot) {
    if (!im || !im.complete) return;
    var s = r * 2;
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(rot);
    ctx.drawImage(im, -r, -r, s, s);
    ctx.restore();
  }
})(window.G);
