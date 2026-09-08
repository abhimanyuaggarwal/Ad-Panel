// api/routes/keys.js — /panel/keys — integrations (the product room): list, read, create, edit,
// edit the player with field-level diffs, duplicate, delete. Bulk lives in ./keys-bulk.js.
import express from 'express';
import * as store from '../store.js';
import { handle } from '../error-handler.js';
import { keyView } from '../response-shapes.js';

const r = express.Router();

r.get('/panel/keys', handle((req, res) => {
  res.json({ keys: store.listKeys().map(keyView) });
}));

r.get('/panel/keys/:id', handle((req, res) => {
  res.json({ key: keyView(store.getKey(req.params.id)) });
}));

r.post('/panel/keys', handle((req, res) => {
  const { obj, warnings } = store.createKey(req.body);
  res.status(201).json({ key: keyView(obj), warnings });
}));

r.patch('/panel/keys/:id', handle((req, res) => {
  const { obj, changes, warnings } = store.updateKey(req.params.id, req.body);
  res.json({ key: keyView(obj), changes, warnings });
}));

// The integration's PLAYER, edited with FIELD-LEVEL diffs — so a version reads
// "Autoplay muted → with sound", not "integration updated". Key-level since 25 Aug: the
// per-section player route is GONE with the per-section player, and so is
// `…/sections/:i/rules` (how ads behave belongs to the ad setup's placement).
r.patch('/panel/keys/:id/player', handle((req, res) => {
  const { obj, changes } = store.updateKeyPlayer(req.params.id, req.body);
  res.json({ key: keyView(obj), changes });
}));

// Duplicate — clone the whole surface for an experiment. Fresh key string, and NOT
// published: a copy has no version history of its own, so it cannot serve until someone
// publishes it on purpose. The setup copies rather than linking even now that sharing
// is legal (8 Sep): an experiment that edits demand the original serves from is not one.
r.post('/panel/keys/:id/duplicate', handle((req, res) => {
  const obj = store.duplicateKey(req.params.id);
  res.status(201).json({ key: keyView(obj) });
}));

r.delete('/panel/keys/:id', handle((req, res) => {
  const obj = store.deleteKey(req.params.id);
  res.json({ deleted: obj.id });
}));

export default r;
