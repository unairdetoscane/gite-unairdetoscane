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
function renderCalendar(){const cal=document.getElementById('calendar');cal.innerHTML='';document.getElementById('calendarTitle').textContent=`${months[view.getMonth()]} ${view.getFullYear()}`;const first=(view.getDay()+6)%7;const start=new Date(view.getFullYear(),view.getMonth(),1-first);const today=new Date();today.setHours(0,0,0,0);for(let i=0;i<42;i++){const d=new Date(start);d.setDate(start.getDate()+i);const el=document.createElement('div');el.className='day';if(d.getMonth()!==view.getMonth())el.classList.add('other');if(isBooked(d))el.classList.add('booked');if(d.getTime()===today.getTime())el.classList.add('today');el.textContent=d.getDate();el.title=isBooked(d)?'Réservé':`${cfg.baseNightlyRate} € / nuit jusqu’à ${cfg.baseGuests} adultes`;cal.appendChild(el)}}
renderCalendar();
async function loadBookingAvailability(){
  // Le workflow GitHub met bien availability.json à jour dans le dépôt, mais un commit
  // réalisé par GitHub Actions ne redéploie pas toujours GitHub Pages. On lit donc
  // directement le fichier brut du dépôt public, puis on utilise le fichier local en secours.
  const sources=[
    `https://raw.githubusercontent.com/unairdetoscane/gite-unairdetoscane/main/availability.json?ts=${Date.now()}`,
    `availability.json?ts=${Date.now()}`
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
function priceEstimate(a,b,guests){const n=nights(a,b);let nightly=cfg.baseNightlyRate;if(guests>cfg.baseGuests){if(cfg.extraAdultNightly==null)return {total:null,nightly,needsSupplement:true,nights:n};nightly+=(guests-cfg.baseGuests)*cfg.extraAdultNightly}return {total:nightly*n,nightly,needsSupplement:false,nights:n}}
document.getElementById('checkDates').onclick=()=>{const res=document.getElementById('availabilityResult');if(!availabilityReady){res.textContent='Chargement du planning en cours…';return}const av=document.getElementById('arrival').value,de=document.getElementById('departure').value,guests=Number(document.getElementById('guestCount').value);if(!guests){res.textContent='Sélectionnez le nombre d’adultes.';return}if(!av||!de){res.textContent='Choisissez une date d’arrivée et une date de départ.';return}const a=new Date(av+'T00:00:00'),b=new Date(de+'T00:00:00'),n=nights(a,b);if(n<cfg.minNights){res.textContent=`Le séjour minimum est de ${cfg.minNights} nuits.`;return}if(datesOverlap(a,b)){res.textContent='Certaines dates sont déjà réservées. Choisissez une autre période.';return}const p=priceEstimate(a,b,guests);res.textContent=`Période disponible : ${n} nuit${n>1?'s':''} × ${p.nightly} € / nuit = ${p.total} € pour ${guests} adulte${guests>1?'s':''}.`;document.querySelector('[name="arrival"]').value=av;document.querySelector('[name="departure"]').value=de;document.querySelector('[name="adults"]').value=String(guests);updateFormPrice()}
const form=document.getElementById('requestForm');
function updateFormPrice(){
  const preview=document.getElementById('formPricePreview');
  const totalField=document.getElementById('formTotalField');
  if(!preview)return;
  const av=form.querySelector('[name="arrival"]').value,de=form.querySelector('[name="departure"]').value,adults=Number(form.querySelector('[name="adults"]').value);
  if(!adults){preview.textContent='Sélectionnez le nombre d’adultes pour obtenir le montant du séjour.';if(totalField)totalField.value='';return}
  if(!av||!de){preview.textContent='Sélectionnez vos dates pour obtenir le montant du séjour.';if(totalField)totalField.value='';return}
  const a=new Date(av+'T00:00:00'),b=new Date(de+'T00:00:00'),n=nights(a,b);
  if(n<=0){preview.textContent='La date de départ doit être postérieure à la date d’arrivée.';if(totalField)totalField.value='';return}
  if(n<cfg.minNights){preview.textContent=`Séjour minimum : ${cfg.minNights} nuits.`;if(totalField)totalField.value='';return}
  const p=priceEstimate(a,b,adults);
  const supplement=adults>cfg.baseGuests?` (${cfg.baseNightlyRate} € + ${(adults-cfg.baseGuests)*cfg.extraAdultNightly} € de supplément par nuit)`:'';
  preview.textContent=`Montant du séjour : ${n} nuit${n>1?'s':''} × ${p.nightly} € = ${p.total} €${supplement}.`;
  if(totalField)totalField.value=`${p.total} € (${n} nuit${n>1?'s':''} à ${p.nightly} €/nuit, ${adults} adulte${adults>1?'s':''})`;
}
form.querySelectorAll('[name="arrival"],[name="departure"],[name="adults"]').forEach(el=>el.addEventListener('change',updateFormPrice));
form.addEventListener('submit',async e=>{
  e.preventDefault();
  const status=document.getElementById('formStatus');
  const submitBtn=form.querySelector('button[type="submit"]');
  if(!availabilityReady){status.textContent='Chargement du planning en cours…';return}
  const d=new FormData(form);
  const adults=Number(d.get('adults'));
  if(!adults){status.textContent='Sélectionnez le nombre d’adultes.';return}
  const arrival=d.get('arrival'),departure=d.get('departure');
  if(!arrival||!departure){status.textContent='Renseignez les dates d’arrivée et de départ.';return}
  const a=new Date(arrival+'T00:00:00'),b=new Date(departure+'T00:00:00'),n=nights(a,b);
  if(n<cfg.minNights){status.textContent=`Le séjour minimum est de ${cfg.minNights} nuits.`;return}
  if(datesOverlap(a,b)){status.textContent='Ces dates comprennent une période déjà réservée.';return}
  const p=priceEstimate(a,b,adults);
  d.set('montant_sejour',`${p.total} € — ${n} nuit${n>1?'s':''} × ${p.nightly} €/nuit — ${adults} adulte${adults>1?'s':''}`);
  d.set('tarif_nuit',`${p.nightly} €`);
  d.set('nombre_nuits',String(n));
  d.set('caution',`${cfg.securityDeposit} €`);
  status.textContent='Envoi de votre demande…';
  submitBtn.disabled=true;
  try{
    const response=await fetch(form.action,{method:'POST',body:d,headers:{Accept:'application/json'}});
    if(!response.ok)throw new Error('Formspree error');
    status.textContent='Votre demande a bien été envoyée. Nous vous répondrons directement par e-mail.';
    form.reset();
    document.getElementById('guestCount').value='0';
    document.getElementById('formPricePreview').textContent='Sélectionnez vos dates et le nombre d’adultes pour obtenir le montant du séjour.';
    if(document.getElementById('formTotalField'))document.getElementById('formTotalField').value='';
  }catch(err){
    status.textContent='L’envoi a échoué. Vous pouvez réessayer ou nous contacter directement par téléphone.';
  }finally{
    submitBtn.disabled=false;
  }
});
const todayIso=iso(new Date());document.querySelectorAll('input[type="date"]').forEach(i=>i.min=todayIso);
