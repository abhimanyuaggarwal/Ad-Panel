# The player's ads JSON — scope (31 Aug 2026)

**Status: BUILT 31 Aug 2026, phases 1–3** — model + API (Direct + its cap, mid-roll break
groups, banner facts on the rung, the three-way pause, break fill timeout, out-stream as a
fifth slot, templates as objects, playback timing on the player, the tiered walk), both
rooms' editors, the bulk additions, and the live config's new shapes. `npm run test:panel`
= 107 cases (15 new, 5 rewritten for the tiers); every journey screenshot-verified
(`panel/shots/json-*.png`) and UI save round-trips checked against the API. Deviations
from the scope as written, recorded: a rung's **display slot defaults** to the vocabulary's
first entry rather than refusing (every existing fixture and ladder stays valid; an unknown
value still refuses by name) — and **templates are assigned template-first** ("assign
tags…" on the template row) because the panel has no tag editor page for a per-tag picker
to live in. Re-homed same day (user call: a card under the listing was disjoint): the
templates live INSIDE the setup editor — one collapsed row at its foot, still global
objects, the assign dialog leading with the setup's own tags. The mid-roll's GROUPS row
now renders even at one group (a lone tab is a fact, not a choice), so "+ Add group" has
one findable home. Phase 4 (the written player contract) stays open. README.md is the spec of
record for what exists; this document remains the record of why.

Companions: `AD-SETUP-SCOPE.md` (two rooms), `DRIVING-SCOPE.md` (the drive + the 1:1 promise),
`POD-SCOPE.md` (pods), `WATERFALL-SCOPE.md` (ladders). `README.md` stays the spec of record.

## What the JSON asks for that we do not have

Eight things, and only eight — the rest of the JSON is already in the model:

1. **A Direct tier** above Primary, global to the surface, capped per session.
2. **Banner units carry four more facts** — where on the page, whether content pauses, when the
   close button appears, when it auto-hides.
3. **`pause` becomes a three-way answer** — Yes / No / By player size.
4. **Mid-roll break groups** — up to 3, each with its own cadence (stoppable) and its own ladder.
5. **Out-stream** — banners while nothing is playing.
6. **A break-level fill timeout** — a cap on the whole ladder, not one try.
7. **Three player timing settings** — prefetch, minimum content before ads, mini-player expand.
8. **Request templates** — named macro URLs, authored in the ops room, picked per unit.

Everything else maps onto what exists: `type` → the breaks · `init` → cue points · `impression`
→ Target impressions count · `timeout` → Tag timeout · `maxWait` → Ad start / hold · `adsdk` →
the provider chip · rung order and per-rung switches → the ladder.

## The one rule, extended

> **Ad ops supply WHAT can fill. The integration says WHETHER it runs. Its own settings say HOW
> it behaves.** A tier is a *what*, so it lives in the ad setup. A banner's four numbers describe
> one unit's own behaviour, so they live on that unit's row. Neither adds a screen.

## The model

```
AD SETUP  (one per integration — the 1:1 promise, unchanged)
│
├─ DIRECT              ONE list. Tried first at every break. Max N ads a session.
│
└─ PLACEMENTS (≤5)
   ├─ Pre-roll         PRIMARY → FALLBACK 1..9        + delivery settings
   ├─ Mid-roll         PRIMARY → FALLBACK 1..9        + cadence, now stoppable
   ├─ Post-roll        PRIMARY → FALLBACK 1..9
   ├─ Squeeze-back     rotation (banners take turns)
   └─ Out-stream       rotation, outside playback     ← new, fifth tab

EVERY UNIT   provider · ad unit · switch                       (unchanged)
BANNER UNIT  + display slot · pause content · display delay · close button after · auto-hide after
```

`direct` is global because the user called it global. `primary` and the fallback stay per break.
Nothing else in the tiering is reorderable: **Direct and Primary are positions, not preferences.**

## Where each control lands — and why nothing new appears

### 1 · Direct is one collapsed row, above the placement tabs

It sits above PLACEMENTS on screen because it sits above them in the walk. Position on screen is
position in the walk — the same honesty the two-piece ladder bought on 27 Aug.

    Direct   2 tags · up to 2 a session · tried first at every break        ›
    ───────────────────────────────────────────────────────────────────────
    PLACEMENTS   Default   Shorts feed                        + Add placement

At rest on a surface with no direct demand it reads **`Direct   none — every break starts at its
primary`** and costs exactly one line. Open, it is the ladder anatomy already built: the ad-source
rows, plus one delivery row.

    DIRECT
      AD SOURCES        ⬤ IMA ▾   TOI Homepage Takeover
                        ⬤ IMA ▾   TOI Q3 Auto Roadblock
      Max ads a session   [ 2 ]     2 of every session's ads before any break asks its primary

**Why not inside each break:** it would be drawn four times and read as four decisions. One
concept, one control.

**This is a narrow reversal of "Across the session is gone" (27 Aug).** That cut removed
*placement-level* session rules, on the grounds that a break plays what its own slot says. Direct
is not a placement rule: it is a property of the direct list itself, which is session-scoped by
nature — a direct deal promises N impressions to a buyer, not N per break. The other fourteen
cut fields stay refused by name.

### 2 · A banner unit grows a sub-row. A video unit grows nothing.

The rung row was calmed down on 20 Aug precisely because three same-shaped pills read as noise.
Four more controls on every row would undo that. They don't need to be:

- **Video units never delay and always pause.** `delay: 0`, `pause: 1` on every IMA unit in the
  JSON, without exception. A control that can hold one value is not a control — `delay` is
  **dropped for video units** rather than drawn greyed.
- **A break already allows exactly ONE display unit** (existing refusal: *"a second display rung
  is refused naming both tags"*). So at most one row per break can ever carry the sub-row. The
  clutter is bounded by a rule that already exists.

<!-- -->

    PRIMARY        [◗]  IMA ▾   TOI Mweb VideoShow Pre-roll
    FALLBACK ORDER  7 of 9 active
      1            [◗]  CAN ▾   TOI Video Backfill
      2            [◗]  GPT ▾   TOI Mweb VideoShow Display
         BANNER         Display slot  [ Player bottom ▾ ]
                        Pause content  [ Yes | No | By player size ]
                        Shows after [1]s · close button after [5]s · hides after [10]s
      3            [◗]  IMA ▾   TOI Desktop VideoShow Pre-roll

Type-based variation, which the 25 Aug fixed-layout rule explicitly permits: *"a mid-roll has no
'plays at start' because that is what the break IS, and it is stable."* A GPT unit is display by
construction (`PROVIDER_TYPE`), so this is stable too — it is not a reveal, nothing moves under
the cursor as a value changes.

The one thing that *is* value-driven greys in place per the rule: **with Pause content = Yes, the
close-button time greys out** — and ONLY that one (corrected 31 Aug on user review; the first cut
greyed all three clocks). The player's own contract makes it the single conditional: *"skip
duration used to show close icon when contentPause=false"*. The other two always apply — a banner
still waits before it appears, and still has to hide, which is precisely what lets paused content
resume. The greyed field keeps its seat, hover reading *"content is paused — the player shows its
own ad controls, not a close button."*

**In the out-stream, every unit is a banner** — so the three timings live in Delivery settings
where the rotation's `hold` and `per session` already live, and the rung keeps only its display
slot, inline on the row. **The squeeze-back's rungs carry no display slot at all** (31 Aug design
pass): the squeeze-back IS its own position on the player — a page slot on its banners was a
field with nothing to decide, drawn three times.

### 3 · Display slot is a dropdown of preconfigured positions

`Player bottom · L_50 · …` — a fixed vocabulary from the player, never free text. A typed
position is a dark ad nobody discovers until a revenue report.

> **Naming collision to settle:** Delivery settings already has **Display ad position**
> (`podBanner`: *Last position only / Any position*) — where a banner may sit **in the pod**. The
> new field is where it sits **on the page**. Two "positions" on one card is one too many.
> Recommend the new one is **Display slot**, hover *"where on the page this banner renders."*

**Sizes are out of scope, by your call.** Consequence, recorded: GPT cannot request a banner
without a size, so the size set belongs to the position on the player side. The panel names the
position; the player knows what fits there. That is a cleaner split than storing pixels twice.

### 4 · A mid-roll is now BREAK GROUPS — up to 3, each with its own cadence and ladder

The JSON carries two `mid` pods — an opening beat (`at 0:30, repeat 10s`) and a steady drumbeat
(`from 2:00, every 3:00, stop after 5`) — **each with its own units list**. That is the real shape
of live mid-roll selling (user call, 31 Aug: accommodate it), so the mid-roll slot becomes a short
list of **break groups**, each one wearing the collapsible-row anatomy every slot already has —
closed, a counted fact line; open, Ad sources then Delivery settings:

    Mid-roll   2 groups · 8 tags active · 1500ms timeout
      GROUP 1   at 0:30, 0:40 · 2 ads in a row · 4 of 4 tags active            ›
      GROUP 2   every 3:00 from 2:00 · stop after 5 · 1 ad · 4 tags active     ›
      + Add a break group

- **One group is today's mid-roll, unchanged.** Every existing setup normalizes to a single
  group and the group chrome — the `GROUP n` label, the add link — **does not render at one**,
  so the 64-of-67 simple surfaces never see the concept at all. Scope is position: a second
  group is one click, not a mode.
- **Each group is the whole existing anatomy, reused** — its own ladder (primary + fallback,
  drag, per-rung switches), its own cadence in two shapes, its own pod fields, its own timeouts.
  No new renderer: the slot panel draws once per group.
- **The interval shape gains its stop:** `first at [2:00] · then every [3:00] · stop after
  [ 5 | Full ] breaks`. That is `totalImpression`; **`Full` is the open end**, borrowing
  Waterfall depth's vocabulary rather than inventing a magic zero.
- **Cap: 3 groups** — the JSON needs two; three covers an opener, a drumbeat and a closer.
  A fourth is refused naming the cap, like sections and rungs.
- **Groups may collide in time; that warns, counted, never blocks:** *"Group 1 and Group 2 both
  fall near 2:00 — two breaks 10s apart will feel relentless."* Same arithmetic as the existing
  positions-under-a-minute warning, run across groups.
- **The pod warnings count ALL groups now:** *"2 groups at 2 ads each is up to 14 mid-roll ads"*
  — summed from each group's cadence × its stop × its ads-in-a-row. Counted, per principle #1.

**Everywhere else, mid-roll stays ONE word.** The integration's drive keeps a single Mid-roll tab
— its decisions (partners, depth, ads in a row) apply to every group, because "pause mid-rolls on
Shorts, now" is a call about the break type, not about group 2. The resolved waterfall lists each
group on its own line, exactly as it lists sections. The switch is one switch: a surface runs
mid-rolls or it does not. Per-group driving is deliberately out of v1 — if the ask arrives it is
a group picker on the tab, not a new grammar.

### 5 · Out-stream is a fifth tab, with the squeeze-back's anatomy

Structurally it already exists: a rotation of banners with show times, a hold, and a per-session
cap. Out-stream is that, outside playback, plus one switch.

    BREAK   ⬤ Pre-roll   ⬤ Mid-roll   ⬤ Post-roll   ○ Squeeze-back   ⬤ Out-stream

    OUT-STREAM      1 banner · every 30s · up to 2 a session
      AD SOURCES    ⬤ GPT ▾  TOI Player Bottom 640x90   ·  Display slot [ Player bottom ▾ ]
      DELIVERY      Shows at        [ 0:00, 0:30, 1:30 ]
                    Each holds      [ 20 ] sec
                    Max a session   [ 2 ]
                    Hide during video ads   [◗]        hideOnInStream

The tabs already carry state dots and the whole grammar. Five tabs is one more tab, not one more
idea. **Direct does not reach out-stream** — Direct is break demand; out-stream is not a break.

### 6 · The break's fill timeout sits in the row it argues with

Delivery settings already ends on **Tag timeout `1500 ms`** with its counted consequence beside
it — *"8 × 1500ms — up to 12s to fill"*. `totalTimeout` is a cap on exactly that number, so it is
the next row and nowhere else:

    Tag timeout          [ 1500 ] ms    8 × 1500ms — up to 12s to fill
    Break fill timeout   [ 20 ]   sec   the whole ladder gives up here

**New counted warning, never blocking:** when depth × tag timeout exceeds the fill timeout, the
tail is unreachable — *"10 tries × 1500ms is 15s, but this break gives up at 12s — the last 2
tries would never run."* Counted from the two numbers on screen, exactly as principle #1 requires.

### 7 · Three player settings join the integration's Details

`prefetch`, `minPreRenderTime` and `expandInMiniTVForAds` are player behaviours, not demand — so
they belong beside Autoplay and Playback, not in the ops room. They are also settings almost
nobody changes, so they sit behind one collapsed row rather than lengthening the card for
everyone:

    Playback timing   defaults · 3 settings                                   ›
      Prefetch next break        [ 5 ] sec early
      Minimum content before ads [ 1 ] sec
      Expand banners in mini player  [◗]

`timeout` and `maxWait` from the JSON's `conf` are **not added** — they already exist as Tag
timeout and Ad start / hold, per break, which is the finer and truer grain.

## Request templates come into the panel — reversing the 20 Aug call, on purpose

The 20 Aug decision kept templates server-side: *"the shape of the URL that carries the unit is
not a decision ops make or should be able to break."* The JSON overrides it (user call, 31 Aug):
`unittpl` names **several** templates (`GAM`, `GAM_1`, `GAM_2`), a unit's `tpl` picks between
them, so which template carries a unit **is** an ops decision now — and a decision needs a home.
The half that protected ops survives in the validation: ops still cannot *break* a URL, because a
template that could not work is refused before it is saved.

**A template is a named request URL with macros, owned by the ops room:**

    template = { id, name, provider, url, property }
    macros   = [CACHEBUSTER] · [REFERRER_URL] · …    ← a FIXED vocabulary from the player team

- **They live where the tags live** — a small **Request templates** list in the ops room, beside
  the tag library. Not a sidebar entry: a template is plumbing behind a tag, not a room. Each row
  is name · provider · the URL mono · **used by N tags**, counted.
- **Choosing one is part of choosing the unit.** The tag dialog gains one row — `Requests
  through [ Standard ▾ ]` — listing that provider's templates. **Standard is absence**: a tag
  that never chose stores nothing and follows the provider's default, so every existing tag is
  untouched and the rung row shows nothing new. A non-default choice is a flag, not a label
  (the 20 Aug rung-row rule): a small `tpl` chip on the rung, name on hover, drawn **only when
  it is news**.
- **Validation, fail closed with names:** a macro outside the vocabulary is refused — *"`[REFERER]`
  is not a macro the player fills — did you mean `[REFERRER_URL]`?"*; not a full https URL,
  refused; a template's provider must match the tag's.
- **The shared-object rules apply whole**, already built for setups and tags: deleting a template
  in use is refused counting its tags; editing a live one warns with the used-by count and lands
  in Activity; publish snapshots resolve the template *value*, so a draft template edit never
  reaches a published surface.

This also closes the `GAM` / `GAM_1` / `GAM_2` question: they are simply three named templates in
the library, and the emitted `unittpl` block is generated from **the templates the surface's tags
actually chose** — authored in the panel, resolved at publish.

## The seam — new refusals, fail closed with names

Every one follows the existing pattern: name both sides, name the number found next to the number
required.

| Situation | Refusal |
|---|---|
| A banner unit with no display slot | *"“TOI VideoShow Display” has no display slot — a banner needs a place on the page."* |
| Direct list emptied while the surface is live | *"This surface's breaks start at Direct — clear it and every break falls to its primary. Switch Direct off instead."* |
| Out-stream switched on with no banner | The existing live-unit-with-no-demand refusal, unchanged. |
| Mid-roll interval with `stop after 0` | Not reachable — the control's open end is **Full**, never zero. |
| `Max ads a session` below 1 | Not reachable — an empty Direct list is how you turn Direct off. One control per concept. |
| A display slot the player does not offer | Not reachable — the vocabulary is a dropdown. |
| A fourth mid-roll break group | *"A mid-roll holds at most 3 break groups (got 4)."* |
| Deleting a break group that live surfaces run breaks from | The existing last-live-demand refusal, per group, naming the surface. |
| A template macro outside the vocabulary | *"`[REFERER]` is not a macro the player fills — did you mean `[REFERRER_URL]`?"* |
| Deleting a template in use | *"“GAM_2” carries 4 tags and cannot be deleted."* — the tag-delete rule, one level up. |
| A template on the wrong provider's tag | *"“GAM_2” is a GAM template — this tag asks CAN."* |

## Counted facts, per principle #1

Nothing new is estimated. Every summary line is arithmetic over stored numbers:

- `Direct   2 tags · up to 2 a session · tried first at every break`
- `Out-stream   1 banner · every 30s · up to 2 a session`
- `Mid-roll   4 of 4 tags active · every 3:00, stop after 5 · 1500ms timeout`
- `10 tries × 1500ms is 15s, but this break gives up at 12s — the last 2 tries would never run`
- `5 breaks at 2 ads is 10 mid-roll ads` — the existing pod warning, now counting against the
  stop count instead of an unbounded cadence

## Bulk, and what "hierarchy" means now

**Your call, played back:** Direct is fixed at the top, Primary is fixed second, and the only
ordered thing is the fallback — so that is the only order bulk arranges.

This costs almost nothing to build, because the control already exists. The integration's **Ad
partners** chip strip (numbered, drag to reorder, per-partner switch) is re-pointed and relabelled:

    Ad partners  →  Fallback order      ① IMA  ② CAN  ③ GPT
    RESOLVED WATERFALL
      Default     DIRECT › PRIMARY › IMA › CAN › GPT › IMA › IMA  +2
                  ^^^^^^^^^^^^^^^^ drawn in fixed weight — always tried, never ordered

**Waterfall depth** keeps its control and narrows its meaning: it counts **fallback tries only**.
Direct and Primary are always tried; they are not tries you can cut off. The counted fact beside
it must change with it.

**Tie-break, to be stated in the hover:** when a fallback holds two units from the same partner,
bulk sets the partner order and **ops' own arrangement stands within a partner**. A cohort act
never scrambles work someone did in their own room.

| Bulk gains | Where | Cost |
|---|---|---|
| Fallback order (by partner) | the existing `ask` chip strip, relabelled | copy only |
| Waterfall depth = fallback tries | the existing control, narrowed | copy + the counted fact |
| The three Playback timing settings | join `BULK_PLAYER_FIELDS` — the sheet draws them already | one line of server config |
| Out-stream on / off | joins `BULK_SLOT_ACTIONS` with the other four | one slot type |

| Bulk still cannot touch | Why |
|---|---|
| Which units sit in Direct, Primary or the fallback | the 19 Aug rule — you push an order, never an ad unit |
| Direct's position, Primary's position | positions, not preferences |
| A banner's display slot, pause, or timings | one unit's own behaviour, in the ops room |
| `Max ads a session` on Direct | it lives with the Direct list, in the ops room — see open question 3 |

## Where this contradicts existing decisions (deliberate, each with its force)

| Standing decision | What changes | Why the force differs |
|---|---|---|
| **Across the session is gone** (27 Aug) — every session-wide field refused by name | `Max ads a session` returns, for Direct only | It is a property of the *direct list*, not of a placement. A direct deal's promise is per session by nature. The other fourteen stay refused. |
| **"Adjacent slots are the page's display units — this panel does not serve them"** | The panel now names where a banner **it serves** renders | It still does not manage the page's own standing ad units, refresh them, or gate them on viewability. It says where its own fallback banner lands. Narrow, and the three `adjacent*` fields stay dead. |
| **Bulk reorder is not well-defined across integrations holding different tags** (19 Aug, open) | Bulk orders the fallback | Resolved rather than overridden: the thing being ordered is the **partner**, not the unit, and that is well-defined across fifty surfaces. |
| **Provider templates stay server-side, no interface** (20 Aug) | A template library in the ops room, picked per tag | The 20 Aug world had one template per provider, so there was nothing to choose. `unittpl` names several and `tpl` picks — a choice needs a home. Ops still cannot break a URL: the macro vocabulary is validated, fail closed. |
| **Ad partners orders the whole walk** (27 Aug, §14) | It orders the fallback only | Tiers now set the sequence. The control was never able to express Direct, so it was describing a walk it did not fully control. |

## Decisions of record (31 Aug 2026, the user's calls)

| Call | Decision |
|---|---|
| Tiering | Direct is **global to the surface**; Primary and fallback are **per break** |
| Direct's cap | **Max ads a session**, configured on the Direct list |
| `pause` | A **named three-way** answer per unit: Yes / No / By player size. No pixel threshold in the panel — the player owns "small" |
| `pause` on video | ~~Always Yes. Not drawn~~ **Superseded 31 Aug (user call): pause is EVERY unit's own answer** — video defaults Yes, banner defaults No, both drawn in the unit's settings fold. The clocks and page slot stay the banner's alone |
| `delay` | The banner's **show delay** — the first beat of its lifecycle, not a waterfall wait |
| `delay` on video | Always 0. Dropped, not greyed |
| `skip` / `hide` clocks | Counted **from the moment the banner appears**, so each number stands alone. Relabelled for laymen 31 Aug: **Appears after · Close button after · Auto-hides after**, one decision per line |
| Unit settings IA | **A fold per rung** (31 Aug): every filled rung wears a quiet chevron; open = that unit's own panel (pause · template · banner facts). One open at a time; a fresh pick opens its own panel so the template is attachable the moment the unit lands; a closed rung wears a chip only for what differs from its default. Kept UNDER the click on the user's question (1 Sep): pause rides every unit now, so upfront would be ~40 extra rows on a ten-rung ladder — the chips and the auto-open carry the two moments that matter | 
| Labels (1 Sep, two user calls the same hour) | First cut: the raw JSON keys as labels (`tpl`, `slot`, `init`…) — **overruled within the hour** ("not literally everything — mature, like an enterprise platform"). Settled: **industry-standard labels, the JSON key in every mapped row's hover** — unit fold: Content pause · Ad slot · Render delay · Skip offset · Auto-hide · Request template; delivery: Start offset · Max wait · Min content playback · Impressions per break · Request timeout · Total timeout · Break cap / Impression cap · Prefetch · Hide during in-stream. The hover reads "(JSON: skip)" etc., so the panel↔player mapping is never lost; panel-native fields keep their words — no key to wear |
| The drive/bulk pass (1 Sep, seven user pointers in one review) | **Direct on/off is the surface's** (`directOn`, default on) — and Direct is NOT a break, so it is not a tab (corrected same day, user call): one slim LINE above the break tabs on the integration and above the bulk sheet's tabs — its position on screen its position in the walk, mirroring the ops room's own Direct row. The switch, the walk badges, the counted cap; off = the live config carries no direct block and the resolved waterfall says "off on this surface". The "Break" tab eyebrow died in the same pass. **Superseded 1 Sep evening (user call): DIRECT IS PER BREAK, not global** — each ladder slot carries its own tier (`slot.direct = {rungs, maxSession}`), tried before that break's primary; a mid-roll's tier is the slot's, shared by its groups; rotations have none. The ops room draws it as a DIRECT zone above Ad sources inside each open break (rail: Direct · Ad sources · Delivery settings); the integration's drive gains a per-break `Direct` switch row (`drive.direct`, absence = on, bulked like any quick decision); the live config carries `slots[t].direct` inside the break instead of a top-level block. The global list, the surface-wide `directOn`, the Direct line and the standalone bulk act all died with it — a top-level `direct` payload is refused by name. **Editor chrome pass (1 Sep, six user pointers):** the resolved waterfall lists ONLY the ad sections (the Direct card left — its facts live on the drive's Direct row); a tall list scrolls inside its own column (placements are model-capped at 5; worst case 5 sections × 3 groups = 15 one-line rows, contained); the floating STATUS strip became the first row of the controls column, in the label grammar; Save/Publish moved to the page header's top right with the secondaries (Copy API key · Duplicate · Take off air · Delete) behind one ⋯ menu; Cancel died (the back arrow is the cancel; drafts don't need an explicit discard) and Take off air survives as the unpublish act, one menu deep; the footer bar died and the page fits the fold (900/900, no scroll); the fallback chips gained the resolved waterfall's own › arrows between active partners. Second chrome round (1 Sep): the break's switch is BINARY and lives at the tab strip's trailing edge (on = the break asks on this surface; a section that differs says "inactive" on its own resolved row — the toggle never does arithmetic; a mid-roll's switch covers all its groups, groups being demand-side); the Status row and the half-filled "on in 1 of 2 sections" state died; Take off air left both editors (the keys list's bulk act is the one unpublish door; a setup comes down by taking its surface down first); the ops room took the same header chrome (Save/Publish top right, Delete behind ⋯, footer gone); active fallback chips wear the ladder's own ⠿ grip. **The bulk sheet took the editor's grammar whole (1 Sep):** tabs wear the same per-break switches (queued — the one deliberate difference: a cohort flip lands via Review, counted and named, never thirty silent writes); the tickbox column died — touching a control queues it, agreed cohort values prefill, disagreement wears a `mixed today` chip; Direct is the same toggle; per-break `Reset to setup` clears the queue; the RHS is the SELECTED INTEGRATIONS, one line each (today's walk, `2 sections · direct · 2 groups` suffixes, dim when off), scrolling inside itself at scale. Third round (1 Sep, user calls): **the Review screen died** — the sheet applies directly, outcomes arriving as the counted toasts the apply already produced (changed / skipped / refused, named); the modal sizes to its content (the fixed 652px height died) and its title wears the page's own 18px face; **a switch is live only on its open tab** (both rooms — elsewhere it is read-only state, hover says "open this tab first"); an OFF break keeps its controls on screen, greyed and inert, the reason said once above them.

