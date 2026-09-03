# Sectioned setups — one demand document per surface (SCOPE, needs the manager's call)

**Status: BUILT, 25 Aug 2026** — and extended the same day: AD BEHAVIOUR moved into the
setup too, on the SLOT (see panel/README.md, "AD BEHAVIOUR MOVED TO THE AD SETUP"). The
split that made it work: a field describes either the ADS (→ the setup's slot/placement)
or the PLAYER (→ the integration). Nothing was left over, so the third object stopped
existing rather than moving somewhere quieter, and the per-break field prefixes died with
it (15 pod fields → 5). A new placement clones Default. 25 Aug 2026, from the PM's proposal ("ad sections in the
ad setup itself, one ad setup per Integration").

## The itch is real

A multi-placement surface today needs MULTIPLE setup objects — TOI Mweb VideoShow runs on
"TOI VideoShow demand" *and* "TOI Shorts demand". Ops maintaining one surface juggle N
objects; nothing groups them. The proposal: the setup carries the placements.

## But strict 1:1 breaks the thing the manager liked best

One-setup-per-integration kills sharing — and the shared setup is the **2am one-act fix**
("rung off once → every attached surface stops calling the sick partner"), endorsed
explicitly (AD-SETUP-SCOPE, open question 1) and load-bearing in journey B. 1:1 also
re-creates the 19 Aug disease: thirty copies of the same backfill ladder, edited thirty
times.

## The synthesis: setups carry SECTIONS, and stay attachable 1..N

```
Ad Setup  = name + property + SECTIONS, each: name + per-slot ladders   [ops-owned]
Integration = identity + ONE attached setup + per-section OVERLAY,
              keyed by section name: switches · muted · order · rules? · player?
                                                                        [product-owned]
```

- **Ops define the placements WITH their demand** — one document per surface shape
  ("Default" + "Shorts feed", each with its own ladders). Attaching the setup gives the
  integration its sections; product overlay per section exactly as today
  (inherit-then-fork for rules/player, mute/order for the walk).
- **Sharing survives**: two surfaces of the same shape attach the same sectioned setup —
  the one-act fix and reuse intact. 1:1 becomes the common case without being enforced.
- **The trade to state honestly**: sections stop being product-creatable — "+ Section"
  becomes an ops act (it IS a demand act: a placement without demand can do nothing).
  Product keeps everything else per section. This must be the manager's call — it moves
  a control across his org line.
- Seam unchanged in spirit: per-section walks checked both directions; a setup section
  deleted while a live integration runs it is refused, named.

## Sizing

Comparable to the two-rooms rework: model + fixtures + suite rewrite (~half), both
editors' section plumbing re-keyed by name, bulk attach semantics. Not a same-day change.

## The question for the manager

Keep sections product-owned (today) or move them into the setup as ops-owned placements
(this scope)? Everything else — 10-rung ladders, IMA/GPT/SLike/CAN with protocol-implied
types — shipped 25 Aug independently of this call.
