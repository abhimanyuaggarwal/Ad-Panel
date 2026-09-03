// panel/api/server.js — HTTP surface for the Integrations Panel. Port 4200.
// All routes under /panel. In-memory; POST /panel/mock/reset rebuilds the world.
//
// TWO ROOMS (24 Aug): /panel/keys is the product room (switches, inline rules and
// player fields, which setup fills it); /panel/setups is the ops room (ladders, tags).
// The old /panel/behaviours and /panel/policies surfaces are REMOVED, not hidden —
// their shapes live on as creation presets served in meta.

import express from 'express';
import cors from 'cors';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import * as store from './store.js';
import { resetWorld, RULE_PRESETS, PLAYER_PRESETS } from './mock/world.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app = express();
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, '..', 'web')));

function handle(fn) {
  return (req, res) => {
    try {
      fn(req, res);
    } catch (e) {
      if (e instanceof store.Refusal) {
        res.status(e.status).json({ error: e.code, message: e.message, ...(e.details || {}) });
      } else {
        console.error(e);
        res.status(500).json({ error: 'internal', message: e.message });
      }
    }
  };
}

// ---------- meta ----------
app.get('/panel/meta', handle((req, res) => {
  res.json({
    properties: store.PROPERTIES,
    propertyScopes: store.PROPERTY_SCOPES,
    platforms: store.PLATFORMS,
    webPlatforms: store.WEB_PLATFORMS,
    autoplay: store.AUTOPLAY,
    playbackModes: store.PLAYBACK_MODES,
    playbackKinds: store.PLAYBACK_KINDS,
    maxPlayerConfigs: store.MAX_PLAYER_CONFIGS,
    preRollTiming: store.PREROLL_TIMING,
    prerollWaits: store.PREROLL_WAIT,
    midrollModes: store.MIDROLL_MODES,
    slotAlsoTakes: store.SLOT_ALSO_TAKES,
    slotKind: store.SLOT_KIND,
    rotationMax: store.ROTATION_MAX,
    podNextAds: store.POD_NEXT_AD,
    podBanners: store.POD_BANNER,
    slotTypes: store.SLOT_TYPES,
    slotFamily: store.SLOT_FAMILY,
    tagTypes: store.TAG_TYPES,
    tagProviders: store.TAG_PROVIDERS,
    providerTypes: store.PROVIDER_TYPE,
    bulkPlayerFields: BULK_PLAYER_FIELDS,
    // Behaviour lives on the SLOT inside the ad setup (25 Aug); these say which fields
    // each slot can have, so the ops editor draws exactly that and nothing else.
    slotBehaviourFields: store.SLOT_BEHAVIOUR_FIELDS,
    // The DRIVING CONTROLS a surface keeps per break (26 Aug, DRIVING-SCOPE) — the
    // integration draws exactly these as controls and everything else as fact.
    driveFields: store.DRIVE_FIELDS,
    // What a slot behaves like before anyone says otherwise — the cohort screen has no
    // single current value to pre-fill from, so it starts from the same defaults the
    // normalizer would apply.
    slotDefaults: Object.fromEntries(store.SLOT_TYPES.map(t =>
      [t, store.normalizeSlotBehaviour(t, {}, [], [])])),
    urlProviders: store.URL_PROVIDERS,
    adUnitExample: store.AD_UNIT_EXAMPLE,
    maxSections: store.MAX_SECTIONS,
    maxRungs: store.MAX_RUNGS,
    // The page positions a banner may land on — the player team's vocabulary, and each
    // position carries its own sizes player-side (31 Aug: no sizes in the panel).
    displaySlots: store.DISPLAY_SLOTS,
    displaySlotWords: store.DISPLAY_SLOT_WORD,
    pauseModes: store.PAUSE_MODES,
    pauseWords: store.PAUSE_WORD,
    maxMidrollGroups: store.MAX_MIDROLL_GROUPS,
    templateMacros: store.TEMPLATE_MACROS,
    // Presets STAMP values at creation — a photocopy, never a live link. Editing a
    // preset later moves nothing that already exists. Rule presets belong to the AD
    // SETUP now (they stamp a new placement's behaviour); player presets to the key.
    rulePresets: RULE_PRESETS,
    playerPresets: PLAYER_PRESETS,
  });
}));

