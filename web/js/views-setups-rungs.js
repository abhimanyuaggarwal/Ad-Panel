// views-setups-rungs.js — ONE AD-UNIT BLOCK, everywhere a ladder is drawn in the setup
// editor. A unit is one frame with three tiers (7 Sep, user call): `suUnitHtml` draws the
// frame, `rungRowHtml` its head row, `suRungFactsHtml` the counted fact line and
// `suRungPanelHtml` the settings that edit those facts — the last two swapped by the
// block's own `open` class, which FOCUS sets (`suUnitOpen`). Also here: the rung writers
// (add / toggle / remove / a unit fact), the tag search that fills a rung, and
// `suLadderHtml` (the primary's rule and block, then the waterfall's).
//
// Rungs are addressed by slot key and index; the slot key may be a break ('preroll'),
// a break's direct tier ('preroll@direct') or the waterfall ('shared') — see
// `suSlot` in views-setups-editor.js, which resolves all three to one { rungs, behaviour }.
// Loads before views-setups-editor.js; every call into it happens at runtime.

// THE HANDLE, DRAWN (7 Sep, user call — "make the drag and drop more prominent,
// currently it is hardly discoverable there"). Six dots at a real size beat the braille
// glyph the row wore before, which rendered as a 4px speck at any weight: a ladder's
// ORDER is its most consequential fact, so the control that changes it has to look
// grabbable before anyone tries.
const GRIP_DOTS = `<svg viewBox="0 0 10 16" width="10" height="16" fill="currentColor" aria-hidden="true">
    <circle cx="2.4" cy="3" r="1.35"/><circle cx="7.6" cy="3" r="1.35"/>
    <circle cx="2.4" cy="8" r="1.35"/><circle cx="7.6" cy="8" r="1.35"/>
    <circle cx="2.4" cy="13" r="1.35"/><circle cx="7.6" cy="13" r="1.35"/></svg>`;

// ---------- shared ladder grammar (used only in this room now) ----------

// A ladder is filled in order, so the buttons follow the order too.
function ladderFilled(rungs) {
  return (rungs || []).every(r => !!r.tagId);
}

function canAddRung(rungs) {
  return ladderFilled(rungs);
}

function chainCount(rungs) {
  return (rungs || []).length;
}

// THE POSITION IS THE WALK POSITION (8 Sep, user call — *"in the waterfall the count
// should be counted for only the enabled ones"*). A switched-off unit is not asked, so
// it holds no place in the order: the numbers run 1…N over the units that would
// actually serve, and an off unit wears no number at all (its own row says `off` where
// the number was). Before this, turning unit 4 off left a nine-rung waterfall reading
// 1…9 with two of the numbers naming nobody — so the third partner asked wore a `5`.
// `from` is where the count starts: a custom ladder's fall numbers itself from rung 1,
// because its primary is named by the rule above it rather than by a number.
function livePos(rungs, n, from = 0) {
  const arr = rungs || [];
  if (!arr[n] || arr[n].on === false) return null;
  let p = 0;
  for (let k = from; k <= n; k++) if (arr[k] && arr[k].on !== false) p++;
  return p;
}

// The label a ladder puts in the position column: the walk position, or nothing at all
// on a unit that is switched off.
function posLabel(rungs, n, from = 0) {
  const p = livePos(rungs, n, from);
  return p ? String(p) : '';
}


// THE UNIT IS ONE BLOCK (7 Sep, user call — "the ad unit and its read only settings
// have to be treated as a single block it needs to feel as a single block"). One frame
// per ad unit holds all three tiers: the head row below, the read-only fact line, and
// the settings when they are open. The frame is what hovers, what carries the focus
// ring, what drags, and what a switched-off unit dims — so the unit reads as one thing
// rather than a row with two strays under it. It is also what ALIGNS the settings: they
// are inside the unit's own outline now, so they can no longer run past its right edge
// (before this cut the panel reached 60px past the field, over the row's own gutter).
function suUnitHtml(t, n, r, ctx) {
  const filled = !!r.tagId;
  if (filled && r.on === false) return suUnitOffHtml(t, n, r, ctx);
  const open = filled && SU_RUNG_OPEN === `${t}:${n}`;
  const rc = (ctx.rowClass ? ctx.rowClass(n) : '').trim();
  const cls = `${r.on === false ? ' off' : ''}${filled ? ' filled' : ''}${open ? ' open' : ''}`
    + `${rc ? ' ' + rc : ''}${chgIf(ctx.dirty && ctx.dirty(n))}`;
  return `
    <div class="ad-unit${cls}" data-uk="${t}:${n}" ${dragAttrs(ctx.dragKey, n)}>
      ${unitRailHtml(r, n, t, ctx)}
      ${rungRowHtml(r, n, t, ctx)}
      ${suRungFactsHtml(t, n, r)}
      ${suRungPanelHtml(t, n, r)}
    </div>`;
}

