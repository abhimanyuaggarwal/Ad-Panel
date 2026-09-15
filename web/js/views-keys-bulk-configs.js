// views-keys-bulk-configs.js — CUSTOM CONFIGS, the third cohort act over a selection on the
// Integrations list: every selected integration's named configs gathered into one sheet, one
// under another, and edited there. Loads after views-keys-bulk-player.js; uses the list file's
// selection (KSEL / selectedKeys) and `bulkApplyDirect` at runtime.
//
// WHY THIS IS NOT ANOTHER BLANKET FORM (15 Sep, user call — *"show the custom config of all the
// selected Integrations one under another in a clean manner for user to tweak and change"*).
// The two sheets beside it answer ONE question for a whole cohort: Ad behaviour sets a break's
// levers, Player behaviour sets the default player. Both can do that because the thing they
// write is something every integration has exactly one of. Custom configs are not that shape —
// a surface carries none, or six, each addressed by its own key — so "one answer for forty" is
// the wrong instrument. What a team wants is to SEE the forty and correct the ones that are
// wrong, without opening forty pages. This sheet is that, and only that.
//
// TWO THINGS WERE BUILT AND CUT THE SAME DAY, both for clutter (user call — *"dont give this
// change a setting on and which setting dropdown on top no need for it… dont show the fields in
// read only mode along side it make it clean and easy on eyes"*). They are named here so nobody
// rebuilds them:
//
//   1. THE "CHANGE A SETTING ON [ every config │ configs named shorts ]" STRIP — a blanket
//      filler above the list. Two dropdowns and an answered row standing over the very configs
//      it wrote into: a second way to do the one thing this sheet already does, in the place
//      that pushed the actual work down the screen. The sheet edits configs; that is the act.
//   2. THE GLANCE LINE on a config (`Autoplay Off · Playback mode Passive · +2 more`). It
//      printed every field a second time, in grey, beside the control that already says it — a
//      read-only shadow of the row underneath. On a list of forty that is the densest thing on
//      screen and none of it can be clicked.
//
// WHAT REPLACED BOTH: THE SETTINGS THEMSELVES, OPEN. A config's rows are its content, so they
// are what the sheet shows — real controls, in the integration page's own grammar (`.sh-row
// cfg`, `cfgCtlHtml`, the shared `pickerHtml` checklist, the `default` tail, the × back to
// following). Nothing on this screen is a read-only copy of something editable, and nothing is
// a lookalike of a control that exists elsewhere. The folds stay, per integration and per
// config, for getting past what you are not working on — they just start OPEN, because the ask
// was to see them.
//
// THE FOUR A COHORT IS REFUSED STAY REFUSED HERE (user call: *keep them out entirely*). Plays
// as, Redirect URL, Quality and Fallback media never appear in this sheet. A config being
// per-surface by nature is an argument for editing those on that surface's own page — which is
// exactly where they remain — not for letting a list screen write a redirect target it cannot
// know is right. The list is the server's (`KL_META.bulkNever`), so the screen and the wire
// cannot spell it differently.
//
// WHAT THIS SHEET DOES NOT DO, ON PURPOSE: it never CREATES a config and never REMOVES one.
// Both are keyed, named acts with their own ceiling (six per integration) and their own
// consequences for a player asking by key, and both belong where a person can see the one
// surface they are changing. `configFields` refuses either by name if a stale screen tries.
//
// EVERY VALUE ON SCREEN IS COUNTED. A config's from-side is its own answer, and says `(default)`
// where it was following one — because *Off* and *Off because nobody set it* are different
// facts, and a change row that hides the difference is one nobody can check.

let CC = null;

// A config's address in this sheet: which integration, which key.
const ccId = (keyId, name) => `${keyId}::${name}`;

function configsJourney() {
  if (!KSEL.size) return;
  CC = {
    // The queue — every change, per config.
    edits: {}, ons: {},
    // What is folded open, and which config has picked a setting it has not answered.
    openKey: new Set(), openCfg: new Set(), pending: {},
    cfgPick: '',
    err: '',
  };
  // EVERYTHING STARTS OPEN. The ask was to see the selection's configs one under another, and a
  // screen that opens with twelve shut rows has not shown anything yet. The folds exist for
  // getting past what you are not working on, which is a thing you do second, not first.
  for (const u of ccUnits()) { CC.openKey.add(u.k.id); CC.openCfg.add(u.ck); }
  renderCCScreen();
}

