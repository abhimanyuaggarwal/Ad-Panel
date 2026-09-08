// api/routes/setups.js — /panel/setups — ad setups (the ops room): list, read, create, edit,
// edit one placement's behaviour with field-level diffs, duplicate, delete.
import express from 'express';
import * as store from '../store.js';
import { handle } from '../error-handler.js';
import { setupView } from '../response-shapes.js';

const r = express.Router();

r.get('/panel/setups', handle((req, res) => {
  res.json({ setups: store.listSetups().map(setupView) });
}));

r.get('/panel/setups/:id', handle((req, res) => {
  res.json({ setup: setupView(store.getSetup(req.params.id)) });
}));

// One placement's behaviour — how its ads behave, per slot. (Across-the-session died
// 27 Aug; a payload still carrying `rules` is refused by name.)
// This is where "Ad behaviour" went (25 Aug): one edit here reaches every attached
// integration, which is the whole reason the ops room exists.
r.patch('/panel/setups/:id/sections/:index/behaviour', handle((req, res) => {
  const { obj, section, changes, warnings } =
    store.updateSetupBehaviour(req.params.id, Number(req.params.index), req.body || {});
  res.json({ setup: setupView(obj), changes, warnings });
}));

r.post('/panel/setups', handle((req, res) => {
  const obj = store.createSetup(req.body);
  res.status(201).json({ setup: setupView(obj) });
}));

r.patch('/panel/setups/:id', handle((req, res) => {
  const { obj, changes, warnings } = store.updateSetup(req.params.id, req.body);
  res.json({ setup: setupView(obj), changes, warnings });
}));

// The 1:1 promise's escape hatch (26 Aug, DRIVING-SCOPE): "attach a copy". A
// photocopy — placements, ladders, behaviour — never a link.
r.post('/panel/setups/:id/duplicate', handle((req, res) => {
  const obj = store.duplicateSetup(req.params.id, req.body?.name);
  res.status(201).json({ setup: setupView(obj) });
}));

r.delete('/panel/setups/:id', handle((req, res) => {
  const obj = store.deleteSetup(req.params.id);
  res.json({ deleted: obj.id });
}));

export default r;
