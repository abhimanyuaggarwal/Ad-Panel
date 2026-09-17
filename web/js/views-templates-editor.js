// views-templates-editor.js — ONE TEMPLATE, ON ITS OWN PAGE (16 Sep, user call).
//
// THE INTEGRATION PAGE'S OWN CLOTHES (16 Sep, user call — *"the look and feel of the page
// should be same as that of integration page"*). This page is not a new shape: it is
// `.ehead.with-rail` → `.detail` → `.form.keyform` card on the left, one rail on the
// right, which is exactly how an integration is read. `keyform` is not decoration — it is
// the class the console's ONE TYPE SCALE is scoped to (10-surfaces.css, end of file: label
// 12.5/500 · value 12.5 · box 30px · seg 12 · chip 11.5), so wearing it is what makes a
// template's Name field the same object as an integration's rather than a lookalike at a
// fourth scale.
//
// TWO ROWS, THE INTEGRATION DETAILS CARD'S OWN SHAPE (16 Sep, third review — *"the provider
// should be a chip as used across pages and the visibility can be a dropdown with
// multiselect and its IA can be rethink"*). Row one is the three answers a template IS:
// what it is called · what it asks through · who may point at it — exactly the rhythm of
// `Name · Property · Platform` next door. Row two is the one long value, the Request URL,
// with its macros under it. Before this the three answers were spread down four rows of
// three different control dialects (a select, a bespoke chip row, a strip of aids), which
// is what read as clutter.
//
// TWO CARDS, ONE RAIL — the integration page's own division. Details and Connected are
// cards on the left, the way Details and Player behaviour are; the rail on the right is
// Version history and nothing else, the way it is on both other editors. Connected spent a
// round in the rail beside the versions, which made this the only page whose right column
// meant two things.
// Load order: after views-templates-list.js (it repaints that list's rows after a save).

let TPL_ORIGINAL = null;   // the saved object, or null while creating
let TPL_VIS_WHY = '';      // the one-line reason a refused property is refusing, shown in place
let TPL_VIS_OPEN = false;  // the Visible to picker's menu
let TPL_MORE_OPEN = false; // the header's ⋯ menu
let TPL_URL_CARET = null;  // where the caret last stood in the URL field (see tplInsertMacro)
let TPL_SAVED_SIG = '';    // the saved draft, as a signature — what PUB.dirty() compares

// ---------- what a person may still do to this template ----------

// A property that already has connected ad setups cannot be dropped from Visible to —
// the invariant is that everything connected is always visible, so nobody can be left
// holding a template their own room can no longer show. The server refuses it by name; the
// picker refuses it on the click that would drop it, which is the same rule said earlier.
function tplLockedProps() {
  return TPL_ORIGINAL ? (TPL_ORIGINAL.propertiesInUse || []) : [];
}

function tplUnitCount() { return TPL_ORIGINAL ? (TPL_ORIGINAL.usedBy || 0) : 0; }

// How many connected ad setups a property holds — the number the refusal names, counted
// from the reach the server already handed over.
function tplSetupsIn(property) {
  const n = (TPL_ORIGINAL?.setups || []).filter(s => s.property === property).length;
  return `${n} connected ad setup${n === 1 ? '' : 's'} on ${property}`;
}

// ---------- the provider ----------

// THE PROVIDER WEARS THE PROVIDER'S OWN CHIP (16 Sep, user call — *"the provider should be
// a chip as used across pages"*). `.pvd` is how IMA, GPT and CAN are marked in every ladder,
// every lookup row and both lists; the one place it was NOT a chip was the field where you
// choose it, which made the choice look like a different kind of fact from the thing it
// chooses. Three providers is a set you show, not one you hide behind a menu — so the
// choice is the same three chips, lit for the answer.
//
// Where the choice is refused (units already request through this template) the row
// collapses to the one chip, wearing `fixed`: the same mark, the same place, no control
// promising a menu it would never open.
function tplProviderHtml(d, units) {
  if (units) {
    return `<div class="prov-fact"
      title="Retyping it would misroute every unit that already asks through this template — point them elsewhere first">${providerBadge(d.provider)}<i>fixed</i></div>`;
  }
  return `<div class="prov-pick">${(window.KL_PROVIDERS || []).map(v => `
    <button type="button" class="pvd p-${esc(v)}${v === d.provider ? ' on' : ''}"
      onclick="tplSetProvider('${esc(v)}')">${esc(label('tagProvider', v))}</button>`).join('')}</div>`;
}

