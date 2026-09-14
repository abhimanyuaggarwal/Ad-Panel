// api/config.js — THE KNOBS AN OPERATOR TURNS, in one place.
//
// This file holds only what changes between machines and runs: ports, and the two
// behaviours that differ under test. It is deliberately NOT where the product's rules
// live. Enums, caps, defaults and the seller-facing words stay in `store/state.js` and
// `store/ladders.js` on purpose, because each one is a rule the suite pins rather than a
// knob anyone turns — see ARCHITECTURE.md §9. If you are tempted to add a cap here, it
// belongs in `state.js` instead.
//
// PRECEDENCE, low to high:
//   1. the suggested defaults below, committed to the repo
//   2. environment variables (the table in ARCHITECTURE.md §9)
// There is no override file and no CLI flag layer, because nothing here has needed one.
// Add a layer when a real deployment asks for it, not before.
//
// SECRETS DO NOT LIVE HERE. There are none today (§11: no authentication yet). When the
// real identity exchange arrives, its credentials come from a secrets manager or
// deploy-time injection — never from this file and never from this precedence chain.
// This module may name a secret; it must never hold one.
//
// A note on timing: the env-derived values are FUNCTIONS, not constants, because
// `test/run.js` sets `NODE_ENV` and `PANEL_PORT` in its module body — which runs after
// its static imports. Reading them at call time is what keeps that working.

/** Ports. Fixed by convention so the three servers can never collide. */
export const PORTS = {
  /** The app: API and web on one process. Overridable with PANEL_PORT. */
  app: 4200,
  /** The rule suite hosts its own server here (`npm test`). */
  test: 4299,
  /** The screen capture hosts its own here, so it never reads whatever you were clicking. */
  snapshot: 4300,
};

/** The base URL of the suite's own server — the one address every case talks to. */
export const TEST_BASE = `http://localhost:${PORTS.test}`;

/** How long the mocked GAM sync pretends to take. The real pull is 10–20 s; the mock
 *  takes a beat so the in-flight row is a state a person can actually see. */
export const GAM_SYNC_DELAY_MS = 1800;

/** True while the suite is running: suppresses `app.listen` and drops the GAM delay to 0. */
export function isTestEnv() {
  return process.env.NODE_ENV === 'test';
}

/**
 * The port the app serves on. PANEL_PORT wins over the default; a value that is not a
 * usable port is a boot-time failure, not a silent fallback to 4200 — a typo that
 * quietly serves on the wrong port is the kind of thing nobody notices until a demo.
 * @returns {number}
 */
export function appPort() {
  const raw = process.env.PANEL_PORT;
  if (raw === undefined || raw === '') return PORTS.app;
  const port = Number(raw);
  if (!Number.isInteger(port) || port < 1 || port > 65535) {
    throw new Error(`PANEL_PORT must be a whole number from 1 to 65535 (got “${raw}”)`);
  }
  return port;
}

/** The mocked GAM sync's delay for this run — the beat, or nothing under test. */
export function gamSyncDelayMs() {
  return isTestEnv() ? 0 : GAM_SYNC_DELAY_MS;
}
