// test/harness.js — what every case file is handed: an HTTP client against the
// in-process server, the `test` wrapper (resets the world before each case), the two
// assertions, and the fixtures and patch helpers the cases share.
//
// The suite talks to the server over HTTP only, so it pins behaviour, not internals:
// a refactor that keeps the suite green kept the product.

import { TEST_BASE } from '../api/config.js';

/** The suite's own server — the one address every case talks to (api/config.js). */
export const BASE = TEST_BASE;

let passed = 0, failed = 0;
const failures = [];

/** One HTTP call. Returns { status, body }; a non-JSON body reads as {}. */
export async function req(method, path, body) {
  const res = await fetch(BASE + path, {
    method,
    headers: body ? { 'Content-Type': 'application/json' } : undefined,
    body: body ? JSON.stringify(body) : undefined,
  });
  return { status: res.status, body: await res.json().catch(() => ({})) };
}

/** Run one case against a freshly reset world; failures are collected, never thrown. */
export async function test(name, fn) {
  await req('POST', '/panel/mock/reset');
  try {
    await fn();
    passed++;
    console.log(`  ok  ${name}`);
  } catch (e) {
    failed++;
    failures.push({ name, error: e.message });
    console.log(`FAIL  ${name}\n      ${e.message}`);
  }
}

export function assert(cond, msg) {
  if (!cond) throw new Error(msg);
}

/** Deep-equal by JSON, with a message that shows both sides. */
export function eq(a, b, msg) {
  assert(JSON.stringify(a) === JSON.stringify(b), `${msg}: expected ${JSON.stringify(b)}, got ${JSON.stringify(a)}`);
}

// Minimal valid inline field groups for new integrations in tests.
export const PLAYER_MIN = { autoplay: 'auto', playbackMode: 'inline' };

// A valid DRAFT: paused, nothing attached, nothing on — the state a new surface starts in.
export const VALID_KEY = () => ({
  name: 'Test key', property: 'TOI', platform: 'mweb',
  domains: ['m.timesofindia.com'],
  adSetupId: null,
  player: PLAYER_MIN,
  sections: [{ slots: {} }],
});

// A free copy of a demo setup: a test that wants a setup nobody else is watching
// photocopies one rather than borrowing a key's own. (Sharing one is legal since 8 Sep;
// these tests just want an object of their own to break.)
export async function freshSetup(fromId = 'as_1', name) {
  const r = await req('POST', `/panel/setups/${fromId}/duplicate`, name ? { name } : undefined);
  eq(r.status, 201, `duplicating ${fromId}`);
  return r.body.setup;
}

export async function patchSlot(keyId, secIndex, slot, patch) {
  const k = (await req('GET', `/panel/keys/${keyId}`)).body.key;
  const sections = k.sections.map(s => ({
    name: s.name,
    slots: Object.fromEntries(Object.entries(s.slots).map(([t, x]) => [t, { on: x.on }])),
  }));
  Object.assign(sections[secIndex].slots[slot], patch);
  return req('PATCH', `/panel/keys/${keyId}`, { sections });
}

// The drive decision, merged sparse — exactly how the UI writes it.
export async function patchDrive(keyId, t, fields) {
  const k = (await req('GET', `/panel/keys/${keyId}`)).body.key;
  const drive = JSON.parse(JSON.stringify(k.drive || {}));
  drive[t] = { ...(drive[t] || {}), ...fields };
  return req('PATCH', `/panel/keys/${keyId}`, { drive });
}

/** The tallies run.js prints and exits on. */
export function summary() {
  return { passed, failed, failures };
}
