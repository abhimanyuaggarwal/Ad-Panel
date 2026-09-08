// publish.js — THE PUBLISH PLANE, one implementation for both rooms (27 Aug, user call).
//
// Save writes the draft. Publish stamps a version and swaps what the player's API reads.
// Nothing else reaches a viewer: `status` (the old live/paused field) is gone precisely
// because it was a second, quieter path to the same place.
//
// The rail is the whole feature's face. It answers three questions in one column —
// what is waiting, what went out and when, and what it did — and its one act is
// restore, which is forward-only: an old version is published again as a NEW version,
// so the thing you reverted away from is still there to go back to.

// { kind, id, name, versions, liveVersion, unpublished } for whatever editor is open.
let PUB = null;
let PUB_FILTER = 'all';   // all · published


async function loadPublish(kind, id, name) {
  const r = await API.versions(kind, id);
  PUB = { kind, id, name, ...r };
  PUB_FILTER = 'all';
  return PUB;
}

function pubClear() { PUB = null; }

// ---------- the header state: on air, off air, or waiting ----------

function pubStateChipHtml() {
  if (!PUB) return '';
  const n = (PUB.unpublished || []).length;
  const live = PUB.liveVersion != null;
  return `
    <span class="stat ${live ? 'live' : 'off'}">${live ? `On air · v${PUB.liveVersion}` : 'Off air'}</span>
    ${n ? `<span class="stat pending">${n} unpublished</span>` : ''}`;
}

// WHERE IT STANDS, AS A LIST CELL (4 Sep, user call — the round-28 column cut reversed,
// richer: the column answers the VERSION and its provenance, not just on/off).
//   Unpublished      never published — the player is served nothing yet
//   ● v3             on air, the version counted
//   ● v5 · from v2   on air, and the live version is a restore — provenance named
//   Off air          was published, taken down
// The amber unpublished count rides underneath as its own quiet line: the gap between
// draft and air is a second fact, not part of the state word. Same .stat grammar as the
// editor header's chip, so a row and its editor never disagree.
function statusCellHtml(o) {
  const state = o.live
    ? `<span class="stat live sm2">v${o.liveVersion}${o.liveRestoredFrom
        ? `<i class="st-from">· from v${o.liveRestoredFrom}</i>` : ''}</span>`
    : o.everPublished
      ? '<span class="stat off sm2">Off air</span>'
      : '<span class="stat off sm2">Unpublished</span>';
  // NO COUNT ON THE LISTING (8 Sep, user call): how MANY changes wait is a fact for the
  // page that can act on them — the rail counts them there. A list is scanned, and what
  // it needs to say is only whether this one has work waiting. Suppressed where the
  // state word already says it, so a never-published draft never reads "Unpublished"
  // twice down one cell.
  return `${state}${o.unpublishedCount && (o.live || o.everPublished)
    ? '<div class="st-gap">Unpublished</div>' : ''}`;
}

// The two buttons, in the form's foot. Publish carries the weight whenever there is
// something to publish, because at that moment it is the act the page is for.
// ---------- the rail ----------

function pubChangeLine(c) {
  const from = showVal(c.field, c.from);
  const to = showVal(c.field, c.to);
  const name = fieldName(c.field);
  const where = c.where ? `<span class="vc-where">${esc(c.where)}</span>` : '';
  // A long value makes a useless diff — say what moved, not the blob.
  const body = (from.length > 24 || to.length > 24)
    ? `${esc(name)} <span class="vc-to">${esc(clip(to, 40))}</span>`
    : `${esc(name)} <code>${esc(from)}</code> → <code>${esc(to)}</code>`;
  return `<div class="vc">${where}${body}</div>`;
}

// TWO STATES, NOT THREE (31 Aug, user call). "Saved" isolated a single row — the
// pending block — that is always the first thing in All, and whose count already sits
// in the header chip and on the Publish button. A filter that hides two rows to reveal
// one you can already see is a control with nothing to decide.
function pubFilterHtml() {
  const opt = (v, l) => `<button type="button" class="${PUB_FILTER === v ? 'on' : ''}" onclick="pubSetFilter('${v}')">${l}</button>`;
  return `<div class="seg small vfilter">${opt('all', 'All')}${opt('published', 'Published')}</div>`;
}

