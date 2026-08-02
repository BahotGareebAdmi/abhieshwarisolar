// ============================================================
// Solar need calculator
// Assumptions are shown to the user in the note box: these are
// planning estimates, not a formal site-survey quotation.
// ============================================================

const STATE = { venue: 'home', subsidy: true, calculated: false };

function fmtINR(n) {
  return '₹' + Math.round(n).toLocaleString('en-IN');
}

// Central PM Surya Ghar subsidy: ₹30,000/kW for first 2kW, ₹18,000 for 3rd kW, capped ₹78,000
function calcCentralSubsidy(kw) {
  if (kw <= 0) return 0;
  if (kw <= 1) return 30000 * kw;
  if (kw <= 2) return 30000 + 30000 * (kw - 1);
  const extra = Math.min(kw - 2, 1);
  return Math.min(60000 + extra * 18000, 78000);
}

// Uttar Pradesh state top-up via UPNEDA: ₹15,000/kW, capped at ₹30,000 per household
// This state top-up is subject to current UPNEDA budget allocation: verify before quoting.
function calcUPTopUp(kw) {
  if (kw <= 0) return 0;
  return Math.min(15000 * kw, 30000);
}

function calculate() {
  const roofArea = Number(document.getElementById('roofArea').value) || 0;
  const monthlyBill = Number(document.getElementById('monthlyBill').value) || 0;
  const acCount = Number(document.getElementById('acCount').value) || 0;
  const venue = STATE.venue;
  const wantSubsidy = STATE.subsidy;

  const tariff = venue === 'home' ? 7 : 9;
  const estUnits = monthlyBill / tariff;

  const sizeFromBill = estUnits / 120;
  const sizeFromRoof = roofArea / 107;
  const sizeFromAC = 1 + acCount * 0.75;

  let recommended = Math.min(Math.max(sizeFromBill, sizeFromAC), sizeFromRoof || sizeFromBill);
  if (!isFinite(recommended) || recommended <= 0) recommended = 1;
  recommended = Math.max(1, Math.round(recommended * 2) / 2);

  const panelCount = Math.max(2, Math.ceil((recommended * 1000) / 400));
  const costLow = recommended * 50000;
  const costHigh = recommended * 65000;
  const costAvg = (costLow + costHigh) / 2;

  const subsidyEligible = venue === 'home';
  const central = subsidyEligible && wantSubsidy ? calcCentralSubsidy(recommended) : 0;
  const upTopUp = subsidyEligible && wantSubsidy ? calcUPTopUp(recommended) : 0;
  const totalSubsidy = central + upTopUp;
  const netCost = Math.max(costAvg - totalSubsidy, 0);

  const genUnits = Math.min(estUnits, recommended * 120) || recommended * 120;
  const monthlySavings = genUnits * tariff;
  const paybackYears = monthlySavings > 0 ? (netCost / (monthlySavings * 12)) : 0;

  document.getElementById('resSize').textContent = recommended.toFixed(1) + ' kW';
  document.getElementById('resPanels').textContent = panelCount + ' ' + t('calc.js.panelsApprox');
  document.getElementById('resCost').textContent = fmtINR(costLow) + ' – ' + fmtINR(costHigh);

  const subsidyLine = document.getElementById('resSubsidy');
  if (subsidyEligible && wantSubsidy) {
    subsidyLine.textContent = fmtINR(totalSubsidy) + ' total';
    document.getElementById('subsidyBreakdown').style.display = 'block';
    document.getElementById('subCentral').textContent = fmtINR(central);
    document.getElementById('subUP').textContent = fmtINR(upTopUp);
  } else {
    subsidyLine.textContent = subsidyEligible ? t('calc.js.notApplied') : t('calc.js.residentialOnly');
    document.getElementById('subsidyBreakdown').style.display = 'none';
  }

  document.getElementById('resNet').textContent = fmtINR(netCost) + (subsidyEligible && wantSubsidy ? t('calc.js.afterSubsidy') : '');
  document.getElementById('resSavings').textContent = fmtINR(monthlySavings) + t('calc.js.perMonthApprox');
  document.getElementById('resPayback').textContent = paybackYears > 0 ? paybackYears.toFixed(1) + t('calc.js.years') : 'N/A';

  document.getElementById('subsidyNote').style.display = subsidyEligible ? 'none' : 'block';

  const placeholder = document.getElementById('resultPlaceholder');
  const resultBody = document.getElementById('resultBody');
  if (placeholder) placeholder.style.display = 'none';
  if (resultBody) resultBody.style.display = 'block';
  STATE.calculated = true;
}

