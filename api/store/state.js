// store/state.js — the in-memory maps, the VOCABULARY (every enum, cap and seller-facing
// word the model uses), deterministic ids, the Refusal error, and reset.
//
// Every other store module imports from here and this file imports from nothing, so it
// is the one place a new enum value or cap is added.
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

// On / Off / Auto (3 Sep, user call — was none/muted/sound). Whether the player
// autoplays is one decision; how LOUD it is, is another — the player's one
// `passiveVolume` (0–100, set in Details), never a rider on the autoplay answer.
export const AUTOPLAY = ['on', 'off', 'auto'];
export const PLAYBACK_MODES = ['inline', 'inline_redirect', 'youtube'];
// A config's PLAYBACK MODE (2 Sep, user call — replacing the day-old engagement mode):
// the player runs the placement actively or passively. The user's vocabulary, verbatim.
export const PLAYBACK_KINDS = ['active', 'passive'];

// ---------- THE PLAYER'S OWN LEVERS (11 Sep, docs/PLAYER-LEVERS.xlsx) ----------
// The panel stopped being ads-only when it became the Player Console (3 Sep), so the
// levers the 25 Aug trim sent back to "the publisher's own player" come home — but
// SECTIONED, named for what they contain and ordered by the playback lifecycle. Four of
// the five namespaces the player's config block uses map to exactly one section each
// (pref, controls, theme, analytics); only `playback` splits, because it holds four
// unrelated moments. The mapping to that block is done at ONE boundary (publish.js).
export const CONTROLS_MODES = ['full', 'minimal', 'none'];
export const END_SCREENS = ['none', 'related', 'custom'];
// Q10's recommendation, implemented: ONE shape — the four corners, plus Off. The block
// mixes corners with a bare top/bottom, which cannot be drawn as one control; `off` is
// the empty string on the wire, so the player's own contract is unchanged.
export const DOCK_POSITIONS = ['off', 'lt', 'rt', 'lb', 'rb'];
export const DOCK_WORD = { off: 'Off', lt: 'Top left', rt: 'Top right', lb: 'Bottom left', rb: 'Bottom right' };
// How much the player reports. 1/2/3 on the wire is the player team's encoding; the
// panel says it in words, because "3" is not a thing anyone can agree to.
export const ANALYTICS_LEVELS = [1, 2, 3];
export const ANALYTICS_LEVEL_WORD = { 1: 'Basic', 2: 'Basic + ads', 3: 'Full' };
// Q6, PROVISIONAL: the player team owns this list and an unknown name is refused by
// name, exactly as a tag macro is. Until they hand it over the panel holds these nine.
export const PLAYER_CONTROLS = ['play', 'progress', 'volume', 'fullscreen', 'quality', 'captions', 'speed', 'pip', 'share'];
export const PLAYER_CONTROL_WORD = {
  play: 'Play / pause', progress: 'Progress bar', volume: 'Volume', fullscreen: 'Fullscreen',
  quality: 'Quality', captions: 'Captions', speed: 'Speed', pip: 'Picture in picture', share: 'Share',
};
// A SET, not an order — 1x is always in it, so it is never offered as removable.
export const PLAYBACK_RATES = [0.5, 1, 1.25, 1.5, 2];
// EVERY FIELD THE PLAYER CARRIES, in the card's own order — the one list the normalizer,
// the wire boundary, the change review and the custom-config editor all read.
export const PLAYER_FIELDS = [
  // Playback · Start
  'autoplay', 'passiveVolume', 'muted', 'playback', 'expandInMini',
  'rememberVolume', 'rememberAudioLang', 'rememberCaptions',
  // Playback · Source
  'playbackMode', 'redirectUrl', 'quality', 'fallbackMediaId',
  // Playback · Out of view · Completion
  'dock', 'autoPausePct', 'loop', 'endScreen',
  // Controls & appearance
  'controlsMode', 'hiddenControls', 'playbackRates', 'controlsAutoHideMs',
  'brandColor', 'textColor', 'logoUrl',
  // Analytics & measurement
  'analyticsLevel', 'viewAfterMs', 'heartbeatMs', 'comscoreId', 'nielsenId', 'gaId',
];
// A CUSTOM CONFIG MAY OVERRIDE ANY OF THEM (13 Sep, user call — *"create custom config
// using all these fields"*). This reverses the 11 Sep six-field fork rule and, with it,
// the 7 Sep "one Passive volume" refusal: the model is now DEFAULT + SPARSE OVERRIDES.
// A config carries only what it changes and inherits the rest LIVE, so what a fork may
// not do is no longer policed by a refusal list — it is made VISIBLE instead: every
// override is named on the row, in the editor and in the change review, and the one
// group where a wrong answer is otherwise invisible (measurement) is named loudest.
export const CONFIG_FORKABLE = PLAYER_FIELDS;
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
// `status` (active/paused) is GONE (27 Aug, user call). It was the one field that
// reached a viewer without going through the publish plane, and everything it did is
// what Unpublish does — see THE PUBLISH PLANE at the foot of this file. A payload still
// carrying it is refused by name.

