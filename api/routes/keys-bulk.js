// api/routes/keys-bulk.js — POST /panel/keys/bulk: the cohort acts the Integrations list offers
// over a selection (switch breaks on/off, publish/unpublish, set player fields, set
// drive fields). Every target is validated BEFORE any integration is touched, and the
// answer counts what changed, what was already there, what was refused and what was
// skipped — per name, never all-or-nothing.
import express from 'express';
import * as store from '../store.js';
import { handle } from '../error-handler.js';

const r = express.Router();

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
export const BULK_PLAYER_FIELDS = ['autoplay', 'passiveVolume',
  // The mini player call (31 Aug) — the one playback fact that is the player's.
  'expandInMini',
  // The DEFAULT playback mode (2 Sep) — a custom config is edited per surface through
  // the Player behaviour sheet, never blanket-written by a cohort action.
  'playback',
  // THE WHOLE PLAYER BEHAVIOUR CARD (11 Sep). Everything the card holds can be set
  // across a cohort, because every one of these is a decision a whole estate makes at
  // once: a brand refresh, a measurement id, a controls policy.
  'muted', 'rememberVolume', 'rememberAudioLang', 'rememberCaptions',
  'controlsMode', 'hiddenControls', 'playbackRates', 'controlsAutoHideMs',
  'dock', 'autoPausePct', 'loop', 'endScreen',
  'brandColor', 'textColor', 'logoUrl',
  'analyticsLevel', 'viewAfterMs', 'heartbeatMs', 'comscoreId', 'nielsenId', 'gaId'];

// WHAT A COHORT MAY NOT ANSWER (14 Sep, user call — *"define which fields are relevant for
// the bulk changes the team may want to do across integrations"*). Three of these were on
// the list from 25 Aug and one was never on it, and all four fail the same question: would
// a team ever want ONE answer on forty surfaces? Each is a value a single surface owns, so
// a blanket write is not a blunt instrument but a wrong one — and the shortlist the sheet
// draws is backed here, by name, rather than left as a courtesy of the UI.
// `playbackMode` is the sharpest of them: one type for the whole cohort strands each
// surface's own redirect, which `normalizePlayer` then blanks.
// The reasons are UI-ready sentences and travel on `/panel/meta`, because the sheet draws
// these rows greyed IN PLACE with the reason beside them: a shortlist the server and the
// screen spell differently is the drift this whole change is about.
export const BULK_NEVER_FIELDS = {
  playbackMode: 'One type for all of them would strand each surface’s own redirect',
  redirectUrl: 'A redirect target belongs to one surface',
  quality: 'A label the stream itself carries',
  fallbackMediaId: 'A media id belongs to one surface',
};

