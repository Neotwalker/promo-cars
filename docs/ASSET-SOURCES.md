# Asset Sources

Этот файл фиксирует внешние production/demo assets, их источник и условия использования.

Перед заменой или добавлением нового asset:
- проверить страницу источника;
- проверить актуальную лицензию;
- не подразумевать endorsement брендом или человеком из stock-контента;
- по возможности хранить оптимизированную production-копию внутри проекта или на контролируемом CDN.

---

## Hero video — NEXROUTE AUTO

**Status:** active in live Hero.

**Source:** Pexels  
**Creator:** Erik Mclean  
**Asset:** Car Driving at Night  
**Pexels ID:** 13643105  
**Source page:** https://www.pexels.com/video/car-driving-at-night-13643105/  
**License:** https://www.pexels.com/license/  
**Checked:** 2026-09-25

Current remote media:
- video: https://videos.pexels.com/video-files/13643105/13643105-uhd_3840_2160_24fps.mp4
- poster: https://images.pexels.com/videos/13643105/pexels-photo-13643105.jpeg

Implementation notes:
- the clip is decorative and hidden from the accessibility tree;
- playback is muted, looped and plays inline;
- the video source is attached only after page load/idle so it does not block first render;
- when prefers-reduced-motion is enabled, the video remains on the poster frame;
- when browser Data Saver is enabled, the video is not loaded;
- before final commercial handoff, prefer replacing the remote UHD source with an optimized local 1080p/720p encode if asset packaging allows it.

Pexels currently states that its photos and videos can be used for free, attribution is not required, modification is allowed, and use on websites and templates sold to customers is permitted. Stock imagery must not be used to imply endorsement by depicted people or brands.
