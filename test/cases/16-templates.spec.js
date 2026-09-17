// test/cases/16-templates.spec.js — AD UNIT TEMPLATES AS A ROOM (16 Sep): who may point
// at a template (`properties`), who does (the reach), and the invariant between the two.
// The three rules this file pins:
//   · `properties: []` is every property — the answer said by absence, so a payload
//     written when it was a single `property` string still reads the way it always did;
//   · visibility may always widen, and may narrow only where nothing is stranded — a
//     template an ad setup already points at stays visible to that setup's property;
//   · the reach is a WALK of the real documents, so a unit parked in `ownRungs` or
//     sitting in the global waterfall counts exactly as one in a live ladder does.

export default async function run({ test, req, eq, assert }) {
  const listTemplates = async () => (await req('GET', '/panel/templates')).body.templates;
  const byName = async name => (await listTemplates()).find(t => t.name === name);

  // ---------- visible to: the shape of the answer ----------

  await test('visible to: no properties named is EVERY property — absence is the answer', async () => {
    const made = await req('POST', '/panel/templates', {
      name: 'Shared', provider: 'ima', url: 'https://ads.example/vast?cb=[CACHEBUSTER]',
    });
    eq(made.status, 201, 'created');
    eq(made.body.template.properties, [], 'nothing named');

    const one = await req('POST', '/panel/templates', {
      name: 'TOI only', provider: 'ima', url: 'https://ads.example/toi?cb=[CACHEBUSTER]',
      properties: ['TOI'],
    });
    eq(one.body.template.properties, ['TOI'], 'one named');

    // Naming EVERY property is the same answer as naming none, and is stored that way —
    // one shape per meaning, so the chip row can never show two spellings of All.
    const all = await req('POST', '/panel/templates', {
      name: 'Every one', provider: 'ima', url: 'https://ads.example/all?cb=[CACHEBUSTER]',
      properties: ['TOI', 'ET', 'NBT'],
    });
    eq(all.body.template.properties, [], 'all three collapse to absence');
  });

  await test('the old single `property` string is still accepted, and maps', async () => {
    const shared = await req('POST', '/panel/templates', {
      name: 'Legacy all', provider: 'ima', url: 'https://ads.example/a?cb=[CACHEBUSTER]',
      property: 'All',
    });
    eq(shared.body.template.properties, [], "'All' is the empty list");
    const one = await req('POST', '/panel/templates', {
      name: 'Legacy ET', provider: 'ima', url: 'https://ads.example/b?cb=[CACHEBUSTER]',
      property: 'ET',
    });
    eq(one.body.template.properties, ['ET'], 'a named property is a list of one');
  });

  await test('a property that is not a property is refused by name', async () => {
    const bad = await req('POST', '/panel/templates', {
      name: 'Nowhere', provider: 'ima', url: 'https://ads.example/c?cb=[CACHEBUSTER]',
      properties: ['TOI', 'MIRROR'],
    });
    eq(bad.status, 400, 'refused');
    assert(bad.body.errors.some(e => e.field === 'properties' && e.message.includes('MIRROR')),
      `names the value (got ${JSON.stringify(bad.body.errors)})`);

    const shape = await req('POST', '/panel/templates', {
      name: 'Nowhere 2', provider: 'ima', url: 'https://ads.example/d?cb=[CACHEBUSTER]',
      properties: 'TOI',
    });
    eq(shape.status, 400, 'a bare string under the list key is refused too');
  });

  // ---------- the reach: counted, one hop past the tags ----------

  await test('the reach is the ad setups the template lands in, counted and named', async () => {
    const t = await byName('GAM standard');
    assert(t.usedBy >= 1, `seeded connected (got ${t.usedBy})`);
    assert(t.setupCount >= 1, 'and the setups counted');
    eq(t.setupCount, t.setups.length, 'the count and the list agree');
    assert(t.setups.every(s => s.units >= 1), 'every named setup holds at least one of its units');
    // Every property a setup sits in shows up once, so the page can group by it.
    eq([...new Set(t.setups.map(s => s.property))].sort(), [...t.propertiesInUse].sort(),
      'propertiesInUse is exactly the setups’ properties');
    // The per-setup unit names are a subset of the template's own tags — never invented.
    const all = new Set(t.usedByNames);
    assert(t.setups.every(s => (s.unitNames || []).every(n => all.has(n))),
      'no setup names a unit the template does not carry');
  });

  await test('a template nothing points at reaches nothing — and says so with zeroes', async () => {
    const made = (await req('POST', '/panel/templates', {
      name: 'Untouched', provider: 'ima', url: 'https://ads.example/e?cb=[CACHEBUSTER]',
    })).body.template;
    const t = (await listTemplates()).find(x => x.id === made.id);
    eq([t.usedBy, t.setupCount, t.setups.length, t.propertiesInUse.length], [0, 0, 0, 0], 'nothing');
  });

  // ---------- the invariant: everything connected stays visible ----------

  await test('narrowing that would strand a connected ad setup is refused, by property', async () => {
    const t = await byName('GAM standard');           // all properties, connected on TOI and ET
    assert(t.propertiesInUse.length > 1, 'the seed connects it in more than one property');
    const keep = t.propertiesInUse[0];
    const drop = t.propertiesInUse[1];
    const r = await req('PATCH', `/panel/templates/${t.id}`, { properties: [keep] });
    eq(r.status, 409, 'refused');
    eq(r.body.error, 'template_in_use', 'by code');
    assert(r.body.message.includes(drop), `the property is named (got ${r.body.message})`);
    assert(r.body.properties.includes(drop), 'and is machine-readable');
    assert(r.body.usedBy.length >= 1, 'with the ad setups named');
    // Nothing was written: the store still says what it said.
    eq((await byName('GAM standard')).properties, [], 'untouched');
  });

  await test('narrowing to exactly where it IS connected lands — nothing is stranded', async () => {
    const t = await byName('GAM standard');
    const r = await req('PATCH', `/panel/templates/${t.id}`, { properties: t.propertiesInUse });
    eq(r.status, 200, 'allowed');
    eq(r.body.template.properties.sort(), [...t.propertiesInUse].sort(), 'exactly those');
  });

  await test('widening is always allowed — a wider answer strands nobody', async () => {
    const t = await byName('GAM low-latency');        // seeded TOI-only and connected on TOI
    eq(t.properties, ['TOI'], 'seeded narrow');
    const wide = await req('PATCH', `/panel/templates/${t.id}`, { properties: ['TOI', 'ET'] });
    eq(wide.status, 200, 'widened');
    const all = await req('PATCH', `/panel/templates/${t.id}`, { properties: [] });
    eq(all.status, 200, 'and all the way to every property');
    eq(all.body.template.properties, [], 'absence again');
  });

  await test('a template nothing points at may be narrowed anywhere', async () => {
    const t = await byName('TOI display cache-bust');
    eq(t.usedBy, 0, 'seeded free');
    const r = await req('PATCH', `/panel/templates/${t.id}`, { properties: ['NBT'] });
    eq(r.status, 200, 'moved wholesale');
    eq(r.body.template.properties, ['NBT'], 'to where it was asked');
  });

  // ---------- the walk the reach is counted from ----------

  await test('in use counts the GLOBAL WATERFALL and the units a break parked', async () => {
    const setups = (await req('GET', '/panel/setups')).body.setups;
    const s = setups.find(x => (x.waterfall?.rungs || []).length);
    assert(s, 'the seed has a setup with a global waterfall');
    const tagId = s.waterfall.rungs.find(r => r.tagId).tagId;
    // A tag that sits ONLY in the global waterfall is in use: deleting it would empty a
    // ladder every linked break serves from, which is the thing this refusal is for.
    const del = await req('DELETE', `/panel/tags/${tagId}`);
    eq(del.status, 409, 'refused');
    assert(del.body.usedBy.includes(s.name), `the setup is named (got ${JSON.stringify(del.body.usedBy)})`);
  });

  // ---------- the live boundary is unchanged by any of it ----------

  await test('a unit PARKED by a break that follows the global waterfall is still in use', async () => {
    const setups = (await req('GET', '/panel/setups')).body.setups;
    const s = setups.find(x => (x.waterfall?.rungs || []).length
      && (x.sections[0].slots.preroll.rungs || []).length > 1);
    assert(s, 'the seed has a setup with both a global waterfall and a deep pre-roll');
    const parked = s.sections[0].slots.preroll.rungs[1].tagId;
    // Switch the break's fall to the global waterfall: its own units are KEPT (`ownRungs`)
    // and stop serving. Kept is still held — the way back exists — so the tag is in use.
    const sec = JSON.parse(JSON.stringify(s.sections));
    sec[0].slots.preroll = {
      ...sec[0].slots.preroll, waterfallSource: 'setup',
      ownRungs: sec[0].slots.preroll.rungs.map(r => ({ type: 'tag', on: r.on !== false, tagId: r.tagId })),
    };
    delete sec[0].slots.preroll.rungs;
    const moved = await req('PATCH', `/panel/setups/${s.id}`, { sections: sec });
    eq(moved.status, 200, 'the break now follows the global waterfall');
    const after = (await req('GET', `/panel/setups/${s.id}`)).body.setup;
    assert((after.sections[0].slots.preroll.ownRungs || []).some(r => r.tagId === parked), 'the unit is parked');
    const del = await req('DELETE', `/panel/tags/${parked}`);
    eq(del.status, 409, 'a parked unit is in use — deleting it would break the way back');
    assert(del.body.usedBy.includes(after.name), 'and the setup is named');
  });

  // ---------- the live boundary is unchanged by any of it ----------

  await test('visibility governs the PICK, never the serving — the player’s JSON is untouched', async () => {
    const t = await byName('GAM standard');
    const s = t.setups[0];
    const k = (await req('GET', '/panel/keys')).body.keys.find(x => x.adSetupId === s.id);
    assert(k, 'a connected setup fills an integration');
    await req('POST', `/panel/setups/${s.id}/publish`);
    await req('POST', `/panel/keys/${k.id}/publish`);
    const before = (await req('GET', `/panel/live/${k.key}`)).body;
    eq(before.unittpl[t.name], t.url, 'the template rides by name, at its own URL');
    // Narrow the template to exactly where it is connected and republish nothing:
    // templates resolve LIVE, and visibility is about who may PICK, so the answer stands.
    const narrowed = await req('PATCH', `/panel/templates/${t.id}`, { properties: t.propertiesInUse });
    eq(narrowed.status, 200, 'narrowed');
    const after = (await req('GET', `/panel/live/${k.key}`)).body;
    eq(after.unittpl, before.unittpl, 'the player is handed exactly what it was before');
  });

  // ---------- THE PUBLISH PLANE (16 Sep) ----------

  await test('a template versions and restores like the other two objects', async () => {
    const t = (await req('POST', '/panel/templates', {
      name: 'Versioned', provider: 'ima', url: 'https://a.example/v1?cb=[CACHEBUSTER]',
    })).body.template;
    eq((await req('POST', `/panel/templates/${t.id}/publish`)).body.version.v, 1, 'v1');
    await req('PATCH', `/panel/templates/${t.id}`, { url: 'https://a.example/v2?cb=[CACHEBUSTER]' });
    eq((await req('POST', `/panel/templates/${t.id}/publish`)).body.version.v, 2, 'v2');

    const rail = (await req('GET', `/panel/templates/${t.id}/versions`)).body;
    eq(rail.liveVersion, 2, 'the rail knows what is on air');
    eq(rail.versions.length, 2, 'and both versions');
    assert(rail.versions.some(v => (v.changes || []).some(c => c.field === 'url')),
      `a version says which field moved (got ${JSON.stringify(rail.versions[0].changes)})`);

    // Restore is forward-only here too: v1's content lands as v3.
    const back = await req('POST', `/panel/templates/${t.id}/versions/1/restore`);
    eq(back.status, 200, 'restored');
    eq(back.body.version.v, 3, 'as a NEW version');
    const now = (await listTemplates()).find(x => x.id === t.id);
    eq(now.url, 'https://a.example/v1?cb=[CACHEBUSTER]', 'the draft followed the restore');
  });

  await test('publishing nothing is refused, exactly as it is for a setup', async () => {
    const t = (await req('POST', '/panel/templates', {
      name: 'Twice', provider: 'ima', url: 'https://b.example/v1?cb=[CACHEBUSTER]',
    })).body.template;
    await req('POST', `/panel/templates/${t.id}/publish`);
    const again = await req('POST', `/panel/templates/${t.id}/publish`);
    eq(again.status, 409, 'refused');
    eq(again.body.error, 'nothing_to_publish', 'by code');
  });

  await test('a template publish names its blast radius — the whole reason it is shared', async () => {
    const t = await byName('GAM standard');
    assert(t.usedBy >= 1 && t.setupCount >= 1, 'the seed connects it');
    await req('PATCH', `/panel/templates/${t.id}`, { url: 'https://moved.example/vast?cb=[CACHEBUSTER]' });
    const pub = await req('POST', `/panel/templates/${t.id}/publish`);
    eq(pub.status, 200, 'published');
    assert((pub.body.warnings || []).some(w => /ad units? in \d+ ad setups? pick/.test(w)),
      `counts the units and the setups (got ${JSON.stringify(pub.body.warnings)})`);
  });

  await test('an ad setup is TOLD when a template under it goes out — and does NOT version', async () => {
    const t = await byName('GAM standard');
    const target = t.setups[0];
    const before = (await req('GET', `/panel/setups/${target.id}`)).body.setup;
    eq(before.templateNews.length, 0, 'nothing to report while the template is where it was');

    await req('PATCH', `/panel/templates/${t.id}`, { url: 'https://moved.example/vast?cb=[CACHEBUSTER]' });
    await req('POST', `/panel/templates/${t.id}/publish`);

    const after = (await req('GET', `/panel/setups/${target.id}`)).body.setup;
    eq(after.liveVersion, before.liveVersion, 'the ad setup did NOT move a version — it did not change');
    eq(after.unpublishedCount, before.unpublishedCount, 'and has no new work waiting');
    eq(after.templateNews.length, 1, 'but it is told');
    eq(after.templateNews[0].name, t.name, 'which template');
    assert(after.templateNews[0].v >= 2 && after.templateNews[0].actor, 'with the version and who');
  });

  await test('a setup that has published SINCE the template went out has nothing to report', async () => {
    const t = await byName('GAM standard');
    const target = t.setups[0];
    await req('PATCH', `/panel/templates/${t.id}`, { url: 'https://moved.example/vast?cb=[CACHEBUSTER]' });
    await req('POST', `/panel/templates/${t.id}/publish`);
    eq((await req('GET', `/panel/setups/${target.id}`)).body.setup.templateNews.length, 1, 'told');

    // Publishing the setup brings its own line level with the template's. (A real edit —
    // `nothing_to_publish` refuses a publish that would change nothing.)
    const renamed = await req('PATCH', `/panel/setups/${target.id}`, { name: `${target.name} II` });
    eq(renamed.status, 200, 'the setup really changed');
    eq((await req('POST', `/panel/setups/${target.id}/publish`)).status, 200, 'and published');
    eq((await req('GET', `/panel/setups/${target.id}`)).body.setup.templateNews.length, 0,
      'caught up — the news is what moved since this setup last went out');
  });

  await test('the reach is UNIT-first, and the head count is a number the rows account for', async () => {
    const t = await byName('GAM standard');
    // The flaw this replaced: the head counts AD UNITS, so a list of AD SETUPS cannot add up
    // — one unit deployed in three setups makes the rows exceed the head. Measured on this
    // very world before the change: head 3, setup rows 2+1+1+1 = 5.
    eq(t.units.length, t.usedBy, 'one row per ad unit — the rows ARE the head count');
    eq(t.units.map(u => u.name).sort(), [...t.usedByNames].sort(), 'and they are the same units');

    // Every unit says where it sits, and nothing says it sits somewhere it does not.
    assert(t.units.every(u => u.setups.length >= 1), 'a connected unit sits in at least one setup');
    const named = new Set(t.setups.map(s => s.id));
    assert(t.units.every(u => u.setups.every(x => named.has(x.id))),
      'no unit names an ad setup the reach does not know');
    // The union of the units' addresses is exactly the setups counted beside them.
    const union = new Set(t.units.flatMap(u => u.setups.map(x => x.id)));
    eq([...union].sort(), [...named].sort(), 'the addresses and the setup count agree');
    assert(t.units.some(u => u.setups.length > 1),
      'the seed has a unit in more than one setup — the case the old shape could not count');
  });
}