// ---------- THE CUSTOM CONFIGS, ACROSS A COHORT (15 Sep, user call) ----------
// `configFields` is the third cohort act on the Integrations list, and it is a different
// SHAPE from the other two on purpose. `playerFields` carries ONE answer for every selected
// integration, because a default player is one thing each surface has exactly one of. Custom
// configs are not that: an integration carries none, or six, each addressed by its own key,
// and what a team wants across forty of them is rarely one blanket answer — it is to see the
// forty and correct the ones that are wrong. So this act carries a LIST of per-config edits
// rather than a single value, and the sheet that builds it (views-keys-bulk-configs.js)
// resolves its "do this to all" shortcut into that list before it is ever sent. The wire
// therefore knows nothing about scopes or shortcuts: it takes edits, one per config.
//
//   value: { edits: [ { id, config, fields?, on? } ] }
//
// `fields` obeys the SAME two catalogues the player act does — and the four `BULK_NEVER`
// fields stay refused here too (user call, 15 Sep: keep them out entirely). A custom config
// being per-surface by nature is an argument for editing them on that surface's own page,
// which is where they remain; it is not an argument for letting a list screen write a
// redirect target it cannot possibly know is right.
// `null` is THE WAY BACK — the same grammar `driveFields` uses: a field sent as null drops
// the override and the config follows its integration's default again, live.
// Nothing here CREATES or REMOVES a config: an edit naming a key the integration does not
// carry is refused by name rather than quietly seeding one. Creating a config is a named,
// keyed act with its own ceiling (MAX_PLAYER_CONFIGS) and it belongs where a person can see
// what they are making.
function bulkConfigEdits(ids, value) {
  const edits = (value && value.edits) || [];
  if (!Array.isArray(edits) || !edits.length) {
    throw new store.Refusal(400, 'bad_bulk', 'Nothing to change — this act carries a list of config edits');
  }
  const known = new Set(ids);
  // Every named field, over every edit, checked ONCE and up front: a cohort write never
  // half-lands, and a refusal names the field beside the reason rather than dropping it.
  const owned = new Set();
  const unknown = new Set();
  for (const e of edits) {
    for (const f of Object.keys((e && e.fields) || {})) {
      if (BULK_NEVER_FIELDS[f]) owned.add(f);
      else if (!BULK_PLAYER_FIELDS.includes(f)) unknown.add(f);
    }
  }
  if (owned.size) {
    throw new store.Refusal(400, 'bad_bulk',
      [...owned].map(k => `“${store.fieldWord(k)}” is each integration’s own. ${BULK_NEVER_FIELDS[k]}`).join(' '));
  }
  if (unknown.size) {
    throw new store.Refusal(400, 'bad_bulk',
      `${[...unknown].map(k => `“${store.fieldWord(k)}”`).join(', ')} is not a player setting a config can override`);
  }
  // Every target resolved before anything is touched: the integration is in the selection,
  // and it already carries a config by that key.
  for (const e of edits) {
    const id = e && e.id;
    if (!known.has(id)) {
      throw new store.Refusal(400, 'bad_bulk', `“${id}” is not one of the selected integrations`);
    }
    const k = store.getKey(id);
    const name = String((e && e.config) || '');
    if (!(k.playerConfigs || []).some(c => c.name === name)) {
      throw new store.Refusal(400, 'bad_bulk',
        `“${k.name}” carries no custom config named “${name}” — configs are created on the integration, by key`);
    }
    if (e.fields === undefined && e.on === undefined) {
      throw new store.Refusal(400, 'bad_bulk', `Nothing to change on “${name}”`);
    }
  }
  // AND THE VALUES, DRY-RUN, BEFORE ANY INTEGRATION IS TOUCHED. `updateKey` would catch a
  // refused value on its own, but only on the integration it happened to reach — the ones
  // ahead of it in the loop would already have landed, which is the half-write this file
  // exists to prevent. So each integration's patched set is run through the SAME normalizer
  // first, with a throwaway error list, and a refusal names the config and the reason.
  for (const [id, group] of groupByKey(edits)) {
    const existing = store.getKey(id);
    const errors = [];
    store.normalizePlayerConfigs(bulkConfigPatch(existing, group).playerConfigs, existing.player, errors);
    if (errors.length) {
      throw new store.Refusal(400, 'bad_bulk', `“${existing.name}”: ${errors[0].message}`);
    }
  }
  return edits;
}

// The edits an integration receives, together — every write for one surface lands in one
// call, so a version reads as one line per moved field rather than one per edit.
function groupByKey(edits) {
  const by = new Map();
  for (const e of edits) {
    if (!by.has(e.id)) by.set(e.id, []);
    by.get(e.id).push(e);
  }
  return by;
}

// The edits for one integration, laid over its configs. Sparse: a config the list never
// names keeps every answer it already had.
function bulkConfigPatch(existing, edits) {
  const configs = store.deepCopy(existing.playerConfigs || []);
  for (const e of edits) {
    const c = configs.find(x => x.name === String(e.config));
    if (!c) continue;
    if (e.on !== undefined) c.on = !!e.on;
    for (const [f, v] of Object.entries(e.fields || {})) {
      if (v === null) delete c[f];   // the way back: follow the default again, live
      else c[f] = v;
    }
  }
  return { playerConfigs: configs };
}

