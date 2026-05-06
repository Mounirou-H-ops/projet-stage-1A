/* ===== RH DATABASE APP ===== */

const COLORS = [
  'linear-gradient(135deg,#4f8ef7,#7c5ff7)',
  'linear-gradient(135deg,#00d4aa,#00a8c8)',
  'linear-gradient(135deg,#f75a5a,#f79a4f)',
  'linear-gradient(135deg,#f79a4f,#f7c74f)',
  'linear-gradient(135deg,#7c5ff7,#c85ff7)',
  'linear-gradient(135deg,#4fda8a,#4f8ef7)',
  'linear-gradient(135deg,#f75a9a,#7c5ff7)',
  'linear-gradient(135deg,#00c8f7,#4f8ef7)',
];

const SECTOR_ICONS = {
  'agroalimentaire': '🌾', 'automobile': '🚗', 'transport': '🚚', 'chimie': '⚗️',
  'textile': '🧵', 'énergie': '⚡', 'eau': '💧', 'construction': '🏗️',
  'informatique': '💻', 'banque': '🏦', 'assurance': '🛡️', 'hôtel': '🏨',
  'immobilier': '🏠', 'santé': '🏥', 'pharmacie': '💊', 'sécurité': '🔒',
  'aluminium': '🔩', 'emballage': '📦', 'tabac': '🚬', 'agriculture': '🌿',
  'électricité': '💡', 'plastique': '♻️', 'acier': '⚙️', 'bois': '🪵',
  'centre d\'appels': '📞', 'commerce': '🛒', 'formation': '📚',
};

function getSectorIcon(sector) {
  if (!sector) return '🏢';
  const s = sector.toLowerCase();
  for (const [key, icon] of Object.entries(SECTOR_ICONS)) {
    if (s.includes(key)) return icon;
  }
  return '🏢';
}

function getColor(str) {
  let hash = 0;
  for (let i = 0; i < str.length; i++) hash = str.charCodeAt(i) + ((hash << 5) - hash);
  return COLORS[Math.abs(hash) % COLORS.length];
}

function getInitials(name) {
  return name.replace(/[^A-Z0-9\u00C0-\u024F\s]/gi, '').split(' ').slice(0, 2).map(w => w[0] || '').join('').toUpperCase() || '?';
}

function escHtml(str) {
  if (!str) return '';
  return str.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
}

/* ===== STATE ===== */
let allRecords = [];
let filteredRecords = [];
let currentPage = 1;
const PAGE_SIZE = 24;
let currentView = 'list';
let isGridMode = true;

/* ===== DOM REFS ===== */
const searchInput   = document.getElementById('searchInput');
const searchClear   = document.getElementById('searchClear');
const filterCity    = document.getElementById('filterCity');
const filterSector  = document.getElementById('filterSector');
const filterEmail   = document.getElementById('filterEmail');
const btnReset      = document.getElementById('btnReset');
const btnExport     = document.getElementById('btnExport');
const cardsGrid     = document.getElementById('cardsGrid');
const pagination    = document.getElementById('pagination');
const resultCount   = document.getElementById('resultCount');
const modalOverlay  = document.getElementById('modalOverlay');
const modalClose    = document.getElementById('modalClose');
const statCompanies = document.getElementById('statCompanies');
const statContacts  = document.getElementById('statContacts');
const sidebar       = document.getElementById('sidebar');
const sidebarToggle = document.getElementById('sidebarToggle');
const mainContent   = document.getElementById('mainContent');
const cityGrid      = document.getElementById('cityGrid');
const sectorGrid    = document.getElementById('sectorGrid');
const viewGridBtn   = document.getElementById('viewGrid');
const viewListBtn   = document.getElementById('viewList');
const toast         = document.getElementById('toast');