// THE RAIL: WHICH UNIT, AND WHETHER IT RUNS (8 Sep, user call — *"the drag & drop icon,
// the count nos and the switch should be vertically aligned for the ad unit card;
// currently it is on top, it should be vertically in the middle so that the card feels
// as one"*). These three answer for the WHOLE unit — its order, its position, whether it
// serves — but they were the first three cells of the HEAD ROW, so on a two-tier block
// they sat at the top of the card, level with only one of the tiers they govern. Pulled
// out into their own column of the block's own GRID, they stand beside the whole block
// and CENTRE against it:
// the card reads as one thing with one leading group, not as a row with a tier hanging
// under it. It is also what retires `--unit-x` — the fact line and the settings hang off
// the body, so the x they share with the unit's field is structural now, not a measured
// 90px anybody could invalidate by touching a gap.
// An off unit holds no position (the walk-position rule above), so its rail shows none.
function unitRailHtml(r, i, t, ctx) {
  const off = r.on === false;
  const lbl = off ? '' : ctx.rungLabelFor ? ctx.rungLabelFor(i, r) : (i === 0 ? 'Primary' : `Waterfall ${i}`);
  return `
    <div class="unit-rail">
      <span class="rung-grip" aria-hidden="true">${GRIP_DOTS}</span>
      <span class="rung-n ${i === 0 && !off && !ctx.flat ? 'primary' : ''}">${lbl}</span>
      ${ctx.onToggle ? `<span class="toggle tiny ${off ? '' : 'on'}" onclick="${ctx.onToggle(i)}"><span class="track"></span></span>` : ''}
    </div>`;
}

// A SWITCHED-OFF UNIT STANDS DOWN (8 Sep, user call — *"the ad unit which is disabled
// is technically made inactive, it should be treated in an intuitive manner, i.e. maybe
// by tweaking the row by collapsing it and only showing a sleek minimal info about it
// so that we can read it to enable it"*). An off unit is not in the walk: it holds no
// position, none of its facts are being applied, and its settings cannot be reached
// — so a full three-tier block for it was a live unit's worth of ink spent saying
// "ignore me", and the dim it wore made the one thing you do need to read (which unit
// is it?) the hardest line on the ladder.
//
// It collapses to ONE thin line at full contrast: its handle, its switch, the partner
// and the unit's name, and the word `off`. Minimal, and READABLE — the point of the
// line is to recognise the unit and turn it back on. Nothing is lost: every fact stays
// on the rung underneath, and the block opens back out the moment the switch goes on.
// The field goes with the fold (an off unit is not being re-targeted; enable it first),
// which is also what keeps the line thin.
function suUnitOffHtml(t, n, r, ctx) {
  const rc = (ctx.rowClass ? ctx.rowClass(n) : '').trim();
  const tag = SU_TAGS.find(x => x.id === r.tagId);
  return `
    <div class="ad-unit off collapsed${rc ? ' ' + rc : ''}${chgIf(ctx.dirty && ctx.dirty(n))}"
      data-uk="${t}:${n}" ${dragAttrs(ctx.dragKey, n)}>
      ${/* The same rail as a live unit, so a collapsed line's handle, position column and
            switch stand on the exact x they stand on everywhere else in the ladder. No
            hover explainer on the switch: the `off` badge is the state and the switch is
            the act (the room's tooltip policy — title= is for values and refusals). */''}
      ${unitRailHtml(r, n, t, ctx)}
      <div class="rung-row collapsed">
        <span class="uq">
          ${tag ? providerBadge(tag.provider) : ''}
          <span class="uq-name">${esc(suRungLabel(r))}</span>
          <span class="uq-off">off</span>
        </span>
        <span class="rung-acts">
          <button class="rung-x" onclick="${ctx.onRemove(n)}">✕</button>
        </span>
      </div>
    </div>`;
}

