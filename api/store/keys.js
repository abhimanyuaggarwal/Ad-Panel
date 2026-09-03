// store/keys.js — integrations: identity, player, custom configs, the drive, sections.
// Split from store.js (3 Sep, docs/STORE-SPLIT.md): a MOVE, not a rewrite — units
// relocated whole, bodies untouched. store.js re-exports everything, so the HTTP
// surface, the tests and the mock world see the exact same module they always did.
import { FIELD_WORDS, fieldWord } from './diff.js';
import { DRIVE_FIELDS, askWord, driveAsk, driveWalkRungs, effectiveBehaviour, normalizeCuepoints, slotGroupDefs } from './ladders.js';
import { isPublished } from './publish.js';
import { setupSection } from './setups.js';
import { AUTOPLAY, MAX_RUNGS, MAX_SECTIONS, MIDROLL_MODES, PLATFORMS, PLAYBACK_KINDS, PLAYBACK_MODES, PREROLL_TIMING, PROPERTIES, PROVIDER_WORD, Refusal, SLOT_TYPES, TAG_PROVIDERS, WEB_PLATFORMS, WORST_CASE_WARN_MS, keyString, state } from './state.js';
import { DOMAIN_RE, PACKAGE_RE, bool, diff, fmtSecs, httpUrl, intIn, mustGet, oneOf, str, uniqueName } from './validate.js';


// ---------- player fields (inline — no identity) ----------
// The old "player setup" object minus its name: a complete statement of how the
// player acts before an ad ever shows, carried by each section.

// The PLAYER, after the 25 Aug trim: how the surface starts a video, and what it plays
// when nothing else is available. Five fields, so it is no longer a card — the
// integration's Identity carries them (see panel/README.md). Key-level, not per
// placement: what genuinely varied per placement was AD SOUND, and that is a slot field
// now, which is more precise than a whole forked player ever was.
export function normalizePlayer(input, errors, prefix = '') {
  const errs = [];
  if (input.startVolume !== undefined) {
    errs.push({ field: 'player', message: 'startVolume is gone — the player carries one Passive volume (JSON: passiveVolume), set in Details' });
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
  };
  if (b.playbackMode === 'inline_redirect' && !httpUrl(b.redirectUrl)) {
    errs.push({ field: 'redirectUrl', message: 'Inline + custom redirect needs a full redirect URL (https://…)' });
  }
  if (b.playbackMode !== 'inline_redirect') b.redirectUrl = '';
  for (const e of errs) errors.push({ field: e.field, message: prefix + e.message });
  return b;
}

