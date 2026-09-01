/* ============================================================
   XENWINX STUDIO — Shared World Engine
   Sakura Petal ↔ Ink Brush cursor · Petals · Blue Fireflies
   Nav · Reveals
   ============================================================ */
(function(){
  'use strict';
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const coarse = matchMedia('(pointer: coarse)').matches;

  /* ============================================================
     CURSOR — Sakura Petal (default) ↔ Magical Ink Brush (hover)
     ─ Glowing blue watercolour petal, wind-drifted trail,
       tiny petal particles with gravity + natural fade
     ─ On hover: 5-petal bloom → teal calligraphy brush,
       pressure-sensitive strokes, watercolour splash blobs,
       brush underline animation on buttons
  ============================================================ */
  if(!coarse && !reduce){

    /* ---- DOM setup ---- */
    const cur = document.createElement('div');
    cur.id = 'petal-cursor';
    cur.style.cssText = 'position:fixed;top:0;left:0;pointer-events:none;z-index:9999;will-change:transform;';
    document.body.appendChild(cur);

    const tcan = document.createElement('canvas'); // trail + particles
    tcan.className = 'fx-canvas';
    tcan.style.cssText = 'position:fixed;inset:0;pointer-events:none;z-index:9997;';
    document.body.appendChild(tcan);
    const tctx = tcan.getContext('2d');

    const ican = document.createElement('canvas'); // ink strokes
    ican.className = 'fx-canvas';
    ican.style.cssText = 'position:fixed;inset:0;pointer-events:none;z-index:9996;';
    document.body.appendChild(ican);
    const ictx = ican.getContext('2d');

    function resizeAll(){ tcan.width = ican.width = innerWidth; tcan.height = ican.height = innerHeight; }
    resizeAll();
    addEventListener('resize', resizeAll, {passive:true});

    /* ---- State ---- */
    let mx = innerWidth/2, my = innerHeight/2, cx = mx, cy = my;
    let vx = 0, vy = 0, angle = 0, speed = 0;
    let bloom = 0, brushMode = false;
    let wp1 = 0, wp2 = 0, wp3 = 0; // wind: slow gust / medium sway / fast shimmer
    let windX = 0; // smoothed wind accumulated value

    const TRAIL_N = 18;
    const trail = [];   // {x,y,a,s,age,wx}
    const parts = [];   // particles: {x,y,vx,vy,sz,life,decay,ink,rot,vr}
    const ink = [];     // stroke segments: {x,y,px,py,age,maxAge,w}
    const splashes = [];// watercolour blobs: {x,y,r,life,decay,dx,dy}
    let lix = -1, liy = -1, lastSpawn = 0, lastSplash = 0;

    addEventListener('mousemove', e => { mx = e.clientX; my = e.clientY; }, {passive:true});

    const INTER = 'a,button,.btn,.xw-card,.ccard,.glass-card,[data-bloom]';
    /* brush hover disabled — sakura petal only, never transform into brush */
    // (mouseover/mouseout brushMode toggles removed)

    /* ---- SVG builders ---- */
    function petalSVG(rotDeg, glowAmt){
      const g = Math.min(2.6, parseFloat(glowAmt)||1.4).toFixed(1);
      const r = (parseFloat(rotDeg)||0).toFixed(1);
      return `<svg viewBox="0 0 44 44" width="30" height="30" xmlns="http://www.w3.org/2000/svg" style="overflow:visible">
        <defs>
          <radialGradient id="pg" cx="40%" cy="24%" r="74%">
            <stop offset="0%" stop-color="#f2faff" stop-opacity=".96"/>
            <stop offset="28%" stop-color="#a2d8f2"/>
            <stop offset="65%" stop-color="#52a8d8"/>
            <stop offset="100%" stop-color="#3282b0" stop-opacity=".72"/>
          </radialGradient>
          <radialGradient id="ph" cx="60%" cy="72%" r="46%">
            <stop offset="0%" stop-color="#c8eefa" stop-opacity=".48"/>
            <stop offset="100%" stop-color="#52a8d8" stop-opacity="0"/>
          </radialGradient>
          <filter id="pf" x="-40%" y="-40%" width="180%" height="180%">
            <feGaussianBlur stdDeviation="${g}" result="b"/>
            <feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge>
          </filter>
        </defs>
        <g transform="rotate(${r} 22 22)">
          <ellipse cx="22" cy="22" rx="9" ry="14" fill="rgba(120,200,240,.10)" filter="url(#pf)"/>
          <path d="M22 4 C31 13 32 28 22 41 C12 28 13 13 22 4Z" fill="url(#pg)" filter="url(#pf)"/>
          <path d="M22 4 C31 13 32 28 22 41 C12 28 13 13 22 4Z" fill="url(#ph)" opacity=".65"/>
          <path d="M22 6 Q22.5 23 22 39" stroke="#b4e0f5" stroke-width=".65" fill="none" opacity=".72"/>
          <path d="M22 13 Q25.5 24 24 34" stroke="#cceeff" stroke-width=".3" fill="none" opacity=".44"/>
          <path d="M22 13 Q18.5 24 20 34" stroke="#cceeff" stroke-width=".3" fill="none" opacity=".44"/>
          <circle cx="18" cy="10" r=".8" fill="#a8d8f0" opacity=".32"/>
          <circle cx="27" cy="14" r=".6" fill="#a8d8f0" opacity=".25"/>
          <circle cx="19" cy="35" r=".7" fill="#8ec8e8" opacity=".28"/>
          <circle cx="26" cy="33" r=".55" fill="#8ec8e8" opacity=".22"/>
        </g>
      </svg>`;
    }

    function flowerSVG(b){
      let ps = '', gds = '';
      const c0 = '#eaf7ff', c1 = '#9fd8f0', c2 = '#54a8d8';
      for(let i=0;i<5;i++){
        gds += `<radialGradient id="fc${i}" cx="50%" cy="34%" r="70%">
          <stop offset="0%" stop-color="${c0}"/>
          <stop offset="52%" stop-color="${c1}"/>
          <stop offset="100%" stop-color="${c2}"/>
        </radialGradient>`;
        ps += `<g transform="rotate(${i*72} 22 22)">
          <path d="M22 22 C28 13 27 4 22 2 C17 4 16 13 22 22Z" fill="url(#fc${i})" opacity="${(.5+b*.45).toFixed(2)}"/>
        </g>`;
      }
      return `<svg viewBox="0 0 44 44" width="${(28+b*10).toFixed(0)}" height="${(28+b*10).toFixed(0)}" xmlns="http://www.w3.org/2000/svg" style="overflow:visible">
        <defs>${gds}
          <filter id="ff" x="-40%" y="-40%" width="180%" height="180%">
            <feGaussianBlur stdDeviation="${(1.8+b*2.4).toFixed(1)}" result="b"/>
            <feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge>
          </filter>
        </defs>
        ${ps}
        <circle cx="22" cy="22" r="${(3+b*2.5).toFixed(1)}" fill="#f0e070" filter="url(#ff)" opacity="${(.82+b*.15).toFixed(2)}"/>
        <circle cx="22" cy="22" r="1.8" fill="#fffbe4" opacity=".92"/>
      </svg>`;
    }

    function brushSVG(gp){
      const gBlur  = (4+gp*10).toFixed(0);
      const gAlpha = (0.48+gp*.42).toFixed(2);
      const tipO   = (0.68+gp*.28).toFixed(2);
      const tipG   = (gp*.78).toFixed(2);
      return `<svg viewBox="0 0 30 52" width="23" height="44" xmlns="http://www.w3.org/2000/svg"
        style="filter:drop-shadow(0 0 ${gBlur}px rgba(44,176,166,${gAlpha})) drop-shadow(0 0 2px rgba(0,0,0,.35))">
        <defs>
          <linearGradient id="bh" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stop-color="#2a5254"/>
            <stop offset="46%" stop-color="#4a8c8e"/>
            <stop offset="100%" stop-color="#2a5254"/>
          </linearGradient>
          <linearGradient id="bf" x1=".5" y1="0" x2=".5" y2="1">
            <stop offset="0%" stop-color="#246464"/>
            <stop offset="60%" stop-color="#38b8ae"/>
            <stop offset="100%" stop-color="#0e3232" stop-opacity=".8"/>
          </linearGradient>
          <radialGradient id="bt" cx="50%" cy="86%" r="54%">
            <stop offset="0%" stop-color="#46e0d0" stop-opacity="${tipO}"/>
            <stop offset="100%" stop-color="#185858" stop-opacity=".15"/>
          </radialGradient>
        </defs>
        <rect x="12" y="1" width="6" height="22" rx="3" fill="url(#bh)"/>
        <rect x="11.5" y="8" width="7" height="1.2" rx=".6" fill="#142a2a" opacity=".55"/>
        <rect x="11.5" y="13" width="7" height=".8" rx=".4" fill="#5ac8c0" opacity=".22"/>
        <rect x="10.5" y="22" width="9" height="5" rx="1.5" fill="#182e2e" opacity=".94"/>
        <path d="M11 27 C10 35 11.5 43 15 50 L15 27Z" fill="url(#bf)"/>
        <path d="M19 27 C20 35 18.5 43 15 50 L15 27Z" fill="url(#bf)" opacity=".62"/>
        <path d="M14.2 27 L14.8 50 L15.2 50 L15.8 27Z" fill="#50d8ce" opacity=".28"/>
        <ellipse cx="15" cy="48" rx="3.2" ry="1.7" fill="url(#bt)"/>
        <ellipse cx="15" cy="49.2" rx="1.4" ry=".8" fill="#90f8f0" opacity="${tipG}"/>
      </svg>`;
    }

    /* ---- Particle helpers ---- */
    function spawnPart(x, y, isInk){
      const a = Math.random()*Math.PI*2;
      const sp = .4 + Math.random()*2.4;
      parts.push({
        x, y,
        vx: Math.cos(a)*sp*(isInk?.65:1.05),
        vy: Math.sin(a)*sp - .25,
        sz: isInk ? 1.2+Math.random()*3.5 : 2+Math.random()*5.5,
        life:1, decay:.013+Math.random()*.028,
        ink:isInk, rot:Math.random()*360, vr:(Math.random()-.5)*7
      });
    }

    function spawnSplash(x, y){
      const n = 2 + Math.floor(Math.random()*3);
      for(let i=0;i<n;i++) splashes.push({
        x: x + (Math.random()-.5)*8,
        y: y + (Math.random()-.5)*8,
        r: 3+Math.random()*8,
        life:1, decay:.006+Math.random()*.013,
        dx:(Math.random()-.5)*.28,
        dy:(Math.random()-.5)*.18
      });
    }

    /* ---- Button ink brushstroke underline ---- */
    function attachBtnBrush(el){
      if(el._bba) return;
      el._bba = true;
      const uid = Math.random().toString(36).slice(2,8);
      const wrap = document.createElement('div');
      wrap.className = 'btn-brush-wrap';
      wrap.style.cssText = 'position:absolute;inset:0;overflow:visible;pointer-events:none;border-radius:inherit;z-index:0;';
      const NS = 'http://www.w3.org/2000/svg';
      const svg = document.createElementNS(NS,'svg');
      svg.style.cssText = 'position:absolute;bottom:-5px;left:-4%;width:108%;height:16px;overflow:visible;';
      svg.setAttribute('viewBox','0 0 210 12');
      const defs = document.createElementNS(NS,'defs');
      defs.innerHTML = `<filter id="bsf${uid}" x="-5%" y="-400%" width="110%" height="900%">
        <feGaussianBlur stdDeviation="1.1" result="b"/>
        <feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge>
      </filter>`;
      const path = document.createElementNS(NS,'path');
      path.setAttribute('d','M2,9 C22,4 52,11 84,7 C116,3 142,10 170,6 C188,3 200,8 208,5');
      path.setAttribute('stroke','rgba(44,180,168,.65)');
      path.setAttribute('stroke-width','2.8');
      path.setAttribute('fill','none');
      path.setAttribute('stroke-linecap','round');
      path.setAttribute('filter',`url(#bsf${uid})`);
      svg.appendChild(defs);
      svg.appendChild(path);
      wrap.appendChild(svg);
      if(getComputedStyle(el).position==='static') el.style.position='relative';
      el.appendChild(wrap);
      const L = path.getTotalLength();
      path.style.strokeDasharray = L;
      path.style.strokeDashoffset = L;
      path.style.opacity = '0';
      el.addEventListener('mouseenter', () => {
        path.style.transition = 'none';
        path.style.strokeDashoffset = String(L);
        path.style.opacity = '1';
        requestAnimationFrame(() => {
          path.style.transition = 'stroke-dashoffset .52s cubic-bezier(.2,.8,.3,1)';
          path.style.strokeDashoffset = '0';
        });
      });
      el.addEventListener('mouseleave', () => {
        path.style.transition = 'opacity .38s ease';
        path.style.opacity = '0';
      });
    }

    /* ---- Main animation loop ---- */
    function tick(){
      // Triple-frequency wind
      wp1 += .007; wp2 += .021; wp3 += .056;
      const gust = Math.sin(wp1)*.56 + Math.sin(wp2)*.22 + Math.sin(wp3)*.08;
      windX += (gust - windX) * .11; // smoothed

      // Smooth cursor follow
      const dx = mx - cx, dy = my - cy;
      cx += dx*.16 + windX*.26; cy += dy*.16;
      vx = dx; vy = dy;
      speed = Math.hypot(vx, vy);

      // Angle rotation (follows movement direction)
      const tgt = Math.atan2(vy,vx) + Math.PI/2;
      if(speed > .9) angle += (((tgt-angle+Math.PI*3)%(Math.PI*2)) - Math.PI) * .10;
      else angle += Math.sin(Date.now()/930) * .0025; // idle sway

      // Bloom transition
      if(brushMode) bloom = Math.min(1, bloom+.09);
      else           bloom = Math.max(0, bloom-.07);

      /* --- Cursor SVG --- */
      if(brushMode){
        const gp = .58 + Math.sin(Date.now()/490) * .36;
        cur.innerHTML = brushSVG(gp);
        cur.style.transform = `translate(${cx.toFixed(1)}px,${cy.toFixed(1)}px) translate(-50%,-80%) rotate(${(angle*.17).toFixed(2)}rad)`;
        cur.style.filter = '';
      } else if(bloom > .38){
        cur.innerHTML = flowerSVG(Math.min(1, bloom));
        const sc = (1+bloom*.30).toFixed(2);
        cur.style.transform = `translate(${cx.toFixed(1)}px,${cy.toFixed(1)}px) translate(-50%,-50%) rotate(${angle.toFixed(2)}rad) scale(${sc})`;
        cur.style.filter = `drop-shadow(0 0 ${(5+bloom*9).toFixed(0)}px rgba(100,195,230,.56))`;
      } else {
        cur.innerHTML = petalSVG(angle*180/Math.PI, 1.2+speed*.05);
        cur.style.transform = `translate(${cx.toFixed(1)}px,${cy.toFixed(1)}px) translate(-50%,-50%)`;
        cur.style.filter = `drop-shadow(0 0 ${(5+speed*.5).toFixed(0)}px rgba(85,185,225,.55))`;
      }

      /* --- Trail (petals drift with wind + slight gravity as they age) --- */
      trail.push({x:cx, y:cy, a:angle, s:speed, age:0, wx:windX});
      if(trail.length > TRAIL_N) trail.shift();
      for(const t of trail){ t.age++; t.x += t.wx*.18; t.y += t.age*.006; }

      /* --- Particles --- */
      const now = Date.now();
      if(speed > 1.8 && now-lastSpawn > 88){
        spawnPart(cx+(Math.random()-.5)*5, cy+(Math.random()-.5)*5, false);
        lastSpawn = now;
      }
      for(let i=parts.length-1;i>=0;i--){
        const p = parts[i];
        p.x += p.vx + windX*.22;
        p.y += p.vy;
        p.vy += .028; // gravity
        p.life -= p.decay;
        p.rot += p.vr;
        if(p.life <= 0) parts.splice(i,1);
      }

      /* --- Ink strokes (brush mode only) --- */
      if(brushMode){
        if(lix < 0){ lix = cx; liy = cy; }
        const dd = Math.hypot(cx-lix, cy-liy);
        if(dd > 5){
          // Calligraphy pressure: faster = thinner
          const pressure = Math.max(.3, 1 - speed/38);
          ink.push({x:cx, y:cy, px:lix, py:liy, age:0, maxAge:155, w:pressure});
          if(dd > 16 && now-lastSplash > 78){
            spawnSplash(cx, cy);
            spawnPart(cx, cy, true);
            lastSplash = now;
          }
          lix = cx; liy = cy;
        }
      } else { lix = cx; liy = cy; }
      for(let i=ink.length-1;i>=0;i--){ ink[i].age++; if(ink[i].age > ink[i].maxAge) ink.splice(i,1); }
      for(let i=splashes.length-1;i>=0;i--){
        const s = splashes[i];
        s.x += s.dx; s.y += s.dy; s.life -= s.decay;
        if(s.life <= 0) splashes.splice(i,1);
      }

      /* Button brushstrokes */
      if(brushMode) document.querySelectorAll('a,button,.btn').forEach(attachBtnBrush);

      /* ===== RENDER ===== */
      tctx.clearRect(0,0,tcan.width,tcan.height);

      /* Trail petals — each drifts with age */
      for(let i=0;i<trail.length;i++){
        const t = trail[i], k = (i+1)/trail.length;
        tctx.save();
        tctx.translate(t.x, t.y);
        tctx.rotate(t.a + i*.11 + t.age*.009);
        tctx.globalAlpha = k * (brushMode ? .24 : .42);
        const s = (2+k*10) * (brushMode ? .33 : .46);
        if(brushMode){
          tctx.fillStyle = `rgba(44,168,158,${(k*.52).toFixed(2)})`;
          tctx.shadowBlur = 3; tctx.shadowColor = 'rgba(44,168,158,.38)';
          tctx.beginPath(); tctx.ellipse(0,0,s*.40,s*.82,0,0,Math.PI*2); tctx.fill();
        } else {
          tctx.fillStyle = `rgba(105,192,230,${(k*.50).toFixed(2)})`;
          tctx.shadowBlur = 3; tctx.shadowColor = 'rgba(85,190,230,.32)';
          tctx.beginPath();
          tctx.moveTo(0,-s);
          tctx.bezierCurveTo(s*.64,-s*.28, s*.50,s*.80, 0,s);
          tctx.bezierCurveTo(-s*.50,s*.80, -s*.64,-s*.28, 0,-s);
          tctx.fill();
        }
        tctx.restore();
      }

      /* Particles */
      for(const p of parts){
        tctx.save();
        tctx.translate(p.x, p.y);
        tctx.rotate(p.rot*Math.PI/180);
        tctx.globalAlpha = p.life * .80;
        if(p.ink){
          tctx.fillStyle = '#38b8ae';
          tctx.shadowBlur = 5; tctx.shadowColor = 'rgba(44,170,158,.58)';
          tctx.beginPath(); tctx.ellipse(0,0,p.sz*.30,p.sz*.70,0,0,Math.PI*2); tctx.fill();
        } else {
          tctx.fillStyle = '#74c4ea';
          tctx.shadowBlur = 4; tctx.shadowColor = 'rgba(78,185,228,.46)';
          const s = p.sz*.38;
          tctx.beginPath();
          tctx.moveTo(0,-s);
          tctx.bezierCurveTo(s*.62,-s*.2, s*.46,s*.82, 0,s);
          tctx.bezierCurveTo(-s*.46,s*.82, -s*.62,-s*.2, 0,-s);
          tctx.fill();
        }
        tctx.restore();
      }

      /* Ink strokes — core + watercolour wash, evaporate from edges */
      ictx.clearRect(0,0,ican.width,ican.height);
      for(const pt of ink){
        if(pt.px < 0) continue;
        const prog = pt.age / pt.maxAge;
        const fi   = prog < .06 ? prog/.06 : 1;
        const alpha = (1-prog)*fi*.74;
        const bw    = Math.max(.4, (2.6+pt.w*4.8)*(1-prog*.48));
        ictx.save();
        // Wide watercolour wash (only while fresh)
        if(prog < .38){
          ictx.globalAlpha = alpha*.20;
          ictx.strokeStyle = 'rgba(85,210,198,.5)';
          ictx.lineWidth = bw*3.4; ictx.lineCap = 'round';
          ictx.shadowBlur = 15; ictx.shadowColor = 'rgba(44,170,158,.18)';
          ictx.beginPath(); ictx.moveTo(pt.px,pt.py); ictx.lineTo(pt.x,pt.y); ictx.stroke();
        }
        // Core calligraphy stroke
        ictx.globalAlpha = alpha;
        ictx.strokeStyle = `rgba(28,148,138,${alpha.toFixed(2)})`;
        ictx.lineWidth = bw; ictx.lineCap = 'round';
        ictx.shadowBlur = 6; ictx.shadowColor = 'rgba(44,170,158,.40)';
        ictx.beginPath(); ictx.moveTo(pt.px,pt.py); ictx.lineTo(pt.x,pt.y); ictx.stroke();
        ictx.restore();
      }

      /* Watercolour splash blobs */
      for(const sp of splashes){
        ictx.save();
        ictx.globalAlpha = sp.life * .22;
        const g = ictx.createRadialGradient(sp.x,sp.y,0, sp.x,sp.y,sp.r*18);
        g.addColorStop(0, 'rgba(75,218,205,.6)');
        g.addColorStop(.4,'rgba(44,170,158,.22)');
        g.addColorStop(1, 'rgba(28,140,128,0)');
        ictx.fillStyle = g;
        ictx.beginPath(); ictx.arc(sp.x,sp.y,sp.r*18,0,Math.PI*2); ictx.fill();
        ictx.restore();
      }

      requestAnimationFrame(tick);
    }
    requestAnimationFrame(tick);
  }

  /* ---------------- SAKURA PETALS (falling) ---------------- */
  function startPetals(){
    let c = document.getElementById('petals-canvas');
    if(!c){ c = document.createElement('canvas'); c.id='petals-canvas'; c.className='fx-canvas'; document.body.appendChild(c); }
    const ctx = c.getContext('2d');
    let W, H, petals;
    function size(){ W=c.width=innerWidth; H=c.height=innerHeight; }
    function spawn(y){
      const size = 6+Math.random()*10;
      return { x:Math.random()*W, y, size,
        sp:0.5+Math.random()*1.1, sway:0.6+Math.random()*1.4,
        ph:Math.random()*Math.PI*2, rot:Math.random()*Math.PI, vr:(Math.random()-0.5)*0.04,
        op:0.4+Math.random()*0.5, hue:Math.random()<0.5 };
    }
    size();
    const count = innerWidth<700 ? 8 : 18;
    petals=[];
    for(let i=0;i<count;i++) petals.push(spawn(Math.random()*H));
    addEventListener('resize', ()=>{ size(); }, {passive:true});
    let t = 0;
    function frame(){
      ctx.clearRect(0,0,W,H);
      t += .01;
      const gust = Math.sin(t*.7)*.8 + Math.sin(t*1.9)*.4;
      for(const p of petals){
        p.y += p.sp;
        p.ph += .02*p.sway;
        p.x += Math.sin(p.ph)*p.sway + gust*.6;
        p.rot += p.vr;
        if(p.y > H+20){ Object.assign(p, spawn(-20)); p.x=Math.random()*W; }
        ctx.save();
        ctx.translate(p.x,p.y); ctx.rotate(p.rot);
        ctx.globalAlpha = p.op;
        const grd = ctx.createLinearGradient(0,-p.size,0,p.size);
        grd.addColorStop(0, p.hue?'#eaf7fa':'#cfe9ee');
        grd.addColorStop(1, p.hue?'#9fc6cf':'#7fb6c0');
        ctx.fillStyle = grd;
        ctx.beginPath();
        ctx.moveTo(0,-p.size);
        ctx.bezierCurveTo(p.size*.7,-p.size*.3, p.size*.55,p.size*.8, 0,p.size);
        ctx.bezierCurveTo(-p.size*.55,p.size*.8, -p.size*.7,-p.size*.3, 0,-p.size);
        ctx.fill();
        ctx.restore();
      }
      requestAnimationFrame(frame);
    }
    if(!reduce) requestAnimationFrame(frame);
    else {
      for(const p of petals){
        ctx.save(); ctx.translate(p.x,p.y); ctx.globalAlpha=p.op*.6;
        ctx.fillStyle='#bfe0e6';
        ctx.beginPath(); ctx.ellipse(0,0,p.size*.6,p.size,0,0,Math.PI*2); ctx.fill();
        ctx.restore();
      }
    }
  }

  /* ---------------- FIREFLIES (blue) ---------------- */
  function startFireflies(){
    let c = document.getElementById('fireflies-canvas');
    if(!c){ c=document.createElement('canvas'); c.id='fireflies-canvas'; c.className='fx-canvas'; document.body.appendChild(c); }
    const ctx = c.getContext('2d');
    let W, H, bugs;
    function size(){ W=c.width=innerWidth; H=c.height=innerHeight; }
    size();
    const n = innerWidth<700 ? 8 : 14;
    bugs=[];
    for(let i=0;i<n;i++) bugs.push({
      x:Math.random()*W, y:Math.random()*H,
      a:Math.random()*Math.PI*2, sp:.2+Math.random()*.5,
      r:1+Math.random()*2, ph:Math.random()*Math.PI*2, drift:.3+Math.random()*.6
    });
    addEventListener('resize', size, {passive:true});
    function frame(){
      ctx.clearRect(0,0,W,H);
      for(const b of bugs){
        b.a += (Math.random()-.5)*.3;
        b.x += Math.cos(b.a)*b.sp + Math.sin(b.ph)*b.drift*.4;
        b.y += Math.sin(b.a)*b.sp*.6;
        b.ph += .05;
        if(b.x<0)b.x=W; if(b.x>W)b.x=0; if(b.y<0)b.y=H; if(b.y>H)b.y=0;
        const glow = .45 + Math.sin(b.ph*1.4)*.40;
        const g = ctx.createRadialGradient(b.x,b.y,0, b.x,b.y,b.r*7);
        g.addColorStop(0, `rgba(100,180,255,${glow})`);
        g.addColorStop(.4,`rgba(80,140,230,${(glow*.4).toFixed(2)})`);
        g.addColorStop(1, 'rgba(80,140,230,0)');
        ctx.fillStyle=g; ctx.beginPath(); ctx.arc(b.x,b.y,b.r*7,0,Math.PI*2); ctx.fill();
        ctx.fillStyle=`rgba(200,230,255,${glow})`; ctx.beginPath(); ctx.arc(b.x,b.y,b.r,0,Math.PI*2); ctx.fill();
      }
      requestAnimationFrame(frame);
    }
    if(!reduce) requestAnimationFrame(frame);
  }

  /* ---------------- NAV ---------------- */
  function initNav(){
    const nav    = document.querySelector('.xw-nav');
    const burger = document.querySelector('.xw-burger');
    const links  = document.querySelector('.xw-links');
    if(burger&&links){
      burger.addEventListener('click', ()=> links.classList.toggle('open'));
      links.querySelectorAll('a').forEach(a=>a.addEventListener('click',()=>links.classList.remove('open')));
    }
    if(nav) addEventListener('scroll', ()=>{ nav.classList.toggle('shrink', scrollY>40); }, {passive:true});
    const here = (location.pathname.split('/').pop()||'index.html').toLowerCase();
    document.querySelectorAll('.xw-links a').forEach(a=>{
      const href=(a.getAttribute('href')||'').toLowerCase();
      if(href===here || (here==='index.html'&&(href==='index.html'||href==='./'))) a.classList.add('active');
    });
    const wm = document.querySelector('.xw-brand .bt[data-type]');
    if(wm && !reduce){
      const full = wm.getAttribute('data-type');
      wm.innerHTML='<span class="txt"></span><span class="cursorbar"></span>';
      const span = wm.querySelector('.txt');
      let i=0, dir=1;
      (function loop(){
        span.textContent = full.slice(0,i);
        i += dir;
        let delay = 110;
        if(i > full.length){ i=full.length; dir=-1; delay=2200; }
        else if(i < 0){ i=0; dir=1; delay=900; }
        setTimeout(loop, delay);
      })();
    } else if(wm){ wm.textContent = wm.getAttribute('data-type'); }
  }

  /* ---------------- BUTTON GLOW + REVEAL ---------------- */
  function initFX(){
    document.querySelectorAll('.btn').forEach(b=>{
      b.addEventListener('mousemove', e=>{
        const r=b.getBoundingClientRect();
        b.style.setProperty('--mx',(e.clientX-r.left)+'px');
        b.style.setProperty('--my',(e.clientY-r.top)+'px');
      });
    });
    const io = new IntersectionObserver(es=>{
      es.forEach(en=>{ if(en.isIntersecting){ en.target.classList.add('in'); io.unobserve(en.target); } });
    }, {threshold:.12});
    document.querySelectorAll('.reveal').forEach(el=>io.observe(el));
  }

  function fillBackdrop(){
    const wb = document.querySelector('.world-bg');
    if(!wb || !window.Scenery) return;
    const S = window.Scenery;
    const far  = wb.querySelector('.wb-mtn.far');
    const near = wb.querySelector('.wb-mtn:not(.far)');
    const fog  = wb.querySelector('.wb-fog');
    const fore = wb.querySelector('.wb-fore');
    const seed = (wb.dataset.seed|0) || 7;
    if(far)  far.innerHTML  = S.mountainRange({seed:seed*3,peaks:5,topColor:'#aebec2',botColor:'#7e8f93',opacity:.55,blur:2,rough:.9});
    if(near) near.innerHTML = S.mountainRange({seed:seed*5,peaks:6,topColor:'#74858a',botColor:'#48565a',opacity:.92,rough:1.1});
    if(fog)  fog.innerHTML  = S.fogBand({opacity:.8});
    if(fore) fore.innerHTML = S.foliage({seed:seed*7,color:'#2a3835',count:20});
  }

  function boot(){ initNav(); initFX(); fillBackdrop(); startPetals(); startFireflies(); }
  if(document.readyState==='loading') document.addEventListener('DOMContentLoaded', boot); else boot();

  window.XW = { startPetals, startFireflies };
})();
