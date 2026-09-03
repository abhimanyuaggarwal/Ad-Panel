// views-keys-form.js — ONE integration's page: create (via the chooser) and edit.
// Holds the editor (Details, custom-config tabs, Ad delivery with the drive), the
// setup mapping cards + change modal, the stash/return flow to the setup editor
// (KEY_RETURN/KEY_RESTORE), save/create through THE CHANGE REVIEW, and the
// new-integration chooser. Loads last of the views-keys trio.

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
          <div class="dlg-card create" onclick="newSetupFromKey()">
            <div class="dc-plus">+</div>
            <div class="dc-title">New ad setup</div>
            <div class="dc-sum">Built in its own editor — mapped here on Create</div>
          </div>
          ${list.map(s => setupMapCardHtml(s, mine, 'changePick')).join('')}
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
// in use/free, counted demand, who touched it — and "open" goes to the editor itself.
function setupMapCardHtml(s, mine, pick) {
  const held = (s.usedByNames || []).find(n => n !== mine) || null;
  return `
    <div class="dlg-card" onclick="${pick}('${s.id}')">
      <div class="dc-top"><span class="dc-title">${esc(s.name)}</span>
        <span class="dc-reach">${held ? 'in use' : 'free'}</span></div>
      <div class="dc-sum">${propBadge(s.property)} <span>${esc(setupSummary(s))}</span></div>
      <div class="sc-foot">
        <button type="button" class="zlink" onclick="event.stopPropagation(); openSetupFromKey('${s.id}')"
          title="Open the ad setup in its own editor — ← there brings you back with your edits kept">open</button>
        <span class="podl" ${held ? `title="held setups are photocopied — “${esc(held)}” keeps its own"` : ''}>${held ? `fills “${esc(held)}”` : `${esc(s.updatedBy || 'ad ops')} · ${relWhen(s.updatedAt)}`}</span>
      </div>
    </div>`;
}

// Map one setup onto this page. A held setup is photocopied first on an EXISTING
// integration (the 1:1 promise, kept at the pick); on a page still being created the
// copy waits for Create — cancel leaves no orphan behind.
async function mapSetup(id) {
  let target = SETUPS_CACHE.find(x => x.id === id);
  if (!target) return;
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
  return `
    <div class="setup-pick">
      <div class="dlg-cards sp-cards">
        <div class="dlg-card create" onclick="newSetupFromKey()">
          <div class="dc-plus">+</div>
          <div class="dc-title">New ad setup</div>
          <div class="dc-sum">Built in its own editor — mapped here on Create</div>
        </div>
        ${list.map(s => setupMapCardHtml(s, mine, 'mapSetup')).join('')}
      </div>
    </div>`;
}

// ---------- sections: switches + inline field groups ----------



// ---------- the walk, mirrored client-side (26 Aug, DRIVING-SCOPE) ----------
// The setup's ladder IS the arrangement now — local mutes and orders died with the
// 1:1 setup promise. These mirrors match the server's driveWalk exactly, so the
// number on screen is the number that serves.

function keySecs() {
  return FORM.data.sections.map((_, j) => j);
}

function ladderOfViews(slotLike) {
  if (!slotLike) return [];
  return (slotLike.rungs || []).map((r, n) => {
    const v = (slotLike.rungView || [])[n] || {};
    return { key: r.tagId, label: v.label || '', provider: v.provider || '', opsOff: r.on === false };
  });
}

// A slot's break groups as the client sees them (31 Aug): a mid-roll may hold up to
// three; every other slot reads as one. Same accessor shape as the server's.
function clientGroupDefs(i, t) {
  const plc = setupPlacement(i);
  if (!plc) return [];
  const slot = plc.slots[t];
  return (slot.groups && slot.groups.length) ? slot.groups : [slot];
}

function clientLadder(i, t, gi = 0) {
  const gs = clientGroupDefs(i, t);
  return ladderOfViews(gs[gi] || gs[0]);
}

// The drive decision resolved against one section's ladder. With no `who` and no
// `tries` this is exactly the setup's own walk: the positional cut first (a dead rung
// holds its seat), then the dead drop. A `who` reorders, so positions lose meaning and
// the setup's depth applies as a COUNT; `tries` is always a count of real tries.
function clientDriveWalk(i, t, gi = 0) {
  const plc = setupPlacement(i);
  if (!plc) return { walk: [], fellBack: false };
  const rot = isRotation(t);
  const g = clientGroupDefs(i, t)[gi];
  if (!g) return { walk: [], fellBack: false };
  const ladder = ladderOfViews(g);
  const base = ladder.filter(r => !r.opsOff);
  const d = driveOf(t);
  const ask = d.ask?.length ? d.ask : null;
  let walk = base;
  let fellBack = false;
  if (ask && !rot) {
    // The client mirror of `driveWalk` — same rule, so the page never promises a walk
    // the server would resolve differently. TIERS (31 Aug): the primary is a position,
    // never displaced — the ask filters and orders the FALLBACK, the one ordered thing
    // left. Stable sort keeps ad ops' order inside a partner's own rungs.
    const primary = ladder[0] && !ladder[0].opsOff ? ladder[0] : null;
    const tail = ladder.slice(1).filter(r => !r.opsOff);
    const mine = tail.filter(r => ask.includes(r.provider));
    if (!mine.length) {
      // None of those partners in the fallback — loud. A ladder with no fallback at all
      // honours any fallback decision by definition (1 Sep): primary only, nothing to say.
      fellBack = tail.length > 0;
    } else {
      const ordered = [...mine].sort((a, b) => ask.indexOf(a.provider) - ask.indexOf(b.provider));
      walk = [...(primary ? [primary] : []), ...ordered];
    }
  }
  if (d.tries && !rot) walk = walk.slice(0, d.tries);
  return { walk, fellBack };
}

function clientWalk(i, t, gi = 0) { return clientDriveWalk(i, t, gi).walk; }
// The switch may only light where EVERY break group has something to ask.
function clientAllGroupsWalk(i, t) {
  const gs = clientGroupDefs(i, t);
  return gs.length > 0 && gs.every((_, gi) => clientWalk(i, t, gi).length > 0);
}

// One switch, every section — mixed goes ON, all-on goes OFF, and a section with
// nothing live to run is passed over and named rather than lit into darkness.
function secSlotToggle(t) {
  const picked = keySecs();
  const want = !picked.some(j => FORM.data.sections[j].slots[t].on);
  const skipped = [];
  for (const j of picked) {
    const slot = FORM.data.sections[j].slots[t];
    if (want && !clientAllGroupsWalk(j, t)) { skipped.push(FORM.data.sections[j].name); continue; }
    slot.on = want;
  }
  clearErr('sections');
  FORM.rerender();
  if (skipped.length) toast(`Nothing to run in ${skipped.join(', ')} — left off`, 'warn');
}

// ---------- THE DRIVE: switches and preconfigured decisions (26 Aug, DRIVING-SCOPE) ----------
// The manager's image, kept literally: driving a car you get a switch and two or three
// preconfigured gears — anything finer means stopping the car. So this card holds, per
// break: the SWITCH · WHO fills it (a dropdown generated from the companies actually
// behind the break) · TRIES (1 / 2 / 3 / All) · the pre-roll's start · ads in a row.
// The workshop — dragging rungs, killing tags, every number — is the ad setup, one
// click away and this integration's alone (the 1:1 promise). Decisions are INTENT,
// resolved live: ad ops adding a tag next week joins the walk the decision already
// describes, and there is no unmappable Custom state — "As set up" is always true.

const QF_TEXT = {}; // caret-safe text buffers (the player fields still use them)

function driveOf(t) { return (FORM.data.drive || {})[t] || {}; }

