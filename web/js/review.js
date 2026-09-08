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

// The order groups appear in — the page's own reading order: the waterfall
// (the setup's head), then the four breaks, then the player, then the surface's own
// details. Anything unknown sorts after these, alphabetically.
const REVIEW_WHERE_ORDER = ['Waterfall', 'Pre-roll', 'Mid-roll', 'Post-roll', 'Out-stream', 'Player configs', 'Player'];

function reviewWhereRank(w) {
  const i = REVIEW_WHERE_ORDER.indexOf(w);
  if (i >= 0) return i;
  // `Player configs · shorts` sits with its parent; `Default · Pre-roll` (the setups
  // editor's wording) sits with ITS break — so a setup's publish reads break-first
  // too, not alphabetically by placement (6 Sep).
  const parent = REVIEW_WHERE_ORDER.findIndex(x => w.startsWith(`${x} ·`) || w.includes(`· ${x}`) || w.includes(` ${x} `) || w.endsWith(` ${x}`));
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
// `withNote: true` (6 Sep, user call) adds ONE quiet line between the evidence and the
// act: the person has just re-read what they did, and can name it in their own words.
// The note travels with the version and reads back under it in the rail — so publish
// and restore both take it, on this same screen, and history explains itself.
// `caution` is a caller-built block (a restore's counted "your draft loses N changes")
// rendered after the list, where a warning belongs: read last, before the act.
// Resolves false on cancel; on confirm, true — or `{ note }` when withNote.
function reviewChanges(opts) {
  const changes = opts.changes || [];
  const n = changes.length;
  return new Promise(resolve => {
    const root = document.getElementById('dialog-root');
    root.innerHTML = `
      <div class="dlg-veil"><div class="dlg rvw${opts.steady ? ' steady' : ''}">
        <h3>${esc(opts.title)}${opts.kicker ? `<span class="dlg-kicker">${esc(opts.kicker)}</span>` : ''}</h3>
        ${opts.subline ? `<div class="rvw-sub">${esc(opts.subline)}</div>` : ''}
        <div class="dlg-body rvw-body">
          ${n ? reviewBodyHtml(changes, opts.keepOrder) : `<div class="tl-empty">${esc(opts.emptyText || 'Nothing to change.')}</div>`}
          ${opts.caution || ''}
        </div>
        <div class="dlg-foot">
          ${opts.foot ? `<span class="rvw-count">${esc(opts.foot)}</span>` : ''}
          ${opts.withNote ? `<input class="rvw-note" maxlength="120" placeholder="${esc(opts.notePlaceholder || 'Add a note — optional')}">` : ''}
          ${opts.readOnly ? `
            ${opts.thirdAct ? `<button class="btn ghost" data-act="third">${esc(opts.thirdAct)}</button>` : ''}
            <button class="btn" data-act="no">Close</button>`
          : `
            <button class="btn ghost" data-act="no">${esc(opts.cancelLabel || 'Back')}</button>
            <button class="btn ${opts.danger ? 'danger' : ''}" data-act="yes" ${n ? '' : 'disabled'}>${esc(opts.okLabel || 'Confirm')}</button>`}
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
