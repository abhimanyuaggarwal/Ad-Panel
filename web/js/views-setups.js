// views-setups.js — the ad setup EDITOR (the ops room): placements as tabs, the four
// breaks with pods, ladders and per-unit settings below the fold, delivery settings,
// request templates, and save/create. The list and chooser live in views-setups-list.js.

// views-setups.js — the OPS ROOM. An ad setup is one whole surface's demand — its
// PLACEMENTS (25 Aug): named sections, each with, per slot, a ladder (or squeeze-back
// rotation) of ad tags AND how that slot's ads behave. Attachable to 1..N integrations.
//
// Behaviour moved here from the integration the same day (user call): how many ads a
// break plays, when it falls, how long each tag waits — all of it is the ad's business,
// so it lives with the ad. A slot row therefore reads exactly like the integration's:
// closed, counted facts; open, two zones — What plays, then How it behaves.

let SETUP_ORIGINAL = null;
// The ⋯ menu, open or not — page state, closed by any rerender-worthy act.
let SU_MORE_OPEN = false;
function suMoreToggle(e) {
  if (e) e.stopPropagation();
  SU_MORE_OPEN = !SU_MORE_OPEN;
  FORM.rerender();
}
let SU_TAGS = [];
let SU_SEC = 0; // which placement the editor is on

// ---------- shared ladder grammar (used only in this room now) ----------

// A ladder is filled in order, so the buttons follow the order too.
function ladderFilled(rungs) {
  return (rungs || []).every(r => !!r.tagId);
}

function canAddRung(rungs) {
  return ladderFilled(rungs);
}

function chainCount(rungs) {
  return (rungs || []).length;
}


// One ladder row shape, used by every ladder in the product.
function rungRowHtml(r, i, count, ctx) {
  const off = r.on === false;
  // A rung that is off is still a rung: it holds its place, its number and its tag,
  // and reads as standing by rather than as an empty row. Under a SHARED setup this
  // switch is the ops team's sharpest tool — off here is off on every attached surface.
  return `
    <div class="rung-row ${off ? 'off' : ''} ${ctx.rowClass ? ctx.rowClass(i) : ''}" ${dragAttrs(ctx.dragKey, i)}>
      <span class="rung-grip" title="Drag to reorder">⠿</span>
      <span class="rung-n ${i === 0 && !off && !ctx.flat ? 'primary' : ''}">${ctx.rungLabelFor ? ctx.rungLabelFor(i, r) : (i === 0 ? 'Primary' : `Waterfall ${i}`)}</span>
      ${ctx.onToggle ? `<span class="toggle tiny ${off ? '' : 'on'}" onclick="${ctx.onToggle(i)}"
        title="${off ? 'Switched off — it keeps its tag and its place, on every attached integration.' : 'Switched on. Off stops trying it everywhere, without losing the tag.'}"><span class="track"></span></span>` : ''}
      ${ctx.control(i, r)}
      ${ctx.after ? ctx.after(i, r) : ''}
      <span class="rung-acts">
        <button class="rung-x" onclick="${ctx.onRemove(i)}" title="Remove">✕</button>
      </span>
    </div>`;
}

// ---------- editor ----------

