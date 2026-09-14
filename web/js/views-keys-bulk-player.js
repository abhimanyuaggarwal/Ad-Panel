// views-keys-bulk-player.js — PLAYER BEHAVIOUR, the cohort act over a selection: the five
// playback facts a team decides for a whole estate at once, blanket-set on each selected
// integration's player (the `playerFields` bulk action).
// Loads after views-keys-bulk-ads.js; uses the list file's selection helpers at runtime.
//
// ONE SHEET, NOT TWO (14 Sep, second cut, user call — *"let's drop Change default player
// behaviour and Custom player behaviour and have a Player behaviour which will have options
// to control a few fields"*). There used to be a cohort sheet beside a master-detail sheet
// that walked every custom config of every selected surface. The master-detail sheet is
// gone: a config belongs to the surface that owns it, and the integration page already
// draws the whole catalogue — default and custom alike — in one place, with a working copy,
// Cancel and Done. Editing thirty configs from a cohort bar was capability nobody asked for
// standing where the one simple act should have been.
//
// The rows come from `BULK_ROWS` and are drawn with the integration page's own control
// renderer (`cfgCtlHtml`, `cfgDefs()`), so a control here can never drift from the same
// control there — this sheet only supplies its own receiver. The anatomy is the ad sheet's
// (14 Sep, user call): levers on the left, CHANGES TO APPLY on the right in the card both
// sheets now share (`changesCardHtml`), so the two cohort acts are one screen learnt once.

let PB = null;   // { fields: {}, seed: {}, open: Set(field) }

function playerBehaviourJourney() {
  if (!KSEL.size) return;
  PB = { fields: {}, seed: {}, open: new Set() };
  renderPBScreen();
}

function closePBScreen() {
  PB = null;
  closeDialog();
}

// ---------- what the selection holds today ----------
// COUNTED, never a suggestion: one word when they agree, the spread when they don't.
function pbWordOf(f, v) {
  if (v !== undefined && v !== null) return pbWord(f, v);
  const d = cfgDefs()[f] || {};
  return d.dflt !== undefined ? pbWord(f, d.dflt) : '—';
}

function pbTodayWord(f) {
  const words = [];
  for (const k of selectedKeys()) {
    const w = pbWordOf(f, (k.player || {})[f]);
    if (!words.includes(w)) words.push(w);
  }
  if (words.length === 1) return words[0];
  if (words.length <= 3) return words.join(' · ');
  return `${words.length} different values`;
}

// ---------- the draft ----------
// OPENING A ROW NEVER QUEUES ONE. A segment can draw "nothing chosen"; a number cannot, so
// it is SEEDED — from what the selection already holds when it agrees, and from the field's
// own default when it does not. A seed is counted, never a suggestion: nothing is queued
// until somebody moves it, and the foot's count only ever counts real answers.
function pbOpen(f) {
  PB.open.add(f);
  if (PB.seed[f] === undefined) {
    const vals = [];
    for (const k of selectedKeys()) {
      const v = (k.player || {})[f];
      if (!vals.some(x => JSON.stringify(x) === JSON.stringify(v))) vals.push(v);
    }
    const d = cfgDefs()[f] || {};
    const one = vals.length === 1 && vals[0] !== undefined ? vals[0] : d.dflt;
    if (one !== undefined) PB.seed[f] = one;
  }
  renderPBScreen();
}

function pbUnset(f) {
  PB.open.delete(f);
  delete PB.fields[f];
  delete PB.seed[f];
  renderPBScreen();
}

