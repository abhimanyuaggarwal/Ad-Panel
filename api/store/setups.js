// store/setups.js — ad setups (the ops room's object): placements, per-slot ladders,
// pods, direct deals, the waterfall, CRUD, and the mock GAM unit directory. The
// behaviour / rung / walk machinery it builds on lives in ladders.js.
import { listKeys } from './keys.js';
import { askWord, driveAsk, groupWalks, liveRungs, normalizeRungs, normalizeSlotBehaviour, refuseDeadRules, slotGroupDefs, unreachableTail } from './ladders.js';
import { isPublished } from './publish.js';
import { AD_SOURCES, ADS_ACROSS_PODS_WARN, PODS_TOO_CLOSE_SEC, DIRECTORY_PROVIDERS, URL_PROVIDERS, HEADER_BIDDING, WF_WORD, MAX_MIDROLL_GROUPS, MAX_RUNGS, MAX_SECTIONS, PAUSE_MODES, PROPERTY_SCOPES, Refusal, SLOT_ALSO_TAKES, SLOT_FAMILY, SLOT_KIND, SLOT_TYPES, SLOT_WORD, deepCopy, state, updateStamp } from './state.js';
import { diff, fmtSecs, httpUrl, intIn, mustGet, oneOf, str, uniqueName } from './validate.js';

// ---------- ad setups (the ops room's object) ----------
// One whole surface's demand — now WITH its placements (25 Aug, user call): the setup
// carries SECTIONS, each a named placement with its own ladders. Ops define the shape;
// the integration attaching it gets those sections and overlays its own use (switches,
// mute, order, rules/player forks). Attachable to 1..N integrations, so two surfaces of
// one shape still share — and the one-act fix survives. A family MAY be empty: that is
// a fact, and the seam refuses to switch that slot on anywhere the setup is attached.

// ---------- THE WATERFALL (5 Sep, user call; one word 7 Sep) ----------
// ONE shared ladder, configured at the setup's head, that any pre/mid/post break —
// per placement, per pod — may FOLLOW instead of holding its own units. A LINK, never
// a copy: edit it once and every break following it moves together. Its levers ride
// with it: a DEPTH every follower walks at most (null = the whole ladder) and ONE
// content-pause answer stamped on every unit while its switch is on (null = each
// unit's own answer). Out-stream takes turns — a rotation has no waterfall to follow.

export function normalizeSharedWaterfall(input, errors) {
  const w = input || {};
  const errs = [];
  const rungs = normalizeRungs(w.rungs, 'video', errs, 'waterfall', 'Global waterfall', 'display', 'ladder', null);
  const depth = w.depth === undefined || w.depth === null || w.depth === ''
    ? null : intIn(w.depth, 'global waterfall depth', 1, MAX_RUNGS, errs);
  const pauseAll = w.pauseAll === undefined || w.pauseAll === null || w.pauseAll === ''
    ? null : oneOf(w.pauseAll, 'content pause', PAUSE_MODES, errs);
  for (const e of errs) {
    errors.push({ field: 'waterfall', message: e.message.startsWith('Global waterfall') ? e.message : `Global waterfall: ${e.message}` });
  }
  return { rungs, depth, pauseAll };
}

// What a linked break actually SERVES: the waterfall's live units, cut at the depth,
// each wearing the one pause answer while that switch is on. Materialized into the
// slot's rungs on every save, so the walks, the seam, the publish plane and the
// player's JSON all read the one truth they always read.
export function servedWaterfallRungs(wf) {
  const live = (wf?.rungs || []).filter(r => r.on !== false);
  const cut = wf?.depth ? live.slice(0, wf.depth) : live;
  return cut.map(r => ({ ...r, ...(wf.pauseAll ? { pause: wf.pauseAll } : {}) }));
}

// ---------- HEADER BIDDING (10 Sep, user call) ----------
// ONE answer at the setup's head — off, both libraries, or one of them — and every slot
// borrows it by default (`behaviour.headerBidding: 'auto'`). The shape is the waterfall's
// shape: a global thing at the head, consumed per break, dissented from per break. It is
// NOT a ladder, so it has no rungs, no order and no depth — which is why it is its own
// field rather than a lever on the waterfall.
//
// `auto` IS NOT A GLOBAL ANSWER. The global is the thing being borrowed; a global that
// borrows has nobody to borrow from, so it is refused by name rather than quietly read
// as `off`.
export function normalizeHeaderBidding(input, errors) {
  const v = input === undefined || input === null || input === '' ? 'off' : input;
  if (v === 'auto') {
    errors.push({ field: 'headerBidding', message: 'Auto is a slot\u2019s answer \u2014 it borrows this one, so this one has to name the partners (or Off)' });
    return 'off';
  }
  return oneOf(v, 'header bidding', HEADER_BIDDING, errors);
}