function bulkSlotType(value) {
  const t = typeof value === 'string' ? value : value?.slot;
  if (!store.SLOT_TYPES.includes(t)) throw new store.Refusal(400, 'bad_bulk', `Unknown slot: ${t}`);
  return t;
}

// ---------- THE COHORT TALLY ----------
// Every cohort act answers the same way, and the file header says why: N integrations, each
// attempted on its own, counting what changed, what was already so, what was refused and what
// was skipped — per name, never all-or-nothing. That loop was written out once per act, four
// times over, which meant the answer's shape lived in four places and a fifth act would have
// made it five. It is written here once; an act now supplies only what it does to ONE
// integration.
//
// `applyOne` answers `true` if it wrote, `false` if the answer was already there, or `SKIPPED`
// when it has recorded its own reason and must not be counted either way.
//
// `store.getKey(id)` stays OUTSIDE the try on purpose: an id that names nothing is a fault in
// the caller, not a refusal to report per name, and it keeps travelling as it always did.
const SKIPPED = Symbol('skipped');

/** The ordinary refusal: the integration is named, and nothing more is said. */
const refuseByName = (e, existing, tally) => tally.refused.push(existing.name);

/**
 * Run one act across a cohort and count the outcomes.
 * @param {Iterable<[string, *]>} units       [id, argument] per integration
 * @param {(id: string, arg: *, existing: object, tally: object) => boolean|symbol} applyOne
 * @param {(e: Error, existing: object, tally: object) => void} classifyRefusal
 * @returns {{changed: number, unchanged: number, refused: string[], skipped: string[]}}
 */
function tallyCohort(units, applyOne, classifyRefusal) {
  const tally = { changed: 0, unchanged: 0, refused: [], skipped: [] };
  for (const [id, arg] of units) {
    const existing = store.getKey(id);
    try {
      const wrote = applyOne(id, arg, existing, tally);
      if (wrote === SKIPPED) continue;
      if (wrote) tally.changed++; else tally.unchanged++;
    } catch (e) {
      if (!(e instanceof store.Refusal)) throw e;
      classifyRefusal(e, existing, tally);
    }
  }
  return tally;
}

// THE QUICK DECISION lands on the integration's own drive, sparse — a field the act does not
// mention keeps whatever the surface already decided, and `null`/`setup` is the explicit way
// back to the ad setup's arrangement.
function driveFieldsPatch(existing, slotType, fields) {
  const drive = store.deepCopy(existing.drive || {});
  const slot = { ...(drive[slotType] || {}) };
  for (const [f, v] of Object.entries(fields)) {
    if (v === null || v === 'setup') delete slot[f];
    else slot[f] = v;
  }
  if (Object.keys(slot).length) drive[slotType] = slot; else delete drive[slotType];
  return { drive };
}

// THE SEAM: a break may only light where EVERY break group's walk has live demand. A section
// that cannot light is skipped BY NAME; an integration where none could light answers `null`,
// so it is refused and never written — which is what keeps a cohort switch-on from reporting
// a change it did not make.
function slotSwitchPatch(existing, slotType, action, skipped) {
  const sections = store.deepCopy(store.effectiveSections(existing));
  const setup = store.resolvedSetup(existing);
  let lit = 0;
  for (const s of sections) {
    const slot = s.slots[slotType];
    if (action === 'slotOff') { slot.on = false; continue; }
    const secDef = setup ? store.setupSection(setup, s.name) : null;
    const hasDemand = secDef
      ? store.groupWalks(secDef, existing.drive?.[slotType], slotType).every(g => g.walk.length > 0)
      : false;
    if (hasDemand) { slot.on = true; lit++; }
    else skipped.push(`${existing.name} · ${s.name}`);
  }
  return action === 'slotOn' && lit === 0 ? null : { sections };
}

