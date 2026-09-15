// views-keys-editor-load.js — the INTEGRATION PAGE, where it starts: `viewKeyForm(id)`
// loads the integration (or seeds a blank/copy), sets the form session and the save
// baseline, and owns WHICH AD SETUP FILLS IT — the map/change flow, "use a copy", the
// picker cards, and stash-and-return (KEY_RETURN/KEY_RESTORE) so the one trip that still
// leaves this page — building a new setup — comes back with every unsaved edit intact.
// Reading a setup never leaves the page at all: it opens in its own tab.
//
// The rest of the page, in load order after this file:
//   views-keys-editor-ad-behaviour.js  the Ad behaviour card (the drive, break tabs)
//   views-keys-editor-player.js        the player fields and custom configs
//   views-keys-editor-frame.js         the page frame, and what Save writes
// ---------- create / edit form (the product team's one page) ----------

let KEY_ORIGINAL = null;
let KEY_ORIG_CANON = null;
async function viewKeyForm(id) {
  const meta = await getMeta();
  KL_META = meta;
  // All setups, not just the scoped property — a shared backfill setup may span properties.
  const { setups } = await API.listSetups();
  SETUPS_CACHE = setups;

  // Coming BACK from the setup editor: the page picks up exactly the draft it left
  // with — every unsaved edit intact — and maps the setup created over there, if any.
  const restore = KEY_RESTORE && KEY_RESTORE.keyId === (id || null) ? KEY_RESTORE : null;
  KEY_RESTORE = null;

  let data;
  if (id) {
    const [{ key }] = await Promise.all([API.getKey(id), loadPublish('key', id, '')]);
    KEY_ORIGINAL = key;
    PUB.name = key.name;
    PUB.onRestored = () => viewKeyForm(id);
    data = {
      name: key.name, property: key.property, platform: key.platform,
      domains: [...key.domains], packageName: key.packageName,
      adSetupId: key.adSetupId || '',
      player: deepCopy(key.player),
      playerConfigs: deepCopy(key.playerConfigs || []),
      // The quick decisions — key-level, sparse, intent only (DRIVING-SCOPE).
      drive: key.drive ? deepCopy(key.drive) : {},
      sections: key.sections.map(s => ({
        name: s.name, isDefault: s.isDefault,
        slots: Object.fromEntries(meta.slotTypes.map(t => [t, { on: s.slots[t].on }])),
      })),
    };
    KEY_ORIG_CANON = keyPayload(deepCopy(data));
    PUB.dirty = () => !!KEY_ORIG_CANON && formDiff(KEY_ORIG_CANON, keyPayload(FORM.data), KEY_FIELDS).length > 0;
    PUB.saveNow = opts => saveKeyClicked(opts);
    if (restore) data = restore.data;
  } else {
    KEY_ORIGINAL = null;
    KEY_ORIG_CANON = null;
    pubClear();
    const seed = KEY_CREATE_SEED;
    KEY_CREATE_SEED = null;
    if (restore) {
      data = restore.data;
    } else if (seed) {
      // A PHOTOCOPY of an existing surface (3 Sep, the chooser): identity to retype,
      // everything else carried — player, named configs, switches, drive, the setup
      // mapping. The source's setup becomes this integration's OWN COPY at create
      // (`copyAtCreate`) — a photocopy of a surface is a scratch surface, and demand it
      // shares with the original is demand an experiment can move under it. Sharing is
      // legal since 8 Sep, so it is a click away: Change ad setup → Use. Until create
      // the page reads the original, which is what the copy is.
      data = {
        copyAtCreate: !!seed.adSetupId,
        name: `${seed.name} copy`, property: seed.property, platform: seed.platform,
        domains: [...(seed.domains || [])], packageName: seed.packageName || '',
        presetName: '', copiedFrom: seed.name,
        adSetupId: seed.adSetupId || '',
        drive: seed.drive ? deepCopy(seed.drive) : {},
        player: deepCopy(seed.player),
        // WHERE THE DEFAULT PLAYER STARTED (14 Sep) — a page fact, never a payload field.
        // The Default card measures itself against it (`VideoShow preset · 3 changed`),
        // and the create review reads as the seed plus what moved off it.
        playerSeed: deepCopy(seed.player),
        playerConfigs: (seed.playerConfigs || []).map(({ id, ...rest }) => deepCopy(rest)),
        sections: seed.sections.map(s => ({
          name: s.name, isDefault: s.isDefault,
          slots: Object.fromEntries(meta.slotTypes.map(t => [t, { on: !!s.slots[t]?.on }])),
        })),
      };
    } else {
      // Blank starts from a PRESET — a photocopy of a starting shape, never a live
      // link — and fully off: nothing can run until an ad setup is mapped.
      const pPreset = meta.playerPresets[meta.playerPresets.length - 1];
      data = {
        name: '', property: 'TOI', platform: 'mweb',
        domains: [], packageName: '', presetName: pPreset.name,
        adSetupId: '',
        drive: {},
        player: deepCopy(pPreset.values),
        playerSeed: deepCopy(pPreset.values),
        playerConfigs: [],
        sections: [{
          name: 'Default', isDefault: true,
          slots: Object.fromEntries(meta.slotTypes.map(t => [t, { on: false }])),
        }],
      };
    }
  }
  KEY_SLOT = restore ? restore.slot : 'preroll';
  for (const k of Object.keys(QF_TEXT)) delete QF_TEXT[k];
  startForm(data, () => renderKeyForm(meta));
  FORM.saved = KEY_ORIGINAL ? deepCopy(data) : null;
  formDeps({
    web: d => meta.webPlatforms.includes(d.platform),
    app: d => !meta.webPlatforms.includes(d.platform),
  });
  renderKeyForm(meta);
  if (restore && restore.mapSetupId) {
    const made = SETUPS_CACHE.find(x => x.id === restore.mapSetupId);
    if (made) attachSetupToForm(made);
  }
}