/* ===== LOAD DATA ===== */
function loadData() {
  cardsGrid.innerHTML = '<div class="loading-spinner"><div class="spinner"></div>Chargement de la base de données…</div>';

  const json = window.RH_DATA;
  if (!json) {
    cardsGrid.innerHTML = `<div class="empty-state">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
      <h3>Données introuvables</h3>
      <p>Le fichier data.js n'a pas pu être chargé.</p>
    </div>`;
    return;
  }

  allRecords = json.records || [];

  // Populate filters
  const cities = [...new Set(allRecords.map(r => r.city).filter(Boolean))].sort();
  const rawSectors = [...new Set(allRecords.map(r => r.sector).filter(Boolean))].sort();
  const goodSectors = rawSectors.filter(s => s.length > 3 && !s.match(/^\d/) && !s.match(/^0[5-7]/));

  cities.forEach(c => {
    const opt = document.createElement('option');
    opt.value = c; opt.textContent = c;
    filterCity.appendChild(opt);
  });
  goodSectors.slice(0, 80).forEach(s => {
    const opt = document.createElement('option');
    opt.value = s; opt.textContent = s;
    filterSector.appendChild(opt);
  });

  // Stats
  const totalContacts = allRecords.reduce((a, r) => a + (r.contacts || []).length, 0);
  statCompanies.querySelector('.stat-num').textContent = allRecords.length.toLocaleString('fr');
  statContacts.querySelector('.stat-num').textContent = totalContacts.toLocaleString('fr');

  // Build city & sector views
  buildCityView(cities);
  buildSectorView(goodSectors);

  applyFilters();
}

/* ===== FILTER & SEARCH ===== */
function applyFilters() {
  const query = searchInput.value.trim().toLowerCase();
  const city   = filterCity.value;
  const sector = filterSector.value;
  const emailOnly = filterEmail.checked;

  filteredRecords = allRecords.filter(r => {
    if (city && r.city !== city) return false;
    if (sector && r.sector !== sector) return false;
    if (emailOnly) {
      const hasEmail = (r.contacts || []).some(c => c.email);
      if (!hasEmail) return false;
    }
    if (query) {
      const searchText = [
        r.company, r.group, r.city, r.sector,
        ...(r.contacts || []).flatMap(c => [c.name, c.title, c.email, c.tel])
      ].filter(Boolean).join(' ').toLowerCase();
      if (!searchText.includes(query)) return false;
    }
    return true;
  });

  currentPage = 1;
  renderCards();
}

/* ===== RENDER CARDS ===== */
function renderCards() {
  const total = filteredRecords.length;
  const totalPages = Math.ceil(total / PAGE_SIZE);
  const start = (currentPage - 1) * PAGE_SIZE;
  const pageRecords = filteredRecords.slice(start, start + PAGE_SIZE);

  resultCount.innerHTML = `<strong>${total.toLocaleString('fr')}</strong> entreprise${total > 1 ? 's' : ''} trouvée${total > 1 ? 's' : ''}`;

  if (total === 0) {
    cardsGrid.innerHTML = `<div class="empty-state" style="grid-column:1/-1">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
      <h3>Aucun résultat</h3>
      <p>Modifiez vos critères de recherche ou réinitialisez les filtres.</p>
    </div>`;
    pagination.innerHTML = '';
    return;
  }

  cardsGrid.className = 'cards-grid' + (isGridMode ? '' : ' list-mode');
  cardsGrid.innerHTML = pageRecords.map(r => cardHTML(r)).join('');

  // Bind card clicks
  cardsGrid.querySelectorAll('.card').forEach((el, i) => {
    el.addEventListener('click', () => openModal(pageRecords[i]));
  });

  renderPagination(totalPages);
}

