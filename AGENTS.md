# AGENTS.md

Правила разработки NEXROUTE AUTO.

## Source of truth для текущего этапа

1. `docs/UX-PROTOTYPE-RULES.md`
2. `ui-kit/README.md`
3. `docs/ASSET-SOURCES.md` — если работа затрагивает media.
4. Google Doc проекта — контент и Copy, когда он доступен в рабочем контексте.

Старые `docs/PROJECT-DIRECTION.md`, `docs/BRAND-CONCEPTS.md`, `docs/SITE-STORYBOARD.md` и `docs/DEVELOPMENT-GUIDELINES.md` можно использовать только как исторический background. При конфликте они НЕ переопределяют `docs/UX-PROTOTYPE-RULES.md` и актуальный Copy.

## Архитектура

- `/ui-kit/` — единственный источник базовых tokens, spacing, типографики и reusable BEM-компонентов.
- `/prototype/` — UX-прототип поверх UI-kit. Не дублирует базовые правила.
- `/live/` — предыдущая рабочая версия. На Этапе 4 не переписывать.
- корневая legacy-реализация удалена и не должна возвращаться.

## Основные правила

1. Replace, not patch: исправлять исходную реализацию, удалять конфликтующие старые правила.
2. Не использовать `!important` как обычный способ управления каскадом.
3. Не создавать базовый компонент в prototype, если он принадлежит UI-kit.
4. BEM: block / element / modifier. Без цепочек `.block__element__child`.
5. JavaScript-hooks — через `data-*`, а не через CSS-классы внешнего вида.
6. Семантические `button`, `a`, `form`, `label`, `input`, `details` там, где они подходят.
7. Видимый `:focus-visible`, keyboard navigation, ARIA для stateful widgets.
8. Учитывать `prefers-reduced-motion`.
9. Не добавлять framework/dependency без необходимости.
10. Не оставлять debug, console.log, временные DOM-элементы и dead code.
11. Не выдавать demo-данные NEXROUTE за подтверждённые факты вне контекста шаблона.
12. Не менять `/live/` до утверждения browser UX prototype.

## Definition of done для Этапа 4

- UI-kit — единый фундамент.
- Prototype подключает UI-kit раньше локального stylesheet.
- Нет дублирующих tokens/base components.
- Journey работает по скроллу.
- Configurator проходит весь сценарий и принимает любую модель.
- Cars → Configurator передаёт выбранную машину.
- FAQ, forms и toast имеют states.
- `prototype/states.html` показывает ключевые состояния теми же компонентами.
- responsive не требует отдельной переписи DOM.
- нет horizontal overflow, console errors и случайных magic overrides.
