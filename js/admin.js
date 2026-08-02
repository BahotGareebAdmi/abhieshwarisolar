// ============================================================
// Admin panel: password-protected via Supabase Auth
// Only you (the account you create in Supabase) can log in.
// ============================================================

let sbAdmin = null;
function getAdminClient() {
  if (sbAdmin) return sbAdmin;
  if (typeof supabase === 'undefined' || SUPABASE_URL.startsWith('PASTE_')) return null;
  sbAdmin = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
  return sbAdmin;
}

function escapeHtml(str) {
  const div = document.createElement('div');
  div.textContent = str || '';
  return div.innerHTML;
}

async function checkSession() {
  const client = getAdminClient();
  if (!client) {
    document.getElementById('adminNotice').style.display = 'block';
    return;
  }
  const { data: { session } } = await client.auth.getSession();
  if (session) {
    showDashboard();
  } else {
    document.getElementById('loginBox').style.display = 'block';
  }
}

async function handleLogin(e) {
  e.preventDefault();
  const client = getAdminClient();
  if (!client) return;
  const email = document.getElementById('adminEmail').value.trim();
  const password = document.getElementById('adminPassword').value;
  const btn = document.getElementById('loginBtn');
  btn.disabled = true;
  btn.textContent = 'Signing in…';
  const { error } = await client.auth.signInWithPassword({ email, password });
  btn.disabled = false;
  btn.textContent = 'Sign in';
  if (error) {
    showToast('Login failed: ' + error.message);
    return;
  }
  showDashboard();
}

async function handleLogout() {
  const client = getAdminClient();
  await client.auth.signOut();
  location.reload();
}

function showDashboard() {
  document.getElementById('loginBox').style.display = 'none';
  document.getElementById('dashboard').style.display = 'block';
  loadAll();
  loadLeads();
}

function leadStatusPill(status) {
  if (status === 'done') return '<span class="status-pill status-approved">Done</span>';
  if (status === 'contacted') return '<span class="status-pill status-pending">Contacted</span>';
  return '<span class="status-pill status-pending">New</span>';
}

function leadRow(l) {
  return `
    <div class="card" data-id="${l.id}" style="margin-bottom:14px;">
      <div class="admin-row">
        <div>
          <div style="font-weight:700;">${escapeHtml(l.name)} · <span style="font-weight:400;color:var(--text-soft)">${escapeHtml(l.city)}</span></div>
          <div style="font-size:.82rem; color:var(--text-soft); margin:4px 0;">
            <a href="tel:${escapeHtml(l.phone)}">${escapeHtml(l.phone)}</a>${l.email ? ' · ' + escapeHtml(l.email) : ''}
          </div>
          ${l.message ? `<p style="margin:6px 0 0;">${escapeHtml(l.message)}</p>` : ''}
          <div style="font-size:.75rem; color:var(--text-soft); margin-top:6px;">${new Date(l.created_at).toLocaleString()}</div>
        </div>
        <div style="text-align:right;">
          ${leadStatusPill(l.status)}
          <div class="admin-actions" style="margin-top:10px;">
            ${l.status !== 'contacted' ? `<button class="btn btn-outline" data-lead-action="contacted">Mark contacted</button>` : ''}
            ${l.status !== 'done' ? `<button class="btn btn-green" data-lead-action="done">Mark done</button>` : ''}
            <button class="btn btn-outline" data-lead-action="delete">Delete</button>
          </div>
        </div>
      </div>
    </div>`;
}

async function loadLeads() {
  const client = getAdminClient();
  const list = document.getElementById('leadsList');
  list.innerHTML = 'Loading…';
  const { data, error } = await client
    .from('contact_submissions')
    .select('*')
    .order('created_at', { ascending: false });
  if (error) {
    list.innerHTML = 'Could not load leads: ' + escapeHtml(error.message);
    return;
  }
  if (!data || data.length === 0) {
    list.innerHTML = '<p>No contact form submissions yet.</p>';
    return;
  }
  list.innerHTML = data.map(leadRow).join('');
  list.querySelectorAll('button[data-lead-action]').forEach(btn => {
    btn.addEventListener('click', () => handleLeadAction(btn));
  });
}

