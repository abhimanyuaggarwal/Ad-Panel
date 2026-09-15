// views-keys-bulk-player.js — PLAYER BEHAVIOUR, the cohort act over a selection: pick the
// setting, then answer it, and the answer is written to every selected integration's player
// (the `playerFields` bulk action).
// Loads after views-keys-bulk-ads.js; uses the list file's selection helpers at runtime.
//
// PICK THE SETTING, THEN ANSWER IT (15 Sep, third cut, user call — *"can we make it like the
// custom config wherein we select the field first to apply change bulk and then set its
// value"*). The sheet before this one printed five levers, because five was what a printed
// list could carry — and five was never the real number.
//
// THE SEAM IS WIDER THAN THE SHEET WAS, ON PURPOSE (carried here from `BULK_ROWS`, whose job
// this file now does). `BULK_PLAYER_FIELDS` accepts the whole player behaviour card — twenty
// five fields — and refuses four by name (`BULK_NEVER_FIELDS`): the ones a single surface
// owns, where a blanket write is not a blunt instrument but a wrong one. Both lists ride on
// `/panel/meta`, and this sheet now READS them rather than keeping a shortlist of its own:
// the screen and the server can no longer spell the same catalogue differently, and the four
// refusals are drawn greyed IN the menu carrying the server's own sentence.
//
// WHY A PICKER HERE AND A PRINTED LIST ON THE AD SHEET. A break offers six levers, so its
// shut list IS its menu and each row doubles as a report. A player offers twenty-five; a
// printed list of twenty-five blanket levers is a form for a whole estate, which is exactly
// what the config sheet stopped being on 14 Sep. So the levers fold into one strip.
//
// EVERYTHING AFTER THE PICK IS THE AD SHEET, UNCHANGED: the same row (label · control · ×),
// the same CHANGES TO APPLY card (`changesCardHtml`), the same foot,
// and the same CHANGE REVIEW. One cohort screen learnt once; only the way a lever is reached
// differs, and it differs because the counts differ.
//
// ANSWERING IS MANDATORY AFTER A PICK (15 Sep, user call — *"if i have picked up from the
// dropdown then it is mandatory to choose a value for that field"*). A picked row lands with
// NOTHING chosen and the sheet refuses to go on while one is unanswered, naming it. This is
// deliberately NOT what the custom config sheet does — there, picking a setting seeds it at
// the default's value and may stand as `same as default`, because a single surface HAS a
// current value to seed from. A cohort does not: the selection holds many, and seeding one
// of them would be the platform inventing an answer on forty players. The difference is
// correct; do not unify them.
//
// The controls come from the integration page's own renderer (`cfgCtlHtml`, `cfgDefs()`), so
// an answered row can never drift from the same control there. The one thing this file draws
// itself is the UNANSWERED state, which no other screen needs — built from the same `accSeg`
// and `selectHtml` primitives, and handed straight back to `cfgCtlHtml` the moment a value
// exists.

let PB = null;   // { picked: [row], vals: {field: v}, done: Set(row), err: '' }

function playerBehaviourJourney() {
  if (!KSEL.size) return;
  // The journey takes its own copy of WHO (`bulkWhoOpen`): the review's second step can drop a
  // surface from this act or add one that was never ticked on the list, and the list itself is
  // left exactly as it was. Cancel drops the copy; the table behind the veil never moved.
  bulkWhoOpen();
  PB = { picked: [], vals: {}, done: new Set(), open: new Set(), err: '', pickOpen: false };
  renderPBScreen();
}

// Closing the SHEET is not ending the journey — the review is step 2 of it and reads PB and the
// audience all the way through. Both are dropped at the two real endings: Cancel, and the far
// side of an apply.
function closePBScreen() {
  PB = null;
  closeDialog();
}

function cancelPBScreen() {
  bulkWhoClose();
  closePBScreen();
}