function pubSetFilter(v) { PUB_FILTER = v; FORM.rerender(); }

// THE RAIL IS A TIMELINE, THE SHEET IS THE READER (6 Sep, user call — inline diffs in
// a 260px column were heavy at three changes and unreadable at ten; the per-version
// change count followed 7 Sep — it said nothing the sheet doesn't). A rail row is one
// quiet entry: version · the person's note · who and when. Clicking it
// opens THE CHANGE REVIEW read-only — the same grouped room every change list here is
// read in, at any size — with Restore as the sheet's one further door.
function pubPendingHtml() {
  const n = (PUB.unpublished || []).length;
  if (!n) return '';
  return `
    <div class="v-item pending">
      <span class="v-dot"></span>
      <div class="v-head" onclick="pubPendingClicked()">
        <span class="v-t">Saved, not published</span>
        <span class="v-n">${n} change${n === 1 ? '' : 's'}</span>
      </div>
    </div>`;
}

async function pubPendingClicked() {
  await reviewChanges({
    title: 'Saved, not published',
    kicker: 'goes out on the next publish',
    changes: PUB.unpublished,
    readOnly: true,
  });
}

function pubVersionsHtml() {
  return (PUB.versions || []).map(v => {
    const isLive = v.v === PUB.liveVersion;
    return `
      <div class="v-item ${v.offAir ? 'offair' : ''} ${isLive ? 'islive' : ''}">
        <span class="v-dot"></span>
        <div class="v-head" onclick="pubVersionClicked(${v.v})">
          <span class="v-t">${v.offAir ? 'Taken off air' : `v${v.v}`}${v.restoredFrom ? ` <span class="v-from">from v${v.restoredFrom}</span>` : ''}</span>
          ${isLive ? '<span class="v-live">on air</span>' : ''}
        </div>
        ${v.note ? `<div class="v-note">${esc(v.note)}</div>` : ''}
        <div class="v-who">${esc(v.actor)} · ${relWhen(v.ts)}</div>
      </div>`;
  }).join('');
}

async function pubVersionClicked(n) {
  const ver = (PUB.versions || []).find(x => x.v === n);
  if (!ver) return;
  // ONE READING (6 Sep, user call — the two-view seg lasted an hour): an old version's
  // sheet shows only the DELTA FROM THE AIR — the question a person standing on v10
  // actually has — fetched from the same read-only preview the restore flow reads.
  // The live and off-air rows keep their own story: there is no delta to show.
  if (ver.offAir || PUB.liveVersion == null || ver.v === PUB.liveVersion) {
    await reviewChanges({
      title: ver.offAir ? `Version ${ver.v} — taken off air`
        : `Version ${ver.v}${ver.v === PUB.liveVersion ? ' — on air' : ''}${ver.restoredFrom ? ` · restored from v${ver.restoredFrom}` : ''}`,
      kicker: `${ver.actor} · ${relWhen(ver.ts)}`,
      subline: ver.note ? `“${ver.note}”` : '',
      changes: ver.changes,
      readOnly: true,
      foot: ver.offAir ? '' : 'what it changed when it went out',
    });
    return;
  }
  let compare = null;
  try { compare = await API.restorePreview(PUB.kind, PUB.id, ver.v); } catch { /* not restorable */ }
  if (!compare) {
    await reviewChanges({ title: `Version ${ver.v}`, kicker: `${ver.actor} · ${relWhen(ver.ts)}`, subline: ver.note ? `“${ver.note}”` : '', changes: ver.changes, readOnly: true, foot: 'what it changed when it went out' });
    return;
  }
  const res = await reviewChanges({
    title: `Version ${ver.v}${ver.restoredFrom ? ` · restored from v${ver.restoredFrom}` : ''}`,
    kicker: `${ver.actor} · ${relWhen(ver.ts)}`,
    subline: ver.note ? `“${ver.note}”` : '',
    changes: compare.changes,
    emptyText: 'Identical to what is on air — nothing would change.',
    readOnly: true,
    foot: `compared with v${PUB.liveVersion} on air`,
    // Identical to the air = nothing to restore — the door would only meet a refusal.
    thirdAct: compare.changes.length ? 'Restore this version…' : null,
  });
  if (res === 'act') restoreClicked(n);
}

