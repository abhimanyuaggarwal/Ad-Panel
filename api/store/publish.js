// store/publish.js — THE PUBLISH PLANE: what a snapshot holds, versions, publish /
// unpublish / restore, the darkness check at the boundary, and `liveConfig` — the JSON
// the player is actually served.
import { versionChanges } from './version-changes.js';
import { listKeys, updateKey } from './keys.js';
import { driveWalkRungs, effectiveBehaviour, liveRungs, slotGroupDefs } from './ladders.js';
import { keysUsingSetup, servedHeaderBidding, servedUnitHeaderBidding, updateSetup } from './setups.js';
import { setupTagIds, setupsUsingTemplate, tagsUsingTemplate, updateTemplate } from './tags.js';
import { ACTOR, RUNG_FACTS, Refusal, SLOT_TYPES, SLOT_WORD, deepCopy, state } from './state.js';
import { mustGet } from './validate.js';


// ---------- THE PUBLISH PLANE (27 Aug, user call) ----------
//
// Save writes the DRAFT. Publish stamps an immutable snapshot and swaps what the
// player's API reads. Nothing else reaches a viewer — there is no third path, and no
// field that quietly bypasses the plane (the old `status` pause was exactly that, and
// went with this change: taking a surface off the air is Unpublish, a publish-plane act,
// so the rule has no exception to explain).
//
// The user's call on 27 Aug: **an integration and its ad setup publish SEPARATELY** —
// ad ops ship ladders on their cadence, product ships switches on theirs. The gap that
// buys is real and is closed at the boundary rather than by a state machine: publishing
// an integration whose live break has no PUBLISHED demand behind it is refused by name,
// and so is taking down a setup a published integration is standing on.

const PUBLISHABLE = {
  key: k => ({
    name: k.name, property: k.property, platform: k.platform,
    domains: [...k.domains], packageName: k.packageName,
    player: { ...k.player },
    playerConfigs: (k.playerConfigs || []).map(c => ({ ...c })),
    adSetupId: k.adSetupId,
    sections: k.sections.map(s => ({
      name: s.name,
      slots: Object.fromEntries(SLOT_TYPES.map(t => [t, { on: !!s.slots[t].on }])),
    })),
    drive: k.drive ? deepCopy(k.drive) : null,
  }),
  // A TEMPLATE IS A THIRD PUBLISHABLE KIND (16 Sep, user call). Everything it holds is
  // what the player is handed, so the snapshot is the object: change any of it and the
  // diff says which field moved, in the rail, in the same words the page uses.
  template: t => ({
    name: t.name, provider: t.provider, url: t.url, properties: [...(t.properties || [])],
  }),
  setup: s => ({
    name: s.name, property: s.property,
    // WHO ELSE BIDS, for the whole surface (10 Sep). One scalar, always present: every
    // slot's `auto` is resolved against it at the boundary below, so the snapshot the
    // player reads has to carry the thing being borrowed.
    headerBidding: s.headerBidding || 'off',
    // The waterfall rides the snapshot RAW (per-unit answers kept) with its two
    // levers beside it; what a linked break serves is already materialized in its
    // rungs. Absent while unconfigured, so older setups' snapshots read unchanged.
    ...(s.waterfall && (s.waterfall.rungs.length || s.waterfall.depth || s.waterfall.pauseAll)
      ? { waterfall: { rungs: s.waterfall.rungs.map(snapRung), depth: s.waterfall.depth ?? null, pauseAll: s.waterfall.pauseAll ?? null } }
      : {}),
    sections: s.sections.map(sec => ({
      name: sec.name,
      slots: Object.fromEntries(SLOT_TYPES.map(t => {
        const out = {
          rungs: sec.slots[t].rungs.map(snapRung),
          behaviour: { ...sec.slots[t].behaviour },
          // A break that follows the waterfall says so — the diff reads the
          // link, and a restore puts the link back rather than a frozen copy. A break
          // switched off says so too (8 Sep): `own` remains the answer said by ABSENCE,
          // so an old snapshot still reads exactly as it always did.
          // AND IT CARRIES WHAT IT OWNS (8 Sep). `rungs` is the SERVED walk, which for
          // these two answers is derived — the break's own primary plus the waterfall's
          // units, or the primary alone. What the break itself holds is `ownRungs`, so
          // the snapshot keeps that too: without it a restore rebuilt the stash from the
          // served array (a frozen copy of the waterfall), and the diff could not see a
          // linked break's own primary change at all.
          ...(sec.slots[t].waterfallSource && sec.slots[t].waterfallSource !== 'own'
            ? {
              waterfallSource: sec.slots[t].waterfallSource,
              ownRungs: (sec.slots[t].ownRungs || []).map(snapRung),
            } : {}),
        };
        if (sec.slots[t].direct) {
          out.direct = { rungs: (sec.slots[t].direct.rungs || []).map(snapRung) };
        }
        // Group 1 doubles as the slot itself; extra groups ride alongside, so an old
        // snapshot with no `groups` reads as one group everywhere.
        if (sec.slots[t].groups && sec.slots[t].groups.length > 1) {
          out.groups = sec.slots[t].groups.map(g => ({
            rungs: g.rungs.map(snapRung),
            behaviour: { ...g.behaviour },
            ...(g.waterfallSource && g.waterfallSource !== 'own'
              ? { waterfallSource: g.waterfallSource, ownRungs: (g.ownRungs || []).map(snapRung) } : {}),
            ...(g.direct ? { direct: { rungs: (g.direct.rungs || []).map(snapRung) } } : {}),
          }));
        }
        return [t, out];
      })),
    })),
  }),
};

