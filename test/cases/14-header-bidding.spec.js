// test/cases/14-header-bidding.spec.js — HEADER BIDDING (10 Sep, user call): one answer at
// the setup's head, borrowed or dissented from by every ad slot, and handed to the player
// RESOLVED. The borrow is a LINK, never a copy — the same promise the global waterfall
// makes about its units, made here about one value.

export default async function run({ test, req, eq, assert, freshSetup }) {
  await test('the setup answers once, and every slot borrows it by default', async () => {
    const s = (await req('GET', '/panel/setups/as_1')).body.setup;
    eq(s.headerBidding, 'amazon_prebid', 'the surface runs both libraries');
    eq(s.sections[0].slots.preroll.behaviour.headerBidding, 'auto', 'its pre-roll takes the surface’s answer');
    eq(s.sections[0].slots.midroll.behaviour.headerBidding, 'prebid', 'its mid-roll runs Prebid alone — a slot may dissent');
    eq(s.sections[1].slots.preroll.behaviour.headerBidding, 'off', 'and a slot may refuse bidders outright');
    // Absence is `auto` everywhere, so a setup written before this existed reads as one
    // whose slots all follow it — and a setup nobody answered reads as Off.
    const blank = (await req('POST', '/panel/setups', {
      name: 'Bidding blank', property: 'TOI', sections: [{ name: 'Default', slots: {} }],
    })).body.setup;
    eq(blank.headerBidding, 'off', 'nobody bids until someone says so');
    eq(blank.sections[0].slots.outstream.behaviour.headerBidding, 'auto', 'and every slot follows that answer');
  });

  await test('AUTO IS NOT A GLOBAL ANSWER — the thing being borrowed cannot borrow, refused by name', async () => {
    const r = await req('PATCH', '/panel/setups/as_1', { headerBidding: 'auto' });
    eq(r.status, 400, 'refused');
    assert(JSON.stringify(r.body.errors).includes('borrows this one'), 'and said why, not just "invalid"');
    const bad = await req('PATCH', '/panel/setups/as_1', { headerBidding: 'amazon_only' });
    eq(bad.status, 400, 'an unknown partner set is refused too');
    assert(JSON.stringify(bad.body.errors).includes('header bidding'), 'named');
    const badSlot = await req('PATCH', '/panel/setups/as_1/sections/0/behaviour',
      { slot: 'preroll', behaviour: { headerBidding: 'index_exchange' } });
    eq(badSlot.status, 400, 'and so is an unknown answer on a slot');
  });

  await test('every ad slot carries it — the out-stream included, where a waterfall is refused', async () => {
    const s = await freshSetup('as_1', 'Bidding rotation');
    // The rotation refuses a waterfall source by name (a rotation takes turns); bidders
    // have nothing to do with taking turns, so the same slot takes this answer.
    const r = await req('PATCH', `/panel/setups/${s.id}/sections/0/behaviour`,
      { slot: 'outstream', behaviour: { headerBidding: 'prebid' } });
    eq(r.status, 200, 'the out-stream answers for itself');
    eq(r.body.setup.sections[0].slots.outstream.behaviour.headerBidding, 'prebid', 'and keeps it');
  });

  await test('a borrowing slot MOVES with the global — a link, never a copy; a dissenting one does not', async () => {
    const before = (await req('GET', '/panel/setups/as_1')).body.setup;
    eq(before.sections[0].slots.postroll.behaviour.headerBidding, 'auto', 'the post-roll borrows');
    const r = await req('PATCH', '/panel/setups/as_1', { headerBidding: 'amazon' });
    eq(r.status, 200, 'the surface changes its answer once');
    const s = r.body.setup;
    eq(s.sections[0].slots.postroll.behaviour.headerBidding, 'auto', 'the borrowing slot still says Auto — the value is not copied into it');
    eq(s.sections[0].slots.midroll.behaviour.headerBidding, 'prebid', 'and the dissenting slot keeps its own answer');
    // What each one RUNS is resolved at the boundary, which is where the link is felt.
    const k = (await req('GET', '/panel/keys/key_1')).body.key;
    eq((await req('POST', '/panel/setups/as_1/publish')).status, 200, 'published');
    const live = (await req('GET', `/panel/live/${k.key}`)).body.sections[0].slots;
    eq(live.postroll.behaviour.headerBidding, 'amazon', 'the borrowing slot now runs Amazon');
    eq(live.midroll.behaviour.headerBidding, 'prebid', 'the dissenting slot still runs Prebid');
  });

  await test('the player is handed the answer RESOLVED — never the panel’s own Auto', async () => {
    const k = (await req('GET', '/panel/keys/key_1')).body.key;
    const live = (await req('GET', `/panel/live/${k.key}`)).body;
    const slots = live.sections[0].slots;
    eq(slots.preroll.behaviour.headerBidding, 'amazon_prebid', 'a borrowing break is told who bids');
    eq(slots.midroll.behaviour.headerBidding, 'prebid', 'a dissenting break is told its own');
    for (const s of live.sections) {
      for (const t of Object.keys(s.slots)) {
        assert(s.slots[t].behaviour.headerBidding !== 'auto',
          `${s.name} ${t}: the client never has to join the two halves itself`);
      }
    }
  });

  await test('nothing reaches the player until it is published — the plane holds for this too', async () => {
    const k = (await req('GET', '/panel/keys/key_1')).body.key;
    const was = (await req('GET', `/panel/live/${k.key}`)).body.sections[0].slots.preroll.behaviour.headerBidding;
    eq(was, 'amazon_prebid', 'on air today');
    eq((await req('PATCH', '/panel/setups/as_1', { headerBidding: 'off' })).status, 200, 'switched off in the draft');
    const still = (await req('GET', `/panel/live/${k.key}`)).body.sections[0].slots.preroll.behaviour.headerBidding;
    eq(still, 'amazon_prebid', 'the draft is invisible to the player');
    // And the gap is counted where the panel counts every other gap.
    const pending = (await req('GET', '/panel/setups/as_1/versions')).body.unpublished;
    assert(pending.some(c => c.field === 'headerBidding'), 'the pending list names it');
    eq((await req('POST', '/panel/setups/as_1/publish')).status, 200, 'published');
    eq((await req('GET', `/panel/live/${k.key}`)).body.sections[0].slots.preroll.behaviour.headerBidding,
      'off', 'and now nobody bids');
  });

  await test('a pod answers for itself — bidders are asked per break, not per slot', async () => {
    const s = await freshSetup('as_1', 'Bidding pods');
    const mid = s.sections[0].slots.midroll;
    const pods = [
      { rungs: mid.rungs.map(r => ({ type: 'tag', tagId: r.tagId })), behaviour: { ...mid.behaviour, headerBidding: 'amazon' } },
      { rungs: mid.rungs.slice(0, 1).map(r => ({ type: 'tag', tagId: r.tagId })), behaviour: { ...mid.behaviour, cuepoints: [900], headerBidding: 'off' } },
    ];
    const r = await req('PATCH', `/panel/setups/${s.id}`, {
      sections: [{ slots: { midroll: { groups: pods } } }, {}],
    });
    eq(r.status, 200, 'two pods, two answers');
    const gs = r.body.setup.sections[0].slots.midroll.groups;
    eq(gs.map(g => g.behaviour.headerBidding), ['amazon', 'off'], 'each pod keeps its own');
  });

  await test('every ad unit answers too — Auto borrows its break, a dissenting unit keeps its own, a pasted URL has no bidders to ask', async () => {
    // HEADER BIDDING PER UNIT (11 Sep, user call): the third tier of the same grammar.
    const s = (await req('GET', '/panel/setups/as_1')).body.setup;
    const view = s.sections[0].slots.preroll.rungView;
    const gam = view.find(r => r.provider !== 'can');
    const can = view.find(r => r.provider === 'can');
    assert(gam && can, 'the seeded pre-roll mixes GAM units and a pasted URL');
    eq(gam.headerBidding, 'auto', 'a GAM unit borrows its break by default');
    eq(can.headerBidding, undefined, 'a pasted URL carries no answer at all');
    eq(view[0].provider !== 'can', true, 'the primary is a GAM unit');
    const rungs = s.sections[0].slots.preroll.rungs.map(r => ({ ...r }));
    rungs[0] = { ...rungs[0], headerBidding: 'prebid' };
    eq((await req('PATCH', '/panel/setups/as_1', { slots: { preroll: { rungs } } })).status, 200, 'a unit may dissent from its break');
    const cIdx = view.findIndex(r => r.provider === 'can');
    const bad = await req('PATCH', '/panel/setups/as_1', { slots: { preroll: { rungs: rungs.map((r, i) => (i === cIdx ? { ...r, headerBidding: 'amazon' } : r)) } } });
    eq(bad.status, 400, 'a pasted URL is refused a named answer');
    assert(bad.body.errors.some(e => e.message.includes('pasted URL')), 'and told why');
    const unknown = await req('PATCH', '/panel/setups/as_1', { slots: { preroll: { rungs: rungs.map((r, i) => (i === 0 ? { ...r, headerBidding: 'rubicon' } : r)) } } });
    eq(unknown.status, 400, 'an unknown partner is refused');
    assert(unknown.body.errors.some(e => e.message.includes('header bidding')), 'by name');
    // The player is handed EVERY unit resolved — never `auto`.
    eq((await req('POST', '/panel/setups/as_1/publish')).status, 200, 'published');
    const k = (await req('GET', '/panel/keys/key_1')).body.key;
    const pre = (await req('GET', `/panel/live/${k.key}`)).body.sections[0].slots.preroll;
    eq(pre.behaviour.headerBidding, 'amazon_prebid', 'the break borrows the setup');
    eq(pre.walk[0].headerBidding, 'prebid', 'the dissenting primary runs its own');
    for (const u of pre.walk.slice(1)) {
      eq(u.headerBidding, u.provider === 'can' ? 'off' : 'amazon_prebid',
        `${u.provider} ${u.value}: a borrowing unit runs the break\u2019s, a pasted URL runs none`);
    }
    // And the version rail says the unit moved, in words.
    const vs = JSON.stringify((await req('GET', '/panel/setups/as_1/versions')).body);
    assert(vs.includes('"field":"headerBidding"') && vs.includes('"to":"Prebid"'), 'the diff names the unit\u2019s answer');
  });

  await test('the version rail says what moved, at the head and on the slot', async () => {
    await req('PATCH', '/panel/setups/as_1', { headerBidding: 'prebid' });
    await req('PATCH', '/panel/setups/as_1/sections/0/behaviour',
      { slot: 'postroll', behaviour: { headerBidding: 'off' } });
    const pending = (await req('GET', '/panel/setups/as_1/versions')).body.unpublished;
    const head = pending.find(c => c.field === 'headerBidding' && !c.where);
    assert(head, 'the setup’s own answer is one line');
    eq([head.from, head.to], ['amazon_prebid', 'prebid'], 'from and to, in the model’s own values');
    const slot = pending.find(c => c.field === 'headerBidding' && c.where && c.where.includes('Post-roll'));
    assert(slot, 'and the slot that dissented is named where it lives');
    eq([slot.from, slot.to], ['auto', 'off'], 'a slot leaving Auto reads as leaving Auto');
  });

  // ---------- THE SURFACE ANSWERS TOO (11 Sep, user call) ----------
  // Header bidding joined the DRIVE: a quick decision per break, stored sparse, resolved over
  // whatever the ad setup holds that day — so absence means "follow the setup", and the answer
  // the player is handed is the surface's when it made one.

  await test('a surface answers one break for itself — and the others still follow the setup', async () => {
    const r = await req('PATCH', '/panel/keys/key_1', { drive: { preroll: { headerBidding: 'prebid' } } });
    eq(r.status, 200, 'the decision lands');
    eq(r.body.key.drive.preroll.headerBidding, 'prebid', 'stored on the drive, not in the setup');
    eq((await req('GET', '/panel/setups/as_1')).body.setup.sections[0].slots.preroll.behaviour.headerBidding,
      'auto', 'the ad setup never moved — the decision is the surface’s own');
    const pre = r.body.key.sections[0].slots.preroll;
    assert(pre.behaviourDrive.includes('headerBidding'), 'and the break says the answer is the surface’s');
    // A break the surface said nothing about resolves the ops room's own answer.
    eq(r.body.key.sections[0].slots.midroll.behaviour.headerBidding, 'prebid', 'the mid-roll runs the placement’s own');
    assert(!(r.body.key.sections[0].slots.midroll.behaviourDrive || []).includes('headerBidding'),
      'unmarked — nobody decided it here');
  });

  await test('AUTO is the ad setup’s word, refused on a surface by name', async () => {
    const r = await req('PATCH', '/panel/keys/key_1', { drive: { preroll: { headerBidding: 'auto' } } });
    eq(r.status, 400, 'refused');
    assert(JSON.stringify(r.body.errors).includes('Auto is the ad setup'), 'and said why');
    const bad = await req('PATCH', '/panel/keys/key_1', { drive: { preroll: { headerBidding: 'index' } } });
    eq(bad.status, 400, 'an unknown partner set is refused too');
  });

  await test('the out-stream takes this one decision — where every other quick decision is refused', async () => {
    const ok = await req('PATCH', '/panel/keys/key_1', { drive: { outstream: { headerBidding: 'amazon' } } });
    eq(ok.status, 200, 'who bids for a banner slot is a real decision');
    eq(ok.body.key.drive.outstream.headerBidding, 'amazon', 'and it is kept');
    const no = await req('PATCH', '/panel/keys/key_1', { drive: { outstream: { tries: 2 } } });
    eq(no.status, 400, 'a rotation still has no walk to cut');
    assert(JSON.stringify(no.body.errors).includes('quick decisions are'), 'named, with what it does take');
  });

  await test('the player is handed the surface’s answer where it made one, the setup’s where it did not', async () => {
    await req('PATCH', '/panel/keys/key_1', { drive: { postroll: { headerBidding: 'off' } } });
    eq((await req('POST', '/panel/keys/key_1/publish')).status, 200, 'published');
    const k = (await req('GET', '/panel/keys/key_1')).body.key;
    const slots = (await req('GET', `/panel/live/${k.key}`)).body.sections[0].slots;
    eq(slots.postroll.behaviour.headerBidding, 'off', 'the surface’s own answer serves');
    eq(slots.preroll.behaviour.headerBidding, 'amazon_prebid', 'and an undecided break takes the setup’s');
    eq(slots.midroll.behaviour.headerBidding, 'prebid', 'including a placement that dissents');
  });

  await test('a cohort answers it in one act — and `setup` is how any lever is cleared', async () => {
    const set = await req('POST', '/panel/keys/bulk',
      { ids: ['key_1', 'key_2'], action: 'driveFields', value: { slot: 'preroll', fields: { headerBidding: 'amazon' } } });
    eq(set.status, 200, 'written across the cohort');
    eq(set.body.changed, 2, 'both surfaces took it');
    eq((await req('GET', '/panel/keys/key_2')).body.key.drive.preroll.headerBidding, 'amazon', 'and each holds its own copy');
    // THE CLEAR, FOR EVERY LEVER (generalised 11 Sep): the sheet's own "follow the ad setup"
    // word. It was read only inside `ask`, so `Waterfall depth · Full` came back 400.
    const clear = await req('POST', '/panel/keys/bulk',
      { ids: ['key_1'], action: 'driveFields', value: { slot: 'preroll', fields: { headerBidding: 'setup', tries: 'setup' } } });
    eq(clear.status, 200, 'clearing is not a refusal');
    const d = (await req('GET', '/panel/keys/key_1')).body.key.drive?.preroll || {};
    eq(d.headerBidding, undefined, 'the decision is gone — the break follows the setup again');
    eq(d.tries, undefined, 'and so is the depth, which this used to refuse outright');
  });

  await test('a copy takes the answer with it — the photocopy rule, head and slots', async () => {
    const s = await freshSetup('as_1', 'Bidding copy');
    eq(s.headerBidding, 'amazon_prebid', 'the copy runs what the original ran');
    eq(s.sections[0].slots.midroll.behaviour.headerBidding, 'prebid', 'including every slot’s dissent');
    // …and it is a copy: answering the copy moves nothing on the original.
    await req('PATCH', `/panel/setups/${s.id}`, { headerBidding: 'off' });
    eq((await req('GET', '/panel/setups/as_1')).body.setup.headerBidding, 'amazon_prebid', 'the original never moved');
  });
}
