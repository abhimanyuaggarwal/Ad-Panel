// store/publish.js — THE PUBLISH PLANE: snapshots, versions, publish/unpublish/restore, the seam.
// Split from store.js (3 Sep, docs/STORE-SPLIT.md): a MOVE, not a rewrite — units
// relocated whole, bodies untouched. store.js re-exports everything, so the HTTP
// surface, the tests and the mock world see the exact same module they always did.
import { versionChanges } from './diff.js';
import { listKeys, updateKey } from './keys.js';
import { driveWalkRungs, effectiveBehaviour, liveRungs, slotGroupDefs } from './ladders.js';
import { keysUsingSetup, updateSetup } from './setups.js';
import { Refusal, SLOT_TYPES, state } from './state.js';
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
    drive: k.drive ? JSON.parse(JSON.stringify(k.drive)) : null,
  }),
  setup: s => ({
    name: s.name, property: s.property,
    sections: s.sections.map(sec => ({
      name: sec.name,
      slots: Object.fromEntries(SLOT_TYPES.map(t => {
        const out = {
          rungs: sec.slots[t].rungs.map(snapRung),
          behaviour: { ...sec.slots[t].behaviour },
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
            ...(g.direct ? { direct: { rungs: (g.direct.rungs || []).map(snapRung) } } : {}),
          }));
        }
        return [t, out];
      })),
    })),
  }),
};

// A rung's publishable facts: the tag it points at, its switch, and — for a banner —
// its four own facts. Never the view-only fields.
function snapRung(r) {
  const out = { tagId: r.tagId, on: r.on !== false };
  for (const f of ['displaySlot', 'pause', 'showAfterSec', 'closeAfterSec', 'hideAfterSec']) {
    if (r[f] !== undefined) out[f] = r[f];
  }
  return out;
}

