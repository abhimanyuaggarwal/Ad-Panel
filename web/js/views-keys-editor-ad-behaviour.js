// views-keys-editor-ad-behaviour.js — the integration page's AD BEHAVIOUR card: the four
// break tabs with their switches, THE DRIVE (this surface's per-break quick decisions —
// who is asked and in what order, waterfall depth, direct, start offset, impressions),
// and beside it the RESOLVED WATERFALL each placement would walk.
//
// The walk is mirrored client-side here (`clientDriveWalk`) to match the server's
// `driveWalkRungs` exactly, so the number on screen is the number that serves. This page
// never holds a ladder: the ladders live in the ad setup, one click away.
// ---------- sections: switches + inline field groups ----------



// ---------- the walk, mirrored client-side (26 Aug, DRIVING-SCOPE) ----------
// The setup's ladder IS the arrangement now — local mutes and orders died with the
// 1:1 setup promise. These mirrors match the server's driveWalk exactly, so the
// number on screen is the number that serves.

function keySecs() {
  return FORM.data.sections.map((_, j) => j);
}

function ladderOfViews(slotLike) {
  if (!slotLike) return [];
  return (slotLike.rungs || []).map((r, n) => {
    const v = (slotLike.rungView || [])[n] || {};
    return { key: r.tagId, label: v.label || '', provider: v.provider || '', opsOff: r.on === false };
  });
}

// A slot's break groups as the client sees them (31 Aug): a mid-roll may hold up to
// three; every other slot reads as one. Same accessor shape as the server's.
function clientGroupDefs(i, t) {
  const plc = setupPlacement(i);
  if (!plc) return [];
  const slot = plc.slots[t];
  return (slot.groups && slot.groups.length) ? slot.groups : [slot];
}

function clientLadder(i, t, gi = 0) {
  const gs = clientGroupDefs(i, t);
  return ladderOfViews(gs[gi] || gs[0]);
}

// The drive decision resolved against one section's ladder. With no `who` and no
// `tries` this is exactly the setup's own walk: the positional cut first (a dead rung
// holds its seat), then the dead drop. A `who` reorders, so positions lose meaning and
// the setup's depth applies as a COUNT; `tries` is always a count of real tries.
// The client mirror of `walkWithinDepth` (store/ladders.js): counted DOWN the walk, so
// the primary — the first rung of its own partner — survives every cap of 1 or more.
function clientWalkWithinDepth(walk, depth) {
  if (!depth || !Object.keys(depth).length) return walk;
  const seen = {};
  return walk.filter(r => {
    seen[r.provider] = (seen[r.provider] || 0) + 1;
    return !depth[r.provider] || seen[r.provider] <= depth[r.provider];
  });
}

function clientDriveWalk(i, t, gi = 0) {
  const plc = setupPlacement(i);
  if (!plc) return { walk: [], fellBack: false };
  const rot = isRotation(t);
  const g = clientGroupDefs(i, t)[gi];
  if (!g) return { walk: [], fellBack: false };
  const ladder = ladderOfViews(g);
  const base = ladder.filter(r => !r.opsOff);
  const d = driveOf(t);
  const ask = d.ask?.length ? d.ask : null;
  let walk = base;
  let fellBack = false;
  if (ask && !rot) {
    // The client mirror of `driveWalk` — same rule, so the page never promises a walk
    // the server would resolve differently. TIERS (31 Aug): the primary is a position,
    // never displaced — the ask filters and orders the WATERFALL, the one ordered thing
    // left. Stable sort keeps ad ops' order inside a partner's own rungs.
    const primary = ladder[0] && !ladder[0].opsOff ? ladder[0] : null;
    const tail = ladder.slice(1).filter(r => !r.opsOff);
    const mine = tail.filter(r => ask.includes(r.provider));
    if (!mine.length) {
      // None of those partners in the waterfall — loud. A ladder with no waterfall at
      // all honours any order decision by definition (1 Sep): primary only, nothing to say.
      fellBack = tail.length > 0;
    } else {
      const ordered = [...mine].sort((a, b) => ask.indexOf(a.provider) - ask.indexOf(b.provider));
      walk = [...(primary ? [primary] : []), ...ordered];
    }
  }
  if (!rot) walk = clientWalkWithinDepth(walk, d.depth);
  if (d.tries && !rot) walk = walk.slice(0, d.tries);
  return { walk, fellBack };
}

function clientWalk(i, t, gi = 0) { return clientDriveWalk(i, t, gi).walk; }
// The switch may only light where EVERY break group has something to ask.
function clientAllGroupsWalk(i, t) {
  const gs = clientGroupDefs(i, t);
  return gs.length > 0 && gs.every((_, gi) => clientWalk(i, t, gi).length > 0);
}

// One switch, every section — mixed goes ON, all-on goes OFF, and a section with
// nothing live to run is passed over and named rather than lit into darkness.
function secSlotToggle(t) {
  const picked = keySecs();
  const want = !picked.some(j => FORM.data.sections[j].slots[t].on);
  const skipped = [];
  for (const j of picked) {
    const slot = FORM.data.sections[j].slots[t];
    if (want && !clientAllGroupsWalk(j, t)) { skipped.push(FORM.data.sections[j].name); continue; }
    slot.on = want;
  }
  clearErr('sections');
  FORM.rerender();
  // The sections it passed over repaint switched-off in place, and grey says so.
  if (skipped.length) toast(`${skipped.length} left off`, 'warn');
}

// ---------- THE DRIVE: switches and preconfigured decisions (26 Aug, DRIVING-SCOPE) ----------
// The manager's image, kept literally: driving a car you get a switch and two or three
// preconfigured gears — anything finer means stopping the car. So this card holds, per
// break: the SWITCH · WHO fills it (a dropdown generated from the companies actually
// behind the break) · TRIES (1 / 2 / 3 / All) · the pre-roll's start · ads in a row.
// The workshop — dragging rungs, killing tags, every number — is the ad setup, one
// click away and this integration's alone (the 1:1 promise). Decisions are INTENT,
// resolved live: ad ops adding a tag next week joins the walk the decision already
// describes, and there is no unmappable Custom state — "As set up" is always true.

const QF_TEXT = {}; // caret-safe text buffers (the player fields still use them)

function driveOf(t) { return (FORM.data.drive || {})[t] || {}; }

// A drive key touched this session — the quiet tint's predicate (7 Sep, user call).
function driveDirty(t, ...fields) {
  if (!FORM.saved) return false;
  return fields.some(f =>
    JSON.stringify(FORM.data.drive?.[t]?.[f] ?? null) !== JSON.stringify(FORM.saved.drive?.[t]?.[f] ?? null));
}

