// panel/api/store.js — in-memory state + rules for the Integrations Panel.
//
// TWO ROOMS (24 Aug rework, AD-SETUP-SCOPE.md). The one rule, in three parts:
//   AD OPS supply WHAT can fill    — the Ad Setup (ladders of tags), their own room
//   the INTEGRATION says WHETHER   — its slot switches, per section
//   its own RULES say HOW          — ad rules + player setup live INSIDE the integration
//
// Player setups and ad rules are no longer identities: no list, no name, no used-by.
// They are field groups inside each section (Default must carry both; other sections
// may say "Same as Default" by carrying null). Their old shapes survive as creation
// PRESETS — a preset stamps values once and is forgotten, never linked.
//
// Three objects: integration (key) · ad setup · ad tag.

export const PROPERTIES = ['TOI', 'ET', 'NBT'];
export const PROPERTY_SCOPES = ['All', 'TOI', 'ET', 'NBT']; // shared objects can be brand-scoped or shared
export const PLATFORMS = ['mweb', 'desktop', 'android', 'ios'];
export const WEB_PLATFORMS = ['mweb', 'desktop'];
export const APP_PLATFORMS = ['android', 'ios'];

export const AUTOPLAY = ['none', 'muted', 'sound'];
export const PLAYBACK_MODES = ['inline', 'inline_redirect', 'youtube'];
// A config's PLAYBACK MODE (2 Sep, user call — replacing the day-old engagement mode):
// the player runs the placement actively or passively. The user's vocabulary, verbatim.
export const PLAYBACK_KINDS = ['active', 'passive'];
// How an AD starts on this slot — one decision, three answers (25 Aug, user call): it
// moved out of the player and onto the slot, because it is the ad that is loud, and
// because a surface wants to flip it per break without touching anything else.
// GONE 25 Aug (user call — the panel configures ADS, not the whole player): preload,
// cellular quality cap, controls/seek, out-of-view docking, end-of-video, ad countdown,
// "Ad 1 of N", ad click target, pause ads, seek-past-a-break. Removed from the model,
// not hidden: the publisher's player owns them.
// Pre-roll is a TIMING choice only — "off" moved to the integration's slot switch.
export const PREROLL_TIMING = ['start', 'deferred'];
// How long the VIEWER waits before content starts, whether or not the ad chain has
// finished: right away (content never blocks on ads), after the chain (the default —
// ads get their full window), or after a fixed wait that cuts the chain off.
export const PREROLL_WAIT = ['immediate', 'chain', 'timed'];
export const MIDROLL_MODES = ['cuepoints', 'interval'];
// Pods (24 Aug, POD-SCOPE.md): where the next slot's walk starts (the ladder is
// preference order, not a per-ad price ranking — the UI says "first choice"), and
// whether a banner may only end the break or sit anywhere in it. The budget pair
// (breakSec/overrun) was cut 31 Aug with the squeeze-back — see DEAD_BEHAVIOUR_FIELDS.
export const POD_NEXT_AD = ['top', 'next'];
export const POD_BANNER = ['last', 'any'];
// `status` (active/paused) is GONE (27 Aug, user call). It was the one field that
// reached a viewer without going through the publish plane, and everything it did is
// what Unpublish does — see THE PUBLISH PLANE at the foot of this file. A payload still
// carrying it is refused by name.

// THE SQUEEZE-BACK IS GONE (31 Aug, user call). A banner over playing content is a
// break's display fallback (a rung); the idle player's rotation is Out-stream. The
// slot is removed, not hidden — a payload still carrying one is refused by name.
export const SLOT_TYPES = ['preroll', 'midroll', 'postroll', 'outstream'];
// Every tag is either a video tag or a display tag; the family decides what fits where.
export const TAG_TYPES = ['video', 'display'];
// THREE providers (27 Aug, user call): IMA and GPT are the two client libraries on the
// GAM account; CAN is the endpoint you paste. SLike was removed — a fourth name that
// behaved exactly like CAN (a pasted VAST URL answering with video) bought nothing.
export const TAG_PROVIDERS = ['ima', 'gpt', 'can'];
// Which providers are addressed by a pasted endpoint rather than picked from a directory.
export const URL_PROVIDERS = ['can'];
// Providers whose value is a GAM ad unit from the synced directory — IMA and GPT are the
// two client libraries calling the same GAM account.
export const DIRECTORY_PROVIDERS = ['ima', 'gpt'];
// The TYPE is implied by the protocol wherever it can be (25 Aug, ops-ease): an IMA
// request is a VAST call and answers with video; a GPT slot is a banner slot and
// answers with display. Only CAN serves both, so only CAN asks. Config-time knowledge,
// not a guess about responses.
export const PROVIDER_TYPE = { ima: 'video', gpt: 'display', can: null };
// The provider's word, so a refusal from any call site reads the same as the UI.
export const PROVIDER_WORD = { ima: 'IMA', gpt: 'GPT', can: 'CAN' };
// What an ad unit looks like: the network code, then the path GAM was given. Typed by
// hand this is the ONE thing worth checking — the directory can be stale, the shape
// cannot be wrong.
export const AD_UNIT_PATH = /^\/\d{3,}(\/[A-Za-z0-9._~-]+)+\/?$/;
export const AD_UNIT_EXAMPLE = '/7176/toi/mweb/videoshow/preroll';
// FOUR ad slots (user call, 20 Aug). The separate `display` slot is gone: a display ad is
// not a placement of its own, it is what a break falls back to — so a display tag is a
// RUNG inside pre/mid/post, at any position. The squeeze-back slot (once `lband`) was
// REMOVED 31 Aug (user call): a banner over playing content is a break's fallback rung,
// and the idle player's rotation is Out-stream.
export const SLOT_FAMILY = {
  preroll: 'video', midroll: 'video', postroll: 'video',
  outstream: 'display',
};
// A break can fall back to a banner, so a video slot takes display tags too. A
// squeeze-back has nothing to fall back to, so it does not take video tags.
export const SLOT_ALSO_TAKES = { preroll: 'display', midroll: 'display', postroll: 'display' };
// A break is a LADDER: ordered, tried one after another until something fills. A
// squeeze-back is a ROTATION: several banners that take turns, with the turn-taking set
// in the ad rules rather than by their order. Same rungs array, different meaning — so
// the rules that only make sense for a ladder (a terminal, a pool) do not apply.
// OUT-STREAM (31 Aug, AD-JSON-SCOPE): the squeeze-back's anatomy, outside playback —
// banners while nothing is playing. A rotation by construction.
export const SLOT_KIND = {
  preroll: 'ladder', midroll: 'ladder', postroll: 'ladder',
  outstream: 'rotation',
};
// WHERE ON THE PAGE a banner the panel serves lands (31 Aug, AD-JSON-SCOPE). A fixed
// vocabulary from the player team — a typed position is a dark ad nobody discovers
// until a revenue report — and each position carries its own sizes PLAYER-SIDE (the
// user's call: no sizes in the panel).
export const DISPLAY_SLOTS = ['player_bottom', 'player_top', 'l_50'];
export const DISPLAY_SLOT_WORD = { player_bottom: 'Player bottom', player_top: 'Player top', l_50: 'L-band 50' };
// Does the video stop while this banner plays? Yes / No / the player's own size decides
// (31 Aug, user call: no pixel threshold in the panel — the player owns "small").
export const PAUSE_MODES = ['yes', 'no', 'size'];
export const PAUSE_WORD = { yes: 'Yes', no: 'No', size: 'Auto' };
// A MID-ROLL IS BREAK GROUPS (31 Aug, user call): up to 3, each with its own cadence
// and its own ladder. One group is today's mid-roll, and draws no group chrome.
export const MAX_MIDROLL_GROUPS = 3;
// REQUEST TEMPLATE MACROS (31 Aug — reverses the 20 Aug "no interface" call, on the
// user's word). The vocabulary is the PLAYER TEAM's: the panel validates against it,
// fail closed, so ops can pick a template but never break a URL.
export const TEMPLATE_MACROS = ['CACHEBUSTER', 'REFERRER_URL', 'PAGE_URL', 'TIMESTAMP', 'DESCRIPTION_URL'];
export const ROTATION_MAX = 5;
export const MAX_SECTIONS = 5;
export const MAX_RUNGS = 10; // 1 primary + 9 waterfall rungs (user call, 25 Aug — was 4)
// A full pass down the ladder asks this many servers in a row — past this the player visibly stalls.
export const WORST_CASE_WARN_MS = 6000;

const state = {
  keys: new Map(),
  setups: new Map(),
  tags: new Map(),
  templates: new Map(),
  gamUnits: [],
  gamPending: [],
  gamLastSync: null,
  // THE PUBLISH PLANE (27 Aug). Two planes, one object: the DRAFT is what the panel
  // edits and Save writes; the PUBLISHED snapshot is the only thing the player's API
  // ever reads. `versions` is append-only per object — history is never rewritten, so
  // restoring an old version is a new version, exactly like a spreadsheet's.
  versions: new Map(), // objectId → [{ v, ts, actor, snapshot, changes, restoredFrom }]
  live: new Map(),     // objectId → { v, snapshot }  (absent = never published / taken down)
  counters: { key: 0, setup: 0, tag: 0, template: 0 },
  rngSeed: 20260817,
};

