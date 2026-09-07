const navToggle=document.querySelector('.nav-toggle');
const mainNav=document.querySelector('.main-nav');
if(navToggle&&mainNav)navToggle.addEventListener('click',()=>{const open=mainNav.classList.toggle('open');navToggle.setAttribute('aria-expanded',String(open))});

function esc(value){return String(value??'').replace(/[&<>'"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[c]))}

async function loadReviews(){
  try{
    const response=await fetch('avis.json?ts='+Date.now(),{cache:'no-store'});
    if(!response.ok)throw new Error('reviews');
    const data=await response.json();
    const reviews=Array.isArray(data.reviews)?data.reviews:[];
    if(!reviews.length)return;
    const average=reviews.reduce((sum,r)=>sum+Number(r.score||0),0)/reviews.length;
    document.getElementById('reviewsPageAverage').textContent=average.toFixed(1).replace('.',',');
    document.getElementById('reviewsCount').textContent=`${reviews.length} avis publié${reviews.length>1?'s':''}`;
    document.getElementById('reviewsList').innerHTML=reviews.map(r=>`<article class="review-full-card"><div class="review-full-score">${esc(r.score)} / 10</div><div><h2>${esc(r.title||'Avis voyageur')}</h2><p>${esc(r.text)}</p><footer>${[r.name,r.city,r.stay].filter(Boolean).map(esc).join(' · ')}</footer></div></article>`).join('');
  }catch(e){}
}
loadReviews();

const form=document.getElementById('reviewForm');
if(form)form.addEventListener('submit',async e=>{
  e.preventDefault();
  const status=document.getElementById('reviewFormStatus');
  const button=form.querySelector('button[type="submit"]');
  status.textContent='Envoi de votre avis…';button.disabled=true;
  try{
    const response=await fetch(form.action,{method:'POST',body:new FormData(form),headers:{Accept:'application/json'}});
    if(!response.ok)throw new Error('send');
    form.reset();
    status.textContent='Merci. Votre avis a bien été envoyé et sera publié après validation.';
  }catch(e){status.textContent='L’envoi a échoué. Vous pouvez réessayer dans quelques instants.'}
  finally{button.disabled=false}
});