// Writes are sparse: null (or 'setup' / 'All') drops the field, so the break starts
// following the setup again — dropping a decision is not "setting it back".
function driveSet(t, f, val) {
  if (!FORM.data.drive) FORM.data.drive = {};
  const slot = { ...(FORM.data.drive[t] || {}) };
  if (val === null || val === undefined || val === 'setup') delete slot[f];
  else slot[f] = val;
  if (Object.keys(slot).length) FORM.data.drive[t] = slot;
  else delete FORM.data.drive[t];
  clearErr('sections');
  clearErr('drive');
  FORM.rerender();
}

function provWord(p) { return label('tagProvider', p) || p; }

// THE WATERFALL LADDER (27 Aug as chips; re-cut 16 Sep, user call — *"Waterfall order
// needs to be rescoped wherein I should be able to define the waterfall depth for each
// IMA GPT and CAN as well"*).
//
// The control began as a dropdown, which could only offer the two shapes a dropdown can
// hold ("X only", "X first"); it became a strip of draggable chips, which said the whole
// sentence — *these partners, in this order*. Today it takes the third decision too:
// HOW MANY of each partner's own sources this break tries. So the chips stand up into a
// LADDER, one partner per line, and the line reads the way the fall runs:
//
//     ⠿  1  IMA   ●on    [1][2][3][All]   of 5
//     ⠿  2  GPT   ●on    [1][2][3][All]   of 2
//        –  CAN   ○off   [ greyed      ]
//
// WHY A LIST AND NOT WIDER CHIPS (the 1 Sep "one line, always" call re-read). That call
// was against WRAPPING and against re-homing a switched-off partner onto an "excluded"
// shelf — the row must not reflow and nothing must move under the cursor. Three decisions
// × three partners on one line is nine controls in a row: the clutter the same call was
// protecting against. A vertical ladder keeps every guarantee the strip made (fixed
// anatomy, a skipped partner dimmed IN PLACE, nothing re-homed, nothing changing width)
// and adds the one a strip cannot: a waterfall drawn top-to-bottom IS its own order, so
// the position number confirms what the eye already read rather than teaching it.
//
// AND THE OVERALL CAP CAME WITH IT (same day, user call — *"waterfall depth a global one
// will stay"*). `Waterfall depth · 1 / 2 / 3 / Full` used to be its own row, counting the
// WHOLE walk while knowing nothing about the partner order above it: one concept answered
// twice, a card's width apart, with no drawn relationship — "IMA 2 and GPT 2, but 3 in
// all" was a sum with no picture. It is the ladder's FOOT now, under a hairline, under the
// partners it caps, with the resolved total counted beside it. Two grains, one block, and
// the arithmetic between them on screen: how far each partner goes, then a ceiling over
// the lot. The resolved column answers to both, per placement, as it always did.
//
// The ladder is still GENERATED from the companies behind this break, never a fixed list
// to go stale when a partner joins. A partner with no demand anywhere in this break is
// still drawn — greyed, in place, with the reason on it — because a control that
// silently has two rows on one break and three on another teaches nothing.

// Every partner behind this break, in the setup's own ask order, plus the ones that
// aren't there at all so the row reads the same on every break. `tags` counts each
// partner's LIVE sources — the denominator the depth control is honest against, and the
// reason an option above it greys instead of promising a try that cannot happen.
function breakProviders(t) {
  const here = [];
  const tags = {};
  for (const j of keySecs()) {
    const mine = {};
    for (const r of clientLadder(j, t)) {
      if (r.opsOff || !r.provider) continue;
      if (!here.includes(r.provider)) here.push(r.provider);
      mine[r.provider] = (mine[r.provider] || 0) + 1;
    }
    // Placements may hold different ladders; the control is one. The denominator is the
    // DEEPEST any picked placement goes — a cap below it still bites everywhere, and a
    // cap above it would be the one number on the page that promises what no section has.
    for (const [p, n] of Object.entries(mine)) tags[p] = Math.max(tags[p] || 0, n);
  }
  const missing = (window.KL_PROVIDERS || []).filter(p => !here.includes(p));
  return { here, missing, tags };
}

// What the ladder shows: the saved decision if there is one, otherwise the setup's own
// arrangement — so it is a statement of what runs before it is a control.
function askOrder(t) {
  const { here, missing, tags } = breakProviders(t);
  const saved = driveOf(t).ask;
  const on = saved ? saved.filter(p => here.includes(p) || missing.includes(p)) : [...here];
  const off = [...here, ...missing].filter(p => !on.includes(p));
  return { on, off, here, missing, tags, decided: !!saved };
}

// The caps, sparse: a partner with no entry is walked all the way down, so `All` WRITES
// NOTHING — dropping a cap is not "setting it back to full".
function depthOf(t) { return driveOf(t).depth || {}; }

function depthSet(t, p, n) {
  const depth = { ...depthOf(t) };
  if (n === 'all' || !n) delete depth[p];
  else depth[p] = n;
  driveSet(t, 'depth', Object.keys(depth).length ? depth : null);
}

// One partner's depth — and, where there is no depth to decide, THE REASON IN THE CONTROL'S
// OWN SEAT (16 Sep, user call — *"CAN and GPT has one source nothing to cut, that is not
// getting communicated properly in the UI since the depth is disabled"*).
//
// A partner with ONE source has no depth question: `1` and `All` are the same answer. The
// seg greyed itself and put the reason on hover, which is a dead control and a secret — a
// reader sees four numbers they cannot press and no cause given. So the seg does not stand
// there at all: its cell says `only 1 source`, which is the reason and the fact at once, in
// plain words, exactly where the control would have been.
//   This is safe from the "nothing appears or vanishes" rule precisely because it does NOT
// move: a partner's source count is fixed while the page is open, so this cell never
// changes shape under the cursor. A switched-off partner keeps its greyed seg for the same
// rule read the other way — that one would flip on every toggle, and the row already reads
// as off from its dash, its grey mark and its switch.
function depthCellHtml(t, p, n, isOn) {
  const word = provWord(p);
  if (n <= 1) return `<span class="wfd-why">${esc(n === 1 ? 'only 1 source' : 'no sources yet')}</span>`;
  const cur = depthOf(t)[p] ?? 'all';
  return accSeg(cur, [1, 2, 3, 'all'], ['1', '2', '3', 'All'],
    o => `depthSet('${t}', '${p}', ${o === 'all' ? "'all'" : o})`,
    isOn ? '' : `${word} is switched off — this break does not ask it`,
    // Deeper than this partner goes: greyed where it sits, with the count as its reason.
    o => (o !== 'all' && o > n ? `${word} has ${n} sources in this break` : ''));
}