async function handleLeadAction(btn) {
  const client = getAdminClient();
  const card = btn.closest('[data-id]');
  const id = card.getAttribute('data-id');
  const action = btn.getAttribute('data-lead-action');

  if (action === 'contacted') {
    await client.from('contact_submissions').update({ status: 'contacted' }).eq('id', id);
  } else if (action === 'done') {
    await client.from('contact_submissions').update({ status: 'done' }).eq('id', id);
  } else if (action === 'delete') {
    if (!confirm('Delete this lead permanently?')) return;
    await client.from('contact_submissions').delete().eq('id', id);
  }
  loadLeads();
}

function row(t) {
  const pill = t.status === 'approved'
    ? '<span class="status-pill status-approved">Approved</span>'
    : '<span class="status-pill status-pending">Pending</span>';
  const photo = t.photo_url ? `<img src="${t.photo_url}" alt="" style="width:64px;height:64px;object-fit:cover;border-radius:8px;">` : '';
  return `
    <div class="card" data-id="${t.id}" style="margin-bottom:14px;">
      <div class="admin-row">
        <div style="display:flex; gap:14px;">
          ${photo}
          <div>
            <div style="font-weight:700;">${escapeHtml(t.name)} · <span style="font-weight:400;color:var(--text-soft)">${escapeHtml(t.location)}</span></div>
            <div style="font-size:.82rem; color:var(--text-soft); margin:4px 0;">${escapeHtml(t.email || '')}</div>
            <p style="margin:6px 0 0;">${escapeHtml(t.message)}</p>
          </div>
        </div>
        <div style="text-align:right;">
          ${pill}
          <div class="admin-actions" style="margin-top:10px;">
            ${t.status !== 'approved' ? `<button class="btn btn-green" data-action="approve">Approve</button>` : `<button class="btn btn-outline" data-action="unapprove">Unpublish</button>`}
            <button class="btn btn-outline" data-action="delete">Delete</button>
          </div>
        </div>
      </div>
    </div>`;
}

async function loadAll() {
  const client = getAdminClient();
  const list = document.getElementById('adminList');
  list.innerHTML = 'Loading…';
  const { data, error } = await client
    .from('testimonials')
    .select('*')
    .order('created_at', { ascending: false });
  if (error) {
    list.innerHTML = 'Could not load testimonials: ' + escapeHtml(error.message);
    return;
  }
  if (!data || data.length === 0) {
    list.innerHTML = '<p>No testimonials submitted yet.</p>';
    return;
  }
  list.innerHTML = data.map(row).join('');
  list.querySelectorAll('button[data-action]').forEach(btn => {
    btn.addEventListener('click', () => handleAction(btn));
  });
}

async function handleAction(btn) {
  const client = getAdminClient();
  const card = btn.closest('[data-id]');
  const id = card.getAttribute('data-id');
  const action = btn.getAttribute('data-action');

  if (action === 'approve') {
    await client.from('testimonials').update({ status: 'approved' }).eq('id', id);
  } else if (action === 'unapprove') {
    await client.from('testimonials').update({ status: 'pending' }).eq('id', id);
  } else if (action === 'delete') {
    if (!confirm('Delete this testimonial permanently?')) return;
    await client.from('testimonials').delete().eq('id', id);
  }
  loadAll();
}

document.addEventListener('DOMContentLoaded', () => {
  checkSession();
  const loginForm = document.getElementById('loginForm');
  if (loginForm) loginForm.addEventListener('submit', handleLogin);
  const logoutBtn = document.getElementById('logoutBtn');
  if (logoutBtn) logoutBtn.addEventListener('click', handleLogout);
});