// Deterministic RNG — key strings never shift on reset (counted, never invented).
function rng() {
  state.rngSeed = (state.rngSeed * 1103515245 + 12345) & 0x7fffffff;
  return state.rngSeed / 0x7fffffff;
}

const ALNUM = 'abcdefghjkmnpqrstuvwxyz23456789'; // no 0/O/1/l/i — keys get read aloud
function keyString(property, platform) {
  let suffix = '';
  for (let i = 0; i < 6; i++) suffix += ALNUM[Math.floor(rng() * ALNUM.length)];
  return `sak_${property.toLowerCase()}_${platform}_${suffix}`;
}

export function resetState(seed = 20260817) {
  state.keys.clear();
  state.setups.clear();
  state.tags.clear();
  state.templates.clear();
  state.gamUnits = [];
  state.gamPending = [];
  state.gamLastSync = null;
  state.versions.clear();
  state.live.clear();
  state.counters = { key: 0, setup: 0, tag: 0, template: 0 };
  state.rngSeed = seed;
}

// ---------- validation helpers ----------

class Refusal extends Error {
  constructor(status, code, message, details) {
    super(message);
    this.status = status;
    this.code = code;
    this.details = details;
  }
}
export { Refusal };

function str(v) {
  return typeof v === 'string' ? v.trim() : '';
}

function intIn(v, field, min, max, errors) {
  const n = Number(v);
  if (!Number.isFinite(n) || !Number.isInteger(n) || n < min || n > max) {
    errors.push({ field, message: `${field} must be a whole number between ${min} and ${max} (got ${v})` });
    return min;
  }
  return n;
}

function oneOf(v, field, allowed, errors) {
  if (!allowed.includes(v)) {
    errors.push({ field, message: `${field} must be one of ${allowed.join(', ')} (got ${v})` });
    return allowed[0];
  }
  return v;
}

function bool(v) {
  return v === true || v === 'true';
}

function httpUrl(v) {
  try {
    const u = new URL(v);
    return u.protocol === 'https:' || u.protocol === 'http:';
  } catch {
    return false;
  }
}

const DOMAIN_RE = /^(\*\.)?[a-z0-9]([a-z0-9-]*[a-z0-9])?(\.[a-z0-9]([a-z0-9-]*[a-z0-9])?)+$/i;
const PACKAGE_RE = /^[a-zA-Z][a-zA-Z0-9_]*(\.[a-zA-Z][a-zA-Z0-9_]*)+$/;

function uniqueName(map, name, exceptId) {
  for (const obj of map.values()) {
    if (obj.id !== exceptId && obj.name.toLowerCase() === name.toLowerCase()) return false;
  }
  return true;
}

function fmtSecs(ms) {
  const s = ms / 1000;
  return `${Number.isInteger(s) ? s : s.toFixed(1)}s`;
}

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
  const b = {
    autoplay: oneOf(input.autoplay, 'autoplay', AUTOPLAY, errs),
    startVolume: intIn(input.startVolume ?? 80, 'startVolume', 1, 100, errs),
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
    if (!name) errs.push({ message: 'Every custom config needs a name — players ask for it by name' });
    else if (seen.has(name.toLowerCase())) errs.push({ message: 'Two configs share this name — a player asking by name must find exactly one' });
    seen.add(name.toLowerCase());
    let id = str(c.id);
    if (!id) {
      while (used.has(`pc_${n}`)) n++;
      id = `pc_${n}`;
      used.add(id);
    }
    const out = {
      id, name,
      playback: oneOf(c.playback ?? player.playback ?? 'active', 'playback', PLAYBACK_KINDS, errs),
      expandInMini: c.expandInMini === undefined ? true : bool(c.expandInMini),
      autoplay: oneOf(c.autoplay ?? player.autoplay ?? 'muted', 'autoplay', AUTOPLAY, errs),
      startVolume: intIn(c.startVolume ?? player.startVolume ?? 80, 'startVolume', 1, 100, errs),
    };
    for (const e of errs) {
      errors.push({ field: 'playerConfigs', message: name ? `“${name}”: ${e.message}` : e.message });
    }
    return out;
  });
}

// ---------- ad rules (inline — no identity) ----------
// Behaviour only. Nothing here switches a break or an overlay on or off — that is
// the integration's slot switch. So the rules always carry their break positions
// and overlay moments: a complete statement of how ads behave if they run.

// A cuepoint is seconds ("360") or minutes:seconds ("6:00").
function parseCuepoint(v) {
  if (typeof v === 'number' && Number.isInteger(v) && v > 0) return v;
  const s = String(v).trim();
  if (/^\d+$/.test(s)) return parseInt(s, 10);
  const m = s.match(/^(\d+):([0-5]?\d)$/);
  if (m) return parseInt(m[1], 10) * 60 + parseInt(m[2], 10);
  return null;
}

function normalizeCuepoints(input, errors, field = 'cuepoints') {
  let raw = input;
  if (typeof raw === 'string') raw = raw.split(',').map(s => s.trim()).filter(Boolean);
  if (!Array.isArray(raw)) raw = [];
  const parsed = [];
  for (const c of raw) {
    const n = parseCuepoint(c);
    if (n === null || n <= 0 || n > 14400) {
      errors.push({ field, message: `“${c}” is not a time — use seconds (360) or minutes:seconds (6:00)` });
    } else {
      parsed.push(n);
    }
  }
  return [...new Set(parsed)].sort((a, b) => a - b);
}

// ---------- how ads behave: ON THE SLOT, inside the ad setup (25 Aug, user call) ----------
// The old "Ad behaviour" object held every break's fields side by side, prefixed by
// break (preRollPodAds, midrollPodAds, …) because ONE object had to describe FOUR
// units. With behaviour living on the slot itself the prefixes vanish: a slot's
// behaviour holds only what that slot can have, named plainly. 15 pod fields become 5.
//
//   the SLOT says   when the break falls · how many ads · how long · how it walks
//   the PLACEMENT   what a whole session may take: caps, overlay schedule, delivery
//   the PLAYER      what the viewer sees while an ad runs (in the integration)
//
// Nothing here switches a unit on: that is still the integration's slot switch. So a
// slot's behaviour is always complete — a statement of how it WOULD behave if it ran.

// THREE FIELDS CUT with the squeeze-back (31 Aug, user call): Max pod duration and
// Duration enforcement (a pod plays its target impressions count; an ad runs its own
// length) and Max waterfall depth (how deep a walk goes is the SURFACE's Waterfall
// depth, in Ad delivery — one concept, one control). Removed, not hidden — see
// DEAD_BEHAVIOUR_FIELDS.
export const SLOT_BEHAVIOUR_FIELDS = {
  // `minContentSec` (31 Aug, user call — the JSON's minPreRenderTime): the PRE-ROLL's
  // own head start — at least this much video plays before the ad may render. A fact
  // about one break, so it lives on that break, not on the player.
  preroll: ['start', 'deferSec', 'wait', 'waitMs', 'minContentSec', 'podAds', 'nextAd', 'podBanner', 'tagTimeoutMs', 'fillTimeoutSec'],
  // `prefetchSec` (same call): how early a COMING break's first ad is fetched — only a
  // break that arrives mid-playback has a "before" to fetch in, so mid- and post-roll.
  midroll: ['mode', 'cuepoints', 'firstAt', 'every', 'prefetchSec', 'podAds', 'nextAd', 'podBanner', 'tagTimeoutMs', 'fillTimeoutSec'],
  postroll: ['prefetchSec', 'podAds', 'nextAd', 'podBanner', 'tagTimeoutMs', 'fillTimeoutSec'],
  // Out-stream: banners while nothing plays, plus one switch — hide while a video ad
  // runs. Its show times are its own repeat schedule, so it has no rotation refresh.
  outstream: ['times', 'hold', 'perSession', 'hideOnInStream', 'tagTimeoutMs'],
};

// A cut field is refused BY NAME, with where the answer lives now (house rule).
export const DEAD_BEHAVIOUR_FIELDS = {
  breakSec: ['Max pod duration', 'a pod plays its target impressions count, and each ad runs its own length'],
  overrun: ['Duration enforcement', 'a pod plays its target impressions count, and each ad runs its own length'],
  walkDepth: ['Max waterfall depth', 'how deep the walk goes is the surface\u2019s Waterfall depth, in Ad delivery'],
  refresh: ['Refresh interval', 'the squeeze-back is gone — the out-stream\u2019s schedule is its own show times'],
  // Cut 1 Sep, user call: a repeating cadence runs the video out, and at set positions
  // the positions themselves are the cap. Nothing counted a mid-way stop.
  stopAfter: ['Break cap', 'a cadence runs the length of the video — at set positions, the positions are the cap'],
  // Cut 2 Sep, user call: an ad's sound is how the PLAYER starts, and that answer
  // lives on the surface now — per placement, even.
  adSound: ['Ad audio', 'how a player starts — muted or unmuted — is the integration\u2019s Player config (Autoplay behaviour)'],
};