// ---------- WHAT A COHORT MAY ANSWER — the server's own two lists ----------
// A menu entry is a ROW (`Remembers` is one row over three fields, `Appearance` one over
// three), so a row is offered only when EVERY field under it is on the allowed list, and
// refused when any field under it is on the never list. No third opinion lives here.
function pbAllowed() { return (KL_META && KL_META.bulkPlayerFields) || []; }
function pbNever() { return (KL_META && KL_META.bulkNever) || {}; }
function pbRowNever(r) {
  const never = pbNever();
  for (const f of cfgRowFields(r)) if (never[f]) return never[f];
  return '';
}
function pbRowAllowed(r) {
  const ok = pbAllowed();
  return cfgRowFields(r).every(f => ok.includes(f));
}
// Every row this sheet knows about, in the catalogue's own order and sections.
function pbCatalogue() {
  return CFG_SECTIONS.map(sec => ({
    k: sec.k, name: sec.name,
    rows: [...sec.lead, ...sec.more].filter(r => pbRowAllowed(r) || pbRowNever(r)),
  })).filter(s => s.rows.length);
}
// Which field belongs to which row — every write comes back as a field and has to find its
// row again to mark it answered.
function pbRowOf(f) {
  for (const sec of CFG_SECTIONS) {
    for (const r of [...sec.lead, ...sec.more]) if (cfgRowFields(r).includes(f)) return r;
  }
  return f;
}

// ---------- what the selection holds today ----------
// COUNTED, never a suggestion: one word when they agree, the spread when they don't.
function pbWordOf(f, v) {
  const d = cfgDefs()[f] || {};
  if (d.none && (v === '' || v === undefined || v === null)) return d.none;
  if (v !== undefined && v !== null) return pbWord(f, v);
  return d.dflt !== undefined ? pbWord(f, d.dflt) : '—';
}

// THE COHORT'S TODAY-WORD IS GONE (15 Sep, user call). `pbTodayWord` counted what the selection
// holds for one field — one word where they agree, the spread where they do not — and
// `pbRowTodayWord` did the same for a row of three. Both existed to fill a from-side: first on
// the sheet's row (dropped earlier the same day — an empty control IS the unanswered state),
// then in the change review, which now shows the field and the answer only. Nothing reads a
// cohort's prior value any more, so nothing computes one. `pbWordOf` below stays — it says what
// ONE surface, or this draft, answers, which is a different question.

// The two rows that are three fields wearing one name, in words a person reads.
function pbComposedWord(r, src) {
  const defs = cfgDefs();
  const at = f => (src[f] !== undefined ? src[f] : defs[f] && defs[f].dflt);
  if (r === 'remembers') {
    const def = defs.remembers;
    const on = def.fs.filter(f => at(f) !== false).map(f => def.words[def.fs.indexOf(f)]);
    if (!on.length) return 'Nothing';
    return on.length === def.fs.length ? 'Everything' : on.join(', ');
  }
  if (r === 'appearance') {
    const brand = at('brandColor') || '—';
    return `${brand}${at('logoUrl') ? ' · logo' : ' · no logo'}`;
  }
  return cfgRowFields(r).map(f => pbWordOf(f, at(f))).join(' · ');
}

// The drafted answer for a row, in the same words.
function pbDraftWord(r) {
  const fs = cfgRowFields(r);
  if (fs.length === 1) return pbWordOf(fs[0], PB.vals[fs[0]]);
  return pbComposedWord(r, PB.vals);
}

// ---------- picking, answering, dropping ----------
// PICKING OPENS THE QUESTION; IT NEVER ANSWERS IT. A row lands with no value chosen and
// stays out of the queue until somebody gives it one. The two rows whose control cannot be
// drawn empty (the nine controls, the colours) are the exception the comment at the top
// names: they land at what the selection already holds when it agrees, and at the field's
// own default when it does not — and they are still unanswered until moved.
function pbPick(r) {
  if (!PB || PB.picked.includes(r)) return;
  // FAIL CLOSED, NOT MENU-CLOSED. The strip greys what the platform refuses, but a greyed
  // option is a courtesy of one renderer; the refusal itself is the server's, so it is
  // enforced here too — the sheet cannot carry a question it is not allowed to ask.
  const why = pbRowNever(r);
  if (why) { PB.err = `${cfgFieldLabel(r)} is each integration’s own. ${why}`; renderPBScreen(); return; }
  pbPickQuiet(r);
  PB.err = '';
  renderPBScreen();
  pbGoTo(r);
}

