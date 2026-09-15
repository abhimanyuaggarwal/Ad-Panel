// views-keys-list.js — the Integrations LIST (the product room's front door): the table,
// its filters (search, pills, the tri-state Breaks grid), paging, row selection, the bulk
// bar, and the cohort write helpers (bulkApplyDirect / refreshKeysList) every bulk sheet
// applies through. Also owns the list-level caches (KEYS_CACHE, SETUPS_CACHE, KL_META).
// Load order: after views-setups*.js (it reads setupSummary at runtime), before the
// views-keys-* files. Everything here is a global by design (see ARCHITECTURE.md).
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

// A SELECTION SURVIVES ITS FILTER (8 Sep, user call). Changing a filter used to empty
// the selection — so a cohort assembled out of two searches was impossible, and the work
// vanished without a word. Selection now carries: when the filters move, everything
// selected is PINNED to the top of the table (checked, above the new matches) so it is
// never out of sight, and the bulk bar keeps counting it. KPIN is that carried-over set —
// snapshotted on every filter change, never on a checkbox, so ticking a row in the list
// does not make it jump. Unticking a pinned row drops it out of the block, which is the
// only way rows leave it besides Clear.
const KPIN = new Set();
const KPIN_MAX = 8;   // a carried cohort can be hundreds — show the head, offer the rest
let KPIN_OPEN = false;

async function viewKeysList() {
  KEY_RETURN = null;
  // A journey's audience belongs to the journey. Painting the list means none is open — so a
  // set left behind by a navigation cannot answer for a later one.
  bulkWhoClose();
  FILTER_CTX = { state: KF, repaint: () => { keyFiltersChanged(); repaintKeyRows(); } };
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
        oninput="KF.q = this.value; keyFiltersChanged(); repaintKeyRows()">
      ${pill('property', 'Properties', meta.properties.map(v => ({ v, label: v })))}
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
      <button class="btn small" onclick="playerBehaviourJourney()">Player behaviour</button>
      <button class="btn ghost small" onclick="clearKeySelection()">Clear</button>
    </div>
    <div class="card">
      <table class="t-keys">
      <thead><tr>
        <th class="chk"><input type="checkbox" id="chk-all" onclick="toggleAllKeys(this)"></th>
        <th>Integration</th><th>Property</th><th>Platform</th><th>Active breaks</th><th>Modified</th><th>Status</th>
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
  keyFiltersChanged();
  repaintKeyRows();
}