function closeCCScreen() {
  CC = null;
  closeDialog();
}

// ---------- what the selection holds ----------
// Every config on every selected integration, in the list's own order.
function ccUnits() {
  const out = [];
  for (const k of selectedKeys()) {
    for (const c of (k.playerConfigs || [])) out.push({ k, c, ck: ccId(k.id, c.name) });
  }
  return out;
}
function ccUnit(ck) { return ccUnits().find(u => u.ck === ck); }

// ---------- the draft ----------
// A config as this sheet currently holds it: what it arrived with, plus the queue laid over.
// `null` in the queue is THE WAY BACK — the override is dropped and the config follows its
// own integration's default again, which is the same word the wire uses.
function ccDraft(u) {
  const d = { ...u.c };
  for (const [f, v] of Object.entries(CC.edits[u.ck] || {})) {
    if (v === null) delete d[f]; else d[f] = v;
  }
  if (CC.ons[u.ck] !== undefined) d.on = CC.ons[u.ck];
  return d;
}
function ccOwn(u, f) {
  const e = CC.edits[u.ck] || {};
  return f in e ? e[f] !== null : u.c[f] !== undefined;
}
function ccRowOwn(u, r) { return cfgRowFields(r).some(f => ccOwn(u, f)); }
function ccOn(u) { return ccDraft(u).on !== false; }
// What the player would actually do: the integration's OWN default with this config's
// overrides on top. Each integration's default is its own, so this is read per unit and never
// borrowed from a cohort — that is what makes a `default` tail on a row honest.
function ccEff(u) {
  const o = { ...(u.k.player || {}) };
  const d = ccDraft(u);
  for (const f of cfgFields()) if (d[f] !== undefined) o[f] = d[f];
  return o;
}

// ---------- the queue ----------
// A value equal to what the config already held is not a change, so it never enters the queue
// — which is what keeps the count, the card and the review saying the same number.
function ccSame(u, f, v) {
  if (v === null) return u.c[f] === undefined;
  return JSON.stringify(u.c[f] ?? null) === JSON.stringify(v ?? null);
}
function ccWrite(u, f, v) {
  const e = CC.edits[u.ck] || (CC.edits[u.ck] = {});
  if (ccSame(u, f, v)) delete e[f]; else e[f] = v;
  if (!Object.keys(e).length) delete CC.edits[u.ck];
}
function ccClearField(ck, f) {
  const e = CC.edits[ck];
  if (!e) return;
  delete e[f];
  if (!Object.keys(e).length) delete CC.edits[ck];
}

// ---------- WHAT THIS SHEET MAY ASK ABOUT ----------
// The server's own never-list, honoured here: the four are not offered, not greyed, not
// reachable. A row is offered only when every field under it is.
function ccNever() { return (KL_META && KL_META.bulkNever) || {}; }
function ccRowOffered(r) { return !cfgRowFields(r).some(f => ccNever()[f]); }
function ccCatalogue(eff) {
  const defs = cfgDefs();
  return CFG_SECTIONS.map(sec => ({
    k: sec.k, name: sec.name,
    rows: [...sec.lead, ...sec.more]
      .filter(r => ccRowOffered(r) && (!defs[r].showIf || defs[r].showIf(eff)))
      .map(r => ({ v: r, label: defs[r].l })),
  })).filter(g => g.rows.length);
}
function ccRowOf(f) {
  for (const sec of CFG_SECTIONS) {
    for (const r of [...sec.lead, ...sec.more]) if (cfgRowFields(r).includes(f)) return r;
  }
  return f;
}
// The four kinds with no empty state — a grid of nine, a strip of speeds, three chips, a pair
// of colours. They are seeded from the default rather than drawn blank, because nothing lit
// reads as "hide everything", not as "unanswered".
const ccNeedsSeed = def => ['shown', 'multi', 'set', 'look'].includes(def.kind);

// ---------- a value, in words ----------
function ccWord(u, f, own, v) {
  if (own) return pbWord(f, v);
  const defs = cfgDefs();
  const dv = (u.k.player || {})[f];
  const held = dv !== undefined ? dv : (defs[f] ? defs[f].dflt : undefined);
  return `${held === undefined ? '—' : pbWord(f, held)} (default)`;
}
function ccWasWord(u, f) { return ccWord(u, f, u.c[f] !== undefined, u.c[f]); }
function ccNowWord(u, f) { return ccWord(u, f, ccOwn(u, f), ccDraft(u)[f]); }

