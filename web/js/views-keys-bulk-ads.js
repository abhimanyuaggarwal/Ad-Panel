// views-keys-bulk-ads.js — the AD BEHAVIOUR bulk sheet over a selection of integrations:
// one tab per break, each lever a clean slate (closed → open/unset → queued), a pending
// card per break, then THE CHANGE REVIEW, then the writes (slotOn / slotOff /
// driveFields through bulkApplyDirect). The two player sheets are in
// views-keys-bulk-player.js. Uses the list file's selection (KSEL / selectedKeys) and
// write helpers at runtime.

let BULK_DRAFT = null; // { tab, slots:{} } — the AD BEHAVIOUR sheet's queue, breaks only
let UNIT_DRAFT = null;

// WHO AN APPLY LANDS ON, SAID BESIDE THE BUTTON THAT DOES IT (15 Sep, user call — *"in both
// bulk edit player behaviour and ad behaviour there should be a text max of 4-5 words conveying
// that this will change across all the integrations selected... near the button at the bottom"*).
// WHO THIS SHEET WRITES TO — the one statement of the audience on either sheet, and since 15 Sep
// the ONLY one (the player sheet's title kicker, `Sets the default player on all 3 selected
// integrations`, went with the user's call: the sentence was a byline in a title, read once on
// the way in, at the far end of the screen from the button it qualifies).
//   It stands in the FOOT, at the button's shoulder, because that is the moment a cohort write
// stops being an idea — and it stands in body ink with the count in the page's own weight, not as
// the grey footnote it was. `all N integrations`, not `all N selected`: `selected` names where
// they came from, which is not the question at the button; what a person is about to do is write
// to N integrations.
//   IT NAMES WHAT IS BEING WRITTEN, not just who to (16 Sep, user call). `Applies to all 2
// integrations` left the other half of the sentence to the title, and a title is at the far end
// of the dialog from the button this line stands beside. Each sheet passes its own subject —
// `ad behaviour`, `player behaviour` — so the line is the whole act in one place: what changes,
// and on how many.
//   Counted off the journey's OWN audience (`selectedKeys`, which the review's second step can
// move), so it can never say a number the apply will not write to. Shared by both sheets — one
// sentence, one place.
function bulkAppliesNote(subject) {
  const n = selectedKeys().length;
  return `Changes will be applied to the ${esc(subject)} of ${n === 1
    ? '<b>1 integration</b>' : `all <b>${n} integrations</b>`}`;
}

// The Player tab is GONE from this sheet (2 Sep, user call): player behaviour is a
// sibling act on the bulk bar with its own sheet (playerBehaviourJourney below),
// where every selected integration's configs are read and edited together.

function slotCohortStats(t) {
  const st = { sections: 0, on: 0, withDemand: 0 };
  for (const k of selectedKeys()) {
    for (const sec of k.sections) {
      st.sections++;
      if (sec.slots[t].on) st.on++;
      if (sec.slots[t].hasDemand) st.withDemand++;
    }
  }
  return st;
}

async function bulkEditJourney() {
  if (!KSEL.size) return;
  // The journey takes its own copy of WHO (see `bulkWhoOpen`): the review's second step can drop
  // a surface from this act or add one that was never ticked on the list, and the list itself is
  // left exactly as it was.
  bulkWhoOpen();
  BULK_DRAFT = { tab: 'preroll', slots: {} };
  UNIT_DRAFT = slotDraft('preroll');
  renderUnitScreen();
}

function slotDraft(t) {
  if (!BULK_DRAFT.slots[t]) {
    const d = {
      slot: t, st: slotCohortStats(t),
      runs: null, runs0: null,
      // The drive change list: nothing lands until a row is ticked; setting a value
      // ticks it. A cohort has no single current value, so rows start blank.
      dv: {},
      dTouched: new Set(),
      // Levers the person has OPENED but not yet set — a control only exists once its
      // lever is chosen, so nothing on the sheet ever looks pre-decided (3 Sep).
      open: new Set(),
    };
    d.runs = d.runs0 = d.st.on === d.st.sections ? 'on' : d.st.on === 0 ? 'off' : null;
    BULK_DRAFT.slots[t] = d;
  }
  return BULK_DRAFT.slots[t];
}

function bulkTab(t) {
  BULK_DRAFT.tab = t;
  UNIT_DRAFT = slotDraft(t);
  renderUnitScreen();
}

// The positions box keeps its own text while typing — the caret rule, cohort side.
const BULK_TEXT = {};

function bulkCueInput(el, t) {
  BULK_TEXT.cuepoints = el.value;
  const cps = parseCuepointsText(el.value).filter(x => typeof x === 'number');
  const d = slotDraft(t);
  if (!el.value.trim() || !cps.length) {
    d.dTouched.delete('cuepoints');
    delete d.dv.cuepoints;
  } else {
    d.dTouched.add('cuepoints');
    d.dv.cuepoints = cps;
  }
  bulkSyncFoot();
}

