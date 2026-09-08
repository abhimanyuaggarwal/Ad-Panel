// test/cases/02-two-rooms.spec.js — the model: two rooms, one setup per integration, the seam in both directions, dead local overrides.
// Bodies are unchanged from the single-file suite; helpers come from ../harness.js.

export default async function run({ test, req, eq, assert, freshSetup, patchSlot, patchDrive, VALID_KEY, PLAYER_MIN }) {
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

  // ---------- one setup per integration, many integrations per setup ----------

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

  // 8 Sep, user call ("allow the ad setup to be configured in multiple integrations"):
  // the 26 Aug promise ran one setup ↔ one integration and refused a second holder by
  // name. Shared demand is the real case — the same ladder across mweb, desktop and app
  // — and copies of it drift the first time anyone tunes one. So the link is legal, and
  // what stands in its place is COUNTING: every holder named, everywhere it matters.
  await test('an ad setup can fill several integrations — the link is allowed, and every holder is counted', async () => {
    const shared = await freshSetup('as_2', 'Shared network demand');
    const born = async (name, domain) => {
      const r = await req('POST', '/panel/keys', {
        ...VALID_KEY(), name, domains: [domain], adSetupId: shared.id, sections: [{ slots: {} }],
      });
      eq(r.status, 201, `${name} maps it`);
      eq(r.body.key.setupName, 'Shared network demand', 'the very setup, not a photocopy of it');
      return r.body.key;
    };
    const a = await born('Shared surface A', 'a.timesofindia.com');
    const b = await born('Shared surface B', 'b.timesofindia.com');
    const s2 = (await req('GET', `/panel/setups/${shared.id}`)).body.setup;
    eq(s2.usedBy, 2, 'two integrations ask from it');
    eq([...s2.usedByNames].sort(), ['Shared surface A', 'Shared surface B'], 'both named');
    // One ladder, edited once, standing under both — the reason sharing exists.
    const rungs = [...s2.sections[0].slots.preroll.rungs, { type: 'tag', tagId: 'tag_15' }];
    eq((await req('PATCH', `/panel/setups/${shared.id}`, { slots: { preroll: { rungs } } })).status, 200, 'one edit');
    for (const k of [a, b]) {
      eq((await req('GET', `/panel/keys/${k.id}`)).body.key.sections[0].slots.preroll.rungCount,
        rungs.length, `${k.name} walks the longer ladder — no republish of its own`);
    }
    const del = await req('DELETE', `/panel/setups/${shared.id}`);
    eq(del.status, 409, 'and it cannot be deleted out from under them');
    eq([...del.body.usedBy].sort(), ['Shared surface A', 'Shared surface B'], 'both named in the refusal');
    for (const k of [a, b]) await req('DELETE', `/panel/keys/${k.id}`);
    eq((await req('DELETE', `/panel/setups/${shared.id}`)).status, 200, 'it goes once nobody asks from it');
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
    eq(draft.status, 201, 'and it attaches like any other setup');
  });

  await test('duplicating an integration copies its setup too — an experiment must not move the original\'s demand', async () => {
    const r = await req('POST', '/panel/keys/key_1/duplicate');
    eq(r.status, 201, 'created');
    const copy = r.body.key;
    eq(copy.live, false, 'a copy has no version history, so it cannot serve until someone publishes it');
    eq(copy.setupName, 'TOI Mweb VideoShow copy demand', 'its own setup, photocopied');
    const as1 = (await req('GET', '/panel/setups/as_1')).body.setup;
    eq(as1.usedBy, 1, 'the original keeps the holder it had — the duplicate got its own');
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
    assert(r.body.errors.some(e => e.message.includes('“NBT VideoShow demand” carries no post-roll demand')),
      `the refusal names the setup (got ${JSON.stringify(r.body.errors)})`);
    eq(k.sections[0].slots.postroll.on, false, 'and it stays off');
  });

  await test('re-attaching runs the same check: a setup lacking demand for an on slot is refused', async () => {
    const copy = await freshSetup('as_2', 'ArticleShow shape copy'); // no mid-roll demand
    const r = await req('PATCH', '/panel/keys/key_4', { adSetupId: copy.id }); // key_4 runs mid-roll
    eq(r.status, 400, 'refused — the ArticleShow shape has no mid-roll');
    assert(r.body.errors.some(e => e.message.includes('carries no mid-roll demand')), 'named');
  });

  await test('ops side: a setup a live section feeds on cannot be emptied — it is named', async () => {
    const r = await req('PATCH', '/panel/setups/as_5', { slots: { midroll: { rungs: [] } } });
    eq(r.status, 409, 'refused');
    assert(/mid-roll would go dark/.test(r.body.message) && r.body.message.includes('plays it live'), `named refusal in the UI's words (got ${r.body.message})`);
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
}
