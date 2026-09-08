// store/tags.js — ad tags and ad unit templates: normalization, CRUD, in-use checks.
import { slotGroupDefs } from './ladders.js';
import { listSetups } from './setups.js';
import { AD_UNIT_EXAMPLE, AD_UNIT_PATH, DIRECTORY_PROVIDERS, PROPERTY_SCOPES, PROVIDER_TYPE, PROVIDER_WORD, Refusal, SLOT_TYPES, TAG_PROVIDERS, TAG_TYPES, TEMPLATE_MACROS, URL_PROVIDERS, state } from './state.js';
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
  const property = oneOf(input.property ?? 'All', 'property', PROPERTY_SCOPES, errors);
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
  if (errors.length) throw new Refusal(400, 'invalid_template', 'Ad unit template was refused', { errors });
  // The template's own switch (4 Sep, user call — the config rows' grammar): absence is
  // on, so every template saved before the field existed keeps carrying its units. Off
  // keeps the template, its name and its units' picks; those units request through their
  // provider's STANDARD until it is on again — and since templates resolve LIVE (no
  // publish plane), the switch takes effect on the players' next request.
  return { name, provider, url, property, on: input.on === undefined ? true : bool(input.on) };
}

export function createTemplate(input) {
  const t = normalizeTemplate(input);
  const id = `tpl_${++state.counters.template}`;
  const obj = { id, ...t, updatedAt: new Date().toISOString(), updatedBy: 'You' };
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
  const changes = diff(existing, t);
  Object.assign(existing, t, { updatedAt: new Date().toISOString(), updatedBy: 'You' });
  return { obj: existing, changes };
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
  const obj = { id, ...t, updatedAt: new Date().toISOString(), updatedBy: 'You' };
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
  Object.assign(existing, t, { updatedAt: new Date().toISOString(), updatedBy: 'You' });
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
  const inRungs = rungs => (rungs || []).some(r =>
    (r.type === 'tag' && r.tagId === id) || (r.type === 'group' && (r.tagIds || []).includes(id)));
  const holdsTag = slot => slotGroupDefs(slot).some(g => inRungs(g.rungs)) || inRungs(slot.direct?.rungs);
  return listSetups().filter(s =>
    (s.sections || []).some(sec => SLOT_TYPES.some(t => holdsTag(sec.slots[t]))));
}
// A rung's tag without the refusal — anything that walks ladders needs to ask "what
// type is this?" of every rung, including any whose tag has since gone.
export function getTagOrNull(id) { return state.tags.get(id) || null; }
