(() => {
  const section = document.querySelector('#final-calculation');
  if (!section) return;

  let loaded = false;

  const loadGradient = () => {
    if (loaded || document.querySelector('script[data-final-gradient-script]')) return;
    loaded = true;

    const script = document.createElement('script');
    script.src = './final-gradient.js';
    script.async = true;
    script.dataset.finalGradientScript = '';
    document.body.append(script);
  };

  if (!('IntersectionObserver' in window)) {
    loadGradient();
    return;
  }

  const observer = new IntersectionObserver((entries) => {
    if (!entries.some((entry) => entry.isIntersecting)) return;
    observer.disconnect();
    loadGradient();
  },{rootMargin:'1000px 0px',threshold:0});

  observer.observe(section);
})();

(() => {
  const header = document.querySelector('.site-header--hero');
  if (!header) return;

  let frame = 0;

  const syncHeader = () => {
    frame = 0;
    header.classList.toggle('site-header--scrolled',window.scrollY > 24);
  };

  const scheduleHeader = () => {
    if (frame) return;
    frame = requestAnimationFrame(syncHeader);
  };

  syncHeader();
  window.addEventListener('scroll',scheduleHeader,{passive:true});
})();

const nexroutePhoneDigits = (value = '') => {
  let digits = value.replace(/\D/g,'');
  if (digits.startsWith('7') || digits.startsWith('8')) digits = digits.slice(1);
  return digits.slice(0,10);
};

const nexrouteFormatPhone = (value = '') => {
  const digits = nexroutePhoneDigits(value);
  if (!digits) return '';

  let result = '+7 (' + digits.slice(0,3);
  if (digits.length > 3) result += ') ' + digits.slice(3,6);
  if (digits.length > 6) result += '-' + digits.slice(6,8);
  if (digits.length > 8) result += '-' + digits.slice(8,10);
  return result;
};

(() => {
  const stack = document.querySelector('[data-site-toasts]');
  if (!stack) return;

  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
  let dismissTimer = 0;
  let removeTimer = 0;

  const removeToast = (toast) => {
    if (!toast?.isConnected) return;

    if (reduceMotion.matches) {
      toast.remove();
      return;
    }

    toast.classList.remove('is-visible');
    toast.classList.add('is-leaving');

    clearTimeout(removeTimer);
    removeTimer = window.setTimeout(() => {
      if (toast.isConnected) toast.remove();
    }, 380);
  };

  document.addEventListener('nexroute:toast', (event) => {
    const detail = event.detail || {};
    const title = detail.title || 'Готово';
    const message = detail.message || '';
    const type = detail.type || 'success';

    clearTimeout(dismissTimer);
    clearTimeout(removeTimer);

    const existing = stack.querySelector('[data-toast-item]');
    if (existing) existing.remove();

    const toast = document.createElement('div');
    toast.className = 'toast toast--' + type;
    toast.dataset.toastItem = '';
    toast.setAttribute('role',type === 'error' ? 'alert' : 'status');
    toast.innerHTML = '<strong></strong><span></span><button class="toast__close" type="button" aria-label="Закрыть уведомление">×</button>';
    toast.querySelector('strong').textContent = title;
    toast.querySelector('span').textContent = message;
    toast.querySelector('[data-toast-close],.toast__close')?.addEventListener('click', () => removeToast(toast));
    stack.append(toast);

    requestAnimationFrame(() => {
      requestAnimationFrame(() => toast.classList.add('is-visible'));
    });

    dismissTimer = window.setTimeout(() => {
      removeToast(toast);
    }, type === 'error' ? 6500 : 4200);
  });
})();

