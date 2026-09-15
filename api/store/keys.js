// store/keys.js — integrations (the product room's object): identity, the player and
// its custom configs, the drive (per-break quick decisions), the section switches, and
// the seam that refuses a switch no published demand could fill.
import { DRIVE_FIELDS, askWord, driveAsk, driveWalkRungs, effectiveBehaviour, normalizeCuepoints, slotGroupDefs } from './ladders.js';
import { isPublished } from './publish.js';
import { duplicateSetup, setupSection } from './setups.js';
import { ANALYTICS_LEVELS, AUTOPLAY, CONTROLS_MODES, DOCK_POSITIONS, END_SCREENS, FIELD_WORDS, HEADER_BIDDING, MAX_POD_ADS, MAX_RUNGS, MAX_SECTIONS, MIDROLL_EVERY_MAX, MIDROLL_EVERY_MIN, MIDROLL_MODES, PLATFORMS, PLAYBACK_RATES, PLAYER_CONTROLS, PLAYER_FIELDS, PLAYBACK_KINDS, PLAYBACK_MODES, PREROLL_TIMING, PROPERTIES, PROVIDER_WORD, Refusal, SLOT_TYPES, SLOT_WORD, TAG_PROVIDERS, WEB_PLATFORMS, WORST_CASE_WARN_MS, deepCopy, fieldWord, keyString, state, updateStamp } from './state.js';
import { DOMAIN_RE, PACKAGE_RE, bool, diff, fmtSecs, hexColor, httpUrl, intIn, mustGet, oneOf, str, uniqueName } from './validate.js';


// ---------- player fields (inline — no identity) ----------
// The old "player setup" object minus its name: a complete statement of how the
// player acts before an ad ever shows, carried by each section.

// The PLAYER, after the 25 Aug trim: how the surface starts a video, and what it plays
// when nothing else is available. Five fields, so it is no longer a card — the
// integration's Identity carries them (see panel/PRODUCT-LOG.md). Key-level, not per
// placement: what genuinely varied per placement was AD SOUND, and that is a slot field
// now, which is more precise than a whole forked player ever was.
// A list of names held to a fixed vocabulary the PLAYER TEAM owns — the tag-macro rule,
// applied to control names: an unknown one is refused by name rather than saved as a
// setting that silently does nothing (Q6 — the list itself is provisional).
function nameList(input, allowed, field, why, errs) {
  if (input === undefined || input === null) return [];
  if (!Array.isArray(input)) {
    errs.push({ field, message: `${fieldWord(field)} must be a list` });
    return [];
  }
  const out = [];
  for (const v of input) {
    const n = str(v);
    if (!n) continue;
    if (!allowed.includes(n)) { errs.push({ field, message: `“${n}” ${why} — ${allowed.join(', ')}` }); continue; }
    if (!out.includes(n)) out.push(n);
  }
  return out;
}

// The speeds offered, as a SET in the player's own order. 1x is never removable: a
// player a viewer cannot return to normal speed on is a defect, not a configuration.
function rateList(input, errs) {
  if (input === undefined || input === null) return [...PLAYBACK_RATES];
  if (!Array.isArray(input)) {
    errs.push({ field: 'playbackRates', message: 'Speeds must be a list' });
    return [...PLAYBACK_RATES];
  }
  const out = [];
  for (const v of input) {
    const n = Number(v);
    if (!PLAYBACK_RATES.includes(n)) { errs.push({ field: 'playbackRates', message: `${n}× is not a speed the player offers — ${PLAYBACK_RATES.join(', ')}` }); continue; }
    if (!out.includes(n)) out.push(n);
  }
  if (!out.includes(1)) out.push(1);
  return PLAYBACK_RATES.filter(r => out.includes(r));
}

// Q11, answered: 0 is off, 10–100 is a real threshold, and 1–9 is refused BY NAME —
// below 10% the player cannot tell, so a value it silently ignores never gets saved.
function pausePct(v, errs) {
  const n = Number(v ?? 0);
  if (!Number.isInteger(n) || n < 0 || n > 100) {
    errs.push({ field: 'autoPausePct', message: `Pause below visibility must be 0 (off) or 10–100 (got ${v})` });
    return 0;
  }
  if (n > 0 && n < 10) {
    errs.push({ field: 'autoPausePct', message: `Below 10% the player cannot tell — pick 10 or more, or switch it off (got ${n})` });
    return 0;
  }
  return n;
}

