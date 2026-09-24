const nav=document.querySelector('.nav');
const menu=document.querySelector('.menu');
const floating=document.querySelector('.floating');
const process=document.querySelector('.process');\nconst footer=document.querySelector('footer');
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
  const beforeFooter=!footer || footer.getBoundingClientRect().top>innerHeight*.92;\n  floating?.classList.toggle('show',scrollY>innerHeight*1.08 && beforeFooter);
  if(!process || innerWidth<=900)return;
  const r=process.getBoundingClientRect();
  const max=process.offsetHeight-innerHeight;
  const p=max>0?Math.min(1,Math.max(0,-r.top/max)):0;
  if(processTitle){
    const fade=Math.min(1,Math.max(0,(p-.015)/.075));
    processTitle.style.opacity=String(.28+.72*fade);
  }
  const start=.035,end=.965;
  const local=Math.min(1,Math.max(0,(p-start)/(end-start)));
  const timeline=-.75+local*((cards.length-1)+1.5);
  cards.forEach((card,i)=>{
    const d=i-timeline;
    const abs=Math.abs(d);
    const y=d*92;
    const opacity=Math.max(0,1-abs*1.55);
    card.style.opacity=opacity.toFixed(3);
    card.style.transform=`translate(-50%,calc(-50% + ${y}vh)) scale(${1-Math.min(abs,.75)*.02})`;
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