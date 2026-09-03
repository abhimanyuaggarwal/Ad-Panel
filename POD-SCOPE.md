# Client-side ad pods — scope (24 Aug 2026)

A break plays exactly one ad today. This scopes **pods**: a break plays up to N ads back-to-back,
assembled on the client by the existing ladder. Landscape, in one line each: Google builds pods
server-side (one ask returns a packed, deduped break — 6-second bumpers exist to monetize the
leftover seconds); client-side assembly asks per slot and carries those burdens itself; SSAI
(stream-stitched pods) is a different product and out of scope. We build the client-side kind.

**Update, 24 Aug late (two-rooms rework):** ad rules stopped being an identity — the pod
fields now live in each integration's own rules, edited per section at `#keys/:id/rules/:i`
with the same segs, per-break rows and live counted warnings. The pod *counts* also joined
the bulk rule fields (a slice of phase 3); the fill answers stay per-integration. Phase 4
(the player contract in API-SPEC.md) remains open.

**Status: phases 1–2 BUILT 24 Aug 2026, IA reworked per break the same evening (PM review)** —
phase 1: fifteen per-break fields, validation, the three counted warnings, eight pinned cases
(`npm run test:panel`, 79). Phase 2: the ad rules editor — the `ads in a row` segs with each
break's pod rows as its own children, live counted warnings per break, the spec-preview rows;
screenshot-verified end to end (`panel/shots/ad-rules-perbreak-*.png`), UI save round-trip
checked against the API. Phases 3–4 unbuilt. Decisions below are the PM's calls of 24 Aug 2026.

## The one rule, extended

> **Demand decides *whether*. Policy decides *how*.** A pod changes neither object.

How many ads a break plays, its time budget, how the next slot is filled, where a banner may sit —
all *how* → **ad rules**. Who supplies each ad → the **same ladder, untouched**. No new objects,
no slot change, no tag change. A pod is a property of the break, not of the ladder.

## Model — fifteen policy fields, nothing else (reworked per break, 24 Aug evening)

```
{preRoll,midroll,postRoll}PodAds      1–3 · default 1      ads in a row, per break type
{preRoll,midroll,postRoll}BreakSec    10–180 · default 60  that break's own time budget
{preRoll,midroll,postRoll}Overrun     'play' (default) | 'strict'
{preRoll,midroll,postRoll}NextAd      'top'  (default) | 'next'
{preRoll,midroll,postRoll}PodBanner   'last' (default) | 'any'
```

- **Everything is per break type (PM IA review, 24 Aug evening).** The first cut made the four
  fill fields one answer per policy; superseded the same day — a pre-roll blocks content from
  starting while a mid-roll interrupts it, so budget, overrun, walk and banner are each break's
  own call, and the shared answer also made the editor's floating card govern at a distance.
- **Squeeze-back is a rotation, not a break** — by construction none of this touches it.
- **`podPosition` ("Ad 1 of N") already exists** — it was built as a countdown mode and is the
  viewer half of pods. Nothing new to build viewer-side.

## The walk (player contract — the panel stores it, the player obeys it)

1. **Each slot walks the ladder.** `podNextAd: 'top'` (default): every slot starts at the primary —
   the first-choice seller gets a shot at every slot; the same ad may repeat (accepted, see
   Duplicates). `'next'`: each filled slot moves the start down one live rung — every ad from a
   different seller, no repeats, slots reach cheaper demand sooner; ladder exhausted → break ends.
   No wrap-around (a wrap would re-create the repeats this mode exists to avoid).
2. **Fetch during playback.** While slot k plays, slot k+1 is fetched in the background. The only
   wait a viewer can feel is before the first ad — which is exactly what the slot row's worst-case
   arithmetic already describes, so that number stays true unchanged.
3. **Never wait between ads.** Ad ends and nothing is in hand → content resumes. "Up to N" is a
   ceiling, never a promise. Never a spinner, never a black frame.
4. **The budget gates by mode.** `'play'` (default): the budget never rejects an ad that arrived —
   it only stops the break from *asking again* once spent (60s budget, 30s + 35s both play, no
   third ask). No length hint is sent, else the 35s ad would never arrive to be played. `'strict'`:
   asks carry "nothing longer than what's left" where the seller supports it (GAM does), and an
   oversize arrival is discarded unplayed — free, since impressions only count on playback — and
   the next rung tried. **In both modes: never trim an ad mid-play.**
5. **Multi-ad answers are honoured.** One ask can return several sequenced ads (GAM really sends
   these). They play in their given order and consume that many slots and seconds; whatever no
   longer fits the count — or, under `'strict'`, the budget — is dropped unplayed.
6. **A banner in the break.** `'last'` (default): the display rung keeps today's meaning — the
   settle point; once a banner plays, the break ends on it. `'any'`: a banner may fill a middle
   slot, holds full-frame for its existing `bannerStay`, and the break continues. Either way **one
   banner per break** — two stills back-to-back is a slideshow, not an ad break.
7. **The session cap counts ads, not breaks.** A 3-ad pod spends 3 of `maxAdsPerSession` — the
   viewer genuinely watched three commercials, and that is the thing the cap protects.
   `cooldownAfterBreak` runs from the break's end, unchanged.

## Duplicates — deliberately out of v1 (PM call, 24 Aug)

