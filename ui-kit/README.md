# NEXROUTE UI Kit Base

Базовый слой UX-прототипа.

## Что живёт здесь

- design tokens;
- spacing/container;
- типографика;
- layout primitives;
- buttons;
- fields / choice controls;
- media frame;
- cards;
- accordion;
- toast;
- focus / error / success states;
- reduced-motion.

## Что НЕ живёт здесь

Hero, Journey, Configurator, Proof и другие page-specific композиции. Они находятся в `/prototype/`.

## Подключение

В prototype сначала подключается:

`../ui-kit/styles.css`

и только потом:

`./styles.css`

## Naming

BEM. JS hooks не завязываются на visual classes.

## Tokens

Colors: Ink #101216, Paper #F2EFE9, Fog #D8D6D0, Steel #7D8791, Signal #FF5B35, Night #0B151D, White #FCFBF8.

Spacing: 8 / 12 / 16 / 24 / 32 / 48 / 64 / 80 / 112.

Typography: Inter; H1 64/68; H2 48/52; H3 24/30; Body 16/24; Small 14/20; controls 16/20.