export function normalizePlayer(input, errors, prefix = '') {
  const errs = [];
  if (input.startVolume !== undefined) {
    errs.push({ field: 'player', message: 'startVolume is gone — the player carries one Passive volume (JSON: passiveVolume), set on the Player behaviour card' });
  }
  const b = {
    autoplay: oneOf(input.autoplay ?? 'auto', 'autoplay', AUTOPLAY, errs),
    passiveVolume: intIn(input.passiveVolume ?? 100, 'passiveVolume', 0, 100, errs),
    playbackMode: oneOf(input.playbackMode, 'playbackMode', PLAYBACK_MODES, errs),
    redirectUrl: str(input.redirectUrl),
    fallbackMediaId: str(input.fallbackMediaId),
    // The one playback fact that IS the player's (31 Aug, corrected same day): whether
    // banners expand in the mini player. Prefetch and the pre-roll's content head start
    // moved to the SLOTS they describe — a break's pacing is the break's.
    expandInMini: input.expandInMini === undefined ? true : bool(input.expandInMini),
    // Active is the default; absent reads 'active' so every player saved before the
    // field existed keeps behaving exactly as it did.
    playback: oneOf(input.playback ?? 'active', 'playback', PLAYBACK_KINDS, errs),

    // ---------- the Player behaviour card (11 Sep, docs/PLAYER-LEVERS.xlsx) ----------
    // Every field below defaults to what the player's own config block defaults to, so
    // an integration saved before they existed reads exactly as the player already
    // behaves. PLAYBACK SOURCE:
    quality: str(input.quality) || 'auto',
    // STARTUP BEHAVIOUR. Q2 is open — three settings can silence a video and the
    // precedence is not written down anywhere yet.
    muted: input.muted === undefined ? false : bool(input.muted),
    // VIEWER PREFERENCES — the viewer's own choices, remembered between sessions.
    rememberVolume: input.rememberVolume === undefined ? true : bool(input.rememberVolume),
    rememberAudioLang: input.rememberAudioLang === undefined ? true : bool(input.rememberAudioLang),
    rememberCaptions: input.rememberCaptions === undefined ? true : bool(input.rememberCaptions),
    // PLAYBACK CONTROLS. The three below the mode are subordinate to it: they are kept
    // whatever it says (nothing is lost by switching to None and back) and the UI greys
    // them where they sit, the house rule everywhere else on the page.
    controlsMode: oneOf(input.controlsMode ?? 'full', 'controlsMode', CONTROLS_MODES, errs),
    hiddenControls: nameList(input.hiddenControls, PLAYER_CONTROLS, 'hiddenControls',
      'is not a control the player draws', errs),
    playbackRates: rateList(input.playbackRates, errs),
    // 0 = never hide. On screen that is the switch's Off; on the wire it stays 0.
    controlsAutoHideMs: intIn(input.controlsAutoHideMs ?? 5000, 'controlsAutoHideMs', 0, 60000, errs),
    // OUT-OF-VIEW BEHAVIOUR.
    dock: oneOf(input.dock ?? 'lb', 'dock', DOCK_POSITIONS, errs),
    autoPausePct: pausePct(input.autoPausePct, errs),
    // COMPLETION BEHAVIOUR — the two facts a fork may legitimately disagree about.
    loop: input.loop === undefined ? false : bool(input.loop),
    endScreen: oneOf(input.endScreen ?? 'none', 'endScreen', END_SCREENS, errs),
    // BRANDING & APPEARANCE — the property's, never a placement's.
    brandColor: str(input.brandColor) || '#ff0000',
    textColor: str(input.textColor) || '#ffffff',
    logoUrl: str(input.logoUrl),
    // ANALYTICS & MEASUREMENT — never forkable, or every reported number splits.
    analyticsLevel: intIn(input.analyticsLevel ?? 3, 'analyticsLevel', 1, 3, errs),
    viewAfterMs: intIn(input.viewAfterMs ?? 3000, 'viewAfterMs', 0, 60000, errs),
    heartbeatMs: intIn(input.heartbeatMs ?? 10000, 'heartbeatMs', 0, 600000, errs),
    comscoreId: str(input.comscoreId),
    nielsenId: str(input.nielsenId),
    gaId: str(input.gaId),
  };
  for (const [f, word] of [['brandColor', 'Brand colour'], ['textColor', 'Text colour']]) {
    if (!hexColor(b[f])) errs.push({ field: f, message: `${word} must be a hex colour like #1a2b3c (got ${b[f]})` });
    else b[f] = b[f].toLowerCase();
  }
  if (b.logoUrl && !httpUrl(b.logoUrl)) {
    errs.push({ field: 'logoUrl', message: 'The logo needs a full URL (https://…) — the player loads it as an image' });
  }
  if (b.playbackMode === 'inline_redirect' && !httpUrl(b.redirectUrl)) {
    errs.push({ field: 'redirectUrl', message: 'Inline + custom redirect needs a full redirect URL (https://…)' });
  }
  if (b.playbackMode !== 'inline_redirect') b.redirectUrl = '';
  for (const e of errs) errors.push({ field: e.field, message: prefix + e.message });
  return b;
}

