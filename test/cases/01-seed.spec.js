// test/cases/01-seed.spec.js — the seeded world: counts, determinism, the scale scenario.
// Bodies are unchanged from the single-file suite; helpers come from ../harness.js.

export default async function run({ test, req, eq, assert, freshSetup, patchSlot, patchDrive, VALID_KEY, PLAYER_MIN }) {
  // ---------- seed & determinism ----------

  await test('reset seeds 10 ad setups, 26 tags, 7 integrations — one setup each and three unmapped, and the old rooms are gone', async () => {
    const s = await req('GET', '/panel/setups');
    const t = await req('GET', '/panel/tags');
    const k = await req('GET', '/panel/keys');
    eq(s.body.setups.length, 10, 'setups');
    eq(t.body.tags.length, 26, 'tags');
    eq(k.body.keys.length, 7, 'keys');
    assert(s.body.setups.every(x => x.usedBy <= 1), 'the seeded world maps one each — sharing is legal (8 Sep), not seeded');
    // One free setup per property (8 Sep): the state `Not mapped yet` filters for, and
    // the only state in which an integration can simply USE demand that already exists.
    eq(s.body.setups.filter(x => !x.usedBy).length, 3, 'three built ahead of their surface');
    eq([...new Set(s.body.setups.filter(x => !x.usedBy).map(x => x.property))].sort(),
      ['ET', 'NBT', 'TOI'], 'one on each property');
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
    eq(setups.length, 70, 'sixty of their own setups on top of the demo ten');
    const k1 = keys.find(k => k.id === 'key_1');
    eq(k1.name, 'TOI Mweb VideoShow', 'key_1 keeps its identity');
    assert(setups.every(s => s.usedBy <= 1), 'the generated fleet maps one each too');
  });
}
