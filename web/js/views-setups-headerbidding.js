// views-setups-headerbidding.js — HEADER BIDDING (10 Sep, user call): who else bids for a
// slot BEFORE the ad server is asked. One answer at the setup's head — Off, Amazon+Prebid,
// Amazon, Prebid — and every ad slot in every ad section either BORROWS it (`Auto`, the
// answer said by absence) or gives its own, `Off` included.
//
// THE JOURNEY IS THE GLOBAL WATERFALL'S, THE CONTROL IS NOT (the user's call: *"somewhat
// like the global waterfall journey, not exactly — the user intuition is this"*). What it
// takes from the waterfall is the SHAPE: a global answer at the setup's head (a zone of the
// folded GLOBAL SETTINGS, beside the waterfall's, since 11 Sep), a
// counted line saying how many slots follow it, and one bulk act over an ad-section ×
// ad-slot grid. What it deliberately does NOT take is the
// waterfall's two-step switch — `Waterfall` on/off then `Custom │ Global` — because there
// the custom answer is a whole LADDER, which cannot fit in a seg and so needs a mode
// control above it. Header bidding's custom answer is ONE value out of three, so the
// borrowed answer sits in the SAME seg as the concrete ones:
//
//     Header bidding   [ Auto │ Amazon+Prebid │ Amazon │ Prebid │ Off ]   View
//
// One control, five answers, nothing revealed and nothing hidden — exactly the grammar
// `Content pause` already uses for Auto·Yes·No, where `Auto` means "each unit's own".
// A second switch there would have dressed one question as two.
//
// IT IS NOT A RUNG, AND NOT A LEVER ON THE WATERFALL. Bidders are asked alongside the ad
// server, not tried in turn, so header bidding has no order, no depth and no place in a
// ladder — which is why it is the setup's own field beside the waterfall rather than a
// row inside it, and why every slot's answer lives with the rest of that slot's DELIVERY
// SETTINGS (see `behaviourRowsHtml` in controls.js — the row is drawn there, so it wears
// the same label edge, the same unsaved-change tint, the differs dot, and rides `Apply to
// all placements` for free).
//
// COUNTED, NEVER INVENTED: every number here is counted off the form — how many ad slots
// follow the global, of how many there are — and the resolution a slot's `Auto` performs
// is the exact mirror of the server's `servedHeaderBidding` (api/store/setups.js), so the
// answer on screen is the answer the player is handed.
// Loads before views-setups-editor.js; shares its globals (FORM, SU_SEC, KL_META, …).

// ---------- reads ----------

// The setup's own answer — `off` said by absence, so a setup written before this existed
// reads as one nobody has switched bidding on for.
function suHb() { return FORM.data.headerBidding || 'off'; }

// One slot's stored answer, and what it actually runs. `auto` borrows the global.
function suHbAnswer(t) { return suBhv(t).headerBidding || 'auto'; }
function suHbServed(t) { return suHbAnswer(t) === 'auto' ? suHb() : suHbAnswer(t); }
function suHbWord(v) { return label('headerBidding', v); }

// Every ad slot the answer reaches, in the page's own order — the mid-roll opened out
// into its pods, because a pod is a break and asks for itself. Out-stream is in: a
// banner slot is what Prebid was built for, and Amazon answers for both.
function suHbSlots() {
  const out = [];
  (FORM.data.sections || []).forEach((sec, si) => {
    for (const t of KL_META.slotTypes) {
      const s = (sec.slots || {})[t];
      if (!s) continue;
      const gs = t === 'midroll' ? (s.groups || []) : [s];
      gs.forEach((g, gi) => out.push({ si, sec, t, gi, g }));
    }
  });
  return out;
}

function suHbSlotAnswer(g) { return (g && g.behaviour && g.behaviour.headerBidding) || 'auto'; }
function suHbSlotServed(g) {
  const a = suHbSlotAnswer(g);
  return a === 'auto' ? suHb() : a;
}

