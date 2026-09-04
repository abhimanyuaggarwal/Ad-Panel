// views-setups-list.js — the Ad Setups LIST and the ways INTO a setup: the table with
// its filters, the demand chips both lists share (setupChipsHtml/setupSummary), and the
// new-setup CHOOSER (blank / copy — it lands in the real editor, views-setups.js).
// Load order: before views-setups.js and the views-keys trio (they call these at runtime).

// ---------- list ----------

// Counted demand per family, from the Default placement — plus how many more
// placements ride along.
// DEMAND WEARS THE ACTIVE-BREAKS CHIPS (3 Sep, user call): the same four marks the
// integrations list uses, so one vocabulary answers "which breaks run here" on both
// screens. Lit means the placements carry something for that break; the count is on
// the chip's own hover, where a number belongs.
function setupBreakCount(s, t) {
  return (s.sections || []).reduce((a, sec) => {
    const slot = (sec.slots || {})[t] || {};
    const n = (slot.groups && slot.groups.length)
      ? slot.groups.reduce((x, g) => x + (g.rungs || []).length, 0)
      : (slot.rungs || []).length;
    return a + n + ((slot.direct && slot.direct.rungs) || []).length;
  }, 0);
}

function setupChipsHtml(s) {
  let last = null;
  const out = [];
  for (const t of KL_META.slotTypes) {
    const fam = slotFamily(t);
    if (last && fam !== last) out.push('<span class="uchip-split" title="video units | display units"></span>');
    last = fam;
    const n = setupBreakCount(s, t);
    out.push(`<span class="uchip ${n ? 'on' : ''}" title="${esc(label('slotType', t))} — ${n ? `${n} ad source${n === 1 ? '' : 's'}` : 'nothing here yet'}">${esc(label('slotShort', t))}</span>`);
  }
  return `<span class="uchips">${out.join('')}</span>`;
}

function setupSummary(s) {
  const def = (s.sections && s.sections[0]) || { slots: s.slots || {} };
  const bits = KL_META.slotTypes.map(t => {
    const slot = def.slots[t] || {};
    // A mid-roll counts every break group's tags, not just group 1's.
    const n = (slot.groups && slot.groups.length)
      ? slot.groups.reduce((a, g) => a + (g.rungs || []).length, 0)
      : (slot.rungs || []).length;
    return `${label('slotShort', t).toLowerCase()} ${n || '—'}`;
  });
  const extra = (s.sections || []).length - 1;
  if (extra > 0) bits.push(`+${extra} placement${extra > 1 ? 's' : ''}`);
  return bits.join(' · ');
}

// ---------- NEW AD SETUP: THE CHOOSER, THEN THE REAL EDITOR (3 Sep, user call) ----------
// The four-step wizard is gone. Creating an ad setup now asks ONE question — start from
// what? — and then hands you the editor ad ops actually work in, so the shape you are
// given is the shape you keep tuning. The cards wear the listing's own columns, because
// that is where a person already learned to read an ad setup.
//
// A COPY BRINGS EVERYTHING (3 Sep, user call — it used to arrive with empty ladders):
// placements, delivery settings, cadence, pods AND the ad units. A copy you have to
// re-traffic by hand is not a copy, and the panel already treats the same units running
// on two surfaces as normal — the ad setup is what a surface asks, not what it owns.
// It stays a PHOTOCOPY: tuning the new setup moves nothing on the source.
let SETUP_CREATE_SEED = null;
// Set by the integration page's blank card: the new setup starts named for the surface
// it will fill, in that surface's property.
let SETUP_CREATE_PREFILL = null;

