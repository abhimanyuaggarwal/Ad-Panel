// test/cases/04-behaviour.spec.js — the draft journey, per-placement behaviour, the cut session-wide fields.
// Bodies are unchanged from the single-file suite; helpers come from ../harness.js.

export default async function run({ test, req, eq, assert, freshSetup, patchSlot, patchDrive, VALID_KEY, PLAYER_MIN }) {
  // ---------- the draft journey (new surface, both teams) ----------

  await test('a draft lives fully off; PUBLISHING is what fail-closes until demand exists', async () => {
    const draft = await req('POST', '/panel/keys', {
      name: 'TOI Android Shorts', property: 'TOI', platform: 'android',
      packageName: 'com.toi.reader',
      player: PLAYER_MIN, sections: [{ slots: {} }],
    });
    eq(draft.status, 201, 'a draft with no setup and nothing on is fine — the draft plane is free');
    const id = draft.body.key.id;
    eq(draft.body.key.live, false, 'and it is not on air');
    const nothing = await req('POST', `/panel/keys/${id}/publish`);
    eq(nothing.status, 409, 'publishing it is what is refused');
    assert(nothing.body.message.includes('every break switched off'), `named (got ${nothing.body.message})`);
    const copy = await freshSetup('as_2', 'Shorts demand'); // a shape of this test's own
    const attach = await req('PATCH', `/panel/keys/${id}`, {
      adSetupId: copy.id,
      sections: [{ slots: { preroll: { on: true } } }],
    });
    eq(attach.status, 200, 'ops attach demand; product switches on');
    const early = await req('POST', `/panel/keys/${id}/publish`);
    eq(early.status, 409, 'still refused — the demand behind it is not published either');
    assert(early.body.message.includes('publish “Shorts demand” first'), `names the other room (got ${early.body.message})`);
    eq((await req('POST', `/panel/setups/${copy.id}/publish`)).status, 200, 'ops publish the demand');
    eq((await req('POST', `/panel/keys/${id}/publish`)).status, 200, 'now the surface may go on air');
  });

  // ---------- the ad setup's behaviour (the workshop) ----------

  await test('a placement\'s behaviour is a complete spec: break positions and overlay moments', async () => {
    const noCue = await req('PATCH', '/panel/setups/as_1/sections/0/behaviour',
      { slot: 'midroll', behaviour: { cuepoints: '' } });
    eq(noCue.status, 400, 'no break positions refused');
    assert(noCue.body.errors.some(e => e.field === 'cuepoints'), 'names cuepoints');
    const noTimes = await req('PATCH', '/panel/setups/as_1/sections/0/behaviour',
      { slot: 'squeezeback', behaviour: { times: '' } });
    eq(noTimes.status, 400, 'a squeeze-back with no show time refused — it IS the overlay now');
  });

  // ---------- ACROSS THE SESSION: three fields, twelve cut (27 Aug scope audit) ----------

  await test('a placement has NO session-wide settings — Across the session is gone', async () => {
    const meta = (await req('GET', '/panel/meta')).body;
    assert(meta.placementRuleFields === undefined, 'no session field list left to serve');
    assert(meta.noFillActions === undefined, 'and its vocabulary went with it');
    assert(meta.adjacentModes === undefined, 'as the adjacent-slot one did before');
    const sec = (await req('GET', '/panel/setups/as_1')).body.setup.sections[0];
    eq(Object.keys(sec).sort().join(','), 'isDefault,name,slots', `a placement is a name and its slots (got ${Object.keys(sec).join(',')})`);
    const r = await req('PATCH', '/panel/setups/as_1/sections/0/behaviour', { rules: { anything: 1 } });
    eq(r.status, 400, 'a rules patch is refused outright');
    assert(r.body.errors.some(e => e.message.includes('every answer lives on a slot')), `named (got ${JSON.stringify(r.body.errors)})`);
  });

  await test('a cut session field is refused BY NAME, with where the answer lives now', async () => {
    const cases = [
      ['maxAdsPerSession', 'the ladder behind it is the only cap'],
      ['cooldownAfterBreak', 'the mid-roll cadence'],
      ['noFillAction', 'the content plays'],
      ['bannerTimes', 'squeeze-back'],
      ['overlayGap', 'squeeze-back'],
      ['requestTimeoutMs', 'own slot'],
      ['retries', 'waterfall is the retry'],
      ['companions', 'VAST response'],
      ['adjacentRefresh', 'display units'],
    ];
    for (const [field, says] of cases) {
      const r = await req('PATCH', '/panel/setups/as_1/sections/0/behaviour',
        { rules: { [field]: field === 'bannerTimes' ? [30] : 1 } });
      eq(r.status, 400, `${field} is refused, not quietly dropped`);
      const e = r.body.errors.find(x => x.field === field);
      assert(e, `${field} is named (got ${JSON.stringify(r.body.errors)})`);
      assert(e.message.includes(says), `${field} says where it went (got ${e.message})`);
    }
    const sec = (await req('GET', '/panel/setups/as_1')).body.setup.sections[0];
    assert(sec.rules === undefined, 'nothing was half-applied');
  });

  await test('the player is served slots and nothing else — no session block in the config', async () => {
    const k = (await req('GET', '/panel/keys/key_1')).body.key;
    const sec = (await req('GET', `/panel/live/${k.key}`)).body.sections[0];
    eq(Object.keys(sec).sort().join(','), 'name,slots',
      `a live placement is a name and its slots (got ${Object.keys(sec).join(',')})`);
    const ver = (await req('GET', '/panel/setups/as_1/versions')).body.versions.pop();
    assert(!JSON.stringify(ver).includes('maxAdsPerSession'), 'and no version carries one either');
  });

  await test('a whole-setup save carrying a cut field is refused too — every door, not just one', async () => {
    const s = (await req('GET', '/panel/setups/as_1')).body.setup;
    const sections = s.sections.map(sec => ({
      name: sec.name,
      rules: { companionPersist: true },
      slots: Object.fromEntries(Object.entries(sec.slots).map(([t, sl]) =>
        [t, { rungs: sl.rungs, behaviour: sl.behaviour }])),
    }));
    const r = await req('PATCH', '/panel/setups/as_1', { sections });
    eq(r.status, 400, 'the ops room refuses it as well');
    assert(JSON.stringify(r.body.errors).includes('Companions persist'), `named (got ${JSON.stringify(r.body.errors)})`);
  });

  await test('player edits diff field by field, and show up as unpublished work', async () => {
    const r = await req('PATCH', '/panel/keys/key_1/player', { passiveVolume: 55 });
    eq(r.status, 200, 'saved');
    assert(r.body.changes.some(c => c.field === 'passiveVolume' && c.to === 55), 'field-level diff');
    // The global activity log was CUT (27 Aug, user call) — the per-object version history
    // answers it better, and the one thing the log did uniquely nobody was reaching.
    eq((await req('GET', '/panel/activity')).status, 404, 'the log and its route are gone');
    const pend = (await req('GET', '/panel/keys/key_1/versions')).body.unpublished;
    assert(pend.some(c => c.field === 'passiveVolume'), `the save shows as unpublished work (got ${JSON.stringify(pend)})`);
    eq((await req('PATCH', '/panel/keys/key_1/sections/0/player', { passiveVolume: 60 })).status, 404,
      'the per-section player route went with the per-section player');
  });

  await test('behaviour edits diff field by field, and say WHERE in the pending list', async () => {
    const r = await req('PATCH', '/panel/setups/as_1/sections/0/behaviour',
      { slot: 'preroll', behaviour: { podAds: 2 } });
    eq(r.status, 200, 'saved');
    assert(r.body.changes.some(c => c.field === 'podAds' && c.from === 1 && c.to === 2), 'field-level diff');
    assert(!r.body.warnings.some(w => w.includes('picks this up')), 'a save reaches no traffic, so it claims none');
    const pend = (await req('GET', '/panel/setups/as_1/versions')).body.unpublished;
    const mine = pend.find(c => c.field === 'podAds');
    assert(mine && ['Default · Pre-roll', 'Default · pre-roll'].includes(mine.where), `placed by placement and slot, in the screen's own words (got ${JSON.stringify(pend)})`);
  });

  await test('two placements hold different behaviour, slot by slot, independently', async () => {
    const s0 = (await req('GET', '/panel/setups/as_5')).body.setup;
    eq(s0.sections[0].slots.preroll.behaviour.start, 'start', 'Default plays at start');
    eq(s0.sections[1].slots.preroll.behaviour.start, 'deferred', 'the live blog defers');
    await req('PATCH', '/panel/setups/as_5/sections/1/behaviour', { slot: 'midroll', behaviour: { podAds: 3 } });
    const s = (await req('GET', '/panel/setups/as_5')).body.setup;
    eq(s.sections[1].slots.midroll.behaviour.podAds, 3, 'the live blog pods');
    eq(s.sections[0].slots.midroll.behaviour.podAds, 1, 'Default still plays one ad a break');
  });

  await test('a trimmed player field is refused, not silently kept', async () => {
    const r = await req('PATCH', '/panel/keys/key_1/player', { autoplay: 'sideways' });
    eq(r.status, 400, 'a bad value is still refused by name');
    const ok = await req('PATCH', '/panel/keys/key_1/player', { controls: 'none' });
    eq(ok.status, 200, 'an unknown field is simply not part of the player any more');
    eq(ok.body.changes.length, 0, 'so it changes nothing');
    eq((await req('GET', '/panel/keys/key_1')).body.key.player.controls, undefined, 'and never lands');
  });

  await test('every slot carries its fill fields, defaulting to today\'s behaviour', async () => {
    const secs = (await req('GET', '/panel/setups/as_1')).body.setup.sections[0].slots;
    for (const t of ['preroll', 'midroll', 'postroll']) {
      const b = secs[t].behaviour;
      eq(b.podAds, 1, `${t} plays one ad`);
      eq(b.nextAd, 'top', `${t} first choice gets every slot by default`);
      eq(b.podBanner, undefined, `${t} carries no banner position — cut 8 Sep`);
      eq(b.fillTimeoutSec, 20, `${t} gives up asking at 20s`);
      eq(b.breakSec, undefined, `${t} carries no budget — cut 31 Aug`);
      eq(b.walkDepth, undefined, `${t} carries no ops depth — cut 31 Aug`);
    }
    // The prefixes are GONE: a slot's behaviour holds only what that slot can have.
    eq(secs.preroll.behaviour.cuepoints, undefined, 'a pre-roll has no break positions');
    eq(secs.midroll.behaviour.start, undefined, 'a mid-roll has no start choice');
    eq(secs.outstream.behaviour.podAds, undefined, 'a rotation has no pod');
    eq(secs.outstream.behaviour.hold, 20, 'it has a hold instead');
  });

  await test('every fill answer is the SLOT\'s — pre-roll and mid-roll hold different configs', async () => {
    const pre = await req('PATCH', '/panel/setups/as_1/sections/0/behaviour',
      { slot: 'preroll', behaviour: { podAds: 2, fillTimeoutSec: 8 } });
    eq(pre.status, 200, 'saved');
    const mid = await req('PATCH', '/panel/setups/as_1/sections/0/behaviour',
      { slot: 'midroll', behaviour: { podAds: 3, fillTimeoutSec: 40, nextAd: 'next' } });
    eq(mid.status, 200, 'saved');
    const s = (await req('GET', '/panel/setups/as_1')).body.setup.sections[0].slots;
    eq(s.preroll.behaviour.fillTimeoutSec, 8, 'pre-roll gives up at 8s');
    eq(s.midroll.behaviour.fillTimeoutSec, 40, 'mid-roll keeps its 40s');
    eq(s.midroll.behaviour.nextAd, 'next', 'mid-roll walks down');
    eq(s.preroll.behaviour.nextAd, 'top', 'pre-roll untouched — still from the top');
  });

  await test('`Display ad position` is gone — a payload still carrying it is refused by name', async () => {
    const r = await req('PATCH', '/panel/setups/as_1/sections/0/behaviour',
      { slot: 'midroll', behaviour: { podBanner: 'any' } });
    eq(r.status, 400, 'the cut field is refused, never silently dropped');
    const e = r.body.errors.find(x => x.field === 'podBanner');
    assert(e, 'names the field');
    assert(e.message.includes('Display ad position'), 'names it in the words the screen used');
    assert(e.message.includes('Ad placement'), 'says where the answer lives now');
  });

  await test('`Hide during in-stream` is gone, and the out-stream aims at a typed total', async () => {
    const dead = await req('PATCH', '/panel/setups/as_1/sections/0/behaviour',
      { slot: 'outstream', behaviour: { hideOnInStream: false } });
    eq(dead.status, 400, 'the cut switch is refused, never silently dropped');
    const e = dead.body.errors.find(x => x.field === 'hideOnInStream');
    assert(e, 'names the field');
    assert(e.message.includes('Hide during in-stream'), 'in the words the screen used');
    assert(e.message.includes('owns the screen'), 'and says why there is nothing to decide');
    // Total Target Impressions: the breaks' own words, typed here because a rotation
    // runs all session where a break picks from 1/2/3.
    const ok = await req('PATCH', '/panel/setups/as_1/sections/0/behaviour',
      { slot: 'outstream', behaviour: { perSession: 12 } });
    eq(ok.status, 200, 'a typed count saves');
    const b = (await req('GET', '/panel/setups/as_1')).body.setup.sections[0].slots.outstream.behaviour;
    eq(b.perSession, 12, 'and is what the slot aims for');
    const over = await req('PATCH', '/panel/setups/as_1/sections/0/behaviour',
      { slot: 'outstream', behaviour: { perSession: 99 } });
    eq(over.status, 400, 'past the ceiling it is refused');
    const oe = over.body.errors.find(x => x.field === 'perSession');
    assert(oe && oe.message.includes('total target impressions'), 'named in the screen\'s words');
    assert(oe.message.includes('20'), 'next to the number allowed');
  });

  await test('pod bounds are refused by name', async () => {
    const four = await req('PATCH', '/panel/setups/as_1/sections/0/behaviour',
      { slot: 'midroll', behaviour: { podAds: 4 } });
    eq(four.status, 400, 'four ads in a row refused');
    assert(four.body.errors.some(e => e.field === 'podAds'), 'names the field');
    const walk = await req('PATCH', '/panel/setups/as_1/sections/0/behaviour',
      { slot: 'midroll', behaviour: { nextAd: 'sideways' } });
    eq(walk.status, 400, 'an unknown fill order refused');
    assert(walk.body.errors.some(e => e.message.includes('top')), 'refusal names the allowed values');
  });

  await test('pod warnings stay counted on the slot that causes them', async () => {
    // The session-cap arithmetic went with Across-the-session (27 Aug); the per-slot
    // warnings that never needed it are untouched.
    const cad = await req('PATCH', '/panel/setups/as_1/sections/0/behaviour',
      { slot: 'midroll', behaviour: { podAds: 3, mode: 'interval', every: 480 } });
    assert(cad.body.warnings.some(w => w.includes('an ad every 160s')), `multiplied cadence (got ${JSON.stringify(cad.body.warnings)})`);
  });

  await test('player fields are validated inline too', async () => {
    const r = await req('PATCH', '/panel/keys/key_1/player', { playbackMode: 'inline_redirect' });
    eq(r.status, 400, 'redirect mode without a URL refused');
    assert(r.body.errors.some(e => e.field === 'redirectUrl'), 'names the field');
    const ok = await req('PATCH', '/panel/keys/key_1/player', { playbackMode: 'inline_redirect', redirectUrl: 'https://toi.example/watch' });
    eq(ok.status, 200, 'saved with one');
    assert(ok.body.changes.some(c => c.field === 'redirectUrl'), 'field-level diff');
  });
}
