// views-setups-waterfall.js — THE GLOBAL WATERFALL (5 Sep as "shared waterfall"; bare
// "waterfall" 7 Sep; GLOBAL 8 Sep, user call — *"rename the top waterfall as global
// waterfall or suggest any better name for it"*): one indirect ladder at the setup's head
// that any pre/mid/post break — per placement, per pod — can be CONNECTED to instead of
// holding its own units. A LINK, never a copy: edit it once and every break connected to
// it moves together. It is a waterfall through and through (7 Sep, user call): no primary
// rung anywhere in it — plain positions 1…N.
//
// THE NAME IS `WF_WORD` IN util.js, SPELLED ONCE. The bare word collided with the one
// every break's own ladder wears — a break said `Waterfall order` about its own fall a
// centimetre from a switch reading `Follow the waterfall` about this one. `Global` pairs
// with `Custom` on the break, which is the pair a seller actually chooses between, and
// beat `Shared` (co-owned, not one-for-everything), `House` (already means house ads) and
// `Default` (implies a fallback, where this is opted into). The wire key is untouched:
// `waterfallSource: 'setup'` everywhere underneath.
//
// THE SECTION IS THE LADDER, THE LEVERS LIVE AT THE LINK (6 Sep, user call — settings
// in the section were settings for nobody until something followed it). The head
// section holds ONLY the units; the levers — Waterfall order (the integration page's
// own partner chips), Waterfall depth (the bulk sheet's own 1·2·3·Full seg) and
// Content pause (Auto·Yes·No, Auto = each unit's own answer, the default) — appear
// where they are consumed: on every break connected to the waterfall. They stay ONE
// set of global answers (stored on the waterfall itself), so setting them at any
// connected break is the bulk edit — every follower moves together.
//
// A CONNECTED BREAK SHOWS THE LEVERS, NOT THE LADDER (7 Sep, user call): the three
// answers that are precise to this break, and one door — `View the waterfall` — that
// walks the scroll up to the head section and flashes it. The read-only mirror of
// every rung is gone: the walk is the waterfall's story, told once where it can be
// changed, and the order chips already say who is asked in what order.
//
// THE SOURCE LOSES NOTHING, IN EVERY DIRECTION (7 Sep, user call — "there should be an
// option to switch to a shared waterfall if a custom waterfall is configured while the
// vice versa is also needed"). Changing a break's source NEVER deletes: its own units
// are PARKED (the server has always kept them as `ownRungs`) and come back exactly as
// they stood, with nothing re-typed. That holds for the third answer too — switching a
// break's ads off keeps everything it had, which is why `none` is a stored answer and
// not just an emptied ladder.
//
// AND EVERY BREAK ANSWERS IT IN TWO STEPS (8 Sep, user call). Each ladder break is in one
// of three states — no ads, its own custom waterfall, or this global one — and it says so
// with two controls and no words (suWfStateHtml, under the primary where there is one): a
// `Waterfall` switch, and, only while it is on, `Custom │ Global`. Three shapes were tried
// in one day to get here — a switch plus an add-button (two controls, one question, and
// the third state unreachable), then a stated band plus a three-card dialog (prose where
// controls belonged). See the block above suWfStateHtml.
//
// The ladder is addressed as the pseudo-slot 'shared' (suSlot in views-setups-editor.js), so
// every rung helper — add, toggle, remove, drag, the tag search, the fact line, the
// gear panel — works on it unchanged: one ladder grammar for the whole page.

// ---------- reads ----------

// The form's waterfall, always in one shape — used by the load mapping too.
function suWfClean(w) {
  return {
    rungs: JSON.parse(JSON.stringify(w?.rungs || [])),
    depth: w?.depth ?? null,
    pauseAll: w?.pauseAll ?? null,
  };
}

function suWf() {
  return FORM.data.waterfall || (FORM.data.waterfall = suWfClean(null));
}

function suWfHasUnits() {
  return (suWf().rungs || []).some(r => r.tagId);
}

// What a follower actually walks — the client mirror of the server's
// servedWaterfallRungs, so the page never promises a walk the server would not serve.
function suWfServed() {
  const wf = suWf();
  const live = (wf.rungs || []).filter(r => r.tagId && r.on !== false);
  return wf.depth ? live.slice(0, wf.depth) : live;
}

function suGroupLinked(g) {
  return !!g && g.waterfallSource === 'setup';
}

// WHERE A BREAK'S ADS COME FROM — one of three answers, always (8 Sep). `own` is the
// answer said by absence, everywhere, so nothing written before this existed moved.
function suSrcOf(g) {
  return (g && g.waterfallSource) || 'own';
}

// THE PRIMARY IS THE BREAK'S OWN IN EVERY ANSWER (8 Sep, user call — *"when switched to
// global why is primary ad unit being removed, it should stay"*). The source answers for
// the FALL; rung 1 is this break's own first ask and serves whatever the fall does.
function suSrcPrimary(g) {
  const r = ((g && g.rungs) || [])[0];
  return r && r.tagId ? r : null;
}

