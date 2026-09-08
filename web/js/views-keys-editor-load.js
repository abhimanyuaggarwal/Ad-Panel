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
      player: JSON.parse(JSON.stringify(key.player)),
      playerConfigs: JSON.parse(JSON.stringify(key.playerConfigs || [])),
      // The quick decisions — key-level, sparse, intent only (DRIVING-SCOPE).
      drive: key.drive ? JSON.parse(JSON.stringify(key.drive)) : {},
      sections: key.sections.map(s => ({
        name: s.name, isDefault: s.isDefault,
        slots: Object.fromEntries(meta.slotTypes.map(t => [t, { on: s.slots[t].on }])),
      })),
    };
    KEY_ORIG_CANON = keyPayload(JSON.parse(JSON.stringify(data)));
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
        drive: seed.drive ? JSON.parse(JSON.stringify(seed.drive)) : {},
        player: JSON.parse(JSON.stringify(seed.player)),
        playerConfigs: (seed.playerConfigs || []).map(({ id, ...rest }) => JSON.parse(JSON.stringify(rest))),
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
        player: JSON.parse(JSON.stringify(pPreset.values)),
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
  FORM.saved = KEY_ORIGINAL ? JSON.parse(JSON.stringify(data)) : null;
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
  document.getElementById('dialog-root').innerHTML = '';
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
// happened the instant a name was clicked, and the acts were 11px buttons hidden until
// hover. Now the cards SELECT — one at a time, the selection visible — and the acts sit
// where a dialog's acts belong, in the foot, at full size. They are only drawn once
// something is selected (an act with no object is not a button, it is a question), and
// the foot says in one line why an act is missing rather than showing it dead.
let CHG_PICK = null;   // the selected card, kept across the trip to the second screen
let CHG_Q = '';        // …and its search box, so coming back does not re-type the filter

