// views-keys-editor-player.js — the integration page's PLAYER CONFIG card: ONE GRID.
// Rows are the player's settings; the first column is the DEFAULT, and every custom
// config is one more column beside it. A cell shows its VALUE at rest and becomes its
// control when clicked — the way a spreadsheet cell does — and a config's cell is
// either faded (it follows the default) or its own (accent, with × to let go).
//
// THE THREE SECTIONS (11 Sep, user call; docs/PLAYER-LEVERS.xlsx is the record of why).
//
//   1 Playback                how the video plays
//   2 Controls & appearance   what the viewer sees and can touch
//   3 Analytics & measurement what is reported, and to whom
//
// A SECTION IS NAVIGATION, and a first pass at eight of them made the card its own table
// of contents. The finer grouping lives INSIDE the folds as quiet row groups.
//
// THE GRID (13 Sep, third cut — user call: *"less cluttered … how does a user think …
// more fluid like Google Sheets … the custom config is sounding disjointed from the
// default"*). Three findings, one answer:
//
//   READING COMES BEFORE EDITING. A person opens this card to CHECK far more often than
//   to change, and twenty-nine drawn controls have to be decoded one by one — which
//   option is lit, is that switch on — where twenty-nine WORDS are simply read. So a
//   cell is a word until it is clicked. Nothing is a widget at rest except a switch,
//   which is both the value and the control and costs nothing to read.
//
//   A CUSTOM CONFIG IS THE SAME SETTINGS WITH A FEW CELLS DIFFERENT. The old card said
//   that in three languages — a card, a chip row, a modal — and a reader had to hold
//   the idea in their head to connect them. A column beside the default says it with no
//   words at all: a config's column is mostly faded read-through, and the few cells it
//   sets stand out in accent. That IS the concept. Nothing to learn, nothing to explain.
//
//   NO MODES. No Edit button, no Done, no Cancel. Click a cell, change it, it is changed
//   (in the page's draft — Save and Publish are untouched). Enter commits, Escape
//   reverts, Tab steps to the next cell, arrows move, typing on a focused cell starts
//   editing it, and Backspace on a config's own cell lets it follow the default again —
//   a spreadsheet's whole grammar, because that is what people already know.
//
// DEFAULT + SPARSE OVERRIDES (13 Sep, user call). The default IS the default config. A
// custom config may override ANY of its fields and carries only those; everything else
// follows the default LIVE. Same model as before this cut — the grid is a new view of
// it, not a new model.

// ---------- THE COLUMNS ----------
// `d` is the default; a config column is its index in FORM.data.playerConfigs. Every
// read of a column goes through `pgEff` (its overrides laid over the default) and every
// write through `pgPut`, which is what lets one row renderer draw both kinds.
// ONE CONFIG AT A TIME (14 Sep, user call — *"what if I want to see only a single player
// config"*). Six columns beside the default is a lot to read across, and most work is done
// in ONE config at a time. Focusing hides the others and gives the two that are left the
// whole card. `PG_ONLY` holds the config OBJECT, never an index, so a removal or a reorder
// can never leave the view pointing at the wrong column — if the object is gone, so is the
// focus. THE DEFAULT NEVER LEAVES: a config IS its differences from the default, and a
// column of overrides with nothing to differ from says nothing at all.
let PG_ONLY = null;
function pgCols() {
  const all = (FORM.data.playerConfigs || []).map((c, i) => ({ k: 'c', id: String(i), i, c }));
  const one = PG_ONLY ? all.find(x => x.c === PG_ONLY) : null;
  if (PG_ONLY && !one) PG_ONLY = null;
  return [{ k: 'd', id: 'd' }, ...(one ? [one] : all)];
}
// Focus one column, or let it go. Ids stay TRUE indices into playerConfigs, so hiding a
// column changes what is drawn and nothing about what a cell addresses.
function pgOnly(i) {
  const c = (FORM.data.playerConfigs || [])[i];
  if (!c) return;
  PG_ONLY = PG_ONLY === c ? null : c;
  PG_EDIT = null;
  FORM.rerender();
}
function pgAllCols() { PG_ONLY = null; PG_EDIT = null; FORM.rerender(); }
// The count on a closed section IS the door: "how is shorts different" is answered by
// showing shorts beside the default with that section open. It focuses, it never unfocuses
// — the words mean "show me", not "toggle".
function pgDiffClick(e, i, k) {
  e.stopPropagation();
  const cfgs = FORM.data.playerConfigs || [];
  if (cfgs[i] && cfgs.length > 1) PG_ONLY = cfgs[i];
  PB_OPEN = k;
  PG_EDIT = null;
  FORM.rerender();
}
function pgColOf(id) {
  if (id === 'd') return { k: 'd', id: 'd' };
  const i = Number(id);
  const c = (FORM.data.playerConfigs || [])[i];
  return c ? { k: 'c', id, i, c } : null;
}
function pgFields() { return (KL_META && KL_META.playerFields) || []; }
function pgEff(col) {
  const d = FORM.data.player || {};
  if (col.k === 'd') return d;
  const o = { ...d };
  for (const f of pgFields()) if (col.c[f] !== undefined) o[f] = col.c[f];
  return o;
}
function pgPut(col, f, v) {
  if (col.k === 'd') FORM.data.player[f] = v;
  else { col.c[f] = v; clearErr('playerConfigs'); }
  clearErr(f);
}
function pgDrop(col, f) { if (col.k === 'c') { delete col.c[f]; clearErr('playerConfigs'); } }

// Changed since the last save — per cell, so the amber rule lands on the very cell that
// moved and not on a whole row that mostly did not.
function pgDirty(col, f) {
  if (!FORM.saved) return false;
  if (col.k === 'd') return JSON.stringify(FORM.data.player?.[f] ?? null) !== JSON.stringify(FORM.saved.player?.[f] ?? null);
  const sc = (FORM.saved.playerConfigs || [])[col.i];
  return JSON.stringify(col.c[f] ?? null) !== JSON.stringify(sc?.[f] ?? null);
}

// ---------- THE ROWS ----------
// Three sections, eight row groups, twenty-nine fields. `remembers` is ONE row over three
// booleans (what a returning viewer keeps is one question with three answers).
const PG_SECTIONS = [
  { k: 'playback', name: 'Playback', groups: [
    ['Start', ['autoplay', 'passiveVolume', 'muted', 'playback', 'expandInMini', 'remembers']],
    ['Source', ['playbackMode', 'redirectUrl', 'quality', 'fallbackMediaId']],
    ['Out of view', ['dock', 'autoPausePct']],
    ['Completion', ['loop', 'endScreen']],
  ] },
  { k: 'look', name: 'Controls & appearance', groups: [
    ['Controls', ['controlsMode', 'hiddenControls', 'playbackRates', 'controlsAutoHideMs']],
    ['Appearance', ['brandColor', 'textColor', 'logoUrl']],
  ] },
  { k: 'measure', name: 'Analytics & measurement', groups: [
    ['Reporting', ['analyticsLevel', 'viewAfterMs', 'heartbeatMs']],
    ['Vendors', ['comscoreId', 'nielsenId', 'gaId']],
  ] },
];
const PG_REMEMBER = ['rememberVolume', 'rememberAudioLang', 'rememberCaptions'];
function pgRowFields(r) { return r === 'remembers' ? PG_REMEMBER : [r]; }
function pgSecFields(s) { return s.groups.flatMap(g => g[1]).flatMap(pgRowFields); }

