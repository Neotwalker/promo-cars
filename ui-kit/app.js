(() => {
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
  const pageLayers = () => [...document.querySelectorAll('main, footer')];

  const motionMs = (name, fallback) => {
    const value = getComputedStyle(document.documentElement).getPropertyValue(name).trim();
    if (!value) return fallback;
    if (value.endsWith('ms')) return Number.parseFloat(value);
    if (value.endsWith('s')) return Number.parseFloat(value) * 1000;
    return fallback;
  };

  const motionEase = (name, fallback) => (
    getComputedStyle(document.documentElement).getPropertyValue(name).trim() || fallback
  );

  document.querySelectorAll('[data-menu]').forEach((root) => {
    const toggle = root.querySelector('[data-menu-toggle]');
    const panel = root.querySelector('[data-menu-panel]');
    if (!toggle || !panel) return;

    let restoreFocus = null;

    const focusables = () => [
      toggle,
      ...panel.querySelectorAll('a[href],button:not([disabled]),input:not([disabled]),select:not([disabled]),textarea:not([disabled]),[tabindex]:not([tabindex="-1"])')
    ].filter((node) => !node.hidden);

    const setOpen = (open, returnFocus = false) => {
      toggle.setAttribute('aria-expanded', String(open));
      toggle.setAttribute('aria-label', open ? 'Закрыть меню' : 'Открыть меню');
      panel.hidden = !open;
      root.classList.toggle('menu--open', open);
      document.body.classList.toggle('menu-open', open);
      pageLayers().forEach((layer) => { layer.inert = open; });

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

    const desktop = window.matchMedia('(min-width:64.001rem)');
    desktop.addEventListener('change', (event) => {
      if (event.matches && toggle.getAttribute('aria-expanded') === 'true') setOpen(false);
    });
  });

  const accordionAnimations = new WeakMap();

  const setAccordionOpen = (details, open) => {
    const summary = details.querySelector('[data-accordion-trigger]');
    const content = details.querySelector('[data-accordion-content]');
    if (!summary || !content) {
      details.open = open;
      return;
    }

    const currentHeight = details.getBoundingClientRect().height;
    accordionAnimations.get(details)?.cancel();

    if (open) {
      const group = details.closest('[data-faq]');
      group?.querySelectorAll('[data-accordion][open]').forEach((other) => {
        if (other !== details) setAccordionOpen(other, false);
      });
    }

    if (reduceMotion.matches) {
      details.open = open;
      details.style.height = '';
      details.style.overflow = '';
      return;
    }

    if (open) details.open = true;
    const targetHeight = open ? summary.offsetHeight + content.offsetHeight : summary.offsetHeight;
    details.style.overflow = 'hidden';

    const animation = details.animate(
      { height:[currentHeight + 'px', targetHeight + 'px'] },
      {
        duration:motionMs('--motion-normal', 520),
        easing:motionEase('--ease-emphasized', 'ease'),
        fill:'none'
      }
    );

    accordionAnimations.set(details, animation);
    animation.onfinish = () => {
      if (!open) details.open = false;
      details.style.height = '';
      details.style.overflow = '';
      if (accordionAnimations.get(details) === animation) accordionAnimations.delete(details);
    };
  };

  document.querySelectorAll('[data-accordion]').forEach((details) => {
    const summary = details.querySelector('[data-accordion-trigger]');
    if (!summary) return;
    summary.addEventListener('click', (event) => {
      event.preventDefault();
      setAccordionOpen(details, !details.open);
    });
  });

  document.querySelectorAll('[data-toast-close]').forEach((button) => {
    button.addEventListener('click', () => {
      button.closest('[data-toast-item]')?.remove();
    });
  });
})();
