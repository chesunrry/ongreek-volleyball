/* ==========================================================
   BALL  — physics, collisions & hit logic
   ========================================================== */
(function (G) {
  'use strict';

  var clamp = G.clamp;

  G.updateBall = function () {
    var ball = G.ball;
    ball.vy += G.GRAVITY;
    ball.x += ball.vx;
    ball.y += ball.vy;
    ball.rot += ball.vx * 0.04;

    if (ball.x - G.BALL_R < 0)       { ball.x = G.BALL_R;          ball.vx = Math.abs(ball.vx); }
    if (ball.x + G.BALL_R > G.GW)    { ball.x = G.GW - G.BALL_R;  ball.vx = -Math.abs(ball.vx); }
    if (ball.y - G.BALL_R < 0)       { ball.y = G.BALL_R;          ball.vy = Math.abs(ball.vy); }

    // net collision
    if (ball.y + G.BALL_R > G.NET_TOP) {
      var dnet = ball.x - G.NET_X;
      if (Math.abs(dnet) < G.NET_HW + G.BALL_R) {
        if (ball.y - G.BALL_R < G.NET_TOP + 4) {
          ball.y = G.NET_TOP - G.BALL_R;
          ball.vy = -Math.abs(ball.vy) * 0.6;
        } else {
          if (dnet < 0) { ball.x = G.NET_X - G.NET_HW - G.BALL_R; ball.vx = -Math.abs(ball.vx); }
          else           { ball.x = G.NET_X + G.NET_HW + G.BALL_R; ball.vx =  Math.abs(ball.vx); }
        }
      }
    }

    ballPlayerHit(G.p1);
    ballPlayerHit(G.p2);

    var spd = Math.sqrt(ball.vx * ball.vx + ball.vy * ball.vy);
    if (spd > G.MAX_BALL_SPD) { ball.vx = ball.vx / spd * G.MAX_BALL_SPD; ball.vy = ball.vy / spd * G.MAX_BALL_SPD; }

    if (ball.y + G.BALL_R >= G.GROUND_Y) {
      ball.y = G.GROUND_Y - G.BALL_R;
      ball.vy = 0; ball.vx = 0;
      ball.dead = true;
    }
  };

  function ballPlayerHit(p) {
    var ball = G.ball;
    var pcx = p.x;
    var pcy = p.y - G.PLYR_H * 0.45;
    var dx = ball.x - pcx;
    var dy = ball.y - pcy;
    var dist = Math.sqrt(dx * dx + dy * dy);
    var minD = G.BALL_R + G.PLYR_R;
    if (dist < minD && dist > 0) {
      var nx = dx / dist, ny = dy / dist;
      var overlap = minD - dist + 1;
      ball.x += nx * overlap;
      ball.y += ny * overlap;

      var isAI = (G.mode === 1 && p === G.p2);
      if (isAI) G.aiTouches++;

      if (p.spiking) {
        var spikeDir = (p.x < G.NET_X) ? 1 : -1;
        var distFromNet2 = Math.abs(p.x - G.NET_X);
        var canClearNet = distFromNet2 < 190 && ball.y < G.NET_TOP - 15;

        if (canClearNet) {
          G.play(G.snd.smash);
          p.spikeBuffer = 0;
          var spikeSpd = G.MAX_BALL_SPD;
          var variation = (Math.random() - 0.5) * 0.15;
          var horizRatio = 0.82 - clamp(distFromNet2 / 800, 0, 0.22) + variation;
          var vertRatio  = 0.38 + clamp(distFromNet2 / 800, 0, 0.28) - variation * 0.5;
          ball.vx = spikeDir * spikeSpd * horizRatio;
          ball.vy = spikeSpd * vertRatio;
        } else {
          G.play(G.snd.smash);
          p.spikeBuffer = 0;
          var spd2 = G.MAX_BALL_SPD * 0.8;
          ball.vx = spikeDir * spd2 * 0.7;
          ball.vy = -spd2 * 0.7;
        }
      } else if (isAI && G.aiTouches === 1 && p.x > G.NET_X + 180) {
        G.play(G.snd.smash);
        var setSpd = G.BALL_HIT * 1.15;
        var setVar = 0.8 + Math.random() * 0.4;
        ball.vx = -setSpd * 0.35 * setVar;
        ball.vy = -setSpd * 1.15;
      } else if (isAI && G.state === 'PLAYING' && p.grounded && G.aiTouches === 0 && ball.vy > 4) {
        G.play(G.snd.smash);
        var serveAngle = Math.random();
        if (serveAngle < 0.4) {
          ball.vx = -G.MAX_BALL_SPD * 0.55;
          ball.vy = -G.MAX_BALL_SPD * 0.85;
        } else if (serveAngle < 0.7) {
          ball.vx = -G.MAX_BALL_SPD * 0.7;
          ball.vy = -G.MAX_BALL_SPD * 0.7;
        } else {
          ball.vx = -G.MAX_BALL_SPD * 0.85;
          ball.vy = -G.MAX_BALL_SPD * 0.5;
        }
      } else {
        G.play(G.snd.smash);
        var spd = G.BALL_HIT + Math.abs(p.vx) * 0.35 + (p.vy < 0 ? Math.abs(p.vy) * 0.4 : 0);
        spd = Math.min(spd, G.MAX_BALL_SPD);
        ball.vx = nx * spd;
        ball.vy = ny * spd;
        if (ball.vy > 2) ball.vy = -2;
        var towardOwnWall = (p.x < G.NET_X && ball.vx < 0) || (p.x > G.NET_X && ball.vx > 0);
        if (towardOwnWall) ball.vx = -ball.vx;
      }
    }
  }
})(window.G);
