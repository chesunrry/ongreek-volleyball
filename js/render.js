/* ==========================================================
   RENDER  — drawing functions
   ========================================================== */
(function (G) {
  'use strict';

  G.render = function () {
    G.ctx.clearRect(0, 0, G.GW, G.GH);
    if (G.state === 'SERVE' || G.state === 'PLAYING' || G.state === 'POINT' || G.state === 'CELEBRATION') {
      drawGame();
    }
  };

  function drawGame() {
    var ctx = G.ctx;
    ctx.drawImage(G.img['ingame-bg'], 0, 0, G.GW, G.GH);

    var aFrame = Math.floor(G.animT / G.ANIM_MS) % 2;
    var daKey = (G.state === 'CELEBRATION' || G.state === 'POINT') ? (aFrame === 0 ? 'da-1' : 'da-2') : 'da-2';
    drawSpr(G.img[daKey], G.NET_X, G.GROUND_Y, G.DA_H, false);

    drawPlayer(G.p1);
    drawPlayer(G.p2);

    // net
    var netImg = G.img['net'];
    if (netImg.complete && netImg.naturalHeight) {
      var netH = G.GROUND_Y - G.NET_TOP;
      var netW = netH * (netImg.naturalWidth / netImg.naturalHeight);
      ctx.drawImage(netImg, G.NET_X - netW / 2, G.NET_TOP, netW, netH);
    }

    // ball
    var ballKey = (G.state === 'POINT' && G.ball.dead) ? 'ball-2' : 'ball-1';
    drawBall(G.img[ballKey], G.ball.x, G.ball.y, G.BALL_R, G.ball.rot);

    // score UI
    ctx.save();
    ctx.font = 'bold 32px "Arial Black", sans-serif';
    ctx.textAlign = 'center';
    ctx.lineWidth = 4;
    ctx.strokeStyle = '#000';
    ctx.fillStyle = '#fff';
    var stxt = G.score[0] + '  -  ' + G.score[1];
    ctx.strokeText(stxt, G.GW / 2, 40);
    ctx.fillText(stxt, G.GW / 2, 40);

    if (G.state === 'CELEBRATION') {
      ctx.font = 'bold 78px sans-serif';
      ctx.lineWidth = 6;
      var wt = G.celebWinner === 0 ? 'YOGOM WIN!' : 'MEH-NEY WIN!';
      ctx.fillStyle = G.celebWinner === 0 ? '#80b8e4' : '#ffde7c';
      ctx.strokeText(wt, G.GW / 2, 150);
      ctx.fillText(wt, G.GW / 2, 150);

      if (G.stateTimer > 2000) {
        ctx.font = '16px sans-serif';
        ctx.fillStyle = 'rgba(255,255,255,0.8)';
        ctx.fillText('\ud074\ub9ad \ub610\ub294 \uc544\ubb34 \ud0a4\ub97c \ub20c\ub7ec \ub3cc\uc544\uac00\uae30', G.GW / 2, G.GH - 24);
      }
    }
    ctx.restore();
  }

  function drawPlayer(p) {
    var aFrame = Math.floor(G.animT / G.ANIM_MS) % 2;
    var key;
    switch (p.anim) {
      case 'walk':      key = p.prefix + '-wk' + (aFrame + 1); break;
      case 'jump':      key = p.prefix + '-jp'; break;
      case 'celebrate': key = p.prefix + '-hr' + (aFrame + 1); break;
      default:          key = p.prefix + '-st';
    }
    var flip = (p.faceDir !== p.faceDef);
    drawSpr(G.img[key], p.x, p.y, G.PLYR_H, flip);
  }

  function drawSpr(im, x, y, h, flip) {
    if (!im || !im.complete || !im.naturalHeight) return;
    var w = h * (im.naturalWidth / im.naturalHeight);
    var ctx = G.ctx;
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
    var ctx = G.ctx;
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(rot);
    ctx.drawImage(im, -r, -r, s, s);
    ctx.restore();
  }
})(window.G);