function chgClose() {
  document.getElementById('dialog-root').innerHTML = '';
  CHG_PICK = null;
  CHG_Q = '';
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

// THE ACTS, IN THE FOOT. Nothing selected: the line asks for a selection. The current
// setup: it is already the answer, so there is nothing to press. Anything else offers
// BOTH acts (8 Sep, since a setup may fill many integrations): `Use` links this surface
// to that very setup — the ladder then moves for everyone who asks from it — and
// `Copy & use` takes a photocopy that moves for nobody else. Where a setup is already
// shared the foot says so in the same breath, because that is what the choice is about.
function chgFootHtml() {
  const { setup, current, shared } = chgState();
  const why = !setup ? 'Pick an ad setup'
    : current ? 'Already fills this integration'
    : shared.length ? `also fills ${holdersWords(shared)}`
    : '';
  const acts = !setup || current ? ''
    : `<button class="btn ghost" onclick="chgAct('copy')">Copy &amp; use</button>
       <button class="btn" onclick="chgAct('use')">Use</button>`;
  return `${why ? `<span class="chg-why">${why}</span>` : ''}
    <button class="btn ghost" onclick="chgClose()">Cancel</button>
    ${acts}`;
}

// Selecting repaints the SELECTION AND THE FOOT BY HAND, never the dialog: the search
// box above the cards is a live input, and a repaint would swallow what was typed.
function chgSelect(id) {
  CHG_PICK = id;
  document.querySelectorAll('#dialog-root .sc-card').forEach(c =>
    c.classList.toggle('sel', c.dataset.id === id));
  const foot = document.getElementById('chg-foot');
  if (foot) foot.innerHTML = chgFootHtml();
}

function changeSetupJourney() {
  const mine = KEY_ORIGINAL ? KEY_ORIGINAL.name : null;
  const prop = FORM.data.property;
  const list = SETUPS_CACHE.filter(s => inScope(s.property) && s.property === prop)
    .sort((a, b) => (b.updatedAt || '').localeCompare(a.updatedAt || ''));
  if (!list.some(s => s.id === CHG_PICK)) CHG_PICK = null;
  document.getElementById('dialog-root').innerHTML = `
    <div class="dlg-veil"><div class="dlg wide autoh">
      <h3>Change ad setup<span class="dlg-kicker">${esc(prop)} ad setups — one fills every break</span></h3>
      <div class="dlg-body">
        ${dlgSearchHtml(list.length, 'Search ad setups…')}
        ${list.length
          ? `<div class="dlg-cards">${list.map(s => setupMapCardHtml(s, mine, null)).join('')}</div>`
          : `<div class="dlg-none">No ad setup on ${esc(prop)} yet — one is built in Ad setups.</div>`}
      </div>
      <div class="dlg-foot" id="chg-foot">${chgFootHtml()}</div>
    </div></div>`;
  const q = document.querySelector('#dialog-root .dlg-search');
  if (q) {
    q.addEventListener('input', () => { CHG_Q = q.value; });
    if (CHG_Q) { q.value = CHG_Q; dlgCardsFilter(q); }
  }
  document.querySelector('.dlg-veil').onclick = e => {
    if (e.target.classList.contains('dlg-veil')) chgClose();
  };
}

// THE SECOND SCREEN, then the attach. Both acts state what they are about to do and
// wait; backing out returns to the cards with the selection and the filter still there,
// because the person is still choosing.
async function chgAct(mode) {
  const id = CHG_PICK;
  const done = mode === 'copy' ? await mapSetupCopy(id) : await useSetupConfirmed(id);
  if (done) chgClose(); else changeSetupJourney();
}

// `Use` — no new object, but on a live integration it re-points every break, and any
// section the new setup has no placement for goes quiet. Two lines and the warning.
async function useSetupConfirmed(id) {
  const target = SETUPS_CACHE.find(x => x.id === id);
  if (!target) return false;
  const now = sectionSetup(0);
  const dropped = droppedBySetup(target);
  const shared = otherHolders(target);
  const ok = await ask({
    title: 'Use this ad setup',
    cancelLabel: 'Back',
    okLabel: 'Use it',
    body: `
      <div class="cpy-facts">
        ${now ? `<div class="cpy-line"><span class="cpy-l">Now</span>
          <span class="cpy-v">${esc(now.name)}</span></div>` : ''}
        <div class="cpy-line"><span class="cpy-l">After</span>
          <span class="cpy-v"><b>${esc(target.name)}</b> <span class="podl">${esc(setupSummary(target))}</span></span></div>
        ${shared.length ? `<div class="cpy-line"><span class="cpy-l">Shared</span>
          <span class="cpy-v">also fills ${esc(holdersWords(shared))} — an edit there moves ${shared.length > 1 ? 'them all' : 'both'}</span></div>` : ''}
      </div>
      ${dropped.length ? `<div class="banner warn">${esc(droppedWords(dropped))}</div>` : ''}`,
  });
  if (!ok) return false;
  return mapSetup(id, true);   // the screen said what drops; the pill would only repeat it
}

// ONE card grammar for both doors, in two moods (8 Sep, third cut then fourth):
//   the in-section picker  — nothing fills this integration yet, so a card IS the act:
//                            `Use` and `Use a copy` in its corner, on hover.
//   the change modal       — something already fills it, so a card is a CHOICE: it
//                            selects, and the acts live in the dialog's foot.
// What never changes is what a card SAYS: name, counted demand, who else asks from it,
// and "open ↗" to the setup's own page in its own tab. A card never wears a dead button.
// Since a setup may fill many integrations (8 Sep), a setup another surface already
// fills offers BOTH acts like any other — the holders are a FACT in the foot, no longer
// a reason an act is missing. Only the setup already filling THIS integration has
// nothing to press: it wears "current". A copy is a NEW OBJECT, so it is only ever made
// by pressing its own button, never by a click on the card body.
function setupMapCardHtml(s, mine, acts) {
  const shared = (s.usedByNames || []).filter(n => n !== mine);
  const current = !!FORM?.data?.adSetupId && FORM.data.adSetupId === s.id;
  const corner = !acts || current ? ''
    : `<button type="button" class="sc-act primary" onclick="event.stopPropagation(); ${acts.pick}('${s.id}')">Use</button>
       <button type="button" class="sc-act" onclick="event.stopPropagation(); ${acts.dup}('${s.id}')">Use a copy</button>`;
  const foot = current ? 'fills this integration'
    : shared.length ? `fills ${holdersWords(shared)}`
    : `${esc(s.updatedBy || 'ad ops')} · ${relWhen(s.updatedAt)}`;
  const body = acts
    ? (current ? '' : ` onclick="${acts.pick}('${s.id}')"`)
    : ` onclick="chgSelect('${s.id}')"`;
  return `
    <div class="dlg-card sc-card ${current ? 'current' : ''} ${acts && current ? 'sc-read' : ''} ${!acts && CHG_PICK === s.id ? 'sel' : ''}"
      data-id="${s.id}" data-q="${esc(`${s.name} ${s.property}`)}"${body}>
      <div class="dc-top"><span class="dc-title">${esc(s.name)}</span>${current ? '<span class="dc-reach">current</span>' : ''}</div>
      ${corner ? `<span class="sc-acts">${corner}</span>` : ''}
      <div class="dc-sum">${propBadge(s.property)} <span>${esc(setupSummary(s))}</span></div>
      <div class="sc-foot">
        <button type="button" class="zlink" onclick="event.stopPropagation(); openSetupTab('${s.id}')">open ↗</button>
        <span class="podl sc-meta">${foot}</span>
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
    submit: async b => {
      const name = (b.name || '').trim();
      if (!name) throw fieldRefusal('name', 'Name the copy');
      if (nameTaken(name)) throw fieldRefusal('name', 'An ad setup is already called that');
      if (!KEY_ORIGINAL) return;                        // made at Create — nothing to write yet
      const { setup } = await API.duplicateSetup(target.id, name);
      SETUPS_CACHE.push(setup);
      made = setup;
    },
  }, root => ({ name: root.querySelector('#sc-copy-name')?.value ?? '' }));
  if (!out) return false;
  FORM.data.copyAtCreate = !made;
  FORM.data.copyName = made ? '' : out.name;
  // No receipt pill at all here: the person named this copy a second ago, the chip now
  // wears that name (or says what it becomes at Create), and the screen they just
  // confirmed carried the drop warning — a pill would only say it again.
  attachSetupToForm(made || target, true);
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

function setupPickCardsHtml() {
  const mine = KEY_ORIGINAL ? KEY_ORIGINAL.name : null;
  const prop = FORM.data.property;
  // Same property as the change door (8 Sep): demand belonging to another property could
  // never legitimately fill this surface, so both doors show one property's setups. The
  // blank card stays HERE and only here — this is the state with nothing to swap.
  const list = SETUPS_CACHE.filter(s => inScope(s.property) && s.property === prop)
    .sort((a, b) => (b.updatedAt || '').localeCompare(a.updatedAt || ''));
  // While CREATING an integration there is no blank card (3 Sep, user call): the page
  // maps demand that exists. New setups are made from the edit page or the setups room.
  return `
    <div class="setup-pick">
      ${dlgSearchHtml(list.length, 'Search ad setups…')}
      <div class="dlg-cards sp-cards">
        ${KEY_ORIGINAL ? `
        <div class="dlg-card create" onclick="newSetupFromKey()">
          <div class="dc-plus">+</div>
          <div class="dc-title">New ad setup</div>
          <div class="dc-sum">Built in its own editor — mapped here on Create</div>
        </div>` : ''}
        ${list.map(s => setupMapCardHtml(s, mine, { pick: 'mapSetup', dup: 'mapSetupCopy' })).join('')}
      </div>
      ${list.length || KEY_ORIGINAL ? '' : `<div class="dlg-none">No ad setup on ${esc(prop)} yet — one is built in Ad setups.</div>`}
    </div>`;
}

