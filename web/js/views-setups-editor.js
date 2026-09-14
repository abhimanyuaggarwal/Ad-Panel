// views-setups-editor.js — the ad setup EDITOR (the ops room): page load, the editor's state,
// slot addressing (which placement / pod / direct tier a control is talking to), the
// delivery-settings writers, the slot row, the page render, the payload and save.
//
// Its two helper files load just before it and share its globals:
//   views-setups-rungs.js       one ladder row, the unit's facts line and settings panel
//   views-setups-placements.js  placement tabs, pods, Clear, the closed row's glimpse
// The list and the new-setup chooser are in views-setups-list.js; the waterfall
// in views-setups-waterfall.js. Everything is a global by design (see ARCHITECTURE.md).
//
// An ad setup is one surface's demand: PLACEMENTS, each with, per slot, a ladder (or an
// out-stream rotation) of ad tags AND how that slot's ads behave. One setup fills one
// integration. Behaviour lives here, not on the integration, so one edit reaches the
// surface; the integration keeps only its switches and quick decisions.

let SETUP_ORIGINAL = null;
// The payload as of the last save — the dirty check Publish fails closed on (6 Sep).
let SU_SAVED_SIG = null;
// The ⋯ menu, open or not — page state, closed by any rerender-worthy act.
let SU_MORE_OPEN = false;
function suMoreToggle(e) {
  if (e) e.stopPropagation();
  SU_MORE_OPEN = !SU_MORE_OPEN;
  FORM.rerender();
}
let SU_TAGS = [];
let SU_TPLS = []; // ad unit templates, refreshed with the tags
let SU_SEC = 0; // which placement the editor is on

// THE HEAD SECTIONS FOLD (6 Sep, user call — open, they pushed PLACEMENTS below the
// fold). Shared plumbing is read far less often than placements are worked in, so each
// section rests as ONE line wearing its counted facts and opens in place — the break
// rows' own disclosure grammar, one page up. Closed on every load; an error in a
// folded section forces it open (fail visible, never fail hidden).
let SU_HEAD_OPEN = new Set();
function suHeadToggle(k) {
  if (SU_HEAD_OPEN.has(k)) SU_HEAD_OPEN.delete(k); else SU_HEAD_OPEN.add(k);
  FORM.rerender();
}
function suHeadRowHtml(k, title, glimpse, open) {
  return `
    <div class="shead" onclick="suHeadToggle('${k}')">
      <span class="pl-head">${esc(title)}</span>
      <span class="shead-glimpse">${glimpse}</span>
      <span class="slot-chev ${open ? 'open' : ''}">›</span>
    </div>`;
}

// GLOBAL SETTINGS (11 Sep, user call — *"can we make one section which is global settings
// and move header bidding and global waterfall there only?"*). ONE folded head for the two
// setup-wide answers, each a zone row down the left rail — `Header bidding`, then
// `Waterfall` (the one-line answer first, the ladder under it; user call, same day) — which
// is the anatomy every break row already has, one page up: a head line, then zones beside
// what they name. Two sibling sections for two one-row facts were two heads, two hairlines
// and two chevrons saying "shared plumbing" twice. The glimpse is the two facts as marks in
// the zones' own order: the header bidding answer, then the waterfall's walk. A refused save
// in either forces the head open — fail visible, never fail hidden.
function suGlobalsHtml(meta) {
  const open = SU_HEAD_OPEN.has('globals') || !!FORM.errors.waterfall || !!FORM.errors.headerBidding;
  const wf = suWfGlimpseHtml();
  const hb = suHbGlimpseHtml();
  const glimpse = `${hb}${wf && hb ? '<span class="gs-sep"></span>' : ''}${wf}`;
  const head = suHeadRowHtml('globals', 'Global settings', glimpse, open);
  if (!open) return `<div class="gs-sec closed">${head}</div>`;
  return `
    <div class="gs-sec">
      ${head}
      ${suHeaderBiddingZoneHtml()}
      ${suWaterfallZoneHtml(meta)}
    </div>`;
}

// ---------- editor ----------

// ---------- THE EDITOR'S OWN COPY OF A SAVED SETUP ----------
// Deep-copied, so typing never mutates the answer a screen is still counting against, and
// reshaped into what the form holds rather than what the wire sends.

// `_orig` ties a form section back to its saved self for the counted chips (divergence,
// muted-on, live counts) — renames keep it, new placements lack it.
function suFormSections(setup, slotTypes) {
  return setup.sections.map((sec, i) => ({
    name: sec.name, isDefault: sec.isDefault, _orig: i,
    slots: Object.fromEntries(slotTypes.map(t => [t, suFormSlot(sec.slots[t], t)])),
  }));
}

// One break as the form holds it. A mid-roll is PODS (31 Aug; renamed 3 Sep) — pod 1
// doubles as the slot itself, and each pod carries its own direct deal.
function suFormSlot(slot, t) {
  // Each ladder slot carries its own DIRECT deal (1 Sep) — one, uncapped.
  const direct = slot.direct ? { rungs: deepCopy(slot.direct.rungs) } : null;
  if (t !== 'midroll') {
    return { ...suFormOwnUnits(slot), behaviour: deepCopy(slot.behaviour), direct };
  }
  const pods = slot.groups || [{ ...slot, direct: slot.direct }];
  return {
    direct,
    groups: pods.map(g => ({
      ...suFormOwnUnits(g),
      behaviour: deepCopy(g.behaviour),
      direct: { rungs: deepCopy(g.direct?.rungs || []) },
    })),
  };
}

