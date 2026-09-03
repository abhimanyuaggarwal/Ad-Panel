// panel/test/run.js — API rule tests over HTTP. `npm run test:panel` (~1s).
// Starts the server in-process on a test port, resets the world between cases.
//
// TWO ROOMS suite (24 Aug rework, re-cut 26 Aug for DRIVING-SCOPE): /panel/keys is the
// product room (switches + the DRIVE quick decisions), /panel/setups the ops room
// (ladders, behaviour — the workshop). Setups are 1:1 with integrations, a promise the
// seam enforces. Local overrides (muted rungs, local order, sparse behaviour bends) are
// REMOVED, not hidden — payloads carrying them are refused by name.

process.env.NODE_ENV = 'test';
process.env.PANEL_PORT = '4299';

const { default: app } = await import('../api/server.js');
const BASE = 'http://localhost:4299';
const server = app.listen(4299);

let passed = 0, failed = 0;
const failures = [];

async function req(method, path, body) {
  const res = await fetch(BASE + path, {
    method,
    headers: body ? { 'Content-Type': 'application/json' } : undefined,
    body: body ? JSON.stringify(body) : undefined,
  });
  return { status: res.status, body: await res.json().catch(() => ({})) };
}

async function test(name, fn) {
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

function assert(cond, msg) {
  if (!cond) throw new Error(msg);
}

function eq(a, b, msg) {
  assert(JSON.stringify(a) === JSON.stringify(b), `${msg}: expected ${JSON.stringify(b)}, got ${JSON.stringify(a)}`);
}

// Minimal valid inline field groups for new integrations in tests.
const PLAYER_MIN = { autoplay: 'auto', playbackMode: 'inline' };

// A valid DRAFT: paused, nothing attached, nothing on — the state a new surface starts in.
const VALID_KEY = () => ({
  name: 'Test key', property: 'TOI', platform: 'mweb',
  domains: ['m.timesofindia.com'],
  adSetupId: null,
  player: PLAYER_MIN,
  sections: [{ slots: {} }],
});

// A free copy of a demo setup — the 1:1 promise means tests that need an attachable
// setup photocopy one rather than borrowing a key's own.
async function freshSetup(fromId = 'as_1', name) {
  const r = await req('POST', `/panel/setups/${fromId}/duplicate`, name ? { name } : undefined);
  eq(r.status, 201, `duplicating ${fromId}`);
  return r.body.setup;
}

async function patchSlot(keyId, secIndex, slot, patch) {
  const k = (await req('GET', `/panel/keys/${keyId}`)).body.key;
  const sections = k.sections.map(s => ({
    name: s.name,
    slots: Object.fromEntries(Object.entries(s.slots).map(([t, x]) => [t, { on: x.on }])),
  }));
  Object.assign(sections[secIndex].slots[slot], patch);
  return req('PATCH', `/panel/keys/${keyId}`, { sections });
}

// The drive decision, merged sparse — exactly how the UI writes it.
async function patchDrive(keyId, t, fields) {
  const k = (await req('GET', `/panel/keys/${keyId}`)).body.key;
  const drive = JSON.parse(JSON.stringify(k.drive || {}));
  drive[t] = { ...(drive[t] || {}), ...fields };
  return req('PATCH', `/panel/keys/${keyId}`, { drive });
}

// ---------- seed & determinism ----------

await test('reset seeds 7 ad setups, 25 tags, 7 integrations — one setup each, and the old rooms are gone', async () => {
  const s = await req('GET', '/panel/setups');
  const t = await req('GET', '/panel/tags');
  const k = await req('GET', '/panel/keys');
  eq(s.body.setups.length, 7, 'setups');
  eq(t.body.tags.length, 25, 'tags');
  eq(k.body.keys.length, 7, 'keys');
  assert(s.body.setups.every(x => x.usedBy <= 1), 'no setup fills two integrations — the 1:1 promise');
  eq((await req('GET', '/panel/policies')).status, 404, 'ad rules are not an identity any more');
  eq((await req('GET', '/panel/behaviours')).status, 404, 'player setups are not an identity any more');
});

await test('reset re-issues the same ids and key strings (deterministic)', async () => {
  const first = (await req('GET', '/panel/keys')).body.keys.map(k => k.id + ':' + k.key);
  await req('POST', '/panel/mock/reset');
  const second = (await req('GET', '/panel/keys')).body.keys.map(k => k.id + ':' + k.key);
  eq(second, first, 'ids/keys after reset');
});

await test('the scale scenario is additive and keeps the promise: one setup per integration', async () => {
  await req('POST', '/panel/mock/reset', { scenario: 'scale' });
  const keys = (await req('GET', '/panel/keys')).body.keys;
  const setups = (await req('GET', '/panel/setups')).body.setups;
  eq(keys.length, 67, '60 generated on top of the demo seven');
  eq(setups.length, 67, 'sixty of their own setups on top of the demo seven');
  const k1 = keys.find(k => k.id === 'key_1');
  eq(k1.name, 'TOI Mweb VideoShow', 'key_1 keeps its identity');
  assert(setups.every(s => s.usedBy <= 1), 'the 1:1 promise holds at scale too');
});

// ---------- the model: two rooms, one setup each ----------

await test('an integration carries ONE player; how ads behave comes from the setup', async () => {
  const k = (await req('GET', '/panel/keys/key_6')).body.key;
  eq(k.player.autoplay, 'on', 'the player is the integration\'s, at key level');
  eq(k.player.countdown, undefined, 'the trimmed fields are gone from the model, not hidden');
  eq(k.sections[0].player, undefined, 'and nothing about the player lives on a placement');
  eq(k.setupName, 'NBT VideoShow demand', 'one setup');
  // Behaviour is READ-ONLY here: counted facts from the placement, edited in the setup.
  eq(k.sections[0].adRules, undefined, 'a placement has no session-wide settings to show — they were cut 27 Aug');
  eq(k.sections[0].slots.preroll.behaviour.start, 'start', 'and each slot\'s own behaviour');
  eq(k.sections[1].slots.preroll.behaviour.start, 'deferred', 'Live blog paces its own way');
});

await test('AD AUDIO is CUT (2 Sep) — refused by name from every door; the player owns how it starts', async () => {
  const s = (await req('GET', '/panel/setups/as_5')).body.setup;
  eq(s.sections[0].slots.preroll.behaviour.adSound, undefined, 'no behaviour carries it any more');
  const r = await req('PATCH', '/panel/setups/as_5/sections/0/behaviour',
    { slot: 'preroll', behaviour: { adSound: 'muted' } });
  eq(r.status, 400, 'refused in the ops room');
  assert(r.body.errors.some(e => e.message.includes('Player config')),
    `says where the answer lives now (got ${JSON.stringify(r.body.errors)})`);
  eq((await patchDrive('key_6', 'preroll', { adSound: 'prompt' })).status, 400, 'and the drive never takes it');
});

await test('REQUEST DELAY rides every ladder rung (2 Sep) — a video rung too, sparse until set', async () => {
  const s = (await req('GET', '/panel/setups/as_1')).body.setup;
  const rungs = s.sections[0].slots.preroll.rungs.map(r => ({ ...r }));
  eq(rungs[0].showAfterSec, undefined, 'a video rung saved before the widening carries nothing');
  rungs[0].showAfterSec = 3;
  const secs = s.sections.map((sec, i) => (i === 0
    ? { ...sec, slots: { ...sec.slots, preroll: { ...sec.slots.preroll, rungs } } } : sec));
  const r = await req('PATCH', '/panel/setups/as_1', { sections: secs });
  eq(r.status, 200, 'a video rung takes a request delay now');
  eq(r.body.setup.sections[0].slots.preroll.rungs[0].showAfterSec, 3, 'held on the rung');
  const bad = rungs.map(x => ({ ...x }));
  bad[0].hideAfterSec = 20;
  const r2 = await req('PATCH', '/panel/setups/as_1', { sections: secs.map((sec, i) => (i === 0
    ? { ...sec, slots: { ...sec.slots, preroll: { ...sec.slots.preroll, rungs: bad } } } : sec)) });
  eq(r2.status, 400, 'the close clocks stay banner-only, refused by name');
});

await test('the ad rules route is GONE from the integration — behaviour lives in the setup', async () => {
  const r = await req('PATCH', '/panel/keys/key_1/sections/0/rules', { maxAdsPerSession: 3 });
  eq(r.status, 404, 'removed, not hidden');
});

// ---------- the 1:1 promise ----------

await test('the wizard\'s create is ONE door: setup copy + switches + drive land whole, off air', async () => {
  // The creation wizard (1 Sep) photocopies the source's setup, then creates in one
  // POST carrying details, player, switches and drive. Nothing exists before it; the
  // integration is born a draft.
  const setup = (await req('POST', '/panel/setups/as_1/duplicate', { name: 'Wizard born demand' })).body.setup;
  const src = (await req('GET', '/panel/keys/key_1')).body.key;
  const r = await req('POST', '/panel/keys', {
    name: 'TOI Mweb VideoShow copy', property: src.property, platform: src.platform,
    domains: ['copy.timesofindia.com'], player: src.player, adSetupId: setup.id,
    drive: src.drive,
    sections: src.sections.map(sec => ({ name: sec.name,
      slots: Object.fromEntries(['preroll', 'midroll', 'postroll', 'outstream'].map(t => [t, { on: !!sec.slots[t]?.on }])) })),
  });
  eq(r.status, 201, 'born whole');
  const k = r.body.key;
  eq(k.live, false, 'and off air — publishing stays a deliberate act');
  eq(k.setupName, 'Wizard born demand', 'its own copy fills it');
  eq(k.sections[0].slots.preroll.on, src.sections[0].slots.preroll.on, 'switches came along');
  assert(JSON.stringify(k.drive || {}) === JSON.stringify(src.drive || {}), 'and the drive decisions');
  await req('DELETE', `/panel/keys/${k.id}`);
  await req('DELETE', `/panel/setups/${setup.id}`);
});

await test('a setup another integration holds cannot be attached — refused naming the holder', async () => {
  const k3 = (await req('GET', '/panel/keys/key_3')).body.key;
  eq(k3.setupName, 'TOI Desktop VideoShow demand', 'desktop has its own copy of the shape now');
  const r = await req('PATCH', '/panel/keys/key_3', { adSetupId: 'as_1' });
  eq(r.status, 400, 'refused — as_1 is key_1\'s');
  assert(r.body.errors.some(e => e.message.includes('already fills “TOI Mweb VideoShow”')), 'the holder is named');
  assert(r.body.errors.some(e => e.message.includes('Attach a copy instead')), 'and the way out is named');
});

await test('"attach a copy": duplicating a setup gives a whole photocopy, attachable', async () => {
  const copy = await freshSetup('as_1', 'Scratch VideoShow demand');
  eq(copy.name, 'Scratch VideoShow demand', 'named as asked');
  eq(copy.usedBy, 0, 'free');
  eq(copy.sections.map(x => x.name), ['Default', 'Shorts feed'], 'placements came whole');
  eq(copy.sections[0].slots.preroll.rungCountConfigured, 10, 'ladders came whole');
  const draft = await req('POST', '/panel/keys', {
    ...VALID_KEY(), adSetupId: copy.id,
    sections: [{ slots: { preroll: { on: true } } }],
  });
  eq(draft.status, 201, 'the copy attaches where the original refused');
});

await test('duplicating an integration copies its setup too — a link would break the promise', async () => {
  const r = await req('POST', '/panel/keys/key_1/duplicate');
  eq(r.status, 201, 'created');
  const copy = r.body.key;
  eq(copy.live, false, 'a copy has no version history, so it cannot serve until someone publishes it');
  eq(copy.setupName, 'TOI Mweb VideoShow copy demand', 'its own setup, photocopied');
  const as1 = (await req('GET', '/panel/setups/as_1')).body.setup;
  eq(as1.usedBy, 1, 'the original still fills exactly one');
  const src = (await req('GET', '/panel/keys/key_1')).body.key;
  assert(copy.key !== src.key, 'fresh key string');
  eq(copy.player.autoplay, src.player.autoplay, 'the player copied');
});

await test('a section name the setup does not know is refused — placements are ops\' to add', async () => {
  const copy = await freshSetup('as_2');
  const r = await req('POST', '/panel/keys', {
    ...VALID_KEY(), adSetupId: copy.id,
    sections: [
      { slots: { preroll: { on: true } } },
      { name: 'Ghost', slots: { preroll: { on: true } } },
    ],
  });
  eq(r.status, 400, 'refused');
  assert(r.body.errors.some(e => e.message.includes('is not a placement in')), 'named, with where to fix it');
});

await test('ops cannot remove a placement that still runs live; a rename migrates the overlays', async () => {
  const as1 = (await req('GET', '/panel/setups/as_1')).body.setup;
  const drop = await req('PATCH', '/panel/setups/as_1', { sections: [as1.sections[0]] });
  eq(drop.status, 409, 'key_1 runs Shorts feed live — removal refused');
  assert(drop.body.usedBy.some(n => n.includes('Shorts feed')), 'the placement is named');
  const rename = await req('PATCH', '/panel/setups/as_5', {
    sections: [{ name: 'Default' }, { name: 'Blog live' }],
  });
  eq(rename.status, 200, 'renaming is fine');
  const k6 = (await req('GET', '/panel/keys/key_6')).body.key;
  eq(k6.sections[1].name, 'Blog live', 'the key follows the rename');
  eq(k6.sections[1].slots.preroll.on, true, 'its switches came along — nothing orphaned');
});

await test('an ad setup carries its placements and their ladders, counted', async () => {
  const s = (await req('GET', '/panel/setups/as_1')).body.setup;
  eq(s.name, 'TOI VideoShow demand', 'the setup');
  eq(s.usedBy, 1, 'one integration — its own');
  eq(s.usedByNames, ['TOI Mweb VideoShow'], 'named');
  eq(s.sections.map(x => x.name), ['Default', 'Shorts feed'], 'placements live here');
  eq(s.sections[0].slots.preroll.rungCountConfigured, 10, 'Default pre-roll is at the ten-rung cap');
  eq(s.sections[0].slots.preroll.rungCount, 8, 'eight of them live — ops killed two inside the tail');
  eq(s.liveCounts['Shorts feed'].preroll.on, 1, 'counted per placement');
});

await test('the integration page shows the WALK, named by company — the ladder stays ops-side', async () => {
  const k = (await req('GET', '/panel/keys/key_1')).body.key;
  const pre = k.sections[0].slots.preroll;
  eq(pre.on, true, 'switch');
  eq(pre.hasDemand, true, 'demand fact');
  eq(pre.rungCount, 8, 'counted LIVE tries behind the switch');
  eq(pre.rungCountConfigured, 10, 'ten rungs configured — the two ops killed are not walked');
  eq(pre.walk.length, 8, 'the walk itself, named');
  assert(pre.walk[0].label.includes('Pre-roll'), 'tries read as names, never paths to type');
  eq(pre.walk[0].provider, 'ima', 'and carry their company');
  eq([...pre.providers].sort(), ['can', 'gpt', 'ima'], 'the companies behind this break — the Who menu');
  eq(pre.fellBack, false, 'nothing falling back');
  eq(k.sections[0].setupName, 'TOI VideoShow demand', 'fills-from reference');
});

// ---------- the seam: fail closed, with names, both directions ----------

await test('a slot cannot switch on with no ad setup attached', async () => {
  const r = await req('POST', '/panel/keys', {
    ...VALID_KEY(),
    sections: [{ slots: { preroll: { on: true } } }],
  });
  eq(r.status, 400, 'refused');
  assert(r.body.errors.some(e => e.message.includes('no ad setup is attached')), `names the gap (got ${JSON.stringify(r.body.errors)})`);
});

await test('a slot cannot switch on where the setup carries no demand — the setup is named', async () => {
  const k = (await req('GET', '/panel/keys/key_6')).body.key;
  const r = await patchSlot('key_6', 0, 'postroll', { on: true }); // no post-roll ladder there
  eq(r.status, 400, 'refused');
  assert(r.body.errors.some(e => e.message.includes('“NBT VideoShow demand” carries no postroll demand')),
    `the refusal names the setup (got ${JSON.stringify(r.body.errors)})`);
  eq(k.sections[0].slots.postroll.on, false, 'and it stays off');
});

await test('re-attaching runs the same check: a setup lacking demand for an on slot is refused', async () => {
  const copy = await freshSetup('as_2', 'ArticleShow shape copy'); // no mid-roll demand
  const r = await req('PATCH', '/panel/keys/key_4', { adSetupId: copy.id }); // key_4 runs mid-roll
  eq(r.status, 400, 'refused — the ArticleShow shape has no mid-roll');
  assert(r.body.errors.some(e => e.message.includes('carries no midroll demand')), 'named');
});

await test('ops side: a setup a live section feeds on cannot be emptied — it is named', async () => {
  const r = await req('PATCH', '/panel/setups/as_5', { slots: { midroll: { rungs: [] } } });
  eq(r.status, 409, 'refused');
  assert(r.body.message.includes('their midroll from this'), `counted refusal (got ${r.body.message})`);
  assert(r.body.usedBy.some(n => n.includes('NBT Mweb VideoShow')), 'the integration is named');
  const still = (await req('GET', '/panel/setups/as_5')).body.setup;
  eq(still.sections[0].slots.midroll.rungCountConfigured, 2, 'nothing was half-applied');
});

await test('the same edit passes where the switch is off — and reaches nobody until published', async () => {
  const r = await req('PATCH', '/panel/setups/as_2', { slots: { outstream: { rungs: [] } } });
  eq(r.status, 200, 'key_2 keeps its out-stream off, so the demand may go');
  // The blast radius moved to PUBLISH (27 Aug): on Save it would be a lie every time.
  assert(!r.body.warnings.some(w => w.includes('picks this up')), 'a save warns about no traffic');
  const pub = await req('POST', '/panel/setups/as_2/publish');
  eq(pub.status, 200, 'published');
  assert(pub.body.warnings.some(w => w.includes('“TOI Mweb ArticleShow” picks this up')),
    `the blast radius is named where it is true (got ${JSON.stringify(pub.body.warnings)})`);
});

await test('switching the last live rung off in a setup is as dark as emptying it — refused', async () => {
  const s = (await req('GET', '/panel/setups/as_5')).body.setup;
  const rungs = s.sections[0].slots.preroll.rungs.map(r => ({ ...r, on: false }));
  const r = await req('PATCH', '/panel/setups/as_5', { slots: { preroll: { rungs } } });
  eq(r.status, 409, 'refused — a live pre-roll would go dark');
  assert(r.body.usedBy.length >= 1, 'sections named');
});

await test('an attached setup cannot be deleted; a free one can', async () => {
  const del = await req('DELETE', '/panel/setups/as_1');
  eq(del.status, 409, 'attached — refused');
  eq(del.body.usedBy, ['TOI Mweb VideoShow'], 'the holder named');
  const fresh = await req('POST', '/panel/setups', { name: 'Scratch demand', property: 'TOI', sections: [{ name: 'Default', slots: {} }] });
  eq(fresh.status, 201, 'created');
  eq((await req('DELETE', `/panel/setups/${fresh.body.setup.id}`)).status, 200, 'free — deleted');
});

await test('the one-act fix: a rung switch in the setup reaches its surface instantly', async () => {
  const s = (await req('GET', '/panel/setups/as_1')).body.setup;
  const rungs = s.sections[0].slots.preroll.rungs.map((r, i) => i === 1 ? { ...r, on: false } : { ...r });
  const r = await req('PATCH', '/panel/setups/as_1', { slots: { preroll: { rungs } } });
  eq(r.status, 200, 'saved');
  const k = (await req('GET', '/panel/keys/key_1')).body.key;
  eq(k.sections[0].slots.preroll.rungCount, 7, 'the panel shows the draft walking one rung fewer');
  const apiKey = k.key;
  eq((await req('GET', `/panel/live/${apiKey}`)).body.sections[0].slots.preroll.walk.length, 8,
    'and the PLAYER still walks the published eight — one act, but a published one');
  const pub = await req('POST', '/panel/setups/as_1/publish');
  assert(pub.body.warnings.some(w => w.includes('“TOI Mweb VideoShow” picks this up')), 'named at publish');
  eq((await req('GET', `/panel/live/${apiKey}`)).body.sections[0].slots.preroll.walk.length, 7,
    'now the one act has reached the surface');
});

// ---------- LOCAL OVERRIDES ARE GONE (26 Aug, DRIVING-SCOPE) ----------

await test('muted rungs, local order and behaviour bends are refused by name — removed, not hidden', async () => {
  for (const patch of [{ muted: ['tag_1'] }, { order: ['tag_2', 'tag_1'] }, { bhv: { podAds: 2 } }]) {
    const r = await patchSlot('key_1', 0, 'preroll', patch);
    eq(r.status, 400, `${Object.keys(patch)[0]} refused`);
    assert(r.body.errors.some(e => e.message.includes('cannot carry its own walk any more')),
      `says where the walk lives now (got ${JSON.stringify(r.body.errors)})`);
  }
});

// ---------- THE DRIVE: the ad partners, in the order they are asked ----------

await test('one partner on, the rest off: the walk narrows, every section, setup untouched', async () => {
  const r = await patchDrive('key_1', 'preroll', { ask: ['ima'] });
  eq(r.status, 200, 'saved');
  const k = (await req('GET', '/panel/keys/key_1')).body.key;
  eq(k.drive.preroll.ask.join(','), 'ima', 'the decision is stored as intent — an ordered list');
  eq(k.sections[0].slots.preroll.rungCount, 6, 'Default walks its six IMA rungs');
  assert(k.sections[0].slots.preroll.walk.every(x => x.provider === 'ima'), 'nobody else is asked');
  eq(k.sections[1].slots.preroll.rungCount, 2, 'Shorts feed walks its own two — one decision, every section');
  const s = (await req('GET', '/panel/setups/as_1')).body.setup;
  eq(s.sections[0].slots.preroll.rungView.filter(x => x.on).length, 8, 'the setup never moved');
});

// TIERS (31 Aug, AD-JSON-SCOPE): the PRIMARY is a position, not a preference — the ask
// orders the FALLBACK only, which is the one ordered thing left.
await test('dragging a partner to the front reorders the FALLBACK — the primary is never displaced', async () => {
  const r = await patchDrive('key_1', 'preroll', { ask: ['gpt', 'ima', 'can'] });
  eq(r.status, 200, 'saved');
  const pre = (await req('GET', '/panel/keys/key_1')).body.key.sections[0].slots.preroll;
  eq(pre.rungCount, 8, 'nothing is dropped — GPT is simply asked first among the fallbacks');
  eq(pre.walk[0].provider, 'ima', 'the primary keeps its seat — a position, not a preference');
  eq(pre.walk[1].provider, 'gpt', 'then the first fallback ask');
  eq(pre.walk[pre.walk.length - 1].provider, 'can', 'and CAN last');
});

await test('the order is the whole fallback decision — the same three chips, rearranged', async () => {
  await patchDrive('key_1', 'preroll', { ask: ['can', 'gpt', 'ima'] });
  const w = (await req('GET', '/panel/keys/key_1')).body.key.sections[0].slots.preroll.walk;
  eq(w[0].provider, 'ima', 'the primary first, always');
  eq(w[1].provider, 'can', 'then CAN, as the list says');
  eq(w[2].provider, 'gpt', 'then GPT');
  // …and two rungs of the same partner keep the order ad ops gave them.
  const imas = w.slice(1).filter(x => x.provider === 'ima').map(x => x.label);
  const setupImas = (await req('GET', '/panel/setups/as_1')).body.setup
    .sections[0].slots.preroll.rungView.slice(1).filter(x => x.on && x.provider === 'ima').map(x => x.label);
  eq(imas.join('|'), setupImas.join('|'), 'inside one partner, the setup\'s own order survives');
});

await test('the decision is INTENT: an ops ladder edit lands and the decision still means itself', async () => {
  await patchDrive('key_1', 'preroll', { ask: ['gpt', 'ima', 'can'], tries: 3 });
  // Ops change the pace — an unrelated edit.
  const setup = (await req('GET', '/panel/setups/as_1')).body.setup;
  const ops = await req('PATCH', '/panel/setups/as_1/sections/0/behaviour',
    { slot: 'preroll', behaviour: { ...setup.sections[0].slots.preroll.behaviour, tagTimeoutMs: 2000 } });
  eq(ops.status, 200, 'ops changed the pace');
  const pre = (await req('GET', '/panel/keys/key_1')).body.key.sections[0].slots.preroll;
  eq(pre.behaviour.tagTimeoutMs, 2000, 'the surface took the ops change');
  eq(pre.walk[1].provider, 'gpt', 'and still asks GPT first after the primary');
  eq(pre.rungCount, 3, 'and still stops after three tries');
});

await test('a decision no section can honour refuses the save that makes it, by name', async () => {
  const r = await patchDrive('key_7', 'preroll', { ask: ['gpt'] }); // NBT MiniTV: IMA only
  eq(r.status, 400, 'refused');
  assert(r.body.errors.some(e => e.message.includes('asks GPT and “NBT MiniTV demand” carries none there')),
    `named, with the way out (got ${JSON.stringify(r.body.errors)})`);
  const none = await patchDrive('key_1', 'preroll', { ask: [] });
  eq(none.status, 400, 'switching every partner off is refused too');
  assert(none.body.errors.some(e => e.message.includes('would ask nobody')), 'named');
});

await test('a decision SOME sections cannot honour falls back there — warned by section name', async () => {
  const r = await patchDrive('key_6', 'preroll', { ask: ['gpt'] }); // GPT sits in Live blog only
  eq(r.status, 200, 'saved — Live blog can honour it');
  assert(r.body.warnings.some(w => w.includes('Default: no GPT in the preroll — runs as set up there')),
    `the miss is named (got ${JSON.stringify(r.body.warnings)})`);
  const k = (await req('GET', '/panel/keys/key_6')).body.key;
  // Default's pre-roll is primary-only: the decision has no fallback to bite on, so the
  // walk is the same either way. Named at the save (above) — QUIET as a standing fact
  // (1 Sep, groups walkthrough: 'fell back' means the walk diverges, and here it cannot).
  eq(k.sections[0].slots.preroll.fellBack, false, 'no divergence — nothing to flag on the standing views');
  eq(k.sections[0].slots.preroll.rungCount, 1, 'and keeps serving — never dark until noticed');
  eq(k.sections[1].slots.preroll.walk[0].provider, 'ima', 'the live blog keeps its primary — a position');
  eq(k.sections[1].slots.preroll.walk[1].provider, 'gpt', 'and honours the decision in its fallback');
});

await test('ops stranding a decision warns at the moment of harm, and the break falls back', async () => {
  await patchDrive('key_2', 'preroll', { ask: ['gpt'] }); // as_2 pre-roll: IMA + one GPT display
  const s = (await req('GET', '/panel/setups/as_2')).body.setup;
  const imaOnly = s.sections[0].slots.preroll.rungs.filter((r, i) => i === 0);
  const ops = await req('PATCH', '/panel/setups/as_2', { slots: { preroll: { rungs: imaOnly } } });
  eq(ops.status, 200, 'the removal itself is fine — the break still fills');
  assert(ops.body.warnings.some(w => w.includes('asks GPT') && w.includes('falls back to your arrangement')),
    `ops are told whose decision this strands (got ${JSON.stringify(ops.body.warnings)})`);
  const pre = (await req('GET', '/panel/keys/key_2')).body.key.sections[0].slots.preroll;
  // The stranding left a primary-only ladder: the walk cannot diverge any more, so the
  // standing fact is quiet (1 Sep) — the saves are where the stranding keeps being said.
  eq(pre.fellBack, false, 'primary-only after the strand — no divergence to flag');
  eq(pre.walk[0].provider, 'ima', 'serving the setup\'s own arrangement, not nothing');
  // An unrelated later save of the stranded key warns — it does not block.
  const later = await req('PATCH', '/panel/keys/key_2', { domains: ['m.timesofindia.com', 'timesofindia.com'] });
  eq(later.status, 200, 'an unrelated edit still lands');
  assert(later.body.warnings.some(w => w.includes('no GPT')), 'carrying the fallback warning');
});

// THE PRE-ROLL SECONDS ARE THE SURFACE'S NOW (27 Aug, reversing 26 Aug's "seconds stay
// ops'"): a surface allowed to defer its pre-roll may as well say by how long.
await test('a surface sets its own pre-roll delay, not just deferred-or-not', async () => {
  const base = (await req('GET', '/panel/setups/as_2')).body.setup.sections[0].slots.preroll.behaviour;
  eq(base.deferSec, 7, 'the setup says 7');
  const r = await patchDrive('key_2', 'preroll', { start: 'deferred', deferSec: 12 });
  eq(r.status, 200, 'the surface says 12');
  const pre = (await req('GET', '/panel/keys/key_2')).body.key.sections[0].slots.preroll;
  eq(pre.behaviour.deferSec, 12, 'and that is what it runs');
  assert(pre.behaviourDrive.includes('deferSec'), 'marked as the surface\'s own, not the setup\'s');
  eq((await req('GET', '/panel/setups/as_2')).body.setup.sections[0].slots.preroll.behaviour.deferSec, 7,
    'the ad setup never moved');
  const daft = await patchDrive('key_2', 'preroll', { deferSec: 900 });
  eq(daft.status, 400, 'out of bounds is refused by name');
  const back = await req('PATCH', '/panel/keys/key_2', { drive: {} });
  eq(back.status, 200, 'and dropping it follows the setup again');
  eq((await req('GET', '/panel/keys/key_2')).body.key.sections[0].slots.preroll.behaviour.deferSec, 7, 'back to 7');
});

await test('the player is served the surface\'s partner order and its own seconds', async () => {
  await patchDrive('key_1', 'preroll', { ask: ['can', 'ima'], start: 'deferred', deferSec: 4 });
  eq((await req('POST', '/panel/keys/key_1/publish')).status, 200, 'published');
  const apiKey = (await req('GET', '/panel/keys/key_1')).body.key.key;
  const live = (await req('GET', `/panel/live/${apiKey}`)).body.sections[0].slots.preroll;
  eq(live.walk[0].provider, 'ima', 'the primary leads — a position, not a preference');
  eq(live.walk[1].provider, 'can', 'then CAN, first among the fallbacks as the chips say');
  assert(live.walk.every(x => x.provider === 'can' || x.provider === 'ima'), 'and GPT is not asked at all');
  eq(live.behaviour.deferSec, 4, 'with the surface\'s own four seconds');
  await req('PATCH', '/panel/keys/key_1', { drive: {} });
  await req('POST', '/panel/keys/key_1/publish');
});

await test('clearing the decision goes back to the setup\'s arrangement — nothing frozen', async () => {
  await patchDrive('key_1', 'preroll', { ask: ['ima'], tries: 2 });
  const r = await req('PATCH', '/panel/keys/key_1', { drive: {} });
  eq(r.status, 200, 'cleared');
  const k = (await req('GET', '/panel/keys/key_1')).body.key;
  eq(k.drive, null, 'no decision left');
  eq(k.sections[0].slots.preroll.rungCount, 8, 'back to the setup\'s full walk');
});

// ---------- THE DRIVE: tries, start, ads in a row ----------

await test('tries is a COUNT of real tries — it stops the walk, every section, sparse', async () => {
  const r = await patchDrive('key_1', 'preroll', { tries: 3 });
  eq(r.status, 200, 'saved');
  const k = (await req('GET', '/panel/keys/key_1')).body.key;
  eq(k.sections[0].slots.preroll.rungCount, 3, 'three tries on Default');
  eq(k.sections[1].slots.preroll.rungCount, 3, 'three on Shorts feed — one decision');
  eq(k.sections[0].slots.preroll.rungCountConfigured, 10, 'the ladder itself never moved');
});

await test('tries is the ONE depth cut left — the ops-side walkDepth is refused by name', async () => {
  // Surface: five tries over the ten-rung ladder = five live rungs walked.
  await patchDrive('key_1', 'preroll', { tries: 5 });
  eq((await req('GET', '/panel/keys/key_1')).body.key.sections[0].slots.preroll.rungCount, 5,
    'five real tries — a count');
  await req('PATCH', '/panel/keys/key_1', { drive: {} });
  // The ops-side positional depth was CUT 31 Aug (user call) — one concept, one control:
  // how deep a walk goes is the surface's Waterfall depth, in Ad delivery.
  const ops = await req('PATCH', '/panel/setups/as_1/sections/0/behaviour',
    { slot: 'preroll', behaviour: { walkDepth: 5 } });
  eq(ops.status, 400, 'refused, not quietly dropped');
  assert(ops.body.errors.some(e => e.message.includes('Waterfall depth, in Ad delivery')),
    `says where the answer lives now (got ${JSON.stringify(ops.body.errors)})`);
});

await test('the pre-roll start and ads-in-a-row ride the drive; the seconds stay ops\'', async () => {
  const r = await patchDrive('key_1', 'preroll', { start: 'deferred', podAds: 2 });
  eq(r.status, 200, 'saved');
  const pre = (await req('GET', '/panel/keys/key_1')).body.key.sections[0].slots.preroll;
  eq(pre.behaviour.start, 'deferred', 'this surface defers');
  eq(pre.behaviour.deferSec, 7, 'by the setup\'s own seconds — the number is the workshop\'s');
  eq(pre.behaviour.podAds, 2, 'two ads a break');
  eq(pre.behaviourDrive.sort(), ['podAds', 'start'], 'exactly what the decision set, named');
  const s = (await req('GET', '/panel/setups/as_1')).body.setup;
  eq(s.sections[0].slots.preroll.behaviour.start, 'start', 'the setup never moved');
});

await test('drive values are held to bounds, by name; deeper fields are the setup\'s', async () => {
  eq((await patchDrive('key_1', 'preroll', { podAds: 4 })).status, 400, 'four ads in a row refused');
  const tries = await patchDrive('key_1', 'preroll', { tries: 44 });
  eq(tries.status, 400, 'forty-four tries refused');
  assert(tries.body.errors.some(e => e.message.includes('between 1 and 10')), 'with the bounds');
  eq((await patchDrive('key_1', 'preroll', { ask: ['acme'] })).status, 400, 'an unknown partner refused');
  const deep = await patchDrive('key_1', 'preroll', { tagTimeoutMs: 2000 });
  eq(deep.status, 400, 'the per-try wait is not a driving control');
  assert(deep.body.errors.some(e => e.message.includes('arranged in the ad setup')), 'says where it lives');
});

await test('the squeeze-back slot is GONE — a payload still carrying it is refused by name', async () => {
  const drv = await patchDrive('key_2', 'squeezeback', { tries: 1 });
  eq(drv.status, 400, 'not a break any more');
  assert(drv.body.errors.some(e => e.message.includes('is not a break')), 'named');
  const k = (await req('GET', '/panel/keys/key_2')).body.key;
  const sections = k.sections.map(x => ({ name: x.name,
    slots: Object.fromEntries(Object.entries(x.slots).map(([t, sl]) => [t, { on: sl.on }])) }));
  sections[0].slots.squeezeback = { on: true };
  const sec = await req('PATCH', '/panel/keys/key_2', { sections });
  eq(sec.status, 400, 'a section carrying the dead slot is refused');
  assert(sec.body.errors.some(e => e.message.includes('the squeeze-back slot is gone')),
    `with where its two jobs went (got ${JSON.stringify(sec.body.errors)})`);
  const ops = await req('PATCH', '/panel/setups/as_2', { slots: { squeezeback: { rungs: [{ type: 'tag', tagId: 'tag_20' }] } } });
  eq(ops.status, 400, 'the ops room refuses it too');
});

await test('ops see the surface\'s decision on the slot — nobody debugs a ghost', async () => {
  await patchDrive('key_1', 'preroll', { ask: ['gpt', 'ima', 'can'], tries: 3 });
  const s = (await req('GET', '/panel/setups/as_1')).body.setup;
  const d = s.sections[0].slots.preroll.drive;
  eq(d.keyName, 'TOI Mweb VideoShow', 'whose decision');
  eq(d.ask.join(' › '), 'gpt › ima › can', 'what it asks, in order');
  eq(d.tries, 3, 'and how far it walks');
  eq(s.sections[0].slots.midroll.drive, null, 'a break with no decision says so');
});

await test('the counted wait follows the drive: fewer tries, shorter worst case', async () => {
  // key_6's Live blog walks 6 rungs × 1500ms = a 9s wait — warned on save.
  const slow = await patchSlot('key_6', 0, 'midroll', { on: true }); // any save re-counts
  assert((slow.body.warnings || []).some(w => w.includes('Live blog preroll: 6 rungs')),
    `counted from what really walks (got ${JSON.stringify(slow.body.warnings)})`);
  const fast = await patchDrive('key_6', 'preroll', { tries: 3 });
  eq(fast.status, 200, 'saved');
  assert(!(fast.body.warnings || []).some(w => w.includes('Live blog preroll')),
    'three tries clears the warning — the number that warns is the number that serves');
});

// ---------- fail closed on the walk ----------

await test('fail closed: a live break whose whole ladder is ops-dead is refused, named', async () => {
  const copy = await freshSetup('as_6', 'MiniTV dead copy');
  const rungs = copy.sections[0].slots.preroll.rungs.map(r => ({ ...r, on: false }));
  const dead = await req('PATCH', `/panel/setups/${copy.id}`, { slots: { preroll: { rungs } } });
  eq(dead.status, 200, 'nothing attached — ops may stage a dark ladder');
  const r = await req('POST', '/panel/keys', {
    ...VALID_KEY(), adSetupId: copy.id, status: 'active',
    sections: [{ slots: { preroll: { on: true }, midroll: { on: true } } }],
  });
  eq(r.status, 400, 'refused');
  assert(r.body.errors.some(e => e.message.includes('every rung is off by ad ops')),
    `names what did it (got ${JSON.stringify(r.body.errors)})`);
});

await test('the cut fields are refused by name from every door — never quietly dropped', async () => {
  for (const [f, v, says] of [['breakSec', 30, 'target impressions count'],
    ['overrun', 'strict', 'target impressions count'],
    ['walkDepth', 4, 'Waterfall depth, in Ad delivery']]) {
    const r = await req('PATCH', '/panel/setups/as_1/sections/0/behaviour',
      { slot: 'preroll', behaviour: { [f]: v } });
    eq(r.status, 400, `${f} refused`);
    assert(r.body.errors.some(e => e.message.includes(says)),
      `${f} says where the answer lives (got ${JSON.stringify(r.body.errors)})`);
  }
  // …and through the whole-setup door too.
  const s = (await req('GET', '/panel/setups/as_1')).body.setup;
  const r2 = await req('PATCH', '/panel/setups/as_1',
    { slots: { preroll: { behaviour: { ...s.sections[0].slots.preroll.behaviour, overrun: 'play' } } } });
  eq(r2.status, 400, 'every door, not just one');
});

// ---------- the draft journey (new surface, both teams) ----------

await test('a draft lives fully off; PUBLISHING is what fail-closes until demand exists', async () => {
  const draft = await req('POST', '/panel/keys', {
    name: 'TOI Android Shorts', property: 'TOI', platform: 'android',
    packageName: 'com.toi.reader',
    player: PLAYER_MIN, sections: [{ slots: {} }],
  });
  eq(draft.status, 201, 'a draft with no setup and nothing on is fine — the draft plane is free');
  const id = draft.body.key.id;
  eq(draft.body.key.live, false, 'and it is not on air');
  const nothing = await req('POST', `/panel/keys/${id}/publish`);
  eq(nothing.status, 409, 'publishing it is what is refused');
  assert(nothing.body.message.includes('every break switched off'), `named (got ${nothing.body.message})`);
  const copy = await freshSetup('as_2', 'Shorts demand'); // ops photocopy a shape — 1:1
  const attach = await req('PATCH', `/panel/keys/${id}`, {
    adSetupId: copy.id,
    sections: [{ slots: { preroll: { on: true } } }],
  });
  eq(attach.status, 200, 'ops attach demand; product switches on');
  const early = await req('POST', `/panel/keys/${id}/publish`);
  eq(early.status, 409, 'still refused — the demand behind it is not published either');
  assert(early.body.message.includes('publish “Shorts demand” first'), `names the other room (got ${early.body.message})`);
  eq((await req('POST', `/panel/setups/${copy.id}/publish`)).status, 200, 'ops publish the demand');
  eq((await req('POST', `/panel/keys/${id}/publish`)).status, 200, 'now the surface may go on air');
});

// ---------- the ad setup's behaviour (the workshop) ----------

await test('a placement\'s behaviour is a complete spec: break positions and overlay moments', async () => {
  const noCue = await req('PATCH', '/panel/setups/as_1/sections/0/behaviour',
    { slot: 'midroll', behaviour: { cuepoints: '' } });
  eq(noCue.status, 400, 'no break positions refused');
  assert(noCue.body.errors.some(e => e.field === 'cuepoints'), 'names cuepoints');
  const noTimes = await req('PATCH', '/panel/setups/as_1/sections/0/behaviour',
    { slot: 'squeezeback', behaviour: { times: '' } });
  eq(noTimes.status, 400, 'a squeeze-back with no show time refused — it IS the overlay now');
});

// ---------- ACROSS THE SESSION: three fields, twelve cut (27 Aug scope audit) ----------

await test('a placement has NO session-wide settings — Across the session is gone', async () => {
  const meta = (await req('GET', '/panel/meta')).body;
  assert(meta.placementRuleFields === undefined, 'no session field list left to serve');
  assert(meta.noFillActions === undefined, 'and its vocabulary went with it');
  assert(meta.adjacentModes === undefined, 'as the adjacent-slot one did before');
  const sec = (await req('GET', '/panel/setups/as_1')).body.setup.sections[0];
  eq(Object.keys(sec).sort().join(','), 'isDefault,name,slots', `a placement is a name and its slots (got ${Object.keys(sec).join(',')})`);
  const r = await req('PATCH', '/panel/setups/as_1/sections/0/behaviour', { rules: { anything: 1 } });
  eq(r.status, 400, 'a rules patch is refused outright');
  assert(r.body.errors.some(e => e.message.includes('every answer lives on a slot')), `named (got ${JSON.stringify(r.body.errors)})`);
});

await test('a cut session field is refused BY NAME, with where the answer lives now', async () => {
  const cases = [
    ['maxAdsPerSession', 'the ladder behind it is the only cap'],
    ['cooldownAfterBreak', 'the mid-roll cadence'],
    ['noFillAction', 'the content plays'],
    ['bannerTimes', 'squeeze-back'],
    ['overlayGap', 'squeeze-back'],
    ['requestTimeoutMs', 'own slot'],
    ['retries', 'waterfall is the retry'],
    ['companions', 'VAST response'],
    ['adjacentRefresh', 'display units'],
  ];
  for (const [field, says] of cases) {
    const r = await req('PATCH', '/panel/setups/as_1/sections/0/behaviour',
      { rules: { [field]: field === 'bannerTimes' ? [30] : 1 } });
    eq(r.status, 400, `${field} is refused, not quietly dropped`);
    const e = r.body.errors.find(x => x.field === field);
    assert(e, `${field} is named (got ${JSON.stringify(r.body.errors)})`);
    assert(e.message.includes(says), `${field} says where it went (got ${e.message})`);
  }
  const sec = (await req('GET', '/panel/setups/as_1')).body.setup.sections[0];
  assert(sec.rules === undefined, 'nothing was half-applied');
});

await test('the player is served slots and nothing else — no session block in the config', async () => {
  const k = (await req('GET', '/panel/keys/key_1')).body.key;
  const sec = (await req('GET', `/panel/live/${k.key}`)).body.sections[0];
  eq(Object.keys(sec).sort().join(','), 'name,slots',
    `a live placement is a name and its slots (got ${Object.keys(sec).join(',')})`);
  const ver = (await req('GET', '/panel/setups/as_1/versions')).body.versions.pop();
  assert(!JSON.stringify(ver).includes('maxAdsPerSession'), 'and no version carries one either');
});

await test('a whole-setup save carrying a cut field is refused too — every door, not just one', async () => {
  const s = (await req('GET', '/panel/setups/as_1')).body.setup;
  const sections = s.sections.map(sec => ({
    name: sec.name,
    rules: { companionPersist: true },
    slots: Object.fromEntries(Object.entries(sec.slots).map(([t, sl]) =>
      [t, { rungs: sl.rungs, behaviour: sl.behaviour }])),
  }));
  const r = await req('PATCH', '/panel/setups/as_1', { sections });
  eq(r.status, 400, 'the ops room refuses it as well');
  assert(JSON.stringify(r.body.errors).includes('Companions persist'), `named (got ${JSON.stringify(r.body.errors)})`);
});

await test('player edits diff field by field, and show up as unpublished work', async () => {
  const r = await req('PATCH', '/panel/keys/key_1/player', { passiveVolume: 55 });
  eq(r.status, 200, 'saved');
  assert(r.body.changes.some(c => c.field === 'passiveVolume' && c.to === 55), 'field-level diff');
  // The global activity log was CUT (27 Aug, user call) — the per-object version history
  // answers it better, and the one thing the log did uniquely nobody was reaching.
  eq((await req('GET', '/panel/activity')).status, 404, 'the log and its route are gone');
  const pend = (await req('GET', '/panel/keys/key_1/versions')).body.unpublished;
  assert(pend.some(c => c.field === 'passiveVolume'), `the save shows as unpublished work (got ${JSON.stringify(pend)})`);
  eq((await req('PATCH', '/panel/keys/key_1/sections/0/player', { passiveVolume: 60 })).status, 404,
    'the per-section player route went with the per-section player');
});

await test('behaviour edits diff field by field, and say WHERE in the pending list', async () => {
  const r = await req('PATCH', '/panel/setups/as_1/sections/0/behaviour',
    { slot: 'preroll', behaviour: { podAds: 2 } });
  eq(r.status, 200, 'saved');
  assert(r.body.changes.some(c => c.field === 'podAds' && c.from === 1 && c.to === 2), 'field-level diff');
  assert(!r.body.warnings.some(w => w.includes('picks this up')), 'a save reaches no traffic, so it claims none');
  const pend = (await req('GET', '/panel/setups/as_1/versions')).body.unpublished;
  const mine = pend.find(c => c.field === 'podAds');
  assert(mine && mine.where === 'Default · Pre-roll', `placed by placement and slot, in the screen's own words (got ${JSON.stringify(pend)})`);
});

await test('two placements hold different behaviour, slot by slot, independently', async () => {
  const s0 = (await req('GET', '/panel/setups/as_5')).body.setup;
  eq(s0.sections[0].slots.preroll.behaviour.start, 'start', 'Default plays at start');
  eq(s0.sections[1].slots.preroll.behaviour.start, 'deferred', 'the live blog defers');
  await req('PATCH', '/panel/setups/as_5/sections/1/behaviour', { slot: 'midroll', behaviour: { podAds: 3 } });
  const s = (await req('GET', '/panel/setups/as_5')).body.setup;
  eq(s.sections[1].slots.midroll.behaviour.podAds, 3, 'the live blog pods');
  eq(s.sections[0].slots.midroll.behaviour.podAds, 1, 'Default still plays one ad a break');
});

await test('a trimmed player field is refused, not silently kept', async () => {
  const r = await req('PATCH', '/panel/keys/key_1/player', { autoplay: 'sideways' });
  eq(r.status, 400, 'a bad value is still refused by name');
  const ok = await req('PATCH', '/panel/keys/key_1/player', { controls: 'none' });
  eq(ok.status, 200, 'an unknown field is simply not part of the player any more');
  eq(ok.body.changes.length, 0, 'so it changes nothing');
  eq((await req('GET', '/panel/keys/key_1')).body.key.player.controls, undefined, 'and never lands');
});

await test('every slot carries its fill fields, defaulting to today\'s behaviour', async () => {
  const secs = (await req('GET', '/panel/setups/as_1')).body.setup.sections[0].slots;
  for (const t of ['preroll', 'midroll', 'postroll']) {
    const b = secs[t].behaviour;
    eq(b.podAds, 1, `${t} plays one ad`);
    eq(b.nextAd, 'top', `${t} first choice gets every slot by default`);
    eq(b.podBanner, 'last', `${t} banner stays the settle point by default`);
    eq(b.fillTimeoutSec, 20, `${t} gives up asking at 20s`);
    eq(b.breakSec, undefined, `${t} carries no budget — cut 31 Aug`);
    eq(b.walkDepth, undefined, `${t} carries no ops depth — cut 31 Aug`);
  }
  // The prefixes are GONE: a slot's behaviour holds only what that slot can have.
  eq(secs.preroll.behaviour.cuepoints, undefined, 'a pre-roll has no break positions');
  eq(secs.midroll.behaviour.start, undefined, 'a mid-roll has no start choice');
  eq(secs.outstream.behaviour.podAds, undefined, 'a rotation has no pod');
  eq(secs.outstream.behaviour.hold, 20, 'it has a hold instead');
});

await test('every fill answer is the SLOT\'s — pre-roll and mid-roll hold different configs', async () => {
  const pre = await req('PATCH', '/panel/setups/as_1/sections/0/behaviour',
    { slot: 'preroll', behaviour: { podAds: 2, fillTimeoutSec: 8 } });
  eq(pre.status, 200, 'saved');
  const mid = await req('PATCH', '/panel/setups/as_1/sections/0/behaviour',
    { slot: 'midroll', behaviour: { podAds: 3, fillTimeoutSec: 40, nextAd: 'next', podBanner: 'any' } });
  eq(mid.status, 200, 'saved');
  const s = (await req('GET', '/panel/setups/as_1')).body.setup.sections[0].slots;
  eq(s.preroll.behaviour.fillTimeoutSec, 8, 'pre-roll gives up at 8s');
  eq(s.midroll.behaviour.fillTimeoutSec, 40, 'mid-roll keeps its 40s');
  eq(s.midroll.behaviour.nextAd, 'next', 'mid-roll walks down');
  eq(s.preroll.behaviour.nextAd, 'top', 'pre-roll untouched — still from the top');
});

await test('pod bounds are refused by name', async () => {
  const four = await req('PATCH', '/panel/setups/as_1/sections/0/behaviour',
    { slot: 'midroll', behaviour: { podAds: 4 } });
  eq(four.status, 400, 'four ads in a row refused');
  assert(four.body.errors.some(e => e.field === 'podAds'), 'names the field');
  const walk = await req('PATCH', '/panel/setups/as_1/sections/0/behaviour',
    { slot: 'midroll', behaviour: { nextAd: 'sideways' } });
  eq(walk.status, 400, 'an unknown fill order refused');
  assert(walk.body.errors.some(e => e.message.includes('top')), 'refusal names the allowed values');
});

await test('pod warnings stay counted on the slot that causes them', async () => {
  // The session-cap arithmetic went with Across-the-session (27 Aug); the per-slot
  // warnings that never needed it are untouched.
  const cad = await req('PATCH', '/panel/setups/as_1/sections/0/behaviour',
    { slot: 'midroll', behaviour: { podAds: 3, mode: 'interval', every: 480 } });
  assert(cad.body.warnings.some(w => w.includes('at 3 ads')), `multiplied cadence (got ${JSON.stringify(cad.body.warnings)})`);
});

await test('player fields are validated inline too', async () => {
  const r = await req('PATCH', '/panel/keys/key_1/player', { playbackMode: 'inline_redirect' });
  eq(r.status, 400, 'redirect mode without a URL refused');
  assert(r.body.errors.some(e => e.field === 'redirectUrl'), 'names the field');
  const ok = await req('PATCH', '/panel/keys/key_1/player', { playbackMode: 'inline_redirect', redirectUrl: 'https://toi.example/watch' });
  eq(ok.status, 200, 'saved with one');
  assert(ok.body.changes.some(c => c.field === 'redirectUrl'), 'field-level diff');
});

// ---------- integration basics ----------

await test('web integrations need a domain; app integrations need a package name', async () => {
  const noDomain = await req('POST', '/panel/keys', { ...VALID_KEY(), domains: [] });
  eq(noDomain.status, 400, 'mweb without a domain refused');
  const badApp = await req('POST', '/panel/keys', {
    ...VALID_KEY(), name: 'App key', platform: 'android', packageName: 'not a package',
  });
  eq(badApp.status, 400, 'android without a valid package refused');
});

await test('an integration must carry its player', async () => {
  const r = await req('POST', '/panel/keys', { ...VALID_KEY(), player: undefined });
  eq(r.status, 400, 'refused');
  assert(r.body.errors.some(e => e.field === 'autoplay' || e.field === 'playbackMode'), 'names what is missing');
});

// ---------- ops-room walk depth (the baseline the drive rides on) ----------

await test('an out-stream has no pod and no depth — banners take turns', async () => {
  const as1 = (await req('GET', '/panel/setups/as_1')).body.setup;
  const b = as1.sections[0].slots.outstream.behaviour;
  eq(b.podAds, undefined, 'no pod');
  eq(b.walkDepth, undefined, 'no depth — never had one, never will');
  eq(b.hideOnInStream, true, 'and its own switch: step aside for a video ad');
});

// ---------- ad setup ladder rules (the ops room's grammar) ----------

async function scratchSetup(slots) {
  return req('POST', '/panel/setups', { name: 'Scratch', property: 'TOI', sections: [{ name: 'Default', slots }] });
}

await test('a break takes video and falls back to ONE display; a squeeze-back takes display only', async () => {
  const tags = (await req('GET', '/panel/tags')).body.tags;
  const vid = tags.find(t => t.name === 'TOI Mweb VideoShow Pre-roll').id;
  const d1 = tags.find(t => t.name === 'TOI Mweb VideoShow Display').id;
  const d2 = tags.find(t => t.name === 'TOI Display Backfill').id;
  const two = await scratchSetup({ preroll: { rungs: [{ type: 'tag', tagId: vid }, { type: 'tag', tagId: d1 }, { type: 'tag', tagId: d2 }] } });
  eq(two.status, 400, 'two display rungs in one break refused');
  assert(two.body.errors.some(e => e.message.includes('one display unit')), 'says why');
  const vInSqueeze = await scratchSetup({ squeezeback: { rungs: [{ type: 'tag', tagId: vid }] } });
  eq(vInSqueeze.status, 400, 'a video tag in a squeeze-back refused');
});

await test('Waterfall N is gone — a group rung is refused by name, everywhere', async () => {
  const tags = (await req('GET', '/panel/tags')).body.tags;
  const d = tags.find(t => t.name === 'TOI Mweb VideoShow Display').id;
  const v = tags.find(t => t.name === 'TOI Mweb VideoShow Pre-roll').id;
  for (const slots of [{ preroll: { rungs: [{ type: 'tag', tagId: v }, { type: 'group', tagIds: [d] }] } },
    { outstream: { rungs: [{ type: 'group', tagIds: [d] }] } }]) {
    const r = await scratchSetup(slots);
    eq(r.status, 400, 'refused');
    assert(r.body.errors.some(e => e.message.includes('Waterfall N is gone')), 'says why, and what to do instead');
  }
});

await test('the ladder grammar holds: up to 10 plain rungs, no repeats', async () => {
  const tags = (await req('GET', '/panel/tags')).body.tags;
  const vids = tags.filter(t => t.type === 'video').map(t => t.id);
  const ten = await scratchSetup({ preroll: { rungs: vids.slice(0, 10).map(tagId => ({ type: 'tag', tagId })) } });
  eq(ten.status, 201, 'ten rungs — one primary and nine waterfalls — is a ladder now');
  await req('DELETE', `/panel/setups/${ten.body.setup.id}`);
  const eleven = await scratchSetup({ preroll: { rungs: vids.slice(0, 11).map(tagId => ({ type: 'tag', tagId })) } });
  eq(eleven.status, 400, 'eleven refused');
  assert(eleven.body.errors.some(e => e.message.includes('at most 10')), 'the cap is named');
  const dup = await scratchSetup({ preroll: { rungs: [{ type: 'tag', tagId: vids[0] }, { type: 'tag', tagId: vids[0] }] } });
  eq(dup.status, 400, 'the same tag twice refused');
});

// ---------- providers: the TYPE is implied by the protocol wherever it can be ----------

await test('IMA answers with video and GPT with display — by construction, not by response', async () => {
  const ima = await req('POST', '/panel/tags', { name: 'Probe IMA', provider: 'ima', value: '/7176/toi/mweb/videoshow/preroll' });
  eq(ima.status, 201, 'no type asked');
  eq(ima.body.tag.type, 'video', 'derived, config-time');
  const gpt = await req('POST', '/panel/tags', { name: 'Probe GPT', provider: 'gpt', value: '/7176/toi/mweb/videoshow/display' });
  eq(gpt.body.tag.type, 'display', 'derived, config-time');
  const lie = await req('POST', '/panel/tags', { name: 'Probe lie', provider: 'ima', type: 'display', value: '/7176/toi/mweb/videoshow/preroll' });
  eq(lie.status, 400, 'a contradiction is refused, never silently corrected');
  assert(lie.body.errors.some(e => e.message.includes('by construction')), 'says why');
});

await test('THREE providers — SLike is gone; only CAN serves both, so only CAN asks', async () => {
  const meta = (await req('GET', '/panel/meta')).body;
  eq(meta.tagProviders.join(','), 'ima,gpt,can', `the vocabulary is three (got ${meta.tagProviders.join(',')})`);
  eq(meta.urlProviders.join(','), 'can', 'CAN is the only endpoint you paste');
  assert(meta.providerTypes.slike === undefined, 'SLike has no implied type left to look up');
  const gone = await req('POST', '/panel/tags', { name: 'Probe SLike', provider: 'slike', value: 'https://slike.example/vast' });
  eq(gone.status, 400, 'a SLike tag is refused, not quietly re-providered');
  assert(gone.body.errors.some(e => e.message.includes('IMA, GPT or CAN')), `named (got ${JSON.stringify(gone.body.errors)})`);
  const can = await req('POST', '/panel/tags', { name: 'Probe CAN', provider: 'can', value: 'https://can.example/ad' });
  eq(can.status, 400, 'CAN without a type refused');
  assert(can.body.errors.some(e => e.message.includes('serves both')), 'says why');
  const canOk = await req('POST', '/panel/tags', { name: 'Probe CAN', provider: 'can', type: 'display', value: 'https://can.example/ad' });
  eq(canOk.status, 201, 'declared, accepted');
});

await test('a bare GAM unit path picks its library from the declared type', async () => {
  const disp = await req('POST', '/panel/tags', { name: 'Probe bare', type: 'display', value: '/7176/toi/mweb/videoshow/display' });
  eq(disp.body.tag.provider, 'gpt', 'display → GPT');
  const vid = await req('POST', '/panel/tags', { name: 'Probe bare 2', type: 'video', value: '/7176/toi/mweb/videoshow/preroll' });
  eq(vid.body.tag.provider, 'ima', 'video → IMA');
});

// ---------- ad tags ----------

await test('a tag in use cannot be deleted or retyped — the setups are named', async () => {
  const tags = (await req('GET', '/panel/tags')).body.tags;
  const used = tags.find(t => t.name === 'TOI Video Backfill');
  const del = await req('DELETE', `/panel/tags/${used.id}`);
  eq(del.status, 409, 'delete refused');
  assert(del.body.usedBy.some(n => n.includes('demand')), `named by setup (got ${JSON.stringify(del.body.usedBy)})`);
  const retype = await req('PATCH', `/panel/tags/${used.id}`, { type: 'display' });
  eq(retype.status, 409, 'retype refused while in use');
});

// ---------- MANUAL ENTRY: the directory is a convenience, not a gate (27 Aug) ----------

await test('an ad unit GAM has not synced can be typed in — accepted and MARKED', async () => {
  const r = await req('POST', '/panel/tags', { name: 'Ghost', type: 'video', value: '/7176/nowhere/at/all' });
  eq(r.status, 201, 'a well-formed unit is taken off-directory, not refused');
  eq(r.body.tag.provider, 'ima', 'video → IMA, as always');
  eq(r.body.tag.offDirectory, true, 'and it says so');
  const synced = (await req('GET', '/panel/tags')).body.tags.find(t => t.name === 'TOI Mweb VideoShow Pre-roll');
  eq(synced.offDirectory, false, 'a unit the directory has carries no mark');
});

await test('a value that could not be an ad unit is still refused, by shape', async () => {
  const junk = await req('POST', '/panel/tags', { name: 'Typo', type: 'video', value: 'videoshow/preroll' });
  eq(junk.status, 400, 'no network code, no ad unit');
  assert(junk.body.errors.some(e => e.field === 'value' && e.message.includes('network code')),
    `says what an ad unit looks like (got ${JSON.stringify(junk.body.errors)})`);
  const urlOnGpt = await req('POST', '/panel/tags', { name: 'Url on GPT', provider: 'gpt', value: 'https://x.example/tag' });
  eq(urlOnGpt.status, 400, 'GPT has no URL form');
  assert(urlOnGpt.body.errors.some(e => e.message.includes('CAN endpoint')), 'and names where it belongs');
});

await test('a VAST URL is an ordinary IMA request; a bare URL with no provider is CAN', async () => {
  const ima = await req('POST', '/panel/tags', { name: 'Direct VAST', provider: 'ima', value: 'https://ads.toi.example/vast/direct' });
  eq(ima.status, 201, 'IMA takes a pasted VAST URL');
  eq(ima.body.tag.offDirectory, false, 'a URL is not a directory thing, so there is nothing to mark');
  const bare = await req('POST', '/panel/tags', { name: 'Mystery', type: 'video', value: 'https://x.example/vast' });
  eq(bare.status, 201, 'an endpoint with no provider named is CAN — the only one you paste');
  eq(bare.body.tag.provider, 'can', 'CAN');
});

await test('GAM sync clears the mark by itself — nothing is stored to clean up', async () => {
  const before = await req('POST', '/panel/tags', { name: 'New unit', type: 'video', value: '/7176/toi/mweb/liveblog/preroll' });
  eq(before.status, 201, 'taggable before the sync');
  eq(before.body.tag.offDirectory, true, 'marked while the directory lacks it');
  const sync = await req('POST', '/panel/gam/sync');
  assert(sync.body.added >= 1, 'sync adds pending units');
  const after = (await req('GET', `/panel/tags/${before.body.tag.id}`)).body.tag;
  eq(after.offDirectory, false, 'the same tag, unmarked — derived, never stored');
});

// ---------- bulk (product room: switches, status, the drive, the player) ----------

await test('bulk never writes an ad unit or an override — the dead acts stay dead', async () => {
  const before = JSON.stringify((await req('GET', '/panel/setups/as_1')).body.setup.sections);
  for (const action of ['slotPrimary', 'slotRung', 'slotReplace', 'slotTypeAdd', 'slotRotationAdd',
    'slotTypeMove', 'slotTypeOn', 'slotTypeOff', 'policy', 'behaviour', 'copyFrom',
    'slotRungOn', 'slotRungOff', 'slotRungMove', 'slotPoolOn', 'slotPoolOff', 'policyFields', 'setup']) {
    const r = await req('POST', '/panel/keys/bulk', { ids: ['key_1'], action, value: { slot: 'preroll', position: 0 } });
    eq(r.status, 400, `${action} returns 400`);
    assert((r.body.message || '').includes('Unknown bulk action'), `${action} is unknown`);
  }
  const after = JSON.stringify((await req('GET', '/panel/setups/as_1')).body.setup.sections);
  eq(after, before, 'no ladder was touched');
});

await test('bulk slotOn lights only sections whose setup has demand — the rest are named', async () => {
  const r = await req('POST', '/panel/keys/bulk', { ids: ['key_1', 'key_2', 'key_6'], action: 'slotOn', value: 'outstream' });
  eq(r.status, 200, 'applied');
  eq(r.body.changed, 1, 'one integration lit');
  assert(r.body.refused.includes('TOI Mweb VideoShow') && r.body.refused.includes('NBT Mweb VideoShow'),
    `nothing to switch on is a named refusal (got ${JSON.stringify(r.body.refused)})`);
  const k2 = (await req('GET', '/panel/keys/key_2')).body.key;
  eq(k2.sections[0].slots.outstream.on, true, 'the staged out-stream went live');
});

await test('emptying a live integration edits the DRAFT; publishing it is what fails closed', async () => {
  const r = await req('POST', '/panel/keys/bulk', { ids: ['key_2'], action: 'slotOff', value: 'preroll' });
  eq(r.status, 200, 'the draft plane is free — the edit lands');
  const k = (await req('GET', '/panel/keys/key_2')).body.key;
  eq(k.live, true, 'what is on air has not moved');
  assert(k.unpublishedCount > 0, 'it just has unpublished changes now');
  const pub = await req('POST', '/panel/keys/key_2/publish');
  eq(pub.status, 409, 'and publishing that is refused');
  assert(pub.body.message.includes('every break switched off'), `named (got ${pub.body.message})`);
  await req('POST', '/panel/keys/bulk', { ids: ['key_2'], action: 'slotOn', value: 'preroll' });
});

await test('bulk player fields land on each integration — one player each, no forks to track', async () => {
  const r = await req('POST', '/panel/keys/bulk', {
    ids: ['key_1', 'key_6'], action: 'playerFields',
    value: { fields: { autoplay: 'auto', passiveVolume: 40 } },
  });
  eq(r.status, 200, 'applied');
  eq(r.body.changed, 2, 'both integrations changed');
  for (const id of ['key_1', 'key_6']) {
    const k = (await req('GET', `/panel/keys/${id}`)).body.key;
    eq(k.player.autoplay, 'auto', `${id} player updated`);
    eq(k.player.passiveVolume, 40, `${id} volume updated`);
  }
});

await test('bulk writes the DRIVE across a cohort — sparse, each integration\'s own decision', async () => {
  const r = await req('POST', '/panel/keys/bulk', {
    ids: ['key_1', 'key_3'], action: 'driveFields',
    value: { slot: 'preroll', fields: { tries: 3 } },
  });
  eq(r.status, 200, 'applied');
  eq(r.body.changed, 2, 'both took the decision');
  for (const id of ['key_1', 'key_3']) {
    const k = (await req('GET', `/panel/keys/${id}`)).body.key;
    eq(k.drive.preroll.tries, 3, `${id} stops after three tries`);
    eq(k.sections[0].slots.preroll.rungCount, 3, `${id} walks three`);
  }
  // Sparse: a later act touching another field keeps the tries.
  await req('POST', '/panel/keys/bulk', {
    ids: ['key_1'], action: 'driveFields', value: { slot: 'preroll', fields: { ask: ['gpt', 'ima', 'can'] } },
  });
  const k1 = (await req('GET', '/panel/keys/key_1')).body.key;
  eq(k1.drive.preroll.tries, 3, 'tries kept');
  eq(k1.drive.preroll.ask.join(','), 'gpt,ima,can', 'the partner order landed');
  // And ask: 'setup' is the explicit way back.
  await req('POST', '/panel/keys/bulk', {
    ids: ['key_1'], action: 'driveFields', value: { slot: 'preroll', fields: { ask: 'setup' } },
  });
  eq((await req('GET', '/panel/keys/key_1')).body.key.drive.preroll.ask, undefined, 'back to the setup\'s arrangement');
});

await test('bulk drive refuses deeper fields and bad values by name, before touching anything', async () => {
  const deep = await req('POST', '/panel/keys/bulk', {
    ids: ['key_1'], action: 'driveFields', value: { slot: 'preroll', fields: { tagTimeoutMs: 2000 } },
  });
  eq(deep.status, 400, 'refused');
  assert((deep.body.message || '').includes('arranged in the ad setup'), `says where it went (got ${JSON.stringify(deep.body)})`);
  const bounds = await req('POST', '/panel/keys/bulk', {
    ids: ['key_1'], action: 'driveFields', value: { slot: 'preroll', fields: { tries: 44 } },
  });
  eq(bounds.status, 400, 'out of bounds refused once, up front');
  const rot = await req('POST', '/panel/keys/bulk', {
    ids: ['key_2'], action: 'driveFields', value: { slot: 'outstream', fields: { tries: 1 } },
  });
  eq(rot.status, 400, 'a rotation has nothing to decide');
  assert((rot.body.message || '').includes('takes turns'), 'says why');
  eq((await req('GET', '/panel/keys/key_1')).body.key.drive, null, 'and nothing half-landed');
});

await test('a new placement CLONES Default\'s behaviour — never a blank form', async () => {
  await req('PATCH', '/panel/setups/as_1/sections/0/behaviour',
    { slot: 'midroll', behaviour: { mode: 'interval', every: 600, podAds: 2 } });
  const add = await req('PATCH', '/panel/setups/as_1', {
    sections: [{ name: 'Default' }, { name: 'Shorts feed' }, { name: 'Recipe reel' }],
  });
  eq(add.status, 200, 'added');
  const s = (await req('GET', '/panel/setups/as_1')).body.setup;
  eq(s.sections[2].name, 'Recipe reel', 'the new placement');
  eq(s.sections[2].slots.midroll.behaviour.podAds, 2, 'it starts from Default\'s pods');
  eq(s.sections[2].slots.midroll.behaviour.every, 600, 'and Default\'s cadence');
  eq(s.sections[1].slots.midroll.behaviour.podAds, 1, 'an existing placement keeps its own');
});

await test('bulk takes a cohort off air and puts it back — the act that replaced pausing', async () => {
  const down = await req('POST', '/panel/keys/bulk', { ids: ['key_1', 'key_3'], action: 'unpublish' });
  eq(down.body.changed, 2, 'both taken down');
  eq((await req('GET', '/panel/keys/key_1')).body.key.live, false, 'off air');
  const up = await req('POST', '/panel/keys/bulk', { ids: ['key_1', 'key_3'], action: 'publish' });
  eq(up.body.changed, 2, 'both back');
  const k = (await req('GET', '/panel/keys/key_1')).body.key;
  eq(k.live, true, 'on air again');
  eq(k.unpublishedCount, 0, 'and nothing left unpublished');
});

// ---------- THE PUBLISH PLANE (27 Aug) ----------

await test('Save writes the draft; only Publish reaches the player', async () => {
  const before = (await req('GET', '/panel/keys/key_1')).body.key;
  eq(before.live, true, 'on air');
  eq(before.unpublishedCount, 0, 'clean');
  const live0 = (await req('GET', `/panel/live/${before.key}`)).body;
  eq(live0.player.passiveVolume, 100, 'what the player gets today');

  await req('PATCH', '/panel/keys/key_1/player', { passiveVolume: 42 });
  const dirty = (await req('GET', '/panel/keys/key_1')).body.key;
  eq(dirty.unpublishedCount, 1, 'the draft moved, counted');
  eq(dirty.liveVersion, 1, 'the live version did not');
  eq((await req('GET', `/panel/live/${before.key}`)).body.player.passiveVolume, 100,
    'and the player still gets the published value — a save is not a release');

  const pub = await req('POST', '/panel/keys/key_1/publish');
  eq(pub.status, 200, 'published');
  eq(pub.body.version.v, 2, 'version 2');
  assert(pub.body.version.changes.some(c => c.field === 'passiveVolume' && c.to === 42), 'the version says what it did');
  eq((await req('GET', `/panel/live/${before.key}`)).body.player.passiveVolume, 42, 'now the player has it');
  eq((await req('GET', '/panel/keys/key_1')).body.key.unpublishedCount, 0, 'and the draft is clean again');
});

await test('publishing nothing is refused — a version is a change, not a click', async () => {
  const r = await req('POST', '/panel/keys/key_1/publish');
  eq(r.status, 409, 'refused');
  assert(r.body.message.includes('already live'), `named (got ${r.body.message})`);
});

await test('the two rooms publish separately, and the gap between them fails closed', async () => {
  // Ops add a rung and DO NOT publish: the player must not see it.
  const s = (await req('GET', '/panel/setups/as_1')).body.setup;
  const rungs = s.sections[0].slots.midroll.rungs.slice(0, 1).map(r => ({ ...r }));
  await req('PATCH', '/panel/setups/as_1', { slots: { midroll: { rungs } } });
  const setup = (await req('GET', '/panel/setups/as_1')).body.setup;
  assert(setup.unpublishedCount > 0, 'the ops draft moved');
  const apiKey = (await req('GET', '/panel/keys/key_1')).body.key.key;
  const live = (await req('GET', `/panel/live/${apiKey}`)).body;
  eq(live.sections[0].slots.midroll.walk.length, 4, 'the player still walks the PUBLISHED ladder');
  eq((await req('POST', '/panel/setups/as_1/publish')).status, 200, 'ops publish');
  eq((await req('GET', `/panel/live/${apiKey}`)).body.sections[0].slots.midroll.walk.length, 1,
    'and only then does the walk shorten');
});

await test('a setup version that would darken a LIVE break is refused, the surface named', async () => {
  // The hole independent publishing opens, walked end to end: product switches a break
  // off in their DRAFT (nothing live changes), which frees ops to empty its ladder — and
  // then publishing that would take the still-live break down. Refused at the boundary.
  const s = (await req('GET', '/panel/setups/as_1')).body.setup;
  const rungs = s.sections[0].slots.midroll.rungs.map(r => ({ ...r }));
  eq((await req('PATCH', '/panel/keys/key_1', {
    sections: [{ name: 'Default', slots: { midroll: { on: false } } }, { name: 'Shorts feed' }],
  })).status, 200, 'product switch the break off in their draft');
  eq((await req('PATCH', '/panel/setups/as_1', { slots: { midroll: { rungs: [] } } })).status, 200,
    'which frees ops to empty the ladder in theirs');
  const r = await req('POST', '/panel/setups/as_1/publish');
  eq(r.status, 409, 'but publishing it is refused — key_1 is still LIVE on that break');
  assert(r.body.message.includes('TOI Mweb VideoShow'), `the surface is named (got ${r.body.message})`);
  await req('PATCH', '/panel/setups/as_1', { slots: { midroll: { rungs } } });
  await req('PATCH', '/panel/keys/key_1', {
    sections: [{ name: 'Default', slots: { midroll: { on: true } } }, { name: 'Shorts feed' }],
  });
});

await test('taking a surface off air is a publish-plane act — the draft is untouched', async () => {
  const k = (await req('GET', '/panel/keys/key_6')).body.key;
  const down = await req('POST', '/panel/keys/key_6/unpublish');
  eq(down.status, 200, 'down');
  eq((await req('GET', `/panel/live/${k.key}`)).status, 404, 'the player gets nothing');
  const after = (await req('GET', '/panel/keys/key_6')).body.key;
  eq(after.live, false, 'off air');
  eq(after.name, k.name, 'the draft is exactly as it was');
  eq((await req('POST', '/panel/keys/key_6/publish')).status, 200, 'and it comes straight back');
  eq((await req('GET', `/panel/live/${k.key}`)).status, 200, 'serving again');
});

await test('a setup a live surface stands on cannot be taken down — the surface is named', async () => {
  const r = await req('POST', '/panel/setups/as_1/unpublish');
  eq(r.status, 409, 'refused');
  assert(r.body.usedBy.includes('TOI Mweb VideoShow'), `named (got ${JSON.stringify(r.body.usedBy)})`);
});

await test('restore is forward-only: the old content lands as a NEW version', async () => {
  const before = (await req('GET', '/panel/setups/as_1/versions')).body;
  const top = before.versions[0].v;
  const target = before.versions.find(v => v.v === 2);
  assert(target, 'v2 is still there');
  const r = await req('POST', '/panel/setups/as_1/versions/2/restore');
  eq(r.status, 200, 'restored');
  eq(r.body.restoredFrom, 2, 'says where from');
  eq(r.body.version.v, top + 1, 'as a new version on top — history is never rewritten');
  const after = (await req('GET', '/panel/setups/as_1/versions')).body;
  eq(after.liveVersion, top + 1, 'and that is what is live');
  assert(after.versions.some(v => v.v === top), 'the version we reverted away from is still there to go back to');
  eq((await req('GET', '/panel/setups/as_1')).body.setup.unpublishedCount, 0,
    'the draft followed, so the editor shows what is live');
});

await test('the restore preview answers what changes NOW, not what that version did then', async () => {
  // as_1's seeded history: v2 set the pre-roll try-wait to 2000ms, v3 put it back to
  // 1500. Going back to v2 from a THIRD value proves the dialog reads the live-to-target
  // diff rather than replaying what v2 did the day it went out.
  await req('PATCH', '/panel/setups/as_1/sections/0/behaviour',
    { slot: 'preroll', behaviour: { tagTimeoutMs: 1200 } });
  await req('POST', '/panel/setups/as_1/publish');
  const pre = (await req('GET', '/panel/setups/as_1/versions/2/preview')).body;
  eq(pre.v, 2, 'the version asked for');
  eq(pre.actor, 'Rohit (monetization)', 'who published it');
  const wait = pre.changes.find(c => c.field === 'tagTimeoutMs');
  assert(wait && wait.from === 1200 && wait.to === 2000,
    `counted from what is ON AIR to the target (got ${JSON.stringify(pre.changes)})`);
  eq(pre.discards.length, 0, 'a clean draft loses nothing');
  eq(pre.nextVersion, (await req('GET', '/panel/setups/as_1/versions')).body.versions[0].v + 1,
    'and it says where it will land');
});

await test('the restore preview names what an unpublished draft would lose', async () => {
  await req('PATCH', '/panel/setups/as_1', { name: 'TOI VideoShow demand (wip)' });
  const pre = (await req('GET', '/panel/setups/as_1/versions/2/preview')).body;
  assert(pre.discards.some(c => c.field === 'name'),
    `the draft's unpublished work is named before it is thrown away (got ${JSON.stringify(pre.discards)})`);
  await req('PATCH', '/panel/setups/as_1', { name: 'TOI VideoShow demand' });
});

await test('restoring what is already on air is refused before the dialog, not after', async () => {
  const live = (await req('GET', '/panel/setups/as_1/versions')).body.liveVersion;
  const pre = (await req('GET', `/panel/setups/as_1/versions/${live}/preview`)).body;
  eq(pre.changes.length, 0, 'nothing would change');
  eq((await req('POST', `/panel/setups/as_1/versions/${live}/restore`)).status, 409,
    'and the act itself refuses too — the screen never offers what the seam would reject');
});

await test('the rail reads versions and the pending draft together', async () => {
  await req('PATCH', '/panel/setups/as_1', { name: 'TOI VideoShow demand v2' });
  const r = (await req('GET', '/panel/setups/as_1/versions')).body;
  assert(r.versions.length >= 2, 'the published versions');
  assert(r.unpublished.some(c => c.field === 'name'), `and what is waiting (got ${JSON.stringify(r.unpublished)})`);
  assert(r.versions[0].v > r.versions[1].v, 'newest first');
});

// ---------- THE PLAYER'S JSON (31 Aug, AD-JSON-SCOPE) ----------
// Direct above everything · mid-roll break groups · banner facts on the rung ·
// out-stream · the break's giving-up point · request templates · playback timing.

await test('DIRECT is each break\'s own deal — ONE, tried before its primary, uncapped', async () => {
  const s = (await req('GET', '/panel/setups/as_1')).body.setup;
  const d = s.sections[0].slots.preroll.direct;
  eq(d.rungCount, 1, 'the pre-roll carries its direct deal');
  eq(d.maxSession, undefined, 'and no session cap — the deal is tried each break');
  eq(s.sections[0].slots.midroll.direct.rungCount, 0, 'the mid-roll\'s own tier is its own — empty here');
  eq(s.sections[0].slots.outstream.direct, null, 'a rotation is not a break — no tier at all');
  // The product room sees the counted fact on the break, never an editor.
  const k = (await req('GET', '/panel/keys/key_1')).body.key;
  eq(k.sections[0].slots.preroll.direct.rungCount, 1, 'the integration sees the deal on the break');
  eq(k.sections[0].slots.midroll.direct, null, 'and nothing where there are no deals');
  // The player is handed the deal inside the break — and tries never cut it.
  await patchDrive('key_1', 'preroll', { tries: 1 });
  await req('POST', '/panel/keys/key_1/publish');
  const live = (await req('GET', `/panel/live/${k.key}`)).body;
  const pre = live.sections[0].slots.preroll;
  eq(pre.direct.walk.length, 1, 'one try on the surface never cuts the direct deal');
  eq(pre.direct.maxSession, undefined, 'no cap rides the wire');
  eq(pre.walk.length, 1, 'while the break itself stops after one');
  // The old global list is refused by name.
  const oldDoor = await req('PATCH', '/panel/setups/as_1', { direct: { maxSession: 3 } });
  eq(oldDoor.status, 400, 'the global door is gone');
  assert(oldDoor.body.errors.some(e => e.message.includes('Direct lives on each break now')), 'named');
});

await test('the direct tier is the deal, not a ladder — a second deal and the old cap are refused by name', async () => {
  const two = await req('PATCH', '/panel/setups/as_1',
    { slots: { preroll: { direct: { rungs: [
      { type: 'tag', tagId: 'tag_1' }, { type: 'tag', tagId: 'tag_2' }] } } } });
  eq(two.status, 400, 'two deals refused');
  assert(two.body.errors.some(e => e.message.includes('ONE direct deal')), 'named, with the count found');
  const cap = await req('PATCH', '/panel/setups/as_1',
    { slots: { preroll: { direct: { maxSession: 3 } } } });
  eq(cap.status, 400, 'the dead cap refused');
  assert(cap.body.errors.some(e => e.message.includes('no session cap any more')), 'and told why');
  const touch = await req('PATCH', '/panel/setups/as_1',
    { slots: { preroll: { direct: {} } } });
  eq(touch.status, 200, 'an empty direct patch lands');
  const d = (await req('GET', '/panel/setups/as_1')).body.setup.sections[0].slots.preroll.direct;
  eq(d.rungCount, 1, 'and wipes nothing — the deal never moved');
});

await test('a group with no fallback honours any fallback decision — primary only, never \'setup order\'', async () => {
  // as_7's mid-roll group 2 carries one rung (its primary). Order the fallback to one
  // partner: the single-rung group must NOT read as fallen back — there was no fallback
  // to filter — while a group whose non-empty fallback misses the partner still does.
  const k = (await req('GET', '/panel/keys/key_3')).body.key;
  const g2 = k.sections[0].slots.midroll.groups?.[1];
  assert(g2, 'key_3 runs two mid-roll groups');
  const before = g2.rungCount;
  const r = await req('POST', '/panel/keys/bulk',
    { ids: ['key_3'], action: 'driveFields', value: { slot: 'midroll', fields: { ask: ['ima'] } } });
  eq(r.status, 200, 'the ask lands');
  const after = (await req('GET', '/panel/keys/key_3')).body.key.sections[0].slots.midroll;
  eq(after.groups[1].fellBack, false, 'one-rung group: the decision is honoured, not fallen back from');
  eq(after.groups[1].rungCount, before, 'and its walk never moved');
  await req('POST', '/panel/keys/bulk',
    { ids: ['key_3'], action: 'driveFields', value: { slot: 'midroll', fields: { ask: null } } });
});

await test('a mid-roll is BREAK GROUPS: each its own cadence and ladder, capped at 3', async () => {
  const s = (await req('GET', '/panel/setups/as_7')).body.setup;
  const mid = s.sections[0].slots.midroll;
  eq(mid.groups.length, 2, 'as_7 runs two groups');
  eq(mid.groups[0].behaviour.mode, 'cuepoints', 'group 1 at named positions');
  eq(mid.groups[1].behaviour.mode, 'interval', 'group 2 every so often');
  eq(mid.groups[1].behaviour.stopAfter, undefined, 'and no mid-way stop — Break cap died 1 Sep');
  eq(mid.rungCount, mid.groups[0].rungCount, 'group 1 IS the mid-roll — the slot reads as it');
  // A fourth group is refused naming the cap.
  const four = await req('PATCH', '/panel/setups/as_7', {
    slots: { midroll: { groups: [{}, {}, {}, {}] } },
  });
  eq(four.status, 400, 'refused');
  assert(four.body.errors.some(e => e.message.includes('at most 3 break groups')), 'named');
  // Only a mid-roll holds groups.
  const pre = await req('PATCH', '/panel/setups/as_7', {
    slots: { preroll: { groups: [{}, {}] } },
  });
  eq(pre.status, 400, 'a pre-roll is one break');
  assert(pre.body.errors.some(e => e.message.includes('only a mid-roll holds break groups')), 'named');
});

await test('one group is today\'s mid-roll — every existing setup normalizes unchanged', async () => {
  const s = (await req('GET', '/panel/setups/as_1')).body.setup;
  const mid = s.sections[0].slots.midroll;
  eq(mid.groups.length, 1, 'one group');
  eq(JSON.stringify(mid.groups[0].rungs), JSON.stringify(mid.rungs), 'and it is the slot itself');
  // A plain ladder patch still lands on it — nothing about groups to know.
  const rungs = mid.rungs.slice(0, 2);
  const r = await req('PATCH', '/panel/setups/as_1', { slots: { midroll: { rungs } } });
  eq(r.status, 200, 'saved');
  const after = (await req('GET', '/panel/setups/as_1')).body.setup.sections[0].slots.midroll;
  eq(after.rungCountConfigured, 2, 'the ladder moved');
  eq(after.groups[0].rungCountConfigured, 2, 'and group 1 moved with it — one object, two names');
});

await test('every break group answers for itself — one dark group is one dark break', async () => {
  // Empty group 2's ladder while key_3 runs mid-rolls live: refused, the group named.
  const s = (await req('GET', '/panel/setups/as_7')).body.setup;
  const g1 = s.sections[0].slots.midroll.groups[0];
  const r = await req('PATCH', '/panel/setups/as_7', {
    slots: { midroll: { groups: [{ rungs: g1.rungs }, { rungs: [] }] } },
  });
  eq(r.status, 409, 'refused — key_3 fills its mid-roll group 2 from this');
  assert(r.body.message.includes('group 2'), `the group is named (got ${r.body.message})`);
  // The live snapshot is checked at publish too: a group emptied on a DRAFT while the
  // switch is off publishes only when nothing runs on it.
  const g2 = await req('PATCH', '/panel/setups/as_7/sections/0/behaviour',
    { slot: 'midroll', group: 1, behaviour: { every: 240 } });
  eq(g2.status, 200, 'group 2\'s own behaviour edits by group index');
  const after = (await req('GET', '/panel/setups/as_7')).body.setup.sections[0].slots.midroll;
  eq(after.groups[1].behaviour.every, 240, 'landed on group 2');
  eq(after.groups[0].behaviour.every, s.sections[0].slots.midroll.groups[0].behaviour.every, 'group 1 untouched');
});

await test('the player is served every group\'s own walk and cadence', async () => {
  const k = (await req('GET', '/panel/keys/key_3')).body.key;
  const live = (await req('GET', `/panel/live/${k.key}`)).body;
  const mid = live.sections[0].slots.midroll;
  eq(mid.groups.length, 2, 'both groups ride the config');
  eq(mid.groups[1].behaviour.every, 180, 'with group 2\'s own cadence');
  assert(mid.walk.length > 0, 'group 1 doubles as the slot for a one-group player');
  eq(JSON.stringify(mid.walk), JSON.stringify(mid.groups[0].walk), 'and they agree');
});

await test('every unit in a break carries an ad placement; the close clocks stay the banner\u2019s', async () => {
  const s = (await req('GET', '/panel/setups/as_1')).body.setup;
  const banner = s.sections[0].slots.preroll.rungView.find(r => r.tagType === 'display');
  eq(banner.displaySlot, 'player_bottom', 'a place on the page, defaulted from the vocabulary');
  eq(banner.pause, 'no', 'content keeps playing under a banner by default');
  eq(banner.showAfterSec, 1, 'shows after a beat');
  eq(banner.closeAfterSec, 5, 'close button five seconds later');
  eq(banner.hideAfterSec, 10, 'gone after ten');
  // Pause is EVERY unit's own answer (31 Aug, user call — the JSON's pause rides every
  // unit): a video unit defaults to taking the screen, and may choose not to.
  const video = s.sections[0].slots.preroll.rungView.find(r => r.tagType === 'video');
  eq(video.pause, 'yes', 'a video unit pauses content by default');
  // AD PLACEMENT IS EVERY UNIT'S (3 Sep, user call): a banner renders at the position,
  // a video unit's companion renders alongside it — so the field is no longer refused
  // on IMA and CAN units, and defaults from the same vocabulary.
  eq(video.displaySlot, 'player_bottom', 'a video unit carries an ad placement too');
  eq(video.hideAfterSec, undefined, 'but no banner clocks');
  const rungs = s.sections[0].slots.preroll.rungs.map((r, i) => i === 0 ? { ...r, pause: 'no' } : r);
  const ok = await req('PATCH', '/panel/setups/as_1', { slots: { preroll: { rungs } } });
  eq(ok.status, 200, 'a video unit that plays over content is a fine answer');
  // The banner-only facts are still refused on a video rung, by name.
  const rungs2 = s.sections[0].slots.preroll.rungs.map((r, i) => i === 0 ? { ...r, hideAfterSec: 10 } : r);
  const bad = await req('PATCH', '/panel/setups/as_1', { slots: { preroll: { rungs2: undefined, rungs: rungs2 } } });
  eq(bad.status, 400, 'refused');
  assert(bad.body.errors.some(e => e.message.includes('runs its own length')), 'named');

  // And a video unit may be placed like any other.
  const rungs3 = s.sections[0].slots.preroll.rungs.map((r, i) => i === 0 ? { ...r, displaySlot: 'player_top' } : r);
  const placed = await req('PATCH', '/panel/setups/as_1', { slots: { preroll: { rungs: rungs3 } } });
  eq(placed.status, 200, 'a video unit takes an ad placement');
  eq((await req('GET', '/panel/setups/as_1')).body.setup.sections[0].slots.preroll.rungView[0].displaySlot,
    'player_top', 'and keeps it');
});

await test('banner facts are held to bounds and vocabulary, and ride the published config', async () => {
  const s = (await req('GET', '/panel/setups/as_1')).body.setup;
  const rungs = s.sections[0].slots.preroll.rungs.map(r => ({ ...r }));
  const bIdx = s.sections[0].slots.preroll.rungView.findIndex(r => r.tagType === 'display');
  rungs[bIdx] = { ...rungs[bIdx], displaySlot: 'sidebar_hero' };
  const badSlot = await req('PATCH', '/panel/setups/as_1', { slots: { preroll: { rungs } } });
  eq(badSlot.status, 400, 'a position the player does not offer is refused');
  assert(badSlot.body.errors.some(e => e.message.includes('not an ad placement the player offers')), 'named');
  rungs[bIdx] = { ...s.sections[0].slots.preroll.rungs[bIdx], closeAfterSec: 20, hideAfterSec: 8 };
  const badClock = await req('PATCH', '/panel/setups/as_1', { slots: { preroll: { rungs } } });
  eq(badClock.status, 400, 'hiding before its own close button is refused');
  assert(badClock.body.errors.some(e => e.message.includes('before its close button')), 'named');
  // The good values ride the snapshot to the player.
  rungs[bIdx] = { ...s.sections[0].slots.preroll.rungs[bIdx], displaySlot: 'l_50', pause: 'size' };
  eq((await req('PATCH', '/panel/setups/as_1', { slots: { preroll: { rungs } } })).status, 200, 'saved');
  eq((await req('POST', '/panel/setups/as_1/publish')).status, 200, 'published');
  const k = (await req('GET', '/panel/keys/key_1')).body.key;
  const live = (await req('GET', `/panel/live/${k.key}`)).body.sections[0].slots.preroll;
  const lb = live.walk.find(x => x.type === 'display');
  eq(lb.displaySlot, 'l_50', 'where on the page');
  eq(lb.pause, 'size', 'and whether content pauses — the player\'s own size decides');
});

await test('out-stream is a fifth slot: a rotation outside playback, switch only', async () => {
  const meta = (await req('GET', '/panel/meta')).body;
  eq(meta.slotTypes.includes('outstream'), true, 'a slot type');
  eq(meta.slotKind.outstream, 'rotation', 'takes turns');
  const s = (await req('GET', '/panel/setups/as_7')).body.setup;
  const b = s.sections[0].slots.outstream.behaviour;
  eq(b.hideOnInStream, true, 'steps aside for a video ad by default');
  eq(b.refresh, undefined, 'its show times are its own schedule — no rotation refresh');
  eq(b.walkDepth, undefined, 'and no depth — banners take turns');
  // Nothing to decide beyond its switch.
  const r = await patchDrive('key_3', 'outstream', { tries: 1 });
  eq(r.status, 400, 'refused');
  assert(r.body.errors.some(e => e.message.includes('takes turns')), 'says why');
  // Direct never reaches it: direct is break demand, out-stream is not a break.
  const k = (await req('GET', '/panel/keys/key_3')).body.key;
  const live = (await req('GET', `/panel/live/${k.key}`)).body;
  assert(live.sections[0].slots.outstream, 'on air on key_3');
  assert(live.sections[0].slots.outstream.walk.every(x => x.type === 'display'), 'banners only');
});

await test('the break\'s giving-up point warns about the unreachable tail, counted', async () => {
  const copy = await freshSetup('as_1', 'fill timeout copy');
  const r = await req('PATCH', `/panel/setups/${copy.id}/sections/0/behaviour`,
    { slot: 'preroll', behaviour: { fillTimeoutSec: 6, tagTimeoutMs: 1500 } });
  eq(r.status, 200, 'a lever, never a wall');
  assert(r.body.warnings.some(w => w.includes('gives up at 6s') && w.includes('would never run')),
    `the tail is counted (got ${JSON.stringify(r.body.warnings)})`);
  const bad = await req('PATCH', `/panel/setups/${copy.id}/sections/0/behaviour`,
    { slot: 'preroll', behaviour: { fillTimeoutSec: 2 } });
  eq(bad.status, 400, 'out of bounds refused');
});

await test('the Break cap is gone — refused by name, and the cadence runs the video out', async () => {
  // Cut 1 Sep (user call): nothing counted a mid-way stop. The refusal says what to
  // lean on instead — at set positions, the positions themselves are the cap.
  const dead = await req('PATCH', '/panel/setups/as_1/sections/0/behaviour',
    { slot: 'midroll', behaviour: { stopAfter: 4 } });
  eq(dead.status, 400, 'refused');
  assert(dead.body.errors.some(e => e.message.includes('Break cap') && e.message.includes('not a setting any more')),
    `named, with the way to think about it (got ${JSON.stringify(dead.body.errors)})`);
  const r = await req('PATCH', '/panel/setups/as_1/sections/0/behaviour',
    { slot: 'midroll', behaviour: { mode: 'interval', firstAt: 120, every: 300 } });
  eq(r.status, 200, 'the cadence itself is untouched');
  const b = (await req('GET', '/panel/setups/as_1')).body.setup.sections[0].slots.midroll.behaviour;
  eq(b.stopAfter, undefined, 'and carries no stop — the drumbeat runs the video out');
});

await test('request templates: authored in the ops room, validated against the player\'s macros', async () => {
  const r = await req('POST', '/panel/templates', {
    name: 'GAM test', provider: 'ima',
    url: 'https://ads.example.com/vast?cb=[CACHEBUSTER]&ref=[REFERRER_URL]',
  });
  eq(r.status, 201, 'created');
  const bad = await req('POST', '/panel/templates', {
    name: 'GAM broken', provider: 'ima',
    url: 'https://ads.example.com/vast?ref=[REFERER]',
  });
  eq(bad.status, 400, 'a macro outside the vocabulary is refused');
  assert(bad.body.errors.some(e => e.message.includes('[REFERER] is not a macro the player fills')), 'named');
  eq((await req('POST', '/panel/templates', { name: 'x', provider: 'ima', url: 'not-a-url' })).status,
    400, 'not a URL, refused');
});

await test('a tag picks its template — Standard is absence, and a mismatch is refused', async () => {
  const tpl = (await req('POST', '/panel/templates', {
    name: 'GAM special', provider: 'ima', url: 'https://ads.example.com/vast?cb=[CACHEBUSTER]',
  })).body.template;
  const tags = (await req('GET', '/panel/tags')).body.tags;
  const ima = tags.find(t => t.provider === 'ima');
  const can = tags.find(t => t.provider === 'can');
  const mismatch = await req('PATCH', `/panel/tags/${can.id}`, { tplId: tpl.id });
  eq(mismatch.status, 400, 'an IMA template on a CAN tag is refused');
  assert(mismatch.body.errors.some(e => e.message.includes('is a IMA template — this tag asks CAN')), 'named');
  const ok = await req('PATCH', `/panel/tags/${ima.id}`, { tplId: tpl.id });
  eq(ok.status, 200, 'the right provider lands');
  // In use: the template cannot be deleted, and is counted.
  const del = await req('DELETE', `/panel/templates/${tpl.id}`);
  eq(del.status, 409, 'refused');
  assert(del.body.message.includes('carries 1 tag'), 'counted');
  const back = await req('PATCH', `/panel/tags/${ima.id}`, { tplId: null });
  eq(back.status, 200, 'back to Standard — stored as absence');
  eq((await req('DELETE', `/panel/templates/${tpl.id}`)).status, 200, 'and now it deletes');
});

await test('the emitted unittpl block is resolved from the tags\' chosen templates', async () => {
  const s = (await req('GET', '/panel/setups/as_1')).body.setup;
  const primary = s.sections[0].slots.preroll.rungView[0];
  const tpl = (await req('POST', '/panel/templates', {
    name: 'GAM_2', provider: 'ima', url: 'https://ads.example.com/vast2?cb=[CACHEBUSTER]',
  })).body.template;
  await req('PATCH', `/panel/tags/${primary.tagId}`, { tplId: tpl.id });
  // No republish needed: a walk names tags, and tags resolve live — the same rule
  // that lets ops repoint a tag's value without touching fifty setups.
  const k = (await req('GET', '/panel/keys/key_1')).body.key;
  const live = (await req('GET', `/panel/live/${k.key}`)).body;
  eq(live.unittpl.GAM_2, 'https://ads.example.com/vast2?cb=[CACHEBUSTER]', 'the template rides by name');
  eq(live.sections[0].slots.preroll.walk[0].tpl, 'GAM_2', 'and the unit names which one carries it');
});

await test('break pacing lives on the BREAK: the pre-roll\'s head start, prefetch on coming breaks', async () => {
  // Moved 31 Aug (user call): minPreRenderTime gates the pre-roll, prefetch readies a
  // break that arrives mid-playback — slot facts, not player facts.
  const slots = (await req('GET', '/panel/setups/as_1')).body.setup.sections[0].slots;
  eq(slots.preroll.behaviour.minContentSec, 1, 'the pre-roll lets a beat of video play first');
  eq(slots.midroll.behaviour.prefetchSec, 5, 'a mid-roll fetches its first ad 5s early');
  eq(slots.postroll.behaviour.prefetchSec, 5, 'so does the post-roll');
  eq(slots.preroll.behaviour.prefetchSec, undefined, 'a pre-roll has no before to fetch in');
  eq(slots.midroll.behaviour.minContentSec, undefined, 'and only the pre-roll guards the first frame');
  // The player keeps the one fact that is its own.
  const k = (await req('GET', '/panel/keys/key_1')).body.key;
  eq(k.player.expandInMini, true, 'banners expand in the mini player');
  eq(k.player.prefetchSec, undefined, 'prefetch is not the player\'s any more');
  const r = await req('POST', '/panel/keys/bulk', {
    ids: ['key_1', 'key_3'], action: 'playerFields',
    value: { fields: { expandInMini: false } },
  });
  eq(r.status, 200, 'bulk lands');
  eq(r.body.changed, 2, 'both moved');
  const bounds = await req('PATCH', '/panel/setups/as_1/sections/0/behaviour',
    { slot: 'preroll', behaviour: { minContentSec: 99 } });
  eq(bounds.status, 400, 'bounds hold on the slot');
});

await test('DIRECT is the break\'s switch on the surface — driven, bulked, gating the live break', async () => {
  // On by default (absence); the list and cap stay ops'.
  const k1 = (await req('GET', '/panel/keys/key_1')).body.key;
  eq(k1.sections[0].slots.preroll.direct.on, true, 'on by default');
  // The drive carries it, per break — and bulk writes it like any quick decision.
  const off = await req('POST', '/panel/keys/bulk',
    { ids: ['key_1', 'key_3'], action: 'driveFields', value: { slot: 'preroll', fields: { direct: false } } });
  eq(off.status, 200, 'applied');
  eq(off.body.changed, 2, 'both surfaces switched');
  eq((await req('GET', '/panel/keys/key_1')).body.key.sections[0].slots.preroll.direct.on, false, 'off on key_1\'s pre-roll');
  await req('POST', '/panel/keys/key_1/publish');
  const live = (await req('GET', `/panel/live/${k1.key}`)).body;
  eq(live.sections[0].slots.preroll.direct, undefined, 'the live pre-roll carries no direct tier while off');
  // Back on = dropping the decision; the tier returns, nothing was lost.
  const on = await req('POST', '/panel/keys/bulk',
    { ids: ['key_1'], action: 'driveFields', value: { slot: 'preroll', fields: { direct: true } } });
  eq(on.status, 200, 'switched back');
  await req('POST', '/panel/keys/key_1/publish');
  eq((await req('GET', `/panel/live/${k1.key}`)).body.sections[0].slots.preroll.direct.walk.length, 1,
    'the tier is back, the deal intact');
});

await test('`status` is gone — a payload still carrying it is refused by name', async () => {
  const r = await req('PATCH', '/panel/keys/key_1', { status: 'paused' });
  eq(r.status, 400, 'refused');
  assert(r.body.errors.some(e => e.field === 'status' && e.message.includes('Unpublish')),
    `says what replaced it (got ${JSON.stringify(r.body.errors)})`);
  eq((await req('POST', '/panel/keys/key_1/status', { status: 'paused' })).status, 404, 'and the route went with it');
});

// ---------- the global activity log is CUT (27 Aug, user call) ----------

await test('the global activity log is gone — every history is a version history now', async () => {
  eq((await req('GET', '/panel/activity')).status, 404, 'the route is removed, not hidden');
  await req('PATCH', '/panel/setups/as_6', { name: 'NBT VideoShow demand v2' });
  const r = (await req('GET', '/panel/setups/as_6/versions')).body;
  assert(r.unpublished.some(c => c.field === 'name'), 'the edit is visible where the object lives');
  assert(r.versions.some(v => v.actor && v.actor !== 'You'), 'and seeded history still carries named actors');
});

// ---------- custom player configs (2 Sep, user call) ----------
// ONE default player stays the rule; a surface may carry named forks of the
// per-placement facts (playback mode, MiniTV expansion, autoplay behaviour + volume).
// A player asks for a config by name; everything else follows the default.

await test('custom player configs: single-word keys, unique, bounded — refused by name otherwise', async () => {
  const base = { playerConfigs: [{ name: 'shorts', playback: 'passive' }] };
  eq((await req('PATCH', '/panel/keys/key_1', base)).status, 200, 'a keyed fork lands');

  let r = await req('PATCH', '/panel/keys/key_1', { playerConfigs: [{ playback: 'passive' }] });
  eq(r.status, 400, 'no key, no config');
  assert(r.body.errors.some(e => e.field === 'playerConfigs' && e.message.includes('by key')),
    `says why the key matters (got ${JSON.stringify(r.body.errors)})`);

  r = await req('PATCH', '/panel/keys/key_1', { playerConfigs: [{ name: 'shorts feed', playback: 'passive' }] });
  eq(r.status, 400, 'a key is one word — spaces refused');
  assert(r.body.errors.some(e => e.message.includes('ONE word')), 'and the rule is named');

  r = await req('PATCH', '/panel/keys/key_1', { playerConfigs: [{ name: 'shorts', autoplay: 'on', passiveVolume: 50 }] });
  eq(r.status, 400, 'a fork carries no volume — the player has ONE Passive volume');

  r = await req('PATCH', '/panel/keys/key_1', { playerConfigs: [
    { name: 'shorts', playback: 'passive' }, { name: 'Shorts', playback: 'active' }] });
  eq(r.status, 400, 'two configs, one key — refused');

  r = await req('PATCH', '/panel/keys/key_1', { playerConfigs: [{ name: 'X', playback: 'floating' }] });
  eq(r.status, 400, 'a playback mode outside the vocabulary is refused');

  r = await req('PATCH', '/panel/keys/key_1', {
    playerConfigs: [1, 2, 3, 4, 5, 6, 7].map(i => ({ name: `C${i}` })) });
  eq(r.status, 400, 'at most six custom configs');
  assert(r.body.errors.some(e => e.message.includes('At most 6')), 'the cap is counted, in the refusal');
});

await test('custom configs ride the publish plane and land in the player’s JSON', async () => {
  const k = (await req('GET', '/panel/keys/key_1')).body.key;
  const live0 = (await req('GET', `/panel/live/${k.key}`)).body;
  eq(live0.playerConfigs.length, 1, 'the seeded fork is live');
  eq(live0.playerConfigs[0].name, 'shorts', 'by key');
  eq(live0.playerConfigs[0].playback, 'passive', 'with its own playback mode');
  eq(live0.player.playback, 'active', 'while the default player runs active');
  eq(live0.playerConfigs[0].autoplay, 'off', 'and carries its own autoplay behaviour');

  await req('PATCH', '/panel/keys/key_1', { playerConfigs: [
    { ...k.playerConfigs[0], autoplay: 'on' },
    { name: 'live_blog', playback: 'passive' },
  ] });
  const live1 = (await req('GET', `/panel/live/${k.key}`)).body;
  eq(live1.playerConfigs.length, 1, 'a saved fork is a draft — the player still gets one');

  const pub = await req('POST', '/panel/keys/key_1/publish');
  eq(pub.status, 200, 'published');
  assert(pub.body.version.changes.some(c => c.where === 'Player configs' && c.field === 'live_blog' && c.to === 'added'),
    `a new fork is one line in the rail (got ${JSON.stringify(pub.body.version.changes)})`);
  assert(pub.body.version.changes.some(c => c.where === 'Player configs · shorts' && c.field === 'autoplay'),
    'a moved field is named where it lives');
  const live2 = (await req('GET', `/panel/live/${k.key}`)).body;
  eq(live2.playerConfigs.length, 2, 'now the player has both');
  eq(live2.playerConfigs.find(c => c.name === 'shorts').autoplay, 'on', 'with the moved autoplay');
});

await test('no custom configs: the JSON does not grow the field, and ids hold across saves', async () => {
  const k2 = (await req('GET', '/panel/keys/key_2')).body.key;
  eq((await req('GET', `/panel/live/${k2.key}`)).body.playerConfigs, undefined,
    'a plain surface’s JSON is exactly what it was');
  eq(k2.player.playback, 'active', 'and every player saved before the field existed runs active');

  const k1 = (await req('GET', '/panel/keys/key_1')).body.key;
  const id0 = k1.playerConfigs[0].id;
  const r = await req('PATCH', '/panel/keys/key_1', { playerConfigs: [
    { ...k1.playerConfigs[0], name: 'shorts_rail' }] });
  eq(r.body.key.playerConfigs[0].id, id0, 'a rename is a rename — the id holds');
});

// ---------- WHERE THE MID-ROLL BREAKS FALL (3 Sep, user call) ----------

await test('cue points are a drive decision — resolved over every placement, into the JSON', async () => {
  const k0 = (await req('GET', '/panel/keys/key_1')).body.key;
  const bases = k0.sections.map(s => s.slots.midroll.behaviour.cuepoints.join(','));
  assert(bases[0] !== bases[1], 'the seed gives the two placements different positions');

  const r = await req('PATCH', '/panel/keys/key_1', { drive: { midroll: { cuepoints: ['2:00', 480] } } });
  eq(r.status, 200, 'the decision is accepted');
  const k1 = (await req('GET', '/panel/keys/key_1')).body.key;
  for (const s of k1.sections) {
    eq(s.slots.midroll.behaviour.cuepoints.join(','), '120,480', `“${s.name}” serves the decision`);
    assert(s.slots.midroll.behaviourDrive.includes('cuepoints'), 'and says the decision is the surface’s');
    assert(s.slots.midroll.behaviourBase.cuepoints.join(',') !== '120,480', 'the setup’s own positions are untouched');
  }

  await req('POST', '/panel/keys/key_1/publish');
  const live = (await req('GET', `/panel/live/${k1.key}`)).body;
  eq(live.sections[0].slots.midroll.behaviour.cuepoints.join(','), '120,480', 'the player is told the same');

  await req('PATCH', '/panel/keys/key_1', { drive: { midroll: { cuepoints: null } } });
  const k2 = (await req('GET', '/panel/keys/key_1')).body.key;
  eq(k2.sections[0].slots.midroll.behaviour.cuepoints.join(','), bases[0],
    'clearing follows the ad setup again');
});

await test('a cadence with nowhere to fall, and a cadence on the wrong break, are refused by name', async () => {
  const empty = await req('PATCH', '/panel/keys/key_1', { drive: { midroll: { cuepoints: [] } } });
  eq(empty.status, 400, 'no positions at all is a dark break, not a decision');
  assert(/at least one break position/.test(JSON.stringify(empty.body.errors)),
    `named (got ${JSON.stringify(empty.body.errors)})`);

  const bad = await req('PATCH', '/panel/keys/key_1', { drive: { midroll: { cuepoints: ['banana'] } } });
  eq(bad.status, 400, '“banana” is not a time');

  const wrong = await req('PATCH', '/panel/keys/key_1', { drive: { preroll: { cuepoints: [60] } } });
  eq(wrong.status, 400, 'a pre-roll has no positions to fall at');
  assert(/break positions/.test(JSON.stringify(wrong.body.errors)), 'and the refusal names the field');
});

await test('several break groups are an arrangement — the cadence stays the ad setup’s', async () => {
  const setup = (await req('GET', '/panel/setups/as_1')).body.setup;
  const secs = JSON.parse(JSON.stringify(setup.sections));
  const mid = secs[0].slots.midroll;
  secs[0].slots.midroll = { groups: [
    { rungs: mid.rungs, behaviour: { ...mid.behaviour, mode: 'cuepoints', cuepoints: [120] } },
    { rungs: mid.rungs, behaviour: { ...mid.behaviour, mode: 'interval', every: 600 } },
  ] };
  eq((await req('PATCH', '/panel/setups/as_1', { sections: secs })).status, 200, 'two cadences staged');

  const r = await req('PATCH', '/panel/keys/key_1', { drive: { midroll: { cuepoints: [300] } } });
  eq(r.status, 400, 'one answer cannot stand for two cadences');
  assert(/break groups/.test(JSON.stringify(r.body.errors)),
    `and the refusal says why (got ${JSON.stringify(r.body.errors)})`);

  eq((await req('PATCH', '/panel/keys/key_1', { drive: { midroll: { tries: 2 } } })).status, 200,
    'the break’s other decisions are untouched by it');
});

await test('every pod owns its direct deal — pod 1\u2019s doubles as the mid-roll\u2019s', async () => {
  const s0 = (await req('GET', '/panel/setups/as_1')).body.setup;
  const mid = s0.sections[0].slots.midroll;
  const dealTag = mid.direct.rungs[0]?.tagId || s0.sections[0].slots.preroll.direct.rungs[0]?.tagId;
  assert(dealTag, 'the fixture has a deal to work with');

  // Two pods, each with its own deal.
  const other = (await req('GET', '/panel/tags')).body.tags
    .find(t => t.type === 'video' && t.id !== dealTag);
  const r = await req('PATCH', '/panel/setups/as_1', { slots: { midroll: { groups: [
    { rungs: mid.rungs, behaviour: { ...mid.behaviour, mode: 'cuepoints', cuepoints: [120] },
      direct: { rungs: [{ type: 'tag', tagId: dealTag }] } },
    { rungs: mid.rungs, behaviour: { ...mid.behaviour, mode: 'cuepoints', cuepoints: [600] },
      direct: { rungs: [{ type: 'tag', tagId: other.id }] } },
  ] } } });
  eq(r.status, 200, 'two pods, two deals');
  const got = (await req('GET', '/panel/setups/as_1')).body.setup.sections[0].slots.midroll;
  eq(got.groups.length, 2, 'both pods stand');
  eq(got.groups[0].direct.rungs[0].tagId, dealTag, 'pod 1 keeps its own deal');
  eq(got.groups[1].direct.rungs[0].tagId, other.id, 'pod 2 sold its own');
  eq(got.direct.rungs[0].tagId, dealTag, 'and pod 1\u2019s doubles as the mid-roll\u2019s');

  // The player is told each pod's deal.
  eq((await req('POST', '/panel/setups/as_1/publish')).status, 200, 'published');
  const k = (await req('GET', '/panel/keys/key_1')).body.key;
  const liveMid = (await req('GET', `/panel/live/${k.key}`)).body.sections[0].slots.midroll;
  eq(liveMid.groups.length, 2, 'two pods on air');
  assert(liveMid.groups[0].direct && liveMid.groups[1].direct, 'each pod carries its deal to the player');
  assert(liveMid.groups[0].direct.walk[0].value !== liveMid.groups[1].direct.walk[0].value,
    'and they are not the same deal');

  // One deal per pod, still — the tier is the deal, not a ladder.
  const two = await req('PATCH', '/panel/setups/as_1', { slots: { midroll: { groups: [
    { direct: { rungs: [{ type: 'tag', tagId: dealTag }, { type: 'tag', tagId: other.id }] } }, {},
  ] } } });
  eq(two.status, 400, 'two deals in one pod is refused');
  assert(JSON.stringify(two.body.errors).includes('ONE direct deal'), 'named');
});

server.close();

console.log(`\n${passed} passed, ${failed} failed`);
if (failed) process.exit(1);