// WHERE AN OBJECT STANDS ON THE PUBLISH PLANE — the same four facts on every view, so
// a list row and an editor never disagree about whether something is on air.
function publishView(kind, obj) {
  const pending = store.isDirty(kind, obj.id) ? store.unpublishedChanges(kind, obj.id) : [];
  return {
    live: store.isPublished(obj.id),
    liveVersion: store.liveVersion(obj.id),
    unpublishedCount: pending.length,
  };
}

// ---------- rung rendering ----------
// A rung reads as a name, never a raw path.
function rungView(r) {
  const tag = store.listTags().find(t => t.id === r.tagId);
  const tpl = tag && tag.tplId ? store.listTemplates().find(x => x.id === tag.tplId) : null;
  const out = {
    type: 'tag', tagId: r.tagId, on: r.on !== false,
    label: tag ? tag.name : '(missing tag)',
    value: tag ? tag.value : '',
    provider: tag ? tag.provider : '',
    tagType: tag ? tag.type : '',
    // A non-default template is a flag, not a label — the row shows it only when it is news.
    tplName: tpl ? tpl.name : null,
    // Typed in by hand and GAM has not caught up — the one fact about a rung that a
    // later sync can change on its own, so it is derived here every time.
    offDirectory: store.tagOffDirectory(tag),
  };
  // A banner's own four facts ride the rung (31 Aug, AD-JSON-SCOPE).
  for (const f of ['displaySlot', 'pause', 'showAfterSec', 'closeAfterSec', 'hideAfterSec']) {
    if (r[f] !== undefined) out[f] = r[f];
  }
  return out;
}

function ladderView(slot) {
  const live = store.liveRungs(slot.rungs);
  return {
    rungs: slot.rungs,
    rungView: slot.rungs.map(rungView),
    rungCount: live.length,
    rungCountConfigured: slot.rungs.length,
  };
}

// ---------- integrations (the product room) ----------
// A section's slot is a switch; the counted facts beside it come from the setup the
// section resolves to, so the strip can say "3 rungs behind pre-roll" without the
// product room ever holding a ladder.
function tagName(id) {
  return store.getTagOrNull(id)?.name || '(missing tag)';
}

function slotFacts(k, s, t) {
  const setup = store.resolvedSetup(k);
  const secDef = setup ? store.setupSection(setup, s.name) : null;
  const drive = k.drive?.[t] || null;
  // Every break group's own facts, resolved the same way (31 Aug: a mid-roll is up to
  // three groups; every other slot is one). Group 1 doubles as the slot's own facts, so
  // a single-group surface reads exactly what it always read.
  const gdefs = secDef ? store.slotGroupDefs(secDef.slots[t]) : [{ rungs: [], behaviour: null }];
  const gFacts = gdefs.map(g => {
    const ladder = secDef ? store.localLadder(g.rungs) : [];
    const r = secDef ? store.driveWalkRungs(g.rungs, g.behaviour, drive, t) : { walk: [], fellBack: false };
    const eff = secDef ? store.effectiveBehaviour(t, g.behaviour, drive) : { values: null, driveKeys: [] };
    return {
      hasDemand: r.walk.length > 0,
      rungCount: r.walk.length,
      rungCountConfigured: ladder.length,
      fellBack: r.fellBack,
      behaviour: eff.values,
      behaviourDrive: eff.driveKeys,
      behaviourBase: g.behaviour || null,
      walk: r.walk.map(x => ({
        key: x.key,
        label: tagName(x.tagId),
        provider: store.getTagOrNull(x.tagId)?.provider || '',
      })),
      providers: [...new Set(ladder.filter(x => !x.opsOff).map(x => store.getTagOrNull(x.tagId)?.provider || ''))].filter(Boolean),
    };
  });
  // The break's own direct tier, as the product room sees it: counted facts and the
  // per-break switch's state — never an editor.
  const dWalk = secDef ? store.directWalkOf(secDef.slots[t]) : [];
  return {
    ...gFacts[0],
    on: s.slots[t].on,
    // The switch may only light where EVERY group has something to ask.
    hasDemand: gFacts.every(g => g.hasDemand),
    // The drive decision found none of its partners here — this section runs the
    // setup's own arrangement instead, and every view says so.
    fellBack: gFacts.some(g => g.fellBack),
    groups: gFacts.length > 1 ? gFacts : null,
    direct: dWalk.length ? {
      on: drive?.direct !== false,
      rungCount: dWalk.length,
      walk: dWalk.map(r => ({ label: tagName(r.tagId), provider: store.getTagOrNull(r.tagId)?.provider || '' })),
    } : null,
  };
}

