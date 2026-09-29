(() => {
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)');

  const video = document.querySelector('[data-hero-video]');
  const desktopMedia = window.matchMedia('(min-width: 48rem)');

  const unloadVideo = () => {
    if (!video) return;
    video.pause();
    if (!video.hasAttribute('src')) return;
    video.removeAttribute('src');
    video.load();
  };

  const syncVideo = () => {
    if (!video) return;
    const shouldLoad = desktopMedia.matches && !reduceMotion.matches;

    if (!shouldLoad) {
      unloadVideo();
      return;
    }

    if (!video.hasAttribute('src')) {
      video.src = video.dataset.src;
      video.load();
    }

    if (!document.hidden) video.play().catch(() => {});
  };

  syncVideo();
  reduceMotion.addEventListener?.('change', syncVideo);
  desktopMedia.addEventListener?.('change', syncVideo);

  document.addEventListener('visibilitychange', () => {
    if (!video) return;
    if (document.hidden) video.pause();
    else syncVideo();
  });

  const journey = document.querySelector('[data-journey]');

  if (journey) {
    const sticky = journey.querySelector('[data-journey-sticky]');
    const shell = journey.querySelector('[data-journey-shell]');
    const scene = journey.querySelector('[data-journey-scene]');
    const stages = [...journey.querySelectorAll('[data-journey-step]')];
    const stageItems = [...journey.querySelectorAll('[data-journey-item]')];
    const panels = [...journey.querySelectorAll('[data-journey-panel]')];
    const track = journey.querySelector('[data-journey-track]');
    const compactJourney = window.matchMedia('(max-width: 64rem)');
    const mobileProgress = journey.querySelector('[data-journey-mobile-progress]');
    const mobileIndex = journey.querySelector('[data-journey-mobile-index]');
    const mobileTitle = journey.querySelector('[data-journey-mobile-title]');
    const mobileNext = journey.querySelector('[data-journey-mobile-next]');

    if (sticky && shell && scene && track && panels.length) {
      let current = -1;
      let targetStep = 0;
      let visualStep = 0;
      let journeyPhase = 'pre-lock';
      let raf = 0;
      let lastFrame = 0;
      let resizing = false;
      let resizeTimer = 0;
      let preservedResizeStep = 0;
      let preservedResizePhase = 'pre-lock';

      const setActive = (index) => {
        const safeIndex = Math.max(0, Math.min(index, panels.length - 1));
        const changed = safeIndex !== current;
        current = safeIndex;

        stages.forEach((stage, i) => {
          const active = i === safeIndex;
          const completed = i < safeIndex;
          stageItems[i]?.classList.toggle('journey__stage-item--active', active);
          stageItems[i]?.classList.toggle('journey__stage-item--complete', completed);
          if (active) stage.setAttribute('aria-current', 'step');
          else stage.removeAttribute('aria-current');
        });

        panels.forEach((panel, i) => {
          const active = i === safeIndex;
          panel.classList.toggle('journey__panel--active', active);
          panel.hidden = reduceMotion.matches ? !active : false;
        });

        if (changed && mobileProgress) {
          const title = panels[safeIndex]?.querySelector('h3')?.textContent?.replace(/^\\d{2}\\s*/, '').trim() || '';
          const nextTitle = panels[safeIndex + 1]?.querySelector('h3')?.textContent?.replace(/^\\d{2}\\s*/, '').trim();

          mobileProgress.setAttribute('aria-valuenow', String(safeIndex + 1));
          if (mobileIndex) mobileIndex.textContent = String(safeIndex + 1).padStart(2, '0');
          if (mobileTitle) mobileTitle.textContent = title;
          if (mobileNext) mobileNext.textContent = nextTitle ? 'Далее: ' + nextTitle : 'Маршрут завершён';
        }
      };

      const motionMs = (name, fallback) => {
        const value = getComputedStyle(document.documentElement).getPropertyValue(name).trim();
        if (!value) return fallback;
        if (value.endsWith('ms')) return Number.parseFloat(value);
        if (value.endsWith('s')) return Number.parseFloat(value) * 1000;
        return fallback;
      };

      const compactStepScroll = () => {
        const rootSize = Number.parseFloat(getComputedStyle(document.documentElement).fontSize) || 16;
        return rootSize * 20;
      };

      const syncCompactGeometry = () => {
        if (!compactJourney.matches) {
          journey.style.removeProperty('--journey-scene-top');
          shell.style.removeProperty('height');
          return;
        }

        const edgeGap = 16;
        const sceneHeight = scene.offsetHeight;
        const sceneTop = Math.min(edgeGap, window.innerHeight - sceneHeight - edgeGap);
        const runway = Math.max(1, panels.length - 1) * compactStepScroll();

        journey.style.setProperty('--journey-scene-top', sceneTop.toFixed(2) + 'px');
        shell.style.height = (sceneHeight + runway).toFixed(2) + 'px';
      };

      const metrics = () => {
        if (compactJourney.matches) {
          syncCompactGeometry();
          const sceneTop = Number.parseFloat(getComputedStyle(scene).top) || 0;
          const shellTop = shell.getBoundingClientRect().top + window.scrollY;

          return {
            start:shellTop - sceneTop,
            max:Math.max(1, shell.offsetHeight - scene.offsetHeight)
          };
        }

        const stickyTop = Number.parseFloat(getComputedStyle(sticky).top) || 0;
        return {
          start:journey.offsetTop - stickyTop,
          max:Math.max(1, journey.offsetHeight - window.innerHeight)
        };
      };

      const readTarget = () => {
        const { start, max } = metrics();
        const rawPassed = window.scrollY - start;
        const lastIndex = Math.max(0, panels.length - 1);
        const stepDistance = panels.length > 1
          ? panels[1].offsetLeft - panels[0].offsetLeft
          : track.clientWidth;

        if (rawPassed <= 0) {
          journeyPhase = 'pre-lock';
          return { step:0, lastIndex, stepDistance };
        }

        if (rawPassed >= max) {
          journeyPhase = 'post-lock';
          return { step:lastIndex, lastIndex, stepDistance };
        }

        journeyPhase = 'locked';
        return {
          step:(rawPassed / max) * lastIndex,
          lastIndex,
          stepDistance
        };
      };

      const scrollToStep = (index) => {
        const { start, max } = metrics();
        const denominator = Math.max(1, panels.length - 1);
        const target = start + (index / denominator) * max;
        window.scrollTo({
          top:Math.max(0, target),
          behavior:reduceMotion.matches ? 'auto' : 'smooth'
        });
      };

      stages.forEach((stage) => {
        stage.addEventListener('click', () => scrollToStep(Number(stage.dataset.journeyStep)));
      });

      const paint = ({ lastIndex, stepDistance }) => {
        const visualRatio = lastIndex ? visualStep / lastIndex : 0;
        const activeIndex = Math.min(lastIndex, Math.round(visualStep));

        journey.style.setProperty('--journey-progress', visualRatio.toFixed(4));
        setActive(activeIndex);

        panels.forEach((panel, index) => {
          if (reduceMotion.matches) {
            panel.style.opacity = index === activeIndex ? '1' : '0';
            panel.style.transform = 'none';
            return;
          }

          const distance = Math.min(1, Math.abs(index - visualStep));
          panel.style.opacity = (1 - distance * .82).toFixed(3);
          panel.style.transform = 'scale(' + (1 - distance * .14).toFixed(4) + ')';
        });

        track.style.transform = reduceMotion.matches
          ? 'translate3d(0,0,0)'
          : 'translate3d(' + (-visualStep * stepDistance).toFixed(2) + 'px,0,0)';
      };

      const frame = (time) => {
        raf = 0;
        const state = readTarget();
        targetStep = state.step;

        if (reduceMotion.matches) {
          visualStep = targetStep;
          lastFrame = time;
          paint(state);
          return;
        }

        const elapsed = lastFrame ? Math.min(time - lastFrame, 64) : 16.67;
        lastFrame = time;
        const response = Math.max(90, motionMs('--motion-normal', 520) * .3);
        const alpha = 1 - Math.exp(-elapsed / response);
        visualStep += (targetStep - visualStep) * alpha;

        if (Math.abs(targetStep - visualStep) < .001) visualStep = targetStep;
        paint(state);

        if (visualStep !== targetStep) raf = requestAnimationFrame(frame);
      };

      const scheduleJourney = () => {
        if (!raf) raf = requestAnimationFrame(frame);
      };

      syncCompactGeometry();
      const initial = readTarget();
      targetStep = initial.step;
      visualStep = initial.step;
      paint(initial);

      addEventListener('scroll', () => {
        if (!resizing) scheduleJourney();
      }, { passive:true });

      const resizeObserver = 'ResizeObserver' in window
        ? new ResizeObserver(() => {
            syncCompactGeometry();
            if (!resizing) scheduleJourney();
          })
        : null;

      resizeObserver?.observe(scene);

      addEventListener('resize', () => {
        if (!resizing) {
          resizing = true;
          preservedResizeStep = targetStep;
          preservedResizePhase = journeyPhase;
        }

        clearTimeout(resizeTimer);
        syncCompactGeometry();

        resizeTimer = setTimeout(() => {
          if (raf) {
            cancelAnimationFrame(raf);
            raf = 0;
          }

          lastFrame = 0;
          syncCompactGeometry();

          if (preservedResizePhase === 'locked') {
            const { start, max } = metrics();
            const lastIndex = Math.max(0, panels.length - 1);
            const ratio = lastIndex ? preservedResizeStep / lastIndex : 0;
            window.scrollTo({
              top:Math.max(0, start + ratio * max),
              behavior:'auto'
            });
          }

          resizing = false;
          const state = readTarget();
          targetStep = state.step;
          visualStep = state.step;
          paint(state);
        }, 120);
      }, { passive:true });

      compactJourney.addEventListener?.('change', () => {
        syncCompactGeometry();
        lastFrame = 0;
        scheduleJourney();
      });

      reduceMotion.addEventListener?.('change', () => {
        lastFrame = 0;
        scheduleJourney();
      });
    }
  }

})();
