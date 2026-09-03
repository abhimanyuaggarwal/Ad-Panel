// views-keys-bulk.js — the three BULK ACTS over a selection of integrations:
//   · Ad behaviour   — per-break levers on a clean slate (closed → open/unset → queued),
//                      reviewed on THE CHANGE REVIEW, applied via driveFields/slotOn/Off
//   · Custom player behaviour — the master-detail walk of each integration's configs
//   · Default player behaviour — one-step blanket set of the default player's 3 facts
// Uses the list file's selection (KSEL/selectedKeys) and write helpers at runtime.

// ---------- bulk edit: one sheet, the slots as tabs ----------
// Re-homed by owner (24 Aug), re-cut for the drive (26 Aug, DRIVING-SCOPE): what a
// cohort answers the same way is switches, publishing, the PLAYER — and the QUICK
// DECISIONS (who fills a break, tries, start, ads in a row), written to each
// integration's own drive. Every ladder act is the ops room's: each integration's
// setup is its own workshop now (the 1:1 promise), so there is nothing shared left
// for bulk to write — and cohort setup-attach died with the same promise.

let BULK_DRAFT = null; // { tab, slots:{} } — the AD BEHAVIOUR sheet's queue, breaks only
let UNIT_DRAFT = null;

// The Player tab is GONE from this sheet (2 Sep, user call): player behaviour is a
// sibling act on the bulk bar with its own sheet (playerBehaviourJourney below),
// where every selected integration's configs are read and edited together.

function slotCohortStats(t) {
  const st = { sections: 0, on: 0, withDemand: 0 };
  for (const k of selectedKeys()) {
    for (const sec of k.sections) {
      st.sections++;
      if (sec.slots[t].on) st.on++;
      if (sec.slots[t].hasDemand) st.withDemand++;
    }
  }
  return st;
}

async function bulkEditJourney() {
  if (!KSEL.size) return;
  BULK_DRAFT = { tab: 'preroll', slots: {} };
  UNIT_DRAFT = slotDraft('preroll');
  renderUnitScreen();
}

function slotDraft(t) {
  if (!BULK_DRAFT.slots[t]) {
    const d = {
      slot: t, st: slotCohortStats(t),
      runs: null, runs0: null,
      // The drive change list: nothing lands until a row is ticked; setting a value
      // ticks it. A cohort has no single current value, so rows start blank.
      dv: {},
      dTouched: new Set(),
      // Levers the person has OPENED but not yet set — a control only exists once its
      // lever is chosen, so nothing on the sheet ever looks pre-decided (3 Sep).
      open: new Set(),
    };
    d.runs = d.runs0 = d.st.on === d.st.sections ? 'on' : d.st.on === 0 ? 'off' : null;
    BULK_DRAFT.slots[t] = d;
  }
  return BULK_DRAFT.slots[t];
}

function bulkTab(t) {
  BULK_DRAFT.tab = t;
  UNIT_DRAFT = slotDraft(t);
  renderUnitScreen();
}

// The positions box keeps its own text while typing — the caret rule, cohort side.
const BULK_TEXT = {};

function bulkCueInput(el, t) {
  BULK_TEXT.cuepoints = el.value;
  const cps = parseCuepointsText(el.value).filter(x => typeof x === 'number');
  const d = slotDraft(t);
  if (!el.value.trim() || !cps.length) {
    d.dTouched.delete('cuepoints');
    delete d.dv.cuepoints;
  } else {
    d.dTouched.add('cuepoints');
    d.dv.cuepoints = cps;
  }
  bulkSyncFoot();
}

function bulkCueBlur(t) {
  delete BULK_TEXT.cuepoints;
  if (BULK_DRAFT) bulkTab(t); // a blur can land after Cancel closed the sheet
}

function bulkDriveSet(t, f, v) {
  const d = slotDraft(t);
  d.dv[f] = v;
  d.dTouched.add(f);
  renderUnitScreen();
}

// The bulk sheet: one tab per unit, plus the player. Apply covers every tab at once,
// so a tab with queued changes wears a dot.
function renderUnitScreen() {
  const d = BULK_DRAFT;
  const keys = selectedKeys();
  const tabs = [
    ...KL_META.slotTypes.map(t => {
      const dr = slotDraft(t);
      // The toggle shows the QUEUED state when one is queued, the cohort's truth
      // otherwise (any surface on = on, the editor's own binary).
      const shown = dr.runs ?? (dr.st.on > 0 ? 'on' : 'off');
      return {
        v: t, label: label('slotType', t),
        runs: shown, queued: dr.runs !== dr.runs0,
        dirty: !!(d.slots[t] && slotDirtyD(d.slots[t])),
      };
    }),
  ];
  document.getElementById('dialog-root').innerHTML = `
    <div class="dlg-veil"><div class="dlg bulk">
      <h3>Edit ${keys.length} integration${keys.length > 1 ? 's' : ''}<span class="dlg-kicker">${esc(keys.slice(0, 2).map(k => k.name).join(', '))}${keys.length > 2 ? ` +${keys.length - 2} more` : ''}</span></h3>
      <div class="btabs">
        ${tabs.map(x => `<button type="button" class="btab wswitch ${d.tab === x.v ? 'on' : ''} ${x.runs !== undefined && x.runs !== 'on' ? 'off' : ''}"
          onclick="bulkTab('${x.v}')">${esc(x.label)}${x.runs !== undefined ? `
          <span class="toggle mini ${x.runs === 'on' ? 'on' : ''} ${d.tab === x.v ? '' : 'dead'}"
            ${d.tab === x.v ? `onclick="event.stopPropagation(); bulkTabRuns('${x.v}')"` : ''}
            title="${d.tab !== x.v ? 'Open this tab first — then switch it' : x.queued ? 'Queued — lands on Apply, per integration, skip-and-name' : x.runs === 'on' ? 'Running on at least one selected surface — click to queue OFF everywhere' : 'Off everywhere — click to queue ON where demand exists'}"><span class="track"></span></span>` : ''}${x.dirty ? '<i class="bdot"></i>' : ''}</button>`).join('')}
      </div>
      <div class="dlg-body">
        ${slotTabHtml(d.tab)}
      </div>
      <div class="dlg-foot">
        <button class="btn ghost" onclick="closeUnitScreen()">Cancel</button>
        <button class="btn" id="bulk-next" ${anyBulkDirty() ? '' : 'disabled'}
          onclick="reviewBulk()">${(() => { const n = bulkQueuedRows().length;
            return n ? `Review ${n} change${n === 1 ? '' : 's'}` : 'Review changes'; })()}</button>
      </div>
    </div></div>`;
}