// Writes are sparse: null (or 'setup' / 'All') drops the field, so the break starts
// following the setup again — dropping a decision is not "setting it back".
function driveSet(t, f, val) {
  if (!FORM.data.drive) FORM.data.drive = {};
  const slot = { ...(FORM.data.drive[t] || {}) };
  if (val === null || val === undefined || val === 'setup') delete slot[f];
  else slot[f] = val;
  if (Object.keys(slot).length) FORM.data.drive[t] = slot;
  else delete FORM.data.drive[t];
  clearErr('sections');
  clearErr('drive');
  FORM.rerender();
}

function provWord(p) { return label('tagProvider', p) || p; }

// THE PARTNER CHIPS (27 Aug, user call — they replaced a generated dropdown).
//
// The dropdown could only offer the two shapes a dropdown can hold: "X only" and
// "X first". Both are special cases of the thing product actually wants to say —
// *these partners, in this order* — so the control became the sentence itself: one chip
// per partner, dragged into the order they are asked, each with a switch. "IMA only" is
// now IMA on and the rest off; "GPT first" is GPT dragged to the front.
//
// The strip is still GENERATED from the companies behind this break, never a fixed list
// to go stale when a partner joins. A partner with no demand anywhere in this break is
// still drawn — greyed, in place, with the reason on it — because a control that
// silently has two chips on one break and three on another teaches nothing.

// Every partner behind this break, in the setup's own ask order, plus the ones that
// aren't there at all so the row reads the same on every break.
function breakProviders(t) {
  const here = [];
  for (const j of keySecs()) {
    for (const r of clientLadder(j, t)) {
      if (!r.opsOff && r.provider && !here.includes(r.provider)) here.push(r.provider);
    }
  }
  const missing = (window.KL_PROVIDERS || []).filter(p => !here.includes(p));
  return { here, missing };
}

// What the chips show: the saved decision if there is one, otherwise the setup's own
// arrangement — so the strip is a statement of what runs before it is a control.
function askOrder(t) {
  const { here, missing } = breakProviders(t);
  const saved = driveOf(t).ask;
  const on = saved ? saved.filter(p => here.includes(p) || missing.includes(p)) : [...here];
  const off = [...here, ...missing].filter(p => !on.includes(p));
  return { on, off, here, missing, decided: !!saved };
}

// ONE LINE, ALWAYS (1 Sep, user call): the strip is the three partners and nothing
// else — active ones numbered and draggable, a switched-off one dimmed IN PLACE with a
// strike, never re-homed under an "excluded" shelf that wrapped the row. The whole chip
// is the switch; nothing changes width when it flips.
function askChipsHtml(t) {
  const { on, off, here } = askOrder(t);
  if (!here.length) return '<span class="sg-empty">No demand</span>';
  const dragKey = `ask-${t}`;
  registerDrag(dragKey, (from, to) => {
    const order = askOrder(t).on;
    order.splice(to, 0, order.splice(from, 1)[0]);
    driveSet(t, 'ask', order);
  });
  const chip = (p, i, isOn) => {
    const absent = !here.includes(p);
    const last = isOn && on.length === 1;
    const why = absent
      ? `No ${provWord(p)} tags behind this break — switching it on changes nothing until ad ops add one`
      : last
        ? `The only partner left on — a break that asks nobody would go dark`
        : isOn ? `Asked ${i === 0 ? 'first' : i === 1 ? 'second' : 'third'}. Drag to reorder, click to switch off.`
        : `Skipped at this break. Click to switch it back on — it joins at the end.`;
    return `
      <span class="pchip ${isOn ? 'on' : 'skip'} ${absent ? 'absent' : ''}" title="${esc(why)}"
        ${isOn && on.length > 1 ? dragAttrs(dragKey, i) : ''}
        onclick="${last || absent ? '' : `askToggle('${t}', '${p}')`}">
        ${isOn && on.length > 1 ? '<span class="pchip-grip">⠿</span>' : ''}
        <b class="pchip-n">${isOn ? i + 1 : '–'}</b>
        <span class="pchip-t">${esc(provWord(p))}</span>
      </span>`;
  };
  return `
    <div class="pchips oneline">
      ${on.map((p, i) => chip(p, i, true)).join('<i class="gsep">›</i>')}
      ${off.map(p => chip(p, -1, false)).join('')}
    </div>`;
}

// Switching one off writes the remaining order; switching one on appends it at the end,
// which is where a partner you just added should be asked.
function askToggle(t, p) {
  const { on, off } = askOrder(t);
  if (on.includes(p)) {
    if (on.length === 1) { toast('A break has to ask somebody — switch another partner on first', 'warn'); return; }
    driveSet(t, 'ask', on.filter(x => x !== p));
  } else {
    void off;
    driveSet(t, 'ask', [...on, p]);
  }
}

// "Both speeds" (user call): one break's partner order and depth stamped onto every
// break with demand behind it — one act; the per-break controls stay the single source
// of state. A break carrying none of the asked partners is left alone and named.
function driveStampAll(t) {
  const d = driveOf(t);
  const ask = d.ask || null;
  const took = [];
  const skipped = [];
  for (const t2 of KL_META.slotTypes) {
    if (t2 === t || isRotation(t2)) continue;
    const provs = new Set();
    let any = false;
    for (const j of keySecs()) {
      for (const r of clientLadder(j, t2)) if (!r.opsOff) { any = true; provs.add(r.provider); }
    }
    if (!any) continue; // nothing behind that break — nothing to decide
    if (ask && !ask.some(p => provs.has(p))) { skipped.push(label('slotType', t2)); continue; }
    if (!FORM.data.drive) FORM.data.drive = {};
    const slot = { ...(FORM.data.drive[t2] || {}) };
    for (const f of ['ask', 'tries']) {
      if (d[f] === undefined) delete slot[f]; else slot[f] = JSON.parse(JSON.stringify(d[f]));
    }
    if (Object.keys(slot).length) FORM.data.drive[t2] = slot;
    else delete FORM.data.drive[t2];
    took.push(label('slotType', t2));
  }
  clearErr('sections');
  clearErr('drive');
  FORM.rerender();
  if (!took.length && !skipped.length) { toast('No other break has demand to decide over', 'warn'); return; }
  toast(`${took.length ? `${took.join(', ')} take this decision` : 'Nothing taken'}${skipped.length ? ` — ${skipped.join(', ')} left alone (none of those partners there)` : ''}`);
}

// The warning is a door: the exact placement and break in the ad setup, an empty rung
// waiting, its provider preselected.
function addLinkHtml(setup, secName, t, provider) {
  if (!setup) return '';
  return `<button type="button" class="zlink wp-fix"
    onclick="goAddRung('${setup.id}', ${jsLit(secName)}, '${t}', '${provider}')"
    title="Open “${esc(secName)}” in “${esc(setup.name)}”, ready to add a ${esc(provWord(provider))} tag to this break">add ${esc(provWord(provider))} →</button>`;
}

async function goAddRung(setupId, secName, t, provider) {
  const dirty = JSON.stringify(keyPayload(FORM.data)) !== JSON.stringify(KEY_ORIG_CANON);
  if (dirty) {
    const ok = await ask({
      title: 'Leave this integration?',
      body: `<p class="dlg-note">Unsaved changes here will be lost. Save them first, then come back to “${esc(secName)}”.</p>`,
      okLabel: 'Leave without saving',
      danger: true,
    });
    if (!ok) return;
  }
  window.SU_PENDING = { setupId, secName, slot: t, provider };
  location.hash = `#setups/${setupId}`;
}

// ---------- the break picker (one break visible at once — 26 Aug, user call) ----------

let KEY_SLOT = 'preroll';
function keySlotSet(t) { KEY_SLOT = t; FORM.rerender(); }

function keySlot() {
  return KL_META.slotTypes.includes(KEY_SLOT) ? KEY_SLOT : KL_META.slotTypes[0];
}

