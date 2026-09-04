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
  toast(first ? first.message : err.message, 'bad');
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


// ---------- segmented enum ----------




// ---------- toggle ----------




// ---------- text + number ----------

function textInput(el, field) {
  FORM.data[field] = el.value;
  clearErr(field);
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

// ---------- attach picker (radio cards) ----------



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
function selectHtml(value, options, pickFn) {
  const id = 'sel_' + (++SELECT_SEQ);
  SELECT_REGISTRY[id] = { options, pickFn };
  const cur = options.find(o => o.v === value);
  return `
    <div class="select" id="${id}" onclick="selectClick(event, '${id}')">
      <span class="sel-label">${esc(cur ? cur.label : 'Choose…')}</span><span class="sel-chev">▾</span>
      <div class="sel-menu">${options.map(o =>
        `<div class="sel-opt ${o.v === value ? 'on' : ''}" data-v="${esc(o.v)}">${esc(o.label)}</div>`).join('')}
      </div>
    </div>`;
}

function selectClick(e, id) {
  const el = document.getElementById(id);
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
  if (!e.target.closest('.pswitch')) {
    document.getElementById('prop-global')?.classList.remove('open');
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
    <div class="lk-sync" onmousedown="lookupGamSync(event, '${id}')"
      title="Pulls newly trafficked ad units from GAM — takes 10–20 seconds; you can keep working">
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
    toast(added ? `${added} new ad unit${added > 1 ? 's' : ''} pulled from GAM` : 'GAM is up to date — nothing new');
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
    <div class="lookup ${opts.wide ? 'wide' : ''} ${pre ? 'has-pre' : ''}" id="${id}">
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

// Focusing a field opens its menu — except when the screen focused it for you. Landing
// on a form with a full-height menu already covering it is not a head start.
function lookupFocus(id) {
  const box = document.getElementById(id);
  if (!box) return;
  if (box.dataset.quiet) { delete box.dataset.quiet; return; }
  box.querySelector('input').select();
  lookupInput(id);
}

// A field the screen focused for you never fired a focus event of its own, so clicking
// it would otherwise do nothing at all — a dead click on the one control you came for.
function lookupOpen(id) {
  const box = document.getElementById(id);
  const menu = box?.querySelector('.lk-menu');
  if (!menu || menu.classList.contains('open')) return;
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
function accRow(l, c, why) {
  return `
    <div class="lr rule"${why ? ` title="${esc(why)}"` : ''}>
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
 * @param {string} [why]              disables the control, reason on hover
 * @returns {string} html
 */
function accSeg(cur, opts, labels, click, why) {
  return `<div class="seg small${why ? ' off' : ''}"${why ? ` title="${esc(why)}"` : ''}>${opts.map((o, ix) =>
    `<button type="button"${why ? ' disabled' : ''} class="${String(cur) === String(o) ? 'on' : ''}"${why ? '' : ` onclick="${click(o)}"`}>${esc(labels[ix])}</button>`).join('')}</div>`;
}



// ---------- ONE BREAK, ONE FIXED LIST OF ROWS (25 Aug night, user call) ----------
// `a.only` (an array of field names) narrows the rows to the ones the caller may set —
// the integration passes the locally-overridable set, the ops editor passes nothing and
// gets all of them. `a.local(f)` decorates a row the caller has overridden. ONE renderer,
// both rooms, so the two never drift into looking like different products.
//
// THE LAYOUT IS FIXED BY BREAK TYPE AND NEVER BY A VALUE. A mid-roll has no "plays at
// start" — that is what the break IS, and it is stable. But a control that merely cannot
// APPLY right now stays exactly where it is, greyed, saying why on hover: nothing
// appears, nothing vanishes, nothing moves under the cursor. This reverses POD-SCOPE's
// progressive disclosure ("the whole trick is progressive disclosure") on the user's
// call — four different reveal grammars had grown around one idea, and one of them was
// hiding a live control (see `Break lasts` below).
function behaviourRowsHtml(t, a) {
  const shows = f => !a.only || a.only.includes(f);
  // `why` non-empty = this control cannot apply right now. It greys, it does not go.
  const row = (key, l, c, why, hint) => (shows(key) ? `
    <div class="lr rule ${a.local && a.local(key) ? 'bent' : ''} ${why ? 'dim' : ''} ${a.pick && !a.picked(key) ? 'idle' : ''}"${why || hint ? ` title="${esc(why || hint)}"` : ''}>
      ${a.pick
        ? `<span class="tickbox ${a.picked(key) ? 'on' : ''}" onclick="${a.pick(key)}"
            title="${a.picked(key) ? 'This one will be set on the picked sections' : 'Leave as it is'}">${a.picked(key) ? '✓' : ''}</span>`
        : '<span class="lr-grip ghost"></span>'}
      <span class="lr-l">${esc(l)}${a.differs && a.differs(key) ? `<i class="bdot" title="${esc(a.differsWord || 'Set differently elsewhere')}"></i>` : ''}</span>
      <span class="lr-ctl form">${c}${a.localChip && !why ? a.localChip(key) : ''}</span>
    </div>` : '');
  const seg = (f, opts, labels, why) => `<div class="seg small${why ? ' off' : ''}">${opts.map((o, ix) =>
    `<button type="button"${why ? ' disabled' : ''} class="${String(a.v(f)) === String(o) ? 'on' : ''}"${why ? '' : ` onclick="${a.set(f, o)}"`}>${esc(labels[ix])}</button>`).join('')}</div>`;
  const mix = f => (a.v(f) === undefined ? 'mixed' : '');
  const num = (f, unit, why) => `<div class="num-wrap${why ? ' off' : ''}"><input value="${esc(a.tv(f))}" placeholder="${esc(mix(f))}" inputmode="numeric"${why ? ' disabled' : ''} oninput="${a.num(f)}"><span class="unit">${esc(unit)}</span></div>`;
  // A field the JSON keeps in milliseconds, asked for in SECONDS (3 Sep, user call):
  // the box shows and takes seconds, the adapter converts on the way to the model.
  const numSec = (f, why) => `<div class="num-wrap${why ? ' off' : ''}"><input value="${esc(a.tvSec ? a.tvSec(f) : a.tv(f))}" placeholder="${esc(mix(f))}" inputmode="decimal"${why ? ' disabled' : ''} oninput="${a.numSec ? a.numSec(f) : a.num(f)}"><span class="unit">sec</span></div>`;
  const text = (f, ph, why) => `<span class="rule-text${why ? ' off' : ''}"><input type="text" value="${esc(a.tv(f))}" placeholder="${esc(mix(f) || ph)}"${why ? ' disabled' : ''} oninput="${a.text(f)}"></span>`;
  const note = (s, why) => `<span class="podl${why ? ' off' : ''}">${esc(s)}</span>`;
  const rj = (s, why) => `<span class="rj${why ? ' off' : ''}">${esc(s)}</span>`;
  const mixed = f => (a.mixed ? a.mixed(f) : '');
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
      ${rj('by', off)}${num('deferSec', 'sec', off)}${mixed('start')}`, '',
      'When the pre-roll plays — immediately, or a set number of seconds in (JSON: init)');
  };
  const videoStarts = () => {
    const off = a.v('wait') !== 'timed' ? 'Only when the video waits a set time for the ad' : '';
    return row('wait', 'Hold video for the ad', `${seg('wait', KL_META.prerollWaits, KL_META.prerollWaits.map(w => label('wait', w)))}
      ${numSec('waitMs', off)}${mixed('wait')}`, '',
      'How long the video is held back waiting for the pre-roll before it starts anyway (JSON: maxWait)');
  };
  // The pre-roll's head start (the JSON's minPreRenderTime): at least this much video
  // plays before the ad may render — nothing ever covers the first frame.
  // It can only be honoured while content is actually playing: hold the video for the
  // ad and there is no content yet to play first (3 Sep, user call).
  const headStart = () => {
    const held = a.v('wait') !== 'immediate';
    const why = held ? 'The video is held for the ad, so nothing plays before it — set “Hold video for the ad” to No hold' : '';
    return row('minContentSec', 'Min content playback',
      `${num('minContentSec', 'sec', why)}${mixed('minContentSec')}${note('of video plays first', why)}`, why,
      'At least this much video plays before the pre-roll renders — nothing covers the first frame (JSON: minPreRenderTime)');
  };
  // Cadence is one decision in two shapes, so BOTH shapes are always on screen and the
  // unchosen one greys — where the old editor swapped one row's control type outright.
  const whenMid = () => {
    const byPos = a.v('mode') === 'interval' ? 'The break positions are set below, not here' : '';
    const byInt = a.v('mode') === 'cuepoints' ? 'The interval is set above, at set positions' : '';
    // Break cap died 1 Sep (user call): a cadence runs the video out — at set positions
    // the positions are the cap. Refused by name at the door, like every cut field.
    return `
      ${row('mode', 'Scheduling', `${seg('mode', KL_META.midrollModes, KL_META.midrollModes.map(m => label('mode', m)))}${mixed('mode')}`)}
      ${row('cuepoints', 'Cue points', text('cuepoints', '2:00, 6:00, 9:30', byPos), byPos)}
      ${row('firstAt', 'First break offset', `${num('firstAt', 'sec', byInt)}${rj('repeat every', byInt)}${num('every', 'sec', byInt)}`, byInt,
        'The first break, then the repeat interval (JSON: init, repeat)')}`;
  };
  // Ad audio is CUT (2 Sep, user call): how a player starts is the surface's own
  // Player config now, per placement — nothing about it left to decide on the slot.
  // What a break may take of the viewer's time. `Break lasts` and `If an ad runs over`
  // are NOT pod-only: under 'strict' the ask carries "nothing longer than what's left",
  // so a 60s budget discards a 90s ad and tries the next rung on a ONE-ad break too.
  // They used to hide at `podAds = 1`, which made a live length cap unreachable.
  const takesRows = () => `
    ${row('podAds', 'Impressions per break', `${seg('podAds', [1, 2, 3], ['1', '2', '3'])}${mixed('podAds')}`, '',
      'Ads this one break aims to serve, back to back (JSON: impression)')}`;
  // How we go and get them: how deep, how long each try, and — once there is more than
  // one ad — where the next comes from and where a still may sit.
  const fillRows = () => {
    const cfg = a.rungCount ? a.rungCount() : 0;
    const ms = Number(a.v('tagTimeoutMs')) || 0;
    const worst = fmtMs(worstCaseMs(cfg, ms));
    // The arithmetic moved to the row's own hover (3 Sep, user call): a sentence of
    // sums beside a number field is noise while you are setting the number.
    const pNote = '';
    // The unreachable tail, counted from the two numbers on screen (31 Aug).
    const fillNote = () => {
      const fill = Number(a.v('fillTimeoutSec')) || 0;
      if (!fill || !ms || cfg < 2) return '';
      const reachable = Math.max(1, Math.floor((fill * 1000) / ms));
      // Only the fact worth interrupting for survives, and only when it is TRUE.
      return reachable < cfg ? `the last ${cfg - reachable} ${cfg - reachable === 1 ? 'try' : 'tries'} would never run` : '';
    };
    return `
      ${t !== 'preroll' ? row('prefetchSec', 'Prefetch', `${num('prefetchSec', 'sec early')}${mixed('prefetchSec')}`, '',
        'The break\u2019s first ad is fetched this early, so the break opens with something in hand (JSON: prefetch)') : ''}
      ${row('tagTimeoutMs', 'Request timeout', `${numSec('tagTimeoutMs')}${mixed('tagTimeoutMs')}${note(pNote)}`, '', `How long one tag may take before the next is tried (JSON: timeout)${cfg ? ` — ${cfg} × ${fmtMs(ms)}, up to ${worst} to fill` : ''}`)}
      ${row('fillTimeoutSec', 'Total timeout', `${num('fillTimeoutSec', 'sec')}${mixed('fillTimeoutSec')}${note(fillNote())}`, '',
        'A cap on the whole ladder\'s asking — once spent, the break gives up and the video plays (JSON: totalTimeout)')}
      ${row('nextAd', 'Pod fill order', seg('nextAd', KL_META.podNextAds, KL_META.podNextAds.map(x => label('podNextAd', x)), podOnly), podOnly, podWalkNote(a.v('nextAd')))}
      ${row('podBanner', 'Display ad position', seg('podBanner', KL_META.podBanners, KL_META.podBanners.map(x => label('podBanner', x)), podOnly), podOnly, 'One display ad per pod')}`;
  };

  // A BREATH BETWEEN CLUSTERS (31 Aug, design pass): the order is unchanged — when it
  // interrupts → what the viewer hears → what it takes → how hard we fill it — but each
  // idea now ends with a slightly larger gap. Rhythm, not headings: the 25 Aug "one flat
  // list, no group headings" call stands.
  const gap = '<div class="lr-gap"></div>';
  if (t === 'preroll') return `${whenPre()}${videoStarts()}${headStart()}${gap}${takesRows()}${gap}${fillRows()}`;
  if (t === 'midroll') return `${whenMid()}${gap}${takesRows()}${gap}${fillRows()}`;
  if (t === 'postroll') return `${takesRows()}${gap}${fillRows()}`;
  // A rotation is not a break: banners take turns, so it has no pod, no walk depth and
  // no next-ad question. Structural, not a reveal.
  const cfg = a.rungCount ? a.rungCount() : 0;
  const ms = Number(a.v('tagTimeoutMs')) || 0;
  // Out-stream: banners while nothing plays. Its show times are its own schedule, and
  // one switch of its own — whether it steps aside while a video ad has the screen.
  return `
    ${row('times', 'Schedule', `${text('times', '8:00, 16:00')}${mixed('times')}`, '',
      'The moments a banner shows (JSON: init, repeat — as one list)')}
    ${row('hold', 'Display duration', `${num('hold', 'sec')}${mixed('hold')}`)}
    ${row('perSession', 'Impression cap', `${num('perSession', '/session')}${mixed('perSession')}`, '',
      'The most banners a session may show (JSON: totalImpression)')}
    ${row('hideOnInStream', 'Hide during in-stream',
      seg('hideOnInStream', [true, false], ['Hide it', 'Keep showing']), '',
      'An out-stream banner fills the idle player — when an in-stream ad takes the screen it steps aside (JSON: hideOnInStream)')}
    ${row('tagTimeoutMs', 'Request timeout', `${numSec('tagTimeoutMs')}${note(cfg ? `${cfg} × ${fmtMs(ms)}` : '')}`, '',
      'How long one tag may take before the next is tried (JSON: timeout)')}`;
}
