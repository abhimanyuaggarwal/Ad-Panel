// controls.js — shared form machinery. One control per concept:
// segmented buttons for enums, toggles for on/off, number+unit fields, chips for domains.
//
// Stability contract: the form paints ONCE per view. Every field is always in the
// DOM — fields that don't currently apply are greyed out (class .off via data-dep),
// never inserted or removed, so the layout never shifts. Control clicks update
// their own classes/labels imperatively; FORM.rerender() runs only on the
// failed-save path, where a full repaint with inline errors is wanted.

let FORM = null;

/**
 * Begin an edit session: FORM.data becomes the single mutable draft, FORM.rerender the
 * one repaint. Field writers mutate FORM.data and either rerender or (for text inputs)
 * deliberately do NOT — typing must never lose the caret (the toolbar rule).
 * @param {object} data       the draft (mutated in place by every writer)
 * @param {() => void} rerender
 * @sideeffects resets FORM.errors
 */
function startForm(data, rerender) {
  FORM = { data: { ...data }, errors: {}, rerender, deps: {}, afterSync: null };
}

// deps: name -> (data) => enabled. Fields carry data-dep="name"; syncDeps greys them.
function formDeps(map) {
  FORM.deps = map;
}

function depOff(name) {
  return name && FORM.deps[name] && !FORM.deps[name](FORM.data);
}

function syncDeps() {
  for (const [key, fn] of Object.entries(FORM.deps)) {
    const off = !fn(FORM.data);
    document.querySelectorAll(`[data-dep="${key}"]`).forEach(el => el.classList.toggle('off', off));
  }
  if (FORM.afterSync) FORM.afterSync();
}

function clearErr(field) {
  delete FORM.errors[field];
  const w = document.querySelector(`[data-field="${field}"]`);
  if (w) {
    w.classList.remove('err');
    const e = w.querySelector('.field-err');
    if (e) e.remove();
  }
  document.querySelectorAll(`[data-err-for="${field}"]`).forEach(el => el.remove());
}

function applyServerErrors(err) {
  FORM.errors = {};
  for (const e of (err.errors || [])) {
    if (!FORM.errors[e.field]) FORM.errors[e.field] = e.message;
  }
  FORM.rerender();
  const first = (err.errors || [])[0];
  // Silent when the result is visible in place (toast policy, 7 Sep): a refusal that
  // landed in its field is not said twice. The pill speaks only for what has no field.
  const placed = first && first.field
    && document.querySelector(`[data-field="${first.field}"].err, [data-err-for="${first.field}"]`);
  if (!placed) toast(first ? first.message : err.message, 'bad');
}

// ---------- WHAT THIS SESSION TOUCHED (7 Sep, user call) ----------
// Every key changed since the last save wears a quiet background tint, in both
// editors — figure-ground, never weight, cleared naturally by Save (the rail's
// pending block then owns the saved-vs-air story). `FORM.saved` is the baseline each
// editor sets at load and after every save; a create page has none, so nothing tints.
function chgIf(cond) { return cond ? ' chg' : ''; }

// The generic pass: any control wrapped in a `data-field` div (name, domains, the
// player's own fields via dot paths) is compared straight against the baseline.
function paintChg() {
  if (typeof FORM === 'undefined' || !FORM || !FORM.saved) return;
  const get = (o, path) => path.split('.').reduce((x, k) => (x == null ? x : x[k]), o);
  document.querySelectorAll('#main [data-field]').forEach(el => {
    const f = el.dataset.field;
    el.classList.toggle('chg',
      JSON.stringify(get(FORM.data, f) ?? null) !== JSON.stringify(get(FORM.saved, f) ?? null));
  });
}

function fieldHtml(labelText, inner, opts = {}) {
  const err = opts.field ? FORM.errors[opts.field] : null;
  return `
    <div class="field ${opts.grow ? 'grow' : ''} ${err ? 'err' : ''} ${depOff(opts.dep) ? 'off' : ''}"
      ${opts.field ? `data-field="${opts.field}"` : ''} ${opts.dep ? `data-dep="${opts.dep}"` : ''}>
      <label>${esc(labelText)}</label>
      ${inner}
      ${err ? `<span class="field-err">${esc(err)}</span>` : (opts.hint ? `<span class="hint">${esc(opts.hint)}</span>` : '')}
    </div>`;
}


// ---------- text + number ----------

function textInput(el, field) {
  FORM.data[field] = el.value;
  clearErr(field);
  paintChg();
}



function textFieldHtml(labelText, field, opts = {}) {
  const v = FORM.data[field] ?? '';
  return fieldHtml(labelText, `
    <input type="text" value="${esc(v)}" placeholder="${esc(opts.placeholder || '')}"
      ${opts.mono ? 'class="mono"' : ''} oninput="textInput(this, '${field}')">`,
    { ...opts, field });
}

// ---------- chips input (domains) ----------
// Enter, comma, or blur adds a chip; only the chips container repaints.

function chipsInner(field, placeholder) {
  const items = FORM.data[field] || [];
  return `
    ${items.map((d, i) => `<span class="chip">${esc(d)}<b onclick="event.stopPropagation(); removeChip('${field}', ${i})">×</b></span>`).join('')}
    <input placeholder="${esc(placeholder)}" onkeydown="chipKey(event, '${field}')" onblur="addChip('${field}', this, false)">`;
}

function chipsFieldHtml(labelText, field, opts = {}) {
  return fieldHtml(labelText, `
    <div class="chips-input" id="chips-${field}" data-ph="${esc(opts.placeholder || '')}"
      onclick="this.querySelector('input').focus()">${chipsInner(field, opts.placeholder || '')}</div>`,
    { ...opts, field });
}

function repaintChips(field, refocus) {
  const c = document.getElementById('chips-' + field);
  if (!c) return;
  c.innerHTML = chipsInner(field, c.dataset.ph);
  if (refocus) c.querySelector('input').focus();
}

function chipKey(e, field) {
  if (e.key === 'Enter' || e.key === ',') {
    e.preventDefault();
    addChip(field, e.target, true);
  } else if (e.key === 'Backspace' && !e.target.value && (FORM.data[field] || []).length) {
    removeChip(field, FORM.data[field].length - 1);
  }
}

function addChip(field, input, refocus) {
  const v = input.value.trim().replace(/,+$/, '').toLowerCase();
  if (!v) return;
  const items = FORM.data[field] || [];
  if (!items.includes(v)) items.push(v);
  FORM.data[field] = items;
  clearErr(field);
  repaintChips(field, refocus);
}

function removeChip(field, i) {
  FORM.data[field].splice(i, 1);
  repaintChips(field, true);
}

// ---------- custom select (our own, never native) ----------

let SELECT_SEQ = 0;
const SELECT_REGISTRY = {};

/**
 * The house select (never a native <select>). Returns markup; the pick callback is held
 * in a registry keyed by a generated id, so the STRING this returns can be dropped into
 * any innerHTML and stays wired.
 * @param {*} value                        current value ('' / undefined = unset)
 * @param {{v: *, label: string}[]} options
 * @param {(v: *) => void} pickFn          runs on pick — usually writes FORM.data and rerenders
 * @returns {string} html
 */
