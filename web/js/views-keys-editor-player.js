// views-keys-editor-player.js — the integration page's PLAYER CONFIG: a row of CARDS,
// each opening a SHEET that discloses its settings in layers.
//
// THE THREE SECTIONS (11 Sep, user call; docs/PLAYER-LEVERS.xlsx is the record of why).
//
//   1 Playback                how the video plays
//   2 Controls & appearance   what the viewer sees and can touch
//   3 Analytics & measurement what is reported, and to whom
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
  // SEE IT, THEN PICK IT (14 Sep, user call — *"the controls and appearance can be treated in
  // a more clean and intuitive and sleek way"*). The order is the sentence the section is:
  // how many controls at all → what the player LOOKS like → which controls exactly. The
  // preview sits between the two so every answer under it is visible the moment it is given.
  { k: 'look', name: 'Controls & appearance', short: 'Controls',
    lead: ['controlsMode', 'appearance', 'hiddenControls'],
    more: ['playbackRates', 'controlsAutoHideMs'] },
  { k: 'measure', name: 'Analytics & measurement', short: 'Analytics',
    lead: ['analyticsLevel', 'viewAfterMs', 'heartbeatMs'],
    more: ['comscoreId', 'nielsenId', 'gaId'] },
];

// ---------- WHAT A COHORT MAY ANSWER (14 Sep, user call) ----------
// ONE SHORT LIST, AND NOTHING BEHIND A DOOR (14 Sep, second cut, user call — *"let's drop
// Change default player behaviour and Custom player behaviour and have a Player behaviour
// which will have options to control a few fields"*). The morning's cut sorted all
// twenty-nine player settings into a front row, a counted door and a refusal list; the
// answer is simpler than the sort. A cohort act is for the handful of things a team really
// does decide for a whole estate at once, and everything else belongs to the surface that
// owns it — where the integration page already draws the whole catalogue, its default and
// its custom configs alike. So the sheet is these five, flat: no fold to open, and no
// second sheet beside it.
// They are all Playback facts, which is why the sheet carries no section headings — one
// list of five is not three groups of two.
const BULK_ROWS = ['autoplay', 'passiveVolume', 'playback', 'loop', 'expandInMini'];
// THE SEAM IS WIDER THAN THE SHEET, ON PURPOSE. `BULK_PLAYER_FIELDS` still accepts the whole
// player behaviour card and refuses by name the four a single surface owns (Player type,
// Redirect URL, Quality, Fallback media — `BULK_NEVER_FIELDS`, carried on `/panel/meta`).
// A sixth row here is a line of code rather than a release, and a wrong blanket write is
// refused whatever draws it.

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
    remembers: { l: 'Remembers', kind: 'set', fs: CFG_REMEMBER, words: ['Volume', 'Audio language', 'Captions'],
      hint: 'What a returning viewer keeps from last time' },
    playbackMode: { l: 'Player type', ...en('playbackMode', m.playbackModes || ['inline'], 'inline') },
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
    controlsMode: { l: 'Controls', ...en('controlsMode', m.controlsModes || ['full', 'minimal', 'none'], 'full') },
    // STORED AS WHAT IS HIDDEN, ASKED AS WHAT IS SHOWN. The wire's field is `hideControls`
    // and it stays that way, but a lit chip meaning "this one is GONE" is backwards from
    // every mental model a person brings — so the control is drawn the other way up, and
    // the inversion happens at ONE SEAM — the `shown` control renderer — rather than in
    // anyone's head.
    hiddenControls: { l: 'Player controls', kind: 'shown', opts: m.playerControls || [], wordOf: o => w('playerControl', o), na: noCtl },
    playbackRates: { l: 'Speeds', kind: 'multi', opts: m.playbackRates || [0.5, 1, 1.25, 1.5, 2], wordOf: o => `${o}×`, keep: 1, na: noCtl },
    controlsAutoHideMs: { l: 'Hide controls after', kind: 'ms', dflt: 5000, na: noCtl },
    appearance: { l: 'Appearance', kind: 'look', fs: CFG_LOOK },
    analyticsLevel: { l: 'Events reported', ...en('analyticsLevel', m.analyticsLevels || [1, 2, 3], 3) },
    viewAfterMs: { l: 'A view counts after', kind: 'ms', dflt: 3000 },
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
// One colour: the swatch IS the picker (a native input at zero opacity over it — the one
// place this panel takes the platform's control, because nothing drawn beats the OS's wheel),
// the hex beside it typeable so a brand value can be pasted rather than hunted for.
function cfgColorFieldHtml(l, f, v, h) {
  return `<span class="cfg-lf">
    <i>${esc(l)}</i>
    <span class="cfg-sw" style="background:${cfgHexOk(v) ? esc(v) : '#ffffff'}" title="Pick a colour">
      <input type="color" value="${esc(pbHex6(cfgHexOk(v) ? v : '#ffffff'))}" oninput="${h.color(f)}" onchange="${h.repaint()}" aria-label="Pick ${esc(l.toLowerCase())} colour">
    </span>
    <span class="rule-text cfg-lf-hex"><input class="mono" value="${esc(v || '')}" placeholder="#000000" spellcheck="false" oninput="${h.hex(f)}"></span>
  </span>`;
}
// The native picker only accepts #rrggbb, so a three-digit brand value is widened for it.
function pbHex6(v) {
  const m = /^#([0-9a-f]{3})$/i.exec(v || '');
  return m ? '#' + m[1].split('').map(c => c + c).join('') : (v || '#ffffff');
}
// THE PAIR IS PREVIEWED TOGETHER — text on brand, "Aa" — because the two colours are one
// decision seen once, and a contrast that fails is visible where it is chosen rather than
// on a player at a publisher. Warned, never blocked (WCAG's 3:1 for large text).
function pbContrast(bg, fg) {
  const lum = hex => {
    const h = pbHex6(hex).slice(1);
    const c = [0, 2, 4].map(i => parseInt(h.slice(i, i + 2), 16) / 255)
      .map(x => (x <= 0.03928 ? x / 12.92 : ((x + 0.055) / 1.055) ** 2.4));
    return 0.2126 * c[0] + 0.7152 * c[1] + 0.0722 * c[2];
  };
  const a = lum(bg), b = lum(fg);
  return (Math.max(a, b) + 0.05) / (Math.min(a, b) + 0.05);
}
// ONE STAGE FOR THE THREE. A frame standing in for the video, the logo where it will sit, a
// progress bar in the brand colour and a button carrying the text colour ON the brand — which
// is the pair the contrast rule is about. Warned, never blocked (WCAG's 3:1 for large text).
// ONE STAGE FOR THE WHOLE SECTION. It answers the only question this group is really
// asked: what will the viewer see? The logo where it sits, the brand colour behind a play
// button drawn in the TEXT colour — the pair the contrast rule is about — and a control bar
// carrying exactly the controls that are served, so hiding one is visible the moment it is
// hidden. Controls set to None draws no bar at all, which is the honest preview of that
// answer.
const CFG_BAR_RIGHT = ['volume', 'captions', 'quality', 'speed', 'pip', 'share', 'fullscreen'];
function cfgStageHtml(eff) {
  const brand = cfgHexOk(eff.brandColor) ? eff.brandColor : '#c8ccd6';
  const text = cfgHexOk(eff.textColor) ? eff.textColor : '#ffffff';
  const logo = (eff.logoUrl || '').trim();
  const ratio = pbContrast(brand, text);
  const low = ratio < 3;
  const none = (eff.controlsMode ?? 'full') === 'none';
  const hidden = (eff.hiddenControls || []).map(String);
  const on = id => !hidden.includes(id);
  const bar = `
        <span class="cfg-stage-bar" style="color:${esc(text)}">
          ${on('play') ? cfgIcon('play', 'b') : ''}
          ${on('progress')
            ? `<span class="cfg-stage-track"><i style="background:${esc(brand)}"></i></span>`
            : '<span class="cfg-stage-gap"></span>'}
          ${CFG_BAR_RIGHT.filter(on).map(id => cfgIcon(id, 'b')).join('')}
        </span>`;
  return `
    <span class="cfg-stage">
      ${logo
        ? `<img class="cfg-stage-logo" src="${esc(logo)}" alt="" onerror="this.classList.add('dead')">`
        : '<span class="cfg-stage-nologo">no logo</span>'}
      <span class="cfg-stage-play" style="background:${esc(brand)};color:${esc(text)}">${cfgIcon('play')}</span>
      ${none ? '<span class="cfg-stage-nobar">No controls drawn</span>' : bar}
    </span>
    <span class="cfg-stage-note${low ? ' low' : ''}" title="${esc('Text on brand — WCAG asks 3:1 for large text')}">Text on brand ${ratio.toFixed(1)}:1${low ? ' · low' : ''}</span>`;
}