// THE DRIVE DECISION (26 Aug, DRIVING-SCOPE). Local overrides — muted rungs, a local
// walk order, sparse behaviour bends — are GONE with the 1:1 setup promise: the deep
// work happens in the integration's own setup now. What a surface keeps is the driving
// controls, per break: WHO fills it ('only:<provider>' / 'first:<provider>'), how many
// TRIES, whether the pre-roll STARTS right away or after a moment, and ads in a row.
// Stored as INTENT, sparse, and resolved against whatever the setup holds today — ad
// ops adding a tag next week joins the walk the decision already describes. A
// squeeze-back takes turns, so it has nothing to decide beyond its switch.
export const DRIVE_FIELDS = {
  preroll: ['direct', 'ask', 'tries', 'start', 'deferSec', 'podAds'],
  // WHERE THE BREAKS FALL (3 Sep, user call) joins the drive. The cadence was the ad
  // setup's alone; with the 1:1 promise a setup IS one integration's, so "this surface
  // breaks at 2:00 and 8:00" is a surface decision — stored sparse like the rest and
  // resolved over whatever the placement holds. It is refused where the mid-roll runs
  // MORE THAN ONE break group: several cadences are an arrangement, and one answer
  // cannot stand for all of them.
  midroll: ['direct', 'ask', 'tries', 'podAds', 'mode', 'cuepoints', 'every'],
  postroll: ['direct', 'ask', 'tries', 'podAds'],
  outstream: [], // takes turns — nothing to decide beyond its switch
};

// WHO IS ASKED, AND IN WHAT ORDER (27 Aug, user call). `ask` is an ordered list of the
// partners this break asks — first entry asked first — and anything absent from it is
// not asked at all. It replaces the `only:x` / `first:x` pair outright, because the two
// were the only shapes a dropdown could express and both are just special cases of a
// list: "IMA only" is `['ima']`, "GPT first" is `['gpt','ima','can']`. A surface that
// has made no decision has no `ask` at all, and runs the setup's own arrangement.
// "IMA" · "IMA then CAN" · "IMA, then CAN, then GPT" — an ask list read aloud.
export function askWord(ask) {
  const w = (ask || []).map(p => PROVIDER_WORD[p] || p);
  if (!w.length) return 'nobody';
  if (w.length === 1) return w[0];
  return `${w.slice(0, -1).join(', ')} then ${w[w.length - 1]}`;
}

export function driveAsk(ask) {
  if (!Array.isArray(ask) || !ask.length) return null;
  const out = [];
  for (const p of ask) if (TAG_PROVIDERS.includes(p) && !out.includes(p)) out.push(p);
  return out.length ? out : null;
}

// The behaviour a surface actually runs: the placement's, with the drive's own two
// timing answers on top. `driveKeys` is what the decision set — the UI marks those.
export function effectiveBehaviour(type, base, drive) {
  if (!base) return { values: null, driveKeys: [] };
  const keys = drive ? Object.keys(drive).filter(f => ['start', 'deferSec', 'podAds', 'mode', 'cuepoints', 'every'].includes(f)) : [];
  if (!keys.length) return { values: base, driveKeys: [] };
  const values = { ...base };
  for (const f of keys) values[f] = drive[f];
  return { values, driveKeys: keys };
}

export function normalizeSlotBehaviour(type, input, errors, warnings, prefix = '') {
  const errs = [];
  const warns = [];
  const inp = input || {};
  const b = {};

  // A field cut from the model is refused by name, with where the answer lives now.
  for (const [f, dead] of Object.entries(DEAD_BEHAVIOUR_FIELDS)) {
    if (inp[f] !== undefined) {
      errs.push({ field: f, message: `\u201c${dead[0]}\u201d is not a setting any more — ${dead[1]}` });
    }
  }
  if (SLOT_KIND[type] === 'rotation') {
    // A rotation, not a ladder: several banners taking turns.
    // ABSENT means "not stated yet" and takes a sane default; EXPLICITLY EMPTY means
    // "no moments", which for a unit that has a switch is an incomplete statement — so
    // it is refused by name rather than quietly serving nothing.
    b.times = inp.times === undefined ? [30] : normalizeCuepoints(inp.times, errs, 'times');
    b.hold = intIn(inp.hold ?? 20, 'hold', 5, 90, errs);
    b.perSession = intIn(inp.perSession ?? 2, 'perSession', 0, 20, errs);
    // Out-stream fills the idle player; when an in-stream ad takes the screen it can
    // step aside (the JSON's hideOnInStream). A switch, defaulting to polite.
    b.hideOnInStream = inp.hideOnInStream === undefined ? true : bool(inp.hideOnInStream);
    if (inp.times !== undefined && !b.times.length) {
      errs.push({ field: 'times', message: 'The out-stream needs at least one show time' });
    }
  } else {
    if (type === 'preroll') {
      b.start = oneOf(inp.start ?? 'start', 'start', PREROLL_TIMING, errs);
      b.deferSec = intIn(inp.deferSec ?? 7, 'deferSec', 3, 60, errs);
      b.wait = oneOf(inp.wait ?? 'chain', 'wait', PREROLL_WAIT, errs);
      b.waitMs = intIn(inp.waitMs ?? 4000, 'waitMs', 100, 15000, errs);
      // The pre-roll's head start: this much video plays before the ad may render.
      b.minContentSec = intIn(inp.minContentSec ?? 1, 'minContentSec', 0, 30, errs);
    }
    if (type === 'midroll' || type === 'postroll') {
      // A coming break's first ad is fetched this early, so it opens with something in hand.
      b.prefetchSec = intIn(inp.prefetchSec ?? 5, 'prefetchSec', 0, 30, errs);
    }
    if (type === 'midroll') {
      b.mode = oneOf(inp.mode ?? 'cuepoints', 'mode', MIDROLL_MODES, errs);
      b.cuepoints = inp.cuepoints === undefined ? [300] : normalizeCuepoints(inp.cuepoints, errs);
      b.firstAt = intIn(inp.firstAt ?? 240, 'firstAt', 0, 3600, errs);
      b.every = intIn(inp.every ?? 480, 'every', 60, 3600, errs);
      // A REPEATING CADENCE CAN STOP (31 Aug, AD-JSON-SCOPE — the JSON's
      // totalImpression). A count of breaks, and `Full` is the open end, stored as
      // null: never a magic zero. Named positions carry their own count already.
      if (b.mode === 'cuepoints' && inp.cuepoints !== undefined && !b.cuepoints.length) {
        errs.push({ field: 'cuepoints', message: 'Mid-rolls need at least one break position — a placement always says where a break would fall' });
      }
    }
    // Pods: a break may play up to N ads in a row, assembled by this slot's own ladder.
    // Every fill field is inert while the count is 1, so the defaults ARE today's behaviour.
    b.podAds = intIn(inp.podAds ?? 1, 'podAds', 1, 3, errs);
    b.nextAd = oneOf(inp.nextAd ?? 'top', 'nextAd', POD_NEXT_AD, errs);
    b.podBanner = oneOf(inp.podBanner ?? 'last', 'podBanner', POD_BANNER, errs);
  }
  // How long each rung of this slot's waterfall waits before falling through.
  b.tagTimeoutMs = intIn(inp.tagTimeoutMs ?? 2500, 'tagTimeoutMs', 500, 8000, errs);
  // THE BREAK'S OWN GIVING-UP POINT (31 Aug, AD-JSON-SCOPE — the JSON's totalTimeout):
  // a cap on the whole ladder's asking, sitting one row under the per-try wait it
  // argues with. The unreachable-tail warning is counted where the rung count is known.
  if (SLOT_KIND[type] === 'ladder') {
    b.fillTimeoutSec = intIn(inp.fillTimeoutSec ?? 20, 'fillTimeoutSec', 5, 120, errs);
  }
  // Soft warnings — levers, not walls.
  if (type === 'preroll') {
    if (b.start === 'deferred' && b.deferSec > 15) warns.push('Deferring the pre-roll past 15s loses most short sessions before the ad ever runs');
    if (b.wait === 'timed' && b.waitMs < b.tagTimeoutMs) {
      warns.push(`A ${fmtSecs(b.waitMs)} wait is shorter than the ${fmtSecs(b.tagTimeoutMs)} a single tag may take — the pre-roll will usually be cut off`);
    }
    if (b.wait === 'timed' && b.waitMs > 8000) warns.push(`Making viewers wait ${fmtSecs(b.waitMs)} before content starts loses most short sessions`);
  }
  if (type === 'midroll') {
    if (b.mode === 'cuepoints' && b.cuepoints.length >= 4) warns.push('4+ mid-roll breaks is heavy for anything under 20 minutes');
    if (b.mode === 'interval' && b.every < 180) warns.push(`A break every ${fmtSecs(b.every * 1000)} is heavy — most streams settle around 8 minutes`);
    if (b.mode === 'cuepoints' && b.cuepoints.some((c, i) => i > 0 && c - b.cuepoints[i - 1] < 60)) {
      warns.push('Break positions under a minute apart will feel relentless');
    }
    // The heavy-cadence warnings multiply by the pod. Guarded so exactly one fires.
    if (b.mode === 'interval' && b.podAds > 1 && b.every >= 180 && b.every / b.podAds < 180) {
      warns.push(`A break every ${fmtSecs(b.every * 1000)} at ${b.podAds} ads is one ad every ${fmtSecs(Math.round(b.every / b.podAds) * 1000)} — heavy`);
    }
    if (b.mode === 'cuepoints' && b.podAds > 1 && b.cuepoints.length < 4 && b.cuepoints.length * b.podAds >= 4) {
      warns.push(`${b.cuepoints.length} breaks at ${b.podAds} ads each is ${b.cuepoints.length * b.podAds} mid-roll ads — heavy for anything under 20 minutes`);
    }
  }

  for (const e of errs) errors.push({ field: e.field, message: prefix + e.message });
  for (const w of warns) warnings.push(prefix + w);
  return b;
}