// What each row IS: its label, the kind of cell it draws, its vocabulary, its default,
// and — where a value cannot apply right now — the reason (`na`, per column: Controls
// None takes the three under it with it, in THAT column only). `showIf` is the one row
// that exists only when some column needs it (a redirect target for a redirect player).
const PG_CTL_WHY = 'The player draws no controls, so there is nothing to hide, speed up or auto-hide';
function pgDefs() {
  const m = KL_META || {};
  const w = (kind, v) => label(kind, v);
  const en = (kind, opts, dflt, whyFor) => ({ kind: 'enum', opts, words: opts.map(o => w(kind, o)), dflt, whyFor });
  const noCtl = e => ((e.controlsMode ?? 'full') === 'none' ? PG_CTL_WHY : '');
  return {
    autoplay: { l: 'Autoplay', ...en('autoplay', m.autoplay || ['on', 'off', 'auto'], 'auto') },
    passiveVolume: { l: 'Passive volume', kind: 'num', unit: '%', dflt: 100 },
    muted: { l: 'Starts muted', kind: 'bool', dflt: false },
    playback: { l: 'Playback mode', ...en('playback', m.playbackKinds || ['active', 'passive'], 'active') },
    expandInMini: { l: 'Expand MiniTV for ads', kind: 'enum', opts: [true, false], words: ['Yes', 'No'], dflt: true },
    remembers: { l: 'Remembers', kind: 'set', fs: PG_REMEMBER, words: ['Volume', 'Audio language', 'Captions'] },
    playbackMode: { l: 'Player type', ...en('playbackMode', m.playbackModes || ['inline'], 'inline') },
    redirectUrl: { l: 'Redirect URL', kind: 'text', ph: 'https://…',
      na: e => (e.playbackMode === 'inline_redirect' ? '' : 'Only an Inline + redirect player redirects'),
      showIf: effs => effs.some(e => e.playbackMode === 'inline_redirect') },
    quality: { l: 'Quality', kind: 'text', ph: 'auto', none: 'Auto' },
    fallbackMediaId: { l: 'Fallback media', kind: 'text', ph: 'media id' },
    dock: { l: 'Dock position', ...en('dock', m.dockPositions || ['off', 'lt', 'rt', 'lb', 'rb'], 'lb') },
    autoPausePct: { l: 'Pause below visibility', kind: 'pct', unit: '%', dflt: 50,
      hint: 'Below 10% the player cannot tell — the floor is 10' },
    loop: { l: 'Loop', kind: 'bool', dflt: false },
    endScreen: { l: 'End screen', ...en('endScreen', m.endScreens || ['none', 'related', 'custom'], 'none',
      o => (o === 'custom' ? 'A custom end screen needs a target the panel can hold — the player team owes us its shape' : '')) },
    controlsMode: { l: 'Controls', ...en('controlsMode', m.controlsModes || ['full', 'minimal', 'none'], 'full') },
    hiddenControls: { l: 'Hidden controls', kind: 'multi', opts: m.playerControls || [], wordOf: o => w('playerControl', o), na: noCtl },
    playbackRates: { l: 'Speeds', kind: 'multi', opts: m.playbackRates || [0.5, 1, 1.25, 1.5, 2], wordOf: o => `${o}×`, keep: 1, na: noCtl },
    controlsAutoHideMs: { l: 'Hide controls after', kind: 'ms', dflt: 5000, na: noCtl },
    brandColor: { l: 'Brand colour', kind: 'color' },
    textColor: { l: 'Text colour', kind: 'color', preview: true },
    logoUrl: { l: 'Logo', kind: 'logo', ph: 'https://…' },
    analyticsLevel: { l: 'Events reported', ...en('analyticsLevel', m.analyticsLevels || [1, 2, 3], 3) },
    viewAfterMs: { l: 'A view counts after', kind: 'ms', dflt: 3000 },
    heartbeatMs: { l: 'Heartbeat every', kind: 'ms', dflt: 10000 },
    comscoreId: { l: 'comScore id', kind: 'text', ph: 'none', none: 'None' },
    nielsenId: { l: 'Nielsen id', kind: 'text', ph: 'none', none: 'None' },
    gaId: { l: 'Google Analytics id', kind: 'text', ph: 'none', none: 'None' },
  };
}

// ---------- a value, in words ----------
// One word function for every field, so a cell, a `was` in the bulk sheet and a line in
// the change review can never spell the same answer three ways.
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
    case 'hiddenControls': return (v || []).length ? v.map(x => label('playerControl', x)).join(', ') : 'None';
    case 'playbackRates': return (v || []).map(x => `${x}×`).join(' · ');
    case 'quality': return v === 'auto' ? 'Auto' : String(v);
    default: return String(v === '' ? '—' : v);
  }
}

// A cell at rest: `html` is what is drawn, `plain` is the same in text (the hover for a
// value the column clipped — the tooltip policy's exact-value case).
function pgCellInner(r, def, eff) {
  const v = eff[r];
  const empty = t => ({ html: `<span class="pg-empty">${esc(t)}</span>`, plain: '' });
  switch (def.kind) {
    case 'bool': return { html: `<span class="toggle tiny${(v ?? def.dflt) === true ? ' on' : ''}"><span class="track"></span></span>`, plain: '' };
    case 'enum': {
      const ix = def.opts.findIndex(o => String(o) === String(v ?? def.dflt));
      const t = ix >= 0 ? def.words[ix] : String(v);
      return { html: esc(t), plain: t };
    }
    case 'num': { const t = `${v ?? def.dflt}${def.unit || ''}`; return { html: esc(t), plain: t }; }
    case 'ms': case 'pct': { const t = pbWord(r, v ?? 0); return { html: esc(t), plain: t }; }
    case 'multi': { const t = pbWord(r, v ?? []); return t ? { html: esc(t), plain: t } : empty('None'); }
    case 'set': {
      const on = def.fs.map((f, i) => ((eff[f] ?? true) === true ? def.words[i] : null)).filter(Boolean);
      return on.length ? { html: esc(on.join(', ')), plain: on.join(', ') } : empty('Nothing');
    }
    case 'text': return v ? { html: esc(pbWord(r, v)), plain: pbWord(r, v) } : empty(def.none || '—');
    case 'logo': return v
      ? { html: `<img class="pg-thumb" src="${esc(v)}" alt="" onerror="this.classList.add('dead')"><span>${esc(v)}</span>`, plain: v }
      : empty('None');
    case 'color': {
      if (!pgHexOk(v)) return empty('—');
      const mark = def.preview ? pgAaHtml(eff) : `<span class="pb-dot" style="background:${esc(v)}"></span>`;
      return { html: `${mark}<span class="mono">${esc(v)}</span>`, plain: v };
    }
  }
  return empty('—');
}

