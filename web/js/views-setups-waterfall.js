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
// of three states — no fall, its own custom waterfall, or this global one — and it says so
// with ONE control since 11 Sep: a three-answer seg — `Off │ Custom │ Global` — under the
// break's own WATERFALL section header, where every change confirms on THE CHANGE REVIEW
// first. See the block above `suSrcPick`.
//
// The ladder is addressed as the pseudo-slot 'shared' (suSlot in views-setups-editor.js), so
// every rung helper — add, toggle, remove, drag, the tag search, the fact line, the
// gear panel — works on it unchanged: one ladder grammar for the whole page.

// ---------- reads ----------

// The form's waterfall, always in one shape — used by the load mapping too.
function suWfClean(w) {
  return {
    rungs: deepCopy(w?.rungs || []),
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
// The answer is chosen by the break's one source seg (suSrcPick), which confirms before it
// calls this — this stays the plain writer; nothing here confirms.
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

// ---------- ONE CONTROL, THREE ANSWERS, ONE CONFIRM (11 Sep, user call — fourth cut) ----------
// *"The switch, the CTA for switch enable/disable, on/off — everything is not getting connected
// in a clean user journey; it is too disjointed, it feels everything is just placed with no
// thought of a UX."* And: *"the modal for confirmation is too immature and too cluttered."*
//
// THE FAULT WAS REAL AND IT WAS MINE. A break's fall has exactly THREE answers — nothing, its
// own units, the shared ladder — and they had been split across two controls a thousand pixels
// apart: a switch at the left of the row for one of them, a text link at the far right for the
// other two. Nothing tied them together, so there was no journey to follow: you had to know the
// model to know they were one question. (The shapes before that were a two-tab seg behind the
// switch, and before that a floating band — each fixed the last complaint and kept the split.)
//
// NOW: the three answers stand together in one seg, directly under the section header they
// govern and on its own left edge, with the counted fact of whichever is chosen beside them.
//
//        WATERFALL ────────────────────────────────
//        [ Off │ Custom │ Global ]   2 of 2 active
//    ⠿ 1 ⬤  [CAN] TOI Video Backfill
//
// No switch, no CTA, no second step: one control, three answers, always all visible. An answer
// the platform would refuse greys WHERE IT SITS with its own reason (the house rule) instead of
// disabling the whole control — `Custom` while there is no primary to fall through from,
// `Global` while the shared ladder is empty, `Off` while a live break would go dark — which is
// strictly more capable than the old held switch: a break with no primary can still follow the
// global, which is a legal arrangement the switch used to block outright.
//
// AND EVERY CHANGE CONFIRMS FIRST, in the house's small 440 confirm: the question, the break it
// lands on, and the MOVE — this answer, becoming that one — and nothing else. See suSrcPick.

// SWITCHING BACK ON RETURNS THE ANSWER YOU LEFT (session-scoped, per break). Nothing is stored
// for it — the server has one answer per break, and inventing a second field to remember a
// discarded one would be a lie in the payload — but inside one editing session an off is very
// often a slip, so the answer that was serving is remembered here.
const SU_SRC_BACK = new Map();

// WHY AN ANSWER MAY NOT BE TAKEN — one reason per answer, each greying only itself.
// `own`: rung 1 IS the primary, so a custom fall cannot exist before it.
function suSrcWhyOwn(t) {
  const slot = suSlot(t);
  if (!slot) return '';
  const rungs = slot.rungs || [];
  if (rungs.length > 1) return '';
  if (!rungs.length) return 'Add the primary ad unit first — a custom waterfall falls through from it';
  // A row started but not filled is not a first ask yet, and the ladder refuses to add under it.
  if (!rungs[0].tagId) return 'Pick the primary ad unit first — a custom waterfall falls through from it';
  return '';
}
// `setup`: there is nothing in the shared ladder to serve.
function suSrcWhyGlobal() {
  return suWfHasUnits() ? '' : `The ${WF_WORD.toLowerCase()} is empty — give it a unit at the top of this page first`;
}
// `none`: a live break with no primary of its own would have nothing left to ask (suSrcDarkWhy).
function suSrcWhyOff(t) { return suSrcDarkWhy(t); }

function suSrcWhy(t, which) {
  if (which === 'own') return suSrcWhyOwn(t);
  if (which === 'setup') return suSrcWhyGlobal();
  return suSrcWhyOff(t);
}

// WHY THE BREAK MAY NOT BE SWITCHED OFF. A break a live integration plays must have a walk:
// the store refuses the save that would darken it (`“Default” post-roll would go dark — …`),
// so `Off` greys here rather than being taken and bounced at Save. Counted from the setup's
// own live counts, in the same words the server uses. Mid-roll pods are covered too — one
// dark pod is one dark break.
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

// Where the act lands, in the page's own words — and in the review's own `where` grammar, so
// it groups under the break it belongs to exactly as a save's own changes do.
function suSrcWhere(t) {
  const sec = suSection();
  const pod = baseSlot(t) === 'midroll' && suMidGroups().length > 1 ? ` · pod ${SU_MID_G + 1}` : '';
  return `${sec.name || 'Untitled'} · ${label('slotType', baseSlot(t))}${pod}`;
}

const SU_SRC_WORD = { own: 'Custom waterfall', setup: WF_WORD, none: 'No waterfall' };


// THE ONE ACT, AND ONE SMALL CONFIRM (11 Sep, user call — *"the confirmation modal should be a
// small confirmation modal with not much text, just convey do you really want to switch, and
// show the switch in a clean manner down, with two CTAs — yes or cancel"*).
//
// The confirm before this one ran on THE CHANGE REVIEW — the right screen for a save or a
// publish, which carry dozens of changes under section labels, and far too much screen for ONE
// answer moving. What a person needs here is the question and the move: this, becoming that.
// So the dialog is the house's small 440 confirm, and its body is the move itself — the answer
// you are leaving, an arrow, the answer you are taking — with the break named quietly above it
// so a page of twenty breaks can never leave you wondering which one you just changed.
async function suSrcPick(t, which) {
  const slot = suSlot(t);
  if (!slot) return;
  const from = suSrcState(t) === 'wf' ? 'setup' : suSrcState(t) === 'own' ? 'own' : 'none';
  if (from === which) return;
  if (suSrcWhy(t, which)) return; // refused where it sits; the seg already says why
  const ok = await ask({
    title: 'Switch this break’s waterfall?',
    body: `
      <div class="src-cfm">
        <div class="src-cfm-where">${esc(suSrcWhere(t))}</div>
        <div class="src-cfm-move">
          <span class="from">${esc(SU_SRC_WORD[from])}</span>
          <i class="arw" aria-hidden="true">→</i>
          <span class="to">${esc(SU_SRC_WORD[which])}</span>
        </div>
      </div>`,
    okLabel: 'Yes, switch',
    cancelLabel: 'Cancel',
  });
  if (!ok) return;
  if (which === 'none') SU_SRC_BACK.set(`${SU_SEC}:${t}`, suSrcOf(slot));
  suWfUse(t, which);
  // Its own fall, chosen with nothing in it yet, opens ONE empty row — the answer was "give this
  // break a waterfall", and landing on an empty section would be a second step nobody asked for.
  // Rung 1 onward: the primary is never touched.
  if (which === 'own' && ((suSlot(t) || {}).rungs || []).length < 2) suAddRung(t);
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

// `View the waterfall` from a connected break: open the folded GLOBAL SETTINGS head, walk
// the scroll to the waterfall's own zone in it, and flash that zone once — found, not
// hunted for.
function suWfJump() {
  if (!SU_HEAD_OPEN.has('globals')) {
    SU_HEAD_OPEN.add('globals');
    FORM.rerender();
  }
  requestAnimationFrame(() => {
    const el = document.querySelector('.wf-zone');
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
// A rotation has no waterfall to follow, so it is not a column HERE — but the grid itself
// is not about waterfalls, so `withRotations` opens it to every ad slot for the callers
// whose question the out-stream can answer (header bidding's, 10 Sep).
function suWfApplyCols(withRotations = false) {
  const out = [];
  for (const t of KL_META.slotTypes) {
    if (isRotation(t) && !withRotations) continue;
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
  const root = dialogRoot();
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
  const root = dialogRoot();
  for (const c of root.querySelectorAll('.wfa-cell')) {
    if (c.dataset[kind] === String(key)) c.classList.toggle('reach', !!on);
  }
}

// A header name and a placement name are the bulk acts — the grid's own two axes, so
// no extra control: click a column to answer it for every placement, a row to answer
// every break of one placement. A cell with no break sits it out.
function suWfApplyBulk(kind, key) {
  const root = dialogRoot();
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

// ---------- the zone (inside GLOBAL SETTINGS since 11 Sep): the ladder, and nothing else ----------
// THE SECTION BECAME A ZONE (11 Sep, user call — *"can we make one section which is global
// settings and move header bidding and global waterfall there"*). The two setup-wide answers
// share ONE folded head, `Global settings`, and each is a zone row down its left rail —
// `Header bidding`, then `Waterfall` — which is the exact anatomy every break row has
// (Special · Ad sources · Delivery settings), one page up. This file draws the waterfall's
// zone and the glimpse it lends the folded head; `suGlobalsHtml` (views-setups-editor.js)
// draws the head and stacks the zones.

// The folded head's glimpse for this zone (re-cut 7 Sep, user call — the counted prose
// distracted and said little): the walk in badges, an off or depth-cut unit dimmed in
// place. ONLY the order — who follows it is each break's own story. Nothing when empty.
function suWfGlimpseHtml() {
  const wf = suWf();
  const filled = (wf.rungs || []).filter(r => r.tagId);
  if (!filled.length) return '';
  let gAt = 0;
  return `<span class="glimpse-walk">${filled.map(r => {
    const off = r.on === false;
    const cut = !off && wf.depth && ++gAt > wf.depth;
    const tag = SU_TAGS.find(x => x.id === r.tagId);
    return `<span class="wfg${off || cut ? ' dim' : ''}">${tag ? providerBadge(tag.provider) : ''}</span>`;
  }).join('<i class="gsep">›</i>')}</span>`;
}

function suWaterfallZoneHtml(meta) {
  const wf = suWf();
  const t = 'shared';
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
  // The zone's word is `Waterfall`: under a head that already says `Global settings`, the
  // qualifier would say it twice. `WF_WORD` (Global waterfall) stays the name the breaks
  // and every message use for it from anywhere else on the page.
  return `
      <div class="zone-row wf-zone">
        <span class="zone-l">Waterfall</span>
        <div class="zone-c">
          ${FORM.errors.waterfall ? `<div class="banner bad" data-err-for="waterfall">${esc(FORM.errors.waterfall)}</div>` : ''}
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
      </div>`;
}

// ---------- THE SOURCE, ON THE SECTION IT GOVERNS (8 Sep; re-seated 11 Sep) ----------
// *"In every slot there is not a clear demarcation of three state — no waterfall, custom
// waterfall and the global waterfall connected."* (8 Sep) → two controls and no prose: a
// `Waterfall` switch, then `Custom │ Global`. Then, 11 Sep: *"there is no clear demarcation
// of primary and the waterfall section, it is not getting communicated correctly"* and
// *"the waterfall switch is non symmetrical and not aligned with other switches, plus it is
// not cleanly discoverable — too much cognition"*.
//
// THE CONTROLS WERE RIGHT AND HOMELESS. They floated between the primary block and the fall
// rows, in a row of their own, at their own x — the switch sat at the zone's left edge while
// every unit's switch sat 53px to its right, so the one control governing a whole SECTION
// was the only switch on the page aligned to nothing. And the fall already had a second row
// naming it (`WATERFALL ORDER · 2 of 2 active`), so one section wore two headers.
//
// They live IN the section rule now (`suBreakLadderHtml`, views-setups-rungs.js): a break's
// Ad sources zone is two named sections, `PRIMARY` and `WATERFALL`, and each rule wears the
// unit rail — so the waterfall's switch lands in the same column as every unit switch under
// it, the way a parent checkbox sits over its children's in any list UI. One row, one
// header, one column of switches:
//
//        PRIMARY ──────────────────────────────────
//   ⠿  ⬤  [IMA] TOI Mweb VideoShow Post-roll
//      ⬤  WATERFALL   Custom │ Global   2 of 2 active ──
//   ⠿ 1 ⬤  [CAN] TOI Video Backfill
//
// These two render the rule's controls; nothing here draws a row of its own any more.

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
  // `own` with nothing under the primary is a break with NO FALL (11 Sep, with the two
  // sections): rung 1 is the primary's own row, so a custom waterfall begins at rung 2.
  // Before the sections were drawn apart, one row meant "a waterfall with something in
  // it" — the primary and the fall shared a list, so they shared a state.
  return (slot.rungs || []).length > 1 ? 'own' : 'none';
}

// THE TWO CONTROLS, AND NOTHING ELSE (8 Sep, user call — *"2 steps and no text or
// byline"*). The switch, then the answer it unlocks, then the one door up to the global
// ladder. Every fact this row used to state in words is on screen anyway: the units are
// the ladder below it, and the closed break row carries the walk.

// The section's one control: three answers and, while the shared ladder is serving, the door up
// to it. No byline — what an answer serves is drawn under it (see the block inside).
function suWfRuleSourceHtml(t) {
  const st = suSrcState(t);
  const cur = st === 'wf' ? 'setup' : st === 'own' ? 'own' : 'none';
  const slot = suSlot(t);
  const own = (slot.rungs || []).slice(1).filter(r => r.tagId).length;
  const answers = [['none', 'Off'], ['own', 'Custom'], ['setup', 'Global']];
  const seg = `<div class="seg small wf-src-seg">${answers.map(([v, l]) => {
    const why = v === cur ? '' : suSrcWhy(t, v);
    return `<button type="button" class="${v === cur ? 'on' : ''}${why ? ' dead' : ''}"${
      why ? ` title="${esc(why)}"` : ''}${why ? '' : ` onclick="suSrcPick('${t}', '${v}')"`}>${l}</button>`;
  }).join('')}</div>`;
  // NO BYLINE BESIDE THE ANSWER (11 Sep, user call — *"3 units · 2 breaks follow it — remove
  // this byline"*), the same call the waterfall's own foot took on 7 Sep (*"6 ad slots
  // connected — remove this text"*): what the answer serves is ON SCREEN under it — its own
  // rows, or the global's levers and the door to its ladder — so a count beside the control
  // was the page saying twice what it shows once.
  //
  // ONE EXCEPTION, and it is not a count of anything visible: a fall switched OFF is holding
  // units nobody can see. That is the only trace of them and the only hint that the way back
  // returns something, so it stays — and it goes the moment there is nothing parked.
  const kept = cur === 'none' && own ? `${own} unit${own === 1 ? '' : 's'} kept` : '';
  return `
    ${seg}
    ${kept ? `<span class="fall-n">${esc(kept)}</span>` : ''}
    ${cur === 'setup' ? `<button type="button" class="zlink wf-act" onclick="suWfJump()"
      title="Open the ${WF_WORD.toLowerCase()} at the top of this page">View</button>` : ''}`;
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
// rides the section's own control row above (see suWfRuleSourceHtml); the mirror of every rung
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
function suWfMirrorHtml() {
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
  // NO HEADER OF ITS OWN (11 Sep): the WATERFALL section rule above already names this
  // section, carries its switch and counts its followers. A second rule here made a
  // connected break the one break with two headers over one set of rows.
  return `
    <div class="wf-mirror">
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