// GROUPS AND A PLACEHOLDER (14 Sep, additive): an option `{ group: 'Playback' }` is a heading
// inside the menu — it names the section the options under it belong to and is not a choice
// — and `opts.ph` is the word the closed select shows while nothing is picked, drawn as a
// placeholder. Callers that pass neither get exactly the select they always had.
function selectHtml(value, options, pickFn, opts = {}) {
  const id = 'sel_' + (++SELECT_SEQ);
  SELECT_REGISTRY[id] = { options, pickFn };
  const cur = options.find(o => !o.group && o.v === value);
  // AN OPTION MAY CARRY A SECOND WORD, AND MAY REFUSE (15 Sep). `tail` is a quiet
  // right-aligned fact about the option — what a cohort holds for that setting today — so
  // a menu can REPORT as well as offer, which is what lets a picker replace a printed list
  // without losing what the list was saying. `off` greys the option WHERE IT SITS with
  // `why` on hover, rather than dropping it: a choice the platform would refuse is worth
  // more named than missing. Both are optional and every existing call site is unchanged.
  return `
    <div class="select" id="${id}" onclick="selectClick(event, '${id}')">
      <span class="sel-label${!cur && opts.ph ? ' ph' : ''}">${esc(cur ? cur.label : (opts.ph || 'Choose…'))}</span><span class="sel-chev">▾</span>
      <div class="sel-menu">${options.map(o => (o.group
        ? `<div class="sel-grp">${esc(o.group)}</div>`
        : `<div class="sel-opt ${o.v === value ? 'on' : ''}${o.off ? ' off' : ''}" data-v="${esc(o.v)}"${o.why ? ` title="${esc(o.why)}"` : ''}>
            <span class="sel-opt-l">${esc(o.label)}</span>${o.tail ? `<span class="sel-opt-t">${esc(o.tail)}</span>` : ''}
          </div>`)).join('')}
      </div>
    </div>`;
}

// ---------- the checklist picker (our own, shared by both sheets) ----------
// ONE CONTROL FOR "WHICH SETTINGS DOES THIS TOUCH" (15 Sep). The config sheet grew this shape
// first — a box per setting, a box per section that takes everything under it, and a menu that
// stays open while you work, because choosing five settings is one act and not five. The cohort
// sheet asks the identical question of the identical catalogue, so it asks it with the identical
// control rather than a lookalike: the markup and the `.shpick` / `.shp-*` classes are the same
// ones, and only the state behind them differs.
// `h` is the receiver, in this file's usual shape — one verb per thing the control can do:
//   h.has(v)        is this row on the sheet
//   h.off(v)        a reason this row may not be picked at all ('' when it may)
//   h.toggle(v)     take it on or off
//   h.toggleAll(k)  the section's box: all of it on, or all of it back off
//   h.open / h.setOpen(bool)   whether the menu is standing open
// Groups are `{ k, name, rows: [{ v, label }] }`.
let PICKER_SEQ = 0;
let PICKER_SWEEP = 0;
const PICKER_REGISTRY = {};

function pickerHtml(groups, h, opts = {}) {
  // SWEEP, BUT AFTER THE DOM IS WRITTEN (15 Sep). A sheet that repaints per tick would otherwise
  // leave a receiver behind on every render — measured on the config sheet: five ticks, seven
  // entries, one live element — so the registry is swept of ids whose element is gone.
  // It CANNOT be swept here, inline: a screen may draw SEVERAL pickers in one innerHTML string
  // (the cohort config sheet draws one per open config), and none of them is in the document yet
  // when the next one asks for its markup — so an inline sweep deletes every receiver but the
  // last, and every picker but the last stops opening. Deferring to the next frame sweeps the
  // same stale entries and none of the fresh ones. One pending sweep at a time.
  cancelAnimationFrame(PICKER_SWEEP);
  PICKER_SWEEP = requestAnimationFrame(() => {
    for (const key of Object.keys(PICKER_REGISTRY)) {
      if (!document.getElementById(key)) delete PICKER_REGISTRY[key];
    }
  });
  const id = 'pick_' + (++PICKER_SEQ);
  PICKER_REGISTRY[id] = h;
  // `opts.inline` — THE SAME CHECKLIST, STANDING OPEN, AS A COLUMN (15 Sep). A dropdown is the
  // right shape when the catalogue is a detour: you go in, you pick, you come back. It is the
  // wrong one when choosing IS the work — twenty-five settings behind a face means the list of
  // what you have taken and the list of what you could take are never on screen together, and
  // every comparison costs an open-and-shut. Inline, the control loses its face and its drop and
  // becomes what it always was underneath: the sections, their tri-state boxes, and the rows.
  // Identical markup and identical receiver — only the shell differs, so the two cannot drift.
  if (opts.inline) {
    return `<div class="shpick inline" id="${id}" onclick="pickerClick(event, '${id}')">
      <div class="shpick-menu">${groups.map(g => pickerSecHtml(g, h, id, { quiet: true })).join('')}</div>
    </div>`;
  }
  // `opts.cta` — THE FACE WEARS THE ACT WHILE THE SHEET IS EMPTY (15 Sep). On a sheet with rows
  // on it this is a field among fields and should recede; on an empty one it is the only way in,
  // and a grey field top-left reads as a filter. Same box, same place, so nothing moves when it
  // recedes — only its colour and the `+` change.
  return `
    <div class="shpick${h.open ? ' open' : ''}${opts.cta ? ' cta' : ''}" id="${id}" onclick="pickerClick(event, '${id}')">
      <span class="shpick-face">
        <span class="shpick-t">${opts.cta ? '<i class="shpick-plus">+</i>' : ''}${esc(opts.ph || 'Choose settings…')}</span><span class="sel-chev">▾</span>
      </span>
      <div class="shpick-menu">${groups.map(g => pickerSecHtml(g, h, id)).join('')}</div>
    </div>`;
}

// WHAT A SET OF ROWS HOLDS — counted once, so a section's own line and any total drawn over it
// can never disagree. A refused row is in the list and greyed, never missing, but it is not part
// of what a box counts or takes, because it is not the box's to give.
function pickerCount(rows, h) {
  const can = rows.filter(r => !h.off(r.v));
  return { on: can.filter(r => h.has(r.v)).length, total: can.length };
}
/** The one phrasing for a picker's count — `3 of 10` once something is ticked, `10 settings`
 *  while nothing is. Shared by every section line and by the rail's own head. */
function pickerCountWord({ on, total }) {
  return on ? `${on} of ${total}` : `${total} setting${total === 1 ? '' : 's'}`;
}
function pickerTotalWord(groups, h) {
  const t = groups.reduce((acc, g) => {
    const c = pickerCount(g.rows, h);
    return { on: acc.on + c.on, total: acc.total + c.total };
  }, { on: 0, total: 0 });
  return pickerCountWord(t);
}

