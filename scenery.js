/* ============================================================
   XENWINX — Procedural sumi-e scenery (SVG string builders)
   Returns markup you inject into parallax layer divs.
   ============================================================ */
(function(){
  'use strict';
  // simple seeded RNG
  function rng(seed){ let s=seed||1; return ()=>{ s=(s*16807)%2147483647; return (s-1)/2147483646; }; }

  // jagged sumi-e mountain ridge filling bottom of a viewBox
  function mountainRange({w=1600,h=500,seed=1,peaks=6,rough=0.5,base=1,topColor='#9aa6aa',botColor='#5d6a6e',opacity=1,blur=0,id='m'}={}){
    const r = rng(seed);
    // build sharp peaks: each peak rises steeply then drops into a valley/saddle
    let pts=[[0,h]];
    let x=0;
    for(let i=0;i<peaks;i++){
      const segW = w/peaks;
      const baseX = i*segW;
      // ascent shoulder
      const peakX = baseX + segW*(0.32+r()*0.36);
      const peakY = h*(0.05 + r()*0.32*rough);
      const shoulderY = h*(0.45 + r()*0.25);
      // a small foothill before the peak
      const footX = baseX + segW*0.16;
      const footY = h*(0.6 + r()*0.2);
      pts.push([footX, footY]);
      pts.push([peakX, peakY]);
      // sharp descent into a saddle
      const saddleX = baseX + segW*(0.7+r()*0.2);
      const saddleY = h*(0.5 + r()*0.28);
      pts.push([saddleX, saddleY]);
    }
    pts.push([w, h*0.55]);
    pts.push([w, h]);
    let dp = 'M'+pts.map(p=>p[0].toFixed(1)+' '+p[1].toFixed(1)).join(' L ')+' Z';
    const fid='g'+id+seed;
    const bf = blur?`filter="url(#bl${fid})"`:'';
    return `<svg viewBox="0 0 ${w} ${h}" preserveAspectRatio="xMidYMax meet" style="width:100%;height:100%;display:block">
      <defs>
        <linearGradient id="${fid}" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stop-color="${topColor}"/><stop offset="62%" stop-color="${botColor}"/><stop offset="100%" stop-color="${botColor}"/>
        </linearGradient>
        ${blur?`<filter id="bl${fid}" x="-20%" y="-20%" width="140%" height="140%"><feGaussianBlur stdDeviation="${blur}"/></filter>`:''}
      </defs>
      <path d="${dp}" fill="url(#${fid})" opacity="${opacity}" ${bf}/>
    </svg>`;
  }

  // soft ink fog band
  function fogBand({w=1600,h=300,opacity=0.7,color='#f3f1ea'}={}){
    return `<svg viewBox="0 0 ${w} ${h}" preserveAspectRatio="none" style="width:100%;height:100%;display:block">
      <defs><radialGradient id="fg" cx="50%" cy="50%" r="60%"><stop offset="0%" stop-color="${color}" stop-opacity="${opacity}"/><stop offset="100%" stop-color="${color}" stop-opacity="0"/></radialGradient></defs>
      <ellipse cx="${w*0.3}" cy="${h*0.5}" rx="${w*0.4}" ry="${h*0.5}" fill="url(#fg)"/>
      <ellipse cx="${w*0.7}" cy="${h*0.6}" rx="${w*0.45}" ry="${h*0.45}" fill="url(#fg)"/>
      <ellipse cx="${w*0.5}" cy="${h*0.4}" rx="${w*0.5}" ry="${h*0.4}" fill="url(#fg)"/>
    </svg>`;
  }

  // stylized ink foliage / pine cluster (puffy ink blobs)
  function foliage({w=400,h=300,seed=2,color='#46565a',opacity=0.9,count=14}={}){
    const r=rng(seed); let blobs='';
    for(let i=0;i<count;i++){
      const cx=r()*w, cy=h-r()*h*0.7, rad=14+r()*40;
      blobs+=`<circle cx="${cx.toFixed(0)}" cy="${cy.toFixed(0)}" r="${rad.toFixed(0)}" />`;
    }
    return `<svg viewBox="0 0 ${w} ${h}" preserveAspectRatio="xMidYMax meet" style="width:100%;height:100%;display:block">
      <g fill="${color}" opacity="${opacity}" filter="url(#fb${seed})">${blobs}</g>
      <defs><filter id="fb${seed}"><feGaussianBlur stdDeviation="2"/></filter></defs>
    </svg>`;
  }

  // sakura branch with ice-blue blossoms
  function sakuraBranch({flip=false,scale=1,seed=3,blossoms=18}={}){
    const r=rng(seed);
    let flowers='';
    const pts=[];
    // main branch path
    const branch='M0 0 C 120 20 200 10 300 60 C 360 90 420 80 500 130';
    for(let i=0;i<blossoms;i++){
      const t=r(); const x=t*500*(0.2+r()*0.8); const y= (x*0.18) + (r()-0.5)*120 + 10;
      const s=0.5+r()*0.7;
      flowers+=blossom(x,y,s);
    }
    return `<svg viewBox="-20 -40 560 240" style="width:${360*scale}px;max-width:46vw;height:auto;display:block;${flip?'transform:scaleX(-1)':''}">
      <defs><radialGradient id="bl${seed}" cx="50%" cy="45%" r="60%"><stop offset="0%" stop-color="#eaf7fa"/><stop offset="60%" stop-color="#cfe9ee"/><stop offset="100%" stop-color="#8fbac3"/></radialGradient></defs>
      <path d="${branch}" stroke="#2b2520" stroke-width="7" fill="none" stroke-linecap="round"/>
      <path d="M120 14 C 150 -10 190 -20 230 -10" stroke="#2b2520" stroke-width="4" fill="none" stroke-linecap="round"/>
      <path d="M300 56 C 330 30 370 24 410 36" stroke="#2b2520" stroke-width="4" fill="none" stroke-linecap="round"/>
      ${flowers}
    </svg>`;
    function blossom(x,y,s){
      let p='';
      for(let k=0;k<5;k++){ const a=k*72; p+=`<path transform="rotate(${a} 0 0)" d="M0 0 C 3 -7 3 -12 0 -16 C -3 -12 -3 -7 0 0 Z" fill="url(#bl${seed})" stroke="#7fb6c0" stroke-width="0.5"/>`; }
      return `<g transform="translate(${x.toFixed(0)} ${y.toFixed(0)}) scale(${s.toFixed(2)})">${p}<circle r="1.8" fill="#d9b15a"/></g>`;
    }
  }

  // glowing blue mushroom lantern with fireflies
  function mushroom({scale=1,glow=true}={}){
    return `<svg viewBox="0 0 80 110" style="width:${70*scale}px;height:auto;display:block;overflow:visible">
      <defs>
        <radialGradient id="mg" cx="50%" cy="40%" r="60%"><stop offset="0%" stop-color="#dff6f9"/><stop offset="55%" stop-color="#7fd3d0"/><stop offset="100%" stop-color="#1c5f63"/></radialGradient>
        <radialGradient id="mglow" cx="50%" cy="40%" r="50%"><stop offset="0%" stop-color="rgba(120,220,215,.8)"/><stop offset="100%" stop-color="rgba(120,220,215,0)"/></radialGradient>
      </defs>
      ${glow?'<ellipse cx="40" cy="40" rx="46" ry="40" fill="url(#mglow)" class="mush-glow"/>':''}
      <path d="M22 70 Q20 100 28 104 L52 104 Q60 100 58 70 Z" fill="#cfe2e2"/>
      <ellipse cx="40" cy="44" rx="34" ry="26" fill="url(#mg)"/>
      <ellipse cx="40" cy="44" rx="34" ry="26" fill="none" stroke="#dff6f9" stroke-opacity="0.4"/>
      <circle cx="30" cy="40" r="3.5" fill="#eaffff" opacity="0.85"/>
      <circle cx="48" cy="48" r="2.6" fill="#eaffff" opacity="0.7"/>
      <circle cx="42" cy="34" r="2" fill="#eaffff" opacity="0.7"/>
    </svg>`;
  }

  // waterfall strip
  function waterfall({w=120,h=420}={}){
    return `<svg viewBox="0 0 ${w} ${h}" preserveAspectRatio="none" style="width:100%;height:100%;display:block">
      <defs><linearGradient id="wf" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stop-color="#f3f1ea" stop-opacity="0"/><stop offset="20%" stop-color="#f3f1ea" stop-opacity=".85"/><stop offset="100%" stop-color="#dfe9ea" stop-opacity=".6"/></linearGradient></defs>
      <rect x="${w*0.2}" width="${w*0.6}" height="${h}" fill="url(#wf)"/>
      <g stroke="#ffffff" stroke-opacity="0.6" stroke-width="2" class="wf-lines">
        <line x1="${w*0.35}" y1="0" x2="${w*0.35}" y2="${h}"/>
        <line x1="${w*0.5}" y1="0" x2="${w*0.5}" y2="${h}"/>
        <line x1="${w*0.65}" y1="0" x2="${w*0.65}" y2="${h}"/>
      </g>
    </svg>`;
  }

  window.Scenery = { mountainRange, fogBand, foliage, sakuraBranch, mushroom, waterfall };
})();
