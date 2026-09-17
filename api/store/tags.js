// store/tags.js — ad tags and ad unit templates: normalization, CRUD, in-use checks.
import { slotGroupDefs } from './ladders.js';
import { listSetups } from './setups.js';
import { AD_UNIT_EXAMPLE, AD_UNIT_PATH, DIRECTORY_PROVIDERS, PROPERTIES, PROPERTY_SCOPES, PROVIDER_TYPE, PROVIDER_WORD, Refusal, SLOT_TYPES, TAG_PROVIDERS, TAG_TYPES, TEMPLATE_MACROS, URL_PROVIDERS, state, updateStamp } from './state.js';
import { bool, diff, httpUrl, mustGet, oneOf, str, uniqueName } from './validate.js';


// ---------- ad unit templates ----------
// AUTHORED IN THE PANEL since 31 Aug (AD-JSON-SCOPE — reversing the 20 Aug "no
// interface" call on the user's word): the JSON names several templates and a unit's
// `tpl` picks between them, so which template carries a unit IS an ops decision now.
// The half that protected ops survives as validation: the macro vocabulary is the
// player team's, fail closed, so ops can pick a template but never break a URL.

export function normalizeTemplate(input, exceptId) {
  const errors = [];
  const name = str(input.name);
  if (!name) errors.push({ field: 'name', message: 'Name is required' });
  else if (!uniqueName(state.templates, name, exceptId)) {
    errors.push({ field: 'name', message: `An ad unit template named “${name}” already exists` });
  }
  const properties = readVisibleTo(input, errors);
  let provider = str(input.provider);
  if (!TAG_PROVIDERS.includes(provider)) {
    errors.push({ field: 'provider', message: `“${provider || '(none)'}” is not a provider — IMA, GPT or CAN` });
    provider = 'ima';
  }
  const url = str(input.value ?? input.url);
  if (!httpUrl(url)) {
    errors.push({ field: 'url', message: `“${url.slice(0, 50)}” is not a full URL (https://…)` });
  } else {
    for (const m of url.matchAll(/\[([A-Za-z0-9_]+)\]/g)) {
      if (!TEMPLATE_MACROS.includes(m[1])) {
        errors.push({ field: 'url', message: `[${m[1]}] is not a macro the player fills — ${TEMPLATE_MACROS.map(x => `[${x}]`).join(', ')}` });
      }
    }
  }
  // THE `on` SWITCH IS GONE (16 Sep, user call — templates joined the publish plane). It
  // was the 4 Sep answer to "stop this template carrying its units" back when templates
  // resolved live and there was no plane to take one off. Now there is, and ON AIR / OFF
  // AIR is the whole of what it meant — so keeping the field would be two ways to say one
  // thing, which is exactly the trap the 27 Aug `status` pause fell into one room over.
  // Refused BY NAME, pointing at where the answer lives now, never quietly dropped.
  if (input.on !== undefined) {
    throw new Refusal(400, 'invalid_template', 'Ad unit template was refused', {
      errors: [{ field: 'on', message: 'A template is on air or it is not — use Take off air, or publish it' }],
    });
  }
  if (errors.length) throw new Refusal(400, 'invalid_template', 'Ad unit template was refused', { errors });
  return { name, provider, url, properties };
}

// WHICH PROPERTIES MAY PICK IT (16 Sep, user call — templates became a room of their
// own, and the room's second question is reach). `properties: []` is EVERY property —
// the answer said by absence, so a template saved when this was a single `property`
// string still reads as it always did, and the legacy string is still accepted on the
// wire and mapped ('All' → [], 'TOI' → ['TOI']).
//
// Naming every property collapses to the empty list, because on screen the two are ONE
// answer: light all three chips and the All chip lights. One shape per meaning, so the
// page never shows two ways to say the same thing.
function readVisibleTo(input, errors) {
  const raw = input.properties !== undefined
    ? input.properties
    : (input.property === undefined || input.property === 'All' ? [] : [input.property]);
  if (!Array.isArray(raw)) {
    errors.push({ field: 'properties', message: `Visible to must be a list of properties — ${PROPERTIES.join(', ')}` });
    return [];
  }
  const picked = new Set();
  for (const p of raw) {
    const v = str(p);
    if (!PROPERTIES.includes(v)) {
      errors.push({ field: 'properties', message: `“${v || '(none)'}” is not a property — ${PROPERTIES.join(', ')}` });
    } else {
      picked.add(v);
    }
  }
  if (picked.size === PROPERTIES.length) return [];
  return PROPERTIES.filter(p => picked.has(p)); // stored in the properties' own order
}