function pickerSecHtml(g, h, id, opts = {}) {
  const { on, total } = pickerCount(g.rows, h);
  const can = g.rows.filter(r => !h.off(r.v));
  const all = can.length > 0 && on === total;
  return `
    <section class="shp-sec">
      ${can.length && !g.flat ? `<div class="shp-head" data-pick="all:${g.k}" role="checkbox" aria-checked="${all}" tabindex="0"
        onkeydown="pickerKey(event, '${id}', this)">
        <i class="shp-box${all ? ' on' : (on ? ' part' : '')}"></i>
        <span class="shp-t">${esc(g.name)}</span>
        ${opts.quiet ? '' : `<span class="shp-n">${esc(pickerCountWord({ on, total }))}</span>`}
      </div>` : `<div class="shp-head static"><span class="shp-t">${esc(g.name)}</span></div>`}
      ${g.rows.map(r => {
        const why = h.off(r.v);
        if (why) {
          return `<div class="shp-opt off" title="${esc(why)}"><i class="shp-box"></i><span>${esc(r.label)}</span>
            <span class="shp-n">${esc(r.tail || '')}</span></div>`;
        }
        const chosen = h.has(r.v);
        return `<div class="shp-opt${chosen ? ' on' : ''}" data-pick="${esc(r.v)}" role="checkbox" aria-checked="${chosen}"
          tabindex="0" onkeydown="pickerKey(event, '${id}', this)">
          <i class="shp-box${chosen ? ' on' : ''}"></i><span>${esc(r.label)}</span></div>`;
      }).join('')}
    </section>`;
}

// The face opens and shuts the menu; anything carrying a box toggles what it names and leaves
// the menu standing.
function pickerClick(e, id) {
  const h = PICKER_REGISTRY[id];
  if (!h) return;
  const hit = e.target.closest('[data-pick]');
  if (hit) { e.stopPropagation(); pickerToggle(h, hit.dataset.pick); return; }
  // A refused row swallows its own click: the menu stays put and says why on hover.
  if (e.target.closest('.shp-opt.off')) { e.stopPropagation(); return; }
  h.setOpen(!h.open);
}

function pickerKey(e, id, el) {
  if (e.key !== 'Enter' && e.key !== ' ') return;
  e.preventDefault();
  e.stopPropagation();
  const h = PICKER_REGISTRY[id];
  if (h) pickerToggle(h, el.dataset.pick);
}

function pickerToggle(h, key) {
  if (key.startsWith('all:')) h.toggleAll(key.slice(4));
  else h.toggle(key);
}

document.addEventListener('click', e => {
  if (e.target.closest('.shpick')) return;
  for (const [id, h] of Object.entries(PICKER_REGISTRY)) {
    if (h.open && document.getElementById(id)) { h.setOpen(false); return; }
  }
});

function selectClick(e, id) {
  const el = document.getElementById(id);
  // A group heading is not a choice: the menu stays open under the pointer.
  if (e.target.closest('.sel-grp')) { e.stopPropagation(); return; }
  // A refused option is not a choice either: it says why on hover and the menu stays put.
  const dead = e.target.closest('.sel-opt.off');
  if (dead) { e.stopPropagation(); return; }
  const opt = e.target.closest('.sel-opt');
  if (opt) {
    const { options, pickFn } = SELECT_REGISTRY[id];
    el.classList.remove('open');
    pickFn(opt.dataset.v, options.find(o => o.v === opt.dataset.v));
    e.stopPropagation();
    return;
  }
  document.querySelectorAll('.select.open').forEach(s => { if (s !== el) s.classList.remove('open'); });
  el.classList.toggle('open');
}

document.addEventListener('click', e => {
  if (!e.target.closest('.select')) {
    document.querySelectorAll('.select.open').forEach(s => s.classList.remove('open'));
  }
  if (!e.target.closest('.rmenu')) {
    document.querySelectorAll('.rmenu.open').forEach(m => m.classList.remove('open'));
  }
  if (!e.target.closest('.fpill')) {
    document.querySelectorAll('.fpill.open').forEach(m => m.classList.remove('open'));
  }
  if (!e.target.closest('.me')) {
    document.getElementById('me')?.classList.remove('open');
  }
});

// ---------- row menu (⋯) — labeled actions for a row ----------
// Secondary acts live behind a ⋯ at the row's right edge (4 Sep, user call — first the
// config rows' Remove, then the Ad-setup strip's change). Open state is pure DOM, like
// the selects: the global click-away above closes any `.rmenu.open`, and a rerender
// paints it closed. Items reuse the header menu's `.eh-item` grammar.
function rmenuToggle(e, btn) {
  e.stopPropagation();
  const m = btn.closest('.rmenu');
  document.querySelectorAll('.rmenu.open').forEach(x => { if (x !== m) x.classList.remove('open'); });
  m.classList.toggle('open');
}

// An item closes its own menu before it acts — a confirm dialog must never sit over a
// menu that is still open behind it.
function rmenuShut(el) {
  el.closest('.rmenu')?.classList.remove('open');
}





// ---------- the GAM directory, spoken of where it is used ----------

// "/7176/toi/mweb/videoshow/preroll" -> "Toi + Mweb + Videoshow + Preroll" (drops the network code)
function gamUnitTitle(u) {
  const parts = String(u).split('/').filter(Boolean).slice(1);
  return parts.map(s => s.charAt(0).toUpperCase() + s.slice(1)).join(' + ');
}

// THE SYNC LIVES IN THE SEARCH (4 Sep, user call — the "sync GAM units" CTA on the
// placements line is gone). The moment the gap is discovered is the moment the search
// answers nothing for what you typed: ONE action row at the menu's foot offers the pull,
// wearing the counted staleness that explains it ("directory synced 2h ago"). The real
// pull takes 10–20 seconds, so it runs IN PLACE: the row becomes its own progress line,
// the field keeps its focus and its query, typing on is fine, and when it lands the same
// search re-runs — a unit trafficked this morning simply appears where you were looking
// for it. One module-level flag, so every lookup tells the same story; a menu closed
// before the pull lands still gets the counted toast.
let GAM_SYNCING = false;

const GAM_SYNC_ICON = `<svg viewBox="0 0 16 16" width="14" height="14" fill="none" stroke="currentColor"
    stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
  <path d="M13.7 8a5.7 5.7 0 0 1-10 3.8M2.3 8a5.7 5.7 0 0 1 10-3.8"/>
  <path d="M12.6 1.6v2.9h-2.9M3.4 14.4v-2.9h2.9"/></svg>`;

// The row itself, drawn by lookupInput whenever a search attaches `items.gam`.
function lookupGamRowHtml(id, gam) {
  if (GAM_SYNCING) {
    return `
    <div class="lk-sync busy" onmousedown="event.preventDefault()">
      <span class="lk-spin"></span>
      <div><div class="lk-sync-t">Syncing ad units from GAM…</div>
        <div class="lk-sync-m">usually 10–20 seconds — results refresh when it lands</div></div>
    </div>`;
  }
  return `
    <div class="lk-sync" onmousedown="lookupGamSync(event, '${id}')">
      ${GAM_SYNC_ICON}
      <div><div class="lk-sync-t">Sync ad units from GAM</div>
        <div class="lk-sync-m">${gam.lastSync ? `directory synced ${esc(relWhen(gam.lastSync))}` : 'directory not synced yet'}</div></div>
    </div>`;
}

