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
    const smallMobileJourney = window.matchMedia('(max-width: 30rem)');
    const mobileProgress = journey.querySelector('[data-journey-mobile-progress]');
    const mobileIndex = journey.querySelector('[data-journey-mobile-index]');
    const mobileTitle = journey.querySelector('[data-journey-mobile-title]');
    const mobileNext = journey.querySelector('[data-journey-mobile-next]');

    if (sticky && shell && scene && track && panels.length) {
      const lastIndex = Math.max(0, panels.length - 1);
      const rootStyle = getComputedStyle(document.documentElement);
      const rootSize = Number.parseFloat(rootStyle.fontSize) || 16;
      const motionValue = rootStyle.getPropertyValue('--motion-normal').trim();
      const motionMs = motionValue.endsWith('ms')
        ? Number.parseFloat(motionValue)
        : motionValue.endsWith('s')
          ? Number.parseFloat(motionValue) * 1000
          : 520;
      const motionResponse = Math.max(90, motionMs * .3);
      const compactStepScroll = rootSize * 20;

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
      let compactViewportHeight = window.innerHeight;
      let layoutWidth = window.innerWidth;
      let journeyStart = 0;
      let journeyRange = 1;
      let stepDistance = track.clientWidth;

      const setActive = (index, force = false) => {
        const safeIndex = Math.max(0, Math.min(index, lastIndex));
        if (!force && safeIndex === current) return;

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
          panel.classList.toggle('journey__panel--active', i === safeIndex);
          panel.hidden = false;
        });

        if (mobileProgress) {
          const title = panels[safeIndex]?.querySelector('h3')?.textContent?.replace(/^\\d{2}\\s*/, '').trim() || '';
          const nextTitle = panels[safeIndex + 1]?.querySelector('h3')?.textContent?.replace(/^\\d{2}\\s*/, '').trim();

          mobileProgress.setAttribute('aria-valuenow', String(safeIndex + 1));
          if (mobileIndex) mobileIndex.textContent = String(safeIndex + 1).padStart(2, '0');
          if (mobileTitle) mobileTitle.textContent = title;
          if (mobileNext) mobileNext.textContent = nextTitle ? 'Далее: ' + nextTitle : 'Маршрут завершён';
        }
      };

      const refreshGeometry = ({ refreshViewportHeight = false } = {}) => {
        stepDistance = panels.length > 1
          ? panels[1].offsetLeft - panels[0].offsetLeft
          : track.clientWidth;

        if (reduceMotion.matches) {
          journey.style.removeProperty('--journey-scene-top');
          shell.style.removeProperty('height');
          journeyStart = 0;
          journeyRange = 1;
          return;
        }

        if (compactJourney.matches) {
          if (refreshViewportHeight) compactViewportHeight = window.innerHeight;

          const edgeGap = 16;
          const sceneHeight = scene.offsetHeight;
          const sceneTop = Math.min(edgeGap, compactViewportHeight - sceneHeight - edgeGap);
          const compactRunway = Math.max(1, lastIndex) * compactStepScroll;
          const releaseTail = Math.max(
            edgeGap,
            compactViewportHeight - sceneHeight - sceneTop
          );

          journey.style.setProperty('--journey-scene-top', sceneTop.toFixed(2) + 'px');
          shell.style.height = (sceneHeight + compactRunway + releaseTail).toFixed(2) + 'px';

          journeyStart = shell.getBoundingClientRect().top + window.scrollY - sceneTop;
          journeyRange = Math.max(1, compactRunway);
          return;
        }

        journey.style.removeProperty('--journey-scene-top');
        shell.style.removeProperty('height');

        const stickyTop = Number.parseFloat(getComputedStyle(sticky).top) || 0;
        journeyStart = journey.offsetTop - stickyTop;
        journeyRange = Math.max(1, journey.offsetHeight - window.innerHeight);
      };

      const readTarget = () => {
        if (reduceMotion.matches) {
          journeyPhase = 'pre-lock';
          return { step:0, lastIndex, stepDistance };
        }

        const rawPassed = window.scrollY - journeyStart;

        if (rawPassed <= 0) {
          journeyPhase = 'pre-lock';
          return { step:0, lastIndex, stepDistance };
        }

        if (rawPassed >= journeyRange) {
          journeyPhase = 'post-lock';
          return { step:lastIndex, lastIndex, stepDistance };
        }

        journeyPhase = 'locked';
        return {
          step:(rawPassed / journeyRange) * lastIndex,
          lastIndex,
          stepDistance
        };
      };

      const scrollToStep = (index) => {
        const safeIndex = Math.max(0, Math.min(index, lastIndex));

        if (reduceMotion.matches) {
          panels[safeIndex]?.scrollIntoView({ behavior:'auto', block:'start' });
          return;
        }

        const denominator = Math.max(1, lastIndex);
        const target = journeyStart + (safeIndex / denominator) * journeyRange;
        window.scrollTo({
          top:Math.max(0, target),
          behavior:'smooth'
        });
      };

      stages.forEach((stage) => {
        stage.addEventListener('click', () => scrollToStep(Number(stage.dataset.journeyStep)));
      });

      const paint = ({ lastIndex: stateLastIndex, stepDistance: stateStepDistance }) => {
        const visualRatio = stateLastIndex ? visualStep / stateLastIndex : 0;
        const activeIndex = Math.min(stateLastIndex, Math.round(visualStep));

        journey.style.setProperty('--journey-progress', visualRatio.toFixed(4));
        setActive(activeIndex);

        if (reduceMotion.matches) {
          panels.forEach((panel) => {
            panel.style.opacity = '1';
            panel.style.transform = 'none';
          });
          track.style.transform = 'none';
          return;
        }

        const opacityDrop = smallMobileJourney.matches ? .72 : .82;
        const scaleDrop = smallMobileJourney.matches ? .08 : .14;

        panels.forEach((panel, index) => {
          const distance = Math.min(1, Math.abs(index - visualStep));
          panel.style.opacity = (1 - distance * opacityDrop).toFixed(3);
          panel.style.transform = 'scale(' + (1 - distance * scaleDrop).toFixed(4) + ')';
        });

        track.style.transform = 'translate3d(' + (-visualStep * stateStepDistance).toFixed(2) + 'px,0,0)';
      };

      const frame = (time) => {
        raf = 0;
        const state = readTarget();
        targetStep = state.step;

        if (reduceMotion.matches) {
          visualStep = 0;
          lastFrame = time;
          paint(state);
          return;
        }

        const elapsed = lastFrame ? Math.min(time - lastFrame, 64) : 16.67;
        lastFrame = time;
        const alpha = 1 - Math.exp(-elapsed / motionResponse);
        visualStep += (targetStep - visualStep) * alpha;

        if (Math.abs(targetStep - visualStep) < .001) visualStep = targetStep;
        paint(state);

        if (visualStep !== targetStep) raf = requestAnimationFrame(frame);
      };

      const scheduleJourney = () => {
        if (!raf) raf = requestAnimationFrame(frame);
      };

      const resetJourney = ({ refreshViewportHeight = false } = {}) => {
        if (raf) {
          cancelAnimationFrame(raf);
          raf = 0;
        }

        lastFrame = 0;
        refreshGeometry({ refreshViewportHeight });

        const state = readTarget();
        targetStep = state.step;
        visualStep = reduceMotion.matches ? 0 : state.step;
        setActive(reduceMotion.matches ? 0 : Math.round(visualStep), true);
        paint({
          lastIndex,
          stepDistance
        });
      };

      resetJourney({ refreshViewportHeight:true });

      addEventListener('scroll', () => {
        if (!resizing && !reduceMotion.matches) scheduleJourney();
      }, { passive:true });

      const resizeObserver = 'ResizeObserver' in window
        ? new ResizeObserver(() => {
            refreshGeometry();
            if (!resizing && !reduceMotion.matches) scheduleJourney();
          })
        : null;

      resizeObserver?.observe(scene);

      addEventListener('resize', () => {
        const nextWidth = window.innerWidth;
        const widthChanged = Math.abs(nextWidth - layoutWidth) > 1;

        if (compactJourney.matches && !widthChanged) return;

        layoutWidth = nextWidth;

        if (!resizing) {
          resizing = true;
          preservedResizeStep = targetStep;
          preservedResizePhase = journeyPhase;
        }

        clearTimeout(resizeTimer);
        refreshGeometry({ refreshViewportHeight:true });

        resizeTimer = setTimeout(() => {
          if (raf) {
            cancelAnimationFrame(raf);
            raf = 0;
          }

          lastFrame = 0;
          refreshGeometry({ refreshViewportHeight:true });

          if (!reduceMotion.matches && preservedResizePhase === 'locked') {
            const ratio = lastIndex ? preservedResizeStep / lastIndex : 0;
            window.scrollTo({
              top:Math.max(0, journeyStart + ratio * journeyRange),
              behavior:'auto'
            });
          }

          resizing = false;
          const state = readTarget();
          targetStep = state.step;
          visualStep = reduceMotion.matches ? 0 : state.step;
          setActive(reduceMotion.matches ? 0 : Math.round(visualStep), true);
          paint({ lastIndex, stepDistance });
        }, 120);
      }, { passive:true });

      compactJourney.addEventListener?.('change', () => {
        layoutWidth = window.innerWidth;
        resetJourney({ refreshViewportHeight:true });
      });

      smallMobileJourney.addEventListener?.('change', () => {
        if (!reduceMotion.matches) scheduleJourney();
      });

      reduceMotion.addEventListener?.('change', () => {
        clearTimeout(resizeTimer);
        resizing = false;
        resetJourney({ refreshViewportHeight:true });
      });
    }
  }

})();
