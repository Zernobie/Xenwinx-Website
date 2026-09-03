/* ============================================================
   XENWINX — Atmosphere Engine
   Canvas particles (sakura petals + fireflies + mist wisps),
   petal cursor w/ trail + wind, parallax, scroll reveals.
   Auto-inits on DOMContentLoaded. Respects reduced-motion.
   ============================================================ */
(function(){
  const RM = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const FINE = window.matchMedia('(hover:hover) and (pointer:fine)').matches;
  const TAU = Math.PI*2;
  const rand=(a,b)=>a+Math.random()*(b-a);

  /* ---------- Global wind (drives petals + cursor) ---------- */
  const wind = { t:0, x:0 };
  function tickWind(dt){ wind.t += dt*0.00018; wind.x = Math.sin(wind.t)*0.5 + Math.sin(wind.t*2.3)*0.25; }

  /* ---------- Petal shape ---------- */
  function drawPetal(ctx,s,hue){
    ctx.beginPath();
    ctx.moveTo(0,-s);
    ctx.bezierCurveTo(s*0.7,-s*0.6, s*0.6,s*0.7, 0,s);
    ctx.bezierCurveTo(-s*0.6,s*0.7, -s*0.7,-s*0.6, 0,-s);
    ctx.closePath();
    ctx.fill();
    // notch
    ctx.globalCompositeOperation='destination-out';
    ctx.beginPath(); ctx.ellipse(0,s*0.92,s*0.34,s*0.3,0,0,TAU); ctx.fill();
    ctx.globalCompositeOperation='source-over';
  }

  /* ---------- Particle field ---------- */
  function Field(canvas, opts){
    const ctx = canvas.getContext('2d');
    let W,H,DPR, petals=[], flies=[], wisps=[], raf, last=0;
    const cfg = Object.assign({ petals:34, flies:18, wisps:5 }, opts||{});

    function resize(){
      DPR = Math.min(devicePixelRatio||1, 2);
      W = canvas.clientWidth; H = canvas.clientHeight;
      canvas.width = W*DPR; canvas.height = H*DPR;
      ctx.setTransform(DPR,0,0,DPR,0,0);
    }
    function mkPetal(){
      const blue = Math.random()<0.7;
      return { x:rand(0,W), y:rand(-H,0), z:rand(.4,1.4),
        s:rand(5,11), rot:rand(0,TAU), vr:rand(-.02,.02),
        sway:rand(0,TAU), vs:rand(.5,1.4), vy:rand(.25,.7),
        col: blue ? `rgba(169,198,214,` : `rgba(207,226,236,` };
    }
    function mkFly(){ return { x:rand(0,W), y:rand(0,H), a:rand(0,TAU), va:rand(.004,.012),
        r:rand(8,40), s:rand(1,2.2), tw:rand(0,TAU), vt:rand(.03,.08) }; }
    function mkWisp(){ return { x:rand(0,W), y:rand(H*.4,H), w:rand(180,460), h:rand(40,90),
        vx:rand(.1,.4)*(Math.random()<.5?-1:1), o:rand(.04,.12) }; }

    function seed(){
      petals = Array.from({length:cfg.petals}, mkPetal);
      flies  = Array.from({length:cfg.flies},  mkFly);
      wisps  = Array.from({length:cfg.wisps},  mkWisp);
    }

    function frame(t){
      const dt = Math.min(t-last,40)||16; last=t; tickWind(dt);
      ctx.clearRect(0,0,W,H);

      // mist wisps (back)
      wisps.forEach(p=>{
        p.x += p.vx*dt*0.06; if(p.x<-p.w) p.x=W+p.w; if(p.x>W+p.w) p.x=-p.w;
        const g = ctx.createRadialGradient(p.x,p.y,0,p.x,p.y,p.w);
        g.addColorStop(0,`rgba(244,242,236,${p.o})`); g.addColorStop(1,'rgba(244,242,236,0)');
        ctx.fillStyle=g; ctx.beginPath(); ctx.ellipse(p.x,p.y,p.w,p.h,0,0,TAU); ctx.fill();
      });

      // petals
      petals.forEach(p=>{
        p.sway += p.vs*0.01*dt*0.06;
        p.x += (Math.sin(p.sway)*0.5 + wind.x*1.6)*p.z*dt*0.06;
        p.y += p.vy*p.z*dt*0.06;
        p.rot += p.vr*dt*0.06;
        if(p.y>H+20){ p.y=rand(-40,-10); p.x=rand(0,W); }
        if(p.x>W+20) p.x=-20; if(p.x<-20) p.x=W+20;
        ctx.save(); ctx.translate(p.x,p.y); ctx.rotate(p.rot+Math.sin(p.sway)*.4);
        ctx.fillStyle = p.col + (0.55*p.z).toFixed(2) + ')';
        drawPetal(ctx,p.s*p.z); ctx.restore();
      });

      // fireflies (gold)
      flies.forEach(f=>{
        f.a += f.va*dt*0.06; f.tw += f.vt*dt*0.06;
        const x=f.x+Math.cos(f.a)*f.r, y=f.y+Math.sin(f.a*1.3)*f.r;
        const glow=(Math.sin(f.tw)*.5+.5);
        const g=ctx.createRadialGradient(x,y,0,x,y,f.s*6);
        g.addColorStop(0,`rgba(231,205,146,${.5+glow*.4})`);
        g.addColorStop(1,'rgba(216,177,94,0)');
        ctx.fillStyle=g; ctx.beginPath(); ctx.arc(x,y,f.s*6,0,TAU); ctx.fill();
        ctx.fillStyle=`rgba(247,235,200,${.6+glow*.4})`; ctx.beginPath(); ctx.arc(x,y,f.s*0.8,0,TAU); ctx.fill();
      });

      raf=requestAnimationFrame(frame);
    }

    function start(){ resize(); seed(); if(!RM){ last=performance.now(); raf=requestAnimationFrame(frame);} else { /* static */ frame(performance.now()); cancelAnimationFrame(raf);} }
    window.addEventListener('resize', ()=>{ resize(); seed(); });
    return { start };
  }

  /* ---------- Petal cursor ---------- */
  function PetalCursor(){
    if(!FINE) return;
    document.documentElement.classList.add('petal-cursor');
    const el = document.createElement('div'); el.className='cursor-petal';
    el.innerHTML = `<svg viewBox="-14 -14 28 28"><defs>
      <radialGradient id="cpg" cx="50%" cy="35%" r="70%">
        <stop offset="0%" stop-color="#cfe2ec"/><stop offset="60%" stop-color="#a9c6d6"/><stop offset="100%" stop-color="#6fa6bf"/>
      </radialGradient></defs>
      <path id="cpp" d="M0,-12 C7,-7 6,7 0,12 C-6,7 -7,-7 0,-12 Z" fill="url(#cpg)"/>
    </svg>`;
    document.body.appendChild(el);

    // trail container (tiny petals)
    let mx=innerWidth/2,my=innerHeight/2, cx=mx,cy=my, rot=0, vrot=0, last=performance.now();
    const trail=[];
    window.addEventListener('mousemove',e=>{ mx=e.clientX; my=e.clientY; });
    // bloom on interactive hover
    const interactive='a,button,.btn,.card,[data-bloom],input,textarea,.glass';
    document.addEventListener('mouseover',e=>{ if(e.target.closest(interactive)) el.classList.add('bloom'); });
    document.addEventListener('mouseout',e=>{ if(e.target.closest(interactive)) el.classList.remove('bloom'); });

    function spawnTrail(x,y){
      const t=document.createElement('div'); t.className='petal-trail';
      t.style.cssText=`position:fixed;left:${x}px;top:${y}px;width:7px;height:7px;z-index:9998;pointer-events:none;transform:translate(-50%,-50%) rotate(${rand(0,360)}deg);transition:opacity .9s,transform .9s;`;
      t.innerHTML=`<svg viewBox="-14 -14 28 28" width="7" height="7"><path d="M0,-12 C7,-7 6,7 0,12 C-6,7 -7,-7 0,-12 Z" fill="rgba(169,198,214,.85)"/></svg>`;
      document.body.appendChild(t);
      requestAnimationFrame(()=>{ t.style.opacity='0'; t.style.transform=`translate(-50%,-50%) translate(${wind.x*30+rand(-12,12)}px,${rand(14,30)}px) rotate(${rand(0,360)}deg)`; });
      setTimeout(()=>t.remove(),900);
    }
    let lastSpawn=0;
    function loop(t){
      const dt=t-last; last=t;
      const dx=mx-cx, dy=my-cy; cx+=dx*0.18; cy+=dy*0.18;
      const speed=Math.hypot(dx,dy);
      vrot += (Math.atan2(dy,Math.abs(dx)+.001)*0.06 + wind.x*0.5 - vrot)*0.1;
      rot += vrot + (RM?0:0.2);
      el.style.transform=`translate(${cx}px,${cy}px) translate(-50%,-50%) rotate(${rot}deg)`;
      if(!RM && speed>3 && t-lastSpawn>40){ spawnTrail(cx,cy); lastSpawn=t; }
      requestAnimationFrame(loop);
    }
    requestAnimationFrame(loop);
  }

  /* ---------- Parallax (subtle, scroll-driven) ---------- */
  function Parallax(){
    const layers=[...document.querySelectorAll('[data-depth]')];
    if(!layers.length) return;
    let ticking=false;
    function update(){
      const sc=window.scrollY;
      layers.forEach(l=>{
        const d=parseFloat(l.dataset.depth)||0;
        const base=l.dataset.base||'';
        l.style.transform=`${base} translate3d(0,${(sc*d).toFixed(1)}px,0)`;
      });
      ticking=false;
    }
    window.addEventListener('scroll',()=>{ if(!ticking){ requestAnimationFrame(update); ticking=true; } },{passive:true});
    update();
  }

  /* ---------- Scroll reveals ---------- */
  function Reveals(){
    const els=[...document.querySelectorAll('.reveal')];
    if(!('IntersectionObserver' in window)||RM){ els.forEach(e=>e.classList.add('in')); return; }
    const io=new IntersectionObserver((ents)=>{
      ents.forEach(en=>{ if(en.isIntersecting){ en.target.classList.add('in'); io.unobserve(en.target); } });
    },{threshold:.18, rootMargin:'0px 0px -8% 0px'});
    els.forEach(e=>io.observe(e));
  }

  /* ---------- Mushroom glow + firefly orbit (DOM-based accents) ---------- */
  function Mushrooms(){
    document.querySelectorAll('[data-mushroom]').forEach(m=>{
      if(m.dataset.built) return; m.dataset.built='1';
      m.innerHTML = `
      <svg viewBox="0 0 80 110" width="100%" height="100%">
        <defs><radialGradient id="mg" cx="50%" cy="30%" r="70%">
          <stop offset="0%" stop-color="#bfeef0"/><stop offset="55%" stop-color="#4fbfb6"/><stop offset="100%" stop-color="#1f5f63"/>
        </radialGradient></defs>
        <ellipse cx="40" cy="100" rx="22" ry="6" fill="rgba(79,191,182,.25)"/>
        <path d="M34 60 q-3 38 -2 40 q8 4 16 0 q1 -2 -2 -40 Z" fill="#dcd6c6"/>
        <path d="M8 56 q32 -46 64 0 q-32 22 -64 0 Z" fill="url(#mg)"/>
        <circle cx="28" cy="44" r="3" fill="#eafcfa" opacity=".8"/>
        <circle cx="48" cy="40" r="2.4" fill="#eafcfa" opacity=".7"/>
        <circle cx="56" cy="50" r="2" fill="#eafcfa" opacity=".6"/>
      </svg>`;
      m.style.filter='drop-shadow(0 0 18px rgba(79,191,182,.7))';
      m.style.animation='mush-pulse 4.5s ease-in-out infinite';
    });
  }

  /* inject keyframes once */
  const kf=document.createElement('style');
  kf.textContent=`
    @keyframes mush-pulse{0%,100%{filter:drop-shadow(0 0 12px rgba(79,191,182,.5))}50%{filter:drop-shadow(0 0 26px rgba(79,191,182,.95))}}
    .cursor-petal.bloom{ width:46px; height:46px; }
    .cursor-petal.bloom svg{ filter:drop-shadow(0 0 16px rgba(79,191,182,1)); }
    .cursor-petal.bloom #cpp{ d:path('M0,-12 C5,-9 9,-5 12,0 C9,5 5,9 0,12 C-5,9 -9,5 -12,0 C-9,-5 -5,-9 0,-12 Z'); }
    @keyframes float-soft{0%,100%{transform:translateY(0)}50%{transform:translateY(-14px)}}
    @keyframes sway{0%,100%{transform:rotate(-1.5deg)}50%{transform:rotate(1.5deg)}}
  `;
  document.head.appendChild(kf);

  /* ---------- Boot ---------- */
  function boot(){
    // build global fx canvas if a host exists
    const host=document.querySelector('.fx-canvas');
    if(host){ Field(host,{ petals: host.dataset.petals?+host.dataset.petals:34,
                           flies: host.dataset.flies?+host.dataset.flies:18 }).start(); }
    PetalCursor(); Parallax(); Reveals(); Mushrooms();
  }
  if(document.readyState==='loading') document.addEventListener('DOMContentLoaded',boot);
  else boot();

  window.Xenwinx = { Field, Reveals, Mushrooms };
})();
