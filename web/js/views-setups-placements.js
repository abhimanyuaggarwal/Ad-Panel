// views-setups-placements.js — the setup editor's PLACEMENTS: the tab strip (rename in
// the tab, add, duplicate, remove), the mid-roll POD strip, CLEAR (a break, or every
// break — build-time only), the closed slot row's glimpse, and the counted helpers
// behind them (`suSlotUnits`, `suSlotLinked`, `suDarkPods`).
// Loads before views-setups-editor.js; shares its globals (FORM, SU_SEC, SU_MID_G, …).

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
  // A setup may fill SEVERAL integrations (8 Sep), and then the count is the fact: how
  // many of them actually have this placement's breaks on. With one holder the number
  // reads like arithmetic over a set of one, so it stays a name.
  const on = Math.max(0, ...KL_META.slotTypes.map(t => lc[t]?.on || 0));
  if (!on) return '';
  const holders = SETUP_ORIGINAL.usedBy || 0;
  return holders > 1
    ? `switched on in ${on} of ${holders} integrations`
    : `switched on in ${esc(SETUP_ORIGINAL.usedByNames[0] || 'the integration it fills')}`;
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
      <span class="stab on pl-live${chgIf(FORM.saved && s._orig < 0)}${SU_SEC_BAD.has(s) ? ' err' : ''}" ${SU_SEC_BAD.has(s) ? `title="${esc(SU_SEC_BAD.get(s))}"` : live ? `title="${esc(live)}"` : ''}>
        <input class="pl-name${SU_SEC_BAD.has(s) ? ' err' : ''}" value="${esc(s.name)}" placeholder="Untitled" aria-label="Placement name"
          size="${Math.max(6, (s.name || 'Untitled').length)}"
          oninput="suSecName(this)" onblur="suSecNameDone(this)">
        <button type="button" class="pl-x" onclick="suRemoveSection()"
          title="Its ladders go with it">×</button>
      </span>`;
    }
    return `
      <button type="button" class="stab ${SU_SEC === i ? 'on' : ''}${chgIf(FORM.saved && s._orig < 0)}" ${live ? `title="${esc(live)}"` : ''}
        onclick="suSecSet(${i})">${esc(s.name || 'Untitled')}</button>`;
  };
  // The section head names the strip now (6 Sep, user call — Placements wears the head
  // sections' exact fold grammar), so the strip is just the tabs, starting where the
  // rows below start.
  const tabs = [...secs.map((s, i) => tab(i, s))];
  const atMax = secs.length >= (meta.maxSections || 5);
  tabs.push(`<button type="button" class="stab add" ${atMax ? `disabled title="At most ${meta.maxSections} placements"` : ''} onclick="suAddSection()">+ Add placement</button>`);
  // The GAM sync CTA left this line (4 Sep, user call — it was a page-level act for a
  // search-level problem): the pull now lives IN the ad-unit search, offered on the row
  // where the directory comes up short. See lookupGamRowHtml in controls.js.
  return `
    <div class="scope-tabs pl-tabs">${tabs.join('')}</div>`;
}

// THE FOLDED LINE TALKS IN MARKS (7 Sep, user call — the counted prose distracted):
// the listing's own break chips, lit where a break carries demand, wearing the shared-
// waterfall mark where it follows the head of the page; a quiet number chip when there
// is more than one placement. The exact story — placements, units, who follows — rides
// the hover, the templates chip's own grammar.
function suPlacementsGlimpse() {
  const d = FORM.data;
  const secs = (d.sections || []).length;
  let units = 0, linked = 0;
  const chips = slotChipRowHtml(t => {
    let n = 0, lk = false;
    for (const sec of d.sections || []) {
      n += suSlotUnits(sec, t).units;
      if (suSlotLinked(sec, t)) { lk = true; linked++; }
    }
    units += n;
    return `${n || lk ? 'on' : ''} ${lk ? 'linked' : ''}`;
  });
  const story = [
    `${secs} placement${secs === 1 ? '' : 's'}`,
    units ? `${units} ad unit${units === 1 ? '' : 's'}` : (linked ? null : 'no demand'),
    linked ? `${linked} break${linked === 1 ? '' : 's'} follow${linked === 1 ? 's' : ''} the ${WF_WORD.toLowerCase()}` : null,
  ].filter(Boolean).join(' · ');
  // NO COUNT CHIP (7 Sep, user call): the break chips are the glimpse — the number of
  // placements is a fact the tab strip says the moment the section opens.
  return `<span class="pl-glimpse" title="${esc(story)}">${chips}</span>`;
}

// PLACEMENTS WEARS THE HEAD SECTIONS' FOLD (6 Sep, user call — one disclosure grammar
// for the whole card: Ad unit templates, Waterfall, Placements). It differs in
// one deliberate way: it is the room's work area, so it OPENS on load where the shared
// plumbing rests closed. A refused save forces it open — fail visible, never hidden.
function suPlacementsSecHtml(meta) {
  const open = SU_HEAD_OPEN.has('placements') || !!FORM.errors.sections;
  const head = suHeadRowHtml('placements', 'Placements', suPlacementsGlimpse(), open);
  if (!open) return `<div class="pl-sec closed">${head}</div>`;
  return `
    <div class="pl-sec">
      ${head}
      ${FORM.errors.sections ? `<div class="banner bad" data-err-for="sections">${esc(FORM.errors.sections)}</div>` : ''}
      ${suTabsHtml(meta)}
      ${suSecSubheadHtml()}
      ${meta.slotTypes.map(t => suSlotRowHtml(t, meta)).join('')}
    </div>`;
}

// The current placement's identity line — rename and remove live here, not on Default.
// Nothing to draw any more: the name lives in the tab, and remove is the × on it.
function suSecSubheadHtml() { return ''; }

// Typing a name repaints NOTHING — the input is the label (the caret rule).
function suSecName(el) {
  suSection().name = el.value;
  if (SU_SEC_BAD.has(suSection())) {
    SU_SEC_BAD.delete(suSection());
    el.classList.remove('err'); el.title = '';
    el.closest('.stab')?.classList.remove('err');
  }
  // The tab grows with the name without a rerender — the caret never moves.
  el.size = Math.max(6, el.value.length);
  clearErr('sections');
}

// On the way out: an empty name is Untitled again, and a clash says so rather than
// saving two placements a surface could not tell apart.
// A NAME ALREADY HERE IS REFUSED ON THE TAB (7 Sep, UAT P1): the tab goes red with the
// reason, the model keeps what was typed so nothing vanishes, and Save stops on the page
// until it is changed — a duplicate never reaches the server or the join key.
const SU_SEC_BAD = new WeakMap();
function suDuplicateSection() {
  const secs = FORM.data.sections || [];
  for (let i = 1; i < secs.length; i++) {
    const n = (secs[i].name || '').trim().toLowerCase();
    if (n && secs.slice(0, i).some(s => (s.name || '').trim().toLowerCase() === n)) return i;
  }
  return -1;
}
function suSecNameDone(el) {
  const sec = suSection();
  const name = (el.value || '').trim();
  if (!name) {
    SU_SEC_BAD.delete(sec);
    sec.name = suUntitledName();
    FORM.rerender();
    return;
  }
  sec.name = name;
  if (FORM.data.sections.some(s => s !== sec && (s.name || '').trim().toLowerCase() === name.toLowerCase())) {
    const why = `“${name}” is already here — pick another name`;
    SU_SEC_BAD.set(sec, why);
    el.classList.add('err');
    el.title = why;
    el.closest('.stab')?.classList.add('err');
    return;
  }
  SU_SEC_BAD.delete(sec);
  el.classList.remove('err'); el.title = '';
  el.closest('.stab')?.classList.remove('err');
}

// "Untitled", then "Untitled 2" — a new tab never collides with the last one.
function suUntitledName() {
  const taken = new Set(FORM.data.sections.map(s => (s.name || '').toLowerCase()));
  if (!taken.has('untitled')) return 'Untitled';
  for (let n = 2; n < 99; n++) if (!taken.has(`untitled ${n}`)) return `Untitled ${n}`;
  return 'Untitled';
}

// A new placement is a CLONE of Default's SETTINGS, never its demand (25 Aug call,
// amended 7 Sep — user: opening a slot must offer the fork upfront). Behaviour, cadence
// and pod structure carry over — starting from what already works beats fifteen empty
// fields — but every break's demand starts EMPTY, standing at the fork (`+ Add custom
// waterfall` or the waterfall's own switch): units are trafficked per placement, and
// inheriting Default's would point new inventory at units chosen for another surface.
function suBareSlots(slots) {
  const bare = g => {
    if (g.rungs) g.rungs = [];
    if (g.waterfallSource) g.waterfallSource = 'own';
    if (g.direct) g.direct = { rungs: [] };
  };
  for (const s of Object.values(slots || {})) {
    (s.groups || []).forEach(bare);
    bare(s);
  }
}

