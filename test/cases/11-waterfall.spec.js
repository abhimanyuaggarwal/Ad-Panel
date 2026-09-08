// test/cases/11-waterfall.spec.js — THE WATERFALL: link not copy, depth, pause, the way back.
// Bodies are unchanged from the single-file suite; helpers come from ../harness.js.

export default async function run({ test, req, eq, assert, freshSetup, patchSlot, patchDrive, VALID_KEY, PLAYER_MIN }) {
  // ---------- THE WATERFALL (5 Sep; one word 7 Sep, user call) ----------
  // One indirect ladder at the setup's head; any pre/mid/post break may FOLLOW it instead
  // of owning its units. A LINK, never a copy — plus its two levers (depth, one pause
  // answer) and the rotation/fail-closed edges.

  await test('a linked break serves the waterfall and keeps its own units as the stash', async () => {
    const s = (await req('GET', '/panel/setups/as_1')).body.setup;
    eq((s.waterfall.rungs || []).length, 3, 'the seeded waterfall holds three units');
    const post = s.sections[1].slots.postroll;
    eq(post.waterfallSource, 'setup', 'Shorts feed post-roll follows it');
    eq(post.rungs.length, 3, 'and serves its three units');
    eq(post.ownRungs.length, 1, 'its own unit is kept, not lost');
    const def = s.sections[0].slots.postroll;
    eq(def.waterfallSource, 'own', 'Default post-roll still owns its units');
  });

  await test('editing the waterfall moves every break that follows it — a link, never a copy', async () => {
    const s = (await req('GET', '/panel/setups/as_1')).body.setup;
    const reversed = [...s.waterfall.rungs].reverse().map(r => ({ type: 'tag', tagId: r.tagId }));
    const r = await req('PATCH', '/panel/setups/as_1', { waterfall: { rungs: reversed } });
    eq(r.status, 200, 'reordered once');
    const post = r.body.setup.sections[1].slots.postroll;
    eq(post.rungs.map(x => x.tagId), reversed.map(x => x.tagId), 'the linked break follows the new order');
    eq(post.ownRungs.length, 1, 'its kept units never move');
  });

  await test('waterfall depth cuts every follower, counted over LIVE units only', async () => {
    const s = (await req('GET', '/panel/setups/as_1')).body.setup;
    const [a, b, c] = s.waterfall.rungs;
    // First unit switched off + depth 1: the one serving unit is the first LIVE one.
    const r = await req('PATCH', '/panel/setups/as_1', { waterfall: {
      rungs: [{ type: 'tag', tagId: a.tagId, on: false }, { type: 'tag', tagId: b.tagId }, { type: 'tag', tagId: c.tagId }],
      depth: 1,
    } });
    eq(r.status, 200, 'depth set once');
    const post = r.body.setup.sections[1].slots.postroll;
    eq(post.rungs.length, 1, 'one unit deep everywhere it is followed');
    eq(post.rungs[0].tagId, b.tagId, 'an off unit holds its seat but never counts toward the depth');
    const back = await req('PATCH', '/panel/setups/as_1', { waterfall: { depth: null } });
    eq(back.body.setup.sections[1].slots.postroll.rungs.length, 2, 'Full walks every live unit again');
  });

  await test('one content-pause answer governs every unit while the switch is on — each unit’s own when off', async () => {
    const r = await req('PATCH', '/panel/setups/as_1', { waterfall: { pauseAll: 'no' } });
    eq(r.status, 200, 'one answer set');
    const post = r.body.setup.sections[1].slots.postroll;
    assert(post.rungs.every(x => x.pause === 'no'), 'every served unit wears it');
    assert(r.body.setup.waterfall.rungs.some(x => x.pause === 'yes'), 'the units’ own answers are kept underneath');
    const back = await req('PATCH', '/panel/setups/as_1', { waterfall: { pauseAll: null } });
    assert(back.body.setup.sections[1].slots.postroll.rungs.some(x => x.pause === 'yes'), 'off restores each unit’s own answer');
  });

  await test('the out-stream takes turns — a rotation has no waterfall to follow, refused by name', async () => {
    const r = await req('PATCH', '/panel/setups/as_1', {
      sections: [{ slots: { outstream: { waterfallSource: 'setup' } } }, {}],
    });
    eq(r.status, 400, 'refused');
    assert(JSON.stringify(r.body.errors).includes('takes turns'), 'named');
    const bad = await req('PATCH', '/panel/setups/as_1', {
      sections: [{ slots: { postroll: { waterfallSource: 'global' } } }, {}],
    });
    eq(bad.status, 400, 'an unknown source is refused');
    assert(JSON.stringify(bad.body.errors).includes('not an ad source'), 'named');
  });

  await test('switching back to own units restores exactly what stood — nothing is re-typed', async () => {
    const before = (await req('GET', '/panel/setups/as_1')).body.setup.sections[1].slots.postroll;
    const r = await req('PATCH', '/panel/setups/as_1', {
      sections: [{}, { slots: { postroll: { waterfallSource: 'own' } } }],
    });
    eq(r.status, 200, 'unlinked');
    const post = r.body.setup.sections[1].slots.postroll;
    eq(post.waterfallSource, 'own', 'its own units again');
    eq(post.rungs.map(x => x.tagId), before.ownRungs.map(x => x.tagId), 'exactly the units it kept');
  });

  await test('emptying the waterfall a LIVE linked break stands on is refused — fail closed, one room over', async () => {
    // Default post-roll runs live on key_1; link it to the waterfall, then try to gut it.
    const link = await req('PATCH', '/panel/setups/as_1', {
      sections: [{ slots: { postroll: { waterfallSource: 'setup' } } }, {}],
    });
    eq(link.status, 200, 'a live break may follow a waterfall with demand');
    const gut = await req('PATCH', '/panel/setups/as_1', { waterfall: { rungs: [] } });
    eq(gut.status, 409, 'gutting the waterfall would darken the live break');
    assert((gut.body.usedBy || []).some(n => n.includes('TOI Mweb VideoShow')), 'the surface is named');
  });

  await test('the player is handed the waterfall walk — one truth, materialized', async () => {
    await req('PATCH', '/panel/setups/as_1', {
      waterfall: { pauseAll: 'no' },
      sections: [{ slots: { postroll: { waterfallSource: 'setup' } } }, {}],
    });
    eq((await req('POST', '/panel/setups/as_1/publish')).status, 200, 'published');
    const k = (await req('GET', '/panel/keys/key_1')).body.key;
    const live = (await req('GET', `/panel/live/${k.key}`)).body.sections[0].slots.postroll;
    eq(live.walk.length, 3, 'the waterfall’s three units, on air');
    eq(live.walk[0].value, '/7176/toi/ron/video', 'in the waterfall’s own order');
    assert(live.walk.every(x => x.pause === 'no'), 'wearing the one pause answer');
  });
}