// ---------- the four breaks as TABS (26 Aug, user call) ----------
// A dropdown made you open it to see the other three, and made the card's subject a
// value inside a control. Four is few enough to sit side by side, and the OPS ROOM
// already tabs its placements — so both rooms now use one tab grammar (`scope-tabs`),
// not a tab in one and a select in the other.
//
// The dropdown's one virtue was that each option carried its own state, so opening it
// summarised the surface. Tabs keep that WITHOUT the opening: every break wears a dot,
// so all four states are legible at rest. The words live on hover, never as a byline.
function slotState(t) {
  const picked = keySecs();
  const onN = picked.filter(j => FORM.data.sections[j].slots[t].on).length;
  const has = picked.some(j => clientLadder(j, t).some(r => !r.opsOff));
  return { onN, total: picked.length, has,
    kind: !has ? 'none' : onN === 0 ? 'off' : onN === picked.length ? 'on' : 'part' };
}

function slotStateWords(t) {
  const s = slotState(t);
  const setup = sectionSetup(0);
  const name = label('slotType', t);
  if (s.kind === 'none') {
    return setup ? `${name} — nothing to run; ad ops add demand to “${setup.name}”`
      : `${name} — no ad setup attached yet`;
  }
  if (s.kind === 'part') return `${name} — on in ${s.onN} of ${s.total} sections`;
  return `${name} — ${s.kind === 'on' ? 'active' : 'inactive'}`;
}

// The state dots are GONE (1 Sep, user call — a legend nobody had). What remains is
// words: a break with nothing to run dims, its reason on hover; the only dot left is
// AMBER and means exactly one thing — this tab holds unsaved changes.
function slotEdited(t) {
  if (!KEY_ORIG_CANON) return false;
  const a = JSON.stringify((FORM.data.drive || {})[t] || null);
  const b = JSON.stringify((KEY_ORIG_CANON.drive || {})[t] || null);
  if (a !== b) return true;
  return (FORM.data.sections || []).some((s2, j) =>
    !!s2.slots[t]?.on !== !!KEY_ORIG_CANON.sections?.[j]?.slots?.[t]?.on);
}

// EVERY BREAK'S SWITCH RIDES ITS OWN TAB (1 Sep, user call): the four states are
// visible in parallel, no tab has to be visited to be switched. Binary as before —
// on = the break asks on this surface; a section that differs says "inactive" on its
// own resolved row. The toggle flips without selecting; the label selects. The edited
// dot is absolutely positioned and the toggle is a fixed size, so nothing on the strip
// ever shifts.
function breakTabsHtml() {
  const setup = sectionSetup(0);
  return `
    <div class="scope-tabs brk-tabs">
      ${KL_META.slotTypes.map(t => {
        const picked = keySecs();
        const anyOn = picked.some(j => FORM.data.sections[j].slots[t].on);
        const has = picked.some(j => clientWalk(j, t).length);
        const vacant = slotState(t).kind === 'none';
        const why = !setup ? 'Attach an ad setup first — ad ops fill it in their room'
          : `Nothing to run — ad ops add ${label('slotType', t).toLowerCase()} demand to “${setup.name}”`;
        const active = keySlot() === t;
        // Grey says SWITCHED OFF, never "not the tab you're on" — the label follows the
        // same truth its mini toggle shows.
        return `<button type="button" class="stab wswitch ${active ? 'on' : ''} ${anyOn ? '' : 'off'} ${vacant ? 'vacant' : ''}"
          title="${esc(slotStateWords(t))}" onclick="keySlotSet('${t}')"
          >${esc(label('slotType', t))}
          <span class="toggle mini ${anyOn ? 'on' : ''} ${(active && (has || anyOn)) ? '' : 'dead'}"
            ${active ? `onclick="event.stopPropagation(); ${has || anyOn ? `secSlotToggle('${t}')` : `toast('${esc(why)}', 'warn')`}"` : ''}
            title="${!active ? 'Open this tab first — then switch it' : anyOn ? `The ${esc(label('slotType', t).toLowerCase())} runs on this surface — switch off to stop asking, every section` : has ? `Switch the ${esc(label('slotType', t).toLowerCase())} on — every section with something to run` : esc(why)}"><span class="track"></span></span>
          ${slotEdited(t) ? '<i class="edot" title="Unsaved changes on this break"></i>' : ''}</button>`;
      }).join('')}
    </div>`;
}

// ---------- the card itself ----------

// The driving controls for one break: three or four rows, all switches and pickers,
// nothing to type. "Use the setup's" beside a bent switch drops the decision — the
// field follows the workshop again, so a later ops change still arrives.
function driveControlsHtml(t) {
  if (isRotation(t)) {
    return `<div class="sg-empty" style="padding:4px 0"
      title="Which banners, when they show and how they pace themselves: the ad setup">Banners take turns — nothing to decide beyond the switch.</div>`;
  }
  const d = driveOf(t);
  const base = slotBhv(0, t) || {};
  const usable = KL_META.slotTypes.filter(t2 => !isRotation(t2)
    && keySecs().some(j => clientLadder(j, t2).some(r => !r.opsOff)));
  const deferOff = (d.start ?? base.start) !== 'deferred';
  const bent = Object.keys(d).length > 0;
  const dFacts = keySecs().map(j => FORM.data.sections[j]).map(s2 => s2?.slots?.[t]?.direct).find(Boolean)
    || KEY_ORIGINAL?.sections?.[0]?.slots?.[t]?.direct;
  const dOn = d.direct !== false;
  // The Direct row is FIXED on every break (1 Sep, user call) — with no deals behind
  // it, the switch is dead in place with the reason, never absent. Nothing appears or
  // vanishes as ops stage demand.
  const directRow = accRow('Direct', dFacts ? `
      <span class="toggle tiny ${dOn ? 'on' : ''}" onclick="driveSet('${t}', 'direct', ${dOn ? 'false' : 'null'})"
        title="${dOn ? 'Switch this break\u2019s direct campaigns off on this surface — it starts at its primary' : 'Switch them on — the tier is tried before the primary'}"><span class="track"></span></span>
      <span class="glimpse-walk${dOn ? '' : ' dim'}">${(dFacts.walk || []).slice(0, 4).map(x => providerBadge(x.provider)).join('<i class="gsep">›</i>')}</span>`
    : `
      <span class="toggle tiny dead" onclick="toast('No direct deals behind this break — ad ops add them in the ad setup\u2019s Direct zone', 'warn')"
        title="No direct deals behind this break — ad ops add them in the ad setup\u2019s Direct zone"><span class="track"></span></span>
      <span class="sg-empty">no direct deals</span>`,
    dFacts
      ? 'The break\u2019s sold-direct deal — tried before its primary each time the break fires. The deal is the ad setup\u2019s; whether it runs here is this switch.'
      : 'Sold-direct demand for this break — none staged yet; the deal lives in the ad setup\u2019s Direct zone.');
  return `
    ${directRow}
    ${accRow('Fallback order', askChipsHtml(t),
      'Who is asked once the primary returns nothing, and in what order — the tiers set the rest: Direct first, then the primary, then this. Drag to reorder; click a chip to skip it at this break.')}
    ${accRow('Waterfall depth', accSeg(d.tries ?? 'all', [1, 2, 3, 'all'], ['1', '2', '3', 'Full'],
      o => `driveSet('${t}', 'tries', ${o === 'all' ? 'null' : o})`),
      'How far down the waterfall this break goes before giving up and playing the video. Shallower starts the video sooner; deeper fills more often. “Full” walks the whole waterfall, however deep ad ops make it.')}
    ${cueRowHtml(t)}
    ${t === 'preroll' ? accRow('Start offset', `${accSeg(d.start ?? base.start, ['start', 'deferred'],
      ['Immediate', 'Delayed'], o => `driveSet('${t}', 'start', '${o}')`)}
      <div class="num-wrap${deferOff ? ' off' : ''}"><input value="${esc(driveDeferText(t, base))}" inputmode="numeric"
        ${deferOff ? 'disabled' : ''} oninput="driveDeferInput(this, '${t}')"><span class="unit">sec</span></div>`,
      'Whether the ad plays the moment the video opens, or a set number of seconds in (JSON: init).') : ''}
    ${accRow('Impressions per break', accSeg(d.podAds ?? base.podAds ?? 1, [1, 2, 3], ['1', '2', '3'],
      o => `driveSet('${t}', 'podAds', ${o})`),
      'How many ads this one break aims to serve, back to back (JSON: impression).')}
    <div class="zrow drive-foot">
      ${usable.length > 1 ? `<button type="button" class="zlink" onclick="driveStampAll('${t}')"
        title="Stamp this break's partners and depth onto every break with demand behind it — a break missing one of the partners is left alone, named">Apply to all breaks</button>` : '<span></span>'}
      <button type="button" class="btn ghost sm drive-reset" ${bent ? '' : 'disabled'}
        onclick="driveResetSlot('${t}')"
        title="${bent ? 'Drop every decision on this break — it follows the ad setup again, and later ops changes arrive on their own' : 'Nothing decided on this break — it already follows the ad setup'}">Reset to setup</button>
    </div>`;
}