function closeUnitScreen() {
  BULK_DRAFT = null;
  UNIT_DRAFT = null;
  document.getElementById('dialog-root').innerHTML = '';
}

function bulkSyncFoot() {
  const b = document.getElementById('bulk-next');
  if (!b) return;
  const n = bulkQueuedRows().length;
  b.disabled = !anyBulkDirty();
  b.textContent = n ? `Review ${n} change${n === 1 ? '' : 's'}` : 'Review changes';
}

function slotDirtyD(d) {
  return d.runs !== d.runs0 || d.dTouched.size > 0;
}

function anyBulkDirty() {
  return Object.values(BULK_DRAFT.slots).some(slotDirtyD);
}

function touchedSlots() {
  return KL_META.slotTypes.filter(t => BULK_DRAFT.slots[t] && slotDirtyD(BULK_DRAFT.slots[t]));
}

// The tab switch queues the opposite of what it shows — Review is where it lands.
function bulkTabRuns(t) {
  const dr = slotDraft(t);
  const shown = dr.runs ?? (dr.st.on > 0 ? 'on' : 'off');
  const want = shown === 'on' ? 'off' : 'on';
  dr.runs = want === dr.runs0 ? dr.runs0 : want;
  renderUnitScreen();
}

// One generic Who menu for a cohort — every company, since each integration resolves
// the decision against its own setup and a miss is refused or falls back, named.
// A cohort spans many setups, so the strip here is the whole vocabulary rather than
// what one break carries — the same chips, applied uniformly. An integration that has
// none of the switched-on partners falls back to its own arrangement and is named.
function bulkAskChipsHtml(t) {
  const d = slotDraft(t);
  const cur = d.dTouched.has('ask') ? d.dv.ask : uniformDrive(t, 'ask');
  const on = Array.isArray(cur) && cur.length ? cur : [...window.KL_PROVIDERS];
  const off = window.KL_PROVIDERS.filter(p => !on.includes(p));
  const dragKey = `bask-${t}`;
  registerDrag(dragKey, (from, to) => {
    const order = [...on];
    order.splice(to, 0, order.splice(from, 1)[0]);
    bulkDriveSet(t, 'ask', order);
  });
  const chip = (p, i, isOn) => `
    <span class="pchip ${isOn ? 'on' : 'skip'}" ${isOn && on.length > 1 ? dragAttrs(dragKey, i) : ''}
      title="${isOn ? 'Drag to reorder, click to switch off' : 'Skipped. Click to switch it back on — it joins at the end'}"
      onclick="${isOn && on.length === 1 ? '' : `bulkAskToggle('${t}', '${p}')`}">
      ${isOn && on.length > 1 ? '<span class="pchip-grip">⠿</span>' : ''}
      <b class="pchip-n">${isOn ? i + 1 : '–'}</b>
      <span class="pchip-t">${esc(provWord(p))}</span>
    </span>`;
  return `<div class="pchips oneline">
    ${on.map((p, i) => chip(p, i, true)).join('<i class="gsep">›</i>')}
    ${off.map(p => chip(p, -1, false)).join('')}
  </div>`;
}

function bulkAskToggle(t, p) {
  const d = slotDraft(t);
  const cur = d.dTouched.has('ask') ? d.dv.ask : uniformDrive(t, 'ask');
  const on = Array.isArray(cur) && cur.length ? [...cur] : [...window.KL_PROVIDERS];
  if (on.includes(p)) {
    if (on.length === 1) { toast('A break has to ask somebody — switch another partner on first', 'warn'); return; }
    bulkDriveSet(t, 'ask', on.filter(x => x !== p));
  } else {
    bulkDriveSet(t, 'ask', [...on, p]);
  }
}

// A drive value in the plan's own words.
function driveWord(f, v) {
  if (f === 'direct') return v === false ? 'off' : 'on';
  if (f === 'ask') {
    if (!Array.isArray(v) || !v.length) return 'as set up';
    return v.map(provWord).join(' › ');
  }
  if (f === 'cuepoints') {
    if (!Array.isArray(v) || !v.length) return 'as set up';
    return v.map(fmtCue).join(', ');
  }
  if (f === 'tries') return !v || v === 'setup' ? 'full waterfall' : String(v);
  if (f === 'start') return v === 'deferred' ? 'delayed' : 'immediate';
  if (f === 'deferSec') return `${v}s`;
  return String(v);
}

// One value the whole cohort already agrees on, or undefined when they differ — a
// control is never prefilled with one integration's answer as if it spoke for all.
function uniformDrive(t, f) {
  let first, seen = false;
  for (const k of selectedKeys()) {
    let v = k.drive?.[t]?.[f];
    if (f === 'direct') v = v !== false;      // absence = on
    if (f === 'tries' && v === undefined) v = 'setup';
    if (!seen) { first = v; seen = true; }
    else if (JSON.stringify(v) !== JSON.stringify(first)) return undefined;
  }
  return first;
}