// ---------- custom player configs: DEFAULT + SPARSE OVERRIDES (13 Sep, user call) ----------
// ONE default player per integration stays the rule — the Default player config card.
// A surface may carry a few NAMED custom configs a player asks for by key, and a custom
// config may override ANY of the player's fields. It carries ONLY what it overrides:
// absent means "follow the default", resolved LIVE at read time (see liveConfig), so
// moving a lever on the default moves every config that never spoke about it. Each
// override is validated by the SAME normalizer the default runs through — the config's
// overrides are laid over the default, checked whole, and only the override keys are
// kept — so there is exactly one set of rules and no second copy to drift.
// This supersedes the 11 Sep six-field fork rule and the 7 Sep one-volume refusal: what
// a fork may not do is no longer a refusal list, it is VISIBILITY — every override is
// named on the row, in the editor and in the change review.
// 6 → 20 (15 Sep, user call). Six was never a rule about players, it was a guess about how many
// a card grid could hold; the grid grew a counted door and a key filter instead (see
// `pcGridHtml`). A ceiling still exists — a config is addressed by key in player code, and an
// integration carrying hundreds of them is a modelling mistake this refusal should catch — but it
// is now high enough to be about the product rather than about the screen.
export const MAX_PLAYER_CONFIGS = 20;
export function normalizePlayerConfigs(input, player, errors) {
  if (input === undefined || input === null) return [];
  if (!Array.isArray(input)) {
    errors.push({ field: 'playerConfigs', message: 'Custom configs must be a list' });
    return [];
  }
  if (input.length > MAX_PLAYER_CONFIGS) {
    errors.push({ field: 'playerConfigs', message: `At most ${MAX_PLAYER_CONFIGS} custom configs per integration (got ${input.length})` });
  }
  const seen = new Set(['default']);
  // Ids are stable across saves (a rename is a rename, not a new config); a config
  // arriving without one is issued the first free pc_n within this integration.
  const used = new Set(input.map(c => str(c && c.id)).filter(Boolean));
  let n = 1;
  return input.slice(0, MAX_PLAYER_CONFIGS).map(c => {
    const errs = [];
    const name = str(c.name);
    // A config is addressed by a KEY (3 Sep, user call): one word, so it survives being
    // typed into player code and query strings without quoting games.
    if (!name) errs.push({ message: 'Every custom config needs a key — players ask for it by key' });
    else if (!/^[A-Za-z0-9_-]{1,24}$/.test(name)) errs.push({ message: `a config key is ONE word — letters, numbers, _ or - (got “${name}”)` });
    else if (seen.has(name.toLowerCase())) errs.push({ message: 'Two configs share this key — a player asking by key must find exactly one' });
    seen.add(name.toLowerCase());
    let id = str(c.id);
    if (!id) {
      while (used.has(`pc_${n}`)) n++;
      id = `pc_${n}`;
      used.add(id);
    }
    // The one legacy key still refused by name: it was retired with the 3 Sep volume
    // rework and a payload carrying it is a payload built against a dead contract.
    if (c.startVolume !== undefined) {
      errs.push({ message: 'startVolume is gone — the volume is passiveVolume (Passive volume)' });
    }
    // THE OVERRIDES, validated as one player. Laying them over the default and running
    // the whole through normalizePlayer means a config obeys every rule the default does
    // — hex colours, the visibility floor, the control vocabulary — with no second list.
    const ov = {};
    for (const f of PLAYER_FIELDS) if (c[f] !== undefined) ov[f] = c[f];
    const whole = normalizePlayer({ ...player, ...ov }, errs, '');
    const out = {
      id, name,
      // The row's own switch (4 Sep, user call) — a rung's grammar: absence is on, so
      // every config saved before the switch existed keeps serving. Off keeps the row,
      // its key and its overrides; players asking for it follow the default player, and
      // the emitted JSON never carries it (see liveConfig).
      on: c.on === undefined ? true : bool(c.on),
    };
    // WHAT WAS SENT IS WHAT IS HELD — an override equal to today's default is still an
    // override, because it says "this config stays here when the default moves", which
    // is intent the equality would erase. The editor's own `Follow default` is the one
    // way an override leaves. The single exception is the redirect URL the normalizer
    // itself blanks when the (possibly inherited) player type is not a redirect.
    for (const f of Object.keys(ov)) {
      if (f === 'redirectUrl' && whole.playbackMode !== 'inline_redirect') continue;
      out[f] = whole[f];
    }
    for (const e of errs) {
      errors.push({ field: 'playerConfigs', message: name ? `“${name}”: ${e.message}` : e.message });
    }
    return out;
  });
}