function keyView(k) {
  // The sections shown are the EFFECTIVE ones: the setup's placements in the setup's
  // order, each joined with this integration's overlay of the same name.
  const setup = store.resolvedSetup(k);
  const eff = store.effectiveSections(k);
  const slotsOn = {};
  for (const t of store.SLOT_TYPES) slotsOn[t] = eff.some(s => s.slots[t].on);
  return {
    ...k,
    sections: eff.map(s => ({
      ...s,
      setupId: k.adSetupId,
      setupName: setup?.name ?? null,
      setupUpdatedAt: setup?.updatedAt ?? null,
      setupUpdatedBy: setup?.updatedBy ?? null,
      slots: Object.fromEntries(store.SLOT_TYPES.map(t => [t, slotFacts(k, s, t)])),
    })),
    setupName: setup?.name ?? null,
    slotsOn,
    ...publishView('key', k),
  };
}

app.get('/panel/keys', handle((req, res) => {
  res.json({ keys: store.listKeys().map(keyView) });
}));

app.get('/panel/keys/:id', handle((req, res) => {
  res.json({ key: keyView(store.getKey(req.params.id)) });
}));

app.post('/panel/keys', handle((req, res) => {
  const { obj, warnings } = store.createKey(req.body);
  res.status(201).json({ key: keyView(obj), warnings });
}));

app.patch('/panel/keys/:id', handle((req, res) => {
  const { obj, changes, warnings } = store.updateKey(req.params.id, req.body);
  res.json({ key: keyView(obj), changes, warnings });
}));

// The integration's PLAYER, edited with FIELD-LEVEL diffs — so a version reads
// "Autoplay muted → with sound", not "integration updated". Key-level since 25 Aug: the
// per-section player route is GONE with the per-section player, and so is
// `…/sections/:i/rules` (how ads behave belongs to the ad setup's placement).
app.patch('/panel/keys/:id/player', handle((req, res) => {
  const { obj, changes } = store.updateKeyPlayer(req.params.id, req.body);
  res.json({ key: keyView(obj), changes });
}));

// ---------- THE PUBLISH PLANE (27 Aug) ----------
// Save writes the draft; these put it on air. An integration and its ad setup publish
// SEPARATELY (user call), so each publish answers the darkness question against what is
// actually live — see `publishObject`.
for (const [kind, seg] of [['key', 'keys'], ['setup', 'setups']]) {
  app.post(`/panel/${seg}/:id/publish`, handle((req, res) => {
    const { version, warnings } = store.publishObject(kind, req.params.id);
    res.json({ version: publicVersion(version), live: true, warnings });
  }));

  app.post(`/panel/${seg}/:id/unpublish`, handle((req, res) => {
    store.unpublishObject(kind, req.params.id);
    res.json({ live: false });
  }));

  // What restoring would change, counted before anyone commits to it.
  app.get(`/panel/${seg}/:id/versions/:v/preview`, handle((req, res) => {
    res.json(store.restorePreview(kind, req.params.id, req.params.v));
  }));

  app.post(`/panel/${seg}/:id/versions/:v/restore`, handle((req, res) => {
    const { version, restoredFrom } = store.restoreVersion(kind, req.params.id, req.params.v);
    res.json({ version: publicVersion(version), restoredFrom });
  }));

  // The rail reads this: every version, newest first, with what it changed — never the
  // snapshots themselves, which are large and are nobody's business but the player's.
  app.get(`/panel/${seg}/:id/versions`, handle((req, res) => {
    const id = req.params.id;
    store.getVersionOwner(kind, id);
    res.json({
      versions: store.versionsOf(id).map(publicVersion).reverse(),
      liveVersion: store.liveVersion(id),
      unpublished: store.unpublishedChanges(kind, id),
    });
  }));
}