// ACROSS THE SESSION IS GONE (27 Aug, user call). The group was fifteen fields, cut to
// three on the morning's scope audit and to nothing that evening: a placement has no
// session-wide settings at all any more, only its slots. Removed from the model, not
// hidden — every one of the fifteen is refused by name, with where the answer lives.
export const DEAD_RULE_FIELDS = {
  maxAdsPerSession: ['Most ads a session', 'a break plays what its own slot says, and the ladder behind it is the only cap'],
  cooldownAfterBreak: ['Quiet after a break', 'the mid-roll cadence already says how far apart breaks fall'],
  noFillAction: ['When nothing fills', 'nothing fills means the content plays — there was never a second answer'],
  bannerTimes: ['Banner shows at', 'the squeeze-back slot is the banner — its show times are its own'],
  bannerStay: ['Banner stays for', 'the squeeze-back slot is the banner — how long each one holds is its own'],
  bannerDismissible: ['Banner dismissible', 'the squeeze-back slot is the banner — there is nothing else to dismiss'],
  overlayGap: ['Overlay gap', 'the squeeze-back paces itself, with its own rotation and per-session cap'],
  requestTimeoutMs: ['Ad request timeout', 'each break sets how long one try waits, on its own slot'],
  retries: ['Retries', 'the waterfall is the retry — add a rung instead'],
  companions: ['Companion ads', 'companion banners arrive with the ad, in the VAST response'],
  companionBackfill: ['Companion backfill', 'companion banners arrive with the ad, in the VAST response'],
  companionPersist: ['Companions persist', 'companion banners arrive with the ad, in the VAST response'],
  adjacentRefresh: ['Adjacent refresh', 'adjacent slots are the page\u2019s display units — this panel does not serve them'],
  adjacentInterval: ['Adjacent min interval', 'adjacent slots are the page\u2019s display units — this panel does not serve them'],
  adjacentViewability: ['Adjacent viewability gate', 'adjacent slots are the page\u2019s display units — this panel does not serve them'],
};

// A payload still carrying any of them is named, never quietly dropped.
export function refuseDeadRules(input, errors, prefix = '') {
  for (const f of Object.keys(input || {})) {
    const dead = DEAD_RULE_FIELDS[f];
    if (dead) errors.push({ field: f, message: `${prefix}“${dead[0]}” is not set on a placement any more — ${dead[1]}` });
  }
}

// ---------- request templates ----------
// AUTHORED IN THE PANEL since 31 Aug (AD-JSON-SCOPE — reversing the 20 Aug "no
// interface" call on the user's word): the JSON names several templates and a unit's
// `tpl` picks between them, so which template carries a unit IS an ops decision now.
// The half that protected ops survives as validation: the macro vocabulary is the
// player team's, fail closed, so ops can pick a template but never break a URL.

export function normalizeTemplate(input, exceptId) {
  const errors = [];
  const name = str(input.name);
  if (!name) errors.push({ field: 'name', message: 'Name is required' });
  else if (!uniqueName(state.templates, name, exceptId)) {
    errors.push({ field: 'name', message: `A request template named “${name}” already exists` });
  }
  const property = oneOf(input.property ?? 'All', 'property', PROPERTY_SCOPES, errors);
  let provider = str(input.provider);
  if (!TAG_PROVIDERS.includes(provider)) {
    errors.push({ field: 'provider', message: `“${provider || '(none)'}” is not a provider — IMA, GPT or CAN` });
    provider = 'ima';
  }
  const url = str(input.value ?? input.url);
  if (!httpUrl(url)) {
    errors.push({ field: 'url', message: `“${url.slice(0, 50)}” is not a full URL (https://…)` });
  } else {
    for (const m of url.matchAll(/\[([A-Za-z0-9_]+)\]/g)) {
      if (!TEMPLATE_MACROS.includes(m[1])) {
        errors.push({ field: 'url', message: `[${m[1]}] is not a macro the player fills — ${TEMPLATE_MACROS.map(x => `[${x}]`).join(', ')}` });
      }
    }
  }
  if (errors.length) throw new Refusal(400, 'invalid_template', 'Request template was refused', { errors });
  return { name, provider, url, property };
}

export function createTemplate(input) {
  const t = normalizeTemplate(input);
  const id = `tpl_${++state.counters.template}`;
  const obj = { id, ...t, updatedAt: new Date().toISOString(), updatedBy: 'You' };
  state.templates.set(id, obj);
  return obj;
}

export function updateTemplate(id, input) {
  const existing = mustGet(state.templates, id, 'request template');
  const t = normalizeTemplate({ ...existing, ...input }, id);
  // Retyping a template's provider under tags that request through it would misroute them.
  if (t.provider !== existing.provider) {
    const holders = tagsUsingTemplate(id).map(x => x.name);
    if (holders.length) {
      throw new Refusal(409, 'template_in_use',
        `“${existing.name}” carries ${holders.length} ${PROVIDER_WORD[existing.provider]} tag${holders.length > 1 ? 's' : ''} — it cannot become ${PROVIDER_WORD[t.provider]}`,
        { usedBy: holders });
    }
  }
  const changes = diff(existing, t);
  Object.assign(existing, t, { updatedAt: new Date().toISOString(), updatedBy: 'You' });
  return { obj: existing, changes };
}

export function deleteTemplate(id) {
  const obj = mustGet(state.templates, id, 'request template');
  const holders = tagsUsingTemplate(id).map(x => x.name);
  if (holders.length) {
    throw new Refusal(409, 'template_in_use',
      `“${obj.name}” carries ${holders.length} tag${holders.length > 1 ? 's' : ''} and cannot be deleted`,
      { usedBy: holders });
  }
  state.templates.delete(id);
  return obj;
}

export function getTemplate(id) { return mustGet(state.templates, id, 'request template'); }
export function listTemplates() { return [...state.templates.values()]; }
export function tagsUsingTemplate(id) { return listTags().filter(t => t.tplId === id); }

// ---------- ad tags ----------
// A tag is a named, typed referent: video tags fit pre/mid/post-roll, display tags
// fit the squeeze-back and sit inside a break as its fallback. Tags live in the ops
// room now — they are what ad setups are built from.

