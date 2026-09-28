(() => {
  const video = document.querySelector('[data-hero-video]');
  if (!video) return;

  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
  const desktopMedia = window.matchMedia('(min-width: 48rem)');

  const unloadVideo = () => {
    video.pause();
    if (!video.hasAttribute('src')) return;
    video.removeAttribute('src');
    video.load();
  };

  const syncVideo = () => {
    const shouldLoad = desktopMedia.matches && !reduceMotion.matches;

    if (!shouldLoad) {
      unloadVideo();
      return;
    }

    if (!video.hasAttribute('src')) {
      video.src = video.dataset.src;
      video.load();
    }

    if (!document.hidden) video.play().catch(() => {});
  };

  syncVideo();
  reduceMotion.addEventListener?.('change', syncVideo);
  desktopMedia.addEventListener?.('change', syncVideo);

  document.addEventListener('visibilitychange', () => {
    if (document.hidden) video.pause();
    else syncVideo();
  });
})();