// What the break actually SERVES, counted — its own primary plus its fall, its primary
// plus the global waterfall's units, or its primary alone. Every count on the page goes
// through this rather than reading `rungs`: a break that takes its fall from the global
// waterfall, or has no fall, still KEEPS its own units, so `rungs` is what it WOULD serve
// if it went back, not what it serves now.
function suSrcServed(g) {
  const src = suSrcOf(g);
  if (src === 'own') return ((g && g.rungs) || []).filter(r => r.tagId).length;
  return (suSrcPrimary(g) ? 1 : 0) + (src === 'setup' ? suWfServed().length : 0);
}

// The units the break holds that are NOT serving — its own fall while something else
// serves that fall. Counted, and never deleted: this is what the way back returns.
function suSrcParked(g) {
  if (suSrcOf(g) === 'own') return 0;
  return ((g && g.rungs) || []).slice(1).filter(r => r.tagId).length;
}

// A break's OWN units, whichever source is live — the parked custom waterfall while
// the waterfall is on. Counted, so every line that offers the way back names a number.
function suWfOwnUnits(g) {
  return ((g && g.rungs) || []).filter(r => r.tagId).length;
}

// Counted, never estimated: how many breaks (pods counted singly) follow the waterfall.
function suWfFollowers() {
  let n = 0;
  for (const sec of FORM.data.sections || []) {
    for (const t of KL_META.slotTypes) {
      const s = (sec.slots || {})[t];
      if (!s) continue;
      if (t === 'midroll') n += (s.groups || []).filter(suGroupLinked).length;
      else if (suGroupLinked(s)) n++;
    }
  }
  return n;
}

// ---------- writers ----------

// THE ONE WRITER, THREE ANSWERS (7 Sep as a switch; a third answer 8 Sep). `own` serves
// this break's custom waterfall, `setup` connects it to the waterfall, `none` switches
// its ads off. NO ROAD DELETES ANYTHING: the break's own rungs stay exactly where they
// are whichever answer serves, which is what makes every direction worth having. The
// The answer is chosen by the two controls on the break (suSrcToggle / suSrcPick) — this
// stays the plain writer; nothing here confirms.
function suWfUse(t, source) {
  const slot = suSlot(t);
  if (!slot) return;
  if (source === 'setup' && !suWfHasUnits()) return;
  if (suSrcOf(slot) === source) return;
  slot.waterfallSource = source;
  SU_RUNG_OPEN = null;
  clearErr('sections');
  clearErr('waterfall');
  FORM.rerender();
}

// ---------- THE SOURCE, IN TWO STEPS AND NO PROSE (8 Sep, user call, third round) ----------
// *"It has to be more simplified, in 2 steps and no text or byline: one switch on/off
// waterfall; if switched on, which one — custom or global waterfall."*
//
// The morning's band stated the state in words and the afternoon's dialog explained the
// consequence in more of them. Both are gone. The question is two questions, and each is
// its own control, standing where it applies:
//
//     ⬤ Waterfall        [ Custom │ Global ]      View
//     ○ Waterfall                                       ← off: nothing under it
//
// Step one is the SWITCH: does this break have a fall under its primary at all. Step two
// only exists while the answer to step one is yes, because "which waterfall" is not a
// question about a break that has none. No state name, no counted byline, no dialog: the
// ladder under the controls is the state, and it is already on screen.
//
// THE PRIMARY IS OUTSIDE ALL OF IT (8 Sep, user call — *"when switched to global why is
// primary ad unit being removed, it should stay"*). Rung 1 is the break's own first ask
// and it serves in every answer; these controls decide what comes AFTER it. That is also
// why the switch is almost never blocked: switching the fall off leaves the primary
// serving, so a live break does not go dark.
//
// WHAT REPLACED THE WORDS. The consequence used to be spelled out in a dialog before the
// act ("its 10 units are kept, switched off"). It is now carried three ways, none of them
// prose: the act is instantly reversible (flip the switch back and the units return, as
// they always have), the unsaved-change rail marks it like every other edit, and the
// destructive-consequence hover — the one thing the tooltip policy still allows a title=
// for — names the count for anyone who wants it before clicking.
//
// A break the seg cannot answer greys where it sits, reason on hover, never vanishing:
// `Global` while the global waterfall is empty, and the switch's OFF direction while a
// live integration plays this break (the store refuses that save — fail closed).

// SWITCHING BACK ON RETURNS THE ANSWER YOU LEFT (session-scoped, per break). Nothing is
// stored for it — the server has one answer per break, and inventing a second field to
// remember a discarded one would be a lie in the payload. But inside one editing session
// an off is very often a slip, so the answer that was serving is remembered here and
// restored, and a fresh load simply lands on its own units.
const SU_SRC_BACK = new Map();