function pgHexOk(v) { return /^#([0-9a-f]{3}|[0-9a-f]{6})$/i.test(v || ''); }
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
function pgAaHtml(eff) {
  const bg = pgHexOk(eff.brandColor) ? eff.brandColor : '#ffffff';
  const fg = pgHexOk(eff.textColor) ? eff.textColor : '#000000';
  const ratio = pbContrast(bg, fg);
  const low = ratio < 3;
  return `<span class="pg-aa${low ? ' low' : ''}" style="background:${esc(bg)};color:${esc(fg)}"
    title="${esc(`Text on brand — contrast ${ratio.toFixed(1)}:1${low ? ' (low: under 3:1)' : ''}`)}">Aa</span>`;
}

// ---------- the fold ----------
// ONE SECTION OPEN AT A TIME — the card stays short, and there is never a question about
// which fold a control belongs to. THE WAY BACK: the 26x26 caret standing at rest, the
// head row itself, and Escape.
let PB_OPEN = null;
function pbToggle(k, e) {
  if (e) e.stopPropagation();
  PB_OPEN = PB_OPEN === k ? null : k;
  FORM.rerender();
}

// Escape unwinds the NARROWEST thing first — the open cell, then the open section, then
// the focused column. One key, one step back, every time.
document.addEventListener('keydown', e => {
  if (e.key !== 'Escape') return;
  if (PG_EDIT) { pgCancel(); return; }
  if (document.getElementById('dialog-root')?.innerHTML.trim()) return;
  if (typeof FORM === 'undefined' || !FORM.rerender) return;
  if (PB_OPEN !== null) { PB_OPEN = null; FORM.rerender(); return; }
  if (PG_ONLY) pgAllCols();
});

// ---------- THE CARD ----------
// Title · lede · the grid: a header row (Default, then a column head per config), then
// the three sections, each one row at rest — the default's headline facts in its column
// and, in each config's column, how many cells of this section it sets.
function playerCardHtml() {
  // A repaint that is not this grid's own means the cell being edited is gone with the
  // old DOM: the model already holds every keystroke, so there is nothing to revert.
  if (PG_EDIT) PG_EDIT = null;
  const cols = pgCols();
  const cfgs = FORM.data.playerConfigs || [];
  const max = KL_META.maxPlayerConfigs || 6;
  const n = cfgs.length;
  const shown = cols.length - 1;   // what is DRAWN — one config while a column is focused
  const unnamed = cfgs.some(c => !(c.name || '').trim());
  // 204px holds the longest section name beside its caret. The default's column takes two
  // shares to a config's one, because it carries the closed rows' facts. THE FLOORS ARE LOW
  // ON PURPOSE: at the six-config maximum the tracks must still add up inside the card, or
  // the page scrolls sideways — the one thing a layout may never do here. Six columns are
  // narrow and some values clip (exact text on hover); focusing one is the real answer, and
  // it is one click away on any closed section row.
  const tpl = `204px minmax(160px, 2fr)${shown ? ` repeat(${shown}, minmax(76px, 1fr))` : ''}`;
  const errFor = s => pgSecFields(s).find(f => FORM.errors[f]);
  const lede = n
    ? 'Every player gets the default. A custom config is asked for by key and changes only the cells you set — faded cells follow the default.'
    : 'Every player on this surface follows the default. Add a config to vary it for players that ask by key.';
  return `
    <div class="fieldset pg-card">
      ${FORM.errors.playerConfigs ? `<div class="banner bad" data-err-for="playerConfigs">${esc(FORM.errors.playerConfigs)}</div>` : ''}
      <div class="fieldset-title-row">
        <div class="fieldset-title">Player config</div>
        <button type="button" class="btn ghost small pcc-add" ${unnamed || n >= max
          ? `disabled title="${unnamed ? 'Key the new column first' : `At most ${max} custom configs per integration`}"`
          : ''} onclick="pcAdd()">+ Add config</button>
      </div>
      <p class="pg-lede">${esc(lede)}</p>
      <div class="pg" style="--pg-tpl: ${tpl}">
        <div class="pg-row pg-head">
          <div class="pg-hl">${PG_ONLY ? `<button type="button" class="pg-back" onclick="pgAllCols()">‹ All ${n} configs</button>` : ''}</div>
          <div class="pg-hd">Default</div>
          ${cols.slice(1).map(pgHeadCell).join('')}
        </div>
        ${PG_SECTIONS.map(s => {
          const open = PB_OPEN === s.k;
          const bad = errFor(s);
          return `
          <div class="pg-sec${open ? ' open' : ''}${bad ? ' bad' : ''}" data-pb="${s.k}">
            ${pgSecHead(s, cols, open)}
            ${open ? pgBody(s, cols) : ''}
            ${!open && bad ? `<div class="pg-err" data-err-for="${esc(bad)}">${esc(FORM.errors[bad])}</div>` : ''}
          </div>`;
        }).join('')}
      </div>
    </div>`;
}

// A config's column head: its key (typeable in place), its switch, its ⋯. The key is
// held to the rules the server holds it to, on the way out (pcKeyDone).
function pgHeadCell(col) {
  const c = col.c, i = col.i;
  const off = c.on === false;
  const sc = FORM.saved ? (FORM.saved.playerConfigs || [])[i] : null;
  const dirty = !!FORM.saved && (!sc || (sc.name ?? '') !== (c.name ?? '') || (sc.on !== false) !== (c.on !== false));
  const keyed = !!(c.name || '').trim();
  const bad = PC_BAD.get(c);
  const nOv = pgFields().filter(f => c[f] !== undefined).length;
  const many = (FORM.data.playerConfigs || []).length > 1;
  return `
    <div class="pg-hc${keyed ? '' : ' wants'}${off ? ' off' : ''}${chgIf(dirty)}">
      <input type="text" class="pg-key${bad ? ' err' : ''}" value="${esc(c.name || '')}" placeholder="key" spellcheck="false"
        aria-label="Config key" title="${esc(c.name || '')}" oninput="pcName(this, ${i})" onblur="pcKeyDone(this, ${i})"
        onkeydown="if (event.key === 'Enter') { event.preventDefault(); this.blur(); }">
      <span class="toggle tiny${off ? '' : ' on'}" title="${off ? 'Off — players asking for it get the default' : 'On'}"
        onclick="pcSet(${i}, 'on', ${off})"><span class="track"></span></span>
      <span class="rmenu">
        <button type="button" class="row-kebab" onclick="rmenuToggle(event, this)" aria-label="More actions">⋯</button>
        <div class="rmenu-list">
          ${many ? `<div class="eh-item" onclick="rmenuShut(this); pgOnly(${i})">${PG_ONLY === c ? 'Show all configs' : 'Show only this config'}</div>` : ''}
          ${nOv ? `<div class="eh-item" onclick="rmenuShut(this); pcFollowAll(${i})">Follow the default for everything</div>` : ''}
          <div class="eh-item danger" onclick="rmenuShut(this); pcRemove(${i})">Remove config</div>
        </div>
      </span>
      ${bad ? `<span class="field-err pg-kmsg">${esc(bad)}</span>` : ''}
    </div>`;
}

// A section's head row. Closed, the default's column carries the headline facts (a
// section of thirteen fields cannot print thirteen) and each config's column says how
// many cells of this section it sets — so the columns are real even before a fold opens.
function pgSecHead(s, cols, open) {
  const p = FORM.data.player || {};
  const secF = pgSecFields(s);
  const D = cols[0];
  return `
    <div class="pg-row pg-srow" onclick="pbToggle('${s.k}', event)">
      <div class="pg-sname">
        <button type="button" class="unit-chev" aria-label="${open ? 'Close' : 'Open'} ${esc(s.name)}" onclick="pbToggle('${s.k}', event)">›</button>
        <span>${esc(s.name)}</span>
      </div>
      <div class="pg-facts${chgIf(secF.some(f => pgDirty(D, f)))}">${open ? '' : pgFacts(s, p)}</div>
      ${cols.slice(1).map(col => {
        const n = secF.filter(f => col.c[f] !== undefined).length;
        // THE WORDS ARE THE DOOR, NOT THE CELL. A section's row toggles its own fold; a
        // cell that mostly is not its text would otherwise focus a column under a click
        // aimed at the row. So the count carries the handler and the cell carries nothing.
        const narrows = (FORM.data.playerConfigs || []).length > 1 && !PG_ONLY;
        const why = narrows ? `Show only “${col.c.name || 'this config'}”, with ${s.name} open` : `Open ${s.name}`;
        const door = `title="${esc(why)}" onclick="pgDiffClick(event, ${col.i}, '${s.k}')"`;
        return `<div class="pg-sdiff${chgIf(secF.some(f => pgDirty(col, f)))}${col.c.on === false ? ' coff' : ''}">${
          n ? `<span class="pg-diff" ${door}>${n} differ${n === 1 ? 's' : ''}</span>`
            : `<span class="pg-same" ${door}>same</span>`}</div>`;
      }).join('')}
    </div>`;
}

// THE FACT LINE — four headline values per section, in the default's column (four, so a
// closed row stays one line beside two configs; the fold has the rest). One colour and
// one weight for every value; a fact the section cannot apply right now dims IN PLACE
// with its reason on hover rather than disappearing.
function pgFacts(s, p) {
  const w = (k, v) => label(k, v);
  const secs = ms => (ms > 0 ? `${ms / 1000}s` : 'Off');
  const noCtl = (p.controlsMode ?? 'full') === 'none';
  const fact = (l, v, na, why) => `<span class="uf${na ? ' na' : ''}"${why ? ` title="${esc(why)}"` : ''}><i>${esc(l)}</i><b>${v}</b></span>`;
  switch (s.k) {
    case 'playback': return [
      fact('Autoplay', esc(w('autoplay', p.autoplay ?? 'auto'))),
      fact('Volume', esc(`${p.passiveVolume ?? 100}%`)),
      fact('Playback', esc(w('playback', p.playback ?? 'active'))),
      fact('End screen', esc(w('endScreen', p.endScreen ?? 'none'))),
    ].join('');
    case 'look': return [
      fact('Controls', esc(w('controlsMode', p.controlsMode ?? 'full'))),
      fact('Hidden', (p.hiddenControls || []).length ? String(p.hiddenControls.length) : 'None', noCtl, noCtl ? PG_CTL_WHY : ''),
      fact('Auto-hide', esc(secs(p.controlsAutoHideMs ?? 5000)), noCtl, noCtl ? PG_CTL_WHY : ''),
      fact('Brand', pgHexOk(p.brandColor) ? `<span class="pb-dot" style="background:${esc(p.brandColor)}"></span>${esc(p.brandColor)}` : '—'),
    ].join('');
    case 'measure': {
      const ids = ['comscoreId', 'nielsenId', 'gaId'].filter(f => (p[f] || '').trim()).length;
      return [
        fact('Events', esc(w('analyticsLevel', p.analyticsLevel ?? 3))),
        fact('View after', esc(secs(p.viewAfterMs ?? 3000))),
        fact('Heartbeat', esc(secs(p.heartbeatMs ?? 10000))),
        fact('Ids', `${ids} of 3`),
      ].join('');
    }
  }
  return '';
}

// The open fold: the section's row groups, each a quiet label over its rows; a row is
// its label and one cell per column.
function pgBody(s, cols) {
  const defs = pgDefs();
  const effs = cols.map(pgEff);
  return `<div class="pg-body">${s.groups.map(([h, rows]) => {
    const vis = rows.filter(r => !defs[r].showIf || defs[r].showIf(effs));
    if (!vis.length) return '';
    return `<div class="pg-g">${esc(h)}</div>${vis.map(r => pgRowHtml(r, defs[r], cols, effs)).join('')}`;
  }).join('')}</div>`;
}

function pgRowHtml(r, def, cols, effs) {
  const fs = pgRowFields(r);
  const bad = fs.find(f => FORM.errors[f]);
  const allNa = !!def.na && cols.every((c, i) => def.na(effs[i]));
  return `
    <div class="pg-row pg-r${allNa ? ' dim' : ''}${bad ? ' bad' : ''}" data-r="${r}">
      <div class="pg-l"${def.hint ? ` title="${esc(def.hint)}"` : ''}>${esc(def.l)}</div>
      ${cols.map((col, i) => pgCellHtml(r, def, col, effs[i])).join('')}
    </div>
    ${bad ? `<div class="pg-err" data-err-for="${esc(bad)}">${esc(FORM.errors[bad])}</div>` : ''}`;
}

// ONE CELL. In the default's column it is simply the value. In a config's column it is
// `inh` (faded — it follows the default, and comes back to full ink under the pointer
// because touching it is how a config makes it its own) or `own` (accent, with × as
// the one way it lets go). `na` greys it where it sits with the reason; `chg` is the
// amber rule this panel means "unsaved" by, at every scale.
function pgCellHtml(r, def, col, eff) {
  const fs = pgRowFields(r);
  const own = col.k === 'd' || fs.some(f => col.c[f] !== undefined);
  const na = def.na ? def.na(eff) : '';
  const dirty = fs.some(f => pgDirty(col, f));
  const off = col.k === 'c' && col.c.on === false;
  const { html, plain } = pgCellInner(r, def, eff);
  const title = na || (plain.length > 18 ? plain : '');
  return `
    <div class="pg-c${col.k === 'c' ? (own ? ' own' : ' inh') : ''}${dirty ? ' chg' : ''}${na ? ' na' : ''}${off ? ' coff' : ''}"
      tabindex="${na ? -1 : 0}" data-r="${r}" data-col="${col.id}" data-kind="${def.kind}"${title ? ` title="${esc(title)}"` : ''}
      onclick="pgClick(event, this)" onkeydown="pgKey(event, this)">
      <span class="pg-v">${html}</span>
      ${col.k === 'c' && own && !na ? '<button type="button" class="pg-x" tabindex="-1" title="Use the default" onclick="pgUseDefault(event, this)">×</button>' : ''}
    </div>`;
}

// ---------- EDITING A CELL ----------
// One cell is open at a time. Every keystroke writes the model AT ONCE (the panel's
// standing rule — a control never holds a value the model does not), so closing an
// editor is only a repaint, and nothing is lost whichever way it closes: Enter, Tab, a
// click anywhere else, or a repaint some other control caused. Escape alone REVERTS,
// from the snapshot taken when the cell opened.
let PG_EDIT = null;   // { r, col, kind, cell, orig, t }

function pgCellEl(r, colId) { return document.querySelector(`.pg-c[data-r="${r}"][data-col="${colId}"]`); }
function pgFocus(r, colId) { requestAnimationFrame(() => pgCellEl(r, colId)?.focus()); }

function pgClick(e, cell, pick) {
  if (cell.classList.contains('na')) return;
  if (e.target !== cell && e.target.closest('.pg-x, .pg-pop, .pg-in, .pg-sw')) return;
  if (PG_EDIT && PG_EDIT.cell === cell) return;
  const r = cell.dataset.r, colId = cell.dataset.col;
  // A switch is the value and the control at once: one click flips it.
  if (cell.dataset.kind === 'bool') {
    const col = pgColOf(colId);
    if (!col) return;
    const def = pgDefs()[r];
    const cur = (pgEff(col)[r] ?? def.dflt) === true;
    PG_EDIT = null;
    pgPut(col, r, !cur);
    FORM.rerender();
    pgFocus(r, colId);
    return;
  }
  pgOpen(r, colId, undefined, pick || !!e.target.closest('.pb-dot, .pg-aa'), e.timeStamp);
}

function pgOpen(r, colId, seed, pick, t) {
  if (PG_EDIT) { PG_EDIT = null; FORM.rerender(); }
  const cell = pgCellEl(r, colId);
  const col = pgColOf(colId);
  const def = pgDefs()[r];
  if (!cell || !col || !def) return;
  const eff = pgEff(col);
  const orig = {};
  for (const f of pgRowFields(r)) {
    const v = col.k === 'd' ? FORM.data.player[f] : col.c[f];
    orig[f] = v === undefined ? undefined : JSON.stringify(v);
  }
  PG_EDIT = { r, col: colId, kind: def.kind, cell, orig, t: t || 0 };
  cell.classList.add('editing');
  cell.addEventListener('focusout', pgFocusOut);
  const v = cell.querySelector('.pg-v');
  switch (def.kind) {
    case 'enum': {
      cell.insertAdjacentHTML('beforeend', pgMenuHtml(r, def, col, eff));
      pgPlacePop(cell);
      (cell.querySelector('.pg-opt.on') || cell.querySelector('.pg-opt'))?.focus();
      break;
    }
    case 'multi': case 'set': {
      cell.insertAdjacentHTML('beforeend', pgChipsHtml(r, def, col, eff));
      pgPlacePop(cell);
      cell.querySelector('.pg-pop .pb-chip')?.focus();
      break;
    }
    case 'color': {
      v.innerHTML = pgColorEditHtml(r, def, eff);
      const hx = v.querySelector('.pg-hexin input');
      const pk = v.querySelector('input[type=color]');
      if (pick && pk && typeof pk.showPicker === 'function') {
        try { pk.showPicker(); } catch (_) { hx.focus(); }
      } else { hx.focus(); hx.select(); }
      break;
    }
    default: {
      const cur = pgEditText(def.kind, r, eff);
      const unit = def.kind === 'ms' ? 'sec' : (def.unit || '');
      const mono = def.kind === 'text' || def.kind === 'logo';
      v.innerHTML = `<span class="pg-in"><input value="${esc(seed ?? cur)}"
        placeholder="${esc(def.kind === 'ms' || def.kind === 'pct' ? 'off' : (def.ph || ''))}"
        ${mono ? 'class="mono"' : 'inputmode="decimal"'} spellcheck="false" oninput="pgLive(this)" onkeydown="pgInKey(event)">${
        unit ? `<span class="unit">${esc(unit)}</span>` : ''}</span>`;
      const inp = v.querySelector('input');
      inp.focus();
      if (seed == null) inp.select(); else pgLive(inp);
    }
  }
}

// What the inline box opens with — the cell's own value as text, in the unit it shows.
function pgEditText(kind, r, eff) {
  const v = eff[r];
  switch (kind) {
    case 'ms': return v > 0 ? String(v / 1000) : '';
    case 'pct': return v > 0 ? String(v) : '';
    case 'num': return String(v ?? pgDefs()[r].dflt);
    default: return v || '';
  }
}

// A keystroke writes the model. Blank means OFF for a timing or a threshold (the word
// the cell shows for zero), nothing for a number that has no off, and empty for text.
function pgLive(inp) {
  const E = PG_EDIT;
  if (!E) return;
  const col = pgColOf(E.col);
  if (!col) return;
  const raw = inp.value.trim();
  switch (E.kind) {
    case 'num': { if (raw === '') return; const n = Number(raw); if (Number.isFinite(n)) pgPut(col, E.r, n); break; }
    case 'ms': { const n = raw === '' ? 0 : Math.round(Number(raw) * 1000); if (Number.isFinite(n)) pgPut(col, E.r, n); break; }
    case 'pct': { const n = raw === '' ? 0 : Number(raw); if (Number.isFinite(n)) pgPut(col, E.r, n); break; }
    default: pgPut(col, E.r, raw);
  }
  pgMarkOwn(E.cell);
}
// The moment a config's faded cell is touched it is the config's own — said in place,
// without a repaint that would take the caret with it.
function pgMarkOwn(cell) {
  if (cell.classList.contains('inh')) { cell.classList.remove('inh'); cell.classList.add('own'); }
}

function pgInKey(e) {
  if (e.key === 'Enter') { e.preventDefault(); pgClose(); }
  else if (e.key === 'Escape') { e.preventDefault(); e.stopPropagation(); pgCancel(); }
  else if (e.key === 'Tab') { e.preventDefault(); pgStep(e.shiftKey ? -1 : 1); }
}

function pgClose(refocus = true) {
  const E = PG_EDIT;
  if (!E) return;
  PG_EDIT = null;
  FORM.rerender();
  if (refocus) pgFocus(E.r, E.col);
}

// Escape: back to what the cell held when it opened — its own value, or nothing (so a
// config's cell that was following the default follows it again).
function pgCancel() {
  const E = PG_EDIT;
  if (!E) return;
  const col = pgColOf(E.col);
  if (col) {
    const target = col.k === 'd' ? FORM.data.player : col.c;
    for (const [f, o] of Object.entries(E.orig)) {
      if (o === undefined) delete target[f]; else target[f] = JSON.parse(o);
    }
  }
  PG_EDIT = null;
  FORM.rerender();
  pgFocus(E.r, E.col);
}

// Tab: commit, and land on the next cell (Shift+Tab the previous) — a spreadsheet's walk.
function pgStep(dir) {
  const E = PG_EDIT;
  if (!E) return;
  const all = [...document.querySelectorAll('.pg-c[tabindex="0"]')].map(c => `${c.dataset.r}|${c.dataset.col}`);
  const ix = all.indexOf(`${E.r}|${E.col}`);
  const nx = all[ix + dir];
  PG_EDIT = null;
  FORM.rerender();
  if (nx) { const [r, col] = nx.split('|'); pgFocus(r, col); } else pgFocus(E.r, E.col);
}

// Focus leaving the cell for another control closes it; leaving for nowhere (the OS
// colour wheel, a window switch) does not.
function pgFocusOut(e) {
  const E = PG_EDIT;
  if (!E || E.cell !== e.currentTarget) return;
  const to = e.relatedTarget;
  if (to && !E.cell.contains(to)) pgClose(false);
}

// A click anywhere outside the open cell closes it. The click that OPENED it arrives
// here too (it bubbles) and is told apart by its timestamp; a target no longer in the
// document means some other control repainted the page inside this click, and the card
// already let the editor go when it drew.
document.addEventListener('click', e => {
  const E = PG_EDIT;
  if (!E) return;
  if (E.t && Math.abs(e.timeStamp - E.t) < 1) return;
  if (!e.target.isConnected) return;
  if (E.cell.contains(e.target)) return;
  pgClose(false);
});

// Keys on a cell at rest: Enter/Space open it, Backspace lets a config's own cell follow
// the default, arrows move, and a typed character starts editing with that character —
// the spreadsheet grammar, so nothing here has to be learned.
function pgKey(e, cell) {
  if (PG_EDIT && PG_EDIT.cell === cell) return;
  if (e.target !== cell) return;
  const k = e.key;
  if (k === 'Enter' || k === ' ' || k === 'F2') { e.preventDefault(); pgClick(e, cell); return; }
  if ((k === 'Backspace' || k === 'Delete') && cell.classList.contains('own') && cell.dataset.col !== 'd') {
    e.preventDefault(); pgUseDefault(e, cell); return;
  }
  if (k.startsWith('Arrow')) { e.preventDefault(); pgMove(cell, k); return; }
  if (k.length === 1 && !e.metaKey && !e.ctrlKey && !e.altKey && !cell.classList.contains('na')
    && ['num', 'pct', 'ms', 'text', 'logo'].includes(cell.dataset.kind)) {
    e.preventDefault();
    pgOpen(cell.dataset.r, cell.dataset.col, k, false, e.timeStamp);
  }
}

function pgMove(cell, k) {
  const row = cell.closest('.pg-r');
  if (!row) return;
  const cells = [...row.querySelectorAll('.pg-c')];
  const ix = cells.indexOf(cell);
  if (k === 'ArrowLeft' || k === 'ArrowRight') {
    const d = k === 'ArrowLeft' ? -1 : 1;
    let j = ix + d;
    while (cells[j] && cells[j].classList.contains('na')) j += d;
    cells[j]?.focus();
    return;
  }
  const rows = [...document.querySelectorAll('.pg-r')];
  const d = k === 'ArrowUp' ? -1 : 1;
  let j = rows.indexOf(row) + d;
  while (rows[j]) {
    const c = rows[j].querySelectorAll('.pg-c')[ix];
    if (c && !c.classList.contains('na')) { c.focus(); return; }
    j += d;
  }
}

// Let go: the config's cell follows the default again — from the × on the cell,
// Backspace on it, or `Default` at the top of its menu.
function pgUseDefault(e, el) {
  if (e) { e.stopPropagation(); if (e.preventDefault) e.preventDefault(); }
  const cell = el.closest('.pg-c');
  const col = cell && pgColOf(cell.dataset.col);
  if (!col || col.k !== 'c') return;
  for (const f of pgRowFields(cell.dataset.r)) pgDrop(col, f);
  PG_EDIT = null;
  FORM.rerender();
  pgFocus(cell.dataset.r, cell.dataset.col);
}

// A popover opens under its cell and, at the grid's right edge, hangs from the cell's
// right corner instead so it never leaves the card.
function pgPlacePop(cell) {
  const pop = cell.querySelector('.pg-pop');
  const grid = cell.closest('.pg');
  if (!pop || !grid) return;
  if (pop.getBoundingClientRect().right > grid.getBoundingClientRect().right - 4) pop.classList.add('r');
}

// THE MENU — an enum's options, current one bold; in a config's column the first entry
// is the default's answer, and picking it is how the cell lets go. A refused option
// stays where it sits, greyed, with its reason.
function pgMenuHtml(r, def, col, eff) {
  const cur = eff[r] ?? def.dflt;
  const dv = FORM.data.player[r] ?? def.dflt;
  const dix = def.opts.findIndex(o => String(o) === String(dv));
  const isC = col.k === 'c';
  const following = isC && col.c[r] === undefined;
  return `
    <div class="pg-pop menu" role="listbox" onkeydown="pgMenuKey(event)">
      ${isC ? `<div class="pg-opt dflt${following ? ' on' : ''}" tabindex="-1" onclick="pgPickDefault(event)">Default <b>${esc(def.words[dix] ?? String(dv))}</b></div>` : ''}
      ${def.opts.map((o, ix) => {
        const dead = def.whyFor ? def.whyFor(o) : '';
        const on = !following && String(o) === String(cur);
        return `<div class="pg-opt${on ? ' on' : ''}${dead ? ' dead' : ''}${isC && ix === 0 ? ' sep' : ''}" tabindex="-1"${
          dead ? ` title="${esc(dead)}"` : ` onclick="pgPick(event, ${ix})"`}>${esc(def.words[ix])}</div>`;
      }).join('')}
    </div>`;
}
function pgPick(e, ix) {
  e.stopPropagation();
  const E = PG_EDIT;
  if (!E) return;
  const col = pgColOf(E.col);
  if (col) pgPut(col, E.r, pgDefs()[E.r].opts[ix]);
  pgClose();
}
function pgPickDefault(e) {
  e.stopPropagation();
  const E = PG_EDIT;
  if (!E) return;
  const col = pgColOf(E.col);
  if (col) for (const f of pgRowFields(E.r)) pgDrop(col, f);
  pgClose();
}
function pgMenuKey(e) {
  const opts = [...e.currentTarget.querySelectorAll('.pg-opt:not(.dead)')];
  const ix = opts.indexOf(document.activeElement);
  if (e.key === 'ArrowDown') { e.preventDefault(); (opts[ix + 1] || opts[0])?.focus(); }
  else if (e.key === 'ArrowUp') { e.preventDefault(); (opts[ix - 1] || opts[opts.length - 1])?.focus(); }
  else if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); document.activeElement?.click(); }
  else if (e.key === 'Escape') { e.preventDefault(); e.stopPropagation(); pgCancel(); }
  else if (e.key === 'Tab') { e.preventDefault(); pgStep(e.shiftKey ? -1 : 1); }
}

