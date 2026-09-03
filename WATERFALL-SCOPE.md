# Integrations-first waterfall — scope (19 Aug 2026, post-demand review)

Manager review of the 19 Aug demo asked for **operational simplicity**: an ops person should be
able to select a cohort of integrations and, from that one place, turn pre/mid/post on or off, set
each slot's waterfall, and reorder tags — without opening 30 editors. This document scopes that
rework.

**Status: BUILT 19 Aug 2026.** All five phases shipped; `npm run test:panel` covers the new rules
in 53 cases. `README.md` is the spec of record for what exists — this document is kept as the
record of *why*, including the decisions and trade-offs below. The two questions left open when
scoping were resolved during the build: **bulk reorder** is offered only where every selected slot
follows one common waterfall (elsewhere the panel explains why and points at the move that would
make it possible), and **display slots** ship as fallback ladders with rotation deferred. The bulk
bar was then rebuilt a second time on UX review: its two menus (switch vs waterfall) divided the
work the way the *system* is built rather than the way the task is thought about, so they collapsed
into one **noun-first guided journey** — pick the unit, see its counted state across the cohort,
then choose whether it runs or what it calls. A third
question surfaced only once it was running: bulk switch-**on** across all sections would have
failed a whole integration because one follower section had no tag for that slot — it now lights
the sections that have demand and names the ones it left off.

## The one rule everything follows

> **Demand decides *whether*. Policy decides *how*.**

Today two objects both half-answer "does a pre-roll run on this surface?" — the policy carries
`preRoll: off|start|deferred`, `midRoll`, `postRoll`, `bannerEnabled`, `lbandEnabled`, *and* the
integration's slot is either filled or empty. Ops has to check both, and the 18 Aug decision
("slots are deliberately not gated by the policy") made the overlap explicit rather than resolving
it. This rework resolves it:

- A slot runs when **the integration switched it on and gave it at least one tag**. That is the
  only switch.
- The **monetization policy never turns anything on or off.** It describes how a pre-roll, a
  mid-roll, a post-roll, an L-band, or a banner behaves *if it runs*.

A policy therefore becomes a complete behavioural spec — it always carries mid-roll positions and
overlay times, even for surfaces that don't run them. That's the intended trade: the policy
preview finally reads as one coherent statement of "how ads behave here", and the on/off question
has exactly one home.

## Model changes

### 1. Slot = a switch + a waterfall (1 primary + up to 3 backups)

```
slot = {
  on: boolean,                     // the only switch. Off KEEPS its tags (user call, 19 Aug).
  waterfall: {
    mode: 'own' | 'common',
    commonId: 'wf_3' | null,       // mode 'common' — linked, not copied
    rungs: [primary, backup, backup, backup]   // mode 'own' — ordered, max 4
  }
}

rung = { tagId: 'tag_12' }                            // an ad tag
     | { type: 'house', category, name?, mediaId }    // house promo — always fills, terminal
```

- **Rung 1 is the primary**, rungs 2–4 are backups. The editor labels them exactly that way, so
  "change the primary tag" is a real, nameable operation and not "edit row one".
- **Max 4 rungs** — one primary plus three backups (user call, 19 Aug; today's stacks allow 5).
- **A house rung is terminal** — house always fills, so nothing can sit below it. Existing rule,
  unchanged; house occupies one of the four.
- **On + zero rungs is a refusal**, named. Fail closed, as with the Default section today.
- **Switching a slot off greys its tags in place and keeps them** (user call, 19 Aug). Switching
  back on is one click and nothing is re-typed. This also preserves the 18 Aug staging use case —
  demand can be loaded before the product goes live.

**Latency guardrail (consequence of four rungs).** A full pass down the ladder asks four ad servers
in a row before anything plays; at the current 2500 ms per-tag timeout that is a 10 s worst case,
which is a black player. The panel must therefore show the **worst-case wait, computed** —
`rungs × per-tag timeout` — on the slot row and in the policy's timeout field, and warn (never
block — levers, not walls) when it exceeds ~6 s. Counted arithmetic, not an estimate.

### 2. Tags become first-class objects

"Every tag is either a video tag or a display tag" is a type, and a type needs somewhere to live.
Today a slot value is a bare string (a GAM ad unit path or a pasted VAST URL) with no type and no
identity — which is exactly why the 19 Aug review concluded slot values could not be bulk-edited.

```
tag = { id, name, type: 'video' | 'display', source: 'gam' | 'vast', value, property }
```

