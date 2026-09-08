// api/routes/gam.js — /panel/gam — the mock GAM ad unit directory: search and sync.
import express from 'express';
import * as store from '../store.js';
import { handle } from '../error-handler.js';

const r = express.Router();

r.get('/panel/gam/units', handle((req, res) => {
  res.json(store.gamUnits(req.query.q));
}));

// The real GAM pull takes 10–20 seconds; the mock takes a beat (never under test, the
// suite stays ~1s) so the search's in-flight row is a state a person can actually see.
r.post('/panel/gam/sync', (req, res) => {
  const go = handle((rq, rs) => {
    const { added, lastSync } = store.gamSync();
    rs.json({ added: added.length, units: added, lastSync });
  });
  setTimeout(() => go(req, res), process.env.NODE_ENV === 'test' ? 0 : 1800);
});

export default r;