// ---------- LEVEL 1 · THE CARDS ----------
// The default first, then a card per config, then the one that makes another.
function playerCardHtml() {
  const cfgs = FORM.data.playerConfigs || [];
  const max = KL_META.maxPlayerConfigs || 6;
  return `
    <div class="fieldset pcw">
      ${FORM.errors.playerConfigs ? `<div class="banner bad" data-err-for="playerConfigs">${esc(FORM.errors.playerConfigs)}</div>` : ''}
      <div class="fieldset-title-row">
        <div class="fieldset-title">Player config</div>
        ${pcTitleRightHtml(cfgs.length, max)}
      </div>
      <div class="pc-grid">
        ${pcDefaultCardHtml()}
        ${cfgs.map(pcCardHtml).join('')}
        ${cfgs.length < max ? `
          <button type="button" class="pc-card pc-new" onclick="shOpenNew()">
            <span class="pc-plus">+</span>
            <span class="pc-newt">New config</span>
            <span class="pc-newh">A player asks for it by key</span>
          </button>` : ''}
      </div>
    </div>`;
}

// WHAT A CARD IS ACTUALLY FOR (14 Sep, user call — *"I don't find any value in showing those
// 4 rows, autoplay, passive volume etc — remove them, make the cards more clean and sleek,
// and add some other meta which could be relevant for the user to see at first glance"*).
// Four raw lever values were a card answering a question nobody asks a LIST: nobody chooses
// between configs by comparing their passive volume, and four labels repeated down a row of
// cards read as a table that had lost its header. A list is scanned for WHICH one and WHAT
// KIND — so each card carries the one line only it can say:
//   · a custom config — WHERE its overrides land (`Playback 2 · Controls 1`): its character
//     in four words, every field named on hover, the sheet one click away for the values;
//   · the default — HOW MANY configs build on it, which is the blast radius of opening the
//     thing every player falls back to, and the fact you want before you touch it.
// A SENTENCE, NOT AN ARITHMETIC (14 Sep, user call — *"the cards are sounding a bit odd now,
// can we mature it — and what is this count in them? That's totally not needed and is making
// the user confused"*). `Playback 2 · Controls 1` is a number whose denominator is invisible:
// two out of what? It reads as a score, and a score invites comparing cards that are not in
// competition. A card is picked, not measured — so it says WHAT KIND of thing it is, in
// words, and the exact fields stay on hover for anyone who wants them.
function pcCovers(c) {
  return CFG_SECTIONS
    .filter(sec => cfgSecFields(sec).some(f => c[f] !== undefined))
    .map(sec => sec.short.toLowerCase());
}
// `playback` · `playback and controls` · `playback, controls and analytics`
function pcAnd(words) {
  if (words.length < 2) return words[0] || '';
  return `${words.slice(0, -1).join(', ')} and ${words[words.length - 1]}`;
}