export function normalizeSection(input, index, errors, warnings, seenNames) {
  const isDefault = index === 0;
  const name = isDefault ? 'Default' : str(input.name);
  if (!isDefault) {
    if (!name) errors.push({ field: 'sections', message: `Section ${index + 1} needs a name` });
    else if (seenNames.has(name.toLowerCase())) {
      errors.push({ field: 'sections', message: `Two sections are both named “${name}”` });
    }
  }
  seenNames.add(name.toLowerCase());


  if (input.slots?.squeezeback && Object.keys(input.slots.squeezeback).length) {
    errors.push({ field: 'sections', message: `“${name}”: the squeeze-back slot is gone — a banner over playing content is a rung of the break\u2019s waterfall, and the idle player\u2019s rotation is Out-stream` });
  }
  const slots = {};
  for (const type of SLOT_TYPES) {
    const raw = input.slots?.[type] || {};
    // Local overrides are GONE (26 Aug, DRIVING-SCOPE): the walk is arranged in the
    // integration's own setup now, and the quick decisions live at key level in
    // `drive`. Removed, not hidden — a payload still carrying one is refused by name.
    if ((Array.isArray(raw.muted) && raw.muted.length) || (Array.isArray(raw.order) && raw.order.length)
      || (raw.bhv && typeof raw.bhv === 'object' && Object.keys(raw.bhv).length)) {
      errors.push({ field: 'sections', message: `“${name}” cannot carry its own walk any more — arrange the ladder in the ad setup (it is this integration's alone), and make quick decisions in Ad delivery` });
    }
    slots[type] = { on: bool(raw.on) };
  }

  return { name, isDefault, slots };
}

// THE DRIVE DECISION, normalized (26 Aug, DRIVING-SCOPE): per break, sparse, intent
// only. `ask` is the ordered list of partners (27 Aug — it replaced `who`, whose two
// shapes were a dropdown's limits rather than the model's), `tries` counts real tries,
// and `start`/`deferSec`/`podAds` are the timing switches worth having while driving.
// `deferSec` joined them 27 Aug on the user's call, reversing the 26 Aug "seconds stay
// ops'" line: a surface that may defer its pre-roll may as well say by how long. An
// unknown field is refused by name — everything else is arranged in the ad setup.
// ---------- WHAT EACH QUICK DECISION MEANS ----------
// One writer per drive field, keyed by the field's own name. This was a ten-arm `else if`
// chain inside two loops: the shape that gains an arm every time the drive gains a lever,
// and that buries the four fields carrying real reasoning among six that only call `intIn`.
// A table gives each field one line, puts its reasoning beside it, and takes the chain's
// two levels of nesting out of `normalizeDrive`.
//
// A writer takes the value and an error collector and writes its OWN key on `out` — or
// writes nothing, which is how `direct` says "absence is on" and how a refused value leaves
// the field unset. `DRIVE_FIELDS[t]` still decides WHICH of these a break may use; this
// table only says what each one means. A field with no writer is ignored exactly as the
// chain's missing `else` ignored it.
const DRIVE_WRITERS = {
  ask: (v, errs, out) => {
    if (!Array.isArray(v)) {
      errs.push({ field: 'drive', message: 'the ad partners are a list, in the order they are asked' });
      return;
    }
    const bad = v.filter(p => !TAG_PROVIDERS.includes(p));
    if (bad.length) errs.push({ field: 'drive', message: `${bad.map(p => `“${p}”`).join(', ')} is not an ad partner — ${TAG_PROVIDERS.map(p => PROVIDER_WORD[p]).join(', ')}` });
    else if (!v.length) errs.push({ field: 'drive', message: 'a break with every partner switched off would ask nobody — leave one on, or switch the break off' });
    else out.ask = driveAsk(v);
  },

  // The surface's switch over THIS break's direct tier: absence is on, so only the off
  // answer is stored — dropping it follows the setup again.
  direct: (v, errs, out) => { if (v === false) out.direct = false; },

  tries: (v, errs, out) => { out.tries = intIn(v, 'tries', 1, MAX_RUNGS, errs); },
  start: (v, errs, out) => { out.start = oneOf(v, 'start', PREROLL_TIMING, errs); },
  // NOTE the floor: a surface may defer by 1 s where the ad setup's own floor is 3 s
  // (`ladders.js`). Left as found — see the refactor's decision log.
  deferSec: (v, errs, out) => { out.deferSec = intIn(v, 'deferSec', 1, 60, errs); },
  podAds: (v, errs, out) => { out.podAds = intIn(v, 'podAds', 1, MAX_POD_ADS, errs); },
  mode: (v, errs, out) => { out.mode = oneOf(v, 'mode', MIDROLL_MODES, errs); },
  every: (v, errs, out) => { out.every = intIn(v, 'every', MIDROLL_EVERY_MIN, MIDROLL_EVERY_MAX, errs); },

  cuepoints: (v, errs, out) => {
    const cps = normalizeCuepoints(v, errs, 'drive');
    // A cadence with nowhere to fall is a dark break, not a decision.
    if (!errs.length && !cps.length) {
      errs.push({ field: 'drive', message: 'a mid-roll needs at least one break position — clear the decision to follow the ad setup again' });
    } else if (!errs.length) out.cuepoints = cps;
  },

  // The surface names the partners, or says nobody. `auto` is the AD SETUP's word for
  // "borrow the global" and means nothing here: absence already says "follow the setup",
  // whatever it resolves to — so it is refused by name rather than stored as a second way
  // of saying the same thing.
  headerBidding: (v, errs, out) => {
    if (v === 'auto') {
      errs.push({ field: 'drive', message: 'Auto is the ad setup’s own answer — a surface either names the partners, switches them off, or leaves this to the setup' });
      return;
    }
    out.headerBidding = oneOf(v, 'headerBidding', HEADER_BIDDING, errs);
  },
};