// THE FIELDS A BREAK OFFERS (2 Sep re-cut): one definition each, so the control that
// changes a field, the word its queued value reads as, and its place in the list all
// come from a single line rather than three that can drift apart.
function bulkFieldDefs(t) {
  const d = slotDraft(t);
  // Clean slate: an untouched lever's control holds NOTHING — the cohort's current
  // state is the today-word beside it, never a preselected answer.
  const dv = f => (d.dTouched.has(f) ? d.dv[f] : undefined);
  const defs = [
    {
      f: 'direct', label: 'Direct',
      why: 'Sold-direct demand, per break — the deals and caps are each ad setup’s; whether they run is each surface’s',
      ctl: () => {
        // On/Off as an explicit pair: a toggle has to stand somewhere, and where it
        // stood read as the value. Unset until picked.
        const cur = d.dTouched.has('direct') ? (d.dv.direct === false ? 'off' : 'on') : undefined;
        const withDeals = selectedKeys().filter(k => k.sections.some(s2 => s2.slots[t]?.direct?.rungCount)).length;
        return `${accSeg(cur, ['on', 'off'], ['On', 'Off'],
          o => `bulkDriveSet('${t}', 'direct', ${o === 'on' ? 'true' : 'false'})`)}
          ${withDeals < selectedKeys().length
            ? `<span class="st-chip" title="Their ad setup carries no direct deals on this break — the switch lands, and changes nothing until ops add one">${selectedKeys().length - withDeals} without deals</span>` : ''}`;
      },
    },
    { f: 'ask', label: 'Fallback order', ctl: () => bulkAskChipsHtml(t) },
    {
      f: 'tries', label: 'Waterfall depth',
      ctl: () => accSeg(d.dTouched.has('tries') ? (d.dv.tries ?? 'setup') : undefined, [1, 2, 3, 'setup'], ['1', '2', '3', 'Full'],
        o => `bulkDriveSet('${t}', 'tries', ${o === 'setup' ? "'setup'" : o})`),
    },
  ];
  if (t === 'preroll') {
    defs.push({
      f: 'start', label: 'Start offset',
      ctl: () => `${accSeg(dv('start'), ['start', 'deferred'], ['Immediate', 'Delayed'],
        o => `bulkDriveSet('${t}', 'start', '${o}')`)}
        <div class="num-wrap${dv('start') === 'deferred' ? '' : ' off'}">
          <input value="${esc(d.dTouched.has('deferSec') ? d.dv.deferSec : '')}" placeholder="7" inputmode="numeric" ${dv('start') === 'deferred' ? '' : 'disabled'}
            oninput="bulkDriveSet('${t}', 'deferSec', Number(this.value))"><span class="unit">sec</span></div>`,
    });
  }
  if (t === 'midroll') {
    defs.push({
      f: 'cuepoints', label: 'Cue points',
      why: 'Where each surface’s mid-roll breaks fall — a surface whose ad setup runs an interval, or several break groups, keeps its own and is named on Apply',
      ctl: () => {
        const v = d.dTouched.has('cuepoints') ? d.dv.cuepoints : undefined;
        const text = BULK_TEXT.cuepoints ?? (Array.isArray(v) ? v.map(fmtCue).join(', ') : '');
        return `<div class="cue-in${v ? ' set' : ''}"><input type="text" value="${esc(text)}"
          placeholder="${esc(bulkTodayWord(t, 'cuepoints'))}"
          oninput="bulkCueInput(this, '${t}')" onblur="bulkCueBlur('${t}')"></div>`;
      },
    });
  }
  defs.push({
    f: 'podAds', label: 'Impressions per break',
    ctl: () => accSeg(dv('podAds'), [1, 2, 3], ['1', '2', '3'], o => `bulkDriveSet('${t}', 'podAds', ${o})`),
  });
  void dv;
  return defs;
}

// ---------- ONE FIXED LIST, CHANGE-STATE IN PLACE (3 Sep, fifth cut, user call) ----------
// Every prior shape split the fields in two — changed above, unchanged below — and a
// touched field TELEPORTED between the halves, breaking the panel's oldest rule:
// nothing moves under the cursor. With the right panel gone there is room for the
// integration page's own delivery-panel anatomy instead: one fixed list, every control
// drawn and live (five fields never needed disclosure), and a changed row saying so IN
// PLACE — accent bar, a quiet "was …", an × that puts it back. The queue is a per-row
// STATE now, not a place; Review still reads the same counted list.

// Every queued change, in the plan's own words. A break's switch is its own row: it is
// the change that decides whether the others matter at all.
function bulkQueuedRows() {
  const rows = [];
  for (const t of KL_META.slotTypes) {
    const d = BULK_DRAFT.slots[t];
    if (!d) continue;
    if (d.runs !== d.runs0 && d.runs) {
      rows.push({ t, f: 'runs', where: label('slotType', t), label: 'Runs', to: d.runs === 'on' ? 'on, every section with demand' : 'off everywhere' });
    }
    const defs = bulkFieldDefs(t);
    for (const f of d.dTouched) {
      if (f === 'deferSec' && d.dTouched.has('start')) continue; // reads on its own switch
      const def = defs.find(x => x.f === f);
      let to = driveWord(f, d.dv[f]);
      if (f === 'start' && d.dv.start === 'deferred') {
        to = `delayed ${d.dTouched.has('deferSec') ? d.dv.deferSec : (uniformDrive(t, 'deferSec') ?? 7)}s`;
      }
      rows.push({ t, f, where: label('slotType', t), label: def ? def.label : fieldName(f), to });
    }
  }
  return rows;
}

// ---------- TWO CARDS (3 Sep, sixth cut, user call — "changes as cards") ----------
// The enterprise shape, finally: the FORM on the left, and beside it a live PENDING
// CHANGES card in the review screen's own bounded-card anatomy — so step 1's card IS
// step 2, growing as you work. The left rows stay a fixed list (controls always live,
// nothing teleports); a changed row keeps only the accent bar, and everything ABOUT the
// change — was, becomes, the × that drops it — lives on the card, grouped by break,
// every break at once. A card row navigates to its break; Clear all empties the lot.

