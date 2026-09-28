(() => {
  const video = document.querySelector('[data-hero-video]');
  if (!video) return;

  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)');

  const syncVideo = () => {
    if (reduceMotion.matches) {
      video.pause();
      video.currentTime = 0;
      return;
    }
    video.play().catch(() => {});
  };

  syncVideo();
  reduceMotion.addEventListener?.('change', syncVideo);
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) video.pause();
    else syncVideo();
  });
})();
