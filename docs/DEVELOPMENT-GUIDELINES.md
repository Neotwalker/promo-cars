# Development Guidelines

Этот документ определяет технические правила разработки финальной версии сайта.

Главная цель — не допускать накопления мусора в HTML/CSS/JS и не превращать каждую следующую правку в борьбу с предыдущими.

---

## 1. Структура проекта

### `/ui-kit/`

Назначение:
- токены;
- типографика;
- базовые компоненты;
- состояния;
- motion primitives.

Это дизайн-система, а не production-страница.

### `/prototype/`

Назначение:
- структура;
- последовательность секций;
- проверка сценария;
- черновая интерактивность.

Не переносить prototype-код в `/live/` механически. Использовать его как архитектурный reference.

### `/live/`

Назначение:
- финальная версия сайта;
- чистый production-oriented HTML/CSS/JS;
- только актуальные реализации.

Для `/live/` требования этого документа обязательны.

---

# 2. Главный принцип: replace, not patch

Любая правка должна изменять исходную реализацию, а не добавлять новый слой поверх неё.

Плохо:

```css
.card { padding: 20px; }

/* later */
.card { padding: 24px; }

/* mobile fix */
.card { padding: 18px !important; }
```

Хорошо:

```css
.card {
  padding: 2.4rem;
}

@media (max-width: 1100px) {
  .card {
    padding: 1.8rem;
  }
}
```

Перед добавлением нового CSS для существующего компонента:
1. найти все существующие селекторы компонента;
2. понять каскад;
3. отредактировать основной блок;
4. удалить устаревшие overrides.

---

# 3. CSS architecture

## Порядок файла

Рекомендуемый порядок:

1. tokens / custom properties;
2. reset / base;
3. typography;
4. layout primitives;
5. shared components;
6. sections в порядке страницы;
7. interaction states;
8. responsive;
9. reduced-motion.

Не создавать несколько разрозненных блоков одного компонента по всему файлу без причины.

## Один компонент — одна основная реализация

Для одного компонента должен существовать один основной блок стилей.

Допустимы:
- state selectors рядом с компонентом;
- media-query overrides;
- theme/context modifier.

Не допустимы:
- `.button` в пяти несвязанных местах;
- «temporary fix» в конце stylesheet;
- повторный полный selector block ради одной правки.

## `!important`

По умолчанию запрещён.

Допустим только когда:
- переопределяется сторонняя библиотека;
- есть подтверждённая техническая причина;
- рядом оставлен короткий комментарий, почему обычной специфичности недостаточно.

Нельзя использовать `!important` для исправления собственной неструктурированной каскадности.

## Inline styles

Не использовать обычные inline styles.

Допустимое исключение:
- динамическая CSS custom property, например `style="--progress:.42"`;
- значение действительно приходит из состояния/JS.

## Именование

Использовать понятные имена по смыслу:
- `.route-card`
- `.vehicle-card`
- `.hero-status`

Избегать:
- `.box2`
- `.new-card`
- `.fix-test`
- `.final-final`

## Tokens

Цвета, линии, easing, базовые spacing/motion значения повторно не хардкодить, если для них уже существует token.

## Desktop responsive system

Desktop использует fluid-rem систему проекта.

База:

```css
html {
  font-size: clamp(9px, calc(100vw / 192), 11.5px);
}
```

Приблизительно:
- 1920px → 1rem ≈ 10px.

Связанные размеры одной композиции задавать в `rem`, чтобы они масштабировались совместно.

Не строить один hero одновременно из:
- font-size в `vw`;
- offsets в `px`;
- width через отдельный `clamp()`;
- gap в процентах;
если это разрушает общую координатную систему.

## Tablet/mobile

До 1100px — отдельная tablet/mobile композиция.

Это не «уменьшенный desktop».

Разрешено менять:
- grid;
- порядок блоков;
- размеры;
- sticky behavior;
- плотность данных;
- расположение media.

---

# 4. HTML rules

## Семантика

Использовать подходящие элементы:
- `header`
- `nav`
- `main`
- `section`
- `article`
- `button`
- `a`
- `form`
- `label`

Не использовать `div` как кнопку.

## CTA