// THE PRESET RIDES THE CARD IT SEEDS (14 Sep, user call — *"accommodate this default player
// config when user creates a new integration in a clean and intuitive and mature way"*).
// A blank integration's default player is a photocopy of one of three starting shapes, and
// the select that picked the shape sat in DETAILS between Platform and Domains — an identity
// row deciding a player fact, two cards away from the card it decided, with nothing on that
// card saying where its values had come from. Meanwhile the card said the same sentence on
// a fresh surface as on a live one, an edit to the default left no trace on it, and picking
// another preset silently threw the edit away.
//   · The preset is the Player config card's own title-row strip now — the grammar the Ad
//     behaviour card below already uses for its ad setup: eyebrow, then the decision as a
//     control. It exists only while creating BLANK: a copy is seeded by its source, and an
//     existing surface has no preset left to pick (a preset stamps, it never links).
//   · The Default card names its seed (`VideoShow preset` · `Copy of “TOI Mweb”`) and,
//     once the sheet has landed a change, counts it (`· 3 changed`, every field named on
//     hover) and wears the panel's change bar — the same mark the sheet head uses, measured
//     against the only baseline a surface that does not exist yet has.
//   · Re-picking a preset with changes on the default ASKS first, naming what goes.
//   · The create review reads the seed once, then only what moved (views-keys-editor-frame).
function pcPresetLive() { return !KEY_ORIGINAL && !!FORM.data.presetName; }
function pcTitleRightHtml(n, max) {
  const count = n ? `<span class="pcw-k">${n} custom of ${max}</span>` : '';
  if (!pcPresetLive()) return count || '<span class="pcw-k">no custom configs</span>';
  return `
    <div class="fills-strip pc-preset">
      <span class="fs-l">Preset</span>
      ${selectHtml(FORM.data.presetName, KL_META.playerPresets.map(p => ({ v: p.name, label: p.name })), v => stampPreset(v))}
      ${count}
    </div>`;
}
// Where the default started, in words — null once the surface exists (its baseline is then
// the last save, and the card's fact is what builds on it).
function pcBorn() {
  if (KEY_ORIGINAL) return null;
  if (FORM.data.presetName) return `${FORM.data.presetName} preset`;
  if (FORM.data.copiedFrom) return `Copy of “${FORM.data.copiedFrom}”`;
  return null;
}
// The default's fields that no longer read as the seed does. Lists compare as sets — the
// controls grid toggles membership, and a different order is not a different answer.
function pcMovedFields() {
  const seed = FORM.data.playerSeed;
  if (KEY_ORIGINAL || !seed) return [];
  const p = FORM.data.player || {};
  const canon = v => JSON.stringify(Array.isArray(v) ? [...v].map(String).sort() : (v ?? null));
  return cfgFields().filter(f => canon(p[f]) !== canon(seed[f]));
}