// THE CHIPS — a set, toggled a chip at a time, the cell's word following in place. The
// one member that may never leave (1× speed) says so on hover rather than refusing
// silently under the pointer. In a config's column the foot offers the default back.
function pgChipsHtml(r, def, col, eff) {
  const isSet = def.kind === 'set';
  const cur = isSet ? [] : (eff[r] || []).map(String);
  const own = col.k === 'c' && pgRowFields(r).some(f => col.c[f] !== undefined);
  const items = isSet ? def.fs : def.opts;
  return `
    <div class="pg-pop chips" onkeydown="pgPopKey(event)">
      ${items.map((o, ix) => {
        const on = isSet ? (eff[o] ?? true) === true : cur.includes(String(o));
        const locked = !isSet && def.keep !== undefined && String(o) === String(def.keep);
        return `<button type="button" class="pb-chip${on ? ' on' : ''}${locked ? ' lock' : ''}"${
          locked ? ` title="${esc('Always offered — a viewer must be able to return to normal speed')}"` : ''} onclick="pgChip(event, ${ix})">${
          esc(isSet ? def.words[ix] : def.wordOf(o))}</button>`;
      }).join('')}
      ${col.k === 'c' ? `<div class="pg-pop-foot"><button type="button" class="pg-dflt-btn" ${own ? '' : 'disabled'} onclick="pgPickDefault(event)">Use the default</button></div>` : ''}
    </div>`;
}
function pgChip(e, ix) {
  e.stopPropagation();
  const E = PG_EDIT;
  if (!E) return;
  const col = pgColOf(E.col);
  if (!col) return;
  const def = pgDefs()[E.r];
  const eff = pgEff(col);
  if (def.kind === 'set') {
    const f = def.fs[ix];
    pgPut(col, f, !((eff[f] ?? true) === true));
  } else {
    const o = def.opts[ix];
    const cur = eff[E.r] || [];
    const has = cur.some(x => String(x) === String(o));
    if (has && def.keep !== undefined && String(o) === String(def.keep)) return;
    pgPut(col, E.r, has ? cur.filter(x => String(x) !== String(o)) : [...cur, o]);
  }
  e.currentTarget.classList.toggle('on');
  const { html, plain } = pgCellInner(E.r, def, pgEff(col));
  E.cell.querySelector('.pg-v').innerHTML = html;
  if (plain.length > 18) E.cell.title = plain; else E.cell.removeAttribute('title');
  pgMarkOwn(E.cell);
  const b = E.cell.querySelector('.pg-dflt-btn');
  if (b) b.disabled = false;
}
function pgPopKey(e) {
  if (e.key === 'Escape') { e.preventDefault(); e.stopPropagation(); pgCancel(); }
  else if (e.key === 'Enter') { e.preventDefault(); pgClose(); }
}

