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
    let menuAnimation = null;

    const focusables = () => [
      toggle,
      ...panel.querySelectorAll('a[href],button:not([disabled]),input:not([disabled]),select:not([disabled]),textarea:not([disabled]),[tabindex]:not([tabindex="-1"])')
    ].filter((node) => !node.hidden);

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
      menuAnimation?.cancel();
      menuAnimation = null;

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
        const animation = panel.animate(
          [from, { opacity:'1', transform:'translateY(0)' }],
          {
            duration:motionMs('--motion-slow', 760),
            easing:motionEase('--ease-standard', 'ease'),
            fill:'both'
          }
        );
        menuAnimation = animation;
        animation.onfinish = () => {
          if (menuAnimation !== animation) return;
          animation.cancel();
          menuAnimation = null;
        };
      } else if (!panel.hidden) {
        panel.inert = true;
        const animation = panel.animate(
          [from, { opacity:'0', transform:'translateY(-1rem)' }],
          {
            duration:motionMs('--motion-slow', 760),
            easing:motionEase('--ease-standard', 'ease'),
            fill:'both'
          }
        );
        menuAnimation = animation;
        animation.onfinish = () => {
          if (menuAnimation !== animation || toggle.getAttribute('aria-expanded') === 'true') return;
          panel.hidden = true;
          panel.inert = false;
          animation.cancel();
          menuAnimation = null;
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

    const desktop = window.matchMedia('(min-width:64.001rem)');
    desktop.addEventListener('change', (event) => {
      if (event.matches && toggle.getAttribute('aria-expanded') === 'true') setOpen(false);
    });
  });


  const modalLayers = () => [...document.querySelectorAll('body > header, body > main, body > footer')];
  const modalByName = new Map(
    [...document.querySelectorAll('[data-modal]')].map((modal) => [modal.dataset.modal, modal])
  );
  let activeModal = null;
  let modalRestoreFocus = null;
  let modalAnimations = [];

  const modalFocusable = (modal) => [
    ...modal.querySelectorAll('a[href],button:not([disabled]),input:not([disabled]),select:not([disabled]),textarea:not([disabled]),[tabindex]:not([tabindex="-1"])')
  ].filter((node) => !node.hidden && !node.closest('[hidden]'));

  const stopModalAnimations = () => {
    modalAnimations.forEach((animation) => animation.cancel());
    modalAnimations = [];
  };

  const finishModalClose = (modal, returnFocus) => {
    modal.hidden = true;
    modal.setAttribute('aria-hidden', 'true');
    modalLayers().forEach((layer) => { layer.inert = false; });
    document.body.classList.remove('modal-open');
    activeModal = null;
    if (returnFocus && modalRestoreFocus instanceof HTMLElement) modalRestoreFocus.focus();
    modalRestoreFocus = null;
  };

  const setModalOpen = (modal, open, trigger = null, returnFocus = true) => {
    if (!modal) return;
    const dialog = modal.querySelector('[data-modal-dialog]');
    if (!dialog) return;

    stopModalAnimations();

    if (open) {
      if (activeModal && activeModal !== modal) finishModalClose(activeModal, false);
      const openMenuToggle = document.querySelector('[data-menu-toggle][aria-expanded="true"]');
      openMenuToggle?.click();

      modalRestoreFocus = trigger instanceof HTMLElement ? trigger : document.activeElement;
      modal.hidden = false;
      modal.setAttribute('aria-hidden', 'false');
      document.body.classList.add('modal-open');
      modalLayers().forEach((layer) => { layer.inert = true; });
      activeModal = modal;

      if (!reduceMotion.matches) {
        const overlayAnimation = modal.animate(
          [{ opacity:0 }, { opacity:1 }],
          {
            duration:motionMs('--motion-normal', 520),
            easing:motionEase('--ease-standard', 'ease'),
            fill:'both'
          }
        );
        const dialogAnimation = dialog.animate(
          [
            { opacity:0, transform:'translateY(1.5rem) scale(.985)' },
            { opacity:1, transform:'translateY(0) scale(1)' }
          ],
          {
            duration:motionMs('--motion-normal', 520),
            easing:motionEase('--ease-emphasized', 'ease'),
            fill:'both'
          }
        );
        modalAnimations = [overlayAnimation, dialogAnimation];
        dialogAnimation.onfinish = () => {
          if (activeModal !== modal) return;
          stopModalAnimations();
        };
      }

      requestAnimationFrame(() => {
        const first = modalFocusable(modal)[0];
        (first || dialog).focus();
      });
      return;
    }

    if (activeModal !== modal) return;
    if (reduceMotion.matches) {
      finishModalClose(modal, returnFocus);
      return;
    }

    modalLayers().forEach((layer) => { layer.inert = true; });
    const overlayAnimation = modal.animate(
      [{ opacity:1 }, { opacity:0 }],
      {
        duration:motionMs('--motion-normal', 520),
        easing:motionEase('--ease-standard', 'ease'),
        fill:'both'
      }
    );
    const dialogAnimation = dialog.animate(
      [
        { opacity:1, transform:'translateY(0) scale(1)' },
        { opacity:0, transform:'translateY(1rem) scale(.99)' }
      ],
      {
        duration:motionMs('--motion-normal', 520),
        easing:motionEase('--ease-standard', 'ease'),
        fill:'both'
      }
    );
    modalAnimations = [overlayAnimation, dialogAnimation];
    overlayAnimation.onfinish = () => {
      if (activeModal !== modal) return;
      stopModalAnimations();
      finishModalClose(modal, returnFocus);
    };
  };

  document.addEventListener('click', (event) => {
    const opener = event.target.closest('[data-modal-open]');
    if (opener) {
      event.preventDefault();
      setModalOpen(modalByName.get(opener.dataset.modalOpen), true, opener);
      return;
    }

    if (!activeModal) return;
    if (event.target.closest('[data-modal-close]') || event.target.matches('[data-modal-backdrop]')) {
      event.preventDefault();
      setModalOpen(activeModal, false);
    }
  });

  document.addEventListener('keydown', (event) => {
    if (!activeModal) return;

    if (event.key === 'Escape') {
      event.preventDefault();
      setModalOpen(activeModal, false);
      return;
    }

    if (event.key !== 'Tab') return;
    const items = modalFocusable(activeModal);
    if (!items.length) {
      event.preventDefault();
      activeModal.querySelector('[data-modal-dialog]')?.focus();
      return;
    }

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

  modalByName.forEach((modal) => {
    modal.addEventListener('nexroute:modal-close', () => setModalOpen(modal, false));
  });

  const accordionAnimations = new WeakMap();
  const accordionStates = new WeakMap();

  const accordionExpanded = (details) => (
    accordionStates.has(details) ? accordionStates.get(details) : details.open
  );

  const setAccordionOpen = (details, open) => {
    const summary = details.querySelector('[data-accordion-trigger]');
    const content = details.querySelector('[data-accordion-content]');
    accordionStates.set(details, open);
    details.dataset.accordionExpanded = String(open);
    summary?.setAttribute('aria-expanded', String(open));

    if (!summary || !content) {
      details.open = open;
      return;
    }

    const currentHeight = details.getBoundingClientRect().height;
    accordionAnimations.get(details)?.cancel();

    if (open) {
      const group = details.closest('[data-faq]');
      group?.querySelectorAll('[data-accordion]').forEach((other) => {
        if (other !== details && accordionExpanded(other)) setAccordionOpen(other, false);
      });
    }

    if (reduceMotion.matches) {
      details.open = open;
      details.style.height = '';
      details.style.overflow = '';
      accordionAnimations.delete(details);
      return;
    }

    if (open) details.open = true;
    const targetHeight = open ? summary.offsetHeight + content.offsetHeight : summary.offsetHeight;
    details.style.overflow = 'hidden';

    const animation = details.animate(
      { height:[currentHeight + 'px', targetHeight + 'px'] },
      {
        duration:motionMs('--motion-normal', 520),
        easing:motionEase('--ease-standard', 'ease'),
        fill:'none'
      }
    );

    accordionAnimations.set(details, animation);
    animation.onfinish = () => {
      if (accordionAnimations.get(details) !== animation) return;
      if (!open) details.open = false;
      details.style.height = '';
      details.style.overflow = '';
      accordionAnimations.delete(details);
    };
  };

  document.querySelectorAll('[data-accordion]').forEach((details) => {
    const summary = details.querySelector('[data-accordion-trigger]');
    if (!summary) return;
    accordionStates.set(details, details.open);
    details.dataset.accordionExpanded = String(details.open);
    summary.setAttribute('aria-expanded', String(details.open));
    summary.addEventListener('click', (event) => {
      event.preventDefault();
      setAccordionOpen(details, !accordionExpanded(details));
    });
  });

  document.querySelectorAll('[data-toast-close]').forEach((button) => {
    button.addEventListener('click', () => {
      button.closest('[data-toast-item]')?.remove();
    });
  });
})();