// The key's ONE setup, from the live setups cache — the strip's counted facts always
// reflect the form's CURRENT attachment, not the last save. `i` stays in the signature
// because every caller thinks per section; the setup is the same for all of them.
function sectionSetup(i) {
  return SETUPS_CACHE.find(s => s.id === (FORM.data.adSetupId || '')) || null;
}

// The setup-side placement this section overlays — matched by name, like the server.
function setupPlacement(i) {
  const setup = sectionSetup(i);
  const name = FORM.data.sections[i]?.name;
  return setup ? (setup.sections || []).find(x => x.name === name) || null : null;
}

// How this slot behaves — the attached setup's placement says so. One accessor, so
// every fact on this page traces to the room that owns it.
function slotBhv(i, t) {
  return setupPlacement(i)?.slots?.[t]?.behaviour || null;
}





// ---------- THE SETUP IS SEEN IN ITS OWN EDITOR (3 Sep, user call) ----------
// The read-only preview modal is gone: it was a second, poorer rendering of a screen
// that already exists. "Open" now NAVIGATES to the ad setup's real editor — the page
// with the ladders, the versions, the truth — and the ← there brings you back HERE,
// with every unsaved edit on this page intact. The integration draft is stashed before
// leaving and restored on return; creating a setup over there lands back here mapped.
let KEY_RETURN = null;   // { keyId|null, name, data, slot, expect: setupId|'new' }
let KEY_RESTORE = null;  // consumed by viewKeyForm: { keyId|null, data, slot, mapSetupId? }

function keyStash(expect) {
  KEY_RETURN = {
    keyId: KEY_ORIGINAL ? KEY_ORIGINAL.id : null,
    name: (FORM.data.name || '').trim() || (KEY_ORIGINAL ? KEY_ORIGINAL.name : 'the new integration'),
    data: FORM.data, slot: KEY_SLOT, expect,
  };
}

// The ad setup lives in ANOTHER ROOM, so it opens in ITS OWN TAB (8 Sep, user call):
// the integration you are editing stays exactly where it is, with every unsaved edit on
// screen, and the setup's real page — ladders, versions, history — opens beside it.
// Nothing to stash, nothing to come back to; the ← that used to carry you home is only
// needed by the create trip below, which still has to land the new setup on this page.
function openSetupTab(id) {
  window.open(`${location.pathname}${location.search}#setups/${id}`, '_blank', 'noopener');
}

// The blank card and the change-modal's blank card: the setup's REAL creation editor,
// prefilled for this surface; its Create returns here with the new setup mapped.
function newSetupFromKey() {
  closeDialog();
  keyStash('new');
  SETUP_CREATE_SEED = null;
  SETUP_CREATE_PREFILL = {
    name: `${(FORM.data.name || '').trim() || 'New integration'} demand`,
    property: FORM.data.property,
  };
  history.replaceState(null, '', '#setups/new');
  viewSetupForm(null);
}

// Back from the setup editor — with a setup to map when one was just created there.
async function returnToKey(mapSetupId) {
  const ret = KEY_RETURN;
  KEY_RETURN = null;
  if (!ret) { location.hash = '#setups'; return; }
  KEY_RESTORE = { keyId: ret.keyId, data: ret.data, slot: ret.slot, mapSetupId: mapSetupId || null };
  if (ret.keyId) {
    if (location.hash === `#keys/${ret.keyId}`) await viewKeyForm(ret.keyId);
    else location.hash = `#keys/${ret.keyId}`;
  } else {
    history.replaceState(null, '', '#keys/new');
    await viewKeyForm(null);
  }
}