function publicVersion(v) {
  return { v: v.v, ts: v.ts, actor: v.actor, changes: v.changes, restoredFrom: v.restoredFrom ?? null, offAir: !v.snapshot };
}

// THE PLAYER'S API — the only door to what actually serves. It reads the PUBLISHED
// snapshots and nothing else: a draft is invisible here no matter how many times it was
// saved, which is the whole point of the plane.
app.get('/panel/live/:apiKey', handle((req, res) => {
  const live = store.liveConfig(req.params.apiKey);
  if (!live) return res.status(404).json({ error: 'not_live', message: 'No published configuration for that key' });
  res.json(live);
}));

// Duplicate — clone the whole surface for an experiment. Fresh key string, and NOT
// published: a copy has no version history of its own, so it cannot serve until someone
// publishes it on purpose. The setup copies as a COPY, not a link
// (26 Aug): one integration, one ad setup is a promise, and a shared link would
// silently break it the day either copy is tuned.
app.post('/panel/keys/:id/duplicate', handle((req, res) => {
  const src = store.getKey(req.params.id);
  let name = `${src.name} copy`;
  let n = 2;
  while (store.listKeys().some(k => k.name.toLowerCase() === name.toLowerCase())) name = `${src.name} copy ${n++}`;
  const setupCopy = src.adSetupId ? store.duplicateSetup(src.adSetupId, `${name} demand`) : null;
  const { obj } = store.createKey({
    ...JSON.parse(JSON.stringify(src)),
    name,
    adSetupId: setupCopy ? setupCopy.id : null,
  });
  if (setupCopy) {
  }
  res.status(201).json({ key: keyView(obj) });
}));

// ---------- bulk (the product room's cohort acts) ----------
// Re-homed by owner (24 Aug, AD-SETUP-SCOPE): what stays here is what product teams
// genuinely answer the same way for fifty integrations — switches, publishing, rule
// fields, which setup fills them. Every LADDER act (rung switches, moves, pools,
// type-addressed moves) moved to the ops room: editing one shared setup IS the bulk
// act there, so the old cohort ladder ops are gone rather than hidden — a stale
// screen wired to them fails loudly with 400, never quietly reaches traffic.
// The positional acts died with local overrides (26 Aug, DRIVING-SCOPE): mute and
// order are the ad setup's own ladder now. What a cohort answers the same way is the
// switch — and the drive decision, via `driveFields` below.
const BULK_SLOT_ACTIONS = ['slotOn', 'slotOff'];

// What a cohort tweak may touch, 25 Aug: the PLAYER — because that is what each
// integration still owns its own copy of. Cohort rule-editing is gone and needs no
// replacement: how ads behave lives in the ad setup, where ONE edit already reaches
// every attached integration. Bulk-writing it per integration would be undoing the
// thing that made the ops room worth having.
const BULK_PLAYER_FIELDS = ['autoplay', 'startVolume', 'playbackMode', 'fallbackMediaId',
  // The mini player call (31 Aug) — the one playback fact that is the player's.
  'expandInMini',
  // The DEFAULT playback mode (2 Sep) — custom configs are edited per surface through
  // the Player behaviour sheet, never blanket-written by a cohort action.
  'playback'];

function bulkSlotType(value) {
  const t = typeof value === 'string' ? value : value?.slot;
  if (!store.SLOT_TYPES.includes(t)) throw new store.Refusal(400, 'bad_bulk', `Unknown slot: ${t}`);
  return t;
}

