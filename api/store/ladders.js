// store/ladders.js — how a break BEHAVES and what it ASKS: slot behaviour and drive
// fields, cue points, rungs, and the walks (local, drive, per-group, effective).
// Split from store/setups.js (3 Sep, docs/STORE-SPLIT.md): a MOVE, not a rewrite.
import { DISPLAY_SLOTS, DISPLAY_SLOT_WORD, MAX_RUNGS, MIDROLL_MODES, PAUSE_MODES, POD_BANNER, POD_NEXT_AD, PREROLL_TIMING, PREROLL_WAIT, PROVIDER_WORD, ROTATION_MAX, SLOT_KIND, TAG_PROVIDERS, state } from './state.js';
import { bool, fmtSecs, intIn, oneOf, str } from './validate.js';


// ---------- ad rules (inline — no identity) ----------
// Behaviour only. Nothing here switches a break or an overlay on or off — that is
// the integration's slot switch. So the rules always carry their break positions
// and overlay moments: a complete statement of how ads behave if they run.

// A cuepoint is seconds ("360") or minutes:seconds ("6:00").
function parseCuepoint(v) {
  if (typeof v === 'number' && Number.isInteger(v) && v > 0) return v;
  const s = String(v).trim();
  if (/^\d+$/.test(s)) return parseInt(s, 10);
  const m = s.match(/^(\d+):([0-5]?\d)$/);
  if (m) return parseInt(m[1], 10) * 60 + parseInt(m[2], 10);
  return null;
}

export function normalizeCuepoints(input, errors, field = 'cuepoints') {
  let raw = input;
  if (typeof raw === 'string') raw = raw.split(',').map(s => s.trim()).filter(Boolean);
  if (!Array.isArray(raw)) raw = [];
  const parsed = [];
  for (const c of raw) {
    const n = parseCuepoint(c);
    if (n === null || n <= 0 || n > 14400) {
      errors.push({ field, message: `“${c}” is not a time — use seconds (360) or minutes:seconds (6:00)` });
    } else {
      parsed.push(n);
    }
  }
  return [...new Set(parsed)].sort((a, b) => a - b);
}

// ---------- how ads behave: ON THE SLOT, inside the ad setup (25 Aug, user call) ----------
// The old "Ad behaviour" object held every break's fields side by side, prefixed by
// break (preRollPodAds, midrollPodAds, …) because ONE object had to describe FOUR
// units. With behaviour living on the slot itself the prefixes vanish: a slot's
// behaviour holds only what that slot can have, named plainly. 15 pod fields become 5.
//
//   the SLOT says   when the break falls · how many ads · how long · how it walks
//   the PLACEMENT   what a whole session may take: caps, overlay schedule, delivery
//   the PLAYER      what the viewer sees while an ad runs (in the integration)
//
// Nothing here switches a unit on: that is still the integration's slot switch. So a
// slot's behaviour is always complete — a statement of how it WOULD behave if it ran.

// THREE FIELDS CUT with the squeeze-back (31 Aug, user call): Max pod duration and
// Duration enforcement (a pod plays its target impressions count; an ad runs its own
// length) and Max waterfall depth (how deep a walk goes is the SURFACE's Waterfall
// depth, in Ad delivery — one concept, one control). Removed, not hidden — see
// DEAD_BEHAVIOUR_FIELDS.
export const SLOT_BEHAVIOUR_FIELDS = {
  // `minContentSec` (31 Aug, user call — the JSON's minPreRenderTime): the PRE-ROLL's
  // own head start — at least this much video plays before the ad may render. A fact
  // about one break, so it lives on that break, not on the player.
  preroll: ['start', 'deferSec', 'wait', 'waitMs', 'minContentSec', 'podAds', 'nextAd', 'podBanner', 'tagTimeoutMs', 'fillTimeoutSec'],
  // `prefetchSec` (same call): how early a COMING break's first ad is fetched — only a
  // break that arrives mid-playback has a "before" to fetch in, so mid- and post-roll.
  midroll: ['mode', 'cuepoints', 'firstAt', 'every', 'prefetchSec', 'podAds', 'nextAd', 'podBanner', 'tagTimeoutMs', 'fillTimeoutSec'],
  postroll: ['prefetchSec', 'podAds', 'nextAd', 'podBanner', 'tagTimeoutMs', 'fillTimeoutSec'],
  // Out-stream: banners while nothing plays, plus one switch — hide while a video ad
  // runs. Its show times are its own repeat schedule, so it has no rotation refresh.
  outstream: ['times', 'hold', 'perSession', 'hideOnInStream', 'tagTimeoutMs'],
};

