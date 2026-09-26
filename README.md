# NEXROUTE AUTO — promo-cars

UX-прототип продаваемого шаблона для компании по подбору и доставке автомобилей из Китая в Россию.

## Актуальная структура

- `ui-kit/` — design tokens, spacing, типографика, базовые BEM-компоненты и их состояния.
- `prototype/` — текущий UX-прототип. Собирается поверх `ui-kit/`.
- `live/` — предыдущая опубликованная рабочая версия. На UX-этапе не переписывается.
- `docs/UX-PROTOTYPE-RULES.md` — локальный контракт Этапа 4 для кодовых агентов.
- `docs/ASSET-SOURCES.md` — происхождение и статус media-assets.

Корневой legacy-сайт «Парадайз Авто» удалён, чтобы не существовало второй активной реализации и конкурирующих CSS/JS.

## Порядок работы

1. Сначала `ui-kit/`: tokens → base → typography → layout primitives → reusable components → states/accessibility.
2. Затем `prototype/`: секции, UX-сценарии, интерактивность, states, responsive.
3. После UX-утверждения — visual-polish и только затем перенос решений в `live/`.

## Локальный запуск

```bash
python3 -m http.server 8080
```

UI-kit: `http://localhost:8080/ui-kit/`  
Prototype: `http://localhost:8080/prototype/`  
States: `http://localhost:8080/prototype/states.html`