// CHANGE IS A SWAP, NEVER A BLANK PAGE (8 Sep, user call): the modal offers the ad
// setups that ALREADY EXIST ON THIS INTEGRATION'S PROPERTY and nothing else — no "new"
// card (a setup is built in its own room, where its ladders and versions live), and no
// other property's demand, which could never legitimately fill this surface. Changing
// the setup of a live integration is a swap between known things, so the door only ever
// shows known things.
//
// AND IT IS A JOURNEY OF TWO SCREENS (8 Sep, user call — *"let's have the Use or Copy &
// use as CTA on the bottom when changing, and accordingly the second screen shows up
// with clean communication, and once the user confirms it attaches"*). Picking and
// acting were the same click: a card WAS the act, so a swap on a live integration
// happened the instant a name was clicked. Now the cards SELECT — one at a time, the
// selection visible — and the acts sit where a dialog's acts belong, in the foot, at
// full size. They are only drawn once something is selected (an act with no object is
// not a button, it is a question), and the foot says in one line why an act is missing
// rather than showing it dead.
//
// BOTH SCREENS LIVE IN ONE FRAME (8 Sep, user call — *"the size of the modal should not
// change, it should remain the same"*). Step two was a 440 confirm (or a 620 sheet for
// the copy) thrown over an 860 picker, so the dialog appeared to be REPLACED mid-journey
// and the foot the eye had just learned moved twice. Now the head, the body and the foot
// swap INSIDE a fixed 860 × 560 frame: one dialog turning a page. Back returns to the
// cards with the selection and the filter still there, because the person is still
// choosing.
let CHG_PICK = null;   // the selected card, kept across the trip to the second screen
let CHG_Q = '';        // …and its search box, so coming back does not re-type the filter
let CHG_STEP = 'pick'; // 'pick' | 'use' | 'copy' — which page of the one dialog stands
let CHG_NAME = null;   // the copy's name while step two stands, so Back never re-types it

function chgClose() {
  closeDialog();
  CHG_PICK = null;
  CHG_Q = '';
  CHG_STEP = 'pick';
  CHG_NAME = null;
}

// The OTHER integrations a setup fills — company now, not a refusal (8 Sep). Every
// door reads it the same way, so "who else asks from this" is one sentence everywhere.
function otherHolders(s) {
  const mine = KEY_ORIGINAL ? KEY_ORIGINAL.name : null;
  return (s?.usedByNames || []).filter(n => n !== mine);
}
function holdersWords(names) {
  return names.length === 1 ? `“${names[0]}”`
    : names.length === 2 ? `“${names[0]}” and “${names[1]}”`
    : `“${names[0]}” and ${names.length - 1} more`;
}

// The selected setup, and what this page may do with it. One reading, three answers.
function chgState() {
  const s = SETUPS_CACHE.find(x => x.id === CHG_PICK) || null;
  return {
    setup: s,
    current: !!s && s.id === FORM.data.adSetupId,
    shared: otherHolders(s),
  };
}

// One property's setups, newest work first — the same list both doors show.
function chgList() {
  const prop = FORM.data.property;
  return SETUPS_CACHE.filter(s => inScope(s.property) && s.property === prop)
    .sort((a, b) => (b.updatedAt || '').localeCompare(a.updatedAt || ''));
}

// THE ACTS, IN THE FOOT. Nothing selected: the line asks for a selection. The current
// setup: it is already the answer, so there is nothing to press. Anything else offers
// BOTH acts (8 Sep, since a setup may fill many integrations): `Use` links this surface
// to that very setup — the ladder then moves for everyone who asks from it — and
// `Copy & use` takes a photocopy that moves for nobody else. Where a setup is already
// shared the foot says so in the same breath, because that is what the choice is about.
// On step two the same foot carries the way back and the one act that lands.
function chgFootHtml() {
  const { setup, current, shared } = chgState();
  if (CHG_STEP !== 'pick') {
    return `<button class="btn ghost" onclick="chgGo('pick')">Back</button>
      <button class="btn go" onclick="chgConfirm()">${CHG_STEP === 'use' ? 'Use it'
        : KEY_ORIGINAL ? 'Copy &amp; use' : 'Copy at create'}</button>`;
  }
  const why = !setup ? 'Pick an ad setup'
    : current ? 'Already fills this integration'
    : shared.length ? `also fills ${holdersWords(shared)}`
    : '';
  const acts = !setup || current ? ''
    : `<button class="btn ghost" onclick="chgGo('copy')">Copy &amp; use</button>
       <button class="btn" onclick="chgGo('use')">Use</button>`;
  return `${why ? `<span class="chg-why">${esc(why)}</span>` : ''}
    <button class="btn ghost" onclick="chgClose()">Cancel</button>
    ${acts}`;
}

// Selecting repaints the SELECTION AND THE FOOT BY HAND, never the dialog: the search
// box above the cards is a live input, and a repaint would swallow what was typed.
// A card that takes focus has to answer the keyboard too — Enter and Space select, the
// same act the click runs.
function scCardKey(e, id) {
  if (e.key !== 'Enter' && e.key !== ' ') return;
  e.preventDefault();
  chgSelect(id);
}

function chgSelect(id) {
  CHG_PICK = id;
  document.querySelectorAll('#dialog-root .sc-card').forEach(c => {
    const on = c.dataset.id === id;
    c.classList.toggle('sel', on);
    if (c.getAttribute('role') === 'radio') c.setAttribute('aria-checked', on ? 'true' : 'false');
  });
  const foot = document.getElementById('chg-foot');
  if (foot) foot.innerHTML = chgFootHtml();
}

// ---------- the one frame, painted for whichever step stands ----------

function changeSetupJourney() {
  if (!chgList().some(s => s.id === CHG_PICK)) CHG_PICK = null;
  CHG_STEP = 'pick';
  CHG_NAME = null;
  chgPaint();
}