// Step one. Off parks everything (`none` keeps `ownRungs`, so nothing is deleted); on
// restores the answer this break left, or its own units, and opens a first empty row when
// there is nothing at all to come back to — the answer was "give this break a waterfall",
// and landing on an empty zone would be a second step nobody asked for.
function suSrcToggle(t) {
  const slot = suSlot(t);
  if (!slot) return;
  const key = `${SU_SEC}:${t}`;
  if (suSrcState(t) === 'none') {
    const back = SU_SRC_BACK.get(key);
    suWfUse(t, back === 'setup' && suWfHasUnits() ? 'setup' : 'own');
    if (!((suSlot(t) || {}).rungs || []).length) suAddRung(t);
    return;
  }
  if (suSrcDarkWhy(t)) return; // refused where it sits, on the switch's own title
  SU_SRC_BACK.set(key, suSrcOf(slot));
  suWfUse(t, 'none');
}

// Step two, which exists only while step one says yes.
function suSrcPick(t, which) {
  if (which === 'setup' && !suWfHasUnits()) return;
  suWfUse(t, which);
}

// WHY THE SWITCH MAY NOT GO OFF. A break a live integration plays must have a walk: the
// store refuses the save that would darken it (`“Default” post-roll would go dark — …`),
// so the OFF direction greys here rather than being taken and bounced at Save. Counted
// from the setup's own live counts, in the same words the server uses. Mid-roll pods are
// covered too — one dark pod is one dark break.
function suSrcDarkWhy(t) {
  if (!SETUP_ORIGINAL || !SETUP_ORIGINAL.usedByLive) return '';
  const sec = suSection();
  if (!sec || sec._orig < 0) return '';
  const lc = SETUP_ORIGINAL.liveCounts?.[SETUP_ORIGINAL.sections[sec._orig]?.name];
  const on = lc?.[baseSlot(t)]?.on || 0;
  if (!on) return '';
  // The primary carries the break with no fall at all (8 Sep) — so switching the fall off
  // only darkens a break that has no first ask of its own, or has switched it off.
  const p = suSrcPrimary(suSlot(t));
  if (p && p.on !== false) return '';
  const word = label('slotType', baseSlot(t)).toLowerCase();
  const who = on > 1
    ? `${on} integrations play this ${word} live`
    : `${SETUP_ORIGINAL.usedByNames[0] || 'the integration it fills'} plays this ${word} live`;
  return `${who} — with no primary ad unit serving, it would have nothing left to ask`;
}

// THE LEVERS — one set of global answers, edited where the waterfall is consumed.
// Depth: how many units deep every follower tries; Full (null) walks the whole ladder.
function suWfDepthSet(v) {
  suWf().depth = v;
  clearErr('waterfall');
  FORM.rerender();
}

// Content pause: Auto (the default) is each unit's own answer; Yes/No is one answer
// stamped on every unit while it stands — their own answers are kept underneath.
function suWfPauseSet(v) {
  suWf().pauseAll = v === 'auto' ? null : v;
  clearErr('waterfall');
  FORM.rerender();
}

// `View the waterfall` from a connected break: open the folded head section, walk the
// scroll to it, and flash it once — found, not hunted for.
function suWfJump() {
  if (!SU_HEAD_OPEN.has('waterfall')) {
    SU_HEAD_OPEN.add('waterfall');
    FORM.rerender();
  }
  requestAnimationFrame(() => {
    const el = document.querySelector('.wf-sec');
    if (!el) return;
    // 'center', not 'start' — the sticky editor header would sit over the section's head.
    el.scrollIntoView({ block: 'center', behavior: 'smooth' });
    el.classList.remove('flash');
    void el.offsetWidth; // restart the animation when clicked twice
    el.classList.add('flash');
    setTimeout(() => el.classList.remove('flash'), 1700);
  });
}

// ---------- APPLY ON AD SLOTS: the grid (7 Sep, user call; re-cut on review) ----------
// The section used to carry a `Place on` row — one button per break KIND that connected
// every break of that kind, and a sheet of rows to untick. It could only ever ADD, it
// said nothing about which placement a break belonged to until you opened it, and three
// buttons stood for a two-dimensional fact. The act is a GRID: ad sections down the
// side, the breaks across the top (pre-roll · pod 1 · pod 2 · pod 3 · post-roll), and
// one tick per cell — connect and take off in the same pass, everywhere at once.
//
// NOTHING IN A CELL BUT ITS ANSWER (re-cut 7 Sep, user review — the first grid put each
// break's own unit count in a badge beside every tick: *"we don't need count and all
// here and it should be crafted very thoughtfully since it will bulk apply"*). A count
// there was a second data dimension nobody was deciding about, and it pushed every tick
// off its column's centre, so five columns of answers read as ten columns of something.
// The cell now holds ONE thing — ticked, unticked, or a dash where there is no break —
// dead centre under its column name, and the tick is the only ink that moves.
//
// A BULK ACT MUST SHOW ITS TARGET BEFORE IT LANDS. The grid's two axes ARE the bulk
// controls (a column header answers that break for every ad section, a section name
// answers every break of that row), so hovering either LIGHTS the cells it would
// answer — you see the reach, then you click. Everything this pass would move carries
// the session's own quiet tint, so the foot's counted delta is legible in the grid too.
//
// A cell the platform would refuse sits out with its reason on hover: a placement that
// holds one pod has no pod 2 to connect. The out-stream never appears — a rotation
// takes turns, so it has no waterfall to follow.