(() => {
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)');

  const video = document.querySelector('[data-hero-video]');
  const hero = video?.closest('.hero');
  const desktopMedia = window.matchMedia('(min-width: 48rem)');
  let heroVisible = true;

  if (hero) {
    const rect = hero.getBoundingClientRect();
    heroVisible = rect.bottom > 0 && rect.top < window.innerHeight;
  }

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

    if (heroVisible && !document.hidden) video.play().catch(() => {});
    else video.pause();
  };

  const heroObserver = hero && 'IntersectionObserver' in window
    ? new IntersectionObserver((entries) => {
        heroVisible = entries[0]?.isIntersecting ?? false;
        syncVideo();
      },{threshold:.02})
    : null;

  heroObserver?.observe(hero);

  syncVideo();
  reduceMotion.addEventListener?.('change', syncVideo);
  desktopMedia.addEventListener?.('change', syncVideo);

  document.addEventListener('visibilitychange', () => {
    if (!video) return;
    if (document.hidden) video.pause();
    else syncVideo();
  });

  window.addEventListener('pagehide',() => heroObserver?.disconnect(),{once:true});

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


  const configurator = document.querySelector('[data-configurator]');

  if (configurator) {
    const pricing = {
      'Zeekr 001 AWD': {
        power:'Электромобиль',
        total:6490000,
        eta:'30–38 дней',
        image:'./assets/configurator/configurator-right-1.webp',
        parts:[4820000,355000,930000,3400,61600,320000]
      },
      'Xiaomi SU7 Max': {
        power:'Электромобиль',
        total:5890000,
        eta:'28–36 дней',
        image:'./assets/configurator/configurator-right-2.webp',
        parts:[4320000,350000,840000,3400,56600,320000]
      },
      'Li Auto L6 Pro': {
        power:'Гибрид / EREV',
        total:5390000,
        eta:'32–40 дней',
        image:'./assets/configurator/configurator-right-3.webp',
        parts:[3870000,350000,790000,3400,56600,320000]
      }
    };

    const deliveryCities = [
      'Москва',
      'Санкт-Петербург',
      'Новосибирск',
      'Екатеринбург',
      'Казань',
      'Красноярск',
      'Нижний Новгород',
      'Челябинск',
      'Уфа',
      'Краснодар',
      'Самара',
      'Ростов-на-Дону',
      'Омск',
      'Воронеж',
      'Пермь',
      'Волгоград'
    ];

    const money = (value) => new Intl.NumberFormat('ru-RU').format(value) + ' ₽';
    const form = configurator.querySelector('[data-config-form]');
    const layout = configurator.querySelector('[data-config-layout]');
    const summary = configurator.querySelector('[data-config-summary]');
    const steps = [...configurator.querySelectorAll('[data-config-step]')];
    const compactSummary = window.matchMedia('(max-width: 47.9375rem)');
    const allOrder = ['model','condition','power','budget','city','contact'];

    const state = {
      model:'Zeekr 001 AWD',
      condition:'Новый',
      power:'Электромобиль',
      budget:'5 500 000–6 500 000 ₽',
      city:'Москва',
      channel:'Telegram',
      contact:''
    };

    let current = 0;

    const refs = {
      model:configurator.querySelector('[data-config-model]'),
      city:configurator.querySelector('[data-config-city]'),
      cityOptions:[...configurator.querySelectorAll('[data-config-choice="city"] [data-value]')],
      contact:configurator.querySelector('[data-config-contact]'),
      contactLabel:configurator.querySelector('[data-config-contact-label]'),
      back:configurator.querySelector('[data-config-back]'),
      next:configurator.querySelector('[data-config-next]'),
      submit:configurator.querySelector('[data-config-submit]'),
      progress:configurator.querySelector('[data-config-progress]'),
      progressbar:configurator.querySelector('[data-config-progressbar]'),
      progressCount:configurator.querySelector('[data-config-progress-count]'),
      summaryMedia:configurator.querySelector('[data-config-summary-media]'),
      summaryImage:configurator.querySelector('[data-summary-image]'),
      summaryModel:configurator.querySelector('[data-summary-model]'),
      summaryMeta:configurator.querySelector('[data-summary-meta]'),
      summaryTotal:configurator.querySelector('[data-summary-total]'),
      summaryEta:configurator.querySelector('[data-summary-eta]'),
      summaryNote:configurator.querySelector('[data-summary-note]'),
      regional:configurator.querySelector('[data-summary-regional]'),
      regionalLabel:configurator.querySelector('[data-summary-regional-label]'),
      breakdown:configurator.querySelector('[data-summary-breakdown]')
    };

    Object.values(pricing).forEach((item) => {
      const preload = new Image();
      preload.src = item.image;
    });

    const visibleOrder = () => pricing[state.model]
      ? ['model','condition','budget','city','contact']
      : allOrder;

    const activeName = () => visibleOrder()[Math.max(0, Math.min(current, visibleOrder().length - 1))];

    const setPressed = (groupName, value) => {
      configurator.querySelectorAll('[data-config-choice="' + groupName + '"] [data-value]').forEach((button) => {
        const selected = button.dataset.value === value;
        button.setAttribute('aria-pressed', String(selected));
      });
      const message = configurator.querySelector('[data-choice-message="' + groupName + '"]');
      if (message) message.textContent = '';
    };

    const setChoice = (groupName, value) => {
      state[groupName] = value;
      setPressed(groupName, value);
    };

    const filterCityOptions = (query = '') => {
      const normalized = query.trim().toLowerCase();
      refs.cityOptions.forEach((button) => {
        const visible = !normalized || button.dataset.value.toLowerCase().includes(normalized);
        button.hidden = !visible;
      });
    };


    const contactValues = {
      'Телефон':'',
      'Telegram':''
    };

    const syncContactMode = () => {
      const isPhone = state.channel === 'Телефон';
      refs.contactLabel.textContent = isPhone ? 'Телефон' : 'Username в Telegram';
      refs.contact.placeholder = isPhone ? '+7 (___) ___-__-__' : '@username';
      refs.contact.autocomplete = isPhone ? 'tel' : 'off';
      refs.contact.inputMode = isPhone ? 'tel' : 'text';
      refs.contact.maxLength = isPhone ? 18 : 64;

      if (isPhone) {
        refs.contact.value = nexrouteFormatPhone(contactValues['Телефон']);
        state.contact = nexroutePhoneDigits(contactValues['Телефон']);
      } else {
        refs.contact.value = contactValues['Telegram'];
        state.contact = contactValues['Telegram'].trim();
      }

      clearFieldError(refs.contact,'Контакт нужен только для отправки расчёта.');
    };

    const clearFieldError = (input, messageText) => {
      const field = input?.closest('[data-field]');
      field?.classList.remove('is-error');
      input?.removeAttribute('aria-invalid');
      const message = field?.nextElementSibling;
      if (message?.matches('[data-field-message]') && messageText !== undefined) {
        message.textContent = messageText;
      }
    };

    const fieldError = (input, messageText) => {
      const field = input.closest('[data-field]');
      const message = field?.nextElementSibling;
      field?.classList.add('is-error');
      input.setAttribute('aria-invalid','true');
      if (message?.matches('[data-field-message]')) message.textContent = messageText;
      input.focus();
      return false;
    };

    const choiceError = (groupName, messageText) => {
      const message = configurator.querySelector('[data-choice-message="' + groupName + '"]');
      if (message) message.textContent = messageText;
      configurator.querySelector('[data-config-choice="' + groupName + '"] [data-value]')?.focus();
      return false;
    };

    let summaryImageSwapId = 0;
    let summaryImageTransitioning = false;
    let summaryImageQueuedSrc = '';
    let summaryImageActiveSrc = refs.summaryImage.getAttribute('src') || '';

    const clearIncomingSummaryImage = () => {
      refs.summaryMedia.querySelectorAll('.configurator__summary-image--incoming').forEach((image) => image.remove());
    };

    const resetSummaryImageTransition = () => {
      summaryImageSwapId += 1;
      summaryImageTransitioning = false;
      summaryImageQueuedSrc = '';
      clearIncomingSummaryImage();
    };

    const hideSummaryImage = () => {
      resetSummaryImageTransition();
      refs.summaryImage.style.removeProperty('opacity');
      refs.summaryMedia.classList.add('is-generic');
    };

    const finishSummaryImageSwap = (incoming, nextSrc, swapId) => {
      if (swapId !== summaryImageSwapId || !incoming.isConnected) return;

      refs.summaryImage.src = nextSrc;
      summaryImageActiveSrc = nextSrc;
      refs.summaryImage.style.removeProperty('opacity');
      incoming.remove();
      summaryImageTransitioning = false;

      const queuedSrc = summaryImageQueuedSrc;
      summaryImageQueuedSrc = '';

      if (queuedSrc && queuedSrc !== summaryImageActiveSrc) {
        swapSummaryImage(queuedSrc);
      }
    };

    const swapSummaryImage = (nextSrc) => {
      if (!nextSrc) return;

      refs.summaryMedia.classList.remove('is-generic');

      const summaryIsVisible = !compactSummary.matches || summary.parentElement === form;
      if (!summaryIsVisible) {
        resetSummaryImageTransition();
        refs.summaryImage.src = nextSrc;
        summaryImageActiveSrc = nextSrc;
        refs.summaryImage.style.removeProperty('opacity');
        return;
      }

      if (nextSrc === summaryImageActiveSrc && !summaryImageTransitioning) {
        refs.summaryImage.style.removeProperty('opacity');
        return;
      }

      if (summaryImageTransitioning) {
        summaryImageQueuedSrc = nextSrc;
        return;
      }

      if (reduceMotion.matches) {
        resetSummaryImageTransition();
        refs.summaryImage.src = nextSrc;
        summaryImageActiveSrc = nextSrc;
        refs.summaryImage.style.removeProperty('opacity');
        return;
      }

      const swapId = ++summaryImageSwapId;
      summaryImageTransitioning = true;
      summaryImageQueuedSrc = '';

      const incoming = document.createElement('img');
      incoming.className = 'configurator__summary-image--incoming';
      incoming.alt = '';
      incoming.decoding = 'async';
      incoming.src = nextSrc;

      const reveal = () => {
        if (swapId !== summaryImageSwapId || !summaryImageTransitioning) return;

        clearIncomingSummaryImage();
        refs.summaryMedia.insertBefore(incoming, refs.summaryMedia.querySelector('.configurator__summary-heading'));

        requestAnimationFrame(() => {
          if (swapId !== summaryImageSwapId || !incoming.isConnected) return;
          incoming.classList.add('is-visible');
        });

        const onTransitionEnd = (event) => {
          if (event.propertyName !== 'opacity') return;
          incoming.removeEventListener('transitionend', onTransitionEnd);
          finishSummaryImageSwap(incoming, nextSrc, swapId);
        };

        incoming.addEventListener('transitionend', onTransitionEnd);

        window.setTimeout(() => {
          finishSummaryImageSwap(incoming, nextSrc, swapId);
        }, 520);
      };

      incoming.decode().then(reveal).catch(reveal);
    };

    const renderSummary = () => {
      const known = pricing[state.model];
      const city = state.city || 'Город не выбран';
      const power = known?.power || state.power || 'Тип уточним';
      const condition = state.condition || 'Состояние не выбрано';
      const budget = state.budget || 'Бюджет не выбран';
      const isMoscow = city.trim().toLowerCase() === 'москва';
      const dds = [...refs.breakdown.querySelectorAll('div:not(.configurator__regional) dd')];

      refs.summaryModel.textContent = state.model || 'Автомобиль не выбран';
      refs.summaryMeta.textContent = [condition,power,budget,city].join(' · ');

      if (known) {
        known.parts.forEach((value,index) => {
          if (dds[index]) dds[index].textContent = money(value);
        });

        swapSummaryImage(known.image);
        refs.summaryTotal.textContent = money(known.total) + (isMoscow ? '' : ' + доставка');
        refs.summaryEta.textContent = known.eta;
        refs.summaryNote.textContent = 'Финальная смета зависит от конкретного автомобиля, курса на момент выкупа и города получения.';
      } else if (state.model === 'Нужен подбор') {
        dds.forEach((dd) => { dd.textContent = '—'; });
        hideSummaryImage();
        refs.summaryTotal.textContent = 'Подберём варианты';
        refs.summaryEta.textContent = 'после подбора';
        refs.summaryNote.textContent = 'Подберём несколько вариантов в вашем бюджете и покажем для каждого цену под ключ, комплектацию и срок доставки.';
      } else {
        dds.forEach((dd) => { dd.textContent = '—'; });
        hideSummaryImage();
        refs.summaryTotal.textContent = state.model ? 'Расчёт после проверки модели' : 'Сначала выберите автомобиль';
        refs.summaryEta.textContent = 'уточним';
        refs.summaryNote.textContent = 'Конкретную сумму покажем после проверки модели. Структура сметы останется той же.';
      }

      refs.regional.hidden = !state.city || isMoscow;
      if (!refs.regional.hidden) refs.regionalLabel.textContent = 'Доставка до ' + state.city;
    };

    const syncSummaryPlacement = () => {
      const contactStep = configurator.querySelector('[data-config-step="contact"]');

      if (compactSummary.matches && activeName() === 'contact') {
        if (summary.parentElement !== form) contactStep.before(summary);
      } else if (summary.parentElement !== layout) {
        layout.append(summary);
      }
    };

    const renderStep = ({ focusQuestion = false } = {}) => {
      const list = visibleOrder();
      current = Math.max(0, Math.min(current, list.length - 1));
      const name = list[current];

      steps.forEach((step) => {
        const active = step.dataset.configStep === name;
        step.hidden = !active;
        step.classList.toggle('configurator__step--active', active);
      });

      refs.back.disabled = current === 0;
      const isLast = current === list.length - 1;
      refs.next.hidden = isLast;
      refs.submit.hidden = !isLast;

      const progress = ((current + 1) / list.length) * 100;
      refs.progress.style.width = progress.toFixed(2) + '%';
      refs.progressbar.setAttribute('aria-valuemax', String(list.length));
      refs.progressbar.setAttribute('aria-valuenow', String(current + 1));
      refs.progressCount.textContent = (current + 1) + ' из ' + list.length;

      renderSummary();
      syncSummaryPlacement();

      const revealMobileSummary = compactSummary.matches && name === 'contact' && summary.parentElement === form;
      if (revealMobileSummary) {
        requestAnimationFrame(() => {
          summary.scrollIntoView({
            behavior:reduceMotion.matches ? 'auto' : 'smooth',
            block:'start'
          });
        });
        return;
      }

      if (focusQuestion) {
        const activeStep = steps.find((step) => step.dataset.configStep === name);
        const question = activeStep?.querySelector('.configurator__question');
        question?.setAttribute('tabindex','-1');
        question?.focus({preventScroll:true});
      }
    };

    const validateCurrent = () => {
      const name = activeName();

      if (name === 'model' && !state.model) {
        return fieldError(refs.model,'Укажите модель или выберите «нужен подбор».');
      }
      if (name === 'condition' && !state.condition) {
        return choiceError('condition','Выберите состояние автомобиля.');
      }
      if (name === 'power' && !state.power) {
        return choiceError('power','Выберите тип силовой установки.');
      }
      if (name === 'budget' && !state.budget) {
        return choiceError('budget','Выберите бюджет или вариант «Нужен ориентир».');
      }
      if (name === 'city' && !deliveryCities.includes(state.city)) {
        return fieldError(refs.city,'Выберите город из списка доступной доставки.');
      }
      return true;
    };

    configurator.querySelectorAll('[data-config-choice]').forEach((group) => {
      group.addEventListener('click', (event) => {
        const button = event.target.closest('[data-value]');
        if (!button) return;
        const key = group.dataset.configChoice;
        const value = button.dataset.value;

        setChoice(key,value);

        if (key === 'model') {
          state.model = value;
          refs.model.value = value === 'Нужен подбор' ? '' : value;
          clearFieldError(refs.model,'Можно указать любую марку или модель.');
          const known = pricing[value];
          state.power = known?.power || '';
          setPressed('power',state.power);
        }

        if (key === 'city') {
          refs.city.value = value;
          state.city = value;
          filterCityOptions();
          clearFieldError(refs.city,'Доставка доступна в города-миллионники. Начните вводить название или выберите город из списка.');
        }

        if (key === 'channel') {
          syncContactMode();
        }

        renderSummary();
      });
    });

    refs.model.addEventListener('input', () => {
      const value = refs.model.value.trim();
      const exact = Object.keys(pricing).find((name) => name.toLowerCase() === value.toLowerCase());
      state.model = exact || value;

      if (exact) {
        setPressed('model',exact);
        state.power = pricing[exact].power;
        setPressed('power',state.power);
      } else {
        setPressed('model','');
        state.power = '';
        setPressed('power','');
      }

      clearFieldError(refs.model,'Можно указать любую марку или модель.');
      renderSummary();
    });

    refs.city.addEventListener('focus', () => {
      filterCityOptions();
    });

    refs.city.addEventListener('input', () => {
      const query = refs.city.value.trim();
      const exact = deliveryCities.find((city) => city.toLowerCase() === query.toLowerCase());

      state.city = exact || '';
      setPressed('city',state.city);
      filterCityOptions(query);
      clearFieldError(refs.city,'Доставка доступна в города-миллионники. Начните вводить название или выберите город из списка.');
      renderSummary();
    });

    refs.contact.addEventListener('input', () => {
      if (state.channel === 'Телефон') {
        const digits = nexroutePhoneDigits(refs.contact.value);
        contactValues['Телефон'] = digits;
        refs.contact.value = nexrouteFormatPhone(digits);
        state.contact = digits;
      } else {
        contactValues['Telegram'] = refs.contact.value;
        state.contact = refs.contact.value.trim();
      }

      clearFieldError(refs.contact,'Контакт нужен только для отправки расчёта.');
    });

    refs.next.addEventListener('click', () => {
      state.model = state.model || refs.model.value.trim();
      if (!validateCurrent()) return;
      current += 1;
      renderStep({focusQuestion:true});
    });

    refs.back.addEventListener('click', () => {
      current -= 1;
      renderStep({focusQuestion:true});
    });

    form.addEventListener('submit', (event) => {
      event.preventDefault();
      state.contact = refs.contact.value.trim();

      if (!state.channel) {
        choiceError('channel','Выберите телефон или Telegram.');
        return;
      }
      if (!state.contact) {
        fieldError(refs.contact,state.channel === 'Телефон' ? 'Укажите номер телефона.' : 'Укажите username в Telegram.');
        return;
      }
      if (state.channel === 'Телефон' && nexroutePhoneDigits(state.contact).length !== 10) {
        fieldError(refs.contact,'Введите номер полностью: +7 (___) ___-__-__.');
        return;
      }

      clearFieldError(refs.contact,'Контакт нужен только для отправки расчёта.');

      document.dispatchEvent(new CustomEvent('nexroute:prefill-final',{
        detail:{
          model:state.model === 'Нужен подбор' ? 'Пока не определился — нужен подбор' : state.model,
          city:state.city,
          channel:state.channel,
          contact:refs.contact.value.trim()
        }
      }));

      document.dispatchEvent(new CustomEvent('nexroute:toast',{
        detail:{
          title:'Расчёт собран.',
          message:'Параметры сохранены в финальной форме. Можно продолжить просмотр страницы.'
        }
      }));

    });

    document.querySelector('[data-config-pick]')?.addEventListener('click', () => {
      state.model = 'Нужен подбор';
      state.power = '';
      refs.model.value = '';
      setPressed('model','Нужен подбор');
      setPressed('power','');
      current = 0;
      renderStep();
      configurator.scrollIntoView({behavior:reduceMotion.matches ? 'auto' : 'smooth',block:'start'});
    });

    compactSummary.addEventListener?.('change', syncSummaryPlacement);

    syncContactMode();
    renderStep();
  }

})();


