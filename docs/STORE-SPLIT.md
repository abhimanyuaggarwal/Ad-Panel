# Splitting store.js — scope and ground rules

Status: **done (3 Sep)**, exactly as scoped below, with two amendments found during the
work. One: the plan's setups module came out near 900 lines, so it was cut once more at
its own seam — `store/ladders.js` (slot behaviour, cue points, rungs, the walks) now sits
under `store/setups.js` (placements, pods, CRUD, the GAM directory), making eight modules
rather than seven. Two: the split's one real trap turned out to be the `Refusal` error
class — the only top-level declaration that wasn't a function or a const, which the
mechanical move missed on the first pass; the 117-case suite caught it within seconds
(59 failures, one cause). Verified after: 117/117, the full browser-probe battery, and a
44-check end-to-end UAT — zero console errors, zero behaviour change. The rest of this
document is the plan the work followed, kept as the reference for how to split a model
file safely.

## Why

`api/store.js` is one file of ~2,300 lines holding the entire model: every object, every
validation rule, the publish plane, and the change wording. Every server change lands in
the same file, so two people cannot work on it at once, reviews are slow, and a rule can
be duplicated far from its twin without anyone noticing. The stylesheet already taught us
that failure mode: three visual bugs traced to the same class being defined twice,
thousands of lines apart. The model file deserves the fix before the same thing happens
to a business rule.

## What it becomes

One folder, one file per subject. The section markers for these cuts already exist in
the file today.

| File               | Owns                                                                 |
| ------------------ | -------------------------------------------------------------------- |
| store/state.js     | The in-memory maps, id counters, and the mock reset                  |
| store/validate.js  | Shared refusal helpers (numbers in range, enums, names, "refused by name") |
| store/tags.js      | Ad tags and request templates                                        |
| store/setups.js    | Ad setups: placements, pods, ladders, direct deals, the walk         |
| store/keys.js      | Integrations: identity, player, custom configs, the drive            |
| store/publish.js   | Versions, publish, restore, unpublished counts                       |
| store/diff.js      | "What changed", in words — the change lists the review screen shows  |

`store.js` itself stays, reduced to a dozen lines that re-export the modules. That way
`server.js` and the tests do not change at all — the split is invisible from outside.

## The one rule

**A split is a move, not a rewrite.** Function bodies are not edited, renamed, or
"improved" in the same change. Any cleanup someone wants to do happens in a separate
change afterwards, where it can be reviewed on its own. This is how the front-end splits
were done, and why they shipped with zero regressions.

## What must not change — the rules the file currently enforces

These are the behaviours engineering must see still standing after the split. Each one is
already pinned by the 117-case test suite; the list is here so a reviewer can check the
split against intent, not just against tests.

**Integrations.** Names are unique, case-insensitively. The platform decides whether
domains or a package name applies. Unknown fields are refused by name. Autoplay is
on / off / auto and defaults to auto. Passive volume is a whole number from 0 to 100;
the old `startVolume` key is refused by name so an integrator finds the rename instead
of a silent drop.

**Custom player configs.** At most six per integration. A key is one word (letters,
digits, `_`, `-`, up to 24), never "default", never a duplicate — a player asking by key
must find exactly one row. A config carries exactly three facts (playback mode, expand
MiniTV, autoplay); a volume on a config is refused — the player has one volume, in
Details.

**Ad setups.** One integration, one setup: attaching a setup that already fills another
integration is refused, and the refusal names the holder. Duplicating a setup copies
everything — placements, ladders, per-pod deals, delivery settings — and never links;
copy names count up ("X copy 2"). Placement names are unique and Default comes first.
A mid-roll holds one to three pods; pod 1 doubles as the slot itself; every pod owns its
own direct deal, and a new pod never inherits one. Ladder and rotation lengths respect
their caps. A surface running mid-rolls live keeps a save refused until every remaining
pod has demand.

**Time.** The UI speaks seconds; the store keeps milliseconds (`waitMs`,
`tagTimeoutMs`). Cue points accept "6:00" or plain seconds; anything unparsable is
refused by name, not dropped.

**Tags and templates.** Anything in use cannot be deleted; the refusal counts the users.
Template macros are a fixed list; unknown macros are refused by name.

**The publish plane.** Save writes the draft only — nothing changes on air. Publish
creates the next version; Restore rewrites the draft from an old version and names every
unpublished change it would discard before doing so. History is append-only.

**Everywhere.** Refusals are machine-readable `{field, message}` pairs that name the
number found next to the number required. Copies are photocopies, never links. A mock
reset rebuilds the world with the same ids, so nothing counted ever shifts.

## How to do it safely

1. Move `state.js` out first — everything else depends on it, it depends on nothing.
2. Then one module per change, in this order: validate, tags, setups, keys, publish,
   diff. One module, one review.
3. Run `npm test` (117 cases, ~1s) before and after every move. The suite talks to the
   server over HTTP, so it needs no edits — if it stays green, behaviour held.
4. Finish with the browser probe battery the repo carries (screenshots and console
   checks across every screen).

## Done when

- `store.js` is a re-export file; no module is longer than ~500 lines.
- `server.js`, the tests, and the mock world are untouched.
- 117/117 before, 117/117 after, and no probe reports a console error.
