// ============================================================
// Testimonials: public page
// Requires Supabase project set up per README.md
// ============================================================

let sb = null;
function getClient() {
  if (sb) return sb;
  if (typeof supabase === 'undefined' || SUPABASE_URL.startsWith('PASTE_')) return null;
  sb = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
  return sb;
}

function maskEmail(email) {
  if (!email || !email.includes('@')) return '';
  const [name, domain] = email.split('@');
  const [dName, ...dRest] = domain.split('.');
  const maskPart = (s) => (s.length <= 2 ? s[0] + '*' : s[0] + '*'.repeat(Math.max(1, s.length - 2)) + s.slice(-1));
  return `${maskPart(name)}@${maskPart(dName)}.${dRest.join('.')}`;
}

function testimonialCard(t) {
  const photo = t.photo_url
    ? `<img class="testi-photo" src="${t.photo_url}" alt="Photo shared by ${t.name}" loading="lazy">`
    : '';
  return `
    <div class="card testi-card">
      ${photo}
      <p>"${escapeHtml(t.message)}"</p>
      <div class="testi-meta">
        <div>
          <div class="testi-name">${escapeHtml(t.name)}</div>
          <div class="testi-loc">${escapeHtml(t.location)}</div>
        </div>
      </div>
    </div>`;
}

function escapeHtml(str) {
  const div = document.createElement('div');
  div.textContent = str || '';
  return div.innerHTML;
}

async function loadTestimonials() {
  const grid = document.getElementById('testiGrid');
  const empty = document.getElementById('testiEmpty');
  const client = getClient();
  if (!client) {
    grid.innerHTML = '';
    empty.style.display = 'block';
    empty.textContent = 'Testimonials backend isn\'t connected yet. Follow README.md → "Step 2: Set up Supabase" to finish setup, then this page will work.';
    return;
  }
  const { data, error } = await client
    .from('testimonials')
    .select('id, name, location, message, photo_url, created_at')
    .eq('status', 'approved')
    .order('created_at', { ascending: false });

  if (error || !data || data.length === 0) {
    empty.style.display = 'block';
    return;
  }
  empty.style.display = 'none';
  grid.innerHTML = data.map(testimonialCard).join('');
}

// --- Submission form with photo upload + honeypot + basic rate limit ---
async function handleTestimonialSubmit(e) {
  e.preventDefault();
  const form = e.target;
  const submitBtn = form.querySelector('button[type="submit"]');

  // Honeypot: bots fill hidden fields, humans don't
  if (form.website.value.trim() !== '') return;

  // Basic client-side rate limit: 1 submission per 60 seconds per browser
  const last = Number(localStorage.getItem('as-testi-last') || 0);
  if (Date.now() - last < 60000) {
    showToast(t('testi.js.waitBeforeSubmit'));
    return;
  }

  const client = getClient();
  if (!client) {
    showToast('Backend not connected yet, see README.md.');
    return;
  }

  const name = form.name.value.trim();
  const location = form.location.value.trim();
  const email = form.email.value.trim();
  const message = form.message.value.trim();
  const file = form.photo.files[0];

  if (!name || !location || !message) {
    showToast(t('testi.js.fillRequired'));
    return;
  }

  submitBtn.disabled = true;
  submitBtn.textContent = t('testi.js.submitting');

  try {
    let photo_url = null;
    if (file) {
      if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
        throw new Error(t('testi.js.photoType'));
      }
      if (file.size > 5 * 1024 * 1024) {
        throw new Error(t('testi.js.photoSize'));
      }
      const path = `${Date.now()}-${Math.random().toString(36).slice(2)}.${file.type.split('/')[1]}`;
      const { error: upErr } = await client.storage.from('testimonial-photos').upload(path, file);
      if (upErr) throw upErr;
      const { data: pub } = client.storage.from('testimonial-photos').getPublicUrl(path);
      photo_url = pub.publicUrl;
    }

    const { error } = await client.from('testimonials').insert({
      name, location, email, message, photo_url, status: 'pending'
    });
    if (error) throw error;

    localStorage.setItem('as-testi-last', String(Date.now()));
    form.reset();
    showToast(t('testi.js.thankYou'));
  } catch (err) {
    showToast(err.message || t('testi.js.genericError'));
  } finally {
    submitBtn.disabled = false;
    submitBtn.textContent = t('testi.form.submit');
  }
}

document.addEventListener('DOMContentLoaded', () => {
  loadTestimonials();
  const form = document.getElementById('testiForm');
  if (form) form.addEventListener('submit', handleTestimonialSubmit);
});
