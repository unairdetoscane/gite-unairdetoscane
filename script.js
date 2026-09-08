const cfg=window.GITE_CONFIG;
const navBtn=document.querySelector('.nav-toggle'),nav=document.querySelector('.main-nav');
navBtn.addEventListener('click',()=>{nav.classList.toggle('open');navBtn.setAttribute('aria-expanded',nav.classList.contains('open'))});
document.querySelectorAll('.main-nav a').forEach(a=>a.addEventListener('click',()=>nav.classList.remove('open')));
const phone=document.getElementById('phoneLink');phone.textContent=cfg.phone;phone.href=`tel:${cfg.phoneHref}`;
const calendarUpdated=document.getElementById('calendarUpdated');
calendarUpdated.textContent=cfg.lastCalendarUpdate;
let activeBookedRanges=Array.isArray(cfg.bookedRanges)?[...cfg.bookedRanges]:[];
let availabilityReady=false;
const checkDatesButton=document.getElementById('checkDates');
if(checkDatesButton)checkDatesButton.disabled=true;
function iso(d){return d.toISOString().slice(0,10)}
function inRange(date,r){return date>=new Date(r.from+'T00:00:00')&&date<new Date(r.to+'T00:00:00')}
function isBooked(d){return activeBookedRanges.some(r=>inRange(d,r))}
let view=new Date();view=new Date(view.getFullYear(),view.getMonth(),1);const months=['janvier','février','mars','avril','mai','juin','juillet','août','septembre','octobre','novembre','décembre'];
function renderCalendar(){const cal=document.getElementById('calendar');cal.innerHTML='';document.getElementById('calendarTitle').textContent=`${months[view.getMonth()]} ${view.getFullYear()}`;const first=(view.getDay()+6)%7;const start=new Date(view.getFullYear(),view.getMonth(),1-first);const today=new Date();today.setHours(0,0,0,0);for(let i=0;i<42;i++){const d=new Date(start);d.setDate(start.getDate()+i);const el=document.createElement('div');el.className='day';if(d.getMonth()!==view.getMonth())el.classList.add('other');if(isBooked(d))el.classList.add('booked');if(d.getTime()===today.getTime())el.classList.add('today');el.textContent=d.getDate();el.title=isBooked(d)?'Réservé':`${cfg.baseNightlyRate} € / nuit jusqu’à ${cfg.baseGuests} personnes`;cal.appendChild(el)}}
renderCalendar();
async function loadBookingAvailability(){
  // Chaque site lit le calendrier de SON dépôt. Sur github.io, le nom du dépôt
  // est déduit automatiquement du premier segment de l'URL (ex. gite-unairdetoscane-test).
  // Sur le domaine public, on utilise le dépôt principal. Le fichier local reste en secours.
  const githubOwner='unairdetoscane';
  const isGithubPages=location.hostname.toLowerCase()===`${githubOwner}.github.io`;
  const pathParts=location.pathname.split('/').filter(Boolean);
  const githubRepo=isGithubPages && pathParts.length ? pathParts[0] : 'gite-unairdetoscane';
  const stamp=Date.now();
  const sources=[
    `https://raw.githubusercontent.com/${githubOwner}/${githubRepo}/main/availability.json?ts=${stamp}`,
    `availability.json?ts=${stamp}`
  ];
  let lastError=null;
  try{
    let data=null;
    for(const url of sources){
      try{
        const response=await fetch(url,{cache:'no-store'});
        if(!response.ok)throw new Error(`HTTP ${response.status}`);
        const candidate=await response.json();
        if(!Array.isArray(candidate.bookedRanges))throw new Error('invalid availability.json');
        data=candidate;
        break;
      }catch(err){
        lastError=err;
      }
    }
    if(!data)throw lastError||new Error('availability.json unavailable');
    const remote=data.bookedRanges.filter(r=>r&&/^\d{4}-\d{2}-\d{2}$/.test(r.from||'')&&/^\d{4}-\d{2}-\d{2}$/.test(r.to||''));
    const manual=Array.isArray(cfg.bookedRanges)?cfg.bookedRanges:[];
    activeBookedRanges=[...remote,...manual];
    if(data.updatedAt){
      const d=new Date(data.updatedAt);
      calendarUpdated.textContent=`synchronisé automatiquement le ${d.toLocaleDateString('fr-FR')} à ${d.toLocaleTimeString('fr-FR',{hour:'2-digit',minute:'2-digit'})}`;
    }else{
      calendarUpdated.textContent='synchronisation Booking en attente';
    }
    renderCalendar();
  }catch(err){
    calendarUpdated.textContent=`${cfg.lastCalendarUpdate} (mode de secours)`;
  }finally{
    availabilityReady=true;
    if(checkDatesButton)checkDatesButton.disabled=false;
  }
}
loadBookingAvailability();
document.getElementById('prevMonth').onclick=()=>{view=new Date(view.getFullYear(),view.getMonth()-1,1);renderCalendar()};
document.getElementById('nextMonth').onclick=()=>{view=new Date(view.getFullYear(),view.getMonth()+1,1);renderCalendar()};
function nights(a,b){return Math.round((b-a)/86400000)}
function datesOverlap(a,b){for(const r of activeBookedRanges){const rf=new Date(r.from+'T00:00:00'),rt=new Date(r.to+'T00:00:00');if(a<rt&&b>rf)return true}return false}
function priceEstimate(a,b,people){const n=nights(a,b);let nightly=cfg.baseNightlyRate;const extra=cfg.extraPersonNightly ?? cfg.extraAdultNightly ?? 15;if(people>cfg.baseGuests)nightly+=(people-cfg.baseGuests)*extra;return {total:nightly*n,nightly,needsSupplement:false,nights:n}}

