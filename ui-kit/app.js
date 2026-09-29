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

    if (!root.classList.contains('site-header--burger')) {
      const desktop = window.matchMedia('(min-width:64.001rem)');
      desktop.addEventListener('change', (event) => {
        if (event.matches && toggle.getAttribute('aria-expanded') === 'true') setOpen(false);
      });
    }
  });

  document.querySelectorAll('[data-cars-catalog]').forEach((root) => {
    const grid = root.querySelector('[data-car-grid]');
    const filterSelect = root.querySelector('[data-car-filter-select]');
    const sort = root.querySelector('[data-car-sort]');
    if (!grid || !filterSelect || !sort) return;

    const cards = [...grid.querySelectorAll('[data-car-card]')];
    const filterTrigger = filterSelect.querySelector('[data-car-filter-trigger]');
    const filterMenu = filterSelect.querySelector('[data-car-filter-menu]');
    const filterLabel = filterSelect.querySelector('[data-car-filter-label]');
    const filterOptions = [...filterSelect.querySelectorAll('[data-car-filter]')];
    const sortTrigger = sort.querySelector('[data-car-sort-trigger]');
    const sortMenu = sort.querySelector('[data-car-sort-menu]');
    const sortLabel = sort.querySelector('[data-car-sort-label]');
    const sortOptions = [...sort.querySelectorAll('[data-car-sort-option]')];
    let sortMode = 'popular';

    const sortCards = (mode = sortMode) => {
      sortMode = mode;
      const sorted = [...cards].sort((a, b) => {
        if (mode === 'price-asc') return Number(a.dataset.price) - Number(b.dataset.price);
        if (mode === 'price-desc') return Number(b.dataset.price) - Number(a.dataset.price);
        if (mode === 'delivery') return Number(a.dataset.delivery) - Number(b.dataset.delivery);
        return Number(a.dataset.order) - Number(b.dataset.order);
      });

      sorted.forEach((card) => grid.append(card));
    };

    const applyFilter = (filter) => {
      cards.forEach((card) => {
        const categories = card.dataset.category?.split(' ') || [];
        card.hidden = filter !== 'all' && !categories.includes(filter);
      });
    };

    const initListbox = ({
      container,
      trigger,
      menu,
      label,
      options,
      activeClass,
      valueOf,
      onSelect
    }) => {
      if (!trigger || !menu || !label || !options.length) return null;

      const setOpen = (open, focusOption = false) => {
        trigger.setAttribute('aria-expanded', String(open));
        menu.hidden = !open;

        if (open && focusOption) {
          const active = options.find((option) => option.getAttribute('aria-selected') === 'true') || options[0];
          requestAnimationFrame(() => active.focus());
        }
      };

      const select = (option) => {
        const value = valueOf(option);
        if (!value) return;

        options.forEach((item) => {
          const selected = item === option;
          item.classList.toggle(activeClass, selected);
          item.setAttribute('aria-selected', String(selected));
        });

        label.textContent = option.textContent.trim();
        onSelect(value);
        setOpen(false);
        trigger.focus();
      };

      trigger.addEventListener('click', () => {
        setOpen(trigger.getAttribute('aria-expanded') !== 'true');
      });

      trigger.addEventListener('keydown', (event) => {
        if (event.key !== 'ArrowDown' && event.key !== 'ArrowUp') return;
        event.preventDefault();
        setOpen(true, true);
      });

      options.forEach((option) => {
        option.addEventListener('click', () => select(option));
      });

      menu.addEventListener('keydown', (event) => {
        const current = options.indexOf(document.activeElement);

        if (event.key === 'Escape') {
          event.preventDefault();
          setOpen(false);
          trigger.focus();
          return;
        }

        if (event.key === 'Tab') {
          setOpen(false);
          return;
        }

        if (event.key === 'Enter' || event.key === ' ') {
          if (current < 0) return;
          event.preventDefault();
          select(options[current]);
          return;
        }

        let next = current;
        if (event.key === 'ArrowDown') next = current < options.length - 1 ? current + 1 : 0;
        else if (event.key === 'ArrowUp') next = current > 0 ? current - 1 : options.length - 1;
        else if (event.key === 'Home') next = 0;
        else if (event.key === 'End') next = options.length - 1;
        else return;

        event.preventDefault();
        options[next].focus();
      });

      document.addEventListener('click', (event) => {
        if (!container.contains(event.target)) setOpen(false);
      });

      return { setOpen };
    };

    initListbox({
      container:filterSelect,
      trigger:filterTrigger,
      menu:filterMenu,
      label:filterLabel,
      options:filterOptions,
      activeClass:'cars__filter-option--active',
      valueOf:(option) => option.dataset.carFilter,
      onSelect:applyFilter
    });

    initListbox({
      container:sort,
      trigger:sortTrigger,
      menu:sortMenu,
      label:sortLabel,
      options:sortOptions,
      activeClass:'cars__sort-option--active',
      valueOf:(option) => option.dataset.carSortOption,
      onSelect:sortCards
    });
  });

  const modalLayers = () => [...document.querySelectorAll('body > header, body > main, body > footer')];
  const modalByName = new Map(
    [...document.querySelectorAll('[data-modal]')].map((modal) => [modal.dataset.modal, modal])
  );
  let activeModal = null;
  let modalRestoreFocus = null;
  let modalAnimations = [];

  const measureScrollbar = () => {
    const current = Math.max(0, window.innerWidth - document.documentElement.clientWidth);
    if (current) return current;
    if (document.documentElement.scrollHeight <= window.innerHeight) return 0;

    const probe = document.createElement('div');
    probe.setAttribute('aria-hidden', 'true');
    probe.style.cssText = 'position:absolute;top:-9999px;width:100px;height:100px;overflow:scroll;';
    document.body.append(probe);
    const width = Math.max(0, probe.offsetWidth - probe.clientWidth);
    probe.remove();
    return width;
  };

  const setModalScrollLock = (locked) => {
    if (locked) {
      document.documentElement.style.setProperty('--modal-scrollbar-compensation', measureScrollbar() + 'px');
      document.body.classList.add('modal-open');
      return;
    }
    document.body.classList.remove('modal-open');
    document.documentElement.style.removeProperty('--modal-scrollbar-compensation');
  };

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
    setModalScrollLock(false);
    activeModal = null;
    if (returnFocus && modalRestoreFocus instanceof HTMLElement) modalRestoreFocus.focus();
    modalRestoreFocus = null;
  };

  const setModalOpen = (modal, open, trigger = null, returnFocus = true) => {
    if (!modal) return;
    const dialog = modal.querySelector('[data-modal-dialog]');
    const backdrop = modal.querySelector('[data-modal-backdrop]');
    if (!dialog || !backdrop) return;

    stopModalAnimations();

    if (open) {
      if (activeModal && activeModal !== modal) finishModalClose(activeModal, false);
      const openMenuToggle = document.querySelector('[data-menu-toggle][aria-expanded="true"]');
      const triggerInMenu = trigger instanceof HTMLElement && trigger.closest('[data-menu-panel]');
      modalRestoreFocus = triggerInMenu && openMenuToggle
        ? openMenuToggle
        : trigger instanceof HTMLElement
          ? trigger
          : document.activeElement;
      openMenuToggle?.click();
      modal.hidden = false;
      modal.setAttribute('aria-hidden', 'false');
      setModalScrollLock(true);
      modalLayers().forEach((layer) => { layer.inert = true; });
      activeModal = modal;

      if (!reduceMotion.matches) {
        const overlayAnimation = backdrop.animate(
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
    const overlayAnimation = backdrop.animate(
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