function pcDefaultCardHtml() {
  const born = pcBorn();
  const moved = born ? pcMovedFields() : [];
  const dirty = born
    ? moved.length > 0
    : !!FORM.saved && JSON.stringify(FORM.data.player ?? null) !== JSON.stringify(FORM.saved.player ?? null);
  return `
    <div class="pc-card pc-dflt${chgIf(dirty)}" tabindex="0" role="button"
      title="Open the default player config" onclick="shOpenDefault()" onkeydown="pcKey(event, this)">
      <div class="pc-top"><span class="pc-name">Default</span></div>
      <div class="pc-meta"${moved.length ? ` title="${esc(moved.map(cfgFieldLabel).join(', '))}"` : ''}>
        ${born
          ? `<span class="pc-say">${esc(born)}</span>${moved.length ? `<span class="pc-moved">${moved.length} changed</span>` : ''}`
          : '<span class="pc-say">Used unless a config overrides it</span>'}
      </div>
    </div>`;
}

function pcCardHtml(c, i) {
  const off = c.on === false;
  const ov = cfgFields().filter(f => c[f] !== undefined);
  const sc = FORM.saved ? (FORM.saved.playerConfigs || [])[i] : c;
  const dirty = !!FORM.saved && JSON.stringify(c) !== JSON.stringify(sc ?? null);
  const covers = pcCovers(c);
  return `
    <div class="pc-card${off ? ' off' : ''}${chgIf(dirty)}" tabindex="0" role="button"
      title="${esc(`Open “${c.name}”`)}" onclick="shOpenConfig(${i})" onkeydown="pcKey(event, this)">
      <div class="pc-top">
        <span class="pc-name mono">${esc(c.name)}</span>
        <span class="pc-acts" onclick="event.stopPropagation()">
          <span class="toggle tiny${off ? '' : ' on'}"
            title="${off ? 'Off — players asking for this key get the default' : 'On — players asking for this key get it'}"
            onclick="pcSet(${i}, 'on', ${off})"><span class="track"></span></span>
          <span class="rmenu">
            <button type="button" class="row-kebab" onclick="rmenuToggle(event, this)" aria-label="More actions">⋯</button>
            <div class="rmenu-list">
              ${ov.length ? `<div class="eh-item" onclick="rmenuShut(this); pcFollowAll(${i})">Follow the default for everything</div>` : ''}
              <div class="eh-item danger" onclick="rmenuShut(this); pcRemove(${i})">Remove config</div>
            </div>
          </span>
        </span>
      </div>
      <div class="pc-meta"${ov.length ? ` title="${esc(ov.map(cfgFieldLabel).join(', '))}"` : ''}>
        ${off ? '<span class="pc-off">Off</span>' : ''}
        <span class="pc-say">${covers.length
          ? `Changes ${esc(pcAnd(covers))}`
          : 'Follows the default'}</span>
      </div>
    </div>`;
}

function pcKey(e, el) {
  if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); el.click(); }
}

// ---------- LEVEL 2 · THE SHEET ----------
// One sheet, three modes: the DEFAULT, an existing CONFIG, or a NEW one.
//
// THE SHEET IS A TRANSACTION (14 Sep, user call — *"the modal has no cancel button, only
// Done — what if I change something? Plus I'm unable to change anything in the default
// config"*). Those are one fault, seen from two sides. The sheet used to write every answer
// straight into the page's draft, so:
//   · there was no way back short of remembering each move and undoing it by hand, and
//   · on the DEFAULT, where no row can ever be an "override", NOTHING on screen
//     acknowledged an answer — no bar, no count, no way back, no act but Done — so a sheet
//     that was in fact writing every keystroke read as a sheet that could not be written to.
// It opens a WORKING COPY now. Every row that has moved since it opened wears the panel's
// change bar, the head counts them, Done lands them and Cancel drops them. One grammar in
// all three modes, and the default finally answers back. Save and Publish are still the only
// gates to the wire; this changes nothing about either.
let SH = null;   // { mode, i, draft, seed, err, all:bool }