function bulkCueBlur(t) {
  delete BULK_TEXT.cuepoints;
  if (BULK_DRAFT) bulkTab(t); // a blur can land after Cancel closed the sheet
}

function bulkDriveSet(t, f, v) {
  const d = slotDraft(t);
  d.dv[f] = v;
  d.dTouched.add(f);
  renderUnitScreen();
}

// The bulk sheet: one tab per unit, plus the player. Apply covers every tab at once,
// so a tab with queued changes wears a dot.
// THE TITLE IS THE DOOR YOU CAME THROUGH (15 Sep, user call — the player sheet's audience
// sentence removed, *"same goes for ad behaviour as well"*). This one read `Edit 3 integrations`
// over a byline of two names and `+1 more`: a count the foot states beside the act, and a name
// list the 15 Sep call had already taken off the sibling sheet (*"remove the names of the
// selected Integrations"*) — every name is on the review's own column one screen on. Both sheets
// are titled for what they are now, in the bulk bar's own two words: `Ad behaviour` and
// `Player behaviour`.
function renderUnitScreen() {
  const d = BULK_DRAFT;
  const tabs = [
    ...KL_META.slotTypes.map(t => {
      const dr = slotDraft(t);
      // The toggle shows the QUEUED state when one is queued, the cohort's truth
      // otherwise (any surface on = on, the editor's own binary).
      const shown = dr.runs ?? (dr.st.on > 0 ? 'on' : 'off');
      return {
        v: t, label: label('slotType', t),
        runs: shown, queued: dr.runs !== dr.runs0,
        dirty: !!(d.slots[t] && slotDirtyD(d.slots[t])),
      };
    }),
  ];
  dialogRoot().innerHTML = `
    <div class="dlg-veil"><div class="dlg bulk steady">
      <h3>Ad behaviour</h3>
      <div class="btabs">
        ${tabs.map(x => `<button type="button" class="btab wswitch ${d.tab === x.v ? 'on' : ''} ${x.runs !== undefined && x.runs !== 'on' ? 'off' : ''}"
          onclick="bulkTab('${x.v}')">${esc(x.label)}${x.runs !== undefined ? `
          <span class="toggle mini ${x.runs === 'on' ? 'on' : ''} ${d.tab === x.v ? '' : 'dead'}"
            ${d.tab === x.v ? `onclick="event.stopPropagation(); bulkTabRuns('${x.v}')"` : ''}
            ${d.tab !== x.v ? 'title="Open this tab first — then switch it"' : ''}><span class="track"></span></span>` : ''}${x.dirty ? '<i class="bdot"></i>' : ''}</button>`).join('')}
      </div>
      <div class="dlg-body">
        ${slotTabHtml(d.tab)}
      </div>
      <div class="dlg-foot">
        <span class="bulk-applies">${bulkAppliesNote('ad behaviour')}</span>
        <button class="btn ghost" onclick="cancelUnitScreen()">Cancel</button>
        <button class="btn" id="bulk-next" ${anyBulkDirty() ? '' : 'disabled'}
          onclick="reviewBulk()">${(() => { const n = bulkQueuedRows().length;
            return n ? `Review ${n} change${n === 1 ? '' : 's'}` : 'Review changes'; })()}</button>
      </div>
    </div></div>`;
}

// Closing the SHEET is not ending the journey: `applyBulk` closes it and then writes, and the
// writes go to the journey's own audience. So the audience is dropped at the two real endings —
// Cancel, and the far side of an apply — never here.
function closeUnitScreen() {
  BULK_DRAFT = null;
  UNIT_DRAFT = null;
  closeDialog();
}

function cancelUnitScreen() {
  bulkWhoClose();
  closeUnitScreen();
}

// A BREAK'S COHORT FACTS ARE CACHED (`d.st`), because the sheet reads them on every keystroke —
// so when the audience moves under them on the review, they are recounted. `runs0` is counted
// with them: a switch queued against the old truth is still the person's decision, but one that
// now matches what every selected surface already does has nothing left to do and drops itself.
function bulkRecount() {
  if (!BULK_DRAFT) return;
  for (const t of KL_META.slotTypes) {
    const d = BULK_DRAFT.slots[t];
    if (!d) continue;
    const untouched = d.runs === d.runs0;
    d.st = slotCohortStats(t);
    d.runs0 = d.st.sections && d.st.on === d.st.sections ? 'on' : d.st.on === 0 ? 'off' : null;
    if (untouched) d.runs = d.runs0;
  }
}

function bulkSyncFoot() {
  const b = document.getElementById('bulk-next');
  if (!b) return;
  const n = bulkQueuedRows().length;
  b.disabled = !anyBulkDirty();
  b.textContent = n ? `Review ${n} change${n === 1 ? '' : 's'}` : 'Review changes';
}

function slotDirtyD(d) {
  return d.runs !== d.runs0 || d.dTouched.size > 0;
}

function anyBulkDirty() {
  return Object.values(BULK_DRAFT.slots).some(slotDirtyD);
}

