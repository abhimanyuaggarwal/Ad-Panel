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
let PUB_OPEN = null;      // which version's changes are unfolded

async function loadPublish(kind, id, name) {
  const r = await API.versions(kind, id);
  PUB = { kind, id, name, ...r };
  PUB_FILTER = 'all';
  PUB_OPEN = null;
  return PUB;
}

function pubClear() { PUB = null; }

// ---------- the header state: on air, off air, or waiting ----------

function pubStateChipHtml() {
  if (!PUB) return '';
  const n = (PUB.unpublished || []).length;
  const live = PUB.liveVersion != null;
  return `
    <span class="stat ${live ? 'live' : 'off'}" title="${live
      ? `On air as v${PUB.liveVersion} — this is what the player is being served`
      : 'Not on air — the player is served nothing for this'}">${live ? `On air · v${PUB.liveVersion}` : 'Off air'}</span>
    ${n ? `<span class="stat pending" title="Saved but not published — the player has not seen ${n === 1 ? 'it' : 'them'} yet">${n} unpublished</span>` : ''}`;
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
function pubToggle(v) { PUB_OPEN = PUB_OPEN === v ? null : v; FORM.rerender(); }

// The pending block is the "saved" half of the timeline: everything Save has written
// that Publish has not sent. One entry, however many saves made it — what matters is
// the gap between the draft and the air, not how many times someone pressed Save.
function pubPendingHtml() {
  const n = (PUB.unpublished || []).length;
  if (!n) return '';
  const open = PUB_OPEN === 'pending';
  return `
    <div class="v-item pending ${open ? 'open' : ''}">
      <span class="v-dot"></span>
      <div class="v-head" onclick="pubToggle('pending')">
        <span class="v-t">Saved, not published</span>
        <span class="v-n">${n} change${n === 1 ? '' : 's'}</span>
        <span class="v-chev">›</span>
      </div>
      ${open ? `<div class="v-changes">${PUB.unpublished.map(pubChangeLine).join('')}</div>` : ''}
    </div>`;
}

function pubVersionsHtml() {
  return (PUB.versions || []).map(v => {
    const open = PUB_OPEN === v.v;
    const isLive = v.v === PUB.liveVersion;
    return `
      <div class="v-item ${v.offAir ? 'offair' : ''} ${isLive ? 'islive' : ''} ${open ? 'open' : ''}">
        <span class="v-dot"></span>
        <div class="v-head" onclick="pubToggle(${v.v})" title="${open ? 'Hide what this version changed' : 'See what this version changed'}">
          <span class="v-t">${v.offAir ? 'Taken off air' : `v${v.v}`}${v.restoredFrom ? ` <span class="v-from">from v${v.restoredFrom}</span>` : ''}</span>
          ${isLive ? '<span class="v-live">on air</span>' : ''}
          <span class="v-n">${v.changes.length ? `${v.changes.length} change${v.changes.length === 1 ? '' : 's'}` : '—'}</span>
          <span class="v-chev">›</span>
        </div>
        <div class="v-who">${esc(v.actor)} · ${relWhen(v.ts)}</div>
        ${open ? `
          <div class="v-changes">${v.changes.map(pubChangeLine).join('') || '<div class="vc muted">no field changes</div>'}</div>
          ${!isLive && !v.offAir ? `<button type="button" class="zlink v-restore" onclick="restoreClicked(${v.v})"
            title="See what going back to v${v.v} would change, before committing to it">Restore this version…</button>` : ''}
        ` : ''}
      </div>`;
  }).join('');
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
  const n = (PUB.unpublished || []).length;
  const live = PUB.liveVersion != null;
  // THE REVIEW SCREEN, not a paragraph (2 Sep): publishing is the act that moves
  // traffic, so what is about to move is grouped by break and read before it goes.
  const ok = await reviewChanges({
    title: live ? `Publish ${n} change${n === 1 ? '' : 's'} to “${PUB.name}”?` : `Put “${PUB.name}” on air?`,
    changes: PUB.unpublished,
    kicker: live ? `replaces v${PUB.liveVersion} on air` : 'first version — goes on air',
    okLabel: live ? 'Publish' : 'Go on air',
    cancelLabel: 'Cancel',
    emptyText: 'Nothing to publish — what is on air is what you see.',
  });
  if (!ok) return;
  try {
    const r = await API.publish(PUB.kind, PUB.id);
    toast(`Published — v${r.version.v} is on air`);
    (r.warnings || []).forEach(w => toast(w, 'warn'));
    await pubReload();
  } catch (e) {
    // The seam refuses by name; a refusal that names surfaces shows them whole.
    toast(e.usedBy?.length ? `${e.message}` : e.message, 'bad');
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

  const n = pre.changes.length;
  const lost = pre.discards.length;
  const body = `
    <div class="rst">
      <div class="rst-hop">
        <span class="rst-a">Current<b>v${pre.liveVersion}</b></span>
        <span class="rst-arrow">→</span>
        <span class="rst-b">Restore to<b>v${v}</b></span>
        <span class="rst-when">${esc(pre.actor)} · ${relWhen(pre.ts)}</span>
      </div>
      <div class="rst-t">${n} configuration change${n === 1 ? '' : 's'}</div>
      <div class="cons rst-list">${pre.changes.map(pubChangeLine).join('')}</div>
      ${lost ? `<div class="rst-warn">
        <b>${lost} unpublished change${lost === 1 ? '' : 's'} in your draft will be discarded.</b>
        Restoring overwrites the draft with v${v}. Publish or note ${lost === 1 ? 'it' : 'them'} first if you want to keep ${lost === 1 ? 'it' : 'them'}.
        <div class="cons rst-lost">${pre.discards.map(pubChangeLine).join('')}</div>
      </div>` : ''}
      <p class="dlg-note">Goes on air as <b>v${pre.nextVersion}</b>. v${pre.liveVersion} stays in the history, so this is undoable the same way.</p>
    </div>`;

  const ok = await ask({
    title: `Restore v${v}?`,
    body,
    okLabel: `Restore & publish as v${pre.nextVersion}`,
    danger: lost > 0,
  });
  if (!ok) return;
  try {
    const r = await API.restoreVersion(PUB.kind, PUB.id, v);
    toast(`v${v} restored — live as v${r.version.v}`);
    // The draft followed the restore, so the editor is re-read, never patched.
    if (typeof PUB.onRestored === 'function') PUB.onRestored();
  } catch (e) {
    toast(e.message, 'bad');
  }
}

async function pubReload() {
  const onRestored = PUB.onRestored;
  await loadPublish(PUB.kind, PUB.id, PUB.name);
  PUB.onRestored = onRestored;
  FORM.rerender();
}