async function lookupGamSync(e, id) {
  e.preventDefault(); // mousedown: the field must not blur
  if (GAM_SYNCING) return;
  GAM_SYNCING = true;
  lookupInput(id); // repaint in place: the action row becomes the progress line
  try {
    const { added } = await API.gamSync();
    toast(added ? `${added} new ad unit${added > 1 ? 's' : ''}` : 'Nothing new');
  } catch (err) {
    toast(err.message, 'bad');
  } finally {
    GAM_SYNCING = false;
  }
  // Re-run the search that asked, with whatever is typed NOW — but only while its menu
  // is still open. A person who moved on gets the toast, never a menu popping back up.
  if (document.getElementById(id)?.querySelector('.lk-menu.open')) lookupInput(id);
}


// ---------- lookup: type-to-find, the same shape as the slot's ad-unit search ----------
// Ops search; they do not browse grids of cards. One input, two-line suggestions
// (what it is on top, where it points underneath), pick and move on.

let LOOKUP_SEQ = 0;
const LOOKUP_REGISTRY = {};

/**
 * Typeahead with an optional provider pre-picker. GOTCHA: menu rows use onmousedown
 * (not click) so the input never blurs before the pick lands.
 * @param {{value?: string, placeholder?: string, pickers?: {v,label}[], picked?: string,
 *          icon?: string, wide?: boolean,
 *          search: (q, scope, provider) => {items...}|Promise,
 *          emptyText?: (q, provider) => string,
 *          onPick: (item) => void}} opts
 * @returns {string} html
 */
function lookupHtml(opts) {
  const id = 'lk_' + (++LOOKUP_SEQ);
  LOOKUP_REGISTRY[id] = opts;
  if (opts.scopes) LOOKUP_REGISTRY[id].scope = opts.scope ?? opts.scopes[0].v;
  if (opts.pickers) LOOKUP_REGISTRY[id].picked = opts.picked ?? opts.pickers[0].v;
  const pre = (opts.icon || opts.pickers) ? `
    <span class="lk-pre">
      ${opts.icon || ''}
      ${opts.pickers ? `
        <button type="button" class="lk-pvd" onmousedown="lookupPickerToggle(event, '${id}')">
          <span class="lk-pvd-t">${esc((opts.pickers.find(x => x.v === LOOKUP_REGISTRY[id].picked) || opts.pickers[0]).label)}</span><i>▾</i>
        </button>
        <div class="lk-pvd-menu">${opts.pickers.map(o =>
          `<div class="lk-pvd-opt ${o.v === LOOKUP_REGISTRY[id].picked ? 'on' : ''}"
            onmousedown="lookupPick2(event, '${id}', '${esc(o.v)}')">${esc(o.label)}</div>`).join('')}</div>` : ''}
    </span>` : '';
  return `
    <div class="lookup ${opts.wide ? 'wide' : ''} ${pre ? 'has-pre' : ''}" id="${id}"${opts.quiet ? ' data-quiet="1"' : ''}>
      ${pre}
      <input value="${esc(opts.value || '')}" placeholder="${esc(opts.placeholder || 'type to search…')}"
        oninput="lookupInput('${id}')" onfocus="lookupFocus('${id}')"
        onclick="lookupOpen('${id}')" onblur="lookupBlur('${id}')">
      <div class="lk-menu"></div>
    </div>`;
}

// mousedown throughout, so the field never loses focus and the results menu stays put.
function lookupPickerToggle(e, id) {
  e.preventDefault();
  e.stopPropagation();
  document.getElementById(id)?.classList.toggle('pvd-open');
}

function lookupPick2(e, id, v) {
  e.preventDefault();
  e.stopPropagation();
  const box = document.getElementById(id);
  const reg = LOOKUP_REGISTRY[id];
  box?.classList.remove('pvd-open');
  if (!reg || reg.picked === v) return;
  reg.picked = v;
  const opt = (reg.pickers || []).find(x => x.v === v);
  const t = box?.querySelector('.lk-pvd-t');
  if (t && opt) t.textContent = opt.label;
  box?.querySelectorAll('.lk-pvd-opt').forEach(el => el.classList.remove('on'));
  [...(box?.querySelectorAll('.lk-pvd-opt') || [])].find(el => el.textContent === opt?.label)?.classList.add('on');
  lookupInput(id);
}

// The scope switch narrows what the search looks at. mousedown, not click, so the
// field never loses focus and the caret survives — the same reason results are picked
// on mousedown.
function lookupScope(e, id, v) {
  e.preventDefault();
  const reg = LOOKUP_REGISTRY[id];
  if (!reg || reg.scope === v) return;
  reg.scope = v;
  lookupInput(id);
}

// Focusing a field opens its menu — except when it is marked QUIET. Two callers want
// that: a screen that focused the field for you (landing on a form with a full-height
// menu already covering it is not a head start), and a field that ALREADY HOLDS its
// answer (7 Sep — an ad unit's name field, whose focus now opens that unit's settings:
// covering them with a one-row menu naming the unit you already picked is noise, not
// help). Quiet costs nothing: the value is still selected, so typing replaces it and
// the menu opens on the first keystroke, and a second click opens it outright.
function lookupFocus(id) {
  const box = document.getElementById(id);
  if (!box) return;
  if (box.dataset.quiet) {
    delete box.dataset.quiet;
    // The click that CAUSED this focus must not reopen what focus just declined to
    // open; a later click (or a Tab that never clicks) is a real ask. Stamped rather
    // than flagged, so a keyboard landing never swallows the next click.
    box.dataset.quietAt = String(Date.now());
    box.querySelector('input').select();
    return;
  }
  box.querySelector('input').select();
  lookupInput(id);
}

// A field the screen focused for you never fired a focus event of its own, so clicking
// it would otherwise do nothing at all — a dead click on the one control you came for.
function lookupOpen(id) {
  const box = document.getElementById(id);
  const menu = box?.querySelector('.lk-menu');
  if (!menu || menu.classList.contains('open')) return;
  if (box.dataset.quietAt && Date.now() - Number(box.dataset.quietAt) < 500) {
    delete box.dataset.quietAt;
    return;
  }
  lookupInput(id);
}

async function lookupInput(id) {
  const box = document.getElementById(id);
  if (!box) return;
  const reg = LOOKUP_REGISTRY[id];
  const q = box.querySelector('input').value.trim();
  const items = await reg.search(q, reg.scope, reg.picked);
  // A slower earlier keystroke must never overwrite a newer one.
  const live = document.getElementById(id);
  if (!live || live.querySelector('input').value.trim() !== q) return;
  reg._items = items;
  const menu = live.querySelector('.lk-menu');
  const scopeBar = reg.scopes ? `
    <div class="lk-scope">
      ${reg.scopes.map(sc => `
        <button type="button" class="${sc.v === reg.scope ? 'on' : ''}"
          onmousedown="lookupScope(event, '${id}', '${esc(sc.v)}')">${sc.icon || ''}${esc(sc.label)}</button>`).join('')}
    </div>` : '';
  // Group headers make an invisible filter visible: you see the family you are
  // searching, and anything excluded sits below it greyed, saying why.
  let lastGroup = null;
  const rows = items.map((it, i) => {
    const head = it.group && it.group !== lastGroup
      ? `<div class="lk-group">${esc(it.group)}</div>` : '';
    lastGroup = it.group ?? lastGroup;
    return head + (it.disabled
      ? `<div class="lk-item off">
           <div class="lk-title">${it.icon || ''}${esc(it.title)}</div>
           <div class="lk-sub why">${esc(it.why || '')}</div>
         </div>`
      : `<div class="lk-item" onmousedown="lookupPick('${id}', ${i})">
           <div class="lk-title">${it.icon || ''}${esc(it.title)}${it.badge ? `<span class="lk-badge ${esc(it.badgeKind || '')}">${esc(it.badge)}</span>` : ''}</div>
           ${it.sub ? `<div class="lk-sub">${esc(it.sub)}</div>` : ''}
         </div>`);
  }).join('');
  const note = items.note || '';
  const empty = note ? '' : `<div class="lk-empty">${esc(reg.emptyText ? reg.emptyText(q, reg.picked) : 'Nothing matches')}</div>`;
  menu.innerHTML = scopeBar
    + (items.length ? rows : empty)
    // The directory's own door, when a search attaches it (see lookupGamRowHtml):
    // an action row, never a result — it sits after the results, above the note bar.
    + (items.gam ? lookupGamRowHtml(id, items.gam) : '')
    + (note ? `<div class="lk-note">${note}</div>` : '');
  menu.classList.add('open');
}