// The block's HEAD row: what the unit IS. The grip leads it — a real handle now, at
// full strength (7 Sep, user call — "the drag and drop [is] hardly discoverable"),
// because a ladder whose order decides the revenue cannot hide the one control that
// changes it. The unit's field follows close behind it: the position column and the
// gaps around it were the 55px of void between the two (same call — "moving the ad
// unit a bit to the left close to the drag and drop icon").
function rungRowHtml(r, i, t, ctx) {
  const off = r.on === false;
  // A rung that is off is still a rung: it holds its place and its tag, and reads as
  // standing by rather than as an empty row. Under a SHARED setup this switch is the ops
  // team's sharpest tool — off here is off on every attached surface. The handle, the
  // position and that switch now ride the block's own rail (unitRailHtml): they answer
  // for the whole unit, so they stand beside the whole unit.
  return `
    <div class="rung-row ${off ? 'off' : ''}" onclick="suUnitHeadClick(event, '${t}', ${i})">
      ${ctx.control(i, r)}
      ${ctx.after ? ctx.after(i, r) : ''}
      ${r.tagId ? `<button type="button" class="unit-chev" onclick="suToggleRungSettings('${t}', ${i})"
        aria-label="Show or hide this unit's settings">›</button>` : ''}
      <span class="rung-acts">
        <button class="rung-x" onclick="${ctx.onRemove(i)}">✕</button>
      </span>
    </div>`;
}

function suRungLabel(r) {
  const tag = SU_TAGS.find(x => x.id === r.tagId);
  return tag ? tag.name : (window.NAME_LOOKUP[r.tagId] || '(missing tag)');
}

async function suRefreshTags() {
  const { tags } = await API.listTags();
  SU_TAGS = tags;
  for (const o of tags) window.NAME_LOOKUP[o.id] = o.name;
}

function suAddRung(t) {
  const slot = suSlot(t);
  if (!canAddRung(slot.rungs)) return;
  const cap = isRotation(baseSlot(t)) ? (KL_META.rotationMax || 5) : KL_META.maxRungs;
  if (chainCount(slot.rungs) >= cap) return;
  slot.rungs.push({ type: 'tag', tagId: '' });
  clearErr('sections');
  FORM.rerender();
}

function suToggleRung(t, n) {
  const r = suSlot(t).rungs[n];
  r.on = r.on === false;
  clearErr('sections');
  FORM.rerender();
}

function suRemoveRung(t, n) {
  suSlot(t).rungs.splice(n, 1);
  // The open panel was addressed by index; that index now names a different unit (or
  // none), so the fold closes rather than reopening on the wrong one.
  SU_RUNG_OPEN = null;
  clearErr('sections');
  FORM.rerender();
}

// ---------- a banner's own facts, on its rung (31 Aug, AD-JSON-SCOPE) ----------
// Type-based, never value-based: a display rung in a BREAK always carries them, a video
// rung never does — nothing appears or vanishes as values change. In a rotation the
// timings live in Delivery settings (drawn once, not five times), so its rungs keep
// only the page position.

function suRungFact(t, n, f, v) {
  suSlot(t).rungs[n][f] = v;
  clearErr('sections');
  clearErr('direct');
  FORM.rerender();
}


// WHICH TEMPLATE CARRIES THE UNIT, from the rung it sits on (31 Aug, user call). This
// is a TAG fact — changing it here changes it everywhere the tag is used, so the toast
// counts the blast radius. Standard is absence, as ever.
async function suRungTplSet(t, n, tplId) {
  const r = suSlot(t).rungs[n];
  const tag = SU_TAGS.find(x => x.id === r.tagId);
  if (!tag) return;
  try {
    await API.updateTag(tag.id, { tplId: tplId || null });
    await suRefreshTags();
    const { templates } = await API.listTemplates();
    SU_TPLS = templates;
    // The pick shows in the select itself; a receipt only when the change reaches
    // OTHER setups — the one effect this screen cannot show.
    const others = (tag.usedBy || 1) - 1;
    if (others > 0) toast(`Also changes ${others} other setup${others > 1 ? 's' : ''}`);
    FORM.rerender();
  } catch (e) {
    toast((e.errors && e.errors[0]?.message) || e.message, 'bad');
  }
}

