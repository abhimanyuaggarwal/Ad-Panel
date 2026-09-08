// test/cases/06-tags.spec.js — ad tags: in-use protection, manual entry, GAM sync.
// Bodies are unchanged from the single-file suite; helpers come from ../harness.js.

export default async function run({ test, req, eq, assert, freshSetup, patchSlot, patchDrive, VALID_KEY, PLAYER_MIN }) {
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
}
