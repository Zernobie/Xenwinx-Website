/* ═══════════════════════════════════════════════════════════════
   XENWINX — CUSTOM CURSOR SYSTEM
   Mode 1 : Dragon-Phoenix Spirit Orb
   Mode 2 : Kajo the Wisp  (default)
   Usage   : window.XWCursor.setMode('orb' | 'wisp')
═══════════════════════════════════════════════════════════════ */
(function () {
  'use strict';

  /* ── CONFIG ────────────────────────────────────────────────── */
  const CFG = {
    trailLen     : 38,
    particleMax  : 90,
    petalMax     : 28,
    orbRadius    : 7,
    orbGlowRadius: 24,
    petalSize    : 11,
  };

  /* ── STATE ─────────────────────────────────────────────────── */
  let mx = -400, my = -400;
  let pmx = -400, pmy = -400;
  let mode = 'wisp';
  let orbAngle  = 0;
  let breathT   = 0;
  let hoverState   = 'none';   // 'none' | 'button' | 'portal'
  let hoverExpandT = 0;
  let logoSpinAngle = 0;
  let moveDir   = 0;
  let petalSpinT = 0;

  let trail          = [];
  let particles      = [];
  let floatingPetals = [];
  let rings          = [];

  /* ── CANVAS SETUP ──────────────────────────────────────────── */
  const canvas = document.createElement('canvas');
  canvas.id = 'xw-cursor-canvas';
  canvas.style.cssText =
    'position:fixed;top:0;left:0;width:100vw;height:100vh;' +
    'pointer-events:none;z-index:2147483647;';
  let ctx, W, H;

  function resize() {
    W = canvas.width  = window.innerWidth;
    H = canvas.height = window.innerHeight;
  }

  /* ── CURSOR HIDE ───────────────────────────────────────────── */
  function hideCursor() {
    const s = document.createElement('style');
    s.id = 'xw-cursor-hide';
    s.textContent = '*{cursor:none!important;}';
    document.head.appendChild(s);
  }

  /* ── INPUT ─────────────────────────────────────────────────── */
  function onMove(e) {
    pmx = mx; pmy = my;
    mx = e.clientX; my = e.clientY;

    const dx = mx - pmx, dy = my - pmy;
    if (dx * dx + dy * dy > 4) moveDir = Math.atan2(dy, dx) + Math.PI * 0.5;

    /* hover detection */
    const el = document.elementFromPoint(mx, my);
    const prev = hoverState;
    if (el && el.closest('[data-portal],.gate-portal,.px-btn-portal')) {
      hoverState = 'portal';
    } else if (el && el.closest('a,button,.px-btn,.xw-btn,.nav-link,[role="button"],.lumi-link')) {
      hoverState = 'button';
    } else {
      hoverState = 'none';
    }

    if (hoverState !== 'none' && prev === 'none') {
      rings.push({
        x: mx, y: my, r: 0,
        maxR: hoverState === 'portal' ? 58 : 40,
        life: 1,
      });
    }

    /* trail */
    trail.push({ x: mx, y: my });
    if (trail.length > CFG.trailLen) trail.shift();

    /* particles (orb mode) */
    if (mode === 'orb') spawnMoveParticles();

    /* random floating petal */
    if (Math.random() < 0.14) spawnFloatingPetal(mx, my);
  }

  /* ── SPAWNERS ──────────────────────────────────────────────── */
  function spawnMoveParticles() {
    if (particles.length >= CFG.particleMax) return;
    const n = Math.random() < 0.25 ? 2 : 1;
    for (let i = 0; i < n; i++) {
      const a = Math.random() * Math.PI * 2;
      const spd = 0.4 + Math.random() * 1.3;
      particles.push({
        x: mx + (Math.random() - 0.5) * 10,
        y: my + (Math.random() - 0.5) * 10,
        vx: Math.cos(a) * spd,
        vy: Math.sin(a) * spd - 0.6,
        life: 1,
        maxLife: 0.5 + Math.random() * 0.9,
        size: 1.5 + Math.random() * 2.5,
        isTeal: Math.random() < 0.6,
      });
    }
  }

  function spawnFloatingPetal(x, y) {
    if (floatingPetals.length >= CFG.petalMax) return;
    floatingPetals.push({
      x, y,
      vx: (Math.random() - 0.5) * 1.8,
      vy: -0.6 - Math.random() * 1.4,
      rot: Math.random() * Math.PI * 2,
      rotSpd: (Math.random() - 0.5) * 0.09,
      life: 1,
      maxLife: 0.9 + Math.random() * 1.3,
      size: 3 + Math.random() * 6,
      phase: Math.random() * Math.PI * 2,
    });
  }

  /* ── DRAW: KAJO WISP SHAPE ─────────────────────────────────── */
  /* Glowing spirit-wisp: bright head + tapering ribbon tail.
     Signature kept from the old petal renderer so trails reuse it. */
  function drawPetal(x, y, size, angle, alpha, r, g, b) {
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(angle);
    ctx.globalAlpha = Math.max(0, alpha);
    const tail = ctx.createLinearGradient(0, -size * 0.6, 0, size * 2);
    tail.addColorStop(0,   `rgba(${r},${g},${b},0.9)`);
    tail.addColorStop(0.4, `rgba(${r},${g},${b},0.45)`);
    tail.addColorStop(1,   `rgba(${r},${g},${b},0)`);
    ctx.beginPath();
    ctx.moveTo(-size * 0.42, -size * 0.2);
    ctx.bezierCurveTo(-size * 0.55, size * 0.9, size * 0.34, size * 1.1, size * 0.1, size * 2);
    ctx.bezierCurveTo(size * 0.2, size * 1.05, size * 0.5, size * 0.75, size * 0.42, -size * 0.2);
    ctx.closePath();
    ctx.fillStyle = tail;
    ctx.fill();
    const head = ctx.createRadialGradient(0, -size * 0.35, 0, 0, -size * 0.3, size * 0.95);
    head.addColorStop(0,   'rgba(255,255,245,0.98)');
    head.addColorStop(0.35,`rgba(${Math.min(255, r + 70)},${Math.min(255, g + 40)},${Math.min(255, b + 20)},0.95)`);
    head.addColorStop(1,   `rgba(${r},${g},${b},0)`);
    ctx.beginPath();
    ctx.arc(0, -size * 0.32, size * 0.95, 0, Math.PI * 2);
    ctx.fillStyle = head;
    ctx.shadowColor = `rgba(${r},${g},${b},0.6)`;
    ctx.shadowBlur  = 12;
    ctx.fill();
    ctx.shadowBlur = 0;
    if (size > 7) {
      ctx.strokeStyle = `rgba(${r},${g},${b},${0.55 * Math.max(0, alpha)})`;
      ctx.lineWidth = Math.max(0.8, size * 0.09);
      ctx.lineCap = 'round';
      ctx.beginPath();
      ctx.moveTo(-size * 0.2, -size * 0.75);
      ctx.quadraticCurveTo(-size * 0.85, -size * 1.5, -size * 0.3, -size * 1.85);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(size * 0.2, -size * 0.75);
      ctx.quadraticCurveTo(size * 0.9, -size * 1.4, size * 0.4, -size * 1.9);
      ctx.stroke();
    }
    ctx.globalAlpha = 1;
    ctx.restore();
  }

  /* ── DRAW: ORB CURSOR ──────────────────────────────────────── */
  function drawOrb() {
    breathT   += 0.022;
    orbAngle  += 0.048;
    petalSpinT += 0.02;
    hoverExpandT += hoverState !== 'none' ? 0.09 : -0.07;
    hoverExpandT  = Math.max(0, Math.min(1, hoverExpandT));

    const breath  = Math.sin(breathT) * 2.8;
    const expand  = hoverExpandT * 7;
    const R       = CFG.orbRadius + breath + expand;
    const glowR   = CFG.orbGlowRadius + breath * 2 + expand * 2.5;

    /* outer glow */
    const grd = ctx.createRadialGradient(mx, my, 0, mx, my, glowR);
    grd.addColorStop(0,   `rgba(0,215,188,${0.30 + hoverExpandT * 0.18})`);
    grd.addColorStop(0.45,`rgba(0,180,160,0.10)`);
    grd.addColorStop(1,    'rgba(0,180,160,0)');
    ctx.beginPath();
    ctx.arc(mx, my, glowR, 0, Math.PI * 2);
    ctx.fillStyle = grd;
    ctx.fill();

    /* core orb */
    const core = ctx.createRadialGradient(mx - 2, my - 2.5, 0, mx, my, R);
    core.addColorStop(0,   'rgba(225,255,250,1)');
    core.addColorStop(0.38,'rgba(0,222,192,0.96)');
    core.addColorStop(1,   'rgba(0,130,120,0.90)');
    ctx.beginPath();
    ctx.arc(mx, my, R, 0, Math.PI * 2);
    ctx.fillStyle = core;
    ctx.shadowColor = 'rgba(0,220,188,0.7)';
    ctx.shadowBlur  = 14;
    ctx.fill();
    ctx.shadowBlur = 0;

    /* orbiting energies */
    orbitDot(orbAngle,               R + 6, 'rgba(150,235,255,0.95)', 3.5);
    orbitDot(orbAngle + Math.PI,     R + 6, 'rgba(0,225,200,0.95)',   3.0);
    orbitDot(orbAngle * 1.65,        R + 3, 'rgba(190,250,240,0.65)', 2.0);
    orbitDot(orbAngle * 1.65 + Math.PI, R + 3, 'rgba(80,205,225,0.65)', 2.0);

    /* button hover ring */
    if (hoverState === 'button' && hoverExpandT > 0.2) {
      ctx.beginPath();
      ctx.arc(mx, my, R + 15 + hoverExpandT * 5, 0, Math.PI * 2);
      ctx.strokeStyle = `rgba(0,212,185,${hoverExpandT * 0.75})`;
      ctx.lineWidth = 1.8;
      ctx.stroke();
    }

    /* portal hover: spinning X symbol */
    if (hoverState === 'portal') {
      logoSpinAngle += 0.07;
      const sr = R + 12 + hoverExpandT * 4;
      ctx.save();
      ctx.translate(mx, my);
      ctx.rotate(logoSpinAngle);
      ctx.strokeStyle = `rgba(0,222,192,${0.55 + hoverExpandT * 0.45})`;
      ctx.lineWidth = 2.2;
      ctx.lineCap = 'round';
      ctx.beginPath(); ctx.moveTo(-sr, -sr); ctx.lineTo(sr, sr); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(sr, -sr);  ctx.lineTo(-sr, sr); ctx.stroke();
      /* outer dim ring */
      ctx.beginPath();
      ctx.arc(0, 0, sr * 1.5, 0, Math.PI * 2);
      ctx.strokeStyle = `rgba(0,212,185,${hoverExpandT * 0.35})`;
      ctx.lineWidth = 1;
      ctx.stroke();
      ctx.restore();
    }
  }

  function orbitDot(angle, dist, color, size) {
    const ox = mx + Math.cos(angle) * dist;
    const oy = my + Math.sin(angle) * dist;
    const g = ctx.createRadialGradient(ox, oy, 0, ox, oy, size * 2.2);
    g.addColorStop(0, color);
    g.addColorStop(1, 'rgba(0,200,180,0)');
    ctx.beginPath();
    ctx.arc(ox, oy, size * 2.2, 0, Math.PI * 2);
    ctx.fillStyle = g;
    ctx.fill();
    ctx.beginPath();
    ctx.arc(ox, oy, size, 0, Math.PI * 2);
    ctx.fillStyle = color;
    ctx.fill();
  }

  /* ── DRAW: SAKURA PETAL (trail + particle motes) ──────────── */
  function drawSakura(x, y, size, angle, alpha, r, g, b) {
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(angle);
    ctx.globalAlpha = Math.max(0, alpha);
    const grad = ctx.createLinearGradient(0, -size, 0, size * 0.65);
    grad.addColorStop(0,   `rgba(${r},${g},${b},0.95)`);
    grad.addColorStop(0.45,`rgba(${r},${g},${b},0.75)`);
    grad.addColorStop(1,   `rgba(${r},${g},${b},0.25)`);
    ctx.beginPath();
    ctx.moveTo(0, -size);
    ctx.bezierCurveTo( size * 0.58, -size * 0.55,  size * 0.72,  size * 0.22, 0,  size * 0.62);
    ctx.bezierCurveTo(-size * 0.72,  size * 0.22, -size * 0.58, -size * 0.55, 0, -size);
    ctx.fillStyle = grad;
    ctx.shadowColor = `rgba(${r},${g},${b},0.5)`;
    ctx.shadowBlur  = 8;
    ctx.fill();
    ctx.shadowBlur = 0;
    ctx.globalAlpha = 1;
    ctx.restore();
  }

  /* ── DRAW: WISP CURSOR ─────────────────────────────────────── */
  function drawPetalCursor() {
    petalSpinT += 0.025;
    hoverExpandT += hoverState !== 'none' ? 0.09 : -0.07;
    hoverExpandT  = Math.max(0, Math.min(1, hoverExpandT));

    const rot = moveDir + petalSpinT * 0.25;

    /* hover: the wisp flares brighter — no blossom cluster */
    if (hoverExpandT > 0.02) {
      const hg = ctx.createRadialGradient(mx, my - 3, 0, mx, my - 3, CFG.petalSize * (1.5 + hoverExpandT));
      hg.addColorStop(0, `rgba(235,255,250,${0.5 * hoverExpandT})`);
      hg.addColorStop(1, 'rgba(64,224,208,0)');
      ctx.beginPath();
      ctx.arc(mx, my - 3, CFG.petalSize * (1.5 + hoverExpandT), 0, Math.PI * 2);
      ctx.fillStyle = hg;
      ctx.fill();
    }

    /* main wisp */
    drawPetal(mx, my, CFG.petalSize * (1 + hoverExpandT * 0.14), rot, 0.95, 64, 224, 208);
    /* inner highlight */
    drawPetal(mx - 1, my - 1.5, CFG.petalSize * 0.52, rot + 0.12, 0.7, 225, 255, 240);

    /* soft glow under wisp */
    const g = ctx.createRadialGradient(mx, my, 0, mx, my, CFG.petalSize * 2.6);
    g.addColorStop(0, 'rgba(64,224,208,0.26)');
    g.addColorStop(1, 'rgba(64,224,208,0)');
    ctx.beginPath();
    ctx.arc(mx, my, CFG.petalSize * 2.6, 0, Math.PI * 2);
    ctx.fillStyle = g;
    ctx.fill();
  }

  /* ── DRAW: TRAIL ───────────────────────────────────────────── */
  function drawTrail() {
    for (let i = 0; i < trail.length; i++) {
      const p = trail[i];
      const t = i / trail.length;
      const a = t * 0.55;
      if (mode === 'orb') {
        /* ink brush dot */
        ctx.beginPath();
        ctx.arc(p.x, p.y, t * 3.5, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(0,200,178,${a * 0.6})`;
        ctx.fill();
      } else {
        /* drifting petal trail */
        const rot = p.x * 0.012 + p.y * 0.009 + i * 0.22;
        drawSakura(p.x, p.y, t * 7.5, rot, a * 0.95, 120, 232, 218);
      }
    }
  }

  /* ── DRAW: PARTICLES ───────────────────────────────────────── */
  function drawParticles(dt) {
    particles = particles.filter(p => p.life > 0);
    for (const p of particles) {
      p.x  += p.vx;
      p.y  += p.vy;
      p.vy += 0.045;
      p.life -= dt / p.maxLife;
      const a = Math.max(0, p.life);
      const col = p.isTeal
        ? `rgba(0,212,185,${a * 0.88})`
        : `rgba(110,205,242,${a * 0.82})`;
      const g = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, p.size * 1.8);
      g.addColorStop(0, col);
      g.addColorStop(1, 'rgba(0,200,180,0)');
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.size * 1.8, 0, Math.PI * 2);
      ctx.fillStyle = g;
      ctx.fill();
    }
  }

  /* ── DRAW: FLOATING PETALS ─────────────────────────────────── */
  function drawFloatingPetals(dt) {
    const now = Date.now() * 0.001;
    floatingPetals = floatingPetals.filter(p => p.life > 0);
    for (const p of floatingPetals) {
      p.x   += p.vx + Math.sin(now + p.phase) * 0.025;
      p.y   += p.vy;
      p.vy  += 0.012;
      p.rot += p.rotSpd;
      p.life -= dt / p.maxLife;
      drawSakura(p.x, p.y, p.size, p.rot, Math.max(0, p.life) * 0.82, 150, 240, 226);
    }
  }

  /* ── DRAW: RINGS ───────────────────────────────────────────── */
  function drawRings(dt) {
    rings = rings.filter(r => r.life > 0);
    for (const r of rings) {
      r.r    += (r.maxR - r.r) * 0.13;
      r.life -= dt * 1.9;
      ctx.beginPath();
      ctx.arc(r.x, r.y, r.r, 0, Math.PI * 2);
      ctx.strokeStyle = `rgba(0,212,185,${Math.max(0, r.life) * 0.72})`;
      ctx.lineWidth = 1.8;
      ctx.stroke();
      /* second ring, faster, smaller */
      ctx.beginPath();
      ctx.arc(r.x, r.y, r.r * 0.6, 0, Math.PI * 2);
      ctx.strokeStyle = `rgba(0,212,185,${Math.max(0, r.life) * 0.35})`;
      ctx.lineWidth = 1;
      ctx.stroke();
    }
  }

  /* ── MAIN LOOP ─────────────────────────────────────────────── */
  let last = 0;
  function loop(ts) {
    const dt = Math.min((ts - last) / 1000, 0.05);
    last = ts;
    ctx.clearRect(0, 0, W, H);

    drawTrail();
    drawParticles(dt);
    drawFloatingPetals(dt);
    drawRings(dt);

    if (mode === 'orb') drawOrb();
    else drawPetalCursor();

    requestAnimationFrame(loop);
  }

  /* ── INIT ──────────────────────────────────────────────────── */
  function init() {
    document.body.appendChild(canvas);
    ctx = canvas.getContext('2d');
    resize();
    window.addEventListener('resize', resize);
    document.addEventListener('mousemove', onMove, { passive: true });
    document.addEventListener('mouseleave', () => { mx = -400; my = -400; });
    hideCursor();
    requestAnimationFrame(loop);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

  /* ── PUBLIC API ────────────────────────────────────────────── */
  window.XWCursor = {
    setMode(m) {
      mode = m;
      trail = []; particles = []; floatingPetals = [];
    },
    getMode() { return mode; },
    toggle() {
      window.XWCursor.setMode(mode === 'orb' ? 'wisp' : 'orb');
    },
  };

})();
