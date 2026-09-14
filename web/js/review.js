// review.js — THE CHANGE REVIEW (2 Sep, user call; re-cut 11 Sep). One screen, three doors.
//
// Nothing in this panel reaches a cohort or the air without this screen first. Bulk
// Apply, Save and Publish all end here, and they all end here IDENTICALLY: the screen
// takes a flat change list in the shape the version rail already speaks —
// `{ where, field, from, to, note? }` — so the server's own diff and a queue built in
// a dialog render through the same code. Nothing about a change is described twice.
//
// THE 11 SEP RE-CUT (user call — "ugly, immature, cluttered, no IA"). The screen had
// grown three separate visual languages for one kind of fact: bordered cards with
// tinted bands for the list, `.vc` prose lines for a caution, and a note input wedged
// between the two acts. At twenty changes it read as a stack of boxes. What replaced it:
//
//   FOUR ZONES, TOP TO BOTTOM, in the order a person decides —
//     1. the head     what act, on what, and what it costs (title · lede · quote)
//     2. the caption   how much am I agreeing to, measured against what
//     3. the evidence  the changes, as ONE list under sticky section labels
//     4. the act       the note on its own line, then the two doors, alone
//
//   ONE ROW GRAMMAR, EVERYWHERE. A change is WHAT · WAS → NOW on a four-column grid
//   shared by the whole list, so the arrow forms a vertical spine and old/new line up
//   down the entire dialog. A caution's rows are that same grammar — a discarded draft
//   change is a change, and it was the one thing this screen used to say twice.
//
//   NO CARDS. A section is a label and a hairline, not a bordered box with a filled
//   band. Six groups used to mean six nested containers; now the breaks chunk by
//   whitespace and one sticky label each.
//
//   THE SCOPE IS THE GROUP. `Pre-roll · TOI Mweb VideoShow Display` and
//   `Default · Pre-roll` used to open their own top-level boxes beside `Pre-roll`,
//   so "what did I change on the mid-roll" — the question this screen exists to
//   answer — needed three looks. The known break/zone word is now the SECTION and
//   whatever else the `where` carries becomes a quiet sub-label inside it.

// The order sections appear in — the page's own reading order: the waterfall (the
// setup's head), then the four breaks, then the player, then the surface's own details.
// Anything unknown sorts after these, alphabetically.
const REVIEW_WHERE_ORDER = ['Global waterfall', 'Pre-roll', 'Mid-roll', 'Post-roll', 'Out-stream', 'Player configs', 'Player'];

// A `where` is one of these words plus, sometimes, the thing inside it the change
// landed on — a placement (`Default · Pre-roll`), a rung (`Pre-roll · TOI …Display`),
// a config (`Player configs · shorts`). The KNOWN word is the section; the rest is the
// sub-label. Order within the string does not matter, because the two products write it
// in opposite orders. A `where` with no known word stands as its own section.
function reviewSplitWhere(w) {
  if (!w) return ['Details', ''];
  const parts = String(w).split('·').map(s => s.trim()).filter(Boolean);
  const i = parts.findIndex(p => REVIEW_WHERE_ORDER.includes(p));
  if (i < 0) return [w, ''];
  return [parts[i], parts.filter((_, k) => k !== i).join(' · ')];
}

function reviewWhereRank(w) {
  const i = REVIEW_WHERE_ORDER.indexOf(w);
  if (i >= 0) return i;
  return w === 'Details' ? 99 : 50;
}

// Changes → sections → sub-blocks, in reading order. A section's own rows (no
// sub-label) come first, then each sub-block in the order it was first seen.
// `keepOrder` preserves the caller's insertion order — a CREATION review reads in the
// wizard's own step order (identity first), where an edit review reads break-first.
function reviewGroups(changes, keepOrder) {
  const by = new Map();
  for (const c of changes || []) {
    const [sec, sub] = reviewSplitWhere(c.where);
    if (!by.has(sec)) by.set(sec, new Map());
    const subs = by.get(sec);
    if (!subs.has(sub)) subs.set(sub, []);
    subs.get(sub).push(c);
  }
  const entries = [...by.entries()];
  if (!keepOrder) entries.sort((a, b) => reviewWhereRank(a[0]) - reviewWhereRank(b[0]) || a[0].localeCompare(b[0]));
  return entries.map(([where, subs]) => {
    const blocks = [...subs.entries()]
      .sort((a, b) => (a[0] ? 1 : 0) - (b[0] ? 1 : 0))
      .map(([sub, rows]) => ({ sub, rows }));
    return { where, blocks, n: blocks.reduce((t, b) => t + b.rows.length, 0) };
  });
}