// EVERY CHANGE, ONE PER CONFIG — the truth the wire receives.
function ccRaw() {
  const out = [];
  for (const u of ccUnits()) {
    // THE SWITCH IS NAMED, not left as the bare key. The version rail writes this change as the
    // config's name alone, which is unambiguous there because nothing else in that list is
    // shaped like it. In a queue card sitting under `shorts · Autoplay`, a row reading `shorts
    // · Off → On` is the same shape as a field change and reads as one. `Switch` is the word
    // this panel already uses for a thing that is on or off.
    if ((u.c.on !== false) !== ccOn(u)) {
      out.push({ u, field: '__on', label: `${u.c.name} · Switch`, from: u.c.on === false ? 'Off' : 'On',
        to: ccOn(u) ? 'On' : 'Off', toKey: String(ccOn(u)) });
    }
    for (const f of Object.keys(CC.edits[u.ck] || {})) {
      out.push({ u, field: f, label: `${u.c.name} · ${cfgFieldLabel(f)}`,
        from: ccWasWord(u, f), to: ccNowWord(u, f),
        toKey: JSON.stringify(CC.edits[u.ck][f] ?? null) });
    }
  }
  return out;
}

// …AND ONE ROW PER DECISION, which is what a person made. The same answer given to the same key
// on seven integrations is one line whose from-side is COUNTED across those seven — the grammar
// the Player behaviour sheet already reads in, so a queue, a card and a review never disagree
// about how many decisions are on the screen.
function ccChanges() {
  const by = new Map();
  for (const c of ccRaw()) {
    const k = `${c.u.c.name}|${c.field}|${c.toKey}`;
    if (!by.has(k)) by.set(k, []);
    by.get(k).push(c);
  }
  return [...by.values()].map(g => {
    const one = g.length === 1;
    const froms = [...new Set(g.map(x => x.from))];
    return {
      // One integration's tweak says whose it is; an answer that landed on several stands in
      // the section itself, above the per-integration blocks (see `reviewSplitWhere`).
      where: one ? `Player configs · ${g[0].u.k.name}` : 'Player configs',
      field: g[0].field,
      label: g[0].label,
      fromText: one ? froms[0]
        : froms.length === 1 ? `${froms[0]} on all ${g.length}` : `${froms.length} different values`,
      toText: g[0].to,
      cks: g.map(x => x.u.ck),
    };
  });
}

// A queued decision is dropped by the card's × as well as by its own row's — so every config it
// touched goes back to what it arrived with.
function ccDropChange(i) {
  const c = ccChanges()[i];
  if (!c) return;
  for (const ck of c.cks) {
    if (c.field === '__on') delete CC.ons[ck]; else ccClearField(ck, c.field);
  }
  CC.err = '';
  renderCCScreen();
}
function ccClearAll() {
  CC.edits = {};
  CC.ons = {};
  CC.pending = {};
  CC.err = '';
  renderCCScreen();
}

// ---------- ONE CONFIG'S OWN ROWS ----------
// A row is on a config's sheet when the config overrides it, or when somebody has picked it and
// not yet answered. Picking never answers: an override seeded at the default's value would be a
// decision that looks made before it is made.
function ccPending(ck) { return CC.pending[ck] || (CC.pending[ck] = new Set()); }
function ccRowWaiting(u, r) { return ccPending(u.ck).has(r); }
function ccRowOnSheet(u, r) { return ccRowOwn(u, r) || ccRowWaiting(u, r); }
function ccRowCount(u) {
  return CFG_SECTIONS.flatMap(sec => [...sec.lead, ...sec.more])
    .filter(r => ccRowOffered(r) && ccRowOnSheet(u, r)).length;
}

