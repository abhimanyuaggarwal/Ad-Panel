# Levers on the page — the integration as the product team's cockpit

**Status: BUILT 24 Aug 2026 (late), all four phases** — model + API (local `muted`/`order`
overrides, resolution, both seams extended, divergence counted in the ops room, positional
bulk acts reinstated as override-writers; `npm run test:panel` = 52, +13 pinned cases),
the section ladder card (named rungs, drag, per-rung mute, quick fields, reset-to-setup),
the strip's "Levers" expansion (positional counted rows + quick fields at integration
scope), and bulk parity (the same rows at cohort scale). Every altitude exercised end to
end headless (`panel/shots/levers-*.png`): a section demoted its primary and muted a rung
while the shared setup and its other surface stayed untouched; the strip act skipped and
named the section without that position ("Left alone: Shorts feed"); bulk muted waterfall 1
on both selected integrations with the setup provably unmoved; the ops room shows "locally
reordered on 1 · rungs muted on 1" and per-rung "muted on N". Built on the three
recommended calls below — all three still the manager's to overturn.

**IA re-seated the same night (PM UX review).** The first cut of this scope stacked the
altitudes on the page — a strip of counted rows, "Levers" expansions under them, then the
section list repeating the same four unit names a third time. Accurate, and unreadable:
the same object drawn three times with no connection between the copies. The re-seat
commits to **one object, drawn once — altitude is a LENS, not a copy**: a single Ads card
whose unit rows render under a scope switcher (`All sections | Default | Shorts feed | +`,
hidden entirely on single-section keys, a dot marking sections that differ); the demand
line sits once in the card header; and an open unit reads as one continuous story in two
quiet zones — **What plays** (the ladder) then **When & how** (the quick fields) — no
nested cards, no repeated "How it behaves" header bars. Closed rows carry their one
load-bearing fact quietly ("2 rungs · deferred 7s"). Bulk needed no change — its
tab-and-rows grammar is what the lens now mirrors. **Second pass, same night (PM ask):**
Player and Ad behaviour became collapsed sections on the page itself, opening in place —
the drill-in editor pages and routes were removed whole. The dividing line that fell out
of it: everything BREAK-SPECIFIC (timing, cadence, ads-in-a-row, and now the pod's fill
answers) lives on the unit's own row; everything CROSS-BREAK (ad experience, overlays,
frequency, delivery) lives in the one Ad behaviour fold.

Scoped 24 Aug 2026 (evening), after the manager's review of the two-rooms build. Companion
to `AD-SETUP-SCOPE.md` — this does not undo the split; it finishes it.

## The diagnosis — why the rounds keep not landing

Every round has moved some everyday lever behind a door. First the levers lived in thirty
editors (19 Aug). Then bulk got them but the single integration lost some (20-21 Aug). Then
two-rooms put the rules behind an "Open" drill-in and the ladder behind a read-only "View"
(24 Aug). Each move was locally right and globally wrong for the same person: **the product
owner making a quick, reversible call on their own surface.** The ask, consistent across
every round once you line them up:

> The integration page carries THE LEVERS — switch a unit (one section or all), retime a
> break, reorder or mute the waterfall (one section or all) — inline, shallow, and the bulk
> screen is the SAME visual journey at cohort scale.

The organizing principle this scope commits to:

> **Levers on the page; libraries behind doors.** Everyday reversible acts — switch, mute,
> reorder, retime — sit inline on the integration. Heavy authoring — tag content, the full
> rule spec, the player — stays behind Open, and demand content stays in the ops room.

## The one new idea: the same ladder card at three altitudes

One component, one visual grammar, three zoom levels — this is what makes "the same visual
journey" literally true instead of aspirational:

```
SECTION scope (inside one ad section — real rungs, real names)
    Pre-roll  [◗ on]   at [At start | Deferred by 7s]
      ⠿ Primary      [◗]  TOI Mweb VideoShow Pre-roll
      ⠿ Waterfall 1  [◗]  TOI Video Backfill
      ⠿ Waterfall 2  [○]  TOI Mweb VideoShow Display     muted here
      names read-only — what fills is ad ops' room; order and switches are yours

INTEGRATION scope (the strip row, expanded — counted across this integration's sections)
    Pre-roll  on in 3 of 3   [On | Off]
      ⠿ Primary      all 3 on          [On | Off]
      ⠿ Waterfall 1  2 on · 1 muted    [On | Off]
      ⠿ Waterfall 2  in 2 sections     [On | Off]
      at [At start | Deferred by 7s]           ← writes Default + own-rules sections

BULK scope (all sections of all selected integrations — identical rows, bigger counts)
    Pre-roll  on in 41 of 51  [On | Off]
      ⠿ Primary      all 51 on         [On | Off]
      ⠿ Waterfall 1  31 on · 8 muted   [On | Off]
      at [At start | Deferred by 7s]   (mixed today)
```

- Section scope shows **names**; the two wider scopes show **counts** — nobody bulk-reads an
  inventory (20 Aug rule, kept).
- Drag at section scope reorders this section; at the wider scopes it is the positional move
  ("whatever each of you has at waterfall 2 goes to waterfall 1"), skip-and-name where a
  position is empty.
