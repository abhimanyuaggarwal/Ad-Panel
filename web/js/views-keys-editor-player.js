// views-keys-editor-player.js — the integration page's PLAYER CONFIG: a row of CARDS,
// each opening a SHEET that discloses its settings in layers.
//
// THE THREE SECTIONS (11 Sep, user call; docs/PLAYER-LEVERS.xlsx is the record of why).
//
//   1 Playback                how the video plays
//   2 Appearance & controls   what the viewer sees and can touch
//   3 Measurement            what is reported, and to whom
//
// THE MODEL (13 Sep, user call): DEFAULT + SPARSE OVERRIDES. The default config is what
// every player on this surface gets. A custom config is asked for by key, may override ANY
// of the player's fields, and carries ONLY those — everything else follows the default
// LIVE, resolved at the wire boundary, so moving a lever on the default moves every config
// that never spoke about it.
//
// CARDS AND LAYERS (14 Sep, third surface, user call — *"let's not have this column-like
// approach; clean cards, clicking on which opens the preview … limited fields upfront,
// then at level 2 some fields, and so on, so that we are not bombarded"*).
//
//   The two surfaces before this one failed the same way from opposite ends. The folded
//   card put eight groups of controls on the page; the comparison grid put every config on
//   screen at once in columns. Both answered "show me everything" when the question a
//   person actually arrives with is "which config, and what does it do".
//
//   LEVEL 1 — THE CARDS. One card per config, the default first. A card carries identity
//   and a few headline facts: for the default, what a player gets; for a custom config,
//   WHAT IT OVERRIDES, because that is what a custom config IS. Nothing on a card is a
//   control except the switch, which is state.
//
//   LEVEL 2 — THE SHEET. Clicking a card opens it: the three sections, each showing the
//   handful of settings that are actually decided when a surface is set up.
//
//   LEVEL 3 — MORE. Each section ends with a counted disclosure ("8 more playback
//   settings") that opens in place. A section holding an override that lives under `more`
//   opens ITSELF, because a setting somebody deliberately chose may never be hidden.
//
// ONE SHEET, THREE MODES — the default, an existing config, and a NEW one. Creating is the
// only modal act (nothing exists until it is named and valid, so it alone has Cancel and
// Create); the other two write straight to the page's draft and close with Done. Save,
// Publish and the change review between them are untouched.

// ---------- THE FIELDS ----------
// `remembers` is ONE row over three booleans — what a returning viewer keeps is one
// question with three answers, not three questions.
const CFG_REMEMBER = ['rememberVolume', 'rememberAudioLang', 'rememberCaptions'];
// THE THREE LOOK FIELDS ARE ONE DECISION, SEEN ONCE (14 Sep, user call — *"brand colour, text
// colour and logo can be shown as a preview in a single view"*). A hex beside a hex beside a
// URL tells nobody what a player will look like; the three of them drawn on one small stage
// does, and the contrast between two of them is then visible where it is chosen rather than
// on a player at a publisher.
const CFG_LOOK = ['brandColor', 'textColor', 'logoUrl'];
// A GROUP ROW IS ONE DECISION ON SCREEN AND STILL N FIELDS IN A LIST OF CHANGES — so the
// three behind `Appearance` and `Remembers` keep their own names, and a change review never
// prints one label three times for three different answers.
const CFG_SUB_L = {
  brandColor: 'Brand colour', textColor: 'Text colour', logoUrl: 'Logo',
  rememberVolume: 'Remembers volume', rememberAudioLang: 'Remembers audio language',
  rememberCaptions: 'Remembers captions',
};
const CFG_CTL_WHY = 'The player draws no controls, so there is nothing to hide, speed up or auto-hide';

// UP FRONT vs MORE. `lead` is what a person setting up a surface actually decides; `more`
// is everything else — real settings with real defaults, one counted click away, never
// second-class and never hidden once something in them has been set.
// `short` is the name a CARD uses, where a line of them has to fit in 238px; `name` is the
// name a sheet's own header band uses. Same three sections, two registers. (`word` and `hint`
// went with the counted doors and the section bylines they were written for.)
const CFG_SECTIONS = [
  { k: 'playback', name: 'Playback', short: 'Playback',
    lead: ['autoplay', 'passiveVolume', 'muted', 'playback', 'loop', 'endScreen'],
    more: ['expandInMini', 'remembers', 'playbackMode', 'redirectUrl', 'quality',
      'fallbackMediaId', 'dock', 'autoPausePct'] },
  // The order is the sentence the section is: how many controls at all → what the player looks
  // like → which controls exactly. (The drawn preview that used to sit between the two went
  // 15 Sep, user call; the contrast check it carried stays under the colours.)
  // THE NAME DOES NOT ECHO ITS OWN FIRST ROW (15 Sep, user call): a band headed
  // `Controls & appearance` sat directly above a row labelled `Controls`, and the pair read
  // as a stutter. The distinctive word leads now, and the nine-glyph row is `Which controls`.
  { k: 'look', name: 'Appearance & controls', short: 'Appearance',
    lead: ['controlsMode', 'appearance', 'hiddenControls'],
    more: ['playbackRates', 'controlsAutoHideMs'] },
  // `Analytics & measurement` said one thing twice.
  { k: 'measure', name: 'Measurement', short: 'Measurement',
    lead: ['analyticsLevel', 'viewAfterMs', 'heartbeatMs'],
    more: ['comscoreId', 'nielsenId', 'gaId'] },
];

// RETIRED 15 Sep: `BULK_ROWS`, the five playback facts the cohort sheet used to draw. That
// sheet now reads the server's own catalogue (`KL_META.bulkPlayerFields` / `bulkNever`) so the
// list has ONE source, and the prose that explained the seam moved with it into
// views-keys-bulk-player.js. Nothing here is a cohort's business any more.

// The one name for a field, wherever it is printed — a row, a queue, a change review.
function cfgFieldLabel(f) {
  if (CFG_SUB_L[f]) return CFG_SUB_L[f];
  const d = cfgDefs()[f];
  return d ? d.l : f;
}

function cfgRowFields(r) {
  if (r === 'remembers') return CFG_REMEMBER;
  if (r === 'appearance') return CFG_LOOK;
  return [r];
}
function cfgSecFields(s) { return [...s.lead, ...s.more].flatMap(cfgRowFields); }
function cfgFields() { return (KL_META && KL_META.playerFields) || []; }

// What each row IS: its label, the kind of control it draws, its vocabulary, its default,
// and — where a value cannot apply right now — the reason (`na`: Controls None takes the
// three settings under it with it). `showIf` is the one row that exists only when the
// config it belongs to needs it.
function cfgDefs() {
  const m = KL_META || {};
  const w = (kind, v) => label(kind, v);
  const en = (kind, opts, dflt, whyFor) => ({ kind: 'enum', opts, words: opts.map(o => w(kind, o)), dflt, whyFor });
  const noCtl = e => ((e.controlsMode ?? 'full') === 'none' ? CFG_CTL_WHY : '');
  return {
    autoplay: { l: 'Autoplay', ...en('autoplay', m.autoplay || ['on', 'off', 'auto'], 'auto') },
    passiveVolume: { l: 'Passive volume', kind: 'num', unit: '%', dflt: 100 },
    muted: { l: 'Starts muted', kind: 'bool', dflt: false },
    playback: { l: 'Playback mode', ...en('playback', m.playbackKinds || ['active', 'passive'], 'active') },
    expandInMini: { l: 'Expand MiniTV for ads', kind: 'enum', opts: [true, false], words: ['Yes', 'No'], dflt: true },
    // WHAT A RETURNING VIEWER KEEPS (15 Sep, two user calls — *"can this label be better
    // renamed, from an enterprise platform"*, then *"rename it to something easy to understand
    // by user"*). `Remembers` read as a stray third-person verb; `Remembered` was closer but
    // still a participle standing on its own. `Remember` is the plainest true statement of what
    // the row does, and with its three values on the same line it reads as the instruction it
    // is: Remember — Volume, Language, Captions. The chip for the audio track is cut to
    // `Language` so label and values hold one line at the column's width; the change review
    // keeps the full `Remembers audio language`, which is where precision counts.
    remembers: { l: 'Remember', kind: 'set', fs: CFG_REMEMBER, words: ['Volume', 'Language', 'Captions'],
      hint: 'What a returning viewer keeps from last time' },
    // PLAYS AS (15 Sep, user call — *"rename Player type to a cleaner text which is understood
    // by everyone, and can they come in the same row, its value tabs"*). `Player type` asked the
    // reader to know what a player type IS; `Plays as` says the same thing as a sentence with
    // its own answers — Plays as Inline, Plays as YouTube. It is also short enough that the
    // three answers fit beside it, which is what took this row off the stacked list.
    playbackMode: { l: 'Plays as', ...en('playbackMode', m.playbackModes || ['inline'], 'inline') },
    redirectUrl: { l: 'Redirect URL', kind: 'text', ph: 'https://…',
      na: e => (e.playbackMode === 'inline_redirect' ? '' : 'Only an Inline + redirect player redirects'),
      showIf: eff => eff.playbackMode === 'inline_redirect' },
    quality: { l: 'Quality', kind: 'text', ph: 'auto', none: 'Auto',
      hint: 'Auto, or a label the stream itself carries' },
    fallbackMediaId: { l: 'Fallback media', kind: 'text', ph: 'media id' },
    dock: { l: 'Dock position', ...en('dock', m.dockPositions || ['off', 'lt', 'rt', 'lb', 'rb'], 'lb') },
    autoPausePct: { l: 'Pause below visibility', kind: 'pct', unit: '%', dflt: 50,
      hint: 'Below 10% the player cannot tell — the floor is 10' },
    loop: { l: 'Loop', kind: 'bool', dflt: false },
    endScreen: { l: 'End screen', ...en('endScreen', m.endScreens || ['none', 'related', 'custom'], 'none',
      o => (o === 'custom' ? 'A custom end screen needs a target the panel can hold — the player team owes us its shape' : '')) },
    controlsMode: { l: 'Control bar', ...en('controlsMode', m.controlsModes || ['full', 'minimal', 'none'], 'full') },
    // STORED AS WHAT IS HIDDEN, ASKED AS WHAT IS SHOWN. The wire's field is `hideControls`
    // and it stays that way, but a lit chip meaning "this one is GONE" is backwards from
    // every mental model a person brings — so the control is drawn the other way up, and
    // the inversion happens at ONE SEAM — the `shown` control renderer — rather than in
    // anyone's head.
    hiddenControls: { l: 'Controls', kind: 'shown', opts: m.playerControls || [], wordOf: o => w('playerControl', o), na: noCtl },
    playbackRates: { l: 'Speeds', kind: 'multi', opts: m.playbackRates || [0.5, 1, 1.25, 1.5, 2], wordOf: o => `${o}×`, keep: 1, na: noCtl },
    controlsAutoHideMs: { l: 'Hide controls after', kind: 'ms', dflt: 5000, na: noCtl },
    appearance: { l: 'Appearance', kind: 'look', fs: CFG_LOOK },
    analyticsLevel: { l: 'Events reported', ...en('analyticsLevel', m.analyticsLevels || [1, 2, 3], 3) },
    viewAfterMs: { l: 'View counts after', kind: 'ms', dflt: 3000 },
    heartbeatMs: { l: 'Heartbeat every', kind: 'ms', dflt: 10000 },
    comscoreId: { l: 'comScore id', kind: 'text', ph: 'none', none: 'None' },
    nielsenId: { l: 'Nielsen id', kind: 'text', ph: 'none', none: 'None' },
    gaId: { l: 'Google Analytics id', kind: 'text', ph: 'none', none: 'None' },
  };
}

