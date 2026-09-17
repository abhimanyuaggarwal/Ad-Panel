// api/routes/publish.js — THE PUBLISH PLANE for all three kinds of object (integration,
// ad setup and ad unit template):
// publish, unpublish, versions, restore preview, restore — and /panel/live/:apiKey,
// the only door the player reads from.
import express from 'express';
import * as store from '../store.js';
import { handle } from '../error-handler.js';
import { publicVersion } from '../response-shapes.js';

const r = express.Router();

// ---------- THE PUBLISH PLANE (27 Aug) ----------
// Save writes the draft; these put it on air. An integration and its ad setup publish
// SEPARATELY (user call), so each publish answers the darkness question against what is
// actually live — see `publishObject`.
for (const [kind, seg] of [['key', 'keys'], ['setup', 'setups'], ['template', 'templates']]) {
  r.post(`/panel/${seg}/:id/publish`, handle((req, res) => {
    const { version, warnings } = store.publishObject(kind, req.params.id, store.ACTOR, req.body?.note);
    res.json({ version: publicVersion(version), live: true, warnings });
  }));

  r.post(`/panel/${seg}/:id/unpublish`, handle((req, res) => {
    store.unpublishObject(kind, req.params.id);
    res.json({ live: false });
  }));

  // What restoring would change, counted before anyone commits to it.
  r.get(`/panel/${seg}/:id/versions/:v/preview`, handle((req, res) => {
    res.json(store.restorePreview(kind, req.params.id, req.params.v));
  }));

  r.post(`/panel/${seg}/:id/versions/:v/restore`, handle((req, res) => {
    const { version, restoredFrom } = store.restoreVersion(kind, req.params.id, req.params.v, store.ACTOR, req.body?.note);
    res.json({ version: publicVersion(version), restoredFrom });
  }));

  // The rail reads this: every version, newest first, with what it changed — never the
  // snapshots themselves, which are large and are nobody's business but the player's.
  r.get(`/panel/${seg}/:id/versions`, handle((req, res) => {
    const id = req.params.id;
    store.getVersionOwner(kind, id);
    res.json({
      versions: store.versionsOf(id).map(publicVersion).reverse(),
      liveVersion: store.liveVersion(id),
      unpublished: store.unpublishedChanges(kind, id),
    });
  }));
}

// THE PLAYER'S API — the only door to what actually serves. It reads the PUBLISHED
// snapshots and nothing else: a draft is invisible here no matter how many times it was
// saved, which is the whole point of the plane.
r.get('/panel/live/:apiKey', handle((req, res) => {
  const live = store.liveConfig(req.params.apiKey);
  if (!live) return res.status(404).json({ error: 'not_live', message: 'No published configuration for that key' });
  res.json(live);
}));

export default r;