// WHAT A SLOT ACTUALLY RUNS: its own answer, or the setup's while it says `auto`. The one
// resolver — the live JSON, the counted UI facts and every warning read through it, so
// the number on screen is the number that serves (`suHbServed` mirrors it web-side).
export function servedHeaderBidding(slotAnswer, global) {
  const a = slotAnswer || 'auto';
  return a === 'auto' ? (global || 'off') : a;
}


// WHAT A UNIT ACTUALLY RUNS (11 Sep): its own answer, or its break's served answer while
// it says `auto` — and always `off` on a pasted URL, which makes no GAM request for
// bidders to decorate. The player's JSON reads every walk entry through this, so the
// client never joins the tiers itself (`suRungHbServedWord` mirrors it web-side).
export function servedUnitHeaderBidding(rung, tag, slotServed) {
  if (!tag || URL_PROVIDERS.includes(tag.provider)) return 'off';
  const a = rung.headerBidding || 'auto';
  return a === 'auto' ? (slotServed || 'off') : a;
}

// ---------- ONE BREAK, WHOLE ----------
// Everything a slot is made of, in the order it is decided: where its ads come from, its
// pods, its behaviour, its direct deal, and the tail it will never reach. Every step
// collects into `errors`/`warnings` instead of throwing, because a setup is refused ONCE
// with every problem named — see normalizeSetup.
//
// `ctx` is one placement's context, widened per slot: { setupName, secName, index, loc,
// where, waterfall, defaults, errors, warnings } plus { slotType, rungWhere }. It is a
// context object rather than ten arguments because the words a refusal uses are built
// from most of them, and threading them one by one is how they drift apart.

/** Where a rung-level refusal is standing: the setup, the placement, the break. */
function rungWhereOf(t, ctx) {
  return `${ctx.setupName || 'this setup'} · ${ctx.secName || `placement ${ctx.index + 1}`} ${SLOT_WORD[t].toLowerCase()}`;
}

/** The break's word for one of its pods, appended to a location: '' or ' pod 2'. */
function podTag(index, isMulti) {
  return isMulti ? ` pod ${index + 1}` : '';
}

function normalizeSlot(t, slotIn, sectionCtx) {
  const ctx = { ...sectionCtx, slotType: t, rungWhere: rungWhereOf(t, sectionCtx) };
  const { slot, rawPods } = t === 'midroll'
    ? readMidrollPods(slotIn, ctx)
    : { slot: readSingleBreak(slotIn, ctx), rawPods: null };
  attachDirectDeals(slot, slotIn, rawPods, ctx);
  warnUnreachableTail(slot, ctx);
  return slot;
}

// WHERE THE BREAK'S WATERFALL COMES FROM (5 Sep; three answers 8 Sep). The break's ladder
// is its PRIMARY — asked first, every time — and then a fall. The answer here decides the
// FALL only:
//   own   → the break's own fall (rungs 2…N)
//   setup → the global waterfall's served units, under this break's own primary
//   none  → no fall at all; the primary is the whole walk
//
// THE PRIMARY IS THE BREAK'S OWN IN EVERY ANSWER (8 Sep, user call — *"when switched to
// global why is primary ad unit being removed, it should stay"*). Following the global
// waterfall replaces what comes AFTER the first ask, never the first ask itself: that unit
// is this break's own headline demand, and a link to a shared ladder is not a reason to
// lose it. Before this, `setup` served the global ladder alone and `none` served nothing,
// which quietly deleted the primary from the walk on a switch nobody read as touching it.
//
// All three answers keep every own unit in `ownRungs` — switching back is one click and
// nothing is re-typed — so only what SERVES (`rungs`) differs, materialized here so every
// downstream read is the one it always was. And `none` is a real stored answer rather than
// "a fall with no rungs", because emptying a fall and switching it off are different acts
// with different ways back: the first has nothing to come back to, the second has
// everything.
function readAdSource(gIn, gWhere, ctx) {
  const { slotType: t, errors } = ctx;
  let source = gIn.waterfallSource == null ? 'own' : gIn.waterfallSource;
  if (!AD_SOURCES.includes(source)) {
    errors.push({ field: 'sections', message: `${gWhere}: “${gIn.waterfallSource}” is not an ad source — its own units (own), the ${WF_WORD} (setup), or nothing (none)` });
    source = 'own';
  }
  if (source !== 'own' && SLOT_KIND[t] !== 'ladder') {
    errors.push({ field: 'sections', message: `${ctx.where}the ${SLOT_WORD[t].toLowerCase()} takes turns — a rotation has no waterfall to follow or switch off` });
    source = 'own';
  }
  const own = normalizeRungs(source === 'own' ? gIn.rungs : (gIn.ownRungs ?? gIn.rungs),
    SLOT_FAMILY[t], errors, 'sections', gWhere, SLOT_ALSO_TAKES[t], SLOT_KIND[t], t);
  return { waterfallSource: source, ownRungs: own, rungs: servedRungs(source, own, gWhere, ctx) };
}

