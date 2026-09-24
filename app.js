const nav=document.querySelector('.nav');
const menu=document.querySelector('.menu');
const floating=document.querySelector('.floating');
const process=document.querySelector('.process');
const cards=[...document.querySelectorAll('.step')];\nconst processTitle=document.querySelector('.process h2');

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
  if(processTitle){
    const fade=Math.min(1,Math.max(0,(p-.015)/.075));
    processTitle.style.opacity=String(.28+.72*fade);
  }
  const intro=.09,end=.93;
  const timeline=(p-intro)/(end-intro)*(cards.length-1);
  cards.forEach((card,i)=>{
    const d=i-timeline;
    const abs=Math.abs(d);
    const y=d*92;
    let opacity=Math.max(0,1-abs*2.1);
    if(p<intro || p>end) opacity=0;
    card.style.opacity=opacity.toFixed(3);
    card.style.transform=`translate(-50%,calc(-50% + ${y}vh)) scale(${1-Math.min(abs,.6)*.025})`;
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