function ageOptions(){
  let html='<option value="" selected>Âge</option><option value="0">Moins d\'1 an</option>';
  for(let i=1;i<=17;i++)html+=`<option value="${i}">${i} an${i>1?'s':''}</option>`;
  return html;
}
function renderChildAges(containerId,count,forForm=false,values=[]){
  const box=document.getElementById(containerId);if(!box)return;
  box.innerHTML='';
  if(!count){box.classList.remove('visible');return}
  box.classList.add('visible');
  const title=document.createElement('span');title.className='child-ages-title';title.textContent=`Âge${count>1?'s':''} ${count>1?'des enfants':'de l’enfant'}`;box.appendChild(title);
  for(let i=0;i<count;i++){
    const label=document.createElement('label');label.textContent=`Enfant ${i+1}`;
    const select=document.createElement('select');select.className='child-age-select';select.dataset.childAge=String(i+1);if(forForm)select.name=`child_age_${i+1}`;select.required=true;select.innerHTML=ageOptions();
    if(values[i]!==undefined&&values[i]!==null)select.value=String(values[i]);
    label.appendChild(select);box.appendChild(label);
  }
}
function getChildAges(containerId){return [...document.querySelectorAll(`#${containerId} .child-age-select`)].map(s=>s.value)}
function childrenAreComplete(containerId,count){const ages=getChildAges(containerId);return count===0||(ages.length===count&&ages.every(v=>v!==''))}
function guestSummary(adults,children){return `${adults} adulte${adults>1?'s':''}${children?` et ${children} enfant${children>1?'s':''}`:''}`}
function totalCapacityOK(adults,children){return adults+children<=cfg.maxGuests}

const topChildCount=document.getElementById('childCount');
if(topChildCount)topChildCount.addEventListener('change',()=>renderChildAges('childAgesTop',Number(topChildCount.value),false));

function syncTopToForm(){
  const av=document.getElementById('arrival').value,de=document.getElementById('departure').value;
  const adults=Number(document.getElementById('guestCount').value),children=Number(document.getElementById('childCount').value);
  const ages=getChildAges('childAgesTop');
  form.querySelector('[name="arrival"]').value=av;
  form.querySelector('[name="departure"]').value=de;
  form.querySelector('[name="adults"]').value=String(adults);
  form.querySelector('[name="children"]').value=String(children);
  renderChildAges('childAgesForm',children,true,ages);
}