// What the break actually SERVES under each answer. The primary rides every one of them;
// a break that has none yet simply contributes nothing, and the global waterfall is then
// the whole walk.
function servedRungs(source, own, gWhere, ctx) {
  const primary = own.slice(0, 1);
  if (source === 'none') return primary;
  if (source !== 'setup') return own;
  const rungs = [...primary, ...servedWaterfallRungs(ctx.waterfall)];
  if (rungs.length <= MAX_RUNGS) return rungs;
  // A ladder holds MAX_RUNGS. Naming what fell off beats truncating in silence: the
  // primary is never the unit that goes.
  ctx.warnings.push(`${gWhere}: the primary plus the ${WF_WORD} is ${rungs.length} units — the last ${rungs.length - MAX_RUNGS} never run (a ladder holds ${MAX_RUNGS})`);
  return rungs.slice(0, MAX_RUNGS);
}

// A MID-ROLL IS BREAK GROUPS (31 Aug, AD-JSON-SCOPE): up to 3, each its own cadence and
// its own ladder. Group 1 IS the mid-roll — it doubles as the slot's own rungs/behaviour,
// so every single-group path reads exactly what it always read.
function readMidrollPods(slotIn, ctx) {
  const { slotType: t, errors, warnings, defaults, loc } = ctx;
  const rawPods = podsAsSent(slotIn);
  if (rawPods.length > MAX_MIDROLL_GROUPS) {
    errors.push({ field: 'sections', message: `${ctx.where}a mid-roll holds at most ${MAX_MIDROLL_GROUPS} break groups (got ${rawPods.length})` });
  }
  const isMulti = rawPods.length > 1;
  const groups = rawPods.slice(0, MAX_MIDROLL_GROUPS).map((g, gi) => ({
    ...readAdSource(g, `${ctx.rungWhere}${podTag(gi, isMulti)}`, ctx),
    behaviour: normalizeSlotBehaviour(t,
      g.behaviour || (defaults ? defaults.slots[t].behaviour : null),
      errors, warnings, `${loc} ${SLOT_WORD[t].toLowerCase()}${podTag(gi, isMulti)}: `),
  }));
  const first = groups[0];
  return {
    slot: { rungs: first.rungs, ownRungs: first.ownRungs, waterfallSource: first.waterfallSource, behaviour: first.behaviour, groups },
    rawPods,
  };
}

// The pods AS SENT. A top-level rungs/behaviour patch lands on pod 1; a groups patch is
// authoritative. Kept raw because each pod's own deal is read back off it below.
function podsAsSent(slotIn) {
  if (!(Array.isArray(slotIn.groups) && slotIn.groups.length)) {
    return [{ rungs: slotIn.rungs, behaviour: slotIn.behaviour, waterfallSource: slotIn.waterfallSource, ownRungs: slotIn.ownRungs }];
  }
  const pods = slotIn.groups.slice();
  if (slotIn.rungs && slotIn.rungs !== pods[0].rungs) pods[0] = { ...pods[0], rungs: slotIn.rungs };
  if (slotIn.behaviour && slotIn.behaviour !== pods[0].behaviour) pods[0] = { ...pods[0], behaviour: slotIn.behaviour };
  return pods;
}

/** A pre-roll, post-roll or out-stream: one break, no pods. */
function readSingleBreak(slotIn, ctx) {
  const { slotType: t, errors, warnings, defaults, loc } = ctx;
  if (Array.isArray(slotIn.groups) && slotIn.groups.length > 1) {
    errors.push({ field: 'sections', message: `${ctx.where}only a mid-roll holds break groups — a ${SLOT_WORD[t].toLowerCase()} is one break` });
  }
  return {
    ...readAdSource(slotIn, ctx.rungWhere, ctx),
    behaviour: normalizeSlotBehaviour(t,
      slotIn.behaviour || (defaults ? defaults.slots[t].behaviour : null),
      errors, warnings, `${loc} ${SLOT_WORD[t].toLowerCase()}: `),
  };
}

