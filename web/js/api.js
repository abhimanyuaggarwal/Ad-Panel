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
    // Every refusal this server makes carries its own sentence. When there is none, the body
    // was not our envelope at all — an unknown route, or something in front of the server
    // answering for it — and the old fallback ('Request failed') named nothing a person could
    // act on. The commonest real cause, and the one worth naming, is a server older than the
    // app it is serving (8 Sep: a pre-restart process has no /panel/session, and Log out said
    // only "Request failed"). No status code and no URL: neither belongs on screen.
    const err = new Error(data.message
      || 'The server did not recognise that request — it may be running an older version of the console.');
    err.code = data.error;
    err.errors = data.errors || [];
    err.usedBy = data.usedBy || [];
    throw err;
  }
  return data;
}

const API = {
  meta: () => call('GET', '/panel/meta'),

  // THE FRONT DOOR (8 Sep). Three operations, one seam: the door reads `session`, the
  // typed address and the remembered-account row both go through `signIn`, and the profile
  // menu's Log out is `signOut`. A refused sign-in arrives as an Error carrying `code`
  // ('bad_address' | 'not_work_address' | 'no_account') and the server's own words, which
  // the door paints under the field — never a toast (a refusal belongs where it happened).
  session: () => call('GET', '/panel/session'),
  signIn: email => call('POST', '/panel/session', { email }),
  signOut: () => call('DELETE', '/panel/session'),

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
