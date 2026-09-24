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

  const desktopQuery = window.matchMedia('(min-width: 1024px)');
  const reducedMotionQuery = window.matchMedia('(prefers-reduced-motion: reduce)');

  let activeIndex = -1;
  let ticking = false;

  const clamp = value => Math.min(1, Math.max(0, value));

  const renderState = index => {
    const safeIndex = Math.min(states.length - 1, Math.max(0, index));

    if (safeIndex === activeIndex) {
      return;
    }

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

    const displayNumber = String(safeIndex + 1).padStart(2, '0');

    counter.textContent = displayNumber + ' / 08';
    status.textContent = state.status;
    number.textContent = displayNumber;
    code.textContent = 'STEP / ' + displayNumber;
    title.textContent = state.title;
    text.textContent = state.text;
    output.textContent = state.output;
    next.textContent = state.next;
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