function wfLadderHtml(t) {
  const { on, off, here, tags } = askOrder(t);
  if (!here.length) return '<span class="sg-empty">No demand</span>';
  const dragKey = `ask-${t}`;
  registerDrag(dragKey, (from, to) => {
    const order = askOrder(t).on;
    order.splice(to, 0, order.splice(from, 1)[0]);
    driveSet(t, 'ask', order);
  });
  const row = (p, i, isOn) => {
    const absent = !here.includes(p);
    const n = tags[p] || 0;
    const last = isOn && on.length === 1;
    // Both directions of the switch can be settled rather than free, and each says so
    // where it stands: the last partner on would leave the break asking nobody, and a
    // partner with nothing behind it has nothing to switch on.
    const why = absent
      ? `No ${provWord(p)} tags behind this break — ad ops add one in the ad setup`
      : last
        ? 'The only partner left on — a break that asks nobody would go dark'
        : '';
    const canDrag = isOn && on.length > 1;
    return `
      <div class="wfd-r ${isOn ? 'on' : 'skip'} ${absent ? 'absent' : ''}"
        ${canDrag ? dragAttrs(dragKey, i) : ''}>
        <span class="wfd-grip">${canDrag ? '⠿' : ''}</span>
        <b class="wfd-n">${isOn ? i + 1 : '–'}</b>
        <span class="wfd-p">${providerBadge(p)}</span>
        <span class="toggle tiny ${isOn ? 'on' : ''} ${why ? 'held' : ''}"
          ${why ? ` title="${esc(why)}"` : ''}
          onclick="${why ? `toast('${esc(last ? 'One partner must stay on' : 'Nothing behind this break')}', 'warn')` : `askToggle('${t}', '${p}')`}"><span class="track"></span></span>
        <span class="wfd-d">${depthCellHtml(t, p, n, isOn && !absent)}</span>
      </div>`;
  };
  // THE OVERALL CAP IS ITS OWN ROW AGAIN (16 Sep, third cut, user call — *"dont mingle the
  // overall in the existing one it is getting confusing"*). It rode the ladder's foot for one
  // round on the reasoning that drawing the two grains together would explain their
  // relationship. It did the opposite: a ceiling sitting inside the partner list read as a
  // fourth partner with a strange name, and the block stopped being one question. The
  // partners are this control; the ceiling over all of them is `Waterfall depth`, the row
  // directly under it.
  return `
    <div class="wfd">
      ${on.map((p, i) => row(p, i, true)).join('')}
      ${off.map(p => row(p, -1, false)).join('')}
    </div>`;
}

// Switching one off writes the remaining order AND drops that partner's cap — a depth
// for a partner nobody asks is a number with nothing to count. Switching one on appends
// it at the end, which is where a partner you just added should be asked.
function askToggle(t, p) {
  const { on, off } = askOrder(t);
  if (on.includes(p)) {
    if (on.length === 1) { toast('One partner must stay on', 'warn'); return; }
    const depth = { ...depthOf(t) };
    delete depth[p];
    if (!FORM.data.drive) FORM.data.drive = {};
    const slot = { ...(FORM.data.drive[t] || {}) };
    if (Object.keys(depth).length) slot.depth = depth; else delete slot.depth;
    FORM.data.drive[t] = slot;
    driveSet(t, 'ask', on.filter(x => x !== p));
  } else {
    void off;
    driveSet(t, 'ask', [...on, p]);
  }
}

// "Both speeds" (user call): one break's partner order and depth stamped onto every
// break with demand behind it — one act; the per-break controls stay the single source
// of state. A break carrying none of the asked partners is left alone and named.
function driveStampAll(t) {
  const d = driveOf(t);
  const ask = d.ask || null;
  const took = [];
  const skipped = [];
  for (const t2 of KL_META.slotTypes) {
    if (t2 === t || isRotation(t2)) continue;
    const provs = new Set();
    let any = false;
    for (const j of keySecs()) {
      for (const r of clientLadder(j, t2)) if (!r.opsOff) { any = true; provs.add(r.provider); }
    }
    if (!any) continue; // nothing behind that break — nothing to decide
    if (ask && !ask.some(p => provs.has(p))) { skipped.push(label('slotType', t2)); continue; }
    if (!FORM.data.drive) FORM.data.drive = {};
    const slot = { ...(FORM.data.drive[t2] || {}) };
    for (const f of ['ask', 'depth', 'tries']) {
      if (d[f] === undefined) delete slot[f]; else slot[f] = deepCopy(d[f]);
    }
    if (Object.keys(slot).length) FORM.data.drive[t2] = slot;
    else delete FORM.data.drive[t2];
    took.push(label('slotType', t2));
  }
  clearErr('sections');
  clearErr('drive');
  FORM.rerender();
  if (!took.length && !skipped.length) { toast('No other breaks apply', 'warn'); return; }
  // The breaks it took and the breaks it passed over both repaint in place, named, on
  // the tabs right above — so the pill counts and stops (7 Sep, user call).
  toast(skipped.length ? `${took.length} applied · ${skipped.length} skipped`
    : `Applied to ${took.length} break${took.length === 1 ? '' : 's'}`,
    skipped.length ? 'warn' : undefined);
}

// The warning is a door: the exact placement and break in the ad setup, an empty rung
// waiting, its provider preselected.
function addLinkHtml(setup, secName, t, provider) {
  if (!setup) return '';
  return `<button type="button" class="zlink wp-fix"
    onclick="goAddRung('${setup.id}', ${jsLit(secName)}, '${t}', '${provider}')">add ${esc(provWord(provider))} →</button>`;
}

async function goAddRung(setupId, secName, t, provider) {
  const dirty = JSON.stringify(keyPayload(FORM.data)) !== JSON.stringify(KEY_ORIG_CANON);
  if (dirty) {
    const ok = await ask({
      title: 'Leave this integration?',
      body: `<p class="dlg-note">Unsaved changes here will be lost. Save them first, then come back to “${esc(secName)}”.</p>`,
      okLabel: 'Leave without saving',
      danger: true,
    });
    if (!ok) return;
  }
  window.SU_PENDING = { setupId, secName, slot: t, provider };
  location.hash = `#setups/${setupId}`;
}

// ---------- the break picker (one break visible at once — 26 Aug, user call) ----------

let KEY_SLOT = 'preroll';
function keySlotSet(t) { KEY_SLOT = t; FORM.rerender(); }

function keySlot() {
  return KL_META.slotTypes.includes(KEY_SLOT) ? KEY_SLOT : KL_META.slotTypes[0];
}

// ---------- the four breaks as TABS (26 Aug, user call) ----------
// A dropdown made you open it to see the other three, and made the card's subject a
// value inside a control. Four is few enough to sit side by side, and the OPS ROOM
// already tabs its placements — so both rooms now use one tab grammar (`scope-tabs`),
// not a tab in one and a select in the other.
//
// The dropdown's one virtue was that each option carried its own state, so opening it
// summarised the surface. Tabs keep that WITHOUT the opening: every break wears a dot,
// so all four states are legible at rest. The words live on hover, never as a byline.
function slotState(t) {
  const picked = keySecs();
  const onN = picked.filter(j => FORM.data.sections[j].slots[t].on).length;
  const has = picked.some(j => clientLadder(j, t).some(r => !r.opsOff));
  return { onN, total: picked.length, has,
    kind: !has ? 'none' : onN === 0 ? 'off' : onN === picked.length ? 'on' : 'part' };
}