// The editor holds a break's OWN units, whichever source serves: a linked break's serving
// rungs are the waterfall's, mirrored read-only where the ladder would draw.
function suFormOwnUnits(g) {
  return { rungs: deepCopy(g.ownRungs ?? g.rungs), waterfallSource: g.waterfallSource || 'own' };
}

async function viewSetupForm(id) {
  // A return ticket for a DIFFERENT destination is stale — navigating here any other
  // way must not leave a wrong “back to …” on the header.
  if (typeof KEY_RETURN !== 'undefined' && KEY_RETURN && KEY_RETURN.expect !== (id || 'new')) KEY_RETURN = null;
  const meta = await getMeta();
  KL_META = meta;
  const [{ tags }, { templates }] = await Promise.all([API.listTags(), API.listTemplates()]);
  SU_TAGS = tags;
  SU_TPLS = templates;
  for (const t of tags) window.NAME_LOOKUP[t.id] = t.name;

  let data;
  if (id) {
    const [{ setup }] = await Promise.all([API.getSetup(id), loadPublish('setup', id, '')]);
    SETUP_ORIGINAL = setup;
    PUB.name = setup.name;
    PUB.dirty = () => JSON.stringify(setupPayload(FORM.data)) !== SU_SAVED_SIG;
    PUB.saveNow = opts => saveSetupClicked(opts);
    // A restore rewrites the draft server-side, so the editor is re-read, never patched.
    PUB.onRestored = () => viewSetupForm(id);
    data = {
      name: setup.name, property: setup.property,
      // The waterfall (5 Sep): the setup-level ladder + its levers.
      waterfall: suWfClean(setup.waterfall),
      // HEADER BIDDING (10 Sep): the setup's one answer, borrowed by every slot on Auto.
      headerBidding: setup.headerBidding || 'off',
      sections: suFormSections(setup, meta.slotTypes),
    };
  } else {
    SETUP_ORIGINAL = null;
    pubClear();
    const seed = SETUP_CREATE_SEED;
    SETUP_CREATE_SEED = null;
    if (seed) {
      // From a copy: the whole setup — shape, ladders, deals, delivery answers,
      // and the waterfall with its links.
      data = {
        name: `${seed.name} copy`, property: seed.property, copiedFrom: seed.name,
        waterfall: suWfClean(seed.waterfall),
        headerBidding: seed.headerBidding || 'off',
        sections: setupSeedSections(seed, meta),
      };
    } else {
      // Blank starts from a PRESET — a photocopy of a shape that works, never a live
      // link — so nothing here is ever a blank form.
      const prefill = SETUP_CREATE_PREFILL;
      SETUP_CREATE_PREFILL = null;
      data = {
        // A setup is 1:1 with an integration, so it lives on ONE property: the field
        // starts empty and Save asks for it (7 Sep, UAT P2 — it used to default to
        // "All properties" and store that as the setup's property).
        name: prefill ? prefill.name : '', property: prefill ? prefill.property : '',
        presetName: meta.rulePresets[meta.rulePresets.length - 1].name,
        waterfall: suWfClean(null),
        // Nobody bids until someone says so: a blank setup starts Off, and every slot on
        // it starts on Auto, so one act at the head is all it takes to switch the surface on.
        headerBidding: 'off',
        sections: [suBlankSection('Default', meta, meta.rulePresets[meta.rulePresets.length - 1].values)],
      };
    }
  }
  SU_SEC = 0;
  for (const k of Object.keys(QF_TEXT)) delete QF_TEXT[k];
  SU_SLOT_OPEN = new Set();
  // The head sections rest closed; Placements — the work area — opens with the page.
  SU_HEAD_OPEN = new Set(['placements']);
  SU_ADD_HINT = null;
  startForm(data, () => renderSetupForm(meta));
  SU_SAVED_SIG = id ? JSON.stringify(setupPayload(data)) : null;
  FORM.saved = id ? deepCopy(data) : null;
  suTakePending(id, data, meta);
  renderSetupForm(meta);
  if (SU_ADD_HINT) {
    requestAnimationFrame(() => {
      // `.ad-unit.wants`, not `.rung-row.wants` — `ctx.rowClass` lands on the BLOCK, and
      // has since the block frame landed (7 Sep), so this pair had been quietly matching
      // nothing: a visitor sent here to fill a rung got no scroll and no caret.
      document.querySelector('.ad-unit.wants')?.scrollIntoView({ block: 'center' });
      document.querySelector('.ad-unit.wants input')?.focus();
    });
  }
}

// The rung a visitor was sent here to fill: which slot, which row, and the provider the
// other room found missing. Cleared the moment it is used, so a later reload is normal.
let SU_ADD_HINT = null;