// A rung's publishable facts: the tag it points at, its switch, and the unit's own
// facts (`RUNG_FACTS`). Never the view-only fields.
function snapRung(r) {
  const out = { tagId: r.tagId, on: r.on !== false };
  for (const f of RUNG_FACTS) {
    if (r[f] !== undefined) out[f] = r[f];
  }
  return out;
}

export function objectOf(kind, id) {
  if (kind === 'key') return mustGet(state.keys, id, 'integration');
  if (kind === 'template') return mustGet(state.templates, id, 'ad unit template');
  return mustGet(state.setups, id, 'ad setup');
}

export function draftSnapshot(kind, obj) { return PUBLISHABLE[kind](obj); }

export function liveSnapshot(id) { return state.live.get(id)?.snapshot ?? null; }
export function liveVersion(id) { return state.live.get(id)?.v ?? null; }
export function versionsOf(id) { return state.versions.get(id) || []; }
export function isPublished(id) { return state.live.has(id); }

// ---------- the seam, checked at the boundary ----------
// Independent publishing (user call) means the two planes can disagree. Rather than a
// state machine, each publish answers one question against what is ACTUALLY live: would
// this leave a switched-on break with nothing published behind it? No answer → no
// publish. Fail closed, named, exactly as the draft plane already does.

// Per break group: an array of live ladders, one per group (one entry when ungrouped).
function publishedGroupLadders(setupSnap, secName, t) {
  const sec = setupSnap && (setupSnap.sections || []).find(x => x.name === secName);
  if (!sec || !sec.slots[t]) return [[]];
  return slotGroupDefs(sec.slots[t]).map(g => (g.rungs || []).filter(r => r.on !== false && r.tagId));
}

/**
 * THE ONE WALK behind both refusals below: every switched-on break in `keySnap` that
 * `setupSnap` would leave with nothing published to ask. The two rooms ask the same
 * question of different pairs — the surface against its live demand, an ops version
 * against each live holder — so the walk is shared and the WORDS are not: each room
 * names a dark break the way its own people say it.
 * @param {object} keySnap    an integration snapshot: whose breaks are switched on
 * @param {object|null} setupSnap  the demand snapshot to read those breaks against
 * @returns {{sectionName: string, slotType: string, groupIndex: number, isMulti: boolean}[]}
 *          in section, then slot, then pod order — so the first entry is the first found
 */
