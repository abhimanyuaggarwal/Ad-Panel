// review.js — THE CHANGE REVIEW (2 Sep, user call): one screen, three doors.
//
// Nothing in this panel reaches a cohort or the air without this screen first. Bulk
// Apply, Save and Publish all end here, and they all end here IDENTICALLY: the screen
// takes a flat change list in the shape the version rail already speaks —
// `{ where, field, from, to, note? }` — so the server's own diff and a queue built in
// a dialog render through the same code. Nothing about a change is described twice.
//
// The list is bucketed by WHERE, in the order the product reads (the four breaks, then
// the player, then the surface's own details), because "what did I change on the
// mid-roll" is the question a reviewer actually has. Values are the panel's words:
// `fieldName` and `showVal`, the same pair the rail uses.

// The order groups appear in. Anything unknown sorts after these, alphabetically —
// a new `where` shows up in a sensible place without this list having to know it.
const REVIEW_WHERE_ORDER = ['Pre-roll', 'Mid-roll', 'Post-roll', 'Out-stream', 'Player', 'Player configs'];

function reviewWhereRank(w) {
  const i = REVIEW_WHERE_ORDER.indexOf(w);
  if (i >= 0) return i;
  // `Player configs · Shorts feed` sits with its parent group.
  const parent = REVIEW_WHERE_ORDER.findIndex(x => w.startsWith(`${x} ·`));
  if (parent >= 0) return parent + 0.5;
  return w === '' ? 99 : 50;
}

// Changes → groups, in reading order. An empty `where` is the surface itself.
// `keepOrder` preserves the caller's insertion order — a CREATION review reads in the
// wizard's own step order (identity first), where an edit review reads break-first.
function reviewGroups(changes, keepOrder) {
  const by = new Map();
  for (const c of changes || []) {
    const w = c.where || '';
    if (!by.has(w)) by.set(w, []);
    by.get(w).push(c);
  }
  const entries = [...by.entries()];
  if (!keepOrder) entries.sort((a, b) => reviewWhereRank(a[0]) - reviewWhereRank(b[0]) || a[0].localeCompare(b[0]));
  return entries.map(([where, rows]) => ({ where: where || 'Details', rows }));
}

// A value in the panel's own words. The delivery controls have their own vocabulary —
// absence means "as set up", and a full walk is "Full", not the string `setup` — so the
// review speaks it rather than printing the payload, and speaks it the same whether the
// change arrived from a save, a publish, or a queued cohort write. A caller that already
// holds the words (the bulk queue does) passes `fromText`/`toText` and skips this.
const REVIEW_DRIVE_FIELDS = ['direct', 'ask', 'tries', 'start', 'deferSec', 'podAds'];

function reviewValue(field, v) {
  if (REVIEW_DRIVE_FIELDS.includes(field)) {
    if (v === undefined || v === null || v === '') return 'as set up';
    return driveWord(field, v);
  }
  return showVal(field, v);
}

// One change, said the way the rail says it: what moved, from what, to what. A value
// too long to sit beside its old self states only where it landed — a 200-character
// blob either side of an arrow is not a diff anyone reads.
function reviewRowHtml(c) {
  const from = c.fromText ?? reviewValue(c.field, c.from);
  const to = c.toText ?? reviewValue(c.field, c.to);
  const long = from.length > 28 || to.length > 28;
  return `
    <div class="rvw-row">
      <span class="rvw-f">${esc(c.label || fieldName(c.field))}</span>
      <span class="rvw-v">${long
        ? `<b>${esc(clip(to, 60))}</b>`
        : `<code>${esc(from)}</code><i class="rvw-arr">→</i><b>${esc(to)}</b>`}</span>
      ${c.note ? `<span class="rvw-m">${esc(c.note)}</span>` : '<span class="rvw-m"></span>'}
    </div>`;
}

function reviewBodyHtml(changes, keepOrder) {
  const groups = reviewGroups(changes, keepOrder);
  return groups.map(g => `
    <div class="rvw-g">
      <div class="rvw-gh">${esc(g.where)}<span class="rvw-gn">${g.rows.length}</span></div>
      ${g.rows.map(reviewRowHtml).join('')}
    </div>`).join('');
}

// THE SCREEN. Resolves true when the person confirms, false on cancel or the veil.
//
// NO PROSE (2 Sep review). The first cut explained itself in a scope box and a closing
// note; both said what the title and the button already said, and a reviewer in a hurry
// reads neither. What is left is the list, a counted foot, and the two acts. The only
// words that survive are the ones no row can carry: a `kicker` naming whose changes
// these are, and the per-row `note` that names a surface a change cannot reach.
function reviewChanges(opts) {
  const changes = opts.changes || [];
  const n = changes.length;
  return new Promise(resolve => {
    const root = document.getElementById('dialog-root');
    root.innerHTML = `
      <div class="dlg-veil"><div class="dlg rvw">
        <h3>${esc(opts.title)}${opts.kicker ? `<span class="dlg-kicker">${esc(opts.kicker)}</span>` : ''}</h3>
        <div class="dlg-body rvw-body">
          ${n ? reviewBodyHtml(changes, opts.keepOrder) : `<div class="tl-empty">${esc(opts.emptyText || 'Nothing to change.')}</div>`}
        </div>
        <div class="dlg-foot">
          <span class="rvw-count">${n} change${n === 1 ? '' : 's'}</span>
          <button class="btn ghost" data-act="no">${esc(opts.cancelLabel || 'Back')}</button>
          <button class="btn ${opts.danger ? 'danger' : ''}" data-act="yes" ${n ? '' : 'disabled'}>${esc(opts.okLabel || 'Confirm')}</button>
        </div>
      </div></div>`;
    const done = v => { root.innerHTML = ''; resolve(v); };
    root.querySelector('[data-act=no]').onclick = () => done(false);
    root.querySelector('[data-act=yes]').onclick = () => done(true);
    root.querySelector('.dlg-veil').onclick = e => {
      if (e.target.classList.contains('dlg-veil')) done(false);
    };
  });
}
