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

// THE GLOBAL WATERFALL — the setup's own shared ladder, named once (8 Sep, user call:
// *"rename the top waterfall as global waterfall or suggest any better name for it"*).
// It was `Shared waterfall` until 7 Sep and then bare `Waterfall`, which collided with
// the word every break's own ladder wears: on a break the two now read as one pair —
// `Custom` and `Global`. The wire key is untouched (`waterfallSource: 'setup'`); this is
// the seller's word for it, and the only place it is spelled.
const WF_WORD = 'Global waterfall';

// HEADER BIDDING (10 Sep, user call) — who else bids for a slot before the ad server is
// asked. The setup answers once at its head; every slot borrows that answer (`Auto`) or
// gives its own. Named once here, both for the section's head and for every slot's row.
const HB_WORD = 'Header bidding';
// The answers, spelled here as well as in meta (`meta.headerBidding` / `meta.slotHeaderBidding`),
// so a control never paints EMPTY against an API that predates them — the `pauseModes`
// fallback rule. Meta wins when it answers; this is what the page draws when it does not.
const HB_ANSWERS = ['off', 'amazon_prebid', 'amazon', 'prebid'];
const HB_SLOT_ANSWERS = ['auto', ...HB_ANSWERS];

const LABELS = {
  property: { TOI: 'TOI', ET: 'ET', NBT: 'NBT' },
  platform: { mweb: 'Mweb', desktop: 'Desktop', android: 'Android', ios: 'iOS' },
  autoplay: { on: 'On', off: 'Off', auto: 'Auto' },
  playbackMode: { inline: 'Inline', inline_redirect: 'Inline + redirect', youtube: 'YouTube' },
  // A config's playback mode (2 Sep) — the user's vocabulary, verbatim.
  playback: { active: 'Active', passive: 'Passive' },
  // The Player behaviour card's own vocabularies (11 Sep, docs/PLAYER-LEVERS.xlsx). `controls`
  // above is the RETIRED 19 Aug field — same three answers, different field — so the new
  // one is keyed by its own field name and the two can never be read for each other.
  controlsMode: { full: 'Full', minimal: 'Minimal', none: 'None' },
  endScreen: { none: 'None', related: 'Related', custom: 'Custom' },
  dock: { off: 'Off', lt: 'Top left', rt: 'Top right', lb: 'Bottom left', rb: 'Bottom right' },
  analyticsLevel: { 1: 'Basic', 2: 'Basic + ads', 3: 'Full' },
  playerControl: {
    play: 'Play / pause', progress: 'Progress bar', volume: 'Volume', fullscreen: 'Fullscreen',
    quality: 'Quality', captions: 'Captions', speed: 'Speed', pip: 'Picture in picture', share: 'Share',
  },
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
  // SPECIAL, not Direct (7 Sep, user call): the zone holds the one deal that jumps the
  // queue, and `special` says that to anyone. The wire key stays `direct` — every
  // legacy key does (see the panel's key policy) — so only the word changes.
  slotType: { preroll: 'Pre-roll', midroll: 'Mid-roll', postroll: 'Post-roll', outstream: 'Out-stream', direct: 'Special' },
  slotShort: { preroll: 'Pre', midroll: 'Mid', postroll: 'Post', outstream: 'Out' },
  // A banner's own facts (31 Aug, AD-JSON-SCOPE): where on the page, and whether the
  // video stops under it. Positions are the player team's vocabulary; sizes live
  // player-side with the position, never here.
  displaySlot: { player_bottom: 'Player bottom', player_top: 'Player top', l_50: 'L-band 50' },
  pause: { yes: 'Yes', no: 'No', size: 'Auto' },
  // Whose sound is quiet while the content keeps playing under an ad (11 Sep).
  mute: { ad: 'Ad', content: 'Content' },
  // Header bidding (10 Sep): the partners in the user's own spelling, compact because
  // these five sit in one seg on every slot. `Auto` borrows the setup's answer — the
  // same grammar `Content pause` uses for "each unit's own", so an inherited answer and
  // the concrete ones share one control rather than needing a mode switch above it.
  headerBidding: { auto: 'Auto', off: 'Off', amazon_prebid: 'Amazon+Prebid', amazon: 'Amazon', prebid: 'Prebid' },
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
  shared: 'video', // the SHARED WATERFALL (5 Sep) — one ladder any break may follow
};
// A break falls back to a banner, so it takes display tags too.
const SLOT_ALSO_TAKES = { preroll: 'display', midroll: 'display', postroll: 'display', direct: 'display', shared: 'display' };
function slotAlsoTakes(t) { return SLOT_ALSO_TAKES[t] || null; }
// A break is a ladder (ordered, tried in turn); a squeeze-back is a rotation (banners
// that take turns, the turn-taking set in the ad rules). Different meaning, so different
// labels and none of the ladder-only affordances.
const SLOT_KIND = { preroll: 'ladder', midroll: 'ladder', postroll: 'ladder', outstream: 'rotation', direct: 'ladder', shared: 'ladder' };
function slotKind(t) { return SLOT_KIND[t] || 'ladder'; }
function isRotation(t) { return slotKind(t) === 'rotation'; }
function slotFamily(t) { return SLOT_FAMILY[t]; }

