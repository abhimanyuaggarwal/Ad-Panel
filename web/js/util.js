// util.js — escaping, labels, toasts, dialogs. Loaded first; everything global.

/**
 * HTML-escape a value for interpolation into template markup (text OR attributes).
 * Every user-held string that reaches innerHTML goes through this — no exceptions.
 * @param {*} s  coerced to string; null/undefined become ''
 * @returns {string}
 */
function esc(s) {
  return String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
}

const LABELS = {
  property: { TOI: 'TOI', ET: 'ET', NBT: 'NBT' },
  platform: { mweb: 'Mweb', desktop: 'Desktop', android: 'Android', ios: 'iOS' },
  autoplay: { on: 'On', off: 'Off', auto: 'Auto' },
  playbackMode: { inline: 'Inline', inline_redirect: 'Inline + redirect', youtube: 'YouTube' },
  // A config's playback mode (2 Sep) — the user's vocabulary, verbatim.
  playback: { active: 'Active', passive: 'Passive' },
  expandInMini: { true: 'True', false: 'False' },
  endOfVideo: { loop: 'Loop', upnext: 'Play next', replay: 'Replay + related' },
  preload: { none: 'None', metadata: 'Metadata', auto: 'Full' },
  qualityCapCellular: { none: 'No cap', '480p': '480p', '720p': '720p' },
  controls: { full: 'Full', minimal: 'Minimal', none: 'None' },
  offView: { dock: 'Docks', pause: 'Pauses', play: 'Keeps playing' },
  preRoll: { start: 'Immediate', deferred: 'Delayed' },
  midrollMode: { cuepoints: 'Cue points', interval: 'Fixed interval' },
  // "Max wait" named the row AND one of its own three answers (3 Sep, user call), so
  // the row read as an option of itself. The field decides how long the video is HELD
  // BACK waiting for the ad — say that, in words a layman lands on first time.
  preRollWait: { immediate: 'No hold', chain: 'Whole waterfall', timed: 'Timed' },
  preRollTiming: { start: 'Immediate', deferred: 'Delayed' },
  clickTarget: { new_tab: 'New tab', same_tab: 'Same tab' },
  // Pod vocabulary in the industry's own words (27 Aug nomenclature pass): the waterfall
  // is preference order, not a per-ad price ranking, so "restart" and "continue" rather
  // than anything implying yield.
  podNextAd: { top: 'Restart from top', next: 'Continue in order' },
  podBanner: { last: 'Last position only', any: 'Any position' },
  slotType: { preroll: 'Pre-roll', midroll: 'Mid-roll', postroll: 'Post-roll', outstream: 'Out-stream', direct: 'Direct' },
  slotShort: { preroll: 'Pre', midroll: 'Mid', postroll: 'Post', outstream: 'Out' },
  // A banner's own facts (31 Aug, AD-JSON-SCOPE): where on the page, and whether the
  // video stops under it. Positions are the player team's vocabulary; sizes live
  // player-side with the position, never here.
  displaySlot: { player_bottom: 'Player bottom', player_top: 'Player top', l_50: 'L-band 50' },
  pause: { yes: 'Yes', no: 'No', size: 'Auto' },
  hideOnInStream: { true: 'Hide it', false: 'Keep showing' },
  tagType: { video: 'Video', display: 'Display' },
  // Short by design: these sit as a badge beside every tag, and a badge is read, not
  // parsed. THREE providers since 27 Aug — SLike behaved exactly like CAN (a pasted
  // VAST URL answering with video), so it was a fourth name buying nothing.
  tagProvider: { ima: 'IMA', gpt: 'GPT', can: 'CAN' },
};