function tplSetProvider(v) {
  FORM.data.provider = v;
  clearErr('provider');
  FORM.rerender();
}

// ---------- the request URL and its macros ----------

// THE MACROS INSERT WHERE THE CARET IS — AND APPEND WHEN THERE IS NO CARET (16 Sep, bug the
// user suspected and it was real). `selectionStart` on an input nobody has focused is `0`,
// not null, so `?? value.length` never fired and the first click on a chip dropped the macro
// at position ZERO: `[PAGE_URL]https://ads…`. The caret is remembered as the field is used
// (`tplUrlCaret`), and with no remembered caret the macro goes where a person means it to
// go — the END of the URL. After inserting, focus returns to the field with the caret after
// the macro, so typing `&cb=` then clicking a chip is one continuous motion.
function tplMacroStripHtml() {
  const macros = KL_META.templateMacros || [];
  if (!macros.length) return '';
  // Each chip says what the player will put there, so the strip is a legend as well as a
  // control — the thing the deleted example line was for, at a tenth of the room.
  const what = {
    CACHEBUSTER: 'a fresh random number on every request',
    PAGE_URL: 'the encoded address of the page the player is on',
    REFERRER_URL: 'the encoded address the viewer arrived from',
    DESCRIPTION_URL: 'the encoded address of the page describing the video',
    TIMESTAMP: 'the request time in milliseconds',
  };
  return `
    <div class="macro-strip">
      <span class="ms-l">Add a macro</span>
      ${macros.map(m => `<button type="button" class="mchip"
        title="${esc(`[${m}] — the player fills in ${what[m] || 'its value'}`)}"
        onclick="tplInsertMacro('[${esc(m)}]')"><i>+</i>[${esc(m)}]</button>`).join('')}
    </div>`;
}

function tplInsertMacro(macro) {
  const el = document.getElementById('tpl-url');
  if (!el) return;
  const v = el.value;
  // No remembered caret means the field has not been touched this render: append.
  const at = TPL_URL_CARET === null ? v.length : Math.min(TPL_URL_CARET.at, v.length);
  const to = TPL_URL_CARET === null ? v.length : Math.min(TPL_URL_CARET.to, v.length);
  el.value = v.slice(0, at) + macro + v.slice(to);
  const after = at + macro.length;
  TPL_URL_CARET = { at: after, to: after };
  el.focus();
  el.setSelectionRange(after, after);
  FORM.data.url = el.value;
  clearErr('url');
  paintChg();
}

// Every way the caret can move in the field, so the chips always know where "here" is.
function tplUrlCaret(el) {
  TPL_URL_CARET = { at: el.selectionStart, to: el.selectionEnd };
}

// The URL is written by hand rather than through textFieldHtml, because the macro chips
// need the element by id and the caret tracked.
function tplUrlFieldHtml() {
  const err = FORM.errors.url;
  return `
    <div class="field grow ${err ? 'err' : ''}" data-field="url">
      <label>Request URL</label>
      <input type="text" id="tpl-url" class="mono" value="${esc(FORM.data.url || '')}"
        placeholder="https://ads.example/vast?cb=[CACHEBUSTER]"
        oninput="tplUrlInput(this)" onkeyup="tplUrlCaret(this)"
        onclick="tplUrlCaret(this)" onselect="tplUrlCaret(this)" onfocus="tplUrlCaret(this)">
      ${err ? `<span class="field-err">${esc(err)}</span>` : ''}
    </div>`;
}

function tplUrlInput(el) {
  FORM.data.url = el.value;
  tplUrlCaret(el);
  clearErr('url');
  paintChg();
}

// ---------- visible to: the house multiselect ----------

// THE HOUSE CHECKLIST, NOT A CHIP ROW OF ITS OWN (16 Sep, user call — *"the visibility can
// be a dropdown with multiselect"*). `pickerHtml` already IS that control: a face that says
// the answer, a menu that stays open while you work, a section box that takes everything
// under it, and a refused row that greys in place wearing its reason. The bespoke chip row
// it replaces was a fourth dialect for a question the console had already answered once, and
// it spent a whole row of the card saying what a 210px face says.
//
// THE MODEL MAPS STRAIGHT ONTO IT. `properties: []` is every property, so All is every row
// ticked and the section's own box is the All control — no separate chip, no two spellings
// of one answer. Untick down to a subset and that subset is stored; tick back up to all
// three and it collapses to `[]` again (the server does the same, so screen and store never
// disagree). Zero is not an answer — a template visible nowhere could never be picked again
// — so the last tick refuses, in place, on the line that explains the answer anyway.
function tplVisFaceWord() {
  const picked = FORM.data.properties || [];
  if (!picked.length) return 'All properties';
  return picked.join(', ');
}