async function newSetupChooser() {
  const meta = await getMeta();
  KL_META = meta;
  const [{ setups }, { keys }] = await Promise.all([API.listSetups(), API.listKeys()]);
  SETUPS_LIST = setups;
  KEYS_CACHE = keys;
  history.replaceState(null, '', '#setups/new');
  const rows = setups.filter(s => inScope(s.property))
    .sort((a, b) => (b.updatedAt || '').localeCompare(a.updatedAt || ''));
  const card = s => `
    <div class="dlg-card" data-id="${s.id}" onclick="chooseSetupCopy('${s.id}')"
      title="A photocopy — placements, ad units, deals and settings; nothing changes on “${esc(s.name)}”">
      <div class="dc-top"><span class="dc-title">${esc(s.name)}</span>
        <span class="dc-reach">${esc(s.usedBy ? 'in use' : 'free')}</span></div>
      <div class="dc-sum">${propBadge(s.property)} <span>${esc((s.usedByNames || [])[0] || 'not mapped yet')}</span></div>
      <div class="sc-foot">${setupChipsHtml(s)}
        <span class="podl">${esc(s.updatedBy || 'ad ops')} · ${relWhen(s.updatedAt)}</span></div>
    </div>`;
  document.getElementById('dialog-root').innerHTML = `
    <div class="dlg-veil"><div class="dlg wide autoh">
      <h3>New ad setup<span class="dlg-kicker">blank, or from a copy — it takes shape in the editor</span></h3>
      <div class="dlg-body">
        <div class="dlg-cards">
          <div class="dlg-card create" onclick="chooseSetupBlank()">
            <div class="dc-plus">+</div>
            <div class="dc-title">Start blank</div>
            <div class="dc-sum">One placement, platform delivery settings, empty ladders</div>
          </div>
          ${rows.map(card).join('')}
        </div>
      </div>
      <div class="dlg-foot"><button class="btn ghost" onclick="setupChooserClose()">Cancel</button></div>
    </div></div>`;
  document.querySelector('.dlg-veil').onclick = e => {
    if (e.target.classList.contains('dlg-veil')) setupChooserClose();
  };
}

// Cancel walks the address back too — ← and refresh keep meaning what they say.
function setupChooserClose() {
  document.getElementById('dialog-root').innerHTML = '';
  history.replaceState(null, '', '#setups');
}

async function chooseSetupBlank() {
  SETUP_CREATE_SEED = null;
  document.getElementById('dialog-root').innerHTML = '';
  await viewSetupForm(null);
}

async function chooseSetupCopy(id) {
  try {
    const { setup } = await API.getSetup(id);
    SETUP_CREATE_SEED = setup;
    document.getElementById('dialog-root').innerHTML = '';
    await viewSetupForm(null);
  } catch (e) {
    toast(e.message, 'bad');
  }
}

// The source, whole: shape, ladders, deals and behaviour — every object deep-copied (the
// house rule: a copy, never a link), so tuning this setup later moves nothing else.
// _orig: -1 marks each placement as new, so the counted chips never claim a saved past.
function setupSeedSections(src, meta) {
  const clone = v => JSON.parse(JSON.stringify(v || []));
  return (src.sections || []).map((sec, i) => ({
    name: sec.name, isDefault: i === 0, _orig: -1,
    slots: Object.fromEntries(meta.slotTypes.map(t => {
      const s = sec.slots[t] || {};
      const bhv = g => JSON.parse(JSON.stringify((g || s).behaviour || {}));
      const direct = slotKind(t) === 'ladder' ? { rungs: clone(s.direct && s.direct.rungs) } : null;
      return [t, t === 'midroll'
        ? { direct, groups: (s.groups && s.groups.length ? s.groups : [s]).map(g => ({
            rungs: clone(g.rungs), behaviour: bhv(g), direct: { rungs: clone(g.direct && g.direct.rungs) },
          })) }
        : { rungs: clone(s.rungs), behaviour: bhv(), direct }];
    })),
  }));
}

