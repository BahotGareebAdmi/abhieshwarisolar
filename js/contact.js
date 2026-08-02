// ============================================================
// Contact form: submits directly to Supabase (contact_submissions table)
// Requires the same Supabase project used for testimonials (js/config.js)
// ============================================================

let sbContact = null;
function getContactClient() {
  if (sbContact) return sbContact;
  if (typeof supabase === 'undefined' || SUPABASE_URL.startsWith('PASTE_')) return null;
  sbContact = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
  return sbContact;
}

async function handleContactSubmit(e) {
  e.preventDefault();
  const form = e.target;
  const submitBtn = form.querySelector('button[type="submit"]');

  // Honeypot: bots fill hidden fields, humans don't
  if (form['bot-field'].value.trim() !== '') return;

  // Basic client-side rate limit: 1 submission per 60 seconds per browser
  const last = Number(localStorage.getItem('as-contact-last') || 0);
  if (Date.now() - last < 60000) {
    showToast('Please wait a moment before submitting again.');
    return;
  }

  const client = getContactClient();
  if (!client) {
    showToast('Form backend not connected yet, see README.md.');
    return;
  }

  const name = form.name.value.trim();
  const phone = form.phone.value.trim();
  const email = form.email.value.trim();
  const city = form.city.value.trim();
  const message = form.message.value.trim();

  if (!name || !phone || !city) {
    showToast('Please fill in your name, phone number, and city.');
    return;
  }

  submitBtn.disabled = true;
  submitBtn.textContent = 'Sending…';

  try {
    const { error } = await client.from('contact_submissions').insert({
      name, phone, email, city, message
    });
    if (error) throw error;

    localStorage.setItem('as-contact-last', String(Date.now()));
    window.location.href = 'thanks.html';
  } catch (err) {
    showToast(err.message || 'Something went wrong, please try again or call us directly.');
    submitBtn.disabled = false;
    submitBtn.textContent = 'Request a free site visit';
  }
}

document.addEventListener('DOMContentLoaded', () => {
  const pre = localStorage.getItem('as-prefill-message');
  const field = document.getElementById('message');
  if (pre && field) {
    field.value = pre;
    localStorage.removeItem('as-prefill-message');
  }

  const form = document.getElementById('contactForm');
  if (form) form.addEventListener('submit', handleContactSubmit);
});