// --- Brand comparer carousel ---
// Ratios are relative to the same ₹50k-65k/kW baseline used above.
// Loom Solar & Adani: best current discount (~5% below Tata, i.e. a 19:20 ratio).
// Waaree: a little less (~2.5% below Tata). Tata: baseline, least discount room.
// Update these ratios directly if pricing/discounts change.
const BRAND_DATA = [
  { key: 'tata', name: 'Tata Power Solar', ratio: 1.00, warrantyKey: 'calc.brand.tata.warranty', best: false },
  { key: 'adani', name: 'Adani Solar', ratio: 0.95, warrantyKey: 'calc.brand.adani.warranty', best: true },
  { key: 'loom', name: 'Loom Solar', ratio: 0.95, warrantyKey: 'calc.brand.loom.warranty', best: true },
  { key: 'waaree', name: 'Waaree', ratio: 0.975, warrantyKey: 'calc.brand.waaree.warranty', best: false }
];

// Standalone brand comparer state: independent of the main calculator form/button above.
const BRAND_STATE = { kw: 3, subsidy: true };

function updateBrandCompare() {
  const kw = BRAND_STATE.kw;
  const costLow = kw * 50000;
  const costHigh = kw * 65000;
  const subsidy = BRAND_STATE.subsidy ? (calcCentralSubsidy(kw) + calcUPTopUp(kw)) : 0;
  renderBrandCompare(kw, costLow, costHigh, subsidy);
}

function setBrandSubsidy(v, el) {
  BRAND_STATE.subsidy = v;
  document.querySelectorAll('.tile[data-brandsubsidy]').forEach(t => t.classList.remove('active'));
  el.classList.add('active');
  updateBrandCompare();
}

function renderBrandCompare(kw, costLow, costHigh, subsidy) {
  const section = document.getElementById('brandCompareSection');
  const carousel = document.getElementById('brandCarousel');
  const dotsWrap = document.getElementById('brandDots');
  if (!section || !carousel || !dotsWrap) return;

  const sizeLabel = kw.toFixed(1) + ' kW';
  const waMsgBase = `Hi, I used the solar calculator for a ${sizeLabel} system. Please share a quote for `;

  carousel.innerHTML = BRAND_DATA.map((b, i) => {
    const bLow = costLow * b.ratio;
    const bHigh = costHigh * b.ratio;
    const bAvg = (bLow + bHigh) / 2;
    const netCost = Math.max(bAvg - subsidy, 0);
    const waText = encodeURIComponent(waMsgBase + b.name + '.');
    return `
      <div class="brand-card${b.best ? ' brand-best' : ''}" data-index="${i}">
        <div class="brand-card-top">
          <span class="brand-card-name">${b.name}</span>
          ${b.best ? `<span class="brand-badge">${t('calc.brand.bestDiscount')}</span>` : ''}
        </div>
        <div class="brand-card-row"><span>${t('calc.brand.systemCost')}</span><span>${fmtINR(bLow)} – ${fmtINR(bHigh)}</span></div>
        <div class="brand-card-row"><span>${t('calc.brand.warranty')}</span><span>${t(b.warrantyKey)}</span></div>
        <div class="brand-card-net">${fmtINR(netCost)}<span style="font-size:.7rem; color:var(--text-soft); font-family:'Work Sans',sans-serif; display:block;">${t('calc.brand.netCost')}</span></div>
        <a class="btn btn-primary" style="width:100%; font-size:.85rem; padding:12px;" target="_blank" rel="noopener" href="https://wa.me/919026573953?text=${waText}">${t('calc.brand.cta')}</a>
      </div>`;
  }).join('');

  dotsWrap.innerHTML = BRAND_DATA.map((_, i) => `<button class="brand-dot${i === 0 ? ' active' : ''}" data-index="${i}" aria-label="Go to brand ${i + 1}"></button>`).join('');

  section.style.display = 'block';
  setupBrandCarousel();
}

