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

document.querySelectorAll('.round-btn').forEach(button=>{
  button.addEventListener('click',()=>{
    const active=button.classList.toggle('is-active');
    button.setAttribute('aria-pressed',String(active));
  });
});


/* Seamless marquee: continuous pixel motion, no animation restart */
(() => {
  const viewport = document.querySelector('.motion-marquee');
  const track = document.querySelector('.motion-marquee-track');
  const firstSet = document.querySelector('.motion-marquee-set');
  if (!viewport || !track || !firstSet) return;
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

  let setWidth = 0;
  let offset = 0;
  let lastTime = performance.now();
  const speed = 42; // CSS px per second

  const measure = () => {
    const previousWidth = setWidth || 1;
    const progress = ((offset % previousWidth) + previousWidth) % previousWidth / previousWidth;
    setWidth = firstSet.getBoundingClientRect().width;
    offset = progress * setWidth;
  };

  const tick = (now) => {
    const delta = Math.min((now - lastTime) / 1000, 0.05);
    lastTime = now;

    if (setWidth > 0) {
      offset = (offset + speed * delta) % setWidth;
      track.style.transform = `translate3d(${-offset}px,0,0)`;
    }

    requestAnimationFrame(tick);
  };

  const ro = new ResizeObserver(measure);
  ro.observe(firstSet);
  ro.observe(viewport);

  window.addEventListener('load', measure, { once:true });
  measure();
  requestAnimationFrame(tick);
})();