// ---------- THE PROFILE MENU (7 Sep, user call; the menu added the same review) ----------
// The header band's right seat used to hold a global property switcher every view
// filtered through. It holds WHO IS SIGNED IN now, wearing the platform-standard shape
// the user asked for: the mark opens a dropdown with the identity at its head and the two
// acts every console has — VIEW PROFILE and LOG OUT. (The first cut had no menu at all, on
// the reasoning that a Sign out with no session to end is worse than none; the user's call
// stands over it, so Log out is real and ends what the console actually holds — see
// meLogOut, the one seam tech swaps for the real sign-out and its redirect.)
// The identity is invented data, so it comes from the fixture through `meta.me` (see
// api/mock/world.js ME) — the panel never makes up a name in the view layer.
// Consequence of the switcher's removal: nothing narrows by property globally any more, so
// BOTH LISTS ALWAYS OFFER the Properties filter — it used to hide itself whenever the
// switcher was already narrowing — and that filter is how a property gets narrowed to.
window.ME = null;

function renderMe(me) {
  const el = document.getElementById('me');
  if (!el) return;
  window.ME = me || null;
  const name = (me && me.name) || '';
  const email = (me && me.email) || '';
  const initials = (me && me.initials)
    || (name ? name.split(/\s+/).filter(Boolean).map(w => w[0]).slice(0, 2).join('') : '');
  el.innerHTML = `
    <button type="button" class="me-btn" onclick="meToggle(event)" aria-haspopup="true">
      <span class="me-av">${esc(initials || '\u00b7')}</span>
      <span class="me-who">
        <span class="me-name">${esc(name || 'Signed in')}</span>
        ${me && me.role ? `<span class="me-role">${esc(me.role)}</span>` : ''}
      </span>
      <span class="me-chev">\u25be</span>
    </button>
    <div class="eh-menu me-menu">
      ${name ? `<div class="me-head">
        <span class="me-hname">${esc(name)}</span>
        ${email ? `<span class="me-hmail">${esc(email)}</span>` : ''}
      </div>` : ''}
      <div class="eh-item" onclick="meShut(); meProfile()">View profile</div>
      <div class="eh-item danger" onclick="meShut(); meLogOut()">Log out</div>
    </div>`;
}

// Open state is pure DOM, like the selects and the row menus — the band paints once, so a
// class on the container is the only state there is. The global click-away in controls.js
// closes it; an item closes it before it acts, so no dialog sits over an open menu.
function meToggle(e) {
  if (e) e.stopPropagation();
  document.getElementById('me')?.classList.toggle('open');
}

function meShut() {
  document.getElementById('me')?.classList.remove('open');
}

// VIEW PROFILE: the identity, read-only, in a one-button dialog — there is nothing to
// decide here and nothing the console may change, so it says so once at the foot instead
// of offering fields that would refuse.
function meProfile() {
  const me = window.ME || {};
  const rows = [
    ['Name', me.name],
    ['Email', me.email],
    ['Role', me.role],
  ].filter(([, v]) => v);
  ask({
    title: 'Your profile',
    noCancel: true,
    okLabel: 'Close',
    body: rows.length ? `
      <div class="me-prof">
        ${rows.map(([k, v]) => `
          <div class="me-prow"><span class="me-plab">${esc(k)}</span><span>${esc(v)}</span></div>`).join('')}
      </div>
      <p class="dlg-note">Your sign-in and what you can reach are managed outside the console.</p>`
      : '<p class="dlg-note">Nobody is signed in yet.</p>',
  });
}

