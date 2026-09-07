const cfg=window.GITE_CONFIG;
const navBtn=document.querySelector('.nav-toggle'),nav=document.querySelector('.main-nav');
navBtn.addEventListener('click',()=>{nav.classList.toggle('open');navBtn.setAttribute('aria-expanded',nav.classList.contains('open'))});
document.querySelectorAll('.main-nav a').forEach(a=>a.addEventListener('click',()=>nav.classList.remove('open')));
const phone=document.getElementById('phoneLink');phone.textContent=cfg.phone;phone.href=`tel:${cfg.phoneHref}`;document.getElementById('calendarUpdated').textContent=cfg.lastCalendarUpdate;
function iso(d){return d.toISOString().slice(0,10)}
function inRange(date,r){return date>=new Date(r.from+'T00:00:00')&&date<new Date(r.to+'T00:00:00')}
function isBooked(d){return cfg.bookedRanges.some(r=>inRange(d,r))}
let view=new Date();view=new Date(view.getFullYear(),view.getMonth(),1);const months=['janvier','février','mars','avril','mai','juin','juillet','août','septembre','octobre','novembre','décembre'];
function renderCalendar(){const cal=document.getElementById('calendar');cal.innerHTML='';document.getElementById('calendarTitle').textContent=`${months[view.getMonth()]} ${view.getFullYear()}`;const first=(view.getDay()+6)%7;const start=new Date(view.getFullYear(),view.getMonth(),1-first);const today=new Date();today.setHours(0,0,0,0);for(let i=0;i<42;i++){const d=new Date(start);d.setDate(start.getDate()+i);const el=document.createElement('div');el.className='day';if(d.getMonth()!==view.getMonth())el.classList.add('other');if(isBooked(d))el.classList.add('booked');if(d.getTime()===today.getTime())el.classList.add('today');el.textContent=d.getDate();el.title=isBooked(d)?'Réservé':`${cfg.baseNightlyRate} € / nuit jusqu’à ${cfg.baseGuests} adultes`;cal.appendChild(el)}}
renderCalendar();
document.getElementById('prevMonth').onclick=()=>{view=new Date(view.getFullYear(),view.getMonth()-1,1);renderCalendar()};
document.getElementById('nextMonth').onclick=()=>{view=new Date(view.getFullYear(),view.getMonth()+1,1);renderCalendar()};
function nights(a,b){return Math.round((b-a)/86400000)}
function datesOverlap(a,b){for(const r of cfg.bookedRanges){const rf=new Date(r.from+'T00:00:00'),rt=new Date(r.to+'T00:00:00');if(a<rt&&b>rf)return true}return false}
function priceEstimate(a,b,guests){const n=nights(a,b);let nightly=cfg.baseNightlyRate;if(guests>cfg.baseGuests){if(cfg.extraAdultNightly==null)return {total:null,nightly,needsSupplement:true,nights:n};nightly+=(guests-cfg.baseGuests)*cfg.extraAdultNightly}return {total:nightly*n,nightly,needsSupplement:false,nights:n}}
document.getElementById('checkDates').onclick=()=>{const res=document.getElementById('availabilityResult'),av=document.getElementById('arrival').value,de=document.getElementById('departure').value,guests=Number(document.getElementById('guestCount').value);if(!av||!de){res.textContent='Choisissez une date d’arrivée et une date de départ.';return}const a=new Date(av+'T00:00:00'),b=new Date(de+'T00:00:00'),n=nights(a,b);if(n<cfg.minNights){res.textContent=`Le séjour minimum est de ${cfg.minNights} nuits.`;return}if(datesOverlap(a,b)){res.textContent='Certaines dates sont déjà réservées. Choisissez une autre période.';return}const p=priceEstimate(a,b,guests);res.textContent=p.needsSupplement?`Période disponible : ${n} nuits. Base ${cfg.baseNightlyRate} € / nuit jusqu’à ${cfg.baseGuests} adultes ; supplément pour ${guests} adultes à confirmer.`:`Période disponible : ${n} nuits × ${p.nightly} € / nuit = ${p.total} € pour ${guests} adulte${guests>1?'s':''}.`;document.querySelector('[name="arrival"]').value=av;document.querySelector('[name="departure"]').value=de;document.querySelector('[name="adults"]').value=String(guests)};
const form=document.getElementById('requestForm');
function updateFormPrice(){
  const preview=document.getElementById('formPricePreview');
  if(!preview)return;
  const av=form.querySelector('[name="arrival"]').value,de=form.querySelector('[name="departure"]').value,adults=Number(form.querySelector('[name="adults"]').value);
  if(!av||!de){preview.textContent='Sélectionnez vos dates et le nombre d’adultes pour obtenir le montant du séjour.';return}
  const a=new Date(av+'T00:00:00'),b=new Date(de+'T00:00:00'),n=nights(a,b);
  if(n<=0){preview.textContent='La date de départ doit être postérieure à la date d’arrivée.';return}
  if(n<cfg.minNights){preview.textContent=`Séjour minimum : ${cfg.minNights} nuits.`;return}
  const p=priceEstimate(a,b,adults);
  preview.textContent=`Montant du séjour : ${n} nuit${n>1?'s':''} × ${p.nightly} € = ${p.total} €${adults>cfg.baseGuests?` (${cfg.baseNightlyRate} € + ${(adults-cfg.baseGuests)*cfg.extraAdultNightly} € de supplément par nuit)`:''}.`;
}
form.querySelectorAll('[name="arrival"],[name="departure"],[name="adults"]').forEach(el=>el.addEventListener('change',updateFormPrice));
form.addEventListener('submit',e=>{e.preventDefault();const d=new FormData(form);const adults=Number(d.get('adults'));const a=new Date(d.get('arrival')+'T00:00:00'),b=new Date(d.get('departure')+'T00:00:00'),n=nights(a,b);if(n<cfg.minNights){document.getElementById('formStatus').textContent=`Le séjour minimum est de ${cfg.minNights} nuits.`;return}if(datesOverlap(a,b)){document.getElementById('formStatus').textContent='Ces dates comprennent une période déjà réservée.';return}const p=priceEstimate(a,b,adults);const priceLine=p.needsSupplement?`Tarif indicatif : ${cfg.baseNightlyRate} € / nuit jusqu’à ${cfg.baseGuests} adultes, supplément pour ${adults} adultes à confirmer.`:`Tarif indicatif : ${p.total} € pour ${n} nuits.`;const msg=`Demande de réservation – Gîte Un air de Toscane\n\nNom : ${d.get('name')}\nTéléphone : ${d.get('phone')||'-'}\nE-mail : ${d.get('email')}\nArrivée : ${d.get('arrival')}\nDépart : ${d.get('departure')}\nNombre d’adultes : ${adults}\n${priceLine}\n\nMessage : ${d.get('message')||'-'}`;window.location.href=`mailto:${cfg.email}?subject=${encodeURIComponent('Demande de réservation – Un air de Toscane')}&body=${encodeURIComponent(msg)}`});
const todayIso=iso(new Date());document.querySelectorAll('input[type="date"]').forEach(i=>i.min=todayIso);