function brkClearAll() {
  for (const t of Object.keys(KF.brk)) delete KF.brk[t];
  document.querySelectorAll('.fp-grow').forEach(r =>
    r.querySelectorAll('button').forEach(b => b.classList.toggle('on', b.dataset.v === 'any')));
  paintBreakPill();
  keyFiltersChanged();
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

// Every filter, the search and the breaks grid land here: page back to the first,
// selection kept and carried to the top.
function keyFiltersChanged() {
  KPAGE.page = 0;
  KPIN_OPEN = false;
  for (const id of KSEL) KPIN.add(id);
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
  if (!inScope(k.property)) return false;
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
  return slotChipRowHtml(t => (k.slotsOn[t] ? 'on' : ''));
}

function filteredKeys() { return KEYS_CACHE.filter(keyMatches); }

// The carried-over cohort, in list order — kept in scope, and honest about rows the
// world may have dropped under it.
function pinnedKeys() { return KEYS_CACHE.filter(k => KPIN.has(k.id) && inScope(k.property)); }

// What the pager walks: the matches, minus the ones already standing at the top. A row
// is never in both blocks, so no count is ever paid twice.
function listedKeys() { return filteredKeys().filter(k => !KPIN.has(k.id)); }

function pagedKeys() {
  const all = listedKeys();
  const start = KPAGE.page * KPAGE.size;
  return all.slice(start, start + KPAGE.size);
}

function gotoPage(delta) {
  const pages = Math.max(1, Math.ceil(listedKeys().length / KPAGE.size));
  KPAGE.page = Math.min(pages - 1, Math.max(0, KPAGE.page + delta));
  repaintKeyRows();
}

function showAllPinned() { KPIN_OPEN = true; repaintKeyRows(); }

function repaintKeyRows() {
  const all = listedKeys();
  const pages = Math.max(1, Math.ceil(all.length / KPAGE.size));
  if (KPAGE.page > pages - 1) KPAGE.page = pages - 1;
  const rows = pagedKeys();
  const tbody = document.getElementById('key-rows');
  if (!tbody) return;
  paintPager(all.length);

  // THE TWO BLOCKS. With nothing carried over — the ordinary case, and every first
  // visit — this is exactly the table it always was: no group rows, no chrome.
  const pinned = pinnedKeys();
  const shown = KPIN_OPEN ? pinned : pinned.slice(0, KPIN_MAX);
  const head = pinned.length
    ? groupRowHtml('Selected', pinned.length)   // a group line counts ITS OWN rows — the bar counts the cohort
      + shown.map(keyRowHtml).join('')
      + (pinned.length > shown.length
        ? `<tr class="grp-more"><td colspan="7"><button type="button" class="zlink"
             onclick="showAllPinned()">Show all ${pinned.length} selected</button></td></tr>`
        : '')
      + groupRowHtml('Matching', all.length)
    : '';
  tbody.innerHTML = head + (rows.length
    ? rows.map(keyRowHtml).join('')
    : `<tr><td colspan="7"><div class="empty">${pinned.length
        ? 'Nothing else matches — the selected are still above.'
        : 'No integrations match — clear a filter or create one.'}</div></td></tr>`);

  const box = document.getElementById('chk-all');
  if (box) box.checked = rows.length > 0 && rows.every(k => KSEL.has(k.id));
  paintSelBanner();
}

// A block's own thin line: what these rows are, and how many. Micro-label, no sentence.
function groupRowHtml(word, n) {
  return `<tr class="grp"><td colspan="7"><span class="grp-l">${esc(word)}</span><span class="grp-n">${n}</span></td></tr>`;
}

function keyRowHtml(k) {
  return `
    <tr class="rowlink ${KPIN.has(k.id) ? 'pinned' : ''}" onclick="location.hash = '#keys/${k.id}'">
      <td class="chk" onclick="event.stopPropagation()">
        <input type="checkbox" ${KSEL.has(k.id) ? 'checked' : ''} onclick="toggleKeySel('${k.id}', this)">
      </td>
      <td>
        <div class="cell-main">${esc(k.name)}</div>
        <button type="button" class="kcopy" aria-label="Copy API key"
          onclick="event.stopPropagation(); copyText('${esc(k.key)}', 'API key copied')"
        ><span class="mono">${esc(k.key)}</span><svg viewBox="0 0 14 14" width="11" height="11" fill="none"
            stroke="currentColor" stroke-width="1.4" aria-hidden="true"><rect x="4.4" y="4.4" width="8.2"
            height="8.2" rx="1.6"/><path d="M9.9 4.4V2.7a1.2 1.2 0 0 0-1.2-1.2H2.6a1.2 1.2 0 0 0-1.2 1.2v6.1a1.2
            1.2 0 0 0 1.2 1.2h1.8"/></svg></button>
      </td>
      <td>${propCell(k.property)}</td>
      <td class="cell-plain">${esc(label('platform', k.platform))}</td>
      <td>${slotChipsHtml(k)}</td>
      <td>
        <div class="cell-plain" style="font-weight:600">${esc(k.updatedBy || '—')}</div>
        <div class="cell-sub">${relWhen(k.updatedAt)}</div>
      </td>
      <td>${statusCellHtml(k)}</td>
    </tr>`;
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
    <button class="pg-btn" ${KPAGE.page === 0 ? 'disabled' : ''} onclick="gotoPage(-1)">‹</button>
    <button class="pg-btn" ${KPAGE.page >= pages - 1 ? 'disabled' : ''} onclick="gotoPage(1)">›</button>`;
}

// The Gmail move: selecting the page tells you it selected only the page, and offers
// the rest of the matching set as one explicit act. It counts the carried block too —
// an offer to select rows that are already selected is not an offer.
function paintSelBanner() {
  const el = document.getElementById('sel-scope');
  if (!el) return;
  const all = filteredKeys();
  const page = pagedKeys();
  const pageAllSelected = page.length > 0 && page.every(k => KSEL.has(k.id));
  const rest = all.filter(k => !KSEL.has(k.id)).length;
  if (!pageAllSelected) { el.innerHTML = ''; return; }
  el.innerHTML = rest
    ? `<button onclick="selectAllMatching()">Select all ${all.length} that match these filters</button>`
    : all.length > page.length
      ? `<button onclick="selectPageOnly()">Select just this page</button>`
      : '';
}

function selectAllMatching() {
  for (const k of filteredKeys()) KSEL.add(k.id);
  repaintKeyRows();
  updateBulkBar();
}

function selectPageOnly() {
  const keep = new Set([...pagedKeys(), ...pinnedKeys()].map(k => k.id));
  for (const id of [...KSEL]) if (!keep.has(id)) KSEL.delete(id);
  repaintKeyRows();
  updateBulkBar();
}

// ---------- bulk selection ----------

function toggleKeySel(id, box) {
  if (box.checked) KSEL.add(id); else KSEL.delete(id);
  // Ticking never moves a row (the block is snapshotted on filter changes only), but
  // UNticking a carried row is a way out of the block — it drops back among the matches
  // if it belongs there, and off the screen if it does not.
  if (!box.checked && KPIN.has(id)) {
    KPIN.delete(id);
    if (!KPIN.size) KPIN_OPEN = false;
    repaintKeyRows();
    updateBulkBar();
    return;
  }
  const page = pagedKeys();
  const head = document.getElementById('chk-all');
  if (head) head.checked = page.length > 0 && page.every(k => KSEL.has(k.id));
  paintSelBanner();
  updateBulkBar();
}

// This page only — the rest of the matching set is a separate, explicit act. The head
// governs the MATCHING block: it never reaches into the carried one, in the ticks it
// writes any more than in the ids it holds (8 Sep — it used to write every checkbox in
// the table, so switching it off emptied the carried rows' boxes while the bar still
// counted them, and the next click on one re-ticked it instead of releasing it). The
// carried block's own way out is unticking a row, or Clear.
function toggleAllKeys(box) {
  for (const k of pagedKeys()) box.checked ? KSEL.add(k.id) : KSEL.delete(k.id);
  document.querySelectorAll('#key-rows tr:not(.pinned) .chk input').forEach(c => { c.checked = box.checked; });
  paintSelBanner();
  updateBulkBar();
}

function clearKeySelection() {
  KSEL.clear();
  KPIN.clear();
  KPIN_OPEN = false;
  document.querySelectorAll('.chk input').forEach(c => { c.checked = false; });
  if (document.getElementById('key-rows')) repaintKeyRows();
  paintSelBanner();
  updateBulkBar();
}

function updateBulkBar() {
  const bar = document.getElementById('bulk-bar');
  if (!bar) return;
  bar.style.display = KSEL.size ? 'flex' : 'none';
  const count = document.getElementById('bulk-count');
  if (count) count.textContent = `${KSEL.size} integration${KSEL.size > 1 ? 's' : ''} selected`;
  // THE COHORT ACTS ARE TWO (15 Sep, user call — *"in bulk edit integrations remove the custom
  // config CTA"*). `Custom configs` stood beside them and was never the same shape: the other
  // two write one answer every integration has exactly one of, while a config is a keyed, named
  // thing a surface carries none or six of — so the act is done where the surface is, on its
  // own page. With the door gone, the bar has no third state to grey either.
  paintSelBanner();
}

// ---------- A BULK JOURNEY OWNS ITS OWN AUDIENCE (15 Sep, user call) ----------
// *"In the bulk screen's 2nd step, in both Player behaviour and Ad behaviour, we need an option
// to show all the selected integrations which we can check/uncheck and search — and the user
// should be able to search and add another integration as well."*
//
// The list's selection starts the act; it is not the act. On the review — the last screen before
// a cohort write, and the one that asks *"Apply to 12 integrations?"* — the WHO is half the
// question, and until now it was a grey byline you could only answer by cancelling out and
// re-ticking the table. So from the moment a journey opens it carries its OWN set, seeded from
// the list's, and `selectedKeys()` answers with that.
//
// ONE SEAM, DELIBERATELY. Every counted word on both sheets and both reviews — the today-words,
// the spreads, `N carry no special deals`, whether a row changes anything at all — is derived
// from `selectedKeys()`, so all of it recounts from a single place the moment the audience moves.
// Nothing else needed teaching.
//
// The list's own selection is NOT touched: Cancel leaves the table exactly as it was, and after
// an Apply `refreshKeysList` clears it as it always did. Adding an integration here adds it to
// THIS act, not to the table behind the veil.
let BULK_WHO = null;
function bulkWhoIds() { return BULK_WHO || KSEL; }
function bulkWhoOpen() { BULK_WHO = new Set(KSEL); }
function bulkWhoClose() { BULK_WHO = null; }
function bulkWhoHas(id) { return bulkWhoIds().has(id); }
// AN ACT WITH NOBODY IN IT IS NOT AN ACT. The last surface cannot be unticked — the same
// refusal the waterfall makes for its last partner, and for the same reason: the alternative is
// a screen that counts changes nobody receives and a button that would write them. Refused by
// name where it was clicked; `false` tells the caller nothing moved.
function bulkWhoToggle(id) {
  if (!BULK_WHO) return false;
  if (!BULK_WHO.has(id)) { BULK_WHO.add(id); return true; }
  if (BULK_WHO.size === 1) {
    toast('One integration must stay in the change', 'warn');
    return false;
  }
  BULK_WHO.delete(id);
  return true;
}
// The estate this act may reach, in the list's own order — so the panel reads like the table it
// came from. Kept in scope, like every other list of integrations in this room.
function bulkWhoAll() { return KEYS_CACHE.filter(k => inScope(k.property)); }

function selectedKeys() {
  const ids = bulkWhoIds();
  return [...ids].map(id => KEYS_CACHE.find(k => k.id === id)).filter(Boolean);
}

async function bulkApplyDirect(action, value) {
  try {
    const { changed, unchanged, refused, skipped } = await API.bulkKeys({ ids: [...bulkWhoIds()], action, value });
    // ONE COUNT FOR THE WHOLE SWEEP (7 Sep, user call). It used to name every row it
    // skipped and every row it left alone, three lines deep — in a pill, over the very
    // rows that say so themselves: a skipped integration repaints unchanged, and the one
    // that took the change repaints changed. The count is what the rows can't show.
    // …and the one thing the rows CANNOT show once the selection clears: that none of it is on
    // air yet. One pill, two facts, three when something was skipped — the toast policy's merge.
    const left = (refused?.length || 0) + (skipped?.length || 0);
    toast([`${changed} changed`, left ? `${left} skipped` : '', 'not on air yet']
      .filter(Boolean).join(' · '), left ? 'warn' : undefined);
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

