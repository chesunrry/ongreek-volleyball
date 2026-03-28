/* ==========================================================
   PLAYER  — creation, update & physics
   ========================================================== */
(function (G) {
  'use strict';

  G.makePlayer = function (x, prefix, faceDef) {
    return {
      x: x, y: G.GROUND_Y,
      vx: 0, vy: 0,
      grounded: true,
      spiking: false,
      spikeBuffer: 0,
      prefix: prefix,
      faceDef: faceDef,
      faceDir: faceDef,
      anim: 'stand'
    };
  };

  G.updatePlayer = function (p, inp) {
    if (!inp) return;
    p.vx = 0;
    if (inp.left)  p.vx = -G.PLYR_SPD;
    if (inp.right) p.vx =  G.PLYR_SPD;
    if (inp.up && p.grounded) {
      p.vy = G.PLYR_JUMP;
      p.grounded = false;
    }
    if (inp.spike && !p.grounded) {
      p.spikeBuffer = G.SPIKE_BUFFER;
    }
    if (p.grounded) p.spikeBuffer = 0;
    p.spiking = p.spikeBuffer > 0;
    if (p.spikeBuffer > 0) p.spikeBuffer--;
  };

  G.applyPlayerPhysics = function (p, minX, maxX) {
    if (!p.grounded) {
      p.vy += G.GRAVITY;
      p.y += p.vy;
      if (p.y >= G.GROUND_Y) { p.y = G.GROUND_Y; p.vy = 0; p.grounded = true; }
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
  };
})(window.G);
