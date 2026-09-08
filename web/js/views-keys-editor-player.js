// views-keys-editor-player.js — the integration page's PLAYER: the player fields inside
// Details (playback, fallback media, passive volume) plus the default player's three
// forkable facts, and the CUSTOM PLAYER CONFIGS table below them — named forks a player
// asks for by key, each carrying playback mode, Expand MiniTV and autoplay.
// ---------- the player's writers ----------
// The Details player fields write here; a segmented pick repaints, typing does not.
function pSet(f, val) {
  FORM.data.player[f] = val;
  clearErr(f);
  FORM.rerender();
}

function pNum(el, f) {
  FORM.data.player[f] = Number(el.value);
  QF_TEXT[`p:${f}`] = el.value;
  paintChg();
}

function pText(el, f) {
  FORM.data.player[f] = el.value;
  QF_TEXT[`p:${f}`] = el.value;
  paintChg();
}

// ---------- the player, inside Details (3 Sep, user call — the Default label is gone) ----------
// The default player IS the surface's own answer, so its fields sit in Details like any
// other fact of the surface: the playback surface and fallback, then the three facts a
// custom config may fork (playback mode, Expand MiniTV, autoplay behaviour + volume).
// Custom configs are their own CARDS below — a named fork per card; everything a fork
// doesn't carry follows these fields. The 25 Aug trim stands: preload, cellular cap,
// controls/seek, end-of-video and the ad-chrome group stay the publisher's player's.
function playerFieldsHtml() {
  const p = FORM.data.player;
  const meta = KL_META;
  const tv = f => QF_TEXT[`p:${f}`] ?? (p[f] ?? '');
  // ONE GRID (3 Sep, user call — "odd and immature"): the player's rows used to break
  // the card's rhythm. A 240px select next to a 1100px text box read as broken, and the
  // three facts bunched into the left third with dead space beside them. Now every
  // player field takes an even share of the row, so the block reads as the same grid the
  // identity rows above it are drawn on.
  // TWO ROWS (3 Sep, user call). Playback, Fallback media and Passive volume are all SHORT
  // answers (a mode, a media id, a number) — they share one row at their natural widths,
  // like Property and Platform above them.
  // THE DEFAULT IS ROW ZERO OF THE CONFIGS — LITERALLY, NOW (7 Sep, user call: the strip
  // was "too disoriented and not pleasing to the eyes"). It used to be drawn HERE on the
  // config table's grid in a different card: near-alignment with the real table below,
  // and the same three labels printed twice — sentence-case field labels floating over
  // this row, uppercase column heads over that one, 90px apart. Two half-tables reading
  // as one broken table. The row moved into the configs table as its first row, under
  // the ONE heading row, so the labels are said once and the columns actually line up.
  // Details keeps only what is the PLAYER's rather than a config's: type, fallback
  // media, passive volume.
  return `
    <div class="frow prow2">
      <div class="field" data-field="player.playbackMode"><label>Player type</label>
        <div class="fctl">
          ${selectHtml(p.playbackMode, meta.playbackModes.map(v => ({ v, label: label('playbackMode', v) })), v => pSet('playbackMode', v))}
          ${p.playbackMode === 'inline_redirect' ? `<span class="rule-text"><input type="text" class="mono" value="${esc(tv('redirectUrl'))}" placeholder="https://…" oninput="pText(this, 'redirectUrl')"></span>` : ''}
        </div>
      </div>
      ${textFieldHtml('Fallback media', 'fallbackMediaId', { placeholder: 'media id', mono: true })}
      <div class="field" data-field="player.passiveVolume">
        <label>Passive volume</label>
        <div class="num-wrap sm"><input value="${esc(QF_TEXT['p:passiveVolume'] ?? (p.passiveVolume ?? ''))}" placeholder="100" inputmode="numeric"
          oninput="pNum(this, 'passiveVolume')"><span class="unit">%</span></div>
      </div>
    </div>`;
}