// Step two is reached with a selection and nothing else: the copy's name is seeded once,
// here, so backing out and returning keeps whatever was typed.
function chgGo(step) {
  const { setup, current } = chgState();
  if (step !== 'pick' && (!setup || current)) return;
  if (step === 'copy' && CHG_NAME === null) CHG_NAME = copyNameSeed();
  CHG_STEP = step;
  chgPaint();
}

function chgPaint() {
  const step = CHG_STEP;
  const prop = FORM.data.property;
  const head = step === 'pick'
    ? { t: 'Change ad setup', k: `${prop} ad setups — one fills every break` }
    : step === 'use'
      ? { t: 'Use this ad setup', k: 'what the swap changes, before it lands' }
      : { t: 'Copy & use', k: 'a photocopy of it, this integration’s own' };
  dialogRoot().innerHTML = `
    <div class="dlg-veil"><div class="dlg wide chgdlg">
      <h3>${esc(head.t)}<span class="dlg-kicker">${esc(head.k)}</span></h3>
      <div class="dlg-body ${step === 'pick' ? '' : 'mid'}">${step === 'pick' ? chgPickHtml() : chgStepTwoHtml(step)}</div>
      <div class="dlg-foot" id="chg-foot">${chgFootHtml()}</div>
    </div></div>`;
  if (step === 'pick') {
    const q = document.querySelector('#dialog-root .sp-search');
    if (q) {
      q.addEventListener('input', () => { CHG_Q = q.value; });
      if (CHG_Q) { q.value = CHG_Q; spFilter(q); }
    }
  }
  if (step === 'copy') {
    const input = document.getElementById('chg-copy-name');
    const echo = document.getElementById('chg-echo');
    if (input) {
      // The name is echoed in the After card as it is typed — one imperative write, so
      // the caret never moves and the field is never re-rendered under it.
      input.addEventListener('input', () => {
        CHG_NAME = input.value;
        if (echo) echo.textContent = input.value.trim() || 'the copy';
        chgClearNameErr();
      });
      input.focus();
      input.setSelectionRange(input.value.length, input.value.length);
    }
  }
  wireVeilDismiss(dialogRoot(), chgClose);
}

function chgPickHtml() {
  const mine = KEY_ORIGINAL ? KEY_ORIGINAL.name : null;
  const list = chgList();
  return `
    ${spBarHtml(list.length, 0, '')}
    ${list.length
      ? `<div class="dlg-cards" role="radiogroup" aria-label="Ad setups">${list.map(s => setupMapCardHtml(s, mine, null)).join('')}</div>`
      : `<div class="dlg-none">No ad setup on ${esc(FORM.data.property)} yet — one is built in Ad setups.</div>`}`;
}

// ---------- STEP TWO: THE SWAP, READ BEFORE IT IS PAID (8 Sep, re-cut) ----------
// The screen answers three questions in the order they are asked: WHAT replaces WHAT
// (two plates and an arrow, each wearing the listing's own marks), what the swap COSTS
// (a short list, one clause a line), and — for a copy — what the new thing is CALLED.
// Everything that would once have been a paragraph is a line in the list, and the one
// consequence that costs something keeps its warn banner at the foot of the reading.
function chgPlateHtml(o) {
  const s = o.setup;
  return `
    <div class="swap-side">
      <span class="swap-l">${esc(o.when)}</span>
      <div class="swap-plate ${o.when === 'After' ? 'to' : ''}">
        <div class="swap-name">${propBadge(s.property)}<span class="swap-nm">${o.nameHtml}</span></div>
        ${o.sub ? `<div class="swap-sub">${esc(o.sub)}</div>` : ''}
        <div class="swap-chips">${setupChipsHtml(s)}</div>
        <div class="swap-cnt">${esc(setupSummary(s))}</div>
        ${o.meta ? `<div class="swap-meta">${esc(s.updatedBy || 'ad ops')} · ${esc(relWhen(s.updatedAt))}</div>` : ''}
      </div>
    </div>`;
}

function chgStepTwoHtml(step) {
  const { setup, shared } = chgState();
  const now = sectionSetup(0);
  const dropped = droppedBySetup(setup);
  const copy = step === 'copy';
  const facts = [];
  if (copy) {
    facts.push(`The copy carries everything “${setup.name}” has — placements, ad units, deals and settings.`);
    facts.push(`“${setup.name}” is untouched: tuning this copy later moves nothing else.`);
    facts.push(KEY_ORIGINAL
      ? 'The copy is made when you confirm; the map leaves this page when you save.'
      : 'The copy is made when this integration is created.');
  } else {
    facts.push(`Every break on this integration asks “${setup.name}” instead.`);
    if (shared.length) {
      facts.push(`${holdersWords(shared)} ${shared.length > 1 ? 'ask' : 'asks'} from it too — an edit there moves ${shared.length > 1 ? 'them all' : 'both'}.`);
    }
    facts.push('Nothing leaves the page until you save.');
  }
  return `
    <div class="chg2">
      <div class="swap">
        ${now
          ? chgPlateHtml({ setup: now, when: 'Now', nameHtml: esc(now.name), meta: true })
          : `<div class="swap-side"><span class="swap-l">Now</span>
              <div class="swap-plate empty">Nothing fills this integration yet</div></div>`}
        <i class="swap-arr" aria-hidden="true">→</i>
        ${chgPlateHtml({
          setup, when: 'After', meta: !copy,
          nameHtml: copy ? `<span id="chg-echo">${esc((CHG_NAME || '').trim() || 'the copy')}</span>` : esc(setup.name),
          sub: copy ? `a copy of “${setup.name}”` : '',
        })}
      </div>
      ${copy ? `<div class="chg-name field grow" data-dfield="name">
        <label for="chg-copy-name">Name the copy</label>
        <input type="text" id="chg-copy-name" value="${esc(CHG_NAME || '')}" autocomplete="off">
      </div>` : ''}
      <div class="chg-what">
        <div class="chg-wh">What changes</div>
        <ul class="chg-wl">${facts.map(f => `<li>${esc(f)}</li>`).join('')}</ul>
      </div>
      ${dropped.length ? `<div class="banner warn chg-warn">${esc(droppedWords(dropped))}</div>` : ''}
    </div>`;
}

