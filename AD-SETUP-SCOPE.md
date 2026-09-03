# Two rooms — demand as its own piece, everything else inside the Integration

**Status: BUILT 24 Aug 2026, all five phases** — model + API + migration-by-reseed (the world
is in-memory and authored, so fixtures were rewritten in the new shape), the integration
editor with the strip, the Ad Setups room with the ladder editor re-homed whole, bulk
re-homed by owner (ladder acts removed, 400s pinned by test), presets stamping at creation.
`npm run test:panel` = 39 cases, rewritten for the model; every journey screenshot-verified
end to end (`panel/shots/tworooms-*.png`), including the shared-setup one-act fix reaching
both attached integrations. Built on the three recommended calls (setups shared 1..N, ops
edits immediate with counted warnings, product gets read-only ladder view); the fourth
(preset vocabulary owner) still needs a name. Deviations from the scope as written: the bulk
review is one counted plan dialog rather than the old master-detail (bulk no longer types
units, so the worklist flow it existed for is gone), and the pod *counts* joined the bulk
rule fields while the pod fill answers stay per-integration.

Scoped 24 Aug 2026, from the manager's review of the demo (relayed).
Companions: `OPS-SPEED-SCOPE.md` (undo, change grouping — helped by this split, see §Bulk),
`POD-SCOPE.md` (pods — unaffected, the fields ride along inside the rules).

## The vision, played back

Two teams work this platform and today the panel serves neither cleanly:

- **Ad ops / monetization** own *demand* — GAM paths, VAST URLs, ladders, backfill deals. Today
  that work is scattered inside every integration's sections, on a screen product people also use.
- **Product teams** own *surfaces* — whether ads run on their page, how the player behaves, how
  ads behave when they arrive, and quick calls ("pause mid-rolls on Shorts, now"). Today those
  answers are split across an integration plus two shared sidebar objects (Player Setups, Ad
  Rules), so a product person assembles their surface from parts — and can also wander into
  demand they should never touch.

The manager's shape: **demand becomes a separate piece ("Ad Setup"), connected to integrations
and owned by the ops team; player setup and ad rules stop being separate components and live
inside the Integration**, where the product team gets one high-level control plane over all of an
integration's ad sections. This is the classic ad-platform split — trafficking on one side,
placements and experience on the other — with a named contract between them.

## The one rule, now in three parts

> **Ad ops supply WHAT can fill (the Ad Setup). The integration says WHETHER it runs (its
> switches). Its own rules say HOW it behaves (inline).**

The existing rule ("demand decides whether, policy decides how") survives intact — the slot
switch stays on the integration; only the *contents* of demand move out.

## The model, before and after

```
TODAY   Integration = identity + ≤5 Ad Sections
        Ad Section  = player setup (shared, linked) + ad rules (shared, linked) + 5 slots (ladders inline)
        Sidebar     : Integrations · Player Setups · Ad Rules

AFTER   Integration = identity + the strip + ≤5 Ad Sections          [product-owned]
        Ad Section  = player setup (INLINE) + ad rules (INLINE, or "Same as Default")
                      + 5 slot SWITCHES + which Ad Setup fills it
        Ad Setup    = the demand: per slot family a ladder (or squeeze-back rotation)
                      of Ad Tags — attachable to 1..N integrations   [ops-owned]
        Sidebar     : Integrations · Ad Setups (tags live inside the ops room)
```

- **An Ad Setup carries one whole surface's demand** (pre/mid/post ladders + squeeze rotation),
  not one slot's — the reusable thing ops actually maintain ("TOI video backfill v2").
- **Mapping:** a section's Default points at one setup; other sections say "Same as Default" or
  name their own. Sections stay product-owned; what fills them is ops-owned.
- **Switches never move.** On/off per slot per section stays on the integration — that is the
  product team's "quickly" — and rung-level switches stay with the ladder, in the setup, because
  *"partner X is having a bad night"* is an ops act.

## Two deliberate reversals (recorded, with why the forces differ)

