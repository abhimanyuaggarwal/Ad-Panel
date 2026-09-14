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
export const BULK_PLAYER_FIELDS = ['autoplay', 'passiveVolume', 'playbackMode', 'fallbackMediaId',
  // The mini player call (31 Aug) — the one playback fact that is the player's.
  'expandInMini',
  // The DEFAULT playback mode (2 Sep) — custom configs are edited per surface through
  // the Player behaviour sheet, never blanket-written by a cohort action.
  'playback',
  // THE WHOLE PLAYER BEHAVIOUR CARD (11 Sep). Everything the card holds can be set
  // across a cohort, because every one of these is a decision a whole estate makes at
  // once: a brand refresh, a measurement id, a controls policy. The SHEET still offers
  // only the six a fork may also carry — a cohort act is a blunt instrument and the
  // narrow sheet is the deliberate choice — but the capability is a row away rather
  // than a release away, which is exactly the trade the 7 Sep volume note recorded.
  'quality', 'muted', 'rememberVolume', 'rememberAudioLang', 'rememberCaptions',
  'controlsMode', 'hiddenControls', 'playbackRates', 'controlsAutoHideMs',
  'dock', 'autoPausePct', 'loop', 'endScreen',
  'brandColor', 'textColor', 'logoUrl',
  'analyticsLevel', 'viewAfterMs', 'heartbeatMs', 'comscoreId', 'nielsenId', 'gaId'];

function bulkSlotType(value) {
  const t = typeof value === 'string' ? value : value?.slot;
  if (!store.SLOT_TYPES.includes(t)) throw new store.Refusal(400, 'bad_bulk', `Unknown slot: ${t}`);
  return t;
}

r.post('/panel/keys/bulk', handle((req, res) => {
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
          store.publishObject('key', id);
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

export default r;
