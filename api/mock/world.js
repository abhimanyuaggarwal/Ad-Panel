// panel/api/mock/world.js — the only place invented data lives.
// resetWorld() rebuilds everything and re-issues the same ids every time.
//
// TWO ROOMS world: 7 ad setups feed 7 integrations, ONE EACH (26 Aug, DRIVING-SCOPE —
// the 1:1 promise; as_1 used to be shared by two). A setup carries its PLACEMENTS and,
// on each placement, HOW ITS ADS BEHAVE — per slot (25 Aug). The integration carries
// its PLAYER and its DRIVE (the per-break quick decisions). Both start from the presets
// below, which are served in meta and stamp values at creation — a photocopy, never a
// live link.

import {
  resetState, createSetup, createKey, createTag, createTemplate,
  setGamUnits, setAccounts, getKey, getSetup, seedPublish, updateSetup,
} from '../store.js';
import { BASE_UNITS, PENDING_UNITS } from './gamunits.js';

// --- THE SIGNED-IN PERSON (7 Sep, user call) -------------------------------
// The property switcher left the header band and a profile mark took its seat, so the
// band has to name SOMEBODY — and a name is invented data, which means it lives here and
// nowhere else. Auth is tech's to wire: when it lands, this object comes from the session
// instead of the fixture and nothing in web/ has to move (the panel reads `meta.me`).
// The store still stamps a write "You", which is what your own avatar reads next to.
export const ME = {
  name: 'Priya Sharma',
  initials: 'PS',
  role: 'ad ops',
  email: 'priya.sharma@example.com',
};

// --- WHO THE CONSOLE KNOWS (8 Sep, user call — the front door) -------------
// The panel grew a real Log out before it had a way back in. The front door needs two
// things a fixture has to supply: the addresses the console signs in, and the accounts it
// has seen before — the "Continue as …" row states a remembered account as a FACT, and a
// picker holding one row is a picker lying about having a choice. So there are two, and the
// second is Rohit, whose name already signs versions in the seeded history.
// `provider` is what remembers the account. The exchange behind it is not built (see
// store/session.js): the row is the same one seam the typed address goes through.
export const WORK_DOMAIN = 'example.com';
// Who Request access goes to. A door that says "ask someone" without naming them is a
// dead end, and a name is invented data — so it is here, and the dialog reads it.
export const ACCESS_OWNER = { name: 'Priya Sharma', role: 'ad ops', email: 'priya.sharma@example.com' };
export const ACCOUNTS = [
  { ...ME, provider: 'google' },
  {
    name: 'Rohit Verma',
    initials: 'RV',
    role: 'monetization',
    email: 'rohit.verma@example.com',
    provider: 'google',
  },
];

// --- Creation presets (the old three shapes, reborn as value-sets) ---------
// A preset STAMPS a whole player at creation — a photocopy, never a live link. Since the
// card grew to hold all 25 levers (11 Sep) the presets carry them too: a new integration that
// landed on raw defaults would wear a red brand colour and full controls on a feed, and
// the first thing anyone did would be to correct three sections by hand. The three
// presets are the three shapes the estate actually runs.
export const PLAYER_PRESETS = [
  {
    // A FEED. Passive, loops, carries almost no chrome, docks when scrolled away.
    name: 'MiniTV',
    values: {
      autoplay: 'auto', passiveVolume: 60, playbackMode: 'inline', fallbackMediaId: 'med_minitv_default',
      playback: 'passive', quality: 'auto', muted: true,
      controlsMode: 'minimal', hiddenControls: ['speed', 'share'], playbackRates: [1, 1.5, 2],
      controlsAutoHideMs: 3000, dock: 'rb', autoPausePct: 50,
      loop: true, endScreen: 'none',
      brandColor: '#e02020', textColor: '#ffffff', logoUrl: '',
      analyticsLevel: 3, viewAfterMs: 2000, heartbeatMs: 10000,
    },
  },
  {
    // AN ARTICLE PLAYER. Sits inside a story: quiet, full chrome, related at the end.
    name: 'ArticleShow',
    values: {
      autoplay: 'auto', passiveVolume: 80, playbackMode: 'inline', fallbackMediaId: 'med_article_default',
      playback: 'passive', quality: 'auto', muted: true,
      controlsMode: 'full', hiddenControls: [], playbackRates: [0.5, 1, 1.25, 1.5, 2],
      controlsAutoHideMs: 5000, dock: 'lb', autoPausePct: 30,
      loop: false, endScreen: 'related',
      brandColor: '#1a73e8', textColor: '#ffffff', logoUrl: '',
      analyticsLevel: 3, viewAfterMs: 3000, heartbeatMs: 10000,
    },
  },
  {
    // A DESTINATION. The viewer came for the video: active, loud, everything on.
    name: 'VideoShow',
    values: {
      autoplay: 'on', passiveVolume: 100, playbackMode: 'inline', fallbackMediaId: 'med_videoshow_default',
      playback: 'active', quality: 'auto', muted: false,
      controlsMode: 'full', hiddenControls: [], playbackRates: [0.5, 1, 1.25, 1.5, 2],
      controlsAutoHideMs: 5000, dock: 'rb', autoPausePct: 0,
      loop: false, endScreen: 'related',
      brandColor: '#c1272d', textColor: '#ffffff', logoUrl: '',
      analyticsLevel: 3, viewAfterMs: 3000, heartbeatMs: 10000,
    },
  },
];