// THE DIRECT TIER, PER POD (3 Sep, user call — it was the mid-roll's, shared by every
// break group). ONE sold deal, tried before that pod's primary: a pod is a break with its
// own cadence and its own ladder, so the deal sold against it is its own too. Group 1's
// doubles as the slot's, so every single-pod path and every fixture written before this
// reads exactly as it did. A rotation is not a break.
function attachDirectDeals(slot, slotIn, rawPods, ctx) {
  const { slotType: t, errors } = ctx;
  if (SLOT_KIND[t] !== 'ladder') {
    if (slotIn.direct && (slotIn.direct.rungs || []).length) {
      errors.push({ field: 'sections', message: `${ctx.where}the ${SLOT_WORD[t].toLowerCase()} takes turns — direct is break demand, and this is not a break` });
    }
    return;
  }
  if (t !== 'midroll') {
    slot.direct = readDirectDeal(slotIn.direct, '', ctx);
    return;
  }
  const pods = slot.groups;
  const isMulti = pods.length > 1;
  pods.forEach((g, gi) => {
    // A pod states its own deal; a fixture that only stated the mid-roll's gives it to
    // pod 1, which is where it always fired first.
    const dIn = (rawPods && rawPods[gi] && rawPods[gi].direct) || (gi === 0 ? slotIn.direct : null);
    g.direct = readDirectDeal(dIn, podTag(gi, isMulti), ctx);
  });
  slot.direct = pods[0].direct;
}

/** One pod's sold deal: exactly one rung, refused by name if it is sent as a ladder. */
function readDirectDeal(dIn, gTag, ctx) {
  const { slotType: t, errors, loc } = ctx;
  const d = dIn || {};
  if (d.maxSession !== undefined) {
    errors.push({ field: 'sections', message: `${loc} ${SLOT_WORD[t].toLowerCase()}${gTag}: direct has no session cap any more — the deal is tried each time the break fires` });
  }
  const dRungs = normalizeRungs(d.rungs, 'video', errors, 'sections',
    `${ctx.rungWhere}${gTag} direct`, 'display', 'ladder', t);
  if (dRungs.length > 1) {
    errors.push({ field: 'sections', message: `${loc} ${SLOT_WORD[t].toLowerCase()}${gTag} carries ONE direct deal — the tier is the deal, not a ladder (got ${dRungs.length})` });
  }
  return { rungs: dRungs.slice(0, 1) };
}

// THE UNREACHABLE TAIL, counted (31 Aug), per pod: tries × per-try wait against the
// break's own giving-up point. A lever, never a wall.
function warnUnreachableTail(slot, ctx) {
  const { slotType: t, warnings, loc } = ctx;
  if (SLOT_KIND[t] !== 'ladder') return;
  const isMulti = !!(slot.groups && slot.groups.length > 1);
  for (const [gi, g] of slotGroupDefs(slot).entries()) {
    const unreachable = unreachableTail(g.rungs, g.behaviour);
    if (!unreachable) continue;
    warnings.push(`${loc} ${SLOT_WORD[t].toLowerCase()}${podTag(gi, isMulti)}: last ${unreachable} sources never run`);
  }
}

// ---------- WHEN PODS ADD UP ----------
// A mid-roll's pods are each sane on their own and can still be punishing together, so
// both of these are counted ACROSS the pods rather than inside one. Levers, never walls:
// they warn and the save goes through.

// The two crowding warnings for one placement's mid-roll, in the order they are said.
function podCrowdingWarnings(groups, where) {
  if (!groups || groups.length < 2) return [];
  return [...totalAdsWarning(groups, where), ...podsTooCloseWarning(groups, where)];
}

// Every pod's breaks × its ads. Only counted when every pod says WHERE its breaks fall —
// a pod running on an interval has no break count to add, so the total would be a guess.
function totalAdsWarning(groups, where) {
  const perPod = groups.map(g => ({
    breaks: g.behaviour.mode === 'cuepoints' ? g.behaviour.cuepoints.length : null,
    ads: g.behaviour.podAds,
  }));
  if (!perPod.every(p => p.breaks != null)) return [];
  const totalAds = perPod.reduce((sum, p) => sum + p.breaks * p.ads, 0);
  return totalAds >= ADS_ACROSS_PODS_WARN ? [`${where}${totalAds} ads across pods — a lot`] : [];
}

// Any two pods landing a break within a minute of each other, said once however many
// pairs are close.
function podsTooCloseWarning(groups, where) {
  const cued = groups.map(g => g.behaviour).filter(b => b.mode === 'cuepoints');
  const anyClose = cued.some((pod, i) => cued.slice(i + 1)
    .some(later => anyBreakWithin(pod.cuepoints, later.cuepoints, PODS_TOO_CLOSE_SEC)));
  return anyClose ? [`${where}pod breaks under a minute apart`] : [];
}

// Do any two of these break positions fall within `seconds` of each other?
function anyBreakWithin(some, others, seconds) {
  return some.some(a => others.some(b => Math.abs(a - b) < seconds));
}