function touchedSlots() {
  return KL_META.slotTypes.filter(t => BULK_DRAFT.slots[t] && slotDirtyD(BULK_DRAFT.slots[t]));
}

// The tab switch queues the opposite of what it shows — Review is where it lands.
function bulkTabRuns(t) {
  const dr = slotDraft(t);
  const shown = dr.runs ?? (dr.st.on > 0 ? 'on' : 'off');
  const want = shown === 'on' ? 'off' : 'on';
  dr.runs = want === dr.runs0 ? dr.runs0 : want;
  renderUnitScreen();
}

// ONE GENERIC WATERFALL LADDER for a cohort — every company, since each integration
// resolves the decision against its own setup and a miss is refused or falls back, named.
// A cohort spans many setups, so the ladder here is the whole vocabulary rather than what
// one break carries, and the depth seg has no counted denominator beside it: five
// integrations hold five different numbers of IMA sources, and printing one of them would
// be the page's one invented figure. The cap still means the same thing in all of them —
// "at most this many of that partner" — which is exactly why a per-partner cap travels
// across a cohort where the flat one could not.
function bulkWfLadderHtml(t) {
  const d = slotDraft(t);
  const cur = d.dTouched.has('ask') ? d.dv.ask : uniformDrive(t, 'ask');
  const on = Array.isArray(cur) && cur.length ? cur : [...window.KL_PROVIDERS];
  const off = window.KL_PROVIDERS.filter(p => !on.includes(p));
  const depth = (d.dTouched.has('depth') ? d.dv.depth : uniformDrive(t, 'depth')) || {};
  const dragKey = `bask-${t}`;
  registerDrag(dragKey, (from, to) => {
    const order = [...on];
    order.splice(to, 0, order.splice(from, 1)[0]);
    bulkDriveSet(t, 'ask', order);
  });
  const row = (p, i, isOn) => {
    const last = isOn && on.length === 1;
    const canDrag = isOn && on.length > 1;
    return `
      <div class="wfd-r ${isOn ? 'on' : 'skip'}" ${canDrag ? dragAttrs(dragKey, i) : ''}>
        <span class="wfd-grip">${canDrag ? '⠿' : ''}</span>
        <b class="wfd-n">${isOn ? i + 1 : '–'}</b>
        <span class="wfd-p">${providerBadge(p)}</span>
        <span class="toggle tiny ${isOn ? 'on' : ''} ${last ? 'held' : ''}"
          ${last ? ' title="The only partner left on — a break that asks nobody would go dark"' : ''}
          onclick="${last ? `toast('One partner must stay on', 'warn')` : `bulkAskToggle('${t}', '${p}')`}"><span class="track"></span></span>
        <span class="wfd-d">${accSeg(depth[p] ?? 'all', [1, 2, 3, 'all'], ['1', '2', '3', 'All'],
          o => `bulkDepthSet('${t}', '${p}', ${o === 'all' ? "'all'" : o})`,
          isOn ? '' : `${provWord(p)} is switched off — these breaks do not ask it`)}</span>
      </div>`;
  };
  // The ceiling over the whole fall is its own lever (`Waterfall depth`, below) — not a line
  // inside this one. Mingled, it read as a fourth partner with a strange name.
  return `<div class="wfd">
    ${on.map((p, i) => row(p, i, true)).join('')}
    ${off.map(p => row(p, -1, false)).join('')}
  </div>`;
}

// The caps queue as their own field (`depth`) but have no row of their own: they ride the
// Waterfall lever, exactly as `deferSec` rides `Start offset`. So `ask` is written
// alongside — the order the caps were read against is part of the decision, and a cohort
// write that sent caps without it would land them on five different arrangements.
function bulkDepthSet(t, p, n) {
  const d = slotDraft(t);
  const cur = d.dTouched.has('depth') ? d.dv.depth : uniformDrive(t, 'depth');
  const depth = { ...(cur || {}) };
  if (n === 'all' || !n) delete depth[p]; else depth[p] = n;
  if (!d.dTouched.has('ask')) {
    const ask = uniformDrive(t, 'ask');
    bulkDriveSet(t, 'ask', Array.isArray(ask) && ask.length ? ask : [...window.KL_PROVIDERS]);
  }
  bulkDriveSet(t, 'depth', Object.keys(depth).length ? depth : 'setup');
}

function bulkAskToggle(t, p) {
  const d = slotDraft(t);
  const cur = d.dTouched.has('ask') ? d.dv.ask : uniformDrive(t, 'ask');
  const on = Array.isArray(cur) && cur.length ? [...cur] : [...window.KL_PROVIDERS];
  if (on.includes(p)) {
    if (on.length === 1) { toast('One partner must stay on', 'warn'); return; }
    // A cap for a partner nobody asks is a number with nothing to count.
    const depth = { ...((d.dTouched.has('depth') ? d.dv.depth : uniformDrive(t, 'depth')) || {}) };
    if (depth[p]) {
      delete depth[p];
      bulkDriveSet(t, 'depth', Object.keys(depth).length ? depth : 'setup');
    }
    bulkDriveSet(t, 'ask', on.filter(x => x !== p));
  } else {
    bulkDriveSet(t, 'ask', [...on, p]);
  }
}

