// views-templates-list.js — THE TEMPLATES LIST, the third room (16 Sep, user call).
//
// A ROOM, NOT A SECTION. Ad unit templates spent 31 Aug – 15 Sep folded into the head of
// every ad setup's page, which said the wrong thing twice: a template is not a property
// of the setup you happened to open (it is shared by every setup that points at it), and
// a section that opens on one setup's page cannot answer the only two questions a person
// has about a shared thing — where MAY it be used, and where IS it used. So it stands
// beside Ad Setups now, wearing the same list grammar both other rooms wear: one search,
// filter pills, one table, one pager. Nothing new to learn; a third door.
//
// FIVE COLUMNS, ONE FACT EACH (refined 16 Sep): what it is (the name and the URL it
// fires), who MAY point at it (Visible to — the author's decision), who DOES (Connected —
// counted, never estimated), and who last moved it.
//   · STATUS IS BACK (16 Sep), and this time it earns the column: templates joined the
//     publish plane, so it names a VERSION — `v2`, `Off air`, `Unpublished`, and whether a
//     saved change is waiting — which is the same four answers the other two lists' Status
//     carries, drawn by the same `statusCellHtml`. It was cut a few hours earlier for the
//     opposite and equally good reason: back then it could only say `Live` on every row,
//     which is the default state shouted, and there was no version for it to name.
//   · Connected counts AD SETUPS, one number. Two numbers side by side made the reader
//     work out which one they were scanning for; the units are on the row's hover, and
//     the template's own page breaks them down properly.
// Load order: before views-templates-editor.js (which calls tplRowsRepaint on save).

let TPL_LIST = [];
// The toolbar paints once; typing repaints rows only, so the caret survives (the house
// rule both other lists keep).
const TF = { q: '', property: 'all', connected: 'all' };
const TPAGE = { page: 0, size: 50 };

// ---------- the cells ----------

// WHO MAY POINT AT IT. `properties: []` is every property — one badge and the word, so
// the shared case is as legible at a glance as the narrow one. A narrowed template wears
// its properties' own badges, in the properties' own order.
function tplVisibleCell(t) {
  const ps = t.properties || [];
  if (!ps.length) return `<span class="prop-cell">${propBadge('All')}All properties</span>`;
  return `<span class="prop-cell tpl-vis">${ps.map(propBadge).join('')}${esc(ps.join(', '))}</span>`;
}

// WHO DOES — the ad setups a change here lands in, which is the unit the Visible to
// column next door is also counted in. The ad units behind the number ride the hover,
// where the detail belongs; the template's own page lists them per setup. Counted from a
// walk of the real documents (response-shapes.templateView), never from a total.
function tplConnectedCell(t) {
  const n = t.setupCount || 0;
  if (!n) return '<span class="sg-dim">Not connected</span>';
  const u = t.usedBy || 0;
  const why = `${u} ad unit${u === 1 ? '' : 's'} — ${(t.setups || []).map(x => x.name).join(', ')}`;
  return `<span class="tpl-conn" title="${esc(why)}"><b>${n}</b> ad setup${n === 1 ? '' : 's'}</span>`;
}

// ---------- the list ----------

function tplMatches(t) {
  const ps = t.properties || [];
  if (TF.property !== 'all' && ps.length && !ps.includes(TF.property)) return false;
  if (TF.connected === 'yes' && !t.usedBy) return false;
  if (TF.connected === 'no' && t.usedBy) return false;
  // Both columns a person reads: what it is called, and what it fires.
  if (!matchesPrefix(TF.q, t.name, t.url)) return false;
  return true;
}

function filteredTemplates() { return TPL_LIST.filter(tplMatches); }

function pagedTemplates() {
  const all = filteredTemplates();
  return all.slice(TPAGE.page * TPAGE.size, (TPAGE.page + 1) * TPAGE.size);
}

function gotoTplPage(delta) {
  const pages = Math.max(1, Math.ceil(filteredTemplates().length / TPAGE.size));
  TPAGE.page = Math.min(pages - 1, Math.max(0, TPAGE.page + delta));
  tplRowsRepaint();
}