function suTakePending(id, data, meta) {
  const p = window.SU_PENDING;
  window.SU_PENDING = null;
  if (!p || p.setupId !== id) return;
  const j = data.sections.findIndex(x => x.name === p.secName);
  if (j < 0) { toast(`“${p.secName}” is gone`, 'warn'); return; }
  SU_SEC = j;
  SU_SLOT_OPEN.add(p.slot);
  const slot = p.slot === 'midroll' ? data.sections[j].slots.midroll.groups[0] : data.sections[j].slots[p.slot];
  const cap = isRotation(p.slot) ? (meta.rotationMax || 5) : meta.maxRungs;
  if (slot.rungs.length >= cap) {
    toast('Break is full', 'warn');
    return;
  }
  slot.rungs.push({ type: 'tag', tagId: '' });
  SU_ADD_HINT = { slot: p.slot, index: slot.rungs.length - 1, provider: p.provider };
  toast(`Pick a ${label('tagProvider', p.provider)} tag`);
}

let SU_SLOT_OPEN = new Set();
// Which rung's unit settings are open — one at a time, closed by any scope change.
// Which of the mid-roll's break groups the editor is on. One group draws no chrome.
let SU_MID_G = 0;

function suSection() { return FORM.data.sections[SU_SEC] || FORM.data.sections[0]; }
function suMidGroups() { return suSection().slots.midroll.groups; }

// A POD OWNS ITS DEAL (3 Sep, user call). The direct tier used to belong to the whole
// mid-roll and be shared by every break group; a pod is a break with its own cadence
// and its own ladder, so the deal sold against it is its own too. Every other break is
// one pod, so this reads the slot.
function suDirectOf(t) {
  if (t !== 'midroll') return suSection().slots[t].direct;
  const g = suMidGroups()[SU_MID_G] || suMidGroups()[0];
  if (!g.direct) g.direct = { rungs: [] };
  return g.direct;
}
// A break's DIRECT tier is addressed as '<slot>@direct' — every rung helper then works
// on it unchanged (same family, same ladder grammar).
function baseSlot(t) { return t.endsWith('@direct') ? t.slice(0, -7) : t; }
function isDirectSlot(t) { return t.endsWith('@direct'); }
function suSlot(t) {
  // THE WATERFALL is addressed as the pseudo-slot 'shared' (5 Sep) — every rung
  // helper (add, toggle, remove, search, facts, panel, drag) then works on it unchanged.
  if (t === 'shared') return suWf();
  if (isDirectSlot(t)) return suDirectOf(baseSlot(t));
  if (t === 'midroll') {
    const gs = suMidGroups();
    if (SU_MID_G >= gs.length) SU_MID_G = 0;
    return gs[SU_MID_G];
  }
  return suSection().slots[t];
}
function suBhv(t) { return suSlot(t).behaviour || {}; }

// The saved twin of suSlot (7 Sep): the same address in the last-saved form, for the
// session's quiet tint. Placements and pods compare by index — a shifted row tints,
// which is the truth: it moved.
function suSavedSlot(t) {
  if (!FORM.saved) return null;
  if (t === 'shared') return FORM.saved.waterfall || null;
  const sec = (FORM.saved.sections || [])[SU_SEC];
  if (!sec) return null;
  const base = baseSlot(t);
  let slot = sec.slots?.[base] || null;
  if (slot && base === 'midroll') slot = (slot.groups || [])[SU_MID_G] || null;
  if (!slot) return null;
  return isDirectSlot(t) ? (slot.direct || null) : slot;
}

// One rung against its saved self — tag, switch, and every unit fact.
function suRungDirty(t, i) {
  if (!FORM.saved) return false;
  const a = suSlot(t).rungs?.[i];
  const b = suSavedSlot(t)?.rungs?.[i];
  return JSON.stringify(a && a.tagId ? rungPayload(a) : null)
    !== JSON.stringify(b && b.tagId ? rungPayload(b) : null);
}

function suBhvDirty(t, f) {
  if (!FORM.saved) return false;
  return JSON.stringify(suBhv(t)[f] ?? null) !== JSON.stringify(suSavedSlot(t)?.behaviour?.[f] ?? null);
}

// Typing in a behaviour box repaints nothing (the caret rule) — the row's tint is
// toggled by hand, the way the toolbars toggle their counts.
function suMarkBhvRow(el, t, f) {
  el.closest('.lr')?.classList.toggle('chg', suBhvDirty(t, f));
}

// A placement, stamped from a behaviour preset: ladders empty, behaviour already sane.
function suBlankSection(name, meta, preset) {
  return {
    name, isDefault: name === 'Default', _orig: -1,
    slots: Object.fromEntries(meta.slotTypes.map(t => {
      const bhv = () => deepCopy(preset.slots[t] || {});
      const direct = slotKind(t) === 'ladder' ? { rungs: [] } : null;
      return [t, t === 'midroll'
        ? { direct, groups: [{ rungs: [], behaviour: bhv(), direct: { rungs: [] } }] }
        : { rungs: [], behaviour: bhv(), direct }];
    })),
  };
}

function suToggleSlot(t) {
  SU_RUNG_OPEN = null;
  if (SU_SLOT_OPEN.has(t)) SU_SLOT_OPEN.delete(t); else SU_SLOT_OPEN.add(t);
  FORM.rerender();
}

// ---------- behaviour writers (this placement, this slot) ----------