function emptyBreaks(keySnap, setupSnap) {
  const out = [];
  for (const sec of keySnap.sections || []) {
    for (const t of SLOT_TYPES) {
      if (!sec.slots[t]?.on) continue;
      out.push(...emptyPodsOfBreak(sec.name, t, setupSnap));
    }
  }
  return out;
}

// One break's pods, and which of them have no published demand. Split out so the walk
// above stays inside the depth ceiling and reads as the two loops it actually is.
function emptyPodsOfBreak(sectionName, slotType, setupSnap) {
  const groups = publishedGroupLadders(setupSnap, sectionName, slotType);
  const isMulti = groups.length > 1;
  return groups
    .map((live, groupIndex) => (live.length ? null : { sectionName, slotType, groupIndex, isMulti }))
    .filter(Boolean);
}

// The product room's words for a dark break: the placement, the break, the pod.
function darkBreakNames(keySnap) {
  const setupSnap = keySnap.adSetupId ? liveSnapshot(keySnap.adSetupId) : null;
  return emptyBreaks(keySnap, setupSnap)
    .map(b => `${b.sectionName} ${SLOT_WORD[b.slotType].toLowerCase()}${b.isMulti ? ` pod ${b.groupIndex + 1}` : ''}`);
}

// A surface may not go on air with a switched-on break that has nothing published behind
// it — no answer, no publish, named either way.
function refuseIfSurfaceWouldGoDark(obj, snapshot) {
  const anyOn = (snapshot.sections || []).some(s => SLOT_TYPES.some(t => s.slots[t].on));
  if (!anyOn) {
    throw new Refusal(409, 'nothing_runs',
      `“${obj.name}” has every break switched off — publishing it would put nothing on air. Switch a break on, or leave it unpublished`);
  }
  const dark = darkBreakNames(snapshot);
  if (!dark.length) return;
  const setup = obj.adSetupId ? state.setups.get(obj.adSetupId) : null;
  throw new Refusal(409, 'demand_unpublished',
    setup
      ? `${dark.join(', ')} would go on air with nothing behind ${dark.length === 1 ? 'it' : 'them'} — publish “${setup.name}” first`
      : `${obj.name} has no ad setup attached, so ${dark.join(', ')} would ask nobody`,
    { usedBy: dark });
}

// Taking demand away from a published break is the same darkness, one room over: the
// same walk, read against each live holder's own overlay. Refuses on the first it finds,
// in the ops room's words.
function refuseIfHoldersWouldGoDark(setupId, snapshot) {
  for (const k of keysUsingSetup(setupId)) {
    if (!isPublished(k.id)) continue;
    const [dark] = emptyBreaks(liveSnapshot(k.id), snapshot);
    if (!dark) continue;
    throw new Refusal(409, 'would_go_dark',
      `“${k.name}” is live on ${dark.sectionName} ${dark.slotType}${dark.isMulti ? ` group ${dark.groupIndex + 1}` : ''} and this version leaves it nothing to ask — switch that break off there first`,
      { usedBy: [k.name] });
  }
}