function cardHTML(r) {
  const color = getColor(r.company);
  const initials = getInitials(r.company);
  const contacts = r.contacts || [];
  const preview = contacts.slice(0, 2);
  const hasEmail = contacts.some(c => c.email);

  const previewRows = preview.map(c => `
    <div class="contact-preview-row">
      <span class="contact-preview-name">${escHtml(c.name)}</span>
      ${c.email ? `<span class="contact-preview-email">${escHtml(c.email)}</span>` : ''}
    </div>
  `).join('');

  return `
  <div class="card" tabindex="0" role="button" aria-label="${escHtml(r.company)}">
    <div class="card-header">
      <div class="card-avatar" style="background:${color}">${initials}</div>
      <div class="card-company">
        <div class="card-company-name">${escHtml(r.company)}</div>
        ${r.group ? `<div class="card-company-group">Groupe : ${escHtml(r.group)}</div>` : ''}
      </div>
    </div>
    <div class="card-badges">
      ${r.city ? `<span class="badge badge-city">📍 ${escHtml(r.city)}</span>` : ''}
      ${r.sector && r.sector.length > 3 && !r.sector.match(/^\d/) ? `<span class="badge badge-sector">${escHtml(r.sector)}</span>` : ''}
      ${r.group ? `<span class="badge badge-group">${escHtml(r.group)}</span>` : ''}
    </div>
    ${contacts.length > 0 ? `
    <div class="card-contacts-preview">
      ${previewRows}
      ${contacts.length > 2 ? `<div style="font-size:0.75rem;color:var(--text3)">+${contacts.length - 2} autre${contacts.length - 2 > 1 ? 's' : ''}</div>` : ''}
    </div>` : ''}
    <div class="card-footer">
      <span class="card-count">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
        ${contacts.length} contact${contacts.length > 1 ? 's' : ''}
        ${hasEmail ? ' · <span style="color:var(--success)">✉ Email</span>' : ''}
      </span>
      <div class="card-arrow">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="9 18 15 12 9 6"/></svg>
      </div>
    </div>
  </div>`;
}

/* ===== PAGINATION ===== */
function renderPagination(totalPages) {
  if (totalPages <= 1) { pagination.innerHTML = ''; return; }
  const p = currentPage;
  let pages = [];

  pages.push(1);
  if (p > 3) pages.push('…');
  for (let i = Math.max(2, p - 1); i <= Math.min(totalPages - 1, p + 1); i++) pages.push(i);
  if (p < totalPages - 2) pages.push('…');
  if (totalPages > 1) pages.push(totalPages);

  pagination.innerHTML = `
    <button class="page-btn" id="pagePrev" ${p === 1 ? 'disabled' : ''}>‹ Préc.</button>
    ${pages.map(pg => pg === '…'
      ? `<span class="page-btn" style="cursor:default;border:none">…</span>`
      : `<button class="page-btn ${pg === p ? 'active' : ''}" data-page="${pg}">${pg}</button>`
    ).join('')}
    <button class="page-btn" id="pageNext" ${p === totalPages ? 'disabled' : ''}>Suiv. ›</button>
  `;

  document.getElementById('pagePrev')?.addEventListener('click', () => { currentPage--; renderCards(); window.scrollTo(0,0); });
  document.getElementById('pageNext')?.addEventListener('click', () => { currentPage++; renderCards(); window.scrollTo(0,0); });
  pagination.querySelectorAll('[data-page]').forEach(btn => {
    btn.addEventListener('click', () => { currentPage = +btn.dataset.page; renderCards(); window.scrollTo(0,0); });
  });
}

/* ===== MODAL ===== */
function openModal(r) {
  const color = getColor(r.company);
  const initials = getInitials(r.company);

  document.getElementById('modalIcon').style.background = color;
  document.getElementById('modalIcon').textContent = initials;
  document.getElementById('modalName').textContent = r.company;

  const cityEl = document.getElementById('modalCity');
  const secEl  = document.getElementById('modalSector');
  const grpEl  = document.getElementById('modalGroup');

  cityEl.textContent = r.city ? '📍 ' + r.city : '';
  cityEl.style.display = r.city ? '' : 'none';
  secEl.textContent = r.sector && r.sector.length > 3 ? r.sector : '';
  secEl.style.display = (r.sector && r.sector.length > 3) ? '' : 'none';
  grpEl.textContent = r.group ? '🏛 ' + r.group : '';
  grpEl.style.display = r.group ? '' : 'none';

  const contacts = r.contacts || [];
  if (contacts.length === 0) {
    document.getElementById('modalContacts').innerHTML = `<div class="empty-state" style="padding:40px"><p>Aucun contact enregistré.</p></div>`;
  } else {
    document.getElementById('modalContacts').innerHTML = contacts.map(c => contactCardHTML(c)).join('');
    // Bind copy buttons
    document.querySelectorAll('.contact-copy-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const val = btn.dataset.value;
        navigator.clipboard.writeText(val).then(() => showToast('Copié : ' + val));
      });
    });
  }

  modalOverlay.classList.add('open');
  document.body.style.overflow = 'hidden';
}