// A drive value in the plan's own words.
function driveWord(f, v) {
  if (f === 'direct') return v === false ? 'off' : 'on';
  if (f === 'ask') {
    if (!Array.isArray(v) || !v.length) return 'as set up';
    return v.map(provWord).join(' › ');
  }
  if (f === 'cuepoints') {
    if (!Array.isArray(v) || !v.length) return 'as set up';
    return v.map(fmtCue).join(', ');
  }
  if (f === 'headerBidding') return v === undefined || v === null || v === 'setup' ? 'as set up' : label('headerBidding', v);
  if (f === 'depth') {
    if (!v || v === 'setup' || !Object.keys(v).length) return 'as set up';
    return Object.entries(v).map(([p, n]) => `${provWord(p)} ${n}`).join(', ');
  }
  if (f === 'tries') return !v || v === 'setup' ? 'full waterfall' : String(v);
  if (f === 'start') return v === 'deferred' ? 'delayed' : 'immediate';
  if (f === 'deferSec') return `${v}s`;
  return String(v);
}

// One value the whole cohort already agrees on, or undefined when they differ — a
// control is never prefilled with one integration's answer as if it spoke for all.
function uniformDrive(t, f) {
  let first, seen = false;
  for (const k of selectedKeys()) {
    let v = k.drive?.[t]?.[f];
    if (f === 'direct') v = v !== false;      // absence = on
    if (f === 'tries' && v === undefined) v = 'setup';
    if (!seen) { first = v; seen = true; }
    else if (JSON.stringify(v) !== JSON.stringify(first)) return undefined;
  }
  return first;
}

// THE FIELDS A BREAK OFFERS (2 Sep re-cut): one definition each, so the control that
// changes a field, the word its queued value reads as, and its place in the list all
// come from a single line rather than three that can drift apart.
function bulkFieldDefs(t) {
  const d = slotDraft(t);
  // Clean slate: an untouched lever's control holds NOTHING — the cohort's current
  // state is the today-word beside it, never a preselected answer.
  const dv = f => (d.dTouched.has(f) ? d.dv[f] : undefined);
  // WHO ELSE BIDS (11 Sep, user call) — the one lever every break carries, the out-stream
  // included. `As set up` is the clear, sent as the drive's own `setup` word; `Custom`
  // reveals the partners, in the same two tiers both rooms draw it in.
  const partners = hbPartners();
  const hbDef = {
    f: 'headerBidding', label: fieldName('headerBidding'),
    ctl: () => {
      const v = dv('headerBidding');
      const mode = v === undefined ? undefined : v === 'setup' ? 'setup' : v === 'off' ? 'off' : 'custom';
      return `
        <div class="hb-ctl">
          <div class="hb-l1">${accSeg(mode, ['setup', 'off', 'custom'], ['As set up', 'Off', 'Custom'],
            o => `bulkDriveSet('${t}', 'headerBidding', ${o === 'setup' ? "'setup'" : o === 'off' ? "'off'" : `'${partners[0]}'`})`)}</div>
          ${mode === 'custom' ? accSeg(v, partners, partners.map(p => label('headerBidding', p)),
            o => `bulkDriveSet('${t}', 'headerBidding', '${o}')`) : ''}
        </div>`;
    },
  };
  if (isRotation(t)) return [hbDef];
  const defs = [
    // THE FALL, PARTNER BY PARTNER (16 Sep, user call) — and the sheet's FIRST lever, because
    // Special is the exception and this is the rule. It carries the ORDER and the per-partner
    // caps; `Waterfall depth` under it is the ceiling over the whole walk, a separate lever
    // because the two were confusing drawn as one (third cut, same day). `also` names the
    // field this lever writes alongside its own, so the row opens, queues and clears as ONE
    // thing — the pattern `start`/`deferSec` already uses.
    { f: 'ask', label: 'Waterfall', also: ['depth'], ctl: () => bulkWfLadderHtml(t) },
    {
      f: 'tries', label: 'Waterfall depth',
      ctl: () => accSeg(d.dTouched.has('tries') ? (d.dv.tries ?? 'setup') : undefined, [1, 2, 3, 'setup'], ['1', '2', '3', 'All'],
        o => `bulkDriveSet('${t}', 'tries', ${o === 'setup' ? "'setup'" : o})`),
    },
    {
      f: 'direct', label: label('slotType', 'direct'),
      ctl: () => {
        // On/Off as an explicit pair: a toggle has to stand somewhere, and where it
        // stood read as the value. Unset until picked.
        const cur = d.dTouched.has('direct') ? (d.dv.direct === false ? 'off' : 'on') : undefined;
        const withDeals = selectedKeys().filter(k => k.sections.some(s2 => s2.slots[t]?.direct?.rungCount)).length;
        return `${accSeg(cur, ['on', 'off'], ['On', 'Off'],
          o => `bulkDriveSet('${t}', 'direct', ${o === 'on' ? 'true' : 'false'})`)}
          ${withDeals < selectedKeys().length
            ? `<span class="st-chip">${selectedKeys().length - withDeals} without deals</span>` : ''}`;
      },
    },
  ];
  if (t === 'preroll') {
    defs.push({
      f: 'start', label: 'Start offset',
      ctl: () => `${accSeg(dv('start'), ['start', 'deferred'], ['Immediate', 'Delayed'],
        o => `bulkDriveSet('${t}', 'start', '${o}')`)}
        <div class="num-wrap sm${dv('start') === 'deferred' ? '' : ' off'}">
          <input value="${esc(d.dTouched.has('deferSec') ? d.dv.deferSec : '')}" placeholder="7" inputmode="numeric" ${dv('start') === 'deferred' ? '' : 'disabled'}
            oninput="bulkDriveSet('${t}', 'deferSec', Number(this.value))"><span class="unit">sec</span></div>`,
    });
  }
  if (t === 'midroll') {
    defs.push({
      f: 'cuepoints', label: 'Cue points',
      ctl: () => {
        const v = d.dTouched.has('cuepoints') ? d.dv.cuepoints : undefined;
        const text = BULK_TEXT.cuepoints ?? (Array.isArray(v) ? v.map(fmtCue).join(', ') : '');
        return `<div class="cue-in${v ? ' set' : ''}"><input type="text" value="${esc(text)}"
          placeholder="${esc(bulkTodayWord(t, 'cuepoints'))}"
          oninput="bulkCueInput(this, '${t}')" onblur="bulkCueBlur('${t}')"></div>`;
      },
    });
  }
  defs.push({
    f: 'podAds', label: fieldName('podAds'),
    ctl: () => accSeg(dv('podAds'), [1, 2, 3], ['1', '2', '3'], o => `bulkDriveSet('${t}', 'podAds', ${o})`),
  });
  defs.push(hbDef);
  void dv;
  return defs;
}