// THE SQUEEZE-BACK IS GONE (31 Aug, user call). A banner over playing content is a
// rung of the break's waterfall; the idle player's rotation is Out-stream. The
// slot is removed, not hidden — a payload still carrying one is refused by name.
export const SLOT_TYPES = ['preroll', 'midroll', 'postroll', 'outstream'];
// Every tag is either a video tag or a display tag; the family decides what fits where.
export const TAG_TYPES = ['video', 'display'];
// WHERE A LADDER BREAK'S ADS COME FROM (5 Sep as two answers; three since 8 Sep). A break
// serves its own units, follows the setup's waterfall, or serves nothing. All three keep
// the break's own units in `ownRungs`, so the answer is always reversible — only what
// SERVES differs. `none` is stored rather than inferred from an empty ladder: emptying a
// ladder and switching a break off are different acts with different ways back.
export const AD_SOURCES = ['own', 'setup', 'none'];
// The seller's word for the setup's shared ladder (8 Sep, user call), spelled once on
// this side of HTTP as it is spelled once on the other (`WF_WORD` in web/js/util.js).
// The wire key stays `setup` — this names it in refusals and warnings, nothing else.
export const WF_WORD = 'global waterfall';
// HEADER BIDDING (10 Sep, user call): who else bids for a slot BEFORE the ad server is
// asked. Two libraries, so four answers — neither, both, or one of them — and they are
// the SETUP's answer, set once at its head, because a surface that runs Amazon runs it
// for the whole surface. Every slot may dissent: see SLOT_HEADER_BIDDING.
export const HEADER_BIDDING = ['off', 'amazon_prebid', 'amazon', 'prebid'];
// A SLOT's answer adds one: `auto` — borrow the setup's, whatever it says today, which
// is what almost every slot wants and so is the default said by absence. Off here is a
// slot REFUSING bidders the rest of the surface runs, which is why it is stored rather
// than inferred from the global being off.
export const SLOT_HEADER_BIDDING = ['auto', ...HEADER_BIDDING];
// The partners' own words (the user's spelling), so a refusal, a warning and the UI
// agree. Spelled once on each side of HTTP — `LABELS.headerBidding` in web/js/util.js.
export const HB_WORD = {
  auto: 'Auto', off: 'Off', amazon_prebid: 'Amazon+Prebid', amazon: 'Amazon', prebid: 'Prebid',
};

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
// REMOVED 31 Aug (user call): a banner over playing content is a waterfall rung,
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
// The slot in seller words — a raw key never reaches a message (7 Sep, user call:
// "Shorts feed: midroll …" in a receipt read as engineering). Capitalized like the
// client's labels for wheres/headings; `.toLowerCase()` mid-sentence.
export const SLOT_WORD = {
  preroll: 'Pre-roll', midroll: 'Mid-roll', postroll: 'Post-roll',
  outstream: 'Out-stream',
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
// WHICH SOUND IS MUTED while the content keeps playing under an ad (11 Sep, user call):
// two things are rendering, so one of them is quiet — the ad by default, the viewer
// came for the content. Only asked while `pause` is not Yes; kept underneath otherwise,
// the way a unit's own pause answer sits under the waterfall's one answer.
export const MUTE_MODES = ['ad', 'content'];
export const MUTE_WORD = { ad: 'Ad', content: 'Content' };
// A BREAK UNIT'S OWN FACTS, IN ONE LIST (11 Sep): the response shape, the snapshot, the
// player's JSON and the version diff all copy these same seven, so a fact added here
// reaches every plane at once — four hand-copied lists carried the first five.
// `headerBidding` (11 Sep) is the unit's answer in the slot's grammar (SLOT_HEADER_BIDDING:
// `auto` borrows the BREAK's served answer); the player's JSON carries it RESOLVED.
export const RUNG_FACTS = ['displaySlot', 'pause', 'mute', 'headerBidding', 'showAfterSec', 'closeAfterSec', 'hideAfterSec'];
// A MID-ROLL IS BREAK GROUPS (31 Aug, user call): up to 3, each with its own cadence
// and its own ladder. One group is today's mid-roll, and draws no group chrome.
export const MAX_MIDROLL_GROUPS = 3;
// REQUEST TEMPLATE MACROS (31 Aug — reverses the 20 Aug "no interface" call, on the
// user's word). The vocabulary is the PLAYER TEAM's: the panel validates against it,
// fail closed, so ops can pick a template but never break a URL.
export const TEMPLATE_MACROS = ['CACHEBUSTER', 'REFERRER_URL', 'PAGE_URL', 'TIMESTAMP', 'DESCRIPTION_URL'];
// WHEN PODS ADD UP. Two mid-roll pods can each be sane and still be punishing together,
// so the arithmetic is counted across them and said as a lever, never a wall.
// Total ads across every pod at or above this reads as "a lot".
export const ADS_ACROSS_PODS_WARN = 6;
// Two pods landing breaks closer than this many seconds apart feel relentless.
export const PODS_TOO_CLOSE_SEC = 60;
export const ROTATION_MAX = 5;
export const MAX_SECTIONS = 5;
export const MAX_RUNGS = 10; // 1 primary + 9 waterfall rungs (user call, 25 Aug — was 4)
// A full pass down the ladder asks this many servers in a row — past this the player visibly stalls.
export const WORST_CASE_WARN_MS = 6000;

// The words a refusal uses for a behaviour field — the UI's labels, not its keys.
export const FIELD_WORDS = {
  start: 'when the pre-roll plays', deferSec: 'the pre-roll delay',
  wait: 'when the video starts', waitMs: 'the viewer wait',
  mode: 'how mid-roll breaks fall', cuepoints: 'the break positions',
  firstAt: 'the first break', every: 'the break interval',
  podAds: 'the target impressions count',
  nextAd: 'where the next ad comes from',
  tagTimeoutMs: 'how long each tag waits',
  ask: 'the ad partners', tries: 'the waterfall depth', direct: 'special campaigns',
  headerBidding: 'header bidding',
  times: 'the show times', hold: 'the hold',
  refresh: 'the rotation', perSession: 'the total target impressions',
  fillTimeoutSec: 'when the break gives up',
  displaySlot: 'the display slot', pause: 'whether content pauses', mute: 'which sound is muted',
  showAfterSec: 'the request delay', closeAfterSec: 'when its close button appears',
  hideAfterSec: 'when it hides',
  // The player's own five (7 Sep, UAT P2 — these printed their JSON key at people).
  passiveVolume: 'Passive volume', autoplay: 'Autoplay behaviour',
  playbackMode: 'Player type', playback: 'Playback mode',
  expandInMini: 'Expand MiniTV for ads', redirectUrl: 'Redirect URL',
  // The Player behaviour card's own fields (11 Sep) — a refusal must never print a JSON key.
  quality: 'Quality', muted: 'Starts muted',
  rememberVolume: 'Remember volume', rememberAudioLang: 'Remember audio language',
  rememberCaptions: 'Remember captions',
  controlsMode: 'Controls', hiddenControls: 'Hidden controls',
  playbackRates: 'Speeds', controlsAutoHideMs: 'Hide controls after',
  dock: 'Dock position', autoPausePct: 'Pause below visibility',
  loop: 'Loop', endScreen: 'End screen',
  brandColor: 'Brand colour', textColor: 'Text colour', logoUrl: 'Logo',
  analyticsLevel: 'Events reported', viewAfterMs: 'A view counts after',
  heartbeatMs: 'Heartbeat every', comscoreId: 'comScore id',
  nielsenId: 'Nielsen id', gaId: 'Google Analytics id',
  fallbackMediaId: 'Fallback media',
  name: 'Name', domains: 'Domains', packageName: 'Package name',
};

// The UI's word for a behaviour field, so a refusal from any surface reads the same.
export function fieldWord(f) { return FIELD_WORDS[f] || f; }

// WHO TOUCHED IT. One literal, in one place, because there is no identity exchange yet
// (ARCHITECTURE.md §11): every write and every published version is authored by the
// person in front of the screen, and the panel calls that person "You". When the real
// sign-in lands, the stamp below is what starts reading the session instead — one
// function to change, not the fifteen call sites this used to be spelled at.
export const ACTOR = 'You';

/**
 * The authorship stamp every write puts on an object: when, and by whom.
 * @returns {{updatedAt: string, updatedBy: string}}
 */
export function updateStamp() {
  return { updatedAt: new Date().toISOString(), updatedBy: ACTOR };
}

export const state = {
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
export function keyString(property, platform) {
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
