// api.js — every request the web app makes, as a named operation on `API`. No view
// writes a URL: a screen calls API.updateSetup(id, body), never fetch('/panel/…').
//
// `call` speaks the server's error envelope ({ error, message, errors, usedBy }) and turns
// a refused write into an Error carrying those fields, so a form can paint field errors
// (applyServerErrors in controls.js) and a toast can name the surfaces involved.

const API_BASE = '';

// The publish plane serves both kinds of object under two URL segments.
const pubSeg = kind => (kind === 'key' ? 'keys' : 'setups');

async function call(method, path, body) {
  let res;
  try {
    res = await fetch(API_BASE + path, {
      method,
      headers: body ? { 'Content-Type': 'application/json' } : undefined,
      body: body ? JSON.stringify(body) : undefined,
    });
  } catch {
    // The browser's "Failed to fetch" names nothing — this failure is always the same
    // thing here: the panel server did not answer. Say that, and what was NOT done.
    throw new Error('The panel server is not answering — nothing was changed. Check it is running, then try again.');
  }
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    const err = new Error(data.message || 'Request failed');
    err.code = data.error;
    err.errors = data.errors || [];
    err.usedBy = data.usedBy || [];
    throw err;
  }
  return data;
}

const API = {
  meta: () => call('GET', '/panel/meta'),

  listKeys: () => call('GET', '/panel/keys'),
  getKey: id => call('GET', `/panel/keys/${id}`),
  createKey: body => call('POST', '/panel/keys', body),
  updateKey: (id, body) => call('PATCH', `/panel/keys/${id}`, body),
  // THE PUBLISH PLANE (27 Aug) — the same four operations on either kind of object, so
  // the editors and the rail share one code path instead of two near-identical ones.
  publish: (kind, id, note) => call('POST', `/panel/${pubSeg(kind)}/${id}/publish`, note ? { note } : undefined),
  unpublish: (kind, id) => call('POST', `/panel/${pubSeg(kind)}/${id}/unpublish`),
  restorePreview: (kind, id, v) => call('GET', `/panel/${pubSeg(kind)}/${id}/versions/${v}/preview`),
  restoreVersion: (kind, id, v, note) => call('POST', `/panel/${pubSeg(kind)}/${id}/versions/${v}/restore`, note ? { note } : undefined),
  versions: (kind, id) => call('GET', `/panel/${pubSeg(kind)}/${id}/versions`),
  bulkKeys: body => call('POST', '/panel/keys/bulk', body),
  duplicateKey: id => call('POST', `/panel/keys/${id}/duplicate`),
  deleteKey: id => call('DELETE', `/panel/keys/${id}`),

  // The ops room: ad setups carry the ladders.
  listSetups: async () => {
    const r = await call('GET', '/panel/setups');
    for (const s of r.setups || []) window.NAME_LOOKUP[s.id] = s.name;
    return r;
  },
  getSetup: id => call('GET', `/panel/setups/${id}`),
  createSetup: body => call('POST', '/panel/setups', body),
  updateSetup: (id, body) => call('PATCH', `/panel/setups/${id}`, body),
  // "Attach a copy" (26 Aug): the 1:1 promise means a held setup is photocopied, never shared.
  duplicateSetup: (id, name) => call('POST', `/panel/setups/${id}/duplicate`, name ? { name } : undefined),
  deleteSetup: id => call('DELETE', `/panel/setups/${id}`),

  // Every screen that draws a ladder needs to know a tag's type — that is what decides
  // whether a rung is an ordinary one or the display unit settling a video waterfall.
  // Recording it here, at the one seam tags come through, means no screen has to keep
  // its own cache in step.
  listTags: async () => {
    const r = await call('GET', '/panel/tags');
    for (const t of r.tags || []) {
      window.TAG_TYPE[t.id] = t.type;
      window.TAG_PROVIDER[t.id] = t.provider;
      window.TAG_PROPERTY[t.id] = t.property;
      window.TAG_OFFDIR[t.id] = !!t.offDirectory;
      window.TAG_TPL[t.id] = t.tplName || null;
    }
    return r;
  },
  getTag: id => call('GET', `/panel/tags/${id}`),
  createTag: body => call('POST', '/panel/tags', body),
  updateTag: (id, body) => call('PATCH', `/panel/tags/${id}`, body),
  deleteTag: id => call('DELETE', `/panel/tags/${id}`),


  // Request templates — plumbing behind a tag, authored in the ops room (31 Aug).
  listTemplates: () => call('GET', '/panel/templates'),
  createTemplate: body => call('POST', '/panel/templates', body),
  updateTemplate: (id, body) => call('PATCH', `/panel/templates/${id}`, body),
  deleteTemplate: id => call('DELETE', `/panel/templates/${id}`),

  gamUnits: q => call('GET', `/panel/gam/units?q=${encodeURIComponent(q || '')}`),
  gamSync: () => call('POST', '/panel/gam/sync'),

  reset: () => call('POST', '/panel/mock/reset'),
};
