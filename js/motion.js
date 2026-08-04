// ============================================================
// Scroll-reveal animation. Progressive enhancement: the
// '.reveal' class is added here in JS, never in the HTML
// markup, so if this script fails to load or run for any
// reason, every element simply stays at its normal visible
// state. Nothing depends on this script for correctness.
//
// Skips the first <section> on the page (the hero, generally
// the LCP candidate) so above-the-fold content is never
// hidden while JS loads. Fully disabled under
// prefers-reduced-motion.
// ============================================================

(function () {
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  if (!('IntersectionObserver' in window)) return;

  document.addEventListener('DOMContentLoaded', () => {
    const sections = document.querySelectorAll('main section, main > article > section');
    const targets = [];

    sections.forEach((section, sIndex) => {
      if (sIndex === 0) return; // never touch the hero / first section
      section.querySelectorAll('.card, .section-head, .band').forEach((el) => {
        targets.push(el);
      });
    });

    if (!targets.length) return;

    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-visible');
          observer.unobserve(entry.target);
        }
      });
    }, { threshold: 0.1, rootMargin: '0px 0px -60px 0px' });

    targets.forEach((el, i) => {
      el.classList.add('reveal');
      el.style.transitionDelay = (i % 3) * 70 + 'ms';
      observer.observe(el);
    });
  });
})();
