const nav=document.querySelector('.nav');
const menu=document.querySelector('.menu');
const floating=document.querySelector('.floating');
const floatingToggle=document.querySelector('.floating-toggle');
const floatingMenu=document.querySelector('.floating-menu');
const process=document.querySelector('.process');
const footer=document.querySelector('footer');
const cards=[...document.querySelectorAll('.step')];

function setTopMenu(open){
  menu?.setAttribute('aria-expanded',String(open));
  nav?.classList.toggle('open',open);
}
menu?.addEventListener('click',()=>setTopMenu(menu.getAttribute('aria-expanded')!=='true'));

function setFloatingMenu(open){
  floatingToggle?.setAttribute('aria-expanded',String(open));
  floatingToggle?.classList.toggle('is-open',open);
  floatingMenu?.classList.toggle('is-open',open);
  floatingMenu?.setAttribute('aria-hidden',String(!open));
}
floatingToggle?.addEventListener('click',e=>{
  e.stopPropagation();
  setFloatingMenu(floatingToggle.getAttribute('aria-expanded')!=='true');
});
floatingMenu?.addEventListener('click',e=>e.stopPropagation());
document.addEventListener('click',()=>setFloatingMenu(false));
document.addEventListener('keydown',e=>{if(e.key==='Escape'){setTopMenu(false);setFloatingMenu(false)}});

document.querySelectorAll('a[href^="#"]').forEach(a=>a.addEventListener('click',()=>{
  setTopMenu(false);
  setFloatingMenu(false);
}));

const headingObserver=new IntersectionObserver(entries=>{
  entries.forEach(entry=>{
    if(entry.isIntersecting){
      entry.target.classList.add('is-visible');
      headingObserver.unobserve(entry.target);
    }
  });
},{threshold:.22,rootMargin:'0px 0px -8% 0px'});
document.querySelectorAll('.reveal-heading').forEach(el=>headingObserver.observe(el));

function updateScroll(){
  const beforeFooter=!footer || footer.getBoundingClientRect().top>innerHeight*.95;
  floating?.classList.toggle('show',scrollY>innerHeight*.92 && beforeFooter);

  if(!process || innerWidth<=1023)return;
  const rect=process.getBoundingClientRect();
  const travel=process.offsetHeight-innerHeight;
  const p=travel>0?Math.min(1,Math.max(0,-rect.top/travel)):0;
  const start=.04,end=.96;
  const local=Math.min(1,Math.max(0,(p-start)/(end-start)));
  const timeline=-.65+local*((cards.length-1)+1.3);
  cards.forEach((card,i)=>{
    const d=i-timeline;
    const y=d*105;
    card.style.transform=`translate(-50%,calc(-50% + ${y}vh))`;
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
  if(count)count.textContent=`${String(qi+1).padStart(2,'0')} / ${String(pages.length).padStart(2,'0')}`;
  if(back)back.style.visibility=qi?'visible':'hidden';
  if(next)next.textContent=qi===pages.length-1?'Готово':'Далее →';
}
next?.addEventListener('click',()=>{if(qi<pages.length-1){qi++;renderQuiz()}else{next.textContent='Спасибо';next.disabled=true}});
back?.addEventListener('click',()=>{if(qi){qi--;renderQuiz()}});
renderQuiz();