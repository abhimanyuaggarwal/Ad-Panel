# Refactor decisions — 15 Sep 2026

The engineering calls made during a structural pass over `api/`. Nothing here changed what
the product does: every entry was proven behaviour-preserving before it was kept (how, in
each entry). Product decisions stay in `PRODUCT-LOG.md`; the dated scope documents stay in
`DECISION-RECORDS.md`; how the code is laid out stays in `ARCHITECTURE.md`.

> **Scope: `api/` only.** `web/js/` was deliberately left untouched — see ADR-5.

---

## ADR-1: one name for a detached copy, spelled once per side of HTTP

**Date:** 15 Sep 2026 · **Status:** accepted

### Context
`JSON.parse(JSON.stringify(x))` appeared at six places in `api/` and twice more web-side,
always meaning the same thing: take a copy of a piece of state so a mutation cannot reach
the original. The store hands out live references, so anything that builds a patch by
editing what it read must copy first or it has already written. Spelled as a round-trip,
that intent is invisible — it reads as serialisation, not as protection.

`web/js/util.js` had already named this concept `deepCopy` and used it twenty times.

### Decision
`deepCopy` moves into `api/store/state.js` and the six API sites call it. The name matches
the web side's exactly, the way `WF_WORD` is deliberately spelled once per side of HTTP.

### Consequences
The intent is legible, and the JSON round-trip's one real limit (no Dates, no Maps) is
documented in one place instead of assumed at six. Both halves must stay in step, which is
the same standing cost `WF_WORD` already carries.

### Reversibility
Two-way door. Six call sites, mechanical either way.

### How it was proven
`npm test` — 183 passed, before and after.

---

## ADR-2: the cohort tally, written once instead of four times

**Date:** 15 Sep 2026 · **Status:** accepted

### Context
`POST /panel/keys/bulk` serves four acts (player fields, config fields, publish/unpublish,
slot switches and drive fields). Its contract — N integrations, each attempted on its own,
counting changed / already-so / refused / skipped **per name, never all-or-nothing** — is
stated in the file's own header, and then written out four separate times, once per act.
The answer's shape therefore lived in four places, and a fifth act would have made it five.

The four were not quite identical, which is what had kept them apart: publish counts
`nothing_to_publish` and `not_live` as *unchanged* rather than refused, and the slot act
records skips per section and refuses an integration where nothing could light.

### Decision
One `tallyCohort(units, applyOne, classifyRefusal)`. An act supplies only what it does to
ONE integration, answering `true` (wrote), `false` (already so), or `SKIPPED` (recorded its
own reason, count it neither way). The two genuine variations became the two parameters.
The slot act's patch-building moved into two named builders, `driveFieldsPatch` and
`slotSwitchPatch`.

`store.getKey(id)` stays **outside** the try, exactly as before: an id naming nothing is a
fault in the caller, not a refusal to report per name, and it must keep travelling as a 404.

### Consequences
The response shape is stated once. The per-act code reads as what the act does rather than
as bookkeeping, and the deepest function in `api/` dropped from 5 levels of nesting to 2.
Code lines fell 242 → 229 while the commentary grew, which is the trade this codebase
already makes everywhere.

The cost: the four acts now share a function, so a change to the tally reaches all of them.
That is correct here — they share one documented HTTP contract, so if the shape changes it
*should* change for all four — but it is a real coupling that did not exist before.

### Reversibility
Two-way door.

### How it was proven
`npm test` (183), plus a differential probe over **20 outcomes** the suite never asserts:
`skipped` and `unchanged` are checked nowhere in `test/cases/`, and those are exactly the
counters this touched. The pre-refactor file was reconstructed, both versions were run
against the same seeded world, and the JSON was byte-identical — including a `skipped` list
of 4, publish's `nothing_to_publish → unchanged`, and the bad-id 404.

> **Worth adding to the suite:** `skipped` and `unchanged` have no assertion anywhere. The
> probe proved them equal to what they were, not that what they were is right.

---

## ADR-3: the drive's quick decisions as a table, not a ten-arm chain

**Date:** 15 Sep 2026 · **Status:** accepted

### Context
`normalizeDrive` carried a ten-arm `else if (f === …)` chain inside two loops — the shape
that gains an arm every time the drive gains a lever. It buried the four fields that carry
real reasoning (`ask`, `cuepoints`, `headerBidding`, `direct`) among six that only call
`intIn` or `oneOf`, and it put the function at 4 levels of nesting.

The branches select a behaviour per field name; they do not validate input. That is the
dispatch-table shape.

### Decision
`DRIVE_WRITERS`, one writer per drive field keyed by the field's own name. Each takes the
value and an error collector and writes its own key on `out`. `DRIVE_FIELDS[t]` still decides
*which* fields a break may use; the table only says what each one means. A field with no
writer is ignored exactly as the chain's missing `else` ignored it.