// A cut field is refused BY NAME, with where the answer lives now (house rule).
export const DEAD_BEHAVIOUR_FIELDS = {
  breakSec: ['Max pod duration', 'a pod plays its target impressions count, and each ad runs its own length'],
  overrun: ['Duration enforcement', 'a pod plays its target impressions count, and each ad runs its own length'],
  walkDepth: ['Max waterfall depth', 'how deep the walk goes is the surface\u2019s Waterfall depth, in Ad delivery'],
  refresh: ['Refresh interval', 'the squeeze-back is gone — the out-stream\u2019s schedule is its own show times'],
  // Cut 1 Sep, user call: a repeating cadence runs the video out, and at set positions
  // the positions themselves are the cap. Nothing counted a mid-way stop.
  stopAfter: ['Break cap', 'a cadence runs the length of the video — at set positions, the positions are the cap'],
  // Cut 2 Sep, user call: an ad's sound is how the PLAYER starts, and that answer
  // lives on the surface now — per placement, even.
  adSound: ['Ad audio', 'whether a player autoplays is the integration\u2019s Player config (Autoplay behaviour); its loudness is the one Passive volume in Details'],
};

// THE DRIVE DECISION (26 Aug, DRIVING-SCOPE). Local overrides — muted rungs, a local
// walk order, sparse behaviour bends — are GONE with the 1:1 setup promise: the deep
// work happens in the integration's own setup now. What a surface keeps is the driving
// controls, per break: WHO fills it ('only:<provider>' / 'first:<provider>'), how many
// TRIES, whether the pre-roll STARTS right away or after a moment, and ads in a row.
// Stored as INTENT, sparse, and resolved against whatever the setup holds today — ad
// ops adding a tag next week joins the walk the decision already describes. A
// squeeze-back takes turns, so it has nothing to decide beyond its switch.
export const DRIVE_FIELDS = {
  preroll: ['direct', 'ask', 'tries', 'start', 'deferSec', 'podAds'],
  // WHERE THE BREAKS FALL (3 Sep, user call) joins the drive. The cadence was the ad
  // setup's alone; with the 1:1 promise a setup IS one integration's, so "this surface
  // breaks at 2:00 and 8:00" is a surface decision — stored sparse like the rest and
  // resolved over whatever the placement holds. It is refused where the mid-roll runs
  // MORE THAN ONE break group: several cadences are an arrangement, and one answer
  // cannot stand for all of them.
  midroll: ['direct', 'ask', 'tries', 'podAds', 'mode', 'cuepoints', 'every'],
  postroll: ['direct', 'ask', 'tries', 'podAds'],
  outstream: [], // takes turns — nothing to decide beyond its switch
};

// WHO IS ASKED, AND IN WHAT ORDER (27 Aug, user call). `ask` is an ordered list of the
// partners this break asks — first entry asked first — and anything absent from it is
// not asked at all. It replaces the `only:x` / `first:x` pair outright, because the two
// were the only shapes a dropdown could express and both are just special cases of a
// list: "IMA only" is `['ima']`, "GPT first" is `['gpt','ima','can']`. A surface that
// has made no decision has no `ask` at all, and runs the setup's own arrangement.
// "IMA" · "IMA then CAN" · "IMA, then CAN, then GPT" — an ask list read aloud.
export function askWord(ask) {
  const w = (ask || []).map(p => PROVIDER_WORD[p] || p);
  if (!w.length) return 'nobody';
  if (w.length === 1) return w[0];
  return `${w.slice(0, -1).join(', ')} then ${w[w.length - 1]}`;
}

export function driveAsk(ask) {
  if (!Array.isArray(ask) || !ask.length) return null;
  const out = [];
  for (const p of ask) if (TAG_PROVIDERS.includes(p) && !out.includes(p)) out.push(p);
  return out.length ? out : null;
}

