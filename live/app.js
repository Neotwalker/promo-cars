(() => {
  const root = document.querySelector('[data-journey]');

  if (!root || root.dataset.ready === 'true') {
    return;
  }

  root.dataset.ready = 'true';

  const steps = [...root.querySelectorAll('[data-journey-step]')];
  const counter = root.querySelector('[data-journey-counter]');
  const progressBar = root.querySelector('[data-journey-progress]');
  const mapFill = root.querySelector('[data-journey-map-fill]');
  const marker = root.querySelector('[data-journey-marker]');
  const nodes = [...root.querySelectorAll('.journey-node')];
  const detail = root.querySelector('.journey-detail');
  const status = root.querySelector('[data-journey-status]');
  const number = root.querySelector('[data-journey-number]');
  const code = root.querySelector('[data-journey-code]');
  const title = root.querySelector('[data-journey-title]');
  const text = root.querySelector('[data-journey-text]');
  const output = root.querySelector('[data-journey-output]');
  const next = root.querySelector('[data-journey-next]');

  const states = [
    {
      status:'STATUS / SEARCH',
      title:'Подбираем автомобиль',
      text:'Сверяем модель, бюджет и требования. Формируем варианты, которые можно проверить до покупки.',
      output:'Shortlist',
      next:'Проверка'
    },
    {
      status:'STATUS / CHECK',
      title:'Проверяем до покупки',
      text:'Проверяем состояние, документы и доступные материалы по выбранному автомобилю до перехода к выкупу.',
      output:'Check report',
      next:'Выкуп'
    },
    {
      status:'STATUS / PURCHASE',
      title:'Фиксируем автомобиль',
      text:'После согласования выбранный автомобиль переходит в этап выкупа и закрепляется за сделкой.',
      output:'Purchase',
      next:'Страхование'
    },
    {
      status:'STATUS / INSURANCE',
      title:'Готовим к отправке',
      text:'Условия перевозки и страхования фиксируются до того, как автомобиль отправится по маршруту.',
      output:'Policy',
      next:'Граница'
    },
    {
      status:'STATUS / TRANSIT',
      title:'Везём к границе',
      text:'Автомобиль движется по согласованному маршруту, а этап сделки меняется вместе с логистикой.',
      output:'Tracking',
      next:'Таможня'
    },
    {
      status:'STATUS / CUSTOMS',
      title:'Проходим таможню',
      text:'Автомобиль проходит таможенные процедуры и получает необходимый комплект документов для дальнейшего движения.',
      output:'Customs',
      next:'ЭПТС'
    },
    {
      status:'STATUS / DOCUMENTS',
      title:'Оформляем ЭПТС',
      text:'Документальная часть завершается перед отправкой автомобиля в конечный город клиента.',
      output:'EPTS',
      next:'Выдача'
    },
    {
      status:'STATUS / HANDOVER',
      title:'Передаём автомобиль',
      text:'Маршрут завершается доставкой в согласованную точку и передачей автомобиля клиенту.',
      output:'Handover',
      next:'Route complete'
    }
  ];

  const desktopQuery = window.matchMedia('(min-width: 1101px)');
  const reducedMotionQuery = window.matchMedia('(prefers-reduced-motion: reduce)');

  let activeIndex = -1;
  let ticking = false;
  let detailTimer = 0;

  const clamp = value => Math.min(1, Math.max(0, value));

  const writeDetail = (state, displayNumber) => {
    code.textContent = 'STEP / ' + displayNumber;
    title.textContent = state.title;
    text.textContent = state.text;
    output.textContent = state.output;
    next.textContent = state.next;
  };

  const transitionDetail = (state, displayNumber, immediate = false) => {
    window.clearTimeout(detailTimer);

    if (immediate || reducedMotionQuery.matches) {
      detail.classList.remove('is-leaving','is-entering');
      writeDetail(state, displayNumber);
      return;
    }

    detail.classList.remove('is-entering');
    detail.classList.add('is-leaving');

    detailTimer = window.setTimeout(() => {
      writeDetail(state, displayNumber);
      detail.classList.remove('is-leaving');
      detail.classList.add('is-entering');

      window.requestAnimationFrame(() => {
        window.requestAnimationFrame(() => {
          detail.classList.remove('is-entering');
        });
      });
    }, 140);
  };

  const renderState = index => {
    const safeIndex = Math.min(states.length - 1, Math.max(0, index));

    if (safeIndex === activeIndex) {
      return;
    }

    const isInitial = activeIndex === -1;
    activeIndex = safeIndex;
    const state = states[safeIndex];

    steps.forEach((button, buttonIndex) => {
      const item = button.closest('li');
      const isActive = buttonIndex === safeIndex;

      item?.classList.toggle('is-active', isActive);

      if (isActive) {
        button.setAttribute('aria-current', 'step');
      } else {
        button.removeAttribute('aria-current');
      }
    });

    nodes.forEach((node, nodeIndex) => {
      node.classList.toggle('is-complete', nodeIndex <= safeIndex);
      node.classList.toggle('is-current', nodeIndex === safeIndex);
    });

    const displayNumber = String(safeIndex + 1).padStart(2, '0');

    counter.textContent = displayNumber + ' / 08';
    status.textContent = state.status;
    number.textContent = displayNumber;
    transitionDetail(state, displayNumber, isInitial);
  };

  const renderProgress = progress => {
    const safeProgress = clamp(progress);
    const percent = safeProgress * 100;

    progressBar.style.width = percent + '%';
    mapFill.style.width = percent + '%';
    marker.style.left = percent + '%';

    if (!reducedMotionQuery.matches) {
      const carOffset = (safeProgress - .5) * 3;
      root.style.setProperty('--journey-car-shift', carOffset.toFixed(2) + 'rem');
    } else {
      root.style.setProperty('--journey-car-shift', '0rem');
    }
  };

  const updateFromScroll = () => {
    ticking = false;

    if (!desktopQuery.matches) {
      return;
    }

    const rect = root.getBoundingClientRect();
    const rootFontSize = parseFloat(getComputedStyle(document.documentElement).fontSize) || 10;
    const stickyTop = rootFontSize * 8;
    const scrollable = Math.max(1, root.offsetHeight - window.innerHeight + stickyTop);
    const progress = clamp((stickyTop - rect.top) / scrollable);
    const index = Math.min(states.length - 1, Math.floor(progress * states.length));

    renderState(index);

    if (reducedMotionQuery.matches) {
      renderProgress(index / (states.length - 1));
    } else {
      renderProgress(progress);
    }
  };

  const requestScrollUpdate = () => {
    if (ticking) {
      return;
    }

    ticking = true;
    window.requestAnimationFrame(updateFromScroll);
  };

  const selectStep = index => {
    renderState(index);
    renderProgress(index / (states.length - 1));

    if (!desktopQuery.matches) {
      return;
    }

    const rootFontSize = parseFloat(getComputedStyle(document.documentElement).fontSize) || 10;
    const stickyTop = rootFontSize * 8;
    const scrollable = Math.max(1, root.offsetHeight - window.innerHeight + stickyTop);
    const rootTop = window.scrollY + root.getBoundingClientRect().top;
    const target = rootTop - stickyTop + scrollable * (index / (states.length - 1));

    window.scrollTo({
      top:target,
      behavior:reducedMotionQuery.matches ? 'auto' : 'smooth'
    });
  };

  steps.forEach(button => {
    button.addEventListener('click', () => {
      selectStep(Number(button.dataset.journeyStep));
    });
  });

  window.addEventListener('scroll', requestScrollUpdate, {passive:true});
  window.addEventListener('resize', requestScrollUpdate, {passive:true});

  desktopQuery.addEventListener('change', () => {
    if (desktopQuery.matches) {
      requestScrollUpdate();
    } else {
      renderProgress(activeIndex / (states.length - 1));
    }
  });

  reducedMotionQuery.addEventListener('change', requestScrollUpdate);

  renderState(0);
  renderProgress(0);
  requestScrollUpdate();
})();


