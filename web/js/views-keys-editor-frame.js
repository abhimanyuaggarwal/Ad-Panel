// views-keys-editor-frame.js — the integration page's FRAME and its writes: the header
// (name, publish state, Save / Publish, the ⋯ menu), the page render that assembles the
// FOUR cards (Details · Player behaviour · Player configs · Ad behaviour — 11 Sep: the
// player's 25 levers could not keep lodging inside Details), WHAT A SAVE WRITES (`keyPayload`, the field-level change list), and
// save / create / duplicate / delete plus the new-integration chooser.
// Loads last of the four integration-page files.
function renderKeyForm(meta) {
  const d = FORM.data;
  const editing = !!KEY_ORIGINAL;
  const main = document.getElementById('main');


  const n = editing ? (PUB?.unpublished || []).length : 0;
  const live = editing ? PUB?.liveVersion != null : false;
  main.innerHTML = `
    <div class="ehead ${editing ? 'with-rail' : ''}">
      <a class="eh-back" href="#keys">←</a>
      <h1>${editing ? esc(KEY_ORIGINAL.name) : 'New integration'}</h1>
      ${editing ? pubStateChipHtml() : d.copiedFrom ? `<span class="podl">copied from “${esc(d.copiedFrom)}”</span>` : ''}
      <span class="eh-gap"></span>
      ${editing ? `
        <button class="btn ghost" onclick="saveKeyClicked()">Save</button>
        <button class="btn ${n ? '' : 'ghost'}"
          onclick="publishClicked()">${live ? 'Publish' : 'Publish — go on air'}</button>
        <div class="eh-more ${KEY_MORE_OPEN ? 'open' : ''}">
          <button type="button" class="btn ghost eh-more-btn" onclick="keyMoreToggle(event)">⋯</button>
          <div class="eh-menu">
            <div class="eh-item" onclick="keyMoreToggle(); copyText('${esc(KEY_ORIGINAL.key)}', 'API key copied')">Copy API key <span class="mono sg-dim">${esc(KEY_ORIGINAL.key.slice(0, 14))}…</span></div>
            <div class="eh-item" onclick="keyMoreToggle(); duplicateKeyClicked()">Duplicate</div>
            ${KEY_ORIGINAL.live ? `<div class="eh-item danger" onclick="keyMoreToggle(); takeOffAirClicked('key', '${KEY_ORIGINAL.id}', '${esc(KEY_ORIGINAL.name)}')">Deactivate integration</div>` : ''}
            <div class="eh-item danger ${KEY_ORIGINAL.live ? 'dim' : ''}" ${KEY_ORIGINAL.live
              ? 'title="On air — take it off air first"'
              : 'onclick="keyMoreToggle(); deleteKeyClicked()"'}>Delete</div>
          </div>
        </div>`
      : `<button class="btn" onclick="saveKeyClicked()">Create integration</button>`}
    </div>
    <div class="detail">
    <div class="form keyform">
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
        </div>
        <div class="frow">
          ${chipsFieldHtml('Domains', 'domains', { placeholder: 'add a domain and press Enter', grow: true, dep: 'web' })}
          ${textFieldHtml('Package name', 'packageName', { placeholder: 'com.toi.reader', mono: true, grow: true, dep: 'app' })}
        </div>
      </div>

      ${playerCardHtml()}

      ${adsCardHtml(meta)}
    </div>
    ${editing ? pubRailHtml() : ''}
    </div>`;
  paintChg();
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
    drive: d.drive && Object.keys(d.drive).length ? deepCopy(d.drive) : null,
    player: d.player,
    // A row nobody keyed is a row nobody made: it never reaches the server, so an
    // abandoned add costs a refusal to no one.
    playerConfigs: deepCopy((d.playerConfigs || []).filter(c => (c.name || '').trim())),
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
    // The row's switch, in words — absence is on, like a rung's (the server diff agrees).
    if ((ca[nm].on !== false) !== (cb[nm].on !== false)) {
      out.push({ where: 'Player configs', field: nm, label: nm,
        fromText: ca[nm].on !== false ? 'on' : 'off', toText: cb[nm].on !== false ? 'on' : 'off' });
    }
    // EVERY FIELD A CONFIG MAY OVERRIDE (13 Sep) — the seam's own list. A config is
    // sparse, so an absent side reads `follows default`, in words: a new override on an
    // existing config is one line, and dropping one is one line too.
    for (const f of (KL_META.playerFields || [])) {
      if (JSON.stringify(ca[nm][f]) !== JSON.stringify(cb[nm][f])) {
        out.push({ where: `Player configs · ${nm}`, field: f,
          fromText: pbWord(f, ca[nm][f]), toText: pbWord(f, cb[nm][f]) });
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
  // THE PLAYER IS ITS SEED PLUS WHAT MOVED (14 Sep). Until now the birth certificate copied
  // the preset out — twenty-five rows of values nobody typed, under which the one or two
  // settings somebody DID decide were indistinguishable from the rest. A new default
  // player is a photocopy of a named shape (a preset, or the surface it was copied from),
  // so that is the fact: the seed on one line, then every setting that moved off it as
  // WAS → NOW against the seed — the same rows the Default card counts and the sheet
  // wears the bar on, in the card's own sections and the sheet's own words. A copy's seed
  // is already the `Copied from` line above, so only its moves are listed.
  const p = d.player || {};
  if (d.presetName) rows.push({ where: 'Player', field: 'preset', label: 'Starts from', fromText: '—', toText: `${d.presetName} preset` });
  const seed = d.playerSeed || {};
  // A seed that never spoke about a field left it at the player's own default — that is the
  // word the reviewer should see it move FROM, not "follows default", which is a config's.
  const seedWord = f => {
    const v = seed[f];
    if (v !== undefined && v !== null) return pbWord(f, v);
    const def = cfgDefs()[f] || {};
    return def.dflt !== undefined ? pbWord(f, def.dflt) : (def.none || '—');
  };
  for (const f of pcMovedFields()) {
    const sec = CFG_SECTIONS.find(s => cfgSecFields(s).includes(f));
    rows.push({ where: `Player · ${sec ? sec.name : 'Playback'}`, field: f, label: cfgFieldLabel(f),
      fromText: seedWord(f), toText: pbWord(f, p[f]) });
  }
  for (const c of d.playerConfigs || []) {
    const n = (KL_META.playerFields || []).filter(f => c[f] !== undefined).length;
    rows.push({ where: 'Player configs', field: c.name, label: c.name, fromText: '—',
      toText: `${c.on === false ? 'added — off' : 'added'}${n ? ` · ${n} override${n === 1 ? '' : 's'}` : ' · follows the default'}` });
  }
  const setup = sectionSetup(0);
  rows.push({ where: 'Ad behaviour', field: 'adSetupId', fromText: '—',
    toText: setup ? `${setup.name}${d.copyAtCreate ? ' — as its own copy' : ''}` : 'none — every break stays off' });
  for (const sec of d.sections || []) {
    for (const t of meta.slotTypes) {
      if (sec.slots[t]?.on) {
        rows.push({ where: label('slotType', t), field: `${sec.name} — runs`, label: `${sec.name} — runs`, fromText: '—', toText: 'active' });
      }
    }
  }
  return rows;
}

// WHAT THE PAGE ALREADY KNOWS IS REFUSED ON THE PAGE (7 Sep, UAT P1) — before THE
// CHANGE REVIEW opens, not after Confirm. The same rules the seam holds, said once, in
// the field they belong to. Anything only the seam can know still comes back from it.
function keyClientErrors(d) {
  const errs = [];
  if (!(d.name || '').trim()) errs.push({ field: 'name', message: 'Name is required' });
  const web = (KL_META.webPlatforms || ['mweb', 'desktop']).includes(d.platform);
  const plat = label('platform', d.platform);
  if (web && !(d.domains || []).length) {
    errs.push({ field: 'domains', message: `${plat} integrations need at least one domain — the player refuses requests from anywhere else` });
  }
  if (!web && !(d.packageName || '').trim()) {
    errs.push({ field: 'packageName', message: `${plat} integrations need a package name (e.g. com.toi.reader)` });
  }
  // The three key rules, read straight off the data (14 Sep) — the map of bad keys a
  // half-born column used to need is gone with the column.
  if ((FORM.data.playerConfigs || []).some((c, i) => pcKeyWhy((c.name || '').trim(), i))) {
    errs.push({ field: 'playerConfigs', message: 'Fix the custom config key first' });
  }
  if (typeof DRIVE_CUE_BAD !== 'undefined' && DRIVE_CUE_BAD) {
    errs.push({ field: 'drive', message: DRIVE_CUE_BAD });
  }
  return errs;
}
async function saveKeyClicked(opts = {}) {
  // quiet (7 Sep, user call): Publish folds the save into its own act — no save review,
  // no 'Saved' toast; the publish review reads the whole session and carries the receipt.
  const quiet = !!opts.quiet;
  const d = keyPayload(FORM.data);
  const pre = keyClientErrors(d);
  if (pre.length) { applyServerErrors({ errors: pre }); return; }
  try {
    let warnings = [];
    if (KEY_ORIGINAL) {
      const changes = formDiff(KEY_ORIG_CANON, d, KEY_FIELDS);
      if (!changes.length) { if (!quiet) toast('Nothing changed'); return { warnings }; }
      // Save is reviewed too (2 Sep, user call): the draft is where a mistake starts,
      // so what it writes is read first. Same screen Publish and bulk Apply end on.
      if (!quiet) {
        const ok = await reviewChanges({
          title: `Save changes to “${KEY_ORIGINAL.name}”?`,
          changes: keyChangeList(KEY_ORIG_CANON, d),
          kicker: PUB?.liveVersion != null ? `draft only — v${PUB.liveVersion} stays on air` : 'draft only — not on air',
          okLabel: 'Save', cancelLabel: 'Keep editing',
        });
        if (!ok) return;
      }
      // Save writes the DRAFT (27 Aug) — it never reaches a viewer, so it asks nothing
      // and stays on the page. Publish is the release, and the rail counts the gap.
      const res = await API.updateKey(KEY_ORIGINAL.id, d);
      warnings = res.warnings || [];
      KEY_ORIGINAL = res.key;
      KEY_ORIG_CANON = keyPayload(deepCopy(FORM.data));
      FORM.saved = deepCopy(FORM.data);
      await pubReload();
      PUB.name = KEY_ORIGINAL.name;
      // The pill says the act; the header chip counts what waits to publish. The API's
      // soft `warnings` are still handed back to whoever asked for the save, but nothing
      // reads them since 11 Sep — the amber block they filled on THE CHANGE REVIEW was
      // removed (user call). They never belonged in the two-second pill either.
      if (!quiet) toast('Saved');
      return { warnings };
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
      // The copy the person ASKED for waits until now, so a cancelled create leaves
      // nothing behind. Until 8 Sep a setup someone else already filled was photocopied
      // here too, whether or not anyone asked — the 1:1 promise made it the only legal
      // ending. Sharing is legal now, so the copy follows the INTENT alone:
      // `copyAtCreate` is set by `Use a copy` and by the chooser's photocopy seed. It is
      // a page fact, not a payload field — keyPayload never carries it — so it is read
      // from the form itself.
      let madeSetup = null;
      const toCopy = FORM.data.copyAtCreate ? SETUPS_CACHE.find(x => x.id === d.adSetupId) : null;
      if (toCopy) {
        let copy;
        // The name the person gave the copy when they asked for it (8 Sep) — falling
        // back to this integration's own demand for the held-setup copy, which nobody
        // typed a name for.
        try { copy = (await API.duplicateSetup(toCopy.id, FORM.data.copyName || `${(d.name || 'New integration').trim()} demand`)).setup; }
        catch { copy = (await API.duplicateSetup(toCopy.id)).setup; }
        madeSetup = copy;
        d.adSetupId = copy.id;
      }
      FORM.data.copyAtCreate = false;
      FORM.data.copyName = '';
      let res;
      try {
        res = await API.createKey(d);
      } catch (e) {
        if (madeSetup) { try { await API.deleteSetup(madeSetup.id); } catch { /* already gone */ } }
        throw e;
      }
      toast('Created, not on air');
      location.hash = `#keys/${res.key.id}`;
      return;
    }
  } catch (e) {
    applyServerErrors(e);
  }
}

async function duplicateKeyClicked() {
  const ok = await ask({ title: `Duplicate “${KEY_ORIGINAL.name}”?`, body: 'The copy gets its own copy of the ad setup, and starts off air — it cannot serve until someone publishes it.', okLabel: 'Duplicate' });
  if (!ok) return;
  try {
    const { key } = await API.duplicateKey(KEY_ORIGINAL.id);
    // The copy's own page is where this lands, name in its head — the pill says the act.
    toast('Duplicated');
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
  const rows = keys.filter(k => inScope(k.property)).sort((a, b) => (b.updatedAt || '').localeCompare(a.updatedAt || ''));
  const card = k => {
    const onN = meta.slotTypes.filter(t => k.slotsOn?.[t]).length;
    const cfg = (k.playerConfigs || []).length;
    const facts = [
      k.setupName || 'no ad setup',
      `${onN || 'no'} break${onN === 1 ? '' : 's'} on`,
      ...(cfg ? [`${cfg} custom config${cfg === 1 ? '' : 's'}`] : []),
    ].join(' · ');
    return `
      <div class="dlg-card" data-q="${esc(`${k.name} ${k.property} ${label('platform', k.platform)}`)}" onclick="chooseCopy('${k.id}')">
        <div class="dc-top"><span class="dc-title">${esc(k.name)}</span><span class="dc-reach">${esc(label('platform', k.platform))}</span></div>
        <div class="dc-sum">${propBadge(k.property)} <span>${esc(facts)}</span></div>
      </div>`;
  };
  dialogRoot().innerHTML = `
    <div class="dlg-veil"><div class="dlg wide autoh">
      <h3>New integration<span class="dlg-kicker">blank, or from a copy — it takes shape on its page</span></h3>
      <div class="dlg-body">
        ${dlgSearchHtml(rows.length, 'Search integrations…')}
        <div class="dlg-cards">
          <div class="dlg-card create" onclick="chooseBlank()">
            <div class="dc-plus">+</div>
            <div class="dc-title">Start blank</div>
            <div class="dc-sum">Identity, player and ad behaviour — one page</div>
          </div>
          ${rows.map(card).join('')}
        </div>
      </div>
      <div class="dlg-foot"><button class="btn ghost" onclick="chooserClose()">Cancel</button></div>
    </div></div>`;
  wireVeilDismiss(dialogRoot(), chooserClose);
}

// Cancel walks the address back too — ← and refresh keep meaning what they say.
function chooserClose() {
  closeDialog();
  history.replaceState(null, '', '#keys');
}

async function chooseBlank() {
  KEY_CREATE_SEED = null;
  closeDialog();
  await viewKeyForm(null);
}

async function chooseCopy(id) {
  try {
    const { key } = await API.getKey(id);
    KEY_CREATE_SEED = key;
    closeDialog();
    await viewKeyForm(null);
  } catch (e) {
    toast(e.message, 'bad');
  }
}
