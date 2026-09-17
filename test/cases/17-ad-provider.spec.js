// test/cases/17-ad-provider.spec.js — AD PROVIDER, the unit's own note on WHOSE DEMAND
// fills it (16 Sep, user call: *"under each ad unit give an option of meta where user can
// configure the Ad Provider which could be Taboola, Columbia, Slike, GAM, etc — set a
// predefined default value or keep it empty by default"*).
//
// It is NOT the tag's `provider`. That one says how the unit is REQUESTED — the IMA and GPT
// client libraries, or a pasted CAN endpoint — and the config knows it by construction.
// This says who the ad comes FROM, which nothing in the config can derive: a GAM request
// may be carrying Taboola demand, and a pasted endpoint says nothing at all about who
// answers it. So it is stated by a person, or it is not stated.
//
// EMPTY BY DEFAULT, the user's second option taken: a default would be an invented vendor
// on every unit ever saved, and a wrong vendor reads as counted where a blank one reads as
// unanswered. Absence is the answer, and it is the only one the panel writes by itself.

export default async function run({ test, req, eq, assert }) {
  const preroll = async (id = 'as_1') => (await req('GET', `/panel/setups/${id}`)).body.setup.sections[0].slots.preroll;

  await test('a unit starts with nobody named — absence is the answer, and no unit is born with a vendor', async () => {
    const meta = (await req('GET', '/panel/meta')).body;
    eq(meta.adProviders, ['gam', 'taboola', 'colombia', 'slike'], 'the vocabulary the control draws');
    eq(meta.adProviderWords.taboola, 'Taboola', 'in the vendors’ own spelling');
    assert(!meta.adProviders.includes(''), 'and empty is NOT a vendor in the list — absence is not a name');
    // Every unit in the seeded world, across every setup: not one carries a vendor nobody
    // typed. This is the whole "empty by default" decision, pinned.
    const setups = (await req('GET', '/panel/setups')).body.setups;
    for (const { id } of setups) {
      const s = (await req('GET', `/panel/setups/${id}`)).body.setup;
      for (const sec of s.sections) {
        for (const slot of Object.values(sec.slots || {})) {
          for (const r of slot.rungView || []) eq(r.adProvider, undefined, `${id}: no unit is seeded with a vendor`);
        }
      }
    }
  });

  await test('meta publishes the ONE list of unit facts — the seam the editor\u2019s save payload reads', async () => {
    // The ad setup editor built its save payload from a hand-copied list of five, so `mute`
    // and `headerBidding` were editable on every unit in that room and dropped on the way
    // out: the control moved, the row redrew, the save succeeded, the answer never left the
    // browser. `rungPayload` reads this list now, so a fact added to `RUNG_FACTS` can never
    // again be one the screen can set and the save cannot send.
    const meta = (await req('GET', '/panel/meta')).body;
    eq(meta.rungFacts, ['adProvider', 'displaySlot', 'pause', 'mute', 'headerBidding', 'showAfterSec', 'closeAfterSec', 'hideAfterSec'],
      'every fact a unit carries, from the one place that defines them');
  });

  await test('a unit takes a vendor and keeps it — through the save, the read and the published walk', async () => {
    const p = await preroll();
    const rungs = p.rungs.map((r, i) => (i === 0 ? { ...r, adProvider: 'taboola' } : r));
    eq((await req('PATCH', '/panel/setups/as_1', { slots: { preroll: { rungs } } })).status, 200, 'saved');
    const after = await preroll();
    eq(after.rungView[0].adProvider, 'taboola', 'and reads back on the unit');
    eq(after.rungView[1].adProvider, undefined, 'the unit beside it is untouched — this is a UNIT fact, not a ladder one');
    eq((await req('POST', '/panel/setups/as_1/publish')).status, 200, 'published');
    const k = (await req('GET', '/panel/keys/key_1')).body.key;
    const walk = (await req('GET', `/panel/live/${k.key}`)).body.sections[0].slots.preroll.walk;
    eq(walk[0].adProvider, 'taboola', 'the player is handed who fills the unit');
    assert(!('adProvider' in walk[1]), 'and told nothing where nobody has said — an unset unit carries no key');
  });

  await test('EVERY unit takes one — a break’s video unit, its banner, and a rotation’s banner alike', async () => {
    const p = await preroll();
    const vIdx = p.rungView.findIndex(r => r.tagType === 'video');
    const bIdx = p.rungView.findIndex(r => r.tagType === 'display');
    const rungs = p.rungs.map((r, i) => (i === vIdx ? { ...r, adProvider: 'gam' } : i === bIdx ? { ...r, adProvider: 'colombia' } : r));
    eq((await req('PATCH', '/panel/setups/as_1', { slots: { preroll: { rungs } } })).status, 200, 'a video unit and a banner each answer for themselves');
    const view = (await preroll()).rungView;
    eq(view[vIdx].adProvider, 'gam', 'the video unit');
    eq(view[bIdx].adProvider, 'colombia', 'the banner');
    // A rotation refuses `mute` (nothing is playing to mute against) but a banner taking
    // turns still comes from somebody — so this one is asked of it too.
    const o = (await req('GET', '/panel/setups/as_2')).body.setup.sections[0].slots.outstream;
    const orungs = o.rungs.map((r, i) => (i === 0 ? { ...r, adProvider: 'slike' } : r));
    eq((await req('PATCH', '/panel/setups/as_2', { slots: { outstream: { rungs: orungs } } })).status, 200, 'a rotation’s banner answers too');
    eq((await req('GET', '/panel/setups/as_2')).body.setup.sections[0].slots.outstream.rungView[0].adProvider, 'slike', 'and keeps it');
  });

  await test('a vendor the console does not know is REFUSED BY NAME, on the unit, listing the ones it does', async () => {
    const p = await preroll();
    const rungs = p.rungs.map((r, i) => (i === 0 ? { ...r, adProvider: 'taboolaa' } : r));
    const bad = await req('PATCH', '/panel/setups/as_1', { slots: { preroll: { rungs } } });
    eq(bad.status, 400, 'refused — a typo here is a wrong vendor in every report that reads the unit');
    const msg = bad.body.errors.map(e => e.message).join(' | ');
    assert(msg.includes('taboolaa'), `the refusal quotes what was sent: ${msg}`);
    assert(msg.includes('not an ad provider the console knows'), 'says what is wrong');
    assert(msg.includes('Taboola') && msg.includes('GAM'), 'and names the ones it does know, in their own spelling');
    assert(/“[^”]+”\s+—\s+“taboolaa”/.test(msg), `and names the UNIT it is about, not just the ladder: ${msg}`);
    eq((await preroll()).rungView[0].adProvider, undefined, 'and nothing was written — fail closed');
  });

  await test('clearing it returns the unit to unanswered — the way back leaves no trace', async () => {
    const p = await preroll();
    const set = p.rungs.map((r, i) => (i === 0 ? { ...r, adProvider: 'slike' } : r));
    eq((await req('PATCH', '/panel/setups/as_1', { slots: { preroll: { rungs: set } } })).status, 200, 'named');
    eq((await preroll()).rungView[0].adProvider, 'slike', 'and held');
    // Three spellings of "nobody has said" — the control sends the first, an older client
    // may send either of the others, and all three mean the same thing.
    for (const blank of ['', null, undefined]) {
      const cleared = (await preroll()).rungs.map((r, i) => (i === 0 ? { ...r, adProvider: blank } : r));
      eq((await req('PATCH', '/panel/setups/as_1', { slots: { preroll: { rungs: cleared } } })).status, 200, `cleared with ${JSON.stringify(blank)}`);
      const back = (await preroll()).rungView[0];
      assert(!('adProvider' in back), `and the unit holds no empty value behind it (${JSON.stringify(blank)})`);
      const re = (await preroll()).rungs.map((r, i) => (i === 0 ? { ...r, adProvider: 'slike' } : r));
      await req('PATCH', '/panel/setups/as_1', { slots: { preroll: { rungs: re } } });
    }
  });

  await test('naming a vendor is a change the version rail says, in the vendor’s own word', async () => {
    // as_1 is live in the seeded world, so the version it is on IS the one to move from.
    const p = await preroll();
    const rungs = p.rungs.map((r, i) => (i === 0 ? { ...r, adProvider: 'colombia' } : r));
    eq((await req('PATCH', '/panel/setups/as_1', { slots: { preroll: { rungs } } })).status, 200, 'named');
    eq((await req('POST', '/panel/setups/as_1/publish')).status, 200, 'published');
    const notes = JSON.stringify((await req('GET', '/panel/setups/as_1/versions')).body);
    assert(notes.includes('"field":"adProvider"'), `the rail says the field moved: ${notes.slice(0, 200)}`);
    assert(notes.includes('"to":"Colombia"'), 'wearing the vendor’s word, never the stored key');
  });
}