// WHERE THE MID-ROLL BREAKS FALL (3 Sep, user call). The cadence used to be the ad
// setup's alone; with the 1:1 promise a setup IS this integration's, so the positions
// are a decision this page can make — stored on the drive, sparse, resolved over the
// placement. Two shapes it will not pretend to answer, greyed in place with the reason:
// an INTERVAL cadence (the positions are not a list then) and a mid-roll running SEVERAL
// break groups (each has its own cadence — one answer cannot stand for all of them).
function midCadence() {
  const setup = sectionSetup(0);
  if (!setup) return { kind: 'nosetup', why: 'Map an ad setup first — the cadence is resolved over its placement' };
  const secs = keySecs().map(j => setupPlacement(j)).filter(Boolean);
  if (!secs.length) return { kind: 'nosetup', why: 'No placement behind this break yet' };
  const groups = secs.map(p => (p.slots.midroll.groups || []).length || 1);
  if (groups.some(n => n > 1)) {
    return { kind: 'groups', why: `This mid-roll runs ${Math.max(...groups)} break groups in “${setup.name}” — each has its own cadence, so where the breaks fall stays the ad setup's` };
  }
  const bases = secs.map(p => p.slots.midroll.behaviourBase || p.slots.midroll.behaviour || {});
  if (bases.some(b => b.mode === 'interval')) {
    const b = bases.find(x => x.mode === 'interval');
    return { kind: 'interval', why: `“${setup.name}” breaks this mid-roll every ${fmtCue(b.every || 480)} rather than at fixed positions — the interval is the ad setup's` };
  }
  // What the placements say TODAY. Placements that disagree never let one of them speak
  // for the rest (the house rule) — the row says they differ until a decision is made.
  const words = [...new Set(bases.map(b => (b.cuepoints || []).map(fmtCue).join(', ')))];
  return { kind: 'ok', base: words.length === 1 ? words[0] : '', differs: words.length > 1, count: words.length };
}

// Typed positions are parsed on the way in and only reformatted on blur — the caret
// rule. An empty box drops the decision: the break follows the ad setup again.
function driveCueInput(el) {
  QF_TEXT['drive:cuepoints'] = el.value;
  const cps = parseCuepointsText(el.value).filter(x => typeof x === 'number');
  if (!el.value.trim()) driveSetQuiet('midroll', 'cuepoints', null);
  else driveSetQuiet('midroll', 'cuepoints', cps.length ? cps : null);
}

function driveCueBlur(el) {
  delete QF_TEXT['drive:cuepoints'];
  FORM.rerender();
  void el;
}

// A write that does NOT repaint — the positions box must keep its caret while typing.
function driveSetQuiet(t, f, val) {
  const d = FORM.data.drive || (FORM.data.drive = {});
  const slot = d[t] || (d[t] = {});
  if (val === null || val === undefined) delete slot[f];
  else slot[f] = val;
  if (!Object.keys(slot).length) delete d[t];
  clearErr('drive');
  const foot = document.querySelector('.drive-reset');
  if (foot) foot.disabled = !Object.keys(driveOf(t)).length;
}

function cueRowHtml(t) {
  if (t !== 'midroll') return '';
  const d = driveOf(t);
  const cad = midCadence();
  const set = d.cuepoints;
  const text = QF_TEXT['drive:cuepoints'] ?? (set ? set.map(fmtCue).join(', ') : '');
  if (cad.kind !== 'ok') {
    const word = cad.kind === 'interval' ? 'set by interval'
      : cad.kind === 'groups' ? 'several cadences'
      : 'no placement yet';
    return accRow('Cue points', `<span class="sg-empty">${esc(word)}</span>`, cad.why);
  }
  return accRow('Cue points', `
    <div class="cue-in${set ? ' set' : ''}"><input type="text" value="${esc(text)}"
      placeholder="${esc(cad.differs ? `${cad.count} placements differ — set one for all` : cad.base || '2:00, 6:00, 9:30')}"
      oninput="driveCueInput(this)" onblur="driveCueBlur(this)"></div>
    ${set ? `<button type="button" class="zlink" onclick="driveSet('${t}', 'cuepoints', null)">use the setup’s</button>`
      : `<span class="sg-dim">${esc(cad.differs ? 'set by placement' : 'as set up')}</span>`}`,
    'Where this surface’s mid-roll breaks fall. Empty follows the ad setup’s own positions; a list here overrides them on every placement.');
}

// ONE act, whole break (1 Sep, user call — the per-field "use the setup's" links were
// scattered): drop the break's every decision; the break follows the workshop again.
function driveResetSlot(t) {
  if (!FORM.data.drive) return;
  delete FORM.data.drive[t];
  if (!Object.keys(FORM.data.drive).length) FORM.data.drive = null;
  for (const k of Object.keys(QF_TEXT)) if (k.startsWith(`drv:${t}:`)) delete QF_TEXT[k];
  clearErr('sections');
  clearErr('drive');
  FORM.rerender();
  toast(`${label('slotType', t)} follows the ad setup again`);
}

// The seconds are the surface's now (27 Aug, user call — reversing "seconds stay ops'"
// from 26 Aug): a surface allowed to defer its pre-roll may as well say by how long.
// Typed, not stepped, so 4 or 12 are as reachable as the setup's 7. Held as text while
// the caret is in the field, exactly like every other number in the panel.
function driveDeferText(t, base) {
  const k = `drv:${t}:deferSec`;
  if (k in QF_TEXT) return QF_TEXT[k];
  const d = driveOf(t);
  return d.deferSec ?? base.deferSec ?? 7;
}

function driveDeferInput(el, t) {
  QF_TEXT[`drv:${t}:deferSec`] = el.value;
  if (!FORM.data.drive) FORM.data.drive = {};
  const slot = { ...(FORM.data.drive[t] || {}) };
  slot.deferSec = Number(el.value);
  FORM.data.drive[t] = slot;
  clearErr('sections');
  clearErr('drive');
}