function contactCardHTML(c) {
  const fields = [];
  if (c.tel)     fields.push({ label: 'Téléphone', value: c.tel, icon: phoneIcon(), href: 'tel:' + c.tel.replace(/\s/g,'') });
  if (c.fax)     fields.push({ label: 'Fax', value: c.fax, icon: faxIcon() });
  if (c.gsm)     fields.push({ label: 'Mobile', value: c.gsm, icon: mobileIcon(), href: 'tel:' + c.gsm.replace(/\s/g,'') });
  if (c.email)   fields.push({ label: 'Email', value: c.email, icon: emailIcon(), href: 'mailto:' + c.email });
  if (c.address) fields.push({ label: 'Adresse', value: c.address, icon: addressIcon() });

  return `
  <div class="contact-card">
    <div class="contact-name">${escHtml(c.name)}</div>
    ${c.title ? `<div class="contact-title">${escHtml(c.title)}</div>` : ''}
    <div class="contact-fields">
      ${fields.map(f => `
        <div class="contact-field">
          <div class="contact-field-icon">${f.icon}</div>
          <div class="contact-field-info">
            <div class="contact-field-label">${f.label}</div>
            <div class="contact-field-value">
              ${f.href
                ? `<a href="${escHtml(f.href)}" target="_blank">${escHtml(f.value)}</a>`
                : escHtml(f.value)}
              ${(f.label !== 'Adresse') ? `<button class="contact-copy-btn" data-value="${escHtml(f.value)}" title="Copier">📋</button>` : ''}
            </div>
          </div>
        </div>
      `).join('')}
    </div>
  </div>`;
}

function closeModal() {
  modalOverlay.classList.remove('open');
  document.body.style.overflow = '';
}

/* ===== CITY VIEW ===== */
function buildCityView(cities) {
  const counts = {};
  allRecords.forEach(r => { if (r.city) counts[r.city] = (counts[r.city] || 0) + 1; });
  const max = Math.max(...Object.values(counts));

  const sorted = cities.filter(c => counts[c]).sort((a,b) => counts[b] - counts[a]);
  cityGrid.innerHTML = sorted.map(city => `
    <div class="city-card" data-city="${escHtml(city)}">
      <div class="city-name">${escHtml(city)}</div>
      <div class="city-count"><span>${counts[city] || 0}</span>entreprise${counts[city] > 1 ? 's' : ''}</div>
      <div class="city-bar"><div class="city-bar-fill" style="width:${((counts[city]||0)/max*100).toFixed(1)}%"></div></div>
    </div>
  `).join('');

  cityGrid.querySelectorAll('.city-card').forEach(el => {
    el.addEventListener('click', () => {
      filterCity.value = el.dataset.city;
      switchView('list');
      applyFilters();
    });
  });
}

/* ===== SECTOR VIEW ===== */
function buildSectorView(sectors) {
  const counts = {};
  allRecords.forEach(r => { if (r.sector && r.sector.length > 3) counts[r.sector] = (counts[r.sector]||0)+1; });

  const sorted = sectors.filter(s => counts[s]).sort((a,b) => counts[b] - counts[a]);
  sectorGrid.innerHTML = sorted.map(sec => `
    <div class="sector-card" data-sector="${escHtml(sec)}">
      <div class="sector-icon">${getSectorIcon(sec)}</div>
      <div class="sector-info">
        <div class="sector-name">${escHtml(sec)}</div>
        <div class="sector-count">${counts[sec] || 0} entreprise${counts[sec] > 1 ? 's' : ''}</div>
      </div>
    </div>
  `).join('');

  sectorGrid.querySelectorAll('.sector-card').forEach(el => {
    el.addEventListener('click', () => {
      filterSector.value = el.dataset.sector;
      switchView('list');
      applyFilters();
    });
  });
}

