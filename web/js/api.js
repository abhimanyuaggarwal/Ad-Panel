// api.js — every request goes through a named operation. No view writes a URL.

const API_BASE = '';

async function call(method, path, body) {
  const res = await fetch(API_BASE + path, {
    method,
    headers: body ? { 'Content-Type': 'application/json' } : undefined,
    body: body ? JSON.stringify(body) : undefined,
  });
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
  publish: (kind, id) => call('POST', `/panel/${kind === 'key' ? 'keys' : 'setups'}/${id}/publish`),
  unpublish: (kind, id) => call('POST', `/panel/${kind === 'key' ? 'keys' : 'setups'}/${id}/unpublish`),
  restorePreview: (kind, id, v) => call('GET', `/panel/${kind === 'key' ? 'keys' : 'setups'}/${id}/versions/${v}/preview`),
  restoreVersion: (kind, id, v) => call('POST', `/panel/${kind === 'key' ? 'keys' : 'setups'}/${id}/versions/${v}/restore`),
  versions: (kind, id) => call('GET', `/panel/${kind === 'key' ? 'keys' : 'setups'}/${id}/versions`),
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
  // whether a rung is an ordinary one or the display fallback closing a video ladder.
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
