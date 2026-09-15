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

  await test('a cohort act refuses what ONE surface owns — by name, and before anything lands', async () => {
    // The shortlist the sheet draws is backed here: four fields fail the question "would a
    // team ever want one answer on forty surfaces?", so a payload carrying one is refused
    // whole rather than quietly stripped — otherwise the answer would report "changed" for
    // a field it never wrote.
    const before = (await req('GET', '/panel/keys/key_1')).body.key.player;
    for (const [f, v, word] of [['playbackMode', 'inline', 'Player type'], ['quality', 'hd', 'Quality'],
      ['fallbackMediaId', 'm_9', 'Fallback media'], ['redirectUrl', 'https://x.test', 'Redirect URL']]) {
      const r = await req('POST', '/panel/keys/bulk', {
        ids: ['key_1', 'key_6'], action: 'playerFields', value: { fields: { [f]: v } },
      });
      eq(r.status, 400, `${f} is refused`);
      assert((r.body.message || '').includes(word), `named in its UI words (got ${r.body.message})`);
      assert((r.body.message || '').includes('each integration’s own'), `and says whose it is (got ${r.body.message})`);
    }
    // A mixed payload never half-lands: the allowed field in it is not written either.
    const mixed = await req('POST', '/panel/keys/bulk', {
      ids: ['key_1', 'key_6'], action: 'playerFields',
      value: { fields: { autoplay: 'off', quality: 'hd' } },
    });
    eq(mixed.status, 400, 'the whole write is refused');
    eq((await req('GET', '/panel/keys/key_1')).body.key.player.autoplay, before.autoplay,
      'and the allowed field beside it was never written');
  });

  await test('the cohort shortlist is the SEAM\'s list — the sheet reads it, never repeats it', async () => {
    const m = (await req('GET', '/panel/meta')).body;
    const never = Object.keys(m.bulkNever || {});
    eq(never.sort(), ['fallbackMediaId', 'playbackMode', 'quality', 'redirectUrl'],
      'the four a cohort may not answer travel on meta');
    for (const f of never) {
      assert(typeof m.bulkNever[f] === 'string' && m.bulkNever[f].length > 10,
        `${f} carries the one line the greyed row prints`);
      assert(!m.bulkPlayerFields.includes(f), `${f} is not also on the allowed list`);
    }
    // THE TWO LISTS ARE ONE LIST. Everything a player has, minus what one surface owns, IS
    // what a cohort may set — so the sheet cannot draw a row the seam would drop in silence,
    // and a field added to the player lands in a tier rather than in a gap.
    eq([...m.playerFields].filter(f => !never.includes(f)).sort(), [...m.bulkPlayerFields].sort(),
      'every player field is either a cohort act or one surface’s own — nothing falls between');
  });

  await test('the whole player behaviour card is one cohort act — front row and fold alike', async () => {
    // A brand refresh and a measurement rollout are the two occasions this act exists for:
    // one is on the sheet's front row, the other behind its counted door, and both land.
    const r = await req('POST', '/panel/keys/bulk', {
      ids: ['key_1', 'key_6'], action: 'playerFields',
      value: { fields: { brandColor: '#e8123f', logoUrl: 'https://cdn.test/logo.png', gaId: 'G-ABC123' } },
    });
    eq(r.status, 200, 'applied');
    eq(r.body.changed, 2, 'both integrations moved');
    for (const id of ['key_1', 'key_6']) {
      const p = (await req('GET', `/panel/keys/${id}`)).body.key.player;
      eq(p.brandColor, '#e8123f', `${id} took the brand colour`);
      eq(p.logoUrl, 'https://cdn.test/logo.png', `${id} took the logo`);
      eq(p.gaId, 'G-ABC123', `${id} took the measurement id`);
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

  // ---------- configFields: the cohort's custom configs (15 Sep) ----------
  // The third cohort act, and the one that carries a LIST rather than one value — because a
  // custom config is not something every integration has exactly one of. What the Custom
  // configs sheet resolves its shortcut into is exactly what these cases send.

  await test('a cohort config edit lands per config — the shortcut is already folded into the list', async () => {
    const r = await req('POST', '/panel/keys/bulk', {
      ids: ['key_1', 'key_3', 'key_4', 'key_6'], action: 'configFields',
      value: { edits: [
        { id: 'key_1', config: 'shorts', fields: { autoplay: 'on' } },
        { id: 'key_3', config: 'shorts', fields: { autoplay: 'on' } },
        { id: 'key_4', config: 'shorts', fields: { autoplay: 'on' } },
        { id: 'key_6', config: 'shorts', fields: { autoplay: 'on' }, on: true },
      ] },
    });
    eq(r.status, 200, 'applied');
    eq(r.body.changed, 4, 'every integration carrying the key moved');
    for (const id of ['key_1', 'key_3', 'key_4', 'key_6']) {
      const c = (await req('GET', `/panel/keys/${id}`)).body.key.playerConfigs.find(x => x.name === 'shorts');
      eq(c.autoplay, 'on', `${id} shorts took the answer`);
    }
    eq((await req('GET', '/panel/keys/key_6')).body.key.playerConfigs[0].on, true, 'and the switch with it');
  });

  await test('one integration’s config is tweaked alone — a cohort act is not a blanket one', async () => {
    const r = await req('POST', '/panel/keys/bulk', {
      ids: ['key_1', 'key_3'], action: 'configFields',
      value: { edits: [{ id: 'key_3', config: 'shorts', fields: { autoplay: 'auto' } }] },
    });
    eq(r.status, 200, 'applied');
    eq(r.body.changed, 1, 'exactly one');
    eq((await req('GET', '/panel/keys/key_3')).body.key.playerConfigs[0].autoplay, 'auto', 'the named one moved');
    eq((await req('GET', '/panel/keys/key_1')).body.key.playerConfigs[0].autoplay, 'off',
      'the one not named did not');
  });

  await test('null is the way back — the override drops and the config follows the default LIVE', async () => {
    const r = await req('POST', '/panel/keys/bulk', {
      ids: ['key_1'], action: 'configFields',
      value: { edits: [{ id: 'key_1', config: 'shorts', fields: { playback: null } }] },
    });
    eq(r.status, 200, 'applied');
    const k = (await req('GET', '/panel/keys/key_1')).body.key;
    const c = k.playerConfigs.find(x => x.name === 'shorts');
    eq(c.playback, undefined, 'the override is gone, not set to something');
    // …and the emitted config now reads the default, which is what "follows" means.
    await req('POST', '/panel/keys/key_1/publish');
    const live = (await req('GET', `/panel/live/${k.key}`)).body;
    eq(live.playerConfigs.find(x => x.name === 'shorts').player.playback, k.player.playback,
      'the player is handed the default it now follows');
  });

  await test('the four a cohort may not answer are refused here too — by name, at any scope', async () => {
    for (const [f, v] of [['playbackMode', 'inline'], ['redirectUrl', 'https://x.example'],
      ['quality', '720p'], ['fallbackMediaId', 'med_x']]) {
      const r = await req('POST', '/panel/keys/bulk', {
        ids: ['key_1'], action: 'configFields',
        value: { edits: [{ id: 'key_1', config: 'shorts', fields: { [f]: v } }] },
      });
      eq(r.status, 400, `${f} refused`);
      assert((r.body.message || '').includes('each integration’s own'), `${f} says whose it is`);
    }
    const c = (await req('GET', '/panel/keys/key_1')).body.key.playerConfigs[0];
    eq(c.playbackMode, undefined, 'and nothing landed');
  });

  await test('this act never CREATES a config — a key the integration does not carry is named', async () => {
    const r = await req('POST', '/panel/keys/bulk', {
      ids: ['key_2'], action: 'configFields',
      value: { edits: [{ id: 'key_2', config: 'shorts', fields: { autoplay: 'on' } }] },
    });
    eq(r.status, 400, 'refused');
    assert(r.body.message.includes('TOI Mweb ArticleShow') && r.body.message.includes('shorts'),
      `the surface and the key are both named (got ${r.body.message})`);
    eq((await req('GET', '/panel/keys/key_2')).body.key.playerConfigs.length, 0, 'and none was seeded');
  });

  await test('a refused VALUE stops the whole sweep — a cohort write never half-lands', async () => {
    const r = await req('POST', '/panel/keys/bulk', {
      ids: ['key_1', 'key_3'], action: 'configFields',
      value: { edits: [
        { id: 'key_3', config: 'shorts', fields: { autoplay: 'on' } },
        { id: 'key_1', config: 'shorts', fields: { passiveVolume: 500 } },
      ] },
    });
    eq(r.status, 400, 'refused before anything was touched');
    assert(r.body.message.includes('between 0 and 100'), `naming the number required (got ${r.body.message})`);
    eq((await req('GET', '/panel/keys/key_3')).body.key.playerConfigs[0].autoplay, 'off',
      'the edit ahead of the bad one did NOT land');
  });

  await test('one integration, many configs, ONE version line each — not one per edit', async () => {
    await req('POST', '/panel/keys/bulk', {
      ids: ['key_4'], action: 'configFields',
      value: { edits: [
        { id: 'key_4', config: 'shorts', fields: { autoplay: 'on' } },
        { id: 'key_4', config: 'live_blog', fields: { loop: false } },
      ] },
    });
    const pub = await req('POST', '/panel/keys/key_4/publish');
    eq(pub.status, 200, 'published');
    const cs = pub.body.version.changes.filter(c => String(c.where).startsWith('Player configs'));
    eq(cs.length, 2, 'two moved fields, two lines');
    assert(cs.some(c => c.where === 'Player configs · shorts' && c.field === 'autoplay'),
      'each named where it lives');
    assert(cs.some(c => c.where === 'Player configs · live_blog' && c.field === 'loop'),
      'including the second config');
  });

  await test('an edit naming an integration outside the selection is refused', async () => {
    const r = await req('POST', '/panel/keys/bulk', {
      ids: ['key_1'], action: 'configFields',
      value: { edits: [{ id: 'key_3', config: 'shorts', fields: { autoplay: 'on' } }] },
    });
    eq(r.status, 400, 'refused');
    assert(r.body.message.includes('not one of the selected'), `said plainly (got ${r.body.message})`);
  });

  await test('an empty act is refused rather than reporting a sweep that wrote nothing', async () => {
    for (const value of [{}, { edits: [] }, { edits: [{ id: 'key_1', config: 'shorts' }] }]) {
      const r = await req('POST', '/panel/keys/bulk', { ids: ['key_1'], action: 'configFields', value });
      eq(r.status, 400, `refused: ${JSON.stringify(value)}`);
    }
  });
}