export function normalizeSetup(input, exceptId) {
  const errors = [];
  const name = str(input.name);
  if (!name) errors.push({ field: 'name', message: 'Name is required' });
  else if (!uniqueName(state.setups, name, exceptId)) {
    errors.push({ field: 'name', message: `An ad setup named “${name}” already exists` });
  }
  const property = oneOf(input.property ?? 'All', 'property', PROPERTY_SCOPES, errors);
  const waterfall = normalizeSharedWaterfall(input.waterfall, errors);
  const headerBidding = normalizeHeaderBidding(input.headerBidding, errors);

  // Back-compat input: a bare `slots` object reads as the Default placement.
  const rawSections = Array.isArray(input.sections) && input.sections.length
    ? input.sections
    : [{ name: 'Default', slots: input.slots || {} }];
  if (rawSections.length > MAX_SECTIONS) {
    errors.push({ field: 'sections', message: `At most ${MAX_SECTIONS} placements per setup (got ${rawSections.length})` });
  }
  const seen = new Set();
  const warnings = [];
  let defaults = null; // Default's normalized behaviour — every later placement clones it
  const sections = rawSections.slice(0, MAX_SECTIONS).map((sec, i) => {
    const secName = i === 0 ? 'Default' : str(sec.name);
    if (i > 0 && !secName) errors.push({ field: 'sections', message: `Placement ${i + 1} needs a name` });
    else if (seen.has(secName.toLowerCase())) errors.push({ field: 'sections', message: `Two placements are both named “${secName}”` });
    seen.add(secName.toLowerCase());
    const loc = secName || `placement ${i + 1}`;
    const where = `${loc}: `;

    // EVERY PLACEMENT CARRIES ITS OWN BEHAVIOUR (25 Aug, user call), and a new one is a
    // CLONE of Default rather than a blank — the values are already sane, and changing
    // one is then an edit, not a fill-in-fifteen-fields chore. Cloning happens here so
    // it holds for any caller, and a partial patch never resets what it did not mention.
    // A placement has NO session-wide settings of its own since 27 Aug — only its slots.
    refuseDeadRules(sec.rules, errors, where);

    if (sec.slots?.squeezeback && ((sec.slots.squeezeback.rungs || []).length || sec.slots.squeezeback.behaviour)) {
      errors.push({ field: 'sections', message: `${where}the squeeze-back slot is gone — a banner over playing content is a rung of the break\u2019s waterfall, and the idle player\u2019s rotation is Out-stream` });
    }
    const slots = {};
    const slotCtx = { setupName: name, secName, index: i, loc, where, waterfall, defaults, errors, warnings };
    for (const t of SLOT_TYPES) slots[t] = normalizeSlot(t, sec.slots?.[t] || {}, slotCtx);
    // Cross-pod arithmetic, counted from the pods on screen.
    warnings.push(...podCrowdingWarnings(slots.midroll.groups, where));
    const out = { name: secName, isDefault: i === 0, slots };
    if (i === 0) defaults = out;
    return out;
  });

  // THE GLOBAL DIRECT IS GONE (1 Sep evening, user call — reversing the morning's
  // global tier): direct lives on each break now. A payload still carrying the old
  // top-level list is refused by name.
  if (input.direct && ((input.direct.rungs || []).length || input.direct.maxSession !== undefined)) {
    errors.push({ field: 'direct', message: 'Direct lives on each break now — arrange it inside the pre-roll, mid-roll or post-roll' });
  }

  if (errors.length) throw new Refusal(400, 'invalid_setup', 'Ad setup was refused', { errors });
  return { name, property, waterfall, headerBidding, sections, warnings };
}

// A slot's direct tier: the live rungs the player would try before the primary.
export function directWalkOf(slotDef) {
  return liveRungs(slotDef?.direct?.rungs);
}

export function setupSection(setup, secName) {
  return setup ? (setup.sections || []).find(x => x.name === secName) || null : null;
}

export function createSetup(input) {
  const { warnings, ...s } = normalizeSetup(input);
  const id = `as_${++state.counters.setup}`;
  const obj = { id, ...s, ...updateStamp() };
  state.setups.set(id, obj);
  obj.__warnings = warnings; // read once by the route, never persisted in a view
  return obj;
}

// ---------- MERGING A SLOT PATCH ----------
// One slot patch, merged against what stands, so a PATCH is never a replace: sending only
// the mid-roll ladder must not wipe its behaviour, and vice versa. Pure — it reads the
// previous slot and the patch and returns the candidate, with no state and no refusals;
// normalizeSetup is what then validates the result.

function mergeSlotPatch(prevSlot, patch) {
  const merged = Array.isArray(patch.groups)
    ? { groups: mergePods(patch.groups, prevSlot) }
    : mergeSingleBreak(prevSlot, patch);
  // The slot's direct tier merges on its own — sending only the cap wipes nothing.
  const direct = patch.direct ? { ...(prevSlot?.direct || {}), ...patch.direct } : prevSlot?.direct;
  return direct ? { ...merged, direct } : merged;
}