function pubRailHtml() {
  if (!PUB) return '';
  // Published hides the one thing that is NOT on air — the saved-but-unpublished block.
  const body = `${PUB_FILTER === 'published' ? '' : pubPendingHtml()}${pubVersionsHtml()}`;
  return `
    <aside class="rail">
      <div class="rail-head">
        <div class="fieldset-title">Version history</div>
        ${pubFilterHtml()}
      </div>
      ${body || '<div class="tl-empty">No versions yet.</div>'}
    </aside>`;
}

// ---------- the acts ----------

async function publishClicked() {
  // THE WHOLE SESSION, OR NOTHING (6 Sep, user bug; re-cut 7 Sep, user call): the
  // review reads what is SAVED, so unsaved edits are saved first — QUIETLY, as part of
  // the same act, no interposing dialog (a save writes only the draft, which reaches no
  // viewer, so it needs no confirmation of its own; the publish review that follows is
  // where the whole session is read). A refused save stops the flow with its own message.
  let saveWarnings = [];
  let savedQuietly = false;
  if (PUB.dirty && PUB.dirty()) {
    const r = await PUB.saveNow({ quiet: true });
    if (PUB.dirty()) return; // the save was refused — its own message stands
    saveWarnings = r?.warnings || [];
    savedQuietly = true;
  }
  const n = (PUB.unpublished || []).length;
  const live = PUB.liveVersion != null;
  // THE REVIEW SCREEN, not a paragraph (2 Sep): publishing is the act that moves
  // traffic, so what is about to move is grouped by break and read before it goes.
  const res = await reviewChanges({
    title: live ? `Publish “${PUB.name}”` : `Put “${PUB.name}” on air`,
    changes: PUB.unpublished,
    kicker: live ? `replaces v${PUB.liveVersion} on air` : 'first version — goes on air',
    okLabel: live ? 'Publish' : 'Go on air',
    cancelLabel: 'Cancel',
    emptyText: 'Nothing to publish — what is on air is what you see.',
    // The quiet save just ran: whatever it flagged is read HERE, before the act.
    caution: pubFlagsHtml(saveWarnings),
    // The note (6 Sep, user call): one line in the person's own words, written at the
    // moment they have just re-read the session's changes — kept with the version.
    withNote: true,
    notePlaceholder: 'Add a note for the version history — optional',
  });
  if (!res) {
    // The quiet save DID happen, so it gets its receipt — and its flags were already
    // read on the screen just cancelled.
    if (savedQuietly) toast('Saved, not published');
    return;
  }
  try {
    const r = await API.publish(PUB.kind, PUB.id, res.note);
    toast(`Published · v${r.version.v}`);
    await pubReload();
  } catch (e) {
    // A refusal with no home in the page: the seam's own sentence, whole (the one
    // text the pill still carries — see toast() in util.js).
    toast(e.message, 'bad');
  }
}

// RESTORING, FROM THE SEAT OF THE PERSON DOING IT (27 Aug, user review of the first cut).
// Four questions, all of which the first version left unanswered:
//   1. What actually changes if I do this? — NOT what this version did the day it went
//      out. Going back to v2 from v5 is a different diff, and showing the old one is how
//      someone restores the wrong thing. Counted from what is ON AIR right now.
//   2. What am I about to lose? — a restore overwrites the open draft. Saved-but-
//      unpublished work disappearing silently is the one unforgivable thing here.
//   3. Where am I going back to? — whose version, from when.
//   4. Can I undo it? — yes, and the dialog says so by naming the number this lands as
//      and the number that stays behind.
// SOFT FLAGS, READ BEFORE THE ACT INSTEAD OF AFTER IT (7 Sep, user call). A save's
// warnings used to ride the receipt as extra lines — "Saved" and then a paragraph in a
// two-second pill nobody is looking at. They are levers, not walls, so they belong on THE
// CHANGE REVIEW: the one screen where the traffic about to move is already being read,
// with room to read them and no clock. Amber, under the change list, above the act.
function pubFlagsHtml(flags) {
  if (!flags || !flags.length) return '';
  return `<div class="rvw-warn soft">
      <b>Worth a look</b>
      ${flags.map(f => `<div class="vc">${esc(f)}</div>`).join('')}
    </div>`;
}