function lookupPick(id, i) {
  const reg = LOOKUP_REGISTRY[id];
  document.getElementById(id)?.querySelector('.lk-menu')?.classList.remove('open');
  reg.onPick(reg._items[i]);
}

function lookupBlur(id) {
  setTimeout(() => document.getElementById(id)?.querySelector('.lk-menu')?.classList.remove('open'), 150);
}

// ---------- drag to reorder ----------
// Replaces ↑↓ per row. Two buttons cost 40px on every rung whether or not anyone ever
// uses them; a grip costs 14px and only shows on hover. The insertion point is drawn as
// a line between rows, so where it will land is never a guess.
const DRAG_HANDLERS = {};
let DRAG_FROM = null;

/**
 * Register the reorder handler for one drag group; rows opt in via dragAttrs(key, i).
 * Re-registering on every render is by design — the handler closes over fresh state.
 * @param {string} key             unique per list instance
 * @param {(from: number, to: number) => void} fn
 */
function registerDrag(key, fn) { DRAG_HANDLERS[key] = fn; }

function dragAttrs(key, i) {
  if (!key) return '';
  return `draggable="true" data-dkey="${esc(key)}" data-di="${i}"`
    + ` ondragstart="dragStart(event)" ondragover="dragOver(event)"`
    + ` ondragleave="dragLeave(event)" ondrop="dragDrop(event)" ondragend="dragEnd(event)"`;
}

function dragStart(e) {
  const row = e.currentTarget;
  DRAG_FROM = { key: row.dataset.dkey, i: Number(row.dataset.di) };
  e.dataTransfer.effectAllowed = 'move';
  e.dataTransfer.setData('text/plain', String(DRAG_FROM.i));
  row.classList.add('dragging');
}

function dragOver(e) {
  const row = e.currentTarget;
  if (!DRAG_FROM || row.dataset.dkey !== DRAG_FROM.key) return;
  e.preventDefault();
  const i = Number(row.dataset.di);
  row.classList.toggle('drop-above', i < DRAG_FROM.i);
  row.classList.toggle('drop-below', i > DRAG_FROM.i);
}

function dragLeave(e) {
  e.currentTarget.classList.remove('drop-above', 'drop-below');
}

function dragDrop(e) {
  const row = e.currentTarget;
  row.classList.remove('drop-above', 'drop-below');
  if (!DRAG_FROM || row.dataset.dkey !== DRAG_FROM.key) return;
  e.preventDefault();
  const to = Number(row.dataset.di);
  const from = DRAG_FROM.i;
  DRAG_FROM = null;
  if (from !== to) DRAG_HANDLERS[row.dataset.dkey]?.(from, to);
}

function dragEnd() {
  DRAG_FROM = null;
  document.querySelectorAll('.dragging, .drop-above, .drop-below')
    .forEach(el => el.classList.remove('dragging', 'drop-above', 'drop-below'));
}

// ---------- ONE BREAK-CHIP ROW, THREE SCREENS (both lists + the placements glimpse) ----------
// Every slot type in meta order, with a split drawn where the family changes. The caller
// says only how its own chip reads; the walk and the split rule live here once.

function slotChipRowHtml(chipClass) {
  let last = null;
  const out = [];
  for (const t of KL_META.slotTypes) {
    const fam = slotFamily(t);
    if (last && fam !== last) out.push('<span class="uchip-split"></span>');
    last = fam;
    out.push(`<span class="uchip ${chipClass(t)}">${esc(label('slotShort', t))}</span>`);
  }
  return `<span class="uchips">${out.join('')}</span>`;
}

// ---------- diff (drives the confirm dialog) ----------

function formDiff(original, data, fields) {
  const changes = [];
  for (const f of fields) {
    const a = JSON.stringify(original[f]);
    const b = JSON.stringify(coerceLike(original[f], data[f]));
    if (a !== b) changes.push({ field: f, from: original[f], to: data[f] });
  }
  return changes;
}

function coerceLike(sample, v) {
  if (typeof sample === 'number') return Number(v);
  if (typeof sample === 'boolean') return !!v;
  return v;
}



// ---------- how ads behave: ONE renderer, both rooms (25 Aug) ----------
// Behaviour lives on the SLOT inside the ad setup, so these rows are drawn by the ops
// editor to be changed and by the integration to be read. The adapter decides which:
// give it writers and it edits; give it only `v`/`tv` and `ro:true` and it reads.

const jsLit = v => (typeof v === 'string' ? `'${v}'` : v);

// Shared row primitives — the same lr grammar as everything else in the product.
// `why` is the hover: a control carries its label, the explanation lives on hover.
/**
 * One settings row: label column + control, hover-why on the row.
 * @param {string} l    row label
 * @param {string} c    control markup (already-built html)
 * @param {string} [why] title text
 * @returns {string} html
 */
function accRow(l, c, why, changed) {
  return `
    <div class="lr rule${chgIf(changed)}"${why ? ` title="${esc(why)}"` : ''}>
      <span class="lr-grip ghost"></span>
      <span class="lr-l">${esc(l)}</span>
      <span class="lr-ctl form">${c}</span>
    </div>`;
}

/**
 * Segmented control. GOTCHA: `click` receives the option and must return a STRING of
 * JS for the inline onclick (e.g. o => `pbSet(0, 'playback', '${o}')`) — it is not the
 * handler itself. Pass cur=undefined to render with nothing selected (the clean slate).
 * @param {*} cur                     selected option, or undefined for none
 * @param {*[]} opts                  option values
 * @param {string[]} labels           same order as opts
 * @param {(o: *) => string} click    builds the onclick code string
 * @param {string} [why]              disables the WHOLE control, reason on hover
 * @param {(o: *) => string} [whyFor]  disables ONE option, reason on hover (7 Sep, user
 *   review — a seg whose other answer is merely unavailable used to grey whole, which
 *   dimmed the live answer too and read as "nothing is chosen". The refused option now
 *   greys where it sits with its reason, the house rule everywhere else on the page.)
 * @returns {string} html
 */