// What each section runs, beside the controls — the answer next to the decision.
// A section the decision cannot land in says so, with the door to fix it.
function driveConsHtml(t) {
  const setup = sectionSetup(0);
  const ask = driveOf(t).ask || null;
  return keySecs().map(j => {
    const s = FORM.data.sections[j];
    if (!s.slots[t].on) {
      return `<div class="cons-row"><span class="cons-n">${esc(s.name)}</span>
        <span class="cons-v"><span class="sg-dim">inactive</span></span><span class="cons-m"></span></div>`;
    }
    // One row per BREAK GROUP (31 Aug) — a mid-roll may hold up to three, each with its
    // own ladder, and every one answers for itself.
    const gs = clientGroupDefs(j, t);
    return gs.map((g, gi) => {
      const rowName = gs.length > 1 ? `${s.name} · group ${gi + 1}` : s.name;
      const { walk, fellBack } = clientDriveWalk(j, t, gi);
      const base = g.behaviour || {};
      const n = walk.length;
      if (!n) {
        return `<div class="cons-row"><span class="cons-n">${esc(rowName)}</span>
          <span class="cons-v cons-warn">no eligible demand</span>
          <span class="cons-m">${setup && ask ? addLinkHtml(setup, s.name, t, ask[0]) : ''}</span></div>`;
      }
      const shown = walk.slice(0, 4); // four fit the column at any width; the rest is a counted +N
      const badges = shown.map(x => providerBadge(x.provider)).join(isRotation(t)
        ? '<i class="gsep">·</i>' : '<i class="gsep">›</i>')
        + (walk.length > shown.length ? `<span class="sg-dim"> +${walk.length - shown.length}</span>` : '');
      const cadence = gs.length > 1
        ? `<div class="sg-dim">${esc(base.mode === 'interval'
            ? `every ${fmtCue(base.every)}`
            : `at ${(base.cuepoints || []).map(fmtCue).join(', ')}`)}</div>` : '';
      return `
        <div class="cons-row">
          <span class="cons-n">${esc(rowName)}</span>
          <span class="cons-v"><span class="glimpse-walk">${badges}</span>${fellBack
            ? `<div class="cons-warn">no ${esc((ask || []).map(provWord).join(' or '))} here — setup order</div>` : ''}</span>
          <span class="cons-m">${cadence}
            ${fellBack && setup && ask ? `<div>${addLinkHtml(setup, s.name, t, ask[0])}</div>` : ''}</span>
        </div>`;
    }).join('');
  }).join('');
}

function breakPanelHtml(t) {
  const picked = keySecs();
  const setup = sectionSetup(0);
  const onN = picked.filter(j => FORM.data.sections[j].slots[t].on).length;
  const on = onN === picked.length;
  const has = picked.some(j => clientWalk(j, t).length);
  const why = !setup ? 'Attach an ad setup first — ad ops fill it in their room'
    : `Nothing to run — ad ops add ${label('slotType', t).toLowerCase()} demand to “${setup.name}”`;
  void on; void has; void why;
  return `
    <div class="brk ${onN ? '' : 'slot-off'}">
      <div class="slot-edit">
        ${onN ? '' : `<div class="bt-note off-note">${esc(label('slotType', t))} is switched off — it asks for nothing. The switch is on its tab.</div>`}
        <div class="two-col">
          <div class="tc-left ${onN ? '' : 'card-dim dead-panel'}">${driveControlsHtml(t)}</div>
          <div class="tc-right">
            <div class="xa-head">Resolved waterfall</div>
            <div class="cons scrolly">${driveConsHtml(t)}</div>
          </div>
        </div>
      </div>
    </div>`;
}

function adsCardHtml(meta) {
  const setup = sectionSetup(0);
  return `
    <div class="fieldset">
      ${FORM.errors.sections ? `<div class="banner bad" data-err-for="sections">${esc(FORM.errors.sections)}</div>` : ''}
      ${FORM.errors.drive ? `<div class="banner bad" data-err-for="drive">${esc(FORM.errors.drive)}</div>` : ''}
      ${FORM.errors.adSetupId ? `<div class="banner bad" data-err-for="adSetupId">${esc(FORM.errors.adSetupId)}</div>` : ''}
      <div class="fieldset-title-row">
        <div class="fieldset-title">Ad delivery</div>
        <div class="ads-fills">
          ${setup
            ? `<span class="st-chip t" title="${esc(setupSummary(setup))}">${esc(setup.name)}</span><span class="podl">${esc(setup.updatedBy || 'ad ops')} · ${relWhen(setup.updatedAt)}${!KEY_ORIGINAL && setup.usedBy ? ' · becomes this integration\'s own copy at create' : ''}</span>
               <button type="button" class="zlink" onclick="openSetupFromKey('${setup.id}')"
                 title="Open the ad setup in its own editor — ← there brings you back with your edits kept">open</button>
               <button type="button" class="zlink" onclick="changeSetupJourney()">change</button>`
            : `<span class="podl">no ad setup mapped — nothing can fill a break yet</span>`}
        </div>
      </div>
      ${setup ? `${breakTabsHtml()}${breakPanelHtml(keySlot())}` : setupPickCardsHtml()}
    </div>`;
}









function pSet(f, val) {
  FORM.data.player[f] = val;
  clearErr(f);
  FORM.rerender();
}

function pNum(el, f) {
  FORM.data.player[f] = Number(el.value);
  QF_TEXT[`p:${f}`] = el.value;
}

function pText(el, f) {
  FORM.data.player[f] = el.value;
  QF_TEXT[`p:${f}`] = el.value;
}



// ---------- the player, inside Details (3 Sep, user call — the Default label is gone) ----------
// The default player IS the surface's own answer, so its fields sit in Details like any
// other fact of the surface: the playback surface and fallback, then the three facts a
// custom config may fork (playback mode, Expand MiniTV, autoplay behaviour + volume).
// Custom configs are their own CARDS below — a named fork per card; everything a fork
// doesn't carry follows these fields. The 25 Aug trim stands: preload, cellular cap,
// controls/seek, end-of-video and the ad-chrome group stay the publisher's player's.
function playerFieldsHtml() {
  const p = FORM.data.player;
  const meta = KL_META;
  const tv = f => QF_TEXT[`p:${f}`] ?? (p[f] ?? '');
  // ONE GRID (3 Sep, user call — "odd and immature"): the player's rows used to break
  // the card's rhythm. A 240px select next to a 1100px text box read as broken, and the
  // three facts bunched into the left third with dead space beside them. Now every
  // player field takes an even share of the row, so the block reads as the same grid the
  // identity rows above it are drawn on.
  return `
    <div class="frow">
      <div class="field grow" style="min-width: 240px"><label>Playback</label>
        <div class="fctl">
          ${selectHtml(p.playbackMode, meta.playbackModes.map(v => ({ v, label: label('playbackMode', v) })), v => pSet('playbackMode', v))}
          ${p.playbackMode === 'inline_redirect' ? `<span class="rule-text"><input type="text" class="mono" value="${esc(tv('redirectUrl'))}" placeholder="https://…" oninput="pText(this, 'redirectUrl')"></span>` : ''}
        </div>
      </div>
      ${textFieldHtml('Fallback media', 'fallbackMediaId', { placeholder: 'media id', mono: true, grow: true })}
    </div>
    <div class="frow pfacts">
      ${pcFactsHtml(p, (f, v) => `pSet('${f}', ${v})`, "pNum(this, 'startVolume')", QF_TEXT['p:startVolume'] ?? (p.startVolume ?? ''))}
    </div>`;
}

// Adding is naming (askName, the section grammar): the fork is born a photocopy of the
// default's three facts — a copy, never a link, so tuning it later moves nothing else.
async function pcAdd() {
  const cfgs = FORM.data.playerConfigs || (FORM.data.playerConfigs = []);
  const max = KL_META.maxPlayerConfigs || 6;
  if (cfgs.length >= max) { toast(`At most ${max} custom configs per integration`, 'warn'); return; }
  const name = await askName({
    title: 'Name the custom config',
    placeholder: 'e.g. Shorts feed', okLabel: 'Add',
  });
  if (!name) return;
  if (name.toLowerCase() === 'default' || cfgs.some(c => c.name.toLowerCase() === name.toLowerCase())) {
    toast(`A config named “${name}” is already here — a player asking by name must find exactly one`, 'warn');
    return;
  }
  const p = FORM.data.player;
  cfgs.push({
    name,
    playback: p.playback ?? 'active',
    expandInMini: p.expandInMini ?? true,
    autoplay: p.autoplay ?? 'muted',
    startVolume: p.startVolume ?? 80,
  });
  PC_SEL = cfgs.length - 1;
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
  PC_SEL = Math.max(0, Math.min(PC_SEL, FORM.data.playerConfigs.length - 1));
  for (const k of Object.keys(QF_TEXT)) if (k.startsWith('pc:')) delete QF_TEXT[k];
  clearErr('playerConfigs');
  FORM.rerender();
}