// ---------- ONE FIXED LIST, CHANGE-STATE IN PLACE (3 Sep, fifth cut, user call) ----------
// Every prior shape split the fields in two — changed above, unchanged below — and a
// touched field TELEPORTED between the halves, breaking the panel's oldest rule:
// nothing moves under the cursor. With the right panel gone there is room for the
// integration page's own delivery-panel anatomy instead: one fixed list, every control
// drawn and live (five fields never needed disclosure), and a changed row saying so IN
// PLACE — accent bar, a quiet "was …", an × that puts it back. The queue is a per-row
// STATE now, not a place; Review still reads the same counted list.

// Every queued change, in the plan's own words. A break's switch is its own row: it is
// the change that decides whether the others matter at all.
function bulkQueuedRows() {
  const rows = [];
  for (const t of KL_META.slotTypes) {
    const d = BULK_DRAFT.slots[t];
    if (!d) continue;
    if (d.runs !== d.runs0 && d.runs) {
      rows.push({ t, f: 'runs', where: label('slotType', t), label: 'Runs', to: d.runs === 'on' ? 'on, every section with demand' : 'off everywhere' });
    }
    const defs = bulkFieldDefs(t);
    for (const f of d.dTouched) {
      if (f === 'deferSec' && d.dTouched.has('start')) continue; // reads on its own switch
      const def = defs.find(x => x.f === f);
      let to = driveWord(f, d.dv[f]);
      if (f === 'start' && d.dv.start === 'deferred') {
        to = `delayed ${d.dTouched.has('deferSec') ? d.dv.deferSec : (uniformDrive(t, 'deferSec') ?? 7)}s`;
      }
      rows.push({ t, f, where: label('slotType', t), label: def ? def.label : fieldName(f), to });
    }
  }
  return rows;
}

// ---------- TWO CARDS (3 Sep, sixth cut, user call — "changes as cards") ----------
// The enterprise shape, finally: the FORM on the left, and beside it a live PENDING
// CHANGES card in the review screen's own bounded-card anatomy — so step 1's card IS
// step 2, growing as you work. The left rows stay a fixed list (controls always live,
// nothing teleports); a changed row keeps only the accent bar, and everything ABOUT the
// change — was, becomes, the × that drops it — lives on the card, grouped by break,
// every break at once. A card row navigates to its break; Clear all empties the lot.