// A value in the panel's own words. The delivery controls have their own vocabulary —
// absence means "as set up", and a full walk is "Full", not the string `setup` — so the
// review speaks it rather than printing the payload, and speaks it the same whether the
// change arrived from a save, a publish, or a queued cohort write. A caller that already
// holds the words (the bulk queue does) passes `fromText`/`toText` and skips this.
const REVIEW_DRIVE_FIELDS = ['direct', 'ask', 'tries', 'start', 'deferSec', 'podAds', 'headerBidding'];

function reviewValue(field, v) {
  if (REVIEW_DRIVE_FIELDS.includes(field)) {
    if (v === undefined || v === null || v === '') return 'as set up';
    return driveWord(field, v);
  }
  return showVal(field, v);
}

// BOTH SIDES, ALWAYS (11 Sep). The old row dropped the `was` whenever either value ran
// long and printed only where the change landed — the one row in a diff you cannot
// check. A value is clipped to the column instead, with the exact string on hover
// (the tooltip policy's first case), so every row says the same three things in the
// same three places and the spine holds all the way down.
const REVIEW_VAL_MAX = 30;

function reviewValHtml(cls, text) {
  const t = text === '' || text === undefined || text === null ? '—' : String(text);
  const cut = t.length > REVIEW_VAL_MAX;
  return `<span class="${cls}${cut ? ' cut' : ''}"${cut ? ` title="${esc(t)}"` : ''}>${esc(clip(t, REVIEW_VAL_MAX))}</span>`;
}

// One change: what moved, from what, to what — on the list's shared grid. The optional
// `note` names a surface the change cannot reach, and rides under the row as a
// footnote rather than fighting the values for the right-hand column.
function reviewRowHtml(c) {
  const from = c.fromText ?? reviewValue(c.field, c.from);
  const to = c.toText ?? reviewValue(c.field, c.to);
  return `
    <div class="rvw-row">
      <span class="rvw-what">${esc(c.label || fieldName(c.field))}</span>
      ${reviewValHtml('rvw-was', from)}
      <i class="rvw-arr">→</i>
      ${reviewValHtml('rvw-now', to)}
      ${c.note ? `<span class="rvw-why">${esc(c.note)}</span>` : ''}
    </div>`;
}

function reviewBlockHtml(b) {
  return `${b.sub ? `<div class="rvw-sub">${esc(b.sub)}</div>` : ''}${b.rows.map(reviewRowHtml).join('')}`;
}

function reviewBodyHtml(changes, keepOrder) {
  return reviewGroups(changes, keepOrder).map(g => `
    <section class="rvw-sec">
      <h4 class="rvw-sh">${esc(g.where)}</h4>
      ${g.blocks.map(reviewBlockHtml).join('')}
    </section>`).join('');
}

// THE ONE ASIDE: work this act would destroy (11 Sep). It is red, it is counted, and it
// is REAL CHANGE ROWS — sectioned by where they live, through the very same code the
// list above them is built with, because a discarded draft change is a change and that
// was the one fact this screen used to say two different ways.
// The amber twin (a save's soft flags, "Worth a look") was removed the same day: it was
// the last thing on this screen that was not a change, and it was what made publish look
// like a different object from the version sheet it is supposed to BE. What is left is
// the only warning that has to stop someone — the only one worth interrupting a list for.
function reviewAsideHtml(opts) {
  return `
    <div class="rvw-aside">
      <div class="rvw-ah">${esc(opts.head)}</div>
      <div class="rvw-arows">${reviewBodyHtml(opts.changes || [])}</div>
    </div>`;
}