// LOG OUT — confirmed, because it clears the page you are standing on. It ends the session
// SERVER-SIDE and lands on the front door (8 Sep): the first cut painted a plate saying
// "you are logged out" and offered a reload, because there was nowhere to go. There is now
// (login.html), so the act is real end to end and Back cannot walk into the rooms — the
// gate in main.js reads the same session and finds it gone.
//
// LEAVING ALWAYS WORKS (8 Sep, second cut, user call: "it should work when a user clicks on
// logout"). The first cut refused to move when the sign-out call did not reach the server —
// on the reasoning that a door you could walk straight back through is a lie. That was the
// wrong trade, and the way it failed proved it: against a server that had not been restarted
// the act did nothing but drop a pill, and someone leaving a shared machine was left standing
// in the console. Logging out is now unconditional — you leave, every time — and the part we
// are NOT sure of is the part that gets said: the door carries a banner when the server never
// confirmed, because a session it may still hold is a fact worth reading, and nobody can use
// the console without a server anyway.
async function meLogOut() {
  const ok = await ask({
    title: 'Log out?',
    body: '<p class="dlg-note">Nothing you have saved or published changes — drafts and versions stay where they are.</p>',
    okLabel: 'Log out',
    danger: true,
  });
  if (!ok) return;
  let unconfirmed = false;
  try {
    await API.signOut();
  } catch {
    unconfirmed = true; // said at the door, not in a pill you are about to navigate away from
  }
  try { localStorage.clear(); } catch { /* a private window has none — nothing to clear */ }
  // The one thing the door needs told, in the one store that survives the navigation and
  // nothing else. It reads it once and clears it, so a later visit is not haunted by it.
  if (unconfirmed) { try { sessionStorage.setItem(DOOR_UNCONFIRMED, '1'); } catch { /* no store */ } }
  location.replace('login.html'); // replace, not assign: Back must not re-enter the rooms
}

// The one key the console and the door share. Here rather than in login.js because both
// sides read it and a string in two files is a bug waiting to happen.
const DOOR_UNCONFIRMED = 'panel.logout.unconfirmed';

// THE ONE SEAM PROPERTY SCOPE EVER CAME THROUGH, and the reason the switcher's removal
// touched ten filters and broke none: every object is in scope while the panel has no
// session, and when auth lands the properties it grants answer HERE — no call site moves.
function inScope(_objProp) {
  return true;
}