// A control that cannot say "nothing yet": a grid of nine, a strip of speeds, three chips,
// three colours. Everything else draws empty.
function pbNeedsSeed(def) {
  return ['shown', 'multi', 'set', 'look'].includes(def.kind);
}

// WHERE ONE OF THOSE FOUR STARTS. What the selection already holds when it agrees — counted,
// and the only honest prefill there is. When it does not agree there is nothing counted to
// start from, so the control takes the resting position it draws anyway with no value behind
// it: every control shown, every speed offered, everything remembered, no colour set. That
// is the platform's own default, not one integration's answer standing in for forty — and
// the row is STILL unanswered, so nothing leaves the sheet until somebody moves it.
function pbSeedValue(f, rowDef) {
  const one = pbUniform(f);
  if (one !== undefined) return one;
  const d = cfgDefs()[f] || {};
  if (d.dflt !== undefined) return d.dflt;
  switch (rowDef.kind) {
    case 'set': return true;
    case 'shown': return [];
    case 'multi': return [...(rowDef.opts || [])];
    default: return '';
  }
}

// One value the whole selection already agrees on, or undefined when they differ — a
// control is never prefilled with one integration's answer as if it spoke for all.
function pbUniform(f) {
  let first, seen = false;
  for (const k of selectedKeys()) {
    const v = (k.player || {})[f];
    if (!seen) { first = v; seen = true; }
    else if (JSON.stringify(v ?? null) !== JSON.stringify(first ?? null)) return undefined;
  }
  return first;
}

function pbDrop(r) {
  if (!PB) return;
  pbDropQuiet(r);
  PB.err = '';
  renderPBScreen();
}

// Ticking a whole section is ONE act: it changes the draft for every row under it and paints
// once at the end, rather than repainting the sheet ten times under the cursor.
function pbDropQuiet(r) {
  PB.picked = PB.picked.filter(x => x !== r);
  PB.done.delete(r);
  PB.open.delete(r);
  for (const f of cfgRowFields(r)) delete PB.vals[f];
}

function pbPickQuiet(r) {
  if (PB.picked.includes(r) || pbRowNever(r)) return;
  PB.picked.push(r);
  const def = cfgDefs()[r] || {};
  if (pbNeedsSeed(def)) {
    for (const f of cfgRowFields(r)) PB.vals[f] = deepCopy(pbSeedValue(f, def));
  }
}

// ---------- CLOSED, THEN SET, THEN ANSWERED — the ad sheet's own three states (15 Sep) ----------
// (user call — *"ad behaviour has a Set CTA, player behaviour has no such Set CTA; these two
// should be uniform for a mature platform"*.) The two sheets had arrived at the same row and two
// different ways into it: a break's lever sat closed with `Set` under the cursor, a player's
// setting arrived with its control already open. One screen asked to be opened and the other did
// not, which is two products, and it is the LAST thing on these two sheets that was not the same.
//   A picked setting lands closed now, exactly as a lever does: its name, and the door on hover.
// That costs one click and buys the thing the picker could not give — the list of what you are
// about to change, readable as a list before you start answering any of it — and it makes both
// cohort sheets one grammar all the way down: closed → open/unanswered → queued.
//   `PB.open` is the ad sheet's `d.open` under another name: rows the person has opened. A row
// that has been ANSWERED is open by definition and never folds back on its own.
function pbOpenRow(r) {
  if (!PB) return;
  PB.open.add(r);
  renderPBScreen();
  pbGoTo(r, false);
}

function pbIsOpen(r) { return PB.done.has(r) || PB.open.has(r); }

function pbClear() {
  PB.picked = [];
  PB.vals = {};
  PB.done = new Set();
  PB.open = new Set();
  PB.err = '';
  renderPBScreen();
}