export function normalizeDrive(input, errors) {
  const raw = input && typeof input === 'object' ? input : {};
  const drive = {};
  for (const [t, fieldsIn] of Object.entries(raw)) {
    if (!SLOT_TYPES.includes(t)) {
      errors.push({ field: 'drive', message: `“${t}” is not a break` });
      continue;
    }
    if (!fieldsIn || typeof fieldsIn !== 'object') continue;
    const allowed = DRIVE_FIELDS[t];
    const out = {};
    for (const [f, v] of Object.entries(fieldsIn)) {
      if (v === null || v === undefined) continue; // an explicit clear
      if (!allowed.includes(f)) {
        errors.push({ field: 'drive', message: allowed.length
          ? `The ${SLOT_WORD[t].toLowerCase()} quick decisions are ${allowed.map(fieldWord).join(', ')} — ${FIELD_WORDS[f] || `“${f}”`} is arranged in the ad setup`
          : `A ${SLOT_WORD[t].toLowerCase()} takes turns — nothing to decide beyond its switch` });
        continue;
      }
      // `setup` IS THE CLEAR, FOR EVERY FIELD (generalised 11 Sep). It was read only inside
      // `ask`, so the bulk sheet's own "follow the ad setup" answer — which it sends for any
      // lever, `Waterfall depth · Full` included — came back 400 *"must be a whole number
      // between 1 and 10 (got setup)"*. Absence is how this object says "follow the setup",
      // so the word that means that is dropped here, once, for all of them.
      if (v === 'setup') continue;
      const errs = [];
      DRIVE_WRITERS[f]?.(v, errs, out);
      for (const e of errs) errors.push({ field: 'drive', message: `${SLOT_WORD[t].toLowerCase()}: ${e.message}` });
    }
    if (Object.keys(out).length) drive[t] = out;
  }
  return Object.keys(drive).length ? drive : null;
}

// Refusals speak the UI's words, not the enum's (7 Sep, UAT).
const PLATFORM_WORD = { mweb: 'Mweb', desktop: 'Desktop', android: 'Android', ios: 'iOS' };

// ---------- THE SEAM, PRODUCT SIDE ----------
// A switched-on break must have somewhere to ask. These three read one placement, one
// break and one pod in turn, collecting refusals by name rather than throwing, because
// normalizeKey refuses once with every problem said. `ctx` carries what the words are
// built from: { setup, drive, errors, fellBack }.

/** One placement's switched-on breaks, checked against the attached setup. */
function checkPlacementSeam(section, ctx) {
  const secDef = ctx.setup ? setupSection(ctx.setup, section.name) : null;
  for (const t of SLOT_TYPES) {
    if (!section.slots[t].on) continue;
    if (checkSwitchedOnBreak(section, t, secDef, ctx)) break;
  }
}

/**
 * One switched-on break, checked.
 * @returns {boolean} true when the whole PLACEMENT is missing from the setup — the caller
 *   stops there, because that one refusal already covers every break under it.
 */
