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
**Asset:** Close up View of a Sports Car Front Wheel  
**Pexels ID:** 16815345  
**Source page:** https://www.pexels.com/video/close-up-view-of-a-sports-car-front-wheel-16815345/  
**License:** https://www.pexels.com/license/  
**Checked:** 2026-09-25

Current remote media:
- video: https://videos.pexels.com/video-files/16815345/16815345-uhd_3840_1608_24fps.mp4
- poster: https://images.pexels.com/videos/16815345/pexels-photo-16815345.jpeg

Implementation notes:
- 12-second close-up of a modern white sports car wheel on a rainy night;
- the clip is decorative and hidden from the accessibility tree;
- playback is muted and plays inline;
- the browser's hard video loop is not used;
- during the final 0.8 seconds the video fades to its poster, resets to frame zero and fades back in, hiding the visible loop cut;
- the video source is attached only after page load/idle so it does not block first render;
- when prefers-reduced-motion is enabled, the Hero stays on the poster frame;
- when browser Data Saver is enabled, the video is not loaded;
- before final commercial handoff, prefer an optimized local 1080p/720p encode.

Pexels marks this asset as free to use under the Pexels license. Stock imagery must not be used to imply endorsement by depicted people or brands.

### Previous Hero candidate

Pexels ID 13643105 (Car Driving at Night) was removed from the active Hero because its 7-second beginning/end transition produced a visibly abrupt loop.
