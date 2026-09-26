(() => {
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)');

  const money = (value) => new Intl.NumberFormat('ru-RU').format(value) + ' ₽';

  const carPricing = {
    'Zeekr 001 AWD': { power:'Электромобиль', total:6490000, eta:'30–38 дней', parts:[4820000,355000,930000,3400,61600,320000] },
    'Xiaomi SU7 Max': { power:'Электромобиль', total:5890000, eta:'28–36 дней', parts:[4320000,350000,840000,3400,56600,320000] },
    'Li Auto L6 Pro': { power:'Гибрид / EREV', total:5390000, eta:'32–40 дней', parts:[3870000,350000,790000,3400,56600,320000] }
  };

  const journeyData = [
    ['01','Подбор','Сверяем модель, комплектацию, цвет, бюджет и город получения. На выходе — конкретный автомобиль и предварительный расчёт.','Результат: автомобиль выбран, расчёт собран','Подбор','Следующий этап: Проверка'],
    ['02','Проверка','Запрашиваем фото и видео, сверяем VIN, комплектацию и состояние. При критичных расхождениях возвращаемся к подбору.','Результат: проверка пройдена','Проверка','Следующий этап: Выкуп'],
    ['03','Выкуп','После согласования фиксируем автомобиль и проводим оплату по согласованной схеме.','Результат: автомобиль выкуплен','Выкуп','Следующий этап: Страхование'],
    ['04','Страхование','Перед отправкой оформляем страхование перевозки и фиксируем состояние автомобиля.','Результат: перевозка застрахована','Страхование','Следующий этап: Граница'],
    ['05','Граница','Автомобиль идёт к границе и проходит экспортное оформление.','Результат: экспорт оформлен','Граница','Следующий этап: Таможня'],
    ['06','Таможня','Подаём документы, оформляем таможенные платежи и выпускаем автомобиль на территорию России.','Документы поданы · ориентир 11 дней до выдачи','Таможня','Следующий этап: ЭПТС'],
    ['07','ЭПТС','Оформляем электронный ПТС и комплект документов, необходимых для постановки автомобиля на учёт.','Результат: документы готовы','ЭПТС','Следующий этап: Выдача'],
    ['08','Выдача','Проверяем комплектность, передаём автомобиль и документы или организуем доставку в другой город.','Результат: маршрут завершён','Выдача','Маршрут завершён']
  ];

  function initJourney() {
    const root = document.querySelector('[data-journey]');
    if (!root) return;

    const stages = [...root.querySelectorAll('[data-journey-step]')];
    const refs = {
      progress: root.querySelector('[data-journey-progress]'),
      marker: root.querySelector('[data-journey-marker]'),
      index: root.querySelector('[data-journey-index]'),
      title: root.querySelector('[data-journey-title]'),
      copy: root.querySelector('[data-journey-copy]'),
      result: root.querySelector('[data-journey-result]'),
      status: root.querySelector('[data-journey-status]'),
      next: root.querySelector('[data-journey-next]'),
      stages: root.querySelector('[data-journey-stages]')
    };

    let current = -1;

    const render = (index) => {
      const safeIndex = Math.max(0, Math.min(index, journeyData.length - 1));
      if (safeIndex === current) return;
      current = safeIndex;
      const item = journeyData[safeIndex];

      stages.forEach((stage, i) => {
        const active = i === safeIndex;
        stage.classList.toggle('journey__stage--active', active);
        stage.classList.toggle('journey__stage--complete', i < safeIndex);
        if (active) stage.setAttribute('aria-current', 'step');
        else stage.removeAttribute('aria-current');
      });

      refs.index.textContent = item[0];
      refs.title.textContent = item[1];
      refs.copy.textContent = item[2];
      refs.result.textContent = item[3];
      refs.status.textContent = item[4];
      refs.next.textContent = item[5];

      const progress = safeIndex / (journeyData.length - 1) * 100;
      refs.progress.style.width = progress + '%';
      refs.marker.style.left = progress + '%';

      if (window.innerWidth <= 720 && refs.stages) {
        const activeStage = stages[safeIndex];
        const item = activeStage?.parentElement;
        if (item) {
          const left = item.offsetLeft - (refs.stages.clientWidth - item.offsetWidth) / 2;
          refs.stages.scrollTo({
            left:Math.max(0, left),
            behavior:reduceMotion.matches ? 'auto' : 'smooth'
          });
        }
      }
    };

    const scrollToStep = (index) => {
      const max = Math.max(1, root.offsetHeight - window.innerHeight);
      const target = root.offsetTop - 72 + (index / (journeyData.length - 1)) * max;
      window.scrollTo({
        top:Math.max(0, target),
        behavior:reduceMotion.matches ? 'auto' : 'smooth'
      });
    };

    stages.forEach((stage) => {
      stage.addEventListener('click', () => scrollToStep(Number(stage.dataset.journeyStep)));
    });

    const update = () => {
      const rect = root.getBoundingClientRect();
      const max = Math.max(1, root.offsetHeight - window.innerHeight);
      const passed = Math.min(Math.max(-rect.top + 72, 0), max);
      const ratio = passed / max;
      render(Math.min(journeyData.length - 1, Math.floor(ratio * journeyData.length)));
    };

    let raf = 0;
    const schedule = () => {
      if (raf) return;
      raf = requestAnimationFrame(() => {
        raf = 0;
        update();
      });
    };

    render(0);
    addEventListener('scroll', schedule, { passive:true });
    addEventListener('resize', schedule, { passive:true });
  }

  function initToasts() {
    const stack = document.querySelector('[data-toast-stack]');
    const status = document.querySelector('[data-toast-status]');
    const alert = document.querySelector('[data-toast-alert]');
    if (!stack) return () => {};

    const announce = (region, message) => {
      if (!region) return;
      region.textContent = '';
      requestAnimationFrame(() => {
        region.textContent = message;
      });
    };

    return (type, title, message) => {
      while (stack.children.length >= 2) stack.firstElementChild?.remove();

      const toast = document.createElement('article');
      toast.className = 'toast toast--' + type;
      toast.dataset.toast = type;
      toast.innerHTML = '<strong></strong><span></span><button class="toast__close" type="button" aria-label="Закрыть">×</button>';
      toast.querySelector('strong').textContent = title;
      toast.querySelector('span').textContent = message;
      toast.querySelector('.toast__close').addEventListener('click', () => toast.remove());
      stack.append(toast);

      const announcement = title + ' ' + message;
      if (type === 'error') announce(alert, announcement);
      else announce(status, announcement);

      setTimeout(() => toast.remove(), type === 'error' ? 7000 : 4200);
    };
  }

  const showToast = initToasts();

  function initConfigurator() {
    const root = document.querySelector('[data-configurator]');
    if (!root) return;

    const form = root.querySelector('[data-config-form]');
    const steps = [...root.querySelectorAll('[data-config-step]')];
    const order = ['model','condition','power','budget','city','contact'];
    const state = { model:'', condition:'', power:'', budget:'', city:'', channel:'', contact:'' };
    let current = 0;

    const refs = {
      back: root.querySelector('[data-config-back]'),
      next: root.querySelector('[data-config-next]'),
      submit: root.querySelector('[data-config-submit]'),
      progress: root.querySelector('[data-config-progress]'),
      progressbar: root.querySelector('[data-config-progressbar]'),
      model: root.querySelector('[data-config-model]'),
      city: root.querySelector('[data-config-city]'),
      contact: root.querySelector('[data-config-contact]'),
      summaryModel: root.querySelector('[data-summary-model]'),
      summaryMeta: root.querySelector('[data-summary-meta]'),
      summaryTotal: root.querySelector('[data-summary-total]'),
      summaryNote: root.querySelector('[data-summary-note]'),
      breakdown: root.querySelector('[data-summary-breakdown]'),
      success: root.querySelector('[data-config-success]')
    };

    const clearFieldError = (input, defaultMessage) => {
      const field = input.closest('.field');
      field?.classList.remove('field--error');
      const message = field?.querySelector('.field__message');
      if (message && defaultMessage !== undefined) message.textContent = defaultMessage;
    };

    const setChoice = (groupName, value) => {
      state[groupName] = value;
      root.querySelectorAll('[data-config-choice="' + groupName + '"] .choice-chip').forEach((button) => {
        const selected = button.dataset.value === value;
        button.classList.toggle('choice-chip--selected', selected);
        button.setAttribute('aria-pressed', String(selected));
      });
      const message = root.querySelector('[data-choice-message="' + groupName + '"]');
      if (message) message.textContent = '';
    };

    const choiceError = (key, message) => {
      const messageNode = root.querySelector('[data-choice-message="' + key + '"]');
      if (messageNode) messageNode.textContent = message;
      root.querySelector('[data-config-choice="' + key + '"] .choice-chip')?.focus();
      return false;
    };

    const renderSummary = () => {
      const price = carPricing[state.model];
      const condition = state.condition || 'Состояние не выбрано';
      const power = state.power || price?.power || 'Тип уточним';
      const city = state.city || 'Город не выбран';
      const regionalNote = state.city && state.city.toLowerCase() !== 'москва'
        ? ' Региональная доставка до ' + state.city + ' добавляется отдельной строкой.'
        : '';

      refs.summaryModel.textContent = state.model || 'Автомобиль не выбран';
      refs.summaryMeta.textContent = [condition, power, city].join(' · ');

      const dds = [...refs.breakdown.querySelectorAll('dd')];
      if (price) {
        price.parts.forEach((value, i) => {
          if (dds[i]) dds[i].textContent = money(value);
        });
        refs.summaryTotal.textContent = money(price.total) + ' под ключ';
        refs.summaryNote.textContent = 'Ориентир доставки: ' + price.eta + '. Финальная смета зависит от конкретного автомобиля, курса и города получения.' + regionalNote;
      } else if (state.model === 'Нужен подбор') {
        dds.forEach((dd, i) => {
          dd.textContent = i === 5 ? '320 000 ₽' : '—';
        });
        refs.summaryTotal.textContent = 'Подберём варианты в вашем бюджете';
        refs.summaryNote.textContent = 'Покажем для каждого цену под ключ, комплектацию и срок доставки.' + regionalNote;
      } else {
        dds.forEach((dd, i) => {
          dd.textContent = i === 5 ? '320 000 ₽' : '—';
        });
        refs.summaryTotal.textContent = state.model ? 'Расчёт после проверки модели' : 'Сначала выберите автомобиль';
        refs.summaryNote.textContent = 'Финальная смета зависит от конкретного автомобиля, курса на момент выкупа и города получения.' + regionalNote;
      }

      window.dispatchEvent(new CustomEvent('nexroute:config-sync', {
        detail: { model:state.model, city:state.city }
      }));
    };

    const visibleOrder = () => carPricing[state.model]
      ? ['model','condition','budget','city','contact']
      : order;

    const renderStep = () => {
      const list = visibleOrder();
      current = Math.max(0, Math.min(current, list.length - 1));
      const activeName = list[current];

      steps.forEach((step) => {
        const active = step.dataset.configStep === activeName;
        step.hidden = !active;
        step.classList.toggle('configurator__step--active', active);
      });

      refs.back.disabled = current === 0;
      const last = current === list.length - 1;
      refs.next.hidden = last;
      refs.submit.hidden = !last;

      refs.progress.style.width = (current + 1) / list.length * 100 + '%';
      refs.progressbar?.setAttribute('aria-valuemax', String(list.length));
      refs.progressbar?.setAttribute('aria-valuenow', String(current + 1));
      renderSummary();
    };

    root.querySelectorAll('[data-config-choice]').forEach((group) => {
      group.addEventListener('click', (event) => {
        const button = event.target.closest('.choice-chip');
        if (!button) return;

        const key = group.dataset.configChoice;
        setChoice(key, button.dataset.value);

        if (key === 'model') {
          state.model = button.dataset.value;
          refs.model.value = state.model === 'Нужен подбор' ? '' : state.model;
          clearFieldError(refs.model, 'Можно указать любую марку или модель.');
          const known = carPricing[state.model];
          setChoice('power', known ? known.power : '');
        }

        renderSummary();
      });
    });

    refs.model.addEventListener('input', () => {
      state.model = refs.model.value.trim();
      root.querySelectorAll('[data-config-choice="model"] .choice-chip').forEach((button) => {
        button.classList.remove('choice-chip--selected');
        button.setAttribute('aria-pressed', 'false');
      });
      clearFieldError(refs.model, 'Можно указать любую марку или модель.');
      setChoice('power', '');
      renderSummary();
    });

    refs.city.addEventListener('input', () => {
      state.city = refs.city.value.trim();
      clearFieldError(refs.city, 'Региональная доставка будет отдельной строкой.');
      renderSummary();
    });

    refs.contact.addEventListener('input', () => {
      state.contact = refs.contact.value.trim();
      clearFieldError(refs.contact, 'Контакт нужен только для отправки расчёта.');
    });

    const validateCurrent = () => {
      const list = visibleOrder();
      const step = list[current];

      if (step === 'model' && !state.model && !refs.model.value.trim()) {
        const field = refs.model.closest('.field');
        field.classList.add('field--error');
        field.querySelector('.field__message').textContent = 'Укажите модель или выберите «нужен подбор».';
        refs.model.focus();
        return false;
      }
      if (step === 'condition' && !state.condition) {
        return choiceError('condition','Выберите состояние автомобиля.');
      }
      if (step === 'power' && !state.power) {
        return choiceError('power','Выберите тип силовой установки.');
      }
      if (step === 'budget' && !state.budget) {
        return choiceError('budget','Выберите бюджет или вариант «Нужен ориентир».');
      }
      if (step === 'city' && !refs.city.value.trim()) {
        const field = refs.city.closest('.field');
        field.classList.add('field--error');
        field.querySelector('.field__message').textContent = 'Укажите город получения.';
        refs.city.focus();
        return false;
      }
      return true;
    };

    refs.next.addEventListener('click', () => {
      state.model = state.model || refs.model.value.trim();
      state.city = refs.city.value.trim() || state.city;
      if (!validateCurrent()) return;
      current += 1;
      renderStep();
    });

    refs.back.addEventListener('click', () => {
      current -= 1;
      renderStep();
    });

    form.addEventListener('submit', (event) => {
      event.preventDefault();
      const contact = refs.contact.value.trim();
      const contactField = refs.contact.closest('.field');

      if (!state.channel) {
        choiceError('channel','Выберите телефон или Telegram.');
        return;
      }

      if (!contact) {
        contactField.classList.add('field--error');
        contactField.querySelector('.field__message').textContent = 'Укажите контакт.';
        refs.contact.focus();
        return;
      }

      clearFieldError(refs.contact, 'Контакт нужен только для отправки расчёта.');
      refs.success.hidden = false;
      refs.success.focus();
      showToast('success','Заявка отправлена.','Параметры переданы — дальше используем выбранный способ связи.');
    });

    window.addEventListener('nexroute:select-car', (event) => {
      state.model = event.detail.model;
      refs.model.value = state.model;
      setChoice('condition', event.detail.condition || 'Новый');
      const known = carPricing[state.model];
      setChoice('power', known ? known.power : '');
      clearFieldError(refs.model, 'Можно указать любую марку или модель.');
      current = 0;
      renderStep();
      root.scrollIntoView({
        behavior:reduceMotion.matches ? 'auto' : 'smooth',
        block:'start'
      });
    });

    renderStep();
  }

  function initCars() {
    document.querySelectorAll('[data-car-select]').forEach((button) => {
      button.addEventListener('click', () => {
        document.querySelectorAll('.car-card').forEach((card) => {
          card.classList.remove('car-card--selected');
        });
        button.closest('.car-card')?.classList.add('car-card--selected');
        window.dispatchEvent(new CustomEvent('nexroute:select-car', {
          detail:{ model:button.dataset.carSelect, condition:'Новый' }
        }));
      });
    });
  }

  function initFaq() {
    const root = document.querySelector('[data-faq]');
    if (!root) return;

    root.addEventListener('toggle', (event) => {
      const item = event.target;
      if (!(item instanceof HTMLDetailsElement) || !item.open) return;
      root.querySelectorAll('details[open]').forEach((other) => {
        if (other !== item) other.open = false;
      });
    }, true);
  }

  function initCases() {
    document.querySelectorAll('[data-case-toggle]').forEach((button) => {
      button.addEventListener('click', () => {
        const details = button.parentElement.querySelector('.case-card__details');
        if (!details) return;
        details.hidden = !details.hidden;
        button.setAttribute('aria-expanded', String(!details.hidden));
        button.textContent = details.hidden ? 'Посмотреть кейс' : 'Скрыть детали';
      });
    });
  }

  function initLeadForm() {
    const form = document.querySelector('[data-lead-form]');
    if (!form) return;

    const consentMessage = form.querySelector('[data-consent-message]');

    window.addEventListener('nexroute:config-sync', (event) => {
      const { model, city } = event.detail || {};
      if (model) form.elements.model.value = model;
      if (city) form.elements.city.value = city;
    });

    form.addEventListener('input', (event) => {
      const input = event.target;

      if (input.matches('input[name="model"],input[name="city"],input[name="contact"]')) {
        const field = input.closest('.field');
        field?.classList.remove('field--error');
        const message = field?.querySelector('.field__message');
        if (message && input.name !== 'model') message.textContent = '';
      }

      if (input.name === 'consent' && input.checked && consentMessage) {
        consentMessage.textContent = '';
      }
    });

    form.addEventListener('submit', (event) => {
      event.preventDefault();
      let valid = true;

      ['model','city','contact'].forEach((name) => {
        const input = form.elements[name];
        const field = input.closest('.field');
        const message = field.querySelector('.field__message');

        if (!input.value.trim()) {
          field.classList.add('field--error');
          message.textContent = name === 'model'
            ? 'Укажите модель или напишите «нужен подбор».'
            : name === 'city'
              ? 'Укажите город.'
              : 'Укажите контакт.';
          if (valid) input.focus();
          valid = false;
        } else {
          field.classList.remove('field--error');
          if (name !== 'model') message.textContent = '';
        }
      });

      if (!form.elements.consent.checked) {
        if (consentMessage) {
          consentMessage.textContent = 'Подтвердите согласие на обработку персональных данных.';
        }
        if (valid) form.elements.consent.focus();
        valid = false;
      } else if (consentMessage) {
        consentMessage.textContent = '';
      }

      if (!valid) return;

      const success = form.querySelector('[data-lead-success]');
      success.hidden = false;
      success.focus();
      showToast('success','Заявка отправлена.','Параметры переданы — дальше используем выбранный способ связи.');
    });
  }

  function initAnchors() {
    document.addEventListener('click', (event) => {
      const link = event.target.closest('a[href^="#"]');
      if (!link) return;
      const target = document.querySelector(link.getAttribute('href'));
      if (!target) return;

      event.preventDefault();
      target.scrollIntoView({
        behavior:reduceMotion.matches ? 'auto' : 'smooth',
        block:'start'
      });
    });
  }

  initJourney();
  initConfigurator();
  initCars();
  initFaq();
  initCases();
  initLeadForm();
  initAnchors();
})();
