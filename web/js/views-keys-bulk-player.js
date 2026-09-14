// views-keys-bulk-player.js — the two PLAYER bulk sheets over a selection:
//   · Custom player behaviour — master-detail: every integration's default player and
//     named configs, edited together, reviewed, written as drafts (API.updateKey)
//   · Default player behaviour — one step: blanket-set the default player's facts across
//     the selection (the `playerFields` bulk action)
// Loads after views-keys-bulk-ads.js; uses the list file's selection helpers at runtime.

// ---------- CHANGE PLAYER BEHAVIOUR (2 Sep, user call) ----------
// The bulk bar's second object: every player config of every selected integration —
// Default first, then each named fork — on one sheet, read and edited together. One
// bordered group per integration (the review's own anatomy), one row per config, the
// three per-placement facts as columns. Edits queue in a draft; Review reads them back
// grouped the same way before a single draft is written. Publishing stays per surface.
let PB_DRAFT = null;   // { keys: [{ id, name, platform, player, playerConfigs, orig }] }

function playerBehaviourJourney() {
  if (!KSEL.size) return;
  PB_DRAFT = {
    keys: selectedKeys().map(k => ({
      id: k.id, name: k.name, platform: k.platform,
      player: JSON.parse(JSON.stringify(k.player)),
      playerConfigs: JSON.parse(JSON.stringify(k.playerConfigs || [])),
      orig: JSON.parse(JSON.stringify({ player: k.player, playerConfigs: k.playerConfigs || [] })),
    })),
  };
  renderPBScreen();
}

function closePBScreen() {
  PB_DRAFT = null;
  PB_SEL = { ki: 0, ci: -1 };
  document.getElementById('dialog-root').innerHTML = '';
}

// ci = -1 is the Default (the key's own player); 0.. are the named forks.
function pbCfg(k, ci) { return ci < 0 ? k.player : k.playerConfigs[ci]; }

function pbSet(ki, ci, f, v) {
  pbCfg(PB_DRAFT.keys[ki], ci)[f] = v;
  renderPBScreen();
}

// Every field one config moved, in the panel's words — the review rows and the foot's
// count read the same list.
function pbChanges() {
  const out = [];
  const word = (f, v) => pbFieldWord(f, v);
  for (const k of PB_DRAFT.keys) {
    const pairs = [[-1, 'Default', k.player, k.orig.player]];
    k.playerConfigs.forEach((c, i) => {
      const o = k.orig.playerConfigs.find(x => x.id === c.id);
      if (o) pairs.push([i, c.name, c, o]);
    });
    for (const [ci, cfgName, cur, orig] of pairs) {
      // ONE LIST, DRAWN IN TWO PLACES (11 Sep). The facts a fork may carry went from
      // three to six, and this sheet's own promise — "a new player-config fact is one
      // more form row HERE and nowhere else" — only holds if it reads the same list the
      // integration page reads. `pcFields()` is that list; the seam holds it too
      // (CONFIG_FORKABLE), so a fork edited here can never lose a field it carries there.
      // Passive volume is still not among them: it is the PLAYER's one volume (7 Sep).
      for (const f of pcFields().map(d => d.f)) {
        if (JSON.stringify(cur[f]) !== JSON.stringify(orig[f])) {
          out.push({
            where: `${k.name} · ${cfgName}`, field: f,
            fromText: word(f, orig[f]),
            toText: word(f, cur[f]),
            ki: PB_DRAFT.keys.indexOf(k), ci,
          });
        }
      }
    }
  }
  return out;
}

// MASTER-DETAIL (3 Sep, user call — a column per field cannot scale): the left rail
// is every selected integration's configs, Default first; the right pane is the
// SELECTED config's whole field form, which grows DOWNWARD as configs grow fields —
// n fields is a longer form, never a wider table. A config this sheet moved wears the
// accent bar on its rail row; the counted foot and the change review are unchanged.
let PB_SEL = { ki: 0 };

// The rail picks an INTEGRATION; a queue row picks one and scrolls its config into
// view, so a change you queued three surfaces ago is still one click from its form.
function pbSelect(ki, ci) {
  PB_SEL = { ki };
  renderPBScreen();
  if (ci === undefined) return;
  const el = document.getElementById(`pbg-${ci}`);
  if (el) el.scrollIntoView({ block: 'nearest' });
}