Если элемент:
- ведёт по URL/anchor → `a`;
- выполняет действие → `button`.

## Accessibility

Обязательно:
- alt для значимых изображений;
- декоративные изображения скрывать от accessibility tree;
- `aria-expanded` для accordion/menu;
- visible focus;
- корректные labels для inputs;
- интерактив без обязательной мыши.

## Placeholder content

Временный контент должен быть понятен разработчику, но не выглядеть как подтверждённый факт.

Не использовать неподтверждённые:
- количество клиентов;
- сроки;
- цены;
- проценты;
- гарантии.

---

# 5. JavaScript rules

## Progressive enhancement

HTML должен оставаться понятным без JS там, где это разумно.

JS отвечает за:
- состояние;
- motion;
- раскрытие;
- drag;
- scroll-driven interaction;
- конфигуратор.

JS не должен компенсировать плохую HTML/CSS структуру.

## Инициализация

Фича должна:
- искать свой root element;
- ничего не делать, если root отсутствует;
- не создавать duplicate listeners при повторной инициализации.

Для сложных widgets использовать scoped initialization.

Пример:

```js
document.querySelectorAll('[data-widget]').forEach(root => {
  if (root.dataset.ready === 'true') return;
  root.dataset.ready = 'true';

  // init
});
```

## Event listeners

Не добавлять глобальный scroll/resize listener для каждой мелкой фичи.

Предпочитать:
- один listener на фичу;
- event delegation;
- `IntersectionObserver`;
- `ResizeObserver`;
- requestAnimationFrame batching.

## Scroll animation

Не выполнять тяжёлые layout reads/writes в каждом scroll event без необходимости.

Разделять:
- measurement;
- state;
- render.

## DOM

Не искать одни и те же элементы в цикле каждого animation frame.

Кэшировать references.

## Debug

Перед коммитом удалить:
- `console.log`;
- `console.table`;
- `debugger`;
- debug overlays;
- временные counters;
- искусственные timeout для тестов.

## Dead JS

Если interaction удалён из HTML:
- удалить его JS;
- удалить связанные data-attributes;
- удалить CSS states.

---

# 6. Motion

Motion должен быть функциональным.

Допустимые задачи:
- показать смену статуса;
- показать прогресс;
- объяснить маршрут;
- дать feedback;
- связать состояния.

Не добавлять animation только для «живости».

## Reduced motion

Для значимых анимаций обязательно учитывать:

```css
@media (prefers-reduced-motion: reduce) {
  ...
}
```

JS motion также должен проверять `prefers-reduced-motion`, если animation создаётся скриптом.

## Transform

Не оставлять постоянный `transform` на scrollable containers без причины.

Особенно внимательно проверять mobile Safari.

---

# 7. Assets

## Production assets

Для `/live/` предпочтительно хранить production assets внутри проекта или использовать контролируемый CDN.

Не оставлять случайные remote stock URLs как финальную зависимость.

## Images

Подготавливать:
- адекватный размер;
- современный формат при возможности;
- `width` / `height` или aspect-ratio;
- lazy loading вне первого экрана.

## Video

Hero-video:
- muted;
- playsinline;
- poster;
- оптимизированный bitrate;
- fallback image;
- не блокирует first render.

---

# 8. Dependencies

Не добавлять dependency без причины.

Перед добавлением библиотеки ответить:
1. какую конкретно задачу она решает;
2. нельзя ли решить её текущим стеком;
3. сколько она добавляет веса;
4. нужна ли она более чем в одном месте;
5. как она влияет на accessibility/performance.

Three.js, React, animation libraries и другие крупные зависимости не подключать «на будущее».

---

# 9. Performance

Не допускать:
- огромных hero images;
- autoplay video без оптимизации;
- нескольких blur/backdrop-filter слоёв друг над другом;
- десятков постоянных requestAnimationFrame loops;
- layout thrashing;
- скрытых DOM-копий без необходимости.

Для backdrop-filter:
- использовать точечно;
- особенно осторожно на iOS Safari.

---

# 10. Scope of change

Одна задача — один логический change-set.

Пример:

«Исправить hover burger»

Не должен одновременно:
- менять typography;
- переписывать hero;
- править FAQ;
- менять responsive breakpoint.