function ccPick(ck, r) {
  const u = ccUnit(ck);
  if (!u) return;
  const defs = cfgDefs();
  const def = defs[r];
  if (!def) return;
  CC.openCfg.add(ck);
  if (!ccNeedsSeed(def)) { ccPending(ck).add(r); CC.err = ''; renderCCScreen(); return; }
  const d = u.k.player || {};
  for (const f of cfgRowFields(r)) {
    const v = d[f] !== undefined ? d[f] : (defs[f] && defs[f].dflt !== undefined ? defs[f].dflt : '');
    ccWrite(u, f, deepCopy(v));
  }
  CC.err = '';
  renderCCScreen();
}
// UNPICKING AND THE ROW'S × ARE ONE ACT: the config follows its integration's default again. On
// a config that already held the override that is a real change, queued as `null`; on one that
// never did, it is simply the question going away.
function ccUnpick(ck, r) {
  const u = ccUnit(ck);
  if (!u) return;
  ccPending(ck).delete(r);
  for (const f of cfgRowFields(r)) {
    if (u.c[f] !== undefined) ccWrite(u, f, null); else ccClearField(ck, f);
  }
  CC.err = '';
  renderCCScreen();
}
function ccTogglePick(ck, r) {
  const u = ccUnit(ck);
  (u && ccRowOnSheet(u, r) ? ccUnpick : ccPick)(ck, r);
}

function ccPut(ck, f, v) {
  const u = ccUnit(ck);
  if (!u) return;
  ccWrite(u, f, v);
  ccPending(ck).delete(ccRowOf(f));
  CC.err = '';
}
function ccSet(ck, f, v) { ccPut(ck, f, v); renderCCScreen(); }
function ccChip(ck, f, o) {
  const u = ccUnit(ck);
  if (!u) return;
  const def = cfgDefs()[f];
  const cur = ccEff(u)[f] || [];
  const has = cur.some(x => String(x) === String(o));
  if (has && def.keep !== undefined && String(o) === String(def.keep)) return;
  ccSet(ck, f, has ? cur.filter(x => String(x) !== String(o)) : [...cur, o]);
}
// A timing or a threshold of 0 means OFF — a switch and a number, never a zero somebody has to
// know the meaning of. The last real value is kept while the switch is off.
const CC_LAST = {};
function ccZero(ck, f, dflt) {
  const u = ccUnit(ck);
  if (!u) return;
  const cur = ccEff(u)[f] ?? 0;
  if (cur > 0) { CC_LAST[`${ck}|${f}`] = cur; ccSet(ck, f, 0); } else ccSet(ck, f, CC_LAST[`${ck}|${f}`] || dflt);
}
// TYPING NEVER REPAINTS, or the caret goes with it: the card, the foot and the typing row's own
// marks are written in place, which is everything a repaint would have done.
function ccNum(el, ck, f) { const n = Number(el.value); if (Number.isFinite(n)) ccPut(ck, f, n); ccSync(el); }
function ccMs(el, ck, f) { const n = Number(el.value); ccPut(ck, f, Number.isFinite(n) ? Math.round(n * 1000) : 0); ccSync(el); }
function ccText(el, ck, f) { ccPut(ck, f, el.value); ccSync(el); }
// The colour picker fires continuously while the pointer moves, so the swatch and the hex are
// written in place — a repaint would destroy the very input the picker is anchored to.
function ccColor(el, ck, f) {
  ccPut(ck, f, el.value);
  el.closest('.cfg-sw').style.background = el.value;
  const hex = el.closest('.cfg-lf')?.querySelector('.cfg-hex');
  if (hex) hex.value = el.value;
  ccSync(el);
}
function ccHex(el, ck, f) {
  const v = el.value.trim();
  ccPut(ck, f, v);
  if (cfgHexOk(v)) {
    const sw = el.closest('.cfg-lf')?.querySelector('.cfg-sw');
    if (sw) { sw.style.background = v; sw.querySelector('input').value = pbHex6(v); }
  }
  ccSync(el);
}
function ccSwitch(ck, on) {
  const u = ccUnit(ck);
  if (!u) return;
  if ((u.c.on !== false) === on) delete CC.ons[ck]; else CC.ons[ck] = on;
  CC.err = '';
  renderCCScreen();
}
const ccHandlers = ck => ({
  set: (f, v) => `ccSet('${ck}', '${f}', ${v})`,
  chip: (f, v) => `ccChip('${ck}', '${f}', ${v})`,
  zero: (f, d) => `ccZero('${ck}', '${f}', ${d})`,
  num: f => `ccNum(this, '${ck}', '${f}')`,
  ms: f => `ccMs(this, '${ck}', '${f}')`,
  text: f => `ccText(this, '${ck}', '${f}')`,
  color: f => `ccColor(this, '${ck}', '${f}')`,
  hex: f => `ccHex(this, '${ck}', '${f}')`,
  repaint: () => 'renderCCScreen()',
  pick: f => (x => ccSet(ck, f, x)),
});