1. **A shared demand object returns.** Shared waterfalls were removed 20 Aug ("a slot is a switch
   plus its own ladder") because they were a second way to express one persona's config. The force
   here is different — **org ownership**, not control dedup: the object exists so a *different
   team* has a room of their own, and its grain is a whole setup, not a per-slot ladder. One
   consequence is a straight win: switching a rung off inside a shared setup takes partner X out
   of *every* attached integration in one act — OPS-SPEED job J1, no cohort selection needed.
2. **Rules and player setups stop being linked objects.** Link-not-copy was the bulk story; the
   price was product teams hopping between three screens and every edit warning "used by N".
   Inlined, an integration is self-contained and a product person edits *their surface*, full
   stop. What's lost: "edit one policy, 30 follow." Mitigation: the bulk sheet already edits rule
   fields across a selected cohort — and gets *simpler*, because copy-on-shared-write semantics
   die with the sharing. Starting **presets** (MiniTV / ArticleShow / VideoShow) stamp values at
   creation — copy, never link — so divergence is deliberate, per surface, and visible.

## The strip — one control plane per integration

The integration opens on a high-level strip: every act on it applies to **all sections**, one
rule, each touched section named in Activity (the bulk sheet's own precedent):

    THIS INTEGRATION'S ADS                                    3 sections
    Pre-roll  on in 3 of 3  [On|Off]      Mid-roll   on in 2 of 3  [On|Off]
    Post-roll off everywhere [On|Off]     Squeeze-back on in 1 of 3 [On|Off]
    Fills from  “TOI Video Backfill v2” · 4 ladders · Priya (ad ops), 2h ago   [View]
    Rules       Default + Shorts feed differs                                  [Open]

- Counted chips, never bare switches on a mixed state (house rule).
- **"Fills from" is a reference, not an editor**: product sees the setup's name, shape, and last
  change — full ladder detail one read-only click away — and edits nothing there.
- Per-section exceptions stay in the sections below, exactly as today.

## The seam — where the two teams meet, it fails closed with names

The load-bearing new rules, both directions:

- **Product flips a slot on; the setup has no ladder for it** → refusal names both sides:
  *"'TOI Backfill v2' carries no pre-roll demand — ad ops own it (Priya, last edit 2h ago)."*
- **Ops empties or deletes a ladder that live integrations run** → refused, integrations named:
  *"12 live integrations fill their pre-roll from this — switch them off first."* (The existing
  last-live-rung refusal, promoted to the object boundary.)
- **Attaching / detaching a setup re-runs the check for every switched-on slot.** No availability
  answer → no attach. Drafts reserve nothing.
- **Ops edits to a live shared setup apply immediately**, warn with the used-by count, and land
  in Activity per integration (open question 2 below offers the alternative).

## Bulk, re-homed by owner

| Stays on Integrations bulk (product) | Moves to the Ad Setups room (ops) |
| --- | --- |
| Slot on/off, status pause/live | Rung on/off, reorder, pool on/off |
| Rule fields (incl. pod fields) — simpler, no shared-copy semantics | Ladder edits — one setup, N integrations follow |
| Player-setup fields | Tag library, tag-first entry ("where is this tag used?" — J6) |
| Attach / change Ad Setup | |

## Migration (deterministic, every touched object named in Activity)

- Each integration's current ladders → one auto-created Ad Setup, `"<Integration name> — setup"`,
  attached 1:1. A non-default section whose ladders differ gets `"<Integration> — <Section>"`.
- Each section's linked behaviour/policy → **values stamped inline** into that section. The
  shared Player Setup / Ad Rules objects, their routes, and sidebar entries are then **removed,
  not hidden** (house rule); their three shapes are reborn as creation presets.
- Switches keep their exact state; nothing changes what serves on day one.

## Out of scope, v1

Sign-in and role *enforcement* (the panel has no auth — the split is architectural now,
enforceable later) · approval/acknowledgment workflows between the teams · preset governance ·
undo (that is OPS-SPEED-SCOPE) · any change to what the player requests.

## Open questions — need the manager's call

1. **Can one Ad Setup serve many integrations?** Recommend yes (1..N, used-by counted) — reuse is
   the point of giving ops their own object; 1:1 would rebuild today's duplication one room away.
2. **When ops edit a setup 12 live integrations use** — apply immediately with a named warning
   (recommended; matches the panel's "applies immediately" pattern), or hold for product
   acknowledgment (safer, heavier — enterprise later)?
3. **How much demand may product see?** Recommend a read-only ladder view from "Fills from" —
   transparency without control. Name-and-counts-only is the stricter alternative.
4. **Who owns the preset vocabulary** for rules/player shapes (the old MiniTV/ArticleShow/
   VideoShow trio)?

## Build order (sized honestly)

| Phase | Work | Notes |
|---|---|---|
| 1 | Model + API: Ad Setup object + attach, rules/behaviour inlined, migration, the seam refusals | **Biggest restructure since 19 Aug** — roughly half the 79-case suite rewrites |
| 2 | Integration editor: the strip, inline rule/player groups, "Fills from" reference | The screen the manager judges it on |
| 3 | The Ad Setups room: list, editor (ladder renderer reused), used-by, tags re-homed, tag-first entry | Ops' own front door |
| 4 | Bulk re-home per the table above | J1 becomes one act |
| 5 | Presets + nav polish | |

Tests-first for phase 1, as always — and nothing starts until the open questions above have calls.