// ADDING IS TYPING (3 Sep, user call — the naming dialog is gone). A dialog to name a
// row, then the row, was two screens for one act; now the row appears where it will live
// with the caret already in its key, and the three facts are born a photocopy of the
// default's — so the row is finished the moment the key is typed. The ladder's grammar
// exactly: an unnamed row blocks the next add, instead of a dialog blocking the page.
function pcAdd() {
  const cfgs = FORM.data.playerConfigs || (FORM.data.playerConfigs = []);
  const max = KL_META.maxPlayerConfigs || 6;
  if (cfgs.length >= max) { toast(`At most ${max} configs`, 'warn'); return; }
  if (cfgs.some(c => !(c.name || '').trim())) { pcFocusEmpty(); return; }
  const p = FORM.data.player;
  cfgs.push({
    name: '',
    on: true,
    playback: p.playback ?? 'active',
    expandInMini: p.expandInMini ?? true,
    autoplay: p.autoplay ?? 'auto',
  });
  clearErr('playerConfigs');
  FORM.rerender();
  pcFocusEmpty();
}

// The caret goes where the typing goes — after the repaint, never during it.
function pcFocusEmpty() {
  requestAnimationFrame(() => {
    const el = document.querySelector('.pcfg-r.wants .pcfg-key');
    if (el) { el.focus(); el.select(); }
  });
}

// The add button is a stateful bit inside a painted table: while someone is typing a key
// it is toggled BY HAND, because repainting the table would take their caret with it.
function pcSyncAdd() {
  const btn = document.querySelector('.pcc-add');
  if (!btn) return;
  const cfgs = FORM.data.playerConfigs || [];
  const max = KL_META.maxPlayerConfigs || 6;
  const full = cfgs.length >= max;
  const unnamed = cfgs.some(c => !(c.name || '').trim());
  btn.disabled = full || unnamed;
  btn.title = full ? `At most ${max} custom configs per integration`
    : unnamed ? 'Key the row above first' : 'Another config a player can ask for by key';
}

async function pcRemove(i) {
  const c = (FORM.data.playerConfigs || [])[i];
  if (!c) return;
  // An unnamed row is a row nobody has made yet — it goes without a question.
  if (!(c.name || '').trim()) {
    FORM.data.playerConfigs.splice(i, 1);
    clearErr('playerConfigs');
    FORM.rerender();
    return;
  }
  const ok = await ask({
    title: `Remove “${c.name}”?`,
    body: 'Players asking for it fall back to the default from the next publish.',
    okLabel: 'Remove', danger: true,
  });
  if (!ok) return;
  FORM.data.playerConfigs.splice(i, 1);
  for (const k of Object.keys(QF_TEXT)) if (k.startsWith('pc:')) delete QF_TEXT[k];
  clearErr('playerConfigs');
  FORM.rerender();
}

// Removing a row can fire the departing input's blur AFTER its config is gone, so every
// row writer checks that the row it was addressed to still exists.
function pcSet(i, f, val) {
  const c = (FORM.data.playerConfigs || [])[i];
  if (!c) return;
  c[f] = val;
  clearErr('playerConfigs');
  FORM.rerender();
}

// Typing a key never repaints the table — the row's own state and the add button are
// toggled in place instead, so the caret stays where the person put it.
function pcName(el, i) {
  const c = (FORM.data.playerConfigs || [])[i];
  if (!c) return;
  c.name = el.value;
  clearErr('playerConfigs');
  el.closest('.pcfg-r')?.classList.toggle('wants', !el.value.trim());
  pcSyncAdd();
}

