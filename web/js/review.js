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
// A PAIR ROW HAS NO LEFT-HAND VALUE, so the answer inherits that column's room and clips later.
const REVIEW_PAIR_MAX = 46;

function reviewValHtml(cls, text, max = REVIEW_VAL_MAX) {
  const t = text === '' || text === undefined || text === null ? '—' : String(text);
  const cut = t.length > max;
  return `<span class="${cls}${cut ? ' cut' : ''}"${cut ? ` title="${esc(t)}"` : ''}>${esc(clip(t, max))}</span>`;
}

// One change: what moved, from what, to what — on the list's shared grid. The optional
// `note` names a surface the change cannot reach, and rides under the row as a
// footnote rather than fighting the values for the right-hand column.
//
// A COHORT HAS NO `WAS` (15 Sep, user call — *"in the step 2 of both change player behaviour
// and ad behaviour dont show the values that were previous since we dont have any previous
// value"*). Forty surfaces do not share one prior answer, so the from-side there was either a
// spread of other surfaces' values or a dash — a column of non-answers standing where the diff
// grammar promises a fact. `noFrom` drops it: the row becomes THE FIELD AND THE ANSWER, two
// lanes, and the two are told apart by TREATMENT rather than by position — the question quiet
// and light, the answer the figure. Every other caller (save, publish, a version) keeps the
// three-part spine, because there the was-side is one surface's real, counted value.
function reviewRowHtml(c, noFrom) {
  const to = c.toText ?? reviewValue(c.field, c.to);
  const what = `<span class="rvw-what">${esc(c.label || fieldName(c.field))}</span>`;
  const why = c.note ? `<span class="rvw-why">${esc(c.note)}</span>` : '';
  if (noFrom) {
    return `
    <div class="rvw-row pair">
      ${what}
      ${reviewValHtml('rvw-now', to, REVIEW_PAIR_MAX)}
      ${why}
    </div>`;
  }
  const from = c.fromText ?? reviewValue(c.field, c.from);
  return `
    <div class="rvw-row">
      ${what}
      ${reviewValHtml('rvw-was', from)}
      <i class="rvw-arr">→</i>
      ${reviewValHtml('rvw-now', to)}
      ${why}
    </div>`;
}

function reviewBlockHtml(b, noFrom) {
  return `${b.sub ? `<div class="rvw-sub">${esc(b.sub)}</div>` : ''}${b.rows.map(r => reviewRowHtml(r, noFrom)).join('')}`;
}