// ---------- a value, in words ----------
// ONE word function for every field, so a card, a sheet, the bulk sheet and a line in the
// change review can never spell the same answer three different ways.
function pbWord(f, v) {
  if (v === undefined || v === null) return 'follows default';
  const secs = ms => (ms > 0 ? `${ms / 1000}s` : 'Off');
  switch (f) {
    case 'autoplay': case 'playback': case 'playbackMode': case 'controlsMode':
    case 'endScreen': case 'dock': case 'analyticsLevel': return label(f, v);
    case 'expandInMini': case 'muted': case 'loop':
    case 'rememberVolume': case 'rememberAudioLang': case 'rememberCaptions': return v ? 'Yes' : 'No';
    case 'passiveVolume': return `${v}%`;
    case 'autoPausePct': return v > 0 ? `${v}%` : 'Off';
    case 'controlsAutoHideMs': case 'viewAfterMs': case 'heartbeatMs': return secs(v);
    // Shown-side, like the control — and still naming the exact members, so a line in the
    // change review says WHICH control moved and not merely how many.
    case 'hiddenControls': return (v || []).length ? `without ${v.map(x => label('playerControl', x)).join(', ')}` : 'all';
    case 'playbackRates': return (v || []).map(x => `${x}×`).join(' · ');
    case 'quality': return v === 'auto' ? 'Auto' : String(v);
    default: return String(v === '' ? '—' : v);
  }
}

