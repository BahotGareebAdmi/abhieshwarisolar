// ============================================================
// Offer popup: opens only when the visitor taps the floating
// offer badge. No auto-trigger: avoids being an intrusive
// interstitial on load or scroll.
//
// Accessibility: moves focus into the dialog on open, traps
// Tab/Shift+Tab within it, marks the rest of the page inert
// (unreachable by keyboard/screen reader) while open, and
// returns focus to the triggering button on close.
// ============================================================

document.addEventListener('DOMContentLoaded', () => {
  const backdrop = document.getElementById('promoBackdrop');
  const badge = document.getElementById('promoBadgeBtn');
  if (!backdrop || !badge) return;
  const closeBtn = document.getElementById('promoModalClose');
  const dialog = backdrop.querySelector('.promo-modal');

  let lastFocused = null;

  function focusableEls() {
    return Array.from(dialog.querySelectorAll('a[href], button:not([disabled])'))
      .filter(el => el.offsetParent !== null);
  }

  function setBackgroundInert(on) {
    Array.from(document.body.children).forEach(el => {
      if (el === backdrop) return;
      if (on) { el.setAttribute('inert', ''); }
      else { el.removeAttribute('inert'); }
    });
  }

  function openModal() {
    lastFocused = document.activeElement;
    backdrop.hidden = false;
    document.body.classList.add('promo-modal-open');
    setBackgroundInert(true);
    const first = focusableEls()[0];
    if (first) first.focus();
  }

  function closeModal() {
    backdrop.hidden = true;
    document.body.classList.remove('promo-modal-open');
    setBackgroundInert(false);
    if (lastFocused && typeof lastFocused.focus === 'function') lastFocused.focus();
  }

  function trapTab(e) {
    if (e.key !== 'Tab' || backdrop.hidden) return;
    const items = focusableEls();
    if (!items.length) return;
    const first = items[0];
    const last = items[items.length - 1];
    if (e.shiftKey && document.activeElement === first) {
      e.preventDefault();
      last.focus();
    } else if (!e.shiftKey && document.activeElement === last) {
      e.preventDefault();
      first.focus();
    }
  }

  badge.addEventListener('click', openModal);
  if (closeBtn) closeBtn.addEventListener('click', closeModal);
  backdrop.addEventListener('click', (e) => {
    if (e.target === backdrop) closeModal();
  });
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && !backdrop.hidden) closeModal();
    trapTab(e);
  });
  const cta = document.getElementById('promoModalCta');
  if (cta) cta.addEventListener('click', closeModal);
});