function suRungFactNum(el, t, n, f) {
  suSlot(t).rungs[n][f] = Number(el.value);
  QF_TEXT[`${suQFKey(t, f)}:r${n}`] = el.value;
}

// WHAT THE HEAD ROW WEARS BESIDE THE FIELD: only what is news. A hand-typed unit GAM
// has not caught up on says so; nothing else.
// THE GEAR IS GONE (7 Sep, user call — "remove settings logo and open the settings
// whenever the ad unit is in focus"). It was a door standing next to a door: the unit's
// fact line already opens the settings, and putting the caret in the unit's own field
// is what someone does the moment they mean to work on that unit. So focus IS the open
// now (the delegated `focusin` under `suUnitOpen`) and the row is one icon quieter.
function suRungAfterHtml(t, n, r) {
  if (!r.tagId) return '';
  return window.TAG_OFFDIR[r.tagId] ? '<span class="offdir">not in GAM</span>' : '';
}


// ONE PANEL, EVERY UNIT (31 Aug, user call): pause is every unit's own answer now, a
// template can be attached where the unit is added, and the labels say what the viewer
// would see — one decision per line, the room's own label-column grammar. The panel
// FOLDS per rung (the room's own disclosure, like the slot rows) so a ten-rung ladder
// stays ten lines; only what differs from the defaults wears a chip when closed.
// Contents are type-based, never value-based: a video unit has no page slot or clocks;
// a rotation banner has no pause (nothing is playing under it).
// BELOW THE FOLD, IN THE PAGE'S OWN GRAMMAR (3 Sep, user call — the settled shape,
// after three cuts each of which taught one thing):
//   · the FOLD was right all along — a waterfall is read far more often than a unit is
//     tuned, so the row carries only the waterfall: order, switch, provider, unit;
//   · what killed fold v1 was its DIALECT (a 2-col 11.5px grid the page speaks nowhere
//     else) and its DOORWAY (an unlabelled chevron). The panel now speaks the exact row
//     language Delivery settings speaks two zones down — label column, one control, one
//     height — and the door is a word: a quiet "Settings" button on every filled row.
//   · the TABLE cut proved values need permanent labels; in a one-unit panel the label
//     column IS that, without ten rows of repeated chrome.
// A freshly picked unit opens its own panel — the first thing a new rung teaches is
// where its settings live. One panel open at a time; the ladder stays a ladder.
let SU_RUNG_OPEN = null; // `${slot}:${index}`

// FOCUS IS THE DOOR (7 Sep, user call). Every filled unit paints BOTH tiers — the fact
// line and the settings — and the block's own `open` class picks which one shows. That
// is not a saving, it is the only way focus can open the fold at all: opening through
// `FORM.rerender()` would repaint the field the caret just landed in and throw the
// caret away (the toolbar's own lesson — stateful bits inside a live field are toggled
// imperatively, never repainted). So the switch below is pure DOM, and one unit is open
// at a time — the ladder stays a ladder.
function suUnitOpen(uk) {
  const el = document.querySelector(`.ad-unit[data-uk="${uk}"]`);
  if (!el || !el.classList.contains('filled')) return;
  if (SU_RUNG_OPEN === uk && el.classList.contains('open')) return;
  document.querySelectorAll('.ad-unit.open').forEach(o => { if (o !== el) o.classList.remove('open'); });
  el.classList.add('open');
  SU_RUNG_OPEN = uk;
}

function suUnitClose() {
  document.querySelectorAll('.ad-unit.open').forEach(o => o.classList.remove('open'));
  SU_RUNG_OPEN = null;
}

// The fact line is still a door you can click — it is the summary of what is behind it,
// so clicking it is the obvious way in and out.
function suToggleRungSettings(t, n) {
  const uk = `${t}:${n}`;
  if (SU_RUNG_OPEN === uk) suUnitClose();
  else suUnitOpen(uk);
}