export function publishObject(kind, id, actor = ACTOR, note) {
  // The person's own line under the version — why this went out, in their words.
  const memo = String(note ?? '').trim().slice(0, 200);
  const obj = objectOf(kind, id);
  const snapshot = draftSnapshot(kind, obj);
  const before = liveSnapshot(id);
  const warnings = [];

  // A TEMPLATE HAS NO DARKNESS QUESTION. Whatever it does, the units pointing at it have
  // somewhere to ask: their provider's standard. That is the whole reason it can be taken
  // off air without warning anyone, and why publishing one refuses nothing.
  if (kind === 'key') refuseIfSurfaceWouldGoDark(obj, snapshot);
  else if (kind === 'setup') refuseIfHoldersWouldGoDark(id, snapshot);

  const changes = versionChanges(kind, before, snapshot);
  if (!changes.length) throw new Refusal(409, 'nothing_to_publish', `“${obj.name}” is already live, exactly as it is`);

  // The blast radius, said at the moment it becomes true. It used to fire on Save, back
  // when a save WAS the release; under the plane that sentence was a lie every time.
  if (kind === 'setup') {
    const onAir = keysUsingSetup(id).filter(k => isPublished(k.id));
    // One setup may fill several integrations (8 Sep), so the warning counts them all
    // and agrees with itself: “A” picks this up · “A”, “B” pick this up.
    if (onAir.length) warnings.push(`${onAir.map(k => `“${k.name}”`).join(', ')} pick${onAir.length === 1 ? 's' : ''} this up`);
  }
  // A template's blast radius is the point of the object, so it is counted here too — one
  // publish moves every ad unit pointing at it, which is what makes it worth sharing and
  // what makes the moment worth naming.
  if (kind === 'template') {
    const units = tagsUsingTemplate(id).length;
    const setups = setupsUsingTemplate(id).length;
    if (units) {
      warnings.push(`${units} ad unit${units === 1 ? '' : 's'} in ${setups} ad setup${setups === 1 ? '' : 's'} pick${units === 1 ? 's' : ''} this up`);
    }
  }

  const list = state.versions.get(id) || [];
  const entry = { v: list.length + 1, ts: new Date().toISOString(), actor, snapshot, changes, ...(memo ? { note: memo } : {}) };
  list.push(entry);
  state.versions.set(id, list);
  state.live.set(id, { v: entry.v, snapshot });
  return { obj, version: entry, warnings };
}

// TAKING IT OFF THE AIR is a publish-plane act, not a field (27 Aug): the draft is
// untouched, so what comes back on Publish is exactly what you had. This is the whole
// of what the old `status` pause did, without a second concept in the model.
export function unpublishObject(kind, id, actor = ACTOR) {
  const obj = objectOf(kind, id);
  if (!state.live.has(id)) throw new Refusal(409, 'not_live', `“${obj.name}” is not on air`);
  if (kind === 'setup') {
    const holders = keysUsingSetup(id).filter(k => isPublished(k.id));
    if (holders.length) {
      throw new Refusal(409, 'would_go_dark',
        `“${holders.map(k => k.name).join(', ')}” is on air filling from this — take it down first`,
        { usedBy: holders.map(k => k.name) });
    }
  }
  const list = state.versions.get(id) || [];
  list.push({ v: list.length + 1, ts: new Date().toISOString(), actor, snapshot: null, changes: [{ where: '', field: 'Taken off air', from: 'live', to: 'off air' }] });
  state.versions.set(id, list);
  state.live.delete(id);
  return { obj };
}

// RESTORE is forward-only, like a spreadsheet's: the old content is published as a NEW
// version, so the thing you reverted away from is still there to revert back to. The
// draft follows, because leaving the editor showing something other than what is live
// is how people publish an accident.
export function restoreVersion(kind, id, v, actor = ACTOR, note) {
  const obj = objectOf(kind, id);
  const src = versionsOf(id).find(x => x.v === Number(v));
  if (!src) throw new Refusal(404, 'not_found', `“${obj.name}” has no version ${v}`);
  if (!src.snapshot) throw new Refusal(409, 'not_restorable', `Version ${v} took “${obj.name}” off air — publish it again instead`);
  applySnapshot(kind, obj, src.snapshot);
  const out = publishObject(kind, id, actor, note);
  const entry = versionsOf(id)[versionsOf(id).length - 1];
  entry.restoredFrom = src.v;
  return { ...out, restoredFrom: src.v };
}