function pcSet(i, f, val) {
  FORM.data.playerConfigs[i][f] = val;
  clearErr('playerConfigs');
  FORM.rerender();
}

// The name repaints only its own tab label — typing must never lose the caret.
function pcName(el, i) {
  FORM.data.playerConfigs[i].name = el.value;
  const tab = document.querySelectorAll('.pc-tabs .stab')[i];
  if (tab) tab.textContent = el.value || 'Untitled';
  clearErr('playerConfigs');
}

function pcNum(el, i, f) {
  FORM.data.playerConfigs[i][f] = Number(el.value);
  QF_TEXT[`pc:${i}:${f}`] = el.value;
  clearErr('playerConfigs');
}

// The per-placement facts, drawn the same way on every tab. `set` and `num` are the
// tab's own writers; the volume rides the autoplay behaviour and appears only where a
// player starts unmuted — one compound field, exactly as the old Details row read.
function pcFactsHtml(c, set, num, volText) {
  const meta = KL_META;
  return `
    <div class="field">
      <label>Playback mode</label>
      ${accSeg(c.playback ?? 'active', meta.playbackKinds, meta.playbackKinds.map(o => label('playback', o)), o => set('playback', `'${o}'`))}
    </div>
    <div class="field" title="Whether the MiniTV expands while an ad runs">
      <label>Expand MiniTV for ads</label>
      ${accSeg(c.expandInMini ?? true, [true, false], ['True', 'False'], o => set('expandInMini', o))}
    </div>
    <div class="field">
      <label>Autoplay behaviour</label>
      <div class="fctl">
        ${accSeg(c.autoplay ?? 'muted', meta.autoplay, meta.autoplay.map(o => label('autoplay', o)), o => set('autoplay', `'${o}'`))}
        ${(c.autoplay ?? 'muted') === 'sound' ? `<div class="num-wrap"><input value="${esc(volText)}" inputmode="numeric" oninput="${num}"><span class="unit">%</span></div>` : ''}
      </div>
    </div>`;
}

// ONE TAB PER CUSTOM CONFIG (3 Sep, user call — the stacked cards are gone). Six cards
// down a page is a scroll, not a comparison; a strip of names is both. The selected
// fork's fields are drawn in the SAME grid Details uses, so a config reads like the
// player it forks, one row lower. The section always stands (stable layout); empty, it
// is the add CTA and five words.
let PC_SEL = 0;

function pcSelect(i) { PC_SEL = i; FORM.rerender(); }

function customConfigsHtml() {
  const cfgs = FORM.data.playerConfigs || [];
  const max = KL_META.maxPlayerConfigs || 6;
  if (PC_SEL >= cfgs.length) PC_SEL = Math.max(0, cfgs.length - 1);
  const c = cfgs[PC_SEL];
  return `
    <div class="fieldset">
      ${FORM.errors.playerConfigs ? `<div class="banner bad" data-err-for="playerConfigs">${esc(FORM.errors.playerConfigs)}</div>` : ''}
      <div class="fieldset-title-row">
        <div class="fieldset-title">Custom player configs</div>
        ${cfgs.length ? `<span class="podl">${cfgs.length} of ${max} — a player asking by name gets these; everything else follows Details</span>` : ''}
      </div>
      ${cfgs.length ? `
      <div class="scope-tabs pc-tabs">
        ${cfgs.map((x, i) => `<button type="button" class="stab ${i === PC_SEL ? 'on' : ''}"
          onclick="pcSelect(${i})">${esc(x.name || 'Untitled')}</button>`).join('')}
        <button type="button" class="stab add" ${cfgs.length >= max ? `disabled title="At most ${max} custom configs per integration"` : ''}
          onclick="pcAdd()">+ Add custom config</button>
      </div>
      <div class="frow pc-idrow">
        <div class="field"><label>Name</label>
          <input type="text" value="${esc(c.name)}" placeholder="e.g. Shorts feed" oninput="pcName(this, ${PC_SEL})"></div>
        <div class="field pc-rm">
          <button type="button" class="zlink danger" onclick="pcRemove(${PC_SEL})">Remove</button></div>
      </div>
      <div class="frow pfacts">
        ${pcFactsHtml(c, (f, v) => `pcSet(${PC_SEL}, '${f}', ${v})`, `pcNum(this, ${PC_SEL}, 'startVolume')`, QF_TEXT[`pc:${PC_SEL}:startVolume`] ?? (c.startVolume ?? ''))}
      </div>`
      : `<div class="pcc-empty">None — players follow the fields in Details
           <button type="button" class="zlink" onclick="pcAdd()">+ Add custom config</button></div>`}
    </div>`;
}

// A new integration starts from a player preset — a photocopy, never a link.
function stampPreset(name) {
  const pp = KL_META.playerPresets.find(p => p.name === name);
  if (!pp) return;
  FORM.data.presetName = name;
  FORM.data.player = JSON.parse(JSON.stringify(pp.values));
  FORM.rerender();
}

async function syncGamClicked() {
  const ok = await ask({ title: 'Sync ad units from GAM?', okLabel: 'Sync' });
  if (!ok) return;
  const { added, lastSync } = await API.gamSync();
  GAM_LAST_SYNC = lastSync;
  const note = document.querySelector('.gam-sync-note');
  if (note) note.textContent = `synced ${relWhen(lastSync)}`;
  toast(added ? `${added} new ad unit${added > 1 ? 's' : ''} pulled from GAM` : 'GAM is up to date — nothing new');
}

