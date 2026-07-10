// ============================================================
// Solar need calculator
// Assumptions are shown to the user in the note box — these are
// planning estimates, not a formal site-survey quotation.
// ============================================================

const STATE = { venue: 'home', subsidy: true };

function fmtINR(n) {
  return '₹' + Math.round(n).toLocaleString('en-IN');
}

function calcSubsidy(kw) {
  // PM Surya Ghar Muft Bijli Yojana — central subsidy, residential only
  // ₹30,000/kW for first 2kW, ₹18,000 for 3rd kW, capped at ₹78,000 for 3kW+
  if (kw <= 0) return 0;
  if (kw <= 1) return 30000 * kw;
  if (kw <= 2) return 30000 + 30000 * (kw - 1);
  const extra = Math.min(kw - 2, 1);
  return Math.min(60000 + extra * 18000, 78000);
}

function calculate() {
  const roofArea = Number(document.getElementById('roofArea').value) || 0;
  const monthlyBill = Number(document.getElementById('monthlyBill').value) || 0;
  const acCount = Number(document.getElementById('acCount').value) || 0;
  const venue = STATE.venue;
  const wantSubsidy = STATE.subsidy;

  const tariff = venue === 'home' ? 7 : 9; // ₹/unit, rough average slab for UP
  const estUnits = monthlyBill / tariff;

  const sizeFromBill = estUnits / 120;      // 120 units/kW/month, typical for Gorakhpur sun hours
  const sizeFromRoof = roofArea / 107;      // ~107 sq.ft. needed per kW (matches PM Surya Ghar norm)
  const sizeFromAC = 1 + acCount * 0.75;    // heuristic: base load + ~0.75kW per AC

  let recommended = Math.min(Math.max(sizeFromBill, sizeFromAC), sizeFromRoof || sizeFromBill);
  if (!isFinite(recommended) || recommended <= 0) recommended = 1;
  recommended = Math.max(1, Math.round(recommended * 2) / 2);

  const panelCount = Math.max(2, Math.ceil((recommended * 1000) / 400)); // ~400W panels
  const costLow = recommended * 50000;
  const costHigh = recommended * 65000;
  const costAvg = (costLow + costHigh) / 2;

  const subsidyEligible = venue === 'home';
  const subsidy = subsidyEligible && wantSubsidy ? calcSubsidy(recommended) : 0;
  const netCost = Math.max(costAvg - subsidy, 0);

  const genUnits = Math.min(estUnits, recommended * 120) || recommended * 120;
  const monthlySavings = genUnits * tariff;
  const paybackYears = monthlySavings > 0 ? (netCost / (monthlySavings * 12)) : 0;

  document.getElementById('resSize').textContent = recommended.toFixed(1) + ' kW';
  document.getElementById('resPanels').textContent = panelCount + ' panels (approx.)';
  document.getElementById('resCost').textContent = fmtINR(costLow) + ' – ' + fmtINR(costHigh);
  document.getElementById('resSubsidy').textContent = subsidyEligible
    ? (wantSubsidy ? fmtINR(subsidy) : 'Not applied')
    : 'Residential only';
  document.getElementById('resNet').textContent = fmtINR(netCost) + (subsidyEligible && wantSubsidy ? ' (after subsidy)' : '');
  document.getElementById('resSavings').textContent = fmtINR(monthlySavings) + ' / month (approx.)';
  document.getElementById('resPayback').textContent = paybackYears > 0 ? paybackYears.toFixed(1) + ' years' : '—';

  document.getElementById('subsidyNote').style.display = subsidyEligible ? 'none' : 'block';
}

function setVenue(v, el) {
  STATE.venue = v;
  document.querySelectorAll('.tile[data-venue]').forEach(t => t.classList.remove('active'));
  el.classList.add('active');
  const subsidyRow = document.getElementById('subsidyToggleRow');
  subsidyRow.style.opacity = v === 'home' ? '1' : '.5';
  calculate();
}

function setSubsidy(v, el) {
  STATE.subsidy = v;
  document.querySelectorAll('.tile[data-subsidy]').forEach(t => t.classList.remove('active'));
  el.classList.add('active');
  calculate();
}

document.addEventListener('DOMContentLoaded', () => {
  ['roofArea', 'monthlyBill', 'acCount'].forEach(id => {
    const el = document.getElementById(id);
    if (el) el.addEventListener('input', calculate);
  });
  calculate();

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
