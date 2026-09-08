// test/run.js — the API rule suite, over HTTP. `npm test` (~1s).
//
// Boots the server in-process on :4299, then runs every file in ./cases in name order,
// each case against a freshly reset world (see ./harness.js). Add a case to the file
// whose subject it belongs to; add a file when a subject is new.

process.env.NODE_ENV = 'test';
process.env.PANEL_PORT = '4299';

import { readdirSync } from 'node:fs';
import * as harness from './harness.js';

const { default: app } = await import('../api/server.js');
const server = app.listen(4299);

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