// The state dots are GONE (1 Sep, user call — a legend nobody had). What remains is
// words: a break with nothing to run dims, its reason on hover; the only dot left is
// AMBER and means exactly one thing — this tab holds unsaved changes.
function slotEdited(t) {
  if (!KEY_ORIG_CANON) return false;
  const a = JSON.stringify((FORM.data.drive || {})[t] || null);
  const b = JSON.stringify((KEY_ORIG_CANON.drive || {})[t] || null);
  if (a !== b) return true;
  return (FORM.data.sections || []).some((s2, j) =>
    !!s2.slots[t]?.on !== !!KEY_ORIG_CANON.sections?.[j]?.slots?.[t]?.on);
}

// EVERY BREAK'S SWITCH RIDES ITS OWN TAB (1 Sep, user call): the four states are
// visible in parallel, no tab has to be visited to be switched. Binary as before —
// on = the break asks on this surface; a section that differs says "inactive" on its
// own resolved row. The toggle flips without selecting; the label selects. The edited
// dot is absolutely positioned and the toggle is a fixed size, so nothing on the strip
// ever shifts.
function breakTabsHtml() {
  const setup = sectionSetup(0);
  return `
    <div class="scope-tabs brk-tabs">
      ${KL_META.slotTypes.map(t => {
        const picked = keySecs();
        const anyOn = picked.some(j => FORM.data.sections[j].slots[t].on);
        const has = picked.some(j => clientWalk(j, t).length);
        // The switch can move only if some picked placement has a full walk — the same
        // test secSlotToggle applies. Dead in place with the reason otherwise (7 Sep,
        // UAT P1: it used to flip nothing and toast "Left off").
        const can = picked.some(j => clientAllGroupsWalk(j, t));
        const live = anyOn || can;
        const vacant = slotState(t).kind === 'none';
        // Two lengths of the same refusal (7 Sep, user call): `why` is the whole reason
        // and rides title=, where there is room to read it; `whyShort` is what the pill
        // says on a click, because a pill gets three to five words and no more.
        const why = !setup ? 'Attach an ad setup first'
          : !has ? 'No demand yet — ask ad ops'
          : `No ${label('slotType', t).toLowerCase()} demand for ${picked.map(j => FORM.data.sections[j].name).join(', ')} — ad ops add it in “${setup.name}”`;
        const whyShort = !setup ? 'Attach an ad setup first'
          : !has ? 'No demand yet' : 'No demand for these';
        const active = keySlot() === t;
        // Grey says SWITCHED OFF, never "not the tab you're on" — the label follows the
        // same truth its mini toggle shows.
        return `<button type="button" class="stab wswitch ${active ? 'on' : ''} ${anyOn ? '' : 'off'} ${vacant ? 'vacant' : ''}"
          onclick="keySlotSet('${t}')"
          >${esc(label('slotType', t))}
          <span class="toggle mini ${anyOn ? 'on' : ''} ${(active && live) ? '' : 'dead'}"
            ${active ? `onclick="event.stopPropagation(); ${live ? `secSlotToggle('${t}')` : `toast('${esc(whyShort)}', 'warn')`}"` : ''}
            ${!active ? 'title="Open this tab first — then switch it"' : !live ? `title="${esc(why)}"` : ''}><span class="track"></span></span>
          ${slotEdited(t) ? '<i class="edot" title="Unsaved changes on this break"></i>' : ''}</button>`;
      }).join('')}
    </div>`;
}

// ---------- the card itself ----------

// The driving controls for one break: three or four rows, all switches and pickers,
// nothing to type. "Use the setup's" beside a bent switch drops the decision — the
// field follows the workshop again, so a later ops change still arrives.
// WHO ELSE BIDS FOR THIS BREAK (11 Sep, user call — *"in the integration screen, in the ad
// behaviour section, give this header bidding switch too"*). The surface's own answer over
// the ad setup's, stored sparse like every other quick decision: `As set up` IS absence, and
// it names what the setup resolves to today beside it, so leaving it alone is never leaving
// it unknown. `Custom` reveals the partners — the same two-tier shape the ad setup's own
// delivery row wears, so one control is learned once and read in both rooms.
function keyHbAsSetUp(t) {
  const j = keySecs()[0] ?? 0;
  const own = slotBhv(j, t)?.headerBidding || 'auto';
  return own === 'auto' ? (sectionSetup(j)?.headerBidding || 'off') : own;
}

function driveHbRowHtml(t) {
  const d = driveOf(t);
  // WHAT THE SETUP RESOLVES TO, mirrored exactly as the server resolves it
  // (`servedHeaderBidding`): the placement's own answer, or the setup's global while that
  // answer is `auto`. Same rule, both sides of HTTP — the page's own standing arrangement
  // for every resolved fact on it (see `clientDriveWalk`).
  const asSetUp = keyHbAsSetUp(t);
  const cur = d.headerBidding;
  const mode = cur === undefined ? 'setup' : cur === 'off' ? 'off' : 'custom';
  const partners = hbPartners();
  const start = partners.includes(asSetUp) ? asSetUp : partners[0];
  const modeSeg = accSeg(mode, ['setup', 'off', 'custom'], ['As set up', 'Off', 'Custom'],
    o => `driveSet('${t}', 'headerBidding', ${o === 'setup' ? 'null' : o === 'off' ? "'off'" : `'${start}'`})`);
  const partnerSeg = mode !== 'custom' ? '' : accSeg(cur, partners, partners.map(p => label('headerBidding', p)),
    o => `driveSet('${t}', 'headerBidding', '${o}')`);
  return accRow(fieldName('headerBidding'), `
    <div class="hb-ctl">
      <div class="hb-l1">${modeSeg}${mode === 'setup'
        ? `<span class="podl">${esc(label('headerBidding', asSetUp))}</span>` : ''}</div>
      ${partnerSeg}
    </div>`, null, driveDirty(t, 'headerBidding'));
}

// ---------- STEP ONE: DOES THIS BREAK DECIDE ANYTHING OF ITS OWN? (16 Sep, user call) ----------
// *"Once I enable a pre-roll or mid-roll I have two options by default — values and
// configurations to be taken from the ad setup, or customize; in that case the existing
// levers will come, and I will always have the option to switch back to the ad setup
// configuration via a confirmation dialog."*
//
// THE FAULT WAS REAL. A break switched on opened straight into six levers, and every one
// of them showed a value — `Immediate`, `1`, `All`, `Amazon+Prebid` — with nothing on
// screen to say whether that value was DECIDED here or merely inherited from the ad setup.
// The state existed (the drive is sparse: absence means follow the setup) but it was
// legible in exactly one place — whether a ghost `Reset to setup` button at the bottom
// right was greyed. A state you can only read off the enabledness of a button is not on
// the screen, and the way back out of it was a footnote with no confirm and no count.
//
// NOW, the same two steps the ad setup's own source control teaches (8 Sep, suSrcPick):
// step one is answered first, and step two only exists while step one says so.
//
//     [ As set up │ Custom ]                      ← step one, under the tabs
//     Special        IMA                          ← as set up: the answers, READ-ONLY
//     Start offset   Immediate
//
//     [ As set up │ Custom ]   3 of its own       ← custom: the levers, exactly as before
//
// CUSTOM IS A MODE, NEVER A SNAPSHOT. Taking Custom copies nothing: each lever still
// writes sparse, and each lever left alone still follows the setup LIVE — so ad ops
// adding a tag next week still joins the walk this break describes. Seeding the fields
// with today's values would freeze the break at a moment and quietly break the promise
// the whole card was built on ("there is no unmappable Custom state").
//
// WHICH IS WHY THE MODE IS SESSION STATE AND NOT PAYLOAD (the SU_SRC_BACK reasoning):
// the server has ONE truth per break — the sparse drive — and a second field meaning
// "opened the levers but decided nothing" would be a lie in the payload, since it
// resolves to nothing. A break holding decisions IS custom and reads as custom on any
// reload; a break holding none IS following the setup, which is exactly what it does.
const DRIVE_CUSTOM = new Set();

