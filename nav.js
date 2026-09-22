/* ============================================================
   XENWINX — Floating Navigation + Animated Logo + Merch Drawer
   Auto-mounts from <body data-page="home|about|...">.
   ============================================================ */
(function(){
  const PAGES = [
    ['home','Home','index.html'],
    ['about','About','about.html'],
    ['store','Store','store.html'],
    ['apps','Apps','apps.html'],
    ['games','Games','games.html'],
    ['faq','FAQ','faq.html'],
    ['contact','Contact','contact.html'],
  ];
  const current = document.body.dataset.page || 'home';

  /* ---- emblem: swap to real PNG when uploaded (logo-emblem.png) ---- */
  const emblemSVG = `<svg viewBox="0 0 60 60" width="38" height="38" aria-hidden="true">
    <circle cx="30" cy="30" r="26" fill="none" stroke="#1f5f63" stroke-width="1.4" opacity=".5"/>
    <path d="M30 8 a22 22 0 0 1 0 44" fill="none" stroke="#1f5f63" stroke-width="3" stroke-linecap="round"/>
    <path d="M30 14 a16 16 0 0 0 0 32" fill="none" stroke="#4fbfb6" stroke-width="2.4" stroke-linecap="round"/>
    <path d="M30 22 L37 30 L30 38 L23 30 Z" fill="#1f5f63"/>
    <circle cx="30" cy="30" r="2.4" fill="#cfe2ec"/>
  </svg>`;

  const nav = document.createElement('header');
  nav.className = 'xn-nav';
  nav.innerHTML = `
    <a class="xn-brand" href="index.html" aria-label="Xenwinx Studio home">
      <span class="xn-emblem" id="xnEmblem">${emblemSVG}</span>
      <span class="xn-word"><span class="xn-type" id="xnType"></span><span class="xn-caret">|</span></span>
    </a>
    <button class="xn-burger" id="xnBurger" aria-label="Menu"><span></span><span></span><span></span></button>
    <nav class="xn-links" id="xnLinks">
      ${PAGES.map(p=>`<a href="${p[2]}" data-k="${p[0]}" class="${p[0]===current?'active':''}">${p[1]}</a>`).join('')}
      <button class="xn-merch" id="xnMerch">Merchandise</button>
    </nav>`;
  document.body.appendChild(nav);

  /* ---- typing animation for "Xenwinx Studio" ---- */
  const typeEl = nav.querySelector('#xnType');
  const word = 'Xenwinx Studio';
  let ti=0;
  function type(){ if(ti<=word.length){ typeEl.textContent=word.slice(0,ti++); setTimeout(type, 85); } }
  setTimeout(type, 600);

  /* ---- logo emblem loop: roll in → stop → pulse → bounce → roll out ---- */
  const emblem = nav.querySelector('#xnEmblem');
  emblem.style.display='inline-flex';

  /* ---- mobile menu ---- */
  const burger = nav.querySelector('#xnBurger');
  const links = nav.querySelector('#xnLinks');
  burger.addEventListener('click',()=>{ nav.classList.toggle('open'); });

  /* ---- nav shrink on scroll ---- */
  let lastY=0;
  window.addEventListener('scroll',()=>{
    const y=window.scrollY;
    nav.classList.toggle('scrolled', y>40);
    lastY=y;
  },{passive:true});

  /* ===========================================================
     MERCHANDISE — collapsing side drawer
     =========================================================== */
  const drawer = document.createElement('div');
  drawer.className='xn-drawer-root';
  drawer.innerHTML = `
    <div class="xn-drawer-scrim" id="xnScrim"></div>
    <aside class="xn-drawer" role="dialog" aria-label="Merchandise">
      <button class="xn-drawer-close" id="xnClose" aria-label="Close">✕</button>
      <p class="kicker">Coming Soon</p>
      <h2 class="xn-drawer-title">The Merchandise Realm</h2>
      <p class="xn-drawer-sub serif-it">Treasures forged from the Xenwinx world are nearly ready. A glimpse of what's coming:</p>
      <div class="xn-merch-groups">
        <div class="xn-merch-group">
          <h4>Desktop</h4>
          <ul><li>Lamps</li><li>Stationery holders</li><li>Mouse pads</li><li>Headset stands</li><li>Piggy banks</li></ul>
        </div>
        <div class="xn-merch-group">
          <h4>Paper &amp; Prints</h4>
          <ul><li>30+ Journals</li><li>Magnetic bookmarks</li><li>Concept-art posters</li></ul>
        </div>
        <div class="xn-merch-group">
          <h4>3D &amp; Collectibles</h4>
          <ul><li>3D character prints</li></ul>
        </div>
        <div class="xn-merch-group">
          <h4>Apparel</h4>
          <ul><li>Hoodies &amp; crewnecks</li><li>T-shirts</li><li>Beanies &amp; caps</li><li>Socks, scarves, gloves</li><li>Masks</li></ul>
        </div>
      </div>
      <label class="xn-notify">
        <span>Be first through the gate</span>
        <span class="xn-notify-row"><input type="email" placeholder="your@email.com" aria-label="Email"><button class="btn btn-primary">Notify Me</button></span>
      </label>
    </aside>`;
  document.body.appendChild(drawer);

  function openDrawer(){ drawer.classList.add('open'); document.body.style.overflow='hidden'; }
  function closeDrawer(){ drawer.classList.remove('open'); document.body.style.overflow=''; }
  nav.querySelector('#xnMerch').addEventListener('click',openDrawer);
  drawer.querySelector('#xnScrim').addEventListener('click',closeDrawer);
  drawer.querySelector('#xnClose').addEventListener('click',closeDrawer);
  document.addEventListener('keydown',e=>{ if(e.key==='Escape') closeDrawer(); });
  drawer.querySelector('.xn-notify button').addEventListener('click',function(){
    const i=drawer.querySelector('.xn-notify input'); if(i.value){ this.textContent='✓ On the list'; i.disabled=true; }
  });

  window.XenwinxMerch = { open:openDrawer, close:closeDrawer };
})();