function pbEff() { return { ...PB.vals }; }
function pbPut(f, v) {
  PB.vals[f] = v;
  PB.done.add(pbRowOf(f));
  PB.err = '';
}
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
// TYPING NEVER REPAINTS, or the caret goes with it: the row is marked answered in place and
// the card and the foot redraw, which is everything a repaint would have done.
function pbNum(el, f) {
  const n = Number(el.value);
  if (el.value.trim() === '') { delete PB.vals[f]; PB.done.delete(pbRowOf(f)); }
  else if (Number.isFinite(n)) pbPut(f, n);
  pbMark(el, f);
}
function pbMs(el, f) {
  const n = Number(el.value);
  if (el.value.trim() === '') { delete PB.vals[f]; PB.done.delete(pbRowOf(f)); }
  else pbPut(f, Number.isFinite(n) ? Math.round(n * 1000) : 0);
  pbMark(el, f);
}
function pbText(el, f) { pbPut(f, el.value); pbMark(el, f); }
function pbMark(el, f) {
  const row = el.closest('.bqf-r');
  if (row) {
    const r = pbRowOf(f);
    const done = PB.done.has(r);
    const changes = done && pbRowChanges(r);
    row.classList.toggle('queued', changes);
    row.classList.toggle('unset', !done);
    // The row's own state, kept true while the caret stays put — the one thing a repaint
    // would do that typing must not. The row says nothing while it waits (the empty control is
    // the state); an answer that lands on nothing says so where it stands rather than leaving
    // a silent row beside an unmoved count; and emptying the box again takes the words away,
    // because the row is back to being a question.
    const slot = row.querySelector('.bqf-s');
    if (slot) {
      for (const el2 of slot.querySelectorAll('.pb-same')) el2.remove();
      if (done && !changes) slot.insertAdjacentHTML('afterbegin', '<span class="pb-same">already this everywhere</span>');
    }
  }
  const card = dialogRoot().querySelector('.bqp');
  if (card) card.outerHTML = pbChangesCardHtml();
  pbFootSync();
}
function pbFootSync() {
  const n = pbChanges().length;
  const c = dialogRoot().querySelector('.rvw-count');
  if (c) c.textContent = n ? `${n} change${n === 1 ? '' : 's'}` : '';
  // The audience half of this foot moved to `.bulk-applies` at the button's shoulder.
  const who = dialogRoot().querySelector('.bulk-applies');
  if (who) who.innerHTML = bulkAppliesNote();
  const btn = document.getElementById('pb-apply');
  if (btn) btn.disabled = !PB.picked.length;
}

// The arrival flash says "this is the row you just added". A REFUSAL must not use it: the
// flagged row is already wearing the warning, and lighting it as well puts two signals on one
// state — one of them in the colour this app uses for "changed". So the refusal scrolls
// without lighting.
function pbGoTo(r, lit = true) {
  requestAnimationFrame(() => {
    const el = dialogRoot().querySelector(`.bqf-r[data-r="${r}"]`);
    if (!el) return;
    el.scrollIntoView({ block: 'center' });
    if (!lit) return;
    el.classList.add('lit');
    setTimeout(() => el.classList.remove('lit'), 1500);
  });
}

// WHO RECEIVES THE ANSWER on this sheet — one verb per way a control can be written to, so
// the page's control renderer draws for this draft without knowing anything about it.
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

