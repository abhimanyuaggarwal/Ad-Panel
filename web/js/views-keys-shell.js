// views-keys-shell.js — part 4 of 4 — THE SHELL: the page frame (header, Save/Publish, ⋯ menu),
// what a save writes (payload, diff, change list), save/create/duplicate/delete, and the
// new-integration CHOOSER. Loads last of the views-keys quartet.
// Split 3 Sep as a pure partition of views-keys-form.js — order preserved, nothing edited.

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
    // A row nobody keyed is a row nobody made: it never reaches the server, so an
    // abandoned add costs a refusal to no one.
    playerConfigs: JSON.parse(JSON.stringify((d.playerConfigs || []).filter(c => (c.name || '').trim()))),
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
    for (const f of ['playback', 'expandInMini', 'autoplay']) {
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
  born('Player', 'autoplay', label('autoplay', p.autoplay ?? 'auto'));
  born('Player', 'passiveVolume', `${p.passiveVolume ?? 100}%`);
  for (const c of d.playerConfigs || []) {
    rows.push({ where: 'Player configs', field: c.name, label: c.name, fromText: '—', toText: 'added' });
  }
  const setup = sectionSetup(0);
  rows.push({ where: 'Ad behaviour', field: 'adSetupId', fromText: '—',
    toText: setup ? `${setup.name}${setup.usedBy || d.copyAtCreate ? ' — as its own copy' : ''}` : 'none — every break stays off' });
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
      // A setup someone else already fills is photocopied here, and so is one the person
      // asked to duplicate & use — both wait for this moment so a cancelled create leaves
      // nothing behind.
      // copyAtCreate is a page fact, not a payload field — keyPayload never carries it,
      // so the intent is read from the form itself.
      let madeSetup = null;
      const toCopy = SETUPS_CACHE.find(x => x.id === d.adSetupId && (x.usedBy || FORM.data.copyAtCreate));
      if (toCopy) {
        let copy;
        try { copy = (await API.duplicateSetup(toCopy.id, `${(d.name || 'New integration').trim()} demand`)).setup; }
        catch { copy = (await API.duplicateSetup(toCopy.id)).setup; }
        madeSetup = copy;
        d.adSetupId = copy.id;
      }
      FORM.data.copyAtCreate = false;
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
            <div class="dc-sum">Identity, player and ad behaviour — one page</div>
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