function tplVisPickerHtml() {
  const props = KL_META.properties || [];
  const picked = FORM.data.properties || [];
  const isAll = !picked.length;
  const has = v => isAll || picked.includes(v);
  const locked = tplLockedProps();
  const write = set => {
    TPL_VIS_WHY = '';
    FORM.data.properties = set.size === props.length ? [] : props.filter(p => set.has(p));
  };
  const h = {
    open: TPL_VIS_OPEN,
    setOpen: o => { TPL_VIS_OPEN = o; tplRepaintVisible(); },
    has,
    // THE LOCK IS NOT AN `off` ROW. `pickerHtml` draws a refused row greyed AND UNTICKED —
    // right for a setting you may not choose, wrong for one that is chosen and may not be
    // UNchosen: `All properties` rendered as two grey empty boxes and one tick. So the row
    // stays normal and the refusal happens on the click that would drop it, in place, on
    // the line under the field that explains the answer anyway — the same grammar the
    // server speaks when it refuses the same move by name.
    off: () => '',
    toggle: v => {
      const now = new Set(props.filter(has));
      if (now.has(v)) {
        if (locked.includes(v)) {
          TPL_VIS_WHY = `${v} stays visible — ${tplSetupsIn(v)}.`;
          tplRepaintVisible();
          return;
        }
        if (now.size === 1) {
          TPL_VIS_WHY = 'A template has to be visible somewhere — pick at least one property.';
          tplRepaintVisible();
          return;
        }
        now.delete(v);
      } else {
        now.add(v);
      }
      write(now);
      tplRepaintVisible();
    },
    // The section box is the All answer: it takes every property, and refuses to take none.
    toggleAll: () => {
      if (isAll) TPL_VIS_WHY = 'A template has to be visible somewhere — untick one at a time.';
      else write(new Set(props));
      tplRepaintVisible();
    },
  };
  return pickerHtml([{ k: 'props', name: 'Properties', rows: props.map(v => ({ v, label: v })) }],
    h, { ph: tplVisFaceWord() });
}

// ONLY THE REFUSAL IS NEWS (16 Sep, user call — *"Every ad setup can point at this template.
// remove this text"*). The line under the field used to restate the face in a longer
// sentence: `All properties` above it, *"Every ad setup can point at this template"* below.
// The face already says the answer, so the line is empty unless the field has just refused
// something — which is the one thing the face cannot say.
function tplVisWhyHtml() {
  return TPL_VIS_WHY ? `<span class="hint vis-why">${esc(TPL_VIS_WHY)}</span>` : '';
}

function tplRepaintVisible() {
  const zone = document.getElementById('tpl-vis');
  if (!zone) return;
  zone.innerHTML = `${tplVisPickerHtml()}${tplVisWhyHtml()}`;
  paintChg();
}

// ---------- the second card: connected ----------

// UNIT-FIRST, BECAUSE THE UNIT IS WHAT FIRES THE URL (16 Sep, second pass on this card's
// IA at the user's ask). Setup-first had a flaw a reader would eventually hit and never
// un-see: the head counted AD UNITS and the rows counted AD SETUPS, and a unit deployed in
// three setups makes the rows add to more than the head. On the seeded world the card said
// `3 ad units` over rows adding to 5. That breaks this room's own rule — the head's count is
// never a number the rows cannot account for.
//
// So the row is the AD UNIT, which is both the thing `usedBy` counts and the thing that
// actually fires this URL, and the ad setups it sits in ride along as its address. Now the
// three questions this card exists for read straight down it: how many will my change move
// (the head), which ones (the left column), and where are they (the right, each a door).
//
// A heading row, because the two columns are different KINDS of thing and a reader should
// not have to infer that from the first data row — the same grammar the read-only shelf on
// the ad setup page uses one room over.
function tplConnectedCardHtml() {
  const units = TPL_ORIGINAL?.units || [];
  const setupCount = TPL_ORIGINAL?.setupCount || 0;
  const order = KL_META.properties || [];
  const rows = [...units].sort((a, b) => a.name.localeCompare(b.name));
  const where = u => [...(u.setups || [])]
    .sort((a, b) => (order.indexOf(a.property) - order.indexOf(b.property)) || a.name.localeCompare(b.name))
    .map(x => `<a class="cu-s" href="#setups/${x.id}">${propBadge(x.property)}<span>${esc(x.name)}</span></a>`)
    .join('');
  return `
    <div class="fieldset">
      <div class="fieldset-title-row">
        <div class="fieldset-title">Connected</div>
        ${rows.length ? `<span class="cx-count">${rows.length} ad unit${rows.length === 1 ? '' : 's'}
          in ${setupCount} ad setup${setupCount === 1 ? '' : 's'}</span>` : ''}
      </div>
      ${rows.length ? `
        <div class="cu-t">
          <div class="cu-h"><span>Ad unit</span><span>Sits in</span></div>
          ${rows.map(u => `
            <div class="cu-r">
              <span class="cu-n">${esc(u.name)}</span>
              <span class="cu-w">${where(u)}</span>
            </div>`).join('')}
        </div>`
      : `<p class="cx-empty">Nothing points at it yet — an ad unit picks its template in the
          settings under it, inside an ad setup’s ladder.</p>`}
    </div>`;
}