// One form row: label · the live control · (when the cohort disagrees) today's spread.
// A CLEAN SLATE, NOT A FORM OF ANSWERS (3 Sep, user call). The old sheet drew every
// control live with a value already standing in it — a Waterfall depth reading "Full"
// before anyone touched it read as a decision, when it was only a default. Now a lever
// at rest is a LABEL and the cohort's counted today-word; the control appears when the
// lever is chosen, UNSET, and the row only queues once a value is actually picked.
// Three states, in one grammar: closed (label · today · Set) → open (control, nothing
// selected, × closes) → queued (the accent bar, as before — × drops the change).
function bulkFieldRowHtml(t, def, shownOff) {
  const d = slotDraft(t);
  const queued = d.dTouched.has(def.f);
  const open = queued || d.open.has(def.f);
  const today = bulkTodayWord(t, def.f);
  if (!open) {
    return `
    <div class="bqf-r closed ${shownOff ? 'off-dim' : ''}" onclick="bulkOpenField('${t}', '${def.f}')"${def.why ? ` title="${esc(def.why)}"` : ''}>
      <span class="bqf-l">${esc(def.label)}</span>
      <span class="bqf-today" title="What the selected integrations hold today — counted, never a suggestion">${esc(today)}</span>
      <span class="bqf-set">Set</span>
    </div>`;
  }
  return `
    <div class="bqf-r open ${queued ? 'queued' : ''} ${shownOff && !queued ? 'off-dim' : ''}"${def.why ? ` title="${esc(def.why)}"` : ''}>
      <span class="bqf-l">${esc(def.label)}</span>
      <span class="bqf-c form">${def.ctl()}</span>
      <span class="bqf-s">${queued ? '' : `<span class="bqf-today">${esc(today)}</span>`}
        <button type="button" class="bqs-x on" onclick="bulkUnsetField('${t}', '${def.f}')"
          title="${queued ? 'Drop this change' : 'Close — nothing set'}">×</button></span>
    </div>`;
}

function bulkOpenField(t, f) {
  slotDraft(t).open.add(f);
  renderUnitScreen();
}

// Close a lever: an unset one just folds; a set one drops its change too.
function bulkUnsetField(t, f) {
  const d = slotDraft(t);
  d.open.delete(f);
  d.dTouched.delete(f);
  delete d.dv[f];
  if (f === 'start') { d.dTouched.delete('deferSec'); delete d.dv.deferSec; }
  if (f === 'cuepoints') delete BULK_TEXT.cuepoints;
  renderUnitScreen();
}

function bulkFieldsHtml(t, shownOff) {
  if (isRotation(t)) {
    return '<div class="bt-note">Banners take turns — nothing to decide beyond the switch. Which banners and when: each ad setup.</div>';
  }
  return bulkFieldDefs(t).map(def => bulkFieldRowHtml(t, def, shownOff)).join('');
}

// THE PENDING CHANGES CARD — this break's queued changes, beside the fields that made
// them (7th cut, user call: tab-scoped, and quieter). One card, one tinted header, no
// nested boxes: a row is the field, its from → to underneath, and an × that surfaces on
// hover. The other tabs' dots already say where else changes wait; cross-break reading
// is Review's job. Empty, the card states it in five words and holds its ground.
function bulkPendingCardHtml(t) {
  const rows = bulkQueuedRows().filter(r => r.t === t);
  return `<aside class="bqp">
    <div class="bqp-card">
      <div class="bqp-hd">
        <span>Pending changes${rows.length ? ` · ${rows.length}` : ''}</span>
        <span class="bqs-gap"></span>
        ${rows.length ? `<button type="button" class="zlink" onclick="bulkClearTab('${t}')">Clear</button>` : ''}
      </div>
      ${rows.length ? rows.map(r => `
        <div class="bqp-r">
          <div class="bqp-top">
            <span class="bqp-f">${esc(r.label)}</span>
            <button type="button" class="bqs-x" onclick="bulkDropField('${r.t}', '${r.f}')" title="Drop this change">×</button>
          </div>
          <div class="bqp-vc">${esc(bulkTodayWord(r.t, r.f))}<i class="rvw-arr">→</i><b>${esc(r.to)}</b></div>
        </div>`).join('')
      : '<div class="bqp-empty">No changes on this break</div>'}
    </div>
  </aside>`;
}

// Clearing this break: its queued fields follow whatever each surface holds again.
function bulkClearTab(t) {
  const d = slotDraft(t);
  d.dv = {};
  d.dTouched = new Set();
  d.open = new Set();
  d.runs = d.runs0;
  renderUnitScreen();
}

// Dropping one change: that field goes back to following whatever each surface holds.
function bulkDropField(t, f) {
  if (f === 'runs') {
    const d = slotDraft(t);
    d.runs = d.runs0;
  } else {
    const d = slotDraft(t);
    d.open.delete(f);
    d.dTouched.delete(f);
    delete d.dv[f];
    if (f === 'start') { d.dTouched.delete('deferSec'); delete d.dv.deferSec; }
  }
  renderUnitScreen();
}

// The all-tabs "Clear all" went with the sheet-wide card (2 Sep review): a tab clears
// its own queue, and a single change is dropped by its ×. Cancel still drops the lot.

// One surface's answer for one field, in words.
function bulkKeyWord(k, t, f) {
  const d = k.drive?.[t] || {};
  if (f === 'direct') return driveWord('direct', d.direct !== false);
  // No decision on this surface = it follows its ad setup (tries and ask say so via
  // their own vocabularies; start and podAds have no absent word of their own).
  if (d[f] === undefined && !['tries', 'ask'].includes(f)) return 'as set up';
  if (f === 'start') {
    return d.start === 'deferred' ? `delayed ${d.deferSec ?? 7}s` : driveWord('start', d.start);
  }
  return driveWord(f, d[f]);
}

