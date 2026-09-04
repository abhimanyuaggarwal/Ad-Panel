// views-keys-list.js — the Integrations LIST: the table, its filters (search, pills,
// the tri-state Breaks grid), paging, row selection, the bulk bar, and the cohort write
// helpers (bulkApplyDirect / refreshKeysList) every bulk sheet applies through.
// Load order: after views-setups*.js (it reads setupSummary at runtime), before
// views-keys-bulk.js and views-keys-form.js. Everything here is a global by design —
// the panel is a no-build page of plain scripts (see panel/README.md).

// views-keys.js — the PRODUCT ROOM: integration list (filters + bulk) and the editor.
//
// TWO ROOMS (24 Aug, AD-SETUP-SCOPE). The one rule, in three parts: ad ops supply WHAT
// can fill (the Ad Setup, in their own room), the integration says WHETHER it runs (its
// switches, here), and its PLAYER says how the surface behaves (here). How ADS behave
// belongs to the ad setup's placement (25 Aug) — shown here as fact, edited there.
//
// This screen never holds a ladder. Every demand fact on it is COUNTED from the setup
// the section resolves to — "3 rungs behind it" — and the ladder itself is one
// read-only click away.

// `brk` is per break — { preroll: 'on' | 'off', … } — and only holds the breaks
// actually being asked about. On air / player configs / modified were cut (3 Sep).
const KF = { q: '', property: 'all', platform: 'all', brk: {}, setup: 'all' };
const KPAGE = { page: 0, size: 50 };
let KEYS_CACHE = [];
let KL_META = null;
let SETUPS_CACHE = [];

// Jump from a setup's "fills N integrations" banner to the list, pre-filtered.
function viewKeysUsing(kind, id) {
  KF[kind] = id;
  location.hash = '#keys';
  if (location.hash === '#keys') route();
}
const KSEL = new Set(); // selected key ids for bulk actions

async function viewKeysList() {
  KEY_RETURN = null;
  FILTER_CTX = { state: KF, repaint: () => { resetPageAndSelection(); repaintKeyRows(); } };
  const main = document.getElementById('main');
  const [{ keys }, meta, { setups }] = await Promise.all([
    API.listKeys(), getMeta(), API.listSetups(),
  ]);
  KEYS_CACHE = keys;
  SETUPS_CACHE = setups;
  KL_META = meta;

  const pill = (name, labelText, options) => filterPillHtml(name, labelText, [{ v: 'all', label: `All ${labelText.toLowerCase()}` }, ...options]);

  // Toolbar paints once — filters repaint rows only, so the search caret survives.
  main.innerHTML = `
    <div class="page-head">
      <div>
        <h1>Integrations</h1>
        <div class="page-sub">One per property and platform.</div>
      </div>
      <button class="btn" onclick="newIntegrationChooser()">New integration</button>
    </div>
    <div class="filter-bar">
      <input class="search" placeholder="Search integrations…" value="${esc(KF.q)}"
        oninput="KF.q = this.value; resetPageAndSelection(); repaintKeyRows()">
      ${window.GLOBAL_PROP === 'All' ? pill('property', 'Properties', meta.properties.map(v => ({ v, label: v }))) : ''}
      ${pill('platform', 'Platforms', meta.platforms.map(v => ({ v, label: label('platform', v) })))}
      ${breakFilterHtml()}
      ${pill('setup', 'Ad setup', setups.filter(x => inScope(x.property)).map(x => ({ v: x.id, label: x.name })))}
      <span style="flex:1"></span>
      <div id="pager" class="pager"></div>
    </div>
    <div id="bulk-bar" class="bulk-bar" style="display:none">
      <span id="bulk-count"></span>
      <span id="sel-scope" class="sel-scope"></span>
      <span style="flex:1"></span>
      <span class="bulk-verb">Change</span>
      <button class="btn small" onclick="bulkEditJourney()">Ad behaviour</button>
      <button class="btn small" onclick="defaultConfigJourney()"
        title="Set the default player behaviour — playback mode, MiniTV, autoplay — on every selected integration at once">Default player behaviour</button>
      <button class="btn small" onclick="playerBehaviourJourney()"
        title="Walk each selected integration's configs — the default and every named custom fork">Custom player behaviour</button>
      <button class="btn ghost small" onclick="clearKeySelection()">Clear</button>
    </div>
    <div class="card">
      <table class="t-keys">
      <thead><tr>
        <th class="chk"><input type="checkbox" id="chk-all" title="Select everything on this page" onclick="toggleAllKeys(this)"></th>
        <th>Integration</th><th>Property</th><th>Platform</th><th>Active breaks</th><th>Status</th><th>Modified</th>
      </tr></thead>
      <tbody id="key-rows"></tbody>
    </table></div>`;
  repaintKeyRows();
  updateBulkBar();
}

