// ---------- Helpers ----------
const $ = (s)=>document.querySelector(s);
const $$ = (s)=>Array.from(document.querySelectorAll(s));
const clamp=(n,a,b)=>Math.max(a,Math.min(b,n));

// ---------- Year ----------
$('#year').textContent = new Date().getFullYear();

// ---------- Reveal on Scroll ----------
const revealEls = $$('[data-animate]');
revealEls.forEach(el=>el.classList.add('reveal'));
const io = new IntersectionObserver((entries)=>{
  for (const e of entries){
    if (e.isIntersecting){ e.target.classList.add('in'); io.unobserve(e.target); }
  }
},{threshold:.15});
revealEls.forEach(el=>io.observe(el));

// ---------- Hero Canvas FX ----------
const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const canvas = $('#heroFx');
const ctx = canvas.getContext('2d', {alpha:true});
let w=0,h=0, time=0, mouseX=0, mouseY=0;
function size(){ w=canvas.width=canvas.clientWidth; h=canvas.height=canvas.clientHeight; }
function loop(){
  if (prefersReduced) return;
  time+=0.008; ctx.clearRect(0,0,w,h);
  const cx=w/2, cy=h*0.4;
  for(let i=0;i<12;i++){
    const ang = i*(Math.PI*2/12) + time;
    const len = h*0.9 + Math.sin(time*2+i)*20;
    const x2 = cx + Math.cos(ang)*(len + mouseX*0.03);
    const y2 = cy + Math.sin(ang)*(len + mouseY*0.03);
    const grad = ctx.createLinearGradient(cx,cy,x2,y2);
    grad.addColorStop(0,'rgba(245,214,123,0.08)');
    grad.addColorStop(1,'rgba(212,175,55,0)');
    ctx.strokeStyle = grad; ctx.lineWidth = 2;
    ctx.beginPath(); ctx.moveTo(cx,cy); ctx.lineTo(x2,y2); ctx.stroke();
  }
  requestAnimationFrame(loop);
}
function onMove(e){
  const r = canvas.getBoundingClientRect();
  mouseX = (e.clientX - r.left) - w/2;
  mouseY = (e.clientY - r.top) - h/2;
}
window.addEventListener('resize', size, {passive:true});
canvas.addEventListener('mousemove', onMove, {passive:true});
size(); requestAnimationFrame(loop);

// ---------- Best-time Suggestions ----------
function nextWindows(platform, count=6){
  const now = new Date();
  const slots = [];
  const addSlot = (d, h, m) => {
    const t = new Date(d); t.setHours(h,m,0,0);
    if (t > now) slots.push(t);
  };
  for (let i=0;i<14;i++){
    const d = new Date(); d.setDate(now.getDate()+i);
    const wd = d.getDay(); // 0 Sun ... 6 Sat
    if (platform === 'X'){
      [[7,30],[12,0],[17,0]].forEach(([h,m])=>addSlot(d,h,m));
      if (wd>=2 && wd<=4) addSlot(d,19,0);
    } else {
      addSlot(d,8,0); addSlot(d,9,0); addSlot(d,12,0); addSlot(d,13,0);
      if (wd===2 || wd===4) addSlot(d,10,0);
    }
  }
  return slots.slice(0,count);
}
function fmtTime(d){
  return new Intl.DateTimeFormat(undefined,{weekday:'short', hour:'2-digit', minute:'2-digit'}).format(d);
}
function renderTimes(){
  $('#times-x').innerHTML  = nextWindows('X',6).map(d=>`<li>${fmtTime(d)}</li>`).join('');
  $('#times-li').innerHTML = nextWindows('LinkedIn',6).map(d=>`<li>${fmtTime(d)}</li>`).join('');
}
renderTimes();