// On the way out, the key is held to the rules the SERVER holds it to — the same three
// refusals, said here first: one word, not "default", and not a key already in the table
// (a player asking by key must find exactly one row). An empty key stays quiet: the row
// is simply unfinished, and keyPayload never sends it.
// A BAD KEY IS REFUSED WHERE IT WAS TYPED (7 Sep, UAT P1): the field goes red with the
// reason under it, what was typed stays visible, and Save stops on the page while any
// key is bad — a reserved or duplicate key never reaches the payload.
const PC_BAD = new WeakMap();
function pcKeyWhy(v, i) {
  if (!v) return '';
  if (!/^[A-Za-z0-9_-]{1,24}$/.test(v)) return 'A key is one word — letters, digits, - or _';
  if (v.toLowerCase() === 'default') return '“default” is the player’s own — pick another key';
  if ((FORM.data.playerConfigs || []).some((c, j) => j !== i && (c.name || '').trim().toLowerCase() === v.toLowerCase())) return `“${v}” is already here`;
  return '';
}
function pcKeyDone(el, i) {
  const c = (FORM.data.playerConfigs || [])[i];
  if (!c) return;
  const v = (el.value || '').trim();
  el.value = v;
  c.name = v;
  el.closest('.pcfg-r')?.classList.toggle('wants', !v);
  pcSyncAdd();
  const why = pcKeyWhy(v, i);
  const id = el.closest('.pcfg-id');
  id?.querySelector('.pcfg-msg')?.remove();
  if (why) {
    PC_BAD.set(c, why);
    el.classList.add('err');
    id?.insertAdjacentHTML('beforeend', `<span class="field-err pcfg-msg">${esc(why)}</span>`);
  } else {
    PC_BAD.delete(c);
    el.classList.remove('err');
  }
}