// The behaviour a surface actually runs: the placement's, with the drive's own two
// timing answers on top. `driveKeys` is what the decision set — the UI marks those.
export function effectiveBehaviour(type, base, drive) {
  if (!base) return { values: null, driveKeys: [] };
  const keys = drive ? Object.keys(drive).filter(f => ['start', 'deferSec', 'podAds', 'mode', 'cuepoints', 'every'].includes(f)) : [];
  if (!keys.length) return { values: base, driveKeys: [] };
  const values = { ...base };
  for (const f of keys) values[f] = drive[f];
  return { values, driveKeys: keys };
}

export function normalizeSlotBehaviour(type, input, errors, warnings, prefix = '') {
  const errs = [];
  const warns = [];
  const inp = input || {};
  const b = {};

  // A field cut from the model is refused by name, with where the answer lives now.
  for (const [f, dead] of Object.entries(DEAD_BEHAVIOUR_FIELDS)) {
    if (inp[f] !== undefined) {
      errs.push({ field: f, message: `\u201c${dead[0]}\u201d is not a setting any more — ${dead[1]}` });
    }
  }
  if (SLOT_KIND[type] === 'rotation') {
    // A rotation, not a ladder: several banners taking turns.
    // ABSENT means "not stated yet" and takes a sane default; EXPLICITLY EMPTY means
    // "no moments", which for a unit that has a switch is an incomplete statement — so
    // it is refused by name rather than quietly serving nothing.
    b.times = inp.times === undefined ? [30] : normalizeCuepoints(inp.times, errs, 'times');
    b.hold = intIn(inp.hold ?? 20, 'hold', 5, 90, errs);
    b.perSession = intIn(inp.perSession ?? 2, 'perSession', 0, 20, errs);
    // Out-stream fills the idle player; when an in-stream ad takes the screen it can
    // step aside (the JSON's hideOnInStream). A switch, defaulting to polite.
    b.hideOnInStream = inp.hideOnInStream === undefined ? true : bool(inp.hideOnInStream);
    if (inp.times !== undefined && !b.times.length) {
      errs.push({ field: 'times', message: 'The out-stream needs at least one show time' });
    }
  } else {
    if (type === 'preroll') {
      b.start = oneOf(inp.start ?? 'start', 'start', PREROLL_TIMING, errs);
      b.deferSec = intIn(inp.deferSec ?? 7, 'deferSec', 3, 60, errs);
      b.wait = oneOf(inp.wait ?? 'chain', 'wait', PREROLL_WAIT, errs);
      b.waitMs = intIn(inp.waitMs ?? 4000, 'waitMs', 100, 15000, errs);
      // The pre-roll's head start: this much video plays before the ad may render.
      b.minContentSec = intIn(inp.minContentSec ?? 1, 'minContentSec', 0, 30, errs);
    }
    if (type === 'midroll' || type === 'postroll') {
      // A coming break's first ad is fetched this early, so it opens with something in hand.
      b.prefetchSec = intIn(inp.prefetchSec ?? 5, 'prefetchSec', 0, 30, errs);
    }
    if (type === 'midroll') {
      b.mode = oneOf(inp.mode ?? 'cuepoints', 'mode', MIDROLL_MODES, errs);
      b.cuepoints = inp.cuepoints === undefined ? [300] : normalizeCuepoints(inp.cuepoints, errs);
      b.firstAt = intIn(inp.firstAt ?? 240, 'firstAt', 0, 3600, errs);
      b.every = intIn(inp.every ?? 480, 'every', 60, 3600, errs);
      // A REPEATING CADENCE CAN STOP (31 Aug, AD-JSON-SCOPE — the JSON's
      // totalImpression). A count of breaks, and `Full` is the open end, stored as
      // null: never a magic zero. Named positions carry their own count already.
      if (b.mode === 'cuepoints' && inp.cuepoints !== undefined && !b.cuepoints.length) {
        errs.push({ field: 'cuepoints', message: 'Mid-rolls need at least one break position — a placement always says where a break would fall' });
      }
    }
    // Pods: a break may play up to N ads in a row, assembled by this slot's own ladder.
    // Every fill field is inert while the count is 1, so the defaults ARE today's behaviour.
    b.podAds = intIn(inp.podAds ?? 1, 'podAds', 1, 3, errs);
    b.nextAd = oneOf(inp.nextAd ?? 'top', 'nextAd', POD_NEXT_AD, errs);
    b.podBanner = oneOf(inp.podBanner ?? 'last', 'podBanner', POD_BANNER, errs);
  }
  // How long each rung of this slot's waterfall waits before falling through.
  b.tagTimeoutMs = intIn(inp.tagTimeoutMs ?? 2500, 'tagTimeoutMs', 500, 8000, errs);
  // THE BREAK'S OWN GIVING-UP POINT (31 Aug, AD-JSON-SCOPE — the JSON's totalTimeout):
  // a cap on the whole ladder's asking, sitting one row under the per-try wait it
  // argues with. The unreachable-tail warning is counted where the rung count is known.
  if (SLOT_KIND[type] === 'ladder') {
    b.fillTimeoutSec = intIn(inp.fillTimeoutSec ?? 20, 'fillTimeoutSec', 5, 120, errs);
  }
  // Soft warnings — levers, not walls.
  if (type === 'preroll') {
    if (b.start === 'deferred' && b.deferSec > 15) warns.push('Deferring the pre-roll past 15s loses most short sessions before the ad ever runs');
    if (b.wait === 'timed' && b.waitMs < b.tagTimeoutMs) {
      warns.push(`A ${fmtSecs(b.waitMs)} wait is shorter than the ${fmtSecs(b.tagTimeoutMs)} a single tag may take — the pre-roll will usually be cut off`);
    }
    if (b.wait === 'timed' && b.waitMs > 8000) warns.push(`Making viewers wait ${fmtSecs(b.waitMs)} before content starts loses most short sessions`);
  }
  if (type === 'midroll') {
    if (b.mode === 'cuepoints' && b.cuepoints.length >= 4) warns.push('4+ mid-roll breaks is heavy for anything under 20 minutes');
    if (b.mode === 'interval' && b.every < 180) warns.push(`A break every ${fmtSecs(b.every * 1000)} is heavy — most streams settle around 8 minutes`);
    if (b.mode === 'cuepoints' && b.cuepoints.some((c, i) => i > 0 && c - b.cuepoints[i - 1] < 60)) {
      warns.push('Break positions under a minute apart will feel relentless');
    }
    // The heavy-cadence warnings multiply by the pod. Guarded so exactly one fires.
    if (b.mode === 'interval' && b.podAds > 1 && b.every >= 180 && b.every / b.podAds < 180) {
      warns.push(`A break every ${fmtSecs(b.every * 1000)} at ${b.podAds} ads is one ad every ${fmtSecs(Math.round(b.every / b.podAds) * 1000)} — heavy`);
    }
    if (b.mode === 'cuepoints' && b.podAds > 1 && b.cuepoints.length < 4 && b.cuepoints.length * b.podAds >= 4) {
      warns.push(`${b.cuepoints.length} breaks at ${b.podAds} ads each is ${b.cuepoints.length * b.podAds} mid-roll ads — heavy for anything under 20 minutes`);
    }
  }

  for (const e of errs) errors.push({ field: e.field, message: prefix + e.message });
  for (const w of warns) warnings.push(prefix + w);
  return b;
}