// Where a template may be PICKED. Visibility governs the choice, never the serving: a
// unit already pointing at it keeps requesting through it, which is why narrowing that
// would strand one is refused rather than silently applied (updateTemplate).
export function templateVisibleTo(tpl, property) {
  return !tpl.properties || !tpl.properties.length || tpl.properties.includes(property);
}

export function createTemplate(input) {
  const t = normalizeTemplate(input);
  const id = `tpl_${++state.counters.template}`;
  const obj = { id, ...t, ...updateStamp() };
  state.templates.set(id, obj);
  return obj;
}

export function updateTemplate(id, input) {
  const existing = mustGet(state.templates, id, 'ad unit template');
  const t = normalizeTemplate({ ...existing, ...input }, id);
  // Retyping a template's provider under tags that request through it would misroute them.
  if (t.provider !== existing.provider) {
    const holders = tagsUsingTemplate(id).map(x => x.name);
    if (holders.length) {
      throw new Refusal(409, 'template_in_use',
        `“${existing.name}” carries ${holders.length} ${PROVIDER_WORD[existing.provider]} tag${holders.length > 1 ? 's' : ''} — it cannot become ${PROVIDER_WORD[t.provider]}`,
        { usedBy: holders });
    }
  }
  // NARROWING CANNOT STRAND A CONNECTED UNIT (16 Sep). Visibility says where a template
  // may be picked; everything already connected has to stay visible, or an ad setup would
  // hold a template its own room can no longer show — and nobody could find their way back
  // to it. Refused by name, counting what is connected where, with the two ways out.
  const stranded = strandedByVisibility(id, t.properties);
  if (stranded.length) {
    const where = stranded.map(g => `${g.property} (${g.setups.length} ad setup${g.setups.length > 1 ? 's' : ''})`).join(', ');
    throw new Refusal(409, 'template_in_use',
      `“${existing.name}” is connected in ${where} — keep ${stranded.length > 1 ? 'those properties' : stranded[0].property} visible, or point those ad units elsewhere first`,
      { usedBy: stranded.flatMap(g => g.setups.map(s => s.name)), properties: stranded.map(g => g.property) });
  }
  const changes = diff(existing, t);
  Object.assign(existing, t, { ...updateStamp() });
  return { obj: existing, changes };
}

// The connected ad setups a proposed visibility list would shut out, grouped by property
// so the refusal can name each one and its count. An empty list is every property, so it
// strands nothing by construction.
function strandedByVisibility(id, properties) {
  if (!properties || !properties.length) return [];
  const out = new Map();
  for (const s of setupsUsingTemplate(id)) {
    if (properties.includes(s.property)) continue;
    if (!out.has(s.property)) out.set(s.property, { property: s.property, setups: [] });
    out.get(s.property).setups.push(s);
  }
  return [...out.values()];
}

export function deleteTemplate(id) {
  const obj = mustGet(state.templates, id, 'ad unit template');
  const holders = tagsUsingTemplate(id).map(x => x.name);
  if (holders.length) {
    throw new Refusal(409, 'template_in_use',
      `“${obj.name}” carries ${holders.length} tag${holders.length > 1 ? 's' : ''} and cannot be deleted`,
      { usedBy: holders });
  }
  state.templates.delete(id);
  return obj;
}

export function listTemplates() { return [...state.templates.values()]; }
export function tagsUsingTemplate(id) { return listTags().filter(t => t.tplId === id); }