function driveCustom(t) {
  return Object.keys(driveOf(t)).length > 0 || DRIVE_CUSTOM.has(t);
}

// Where the act lands, in the card's own words — the placements this card covers and the
// break — so a confirm can never leave you wondering which one you just changed.
function driveWhere(t) {
  const secs = keySecs().map(j => FORM.data.sections[j]?.name).filter(Boolean);
  const who = secs.length > 2 ? `${secs.length} placements` : secs.join(', ');
  return `${who} · ${label('slotType', t)}`;
}

// BOTH DIRECTIONS CONFIRM, IN THE AD SETUP'S OWN DIALOG (16 Sep, user call — *"the switch
// between custom to as setup should be via a confirmation clean dialog box, use the same
// that is being used in the ad setup"*). The first cut confirmed only the destructive way
// back, reasoning that taking Custom loses nothing so a dialog there would be a question
// with no stake. The ad setup's source seg confirms EVERY change (`suSrcPick`), and one
// control learned once has to behave the same in both rooms — a seg that sometimes asks
// and sometimes does not is two controls wearing one shape.
//   The body IS the move: where it lands, then `from → to`. Going back adds the count of
// what it drops and wears the danger weight; taking Custom drops nothing and does not.
//   THE CTA IS THE SWITCH'S OWN WORD (16 Sep, user call — *"yes go back should not be the
// CTA when switching from custom to as setup, it should be the same switch"*). `Yes, go back`
// and `Yes, switch` were a second vocabulary invented for an act the control already names:
// the seg says `As set up` and `Custom`, the move line says `Custom → As set up`, and then a
// button said a third thing. The button now carries the DESTINATION, spelled exactly as the
// segment spells it — so the dialog reads as the switch being thrown, not as an escape hatch
// out of one. The title asks the one question both directions share and the move line says
// which way, which is why there is no longer a title per direction either.
async function driveModePick(t, which) {
  if ((which === 'custom') === driveCustom(t)) return;
  const toCustom = which === 'custom';
  const n = Object.keys(driveOf(t)).length;
  const ok = await ask({
    title: 'Switch this break\u2019s settings?',
    body: `
      <div class="src-cfm">
        <div class="src-cfm-where">${esc(driveWhere(t))}</div>
        <div class="src-cfm-move">
          <span class="from">${toCustom ? 'As set up' : 'Custom'}</span>
          <i class="arw" aria-hidden="true">\u2192</i>
          <span class="to">${toCustom ? 'Custom' : 'As set up'}</span>
        </div>
        ${!toCustom && n ? `<div class="src-cfm-note">${n} decision${n === 1 ? '' : 's'} on this break ${n === 1 ? 'is' : 'are'} dropped.</div>` : ''}
      </div>`,
    okLabel: toCustom ? 'Custom' : 'As set up',
    cancelLabel: 'Cancel',
    danger: !toCustom && n > 0,
  });
  if (!ok) return;
  if (toCustom) { DRIVE_CUSTOM.add(t); FORM.rerender(); return; }
  DRIVE_CUSTOM.delete(t);
  driveResetSlot(t);
}

// Step one, standing on the panel's own left edge with its counted consequence beside it
// — the same anatomy the ad setup's source seg wears, so one control is learned once and
// read in both rooms. The count is exactly what the way back drops, and the confirm names
// the same number again.
function driveModeHtml(t) {
  const custom = driveCustom(t);
  const n = Object.keys(driveOf(t)).length;
  return `
    <div class="dmode">
      ${accSeg(custom ? 'custom' : 'setup', ['setup', 'custom'], ['As set up', 'Custom'],
        o => `driveModePick('${t}', '${o}')`)}
      <span class="dmode-f">${custom && n ? esc(`${n} of its own`) : ''}</span>
    </div>`;
}

// ---------- AS SET UP: THE ANSWERS AS A STATEMENT, NOT AS LEVERS (16 Sep) ----------
// Not a blank panel and not greyed controls — a fact list. Every line is read from the
// attached setup exactly as the server resolves it, so the card SAYS what this break runs
// before it offers to change it, and the eye crosses it in one pass instead of parsing
// six controls to work out which of them was ever chosen. Tighter rhythm than the control
// rows it stands in for, because reading is not editing.
//
// THE WATERFALL IS ONE OF THESE LINES (16 Sep, user call — it was left out for a round on
// the reasoning that the right-hand column already shows it). What the column shows is the
// RESOLVED walk, per placement and per pod; what the fact says is the setup's partner
// ORDER. Different grains, and leaving the row out cost more than it saved: the fact list
// and the lever list then opened on different rows, so switching modes reshuffled the card
// instead of swapping its contents.
// The fact rows are the LEVER ROWS' own grammar with the control swapped for the value
// (`lr rule`, ghost grip, same 168px label column) — so the two modes share one label edge
// and one value edge, and switching between them moves nothing sideways. Building a
// parallel grid here would have been a second alignment system on one screen, which is
// the exact fault the row grammar was introduced to end (21 Aug).
function driveFactRow(l, v) {
  return `<div class="lr rule fact"><span class="lr-grip ghost"></span><span class="lr-l">${esc(l)}</span><span class="lr-ctl form">${v}</span></div>`;
}