// ACROSS THE SESSION IS GONE (27 Aug, user call). The group was fifteen fields, cut to
// three on the morning's scope audit and to nothing that evening: a placement has no
// session-wide settings at all any more, only its slots. Removed from the model, not
// hidden — every one of the fifteen is refused by name, with where the answer lives.
export const DEAD_RULE_FIELDS = {
  maxAdsPerSession: ['Most ads a session', 'a break plays what its own slot says, and the ladder behind it is the only cap'],
  cooldownAfterBreak: ['Quiet after a break', 'the mid-roll cadence already says how far apart breaks fall'],
  noFillAction: ['When nothing fills', 'nothing fills means the content plays — there was never a second answer'],
  bannerTimes: ['Banner shows at', 'the squeeze-back slot is the banner — its show times are its own'],
  bannerStay: ['Banner stays for', 'the squeeze-back slot is the banner — how long each one holds is its own'],
  bannerDismissible: ['Banner dismissible', 'the squeeze-back slot is the banner — there is nothing else to dismiss'],
  overlayGap: ['Overlay gap', 'the squeeze-back paces itself, with its own rotation and per-session cap'],
  requestTimeoutMs: ['Ad request timeout', 'each break sets how long one try waits, on its own slot'],
  retries: ['Retries', 'the waterfall is the retry — add a rung instead'],
  companions: ['Companion ads', 'companion banners arrive with the ad, in the VAST response'],
  companionBackfill: ['Companion backfill', 'companion banners arrive with the ad, in the VAST response'],
  companionPersist: ['Companions persist', 'companion banners arrive with the ad, in the VAST response'],
  adjacentRefresh: ['Adjacent refresh', 'adjacent slots are the page\u2019s display units — this panel does not serve them'],
  adjacentInterval: ['Adjacent min interval', 'adjacent slots are the page\u2019s display units — this panel does not serve them'],
  adjacentViewability: ['Adjacent viewability gate', 'adjacent slots are the page\u2019s display units — this panel does not serve them'],
};