// ---------- filter pills ----------

// Which list the filter pills belong to right now — { state, repaint }. Set by each
// list view as it paints; the pills never hardcode a list again (2 Sep, setups grew
// the same toolbar).
let FILTER_CTX = null;

function filterPillHtml(name, labelText, options) {
  const cur = FILTER_CTX.state[name];
  const active = cur !== 'all';
  const curLabel = active ? (options.find(o => o.v === cur)?.label ?? cur) : labelText;
  return `
    <div class="fpill ${active ? 'on' : ''}" id="fp-${name}">
      <button class="fpill-btn" onclick="fpillToggle(event, this)">${esc(curLabel)} <span class="fp-chev">▾</span></button>
      <div class="fpill-menu">${options.map(o =>
        `<div class="sel-opt ${o.v === cur ? 'on' : ''}" data-v="${esc(o.v)}" data-l="${esc(o.label)}" onclick="fpillPick('${name}', '${labelText}', this)">${esc(o.label)}${o.counted ? '<span class="fp-count"></span>' : ''}</div>`).join('')}
      </div>
    </div>`;
}

// THE BREAKS FILTER (3 Sep, user call — "more mature"). It used to be one flat list of
// eight combinations (Pre-roll on, Pre-roll off, Mid-roll on, …) that could only answer
// about ONE break at a time — the shape gets worse with every break added, and it cannot
// ask the question ops actually ask ("running mid-roll but no post-roll"). It is now a
// small grid: one row per break, each Any / On / Off. One pill, one concept, four
// independent answers, and it wears the same words the Active breaks column does.
function breakFilterHtml() {
  const row = t => `
    <div class="fp-grow" data-t="${t}">
      <span class="fp-gl">${esc(label('slotType', t))}</span>
      <div class="seg small fp-gseg">${['any', 'on', 'off'].map(v =>
        `<button type="button" class="${(KF.brk[t] || 'any') === v ? 'on' : ''}" data-v="${v}"
          onclick="brkSet('${t}', '${v}')">${v === 'any' ? 'Any' : v === 'on' ? 'On' : 'Off'}</button>`).join('')}</div>
    </div>`;
  return `
    <div class="fpill" id="fp-brk">
      <button class="fpill-btn" onclick="fpillToggle(event, this)">Breaks <span class="fp-chev">▾</span></button>
      <div class="fpill-menu fp-grid">
        ${KL_META.slotTypes.map(row).join('')}
        <div class="fp-gfoot"><button type="button" class="zlink" onclick="brkClearAll()">Clear</button></div>
      </div>
    </div>`;
}

function brkSet(t, v) {
  if (v === 'any') delete KF.brk[t]; else KF.brk[t] = v;
  const r = document.querySelector(`.fp-grow[data-t="${t}"]`);
  if (r) r.querySelectorAll('button').forEach(b => b.classList.toggle('on', b.dataset.v === (KF.brk[t] || 'any')));
  paintBreakPill();
  resetPageAndSelection();
  repaintKeyRows();
}

function brkClearAll() {
  for (const t of Object.keys(KF.brk)) delete KF.brk[t];
  document.querySelectorAll('.fp-grow').forEach(r =>
    r.querySelectorAll('button').forEach(b => b.classList.toggle('on', b.dataset.v === 'any')));
  paintBreakPill();
  resetPageAndSelection();
  repaintKeyRows();
}

// The pill says what it is filtering without opening it — two answers spelled out, more
// than two counted. The bar paints once, so this is written in place.
function paintBreakPill() {
  const pill = document.getElementById('fp-brk');
  if (!pill) return;
  // Break order, not the order they were clicked — the label reads like the column.
  const set = KL_META.slotTypes.filter(t => KF.brk[t]).map(t => [t, KF.brk[t]]);
  pill.classList.toggle('on', set.length > 0);
  const word = !set.length ? 'Breaks'
    : set.length <= 2 ? set.map(([t, v]) => `${label('slotShort', t)} ${v}`).join(', ')
    : `${set.length} breaks set`;
  pill.querySelector('.fpill-btn').innerHTML = `${esc(word)} <span class="fp-chev">▾</span>`;
}

function fpillToggle(e, btn) {
  e.stopPropagation();
  const el = btn.parentElement;
  document.querySelectorAll('.fpill.open').forEach(o => { if (o !== el) o.classList.remove('open'); });
  el.classList.toggle('open');
}