// Video tags fit the three breaks; display tags fit the squeeze-back, and also sit
// inside a break as what it falls back to.
const SLOT_FAMILY = {
  preroll: 'video', midroll: 'video', postroll: 'video',
  outstream: 'display',
  direct: 'video', // the sold-direct list above the breaks — video demand by nature
};
// A break falls back to a banner, so it takes display tags too.
const SLOT_ALSO_TAKES = { preroll: 'display', midroll: 'display', postroll: 'display', direct: 'display' };
function slotAlsoTakes(t) { return SLOT_ALSO_TAKES[t] || null; }
// A break is a ladder (ordered, tried in turn); a squeeze-back is a rotation (banners
// that take turns, the turn-taking set in the ad rules). Different meaning, so different
// labels and none of the ladder-only affordances.
const SLOT_KIND = { preroll: 'ladder', midroll: 'ladder', postroll: 'ladder', outstream: 'rotation', direct: 'ladder' };
function slotKind(t) { return SLOT_KIND[t] || 'ladder'; }
function isRotation(t) { return slotKind(t) === 'rotation'; }
function slotFamily(t) { return SLOT_FAMILY[t]; }

// Global property scope — set from the sidebar switcher, applied by every view.
window.GLOBAL_PROP = localStorage.getItem('panel.prop') || 'All';

function setGlobalProp(p) {
  window.GLOBAL_PROP = p;
  localStorage.setItem('panel.prop', p);
  renderPropSwitcher();
  route();
}

// Workspace-style scope switcher: badge + name + chevron, menu scrolls past ~10 properties.
function renderPropSwitcher(scopes) {
  const el = document.getElementById('prop-global');
  if (!el) return;
  if (scopes) el.dataset.scopes = JSON.stringify(scopes);
  const list = JSON.parse(el.dataset.scopes || '["All"]');
  const cur = window.GLOBAL_PROP;
  const nameOf = v => (v === 'All' ? 'All properties' : v);
  el.innerHTML = `
    <button class="ps-btn" onclick="psToggle(event)" title="Everything below is scoped to this property">
      ${propBadge(cur)}<span class="ps-name">${esc(nameOf(cur))}</span><span class="ps-chev">▾</span>
    </button>
    <div class="ps-menu">
      ${list.map(v => `
        <div class="ps-opt ${v === cur ? 'on' : ''}" onclick="setGlobalProp('${esc(v)}')">
          ${propBadge(v)}<span>${esc(nameOf(v))}</span>
        </div>`).join('')}
    </div>`;
}

function psToggle(e) {
  e.stopPropagation();
  document.getElementById('prop-global').classList.toggle('open');
}

// Shared objects: 'All'-scoped objects belong to every property.
function inScope(objProp) {
  return window.GLOBAL_PROP === 'All' || !objProp || objProp === 'All' || objProp === window.GLOBAL_PROP;
}

