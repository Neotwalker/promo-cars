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
      next: root.querySelector('[data-journey-next]')
    };
    let current = -1;

    const render = (index) => {
      if (index === current) return;
      current = index;
      const item = journeyData[index];
      stages.forEach((stage, i) => {
        stage.classList.toggle('journey__stage--active', i === index);
        stage.classList.toggle('journey__stage--complete', i < index);
        stage.setAttribute('aria-current', i === index ? 'step' : 'false');
      });
      refs.index.textContent = item[0];
      refs.title.textContent = item[1];
      refs.copy.textContent = item[2];
      refs.result.textContent = item[3];
      refs.status.textContent = item[4];
      refs.next.textContent = item[5];
      const progress = (index / (journeyData.length - 1)) * 100;
      refs.progress.style.width = progress + '%';
      refs.marker.style.left = progress + '%';
    };

    const update = () => {
      if (window.innerWidth <= 720) { render(0); return; }
      const rect = root.getBoundingClientRect();
      const max = Math.max(1, root.offsetHeight - window.innerHeight);
      const passed = Math.min(Math.max(-rect.top + 72, 0), max);
      const ratio = passed / max;
      render(Math.min(7, Math.floor(ratio * 8)));
    };

    let raf = 0;
    const schedule = () => {
      if (raf) return;
      raf = requestAnimationFrame(() => { raf = 0; update(); });
    };
    render(0);
    addEventListener('scroll', schedule, { passive:true });
    addEventListener('resize', schedule, { passive:true });
  }

  function initToasts() {
    const stack = document.querySelector('[data-toast-stack]');
    const alert = document.querySelector('[data-toast-alert]');
    if (!stack) return () => {};

    return (type, title, message) => {
      while (stack.children.length >= 2) stack.firstElementChild?.remove();
      const toast = document.createElement('article');
      toast.className = 'toast toast--' + type;
      toast.setAttribute('data-toast', type);
      toast.innerHTML = '<strong></strong><span></span><button class="toast__close" type="button" aria-label="Закрыть">×</button>';
      toast.querySelector('strong').textContent = title;
      toast.querySelector('span').textContent = message;
      toast.querySelector('.toast__close').addEventListener('click', () => toast.remove());
      stack.append(toast);
      if (type === 'error' && alert) alert.textContent = title + ' ' + message;
      const delay = type === 'error' ? 7000 : 4200;
      setTimeout(() => toast.remove(), delay);
    };
  }

  const showToast = initToasts();

  function initConfigurator() {
    const root = document.querySelector('[data-configurator]');
    if (!root) return;
    const form = root.querySelector('[data-config-form]');
    const steps = [...root.querySelectorAll('[data-config-step]')];
    const order = ['model','condition','power','budget','city','contact'];
    const state = { model:'', condition:'Новый', power:'', budget:'', city:'Москва', channel:'', contact:'' };
    let current = 0;

    const refs = {
      back: root.querySelector('[data-config-back]'),
      next: root.querySelector('[data-config-next]'),
      submit: root.querySelector('[data-config-submit]'),
      progress: root.querySelector('[data-config-progress]'),
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

    const setChoice = (groupName, value) => {
      state[groupName] = value;
      root.querySelectorAll('[data-config-choice="' + groupName + '"] .choice-chip').forEach((button) => {
        const selected = button.dataset.value === value;
        button.classList.toggle('choice-chip--selected', selected);
        button.setAttribute('aria-pressed', String(selected));
      });
    };

    const renderSummary = () => {
      const price = carPricing[state.model];
      refs.summaryModel.textContent = state.model || 'Автомобиль не выбран';
      refs.summaryMeta.textContent = [state.condition || 'Новый', state.power || price?.power || 'Тип уточним', state.city || 'Москва'].join(' · ');
      const dds = [...refs.breakdown.querySelectorAll('dd')];
      if (price) {
        price.parts.forEach((value, i) => dds[i].textContent = money(value));
        refs.summaryTotal.textContent = money(price.total) + ' под ключ';
        refs.summaryNote.textContent = 'Ориентир доставки: ' + price.eta + '. Финальная смета зависит от конкретного автомобиля, курса и города получения.';
      } else if (state.model === 'Нужен подбор') {
        dds.forEach((dd, i) => dd.textContent = i === 5 ? '320 000 ₽' : '—');
        refs.summaryTotal.textContent = 'Подберём варианты в вашем бюджете';
        refs.summaryNote.textContent = 'Покажем для каждого цену под ключ, комплектацию и срок доставки.';
      } else {
        dds.forEach((dd, i) => dd.textContent = i === 5 ? '320 000 ₽' : '—');
        refs.summaryTotal.textContent = state.model ? 'Расчёт после проверки модели' : 'Сначала выберите автомобиль';
        refs.summaryNote.textContent = 'Финальная смета зависит от конкретного автомобиля, курса на момент выкупа и города получения.';
      }
    };

    const visibleOrder = () => {
      const known = carPricing[state.model];
      return known ? ['model','condition','budget','city','contact'] : order;
    };

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
      refs.progress.style.width = ((current + 1) / list.length * 100) + '%';
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
          const known = carPricing[state.model];
          if (known) setChoice('power', known.power);
        }
        renderSummary();
      });
    });

    refs.model.addEventListener('input', () => {
      state.model = refs.model.value.trim();
      root.querySelectorAll('[data-config-choice="model"] .choice-chip').forEach((b) => {
        b.classList.remove('choice-chip--selected'); b.setAttribute('aria-pressed','false');
      });
      renderSummary();
    });
    refs.city.addEventListener('input', () => { state.city = refs.city.value.trim() || 'Москва'; renderSummary(); });
    refs.contact.addEventListener('input', () => { state.contact = refs.contact.value.trim(); });

    const validateCurrent = () => {
      const list = visibleOrder();
      const step = list[current];
      if (step === 'model' && !state.model && !refs.model.value.trim()) {
        refs.model.closest('.field').classList.add('field--error');
        refs.model.closest('.field').querySelector('.field__message').textContent = 'Укажите модель или выберите «нужен подбор».';
        refs.model.focus();
        return false;
      }
      if (step === 'condition' && !state.condition) return false;
      if (step === 'power' && !state.power) return false;
      if (step === 'budget' && !state.budget) { showToast('info','Выберите бюджет.','Это нужно для корректного сценария подбора.'); return false; }
      if (step === 'city' && !refs.city.value.trim()) {
        const field = refs.city.closest('.field'); field.classList.add('field--error'); field.querySelector('.field__message').textContent = 'Укажите город получения.'; refs.city.focus(); return false;
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
    refs.back.addEventListener('click', () => { current -= 1; renderStep(); });

    form.addEventListener('submit', (event) => {
      event.preventDefault();
      const channel = state.channel;
      const contact = refs.contact.value.trim();
      const contactField = refs.contact.closest('.field');
      if (!channel) { showToast('info','Выберите способ связи.','Телефон или Telegram.'); return; }
      if (!contact) { contactField.classList.add('field--error'); contactField.querySelector('.field__message').textContent = 'Укажите контакт.'; refs.contact.focus(); return; }
      contactField.classList.remove('field--error');
      refs.success.hidden = false;
      refs.success.focus();
      showToast('success','Заявка отправлена.','Параметры переданы — дальше используем выбранный способ связи.');
    });

    window.addEventListener('nexroute:select-car', (event) => {
      state.model = event.detail.model;
      refs.model.value = state.model;
      const known = carPricing[state.model];
      if (known) setChoice('power', known.power);
      current = 0;
      renderStep();
      root.scrollIntoView({ behavior:reduceMotion.matches?'auto':'smooth', block:'start' });
    });

    renderStep();
  }

  function initCars() {
    document.querySelectorAll('[data-car-select]').forEach((button) => {
      button.addEventListener('click', () => {
        document.querySelectorAll('.car-card').forEach((card) => card.classList.remove('car-card--selected'));
        button.closest('.car-card')?.classList.add('car-card--selected');
        window.dispatchEvent(new CustomEvent('nexroute:select-car', { detail:{ model:button.dataset.carSelect } }));
      });
    });
  }

  function initFaq() {
    const root = document.querySelector('[data-faq]');
    if (!root) return;
    root.addEventListener('toggle', (event) => {
      const item = event.target;
      if (!(item instanceof HTMLDetailsElement) || !item.open) return;
      root.querySelectorAll('details[open]').forEach((other) => { if (other !== item) other.open = false; });
    }, true);
  }

  function initCases() {
    document.querySelectorAll('[data-case-toggle]').forEach((button) => {
      button.addEventListener('click', () => {
        const details = button.parentElement.querySelector('.case-card__details');
        if (!details) return;
        details.hidden = !details.hidden;
        button.textContent = details.hidden ? 'Посмотреть кейс' : 'Скрыть детали';
      });
    });
  }

  function initLeadForm() {
    const form = document.querySelector('[data-lead-form]');
    if (!form) return;
    form.addEventListener('submit', (event) => {
      event.preventDefault();
      let valid = true;
      ['model','city','contact'].forEach((name) => {
        const input = form.elements[name];
        const field = input.closest('.field');
        const message = field.querySelector('.field__message');
        if (!input.value.trim()) {
          field.classList.add('field--error');
          message.textContent = name === 'model' ? 'Укажите модель или напишите «нужен подбор».' : name === 'city' ? 'Укажите город.' : 'Укажите контакт.';
          if (valid) input.focus();
          valid = false;
        } else {
          field.classList.remove('field--error');
          if (name !== 'model') message.textContent = '';
        }
      });
      if (!form.elements.consent.checked) {
        showToast('error','Нужно согласие.','Подтвердите обработку персональных данных.');
        valid = false;
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
      target.scrollIntoView({ behavior:reduceMotion.matches?'auto':'smooth', block:'start' });
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