// ---------- folds ----------
function ccToggleKey(id) {
  CC.openKey.has(id) ? CC.openKey.delete(id) : CC.openKey.add(id);
  renderCCScreen();
}
function ccToggleCfg(ck) {
  CC.openCfg.has(ck) ? CC.openCfg.delete(ck) : CC.openCfg.add(ck);
  renderCCScreen();
}
function ccKeyDown(e, el) {
  if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); el.click(); }
}
// The row a pick just added is lit for a moment, so the eye lands where the sheet grew. A
// REFUSAL never uses it — a flagged row already wears its warning, and lighting it as well puts
// two signals on one state.
function ccGoTo(mark, lit = true) {
  requestAnimationFrame(() => {
    const el = dialogRoot().querySelector(`[data-mark="${mark}"]`);
    if (!el) return;
    el.scrollIntoView({ block: 'center' });
    if (!lit) return;
    el.classList.add('lit');
    setTimeout(() => el.classList.remove('lit'), 1500);
  });
}

// ---------- the sheet ----------
function renderCCScreen() {
  if (!CC) return;
  const keys = selectedKeys();
  const units = ccUnits();
  const changes = ccChanges();
  const was = dialogRoot().querySelector('.cc-list');
  const top = was ? was.scrollTop : 0;
  dialogRoot().innerHTML = `
    <div class="dlg-veil"><div class="dlg bulk ccx${units.length ? ' steady' : ' bare'}">
      <h3>Custom configs<span class="dlg-kicker cc-says">${esc(ccKickerText(keys, units))}</span></h3>
      <div class="dlg-body">
        <div class="bulk-split">
          <div class="bulk-fields">
            ${CC.err ? `<div class="pb-err">${esc(CC.err)}</div>` : ''}
            <div class="cc-list">${units.length ? ccBlocksHtml(keys) : ccEmptyHtml(keys)}</div>
          </div>
          ${units.length ? ccCardHtml(changes) : ''}
        </div>
      </div>
      <div class="dlg-foot">
        <span class="rvw-count">${ccFootText(changes)}</span>
        <button class="btn ghost" onclick="closeCCScreen()">${units.length ? 'Cancel' : 'Close'}</button>
        ${units.length ? `<button class="btn" id="cc-apply" ${changes.length ? '' : 'disabled'} onclick="ccApply()">Apply</button>` : ''}
      </div>
    </div></div>`;
  const list = dialogRoot().querySelector('.cc-list');
  if (list && top) list.scrollTop = top;
}

// COUNTED, AND ONLY WHAT THE READER CANNOT SEE. How many configs are on this sheet, over how
// many of the selected integrations — and, when some carry none, that fact rather than a
// silence the reader has to count rows to discover.
function ccKickerText(keys, units) {
  if (!units.length) return `None of the ${keys.length} selected carries a custom config`;
  const withCfg = new Set(units.map(u => u.k.id)).size;
  const none = keys.length - withCfg;
  return `${units.length} config${units.length === 1 ? '' : 's'} on ${withCfg} of ${keys.length} selected`
    + (none ? ` · ${none} carr${none === 1 ? 'ies' : 'y'} none` : '');
}
function ccFootText(changes) {
  if (!changes.length) return '';
  const cks = new Set();
  for (const c of changes) for (const ck of c.cks) cks.add(ck);
  const n = new Set([...cks].map(ck => ck.split('::')[0])).size;
  return `${changes.length} change${changes.length === 1 ? '' : 's'} · ${cks.size} config${cks.size === 1 ? '' : 's'} on ${n} integration${n === 1 ? '' : 's'}`;
}
function ccEmptyHtml(keys) {
  return `<div class="cc-empty">
    <b>Nothing to show yet</b>
    <span>A custom config is created on an integration, by the key a player asks for it by.
      None of the ${keys.length} selected carries one.</span>
  </div>`;
}

