# DRIVING-SCOPE — quick decisions on Ad delivery, the workshop in the Ad Setup

**26 Aug 2026, manager review via the user.** The complaint, in the manager's own image: the
Ad delivery card had become a workshop. Driving a car you get two or three controls — a
switch, a preconfigured gear ("IMA only", "IMA then GPT", "depth till 3") — and anything
finer means stopping the car. Dragging waterfall positions, muting individual tags and
bending timing numbers are stopped-car work, and they were all sitting on the driving screen.

## The four decisions (user, 26 Aug — after two scoping rounds)

1. **One integration, one ad setup — a PROMISE, not a habit.** The blocker for moving deep
   controls into the setup was that setups were shared: editing one to fix one surface was a
   fleet recall. The user's call: setups are 1:1 with integrations. Enforced, not assumed —
   attaching a setup another integration holds is refused by name, and the picker offers
   **attach a copy** instead. Duplicating an integration copies its setup too (a linked
   shared setup would silently break the promise).

2. **The driving screen keeps switches and preconfigured decisions only.** Per break:
   the on/off switch · **Who fills it** (one dropdown) · **How many to ask**
   (1 / 2 / 3 / Everyone) · pre-roll only, **Starts** (right away / after a moment — the
   seconds stay ops') · **Ads in a row** (1 / 2 / 3). A squeeze-back takes turns, so it
   keeps only its switch. "Both speeds": a **Use for every break** act stamps one break's
   decision onto all of them, and the bulk sheet writes the same fields across many
   integrations.
   - **Label review, three passes, same day:** first cut said **Tries** / **All**. The
     user asked "what is Tries here?", then called both out — a label nobody can read is
     a broken control, and "All" never said all of *what*. A layman pass gave "How many
     to ask" / "Everyone"; the user's final call is the word their team already speaks:
     **Waterfall depth** / **Full**. Storage (`tries`) and the counted fact
     ("3 tries · up to 4.5s") are unchanged: the number carries its own consequence.
   - **The switch got a two-word eyebrow (`RUNS`), not a byline** — it was the only
     control on the card without a label while every row below it had one.
   - **The breaks are TABS** (user call, reversing the dropdown): one tab grammar across
     both rooms, and a state dot per tab so all four states read at rest — which is what
     the dropdown needed opening for.
   - **Fixture demand now covers all four breaks** so mid-roll, post-roll and squeeze-back
     are testable by hand: ET MiniTV and TOI Desktop VideoShow carry every break (the
     latter runs all four live, with a three-banner rotation), and as_1's post-roll is
     deliberately GPT-free — the world the fallback is demonstrated in. The gaps three
     fail-closed cases depend on are preserved on purpose: as_2 has no mid-roll, as_5
     Default no post-roll, and as_1/as_5 no squeeze-back.

3. **The decision is stored as INTENT and resolved live** — `drive`, per break, sparse:
   `{ who, tries, start, podAds }`. `who` is `only:<company>` or `first:<company>`, never a
   baked rearrangement — ad ops adding an IMA tag next week joins the walk the decision
   already describes, and the dropdown never has to reverse-engineer a ladder to know what
   was picked. `As set up` (absent) is the default and the honest name for "whatever the
   workshop arranged", so there is no unmappable Custom state.

4. **Impossible decisions fail loud, never dark.** At pick time an option the world cannot
   honour greys with its reason. If ops edits later strand a saved decision ("GPT only",
   GPT removed), the break **falls back to the setup's own arrangement** and says so — on
   the ops save as a named warning, and on the integration as a flagged fact. A decision
   impossible in *every* section refuses the save by name; impossible in *some* sections
   falls back per section, named. Serving nothing until someone notices was rejected
   explicitly (user call): an empty break is silent lost money.

## What moved, what died

- **Local overrides die whole** — muted rungs, local walk order, sparse behaviour bends
  (`SLOT_LOCAL_FIELDS`, `muted`, `order`, `bhv`). They existed because setups were shared;
  under the 1:1 promise "muted here" and "off in the setup" are the same act, done in the
  setup's ladder (its drag and per-rung switches ARE the workshop — no new section there,
  per the user's call). Removed, not hidden: a payload carrying them is refused by name.
- **The two off-states collapse.** With one consumer per setup, the ops kill switch is the
  only rung switch. The locked-toggle rendering goes with the distinction.
- **The Editing-sections scope picker dies** — a decision applies to every section; a
  company a section doesn't carry is skipped there (fallback, named), never substituted.
- **`walkDepth` stays the ops baseline** (positional, dead rungs hold their seats — pinned).
  `drive.tries` is the surface's own count of real tries, applied after `who`. With no
  `who` and no `tries`, the walk is exactly what it was before this change.
- **Bulk re-cut:** positional acts (`slotRungOn/Off/Move`) and `policyFields` are removed —
  they wrote overrides. `driveFields` writes the quick decision across a cohort; cohort
  setup-attach is removed (1:1 makes it meaningless). Switches, status and player stay.
- **Ops room additions are one line:** each slot names the attached surface's decision
  ("asks GPT first · 3 tries") instead of the dead divergence counts, and the drift warning
  above. `POST /panel/setups/:id/duplicate` backs "attach a copy".

## What this deliberately does NOT do

- No preset objects, no preset vocabulary to own (closes AD-SETUP-SCOPE open question 4 by
  construction): the Who dropdown is GENERATED from the companies actually in the setup.
- No per-integration deep editing anywhere: the escape hatch is the setup itself, safe
  because it is yours alone.
- `only:`/`first:` per company, not "A then B" permutations — pairs explode when a third
  partner joins; only/first stays two options per company.