// A refused name is refused WHERE IT WAS TYPED (the askForm rule, kept by hand here):
// the field goes red with the reason under it and what was typed stays put.
function chgClearNameErr() {
  const f = document.querySelector('#dialog-root [data-dfield="name"]');
  if (!f) return;
  f.classList.remove('err');
  f.querySelector('.field-err')?.remove();
}
function chgNameErr(message) {
  const f = document.querySelector('#dialog-root [data-dfield="name"]');
  if (!f) { toast(message, 'bad'); return; }
  f.classList.add('err');
  f.insertAdjacentHTML('beforeend', `<div class="field-err">${esc(message)}</div>`);
  f.querySelector('input')?.focus();
}

// The act at the end of the journey. `Use` has nothing to write — the map lands in the
// form, like every other edit on this page — so it closes and attaches. `Copy & use`
// makes a new object, so the write runs WHILE THE DIALOG STILL STANDS: only a copy that
// lands closes it, and a refused name is retyped where it was typed.
async function chgConfirm() {
  const { setup, current } = chgState();
  if (!setup || current) return;
  if (CHG_STEP === 'use') {
    chgClose();
    attachSetupToForm(setup, true);   // the screen said what drops; the pill would repeat it
    return;
  }
  const name = (CHG_NAME || '').trim();
  const go = document.querySelector('#chg-foot .btn.go');
  chgClearNameErr();
  if (go) go.disabled = true;
  try {
    const made = await makeSetupCopy(setup, name);
    chgClose();
    finishSetupCopy(made, setup, name);
  } catch (e) {
    if (go) go.disabled = false;
    chgNameErr((e.errors && e.errors[0] && e.errors[0].message) || e.message);
  }
}

// ONE CARD GRAMMAR FOR BOTH DOORS, IN TWO MOODS (8 Sep, third cut then fourth):
//   the in-section picker  — nothing fills this integration yet, so a card IS the act:
//                            `Use` and `Use a copy` in its foot.
//   the change modal       — something already fills it, so a card is a CHOICE: it
//                            selects, and the acts live in the dialog's foot.
//
// IT WEARS THE LISTING'S OWN COLUMNS (8 Sep, user call — *"use the metadata present on
// the listing page; the one selected should be shown as selected with a border and a
// tick mark on the top right, how you see on many enterprise products"*). The card used
// to say name · property · "pre 2 · mid 2 · post — · out —" and hide its acts until
// hover, which read as a chip of engineering shorthand with something moving in the
// corner. Now it is the Ad Setups row, stood up: the property monogram beside the name,
// the SAME break chips the listing lights, the live version, who touched it last and
// when, and which integrations it fills — read down a label column, never as a sentence.
// The selection is a 2px accent frame and a filled tick in the top-right corner, the
// mark reserved at every size so nothing reflows when it appears. A copy is a NEW
// OBJECT, so it is only ever made by pressing its own button, never by a click on the
// card body; and only the setup already filling THIS integration has nothing to press —
// it wears "Current". `held` paints the card in the DOM but hidden: the in-page picker
// rests at six and its search reveals the rest (see setupPickFilter).
const SC_TICK = `<span class="sc-tick" aria-hidden="true"><svg viewBox="0 0 16 16" width="11" height="11"
    fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"
  ><path d="M3.6 8.5l2.9 2.9 5.9-6.3"/></svg></span>`;

// "Elsewhere", drawn once: the word Preview carries the act, the icon says which room.
const EXT_ICON = `<svg class="ext-i" viewBox="0 0 16 16" width="12" height="12" fill="none"
    stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"
  ><path d="M9.6 2.6h3.8v3.8"/><path d="M13.4 2.6 8.2 7.8"/><path
    d="M11.6 9.7v2.9a1.3 1.3 0 0 1-1.3 1.3H3.4a1.3 1.3 0 0 1-1.3-1.3V5.7a1.3 1.3 0 0 1 1.3-1.3h2.9"/></svg>`;

// Where the version stands, in the listing's own three answers — and its waiting work as
// a second quiet chip, never a number this door cannot act on.
function scStatusHtml(s) {
  const state = s.live
    ? `<span class="stat live sm2">v${s.liveVersion}</span>`
    : s.everPublished ? '<span class="stat off sm2">Off air</span>'
      : '<span class="stat off sm2">Unpublished</span>';
  return `${state}${s.unpublishedCount && (s.live || s.everPublished)
    ? '<span class="stat pending sm2">Changes not on air</span>' : ''}`;
}