// A rule preset stamps a PLACEMENT's behaviour: one set of values per slot. There is no
// session side left — Across-the-session went from fifteen fields to three on the
// 27 Aug scope audit and to nothing the same evening (user call): everything a preset
// used to carry there either belongs to a slot or was never ours to set.
export const RULE_PRESETS = [
  {
    name: 'MiniTV',
    values: {
      slots: {
        preroll: { start: 'start', podAds: 1, tagTimeoutMs: 1500 },
        midroll: { mode: 'cuepoints', cuepoints: [120, 360, 600, 840], podAds: 1, tagTimeoutMs: 1500 },
        postroll: { podAds: 1, tagTimeoutMs: 1500 },
      },
    },
  },
  {
    name: 'ArticleShow',
    values: {
      slots: {
        preroll: { start: 'deferred', deferSec: 7, podAds: 1, tagTimeoutMs: 1500 },
        midroll: { mode: 'cuepoints', cuepoints: [300], podAds: 1, tagTimeoutMs: 1500 },
        postroll: { podAds: 1, tagTimeoutMs: 1500 },
      },
    },
  },
  {
    name: 'VideoShow',
    values: {
      slots: {
        preroll: { start: 'start', podAds: 1, tagTimeoutMs: 1500 },
        midroll: { mode: 'cuepoints', cuepoints: [240, 660, 1080], podAds: 1, tagTimeoutMs: 1500 },
        postroll: { podAds: 1, tagTimeoutMs: 1500 },
      },
    },
  },
];

const P = Object.fromEntries(PLAYER_PRESETS.map(p => [p.name, p.values]));
const B = Object.fromEntries(RULE_PRESETS.map(p => [p.name, p.values]));
const ALL_SLOTS = ['preroll', 'midroll', 'postroll', 'outstream'];

// One placement: its ladders, plus the behaviour it was stamped from.
function place(name, preset, ladders = {}) {
  return {
    name,
    slots: Object.fromEntries(ALL_SLOTS.map(t => {
      const l = ladders[t] || { rungs: [] };
      // A mid-roll may carry BREAK GROUPS (31 Aug): each group's behaviour starts
      // from the preset and bends what it names — a photocopy, never a link.
      if (l.groups) {
        return [t, { direct: l.direct, groups: l.groups.map(g => ({
          rungs: g.rungs,
          waterfallSource: g.waterfallSource,
          behaviour: { ...preset.slots[t], ...(g.behaviour || {}) },
        })) }];
      }
      // A slot may BEND the preset it was stamped from (`behaviour:` beside its rungs),
      // the way a pod does — how a seeded break dissents from the shape, e.g. its own
      // header bidding answer where the surface's global is not the one it wants.
      return [t, { rungs: l.rungs, waterfallSource: l.waterfallSource,
        behaviour: { ...preset.slots[t], ...(l.behaviour || {}) }, direct: l.direct }];
    })),
  };
}