export function objectOf(kind, id) {
  return kind === 'key' ? mustGet(state.keys, id, 'integration') : mustGet(state.setups, id, 'ad setup');
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

function darkBreaks(keySnap) {
  const out = [];
  const setupSnap = keySnap.adSetupId ? liveSnapshot(keySnap.adSetupId) : null;
  for (const s of keySnap.sections || []) {
    for (const t of SLOT_TYPES) {
      if (!s.slots[t]?.on) continue;
      const groups = publishedGroupLadders(setupSnap, s.name, t);
      const multi = groups.length > 1;
      groups.forEach((live, gi) => {
        if (!live.length) out.push(`${s.name} ${t}${multi ? ` group ${gi + 1}` : ''}`);
      });
    }
  }
  return out;
}

export function publishObject(kind, id, actor = 'You') {
  const obj = objectOf(kind, id);
  const snapshot = draftSnapshot(kind, obj);
  const before = liveSnapshot(id);
  const warnings = [];

  if (kind === 'key') {
    const anyOn = (snapshot.sections || []).some(s => SLOT_TYPES.some(t => s.slots[t].on));
    if (!anyOn) {
      throw new Refusal(409, 'nothing_runs',
        `“${obj.name}” has every break switched off — publishing it would put nothing on air. Switch a break on, or leave it unpublished`);
    }
    const dark = darkBreaks(snapshot);
    if (dark.length) {
      const setup = obj.adSetupId ? state.setups.get(obj.adSetupId) : null;
      throw new Refusal(409, 'demand_unpublished',
        setup
          ? `${dark.join(', ')} would go on air with nothing behind ${dark.length === 1 ? 'it' : 'them'} — publish “${setup.name}” first`
          : `${obj.name} has no ad setup attached, so ${dark.join(', ')} would ask nobody`,
        { usedBy: dark });
    }
  } else {
    // Taking demand away from a published break is the same darkness, one room over.
    const holders = keysUsingSetup(id).filter(k => isPublished(k.id));
    for (const k of holders) {
      const ks = liveSnapshot(k.id);
      for (const s of ks.sections || []) {
        for (const t of SLOT_TYPES) {
          if (!s.slots[t]?.on) continue;
          const groups = publishedGroupLadders(snapshot, s.name, t);
          const multi = groups.length > 1;
          groups.forEach((live, gi) => {
            if (!live.length) {
              throw new Refusal(409, 'would_go_dark',
                `“${k.name}” is live on ${s.name} ${t}${multi ? ` group ${gi + 1}` : ''} and this version leaves it nothing to ask — switch that break off there first`,
                { usedBy: [k.name] });
            }
          });
        }
      }
    }
  }

  const changes = versionChanges(kind, before, snapshot);
  if (!changes.length) throw new Refusal(409, 'nothing_to_publish', `“${obj.name}” is already live, exactly as it is`);

  // The blast radius, said at the moment it becomes true. It used to fire on Save, back
  // when a save WAS the release; under the plane that sentence was a lie every time.
  if (kind === 'setup') {
    const onAir = keysUsingSetup(id).filter(k => isPublished(k.id));
    if (onAir.length) warnings.push(`${onAir.map(k => `“${k.name}”`).join(', ')} picks this up on its next request`);
  }

  const list = state.versions.get(id) || [];
  const entry = { v: list.length + 1, ts: new Date().toISOString(), actor, snapshot, changes };
  list.push(entry);
  state.versions.set(id, list);
  state.live.set(id, { v: entry.v, snapshot });
  return { obj, version: entry, warnings };
}

// TAKING IT OFF THE AIR is a publish-plane act, not a field (27 Aug): the draft is
// untouched, so what comes back on Publish is exactly what you had. This is the whole
// of what the old `status` pause did, without a second concept in the model.
export function unpublishObject(kind, id, actor = 'You') {
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
export function restoreVersion(kind, id, v, actor = 'You') {
  const obj = objectOf(kind, id);
  const src = versionsOf(id).find(x => x.v === Number(v));
  if (!src) throw new Refusal(404, 'not_found', `“${obj.name}” has no version ${v}`);
  if (!src.snapshot) throw new Refusal(409, 'not_restorable', `Version ${v} took “${obj.name}” off air — publish it again instead`);
  applySnapshot(kind, obj, src.snapshot);
  const out = publishObject(kind, id, actor);
  const entry = versionsOf(id)[versionsOf(id).length - 1];
  entry.restoredFrom = src.v;
  return { ...out, restoredFrom: src.v };
}

// Writing a snapshot back onto the draft. It goes through the ORDINARY update path, not
// around it: a restore is subject to every rule a hand edit is, so an old version that
// is no longer legal (a tag since deleted, a placement a live surface now stands on)
// refuses by name instead of landing broken.
function applySnapshot(kind, obj, snap) {
  if (kind === 'setup') {
    updateSetup(obj.id, { name: snap.name, property: snap.property, direct: snap.direct, sections: snap.sections });
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
  const walkEntry = x => {
    const tag = state.tags.get(x.tagId);
    if (!tag) return null;
    const out = { provider: tag.provider, type: tag.type, value: tag.value };
    if (tag.tplId) {
      // A switched-off template (4 Sep) is simply not in the answer — its units request
      // through their provider's standard, and the unittpl map never names it. Templates
      // resolve live, so the switch reaches players on their next request, no republish.
      const tpl = state.templates.get(tag.tplId);
      if (tpl && tpl.on !== false) { out.tpl = tpl.name; unittpl[tpl.name] = tpl.url; }
    }
    for (const f of ['displaySlot', 'pause', 'showAfterSec', 'closeAfterSec', 'hideAfterSec']) {
      if (x[f] !== undefined) out[f] = x[f];
    }
    return out;
  };

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
        return {
          behaviour: effectiveBehaviour(t, g.behaviour, drive).values,
          walk: walk.map(walkEntry).filter(Boolean),
          ...(gd.length ? { direct: { walk: gd.map(walkEntry).filter(Boolean) } } : {}),
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
        slots[t].direct = { walk: dRungs.map(walkEntry).filter(Boolean) };
      }
    }
    return { name: s.name, slots };
  }).filter(s => Object.keys(s.slots).length);

  // The named forks a player may ask for (2 Sep): each carries only the three facts
  // that vary per placement; everything else follows `player`. A switched-off config
  // (4 Sep) is simply not in the answer — a player asking for it follows the default —
  // and the emitted shape never grows the switch itself. Emitted only when any survive,
  // so the common integration's JSON does not grow a field.
  const liveConfigs = (ks.playerConfigs || []).filter(c => c.on !== false)
    .map(({ on, ...c }) => ({ ...c }));

  return {
    key: apiKey,
    integration: { name: ks.name, property: ks.property, platform: ks.platform, domains: ks.domains, packageName: ks.packageName },
    player: ks.player,
    ...(liveConfigs.length ? { playerConfigs: liveConfigs } : {}),
    version: { integration: liveVersion(k.id), adSetup: ks.adSetupId ? liveVersion(ks.adSetupId) : null },
    unittpl,
    sections,
  };
}

// Mock only: publish an object and backdate its version, so a seeded world reads as one
// that has been running for days rather than one that went live all at once just now.
export function seedPublish(kind, id, { actor = 'Priya (ad ops)', hoursAgo = 0 } = {}) {
  const { version } = publishObject(kind, id, actor);
  version.ts = new Date(Date.now() - hoursAgo * 3600 * 1000).toISOString();
  return version;
}