// The columns, in the page's own order: every ladder break, the mid-roll opened out
// into its pods. The family band above the names is what tells you a pod is a mid-roll.
function suWfApplyCols() {
  const out = [];
  for (const t of KL_META.slotTypes) {
    if (isRotation(t)) continue;
    const pods = t === 'midroll' ? (KL_META.maxMidrollGroups || 3) : 1;
    for (let gi = 0; gi < pods; gi++) {
      out.push({
        t,
        gi,
        fam: t === 'midroll' && gi === 0 ? label('slotType', t) : '',
        span: t === 'midroll' && gi === 0 ? pods : 1,
        head: t === 'midroll' ? `Pod ${gi + 1}` : label('slotType', t),
        first: gi === 0,
      });
    }
  }
  return out;
}

// One cell per (placement × column): the break it addresses, whether it is connected
// today, and — when the break does not exist — why the cell sits out.
function suWfApplyCell(si, col) {
  const sec = (FORM.data.sections || [])[si] || {};
  const s = (sec.slots || {})[col.t];
  const gs = col.t === 'midroll' ? ((s || {}).groups || []) : [s];
  const g = col.t === 'midroll' ? gs[col.gi] : s;
  const name = sec.name || `Placement ${si + 1}`;
  const why = !s ? `“${name}” has no ${label('slotType', col.t).toLowerCase()}`
    : !g ? `“${name}” holds ${gs.length === 1 ? 'one pod' : `${gs.length} pods`}`
    : '';
  return { g: g || null, why, on: suGroupLinked(g) };
}

// The foot counts the DELTA both ways, so the act always names exactly what it will do
// — and stays unavailable, with its reason, while there is nothing to change.
function suWfApplyTick() {
  const root = document.getElementById('dialog-root');
  const boxes = [...root.querySelectorAll('.wfa-cell input')];
  let add = 0, off = 0;
  for (const b of boxes) {
    const was = b.dataset.was === '1';
    if (b.checked && !was) add++;
    else if (!b.checked && was) off++;
    b.closest('.wfa-cell').classList.toggle('chg', b.checked !== was);
  }
  const ok = root.querySelector('[data-act=yes]');
  const bits = [];
  if (add) bits.push(`connect ${add}`);
  if (off) bits.push(`take off ${off}`);
  ok.disabled = !bits.length;
  ok.title = bits.length ? '' : 'Nothing to change yet — tick a slot';
  ok.textContent = bits.length ? `Apply — ${bits.join(', ')}` : 'Apply';
}

// THE REACH, BEFORE THE CLICK: hovering an axis lights every cell that axis would
// answer. Painted imperatively (one class on the cells, not a CSS `:has()` chain per
// column) — the grid is built once and only this class moves.
function suWfApplyHi(kind, key, on) {
  const root = document.getElementById('dialog-root');
  for (const c of root.querySelectorAll('.wfa-cell')) {
    if (c.dataset[kind] === String(key)) c.classList.toggle('reach', !!on);
  }
}

// A header name and a placement name are the bulk acts — the grid's own two axes, so
// no extra control: click a column to answer it for every placement, a row to answer
// every break of one placement. A cell with no break sits it out.
function suWfApplyBulk(kind, key) {
  const root = document.getElementById('dialog-root');
  const boxes = [...root.querySelectorAll(`.wfa-cell input[data-${kind}="${key}"]`)];
  if (!boxes.length) return;
  const target = !boxes.every(b => b.checked);
  for (const b of boxes) b.checked = target;
  suWfApplyTick();
}