export function resetWorld(opts = {}) {
  resetState();
  setGamUnits(BASE_UNITS, PENDING_UNITS);
  // The door, on the same seam the ad unit directory uses: invented data pushed INTO the
  // store, never imported by it. A reset signs the first account in — the seeded world is
  // one somebody is already standing in.
  setAccounts(ACCOUNTS, WORK_DOMAIN, ACCESS_OWNER);

  // --- Ad tags: every tag is a video tag or a display tag ------------------
  const tag = (name, type, value, property, provider) => createTag({ name, type, value, property, provider }).id;

  const tVideo = {
    toiMwebVsPre: tag('TOI Mweb VideoShow Pre-roll', 'video', '/7176/toi/mweb/videoshow/preroll', 'TOI'),
    toiMwebVsMid: tag('TOI Mweb VideoShow Mid-roll', 'video', '/7176/toi/mweb/videoshow/midroll', 'TOI'),
    toiMwebVsPost: tag('TOI Mweb VideoShow Post-roll', 'video', '/7176/toi/mweb/videoshow/postroll', 'TOI'),
    toiMwebAsPre: tag('TOI Mweb ArticleShow Pre-roll', 'video', '/7176/toi/mweb/articleshow/preroll', 'TOI'),
    toiWebVsPre: tag('TOI Desktop VideoShow Pre-roll', 'video', '/7176/toi/web/videoshow/preroll', 'TOI'),
    toiWebVsMid: tag('TOI Desktop VideoShow Mid-roll', 'video', '/7176/toi/web/videoshow/midroll', 'TOI'),
    toiShortsPre: tag('TOI Shorts Pre-roll', 'video', '/7176/toi/mweb/shorts/preroll', 'TOI'),
    etMiniPre: tag('ET MiniTV Pre-roll', 'video', '/7176/et/app/minitv/preroll', 'ET'),
    etMiniMid: tag('ET MiniTV Mid-roll', 'video', '/7176/et/app/minitv/midroll', 'ET'),
    etWebAsPre: tag('ET Desktop ArticleShow Pre-roll', 'video', '/7176/et/web/articleshow/preroll', 'ET'),
    nbtMwebVsPre: tag('NBT Mweb VideoShow Pre-roll', 'video', '/7176/nbt/mweb/videoshow/preroll', 'NBT'),
    nbtMwebVsMid: tag('NBT Mweb VideoShow Mid-roll', 'video', '/7176/nbt/mweb/videoshow/midroll', 'NBT'),
    nbtMiniPre: tag('NBT MiniTV Pre-roll', 'video', '/7176/nbt/app/minitv/preroll', 'NBT'),
    nbtMiniMid: tag('NBT MiniTV Mid-roll', 'video', '/7176/nbt/app/minitv/midroll', 'NBT'),
    toiBackfill: tag('TOI Video Backfill', 'video', 'https://ads.toi.example/vast/backfill-primary', 'TOI', 'can'),
    toiBackfill2: tag('TOI Video Backfill (secondary)', 'video', 'https://ads.toi.example/vast/backfill-secondary', 'TOI', 'can'),
    etBackfill: tag('ET Video Backfill', 'video', 'https://ads.et.example/vast/backfill', 'ET', 'can'),
    nbtBackfill: tag('NBT Video Backfill', 'video', 'https://ads.nbt.example/vast/backfill', 'NBT', 'can'),
    nbtBackfill2: tag('NBT Video Backfill (house)', 'video', 'https://ads.nbt.example/vast/backfill-2', 'NBT', 'can'),
  };

  // The direct deal a sales team actually sold — the demo's one direct tag.
  const tSponsor = tag('TOI Sponsor Takeover', 'video', '/7176/toi/sponsor/takeover', 'TOI');
  // The waterfall's own primary — run-of-network demand no single break owns.
  const tRon = tag('TOI Run-of-network Video', 'video', '/7176/toi/ron/video', 'TOI');

  const tDisplay = {
    toiMwebVsDisp: tag('TOI Mweb VideoShow Display', 'display', '/7176/toi/mweb/videoshow/display', 'TOI'),
    toiMwebAsDisp: tag('TOI Mweb ArticleShow Display', 'display', '/7176/toi/mweb/articleshow/display', 'TOI'),
    toiWebVsDisp: tag('TOI Desktop VideoShow Display', 'display', '/7176/toi/web/videoshow/display', 'TOI'),
    etWebAsDisp: tag('ET Desktop ArticleShow Display', 'display', '/7176/et/web/articleshow/display', 'ET'),
    toiDispBackfill: tag('TOI Display Backfill', 'display', 'https://ads.toi.example/display/backfill', 'TOI', 'can'),
  };

  // --- Ad unit templates (né request templates; 31 Aug) -------------------------------------------
  // Named macro URLs, authored here since the JSON's unittpl names several and a
  // unit's tpl picks between them. Standard is absence — no tag has to choose.
  createTemplate({ name: 'GAM standard', provider: 'ima',
    url: 'https://ads.slike.example/vast?cb=[CACHEBUSTER]&ref=[REFERRER_URL]' });
  // Seeded OFF (4 Sep) so the row switch is visible on day one: it stands, dimmed;
  // units picking it would request through IMA's standard until it is on again.
  createTemplate({ name: 'GAM low-latency', provider: 'ima',
    url: 'https://ads-fast.slike.example/vast?cb=[CACHEBUSTER]&url=[PAGE_URL]', on: false });

  // --- Ad setups (the ops room's objects) -----------------------------------
  // The setup carries its PLACEMENTS (25 Aug): sections + their ladders, one document
  // per surface shape. Plain rungs, a switch each, up to 10.
  const L = (...items) => ({
    rungs: items.map(x => (typeof x === 'string' ? { type: 'tag', tagId: x } : x)),
  });
  // A rung ops have switched off: it keeps its tag and its seat everywhere.
  const dead = tagId => ({ type: 'tag', tagId, on: false });
  const none = () => ({ rungs: [] });

  // ONE SETUP PER INTEGRATION (26 Aug, DRIVING-SCOPE): the setup is a surface's own
  // workshop now, so every key below gets its own. Each placement carries its own
  // behaviour, stamped from the shape it serves: the Shorts feed inside a VideoShow
  // surface really does pace ads differently.
  // Default runs a DEEP pre-roll ladder (ten rungs, GPT sitting mid-walk, two rungs
  // ops-killed inside the tail) — the world every deep-walk drive decision is tested
  // against: "IMA only", "GPT first", "stop after 3".
  const asToiVideo = createSetup({
    name: 'TOI VideoShow demand', property: 'TOI',
    // THE WATERFALL, visible on day one (5 Sep): one ladder at the setup's head; the
    // Shorts feed post-roll below FOLLOWS it (its own unit kept, parked), so the link,
    // the levers and the source switch's way back all have something to show.
    waterfall: L(tRon, tVideo.toiBackfill, tDisplay.toiMwebVsDisp),
    // HEADER BIDDING, on the surface that has everything else (10 Sep): both libraries
    // at the head, one break running Prebid alone and one refusing bidders outright —
    // so `Auto`, a slot's own answer and a slot's `Off` are all on screen at once, and
    // the counted "N of M follow it" line is never a set of one.
    headerBidding: 'amazon_prebid',
    sections: [
      // FULL DEPTH: ten rungs, the cap — one primary and nine waterfalls, with the GPT
      // display sitting mid-walk and two rungs switched off by ops INSIDE the tail. The
      // world every deep-ladder behaviour is checked against: the "10 of 10" ceiling, a
      // seven-rung tail carrying dead rungs, and an eight-rung walk whose counted wait
      // (8 × 1500ms) trips the worst-case warning on save.
      place('Default', B.VideoShow, {
        // The pre-roll's own DIRECT tier (1 Sep): the sold deal, tried before the
        // primary, capped per session.
        preroll: { direct: { rungs: [{ type: 'tag', tagId: tSponsor }] },
          ...L(
          tVideo.toiMwebVsPre,          // Primary    · IMA
          tVideo.toiBackfill,           // Waterfall 1 · CAN
          tDisplay.toiMwebVsDisp,       // Waterfall 2 · GPT (the one display settle)
          tVideo.toiWebVsPre,           // Waterfall 3 · IMA
          dead(tVideo.toiBackfill2),    // Waterfall 4 · CAN — off by ad ops
          tVideo.toiWebVsMid,           // Waterfall 5 · IMA
          dead(tVideo.toiMwebVsPost),   // Waterfall 6 · IMA — off by ad ops
          tVideo.toiMwebAsPre,          // Waterfall 7 · IMA
          tVideo.toiShortsPre,          // Waterfall 8 · IMA
          tVideo.toiMwebVsMid,          // Waterfall 9 · IMA
        ) },
        midroll: { ...L(tVideo.toiMwebVsMid, tVideo.toiBackfill, tVideo.toiWebVsMid, tVideo.toiBackfill2),
          behaviour: { headerBidding: 'prebid' } },
        // NO GPT here on purpose: the post-roll is the world "GPT only" falls back in.
        postroll: L(tVideo.toiMwebVsPost, tVideo.toiBackfill, tVideo.toiWebVsMid),
      }),
      place('Shorts feed', B.MiniTV, {
        preroll: { ...L(tVideo.toiShortsPre, tVideo.toiBackfill, tDisplay.toiMwebVsDisp,
                        tVideo.toiBackfill2, tVideo.toiWebVsMid),
          behaviour: { headerBidding: 'off' } },
        midroll: L(tVideo.toiMwebVsMid, tVideo.toiBackfill2),
        // Follows the waterfall; its own unit stays as the kept arrangement.
        postroll: { ...L(tVideo.toiMwebVsPost), waterfallSource: 'setup' },
      }),
    ],
  });
  const asToiArticle = createSetup({
    name: 'TOI ArticleShow demand', property: 'TOI',
    sections: [place('Default', B.ArticleShow, {
      preroll: L(tVideo.toiMwebAsPre, tDisplay.toiMwebAsDisp),
      // Staged out-stream: demand ready, the switch deliberately off on the surface.
      outstream: L(tDisplay.toiDispBackfill),
    })],
  });
  // Every break filled, so every slot is testable end to end: a 4-rung pre-roll, a
  // 3-rung mid-roll, a post-roll, and a two-banner out-stream rotation.
  const asEtMini = createSetup({
    name: 'ET MiniTV demand', property: 'ET',
    sections: [place('Default', B.MiniTV, {
      preroll: L(tVideo.etMiniPre, tVideo.etBackfill, tVideo.etWebAsPre, tDisplay.etWebAsDisp),
      midroll: L(tVideo.etMiniMid, tVideo.etBackfill, tDisplay.etWebAsDisp),
      postroll: L(tVideo.etMiniPre, tVideo.etBackfill),
      outstream: L(tDisplay.etWebAsDisp, tDisplay.toiDispBackfill),
    })],
  });
  const asEtArticle = createSetup({
    name: 'ET ArticleShow demand', property: 'ET',
    sections: [place('Default', B.ArticleShow, {
      preroll: L(tVideo.etWebAsPre, tVideo.etBackfill),
      midroll: L(tVideo.etMiniMid, tVideo.etBackfill),
      postroll: L(tVideo.etMiniPre),
      outstream: L(tDisplay.etWebAsDisp),
    })],
  });
  const asNbtVideo = createSetup({
    name: 'NBT VideoShow demand', property: 'NBT',
    sections: [
      place('Default', B.VideoShow, {
        preroll: L(tVideo.nbtMwebVsPre),
        midroll: L(tVideo.nbtMwebVsMid, tVideo.nbtBackfill),
      }),
      // Deliberately DEEP (6 rungs, mixed providers) while Default runs 1 — the
      // depths-differ world where one decision lands two ways. Its own behaviour too:
      // a live blog runs a longer per-tag wait and no pod. Default keeps NO post-roll
      // and NO squeeze-back on purpose: two fail-closed cases live on that gap.
      place('Live blog', B.ArticleShow, {
        preroll: L(tVideo.nbtMwebVsPre, tVideo.nbtBackfill, tVideo.nbtMiniPre,
                   tVideo.nbtBackfill2, tVideo.nbtMiniMid, tDisplay.toiMwebVsDisp),
        midroll: L(tVideo.nbtMwebVsMid, tVideo.nbtBackfill2),
        postroll: L(tVideo.nbtMiniMid, tVideo.nbtBackfill),
      }),
    ],
  });
  // IMA-only pre-roll on purpose: the world where "GPT only" is refused outright.
  const asNbtMini = createSetup({
    name: 'NBT MiniTV demand', property: 'NBT',
    sections: [place('Default', B.MiniTV, {
      preroll: L(tVideo.nbtMiniPre),
      midroll: L(tVideo.nbtMiniMid, tVideo.nbtBackfill),
      postroll: L(tVideo.nbtMiniPre),
      outstream: L(tDisplay.toiDispBackfill),
    })],
  });
  // Desktop's OWN copy of the VideoShow shape (26 Aug — setups are 1:1 with
  // integrations now; it used to share as_1). Created last so every id above holds.
  const asToiVideoDesktop = createSetup({
    name: 'TOI Desktop VideoShow demand', property: 'TOI',
    sections: [place('Default', B.VideoShow, {
      preroll: L(tVideo.toiWebVsPre, tVideo.toiBackfill, tDisplay.toiWebVsDisp, tVideo.toiWebVsMid),
      // TWO BREAK GROUPS (31 Aug): an opening beat at named positions, then a steady
      // drumbeat that stops after five — each with its own ladder. The world every
      // multi-group behaviour is checked against.
      midroll: { groups: [
        { rungs: L(tVideo.toiWebVsMid, tVideo.toiBackfill2, tDisplay.toiWebVsDisp).rungs },
        { rungs: L(tVideo.toiMwebVsMid, tVideo.toiBackfill).rungs,
          behaviour: { mode: 'interval', firstAt: 120, every: 180 } },
      ] },
      postroll: L(tVideo.toiMwebVsPost, tVideo.toiBackfill2),
      // The idle player's own rotation — three banners taking turns, hidden while a
      // video ad has the screen.
      outstream: L(tDisplay.toiWebVsDisp, tDisplay.toiDispBackfill, tDisplay.toiMwebAsDisp),
    })],
  });

  // DEMAND BUILT AHEAD OF ITS SURFACE (8 Sep, user report — *"there is only Copy & use,
  // I can't see the Use CTA"*). The world was seven setups for seven integrations, each
  // one held, so nothing was ever free to simply USE: the change modal could only ever
  // offer a copy, and the setups room's own `Not mapped yet` filter matched nothing.
  // That is not what the room looks like in life — ad ops build a setup, then someone
  // maps it — so every property now carries one unmapped setup, waiting to be picked up.
  // They are created LAST so every id above holds.
  createSetup({
    name: 'TOI Shorts demand', property: 'TOI',
    sections: [place('Default', B.MiniTV, {
      preroll: L(tVideo.toiShortsPre, tVideo.toiBackfill),
      midroll: L(tVideo.toiMwebVsMid, tVideo.toiBackfill2),
    })],
  });
  createSetup({
    name: 'ET Markets Live demand', property: 'ET',
    sections: [place('Default', B.ArticleShow, {
      preroll: L(tVideo.etWebAsPre, tVideo.etBackfill),
      outstream: L(tDisplay.etWebAsDisp),
    })],
  });
  createSetup({
    name: 'NBT ArticleShow demand', property: 'NBT',
    sections: [place('Default', B.ArticleShow, {
      preroll: L(tVideo.nbtMwebVsPre, tVideo.nbtBackfill),
      postroll: L(tVideo.nbtMiniMid),
    })],
  });

  // --- Integrations (the product room) --------------------------------------
  // A section = which setup fills it + slot SWITCHES
  // (or null = Same as Default). Demand switched off is the staged state now:
  // the ladder sits in the setup, the switch just isn't on yet.
  const on = { on: true };
  const off = { on: false };

  createKey({
    name: 'TOI Mweb VideoShow',
    property: 'TOI', platform: 'mweb',
    domains: ['m.timesofindia.com'],
    adSetupId: asToiVideo.id,
    player: P.VideoShow,
    // One seeded custom config (2 Sep) so the fork is visible on day one: the shorts
    // feed runs passive, MiniTV held small, autoplay muted — the rest follows default.
    // A second one rides switched OFF (4 Sep) so the row switch is visible too: the key
    // and its facts stand, but players asking for it follow the default player.
    playerConfigs: [
      { name: 'shorts', playback: 'passive', expandInMini: false, autoplay: 'off' },
      { name: 'amp_stories', playback: 'passive', autoplay: 'off', on: false },
    ],
    sections: [
      {
        slots: { preroll: on, midroll: on, postroll: on },
      },
      {
        name: 'Shorts feed',
        slots: { preroll: on, midroll: off, postroll: off },
      },
    ],
  });

  createKey({
    name: 'TOI Mweb ArticleShow',
    property: 'TOI', platform: 'mweb',
    domains: ['m.timesofindia.com'],
    adSetupId: asToiArticle.id,
    player: P.ArticleShow,
    sections: [{
      // Squeeze-back demand sits staged in the setup; the switch is deliberately off.
      slots: { preroll: on, midroll: off, postroll: off },
    }],
  });

  createKey({
    name: 'TOI Desktop VideoShow',
    property: 'TOI', platform: 'desktop',
    domains: ['timesofindia.indiatimes.com'],
    adSetupId: asToiVideoDesktop.id, // its own copy of the shape — setups are 1:1 now
    player: P.VideoShow,
    // Every break live — the surface to open when you want to see every one working.
    sections: [{
      slots: { preroll: on, midroll: on, postroll: on, outstream: on },
    }],
  });

  createKey({
    name: 'ET Android MiniTV',
    property: 'ET', platform: 'android',
    packageName: 'com.et.reader.activities',
    adSetupId: asEtMini.id,
    player: P.MiniTV,
    sections: [{
      slots: { preroll: on, midroll: on, postroll: off, outstream: on },
    }],
  });

  createKey({
    name: 'ET Desktop ArticleShow',
    property: 'ET', platform: 'desktop',
    domains: ['economictimes.indiatimes.com'],
    adSetupId: asEtArticle.id,
    player: P.ArticleShow,
    sections: [{
      slots: { preroll: on, midroll: off, postroll: off },
    }],
  });

  createKey({
    name: 'NBT Mweb VideoShow',
    property: 'NBT', platform: 'mweb',
    domains: ['navbharattimes.indiatimes.com'],
    adSetupId: asNbtVideo.id,
    player: P.VideoShow,
    sections: [
      {
        slots: { preroll: on, midroll: on, postroll: off },
      },
      {
        // Rules/player null = Same as Default; the placement itself comes from the setup.
        name: 'Live blog',
        slots: { preroll: on, midroll: off, postroll: off },
      },
    ],
  });

  createKey({
    name: 'NBT iOS MiniTV',
    property: 'NBT', platform: 'ios',
    packageName: 'com.nbt.reader',
    adSetupId: asNbtMini.id,
    player: P.MiniTV,
    sections: [{
      slots: { preroll: on, midroll: on, postroll: off },
    }],
  });

  // Backdated stamps so listings read lived-in. Invented — mock only.
  const ago = (h) => new Date(Date.now() - h * 3600 * 1000).toISOString();
  const stamp = (obj, hours, by) => Object.assign(obj, { updatedAt: ago(hours), updatedBy: by });
  stamp(getKey('key_1'), 5, 'Rohit (monetization)');
  stamp(getKey('key_2'), 26, 'Rohit (monetization)');
  stamp(getKey('key_3'), 96, 'Priya (ad ops)');
  stamp(getKey('key_4'), 120, 'Meera (platform)');
  stamp(getKey('key_5'), 30, 'Meera (platform)');
  stamp(getKey('key_6'), 200, 'Priya (ad ops)');
  stamp(getKey('key_7'), 200, 'Meera (platform)');
  // EVERY seeded object carries an author (7 Sep, UAT P2 — five setups read
  // "You · just now" straight out of a reset, which reads as a broken Modified column).
  stamp(getSetup('as_1'), 2, 'Priya (ad ops)');
  stamp(getSetup('as_2'), 34, 'Rohit (monetization)');
  stamp(getSetup('as_3'), 120, 'Arjun (ad ops)');
  stamp(getSetup('as_4'), 150, 'Priya (ad ops)');
  stamp(getSetup('as_5'), 52, 'Meera (platform)');
  stamp(getSetup('as_6'), 210, 'Arjun (ad ops)');
  stamp(getSetup('as_7'), 8, 'Rohit (monetization)');

  // --- ON AIR (27 Aug). `status` is gone: a surface serves because it was PUBLISHED.
  // Setups go up first — an integration cannot publish a break with no published demand
  // behind it — and key_5 stays unpublished on purpose, so the world has one surface
  // that is fully built and deliberately off air.
  const onAir = [['key_1', 'as_1'], ['key_2', 'as_2'], ['key_3', 'as_7'], ['key_4', 'as_3'],
    ['key_6', 'as_5'], ['key_7', 'as_6']];
  for (const [k, a] of onAir) {
    seedPublish('setup', a, { actor: 'Priya (ad ops)', hoursAgo: 100 });
    seedPublish('key', k, { actor: 'Priya (ad ops)', hoursAgo: 96 });
  }
  // …and one setup with real history behind it, so restoring a version is demonstrable
  // rather than theoretical: as_1 has been published three times.
  const bendDefault = patch => updateSetup('as_1', {
    sections: getSetup('as_1').sections.map((sec, i) => (i === 0
      ? { ...sec, slots: { ...sec.slots, preroll: { ...sec.slots.preroll, behaviour: { ...sec.slots.preroll.behaviour, ...patch } } } }
      : sec)),
  });
  bendDefault({ tagTimeoutMs: 2000 });
  seedPublish('setup', 'as_1', { actor: 'Rohit (monetization)', hoursAgo: 26, note: 'Fill trial — per-tag wait up to 2s' });
  bendDefault({ tagTimeoutMs: 1500 });
  seedPublish('setup', 'as_1', { actor: 'Priya (ad ops)', hoursAgo: 2, note: 'Trial rolled back — starts read slow' });
  stamp(getSetup('as_1'), 2, 'Priya (ad ops)');

  // A named scenario, not a different world: the demo seven stay exactly as they
  // are (same ids, same slots) and volume is added on top, so paging and
  // select-all can be exercised without re-learning the list.
  if (opts.scenario === 'scale') {
    seedScale({ tVideo, tDisplay, ago });
  }
}