let brandCarouselObserver = null;
function setupBrandCarousel() {
  const carousel = document.getElementById('brandCarousel');
  const prevBtn = document.getElementById('brandPrev');
  const nextBtn = document.getElementById('brandNext');
  const dots = Array.from(document.querySelectorAll('.brand-dot'));
  const cards = Array.from(document.querySelectorAll('.brand-card'));
  if (!carousel || !cards.length) return;

  const scrollToCard = (i) => {
    const card = cards[Math.max(0, Math.min(i, cards.length - 1))];
    if (card) card.scrollIntoView({ behavior: 'smooth', inline: 'center', block: 'nearest' });
  };

  if (prevBtn) prevBtn.onclick = () => {
    const active = dots.findIndex(d => d.classList.contains('active'));
    scrollToCard((active > 0 ? active : 1) - 1);
  };
  if (nextBtn) nextBtn.onclick = () => {
    const active = dots.findIndex(d => d.classList.contains('active'));
    scrollToCard((active >= 0 ? active : -1) + 1);
  };
  dots.forEach(dot => {
    dot.onclick = () => scrollToCard(Number(dot.dataset.index));
  });

  if (brandCarouselObserver) brandCarouselObserver.disconnect();
  brandCarouselObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting && entry.intersectionRatio > 0.6) {
        const i = Number(entry.target.dataset.index);
        dots.forEach(d => d.classList.toggle('active', Number(d.dataset.index) === i));
      }
    });
  }, { root: carousel, threshold: [0.6] });
  cards.forEach(c => brandCarouselObserver.observe(c));
}

function setVenue(v, el) {
  STATE.venue = v;
  document.querySelectorAll('.tile[data-venue]').forEach(t => t.classList.remove('active'));
  el.classList.add('active');
  const subsidyRow = document.getElementById('subsidyToggleRow');
  subsidyRow.style.opacity = v === 'home' ? '1' : '.5';
  if (STATE.calculated) calculate();
}

function setSubsidy(v, el) {
  STATE.subsidy = v;
  document.querySelectorAll('.tile[data-subsidy]').forEach(t => t.classList.remove('active'));
  el.classList.add('active');
  if (STATE.calculated) calculate();
}

function syncSliderLabel(id, labelId, suffix) {
  const el = document.getElementById(id);
  const label = document.getElementById(labelId);
  if (el && label) label.textContent = Number(el.value).toLocaleString('en-IN') + suffix;
}

function syncAllSliderLabels() {
  syncSliderLabel('roofArea', 'roofAreaLabel', t('calc.js.sqft'));
  syncSliderLabel('monthlyBill', 'monthlyBillLabel', '');
  syncSliderLabel('acCount', 'acCountLabel', '');
  syncSliderLabel('brandKw', 'brandKwLabel', ' kW');
}

document.addEventListener('DOMContentLoaded', () => {
  syncAllSliderLabels();

  document.getElementById('roofArea').addEventListener('input', () => { syncSliderLabel('roofArea', 'roofAreaLabel', t('calc.js.sqft')); });
  document.getElementById('monthlyBill').addEventListener('input', () => { syncSliderLabel('monthlyBill', 'monthlyBillLabel', ''); });
  document.getElementById('acCount').addEventListener('input', () => { syncSliderLabel('acCount', 'acCountLabel', ''); });

  const brandKwEl = document.getElementById('brandKw');
  if (brandKwEl) {
    brandKwEl.addEventListener('input', () => {
      syncSliderLabel('brandKw', 'brandKwLabel', ' kW');
      BRAND_STATE.kw = Number(brandKwEl.value);
      updateBrandCompare();
    });
  }
  // Brand comparer is standalone: renders on load, independent of the "Calculate my solar need" button above.
  updateBrandCompare();

  document.addEventListener('languagechange', () => {
    syncAllSliderLabels();
    if (STATE.calculated) calculate();
    updateBrandCompare();
  });

  const calcBtn = document.getElementById('calcBtn');
  if (calcBtn) calcBtn.addEventListener('click', calculate);

  const leadBtn = document.getElementById('sendToContact');
  if (leadBtn) {
    leadBtn.addEventListener('click', () => {
      const size = document.getElementById('resSize').textContent;
      const msg = `Hi, I used the solar calculator. Estimated system size: ${size}. Roof area: ${document.getElementById('roofArea').value} sq.ft, Monthly bill: ₹${document.getElementById('monthlyBill').value}, ACs: ${document.getElementById('acCount').value}, Venue: ${STATE.venue}. Please contact me for a free site visit.`;
      localStorage.setItem('as-prefill-message', msg);
      location.href = 'contact.html#form';
    });
  }
});
