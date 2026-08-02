// ============================================================
// Offer popup: opens only when the visitor taps the floating
// offer badge. No auto-trigger: avoids being an intrusive
// interstitial on load or scroll.
// ============================================================

document.addEventListener('DOMContentLoaded', () => {
  const backdrop = document.getElementById('promoBackdrop');
  const badge = document.getElementById('promoBadgeBtn');
  if (!backdrop || !badge) return;
  const closeBtn = document.getElementById('promoModalClose');

  function openModal() {
    backdrop.hidden = false;
    document.body.classList.add('promo-modal-open');
  }
  function closeModal() {
    backdrop.hidden = true;
    document.body.classList.remove('promo-modal-open');
  }

  badge.addEventListener('click', openModal);
  if (closeBtn) closeBtn.addEventListener('click', closeModal);
  backdrop.addEventListener('click', (e) => {
    if (e.target === backdrop) closeModal();
  });
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && !backdrop.hidden) closeModal();
  });
  const cta = document.getElementById('promoModalCta');
  if (cta) cta.addEventListener('click', closeModal);
});