- The quick rule fields per slot are ONE list (`SLOT_RULE_FIELDS` — timing, break positions
  or cadence, pods-in-a-row, squeeze-back turn-taking), rendered by the same rows at every
  altitude. The full rules editor keeps everything else.
- Slot rows sit **closed by default** (switch + one-line glimpse: "3 rungs · 1 muted here ·
  at start"), open in place — the 20 Aug page-calm survives.

## The model addition that makes use case 3 legal: LOCAL OVERRIDES

Two-rooms moved the ladder into the shared Ad Setup — so today a product person reordering
"their" waterfall would be editing twelve other surfaces. The fix is not to move the ladder
back; it is to split what a ladder means:

> **Ops own the ladder's CONTENT and its kill switch. Product own its LOCAL USE.**

```
section.slots[t] = {
  on,
  muted: [rungKey…],          // rungs this section skips — HERE only
  order: [rungKey…] | null,   // this section's walk order; null = the setup's order
}
rungKey = the rung's tagId, or 'pool' for Waterfall N   // stable across ops reorders
```

- **Resolution, in order:** the setup's rungs → drop ops-killed rungs (a rung switched off
  IN the setup is off everywhere — the ops kill switch always trumps) → apply the local
  order → skip the locally muted. That is the walk; the display shows every rung with muted
  and ops-killed marked distinctly ("muted here" vs "off by ad ops" — the second is not
  toggleable from the product room).
- **Keys, not indexes**, so ops edits never silently repoint an override: a ladder never
  repeats a tag, ops removing a tag drops its overrides harmlessly, and a rung ops ADD later
  joins at the END of a local order — new demand never jumps the queue on a surface whose
  owner ordered it deliberately.
- **The pool stays terminal** in every local order, by construction.
- **A rotation (squeeze-back) takes mute only** — it has no order to override.
- **Fail closed, extended:** a switched-on slot whose local walk resolves to zero live rungs
  is refused exactly like an empty one, naming what did it ("every rung is muted here /
  off by ad ops — unmute one or switch the unit off").
- **Reset to setup's order** is one act per slot, clearing both overrides.

### The ops room sees the divergence, counted

A shared setup whose surfaces locally diverge must say so, or ops debug ghosts. Each family
in the setup editor gains a counted line — *"locally reordered on 4 of 12 · rungs muted on
7"* — and each rung row a chip — *"muted on 3 integrations"*. Counted from the integrations,
never estimated.

## The manager's three use cases, mapped

| Use case | One section | All sections of one integration | All sections of N integrations (bulk) |
|---|---|---|---|
| 1 · Post-roll off | the section's slot toggle *(exists)* | the strip's slot switch *(exists)* | bulk slot tab's On/Off *(exists)* |
| 2 · Pre-roll timing / break change | quick fields inline on the open slot row *(new placement)* | same fields on the expanded strip row *(new)* | bulk slot tab's fields *(exists)* |
| 3 · Reorder / mute waterfall rungs | drag + per-rung toggle on the section ladder *(new: local overrides)* | positional rows on the expanded strip *(new)* | positional rows on the bulk slot tab *(reinstated)* |

## What this reverses, and why it is not flip-flopping

The morning's build removed the positional bulk acts (`slotRungOn/Off/Move`, `slotPoolOn/Off`)
because a rung switch had become an act on the SHARED setup — an ops act. They return here
with a different target: they write **integration-local overrides** and never touch a setup.
The removed acts wrote shared demand; the reinstated ones write each surface's own use of it.
Same buttons, different (and now safe) blast radius. `slotPrimary`/`slotRung`/`slotReplace`
stay dead — bulk still never writes an ad unit (20 Aug, permanent).

## Out of scope

Product adding/changing tags anywhere (ops room only, unchanged) · un-killing an ops-killed
rung from the product room · per-section granularity in bulk (the manager's explicit call:
bulk reaches all sections, no sub-choice) · roles/enforcement · undo (OPS-SPEED-SCOPE).

## Open questions — his call

1. **May a local order also demote the primary?** Recommend yes — it is this surface's walk;
   the setup's order remains the default everywhere else. (No = order is "mute-and-append
   only", weaker but simpler.)
2. **Should the quick rule fields on the strip write ALL sections including own-rules ones**
   (recommended — matches bulk's one-rule), or Default only?
3. **Divergence guardrail:** when a section's local order has drifted from the setup's,
   surface a quiet chip only (recommended), or warn on every setup edit?

## Build order (sized)

| Phase | Work | Notes |
|---|---|---|
| 1 | Model + API: `muted`/`order` on slots, resolution, seam extension, setup divergence counts; bulk `slotRungOn/Off/Move` + `slotPoolOn/Off` reinstated as override-writers | Tests-first; ~10 new cases |
| 2 | The ladder card at section scope (names, drag, rung toggles, quick fields inline) | The screen he judges |
| 3 | The strip rows expand to integration scope (counted positional rows + quick fields) | Same component, wider counts |
| 4 | Bulk slot tabs regain the positional rows (same component again) | Parity complete |