// THE WAY BACK (7 Sep, user question — "if the settings block is opened how to close
// it?", then "I still cannot find any way to close it"). It was missing outright at
// first: focus and the fact line both only OPENED the fold, and the fact line is hidden
// while it is open, so the only exit was opening a different unit.
//
// The first fix was a caret plus "the head row is the toggle", and MEASURING IT is what
// showed why that still failed: the caret was a 14×15px glyph, and of the head row's
// 894px only 82px is not one of its own controls — the unit's field is 742px of it — so
// the "click the row" target was thin strips nobody can aim at. Both replaced:
//   · the caret is a real BUTTON, 26×26, standing at rest and wearing a white surface
//     while the fold is open — on the block's tint that reads as a control that is
//     pressed and can be pressed again;
//   · CLICKING ANYWHERE OUTSIDE THE BLOCK closes it, which is the gesture people try
//     first and the one every menu on this page already answers to. This supersedes the
//     earlier "focus leaving leaves the fold as it stands" — a deliberate click away is
//     not the flicker that closing on blur would have been;
//   · Escape still closes without the mouse.
// The head row keeps its toggle (it costs nothing and catches the padding), but nothing
// depends on it any more.
function suUnitHeadClick(e, t, n) {
  // The row's own controls answer for themselves: the unit's field (first click focuses
  // and opens, a second opens its search), the caret and the ✕. The switch and the handle
  // are not on this row any more — they moved to the block's rail (8 Sep) — so they can
  // no longer reach this handler at all.
  if (e.target.closest('.lookup, .rung-acts, .unit-chev')) return;
  suToggleRungSettings(t, n);
}

// Click away: outside every unit closes the fold. `isConnected` is the guard that
// matters — a pick from the tag search rerenders the ladder before this listener runs,
// so its target is detached by now, and a detached target is NOT "outside the block":
// treating it as one would close the panel a freshly picked unit just opened.
document.addEventListener('click', e => {
  if (!SU_RUNG_OPEN || !e.target.isConnected) return;
  if (e.target.closest('.ad-unit')) return;
  suUnitClose();
});

// Escape closes what is open, innermost first: a tag search over the fold, then the fold.
document.addEventListener('keydown', e => {
  if (e.key !== 'Escape') return;
  const menu = document.querySelector('.ad-unit .lk-menu.open');
  if (menu) { menu.classList.remove('open'); return; }
  if (SU_RUNG_OPEN) suUnitClose();
});

// Anything inside a unit taking focus opens that unit: the caret landing in its field,
// tabbing onto its remove ✕, or reaching a control in its own settings (already open,
// so a no-op). Focus moving OUT of the ladder leaves the fold as it stands — a panel
// that closed itself the moment you reached for a select elsewhere would be a flicker,
// not a behaviour. One delegated listener, registered once, like the click-away that
// closes the selects.
document.addEventListener('focusin', e => {
  if (!e.target.closest) return;
  // The caret and the remove ✕ are focusable buttons INSIDE the block; opening on their
  // focus would cancel the caret's own click (focus opens, then the click toggles it
  // shut again — net nothing, which is exactly what "I cannot close it" felt like).
  if (e.target.closest('.unit-chev, .rung-acts')) return;
  const u = e.target.closest('.ad-unit.filled[data-uk]');
  if (u) suUnitOpen(u.dataset.uk);
});