// What the cohort answers for one field TODAY, in words. When they agree it is the one
// value; when they do not, it is THE VALUES THEMSELVES ("Muted · Unmuted") — the old
// "mixed today" chip named the situation instead of answering the question, and a chip
// repeated on every second row is noise, not information. Past three distinct answers
// the list stops being readable and the count takes over.
function bulkTodayWord(t, f) {
  if (f === 'runs') {
    const st = slotDraft(t).st;
    if (st.on === st.sections) return 'on everywhere';
    return st.on === 0 ? 'off everywhere' : `on for ${st.on} of ${st.sections}`;
  }
  const words = [];
  for (const k of selectedKeys()) {
    const w = bulkKeyWord(k, t, f);
    if (!words.includes(w)) words.push(w);
  }
  if (words.length === 1) return words[0];
  if (words.length <= 3) return words.join(' · ');
  return `${words.length} different values`;
}

// The per-break "Reset to setup" is gone with the old row grid (2 Sep): a queued change
// is dropped by its own × in the queue card, and Clear all drops the lot.

// THE RHS IS THE SELECTION (1 Sep, user call — the sheet takes the editor's own
// anatomy): one line per selected integration, TODAY's truth for this break — the walk
// it runs now, dim when off, counted suffixes for what one line cannot hold (sections,
// groups). What a queued decision DOES to each surface is the Review step's job — the
// sheet never previews thirty futures, it names them counted before they land.
// The "Selected integrations" panel is GONE (3 Sep, user call — "is it even
// relevant?"). From the platform's seat it never was: the cohort was chosen on the
// LIST, the kicker names it, each field row states what the cohort answers today, and
// the review counts every caveat before a write. The per-section walks it showed are
// each ad setup's own detail — depth you cannot act on from a cohort sheet.

function slotTabHtml(t) {
  const d = UNIT_DRAFT;
  const shownOff = (d.runs ?? (d.st.on > 0 ? 'on' : 'off')) === 'off';
  // A break switched off dims its untouched fields row by row — never a queued one:
  // a change you cannot read is a change you cannot check.
  return `
    <div class="bulk-split">
      <div class="bulk-fields">${bulkFieldsHtml(t, shownOff)}</div>
      ${bulkPendingCardHtml(t)}
    </div>`;
}

// ---------- review, then apply (2 Sep, user call) ----------
// The queue is turned into the same flat change list a save or a publish produces, and
// handed to the ONE review screen. Back returns to the sheet with the queue intact —
// a review that costs you your work is a review nobody opens twice.
function bulkReviewChanges() {
  const keys = selectedKeys();
  const withDeals = t => keys.filter(k => k.sections.some(s2 => s2.slots[t]?.direct?.rungCount)).length;
  return bulkQueuedRows().map(r => {
    // What they hold TODAY is the honest left-hand side — the agreed value when the
    // cohort has one, and "mixed today" when it does not. Never one surface's answer
    // standing in for all of them. Both sides are already words here, so they are
    // handed over as text rather than re-worded by the review.
    const row = {
      where: r.where, field: r.f, label: r.label,
      fromText: bulkTodayWord(r.t, r.f), toText: r.to,
    };
    // The counted caveats belong here, next to the change they qualify — this is the
    // last screen before a cohort write, so a surface the change cannot touch is named.
    if (r.f === 'direct' && r.t !== 'player') {
      const n = keys.length - withDeals(r.t);
      if (n) row.note = `${n} carry no direct deals`;
    }
    if (r.f === 'runs' && r.to.startsWith('on')) {
      const n = keys.filter(k => !k.sections.some(s2 => s2.slots[r.t]?.hasDemand)).length;
      if (n) row.note = `${n} have no demand — skipped`;
    }
    return row;
  });
}

async function reviewBulk() {
  const keys = selectedKeys();
  const names = keys.slice(0, 2).map(k => k.name).join(', ') + (keys.length > 2 ? ` +${keys.length - 2} more` : '');
  const ok = await reviewChanges({
    title: `Apply to ${keys.length} integration${keys.length > 1 ? 's' : ''}?`,
    kicker: names,
    changes: bulkReviewChanges(),
    okLabel: `Apply to ${keys.length}`,
    cancelLabel: 'Back',
  });
  // Back leaves the sheet exactly as it was — the queue is still there to edit.
  if (!ok) { renderUnitScreen(); return; }
  await applyBulk();
}

async function applyBulk() {
  const drafts = touchedSlots().map(t => BULK_DRAFT.slots[t]);
  closeUnitScreen();

  // Switches and decisions per touched slot — in the order the screen reads.
  for (const d of drafts) {
    const t = d.slot;
    const kind = label('slotType', t);
    if (d.runs !== d.runs0 && d.runs) {
      await bulkApplyDirect(d.runs === 'on' ? 'slotOn' : 'slotOff', t, kind);
    }
    if (d.dTouched.size) {
      const fields = {};
      for (const f of d.dTouched) fields[f] = d.dv[f] === undefined ? 'setup' : d.dv[f];
      await bulkApplyDirect('driveFields', { slot: t, fields }, kind);
    }
  }

  await refreshKeysList();
}

// Cohort publish / take-off-air left the bulk bar (2 Sep, user call) — going on or
// off air is each integration's own deliberate act, from its page.

// ---------- CHANGE PLAYER BEHAVIOUR (2 Sep, user call) ----------
// The bulk bar's second object: every player config of every selected integration —
// Default first, then each named fork — on one sheet, read and edited together. One
// bordered group per integration (the review's own anatomy), one row per config, the
// three per-placement facts as columns. Edits queue in a draft; Review reads them back
// grouped the same way before a single draft is written. Publishing stays per surface.
let PB_DRAFT = null;   // { keys: [{ id, name, platform, player, playerConfigs, orig }] }
const PB_TEXT = {};    // caret-safe volume inputs, keyed `${ki}:${ci}`