// id → display name, filled by views that load behaviours/policies/tags/waterfalls.
window.NAME_LOOKUP = window.NAME_LOOKUP || {};
// tag id → 'video' | 'display', and tag id → 'ima' | 'gpt' | 'can'.
// Both filled by API.listTags (see api.js) — the one seam tags come through.
window.TAG_TYPE = window.TAG_TYPE || {};
window.TAG_PROVIDER = window.TAG_PROVIDER || {};
// …and tag id → the property it belongs to ('All' when it is shared across them). A bulk
// act can reach integrations of another property, which is sometimes deliberate (a shared
// backfill tag really does span them) — so it is counted and named, not blocked.
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
 * THE RECEIPT: one quiet pill, bottom centre — a new message replaces the old, never a
 * stack. It says WHAT JUST HAPPENED AND NOTHING ELSE: one line, three to five words, the
 * act in the seller's own vocabulary. No reason, no consequence clause, no list of names,
 * no second line (7 Sep, user call, the third time — "it should be very dumb and should
 * not carry more than 3-5 words to communicate just the action").
 *
 * The rule follows from what a pill IS: two seconds, bottom of the screen, nowhere near
 * where you are looking. Nothing that has to be READ survives that, so nothing that has
 * to be read goes in it. Each kind of text has a better home, and they are all in use:
 *   · a refusal that names a number        → in place, on the field or the row that refused
 *   · a skipped/left-alone list            → the rows themselves, which show their state
 *   · an exact value behind a short one    → title=, per the 7 Sep tooltip policy
 * A click whose result is visible in place gets NO toast at all — the repaint is the
 * receipt. The one text this pill still carries whole is a refusal with no home ('bad'):
 * a seam error we could not place, where the sentence IS the information.
 *
 * A newline and anything after it is dropped, so a regression degrades to the act alone
 * rather than back to a paragraph.
 * @param {string} msg  one line, 3–5 words
 * @param {'ok'|'warn'|'bad'} [kind='ok']
 */
function toast(msg, kind) {
  const box = document.getElementById('toasts');
  box.textContent = '';
  const el = document.createElement('div');
  el.className = 'toast' + (kind ? ' ' + kind : '');
  const dot = document.createElement('i');
  dot.className = 'tdot';
  el.append(dot, String(msg).split('\n')[0]);
  box.appendChild(el);
  clearTimeout(toast._t);
  toast._t = setTimeout(() => { el.remove(); }, kind === 'bad' ? 6000 : kind === 'warn' ? 5000 : 2200);
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
            ${opts.noCancel ? '' : `<button class="btn ghost" data-act="no">${esc(opts.cancelLabel || 'Cancel')}</button>`}
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

// A clipboard write is a boundary: it is refused outright in an insecure context and
// by some permission settings. Saying nothing there leaves the person believing they
// copied something they did not, so the failure gets the pill too (8 Sep).
function copyText(text, note) {
  navigator.clipboard.writeText(text)
    .then(() => toast(note || 'Copied'))
    .catch(() => toast('The browser would not let us copy — select the key and copy it', 'bad'));
}

// "6:00" or "360" -> seconds; unparsable tokens pass through for the server to refuse by name.
function parseCuepointsText(text) {
  return String(text || '').split(',').map(s => s.trim()).filter(Boolean).map(s => {
    if (/^\d+$/.test(s)) return parseInt(s, 10);
    const m = s.match(/^(\d+):([0-5]?\d)$/);
    return m ? parseInt(m[1], 10) * 60 + parseInt(m[2], 10) : s;
  });
}

function fmtCue(s) {
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;
}

// Human-readable value for activity/diff rendering.
function showVal(field, v) {
  // No milliseconds anywhere a person reads (3 Sep rule; the diffs joined 6 Sep).
  if (MS_FIELDS.includes(field) && typeof v === 'number') return fmtMs(v);
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
  on: 'Switched on', waterfallId: 'Waterfall',
  category: 'Category', mediaId: 'Creative',
  playerBehaviourId: 'Player setup', monetizationPolicyId: 'Ad rules',
  autoplay: 'Autoplay behaviour', playbackMode: 'Player type', redirectUrl: 'Redirect URL',
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
  podAds: 'Total Target Impressions',
  nextAd: 'Waterfall fill order',
  times: 'Schedule', hold: 'Display duration', perSession: 'Total Target Impressions',
  tagTimeoutMs: 'Request timeout', behaviour: 'Ad behaviour',
  headerBidding: 'Header bidding',
  // The player's JSON (31 Aug, AD-JSON-SCOPE): the break's giving-up point, a cadence
  // that stops, the idle player's rotation, a banner's own facts, playback timing.
  fillTimeoutSec: 'Total timeout',
  displaySlot: 'Ad placement', pause: 'Content pause', mute: 'Mute',
  showAfterSec: 'Request delay', closeAfterSec: 'Close button', hideAfterSec: 'Auto-hide',
  direct: 'Special',
  prefetchSec: 'Prefetch', minContentSec: 'Min content playback', expandInMini: 'Expand MiniTV for ads',
  playback: 'Playback mode', playerConfigs: 'Player configs',
  // The card's own fields — a diff line must never print a JSON key at anyone.
  quality: 'Quality', muted: 'Starts muted',
  rememberVolume: 'Remember volume', rememberAudioLang: 'Remember audio language',
  rememberCaptions: 'Remember captions',
  controlsMode: 'Controls', hiddenControls: 'Hidden controls', playbackRates: 'Speeds',
  controlsAutoHideMs: 'Hide controls after', dock: 'Dock position',
  autoPausePct: 'Pause below visibility', loop: 'Loop', endScreen: 'End screen',
  brandColor: 'Brand colour', textColor: 'Text colour', logoUrl: 'Logo',
  analyticsLevel: 'Events reported', viewAfterMs: 'A view counts after',
  heartbeatMs: 'Heartbeat every', comscoreId: 'comScore id', nielsenId: 'Nielsen id',
  gaId: 'Google Analytics id',
  tplId: 'Ad unit template', url: 'Request URL',
  // The drive — the per-break quick decisions (26 Aug, DRIVING-SCOPE). `ask` reads
  // "Waterfall order" (5 Sep — waterfall in place of fallback everywhere): the tiers
  // set the sequence (Direct, then the primary, then the waterfall), and the waterfall
  // is the one ordered thing left.
  drive: 'Delivery controls', ask: 'Waterfall order', tries: 'Waterfall depth',
  // The waterfall's own diff words (5 Sep; one word 7 Sep, user call). `ad sources` is
  // the source itself moving between its three answers — its own units, the waterfall,
  // or none (8 Sep) — where `indirect` is the UNITS of a break serving its own.
  indirect: 'Ad source units', waterfall: 'Global waterfall', 'ad sources': 'Where ads come from',
};

// A slot's behaviour fields share the vocabularies, so segs, diffs and activity
// entries all speak the same words.
LABELS.nextAd = LABELS.podNextAd;
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