// AND DOES ANYTHING ACTUALLY BID THERE. An answer of `Amazon+Prebid` on a slot with no ad
// units is not bidding — nothing is asked at all — so the marks and the counted line read
// through this rather than through the answer alone (counted, never claimed). A break's
// serving units include the ones it takes from the global waterfall and its own deal; a
// rotation's are its live banners.
function suHbSlotAsks(x) {
  const g = x.g;
  if (!g) return false;
  if (suHbSlotServed(g) === 'off') return false;
  if (isRotation(x.t)) return (g.rungs || []).some(r => r.tagId && r.on !== false);
  return suSrcServed(g) > 0 || ((g.direct && g.direct.rungs) || []).some(r => r && r.tagId);
}

// Counted three ways: how many slots there are, how many follow the global, and how many
// actually run bidders today (the global's answer resolved through each one).
function suHbCounts() {
  const all = suHbSlots();
  return {
    total: all.length,
    auto: all.filter(x => suHbSlotAnswer(x.g) === 'auto').length,
    bidding: all.filter(suHbSlotAsks).length,
  };
}

// ---------- writers ----------

// The one global answer. `auto` is not among its options — the global is the thing being
// borrowed (the server refuses it by name), so there is nothing here to guard against.
function suHbGlobalSet(v) {
  FORM.data.headerBidding = v;
  clearErr('headerBidding');
  FORM.rerender();
}

// THE SLOT'S OWN ROW LIVES IN controls.js (`hbRow` inside behaviourRowsHtml): the first row
// of every break's Delivery settings — `Auto │ Off │ Custom`, then the partners while Custom
// stands. Two shapes were tried on 11 Sep before it: a five-answer seg, then a row-as-fact
// opening a dialog (switch → Custom │ Global → partners). The dialog went on the user's call
// the same hour — *"no need of the modal or dialog box here"* — because the decision is two
// segs, and two segs belong on the row.

// ---------- the zone (inside GLOBAL SETTINGS since 11 Sep): one control, one act ----------
// A ZONE ROW, NOT A SECTION (11 Sep, user call): header bidding and the waterfall share one
// folded head, `Global settings`, and this is the FIRST row down its rail (user call, 11 Sep
// — the one-line answer above the ladder, not under it). See the block
// above `suWaterfallZoneHtml`; `suGlobalsHtml` in views-setups-editor.js draws the head.

// What this zone lends the folded head: THE ANSWER, alone, as a badge (11 Sep, user call —
// *"we don't need the pre post mid out chips here"*; the first cut lit the break chips where
// a slot actually bids, but Placements wears those chips one line down, and where the
// answer lands is that section's story). The counted story rides the hover.
function suHbGlimpseHtml() {
  const cur = suHb();
  const c = suHbCounts();
  const story = [
    suHbWord(cur),
    `${c.auto} of ${c.total} ad slot${c.total === 1 ? '' : 's'} follow it`,
    c.bidding ? `${c.bidding} bidding` : 'nothing bidding',
  ].join(' · ');
  return `<span class="hb-glimpse" title="${esc(story)}"><span class="hbg-answer${cur === 'off' ? ' off' : ''}">${esc(suHbWord(cur))}</span></span>`;
}