export function normalizeTag(input, exceptId) {
  const errors = [];
  const name = str(input.name);
  if (!name) errors.push({ field: 'name', message: 'Name is required' });
  else if (!uniqueName(state.tags, name, exceptId)) {
    errors.push({ field: 'name', message: `An ad tag named “${name}” already exists` });
  }

  const property = oneOf(input.property ?? 'All', 'property', PROPERTY_SCOPES, errors);
  const value = str(input.value);
  const looksLikeUrl = /^https?:/i.test(value);
  const inputType = str(input.type);
  let provider = str(input.provider);
  // A GAM unit path identifies the account but not the library — the declared type picks
  // it (video → IMA, display → GPT). A pasted URL under no provider is CAN, the one
  // provider you address by endpoint.
  if (!provider) {
    if (looksLikeUrl) {
      provider = 'can';
    } else {
      provider = inputType === 'display' ? 'gpt' : 'ima';
    }
  } else if (!TAG_PROVIDERS.includes(provider)) {
    errors.push({ field: 'provider', message: `“${provider}” is not a provider — IMA, GPT or CAN` });
    provider = 'ima';
  }
  // The TYPE is implied by the protocol wherever it can be: IMA answers with video, GPT
  // with display. Only CAN serves both, so only CAN has to say. A contradiction is
  // refused by name, never silently corrected.
  const implied = PROVIDER_TYPE[provider];
  let type;
  if (implied) {
    if (inputType && inputType !== implied) {
      errors.push({ field: 'type', message: `A ${label(provider)} tag answers with ${implied} by construction — it cannot be ${inputType}` });
    }
    type = implied;
  } else {
    if (!inputType) {
      errors.push({ field: 'type', message: 'CAN serves both — say whether this endpoint returns video or display' });
    }
    type = oneOf(inputType || 'video', 'type', TAG_TYPES, errors);
  }
  if (!value) {
    errors.push({ field: 'value', message: 'An ad tag needs its ad unit or endpoint' });
  } else if (URL_PROVIDERS.includes(provider)) {
    if (!httpUrl(value)) errors.push({ field: 'value', message: `“${value.slice(0, 50)}” is not a full URL (https://…)` });
  } else if (DIRECTORY_PROVIDERS.includes(provider)) {
    // MANUAL ENTRY (27 Aug, user call): the synced directory is a CONVENIENCE, not a
    // gate. A unit trafficked in GAM ten minutes ago is real whether or not our copy has
    // caught up, so a well-formed ad unit path is taken off-directory and MARKED
    // (`offDirectory`), never refused. What is still refused is a value that could not be
    // an ad unit at all — a typo has to fail here, not silently at ad time.
    if (httpUrl(value)) {
      // A direct VAST URL is an ordinary IMA request. GPT has no URL form at all.
      if (provider !== 'ima') {
        errors.push({ field: 'value', message: `GPT asks GAM for an ad unit, not a URL — give the unit path (${AD_UNIT_EXAMPLE}), or save it as a CAN endpoint` });
      }
    } else if (!AD_UNIT_PATH.test(value)) {
      errors.push({ field: 'value', message: `“${value.slice(0, 50)}” is not an ad unit — a GAM ad unit starts with the network code, like ${AD_UNIT_EXAMPLE}` });
    }
  }

  // WHICH TEMPLATE CARRIES IT (31 Aug): Standard is ABSENCE — a tag that never chose
  // stores nothing and follows the provider's default, so every existing tag is
  // untouched and the rung row shows nothing new.
  const tplId = str(input.tplId) || null;
  if (tplId) {
    const tpl = state.templates.get(tplId);
    if (!tpl) {
      errors.push({ field: 'tplId', message: 'That request template doesn\'t exist' });
    } else if (tpl.provider !== provider) {
      errors.push({ field: 'tplId', message: `“${tpl.name}” is a ${label(tpl.provider)} template — this tag asks ${label(provider)}` });
    }
  }

  if (errors.length) throw new Refusal(400, 'invalid_tag', 'Ad tag was refused', { errors });
  return { name, type, property, provider, value, tplId };

  function label(p) { return PROVIDER_WORD[p] || p; }
}

export function createTag(input) {
  const t = normalizeTag(input);
  const id = `tag_${++state.counters.tag}`;
  const obj = { id, ...t, updatedAt: new Date().toISOString(), updatedBy: 'You' };
  state.tags.set(id, obj);
  return obj;
}

export function updateTag(id, input) {
  const existing = mustGet(state.tags, id, 'ad tag');
  const t = normalizeTag({ ...existing, ...input }, id);
  // Retyping a tag that already sits in a ladder would silently misplace it.
  if (t.type !== existing.type) {
    const holders = setupsUsingTag(id).map(s => s.name);
    if (holders.length) {
      throw new Refusal(409, 'tag_in_use',
        `“${existing.name}” is a ${existing.type} tag in use — change what it points at, or make a new tag`,
        { usedBy: holders });
    }
  }
  const changes = diff(existing, t);
  Object.assign(existing, t, { updatedAt: new Date().toISOString(), updatedBy: 'You' });
  return { obj: existing, changes };
}

export function deleteTag(id) {
  const obj = mustGet(state.tags, id, 'ad tag');
  const holders = setupsUsingTag(id).map(s => s.name);
  if (holders.length) {
    throw new Refusal(409, 'tag_in_use',
      `“${obj.name}” is used in ${holders.length} ad setup${holders.length > 1 ? 's' : ''} and cannot be deleted`,
      { usedBy: holders });
  }
  state.tags.delete(id);
  return obj;
}

export function getTag(id) { return mustGet(state.tags, id, 'ad tag'); }
export function listTags() { return [...state.tags.values()]; }

export function setupsUsingTag(id) {
  const inRungs = rungs => (rungs || []).some(r =>
    (r.type === 'tag' && r.tagId === id) || (r.type === 'group' && (r.tagIds || []).includes(id)));
  const holdsTag = slot => slotGroupDefs(slot).some(g => inRungs(g.rungs)) || inRungs(slot.direct?.rungs);
  return listSetups().filter(s =>
    (s.sections || []).some(sec => SLOT_TYPES.some(t => holdsTag(sec.slots[t]))));
}

// ---------- rungs ----------
// Rung 1 is the primary; rungs 2..MAX_RUNGS are Waterfall 1..9 — plain rungs all the
// way down (the "Waterfall N" pool was removed 25 Aug, user call: with ten positions
// there is nothing left for a terminal set to do that a position cannot).
//
// EVERY RUNG CARRIES A SWITCH (19 Aug). A rung that is switched off keeps its place and
// its tag and is simply skipped when the ladder is walked. Under two rooms this switch
// becomes the ops team's sharpest tool: flipping a rung off in a SHARED setup takes a
// sick partner out of every attached integration in one act.

function normalizeRungs(raw, family, errors, field, where, alsoTakes = null, kind = 'ladder', slotType = null) {
  const rungs = [];
  const seenTags = new Set();
  let chain = 0;
  for (const r of Array.isArray(raw) ? raw : []) {
    if (!r) continue;
    // A rung is on unless it says otherwise, so anything written before switches
    // existed keeps running.
    const on = r.on !== false;
    if (r.type === 'group') {
      errors.push({ field, message: `${where}: Waterfall N is gone — list its tags as plain rungs (a ladder holds up to ${MAX_RUNGS})` });
      continue;
    }
    const tagId = str(r.tagId);
    if (!tagId) continue;
    const tag = state.tags.get(tagId);
    if (!tag) {
      errors.push({ field, message: `${where}: that ad tag no longer exists` });
      continue;
    }
    if (seenTags.has(tagId)) {
      errors.push({ field, message: `${where}: “${tag.name}” appears twice — the same tag would be tried twice in a row` });
      continue;
    }
    if (tag.type !== family && tag.type !== alsoTakes) {
      errors.push({ field, message: `${where}: “${tag.name}” is a ${tag.type} tag — this takes ${family} tags` });
      continue;
    }
    seenTags.add(tagId);
    const rung = { type: 'tag', tagId, on };
    // A BANNER CARRIES ITS OWN FOUR FACTS (31 Aug, AD-JSON-SCOPE): where on the page,
    // whether content pauses, and its lifecycle clocks — counted from the moment it
    // APPEARS, so each number stands alone. Type-based, never value-based: a GPT/display
    // rung always has them, a video rung never does. In a rotation the timings live in
    // Delivery settings (drawn once, not five times), so its rungs keep only the slot.
    // PAUSE CONTENT IS EVERY UNIT'S OWN ANSWER in a break (31 Aug, user call — and the
    // JSON's: every unit carries `pause`). A video unit defaults to pausing (it takes
    // the screen); a banner defaults to playing over. The CLOCKS and the PAGE SLOT stay
    // the banner's alone — a video ad runs its own length in the player's own frame.
    if (kind === 'ladder') {
      const rerrs = [];
      rung.pause = oneOf(r.pause ?? (tag.type === 'video' ? 'yes' : 'no'), 'pause', PAUSE_MODES, rerrs);
      // REQUEST DELAY on EVERY ladder rung (2 Sep, user call — was the banner-only
      // "render delay"): how long after its turn comes the unit's request fires. A
      // banner defaults to 1s as it always did; a video rung is sparse — absent fires
      // immediately, so every rung saved before the widening behaves exactly as it did.
      if (r.showAfterSec !== undefined || tag.type === 'display') {
        rung.showAfterSec = intIn(r.showAfterSec ?? 1, 'showAfterSec', 0, 30, rerrs);
      }
      for (const e of rerrs) errors.push({ field, message: `${where}: “${tag.name}” — ${e.message}` });
    }
    // AD PLACEMENT IS EVERY UNIT'S (3 Sep, user call): where on the page the unit
    // renders — a banner directly, a video unit's companion alongside it. It used to be
    // a display-only fact, and a video unit carrying one was refused by name.
    if (kind === 'ladder' || slotType === 'outstream') {
      rung.displaySlot = DISPLAY_SLOTS.includes(r.displaySlot) ? r.displaySlot : DISPLAY_SLOTS[0];
      if (r.displaySlot !== undefined && !DISPLAY_SLOTS.includes(r.displaySlot)) {
        errors.push({ field, message: `${where}: “${r.displaySlot}” is not an ad placement the player offers — ${DISPLAY_SLOTS.map(x => DISPLAY_SLOT_WORD[x]).join(', ')}` });
      }
    }
    if (tag.type === 'display') {
      if (kind === 'ladder') {
        const rerrs = [];
        rung.closeAfterSec = intIn(r.closeAfterSec ?? 5, 'closeAfterSec', 0, 60, rerrs);
        rung.hideAfterSec = intIn(r.hideAfterSec ?? 10, 'hideAfterSec', 5, 120, rerrs);
        if (!rerrs.length && rung.hideAfterSec < rung.closeAfterSec) {
          rerrs.push({ field: 'hideAfterSec', message: `it would hide at ${rung.hideAfterSec}s, before its close button at ${rung.closeAfterSec}s` });
        }
        for (const e of rerrs) errors.push({ field, message: `${where}: “${tag.name}” — ${e.message}` });
      }
    } else if (r.closeAfterSec !== undefined || r.hideAfterSec !== undefined) {
      errors.push({ field, message: `${where}: “${tag.name}” is a video ad — it runs its own length in the player's frame, so a close button and an auto-hide clock do not apply` });
    }
    rungs.push(rung);
    chain++;
  }
  // A break falls back to ONE display unit — the settle point. Two would make every
  // type-addressed act ambiguous.
  if (kind === 'ladder' && alsoTakes === 'display') {
    const displays = rungs.filter(r => r.type === 'tag' && state.tags.get(r.tagId)?.type === 'display');
    if (displays.length > 1) {
      const names = displays.map(r => `“${state.tags.get(r.tagId).name}”`).join(' and ');
      errors.push({ field, message: `${where}: a break falls back to one display unit — ${names} are both display tags` });
    }
  }
  if (kind === 'rotation') {
    if (chain > ROTATION_MAX) {
      errors.push({ field, message: `${where}: a squeeze-back rotates up to ${ROTATION_MAX} tags (got ${chain})` });
    }
  } else if (chain > MAX_RUNGS) {
    errors.push({ field, message: `${where}: at most ${MAX_RUNGS} rungs — one primary and ${MAX_RUNGS - 1} waterfalls (got ${chain})` });
  }
  return rungs;
}

