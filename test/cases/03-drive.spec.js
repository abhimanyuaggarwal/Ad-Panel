// test/cases/03-drive.spec.js — THE DRIVE: partner order, tries, start, ads in a row; fail closed on the walk.
// Bodies are unchanged from the single-file suite; helpers come from ../harness.js.

export default async function run({ test, req, eq, assert, freshSetup, patchSlot, patchDrive, VALID_KEY, PLAYER_MIN }) {
  // ---------- THE DRIVE: the ad partners, in the order they are asked ----------

  await test('one partner on, the rest off: the walk narrows, every section, setup untouched', async () => {
    const r = await patchDrive('key_1', 'preroll', { ask: ['ima'] });
    eq(r.status, 200, 'saved');
    const k = (await req('GET', '/panel/keys/key_1')).body.key;
    eq(k.drive.preroll.ask.join(','), 'ima', 'the decision is stored as intent — an ordered list');
    eq(k.sections[0].slots.preroll.rungCount, 6, 'Default walks its six IMA rungs');
    assert(k.sections[0].slots.preroll.walk.every(x => x.provider === 'ima'), 'nobody else is asked');
    eq(k.sections[1].slots.preroll.rungCount, 2, 'Shorts feed walks its own two — one decision, every section');
    const s = (await req('GET', '/panel/setups/as_1')).body.setup;
    eq(s.sections[0].slots.preroll.rungView.filter(x => x.on).length, 8, 'the setup never moved');
  });

  // TIERS (31 Aug, AD-JSON-SCOPE): the PRIMARY is a position, not a preference — the ask
  // orders the FALLBACK only, which is the one ordered thing left.
  await test('dragging a partner to the front reorders the FALLBACK — the primary is never displaced', async () => {
    const r = await patchDrive('key_1', 'preroll', { ask: ['gpt', 'ima', 'can'] });
    eq(r.status, 200, 'saved');
    const pre = (await req('GET', '/panel/keys/key_1')).body.key.sections[0].slots.preroll;
    eq(pre.rungCount, 8, 'nothing is dropped — GPT is simply asked first among the fallbacks');
    eq(pre.walk[0].provider, 'ima', 'the primary keeps its seat — a position, not a preference');
    eq(pre.walk[1].provider, 'gpt', 'then the first fallback ask');
    eq(pre.walk[pre.walk.length - 1].provider, 'can', 'and CAN last');
  });

  await test('the order is the whole fallback decision — the same three chips, rearranged', async () => {
    await patchDrive('key_1', 'preroll', { ask: ['can', 'gpt', 'ima'] });
    const w = (await req('GET', '/panel/keys/key_1')).body.key.sections[0].slots.preroll.walk;
    eq(w[0].provider, 'ima', 'the primary first, always');
    eq(w[1].provider, 'can', 'then CAN, as the list says');
    eq(w[2].provider, 'gpt', 'then GPT');
    // …and two rungs of the same partner keep the order ad ops gave them.
    const imas = w.slice(1).filter(x => x.provider === 'ima').map(x => x.label);
    const setupImas = (await req('GET', '/panel/setups/as_1')).body.setup
      .sections[0].slots.preroll.rungView.slice(1).filter(x => x.on && x.provider === 'ima').map(x => x.label);
    eq(imas.join('|'), setupImas.join('|'), 'inside one partner, the setup\'s own order survives');
  });

  await test('the decision is INTENT: an ops ladder edit lands and the decision still means itself', async () => {
    await patchDrive('key_1', 'preroll', { ask: ['gpt', 'ima', 'can'], tries: 3 });
    // Ops change the pace — an unrelated edit.
    const setup = (await req('GET', '/panel/setups/as_1')).body.setup;
    const ops = await req('PATCH', '/panel/setups/as_1/sections/0/behaviour',
      { slot: 'preroll', behaviour: { ...setup.sections[0].slots.preroll.behaviour, tagTimeoutMs: 2000 } });
    eq(ops.status, 200, 'ops changed the pace');
    const pre = (await req('GET', '/panel/keys/key_1')).body.key.sections[0].slots.preroll;
    eq(pre.behaviour.tagTimeoutMs, 2000, 'the surface took the ops change');
    eq(pre.walk[1].provider, 'gpt', 'and still asks GPT first after the primary');
    eq(pre.rungCount, 3, 'and still stops after three tries');
  });

  await test('a decision no section can honour refuses the save that makes it, by name', async () => {
    const r = await patchDrive('key_7', 'preroll', { ask: ['gpt'] }); // NBT MiniTV: IMA only
    eq(r.status, 400, 'refused');
    assert(r.body.errors.some(e => e.message.includes('asks GPT and “NBT MiniTV demand” carries none there')),
      `named, with the way out (got ${JSON.stringify(r.body.errors)})`);
    const none = await patchDrive('key_1', 'preroll', { ask: [] });
    eq(none.status, 400, 'switching every partner off is refused too');
    assert(none.body.errors.some(e => e.message.includes('would ask nobody')), 'named');
  });

  await test('a decision SOME sections cannot honour falls back there — warned by section name', async () => {
    const r = await patchDrive('key_6', 'preroll', { ask: ['gpt'] }); // GPT sits in Live blog only
    eq(r.status, 200, 'saved — Live blog can honour it');
    assert(r.body.warnings.some(w => w.includes('Default: no GPT in the pre-roll')),
      `the miss is named (got ${JSON.stringify(r.body.warnings)})`);
    const k = (await req('GET', '/panel/keys/key_6')).body.key;
    // Default's pre-roll is primary-only: the decision has no fallback to bite on, so the
    // walk is the same either way. Named at the save (above) — QUIET as a standing fact
    // (1 Sep, groups walkthrough: 'fell back' means the walk diverges, and here it cannot).
    eq(k.sections[0].slots.preroll.fellBack, false, 'no divergence — nothing to flag on the standing views');
    eq(k.sections[0].slots.preroll.rungCount, 1, 'and keeps serving — never dark until noticed');
    eq(k.sections[1].slots.preroll.walk[0].provider, 'ima', 'the live blog keeps its primary — a position');
    eq(k.sections[1].slots.preroll.walk[1].provider, 'gpt', 'and honours the decision in its fallback');
  });

  await test('ops stranding a decision warns at the moment of harm, and the break falls back', async () => {
    await patchDrive('key_2', 'preroll', { ask: ['gpt'] }); // as_2 pre-roll: IMA + one GPT display
    const s = (await req('GET', '/panel/setups/as_2')).body.setup;
    const imaOnly = s.sections[0].slots.preroll.rungs.filter((r, i) => i === 0);
    const ops = await req('PATCH', '/panel/setups/as_2', { slots: { preroll: { rungs: imaOnly } } });
    eq(ops.status, 200, 'the removal itself is fine — the break still fills');
    assert(ops.body.warnings.some(w => w.includes('asks GPT') && w.includes('falls back')),
      `ops are told whose decision this strands (got ${JSON.stringify(ops.body.warnings)})`);
    const pre = (await req('GET', '/panel/keys/key_2')).body.key.sections[0].slots.preroll;
    // The stranding left a primary-only ladder: the walk cannot diverge any more, so the
    // standing fact is quiet (1 Sep) — the saves are where the stranding keeps being said.
    eq(pre.fellBack, false, 'primary-only after the strand — no divergence to flag');
    eq(pre.walk[0].provider, 'ima', 'serving the setup\'s own arrangement, not nothing');
    // An unrelated later save of the stranded key warns — it does not block.
    const later = await req('PATCH', '/panel/keys/key_2', { domains: ['m.timesofindia.com', 'timesofindia.com'] });
    eq(later.status, 200, 'an unrelated edit still lands');
    assert(later.body.warnings.some(w => w.includes('no GPT')), 'carrying the fallback warning');
  });

  // THE PRE-ROLL SECONDS ARE THE SURFACE'S NOW (27 Aug, reversing 26 Aug's "seconds stay
  // ops'"): a surface allowed to defer its pre-roll may as well say by how long.
  await test('a surface sets its own pre-roll delay, not just deferred-or-not', async () => {
    const base = (await req('GET', '/panel/setups/as_2')).body.setup.sections[0].slots.preroll.behaviour;
    eq(base.deferSec, 7, 'the setup says 7');
    const r = await patchDrive('key_2', 'preroll', { start: 'deferred', deferSec: 12 });
    eq(r.status, 200, 'the surface says 12');
    const pre = (await req('GET', '/panel/keys/key_2')).body.key.sections[0].slots.preroll;
    eq(pre.behaviour.deferSec, 12, 'and that is what it runs');
    assert(pre.behaviourDrive.includes('deferSec'), 'marked as the surface\'s own, not the setup\'s');
    eq((await req('GET', '/panel/setups/as_2')).body.setup.sections[0].slots.preroll.behaviour.deferSec, 7,
      'the ad setup never moved');
    const daft = await patchDrive('key_2', 'preroll', { deferSec: 900 });
    eq(daft.status, 400, 'out of bounds is refused by name');
    const back = await req('PATCH', '/panel/keys/key_2', { drive: {} });
    eq(back.status, 200, 'and dropping it follows the setup again');
    eq((await req('GET', '/panel/keys/key_2')).body.key.sections[0].slots.preroll.behaviour.deferSec, 7, 'back to 7');
  });

  await test('the player is served the surface\'s partner order and its own seconds', async () => {
    await patchDrive('key_1', 'preroll', { ask: ['can', 'ima'], start: 'deferred', deferSec: 4 });
    eq((await req('POST', '/panel/keys/key_1/publish')).status, 200, 'published');
    const apiKey = (await req('GET', '/panel/keys/key_1')).body.key.key;
    const live = (await req('GET', `/panel/live/${apiKey}`)).body.sections[0].slots.preroll;
    eq(live.walk[0].provider, 'ima', 'the primary leads — a position, not a preference');
    eq(live.walk[1].provider, 'can', 'then CAN, first among the fallbacks as the chips say');
    assert(live.walk.every(x => x.provider === 'can' || x.provider === 'ima'), 'and GPT is not asked at all');
    eq(live.behaviour.deferSec, 4, 'with the surface\'s own four seconds');
    await req('PATCH', '/panel/keys/key_1', { drive: {} });
    await req('POST', '/panel/keys/key_1/publish');
  });

  await test('clearing the decision goes back to the setup\'s arrangement — nothing frozen', async () => {
    await patchDrive('key_1', 'preroll', { ask: ['ima'], tries: 2 });
    const r = await req('PATCH', '/panel/keys/key_1', { drive: {} });
    eq(r.status, 200, 'cleared');
    const k = (await req('GET', '/panel/keys/key_1')).body.key;
    eq(k.drive, null, 'no decision left');
    eq(k.sections[0].slots.preroll.rungCount, 8, 'back to the setup\'s full walk');
  });

  // ---------- THE DRIVE: how deep each partner goes (16 Sep, user call) ----------
  // `depth` is a map, partner → the most of THAT partner's own sources this break tries.
  // key_1's Default pre-roll walks IMA(primary), CAN, GPT, then five more IMA.

  await test('a cap cuts ONE partner\u2019s own sources and nobody else\u2019s', async () => {
    const r = await patchDrive('key_1', 'preroll', { depth: { ima: 2 } });
    eq(r.status, 200, 'saved');
    const k = (await req('GET', '/panel/keys/key_1')).body.key;
    eq(k.drive.preroll.depth, { ima: 2 }, 'stored sparse — only the partner that was capped');
    const w = k.sections[0].slots.preroll.walk;
    eq(w.map(x => x.provider), ['ima', 'can', 'gpt', 'ima'], 'two IMA tried, CAN and GPT untouched');
    eq(k.sections[0].slots.preroll.rungCountConfigured, 10, 'the ladder itself never moved');
  });

  await test('the PRIMARY survives every cap — a position is never cut by a preference', async () => {
    await patchDrive('key_1', 'preroll', { depth: { ima: 1 } });
    const w = (await req('GET', '/panel/keys/key_1')).body.key.sections[0].slots.preroll.walk;
    eq(w[0].provider, 'ima', 'the primary keeps its seat, though IMA is capped at one');
    eq(w.map(x => x.provider), ['ima', 'can', 'gpt'], 'and its own tail is what the cap took');
  });

  await test('caps ride the order: rearranged first, then each partner walked its own depth', async () => {
    await patchDrive('key_1', 'preroll', { ask: ['gpt', 'ima', 'can'], depth: { ima: 3 } });
    const w = (await req('GET', '/panel/keys/key_1')).body.key.sections[0].slots.preroll.walk;
    eq(w.map(x => x.provider), ['ima', 'gpt', 'ima', 'ima', 'can'],
      'GPT first among the fallbacks, IMA three deep in all, CAN last');
  });

  await test('one decision, every section — and a partner left out is walked all the way down', async () => {
    await patchDrive('key_1', 'preroll', { depth: { ima: 1 } });
    const k = (await req('GET', '/panel/keys/key_1')).body.key;
    eq(k.sections[0].slots.preroll.rungCount, 3, 'Default: one IMA, then CAN and GPT in full');
    // Shorts feed walks IMA, CAN, GPT, CAN, IMA — one IMA left, both CANs and the GPT.
    eq(k.sections[1].slots.preroll.walk.map(x => x.provider), ['ima', 'can', 'gpt', 'can'],
      'Shorts feed answers the same decision on its OWN ladder — the cap is intent, not a number of rungs');
  });

  await test('a cap of ZERO is refused by name — that decision is the waterfall order\u2019s', async () => {
    const zero = await patchDrive('key_1', 'preroll', { depth: { ima: 0 } });
    eq(zero.status, 400, 'refused, never stored as a second way to switch a partner off');
    assert(zero.body.errors.some(e => e.message.includes('switched off')),
      `says where that decision lives (got ${JSON.stringify(zero.body.errors)})`);
    const bad = await patchDrive('key_1', 'preroll', { depth: { acme: 2 } });
    eq(bad.status, 400, 'an unknown partner refused');
    assert(bad.body.errors.some(e => e.message.includes('is not an ad partner')), 'named, with the list');
    const deep = await patchDrive('key_1', 'preroll', { depth: { ima: 44 } });
    eq(deep.status, 400, 'and the bound holds');
    assert(deep.body.errors.some(e => e.message.includes('between 1 and 10')), 'with the numbers');
  });

  await test('`setup` clears the caps — the break follows its ad setup again', async () => {
    await patchDrive('key_1', 'preroll', { depth: { ima: 2 } });
    const r = await req('PATCH', '/panel/keys/key_1', { drive: { preroll: { depth: 'setup' } } });
    eq(r.status, 200, 'cleared');
    const k = (await req('GET', '/panel/keys/key_1')).body.key;
    eq(k.drive?.preroll?.depth, undefined, 'absence is how the drive says "follow the setup"');
    eq(k.sections[0].slots.preroll.rungCount, 8, 'the whole ladder again');
  });

  await test('a cohort caps every partner in one act, and the player is handed the cut walk', async () => {
    const r = await req('POST', '/panel/keys/bulk',
      { ids: ['key_1'], action: 'driveFields', value: { slot: 'preroll', fields: { depth: { ima: 2 } } } });
    eq(r.status, 200, 'the cohort write lands');
    const k = (await req('GET', '/panel/keys/key_1')).body.key;
    eq(k.drive.preroll.depth, { ima: 2 }, 'written to the integration\'s own drive');
    eq(k.sections[0].slots.preroll.rungCount, 4, 'and the counted walk is the capped one');
    await req('POST', '/panel/keys/key_1/publish');
    const live = (await req('GET', `/panel/live/${k.key}`)).body;
    eq(live.sections[0].slots.preroll.walk.map(x => x.provider), ['ima', 'can', 'gpt', 'ima'],
      'the player is handed the CUT walk — the number on screen is the number that serves');
  });

  // ---------- THE DRIVE: tries, start, ads in a row ----------

  await test('tries is a COUNT of real tries — it stops the walk, every section, sparse', async () => {
    const r = await patchDrive('key_1', 'preroll', { tries: 3 });
    eq(r.status, 200, 'saved');
    const k = (await req('GET', '/panel/keys/key_1')).body.key;
    eq(k.sections[0].slots.preroll.rungCount, 3, 'three tries on Default');
    eq(k.sections[1].slots.preroll.rungCount, 3, 'three on Shorts feed — one decision');
    eq(k.sections[0].slots.preroll.rungCountConfigured, 10, 'the ladder itself never moved');
  });

  await test('tries is the ONE depth cut left — the ops-side walkDepth is refused by name', async () => {
    // Surface: five tries over the ten-rung ladder = five live rungs walked.
    await patchDrive('key_1', 'preroll', { tries: 5 });
    eq((await req('GET', '/panel/keys/key_1')).body.key.sections[0].slots.preroll.rungCount, 5,
      'five real tries — a count');
    await req('PATCH', '/panel/keys/key_1', { drive: {} });
    // The ops-side positional depth was CUT 31 Aug (user call) — one concept, one control:
    // how deep a walk goes is the surface's Waterfall depth, in Ad delivery.
    const ops = await req('PATCH', '/panel/setups/as_1/sections/0/behaviour',
      { slot: 'preroll', behaviour: { walkDepth: 5 } });
    eq(ops.status, 400, 'refused, not quietly dropped');
    assert(ops.body.errors.some(e => e.message.includes('Waterfall depth, in Ad delivery')),
      `says where the answer lives now (got ${JSON.stringify(ops.body.errors)})`);
  });

  await test('the pre-roll start and ads-in-a-row ride the drive; the seconds stay ops\'', async () => {
    const r = await patchDrive('key_1', 'preroll', { start: 'deferred', podAds: 2 });
    eq(r.status, 200, 'saved');
    const pre = (await req('GET', '/panel/keys/key_1')).body.key.sections[0].slots.preroll;
    eq(pre.behaviour.start, 'deferred', 'this surface defers');
    eq(pre.behaviour.deferSec, 7, 'by the setup\'s own seconds — the number is the workshop\'s');
    eq(pre.behaviour.podAds, 2, 'two ads a break');
    eq(pre.behaviourDrive.sort(), ['podAds', 'start'], 'exactly what the decision set, named');
    const s = (await req('GET', '/panel/setups/as_1')).body.setup;
    eq(s.sections[0].slots.preroll.behaviour.start, 'start', 'the setup never moved');
  });

  await test('drive values are held to bounds, by name; deeper fields are the setup\'s', async () => {
    eq((await patchDrive('key_1', 'preroll', { podAds: 4 })).status, 400, 'four ads in a row refused');
    const tries = await patchDrive('key_1', 'preroll', { tries: 44 });
    eq(tries.status, 400, 'forty-four tries refused');
    assert(tries.body.errors.some(e => e.message.includes('between 1 and 10')), 'with the bounds');
    eq((await patchDrive('key_1', 'preroll', { ask: ['acme'] })).status, 400, 'an unknown partner refused');
    const deep = await patchDrive('key_1', 'preroll', { tagTimeoutMs: 2000 });
    eq(deep.status, 400, 'the per-try wait is not a driving control');
    assert(deep.body.errors.some(e => e.message.includes('arranged in the ad setup')), 'says where it lives');
  });

  await test('the squeeze-back slot is GONE — a payload still carrying it is refused by name', async () => {
    const drv = await patchDrive('key_2', 'squeezeback', { tries: 1 });
    eq(drv.status, 400, 'not a break any more');
    assert(drv.body.errors.some(e => e.message.includes('is not a break')), 'named');
    const k = (await req('GET', '/panel/keys/key_2')).body.key;
    const sections = k.sections.map(x => ({ name: x.name,
      slots: Object.fromEntries(Object.entries(x.slots).map(([t, sl]) => [t, { on: sl.on }])) }));
    sections[0].slots.squeezeback = { on: true };
    const sec = await req('PATCH', '/panel/keys/key_2', { sections });
    eq(sec.status, 400, 'a section carrying the dead slot is refused');
    assert(sec.body.errors.some(e => e.message.includes('the squeeze-back slot is gone')),
      `with where its two jobs went (got ${JSON.stringify(sec.body.errors)})`);
    const ops = await req('PATCH', '/panel/setups/as_2', { slots: { squeezeback: { rungs: [{ type: 'tag', tagId: 'tag_20' }] } } });
    eq(ops.status, 400, 'the ops room refuses it too');
  });

  await test('ops see the surface\'s decision on the slot — nobody debugs a ghost', async () => {
    await patchDrive('key_1', 'preroll', { ask: ['gpt', 'ima', 'can'], tries: 3 });
    const s = (await req('GET', '/panel/setups/as_1')).body.setup;
    const d = s.sections[0].slots.preroll.drive;
    eq(d.keyName, 'TOI Mweb VideoShow', 'whose decision');
    eq(d.ask.join(' › '), 'gpt › ima › can', 'what it asks, in order');
    eq(d.tries, 3, 'and how far it walks');
    eq(s.sections[0].slots.midroll.drive, null, 'a break with no decision says so');
  });

  await test('the counted wait follows the drive: fewer tries, shorter worst case', async () => {
    // key_6's Live blog walks 6 rungs × 1500ms = a 9s wait — warned on save.
    const slow = await patchSlot('key_6', 0, 'midroll', { on: true }); // any save re-counts
    assert((slow.body.warnings || []).some(w => w.includes('Live blog pre-roll: up to 9s')),
      `counted from what really walks (got ${JSON.stringify(slow.body.warnings)})`);
    const fast = await patchDrive('key_6', 'preroll', { tries: 3 });
    eq(fast.status, 200, 'saved');
    assert(!(fast.body.warnings || []).some(w => /Live blog pre-?roll/.test(w)),
      'three tries clears the warning — the number that warns is the number that serves');
  });

  // ---------- fail closed on the walk ----------

  await test('fail closed: a live break whose whole ladder is ops-dead is refused, named', async () => {
    const copy = await freshSetup('as_6', 'MiniTV dead copy');
    const rungs = copy.sections[0].slots.preroll.rungs.map(r => ({ ...r, on: false }));
    const dead = await req('PATCH', `/panel/setups/${copy.id}`, { slots: { preroll: { rungs } } });
    eq(dead.status, 200, 'nothing attached — ops may stage a dark ladder');
    const r = await req('POST', '/panel/keys', {
      ...VALID_KEY(), adSetupId: copy.id, status: 'active',
      sections: [{ slots: { preroll: { on: true }, midroll: { on: true } } }],
    });
    eq(r.status, 400, 'refused');
    assert(r.body.errors.some(e => e.message.includes('off by ad ops')),
      `names what did it (got ${JSON.stringify(r.body.errors)})`);
  });

  await test('the cut fields are refused by name from every door — never quietly dropped', async () => {
    for (const [f, v, says] of [['breakSec', 30, 'target impressions count'],
      ['overrun', 'strict', 'target impressions count'],
      ['walkDepth', 4, 'Waterfall depth, in Ad delivery']]) {
      const r = await req('PATCH', '/panel/setups/as_1/sections/0/behaviour',
        { slot: 'preroll', behaviour: { [f]: v } });
      eq(r.status, 400, `${f} refused`);
      assert(r.body.errors.some(e => e.message.includes(says)),
        `${f} says where the answer lives (got ${JSON.stringify(r.body.errors)})`);
    }
    // …and through the whole-setup door too.
    const s = (await req('GET', '/panel/setups/as_1')).body.setup;
    const r2 = await req('PATCH', '/panel/setups/as_1',
      { slots: { preroll: { behaviour: { ...s.sections[0].slots.preroll.behaviour, overrun: 'play' } } } });
    eq(r2.status, 400, 'every door, not just one');
  });
}
