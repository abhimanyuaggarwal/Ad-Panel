// test/cases/12-version-notes.spec.js — version notes on publish and restore.
// Bodies are unchanged from the single-file suite; helpers come from ../harness.js.

export default async function run({ test, req, eq, assert, freshSetup, patchSlot, patchDrive, VALID_KEY, PLAYER_MIN }) {
  // ---------- VERSION NOTES (6 Sep) ----------
  // Publish and restore both take one line in the person's own words; it travels with
  // the version and reads back in the rail. Clipped server-side, never refused.

  await test('a publish carries its note; a restore carries its own — read back under each version', async () => {
    await req('PATCH', '/panel/setups/as_2', { sections: [{ slots: { preroll: { behaviour: { podAds: 2 } } } }] });
    const pub = await req('POST', '/panel/setups/as_2/publish', { note: 'Two ads a break — Diwali trial' });
    eq(pub.status, 200, 'published with a note');
    eq(pub.body.version.note, 'Two ads a break — Diwali trial', 'the version carries it');
    const rst = await req('POST', '/panel/setups/as_2/versions/1/restore', { note: 'Trial off — back to one ad' });
    eq(rst.status, 200, 'restored with a note');
    const vs = (await req('GET', '/panel/setups/as_2/versions')).body.versions;
    eq(vs[0].note, 'Trial off — back to one ad', 'the restore\u2019s note rides the NEW version');
    eq(vs[0].restoredFrom, 1, 'with its provenance');
    eq(vs[1].note, 'Two ads a break — Diwali trial', 'the publish\u2019s note stands under its own');
    assert(vs[vs.length - 1].note === null || vs[vs.length - 1].note === undefined, 'a version without a note claims none');
    // Overlong notes are clipped, never refused — a hand-typed line is not a payload.
    // (A note alone mints nothing: publish still refuses when no change stands.)
    const idle = await req('POST', '/panel/setups/as_2/publish', { note: 'just a note' });
    eq(idle.status, 409, 'a note with nothing to publish is still nothing to publish');
    await req('PATCH', '/panel/setups/as_2', { sections: [{ slots: { preroll: { behaviour: { podAds: 3 } } } }] });
    const long = await req('POST', '/panel/setups/as_2/publish', { note: 'x'.repeat(500) });
    eq(long.status, 200, 'accepted');
    eq(long.body.version.note.length, 200, 'clipped at 200');
  });
}