function resetPageAndSelection() {
  KPAGE.page = 0;
  if (KSEL.size) {
    KSEL.clear();
    updateBulkBar();
  }
}

function fpillPick(name, labelText, opt) {
  if (opt.classList.contains('off')) return;
  const v = opt.dataset.v;
  FILTER_CTX.state[name] = v;
  const pill = opt.closest('.fpill');
  pill.classList.remove('open');
  pill.classList.toggle('on', v !== 'all');
  pill.querySelector('.fpill-btn').innerHTML = `${esc(v === 'all' ? labelText : opt.dataset.l)} <span class="fp-chev">▾</span>`;
  pill.querySelectorAll('.sel-opt').forEach(o => o.classList.toggle('on', o === opt));
  FILTER_CTX.repaint();
}


function keyMatches(k) {
  if (window.GLOBAL_PROP !== 'All' && k.property !== window.GLOBAL_PROP) return false;
  if (KF.property !== 'all' && k.property !== KF.property) return false;
  if (KF.platform !== 'all' && k.platform !== KF.platform) return false;
  if (KF.setup !== 'all' && k.adSetupId !== KF.setup) return false;
  // Every break asked about must answer — "running mid-roll AND not running post-roll"
  // is one filter, not two visits.
  for (const [t, want] of Object.entries(KF.brk)) {
    const anyOn = k.slotsOn ? !!k.slotsOn[t] : k.sections.some(sec => sec.slots[t]?.on);
    if (want === 'on' ? !anyOn : anyOn) return false;
  }
  if (!matchesPrefix(KF.q, k.name)) return false;
  return true;
}

// Which units this integration actually runs — the fact the list is scanned for.
function slotChipsHtml(k) {
  let last = null;
  const out = [];
  for (const t of KL_META.slotTypes) {
    const fam = slotFamily(t);
    if (last && fam !== last) out.push('<span class="uchip-split" title="video units | display units"></span>');
    last = fam;
    out.push(`<span class="uchip ${k.slotsOn[t] ? 'on' : ''}" title="${esc(label('slotType', t))} — ${esc(label('tagType', fam))}, ${k.slotsOn[t] ? 'active' : 'inactive'}">${esc(label('slotShort', t))}</span>`);
  }
  return `<span class="uchips">${out.join('')}</span>`;
}

function filteredKeys() { return KEYS_CACHE.filter(keyMatches); }

function pagedKeys() {
  const all = filteredKeys();
  const start = KPAGE.page * KPAGE.size;
  return all.slice(start, start + KPAGE.size);
}

function gotoPage(delta) {
  const pages = Math.max(1, Math.ceil(filteredKeys().length / KPAGE.size));
  KPAGE.page = Math.min(pages - 1, Math.max(0, KPAGE.page + delta));
  repaintKeyRows();
}

function repaintKeyRows() {
  const all = filteredKeys();
  const pages = Math.max(1, Math.ceil(all.length / KPAGE.size));
  if (KPAGE.page > pages - 1) KPAGE.page = pages - 1;
  const rows = pagedKeys();
  const tbody = document.getElementById('key-rows');
  if (!tbody) return;
  paintPager(all.length);
  if (!rows.length) {
    tbody.innerHTML = `<tr><td colspan="7"><div class="empty">No integrations match — clear a filter or create one.</div></td></tr>`;
    paintSelBanner();
    return;
  }
  tbody.innerHTML = rows.map(k => `
    <tr class="rowlink" onclick="location.hash = '#keys/${k.id}'">
      <td class="chk" onclick="event.stopPropagation()">
        <input type="checkbox" ${KSEL.has(k.id) ? 'checked' : ''} onclick="toggleKeySel('${k.id}', this)">
      </td>
      <td>
        <div class="cell-main">${esc(k.name)}</div>
      </td>
      <td>${propCell(k.property)}</td>
      <td class="cell-plain">${esc(label('platform', k.platform))}</td>
      <td>${slotChipsHtml(k)}</td>
      <td>${statusCellHtml(k)}</td>
      <td>
        <div class="cell-plain" style="font-weight:600">${esc(k.updatedBy || '—')}</div>
        <div class="cell-sub">${relWhen(k.updatedAt)}</div>
      </td>
    </tr>`).join('');
  const box = document.getElementById('chk-all');
  if (box) box.checked = rows.length > 0 && rows.every(k => KSEL.has(k.id));
  paintSelBanner();
}