// A groups patch is authoritative for the pod LIST, but each pod merges against its
// same-index predecessor, and a brand-new pod starts from pod 1 — a clone, never a blank.
function mergePods(patchPods, prevSlot) {
  const before = slotGroupDefs(prevSlot || { rungs: [], behaviour: null });
  const blank = { rungs: [], behaviour: null };
  return patchPods.map((g, gi) => mergePod(g, before[gi] || before[0] || blank));
}

function mergePod(patch, before) {
  return {
    // Unlinking without naming units means "back to what stood" — the kept own units,
    // exactly (the whole point of keeping them).
    rungs: patch.rungs || (patch.waterfallSource === 'own' && before.ownRungs ? before.ownRungs : before.rungs),
    // The indirect source and the kept own units merge like the ladder does — a patch that
    // never mentions them moves nothing.
    ownRungs: patch.ownRungs || before.ownRungs,
    waterfallSource: patch.waterfallSource !== undefined ? patch.waterfallSource : before.waterfallSource,
    behaviour: patch.behaviour ? { ...(before.behaviour || {}), ...patch.behaviour } : before.behaviour,
    // A pod's deal merges on its own, like the slot's used to.
    ...(patch.direct || before.direct
      ? { direct: patch.direct ? { ...(before.direct || {}), ...patch.direct } : before.direct }
      : {}),
  };
}

function mergeSingleBreak(prevSlot, patch) {
  const out = { ...(prevSlot || {}), ...patch };
  // A slot patch that touches only the ladder keeps its behaviour, and vice versa.
  if (patch.behaviour) out.behaviour = { ...(prevSlot?.behaviour || {}), ...patch.behaviour };
  // Unlinking without naming units means "back to what stood": the kept own units, exactly
  // — the whole point of keeping them. (`none` needs no such rule: nothing serves it, and
  // normalizeSetup computes that from the source alone.)
  if (patch.waterfallSource === 'own' && !patch.rungs && prevSlot?.ownRungs) out.rungs = prevSlot.ownRungs;
  return out;
}

// ---------- THE SEAM, OPS SIDE ----------
// The mirror of the product-side seam in store/keys.js: an ops edit may not darken a
// break some LIVE surface is already playing. Refuses by name on the first one it finds;
// a drive decision the new demand strands falls back instead, warned. `ctx` carries
// { candidate, placementNames, renames, driftWarnings }.

/** One live surface's overlay of one placement, read against the candidate setup. */
function checkLiveOverlay(key, overlay, ctx) {
  const effName = ctx.renames.find(([old]) => old === overlay.name)?.[1] || overlay.name;
  const onSlots = SLOT_TYPES.filter(t => overlay.slots[t].on);
  if (!onSlots.length) return;
  if (!ctx.placementNames.has(effName)) {
    throw new Refusal(409, 'setup_in_use',
      `“${overlay.name}” still runs live on ${key.name} — switch it off there before removing the placement`,
      { usedBy: [`${key.name} · ${overlay.name}`] });
  }
  const secDef = ctx.candidate.sections.find(x => x.name === effName);
  for (const t of onSlots) checkLiveBreak(key, overlay, secDef, t, ctx);
}

// One live break. Every break group answers for itself: one dark group is one dark break.
function checkLiveBreak(key, overlay, secDef, t, ctx) {
  const walks = groupWalks(secDef, key.drive?.[t], t);
  const darkPod = walks.findIndex(r => r.walk.length === 0);
  if (darkPod >= 0) {
    // Said in the UI's words (7 Sep, UAT P1): the pod, the placement, who plays it.
    throw new Refusal(409, 'setup_in_use',
      walks.length > 1
        ? `Pod ${darkPod + 1} in “${overlay.name}” is empty — ${key.name} plays its ${SLOT_WORD[t].toLowerCase()} live, so every pod needs an ad unit`
        : `“${overlay.name}” ${SLOT_WORD[t].toLowerCase()} would go dark — ${key.name} plays it live; add an ad unit, or switch it off there first`,
      { usedBy: [`${key.name} · ${overlay.name}`] });
  }
  if (!walks.some(r => r.fellBack || r.vacuous)) return;
  const provs = askWord(driveAsk(key.drive?.[t]?.ask) || []);
  ctx.driftWarnings.push(`${key.name} ${SLOT_WORD[t].toLowerCase()}: asks ${provs} — falls back`);
}

