(() => {
  document.querySelectorAll('.toast__close').forEach((button) => {
    button.addEventListener('click', () => {
      button.closest('.toast')?.remove();
    });
  });
})();