function renderKeyForm(meta) {
  const d = FORM.data;
  const editing = !!KEY_ORIGINAL;
  const main = document.getElementById('main');


  const n = editing ? (PUB?.unpublished || []).length : 0;
  const live = editing ? PUB?.liveVersion != null : false;
  main.innerHTML = `
    <div class="ehead ${editing ? 'with-rail' : ''}">
      <a class="eh-back" href="#keys" title="Back to integrations">←</a>
      <h1>${editing ? esc(KEY_ORIGINAL.name) : 'New integration'}</h1>
      ${editing ? pubStateChipHtml() : d.copiedFrom ? `<span class="podl">copied from “${esc(d.copiedFrom)}”</span>` : ''}
      <span class="eh-gap"></span>
      ${editing ? `
        <button class="btn ghost" onclick="saveKeyClicked()">Save</button>
        <button class="btn ${n ? '' : 'ghost'}" ${n ? '' : 'disabled title="Nothing to publish — what is on air is what you see"'}
          onclick="publishClicked()">${live ? 'Publish' : 'Publish — go on air'}${n ? ` (${n})` : ''}</button>
        <div class="eh-more ${KEY_MORE_OPEN ? 'open' : ''}">
          <button type="button" class="btn ghost eh-more-btn" onclick="keyMoreToggle(event)" title="More actions">⋯</button>
          <div class="eh-menu">
            <div class="eh-item" onclick="keyMoreToggle(); copyText('${esc(KEY_ORIGINAL.key)}', 'API key copied')">Copy API key <span class="mono sg-dim">${esc(KEY_ORIGINAL.key.slice(0, 14))}…</span></div>
            <div class="eh-item" onclick="keyMoreToggle(); duplicateKeyClicked()" title="Clone this whole surface — new key string, and off air until someone publishes it">Duplicate</div>
            <div class="eh-item danger ${KEY_ORIGINAL.live ? 'dim' : ''}" ${KEY_ORIGINAL.live
              ? 'title="Take it off air first — deleting live traffic should be deliberate"'
              : 'onclick="keyMoreToggle(); deleteKeyClicked()"'}>Delete</div>
          </div>
        </div>`
      : `<button class="btn" onclick="saveKeyClicked()">Create integration</button>`}
    </div>
    <div class="detail">
    <div class="form">
      <div class="fieldset">
        <div class="fieldset-title">Details</div>
        <div class="frow">
          ${textFieldHtml('Name', 'name', { placeholder: 'e.g. TOI Mweb VideoShow', grow: true })}
          <div class="field" style="min-width: 130px"><label>Property</label>
            ${selectHtml(d.property, meta.properties.map(v => ({ v, label: v })), v => { FORM.data.property = v; clearErr('property'); FORM.rerender(); })}
          </div>
          <div class="field" style="min-width: 150px"><label>Platform</label>
            ${selectHtml(d.platform, meta.platforms.map(v => ({ v, label: label('platform', v) })), v => { FORM.data.platform = v; clearErr('platform'); FORM.rerender(); })}
          </div>
          ${!editing && d.presetName ? `
          <div class="field" style="min-width: 170px"><label>Template</label>
            ${selectHtml(d.presetName, meta.playerPresets.map(p => ({ v: p.name, label: p.name })), v => stampPreset(v))}
          </div>` : ''}
        </div>
        <div class="frow">
          ${chipsFieldHtml('Domains', 'domains', { placeholder: 'add a domain and press Enter', grow: true, dep: 'web' })}
          ${textFieldHtml('Package name', 'packageName', { placeholder: 'com.toi.reader', mono: true, grow: true, dep: 'app' })}
        </div>
        ${playerFieldsHtml()}
      </div>

      ${customConfigsHtml()}

      ${adsCardHtml(meta)}
    </div>
    ${editing ? pubRailHtml() : ''}
    </div>`;
}

// The ⋯ menu, open or not — page state, closed by any rerender-worthy act.
let KEY_MORE_OPEN = false;
function keyMoreToggle(e) {
  if (e) e.stopPropagation();
  KEY_MORE_OPEN = !KEY_MORE_OPEN;
  FORM.rerender();
}

const KEY_FIELDS = ['name', 'property', 'platform', 'domains', 'packageName', 'adSetupId', 'drive', 'player', 'playerConfigs', 'sections'];

function keyPayload(d) {
  return {
    name: d.name, property: d.property, platform: d.platform,
    domains: d.domains, packageName: d.packageName,
    adSetupId: d.adSetupId || null,
    drive: d.drive && Object.keys(d.drive).length ? JSON.parse(JSON.stringify(d.drive)) : null,
    player: d.player,
    playerConfigs: JSON.parse(JSON.stringify(d.playerConfigs || [])),
    sections: d.sections.map(s => ({
      name: s.name,
      slots: Object.fromEntries(Object.entries(s.slots || {}).map(([t, slot]) => [t, { on: !!slot.on }])),
    })),
  };
}

// WHAT THIS SAVE WOULD WRITE, field by field (2 Sep) — the same `{where, field, from,
// to}` shape the server's version diff speaks, so the review screen renders a save and
// a publish through one code path. `formDiff` still guards the "nothing changed" case;
// it works in whole field groups (`drive`, `player`), which is fine for a gate and
// useless in a review — nobody reads a drive object as a diff.
function keyChangeList(a, b) {
  const out = [];
  for (const f of ['name', 'property', 'platform', 'domains', 'packageName', 'adSetupId']) {
    if (JSON.stringify(a[f] ?? '') !== JSON.stringify(b[f] ?? '')) {
      out.push({ where: '', field: f, from: a[f], to: b[f] });
    }
  }
  const pf = new Set([...Object.keys(a.player || {}), ...Object.keys(b.player || {})]);
  for (const f of pf) {
    if (JSON.stringify(a.player?.[f]) !== JSON.stringify(b.player?.[f])) {
      out.push({ where: 'Player', field: f, from: a.player?.[f], to: b.player?.[f] });
    }
  }
  // Custom configs are matched by NAME, like placements: appearing or leaving is one
  // line, a field moving inside one is named where it lives.
  const byName = arr => Object.fromEntries((arr || []).map(c => [c.name, c]));
  const ca = byName(a.playerConfigs);
  const cb = byName(b.playerConfigs);
  for (const nm of Object.keys(ca)) {
    if (!cb[nm]) out.push({ where: 'Player configs', field: nm, label: nm, from: 'custom config', to: 'removed' });
  }
  for (const nm of Object.keys(cb)) {
    if (!ca[nm]) { out.push({ where: 'Player configs', field: nm, label: nm, from: '—', to: 'added' }); continue; }
    for (const f of ['playback', 'expandInMini', 'autoplay', 'startVolume']) {
      if (JSON.stringify(ca[nm][f]) !== JSON.stringify(cb[nm][f])) {
        out.push({ where: `Player configs · ${nm}`, field: f, from: ca[nm][f], to: cb[nm][f] });
      }
    }
  }
  // The drive is keyed by break, so the break is the where — the review's whole point.
  for (const t of KL_META.slotTypes) {
    const da = (a.drive || {})[t] || {};
    const db = (b.drive || {})[t] || {};
    for (const f of new Set([...Object.keys(da), ...Object.keys(db)])) {
      if (JSON.stringify(da[f]) !== JSON.stringify(db[f])) {
        out.push({ where: label('slotType', t), field: f, from: da[f], to: db[f] });
      }
    }
  }
  // A switch is the loudest change on the page: it is what asks or stops asking.
  const sa = byName(a.sections);
  for (const s of b.sections || []) {
    const prev = sa[s.name];
    if (!prev) continue;
    for (const t of KL_META.slotTypes) {
      if (!!prev.slots?.[t]?.on !== !!s.slots?.[t]?.on) {
        out.push({
          where: label('slotType', t), field: `${s.name} — runs`,
          from: prev.slots?.[t]?.on ? 'active' : 'inactive',
          to: s.slots?.[t]?.on ? 'active' : 'inactive',
        });
      }
    }
  }
  return out;
}

// The birth certificate (3 Sep): everything the create writes, in the page's own order —
// identity, player, configs, delivery — read back on the same screen as every save.
function createChangeList() {
  const d = FORM.data;
  const meta = KL_META;
  const web = meta.webPlatforms.includes(d.platform);
  const rows = [];
  const born = (where, field, toText, lbl) => {
    if (toText) rows.push({ where, field, ...(lbl ? { label: lbl } : {}), fromText: '—', toText });
  };
  born('', 'name', d.name.trim());
  if (d.copiedFrom) born('', 'source', d.copiedFrom, 'Copied from');
  born('', 'property', d.property);
  born('', 'platform', label('platform', d.platform));
  born('', web ? 'domains' : 'packageName', web ? d.domains.join(', ') : d.packageName.trim());
  const p = d.player || {};
  born('Player', 'playback', label('playback', p.playback ?? 'active'));
  born('Player', 'expandInMini', (p.expandInMini ?? true) ? 'True' : 'False');
  born('Player', 'autoplay', `${label('autoplay', p.autoplay ?? 'muted')}${(p.autoplay ?? 'muted') === 'sound' ? ` · ${p.startVolume}%` : ''}`);
  for (const c of d.playerConfigs || []) {
    rows.push({ where: 'Player configs', field: c.name, label: c.name, fromText: '—', toText: 'added' });
  }
  const setup = sectionSetup(0);
  rows.push({ where: 'Ad delivery', field: 'adSetupId', fromText: '—',
    toText: setup ? `${setup.name}${setup.usedBy ? ' — as its own copy' : ''}` : 'none — every break stays off' });
  for (const sec of d.sections || []) {
    for (const t of meta.slotTypes) {
      if (sec.slots[t]?.on) {
        rows.push({ where: label('slotType', t), field: `${sec.name} — runs`, label: `${sec.name} — runs`, fromText: '—', toText: 'active' });
      }
    }
  }
  return rows;
}