function suBQ(t, f, val) {
  suSlot(t).behaviour[f] = val;
  clearErr('sections');
  FORM.rerender();
}

function suQFKey(t, f) {
  // The waterfall is setup-level: its typed text must survive a placement switch.
  if (t === 'shared') return `su:shared:${f}`;
  return `su${SU_SEC}:${t}${t === 'midroll' ? `:g${SU_MID_G}` : ''}:${f}`;
}

function suBNum(el, t, f) {
  suSlot(t).behaviour[f] = Number(el.value);
  QF_TEXT[suQFKey(t, f)] = el.value;
  suMarkBhvRow(el, t, f);
}

// A count with an open end: empty is `Full`, stored as null — never a magic zero.
function suBNumNull(el, t, f) {
  suSlot(t).behaviour[f] = el.value.trim() === '' ? null : Number(el.value);
  QF_TEXT[suQFKey(t, f)] = el.value;
  suMarkBhvRow(el, t, f);
}

// Typed in SECONDS, stored in the JSON's milliseconds (3 Sep). Decimals are allowed —
// a 1.5 second timeout is a real answer — and the box keeps its own text while typing.
function suBNumSec(el, t, f) {
  const n = Number(el.value);
  suSlot(t).behaviour[f] = el.value.trim() === '' || Number.isNaN(n) ? undefined : Math.round(n * 1000);
  QF_TEXT[suQFKey(t, f)] = el.value;
  suMarkBhvRow(el, t, f);
}

function suBText(el, t, f) {
  suSlot(t).behaviour[f] = parseCuepointsText(el.value);
  QF_TEXT[suQFKey(t, f)] = el.value;
  suMarkBhvRow(el, t, f);
}

function suBhvAdapter(t) {
  const key = f => `su${SU_SEC}:${t}${t === 'midroll' ? `:g${SU_MID_G}` : ''}:${f}`;
  return {
    v: f => suBhv(t)[f],
    tv: f => {
      if (key(f) in QF_TEXT) return QF_TEXT[key(f)];
      const v = suBhv(t)[f];
      return Array.isArray(v) ? v.map(fmtCue).join(', ') : (v ?? '');
    },
    tvSec: f => {
      if (key(f) in QF_TEXT) return QF_TEXT[key(f)];
      const v = suBhv(t)[f];
      return typeof v === 'number' ? String(v / 1000) : (v ?? '');
    },
    set: (f, val) => `suBQ('${t}', '${f}', ${typeof val === 'string' ? `'${val}'` : val})`,
    num: f => `suBNum(this, '${t}', '${f}')`,
    numSec: f => `suBNumSec(this, '${t}', '${f}')`,
    numNull: f => `suBNumNull(this, '${t}', '${f}')`,
    text: f => `suBText(this, '${t}', '${f}')`,
    dirty: f => suBhvDirty(t, f),
    // HEADER BIDDING (10 Sep), handed to the shared row renderer: what the slot actually
    // RUNS — its `Auto` resolved through the setup's answer — the one fact the row states
    // beside the seg, and the partner `Custom` starts from.
    hbServed: () => suHbServed(t),
    rungCount: () => (suSlot(t).rungs || []).filter(r => r.tagId && r.on !== false).length,
    differs: f => suFieldDiffers(t, f),
    differsWord: 'Set differently on another placement',
  };
}

// Do the placements disagree on this field today? The marker is the answer to "I won't
// know the other placements" — you see it before you decide, on the row itself.
// The slot of ANOTHER placement that matches the one being edited — for a mid-roll,
// the SAME group index; a placement without that group has nothing to compare or push.
function suPeerSlot(sec, t) {
  if (t === 'midroll') return sec.slots.midroll.groups[SU_MID_G] || null;
  return sec.slots[t];
}

function suFieldDiffers(t, f) {
  const secs = FORM.data.sections;
  if (secs.length < 2) return false;
  const v = x => {
    const slot = suPeerSlot(x, t);
    return JSON.stringify(slot ? (slot.behaviour?.[f] ?? null) : '(no group)');
  };
  return secs.some(x => v(x) !== v(secs[SU_SEC]));
}


// ONE ACT FOR THE WHOLE BREAK (2 Sep, user call — the per-row "all placements" CTA
// on every line was noise): a single door at the panel's foot copies THIS placement's
// delivery settings for this break onto every other placement, read back field by
// field on the change review before anything lands. Counted consequences (the paced
// worst case) live on the rows themselves once applied.
async function suSlotToAll(t) {
  const secs = FORM.data.sections;
  const here = secs[SU_SEC];
  const hereBhv = suPeerSlot(here, t).behaviour;
  const fields = KL_META.slotBehaviourFields[baseSlot(t)] || [];
  const changes = [];
  for (const s2 of secs) {
    if (s2 === here) continue;
    const peer = suPeerSlot(s2, t);
    if (!peer) {
      changes.push({ where: s2.name, field: 'group', label: 'Break group', fromText: 'not there', toText: 'left alone' });
      continue;
    }
    for (const f of fields) {
      if (JSON.stringify(peer.behaviour[f] ?? null) !== JSON.stringify(hereBhv[f] ?? null)) {
        changes.push({
          where: s2.name, field: f,
          fromText: bhvValueText(f, peer.behaviour[f]), toText: bhvValueText(f, hereBhv[f]),
        });
      }
    }
  }
  const ok = await reviewChanges({
    title: `Apply “${here.name}”’s ${label('slotType', baseSlot(t)).toLowerCase()} settings to every placement?`,
    kicker: 'this setup only — ladders untouched',
    changes,
    okLabel: 'Apply', cancelLabel: 'Back',
    emptyText: 'Every placement already runs these settings.',
  });
  if (!ok) return;
  for (const s2 of secs) {
    if (s2 === here) continue;
    const peer = suPeerSlot(s2, t);
    if (!peer) continue;
    for (const f of fields) peer.behaviour[f] = hereBhv[f];
  }
  clearErr('sections');
  FORM.rerender();
  toast(`Applied to ${secs.length - 1} placement${secs.length > 2 ? 's' : ''}`);
}

