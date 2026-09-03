// views-keys-form.js — ONE integration's page, part 1 of 4 (split 3 Sep, pure
// partition — order preserved, nothing edited): page load + save-state (viewKeyForm,
// KEY_ORIGINAL), the section accessors, and the AD-SETUP MAPPING — stash-and-return
// (KEY_RETURN/KEY_RESTORE), the change modal, use / duplicate-and-use, the picker cards.
// The rest of the page: views-keys-drive.js (Ad behaviour), views-keys-player.js
// (player + config table), views-keys-shell.js (frame, save, chooser) — in that order.

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
      // mapping. A held setup becomes this integration's own copy at create, never a
      // shared link; until then the page reads the original, which is what the copy is.
      data = {
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
        name: '', property: window.GLOBAL_PROP !== 'All' ? window.GLOBAL_PROP : 'TOI', platform: 'mweb',
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
  formDeps({
    web: d => meta.webPlatforms.includes(d.platform),
    app: d => !meta.webPlatforms.includes(d.platform),
  });
  renderKeyForm(meta);
  if (restore && restore.mapSetupId) {
    const made = SETUPS_CACHE.find(x => x.id === restore.mapSetupId);
    if (made) {
      attachSetupToForm(made);
      toast(`“${made.name}” mapped — its ladders are filled in Ad Setups`);
    }
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

// Open the mapped (or a candidate) setup where it actually lives.
function openSetupFromKey(id) {
  keyStash(id);
  location.hash = `#setups/${id}`;
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

// CHANGE is the same door as NEW (3 Sep, user call): one modal of cards — start blank,
// or map one that exists — the exact grammar the New-ad-setup chooser speaks.
function changeSetupJourney() {
  const mine = KEY_ORIGINAL ? KEY_ORIGINAL.name : null;
  const list = SETUPS_CACHE.slice().sort((a, b) =>
    ((b.property === FORM.data.property) - (a.property === FORM.data.property))
    || (b.updatedAt || '').localeCompare(a.updatedAt || ''));
  document.getElementById('dialog-root').innerHTML = `
    <div class="dlg-veil"><div class="dlg wide autoh">
      <h3>Change ad setup<span class="dlg-kicker">one setup fills every break</span></h3>
      <div class="dlg-body">
        <div class="dlg-cards">
          ${KEY_ORIGINAL ? `
          <div class="dlg-card create" onclick="newSetupFromKey()">
            <div class="dc-plus">+</div>
            <div class="dc-title">New ad setup</div>
            <div class="dc-sum">Built in its own editor — mapped here on Create</div>
          </div>` : ''}
          ${list.map(s => setupMapCardHtml(s, mine, 'changePick', 'changePickCopy')).join('')}
        </div>
      </div>
      <div class="dlg-foot"><button class="btn ghost" onclick="document.getElementById('dialog-root').innerHTML = ''">Cancel</button></div>
    </div></div>`;
  document.querySelector('.dlg-veil').onclick = e => {
    if (e.target.classList.contains('dlg-veil')) document.getElementById('dialog-root').innerHTML = '';
  };
}

async function changePick(id) {
  document.getElementById('dialog-root').innerHTML = '';
  await mapSetup(id);
}

// ONE card grammar for both doors (the in-section grid and the change modal): name,
// counted demand, who touched it — and "open" goes to the editor itself.
// THE TWO WAYS TO TAKE IT (3 Sep, user call) sit in the card's top-right corner, where
// an "in use / free" pill used to repeat what the foot already says in words ("fills
// X"). They appear on hover, over the title's tail rather than pushing it, so a card
// that is only being read stays a card being read. USE fills every break from this very
// setup; DUPLICATE & USE takes a photocopy — placements, ad units, deals, settings — and
// maps that, leaving the original alone.
function setupMapCardHtml(s, mine, pick, dup) {
  const held = (s.usedByNames || []).find(n => n !== mine) || null;
  return `
    <div class="dlg-card sc-card" onclick="${pick}('${s.id}')">
      <div class="dc-top"><span class="dc-title">${esc(s.name)}</span></div>
      <span class="sc-acts">
        <button type="button" class="sc-act primary" onclick="event.stopPropagation(); ${pick}('${s.id}')"
          title="${held ? `“${esc(held)}” fills from it too — it is photocopied for this integration` : 'Fill every break from this ad setup'}">Use</button>
        <button type="button" class="sc-act" onclick="event.stopPropagation(); ${dup}('${s.id}')"
          title="A photocopy of “${esc(s.name)}” — placements, ad units, deals and settings — mapped here; the original is untouched">Duplicate &amp; use</button>
      </span>
      <div class="dc-sum">${propBadge(s.property)} <span>${esc(setupSummary(s))}</span></div>
      <div class="sc-foot">
        <button type="button" class="zlink" onclick="event.stopPropagation(); openSetupFromKey('${s.id}')"
          title="Open the ad setup in its own editor — ← there brings you back with your edits kept">open</button>
        <span class="podl sc-meta" ${held ? `title="held setups are photocopied — “${esc(held)}” keeps its own"` : ''}>${held ? `fills “${esc(held)}”` : `${esc(s.updatedBy || 'ad ops')} · ${relWhen(s.updatedAt)}`}</span>
      </div>
    </div>`;
}

// Map one setup onto this page. A held setup is photocopied first on an EXISTING
// integration (the 1:1 promise, kept at the pick); on a page still being created the
// copy waits for Create — cancel leaves no orphan behind.
async function mapSetup(id) {
  let target = SETUPS_CACHE.find(x => x.id === id);
  if (!target) return;
  FORM.data.copyAtCreate = false;
  const mine = KEY_ORIGINAL ? KEY_ORIGINAL.name : null;
  const held = (target.usedByNames || []).find(n => n !== mine) || null;
  if (held && KEY_ORIGINAL) {
    try {
      const { setup } = await API.duplicateSetup(target.id,
        `${(FORM.data.name || 'New integration').trim()} demand`);
      SETUPS_CACHE.push(setup);
      toast(`Copied as “${setup.name}” — this integration's own`);
      target = setup;
    } catch (e) {
      toast(e.message, 'bad');
      return;
    }
  }
  attachSetupToForm(target);
}

// DUPLICATE & USE (3 Sep, user call): the source is never touched — this integration
// gets a photocopy of it, ad units and all. On a saved page the copy is made now; on a
// page still being created it is made at Create, so cancelling leaves no orphan behind
// (the same discipline the held-setup copy has always followed).
async function mapSetupCopy(id) {
  const target = SETUPS_CACHE.find(x => x.id === id);
  if (!target) return;
  if (!KEY_ORIGINAL) {
    FORM.data.copyAtCreate = true;
    attachSetupToForm(target);
    toast(`Copied from “${target.name}” when this integration is created — its own from then on`);
    return;
  }
  try {
    const { setup } = await API.duplicateSetup(target.id, `${(FORM.data.name || 'New integration').trim()} demand`);
    SETUPS_CACHE.push(setup);
    FORM.data.copyAtCreate = false;
    toast(`Copied as “${setup.name}” — “${target.name}” is untouched`);
    attachSetupToForm(setup);
  } catch (e) {
    toast(e.message, 'bad');
  }
}

async function changePickCopy(id) {
  document.getElementById('dialog-root').innerHTML = '';
  await mapSetupCopy(id);
}

function attachSetupToForm(target) {
  const d = FORM.data;
  const prior = d.sections;
  const dropped = prior.slice(1).filter(s =>
    !(target.sections || []).some(p => p.name === s.name)
    && KL_META.slotTypes.some(t => s.slots[t].on)).map(s => s.name);
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
  if (dropped.length) toast(`Dropped with the old setup (no such placement here): ${dropped.join(', ')}`, 'warn');
}

// ---------- nothing mapped: the section IS the picker (3 Sep, user call) ----------
// No empty state pointing at a dialog — the cards sit where the break tabs will be.
// The blank card opens the setup's REAL creation editor (Create returns here, mapped);
// the rest map what exists, each with its editor one labelled click away.

function setupPickCardsHtml() {
  const mine = KEY_ORIGINAL ? KEY_ORIGINAL.name : null;
  const list = SETUPS_CACHE.slice().sort((a, b) =>
    ((b.property === FORM.data.property) - (a.property === FORM.data.property))
    || (b.updatedAt || '').localeCompare(a.updatedAt || ''));
  // While CREATING an integration there is no blank card (3 Sep, user call): the page
  // maps demand that exists. New setups are made from the edit page or the setups room.
  return `
    <div class="setup-pick">
      <div class="dlg-cards sp-cards">
        ${KEY_ORIGINAL ? `
        <div class="dlg-card create" onclick="newSetupFromKey()">
          <div class="dc-plus">+</div>
          <div class="dc-title">New ad setup</div>
          <div class="dc-sum">Built in its own editor — mapped here on Create</div>
        </div>` : ''}
        ${list.map(s => setupMapCardHtml(s, mine, 'mapSetup', 'mapSetupCopy')).join('')}
      </div>
    </div>`;
}