function paintPager(total) {
  const el = document.getElementById('pager');
  if (!el) return;
  if (!total) { el.innerHTML = ''; return; }
  const from = KPAGE.page * KPAGE.size + 1;
  const to = Math.min(total, (KPAGE.page + 1) * KPAGE.size);
  const pages = Math.ceil(total / KPAGE.size);
  el.innerHTML = `
    <span class="pg-range">${from}–${to} of ${total}</span>
    <button class="pg-btn" ${KPAGE.page === 0 ? 'disabled' : ''} title="Newer" onclick="gotoPage(-1)">‹</button>
    <button class="pg-btn" ${KPAGE.page >= pages - 1 ? 'disabled' : ''} title="Older" onclick="gotoPage(1)">›</button>`;
}

// The Gmail move: selecting the page tells you it selected only the page, and offers
// the rest of the matching set as one explicit act.
function paintSelBanner() {
  const el = document.getElementById('sel-scope');
  if (!el) return;
  const all = filteredKeys();
  const page = pagedKeys();
  const pageAllSelected = page.length > 0 && page.every(k => KSEL.has(k.id));
  const allSelected = all.length > 0 && all.every(k => KSEL.has(k.id));
  if (!pageAllSelected || all.length <= page.length) { el.innerHTML = ''; return; }
  el.innerHTML = allSelected
    ? `<button onclick="selectPageOnly()">Select just this page</button>`
    : `<button onclick="selectAllMatching()">Select all ${all.length} that match these filters</button>`;
}

function selectAllMatching() {
  for (const k of filteredKeys()) KSEL.add(k.id);
  repaintKeyRows();
  updateBulkBar();
}

function selectPageOnly() {
  const page = new Set(pagedKeys().map(k => k.id));
  for (const id of [...KSEL]) if (!page.has(id)) KSEL.delete(id);
  repaintKeyRows();
  updateBulkBar();
}

// ---------- bulk selection ----------

function toggleKeySel(id, box) {
  if (box.checked) KSEL.add(id); else KSEL.delete(id);
  const page = pagedKeys();
  const head = document.getElementById('chk-all');
  if (head) head.checked = page.length > 0 && page.every(k => KSEL.has(k.id));
  paintSelBanner();
  updateBulkBar();
}

// This page only — the rest of the matching set is a separate, explicit act.
function toggleAllKeys(box) {
  for (const k of pagedKeys()) box.checked ? KSEL.add(k.id) : KSEL.delete(k.id);
  document.querySelectorAll('#key-rows .chk input').forEach(c => { c.checked = box.checked; });
  paintSelBanner();
  updateBulkBar();
}

function clearKeySelection() {
  KSEL.clear();
  document.querySelectorAll('.chk input').forEach(c => { c.checked = false; });
  paintSelBanner();
  updateBulkBar();
}

function updateBulkBar() {
  const bar = document.getElementById('bulk-bar');
  if (!bar) return;
  bar.style.display = KSEL.size ? 'flex' : 'none';
  const count = document.getElementById('bulk-count');
  if (count) count.textContent = `${KSEL.size} integration${KSEL.size > 1 ? 's' : ''} selected`;
  paintSelBanner();
}

function selectedKeys() {
  return [...KSEL].map(id => KEYS_CACHE.find(k => k.id === id)).filter(Boolean);
}

async function bulkApplyDirect(action, value, doneNote) {
  try {
    const { changed, unchanged, refused, skipped } = await API.bulkKeys({ ids: [...KSEL], action, value });
    toast(`${doneNote} — ${changed} changed${unchanged ? `, ${unchanged} already there` : ''}`);
    if (refused?.length) {
      const why = action === 'slotOn' ? 'their ad setup carries no demand for it'
        : action === 'slotOff' ? 'it is the only unit they run'
        : action === 'driveFields' ? 'their setup carries none of that company — the decision could not run there'
        : 'the change would leave them with nothing live';
      const names = refused.slice(0, 3).join(', ') + (refused.length > 3 ? ` and ${refused.length - 3} more` : '');
      toast(`Skipped ${names} — ${why}`, 'warn');
    }
    if (skipped?.length) {
      const names = skipped.slice(0, 3).join(', ') + (skipped.length > 3 ? ` and ${skipped.length - 3} more` : '');
      toast(`Left alone (no demand there): ${names}`, 'warn');
    }
    return true;
  } catch (e) {
    toast(e.message, 'bad');
    return false;
  }
}

async function refreshKeysList() {
  const { keys } = await API.listKeys();
  KEYS_CACHE = keys;
  clearKeySelection();
  repaintKeyRows();
}

