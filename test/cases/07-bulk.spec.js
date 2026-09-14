// test/cases/07-bulk.spec.js — the bulk acts over a cohort.
// Bodies are unchanged from the single-file suite; helpers come from ../harness.js.

export default async function run({ test, req, eq, assert, freshSetup, patchSlot, patchDrive, VALID_KEY, PLAYER_MIN }) {
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
    eq(rot.status, 400, 'a rotation does not carry pod, walk or order semantics');
    // Was `takes turns — nothing to decide beyond its switch` until the out-stream gained
    // its FIRST drive field (10 Sep, header bidding). That line refused pod/walk/order
    // semantics, which a rotation genuinely has none of; who bids for a banner slot is not
    // one of those. So the refusal now names what the out-stream DOES carry, which is the
    // more useful answer — and this case pins that rather than the retired sentence.
    assert((rot.body.message || '').includes('the waterfall depth'), 'names the field it refused');
    assert((rot.body.message || '').includes('header bidding'), 'and names the one thing a rotation does decide');
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
}
