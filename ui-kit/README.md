# Paradise Auto — Redesign v2 UI Kit

## Концепция

**Transit Control** — автомобиль не как предмет в салоне, а как объект маршрута.

Визуальный язык строится вокруг:
- маршрутов и этапов;
- статусов сделки;
- координат, ETA, lot/id;
- крупных фотографий автомобилей;
- контраста редакционной типографики и моноширинных данных;
- signal-orange как функционального акцента.

Это сознательно уводит дизайн от исходного автомобильного референса.

## Масштабирование

Desktop использует единую координатную систему:

```css
html {
  font-size: clamp(5.33px, calc(100vw / 192), 11.5px);
}
```

На дизайн-базе 1920 px: `1rem = 10px`.

До 1024 px desktop-композиция масштабируется целиком, а ниже включается отдельный tablet/mobile layout.

## Базовые токены

- Ink — `#101216`
- Paper — `#F2EFE9`
- Fog — `#D8D6D0`
- Steel — `#7D8791`
- Signal — `#FF5B35`
- Night — `#0B151D`

Grid: 12 колонок.

Основные композиции: 5/7, 7/5, 4/8.

## Motion

Motion должен объяснять структуру:
- masked text reveal;
- continuous route marquee;
- scroll progress;
- status transitions;
- без декоративных случайных fade-in.

## Следующий этап

После утверждения UI kit:
1. новый hero;
2. benefits / trust;
3. process / route;
4. delivered cars;
5. calculator;
6. about;
7. reviews;
8. FAQ;
9. final CTA / footer.