function checkSwitchedOnBreak(section, t, secDef, ctx) {
  const { setup, errors } = ctx;
  const breakWord = `“${section.name}” ${SLOT_WORD[t].toLowerCase()}`;
  if (!setup) {
    errors.push({ field: 'sections', message: `${breakWord} is switched on but no ad setup is attached — nothing could fill it. Ad ops connect one from their room` });
    return false;
  }
  if (!secDef) {
    errors.push({ field: 'sections', message: `“${section.name}” is not a placement in “${setup.name}” — placements live in the ad setup now; ad ops add them there` });
    return true;
  }
  const pods = slotGroupDefs(secDef.slots[t]);
  if (pods.every(g => !g.rungs.length)) {
    errors.push({ field: 'sections', message: `${breakWord} is switched on but “${setup.name}” carries no ${SLOT_WORD[t].toLowerCase()} demand there — ask ad ops, or switch it off` });
    return false;
  }
  checkPodsAnswer(section, t, pods, ctx);
  return false;
}

// Every break group answers for itself — one dark group is one dark break. A decision the
// pod cannot honour falls back to the setup's own arrangement, noted for the warning the
// caller words later.
function checkPodsAnswer(section, t, pods, ctx) {
  const { drive, errors, fellBack } = ctx;
  const isMulti = pods.length > 1;
  pods.forEach((g, gi) => {
    const r = driveWalkRungs(g.rungs, g.behaviour, drive?.[t], t);
    const gWord = isMulti ? ` pod ${gi + 1}` : '';
    if ((r.fellBack || r.vacuous) && gi === 0) (fellBack[t] = fellBack[t] || []).push(section.name);
    if (r.walk.length) return;
    errors.push({ field: 'sections', message: !g.rungs.length
      ? `“${section.name}” ${SLOT_WORD[t].toLowerCase()}${gWord} is switched on but carries no demand — ask ad ops, or remove the pod`
      : `“${section.name}” ${SLOT_WORD[t].toLowerCase()}${gWord} is switched on but every ad source is off by ad ops — switch one on in the ad setup, or switch the unit off` });
  });
}