(() => {
  const cards = [...document.querySelectorAll('[data-proof-case]')];
  if (!cards.length) return;

  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
  const compactCase = window.matchMedia('(max-width:47.9375rem)');

  let revealScrollRaf = 0;
  const revealMobileCase = (target) => {
    if (!(target instanceof HTMLElement)) return;

    const rootSize = Number.parseFloat(getComputedStyle(document.documentElement).fontSize) || 16;
    const headerOffset = (Number.parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--header-h-compact')) || (4 * rootSize)) + (.75 * rootSize);
    const startY = window.scrollY;
    const endY = Math.max(0,target.getBoundingClientRect().top + startY - headerOffset);

    cancelAnimationFrame(revealScrollRaf);

    if (reduceMotion.matches) {
      window.scrollTo(0,endY);
      return;
    }

    const distance = endY - startY;
    if (Math.abs(distance) < 4) return;

    const duration = Math.min(900,Math.max(650,Math.abs(distance) * .9));
    const startTime = performance.now();
    const ease = (t) => t < .5
      ? 4 * t * t * t
      : 1 - Math.pow(-2 * t + 2,3) / 2;

    const step = (now) => {
      const progress = Math.min(1,(now - startTime) / duration);
      window.scrollTo(0,startY + distance * ease(progress));
      if (progress < 1) revealScrollRaf = requestAnimationFrame(step);
    };

    revealScrollRaf = requestAnimationFrame(step);
  };

  const materialMap = {
    zeekr:[
      ['Видео осмотра','video',null,'Фиксация состояния автомобиля перед выкупом и отправкой по маршруту.','video','https://rutube.ru/play/embed/14d8f4c11a0eadb1fa29bfbe0881eca4'],
      ['Сверка комплектации','document','./assets/img/proof/proof-zeekr-checklist.svg','Сопоставление выбранной комплектации с фактическим автомобилем перед выкупом.','checklist'],
      ['Инвойс','document','./assets/img/proof/proof-zeekr-invoice.svg','Расчётный документ по автомобилю в составе материалов сделки.','invoice'],
      ['Страхование перевозки','document','./assets/img/proof/proof-zeekr-insurance.svg','Документ по страхованию автомобиля на этапе перевозки.','insurance'],
      ['Таможенные документы','document','./assets/img/proof/proof-zeekr-customs.svg','Материалы, относящиеся к таможенному оформлению автомобиля.','customs'],
      ['ЭПТС','document','./assets/img/proof/proof-zeekr-epts.svg','Электронный паспорт транспортного средства после оформления.','epts'],
      ['Фото выдачи','photo','./assets/img/proof/proof-zeekr-001-1440.webp','Финальная фотофиксация автомобиля на этапе передачи клиенту.','photo']
    ],
    xiaomi:[
      ['Фото и видео проверки','video',null,'Фото- и видеофиксация автомобиля на этапе проверки перед выкупом.','video','https://rutube.ru/play/embed/14d8f4c11a0eadb1fa29bfbe0881eca4'],
      ['Инвойс','document','./assets/img/proof/proof-xiaomi-invoice.svg','Расчётный документ по автомобилю в составе материалов сделки.','invoice'],
      ['Страхование','document','./assets/img/proof/proof-xiaomi-insurance.svg','Документ по страхованию автомобиля на этапе перевозки.','insurance'],
      ['Статусы маршрута','document','./assets/img/proof/proof-xiaomi-route.svg','Зафиксированные этапы движения автомобиля по маршруту доставки.','checklist'],
      ['Таможенное оформление','document','./assets/img/proof/proof-xiaomi-customs.svg','Материалы, относящиеся к таможенному оформлению автомобиля.','customs'],
      ['ЭПТС','document','./assets/img/proof/proof-xiaomi-epts.svg','Электронный паспорт транспортного средства после оформления.','epts'],
      ['Выдача в Казани','photo','./assets/img/proof/proof-xiaomi-su7-1440.webp','Финальная фиксация автомобиля на этапе передачи клиенту.','photo']
    ],
    'li-auto':[
      ['Осмотр автомобиля','video',null,'Фиксация состояния автомобиля перед выкупом и отправкой по маршруту.','video','https://rutube.ru/play/embed/14d8f4c11a0eadb1fa29bfbe0881eca4'],
      ['Сверка VIN и комплектации','document','./assets/img/proof/proof-li-auto-checklist.svg','Сопоставление VIN и выбранной комплектации с фактическим автомобилем.','checklist'],
      ['Инвойс','document','./assets/img/proof/proof-li-auto-invoice.svg','Расчётный документ по автомобилю в составе материалов сделки.','invoice'],
      ['Страхование перевозки','document','./assets/img/proof/proof-li-auto-insurance.svg','Документ по страхованию автомобиля на этапе перевозки.','insurance'],
      ['Таможенные документы','document','./assets/img/proof/proof-li-auto-customs.svg','Материалы, относящиеся к таможенному оформлению автомобиля.','customs'],
      ['ЭПТС','document','./assets/img/proof/proof-li-auto-epts.svg','Электронный паспорт транспортного средства после оформления.','epts'],
      ['Фото передачи клиенту','photo','./assets/img/proof/proof-li-auto-l6-1440.webp','Финальная фотофиксация автомобиля на этапе передачи клиенту.','photo']
    ]
  };

  const proofIconSrc = (key) => './assets/icons/proof/' + key + '.svg';

  const materialModal = document.querySelector('[data-modal="proof-document-modal"]');
  const modalTitle = materialModal?.querySelector('[data-proof-modal-title]');
  const modalMeta = materialModal?.querySelector('[data-proof-modal-meta]');
  const modalDocument = materialModal?.querySelector('[data-proof-modal-document]');
  const modalVideo = materialModal?.querySelector('[data-proof-modal-video]');

  const clearProofVideo = () => {
    modalVideo?.replaceChildren();
  };

  const prepareProofModal = ({mode,title,meta,documentSrc,documentAlt,videoUrl}) => {
    if (!materialModal || !modalTitle || !modalMeta || !modalDocument || !modalVideo) return;

    modalTitle.textContent = title;
    modalMeta.textContent = meta;
    materialModal.classList.toggle('is-video',mode === 'video');
    materialModal.classList.toggle('is-photo',mode === 'image');

    if (mode === 'video' && videoUrl) {
      modalDocument.hidden = true;
      modalVideo.hidden = false;
      clearProofVideo();

      const iframe = document.createElement('iframe');
      iframe.src = videoUrl;
      iframe.title = title + ' — RUTUBE';
      iframe.allow = 'clipboard-write; autoplay; fullscreen; picture-in-picture';
      iframe.allowFullscreen = true;
      iframe.setAttribute('frameborder','0');
      iframe.setAttribute('referrerpolicy','strict-origin-when-cross-origin');
      modalVideo.append(iframe);
      return;
    }

    clearProofVideo();
    modalVideo.hidden = true;
    modalDocument.hidden = false;
    materialModal.classList.remove('is-video');
    if (documentSrc) modalDocument.src = documentSrc;
    modalDocument.alt = documentAlt || title;
  };

  if (materialModal) {
    const stopVideoOnDismiss = (event) => {
      if (event.type === 'keydown' && event.key !== 'Escape') return;
      if (event.type === 'click' && !event.target.closest('[data-modal-close]') && !event.target.matches('[data-modal-backdrop]')) return;
      clearProofVideo();
    };
    materialModal.addEventListener('click',stopVideoOnDismiss);
    document.addEventListener('keydown',stopVideoOnDismiss);
    new MutationObserver(() => {
      if (materialModal.getAttribute('aria-hidden') === 'true') clearProofVideo();
    }).observe(materialModal,{attributes:true,attributeFilter:['aria-hidden']});

    window.addEventListener('message',(event) => {
      const iframe = modalVideo?.querySelector('iframe');
      if (!iframe || event.source !== iframe.contentWindow) return;

      let isRutube = false;
      try {
        const host = new URL(event.origin).hostname;
        isRutube = host === 'rutube.ru' || host.endsWith('.rutube.ru');
      } catch {
        return;
      }
      if (!isRutube) return;

      let message = event.data;
      if (typeof message === 'string') {
        try {
          message = JSON.parse(message);
        } catch {
          return;
        }
      }

      const postPlayerCommand = (type,data = {}) => {
        iframe.contentWindow?.postMessage(
          JSON.stringify({type,data}),
          event.origin
        );
      };

      if (message?.type === 'player:durationChange') {
        const duration = Number(message.data?.duration);
        if (Number.isFinite(duration) && duration > 0) {
          iframe.dataset.videoDuration = String(duration);
        }
        return;
      }

      if (message?.type === 'player:currentTime') {
        const duration = Number(iframe.dataset.videoDuration);
        const time = Number(message.data?.time);
        if (Number.isFinite(time)) iframe.dataset.videoTime = String(time);

        if (
          iframe.dataset.endHandled !== 'true' &&
          Number.isFinite(duration) &&
          Number.isFinite(time) &&
          duration > 0 &&
          time >= duration - .35
        ) {
          iframe.dataset.endHandled = 'true';
          postPlayerCommand('player:stop');
        }
        return;
      }

      if (
        message?.type === 'player:changeState' &&
        message.data?.state === 'stopped'
      ) {
        iframe.dataset.endHandled = 'true';
        return;
      }

      if (
        message?.type === 'player:changeState' &&
        message.data?.state === 'playing' &&
        iframe.dataset.endHandled === 'true'
      ) {
        const duration = Number(iframe.dataset.videoDuration);
        const time = Number(iframe.dataset.videoTime);
        iframe.dataset.endHandled = 'false';

        if (
          Number.isFinite(duration) &&
          Number.isFinite(time) &&
          duration > 0 &&
          time >= duration - .5
        ) {
          postPlayerCommand('player:setCurrentTime',{time:0});
        }
      }
    });
  }

  const buildDetail = (card) => {
    const key = card.dataset.proofCase;
    const materials = materialMap[key];
    const media = card.querySelector('.case-card__media');
    const image = media?.querySelector('img');
    const body = card.querySelector('.case-card__body');
    const toggle = card.querySelector('[data-case-toggle]');
    if (!materials || !media || !image || !body || !toggle) return null;

    const visual = document.createElement('div');
    visual.className = 'case-card__visual';
    const syncCaseImage = () => {
      const src = image.currentSrc || image.src;
      if (src) visual.style.setProperty('--case-image', 'url("' + src + '")');
    };
    syncCaseImage();
    image.addEventListener('load',syncCaseImage);
    media.before(visual);
    visual.append(media);

    const viewerState = document.createElement('div');
    viewerState.className = 'case-card__viewer-state';
    viewerState.setAttribute('aria-hidden','true');
    viewerState.inert = true;
    viewerState.innerHTML = '<span class="case-card__viewer-label"></span><button class="case-card__viewer-video" type="button" hidden><span class="case-card__viewer-video-icon" aria-hidden="true"><img src="./assets/icons/proof/video.svg" alt=""></span><span>Смотреть видео</span></button><button class="case-card__viewer-photo" type="button" hidden><span class="case-card__viewer-video-icon" aria-hidden="true"><img src="./assets/icons/proof/photo.svg" alt=""></span><span>Открыть фото</span></button><button class="case-card__viewer-document" type="button" disabled><img data-document-preview alt=""><span class="case-card__viewer-open-hint">Открыть документ ↗</span><span data-document-fallback><strong></strong><span>Материал кейса</span></span></button>';
    media.append(viewerState);

    const thumbs = document.createElement('div');
    thumbs.className = 'case-card__thumbs';
    thumbs.setAttribute('aria-hidden','true');
    thumbs.inert = true;
    const thumbsInner = document.createElement('div');
    thumbsInner.className = 'case-card__thumbs-inner';
    thumbs.append(thumbsInner);
    visual.append(thumbs);

    const back = document.createElement('button');
    back.className = 'button button--ghost button--inverse case-card__back';
    back.type = 'button';
    back.dataset.caseClose = '';
    back.textContent = '← Вернуться к истории';
    back.setAttribute('aria-hidden','true');
    back.inert = true;
    body.prepend(back);

    const story = body.querySelector('.case-card__story');
    const quote = body.querySelector('.case-card__quote');
    if (!story || !quote) return null;

    const storyState = document.createElement('div');
    storyState.className = 'case-card__story-state';
    storyState.setAttribute('aria-hidden','false');
    const storyStateInner = document.createElement('div');
    storyStateInner.className = 'case-card__story-state-inner';
    story.before(storyState);
    storyState.append(storyStateInner);
    storyStateInner.append(story,quote,toggle);

    const details = document.createElement('div');
    details.className = 'case-card__details';
    details.id = toggle.getAttribute('aria-controls');
    details.setAttribute('aria-hidden','true');
    details.inert = true;
    details.innerHTML = '<div class="case-card__details-inner"><div class="case-card__active-material"><p class="case-card__active-type" data-active-material-type></p><h3 class="case-card__active-title" data-active-material-title></h3><p class="case-card__active-description" data-active-material-description></p><p class="case-card__active-hint" data-active-material-hint hidden>Нажмите на документ слева, чтобы открыть его крупнее.</p></div></div>';
    storyState.after(details);

    materials.forEach(([title,kind,asset,description,iconKey,embedUrl],index) => {
      const thumb = document.createElement('button');
      thumb.type = 'button';
      thumb.className = 'case-card__thumb';
      thumb.dataset.materialIndex = String(index);
      thumb.dataset.kind = kind;
      thumb.setAttribute('aria-pressed',String(index === 0));
      thumb.innerHTML = '<span class="case-card__thumb-preview"><span class="case-card__thumb-icon" aria-hidden="true"><img alt="" width="24" height="24"></span></span><span class="case-card__thumb-label"></span>';
      thumb.querySelector('.case-card__thumb-label').textContent = title;
      thumb.querySelector('.case-card__thumb-icon img').src = proofIconSrc(iconKey);
      if (asset) {
        thumb.classList.add('has-preview');
        thumb.style.setProperty('--material-preview','url("' + asset + '")');
      }
      thumbsInner.append(thumb);

    });

    let viewerAnimation = null;

    const selectMaterial = (index) => {
      const [title,kind,asset,description,iconKey,embedUrl] = materials[index] || materials[0];
      card.querySelectorAll('[data-material-index]').forEach((button) => {
        button.setAttribute('aria-pressed',String(Number(button.dataset.materialIndex) === index));
      });

      details.querySelector('[data-active-material-type]').textContent = kind === 'document' ? 'Документ' : kind === 'video' ? 'Видео' : kind === 'photo' ? 'Фото' : 'Медиа';
      details.querySelector('[data-active-material-title]').textContent = title;
      details.querySelector('[data-active-material-description]').textContent = description || '';
      const activeHint = details.querySelector('[data-active-material-hint]');
      activeHint.hidden = !asset && !embedUrl;
      activeHint.textContent = embedUrl
        ? 'Откройте видео в плеере, чтобы посмотреть материал целиком.'
        : kind === 'photo'
          ? 'Откройте фото, чтобы посмотреть материал крупнее.'
          : 'Нажмите на документ слева, чтобы открыть его крупнее.';

      if (card.classList.contains('is-expanded') && window.matchMedia('(max-width:72rem)').matches) {
        const selectedThumb = thumbsInner.querySelector('[data-material-index="' + index + '"]');
        selectedThumb?.scrollIntoView({
          behavior:reduceMotion.matches ? 'auto' : 'smooth',
          block:'nearest',
          inline:'nearest'
        });
      }

      const documentView = viewerState.querySelector('.case-card__viewer-document');
      const documentPreview = documentView.querySelector('[data-document-preview]');
      const documentFallback = documentView.querySelector('[data-document-fallback]');
      const videoView = viewerState.querySelector('.case-card__viewer-video');
      const photoView = viewerState.querySelector('.case-card__viewer-photo');

      media.classList.toggle('is-document',kind === 'document');
      media.classList.toggle('is-video',kind === 'video');
      media.classList.toggle('is-photo',kind === 'photo');
      viewerState.querySelector('.case-card__viewer-label').textContent = title;
      documentFallback.querySelector('strong').textContent = title;

      if (kind === 'document' && asset) {
        documentView.classList.add('has-preview');
        documentView.disabled = false;
        documentView.dataset.modalOpen = 'proof-document-modal';
        documentView.setAttribute('aria-label','Открыть документ «' + title + '»');
        documentPreview.src = asset;
        documentPreview.alt = 'Тестовый preview документа «' + title + '»';
      } else {
        documentView.classList.remove('has-preview');
        documentView.disabled = true;
        delete documentView.dataset.modalOpen;
        documentView.removeAttribute('aria-label');
        documentPreview.removeAttribute('src');
        documentPreview.alt = '';
      }

      videoView.hidden = !(kind === 'video' && embedUrl);
      if (!videoView.hidden) {
        videoView.dataset.modalOpen = 'proof-document-modal';
        videoView.setAttribute('aria-label','Открыть видео «' + title + '»');
        videoView.dataset.videoUrl = embedUrl;
        videoView.dataset.videoTitle = title;
      } else {
        delete videoView.dataset.modalOpen;
        delete videoView.dataset.videoUrl;
        delete videoView.dataset.videoTitle;
        videoView.removeAttribute('aria-label');
      }

      photoView.hidden = !(kind === 'photo' && asset);
      if (!photoView.hidden) {
        photoView.dataset.modalOpen = 'proof-document-modal';
        photoView.setAttribute('aria-label','Открыть фото «' + title + '»');
        photoView.dataset.photoSrc = asset;
        photoView.dataset.photoTitle = title;
      } else {
        delete photoView.dataset.modalOpen;
        delete photoView.dataset.photoSrc;
        delete photoView.dataset.photoTitle;
        photoView.removeAttribute('aria-label');
      }

      if (!reduceMotion.matches) {
        viewerAnimation?.cancel();
        viewerAnimation = media.animate(
          {opacity:[.72,1]},
          {duration:180,easing:'ease-out'}
        );
      }
    };

    const documentView = viewerState.querySelector('.case-card__viewer-document');
    const videoView = viewerState.querySelector('.case-card__viewer-video');
    const photoView = viewerState.querySelector('.case-card__viewer-photo');
    const cardTitle = card.querySelector('.case-card__title')?.textContent.trim() || '';
    const cardMeta = card.querySelector('.case-card__meta')?.textContent.replace(/\s+/g,' ').trim() || '';
    const modalCardMeta = [cardTitle,cardMeta].filter(Boolean).join(' · ');

    documentView.addEventListener('click',() => {
      if (documentView.disabled) return;
      const preview = documentView.querySelector('[data-document-preview]');
      prepareProofModal({
        mode:'document',
        title:viewerState.querySelector('.case-card__viewer-label').textContent || 'Документ',
        meta:modalCardMeta,
        documentSrc:preview.currentSrc || preview.src,
        documentAlt:preview.alt
      });
    });

    videoView.addEventListener('click',() => {
      if (videoView.hidden || !videoView.dataset.videoUrl) return;
      prepareProofModal({
        mode:'video',
        title:videoView.dataset.videoTitle || 'Видео',
        meta:modalCardMeta,
        videoUrl:videoView.dataset.videoUrl
      });
    });

    photoView.addEventListener('click',() => {
      if (photoView.hidden || !photoView.dataset.photoSrc) return;
      prepareProofModal({
        mode:'image',
        title:photoView.dataset.photoTitle || 'Фото',
        meta:modalCardMeta,
        documentSrc:photoView.dataset.photoSrc,
        documentAlt:(photoView.dataset.photoTitle || 'Фото') + (cardTitle ? ' — ' + cardTitle : '')
      });
    });

    card.addEventListener('click',(event) => {
      const materialButton = event.target.closest('[data-material-index]');
      if (materialButton) selectMaterial(Number(materialButton.dataset.materialIndex));
    });

    selectMaterial(0);
    return {toggle,back,details,thumbs,visual,storyState,viewerState};
  };

  const states = new Map(cards.map((card) => [card,buildDetail(card)]));

  const setOpen = (card,open,{focus=false} = {}) => {
    const state = states.get(card);
    if (!state) return;

    card.classList.toggle('is-expanded',open);
    state.toggle.setAttribute('aria-expanded',String(open));
    state.storyState.setAttribute('aria-hidden',String(open));
    state.details.setAttribute('aria-hidden',String(!open));
    state.thumbs.setAttribute('aria-hidden',String(!open));
    state.viewerState.setAttribute('aria-hidden',String(!open));
    state.back.setAttribute('aria-hidden',String(!open));

    state.storyState.inert = open;
    state.details.inert = !open;
    state.thumbs.inert = !open;
    state.viewerState.inert = !open;
    state.back.inert = !open;

    if (open) {
      cards.forEach((other) => {
        if (other !== card && other.classList.contains('is-expanded')) setOpen(other,false);
      });
      if (focus) state.back.focus({preventScroll:true});

      if (compactCase.matches) {
        requestAnimationFrame(() => {
          requestAnimationFrame(() => revealMobileCase(state.visual));
        });
      }
    } else if (focus) {
      state.toggle.focus({preventScroll:true});
    }
  };

  cards.forEach((card) => {
    const state = states.get(card);
    if (!state) return;
    state.toggle.addEventListener('click',() => setOpen(card,true,{focus:true}));
    state.back.addEventListener('click',() => setOpen(card,false,{focus:true}));
  });
})();





(() => {
  const modal = document.querySelector('[data-modal="car-lead-modal"]');
  const form = modal?.querySelector('[data-car-lead-form]');
  if (!modal || !form) return;

  const consent = form.querySelector('[data-car-lead-consent]');
  const consentMessage = form.querySelector('[data-car-lead-consent-message]');
  const channels = [...form.querySelectorAll('[data-car-lead-channel]')];
  const contactLabel = form.querySelector('[data-car-lead-contact-label]');

  const inputs = {
    model:form.querySelector('[data-car-lead-input="model"]'),
    city:form.querySelector('[data-car-lead-input="city"]'),
    name:form.querySelector('[data-car-lead-input="name"]'),
    contact:form.querySelector('[data-car-lead-input="contact"]')
  };

  const contactValues = {
    'Телефон':'',
    'Telegram':''
  };

  const activeChannel = () => channels.find((radio) => radio.checked)?.value || 'Телефон';
  const fieldFor = (input) => input?.closest('[data-car-lead-field]');

  const restoreMessage = (input) => {
    const field = fieldFor(input);
    const message = field?.querySelector('[data-car-lead-message]');
    if (!field || !message) return;

    field.classList.remove('field--error');
    input.removeAttribute('aria-invalid');
    message.textContent = message.dataset.defaultMessage || '';
  };

  const fieldError = (input,messageText) => {
    const field = fieldFor(input);
    const message = field?.querySelector('[data-car-lead-message]');
    if (!field || !message) return false;

    field.classList.add('field--error');
    input.setAttribute('aria-invalid','true');
    message.textContent = messageText;
    return false;
  };

  const syncConsent = () => {
    if (consent.checked) {
      consent.removeAttribute('aria-invalid');
      if (consentMessage) consentMessage.textContent = '';
    }
  };

  const syncContactMode = () => {
    const channel = activeChannel();
    const isPhone = channel === 'Телефон';
    const message = fieldFor(inputs.contact)?.querySelector('[data-car-lead-message]');

    contactLabel.textContent = isPhone ? 'Телефон' : 'Username в Telegram';
    inputs.contact.placeholder = isPhone ? '+7 (___) ___-__-__' : '@username';
    inputs.contact.autocomplete = isPhone ? 'tel' : 'off';
    inputs.contact.inputMode = isPhone ? 'tel' : 'text';
    inputs.contact.maxLength = isPhone ? 18 : 64;
    inputs.contact.value = isPhone
      ? nexrouteFormatPhone(contactValues['Телефон'])
      : contactValues['Telegram'];

    if (message) {
      const helper = isPhone
        ? 'Укажите номер телефона — только для ответа по заявке.'
        : 'Укажите Telegram username — только для ответа по заявке.';
      message.dataset.defaultMessage = helper;
      message.textContent = helper;
    }

    restoreMessage(inputs.contact);
  };

  document.addEventListener('click',(event) => {
    const opener = event.target.closest('[data-modal-open="car-lead-modal"]');
    if (!opener) return;

    inputs.model.value = opener.dataset.carRequestModel || '';
    restoreMessage(inputs.model);
  });

  [inputs.model,inputs.city,inputs.name].forEach((input) => {
    input?.addEventListener('input',() => restoreMessage(input));
  });

  inputs.contact.addEventListener('input',() => {
    if (activeChannel() === 'Телефон') {
      const digits = nexroutePhoneDigits(inputs.contact.value);
      contactValues['Телефон'] = digits;
      inputs.contact.value = nexrouteFormatPhone(digits);
    } else {
      contactValues['Telegram'] = inputs.contact.value;
    }

    restoreMessage(inputs.contact);
  });

  channels.forEach((radio) => radio.addEventListener('change',syncContactMode));
  consent.addEventListener('change',syncConsent);

  form.addEventListener('submit',(event) => {
    event.preventDefault();

    if (!consent.checked) {
      consent.setAttribute('aria-invalid','true');
      if (consentMessage) consentMessage.textContent = 'Нужно согласие на обработку персональных данных.';
      consent.focus();
      return;
    }

    let firstInvalid = null;

    if (!inputs.model.value.trim()) {
      fieldError(inputs.model,'Укажите модель или напишите «нужен подбор».');
      firstInvalid ||= inputs.model;
    }
    if (!inputs.city.value.trim()) {
      fieldError(inputs.city,'Укажите город получения автомобиля.');
      firstInvalid ||= inputs.city;
    }
    if (!inputs.name.value.trim()) {
      fieldError(inputs.name,'Укажите имя, чтобы мы знали, как к вам обратиться.');
      firstInvalid ||= inputs.name;
    }

    if (activeChannel() === 'Телефон') {
      if (nexroutePhoneDigits(inputs.contact.value).length !== 10) {
        fieldError(inputs.contact,'Введите номер полностью: +7 (___) ___-__-__.');
        firstInvalid ||= inputs.contact;
      }
    } else {
      const username = inputs.contact.value.trim();
      if (!/^@[a-zA-Z0-9_]{5,32}$/.test(username)) {
        fieldError(inputs.contact,'Укажите Telegram username в формате @username.');
        firstInvalid ||= inputs.contact;
      }
    }

    if (firstInvalid) {
      firstInvalid.focus();
      document.dispatchEvent(new CustomEvent('nexroute:toast',{
        detail:{
          title:'Проверьте форму.',
          message:'Не хватает нескольких данных для отправки заявки.',
          type:'error'
        }
      }));
      return;
    }

    document.dispatchEvent(new CustomEvent('nexroute:toast',{
      detail:{
        title:'Заявка отправлена.',
        message:inputs.model.value.trim() + ' — вернёмся по указанному контакту.'
      }
    }));

    modal.querySelector('[data-modal-close]')?.click();

    window.setTimeout(() => {
      const model = inputs.model.value;
      form.reset();
      inputs.model.value = model;
      contactValues['Телефон'] = '';
      contactValues['Telegram'] = '';
      syncContactMode();
      syncConsent();
      [inputs.city,inputs.name,inputs.contact].forEach((input) => restoreMessage(input));
    },550);
  });

  syncContactMode();
  syncConsent();
})();


(() => {
  const section = document.querySelector('#final-calculation');
  const form = section?.querySelector('[data-final-form]');
  if (!section || !form) return;

  const consent = form.querySelector('[data-final-consent]');
  const consentMessage = form.querySelector('[data-final-consent-message]');
  const channels = [...form.querySelectorAll('[data-final-channel]')];
  const contactLabel = form.querySelector('[data-final-contact-label]');

  const inputs = {
    model:form.querySelector('[data-final-input="model"]'),
    city:form.querySelector('[data-final-input="city"]'),
    name:form.querySelector('[data-final-input="name"]'),
    contact:form.querySelector('[data-final-input="contact"]'),
    comment:form.querySelector('[data-final-input="comment"]')
  };

  const fieldFor = (input) => input?.closest('[data-final-field]');
  const activeChannel = () => channels.find((radio) => radio.checked)?.value || 'Телефон';

  const restoreMessage = (input) => {
    const field = fieldFor(input);
    const message = field?.querySelector('[data-final-message]');
    if (!field || !message) return;
    field.classList.remove('field--error');
    input.removeAttribute('aria-invalid');
    message.textContent = message.dataset.defaultMessage || '';
  };

  const fieldError = (input, messageText) => {
    const field = fieldFor(input);
    const message = field?.querySelector('[data-final-message]');
    if (!field || !message) return false;
    field.classList.add('field--error');
    input.setAttribute('aria-invalid','true');
    message.textContent = messageText;
    return false;
  };


  const contactValues = {
    'Телефон':'',
    'Telegram':''
  };

  const syncContactMode = () => {
    const channel = activeChannel();
    const isPhone = channel === 'Телефон';
    const message = fieldFor(inputs.contact)?.querySelector('[data-final-message]');

    contactLabel.textContent = isPhone ? 'Телефон' : 'Username в Telegram';
    inputs.contact.placeholder = isPhone ? '+7 (___) ___-__-__' : '@username';
    inputs.contact.autocomplete = isPhone ? 'tel' : 'off';
    inputs.contact.inputMode = isPhone ? 'tel' : 'text';
    inputs.contact.maxLength = isPhone ? 18 : 64;

    if (isPhone) {
      inputs.contact.value = nexrouteFormatPhone(contactValues['Телефон']);
    } else {
      inputs.contact.value = contactValues['Telegram'];
    }

    if (message) {
      const helper = isPhone
        ? 'Укажите номер телефона — только для ответа по расчёту.'
        : 'Укажите Telegram username — только для ответа по расчёту.';
      message.dataset.defaultMessage = helper;
      message.textContent = helper;
    }

    restoreMessage(inputs.contact);
  };

  const syncConsent = () => {
    if (consent.checked) {
      consent.removeAttribute('aria-invalid');
      if (consentMessage) consentMessage.textContent = '';
    }
  };

  [inputs.model,inputs.city,inputs.name,inputs.comment].forEach((input) => {
    input?.addEventListener('input', () => restoreMessage(input));
  });

  inputs.contact.addEventListener('input', () => {
    if (activeChannel() === 'Телефон') {
      const digits = nexroutePhoneDigits(inputs.contact.value);
      contactValues['Телефон'] = digits;
      inputs.contact.value = nexrouteFormatPhone(digits);
    } else {
      contactValues['Telegram'] = inputs.contact.value;
    }

    restoreMessage(inputs.contact);
  });

  channels.forEach((radio) => {
    radio.addEventListener('change', syncContactMode);
  });

  consent.addEventListener('change', syncConsent);

  document.addEventListener('nexroute:prefill-final', (event) => {
    const detail = event.detail || {};

    if (detail.model) inputs.model.value = detail.model;
    if (detail.city) inputs.city.value = detail.city;

    if (detail.channel) {
      const matchingChannel = channels.find((radio) => radio.value === detail.channel);
      if (matchingChannel) matchingChannel.checked = true;
    }

    if (detail.contact) {
      if (activeChannel() === 'Телефон') {
        contactValues['Телефон'] = nexroutePhoneDigits(detail.contact);
      } else {
        contactValues['Telegram'] = detail.contact.trim();
      }
    }

    syncContactMode();
    [inputs.model,inputs.city,inputs.contact].forEach((input) => restoreMessage(input));
  });

  form.addEventListener('submit', (event) => {
    event.preventDefault();

    if (!consent.checked) {
      consent.setAttribute('aria-invalid','true');
      if (consentMessage) consentMessage.textContent = 'Нужно согласие на обработку персональных данных.';
      consent.focus();
      return;
    }

    let firstInvalid = null;

    if (!inputs.model.value.trim()) {
      fieldError(inputs.model,'Укажите модель или напишите «пока не определился».');
      firstInvalid ||= inputs.model;
    }
    if (!inputs.city.value.trim()) {
      fieldError(inputs.city,'Укажите город получения автомобиля.');
      firstInvalid ||= inputs.city;
    }
    if (!inputs.name.value.trim()) {
      fieldError(inputs.name,'Укажите имя, чтобы мы знали, как к вам обратиться.');
      firstInvalid ||= inputs.name;
    }

    if (activeChannel() === 'Телефон') {
      if (nexroutePhoneDigits(inputs.contact.value).length !== 10) {
        fieldError(inputs.contact,'Введите номер полностью: +7 (___) ___-__-__.');
        firstInvalid ||= inputs.contact;
      }
    } else {
      const username = inputs.contact.value.trim();
      if (!/^@[a-zA-Z0-9_]{5,32}$/.test(username)) {
        fieldError(inputs.contact,'Укажите Telegram username в формате @username.');
        firstInvalid ||= inputs.contact;
      }
    }

    if (firstInvalid) {
      firstInvalid.focus();
      document.dispatchEvent(new CustomEvent('nexroute:toast',{
        detail:{
          title:'Проверьте форму.',
          message:'Не хватает нескольких данных для отправки запроса.',
          type:'error'
        }
      }));
      return;
    }

    document.dispatchEvent(new CustomEvent('nexroute:toast',{
      detail:{
        title:'Запрос отправлен.',
        message:'Данные сохранены — вернёмся с предметным расчётом по указанному контакту.'
      }
    }));
  });

  syncContactMode();
  syncConsent();
})();