// One form row: label · the live control · (when the cohort disagrees) today's spread.
// A CLEAN SLATE, NOT A FORM OF ANSWERS (3 Sep, user call). The old sheet drew every
// control live with a value already standing in it — a Waterfall depth reading "Full"
// before anyone touched it read as a decision, when it was only a default. Now a lever
// at rest is a LABEL and the cohort's counted today-word; the control appears when the
// lever is chosen, UNSET, and the row only queues once a value is actually picked.
// Three states, in one grammar: closed (label · today, the door on hover) → open (control,
// nothing selected, × closes) → queued (the accent bar, as before — × drops the change).
//
// AN UNANSWERED FIELD LOOKS THE SAME ON BOTH BULK SHEETS (15 Sep, user call — *"the set cta is
// there in ad behaviour while not set yet label in the player behaviour, make it uniform; maybe
// the set cta shows on hover"*). It used to say two different things depending on which sheet
// you opened it from: a standing bordered `Set` chip here, a `Not set yet` caption there. The
// house had already settled this the same morning on the config sheet — *"remove this Not set
// yet"* — and the rule it left is the one both sheets follow now: AN EMPTY CONTROL IS THE
// STATE, a row with no answer in it is not mistakable for one that has an answer, and words
// describing it are a caption on something already legible. So the caption is gone from the
// player sheet, and `Set` goes back to being what it is — the DOOR, not a report. It is the
// closed row's alone (the player sheet has no closed row; picking a setting opens it), and it
// surfaces under the cursor, where the act is about to happen.
//   This reopens 7 Sep UAT P2 by the user's own call. What answers it now is not the chip but
// the row: it takes the pointer cursor, lights on hover, and — where the cohort has one — prints
// the value it holds today, so a resting sheet reads as six live questions rather than six grey
// facts.
function bulkFieldRowHtml(t, def, shownOff) {
  const d = slotDraft(t);
  const queued = defFields(def).some(f => d.dTouched.has(f));
  const open = queued || d.open.has(def.f);
  const today = bulkRowTodayWord(t, def.f);
  if (!open) {
    return `
    <div class="bqf-r closed ${shownOff ? 'off-dim' : ''}" onclick="bulkOpenField('${t}', '${def.f}')"${def.why ? ` title="${esc(def.why)}"` : ''}>
      <span class="bqf-l">${esc(def.label)}</span>
      <span class="bqf-today">${esc(today)}</span>
      <span class="bqf-set">Set</span>
    </div>`;
  }
  return `
    <div class="bqf-r open ${queued ? 'queued' : 'unset'} ${shownOff && !queued ? 'off-dim' : ''}"${def.why ? ` title="${esc(def.why)}"` : ''}>
      <span class="bqf-l">${esc(def.label)}</span>
      <span class="bqf-c form">${def.ctl()}</span>
      <span class="bqf-s">${queued || !today ? '' : `<span class="bqf-today">${esc(today)}</span>`}
        <button type="button" class="bqs-x on" onclick="bulkUnsetField('${t}', '${def.f}')">×</button></span>
    </div>`;
}

// Every field a lever writes: its own, plus companions with no row of their own
// (`Start offset` carries the seconds; `Waterfall` carries the per-partner caps). One
// lever is one row, one queue state and one ×, however many fields it lands on.
function defFields(def) { return [def.f, ...(def.also || [])]; }

function bulkOpenField(t, f) {
  slotDraft(t).open.add(f);
  renderUnitScreen();
}

// Close a lever: an unset one just folds; a set one drops its change too.
function bulkUnsetField(t, f) {
  const d = slotDraft(t);
  d.open.delete(f);
  for (const g of bulkLeverFields(t, f)) { d.dTouched.delete(g); delete d.dv[g]; }
  if (f === 'cuepoints') delete BULK_TEXT.cuepoints;
  renderUnitScreen();
}

// The fields one lever owns, looked up from its own definition — so a companion is named
// in exactly one place (`bulkFieldDefs`) and never again here.
function bulkLeverFields(t, f) {
  if (f === 'start') return ['start', 'deferSec'];
  const def = bulkFieldDefs(t).find(x => x.f === f);
  return def ? defFields(def) : [f];
}

function bulkFieldsHtml(t, shownOff) {
  if (isRotation(t)) {
    // A rotation has no WALK to bulk-edit — no pod, no order, no depth — so the tab says
    // what it can do rather than leaving the frame to explain itself. Since 11 Sep it has
    // one lever of its own: who else bids for the banner slot.
    return `<div class="bt-note">Banners take turns — the switch above, and who bids below,
      are the bulk decisions here. Schedule, display duration and impressions are set in
      each ad setup.</div>
      ${bulkFieldDefs(t).map(def => bulkFieldRowHtml(t, def, shownOff)).join('')}`;
  }
  return bulkFieldDefs(t).map(def => bulkFieldRowHtml(t, def, shownOff)).join('');
}

// THIS BREAK'S QUEUE, in the card every bulk sheet now shares (`changesCardHtml`, 14 Sep).
// Tab-scoped: the other tabs' dots already say where else changes wait, and cross-break
// reading is Review's job.
// THE ANSWER, NOT A TRANSITION (15 Sep, user call): a cohort has no single prior value, so the
// card names the field and what this sheet will write on it. What they hold today stands on the
// field's own row a hand's width to the left, and the review counts it before anything lands —
// so no `from` is passed here. See `changesCardHtml`.
function bulkPendingCardHtml(t) {
  const rows = bulkQueuedRows().filter(r => r.t === t);
  return changesCardHtml(rows.map(r => ({
    label: r.label,
    to: r.to,
    drop: `bulkDropField('${r.t}', '${r.f}')`,
  })), { clear: `bulkClearTab('${t}')`, empty: 'No changes on this break' });
}