// The saved counterpart of the current placement — counted facts only exist for it.
function suOrigSection() {
  const sec = suSection();
  return SETUP_ORIGINAL && sec._orig >= 0 ? SETUP_ORIGINAL.sections[sec._orig] : null;
}

// One slot of the current placement: its ladder AND its behaviour, in one row that opens
// — the same anatomy the integration uses, so there is one thing to learn, not two.
function suSlotRowHtml(t, meta) {
  const slot = suSlot(t);
  const rot = isRotation(t);
  const open = SU_SLOT_OPEN.has(t);
  const atMax = chainCount(slot.rungs) >= (rot ? (meta.rotationMax || 5) : meta.maxRungs);
  const orig = suOrigSection();

  const ctx = {
    rungs: slot.rungs,
    // The editor names the two kinds of row differently on purpose (27 Aug): there is
    // ONE primary — the ask that happens first, every time — and under it a numbered
    // fall. Ten rows all reading "Waterfall N" were ten rows reading the same.
    // The primary's word lives on the rule above its block now (7 Sep) — the row keeps
    // the position column empty so every unit in the ladder starts on the same x.
    // The fall's numbers are WALK numbers (8 Sep, user call): they count only the units
    // that would be asked, from rung 1 (the primary is named by its own rule).
    rungLabelFor: n => {
      if (rot) { const p = posLabel(slot.rungs, n); return p ? `Banner ${p}` : ''; }
      return n === 0 ? '' : posLabel(slot.rungs, n, 1);
    },
    onToggle: n => `suToggleRung('${t}', ${n})`,
    control: n => suRungSearchHtml(t, n),
    rowClass: n => `${SU_ADD_HINT && SU_ADD_HINT.slot === t && SU_ADD_HINT.index === n ? 'wants' : ''}${!rot && n === 0 ? ' lead' : ''}`,
    onRemove: n => `suRemoveRung('${t}', ${n})`,
    dragKey: `su-${SU_SEC}-${t}`,
    dirty: n => suRungDirty(t, n),
    // A hand-typed unit GAM has not caught up on (27 Aug). Derived per read, so the
    // next sync that pulls it in takes the mark away — nothing to clear by hand.
    after: (n, r) => suRungAfterHtml(t, n, r),
    // A rotation has no first ask — its banners take turns — so no row wears the
    // primary's colour there.
    flat: rot,
  };
  registerDrag(`su-${SU_SEC}-${t}`, (from, to) => {
    const arr = suSlot(t).rungs;
    arr.splice(to, 0, arr.splice(from, 1)[0]);
    clearErr('sections');
    FORM.rerender();
  });

  // The attached surface's quick decision, named (26 Aug, DRIVING-SCOPE) — nobody
  // debugs a ghost ("why does it only try three?"). This ladder is the arrangement;
  // the decision made over it belongs to Ad delivery.
  const drv = orig?.slots?.[t]?.drive;
  const drvBits = [];
  if (drv) {
    if (drv.ask?.length) drvBits.push(`asks ${drv.ask.map(p => label('tagProvider', p) || p).join(' › ')}`);
    if (drv.tries) drvBits.push(`${drv.tries} ${drv.tries === 1 ? 'try' : 'tries'}`);
    if (drv.start) drvBits.push(drv.start === 'deferred' ? `delayed ${drv.deferSec ?? '?'}s` : 'immediate');
    if (drv.podAds) drvBits.push(`${drv.podAds} impressions`);
  }
  const divNote = drvBits.length
    ? `<span class="sg-off">${esc(`${drv.keyName}: ${drvBits.join(' · ')}`)}</span>` : '';

  // THE GUTTER IS THE MAP (31 Aug, user call): the zone names moved off the content
  // and into the empty left column under the break's own name — a fixed rail the eye
  // scans (Special · Pods · Ad sources · Delivery settings), one zone per row beside what it
  // names. The header line keeps the closed row's exact anatomy.
  const head = `
      <div class="slot-head">
        <span class="slot-label">${esc(label('slotType', t))}</span>
        <div class="slot-line" onclick="suToggleSlot('${t}')">
          <span class="slot-glimpse">${suSlotGlimpse(t)}</span>
          ${divNote}
          <span class="slot-chev ${open ? 'open' : ''}">›</span>
        </div>
        <span class="slot-menu-ph">${suSlotClearHtml(t)}</span>
      </div>`;
  if (!open) return `<div class="slot-row">${head}</div>`;

  const zone = (lbl, inner) => `
      <div class="zone-row">
        <span class="zone-l">${esc(lbl)}</span>
        <div class="zone-c">${inner}</div>
        <span class="slot-menu-ph"></span>
      </div>`;
  // THE BREAK'S OWN DIRECT DEAL (1 Sep, user call — per break, not global): its zone
  // sits ABOVE Ad sources, exactly where it sits in the walk. The rung addresses itself
  // as '<slot>@direct', so every rung helper works unchanged.
  const dt = `${t}@direct`;
  const dSlot = SLOT_KIND[baseSlot(t)] === 'rotation' ? null : suDirectOf(t);
  const dCtx = dSlot ? {
    rungs: dSlot.rungs,
    rungLabelFor: n => posLabel(dSlot.rungs, n),
    flat: true,
    onToggle: n => `suToggleRung('${dt}', ${n})`,
    control: n => suRungSearchHtml(dt, n),
    rowClass: () => '',
    onRemove: n => `suRemoveRung('${dt}', ${n})`,
    dragKey: `su-${SU_SEC}-${dt}`,
    dirty: n => suRungDirty(dt, n),
    after: (n, r) => suRungAfterHtml(dt, n, r),
  } : null;
  if (dSlot) {
    registerDrag(`su-${SU_SEC}-${dt}`, (from, to) => {
      const arr = suSection().slots[t].direct.rungs;
      arr.splice(to, 0, arr.splice(from, 1)[0]);
      clearErr('sections');
      FORM.rerender();
    });
  }
  // ONE deal, uncapped (1 Sep trim): the tier IS the deal, so a filled tier shows the
  // deal and nothing else — no add link, no cap. The add link exists only while empty.
  const directZone = !dSlot ? '' : zone(label('slotType', 'direct'),
    `${dSlot.rungs.length
      ? `<div class="rung-list">${dSlot.rungs.map((r, n) => suUnitHtml(dt, n, r, dCtx)).join('')}</div>`
      : `<div class="slot-multi-foot">
          <button class="slot-add" onclick="suAddRung('${dt}')">+ Add the special deal</button>
        </div>`}`);

  // THE PODS STRIP (3 Sep, user call): everything on a mid-roll belongs to a pod, so
  // the pod is the container the rest sits inside — not a "Groups" row whose only job
  // was to hold an add link. The strip stands even at one pod, which is what makes
  // "everything is in pod 1" visible, and adding another is an act on the strip.
  const groupsZone = t !== 'midroll' ? '' : suMidTabsHtml();
  // AD SOURCES, EVERYWHERE (7 Sep, user call — "rename Indirect to something relevant
  // since it will have both direct and indirect; something a layman understands that
  // works in ads too"). `Indirect` named the demand's KIND, and the zone stopped being one
  // kind the moment a direct deal could sit in the ladder. What it always is, is where the
  // ads come from — which is the word a ROTATION's ladder has worn all along, so the rename
  // unifies the two rather than adding a fourth zone word to the rail: Special · Ad
  // sources · Delivery settings, on every break and every rotation.
  //
  // A BREAK IS TWO SECTIONS, ALWAYS BOTH (11 Sep, user call — *"primary should always show
  // it is on top of waterfall; currently it only shows if the waterfall switch is
  // enabled"*, *"there is no clear demarcation of primary and the waterfall section"*).
  // `suBreakLadderHtml` draws PRIMARY and WATERFALL with their own rules and the source
  // controls seated on the waterfall's rule, so the anatomy reads on an empty break exactly
  // as it reads on a full one. A ROTATION is not a break — its banners take turns, so it has
  // one flat list and one add button, and no sections to name.
  const rotLadder = !rot ? '' : `${suLadderHtml(t, ctx)}
     <div class="slot-multi-foot">
       ${!atMax
         ? `<button class="slot-add" ${canAddRung(slot.rungs) ? '' : 'disabled title="Fill the one above first"'} onclick="suAddRung('${t}')">+ Add banner tag</button>`
         : `<span class="slot-order-note">${meta.rotationMax} of ${meta.rotationMax}</span>`}
     </div>`;
  const sourcesZone = zone('Ad sources', rot ? rotLadder : suBreakLadderHtml(t, ctx, meta));
  const deliveryZone = zone('Delivery settings',
    `<div class="bhv-grid">${behaviourRowsHtml(t, suBhvAdapter(t))}</div>
     ${FORM.data.sections.length > 1 ? `<div class="zrow bhv-foot">
       <button type="button" class="zlink" onclick="suSlotToAll('${t}')">Apply to all placements</button>
     </div>` : ''}`);

  return `
    <div class="slot-row open">
      ${head}
      ${groupsZone}
      ${directZone}
      ${sourcesZone}
      ${deliveryZone}
    </div>`;
}