document.getElementById('checkDates').onclick=()=>{
  const res=document.getElementById('availabilityResult');
  if(!availabilityReady){res.textContent='Chargement du planning en cours…';return}
  const av=document.getElementById('arrival').value,de=document.getElementById('departure').value;
  const guests=Number(document.getElementById('guestCount').value),children=Number(document.getElementById('childCount').value);
  if(!guests){res.textContent='Sélectionnez le nombre d’adultes.';return}
  if(!totalCapacityOK(guests,children)){res.textContent=`La capacité maximale du gîte est de ${cfg.maxGuests} personnes au total.`;return}
  if(!childrenAreComplete('childAgesTop',children)){res.textContent='Renseignez l’âge de chaque enfant.';return}
  if(!av||!de){res.textContent='Choisissez une date d’arrivée et une date de départ.';return}
  const a=new Date(av+'T00:00:00'),b=new Date(de+'T00:00:00'),n=nights(a,b);
  if(n<cfg.minNights){res.textContent=`Le séjour minimum est de ${cfg.minNights} nuits.`;return}
  if(datesOverlap(a,b)){res.textContent='Certaines dates sont déjà réservées. Choisissez une autre période.';return}
  const p=priceEstimate(a,b,guests+children);
  res.textContent=`Période disponible : ${n} nuit${n>1?'s':''} × ${p.nightly} € / nuit = ${p.total} € pour ${guestSummary(guests,children)}. Taxe de séjour en supplément, à régler sur place.`;
  syncTopToForm();updateFormPrice();
};

const form=document.getElementById('requestForm');
const formChildCount=document.getElementById('formChildCount');
if(formChildCount)formChildCount.addEventListener('change',()=>{renderChildAges('childAgesForm',Number(formChildCount.value),true);updateFormPrice()});
const reserveJump=document.getElementById('reserveJump');
if(reserveJump)reserveJump.addEventListener('click',()=>{syncTopToForm();updateFormPrice()});