// Clearing this break: its queued fields follow whatever each surface holds again.
function bulkClearTab(t) {
  const d = slotDraft(t);
  d.dv = {};
  d.dTouched = new Set();
  d.open = new Set();
  d.runs = d.runs0;
  renderUnitScreen();
}

// Dropping one change: that field goes back to following whatever each surface holds.
function bulkDropField(t, f) {
  if (f === 'runs') {
    const d = slotDraft(t);
    d.runs = d.runs0;
  } else {
    const d = slotDraft(t);
    d.open.delete(f);
    for (const g of bulkLeverFields(t, f)) { d.dTouched.delete(g); delete d.dv[g]; }
  }
  renderUnitScreen();
}

// The all-tabs "Clear all" went with the sheet-wide card (2 Sep review): a tab clears
// its own queue, and a single change is dropped by its ×. Cancel still drops the lot.

// One surface's answer for one field, in words.
function bulkKeyWord(k, t, f) {
  const d = k.drive?.[t] || {};
  if (f === 'direct') return driveWord('direct', d.direct !== false);
  // No decision on this surface = it follows its ad setup (tries and ask say so via
  // their own vocabularies; start and podAds have no absent word of their own).
  if (d[f] === undefined && !['tries', 'ask', 'depth', 'headerBidding'].includes(f)) return 'as set up';
  // ONE LEVER, ONE RESTING WORD (16 Sep): the Waterfall row writes the order and the caps,
  // so its today-word has to answer for both — a surface carrying `IMA 2` under no order
  // decision at all would otherwise rest on "as set up" while holding a cap.
  if (f === 'ask') {
    const order = driveWord('ask', d.ask);
    const caps = driveWord('depth', d.depth);
    if (caps === 'as set up') return order;
    return order === 'as set up' ? caps : `${order} · ${caps}`;
  }
  if (f === 'start') {
    return d.start === 'deferred' ? `delayed ${d.deferSec ?? 7}s` : driveWord('start', d.start);
  }
  return driveWord(f, d[f]);
}

// What the cohort answers for one field TODAY, in words. When they agree it is the one
// value; when they do not, it is THE VALUES THEMSELVES ("Muted · Unmuted") — the old
// "mixed today" chip named the situation instead of answering the question, and a chip
// repeated on every second row is noise, not information. Past three distinct answers
// the list stops being readable and the count takes over.
// WHAT A ROW SHOWS AT REST (14 Sep, user call — *"don't show the values as set up ... that
// are not needed"*). "as set up" is the ABSENCE of an answer on this surface, not an answer,
// and five rows of it down one column is a phrase repeating "nothing here". So a row prints
// a value only when the cohort HAS one; a mixed spread still names it, because there some
// surfaces really have dissented and some have not. The queue card is unchanged — there it
// is the from-side of a change, and the answer to "what is this replacing".
function bulkRowTodayWord(t, f) {
  const w = bulkTodayWord(t, f);
  return w === 'as set up' ? '' : w;
}

function bulkTodayWord(t, f) {
  if (f === 'runs') {
    const st = slotDraft(t).st;
    if (st.on === st.sections) return 'on everywhere';
    return st.on === 0 ? 'off everywhere' : `on for ${st.on} of ${st.sections}`;
  }
  const words = [];
  for (const k of selectedKeys()) {
    const w = bulkKeyWord(k, t, f);
    if (!words.includes(w)) words.push(w);
  }
  if (words.length === 1) return words[0];
  if (words.length <= 3) return words.join(' · ');
  return `${words.length} different values`;
}

// The per-break "Reset to setup" is gone with the old row grid (2 Sep): a queued change
// is dropped by its own × in the queue card, and Clear all drops the lot.

// THE RHS IS THE SELECTION (1 Sep, user call — the sheet takes the editor's own
// anatomy): one line per selected integration, TODAY's truth for this break — the walk
// it runs now, dim when off, counted suffixes for what one line cannot hold (sections,
// groups). What a queued decision DOES to each surface is the Review step's job — the
// sheet never previews thirty futures, it names them counted before they land.
// The "Selected integrations" panel is GONE (3 Sep, user call — "is it even
// relevant?"). From the platform's seat it never was: the cohort was chosen on the
// LIST, the kicker names it, each field row states what the cohort answers today, and
// the review counts every caveat before a write. The per-section walks it showed are
// each ad setup's own detail — depth you cannot act on from a cohort sheet.