function playerBehaviourJourney() {
  if (!KSEL.size) return;
  PB_DRAFT = {
    keys: selectedKeys().map(k => ({
      id: k.id, name: k.name, platform: k.platform,
      player: JSON.parse(JSON.stringify(k.player)),
      playerConfigs: JSON.parse(JSON.stringify(k.playerConfigs || [])),
      orig: JSON.parse(JSON.stringify({ player: k.player, playerConfigs: k.playerConfigs || [] })),
    })),
  };
  for (const k of Object.keys(PB_TEXT)) delete PB_TEXT[k];
  renderPBScreen();
}

function closePBScreen() {
  PB_DRAFT = null;
  PB_SEL = { ki: 0, ci: -1 };
  document.getElementById('dialog-root').innerHTML = '';
}

// ci = -1 is the Default (the key's own player); 0.. are the named forks.
function pbCfg(k, ci) { return ci < 0 ? k.player : k.playerConfigs[ci]; }

function pbSet(ki, ci, f, v) {
  pbCfg(PB_DRAFT.keys[ki], ci)[f] = v;
  renderPBScreen();
}

function pbNum(el, ki, ci) {
  PB_TEXT[`${ki}:${ci}`] = el.value;
  pbCfg(PB_DRAFT.keys[ki], ci).startVolume = Number(el.value);
  pbSyncFoot();
}

// Every field one config moved, in the panel's words — the review rows and the foot's
// count read the same list.
function pbChanges() {
  const out = [];
  const word = (f, v) => (f === 'startVolume' ? `${v}%` : label(f, v));
  for (const k of PB_DRAFT.keys) {
    const pairs = [[-1, 'Default', k.player, k.orig.player]];
    k.playerConfigs.forEach((c, i) => {
      const o = k.orig.playerConfigs.find(x => x.id === c.id);
      if (o) pairs.push([i, c.name, c, o]);
    });
    for (const [ci, cfgName, cur, orig] of pairs) {
      for (const f of ['playback', 'expandInMini', 'autoplay', 'startVolume']) {
        if (f === 'startVolume' && cur.autoplay !== 'sound' && orig.autoplay !== 'sound') continue;
        if (JSON.stringify(cur[f]) !== JSON.stringify(orig[f])) {
          out.push({
            where: `${k.name} · ${cfgName}`, field: f,
            fromText: word(f, orig[f]),
            toText: word(f, cur[f]),
            ki: PB_DRAFT.keys.indexOf(k), ci,
          });
        }
      }
    }
  }
  return out;
}

// MASTER-DETAIL (3 Sep, user call — a column per field cannot scale): the left rail
// is every selected integration's configs, Default first; the right pane is the
// SELECTED config's whole field form, which grows DOWNWARD as configs grow fields —
// n fields is a longer form, never a wider table. A config this sheet moved wears the
// accent bar on its rail row; the counted foot and the change review are unchanged.
let PB_SEL = { ki: 0 };

// The rail picks an INTEGRATION; a queue row picks one and scrolls its config into
// view, so a change you queued three surfaces ago is still one click from its form.
function pbSelect(ki, ci) {
  PB_SEL = { ki };
  renderPBScreen();
  if (ci === undefined) return;
  const el = document.getElementById(`pbg-${ci}`);
  if (el) el.scrollIntoView({ block: 'nearest' });
}

// ONE ROW PER INTEGRATION (3 Sep, user call). The rail used to list every config of
// every surface — with six surfaces that is thirty rows to walk, and the configs of one
// integration were never on screen together. Now the rail is the cohort and the right
// side is one integration WHOLE: its default, then each named fork.
// The rail is the cohort AND the change map: a surface with edits carries the count,
// so "what have I touched, and where" is answered without a second list of the same
// changes in different words. The names already carry the platform.
function pbRailHtml() {
  return PB_DRAFT.keys.map((k, ki) => {
    const n = pbChanges().filter(c => c.ki === ki).length;
    return `
      <button type="button" class="pbr-row ${PB_SEL.ki === ki ? 'sel' : ''} ${n ? 'dirty' : ''}"
        onclick="pbSelect(${ki})">
        <span class="pbr-n">${esc(k.name)}</span>
        ${n ? `<span class="pbr-count" title="${n} change${n === 1 ? '' : 's'} on this integration — lands on Apply">${n}</span>` : ''}
      </button>`;
  }).join('');
}

// The selected config's form — the SAME rows the integration page draws, stacked so a
// future fourth or tenth fact is one more row here and nowhere else.
// The selected integration, WHOLE: its default and every named fork, each a small
// bounded block of the same three rows. A future fourth or tenth fact is one more row
// here and nowhere else.
// THE CHANGE LIVES WHERE THE CHANGE WAS MADE (3 Sep, user call — the queue on top is
// gone). A strip above the form said the same thing twice in two vocabularies, a screen
// apart, and grew downward as you worked — so the form moved under the cursor and the
// dialog changed size. Now a moved field says so in its own row: an accent bar, the
// value it held, and an × that puts it back. The rail counts them per surface, and
// Review still reads every one before anything lands.
function pbWasWord(f, v) { return f === 'startVolume' ? `${v}%` : label(f, v); }