// Writing a snapshot back onto the draft. It goes through the ORDINARY update path, not
// around it: a restore is subject to every rule a hand edit is, so an old version that
// is no longer legal (a tag since deleted, a placement a live surface now stands on)
// refuses by name instead of landing broken.
function applySnapshot(kind, obj, snap) {
  if (kind === 'template') {
    updateTemplate(obj.id, { name: snap.name, provider: snap.provider, url: snap.url, properties: snap.properties });
    return;
  }
  if (kind === 'setup') {
    // `?? null` clears the waterfall when restoring a version from before it existed;
    // and a snapshot says "own units" by ABSENCE, which a merge cannot see — made
    // explicit here so restoring an own-units version actually unlinks the break.
    const explicitSource = slot => ({ waterfallSource: 'own', ...slot,
      ...(slot.groups ? { groups: slot.groups.map(g => ({ waterfallSource: 'own', ...g })) } : {}) });
    const sections = snap.sections.map(sec => ({ ...sec,
      slots: Object.fromEntries(Object.entries(sec.slots || {}).map(([t, slot]) => [t, explicitSource(slot)])) }));
    updateSetup(obj.id, { name: snap.name, property: snap.property, direct: snap.direct, waterfall: snap.waterfall ?? null, sections });
    return;
  }
  updateKey(obj.id, {
    name: snap.name, property: snap.property, platform: snap.platform,
    domains: snap.domains, packageName: snap.packageName, player: snap.player,
    playerConfigs: snap.playerConfigs || [],
    adSetupId: snap.adSetupId, sections: snap.sections, drive: snap.drive,
  });
}

export function getVersionOwner(kind, id) { return objectOf(kind, id); }

// WHAT RESTORING WOULD DO — the only question the restore dialog is actually asking.
// A version's own `changes` say what it did the day it went out; going back to it from
// three versions later is a different diff entirely, and showing the first in place of
// the second is how someone restores the wrong thing.
export function restorePreview(kind, id, v) {
  const obj = objectOf(kind, id);
  const src = versionsOf(id).find(x => x.v === Number(v));
  if (!src) throw new Refusal(404, 'not_found', `“${obj.name}” has no version ${v}`);
  if (!src.snapshot) throw new Refusal(409, 'not_restorable', `Version ${v} took “${obj.name}” off air — publish it again instead`);
  return {
    v: src.v, ts: src.ts, actor: src.actor,
    // From what is ON AIR to what this version holds.
    changes: versionChanges(kind, liveSnapshot(id), src.snapshot),
    // …and what the open draft would lose, which is nobody's idea of a good surprise.
    discards: versionChanges(kind, liveSnapshot(id), draftSnapshot(kind, obj)),
    nextVersion: versionsOf(id).length + 1,
    liveVersion: liveVersion(id),
  };
}

// THE ONE SERIALIZATION BOUNDARY for the player's config block (11 Sep). The panel
// holds these fields FLAT — one object, one normalizer, one diff, so the change review
// can name any of them without walking a tree — and the player reads them NESTED, in
// the five namespaces its own config document uses. The translation lives here, once.
//
// Two encodings are honoured rather than argued with: a sentinel `0` means off for every
// timing (the UI draws that as a switch, but the wire keeps the 0), and `pip` is the
// empty string when docking is off. Milliseconds on the wire throughout; the panel says
// seconds on screen, as it does for every other timing it carries.
export function playerBlock(P) {
  if (!P) return {};
  // Q1 IS ANSWERED AT THE BOUNDARY, NOT IN THE MODEL. The panel's vocabulary is still
  // on / off / auto (changing it is a decision the player team owns), so the mapping is
  // stated here in one place: `auto` is what the player calls mutedOnScroll.
  const AUTOPLAY_WIRE = { on: 'always', off: 'off', auto: 'mutedOnScroll' };
  return {
    pref: {
      volume: P.rememberVolume === false ? 0 : 1,
      audLang: P.rememberAudioLang === false ? 0 : 1,
      capLang: P.rememberCaptions === false ? 0 : 1,
    },
    playback: {
      autoPlay: AUTOPLAY_WIRE[P.autoplay] || 'off',
      autoPlayVol: P.passiveVolume ?? 100,
      loop: !!P.loop,
      playMode: P.playback || 'active',
      muted: !!P.muted,
      level: P.quality || 'auto',
      pip: !P.dock || P.dock === 'off' ? '' : P.dock,
      autoPause: P.autoPausePct ?? 0,
      endScreen: P.endScreen || 'none',
    },
    theme: {
      primary: P.brandColor || '#ff0000',
      text: P.textColor || '#ffffff',
      logo: P.logoUrl || '',
    },
    controls: {
      mode: P.controlsMode || 'full',
      playbackRates: [...(P.playbackRates || [])],
      autoHide: P.controlsAutoHideMs ?? 5000,
      hideControls: [...(P.hiddenControls || [])],
    },
    analytics: {
      level: P.analyticsLevel ?? 3,
      viewDuration: P.viewAfterMs ?? 3000,
      interval: P.heartbeatMs ?? 10000,
      comscoreId: P.comscoreId || null,
      nielsenId: P.nielsenId || null,
      gaId: P.gaId || null,
    },
  };
}