// What the create will write, in the review's own grammar — the same read-back every
// other write in the panel ends on.
function setupCreateChangeList() {
  const d = FORM.data;
  const rows = [
    { where: '', field: 'name', fromText: '—', toText: (d.name || '').trim() },
  ];
  if (d.copiedFrom) rows.push({ where: '', field: 'source', label: 'Copied from', fromText: '—', toText: d.copiedFrom });
  rows.push({ where: '', field: 'property', fromText: '—', toText: d.property === 'All' ? 'All properties' : d.property });
  if (!d.copiedFrom && d.presetName) {
    rows.push({ where: '', field: 'preset', label: 'Delivery settings', fromText: '—', toText: `${d.presetName} preset` });
  }
  for (const sec of d.sections || []) {
    const n = KL_META.slotTypes.reduce((a, t) => a + suSeedRungCount(sec, t), 0);
    rows.push({ where: 'Placements', field: sec.name, label: sec.name, fromText: '—',
      toText: n ? `${n} ad source${n === 1 ? '' : 's'}` : 'no ad units yet' });
  }
  if (d.copiedFrom) {
    const n = (d.sections || []).reduce((a, sec) =>
      a + KL_META.slotTypes.reduce((b, t) => b + suSeedRungCount(sec, t), 0), 0);
    rows.push({ where: 'Placements', field: 'units', label: 'Ad units', fromText: '—',
      toText: n ? `${n} copied — this setup's own` : 'none to copy',
      note: `“${d.copiedFrom}” keeps its own — nothing here changes it` });
  }
  return rows;
}

function suSeedRungCount(sec, t) {
  const s = sec.slots[t] || {};
  const own = (s.groups && s.groups.length) ? s.groups.reduce((a, g) => a + (g.rungs || []).length, 0) : (s.rungs || []).length;
  return own + ((s.direct && s.direct.rungs) || []).length;
}

// THE LIST WEARS THE INTEGRATIONS LIST'S OWN GRAMMAR (2 Sep, user call): one search,
// the same filter pills, five columns — never a second table language to learn. The
// toolbar paints once; typing repaints rows only, so the caret survives.
// `assigned` names an INTEGRATION now, not a yes/no (3 Sep); on air and modified were
// cut, the way they were on the integrations list.
const SF = { q: '', property: 'all', assigned: 'all', demand: 'all' };
let SETUPS_LIST = [];

function setupMatches(o) {
  if (!inScope(o.property)) return false;
  if (SF.property !== 'all' && o.property !== SF.property) return false;
  if (SF.assigned === 'none' && o.usedBy) return false;
  if (SF.assigned !== 'all' && SF.assigned !== 'none') {
    const k = KEYS_CACHE.find(x => x.id === SF.assigned);
    if (!k || k.adSetupId !== o.id) return false;
  }
  if (SF.demand !== 'all') {
    const secs = o.sections || [];
    const hasDirect = secs.some(x => KL_META.slotTypes.some(t => (x.slots[t]?.direct?.rungs || []).length));
    const hasOut = secs.some(x => (x.slots.outstream?.rungs || []).length);
    if (SF.demand === 'direct' && !hasDirect) return false;
    if (SF.demand === 'nodirect' && hasDirect) return false;
    if (SF.demand === 'outstream' && !hasOut) return false;
  }
  // Both columns a person can read: the setup's name and the integration it fills.
  if (!matchesPrefix(SF.q, o.name, ...(o.usedByNames || []))) return false;
  return true;
}

function repaintSetupRows() {
  const tbody = document.getElementById('setup-rows');
  if (!tbody) return;
  const rows = SETUPS_LIST.filter(setupMatches);
  const count = document.getElementById('setup-count');
  if (count) count.textContent = `${rows.length} of ${SETUPS_LIST.filter(o => inScope(o.property)).length}`;
  if (!rows.length) {
    tbody.innerHTML = '<tr><td colspan="6"><div class="empty">No ad setups match — clear a filter or create one.</div></td></tr>';
    return;
  }
  tbody.innerHTML = rows.map(o => `
    <tr class="rowlink" onclick="location.hash = '#setups/${o.id}'">
      <td>
        <div class="cell-main">${esc(o.name)}</div>
      </td>
      <td>${propCell(o.property)}</td>
      <td class="cell-plain">${o.usedBy ? esc((o.usedByNames || []).join(', ')) : '<span class="sg-dim">not mapped yet</span>'}</td>
      <td>${setupChipsHtml(o)}</td>
      <td>${statusCellHtml(o)}</td>
      <td>
        <div class="cell-plain" style="font-weight:600">${esc(o.updatedBy || '—')}</div>
        <div class="cell-sub">${relWhen(o.updatedAt)}</div>
      </td>
    </tr>`).join('');
}

