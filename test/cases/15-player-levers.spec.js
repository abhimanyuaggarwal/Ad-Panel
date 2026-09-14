// test/cases/15-player-levers.spec.js — THE EIGHT SECTIONS (11 Sep, docs/PLAYER-LEVERS.xlsx).
// The player's own config block handed the panel 25 levers. These cases pin the three
// things that decide whether they were placed well rather than merely added:
//   1  what the seam REFUSES, and that it refuses by name
//   2  what a named config may FORK, and that everything else is refused by name
//   3  what the PLAYER is handed — the five namespaces, at one boundary, sentinels intact

export default async function run({ test, req, eq, assert }) {
  const getKey = async id => (await req('GET', `/panel/keys/${id}`)).body.key;

  await test('the eight sections default to what the player already does — absence changes nothing', async () => {
    // A player sent with only its required field comes back complete, and every default
    // is the one the player's own config block documents. An integration saved before
    // any of this existed therefore behaves exactly as it behaved.
    const r = await req('PATCH', '/panel/keys/key_2', { player: { playbackMode: 'inline' } });
    eq(r.status, 200, 'a bare player is accepted');
    const p = r.body.key.player;
    eq(p.quality, 'auto', 'Quality: auto');
    eq(p.muted, false, 'Starts muted: no');
    eq(p.rememberVolume, true, 'the viewer’s volume is remembered');
    eq(p.rememberAudioLang, true, 'and their audio language');
    eq(p.rememberCaptions, true, 'and their captions');
    eq(p.controlsMode, 'full', 'Controls: full');
    eq(JSON.stringify(p.hiddenControls), '[]', 'nothing hidden');
    eq(JSON.stringify(p.playbackRates), '[0.5,1,1.25,1.5,2]', 'all five speeds');
    eq(p.controlsAutoHideMs, 5000, 'controls hide after 5s');
    eq(p.dock, 'lb', 'docks bottom-left');
    eq(p.autoPausePct, 0, 'no visibility pause');
    eq(p.loop, false, 'no loop');
    eq(p.endScreen, 'none', 'no end screen');
    eq(p.analyticsLevel, 3, 'full reporting');
    eq(p.viewAfterMs, 3000, 'a view counts after 3s');
    eq(p.heartbeatMs, 10000, 'heartbeat every 10s');
    eq(p.comscoreId, '', 'and no vendor ids invented');
  });

  await test('every refusal names the field and the number found next to the number required', async () => {
    const bad = async (player, what) => {
      const r = await req('PATCH', '/panel/keys/key_2', { player: { playbackMode: 'inline', ...player } });
      eq(r.status, 400, what);
      return r.body.errors.map(e => e.message).join(' | ');
    };
    // Q11, ANSWERED: 0 is off and 10-100 is a threshold, so 1-9 is a value the player
    // would silently ignore — the dark setting this panel exists to prevent.
    let msg = await bad({ autoPausePct: 4 }, 'a visibility threshold under the floor is refused');
    assert(/below 10%/i.test(msg), `and says the floor (got ${msg})`);
    assert(/switch it off/i.test(msg), 'and offers the answer that was probably meant');
    eq((await req('PATCH', '/panel/keys/key_2', { player: { playbackMode: 'inline', autoPausePct: 0 } })).status, 200,
      '0 is off, and legal');
    eq((await req('PATCH', '/panel/keys/key_2', { player: { playbackMode: 'inline', autoPausePct: 10 } })).status, 200,
      '10 is the floor, and legal');

    // Q6: the control vocabulary is the PLAYER TEAM's, held exactly as tag macros are.
    msg = await bad({ hiddenControls: ['volume', 'teleport'] }, 'an invented control name is refused');
    assert(msg.includes('teleport'), `by name (got ${msg})`);
    assert(msg.includes('fullscreen'), 'and the whole vocabulary is offered back');

    msg = await bad({ playbackRates: [1, 3] }, 'a speed the player does not offer is refused');
    assert(msg.includes('3'), `by value (got ${msg})`);

    msg = await bad({ brandColor: 'red' }, 'a colour the player cannot paint is refused');
    assert(/hex colour/i.test(msg), `and says what one looks like (got ${msg})`);

    msg = await bad({ logoUrl: 'toi-logo.png' }, 'a logo without a full URL is refused');
    assert(/full URL/i.test(msg), `and says why — the player loads it (got ${msg})`);

    msg = await bad({ analyticsLevel: 9 }, 'a reporting level outside 1-3 is refused');
    assert(/Events reported/i.test(msg), `wearing its UI name, never its JSON key (got ${msg})`);
  });

  await test('1x is never removable — a viewer must be able to get back to normal speed', async () => {
    const r = await req('PATCH', '/panel/keys/key_2', { player: { playbackMode: 'inline', playbackRates: [0.5, 2] } });
    eq(r.status, 200, 'the set is accepted');
    assert(r.body.key.player.playbackRates.includes(1), 'and 1x is put back rather than refused');
    eq(JSON.stringify(r.body.key.player.playbackRates), '[0.5,1,2]', 'in the player’s own order');
  });

  await test('a custom config carries ONLY what it overrides — and inherits the rest live', async () => {
    await req('PATCH', '/panel/keys/key_2', { player: {
      playbackMode: 'inline', loop: false, endScreen: 'related', controlsMode: 'full', brandColor: '#111111' } });
    const r = await req('PATCH', '/panel/keys/key_2', { playerConfigs: [
      { name: 'shortsfeed', loop: true, endScreen: 'none', controlsMode: 'minimal' },
      { name: 'plain' },
    ] });
    eq(r.status, 200, 'accepted');
    const [feed, plain] = r.body.key.playerConfigs;
    eq(feed.loop, true, 'a shorts feed loops');
    eq(feed.endScreen, 'none', 'and shows no end screen');
    eq(feed.controlsMode, 'minimal', 'and carries minimal controls');
    // SPARSE IN STORAGE: what a config never spoke about is simply not there —
    eq(plain.loop, undefined, 'a config that says nothing about loop holds nothing about loop');
    eq(plain.brandColor, undefined, 'nor about the brand');
    // — and RESOLVED ON THE WIRE, live, over whatever the default says today.
    eq((await req('POST', '/panel/keys/key_2/publish')).status, 200, 'published');
    const k = await getKey('key_2');
    let live = (await req('GET', `/panel/live/${k.key}`)).body;
    const plainLive = live.playerConfigs.find(c => c.name === 'plain');
    eq(plainLive.player.loop, false, 'the wire fills loop from the default');
    eq(plainLive.theme.primary, '#111111', 'and the brand');
    eq(live.playerConfigs.find(c => c.name === 'shortsfeed').controls.mode, 'minimal', 'while an override wins where it exists');
    // Move the default: the config that never spoke follows; the one that did stays.
    await req('PATCH', '/panel/keys/key_2', { player: { ...k.player, brandColor: '#222222', loop: true } });
    await req('POST', '/panel/keys/key_2/publish');
    live = (await req('GET', `/panel/live/${k.key}`)).body;
    eq(live.playerConfigs.find(c => c.name === 'plain').theme.primary, '#222222', 'live inheritance — the default moved, so did the config');
    eq(live.playerConfigs.find(c => c.name === 'plain').player.loop, true, 'on every field it never overrode');
    eq(live.playerConfigs.find(c => c.name === 'shortsfeed').player.loop, true, 'an override equal to the new default is still the override');
  });

  await test('any field may be overridden — held to the SAME rules as the default, refused by name', async () => {
    // The six-field rule and its refusal list are gone (13 Sep, user call): a config may
    // override anything, including measurement. What replaces the refusals is the same
    // normalizer the default runs through — so a bad override is refused exactly as a
    // bad default is — and VISIBILITY: the review names every override where it lives.
    let r = await req('PATCH', '/panel/keys/key_2', { playerConfigs: [{ name: 'x', analyticsLevel: 1, gaId: 'UA-2', brandColor: '#000000', passiveVolume: 20 }] });
    eq(r.status, 200, 'measurement, brand and volume may all be overridden');
    eq(r.body.key.playerConfigs[0].analyticsLevel, 1, 'and are held as overrides');

    const bad = async (cfg, expect, what) => {
      const rr = await req('PATCH', '/panel/keys/key_2', { playerConfigs: [{ name: 'x', ...cfg }] });
      eq(rr.status, 400, what);
      const msg = rr.body.errors.map(e => e.message).join(' | ');
      assert(expect.test(msg), `refused by name (got ${msg})`);
    };
    await bad({ brandColor: 'red' }, /hex colour/i, 'a colour the player cannot paint is refused on a config too');
    await bad({ autoPausePct: 4 }, /below 10%/i, 'and the visibility floor holds on a config');
    await bad({ hiddenControls: ['teleport'] }, /teleport/, 'and the control vocabulary');
    await bad({ startVolume: 50 }, /startVolume is gone/, 'and the retired key stays refused by name');

    // The override is one line in the rail, named where it lives. (A brand-new config is
    // one `added` line, so the config has to be on air before a field inside it can move.)
    await req('PATCH', '/panel/keys/key_2', { playerConfigs: [{ name: 'x', analyticsLevel: 1 }] });
    eq((await req('POST', '/panel/keys/key_2/publish')).status, 200, 'x is on air');
    const k2 = await getKey('key_2');
    await req('PATCH', '/panel/keys/key_2', { playerConfigs: [{ ...k2.playerConfigs[0], analyticsLevel: 2, gaId: 'UA-9' }] });
    const v = (await req('GET', '/panel/keys/key_2/versions')).body;
    const mine = v.unpublished.filter(c => c.where === 'Player configs · x');
    assert(mine.some(c => c.field === 'analyticsLevel'), `a measurement override is named where it lives (got ${JSON.stringify(v.unpublished)})`);
    assert(mine.some(c => c.field === 'gaId'), 'and a NEW override on an existing config is one line too');
  });

  await test('the player is handed its own config block — five namespaces, one boundary', async () => {
    await req('PATCH', '/panel/keys/key_2', { player: {
      playbackMode: 'inline', autoplay: 'auto', passiveVolume: 60, muted: true, playback: 'passive',
      quality: 'auto', loop: true, endScreen: 'related', dock: 'rb', autoPausePct: 40,
      rememberVolume: true, rememberCaptions: false,
      controlsMode: 'minimal', hiddenControls: ['share'], playbackRates: [1, 2], controlsAutoHideMs: 3000,
      brandColor: '#1a73e8', textColor: '#ffffff', logoUrl: 'https://static.toi.in/logo.png',
      analyticsLevel: 2, viewAfterMs: 2000, heartbeatMs: 0, comscoreId: 'cs-1',
    } });
    eq((await req('POST', '/panel/keys/key_2/publish')).status, 200, 'published');
    const k = await getKey('key_2');
    const live = (await req('GET', `/panel/live/${k.key}`)).body;

    eq(live.pref.volume, 1, 'pref.volume is remembered');
    eq(live.pref.capLang, 0, 'and captions are not — 0/1, the player’s own encoding');
    // Q1 IS ANSWERED AT THE BOUNDARY, not in the model: the panel keeps on/off/auto
    // (changing its vocabulary is the player team's call) and `auto` is mutedOnScroll.
    eq(live.playback.autoPlay, 'mutedOnScroll', 'the panel’s Auto is the player’s mutedOnScroll');
    eq(live.playback.autoPlayVol, 60, 'the one Passive volume rides playback');
    eq(live.playback.playMode, 'passive', 'the playback mode');
    eq(live.playback.muted, true, 'and whether it starts muted');
    eq(live.playback.loop, true, 'loop');
    eq(live.playback.endScreen, 'related', 'and the end screen');
    eq(live.playback.pip, 'rb', 'a dock position is its corner');
    eq(live.playback.autoPause, 40, 'the visibility threshold as a number');
    eq(live.theme.primary, '#1a73e8', 'the brand colour, lower-cased');
    eq(live.theme.logo, 'https://static.toi.in/logo.png', 'and the logo');
    eq(live.controls.mode, 'minimal', 'the controls mode');
    eq(JSON.stringify(live.controls.hideControls), '["share"]', 'what is hidden');
    eq(JSON.stringify(live.controls.playbackRates), '[1,2]', 'and the speeds offered');
    eq(live.controls.autoHide, 3000, 'auto-hide in MILLISECONDS — seconds are the UI’s');
    eq(live.analytics.level, 2, 'the reporting level');
    eq(live.analytics.viewDuration, 2000, 'in milliseconds too');
    eq(live.analytics.interval, 0, '0 survives the round trip — off is a value, not an absence');
    eq(live.analytics.comscoreId, 'cs-1', 'the vendor id that was set');
    eq(live.analytics.nielsenId, null, 'and null for the ones that were not');
    // The keys the player reads TODAY are untouched, so nothing it already parses moves.
    eq(live.player.passiveVolume, 60, 'the existing player node is unchanged');
    eq(live.player.expandInMini, true, 'every key it already reads is still there');
  });

  await test('docking off is the empty string, not the word — the player’s contract, unchanged', async () => {
    await req('PATCH', '/panel/keys/key_2', { player: { playbackMode: 'inline', dock: 'off' } });
    await req('POST', '/panel/keys/key_2/publish');
    const k = await getKey('key_2');
    eq((await req('GET', `/panel/live/${k.key}`)).body.playback.pip, '',
      'blank means disabled, which is what the player already expects');
  });

  await test('nothing reaches the player until it is published — the plane holds for all of it', async () => {
    const k0 = await getKey('key_2');
    await req('POST', '/panel/keys/key_2/publish').catch(() => {});
    const before = (await req('GET', `/panel/live/${k0.key}`)).body.theme.primary;
    await req('PATCH', '/panel/keys/key_2', { player: { ...k0.player, brandColor: '#00ff00' } });
    eq((await req('GET', `/panel/live/${k0.key}`)).body.theme.primary, before,
      'a saved brand colour is a draft — the player still has the old one');
    eq((await req('POST', '/panel/keys/key_2/publish')).status, 200, 'published');
    eq((await req('GET', `/panel/live/${k0.key}`)).body.theme.primary, '#00ff00', 'now it is on air');
  });

  await test('a moved lever is one line in the version rail, wearing its UI name', async () => {
    const k = await getKey('key_3');
    await req('PATCH', '/panel/keys/key_3', { player: { ...k.player, controlsMode: 'minimal', heartbeatMs: 30000 } });
    const r = (await req('GET', '/panel/keys/key_3/versions')).body;
    const words = r.unpublished.map(c => `${c.field}`);
    assert(words.includes('controlsMode'), `the controls move is named (got ${JSON.stringify(words)})`);
    assert(words.includes('heartbeatMs'), 'and so is the heartbeat');
  });
}