// THE NINE CONTROLS, DRAWN (14 Sep, user call — *"the hide controls options look too dry
// and it is not intuitive"*). A player's controls are things a viewer SEES, so nine
// identical word-chips are the least legible way to show them. One line glyph each, at one
// weight, used in both places they appear: the chips, and the bar of the preview they
// change.
const CFG_CTL_ICONS = {
  play: '<path d="M5.2 3.6 12.4 8 5.2 12.4Z" fill="currentColor" stroke="none"/>',
  progress: '<path d="M2 8h12"/><circle cx="6.2" cy="8" r="2.1" fill="currentColor" stroke="none"/>',
  volume: '<path d="M3.2 6.3h2.2L8.6 3.8v8.4L5.4 9.7H3.2z" fill="currentColor" stroke="none"/><path d="M11 6a2.8 2.8 0 0 1 0 4"/>',
  fullscreen: '<path d="M3 6V3h3M13 6V3h-3M3 10v3h3M13 10v3h-3"/>',
  quality: '<rect x="1.8" y="4.2" width="12.4" height="7.6" rx="1.8"/><text x="8" y="10.5" text-anchor="middle" font-size="6" font-weight="700" fill="currentColor" stroke="none">HD</text>',
  captions: '<rect x="1.8" y="3.8" width="12.4" height="8.4" rx="2"/><path d="M5.2 8.4h1.8M9 8.4h1.8"/>',
  speed: '<circle cx="8" cy="8" r="5.8"/><path d="M8 4.6V8l2.2 1.6"/>',
  pip: '<rect x="1.8" y="3.4" width="12.4" height="9.2" rx="1.6"/><rect x="7.8" y="7.8" width="5.2" height="3.6" rx="1" fill="currentColor" stroke="none"/>',
  share: '<circle cx="11.8" cy="4" r="1.7"/><circle cx="4.2" cy="8" r="1.7"/><circle cx="11.8" cy="12" r="1.7"/><path d="M5.7 7.2 10.3 4.8M5.7 8.8l4.6 2.4"/>',
};
function cfgIcon(id, cls) {
  const g = CFG_CTL_ICONS[id];
  if (!g) return '';
  return `<svg class="cfg-ic${cls ? ' ' + cls : ''}" viewBox="0 0 16 16" aria-hidden="true" fill="none"
    stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">${g}</svg>`;
}
function cfgHexOk(v) { return /^#([0-9a-f]{3}|[0-9a-f]{6})$/i.test(v || ''); }
// ONE COLOUR, ONE FIELD (15 Sep, user call — *"the appearance, can it be more refined"*). The
// swatch and the hex used to be two controls side by side: a 30px tile, then a bordered box —
// six rectangles for three settings, which is what made this block the heaviest thing in its
// column. They are ONE field now, the swatch inside the box at its left edge, so the three
// settings read as three fields on one lane like every other row on this card.
// The swatch is still the picker (a native input at zero opacity over it — the one place this
// panel takes the platform's control, because nothing drawn beats the OS's wheel) and the hex is
// still typeable, so a brand value can be pasted rather than hunted for.
function cfgColorFieldHtml(l, f, v, h) {
  return `<span class="cfg-lf">
    <i>${esc(l)}</i>
    <span class="cfg-cf">
      <span class="cfg-sw" style="background:${cfgHexOk(v) ? esc(v) : '#ffffff'}" title="Pick a colour">
        <input type="color" value="${esc(pbHex6(cfgHexOk(v) ? v : '#ffffff'))}" oninput="${h.color(f)}" onchange="${h.repaint()}" aria-label="Pick ${esc(l.toLowerCase())} colour">
      </span>
      <input class="mono cfg-hex" value="${esc(v || '')}" placeholder="#000000" spellcheck="false" oninput="${h.hex(f)}" aria-label="${esc(l)} colour, hex">
    </span>
  </span>`;
}
// The native picker only accepts #rrggbb, so a three-digit brand value is widened for it.
function pbHex6(v) {
  const m = /^#([0-9a-f]{3})$/i.exec(v || '');
  return m ? '#' + m[1].split('').map(c => c + c).join('') : (v || '#ffffff');
}
// RETIRED 15 Sep (user call — *"`Text on brand 5.8:1` — remove this text"*): `pbContrast`,
// `cfgContrastHtml` and `.cfg-look-note`, the WCAG ratio that outlived the preview it was
// written for by a few hours. It was the last thing on this card doing arithmetic nobody asked
// for, over a pair of values a brand team settles somewhere else entirely; the panel's job here
// is to carry the two colours to the player, not to grade them.

// ---------- LEVEL 1 · THE PAGE ----------
// PLAYER BEHAVIOUR (14 Sep, user call — the card's name; the named forks stay "configs", the
// word a player asks for one by).
//
// THE DEFAULT IS SET WHERE IT IS READ — NO MODAL (14 Sep, fifth cut).
// THREE COLUMNS, ONE PER SECTION — BREATHING (15 Sep, seventh cut, user call — *"the column
// like arrangement was better than this for default, please revert back to it but make it more
// breathable and clean, not cluttered, and make it more mature"*).
//   The columns come back, and what was wrong with them the first time is not the arrangement —
//   it was the FURNITURE. That cut drew a tinted box around the three, a full-height divider
//   between them and a hairline over every row: a grid of lines, which is what read as clutter,
//   and a hard bottom edge under the shortest column, which is what made the ragged heights
//   look like a mistake rather than like a column of type ending.
//   So the lines go and the air stays. No box, no dividers, no row rules — each column is its
//   name under a single rule, then its settings on a 40px rhythm with the answers on one lane
//   at the column's right edge. Sections keep their own column, which is the map this card has
//   always had; the two controls taller than a line (the preview, the nine glyphs) close their
//   column, so nothing is wedged between rows. A rule across the card separates the default
//   from the configs below it.
//   UNCHANGED from the two cuts before: every setting is visible (no view switch, 15 Sep), the
//   default is set in place (no modal, 14 Sep), and the names that stuttered were fixed —
//   `Appearance & controls` (it sat above its own `Controls` row), `Measurement` (it said one
//   thing twice) and the nine-glyph row's `Which controls`.
function playerCardHtml() {
  const cfgs = FORM.data.playerConfigs || [];
  const max = KL_META.maxPlayerConfigs || 6;
  return `
    <div class="fieldset pcw">
      ${FORM.errors.playerConfigs ? `<div class="banner bad" data-err-for="playerConfigs">${esc(FORM.errors.playerConfigs)}</div>` : ''}
      <div class="fieldset-title-row">
        <div class="fieldset-title">Player behaviour</div>
        ${pcTitleRightHtml()}
      </div>
      ${pcDefaultHtml()}
      <div class="pcc-head">
        <span class="pcd-eyebrow">Custom configs</span>
        <span class="pcw-k">${cfgs.length ? `${cfgs.length} of ${max}` : 'None yet · a player asks for one by key'}</span>
        ${cfgs.length ? `<span class="pcc-find">${pcFindHtml(cfgs)}</span>` : ''}
      </div>
      ${pcGridHtml(cfgs, max)}
    </div>`;
}

// TWENTY CONFIGS, NOT SIX (15 Sep, user call — *"there should be no upper limit … it can be say 20
// just see how to accommodate if there are 20 custom configs"*). Raising the ceiling is one number
// on the server; what it costs is the BLOCK, and that is what had to be answered.
//
// Six cards is a shelf. Twenty is a wall: five rows of them, ~900px of page under a card that is
// already the longest on the screen, and every one of them carrying four override lines nobody is
// reading while they hunt for `shorts`. So the block grows two things a shelf never needed:
//
//   · A COUNTED DOOR. Eight cards show — two rows on a normal window — and the rest sit behind
//     `Show all 20`, the same carried-block grammar the Integrations list uses for a selection it
//     has pinned. Nothing is hidden that the count does not name.
//   · A FILTER, once there is a list worth filtering (five or more). A config is asked for BY KEY,
//     so the key is what a person arrives knowing — typing it is faster than reading twenty tiles,
//     and it opens the door for as long as it is filtering, because a search that only searched the
//     first eight would be a search that lies.
const PCC_SHOW = 8;
let PCC_OPEN = false;
let PCC_Q = '';
function pcFindHtml(cfgs) {
  if (cfgs.length < 5) return '';
  return `<span class="pcc-find-f">
      <svg viewBox="0 0 16 16" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="1.6"
        stroke-linecap="round"><circle cx="7.1" cy="7.1" r="4.4"/><path d="m10.4 10.4 3 3"/></svg>
      <input value="${esc(PCC_Q)}" placeholder="Find a key" spellcheck="false"
        aria-label="Find a custom config by key" oninput="pcFind(this)">
    </span>`;
}
// THE LIST PAINTS, THE FIELD DOES NOT — the panel's caret rule. Typing rewrites the grid alone.
function pcFind(el) {
  PCC_Q = el.value;
  const grid = document.querySelector('#main .pcc-grid');
  if (grid) grid.outerHTML = pcGridHtml(FORM.data.playerConfigs || [], KL_META.maxPlayerConfigs || 6);
}
function pcShowAll() { PCC_OPEN = true; FORM.rerender(); }

function pcGridHtml(cfgs, max) {
  const q = PCC_Q.trim();
  // The cards keep their real index — every act on one addresses it by position.
  const all = cfgs.map((c, i) => ({ c, i }));
  const hit = q ? all.filter(x => matchesPrefix(q, x.c.name)) : all;
  const open = PCC_OPEN || !!q;
  const shown = open ? hit : hit.slice(0, PCC_SHOW);
  const rest = hit.length - shown.length;
  return `
      <div class="pcc-grid">
        ${shown.map(x => pcCardHtml(x.c, x.i)).join('')}
        ${!q && cfgs.length < max && (open || cfgs.length <= PCC_SHOW) ? `
          <button type="button" class="pcc-card pcc-new" onclick="shOpenNew()">
            <span class="pcc-plus">+</span>
            <span class="pcc-newt">New config</span>
            <span class="pcc-newh">A player asks for it by key</span>
          </button>` : ''}
      </div>
      ${q && !hit.length ? `<div class="pcc-none-q">No config keyed “${esc(q)}”</div>` : ''}
      ${rest ? `<div class="pcc-more-row"><button type="button" class="zlink" onclick="pcShowAll()">Show all ${hit.length} configs</button></div>` : ''}
      ${!q && !open && cfgs.length < max && cfgs.length > PCC_SHOW
        ? `<div class="pcc-more-row"><button type="button" class="zlink" onclick="shOpenNew()">+ New config</button></div>` : ''}`;
}

// THE SEED (14 Sep, earlier): a blank surface's default is a photocopy of one of three
// starting shapes — the player presets the mock world seeds (MiniTV · ArticleShow · VideoShow).
// `Start from` in the title row picks the shape. It exists only while creating BLANK — a copy
// is seeded by its source, and an existing surface has no preset left to pick (a preset
// stamps, it never links) — and re-picking it over changes asks first (`stampPreset`).
function pcPresetLive() { return !KEY_ORIGINAL && !!FORM.data.presetName; }
function pcTitleRightHtml() {
  if (!pcPresetLive()) return '';
  return `
    <div class="fills-strip pc-preset">
      <span class="fs-l">Start from</span>
      ${selectHtml(FORM.data.presetName, KL_META.playerPresets.map(p => ({ v: p.name, label: p.name })), v => stampPreset(v))}
    </div>`;
}
// Lists compare as sets — the controls grid toggles membership, and a different order is not
// a different answer.
const pcCanon = v => JSON.stringify(Array.isArray(v) ? [...v].map(String).sort() : (v ?? null));
// ONE COMPARATOR for the block's count, its bars and the create review, so the head can never
// disagree with the review: the default's fields that no longer read as `base` does.
function pcMovedAgainst(base) {
  if (!base) return [];
  const p = FORM.data.player || {};
  return cfgFields().filter(f => pcCanon(p[f]) !== pcCanon(base[f]));
}
// What moved off the seed while the surface is being made (the create review lists them).
function pcMovedFields() { return KEY_ORIGINAL ? [] : pcMovedAgainst(FORM.data.playerSeed); }
// WHAT THE CHANGE BAR MEASURES AGAINST: the seed while the surface is being made, the last
// save once it exists. A copy has neither, so it wears no bar until it is saved.
function pcBaseline() {
  if (KEY_ORIGINAL) return FORM.saved ? (FORM.saved.player || {}) : null;
  return FORM.data.playerSeed || null;
}
function pcRowDirty(r, moved) { return cfgRowFields(r).some(f => moved.includes(f)); }

// ---------- THE DEFAULT, ON THE PAGE ----------
function pgEff() { return FORM.data.player || (FORM.data.player = {}); }

function pcDefaultHtml() {
  const p = pgEff();
  const defs = cfgDefs();
  const moved = pcMovedAgainst(pcBaseline());
  // THE HEAD IS FACTS ONLY — no `DEFAULT CONFIG` eyebrow (15 Sep, user call — *"remove this
  // Default config text"*), after the `Used unless a config overrides it` byline went the same
  // way earlier the same day. Both were labels on a block whose place already names it: the
  // card is `Player behaviour`, and the rule under these columns carries `Custom configs`, so
  // what stands above the rule is the default by position. What is left here is what the reader
  // cannot deduce — WHERE THE DEFAULT STARTED (a seed, while a surface is being made) and what
  // has moved off it — and the head carries no height at all when it has neither (`.bare`).
  const say = KEY_ORIGINAL ? ''
    : FORM.data.presetName ? `${FORM.data.presetName} preset`
      : FORM.data.copiedFrom ? `Copy of “${FORM.data.copiedFrom}”` : '';
  // A refused player field is said on the block it was set on, not left for the seam's toast.
  const bad = cfgFields().filter(f => FORM.errors[f]);
  return `
    ${bad.length ? `<div class="banner bad" data-err-for="player">${esc(bad.map(f => FORM.errors[f]).join(' · '))}</div>` : ''}
    <div class="pcd${chgIf(moved.length > 0)}">
      <div class="pcd-head${say || moved.length ? '' : ' bare'}">
        ${say ? `<span class="pcd-say">${esc(say)}</span>` : ''}
        <span class="pc-moved pg-moved"${moved.length ? ` title="${esc(moved.map(cfgFieldLabel).join(', '))}"` : ' hidden'}>${moved.length} changed</span>
      </div>
      <div class="pcd-cols">${CFG_SECTIONS.map(sec => pcColHtml(sec, defs, p, moved)).join('')}</div>
    </div>`;
}
// A COLUMN IS A SECTION, in the catalogue's own order: `lead` — the handful a surface is really
// set up with — then the rest. Nothing is re-sorted for looks, so the Appearance column still
// reads as the sentence it was written to be: how many controls at all → what the player LOOKS
// like → which controls exactly.
function pcColHtml(sec, defs, p, moved) {
  const rows = [...sec.lead, ...sec.more].filter(r => !defs[r].showIf || defs[r].showIf(p));
  return `
    <section class="pcd-col" data-s="${sec.k}">
      <h5>${esc(sec.name)}</h5>
      ${rows.map(r => pcdRowHtml(r, defs[r], p, moved)).join('')}
    </section>`;
}
// A ROW: the setting, and the control that answers it at the column's right edge, so every
// answer in a column stands on one lane.
// A CONTROL WIDER THAN THE LANE PUTS ITS LABEL ABOVE and runs the column's full width under it
// — the preview and the nine glyphs, which are half a form each, and the chip sets, whose three
// words beside a label would squeeze `Remembers` to `Rememb…`. Truncating the question to fit
// the answer is exactly backwards.
// (`set` left this list 15 Sep, user call — *"its values also in the same row"*: three short
// chips and their label hold one line, so the row keeps the column's own grammar.) A single
// `wide` def joins them by name: the rule is the same one, MEASURED rather than guessed — a
// control that cannot share a line with its label takes the line under it, and the label is
// never the thing that gives.
// THE NINE GLYPHS COME BACK ONTO THEIR LABEL'S LINE (15 Sep, user call — *"Which controls can be
// renamed controls and it can be in a single row"*). They were stacked because at 28px the strip
// is 284px and the column is 320 with a 12px gutter — there was no room for a label beside it.
// Measured again for this: at 24px the strip is 240px, which leaves 68px for `Controls` and it
// fits with room to spare (`.pcd-c .cfg-strip`, 10-surfaces.css). So the row keeps the column's
// own grammar — question left, answer on the right-hand lane — like every other row but the
// colours, which are three fields and genuinely half a form.
const PCD_STACK = ['look'];
function pcdRowHtml(r, def, p, moved) {
  const na = def.na ? def.na(p) : '';
  const tall = PCD_STACK.includes(def.kind) || !!def.wide;
  return `
    <div class="pcd-r${tall ? ' tall' : ''}${na ? ' na' : ''}${chgIf(pcRowDirty(r, moved))}" data-r="${r}"${na ? ` title="${esc(na)}"` : ''}>
      <span class="pcd-l"${def.hint ? ` title="${esc(def.hint)}"` : ''}>${esc(def.l)}</span>
      <span class="pcd-c">${cfgCtlHtml(r, def, p, na, PG_H, { compact: true })}</span>
    </div>`;
}
// THE PAGE'S RECEIVER — the same verbs the config sheet uses, pointed at the page's draft.
// A discrete pick repaints the page (nothing in it holds a caret); typing marks its row and
// the head's count in place, or the caret goes with the repaint.
const PG_H = {
  set: (f, v) => `pgSet('${f}', ${v})`,
  chip: (f, v) => `pgChip('${f}', ${v})`,
  zero: (f, d) => `pgZero('${f}', ${d})`,
  num: f => `pgNum(this, '${f}')`,
  ms: f => `pgMs(this, '${f}')`,
  text: f => `pgText(this, '${f}')`,
  color: f => `pgColor(this, '${f}')`,
  hex: f => `pgHex(this, '${f}')`,
  repaint: () => 'FORM.rerender()',
  pick: f => (x => pgSet(f, x)),
};
function pgPut(f, v) { pgEff()[f] = v; clearErr(f); clearErr('player'); }
function pgSet(f, v) { pgPut(f, v); FORM.rerender(); }
function pgChip(f, o) {
  const def = cfgDefs()[f];
  const cur = pgEff()[f] || [];
  const has = cur.some(x => String(x) === String(o));
  if (has && def.keep !== undefined && String(o) === String(def.keep)) return;
  pgPut(f, has ? cur.filter(x => String(x) !== String(o)) : [...cur, o]);
  FORM.rerender();
}
// A timing or a threshold of 0 means OFF, so it is a switch and a number rather than a zero
// somebody has to know the meaning of. The last real value is kept while the switch is off.
function pgZero(f, dflt) {
  const cur = pgEff()[f] ?? 0;
  if (cur > 0) { SH_LAST[f] = cur; pgPut(f, 0); } else pgPut(f, SH_LAST[f] || dflt);
  FORM.rerender();
}
function pgNum(el, f) { const n = Number(el.value); if (Number.isFinite(n)) pgPut(f, n); pgMark(el); }
function pgMs(el, f) { const n = Number(el.value); pgPut(f, Number.isFinite(n) ? Math.round(n * 1000) : 0); pgMark(el); }
function pgText(el, f) { pgPut(f, el.value); pgMark(el); }
// THE COLOUR PAIR. The picker fires `input` continuously while the pointer moves, and every
// one of those updates the swatch, the hex and the stage IN PLACE — never a repaint, which
// would destroy the very input the picker is anchored to and shut it mid-drag (13 Sep).
function pgColor(el, f) {
  pgPut(f, el.value);
  el.closest('.cfg-sw').style.background = el.value;
  const hex = el.closest('.cfg-lf')?.querySelector('.cfg-hex');
  if (hex) hex.value = el.value;
  pgMark(el);
}
function pgHex(el, f) {
  const v = el.value.trim();
  pgPut(f, v);
  if (cfgHexOk(v)) {
    const sw = el.closest('.cfg-lf')?.querySelector('.cfg-sw');
    if (sw) { sw.style.background = v; sw.querySelector('input').value = pbHex6(v); }
  }
  pgMark(el);
}
// Written in place while somebody types — the row's bar and the head's count.
function pgMark(el) {
  const moved = pcMovedAgainst(pcBaseline());
  const row = el.closest('.pcd-r');
  if (row) row.classList.toggle('chg', pcRowDirty(row.dataset.r, moved));
  const block = document.querySelector('#main .pcd');
  if (block) block.classList.toggle('chg', moved.length > 0);
  const pip = document.querySelector('#main .pg-moved');
  if (!pip) return;
  pip.hidden = !moved.length;
  pip.textContent = `${moved.length} changed`;
  pip.title = moved.map(cfgFieldLabel).join(', ');
  // The head closes up when the count is its only tenant and the count is nothing — same test
  // the paint makes, asked of the DOM because typing must not repaint this block.
  const head = pip.parentElement;
  if (head) head.classList.toggle('bare', !moved.length && !head.querySelector('.pcd-say'));
}

// ---------- ONE WORD FOR A VALUE ----------
// Off the same `pbWord` every list of changes reads — with the two rows that are one decision
// over several fields (Remembers) or members (Which controls) said as the decision, not as the
// members. The config cards print their overrides with it, and a config's sheet prints the
// default's answer beside its own.
function pcWord(r, def, o) {
  if (r === 'remembers') {
    const w = def.words.filter((_, ix) => (o[def.fs[ix]] ?? true) === true);
    return w.length ? w.join(' · ') : 'Nothing';
  }
  const v = o[r];
  if (r === 'hiddenControls') {
    const hid = (v || []).length;
    const tot = def.opts.length;
    return hid ? `${tot - hid} of ${tot} shown` : `All ${tot}`;
  }
  if (v === undefined || v === null || v === '') {
    return def.dflt !== undefined ? pbWord(r, def.dflt) : (def.none || 'None');
  }
  return pbWord(r, v);
}
function pcColorHtml(v) {
  return cfgHexOk(v) ? `<span class="cfg-dot" style="background:${esc(v)}"></span>${esc(v)}` : 'None';
}

// ---------- THE CUSTOM CONFIGS ----------
// CARDS, AND WHAT THEY OVERRIDE (15 Sep, user call — *"custom config could be cards rather than
// rows with some 3-4 fields shown upfront in a sleek manner"*). A config is a thing you PICK
// out of a small set, which is what a card is for; and what distinguishes one from another is
// not its name but WHAT IT CHANGES — so the card is its key, its switch, and its first four
// overrides as label/value lines, the rest counted on a fifth (`+2 more`, all of them named on
// hover). A config that overrides nothing says so. The card opens the one sheet left here.
function pcCardHtml(c, i) {
  const off = c.on === false;
  const ov = cfgFields().filter(f => c[f] !== undefined);
  const sc = FORM.saved ? (FORM.saved.playerConfigs || [])[i] : c;
  const dirty = !!FORM.saved && JSON.stringify(c) !== JSON.stringify(sc ?? null);
  return `
    <div class="pcc-card${off ? ' off' : ''}${chgIf(dirty)}" tabindex="0" role="button"
      title="${esc(`Open “${c.name}”`)}" onclick="shOpenConfig(${i})" onkeydown="pcKey(event, this)">
      <div class="pcc-top">
        <span class="pcc-name mono">${esc(c.name)}</span>
        ${off ? '<span class="pc-off">Off</span>' : ''}
        <span class="pcc-acts" onclick="event.stopPropagation()">
          <span class="toggle tiny${off ? '' : ' on'}"
            title="${off ? 'Off — players asking for this key get the default' : 'On — players asking for this key get it'}"
            onclick="pcSet(${i}, 'on', ${off})"><span class="track"></span></span>
        </span>
      </div>
      <div class="pcc-facts">${pcCardFactsHtml(c, ov)}</div>
    </div>`;
}
// Four overrides, then the rest counted with every one of them named on hover.
function pcCardFactsHtml(c, ov) {
  if (!ov.length) return '<span class="pcc-none">Follows the default in everything</span>';
  const defs = cfgDefs();
  const word = f => (defs[f] ? pcWord(f, defs[f], c) : pbWord(f, c[f]));
  const line = f => `<span class="pcc-f"><i>${esc(cfgFieldLabel(f))}</i><b>${
    f === 'brandColor' || f === 'textColor' ? pcColorHtml(c[f]) : esc(word(f))}</b></span>`;
  const rest = ov.slice(4);
  return ov.slice(0, 4).map(line).join('') + (rest.length
    ? `<span class="pcc-more" title="${esc(rest.map(f => `${cfgFieldLabel(f)} ${word(f)}`).join(' · '))}">+${rest.length} more</span>`
    : '');
}

function pcKey(e, el) {
  if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); el.click(); }
}