The same commercial can appear twice in one break and v1 does nothing about it. Stated here so
nobody discovers it as a bug. The follow-ons, in order of value: **id-check backstop** (compare
each arriving ad's id against the break, discard matches — what player frameworks ship);
**pod-labelled asks to GAM** (label the requests as one break so *its* server dedupes — the only
guaranteed route); **whole-pod ask** (one GAM request returns the packed break — lands as a third
value of `podNextAd`: *"let the seller pack the break"*, which is why that control is cut at this
joint). Brand-level separation (two different Pepsi spots) is not reliably possible client-side —
the advertiser field is too often empty — and is not promised in any version.

## The journey — one control at rest, the rest revealed

**The whole trick is progressive disclosure, and scope is position (reworked 24 Aug evening).**
At `podAds = 1` (every existing policy), the editor gains exactly one small segment per break row
and nothing else. A break's pod rows live **under that break** as child rows, present only while
THAT break plays more than one ad — so nothing governs at a distance, and different breaks hold
different answers side by side. (The first cut floated one shared "How a break fills" card below
all the breaks; deleted on PM review for exactly those two failures.)

    Pre-roll     Plays [At start | Deferred]   ads in a row [ 1 |2| 3 ]
      Break lasts   [ 30 ] sec   if an ad runs over [ Play it |Keep to time| ]
      Next ad from  [ Top of the ladder | Next rung down ]   your first choice gets a shot at…
      Banner may    [ Last slot only | Any slot ]   one banner per break
    Mid-rolls    [At set positions | Every so often] …   ads in a row [ 1 | 2 |3| ]
      At            [ 4:00, 11:00, 18:00 ]
      Break lasts   [ 90 ] sec   if an ad runs over [ |Play it| Keep to time ]
      ⚠ 3 breaks at 3 ads each is 9 mid-roll ads.
    Post-roll    ads in a row [ |1| 2  3 ]        ← its first and only rule field

- **Controls are named by consequence, never mechanism** — no "walk", no "strategy", no
  "overrun mode". The line under `Next ad comes from` swaps with the selection (`'next'` reads:
  *"every ad from a different seller — slots go to cheaper demand sooner"*), so both sides of the
  trade are stated where the choice is made, not discovered in a revenue report.
- **"First choice", never "best payer" (PM pushback, 24 Aug).** The ladder is the order ops
  *prefers to sell* — usually tracking expected value, but never a per-ad price ranking: CPMs move
  per request and a lower rung can beat an upper one on a given call. The copy must not claim
  otherwise.
- **Integration editor: unchanged.** The ladder is untouched and the worst-case wait stays the
  first-ad fact. The attached ad-rules spec preview gains one row per podded break —
  `Mid-roll pod · 3 ads · ~90s (an over-length ad still plays) · next from the next rung` — so
  pod shape is visible from the integration side without a new control.
- **Warnings, counted, never blocking:**
  - session arithmetic: *"a full 3-ad pre-roll leaves 1 ad for every later break"* (`podAds` vs
    `maxAdsPerSession`);
  - the existing heavy-cadence warnings multiply by the pod: *"a break every 4 min at 3 ads is
    heavy"*;
  - pods without the label: *"3 ads in a row with the countdown hidden — viewers can't see the
    break's end"* (`podAds > 1`, `countdown: false`).
- **Bulk:** the seven fields join `BULK_POLICY_FIELDS`; each break tab's *How it behaves* section
  carries its own `Ads in a row`, the fill cluster renders on any break tab and writes the
  policy-level fields once; `mixed` chips and copy-on-shared-rules exactly as today.

## Decisions of record (24 Aug 2026)

| Call | Decision |
|---|---|
| Duplicates | Out of v1 entirely; follow-ons named above |
| Time budget | A lever, not a wall: `'play'` default (budget gates asking, never playing), `'strict'` opt-in |
| Next-slot walk | Configurable (platform call). Default `'top'` carries the product opinion; most integrations never touch it. **Revisit when dedupe ships** — `'next'` exists chiefly as v1's only repeat protection, and a knob is easy to add, near-impossible to remove |
| Multi-ad answers | Honoured — the server said these run together; playing half its answer discards ads it chose to serve |
| Banner position | Configurable (PM call): `'last'` default keeps the settle-point meaning; `'any'` allowed; one banner per break regardless |
| Ladder ≠ price | Recorded: order is preference, not per-ad value — copy says "first choice" |

The test-matrix price is paid knowingly: walk × budget mode × banner position × honoured answers
is already 8+ behavioural combinations per break, each needing a pinned case in `test:panel`.

## Out of scope

SSAI / stream stitching · duplicate handling (v1) · brand separation (any version) · per-break
fill overrides · rung-level duration hints outside `'strict'`-mode GAM asks · pod bidding.

## Build order (sized)

| Phase | Work | Notes |
|---|---|---|
| 1 | Model + API: seven fields, validation, the three counted warnings, migration (defaults = today's behaviour) | Tests-first; every existing policy must normalize unchanged |
| 2 | Ad rules editor: three segs, the revealed fill cluster, spec-preview row | The disclosure rule is the review point |
| 3 | Bulk: fields into the break tabs + `BULK_POLICY_FIELDS` | `mixed` handling exists |
| 4 | Player contract: the seven walk rules above land in `API-SPEC.md` as the config consumer's spec | The panel stores; the player obeys |