export function normalizeKey(input, exceptId, { driveTouched = true } = {}) {
  const errors = [];
  const warnings = [];
  const name = str(input.name);
  if (!name) errors.push({ field: 'name', message: 'Name is required' });
  else if (!uniqueName(state.keys, name, exceptId)) {
    errors.push({ field: 'name', message: `An integration named “${name}” already exists` });
  }

  const k = {
    name,
    // ONE player per integration (25 Aug): five fields about how this surface starts a
    // video. Nothing in it varies by placement any more.
    player: normalizePlayer(input.player || {}, errors, 'Player: '),
    property: oneOf(input.property, 'property', PROPERTIES, errors),
    platform: oneOf(input.platform, 'platform', PLATFORMS, errors),
    domains: Array.isArray(input.domains) ? input.domains.map(d => str(d).toLowerCase()).filter(Boolean) : [],
    packageName: str(input.packageName),
  };
  // The named forks of the player's per-placement facts; [] is the common case.
  k.playerConfigs = normalizePlayerConfigs(input.playerConfigs, k.player, errors);

  if (WEB_PLATFORMS.includes(k.platform)) {
    k.packageName = '';
    if (k.domains.length === 0) {
      errors.push({ field: 'domains', message: `${PLATFORM_WORD[k.platform] || k.platform} integrations need at least one domain — the player refuses requests from anywhere else` });
    }
    for (const d of k.domains) {
      if (!DOMAIN_RE.test(d)) errors.push({ field: 'domains', message: `“${d}” is not a valid domain` });
    }
  } else {
    k.domains = [];
    if (!PACKAGE_RE.test(k.packageName)) {
      errors.push({ field: 'packageName', message: `${PLATFORM_WORD[k.platform] || k.platform} integrations need a valid package name (e.g. com.toi.reader)` });
    }
  }

  // ONE setup per integration (25 Aug) — the attachment is key-level, and that half of
  // the rule stands: a surface asks from exactly one ad setup.
  // …BUT A SETUP MAY FILL MANY INTEGRATIONS (8 Sep, user call — "allow the ad setup to
  // be configured in multiple integrations"). The 26 Aug promise ran the other way and
  // was enforced here by name; it made every real case of shared demand — the same
  // ladder across mweb, desktop and app — a fleet of photocopies that drifted apart the
  // first time anyone tuned one. Sharing is now the platform's answer: the attachment is
  // a LINK, one setup edited in one room moving every surface that asks from it, which
  // is the point. What protects the fleet is not a refusal here but knowing WHO ELSE
  // asks — `usedBy`/`usedByNames` already count every holder, the setup's own page names
  // them, and the integration's Use screen states it before the link is made.
  if (input.status !== undefined) {
    errors.push({ field: 'status', message: 'Live or paused is not a field any more — an integration is on air when it is published, and Unpublish takes it down' });
  }

  k.adSetupId = str(input.adSetupId) || null;
  if (k.adSetupId && !state.setups.has(k.adSetupId)) {
    errors.push({ field: 'adSetupId', message: 'That ad setup doesn\'t exist' });
    k.adSetupId = null;
  }
  const setup = k.adSetupId ? state.setups.get(k.adSetupId) : null;

  // The quick decisions, key-level: they apply to every section of the surface.
  k.drive = normalizeDrive(input.drive, errors);

  const rawSections = Array.isArray(input.sections) ? input.sections : [];
  if (rawSections.length === 0) {
    errors.push({ field: 'sections', message: 'An integration needs its Default ad section' });
  }
  if (rawSections.length > MAX_SECTIONS) {
    errors.push({ field: 'sections', message: `At most ${MAX_SECTIONS} ad sections per integration (got ${rawSections.length})` });
  }
  const seenNames = new Set();
  k.sections = rawSections.slice(0, MAX_SECTIONS).map((s, i) => normalizeSection(s, i, errors, warnings, seenNames));

  // THE SEAM, product side (fail closed, with names): a switched-on slot needs the
  // attached setup to carry that PLACEMENT with live demand for that family — and a
  // drive decision the world cannot honour anywhere refuses rather than serving the
  // wrong thing. A decision some sections cannot honour falls back there, warned by
  // name (26 Aug, user call: dark until noticed is the harmful option).
  const fellBack = {}; // slot type -> sections that fall back to the setup's arrangement
  const seamCtx = { setup, drive: k.drive, errors, fellBack };
  for (const s of k.sections) checkPlacementSeam(s, seamCtx);
  // SEVERAL CADENCES ARE AN ARRANGEMENT (3 Sep). One cuepoint answer cannot stand for a
  // mid-roll that runs two or three break groups, each with its own — so rather than
  // flatten ad ops' work silently, the decision is refused by name, pointing at the room
  // that owns it. The panel greys the row in place for the same reason.
  const midCadence = ['mode', 'cuepoints', 'every'].filter(f => k.drive?.midroll?.[f] !== undefined);
  if (midCadence.length && setup) {
    for (const s of k.sections) {
      if (!s.slots.midroll.on) continue;
      const secDef = setupSection(setup, s.name);
      const groups = secDef ? slotGroupDefs(secDef.slots.midroll) : [];
      if (groups.length > 1) {
        errors.push({ field: 'drive', message: `“${s.name}” runs ${groups.length} mid-roll break groups in “${setup.name}” — each has its own cadence, so where the breaks fall stays the ad setup's` });
        break;
      }
    }
  }

  // A `who` no section can honour refuses the save MAKING that decision, by name.
  // Honoured somewhere — or stranded later by an ops edit this save never touched —
  // the misses fall back to the setup's own arrangement and say so.
  for (const [t, secs] of Object.entries(fellBack)) {
    const ask = driveAsk(k.drive?.[t]?.ask) || [];
    const onSecs = k.sections.filter(s => s.slots[t].on
      && setup && setupSection(setup, s.name)?.slots[t].rungs.length).length;
    const provs = askWord(ask);
    if (driveTouched && secs.length >= onSecs) {
      errors.push({ field: 'sections', message: `The ${SLOT_WORD[t].toLowerCase()} asks ${provs} and “${setup.name}” carries ${ask.length > 1 ? 'none of them' : 'none'} there — switch another partner on, or ad ops add one` });
    } else {
      warnings.push(`${secs.join(', ')}: no ${provs} in the ${SLOT_WORD[t].toLowerCase()}`);
    }
  }

  // THE DRAFT PLANE IS FREE (27 Aug). An integration with every break off is a perfectly
  // good draft — it is what a new surface is before ops attach demand, and what an
  // emptied one is on its way to being taken down. Publishing it is what fails closed,
  // by name, in `publishObject`: an edit is never the moment traffic changes any more.

  if (errors.length) throw new Refusal(400, 'invalid_key', 'Integration was refused', { errors });
  return { k, warnings };
}

// The integration's one attached setup.
export function resolvedSetup(k) {
  return k.adSetupId ? state.setups.get(k.adSetupId) || null : null;
}

// The sections a key EFFECTIVELY has: the setup's placements in the setup's order, each
// joined with the key's overlay of the same name (or an inert default). With no setup
// attached, just the Default overlay — so rules and player stay editable on a draft.
export function effectiveSections(k) {
  const setup = resolvedSetup(k);
  const byName = new Map(k.sections.map(s => [s.name, s]));
  if (!setup) return k.sections.filter(s => s.isDefault);
  return setup.sections.map(sec => {
    const ov = byName.get(sec.name);
    return ov || {
      name: sec.name, isDefault: sec.isDefault,
      slots: Object.fromEntries(SLOT_TYPES.map(t => [t, { on: false }])),
    };
  });
}