// ---------- LEVEL 2 · A CONFIG'S SHEET ----------
// Two modes: an existing CONFIG, or a NEW one. (The DEFAULT left this sheet 14 Sep, fifth cut
// — it is set on the page, where it is read. A sheet earns its veil when the act is bounded
// and separable: a custom config is a handful of overrides asked for by key, named and created
// in one transaction. Setting a surface up is not that act.)
//
// THE SHEET IS A TRANSACTION (14 Sep, user call — *"the modal has no cancel button, only
// Done — what if I change something?"*). It opens a WORKING COPY: every row that has moved
// since it opened wears the panel's change bar, the act row counts them, Done lands them and
// Cancel drops them. Save and Publish are still the only gates to the wire; this changes
// nothing about either.
let SH = null;   // { mode: 'config' | 'new', i, draft, seed, err, pending:Set }

const shClone = o => JSON.parse(JSON.stringify(o || {}));

// A ROW THE STRIP JUST ADDED IS SCROLLED TO AND LIT, so the eye lands on the setting that
// just appeared instead of hunting for it under a band.
function shGoTo(r, lit = true) {
  requestAnimationFrame(() => {
    const el = dialogRoot().querySelector(`.sh-row[data-r="${r}"]`);
    if (!el) return;
    el.scrollIntoView({ block: 'center' });
    // THE FLASH IS FOR AN ARRIVAL, NOT A REFUSAL. A row that has just been flagged red is
    // already wearing a mark; pulsing it amber at the same moment is two signals for one
    // state, and the amber one means something else everywhere else in this app.
    if (!lit) return;
    el.classList.add('lit');
    setTimeout(() => el.classList.remove('lit'), 1500);
  });
}
function shOpenConfig(i) {
  const c = (FORM.data.playerConfigs || [])[i];
  if (!c) return;
  SH = { mode: 'config', i, draft: shClone(c), seed: shClone(c), pending: new Set(), parked: new Set(), q: '' };
  shRender();
}
function shOpenNew() {
  const max = KL_META.maxPlayerConfigs || 6;
  if ((FORM.data.playerConfigs || []).length >= max) {
    toast(`At most ${max} custom configs per integration`, 'warn');
    return;
  }
  const blank = { name: '', on: true };
  SH = { mode: 'new', draft: shClone(blank), seed: shClone(blank), err: '', pending: new Set(), parked: new Set(), q: '' };
  shRender();
  requestAnimationFrame(() => dialogRoot().querySelector('.sh-key')?.focus());
}

// DONE LANDS THE WORKING COPY. The page repaints ONCE — here — rather than behind the veil
// on every keystroke of an edit nobody can see happening.
function shDone() {
  if (!SH) return;
  // A config whose key the server would refuse may not be put away out of sight: Done says
  // so in the field instead, which is where the mistake was made.
  const why = pcKeyWhy((SH.draft.name || '').trim(), SH.mode === 'new' ? -1 : SH.i);
  if (why) {
    shKeyPaint(why);
    const el = dialogRoot().querySelector('.sh-key');
    if (el) { el.focus(); el.select(); }
    return;
  }
  SH.draft.name = (SH.draft.name || '').trim();
  // NOTHING LEAVES THIS SHEET HALF-ASKED (15 Sep, user call). A picked setting with no value
  // would land as an override of nothing, so it is refused here, by name, where it was picked
  // — the panel's own grammar for a refusal, and the same one the cohort sheet uses.
  if (SH.pending.size) {
    const names = [...SH.pending].map(cfgFieldLabel);
    const one = names.length === 1;
    SH.err = `${one ? names[0] : names.slice(0, -1).join(', ') + ' and ' + names[names.length - 1]}`
      + ` ${one ? 'has' : 'have'} no value yet — set ${one ? 'it' : 'them'} or take ${one ? 'it' : 'them'} off the sheet.`;
    shRender();
    shGoTo([...SH.pending][0], false);
    return;
  }
  // A PARKED ROW LANDS AS ABSENCE. The model has one state for "follows the default" and the
  // wire has no second one for "overridden but ignored", so the switch's off position resolves
  // here — the same place an untick would have left it.
  for (const r of SH.parked) for (const f of cfgRowFields(r)) delete SH.draft[f];
  if (SH.mode === 'config') FORM.data.playerConfigs[SH.i] = SH.draft;
  else (FORM.data.playerConfigs || (FORM.data.playerConfigs = [])).push(SH.draft);
  clearErr('playerConfigs');
  shShut();
}
// CANCEL IS A STATED INTENT, so it drops the work without asking again. The veil and Escape
// are not — a stray click must never cost a sheet somebody has filled in — so those ask, and
// only when there is something to lose.
function shCancel() { shShut(); }
function shShut() {
  SH = null;
  closeDialog();
  if (typeof FORM !== 'undefined' && FORM.rerender) FORM.rerender();
}
async function shBail() {
  if (!SH) return;
  const n = shChangeCount();
  if (!n) { shShut(); return; }
  // The confirm takes the dialog for a moment — every dialog here shares one root — so the
  // sheet is drawn again on the way out if the answer was no.
  const ok = await ask({
    title: 'Discard these changes?',
    body: `${n} change${n === 1 ? '' : 's'} on this sheet will be dropped.`,
    okLabel: 'Discard', danger: true,
  });
  if (ok) shShut(); else shRender();
}

// WHERE THE SHEET READS AND WRITES — the working copy, over the page's default underneath it.
function shOwn() { return SH ? SH.draft : {}; }
function shEff() {
  const o = { ...(FORM.data.player || {}) };
  for (const f of cfgFields()) if (SH.draft[f] !== undefined) o[f] = SH.draft[f];
  return o;
}
function shIsOwn(f) { return shOwn()[f] !== undefined; }
function shRowOwn(r) { return cfgRowFields(r).some(shIsOwn); }
// A ROW THE SWITCH HAS PARKED (15 Sep, user call — *"for every value selected from lhs in the rhs
// apart from x on the right side give option to enable disable switch as well"*).
//
// THE TWO CONTROLS ON A ROW DO DIFFERENT THINGS, which is the only reason to have two.
//   · the SWITCH answers "is this config's own answer applying?" — off, the row keeps its place
//     and its value, greys, and the config follows the default for it. On, it applies again.
//     Nothing is lost while it is off, so it is the cheap way to ask *what would the default do
//     here?* without retyping what you had.
//   · the × answers "does this config have an opinion about this setting at all?" — it takes the
//     setting off the sheet and unticks it in the rail.
// Both end the same way at the wire — a parked field is DROPPED by `shDone`, exactly as an
// untick is — because the model has one state for "follows the default" and no second one for
// "overridden but ignored". Parking is a working-copy convenience, and Cancel puts it all back.
// (It is also what makes the way back always visible: the × only appears on hover.)
function shRowParked(r) { return !!(SH && SH.parked && SH.parked.has(r)); }
function shRowOn(r, v) {
  if (!SH) return;
  if (v) SH.parked.delete(r); else SH.parked.add(r);
  shRender();
}

// A ROW PICKED BUT NOT YET ANSWERED. It is on the sheet, it is not on the config.
function shRowWaiting(r) { return !!(SH && SH.pending && SH.pending.has(r)); }
function shRowOnSheet(r) { return shRowOwn(r) || shRowWaiting(r); }
// THE FOUR KINDS WITH NO EMPTY STATE (the cohort sheet draws the same line): a grid of nine
// controls, a set of chips, a row of speeds and a pair of colours all have a resting shape
// that IS an answer — nothing lit is "hide everything", not "unanswered" — so these four are
// seeded from the default when they are picked and count as answered at once. Everything
// else starts blank, because a blank field cannot be mistaken for a decision.
// RETIRED 15 Sep: `shNeedsSeed`, the four kinds this sheet used to prefill from the default.
// Nothing is prefilled any more (see `shPick`). The cohort sheets keep their own seeding rules —
// they seed from what a SELECTION agrees on, which is a different question with a different
// honest answer, and `pbNeedsSeed` / `ccNeedsSeed` are theirs.
// WHAT HAS MOVED SINCE THE SHEET OPENED — the number Cancel would put back. The key counts as
// a change like any other answer.
function shChanged(f) { return JSON.stringify(SH.draft[f] ?? null) !== JSON.stringify(SH.seed[f] ?? null); }
function shRowChg(r) { return cfgRowFields(r).some(shChanged); }
function shChangeCount() {
  if (!SH) return 0;
  const named = (SH.draft.name || '') !== (SH.seed.name || '');
  const switched = (SH.draft.on !== false) !== (SH.seed.on !== false);
  // A PARKED ROW COUNTS WHERE IT WILL COST SOMETHING. Its value is still in the draft, so
  // `shChanged` cannot see it — but `shDone` is going to drop the field, so a row that arrived as
  // an override and leaves parked IS a change. One that was ticked in this same sitting is not:
  // it was never on the config to begin with.
  const parked = [...SH.parked].filter(r => cfgRowFields(r).some(f => SH.seed[f] !== undefined)).length;
  return cfgFields().filter(shChanged).length + (named ? 1 : 0) + (switched ? 1 : 0) + parked;
}
// WHICH ROW A FIELD BELONGS TO. `Remember` is one row over three fields and `Appearance` one over
// three, so a write has to find its row again to mark it answered.
function shRowOf(f) {
  for (const sec of CFG_SECTIONS) {
    for (const r of [...sec.lead, ...sec.more]) if (cfgRowFields(r).includes(f)) return r;
  }
  return f;
}
function shPut(f, v) {
  if (!SH) return;
  shOwn()[f] = v;
  // ANSWERING IS WHAT TAKES A ROW OFF THE WAITING LIST — BY ROW, not by field (15 Sep). Every kind
  // waits now, including the two that are one decision over three fields, and on those the field
  // written is never the key the row waits under.
  if (SH.pending) SH.pending.delete(shRowOf(f));
  if (SH.err) SH.err = '';
  clearErr(f);
  clearErr('playerConfigs');
}
function shDrop(f) { if (SH) delete shOwn()[f]; }