function setupMapCardHtml(s, mine, acts, held) {
  const shared = (s.usedByNames || []).filter(n => n !== mine);
  const current = !!FORM?.data?.adSetupId && FORM.data.adSetupId === s.id;
  const sel = !acts && CHG_PICK === s.id;
  const extra = (s.sections || []).length - 1;
  const holders = [...(current ? ['this integration'] : []), ...shared];
  const fills = !holders.length ? 'not mapped yet'
    : holders.length > 2 ? `${holders[0]} +${holders.length - 1} more`
      : holders.join(', ');
  const readOnly = acts && current;
  const body = acts
    ? (current ? '' : ` onclick="${acts.pick}('${s.id}')"`)
    : ` onclick="chgSelect('${s.id}')" onkeydown="scCardKey(event, '${s.id}')"
        role="radio" aria-checked="${sel ? 'true' : 'false'}" tabindex="0"`;
  return `
    <div class="dlg-card sc-card ${current ? 'current' : ''} ${readOnly ? 'sc-read' : ''} ${sel ? 'sel' : ''}"
      data-id="${s.id}" data-q="${esc(`${s.name} ${s.property}`)}"${held ? ' hidden' : ''}${body}>
      <div class="sc-head">
        <span class="sc-who">${propBadge(s.property)}<span class="dc-title">${esc(s.name)}</span></span>
        ${current ? '<span class="dc-reach">Current</span>' : ''}
        ${acts ? '' : SC_TICK}
      </div>
      <div class="sc-band">
        ${setupChipsHtml(s)}
        ${extra > 0 ? `<span class="sc-extra" title="${extra + 1} placements in this ad setup">+${extra} placement${extra > 1 ? 's' : ''}</span>` : ''}
        <span class="sc-stat">${scStatusHtml(s)}</span>
      </div>
      <div class="sc-facts">
        <div class="sc-f"><span class="sc-fl">Fills</span>
          <span class="sc-fv"${holders.length > 2 ? ` title="${esc(holders.join(', '))}"` : ''}>${esc(fills)}</span></div>
        <div class="sc-f"><span class="sc-fl">Updated</span>
          <span class="sc-fv">${esc(s.updatedBy || 'ad ops')} · ${esc(relWhen(s.updatedAt))}</span></div>
      </div>
      <div class="sc-foot">
        <button type="button" class="sc-act reads"
          onclick="event.stopPropagation(); openSetupTab('${s.id}')">Preview ${EXT_ICON}</button>
        ${!acts || current ? '' : `<span class="sc-acts">
          <button type="button" class="sc-act" onclick="event.stopPropagation(); ${acts.dup}('${s.id}')">Use a copy</button>
          <button type="button" class="sc-act primary" onclick="event.stopPropagation(); ${acts.pick}('${s.id}')">Use</button>
        </span>`}
      </div>
    </div>`;
}

// Map one setup onto this page — the plain pick, no new object made. Since 8 Sep this
// is a LINK even when another integration already asks from that setup: the detour that
// photocopied a held setup behind the click is gone, because sharing is now the answer
// the platform gives. Copying stays one button away, for when a surface wants demand of
// its very own. Resolves true when this page ends up filled, false when the person
// backed out.
async function mapSetup(id, warned) {
  const target = SETUPS_CACHE.find(x => x.id === id);
  if (!target) return false;
  FORM.data.copyAtCreate = false;
  FORM.data.copyName = '';
  attachSetupToForm(target, warned);
  return true;
}

// ---------- USE A COPY ASKS FIRST (8 Sep, user call) ----------
// *"It just abruptly attaches with the user having no clue what has happened."* Copying
// was the one act on this page that made a NEW OBJECT IN ANOTHER ROOM and announced it
// with a two-word pill after the fact: a setup nobody had named appeared in Ad setups,
// and the chip here quietly became something else. So the act states itself BEFORE it
// runs — what is copied, what it will fill, what it displaces, and that the source is
// left alone — and the person NAMES the copy, because they are the one who will have to
// find it in the setups room next week. The server would silently suffix a name already
// taken, so a collision is refused in the dialog instead, where it can be retyped.
function fieldRefusal(field, message) {
  const e = new Error(message);
  e.errors = [{ field, message }];
  return e;
}

// The name we propose: this integration's own demand, stepped past any name in use.
function copyNameSeed() {
  const base = `${(FORM.data.name || 'New integration').trim()} demand`;
  let name = base;
  let n = 2;
  while (nameTaken(name)) name = `${base} ${n++}`;
  return name;
}
function nameTaken(name) {
  return SETUPS_CACHE.some(s => (s.name || '').trim().toLowerCase() === name.trim().toLowerCase());
}

