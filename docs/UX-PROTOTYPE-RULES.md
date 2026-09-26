# Stage 4 — UX Prototype Rules

Этот файл — локальный контракт Этапа 4. Он синхронизирован с актуальной вкладкой Google Doc проекта.

## Цель

Проверить структуру, Copy, ритм, компоненты, states и интерактивность в реальном браузере. Это UX-прототип, не финальная арт-дирекция.

## Репозиторий

- `/ui-kit/` — фундамент.
- `/prototype/` — UX-прототип.
- `/live/` — не менять на Этапе 4.

Prototype подключает `../ui-kit/styles.css` раньше `./styles.css`. Базовые tokens и reusable components не копировать в prototype.

## UI-kit first

Порядок:
design tokens → reset/base → typography → spacing/layout primitives → buttons → fields → cards/media → accordion → toast → common states/accessibility.

### Colors

- Ink: #101216
- Paper: #F2EFE9
- Fog: #D8D6D0
- Steel: #7D8791
- Signal: #FF5B35
- Night: #0B151D
- White: #FCFBF8

### Spacing

8 / 12 / 16 / 24 / 32 / 48 / 64 / 80 / 112 px.

- content max: 1248px
- desktop side fields at 1440: 96px
- section rhythm: 112px
- section inner groups: 48–64px
- section header → content: 32px
- cards gap: 24–32px
- card padding: 24px; large composite: 32px
- forms: 8–16px

### Typography

Inter.
- H1 64/68 semibold
- H2 48/52 semibold
- H3 24/30 semibold
- Body 16/24 regular
- Small 14/20 regular
- Button/control 16/20 medium

## BEM

Самостоятельный UI-объект — block; части — elements; варианты/state — modifiers.

Примеры:
- `.car-card__media`, `.car-card__price`
- `.journey__stage--active`, `.journey__stage--complete`
- `.field--error`
- `.toast--success`

JS hooks: `data-journey-step`, `data-config-step`, `data-faq-item`, `data-toast`.

## Prototype structure

Порядок секций:
Hero → Cars → Journey → Configurator → Proof → Security → FAQ → Final Form → Footer.

`prototype/index.html` показывает базовый пользовательский сценарий.  
`prototype/states.html` показывает дополнительные states тех же компонентов.

## Journey

Scroll-driven:
- 01–08 активируются по скроллу;
- progress заполняется;
- marker движется;
- completed остаются отмечены;
- detail меняется;
- reduced-motion сохраняет state changes без движения.

## Configurator

Мини-квиз:
модель/поиск → состояние → power (если нужно) → бюджет → город → summary → контакт.

- Можно ввести любую марку/модель.
- Cards могут prefill выбранную машину.
- Контакт только после summary.
- Validation у поля; toast не заменяет validation.
- Success-state остаётся внутри формы.

## Toast

Viewport overlay, не document flow.
- success, error, info
- desktop: right-bottom
- mobile: safe-area + side margins
- max 2
- success/info auto-dismiss
- error дольше + close
- live regions: polite / assertive

## Responsive / accessibility

- cards: 3 → 2 → 1
- крупные two-column blocks → one-column
- реальные button/input/label/details
- visible focus
- aria-expanded where needed
- reduced-motion
- no horizontal overflow

## Не делаем

- не переписываем `/live/`
- не полируем glow/gradients/final imagery
- не делаем финальный hero-video
- не превращаем prototype в production раньше UX-утверждения