function pbEff() { return { ...PB.seed, ...PB.fields }; }
function pbPut(f, v) { PB.fields[f] = v; }
function pbSet(f, v) { pbPut(f, v); renderPBScreen(); }
function pbChip(f, o) {
  const def = cfgDefs()[f];
  const cur = pbEff()[f] || [];
  const has = cur.some(x => String(x) === String(o));
  if (has && def.keep !== undefined && String(o) === String(def.keep)) return;
  pbSet(f, has ? cur.filter(x => String(x) !== String(o)) : [...cur, o]);
}
// A timing or a threshold of 0 means OFF — a switch and a number, never a zero somebody has
// to know the meaning of. The last real value is kept while the switch is off.
const PB_LAST = {};
function pbZero(f, dflt) {
  const cur = pbEff()[f] ?? 0;
  if (cur > 0) { PB_LAST[f] = cur; pbSet(f, 0); } else pbSet(f, PB_LAST[f] || dflt);
}
// TYPING NEVER REPAINTS, or the caret goes with it: the row is marked queued in place and
// the foot recounts, which is everything a repaint would have done.
function pbNum(el, f) { const n = Number(el.value); if (Number.isFinite(n)) pbPut(f, n); pbMark(el); }
function pbMs(el, f) { const n = Number(el.value); pbPut(f, Number.isFinite(n) ? Math.round(n * 1000) : 0); pbMark(el); }
function pbText(el, f) { pbPut(f, el.value); pbMark(el); }
// TYPING NEVER REPAINTS THE SHEET, or the caret goes with it — so the row is marked queued,
// its now-redundant today-word removed, and the card and foot redrawn IN PLACE. The card holds
// no field the caret can be in, so redrawing it costs nothing.
function pbMark(el) {
  const row = el.closest('.bqf-r');
  if (row) {
    row.classList.add('queued');
    const tail = row.querySelector('.bqf-today');
    if (tail) tail.remove();
  }
  const card = dialogRoot().querySelector('.bqp');
  if (card) card.outerHTML = pbChangesCardHtml();
  pbFootSync();
}
function pbFootSync() {
  const n = Object.keys(PB.fields).length;
  const keys = selectedKeys();
  const c = dialogRoot().querySelector('.rvw-count');
  if (c) c.textContent = n ? `${n} change${n === 1 ? '' : 's'} · ${keys.length} integration${keys.length > 1 ? 's' : ''}` : '';
  const btn = document.getElementById('pb-apply');
  if (btn) btn.disabled = !n;
}

// WHO RECEIVES THE ANSWER on this sheet — one verb per way a control can be written to, so
// the page's control renderer draws for this draft without knowing anything about it. Every
// kind is wired even though five rows use two of them: a sixth row is then a list entry,
// never a new handler.
const PB_H = {
  set: (f, v) => `pbSet('${f}', ${v})`,
  chip: (f, v) => `pbChip('${f}', ${v})`,
  zero: (f, d) => `pbZero('${f}', ${d})`,
  num: f => `pbNum(this, '${f}')`,
  ms: f => `pbMs(this, '${f}')`,
  text: f => `pbText(this, '${f}')`,
  color: f => `pbText(this, '${f}')`,
  hex: f => `pbText(this, '${f}')`,
  repaint: () => 'renderPBScreen()',
  pick: f => (x => pbSet(f, x)),
};

// ---------- the rows ----------
// A row is SHUT until it is asked for: its name, what the selection holds today, and the one
// word that opens it. Open, it is the page's own control with the value it is replacing
// beside it and an × that leaves the field alone again. Nothing is preselected, so a sheet
// nobody touched changes nothing.
function pbRowHtml(f, def, eff) {
  const set = PB.fields[f] !== undefined;
  const open = set || PB.open.has(f);
  const today = pbTodayWord(f);
  if (!open) {
    return `
    <div class="bqf-r closed" data-r="${f}" onclick="pbOpen('${f}')">
      <span class="bqf-l">${esc(def.l)}</span>
      <span class="bqf-today">${esc(today)}</span>
      <span class="bqf-set">Set</span>
    </div>`;
  }
  const na = def.na ? def.na(eff) : '';
  // OPEN, THE ROW SAYS WHAT IT IS ANSWERING AND NOTHING ELSE. A queued row's from → to is on
  // the card to the right; printing it here as well said one thing twice, a hand's width
  // apart, in two vocabularies. An unset open row keeps today's value, because that is the
  // thing the control is about to replace and there is nothing on the card yet.
  return `
    <div class="bqf-r open ${set ? 'queued' : ''}" data-r="${f}"${na ? ` title="${esc(na)}"` : ''}>
      <span class="bqf-l">${esc(def.l)}</span>
      <span class="bqf-c form">${cfgCtlHtml(f, def, eff, na, PB_H)}</span>
      <span class="bqf-s">${set ? '' : `<span class="bqf-today">${esc(today)}</span>`}
        <button type="button" class="bqs-x on" title="Leave this one alone" onclick="pbUnset('${f}')">×</button></span>
    </div>`;
}

