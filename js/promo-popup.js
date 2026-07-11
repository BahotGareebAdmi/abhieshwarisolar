// ============================================================
// Offer popup — shows once per browser session, links to WhatsApp.
// ============================================================

document.addEventListener('DOMContentLoaded', () => {
  const backdrop = document.getElementById('promoBackdrop');
  if (!backdrop) return;
  const closeBtn = document.getElementById('promoModalClose');
  const SEEN_KEY = 'as-promo-seen';

  function closeModal() {
    backdrop.hidden = true;
    document.body.classList.remove('promo-modal-open');
    sessionStorage.setItem(SEEN_KEY, '1');
  }

  if (!sessionStorage.getItem(SEEN_KEY)) {
    setTimeout(() => {
      backdrop.hidden = false;
      document.body.classList.add('promo-modal-open');
    }, 1500);
  }

  if (closeBtn) closeBtn.addEventListener('click', closeModal);
  backdrop.addEventListener('click', (e) => {
    if (e.target === backdrop) closeModal();
  });
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && !backdrop.hidden) closeModal();
  });
  const cta = document.getElementById('promoModalCta');
  if (cta) cta.addEventListener('click', () => { sessionStorage.setItem(SEEN_KEY, '1'); });
});
