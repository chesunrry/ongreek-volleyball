/* ==========================================================
   BALL  — physics, collisions & hit logic
   ========================================================== */
(function (G) {
  'use strict';

  var clamp = G.clamp;

  /* Cache constants as locals — avoids G.xxx property lookups in hot path */
  var GRAVITY    = G.GRAVITY;
  var BALL_R     = G.BALL_R;
  var BALL_HIT   = G.BALL_HIT;
  var MAX_SPD    = G.MAX_BALL_SPD;
  var GW         = G.GW;
  var GROUND_Y   = G.GROUND_Y;
  var NET_X      = G.NET_X;
  var NET_TOP    = G.NET_TOP;
  var NET_HW     = G.NET_HW;
  var PLYR_H     = G.PLYR_H;
  var PLYR_R     = G.PLYR_R;

  G.updateBall = function () {
    var ball = G.ball;
    ball.vy += GRAVITY;
    ball.x += ball.vx;
    ball.y += ball.vy;
    ball.rot += ball.vx * 0.04;

    if (ball.x - BALL_R < 0)       { ball.x = BALL_R;          ball.vx = Math.abs(ball.vx); }
    if (ball.x + BALL_R > GW)      { ball.x = GW - BALL_R;    ball.vx = -Math.abs(ball.vx); }
    if (ball.y - BALL_R < 0)       { ball.y = BALL_R;          ball.vy = Math.abs(ball.vy); }

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

    ballPlayerHit(G.p1, ball);
    ballPlayerHit(G.p2, ball);

    var spd = Math.sqrt(ball.vx * ball.vx + ball.vy * ball.vy);
    if (spd > MAX_SPD) { ball.vx = ball.vx / spd * MAX_SPD; ball.vy = ball.vy / spd * MAX_SPD; }

    if (ball.y + BALL_R >= GROUND_Y) {
      ball.y = GROUND_Y - BALL_R;
      ball.vy = 0; ball.vx = 0;
      ball.dead = true;
    }
  };

  function ballPlayerHit(p, ball) {
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

      var isAI = (G.mode === 1 && p === G.p2);
      if (isAI) G.aiTouches++;

      if (p.spiking) {
        var spikeDir = (p.x < NET_X) ? 1 : -1;
        var distFromNet2 = Math.abs(p.x - NET_X);
        var canClearNet = distFromNet2 < 190 && ball.y < NET_TOP - 15;

        if (canClearNet) {
          G.play(G.snd.smash);
          p.spikeBuffer = 0;
          var spikeSpd = MAX_SPD;
          var variation = (Math.random() - 0.5) * 0.15;
          var horizRatio = 0.82 - clamp(distFromNet2 / 800, 0, 0.22) + variation;
          var vertRatio  = 0.38 + clamp(distFromNet2 / 800, 0, 0.28) - variation * 0.5;
          ball.vx = spikeDir * spikeSpd * horizRatio;
          ball.vy = spikeSpd * vertRatio;
        } else {
          G.play(G.snd.smash);
          p.spikeBuffer = 0;
          var spd2 = MAX_SPD * 0.8;
          ball.vx = spikeDir * spd2 * 0.7;
          ball.vy = -spd2 * 0.7;
        }
      } else if (isAI && G.aiTouches === 1 && p.x > NET_X + 180) {
        G.play(G.snd.smash);
        var setSpd = BALL_HIT * 1.15;
        var setVar = 0.8 + Math.random() * 0.4;
        ball.vx = -setSpd * 0.35 * setVar;
        ball.vy = -setSpd * 1.15;
      } else if (isAI && G.state === 'PLAYING' && p.grounded && G.aiTouches === 0 && ball.vy > 4) {
        G.play(G.snd.smash);
        var serveAngle = Math.random();
        if (serveAngle < 0.4) {
          ball.vx = -MAX_SPD * 0.55;
          ball.vy = -MAX_SPD * 0.85;
        } else if (serveAngle < 0.7) {
          ball.vx = -MAX_SPD * 0.7;
          ball.vy = -MAX_SPD * 0.7;
        } else {
          ball.vx = -MAX_SPD * 0.85;
          ball.vy = -MAX_SPD * 0.5;
        }
      } else {
        G.play(G.snd.smash);
        var spd = BALL_HIT + Math.abs(p.vx) * 0.35 + (p.vy < 0 ? Math.abs(p.vy) * 0.4 : 0);
        spd = Math.min(spd, MAX_SPD);
        ball.vx = nx * spd;
        ball.vy = ny * spd;
        if (ball.vy > 2) ball.vy = -2;
        var towardOwnWall = (p.x < NET_X && ball.vx < 0) || (p.x > NET_X && ball.vx > 0);
        if (towardOwnWall) ball.vx = -ball.vx;
      }
    }
  }
})(window.G);