async function suWfApplyOpen() {
  if (!suWfHasUnits()) return;
  const cols = suWfApplyCols();
  const secs = FORM.data.sections || [];
  // The family band spans ONLY the pods it names — a `Pod 2` on its own says nothing
  // about which break it belongs to, and Pre-roll/Post-roll need no band at all.
  const famRow = cols.map(c => (c.first
    ? `<th class="wfa-fam${c.fam ? ' named' : ''}" colspan="${c.span}">${esc(c.fam)}</th>` : '')).join('');
  const hov = (kind, key) => `onmouseenter="suWfApplyHi('${kind}', ${key}, 1)" onmouseleave="suWfApplyHi('${kind}', ${key}, 0)"`;
  const headRow = cols.map((c, ci) => `
    <th class="wfa-col${c.first && ci ? ' split' : ''}">
      <button type="button" class="wfa-h" onclick="suWfApplyBulk('col', ${ci})" ${hov('col', ci)}
        title="Answer this break for every ad section">${esc(c.head)}</button>
    </th>`).join('');
  const cellHtml = (si, col, ci) => {
    const c = suWfApplyCell(si, col);
    const at = `data-row="${si}" data-col="${ci}"`;
    if (c.why) return `<td class="wfa-cell out${col.first && ci ? ' split' : ''}" ${at} title="${esc(c.why)}"><i>—</i></td>`;
    return `
      <td class="wfa-cell${col.first && ci ? ' split' : ''}" ${at}>
        <label class="wfa-tick">
          <input type="checkbox" ${c.on ? 'checked' : ''} data-was="${c.on ? 1 : 0}"
            data-row="${si}" data-col="${ci}" data-t="${col.t}" data-gi="${col.gi}" data-si="${si}"
            onchange="suWfApplyTick()">
        </label>
      </td>`;
  };
  const body = `
    <table class="wfa-grid">
      <thead>
        <tr class="wfa-bands"><th></th>${famRow}</tr>
        <tr><th class="wfa-corner">Ad section</th>${headRow}</tr>
      </thead>
      <tbody>
        ${secs.map((sec, si) => `
          <tr>
            <th class="wfa-row">
              <button type="button" class="wfa-h" onclick="suWfApplyBulk('row', ${si})" ${hov('row', si)}
                title="Answer every break of this ad section">${esc(sec.name || `Placement ${si + 1}`)}</button>
            </th>
            ${cols.map((col, ci) => cellHtml(si, col, ci)).join('')}
          </tr>`).join('')}
      </tbody>
    </table>`;
  // The dialog paints synchronously, so the foot is counted from the state it opens in
  // (nothing ticked yet = nothing to apply) before the promise is waited on.
  const pending = askForm({
    cls: 'wfa-dlg',
    title: `Apply the ${WF_WORD.toLowerCase()} on ad slots`,
    okLabel: 'Apply',
    body,
  }, root => [...root.querySelectorAll('.wfa-cell input')]
    .filter(b => b.checked !== (b.dataset.was === '1'))
    .map(b => ({ si: +b.dataset.si, t: b.dataset.t, gi: +b.dataset.gi, on: b.checked })));
  suWfApplyTick();
  const picked = await pending;
  if (!picked || !picked.length) return;
  let add = 0, off = 0;
  for (const { si, t, gi, on } of picked) {
    const s = ((FORM.data.sections[si] || {}).slots || {})[t];
    if (!s) continue;
    const g = t === 'midroll' ? (s.groups || [])[gi] : s;
    if (!g) continue;
    // NOTHING IS WIPED (7 Sep, user call): the break's own units stay put and are
    // served again the moment it comes back off the waterfall.
    g.waterfallSource = on ? 'setup' : 'own';
    if (on) add++; else off++;
  }
  SU_RUNG_OPEN = null;
  clearErr('sections');
  FORM.rerender();
  // The act reached breaks across placements you cannot see from here, so it gets one
  // quiet receipt — merged, never two pills.
  const bits = [];
  if (add) bits.push(`connected to ${add} slot${add === 1 ? '' : 's'}`);
  if (off) bits.push(`taken off ${off}`);
  toast(`${WF_WORD} ${bits.join(', ')}`);
}

// THE ACT SITS IN THE UNITS FOOT (7 Sep, user review — *"we don't need an ad slot
// section, we can have this CTA at the bottom right of the Units itself"*). A whole
// zone row with a `Ad slots` label for one button was a section standing for a control;
// the ladder's own foot already holds the section's other act, so this one takes the
// far end of it — add on the left, apply on the right.
// THE CONNECTED COUNT IS GONE (7 Sep, user call — *"6 ad slots connected — remove this
// text"*), the same call the folded heads' count chips lost to: a number you cannot act
// on is not worth the ink, and the grid behind `Apply on ad slots` shows every
// connection by name the moment it is opened. What stays is the WARNING, because it is
// not a count — a waterfall that has units and reaches nothing serves nobody, and
// silence there would read as "placed".
function suWfApplyFootHtml() {
  const has = suWfHasUnits();
  const unplaced = has && !suWfFollowers();
  return `
      <span class="wf-foot-gap"></span>
      ${unplaced ? '<span class="wf-placed none">no ad slots yet</span>' : ''}
      <button type="button" class="slot-add" ${has
        ? 'onclick="suWfApplyOpen()"'
        : 'disabled title="This waterfall is empty — give it a unit first"'}>Apply on ad slots</button>`;
}

// ---------- the section (the setup's head): the ladder, and nothing else ----------