// id → display name, filled by views that load behaviours/policies/tags/waterfalls.
window.NAME_LOOKUP = window.NAME_LOOKUP || {};
// tag id → 'video' | 'display', and tag id → 'ima' | 'gpt' | 'can'.
// Both filled by API.listTags (see api.js) — the one seam tags come through.
window.TAG_TYPE = window.TAG_TYPE || {};
window.TAG_PROVIDER = window.TAG_PROVIDER || {};
// …and tag id → the property it belongs to ('All' when it is shared across them). A bulk
// act can reach integrations of another property when the switcher is on All properties,
// which is sometimes deliberate — so it is counted and named, not blocked.
window.TAG_PROPERTY = window.TAG_PROPERTY || {};
// The provider vocabulary, and which of them are addressed by a pasted endpoint rather
// than picked from a directory. Both set from /panel/meta.
window.KL_PROVIDERS = ['ima', 'gpt', 'can'];
window.KL_URL_PROVIDERS = ['can'];
// …and tag id → true when it was typed in by hand and GAM has not caught up. Derived
// server-side every read, so a sync that pulls the unit in clears it with nothing stored.
window.TAG_OFFDIR = window.TAG_OFFDIR || {};
window.TAG_TPL = window.TAG_TPL || {};
// What an ad unit looks like — the network code, then the path. The one check worth
// making on a hand-typed unit: the directory can be stale, the shape cannot be wrong.
window.KL_AD_UNIT = /^\/\d{3,}(\/[A-Za-z0-9._~-]+)+\/?$/;
function looksLikeAdUnit(v) { return window.KL_AD_UNIT.test(String(v || '').trim()); }
function looksLikeUrl(v) { return /^https?:\/\//i.test(String(v || '').trim()); }

/**
 * The panel's word for a stored value — LABELS[kind][value], falling back to the raw
 * value. All UI vocabulary lives in the LABELS table above; views never inline words.
 * @param {string} kind   a LABELS group, e.g. 'slotType', 'pause', 'playback'
 * @param {*} value       the stored value
 * @returns {string}
 */
function label(kind, value) {
  return (LABELS[kind] && LABELS[kind][value]) || value;
}

// Property monogram badge — brand logo stand-in until real assets land.
function propBadge(property) {
  const p = property || 'All';
  return `<span class="pbadge p-${p.toLowerCase()}">${esc(p === 'All' ? '∗' : p)}</span>`;
}

function propCell(property) {
  const p = property || 'All';
  return `<span class="prop-cell">${propBadge(p)}${esc(p === 'All' ? 'All properties' : p)}</span>`;
}


function secs(n) {
  if (n % 60 === 0 && n >= 60) return (n / 60) + ' min';
  return n + 's';
}

// Route transition: a thin top progress bar (delayed so instant nav never flickers)
// plus a soft fade-in of the new view.
let PROG_TIMER = null;

function startProgress() {
  const el = document.getElementById('nav-progress');
  if (!el) return;
  clearTimeout(PROG_TIMER);
  el.classList.remove('done');
  PROG_TIMER = setTimeout(() => el.classList.add('on'), 90);
}

function finishProgress() {
  const el = document.getElementById('nav-progress');
  if (!el) return;
  clearTimeout(PROG_TIMER);
  if (!el.classList.contains('on')) return;
  el.classList.add('done');
  setTimeout(() => el.classList.remove('on', 'done'), 280);
}

function fadeInView() {
  const m = document.getElementById('main');
  if (!m) return;
  m.classList.remove('view-in');
  void m.offsetWidth; // restart the animation
  m.classList.add('view-in');
}

/**
 * Corner notice. Stacks; auto-dismisses.
 * @param {string} msg
 * @param {'ok'|'warn'|'bad'} [kind='ok']  'bad' for refusals, 'warn' for named skips
 */
function toast(msg, kind) {
  const el = document.createElement('div');
  el.className = 'toast' + (kind ? ' ' + kind : '');
  el.textContent = msg;
  document.getElementById('toasts').appendChild(el);
  setTimeout(() => el.remove(), kind ? 6000 : 3200);
}

// ask({title, body, okLabel, danger}) -> Promise<boolean>. Our own dialog, never confirm().
/**
 * The house confirm dialog (never window.confirm).
 * @param {{title: string, body?: string, okLabel?: string, cancelLabel?: string,
 *          danger?: boolean}} opts
 * @returns {Promise<boolean>}  false on Cancel or veil click
 */
function ask(opts) {
  return new Promise(resolve => {
    const root = document.getElementById('dialog-root');
    root.innerHTML = `
      <div class="dlg-veil">
        <div class="dlg">
          <h3>${esc(opts.title)}</h3>
          <div class="dlg-body">${opts.body || ''}</div>
          <div class="dlg-foot">
            ${opts.noCancel ? '' : '<button class="btn ghost" data-act="no">Cancel</button>'}
            <button class="btn ${opts.danger ? 'danger' : ''}" data-act="yes">${esc(opts.okLabel || 'Confirm')}</button>
          </div>
        </div>
      </div>`;
    // A dialog with nothing to decide (a fact, said in a box) gets one button.
    const no = root.querySelector('[data-act=no]');
    if (no) no.onclick = () => { root.innerHTML = ''; resolve(false); };
    root.querySelector('[data-act=yes]').onclick = () => { root.innerHTML = ''; resolve(true); };
    root.querySelector('.dlg-veil').onclick = e => {
      if (e.target.classList.contains('dlg-veil')) { root.innerHTML = ''; resolve(false); }
    };
  });
}


// pickDialog(title, [{v, label, sub}]) -> Promise<value | null>. Our own picker.
function pickDialog(title, options) {
  return new Promise(resolve => {
    const root = document.getElementById('dialog-root');
    root.innerHTML = `
      <div class="dlg-veil">
        <div class="dlg">
          <h3>${esc(title)}</h3>
          <div class="dlg-body">
            <div class="pick-list">${options.map(o =>
              `<div class="sel-opt" data-v="${esc(o.v)}">${esc(o.label)}${o.sub ? `<span class="pick-sub">${esc(o.sub)}</span>` : ''}</div>`).join('')}
            </div>
          </div>
          <div class="dlg-foot"><button class="btn ghost" data-act="no">Cancel</button></div>
        </div>
      </div>`;
    root.querySelectorAll('.sel-opt').forEach(el => {
      el.onclick = () => { root.innerHTML = ''; resolve(el.dataset.v); };
    });
    root.querySelector('[data-act=no]').onclick = () => { root.innerHTML = ''; resolve(null); };
    root.querySelector('.dlg-veil').onclick = e => {
      if (e.target.classList.contains('dlg-veil')) { root.innerHTML = ''; resolve(null); }
    };
  });
}

function copyText(text, note) {
  navigator.clipboard.writeText(text).then(() => toast(note || 'Copied'));
}

function fmtCue(s) {
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;
}

// Human-readable value for activity/diff rendering.
function showVal(field, v) {
  if (['cuepoints', 'squeezebackTimes'].includes(field) && Array.isArray(v)) return v.map(fmtCue).join(', ') || '—';
  if (field === 'rungs' && Array.isArray(v)) {
    return v.length ? `${v.length} tag${v.length > 1 ? 's' : ''}` : '—';
  }
  if (field === 'sections' && Array.isArray(v)) {
    return v.map(s => {
      const live = Object.keys(s.slots || {}).filter(t => s.slots[t]?.on).map(t => label('slotType', t));
      let off = 0;
      for (const slot of Object.values(s.slots || {})) off += (slot.rungs || []).filter(r => r.on === false).length;
      return `${s.name} (${live.join(', ') || 'none active'}${off ? ` — ${off} tag${off > 1 ? 's' : ''} inactive` : ''})`;
    }).join(' · ') || '—';
  }
  if (field === 'drive') {
    if (!v || !Object.keys(v).length) return '—';
    // The quick decisions, in the card's own words — never the payload's.
    return Object.entries(v).map(([t, d]) => {
      const bits = [];
      if (d.ask?.length) bits.push(d.ask.map(p => label('tagProvider', p) || p).join(' › '));
      if (d.tries) bits.push(`${d.tries} ${d.tries === 1 ? 'try' : 'tries'}`);
      if (d.start) bits.push(d.start === 'deferred' ? `delayed ${d.deferSec ?? '?'}s` : 'immediate');
      if (d.podAds) bits.push(`${d.podAds} impressions`);
      return `${label('slotType', t)}: ${bits.join(' · ') || 'as set up'}`;
    }).join(' · ');
  }
  if (v === true) return 'On';
  if (v === false) return 'Off';
  if (Array.isArray(v)) return v.join(', ') || '—';
  if (v === '' || v === null || v === undefined) return '—';
  if (typeof v === 'string' && window.NAME_LOOKUP[v]) return window.NAME_LOOKUP[v];
  if (LABELS[field] && LABELS[field][v]) return LABELS[field][v];
  return String(v);
}

// Wordy field names for diffs — no engineering vocabulary in the UI.
const FIELD_NAMES = {
  name: 'Name', property: 'Property', platform: 'Platform', domains: 'Domains',
  packageName: 'Package name', sections: 'Ad sections',
  adSetupId: 'Ad setup', player: 'Player', slots: 'Ladders',
  unit: 'Ad unit', rungs: 'Waterfall', type: 'Type', value: 'Ad unit / endpoint', provider: 'Provider',
  on: 'Switched on', waterfallId: 'Shared waterfall',
  category: 'Category', mediaId: 'Creative',
  playerBehaviourId: 'Player setup', monetizationPolicyId: 'Ad rules',
  autoplay: 'Autoplay behaviour', playbackMode: 'Playback', redirectUrl: 'Redirect URL',
  passiveVolume: 'Passive volume', fallbackMediaId: 'Fallback media',
  endOfVideo: 'End of video', upnextCountdown: 'Up-next countdown',
  preload: 'Preload', qualityCapCellular: 'Cellular quality cap',
  controls: 'Controls', seekAllowed: 'Seeking', offView: 'Scrolled out of view', dockDismissible: 'Docked player dismissible',
  preRoll: 'Pre-roll timing', preRollDeferSec: 'Pre-roll starts at',
  cuepoints: 'Cue points', snapback: 'Play skipped break first',
  countdown: 'Countdown', podPosition: 'Ad 1 of N',
  startMuted: 'Ad starts muted', unmutePrompt: '“Tap for sound” prompt', clickTarget: 'Click opens',
  midrollMode: 'Mid-rolls', midrollEvery: 'Then every', midrollFirstAt: 'First break at',
  preRollWait: 'Video starts', preRollWaitMs: 'Viewer waits at most',
  squeezebackTimes: 'Squeeze-back shows at',
  squeezebackRefresh: 'Squeeze-back rotates every', squeezebackPerSession: 'Squeeze-backs per session',
  squeezebackHold: 'Squeeze-back holds for', pauseAd: 'Pause ad', pauseAdDelay: 'Pause ad delay',
  perTagTimeoutMs: 'Per-tag timeout',
  // A SLOT's own behaviour (25 Aug): the fields live on the slot, so they lose the
  // break prefix entirely — one name each instead of three.
  // "Max wait" named the row AND one of its three answers, so the row read as its own
  // option (3 Sep, user call — a layman should get it at a glance). What the field
  // actually decides is how long the video is held back waiting for the ad.
  start: 'Start offset', deferSec: 'Start offset (sec)', wait: 'Hold video for the ad', waitMs: 'Hold video for the ad',
  mode: 'Scheduling', every: 'Repeat interval', firstAt: 'First break offset',
  podAds: 'Impressions per break',
  nextAd: 'Pod fill order', podBanner: 'Display ad position',
  times: 'Schedule', hold: 'Display duration', perSession: 'Impression cap',
  tagTimeoutMs: 'Request timeout', behaviour: 'Ad behaviour',
  // The player's JSON (31 Aug, AD-JSON-SCOPE): the break's giving-up point, a cadence
  // that stops, the idle player's rotation, a banner's own facts, playback timing.
  fillTimeoutSec: 'Total timeout',
  hideOnInStream: 'Hide during in-stream',
  displaySlot: 'Ad placement', pause: 'Content pause',
  showAfterSec: 'Request delay', closeAfterSec: 'Skip offset', hideAfterSec: 'Auto-hide',
  direct: 'Direct',
  prefetchSec: 'Prefetch', minContentSec: 'Min content playback', expandInMini: 'Expand MiniTV for ads',
  playback: 'Playback mode', playerConfigs: 'Player configs',
  tplId: 'Request template', url: 'Request URL',
  // The drive — the per-break quick decisions (26 Aug, DRIVING-SCOPE). `ask` reads
  // "Fallback order" since 31 Aug: the tiers set the sequence (Direct, then the
  // primary, then the fallback), and the fallback is the one ordered thing left.
  drive: 'Delivery controls', ask: 'Fallback order', tries: 'Waterfall depth',
};

// A slot's behaviour fields share the vocabularies, so segs, diffs and activity
// entries all speak the same words.
LABELS.nextAd = LABELS.podNextAd;
LABELS.podBanner = LABELS.podBanner;
LABELS.mode = LABELS.midrollMode;
LABELS.start = LABELS.preRoll;
LABELS.wait = LABELS.preRollWait;

// One behaviour value, in the words the form uses for it — so a confirm dialog reads
// like the row it came from instead of like the payload.
function bhvValueText(f, v) {
  // A cadence with no stop count runs the video out \u2014 `Full` is its open end.
  if (v === undefined || v === null || v === '') return '\u2014';
  if (Array.isArray(v)) return v.map(fmtCue).join(', ') || 'none';
  if (LABELS[f] && typeof LABELS[f] === 'object' && LABELS[f][v] !== undefined) return LABELS[f][v];
  // NO MILLISECONDS ANYWHERE (3 Sep, user call). Two fields are stored in ms because
  // that is the player's JSON contract; every place a person reads or types one, it is
  // seconds. `fmtMs` is the one converter, so a diff, a warning and an input agree.
  if (MS_FIELDS.includes(f)) return fmtMs(v);
  const UNIT = { deferSec: 's', firstAt: 's',
    every: 's', hold: 's',
    fillTimeoutSec: 's', showAfterSec: 's', closeAfterSec: 's', hideAfterSec: 's',
    prefetchSec: 's', minContentSec: 's' };
  return typeof v === 'number' ? `${v}${UNIT[f] ?? ''}` : String(v);
}



// Counted arithmetic, shown wherever a ladder is: rungs × per-tag timeout.
function worstCaseMs(rungCount, perTagTimeoutMs) {
  return (rungCount || 0) * (perTagTimeoutMs || 0);
}

// The two fields the player's JSON keeps in milliseconds — never shown as such.
const MS_FIELDS = ['waitMs', 'tagTimeoutMs'];

function fmtMs(ms) {
  const s = ms / 1000;
  return `${Number.isInteger(s) ? s : s.toFixed(1)}s`;
}

// SEARCH IS A PREFIX SEARCH ON WHAT YOU CAN SEE (3 Sep, user call). The old search
// matched a substring anywhere in a blob of hidden fields — section names, key strings,
// domains — so typing "feed" returned a row whose visible name has no "feed" in it, and
// the result looked arbitrary. Now it matches from the start of the text or from the
// start of any word in it, over the columns actually on screen.
// Every word typed must start a word in the text — so "mweb art" finds "TOI Mweb
// ArticleShow" while "feed" still finds nothing in it. Never a mid-word match: that is
// what made the old search feel random.
function matchesPrefix(q, ...texts) {
  const tokens = String(q || '').trim().toLowerCase().split(/\s+/).filter(Boolean);
  if (!tokens.length) return true;
  const hays = texts.filter(Boolean).map(t => String(t).toLowerCase());
  if (!hays.length) return false;
  return hays.some(hay => {
    const words = hay.split(/[\s·,()\-_/]+/).filter(Boolean);
    return tokens.every(tok => hay.startsWith(tok) || words.some(w => w.startsWith(tok)));
  });
}

function fieldName(f) { return FIELD_NAMES[f] || f; }

function relWhen(iso) {
  const mins = Math.floor((Date.now() - new Date(iso).getTime()) / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  if (mins < 24 * 60) return `${Math.floor(mins / 60)}h ago`;
  if (mins < 7 * 24 * 60) return `${Math.floor(mins / (24 * 60))}d ago`;
  return new Date(iso).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
}


function clip(s, n) {
  s = String(s);
  return s.length > n ? s.slice(0, n - 1) + '…' : s;
}

// The collapsible sidebar (2 Sep) lived for one review round: folding it only moved the
// empty space to the other side of the page, so the nav moved into the HEADER BAND and
// the sidebar — with `navMin` and its stored preference — is gone. Nothing replaced this
// function: a header has no collapsed state to remember.
localStorage.removeItem('panel.navMin');