// ONE ROW PER INTEGRATION (3 Sep, user call). The rail used to list every config of
// every surface — with six surfaces that is thirty rows to walk, and the configs of one
// integration were never on screen together. Now the rail is the cohort and the right
// side is one integration WHOLE: its default, then each named fork.
// The rail is the cohort AND the change map: a surface with edits carries the count,
// so "what have I touched, and where" is answered without a second list of the same
// changes in different words. The names already carry the platform.
function pbRailHtml() {
  return PB_DRAFT.keys.map((k, ki) => {
    const n = pbChanges().filter(c => c.ki === ki).length;
    return `
      <button type="button" class="pbr-row ${PB_SEL.ki === ki ? 'sel' : ''} ${n ? 'dirty' : ''}"
        onclick="pbSelect(${ki})">
        <span class="pbr-n">${esc(k.name)}</span>
        ${n ? `<span class="pbr-count">${n}</span>` : ''}
      </button>`;
  }).join('');
}

// The selected config's form — the SAME rows the integration page draws, stacked so a
// future fourth or tenth fact is one more row here and nowhere else.
// The selected integration, WHOLE: its default and every named fork, each a small
// bounded block of the same three rows. A future fourth or tenth fact is one more row
// here and nowhere else.
// THE CHANGE LIVES WHERE THE CHANGE WAS MADE (3 Sep, user call — the queue on top is
// gone). A strip above the form said the same thing twice in two vocabularies, a screen
// apart, and grew downward as you worked — so the form moved under the cursor and the
// dialog changed size. Now a moved field says so in its own row: an accent bar, the
// value it held, and an × that puts it back. The rail counts them per surface, and
// Review still reads every one before anything lands.
// The word for a value, from the same definition that draws its control — so the rail,
// the "was" and the review can never spell one answer three ways.
function pbFieldWord(f, v) {
  const d = pcFields().find(x => x.f === f);
  return d ? d.word(v ?? d.dflt) : String(v);
}
function pbWasWord(f, v) { return pbFieldWord(f, v); }

function pbConfigBlockHtml(ki, ci) {
  const k = PB_DRAFT.keys[ki];
  const c = pbCfg(k, ci);
  const meta = KL_META;
  const orig = ci < 0 ? k.orig.player : k.orig.playerConfigs.find(x => x.id === c.id);
  const moved = f => !!orig && JSON.stringify(c[f]) !== JSON.stringify(orig[f]);
  const rowMoved = f => moved(f);
  const wasWord = f => pbWasWord(f, orig[f]);
  const frow = (f, lbl, ctl, why) => {
    const m = rowMoved(f);
    return `
    <div class="pbd-r ${m ? 'moved' : ''}"${why ? ` title="${esc(why)}"` : ''}>
      <span class="pbd-l">${esc(lbl)}</span>
      <span class="pbd-c">${ctl}</span>
      <span class="pbd-s">${m ? `<span class="pbd-was">was ${esc(wasWord(f))}</span>
        <button type="button" class="pbd-x" onclick="pbDropField(${ki}, ${ci}, '${f}')">×</button>` : ''}</span>
    </div>`;
  };
  // The form grows DOWNWARD as a config grows facts — n fields is a longer form, never
  // a wider table. Six rows today, in the integration page's own order and grouped under
  // its own section names, so the sheet and the page read as one document.
  let lastSec = '';
  const rows = pcFields().map(d => {
    const head = d.sec !== lastSec ? `<div class="pbd-sec">${esc(d.sec)}</div>` : '';
    lastSec = d.sec;
    return head + frow(d.f, d.l,
      accSeg(c[d.f] ?? k.player[d.f] ?? d.dflt, d.seg[0], d.seg[1],
        o => `pbSet(${ki}, ${ci}, '${d.f}', ${typeof o === 'string' ? `'${o}'` : o})`));
  }).join('');
  return `
    <div class="pbd-g" id="pbg-${ci}">
      <div class="pbd-gh">${esc(ci < 0 ? 'Default' : c.name)}</div>
      ${rows}
    </div>`;
}

function pbDetailHtml() {
  const { ki } = PB_SEL;
  const k = PB_DRAFT.keys[ki];
  return `
    <div class="pbd-h">${esc(k.name)}</div>
    ${[-1, ...k.playerConfigs.map((_, ci) => ci)].map(ci => pbConfigBlockHtml(ki, ci)).join('')}`;
}