async function viewSetupForm(id) {
  // A return ticket for a DIFFERENT destination is stale — navigating here any other
  // way must not leave a wrong “back to …” on the header.
  if (typeof KEY_RETURN !== 'undefined' && KEY_RETURN && KEY_RETURN.expect !== (id || 'new')) KEY_RETURN = null;
  const meta = await getMeta();
  KL_META = meta;
  const [{ tags }, gam, { templates }] = await Promise.all([API.listTags(), API.gamUnits(''), API.listTemplates()]);
  SU_TAGS = tags;
  SU_TPLS = templates;
  GAM_LAST_SYNC = gam.lastSync;
  for (const t of tags) window.NAME_LOOKUP[t.id] = t.name;

  let data;
  if (id) {
    const [{ setup }] = await Promise.all([API.getSetup(id), loadPublish('setup', id, '')]);
    SETUP_ORIGINAL = setup;
    PUB.name = setup.name;
    // A restore rewrites the draft server-side, so the editor is re-read, never patched.
    PUB.onRestored = () => viewSetupForm(id);
    data = {
      name: setup.name, property: setup.property,
      // _orig ties a form section back to its saved self for the counted chips
      // (divergence, muted-on, live counts) — renames keep it, new placements lack it.
      sections: setup.sections.map((sec, i) => ({
        name: sec.name, isDefault: sec.isDefault, _orig: i,
        slots: Object.fromEntries(meta.slotTypes.map(t => {
          // Each ladder slot carries its own DIRECT deal (1 Sep) — one, uncapped.
          const direct = sec.slots[t].direct
            ? { rungs: JSON.parse(JSON.stringify(sec.slots[t].direct.rungs)) }
            : null;
          return [t, t === 'midroll'
            // A mid-roll is PODS (31 Aug; renamed 3 Sep) — pod 1 doubles as the slot
            // itself, and each pod carries its own direct deal.
            ? { direct, groups: (sec.slots[t].groups || [{ rungs: sec.slots[t].rungs, behaviour: sec.slots[t].behaviour, direct: sec.slots[t].direct }])
                .map(g => ({
                  rungs: JSON.parse(JSON.stringify(g.rungs)),
                  behaviour: JSON.parse(JSON.stringify(g.behaviour)),
                  direct: { rungs: JSON.parse(JSON.stringify(g.direct?.rungs || [])) },
                })) }
            : {
              rungs: JSON.parse(JSON.stringify(sec.slots[t].rungs)),
              behaviour: JSON.parse(JSON.stringify(sec.slots[t].behaviour)),
              direct,
            }];
        })),
      })),
    };
  } else {
    SETUP_ORIGINAL = null;
    pubClear();
    const seed = SETUP_CREATE_SEED;
    SETUP_CREATE_SEED = null;
    if (seed) {
      // From a copy: the whole setup — shape, ladders, deals, delivery answers.
      data = {
        name: `${seed.name} copy`, property: seed.property, copiedFrom: seed.name,
        sections: setupSeedSections(seed, meta),
      };
    } else {
      // Blank starts from a PRESET — a photocopy of a shape that works, never a live
      // link — so nothing here is ever a blank form.
      const prefill = SETUP_CREATE_PREFILL;
      SETUP_CREATE_PREFILL = null;
      data = {
        name: prefill ? prefill.name : '', property: prefill ? prefill.property : window.GLOBAL_PROP,
        presetName: meta.rulePresets[meta.rulePresets.length - 1].name,
        sections: [suBlankSection('Default', meta, meta.rulePresets[meta.rulePresets.length - 1].values)],
      };
    }
  }
  SU_SEC = 0;
  for (const k of Object.keys(QF_TEXT)) delete QF_TEXT[k];
  SU_SLOT_OPEN = new Set();
  SU_ADD_HINT = null;
  startForm(data, () => renderSetupForm(meta));
  suTakePending(id, data, meta);
  renderSetupForm(meta);
  if (SU_ADD_HINT) {
    requestAnimationFrame(() => {
      document.querySelector('.rung-row.wants')?.scrollIntoView({ block: 'center' });
      document.querySelector('.rung-row.wants input')?.focus();
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
  if (j < 0) { toast(`“${p.secName}” is not a placement here any more`, 'warn'); return; }
  SU_SEC = j;
  SU_SLOT_OPEN.add(p.slot);
  const slot = p.slot === 'midroll' ? data.sections[j].slots.midroll.groups[0] : data.sections[j].slots[p.slot];
  const cap = isRotation(p.slot) ? (meta.rotationMax || 5) : meta.maxRungs;
  if (slot.rungs.length >= cap) {
    toast(`“${p.secName}” ${label('slotType', p.slot).toLowerCase()} is already at ${cap} of ${cap} — remove a tag first`, 'warn');
    return;
  }
  slot.rungs.push({ type: 'tag', tagId: '' });
  SU_ADD_HINT = { slot: p.slot, index: slot.rungs.length - 1, provider: p.provider };
  toast(`Pick a ${label('tagProvider', p.provider)} tag for “${p.secName}” — then save to send it out`);
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
  if (isDirectSlot(t)) return suDirectOf(baseSlot(t));
  if (t === 'midroll') {
    const gs = suMidGroups();
    if (SU_MID_G >= gs.length) SU_MID_G = 0;
    return gs[SU_MID_G];
  }
  return suSection().slots[t];
}
function suBhv(t) { return suSlot(t).behaviour || {}; }

// A placement, stamped from a behaviour preset: ladders empty, behaviour already sane.
function suBlankSection(name, meta, preset) {
  return {
    name, isDefault: name === 'Default', _orig: -1,
    slots: Object.fromEntries(meta.slotTypes.map(t => {
      const bhv = () => JSON.parse(JSON.stringify(preset.slots[t] || {}));
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

function suQFKey(t, f) { return `su${SU_SEC}:${t}${t === 'midroll' ? `:g${SU_MID_G}` : ''}:${f}`; }

function suBNum(el, t, f) {
  suSlot(t).behaviour[f] = Number(el.value);
  QF_TEXT[suQFKey(t, f)] = el.value;
}

// A count with an open end: empty is `Full`, stored as null — never a magic zero.
function suBNumNull(el, t, f) {
  suSlot(t).behaviour[f] = el.value.trim() === '' ? null : Number(el.value);
  QF_TEXT[suQFKey(t, f)] = el.value;
}

// Typed in SECONDS, stored in the JSON's milliseconds (3 Sep). Decimals are allowed —
// a 1.5 second timeout is a real answer — and the box keeps its own text while typing.
function suBNumSec(el, t, f) {
  const n = Number(el.value);
  suSlot(t).behaviour[f] = el.value.trim() === '' || Number.isNaN(n) ? undefined : Math.round(n * 1000);
  QF_TEXT[suQFKey(t, f)] = el.value;
}

function suBText(el, t, f) {
  suSlot(t).behaviour[f] = parseCuepointsText(el.value);
  QF_TEXT[suQFKey(t, f)] = el.value;
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
  toast(`${label('slotType', baseSlot(t))} settings applied to ${secs.length - 1} other placement${secs.length > 2 ? 's' : ''}`);
}

// The saved counterpart of the current placement — counted facts only exist for it.
function suOrigSection() {
  const sec = suSection();
  return SETUP_ORIGINAL && sec._orig >= 0 ? SETUP_ORIGINAL.sections[sec._orig] : null;
}

function suRungLabel(r) {
  const tag = SU_TAGS.find(x => x.id === r.tagId);
  return tag ? tag.name : (window.NAME_LOOKUP[r.tagId] || '(missing tag)');
}

async function suRefreshTags() {
  const { tags } = await API.listTags();
  SU_TAGS = tags;
  for (const o of tags) window.NAME_LOOKUP[o.id] = o.name;
}

function suAddRung(t) {
  const slot = suSlot(t);
  if (!canAddRung(slot.rungs)) return;
  const cap = isRotation(baseSlot(t)) ? (KL_META.rotationMax || 5) : KL_META.maxRungs;
  if (chainCount(slot.rungs) >= cap) return;
  slot.rungs.push({ type: 'tag', tagId: '' });
  clearErr('sections');
  FORM.rerender();
}

function suToggleRung(t, n) {
  const r = suSlot(t).rungs[n];
  r.on = r.on === false;
  clearErr('sections');
  FORM.rerender();
}

function suRemoveRung(t, n) {
  suSlot(t).rungs.splice(n, 1);
  clearErr('sections');
  FORM.rerender();
}

// ---------- a banner's own facts, on its rung (31 Aug, AD-JSON-SCOPE) ----------
// Type-based, never value-based: a display rung in a BREAK always carries them, a video
// rung never does — nothing appears or vanishes as values change. In a rotation the
// timings live in Delivery settings (drawn once, not five times), so its rungs keep
// only the page position.

function suRungFact(t, n, f, v) {
  suSlot(t).rungs[n][f] = v;
  clearErr('sections');
  clearErr('direct');
  FORM.rerender();
}


// WHICH TEMPLATE CARRIES THE UNIT, from the rung it sits on (31 Aug, user call). This
// is a TAG fact — changing it here changes it everywhere the tag is used, so the toast
// counts the blast radius. Standard is absence, as ever.
async function suRungTplSet(t, n, tplId) {
  const r = suSlot(t).rungs[n];
  const tag = SU_TAGS.find(x => x.id === r.tagId);
  if (!tag) return;
  try {
    await API.updateTag(tag.id, { tplId: tplId || null });
    await suRefreshTags();
    const { templates } = await API.listTemplates();
    SU_TPLS = templates;
    const others = (tag.usedBy || 1) - 1;
    toast(tplId
      ? `“${tag.name}” requests through “${SU_TPLS.find(x => x.id === tplId)?.name}”${others > 0 ? ` — everywhere it is used (${others} other setup${others > 1 ? 's' : ''})` : ''}`
      : `“${tag.name}” back to the standard template`);
    FORM.rerender();
  } catch (e) {
    toast((e.errors && e.errors[0]?.message) || e.message, 'bad');
  }
}

function suRungFactNum(el, t, n, f) {
  suSlot(t).rungs[n][f] = Number(el.value);
  QF_TEXT[`${suQFKey(t, f)}:r${n}`] = el.value;
}

// What a CLOSED rung wears: only what is news (a non-default pause, a named template,
// the off-directory mark), then the settings chevron — the door to everything else.
function suRungAfterHtml(t, n, r) {
  if (!r.tagId) return '';

  // A GEAR, not a repeated word (3 Sep, user call): ten rows saying "Settings" is the
  // same noise the read-only facts were. The gear is a label in icon form — it names
  // what it opens the way a chevron never did — and it shows itself exactly when the
  // row is yours: hover, or the caret in the unit's own field, and always while open.
  // The remove ✕ two pixels away has revealed this way all along.
  const open = SU_RUNG_OPEN === `${t}:${n}`;
  return `${window.TAG_OFFDIR[r.tagId]
      ? `<span class="offdir" title="Typed in here — GAM has not synced it yet. A typo will never fill.">not in GAM</span>` : ''}
    <button type="button" class="unit-settings ${open ? 'open' : ''}" onclick="suToggleRungSettings('${t}', ${n})"
      aria-label="Unit settings"
      title="${open ? 'Close this unit’s settings' : 'This unit’s own settings — pause, delay, placement, its template'}">
      <svg viewBox="0 0 16 16" width="14" height="14" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
        <circle cx="8" cy="8" r="2.2"/>
        <path d="M8 1.8v1.9M8 12.3v1.9M1.8 8h1.9M12.3 8h1.9M3.6 3.6l1.35 1.35M11.05 11.05l1.35 1.35M12.4 3.6l-1.35 1.35M4.95 11.05L3.6 12.4"/>
      </svg></button>`;
}

// ONE PANEL, EVERY UNIT (31 Aug, user call): pause is every unit's own answer now, a
// template can be attached where the unit is added, and the labels say what the viewer
// would see — one decision per line, the room's own label-column grammar. The panel
// FOLDS per rung (the room's own disclosure, like the slot rows) so a ten-rung ladder
// stays ten lines; only what differs from the defaults wears a chip when closed.
// Contents are type-based, never value-based: a video unit has no page slot or clocks;
// a rotation banner has no pause (nothing is playing under it).
// BELOW THE FOLD, IN THE PAGE'S OWN GRAMMAR (3 Sep, user call — the settled shape,
// after three cuts each of which taught one thing):
//   · the FOLD was right all along — a waterfall is read far more often than a unit is
//     tuned, so the row carries only the waterfall: order, switch, provider, unit;
//   · what killed fold v1 was its DIALECT (a 2-col 11.5px grid the page speaks nowhere
//     else) and its DOORWAY (an unlabelled chevron). The panel now speaks the exact row
//     language Delivery settings speaks two zones down — label column, one control, one
//     height — and the door is a word: a quiet "Settings" button on every filled row.
//   · the TABLE cut proved values need permanent labels; in a one-unit panel the label
//     column IS that, without ten rows of repeated chrome.
// A freshly picked unit opens its own panel — the first thing a new rung teaches is
// where its settings live. One panel open at a time; the ladder stays a ladder.
let SU_RUNG_OPEN = null; // `${slot}:${index}`

function suToggleRungSettings(t, n) {
  const k = `${t}:${n}`;
  SU_RUNG_OPEN = SU_RUNG_OPEN === k ? null : k;
  FORM.rerender();
}

function suRungPanelHtml(t, n, r) {
  if (!r.tagId || SU_RUNG_OPEN !== `${t}:${n}`) return '';
  const isDisplay = window.TAG_TYPE[r.tagId] === 'display';
  const rot = isRotation(baseSlot(t));
  const tv = f => QF_TEXT[`${suQFKey(t, f)}:r${n}`] ?? (r[f] ?? '');
  const clock = (f, ph, off) => `<div class="num-wrap sm${off ? ' off' : ''}"><input value="${esc(tv(f))}" placeholder="${ph}" inputmode="numeric"${off ? ' disabled' : ''}
      oninput="suRungFactNum(this, '${t}', ${n}, '${f}')"><span class="unit">sec</span></div>`;
  const row = (lbl, ctl, why, off) => `
      <div class="up-r${off ? ' off' : ''}"${why ? ` title="${esc(why)}"` : ''}>
        <span class="up-l">${esc(lbl)}</span>
        <span class="up-c">${ctl}</span>
      </div>`;
  const slots = (KL_META.displaySlots || []).map(v => ({ v, label: label('displaySlot', v) }));
  const paused = (r.pause || (isDisplay ? 'no' : 'yes')) === 'yes';
  const tag = SU_TAGS.find(x => x.id === r.tagId);
  const provTpls = tag ? SU_TPLS.filter(x => x.provider === tag.provider && inScope(x.property)) : [];
  return `
    <div class="unit-panel">
      ${rot ? '' : row('Content pause', accSeg(r.pause || (isDisplay ? 'no' : 'yes'), KL_META.pauseModes || ['yes', 'no', 'size'],
        (KL_META.pauseModes || ['yes', 'no', 'size']).map(x => label('pause', x)),
        o => `suRungFact('${t}', ${n}, 'pause', '${o}')`),
        'Whether the video stops while this ad shows — Auto lets the player decide (JSON: pause)')}
      ${rot ? '' : row('Request delay', clock('showAfterSec', 'now'),
        'This unit’s request fires this long after its turn comes — empty fires it at once (JSON: delay)')}
      ${row('Ad placement',
        selectHtml(r.displaySlot || (KL_META.displaySlots || [])[0], slots, v => { suRungFact(t, n, 'displaySlot', v); }),
        isDisplay
          ? 'Where on the page this banner renders — the position carries its own sizes player-side (JSON: slot)'
          : 'Where this unit’s companion renders alongside the video — the position carries its own sizes player-side (JSON: slot)')}
      ${isDisplay && !rot ? `
        ${row('Skip offset', clock('closeAfterSec', '', paused), paused
          ? 'Content is paused — the player shows its own ad controls, not a close button (JSON: skip)'
          : 'The close button appears this long after the banner does (JSON: skip)', paused)}
        ${row('Auto-hide', clock('hideAfterSec', ''), 'The banner leaves on its own, and content has the screen back (JSON: hide)')}` : ''}
      ${tag ? row('Request template',
        selectHtml(tag.tplId || '', [{ v: '', label: 'Standard' }, ...provTpls.map(x => ({ v: x.id, label: x.name }))],
          v => { suRungTplSet(t, n, v); }),
        (tag.usedBy || 1) > 1
          ? `The request URL this unit fires through (JSON: unit.tpl). A tag fact — it changes everywhere “${tag.name}” is used (${tag.usedBy} setups).`
          : 'The request URL this unit fires through (JSON: unit.tpl). Templates are named at the head of this page.') : ''}
    </div>`;
}

function suRungSearchHtml(t, n) {
  const slot = suSlot(t);
  const cur = slot.rungs[n];
  const hint = SU_ADD_HINT && SU_ADD_HINT.slot === t && SU_ADD_HINT.index === n ? SU_ADD_HINT : null;
  return tagLookupHtml({
    family: slotFamily(baseSlot(t)),
    slot: t,
    preferProvider: hint ? hint.provider : null,
    alsoTakes: slotAlsoTakes(baseSlot(t)),
    exclude: slot.rungs.filter((r, j) => j !== n).map(r => r.tagId),
    value: cur && cur.type === 'tag' && cur.tagId ? suRungLabel(cur) : '',
    tagId: cur?.tagId,
    onPick: async tag => {
      await suRefreshTags();
      const rung = { type: 'tag', tagId: tag.id, on: cur?.on !== false };
      // A unit starts with its facts stated (31 Aug) — the same defaults the server
      // would fill, so what you see is what saves.
      if (!isRotation(baseSlot(t))) rung.pause = tag.type === 'display' ? 'no' : 'yes';
      if (tag.type === 'display') {
        rung.displaySlot = (KL_META.displaySlots || ['player_bottom'])[0];
        if (!isRotation(baseSlot(t))) Object.assign(rung, { showAfterSec: 1, closeAfterSec: 5, hideAfterSec: 10 });
      }
      suSlot(t).rungs[n] = rung;
      // The first thing a fresh rung teaches is where its settings live.
      SU_RUNG_OPEN = `${t}:${n}`;
      // The new unit's settings open on their own — the template and pause are right
      // there the moment the unit lands, not a hunt later.
      clearErr('sections');
      FORM.rerender();
    },
  });
}

// ---------- placements: the setup's own sections ----------

function suSecSet(i) {
  SU_RUNG_OPEN = null;
  SU_SEC = Number(i);
  SU_MID_G = 0;
  FORM.rerender();
}

// Live use per placement, counted from the attached integrations.
function suSecLiveNote(sec) {
  if (!SETUP_ORIGINAL || sec._orig < 0) return '';
  const lc = SETUP_ORIGINAL.liveCounts?.[SETUP_ORIGINAL.sections[sec._orig]?.name];
  if (!lc) return '';
  // One integration fills a setup (26 Aug), so this is on/off, not "N of M" — counting
  // over a set of one reads like arithmetic and says less than the word does.
  const on = Math.max(0, ...KL_META.slotTypes.map(t => lc[t]?.on || 0));
  return on ? `switched on in ${esc(SETUP_ORIGINAL.usedByNames[0] || 'the integration it fills')}` : '';
}

// THE NAME IS EDITED IN THE TAB (3 Sep, user call — the rename modal is gone). A
// placement's name is a label on a tab; asking for a dialog to change a label was a
// detour, and the "a placement inside X · switched on there" byline under it said what
// the page already says twice over. A new placement is born "Untitled" ON its tab, with
// the caret in it — naming it IS the next act, not a prompt to get through first.
function suTabsHtml(meta) {
  const secs = FORM.data.sections;
  const tab = (i, s) => {
    const live = suSecLiveNote(s);
    // The tab you are standing on, and that may be renamed, IS its own input.
    if (SU_SEC === i && !s.isDefault) {
      return `
      <span class="stab on pl-live" ${live ? `title="${esc(live)}"` : ''}>
        <input class="pl-name" value="${esc(s.name)}" placeholder="Untitled" aria-label="Placement name"
          size="${Math.max(6, (s.name || 'Untitled').length)}"
          oninput="suSecName(this)" onblur="suSecNameDone(this)">
        <button type="button" class="pl-x" onclick="suRemoveSection()"
          title="Remove this placement — its ladders go with it">×</button>
      </span>`;
    }
    return `
      <button type="button" class="stab ${SU_SEC === i ? 'on' : ''}" ${live ? `title="${esc(live)}"` : ''}
        onclick="suSecSet(${i})">${esc(s.name || 'Untitled')}</button>`;
  };
  // THE LABEL SITS ABOVE THE STRIP (3 Sep, user call): inline, it pushed Default out of
  // the card's left edge, so the first tab never lined up with anything under it. Above,
  // it names the strip and every tab starts where the rows below start.
  const tabs = [...secs.map((s, i) => tab(i, s))];
  const atMax = secs.length >= (meta.maxSections || 5);
  tabs.push(`<button type="button" class="stab add" ${atMax ? `disabled title="At most ${meta.maxSections} placements"` : ''} onclick="suAddSection()">+ Add placement</button>`);
  // ONE directory, ONE sync (1 Sep, user call): the GAM pull refreshes the whole unit
  // directory, so its CTA sits once on the placements line — not on every break.
  tabs.push(`<span class="gam-sync">
      <button type="button" class="zlink" onclick="syncGamClicked()"
        title="Pull newly trafficked ad units from GAM, so a unit made this morning is pickable now">sync GAM units</button>
      <span class="gam-sync-note">${GAM_LAST_SYNC ? esc(`synced ${relWhen(GAM_LAST_SYNC)}`) : ''}</span>
    </span>`);
  return `
    <div class="pl-head">Placements</div>
    <div class="scope-tabs pl-tabs">${tabs.join('')}</div>`;
}

// The current placement's identity line — rename and remove live here, not on Default.
// Nothing to draw any more: the name lives in the tab, and remove is the × on it.
function suSecSubheadHtml() { return ''; }

// Typing a name repaints NOTHING — the input is the label (the caret rule).
function suSecName(el) {
  suSection().name = el.value;
  // The tab grows with the name without a rerender — the caret never moves.
  el.size = Math.max(6, el.value.length);
  clearErr('sections');
}

// On the way out: an empty name is Untitled again, and a clash says so rather than
// saving two placements a surface could not tell apart.
function suSecNameDone(el) {
  const sec = suSection();
  const name = (el.value || '').trim();
  if (!name) {
    sec.name = suUntitledName();
    FORM.rerender();
    return;
  }
  if (FORM.data.sections.some(s => s !== sec && (s.name || '').toLowerCase() === name.toLowerCase())) {
    toast(`A placement named “${name}” is already here`, 'warn');
    return;
  }
  sec.name = name;
}

// "Untitled", then "Untitled 2" — a new tab never collides with the last one.
function suUntitledName() {
  const taken = new Set(FORM.data.sections.map(s => (s.name || '').toLowerCase()));
  if (!taken.has('untitled')) return 'Untitled';
  for (let n = 2; n < 99; n++) if (!taken.has(`untitled ${n}`)) return `Untitled ${n}`;
  return 'Untitled';
}

// A new placement is a CLONE of Default (25 Aug, user call) — its behaviour AND its
// ladders. Starting from what already works beats fifteen empty fields, and what needs
// to differ is then an edit you can see against a known baseline.
function suAddSection() {
  const max = KL_META.maxSections || 5;
  if (FORM.data.sections.length >= max) return;
  const name = suUntitledName();
  const clone = JSON.parse(JSON.stringify(FORM.data.sections[0]));
  FORM.data.sections.push({ ...clone, name, isDefault: false, _orig: -1 });
  SU_SEC = FORM.data.sections.length - 1;
  SU_SLOT_OPEN = new Set();
  clearErr('sections');
  FORM.rerender();
  // The caret lands in the new tab: naming it is the act, not a dialog before the act.
  requestAnimationFrame(() => {
    const el = document.querySelector('.pl-name');
    if (el) { el.focus(); el.select(); }
  });
  toast('A copy of Default — name it, then change what differs');
}

// A new setup restamps from a preset: every placement's behaviour, ladders untouched.
function suStampPreset(name) {
  const preset = KL_META.rulePresets.find(p => p.name === name);
  if (!preset) return;
  FORM.data.presetName = name;
  for (const sec of FORM.data.sections) {
    for (const t of KL_META.slotTypes) {
      const v = () => JSON.parse(JSON.stringify(preset.values.slots[t] || {}));
      if (t === 'midroll') for (const g of sec.slots[t].groups) g.behaviour = v();
      else sec.slots[t].behaviour = v();
    }
  }
  FORM.rerender();
}


async function suRemoveSection() {
  const sec = suSection();
  const live = suSecLiveNote(sec);
  const ok = await ask({
    title: `Remove placement “${sec.name}”?`,
    body: live
      ? `It is ${esc(live)} live integration surfaces — the save will be refused until they switch it off.`
      : 'Its ladders go with it. Integrations lose the placement on save.',
    okLabel: 'Remove',
    danger: true,
  });
  if (!ok) return;
  FORM.data.sections.splice(SU_SEC, 1);
  SU_SEC = 0;
  clearErr('sections');
  FORM.rerender();
}

// What a closed slot row says: the demand, then how it behaves — counted, no prose.
// THE CLOSED ROW IS QUIET (31 Aug, user call — the fact bylines were noise). The one
// fact that must never hide is EMPTINESS: a slot with nothing to run still says so,
// because dark-until-noticed is the harmful option. Everything else lives inside.
// ---------- clearing a break, and clearing the setup (3 Sep, user call) ----------
// CLEAR means the demand: every ad unit in the break — the indirect ladder and the direct
// deal — and on a mid-roll the extra pods, which collapse back to Pod 1. Delivery settings
// stay: they are how the break behaves, not what it asks. Counted before the confirm and
// named inside it, so nobody clears more than they meant to.
function suSlotUnits(sec, t) {
  const s = (sec.slots || {})[t];
  if (!s) return { units: 0, pods: 0 };
  const filled = a => (a || []).filter(r => r && r.tagId).length;
  if (t === 'midroll') {
    const gs = s.groups || [];
    return {
      units: gs.reduce((a, g) => a + filled(g.rungs) + filled(g.direct && g.direct.rungs), 0),
      pods: Math.max(0, gs.length - 1),
    };
  }
  return { units: filled(s.rungs) + filled(s.direct && s.direct.rungs), pods: 0 };
}

function suEmptySlot(sec, t) {
  const s = (sec.slots || {})[t];
  if (!s) return;
  if (s.direct) s.direct = { rungs: [] };
  if (t === 'midroll') {
    const keep = s.groups[0];
    keep.rungs = [];
    keep.direct = { rungs: [] };
    s.groups.length = 1;
  } else {
    s.rungs = [];
  }
}

function suUnitWords(units, pods) {
  const u = `${units} ad unit${units === 1 ? '' : 's'}`;
  return pods ? `${u} across ${pods + 1} pods` : u;
}

// The break's own Clear, in the right-hand gutter — it shows itself when the row is
// yours (the ad unit's gear grammar, 3 Sep), and greys where it sits when there is
// nothing to clear rather than disappearing and leaving a person hunting for it.
function suSlotClearHtml(t) {
  const { units, pods } = suSlotUnits(suSection(), t);
  if (!units && !pods) return `<span class="slot-clear off" title="Nothing to clear — this break has no ad unit">Clear</span>`;
  return `<button type="button" class="slot-clear" onclick="event.stopPropagation(); suClearSlot('${t}')"
    title="Empty this break — ${esc(suUnitWords(units, pods))}; delivery settings stay">Clear</button>`;
}

async function suClearSlot(t) {
  const sec = suSection();
  const { units, pods } = suSlotUnits(sec, t);
  if (!units && !pods) return;
  const name = label('slotType', t);
  const ok = await ask({
    title: `Clear ${name.toLowerCase()} in “${sec.name}”?`,
    body: `Removes ${suUnitWords(units, pods)}${pods
      ? `, and ${pods === 1 ? 'pod 2 goes with its cadence' : `pods 2–${pods + 1} go with their cadence`}` : ''}. `
      + 'Delivery settings stay, and nothing leaves the page until you save.',
    okLabel: 'Clear', danger: true,
  });
  if (!ok) return;
  suEmptySlot(sec, t);
  SU_MID_G = 0;
  SU_RUNG_OPEN = null;
  clearErr('sections');
  FORM.rerender();
  toast(`${name} cleared in “${sec.name}” — save to keep it`);
}

// The whole setup at once, from the ⋯ menu: every break of every placement. The
// placements, their names and every delivery setting stand — only the demand goes.
async function suClearAllSlots() {
  const d = FORM.data;
  let units = 0, pods = 0, breaks = 0;
  for (const sec of d.sections || []) {
    for (const t of KL_META.slotTypes) {
      const c = suSlotUnits(sec, t);
      if (c.units || c.pods) breaks++;
      units += c.units;
      pods += c.pods;
    }
  }
  if (!units && !pods) return;
  const secN = (d.sections || []).length;
  const ok = await ask({
    title: 'Clear every ad unit in this setup?',
    body: `Removes ${units} ad unit${units === 1 ? '' : 's'} from ${breaks} break${breaks === 1 ? '' : 's'}`
      + `${secN > 1 ? ` across ${secN} placements (${(d.sections || []).map(s => s.name).join(', ')})` : ''}`
      + `${pods ? `, and ${pods} extra pod${pods === 1 ? '' : 's'} go with their cadence` : ''}. `
      + 'The placements and every delivery setting stay, and nothing leaves the page until you save.',
    okLabel: 'Clear all', danger: true,
  });
  if (!ok) return;
  for (const sec of d.sections || []) for (const t of KL_META.slotTypes) suEmptySlot(sec, t);
  SU_MID_G = 0;
  SU_RUNG_OPEN = null;
  clearErr('sections');
  FORM.rerender();
  toast(`Cleared ${units} ad unit${units === 1 ? '' : 's'} — save to keep it`);
}

function suAnyUnits() {
  return (FORM.data.sections || []).some(sec =>
    KL_META.slotTypes.some(t => { const c = suSlotUnits(sec, t); return c.units || c.pods; }));
}

function suSlotGlimpse(t) {
  const gs = t === 'midroll' ? suMidGroups() : [suSlot(t)];
  const n = gs.reduce((a, g) => a + (g.rungs || []).filter(r => r.tagId).length, 0);
  const live = gs.reduce((a, g) => a + (g.rungs || []).filter(r => r.tagId && r.on !== false).length, 0);
  if (!n) return `<span class="sg-empty">no demand</span>`;
  if (!live) return `<span class="sg-empty">every tag off</span>`;
  return '';
}

// One cadence, in five words — the group tab's own fact line.
function suCadenceWord(b) {
  if (!b) return '';
  if (b.mode === 'interval') return `every ${fmtCue(b.every)}`;
  const n = (b.cuepoints || []).length;
  return `${n} break${n === 1 ? '' : 's'}`;
}

// ---------- mid-roll break groups (31 Aug): scope is position, one group is chrome-free ----------

function suMidGroupSet(gi) {
  SU_RUNG_OPEN = null;
  SU_MID_G = Number(gi);
  FORM.rerender();
}

async function suAddMidGroup() {
  const gs = suMidGroups();
  if (gs.length >= (KL_META.maxMidrollGroups || 3)) return;
  // A new pod clones the one on screen — never a blank form (the placement rule) — but
  // never its DEAL: a deal is sold against one pod, and two pods running it would be
  // the same inventory promised twice.
  const clone = JSON.parse(JSON.stringify(gs[SU_MID_G] || gs[0]));
  clone.rungs = [];
  clone.direct = { rungs: [] };
  gs.push(clone);
  SU_MID_G = gs.length - 1;
  SU_SLOT_OPEN.add('midroll');
  clearErr('sections');
  FORM.rerender();
  toast('New pod — its own deal, ladder and cadence. Give it demand before switching mid-rolls on.');
}

async function suRemoveMidGroup() {
  const gs = suMidGroups();
  if (gs.length < 2) return;
  const ok = await ask({
    title: `Remove break group ${SU_MID_G + 1}?`,
    body: 'Its ladder and cadence go with it. A surface running mid-rolls live keeps the save refused until every remaining group has demand.',
    okLabel: 'Remove',
    danger: true,
  });
  if (!ok) return;
  gs.splice(SU_MID_G, 1);
  SU_MID_G = 0;
  clearErr('sections');
  FORM.rerender();
}

// The group picker: tabs, the same grammar placements use — each option wears its own
// cadence so opening one never loses sight of the others. At ONE group this renders
// nothing at all: the 64-of-67 simple surfaces never meet the concept.
function suMidTabsHtml() {
  const gs = suMidGroups();
  const max = KL_META.maxMidrollGroups || 3;
  return `
    <div class="scope-tabs grp-tabs pod-tabs">
      <span class="scope-eyebrow">Pods</span>
      ${gs.map((g, gi) => `
        <button type="button" class="stab ${SU_MID_G === gi ? 'on' : ''}"
          title="${esc(`${g.rungs.filter(r => r.tagId && r.on !== false).length} tags · ${suCadenceWord(g.behaviour)}`)}"
          onclick="suMidGroupSet(${gi})">Pod ${gi + 1}</button>`).join('')}
      ${gs.length < max
        ? `<button type="button" class="stab add" title="Another pod — its own deal, its own ladder, its own cadence (up to ${max})" onclick="suAddMidGroup()">+ Add pod</button>` : ''}
      ${gs.length > 1 ? `<span style="flex:1"></span>
      <button type="button" class="zlink quiet-danger" onclick="suRemoveMidGroup()"
        title="Removes this pod's deal, ladder and cadence. A surface running mid-rolls live keeps the save refused until every remaining pod has demand.">Remove pod ${SU_MID_G + 1}</button>` : ''}
    </div>`;
}

// THE LADDER, IN TWO PIECES (27 Aug, user call). One primary — the ask that happens
// first, every time — then a rule saying what the rest of the rows are *for*, then the
// fall as plain numbers. Before this the ten rows were one undifferentiated wall (and a
// stale 20px label column had squashed every one of them to "P…"/"W…"), so the row that
// decides most of the revenue looked exactly like the ninth fallback. A rotation is not
// a fall: its banners take turns, so they stay one flat list.
function suLadderHtml(t, ctx) {
  const slot = suSlot(t);
  if (!slot.rungs.length) {
    return `<div class="ladder-empty" title="An integration cannot switch this break on while it has no demand">No tags</div>`;
  }
  const rows = slot.rungs.map((r, n) => rungRowHtml(r, n, slot.rungs.length, ctx) + suRungPanelHtml(t, n, r));
  if (isRotation(t)) return `<div class="rung-list">${rows.join('')}</div>`;
  const fall = rows.slice(1);
  const liveFall = slot.rungs.slice(1).filter(r => r.tagId && r.on !== false).length;
  return `
    <div class="rung-list lead">${rows[0]}</div>
    ${fall.length ? `
      <div class="fall-rule" title="The primary tag is asked first. Only if it returns no ad does the waterfall run — top down, one at a time.">
        <span class="fall-w">Fallback order</span>
        <span class="fall-n">${liveFall} of ${fall.length} active</span>
      </div>
      <div class="rung-list fall">${fall.join('')}</div>` : ''}`;
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
    rungLabelFor: n => (rot ? `Banner ${n + 1}` : n === 0 ? 'Primary' : String(n)),
    onToggle: n => `suToggleRung('${t}', ${n})`,
    control: n => suRungSearchHtml(t, n),
    rowClass: n => `${SU_ADD_HINT && SU_ADD_HINT.slot === t && SU_ADD_HINT.index === n ? 'wants' : ''}${!rot && n === 0 ? ' lead' : ''}`,
    onRemove: n => `suRemoveRung('${t}', ${n})`,
    dragKey: `su-${SU_SEC}-${t}`,
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
    ? `<span class="sg-off" title="Set in Ad delivery on the integration — these ad sources are what it decides over">${esc(`${drv.keyName}: ${drvBits.join(' · ')}`)}</span>` : '';

  // THE GUTTER IS THE MAP (31 Aug, user call): the zone names moved off the content
  // and into the empty left column under the break's own name — a fixed rail the eye
  // scans (Direct · Groups · Indirect · Delivery settings), one zone per row beside what it
  // names. The header line keeps the closed row's exact anatomy.
  const head = `
      <div class="slot-head">
        <span class="slot-label">${esc(label('slotType', t))}</span>
        <div class="slot-line" onclick="suToggleSlot('${t}')">
          <span class="slot-glimpse">${suSlotGlimpse(t)}</span>
          ${divNote}
          <span class="slot-chev ${open ? 'open' : ''}" title="${open ? 'Close' : 'The ladder and how this break behaves live here'}">›</span>
        </div>
        <span class="slot-menu-ph">${suSlotClearHtml(t)}</span>
      </div>`;
  if (!open) return `<div class="slot-row">${head}</div>`;

  const zone = (lbl, why, inner) => `
      <div class="zone-row"${why ? ` title="${esc(why)}"` : ''}>
        <span class="zone-l">${esc(lbl)}</span>
        <div class="zone-c">${inner}</div>
        <span class="slot-menu-ph"></span>
      </div>`;
  // THE BREAK'S OWN DIRECT DEAL (1 Sep, user call — per break, not global): its zone
  // sits ABOVE Indirect, exactly where it sits in the walk. The rung addresses itself
  // as '<slot>@direct', so every rung helper works unchanged.
  const dt = `${t}@direct`;
  const dSlot = SLOT_KIND[baseSlot(t)] === 'rotation' ? null : suDirectOf(t);
  const dCtx = dSlot ? {
    rungs: dSlot.rungs,
    rungLabelFor: n => String(n + 1),
    flat: true,
    onToggle: n => `suToggleRung('${dt}', ${n})`,
    control: n => suRungSearchHtml(dt, n),
    rowClass: () => '',
    onRemove: n => `suRemoveRung('${dt}', ${n})`,
    dragKey: `su-${SU_SEC}-${dt}`,
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
  const directZone = !dSlot ? '' : zone('Direct',
    t === 'midroll'
      ? 'This pod\u2019s sold-direct deal — one, tried before the pod\u2019s primary each time the pod fires. Every pod sells its own.'
      : 'The break\u2019s sold-direct deal — one, tried before its primary each time the break fires.',
    `${dSlot.rungs.length
      ? `<div class="rung-list">${dSlot.rungs.map((r, n) => rungRowHtml(r, n, dSlot.rungs.length, dCtx) + suRungPanelHtml(dt, n, r)).join('')}</div>`
      : `<div class="slot-multi-foot">
          <button class="slot-add" onclick="suAddRung('${dt}')">+ Add the direct deal</button>
        </div>`}`);

  // THE PODS STRIP (3 Sep, user call): everything on a mid-roll belongs to a pod, so
  // the pod is the container the rest sits inside — not a "Groups" row whose only job
  // was to hold an add link. The strip stands even at one pod, which is what makes
  // "everything is in pod 1" visible, and adding another is an act on the strip.
  const groupsZone = t !== 'midroll' ? '' : suMidTabsHtml();
  // INDIRECT (1 Sep, user call): the open-market ladder wears the word that pairs with
  // Direct. A rotation has no Direct, so the pair means nothing there — it keeps
  // 'Ad sources'. GAM sync left this foot for the page header: one directory, one CTA.
  const sourcesZone = zone(rot ? 'Ad sources' : 'Indirect',
    rot ? 'Banners take turns. The integration decides which partners it asks; the tags themselves are ops\u2019.'
        : 'Open-market demand, tried in order until one fills — after the direct deal. The integration decides which partners it asks.',
    `${suLadderHtml(t, ctx)}
     <div class="slot-multi-foot">
        ${rot ? `
          ${!atMax
            ? `<button class="slot-add" ${canAddRung(slot.rungs) ? '' : 'disabled title="Fill the one above first"'} onclick="suAddRung('${t}')">+ Add banner tag</button>`
            : `<span class="slot-order-note">${meta.rotationMax} of ${meta.rotationMax}</span>`}`
        : `
          ${!atMax ? `<button class="slot-add" ${canAddRung(slot.rungs) ? '' : 'disabled title="Fill the tag above first"'} onclick="suAddRung('${t}')">+ ${slot.rungs.length ? 'Add fallback tag' : 'Add primary tag'}</button>`
            : `<span class="slot-order-note">${meta.maxRungs} of ${meta.maxRungs}</span>`}`}
      </div>`);
  const deliveryZone = zone('Delivery settings',
    'How this break behaves wherever this placement runs — every attached integration follows it',
    `<div class="bhv-grid">${behaviourRowsHtml(t, suBhvAdapter(t))}</div>
     ${FORM.data.sections.length > 1 ? `<div class="zrow bhv-foot">
       <button type="button" class="zlink" onclick="suSlotToAll('${t}')"
         title="Copy this placement’s settings for this break onto every other placement — reviewed field by field before it lands">Apply to all placements</button>
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
        ? `<button type="button" class="eh-back" onclick="returnToKey()" title="Back to “${esc(KEY_RETURN.name)}” — your edits there are kept">←</button>`
        : '<a class="eh-back" href="#setups" title="Back to ad setups">←</a>'}
      ${propBadge(d.property)}
      <h1>${editing ? esc(SETUP_ORIGINAL.name) : 'New ad setup'}</h1>
      ${KEY_RETURN && !editing ? `<span class="podl">for “${esc(KEY_RETURN.name)}” — mapped there on Create</span>` : ''}
      ${editing ? pubStateChipHtml() : d.copiedFrom ? `<span class="podl">copied from “${esc(d.copiedFrom)}” — its own from here</span>` : ''}
      <span class="eh-gap"></span>
      ${editing ? `
        <button class="btn ghost" onclick="saveSetupClicked()">Save</button>
        <button class="btn ${n ? '' : 'ghost'}" ${n ? '' : 'disabled title="Nothing to publish — what is on air is what you see"'}
          onclick="publishClicked()">${live ? 'Publish' : 'Publish — go on air'}${n ? ` (${n})` : ''}</button>`
      : `<button class="btn" onclick="saveSetupClicked()">Create ad setup</button>`}
      <div class="eh-more ${SU_MORE_OPEN ? 'open' : ''}">
        <button type="button" class="btn ghost eh-more-btn" onclick="suMoreToggle(event)" title="More actions">⋯</button>
        <div class="eh-menu">
          <div class="eh-item ${anyUnits ? '' : 'dim'}" ${anyUnits
            ? 'onclick="suMoreToggle(); suClearAllSlots()"'
            : 'title="Nothing to clear — no break in this setup has an ad unit"'}>Clear all ad units</div>
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
          <div class="field" style="min-width: 190px"><label>Property</label>
            ${selectHtml(d.property || 'All', meta.propertyScopes.map(v => ({ v, label: v === 'All' ? 'All properties' : v })), v => { FORM.data.property = v; clearErr('property'); FORM.rerender(); })}
          </div>
          ${!editing && d.presetName ? `
          <div class="field" style="min-width: 170px"><label>Template</label>
            ${selectHtml(d.presetName, meta.rulePresets.map(p => ({ v: p.name, label: p.name })), v => suStampPreset(v))}
          </div>` : ''}
        </div>
        ${editing ? suTemplatesRowHtml() : ''}
        ${FORM.errors.sections ? `<div class="banner bad" data-err-for="sections">${esc(FORM.errors.sections)}</div>` : ''}
        ${suTabsHtml(meta)}
        ${suSecSubheadHtml()}
        ${meta.slotTypes.map(t => suSlotRowHtml(t, meta)).join('')}
      </div>

    </div>
    ${editing ? pubRailHtml() : ''}
    </div>`;
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
  return {
    name: d.name, property: d.property,
    sections: d.sections.map(sec => ({
      name: sec.name,
      slots: Object.fromEntries(Object.entries(sec.slots).map(([t, slot]) => {
        const direct = slot.direct
          ? { rungs: (slot.direct.rungs || []).filter(r => r.tagId).map(rungPayload) }
          : undefined;
        return [t, t === 'midroll'
          ? { direct, groups: slot.groups.map(g => ({
              rungs: (g.rungs || []).filter(r => r.tagId).map(rungPayload),
              behaviour: g.behaviour,
              direct: { rungs: (g.direct?.rungs || []).filter(r => r.tagId).map(rungPayload) },
            })) }
          : {
            rungs: (slot.rungs || []).filter(r => r.tagId).map(rungPayload),
            behaviour: slot.behaviour,
            direct,
          }];
      })),
    })),
  };
}

async function saveSetupClicked() {
  const d = setupPayload(FORM.data);
  try {
    let warnings = [];
    if (SETUP_ORIGINAL) {
      // Save is no longer the moment traffic changes (27 Aug) — it writes the draft and
      // says so, and the rail counts what is now waiting. Publish is the release.
      const res = await API.updateSetup(SETUP_ORIGINAL.id, d);
      warnings = res.warnings || [];
      SETUP_ORIGINAL = res.setup;
      warnings.forEach(w => toast(w, 'warn'));
      await pubReload();
      PUB.name = SETUP_ORIGINAL.name;
      const n = (PUB.unpublished || []).length;
      toast(n ? `Saved — ${n} change${n === 1 ? '' : 's'} waiting to publish` : 'Saved');
      return;
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
      (res.warnings || []).forEach(w => toast(w, 'warn'));
      // Born FOR an integration: back it goes, mapped — the ladders are tuned here later.
      if (KEY_RETURN) {
        await returnToKey(res.setup.id);
        return;
      }
      toast(FORM.data.copiedFrom
        ? `“${res.setup.name}” created — a copy of “${FORM.data.copiedFrom}”, its own from here`
        : `“${res.setup.name}” created — its ad units are added here`);
      // Land IN the editor, not back on the list: what happens next — filling the ladders,
      // or tuning the ones the copy brought — happens on this page.
      location.hash = `#setups/${res.setup.id}`;
      return;
    }
    warnings.forEach(w => toast(w, 'warn'));
    location.hash = '#setups';
  } catch (e) {
    // The seam refusal names the surfaces that would go dark — show it whole.
    if (e.usedBy && e.usedBy.length) {
      toast(`${e.message}: ${e.usedBy.slice(0, 3).join(', ')}${e.usedBy.length > 3 ? ` +${e.usedBy.length - 3} more` : ''}`, 'bad');
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
