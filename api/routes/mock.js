// api/routes/mock.js — POST /panel/mock/reset — rebuild the invented world (see ../mock/world.js).
import express from 'express';
import * as store from '../store.js';
import { handle } from '../error-handler.js';
import { resetWorld } from '../mock/world.js';

const r = express.Router();

// ---------- mock ----------
r.post('/panel/mock/reset', handle((req, res) => {
  // Named scenarios: no argument rebuilds the demo seven; `scale` keeps those
  // seven and adds volume on top, for paging and select-all.
  resetWorld({ scenario: req.body?.scenario });
  res.json({ ok: true, scenario: req.body?.scenario || 'demo', integrations: store.listKeys().length });
}));

export default r;