function accSeg(cur, opts, labels, click, why, whyFor) {
  const per = o => (why ? '' : (whyFor && whyFor(o)) || '');
  return `<div class="seg small${why ? ' off' : ''}"${why ? ` title="${esc(why)}"` : ''}>${opts.map((o, ix) => {
    const dead = why || per(o);
    return `<button type="button"${dead ? ' disabled' : ''}${per(o) ? ` title="${esc(per(o))}"` : ''} class="${String(cur) === String(o) ? 'on' : ''}"${dead ? '' : ` onclick="${click(o)}"`}>${esc(labels[ix])}</button>`;
  }).join('')}</div>`;
}



// ---------- ONE BREAK, ONE FIXED LIST OF ROWS (25 Aug night, user call) ----------
// `a` is the adapter the caller supplies (see suBhvAdapter in views-setups-editor.js):
//   a.v(f) / a.tv(f) / a.tvSec(f)   the value, its typed text, its text in seconds
//   a.set(f, o) / a.num(f) / a.numSec(f) / a.text(f)   inline-handler STRINGS for writes
//   a.dirty(f)                       changed since the last save (tints the row)
//   a.differs(f), a.differsWord      set differently on another placement (the marker)
//   a.rungCount()                    live rungs, for the counted timeout note
//
// THE LAYOUT IS FIXED BY BREAK TYPE AND NEVER BY A VALUE. A mid-roll has no "plays at
// start" — that is what the break IS, and it is stable. But a control that merely cannot
// APPLY right now stays exactly where it is, greyed, saying why on hover: nothing
// appears, nothing vanishes, nothing moves under the cursor. This reverses POD-SCOPE's
// progressive disclosure ("the whole trick is progressive disclosure") on the user's
// call — four different reveal grammars had grown around one idea, and one of them was
// hiding a live control (see `Break lasts` below).
function behaviourRowsHtml(t, a) {
  // `why` non-empty = this control cannot apply right now. It greys, it does not go.
  const row = (key, l, c, why) => `
    <div class="lr rule ${why ? 'dim' : ''}${chgIf(a.dirty && a.dirty(key))}"${why ? ` title="${esc(why)}"` : ''}>
      <span class="lr-grip ghost"></span>
      <span class="lr-l">${esc(l)}${a.differs && a.differs(key) ? `<i class="bdot" title="${esc(a.differsWord || 'Set differently elsewhere')}"></i>` : ''}</span>
      <span class="lr-ctl form">${c}</span>
    </div>`;
  const seg = (f, opts, labels, why) => `<div class="seg small${why ? ' off' : ''}">${opts.map((o, ix) =>
    `<button type="button"${why ? ' disabled' : ''} class="${String(a.v(f)) === String(o) ? 'on' : ''}"${why ? '' : ` onclick="${a.set(f, o)}"`}>${esc(labels[ix])}</button>`).join('')}</div>`;
  const mix = f => (a.v(f) === undefined ? 'mixed' : '');
  // A number whose row already names its unit passes '' and wears no suffix at all —
  // an empty suffix span would just hold dead space beside the value.
  const num = (f, unit, why) => `<div class="num-wrap${why ? ' off' : ''}"><input value="${esc(a.tv(f))}" placeholder="${esc(mix(f))}" inputmode="numeric"${why ? ' disabled' : ''} oninput="${a.num(f)}">${unit ? `<span class="unit">${esc(unit)}</span>` : ''}</div>`;
  // A field the JSON keeps in milliseconds, asked for in SECONDS (3 Sep, user call):
  // the box shows and takes seconds, the adapter converts on the way to the model.
  const numSec = (f, why) => `<div class="num-wrap${why ? ' off' : ''}"><input value="${esc(a.tvSec ? a.tvSec(f) : a.tv(f))}" placeholder="${esc(mix(f))}" inputmode="decimal"${why ? ' disabled' : ''} oninput="${a.numSec ? a.numSec(f) : a.num(f)}"><span class="unit">sec</span></div>`;
  const text = (f, ph, why) => `<span class="rule-text${why ? ' off' : ''}"><input type="text" value="${esc(a.tv(f))}" placeholder="${esc(mix(f) || ph)}"${why ? ' disabled' : ''} oninput="${a.text(f)}"></span>`;
  const note = (s, why) => `<span class="podl${why ? ' off' : ''}">${esc(s)}</span>`;
  const rj = (s, why) => `<span class="rj${why ? ' off' : ''}">${esc(s)}</span>`;
  // WHO ELSE BIDS FOR THIS SLOT (10 Sep; re-cut twice 11 Sep, the second on the user's
  // call — *"move header bidding to the top of delivery settings; three options upfront —
  // auto, off, customize — and if customize is clicked then ask for Amazon+Prebid, Amazon
  // or Prebid. No need of a modal or dialog."*). THE FIRST ROW OF EVERY BREAK'S DELIVERY
  // SETTINGS, and it is inline: a seg of the three STATES — `Auto` borrows the setup's
  // answer (and says what that is today, as a quiet note beside it, so nobody scrolls up
  // to learn it), `Off` refuses bidders, `Custom` is this break's own — and, only while
  // Custom stands, a second seg under it with the partners. `Custom` rather than the
  // user's "Customize": the page already says `Custom │ Global` about every break's
  // waterfall, and a slot's own answer should wear one word everywhere. Choosing Custom
  // starts from the setup's own partners when it has some, so "make it mine" is one click.
  // The dialog that stood here for an hour is gone on the same call — the decision is two
  // segs, and two segs belong on the row.
  const hbRow = () => {
    if (!a.set) return '';
    const cur = a.v('headerBidding') || 'auto';
    const mode = cur === 'auto' ? 'auto' : cur === 'off' ? 'off' : 'custom';
    const partners = hbPartners();
    const served = a.hbServed ? a.hbServed() : '';
    const start = partners.includes(served) ? served : partners[0];
    const modes = [['auto', 'Auto', 'auto'], ['off', 'Off', 'off'], ['custom', 'Custom', start]];
    const modeSeg = `<div class="seg small">${modes.map(([m, l, v]) =>
      `<button type="button" class="${mode === m ? 'on' : ''}" onclick="${a.set('headerBidding', v)}">${l}</button>`).join('')}</div>`;
    const partnerSeg = mode !== 'custom' ? '' : `<div class="seg small">${partners.map(p =>
      `<button type="button" class="${cur === p ? 'on' : ''}" onclick="${a.set('headerBidding', p)}">${esc(label('headerBidding', p))}</button>`).join('')}</div>`;
    return row('headerBidding', fieldName('headerBidding'), `
      <div class="hb-ctl">
        <div class="hb-l1">${modeSeg}${mode === 'auto' && served ? note(label('headerBidding', served)) : ''}</div>
        ${partnerSeg}
      </div>`);
  };
  const pods = Number(a.v('podAds')) || 1;
  // The one thing a break plays more than one ad for. Two of the four fields that used
  // to hide behind it are NOT pod-only, so only these two grey out.
  const podOnly = pods > 1 ? '' : 'Applies once a break plays more than one ad';

  // ---- the rows, in ONE deliberate order, the same skeleton on every break type ----
  // when it interrupts → what the viewer hears → how much of their time it takes →
  // how hard we work to fill it. No headings: a break is one idea, not three.
  const whenPre = () => {
    const off = a.v('start') !== 'deferred' ? 'Only when the pre-roll is deferred' : '';
    return row('start', 'Start offset', `${seg('start', ['start', 'deferred'], ['Immediate', 'Delayed'])}
      ${rj('by', off)}${num('deferSec', 'sec', off)}`);
  };
  const videoStarts = () => {
    const off = a.v('wait') !== 'timed' ? 'Only when the video waits a set time for the ad' : '';
    return row('wait', 'Hold video for the ad', `${seg('wait', KL_META.prerollWaits, KL_META.prerollWaits.map(w => label('wait', w)))}
      ${numSec('waitMs', off)}`);
  };
  // The pre-roll's head start (the JSON's minPreRenderTime): at least this much video
  // plays before the ad may render — nothing ever covers the first frame.
  // It can only be honoured while content is actually playing: hold the video for the
  // ad and there is no content yet to play first (3 Sep, user call).
  const headStart = () => {
    const held = a.v('wait') !== 'immediate';
    const why = held ? 'The video is held for the ad, so nothing plays before it — set “Hold video for the ad” to No hold' : '';
    return row('minContentSec', 'Min content playback',
      `${num('minContentSec', 'sec', why)}${note('of video plays first', why)}`, why);
  };
  // Cadence is one decision in two shapes, so BOTH shapes are always on screen and the
  // unchosen one greys — where the old editor swapped one row's control type outright.
  const whenMid = () => {
    const byPos = a.v('mode') === 'interval' ? 'The break positions are set below, not here' : '';
    const byInt = a.v('mode') === 'cuepoints' ? 'The interval is set above, at set positions' : '';
    // Break cap died 1 Sep (user call): a cadence runs the video out — at set positions
    // the positions are the cap. Refused by name at the door, like every cut field.
    return `
      ${row('mode', 'Scheduling', `${seg('mode', KL_META.midrollModes, KL_META.midrollModes.map(m => label('mode', m)))}`)}
      ${row('cuepoints', 'Cue points', text('cuepoints', '2:00, 6:00, 9:30', byPos), byPos)}
      ${row('firstAt', 'First break offset', `${num('firstAt', 'sec', byInt)}${rj('repeat every', byInt)}${num('every', 'sec', byInt)}`, byInt)}`;
  };
  // Ad audio is CUT (2 Sep, user call): how a player starts is the surface's own
  // Player config now, per placement — nothing about it left to decide on the slot.
  // What a break may take of the viewer's time. `Break lasts` and `If an ad runs over`
  // are NOT pod-only: under 'strict' the ask carries "nothing longer than what's left",
  // so a 60s budget discards a 90s ad and tries the next rung on a ONE-ad break too.
  // They used to hide at `podAds = 1`, which made a live length cap unreachable.
  const takesRows = () => `
    ${row('podAds', fieldName('podAds'), `${seg('podAds', [1, 2, 3], ['1', '2', '3'])}`)}`;
  // How we go and get them: how deep, how long each try, and — once there is more than
  // one ad — where the next one comes from. `Display ad position` was cut here 8 Sep:
  // it said "position" about the pod while the unit's own `Ad placement` says it about
  // the screen. Removed, not hidden — a payload still carrying it is refused by name.
  const fillRows = () => {
    const cfg = a.rungCount ? a.rungCount() : 0;
    const ms = Number(a.v('tagTimeoutMs')) || 0;
    // The unreachable tail, counted from the two numbers on screen (31 Aug). This is the
    // web-side MIRROR of `unreachableTail` in api/store/ladders.js — same arithmetic, said
    // live while you type rather than on save. No bundler, so the two sides of HTTP cannot
    // share a module; move them together (as with servedHeaderBidding / suHbServed).
    const fillNote = () => {
      const fill = Number(a.v('fillTimeoutSec')) || 0;
      if (!fill || !ms || cfg < 2) return '';
      const reachable = Math.max(1, Math.floor((fill * 1000) / ms));
      // Only the fact worth interrupting for survives, and only when it is TRUE.
      return reachable < cfg ? `the last ${cfg - reachable} ${cfg - reachable === 1 ? 'try' : 'tries'} would never run` : '';
    };
    return `
      ${t !== 'preroll' ? row('prefetchSec', 'Prefetch', `${num('prefetchSec', 'sec early')}`) : ''}
      ${row('tagTimeoutMs', 'Request timeout', `${numSec('tagTimeoutMs')}${note('')}`)}
      ${row('fillTimeoutSec', 'Total timeout', `${num('fillTimeoutSec', 'sec')}${note(fillNote())}`)}
      ${row('nextAd', fieldName('nextAd'), seg('nextAd', KL_META.podNextAds, KL_META.podNextAds.map(x => label('podNextAd', x)), podOnly), podOnly)}`;
  };

  // A BREATH BETWEEN CLUSTERS (31 Aug, design pass): the order is unchanged — when it
  // interrupts → what the viewer hears → what it takes → how hard we fill it — but each
  // idea now ends with a slightly larger gap. Rhythm, not headings: the 25 Aug "one flat
  // list, no group headings" call stands.
  const gap = '<div class="lr-gap"></div>';
  // Header bidding leads every break (11 Sep, user call) — who else is in the auction is
  // decided before how the break is paced — as its own cluster, then the rest as before.
  if (t === 'preroll') return `${hbRow()}${gap}${whenPre()}${videoStarts()}${headStart()}${gap}${takesRows()}${gap}${fillRows()}`;
  if (t === 'midroll') return `${hbRow()}${gap}${whenMid()}${gap}${takesRows()}${gap}${fillRows()}`;
  if (t === 'postroll') return `${hbRow()}${gap}${takesRows()}${gap}${fillRows()}`;
  // A rotation is not a break: banners take turns, so it has no pod, no walk depth and
  // no next-ad question. Structural, not a reveal.
  const cfg = a.rungCount ? a.rungCount() : 0;
  const ms = Number(a.v('tagTimeoutMs')) || 0;
  // Out-stream: banners while nothing plays. Its show times are its own schedule, each
  // show worth `Repeats per show` banners, and its count wears the breaks' own words:
  // Total Target Impressions, typed, because a rotation runs all session where a break
  // picks from 1/2/3. THE IN-STREAM SWITCH IS BACK (16 Sep, user call) — the 8 Sep cut
  // assumed every player steps the banner aside for a video ad, and that is an answer
  // the publisher owns, not one the panel gets to make on their behalf. It sits under
  // the counts because it is about what the banner does, not how many of them there are.
  //
  // WHAT THE SCHEDULE ACTUALLY ASKS FOR, counted from the two numbers above it (never
  // estimated): shows × repeats. It sits on the repeat row so the reader sees it against
  // the target on the next line and can tell which of the two to move. At one repeat
  // there is no arithmetic to show — the Schedule row is already the whole answer — so
  // the note stands only once a show is worth more than one banner.
  const shows = Array.isArray(a.v('times')) ? a.v('times').length : 0;
  const reps = Number(a.v('perShow')) || 0;
  const asked = shows && reps > 1 ? shows * reps : 0;
  return `
    ${hbRow()}
    ${gap}
    ${row('times', 'Schedule', `${text('times', '8:00, 16:00')}`)}
    ${row('hold', 'Display duration', `${num('hold', 'sec')}`)}
    ${row('perShow', fieldName('perShow'), `${num('perShow', '')}${note(asked ? `${asked} banner${asked === 1 ? '' : 's'} a session` : '')}`)}
    ${row('perSession', fieldName('perSession'), `${num('perSession', '')}`)}
    ${row('hideOnInStreamAd', fieldName('hideOnInStreamAd'), seg('hideOnInStreamAd', [true, false], [label('hideOnInStreamAd', true), label('hideOnInStreamAd', false)]))}
    ${gap}
    ${row('tagTimeoutMs', 'Request timeout', `${numSec('tagTimeoutMs')}${note(cfg ? `${cfg} × ${fmtMs(ms)}` : '')}`)}`;
}


