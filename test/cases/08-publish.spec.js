// test/cases/08-publish.spec.js — THE PUBLISH PLANE: publish, unpublish, restore, the seam at the boundary.
// Bodies are unchanged from the single-file suite; helpers come from ../harness.js.

export default async function run({ test, req, eq, assert, freshSetup, patchSlot, patchDrive, VALID_KEY, PLAYER_MIN }) {
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
    const view = (await req('GET', '/panel/setups/as_1')).body.setup;
    eq(view.unpublishedCount, 0, 'the draft followed, so the editor shows what is live');
    // The lists' Status column reads the provenance (4 Sep): the live version names
    // the version it restored, and a fresh publish clears it again.
    eq(view.liveRestoredFrom, 2, 'the view says the live version is a restore of v2');
    eq(view.everPublished, true, 'and that it has been on air');
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
}