// RETIRED 14 Sep (fifth cut): `shAll` / `shSetAll` / `shRowShown` and `SH.all`. The
// Essentials / All settings switch answered for the DEFAULT's catalogue, and the default is
// on the page now — where the switch went with it. A config's sheet lists what the config
// owns, which is a list it makes itself.

// A LINE UNDER THE TITLE ONLY WHERE THERE IS SOMETHING TO SAY (14 Sep, user call —
// *"`Every player on this surface, unless it asks for a config by key` — remove this text"*).
// That line was the third telling of one idea: the card said it, the title said it, and then
// a sentence said it again before a single setting appeared. The two remaining lines are
// FACTS, not gloss — how much of this config is its own, or the rule a new key must pass —
// and a refusal replaces whichever stands, so the head never grows a third line.
// AN EXISTING CONFIG'S HEAD SAYS NOTHING (15 Sep, user call — *"`2 of 29 settings are this
// config's own · the rest follow the default` — remove this text"*). It counted what the body
// below it lists: the rows ARE the settings this config owns, and everything not on the sheet
// follows the default by definition — the model itself, read back as if it were news. What is
// left under the title is the rule a NEW key must pass, which is not a description of anything
// on screen, and a refusal, which replaces whichever stands.
// RETIRED 15 Sep (user call — *"`A player asks for this config by its key — one word, unique on
// this integration` — remove this text"*): `shSubText`. It was the last standing line under the
// title, and it explained a field that explains itself — a monospace key box with `e.g. shorts`
// in it, on a sheet called Custom configs. The rule it stated (one word, unique) is enforced
// where it is broken, by name, in the field itself. The line under the title is now a REFUSAL
// and nothing else, which is the only thing that was ever news.

// THE SHEET REPAINTS AS ONE BLOCK, so the scroll position is carried across by hand. Without
// this, choosing an option halfway down threw the reader back to the title — which is what
// made opening `more` feel like a jump to the top.
function shRender() {
  if (!SH) return;
  const was = dialogRoot().querySelector('.sh-pane');
  const top = was ? was.scrollTop : 0;
  const wasRail = dialogRoot().querySelector('.sh-rail-list');
  const railTop = wasRail ? wasRail.scrollTop : 0;
  const eff = shEff();
  const defs = cfgDefs();
  const isNew = SH.mode === 'new';
  const sub = SH.err || '';
  dialogRoot().innerHTML = `
    <div class="dlg-veil" onclick="shVeil(event)"><div class="dlg wide sh">
      <div class="sh-head${SH.err ? ' err' : ''}">
        <div class="sh-title">
          <span class="sh-t">
            <input class="sh-key mono" value="${esc(SH.draft.name || '')}" placeholder="e.g. shorts" spellcheck="false" maxlength="24"
              aria-label="Config key" oninput="shKeyIn(this)" ${isNew ? '' : 'onblur="shKeyOut(this)" '}
              onkeydown="if (event.key === 'Enter') { event.preventDefault(); ${isNew ? 'shDone()' : 'this.blur()'}; }">
            <span class="sh-sub"${sub ? '' : ' hidden'}>${esc(sub)}</span>
          </span>
          ${shHeadActsHtml()}
        </div>
      </div>
      <div class="dlg-body sh-body sh-split">
        ${shCfgBodyHtml(defs, eff)}
      </div>
      ${shFootHtml()}
    </div></div>`;
  // BOTH PANES CARRY THEIR OWN SCROLL. Ticking a box repaints the whole sheet, so without this
  // every tick throws the rail back to the top — and the pane with it, which is worse now that
  // the pane is where the answer you just asked for appears.
  const pane = dialogRoot().querySelector('.sh-pane');
  if (pane && top) pane.scrollTop = top;
  const rail = dialogRoot().querySelector('.sh-rail-list');
  if (rail && railTop) rail.scrollTop = railTop;
}

// THE CONFIG'S OWN ACTS LIVE WHERE THE CONFIG IS OPEN (15 Sep, user call — *"give a delete option
// on the modal in 3 dot and remove 3 dot from the cards … and move the enable disable to right
// side"*). The card used to carry both a switch and a ⋯, which made a 238px tile the home of two
// acts you can only judge with the config open in front of you — is this the one to retire? has
// it anything left to drop? The sheet is that place, so the ⋯ moves here, and the switch stands
// beside it on the same right-hand edge in both places. The card keeps the switch alone: on/off
// is the one decision worth making at a glance, and the only one a card can honestly support.
//
// The switch writes to the WORKING COPY like everything else on this sheet — Cancel puts it back,
// Done lands it, and `shChangeCount` counts it. Remove and Follow-the-default are not working-copy
// acts: they are the page's own (`pcRemove` / `pcFollowAll`, which ask first), so they shut the
// sheet rather than pretending to be undoable inside it.
function shHeadActsHtml() {
  if (!SH) return '';
  const off = SH.draft.on === false;
  const isNew = SH.mode === 'new';
  return `
    <span class="sh-acts">
      <span class="toggle tiny${off ? '' : ' on'}"
        title="${off ? 'Off — players asking for this key get the default' : 'On — players asking for this key get it'}"
        onclick="shOn(${off})"><span class="track"></span></span>
    </span>`;
}
// THE DESTRUCTIVE ACT SITS WITH THE ACTS (15 Sep, user call — *"the 3 dot can be moved to the
// bottom near the button"*, then *"could be placed at the right side of button on the bottom and
// 3 dot could be vertical"*). It rode the title for a round, which put a menu in a row that is
// otherwise the config's NAME and its one glanceable state; then the foot's far left, which is
// where a dialog's rare act often goes — but a lone glyph in the opposite corner from every other
// control reads as orphaned. It sits after the primary now, the last thing in the act row, and it
// is a VERTICAL ellipsis: a horizontal one beside a row of horizontal buttons is one more dash in
// a line of them, where the vertical reads as a handle. The menu opens upward and hangs from its
// right edge, because there is nothing below it and nothing to its right.
function shFootMenuHtml() {
  if (!SH || SH.mode !== 'config') return '';
  return `<span class="rmenu up sh-menu">
      <button type="button" class="row-kebab" onclick="rmenuToggle(event, this)" aria-label="More actions">⋮</button>
      <div class="rmenu-list">
        <div class="eh-item danger" onclick="rmenuShut(this); shRemove()">Delete config</div>
      </div>
    </span>`;
}
function shOn(v) {
  if (!SH) return;
  SH.draft.on = v;
  shRender();
}
// It leaves the sheet: deleting is a decision about the config as a whole, it asks before it
// lands, and it is not something Cancel could put back.
//
// RETIRED 15 Sep (user call — *"follow the default for everything remove it from 3 dot"*):
// `shFollowAll` and the page's `pcFollowAll` behind it. It was written when the catalogue was a
// dropdown and dropping every override meant hunting each row's × behind a face. The rail makes
// it three clicks in plain sight — one section box each — and a menu item that duplicates what is
// already on screen only makes the one item that ISN'T (Delete) harder to find.
async function shRemove() {
  if (!SH || SH.mode !== 'config') return;
  const i = SH.i;
  shShut();
  await pcRemove(i);
}

// RETIRED 14 Sep (fifth cut): `shSecHtml`, the default's lead/more section list. The
// default's catalogue is the page's three columns now; a config's body lists what it owns.

// ---------- A CONFIG'S BODY: THE OVERRIDES IT HAS, AND THE ONE THAT ADDS ANOTHER ----------
// PICK THE SETTING, THEN ANSWER IT (14 Sep, user call — *"the new custom config to be an option
// where user first selects which field he/she wants to customize from a drop down of fields
// and once selected alters its value as the custom config"*). The sheet before this one drew
// all twenty-nine rows and receded the ones that followed the default — a form for the whole
// player, on a thing that by its own model is a handful of overrides. The body is now exactly
// the model: one strip that ADDS an override (our select, the catalogue grouped by section,
// minus what is already here), then the overrides it has under the section bands they belong
// to, each with the default's answer beside it and a × that puts it back to following.
// TWO PANES: THE CATALOGUE ON THE LEFT, THE ANSWERS ON THE RIGHT (15 Sep, user call — *"can we
// show the fields upfront taking 30% of the space in the lhs or rhs whichever is better rather
// than selection from drop down"*).
//
// WHY THE DROPDOWN WAS WRONG HERE. A dropdown is right when the catalogue is a DETOUR — you go
// in, pick, come back, and what you picked is the thing you now work on. It is wrong when
// choosing IS the work. On this sheet the two lists a person moves between — what this config
// has taken over, and what it could — were never on screen together: every comparison cost an
// open, a scan and a shut, and the face could only ever say `Choose settings…` because a face
// has no room to report twenty-five states.
//
// WHY THE LEFT. The panel's existing rails are on the right — the version history, the CHANGES
// TO APPLY card — and both are OUTCOMES: what happened, what will happen. A catalogue you pick
// from is neither; it is the source, and the sentence this sheet is reads left to right —
// *these settings* → *these values*. The wider pane is the work surface, and work surfaces take
// the right. (Also: the answers keep the change bar in their own left gutter, undisturbed.)
//
// 30% MEASURED: 244px of the 812px between the frame's padding, then a 1px rule and a 28px
// gutter, leaving 540 for the rows — which is more than the 200px label lane plus the widest
// control needs, and lets the nine tiles fall to two columns rather than three.
function shCfgBodyHtml(defs, eff) {
  const secs = CFG_SECTIONS.map(sec => {
    const rows = [...sec.lead, ...sec.more].filter(shRowOnSheet);
    if (!rows.length) return '';
    return `
    <section class="sh-sec" data-s="${sec.k}">
      <div class="sh-sh"><h4>${esc(sec.name)}</h4></div>
      ${rows.map(r => shRowHtml(r, defs[r], eff)).join('')}
    </section>`;
  }).join('');
  // AN EMPTY PANE NEEDS NO INSTRUCTION ANY MORE. It used to carry a sentence, then the map of
  // the sections a pick could land in (`sheetAnatomyHtml`, still the cohort sheet's) — both
  // there because the catalogue was hidden behind a face. The catalogue is standing open beside
  // it now, ticked and counted, so the pane says the one thing the rail cannot: what this config
  // currently does. Which, with nothing ticked, is follow the default.
  const groups = shPickGroups(defs, eff);
  const empty = `
    <div class="sh-blank">
      <svg viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="1.5"
        stroke-linecap="round"><path d="M4 7h7M15 7h5M4 17h3M11 17h9"/><circle cx="13" cy="7" r="2.1"/><circle cx="9" cy="17" r="2.1"/></svg>
      <b>Nothing changed yet</b>
      <span>Pick a setting on the left to change it just for this config.
        Everything else stays the same as the default.</span>
    </div>`;
  return `
    <aside class="sh-rail">
      <div class="sh-search">
        <svg viewBox="0 0 16 16" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="1.6"
          stroke-linecap="round"><circle cx="7.1" cy="7.1" r="4.4"/><path d="m10.4 10.4 3 3"/></svg>
        <input value="${esc(SH.q || '')}" placeholder="Search settings" spellcheck="false"
          aria-label="Search settings" oninput="shSearch(this)">
        ${SH.q ? '<button type="button" class="sh-search-x" aria-label="Clear search" onclick="shSearchClear(this)">×</button>' : ''}
      </div>
      <div class="sh-rail-list">${shRailListHtml(groups)}</div>
    </aside>
    <div class="sh-pane">
      ${secs || empty}
    </div>`;
}
// ---------- THE PICKER: WHICH SETTINGS THIS CONFIG OVERRIDES ----------
// CHECKBOXES, AND THE SECTIONS AS REAL HEADERS (15 Sep, user call — *"rather than this All of
// Playback, all of this, shall we introduce a checkbox against each field and a checkbox
// against Playback which selects all its fields; also Playback, Measurement — those sections
// are headers, currently it is not communicated properly here in the dropdown"*).
//   Two faults, one cause. A single-pick menu can only ADD, so "everything in this section" had
//   to be smuggled in as a pseudo-option (`All of Playback`) sitting among real settings and
//   reading like one — and the section names, having no job but to sit above their group, were
//   a faint line of type the eye skipped. The control was the wrong SHAPE for the question:
//   this is not "which setting do I want next", it is "which settings does this config
//   override" — a list you tick.
//   So the menu is a CHECKLIST. Every setting carries a box, every section carries its own box
//   above its settings — full when all of them are ticked, half-filled when some — and ticking a
//   section ticks everything under it. The menu stays open while you work, because choosing five
//   settings is one act and not five. Unticking takes a setting off the sheet exactly as the
//   row's × does, including one that already had a value: the sheet is a working copy and Cancel
//   puts all of it back, which is what makes a ticked box safe to untick.
// The groups the strip offers — built once and read twice, by the menu and by the empty body's
// map of the sheet, so the two can never name or count a section differently.
function shPickGroups(defs, eff) {
  return CFG_SECTIONS.map(sec => ({
    k: sec.k,
    name: sec.name,
    rows: [...sec.lead, ...sec.more]
      .filter(r => !defs[r].showIf || defs[r].showIf(eff))
      .map(r => ({ v: r, label: defs[r].l })),
  })).filter(g => g.rows.length);
}