// THE COLOUR — the swatch IS the picker (a native colour input at zero opacity over it:
// the one place the panel takes the platform's control, because nothing drawn beats the
// OS's wheel), the hex beside it typeable so a brand value can be pasted. The picker
// fires `input` continuously while the pointer moves; every one updates IN PLACE — the
// swatch, the hex, the Aa — and never repaints, which is what used to shut the picker
// mid-drag (13 Sep, user call).
function pgColorEditHtml(r, def, eff) {
  const v = eff[r] || '';
  const ok = pgHexOk(v);
  return `
    <span class="pg-sw" style="background:${ok ? esc(v) : '#ffffff'}" title="Pick a colour">
      <input type="color" value="${ok ? esc(pbHex6(v)) : '#ffffff'}" oninput="pgColorIn(this)" aria-label="Pick a colour">
    </span>
    <span class="pg-in pg-hexin"><input class="mono" value="${esc(v)}" placeholder="#000000" spellcheck="false" oninput="pgHexIn(this)" onkeydown="pgInKey(event)"></span>
    ${def.preview ? pgAaHtml(eff) : ''}`;
}
function pgColorIn(el) {
  const E = PG_EDIT;
  if (!E) return;
  const col = pgColOf(E.col);
  if (!col) return;
  const v = el.value;
  pgPut(col, E.r, v);
  el.closest('.pg-sw').style.background = v;
  const hx = E.cell.querySelector('.pg-hexin input');
  if (hx) hx.value = v;
  pgAaSync(col);
  pgMarkOwn(E.cell);
}
function pgHexIn(el) {
  const E = PG_EDIT;
  if (!E) return;
  const col = pgColOf(E.col);
  if (!col) return;
  const v = el.value.trim();
  pgPut(col, E.r, v);
  if (pgHexOk(v)) {
    const sw = E.cell.querySelector('.pg-sw');
    if (sw) { sw.style.background = v; sw.querySelector('input').value = pbHex6(v); }
    pgAaSync(col);
  }
  pgMarkOwn(E.cell);
}
// Every Aa in this column follows the pair as it moves — the one being edited and the
// one at rest on the other colour's row.
function pgAaSync(col) {
  const eff = pgEff(col);
  document.querySelectorAll(`.pg-c[data-col="${col.id}"] .pg-aa`).forEach(el => { el.outerHTML = pgAaHtml(eff); });
}