// ---------- CARD PICKERS SEARCH ONCE THEY PASS A HANDFUL (7 Sep, UAT P1) ----------
// The choosers and the setup map were a wall of 67 cards in the scale scenario. Above
// eight cards a search sits over the grid and filters in place — no rerender, the caret
// stays. Cards carry their words in data-q; the create card never hides.
// (The two ad-setup doors left this helper on 8 Sep: their field is always drawn and
// always at the top right — see `spBarHtml` in views-keys-editor-load.js.)
function dlgSearchHtml(n, placeholder) {
  if (n <= 8) return '';
  return `<input class="search dlg-search" type="search" placeholder="${esc(placeholder || 'Search…')}"
    oninput="dlgCardsFilter(this)" aria-label="${esc(placeholder || 'Search')}">`;
}
function dlgCardsFilter(el) {
  const q = (el.value || '').trim().toLowerCase();
  const grid = el.parentElement.querySelector('.dlg-cards');
  if (!grid) return;
  let shown = 0;
  grid.querySelectorAll('.dlg-card').forEach(c => {
    if (c.classList.contains('create')) return;
    const hit = !q || (c.dataset.q || c.textContent).toLowerCase().includes(q);
    c.hidden = !hit;
    if (hit) shown++;
  });
  let none = grid.parentElement.querySelector('.dlg-none');
  if (!shown && q) {
    if (!none) grid.insertAdjacentHTML('afterend', '<div class="dlg-none">Nothing matches</div>');
  } else if (none) none.remove();
}