function slotTabHtml(t) {
  const d = UNIT_DRAFT;
  const shownOff = (d.runs ?? (d.st.on > 0 ? 'on' : 'off')) === 'off';
  // A break switched off dims its untouched fields row by row — never a queued one:
  // a change you cannot read is a change you cannot check.
  return `
    <div class="bulk-split">
      <div class="bulk-fields">${bulkFieldsHtml(t, shownOff)}</div>
      ${bulkPendingCardHtml(t)}
    </div>`;
}

// ---------- review, then apply (2 Sep, user call) ----------
// The queue is turned into the same flat change list a save or a publish produces, and
// handed to the ONE review screen. Back returns to the sheet with the queue intact —
// a review that costs you your work is a review nobody opens twice.
function bulkReviewChanges() {
  const keys = selectedKeys();
  const withDeals = t => keys.filter(k => k.sections.some(s2 => s2.slots[t]?.direct?.rungCount)).length;
  return bulkQueuedRows().map(r => {
    // THE ANSWER ONLY (15 Sep, user call). This list used to carry what the cohort holds
    // today on the left — the agreed value where they agreed, a spread of values where they
    // did not. It reads as a from-side and it is not one: nothing here is a transition from a
    // single prior state, and a review that shows one invites the reader to check a diff that
    // does not exist. The sheet's own rows still say what a break holds today, where that is
    // the context for choosing; this screen says what will be written. (`noFrom`, review.js.)
    const row = {
      where: r.where, field: r.f, label: r.label, toText: r.to,
    };
    // The counted caveats belong here, next to the change they qualify — this is the
    // last screen before a cohort write, so a surface the change cannot touch is named.
    if (r.f === 'direct' && r.t !== 'player') {
      const n = keys.length - withDeals(r.t);
      if (n) row.note = `${n} carry no special deals`;
    }
    if (r.f === 'runs' && r.to.startsWith('on')) {
      const n = keys.filter(k => !k.sections.some(s2 => s2.slots[r.t]?.hasDemand)).length;
      if (n) row.note = `${n} have no demand — skipped`;
    }
    return row;
  });
}

// WHAT THE REVIEW SAYS, COUNTED AGAINST WHOEVER IS IN THE ACT RIGHT NOW. One function, read
// when the screen opens and again after every tick in its audience panel — so the title, the
// list, the spreads inside it and the button's own label can never disagree about the cohort.
function bulkReviewState() {
  const keys = selectedKeys();
  return {
    title: `Apply to ${keys.length} integration${keys.length === 1 ? '' : 's'}?`,
    okLabel: keys.length ? `Apply to ${keys.length}` : 'Apply',
    changes: bulkReviewChanges(),
    // RETIRED 16 Sep (user call — *"Saved on each integration · on air when it is published —
    // remove this text from step 2"*). It was here for one day to answer *"why are they in
    // unpublished state"*, and what actually answered that was the WORD: the status line reads
    // `Changes not on air` now instead of borrowing `Unpublished` from a different state, and the
    // receipt says `not on air yet`. With those two true, a sentence on the review was the third
    // telling — on the one screen whose whole job is the list, not a lesson about the model.
    emptyText: keys.length
      ? 'Nothing to change on these integrations.'
      : 'No integrations in this change — tick at least one above.',
  };
}

async function reviewBulk() {
  const ok = await reviewChanges({
    ...bulkReviewState(),
    cancelLabel: 'Back',
    // Field and answer, no was-side — a cohort has no single previous value.
    noFrom: true,
    // Step 2 of the tabbed sheet: same footprint, so confirming is not a new dialog.
    steady: 'ads',
    // WHO, ANSWERED HERE (15 Sep, user call) — see the audience block in review.js. A tick
    // recounts this break's cached cohort facts and then the whole screen.
    audience: {
      chosen: selectedKeys,
      all: bulkWhoAll,
      has: bulkWhoHas,
      toggle: id => { if (!bulkWhoToggle(id)) return false; bulkRecount(); return true; },
      recount: bulkReviewState,
    },
  });
  // Back leaves the sheet exactly as it was — the queue is still there to edit, now counted
  // against whatever the audience became.
  if (!ok) { renderUnitScreen(); return; }
  await applyBulk();
}

async function applyBulk() {
  const drafts = touchedSlots().map(t => BULK_DRAFT.slots[t]);
  closeUnitScreen();

  // Switches and decisions per touched slot — in the order the screen reads.
  for (const d of drafts) {
    const t = d.slot;
    if (d.runs !== d.runs0 && d.runs) {
      await bulkApplyDirect(d.runs === 'on' ? 'slotOn' : 'slotOff', t);
    }
    if (d.dTouched.size) {
      const fields = {};
      for (const f of d.dTouched) fields[f] = d.dv[f] === undefined ? 'setup' : d.dv[f];
      await bulkApplyDirect('driveFields', { slot: t, fields });
    }
  }

  bulkWhoClose();
  await refreshKeysList();
}

// Cohort publish / take-off-air left the bulk bar (2 Sep, user call) — going on or
// off air is each integration's own deliberate act, from its page.