r.post('/panel/keys/bulk', handle((req, res) => {
  const { ids, action, value } = req.body || {};
  if (!Array.isArray(ids) || ids.length === 0) {
    throw new store.Refusal(400, 'bad_bulk', 'Pick at least one integration');
  }

  // Validate the target before touching anything — a bulk write never half-lands.
  let slotType = null;
  let configEdits = null;
  if (action === 'publish' || action === 'unpublish') {
    // PUBLISHING A COHORT (27 Aug): the one act that replaced `status`. Each integration
    // is published on its own and answers the darkness question for itself, so a cohort
    // publish is N publishes that report per name — never one all-or-nothing swap.
  } else if (BULK_SLOT_ACTIONS.includes(action)) {
    slotType = bulkSlotType(value);
  } else if (action === 'playerFields') {
    const fields = (value && value.fields) || {};
    // Refused BY NAME, next to the reason — never dropped quietly, or a cohort write would
    // report "changed" for an answer it never wrote.
    const owned = Object.keys(fields).filter(k => BULK_NEVER_FIELDS[k]);
    if (owned.length) {
      throw new store.Refusal(400, 'bad_bulk',
        owned.map(k => `“${store.fieldWord(k)}” is each integration’s own. ${BULK_NEVER_FIELDS[k]}`).join(' '));
    }
    const allowed = Object.keys(fields).filter(k => BULK_PLAYER_FIELDS.includes(k));
    if (!allowed.length) {
      throw new store.Refusal(400, 'bad_bulk',
        `nothing to change — this act sets ${BULK_PLAYER_FIELDS.slice(0, 8).map(store.fieldWord).join(', ')}, …`);
    }
  } else if (action === 'configFields') {
    configEdits = bulkConfigEdits(ids, value);
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
    return res.json(tallyCohort(
      ids.map(id => [id]),
      id => store.updateKeyPlayer(id, fields).changes.length > 0,
      refuseByName,
    ));
  }

  // THE CONFIG EDITS LAND PER INTEGRATION, all of that integration's at once — so a surface
  // whose `shorts` and `amp_stories` both moved is ONE version line, not two, and the
  // normalizer sees the whole set exactly as the editor would have sent it.
  if (action === 'configFields') {
    return res.json(tallyCohort(
      groupByKey(configEdits),
      (id, edits, existing) => store.updateKey(id, bulkConfigPatch(existing, edits)).changes.length > 0,
      refuseByName,
    ));
  }

  if (action === 'publish' || action === 'unpublish') {
    return res.json(tallyCohort(
      ids.map(id => [id]),
      id => {
        if (action === 'publish') store.publishObject('key', id);
        else store.unpublishObject('key', id);
        return true;
      },
      // "Nothing to publish" and "not live" are not refusals to report — they are the
      // already-so answer wearing an exception, so they count as unchanged.
      (e, existing, tally) => {
        if (e.code === 'nothing_to_publish' || e.code === 'not_live') tally.unchanged++;
        else tally.refused.push(`${existing.name} — ${e.message}`);
      },
    ));
  }

  // The switch and the quick decision share one loop because they share one shape: build this
  // integration's patch, then write it. Only the patch differs.
  res.json(tallyCohort(
    ids.map(id => [id]),
    (id, _arg, existing, tally) => {
      const patch = action === 'driveFields'
        ? driveFieldsPatch(existing, slotType, value.fields)
        : slotSwitchPatch(existing, slotType, action, tally.skipped);
      if (patch === null) { tally.refused.push(existing.name); return SKIPPED; }
      return store.updateKey(id, patch).changes.length > 0;
    },
    // e.g. attaching a setup that lacks demand for a switched-on slot, or leaving a
    // live Default with nothing on
    refuseByName,
  ));
}));

export default r;