function setupCopyBodyHtml(target) {
  const now = sectionSetup(0);
  const dropped = droppedBySetup(target);
  return `
    <div class="cpy-facts">
      <div class="cpy-line"><span class="cpy-l">Copy of</span>
        <span class="cpy-v"><b>${esc(target.name)}</b> <span class="podl">${esc(setupSummary(target))}</span></span></div>
      ${now ? `<div class="cpy-line"><span class="cpy-l">Replaces</span>
        <span class="cpy-v">${esc(now.name)}</span></div>` : ''}
    </div>
    <div class="frow"><div class="field grow" data-dfield="name"><label>Name the copy</label>
      <input type="text" id="sc-copy-name" value="${esc(copyNameSeed())}"></div></div>
    ${dropped.length ? `<div class="banner warn">${esc(droppedWords(dropped))}</div>` : ''}
    <p class="dlg-note">${KEY_ORIGINAL
      ? 'The original is untouched.'
      : 'The original is untouched. The copy is made when this integration is created.'}</p>`;
}

// The source is never touched: this integration gets a photocopy of it — placements, ad
// units, deals, settings. On a saved page the copy is made the moment it is confirmed;
// on a page still being created it is made at Create, so cancelling leaves no orphan.
// ONE WRITE, TWO DOORS (8 Sep): the change journey's second step and the in-section
// picker's own button both come through here, so the name is refused in the same words
// and the copy is attached the same way wherever it was asked for.
async function makeSetupCopy(target, name) {
  if (!name) throw fieldRefusal('name', 'Name the copy');
  if (nameTaken(name)) throw fieldRefusal('name', 'An ad setup is already called that');
  if (!KEY_ORIGINAL) return null;                     // made at Create — nothing to write yet
  const { setup } = await API.duplicateSetup(target.id, name);
  SETUPS_CACHE.push(setup);
  return setup;
}

// `made` is the copy the server took, or null on a page still being created — then the
// name rides the form and the copy is taken at Create.
// No receipt pill at all here: the person named this copy a second ago, the chip now
// wears that name (or says what it becomes at Create), and the screen they just
// confirmed carried the drop warning — a pill would only say it again.
function finishSetupCopy(made, target, name) {
  FORM.data.copyAtCreate = !made;
  FORM.data.copyName = made ? '' : name;
  attachSetupToForm(made || target, true);
}

// The in-section picker's own `Use a copy` — nothing fills this integration yet, so
// there is no swap to read first: the one dialog names the copy and takes it.
// Resolves true when a copy was taken, false when the person backed out.
async function mapSetupCopy(id) {
  const target = SETUPS_CACHE.find(x => x.id === id);
  if (!target) return false;
  let made = null;
  const out = await askForm({
    title: 'Copy & use',
    cls: 'sheet',
    body: setupCopyBodyHtml(target),
    cancelLabel: 'Back',
    okLabel: KEY_ORIGINAL ? 'Copy & use' : 'Copy at create',
    submit: async b => { made = await makeSetupCopy(target, (b.name || '').trim()); },
  }, root => ({ name: root.querySelector('#sc-copy-name')?.value ?? '' }));
  if (!out) return false;
  finishSetupCopy(made, target, (out.name || '').trim());
  return true;
}

// WHAT A SWAP COSTS, READ BEFORE IT IS PAID (8 Sep). A section this page has switched
// breaks on for, that the incoming setup has no placement for, goes quiet — so the
// second screen says which, in words, where a lever still exists. One reading, used by
// both confirmations and by the attach itself.
function droppedBySetup(target) {
  return (FORM.data.sections || []).slice(1).filter(s =>
    !(target.sections || []).some(p => p.name === s.name)
    && KL_META.slotTypes.some(t => s.slots[t].on)).map(s => s.name);
}
function droppedWords(names) {
  return names.length === 1
    ? `“${names[0]}” has no placement in it — that section's breaks switch off`
    : `${names.length} sections have no placement in it — ${names.map(n => `“${n}”`).join(', ')} switch off`;
}
// …and the same fact at pill length, for the doors that state it after the fact.
function droppedPill(names) {
  return names.length === 1 ? `“${names[0]}” switched off` : `${names.length} sections switched off`;
}

// `warned`: a second screen has already stated what this swap costs and the person
// confirmed it, so the pill stays quiet. The doors with no second screen — the picker's
// plain Use, a setup mapped on the way back from its editor — still get their receipt.
function attachSetupToForm(target, warned) {
  const d = FORM.data;
  const prior = d.sections;
  const dropped = droppedBySetup(target);
  d.adSetupId = target.id;
  d.sections = (target.sections || []).map((p, n) => {
    const match = n === 0 ? prior[0] : prior.find(x => x.name === p.name);
    return match
      ? { ...match, name: p.name, isDefault: n === 0 }
      : {
          name: p.name, isDefault: false,
          slots: Object.fromEntries(KL_META.slotTypes.map(t => [t, { on: false }])),
        };
  });
  KEY_SLOT = 'preroll';
  clearErr('sections');
  clearErr('adSetupId');
  FORM.rerender();
  if (dropped.length && !warned) toast(droppedPill(dropped), 'warn');
}

