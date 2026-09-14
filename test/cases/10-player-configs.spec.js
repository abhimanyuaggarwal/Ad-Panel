// test/cases/10-player-configs.spec.js — custom player configs, the cut activity log, where mid-roll breaks fall.
// Bodies are unchanged from the single-file suite; helpers come from ../harness.js.

export default async function run({ test, req, eq, assert, freshSetup, patchSlot, patchDrive, VALID_KEY, PLAYER_MIN }) {
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

    // A config may override ANY player field (13 Sep, user call) — the 7 Sep one-volume
    // refusal went with the six-field rule. What it may not do is hide: the override is
    // named on the row, in the editor and in the review.
    r = await req('PATCH', '/panel/keys/key_1', { playerConfigs: [{ name: 'shorts', autoplay: 'on', passiveVolume: 50 }] });
    eq(r.status, 200, 'a config may carry its own volume now');
    eq(r.body.key.playerConfigs[0].passiveVolume, 50, 'held as an override');
    r = await req('PATCH', '/panel/keys/key_1', { playerConfigs: [{ name: 'shorts', startVolume: 50 }] });
    eq(r.status, 400, 'the retired key is still refused by name');

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
    // ON THE WIRE A CONFIG IS WHOLE (13 Sep): stored sparse, handed over resolved, in
    // exactly the shape of the document's own player section — `player` plus the five
    // namespaces — so the player reads one grammar twice.
    eq(live0.playerConfigs[0].player.playback, 'passive', 'with its own playback mode');
    eq(live0.playerConfigs[0].playback.playMode, 'passive', 'in the player’s own block too');
    eq(live0.player.playback, 'active', 'while the default player runs active');
    eq(live0.playerConfigs[0].player.autoplay, 'off', 'and carries its own autoplay behaviour');
    eq(live0.playerConfigs[0].player.passiveVolume, live0.player.passiveVolume, 'and inherits what it never spoke about');

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
    eq(live2.playerConfigs.find(c => c.name === 'shorts').player.autoplay, 'on', 'with the moved autoplay');
  });

  await test('no custom configs: the JSON does not grow the field, and ids hold across saves', async () => {
    const k2 = (await req('GET', '/panel/keys/key_2')).body.key;
    eq((await req('GET', `/panel/live/${k2.key}`)).body.playerConfigs, undefined,
      'a plain surface’s JSON is exactly what it was');
    // The BACKWARD-COMPAT RULE, asserted directly (11 Sep). It used to lean on key_2's
    // seeded player carrying no playback mode, which made a product decision about what
    // an ArticleShow surface IS (passive, as of the preset rework) look like a rule
    // break. The rule is about ABSENCE, so absence is what the case now sends.
    const bare = await req('PATCH', '/panel/keys/key_2', { player: { ...k2.player, playback: undefined } });
    eq(bare.status, 200, 'a player sent without a playback mode is accepted');
    eq(bare.body.key.player.playback, 'active', 'and every player saved before the field existed runs active');

    const k1 = (await req('GET', '/panel/keys/key_1')).body.key;
    const id0 = k1.playerConfigs[0].id;
    const r = await req('PATCH', '/panel/keys/key_1', { playerConfigs: [
      { ...k1.playerConfigs[0], name: 'shorts_rail' }] });
    eq(r.body.key.playerConfigs[0].id, id0, 'a rename is a rename — the id holds');
  });

  await test('a config switch rides the row (4 Sep): off leaves the player’s JSON, the rail reads on/off', async () => {
    const k = (await req('GET', '/panel/keys/key_1')).body.key;
    const amp = k.playerConfigs.find(c => c.name === 'amp_stories');
    eq(amp.on, false, 'the seeded fork holds its switch');
    const live0 = (await req('GET', `/panel/live/${k.key}`)).body;
    eq(live0.playerConfigs.length, 1, 'the off config is not in the JSON');
    assert(!live0.playerConfigs.some(c => c.name === 'amp_stories'), 'gone by name');
    eq(live0.playerConfigs[0].on, undefined, 'an emitted config never carries the switch');

    // Switch it on: one save, one publish, and the rail says exactly that — in words.
    await req('PATCH', '/panel/keys/key_1', { playerConfigs: k.playerConfigs.map(c =>
      c.name === 'amp_stories' ? { ...c, on: true } : c) });
    const pub = await req('POST', '/panel/keys/key_1/publish');
    eq(pub.status, 200, 'published');
    assert(pub.body.version.changes.some(c => c.where === 'Player configs' && c.field === 'amp_stories' && c.from === 'off' && c.to === 'on'),
      `the switch is one line, in words (got ${JSON.stringify(pub.body.version.changes)})`);
    eq((await req('GET', `/panel/live/${k.key}`)).body.playerConfigs.length, 2, 'now the player has both');

    // Every config off: the field leaves the JSON entirely, like a surface that has none.
    await req('PATCH', '/panel/keys/key_1', { playerConfigs: k.playerConfigs.map(c => ({ ...c, on: false })) });
    eq((await req('POST', '/panel/keys/key_1/publish')).status, 200, 'published again');
    eq((await req('GET', `/panel/live/${k.key}`)).body.playerConfigs, undefined,
      'every fork off — the JSON does not grow the field');
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
}