// ---------- the control, including the one state no other screen needs ----------
// An ANSWERED row is the integration page's own control, drawn by the page's own renderer.
// An UNANSWERED one is the same control with nothing in it — built from the same primitives
// so the two cannot look like different products, and only ever a starting state.
function pbCtlHtml(r, def, eff, na) {
  const lit = o => (typeof o === 'string' ? `'${o}'` : o);
  // A COHORT NEVER GETS A BARE TOGGLE. A switch has to stand somewhere, and where it stood
  // reads as the selection's answer when it is only the control's resting position — the
  // lesson the ad sheet's `direct` row was re-cut for. On/off is an explicit pair here, in
  // both states.
  if (def.kind === 'bool') {
    const cur = PB.vals[r] === undefined ? undefined : (PB.vals[r] ? 'yes' : 'no');
    return accSeg(cur, ['yes', 'no'], ['Yes', 'No'], o => `pbSet('${r}', ${o === 'yes'})`, na);
  }
  // THE COLUMN'S CUT OF THE TALL CONTROLS (`o.compact`), the same one the integration page
  // takes: this row's value column is a column, not a modal, and the nine controls drawn as
  // a grid of labelled tiles stood 400px tall in it — one setting eating the whole sheet.
  if (PB.done.has(r) || pbNeedsSeed(def)) return cfgCtlHtml(r, def, eff, na, PB_H, { compact: true });
  switch (def.kind) {
    case 'enum':
      if (def.opts.length > 3) {
        return selectHtml(undefined, def.opts.map((o, ix) => ({ v: o, label: def.words[ix] })),
          PB_H.pick(r), { ph: 'Choose a value…' });
      }
      return accSeg(undefined, def.opts, def.words, o => `pbSet('${r}', ${lit(o)})`, na,
        o => (def.whyFor ? def.whyFor(o) : ''));
    case 'num':
      return `<div class="num-wrap"><input value="" inputmode="numeric"
        oninput="${PB_H.num(r)}"><span class="unit">${esc(def.unit || '')}</span></div>`;
    // A timing is a switch and a number. Unanswered, the switch itself is the question:
    // Off writes the zero, On starts it at the field's own timing and opens the box.
    case 'ms': case 'pct': {
      const one = pbUniform(r);
      const on = (one > 0 ? one : null) ?? def.dflt ?? (def.kind === 'ms' ? 5000 : 50);
      return accSeg(undefined, ['off', 'on'], ['Off', 'On'],
        o => `pbSet('${r}', ${o === 'off' ? 0 : on})`, na);
    }
    default:
      return `<span class="rule-text"><input class="mono" value="" placeholder="${esc(def.ph || '')}"
        spellcheck="false" oninput="${PB_H.text(r)}"></span>`;
  }
}

// ---------- the rows ----------
// A picked row: its name, the control, and the × that takes the question back off the sheet.
// EXACTLY THE AD SHEET'S OPEN ROW, and since 15 Sep exactly the config sheet's waiting row too
// (user call — *"the set cta is there in ad behaviour while not set yet label in the player
// behaviour, make it uniform"*, on the morning's *"remove this Not set yet"*). The caption is
// gone: an empty control IS the unanswered state, and a row with nothing in it is not
// mistakable for one that has been answered. What the row still says is the news — the flag
// once Apply has refused over it, and `already this everywhere` for an answer that lands on
// nothing. What the cohort holds today is the change review's to count, one screen on.
function pbRowHtml(r, def, eff) {
  const done = PB.done.has(r);
  const changes = done && pbRowChanges(r);
  const na = def.na ? def.na(eff) : '';
  const flagged = PB.err && !done;
  // CLOSED IS THE AD SHEET'S CLOSED ROW, to the class: the name, and `Set` arriving under the
  // cursor. A refusal opens every row it names, because a row the sheet is complaining about
  // cannot be one whose control is out of sight.
  if (!pbIsOpen(r)) {
    return `
    <div class="bqf-r closed ${flagged ? 'flag' : ''}" data-r="${r}"${na ? ` title="${esc(na)}"` : ''}
      onclick="pbOpenRow('${r}')">
      <span class="bqf-l">${esc(def.l)}</span>
      <span class="bqf-today"></span>
      <span class="bqf-set">Set</span>
    </div>`;
  }
  // A CONTROL TALLER THAN ITS LABEL TAKES THE WHOLE WIDTH — the config sheet's own rule,
  // for the same two rows: nine controls and three colours are half a form each, and in the
  // value column the strip of nine wrapped into three rags.
  const tall = def.kind === 'look' || def.kind === 'shown';
  return `
    <div class="bqf-r open ${changes ? 'queued' : ''} ${done ? '' : 'unset'} ${flagged ? 'flag' : ''} ${tall ? 'tall' : ''}"
      data-r="${r}"${na ? ` title="${esc(na)}"` : ''}>
      <span class="bqf-l">${esc(def.l)}</span>
      <span class="bqf-c form">${pbCtlHtml(r, def, eff, na)}</span>
      <span class="bqf-s">${done && !changes ? '<span class="pb-same">already this everywhere</span>' : ''}
        <button type="button" class="bqs-x on" title="Take this setting off the sheet" onclick="pbDrop('${r}')">×</button></span>
    </div>`;
}