// THE QUEUE ON TOP (3 Sep, user call — the ad sheet's own logic): what this sheet has
// changed collects in one strip above the rail and form, each row one change — where it
// lands, what it was, what it becomes — with the ad sheet's exact anatomy: × drops it,
// clicking it jumps the rail to that config. Review (step 2) then reads the same list.
function pbDropField(ki, ci, f) {
  const k = PB_DRAFT.keys[ki];
  const cur = pbCfg(k, ci);
  const orig = ci < 0 ? k.orig.player : k.orig.playerConfigs.find(x => x.id === cur.id);
  if (!orig) return;
  cur[f] = JSON.parse(JSON.stringify(orig[f]));
  renderPBScreen();
}


function renderPBScreen() {
  const d = PB_DRAFT;
  const n = pbChanges().length;
  document.getElementById('dialog-root').innerHTML = `
    <div class="dlg-veil"><div class="dlg bulk pb steady">
      <h3>Custom player behaviour<span class="dlg-kicker">${d.keys.length} integration${d.keys.length > 1 ? 's' : ''}</span></h3>
      <div class="dlg-body pb-body">
        <div class="pb-split">
          <div class="pbr scrolly">${pbRailHtml()}</div>
          <div class="pbd">${pbDetailHtml()}</div>
        </div>
      </div>
      <div class="dlg-foot">
        <button class="btn ghost" onclick="closePBScreen()">Cancel</button>
        <button class="btn" id="pb-next" ${n ? '' : 'disabled'}
          onclick="pbReview()">${n ? `Review ${n} change${n === 1 ? '' : 's'}` : 'Review changes'}</button>
      </div>
    </div></div>`;
}

async function pbReview() {
  const changes = pbChanges();
  if (!changes.length) return;
  const touched = PB_DRAFT.keys.filter(k =>
    JSON.stringify({ player: k.player, playerConfigs: k.playerConfigs }) !== JSON.stringify(k.orig));
  const ok = await reviewChanges({
    title: `Apply to ${touched.length} integration${touched.length > 1 ? 's' : ''}?`,
    kicker: 'player behaviour — drafts only',
    changes,
    okLabel: `Apply to ${touched.length}`,
    cancelLabel: 'Back',
    // Step 2 of the master-detail sheet: same footprint (see .dlg.rvw.steady-player).
    steady: 'player',
  });
  if (!ok) { renderPBScreen(); return; }
  let saved = 0;
  for (const k of touched) {
    try {
      await API.updateKey(k.id, { player: k.player, playerConfigs: k.playerConfigs });
      saved++;
    } catch (e) {
      toast(`${k.name}: ${e.message}`, 'bad');
    }
  }
  closePBScreen();
  toast(`${saved} draft${saved === 1 ? '' : 's'} written`);
  await refreshKeysList();
}

// ---------- BULK: DEFAULT PLAYER BEHAVIOUR (3 Sep, user call — the third act) ----------
// Custom player behaviour walks each integration's configs one by one; this one act
// blanket-sets the DEFAULT player's three facts across the whole selection. Custom
// configs are never touched — they are each surface's own, edited in the other sheet.
// The sheet reads its own change back — a set row shows “was <today>” beside its value —
// and Apply then ends on THE CHANGE REVIEW like the other two bulk acts (7 Sep, UAT P2:
// the one-step exception made this the only cohort write nobody read first).
let DC_DRAFT = null;   // { fields: {}, open: Set }

function defaultConfigJourney() {
  if (!KSEL.size) return;
  DC_DRAFT = { fields: {}, open: new Set() };
  renderDCScreen();
}

function closeDCScreen() {
  DC_DRAFT = null;
  document.getElementById('dialog-root').innerHTML = '';
}

// What the selection holds today, counted — one word when they agree, the spread when
// they don't. Never a suggestion, never a preselected answer.
function dcTodayWord(f) {
  const words = [];
  for (const k of selectedKeys()) {
    const p = k.player || {};
    let w;
    const w0 = pcFields().find(x => x.f === f);
    w = w0 ? w0.word(p[f] ?? w0.dflt) : String(p[f]);
    if (!words.includes(w)) words.push(w);
  }
  if (words.length === 1) return words[0];
  if (words.length <= 3) return words.join(' · ');
  return `${words.length} different values`;
}