// What the ladder would actually walk: switched-off rungs are configuration, not demand.
export function liveRungs(rungs) {
  return (rungs || []).filter(r => r.on !== false);
}

// ---------- the walk a section makes (DRIVING-SCOPE, 26 Aug) ----------
// The setup's ladder IS the arrangement now — no local order, no local mutes. Rungs
// are still addressed by KEY (the tagId), never by index.

export function rungKeyOf(r) {
  return r.tagId;
}

// The ladder as the product room sees it: the setup's rungs in the setup's order, each
// carrying the one off-state left — the ops kill switch.
export function localLadder(rungs) {
  return (rungs || []).map(r => ({ ...r, key: rungKeyOf(r), opsOff: r.on === false }));
}

// The setup's own walk: the live rungs, in the setup's order. The ops-side positional
// depth (walkDepth) died 31 Aug with the field cut — the surface's Waterfall depth in
// Ad delivery is the one cut left.
export function localWalk(rungs) {
  return localLadder(rungs).filter(r => !r.opsOff);
}

// The provider a rung answers with — the vocabulary drive decisions are made in.
export function rungProvider(r) {
  const tag = state.tags.get(r.tagId);
  return tag ? tag.provider : 'other';
}

// The walk a section REALLY makes: the setup's arrangement with the drive decision
// resolved against it. With no `who` and no `tries` this is exactly the old walk.
//   who unset      → the setup's positional walk, untouched.
//   who = only:p   → that company's live rungs, in setup order.
//   who = first:p  → that company's live rungs first, then the rest, in setup order.
//   tries          → the surface's own count of real tries, cut last.
// `fellBack`: the decision found nothing (only:p with no p) — the break runs the
// setup's own arrangement instead, loudly, because an empty break is silent lost money.
export function driveWalkRungs(rungs, behaviour, drive, type) {
  const base = localWalk(rungs);
  const d = drive || {};
  const ask = driveAsk(d.ask);
  let walk = base;
  let fellBack = false; // the fallback EXISTS and the decision filtered it to nothing — the walk diverges
  let vacuous = false; // no fallback to decide over — the walk is the same either way (1 Sep, groups walkthrough)
  if (ask && SLOT_KIND[type] !== 'rotation') {
    // TIERS (31 Aug, AD-JSON-SCOPE): the PRIMARY is a position, not a preference — it
    // is always tried first and the ask never displaces it. What the ask filters and
    // orders is the FALLBACK, which is the only ordered thing left.
    const ladder = localLadder(rungs);
    const primary = ladder[0] && !ladder[0].opsOff ? ladder[0] : null;
    const tail = ladder.slice(1).filter(r => !r.opsOff);
    // Only the partners on the list, in the order the list puts them. The sort is
    // stable, so two rungs of the same partner keep the order ad ops gave them.
    const mine = tail.filter(r => ask.includes(rungProvider(r)));
    if (!tail.length) {
      // No fallback at all: the decision has nothing to bite on. The walk stands as it
      // is (a primary is a position), so the standing views stay QUIET — but the save
      // that makes such a decision still counts this section as one it means nothing in.
      vacuous = base.length > 0;
    } else if (!mine.length) {
      // None of those partners in the fallback — the decision cannot mean anything in
      // this section, so it runs the setup's own arrangement, loudly.
      fellBack = true;
    } else {
      const ordered = [...mine].sort((a, b) => ask.indexOf(rungProvider(a)) - ask.indexOf(rungProvider(b)));
      walk = [...(primary ? [primary] : []), ...ordered];
    }
  }
  if (d.tries && SLOT_KIND[type] !== 'rotation') walk = walk.slice(0, d.tries);
  return { walk, fellBack, vacuous };
}

// A slot's BREAK GROUPS (31 Aug): only a mid-roll holds more than one; every other
// slot reads as its own single group, so callers walk one grammar.
export function slotGroupDefs(slotDef) {
  return (slotDef.groups && slotDef.groups.length)
    ? slotDef.groups
    : [{ rungs: slotDef.rungs, behaviour: slotDef.behaviour }];
}

export function driveWalk(secDef, drive, type) {
  const g = slotGroupDefs(secDef.slots[type])[0];
  return driveWalkRungs(g.rungs, g.behaviour, drive, type);
}

// Every group's walk, resolved the same way — the seam and the player read all of them.
export function groupWalks(secDef, drive, type) {
  return slotGroupDefs(secDef.slots[type]).map(g => driveWalkRungs(g.rungs, g.behaviour, drive, type));
}

// One function, so the number that warns is the number that serves.
export function effectiveWalk(secDef, drive, type) {
  return driveWalk(secDef, drive, type).walk;
}

// ---------- ad setups (the ops room's object) ----------
// One whole surface's demand — now WITH its placements (25 Aug, user call): the setup
// carries SECTIONS, each a named placement with its own ladders. Ops define the shape;
// the integration attaching it gets those sections and overlays its own use (switches,
// mute, order, rules/player forks). Attachable to 1..N integrations, so two surfaces of
// one shape still share — and the one-act fix survives. A family MAY be empty: that is
// a fact, and the seam refuses to switch that slot on anywhere the setup is attached.

