const nav=document.querySelector('.nav');
const menu=document.querySelector('.menu');
const floating=document.querySelector('.floating');
const process=document.querySelector('.process');
const cards=[...document.querySelectorAll('.step')];

menu?.addEventListener('click',()=>{
  const open=menu.getAttribute('aria-expanded')==='true';
  menu.setAttribute('aria-expanded',String(!open));
  nav?.classList.toggle('open',!open);
});
document.querySelectorAll('a[href^="#"]').forEach(a=>a.addEventListener('click',()=>{
  nav?.classList.remove('open');menu?.setAttribute('aria-expanded','false');
}));

function updateScroll(){
  floating?.classList.toggle('show',scrollY>innerHeight*1.08 && scrollY<document.documentElement.scrollHeight-innerHeight*1.2);
  if(!process || innerWidth<=900)return;
  const r=process.getBoundingClientRect();
  const max=process.offsetHeight-innerHeight;
  const p=max>0?Math.min(1,Math.max(0,-r.top/max)):0;
  const intro=.055,end=.945;
  const timeline=(p-intro)/(end-intro)*(cards.length-1);
  cards.forEach((card,i)=>{
    const d=i-timeline;
    const y=d*73;
    const abs=Math.abs(d);
    let opacity=Math.max(0,1-abs*1.05);
    if(p<intro) opacity=0;
    if(p>end && i===cards.length-1) opacity=Math.max(0,1-(p-end)*18);
    card.style.opacity=opacity.toFixed(3);
    card.style.transform=`translate(-50%,calc(-50% + ${y}vh)) scale(${1-Math.min(abs,.8)*.035})`;
  });
}
addEventListener('scroll',updateScroll,{passive:true});
addEventListener('resize',updateScroll,{passive:true});
updateScroll();

const pages=[...document.querySelectorAll('.quiz-page')];
const next=document.querySelector('.quiz-nav .next');
const back=document.querySelector('.quiz-nav .back');
const count=document.getElementById('quizCount');
let qi=0;
function renderQuiz(){
  pages.forEach((p,i)=>p.classList.toggle('is-active',i===qi));
  count.textContent=`${String(qi+1).padStart(2,'0')} / ${String(pages.length).padStart(2,'0')}`;
  back.style.visibility=qi?'visible':'hidden';
  next.textContent=qi===pages.length-1?'Готово':'Далее →';
}
next?.addEventListener('click',()=>{if(qi<pages.length-1){qi++;renderQuiz()}else{next.textContent='Спасибо';next.disabled=true}});
back?.addEventListener('click',()=>{if(qi){qi--;renderQuiz()}});
renderQuiz();