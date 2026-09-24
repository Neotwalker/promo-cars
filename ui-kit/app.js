const viewportWidth=document.getElementById('viewportWidth');
const reveal=document.querySelector('.kit-reveal');

function updateViewport(){
  if(viewportWidth) viewportWidth.textContent=String(window.innerWidth).padStart(4,'0');
}
updateViewport();
window.addEventListener('resize',updateViewport,{passive:true});

if(reveal){
  const observer=new IntersectionObserver(entries=>{
    entries.forEach(entry=>{
      if(entry.isIntersecting){
        entry.target.classList.add('is-visible');
        observer.unobserve(entry.target);
      }
    });
  },{threshold:.35});
  observer.observe(reveal);
}

document.querySelectorAll('a[href^="#"]').forEach(link=>{
  link.addEventListener('click',event=>{
    const target=document.querySelector(link.getAttribute('href'));
    if(!target)return;
    event.preventDefault();
    target.scrollIntoView({behavior:'smooth',block:'start'});
  });
});