function suHeaderBiddingZoneHtml(meta) {
  const cur = suHb();
  const c = suHbCounts();
  // ONE LINE (11 Sep, user call — *"we only have this tab and apply on ad slots; keep the
  // UI clean and decluttered while retaining the symmetry of the page"*). One control and
  // one act do not need two rows: the seg starts where every zone's content starts, the act
  // ends where the waterfall foot's act ends — the same left rail, the same right edge, on
  // a single line.
  //
  // NO ROUTINE COUNT (the waterfall foot's own 7 Sep call — *"6 ad slots connected — remove
  // this text"*): a number you cannot act on is not worth the ink, and the grid behind
  // `Apply on ad slots` names every follower the moment it opens. The count still rides the
  // folded head's hover. What STAYS is the warning, because it is not a count: an answer no
  // slot takes is inert, and silence there would read as placed.
  const orphan = cur !== 'off' && !c.bidding;
  // Meta's list when it has one; the page's own spelling when the API predates it — a seg
  // with no buttons is a question with no answers.
  const opts = (meta.headerBidding && meta.headerBidding.length) ? meta.headerBidding : HB_ANSWERS;
  return `
      <div class="zone-row hb-zone">
        <span class="zone-l">${esc(HB_WORD)}</span>
        <div class="zone-c hb-line">
          ${FORM.errors.headerBidding ? `<div class="banner bad" data-err-for="headerBidding">${esc(FORM.errors.headerBidding)}</div>` : ''}
          ${/* THE UNSAVED-CHANGE MARK IS FREE: `paintChg` compares any `data-field`
                against the last-saved form, so the answer wears the same 2px amber rule
                every other changed control on the page wears. */''}
          <div class="hb-pick" data-field="headerBidding">${accSeg(cur, opts, opts.map(suHbWord),
            o => `suHbGlobalSet('${o}')`)}</div>
          <span class="wf-foot-gap"></span>
          ${orphan ? '<span class="wf-placed none">no ad slot takes it</span>' : ''}
          <button type="button" class="slot-add" ${c.total
            ? 'onclick="suHbApplyOpen()"'
            : 'disabled title="Add a placement first — there is no ad slot to answer for"'}>Apply on ad slots</button>
        </div>
        <span class="slot-menu-ph"></span>
      </div>`;
}

// ---------- APPLY ON AD SLOTS: the same grid, a different question ----------
// The waterfall's grid asks "is this break connected?"; this one asks "does this slot
// take the global answer?" — ad sections down the side, every ad slot across the top,
// one tick per cell, connect and take off in the same pass. It borrows that grid's whole
// machinery (`suWfApplyHi`, `suWfApplyBulk` — the two axes ARE the bulk controls, and
// hovering either lights the cells it would answer) because a person who has used one
// has learned the other.
//
// UNTICKING NEVER CHANGES WHAT SERVES. A slot leaving `Auto` is pinned to exactly what it
// was running a moment ago — today's global answer, now its own copy — so the act makes a
// slot INDEPENDENT rather than different, and nothing on air moves until someone answers
// that slot on purpose. Same principle as the waterfall's way back: the answer you leave
// is kept, never wiped.
//
// THE OUT-STREAM IS IN THIS GRID (where the waterfall's leaves it out — a rotation has no
// waterfall to follow). Bidders have nothing to do with taking turns.

function suHbApplyCell(si, col) {
  const sec = (FORM.data.sections || [])[si] || {};
  const s = (sec.slots || {})[col.t];
  const gs = col.t === 'midroll' ? ((s || {}).groups || []) : [s];
  const g = col.t === 'midroll' ? gs[col.gi] : s;
  const name = sec.name || `Placement ${si + 1}`;
  const why = !s ? `“${name}” has no ${label('slotType', col.t).toLowerCase()}`
    : !g ? `“${name}” holds ${gs.length === 1 ? 'one pod' : `${gs.length} pods`}`
    : '';
  return { g: g || null, why, on: !!g && suHbSlotAnswer(g) === 'auto' };
}

// The foot counts the delta both ways and names it in the act's own words, so the button
// always says exactly what it will do — and stays unavailable while there is nothing.
function suHbApplyTick() {
  const root = document.getElementById('dialog-root');
  const boxes = [...root.querySelectorAll('.wfa-cell input')];
  let follow = 0, own = 0;
  for (const b of boxes) {
    const was = b.dataset.was === '1';
    if (b.checked && !was) follow++;
    else if (!b.checked && was) own++;
    b.closest('.wfa-cell').classList.toggle('chg', b.checked !== was);
  }
  const ok = root.querySelector('[data-act=yes]');
  const bits = [];
  if (follow) bits.push(`${follow} to Auto`);
  if (own) bits.push(`${own} to their own`);
  ok.disabled = !bits.length;
  ok.title = bits.length ? '' : 'Nothing to change yet — tick a slot';
  ok.textContent = bits.length ? `Apply — ${bits.join(', ')}` : 'Apply';
}