function suRungPanelHtml(t, n, r) {
  if (!r.tagId) return '';
  const isDisplay = window.TAG_TYPE[r.tagId] === 'display';
  const rot = isRotation(baseSlot(t));
  const tv = f => QF_TEXT[`${suQFKey(t, f)}:r${n}`] ?? (r[f] ?? '');
  const clock = (f, ph, off) => `<div class="num-wrap sm${off ? ' off' : ''}"><input value="${esc(tv(f))}" placeholder="${ph}" inputmode="numeric"${off ? ' disabled' : ''}
      oninput="suRungFactNum(this, '${t}', ${n}, '${f}')"><span class="unit">sec</span></div>`;
  const row = (lbl, ctl, why, off) => `
      <div class="up-r${off ? ' off' : ''}"${why ? ` title="${esc(why)}"` : ''}>
        <span class="up-l">${esc(lbl)}</span>
        <span class="up-c">${ctl}</span>
      </div>`;
  const slots = (KL_META.displaySlots || []).map(v => ({ v, label: label('displaySlot', v) }));
  const paused = (r.pause || (isDisplay ? 'no' : 'yes')) === 'yes';
  const tag = SU_TAGS.find(x => x.id === r.tagId);
  const provTpls = tag ? SU_TPLS.filter(x => x.provider === tag.provider && inScope(x.property)) : [];
  // ONE PAUSE ANSWER FOR THE WHOLE WATERFALL (5 Sep): while the waterfall's own
  // switch is on, every unit's Content pause dims in place wearing the one answer — the
  // unit's own answer is kept underneath and returns the moment the switch goes off.
  const govPause = t === 'shared' ? suWf().pauseAll : null;
  return `
    <div class="ad-unit-panel">
      ${rot ? '' : row('Content pause', govPause
        ? `<span class="sg-off">${esc(label('pause', govPause))} — one answer for the whole waterfall</span>`
        : accSeg(r.pause || (isDisplay ? 'no' : 'yes'), KL_META.pauseModes || ['yes', 'no', 'size'],
        (KL_META.pauseModes || ['yes', 'no', 'size']).map(x => label('pause', x)),
        o => `suRungFact('${t}', ${n}, 'pause', '${o}')`),
        govPause ? 'Set once for the whole waterfall' : '', !!govPause)}
      ${rot ? '' : row('Request delay', clock('showAfterSec', 'now'))}
      ${row('Ad placement',
        selectHtml(r.displaySlot || (KL_META.displaySlots || [])[0], slots, v => { suRungFact(t, n, 'displaySlot', v); }))}
      ${tag ? row('Ad unit template',
        // A switched-off template stays pickable — the pick is legal, just inert — and
        // wears the fact as a micro-suffix where the decision is made.
        selectHtml(tag.tplId || '', [{ v: '', label: 'Standard' }, ...provTpls.map(x => ({ v: x.id, label: x.on === false ? `${x.name} · off` : x.name }))],
          v => { suRungTplSet(t, n, v); }),
        (tag.usedBy || 1) > 1 ? `A tag fact — changes ${tag.usedBy} setups` : '') : ''}
      ${isDisplay && !rot ? `
        ${row('Close button', clock('closeAfterSec', '', paused), paused
          ? 'Content pauses — no close button' : '', paused)}
        ${row('Auto-hide', clock('hideAfterSec', ''))}` : ''}
    </div>`;
}

