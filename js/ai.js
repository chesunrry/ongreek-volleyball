/* ==========================================================
   AI  — phase-based strategy with prediction, mirroring, blocking
   ========================================================== */
(function (G) {
  'use strict';

  function clamp(v, mn, mx) { return v < mn ? mn : v > mx ? mx : v; }
  G.clamp = clamp;

  /* --- Full ball simulation returning {x, y, t} at target Y --- */
  var _simCache = { bx: 0, by: 0, bvx: 0, bvy: 0, tgt: 0, res: null };

  function simBallToY(targetY) {
    // Cache: skip re-simulation if ball state unchanged
    var c = _simCache;
    if (c.res && c.bx === G.ball.x && c.by === G.ball.y &&
        c.bvx === G.ball.vx && c.bvy === G.ball.vy && c.tgt === targetY) {
      return c.res;
    }
    var bx = G.ball.x, by = G.ball.y, bvx = G.ball.vx, bvy = G.ball.vy;
    for (var t = 0; t < 180; t++) {
      bvy += G.GRAVITY;
      bx += bvx; by += bvy;
      if (bx < G.BALL_R) { bx = G.BALL_R; bvx = -bvx; }
      if (bx > G.GW - G.BALL_R) { bx = G.GW - G.BALL_R; bvx = -bvx; }
      if (by < G.BALL_R) { by = G.BALL_R; bvy = Math.abs(bvy); }
      if (by + G.BALL_R > G.NET_TOP && Math.abs(bx - G.NET_X) < G.NET_HW + G.BALL_R) {
        if (bx < G.NET_X) { bx = G.NET_X - G.NET_HW - G.BALL_R; bvx = -Math.abs(bvx); }
        else { bx = G.NET_X + G.NET_HW + G.BALL_R; bvx = Math.abs(bvx); }
      }
      if (by >= targetY) break;
    }
    var res = { x: bx, y: by, t: t };
    c.bx = G.ball.x; c.by = G.ball.y; c.bvx = G.ball.vx; c.bvy = G.ball.vy;
    c.tgt = targetY; c.res = res;
    return res;
  }

  G.updateAI = function (p) {
    var minAIX = G.NET_X + G.NET_HW + G.PLYR_R;
    var maxAIX = G.GW - G.PLYR_R;
    var targetX = G.P2_HOME;
    var shouldJump = false;
    var ball = G.ball;

    var ballOnMySide = ball.x > G.NET_X;
    var ballComingRight = ball.vx > 0;
    var ballDangerous = ballOnMySide || (ballComingRight && ball.x > G.NET_X - 200);

    if (!ballOnMySide && G.aiBallWasOnMySide) G.aiTouches = 0;
    G.aiBallWasOnMySide = ballOnMySide;

    var landPred = simBallToY(G.GROUND_Y - G.PLYR_H * 0.6);
    var landX = landPred.x;
    var headY = p.y - G.PLYR_H * 0.5;
    var headPred = simBallToY(headY + 50);
    var distFromNet = p.x - G.NET_X;

    /* --- PHASE DETECTION --- */
    var phase = 'DEFENSE';

    if (G.state === 'SERVE' && ball.x > G.NET_X) {
      phase = 'SERVE';
    } else if (ballOnMySide && G.aiTouches === 0 && ball.x > G.NET_X + 220) {
      phase = 'RECEIVE';
    } else if (ballOnMySide && G.aiTouches >= 1 && ball.vy < 0) {
      phase = 'APPROACH';
    } else if (ballOnMySide && landX > G.NET_X) {
      phase = 'ATTACK';
    } else if (!ballOnMySide && G.p1.y < G.GROUND_Y - 30) {
      phase = 'BLOCK';
    } else {
      phase = 'DEFENSE';
    }

    /* --- POSITIONING BY PHASE --- */
    switch (phase) {
      case 'SERVE':
        targetX = clamp(ball.x + 30, minAIX, maxAIX);
        break;

      case 'RECEIVE':
        targetX = clamp(landX + 35, minAIX, maxAIX);
        break;

      case 'APPROACH':
        targetX = clamp(G.NET_X + 70, minAIX, maxAIX);
        break;

      case 'ATTACK':
        if (distFromNet < 180 && ball.y < G.NET_TOP) {
          targetX = clamp(landX + 20, minAIX, maxAIX);
        } else {
          var atkTarget = Math.min(landX + 30, G.NET_X + 150);
          targetX = clamp(atkTarget, minAIX, maxAIX);
        }
        break;

      case 'BLOCK':
        if (G.p1.x > G.NET_X - 150) {
          targetX = minAIX + 10;
        } else {
          phase = 'DEFENSE';
          targetX = clamp(G.GW - G.p1.x, minAIX, maxAIX);
        }
        break;

      case 'DEFENSE':
      default:
        var mirrorX = G.GW - G.p1.x;
        if (ballDangerous && landX > G.NET_X) {
          targetX = clamp(landX * 0.6 + mirrorX * 0.4 + 20, minAIX, maxAIX);
        } else {
          targetX = clamp(mirrorX * 0.7 + (G.NET_X + (G.GW - G.NET_X) * 0.4) * 0.3, minAIX, maxAIX);
        }
        break;
    }

    /* --- MOVEMENT --- */
    var dx = targetX - p.x;
    p.vx = 0;
    if (dx > 3)       p.vx =  G.AI_SPD;
    else if (dx < -3) p.vx = -G.AI_SPD;

    /* --- JUMP DECISION --- */
    var distX = Math.abs(p.x - ball.x);

    if (p.grounded && ballOnMySide) {
      var predDistX = Math.abs(p.x - headPred.x);

      if (phase === 'BLOCK' && p.x < minAIX + 40) {
        if (ball.vx > 3 && ball.x < G.NET_X + 100) shouldJump = true;
      }

      if (phase === 'APPROACH' && distX < G.PLYR_R + G.BALL_R + 60 && ball.y < G.GROUND_Y - 100) {
        shouldJump = true;
      }

      if (headPred.t < 45 && predDistX < G.PLYR_R + G.BALL_R + 80) shouldJump = true;

      if (distX < G.PLYR_R + G.BALL_R + 70 && ball.y < p.y - 20 && ball.vy > -4) shouldJump = true;

      if (phase === 'SERVE' && distX < G.PLYR_R + G.BALL_R + 60 && G.state === 'PLAYING') shouldJump = true;
    }

    if (shouldJump && p.grounded) {
      p.vy = G.PLYR_JUMP;
      p.grounded = false;
    }

    /* --- SPIKE DECISION --- */
    p.spiking = false;
    p.spikeBuffer = 0;
    if (!p.grounded && G.state === 'PLAYING') {
      var sDx = Math.abs(p.x - ball.x);
      var sHead = p.y - G.PLYR_H * 0.45;
      var sDy = ball.y - sHead;
      var inRange = sDx < G.PLYR_R + G.BALL_R + 35 && Math.abs(sDy) < G.PLYR_R + G.BALL_R + 35;
      var nearNet = p.x < G.NET_X + 170;
      var ballAbove = ball.y < sHead + 5;

      if (inRange && nearNet && ballAbove) {
        p.spiking = true;
        p.spikeBuffer = G.SPIKE_BUFFER;
      }

      if (inRange && nearNet && p.vy < 0 && ball.y < p.y - 30) {
        p.spiking = true;
        p.spikeBuffer = G.SPIKE_BUFFER;
      }
    }
  };
})(window.G);