// ---------- THE LIST: a block per integration, its configs one under another ----------
function ccBlocksHtml(keys) {
  return keys.map(k => {
    const cfgs = (k.playerConfigs || []).map(c => ({ k, c, ck: ccId(k.id, c.name) }));
    if (!cfgs.length) return '';
    const open = CC.openKey.has(k.id);
    const moved = cfgs.filter(u => CC.edits[u.ck] || CC.ons[u.ck] !== undefined).length;
    return `
      <section class="cc-blk${open ? ' open' : ''}">
        <div class="cc-bh" role="button" tabindex="0" onclick="ccToggleKey('${k.id}')" onkeydown="ccKeyDown(event, this)">
          <span class="cc-cv">▾</span>
          ${propBadge(k.property)}
          <span class="cc-bn">${esc(k.name)}</span>
          <span class="cc-bm">${esc(label('platform', k.platform))}</span>
          <span style="flex:1"></span>
          ${moved ? `<span class="cc-moved">${moved} changed</span>` : ''}
          <span class="cc-bc">${cfgs.length} config${cfgs.length === 1 ? '' : 's'}</span>
        </div>
        ${open ? `<div class="cc-cfgs">${cfgs.map(ccCfgHtml).join('')}</div>` : ''}
      </section>`;
  }).join('');
}

// ONE CONFIG: its key, what it overrides, and its switch — then the settings themselves.
//
// THE COUNT IS THE CONTROL (15 Sep, third cut, user call — *"this override a setting can it be
// handled more maturely"*). It was a blue `+ Override a setting` link under each config's rows:
// seven of them down a list, a verb repeated seven times, in the one place a reader is trying to
// compare values. What it actually answers is "which settings does this config override" — and
// the honest form of that question is the COUNT, which the header was already printing as a
// dead fact. So the fact became the door: `Overrides 3 settings ▾` opens the checklist, in the
// header where the config's identity lives, reported whether the config is open or shut. One
// control per config, wearing a micro-label, reading as a fact rather than an invitation — the
// panel's own grammar (a fact is the door; see the integration page's own settings block).
function ccCfgHtml(u) {
  const open = CC.openCfg.has(u.ck);
  const off = !ccOn(u);
  const moved = !!(CC.edits[u.ck] || CC.ons[u.ck] !== undefined);
  return `
    <div class="cc-cfg${open ? ' open' : ''}${off ? ' off' : ''}${moved ? ' chg' : ''}" data-mark="cfg-${u.ck}">
      <div class="cc-ch">
        <span class="cc-chd" role="button" tabindex="0" onclick="ccToggleCfg('${u.ck}')" onkeydown="ccKeyDown(event, this)">
          <span class="cc-cv">▾</span>
          <span class="cc-key mono">${esc(u.c.name)}</span>
          ${off ? '<span class="pc-off">Off</span>' : ''}
        </span>
        <span class="cc-acts">
          ${ccOverridesHtml(u)}
          <span class="toggle tiny${off ? '' : ' on'}"
            title="${off ? 'Off — players asking for this key get the default' : 'On — players asking for this key get it'}"
            onclick="ccSwitch('${u.ck}', ${off})"><span class="track"></span></span>
        </span>
      </div>
      ${open ? ccCfgBodyHtml(u) : ''}
    </div>`;
}

// WHICH SETTINGS THIS CONFIG OVERRIDES — counted, and the way to change which. The same
// checklist the integration page draws, with the count as its face instead of `Choose
// settings…`: a control that REPORTS at rest and offers when opened, which is what lets one
// control stand where a label and a link used to stand apart.
function ccOverridesHtml(u) {
  const defs = cfgDefs();
  const eff = ccEff(u);
  const n = ccRowCount(u);
  const h = {
    open: CC.cfgPick === u.ck,
    // OPENING IT MAKES ROOM FOR IT. The menu is ten to twenty-nine rows tall and it hangs inside
    // the list's own scroller, which clips it — so a config near the bottom would open a
    // checklist with two rows showing. Opening scrolls that config to the top of the list first,
    // where the full menu fits under it. (`scroll-margin-top` clears the pinned header.)
    setOpen: v => {
      CC.cfgPick = v ? u.ck : '';
      renderCCScreen();
      if (v) requestAnimationFrame(() => dialogRoot()
        .querySelector(`[data-mark="cfg-${u.ck}"]`)?.scrollIntoView({ block: 'start' }));
    },
    has: r => ccRowOnSheet(u, r),
    off: () => '',
    toggle: r => ccTogglePick(u.ck, r),
    toggleAll: k => {
      const sec = CFG_SECTIONS.find(x => x.k === k);
      const rows = [...sec.lead, ...sec.more].filter(r => ccRowOffered(r) && (!defs[r].showIf || defs[r].showIf(eff)));
      const giveBack = rows.every(r => ccRowOnSheet(u, r));
      for (const r of rows) (giveBack ? ccUnpick : ccPick)(u.ck, r);
    },
  };
  return `<span class="cc-ov">
      <span class="cc-ov-l">Overrides</span>
      ${pickerHtml(ccCatalogue(eff), h, { ph: n ? `${n} setting${n === 1 ? '' : 's'}` : 'nothing yet' })}
    </span>`;
}

