// api/error-handler.js — the one Express wrapper every route handler goes through.
//
// Store functions throw `Refusal` (see store/state.js) when a write breaks a rule.
// `handle` turns that into the machine-readable JSON the web app and the tests read:
// `{ error: <code>, message, ...details }` with the refusal's own HTTP status. Anything
// else that throws is a bug, logged and answered as a 500 so it is never mistaken for
// a rule.
import { Refusal } from './store.js';

/**
 * Wrap a synchronous route handler so a thrown Refusal becomes a JSON error response.
 * @param {(req: import('express').Request, res: import('express').Response) => void} fn
 * @returns {import('express').RequestHandler}
 */
export function handle(fn) {
  return (req, res) => {
    try {
      fn(req, res);
    } catch (e) {
      if (e instanceof Refusal) {
        res.status(e.status).json({ error: e.code, message: e.message, ...(e.details || {}) });
      } else {
        console.error(e);
        res.status(500).json({ error: 'internal', message: e.message });
      }
    }
  };
}