function suAddSection() {
  const max = KL_META.maxSections || 5;
  if (FORM.data.sections.length >= max) return;
  const name = suUntitledName();
  const clone = deepCopy(FORM.data.sections[0]);
  suBareSlots(clone.slots);
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
}

// A new setup restamps from a preset: every placement's behaviour, ladders untouched.
function suStampPreset(name) {
  const preset = KL_META.rulePresets.find(p => p.name === name);
  if (!preset) return;
  FORM.data.presetName = name;
  for (const sec of FORM.data.sections) {
    for (const t of KL_META.slotTypes) {
      const v = () => deepCopy(preset.values.slots[t] || {});
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
  if (!s) return { units: 0, pods: 0, parked: 0 };
  const filled = a => (a || []).filter(r => r && r.tagId).length;
  // A connected break's SERVING units are the waterfall's — Clear never counts or
  // touches those (they are cleared at the head of the page, once, for everyone). Its
  // own units are PARKED (7 Sep, user call — the switch keeps them; a break switched
  // off keeps them the same way since 8 Sep), and Clear does take those, so they are
  // counted apart and named in the confirm: nothing this page deletes goes unnamed.
  const serving = g => suSrcOf(g) === 'own';
  const own = g => (serving(g) ? filled(g.rungs) : 0);
  const park = g => (serving(g) ? 0 : filled(g.rungs));
  if (t === 'midroll') {
    const gs = s.groups || [];
    return {
      units: gs.reduce((a, g) => a + own(g) + filled(g.direct && g.direct.rungs), 0),
      pods: Math.max(0, gs.length - 1),
      parked: gs.reduce((a, g) => a + park(g), 0),
    };
  }
  return { units: own(s) + filled(s.direct && s.direct.rungs), pods: 0, parked: park(s) };
}

// Whether any of this slot's pods follows the waterfall.
function suSlotLinked(sec, t) {
  const s = (sec.slots || {})[t];
  if (!s || isRotation(t)) return false;
  return t === 'midroll' ? (s.groups || []).some(suGroupLinked) : suGroupLinked(s);
}

// Emptying a break DETACHES it too (6 Sep, user call): Clear takes the whole break back
// to nothing — the waterfall comes off it AND its parked custom units go. The gentle
// way back off the waterfall is the source switch, which keeps them (suWfUse).
function suEmptySlot(sec, t) {
  const s = (sec.slots || {})[t];
  if (!s) return;
  if (s.direct) s.direct = { rungs: [] };
  const own = g => { g.waterfallSource = 'own'; g.rungs = []; };
  if (t === 'midroll') {
    const keep = s.groups[0];
    own(keep);
    keep.direct = { rungs: [] };
    s.groups.length = 1;
  } else {
    own(s);
  }
}

function suUnitWords(units, pods) {
  const u = `${units} ad unit${units === 1 ? '' : 's'}`;
  return pods ? `${u} across ${pods + 1} pods` : u;
}

// CLEAR IS A BUILD-TIME TOOL (6 Sep, user call): it exists only while the setup has
// never gone on air. Once a version has been published, emptying breaks wholesale is
// not an act this page offers — the option is GONE, not greyed; a published setup is
// changed unit by unit, deliberately.
function suClearable() {
  return !SETUP_ORIGINAL || !(PUB?.versions || []).length;
}

// The break's own Clear, behind the row's ⋯ (6 Sep, user call — the bare "Clear" word
// floating in the gutter was a second dialect; the templates rows already put the rare
// destructive act behind a kebab at the row's right edge). Dimmed with the reason when
// there is nothing to clear; absent entirely once the setup has been published.
function suSlotClearHtml(t) {
  const sec = suSection();
  const linked = suSlotLinked(sec, t);
  const menu = inner => `<span class="rmenu" onclick="event.stopPropagation()">
    <button type="button" class="row-kebab" onclick="rmenuToggle(event, this)" aria-label="More actions">⋯</button>
    <div class="rmenu-list">${inner}</div>
  </span>`;
  // A published setup has NO menu here (7 Sep): its one door — taking the waterfall off
  // this break — is the source switch inside the row, where the two answers stand
  // together and neither costs anything. Everything else is edited unit by unit.
  if (!suClearable()) return '';
  const { units, pods, parked } = suSlotUnits(sec, t);
  const has = units || pods || linked || parked;
  return menu(`<div class="eh-item danger ${has ? '' : 'dim'}" ${has
    ? `onclick="rmenuShut(this); suClearSlot('${t}')"
       title="${esc(suSlotClearWhy(sec, t))}"`
    : ''}>Clear ${esc(label('slotType', t).toLowerCase())}</div>`);
}

// One line for the kebab's hover: exactly what Clear would take from this break.
function suSlotClearWhy(sec, t) {
  const { units, pods, parked } = suSlotUnits(sec, t);
  const linked = suSlotLinked(sec, t);
  const bits = [];
  if (units || pods) bits.push(`Removes ${suUnitWords(units, pods)}`);
  if (parked) bits.push(`${units || pods ? 'and its' : 'Removes the'} ${parked} parked custom unit${parked === 1 ? '' : 's'}`);
  if (linked) bits.push(`${bits.length ? 'and takes' : 'Takes'} the waterfall off this break`);
  return bits.join(' ') || 'Nothing to clear in this break';
}

async function suClearSlot(t) {
  if (!suClearable()) return;
  const sec = suSection();
  const { units, pods, parked } = suSlotUnits(sec, t);
  const linked = suSlotLinked(sec, t);
  if (!units && !pods && !linked && !parked) return;
  const name = label('slotType', t);
  const bits = [];
  if (linked) bits.push('It takes the waterfall off this break — the waterfall itself is untouched.');
  if (units || pods) {
    bits.push(`Removes ${suUnitWords(units, pods)}${pods
      ? `, and ${pods === 1 ? 'pod 2 goes with its cadence' : `pods 2–${pods + 1} go with their cadence`}` : ''}.`);
  }
  // The parked custom waterfall is the one thing the source switch keeps and Clear does
  // not — so it is named, counted, before anybody confirms.
  if (parked) bits.push(`Its ${parked} switched-off custom unit${parked === 1 ? '' : 's'} go too.`);
  bits.push(`The break starts empty — a custom waterfall of its own, or the waterfall${linked ? ' again' : ''}. Nothing leaves the page until you save.`);
  const ok = await ask({
    title: `Clear ${name.toLowerCase()} in “${sec.name}”?`,
    body: bits.join(' '),
    okLabel: 'Clear', danger: true,
  });
  if (!ok) return;
  suEmptySlot(sec, t);
  SU_MID_G = 0;
  SU_RUNG_OPEN = null;
  clearErr('sections');
  FORM.rerender();
}

// The whole setup at once, from the ⋯ menu: every break of every placement. The
// placements, their names and every delivery setting stand — only the demand goes.
// Build-time only, like the break's own Clear — gone once the setup has been published.
async function suClearAllSlots() {
  if (!suClearable()) return;
  const d = FORM.data;
  let units = 0, pods = 0, breaks = 0, linked = 0, parked = 0;
  for (const sec of d.sections || []) {
    for (const t of KL_META.slotTypes) {
      const c = suSlotUnits(sec, t);
      if (c.units || c.pods) breaks++;
      if (suSlotLinked(sec, t)) linked++;
      units += c.units;
      pods += c.pods;
      parked += c.parked;
    }
  }
  if (!units && !pods && !linked && !parked) return;
  const secN = (d.sections || []).length;
  const ok = await ask({
    title: 'Clear every ad unit in this setup?',
    body: `Removes ${units} ad unit${units === 1 ? '' : 's'} from ${breaks} break${breaks === 1 ? '' : 's'}`
      + `${secN > 1 ? ` across ${secN} placements (${(d.sections || []).map(s => s.name).join(', ')})` : ''}`
      + `${pods ? `, and ${pods} extra pod${pods === 1 ? '' : 's'} go with their cadence` : ''}. `
      + `${parked ? `${parked} switched-off custom unit${parked === 1 ? '' : 's'} go too. ` : ''}`
      + `${linked ? `The waterfall comes off ${linked} break${linked === 1 ? '' : 's'} — the waterfall itself is untouched. ` : ''}`
      + 'The placements and every delivery setting stay, and nothing leaves the page until you save.',
    okLabel: 'Clear all', danger: true,
  });
  if (!ok) return;
  for (const sec of d.sections || []) for (const t of KL_META.slotTypes) suEmptySlot(sec, t);
  SU_MID_G = 0;
  SU_RUNG_OPEN = null;
  clearErr('sections');
  FORM.rerender();
}

function suAnyUnits() {
  return (FORM.data.sections || []).some(sec =>
    KL_META.slotTypes.some(t => { const c = suSlotUnits(sec, t); return c.units || c.pods || c.parked || suSlotLinked(sec, t); }));
}

function suSlotGlimpse(t) {
  const gs = t === 'midroll' ? suMidGroups() : [suSlot(t)];
  // A linked break's demand is the waterfall's — counted from it, so the closed
  // row never claims emptiness the serving truth does not have (or the reverse).
  const conf = g => suSrcServed(g);
  const live = g => (suSrcOf(g) === 'own'
    ? (g.rungs || []).filter(r => r.tagId && r.on !== false).length
    : suSrcServed(g));
  const n = gs.reduce((a, g) => a + conf(g), 0);
  const on = gs.reduce((a, g) => a + live(g), 0);
  const linked = gs.some(suGroupLinked);
  const chip = linked ? '<span class="sg-shared">global</span>' : '';
  // A LINKED BREAK SHOWS THE MARK AND ITS OWN PRIMARY (7 Sep, user call — "if it is a
  // shared waterfall only show that icon, don't show the IMA › CAN › GPT too in that
  // case"; the primary joined it 8 Sep, when following the global waterfall stopped
  // replacing the first ask). The FALL it would draw is not this break's story — it is
  // the global waterfall's, told once at the head of the page where it can be changed —
  // but rung 1 is this break's own, and hiding it left a break with demand reading as a
  // break with none.
  if (linked) {
    const p = gs.map(g => (suGroupLinked(g) ? suSrcPrimary(g) : null)).find(Boolean);
    return `${chip}${p ? `<span class="glimpse-walk">${providerBadge(window.TAG_PROVIDER[p.tagId])}</span>` : ''}`;
  }
  // The same words the open row's source band uses for the same state (8 Sep) — the
  // closed line said `no demand`, which named the market rather than the break. And the
  // two empty breaks are told apart here as they are in the band: one has never been
  // filled in, the other was switched OFF and is holding everything it had.
  if (!n) {
    const off = gs.some(g => suSrcOf(g) === 'none' && suWfOwnUnits(g));
    return `${chip}<span class="sg-empty">${off ? 'switched off' : 'no ads yet'}</span>`;
  }
  if (!on) return `${chip}<span class="sg-empty">every tag off</span>`;
  // THE CLOSED ROW SHOWS THE WALK (7 Sep, UAT P2 — it was blank, while the list rows and
  // the integration page's resolved rows both name the partners). Same grammar as those:
  // four badges, `+N` for the rest, in ask order. A mid-roll's pods each answer for
  // themselves, so a multi-pod break says which pod the walk belongs to.
  const gi = gs.findIndex(g => live(g));
  const g = gs[gi < 0 ? 0 : gi];
  const rungs = suGroupLinked(g) ? suWfServed()
    : suSrcOf(g) === 'none' ? []
    : (g.rungs || []).filter(r => r.tagId && r.on !== false);
  const shown = rungs.slice(0, 4);
  const badges = shown.map(r => providerBadge(window.TAG_PROVIDER[r.tagId])).join('<i class="gsep">›</i>')
    + (rungs.length > shown.length ? `<span class="sg-dim"> +${rungs.length - shown.length}</span>` : '');
  const pod = gs.length > 1 ? `<span class="sg-dim">pod ${(gi < 0 ? 0 : gi) + 1}</span>` : '';
  return `${chip}${pod}<span class="glimpse-walk">${badges}</span>`;
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
  const clone = deepCopy(gs[SU_MID_G] || gs[0]);
  clone.rungs = [];
  clone.direct = { rungs: [] };
  gs.push(clone);
  SU_MID_G = gs.length - 1;
  SU_SLOT_OPEN.add('midroll');
  clearErr('sections');
  FORM.rerender();
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

// The pod strip wears the PLACEMENTS strip's exact grammar (6 Sep, user call — the
// "Pods" eyebrow, the smaller tabs and the right-edge Remove link were a second dialect
// for the same idea): full-size tabs, `+ Add pod` beside the last one, and remove is
// the × on the tab you are standing on — behind its confirm, never on pod 1 alone.
// A POD THAT WOULD GO DARK SAYS SO ON ITS TAB (7 Sep, UAT P1). The seam refuses a save
// that leaves a live mid-roll with an empty pod; the editor now says the same thing where
// the pod is, the moment it is empty — and Save stops on the page rather than at the
// server, with the placements open and the pod selected (fail visible).
function suPodDarkWhy(sec, gi) {
  if (!SETUP_ORIGINAL || !SETUP_ORIGINAL.usedByLive || !sec || sec._orig < 0) return '';
  const lc = SETUP_ORIGINAL.liveCounts?.[SETUP_ORIGINAL.sections[sec._orig]?.name];
  if (!lc || !lc.midroll?.on) return '';
  const g = ((sec.slots || {}).midroll?.groups || [])[gi];
  if (!g || suGroupLinked(g)) return '';
  const filled = a => (a || []).filter(r => r && r.tagId).length;
  // A pod SWITCHED OFF is dark too (8 Sep): it keeps its units, but it serves none of
  // them, so a live mid-roll standing on it would go dark exactly as an empty pod does.
  if (suSrcOf(g) !== 'none' && (filled(g.rungs) || filled(g.direct && g.direct.rungs))) return '';
  if (suSrcOf(g) === 'none' && filled(g.direct && g.direct.rungs)) return '';
  const live = SETUP_ORIGINAL.usedByLive || 0;
  const who = live > 1
    ? `${live} integrations play this mid-roll live`
    : `${SETUP_ORIGINAL.usedByNames[0] || 'the integration it fills'} plays this mid-roll live`;
  return `Pod ${gi + 1} is empty — ${who}, so every pod needs an ad unit`;
}
function suDarkPods() {
  const out = [];
  (FORM.data.sections || []).forEach((sec, si) => {
    (((sec.slots || {}).midroll?.groups) || []).forEach((_, gi) => {
      const why = suPodDarkWhy(sec, gi);
      if (why) out.push({ si, gi, why: `${why.replace('Pod ' + (gi + 1), `Pod ${gi + 1} in “${sec.name}”`)}` });
    });
  });
  return out;
}
function suMidTabsHtml() {
  const gs = suMidGroups();
  const max = KL_META.maxMidrollGroups || 3;
  const sec = suSection();
  const tab = (g, gi) => {
    const dark = suPodDarkWhy(sec, gi);
    const errCls = dark ? ' err' : '';
    const errTitle = dark ? `title="${esc(dark)}"` : '';
    // The tab you are standing on carries the remove, like a placement's — only when
    // there is another pod to stand on.
    if (SU_MID_G === gi && gs.length > 1) {
      return `
      <span class="stab on pl-live${errCls}" ${errTitle}>Pod ${gi + 1}
        <button type="button" class="pl-x" onclick="suRemoveMidGroup()"
          title="Its deal and ladder go too">×</button>
      </span>`;
    }
    return `
      <button type="button" class="stab ${SU_MID_G === gi ? 'on' : ''}${errCls}" ${errTitle}
        onclick="suMidGroupSet(${gi})">Pod ${gi + 1}</button>`;
  };
  return `
    <div class="scope-tabs pl-tabs pod-tabs">
      ${gs.map(tab).join('')}
      ${gs.length < max
        ? `<button type="button" class="stab add" onclick="suAddMidGroup()">+ Add pod</button>` : ''}
    </div>`;
}