app.post('/panel/keys/bulk', handle((req, res) => {
  const { ids, action, value } = req.body || {};
  if (!Array.isArray(ids) || ids.length === 0) {
    throw new store.Refusal(400, 'bad_bulk', 'Pick at least one integration');
  }

  // Validate the target before touching anything — a bulk write never half-lands.
  let slotType = null;
  if (action === 'publish' || action === 'unpublish') {
    // PUBLISHING A COHORT (27 Aug): the one act that replaced `status`. Each integration
    // is published on its own and answers the darkness question for itself, so a cohort
    // publish is N publishes that report per name — never one all-or-nothing swap.
  } else if (BULK_SLOT_ACTIONS.includes(action)) {
    slotType = bulkSlotType(value);
  } else if (action === 'playerFields') {
    const fields = (value && value.fields) || {};
    const allowed = Object.keys(fields).filter(k => BULK_PLAYER_FIELDS.includes(k));
    if (!allowed.length) {
      throw new store.Refusal(400, 'bad_bulk',
        `nothing to change — this act sets ${BULK_PLAYER_FIELDS.slice(0, 8).join(', ')}, …`);
    }
  } else if (action === 'driveFields') {
    // THE QUICK DECISION, ACROSS A COHORT (26 Aug, DRIVING-SCOPE): who fills it, how
    // many tries, when the pre-roll starts, ads in a row — the same four switches the
    // driving screen has, written to each integration's own drive. Everything deeper
    // belongs to each integration's ad setup and is refused by name. The VALUES are
    // checked once, here — a bulk write never half-lands.
    slotType = bulkSlotType(value);
    const fields = (value && value.fields) || {};
    const allowed = store.DRIVE_FIELDS[slotType];
    const bad = Object.keys(fields).filter(k => !allowed.includes(k));
    if (bad.length) {
      throw new store.Refusal(400, 'bad_bulk', allowed.length
        ? `${bad.map(k => `“${store.fieldWord(k)}”`).join(', ')} is arranged in the ad setup — this act sets ${allowed.map(store.fieldWord).join(', ')}`
        : `a ${slotType} takes turns — nothing to decide beyond its switch`);
    }
    if (!Object.keys(fields).length) {
      throw new store.Refusal(400, 'bad_bulk', `nothing to change — this act sets ${allowed.map(store.fieldWord).join(', ')}`);
    }
    const vErrs = [];
    store.normalizeDrive({ [slotType]: fields }, vErrs);
    if (vErrs.length) throw new store.Refusal(400, 'bad_bulk', vErrs[0].message);
  } else {
    // Cohort setup-attach died with the 1:1 promise (26 Aug): one setup cannot fill a
    // cohort any more. The positional and override acts died with local overrides.
    throw new store.Refusal(400, 'bad_bulk', `Unknown bulk action: ${action}`);
  }

  // Player fields land on each integration — one player each since 25 Aug, so there is
  // no inherit/fork bookkeeping left to do here.
  if (action === 'playerFields') {
    const fields = {};
    for (const k of BULK_PLAYER_FIELDS) if (value.fields[k] !== undefined) fields[k] = value.fields[k];
    let changed = 0, unchanged = 0;
    const refused = [];
    for (const id of ids) {
      const existing = store.getKey(id);
      try {
        const { changes } = store.updateKeyPlayer(id, fields);
        if (changes.length) {
          changed++;
        } else unchanged++;
      } catch (e) {
        if (!(e instanceof store.Refusal)) throw e;
        refused.push(existing.name);
      }
    }
    return res.json({ changed, unchanged, refused, skipped: [] });
  }

  if (action === 'publish' || action === 'unpublish') {
    let changed = 0, unchanged = 0;
    const refused = [];
    for (const id of ids) {
      const existing = store.getKey(id);
      try {
        if (action === 'publish') {
          const { version } = store.publishObject('key', id);
        } else {
          store.unpublishObject('key', id);
        }
        changed++;
      } catch (e) {
        if (!(e instanceof store.Refusal)) throw e;
        if (e.code === 'nothing_to_publish' || e.code === 'not_live') unchanged++;
        else refused.push(`${existing.name} — ${e.message}`);
      }
    }
    return res.json({ changed, unchanged, refused, skipped: [] });
  }

  let changed = 0, unchanged = 0;
  const refused = [];
  const skipped = [];
  for (const id of ids) {
    const existing = store.getKey(id);
    let patch;
    if (action === 'driveFields') {
      // The named fields land on each integration's own drive, sparse — a field the
      // act does not mention keeps whatever the surface already decided. Sending
      // ask: 'setup' (or null) is the explicit way back to the setup's arrangement.
      const drive = JSON.parse(JSON.stringify(existing.drive || {}));
      const slot = { ...(drive[slotType] || {}) };
      for (const [f, v] of Object.entries(value.fields)) {
        if (v === null || v === 'setup') delete slot[f];
        else slot[f] = v;
      }
      if (Object.keys(slot).length) drive[slotType] = slot; else delete drive[slotType];
      patch = { drive };
    } else {
      const sections = JSON.parse(JSON.stringify(store.effectiveSections(existing)));
      const setup = store.resolvedSetup(existing);
      let lit = 0;
      for (const s of sections) {
        const slot = s.slots[slotType];
        const secDef = setup ? store.setupSection(setup, s.name) : null;
        if (action === 'slotOn') {
          // THE SEAM: switch on only where EVERY break group's walk has live demand.
          const hasDemand = secDef
            ? store.groupWalks(secDef, existing.drive?.[slotType], slotType).every(g => g.walk.length > 0)
            : false;
          if (hasDemand) { slot.on = true; lit++; }
          else skipped.push(`${existing.name} · ${s.name}`);
        } else if (action === 'slotOff') {
          slot.on = false;
        }
      }
      if (action === 'slotOn' && lit === 0) {
        refused.push(existing.name); // nothing to switch on anywhere in this integration
        continue;
      }
      patch = { sections };
    }
    try {
      const { obj, changes } = store.updateKey(id, patch);
      if (changes.length) {
        changed++;
      } else {
        unchanged++;
      }
    } catch (e) {
      if (!(e instanceof store.Refusal)) throw e;
      // e.g. attaching a setup that lacks demand for a switched-on slot, or leaving a
      // live Default with nothing on
      refused.push(existing.name);
    }
  }
  res.json({ changed, unchanged, refused, skipped });
}));