// The seam, ops side: an edit that would empty a family some LIVE integration has
// switched ON is refused with the integrations named — no product page ever goes dark
// because of an edit its owner never saw. Edits that pass apply immediately, warned
// with the counted blast radius.
export function updateSetup(id, input) {
  const existing = mustGet(state.setups, id, 'ad setup');
  // A sections patch is authoritative when provided (add/rename/remove placements);
  // each provided placement merges per family against its SAME-INDEX predecessor, so
  // sending only the mid-roll ladder never silently wipes the other three.
  // One slot patch, merged against what stands — a groups patch is authoritative for
  // the group list, but each group merges against its same-index predecessor, and a
  // brand-new group starts from group 1 (a clone, never a blank form).
  let mergedSections = existing.sections;
  if (Array.isArray(input.sections)) {
    mergedSections = input.sections.map((sec, i) => {
      const prev = existing.sections[i] || { slots: {} };
      const slots = { ...prev.slots };
      for (const [t, patch] of Object.entries(sec.slots || {})) {
        slots[t] = mergeSlotPatch(prev.slots?.[t], patch);
      }
      return { ...prev, ...sec, slots };
    });
  } else if (input.slots) {
    // Back-compat shape: a bare `slots` object patches the DEFAULT placement. Merge per
    // slot so sending only a ladder never wipes that slot's behaviour, or vice versa.
    mergedSections = existing.sections.map((sec, i) => {
      if (i !== 0) return sec;
      const slots = { ...sec.slots };
      for (const [t, patch] of Object.entries(input.slots)) {
        slots[t] = mergeSlotPatch(sec.slots?.[t], patch);
      }
      return { ...sec, slots };
    });
  }
  // The waterfall merges like a slot does: a patch that only moves the depth
  // keeps the ladder; `waterfall: null` is the explicit way to clear it whole.
  const mergedWaterfall = input.waterfall === undefined
    ? existing.waterfall
    : (input.waterfall ? { ...(existing.waterfall || {}), ...input.waterfall } : { rungs: [] });
  const { warnings: ruleWarnings, ...s } = normalizeSetup({ ...existing, ...input, sections: mergedSections, waterfall: mergedWaterfall }, id);

  // A rename (same index, new name) carries the attached integrations' overlays with
  // it — ops renaming a placement must never orphan product's switches and forks.
  // Only when the count is unchanged: with a removal in the list, index-matching would
  // read the shift as a mass rename and collide overlays.
  const renames = [];
  if (s.sections.length === existing.sections.length) {
    existing.sections.forEach((old, i) => {
      const now = s.sections[i];
      if (now && old.name !== now.name) renames.push([old.name, now.name]);
    });
  }

  // Per PLACEMENT, per surface: each attached live integration's own walk is checked
  // against the candidate — including placements that would vanish under it. A walk
  // that would go DARK refuses; a drive decision the new demand strands FALLS BACK to
  // the arrangement itself, warned by name (26 Aug, DRIVING-SCOPE) — the moment of
  // harm is this save, so this save is where it says so.
  const newNames = new Set(s.sections.map(x => x.name));
  const driftWarnings = [];
  const seamCtx = { candidate: s, placementNames: newNames, renames, driftWarnings };
  for (const k of keysUsingSetup(id)) {
    if (!isPublished(k.id)) continue;
    for (const ov of k.sections) checkLiveOverlay(k, ov, seamCtx);
  }

  for (const [oldName, newName] of renames) {
    for (const k of keysUsingSetup(id)) {
      for (const ov of k.sections) if (ov.name === oldName) ov.name = newName;
    }
  }

  const changes = diff(existing, s);
  Object.assign(existing, s, { ...updateStamp() });
  const warnings = [...ruleWarnings, ...driftWarnings];
  return { obj: existing, changes, warnings };
}

// "Attach a copy" needs a copy (26 Aug, DRIVING-SCOPE): the 1:1 promise means a setup
// another integration holds is never re-attached — it is photocopied. Sections, ladders
// and behaviour come whole; the name is the caller's or a counted "<name> copy".
export function duplicateSetup(id, wantName) {
  const src = mustGet(state.setups, id, 'ad setup');
  let name = str(wantName) || `${src.name} copy`;
  let n = 2;
  while (!uniqueName(state.setups, name)) name = `${str(wantName) || `${src.name} copy`} ${n++}`;
  return createSetup({ ...deepCopy(src), name });
}