// ---------- THE SHEET'S ANATOMY — what an empty body says instead of a sentence ----------
// (15 Sep, user call — *"when we open the create new custom config or a bulk change in player
// behaviour the modal looks empty; how can we in a clean way communicate how to initiate the
// flow without putting up too much text which no one will read"*.)
//
// Both pick-then-answer sheets open on one small strip above 430px of white, and the two of them
// explained that white differently: the config sheet with a full sentence — *"Follows the default
// in everything — pick a setting above to give this config its own answer"* — and the cohort
// sheet with nothing at all. One is the text nobody reads; the other is a screen that looks
// broken. Neither is the sheet.
//
// What stands there now is the sheet's own STRUCTURE: the sections a pick can land in, in the
// order they will appear, each with how many settings it holds — greyed until something arrives.
// It is not a caption ABOUT the screen, it is the screen with nothing in it yet, which is why it
// needs no instruction: the first pick lands under a heading the reader has already looked at,
// and that heading goes live where it already stood. It is drawn in the real section header's
// own type for the same reason.
//
// `groups` is the very list the picker is built from ({ name, rows }), so the map and the menu
// can never name different sections or count differently. A section whose rows are all refused
// is not the section's to give and is not counted (`off`, as `pickerHtml` reads it).
function sheetAnatomyHtml(groups, h) {
  const rows = groups.map(g => {
    const n = g.rows.filter(r => !(h && h.off && h.off(r.v))).length;
    return `
      <div class="sh-anat-r">
        <span class="sh-anat-n">${esc(g.name)}</span>
        <span class="sh-anat-c">${n} setting${n === 1 ? '' : 's'}</span>
      </div>`;
  }).join('');
  return `<div class="sh-anat">${rows}</div>`;
}

// ---------- CHANGES TO APPLY — every bulk sheet's queue, beside the fields that made it ----------
// Shared by the ad sheet and the player sheet (14 Sep, user call — *"can we have them the same
// way as the change ad behaviour pending changes on the right side section; the pending changes
// can be renamed to something clear and communicative"*). One card, one tinted header, no nested
// boxes: a row is the field, the answer underneath, and an × that surfaces on hover. Empty, it
// says so in a few words and holds its ground, so the sheet does not resize as the queue fills.
//
// A COHORT IS SET, NOT CHANGED (15 Sep, user call — *"we dont have a pre value since we are
// setting it up so we dont need that it is changed from this to that"*). The row used to print
// `was → now` on every sheet, and on the two cohort sheets the `was` was never a value: forty
// integrations hold forty answers, so it read `3 different values → Muted`, or — worse — `on →
// on`. A queue is the list of answers you are about to write; the row is now the field and the
// ANSWER, in one clean line. Where a real prior value exists (the custom-config sheet, where a
// config's own default IS the thing being overridden) the caller still passes `from` and the
// row still draws the arrow. What the cohort holds today is not lost: it stands beside every
// field on the sheet itself, and the change review counts it one screen later.
//
// `rows` are `{ label, to, from?, drop }` — `drop` being the inline-handler STRING for that
// row's ×, `from` the optional prior value. `opts.clear` is the same for the header's Clear,
// `opts.empty` the words for an empty queue.
// `opts.max` FOLDS THE TAIL RATHER THAN SCROLLING IT (15 Sep, user call — *"why two different
// scroll for lhs and rhs isnt it confusing"*). A card that scrolls beside a list that scrolls
// gives one screen two scrollbars an inch apart, moving different things. So the card never
// scrolls: past `max` it shows a counted line pointing at the screen that holds them all —
// the change review, which is one button away and exists to be read in full. Nothing becomes
// unreachable, because a change is dropped by its own row's × as well as by the card's.
// Callers that pass no `max` get exactly the card they always had.
function changesCardHtml(rows, opts = {}) {
  const shown = opts.max && rows.length > opts.max ? rows.slice(0, opts.max) : rows;
  const hidden = rows.length - shown.length;
  return `<aside class="bqp">
    <div class="bqp-card">
      <div class="bqp-hd">
        <span>Changes to apply${rows.length ? ` · ${rows.length}` : ''}</span>
        <span class="bqs-gap"></span>
        ${rows.length && opts.clear ? `<button type="button" class="zlink" onclick="${opts.clear}">Clear</button>` : ''}
      </div>
      ${shown.map(r => `
        <div class="bqp-r">
          <div class="bqp-top">
            <span class="bqp-f">${esc(r.label)}</span>
            ${r.drop ? `<button type="button" class="bqs-x" onclick="${r.drop}">×</button>` : ''}
          </div>
          <div class="bqp-vc">${r.from === undefined || r.from === null
            ? '' : `${esc(r.from)}<i class="rvw-arr">→</i>`}<b>${esc(r.to)}</b></div>
        </div>`).join('')}
      ${hidden ? `<div class="bqp-more">+${hidden} more — every one of them on the next screen</div>` : ''}
      ${rows.length ? '' : `<div class="bqp-empty">${esc(opts.empty || 'Nothing changed yet')}</div>`}
    </div>
  </aside>`;
}
