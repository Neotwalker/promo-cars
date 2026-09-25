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

/* Stage marquee — based on the proven MA logo-marquee logic */
document.querySelectorAll('[data-stage-marquee]').forEach(viewport=>{
  const track=viewport.querySelector('[data-stage-marquee-track]');
  const group=viewport.querySelector('[data-stage-marquee-group]');
  if(!track || !group || viewport.dataset.marqueeReady==='true') return;

  viewport.dataset.marqueeReady='true';

  const reduceMotion=window.matchMedia('(prefers-reduced-motion: reduce)');
  const speed=42;
  const dragThreshold=6;
  const state={
    offset:0,
    groupWidth:0,
    lastTime:0,
    hoverPaused:false,
    focusPaused:false,
    dragging:false,
    dragIntent:false,
    pointerId:null,
    startX:0,
    startY:0,
    startOffset:0,
    lastX:0,
    lastMoveTime:0,
    velocity:0,
    resumeAt:0,
    suppressClick:false
  };

  const removeClones=()=>{
    track.querySelectorAll('[data-stage-marquee-clone]').forEach(node=>node.remove());
  };

  const makeClone=()=>{
    const clone=group.cloneNode(true);
    clone.removeAttribute('data-stage-marquee-group');
    clone.setAttribute('data-stage-marquee-clone','');
    clone.setAttribute('aria-hidden','true');
    clone.querySelectorAll('[id]').forEach(el=>el.removeAttribute('id'));
    clone.querySelectorAll('a,button,input,select,textarea,[tabindex]').forEach(el=>el.setAttribute('tabindex','-1'));
    return clone;
  };

  const normalizeOffset=value=>{
    if(!state.groupWidth) return 0;
    const offset=value%state.groupWidth;
    return offset<0?offset+state.groupWidth:offset;
  };

  const updateTransform=()=>{
    if(reduceMotion.matches){
      viewport.dataset.reducedMotion='true';
      track.style.transform='';
      return;
    }
    viewport.dataset.reducedMotion='false';
    track.style.transform=`translate3d(${-state.offset}px,0,0)`;
  };

  const ensureCoverage=()=>{
    removeClones();
    const viewportWidthPx=Math.max(viewport.getBoundingClientRect().width,1);
    state.groupWidth=Math.max(group.getBoundingClientRect().width,1);

    // Enough copies to cover the viewport plus one full group on both sides.
    const totalGroups=Math.max(2,Math.ceil(viewportWidthPx/state.groupWidth)+2);
    for(let i=1;i<totalGroups;i++) track.appendChild(makeClone());

    state.offset=normalizeOffset(state.offset);
    updateTransform();
  };

  const requestAutoplayResume=delay=>{
    state.resumeAt=performance.now()+delay;
  };

  const isPaused=()=>state.hoverPaused||state.focusPaused;

  const finishDrag=()=>{
    if(!state.dragging) return;
    state.dragging=false;
    state.dragIntent=false;
    viewport.classList.remove('is-dragging');
    if(state.pointerId!==null && viewport.hasPointerCapture?.(state.pointerId)){
      try{viewport.releasePointerCapture(state.pointerId)}catch(e){}
    }
    state.pointerId=null;
    requestAutoplayResume(900);
  };

  const animate=time=>{
    if(!state.lastTime) state.lastTime=time;
    const delta=Math.min((time-state.lastTime)/1000,.05);
    state.lastTime=time;

    if(!reduceMotion.matches && state.groupWidth){
      if(!state.dragging && !isPaused()){
        if(Math.abs(state.velocity)>4){
          state.offset=normalizeOffset(state.offset-state.velocity*delta);
          state.velocity*=Math.pow(.9,delta*60);
        }else{
          state.velocity=0;
        }
        if(time>=state.resumeAt){
          state.offset=normalizeOffset(state.offset+speed*delta);
        }
      }
      updateTransform();
    }
    requestAnimationFrame(animate);
  };

  viewport.addEventListener('mouseenter',()=>{
    state.hoverPaused=true;
    state.velocity=0;
  });

  viewport.addEventListener('mouseleave',()=>{
    state.hoverPaused=false;
    requestAutoplayResume(250);
  });

  viewport.addEventListener('focusin',()=>{
    state.focusPaused=true;
    state.velocity=0;
  });

  viewport.addEventListener('focusout',()=>{
    if(viewport.contains(document.activeElement)) return;
    state.focusPaused=false;
    requestAutoplayResume(250);
  });

  viewport.addEventListener('pointerdown',event=>{
    if(reduceMotion.matches || (event.pointerType==='mouse' && event.button!==0)) return;
    state.dragging=true;
    state.dragIntent=false;
    state.pointerId=event.pointerId;
    state.startX=event.clientX;
    state.startY=event.clientY;
    state.startOffset=state.offset;
    state.lastX=event.clientX;
    state.lastMoveTime=performance.now();
    state.velocity=0;
    state.suppressClick=false;
  });

  viewport.addEventListener('pointermove',event=>{
    if(!state.dragging || state.pointerId!==event.pointerId) return;

    const deltaX=event.clientX-state.startX;
    const deltaY=event.clientY-state.startY;

    if(!state.dragIntent){
      if(Math.abs(deltaX)<dragThreshold && Math.abs(deltaY)<dragThreshold) return;
      if(Math.abs(deltaY)>Math.abs(deltaX)){
        finishDrag();
        return;
      }
      state.dragIntent=true;
      viewport.classList.add('is-dragging');
      try{viewport.setPointerCapture?.(event.pointerId)}catch(e){}
    }

    event.preventDefault();
    state.offset=normalizeOffset(state.startOffset-deltaX);
    const now=performance.now();
    const elapsed=Math.max(now-state.lastMoveTime,16);
    state.velocity=((event.clientX-state.lastX)/elapsed)*1000;
    state.lastX=event.clientX;
    state.lastMoveTime=now;
    state.suppressClick=Math.abs(deltaX)>dragThreshold;
    updateTransform();
  });

  viewport.addEventListener('pointerup',finishDrag);
  viewport.addEventListener('pointercancel',finishDrag);

  const handleMotionChange=()=>{
    state.velocity=0;
    state.lastTime=0;
    ensureCoverage();
  };

  if(reduceMotion.addEventListener){
    reduceMotion.addEventListener('change',handleMotionChange);
  }else{
    reduceMotion.addListener(handleMotionChange);
  }

  if(typeof ResizeObserver!=='undefined'){
    const ro=new ResizeObserver(ensureCoverage);
    ro.observe(group);
    ro.observe(viewport);
  }else{
    window.addEventListener('resize',ensureCoverage);
  }

  window.addEventListener('load',ensureCoverage,{once:true});
  ensureCoverage();
  requestAnimationFrame(animate);
});