/* ===== EXPORT CSV ===== */
function exportCSV() {
  const rows = [['Entreprise','Groupe','Ville','Secteur','Nom','Titre','Téléphone','Fax','Mobile','Email','Adresse']];
  filteredRecords.forEach(r => {
    const contacts = r.contacts || [];
    if (contacts.length === 0) {
      rows.push([r.company, r.group, r.city, r.sector, '', '', '', '', '', '', '']);
    } else {
      contacts.forEach(c => {
        rows.push([r.company, r.group, r.city, r.sector, c.name, c.title, c.tel, c.fax, c.gsm, c.email, c.address]);
      });
    }
  });

  const csv = rows.map(row => row.map(cell => `"${(cell||'').replace(/"/g,'""')}"`).join(',')).join('\n');
  const blob = new Blob(['\ufeff' + csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a'); a.href = url;
  a.download = `RH_DataBase_${new Date().toISOString().slice(0,10)}.csv`;
  a.click(); URL.revokeObjectURL(url);
  showToast(`✅ ${filteredRecords.length} entreprises exportées`);
}

/* ===== VIEW SWITCHING ===== */
function switchView(view) {
  currentView = view;
  document.querySelectorAll('.nav-item').forEach(el => {
    el.classList.toggle('active', el.dataset.view === view);
  });
  document.querySelectorAll('.view-panel').forEach(el => {
    el.classList.toggle('active', el.id === `view${view.charAt(0).toUpperCase()+view.slice(1)}-panel`);
  });
}

/* ===== TOAST ===== */
let toastTimer;
function showToast(msg) {
  toast.textContent = msg;
  toast.classList.add('show');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => toast.classList.remove('show'), 2500);
}

/* ===== SVG ICONS ===== */
function phoneIcon() { return `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.69 12 19.79 19.79 0 0 1 1.63 3.18 2 2 0 0 1 3.6 1h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L7.91 8.64a16 16 0 0 0 6 6l.96-.97a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92z"/></svg>`; }
function faxIcon() { return `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="22 17 22 11 16 11"/><path d="M21.73 9.73 2.77 9.73"/><path d="M2 17l0-6a2 2 0 0 1 2-2h4l4-4h4a2 2 0 0 1 2 2v4"/></svg>`; }
function mobileIcon() { return `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="5" y="2" width="14" height="20" rx="2" ry="2"/><line x1="12" y1="18" x2="12.01" y2="18"/></svg>`; }
function emailIcon() { return `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg>`; }
function addressIcon() { return `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>`; }

/* ===== EVENT LISTENERS ===== */
searchInput.addEventListener('input', () => {
  searchClear.classList.toggle('visible', searchInput.value.length > 0);
  applyFilters();
});
searchClear.addEventListener('click', () => {
  searchInput.value = ''; searchClear.classList.remove('visible'); applyFilters();
});
filterCity.addEventListener('change', applyFilters);
filterSector.addEventListener('change', applyFilters);
filterEmail.addEventListener('change', applyFilters);
btnReset.addEventListener('click', () => {
  searchInput.value = ''; filterCity.value = ''; filterSector.value = '';
  filterEmail.checked = false; searchClear.classList.remove('visible');
  applyFilters(); showToast('Filtres réinitialisés');
});
btnExport.addEventListener('click', exportCSV);
modalClose.addEventListener('click', closeModal);
modalOverlay.addEventListener('click', e => { if (e.target === modalOverlay) closeModal(); });
document.addEventListener('keydown', e => { if (e.key === 'Escape') closeModal(); });

sidebarToggle.addEventListener('click', () => {
  sidebar.classList.toggle('collapsed');
  mainContent.classList.toggle('sidebar-collapsed');
});

document.querySelectorAll('.nav-item').forEach(btn => {
  btn.addEventListener('click', () => switchView(btn.dataset.view));
});

viewGridBtn.addEventListener('click', () => {
  isGridMode = true;
  viewGridBtn.classList.add('active'); viewListBtn.classList.remove('active');
  renderCards();
});
viewListBtn.addEventListener('click', () => {
  isGridMode = false;
  viewListBtn.classList.add('active'); viewGridBtn.classList.remove('active');
  renderCards();
});

/* ===== KEYBOARD NAV ===== */
cardsGrid.addEventListener('keydown', e => {
  if (e.key === 'Enter' || e.key === ' ') {
    e.preventDefault();
    const card = e.target.closest('.card');
    if (card) card.click();
  }
});

/* ===== INIT ===== */
loadData();
