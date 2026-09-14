// test/cases/13-session.spec.js — THE FRONT DOOR (8 Sep): the session the console holds, who
// gets in, and the one refusal left. Over HTTP, like every other case file.
//
// What is pinned here is the CONTRACT the door and the gate both read — that a reset opens on a
// world somebody is standing in, that sign-out really empties the session, that any address
// shaped like one gets in, and that a known address keeps the identity the fixture gave it.
// What is not pinned is any check on whether the person owns the address, because there is
// none: see api/store/session.js.

export default async function run({ test, req, eq, assert, BASE }) {
  await test('a reset opens on a world somebody is standing in — the console has always painted the rooms', async () => {
    const s = await req('GET', '/panel/session');
    eq(s.status, 200, 'GET /panel/session');
    eq(s.body.signedIn, true, 'signed in after a reset');
    eq(s.body.account.name, 'Priya Sharma', 'the fixture person, the same one the band names');
    eq(s.body.account.email, 'priya.sharma@example.com', 'their address');
    // The band reads the session now, and the fixture still serves meta.me — both name
    // the same person, so the header cannot disagree with the door.
    const m = await req('GET', '/panel/meta');
    eq(m.body.me.email, s.body.account.email, 'meta.me and the session agree');
  });

  await test('the door is told what it needs and nothing private: the accounts remembered, the domain, who grants access', async () => {
    const { body } = await req('GET', '/panel/session');
    eq(body.workDomain, 'example.com', 'the domain it shows as the example of one');
    eq(body.remembered.length, 2, 'two accounts — a picker with one row lies about having a choice');
    eq(body.remembered.map(a => a.via), ['google', 'google'], 'who remembers each');
    eq(body.accessOwner.name, 'Priya Sharma', 'Request access is never a dead end');
    assert(body.remembered.every(a => !('provider' in a)), 'the raw store field never reaches a view');
  });

  await test('sign out empties the session — the gate finds nothing and the browser lands on the door', async () => {
    const out = await req('DELETE', '/panel/session');
    eq(out.status, 200, 'DELETE /panel/session');
    eq(out.body, { signedIn: false, account: null }, 'the act’s own answer');
    const after = await req('GET', '/panel/session');
    eq(after.body.signedIn, false, 'nobody is signed in');
    eq(after.body.account, null, 'and nobody is named');
    // The door still needs its furniture with no session — that is when it is on screen.
    eq(after.body.remembered.length, 2, 'the remembered accounts survive a sign-out');
    eq(after.body.workDomain, 'example.com', 'so does the domain');
  });

  await test('a known address signs in — the same seam the typed field and the remembered row both use', async () => {
    await req('DELETE', '/panel/session');
    const r = await req('POST', '/panel/session', { email: 'rohit.verma@example.com' });
    eq(r.status, 200, 'POST /panel/session');
    eq(r.body.signedIn, true, 'in');
    eq(r.body.account.name, 'Rohit Verma', 'and it is the person whose address it was');
    eq((await req('GET', '/panel/session')).body.account.role, 'monetization',
      'the session holds THAT account, not the fixture’s first');
  });

  await test('the address is read case-blind and untrimmed — nobody is refused for typing it in caps', async () => {
    await req('DELETE', '/panel/session');
    const r = await req('POST', '/panel/session', { email: '  Priya.Sharma@Example.com ' });
    eq(r.status, 200, 'a capitalised, padded address');
    eq(r.body.account.email, 'priya.sharma@example.com', 'answers as the account holds it');
  });

  await test('something that is not an address is refused for its shape, before any lookup', async () => {
    for (const bad of ['priya', 'priya@', '@example.com', 'priya at example.com', '']) {
      const r = await req('POST', '/panel/session', { email: bad });
      eq(r.status, 400, `refusing ${JSON.stringify(bad)}`);
      eq(r.body.error, 'bad_address', 'the code');
      eq(r.body.field, 'email', 'and where it belongs on screen');
    }
    // A refused sign-in changes nothing.
    eq((await req('GET', '/panel/session')).body.signedIn, true, 'the session still stands');
  });

  // THE DOOR IS OPEN (8 Sep): the wrong-domain and no-account refusals are gone. There is no
  // exchange behind this door, so a refusal saying "no account here for you" was a lock with no
  // key — it turned away the people meant to walk around the prototype. Shape is all that is
  // checked, and these cases pin exactly that, so putting a guest list back is a deliberate act.
  await test('any address shaped like one gets in — no domain gate, no guest list', async () => {
    for (const addr of ['someone.new@example.com', 'priya.sharma@gmail.com', 'a@b.co']) {
      await req('DELETE', '/panel/session');
      const r = await req('POST', '/panel/session', { email: addr });
      eq(r.status, 200, `signing in ${addr}`);
      eq(r.body.signedIn, true, 'in');
      eq(r.body.account.email, addr, 'as the address given');
    }
  });

  await test('an address nobody knows is read as a person — a name from it, and NO role invented', async () => {
    const r = await req('POST', '/panel/session', { email: 'Asha.Rao-Nair@somewhere.co.in' });
    eq(r.status, 200, 'in');
    eq(r.body.account.name, 'Asha Rao Nair', 'the local part\u2019s words, capitalised');
    eq(r.body.account.initials, 'AR', 'two letters for the band\u2019s mark');
    eq(r.body.account.role, null, 'we were not told a role, so none is drawn');
    eq(r.body.account.email, 'asha.rao-nair@somewhere.co.in', 'the address, case-folded');
  });

  await test('a KNOWN address keeps the identity the fixture gave it, never a derived one', async () => {
    const r = await req('POST', '/panel/session', { email: 'rohit.verma@example.com' });
    eq(r.body.account.name, 'Rohit Verma', 'not "Rohit Verma" by derivation but by record');
    eq(r.body.account.role, 'monetization', 'the role only a known account has');
  });

  await test('a visitor is not remembered — the picker holds accounts a provider vouched for', async () => {
    await req('POST', '/panel/session', { email: 'walkup@nowhere.com' });
    const { body } = await req('GET', '/panel/session');
    eq(body.account.email, 'walkup@nowhere.com', 'signed in');
    eq(body.remembered.length, 2, 'and the remembered rows are the fixture\u2019s two, untouched');
    assert(!body.remembered.some(a => a.email === 'walkup@nowhere.com'), 'the walk-up is not among them');
  });

  await test('a signed-out console keeps its work: the rooms answer, so nothing is lost by logging out', async () => {
    const before = (await req('GET', '/panel/keys')).body.keys.length;
    await req('DELETE', '/panel/session');
    // Nothing authenticates a request yet (ARCHITECTURE §11) — this pins that the SESSION
    // is the only thing sign-out drops. When auth lands these become 401s, deliberately.
    eq((await req('GET', '/panel/keys')).body.keys.length, before, 'the integrations are where they were');
    eq((await req('GET', '/panel/setups')).status, 200, 'and so are the ad setups');
  });

  await test('the door itself is served, and it is the console’s own page', async () => {
    const res = await fetch(`${BASE}/login.html`);
    eq(res.status, 200, 'GET /login.html');
    const html = await res.text();
    assert(html.includes('css/11-login.css'), 'wearing its own plate');
    assert(html.includes('css/01-base.css') && html.includes('css/10-surfaces.css'),
      'on the whole cascade, so every borrowed control is the same object as in the console');
    assert(html.includes('js/login.js'), 'and driven by the door');
  });
}
