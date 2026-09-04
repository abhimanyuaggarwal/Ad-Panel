// views-keys-player.js — part 3 of 4 — THE PLAYER: the Details player fields and the custom-config
// table (keys, inline add, the three forkable facts).
// Split 3 Sep as a pure partition of views-keys-form.js — order preserved, nothing edited.

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
  // THE DEFAULT IS ROW ZERO OF THE CONFIGS (4 Sep, user call). The three forkable facts
  // used to take an even share of a flex row, which only APPROXIMATED the config table's
  // columns. The row is now drawn on the table's own grid (`.pcfg-t`): an identity label
  // — "Default player config" — where the table keeps its keys, each fact in the exact
  // column its forks take in the card below, the same divider rule through both cards.
  return `
    <div class="frow prow2">
      <div class="field"><label>Playback</label>
        <div class="fctl">
          ${selectHtml(p.playbackMode, meta.playbackModes.map(v => ({ v, label: label('playbackMode', v) })), v => pSet('playbackMode', v))}
          ${p.playbackMode === 'inline_redirect' ? `<span class="rule-text"><input type="text" class="mono" value="${esc(tv('redirectUrl'))}" placeholder="https://…" oninput="pText(this, 'redirectUrl')"></span>` : ''}
        </div>
      </div>
      ${textFieldHtml('Fallback media', 'fallbackMediaId', { placeholder: 'media id', mono: true })}
      <div class="field" title="How loud the player is while it runs passively — its one volume, whatever a config decides about autoplay (JSON: passiveVolume)">
        <label>Passive volume</label>
        <div class="num-wrap sm"><input value="${esc(QF_TEXT['p:passiveVolume'] ?? (p.passiveVolume ?? ''))}" placeholder="100" inputmode="numeric"
          oninput="pNum(this, 'passiveVolume')"><span class="unit">%</span></div>
      </div>
    </div>
    <div class="pcfg-t dflt-t">
      <div class="pcfg-r dflt-r">
        <span class="pcfg-id dflt-id"
          title="Every player that doesn't ask for a config by key follows this row — a custom config forks exactly these three facts">Default player config</span>
        ${pcFactsHtml(p, (f, v) => `pSet('${f}', ${v})`)}
        <span></span>
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
  if (cfgs.length >= max) { toast(`At most ${max} custom configs per integration`, 'warn'); return; }
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
function pcKeyDone(el, i) {
  const c = (FORM.data.playerConfigs || [])[i];
  if (!c) return;
  const v = (el.value || '').trim();
  el.value = v;
  c.name = v;
  el.closest('.pcfg-r')?.classList.toggle('wants', !v);
  pcSyncAdd();
  if (!v) return;
  if (!/^[A-Za-z0-9_-]{1,24}$/.test(v)) {
    toast(`A config key is one word — letters, numbers, _ or - (got “${v}”)`, 'warn');
    return;
  }
  if (v.toLowerCase() === 'default') {
    toast('“default” is the player in Details — a custom config needs a key of its own', 'warn');
    return;
  }
  if ((FORM.data.playerConfigs || []).some((c, j) => j !== i && (c.name || '').trim().toLowerCase() === v.toLowerCase())) {
    toast(`A config keyed “${v}” is already here — a player asking by key must find exactly one`, 'warn');
  }
}


// The per-placement facts, drawn the same way on every tab. `set` and `num` are the
// tab's own writers; the volume rides the autoplay behaviour and appears only where a
// player starts unmuted — one compound field, exactly as the old Details row read.
// The three behaviour facts a player (or a fork of it) decides. Volume is deliberately
// NOT here — the player carries one Passive volume, in Details (3 Sep, user call).
function pcFactsHtml(c, set) {
  const meta = KL_META;
  return `
    <div class="field">
      <label>Playback mode</label>
      ${accSeg(c.playback ?? 'active', meta.playbackKinds, meta.playbackKinds.map(o => label('playback', o)), o => set('playback', `'${o}'`))}
    </div>
    <div class="field" title="Whether the MiniTV expands while an ad runs">
      <label>Expand MiniTV for ads</label>
      ${accSeg(c.expandInMini ?? true, [true, false], ['True', 'False'], o => set('expandInMini', o))}
    </div>
    <div class="field" title="Whether the player starts on its own — Auto lets the player decide by context">
      <label>Autoplay behaviour</label>
      ${accSeg(c.autoplay ?? 'auto', meta.autoplay, meta.autoplay.map(o => label('autoplay', o)), o => set('autoplay', `'${o}'`))}
    </div>`;
}

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
  const row = (c, i) => {
    const off = c.on === false;
    return `
    <div class="pcfg-r${(c.name || '').trim() ? '' : ' wants'}${off ? ' off' : ''}">
      <span class="pcfg-id">
        <input type="text" class="pcfg-key mono" value="${esc(c.name)}" placeholder="type a key"
          title="The key a player asks for — one word" oninput="pcName(this, ${i})" onblur="pcKeyDone(this, ${i})">
      </span>
      <span class="pcfg-c">${accSeg(c.playback ?? 'active', meta.playbackKinds, meta.playbackKinds.map(o => label('playback', o)), o => `pcSet(${i}, 'playback', '${o}')`)}</span>
      <span class="pcfg-c">${accSeg(c.expandInMini ?? true, [true, false], ['True', 'False'], o => `pcSet(${i}, 'expandInMini', ${o})`)}</span>
      <span class="pcfg-c">${accSeg(c.autoplay ?? 'auto', meta.autoplay, meta.autoplay.map(o => label('autoplay', o)), o => `pcSet(${i}, 'autoplay', '${o}')`)}</span>
      <span class="pcfg-acts">
        <span class="toggle tiny ${off ? '' : 'on'}" onclick="pcSet(${i}, 'on', ${off})"
          title="${off ? `Switched off — players asking for “${esc(c.name)}” follow the default player.`
                       : `Switched on — a player asks for “${esc(c.name)}” by key. Off keeps the row; players fall back to the default.`}"><span class="track"></span></span>
        <span class="rmenu">
          <button type="button" class="row-kebab" onclick="rmenuToggle(event, this)" title="More actions" aria-label="More actions">⋯</button>
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
        <div class="fieldset-title">Custom player configs</div>
      </div>
      ${cfgs.length ? `
      <div class="pcfg-t">
        <div class="pcfg-h">
          <span class="pcfg-id">Key</span><span>Playback mode</span><span>Expand MiniTV for ads</span><span>Autoplay behaviour</span><span></span>
        </div>
        ${cfgs.map(row).join('')}
      </div>`
        : '<div class="pcc-empty">None — players follow the fields in Details</div>'}
      <div class="pcc-foot">
        <button type="button" class="slot-add pcc-add" ${unnamed || cfgs.length >= max
          ? `disabled title="${unnamed ? 'Key the row above first' : `At most ${max} custom configs per integration`}"`
          : 'title="Another config a player can ask for by key"'}
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