async function suHbApplyOpen() {
  const cols = suWfApplyCols(true); // with the out-stream: bidders do not mind a rotation
  const secs = FORM.data.sections || [];
  if (!cols.length || !secs.length) return;
  const famRow = cols.map(c => (c.first
    ? `<th class="wfa-fam${c.fam ? ' named' : ''}" colspan="${c.span}">${esc(c.fam)}</th>` : '')).join('');
  const hov = (kind, key) => `onmouseenter="suWfApplyHi('${kind}', ${key}, 1)" onmouseleave="suWfApplyHi('${kind}', ${key}, 0)"`;
  const headRow = cols.map((c, ci) => `
    <th class="wfa-col${c.first && ci ? ' split' : ''}">
      <button type="button" class="wfa-h" onclick="suWfApplyBulk('col', ${ci})" ${hov('col', ci)}
        title="Answer this ad slot for every ad section">${esc(c.head)}</button>
    </th>`).join('');
  const cellHtml = (si, col, ci) => {
    const c = suHbApplyCell(si, col);
    const at = `data-row="${si}" data-col="${ci}"`;
    if (c.why) return `<td class="wfa-cell out${col.first && ci ? ' split' : ''}" ${at} title="${esc(c.why)}"><i>—</i></td>`;
    return `
      <td class="wfa-cell${col.first && ci ? ' split' : ''}" ${at}>
        <label class="wfa-tick">
          <input type="checkbox" ${c.on ? 'checked' : ''} data-was="${c.on ? 1 : 0}"
            data-row="${si}" data-col="${ci}" data-t="${col.t}" data-gi="${col.gi}" data-si="${si}"
            onchange="suHbApplyTick()">
        </label>
      </td>`;
  };
  const body = `
    <table class="wfa-grid">
      <thead>
        <tr class="wfa-bands"><th></th>${famRow}</tr>
        <tr><th class="wfa-corner">Ad section</th>${headRow}</tr>
      </thead>
      <tbody>
        ${secs.map((sec, si) => `
          <tr>
            <th class="wfa-row">
              <button type="button" class="wfa-h" onclick="suWfApplyBulk('row', ${si})" ${hov('row', si)}
                title="Answer every ad slot of this ad section">${esc(sec.name || `Placement ${si + 1}`)}</button>
            </th>
            ${cols.map((col, ci) => cellHtml(si, col, ci)).join('')}
          </tr>`).join('')}
      </tbody>
    </table>`;
  // The dialog paints synchronously, so the foot is counted from the state it opens in
  // before the promise is waited on.
  const pending = askForm({
    cls: 'wfa-dlg',
    title: `Which ad slots take “${suHbWord(suHb())}”?`,
    kicker: 'ticked follows this page · unticked keeps today’s answer',
    okLabel: 'Apply',
    body,
  }, root => [...root.querySelectorAll('.wfa-cell input')]
    .filter(b => b.checked !== (b.dataset.was === '1'))
    .map(b => ({ si: +b.dataset.si, t: b.dataset.t, gi: +b.dataset.gi, on: b.checked })));
  suHbApplyTick();
  const picked = await pending;
  if (!picked || !picked.length) return;
  const now = suHb();
  let follow = 0, own = 0;
  for (const { si, t, gi, on } of picked) {
    const s = ((FORM.data.sections[si] || {}).slots || {})[t];
    if (!s) continue;
    const g = t === 'midroll' ? (s.groups || [])[gi] : s;
    if (!g || !g.behaviour) continue;
    // Pinned to what it serves TODAY, so leaving Auto changes nothing on air.
    g.behaviour.headerBidding = on ? 'auto' : now;
    if (on) follow++; else own++;
  }
  clearErr('sections');
  FORM.rerender();
  // One quiet receipt, merged — the act reached slots across placements you cannot see
  // from here.
  const bits = [];
  if (follow) bits.push(`${follow} ad slot${follow === 1 ? '' : 's'} on Auto`);
  if (own) bits.push(`${own} on their own`);
  toast(`${HB_WORD} — ${bits.join(', ')}`);
}