// THE STRIP THAT CHOOSES THE QUESTIONS — the config sheet's own control, shared outright
// (15 Sep, user call — *"use the same drop down override settings as used in custom config
// modal here"*). It is the same `pickerHtml` both sheets now call, with the same markup and
// the same classes: a box per setting, a box per section that takes everything under it, and
// a menu that stays open while you work, because choosing five settings is one act and not
// five. Only the state behind it differs, which is what the receiver is for.
//   The cohort's verb is different and stays different: the config sheet OVERRIDES a default,
// this one SETS a value on every selected player.
//   It sits INSIDE the left column, so its top edge lines up with the queue card's across the
// split; the rows scroll under it and it does not move.
//   The four the platform refuses sit in the list greyed with the server's reason on hover,
// and a section's box neither counts nor takes them — they are not the section's to give.
// The groups the strip offers — built once and read twice, by the menu and by the empty body's
// map of the sheet (`sheetAnatomyHtml`), so the two can never name or count a section differently.
function pbPickGroups() {
  const defs = cfgDefs();
  return pbCatalogue().map(sec => ({
    k: sec.k, name: sec.name,
    rows: sec.rows.map(r => ({ v: r, label: defs[r].l, tail: pbRowNever(r) ? 'each integration’s own' : '' })),
  }));
}

function pbAddHtml(groups) {
  return `
    <div class="pb-add">
      <span class="pb-add-l">Change settings</span>
      ${pickerHtml(groups, PB_PICK, { ph: 'Choose settings…', cta: !PB.picked.length })}
    </div>`;
}

// WHO RECEIVES THE PICKER'S ANSWERS. Untick takes a setting off the sheet exactly as the row's
// × does, value and all — the sheet is a working copy and Cancel puts the lot back, which is
// what makes a ticked box safe to untick.
const PB_PICK = {
  get open() { return !!(PB && PB.pickOpen); },
  setOpen(v) { if (!PB) return; PB.pickOpen = v; renderPBScreen(); },
  has: r => !!PB && PB.picked.includes(r),
  off: r => pbRowNever(r),
  toggle(r) { (PB.picked.includes(r) ? pbDrop : pbPick)(r); },
  toggleAll(k) {
    const sec = pbCatalogue().find(x => x.k === k);
    if (!sec) return;
    const can = sec.rows.filter(r => !pbRowNever(r));
    const giveBack = can.length > 0 && can.every(r => PB.picked.includes(r));
    for (const r of can) {
      if (giveBack) pbDropQuiet(r); else pbPickQuiet(r);
    }
    PB.err = '';
    renderPBScreen();
  },
};

// The queue, in the card the ad sheet draws too — one component, one grammar, one name.
function pbChangesCardHtml() {
  // The answer this sheet will write, not a transition — a cohort has no single prior value
  // (15 Sep, user call), so this card and the review one screen on both read FIELD · ANSWER,
  // and each tells the two apart by weight and colour rather than by a column of dashes.
  // See `changesCardHtml`.
  return changesCardHtml(pbChanges().map(c => ({
    label: c.label, to: c.toText, drop: `pbDrop('${c.field}')`,
  })), {
    clear: 'pbClear()', empty: 'Nothing chosen yet',
    // Measured inside the 480px frame: the card's column is 309px, its head is 34 and the
    // folded line 36, and a card row is 56 — so four rows and the line fill it exactly. Past
    // that the card folds rather than growing a scrollbar of its own, because a card that
    // scrolls beside a list that scrolls is two scrollbars an inch apart moving different
    // things. See `changesCardHtml`.
    max: 4,
  });
}

// DOES THIS ROW CHANGE ANYTHING. A row whose answer is what every selected integration
// already holds is answered and harmless — it just has nothing to apply, and says so where
// it stands rather than travelling to a review to report `Auto → Auto`.
function pbRowChanges(r) {
  if (!PB.done.has(r)) return false;
  const fs = cfgRowFields(r);
  const defs = cfgDefs();
  for (const k of selectedKeys()) {
    const p = k.player || {};
    for (const f of fs) {
      const held = p[f] !== undefined ? p[f] : (defs[f] || {}).dflt;
      if (JSON.stringify(held ?? null) !== JSON.stringify(PB.vals[f] ?? null)) return true;
    }
  }
  return false;
}