function suWaterfallHtml(meta) {
  const wf = suWf();
  const t = 'shared';
  // FOLDED AT REST (glimpse re-cut 7 Sep, user call — the counted prose distracted and
  // said little): the closed line SHOWS the waterfall instead — the provider walk in
  // badges, an off or depth-cut unit dimmed in place. ONLY the order (7 Sep, user
  // call): the breaks-count chip left the line — who asks it is each break's own story.
  // Nothing when empty. A refused save forces the section open.
  const open = SU_HEAD_OPEN.has('waterfall') || !!FORM.errors.waterfall;
  const total = (wf.rungs || []).filter(r => r.tagId).length;
  let gAt = 0;
  const glimpse = total
    ? `<span class="glimpse-walk">${(wf.rungs || []).filter(r => r.tagId).map(r => {
        const off = r.on === false;
        const cut = !off && wf.depth && ++gAt > wf.depth;
        const tag = SU_TAGS.find(x => x.id === r.tagId);
        return `<span class="wfg${off || cut ? ' dim' : ''}">${tag ? providerBadge(tag.provider) : ''}</span>`;
      }).join('<i class="gsep">›</i>')}</span>`
    : '';
  const head = suHeadRowHtml('waterfall', WF_WORD, glimpse, open);
  if (!open) return `<div class="wf-sec closed">${head}</div>`;
  // NO PRIMARY HERE (7 Sep, user call): the thing every break shares IS a waterfall, so
  // its rungs are plain positions 1…N — no lead row, no primary vocabulary in it.
  const ctx = {
    rungs: wf.rungs,
    // WALK POSITIONS (8 Sep, user call — *"the count should be counted for only the
    // enabled ones"*): 1…N over the units that would be asked. A switched-off unit
    // holds no number, because it holds no place in the walk.
    rungLabelFor: n => posLabel(wf.rungs, n),
    flat: true,
    onToggle: n => `suToggleRung('${t}', ${n})`,
    control: n => suRungSearchHtml(t, n),
    rowClass: () => '',
    onRemove: n => `suRemoveRung('${t}', ${n})`,
    dragKey: 'su-shared',
    dirty: n => suRungDirty(t, n),
    after: (n, r) => suRungAfterHtml(t, n, r),
  };
  registerDrag('su-shared', (from, to) => {
    const arr = suWf().rungs;
    arr.splice(to, 0, arr.splice(from, 1)[0]);
    clearErr('waterfall');
    FORM.rerender();
  });
  const atMax = chainCount(wf.rungs) >= meta.maxRungs;

  return `
    <div class="wf-sec">
      ${head}
      ${FORM.errors.waterfall ? `<div class="banner bad" data-err-for="waterfall">${esc(FORM.errors.waterfall)}</div>` : ''}
      <div class="zone-row wf-zone">
        <span class="zone-l">Units</span>
        <div class="zone-c">
          ${wf.rungs.length ? suLadderHtml(t, ctx) : ''}
          <div class="slot-multi-foot wf-foot">
            ${/* NO "10 of 10" (7 Sep, user call): a cap is not a fact the section needs to
                  state — it is the reason ONE control is unavailable, so it greys where it
                  sits with that reason on hover, like every other refused option here. */''}
            <button class="slot-add" onclick="suAddRung('${t}')"
              ${atMax ? `disabled title="This waterfall is full — ${meta.maxRungs} units"`
                : canAddRung(wf.rungs) ? '' : 'disabled title="Fill the tag above first"'}>+ Add waterfall tag</button>
            ${suWfApplyFootHtml()}
          </div>
        </div>
        <span class="slot-menu-ph"></span>
      </div>
    </div>`;
}

// ---------- THE SOURCE: TWO STEPS, NO WORDS (8 Sep, user call — three cuts) ----------
// *"In the ad setup, in every slot there is not a clear demarcation of three state — no
// waterfall, custom waterfall and the global waterfall connected. It is very unclear; it
// should be very clear the journey to a layman user."* Then: *"There are too many switches
// and CTAs here… when I come on an ad slot I have the option — do I want a waterfall or
// no? If yes, custom or global."* Then: *"It has to be more simplified, in 2 steps and no
// text or byline."*
//
// What was here first drew only the ACT, twice: a `Follow the waterfall` switch (bare over
// the words `No tags`, or dropped mid-ladder) plus a `+ Add custom waterfall` button — two
// controls for one question — while switching a break's ads off meant Clear, which
// deletes. Nothing said where the break stood.
//
// The second cut said where it stood in WORDS: a band with a coloured dot, a state name,
// a counted fact, and a button opening a three-card dialog that explained each answer's
// consequence. It was clear and it was too much: prose and a modal standing in for two
// yes/no facts.
//
// This is the third and the shape that holds. THE QUESTION IS TWO QUESTIONS, AND EACH IS
// ITS OWN CONTROL:
//
//     ○ Waterfall                                  → no fall: the primary is the whole walk
//     ⬤ Waterfall   [ Custom │ Global ]  View      → step two only exists while step one says yes
//
// No state name, no byline, no dialog — the state is the LADDER under the controls, which
// is already on screen, and the closed break row carries the walk. What the words used to
// carry is carried by the shape instead: the act is instantly reversible (flip it back and
// the units return), the unsaved-change rail marks it like any edit, and the one hover the
// tooltip policy still allows names the count before you click.
//
// Which of the three the break is in — the reads every count and control here go
// through. A break with rows started but nothing picked yet is already `own`: it has a
// waterfall, it just has nothing in it, so the controls do not flip under the seller's
// hands while they fill the first field.
function suSrcState(t) {
  const slot = suSlot(t);
  if (!slot) return 'none';
  const src = suSrcOf(slot);
  if (src === 'setup') return 'wf';
  if (src === 'none') return 'none';
  return (slot.rungs || []).length ? 'own' : 'none';
}