function updateFormPrice(){
  const preview=document.getElementById('formPricePreview');
  const totalField=document.getElementById('formTotalField');
  if(!preview)return;
  const av=form.querySelector('[name="arrival"]').value,de=form.querySelector('[name="departure"]').value;
  const adults=Number(form.querySelector('[name="adults"]').value),children=Number(form.querySelector('[name="children"]').value);
  if(!adults){preview.textContent='Sélectionnez au moins un adulte pour obtenir le montant du séjour. Taxe de séjour en supplément, à régler sur place.';if(totalField)totalField.value='';return}
  if(!totalCapacityOK(adults,children)){preview.textContent=`La capacité maximale du gîte est de ${cfg.maxGuests} personnes au total.`;if(totalField)totalField.value='';return}
  if(children&&!childrenAreComplete('childAgesForm',children)){preview.textContent='Renseignez l’âge de chaque enfant. Taxe de séjour en supplément, à régler sur place.';if(totalField)totalField.value='';return}
  if(!av||!de){preview.textContent='Sélectionnez vos dates pour obtenir le montant du séjour. Taxe de séjour en supplément, à régler sur place.';if(totalField)totalField.value='';return}
  const a=new Date(av+'T00:00:00'),b=new Date(de+'T00:00:00'),n=nights(a,b);
  if(n<=0){preview.textContent='La date de départ doit être postérieure à la date d’arrivée.';if(totalField)totalField.value='';return}
  if(n<cfg.minNights){preview.textContent=`Séjour minimum : ${cfg.minNights} nuits.`;if(totalField)totalField.value='';return}
  const p=priceEstimate(a,b,adults+children);
  const people=adults+children;const extra=cfg.extraPersonNightly ?? cfg.extraAdultNightly ?? 15;const supplement=people>cfg.baseGuests?` (${cfg.baseNightlyRate} € + ${(people-cfg.baseGuests)*extra} € de supplément par nuit pour ${people-cfg.baseGuests} personne${people-cfg.baseGuests>1?'s':''} supplémentaire${people-cfg.baseGuests>1?'s':''})`:'';
  preview.textContent=`Montant du séjour : ${n} nuit${n>1?'s':''} × ${p.nightly} € = ${p.total} €${supplement}. ${guestSummary(adults,children)}. Taxe de séjour en supplément, à régler sur place.`;
  if(totalField)totalField.value=`${p.total} € (${n} nuit${n>1?'s':''} à ${p.nightly} €/nuit, ${guestSummary(adults,children)}) — taxe de séjour en supplément`;
}
form.querySelectorAll('[name="arrival"],[name="departure"],[name="adults"]').forEach(el=>el.addEventListener('change',updateFormPrice));
form.addEventListener('change',e=>{if(e.target.classList.contains('child-age-select'))updateFormPrice()});
form.addEventListener('submit',async e=>{
  e.preventDefault();
  const status=document.getElementById('formStatus');
  const submitBtn=form.querySelector('button[type="submit"]');
  if(!availabilityReady){status.textContent='Chargement du planning en cours…';return}
  const d=new FormData(form);
  const adults=Number(d.get('adults')),children=Number(d.get('children'));
  if(!adults){status.textContent='Sélectionnez le nombre d’adultes.';return}
  if(!totalCapacityOK(adults,children)){status.textContent=`La capacité maximale du gîte est de ${cfg.maxGuests} personnes au total.`;return}
  const ages=getChildAges('childAgesForm');
  if(children&&!childrenAreComplete('childAgesForm',children)){status.textContent='Renseignez l’âge de chaque enfant.';return}
  const arrival=d.get('arrival'),departure=d.get('departure');
  if(!arrival||!departure){status.textContent='Renseignez les dates d’arrivée et de départ.';return}
  const a=new Date(arrival+'T00:00:00'),b=new Date(departure+'T00:00:00'),n=nights(a,b);
  if(n<cfg.minNights){status.textContent=`Le séjour minimum est de ${cfg.minNights} nuits.`;return}
  if(datesOverlap(a,b)){status.textContent='Ces dates comprennent une période déjà réservée.';return}
  const p=priceEstimate(a,b,adults+children);
  d.set('montant_sejour',`${p.total} € — ${n} nuit${n>1?'s':''} × ${p.nightly} €/nuit — ${guestSummary(adults,children)} — taxe de séjour en supplément`);
  d.set('tarif_nuit',`${p.nightly} €`);
  d.set('nombre_nuits',String(n));
  d.set('caution',`${cfg.securityDeposit} €`);
  d.set('nombre_enfants',String(children));
  d.set('ages_enfants',children?ages.map((v,i)=>`Enfant ${i+1}: ${v==='0'?"moins d’1 an":v+' ans'}`).join(' ; '):'Aucun');
  d.set('taxe_de_sejour','En supplément, à régler sur place');
  status.textContent='Envoi de votre demande…';
  submitBtn.disabled=true;
  try{
    const response=await fetch(form.action,{method:'POST',body:d,headers:{Accept:'application/json'}});
    if(!response.ok)throw new Error('Formspree error');
    status.textContent='Votre demande a bien été envoyée. Nous vous répondrons directement par e-mail.';
    form.reset();
    document.getElementById('guestCount').value='0';document.getElementById('childCount').value='0';
    renderChildAges('childAgesTop',0,false);renderChildAges('childAgesForm',0,true);
    document.getElementById('formPricePreview').textContent='Sélectionnez vos dates et le nombre de personnes pour obtenir le montant du séjour. Taxe de séjour en supplément, à régler sur place.';
    if(document.getElementById('formTotalField'))document.getElementById('formTotalField').value='';
  }catch(err){
    status.textContent='L’envoi a échoué. Vous pouvez réessayer ou nous contacter directement par téléphone.';
  }finally{submitBtn.disabled=false}
});
const todayIso=iso(new Date());document.querySelectorAll('input[type="date"]').forEach(i=>i.min=todayIso);



// Évite qu'un chargement asynchrone des avis ne fasse bouger la position de la page.
if ('scrollRestoration' in history) history.scrollRestoration='manual';
window.addEventListener('pageshow',()=>{ if(!location.hash && window.scrollY < 180) window.scrollTo(0,0); });