function renderSetupForm(meta) {
  const d = FORM.data;
  const editing = !!SETUP_ORIGINAL;
  const used = editing ? SETUP_ORIGINAL.usedBy : 0;
  const usedLive = editing ? SETUP_ORIGINAL.usedByLive : 0;
  const main = document.getElementById('main');

  const n = editing ? (PUB?.unpublished || []).length : 0;
  const live = editing ? PUB?.liveVersion != null : false;
  const anyUnits = suAnyUnits();
  main.innerHTML = `
    <div class="ehead ${editing ? 'with-rail' : ''}">
      ${KEY_RETURN
        ? '<button type="button" class="eh-back" onclick="returnToKey()">←</button>'
        : '<a class="eh-back" href="#setups">←</a>'}
      ${propBadge(d.property)}
      <h1>${editing ? esc(SETUP_ORIGINAL.name) : 'New ad setup'}</h1>
      ${KEY_RETURN && !editing ? `<span class="podl">for “${esc(KEY_RETURN.name)}” — mapped there on Create</span>` : ''}
      ${editing ? pubStateChipHtml() : d.copiedFrom ? `<span class="podl">copied from “${esc(d.copiedFrom)}” — its own from here</span>` : ''}
      <span class="eh-gap"></span>
      ${editing ? `
        <button class="btn ghost" onclick="saveSetupClicked()">Save</button>
        <button class="btn ${n ? '' : 'ghost'}"
          onclick="publishClicked()">${live ? 'Publish' : 'Publish — go on air'}</button>`
      : `<button class="btn" onclick="saveSetupClicked()">Create ad setup</button>`}
      <div class="eh-more ${SU_MORE_OPEN ? 'open' : ''}">
        <button type="button" class="btn ghost eh-more-btn" onclick="suMoreToggle(event)">⋯</button>
        <div class="eh-menu">
          ${suClearable() ? `<div class="eh-item ${anyUnits ? '' : 'dim'}" ${anyUnits
            ? 'onclick="suMoreToggle(); suClearAllSlots()"'
            : ''}>Clear all ad units</div>` : ''}
          ${editing && live ? `<div class="eh-item danger" onclick="suMoreToggle(); takeOffAirClicked('setup', '${SETUP_ORIGINAL.id}', '${esc(SETUP_ORIGINAL.name)}')">Deactivate ad setup</div>` : ''}
          ${editing ? `<div class="eh-item danger ${used > 0 ? 'dim' : ''}" ${used > 0
            ? `title="“${esc(SETUP_ORIGINAL.usedByNames.join(', '))}” fills from it — detach it first"`
            : 'onclick="suMoreToggle(); deleteSetupClicked()"'}>Delete</div>` : ''}
        </div>
      </div>
    </div>
    <div class="detail">
    <div class="form">
      ${used > 0 ? `<div class="fills-line">Assigned to
        <a class="banner-link" onclick="viewKeysUsing('setup', '${SETUP_ORIGINAL.id}')">${esc(SETUP_ORIGINAL.usedByNames.join(', '))}</a>
        · ${usedLive ? 'on air' : 'off air'}</div>` : ''}
      <div class="fieldset">
        <div class="frow" style="margin-bottom: 18px">
          ${textFieldHtml('Name', 'name', { placeholder: 'e.g. TOI VideoShow demand', grow: true })}
          <div class="field ${FORM.errors.property ? 'err' : ''}" style="min-width: 190px" data-field="property"><label>Property</label>
            ${selectHtml(d.property || '', meta.properties.map(v => ({ v, label: v })), v => { FORM.data.property = v; clearErr('property'); FORM.rerender(); })}
            ${FORM.errors.property ? `<span class="field-err">${esc(FORM.errors.property)}</span>` : ''}
          </div>
          ${!editing && d.presetName ? `
          <div class="field" style="min-width: 170px"><label>Delivery preset</label>
            ${selectHtml(d.presetName, meta.rulePresets.map(p => ({ v: p.name, label: p.name })), v => suStampPreset(v))}
          </div>` : ''}
        </div>
        ${editing ? suTemplatesRowHtml() : ''}
        ${suGlobalsHtml(meta)}
        ${suPlacementsSecHtml(meta)}
      </div>

    </div>
    ${editing ? pubRailHtml() : ''}
    </div>`;
  paintChg();
}