// ---------- the page ----------

async function viewTemplateForm(id) {
  const [{ templates }, meta] = await Promise.all([API.listTemplates(), getMeta()]);
  KL_META = meta;
  TPL_LIST = templates;
  TPL_ORIGINAL = id ? templates.find(t => t.id === id) : null;
  if (id && !TPL_ORIGINAL) {
    document.getElementById('main').innerHTML =
      '<div class="banner bad">No such template — it may have been deleted.</div>';
    return;
  }
  // THE PUBLISH PLANE, WIRED THE WAY BOTH OTHER EDITORS WIRE IT (16 Sep). `PUB` is the one
  // object the shared header chip, rail, publish flow and restore dialog all read, so a
  // template gets every one of them by handing over the same four things.
  if (id) {
    await loadPublish('template', id, TPL_ORIGINAL.name);
    // The blast radius IS this object's point (17 Sep) — the same two numbers the
    // Connected card counts, in the server's own words, read at the moment of the act.
    PUB.reach = () => {
      const units = tplUnitCount();
      const setups = TPL_ORIGINAL?.setupCount || 0;
      if (!units) return '';
      return `${units} ad unit${units === 1 ? '' : 's'} in ${setups} ad setup${setups === 1 ? '' : 's'} pick${units === 1 ? 's' : ''} this up`;
    };
    PUB.dirty = () => JSON.stringify(tplPayload(FORM.data)) !== TPL_SAVED_SIG;
    PUB.saveNow = opts => tplSaveClicked(opts);
    // A restore rewrites the draft server-side, so the page is re-read, never patched.
    PUB.onRestored = () => viewTemplateForm(id);
  } else {
    pubClear();
  }
  TPL_VIS_WHY = '';
  TPL_VIS_OPEN = false;
  TPL_URL_CARET = null;
  const seed = TPL_ORIGINAL
    ? { name: TPL_ORIGINAL.name, provider: TPL_ORIGINAL.provider, url: TPL_ORIGINAL.url,
        properties: [...(TPL_ORIGINAL.properties || [])], on: TPL_ORIGINAL.on !== false }
    : { name: '', provider: 'ima', url: '', properties: [], on: true };
  startForm(seed, () => renderTemplateForm());
  // The baseline the change tint reads. A create page has none, so nothing tints.
  FORM.saved = TPL_ORIGINAL ? { ...seed } : null;
  TPL_SAVED_SIG = JSON.stringify(tplPayload(seed));
  renderTemplateForm();
}

// What a save ships, built field by field so it never carries a view-only key — and the
// signature `PUB.dirty()` compares against, so "unsaved work" means the same thing here
// as it does in the other two editors.
function tplPayload(d) {
  return { name: d.name, provider: d.provider, url: d.url, properties: d.properties };
}