// One placement's behaviour, edited with FIELD-LEVEL diffs — so a version's changes keep
// reading "Break positions 4:00 → 6:00", not "ad setup updated". Behaviour can never
// darken a slot (no rungs move), so there is no seam to run here at all — the counted
// blast radius belongs to Publish, which is where traffic actually moves.
export function updateSetupBehaviour(id, index, input) {
  const setup = mustGet(state.setups, id, 'ad setup');
  const sec = setup.sections[index];
  if (!sec) throw new Refusal(404, 'not_found', `No placement ${index} in ${setup.name}`);
  const errors = [];
  const warnings = [];
  const changes = [];

  if (input.rules && typeof input.rules === 'object') {
    refuseDeadRules(input.rules, errors);
    if (!errors.length) errors.push({ field: 'rules', message: 'A placement has no session-wide settings — every answer lives on a slot' });
    throw new Refusal(400, 'invalid_rules', 'Ad rules were refused', { errors });
  }
  if (input.slot !== undefined) {
    const t = oneOf(input.slot, 'slot', SLOT_TYPES, errors);
    if (errors.length) throw new Refusal(400, 'invalid_rules', 'Ad behaviour was refused', { errors });
    // A mid-roll edit may name its break group; group 1 doubles as the slot's own
    // behaviour, so both references move together.
    const gi = input.group ? Number(input.group) : 0;
    const groups = sec.slots[t].groups;
    if (gi > 0 && (!groups || !groups[gi])) {
      throw new Refusal(404, 'not_found', `No break group ${gi + 1} on the ${SLOT_WORD[t] || t}`);
    }
    const target = gi > 0 ? groups[gi] : sec.slots[t];
    const cur = target.behaviour;
    const next = normalizeSlotBehaviour(t, { ...cur, ...(input.behaviour || {}) }, errors, warnings, '');
    if (errors.length) throw new Refusal(400, 'invalid_rules', 'Ad behaviour was refused', { errors });
    changes.push(...diff(cur, next));
    target.behaviour = next;
    if (gi === 0 && groups) groups[0].behaviour = next;
    if (gi === 0 && t === 'midroll' && groups) sec.slots[t].behaviour = next;
    // THE UNREACHABLE TAIL, counted here too — this door edits the numbers it counts.
    if (SLOT_KIND[t] === 'ladder') {
      const rungs = gi > 0 ? groups[gi].rungs : sec.slots[t].rungs;
      const unreachable = unreachableTail(rungs, next);
      if (unreachable) warnings.push(`last ${unreachable} sources never run`);
    }
  }

  if (changes.length) {
    Object.assign(setup, { ...updateStamp() });
  }
  return { obj: setup, section: sec, changes, warnings };
}

export function deleteSetup(id) {
  const obj = mustGet(state.setups, id, 'ad setup');
  const used = keysUsingSetup(id);
  if (used.length) {
    throw new Refusal(409, 'setup_in_use',
      `“${obj.name}” fills ${used.map(k => `“${k.name}”`).join(', ')} and cannot be deleted`,
      { usedBy: used.map(k => k.name) });
  }
  state.setups.delete(id);
  state.versions.delete(id);
  state.live.delete(id);
  return obj;
}

export function getSetup(id) { return mustGet(state.setups, id, 'ad setup'); }
export function listSetups() { return [...state.setups.values()]; }

export function keysUsingSetup(id) {
  return listKeys().filter(k => k.adSetupId === id);
}

// Counted per placement and slot: across attached integrations, how many run each unit.
export function setupLiveCounts(id) {
  const setup = state.setups.get(id);
  const counts = {};
  if (!setup) return counts;
  for (const sec of setup.sections) {
    counts[sec.name] = {};
    for (const t of SLOT_TYPES) counts[sec.name][t] = { on: 0, total: 0 };
  }
  for (const k of keysUsingSetup(id)) {
    for (const sec of setup.sections) {
      const ov = k.sections.find(x => x.name === sec.name);
      for (const t of SLOT_TYPES) {
        counts[sec.name][t].total++;
        if (ov && ov.slots[t].on) counts[sec.name][t].on++;
      }
    }
  }
  return counts;
}

// ---------- GAM ad unit directory (mock-synced) ----------

export function setGamUnits(units, pending) {
  state.gamUnits = [...units];
  state.gamPending = [...pending];
  state.gamLastSync = new Date().toISOString();
}

export function gamUnits(q) {
  const needle = str(q).toLowerCase();
  const all = state.gamUnits;
  return {
    units: needle ? all.filter(u => u.toLowerCase().includes(needle)).slice(0, 8) : all.slice(0, 8),
    lastSync: state.gamLastSync,
  };
}

export function gamSync() {
  const added = state.gamPending.splice(0, state.gamPending.length);
  state.gamUnits.push(...added);
  state.gamLastSync = new Date().toISOString();
  return { added, lastSync: state.gamLastSync };
}

export function gamHasUnit(path) {
  return state.gamUnits.includes(path);
}

// SLOT_WORD moved to store/state.js (7 Sep) — one vocabulary module owns the words.

// A tag typed in by hand before GAM caught up. DERIVED, never stored — the next sync
// that pulls the unit in clears the mark on its own, with nothing to remember.
export function tagOffDirectory(t) {
  return !!t && DIRECTORY_PROVIDERS.includes(t.provider) && !httpUrl(t.value) && !gamHasUnit(t.value);
}