function driveFactsHtml(t) {
  const base = slotBhv(0, t) || {};
  const rows = [];
  if (isRotation(t)) {
    rows.push(driveFactRow('Banners', '<span class="sg-dim">take turns</span>'));
  } else {
    // THE SAME ROWS, IN THE SAME ORDER, AS THE LEVERS THEY STAND IN FOR (16 Sep, user call —
    // standardisation). The list used to open on Special while the lever list opens on the
    // Waterfall, so switching modes reshuffled the card as well as swapping its contents.
    // Every lever now has a fact, in its own seat, saying what the setup answers for it.
    //   The waterfall's line is the setup's own PARTNER ORDER, which is a different grain
    // from the resolved walk in the right-hand column (that one is per placement, and per
    // pod, and repeats a partner as often as the ladder does) — so this is not the fact
    // twice, it is the decision on the left and its consequence on the right, which is the
    // arrangement Custom already uses.
    const partners = askOrder(t).here;
    rows.push(driveFactRow('Waterfall', partners.length
      ? `<span class="glimpse-walk">${partners.map(providerBadge).join('<i class="gsep">›</i>')}</span>`
      : '<span class="sg-dim">no demand</span>'));
    // With no decision on this surface the walk runs to the end of the ladder — said in
    // the lever's own word (`All`), never a second vocabulary for the same answer.
    rows.push(driveFactRow('Waterfall depth', '<span class="dfact-t">All</span>'));
    // The same accessor the Special lever reads, so the fact and the control can never
    // disagree about what the setup put behind this break.
    const dFacts = keySecs().map(j => FORM.data.sections[j]).map(s2 => s2?.slots?.[t]?.direct).find(Boolean)
      || KEY_ORIGINAL?.sections?.[0]?.slots?.[t]?.direct;
    rows.push(driveFactRow(label('slotType', 'direct'), dFacts
      ? `<span class="glimpse-walk">${(dFacts.walk || []).slice(0, 4).map(x => providerBadge(x.provider)).join('<i class="gsep">›</i>')}</span>`
      : '<span class="sg-dim">no special deals</span>'));
    if (t === 'midroll') {
      // A VALUE READS AS A VALUE; AN ABSENCE READS AS AN ABSENCE. Only a real cadence is
      // an answer this break has — "2 placements differ" and "set by interval" are the
      // page declining to let one placement speak for the rest, and dressing them in the
      // value's own weight would read as a setting somebody chose.
      const cad = midCadence();
      const one = cad.kind === 'ok' && !cad.differs && cad.base;
      const word = cad.kind !== 'ok'
        ? (cad.kind === 'interval' ? 'set by interval' : cad.kind === 'groups' ? 'several cadences' : 'no placement yet')
        : cad.differs ? `${cad.count} placements differ` : cad.base || 'none set';
      rows.push(driveFactRow('Cue points',
        `<span class="${one ? 'dfact-t' : 'sg-dim'}"${cad.why ? ` title="${esc(cad.why)}"` : ''}>${esc(word)}</span>`));
    }
    if (t === 'preroll') {
      rows.push(driveFactRow('Start offset', `<span class="dfact-t">${esc(base.start === 'deferred'
        ? `delayed ${base.deferSec ?? 7} sec` : 'immediate')}</span>`));
    }
    rows.push(driveFactRow(fieldName('podAds'), `<span class="dfact-t">${esc(String(base.podAds ?? 1))}</span>`));
  }
  rows.push(driveFactRow(fieldName('headerBidding'),
    `<span class="dfact-t">${esc(label('headerBidding', keyHbAsSetUp(t)))}</span>`));
  return `<div class="dfacts">${rows.join('')}</div>`;
}

// The driving controls for one break: step one always, then either the setup's answers
// read back or this break's own levers. "Reset to setup" is GONE from the footer — the
// seg at the top is the way back now, it confirms, and it names what it drops; two
// controls over one concept is the thing this cut was called to remove.
function driveControlsHtml(t) {
  const head = driveModeHtml(t);
  if (!driveCustom(t)) return `${head}${driveFactsHtml(t)}`;
  if (isRotation(t)) {
    // A ROTATION HAS ALMOST NOTHING TO DECIDE (7 Sep, UAT P2 — this row was a sentence
    // explaining itself): no pod, no walk, no order. It has ONE answer since 11 Sep —
    // who else bids for the banner slot — so the shape is named and the one decision
    // stands under it.
    return `${head}
      <div class="sg-empty" style="padding:4px 0">Banners take turns</div>
      ${driveHbRowHtml(t)}`;
  }
  const d = driveOf(t);
  const base = slotBhv(0, t) || {};
  const usable = KL_META.slotTypes.filter(t2 => !isRotation(t2)
    && keySecs().some(j => clientLadder(j, t2).some(r => !r.opsOff)));
  const deferOff = (d.start ?? base.start) !== 'deferred';
  const dFacts = keySecs().map(j => FORM.data.sections[j]).map(s2 => s2?.slots?.[t]?.direct).find(Boolean)
    || KEY_ORIGINAL?.sections?.[0]?.slots?.[t]?.direct;
  const dOn = d.direct !== false;
  // The Special row is FIXED on every break (1 Sep, user call; named Direct until 7 Sep)
  // — with no deals behind it, the switch is dead in place with the reason, never
  // absent. Nothing appears or vanishes as ops stage demand.
  const directRow = accRow(label('slotType', 'direct'), dFacts ? `
      <span class="toggle tiny ${dOn ? 'on' : ''}" onclick="driveSet('${t}', 'direct', ${dOn ? 'false' : 'null'})"><span class="track"></span></span>
      <span class="glimpse-walk${dOn ? '' : ' dim'}">${(dFacts.walk || []).slice(0, 4).map(x => providerBadge(x.provider)).join('<i class="gsep">›</i>')}</span>`
    : `
      <span class="toggle tiny dead" onclick="toast('No special deals yet', 'warn')"
        title="No special deals yet — ad ops add them"><span class="track"></span></span>
      <span class="sg-empty">no special deals</span>`, null, driveDirty(t, 'direct'));
  // THE WATERFALL FIRST, SPECIAL UNDER IT (16 Sep, user call). Special is tried BEFORE the
  // waterfall when the break actually runs, so the old order was the serve order — but one
  // switch stood above the card's whole subject, and a reader met the exception before the
  // rule. The block that carries most of the thinking takes the top seat; Special keeps its
  // fixed place directly beneath it, where its one switch reads as the tier it is.
  return `
    ${head}
    ${accRow('Waterfall', wfLadderHtml(t), null, driveDirty(t, 'ask', 'depth'))}
    ${accRow('Waterfall depth', accSeg(d.tries ?? 'all', [1, 2, 3, 'all'], ['1', '2', '3', 'All'],
      o => `driveSet('${t}', 'tries', ${o === 'all' ? 'null' : o})`), null, driveDirty(t, 'tries'))}
    ${directRow}
    ${cueRowHtml(t)}
    ${t === 'preroll' ? accRow('Start offset', `${accSeg(d.start ?? base.start, ['start', 'deferred'],
      ['Immediate', 'Delayed'], o => `driveSet('${t}', 'start', '${o}')`)}
      <div class="num-wrap${deferOff ? ' off' : ''}"><input value="${esc(driveDeferText(t, base))}" inputmode="numeric"
        ${deferOff ? 'disabled' : ''} oninput="driveDeferInput(this, '${t}')"><span class="unit">sec</span></div>`, null, driveDirty(t, 'start', 'deferSec')) : ''}
    ${accRow(fieldName('podAds'), accSeg(d.podAds ?? base.podAds ?? 1, [1, 2, 3], ['1', '2', '3'],
      o => `driveSet('${t}', 'podAds', ${o})`), null, driveDirty(t, 'podAds'))}
    ${driveHbRowHtml(t)}
    ${usable.length > 1 ? `<div class="zrow drive-foot">
      <button type="button" class="zlink" onclick="driveStampAll('${t}')">Apply to all breaks</button>
    </div>` : ''}`;
}

