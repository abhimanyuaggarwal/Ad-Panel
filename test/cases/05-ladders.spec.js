// test/cases/05-ladders.spec.js — integration basics, ladder rules, providers and implied types.
// Bodies are unchanged from the single-file suite; helpers come from ../harness.js.

export default async function run({ test, req, eq, assert, freshSetup, patchSlot, patchDrive, VALID_KEY, PLAYER_MIN }) {
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
}
