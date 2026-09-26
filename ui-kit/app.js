(() => {
  document.querySelectorAll('[data-toast-close]').forEach((button) => {
    button.addEventListener('click', () => {
      button.closest('[data-toast-item]')?.remove();
    });
  });
})();