function reviewBodyHtml(changes, keepOrder, noFrom) {
  return reviewGroups(changes, keepOrder).map(g => `
    <section class="rvw-sec">
      <h4 class="rvw-sh">${esc(g.where)}</h4>
      ${g.blocks.map(b => reviewBlockHtml(b, noFrom)).join('')}
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

// ---------- THE AUDIENCE: A COLUMN OF ITS OWN, BESIDE WHAT IT WILL RECEIVE ----------
// (15 Sep, four user calls in one afternoon — *"we need an option to show all the selected
// integrations which we can check/uncheck and search, and be able to search and add another"* ·
// *"can we show the integrations in a dedicated RHS?"* · *"don't show all the non-selected
// integrations — if the user wants to add another he should search and select and it gets added
// to the listing"* · *"the current integrations can be CHECKED/UNCHECKED, can NEVER be
// removed"*.)
//
// This screen has always asked `Apply to 12 integrations?` and then printed the answer as a grey
// byline you could not touch. Half the question was unanswerable on the screen that asked it: to
// drop one surface from the act you cancelled out, un-ticked a row in the table, and rebuilt the
// whole sheet. The answer is a COLUMN — the changes on the left, who receives them on the right,
// both standing, neither behind a face. It is the anatomy of the sheet one step back (a form and
// a bounded card), so the journey keeps one shape across both of its screens.
//
// A ROW IS A TICK, AND ROWS NEVER LEAVE. The card carried an × for one round, and an × is the
// wrong promise: it says GONE, and a cohort you are still deciding about is not a thing you
// delete from. Take a surface out and it stays exactly where it was with an empty box — visible,
// countable, one click from being back in. Nothing has to be remembered and nothing has to be
// searched for twice, which is the whole reason the roster is the card's own and not the
// audience's: the audience says who is IN, the roster says who is ON SCREEN, and only the second
// one grows.
//
// IT IS NOT A BROWSER. An earlier cut listed the whole estate in two blocks, `In this change`
// over the other fifty-three — a column mostly made of surfaces this act has nothing to do with.
// What stands here is the cohort you arrived with, plus whatever you add. Adding is the house
// typeahead under the names (`lookupHtml`, the control ops use to find an ad unit): type, pick,
// and the name joins the list directly above the field — where you are already looking — and the
// field clears itself for the next one. An empty box offers nothing; the results lead with what
// you can add and carry what is already ticked greyed beneath, saying so, because a result that
// silently vanishes reads as a search that failed.
//
// EVERY COUNTED WORD RECOUNTS. Tick or untick, and the caller's `recount()` re-reads the screen:
// the title, the change list, the spreads inside it (`3 different values`), the per-row caveats
// (`1 carry no special deals`) and the act's own label all come back true for the new audience.
// A row that changed something for twelve and changes nothing for the eleven left in leaves the
// list on its own.
//
// `opts.audience` is the seam: { chosen, all, has, toggle, recount } — who the act arrived with,
// the estate to search, the state of one surface, the flip, and what the screen should say
// afterwards. Absent, this screen is what it always was, byline and all.

// The two words that tell two same-named surfaces apart — property and platform, in the LIST's
// own vocabulary (`Mweb`, not `mweb`, through the same label table the table cell reads).
// NEVER SAID TWICE. Integrations are usually named for exactly these two things — `TOI Mweb
// VideoShow` is its property, its platform and its surface — so a word appears only when the
// name does not already carry it, and a name that carries both gets the whole line.
function reviewWhoTail(k) {
  const name = String(k.name || '').toLowerCase();
  return [k.property, k.platform ? label('platform', k.platform) : '']
    .filter(Boolean)
    .filter(w => !name.includes(String(w).toLowerCase()))
    .join(' · ');
}

// One surface on the card: the box, the name, and whatever the name did not already say. The
// whole row is the target — a 14px box is a target for a mouse, not for a person deciding about
// forty surfaces — and it carries the checkbox role so the keyboard reads and works it too.
function reviewWhoRowHtml(k, on) {
  const sub = reviewWhoTail(k);
  return `
    <div class="aud-r${on ? ' on' : ''}" data-who="${esc(k.id)}" role="checkbox"
      aria-checked="${on}" tabindex="0">
      <i class="shp-box${on ? ' on' : ''}"></i>
      <span class="aud-n" title="${esc(k.name)}">${esc(k.name)}</span>
      ${sub ? `<span class="aud-s">${esc(sub)}</span>` : ''}
    </div>`;
}

// THE HEAD COUNTS NOTHING UNTIL A COUNT SAYS SOMETHING. With every row ticked the number is the
// one already standing in the title two lines above (`Apply to 3 integrations?`), and a screen
// this small cannot afford to print the same figure twice; the moment one is out, `2 of 3` is a
// fact the title does not carry, and it appears. `All` keeps the same company: it is there for
// exactly as long as it would do something.
function reviewWhoCount(aud, A) {
  const on = A.roster.filter(id => aud.has(id)).length;
  return on === A.roster.length ? '' : `${on} of ${A.roster.length}`;
}

function reviewWhoRows(aud, A) {
  return A.roster
    .map(id => aud.all().find(k => k.id === id))
    .filter(Boolean)
    .map(k => reviewWhoRowHtml(k, aud.has(k.id)))
    .join('');
}

// WHAT THE SEARCH OFFERS. Only what was typed — an empty box offers nothing, because a menu that
// opens onto the whole estate is the browser this card stopped being. Ten at a time, counted when
// there are more, what can be added first, and whatever is already ticked greyed in place with
// the reason (the panel's rule for an option it will not take).
const REVIEW_WHO_HITS = 10;

function reviewWhoSearch(aud, q) {
  const s = q.trim().toLowerCase();
  if (!s) return [];
  const all = aud.all().filter(k =>
    `${k.name} ${k.key || ''} ${k.property || ''} ${k.platform || ''}`.toLowerCase().includes(s));
  // What you can act on comes first. Searching `nbt` against a cohort that already holds four
  // NBT surfaces otherwise spent the top of the menu telling you so, and pushed the two you
  // could actually add below the fold.
  all.sort((a, b) => (aud.has(a.id) ? 1 : 0) - (aud.has(b.id) ? 1 : 0));
  const out = all.slice(0, REVIEW_WHO_HITS).map(k => (aud.has(k.id)
    ? { id: k.id, title: k.name, disabled: true, why: 'already in this change' }
    : { id: k.id, title: k.name, sub: reviewWhoTail(k) || undefined }));
  if (all.length > out.length) out.note = `${all.length - out.length} more — keep typing`;
  return out;
}

// A COLUMN, NOT A CARD. It arrived as a bordered box with a tinted head band, which is the one
// visual language this screen threw out on 11 Sep — *"a section is a label and a hairline, not a
// bordered box with a filled band"* — so it read as a widget pasted onto a document. It is built
// the way the evidence beside it is built now: the same micro-label in the same register on the
// same baseline, a hairline, the rows, a hairline, the way in. The two columns are siblings, and
// the only rule between them is the one that divides them.
function reviewWhoHtml(aud, A, onPick) {
  const allOn = A.roster.every(id => aud.has(id));
  return `
    <aside class="aud-col">
      <div class="aud-hd">
        <h4 class="rvw-sh">Integrations<span class="aud-count">${reviewWhoCount(aud, A)}</span></h4>
        <span class="bqs-gap"></span>
        <button type="button" class="zlink aud-all"${allOn ? ' hidden' : ''}>All</button>
      </div>
      <div class="aud-list">${reviewWhoRows(aud, A)}</div>
      <div class="aud-add">${lookupHtml({
        placeholder: 'Add an integration…',
        search: q => reviewWhoSearch(aud, q),
        emptyText: q => (q ? `No integration matches “${q}”` : 'Type a name, property or platform'),
        onPick,
      })}</div>
    </aside>`;
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
// `noFrom` (15 Sep) is for a COHORT write: the rows are the field and the answer, with no
// from-side, because forty surfaces have no single previous value to show. See reviewRowHtml.
// `steady` NAMES THE JOURNEY this review is step 2 of ('ads' / 'player', 8 Sep) rather
// than saying only "yes": each journey states its own frame height in CSS, and step 2
// reads the same one as step 1, so the footer cannot move between them.
// `audience` (15 Sep) makes the WHO editable on the screen that asks about it — see the block
// above. With it, everything a change of audience can change (the title, the change list, the
// count, the act's label) is re-read from the caller's `recount()` and written IN PLACE, and
// the card's own row is added or removed by hand — so the search field keeps its caret and the
// list keeps its scroll while you add three surfaces in a row. Without it nothing below behaves
// differently from the day it was written.
// Resolves false on cancel; on confirm, true — or `{ note }` when withNote.
function reviewChanges(opts) {
  const aud = opts.audience || null;
  // THE SCREEN'S OWN STATE. Read once from `opts`, and re-read from `recount()` whenever the
  // audience moves — so nothing on screen can be counted against a cohort that has changed.
  const st = {
    title: opts.title, okLabel: opts.okLabel, emptyText: opts.emptyText,
    changes: opts.changes || [],
  };

  // WHO IS ON SCREEN, which is not the same as who is IN. The audience shrinks when a box is
  // cleared; the roster only ever grows, so an unticked surface stays where it was — countable,
  // and one click from being back in.
  const A = { roster: aud ? aud.chosen().map(k => k.id) : [] };

  return new Promise(resolve => {
    const root = dialogRoot();
    // Hoisted, because the card's search field is wired at BUILD time and fires long after.
    function whoAdd(item) { whoFlip(item.id, true); }
    const n = () => st.changes.length;
    const capText = () => (n() ? `${n()} change${n() === 1 ? '' : 's'}` : 'No changes');
    const bodyHtml = () => `
      ${n() ? reviewBodyHtml(st.changes, opts.keepOrder, opts.noFrom)
        : `<div class="rvw-none">${esc(st.emptyText || 'Nothing to change.')}</div>`}
      ${opts.caution || ''}`;

    root.innerHTML = `
      <div class="dlg-veil"><div class="dlg rvw${opts.steady ? ` steady steady-${opts.steady}` : ''}${aud ? ' has-who' : ''}">
        <div class="rvw-head">
          <h3>${esc(st.title)}</h3>
          ${aud || !opts.kicker ? '' : `<p class="rvw-lede">${esc(opts.kicker)}</p>`}
          ${opts.subline ? `<p class="rvw-quote">${esc(opts.subline)}</p>` : ''}
        </div>
        <div class="rvw-cap">
          <span class="rvw-n">${capText()}</span>
          ${opts.foot ? `<span class="rvw-scope">${esc(opts.foot)}</span>` : ''}
        </div>
        ${aud ? `<div class="rvw-main">
          <div class="dlg-body rvw-body">${bodyHtml()}</div>
          ${reviewWhoHtml(aud, A, whoAdd)}
        </div>` : `<div class="dlg-body rvw-body">${bodyHtml()}</div>`}
        <div class="dlg-foot">
          ${opts.withNote && n() ? `<input class="rvw-note" maxlength="120" placeholder="${esc(opts.notePlaceholder || 'Add a note — optional')}">` : ''}
          <div class="rvw-acts">
            ${opts.readOnly ? `
              ${opts.thirdAct ? `<button class="btn ghost" data-act="third">${esc(opts.thirdAct)}</button>` : ''}
              <button class="btn" data-act="no">Close</button>`
            : `
              <button class="btn ghost" data-act="no">${esc(opts.cancelLabel || 'Back')}</button>
              <button class="btn ${opts.danger ? 'danger' : ''}" data-act="yes" ${n() ? '' : 'disabled'}>${esc(st.okLabel || 'Confirm')}</button>`}
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
    wireVeilDismiss(root, () => done(false));

    if (!aud) return;

    // EVERYTHING THE AUDIENCE TOUCHES, WRITTEN IN PLACE — a full repaint would take the search
    // caret and the card's scroll, and a cohort is edited several surfaces at a time, not one.
    const q = sel => root.querySelector(sel);
    const sync = () => {
      q('.dlg.rvw h3').textContent = st.title;
      q('.rvw-n').textContent = capText();
      q('.rvw-body').innerHTML = bodyHtml();
      q('.aud-count').textContent = reviewWhoCount(aud, A);
      q('.aud-all').hidden = A.roster.every(id => aud.has(id));
      const ok = q('[data-act=yes]');
      if (ok) { ok.textContent = st.okLabel || 'Confirm'; ok.disabled = !n(); }
    };
    // ONE PATH FOR BOTH DOORS — the box on a row, and a name picked out of the search. The row is
    // written by hand rather than by repainting the card, because the field you are typing in
    // lives in it: a repaint would take its caret and the list's scroll while you add three
    // surfaces in a row.
    function whoFlip(id, fromSearch) {
      // A refused untick moves nothing and repaints nothing: the refusal says so where it was
      // clicked (see `bulkWhoToggle`), and the row stays exactly as it was.
      if (aud.toggle(id) === false) return;
      Object.assign(st, aud.recount() || {});
      const list = q('.aud-list');
      let row = list.querySelector(`.aud-r[data-who="${id}"]`);
      if (!row) {
        // New to the card: it joins the roster at the end, directly above the field it was typed
        // into. A name picked back out of the search after being unticked already HAS a row — it
        // is re-ticked where it stands rather than repeated.
        A.roster.push(id);
        const k = aud.all().find(x => x.id === id);
        if (k) list.insertAdjacentHTML('beforeend', reviewWhoRowHtml(k, true));
        row = list.querySelector(`.aud-r[data-who="${id}"]`);
      } else {
        const on = aud.has(id);
        row.classList.toggle('on', on);
        row.setAttribute('aria-checked', String(on));
        row.querySelector('.shp-box').classList.toggle('on', on);
      }
      // Only a name that arrived from the search is scrolled to: a box ticked on a row you are
      // already looking at must not move the list under your hand.
      if (fromSearch && row) row.scrollIntoView({ block: 'nearest' });
      sync();
      if (!fromSearch) return;
      // THE FIELD CLEARS AND THE RESULTS GO. Re-running the search on an empty box reopened the
      // menu on its own hint — over the row that had just landed, which is the one thing the
      // person is here to see. So the field is emptied and kept focused, and the next keystroke
      // is what brings the results back (with the surface just added greyed among them, rather
      // than silently missing).
      const input = q('.aud-add .lookup input');
      if (input) { input.value = ''; input.focus(); }
    }

    q('.aud-list').onclick = e => {
      const row = e.target.closest('.aud-r');
      if (row) whoFlip(row.dataset.who);
    };
    q('.aud-list').onkeydown = e => {
      if (e.key !== 'Enter' && e.key !== ' ') return;
      const row = e.target.closest('.aud-r');
      if (!row) return;
      e.preventDefault();
      whoFlip(row.dataset.who);
    };
    // THE WAY BACK FROM UNTICKING, for as long as there is one. Clearing four boxes to try a
    // smaller cohort should not cost four clicks to undo, and the roster still holds every name.
    q('.aud-all').onclick = () => {
      for (const id of A.roster) if (!aud.has(id)) aud.toggle(id);
      Object.assign(st, aud.recount() || {});
      q('.aud-list').innerHTML = reviewWhoRows(aud, A);
      sync();
    };

    // WHICH WAY THE RESULTS OPEN, decided each time they are asked for rather than once in CSS.
    // The card is the size of its names, so the field rides down the column as the cohort grows:
    // below it is open air until the list is long enough to reach the dialog's floor, and only
    // then does the menu have to open over its own tail. Down is preferred at equal room —
    // covering nothing beats covering the list — so it flips only when below is genuinely too
    // short AND above is roomier.
    const REVIEW_WHO_MENU = 160;
    const lk = q('.aud-add .lookup');
    const place = () => {
      const d = q('.dlg.rvw').getBoundingClientRect();
      const f = lk.getBoundingClientRect();
      const below = d.bottom - f.bottom;
      lk.classList.toggle('up', below < REVIEW_WHO_MENU && f.top - d.top > below);
    };
    lk.querySelector('input').addEventListener('focus', place);
    lk.querySelector('input').addEventListener('input', place);
  });
}