async function viewSetupsList() {
  if (typeof KEY_RETURN !== 'undefined') KEY_RETURN = null;
  // The keys come along now: the Integrations filter names them, and every row says
  // which one it fills.
  const [{ setups }, meta, { keys }] = await Promise.all([API.listSetups(), getMeta(), API.listKeys()]);
  KL_META = meta;
  SETUPS_LIST = setups;
  KEYS_CACHE = keys;
  FILTER_CTX = { state: SF, repaint: repaintSetupRows };
  const pill = (name, labelText, options) => filterPillHtml(name, labelText,
    [{ v: 'all', label: `All ${labelText.toLowerCase()}` }, ...options]);
  const main = document.getElementById('main');
  main.innerHTML = `
    <div class="page-head">
      <div>
        <h1>Ad Setups</h1>
        <div class="page-sub">One per integration.</div>
      </div>
      <button class="btn" onclick="newSetupChooser()">New ad setup</button>
    </div>
    <div class="filter-bar">
      <input class="search" placeholder="Search ad setups…" value="${esc(SF.q)}"
        oninput="SF.q = this.value; repaintSetupRows()">
      ${window.GLOBAL_PROP === 'All' ? pill('property', 'Properties', meta.properties.map(v => ({ v, label: v }))) : ''}
      ${pill('assigned', 'Integrations', [
        ...KEYS_CACHE.filter(k => inScope(k.property)).map(k => ({ v: k.id, label: k.name })),
        { v: 'none', label: 'Not mapped yet' },
      ])}
      ${pill('demand', 'Demand', [
        { v: 'direct', label: 'With direct deals' }, { v: 'nodirect', label: 'No direct deals' },
        { v: 'outstream', label: 'With out-stream' },
      ])}
      <span style="flex:1"></span>
      <span class="pg-range" id="setup-count"></span>
    </div>
    <div class="card"><table class="t-setups">
      <thead><tr><th>Ad setup</th><th>Property</th><th>Integration</th><th>Demand</th><th>Status</th><th>Modified</th></tr></thead>
      <tbody id="setup-rows"></tbody>
    </table></div>`;
  repaintSetupRows();
}

// (the accordion is gone — see suTemplatesRowHtml)

// After any template act: fresh objects, fresh tag flags, repaint in place.
async function tplRefresh() {
  const [{ templates }] = await Promise.all([API.listTemplates(), suRefreshTags()]);
  SU_TPLS = templates;
  FORM.rerender();
}