// THE REACH, COUNTED (16 Sep): a template is picked by a TAG, and a tag sits in ad
// setups — so where a template actually reaches is one hop further than `usedBy` ever
// said. The Connected zone on the template's page is drawn from exactly this.
export function setupsUsingTemplate(id) {
  const ids = new Set(tagsUsingTemplate(id).map(t => t.id));
  if (!ids.size) return [];
  return listSetups().filter(s => [...setupTagIds(s)].some(x => ids.has(x)));
}

// The templates an ad setup on `property` may pick from — the one seam the rung's
// picker and the room's own list both read, so the two can never disagree.
export function templatesFor(property) {
  return listTemplates().filter(t => templateVisibleTo(t, property));
}

// ---------- ad tags ----------
// A tag is a named, typed referent: video tags fit pre/mid/post-roll, display tags
// fit the squeeze-back and sit inside a break as a waterfall rung. Tags live in the ops
// room now — they are what ad setups are built from.

export function normalizeTag(input, exceptId) {
  const errors = [];
  const name = str(input.name);
  if (!name) errors.push({ field: 'name', message: 'Name is required' });
  else if (!uniqueName(state.tags, name, exceptId)) {
    errors.push({ field: 'name', message: `An ad tag named “${name}” already exists` });
  }

  const property = oneOf(input.property ?? 'All', 'property', PROPERTY_SCOPES, errors);
  const value = str(input.value);
  const looksLikeUrl = /^https?:/i.test(value);
  const inputType = str(input.type);
  let provider = str(input.provider);
  // A GAM unit path identifies the account but not the library — the declared type picks
  // it (video → IMA, display → GPT). A pasted URL under no provider is CAN, the one
  // provider you address by endpoint.
  if (!provider) {
    if (looksLikeUrl) {
      provider = 'can';
    } else {
      provider = inputType === 'display' ? 'gpt' : 'ima';
    }
  } else if (!TAG_PROVIDERS.includes(provider)) {
    errors.push({ field: 'provider', message: `“${provider}” is not a provider — IMA, GPT or CAN` });
    provider = 'ima';
  }
  // The TYPE is implied by the protocol wherever it can be: IMA answers with video, GPT
  // with display. Only CAN serves both, so only CAN has to say. A contradiction is
  // refused by name, never silently corrected.
  const implied = PROVIDER_TYPE[provider];
  let type;
  if (implied) {
    if (inputType && inputType !== implied) {
      errors.push({ field: 'type', message: `A ${label(provider)} tag answers with ${implied} by construction — it cannot be ${inputType}` });
    }
    type = implied;
  } else {
    if (!inputType) {
      errors.push({ field: 'type', message: 'CAN serves both — say whether this endpoint returns video or display' });
    }
    type = oneOf(inputType || 'video', 'type', TAG_TYPES, errors);
  }
  if (!value) {
    errors.push({ field: 'value', message: 'An ad tag needs its ad unit or endpoint' });
  } else if (URL_PROVIDERS.includes(provider)) {
    if (!httpUrl(value)) errors.push({ field: 'value', message: `“${value.slice(0, 50)}” is not a full URL (https://…)` });
  } else if (DIRECTORY_PROVIDERS.includes(provider)) {
    // MANUAL ENTRY (27 Aug, user call): the synced directory is a CONVENIENCE, not a
    // gate. A unit trafficked in GAM ten minutes ago is real whether or not our copy has
    // caught up, so a well-formed ad unit path is taken off-directory and MARKED
    // (`offDirectory`), never refused. What is still refused is a value that could not be
    // an ad unit at all — a typo has to fail here, not silently at ad time.
    if (httpUrl(value)) {
      // A direct VAST URL is an ordinary IMA request. GPT has no URL form at all.
      if (provider !== 'ima') {
        errors.push({ field: 'value', message: `GPT asks GAM for an ad unit, not a URL — give the unit path (${AD_UNIT_EXAMPLE}), or save it as a CAN endpoint` });
      }
    } else if (!AD_UNIT_PATH.test(value)) {
      errors.push({ field: 'value', message: `“${value.slice(0, 50)}” is not an ad unit — a GAM ad unit starts with the network code, like ${AD_UNIT_EXAMPLE}` });
    }
  }

  // WHICH TEMPLATE CARRIES IT (31 Aug): Standard is ABSENCE — a tag that never chose
  // stores nothing and follows the provider's default, so every existing tag is
  // untouched and the rung row shows nothing new.
  const tplId = str(input.tplId) || null;
  if (tplId) {
    const tpl = state.templates.get(tplId);
    if (!tpl) {
      errors.push({ field: 'tplId', message: 'That ad unit template doesn\'t exist' });
    } else if (tpl.provider !== provider) {
      errors.push({ field: 'tplId', message: `“${tpl.name}” is a ${label(tpl.provider)} template — this tag asks ${label(provider)}` });
    }
  }

  if (errors.length) throw new Refusal(400, 'invalid_tag', 'Ad tag was refused', { errors });
  return { name, type, property, provider, value, tplId };

  function label(p) { return PROVIDER_WORD[p] || p; }
}

