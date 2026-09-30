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
      breakdown:configurator.querySelector('[data-summary-breakdown]'),
      toasts:document.querySelector('[data-config-toasts]')
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

    const phoneDigits = (value = '') => {
      let digits = value.replace(/\D/g,'');
      if (digits.startsWith('7') || digits.startsWith('8')) digits = digits.slice(1);
      return digits.slice(0,10);
    };

    const formatPhone = (value = '') => {
      const digits = phoneDigits(value);
      if (!digits) return '';

      let result = '+7 (' + digits.slice(0,3);
      if (digits.length > 3) result += ') ' + digits.slice(3,6);
      if (digits.length > 6) result += '-' + digits.slice(6,8);
      if (digits.length > 8) result += '-' + digits.slice(8,10);
      return result;
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
        refs.contact.value = formatPhone(contactValues['Телефон']);
        state.contact = phoneDigits(contactValues['Телефон']);
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

        refs.summaryMedia.classList.remove('is-generic');
        if (refs.summaryImage.getAttribute('src') !== known.image) refs.summaryImage.src = known.image;
        refs.summaryTotal.textContent = money(known.total) + (isMoscow ? '' : ' + доставка');
        refs.summaryEta.textContent = known.eta;
        refs.summaryNote.textContent = 'Финальная смета зависит от конкретного автомобиля, курса на момент выкупа и города получения.';
      } else if (state.model === 'Нужен подбор') {
        dds.forEach((dd) => { dd.textContent = '—'; });
        refs.summaryMedia.classList.add('is-generic');
        refs.summaryTotal.textContent = 'Подберём варианты';
        refs.summaryEta.textContent = 'после подбора';
        refs.summaryNote.textContent = 'Подберём несколько вариантов в вашем бюджете и покажем для каждого цену под ключ, комплектацию и срок доставки.';
      } else {
        dds.forEach((dd) => { dd.textContent = '—'; });
        refs.summaryMedia.classList.add('is-generic');
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

    const showToast = (title, message, type = 'success') => {
      if (!refs.toasts) return;

      refs.toasts.replaceChildren();

      const toast = document.createElement('div');
      toast.className = 'toast toast--' + type;
      toast.dataset.toastItem = '';
      toast.setAttribute('role',type === 'error' ? 'alert' : 'status');
      toast.innerHTML = '<strong></strong><span></span>';
      toast.querySelector('strong').textContent = title;
      toast.querySelector('span').textContent = message;
      refs.toasts.append(toast);

      setTimeout(() => {
        if (toast.isConnected) toast.remove();
      }, type === 'error' ? 6500 : 4200);
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
        const digits = phoneDigits(refs.contact.value);
        contactValues['Телефон'] = digits;
        refs.contact.value = formatPhone(digits);
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
      if (state.channel === 'Телефон' && phoneDigits(state.contact).length !== 10) {
        fieldError(refs.contact,'Введите номер полностью: +7 (___) ___-__-__.');
        return;
      }

      clearFieldError(refs.contact,'Контакт нужен только для отправки расчёта.');
      showToast('Заявка отправлена.','Параметры расчёта сохранены — свяжемся выбранным способом.');
    });

    const selectCar = (model) => {
      if (!pricing[model]) return;
      state.model = model;
      state.condition = 'Новый';
      state.power = pricing[model].power;
      refs.model.value = model;
      setPressed('model',model);
      setPressed('condition','Новый');
      setPressed('power',state.power);
      current = 0;
      renderStep();
      configurator.scrollIntoView({behavior:reduceMotion.matches ? 'auto' : 'smooth',block:'start'});
    };

    document.querySelectorAll('[data-car-select]').forEach((button) => {
      button.addEventListener('click', () => selectCar(button.dataset.carSelect));
    });

    document.querySelector('[data-config-open]')?.addEventListener('click', () => {
      configurator.scrollIntoView({behavior:reduceMotion.matches ? 'auto' : 'smooth',block:'start'});
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