async function restoreClicked(v) {
  let pre;
  try {
    pre = await API.restorePreview(PUB.kind, PUB.id, v);
  } catch (e) {
    toast(e.message, 'bad');
    return;
  }

  // Already what is on air: there is nothing to restore, and saying so beats a dialog
  // whose OK button would be refused a second later.
  if (!pre.changes.length) {
    await ask({
      title: `v${v} is already what is on air`,
      body: `<p class="dlg-note">Nothing would change. v${pre.liveVersion} holds the same configuration as v${v}.</p>`,
      okLabel: 'Close', noCancel: true,
    });
    return;
  }

  const lost = pre.discards.length;
  // ONE SCREEN FOR BOTH ACTS (6 Sep, user call): restore reads back on THE CHANGE
  // REVIEW, exactly like publish — the list is what going back CHANGES, counted from
  // what is on air now; the kicker carries whose version and where this lands; the one
  // warning worth a block is the counted draft work a restore would discard, read last.
  const res = await reviewChanges({
    title: `Restore v${v}?`,
    kicker: `goes on air as v${pre.nextVersion} — v${pre.liveVersion} stays in history`,
    changes: pre.changes,
    caution: lost ? `<div class="rvw-warn">
        <b>${lost} unpublished draft change${lost === 1 ? '' : 's'} will be discarded</b>
        ${pre.discards.map(pubChangeLine).join('')}
      </div>` : '',
    okLabel: `Restore — on air as v${pre.nextVersion}`,
    cancelLabel: 'Cancel',
    danger: lost > 0,
    withNote: true,
    notePlaceholder: 'Why you went back — optional, kept with the version',
  });
  if (!res) return;
  try {
    const r = await API.restoreVersion(PUB.kind, PUB.id, v, res.note);
    toast(`Restored · v${r.version.v}`);
    // The draft followed the restore, so the editor is re-read, never patched.
    if (typeof PUB.onRestored === 'function') PUB.onRestored();
  } catch (e) {
    toast(e.message, 'bad');
  }
}

async function pubReload() {
  const { onRestored, dirty, saveNow } = PUB;
  await loadPublish(PUB.kind, PUB.id, PUB.name);
  Object.assign(PUB, { onRestored, dirty, saveNow });
  FORM.rerender();
}


// ---------- TAKE OFF AIR (7 Sep, UAT P2) ----------
// The publish plane always had unpublish; nothing in the UI reached it, so a live
// integration could never be deleted — Delete just kept saying "take it off air first".
// It is the inverse of Publish, so it lives here, behind a confirm that names the
// consequence: the player stops being served, the draft and every version stay.
// RENAMED 8 Sep (user call): the ACT is *Deactivate* — the word an operator looks for
// when they want something to stop. The STATE it leaves is still `Off air`, which is
// this app's own word for it everywhere it is read back (the status chip, the version
// rail's "Taken off air", the delete refusal). Act and state, two words, on purpose.
async function takeOffAirClicked(kind, id, name) {
  const ok = await ask({
    title: `Deactivate “${name}”?`,
    body: kind === 'key'
      ? 'The player stops being served for this surface. Its draft and every version stay — Publish puts it back.'
      : 'Every break filling from it stops being served. Its draft and every version stay — Publish puts it back.',
    okLabel: 'Deactivate',
    danger: true,
  });
  if (!ok) return;
  try {
    await API.unpublish(kind, id);
    await pubReload();
    toast('Deactivated');
  } catch (e) {
    // The seam refuses a setup still feeding a live surface, and names it.
    toast(e.message, 'bad');
  }
}
