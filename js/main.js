// ============================================================
// Abhieshwari Solar — shared behaviour (theme + nav)
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
    if (burger && links) {
      burger.addEventListener('click', () => {
        setHeaderHeightVar();
        links.classList.toggle('open');
        const expanded = links.classList.contains('open');
        burger.setAttribute('aria-expanded', String(expanded));
        document.body.classList.toggle('nav-open', expanded);
        burger.innerHTML = expanded
          ? '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M6 6l12 12M18 6L6 18"/></svg>'
          : '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 6h18M3 12h18M3 18h18"/></svg>';
      });
      links.querySelectorAll('a').forEach(a => a.addEventListener('click', () => {
        links.classList.remove('open');
        document.body.classList.remove('nav-open');
        burger.setAttribute('aria-expanded', 'false');
        burger.innerHTML = '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 6h18M3 12h18M3 18h18"/></svg>';
      }));
    }

    // mark active nav link
    const path = location.pathname.split('/').pop() || 'index.html';
    document.querySelectorAll('.navlinks a[data-page]').forEach(a => {
      if (a.getAttribute('data-page') === path) a.classList.add('active');
    });
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