// THE UNIT'S FACTS RIDE UPFRONT (4 Sep, user call — Ui/UX_Changes branch). An ad unit
// is TWO rows now: the unit itself, then its values as a quiet fact line — every fact
// of the unit's TYPE, fixed order, defaults included, so reading a ladder never needs
// a fold opened per unit. The grammar is the panel's own: micro-labels, values in ink,
// nothing appears or vanishes as values change — a fact that cannot apply right now
// (Skip while content pauses) dims in place with the reason on hover. The line is the
// summary, the gear panel stays the EDITOR: clicking either opens it, and while it is
// open the line hides — the panel IS this row, expanded. Words are the panel's exactly
// (label('pause'), label('displaySlot'), the template's name), so the glance and the
// editor can never disagree.
function suRungFactsHtml(t, n, r) {
  if (!r.tagId) return '';
  const isDisplay = window.TAG_TYPE[r.tagId] === 'display';
  const rot = isRotation(baseSlot(t));
  const tag = SU_TAGS.find(x => x.id === r.tagId);
  const paused = (r.pause || (isDisplay ? 'no' : 'yes')) === 'yes';
  // FULL LABELS, STRONG VALUES (4 Sep, user review — "complete context"): the pairs
  // wear the editor's whole words, not compressed stubs, and the value carries the ink.
  // The fact NAMES ITS COLUMN (`data-f`), so the same fact lands on the same x down the
  // whole ladder — nine rows of repeated labels read as a column the eye skips once,
  // where nine ragged lines read as noise (7 Sep, user call: "does not feel cluttered").
  const pair = (f, lbl, val, dim, why, dflt) =>
    `<span class="uf${dim ? ' na' : ''}${dflt ? ' dflt' : ''}" data-f="${f}"${why ? ` title="${esc(why)}"` : ''}><i>${esc(lbl)}</i><b>${esc(val)}</b></span>`;
  const secs = v => (v === undefined || v === null || v === '' ? null : `${v}s`);
  const facts = [];
  const govPause = t === 'shared' ? suWf().pauseAll : null;
  if (!rot) {
    const pauseDflt = isDisplay ? 'no' : 'yes';
    facts.push(govPause
      ? pair('pause', 'Content pause', label('pause', govPause), true, 'Set once for the whole waterfall')
      : pair('pause', 'Content pause', label('pause', r.pause || pauseDflt), false, '', !r.pause || r.pause === pauseDflt));
    facts.push(pair('delay', 'Request delay', secs(r.showAfterSec) ?? 'now', false, '', r.showAfterSec == null));
  }
  // ONE WORD PER CONCEPT (7 Sep, UAT P2): the gear panel calls this Ad placement for
  // both kinds, so the closed line does too — glance and editor can never disagree.
  facts.push(pair('slot', 'Ad placement',
    label('displaySlot', r.displaySlot || (KL_META.displaySlots || [])[0]), false, '',
    !r.displaySlot || r.displaySlot === (KL_META.displaySlots || [])[0]));
  if (tag) {
    const tpl = tag.tplId ? SU_TPLS.find(x => x.id === tag.tplId) : null;
    facts.push(pair('tpl', 'Ad unit template', tpl ? (tpl.on === false ? `${tpl.name} · off` : tpl.name) : 'Standard', false, '', !tpl));
  }
  // THE BANNER-ONLY PAIR RIDES LAST (7 Sep, user call — "does not feel cluttered"): the
  // four facts EVERY unit has fill the first four columns on every row, so a video row
  // and a banner row line up all the way across and the banner simply carries two more.
  // Ordered the same way in the settings below, so glance and editor never disagree.
  if (isDisplay && !rot) {
    facts.push(paused
      ? pair('close', 'Close button', '—', true, 'Content pauses — no close button')
      : pair('close', 'Close button', secs(r.closeAfterSec) ?? '—', false, '', r.closeAfterSec == null));
    facts.push(pair('hide', 'Auto-hide', secs(r.hideAfterSec) ?? '—', false, '', r.hideAfterSec == null));
  }
  return `
    <div class="ad-unit-facts" onclick="suToggleRungSettings('${t}', ${n})">
      ${facts.join('')}
    </div>`;
}

function suRungSearchHtml(t, n) {
  const slot = suSlot(t);
  const cur = slot.rungs[n];
  const hint = SU_ADD_HINT && SU_ADD_HINT.slot === t && SU_ADD_HINT.index === n ? SU_ADD_HINT : null;
  return tagLookupHtml({
    family: slotFamily(baseSlot(t)),
    slot: t,
    preferProvider: hint ? hint.provider : null,
    alsoTakes: slotAlsoTakes(baseSlot(t)),
    exclude: slot.rungs.filter((r, j) => j !== n).map(r => r.tagId),
    value: cur && cur.type === 'tag' && cur.tagId ? suRungLabel(cur) : '',
    tagId: cur?.tagId,
    onPick: async tag => {
      await suRefreshTags();
      const rung = { type: 'tag', tagId: tag.id, on: cur?.on !== false };
      // A unit starts with its facts stated (31 Aug) — the same defaults the server
      // would fill, so what you see is what saves.
      if (!isRotation(baseSlot(t))) rung.pause = tag.type === 'display' ? 'no' : 'yes';
      if (tag.type === 'display') {
        rung.displaySlot = (KL_META.displaySlots || ['player_bottom'])[0];
        if (!isRotation(baseSlot(t))) Object.assign(rung, { showAfterSec: 1, closeAfterSec: 5, hideAfterSec: 10 });
      }
      suSlot(t).rungs[n] = rung;
      // The first thing a fresh rung teaches is where its settings live.
      SU_RUNG_OPEN = `${t}:${n}`;
      // The new unit's settings open on their own — the template and pause are right
      // there the moment the unit lands, not a hunt later.
      clearErr('sections');
      FORM.rerender();
    },
  });
}