### Consequences
Each field is one line with its reasoning beside it, and `normalizeDrive` drops to 2 levels.
Adding a lever is now an entry, not an arm — and ARCHITECTURE.md §8's "add a field to a
break's behaviour" recipe gains a step that is easier to follow than the one it replaces.

### Reversibility
Two-way door.

### How it was proven
`npm test` (183), plus a differential probe over **50 boundary and refusal outcomes** —
every writer at and past each bound, all four slot types, 24 refusals and 26 acceptances.
Old and new were byte-identical on status, stored value, **and every refusal sentence**.

---

## ADR-4: two shared caps hoisted — and one deliberately left split

**Date:** 15 Sep 2026 · **Status:** accepted

### Context
Three bounds are answered twice, once by the ad setup (`normalizeSlotBehaviour`) and once by
a surface overriding it (`normalizeDrive`):

| Cap | Setup side | Surface side | |
| --- | --- | --- | --- |
| `podAds` | 1…3 | 1…3 | identical |
| `every` | 60…3600 | 60…3600 | identical |
| `deferSec` | **3**…60 | **1**…60 | **different** |

ARCHITECTURE.md §9 already rules that a cap belongs in `store/state.js`. Two occurrences is
below the rule of three — but `deferSec` is evidence that duplicated bounds in this codebase
have *already* drifted, which is the failure the rule of three exists to prevent.

### Decision
`MAX_POD_ADS`, `MIDROLL_EVERY_MIN` and `MIDROLL_EVERY_MAX` move to `state.js` and both sides
read them.

**`deferSec` is left exactly as found, split.** A surface may defer its pre-roll by 1 s where
the ad setup's own floor is 3 s. Unifying it would have to pick a floor, and picking one
moves a product rule — a behaviour change wearing a refactor's clothes. Whether it is a
deliberate licence for surfaces or an old typo is not a question the code answers, and it is
not mine to settle.

### Consequences
Two caps can no longer drift. One still can, on purpose, with a comment at each side saying
so and pointing here.

### Reversibility
Two-way door for the hoist. The `deferSec` question stays open — see the report.

### How it was proven
The ADR-3 probe covers these bounds directly: `podAds` and `every` at 0/1/3/4 and
59/60/3600/3601 on **both** sides, identical throughout.

---

## ADR-5: `web/js/` left untouched

**Date:** 15 Sep 2026 · **Status:** accepted

### Context
Two findings were real on the web side:

- `views-keys-editor-player.js:548` defines `const shClone = o => JSON.parse(JSON.stringify(o || {}))`
  — a private third spelling of ADR-1's concept, in a file that already loads `deepCopy`.
- `saveKeyClicked` (`views-keys-editor-frame.js:320`) is the last function in the repo over
  the depth ceiling, at 5.

Neither was touched, for two reasons that both point the same way. Another Claude session was
editing `web/js/review.js`, `controls.js` and `views-keys-editor-player.js` throughout this
one (files rewritten at 16:41, 16:49 and 16:53), and `npm run ui:snapshot` — the only safety
net that covers the DOM, since the 183-case suite is HTTP-only — was already reporting
`MISSING: .shpick-face` against that in-flight work. A UI refactor proven against an unstable
baseline is not proven.

### Decision
Confine the pass to `api/`, where the HTTP suite and a differential probe are a real net.

### Consequences
Two known cleanups are deferred. `shClone` is a two-line change once the file settles;
`saveKeyClicked` wants a closer look, because its nesting is a create-then-compensate
rollback (delete the setup it just made if `createKey` throws) and that is logic worth
reading carefully rather than flattening on sight.

### Reversibility
Two-way door — nothing was done.

---

## ADR-6: `pickerTotalWord` left in place, and the disagreement reported

**Date:** 15 Sep 2026 · **Status:** open — needs a decision

### Context
`controls.js:275` defines `pickerTotalWord`. Nothing calls it, anywhere. It is not old dead
code: it is **new**, added in the current uncommitted work, and ARCHITECTURE.md §5 — also
uncommitted — states that the config sheet's rail head carries it. The head actually renders
a bare `<div class="sh-rail-hd">Overrides</div>`, with no count.

So the doc describes an intent the code does not carry out.

### Decision
Change neither. Deleting the function contradicts the documented design; wiring it in would
put a count on screen that is not there today — a UI change, which this pass had no mandate
for and no stable baseline to prove.

### Consequences
One unused function stands until somebody decides which of the two is right. That is the
point: the choice is a product one (does the rail's head carry `3 of 24`?), and it belongs to
whoever wrote the line in ARCHITECTURE.md.

### Reversibility
Two-way door either way, once the call is made.
