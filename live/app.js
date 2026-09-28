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

  const motionMs = (name, fallback) => {
    const value = getComputedStyle(document.documentElement).getPropertyValue(name).trim();
    const parsed = Number.parseFloat(value);
    if (!Number.isFinite(parsed)) return fallback;
    return value.endsWith('ms') ? parsed : parsed * 1000;
  };

  const motionEase = (name, fallback) => (
    getComputedStyle(document.documentElement).getPropertyValue(name).trim() || fallback
  );

  document.querySelectorAll('[data-menu]').forEach((root) => {
    const toggle = root.querySelector('[data-menu-toggle]');
    const panel = root.querySelector('[data-menu-panel]');
    if (!toggle || !panel) return;

    let restoreFocus = null;
    let animation = null;
    const pageLayers = () => [...document.querySelectorAll('body > main, body > footer')];

    const focusables = () => [
      toggle,
      ...panel.querySelectorAll('a[href],button:not([disabled]),input:not([disabled]),select:not([disabled]),textarea:not([disabled]),[tabindex]:not([tabindex="-1"])')
    ].filter((node) => !node.hidden && !node.closest('[hidden]'));

    const panelFrame = () => {
      if (panel.hidden) return { opacity:'0', transform:'translateY(-1rem)' };
      const styles = getComputedStyle(panel);
      return {
        opacity:styles.opacity,
        transform:styles.transform === 'none' ? 'translateY(0)' : styles.transform
      };
    };

    const setOpen = (open, returnFocus = false) => {
      const from = panelFrame();
      animation?.cancel();
      animation = null;

      toggle.setAttribute('aria-expanded', String(open));
      toggle.setAttribute('aria-label', open ? 'Закрыть меню' : 'Открыть меню');
      root.classList.toggle('menu--open', open);
      document.body.classList.toggle('menu-open', open);
      pageLayers().forEach((layer) => { layer.inert = open; });

      if (reduceMotion.matches) {
        panel.hidden = !open;
        panel.inert = false;
      } else if (open) {
        panel.hidden = false;
        panel.inert = false;
        animation = panel.animate(
          [from, { opacity:'1', transform:'translateY(0)' }],
          {
            duration:motionMs('--motion-slow', 760),
            easing:motionEase('--ease-standard', 'ease'),
            fill:'both'
          }
        );
        animation.onfinish = () => {
          animation?.cancel();
          animation = null;
        };
      } else {
        animation = panel.animate(
          [from, { opacity:'0', transform:'translateY(-1rem)' }],
          {
            duration:motionMs('--motion-slow', 760),
            easing:motionEase('--ease-standard', 'ease'),
            fill:'both'
          }
        );
        const closingAnimation = animation;
        closingAnimation.onfinish = () => {
          if (animation !== closingAnimation || toggle.getAttribute('aria-expanded') === 'true') return;
          panel.hidden = true;
          panel.inert = false;
          closingAnimation.cancel();
          animation = null;
        };
      }

      if (open) {
        restoreFocus = document.activeElement;
        requestAnimationFrame(() => panel.querySelector('a[href],button:not([disabled])')?.focus());
      } else if (returnFocus) {
        (restoreFocus instanceof HTMLElement ? restoreFocus : toggle).focus();
      }
    };

    toggle.addEventListener('click', () => {
      setOpen(toggle.getAttribute('aria-expanded') !== 'true');
    });

    panel.addEventListener('click', (event) => {
      if (event.target.closest('a[href]')) setOpen(false);
    });

    document.addEventListener('keydown', (event) => {
      if (toggle.getAttribute('aria-expanded') !== 'true') return;

      if (event.key === 'Escape') {
        event.preventDefault();
        setOpen(false, true);
        return;
      }

      if (event.key !== 'Tab') return;
      const items = focusables();
      if (!items.length) return;
      const first = items[0];
      const last = items[items.length - 1];

      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    });
  });
})();