function pbUnanswered() { return PB.picked.filter(r => !PB.done.has(r)); }

function renderPBScreen() {
  if (!PB) return;
  const n = pbChanges().length;
  const keys = selectedKeys();
  const eff = pbEff();
  const defs = cfgDefs();
  // THE SHEET REPAINTS AS ONE BLOCK, so every scroll position on it is carried across by hand.
  // There are two now and neither is `.dlg-body`, which stopped scrolling when the strip came
  // down into the column: the ROWS scroll, and so does the picker's own menu — and with the
  // menu standing open across a repaint (ticking a setting is not closing it), losing its
  // scroll would throw you back to Playback every time you ticked something under Measurement.
  const wasRows = dialogRoot().querySelector('.pb-rows');
  const rowTop = wasRows ? wasRows.scrollTop : 0;
  const wasMenu = dialogRoot().querySelector('.shpick-menu');
  const menuTop = wasMenu ? wasMenu.scrollTop : 0;
  const groups = pbPickGroups();
  const secs = pbCatalogue().map(sec => {
    const rows = sec.rows.filter(r => PB.picked.includes(r));
    if (!rows.length) return '';
    return `
      <section class="pb-sec">
        <div class="pb-sh"><h4>${esc(sec.name)}</h4></div>
        ${rows.map(r => pbRowHtml(r, defs[r], eff)).join('')}
      </section>`;
  }).join('');
  dialogRoot().innerHTML = `
    <div class="dlg-veil"><div class="dlg bulk pbx steady">
      <h3>Player behaviour</h3>
      <div class="dlg-body">
        <div class="bulk-split">
          <div class="bulk-fields">
            ${pbAddHtml(groups)}
            ${PB.err ? `<div class="pb-err">${esc(PB.err)}</div>` : ''}
            <div class="pb-rows">${secs || sheetAnatomyHtml(groups, PB_PICK)}</div>
          </div>
          ${pbChangesCardHtml()}
        </div>
      </div>
      <div class="dlg-foot">
        <span class="rvw-count">${n ? `${n} change${n === 1 ? '' : 's'}` : ''}</span>
        <span class="bulk-applies">${bulkAppliesNote()}</span>
        <button class="btn ghost" onclick="cancelPBScreen()">Cancel</button>
        <button class="btn" id="pb-apply" ${PB.picked.length ? '' : 'disabled'} onclick="pbApply()">Apply</button>
      </div>
    </div></div>`;
  const rows = dialogRoot().querySelector('.pb-rows');
  if (rows && rowTop) rows.scrollTop = rowTop;
  const menu = dialogRoot().querySelector('.shpick-menu');
  if (menu && menuTop) menu.scrollTop = menuTop;
}

// THE TITLE IS TWO WORDS AND NOTHING ELSE (15 Sep, user call — *"Sets the default player on all
// 3 selected integrations — remove this"*). That sentence had walked the whole screen: a block
// under the title with a caveat about custom configs beneath it, then a kicker beside the
// heading, and it was wrong in both seats for the same reason — it qualifies the BUTTON, and it
// was sitting at the far end of the dialog from it, read once on the way in and never again
// while the audience moved underneath it. The audience is stated once now, in the foot, beside
// the act: see `bulkAppliesNote`. The custom-config caveat lives where it always did — a config
// keeps its own answer, which is the config's own rule and not this sheet's news.

// THE ANSWER ONLY (15 Sep, user call) — no from-side on a cohort write, because forty surfaces
// have no single prior value for a review to move away from. `pbRowChanges` still reads what
// each surface holds, to know whether a row changes anything at all; that is a test, not a
// value to print. (`noFrom`, review.js.)
function pbChanges() {
  return PB.picked.filter(pbRowChanges).map(r => ({
    where: 'Player behaviour', field: r, label: cfgFieldLabel(r),
    toText: pbDraftWord(r),
  }));
}