app.delete('/panel/keys/:id', handle((req, res) => {
  const obj = store.deleteKey(req.params.id);
  res.json({ deleted: obj.id });
}));

// ---------- ad setups (the ops room) ----------

function setupView(s) {
  const used = store.keysUsingSetup(s.id);
  // Under the 1:1 promise there is at most one attached surface — its drive decision
  // is named on each slot, so ops never debug a ghost ("why does it only try three?").
  const holder = used[0] || null;
  return {
    ...s,
    sections: s.sections.map(sec => ({
      name: sec.name,
      isDefault: sec.isDefault,
      slots: Object.fromEntries(store.SLOT_TYPES.map(t => {
        const lv = ladderView(sec.slots[t]);
        const drive = holder?.drive?.[t] || null;
        const gdefs = store.slotGroupDefs(sec.slots[t]);
        return [t, {
          ...lv,
          behaviour: sec.slots[t].behaviour,
          // A mid-roll's break groups, each the whole slot anatomy (31 Aug). Always
          // present on a mid-roll so the editor draws one grammar; single elsewhere.
          groups: t === 'midroll'
            // Each pod carries its OWN direct deal now (3 Sep) — the editor draws one
            // pod anatomy: a deal, a ladder, a cadence.
            ? gdefs.map(g => ({
              ...ladderView(g),
              behaviour: g.behaviour,
              direct: g.direct ? ladderView(g.direct) : null,
            }))
            : null,
          // The break's own direct tier (1 Sep) — ladder slots only.
          direct: sec.slots[t].direct ? ladderView(sec.slots[t].direct) : null,
          drive: drive ? { keyName: holder.name, ...drive } : null,
        }];
      })),
    })),
    usedBy: used.length,
    usedByNames: used.map(k => k.name),
    usedByLive: used.filter(k => store.isPublished(k.id)).length,
    liveCounts: store.setupLiveCounts(s.id),
    ...publishView('setup', s),
  };
}

app.get('/panel/setups', handle((req, res) => {
  res.json({ setups: store.listSetups().map(setupView) });
}));

app.get('/panel/setups/:id', handle((req, res) => {
  res.json({ setup: setupView(store.getSetup(req.params.id)) });
}));

// One placement's behaviour — how its ads behave, per slot. (Across-the-session died
// 27 Aug; a payload still carrying `rules` is refused by name.)
// This is where "Ad behaviour" went (25 Aug): one edit here reaches every attached
// integration, which is the whole reason the ops room exists.
app.patch('/panel/setups/:id/sections/:index/behaviour', handle((req, res) => {
  const { obj, section, changes, warnings } =
    store.updateSetupBehaviour(req.params.id, Number(req.params.index), req.body || {});
  res.json({ setup: setupView(obj), changes, warnings });
}));