// THE TWO CONTROLS, AND NOTHING ELSE (8 Sep, user call — *"2 steps and no text or
// byline"*). The switch, then the answer it unlocks, then the one door up to the global
// ladder. Every fact this row used to state in words is on screen anyway: the units are
// the ladder below it, and the closed break row carries the walk.
function suWfStateHtml(t) {
  const slot = suSlot(t);
  const st = suSrcState(t);
  const on = st !== 'none';
  const has = suWfHasUnits();
  const chg = FORM.saved && suSrcOf(slot) !== suSrcOf(suSavedSlot(t));
  // The only two refusals on this row, each greying the direction it refuses. The switch
  // is only ever blocked ONE way — a fall can always be switched on; it is switching OFF
  // that a live break with no primary refuses — so it is drawn HELD, not dead.
  const dark = on ? suSrcDarkWhy(t) : '';
  const noGlobal = has ? '' : `The ${WF_WORD.toLowerCase()} is empty — give it a unit at the top of this page first`;
  // The one hover the tooltip policy still allows here: what switching off would park.
  // The primary is not in that count — it keeps serving.
  const parked = (slot.rungs || []).slice(1).filter(r => r.tagId).length;
  const offWhy = dark || (st === 'own' && parked
    ? `${parked} unit${parked === 1 ? '' : 's'} are kept, switched off` : '');
  const why = on ? offWhy : '';
  return `
    <div class="wf-src src-${st}${chgIf(chg)}">
      <span class="toggle tiny wf-src-sw ${on ? 'on' : ''}${dark ? ' held' : ''}"${
        why ? ` title="${esc(why)}"` : ''}${dark ? '' : ` onclick="suSrcToggle('${t}')"`
      }><span class="track"></span>Waterfall</span>
      ${on ? `
        <div class="seg small src-seg">
          <button type="button" class="${st === 'own' ? 'on' : ''}" onclick="suSrcPick('${t}', 'own')">Custom</button>
          <button type="button" class="${st === 'wf' ? 'on' : ''}${noGlobal ? ' dead' : ''}"${
            noGlobal ? ` title="${esc(noGlobal)}"` : ''} onclick="suSrcPick('${t}', 'setup')">Global</button>
        </div>
        ${st === 'wf' ? `<button type="button" class="zlink wf-src-view" onclick="suWfJump()"
          title="Open the ${WF_WORD.toLowerCase()} at the top of this page">View</button>` : ''}` : ''}
    </div>`;
}

// THE ORDER IS A LEVER, NOT THE ROWS (re-cut 7 Sep, user call — a connected slot's
// units never reorder by hand): the levers carry the integration page's own *Waterfall
// order* control — one numbered chip per partner behind the waterfall, in walk order,
// dragged into the order they are asked. Dragging a chip re-arranges THE waterfall's
// units (stable within a partner), for every break connected to it — the same
// one-set-of-global-answers grammar as the other two levers.
// Every provider behind the waterfall, in walk order. `asked` (the default) counts
// ONLY the units that are switched on (8 Sep, user call — *"the count should be counted
// for only the enabled ones"*): a partner whose every unit is off is not asked, so it
// cannot wear a number in the walk. The full list is what the SORT needs — see below.
function suWfOrderProviders(asked = true) {
  const seen = [];
  for (const r of suWf().rungs || []) {
    if (!r.tagId || (asked && r.on === false)) continue;
    const p = SU_TAGS.find(x => x.id === r.tagId)?.provider;
    if (p && !seen.includes(p)) seen.push(p);
  }
  return seen;
}