function renderTemplateForm() {
  const d = FORM.data;
  const editing = !!TPL_ORIGINAL;
  const units = tplUnitCount();
  document.getElementById('main').innerHTML = `
    <div class="ehead ${editing ? 'with-rail' : ''}">
      <a class="eh-back" href="#templates">←</a>
      <h1>${editing ? esc(TPL_ORIGINAL.name) : 'New template'}</h1>
      ${editing ? pubStateChipHtml() : ''}
      <span class="eh-gap"></span>
      ${editing ? `
        <button class="btn ghost" onclick="tplSaveClicked()">Save</button>
        <button class="btn ${(PUB?.unpublished || []).length ? '' : 'ghost'}"
          onclick="publishClicked()">${PUB?.liveVersion != null ? 'Publish' : 'Publish — go on air'}</button>`
      : '<button class="btn" onclick="tplSaveClicked()">Create template</button>'}
      ${editing ? `
      <div class="eh-more ${TPL_MORE_OPEN ? 'open' : ''}">
        <button type="button" class="btn ghost eh-more-btn" onclick="tplMoreToggle(event)">⋯</button>
        <div class="eh-menu">
          ${PUB?.liveVersion != null ? `<div class="eh-item danger" onclick="tplMoreToggle(); takeOffAirClicked('template', '${TPL_ORIGINAL.id}', '${esc(TPL_ORIGINAL.name)}')">Take off air</div>` : ''}
          <div class="eh-item danger ${units ? 'dim' : ''}" ${units
            ? `title="${units} ad unit${units === 1 ? '' : 's'} request through it — point them elsewhere first"`
            : 'onclick="tplMoreToggle(); tplDeleteClicked()"'}>Delete template</div>
        </div>
      </div>` : ''}
    </div>
    <div class="detail">
      <div class="form keyform">
        <div class="fieldset">
          <div class="fieldset-title">Details</div>
          <div class="frow">
            ${textFieldHtml('Name', 'name', { placeholder: 'e.g. GAM low-latency', grow: true })}
            <div class="field ${FORM.errors.provider ? 'err' : ''}" data-field="provider">
              <label>Provider</label>
              ${tplProviderHtml(d, units)}
            </div>
            <div class="field tpl-visfield" data-field="properties">
              <label>Visible to</label>
              <div id="tpl-vis">${tplVisPickerHtml()}${tplVisWhyHtml()}</div>
            </div>
          </div>
          <div class="url-band">
            <div class="frow">${tplUrlFieldHtml()}</div>
            ${tplMacroStripHtml()}
          </div>
          ${editing && PUB && PUB.liveVersion == null ? `<p class="tpl-inactive">Not on air — its
            connected ad units request through ${esc(label('tagProvider', d.provider))}’s standard,
            not this URL, until it is published.</p>` : ''}
        </div>
        ${editing ? tplConnectedCardHtml() : ''}
      </div>
      ${editing ? pubRailHtml() : ''}
    </div>`;
  paintChg();
}

// THE PAGE STATES THE ANSWER; THE LIST OWNS THE ACT (16 Sep, user call — *"cut it from
// this page entirely"*). Turning a template off is a rare act with a wide blast radius, and
// it is not one of the things a template IS — this page is for what it is called, what it
// asks through, and who may point at it. So off shows here as the header chip every other
// editor uses for state (read-only, exactly like `On air · v1`), and the act itself lives
// on the list row's ⋯, where the count it would move is in view (tplToggleActive).

function tplMoreToggle(e) {
  if (e) e.stopPropagation();
  TPL_MORE_OPEN = !TPL_MORE_OPEN;
  document.querySelector('.eh-more')?.classList.toggle('open', TPL_MORE_OPEN);
}

// ---------- save ----------

// SAVE WRITES THE DRAFT; PUBLISH IS THE GATE (16 Sep, user call — templates joined the
// publish plane). Until then a template had no draft, so Save WAS the release and this
// function carried a reach review of its own. Now the review that matters is the shared
// one `publishClicked()` already runs — THE CHANGE REVIEW over `PUB.unpublished`, the same
// screen an ad setup and an integration publish through — and the blast radius it names is
// counted server-side and handed back as a publish warning. Two review screens for one act
// would have been two places to keep the same sentence true.
async function tplSaveClicked(opts = {}) {
  const d = FORM.data;
  const editing = !!TPL_ORIGINAL;
  try {
    if (editing) {
      await API.updateTemplate(TPL_ORIGINAL.id, tplPayload(d));
      if (!opts.quiet) toast('Saved');
      const keep = { open: TPL_VIS_OPEN };
      await viewTemplateForm(TPL_ORIGINAL.id);
      TPL_VIS_OPEN = keep.open;
    } else {
      const { template } = await API.createTemplate(tplPayload(d));
      toast('Template created');
      location.hash = `#templates/${template.id}`;
    }
  } catch (e) {
    applyServerErrors(e);
  }
}

async function tplDeleteClicked() {
  const ok = await ask({
    title: `Delete “${TPL_ORIGINAL.name}”?`,
    body: '<p class="dlg-note">Nothing points at it, so no ad unit changes what it asks.</p>',
    okLabel: 'Delete', danger: true,
  });
  if (!ok) return;
  try {
    await API.deleteTemplate(TPL_ORIGINAL.id);
    toast('Template deleted');
    location.hash = '#templates';
  } catch (e) {
    toast(e.message, 'bad');
  }
}