// --- The `scale` scenario -------------------------------------------------
// Volume, so the list behaves like a real ad-ops account: paging, select-all
// across pages, filters that actually narrow. One setup PER integration (26 Aug,
// the 1:1 promise) — 60 setups feeding 60 keys, which makes the setups list page too.
// Deterministic — same names, same ids, same order every rebuild.
function seedScale(w) {
  const L = (...tagIds) => ({ rungs: tagIds.map(tagId => ({ type: 'tag', tagId })) });
  const none = () => ({ rungs: [] });
  const on = { on: true };
  const off = { on: false };

  const byProperty = {
    TOI: {
      domain: 'm.timesofindia.com', pkg: 'com.toi.reader', desktop: 'timesofindia.indiatimes.com',
      pre: w.tVideo.toiWebVsPre, mid: w.tVideo.toiWebVsMid, post: w.tVideo.toiMwebVsPost,
      disp: w.tDisplay.toiWebVsDisp, back: w.tVideo.toiBackfill2, dispBack: w.tDisplay.toiDispBackfill,
    },
    ET: {
      domain: 'm.economictimes.com', pkg: 'com.et.reader', desktop: 'economictimes.indiatimes.com',
      pre: w.tVideo.etWebAsPre, mid: w.tVideo.etMiniMid, post: w.tVideo.etMiniPre,
      disp: w.tDisplay.etWebAsDisp, back: w.tVideo.etBackfill, dispBack: w.tDisplay.etWebAsDisp,
    },
    NBT: {
      domain: 'm.navbharattimes.com', pkg: 'com.nbt.reader', desktop: 'navbharattimes.indiatimes.com',
      pre: w.tVideo.nbtMwebVsPre, mid: w.tVideo.nbtMwebVsMid, post: w.tVideo.nbtMiniMid,
      disp: w.tDisplay.toiMwebVsDisp, back: w.tVideo.nbtBackfill, dispBack: w.tDisplay.toiDispBackfill,
    },
  };

  // Two recognisable demand shapes — stamped per key below, never shared.
  const shapeFor = (p, kind) => {
    const b = byProperty[p];
    return kind === 'B'
      ? [place('Default', B.MiniTV, {
          preroll: L(b.pre, b.back, b.dispBack),
          midroll: L(b.mid, b.disp),
          postroll: L(b.post),
          outstream: L(b.dispBack),
        })]
      : [place('Default', B.VideoShow, {
          preroll: L(b.pre, b.back, b.disp),
          midroll: L(b.mid, b.back),
          postroll: L(b.post),
          outstream: L(b.dispBack),
        })];
  };

  const surfaces = [
    'Live TV', 'Sports Hub', 'Cricket Live', 'Elections Live', 'Budget Live', 'Markets Live',
    'Business News', 'City Videos', 'Entertainment', 'Bollywood', 'Web Stories', 'Photo Stories',
    'Tech Reviews', 'Auto Reviews', 'Gadgets Now', 'Health Videos', 'Lifestyle', 'Travel',
    'Education', 'Astrology', 'Food Videos', 'Explainers', 'Podcast Player', 'Interviews',
    'Weather Live', 'Trending Now', 'Short Videos', 'Reels Feed', 'Watch Later', 'Home Feed',
  ];
  const platforms = ['mweb', 'desktop', 'android', 'ios'];
  const properties = ['TOI', 'ET', 'NBT'];
  const owners = ['Priya (ad ops)', 'Rohit (monetization)', 'Meera (platform)', 'Arjun (ad ops)'];

  for (let i = 0; i < 60; i++) {
    const p = properties[i % 3];
    const b = byProperty[p];
    const platform = platforms[Math.floor(i / 3) % 4];
    const surface = surfaces[i % surfaces.length];
    const web = platform === 'mweb' || platform === 'desktop';

    // Five recognisable switch shapes, cycled — every one appears often enough to be
    // worth a bulk change. Shapes 0/1/3 stamp demand shape A, shapes 2/4 shape B —
    // each key gets its OWN setup (the 1:1 promise), photocopied from the shape.
    const shape = i % 5;
    const keyName = `${p} ${platform === 'mweb' ? 'Mweb' : platform === 'desktop' ? 'Desktop' : platform === 'android' ? 'Android' : 'iOS'} ${surface}`;
    const setup = createSetup({
      name: `${keyName} demand`, property: p,
      sections: shapeFor(p, (shape === 2 || shape === 4) ? 'B' : 'A'),
    });
    const slots =
      shape === 0 ? { preroll: on, midroll: on, postroll: off }
      : shape === 1 ? { preroll: on, midroll: off, postroll: off }
      : shape === 2 ? { preroll: on, midroll: on, postroll: off }
      : shape === 3 ? { preroll: on, midroll: off, postroll: off }
      : { preroll: on, midroll: on, postroll: on };

    const player = shape === 1 ? 'MiniTV' : shape === 3 ? 'ArticleShow' : 'VideoShow';

    const { obj } = createKey({
      name: keyName,
      property: p, platform,
      domains: web ? [platform === 'desktop' ? b.desktop : b.domain] : [],
      packageName: web ? '' : b.pkg,
      adSetupId: setup.id,
      player: PLAYER_PRESETS.find(x => x.name === player).values,
      sections: [{ slots }],
    });
    Object.assign(obj, { updatedAt: w.ago(6 + i * 3), updatedBy: owners[i % 4] });
    Object.assign(setup, { updatedAt: w.ago(9 + i * 3), updatedBy: owners[(i + 1) % 4] });
    // Most on air, a handful not — so the On air filter narrows to something, and the
    // bulk publish/unpublish acts have a mixed cohort to answer for.
    if (i % 9 !== 4) {
      seedPublish('setup', setup.id, { actor: owners[i % 4], hoursAgo: 8 + i * 3 });
      seedPublish('key', obj.id, { actor: owners[i % 4], hoursAgo: 6 + i * 3 });
    }
    // …and a few with saved work still waiting, so "unpublished changes" is real too.
    if (i % 7 === 2) {
      updateSetup(setup.id, { name: `${keyName} demand v2` });
      // updateSetup stamps You/now — the seeded past owns it, not this reset.
      Object.assign(setup, { updatedAt: w.ago(4 + i), updatedBy: owners[(i + 2) % 4] });
    }
  }
}