// A CONFIG'S BODY: the settings it overrides, as rows. Nothing else — the control that decides
// WHICH settings those are lives in the header (`ccOverridesHtml`), because it is a fact about
// the config, and the body is for moving values.
function ccCfgBodyHtml(u) {
  const defs = cfgDefs();
  const eff = ccEff(u);
  // THE SECTION BAND EARNS ITS PLACE ONLY WHERE IT SEPARATES SOMETHING. On the integration's own
  // config sheet there are three sections and up to twenty-nine rows, so the bands are the map.
  // Here a config's rows sit two levels inside a list, under a key that already heads them, and
  // most configs override a handful of settings in ONE section — where a full-bleed tinted band
  // is furniture around a single group. Drawn when the rows actually span more than one section.
  const open = CFG_SECTIONS.map(sec => ({
    sec, rows: [...sec.lead, ...sec.more].filter(r => ccRowOffered(r) && ccRowOnSheet(u, r)),
  })).filter(x => x.rows.length);
  const band = open.length > 1;
  const secs = open.map(({ sec, rows }) => `
    <section class="sh-sec">
      ${band ? `<div class="sh-sh"><h4>${esc(sec.name)}</h4></div>` : ''}
      ${rows.map(r => ccRowHtml(u, r, defs[r], eff)).join('')}
    </section>`).join('');
  return `<div class="cc-rows">
      ${secs || '<div class="cc-follows">Follows the default in everything</div>'}
    </div>`;
}

function ccRowHtml(u, r, def, eff) {
  const na = def.na ? def.na(eff) : '';
  const tall = def.kind === 'look' || def.kind === 'shown';
  const waiting = ccRowWaiting(u, r);
  const moved = cfgRowFields(r).some(f => (CC.edits[u.ck] || {})[f] !== undefined);
  return `
    <div class="sh-row cfg${moved ? ' own' : ''}${na ? ' na' : ''}${tall ? ' tall' : ''}${waiting ? ' unset' : ''}${
      waiting && CC.err ? ' needs' : ''}" data-mark="row-${u.ck}-${r}" data-r="${r}"${na ? ` title="${esc(na)}"` : ''}>
      <span class="sh-l"${def.hint ? ` title="${esc(def.hint)}"` : ''}>${esc(def.l)}</span>
      <span class="sh-c">${cfgCtlHtml(r, def, eff, na, ccHandlers(u.ck), { unset: waiting, pair: true })}</span>
      ${ccTailHtml(u, r, def, waiting)}
    </div>`;
}

// WHAT IT WOULD OTHERWISE BE, AND THE WAY BACK — this integration's OWN default beside this
// config's answer, so an override reads as WAS → NOW where it is made. The × returns the row to
// following that default.
function ccTailHtml(u, r, def, waiting) {
  const x = `<button type="button" class="sh-x" title="Follow the default again"
      aria-label="Follow the default again" onclick="ccUnpick('${u.ck}', '${r}')">×</button>`;
  if (waiting) return `<span class="sh-tail">${x}</span>`;
  const d = u.k.player || {};
  const own = ccDraft(u);
  const same = cfgRowFields(r).every(f => JSON.stringify(own[f] ?? null) === JSON.stringify(d[f] ?? null));
  const tall = def.kind === 'look' || def.kind === 'shown';
  const word = same || tall ? '' : pcWord(r, def, d);
  return `<span class="sh-tail">
      ${same ? '<span class="sh-dflt">same as default</span>' : (word ? `<span class="sh-dflt"><i>default</i>${esc(word)}</span>` : '')}
      ${x}
    </span>`;
}