// THE LADDER, IN TWO PIECES (27 Aug, user call). One primary — the ask that happens
// first, every time — then a rule saying what the rest of the rows are *for*, then the
// fall as plain numbers. Before this the ten rows were one undifferentiated wall (and a
// stale 20px label column had squashed every one of them to "P…"/"W…"), so the row that
// decides most of the revenue looked exactly like the ninth waterfall rung. A rotation is not
// a fall: its banners take turns, so they stay one flat list.
function suLadderHtml(t, ctx) {
  const slot = suSlot(t);
  // NOTHING IN IT, SAID ONCE (8 Sep, with the source band): a ladder break's empty state
  // is the band's `No ads yet` — counted, consequenced, with both roads beside it — so
  // the bare words `No tags` under it were a second, weaker answer to the same question.
  // A rotation has no band (it has no waterfall to follow), so it keeps a sentence.
  if (!slot.rungs.length) {
    if (isRotation(t)) return '<div class="ladder-empty">No banner tags yet</div>';
    // No primary yet, but the fall may still be somebody else's and worth drawing —
    // a break with no first ask of its own can still take its whole walk from the
    // global waterfall, and its shared settings belong on it.
    return ctx.fallHtml || '';
  }
  const rows = slot.rungs.map((r, n) => suUnitHtml(t, n, r, ctx));
  // A flat ladder has no first ask — a rotation's banners take turns, and the shared
  // waterfall (7 Sep, user call) is a waterfall through and through: no primary row.
  // A rotation names its rows ("Banner 3"), so its ladder keeps the wide position
  // column; every other ladder here numbers them and rides narrow.
  if (isRotation(t) || ctx.flat) return `<div class="rung-list${isRotation(t) ? ' rot' : ''}">${rows.join('')}</div>`;
  // THE FALL IS NOT ALWAYS THE BREAK'S (8 Sep, user call — *"when switched to global why
  // is primary ad unit being removed, it should stay"*). `ctx.fallHtml` lets the caller
  // put something else where the fall goes — the global waterfall's shared settings, or
  // nothing — while the PRIMARY block above it is drawn exactly as it always is. Absent,
  // the break owns its fall and draws its own rows.
  const fall = ctx.fallHtml == null ? rows.slice(1) : [];
  // COUNTED OVER THE REAL RUNGS, BOTH SIDES (8 Sep, user call): the units that would be
  // asked, of the units that are actually there. An empty row waiting to be filled used
  // to inflate the total, so a ladder could read "7 of 8 active" with nothing off.
  const fallRungs = slot.rungs.slice(1).filter(r => r.tagId);
  const liveFall = fallRungs.filter(r => r.on !== false).length;
  // THE TWO KINDS OF ROW ARE NAMED ONCE (7 Sep, user call — the unit had to move left
  // and the word "Primary" was the 46px column holding it out there). The fall has
  // always been named by a rule above it rather than nine times over; the primary now
  // is too, in that rule's exact grammar. Same distinction, said once, and every unit
  // in the ladder starts on the same x with its handle beside it.
  return `
    ${/* THE RULE IS THE WORD (8 Sep, user call — *"asked first, every time: remove this
          text"*). `Primary` already says which row it names; the gloss explained the
          ladder to someone who had read it nine breaks ago. */''}
    <div class="fall-rule lead-rule">
      <span class="fall-w">Primary</span>
    </div>
    <div class="rung-list lead">${rows[0]}</div>
    ${/* The source band rides here, under the primary and above the fall (8 Sep, user
          call, asked twice) — the break's first ask opens its zone, and where the FALL
          begins is where swapping the source belongs. Supplied by the caller, because
          only the setup editor's ladder breaks have a source to state. */''}
    ${ctx.midHtml || ''}
    ${ctx.fallHtml != null ? ctx.fallHtml : fall.length ? `
      <div class="fall-rule">
        <span class="fall-w">Waterfall order</span>
        <span class="fall-n">${liveFall} of ${fallRungs.length} active</span>
      </div>
      <div class="rung-list fall">${fall.join('')}</div>` : ''}`;
}