// THE RAIL'S LIST — the catalogue, narrowed to what the search matches.
//
// A SEARCH SUSPENDS THE SECTION BOXES (`flat`). A section's box means "all of Playback", and over
// a filtered view that is a trap: somebody types `vol`, sees one row under Playback, ticks the
// section box and gets thirteen. The two acts belong to different modes — browse a group, or find
// one setting — so while a query stands the heads are labels and nothing else. Clearing the search
// gives the boxes straight back.
function shRailListHtml(groups) {
  const q = (SH.q || '').trim();
  const shown = !q ? groups : groups
    .map(g => ({ ...g, flat: true, rows: g.rows.filter(r => matchesPrefix(q, r.label)) }))
    .filter(g => g.rows.length);
  if (!shown.length) return `<div class="sh-noq">No setting matches “${esc(q)}”</div>`;
  return shPickerHtml(shown);
}
function shPickerHtml(groups) {
  return pickerHtml(groups, SH_PICK_H, { inline: true });
}
// TYPING NEVER REPAINTS THE SHEET — the panel's caret rule. Only the list under the field is
// rewritten, so the input, its value and the caret are never touched. The `×` needs the field's
// own state, so it is toggled in place beside it rather than re-rendered.
function shSearch(el) {
  if (!SH) return;
  SH.q = el.value;
  shRailSync();
}
function shSearchClear(btn) {
  if (!SH) return;
  SH.q = '';
  const el = btn.closest('.sh-search').querySelector('input');
  el.value = '';
  el.focus();
  shRailSync();
}
function shRailSync() {
  const list = dialogRoot().querySelector('.sh-rail-list');
  if (list) list.innerHTML = shRailListHtml(shPickGroups(cfgDefs(), shEff()));
  const wrap = dialogRoot().querySelector('.sh-search');
  if (!wrap) return;
  const had = wrap.querySelector('.sh-search-x');
  if (SH.q && !had) {
    wrap.insertAdjacentHTML('beforeend',
      '<button type="button" class="sh-search-x" aria-label="Clear search" onclick="shSearchClear(this)">×</button>');
  } else if (!SH.q && had) had.remove();
}
// THE RECEIVER — the same shape `cfgCtlHtml` takes, for the same reason: the control knows how
// to draw a checklist and nothing about where the ticks live. Nothing here is ever refused (a
// config may override any of the player's settings), so `off` answers with no reason at all.
const SH_PICK_H = {
  has: r => shRowOnSheet(r),
  off: () => '',
  toggle: r => shPickToggle(r),
  toggleAll: k => shPickToggle('all:' + k),
  // Standing open is the whole point of the rail, so there is no open/shut state left to keep:
  // the control never reports itself closed and nothing can close it.
  open: false,
  setOpen() {},
};
// A SECTION'S BOX IS ALL OR NOTHING: empty or half-filled it takes everything under it; full,
// it gives everything back.
function shPickToggle(key) {
  if (!SH) return;
  const defs = cfgDefs();
  const eff = shEff();
  const sec = key.startsWith('all:') && CFG_SECTIONS.find(x => x.k === key.slice(4));
  const rows = sec
    ? [...sec.lead, ...sec.more].filter(r => !defs[r].showIf || defs[r].showIf(eff))
    : [key];
  const giveBack = sec ? rows.every(shRowOnSheet) : shRowOnSheet(key);
  for (const r of rows) (giveBack ? shUnpick : shPick)(r, defs);
  SH.err = '';
  shRender();
}

// A TICKED SETTING IS A QUESTION, NOT AN ANSWER (15 Sep, user call — *"once selected don't show
// any default value, they are meant to be configured; if not configured run a validation and ask
// the user to fill before applying"*). The control stands with nothing in it, the row says
// nothing but its ×, and the sheet will not close over it (`shDone`). The cut before this one
// dropped the default's own value into the row, so a setting somebody had chosen to override sat
// there already agreeing with the thing it was overriding — a decision that looks made before it
// is made, and one that lands whether or not anybody touched it.
// NOTHING IS SEEDED. EVERY PICK IS A QUESTION (15 Sep, user call — *"the fields selected in custom
// config should not carry any default value it should be set if selected and a validation should
// be there"*).
//
// Four kinds used to be the exception — the nine glyphs, the speed chips, the remember chips and
// the colours — because none of them has a drawable empty state: an unlit strip is not "nothing
// chosen", it is "hide everything". So they were stamped with the default's own answer and counted
// as answered from that moment, which is the one thing this sheet had promised not to do: a
// setting somebody chose to OVERRIDE sitting there already agreeing with the thing it overrides,
// landing whether or not anyone touched it.
//
// The ambiguity is real and it is not solved by pretending — it is solved by the REFUSAL. A picked
// row now lands in `SH.pending` whatever its kind, draws from no value at all (`shRowEff` strips
// the row's fields, so the default cannot leak through `shEff`'s fallback), and the first touch of
// its control is what answers it. Nothing leaves the sheet until every picked row has been
// touched, and `shDone` names the ones that have not.
function shPick(r, defs) {
  if (!defs[r]) return;
  SH.pending.add(r);
}
function shUnpick(r) {
  if (!SH) return;
  SH.pending.delete(r);
  SH.parked.delete(r);
  for (const f of cfgRowFields(r)) shDrop(f);
}
function shDropRow(r) {
  if (!SH) return;
  shUnpick(r);
  if (SH.err) SH.err = '';
  shRender();
}

// WHAT IT WOULD OTHERWISE BE, AND THE WAY BACK. The default's answer stands beside the
// config's own, so an override reads as WAS → NOW where it is made — the change review's own
// spine; a row still equal to it says so instead. The × returns the row to following. (The
// preview and the controls grid carry their own comparison, so they get the × alone.)
function shTailHtml(r, waiting, parked) {
  // A ROW STILL BEING ASKED SAYS NOTHING (15 Sep, user call — *"remove this Not set yet"*). The
  // empty control is the state: a row with no answer in it is not mistakable for one that has
  // an answer, and the words were a caption on a thing that was already legible. What the row
  // does keep is the tail's ×, and — only once Apply has refused over it — the flag, which is
  // news rather than description.
  // A ROW WITH NO ANSWER HAS NOTHING TO PARK, so its switch is not drawn — but the SLOT is, with
  // the real control hidden in it. Reserving the width by hand (`min-width`) was one number to
  // keep true against three; letting the element hold its own place cannot drift, and it keeps
  // the ×, the switch and every control's right edge on one vertical lane whatever a row is doing.
  if (waiting) {
    return `<span class="sh-tail">
        <span class="toggle tiny void" aria-hidden="true"><span class="track"></span></span>
        <button type="button" class="sh-x" title="Take this setting off the sheet" aria-label="Take this setting off the sheet" onclick="shDropRow('${r}')">×</button>
      </span>`;
  }
  // RETIRED 15 Sep (user call — *"dont show the default value on the right side near the switch in
  // the custom config modal"*): `DEFAULT <value>`, `same as default` and `following the default`.
  // The tail was carrying three different sentences about the default in the one place a row's
  // own controls live, and every one of them was already said somewhere better: the DEFAULT's
  // values are the card behind this sheet, a row equal to it is a fact nobody acts on, and a
  // parked row is legible from its own greyed control and its off switch. What is left is what
  // the tail is for — the two things you can DO to the row.
  return `<span class="sh-tail">
        <span class="toggle tiny${parked ? '' : ' on'}"
          title="${parked ? 'Off — this config follows the default here. Its own answer is kept.' : 'On — this config\u2019s own answer applies'}"
          onclick="shRowOn('${r}', ${parked})"><span class="track"></span></span>
        <button type="button" class="sh-x" title="Take this setting off the sheet" aria-label="Take this setting off the sheet" onclick="shDropRow('${r}')">×</button>
      </span>`;
}

