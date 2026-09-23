const body=document.body;
const header=document.querySelector('.site-header');
const menuBtn=document.querySelector('.menu-toggle');
const nav=document.querySelector('.main-nav');

const onScroll=()=>{
  body.classList.toggle('show-floating',window.scrollY>window.innerHeight*1.1);
  const section=document.querySelector('.workflow');
  if(!section||window.matchMedia('(max-width: 900px)').matches)return;
  const rect=section.getBoundingClientRect();
  const total=section.offsetHeight-window.innerHeight;
  const passed=Math.min(Math.max(-rect.top,0),total);
  const progress=total?passed/total:0;
  const cards=[...document.querySelectorAll('.process-card')];
  const idx=Math.min(cards.length-1,Math.floor(progress*cards.length));
  cards.forEach((card,i)=>{
    card.classList.toggle('is-active',i===idx);
    card.classList.toggle('is-before',i<idx);
  });
};
window.addEventListener('scroll',onScroll,{passive:true});
onScroll();

menuBtn?.addEventListener('click',()=>{
  const open=menuBtn.getAttribute('aria-expanded')==='true';
  menuBtn.setAttribute('aria-expanded',String(!open));
  nav?.classList.toggle('mobile-open',!open);
});

document.querySelectorAll('a[href^="#"]').forEach(a=>a.addEventListener('click',()=>{
  nav?.classList.remove('mobile-open');
  menuBtn?.setAttribute('aria-expanded','false');
}));

const quizSteps=[...document.querySelectorAll('.quiz-step')];
const next=document.getElementById('quizNext');
const back=document.querySelector('.quiz-back');
const progress=document.getElementById('quizProgress');
let quizIndex=0;
const renderQuiz=()=>{
  quizSteps.forEach((el,i)=>el.classList.toggle('is-active',i===quizIndex));
  progress.textContent=`${String(quizIndex+1).padStart(2,'0')} / ${String(quizSteps.length).padStart(2,'0')}`;
  back.style.visibility=quizIndex===0?'hidden':'visible';
  next.textContent=quizIndex===quizSteps.length-1?'Готово':'Далее →';
};
next?.addEventListener('click',()=>{
  if(quizIndex<quizSteps.length-1){quizIndex++;renderQuiz();return;}
  next.textContent='Спасибо';
  next.disabled=true;
});
back?.addEventListener('click',()=>{if(quizIndex>0){quizIndex--;renderQuiz();}});
renderQuiz();

if(!window.matchMedia('(prefers-reduced-motion: reduce)').matches){
  window.addEventListener('scroll',()=>{
    const y=window.scrollY;
    const hero=document.querySelector('.hero-bg');
    if(hero&&y<window.innerHeight*1.2)hero.style.transform=`scale(1.02) translateY(${y*.06}px)`;
  },{passive:true});
}