// ---------- custom configs: the column heads' acts ----------
function pcAdd() {
  const cfgs = FORM.data.playerConfigs || (FORM.data.playerConfigs = []);
  const max = KL_META.maxPlayerConfigs || 6;
  if (cfgs.length >= max) { toast(`At most ${max} configs`, 'warn'); return; }
  if (cfgs.some(c => !(c.name || '').trim())) { pcFocusEmpty(); return; }
  // Born EMPTY — a column that sets nothing IS the default, which is exactly what a new
  // one should be until someone clicks a cell in it.
  cfgs.push({ name: '', on: true });
  PG_ONLY = null;          // or the column just made would be the one column not drawn
  clearErr('playerConfigs');
  FORM.rerender();
  pcFocusEmpty();
}

function pcFocusEmpty() {
  requestAnimationFrame(() => {
    const el = document.querySelector('.pg-hc.wants .pg-key');
    if (el) { el.focus(); el.select(); }
  });
}

// The add button is a stateful bit outside the head being typed in: while someone is
// keying a column it is toggled BY HAND, because repainting would take their caret.
function pcSyncAdd() {
  const btn = document.querySelector('.pcc-add');
  if (!btn) return;
  const cfgs = FORM.data.playerConfigs || [];
  const max = KL_META.maxPlayerConfigs || 6;
  const full = cfgs.length >= max;
  const unnamed = cfgs.some(c => !(c.name || '').trim());
  btn.disabled = full || unnamed;
  btn.title = full ? `At most ${max} custom configs per integration` : unnamed ? 'Key the new column first' : '';
}