**The 1 Sep trims (user calls, same review):** Direct lost its session cap and its
list — the tier is ONE deal per break, uncapped, tried each time the break fires; a
second deal and a `maxSession` payload are refused by name, and the cap left the wire
(`live` direct = `{walk}`). The open-market ladder's zone is **Indirect** — the word
that pairs with Direct; a rotation keeps **Ad sources** (no Direct to pair with).
Delivery settings became one fixed 620px settings column — every rule ends where the
controls end, 33px rows, notes inline — density without a new grammar (a true two-column
pairing was tried and measured: the 642px zone cannot hold two label+segment cells, the
pairs collided). **Sync GAM units** left every slot foot for the placements line — one
directory, one CTA. The read-only setup view gained the deal as the leading line of its
break's block (the stale global Direct block died there).

**The groups walkthrough (1 Sep, user ask: multi-group mid-roll, end to end through both
bulk rooms):** driven in the browser — group added in the ops editor, saved, published,
read in the integration editor, bulked over a mixed cohort (2 groups / 2 groups / mid-roll
off / 1 group). What held: the empty-group save refused by name ("1 live section fills
their midroll group 2 from this — switch them off first: TOI Mweb VideoShow · Default"),
the wire carried both groups whole (group 2's own cadence and walk), the editor's resolved
waterfall answered per group with its cadence under it, the bulk sheet's cohort lines wore
"2 groups" and a bulked Waterfall depth sliced EVERY group's walk on every surface. What
broke and was fixed: a group with no fallback read as "fell back — setup order" with an
add-partner lever, though its walk cannot diverge (the primary is a position and an empty
fallback filters to empty either way). `fellBack` now means THE WALK DIVERGES; a
no-fallback ladder under an ask is `vacuous` — quiet on every standing view, still counted
by the save-time honour ledger (the nowhere-honoured refusal and the stranding warnings
keep firing; two pins re-pinned to the new truth, one added). 108 cases.

**Break cap cut (1 Sep, user call):** the mid-roll's `stopAfter` (JSON `totalImpression`
on ladder breaks) is gone — a repeating cadence runs the video out, and at set positions
the positions themselves are the cap. Refused by name at the door like every cut field
("Break cap is not a setting any more"); off the wire, off the row, out of the cadence
bylines ("· stop after N" died everywhere). The cross-group heaviness warning now counts
only cue-point groups — an open-ended drumbeat has no counted total, so it says nothing
rather than estimating one.

**The creation wizard (1 Sep, user call — asked and answered as three choices):** New
integration became a three-step modal, Source › Details › Ad demand, YouTube-upload
grammar (chosen over the literal 2-step read), the demand step picks a source only
(ladders stay ops' room), and Create lands back on the list. One create at the end:
copy brings player + switches + drive and photocopies the source's setup (1:1); a
refusal deletes the just-made setup copy and jumps to the offending step, so cancel and
refusal both leave the world untouched. The `#keys/new` page-form create died with it —
the route now opens the wizard over the list. Walked twice in the browser (copy: "TOI
Mweb Shorts" born with identical switches/drive and its own as_8 copy; fresh: an Android
surface with package name, empty demand, Default-off overlay). One door hardened along
the way: a fresh create now always carries the Default overlay the model requires. **Bulk mid-roll maps the break groups**: RHS panel names which integration · section runs which groups, "up to N in this selection" counted; one-group surfaces stay unlisted (the quiet default). **The chip strip is one line, always**: three fixed chips, a skipped partner dims and strikes IN PLACE — the "excluded" shelf that wrapped rows is gone, nothing changes width. **One Reset to setup per break**, bottom right — the per-field "use the setup's" links died with it. **The break-tab state dots died** (a legend nobody had); the one dot left is amber and means unsaved changes on that break, said on hover |
| `sizes` | **Out of scope.** The display slot carries its sizes, player-side |
| `unittpl` | **Authored in the panel** (user call, 31 Aug — reverses 20 Aug): a named-template library in the ops room, picked per tag, Standard = absence. The macro vocabulary stays the player team's |
| `totalImpression` | A **stop count** per break group, distinct from Target impressions count. `Full` is its open end |
| Multiple mid-roll pods | **Break groups, up to 3** (user call, 31 Aug — supersedes the first cut's refusal): each group its own cadence + ladder; one group draws no group chrome; the drive stays one Mid-roll tab |
| Break pacing moved to the breaks (31 Aug evening) | `minPreRenderTime` → the pre-roll's **Video plays first** (a slot behaviour, layman-named on the user's call); `prefetch` → **Prefetch** on mid- and post-roll (a pre-roll has no before to fetch in); the player keeps only `expandInMiniTVForAds` |
| The trim (31 Aug evening) | **Squeeze-back slot removed** (a banner in a break is a fallback rung; the idle player is Out-stream — fixtures reseeded); **Max pod duration, Duration enforcement, Max waterfall depth removed** (a pod plays its count, ads run their length; depth is the surface's Waterfall depth). All refused by name |
| Bulk | Orders the **fallback by partner**; ops' arrangement breaks ties within a partner |

## Open questions — need a call before phase 1

1. **Does Direct run on out-stream?** Recommended **no** — Direct is break demand, out-stream is
   not a break. Say if a direct buyer's inventory should follow the viewer into the idle player.
2. **`repeat` as an array.** The JSON has `repeat: [10000, 0]` and `repeat: [180000]`, and the
   trailing `0` reads as a magic "no repeat". Recommend the contract carries **one interval plus a
   stop count**, and the array shape does not ship.
3. **Who sets Direct's session cap — ops or product?** It is authored in the ops room with the
   list, which keeps the two rooms clean. But it is the field a product team is most likely to
   want across a cohort. Recommend ops owns it in v1; revisit if the ask arrives.
4. **Units in milliseconds or seconds.** `init: 30000` is ms; the panel stores cue points in
   seconds. One of them has to give at the publish boundary, and it should be written down before
   someone schedules a break 1000× early.
5. **The macro vocabulary** — the panel validates against a fixed list, so the player team must
   hand over the complete set (`[CACHEBUSTER]`, `[REFERRER_URL]`, what else?) and owns additions.
6. **Do break groups reach pre-roll too?** The JSON groups only mid-rolls, and a pre-roll's
   "group" is just its one break. Recommend mid-roll only, where a video timeline gives groups
   their meaning.

## Build order (sized honestly)

| Phase | Work | Notes |
|---|---|---|
| 1 | **Model + API**: the Direct tier and its cap, mid-roll break groups (one group = today, normalize unchanged), banner fields on a rung, `pause` three-way, break fill timeout, out-stream as a fifth slot type, templates as objects, the new refusals and counted warnings | Tests-first. The walk resolution (`driveWalk`, `liveConfig`) is where tiering and groups actually bite — Direct prepends, depth counts the fallback only, each group resolves its own walk |
| 2 | **Ad setup editor**: the Direct row above the tabs, break-group rows inside Mid-roll, the banner sub-row, the out-stream tab, the two new delivery rows, the template row in the tag dialog + the Request templates list | The screen the taste is judged on. Renderers are reused whole — `behaviourRowsHtml`, the rung row, the collapsible slot anatomy, once per group |
| 3 | **Integration + bulk**: Fallback order relabelled, Direct and Primary in the resolved waterfall (one line per group), out-stream switch, Playback timing fold, the four bulk additions | Mostly copy and one field list |
| 4 | **The publish contract**: the emitted JSON, `unittpl` resolved from the tags' chosen templates, ms-vs-seconds, and the walk rules the player obeys — written down at last | Closes POD-SCOPE phase 4, open since 24 Aug |

Phase 1 rewrites a slice of the 92-case suite. `npm run test:panel` is the fast gate, as always,
and nothing starts until the six open questions above have calls.
