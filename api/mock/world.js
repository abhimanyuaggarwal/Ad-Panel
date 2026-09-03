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
  setGamUnits, getKey, getSetup, seedPublish, updateSetup,
} from '../store.js';
import { BASE_UNITS, PENDING_UNITS } from './gamunits.js';

// --- Creation presets (the old three shapes, reborn as value-sets) ---------
export const PLAYER_PRESETS = [
  {
    name: 'MiniTV',
    values: { autoplay: 'muted', startVolume: 60, playbackMode: 'inline', fallbackMediaId: 'med_minitv_default' },
  },
  {
    name: 'ArticleShow',
    values: { autoplay: 'muted', startVolume: 80, playbackMode: 'inline', fallbackMediaId: 'med_article_default' },
  },
  {
    name: 'VideoShow',
    values: { autoplay: 'sound', startVolume: 100, playbackMode: 'inline', fallbackMediaId: 'med_videoshow_default' },
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
          behaviour: { ...preset.slots[t], ...(g.behaviour || {}) },
        })) }];
      }
      return [t, { rungs: l.rungs, behaviour: preset.slots[t], direct: l.direct }];
    })),
  };
}

export function resetWorld(opts = {}) {
  resetState();
  setGamUnits(BASE_UNITS, PENDING_UNITS);

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

  const tDisplay = {
    toiMwebVsDisp: tag('TOI Mweb VideoShow Display', 'display', '/7176/toi/mweb/videoshow/display', 'TOI'),
    toiMwebAsDisp: tag('TOI Mweb ArticleShow Display', 'display', '/7176/toi/mweb/articleshow/display', 'TOI'),
    toiWebVsDisp: tag('TOI Desktop VideoShow Display', 'display', '/7176/toi/web/videoshow/display', 'TOI'),
    etWebAsDisp: tag('ET Desktop ArticleShow Display', 'display', '/7176/et/web/articleshow/display', 'ET'),
    toiDispBackfill: tag('TOI Display Backfill', 'display', 'https://ads.toi.example/display/backfill', 'TOI', 'can'),
  };

  // --- Request templates (31 Aug) -------------------------------------------
  // Named macro URLs, authored here since the JSON's unittpl names several and a
  // unit's tpl picks between them. Standard is absence — no tag has to choose.
  createTemplate({ name: 'GAM standard', provider: 'ima',
    url: 'https://ads.slike.example/vast?cb=[CACHEBUSTER]&ref=[REFERRER_URL]' });
  createTemplate({ name: 'GAM low-latency', provider: 'ima',
    url: 'https://ads-fast.slike.example/vast?cb=[CACHEBUSTER]&url=[PAGE_URL]' });

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
          tDisplay.toiMwebVsDisp,       // Waterfall 2 · GPT (the one display fallback)
          tVideo.toiWebVsPre,           // Waterfall 3 · IMA
          dead(tVideo.toiBackfill2),    // Waterfall 4 · CAN — off by ad ops
          tVideo.toiWebVsMid,           // Waterfall 5 · IMA
          dead(tVideo.toiMwebVsPost),   // Waterfall 6 · IMA — off by ad ops
          tVideo.toiMwebAsPre,          // Waterfall 7 · IMA
          tVideo.toiShortsPre,          // Waterfall 8 · IMA
          tVideo.toiMwebVsMid,          // Waterfall 9 · IMA
        ) },
        midroll: L(tVideo.toiMwebVsMid, tVideo.toiBackfill, tVideo.toiWebVsMid, tVideo.toiBackfill2),
        // NO GPT here on purpose: the post-roll is the world "GPT only" falls back in.
        postroll: L(tVideo.toiMwebVsPost, tVideo.toiBackfill, tVideo.toiWebVsMid),
      }),
      place('Shorts feed', B.MiniTV, {
        preroll: L(tVideo.toiShortsPre, tVideo.toiBackfill, tDisplay.toiMwebVsDisp,
                   tVideo.toiBackfill2, tVideo.toiWebVsMid),
        midroll: L(tVideo.toiMwebVsMid, tVideo.toiBackfill2),
        postroll: L(tVideo.toiMwebVsPost),
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
    playerConfigs: [
      { name: 'Shorts feed', playback: 'passive', expandInMini: false, autoplay: 'muted', startVolume: 60 },
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
  stamp(getSetup('as_1'), 2, 'Priya (ad ops)');
  stamp(getSetup('as_3'), 120, 'Arjun (ad ops)');

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
  seedPublish('setup', 'as_1', { actor: 'Rohit (monetization)', hoursAgo: 26 });
  bendDefault({ tagTimeoutMs: 1500 });
  seedPublish('setup', 'as_1', { actor: 'Priya (ad ops)', hoursAgo: 2 });

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
    // Most on air, a handful not — so the On air filter narrows to something, and the
    // bulk publish/unpublish acts have a mixed cohort to answer for.
    if (i % 9 !== 4) {
      seedPublish('setup', setup.id, { actor: owners[i % 4], hoursAgo: 8 + i * 3 });
      seedPublish('key', obj.id, { actor: owners[i % 4], hoursAgo: 6 + i * 3 });
    }
    // …and a few with saved work still waiting, so "unpublished changes" is real too.
    if (i % 7 === 2) updateSetup(setup.id, { name: `${keyName} demand v2` });
  }
}