// The per-placement facts, drawn the same way on every tab. `set` and `num` are the
// tab's own writers; the volume rides the autoplay behaviour and appears only where a
// player starts unmuted — one compound field, exactly as the old Details row read.
// The three behaviour facts a player (or a fork of it) decides. Volume is deliberately
// NOT here — the player carries one Passive volume, in Details (3 Sep, user call).
// ONE TABLE OF CONFIGS (3 Sep, user call — second cut). The first row version put the
// key baseline-level with the controls while the field labels floated above, so the key
// read as a fourth control missing its label. Same lesson the waterfall taught: rows
// that share fields get ONE heading row, and each value sits under its permanent label.
// The KEY is the row's identity, not one of its settings — it wears its own column,
// mono on a quiet tint, with a rule dividing it from the three facts it names.
// THE ROW'S RIGHT EDGE IS A SWITCH AND A ⋯ (4 Sep, user call). A config can now be
// switched off without losing it — the rung's own grammar: the row, its key and its
// facts stand, dimmed; players asking for it follow the default player from the next
// publish. Remove moved off the row surface into the ⋯ beside the switch: switching is
// the everyday act, removing is the rare one, and the hover-only × they replaced put
// the destructive act closer to hand than the reversible one.
function customConfigsHtml() {
  const cfgs = FORM.data.playerConfigs || [];
  const max = KL_META.maxPlayerConfigs || 6;
  const meta = KL_META;
  const unnamed = cfgs.some(c => !(c.name || '').trim());
  // ROW ZERO: the player's own three facts, in the same columns, under the same heads.
  // It is the config a player gets when it asks for no key, so it belongs in the table
  // of configs — and being FIRST is what makes "a fork starts as a copy of the default"
  // legible without a sentence saying so. Its identity is a word, not a typed key (there
  // is nothing to name), and it has no switch and no ⋯: the default cannot be switched
  // off or removed, so those cells stay empty rather than offering dead controls.
  const dfltRow = () => {
    const pl = FORM.data.player || {};
    const sp = FORM.saved?.player || null;
    // ONE MARK PER ROW (8 Sep, user call): the rule says which row holds unsaved work;
    // THE CHANGE REVIEW says which field and from what to what. Marking every cell drew
    // five loose blocks across one row, which is the clutter that sent this back.
    const dirty = f => FORM.saved && JSON.stringify(pl[f] ?? null) !== JSON.stringify(sp?.[f] ?? null);
    const seg = (f, vals, words, dflt) =>
      `<span class="pcfg-c">${accSeg(pl[f] ?? dflt, vals, words, o => `pSet('${f}', ${typeof o === 'string' ? `'${o}'` : o})`)}</span>`;
    return `
    <div class="pcfg-r pcfg-dflt${chgIf(['playback', 'expandInMini', 'autoplay'].some(dirty))}">
      <span class="pcfg-id"><span class="pcfg-dname">Default</span></span>
      ${seg('playback', meta.playbackKinds, meta.playbackKinds.map(o => label('playback', o)), 'active')}
      ${seg('expandInMini', [true, false], ['Yes', 'No'], true)}
      ${seg('autoplay', meta.autoplay, meta.autoplay.map(o => label('autoplay', o)), 'auto')}
      <span class="pcfg-acts"></span>
    </div>`;
  };
  const row = (c, i) => {
    const off = c.on === false;
    const sc = FORM.saved ? (FORM.saved.playerConfigs || [])[i] : c;
    const dirty = f => FORM.saved && JSON.stringify(c[f] ?? null) !== JSON.stringify(sc?.[f] ?? null);
    const rowChg = ['name', 'playback', 'expandInMini', 'autoplay', 'on'].some(dirty);
    return `
    <div class="pcfg-r${(c.name || '').trim() ? '' : ' wants'}${off ? ' off' : ''}${chgIf(rowChg)}">
      <span class="pcfg-id">
        <input type="text" class="pcfg-key mono${PC_BAD.has(c) ? ' err' : ''}" value="${esc(c.name)}" placeholder="type a key"
          oninput="pcName(this, ${i})" onblur="pcKeyDone(this, ${i})">
        ${PC_BAD.has(c) ? `<span class="field-err pcfg-msg">${esc(PC_BAD.get(c))}</span>` : ''}
      </span>
      <span class="pcfg-c">${accSeg(c.playback ?? 'active', meta.playbackKinds, meta.playbackKinds.map(o => label('playback', o)), o => `pcSet(${i}, 'playback', '${o}')`)}</span>
      <span class="pcfg-c">${accSeg(c.expandInMini ?? true, [true, false], ['Yes', 'No'], o => `pcSet(${i}, 'expandInMini', ${o})`)}</span>
      <span class="pcfg-c">${accSeg(c.autoplay ?? 'auto', meta.autoplay, meta.autoplay.map(o => label('autoplay', o)), o => `pcSet(${i}, 'autoplay', '${o}')`)}</span>
      <span class="pcfg-acts">
        <span class="toggle tiny ${off ? '' : 'on'}" onclick="pcSet(${i}, 'on', ${off})"><span class="track"></span></span>
        <span class="rmenu">
          <button type="button" class="row-kebab" onclick="rmenuToggle(event, this)" aria-label="More actions">⋯</button>
          <div class="rmenu-list">
            <div class="eh-item danger" onclick="rmenuShut(this); pcRemove(${i})">Remove config</div>
          </div>
        </span>
      </span>
    </div>`;
  };
  return `
    <div class="fieldset">
      ${FORM.errors.playerConfigs ? `<div class="banner bad" data-err-for="playerConfigs">${esc(FORM.errors.playerConfigs)}</div>` : ''}
      <div class="fieldset-title-row">
        <div class="fieldset-title">Player configs</div>
      </div>
      <div class="pcfg-t">
        <div class="pcfg-h">
          <span class="pcfg-id">Key</span><span>Playback mode</span><span>Expand MiniTV for ads</span><span>Autoplay behaviour</span><span></span>
        </div>
        ${dfltRow()}
        ${cfgs.map(row).join('')}
      </div>
      <div class="pcc-foot">
        <button type="button" class="slot-add pcc-add" ${unnamed || cfgs.length >= max
          ? `disabled title="${unnamed ? 'Key the row above first' : `At most ${max} custom configs per integration`}"`
          : ''}
          onclick="pcAdd()">+ Add config key</button>
      </div>
    </div>`;
}

// A new integration starts from a player preset — a photocopy, never a link.
function stampPreset(name) {
  const pp = KL_META.playerPresets.find(p => p.name === name);
  if (!pp) return;
  FORM.data.presetName = name;
  FORM.data.player = JSON.parse(JSON.stringify(pp.values));
  FORM.rerender();
}


