// api/routes/meta.js — GET /panel/meta — the vocabulary the web app draws its controls from
// (enums, caps, presets, which fields each break and each drive may carry).
import express from 'express';
import * as store from '../store.js';
import { handle } from '../error-handler.js';
import { RULE_PRESETS, PLAYER_PRESETS, ME } from '../mock/world.js';
import { BULK_PLAYER_FIELDS } from './keys-bulk.js';

const r = express.Router();

// ---------- meta ----------
r.get('/panel/meta', handle((req, res) => {
  res.json({
    properties: store.PROPERTIES,
    // Who is signed in — read by the header band's profile mark. A fixture until auth
    // lands (see mock/world.js ME); the panel never invents an identity of its own.
    me: ME,
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

export default r;