// ---------- Generator ----------
const hashtagSeeds = {
  generic: ['#SmallBusiness','#Entrepreneur','#LocalBusiness','#Growth','#Marketing','#AI'],
  retail: ['#ShopLocal','#RetailTips','#ProductLaunch','#Ecommerce'],
  services: ['#Trades','#HomeServices','#BookNow','#NearMe'],
  fitness: ['#FitnessBusiness','#Coaching','#GymOwner','#PT'],
  food: ['#FoodBusiness','#Cafe','#Coffee','#StreetFood'],
  creator: ['#CreatorEconomy','#ContentStrategy','#PersonalBrand']
};
function nicheKey(n=''){
  const s = n.toLowerCase();
  if (s.match(/retail|store|shop|boutique|ecom|e-commerce/)) return 'retail';
  if (s.match(/coach|fitness|gym|trainer|pt/)) return 'fitness';
  if (s.match(/restaurant|cafe|coffee|food|bar/)) return 'food';
  if (s.match(/plumber|electrician|builder|trades?|service/)) return 'services';
  if (s.match(/creator|influencer|personal brand/)) return 'creator';
  return 'generic';
}
function pickTags(niche, n=4){
  const pools = ['generic']; const key = nicheKey(niche); if (key!=='generic') pools.push(key);
  const bag = pools.flatMap(k=>hashtagSeeds[k]||[]); const uniq = Array.from(new Set(bag)); const out=[];
  while(out.length < Math.max(3, Math.min(n,6)) && uniq.length){ out.push(uniq.splice(Math.floor(Math.random()*uniq.length),1)[0]); }
  return out;
}
function capFirst(str){ return str.replace(/^\s*([a-z])/,(m,c)=>c.toUpperCase()); }
function makeHook(niche, offer, tone){
  const starts = {
    helpful:  ["Quick win for growth:", "Here's a smarter move:", "Stop guessing your posts."],
    concise:  ["Heads up:", "Fast tip:", "Real talk:"],
    friendly: ["Hey team —", "Small biz win:", "Let's grow this week:"],
    bold:     ["Stop the scroll.", "Own your niche.", "This is how you win:"]
  }[tone] || ["Let's grow:"];
  const s = starts[Math.floor(Math.random()*starts.length)];
  const nicheBit = niche ? ` ${niche.trim()}` : " your business";
  const offerBit = offer ? ` with ${offer.trim()}` : "";
  return `${s} ${capFirst(nicheBit)} can grow${offerBit}.`;
}
function makeBody(niche, offer){
  const benefit = [
    "Post smarter and reach more customers",
    "Turn views into bookings and sales",
    "Save time while staying consistent",
    "Stand out with clean, on-brand posts"
  ];
  const proof = [
    "Proven hooks + rotating hashtags",
    "Best-time scheduler built-in",
    "A/B your first line and keep the winner",
    "Export CSV/ICS to plug into your tools"
  ];
  const b = benefit[Math.floor(Math.random()*benefit.length)];
  const p = proof[Math.floor(Math.random()*proof.length)];
  const off = offer ? ` Offer: ${offer}.` : "";
  return `${b}. ${p}.${off}`;
}
function makeCTA(){
  const ct = [
    "Want a done-for-you first draft? Tap to try free.",
    "Ready to grow? Book a quick demo.",
    "Grab today's best-time slot and post.",
    "Claim your Pro trial — see the data."
  ];
  return ct[Math.floor(Math.random()*ct.length)];
}
function enforcePlatformLimits(text, platform){
  const limit = platform==='X' ? 280 : 1200;
  if (text.length<=limit) return text;
  const lines=text.split('\n'); let out='';
  for (const line of lines){ if ((out+'\n'+line).length>limit-3) break; out+=(out?'\n':'')+line; }
  return out.trim().slice(0,limit-1)+'…';
}
function postJSON({text, alt, imgHint, hashtags}){ return {text, alt_text:alt, suggested_image:imgHint, hashtags}; }
function makePosts({niche, offer, tone, platform, audience, count}){
  const posts=[];
  for (let i=0;i<count;i++){
    const hook=makeHook(niche,offer,tone);
    const body=makeBody(niche,offer);
    const cta=makeCTA();
    const tags=pickTags(niche,3+(i%4)); // 3–6
    let text=`${hook}\n\n${body}\n\n${cta}\n${tags.join(' ')}`;
    text=enforcePlatformLimits(text,platform);
    const alt="Minimal black & gold graphic with clean headline and subtle gradient frame.";
    const img="Dark brown/black background, shiny gold title text, subtle border — SmartFlow Systems style.";
    posts.push(postJSON({text,alt,imgHint:img,hashtags:tags}));
  }
  return posts;
}
// Render posts
function escapeHtml(s){ return s.replace(/[&<>]/g, c=>({'&':'&amp;','<':'&lt;','>':'&gt;'}[c])); }
function escapeAttr(s){ return s.replace(/"/g,'&quot;'); }
function hookScore(text){
  const first = text.split('\n')[0]||''; let score=50 + Math.max(0, Math.min(30, 80-first.length)); if(/stop|win|grow|today|free|new/i.test(first)) score+=10;
  return Math.max(40, Math.min(95, Math.round(score)));
}
let lastGenerated = { posts: [], platform: 'LinkedIn' };
function renderPosts(posts, platform){
  const wrap = $('#outputs'); wrap.innerHTML='';
  posts.forEach(p=>{
    const pretty = JSON.stringify(p,null,2);
    const el=document.createElement('div'); el.className='post reveal in';
    el.innerHTML=`
      <div class="meta">
        <span class="pill">${platform}</span>
        <span class="pill">Hook score: ${hookScore(p.text)}</span>
        <span class="pill">Hashtags: ${p.hashtags.length}</span>
      </div>
      <pre>${escapeHtml(pretty)}</pre>
      <div class="actions">
        <button class="btn small glow" data-copy="${escapeAttr(p.text)}">Copy text</button>
        <button class="btn small glow" data-copy="${escapeAttr(p.hashtags.join(' '))}">Copy hashtags</button>
      </div>
    `;
    wrap.appendChild(el);
  });
  $('#exports').classList.toggle('hidden', posts.length===0);
  $$('#outputs .actions .btn').forEach(btn=>{
    btn.addEventListener('click', ()=>{
      const txt=btn.getAttribute('data-copy');
      navigator.clipboard.writeText(txt.replace(/&quot;/g,'"'));
      const prev=btn.textContent; btn.textContent='Copied!'; setTimeout(()=>btn.textContent=prev, 900);
    })
  });
}
// Exports
function download(filename, content, type='text/plain'){
  const blob=new Blob([content],{type}); const url=URL.createObjectURL(blob);
  const a=document.createElement('a'); a.href=url; a.download=filename; a.click(); URL.revokeObjectURL(url);
}
function toCSV(posts, platform){
  const esc=v=>`"${String(v).replace(/"/g,'""')}"`;
  const rows=[['platform','text','hashtags','alt_text','suggested_image'].map(esc).join(',')];
  posts.forEach(p=>rows.push([platform,p.text,p.hashtags.join(' '),p.alt_text,p.suggested_image].map(esc).join(',')));
  return rows.join('\n');
}
function toICS(posts){
  const now=new Date(); const base=nextWindows('LinkedIn', posts.length);
  const lines=['BEGIN:VCALENDAR','VERSION:2.0','PRODID:-//SmartFlow Systems//AIbot Social//EN'];
  const fmt=d=>d.toISOString().replace(/[-:]/g,'').split('.')[0]+'Z';
  posts.forEach((p,i)=>{
    const start=base[i]||new Date(now.getTime()+ (i+1)*3600e3);
    const end=new Date(start.getTime()+30*60e3);
    lines.push('BEGIN:VEVENT',`UID:${Math.random().toString(36).slice(2)+Date.now().toString(36)}@sfs`,
      `DTSTAMP:${fmt(new Date())}`,`DTSTART:${fmt(start)}`,`DTEND:${fmt(end)}`,
      `SUMMARY:Post: ${p.text.slice(0,60)}`,`DESCRIPTION:${p.text.replace(/\n/g,'\\n')}`,'END:VEVENT');
  });
  lines.push('END:VCALENDAR'); return lines.join('\n');
}
// Form wiring
function restore(){
  try{
    const s=JSON.parse(localStorage.getItem('smartflow-settings')||'{}');
    if(s.niche) $('#niche').value=s.niche;
    if(s.offer) $('#offer').value=s.offer;
    if(s.tone) $('#tone').value=s.tone;
    if(s.platform) $('#platform').value=s.platform;
    if(s.audience) $('#audience').value=s.audience;
    if(s.count) $('#count').value=s.count;
  }catch(e){}
}
function save(state){ localStorage.setItem('smartflow-settings', JSON.stringify(state)); }
document.addEventListener('DOMContentLoaded', ()=>{
  restore();
  $('#gen-form').addEventListener('submit', (e)=>{
    e.preventDefault();
    const niche=$('#niche').value.trim();
    const offer=$('#offer').value.trim();
    const tone=$('#tone').value;
    const platform=$('#platform').value;
    const audience=$('#audience').value.trim();
    const count=Math.max(1, Math.min(parseInt($('#count').value||'3',10),10));
    const posts=makePosts({niche,offer,tone,platform,audience,count});
    lastGenerated={posts,platform};
    renderPosts(posts, platform);
    save({niche,offer,tone,platform,audience,count});
  });
  $('#clear').addEventListener('click', ()=>{ $('#outputs').innerHTML=''; $('#exports').classList.add('hidden'); });
  $('#downloadCsv').addEventListener('click', ()=>download('smartflow_posts.csv', toCSV(lastGenerated.posts,lastGenerated.platform), 'text/csv'));
  $('#downloadIcs').addEventListener('click', ()=>download('smartflow_schedule.ics', toICS(lastGenerated.posts), 'text/calendar'));
});

// ---------- Service Worker registration & Update Toast ----------
if ('serviceWorker' in navigator){
  window.addEventListener('load', ()=>{
    navigator.serviceWorker.register('sw.js').then(reg=>{
      // Update found
      reg.addEventListener('updatefound', ()=>{
        const nw = reg.installing;
        if (!nw) return;
        nw.addEventListener('statechange', ()=>{
          if (nw.state==='installed' && navigator.serviceWorker.controller){
            showUpdateToast(()=> nw.postMessage({type:'SKIP_WAITING'}));
          }
        });
      });
      // When controller changes (new SW active), refresh
      navigator.serviceWorker.addEventListener('controllerchange', ()=> window.location.reload());
    }).catch(console.error);
  });
}
function showUpdateToast(onRefresh){
  const toast = $('#update-toast');
  const btn = $('#refresh-now');
  const dismiss = $('#dismiss-toast');
  if (!toast) return;
  toast.hidden = false;
  btn.onclick = onRefresh;
  dismiss.onclick = ()=> toast.hidden = true;
}