// The queue, in the card the ad sheet draws too — one component, one grammar, one name.
function pbChangesCardHtml() {
  return changesCardHtml(pbChanges().map(c => ({
    label: c.label, from: c.fromText, to: c.toText, drop: `pbUnset('${c.field}')`,
  })), { clear: 'pbClear()', empty: 'Nothing changed yet' });
}

function pbClear() {
  PB.fields = {};
  PB.open = new Set();
  PB.seed = {};
  renderPBScreen();
}

function renderPBScreen() {
  if (!PB) return;
  const n = Object.keys(PB.fields).length;
  const keys = selectedKeys();
  const eff = pbEff();
  const defs = cfgDefs();
  const was = dialogRoot().querySelector('.dlg-body');
  const top = was ? was.scrollTop : 0;
  dialogRoot().innerHTML = `
    <div class="dlg-veil"><div class="dlg bulk pbx steady">
      <h3>Player behaviour<span class="dlg-kicker">${keys.length} integration${keys.length > 1 ? 's' : ''} · custom configs follow unless they overrode it</span></h3>
      <div class="dlg-body">
        <div class="bulk-split">
          <div class="bulk-fields">${BULK_ROWS.map(f => pbRowHtml(f, defs[f], eff)).join('')}</div>
          ${pbChangesCardHtml()}
        </div>
      </div>
      <div class="dlg-foot">
        <span class="rvw-count">${n ? `${n} change${n === 1 ? '' : 's'} · ${keys.length} integration${keys.length > 1 ? 's' : ''}` : ''}</span>
        <button class="btn ghost" onclick="closePBScreen()">Cancel</button>
        <button class="btn" id="pb-apply" ${n ? '' : 'disabled'} onclick="pbApply()">Apply</button>
      </div>
    </div></div>`;
  const body = dialogRoot().querySelector('.dlg-body');
  if (body && top) body.scrollTop = top;
}

function pbChanges() {
  return Object.keys(PB.fields).map(f => ({
    where: 'Player behaviour', field: f, label: cfgFieldLabel(f),
    fromText: pbTodayWord(f),
    toText: pbWordOf(f, PB.fields[f]),
  }));
}

// Apply ends on THE CHANGE REVIEW like every other cohort act (7 Sep, UAT P2: the one-step
// exception made this the only cohort write nobody read first).
async function pbApply() {
  if (!PB || !Object.keys(PB.fields).length) return;
  const fields = { ...PB.fields };
  const seed = { ...PB.seed };
  const keys = selectedKeys();
  const names = keys.slice(0, 2).map(k => k.name).join(', ') + (keys.length > 2 ? ` +${keys.length - 2} more` : '');
  const changes = pbChanges();
  closePBScreen();
  const ok = await reviewChanges({
    title: `Apply to ${keys.length} integration${keys.length > 1 ? 's' : ''}?`,
    kicker: names,
    changes,
    okLabel: `Apply to ${keys.length}`,
    cancelLabel: 'Back',
    // Step 2 of this journey — same footprint, so the footer does not move (see
    // `.dlg.rvw.steady-player`).
    steady: 'player',
  });
  // Back leaves the sheet exactly as it was — the levers are still there to edit.
  if (!ok) { PB = { fields, seed, open: new Set() }; renderPBScreen(); return; }
  await bulkApplyDirect('playerFields', { fields });
  await refreshKeysList();
}
