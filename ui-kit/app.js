(() => {
  const pageLayers = () => [...document.querySelectorAll('main, footer')];

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

  document.querySelectorAll('[data-toast-close]').forEach((button) => {
    button.addEventListener('click', () => {
      button.closest('[data-toast-item]')?.remove();
    });
  });
})();
