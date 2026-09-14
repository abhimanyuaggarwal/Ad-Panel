// test/run.js — the API rule suite, over HTTP. `npm test` (~1s).
//
// Boots the server in-process on :4299, then runs every file in ./cases in name order,
// each case against a freshly reset world (see ./harness.js). Add a case to the file
// whose subject it belongs to; add a file when a subject is new.

import { readdirSync } from 'node:fs';
import { PORTS } from '../api/config.js';
import * as harness from './harness.js';

// Set before the server is pulled in — which is why that import is dynamic, not static.
process.env.NODE_ENV = 'test';
process.env.PANEL_PORT = String(PORTS.test);

const { default: app } = await import('../api/server.js');
const server = app.listen(PORTS.test);

const dir = new URL('./cases/', import.meta.url);
const files = readdirSync(dir).filter(f => f.endsWith('.spec.js')).sort();
for (const f of files) {
  const { default: run } = await import(new URL(f, dir));
  await run(harness);
}

server.close();

const { passed, failed } = harness.summary();
console.log(`\n${passed} passed, ${failed} failed`);
if (failed) process.exit(1);