export function normalizeSetup(input, exceptId) {
  const errors = [];
  const name = str(input.name);
  if (!name) errors.push({ field: 'name', message: 'Name is required' });
  else if (!uniqueName(state.setups, name, exceptId)) {
    errors.push({ field: 'name', message: `An ad setup named “${name}” already exists` });
  }
  const property = oneOf(input.property ?? 'All', 'property', PROPERTY_SCOPES, errors);

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
    const where = `${secName || `placement ${i + 1}`}: `;

    // EVERY PLACEMENT CARRIES ITS OWN BEHAVIOUR (25 Aug, user call), and a new one is a
    // CLONE of Default rather than a blank — the values are already sane, and changing
    // one is then an edit, not a fill-in-fifteen-fields chore. Cloning happens here so
    // it holds for any caller, and a partial patch never resets what it did not mention.
    // A placement has NO session-wide settings of its own since 27 Aug — only its slots.
    refuseDeadRules(sec.rules, errors, where);

    if (sec.slots?.squeezeback && ((sec.slots.squeezeback.rungs || []).length || sec.slots.squeezeback.behaviour)) {
      errors.push({ field: 'sections', message: `${where}the squeeze-back slot is gone — a banner over playing content is a break\u2019s display fallback, and the idle player\u2019s rotation is Out-stream` });
    }
    const slots = {};
    for (const t of SLOT_TYPES) {
      const rungWhere = `${name || 'this setup'} · ${secName || `placement ${i + 1}`} ${t}`;
      const slotIn = sec.slots?.[t] || {};
      let gsInRaw = null; // the mid-roll's groups AS SENT — each pod's own deal is read from it below
      // A MID-ROLL IS BREAK GROUPS (31 Aug, AD-JSON-SCOPE): up to 3, each its own
      // cadence and its own ladder. Group 1 IS the mid-roll — it doubles as the slot's
      // own rungs/behaviour, so every single-group path reads exactly what it always
      // read. A top-level rungs/behaviour patch lands on group 1; a groups patch is
      // authoritative.
      if (t === 'midroll') {
        let gsIn = Array.isArray(slotIn.groups) && slotIn.groups.length ? slotIn.groups.slice() : null;
        if (gsIn) {
          if (slotIn.rungs && slotIn.rungs !== gsIn[0].rungs) gsIn[0] = { ...gsIn[0], rungs: slotIn.rungs };
          if (slotIn.behaviour && slotIn.behaviour !== gsIn[0].behaviour) gsIn[0] = { ...gsIn[0], behaviour: slotIn.behaviour };
        } else {
          gsIn = [{ rungs: slotIn.rungs, behaviour: slotIn.behaviour }];
        }
        gsInRaw = gsIn;
        if (gsIn.length > MAX_MIDROLL_GROUPS) {
          errors.push({ field: 'sections', message: `${where}a mid-roll holds at most ${MAX_MIDROLL_GROUPS} break groups (got ${gsIn.length})` });
        }
        const multi = gsIn.length > 1;
        const groups = gsIn.slice(0, MAX_MIDROLL_GROUPS).map((g, gi) => ({
          rungs: normalizeRungs(g.rungs, SLOT_FAMILY[t], errors, 'sections',
            `${rungWhere}${multi ? ` group ${gi + 1}` : ''}`, SLOT_ALSO_TAKES[t], SLOT_KIND[t], t),
          behaviour: normalizeSlotBehaviour(t,
            g.behaviour || (defaults ? defaults.slots[t].behaviour : null),
            errors, warnings, `${where}${t}${multi ? ` group ${gi + 1}` : ''} `),
        }));
        slots[t] = { rungs: groups[0].rungs, behaviour: groups[0].behaviour, groups };
      } else {
        if (Array.isArray(slotIn.groups) && slotIn.groups.length > 1) {
          errors.push({ field: 'sections', message: `${where}only a mid-roll holds break groups — a ${t} is one break` });
        }
        slots[t] = {
          rungs: normalizeRungs(slotIn.rungs, SLOT_FAMILY[t], errors, 'sections', rungWhere, SLOT_ALSO_TAKES[t], SLOT_KIND[t], t),
          behaviour: normalizeSlotBehaviour(t,
            slotIn.behaviour || (defaults ? defaults.slots[t].behaviour : null),
            errors, warnings, `${where}${t} `),
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
            errors.push({ field: 'sections', message: `${where}${t}${gTag}: direct has no session cap any more — the deal is tried each time the break fires` });
          }
          const dRungs = normalizeRungs(d.rungs, 'video', errors, 'sections',
            `${rungWhere}${gTag} direct`, 'display', 'ladder', t);
          if (dRungs.length > 1) {
            errors.push({ field: 'sections', message: `${where}${t}${gTag} carries ONE direct deal — the tier is the deal, not a ladder (got ${dRungs.length})` });
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
        errors.push({ field: 'sections', message: `${where}${t} takes turns — direct is break demand, and this is not a break` });
      }
      // THE UNREACHABLE TAIL, counted (31 Aug): tries × per-try wait against the
      // break's own giving-up point. A lever, never a wall.
      for (const [gi, g] of slotGroupDefs(slots[t]).entries()) {
        const b = g.behaviour;
        if (!b || SLOT_KIND[t] !== 'ladder') continue;
        const n = localWalk(g.rungs).length;
        const reachable = Math.max(1, Math.floor((b.fillTimeoutSec * 1000) / b.tagTimeoutMs));
        if (n > 1 && reachable < n) {
          const gTag = (slots[t].groups && slots[t].groups.length > 1) ? ` group ${gi + 1}` : '';
          warnings.push(`${where}${t}${gTag}: ${n} tries × ${fmtSecs(b.tagTimeoutMs)} is ${fmtSecs(n * b.tagTimeoutMs)}, but the break gives up at ${b.fillTimeoutSec}s — the last ${n - reachable} ${n - reachable === 1 ? 'try' : 'tries'} would never run`);
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
          warnings.push(`${where}${mgs.length} mid-roll break groups total up to ${totalAds} ads a stream — heavy for anything under 20 minutes`);
        }
      }
      // Two groups landing breaks within a minute of each other feel relentless.
      const cued = mgs.map(g => g.behaviour).filter(b => b.mode === 'cuepoints');
      outer: for (let a = 0; a < cued.length; a++) {
        for (let bI = a + 1; bI < cued.length; bI++) {
          for (const ca of cued[a].cuepoints) for (const cb of cued[bI].cuepoints) {
            if (Math.abs(ca - cb) < 60) {
              warnings.push(`${where}two mid-roll groups both fall near ${fmtSecs(Math.min(ca, cb) * 1000)} — breaks under a minute apart will feel relentless`);
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
  return { name, property, sections, warnings };
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
            rungs: g.rungs || pg.rungs,
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
  const { warnings: ruleWarnings, ...s } = normalizeSetup({ ...existing, ...input, sections: mergedSections }, id);

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
            throw new Refusal(409, 'setup_in_use',
              `1 live section fills their ${t}${multi ? ` group ${gi + 1}` : ''} from this — switch them off first`,
              { usedBy: [`${k.name} · ${ov.name}`] });
          }
        });
        if (walks.some(r => r.fellBack || r.vacuous)) {
          const provs = askWord(driveAsk(k.drive?.[t]?.ask) || []);
          driftWarnings.push(`${k.name}'s ${t} asks ${provs} — nothing of theirs is left in “${ov.name}”, so it falls back to your arrangement`);
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
        warnings.push(`${n} tries × ${fmtSecs(next.tagTimeoutMs)} is ${fmtSecs(n * next.tagTimeoutMs)}, but the break gives up at ${next.fillTimeoutSec}s — the last ${n - reachable} ${n - reachable === 1 ? 'try' : 'tries'} would never run`);
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

// The slot's display word, so a version's change list reads the way the screen does
// rather than the way the payload does (27 Aug nomenclature pass).
export const SLOT_WORD = {
  preroll: 'Pre-roll', midroll: 'Mid-roll', postroll: 'Post-roll', outstream: 'Out-stream',
};

// A tag typed in by hand before GAM caught up. DERIVED, never stored — the next sync
// that pulls the unit in clears the mark on its own, with nothing to remember.
export function tagOffDirectory(t) {
  return !!t && DIRECTORY_PROVIDERS.includes(t.provider) && !httpUrl(t.value) && !gamHasUnit(t.value);
}

// ---------- integrations (api keys) ----------
// The PLACEMENTS come from the attached ad setup now (25 Aug): ops define the sections
// and their ladders together, once per surface shape. The integration attaches ONE
// setup and stores an OVERLAY per placement, matched by name — its switches, its local
// mute/order, and its rules/player forks. The first overlay is always Default and must
// carry the integration's own rules and player. Overlays whose placement no longer
// exists in the setup are kept but inert — a rename in the setup migrates them.

// The words a refusal uses for a behaviour field — the UI's labels, not its keys.
const FIELD_WORDS = {
  start: 'when the pre-roll plays', deferSec: 'the pre-roll delay',
  wait: 'when the video starts', waitMs: 'the viewer wait',
  mode: 'how mid-roll breaks fall', cuepoints: 'the break positions',
  firstAt: 'the first break', every: 'the break interval',
  podAds: 'the target impressions count',
  nextAd: 'where the next ad comes from',
  podBanner: 'where a banner may sit', tagTimeoutMs: 'how long each tag waits',
  ask: 'the ad partners', tries: 'the waterfall depth', direct: 'direct campaigns',
  times: 'the show times', hold: 'the hold',
  refresh: 'the rotation', perSession: 'how many a session',
  fillTimeoutSec: 'when the break gives up',
  hideOnInStream: 'hiding during video ads',
  displaySlot: 'the display slot', pause: 'whether content pauses',
  showAfterSec: 'the request delay', closeAfterSec: 'when its close button appears',
  hideAfterSec: 'when it hides',
};

// The UI's word for a behaviour field, so a refusal from any surface reads the same.
export function fieldWord(f) { return FIELD_WORDS[f] || f; }

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

// ---------- shared ----------

function mustGet(map, id, label) {
  const obj = map.get(id);
  if (!obj) throw new Refusal(404, 'not_found', `No such ${label}: ${id}`);
  return obj;
}

export function getKey(id) { return mustGet(state.keys, id, 'integration'); }
// A rung's tag without the refusal — anything that walks ladders needs to ask "what
// type is this?" of every rung, including any whose tag has since gone.
export function getTagOrNull(id) { return state.tags.get(id) || null; }

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

// Field-level diff, prior value and new value — what a save reports back to the editor.
export function diff(before, after) {
  const changes = [];
  for (const field of Object.keys(after)) {
    if (field === 'updatedAt' || field === 'id') continue;
    const a = JSON.stringify(before[field]);
    const b = JSON.stringify(after[field]);
    if (a !== b) changes.push({ field, from: before[field], to: after[field] });
  }
  return changes;
}

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

function objectOf(kind, id) {
  return kind === 'key' ? mustGet(state.keys, id, 'integration') : mustGet(state.setups, id, 'ad setup');
}

export function draftSnapshot(kind, obj) { return PUBLISHABLE[kind](obj); }

export function liveSnapshot(id) { return state.live.get(id)?.snapshot ?? null; }
export function liveVersion(id) { return state.live.get(id)?.v ?? null; }
export function versionsOf(id) { return state.versions.get(id) || []; }
export function isPublished(id) { return state.live.has(id); }

// ---------- what changed, in words ----------
// The rail's whole job is "what did this version do?", so a change is a WHERE and a
// WHAT, never a JSON blob. Ladders are the one thing a flat diff cannot say usefully,
// so they are described by name: what joined, what left, what was switched.

function flat(v, prefix, out) {
  if (v && typeof v === 'object' && !Array.isArray(v)) {
    for (const [k, x] of Object.entries(v)) flat(x, prefix ? `${prefix}.${k}` : k, out);
  } else {
    out[prefix] = v;
  }
  return out;
}

function rungWords(rungs) {
  return (rungs || []).map(r => {
    const t = state.tags.get(r.tagId);
    return `${t ? t.name : '(missing tag)'}${r.on === false ? ' (off)' : ''}`;
  });
}

// A banner's own facts moving on a rung is a change the rail must say — the tags and
// their order can hold perfectly still while where-on-the-page or the pause answer moves.
function rungFactChanges(where, before, after) {
  const out = [];
  const byTag = arr => Object.fromEntries((arr || []).map(r => [r.tagId, r]));
  const bB = byTag(before);
  for (const r of after || []) {
    const prev = bB[r.tagId];
    if (!prev) continue;
    for (const f of ['displaySlot', 'pause', 'showAfterSec', 'closeAfterSec', 'hideAfterSec']) {
      if (JSON.stringify(prev[f]) !== JSON.stringify(r[f])) {
        const t = state.tags.get(r.tagId);
        const word = v => f === 'displaySlot' ? (DISPLAY_SLOT_WORD[v] || v) : f === 'pause' ? (PAUSE_WORD[v] || v) : v;
        out.push({ where: `${where} · ${t ? t.name : r.tagId}`, field: f, from: word(prev[f]), to: word(r[f]) });
      }
    }
  }
  return out;
}

function ladderChange(where, before, after) {
  const a = rungWords(before);
  const b = rungWords(after);
  if (JSON.stringify(a) === JSON.stringify(b)) return null;
  const gone = a.filter(x => !b.includes(x));
  const came = b.filter(x => !a.includes(x));
  const bits = [];
  if (came.length) bits.push(`+ ${came.join(', ')}`);
  if (gone.length) bits.push(`− ${gone.join(', ')}`);
  if (!bits.length) bits.push('reordered');
  return { where, field: 'Ladder', from: `${a.length} rung${a.length === 1 ? '' : 's'}`, to: `${b.length} — ${bits.join(' · ')}` };
}

// Every field a version moved, said where it lives. Placements added or removed are one
// line each rather than forty — a new placement is one decision, not forty of them.
export function versionChanges(kind, before, after) {
  const out = [];
  const b = before || null;
  if (!b) return [{ where: '', field: 'First publish', from: '—', to: 'live' }];

  for (const f of Object.keys(after)) {
    if (f === 'sections') continue;
    const x = JSON.stringify(b[f]);
    const y = JSON.stringify(after[f]);
    if (x === y) continue;
    if (f === 'player' || f === 'drive') {
      const fb = flat(b[f] || {}, '', {});
      const fa = flat(after[f] || {}, '', {});
      for (const k of new Set([...Object.keys(fb), ...Object.keys(fa)])) {
        if (JSON.stringify(fb[k]) !== JSON.stringify(fa[k])) {
          // A drive field is keyed by BREAK (`preroll.tries`), so the break is the
          // where — "Ad delivery" for all four read as one undifferentiated pile, and
          // which break a decision moved on is the first thing anyone asks.
          const seg = f === 'drive' ? k.split('.')[0] : null;
          out.push({
            where: seg ? (SLOT_WORD[seg] || seg) : 'Player',
            field: k.split('.').pop(), from: fb[k], to: fa[k],
          });
        }
      }
    } else if (f === 'playerConfigs') {
      // A custom config appearing or leaving is one decision, one line; a field moving
      // inside one is named where it lives — matched by name, like placements.
      const byName = arr => Object.fromEntries((arr || []).map(c => [c.name, c]));
      const cb = byName(b[f]);
      const ca = byName(after[f]);
      for (const name of Object.keys(cb)) {
        if (!ca[name]) out.push({ where: 'Player configs', field: name, from: 'custom config', to: 'removed' });
      }
      for (const name of Object.keys(ca)) {
        if (!cb[name]) { out.push({ where: 'Player configs', field: name, from: '—', to: 'added' }); continue; }
        for (const g of ['playback', 'expandInMini', 'autoplay', 'startVolume']) {
          if (JSON.stringify(cb[name][g]) !== JSON.stringify(ca[name][g])) {
            out.push({ where: `Player configs · ${name}`, field: g, from: cb[name][g], to: ca[name][g] });
          }
        }
      }
    } else {
      out.push({ where: '', field: f, from: b[f], to: after[f] });
    }
  }

  const byName = arr => Object.fromEntries((arr || []).map(s => [s.name, s]));
  const sb = byName(b.sections);
  const sa = byName(after.sections);
  for (const name of Object.keys(sb)) {
    if (!sa[name]) out.push({ where: name, field: 'Placement', from: 'there', to: 'removed' });
  }
  for (const [name, secA] of Object.entries(sa)) {
    const secB = sb[name];
    if (!secB) { out.push({ where: name, field: 'Placement', from: '—', to: 'added' }); continue; }
    for (const t of SLOT_TYPES) {
      const slA = secA.slots[t] || {};
      const slB = secB.slots[t] || {};
      const where = `${name} · ${SLOT_WORD[t] || t}`;
      if (slA.on !== undefined && !!slA.on !== !!slB.on) {
        // A switch groups by BREAK, with the placement in the field name — so every
        // change to the pre-roll reads together, whichever placement it landed on.
        out.push({
          where: SLOT_WORD[t] || t, field: `${name} — runs`,
          from: slB.on ? 'active' : 'inactive', to: slA.on ? 'active' : 'inactive',
        });
      }
      // Break groups diff group by group — group 1 doubles as the slot itself, so a
      // slot with no `groups` reads as one group and the line reads exactly as before.
      // The slot's own direct tier, diffed by name.
      if (slA.direct || slB.direct) {
        const dWhere = `${where} · Direct`;
        const lc = ladderChange(dWhere, slB.direct?.rungs, slA.direct?.rungs || []);
        if (lc) out.push(lc);
        out.push(...rungFactChanges(dWhere, slB.direct?.rungs, slA.direct?.rungs));
      }
      const ga = slA.rungs || slA.groups ? slotGroupDefs(slA) : null;
      const gb = slotGroupDefs(slB);
      if (ga) {
        const n = Math.max(ga.length, gb.length);
        for (let gi = 0; gi < n; gi++) {
          const gWhere = n > 1 ? `${where} group ${gi + 1}` : where;
          const a = ga[gi];
          const bg = gb[gi];
          if (!a) { out.push({ where: gWhere, field: 'Break group', from: 'there', to: 'removed' }); continue; }
          if (!bg) { out.push({ where: gWhere, field: 'Break group', from: '—', to: 'added' }); }
          if (a.rungs) {
            const lc = ladderChange(gWhere, bg?.rungs, a.rungs);
            if (lc) out.push(lc);
            out.push(...rungFactChanges(gWhere, bg?.rungs, a.rungs));
          }
          for (const f of Object.keys(a.behaviour || {})) {
            if (JSON.stringify(bg?.behaviour?.[f]) !== JSON.stringify(a.behaviour[f])) {
              out.push({ where: gWhere, field: f, from: bg?.behaviour?.[f], to: a.behaviour[f] });
            }
          }
        }
      }
    }
  }
  return out;
}

export function unpublishedChanges(kind, id) {
  const obj = objectOf(kind, id);
  return versionChanges(kind, liveSnapshot(id), draftSnapshot(kind, obj));
}

export function isDirty(kind, id) {
  const obj = objectOf(kind, id);
  return JSON.stringify(liveSnapshot(id)) !== JSON.stringify(draftSnapshot(kind, obj));
}

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
      const tpl = state.templates.get(tag.tplId);
      if (tpl) { out.tpl = tpl.name; unittpl[tpl.name] = tpl.url; }
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

  return {
    key: apiKey,
    integration: { name: ks.name, property: ks.property, platform: ks.platform, domains: ks.domains, packageName: ks.packageName },
    player: ks.player,
    // The named forks a player may ask for (2 Sep): each carries only the three facts
    // that vary per placement; everything else follows `player`. Emitted only when the
    // surface has any — the common integration's JSON does not grow a field.
    ...(ks.playerConfigs && ks.playerConfigs.length ? { playerConfigs: ks.playerConfigs.map(c => ({ ...c })) } : {}),
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
