// api/routes/session.js — /panel/session — the front door's three operations.
//
//   GET     who is signed in, and which accounts the console remembers  (the door + the band)
//   POST    sign an address in, or refuse it by name
//   DELETE  sign out — the act behind the profile menu's Log out
//
// The rules are in store/session.js; this file parses, calls, and shapes. Nothing here
// authenticates anything: what is missing is the identity exchange, and it is listed in
// ARCHITECTURE.md §11 with the rest of the prototype's gaps.
import express from 'express';
import * as store from '../store.js';
import { handle } from '../error-handler.js';
import { sessionView, accountView } from '../response-shapes.js';

const r = express.Router();

r.get('/panel/session', handle((req, res) => {
  res.json(sessionView());
}));

// One body field: the address. `via` is a hint the door passes when the person picked a
// remembered account instead of typing — recorded nowhere yet, and read by nothing, so it
// is accepted and dropped rather than half-stored.
r.post('/panel/session', handle((req, res) => {
  const account = store.signIn(req.body?.email);
  res.json({ signedIn: true, account: accountView(account) });
}));

r.delete('/panel/session', handle((req, res) => {
  store.signOut();
  res.json({ signedIn: false, account: null });
}));

export default r;