// A payload still carrying any of them is named, never quietly dropped.
export function refuseDeadRules(input, errors, prefix = '') {
  for (const f of Object.keys(input || {})) {
    const dead = DEAD_RULE_FIELDS[f];
    if (dead) errors.push({ field: f, message: `${prefix}“${dead[0]}” is not set on a placement any more — ${dead[1]}` });
  }
}

// ---------- rungs ----------
// Rung 1 is the primary; rungs 2..MAX_RUNGS are Waterfall 1..9 — plain rungs all the
// way down (the "Waterfall N" pool was removed 25 Aug, user call: with ten positions
// there is nothing left for a terminal set to do that a position cannot).
//
// EVERY RUNG CARRIES A SWITCH (19 Aug). A rung that is switched off keeps its place and
// its tag and is simply skipped when the ladder is walked. Under two rooms this switch
// becomes the ops team's sharpest tool: flipping a rung off in a SHARED setup takes a
// sick partner out of every attached integration in one act.

export function normalizeRungs(raw, family, errors, field, where, alsoTakes = null, kind = 'ladder', slotType = null) {
  const rungs = [];
  const seenTags = new Set();
  let chain = 0;
  for (const r of Array.isArray(raw) ? raw : []) {
    if (!r) continue;
    // A rung is on unless it says otherwise, so anything written before switches
    // existed keeps running.
    const on = r.on !== false;
    if (r.type === 'group') {
      errors.push({ field, message: `${where}: Waterfall N is gone — list its tags as plain rungs (a ladder holds up to ${MAX_RUNGS})` });
      continue;
    }
    const tagId = str(r.tagId);
    if (!tagId) continue;
    const tag = state.tags.get(tagId);
    if (!tag) {
      errors.push({ field, message: `${where}: that ad tag no longer exists` });
      continue;
    }
    if (seenTags.has(tagId)) {
      errors.push({ field, message: `${where}: “${tag.name}” appears twice — the same tag would be tried twice in a row` });
      continue;
    }
    if (tag.type !== family && tag.type !== alsoTakes) {
      errors.push({ field, message: `${where}: “${tag.name}” is a ${tag.type} tag — this takes ${family} tags` });
      continue;
    }
    seenTags.add(tagId);
    const rung = { type: 'tag', tagId, on };
    // A BANNER CARRIES ITS OWN FOUR FACTS (31 Aug, AD-JSON-SCOPE): where on the page,
    // whether content pauses, and its lifecycle clocks — counted from the moment it
    // APPEARS, so each number stands alone. Type-based, never value-based: a GPT/display
    // rung always has them, a video rung never does. In a rotation the timings live in
    // Delivery settings (drawn once, not five times), so its rungs keep only the slot.
    // PAUSE CONTENT IS EVERY UNIT'S OWN ANSWER in a break (31 Aug, user call — and the
    // JSON's: every unit carries `pause`). A video unit defaults to pausing (it takes
    // the screen); a banner defaults to playing over. The CLOCKS and the PAGE SLOT stay
    // the banner's alone — a video ad runs its own length in the player's own frame.
    if (kind === 'ladder') {
      const rerrs = [];
      rung.pause = oneOf(r.pause ?? (tag.type === 'video' ? 'yes' : 'no'), 'pause', PAUSE_MODES, rerrs);
      // REQUEST DELAY on EVERY ladder rung (2 Sep, user call — was the banner-only
      // "render delay"): how long after its turn comes the unit's request fires. A
      // banner defaults to 1s as it always did; a video rung is sparse — absent fires
      // immediately, so every rung saved before the widening behaves exactly as it did.
      if (r.showAfterSec !== undefined || tag.type === 'display') {
        rung.showAfterSec = intIn(r.showAfterSec ?? 1, 'showAfterSec', 0, 30, rerrs);
      }
      for (const e of rerrs) errors.push({ field, message: `${where}: “${tag.name}” — ${e.message}` });
    }
    // AD PLACEMENT IS EVERY UNIT'S (3 Sep, user call): where on the page the unit
    // renders — a banner directly, a video unit's companion alongside it. It used to be
    // a display-only fact, and a video unit carrying one was refused by name.
    if (kind === 'ladder' || slotType === 'outstream') {
      rung.displaySlot = DISPLAY_SLOTS.includes(r.displaySlot) ? r.displaySlot : DISPLAY_SLOTS[0];
      if (r.displaySlot !== undefined && !DISPLAY_SLOTS.includes(r.displaySlot)) {
        errors.push({ field, message: `${where}: “${r.displaySlot}” is not an ad placement the player offers — ${DISPLAY_SLOTS.map(x => DISPLAY_SLOT_WORD[x]).join(', ')}` });
      }
    }
    if (tag.type === 'display') {
      if (kind === 'ladder') {
        const rerrs = [];
        rung.closeAfterSec = intIn(r.closeAfterSec ?? 5, 'closeAfterSec', 0, 60, rerrs);
        rung.hideAfterSec = intIn(r.hideAfterSec ?? 10, 'hideAfterSec', 5, 120, rerrs);
        if (!rerrs.length && rung.hideAfterSec < rung.closeAfterSec) {
          rerrs.push({ field: 'hideAfterSec', message: `it would hide at ${rung.hideAfterSec}s, before its close button at ${rung.closeAfterSec}s` });
        }
        for (const e of rerrs) errors.push({ field, message: `${where}: “${tag.name}” — ${e.message}` });
      }
    } else if (r.closeAfterSec !== undefined || r.hideAfterSec !== undefined) {
      errors.push({ field, message: `${where}: “${tag.name}” is a video ad — it runs its own length in the player's frame, so a close button and an auto-hide clock do not apply` });
    }
    rungs.push(rung);
    chain++;
  }
  // A break falls back to ONE display unit — the settle point. Two would make every
  // type-addressed act ambiguous.
  if (kind === 'ladder' && alsoTakes === 'display') {
    const displays = rungs.filter(r => r.type === 'tag' && state.tags.get(r.tagId)?.type === 'display');
    if (displays.length > 1) {
      const names = displays.map(r => `“${state.tags.get(r.tagId).name}”`).join(' and ');
      errors.push({ field, message: `${where}: a break falls back to one display unit — ${names} are both display tags` });
    }
  }
  if (kind === 'rotation') {
    if (chain > ROTATION_MAX) {
      errors.push({ field, message: `${where}: a squeeze-back rotates up to ${ROTATION_MAX} tags (got ${chain})` });
    }
  } else if (chain > MAX_RUNGS) {
    errors.push({ field, message: `${where}: at most ${MAX_RUNGS} rungs — one primary and ${MAX_RUNGS - 1} waterfalls (got ${chain})` });
  }
  return rungs;
}