// WHAT THE PLAYER GETS. Published integration joined with published setup, resolved the
// same way the panel resolves a draft — the drive decision applied over the arrangement,
// so the client is handed the walk it should make, not the two halves to combine itself.
// A break whose demand is not published simply is not in the answer: better a surface
// that asks for nothing than one that asks nobody.
export function liveConfig(apiKey) {
  const k = listKeys().find(x => x.key === apiKey);
  if (!k) return null;
  const ks = liveSnapshot(k.id);
  if (!ks) return null;
  const ss = ks.adSetupId ? liveSnapshot(ks.adSetupId) : null;

  // Every template a served tag requests through, resolved by NAME at the boundary —
  // authored in the panel (31 Aug), emitted here, never edited by the player.
  const unittpl = {};
  const walkEntry = (x, hb) => {
    const tag = state.tags.get(x.tagId);
    if (!tag) return null;
    const out = { provider: tag.provider, type: tag.type, value: tag.value };
    if (tag.tplId) {
      // THE TEMPLATE COMES FROM THE PUBLISH PLANE LIKE EVERYTHING ELSE (16 Sep, user call).
      // It used to be read LIVE off the draft — so editing one silently moved every ad setup
      // pointing at it while each of them still swore, on its own page and in its own version
      // history, that nothing had changed. That was the one hole in the plane's promise, and
      // this closes it: a template reaches a player when it is PUBLISHED, and not before.
      //
      // A template with no published version is simply not in the answer, exactly as a
      // switched-off one used to be: its units request through their provider's standard,
      // and the unittpl map never names it. So "off air" is the whole of what "off" meant,
      // which is why the `on` field went with this change rather than living beside it as a
      // second way to say the same thing (the 27 Aug `status` lesson, one room over).
      const snap = liveSnapshot(tag.tplId);
      if (snap) { out.tpl = snap.name; unittpl[snap.name] = snap.url; }
    }
    for (const f of RUNG_FACTS) {
      if (x[f] !== undefined) out[f] = x[f];
    }
    // HEADER BIDDING IS HANDED OVER RESOLVED PER UNIT (11 Sep): who bids for THIS unit —
    // its own answer, its break's while it borrows, `off` on a pasted URL — never `auto`.
    out.headerBidding = servedUnitHeaderBidding(x, tag, hb);
    return out;
  };

  // A tier's rungs as the player will walk them: a rung whose tag has gone is simply not
  // in the answer, so the walk never carries a hole.
  const walkOf = (rungs, hb) => (rungs || []).map(x => walkEntry(x, hb)).filter(Boolean);

  const sections = (ks.sections || []).map(s => {
    const def = ss ? (ss.sections || []).find(x => x.name === s.name) : null;
    const slots = {};
    for (const t of SLOT_TYPES) {
      if (!s.slots[t]?.on || !def || !def.slots[t]) continue;
      const drive = ks.drive?.[t] || null;
      const gdefs = slotGroupDefs(def.slots[t]);
      const groups = gdefs.map(g => {
        const { walk } = driveWalkRungs(g.rungs, g.behaviour, drive, t);
        if (!walk.length) return null;
        const gd = drive?.direct === false ? [] : liveRungs(g.direct?.rungs);
        // HEADER BIDDING IS HANDED OVER RESOLVED (10 Sep): the player is told WHO bids
        // for this break — never `auto`, which is a panel-side inheritance and would
        // make the client join the two halves itself (the rule this whole seam keeps).
        const bhv = effectiveBehaviour(t, g.behaviour, drive).values;
        const hb = servedHeaderBidding(bhv?.headerBidding, ss?.headerBidding);
        return {
          behaviour: bhv && { ...bhv, headerBidding: hb },
          walk: walkOf(walk, hb),
          ...(gd.length ? { direct: { walk: walkOf(gd, hb) } } : {}),
        };
      }).filter(Boolean);
      if (!groups.length) continue;
      // Group 1 doubles as the slot itself; extra mid-roll groups ride alongside.
      slots[t] = { ...groups[0] };
      if (groups.length > 1) slots[t].groups = groups;
      // THE BREAK'S OWN DIRECT TIER (1 Sep): tried before the primary, capped per
      // session, and switched per break by the surface (drive.direct: absence = on).
      // Group 1's deal doubles as the slot's, the way group 1's ladder does.
      const dRungs = drive?.direct === false ? [] : liveRungs(slotGroupDefs(def.slots[t])[0]?.direct?.rungs ?? def.slots[t].direct?.rungs);
      if (dRungs.length) {
        slots[t].direct = { walk: walkOf(dRungs, slots[t].behaviour?.headerBidding) };
      }
    }
    return { name: s.name, slots };
  }).filter(s => Object.keys(s.slots).length);

  // THE CUSTOM CONFIGS, RESOLVED (13 Sep). Stored sparse — a config carries only what it
  // overrides — and handed over WHOLE: the default laid under the overrides, then the
  // same five namespaces the root carries, so a config on the wire has exactly the
  // shape of the document's own player section and the player reads one grammar twice.
  // Because resolution happens here, moving a lever on the default moves every config
  // that never spoke about it — live inheritance, the Q12 the 11 Sep cut left open.
  // A switched-off config (4 Sep) is simply not in the answer, and the emitted shape
  // never grows the switch itself. Emitted only when any survive.
  const liveConfigs = (ks.playerConfigs || []).filter(c => c.on !== false)
    .map(({ id, on, name, ...ov }) => {
      const resolved = { ...ks.player, ...ov };
      return { name, player: resolved, ...playerBlock(resolved) };
    });

  return {
    key: apiKey,
    integration: { name: ks.name, property: ks.property, platform: ks.platform, domains: ks.domains, packageName: ks.packageName },
    player: ks.player,
    // THE PLAYER'S OWN CONFIG BLOCK (11 Sep) — the five namespaces it already parses,
    // built HERE and nowhere else. `player` above is unchanged, so nothing the player
    // reads today moves; the three fields that appear in both are derived from one
    // internal field each, so they can never disagree. They collapse into one node
    // once Q1 and Q4 are answered (docs/PLAYER-LEVERS.xlsx).
    ...playerBlock(ks.player),
    ...(liveConfigs.length ? { playerConfigs: liveConfigs } : {}),
    version: { integration: liveVersion(k.id), adSetup: ks.adSetupId ? liveVersion(ks.adSetupId) : null },
    unittpl,
    sections,
  };
}

