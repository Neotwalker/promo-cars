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
    const stages = [...journey.querySelectorAll('[data-journey-step]')];
    const stageItems = [...journey.querySelectorAll('[data-journey-item]')];
    const panels = [...journey.querySelectorAll('[data-journey-panel]')];
    const track = journey.querySelector('[data-journey-track]');
    const mobileProgress = journey.querySelector('[data-journey-mobile-progress]');
    const mobileIndex = journey.querySelector('[data-journey-mobile-index]');
    const mobileTitle = journey.querySelector('[data-journey-mobile-title]');
    const mobileNext = journey.querySelector('[data-journey-mobile-next]');

    if (sticky && track && panels.length) {
      let current = -1;

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
          const title = panels[safeIndex]?.querySelector('h3')?.textContent?.replace(/^\d{2}\s*/, '').trim() || '';
          const nextTitle = panels[safeIndex + 1]?.querySelector('h3')?.textContent?.replace(/^\d{2}\s*/, '').trim();

          mobileProgress.setAttribute('aria-valuenow', String(safeIndex + 1));
          if (mobileIndex) mobileIndex.textContent = String(safeIndex + 1).padStart(2, '0');
          if (mobileTitle) mobileTitle.textContent = title;
          if (mobileNext) mobileNext.textContent = nextTitle ? 'Далее: ' + nextTitle : 'Маршрут завершён';
        }
      };

      const metrics = () => {
        const stickyTop = Number.parseFloat(getComputedStyle(sticky).top) || 0;
        return {
          stickyTop,
          max:Math.max(1, journey.offsetHeight - window.innerHeight)
        };
      };

      const scrollToStep = (index) => {
        const { stickyTop, max } = metrics();
        const denominator = Math.max(1, panels.length - 1);
        const target = journey.offsetTop - stickyTop + (index / denominator) * max;
        window.scrollTo({
          top:Math.max(0, target),
          behavior:reduceMotion.matches ? 'auto' : 'smooth'
        });
      };

      stages.forEach((stage) => {
        stage.addEventListener('click', () => scrollToStep(Number(stage.dataset.journeyStep)));
      });

      const motionMs = (name, fallback) => {
        const value = getComputedStyle(document.documentElement).getPropertyValue(name).trim();
        if (!value) return fallback;
        if (value.endsWith('ms')) return Number.parseFloat(value);
        if (value.endsWith('s')) return Number.parseFloat(value) * 1000;
        return fallback;
      };

      const readTarget = () => {
        const { stickyTop, max } = metrics();
        const rect = journey.getBoundingClientRect();
        const passed = Math.min(Math.max(-rect.top + stickyTop, 0), max);
        const ratio = passed / max;
        const lastIndex = Math.max(0, panels.length - 1);
        const stepDistance = panels.length > 1
          ? panels[1].offsetLeft - panels[0].offsetLeft
          : track.clientWidth;

        return {
          step:ratio * lastIndex,
          lastIndex,
          stepDistance
        };
      };

      let targetStep = 0;
      let visualStep = 0;
      let raf = 0;
      let lastFrame = 0;

      const paint = ({ lastIndex, stepDistance }) => {
        const visualRatio = lastIndex ? visualStep / lastIndex : 0;
        const activeIndex = Math.min(lastIndex, Math.floor(visualStep + .001));

        journey.style.setProperty('--journey-progress', visualRatio.toFixed(4));
        setActive(activeIndex);

        if (reduceMotion.matches) {
          track.style.transform = 'translate3d(0,0,0)';
        } else {
          track.style.transform = 'translate3d(' + (-visualStep * stepDistance).toFixed(2) + 'px,0,0)';
        }
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

      const initial = readTarget();
      targetStep = initial.step;
      visualStep = initial.step;
      paint(initial);

      addEventListener('scroll', scheduleJourney, { passive:true });
      addEventListener('resize', () => {
        lastFrame = 0;
        scheduleJourney();
      }, { passive:true });

      reduceMotion.addEventListener?.('change', () => {
        lastFrame = 0;
        scheduleJourney();
      });
    }
  }

})();
