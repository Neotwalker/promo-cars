# Asset Sources

Этот файл фиксирует внешние production/demo assets, их источник и условия использования.

Перед заменой или добавлением нового asset:
- проверить страницу источника;
- проверить актуальную лицензию;
- не подразумевать endorsement брендом или человеком из stock-контента;
- по возможности хранить оптимизированную production-копию внутри проекта или на контролируемом CDN.

---

## Hero background — NEXROUTE AUTO

**Status:** active in live Hero.

**Source:** generated project asset  
**Asset:** futuristic neon concrete garage / showroom stage  
**File:** `live/assets/hero/nexroute-garage-bg-1254.webp`  
**Master generation:** 1254 × 1254  
**Live derivative:** 1254 × 1254 WebP, quality 88  
**Added:** 2026-09-25

Implementation notes:
- background only; no vehicle is baked into the current Hero asset;
- near-square composition is intentional because the Hero media frame stays close to square across the main responsive states;
- the open central stage is reserved for the future vehicle-selection loop;
- current live asset uses the full generated resolution rather than the earlier 768 px preview derivative;
- use the 1254 px WebP as the current visual-quality baseline;
- if the Hero media frame later exceeds roughly 800 CSS px on high-DPI displays, prepare a dedicated 1800–2200 px 2x master rather than upscaling this file.

### Previous Hero video candidates

Pexels ID 16815345 and Pexels ID 13643105 are no longer active in the Hero. They remain historical candidates only.