const shClone = o => JSON.parse(JSON.stringify(o || {}));

// EVERY SHEET OPENS ON ESSENTIALS. `all` is the one piece of view state the sheet keeps, and
// it is deliberately not remembered between openings: the sheet you get is the sheet the
// person beside you gets.
function shOpenDefault() {
  const p = FORM.data.player || (FORM.data.player = {});
  SH = { mode: 'default', draft: shClone(p), seed: shClone(p), all: false };
  shRender();
}
function shOpenConfig(i) {
  const c = (FORM.data.playerConfigs || [])[i];
  if (!c) return;
  SH = { mode: 'config', i, draft: shClone(c), seed: shClone(c), all: false };
  shRender();
}
function shOpenNew() {
  const max = KL_META.maxPlayerConfigs || 6;
  if ((FORM.data.playerConfigs || []).length >= max) {
    toast(`At most ${max} custom configs per integration`, 'warn');
    return;
  }
  const blank = { name: '', on: true };
  SH = { mode: 'new', draft: shClone(blank), seed: shClone(blank), err: '', all: false };
  shRender();
  requestAnimationFrame(() => dialogRoot().querySelector('.sh-key')?.focus());
}

// DONE LANDS THE WORKING COPY. The page repaints ONCE — here — rather than behind the veil
// on every keystroke of an edit nobody can see happening.
function shDone() {
  if (!SH) return;
  if (SH.mode !== 'default') {
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
  }
  if (SH.mode === 'default') FORM.data.player = SH.draft;
  else if (SH.mode === 'config') FORM.data.playerConfigs[SH.i] = SH.draft;
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

// WHERE THE SHEET READS AND WRITES — the working copy, in every mode.
function shOwn() { return SH ? SH.draft : {}; }
function shEff() {
  const d = FORM.data.player || {};
  if (SH.mode === 'default') return SH.draft;
  const o = { ...d };
  for (const f of cfgFields()) if (SH.draft[f] !== undefined) o[f] = SH.draft[f];
  return o;
}
function shIsOwn(f) { return SH.mode === 'default' ? true : shOwn()[f] !== undefined; }
function shRowOwn(r) { return SH.mode !== 'default' && cfgRowFields(r).some(shIsOwn); }
function shCount() { return SH.mode === 'default' ? 0 : cfgFields().filter(f => shOwn()[f] !== undefined).length; }
// WHAT HAS MOVED SINCE THE SHEET OPENED — the mark the default's sheet never had, and the
// number Cancel would put back. The key counts as a change like any other answer.
function shChanged(f) { return JSON.stringify(SH.draft[f] ?? null) !== JSON.stringify(SH.seed[f] ?? null); }
function shRowChg(r) { return cfgRowFields(r).some(shChanged); }
function shChangeCount() {
  if (!SH) return 0;
  const named = SH.mode !== 'default' && (SH.draft.name || '') !== (SH.seed.name || '');
  return cfgFields().filter(shChanged).length + (named ? 1 : 0);
}
function shPut(f, v) {
  if (!SH) return;
  shOwn()[f] = v;
  clearErr(f);
  clearErr('playerConfigs');
}
function shDrop(f) { if (SH && SH.mode !== 'default') delete shOwn()[f]; }

// ONE SWITCH FOR THE WHOLE SHEET, NOT A DOOR PER SECTION (14 Sep, user call — *"the more
// settings UX/UI is totally non-intuitive, think of something else"*). Three counted links —
// `7 more playback settings`, `2 more control settings`, `3 more measurement settings` — were
// wrong in three ways at once. They looked like FOOTNOTES at the bottom of a list, not like
// containers holding a third of the form. They made you learn a per-section state and keep it
// in your head across a scroll. And they asked you to care about a split that is ours, not
// yours: nobody arrives wanting "the other seven playback settings", they arrive wanting one
// named setting, and a door that counts what it hides cannot tell you whether yours is in
// there.
// The question behind all three is ONE question — *am I setting this surface up, or am I
// looking for something specific?* — so it is one control, in the sheet's head where
// sheet-wide controls belong, named in the two words that answer it. `Essentials` is what a
// surface is actually set up with; `All settings` is the catalogue, in the same order, in the
// same sections. No state to track, no counts to decode, and the section bands stay the only
// structure in the body.
function shAll() { return !!(SH && SH.all); }
function shSetAll(v) {
  if (!SH || SH.all === v) return;
  SH.all = v;
  shRender();
}
// A ROW SOMEBODY HAS ANSWERED IS NEVER HIDDEN. On a config that means an override; on the
// default, a change made in this sheet. Either way a deliberate answer may not sit behind a
// switch somebody has to find first — so Essentials shows it, wherever it lives.
function shRowShown(r) {
  if (shAll()) return true;
  return SH.mode === 'default' ? shRowChg(r) : shRowOwn(r);
}

// A LINE UNDER THE TITLE ONLY WHERE THERE IS SOMETHING TO SAY (14 Sep, user call —
// *"`Every player on this surface, unless it asks for a config by key` — remove this text"*).
// That line was the third telling of one idea: the card said it, the title said it, and then
// a sentence said it again before a single setting appeared. The two remaining lines are
// FACTS, not gloss — how much of this config is its own, or the rule a new key must pass —
// and a refusal replaces whichever stands, so the head never grows a third line.
function shSubText() {
  const total = cfgFields().length;
  if (SH.mode === 'default') return '';
  if (SH.mode === 'new') return 'A player asks for this config by its key — one word, unique on this integration';
  const n = shCount();
  return n
    ? `${n} of ${total} settings are this config’s own · the rest follow the default`
    : `Follows the default in all ${total} settings`;
}

// THE SHEET REPAINTS AS ONE BLOCK, so the scroll position is carried across by hand. Without
// this, choosing an option halfway down threw the reader back to the title — which is what
// made opening `more` feel like a jump to the top.
function shRender() {
  if (!SH) return;
  const was = dialogRoot().querySelector('.sh-body');
  const top = was ? was.scrollTop : 0;
  const eff = shEff();
  const defs = cfgDefs();
  const isNew = SH.mode === 'new';
  // The sheet opens with the name that was clicked — a title that renames itself between the
  // card and the sheet is two objects, not one.
  const name = SH.mode === 'default' ? 'Default' : (SH.draft.name || '');
  const sub = SH.err || shSubText();
  dialogRoot().innerHTML = `
    <div class="dlg-veil" onclick="shVeil(event)"><div class="dlg wide sh">
      <div class="sh-head${SH.err ? ' err' : ''}">
        <div class="sh-title">
          <span class="sh-t">
            ${SH.mode === 'default'
              ? `<h3>${esc(name)}</h3>`
              : `<input class="sh-key mono" value="${esc(SH.draft.name || '')}" placeholder="e.g. shorts" spellcheck="false" maxlength="24"
                  aria-label="Config key" oninput="shKeyIn(this)" ${isNew ? '' : 'onblur="shKeyOut(this)" '}
                  onkeydown="if (event.key === 'Enter') { event.preventDefault(); ${isNew ? 'shDone()' : 'this.blur()'}; }">`}
            <span class="sh-sub"${sub ? '' : ' hidden'}>${esc(sub)}</span>
          </span>
          <span class="seg small sh-scope">
            <button type="button" class="${shAll() ? '' : 'on'}" onclick="shSetAll(false)"
              title="${esc('What a surface is actually set up with')}">Essentials</button>
            <button type="button" class="${shAll() ? 'on' : ''}" onclick="shSetAll(true)"
              title="${esc('Every setting this config can answer')}">All settings</button>
          </span>
        </div>
      </div>
      <div class="dlg-body sh-body${SH.mode === 'default' ? ' plain' : ''}">
        ${CFG_SECTIONS.map(sec => shSecHtml(sec, defs, eff)).join('')}
      </div>
      ${shFootHtml()}
    </div></div>`;
  const body = dialogRoot().querySelector('.sh-body');
  if (body && top) body.scrollTop = top;
}

// LEVEL 2 IS THE LEAD ROWS; LEVEL 3 IS THE REST, counted on the door that opens them.
// A SECTION IS ONE LIST. `lead` comes first and always shows; `more` follows in the same
// list, shown when the sheet is on All settings or when this config has answered that row.
// `showIf` is the one row that exists only when the config it belongs to needs it.
function shSecHtml(sec, defs, eff) {
  const vis = rs => rs.filter(r => !defs[r].showIf || defs[r].showIf(eff));
  const rows = [...vis(sec.lead), ...vis(sec.more).filter(shRowShown)];
  const nOv = SH.mode === 'default' ? 0 : cfgSecFields(sec).filter(shIsOwn).length;
  if (!rows.length) return '';
  return `
    <section class="sh-sec" data-s="${sec.k}">
      <div class="sh-sh">
        <h4>${esc(sec.name)}</h4>
        ${nOv ? `<span class="sh-n">${nOv} own</span>` : ''}
      </div>
      ${rows.map(r => shRowHtml(r, defs[r], eff)).join('')}
    </section>`;
}

// THE BAR MEANS "THIS IS NOT WHAT IT WOULD OTHERWISE BE", and what it would otherwise be
// depends on the sheet: on a CONFIG, the default underneath it (an override); on the DEFAULT,
// the value this sheet opened with (a change you have not landed yet). One mark, one colour —
// the panel's amber — answering the same question against the only baseline each mode has.
// A CONTROL TALLER THAN ITS LABEL TAKES THE WHOLE WIDTH. The preview and the controls grid
// are half a form each; squeezed into the value column they wrapped into rags.
function shRowHtml(r, def, eff) {
  const bar = SH.mode === 'default' ? shRowChg(r) : shRowOwn(r);
  const na = def.na ? def.na(eff) : '';
  const tall = def.kind === 'look' || def.kind === 'shown';
  return `
    <div class="sh-row${SH.mode === 'default' ? '' : ' cfg'}${bar ? ' own' : ''}${na ? ' na' : ''}${tall ? ' tall' : ''}" data-r="${r}"${na ? ` title="${esc(na)}"` : ''}>
      <span class="sh-l"${def.hint ? ` title="${esc(def.hint)}"` : ''}>${esc(def.l)}</span>
      <span class="sh-c">${shCtl(r, def, eff, na)}</span>
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
// function, because our select takes one). A kind gained here is gained by all three.
function cfgCtlHtml(r, def, eff, na, h) {
  const v = eff[r];
  const lit = o => (typeof o === 'string' ? `'${o}'` : o);
  switch (def.kind) {
    case 'bool': {
      const on = (v ?? def.dflt) === true;
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
      const n = def.opts.filter(o => !hidden.includes(String(o))).length;
      return `<span class="cfg-shown">
        <span class="cfg-grid">${def.opts.map(o => {
          const on = !hidden.includes(String(o));
          return `<button type="button" class="cfg-tile${on ? ' on' : ''}"${na ? ' disabled' : ''}
            aria-pressed="${on}" title="${esc(on ? `${def.wordOf(o)} — the viewer gets it. Click to take it away.` : `${def.wordOf(o)} — hidden from the viewer. Click to give it back.`)}"
            onclick="${h.chip(r, lit(o))}">${cfgIcon(o)}<span class="cfg-tile-l">${esc(def.wordOf(o))}</span><i class="cfg-tick"></i></button>`;
        }).join('')}</span>
        <span class="cfg-shown-n">${n === def.opts.length
          ? `All ${def.opts.length} controls shown`
          : `${n} of ${def.opts.length} controls shown`}</span>
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
      return `<span class="cfg-look">
        <span class="cfg-look-stage">${cfgStageHtml(eff)}</span>
        <span class="cfg-look-f">
          ${cfgColorFieldHtml('Brand', 'brandColor', eff.brandColor, h)}
          ${cfgColorFieldHtml('Text', 'textColor', eff.textColor, h)}
          <span class="cfg-lf">
            <i>Logo</i>
            <span class="rule-text cfg-lf-url"><input class="mono" value="${esc(eff.logoUrl || '')}" placeholder="https://…"
              spellcheck="false" oninput="${h.text('logoUrl')}"></span>
          </span>
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
function shCtl(r, def, eff, na) { return cfgCtlHtml(r, def, eff, na, SH_H); }

// A DISCRETE PICK REPAINTS the sheet — a seg, a chip, a switch, a menu; none holds a caret.
// TYPING NEVER DOES, or the caret goes with it: the row is marked as this config's own in
// place instead, along with the counts that watch it.
function shSet(f, v) { if (!SH) return; shPut(f, v); shRender(); }
function shChip(f, o) {
  if (!SH) return;
  const def = cfgDefs()[f];
  const cur = shEff()[f] || [];
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
function shText(el, f) { if (!SH) return; shPut(f, el.value); if (f === 'logoUrl') shStageSync(); shMark(el); }

// THE COLOUR PAIR. The picker fires `input` continuously while the pointer moves, and every
// one of those updates the swatch, the hex and the Aa IN PLACE — never a repaint, which is
// what used to destroy the very input the picker was anchored to and shut it mid-drag
// (13 Sep, user call). `change`, the picker closing, repaints.
function shColor(el, f) {
  if (!SH) return;
  shPut(f, el.value);
  el.closest('.cfg-sw').style.background = el.value;
  const hex = el.closest('.cfg-lf')?.querySelector('.cfg-lf-hex input');
  if (hex) hex.value = el.value;
  shStageSync();
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
  shStageSync();
  shMark(el);
}
// The stage follows every one of the picker's `input` events, in place — a repaint there
// would destroy the very input the picker is anchored to and shut it mid-drag (13 Sep).
function shStageSync() {
  const box = dialogRoot().querySelector('.cfg-look-stage');
  if (box) box.innerHTML = cfgStageHtml(shEff());
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
function shFootHtml() {
  const n = shChangeCount();
  const isNew = SH.mode === 'new';
  return `
    <div class="dlg-foot sh-foot">
      ${SH.mode === 'config' ? `<button type="button" class="btn ghost sh-reset" ${shCount() ? '' : 'disabled'}
        title="${esc(shCount() ? 'Drop every setting of its own and follow the default again' : 'Nothing of its own to drop')}"
        onclick="shFollowAll()">Follow the default for everything</button>` : ''}
      <span class="eh-gap"></span>
      ${n || isNew ? '<button type="button" class="btn ghost" onclick="shCancel()">Cancel</button>' : ''}
      <button type="button" class="btn" onclick="shDone()">${isNew
        ? 'Create config'
        : (n ? `Apply ${n} change${n === 1 ? '' : 's'}` : 'Close')}</button>
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
  const t = SH.err || shSubText();
  sub.hidden = !t;
  sub.textContent = t;
}

function shMark(el) {
  const row = el.closest('.sh-row');
  if (row) row.classList.toggle('own', SH.mode === 'default' ? shRowChg(row.dataset.r) : true);
  shHeadSync();
  shFootSync();
  for (const sec of CFG_SECTIONS) {
    const box = dialogRoot().querySelector(`.sh-sec[data-s="${sec.k}"] .sh-sh`);
    if (!box) continue;
    const n = SH.mode === 'default' ? 0 : cfgSecFields(sec).filter(shIsOwn).length;
    let tag = box.querySelector('.sh-n');
    if (!n) { if (tag) tag.remove(); continue; }
    if (!tag) { box.insertAdjacentHTML('beforeend', '<span class="sh-n"></span>'); tag = box.querySelector('.sh-n'); }
    tag.textContent = `${n} own`;
  }
}

// ONE WAY BACK, NOT TWENTY-NINE (14 Sep, user call — *"we don't need follow default at each
// line, we can have one global reset button"*). It stands in the sheet's own act row and is
// dead while there is nothing to undo. The confirm takes the dialog for a moment — every
// dialog here shares one root — so the sheet is drawn again on the way out, whichever way
// the question was answered.
async function shFollowAll() {
  if (!SH || SH.mode === 'default') return;
  const n = shCount();
  if (!n) return;
  const name = (SH.draft.name || '').trim() || 'this config';
  const ok = await ask({
    title: `Follow the default for everything on “${name}”?`,
    body: `${n} setting${n === 1 ? '' : 's'} of its own will be dropped. It keeps its key; players asking for it get the default from the next publish.`,
    okLabel: 'Follow default',
  });
  if (ok) for (const f of cfgFields()) shDrop(f);
  shRender();
}

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
  if (!e.target.classList.contains('dlg-veil') || !SH) return;
  shBail();
}

document.addEventListener('keydown', e => {
  if (e.key !== 'Escape' || !SH) return;
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
  const ok = await ask({
    title: `Remove “${c.name}”?`,
    body: 'Players asking for it fall back to the default from the next publish.',
    okLabel: 'Remove', danger: true,
  });
  if (!ok) return;
  FORM.data.playerConfigs.splice(i, 1);
  clearErr('playerConfigs');
  FORM.rerender();
}

// Every override dropped in one act — the ⋯'s one non-destructive item. The config stays,
// keyed and switched; players asking for it get the default from the next publish. Asked
// first, because it is many decisions undone in one click.
async function pcFollowAll(i) {
  const c = (FORM.data.playerConfigs || [])[i];
  if (!c) return;
  const n = cfgFields().filter(f => c[f] !== undefined).length;
  const ok = await ask({
    title: `Follow the default for everything on “${c.name}”?`,
    body: `${n} override${n === 1 ? '' : 's'} will be dropped. The config stays; players asking for it get the default from the next publish.`,
    okLabel: 'Follow default',
  });
  if (!ok) return;
  for (const f of cfgFields()) delete c[f];
  clearErr('playerConfigs');
  FORM.rerender();
}

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