// A rung's savable facts: the payload is built field by field so it never ships
// view-only keys — which means every real field has to be listed (the 19 Aug lesson).
function rungPayload(r) {
  const out = { type: 'tag', on: r.on !== false, tagId: r.tagId };
  for (const f of ['displaySlot', 'pause', 'showAfterSec', 'closeAfterSec', 'hideAfterSec']) {
    if (r[f] !== undefined) out[f] = r[f];
  }
  return out;
}

function setupPayload(d) {
  const rungsOf = g => (g.rungs || []).filter(r => r.tagId).map(rungPayload);
  // A break that is NOT serving its own units — following the waterfall, or switched
  // off — sends its KEPT own units under `ownRungs` and the answer itself; the server
  // materializes what serves (the waterfall's units, or none), so the form never ships
  // a frozen copy as if the break owned it, and never loses the way back.
  const indirect = g => {
    const src = g.waterfallSource || 'own';
    return src === 'own'
      ? { waterfallSource: 'own', rungs: rungsOf(g) }
      : { waterfallSource: src, ownRungs: rungsOf(g) };
  };
  return {
    name: d.name, property: d.property,
    waterfall: {
      rungs: (d.waterfall?.rungs || []).filter(r => r.tagId).map(rungPayload),
      depth: d.waterfall?.depth ?? null,
      pauseAll: d.waterfall?.pauseAll ?? null,
    },
    headerBidding: d.headerBidding || 'off',
    sections: d.sections.map(sec => ({
      name: sec.name,
      slots: Object.fromEntries(Object.entries(sec.slots).map(([t, slot]) => {
        const direct = slot.direct
          ? { rungs: (slot.direct.rungs || []).filter(r => r.tagId).map(rungPayload) }
          : undefined;
        return [t, t === 'midroll'
          ? { direct, groups: slot.groups.map(g => ({
              ...indirect(g),
              behaviour: g.behaviour,
              direct: { rungs: (g.direct?.rungs || []).filter(r => r.tagId).map(rungPayload) },
            })) }
          : {
            ...indirect(slot),
            behaviour: slot.behaviour,
            direct,
          }];
      })),
    })),
  };
}