// ---------- nothing mapped: the section IS the picker (3 Sep, user call) ----------
// No empty state pointing at a dialog — the cards sit where the break tabs will be.
// The blank card opens the setup's REAL creation editor (Create returns here, mapped);
// the rest map what exists, each with its editor one labelled click away.
//
// IT SHOWS THE NEWEST FEW AND SEARCHES THE REST (8 Sep, user call — *"while creating a
// new integration, in the ad setup section under Ad behaviour we should have a search:
// we only show a few recent ad setups, but what if there are more than that for the
// property"*). This door is IN THE PAGE, not in a dialog with its own scroll: on a busy
// property (24 ad setups on TOI in the scale world) it painted every one of them, ~1600px
// of cards that pushed the rest of the form — and `Create integration` — off screen, and
// the shared card search only appeared past eight, so between six and eight setups the
// only way to reach one was to scroll. So the grid rests at SIX (two rows of three at
// 1440), newest work first, with a counted line that says what is held back — and the
// search reaches EVERY setup on the property, not just the six on screen: all the cards
// are in the DOM, the ones past the cap simply start hidden, and typing re-decides which
// are shown by hand (the bar paints once, so the caret survives).
//
// THE FIELD IS ALWAYS THERE, AT THE TOP RIGHT (8 Sep, user call — *"I can't see the
// search; it should be there on the top right, and even if ad setup cards are less than
// 6"*). A control that appears only past a threshold has to be discovered twice — once
// the day there are five setups and again the day there are seven — and by then the
// reader has already learned the door has no search. So ONE BAR serves both doors onto an
// ad setup and it paints whenever there is at least one card to search (with none, the
// empty line is the whole answer): the counted fact hard left, the field hard right where
// the user asked for it. The bar carries its own `data-cap` — six in the page, none in
// the modal, which owns its scroll and can list them all — so one filter reads both.
const SP_CAP = 6;

// What the bar says, left of the field. Three answers: a live query counts its matches,
// a capped grid names what it is holding back, and anything else is simply the count.
function spCountWords(q, matched, total, cap, prop) {
  if (q) return matched ? `${matched} of ${total} match` : '';
  if (cap && total > cap) return `newest ${cap} of ${total} — search to reach the rest`;
  return `${total} ad setup${total === 1 ? '' : 's'}${prop ? ` on ${prop}` : ''}`;
}

function spBarHtml(total, cap, prop) {
  if (!total) return '';
  return `
    <div class="sp-bar" data-cap="${cap}" data-prop="${esc(prop || '')}">
      <span class="sp-count">${esc(spCountWords('', 0, total, cap, prop))}</span>
      <input class="search sp-search" type="search" oninput="spFilter(this)"
        placeholder="Search ad setups…" aria-label="Search ad setups">
    </div>`;
}

function spFilter(el) {
  const bar = el.closest('.sp-bar');
  const grid = bar && bar.parentElement.querySelector('.dlg-cards');
  if (!grid) return;
  const cap = Number(bar.dataset.cap) || 0;
  const q = (el.value || '').trim().toLowerCase();
  const cards = grid.querySelectorAll('.sc-card');
  let shown = 0;
  let matched = 0;
  for (const c of cards) {
    const hit = !q || (c.dataset.q || '').toLowerCase().includes(q);
    if (hit) matched++;
    // No query: the newest few, where this door caps. A query: every match, always.
    const show = hit && (q || !cap ? true : shown < cap);
    if (show) shown++;
    c.hidden = !show;
  }
  bar.querySelector('.sp-count').textContent =
    spCountWords(q, matched, cards.length, cap, bar.dataset.prop);
  const none = grid.parentElement.querySelector('.dlg-none');
  if (q && !matched) {
    if (!none) grid.insertAdjacentHTML('afterend', '<div class="dlg-none">Nothing matches</div>');
  } else if (none) {
    none.remove();
  }
}

function setupPickCardsHtml() {
  const mine = KEY_ORIGINAL ? KEY_ORIGINAL.name : null;
  const prop = FORM.data.property;
  // Same property as the change door (8 Sep): demand belonging to another property could
  // never legitimately fill this surface, so both doors show one property's setups. The
  // blank card stays HERE and only here — this is the state with nothing to swap.
  const list = SETUPS_CACHE.filter(s => inScope(s.property) && s.property === prop)
    .sort((a, b) => (b.updatedAt || '').localeCompare(a.updatedAt || ''));
  const over = list.length > SP_CAP;
  // While CREATING an integration there is no blank card (3 Sep, user call): the page
  // maps demand that exists. New setups are made from the edit page or the setups room.
  return `
    <div class="setup-pick">
      ${spBarHtml(list.length, SP_CAP, prop)}
      <div class="dlg-cards sp-cards">
        ${KEY_ORIGINAL ? `
        <div class="dlg-card create" onclick="newSetupFromKey()">
          <div class="dc-plus">+</div>
          <div class="dc-title">New ad setup</div>
          <div class="dc-sum">Built in its own editor — mapped here on Create</div>
        </div>` : ''}
        ${list.map((s, i) => setupMapCardHtml(s, mine, { pick: 'mapSetup', dup: 'mapSetupCopy' },
          over && i >= SP_CAP)).join('')}
      </div>
      ${list.length || KEY_ORIGINAL ? '' : `<div class="dlg-none">No ad setup on ${esc(prop)} yet — one is built in Ad setups.</div>`}
    </div>`;
}