- **Placement rule:** video tags fit pre-roll / mid-roll / post-roll; display tags fit display /
  L-band. Cross-type placement is refused by name ("'TOI Display 300x250' is a display tag — the
  pre-roll slot takes video tags").
- Created **inline from the slot row** (the existing typeahead becomes "pick a tag, or add this ad
  unit as a new tag"), so the library fills itself. No separate onboarding step.
- This reverses the v1 "out of scope: tag objects with validation-on-attach". It is the price of
  bulk: a bulk write needs a stable referent, and a common waterfall needs a type.
- **Migration:** every existing slot string becomes an auto-created tag, named from the GAM unit
  hierarchy or the URL host, typed by the slot family it was found in.

### 3. Fallback stack → common waterfall

The shared object survives — renamed, retyped, and re-scoped. It *is* the manager's "option to
configure a common waterfall".

- `waterfall = { id, name, type: 'video' | 'display', property, rungs: [≤4] }`
- A slot either owns its rungs or points at a common waterfall. Link-not-copy stays, which keeps
  the bulk story: change the ladder for 30 integrations by editing one object.
- The key-level attachment becomes "common video waterfall / common display waterfall", inherited
  by sections as today.
- The three per-family ladders (`video` / `display` / `lband`) collapse to two types: **L-band is a
  display-type slot.** One less family, same coverage.

### 4. Monetization policy loses every switch

| Removed | Why |
|---|---|
| `preRoll: 'off'` | enum collapses to **at start / deferred** — timing only |
| `midRoll` | gone; **cuepoints always required** |
| `postRoll` | gone |
| `bannerEnabled` | gone; **banner times always required** |
| `lbandEnabled` | gone; **L-band times always required** |
| `fallbackEnabled`, `fallbackMaxAttempts` | the waterfall's length *is* the attempt count |

Kept and reshaped: `preRollDeferSec`, `cuepoints`, `snapback`, banner appears-at / stays-for /
dismissible, L-band squeezes-at / holds-for, `overlayGap`, countdown, ad sound, click target, pause
ad + delay, frequency caps, `requestTimeoutMs`, `retries`, `noFillAction` (what happens after the
*last* rung), companions, adjacent refresh. `fallbackTimeoutMs` is renamed **per-tag timeout** —
how long each rung waits before the waterfall falls through — and carries the worst-case arithmetic
above.

The policy editor's four numbered groups survive; several `.unit` blocks lose their parent toggle
and flatten into plain rows. Net: a visibly shorter policy.

**Counter to the "is this even used?" objection:** each unit on the policy page carries a counted
line — "live on 12 of 30 integrations using this policy". Counted from the integrations, never
estimated, and it's the fact the removed toggle used to imply.

### 5. Display slots: backups now, rotation later (user call, 19 Aug)

Today a display or L-band slot holds up to 5 units that the policy's show times consume **in order,
repeating** — a *rotation*. Under the new model the same list reads as a *fallback ladder*. The
call: **build the ladder meaning**, so display obeys the same one rule as pre/mid/post and there is
nothing extra to explain; rotation returns later as an explicit per-slot "rotate these" switch if
ops actually asks for it. Two consequences to accept now:

- The rung shape must stay rotation-compatible (an ordered list of typed tags already is), so the
  later switch is a flag, not a re-model.
- Any existing display slot carrying 2+ units is migrated as a **ladder**, and its integration is
  named in Activity so nobody discovers the change in a report.

## Bulk — the actual ask

The keys list keeps its checkboxes, pill filters, and select-all-that-the-filters-show. **Ad
sections stay, and every bulk change applies to all sections inside each selected integration**
(user call, 19 Aug) — one rule, no sub-choice for the user to make, and the activity log names each
section it touched. The bulk bar becomes three labeled menus:

1. **Slots ▾** — *Switch on* / *Switch off*: pre-roll · mid-roll · post-roll · display · L-band.
   Off keeps the tags (unlike today's "Turn off a slot", which emptied it). An integration whose
   Default section would end up with no live slot is skipped and named.
2. **Waterfall ▾** — pick a slot, then:
   - *Use common waterfall …* — points that slot at a shared object on every selected integration.
     The safest and preferred bulk act.
   - *Set primary tag …* — writes rung 1 only, leaves the backups alone.
   - *Replace waterfall …* — builds an ordered list (primary + up to 3 backups) and writes it
     wholesale.
   - *Reorder …* — **only offered when the selection resolves to one common waterfall**; it then
     edits that object once. See the open question below.
3. **Change attachment ▾** — policy · behaviour · common waterfall.

Unchanged and non-negotiable: every option opens the **two-step preview** (card grid → full spec →
apply, affected integrations named), and **every changed integration gets its own activity entry** —
never a vague "bulk op". No-ops report "already there".

## Where this contradicts existing decisions (deliberate)

- **18 Aug: "slots are deliberately NOT gated by the policy."** Superseded — the gate now exists
  and lives on the integration. The staging use case it protected is preserved by off-keeps-tags.
- **19 Aug: "slot values are deliberately NOT bulk-editable — a uniform write would push the same
  ad unit onto 30 different surfaces."** Overridden by the manager. The mitigation is tags-as-
  objects: you push *"Video Backfill A → B → C"*, a named thing you previewed, not a raw path. The
  original risk is real and does not disappear — it is now a preview-and-audit problem rather than
  a prohibition.
- **v1 out-of-scope: "tag objects with validation-on-attach."** Back in scope; see above.
- **Stacks allow 5 rungs; display/L-band slots hold 5 units.** Both tighten to 4.
- **Display/L-band units are consumed in rotation across show times.** Becomes a ladder; see §5.

## Still open — need a call before building

1. **Bulk reorder semantics.** Reordering across integrations that hold *different* tags isn't
   well-defined. **Recommend:** reorder is an operation on a common waterfall (edit once, everyone
   follows); for own-list slots, bulk offers *Replace* instead, and the menu says why.
2. **Does a house promo count toward the policy's max ads/session?** Open since 19 Aug; recommend
   yes.
3. **Who owns the house category vocabulary?** Open since 19 Aug.

## Build order (sized)

| Phase | Work | Notes |
|---|---|---|
| 1 | Model + API: tag library, waterfall object, slot `{on, waterfall}`, policy pruning, migration of existing slots/stacks | Biggest chunk; 20-case test suite needs rewriting alongside |
| 2 | Integration editor: slot row = switch + primary + backups, reorder, inline tag creation, worst-case wait | The screen the manager will judge it on |
| 3 | Policy editor prune + "live on N of M" counted lines | Mostly deletion |
| 4 | Bulk bar rebuild (three menus, previews, per-section activity) | The demo moment |
| 5 | Common waterfall page (rename from stacks), house rungs re-homed | |

Tests-first for phase 1 — this is a model change, and `npm run test:panel` is the fast gate.
