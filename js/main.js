// ============================================================
// Abhieshwari Solar: shared behaviour (theme + nav)
// ============================================================

(function () {
  const root = document.documentElement;
  const saved = localStorage.getItem('as-theme');
  const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
  root.setAttribute('data-theme', saved || (prefersDark ? 'dark' : 'light'));

  function updateToggleIcon() {
    const btn = document.getElementById('themeToggle');
    if (!btn) return;
    const isDark = root.getAttribute('data-theme') === 'dark';
    btn.innerHTML = isDark
      ? '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"/></svg>'
      : '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 12.8A9 9 0 1111.2 3 7 7 0 0021 12.8z"/></svg>';
    btn.setAttribute('aria-label', isDark ? 'Switch to light mode' : 'Switch to dark mode');
  }

  function setHeaderHeightVar() {
    const header = document.querySelector('header.site');
    if (header) {
      document.documentElement.style.setProperty('--header-h', header.offsetHeight + 'px');
    }
  }

  document.addEventListener('DOMContentLoaded', () => {
    updateToggleIcon();
    setHeaderHeightVar();
    window.addEventListener('resize', setHeaderHeightVar);

    const btn = document.getElementById('themeToggle');
    if (btn) {
      btn.addEventListener('click', () => {
        const next = root.getAttribute('data-theme') === 'dark' ? 'light' : 'dark';
        root.setAttribute('data-theme', next);
        localStorage.setItem('as-theme', next);
        updateToggleIcon();
      });
    }

    const burger = document.getElementById('hamburger');
    const links = document.getElementById('navLinks');
    const menuIcon = '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 6h18M3 12h18M3 18h18"/></svg>';
    const closeIcon = '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M6 6l12 12M18 6L6 18"/></svg>';

    function closeNav() {
      if (!burger || !links) return;
      links.classList.remove('open');
      document.body.classList.remove('nav-open');
      burger.setAttribute('aria-expanded', 'false');
      burger.innerHTML = menuIcon;
    }

    if (burger && links) {
      burger.addEventListener('click', () => {
        setHeaderHeightVar();
        const expanded = !links.classList.contains('open');
        links.classList.toggle('open', expanded);
        burger.setAttribute('aria-expanded', String(expanded));
        document.body.classList.toggle('nav-open', expanded);
        burger.innerHTML = expanded ? closeIcon : menuIcon;
      });
      links.querySelectorAll('a').forEach(a => a.addEventListener('click', closeNav));

      // Close when tapping the dimmed backdrop (anywhere outside the drawer/hamburger)
      document.addEventListener('click', (e) => {
        if (!document.body.classList.contains('nav-open')) return;
        if (links.contains(e.target) || burger.contains(e.target)) return;
        closeNav();
      });

      // Close on Escape
      document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && document.body.classList.contains('nav-open')) closeNav();
      });
    }

    // mark active nav link
    // Normalized so this works whether the URL includes ".html" or not
    // (some hosting setups serve clean URLs without the extension).
    function normalizePage(p) {
      if (!p) return 'index';
      return p.replace(/\.html$/, '') || 'index';
    }
    const rawSegment = location.pathname.split('/').pop();
    const path = normalizePage(rawSegment);

    document.querySelectorAll('.navlinks a[data-page]').forEach(a => {
      if (normalizePage(a.getAttribute('data-page')) === path) a.classList.add('active');
    });

    // Bottom tab bar: mark the active tab
    document.querySelectorAll('.bottom-tabs a[data-page]').forEach(a => {
      if (normalizePage(a.getAttribute('data-page')) === path) a.classList.add('tab-active');
    });

    // "More" bottom sheet: opens from the bottom tab bar, closes on
    // backdrop click, Escape, or tapping any link inside it.
    const moreBtn = document.getElementById('moreTabBtn');
    const moreBackdrop = document.getElementById('moreSheetBackdrop');
    if (moreBtn && moreBackdrop) {
      document.querySelectorAll('.more-sheet a[data-page]').forEach(a => {
        if (normalizePage(a.getAttribute('data-page')) === path) a.classList.add('active');
      });

      function openMore() {
        moreBackdrop.hidden = false;
        requestAnimationFrame(() => moreBackdrop.classList.add('open'));
        moreBtn.setAttribute('aria-expanded', 'true');
        moreBtn.classList.add('tab-open');
      }
      function closeMore() {
        moreBackdrop.classList.remove('open');
        moreBtn.setAttribute('aria-expanded', 'false');
        moreBtn.classList.remove('tab-open');
        setTimeout(() => { moreBackdrop.hidden = true; }, 350);
      }

      moreBtn.addEventListener('click', () => {
        const isOpen = moreBackdrop.classList.contains('open');
        isOpen ? closeMore() : openMore();
      });
      moreBackdrop.addEventListener('click', (e) => {
        if (e.target === moreBackdrop) closeMore();
      });
      moreBackdrop.querySelectorAll('a').forEach(a => a.addEventListener('click', closeMore));
      document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && moreBackdrop.classList.contains('open')) closeMore();
      });
    }
  });
})();

// Simple toast helper used across pages
function showToast(msg) {
  let t = document.querySelector('.toast');
  if (!t) {
    t = document.createElement('div');
    t.className = 'toast';
    document.body.appendChild(t);
  }
  t.textContent = msg;
  t.classList.add('show');
  clearTimeout(window.__toastTimer);
  window.__toastTimer = setTimeout(() => t.classList.remove('show'), 3200);
}