// THE BAR MEANS "MOVED SINCE THIS SHEET OPENED" — in every mode (14 Sep). On a config every
// row on screen is already the config's own (that is what puts it there), so the bar is free
// to mean the one thing it means everywhere else in this app: not what it was when you came.
// One mark, one colour — the panel's amber.
// A CONTROL TALLER THAN ITS LABEL TAKES THE WHOLE WIDTH. The preview and the controls grid
// are half a form each; squeezed into the value column they wrapped into rags.
// ONE ROW GRAMMAR, AND IT IS THE PAGE'S (15 Sep, user call — *"the controls and all the UI should
// be similar like in a single row the way it is being done on the integration edit page"*).
// The nine controls used to be the modal's one exception: a GRID of labelled tiles with the
// question stacked above it, because a modal has the width to carry the labels. But the page had
// already been re-cut to draw them as a strip on their label's line, and a setting that is one
// row on the card behind the sheet and half a form inside it is the same setting drawn as two
// different things. So the sheet takes the page's cut of it — `compact`, the 24px glyph strip —
// and `tall` is left to the one control that genuinely is half a form: the three colours.
const SH_STACK = ['look'];
// WHAT A WAITING ROW DRAWS FROM: nothing. `shEff()` is the config's overrides over the DEFAULT, so
// a row with no override yet would read the default's value straight out of that fallback — which
// is exactly the prefill this sheet stopped doing.
//
// For most kinds "nothing" is the field's absence and the control draws its own empty state. The
// four that have no empty state get an explicit EMPTY SLATE instead, chosen so each reads as
// nothing-chosen rather than as everything-chosen: no chips lit, no speeds lit, no glyph lit
// (which for `hiddenControls`, whose list is what is HIDDEN, means every one of them in it), no
// colour set. It is a display value only — the draft stays untouched, so the row is still refused
// until somebody moves it, and `shCur` hands the same slate to the first click so what the screen
// shows and what the click computes from cannot disagree.
function shRowEff(r, eff, waiting) {
  if (!waiting) return eff;
  const def = cfgDefs()[r] || {};
  const o = { ...eff };
  for (const f of cfgRowFields(r)) {
    if (def.kind === 'shown') o[f] = [...(def.opts || [])];
    else if (def.kind === 'multi') o[f] = [];
    else if (def.kind === 'set') o[f] = false;
    else if (def.kind === 'look') o[f] = '';
    else delete o[f];
  }
  return o;
}
/** One field's current value as the row is SHOWING it — the empty slate while it waits. */
function shCur(f) {
  const r = shRowOf(f);
  return shRowEff(r, shEff(), shRowWaiting(r))[f];
}
function shRowHtml(r, def, eff0) {
  const waiting = shRowWaiting(r);
  const eff = shRowEff(r, eff0, waiting);
  const na = def.na ? def.na(eff) : '';
  const tall = SH_STACK.includes(def.kind);
  const parked = shRowParked(r);
  return `
    <div class="sh-row cfg${shRowChg(r) ? ' own' : ''}${na ? ' na' : ''}${parked ? ' parked' : ''}${tall ? ' tall' : ''}${
      waiting ? ' unset' : ''}${waiting && SH.err ? ' needs' : ''}" data-r="${r}"${na ? ` title="${esc(na)}"` : ''}>
      <span class="sh-l"${def.hint ? ` title="${esc(def.hint)}"` : ''}>${esc(def.l)}</span>
      <span class="sh-c">${cfgCtlHtml(r, def, eff, na, SH_H, { unset: waiting, pair: true, compact: def.kind === 'shown' })}</span>
      ${shTailHtml(r, waiting, parked)}
    </div>`;
}
// WHOSE ANSWER IS THIS. On the default there is no question, so there is no tail. On a
// config a row either follows the default — said quietly, where the way back would be — or
// is the config's own, and then `Follow default` is the one way it leaves.
// ONE CONTROL PER KIND, off the SAME `cfgDefs()` the cards read — so no two surfaces can
// drift on a vocabulary, a default or a refusal.
// WHO RECEIVES THE ANSWER (14 Sep). Three sheets draw these controls — this page's, the
// cohort sheet and the master-detail sheet — and they keep their drafts in three different
// places. `h` is the receiver: one verb per way a control can be written to, each returning
// the inline-handler STRING for the element it is wired to (`pick` alone returns a real
// function, because our select takes one). A kind gained here is gained by all of them.
// `o.compact` is the PAGE's cut of the two controls that are taller than a line (14 Sep,
// fifth cut): the same data operations, drawn for a column rather than for a modal — the
// stage smaller, the nine controls a strip of glyphs instead of a grid of labelled tiles.
// `o.unset` is the one state a sheet needs and a page never does (15 Sep): a setting somebody
// has PICKED and not yet answered. It is the same control with nothing in it, built from the
// same primitives so the two states cannot look like different products — and a switch is
// never one of them, because a switch has to stand somewhere and where it stands reads as an
// answer. On/off becomes an explicit pair for as long as the question is open.
function cfgCtlHtml(r, def, eff, na, h, o = {}) {
  const v = eff[r];
  const lit = x => (typeof x === 'string' ? `'${x}'` : x);
  if (o.unset) {
    switch (def.kind) {
      case 'bool':
        return accSeg(undefined, ['yes', 'no'], ['Yes', 'No'], x => h.set(r, x === 'yes'), na);
      // (`pair` below keeps that same control once the row is answered, so nothing on a row
      // changes shape the moment somebody answers it.)
      case 'enum':
        if (def.opts.length > 3) {
          return selectHtml(undefined, def.opts.map((x, ix) => ({ v: x, label: def.words[ix] })),
            h.pick(r), { ph: 'Choose a value…' });
        }
        return accSeg(undefined, def.opts, def.words, x => h.set(r, lit(x)), na,
          x => (def.whyFor ? def.whyFor(x) : ''));
      case 'num':
        return `<div class="num-wrap"><input value="" inputmode="numeric"
          oninput="${h.num(r)}"><span class="unit">${esc(def.unit || '')}</span></div>`;
      // A timing is a switch and a number, so unanswered the SWITCH is the question: Off
      // writes the zero, On opens the box at a real value.
      // WHICH value is the caller's to know (`o.onValue`, 15 Sep). On one surface the setting's
      // own default is right. On a COHORT it is not: a selection already holding 3s everywhere
      // should not be handed 5s the moment somebody switches it on — that is the platform
      // inventing a number nobody chose. A caller that has a counted answer passes it.
      case 'ms': case 'pct': {
        const on = o.onValue ?? def.dflt ?? (def.kind === 'ms' ? 5000 : 50);
        return accSeg(undefined, ['off', 'on'], ['Off', 'On'], x => h.set(r, x === 'off' ? 0 : on), na);
      }
      // THE FOUR WITH NO EMPTY STATE FALL THROUGH TO THEIR OWN CONTROL (15 Sep). A grid of nine
      // glyphs, a strip of speeds, three chips and a pair of colours cannot be drawn "blank" —
      // and drawing them as the `default:` text box below, which is what happened for an hour,
      // turns four rich controls into four empty inputs that answer nothing. They draw normally,
      // from the value the CALLER hands them, which for a waiting row is nothing at all
      // (`shRowEff` strips it) — so no default leaks in, and the row stays refusable until it is
      // touched. The row wears the waiting state instead (`.sh-row.unset`).
      case 'look': case 'shown': case 'multi': case 'set':
        break;
      default:
        return `<span class="rule-text"><input class="mono" value="" placeholder="${esc(def.ph || '')}"
          spellcheck="false" oninput="${h.text(r)}"></span>`;
    }
  }
  switch (def.kind) {
    case 'bool': {
      const on = (v ?? def.dflt) === true;
      // ON A SHEET, YES/NO IS A PAIR, NOT A SWITCH (`o.pair`). A switch has to stand somewhere,
      // and where it stands reads as an answer — fine on the page, where every row HAS one, and
      // wrong on a sheet where a row can be an open question. The pair also means the control
      // does not change shape at the moment it is answered.
      if (o.pair) return accSeg(on ? 'yes' : 'no', ['yes', 'no'], ['Yes', 'No'], x => h.set(r, x === 'yes'), na);
      return `<span class="toggle tiny${on ? ' on' : ''}" onclick="${h.set(r, !on)}"><span class="track"></span></span>`;
    }
    case 'enum': {
      const cur = v ?? def.dflt;
      if (def.opts.length > 3) {
        return selectHtml(cur, def.opts.map((o, ix) => ({ v: o, label: def.words[ix] })), h.pick(r));
      }
      return accSeg(cur, def.opts, def.words, o => h.set(r, lit(o)), na,
        o => (def.whyFor ? def.whyFor(o) : ''));
    }
    case 'num':
      return `<div class="num-wrap"><input value="${esc(String(v ?? def.dflt))}" inputmode="numeric"
        oninput="${h.num(r)}"><span class="unit">${esc(def.unit || '')}</span></div>`;
    case 'ms': case 'pct': {
      const cur = v ?? (def.kind === 'ms' ? def.dflt : 0);
      const on = cur > 0;
      const txt = on ? String(def.kind === 'ms' ? cur / 1000 : cur) : '';
      return `<span class="toggle tiny${on ? ' on' : ''}" onclick="${h.zero(r, def.dflt)}"><span class="track"></span></span>
        <div class="num-wrap${on ? '' : ' off'}"><input value="${esc(txt)}" inputmode="decimal" ${on ? '' : 'disabled'}
          oninput="${def.kind === 'ms' ? h.ms(r) : h.num(r)}"><span class="unit">${def.kind === 'ms' ? 'sec' : '%'}</span></div>`;
    }
    // SHOWN IS `multi` READ THE OTHER WAY UP. The data operation is identical — toggle this
    // member in `hiddenControls` — so it rides the same `chip` verb and works in all three
    // sheets; only the LIT state is inverted, and that is a question for the renderer, not
    // for the draft underneath.
    case 'shown': {
      const hidden = (v || []).map(String);
      // RETIRED 15 Sep (user call — *"`All 9 controls shown` — remove this text"*): the counted
      // line under the controls. Nine glyphs, lit or not, ARE the count — reading it back in
      // words underneath was the screen describing itself.
      // THE STRIP: one glyph per control, lit when the viewer gets it, named on hover. The
      // grid's labels are what makes it a checklist, and a column has no room for them — but
      // a player's controls are things a viewer SEES, so the glyphs alone still read.
      if (o.compact) {
        return `<span class="cfg-shown sm">
        <span class="cfg-strip">${def.opts.map(x => {
          const on = !hidden.includes(String(x));
          return `<button type="button" class="cfg-ico${on ? ' on' : ''}"${na ? ' disabled' : ''}
            aria-pressed="${on}" aria-label="${esc(def.wordOf(x))}" title="${esc(on ? `${def.wordOf(x)} — the viewer gets it. Click to take it away.` : `${def.wordOf(x)} — hidden from the viewer. Click to give it back.`)}"
            onclick="${h.chip(r, lit(x))}">${cfgIcon(x)}</button>`;
        }).join('')}</span>
      </span>`;
      }
      return `<span class="cfg-shown">
        <span class="cfg-grid">${def.opts.map(o => {
          const on = !hidden.includes(String(o));
          return `<button type="button" class="cfg-tile${on ? ' on' : ''}"${na ? ' disabled' : ''}
            aria-pressed="${on}" title="${esc(on ? `${def.wordOf(o)} — the viewer gets it. Click to take it away.` : `${def.wordOf(o)} — hidden from the viewer. Click to give it back.`)}"
            onclick="${h.chip(r, lit(o))}">${cfgIcon(o)}<span class="cfg-tile-l">${esc(def.wordOf(o))}</span><i class="cfg-tick"></i></button>`;
        }).join('')}</span>
      </span>`;
    }
    case 'multi': {
      const cur = (v || []).map(String);
      return `<span class="cfg-chips">${def.opts.map(o => {
        const on = cur.includes(String(o));
        const locked = def.keep !== undefined && String(o) === String(def.keep);
        return `<button type="button" class="cfg-chip${on ? ' on' : ''}${locked ? ' lock' : ''}"${na ? ' disabled' : ''}${
          locked ? ` title="${esc('Always offered — a viewer must be able to return to normal speed')}"` : ''
        } onclick="${h.chip(r, lit(o))}">${esc(def.wordOf(o))}</button>`;
      }).join('')}</span>`;
    }
    case 'set':
      return `<span class="cfg-chips">${def.fs.map((f, ix) => {
        const on = (eff[f] ?? true) === true;
        return `<button type="button" class="cfg-chip${on ? ' on' : ''}" onclick="${h.set(f, !on)}">${esc(def.words[ix])}</button>`;
      }).join('')}</span>`;
    case 'look':
      return `<span class="cfg-look${o.compact ? ' sm' : ''}">
        ${cfgColorFieldHtml('Brand', 'brandColor', eff.brandColor, h)}
        ${cfgColorFieldHtml('Text', 'textColor', eff.textColor, h)}
        <span class="cfg-lf cfg-lf-wide">
          <i>Logo</i>
          <span class="rule-text cfg-lf-url"><input class="mono" value="${esc(eff.logoUrl || '')}" placeholder="https://…"
            spellcheck="false" oninput="${h.text('logoUrl')}"></span>
        </span>
      </span>`;
    default:
      return `<span class="rule-text"><input class="mono" value="${esc(v || '')}" placeholder="${esc(def.ph || '')}"
        spellcheck="false" oninput="${h.text(r)}"></span>`;
  }
}

