/* ════════════════════════════════════════════════════════════
   BLOSSOM PETAL CURSOR — Floating teal petal with bloom on hover
   ════════════════════════════════════════════════════════════ */

(function initBlossomCursor(){
  if(window.matchMedia('(pointer:coarse)').matches) return; // skip touch devices

  const SIZE = 64;
  const canvas = document.createElement('canvas');
  canvas.width = SIZE;
  canvas.height = SIZE;
  const ctx = canvas.getContext('2d');

  let mouseX = 0, mouseY = 0;
  let cursorVisible = false;
  let hover = 0;          // 0 → 1 eased bloom factor
  let hoverTarget = 0;
  let lastHoverTarget = 0;
  let animationId = null;

  // Burst particles fired on hover-enter
  const bursts = [];

  function isInteractive(el){
    return !!(el && el.closest && el.closest(
      'a, button, [role="button"], input, textarea, select, .gallery-card, .cat-card, .what-card, .adventure-btn, .social-btn, .carousel-btn, .carousel-dot'
    ));
  }

  document.addEventListener('mousemove', (e) => {
    mouseX = e.clientX;
    mouseY = e.clientY;
    cursorVisible = true;
    hoverTarget = isInteractive(e.target) ? 1 : 0;
  });
  document.addEventListener('mouseover', (e) => {
    hoverTarget = isInteractive(e.target) ? 1 : 0;
  });
  document.addEventListener('mouseout', () => { hoverTarget = 0; });
  document.addEventListener('mouseleave', () => { cursorVisible = false; });
  document.addEventListener('mouseenter', () => { cursorVisible = true; });

  function spawnBurst(){
    const n = 7;
    for(let i = 0; i < n; i++){
      const ang = (Math.PI * 2 * i / n) + Math.random() * 0.5;
      const spd = 0.9 + Math.random() * 1.2;
      bursts.push({
        x: 0, y: 0,
        vx: Math.cos(ang) * spd,
        vy: Math.sin(ang) * spd,
        life: 1,
        decay: 0.04 + Math.random() * 0.03,
        r: 1.4 + Math.random() * 1.6
      });
    }
  }

  // Draw a single teardrop petal at the origin, rotated, scaled
  function drawPetal(cx, cy, rot, scale, alpha){
    ctx.save();
    ctx.translate(cx, cy);
    ctx.rotate(rot);
    ctx.scale(scale, scale);
    ctx.globalAlpha = alpha;

    const grad = ctx.createLinearGradient(0, -10, 0, 6);
    grad.addColorStop(0,   'rgba(190, 240, 235, 0.95)');
    grad.addColorStop(0.5, 'rgba(90, 200, 195, 0.92)');
    grad.addColorStop(1,   'rgba(42, 150, 150, 0.78)');
    ctx.fillStyle = grad;

    // teardrop / petal shape
    ctx.beginPath();
    ctx.moveTo(0, -10);
    ctx.bezierCurveTo(7, -5, 6, 5, 0, 8);
    ctx.bezierCurveTo(-6, 5, -7, -5, 0, -10);
    ctx.fill();

    // center vein highlight
    ctx.globalAlpha = alpha * 0.5;
    ctx.strokeStyle = 'rgba(230, 255, 250, 0.8)';
    ctx.lineWidth = 0.7;
    ctx.beginPath();
    ctx.moveTo(0, -8);
    ctx.lineTo(0, 6);
    ctx.stroke();

    ctx.restore();
  }

  function render(){
    const t = Date.now() / 1000;
    ctx.clearRect(0, 0, SIZE, SIZE);
    const cx = SIZE / 2, cy = SIZE / 2;

    // ease hover
    hover += (hoverTarget - hover) * 0.18;

    // fire a burst the moment hover engages
    if(hoverTarget === 1 && lastHoverTarget === 0) spawnBurst();
    lastHoverTarget = hoverTarget;

    // soft glow — grows with hover
    const glowR = (10 + hover * 16);
    const glow = ctx.createRadialGradient(cx, cy, 0, cx, cy, glowR);
    glow.addColorStop(0, `rgba(120, 230, 220, ${0.18 + hover * 0.32})`);
    glow.addColorStop(0.6, `rgba(70, 190, 185, ${0.08 + hover * 0.14})`);
    glow.addColorStop(1, 'rgba(40, 150, 150, 0)');
    ctx.fillStyle = glow;
    ctx.beginPath();
    ctx.arc(cx, cy, glowR, 0, Math.PI * 2);
    ctx.fill();

    // gentle idle float/sway
    const sway = Math.sin(t * 1.6) * 0.12;

    if(hover < 0.25){
      // RESTING — single floating petal, gently rocking
      drawPetal(cx, cy, sway + 0.15, 1, 1);
    } else {
      // BLOOMING — petals fan out into a blossom
      const petals = 5;
      const spread = hover; // 0..1
      for(let i = 0; i < petals; i++){
        const baseAng = (Math.PI * 2 * i / petals);
        const ang = baseAng + sway;
        const dist = spread * 6;
        const px = cx + Math.cos(ang - Math.PI / 2) * dist;
        const py = cy + Math.sin(ang - Math.PI / 2) * dist;
        drawPetal(px, py, ang, 0.7 + spread * 0.35, 1);
      }
      // bright center
      ctx.globalAlpha = spread;
      const core = ctx.createRadialGradient(cx, cy, 0, cx, cy, 4);
      core.addColorStop(0, 'rgba(245, 255, 250, 0.95)');
      core.addColorStop(1, 'rgba(160, 240, 230, 0)');
      ctx.fillStyle = core;
      ctx.beginPath();
      ctx.arc(cx, cy, 4, 0, Math.PI * 2);
      ctx.fill();
      ctx.globalAlpha = 1;
    }

    // burst particles
    for(let i = bursts.length - 1; i >= 0; i--){
      const p = bursts[i];
      p.x += p.vx; p.y += p.vy;
      p.vy += 0.04; // slight gravity
      p.life -= p.decay;
      if(p.life <= 0){ bursts.splice(i, 1); continue; }
      ctx.globalAlpha = Math.max(0, p.life);
      const pg = ctx.createRadialGradient(cx + p.x, cy + p.y, 0, cx + p.x, cy + p.y, p.r);
      pg.addColorStop(0, 'rgba(200, 250, 240, 0.95)');
      pg.addColorStop(1, 'rgba(80, 200, 190, 0)');
      ctx.fillStyle = pg;
      ctx.beginPath();
      ctx.arc(cx + p.x, cy + p.y, p.r, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.globalAlpha = 1;

    if(cursorVisible){
      const url = canvas.toDataURL('image/png');
      document.documentElement.style.cursor = `url('${url}') ${cx} ${cy}, auto`;
    } else {
      document.documentElement.style.cursor = 'auto';
    }

    animationId = requestAnimationFrame(render);
  }

  render();

  window.addEventListener('beforeunload', () => {
    if(animationId) cancelAnimationFrame(animationId);
  });
})();