// ---------- custom player configs (2 Sep, user call; fields re-cut same day) ----------
// ONE default player per integration stays the rule — but a surface may carry a few
// NAMED forks of the three facts that genuinely vary per placement: the playback mode
// (active / passive), whether the MiniTV expands for ads, and the autoplay behaviour
// (with its volume when it starts unmuted). A player asks for a config by name;
// everything it doesn't carry follows the default. Nothing here switches ads on or
// off — that stays the Ad delivery card's.
export const MAX_PLAYER_CONFIGS = 6;
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
    // A fork carries the three behaviour facts only — volume is the player's one
    // Passive volume, set in Details, never per config.
    if (c.startVolume !== undefined || c.passiveVolume !== undefined) {
      errs.push({ message: 'a custom config carries playback, MiniTV and autoplay — volume is the player’s one Passive volume in Details' });
    }
    const out = {
      id, name,
      playback: oneOf(c.playback ?? player.playback ?? 'active', 'playback', PLAYBACK_KINDS, errs),
      expandInMini: c.expandInMini === undefined ? true : bool(c.expandInMini),
      autoplay: oneOf(c.autoplay ?? player.autoplay ?? 'auto', 'autoplay', AUTOPLAY, errs),
    };
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
    errors.push({ field: 'sections', message: `“${name}”: the squeeze-back slot is gone — a banner over playing content is a break\u2019s display fallback, and the idle player\u2019s rotation is Out-stream` });
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
          ? `The ${t} quick decisions are ${allowed.map(fieldWord).join(', ')} — ${FIELD_WORDS[f] || `“${f}”`} is arranged in the ad setup`
          : `A ${t} takes turns — nothing to decide beyond its switch` });
        continue;
      }
      const errs = [];
      if (f === 'ask') {
        if (v === 'setup') continue; // the default, stored as absence
        if (!Array.isArray(v)) {
          errs.push({ field: 'drive', message: 'the ad partners are a list, in the order they are asked' });
        } else {
          const bad = v.filter(p => !TAG_PROVIDERS.includes(p));
          if (bad.length) errs.push({ field: 'drive', message: `${bad.map(p => `“${p}”`).join(', ')} is not an ad partner — ${TAG_PROVIDERS.map(p => PROVIDER_WORD[p]).join(', ')}` });
          else if (!v.length) errs.push({ field: 'drive', message: 'a break with every partner switched off would ask nobody — leave one on, or switch the break off' });
          else out.ask = driveAsk(v);
        }
      } else if (f === 'direct') {
        // The surface's switch over THIS break's direct tier: absence is on, so only
        // the off answer is stored — dropping it follows the setup again.
        if (v === false) out.direct = false;
      } else if (f === 'tries') {
        out.tries = intIn(v, 'tries', 1, MAX_RUNGS, errs);
      } else if (f === 'start') {
        out.start = oneOf(v, 'start', PREROLL_TIMING, errs);
      } else if (f === 'deferSec') {
        out.deferSec = intIn(v, 'deferSec', 1, 60, errs);
      } else if (f === 'podAds') {
        out.podAds = intIn(v, 'podAds', 1, 3, errs);
      } else if (f === 'mode') {
        out.mode = oneOf(v, 'mode', MIDROLL_MODES, errs);
      } else if (f === 'cuepoints') {
        const cps = normalizeCuepoints(v, errs, 'drive');
        // A cadence with nowhere to fall is a dark break, not a decision.
        if (!errs.length && !cps.length) {
          errs.push({ field: 'drive', message: 'a mid-roll needs at least one break position — clear the decision to follow the ad setup again' });
        } else if (!errs.length) out.cuepoints = cps;
      } else if (f === 'every') {
        out.every = intIn(v, 'every', 60, 3600, errs);
      }
      for (const e of errs) errors.push({ field: 'drive', message: `${t}: ${e.message}` });
    }
    if (Object.keys(out).length) drive[t] = out;
  }
  return Object.keys(drive).length ? drive : null;
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
      errors.push({ field: 'domains', message: `${k.platform} integrations need at least one domain — the player refuses requests from anywhere else` });
    }
    for (const d of k.domains) {
      if (!DOMAIN_RE.test(d)) errors.push({ field: 'domains', message: `“${d}” is not a valid domain` });
    }
  } else {
    k.domains = [];
    if (!PACKAGE_RE.test(k.packageName)) {
      errors.push({ field: 'packageName', message: `${k.platform} integrations need a valid package name (e.g. com.toi.reader)` });
    }
  }

  // ONE setup per integration (25 Aug) — the attachment is key-level. And ONE
  // integration per setup (26 Aug, DRIVING-SCOPE): the setup is this surface's own
  // workshop, so deep edits there can never recall anyone else's fleet. A promise,
  // enforced: attaching a setup another integration holds is refused by name.
  if (input.status !== undefined) {
    errors.push({ field: 'status', message: 'Live or paused is not a field any more — an integration is on air when it is published, and Unpublish takes it down' });
  }

  k.adSetupId = str(input.adSetupId) || null;
  if (k.adSetupId && !state.setups.has(k.adSetupId)) {
    errors.push({ field: 'adSetupId', message: 'That ad setup doesn\'t exist' });
    k.adSetupId = null;
  }
  if (k.adSetupId) {
    const holder = listKeys().find(x => x.id !== exceptId && x.adSetupId === k.adSetupId);
    if (holder) {
      errors.push({ field: 'adSetupId', message: `“${state.setups.get(k.adSetupId).name}” already fills “${holder.name}” — one integration, one ad setup. Attach a copy instead` });
      k.adSetupId = null;
    }
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
  for (const s of k.sections) {
    const secDef = setup ? setupSection(setup, s.name) : null;
    for (const t of SLOT_TYPES) {
      if (!s.slots[t].on) continue;
      if (!setup) {
        errors.push({ field: 'sections', message: `“${s.name}” ${t} is switched on but no ad setup is attached — nothing could fill it. Ad ops connect one from their room` });
      } else if (!secDef) {
        errors.push({ field: 'sections', message: `“${s.name}” is not a placement in “${setup.name}” — placements live in the ad setup now; ad ops add them there` });
        break;
      } else if (slotGroupDefs(secDef.slots[t]).every(g => !g.rungs.length)) {
        errors.push({ field: 'sections', message: `“${s.name}” ${t} is switched on but “${setup.name}” carries no ${t} demand there — ask ad ops, or switch it off` });
      } else {
        // Every break group answers for itself — one dark group is one dark break.
        const gdefs = slotGroupDefs(secDef.slots[t]);
        const multi = gdefs.length > 1;
        gdefs.forEach((g, gi) => {
          const r = driveWalkRungs(g.rungs, g.behaviour, k.drive?.[t], t);
          const gWord = multi ? ` group ${gi + 1}` : '';
          if ((r.fellBack || r.vacuous) && gi === 0) (fellBack[t] = fellBack[t] || []).push(s.name);
          if (r.walk.length === 0) {
            errors.push({ field: 'sections', message: !g.rungs.length
              ? `“${s.name}” ${t}${gWord} is switched on but its break group carries no demand — ask ad ops, or remove the group`
              : `“${s.name}” ${t}${gWord} is switched on but every rung is off by ad ops — switch one on in the ad setup, or switch the unit off` });
          }
        });
      }
    }
  }
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
      errors.push({ field: 'sections', message: `The ${t} asks ${provs} and “${setup.name}” carries ${ask.length > 1 ? 'none of them' : 'none'} there — switch another partner on, or ad ops add one` });
    } else {
      warnings.push(`${secs.join(', ')}: no ${provs} in the ${t} — runs as set up there`);
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
          warnings.push(`${s.name} ${t}${multi ? ` group ${gi + 1}` : ''}: ${n} rungs × ${fmtSecs(bhv.tagTimeoutMs)} is a ${fmtSecs(worst)} wait before anything plays`);
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
    updatedAt: new Date().toISOString(),
    updatedBy: 'You',
  };
  state.keys.set(id, obj);
  return { obj, warnings: [...warnings, ...keyWarnings(obj)] };
}

export function updateKey(id, input) {
  const existing = mustGet(state.keys, id, 'integration');
  const { k, warnings } = normalizeKey({ ...existing, ...input }, id,
    { driveTouched: input.drive !== undefined });
  const changes = diff(existing, k);
  Object.assign(existing, k, { updatedAt: new Date().toISOString(), updatedBy: 'You' });
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
  if (changes.length) Object.assign(k, { updatedAt: new Date().toISOString(), updatedBy: 'You' });
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