async function saveKeyClicked() {
  const d = keyPayload(FORM.data);
  try {
    let warnings = [];
    if (KEY_ORIGINAL) {
      const changes = formDiff(KEY_ORIG_CANON, d, KEY_FIELDS);
      if (!changes.length) { toast('Nothing changed'); return; }
      // Save is reviewed too (2 Sep, user call): the draft is where a mistake starts,
      // so what it writes is read first. Same screen Publish and bulk Apply end on.
      const ok = await reviewChanges({
        title: `Save changes to “${KEY_ORIGINAL.name}”?`,
        changes: keyChangeList(KEY_ORIG_CANON, d),
        kicker: PUB?.liveVersion != null ? `draft only — v${PUB.liveVersion} stays on air` : 'draft only — not on air',
        okLabel: 'Save', cancelLabel: 'Keep editing',
      });
      if (!ok) return;
      // Save writes the DRAFT (27 Aug) — it never reaches a viewer, so it asks nothing
      // and stays on the page. Publish is the release, and the rail counts the gap.
      const res = await API.updateKey(KEY_ORIGINAL.id, d);
      warnings = res.warnings || [];
      KEY_ORIGINAL = res.key;
      KEY_ORIG_CANON = keyPayload(JSON.parse(JSON.stringify(FORM.data)));
      warnings.forEach(w => toast(w, 'warn'));
      await pubReload();
      PUB.name = KEY_ORIGINAL.name;
      const n = (PUB.unpublished || []).length;
      toast(n ? `Saved — ${n} change${n === 1 ? '' : 's'} waiting to publish` : 'Saved');
      return;
    } else {
      // CREATE, read back first (3 Sep): the same screen every other write ends on, in
      // the page's own order. A held setup becomes this integration's own copy between
      // Confirm and create; a refusal removes the copy again — nothing orphans.
      const ok = await reviewChanges({
        title: `Create “${(d.name || 'this integration').trim()}”?`,
        changes: createChangeList(),
        keepOrder: true,
        kicker: 'off air until someone publishes it',
        okLabel: 'Create', cancelLabel: 'Keep editing',
      });
      if (!ok) return;
      let madeSetup = null;
      const held = SETUPS_CACHE.find(x => x.id === d.adSetupId && x.usedBy);
      if (held) {
        let copy;
        try { copy = (await API.duplicateSetup(held.id, `${(d.name || 'New integration').trim()} demand`)).setup; }
        catch { copy = (await API.duplicateSetup(held.id)).setup; }
        madeSetup = copy;
        d.adSetupId = copy.id;
      }
      let res;
      try {
        res = await API.createKey(d);
      } catch (e) {
        if (madeSetup) { try { await API.deleteSetup(madeSetup.id); } catch { /* already gone */ } }
        throw e;
      }
      (res.warnings || []).forEach(w => toast(w, 'warn'));
      toast(`“${res.key.name}” created — off air until you publish it`);
      location.hash = `#keys/${res.key.id}`;
      return;
    }
    warnings.forEach(w => toast(w, 'warn'));
    location.hash = '#keys';
  } catch (e) {
    applyServerErrors(e);
  }
}

async function duplicateKeyClicked() {
  const ok = await ask({ title: `Duplicate “${KEY_ORIGINAL.name}”?`, body: 'The copy gets its own copy of the ad setup, and starts off air — it cannot serve until someone publishes it.', okLabel: 'Duplicate' });
  if (!ok) return;
  try {
    const { key } = await API.duplicateKey(KEY_ORIGINAL.id);
    toast(`Duplicated as “${key.name}” — off air until you publish it`);
    location.hash = `#keys/${key.id}`;
  } catch (e) {
    toast(e.message, 'bad');
  }
}

async function deleteKeyClicked() {
  const ok = await ask({
    title: `Delete “${KEY_ORIGINAL.name}”?`,
    body: 'The key stops resolving permanently. This cannot be undone.',
    okLabel: 'Delete',
    danger: true,
  });
  if (!ok) return;
  try {
    await API.deleteKey(KEY_ORIGINAL.id);
    toast('Integration deleted');
    location.hash = '#keys';
  } catch (e) {
    toast(e.message, 'bad');
  }
}

// ---------- new integration: the CHOOSER (3 Sep, user call — the wizard is gone) ----------
// One modal, one question: start from what? A blank surface, or a photocopy of an
// integration that already runs (its card wears counted facts). Either way the EDIT
// PAGE is the workshop — the chooser only decides what the page opens holding.
// #keys/new lands here; Create at the page's head is the one write.
let KEY_CREATE_SEED = null;

async function newIntegrationChooser() {
  const meta = await getMeta();
  window.KL_META = window.KL_META || meta;
  const [{ keys }, { setups }] = await Promise.all([API.listKeys(), API.listSetups()]);
  SETUPS_CACHE = setups;
  history.replaceState(null, '', '#keys/new');
  const rows = keys.slice().sort((a, b) => (b.updatedAt || '').localeCompare(a.updatedAt || ''));
  const card = k => {
    const onN = meta.slotTypes.filter(t => k.slotsOn?.[t]).length;
    const cfg = (k.playerConfigs || []).length;
    const facts = [
      k.setupName || 'no ad setup',
      `${onN || 'no'} break${onN === 1 ? '' : 's'} on`,
      ...(cfg ? [`${cfg} player config${cfg === 1 ? '' : 's'}`] : []),
    ].join(' · ');
    return `
      <div class="dlg-card" onclick="chooseCopy('${k.id}')" title="A photocopy — nothing changes on ${esc(`“${k.name}”`)}">
        <div class="dc-top"><span class="dc-title">${esc(k.name)}</span><span class="dc-reach">${esc(label('platform', k.platform))}</span></div>
        <div class="dc-sum">${propBadge(k.property)} <span>${esc(facts)}</span></div>
      </div>`;
  };
  document.getElementById('dialog-root').innerHTML = `
    <div class="dlg-veil"><div class="dlg wide autoh">
      <h3>New integration<span class="dlg-kicker">blank, or from a copy — it takes shape on its page</span></h3>
      <div class="dlg-body">
        <div class="dlg-cards">
          <div class="dlg-card create" onclick="chooseBlank()">
            <div class="dc-plus">+</div>
            <div class="dc-title">Start blank</div>
            <div class="dc-sum">Identity, player and ad delivery — one page</div>
          </div>
          ${rows.map(card).join('')}
        </div>
      </div>
      <div class="dlg-foot"><button class="btn ghost" onclick="chooserClose()">Cancel</button></div>
    </div></div>`;
  document.querySelector('.dlg-veil').onclick = e => {
    if (e.target.classList.contains('dlg-veil')) chooserClose();
  };
}

// Cancel walks the address back too — ← and refresh keep meaning what they say.
function chooserClose() {
  document.getElementById('dialog-root').innerHTML = '';
  history.replaceState(null, '', '#keys');
}

async function chooseBlank() {
  KEY_CREATE_SEED = null;
  document.getElementById('dialog-root').innerHTML = '';
  await viewKeyForm(null);
}

async function chooseCopy(id) {
  try {
    const { key } = await API.getKey(id);
    KEY_CREATE_SEED = key;
    document.getElementById('dialog-root').innerHTML = '';
    await viewKeyForm(null);
  } catch (e) {
    toast(e.message, 'bad');
  }
}