// THE SCREEN. Resolves true when the person confirms, false on cancel or the veil.
//
// NO PROSE (2 Sep review). The first cut explained itself in a scope box and a closing
// note; both said what the title and the button already said, and a reviewer in a hurry
// reads neither. What is left is the list, its counted caption, and the two acts. The
// only words that survive are the ones no row can carry: a `kicker` naming what this
// act costs, a `subline` quoting the person who made the version, and the per-row
// `note` that names a surface a change cannot reach.
// `withNote: true` (6 Sep, user call) adds ONE quiet line between the evidence and the
// act: the person has just re-read what they did, and can name it in their own words.
// The note travels with the version and reads back under it in the rail — so publish
// and restore both take it, on this same screen, and history explains itself. It gets
// its OWN line above the doors (11 Sep): wedged between Cancel and Publish it read as
// a third control in the act row, and lost half its width to a long button label. It
// is dropped entirely when there is nothing to publish — a field for annotating an act
// the disabled button will not perform.
// `caution` is a caller-built block (see reviewAsideHtml) rendered after the list,
// where a warning belongs: read last, before the act.
// `foot` is the list's SCOPE — what these changes were counted against — and rides the
// caption beside the total, not the act row, because it describes the evidence.
// `steady` NAMES THE JOURNEY this review is step 2 of ('ads' / 'player', 8 Sep) rather
// than saying only "yes": each journey states its own frame height in CSS, and step 2
// reads the same one as step 1, so the footer cannot move between them.
// Resolves false on cancel; on confirm, true — or `{ note }` when withNote.
function reviewChanges(opts) {
  const changes = opts.changes || [];
  const n = changes.length;
  return new Promise(resolve => {
    const root = dialogRoot();
    root.innerHTML = `
      <div class="dlg-veil"><div class="dlg rvw${opts.steady ? ` steady steady-${opts.steady}` : ''}">
        <div class="rvw-head">
          <h3>${esc(opts.title)}</h3>
          ${opts.kicker ? `<p class="rvw-lede">${esc(opts.kicker)}</p>` : ''}
          ${opts.subline ? `<p class="rvw-quote">${esc(opts.subline)}</p>` : ''}
        </div>
        <div class="rvw-cap">
          <span class="rvw-n">${n ? `${n} change${n === 1 ? '' : 's'}` : 'No changes'}</span>
          ${opts.foot ? `<span class="rvw-scope">${esc(opts.foot)}</span>` : ''}
        </div>
        <div class="dlg-body rvw-body">
          ${n ? reviewBodyHtml(changes, opts.keepOrder) : `<div class="rvw-none">${esc(opts.emptyText || 'Nothing to change.')}</div>`}
          ${opts.caution || ''}
        </div>
        <div class="dlg-foot">
          ${opts.withNote && n ? `<input class="rvw-note" maxlength="120" placeholder="${esc(opts.notePlaceholder || 'Add a note — optional')}">` : ''}
          <div class="rvw-acts">
            ${opts.readOnly ? `
              ${opts.thirdAct ? `<button class="btn ghost" data-act="third">${esc(opts.thirdAct)}</button>` : ''}
              <button class="btn" data-act="no">Close</button>`
            : `
              <button class="btn ghost" data-act="no">${esc(opts.cancelLabel || 'Back')}</button>
              <button class="btn ${opts.danger ? 'danger' : ''}" data-act="yes" ${n ? '' : 'disabled'}>${esc(opts.okLabel || 'Confirm')}</button>`}
          </div>
        </div>
      </div></div>`;
    const done = v => {
      const note = opts.withNote ? (root.querySelector('.rvw-note')?.value || '').trim() : '';
      root.innerHTML = '';
      resolve(v === true && opts.withNote ? { note } : v);
    };
    root.querySelector('[data-act=no]').onclick = () => done(false);
    root.querySelector('[data-act=yes]')?.addEventListener('click', () => done(true));
    root.querySelector('[data-act=third]')?.addEventListener('click', () => done('act'));
    root.querySelector('.dlg-veil').onclick = e => {
      if (e.target.classList.contains('dlg-veil')) done(false);
    };
  });
}