// WHERE THE MID-ROLL BREAKS FALL (3 Sep, user call). The cadence used to be the ad
// setup's alone; with the 1:1 promise a setup IS this integration's, so the positions
// are a decision this page can make — stored on the drive, sparse, resolved over the
// placement. Two shapes it will not pretend to answer, greyed in place with the reason:
// an INTERVAL cadence (the positions are not a list then) and a mid-roll running SEVERAL
// break groups (each has its own cadence — one answer cannot stand for all of them).
function midCadence() {
  const setup = sectionSetup(0);
  if (!setup) return { kind: 'nosetup', why: 'Map an ad setup first — the cadence is resolved over its placement' };
  const secs = keySecs().map(j => setupPlacement(j)).filter(Boolean);
  if (!secs.length) return { kind: 'nosetup', why: 'No placement behind this break yet' };
  const groups = secs.map(p => (p.slots.midroll.groups || []).length || 1);
  if (groups.some(n => n > 1)) {
    return { kind: 'groups', why: `This mid-roll runs ${Math.max(...groups)} break groups in “${setup.name}” — each has its own cadence, so where the breaks fall stays the ad setup's` };
  }
  const bases = secs.map(p => p.slots.midroll.behaviourBase || p.slots.midroll.behaviour || {});
  if (bases.some(b => b.mode === 'interval')) {
    const b = bases.find(x => x.mode === 'interval');
    return { kind: 'interval', why: `“${setup.name}” breaks this mid-roll every ${fmtCue(b.every || 480)} rather than at fixed positions — the interval is the ad setup's` };
  }
  // What the placements say TODAY. Placements that disagree never let one of them speak
  // for the rest (the house rule) — the row says they differ until a decision is made.
  const words = [...new Set(bases.map(b => (b.cuepoints || []).map(fmtCue).join(', ')))];
  return { kind: 'ok', base: words.length === 1 ? words[0] : '', differs: words.length > 1, count: words.length };
}

// Typed positions are parsed on the way in and only reformatted on blur — the caret
// rule. An empty box drops the decision: the break follows the ad setup again.
let DRIVE_CUE_BAD = null;
function driveCueBadWhy(text) {
  const bad = parseCuepointsText(text).filter(x => typeof x !== 'number');
  if (!bad.length) return null;
  return `“${bad[0]}” is not a time — write 2:00, or 120 for seconds`;
}
function driveCueInput(el) {
  QF_TEXT['drive:cuepoints'] = el.value;
  DRIVE_CUE_BAD = driveCueBadWhy(el.value);
  const wrap = el.closest('.cue-in');
  el.classList.toggle('err', !!DRIVE_CUE_BAD);
  wrap?.parentElement?.querySelector('.cue-msg')?.remove();
  if (DRIVE_CUE_BAD) {
    el.title = DRIVE_CUE_BAD;
    wrap?.insertAdjacentHTML('afterend', `<span class="field-err cue-msg">${esc(DRIVE_CUE_BAD)}</span>`);
    return; // a list we cannot read is not written — Save says so too
  }
  el.title = '';
  const cps = parseCuepointsText(el.value).filter(x => typeof x === 'number');
  if (!el.value.trim()) driveSetQuiet('midroll', 'cuepoints', null);
  else driveSetQuiet('midroll', 'cuepoints', cps.length ? cps : null);
}

function driveCueBlur(el) {
  // A bad list keeps its text and its reason — reformatting it away would hide the
  // refusal and lose what the person typed.
  if (DRIVE_CUE_BAD) return;
  delete QF_TEXT['drive:cuepoints'];
  FORM.rerender();
  void el;
}

// A write that does NOT repaint — the positions box must keep its caret while typing.
function driveSetQuiet(t, f, val) {
  const d = FORM.data.drive || (FORM.data.drive = {});
  const slot = d[t] || (d[t] = {});
  if (val === null || val === undefined) delete slot[f];
  else slot[f] = val;
  if (!Object.keys(slot).length) delete d[t];
  clearErr('drive');
  const foot = document.querySelector('.drive-reset');
  if (foot) foot.disabled = !Object.keys(driveOf(t)).length;
}

function cueRowHtml(t) {
  if (t !== 'midroll') return '';
  const d = driveOf(t);
  const cad = midCadence();
  const set = d.cuepoints;
  const text = QF_TEXT['drive:cuepoints'] ?? (set ? set.map(fmtCue).join(', ') : '');
  if (cad.kind !== 'ok') {
    const word = cad.kind === 'interval' ? 'set by interval'
      : cad.kind === 'groups' ? 'several cadences'
      : 'no placement yet';
    return accRow('Cue points', `<span class="sg-empty">${esc(word)}</span>`, cad.why);
  }
  return accRow('Cue points', `
    <div class="cue-in${set ? ' set' : ''}"><input type="text" value="${esc(text)}"
      placeholder="${esc(cad.differs ? `${cad.count} placements differ — set one for all` : cad.base || '2:00, 6:00, 9:30')}"
      oninput="driveCueInput(this)" onblur="driveCueBlur(this)"></div>
    ${set ? `<button type="button" class="zlink" onclick="driveSet('${t}', 'cuepoints', null)">use the setup’s</button>`
      : `<span class="sg-dim">${esc(cad.differs ? 'set by placement' : 'as set up')}</span>`}`,
    null,
    driveDirty(t, 'mode', 'cuepoints', 'every'));
}

// ONE act, whole break (1 Sep, user call — the per-field "use the setup's" links were
// scattered): drop the break's every decision; the break follows the workshop again.
function driveResetSlot(t) {
  if (!FORM.data.drive) return;
  delete FORM.data.drive[t];
  if (!Object.keys(FORM.data.drive).length) FORM.data.drive = null;
  for (const k of Object.keys(QF_TEXT)) if (k.startsWith(`drv:${t}:`)) delete QF_TEXT[k];
  clearErr('sections');
  clearErr('drive');
  FORM.rerender();
}

// The seconds are the surface's now (27 Aug, user call — reversing "seconds stay ops'"
// from 26 Aug): a surface allowed to defer its pre-roll may as well say by how long.
// Typed, not stepped, so 4 or 12 are as reachable as the setup's 7. Held as text while
// the caret is in the field, exactly like every other number in the panel.
function driveDeferText(t, base) {
  const k = `drv:${t}:deferSec`;
  if (k in QF_TEXT) return QF_TEXT[k];
  const d = driveOf(t);
  return d.deferSec ?? base.deferSec ?? 7;
}