async function saveSetupClicked(opts = {}) {
  // quiet (7 Sep, user call): Publish folds the save into its own act — no 'Saved'
  // toast; the publish review reads the whole session and carries the receipt.
  const quiet = !!opts.quiet;
  const d = setupPayload(FORM.data);
  // WHAT THE PAGE ALREADY KNOWS IS REFUSED ON THE PAGE (7 Sep, UAT P1) — before any
  // review or request: a missing name, two placements sharing a name, a pod a live
  // mid-roll would go dark on. The refusal lands where the thing is.
  if (!(d.name || '').trim()) { applyServerErrors({ errors: [{ field: 'name', message: 'Name is required' }] }); return; }
  if (!(KL_META.properties || []).includes(d.property)) {
    applyServerErrors({ errors: [{ field: 'property', message: 'Pick the property this setup belongs to' }] });
    return;
  }
  const dupAt = suDuplicateSection();
  if (dupAt >= 0) {
    SU_SEC = dupAt; SU_HEAD_OPEN.add('placements');
    FORM.errors.sections = `Two placements can't share the name “${FORM.data.sections[dupAt].name}” — integrations map by it`;
    FORM.rerender();
    return;
  }
  const dark = suDarkPods();
  if (dark.length) {
    SU_SEC = dark[0].si; SU_MID_G = dark[0].gi;
    SU_HEAD_OPEN.add('placements'); SU_SLOT_OPEN.add('midroll');
    FORM.errors.sections = dark[0].why;
    FORM.rerender();
    return;
  }
  try {
    let warnings = [];
    if (SETUP_ORIGINAL) {
      // Save is no longer the moment traffic changes (27 Aug) — it writes the draft and
      // says so, and the rail counts what is now waiting. Publish is the release.
      const res = await API.updateSetup(SETUP_ORIGINAL.id, d);
      warnings = res.warnings || [];
      SETUP_ORIGINAL = res.setup;
      SU_SAVED_SIG = JSON.stringify(d);
      FORM.saved = deepCopy(FORM.data);
      await pubReload();
      PUB.name = SETUP_ORIGINAL.name;
      // The pill says the act; the header chip counts what waits to publish. The API's
      // soft `warnings` are still handed back to whoever asked for the save, but nothing
      // reads them since 11 Sep — the amber block they filled on THE CHANGE REVIEW was
      // removed (user call). They never belonged in the two-second pill either.
      if (!quiet) toast('Saved');
      return { warnings };
    } else {
      // CREATE, read back first — the same screen every other write in the panel ends on.
      const ok = await reviewChanges({
        title: `Create “${(d.name || 'this ad setup').trim()}”?`,
        changes: setupCreateChangeList(),
        keepOrder: true,
        kicker: 'off air until an integration publishes over it',
        okLabel: 'Create', cancelLabel: 'Keep editing',
      });
      if (!ok) return;
      const res = await API.createSetup(d);
      // Born FOR an integration: back it goes, mapped — the ladders are tuned here later.
      if (KEY_RETURN) {
        await returnToKey(res.setup.id);
        return;
      }
      // Created — and the editor it lands in shows what from, so the pill needn't.
      toast(FORM.data.copiedFrom ? 'Copied' : 'Created');
      // Land IN the editor, not back on the list: what happens next — filling the ladders,
      // or tuning the ones the copy brought — happens on this page.
      location.hash = `#setups/${res.setup.id}`;
      return;
    }
  } catch (e) {
    // The seam refusal names the surface that would go dark — it lands on the
    // placements, open, where the fix is (7 Sep, UAT P1: no more toast-and-vanish).
    if (e.usedBy && e.usedBy.length) {
      SU_HEAD_OPEN.add('placements');
      FORM.errors.sections = e.message;
      FORM.rerender();
    } else {
      applyServerErrors(e);
    }
  }
}

async function deleteSetupClicked() {
  const ok = await ask({
    title: `Delete “${SETUP_ORIGINAL.name}”?`,
    body: 'This cannot be undone.',
    okLabel: 'Delete',
    danger: true,
  });
  if (!ok) return;
  try {
    await API.deleteSetup(SETUP_ORIGINAL.id);
    toast('Ad setup deleted');
    location.hash = '#setups';
  } catch (e) {
    toast(e.message, 'bad');
  }
}