// Mock only: publish an object and backdate its version, so a seeded world reads as one
// that has been running for days rather than one that went live all at once just now.
export function seedPublish(kind, id, { actor = 'Priya (ad ops)', hoursAgo = 0, note } = {}) {
  const { version } = publishObject(kind, id, actor, note);
  version.ts = new Date(Date.now() - hoursAgo * 3600 * 1000).toISOString();
  return version;
}

// ---------- WHAT MOVED UNDERNEATH AN AD SETUP (16 Sep, user call) ----------
// How long a template publish stays news on the ad setups under it (17 Sep, user call).
const NEWS_WINDOW_MS = 60 * 60 * 1000;

// An ad setup's version history is about the setup's own content, so a template publishing
// does not bump it — the setup did not change, and filling ten histories with a change
// nobody made in them is what makes a history unreadable. But silence was the actual bug
// the user found: the setup swore nothing had moved while the URL its units fired had.
//
// So the setup is TOLD, not versioned. Every template its units point at that has gone on
// air since this setup last published, newest first, each with the version, the person and
// the moment. Counted, named, and never a number the rows cannot account for.
export function templateNewsFor(setupId) {
  const setup = state.setups.get(setupId);
  if (!setup) return [];
  const since = state.versions.get(setupId)?.filter(v => v.snapshot).pop()?.ts || null;
  const ids = setupTagIds(setup);
  const seen = new Set();
  const out = [];
  for (const tagId of ids) {
    const tag = state.tags.get(tagId);
    if (!tag?.tplId || seen.has(tag.tplId)) continue;
    seen.add(tag.tplId);
    const tpl = state.templates.get(tag.tplId);
    if (!tpl) continue;
    // The template's own publishes, after this setup's last one. A template that has never
    // been published has nothing to report — its units are asking the standard either way.
    //
    // ONE ROW PER TEMPLATE, AT THE VERSION NOW SERVING (17 Sep, user call — the line was
    // unreadable). Listing every publish since made one template that went out twice read as
    // `2 templates this setup uses went on air`: a head count the rows contradicted, which is
    // the very flaw the reach list was rebuilt to fix one room over. What a person can act on
    // is WHICH template moved and what it is asking NOW — the steps in between are that
    // template's own history, one click away on the row. So the latest publish since is the
    // whole entry, and the count is a count of templates.
    //
    // AND ONLY WHILE IT IS NEWS (17 Sep, user call — *"a read-only text that stays a couple
    // of hours and then disappears"*, then *"make it 1 hr"*). Its old clearing rule was this
    // setup's next publish, which may never come: a line that says `nothing to do` and then
    // sits for weeks is how people learn to stop reading the amber. It ages out instead. The
    // cost the user accepted, said once: most page loads fall outside the hour and show
    // nothing, so this catches whoever is already working when it happens and nobody else.
    // The full record is on the template's own page either way, which is where a question
    // asked later belongs.
    const fresh = Date.now() - NEWS_WINDOW_MS;
    const mine = versionsOf(tag.tplId).filter(v => v.snapshot
      && !(since && v.ts <= since)
      && Date.parse(v.ts) >= fresh);
    if (!mine.length) continue;
    const last = mine[mine.length - 1];
    // WHAT MOVED, NOT JUST THAT SOMETHING DID (17 Sep, user call). `v3` is a number nobody
    // can act on; `Request URL` is the difference between "that matters to me" and "that
    // doesn't". The keys travel raw and the page names them with its own `fieldName`, so
    // the note and the change review can never call one field two things.
    const fields = [...new Set((last.changes || []).map(c => c.field))];
    out.push({ id: tpl.id, name: tpl.name, v: last.v, ts: last.ts, actor: last.actor, fields });
  }
  return out.sort((a, b) => b.ts.localeCompare(a.ts));
}

// ---------- the gap between draft and air ----------

/** What the next publish would change: the draft against what is on air. */
export function unpublishedChanges(kind, id) {
  const obj = objectOf(kind, id);
  return versionChanges(kind, liveSnapshot(id), draftSnapshot(kind, obj));
}

export function isDirty(kind, id) {
  const obj = objectOf(kind, id);
  return JSON.stringify(liveSnapshot(id)) !== JSON.stringify(draftSnapshot(kind, obj));
}