// Counted arithmetic, never a guess: the worst case is every rung timing out in
// turn, and the per-rung wait comes from the rules the section resolves to.
export function keyWarnings(k) {
  const warnings = [];
  const setup = resolvedSetup(k);
  for (const s of effectiveSections(k)) {
    const secDef = setup ? setupSection(setup, s.name) : null;
    if (!secDef) continue;
    for (const t of SLOT_TYPES) {
      if (!s.slots[t].on) continue;
      const gdefs = slotGroupDefs(secDef.slots[t]);
      const multi = gdefs.length > 1;
      gdefs.forEach((g, gi) => {
        const bhv = effectiveBehaviour(t, g.behaviour, k.drive?.[t]).values;
        // The ACTUAL arithmetic of what this surface walks, counted: the tries the
        // drive decision really makes × the setup's per-try wait.
        const n = driveWalkRungs(g.rungs, g.behaviour, k.drive?.[t], t).walk.length;
        const worst = n * bhv.tagTimeoutMs;
        if (worst > WORST_CASE_WARN_MS) {
          warnings.push(`${s.name} ${SLOT_WORD[t].toLowerCase()}${multi ? ` pod ${gi + 1}` : ''}: up to ${fmtSecs(worst)} before an ad`);
        }
      });
    }
  }
  return warnings;
}

export function createKey(input) {
  const { k, warnings } = normalizeKey(input);
  const id = `key_${++state.counters.key}`;
  const obj = {
    id,
    key: keyString(k.property, k.platform),
    ...k,
    createdAt: new Date().toISOString(),
    ...updateStamp(),
  };
  state.keys.set(id, obj);
  return { obj, warnings: [...warnings, ...keyWarnings(obj)] };
}

export function updateKey(id, input) {
  const existing = mustGet(state.keys, id, 'integration');
  const { k, warnings } = normalizeKey({ ...existing, ...input }, id,
    { driveTouched: input.drive !== undefined });
  const changes = diff(existing, k);
  Object.assign(existing, k, { ...updateStamp() });
  return { obj: existing, changes, warnings: [...warnings, ...keyWarnings(existing)] };
}

// One section's rules (or player), edited with FIELD-LEVEL diffs — so a version
// still reads "Break positions 4:00 → 6:00", not "sections updated". Editing a section
// that inherits forks it: it gets its own copy, starting from what the editor showed.

// The integration's player, edited with FIELD-LEVEL diffs — a version keeps
// reading "Autoplay muted → with sound", not "integration updated".
export function updateKeyPlayer(keyId, input) {
  const k = mustGet(state.keys, keyId, 'integration');
  const errors = [];
  const player = normalizePlayer({ ...k.player, ...input }, errors, '');
  if (errors.length) throw new Refusal(400, 'invalid_player', 'Player fields were refused', { errors });
  const changes = diff(k.player, player);
  k.player = player;
  if (changes.length) Object.assign(k, { ...updateStamp() });
  return { obj: k, changes };
}

export function getKey(id) { return mustGet(state.keys, id, 'integration'); }

export function listKeys() { return [...state.keys.values()]; }

export function deleteKey(id) {
  const obj = mustGet(state.keys, id, 'integration');
  if (isPublished(id)) {
    throw new Refusal(409, 'key_live', `“${obj.name}” is on air — take it down first, so traffic stops on purpose, not by surprise`);
  }
  state.keys.delete(id);
  state.versions.delete(id);
  return obj;
}

// Duplicate — clone the whole surface for an experiment. Fresh key string, and NOT
// published: a copy has no version history of its own, so it cannot serve until someone
// publishes it on purpose. THE SETUP STILL COPIES rather than linking (8 Sep, when
// sharing became legal): a duplicate is a scratch surface to experiment on, and an
// experiment that edits demand the original is serving from is not an experiment. A
// surface that WANTS the shared ladder says so by mapping it — one click, on its page.
export function duplicateKey(id) {
  const src = getKey(id);
  let name = `${src.name} copy`;
  let n = 2;
  while (listKeys().some(k => k.name.toLowerCase() === name.toLowerCase())) name = `${src.name} copy ${n++}`;
  const setupCopy = src.adSetupId ? duplicateSetup(src.adSetupId, `${name} demand`) : null;
  const { obj } = createKey({
    ...deepCopy(src),
    name,
    adSetupId: setupCopy ? setupCopy.id : null,
  });
  return obj;
}