function suWfOrderSet(order) {
  const wf = suWf();
  const provOf = r => (r.tagId && SU_TAGS.find(x => x.id === r.tagId)?.provider) || null;
  // The chips name only the partners that are ASKED, so the dragged order says nothing
  // about a partner whose every unit is off. Those keep the slots they hold today —
  // the drag re-arranges the asked partners among their own positions and nothing
  // invisible is swept to the tail.
  const all = suWfOrderProviders(false);
  const full = [...all];
  const slots = all.map((p, i) => i).filter(i => order.includes(all[i]));
  order.forEach((p, k) => { if (slots[k] !== undefined) full[slots[k]] = p; });
  const at = r => {
    const i = full.indexOf(provOf(r));
    return i === -1 ? full.length : i; // an unfilled rung keeps to the tail
  };
  wf.rungs = (wf.rungs || []).map((r, i) => [r, i])
    .sort((a, b) => at(a[0]) - at(b[0]) || a[1] - b[1])
    .map(x => x[0]);
  clearErr('waterfall');
  FORM.rerender();
}

function suWfOrderChipsHtml() {
  const provs = suWfOrderProviders();
  if (!provs.length) return '';
  registerDrag('wf-order', (from, to) => {
    const order = suWfOrderProviders();
    order.splice(to, 0, order.splice(from, 1)[0]);
    suWfOrderSet(order);
  });
  const chip = (p, i) => `
    <span class="pchip on" ${provs.length > 1 ? dragAttrs('wf-order', i) : ''}>
      ${provs.length > 1 ? '<span class="pchip-grip">⠿</span>' : ''}
      <b class="pchip-n">${i + 1}</b>
      <span class="pchip-t">${esc(label('tagProvider', p) || p)}</span>
    </span>`;
  return `<div class="pchips oneline">${provs.map(chip).join('<i class="gsep">›</i>')}</div>`;
}

// WHAT A CONNECTED BREAK SHOWS (re-cut 7 Sep, user call — *"in the slot section show the
// settings of waterfall, i.e. waterfall order, waterfall depth and content pause, one
// under the other not in one row"*): THE THREE SETTINGS, STACKED, in the page's own
// settings-row grammar — the same `.lr.rule` rows on the same `.bhv-grid` column as the
// DELIVERY SETTINGS zone directly below, so one label edge and one control edge run top
// to bottom through the break. Three levers strung across one line read as a toolbar and
// put a draggable chip control, a four-way seg and a three-way seg at three different
// x's; stacked, each is a setting with a name, which is what they are.
//
// They stay GLOBAL — this is the bulk edit, so setting one here sets it for every break
// connected to the waterfall, which is the whole point. The door up to the ladder itself
// rides the source band above (see suWfStateHtml); the read-only mirror of every rung
// went with the earlier cut — it retold the waterfall's own story on every connected
// break, four times over, where none of it could be changed.
//
// AND THE THREE SAY WHOSE THEY ARE (8 Sep, with the source band): they sit directly
// under a connected break's own DELIVERY SETTINGS grid, in the same rows, so nothing on
// screen distinguished three answers shared by every follower from six answers belonging
// to this break. They get the ladder's own rule — the same `.fall-rule` the primary and
// the fall wear — naming them once, counted where the band already counts the followers.
// An empty waterfall draws nothing here: there is no order, depth or pause to set over
// nothing, and the controls above have already said the fall is switched off.
function suWfMirrorHtml(t) {
  const wf = suWf();
  const all = (wf.rungs || []).filter(r => r.tagId);
  if (!all.length) return '';
  const savedOrder = ((FORM.saved?.waterfall?.rungs) || []).map(r => r.tagId).join();
  const row = (chg, l, ctl) => `
    <div class="lr rule${chgIf(chg)}">
      <span class="lr-grip ghost"></span>
      <span class="lr-l">${esc(l)}</span>
      <span class="lr-ctl form">${ctl}</span>
    </div>`;
  const f = suWfFollowers();
  return `
    <div class="wf-mirror">
      <div class="fall-rule lead-rule">
        <span class="fall-w">${esc(WF_WORD)}</span>
        <span class="fall-n">${f === 1 ? 'this break only' : `${f} breaks follow it`}</span>
      </div>
      <div class="wf-levers bhv-grid">
        ${row(FORM.saved && (wf.rungs || []).map(r => r.tagId).join() !== savedOrder,
          'Waterfall order', suWfOrderChipsHtml())}
        ${row(FORM.saved && (wf.depth ?? null) !== (FORM.saved.waterfall?.depth ?? null),
          'Waterfall depth', accSeg(wf.depth ?? 'all', [1, 2, 3, 'all'], ['1', '2', '3', 'Full'],
            o => `suWfDepthSet(${o === 'all' ? 'null' : o})`))}
        ${row(FORM.saved && (wf.pauseAll ?? null) !== (FORM.saved.waterfall?.pauseAll ?? null),
          'Content pause', accSeg(wf.pauseAll ?? 'auto', ['auto', 'yes', 'no'], ['Auto', 'Yes', 'No'],
            o => `suWfPauseSet('${o}')`))}
      </div>
    </div>`;
}
