// test/cases/11-waterfall.spec.js — THE WATERFALL: link not copy, depth, pause, the way back.
// Bodies are unchanged from the single-file suite; helpers come from ../harness.js.

export default async function run({ test, req, eq, assert, freshSetup, patchSlot, patchDrive, VALID_KEY, PLAYER_MIN }) {
  // ---------- THE GLOBAL WATERFALL (5 Sep; named 8 Sep, user call) ----------
  // One indirect ladder at the setup's head; any pre/mid/post break may take its FALL from
  // it instead of holding its own. A LINK, never a copy — plus its two levers (depth, one
  // pause answer) and the rotation/fail-closed edges.
  //
  // THE PRIMARY IS THE BREAK'S OWN IN EVERY ANSWER (8 Sep, user call): following the global
  // waterfall replaces what comes AFTER the first ask, never the first ask itself.

  await test('a linked break serves its own primary, then the waterfall — and keeps the rest', async () => {
    const s = (await req('GET', '/panel/setups/as_1')).body.setup;
    eq((s.waterfall.rungs || []).length, 3, 'the seeded waterfall holds three units');
    const post = s.sections[1].slots.postroll;
    eq(post.waterfallSource, 'setup', 'Shorts feed post-roll takes its fall from it');
    eq(post.rungs.length, 4, 'its own primary, then the waterfall’s three');
    eq(post.rungs[0].tagId, post.ownRungs[0].tagId, 'and the first ask is the break’s own');
    eq(post.ownRungs.length, 1, 'its own unit is kept, not lost');
    const def = s.sections[0].slots.postroll;
    eq(def.waterfallSource, 'own', 'Default post-roll still owns its whole ladder');
  });

  await test('editing the waterfall moves every break that follows it — a link, never a copy', async () => {
    const s = (await req('GET', '/panel/setups/as_1')).body.setup;
    const reversed = [...s.waterfall.rungs].reverse().map(r => ({ type: 'tag', tagId: r.tagId }));
    const r = await req('PATCH', '/panel/setups/as_1', { waterfall: { rungs: reversed } });
    eq(r.status, 200, 'reordered once');
    const post = r.body.setup.sections[1].slots.postroll;
    eq(post.rungs.map(x => x.tagId), [post.ownRungs[0].tagId, ...reversed.map(x => x.tagId)],
      'the linked break’s FALL follows the new order, under its own primary');
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
    eq(post.rungs.length, 2, 'the break’s own primary, then one unit of the waterfall');
    eq(post.rungs[1].tagId, b.tagId, 'an off unit holds its seat but never counts toward the depth');
    const back = await req('PATCH', '/panel/setups/as_1', { waterfall: { depth: null } });
    eq(back.body.setup.sections[1].slots.postroll.rungs.length, 3, 'Full walks every live unit again');
  });

  await test('one content-pause answer governs every unit while the switch is on — each unit’s own when off', async () => {
    const r = await req('PATCH', '/panel/setups/as_1', { waterfall: { pauseAll: 'no' } });
    eq(r.status, 200, 'one answer set');
    const post = r.body.setup.sections[1].slots.postroll;
    assert(post.rungs.slice(1).every(x => x.pause === 'no'), 'every unit it takes from the waterfall wears it');
    assert(post.rungs[0].pause !== 'no', 'the break’s own primary keeps its own answer — it is not in the waterfall');
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

  await test('emptying the waterfall a LIVE break stands WHOLLY on is refused — fail closed, one room over', async () => {
    // Default post-roll runs live on key_1. A break keeping its own primary survives an
    // emptied waterfall (that is the point of the primary), so the darkening case is a
    // break whose WHOLE walk is the waterfall's: linked, with nothing of its own.
    const link = await req('PATCH', '/panel/setups/as_1', {
      sections: [{ slots: { postroll: { waterfallSource: 'setup', ownRungs: [] } } }, {}],
    });
    eq(link.status, 200, 'a live break may take its whole walk from a waterfall with demand');
    const gut = await req('PATCH', '/panel/setups/as_1', { waterfall: { rungs: [] } });
    eq(gut.status, 409, 'gutting the waterfall would darken the live break');
    assert((gut.body.usedBy || []).some(n => n.includes('TOI Mweb VideoShow')), 'the surface is named');
  });

  // ---------- THE THIRD ANSWER: NO FALL (8 Sep, user call) ----------
  // A break's fall is its own, the global waterfall's, or none. `none` keeps every unit
  // the break had — the point of storing it rather than emptying a ladder — and the
  // PRIMARY is not part of the fall, so it goes on serving.

  await test('a break with its fall switched off serves its primary, and keeps the rest', async () => {
    // as_4 has never gone on air, so nothing live stands on its breaks.
    const before = (await req('GET', '/panel/setups/as_4')).body.setup.sections[0].slots.preroll;
    assert(before.rungs.length > 1, 'it starts with a primary and a fall of its own');
    const r = await req('PATCH', '/panel/setups/as_4', {
      sections: [{ slots: { preroll: { waterfallSource: 'none' } } }],
    });
    eq(r.status, 200, 'switched off');
    const pre = r.body.setup.sections[0].slots.preroll;
    eq(pre.waterfallSource, 'none', 'the answer is stored, not inferred from a fall with no rungs');
    eq(pre.rungs.map(x => x.tagId), [before.rungs[0].tagId], 'the primary is the whole walk');
    eq(pre.ownRungs.map(x => x.tagId), before.rungs.map(x => x.tagId), 'and nothing was deleted');
    // The way back is one answer, restoring exactly what stood — the point of storing it.
    const back = await req('PATCH', '/panel/setups/as_4', {
      sections: [{ slots: { preroll: { waterfallSource: 'own' } } }],
    });
    eq(back.status, 200, 'switched back on');
    eq(back.body.setup.sections[0].slots.preroll.rungs.map(x => x.tagId),
      before.rungs.map(x => x.tagId), 'exactly the units it kept');
  });

  await test('switching the fall off never darkens a LIVE break — its primary carries it', async () => {
    // key_1 plays as_1's Default post-roll live. Before 8 Sep this save was refused,
    // because `none` served nothing at all; the primary is what makes it safe now.
    const r = await req('PATCH', '/panel/setups/as_1', {
      sections: [{ slots: { postroll: { waterfallSource: 'none' } } }, {}],
    });
    eq(r.status, 200, 'allowed — the break still has a first ask');
    const post = r.body.setup.sections[0].slots.postroll;
    eq(post.rungs.length, 1, 'and it is the only unit left serving');
  });

  await test('switching off the LAST unit a live break has is refused by name — fail closed', async () => {
    // Same live break, but with no primary to fall back on: nothing would be asked.
    const r = await req('PATCH', '/panel/setups/as_1', {
      sections: [{ slots: { postroll: { waterfallSource: 'none', ownRungs: [] } } }, {}],
    });
    eq(r.status, 409, 'refused at the save, not later');
    assert(r.body.message.includes('would go dark'), 'said as darkness, not as a source');
    assert((r.body.usedBy || []).some(n => n.includes('TOI Mweb VideoShow')), 'the surface is named');
  });

  await test('a rotation has no ads to switch off either — refused by name', async () => {
    const r = await req('PATCH', '/panel/setups/as_1', {
      sections: [{ slots: { outstream: { waterfallSource: 'none' } } }, {}],
    });
    eq(r.status, 400, 'refused');
    assert(JSON.stringify(r.body.errors).includes('takes turns'), 'named');
  });

  await test('the player is handed the whole walk — the break’s primary, then the waterfall', async () => {
    // Linked with nothing of its own: the walk IS the waterfall's, which is the case the
    // player seam has always pinned. The primary's own leg is pinned right below.
    await req('PATCH', '/panel/setups/as_1', {
      waterfall: { pauseAll: 'no' },
      sections: [{ slots: { postroll: { waterfallSource: 'setup', ownRungs: [] } } }, {}],
    });
    eq((await req('POST', '/panel/setups/as_1/publish')).status, 200, 'published');
    const k = (await req('GET', '/panel/keys/key_1')).body.key;
    const live = (await req('GET', `/panel/live/${k.key}`)).body.sections[0].slots.postroll;
    eq(live.walk.length, 3, 'the waterfall’s three units, on air');
    eq(live.walk[0].value, '/7176/toi/ron/video', 'in the waterfall’s own order');
    assert(live.walk.every(x => x.pause === 'no'), 'wearing the one pause answer');
    // And with a primary of its own, the player is handed that unit FIRST (8 Sep).
    const own = (await req('GET', '/panel/setups/as_1')).body.setup.sections[1].slots.postroll;
    await req('PATCH', '/panel/setups/as_1', {
      sections: [{ slots: { postroll: { waterfallSource: 'setup', ownRungs: own.ownRungs.map(r => ({ type: 'tag', tagId: r.tagId })) } } }, {}],
    });
    eq((await req('POST', '/panel/setups/as_1/publish')).status, 200, 'published again');
    const live2 = (await req('GET', `/panel/live/${k.key}`)).body.sections[0].slots.postroll;
    eq(live2.walk.length, 4, 'its own primary, then the waterfall’s three');
    assert(live2.walk[0].value !== '/7176/toi/ron/video', 'and the first ask is the break’s own, not the waterfall’s');
  });
}