(() => {
  const root = document.querySelector('[data-configurator]');

  if (!root || root.dataset.ready === 'true') {
    return;
  }

  root.dataset.ready = 'true';

  const groups = [...root.querySelectorAll('[data-config-group]')];
  const cityInput = root.querySelector('[data-config-city]');
    
  const targets = {
    model:[
      root.querySelector('[data-config-selected-model]'),
      root.querySelector('[data-config-output-model]'),
      root.querySelector('[data-config-summary-model]')
    ],
    power:[
      root.querySelector('[data-config-selected-power]'),
      root.querySelector('[data-config-summary-power]')
    ],
    condition:[
      root.querySelector('[data-config-selected-condition]'),
      root.querySelector('[data-config-summary-condition]')
    ],
    budget:[
      root.querySelector('[data-config-output-budget]')
    ],
    city:[
      root.querySelector('[data-config-output-city]'),
      root.querySelector('[data-config-summary-city]')
    ]
  };

  const setText = (key, value) => {
    targets[key].forEach(target => {
      if (target) {
        target.textContent = value;
      }
    });
  };

  groups.forEach(group => {
    group.addEventListener('click', event => {
      const button = event.target.closest('.choice-chip');

      if (!button || !group.contains(button)) {
        return;
      }

      group.querySelectorAll('.choice-chip').forEach(option => {
        option.setAttribute('aria-pressed', option === button ? 'true' : 'false');
      });

      setText(group.dataset.configGroup, button.dataset.value);
    });
  });

  cityInput.addEventListener('input', () => {
    const value = cityInput.value.trim() || 'Город';
    setText('city', value);
  });

})();


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

    const setClosedStyles = () => {
      answer.style.height = '0px';
      answer.style.opacity = '0';
      answer.style.overflow = 'hidden';
    };

    const clearOpenStyles = () => {
      answer.style.height = '';
      answer.style.opacity = '';
      answer.style.overflow = '';
    };

    if (item.open) {
      clearOpenStyles();
    } else {
      setClosedStyles();
    }

    const finishImmediately = open => {
      const running = animation;
      animation = null;
      running?.cancel();

      targetOpen = open;
      item.classList.remove('is-closing');

      if (open) {
        item.open = true;
        clearOpenStyles();
      } else {
        setClosedStyles();
        item.open = false;
      }
    };

    const animateTo = open => {
      if (reducedMotionQuery.matches || typeof answer.animate !== 'function') {
        finishImmediately(open);
        return;
      }

      const currentHeight = item.open ? answer.getBoundingClientRect().height : 0;
      const currentOpacity = item.open
        ? Math.max(0, Math.min(1, Number.parseFloat(getComputedStyle(answer).opacity) || 1))
        : 0;

      if (animation) {
        const running = animation;
        animation = null;
        running.cancel();
      }

      targetOpen = open;

      if (open && !item.open) {
        setClosedStyles();
        item.open = true;
      }

      item.classList.toggle('is-closing', !open);

      const endHeight = open ? answer.scrollHeight : 0;
      const startHeight = currentHeight;
      const startOpacity = open && startHeight === 0 ? 0 : currentOpacity;

      answer.style.height = startHeight + 'px';
      answer.style.opacity = String(startOpacity);
      answer.style.overflow = 'hidden';

      // Force layout after the first closed → open transition so the browser
      // starts from the prepared zero-height state instead of flashing content.
      void answer.offsetHeight;

      const running = answer.animate(
        [
          {height:startHeight + 'px', opacity:startOpacity},
          {height:endHeight + 'px', opacity:open ? 1 : 0}
        ],
        {
          duration,
          easing,
          fill:'forwards'
        }
      );

      animation = running;

      running.onfinish = () => {
        if (animation !== running) {
          return;
        }

        animation = null;
        item.classList.remove('is-closing');

        if (targetOpen) {
          item.open = true;
          clearOpenStyles();
        } else {
          setClosedStyles();
          item.open = false;
        }
      };

      running.oncancel = () => {
        if (animation === running) {
          animation = null;
        }
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


(() => {
  const root = document.querySelector('[data-final-cta]');

  if (!root || root.dataset.ready === 'true') {
    return;
  }

  root.dataset.ready = 'true';

  const reducedMotionQuery = window.matchMedia('(prefers-reduced-motion: reduce)');

  const reveal = () => {
    root.classList.add('is-visible');
  };

  if (reducedMotionQuery.matches || typeof IntersectionObserver === 'undefined') {
    reveal();
    return;
  }

  const observer = new IntersectionObserver(entries => {
    if (!entries.some(entry => entry.isIntersecting)) {
      return;
    }

    reveal();
    observer.disconnect();
  }, {
    threshold:.28
  });

  observer.observe(root);

  reducedMotionQuery.addEventListener('change', event => {
    if (event.matches) {
      reveal();
      observer.disconnect();
    }
  });
})();
