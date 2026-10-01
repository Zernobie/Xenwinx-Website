/* ============================================================
   XENWINX — Character Showcase Card System
   ============================================================ */
(function(){
  const FLUMFY = [
    { id:'Verdant', home:{ name:'The World-Tree Grove', theme:'grove' },
      role:'Nature Guardian', rarity:'Epic', cls:'Guardian',
      tags:['Earth','Growth','Forest'], affinity:'Earth · Growth',
      desc:'Keeper of the living forest, patient as the ancient woods.',
      origin:'Sprung from the mossy roots of the world-tree, Verdant carries the calm of a thousand seasons and the strength of deep soil.',
      powers:'Commands vines and thorns; heals allies with spores of light.',
      equipment:'A living vine-bow that blossoms with every shot.',
      companion:'A circle of small forest spirits.',
      stats:{ Power:72, Magic:80, Speed:46, Spirit:92 },
      pal:{ accent:'#8ad24a', glow:'rgba(150,240,90,.55)', deep:'#14300d', bg1:'#213d18', bg2:'#0b1c07', ink:'#eaffd9' } },
    { id:'Sage', home:{ name:'The Frozen Fjords', theme:'frost' },
      role:'Crystal Spirit', rarity:'Legendary', cls:'Spirit',
      tags:['Water','Crystal','Frost'], affinity:'Water · Crystal',
      desc:'Ancient Nordic guardian of water and stone.',
      origin:'Carved from feather and ruin-stone on the frozen fjords, Sage still remembers the old songs sung beneath the ice.',
      powers:'Channels glacial water into crystal shards and protective wards.',
      equipment:'A runed feather-staff that hums with frost.',
      companion:'A flock of crystal ravens.',
      stats:{ Power:66, Magic:94, Speed:54, Spirit:84 },
      pal:{ accent:'#5ab6f0', glow:'rgba(120,210,255,.55)', deep:'#102740', bg1:'#163049', bg2:'#07111d', ink:'#e6f6ff' } },
    { id:'Rosie', home:{ name:'The Aurora Workshop', theme:'steam' },
      role:'The Explorer', rarity:'Rare', cls:'Explorer',
      tags:['Heart','Aether','Steam'], affinity:'Heart · Aether',
      desc:'A steampunk wanderer with a glowing heart of rose-light.',
      origin:'A tinkerer who maps the aurora itself, Rosie is guided ever onward by the warm rose-light beating at her core.',
      powers:'Fires beams of rose-light; lifts allies on brass wings.',
      equipment:'A clockwork glider and a heart-lantern of glowing beams.',
      companion:'A brass-feathered automaton bird.',
      stats:{ Power:58, Magic:74, Speed:72, Spirit:96 },
      pal:{ accent:'#ff6f96', glow:'rgba(255,150,180,.55)', deep:'#45152a', bg1:'#58203a', bg2:'#240c18', ink:'#ffe9f0' } },
    { id:'Lila', home:{ name:'The Moon-Cloud Isles', theme:'dream' },
      role:'Dream Weaver', rarity:'Mythic', cls:'Weaver',
      tags:['Dream','Illusion','Moon'], affinity:'Dream · Illusion',
      desc:'Mistress of moonlight, drifting between sleep and waking.',
      origin:'Born of moon and cloud, Lila slips between the sleeping and waking worlds, trailing stardust wherever she wanders.',
      powers:'Bends light into illusions; lulls foes with dream-mist.',
      equipment:'A crescent lantern that scatters mystical particles.',
      companion:'A trail of luminous moths.',
      stats:{ Power:60, Magic:98, Speed:62, Spirit:88 },
      pal:{ accent:'#b07bf0', glow:'rgba(200,150,255,.55)', deep:'#251248', bg1:'#34205c', bg2:'#150a2e', ink:'#f1e7ff' } },
    { id:'Ember', home:{ name:'The Fire Fox Hearth', theme:'ember' },
      role:'Fire Spirit', rarity:'Legendary', cls:'Spirit',
      tags:['Fire','Flame','Cinder'], affinity:'Fire · Flame',
      desc:'The brightest spark of the great Elden Fire Fox.',
      origin:'The brightest cinder of the Fire Fox’s fur, Ember burns with a warm, fearless courage that never gutters out.',
      powers:'Hurls living flame and rides thermals into the high sky.',
      equipment:'An ember-blade wreathed in cinematic fire.',
      companion:'Drifting embers that take wing.',
      stats:{ Power:92, Magic:78, Speed:80, Spirit:70 },
      pal:{ accent:'#ff7a2a', glow:'rgba(255,150,60,.6)', deep:'#34110a', bg1:'#3a1408', bg2:'#150503', ink:'#fff0e2' } },
  ];
  window.FLUMFY = FLUMFY;

  const palVars = p => `--accent:${p.accent};--glow:${p.glow};--deep:${p.deep};--bg1:${p.bg1};--bg2:${p.bg2};--ink:${p.ink};`;

  // per-home motif ring
  function motifSVG(t){
    const cx=100, cy=100, R=78, P=(n,f)=>{let s='';for(let k=0;k<n;k++){const a=(k/n)*Math.PI*2;s+=f(cx+R*Math.cos(a),cy+R*Math.sin(a),a*180/Math.PI);}return s;};
    let g='';
    if(t==='grove'){
      g=`<circle cx="100" cy="100" r="78" stroke-dasharray="2 5"/><circle cx="100" cy="100" r="60"/>`+P(10,(x,y,d)=>`<path transform="translate(${x} ${y}) rotate(${d+90})" d="M0 -9 C6 -4 6 4 0 9 C-6 4 -6 -4 0 -9 Z M0 -9 L0 9"/>`);
    } else if(t==='frost'){
      g=`<circle cx="100" cy="100" r="78"/><polygon points="100,30 160.6,65 160.6,135 100,170 39.4,135 39.4,65"/>`;
      for(let k=0;k<6;k++){const a=k*60;g+=`<g transform="rotate(${a} 100 100)"><line x1="100" y1="100" x2="100" y2="22"/><polyline points="92,40 100,48 108,40"/><polyline points="94,58 100,64 106,58"/></g>`;}
    } else if(t==='steam'){
      let teeth='';for(let k=0;k<16;k++){const a=k*22.5;teeth+=`<rect x="96" y="14" width="8" height="10" transform="rotate(${a} 100 100)"/>`;}
      g=`<circle cx="100" cy="100" r="76"/><circle cx="100" cy="100" r="56" stroke-dasharray="1 4"/>`+teeth+P(8,(x,y)=>'').replace('','')+`<circle cx="100" cy="100" r="22"/>`;
      for(let k=0;k<6;k++){g+=`<line x1="100" y1="78" x2="100" y2="44" transform="rotate(${k*60} 100 100)"/>`;}
    } else if(t==='dream'){
      g=`<circle cx="100" cy="100" r="78" stroke-dasharray="1 6"/><path d="M118 40 A62 62 0 1 0 118 160 A50 50 0 1 1 118 40 Z"/>`+P(9,(x,y)=>`<path transform="translate(${x} ${y})" d="M0 -6 Q1 -1 6 0 Q1 1 0 6 Q-1 1 -6 0 Q-1 -1 0 -6 Z"/>`);
    } else {
      g=`<circle cx="100" cy="100" r="58"/>`+P(14,(x,y,d)=>`<path transform="translate(${x} ${y}) rotate(${d+90})" d="M0 12 C-6 6 -5 -2 0 -12 C1 -5 6 -2 5 4 C4 9 2 11 0 12 Z"/>`);
    }
    return `<svg viewBox="0 0 200 200" preserveAspectRatio="xMidYMid meet">${g}</svg>`;
  }
  function particles(n){
    let s='';
    for(let k=0;k<n;k++){
      const left=8+Math.random()*84, dur=5+Math.random()*5, dl=Math.random()*6, bottom=6+Math.random()*30;
      s+=`<i style="left:${left.toFixed(1)}%;bottom:${bottom.toFixed(0)}%;--dur:${dur.toFixed(1)}s;--dl:${dl.toFixed(1)}s"></i>`;
    }
    return s;
  }

  function cardHTML(f,i){
    return `
    <article class="ccard" data-i="${i}" data-theme="${f.home.theme}" style="${palVars(f.pal)}">
      <div class="cc-body">
        <span class="cc-corner tl"></span><span class="cc-corner tr"></span>
        <span class="cc-corner bl"></span><span class="cc-corner br"></span>
        <div class="cc-stage">
          <div class="cc-home-bg"><img src="${f.id}-home.png" alt="${f.home.name}, ${f.id}'s home"></div>
          <div class="cc-atmos"></div>
          <span class="cc-shape ring2"></span>
          <span class="cc-shape ring"></span>
          <span class="cc-shape disc"></span>
          <div class="cc-motif">${motifSVG(f.home.theme)}</div>
          <span class="cc-shape diamond d1"></span>
          <span class="cc-shape diamond d2"></span>
          <span class="cc-shape diamond d3"></span>
          <div class="cc-halo"></div>
          <div class="cc-trail t1"></div><div class="cc-trail t2"></div>
          <div class="cc-particles">${particles(9)}</div>
        </div>
        <div class="cc-info">
          <div class="cc-toprow">
            <span class="cc-rarity">${f.rarity}</span>
            <span class="cc-class">${f.cls}</span>
          </div>
          <div class="cc-homename">${f.home.name}</div>
          <div class="cc-role">${f.role}</div>
          <h3 class="cc-name">${f.id}</h3>
          <div class="cc-rule"></div>
          <p class="cc-desc">${f.desc}</p>
          <div class="cc-tags">${f.tags.map(t=>`<span class="cc-tag">${t}</span>`).join('')}</div>
          <button class="cc-cta" type="button" data-open="${i}">View Lore</button>
        </div>
      </div>
      <img class="cc-char" src="${f.id}.png" alt="${f.id}, ${f.role}">
    </article>`;
  }

  const carousel = document.getElementById('cc-carousel');
  if(!carousel) return;
  carousel.innerHTML = FLUMFY.map(cardHTML).join('');
  // Chrome ignores padding-right on overflow-scroll flex — add real spacer so last card can center
  const trailSpacer = document.createElement('span');
  trailSpacer.setAttribute('aria-hidden','true');
  trailSpacer.className = 'cc-trail-spacer';
  carousel.appendChild(trailSpacer);
  const cards = [...carousel.querySelectorAll('.ccard')];

  // dots
  const dotsWrap = document.getElementById('cc-dots');
  if(dotsWrap){
    dotsWrap.innerHTML = FLUMFY.map((f,i)=>`<button class="cc-dot" data-dot="${i}" aria-label="${f.id}"></button>`).join('');
  }
  const dots = dotsWrap ? [...dotsWrap.querySelectorAll('.cc-dot')] : [];

  // ---- active-card detection ----
  let activeIdx = 0, ticking=false;
  function updateActive(){
    const mid = carousel.scrollLeft + carousel.clientWidth/2;
    let best=0, bestD=Infinity;
    cards.forEach((c,i)=>{
      const center = c.offsetLeft + c.offsetWidth/2;
      const d = Math.abs(center - mid);
      if(d<bestD){ bestD=d; best=i; }
    });
    if(best!==activeIdx || !cards[best].classList.contains('is-active')){
      activeIdx=best;
      cards.forEach((c,i)=>c.classList.toggle('is-active', i===best));
      dots.forEach((d,i)=>d.classList.toggle('on', i===best));
    }
    ticking=false;
  }
  carousel.addEventListener('scroll', ()=>{ if(!ticking){ requestAnimationFrame(updateActive); ticking=true; } }, {passive:true});
  window.addEventListener('resize', ()=>requestAnimationFrame(updateActive));

  function scrollToCard(i){
    const c=cards[i]; if(!c) return;
    const left = c.offsetLeft - (carousel.clientWidth - c.offsetWidth)/2;
    carousel.scrollTo({ left, behavior:'smooth' });
  }
  document.getElementById('cc-prev')?.addEventListener('click', ()=>scrollToCard(Math.max(0,activeIdx-1)));
  document.getElementById('cc-next')?.addEventListener('click', ()=>scrollToCard(Math.min(cards.length-1,activeIdx+1)));
  dots.forEach(d=>d.addEventListener('click', ()=>scrollToCard(+d.dataset.dot)));

  // ---- hover tilt (fine pointers only) ----
  const fine = matchMedia('(hover:hover)').matches && matchMedia('(pointer:fine)').matches;
  if(fine){
    cards.forEach(card=>{
      const body=card.querySelector('.cc-body');
      card.addEventListener('pointermove', e=>{
        const r=card.getBoundingClientRect();
        const px=(e.clientX-r.left)/r.width-0.5, py=(e.clientY-r.top)/r.height-0.5;
        body.style.setProperty('--ry', (px*10).toFixed(2)+'deg');
        body.style.setProperty('--rx', (-py*10).toFixed(2)+'deg');
      });
      card.addEventListener('pointerleave', ()=>{ body.style.setProperty('--ry','0deg'); body.style.setProperty('--rx','0deg'); });
    });
  }

  // ---- expand modal ----
  const modal = document.createElement('div');
  modal.className='cx-modal'; modal.id='cx-modal';
  modal.innerHTML = `
    <div class="cx-panel" id="cx-panel">
      <button class="cx-close" id="cx-close" aria-label="Close">×</button>
      <div class="cx-stage">
        <div class="cx-glow"></div>
        <div class="cx-ring b"></div><div class="cx-ring a"></div>
        <div class="cx-particles" id="cx-particles"></div>
        <img class="cx-char" id="cx-char" alt="">
        <button class="cx-nav-arrow" id="cx-prev" style="left:18px">‹ Prev</button>
        <button class="cx-nav-arrow" id="cx-next" style="right:18px">Next ›</button>
      </div>
      <div class="cx-doc" id="cx-doc"></div>
      <div class="cx-scroll-hint hidden" id="cx-sh" aria-hidden="true">
        <svg width="22" height="22" viewBox="0 0 22 22" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="4 8 11 15 18 8"/></svg>
      </div>
    </div>`;
  document.body.appendChild(modal);
  const panel=modal.querySelector('#cx-panel');
  const cxChar=modal.querySelector('#cx-char');
  const cxDoc=modal.querySelector('#cx-doc');
  const cxParticles=modal.querySelector('#cx-particles');
  let cxIdx=0;

  function fillModal(i){
    cxIdx=i; const f=FLUMFY[i];
    panel.setAttribute('style', palVars(f.pal)); panel.dataset.theme=f.home.theme;
    cxChar.classList.remove('cx-entered');
    cxChar.src=`${f.id}.png`; cxChar.alt=`${f.id}, ${f.role}`;
    cxParticles.innerHTML=particles(10);
    const bars=Object.entries(f.stats).map(([k,v])=>
      `<div class="cx-stat"><span>${k}</span><div class="cx-bar"><i data-v="${v}"></i></div></div>`).join('');
    cxDoc.innerHTML=`
      <div class="cx-toprow"><span class="cx-rarity">${f.rarity}</span><span class="cc-class">${f.cls}</span></div>
      <div class="cx-role">${f.role}</div>
      <h3>${f.id}</h3>
      <div class="cx-rule"></div>
      <p>${f.origin}</p>
      <div class="cx-tags">${f.tags.map(t=>`<span class="cc-tag">${t}</span>`).join('')}</div>
      <div class="cx-stats">${bars}</div>
      <dl class="cx-dl">
        <dt>Elemental Affinity</dt><dd>${f.affinity}</dd>
        <dt>Powers</dt><dd>${f.powers}</dd>
        <dt>Equipment</dt><dd>${f.equipment}</dd>
        <dt>Companion</dt><dd>${f.companion}</dd>
      </dl>
      <div class="cx-home">
        <div class="cx-home-label">✦ Home · ${f.home.name}</div>
        <img class="cx-home-img" src="${f.id}-home.png" alt="${f.home.name}, ${f.id}'s home">
      </div>`;
    requestAnimationFrame(()=>{ cxDoc.querySelectorAll('.cx-bar i').forEach(b=>{ b.style.width=b.dataset.v+'%'; }); requestAnimationFrame(()=>{ cxChar.classList.add('cx-entered'); }); });
  }
  const cxSh = modal.querySelector('#cx-sh');

  function updateScrollHint(){
    if(!cxSh) return;
    const needsScroll = cxDoc.scrollHeight > cxDoc.clientHeight + 20;
    const atBottom = cxDoc.scrollTop + cxDoc.clientHeight >= cxDoc.scrollHeight - 24;
    cxSh.classList.toggle('hidden', !needsScroll || atBottom);
  }
  cxDoc.addEventListener('scroll', updateScrollHint, {passive:true});

  function openModal(i){
    fillModal(i);
    modal.classList.add('open');
    document.body.style.overflow='hidden';
    cxDoc.scrollTop = 0;
    setTimeout(updateScrollHint, 120);
  }
  function closeModal(){ modal.classList.remove('open'); document.body.style.overflow=''; }

  carousel.addEventListener('click', e=>{
    const btn=e.target.closest('[data-open]');
    const card=e.target.closest('.ccard');
    if(btn){ openModal(+btn.dataset.open); return; }
    if(card){ // click body of a non-active card → center it; active → open
      const i=+card.dataset.i;
      if(i===activeIdx) openModal(i); else scrollToCard(i);
    }
  });
  modal.querySelector('#cx-close').addEventListener('click', closeModal);
  modal.querySelector('#cx-prev').addEventListener('click', ()=>fillModal((cxIdx-1+FLUMFY.length)%FLUMFY.length));
  modal.querySelector('#cx-next').addEventListener('click', ()=>fillModal((cxIdx+1)%FLUMFY.length));
  modal.addEventListener('click', e=>{ if(e.target===modal) closeModal(); });
  addEventListener('keydown', e=>{
    if(!modal.classList.contains('open')) return;
    if(e.key==='Escape') closeModal();
    if(e.key==='ArrowLeft') fillModal((cxIdx-1+FLUMFY.length)%FLUMFY.length);
    if(e.key==='ArrowRight') fillModal((cxIdx+1)%FLUMFY.length);
  });

  // init: center the first card and activate it
  requestAnimationFrame(()=>{ scrollToCard(0); setTimeout(updateActive, 300); });
})();