// What the ladder would actually walk: switched-off rungs are configuration, not demand.
export function liveRungs(rungs) {
  return (rungs || []).filter(r => r.on !== false);
}

// ---------- the walk a section makes (DRIVING-SCOPE, 26 Aug) ----------
// The setup's ladder IS the arrangement now — no local order, no local mutes. Rungs
// are still addressed by KEY (the tagId), never by index.

export function rungKeyOf(r) {
  return r.tagId;
}

// The ladder as the product room sees it: the setup's rungs in the setup's order, each
// carrying the one off-state left — the ops kill switch.
export function localLadder(rungs) {
  return (rungs || []).map(r => ({ ...r, key: rungKeyOf(r), opsOff: r.on === false }));
}

// The setup's own walk: the live rungs, in the setup's order. The ops-side positional
// depth (walkDepth) died 31 Aug with the field cut — the surface's Waterfall depth in
// Ad delivery is the one cut left.
export function localWalk(rungs) {
  return localLadder(rungs).filter(r => !r.opsOff);
}

// The provider a rung answers with — the vocabulary drive decisions are made in.
export function rungProvider(r) {
  const tag = state.tags.get(r.tagId);
  return tag ? tag.provider : 'other';
}

// The walk a section REALLY makes: the setup's arrangement with the drive decision
// resolved against it. With no `who` and no `tries` this is exactly the old walk.
//   who unset      → the setup's positional walk, untouched.
//   who = only:p   → that company's live rungs, in setup order.
//   who = first:p  → that company's live rungs first, then the rest, in setup order.
//   tries          → the surface's own count of real tries, cut last.
// `fellBack`: the decision found nothing (only:p with no p) — the break runs the
// setup's own arrangement instead, loudly, because an empty break is silent lost money.
export function driveWalkRungs(rungs, behaviour, drive, type) {
  const base = localWalk(rungs);
  const d = drive || {};
  const ask = driveAsk(d.ask);
  let walk = base;
  let fellBack = false; // the fallback EXISTS and the decision filtered it to nothing — the walk diverges
  let vacuous = false; // no fallback to decide over — the walk is the same either way (1 Sep, groups walkthrough)
  if (ask && SLOT_KIND[type] !== 'rotation') {
    // TIERS (31 Aug, AD-JSON-SCOPE): the PRIMARY is a position, not a preference — it
    // is always tried first and the ask never displaces it. What the ask filters and
    // orders is the FALLBACK, which is the only ordered thing left.
    const ladder = localLadder(rungs);
    const primary = ladder[0] && !ladder[0].opsOff ? ladder[0] : null;
    const tail = ladder.slice(1).filter(r => !r.opsOff);
    // Only the partners on the list, in the order the list puts them. The sort is
    // stable, so two rungs of the same partner keep the order ad ops gave them.
    const mine = tail.filter(r => ask.includes(rungProvider(r)));
    if (!tail.length) {
      // No fallback at all: the decision has nothing to bite on. The walk stands as it
      // is (a primary is a position), so the standing views stay QUIET — but the save
      // that makes such a decision still counts this section as one it means nothing in.
      vacuous = base.length > 0;
    } else if (!mine.length) {
      // None of those partners in the fallback — the decision cannot mean anything in
      // this section, so it runs the setup's own arrangement, loudly.
      fellBack = true;
    } else {
      const ordered = [...mine].sort((a, b) => ask.indexOf(rungProvider(a)) - ask.indexOf(rungProvider(b)));
      walk = [...(primary ? [primary] : []), ...ordered];
    }
  }
  if (d.tries && SLOT_KIND[type] !== 'rotation') walk = walk.slice(0, d.tries);
  return { walk, fellBack, vacuous };
}

// A slot's BREAK GROUPS (31 Aug): only a mid-roll holds more than one; every other
// slot reads as its own single group, so callers walk one grammar.
export function slotGroupDefs(slotDef) {
  return (slotDef.groups && slotDef.groups.length)
    ? slotDef.groups
    : [{ rungs: slotDef.rungs, behaviour: slotDef.behaviour }];
}

export function driveWalk(secDef, drive, type) {
  const g = slotGroupDefs(secDef.slots[type])[0];
  return driveWalkRungs(g.rungs, g.behaviour, drive, type);
}

// Every group's walk, resolved the same way — the seam and the player read all of them.
export function groupWalks(secDef, drive, type) {
  return slotGroupDefs(secDef.slots[type]).map(g => driveWalkRungs(g.rungs, g.behaviour, drive, type));
}