export function createTag(input) {
  const t = normalizeTag(input);
  const id = `tag_${++state.counters.tag}`;
  const obj = { id, ...t, ...updateStamp() };
  state.tags.set(id, obj);
  return obj;
}

export function updateTag(id, input) {
  const existing = mustGet(state.tags, id, 'ad tag');
  const t = normalizeTag({ ...existing, ...input }, id);
  // Retyping a tag that already sits in a ladder would silently misplace it.
  if (t.type !== existing.type) {
    const holders = setupsUsingTag(id).map(s => s.name);
    if (holders.length) {
      throw new Refusal(409, 'tag_in_use',
        `“${existing.name}” is a ${existing.type} tag in use — change what it points at, or make a new tag`,
        { usedBy: holders });
    }
  }
  const changes = diff(existing, t);
  Object.assign(existing, t, { ...updateStamp() });
  return { obj: existing, changes };
}

export function deleteTag(id) {
  const obj = mustGet(state.tags, id, 'ad tag');
  const holders = setupsUsingTag(id).map(s => s.name);
  if (holders.length) {
    throw new Refusal(409, 'tag_in_use',
      `“${obj.name}” is used in ${holders.length} ad setup${holders.length > 1 ? 's' : ''} and cannot be deleted`,
      { usedBy: holders });
  }
  state.tags.delete(id);
  return obj;
}

export function getTag(id) { return mustGet(state.tags, id, 'ad tag'); }
export function listTags() { return [...state.tags.values()]; }

export function setupsUsingTag(id) {
  return listSetups().filter(s => setupTagIds(s).has(id));
}

// EVERY TAG AN AD SETUP HOLDS, in one walk — the one answer "is this in use?" is read
// from, so the in-use refusals, the template's reach and anything counted later can
// never walk three different halves of the same document.
//
// It counts what the old walk missed (16 Sep): the GLOBAL WATERFALL at the setup's head,
// and the units a break PARKED in `ownRungs` when it switched to the global waterfall or
// off. Both are held by the setup — a parked unit returns the moment the switch goes
// back — so deleting their tag would have emptied a ladder nobody was looking at.
export function setupTagIds(s) {
  const ids = new Set();
  const addRungs = rungs => {
    for (const r of rungs || []) {
      if (r.type === 'group') for (const x of r.tagIds || []) ids.add(x);
      else if (r.tagId) ids.add(r.tagId);
    }
  };
  addRungs(s.waterfall?.rungs);
  for (const sec of s.sections || []) {
    for (const t of SLOT_TYPES) {
      const slot = (sec.slots || {})[t];
      if (!slot) continue;
      for (const g of slotGroupDefs(slot)) { addRungs(g.rungs); addRungs(g.ownRungs); }
      addRungs(slot.ownRungs);
      addRungs(slot.direct?.rungs);
    }
  }
  return ids;
}
// A rung's tag without the refusal — anything that walks ladders needs to ask "what
// type is this?" of every rung, including any whose tag has since gone.
export function getTagOrNull(id) { return state.tags.get(id) || null; }