// THE PAGE SHEET'S OWN RECEIVER — every verb points at `SH`, so nothing about the
// integration page's sheet moved when the control renderer learnt to serve three drafts.
const SH_H = {
  set: (f, v) => `shSet('${f}', ${v})`,
  chip: (f, v) => `shChip('${f}', ${v})`,
  zero: (f, d) => `shZero('${f}', ${d})`,
  num: f => `shNum(this, '${f}')`,
  ms: f => `shMs(this, '${f}')`,
  text: f => `shText(this, '${f}')`,
  color: f => `shColor(this, '${f}')`,
  hex: f => `shHex(this, '${f}')`,
  repaint: () => 'shRender()',
  pick: f => (x => shSet(f, x)),
};

// A DISCRETE PICK REPAINTS the sheet — a seg, a chip, a switch, a menu; none holds a caret.
// TYPING NEVER DOES, or the caret goes with it: the row is marked as this config's own in
// place instead, along with the counts that watch it.
function shSet(f, v) { if (!SH) return; shPut(f, v); shRender(); }
function shChip(f, o) {
  if (!SH) return;
  const def = cfgDefs()[f];
  // FROM THE SLATE THE ROW IS SHOWING, not from the default underneath it. On a row still waiting
  // the two are different — the screen shows an empty set, `shEff()` would hand back the default's
  // — and a first click computed against the wrong one lands the opposite of what was clicked.
  const cur = shCur(f) || [];
  const has = cur.some(x => String(x) === String(o));
  if (has && def.keep !== undefined && String(o) === String(def.keep)) return;
  shPut(f, has ? cur.filter(x => String(x) !== String(o)) : [...cur, o]);
  shRender();
}
// A timing or a threshold of 0 means OFF, so it is a switch and a number rather than a zero
// somebody has to know the meaning of. The last real value is kept while the switch is off.
const SH_LAST = {};
function shZero(f, dflt) {
  if (!SH) return;
  const cur = shEff()[f] ?? 0;
  if (cur > 0) { SH_LAST[f] = cur; shPut(f, 0); } else shPut(f, SH_LAST[f] || dflt);
  shRender();
}
function shNum(el, f) { if (!SH) return; const n = Number(el.value); if (Number.isFinite(n)) shPut(f, n); shMark(el); }
function shMs(el, f) { if (!SH) return; const n = Number(el.value); shPut(f, Number.isFinite(n) ? Math.round(n * 1000) : 0); shMark(el); }
function shText(el, f) { if (!SH) return; shPut(f, el.value); shMark(el); }

// THE COLOUR FIELD. The picker fires `input` continuously while the pointer moves, and every
// one of those updates the swatch and the hex beside it IN PLACE — never a repaint, which is
// what used to destroy the very input the picker was anchored to and shut it mid-drag
// (13 Sep, user call). `change`, the picker closing, repaints.
function shColor(el, f) {
  if (!SH) return;
  shPut(f, el.value);
  el.closest('.cfg-sw').style.background = el.value;
  const hex = el.closest('.cfg-lf')?.querySelector('.cfg-hex');
  if (hex) hex.value = el.value;
  shMark(el);
}
function shHex(el, f) {
  if (!SH) return;
  const v = el.value.trim();
  shPut(f, v);
  if (cfgHexOk(v)) {
    const sw = el.closest('.cfg-lf')?.querySelector('.cfg-sw');
    if (sw) { sw.style.background = v; sw.querySelector('input').value = pbHex6(v); }
  }
  shMark(el);
}

// THE ACT ROW IS THE JOURNEY (14 Sep, user call — *"when a user changes anything there is no
// clear journey, currently there is only a Done button irrespective"*). One button reading the
// same whether you have moved nothing or nine things says nothing about where you are: it is a
// lid, not a decision, and a Cancel standing beside it on an untouched sheet is an offer to
// undo nothing. The row states its position instead.
//   NOTHING MOVED     one way out, called Close, because nothing is being kept.
//   SOMETHING MOVED   two ways out, and the one that lands names what it lands —
//                     `Apply 3 changes` — beside a Cancel that is now worth having.
//   A NEW CONFIG      always the pair: nothing exists until it is created.
// RETIRED 15 Sep (user call — *"remove this follow default from everything in the modal of
// custom config"*): the `Follow the default for everything` button. Dropping every override in
// one click is a rare act on a sheet whose whole body is the overrides — and the row's own ×
// already takes one off, one at a time, which is how they were put on. The act stays on the
// card's ⋯ menu, where the config can be emptied without opening it.
function shFootHtml() {
  const n = shChangeCount();
  const waiting = SH.pending.size;
  const isNew = SH.mode === 'new';
  return `
    <div class="dlg-foot sh-foot">
      <span class="eh-gap"></span>
      ${n || waiting || isNew ? '<button type="button" class="btn ghost" onclick="shCancel()">Cancel</button>' : ''}
      <button type="button" class="btn" onclick="shDone()">${isNew
        ? 'Create config'
        : (n ? `Apply ${n} change${n === 1 ? '' : 's'}` : (waiting ? 'Apply' : 'Close'))}</button>
      ${shFootMenuHtml()}
    </div>`;
}

// Written in place while somebody types, because a repaint would take the caret with it.
// Nothing in the act row holds one, so it can be swapped whole.
function shFootSync() {
  const foot = dialogRoot().querySelector('.sh-foot');
  if (foot) foot.outerHTML = shFootHtml();
}
function shHeadSync() {
  const sub = dialogRoot().querySelector('.sh-sub');
  if (!sub) return;
  const t = SH.err || '';
  sub.hidden = !t;
  sub.textContent = t;
}

function shMark(el) {
  const row = el.closest('.sh-row');
  if (row) {
    row.classList.toggle('own', shRowChg(row.dataset.r));
    // The default's word beside a typed answer follows it in place — a repaint here would
    // take the caret with it. The tail holds no caret, so it is swapped whole.
    // (`shMark` also serves the page's own rows through `pgMark`, which keeps its own copy.)
    const tail = row.querySelector('.sh-tail');
    if (tail) tail.outerHTML = shTailHtml(row.dataset.r, cfgDefs()[row.dataset.r]);
  }
  shHeadSync();
  shFootSync();
}

// RETIRED 15 Sep with the button that called it: `shFollowAll`. Emptying a config in one act
// lives on the card's ⋯ (`pcFollowAll`), where it can be done without opening the sheet; inside
// the sheet, a row leaves the way it arrived — one × at a time.

// ---------- the key ----------
// THE TITLE IS ITS OWN RENAME FIELD — the shape the ad setup's placement tabs already use.
// One field serves a new config and an existing one; the only difference is where the name
// is written and when it is checked. The key is refused IN PLACE by the same three rules
// the server holds it to, and the field keeps what was typed: this panel never empties a
// box to tell somebody it was wrong.
function shKeyIn(el) {
  if (!SH) return;
  SH.draft.name = el.value;
  clearErr('playerConfigs');
  if (SH.err) {
    SH.err = '';
    const w = dialogRoot().querySelector('.sh-head');
    if (w) w.classList.remove('err');
  }
  shHeadSync();
}
// A rename is checked when the field is left, in place — never by repainting under a caret.
function shKeyOut(el) {
  if (!SH || SH.mode !== 'config') return;
  const v = (el.value || '').trim();
  el.value = v;
  SH.draft.name = v;
  shKeyPaint(pcKeyWhy(v, SH.i));
}
function shKeyPaint(why) {
  SH.err = why;
  const w = dialogRoot().querySelector('.sh-head');
  if (!w) return;
  w.classList.toggle('err', !!why);
  shHeadSync();
}

// A stray click on the veil, like Escape, must not cost a sheet somebody has filled in — so
// both ask, and only when there is something to lose. The Cancel BUTTON does not ask: it was
// aimed at.
function shVeil(e) {
  if (!isVeilClick(e) || !SH) return;
  shBail();
}

document.addEventListener('keydown', e => {
  if (e.key !== 'Escape' || !SH) return;
  // The picker is the innermost thing open, so Escape is its before it is the sheet's.
  if (SH.pickOpen) { SH.pickOpen = false; shRender(); return; }
  if (document.querySelector('.select.open, .rmenu.open')) return;
  // Every dialog here shares one root: while a confirm stands over the sheet, Escape is the
  // confirm's, not the sheet's.
  if (!dialogRoot().querySelector('.dlg.sh')) return;
  shBail();
});

// ---------- a config's own acts ----------
function pcSet(i, f, val) {
  const c = (FORM.data.playerConfigs || [])[i];
  if (!c) return;
  c[f] = val;
  clearErr('playerConfigs');
  FORM.rerender();
}

async function pcRemove(i) {
  const c = (FORM.data.playerConfigs || [])[i];
  if (!c) return;
  // ONE WORD FOR ONE ACT. The menu that reaches this says Delete, so the confirm does too — a
  // door labelled Delete that asks "Remove?" makes a person stop and check they clicked the
  // right thing, on the one act where stopping to check is least welcome.
  const ok = await ask({
    title: `Delete “${c.name}”?`,
    body: 'Players asking for it fall back to the default from the next publish.',
    okLabel: 'Delete', danger: true,
  });
  if (!ok) return;
  FORM.data.playerConfigs.splice(i, 1);
  clearErr('playerConfigs');
  FORM.rerender();
}

// Every override dropped in one act — the ⋯'s one non-destructive item. The config stays,
// keyed and switched; players asking for it get the default from the next publish. Asked
// first, because it is many decisions undone in one click.
// RETIRED 15 Sep with the menu item that was its only caller (see `shRemove` above):
// `pcFollowAll`. Unticking a section in the sheet's rail is the same act, in plain sight.

// The three rules the SERVER holds a key to, said here first so a mistake is caught where it
// was made. `i` is the config's own index, or -1 while it is still being created.
function pcKeyWhy(v, i) {
  if (!v) return 'A config needs a key — one word a player can ask for';
  if (!/^[A-Za-z0-9_-]{1,24}$/.test(v)) return 'A key is one word — letters, digits, - or _';
  if (v.toLowerCase() === 'default') return '“default” is the player’s own — pick another key';
  if ((FORM.data.playerConfigs || []).some((c, j) => j !== i && (c.name || '').trim().toLowerCase() === v.toLowerCase())) return `“${v}” is already here`;
  return '';
}

// A new integration starts from a player preset — a photocopy, never a link. Picking another
// RESTARTS the default from that shape, so when the default has already been moved off the
// current one it asks first (every act that discards work does) and names what goes; a
// default nobody has touched restamps quietly, and the seed moves with it so the card and
// the review keep measuring against the shape actually chosen.
async function stampPreset(name) {
  const pp = KL_META.playerPresets.find(p => p.name === name);
  if (!pp) return;
  const moved = pcMovedFields();
  if (moved.length) {
    const n = moved.length;
    const ok = await ask({
      title: name === FORM.data.presetName ? `Start again from ${name}?` : `Start from ${name} instead?`,
      body: `Your ${n} change${n === 1 ? '' : 's'} to the default ${n === 1 ? 'is' : 'are'} replaced by ${esc(name)}’s settings.`,
      okLabel: `Start from ${name}`,
    });
    // The select already shows the pick; a No paints the shape still standing back into it.
    if (!ok) { FORM.rerender(); return; }
  } else if (name === FORM.data.presetName) {
    return;
  }
  FORM.data.presetName = name;
  FORM.data.player = deepCopy(pp.values);
  FORM.data.playerSeed = deepCopy(pp.values);
  FORM.rerender();
}