function dcOpen(f) { DC_DRAFT.open.add(f); renderDCScreen(); }

function dcUnset(f) {
  DC_DRAFT.open.delete(f);
  delete DC_DRAFT.fields[f];
  renderDCScreen();
}

function dcSet(f, v) {
  DC_DRAFT.fields[f] = v;
  renderDCScreen();
}

function dcRowHtml(f, lbl, ctl, why) {
  const set = DC_DRAFT.fields[f] !== undefined;
  const open = set || DC_DRAFT.open.has(f);
  if (!open) {
    return `
    <div class="bqf-r closed" onclick="dcOpen('${f}')"${why ? ` title="${esc(why)}"` : ''}>
      <span class="bqf-l">${esc(lbl)}</span>
      <span class="bqf-today">${esc(dcTodayWord(f))}</span>
      <span class="bqf-set">Set</span>
    </div>`;
  }
  return `
    <div class="bqf-r open ${set ? 'queued' : ''}"${why ? ` title="${esc(why)}"` : ''}>
      <span class="bqf-l">${esc(lbl)}</span>
      <span class="bqf-c form">${ctl()}</span>
      <span class="bqf-s">${set
        ? `<span class="bqf-was">was ${esc(dcTodayWord(f))}</span>`
        : `<span class="bqf-today">${esc(dcTodayWord(f))}</span>`}
        <button type="button" class="bqs-x on" onclick="dcUnset('${f}')">×</button></span>
    </div>`;
}

function renderDCScreen() {
  if (!DC_DRAFT) return;
  const meta = KL_META;
  const f = DC_DRAFT.fields;
  const n = Object.keys(f).length;
  const keys = selectedKeys();
  document.getElementById('dialog-root').innerHTML = `
    <div class="dlg-veil"><div class="dlg sheet">
      <h3>Default player behaviour<span class="dlg-kicker">${keys.length} integration${keys.length > 1 ? 's' : ''} · custom configs keep their own values</span></h3>
      <div class="dlg-body">
        ${pcFields().map(d => dcRowHtml(d.f, d.l,
          () => accSeg(f[d.f], d.seg[0], d.seg[1],
            o => `dcSet('${d.f}', ${typeof o === 'string' ? `'${o}'` : o})`))).join('')}
      </div>
      <div class="dlg-foot">
        <span class="rvw-count">${n ? `${n} change${n === 1 ? '' : 's'} · ${keys.length} integration${keys.length > 1 ? 's' : ''}` : ''}</span>
        <button class="btn ghost" onclick="closeDCScreen()">Cancel</button>
        <button class="btn" ${n ? '' : 'disabled'} onclick="dcApply()">Apply</button>
      </div>
    </div></div>`;
}

function dcValueWord(f, v) { return pbFieldWord(f, v); }

function dcChanges() {
  // The same six this sheet draws (11 Sep) — words from the one definition, so the
  // review can never name a field differently from the row that moved it.
  const words = Object.fromEntries(pcFields().map(d => [d.f, d.l]));
  return Object.keys(DC_DRAFT.fields).map(f => ({
    where: 'Default player', field: f, label: words[f] || f,
    fromText: dcTodayWord(f), toText: dcValueWord(f, DC_DRAFT.fields[f]),
  }));
}

async function dcApply() {
  const f = DC_DRAFT.fields;
  if (!Object.keys(f).length) return;
  const fields = { ...f };
  const keys = selectedKeys();
  const names = keys.slice(0, 2).map(k => k.name).join(', ') + (keys.length > 2 ? ` +${keys.length - 2} more` : '');
  const changes = dcChanges();
  closeDCScreen();
  const ok = await reviewChanges({
    title: `Apply to ${keys.length} integration${keys.length > 1 ? 's' : ''}?`,
    kicker: names,
    changes,
    okLabel: `Apply to ${keys.length}`,
    cancelLabel: 'Back',
  });
  // Back leaves the sheet exactly as it was — the levers are still there to edit.
  if (!ok) { DC_DRAFT = { fields, open: new Set(Object.keys(fields)) }; renderDCScreen(); return; }
  await bulkApplyDirect('playerFields', { fields });
  await refreshKeysList();
}