function pbConfigBlockHtml(ki, ci) {
  const k = PB_DRAFT.keys[ki];
  const c = pbCfg(k, ci);
  const meta = KL_META;
  const orig = ci < 0 ? k.orig.player : k.orig.playerConfigs.find(x => x.id === c.id);
  const vol = PB_TEXT[`${ki}:${ci}`] ?? (c.startVolume ?? '');
  const moved = f => !!orig && JSON.stringify(c[f]) !== JSON.stringify(orig[f]);
  // The volume rides the autoplay row, so the row answers for both.
  const rowMoved = f => (f === 'autoplay'
    ? moved('autoplay') || (moved('startVolume') && (c.autoplay === 'sound' || orig?.autoplay === 'sound'))
    : moved(f));
  const wasWord = f => (f === 'autoplay'
    ? [moved('autoplay') ? pbWasWord('autoplay', orig.autoplay) : '',
       moved('startVolume') && (c.autoplay === 'sound' || orig.autoplay === 'sound') ? pbWasWord('startVolume', orig.startVolume) : '']
      .filter(Boolean).join(' · ')
    : pbWasWord(f, orig[f]));
  const frow = (f, lbl, ctl, why) => {
    const m = rowMoved(f);
    return `
    <div class="pbd-r ${m ? 'moved' : ''}"${why ? ` title="${esc(why)}"` : ''}>
      <span class="pbd-l">${esc(lbl)}</span>
      <span class="pbd-c">${ctl}</span>
      <span class="pbd-s">${m ? `<span class="pbd-was">was ${esc(wasWord(f))}</span>
        <button type="button" class="pbd-x" title="Put it back" onclick="pbDropField(${ki}, ${ci}, '${f}')">×</button>` : ''}</span>
    </div>`;
  };
  return `
    <div class="pbd-g" id="pbg-${ci}">
      <div class="pbd-gh">${esc(ci < 0 ? 'Default' : c.name)}</div>
      ${frow('playback', 'Playback mode', accSeg(c.playback ?? 'active', meta.playbackKinds, meta.playbackKinds.map(o => label('playback', o)), o => `pbSet(${ki}, ${ci}, 'playback', '${o}')`))}
      ${frow('expandInMini', 'Expand MiniTV for ads', accSeg(c.expandInMini ?? true, [true, false], ['True', 'False'], o => `pbSet(${ki}, ${ci}, 'expandInMini', ${o})`),
        'Whether the MiniTV expands while an ad runs')}
      ${frow('autoplay', 'Autoplay behaviour', `${accSeg(c.autoplay ?? 'muted', meta.autoplay, meta.autoplay.map(o => label('autoplay', o)), o => `pbSet(${ki}, ${ci}, 'autoplay', '${o}')`)}
        ${(c.autoplay ?? 'muted') === 'sound' ? `<div class="num-wrap sm"><input value="${esc(vol)}" inputmode="numeric" oninput="pbNum(this, ${ki}, ${ci})"><span class="unit">%</span></div>` : ''}`)}
    </div>`;
}

function pbDetailHtml() {
  const { ki } = PB_SEL;
  const k = PB_DRAFT.keys[ki];
  return `
    <div class="pbd-h">${esc(k.name)}</div>
    ${[-1, ...k.playerConfigs.map((_, ci) => ci)].map(ci => pbConfigBlockHtml(ki, ci)).join('')}`;
}


// THE QUEUE ON TOP (3 Sep, user call — the ad sheet's own logic): what this sheet has
// changed collects in one strip above the rail and form, each row one change — where it
// lands, what it was, what it becomes — with the ad sheet's exact anatomy: × drops it,
// clicking it jumps the rail to that config. Review (step 2) then reads the same list.
function pbDropField(ki, ci, f) {
  const k = PB_DRAFT.keys[ki];
  const cur = pbCfg(k, ci);
  const orig = ci < 0 ? k.orig.player : k.orig.playerConfigs.find(x => x.id === cur.id);
  if (!orig) return;
  cur[f] = JSON.parse(JSON.stringify(orig[f]));
  if (f === 'autoplay') { cur.startVolume = orig.startVolume; delete PB_TEXT[`${ki}:${ci}`]; }
  if (f === 'startVolume') delete PB_TEXT[`${ki}:${ci}`];
  renderPBScreen();
}


function renderPBScreen() {
  const d = PB_DRAFT;
  const n = pbChanges().length;
  document.getElementById('dialog-root').innerHTML = `
    <div class="dlg-veil"><div class="dlg bulk pb">
      <h3>Custom player behaviour<span class="dlg-kicker">${d.keys.length} integration${d.keys.length > 1 ? 's' : ''}</span></h3>
      <div class="dlg-body pb-body">
        <div class="pb-split">
          <div class="pbr scrolly">${pbRailHtml()}</div>
          <div class="pbd">${pbDetailHtml()}</div>
        </div>
      </div>
      <div class="dlg-foot">
        <button class="btn ghost" onclick="closePBScreen()">Cancel</button>
        <button class="btn" id="pb-next" ${n ? '' : 'disabled'}
          onclick="pbReview()">${n ? `Review ${n} change${n === 1 ? '' : 's'}` : 'Review changes'}</button>
      </div>
    </div></div>`;
}

// Typing a volume must not repaint the sheet; only the foot's count follows the caret.
function pbSyncFoot() {
  const b = document.getElementById('pb-next');
  if (!b) return;
  const n = pbChanges().length;
  b.disabled = !n;
  b.textContent = n ? `Review ${n} change${n === 1 ? '' : 's'}` : 'Review changes';
}

async function pbReview() {
  const changes = pbChanges();
  if (!changes.length) return;
  const touched = PB_DRAFT.keys.filter(k =>
    JSON.stringify({ player: k.player, playerConfigs: k.playerConfigs }) !== JSON.stringify(k.orig));
  const ok = await reviewChanges({
    title: `Apply to ${touched.length} integration${touched.length > 1 ? 's' : ''}?`,
    kicker: 'player behaviour — drafts only',
    changes,
    okLabel: `Apply to ${touched.length}`,
    cancelLabel: 'Back',
  });
  if (!ok) { renderPBScreen(); return; }
  let saved = 0;
  for (const k of touched) {
    try {
      await API.updateKey(k.id, { player: k.player, playerConfigs: k.playerConfigs });
      saved++;
    } catch (e) {
      toast(`${k.name}: ${e.message}`, 'bad');
    }
  }
  closePBScreen();
  toast(`Player behaviour — ${saved} draft${saved === 1 ? '' : 's'} written`);
  await refreshKeysList();
}