function driveDeferInput(el, t) {
  QF_TEXT[`drv:${t}:deferSec`] = el.value;
  if (!FORM.data.drive) FORM.data.drive = {};
  const slot = { ...(FORM.data.drive[t] || {}) };
  slot.deferSec = Number(el.value);
  FORM.data.drive[t] = slot;
  clearErr('sections');
  clearErr('drive');
}

// What each section runs, beside the controls — the answer next to the decision.
// A section the decision cannot land in says so, with the door to fix it.
function driveConsHtml(t) {
  const setup = sectionSetup(0);
  const ask = driveOf(t).ask || null;
  return keySecs().map(j => {
    const s = FORM.data.sections[j];
    if (!s.slots[t].on) {
      return `<div class="cons-row"><span class="cons-n">${esc(s.name)}</span>
        <span class="cons-v"><span class="sg-dim">inactive</span></span><span class="cons-m"></span></div>`;
    }
    // One row per BREAK GROUP (31 Aug) — a mid-roll may hold up to three, each with its
    // own ladder, and every one answers for itself.
    const gs = clientGroupDefs(j, t);
    return gs.map((g, gi) => {
      const rowName = gs.length > 1 ? `${s.name} · pod ${gi + 1}` : s.name;
      const { walk, fellBack } = clientDriveWalk(j, t, gi);
      const base = g.behaviour || {};
      const n = walk.length;
      if (!n) {
        return `<div class="cons-row"><span class="cons-n">${esc(rowName)}</span>
          <span class="cons-v cons-warn">no eligible demand</span>
          <span class="cons-m">${setup && ask ? addLinkHtml(setup, s.name, t, ask[0]) : ''}</span></div>`;
      }
      const shown = walk.slice(0, 4); // four fit the column at any width; the rest is a counted +N
      const badges = shown.map(x => providerBadge(x.provider)).join(isRotation(t)
        ? '<i class="gsep">·</i>' : '<i class="gsep">›</i>')
        + (walk.length > shown.length ? `<span class="sg-dim"> +${walk.length - shown.length}</span>` : '');
      const cadence = gs.length > 1
        ? `<div class="sg-dim">${esc(base.mode === 'interval'
            ? `every ${fmtCue(base.every)}`
            : `at ${(base.cuepoints || []).map(fmtCue).join(', ')}`)}</div>` : '';
      return `
        <div class="cons-row">
          <span class="cons-n">${esc(rowName)}</span>
          <span class="cons-v"><span class="glimpse-walk">${badges}</span>${fellBack
            ? `<div class="cons-warn">no ${esc((ask || []).map(provWord).join(' or '))} here — setup order</div>` : ''}</span>
          <span class="cons-m">${cadence}
            ${fellBack && setup && ask ? `<div>${addLinkHtml(setup, s.name, t, ask[0])}</div>` : ''}</span>
        </div>`;
    }).join('');
  }).join('');
}

function breakPanelHtml(t) {
  const picked = keySecs();
  const setup = sectionSetup(0);
  const onN = picked.filter(j => FORM.data.sections[j].slots[t].on).length;
  const on = onN === picked.length;
  const has = picked.some(j => clientWalk(j, t).length);
  const why = !setup ? 'Attach an ad setup first — ad ops fill it in their room'
    : `Nothing to run — ad ops add ${label('slotType', t).toLowerCase()} demand to “${setup.name}”`;
  void on; void has; void why;
  return `
    <div class="brk ${onN ? '' : 'slot-off'}">
      <div class="slot-edit">
        ${onN ? '' : `<div class="bt-note off-note">${esc(label('slotType', t))} is switched off — it asks for nothing. The switch is on its tab.</div>`}
        <div class="two-col">
          <div class="tc-left ${onN ? '' : 'card-dim dead-panel'}">${driveControlsHtml(t)}</div>
          <div class="tc-right">
            <div class="xa-head">Resolved waterfall</div>
            <div class="cons scrolly">${driveConsHtml(t)}</div>
          </div>
        </div>
      </div>
    </div>`;
}

// The mapped setup is the fact this section exists for, so it rides the TITLE ROW at the
// right edge (3 Sep, user call — a strip on its own line under the title read as a second
// heading). Re-cut 4 Sep (user call): the eyebrow says AD SETUP — what the chip IS, not
// what it does — and the chip alone; the who·when byline is gone, since the setup's own
// page carries its history.
// THE CHIP IS THE CHANGE DOOR, AND "OPEN ↗" STANDS BESIDE IT (8 Sep, user call — *"on
// the click of the ad setup name chip open the change ad setup modal, and rather than 3
// dots use a preview that opens in a new tab — a mature icon with a name, clean, and
// understood by a layman"*). The rare act was hidden behind a ⋯ while the chip did the
// common one backwards: clicking the NAME of the thing you want to swap opened a second
// tab. Now the chip swaps (a ⌄ says a picker is behind it) and reading the setup is its
// own labelled button — the same act every card in the picker carries. Nothing hides in
// a kebab; nothing is a glyph on its own. Nothing mapped still says so in words.
// THE WORD IS `Preview` (8 Sep, user call — *"the open cta is quite immature; make it
// preview and improve the weight"*): "Open" beside a chip that also opens something said
// nothing about which of the two took you elsewhere, and a bare ↗ at link weight read as
// a footnote. It is a button at the map card's own act weight now, wearing the same
// drawn icon, so one act looks the same in both rooms.
function adsCardHtml(meta) {
  const setup = sectionSetup(0);
  return `
    <div class="fieldset">
      ${FORM.errors.sections ? `<div class="banner bad" data-err-for="sections">${esc(FORM.errors.sections)}</div>` : ''}
      ${FORM.errors.drive ? `<div class="banner bad" data-err-for="drive">${esc(FORM.errors.drive)}</div>` : ''}
      ${FORM.errors.adSetupId ? `<div class="banner bad" data-err-for="adSetupId">${esc(FORM.errors.adSetupId)}</div>` : ''}
      <div class="fieldset-title-row">
        <div class="fieldset-title">Ad behaviour</div>
        <div class="ads-fills fills-strip">
          <span class="fs-l">Ad setup</span>
          ${setup
            ? `<button type="button" class="st-chip fs-setup" onclick="changeSetupJourney()">
                 <span class="fs-name">${esc(setup.name)}</span><i class="fs-arr">⌄</i></button>
               ${!KEY_ORIGINAL && FORM.data.copyAtCreate ? `<span class="podl">${FORM.data.copyName
                 ? `becomes “${esc(FORM.data.copyName)}” at create`
                 : `becomes this integration's own copy at create`}</span>` : ''}
               <button type="button" class="sc-act reads fs-open"
                 onclick="openSetupTab('${setup.id}')">Preview ${EXT_ICON}</button>`
            : `<span class="sg-empty">none yet — pick one below</span>`}
        </div>
      </div>
      ${setup ? `${breakTabsHtml()}${breakPanelHtml(keySlot())}` : setupPickCardsHtml()}
    </div>`;
}
