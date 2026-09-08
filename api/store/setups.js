// store/setups.js — ad setups (the ops room's object): placements, per-slot ladders,
// pods, direct deals, the waterfall, CRUD, and the mock GAM unit directory. The
// behaviour / rung / walk machinery it builds on lives in ladders.js.
import { listKeys } from './keys.js';
import { askWord, driveAsk, groupWalks, liveRungs, localWalk, normalizeRungs, normalizeSlotBehaviour, refuseDeadRules, slotGroupDefs } from './ladders.js';
import { isPublished } from './publish.js';
import { DIRECTORY_PROVIDERS, MAX_MIDROLL_GROUPS, MAX_RUNGS, MAX_SECTIONS, PAUSE_MODES, PROPERTY_SCOPES, Refusal, SLOT_ALSO_TAKES, SLOT_FAMILY, SLOT_KIND, SLOT_TYPES, SLOT_WORD, state } from './state.js';
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
  const rungs = normalizeRungs(w.rungs, 'video', errs, 'waterfall', 'Waterfall', 'display', 'ladder', null);
  const depth = w.depth === undefined || w.depth === null || w.depth === ''
    ? null : intIn(w.depth, 'waterfall depth', 1, MAX_RUNGS, errs);
  const pauseAll = w.pauseAll === undefined || w.pauseAll === null || w.pauseAll === ''
    ? null : oneOf(w.pauseAll, 'content pause', PAUSE_MODES, errs);
  for (const e of errs) {
    errors.push({ field: 'waterfall', message: e.message.startsWith('Waterfall') ? e.message : `Waterfall: ${e.message}` });
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

export function normalizeSetup(input, exceptId) {
  const errors = [];
  const name = str(input.name);
  if (!name) errors.push({ field: 'name', message: 'Name is required' });
  else if (!uniqueName(state.setups, name, exceptId)) {
    errors.push({ field: 'name', message: `An ad setup named “${name}” already exists` });
  }
  const property = oneOf(input.property ?? 'All', 'property', PROPERTY_SCOPES, errors);
  const waterfall = normalizeSharedWaterfall(input.waterfall, errors);

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
    for (const t of SLOT_TYPES) {
      const rungWhere = `${name || 'this setup'} · ${secName || `placement ${i + 1}`} ${SLOT_WORD[t].toLowerCase()}`;
      const slotIn = sec.slots?.[t] || {};
      let gsInRaw = null; // the mid-roll's groups AS SENT — each pod's own deal is read from it below
      // A MID-ROLL IS BREAK GROUPS (31 Aug, AD-JSON-SCOPE): up to 3, each its own
      // cadence and its own ladder. Group 1 IS the mid-roll — it doubles as the slot's
      // own rungs/behaviour, so every single-group path reads exactly what it always
      // read. A top-level rungs/behaviour patch lands on group 1; a groups patch is
      // authoritative.
      // THE INDIRECT SOURCE (5 Sep): a break either OWNS its units or FOLLOWS the
      // waterfall. Following keeps the break's own units (`ownRungs` — off keeps
      // its tags: switching back is one click and nothing is re-typed) and serves the
      // waterfall's, materialized here so every downstream read is the one it always was.
      const readIndirect = (gIn, gWhere) => {
        let source = gIn.waterfallSource == null || gIn.waterfallSource === 'own' ? 'own' : gIn.waterfallSource;
        if (source !== 'own' && source !== 'setup') {
          errors.push({ field: 'sections', message: `${gWhere}: “${gIn.waterfallSource}” is not an ad source — its own units (own), or the waterfall (setup)` });
          source = 'own';
        }
        if (source === 'setup' && SLOT_KIND[t] !== 'ladder') {
          errors.push({ field: 'sections', message: `${where}the ${SLOT_WORD[t].toLowerCase()} takes turns — a rotation has no waterfall to follow` });
          source = 'own';
        }
        const own = normalizeRungs(source === 'setup' ? (gIn.ownRungs ?? gIn.rungs) : gIn.rungs,
          SLOT_FAMILY[t], errors, 'sections', gWhere, SLOT_ALSO_TAKES[t], SLOT_KIND[t], t);
        return { waterfallSource: source, ownRungs: own, rungs: source === 'setup' ? servedWaterfallRungs(waterfall) : own };
      };
      if (t === 'midroll') {
        let gsIn = Array.isArray(slotIn.groups) && slotIn.groups.length ? slotIn.groups.slice() : null;
        if (gsIn) {
          if (slotIn.rungs && slotIn.rungs !== gsIn[0].rungs) gsIn[0] = { ...gsIn[0], rungs: slotIn.rungs };
          if (slotIn.behaviour && slotIn.behaviour !== gsIn[0].behaviour) gsIn[0] = { ...gsIn[0], behaviour: slotIn.behaviour };
        } else {
          gsIn = [{ rungs: slotIn.rungs, behaviour: slotIn.behaviour, waterfallSource: slotIn.waterfallSource, ownRungs: slotIn.ownRungs }];
        }
        gsInRaw = gsIn;
        if (gsIn.length > MAX_MIDROLL_GROUPS) {
          errors.push({ field: 'sections', message: `${where}a mid-roll holds at most ${MAX_MIDROLL_GROUPS} break groups (got ${gsIn.length})` });
        }
        const multi = gsIn.length > 1;
        const groups = gsIn.slice(0, MAX_MIDROLL_GROUPS).map((g, gi) => ({
          ...readIndirect(g, `${rungWhere}${multi ? ` pod ${gi + 1}` : ''}`),
          behaviour: normalizeSlotBehaviour(t,
            g.behaviour || (defaults ? defaults.slots[t].behaviour : null),
            errors, warnings, `${loc} ${SLOT_WORD[t].toLowerCase()}${multi ? ` pod ${gi + 1}` : ''}: `),
        }));
        slots[t] = { rungs: groups[0].rungs, ownRungs: groups[0].ownRungs, waterfallSource: groups[0].waterfallSource, behaviour: groups[0].behaviour, groups };
      } else {
        if (Array.isArray(slotIn.groups) && slotIn.groups.length > 1) {
          errors.push({ field: 'sections', message: `${where}only a mid-roll holds break groups — a ${SLOT_WORD[t].toLowerCase()} is one break` });
        }
        slots[t] = {
          ...readIndirect(slotIn, rungWhere),
          behaviour: normalizeSlotBehaviour(t,
            slotIn.behaviour || (defaults ? defaults.slots[t].behaviour : null),
            errors, warnings, `${loc} ${SLOT_WORD[t].toLowerCase()}: `),
        };
      }
      // THE DIRECT TIER, PER POD (3 Sep, user call — it was the mid-roll's, shared by
      // every break group). ONE sold deal, tried before that pod's primary: a pod is a
      // break with its own cadence and its own ladder, so the deal sold against it is
      // its own too. Group 1's doubles as the slot's, so every single-pod path and every
      // fixture written before this reads exactly as it did. A rotation is not a break.
      if (SLOT_KIND[t] === 'ladder') {
        const one = (dIn, gTag) => {
          const d = dIn || {};
          if (d.maxSession !== undefined) {
            errors.push({ field: 'sections', message: `${loc} ${SLOT_WORD[t].toLowerCase()}${gTag}: direct has no session cap any more — the deal is tried each time the break fires` });
          }
          const dRungs = normalizeRungs(d.rungs, 'video', errors, 'sections',
            `${rungWhere}${gTag} direct`, 'display', 'ladder', t);
          if (dRungs.length > 1) {
            errors.push({ field: 'sections', message: `${loc} ${SLOT_WORD[t].toLowerCase()}${gTag} carries ONE direct deal — the tier is the deal, not a ladder (got ${dRungs.length})` });
          }
          return { rungs: dRungs.slice(0, 1) };
        };
        if (t === 'midroll') {
          const gs = slots[t].groups;
          const multiG = gs.length > 1;
          gs.forEach((g, gi) => {
            // A pod states its own deal; a fixture that only stated the mid-roll's gives
            // it to pod 1, which is where it always fired first.
            const dIn = (gsInRaw && gsInRaw[gi] && gsInRaw[gi].direct) || (gi === 0 ? slotIn.direct : null);
            g.direct = one(dIn, multiG ? ` pod ${gi + 1}` : '');
          });
          slots[t].direct = gs[0].direct;
        } else {
          slots[t].direct = one(slotIn.direct, '');
        }
      } else if (slotIn.direct && (slotIn.direct.rungs || []).length) {
        errors.push({ field: 'sections', message: `${where}the ${SLOT_WORD[t].toLowerCase()} takes turns — direct is break demand, and this is not a break` });
      }
      // THE UNREACHABLE TAIL, counted (31 Aug): tries × per-try wait against the
      // break's own giving-up point. A lever, never a wall.
      for (const [gi, g] of slotGroupDefs(slots[t]).entries()) {
        const b = g.behaviour;
        if (!b || SLOT_KIND[t] !== 'ladder') continue;
        const n = localWalk(g.rungs).length;
        const reachable = Math.max(1, Math.floor((b.fillTimeoutSec * 1000) / b.tagTimeoutMs));
        if (n > 1 && reachable < n) {
          const gTag = (slots[t].groups && slots[t].groups.length > 1) ? ` pod ${gi + 1}` : '';
          warnings.push(`${loc} ${SLOT_WORD[t].toLowerCase()}${gTag}: last ${n - reachable} sources never run`);
        }
      }
    }
    // Cross-group arithmetic, counted from the groups on screen.
    const mgs = slots.midroll.groups;
    if (mgs && mgs.length > 1) {
      const breaksOf = b => (b.mode === 'cuepoints' ? b.cuepoints.length : null);
      const perGroup = mgs.map(g => ({ breaks: breaksOf(g.behaviour), ads: g.behaviour.podAds }));
      if (perGroup.every(x => x.breaks != null)) {
        const totalAds = perGroup.reduce((a, x) => a + x.breaks * x.ads, 0);
        if (totalAds >= 6) {
          warnings.push(`${where}${totalAds} ads across pods — a lot`);
        }
      }
      // Two groups landing breaks within a minute of each other feel relentless.
      const cued = mgs.map(g => g.behaviour).filter(b => b.mode === 'cuepoints');
      outer: for (let a = 0; a < cued.length; a++) {
        for (let bI = a + 1; bI < cued.length; bI++) {
          for (const ca of cued[a].cuepoints) for (const cb of cued[bI].cuepoints) {
            if (Math.abs(ca - cb) < 60) {
              warnings.push(`${where}pod breaks under a minute apart`);
              break outer;
            }
          }
        }
      }
    }
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
  return { name, property, waterfall, sections, warnings };
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
  const obj = { id, ...s, updatedAt: new Date().toISOString(), updatedBy: 'You' };
  state.setups.set(id, obj);
  obj.__warnings = warnings; // read once by the route, never persisted in a view
  return obj;
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
  const mergeSlot = (prevSlot, patch) => {
    // The slot's direct tier merges on its own — sending only the cap wipes nothing.
    const mergedDirect = patch.direct
      ? { ...(prevSlot?.direct || {}), ...patch.direct }
      : prevSlot?.direct;
    const withDirect = out => (mergedDirect ? { ...out, direct: mergedDirect } : out);
    if (Array.isArray(patch.groups)) {
      const prevGroups = slotGroupDefs(prevSlot || { rungs: [], behaviour: null });
      return withDirect({
        groups: patch.groups.map((g, gi) => {
          const pg = prevGroups[gi] || prevGroups[0] || { rungs: [], behaviour: null };
          return {
            // Unlinking without naming units means "back to what stood" — the kept own
            // units, exactly (the whole point of keeping them).
            rungs: g.rungs || (g.waterfallSource === 'own' && pg.ownRungs ? pg.ownRungs : pg.rungs),
            // The indirect source and the kept own units merge like the ladder does —
            // a patch that never mentions them moves nothing.
            ownRungs: g.ownRungs || pg.ownRungs,
            waterfallSource: g.waterfallSource !== undefined ? g.waterfallSource : pg.waterfallSource,
            behaviour: g.behaviour ? { ...(pg.behaviour || {}), ...g.behaviour } : pg.behaviour,
            // A pod's deal merges on its own, like the slot's used to.
            ...(g.direct || pg.direct ? { direct: g.direct ? { ...(pg.direct || {}), ...g.direct } : pg.direct } : {}),
          };
        }),
      });
    }
    const out = { ...(prevSlot || {}), ...patch };
    // A slot patch that touches only the ladder keeps its behaviour, and vice versa.
    if (patch.behaviour) out.behaviour = { ...(prevSlot?.behaviour || {}), ...patch.behaviour };
    // Unlinking without naming units means "back to what stood": the kept own units,
    // exactly — the whole point of keeping them.
    if (patch.waterfallSource === 'own' && !patch.rungs && prevSlot?.ownRungs) out.rungs = prevSlot.ownRungs;
    return withDirect(out);
  };
  let mergedSections = existing.sections;
  if (Array.isArray(input.sections)) {
    mergedSections = input.sections.map((sec, i) => {
      const prev = existing.sections[i] || { slots: {} };
      const slots = { ...prev.slots };
      for (const [t, patch] of Object.entries(sec.slots || {})) {
        slots[t] = mergeSlot(prev.slots?.[t], patch);
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
        slots[t] = mergeSlot(sec.slots?.[t], patch);
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
  for (const k of keysUsingSetup(id)) {
    if (!isPublished(k.id)) continue;
    for (const ov of k.sections) {
      const effName = renames.find(([o]) => o === ov.name)?.[1] || ov.name;
      const onSlots = SLOT_TYPES.filter(t => ov.slots[t].on);
      if (!onSlots.length) continue;
      if (!newNames.has(effName)) {
        throw new Refusal(409, 'setup_in_use',
          `“${ov.name}” still runs live on ${k.name} — switch it off there before removing the placement`,
          { usedBy: [`${k.name} · ${ov.name}`] });
      }
      const secDef = s.sections.find(x => x.name === effName);
      for (const t of onSlots) {
        // Every break group answers for itself: one dark group is one dark break.
        const walks = groupWalks(secDef, k.drive?.[t], t);
        const multi = walks.length > 1;
        walks.forEach((r, gi) => {
          if (r.walk.length === 0) {
            // Said in the UI's words (7 Sep, UAT P1): the pod, the placement, who plays it.
            throw new Refusal(409, 'setup_in_use',
              multi
                ? `Pod ${gi + 1} in “${ov.name}” is empty — ${k.name} plays its ${SLOT_WORD[t].toLowerCase()} live, so every pod needs an ad unit`
                : `“${ov.name}” ${SLOT_WORD[t].toLowerCase()} would go dark — ${k.name} plays it live; add an ad unit, or switch it off there first`,
              { usedBy: [`${k.name} · ${ov.name}`] });
          }
        });
        if (walks.some(r => r.fellBack || r.vacuous)) {
          const provs = askWord(driveAsk(k.drive?.[t]?.ask) || []);
          driftWarnings.push(`${k.name} ${SLOT_WORD[t].toLowerCase()}: asks ${provs} — falls back`);
        }
      }
    }
  }

  for (const [oldName, newName] of renames) {
    for (const k of keysUsingSetup(id)) {
      for (const ov of k.sections) if (ov.name === oldName) ov.name = newName;
    }
  }

  const changes = diff(existing, s);
  Object.assign(existing, s, { updatedAt: new Date().toISOString(), updatedBy: 'You' });
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
  return createSetup({ ...JSON.parse(JSON.stringify(src)), name });
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
      const n = localWalk(rungs).length;
      const reachable = Math.max(1, Math.floor((next.fillTimeoutSec * 1000) / next.tagTimeoutMs));
      if (n > 1 && reachable < n) {
        warnings.push(`last ${n - reachable} sources never run`);
      }
    }
  }

  if (changes.length) {
    Object.assign(setup, { updatedAt: new Date().toISOString(), updatedBy: 'You' });
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