// ---------- the queue card ----------
function ccCardHtml(changes) {
  return changesCardHtml(changes.map((c, i) => ({
    label: c.label, from: c.fromText, to: c.toText, drop: `ccDropChange(${i})`,
  })), { clear: 'ccClearAll()', empty: 'Nothing changed yet', max: 4 });
}
// Written in place while somebody types — the card, the foot and the typing row's own marks,
// never the list under the caret.
function ccSync(el) {
  const changes = ccChanges();
  const card = dialogRoot().querySelector('.bqp');
  if (card) card.outerHTML = ccCardHtml(changes);
  const c = dialogRoot().querySelector('.rvw-count');
  if (c) c.textContent = ccFootText(changes);
  const btn = document.getElementById('cc-apply');
  if (btn) btn.disabled = !changes.length;
  if (!el) return;
  const row = el.closest('.sh-row');
  const cfg = el.closest('.cc-cfg');
  const ck = cfg && cfg.dataset.mark.slice(4);
  if (row && ck) row.classList.toggle('own', cfgRowFields(row.dataset.r).some(f => (CC.edits[ck] || {})[f] !== undefined));
  if (cfg && ck) cfg.classList.toggle('chg', !!(CC.edits[ck] || CC.ons[ck] !== undefined));
}

// ---------- apply ----------
// REFUSED IN PLACE, BY NAME, BEFORE THE REVIEW. A setting somebody picked and never answered is
// not quietly dropped and not silently disabled — the sheet says which one is waiting, on which
// config of which integration, marks it, and goes no further.
async function ccApply() {
  if (!CC) return;
  for (const u of ccUnits()) {
    const waiting = [...ccPending(u.ck)];
    if (!waiting.length) continue;
    const names = waiting.map(cfgFieldLabel);
    const one = names.length === 1;
    const list = one ? names[0] : `${names.slice(0, -1).join(', ')} and ${names[names.length - 1]}`;
    CC.err = `${list} ${one ? 'has' : 'have'} no value yet on “${u.c.name}” · ${u.k.name}`
      + ` — set ${one ? 'it' : 'them'} or take ${one ? 'it' : 'them'} off the sheet.`;
    CC.openKey.add(u.k.id);
    CC.openCfg.add(u.ck);
    renderCCScreen();
    ccGoTo(`row-${u.ck}-${waiting[0]}`, false);
    return;
  }
  const changes = ccChanges();
  if (!changes.length) {
    CC.err = 'Nothing to apply — every value on this sheet is what these configs already hold.';
    renderCCScreen();
    return;
  }
  const keys = selectedKeys();
  // BACK LEAVES THE SHEET EXACTLY AS IT WAS — the queue, and which folds were open, because
  // re-opening the one you were working in is work the review did not ask for.
  const back = deepCopy({ edits: CC.edits, ons: CC.ons });
  const backOpenKey = new Set(CC.openKey);
  const backOpenCfg = new Set(CC.openCfg);
  const edits = ccWireEdits();
  const touched = new Set(edits.map(e => e.id));
  closeCCScreen();
  const ok = await reviewChanges({
    title: `Apply to ${touched.size} integration${touched.size > 1 ? 's' : ''}?`,
    kicker: [...touched].slice(0, 2).map(id => keys.find(k => k.id === id)?.name).filter(Boolean).join(', ')
      + (touched.size > 2 ? ` +${touched.size - 2} more` : ''),
    changes,
    okLabel: `Apply to ${touched.size}`,
    cancelLabel: 'Back',
    steady: 'player',
  });
  if (!ok) {
    CC = { ...back, pending: {}, openKey: backOpenKey, openCfg: backOpenCfg, cfgPick: '', err: '' };
    renderCCScreen();
    return;
  }
  await bulkApplyDirect('configFields', { edits });
  await refreshKeysList();
}

// THE QUEUE, RESOLVED FOR THE WIRE: one edit per config, carrying only what moved. The server
// takes a list of per-config changes and nothing else.
function ccWireEdits() {
  const out = [];
  for (const u of ccUnits()) {
    const fields = CC.edits[u.ck];
    const on = CC.ons[u.ck];
    const onMoved = on !== undefined && (u.c.on !== false) !== on;
    if (!fields && !onMoved) continue;
    out.push({ id: u.k.id, config: u.c.name, ...(fields ? { fields: { ...fields } } : {}), ...(onMoved ? { on } : {}) });
  }
  return out;
}