// Avis voyageurs : chargement depuis avis.json et défilement automatique sur la page d'accueil.
(async function initReviewCarousel(){
  const track=document.getElementById('reviewTrack');
  if(!track)return;
  const dots=document.getElementById('reviewDots');
  const prev=document.getElementById('reviewPrev');
  const next=document.getElementById('reviewNext');
  const avgEl=document.getElementById('reviewAverage');
  let reviews=[];let current=0;let timer=null;
  const escapeHtml=v=>String(v??'').replace(/[&<>'"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[c]));
  try{
    const response=await fetch('avis.json?ts='+Date.now(),{cache:'no-store'});
    if(!response.ok)throw new Error('reviews');
    const data=await response.json();
    reviews=Array.isArray(data.reviews)?data.reviews:[];
  }catch(e){return}
  if(!reviews.length)return;
  const average=reviews.reduce((sum,r)=>sum+Number(r.score||0),0)/reviews.length;
  if(avgEl)avgEl.textContent=average.toFixed(1).replace('.',',');
  track.innerHTML=reviews.map((r,i)=>`<blockquote class="review-slide${i===0?' active':''}" data-index="${i}"><div class="review-score">${escapeHtml(r.score)} / 10</div><p>« ${escapeHtml(r.text)} »</p><footer>${[r.name,r.city,r.stay].filter(Boolean).map(escapeHtml).join(' · ')}</footer></blockquote>`).join('');
  dots.innerHTML=reviews.map((_,i)=>`<button type="button" class="review-dot${i===0?' active':''}" aria-label="Afficher l’avis ${i+1}" data-index="${i}"></button>`).join('');
  const slides=[...track.querySelectorAll('.review-slide')];
  const dotButtons=[...dots.querySelectorAll('.review-dot')];

  // Ajuste réellement la taille de chaque avis selon l'espace disponible.
  // On mesure le texte rendu au lieu d'estimer sa taille à partir du nombre de caractères.
  function fitReviewText(slide){
    const p=slide.querySelector('p');
    const score=slide.querySelector('.review-score');
    const footer=slide.querySelector('footer');
    if(!p||!score||!footer)return;

    const cs=getComputedStyle(slide);
    const padTop=parseFloat(cs.paddingTop)||0;
    const padBottom=parseFloat(cs.paddingBottom)||0;
    const available=Math.max(80,slide.clientHeight-padTop-padBottom-score.offsetHeight-footer.offsetHeight-24);
    const maxFont=window.innerWidth<=600?21:window.innerWidth<=900?24:28;
    const minFont=window.innerWidth<=600?13:14;

    p.style.fontSize=maxFont+'px';
    p.style.lineHeight='1.32';
    p.style.display='block';
    p.style.height='auto';
    p.style.flex='0 0 auto';

    let size=maxFont;
    while(size>minFont && p.scrollHeight>available){
      size-=0.5;
      p.style.fontSize=size+'px';
    }

    // Si le commentaire est exceptionnellement long, on resserre légèrement l'interligne.
    if(p.scrollHeight>available){
      p.style.lineHeight='1.22';
    }

    // Centre verticalement le texte seulement s'il reste de la place.
    const free=Math.max(0,available-p.scrollHeight);
    p.style.marginTop=(10+free/2)+'px';
    p.style.marginBottom=(12+free/2)+'px';
  }
  function fitAllReviews(){slides.forEach(fitReviewText)}
  requestAnimationFrame(()=>requestAnimationFrame(fitAllReviews));
  let resizeTimer;
  window.addEventListener('resize',()=>{clearTimeout(resizeTimer);resizeTimer=setTimeout(fitAllReviews,120)});
  function show(i){current=(i+slides.length)%slides.length;slides.forEach((el,n)=>el.classList.toggle('active',n===current));dotButtons.forEach((el,n)=>el.classList.toggle('active',n===current));requestAnimationFrame(()=>fitReviewText(slides[current]))}
  function restart(){clearInterval(timer);if(slides.length>1)timer=setInterval(()=>show(current+1),6000)}
  prev?.addEventListener('click',()=>{show(current-1);restart()});
  next?.addEventListener('click',()=>{show(current+1);restart()});
  dotButtons.forEach(btn=>btn.addEventListener('click',()=>{show(Number(btn.dataset.index));restart()}));
  const carousel=document.getElementById('reviewCarousel');
  carousel?.addEventListener('mouseenter',()=>clearInterval(timer));
  carousel?.addEventListener('mouseleave',restart);
  restart();
})();
