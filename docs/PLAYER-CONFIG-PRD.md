# Player Config — PRD

**One line:** a self-serve panel through which AdOps and publisher ops control how ads are
called and rendered by our video player and page slots on TOI, ET and NBT — in minutes, with
counted numbers, and with every change revertable as one unit.

**Status:** working prototype (`npm run player` → localhost:4200), mock API, seeded data.
Not production. Companion docs: `PLAYER-CONFIG.md` (scope), `PLAYER-CONFIG-V2.md` (the redesign
this build implements).

---

## 1. Problem

Ad behaviour in our player — which tags are called, in what order, how long we wait, whether the
preroll defers — is configured by engineering, per property, by hand. A change takes days; the
moments that need it (election night, a legal call, a dying partner tag) allow minutes. And
nobody can see what any tag is earning, so every waterfall decision is a guess.

## 2. Users & boundary

- **Users:** central AdOps and each publisher's ops team. The UI uses *their* vocabulary — VAST,
  pod, no-fill, passback — and shows raw tag URLs. Familiar, not simplified.
- **The boundary:** **GAM decides which ad wins. This product decides what we ask, in what order,
  and how the player behaves while it waits.** Deliberately absent because they live on the GAM
  line item: frequency caps, blocked domains/categories, competitive separation, skip rules, max
  ad duration, floors, creative rotation, targeting, creative approval. Header bidding resolves
  before the ad request and is not a waterfall position.

### Who does what

**One rule: publisher ops run their own house. AdOps owns the defaults, anything that crosses
publishers, and anything sold.**

**Publisher ops** (the NBT team can only touch NBT — TOI is not even selectable for them):

- Edit waterfalls on their placements — add, reorder, switch off, replace tags
- Override any setting on their placements; create their own publisher's policies
- Bulk changes across their publisher — live immediately, no approval; Revert is the safety net
- Ads off for a section or a story
- Revert their own changes

**Central AdOps** — all of the above on any publisher, and four things only they can do:

- The **network defaults** every publisher inherits (timeouts, budgets, refresh gates, ad-load ceilings)
- Changes that **cross publishers** — e.g. one partner tag dying everywhere (confirmed once)
- **Network-wide** kill switch; new publishers and sections; guard thresholds
- **Sold lines** from StreamAds *(v2)* — publisher ops see them, cannot move them

*In the prototype this split exists in the model but is not enforced — it runs as a single user.
Enforcement is a v1 build item.*

### Where tags come from

Tags are **minted in GAM, found here**. The portal syncs the ad-unit tree read-only from the Ad
Manager API (a service account AdOps owns); a unit created in GAM appears in search minutes later,
labelled *new — not placed anywhere*. Placing a tag is **Find in GAM** — search, click, done — so
the wrong-tag class of mistake disappears, and the ad-unit id becomes the join key for the later
revenue integration. Units already in the break are greyed; ones used elsewhere say where.
**Paste remains** for demand GAM does not know about — partner VAST, passbacks.

So the lifecycle is: **AdOps mints in GAM → anyone places from search within their own scope →
publisher ops reorder and tune day to day → only AdOps swaps a tag across publishers.**

## 3. The model (four objects)

    Placement  = publisher × section × slot. Owns its waterfall.
    Policy     = reusable behaviour (timeouts, delays, pod size, refresh…). No URLs.
    Line       = one tag in the waterfall, tried in order until one fills.
    Change Set = every edit — one placement or forty — as one entry with one Revert.

**Link, not copy.** A placement inherits its policy; change the policy once and every placement
on it moves. A placement may override any single value — the override is visible wherever it is
made, and that placement stays put when the policy changes (and the save says so).

## 4. The five screens — one per task, not per object

| Screen | The task |
|---|---|
| **Today** *(home)* | "Is anything wrong?" Live kill switches · tags dropping against their own last week (grouped by cause: one failing tag on 12 placements is **one** finding) · everything changed in 24h with Revert to hand. Empty when nothing needs you. |
| **Make a change** | The election-night motion: **what** → **where** (match count updates live) → **preview the diff** — every placement, old value, new value, who is skipped and why → apply as one change set. |
| **Placements** | Finding and browsing. Grouped by publisher, read-first, filter by section/tag/policy. |
| **A placement** | **Read-only with an Edit button** (~90% of visits are "check what this does"). A plain-language paragraph of what happens, the break as a strip, and counted fill/timeout per line. |
| **Policies · History** | Reusable policies, each showing its blast radius before you edit. Change sets, newest first, one Revert each. |

## 5. Data — counted, never invented

Per line: **fill rate, timeout rate, error rate**, with requests **cascading** down the
waterfall (line 2 is only asked what line 1 missed). "Dropping" means a line fell well below
*its own* prior week — no benchmark is invented, and no rupee figure is guessed at.

Prototype numbers are deterministically seeded (stable across resets, one baked defect so Today
has something true to say). Production replaces one file with **player beacons** — GAM never
hears about a client-side timeout. Revenue joins later from GAM's reporting API.

## 6. Rules the product keeps

- A bulk change is previewed as a **diff**, never "are you sure".
- One change set = one Revert. Forty undos is not a rollback.
- **Guards warn, never block**, naming the number entered next to the number that is normal
  ("Refresh every 15s — under 30s most partners call it invalid traffic").
- Impossible options grey out **where they sit**, with the reason ("an event airs when it airs").
- The kill switch is server-enforced and **requires a reason** — an unexplained one never gets
  turned back on.
- A display placement can never inherit a video policy; the server refuses with the reason.
- Budget arithmetic shows which lines the waterfall can never reach, before a viewer finds out.

## 7. Built but parked for the shipping v1

Composed breaks (video-then-display back to back), companions (display beside the video ad,
counted once), and the display/refresh surface all **work in the prototype** — the recommendation
in `PLAYER-CONFIG-V2.md` is to ship v1 as **video only, one publisher, one waterfall per
placement**, and sequence the rest, because scope discipline was the v1 lesson.

## 8. Success measures

- Time from "we need a change" to live: **days → minutes**, without engineering.
- Every change attributable and revertable; zero silent half-changes.
- Fill recovered from visible problems (e.g. a dropping tag found on Today, not in a month-end
  report).
- Operators use it unprompted — Today is worth opening in the morning.

## 9. Open decisions (blocking, owner needed)

1. **Propagation speed** — a published change must reach players in **< 60s**; a CDN-cached
   config on a 10-min TTL breaks the whole premise. Engineering picks the mechanism.
2. **Beacon pipeline owner** — everything in §5 depends on it.
2b. **GAM API service account** (read-only inventory scope) for the tag sync — AdOps owns it.
3. Draft/publish staging **per change set** (recommended) — exists in the model, not yet in the UI.
4. Publisher ops publish directly (recommended) vs AdOps approval.
5. StreamAds direct deals appearing as labelled "Sold" lines (small build, v2).

## 10. Next step

Not code: **two watched sessions** — an AdOps person ("fill looks down on TOI sports prerolls,
find out why and fix it") and a publisher ops person ("election night: defer prerolls across all
NBT news sections"). Record where they stall and every control they scroll past. That output is
the v1 cut list.