// REFUSED IN PLACE, BY NAME, BEFORE THE REVIEW (7 Sep UAT, P1). A picked setting with no
// answer is not quietly dropped and not silently disabled — the sheet says which ones are
// waiting, marks them, and goes no further.
async function pbApply() {
  if (!PB || !PB.picked.length) return;
  const waiting = pbUnanswered();
  if (waiting.length) {
    // A ROW THE SHEET IS COMPLAINING ABOUT CANNOT BE FOLDED. Naming a setting and then leaving
    // its control behind a `Set` is a refusal you cannot act on where you are standing.
    for (const r of waiting) PB.open.add(r);
    const names = waiting.map(cfgFieldLabel);
    PB.err = `${names.length === 1 ? names[0] + ' has' : names.slice(0, -1).join(', ') + ' and ' + names.slice(-1) + ' have'} no value yet — set ${names.length === 1 ? 'it' : 'them'} or take ${names.length === 1 ? 'it' : 'them'} off the sheet.`;
    renderPBScreen();
    pbGoTo(waiting[0], false);
    return;
  }
  if (!pbChanges().length) {
    PB.err = 'Nothing to apply — every value on the sheet is what these integrations already hold.';
    renderPBScreen();
    return;
  }
  const back = { picked: [...PB.picked], vals: { ...PB.vals }, done: new Set(PB.done), open: new Set(PB.open), err: '', pickOpen: false };
  // THE SHEET GOES, THE DRAFT STAYS. `PB` used to be nulled here and rebuilt from `back` on the
  // way home; it has to live through step 2 now, because the review recounts the change list —
  // which is drawn from the draft — every time its audience moves.
  closeDialog();
  const ok = await reviewChanges({
    ...pbReviewState(),
    cancelLabel: 'Back',
    // Field and answer, no was-side — a cohort has no single previous value.
    noFrom: true,
    // Step 2 of this journey — same footprint, so the footer does not move (see
    // `.dlg.rvw.steady-player`).
    steady: 'player',
    // WHO, ANSWERED HERE (15 Sep, user call) — see the audience block in review.js. Nothing on
    // this sheet caches a cohort fact, so a tick needs no recount of its own: `pbChanges` and
    // every word in it are derived from `selectedKeys()` when they are read.
    audience: {
      chosen: selectedKeys,
      all: bulkWhoAll,
      has: bulkWhoHas,
      toggle: bulkWhoToggle,
      recount: pbReviewState,
    },
  });
  // Back leaves the sheet exactly as it was — the questions are still there to answer, now
  // counted against whatever the audience became.
  if (!ok) { PB = back; renderPBScreen(); return; }
  // WHICH ANSWERS ARE WORTH WRITING is counted AFTER the review, not before it: a row that moved
  // nothing for the cohort you started with can move something for the one you leave with.
  const fields = {};
  for (const r of PB.picked) {
    if (!pbRowChanges(r)) continue;
    for (const f of cfgRowFields(r)) if (PB.vals[f] !== undefined) fields[f] = PB.vals[f];
  }
  PB = null;
  await bulkApplyDirect('playerFields', { fields });
  bulkWhoClose();
  await refreshKeysList();
}

// WHAT THE REVIEW SAYS, COUNTED AGAINST WHOEVER IS IN THE ACT RIGHT NOW — read when the screen
// opens and again after every tick in its audience panel.
function pbReviewState() {
  const keys = selectedKeys();
  return {
    title: `Apply to ${keys.length} integration${keys.length === 1 ? '' : 's'}?`,
    okLabel: keys.length ? `Apply to ${keys.length}` : 'Apply',
    changes: pbChanges(),
    // WHAT HAPPENS AFTER THE BUTTON, said before it (15 Sep, user call — *"when we apply, why
    // are they in unpublished state? it is not the correct communication"*). A cohort write
    // SAVES on every surface it reaches; going on air stays each integration's own deliberate
    // act from its own page, which is the 2 Sep call that took publish off this bar. Somebody who
    // has just confirmed `Apply to 12 integrations?` has every reason to think it is live, so the
    // caption says otherwise while the act is still a question — not in a toast after it.
    foot: 'Saved on each integration · on air when it is published',
    emptyText: keys.length
      ? 'Nothing to change — every answer on the sheet is what these integrations already hold.'
      : 'No integrations in this change — tick at least one above.',
  };
}