async function pcRemove(i) {
  const c = (FORM.data.playerConfigs || [])[i];
  if (!c) return;
  if (!(c.name || '').trim()) {
    FORM.data.playerConfigs.splice(i, 1);
    clearErr('playerConfigs');
    FORM.rerender();
    return;
  }
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

function pcSet(i, f, val) {
  const c = (FORM.data.playerConfigs || [])[i];
  if (!c) return;
  c[f] = val;
  clearErr('playerConfigs');
  FORM.rerender();
}

function pcName(el, i) {
  const c = (FORM.data.playerConfigs || [])[i];
  if (!c) return;
  c.name = el.value;
  clearErr('playerConfigs');
  el.closest('.pg-hc')?.classList.toggle('wants', !el.value.trim());
  pcSyncAdd();
}

// On the way out, the key is held to the rules the SERVER holds it to — the same three
// refusals, said here first: one word, not "default", and not a key already here.
const PC_BAD = new WeakMap();
function pcKeyWhy(v, i) {
  if (!v) return '';
  if (!/^[A-Za-z0-9_-]{1,24}$/.test(v)) return 'A key is one word — letters, digits, - or _';
  if (v.toLowerCase() === 'default') return '“default” is the player’s own — pick another key';
  if ((FORM.data.playerConfigs || []).some((c, j) => j !== i && (c.name || '').trim().toLowerCase() === v.toLowerCase())) return `“${v}” is already here`;
  return '';
}

function pcKeyDone(el, i) {
  const c = (FORM.data.playerConfigs || [])[i];
  if (!c) return;
  const v = (el.value || '').trim();
  el.value = v;
  c.name = v;
  const head = el.closest('.pg-hc');
  head?.classList.toggle('wants', !v);
  const why = pcKeyWhy(v, i);
  head?.querySelector('.pg-kmsg')?.remove();
  if (why) {
    PC_BAD.set(c, why);
    el.classList.add('err');
    head?.insertAdjacentHTML('beforeend', `<span class="field-err pg-kmsg">${esc(why)}</span>`);
  } else {
    PC_BAD.delete(c);
    el.classList.remove('err');
  }
  pcSyncAdd();
}

// Drop every override on a config from its column head — the ⋯'s one non-destructive
// act. The config stays, keyed and switched; players asking for it get the default from
// the next publish. Asked first, because it is many decisions undone in one click.
async function pcFollowAll(i) {
  const c = (FORM.data.playerConfigs || [])[i];
  if (!c) return;
  const n = pgFields().filter(f => c[f] !== undefined).length;
  const ok = await ask({
    title: `Follow the default for everything on “${c.name}”?`,
    body: `${n} override${n === 1 ? '' : 's'} will be dropped. The config stays; players asking for it get the default from the next publish.`,
    okLabel: 'Follow default',
  });
  if (!ok) return;
  for (const f of pgFields()) delete c[f];
  clearErr('playerConfigs');
  FORM.rerender();
}

// THE SIX QUICK FACTS the bulk player sheets edit across a cohort. A cohort act is a blunt
// instrument, and the narrow sheet is the deliberate choice — a config's full editor is
// this page's grid. Kept here because the bulk sheet promised to read the list rather
// than copy it.
function pcFields() {
  const m = KL_META || {};
  const w = (kind, v) => label(kind, v);
  const kinds = m.playbackKinds || ['active', 'passive'];
  const auto = m.autoplay || ['on', 'off', 'auto'];
  const ctl = m.controlsModes || ['full', 'minimal', 'none'];
  const ends = m.endScreens || ['none', 'related', 'custom'];
  return [
    { f: 'playback', sec: 'Playback', l: 'Playback mode', dflt: 'active',
      word: v => w('playback', v), seg: [kinds, kinds.map(o => w('playback', o))] },
    { f: 'expandInMini', sec: 'Playback', l: 'Expand MiniTV for ads', dflt: true,
      word: v => (v ? 'Yes' : 'No'), seg: [[true, false], ['Yes', 'No']] },
    { f: 'autoplay', sec: 'Playback', l: 'Autoplay', dflt: 'auto',
      word: v => w('autoplay', v), seg: [auto, auto.map(o => w('autoplay', o))] },
    { f: 'loop', sec: 'Playback', l: 'Loop', dflt: false,
      word: v => (v ? 'Yes' : 'No'), seg: [[true, false], ['Yes', 'No']] },
    { f: 'endScreen', sec: 'Playback', l: 'End screen', dflt: 'none',
      word: v => w('endScreen', v), seg: [ends, ends.map(o => w('endScreen', o))] },
    { f: 'controlsMode', sec: 'Controls & appearance', l: 'Controls', dflt: 'full',
      word: v => w('controlsMode', v), seg: [ctl, ctl.map(o => w('controlsMode', o))] },
  ];
}

// A new integration starts from a player preset — a photocopy, never a link.
function stampPreset(name) {
  const pp = KL_META.playerPresets.find(p => p.name === name);
  if (!pp) return;
  FORM.data.presetName = name;
  FORM.data.player = JSON.parse(JSON.stringify(pp.values));
  FORM.rerender();
}