// ---------- BULK: DEFAULT PLAYER BEHAVIOUR (3 Sep, user call — the third act) ----------
// Custom player behaviour walks each integration's configs one by one; this one act
// blanket-sets the DEFAULT player's three facts across the whole selection. Custom
// configs are never touched — they are each surface's own, edited in the other sheet.
// ONE STEP (user call): three levers never earn a second screen. The read-back the
// review would give lives on the sheet itself — a set row shows “was <today>” beside
// its value — so Apply writes directly, and stays as honest as the review was.
let DC_DRAFT = null;   // { fields: {}, open: Set }
const DC_TEXT = {};    // caret-safe volume text

function defaultConfigJourney() {
  if (!KSEL.size) return;
  DC_DRAFT = { fields: {}, open: new Set() };
  for (const k of Object.keys(DC_TEXT)) delete DC_TEXT[k];
  renderDCScreen();
}

function closeDCScreen() {
  DC_DRAFT = null;
  document.getElementById('dialog-root').innerHTML = '';
}

// What the selection holds today, counted — one word when they agree, the spread when
// they don't. Never a suggestion, never a preselected answer.
function dcTodayWord(f) {
  const words = [];
  for (const k of selectedKeys()) {
    const p = k.player || {};
    let w;
    if (f === 'playback') w = label('playback', p.playback ?? 'active');
    else if (f === 'expandInMini') w = (p.expandInMini ?? true) ? 'True' : 'False';
    else w = `${label('autoplay', p.autoplay ?? 'muted')}${(p.autoplay ?? 'muted') === 'sound' ? ` · ${p.startVolume ?? 80}%` : ''}`;
    if (!words.includes(w)) words.push(w);
  }
  if (words.length === 1) return words[0];
  if (words.length <= 3) return words.join(' · ');
  return `${words.length} different values`;
}

function dcOpen(f) { DC_DRAFT.open.add(f); renderDCScreen(); }

function dcUnset(f) {
  DC_DRAFT.open.delete(f);
  delete DC_DRAFT.fields[f];
  if (f === 'autoplay') { delete DC_DRAFT.fields.startVolume; delete DC_TEXT.vol; }
  renderDCScreen();
}

function dcSet(f, v) {
  DC_DRAFT.fields[f] = v;
  renderDCScreen();
}

function dcVol(el) {
  DC_DRAFT.fields.startVolume = Number(el.value);
  DC_TEXT.vol = el.value; // typing never repaints — the caret rule
}

function dcRowHtml(f, lbl, ctl, why) {
  const set = DC_DRAFT.fields[f] !== undefined;
  const open = set || DC_DRAFT.open.has(f);
  if (!open) {
    return `
    <div class="bqf-r closed" onclick="dcOpen('${f}')"${why ? ` title="${esc(why)}"` : ''}>
      <span class="bqf-l">${esc(lbl)}</span>
      <span class="bqf-today" title="What the selected integrations hold today — counted, never a suggestion">${esc(dcTodayWord(f))}</span>
      <span class="bqf-set">Set</span>
    </div>`;
  }
  return `
    <div class="bqf-r open ${set ? 'queued' : ''}"${why ? ` title="${esc(why)}"` : ''}>
      <span class="bqf-l">${esc(lbl)}</span>
      <span class="bqf-c form">${ctl()}</span>
      <span class="bqf-s">${set
        ? `<span class="bqf-was">was ${esc(dcTodayWord(f))}</span>`
        : `<span class="bqf-today">${esc(dcTodayWord(f))}</span>`}
        <button type="button" class="bqs-x on" onclick="dcUnset('${f}')"
          title="${set ? 'Drop this change' : 'Close — nothing set'}">×</button></span>
    </div>`;
}

function renderDCScreen() {
  if (!DC_DRAFT) return;
  const meta = KL_META;
  const f = DC_DRAFT.fields;
  const n = Object.keys(f).filter(x => x !== 'startVolume').length;
  const keys = selectedKeys();
  document.getElementById('dialog-root').innerHTML = `
    <div class="dlg-veil"><div class="dlg bulk">
      <h3>Default player behaviour<span class="dlg-kicker">${keys.length} integration${keys.length > 1 ? 's' : ''} · custom configs keep their own values</span></h3>
      <div class="dlg-body">
        ${dcRowHtml('playback', 'Playback mode', () => accSeg(f.playback, meta.playbackKinds, meta.playbackKinds.map(o => label('playback', o)), o => `dcSet('playback', '${o}')`))}
        ${dcRowHtml('expandInMini', 'Expand MiniTV for ads', () => accSeg(f.expandInMini, [true, false], ['True', 'False'], o => `dcSet('expandInMini', ${o})`),
          'Whether the MiniTV expands while an ad runs')}
        ${dcRowHtml('autoplay', 'Autoplay behaviour', () => `${accSeg(f.autoplay, meta.autoplay, meta.autoplay.map(o => label('autoplay', o)), o => `dcSet('autoplay', '${o}')`)}
          ${f.autoplay === 'sound' ? `<div class="num-wrap sm"><input value="${esc(DC_TEXT.vol ?? (f.startVolume ?? ''))}" placeholder="80" inputmode="numeric" oninput="dcVol(this)"><span class="unit">%</span></div>` : ''}`)}
      </div>
      <div class="dlg-foot">
        <span class="rvw-count">${n ? `${n} change${n === 1 ? '' : 's'} · ${keys.length} integration${keys.length > 1 ? 's' : ''}` : ''}</span>
        <button class="btn ghost" onclick="closeDCScreen()">Cancel</button>
        <button class="btn" ${n ? '' : 'disabled'} onclick="dcApply()">Apply</button>
      </div>
    </div></div>`;
}

async function dcApply() {
  const f = DC_DRAFT.fields;
  if (!Object.keys(f).filter(x => x !== 'startVolume').length) return;
  const fields = { ...f };
  if (fields.autoplay === 'sound') fields.startVolume = fields.startVolume ?? 80;
  else delete fields.startVolume;
  closeDCScreen();
  await bulkApplyDirect('playerFields', { fields }, 'Default player behaviour');
  await refreshKeysList();
}