app.post('/panel/setups', handle((req, res) => {
  const obj = store.createSetup(req.body);
  res.status(201).json({ setup: setupView(obj) });
}));

app.patch('/panel/setups/:id', handle((req, res) => {
  const { obj, changes, warnings } = store.updateSetup(req.params.id, req.body);
  res.json({ setup: setupView(obj), changes, warnings });
}));

// The 1:1 promise's escape hatch (26 Aug, DRIVING-SCOPE): "attach a copy". A
// photocopy — placements, ladders, behaviour — never a link.
app.post('/panel/setups/:id/duplicate', handle((req, res) => {
  const obj = store.duplicateSetup(req.params.id, req.body?.name);
  res.status(201).json({ setup: setupView(obj) });
}));

app.delete('/panel/setups/:id', handle((req, res) => {
  const obj = store.deleteSetup(req.params.id);
  res.json({ deleted: obj.id });
}));

// ---------- ad tags ----------
function tagView(t) {
  const inSetups = store.setupsUsingTag(t.id);
  const tpl = t.tplId ? store.listTemplates().find(x => x.id === t.tplId) : null;
  return {
    ...t,
    usedBy: inSetups.length,
    usedByNames: inSetups.map(s => s.name),
    // Standard is absence — the name shows only where the choice is news.
    tplName: tpl ? tpl.name : null,
    offDirectory: store.tagOffDirectory(t),
  };
}

app.get('/panel/tags', handle((req, res) => {
  res.json({ tags: store.listTags().map(tagView) });
}));

app.get('/panel/tags/:id', handle((req, res) => {
  res.json({ tag: tagView(store.getTag(req.params.id)) });
}));

app.post('/panel/tags', handle((req, res) => {
  const obj = store.createTag(req.body);
  res.status(201).json({ tag: tagView(obj) });
}));

app.patch('/panel/tags/:id', handle((req, res) => {
  const { obj, changes } = store.updateTag(req.params.id, req.body);
  res.json({ tag: tagView(obj), changes });
}));

app.delete('/panel/tags/:id', handle((req, res) => {
  const obj = store.deleteTag(req.params.id);
  res.json({ deleted: obj.id });
}));

// ---------- request templates ----------
// Plumbing behind a tag, not a room: a small list beside the tag library (31 Aug).
function templateView(t) {
  const inTags = store.tagsUsingTemplate(t.id);
  return { ...t, usedBy: inTags.length, usedByNames: inTags.map(x => x.name) };
}

app.get('/panel/templates', handle((req, res) => {
  res.json({ templates: store.listTemplates().map(templateView) });
}));

app.post('/panel/templates', handle((req, res) => {
  res.status(201).json({ template: templateView(store.createTemplate(req.body)) });
}));

app.patch('/panel/templates/:id', handle((req, res) => {
  const { obj, changes } = store.updateTemplate(req.params.id, req.body);
  res.json({ template: templateView(obj), changes });
}));

app.delete('/panel/templates/:id', handle((req, res) => {
  const obj = store.deleteTemplate(req.params.id);
  res.json({ deleted: obj.id });
}));

app.get('/panel/gam/units', handle((req, res) => {
  res.json(store.gamUnits(req.query.q));
}));

app.post('/panel/gam/sync', handle((req, res) => {
  const { added, lastSync } = store.gamSync();
  if (added.length) {
  }
  res.json({ added: added.length, units: added, lastSync });
}));

// ---------- mock ----------
app.post('/panel/mock/reset', handle((req, res) => {
  // Named scenarios: no argument rebuilds the demo seven; `scale` keeps those
  // seven and adds volume on top, for paging and select-all.
  resetWorld({ scenario: req.body?.scenario });
  res.json({ ok: true, scenario: req.body?.scenario || 'demo', integrations: store.listKeys().length });
}));

resetWorld();

const PORT = process.env.PANEL_PORT || 4200;
if (process.env.NODE_ENV !== 'test') {
  app.listen(PORT, () => console.log(`StreamAds panel API on http://localhost:${PORT}`));
}

export default app;