// REQUEST TEMPLATES ARE NOT A FIFTH BREAK (3 Sep, user call — "unrecognisable at the
// bottom"). They sat under Pre/Mid/Post/Out wearing a break row's exact clothing — same
// label column, same glimpse, same chevron — so the eye read them as another break and
// slid past. They are a different KIND of thing: named request URLs shared by every ad
// setup on the account, not a property of this one. So they moved to the top of the card.
// AD UNIT TEMPLATES, AS THE CONFIG TABLE (4 Sep, user call — the chips strip is gone,
// and the section wears the name of the thing it templates). The custom-config section
// on the integration page set the grammar, and this one follows it: an eyebrow title,
// rows under ONE heading row — the name as the identity column, then the URL it fires
// and the counted use — the rare act (Delete) behind a ⋯ at the row's right edge, and
// the add at the FOOT where the row it makes appears. A row opens its own editor.
// THE ROW'S SWITCH (4 Sep, user call — the config rows' exact grammar): off keeps the
// template, its name and its units' picks, dimmed in place; those units request through
// their provider's STANDARD until it is on again. Templates resolve LIVE (no publish
// plane), so the switch reaches players on their next request — the toggle says so.
function suTemplatesRowHtml() {
  const mine = SU_TPLS.filter(t => inScope(t.property));
  const row = t => {
    const off = t.on === false;
    const n = t.usedBy || 0;
    const units = `${n} ad unit${n === 1 ? '' : 's'}`;
    return `
    <div class="tpl-r${off ? ' off' : ''}" onclick="tplOpen('${t.id}')"
      title="Open “${esc(t.name)}” — its name, provider and request URL${n ? ` · ${units} request through it` : ''}">
      <span class="tpl-id">${providerBadge(t.provider)}<span class="tpl-n">${esc(t.name)}</span></span>
      <span class="tpl-url"><span class="mono" title="${esc(t.url)}">${esc(t.url)}</span></span>
      <span class="pcfg-acts" onclick="event.stopPropagation()">
        <span class="toggle tiny ${off ? '' : 'on'}" onclick="tplToggle('${t.id}')"
          title="${off
            ? esc(`Switched off — ${n ? `its ${units} request` : 'an ad unit picking it requests'} through the provider's standard. On reaches players from the next request.`)
            : esc(`Switched on — ad units picking it request through this URL. Off: the provider's standard, from the next request.`)}"><span class="track"></span></span>
        <span class="rmenu">
          <button type="button" class="row-kebab" onclick="rmenuToggle(event, this)" title="More actions" aria-label="More actions">⋯</button>
          <div class="rmenu-list">
            <div class="eh-item danger ${n ? 'dim' : ''}" ${n
              ? `title="${units} request through it — point them elsewhere first"`
              : `onclick="rmenuShut(this); tplDelete('${t.id}')"`}>Delete template</div>
          </div>
        </span>
      </span>
    </div>`;
  };
  return `
    <div class="tpl-sec">
      <div class="pl-head" title="Named request URLs an ad unit fires through — shared across every ad setup. A unit that picks none uses its provider's standard template.">Ad unit templates</div>
      ${mine.length ? `
      <div class="tpl-t">
        <div class="tpl-h">
          <span class="tpl-id">Template</span><span>Request URL</span><span></span>
        </div>
        ${mine.map(row).join('')}
      </div>`
        : '<div class="pcc-empty">None — ad units request through their provider’s standard template</div>'}
      <div class="pcc-foot">
        <button type="button" class="slot-add pcc-add" onclick="tplNew()"
          title="A named request URL ad units can pick, in their own settings">+ Add template</button>
      </div>
    </div>`;
}

// ask() clears the dialog before resolving, so a form dialog reads its values FIRST:
// same anatomy as ask(), plus a read step on OK.
function askForm(opts, readFn) {
  return new Promise(resolve => {
    const root = document.getElementById('dialog-root');
    root.innerHTML = `
      <div class="dlg-veil">
        <div class="dlg">
          <h3>${esc(opts.title)}</h3>
          <div class="dlg-body">${opts.body || ''}</div>
          <div class="dlg-foot">
            <button class="btn ghost" data-act="no">Cancel</button>
            <button class="btn" data-act="yes">${esc(opts.okLabel || 'Confirm')}</button>
          </div>
        </div>
      </div>`;
    root.querySelector('[data-act=no]').onclick = () => { root.innerHTML = ''; resolve(null); };
    root.querySelector('[data-act=yes]').onclick = () => {
      const out = readFn(root);
      root.innerHTML = '';
      resolve(out);
    };
    root.querySelector('.dlg-veil').onclick = e => {
      if (e.target.classList.contains('dlg-veil')) { root.innerHTML = ''; resolve(null); }
    };
  });
}

let TPL_PROVIDER = 'ima'; // the dialog's provider pick, written by the house select

function tplFormBody(t) {
  const macros = (KL_META.templateMacros || []).map(m => `[${m}]`).join(' · ');
  TPL_PROVIDER = t?.provider || 'ima';
  return `
    <div class="frow tpl-form"><div class="field grow"><label>Name</label>
      <input type="text" id="tpl-name" value="${esc(t?.name || '')}" placeholder="e.g. GAM low-latency"></div>
    <div class="field tpl-prov"><label>Provider</label>
      ${selectHtml(TPL_PROVIDER, window.KL_PROVIDERS.map(v => ({ v, label: label('tagProvider', v) })), v => { TPL_PROVIDER = v; })}</div></div>
    <div class="frow tpl-form"><div class="field grow"><label>Request URL</label>
      <input type="text" id="tpl-url" class="mono" value="${esc(t?.url || '')}" placeholder="https://…?cb=[CACHEBUSTER]"></div></div>
    <p class="dlg-note" title="The player fills these at request time — anything else is refused by name">Macros the player fills: ${esc(macros)}</p>`;
}

async function tplNew() {
  const body = await askForm({
    title: 'New ad unit template',
    body: tplFormBody(null),
    okLabel: 'Create',
  }, root => ({
    name: root.querySelector('#tpl-name')?.value ?? '',
    provider: TPL_PROVIDER,
    url: root.querySelector('#tpl-url')?.value ?? '',
    property: window.GLOBAL_PROP === 'All' ? 'All' : window.GLOBAL_PROP,
  }));
  if (!body) return;
  try {
    await API.createTemplate(body);
    toast('Template created — ad units pick it in their own settings');
    await tplRefresh();
  } catch (e) {
    toast((e.errors && e.errors[0]?.message) || e.message, 'bad');
  }
}


// ONE DIALOG PER TEMPLATE: what it is, the URL it fires, which tags it carries, and its
// end — everything about the object in the one place the row opens. No link litter.
// OPENING A TEMPLATE IS THE SAME SCREEN AS MAKING ONE (3 Sep, user call). The old
// dialog bolted a "Carries" list of every tag onto the form — a second way to do what
// the unit's own Request template row already does, and the thing that made this dialog
// tall and cluttered. Now: the three fields, Save, and Delete when nothing uses it.
async function tplOpen(id) {
  const t = SU_TPLS.find(x => x.id === id);
  if (!t) return;
  const body = await askForm({
    title: t.name,
    body: `${tplFormBody(t)}
      <div class="tpl-foot">
        <button type="button" class="zlink quiet-danger" ${t.usedBy
          ? `disabled title="${t.usedBy} ad unit${t.usedBy === 1 ? '' : 's'} request through it — point them elsewhere first"`
          : `onclick="tplDeleteFromDialog('${t.id}')"`}>Delete template</button>
        ${t.usedBy ? `<span class="podl">${t.usedBy} ad unit${t.usedBy === 1 ? '' : 's'} request through it</span>` : ''}
      </div>`,
    okLabel: 'Save',
  }, root => ({
    name: root.querySelector('#tpl-name')?.value ?? '',
    provider: TPL_PROVIDER,
    url: root.querySelector('#tpl-url')?.value ?? '',
    property: t.property,
  }));
  if (!body) return;
  try {
    await API.updateTemplate(t.id, body);
    toast('Saved');
    await tplRefresh();
  } catch (e) {
    toast((e.errors && e.errors[0]?.message) || e.message, 'bad');
  }
}

// The row's switch writes NOW (templates have no draft plane — they resolve live), so
// the toast carries the counted, from-the-next-request consequence instead of a review.
async function tplToggle(id) {
  const t = SU_TPLS.find(x => x.id === id);
  if (!t) return;
  const to = t.on === false;
  const n = t.usedBy || 0;
  const units = `${n} ad unit${n === 1 ? '' : 's'}`;
  try {
    await API.updateTemplate(t.id, { on: to });
    toast(to
      ? `“${t.name}” on${n ? ` — its ${units} request through it again, from the next request` : ''}`
      : `“${t.name}” off${n ? ` — its ${units} request through the provider's standard, from the next request` : ''}`);
    await tplRefresh();
  } catch (e) {
    toast((e.errors && e.errors[0]?.message) || e.message, 'bad');
  }
}

// Delete leaves the dialog first, then asks — one confirm, never two dialogs deep.
function tplDeleteFromDialog(id) {
  document.getElementById('dialog-root').innerHTML = '';
  tplDelete(id);
}

async function tplDelete(id) {
  const t = SU_TPLS.find(x => x.id === id);
  const ok = await ask({ title: `Delete “${t.name}”?`, okLabel: 'Delete', danger: true });
  if (!ok) return;
  try {
    await API.deleteTemplate(id);
    toast('Template deleted');
    await tplRefresh();
  } catch (e) {
    toast(e.message, 'bad');
  }
}