Исключение — непосредственная зависимость, без которой исправление невозможно.

---

# 11. Cleanup after every change

После завершения изменения проверить:

## HTML
- удалены старые элементы;
- нет duplicate id;
- нет неиспользуемых classes/data-attributes;
- нет временных comments.

## CSS
- нет старой реализации компонента;
- нет duplicate selector patches;
- нет неиспользуемых keyframes;
- нет необоснованных `!important`;
- нет старых media overrides;
- нет временных debug styles.

## JS
- нет обработчиков для удалённых элементов;
- нет duplicate initialization;
- нет debug;
- нет неиспользуемых functions/variables;
- нет старой версии interaction.

---

# 12. Mandatory pre-commit checklist for /live/

Перед каждым коммитом ответить «да» на все пункты.

### Structure
- [ ] Изменение соответствует PROJECT-DIRECTION и SITE-STORYBOARD.
- [ ] Не добавлена дублирующая реализация существующего компонента.
- [ ] Устаревшая реализация удалена.

### CSS
- [ ] Нет patch-block в конце файла ради исправления каскада.
- [ ] Нет нового необоснованного `!important`.
- [ ] Нет duplicate selectors с конфликтующими properties.
- [ ] Используются существующие tokens.
- [ ] Desktop сохраняет fluid-rem логику.
- [ ] Tablet/mobile проверены отдельно.

### JavaScript
- [ ] Нет console/debug.
- [ ] Нет duplicate listeners/init.
- [ ] Нет JS для удалённого DOM.
- [ ] Scroll/resize logic не делает лишнюю работу.
- [ ] Reduced-motion учтён.

### HTML / A11y
- [ ] CTA использует правильный элемент.
- [ ] Focus states работают.
- [ ] Form controls имеют labels.
- [ ] Accordion/menu имеют ARIA state.
- [ ] Images имеют корректный alt/aria-hidden.

### Content
- [ ] Placeholder не выглядит как подтверждённый факт.
- [ ] Нет случайных внутренних названий/комментариев.
- [ ] Нет временного lorem/debug текста.

### Runtime
- [ ] Нет console errors.
- [ ] Нет horizontal overflow без намерения.
- [ ] Проверен desktop.
- [ ] Проверен tablet.
- [ ] Проверен mobile.
- [ ] Проверен keyboard.
- [ ] Проверен reduced-motion.

### Repository
- [ ] Изменены только нужные файлы.
- [ ] Нет случайных generated/temp файлов.
- [ ] Commit message описывает изменение.
- [ ] Если изменение публикуется — проверен фактический Pages deployment.

Если хотя бы один пункт не выполнен, изменение не считается завершённым.

---

# 13. Periodic cleanup

Даже при соблюдении правил иногда проводить технический cleanup после крупного milestone:

- Hero complete;
- route complete;
- configurator complete;
- перед final QA.

Cleanup не должен менять визуальный дизайн.

Его задача:
- объединить повторяющиеся tokens;
- удалить dead selectors;
- удалить dead JS;
- проверить unused assets;
- проверить specificity;
- проверить responsive overrides;
- проверить event listeners.

---

# 14. Rule for bug fixes

При баге запрещено сразу писать override.

Алгоритм:

1. Воспроизвести проблему.
2. Найти DOM элемента.
3. Найти все CSS selectors, которые на него влияют.
4. Найти JS state/listeners, которые на него влияют.
5. Определить корневую причину.
6. Исправить исходную реализацию.
7. Удалить старые конфликтующие правила.
8. Проверить соседние states/breakpoints.
9. Проверить live deployment.
10. Только после этого считать баг исправленным.

---

# 15. Definition of done

Фича или секция готова, когда:

- визуально соответствует утверждённому направлению;
- использует UI-kit;
- не содержит временной архитектуры;
- responsive завершён;
- states завершены;
- accessibility не сломана;
- reduced-motion предусмотрен;
- нет dead code;
- нет override debt;
- нет console errors;
- performance разумный;
- опубликованная версия соответствует коммиту.

Главный критерий качества кода:

**следующее изменение должно быть проще, а не сложнее из-за текущего.**
