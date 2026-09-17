// test/cases/09-player-json.spec.js — THE PLAYER'S JSON: direct tiers, pods, banner facts, out-stream, templates, pacing.
// Bodies are unchanged from the single-file suite; helpers come from ../harness.js.

export default async function run({ test, req, eq, assert, freshSetup, patchSlot, patchDrive, VALID_KEY, PLAYER_MIN }) {
  // ---------- THE PLAYER'S JSON (31 Aug, AD-JSON-SCOPE) ----------
  // Direct above everything · mid-roll break groups · banner facts on the rung ·
  // out-stream · the break's giving-up point · request templates · playback timing.

  await test('DIRECT is each break\'s own deal — ONE, tried before its primary, uncapped', async () => {
    const s = (await req('GET', '/panel/setups/as_1')).body.setup;
    const d = s.sections[0].slots.preroll.direct;
    eq(d.rungCount, 1, 'the pre-roll carries its direct deal');
    eq(d.maxSession, undefined, 'and no session cap — the deal is tried each break');
    eq(s.sections[0].slots.midroll.direct.rungCount, 0, 'the mid-roll\'s own tier is its own — empty here');
    eq(s.sections[0].slots.outstream.direct, null, 'a rotation is not a break — no tier at all');
    // The product room sees the counted fact on the break, never an editor.
    const k = (await req('GET', '/panel/keys/key_1')).body.key;
    eq(k.sections[0].slots.preroll.direct.rungCount, 1, 'the integration sees the deal on the break');
    eq(k.sections[0].slots.midroll.direct, null, 'and nothing where there are no deals');
    // The player is handed the deal inside the break — and tries never cut it.
    await patchDrive('key_1', 'preroll', { tries: 1 });
    await req('POST', '/panel/keys/key_1/publish');
    const live = (await req('GET', `/panel/live/${k.key}`)).body;
    const pre = live.sections[0].slots.preroll;
    eq(pre.direct.walk.length, 1, 'one try on the surface never cuts the direct deal');
    eq(pre.direct.maxSession, undefined, 'no cap rides the wire');
    eq(pre.walk.length, 1, 'while the break itself stops after one');
    // The old global list is refused by name.
    const oldDoor = await req('PATCH', '/panel/setups/as_1', { direct: { maxSession: 3 } });
    eq(oldDoor.status, 400, 'the global door is gone');
    assert(oldDoor.body.errors.some(e => e.message.includes('Direct lives on each break now')), 'named');
  });

  await test('the direct tier is the deal, not a ladder — a second deal and the old cap are refused by name', async () => {
    const two = await req('PATCH', '/panel/setups/as_1',
      { slots: { preroll: { direct: { rungs: [
        { type: 'tag', tagId: 'tag_1' }, { type: 'tag', tagId: 'tag_2' }] } } } });
    eq(two.status, 400, 'two deals refused');
    assert(two.body.errors.some(e => e.message.includes('ONE direct deal')), 'named, with the count found');
    const cap = await req('PATCH', '/panel/setups/as_1',
      { slots: { preroll: { direct: { maxSession: 3 } } } });
    eq(cap.status, 400, 'the dead cap refused');
    assert(cap.body.errors.some(e => e.message.includes('no session cap any more')), 'and told why');
    const touch = await req('PATCH', '/panel/setups/as_1',
      { slots: { preroll: { direct: {} } } });
    eq(touch.status, 200, 'an empty direct patch lands');
    const d = (await req('GET', '/panel/setups/as_1')).body.setup.sections[0].slots.preroll.direct;
    eq(d.rungCount, 1, 'and wipes nothing — the deal never moved');
  });

  await test('a group with no fallback honours any fallback decision — primary only, never \'setup order\'', async () => {
    // as_7's mid-roll group 2 carries one rung (its primary). Order the fallback to one
    // partner: the single-rung group must NOT read as fallen back — there was no fallback
    // to filter — while a group whose non-empty fallback misses the partner still does.
    const k = (await req('GET', '/panel/keys/key_3')).body.key;
    const g2 = k.sections[0].slots.midroll.groups?.[1];
    assert(g2, 'key_3 runs two mid-roll groups');
    const before = g2.rungCount;
    const r = await req('POST', '/panel/keys/bulk',
      { ids: ['key_3'], action: 'driveFields', value: { slot: 'midroll', fields: { ask: ['ima'] } } });
    eq(r.status, 200, 'the ask lands');
    const after = (await req('GET', '/panel/keys/key_3')).body.key.sections[0].slots.midroll;
    eq(after.groups[1].fellBack, false, 'one-rung group: the decision is honoured, not fallen back from');
    eq(after.groups[1].rungCount, before, 'and its walk never moved');
    await req('POST', '/panel/keys/bulk',
      { ids: ['key_3'], action: 'driveFields', value: { slot: 'midroll', fields: { ask: null } } });
  });

  await test('a mid-roll is BREAK GROUPS: each its own cadence and ladder, capped at 3', async () => {
    const s = (await req('GET', '/panel/setups/as_7')).body.setup;
    const mid = s.sections[0].slots.midroll;
    eq(mid.groups.length, 2, 'as_7 runs two groups');
    eq(mid.groups[0].behaviour.mode, 'cuepoints', 'group 1 at named positions');
    eq(mid.groups[1].behaviour.mode, 'interval', 'group 2 every so often');
    eq(mid.groups[1].behaviour.stopAfter, undefined, 'and no mid-way stop — Break cap died 1 Sep');
    eq(mid.rungCount, mid.groups[0].rungCount, 'group 1 IS the mid-roll — the slot reads as it');
    // A fourth group is refused naming the cap.
    const four = await req('PATCH', '/panel/setups/as_7', {
      slots: { midroll: { groups: [{}, {}, {}, {}] } },
    });
    eq(four.status, 400, 'refused');
    assert(four.body.errors.some(e => e.message.includes('at most 3 break groups')), 'named');
    // Only a mid-roll holds groups.
    const pre = await req('PATCH', '/panel/setups/as_7', {
      slots: { preroll: { groups: [{}, {}] } },
    });
    eq(pre.status, 400, 'a pre-roll is one break');
    assert(pre.body.errors.some(e => e.message.includes('only a mid-roll holds break groups')), 'named');
  });

  await test('one group is today\'s mid-roll — every existing setup normalizes unchanged', async () => {
    const s = (await req('GET', '/panel/setups/as_1')).body.setup;
    const mid = s.sections[0].slots.midroll;
    eq(mid.groups.length, 1, 'one group');
    eq(JSON.stringify(mid.groups[0].rungs), JSON.stringify(mid.rungs), 'and it is the slot itself');
    // A plain ladder patch still lands on it — nothing about groups to know.
    const rungs = mid.rungs.slice(0, 2);
    const r = await req('PATCH', '/panel/setups/as_1', { slots: { midroll: { rungs } } });
    eq(r.status, 200, 'saved');
    const after = (await req('GET', '/panel/setups/as_1')).body.setup.sections[0].slots.midroll;
    eq(after.rungCountConfigured, 2, 'the ladder moved');
    eq(after.groups[0].rungCountConfigured, 2, 'and group 1 moved with it — one object, two names');
  });

  await test('every break group answers for itself — one dark group is one dark break', async () => {
    // Empty group 2's ladder while key_3 runs mid-rolls live: refused, the group named.
    const s = (await req('GET', '/panel/setups/as_7')).body.setup;
    const g1 = s.sections[0].slots.midroll.groups[0];
    const r = await req('PATCH', '/panel/setups/as_7', {
      slots: { midroll: { groups: [{ rungs: g1.rungs }, { rungs: [] }] } },
    });
    eq(r.status, 409, 'refused — key_3 fills its mid-roll group 2 from this');
    assert(/pod 2/i.test(r.body.message), `the pod is named (got ${r.body.message})`);
    // The live snapshot is checked at publish too: a group emptied on a DRAFT while the
    // switch is off publishes only when nothing runs on it.
    const g2 = await req('PATCH', '/panel/setups/as_7/sections/0/behaviour',
      { slot: 'midroll', group: 1, behaviour: { every: 240 } });
    eq(g2.status, 200, 'group 2\'s own behaviour edits by group index');
    const after = (await req('GET', '/panel/setups/as_7')).body.setup.sections[0].slots.midroll;
    eq(after.groups[1].behaviour.every, 240, 'landed on group 2');
    eq(after.groups[0].behaviour.every, s.sections[0].slots.midroll.groups[0].behaviour.every, 'group 1 untouched');
  });

  await test('the player is served every group\'s own walk and cadence', async () => {
    const k = (await req('GET', '/panel/keys/key_3')).body.key;
    const live = (await req('GET', `/panel/live/${k.key}`)).body;
    const mid = live.sections[0].slots.midroll;
    eq(mid.groups.length, 2, 'both groups ride the config');
    eq(mid.groups[1].behaviour.every, 180, 'with group 2\'s own cadence');
    assert(mid.walk.length > 0, 'group 1 doubles as the slot for a one-group player');
    eq(JSON.stringify(mid.walk), JSON.stringify(mid.groups[0].walk), 'and they agree');
  });

  await test('every unit in a break carries an ad placement; the close clocks stay the banner\u2019s', async () => {
    const s = (await req('GET', '/panel/setups/as_1')).body.setup;
    const banner = s.sections[0].slots.preroll.rungView.find(r => r.tagType === 'display');
    eq(banner.displaySlot, 'player_bottom', 'a place on the page, defaulted from the vocabulary');
    eq(banner.pause, 'no', 'content keeps playing under a banner by default');
    eq(banner.showAfterSec, 1, 'shows after a beat');
    eq(banner.closeAfterSec, 5, 'close button five seconds later');
    eq(banner.hideAfterSec, 10, 'gone after ten');
    // Pause is EVERY unit's own answer (31 Aug, user call — the JSON's pause rides every
    // unit): a video unit defaults to taking the screen, and may choose not to.
    const video = s.sections[0].slots.preroll.rungView.find(r => r.tagType === 'video');
    eq(video.pause, 'yes', 'a video unit pauses content by default');
    // AD PLACEMENT IS EVERY UNIT'S (3 Sep, user call): a banner renders at the position,
    // a video unit's companion renders alongside it — so the field is no longer refused
    // on IMA and CAN units, and defaults from the same vocabulary.
    eq(video.displaySlot, 'player_bottom', 'a video unit carries an ad placement too');
    eq(video.hideAfterSec, undefined, 'but no banner clocks');
    const rungs = s.sections[0].slots.preroll.rungs.map((r, i) => i === 0 ? { ...r, pause: 'no' } : r);
    const ok = await req('PATCH', '/panel/setups/as_1', { slots: { preroll: { rungs } } });
    eq(ok.status, 200, 'a video unit that plays over content is a fine answer');
    // The banner-only facts are still refused on a video rung, by name.
    const rungs2 = s.sections[0].slots.preroll.rungs.map((r, i) => i === 0 ? { ...r, hideAfterSec: 10 } : r);
    const bad = await req('PATCH', '/panel/setups/as_1', { slots: { preroll: { rungs2: undefined, rungs: rungs2 } } });
    eq(bad.status, 400, 'refused');
    assert(bad.body.errors.some(e => e.message.includes('runs its own length')), 'named');

    // And a video unit may be placed like any other.
    const rungs3 = s.sections[0].slots.preroll.rungs.map((r, i) => i === 0 ? { ...r, displaySlot: 'player_top' } : r);
    const placed = await req('PATCH', '/panel/setups/as_1', { slots: { preroll: { rungs: rungs3 } } });
    eq(placed.status, 200, 'a video unit takes an ad placement');
    eq((await req('GET', '/panel/setups/as_1')).body.setup.sections[0].slots.preroll.rungView[0].displaySlot,
      'player_top', 'and keeps it');
  });

  await test('banner facts are held to bounds and vocabulary, and ride the published config', async () => {
    const s = (await req('GET', '/panel/setups/as_1')).body.setup;
    const rungs = s.sections[0].slots.preroll.rungs.map(r => ({ ...r }));
    const bIdx = s.sections[0].slots.preroll.rungView.findIndex(r => r.tagType === 'display');
    rungs[bIdx] = { ...rungs[bIdx], displaySlot: 'sidebar_hero' };
    const badSlot = await req('PATCH', '/panel/setups/as_1', { slots: { preroll: { rungs } } });
    eq(badSlot.status, 400, 'a position the player does not offer is refused');
    assert(badSlot.body.errors.some(e => e.message.includes('not an ad placement the player offers')), 'named');
    rungs[bIdx] = { ...s.sections[0].slots.preroll.rungs[bIdx], closeAfterSec: 20, hideAfterSec: 8 };
    const badClock = await req('PATCH', '/panel/setups/as_1', { slots: { preroll: { rungs } } });
    eq(badClock.status, 400, 'hiding before its own close button is refused');
    assert(badClock.body.errors.some(e => e.message.includes('before its close button')), 'named');
    // The good values ride the snapshot to the player.
    rungs[bIdx] = { ...s.sections[0].slots.preroll.rungs[bIdx], displaySlot: 'l_50', pause: 'size' };
    eq((await req('PATCH', '/panel/setups/as_1', { slots: { preroll: { rungs } } })).status, 200, 'saved');
    eq((await req('POST', '/panel/setups/as_1/publish')).status, 200, 'published');
    const k = (await req('GET', '/panel/keys/key_1')).body.key;
    const live = (await req('GET', `/panel/live/${k.key}`)).body.sections[0].slots.preroll;
    const lb = live.walk.find(x => x.type === 'display');
    eq(lb.displaySlot, 'l_50', 'where on the page');
    eq(lb.pause, 'size', 'and whether content pauses — the player\'s own size decides');
  });

  await test('Mute is a break unit\u2019s own answer while content plays: Ad by default, Content by choice, a third refused by name, none on a rotation', async () => {
    // WHICH SOUND IS MUTED (11 Sep, user call): while the content keeps playing under the
    // ad two things render, so one is quiet. Every ladder unit carries the answer — a
    // video unit too, for the day it plays over content — and the UI folds it away while
    // content pauses; the store keeps it underneath, like the pause answer itself.
    const meta = (await req('GET', '/panel/meta')).body;
    eq(meta.muteModes, ['ad', 'content'], 'two answers: the one that is quiet');
    eq(meta.muteWords.content, 'Content', 'in the seller\u2019s words');
    const s = (await req('GET', '/panel/setups/as_1')).body.setup;
    const view = s.sections[0].slots.preroll.rungView;
    eq(view.find(r => r.tagType === 'display').mute, 'ad', 'a banner over content mutes the ad by default');
    eq(view.find(r => r.tagType === 'video').mute, 'ad', 'a video unit carries the answer too');
    const rungs = s.sections[0].slots.preroll.rungs.map(r => ({ ...r }));
    const bIdx = view.findIndex(r => r.tagType === 'display');
    rungs[bIdx] = { ...rungs[bIdx], mute: 'content' };
    eq((await req('PATCH', '/panel/setups/as_1', { slots: { preroll: { rungs } } })).status, 200, 'the content may be the quiet one');
    rungs[bIdx] = { ...rungs[bIdx], mute: 'both' };
    const bad = await req('PATCH', '/panel/setups/as_1', { slots: { preroll: { rungs } } });
    eq(bad.status, 400, 'a third answer is refused');
    assert(bad.body.errors.some(e => e.message.includes('which sound is muted')), 'by name');
    // A rotation takes turns in an idle player — nothing is playing to mute against.
    const o = (await req('GET', '/panel/setups/as_2')).body.setup;
    const orungs = o.sections[0].slots.outstream.rungs.map((r, i) => (i === 0 ? { ...r, mute: 'ad' } : r));
    const rot = await req('PATCH', '/panel/setups/as_2', { slots: { outstream: { rungs: orungs } } });
    eq(rot.status, 400, 'refused on a rotation');
    assert(rot.body.errors.some(e => e.message.includes('idle player')), 'by name');
    eq((await req('GET', '/panel/setups/as_2')).body.setup.sections[0].slots.outstream.rungView[0].mute, undefined, 'and a rotation unit never carries one');
    // The kept answer rides the published walk to the player.
    eq((await req('POST', '/panel/setups/as_1/publish')).status, 200, 'published');
    const k = (await req('GET', '/panel/keys/key_1')).body.key;
    const live = (await req('GET', `/panel/live/${k.key}`)).body.sections[0].slots.preroll;
    eq(live.walk.find(x => x.type === 'display').mute, 'content', 'the player is told which sound is quiet');
    // And moving it is a change the version rail can say, in words.
    const vs = (await req('GET', '/panel/setups/as_1/versions')).body;
    const notes = JSON.stringify(vs);
    assert(notes.includes('"field":"mute"') && notes.includes('"to":"Content"'), `the diff names it: ${notes.slice(0, 200)}`);
  });

  await test('out-stream is a fifth slot: a rotation outside playback, switch only', async () => {
    const meta = (await req('GET', '/panel/meta')).body;
    eq(meta.slotTypes.includes('outstream'), true, 'a slot type');
    eq(meta.slotKind.outstream, 'rotation', 'takes turns');
    const s = (await req('GET', '/panel/setups/as_7')).body.setup;
    const b = s.sections[0].slots.outstream.behaviour;
    eq(b.hideOnInStreamAd, true, 'it steps aside for an in-stream ad unless the publisher says otherwise');
    eq(b.perShow, 1, 'and one banner per scheduled show until someone asks for more');
    eq(b.hideOnInStream, undefined, 'the short spelling is not what is stored — the field is hideOnInStreamAd');
    eq(b.refresh, undefined, 'its show times are its own schedule — no rotation refresh');
    eq(b.walkDepth, undefined, 'and no depth — banners take turns');
    // Nothing to decide beyond its switch.
    const r = await patchDrive('key_3', 'outstream', { tries: 1 });
    eq(r.status, 400, 'refused');
    // See 07-bulk: the out-stream carries exactly one drive field since 10 Sep, so the
    // refusal names it instead of claiming there is nothing to decide at all.
    assert(r.body.errors.some(e => e.message.includes('header bidding')),
      `says what a rotation does carry (got ${JSON.stringify(r.body.errors)})`);
    // Direct never reaches it: direct is break demand, out-stream is not a break.
    const k = (await req('GET', '/panel/keys/key_3')).body.key;
    const live = (await req('GET', `/panel/live/${k.key}`)).body;
    assert(live.sections[0].slots.outstream, 'on air on key_3');
    assert(live.sections[0].slots.outstream.walk.every(x => x.type === 'display'), 'banners only');
  });

  await test('the break\'s giving-up point warns about the unreachable tail, counted', async () => {
    const copy = await freshSetup('as_1', 'fill timeout copy');
    const r = await req('PATCH', `/panel/setups/${copy.id}/sections/0/behaviour`,
      { slot: 'preroll', behaviour: { fillTimeoutSec: 6, tagTimeoutMs: 1500 } });
    eq(r.status, 200, 'a lever, never a wall');
    assert(r.body.warnings.some(w => w.includes('sources never run')),
      `the tail is counted (got ${JSON.stringify(r.body.warnings)})`);
    const bad = await req('PATCH', `/panel/setups/${copy.id}/sections/0/behaviour`,
      { slot: 'preroll', behaviour: { fillTimeoutSec: 2 } });
    eq(bad.status, 400, 'out of bounds refused');
  });

  await test('the Break cap is gone — refused by name, and the cadence runs the video out', async () => {
    // Cut 1 Sep (user call): nothing counted a mid-way stop. The refusal says what to
    // lean on instead — at set positions, the positions themselves are the cap.
    const dead = await req('PATCH', '/panel/setups/as_1/sections/0/behaviour',
      { slot: 'midroll', behaviour: { stopAfter: 4 } });
    eq(dead.status, 400, 'refused');
    assert(dead.body.errors.some(e => e.message.includes('Break cap') && e.message.includes('not a setting any more')),
      `named, with the way to think about it (got ${JSON.stringify(dead.body.errors)})`);
    const r = await req('PATCH', '/panel/setups/as_1/sections/0/behaviour',
      { slot: 'midroll', behaviour: { mode: 'interval', firstAt: 120, every: 300 } });
    eq(r.status, 200, 'the cadence itself is untouched');
    const b = (await req('GET', '/panel/setups/as_1')).body.setup.sections[0].slots.midroll.behaviour;
    eq(b.stopAfter, undefined, 'and carries no stop — the drumbeat runs the video out');
  });

  await test('request templates: authored in the ops room, validated against the player\'s macros', async () => {
    const r = await req('POST', '/panel/templates', {
      name: 'GAM test', provider: 'ima',
      url: 'https://ads.example.com/vast?cb=[CACHEBUSTER]&ref=[REFERRER_URL]',
    });
    eq(r.status, 201, 'created');
    const bad = await req('POST', '/panel/templates', {
      name: 'GAM broken', provider: 'ima',
      url: 'https://ads.example.com/vast?ref=[REFERER]',
    });
    eq(bad.status, 400, 'a macro outside the vocabulary is refused');
    assert(bad.body.errors.some(e => e.message.includes('[REFERER] is not a macro the player fills')), 'named');
    eq((await req('POST', '/panel/templates', { name: 'x', provider: 'ima', url: 'not-a-url' })).status,
      400, 'not a URL, refused');
  });

  await test('a tag picks its template — Standard is absence, and a mismatch is refused', async () => {
    const tpl = (await req('POST', '/panel/templates', {
      name: 'GAM special', provider: 'ima', url: 'https://ads.example.com/vast?cb=[CACHEBUSTER]',
    })).body.template;
    const tags = (await req('GET', '/panel/tags')).body.tags;
    const ima = tags.find(t => t.provider === 'ima');
    const can = tags.find(t => t.provider === 'can');
    const mismatch = await req('PATCH', `/panel/tags/${can.id}`, { tplId: tpl.id });
    eq(mismatch.status, 400, 'an IMA template on a CAN tag is refused');
    assert(mismatch.body.errors.some(e => e.message.includes('is a IMA template — this tag asks CAN')), 'named');
    const ok = await req('PATCH', `/panel/tags/${ima.id}`, { tplId: tpl.id });
    eq(ok.status, 200, 'the right provider lands');
    // In use: the template cannot be deleted, and is counted.
    const del = await req('DELETE', `/panel/templates/${tpl.id}`);
    eq(del.status, 409, 'refused');
    assert(del.body.message.includes('carries 1 tag'), 'counted');
    const back = await req('PATCH', `/panel/tags/${ima.id}`, { tplId: null });
    eq(back.status, 200, 'back to Standard — stored as absence');
    eq((await req('DELETE', `/panel/templates/${tpl.id}`)).status, 200, 'and now it deletes');
  });

  await test('a template reaches the player only once it is PUBLISHED', async () => {
    const s = (await req('GET', '/panel/setups/as_1')).body.setup;
    const primary = s.sections[0].slots.preroll.rungView[0];
    const tpl = (await req('POST', '/panel/templates', {
      name: 'GAM_2', provider: 'ima', url: 'https://ads.example.com/vast2?cb=[CACHEBUSTER]',
    })).body.template;
    eq(tpl.live, false, 'born as a draft — nothing is on air until it is published');
    await req('PATCH', `/panel/tags/${primary.tagId}`, { tplId: tpl.id });
    const k = (await req('GET', '/panel/keys/key_1')).body.key;

    // The pick on the tag stands, but the template is a draft, so the unit asks through
    // its provider's standard and the map never names it.
    const draft = (await req('GET', `/panel/live/${k.key}`)).body;
    eq(draft.sections[0].slots.preroll.walk[0].tpl, undefined, 'a draft template carries nothing');
    eq(draft.unittpl.GAM_2, undefined, 'and the unittpl map never names it');

    // Publish the TEMPLATE alone — no setup and no integration republish.
    const pub = await req('POST', `/panel/templates/${tpl.id}/publish`);
    eq(pub.status, 200, 'published on its own plane');
    const live = (await req('GET', `/panel/live/${k.key}`)).body;
    eq(live.unittpl.GAM_2, 'https://ads.example.com/vast2?cb=[CACHEBUSTER]', 'the template rides by name');
    eq(live.sections[0].slots.preroll.walk[0].tpl, 'GAM_2', 'and the unit names which one carries it');
  });

  await test('editing a published template changes NOTHING until it is published again', async () => {
    // THE HOLE THIS CLOSED (16 Sep, user call). A template edit used to reach every ad
    // setup pointing at it the instant it was saved, while each of those setups still
    // swore — on its page and in its version history — that nothing had changed.
    const s = (await req('GET', '/panel/setups/as_1')).body.setup;
    const primary = s.sections[0].slots.preroll.rungView[0];
    const tpl = (await req('POST', '/panel/templates', {
      name: 'GAM_3', provider: 'ima', url: 'https://ads.example.com/v1?cb=[CACHEBUSTER]',
    })).body.template;
    await req('PATCH', `/panel/tags/${primary.tagId}`, { tplId: tpl.id });
    await req('POST', `/panel/templates/${tpl.id}/publish`);
    const k = (await req('GET', '/panel/keys/key_1')).body.key;
    eq((await req('GET', `/panel/live/${k.key}`)).body.unittpl.GAM_3,
      'https://ads.example.com/v1?cb=[CACHEBUSTER]', 'v1 is what serves');

    // Save a new URL. The player must not move.
    await req('PATCH', `/panel/templates/${tpl.id}`, { url: 'https://ads.example.com/v2?cb=[CACHEBUSTER]' });
    eq((await req('GET', `/panel/live/${k.key}`)).body.unittpl.GAM_3,
      'https://ads.example.com/v1?cb=[CACHEBUSTER]', 'the draft is invisible to the player');
    const mid = (await req('GET', '/panel/templates')).body.templates.find(t => t.id === tpl.id);
    eq([mid.live, mid.liveVersion, mid.unpublishedCount], [true, 1, 1], 'live v1, one change waiting');

    // Publish it, and every unit pointing at it moves in one act.
    const pub = await req('POST', `/panel/templates/${tpl.id}/publish`);
    eq(pub.body.version.v, 2, 'v2');
    eq((await req('GET', `/panel/live/${k.key}`)).body.unittpl.GAM_3,
      'https://ads.example.com/v2?cb=[CACHEBUSTER]', 'now it serves');
  });

  await test('taking a template off air drops its units to the provider’s standard', async () => {
    const s = (await req('GET', '/panel/setups/as_1')).body.setup;
    const primary = s.sections[0].slots.preroll.rungView[0];
    const tpl = (await req('POST', '/panel/templates', {
      name: 'GAM_4', provider: 'ima', url: 'https://ads.example.com/v4?cb=[CACHEBUSTER]',
    })).body.template;
    await req('PATCH', `/panel/tags/${primary.tagId}`, { tplId: tpl.id });
    await req('POST', `/panel/templates/${tpl.id}/publish`);
    const k = (await req('GET', '/panel/keys/key_1')).body.key;
    eq((await req('GET', `/panel/live/${k.key}`)).body.sections[0].slots.preroll.walk[0].tpl, 'GAM_4', 'carried while on air');

    // No holder refusal: whatever a template does, its units always have somewhere to ask.
    eq((await req('POST', `/panel/templates/${tpl.id}/unpublish`)).status, 200, 'taken off air');
    const live = (await req('GET', `/panel/live/${k.key}`)).body;
    eq(live.sections[0].slots.preroll.walk[0].tpl, undefined, 'the unit falls back to its provider’s standard');
    eq(live.unittpl.GAM_4, undefined, 'and the unittpl map never names it');

    // The seeded world shows both states on day one.
    const list = (await req('GET', '/panel/templates')).body.templates;
    eq(list.find(t => t.name === 'GAM standard').live, true, 'the seeded shared template is on air');
    eq(list.find(t => t.name === 'GAM low-latency').live, false, 'and the seeded draft never went up');
  });

  await test('the `on` switch is gone — refused by name, pointing at where the answer lives', async () => {
    const tpl = (await req('POST', '/panel/templates', {
      name: 'GAM_5', provider: 'ima', url: 'https://ads.example.com/v5?cb=[CACHEBUSTER]',
    })).body.template;
    eq(tpl.on, undefined, 'the field is not on the wire at all');
    const dead = await req('PATCH', `/panel/templates/${tpl.id}`, { on: false });
    eq(dead.status, 400, 'refused');
    assert(dead.body.errors.some(e => e.field === 'on' && /Take off air/.test(e.message)),
      `says where the answer lives now (got ${JSON.stringify(dead.body.errors)})`);
  });

  await test('break pacing lives on the BREAK: the pre-roll\'s head start, prefetch on coming breaks', async () => {
    // Moved 31 Aug (user call): minPreRenderTime gates the pre-roll, prefetch readies a
    // break that arrives mid-playback — slot facts, not player facts.
    const slots = (await req('GET', '/panel/setups/as_1')).body.setup.sections[0].slots;
    eq(slots.preroll.behaviour.minContentSec, 1, 'the pre-roll lets a beat of video play first');
    eq(slots.midroll.behaviour.prefetchSec, 5, 'a mid-roll fetches its first ad 5s early');
    eq(slots.postroll.behaviour.prefetchSec, 5, 'so does the post-roll');
    eq(slots.preroll.behaviour.prefetchSec, undefined, 'a pre-roll has no before to fetch in');
    eq(slots.midroll.behaviour.minContentSec, undefined, 'and only the pre-roll guards the first frame');
    // The player keeps the one fact that is its own.
    const k = (await req('GET', '/panel/keys/key_1')).body.key;
    eq(k.player.expandInMini, true, 'banners expand in the mini player');
    eq(k.player.prefetchSec, undefined, 'prefetch is not the player\'s any more');
    const r = await req('POST', '/panel/keys/bulk', {
      ids: ['key_1', 'key_3'], action: 'playerFields',
      value: { fields: { expandInMini: false } },
    });
    eq(r.status, 200, 'bulk lands');
    eq(r.body.changed, 2, 'both moved');
    const bounds = await req('PATCH', '/panel/setups/as_1/sections/0/behaviour',
      { slot: 'preroll', behaviour: { minContentSec: 99 } });
    eq(bounds.status, 400, 'bounds hold on the slot');
  });

  await test('DIRECT is the break\'s switch on the surface — driven, bulked, gating the live break', async () => {
    // On by default (absence); the list and cap stay ops'.
    const k1 = (await req('GET', '/panel/keys/key_1')).body.key;
    eq(k1.sections[0].slots.preroll.direct.on, true, 'on by default');
    // The drive carries it, per break — and bulk writes it like any quick decision.
    const off = await req('POST', '/panel/keys/bulk',
      { ids: ['key_1', 'key_3'], action: 'driveFields', value: { slot: 'preroll', fields: { direct: false } } });
    eq(off.status, 200, 'applied');
    eq(off.body.changed, 2, 'both surfaces switched');
    eq((await req('GET', '/panel/keys/key_1')).body.key.sections[0].slots.preroll.direct.on, false, 'off on key_1\'s pre-roll');
    await req('POST', '/panel/keys/key_1/publish');
    const live = (await req('GET', `/panel/live/${k1.key}`)).body;
    eq(live.sections[0].slots.preroll.direct, undefined, 'the live pre-roll carries no direct tier while off');
    // Back on = dropping the decision; the tier returns, nothing was lost.
    const on = await req('POST', '/panel/keys/bulk',
      { ids: ['key_1'], action: 'driveFields', value: { slot: 'preroll', fields: { direct: true } } });
    eq(on.status, 200, 'switched back');
    await req('POST', '/panel/keys/key_1/publish');
    eq((await req('GET', `/panel/live/${k1.key}`)).body.sections[0].slots.preroll.direct.walk.length, 1,
      'the tier is back, the deal intact');
  });

  await test('`status` is gone — a payload still carrying it is refused by name', async () => {
    const r = await req('PATCH', '/panel/keys/key_1', { status: 'paused' });
    eq(r.status, 400, 'refused');
    assert(r.body.errors.some(e => e.field === 'status' && e.message.includes('Unpublish')),
      `says what replaced it (got ${JSON.stringify(r.body.errors)})`);
    eq((await req('POST', '/panel/keys/key_1/status', { status: 'paused' })).status, 404, 'and the route went with it');
  });
}