(() => {
  const items = [...document.querySelectorAll('.faq-item')];

  if (!items.length) {
    return;
  }

  const reducedMotionQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
  const duration = 480;
  const easing = 'cubic-bezier(.2,.75,.2,1)';

  items.forEach(item => {
    if (item.dataset.faqReady === 'true') {
      return;
    }

    const summary = item.querySelector('summary');
    const answer = item.querySelector('.faq-answer');

    if (!summary || !answer) {
      return;
    }

    item.dataset.faqReady = 'true';

    let animation = null;
    let targetOpen = item.open;

    const clearAnimation = () => {
      animation = null;
      answer.style.height = '';
      answer.style.opacity = '';
      answer.style.overflow = '';
      item.classList.remove('is-closing');
    };

    const finishImmediately = open => {
      animation?.cancel();
      animation = null;
      targetOpen = open;
      item.open = open;
      clearAnimation();
    };

    const animateTo = open => {
      if (reducedMotionQuery.matches || typeof answer.animate !== 'function') {
        finishImmediately(open);
        return;
      }

      const currentHeight = answer.getBoundingClientRect().height;

      if (animation) {
        animation.cancel();
        animation = null;
      }

      targetOpen = open;

      if (open && !item.open) {
        item.open = true;
      }

      item.classList.toggle('is-closing', !open);

      const endHeight = open ? answer.scrollHeight : 0;
      const startHeight = open && currentHeight === 0 ? 0 : currentHeight;

      answer.style.height = startHeight + 'px';
      answer.style.opacity = open && startHeight === 0 ? '0' : getComputedStyle(answer).opacity;
      answer.style.overflow = 'hidden';

      animation = answer.animate(
        [
          {height:startHeight + 'px', opacity:open && startHeight === 0 ? 0 : 1},
          {height:endHeight + 'px', opacity:open ? 1 : 0}
        ],
        {
          duration,
          easing,
          fill:'forwards'
        }
      );

      animation.onfinish = () => {
        if (!targetOpen) {
          item.open = false;
        }
        clearAnimation();
      };

      animation.oncancel = () => {
        animation = null;
      };
    };

    summary.addEventListener('click', event => {
      event.preventDefault();
      animateTo(!targetOpen);
    });

    reducedMotionQuery.addEventListener('change', () => {
      if (animation) {
        finishImmediately(targetOpen);
      }
    });
  });
})();