// Any filter or search change lands on page 1 — page 2 of a set just narrowed is blank.
function resetTplPage() { TPAGE.page = 0; tplRowsRepaint(); }

function paintTplPager(total) {
  const el = document.getElementById('tpl-pager');
  if (!el) return;
  if (!total) { el.innerHTML = ''; return; }
  const from = TPAGE.page * TPAGE.size + 1;
  const to = Math.min(total, (TPAGE.page + 1) * TPAGE.size);
  const pages = Math.ceil(total / TPAGE.size);
  el.innerHTML = `
    <span class="pg-range">${from}–${to} of ${total}</span>
    <button class="pg-btn" ${TPAGE.page === 0 ? 'disabled' : ''} onclick="gotoTplPage(-1)">‹</button>
    <button class="pg-btn" ${TPAGE.page >= pages - 1 ? 'disabled' : ''} onclick="gotoTplPage(1)">›</button>`;
}

function tplRowsRepaint() {
  const tbody = document.getElementById('tpl-rows');
  if (!tbody) return;
  const all = filteredTemplates();
  const pages = Math.max(1, Math.ceil(all.length / TPAGE.size));
  if (TPAGE.page > pages - 1) TPAGE.page = pages - 1;
  paintTplPager(all.length);
  const rows = pagedTemplates();
  if (!rows.length) {
    tbody.innerHTML = `<tr><td colspan="6"><div class="empty">${TPL_LIST.length
      ? 'No templates match — clear a filter.'
      : 'No templates yet. Ad units request through their provider’s standard until one is made.'}</div></td></tr>`;
    return;
  }
  tbody.innerHTML = rows.map(t => `
    <tr class="rowlink${t.live ? '' : ' tpl-off'}" onclick="location.hash = '#templates/${t.id}'">
      <td><div class="cell-main tpl-name">${providerBadge(t.provider)}<span>${esc(t.name)}</span></div></td>
      <td class="cell-plain"><span class="mono tpl-u" title="${esc(t.url)}">${esc(t.url)}</span></td>
      <td>${tplVisibleCell(t)}</td>
      <td class="cell-plain">${tplConnectedCell(t)}</td>
      <td>
        <div class="cell-plain" style="font-weight:600">${esc(t.updatedBy || '—')}</div>
        <div class="cell-sub">${relWhen(t.updatedAt)}</div>
      </td>
      <td>${statusCellHtml(t)}</td>
    </tr>`).join('');
}

async function viewTemplatesList() {
  const [{ templates }, meta] = await Promise.all([API.listTemplates(), getMeta()]);
  KL_META = meta;
  TPL_LIST = templates;
  FILTER_CTX = { state: TF, repaint: resetTplPage };
  const pill = (name, labelText, options) => filterPillHtml(name, labelText,
    [{ v: 'all', label: `All ${labelText.toLowerCase()}` }, ...options]);
  document.getElementById('main').innerHTML = `
    <div class="page-head">
      <div>
        <h1>Templates</h1>
        <div class="page-sub">The request URL an ad unit fires. Edit one and every unit
          connected to it changes.</div>
      </div>
      <button class="btn" onclick="location.hash = '#templates/new'">New template</button>
    </div>
    <div class="filter-bar">
      <input class="search" placeholder="Search templates…" value="${esc(TF.q)}"
        oninput="TF.q = this.value; resetTplPage()">
      ${pill('property', 'Properties', (meta.properties || []).map(v => ({ v, label: v })))}
      ${pill('connected', 'Use', [
        { v: 'yes', label: 'Connected' }, { v: 'no', label: 'Not connected' },
      ])}
      <span style="flex:1"></span>
      <div id="tpl-pager" class="pager"></div>
    </div>
    <div class="card"><table class="t-tpls">
      <thead><tr><th>Template</th><th>Request URL</th><th>Visible to</th><th>Connected</th><th>Modified</th><th>Status</th></tr></thead>
      <tbody id="tpl-rows"></tbody>
    </table></div>`;
  tplRowsRepaint();
}
