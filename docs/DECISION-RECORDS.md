# Decision records

Every scope document behind the Player Console, in the order the work happened, merged into
one file so there is one place to look instead of twelve. **Nothing here is a live
specification.** For what the product does today read `PRODUCT-SCOPE.md`; for how the code is
laid out read `../ARCHITECTURE.md`; for the running log of decisions read `../PRODUCT-LOG.md`.

Each chapter keeps the name of the file it used to be, so a reference elsewhere in the
codebase to (say) `AD-JSON-SCOPE.md` resolves to the chapter of that name below.

## Contents

- [PLAYER-CONFIG — the founding scope of the second surface (14 Aug 2026)](#player-config--the-founding-scope-of-the-second-surface-14-aug-2026)
- [PLAYER-CONFIG-PRD — the PRD written from that scope](#player-config-prd--the-prd-written-from-that-scope)
- [PLAYER-CONFIG-V2 — the proposal after v1 was not approved](#player-config-v2--the-proposal-after-v1-was-not-approved)
- [WATERFALL-SCOPE — integrations-first waterfall (19 Aug 2026)](#waterfall-scope--integrations-first-waterfall-19-aug-2026)
- [OPS-SPEED-SCOPE — ops changes, quickly and confidently (20 Aug 2026)](#ops-speed-scope--ops-changes-quickly-and-confidently-20-aug-2026)
- [AD-SETUP-SCOPE — two rooms: demand as its own piece (24 Aug 2026)](#ad-setup-scope--two-rooms-demand-as-its-own-piece-24-aug-2026)
- [POD-SCOPE — client-side ad pods (24 Aug 2026)](#pod-scope--client-side-ad-pods-24-aug-2026)
- [LEVERS-SCOPE — the integration as the product team's cockpit (24 Aug 2026)](#levers-scope--the-integration-as-the-product-teams-cockpit-24-aug-2026)
- [SECTIONED-SETUPS-SCOPE — one demand document per surface (25 Aug 2026)](#sectioned-setups-scope--one-demand-document-per-surface-25-aug-2026)
- [DRIVING-SCOPE — quick decisions on Ad delivery, the workshop in the setup (26 Aug 2026)](#driving-scope--quick-decisions-on-ad-delivery-the-workshop-in-the-setup-26-aug-2026)
- [AD-JSON-SCOPE — the player's ads JSON (31 Aug 2026)](#ad-json-scope--the-players-ads-json-31-aug-2026)
- [STORE-SPLIT — how api/store.js was split, and the rules it followed (3 Sep 2026)](#store-split--how-apistorejs-was-split-and-the-rules-it-followed-3-sep-2026)

---

## PLAYER-CONFIG — the founding scope of the second surface (14 Aug 2026)
**Working name.** Nothing here is built. This is the scope of record for the second surface:
a configuration panel for how ads render in our video players on publisher properties
(Times of India, Economic Times, Navbharat Times), handed to the central AdOps team and to
each publisher's product/ops team.

Scoped 13–14 Aug 2026. StreamAds v2 (the direct-deal booking platform) is described in
`v2/README.md` and is a **different product with a different audience** — see §3 and §11.

---

### 1. The ask

We own the video player across publisher properties. Today, how that player behaves around
ads — which slots exist, which VAST tags get called, in what order, how long we wait, whether
the preroll is deferred — is configured by engineering, per property, by hand.

The ask is to make that a product: a panel AdOps and publisher ops teams operate themselves,
including in the moment. The example that defined the requirement: *during an election, change
the ad timeout, or defer the preroll so content starts first* — and do it across the site in
seconds, not by editing forty sections by hand.

The constraint, stated: **it must be intuitive to people who work in ad tech, and bulk changes
across a site must be fast.**

### 2. What this is — and what it isn't

**GAM is the decision engine. This panel does not decide anything.**

It is the player's **ad policy**: what slots exist, what we call, in what order, and how the
player behaves while it waits. Which advertiser actually wins an impression is settled inside
GAM, exactly as it is today — including header bidding, which resolves *before* the ad request
and is passed into the GAM call as key-values. Header bidding is not a waterfall position and
this panel does not manage it.

| | StreamAds | Player Config |
|---|---|---|
| Question it answers | What did we promise? | What do we call, in what order, right now? |
| Objects | Deals, campaigns, creatives, zones | Placements, profiles, waterfall lines |
| Audience | Sales and AdOps sellers | AdOps and publisher ops |
| Decides who wins | Yes, on our own platforms | **No** — GAM does |
| Surface | Our own live platforms | Our player on publisher properties (VOD and live) |

### 3. Who uses it, and the vocabulary rule

Users are ad ops and publisher product/ops teams. They already know *VAST*, *wrapper*, *pod*,
*cue point*, *no-fill*, *passback*, *macro*, *timeout*.

**This inverts the StreamAds language rule.** StreamAds is deliberately seller-facing with no
engineering vocabulary. Here, translating ad-tech terms into friendly language slows an expert
down and makes them distrust the tool, because they have to guess which of our words maps to
the thing they know.

So: their words. The raw tag URL visible and editable, not hidden behind a form. A hierarchy
that echoes GAM's own. **Familiar, not simplified.**

### 4. The object model

The central move: **a slot's configuration is two different things, and they must be separate
objects.**

| | What it is | Does it travel across sections? |
|---|---|---|
| **Policy** | delay, timeouts, pod size, skip rules, cue points, frequency caps, fallback | **Yes** — identical across dozens of placements |
| **Demand** | the ordered VAST URLs (GAM tags, passbacks) | **No** — different per section by definition |

Four objects:

```
Publisher ─── Section ─── Placement (one slot)
                              │
                              ├── Profile   ← linked, reusable policy. No URLs.
                              └── Waterfall ← ordered VAST lines. Belongs to the placement.

Change Set  ← every edit, single or bulk, lands here as one revertable unit.
```

- **Placement** — publisher × section × slot (preroll / midroll / postroll). The thing that
  exists at runtime. Binds one profile and one waterfall.
- **Profile** — a named, reusable policy. *"Long-form news"*, *"Short clips"*, *"Live"*,
  *"Election"*. Contains no tag URLs.
- **Waterfall line** — one VAST URL, its position, an optional per-line timeout, and an
  optional label (e.g. the deal it belongs to — see §11).
- **Change Set** — every edit, whether it touched one placement or forty-two, recorded as one
  named unit with one Revert.

#### Link, not copy

"Copy the config, swap the URLs" isn't a copy operation — it's **pointing a new placement at an
existing profile**. Setting up a new section becomes: pick a profile, paste the tags, done.

The distinction matters more than it sounds:

- **Copy** forks the values. Fast setup, but forty independent copies drift immediately and
  there is no way to move them together later.
- **Link** means the placement inherits. Change the profile once, everything moves.

The election scenario is a *link* scenario. If AdOps has to open forty sections at 8pm, the
panel has failed; if they change one number on the Election profile, it's done in ten seconds
and revertable in ten more.

**Recommendation: link by default, allow per-placement overrides, and show every override
explicitly** — *"this section overrides preroll delay: 6s instead of 3s"*. Unmanaged drift kills
config panels. Visible drift is fine.

### 5. Inheritance and ownership

    Network default  →  Publisher (TOI / ET / NBT)  →  Section  →  Content type

Each level may override the one above, and every override displays the value it replaced.
Central AdOps owns the network layer; a publisher's ops team owns their publisher and below.

This is what lets us hand the panel to publisher teams without central AdOps approving every
change — and it is why history and revert must exist **per level**, not as one global log.

Permissions bound the selection set: an NBT operator's "select all" can never reach TOI. Not
hidden — genuinely unselectable.

### 6. The configuration catalogue

**P** = lives in the profile (reusable). **D** = lives with the demand line / placement.

#### Break structure
| Setting | Scope |
|---|---|
| Which slots are on: preroll / midroll / postroll | P |
| Midroll cue points — fixed timestamps, every N minutes, or % of duration | P |
| Minimum content length before any ad is served (don't preroll a 25s clip) | P |
| Minimum gap between breaks | P |
| Max breaks per video; max breaks per session | P |
| Ads per break (pod size); max total pod duration | P |

#### Timing and interruption
| Setting | Scope |
|---|---|
| **Preroll delay — deferred request**: content plays, the tag isn't called for N seconds. Cuts wasted requests on bouncers. | P |
| **Preroll delay — deferred playback**: call immediately, hold the ad, play at N seconds. Keeps fill, still lets content start. | P |
| Ad **request** timeout — how long we wait for a VAST response | P (per-line override: D) |
| Ad **load** timeout — VAST returned but the media won't start | P |
| **Total waterfall budget** — a wall-clock ceiling on the whole waterfall, independent of per-line timeouts. Six tags at 3s each is 18 seconds of black screen. | P |
| Skippable? Skip offset | P |
| Maximum accepted ad duration — reject a 60s creative in a 15s slot | P |

#### Waterfall behaviour
| Setting | Scope |
|---|---|
| Order of lines | D |
| What advances to the next line: no-fill / VAST error / timeout — and which errors are terminal instead | P |
| Wrapper redirect depth limit (GAM tags chain; a runaway wrapper eats the whole budget) | P |
| What happens when the waterfall is exhausted: house promo, blank, or start content | P |

#### Frequency and user experience
| Setting | Scope |
|---|---|
| Frequency cap per session / hour / day | P |
| Grace period — no ads in the first N seconds or first video of a session | P |
| Autoplay-muted behaviour; whether the ad inherits the mute state | P |

#### Display, in and out of the player
| Setting | Scope |
|---|---|
| Companion display unit: on/off, sizes, container | D (unit) / P (behaviour) |
| Whether the companion persists after the video ad ends | P |
| In-player overlay banner during content: on/off, when it appears, how long it stays | P |

**Display is in scope** (decided 14 Aug 2026, reversing the earlier recommendation). The panel
covers all four ad surfaces, not only linear video: linear video (VOD and live), non-linear
in-player overlays, companions, and standalone page display slots — banner, in-content, sidebar,
sticky, interstitial and high-impact.

Display brings buckets video doesn't have — **slot definition** (ad unit path, sizes, size
mapping by breakpoint, collapse-empty), **display behaviour** (lazy load margins, refresh
interval and its viewability and activity gates), **ad load and density** (ads per page, spacing
between in-content units), and **sticky / interstitial / high-impact**. The full field list,
bucket by bucket and surface by surface, is `PLAYER-CONFIG-FIELDS.xlsx`.

#### Plumbing passed into the tag
| Setting | Scope |
|---|---|
| Which macros go on the VAST URL — page URL, description URL, content ID, section, device id, consent string, cachebuster | P (per-line additions: D) |
| Viewability / OM SDK on-off | P |
| What to send when consent is absent | P |

#### Editorial and emergency
| Setting | Scope |
|---|---|
| Kill switch — ads off for a section, a content ID, or a whole publisher | P |
| Blocked advertiser domains / categories passed through to GAM | P |
| **Scheduled change** — apply the Election profile at 18:00, revert at midnight, automatically | P |

That last one earns its place. "Tweak it in the moment" is really two needs: *change it now*,
and *change it at a known time and put it back*. The second is what stops someone forgetting to
revert on Wednesday morning.

#### Live differs — it is not VOD with a flag

Livestreams on our player are in scope, and several settings above don't apply or invert:

| | Behaviour on live |
|---|---|
| Break trigger | SCTE-35 cue, manual trigger, or schedule — **never** duration-based cue points. An event airs when it airs. |
| Break length | Fixed by the broadcast. The pod must fill it, and unsold seconds need a defined filler. |
| Postroll | Doesn't exist |
| Join mid-stream | Does a viewer joining a live stream get a preroll? Configurable, and defaulted per profile. |
| Latency budget | Tighter — the whole waterfall must resolve inside the break, so the total budget is a hard ceiling, not a guideline. |
| Catch-up / DVR | Is a DVR-seeking viewer on live policy or VOD policy? |

**Recommendation: same panel, a different profile type**, so live placements can't accidentally
inherit a VOD profile's midroll cue points.

### 7. Bulk change

Three mechanisms, each right for a different situation:

| Mechanism | Use when | How it feels |
|---|---|---|
| **Edit the profile** | The policy itself changed — "all long-form news defers preroll by 8s" | Change one number, 42 placements move |
| **Select and apply** | An ad-hoc set that doesn't share a profile — "these 12 sections, whatever they're using" | Filter → select all → apply |
| **Find & replace on demand** | A tag changed — "swap this GAM tag for that one everywhere it appears" | Search by URL fragment, preview matches, replace |

The third is the one that gets forgotten and then needed constantly. Tags get re-issued,
partners change, passbacks are deprecated — today that's someone editing forty rows by hand at
11pm.

#### The non-negotiable triad

**Select → diff → revert as one action.**

1. **Select with a real filter**, not checkboxes alone — *"all preroll slots on NBT"*,
   *"everything on the Election profile"*, *"every placement containing `pubads.g.doubleclick`"*.
   A saved filter becomes a reusable working set.
2. **Diff before apply.** Not "are you sure" — the actual change:
   *"42 placements · ad timeout 2.5s → 8s · 3 publishers affected · 2 have an override and will
   be skipped."* That last clause is what prevents the silent half-failure.
3. **Revert the batch, not the rows.** One named change set —
   *"Election night timeout · 42 placements · 14 Aug 18:02 · Priya"* — with a single Revert.
   Forty individual undos is not a rollback.

### 8. Screens

**The list is the product, not the form.** Ad ops work in spreadsheets. If a change means
opening forty detail pages, the panel is already too slow no matter how good each page is.

1. **Placements** *(home)* — a table with the columns that actually get changed, editable in
   place. Sortable, filterable, multi-selectable.

       Publisher   Section    Slot      Profile          Lines   Delay   Timeout   State
       TOI         Sports     Preroll   Long-form news     4       3s      2.5s     Live
       TOI         Business   Preroll   Long-form news     4       3s      2.5s     Live
       NBT         Politics   Preroll   Election           3       8s      4s       Live  ⚠ override

2. **Placement detail** — the waterfall editor (ordered lines, raw URLs, per-line timeout,
   drag to reorder, paste-many) alongside the *effective* config with every inherited value
   sourced and every override flagged.
3. **Profiles** — list, editor, and *"used by 42 placements"* as a link, so nobody edits a
   profile without seeing the blast radius.
4. **Bulk change** — filter → select → diff → apply, as one flow.
5. **History** — change sets newest first, per level, each with Revert.
6. **Test** — fire the tag, show the actual VAST response and what would play.
7. **Health** — see §10.

Speed details ad ops will expect: **paste-many** (a textarea of tags, one per line, becomes an
ordered waterfall), **CSV in/out** (this is how the job is done today, and it's the escape hatch
when the UI can't express something), **duplicate**, **saved views**, and keyboard navigation
through the table. No wizards — wizards are for people doing a thing once.

### 9. Safety and trust

The panel's worst day is election night with a nervous operator.

1. **Test before publish** — fire the tag, show the VAST response and what would play.
2. **Draft vs published** — edits stage up; publishing is one deliberate action.
3. **History and revert** — who changed what, when, and one click to put it back.
4. **Guards on the dangerous values** — a 30-second timeout, a 12-ad pod, zero fallback. Same
   spirit as StreamAds' refusals: name the number entered next to the number that's normal.
5. **Crossing a publisher boundary asks once**, even for an admin. Within one publisher, it
   shouldn't nag.

### 10. Measurement — a waterfall you can't measure is tuned blind

Not a reporting engine. The minimum that makes reordering a decision rather than a guess:
**per line, over the last 24h/7d — fill rate, timeout rate, error rate**, shown in the waterfall
editor next to the line it describes.

    2  pubads.g.doubleclick.net/…/sports_preroll     fill 61%   timeout 3%   err 1%
    3  passback.partner.com/vast?…                   fill  2%   timeout 40%  err 6%   ⚠

Line 3 there is costing every viewer four seconds to serve almost nothing. Without the numbers
on the line, nobody finds that.

Consistent with the StreamAds principle: **counted, never invented.** These are measured
counts, labelled with their window, or the panel says there's no data yet.

### 11. Where StreamAds meets this

On publisher VOD players this is CSAI and GAM decides, so a direct deal booked in StreamAds is
trafficked as a **GAM line item** — it lives inside the tag, not as a separate waterfall entry,
and this panel never sees it. StreamAds' job there is booking and reporting, not decisioning.

One small, high-value connection: **StreamAds emits a tag for a booked deal, and the panel
accepts it as a line that shows which deal it belongs to.** An operator about to reorder or
delete a line then sees they're touching something sold, instead of an anonymous URL.

Everything more ambitious — first-look, enforced exclusivity, our own decisioning — is **SSAI**
territory: our own platforms today, and live streams if we take that on. That piece stays
parked with its four open decisions (buy vs build the stitcher, who re-encodes the ad, when an
impression counts, what fills unsold seconds). Livestreams on publisher players bring it back
into range, but it is a separate scoping session.

### 12. Open decisions

| # | Decision | Recommendation |
|---|---|---|
| 1 | Product name | "Player Config" is a working name |
| 2 | Link vs copy as the default | **Link with visible per-placement overrides** (§4) |
| 3 | **How fast does a published change take effect?** If config reaches the player via a CDN-cached endpoint with a 10-minute TTL, "change it in the moment" is not true. | State it as a product requirement — **under 60 seconds** — and let engineering pick the mechanism |
| 4 | Does publisher ops publish directly, or does central AdOps approve? | Direct, with history and revert. Approval workflows get routed around under pressure. |
| 5 | ~~Do we configure the page's own display slots, or only units the player owns?~~ | **Settled 14 Aug 2026 — display is in.** All four surfaces. What remains open is who owns a slot that both this panel and the page team can reach; one owner per slot, named per slot. |
| 6 | Live in the same panel? | Same panel, **separate profile type** (§6) |
| 7 | Does StreamAds emit tags for booked direct deals? | Yes — small build, and it's what stops an operator deleting a sold line (§11) |
| 8 | Where does the fill/error data come from — GAM reporting API, or the player's own beacons? | Player beacons: they see timeouts and errors GAM never hears about |
| 9 | SSAI | Stays parked. Revisit if publisher livestreams are committed. |

### 13. Scope slices

**First slice — the panel is useful without anything else**
- Placements table, editable in place
- Profiles with link and visible overrides
- Waterfall editor with paste-many and per-line timeout
- Change sets with revert
- Draft vs published, and the kill switch

**Second slice — the panel is fast**
- Bulk select-and-apply, with the diff
- Find & replace across demand lines
- CSV in/out, saved views
- Scheduled changes
- Test-the-tag

**Later**
- Per-line health numbers (§10)
- Live profile type, once livestream scope is confirmed
- StreamAds tag emission and sold-line labelling


---

## PLAYER-CONFIG-PRD — the PRD written from that scope
**One line:** a self-serve panel through which AdOps and publisher ops control how ads are
called and rendered by our video player and page slots on TOI, ET and NBT — in minutes, with
counted numbers, and with every change revertable as one unit.

**Status:** working prototype (`npm run player` → localhost:4200), mock API, seeded data.
Not production. Companion docs: `PLAYER-CONFIG.md` (scope), `PLAYER-CONFIG-V2.md` (the redesign
this build implements).

---

### 1. Problem

Ad behaviour in our player — which tags are called, in what order, how long we wait, whether the
preroll defers — is configured by engineering, per property, by hand. A change takes days; the
moments that need it (election night, a legal call, a dying partner tag) allow minutes. And
nobody can see what any tag is earning, so every waterfall decision is a guess.

### 2. Users & boundary

- **Users:** central AdOps and each publisher's ops team. The UI uses *their* vocabulary — VAST,
  pod, no-fill, passback — and shows raw tag URLs. Familiar, not simplified.
- **The boundary:** **GAM decides which ad wins. This product decides what we ask, in what order,
  and how the player behaves while it waits.** Deliberately absent because they live on the GAM
  line item: frequency caps, blocked domains/categories, competitive separation, skip rules, max
  ad duration, floors, creative rotation, targeting, creative approval. Header bidding resolves
  before the ad request and is not a waterfall position.

#### Who does what

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

#### Where tags come from

Tags are **minted in GAM, found here**. The portal syncs the ad-unit tree read-only from the Ad
Manager API (a service account AdOps owns); a unit created in GAM appears in search minutes later,
labelled *new — not placed anywhere*. Placing a tag is **Find in GAM** — search, click, done — so
the wrong-tag class of mistake disappears, and the ad-unit id becomes the join key for the later
revenue integration. Units already in the break are greyed; ones used elsewhere say where.
**Paste remains** for demand GAM does not know about — partner VAST, passbacks.

So the lifecycle is: **AdOps mints in GAM → anyone places from search within their own scope →
publisher ops reorder and tune day to day → only AdOps swaps a tag across publishers.**

### 3. The model (four objects)

    Placement  = publisher × section × slot. Owns its waterfall.
    Policy     = reusable behaviour (timeouts, delays, pod size, refresh…). No URLs.
    Line       = one tag in the waterfall, tried in order until one fills.
    Change Set = every edit — one placement or forty — as one entry with one Revert.

**Link, not copy.** A placement inherits its policy; change the policy once and every placement
on it moves. A placement may override any single value — the override is visible wherever it is
made, and that placement stays put when the policy changes (and the save says so).

### 4. The five screens — one per task, not per object

| Screen | The task |
|---|---|
| **Today** *(home)* | "Is anything wrong?" Live kill switches · tags dropping against their own last week (grouped by cause: one failing tag on 12 placements is **one** finding) · everything changed in 24h with Revert to hand. Empty when nothing needs you. |
| **Make a change** | The election-night motion: **what** → **where** (match count updates live) → **preview the diff** — every placement, old value, new value, who is skipped and why → apply as one change set. |
| **Placements** | Finding and browsing. Grouped by publisher, read-first, filter by section/tag/policy. |
| **A placement** | **Read-only with an Edit button** (~90% of visits are "check what this does"). A plain-language paragraph of what happens, the break as a strip, and counted fill/timeout per line. |
| **Policies · History** | Reusable policies, each showing its blast radius before you edit. Change sets, newest first, one Revert each. |

### 5. Data — counted, never invented

Per line: **fill rate, timeout rate, error rate**, with requests **cascading** down the
waterfall (line 2 is only asked what line 1 missed). "Dropping" means a line fell well below
*its own* prior week — no benchmark is invented, and no rupee figure is guessed at.

Prototype numbers are deterministically seeded (stable across resets, one baked defect so Today
has something true to say). Production replaces one file with **player beacons** — GAM never
hears about a client-side timeout. Revenue joins later from GAM's reporting API.

### 6. Rules the product keeps

- A bulk change is previewed as a **diff**, never "are you sure".
- One change set = one Revert. Forty undos is not a rollback.
- **Guards warn, never block**, naming the number entered next to the number that is normal
  ("Refresh every 15s — under 30s most partners call it invalid traffic").
- Impossible options grey out **where they sit**, with the reason ("an event airs when it airs").
- The kill switch is server-enforced and **requires a reason** — an unexplained one never gets
  turned back on.
- A display placement can never inherit a video policy; the server refuses with the reason.
- Budget arithmetic shows which lines the waterfall can never reach, before a viewer finds out.

### 7. Built but parked for the shipping v1

Composed breaks (video-then-display back to back), companions (display beside the video ad,
counted once), and the display/refresh surface all **work in the prototype** — the recommendation
in `PLAYER-CONFIG-V2.md` is to ship v1 as **video only, one publisher, one waterfall per
placement**, and sequence the rest, because scope discipline was the v1 lesson.

### 8. Success measures

- Time from "we need a change" to live: **days → minutes**, without engineering.
- Every change attributable and revertable; zero silent half-changes.
- Fill recovered from visible problems (e.g. a dropping tag found on Today, not in a month-end
  report).
- Operators use it unprompted — Today is worth opening in the morning.

### 9. Open decisions (blocking, owner needed)

1. **Propagation speed** — a published change must reach players in **< 60s**; a CDN-cached
   config on a 10-min TTL breaks the whole premise. Engineering picks the mechanism.
2. **Beacon pipeline owner** — everything in §5 depends on it.
2b. **GAM API service account** (read-only inventory scope) for the tag sync — AdOps owns it.
3. Draft/publish staging **per change set** (recommended) — exists in the model, not yet in the UI.
4. Publisher ops publish directly (recommended) vs AdOps approval.
5. StreamAds direct deals appearing as labelled "Sold" lines (small build, v2).

### 10. Next step

Not code: **two watched sessions** — an AdOps person ("fill looks down on TOI sports prerolls,
find out why and fix it") and a publisher ops person ("election night: defer prerolls across all
NBT news sections"). Record where they stall and every control they scroll past. That output is
the v1 cut list.


---

## PLAYER-CONFIG-V2 — the proposal after v1 was not approved
**Status: v1 not approved.** The prototype in `player/` did its job — it found the shape of the
problem — and what it found is that the screens were designed around the wrong thing. This is what
I would build instead, and what I would cut to get there.

Written 14 Aug 2026, after four attempts to make the v1 screens readable. Four rearrangements of
the same page is a signal about the page, not about the arrangement.

---

### 1. The verdict

**v1 is a good prototype of the object model and a poor prototype of the product.**

The model held up under every change we threw at it — link-not-copy, change sets, policy separated
from demand. The screens did not, because they were built around **the data model** (placements,
positions, lines, companions, profiles, overrides) rather than around **what someone came to do**.

And one gap disqualifies it on its own: **there is no delivery data in it.** Not one counted
number. So every decision it asks an operator to make is blind.

---

### 2. What v1 got wrong

#### 2.1 A config panel with no numbers is a text editor with opinions

Fill rate, timeout rate, latency, revenue — none of it exists. An operator looks at a waterfall and
cannot answer the only question that matters: *is this line earning anything?*

The "Worth a look" panel is arithmetic on the configuration, which is honest but thin. A yield
manager reads *"one line means one chance to fill"* and asks "so what **is** the fill rate?" — and
the tool has no answer. Everything downstream of that is guesswork with a nice interface.

**This is the single most important thing to fix, and it changes the product rather than improving
it.** A waterfall line with a number beside it stops being a form field and becomes a decision.

#### 2.2 The screens are organised by object, not by task

Nobody opens this tool wanting to "edit a placement". They open it because:

| What actually happened | Does v1 serve it? |
|---|---|
| Legal called — pull ads off this story, now | Yes, and quickly |
| Fill dropped on TOI sports — what changed? | **No** |
| Election tonight — defer prerolls across news | Buried: bulk only appears *after* you select rows |
| A new section launched — set it up | **No** — you assemble it field by field |
| That change was wrong — put it back | Yes |

Two of five unserved and one buried. That is why rearranging the placement page never fixed it: the
page is not badly laid out, it is the wrong page.

#### 2.3 Seven concepts before you have done anything

Placements, positions, lines, companions, profiles, overrides, change sets. Each one was added
because it is real — and each was added to the same screen instead of being sequenced.

**That is my error, not a change of requirements.** The right answer to "can a break play a video
then a display?" was *"yes, and it belongs in v2"*, not another section on an already-full page.

#### 2.4 Everything typed is live

`draft` / `published` exists in the data model and never appears in the interface. Every keystroke
is live immediately across three publishers. For a revenue-carrying tool that is not a gap, it is a
defect.

---

### 3. What survives

Worth defending, and unchanged across every revision:

- **Link, not copy.** A placement inherits a policy and may override any single value; overrides are
  visible wherever they are made.
- **The change set as the unit of revert.** One batch, one entry, one undo.
- **Policy separated from demand.** Policy travels and is shared; demand belongs to one place.
- **The field catalogue as data.** Cards compose atoms; the atoms are what history and bulk change
  address. Re-shaping the form costs one file.
- **The bulk diff.** Real before/after per placement, who is skipped and why — never "are you sure".
- **Guards that name the number** entered next to the number that is normal.

Two things in the v1 UI I would carry over: the **strip** (the break read left to right, the way it
plays) and the plain-language **"right now"** paragraph.

---

### 4. The five jobs, and the screens that serve them

The product should have one screen per job, not one screen per object.

#### Today *(new — replaces the 33-row table as home)*

Not an inventory. A list of **exceptions**, in the order they matter:

- **Off right now** — every active kill switch, with who set it, why, and how long ago
- **Changed in the last 24 hours** — each change set, with Revert on it
- **Underperforming** — lines whose fill has dropped against their own last 7 days *(needs §5)*
- **Due** — scheduled changes about to apply or about to revert
- **Search**, front and centre, because half of all visits are "find this one thing"

If nothing is wrong, this screen is nearly empty and says so. That is the point.

#### Change *(new — bulk as a front door)*

The biggest structural fix. **A change becomes a first-class object you compose**, rather than a
mode you enter by selecting rows:

    What        →  Preroll delay = Content first, hold the ad, 8s
    Where       →  publisher NBT · section /news/* · slot preroll     (42 placements)
    When        →  now  ·  or from 18:00 until midnight, then put it back
    Preview     →  the diff: every placement, old value, new value, who is skipped and why
    Apply       →  one change set, one Revert

One flow covers single edits, bulk edits, immediate and scheduled. It is also the natural home for
**find and replace on a tag**, which is the operation that gets forgotten and then needed weekly.

#### Placements

Still needed — browsing and finding is real. But **read-first**: the row says what the placement
does, not what fields it has. Filters that match how people think: *"everything using this GAM
tag"*, *"everything with refresh on"*, *"everything overriding its policy"* — not "linear vs
display".

#### A placement

**Read-only by default, with an Edit button.** Roughly 90% of visits are "check what this does".
The page shows the plain-language read, the strip, the numbers per line, and the policy it runs on.
Editing is a deliberate act, and it stages into a draft.

#### Policies · History

Broadly as they are. Policies keeps its blast-radius view; History keeps change sets and Revert.

---

### 5. The data layer — the missing half

Nothing above works without this, and it is the part that is not a UI change.

**Minimum, per line, per placement, per day:** requests · fills · timeouts · errors · median time to
first frame. From the player's own beacons, because GAM never hears about a client-side timeout.

**Revenue is a second, separate integration** — it comes from GAM's reporting API, joined on ad
unit, not from beacons. Worth being precise about that: beacons tell you *whether it filled and how
long it took*; GAM tells you *what it paid*. The tool needs both, and they arrive on different
schedules.

**What this unlocks, in order of value:**

1. A fill rate beside every waterfall line, so ordering is a decision instead of a guess
2. "Underperforming" on the Today screen — the only reason anyone opens a tool unprompted
3. Before/after on a change set: *"since this change, fill on these 42 is up 4 points"* — which is
   what turns the tool from a config editor into something a yield team asks for
4. Honest revenue-per-break arithmetic instead of the directional sentences v1 carries

**Prototype path:** seed it deterministically the way StreamAds seeds delivery — RNG seeded from the
line id — so numbers are stable across resets and a screenshot never drifts. That is enough to
design against; the real feed follows.

---

### 6. Scope

The instinct to cut hard is the main thing I got wrong the first time.

#### v1 — one surface, one loop, end to end

**Video only. One publisher.** Prove the loop — *see a number → make a change → watch the number
move* — on the smallest surface that can carry it.

- Placement · Policy · **one** waterfall per placement
- Fill / timeout / error per line, counted
- Today, Change, Placements, A placement, History
- Kill switch, draft vs published, change sets with Revert

**Deliberately not in v1:** composed breaks (positions), companions, display slots, sticky and
interstitial, scheduled changes, the overlay surface.

#### v2 — the rest of the surfaces

Display slots and their loading/refresh behaviour · composed breaks · companions · scheduled
changes · find-and-replace across tags · CSV in and out.

#### Later

Per-line revenue joined from GAM · overlay/non-linear · live and SSAI · StreamAds tag emission with
sold-line labelling.

---

### 7. What to validate before building any of it

I said the prototype existed to settle the screens by being used, and then never put it in front of
anyone. That is the next step, not more code.

**Two sessions, two people, one task each, watched not asked:**

- **An AdOps person:** *"Fill on TOI sports prerolls looks down this week. Find out why and fix it."*
  This will fail today — there is no data — and watching exactly where it fails tells us what the
  Today screen must show.
- **A publisher ops person:** *"It's election night. Make prerolls play after the content starts,
  across all news sections on NBT."* v1 can do this. The question is whether they find it without
  being shown, and how long it takes.

**What to record:** every field they scroll past without reading (that is the next trim), every
place they ask "what does this mean", and how long each task takes end to end.

---

### 8. Open decisions

| # | Decision | Recommendation |
|---|---|---|
| 1 | Is a v1 of video-only, one-publisher acceptable, or must it launch across all three? | **One publisher.** Three multiplies the blast radius before we know the tool is right. |
| 2 | **How fast does a published change take effect?** Still unanswered, still architectural. | Product requirement: under 60 seconds. A CDN-cached config on a 10-minute TTL makes "change it in the moment" untrue. |
| 3 | Who owns and builds the beacon pipeline? | Blocking for everything in §5. Needs an owner named before v1 starts. |
| 4 | Draft vs published — per placement, or per change set? | **Per change set**, so a bulk edit stages and publishes as one thing. |
| 5 | Does publisher ops publish directly, or does AdOps approve? | Direct, with history and revert. Approval gates get routed around under pressure. |
| 6 | Who owns ad load — product, editorial, or yield? | Product sets the ceiling; yield works inside it. Needs naming before display ships. |
| 7 | Do StreamAds deals appear as labelled lines? | Yes, v2. It is what stops an operator deleting something sold. |

---

### 9. What happens to the v1 code

Keep `player/api/` — the model, the catalogue, the change sets and the mock world are all reusable,
and the settings catalogue is the accumulated thinking about what this thing configures.

Rebuild `player/web/` around the five screens above. The API seam (`web/js/api.js`) means the
screens can be replaced without touching the server.

**Nothing here is built. This is a proposal to react to.**


---

## WATERFALL-SCOPE — integrations-first waterfall (19 Aug 2026)
Manager review of the 19 Aug demo asked for **operational simplicity**: an ops person should be
able to select a cohort of integrations and, from that one place, turn pre/mid/post on or off, set
each slot's waterfall, and reorder tags — without opening 30 editors. This document scopes that
rework.

**Status: BUILT 19 Aug 2026.** All five phases shipped; `npm run test:panel` covers the new rules
in 53 cases. `PRODUCT-LOG.md` is the spec of record for what exists — this document is kept as the
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

### The one rule everything follows

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

### Model changes

#### 1. Slot = a switch + a waterfall (1 primary + up to 3 backups)

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

#### 2. Tags become first-class objects

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

#### 3. Fallback stack → common waterfall

The shared object survives — renamed, retyped, and re-scoped. It *is* the manager's "option to
configure a common waterfall".

- `waterfall = { id, name, type: 'video' | 'display', property, rungs: [≤4] }`
- A slot either owns its rungs or points at a common waterfall. Link-not-copy stays, which keeps
  the bulk story: change the ladder for 30 integrations by editing one object.
- The key-level attachment becomes "common video waterfall / common display waterfall", inherited
  by sections as today.
- The three per-family ladders (`video` / `display` / `lband`) collapse to two types: **L-band is a
  display-type slot.** One less family, same coverage.

#### 4. Monetization policy loses every switch

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

#### 5. Display slots: backups now, rotation later (user call, 19 Aug)

Today a display or L-band slot holds up to 5 units that the policy's show times consume **in order,
repeating** — a *rotation*. Under the new model the same list reads as a *fallback ladder*. The
call: **build the ladder meaning**, so display obeys the same one rule as pre/mid/post and there is
nothing extra to explain; rotation returns later as an explicit per-slot "rotate these" switch if
ops actually asks for it. Two consequences to accept now:

- The rung shape must stay rotation-compatible (an ordered list of typed tags already is), so the
  later switch is a flag, not a re-model.
- Any existing display slot carrying 2+ units is migrated as a **ladder**, and its integration is
  named in Activity so nobody discovers the change in a report.

### Bulk — the actual ask

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

### Where this contradicts existing decisions (deliberate)

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

### Still open — need a call before building

1. **Bulk reorder semantics.** Reordering across integrations that hold *different* tags isn't
   well-defined. **Recommend:** reorder is an operation on a common waterfall (edit once, everyone
   follows); for own-list slots, bulk offers *Replace* instead, and the menu says why.
2. **Does a house promo count toward the policy's max ads/session?** Open since 19 Aug; recommend
   yes.
3. **Who owns the house category vocabulary?** Open since 19 Aug.

### Build order (sized)

| Phase | Work | Notes |
|---|---|---|
| 1 | Model + API: tag library, waterfall object, slot `{on, waterfall}`, policy pruning, migration of existing slots/stacks | Biggest chunk; 20-case test suite needs rewriting alongside |
| 2 | Integration editor: slot row = switch + primary + backups, reorder, inline tag creation, worst-case wait | The screen the manager will judge it on |
| 3 | Policy editor prune + "live on N of M" counted lines | Mostly deletion |
| 4 | Bulk bar rebuild (three menus, previews, per-section activity) | The demo moment |
| 5 | Common waterfall page (rename from stacks), house rungs re-homed | |

Tests-first for phase 1 — this is a model change, and `npm run test:panel` is the fast gate.


---

## OPS-SPEED-SCOPE — ops changes, quickly and confidently (20 Aug 2026)
**Status: SCOPE, nothing built.** 20 Aug 2026.

Objective, plainly: **an ops person should be able to make a change across many integrations quickly,
and not be afraid of it.** Everything below serves that and nothing else.

### What we have, and what it misses

Everything built so far optimises **the act of changing** — pick a cohort, pick a unit, pick a rung,
apply. That act is now fast, counted, and hard to get wrong.

Two things are missing, and neither is about the act:

**1. There is no reverse gear.** Nowhere in the panel can a change be put back. The only place the
word "undo" appears is on delete dialogs, saying it cannot be. Every change is forever.

**2. The journey starts in the wrong place for the most urgent job.** The panel asks *which unit* 
first. When a partner is timing out, ops are thinking *"partner X is broken"* — and the panel makes
them work out which units X's tag sits in before they can do anything about it.

The first one matters more than any remaining click:

> A six-click change you can undo in one is faster **to attempt** than a three-click change that is
> permanent — because the permanent one needs thinking about, checking, and often someone else's
> agreement, before anyone dares.

And the panel's posture currently says *be careful* everywhere: every state-changing button confirms,
the bulk confirm is titled **"Apply to live traffic?"**, deletes say **"This cannot be undone."**
Right for a system where mistakes stick. Wrong for one where ops are meant to move.

### The jobs, and how we do against them

| | Job | Today |
| --- | --- | --- |
| **J1** | *"Partner X is timing out — get them out of the ladder everywhere, now."* | Units filter → select → rung Off is strong. But you must first guess which units their tag is in. |
| **J2** | *"Swap the waterfall 1 tag across all mweb integrations."* | **Good.** This is the path we built. |
| **J3** | *"That was wrong. Put it back."* | **Not supported.** Reconstruct by hand from the activity log. |
| **J4** | *"Do 5 first, then the rest."* | Possible by selecting carefully. Nothing tracks that 5 are done and 62 are not. |
| **J5** | *"What changed last night, and who did it?"* | Activity log is decent — but one bulk act shows up as 50 unrelated entries. |
| **J6** | *"Where is this tag used?"* | Not supported. `usedBy` is counted on the tag; the list cannot be filtered by it. |
| **J7** | *"Set up a new property × platform surface."* | Fine. Not a speed problem. |

### Two root causes

**A bulk act is not a thing.** Applying to 50 integrations writes 50 independent activity entries
with nothing tying them together. So there is nothing to put back, and nothing to read — J3 and J5
both come from this.

**The entry point assumes you know the unit.** J1 and J6 both come from this.

### Proposal, in the order I would build it

#### 1 · Group a bulk apply into one change (foundation)

One apply becomes one record: who, when, what, which integrations, and **the prior value of every
slot it touched**. Every activity entry from that apply carries its id.

Two immediate wins on its own, before any undo exists:
- the activity log collapses 50 lines into one that expands — J5;
- there is now something a revert could grab hold of.

#### 2 · Undo

- **Immediately after applying** — the success toast gains it: `Pre-roll — 33 changed · Undo`, alive
  about ten seconds. Catches the ordinary slip, which is the common case.
- **Later** — `Revert` on any grouped change in Activity, however old. A revert is itself a recorded
  change, so it shows up in the log and can itself be reverted.

Reverting uses the stored prior values, so it puts back exactly what was there — including rungs that
were switched off, and sections that were skipped and therefore should not move.

#### 3 · Stop confirming reversible changes

Today: Apply → confirm dialog → done. Once undo exists, that confirm is a tax on the common path —
and a wall of text people click through is weaker protection than a real second chance. So apply
immediately and offer undo. Keep the confirm **only** where the act genuinely cannot be put back:
deletes, and anything that discards configuration rather than changing it.

Biggest single speed gain available, and the panel gets safer, not looser.

#### 4 · Start from the tag

- A **Tags** filter on the list — cheap, and answers J6 by itself.
- A **tag-first journey**: find the tag → *"switched on at 34 rungs across 19 integrations"* → switch
  it off everywhere, or everywhere on one property. This is J1 in three clicks instead of a guessing
  game, and J1 is the job with a clock on it.

#### 5 · Repeat the last change on another cohort

*"Do that again"* — reopen the unit screen prefilled from a previous change. Today *"I did it for
TOI, now do ET"* means walking the whole journey again from memory.

### Open questions

- **J4 (staged rollout).** Is *"filter, select, apply, then widen the filter"* actually enough? It
  works, it just isn't tracked. I would leave it alone unless ops say they lose their place.
- **Undo window.** Ten seconds for the toast is a guess. If ops typically notice a mistake when the
  next dashboard refreshes, the toast is the wrong mechanism and Activity revert is the real one —
  worth asking them.
- **Undo across people.** If two people change the same slot, whose undo wins? Simplest honest
  answer: a revert that would overwrite someone else's later change refuses and says so, the same way
  bulk refusals already name what they skipped.

### Out of scope

- Performance, revenue or fill data in the panel — v2 owns reporting.
- Scheduling: nothing in the panel runs on a clock, and adding one for this is not justified.
- Splitting a cohort into test and control.

### Unchanged

Counted arithmetic, the fail-closed rules, the typed-tag rule, and the outcome previews all stay as
they are. Undo is not a licence to be vaguer about what a change will do — it is what makes being
precise cheap enough to do every time.


---

## AD-SETUP-SCOPE — two rooms: demand as its own piece (24 Aug 2026)
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

### The vision, played back

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

### The one rule, now in three parts

> **Ad ops supply WHAT can fill (the Ad Setup). The integration says WHETHER it runs (its
> switches). Its own rules say HOW it behaves (inline).**

The existing rule ("demand decides whether, policy decides how") survives intact — the slot
switch stays on the integration; only the *contents* of demand move out.

### The model, before and after

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

### Two deliberate reversals (recorded, with why the forces differ)

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

### The strip — one control plane per integration

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

### The seam — where the two teams meet, it fails closed with names

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

### Bulk, re-homed by owner

| Stays on Integrations bulk (product) | Moves to the Ad Setups room (ops) |
| --- | --- |
| Slot on/off, status pause/live | Rung on/off, reorder, pool on/off |
| Rule fields (incl. pod fields) — simpler, no shared-copy semantics | Ladder edits — one setup, N integrations follow |
| Player-setup fields | Tag library, tag-first entry ("where is this tag used?" — J6) |
| Attach / change Ad Setup | |

### Migration (deterministic, every touched object named in Activity)

- Each integration's current ladders → one auto-created Ad Setup, `"<Integration name> — setup"`,
  attached 1:1. A non-default section whose ladders differ gets `"<Integration> — <Section>"`.
- Each section's linked behaviour/policy → **values stamped inline** into that section. The
  shared Player Setup / Ad Rules objects, their routes, and sidebar entries are then **removed,
  not hidden** (house rule); their three shapes are reborn as creation presets.
- Switches keep their exact state; nothing changes what serves on day one.

### Out of scope, v1

Sign-in and role *enforcement* (the panel has no auth — the split is architectural now,
enforceable later) · approval/acknowledgment workflows between the teams · preset governance ·
undo (that is OPS-SPEED-SCOPE) · any change to what the player requests.

### Open questions — need the manager's call

1. **Can one Ad Setup serve many integrations?** Recommend yes (1..N, used-by counted) — reuse is
   the point of giving ops their own object; 1:1 would rebuild today's duplication one room away.
2. **When ops edit a setup 12 live integrations use** — apply immediately with a named warning
   (recommended; matches the panel's "applies immediately" pattern), or hold for product
   acknowledgment (safer, heavier — enterprise later)?
3. **How much demand may product see?** Recommend a read-only ladder view from "Fills from" —
   transparency without control. Name-and-counts-only is the stricter alternative.
4. **Who owns the preset vocabulary** for rules/player shapes (the old MiniTV/ArticleShow/
   VideoShow trio)?

### Build order (sized honestly)

| Phase | Work | Notes |
|---|---|---|
| 1 | Model + API: Ad Setup object + attach, rules/behaviour inlined, migration, the seam refusals | **Biggest restructure since 19 Aug** — roughly half the 79-case suite rewrites |
| 2 | Integration editor: the strip, inline rule/player groups, "Fills from" reference | The screen the manager judges it on |
| 3 | The Ad Setups room: list, editor (ladder renderer reused), used-by, tags re-homed, tag-first entry | Ops' own front door |
| 4 | Bulk re-home per the table above | J1 becomes one act |
| 5 | Presets + nav polish | |

Tests-first for phase 1, as always — and nothing starts until the open questions above have calls.


---

## POD-SCOPE — client-side ad pods (24 Aug 2026)
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

### The one rule, extended

> **Demand decides *whether*. Policy decides *how*.** A pod changes neither object.

How many ads a break plays, its time budget, how the next slot is filled, where a banner may sit —
all *how* → **ad rules**. Who supplies each ad → the **same ladder, untouched**. No new objects,
no slot change, no tag change. A pod is a property of the break, not of the ladder.

### Model — fifteen policy fields, nothing else (reworked per break, 24 Aug evening)

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

### The walk (player contract — the panel stores it, the player obeys it)

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

### Duplicates — deliberately out of v1 (PM call, 24 Aug)

The same commercial can appear twice in one break and v1 does nothing about it. Stated here so
nobody discovers it as a bug. The follow-ons, in order of value: **id-check backstop** (compare
each arriving ad's id against the break, discard matches — what player frameworks ship);
**pod-labelled asks to GAM** (label the requests as one break so *its* server dedupes — the only
guaranteed route); **whole-pod ask** (one GAM request returns the packed break — lands as a third
value of `podNextAd`: *"let the seller pack the break"*, which is why that control is cut at this
joint). Brand-level separation (two different Pepsi spots) is not reliably possible client-side —
the advertiser field is too often empty — and is not promised in any version.

### The journey — one control at rest, the rest revealed

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

### Decisions of record (24 Aug 2026)

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

### Out of scope

SSAI / stream stitching · duplicate handling (v1) · brand separation (any version) · per-break
fill overrides · rung-level duration hints outside `'strict'`-mode GAM asks · pod bidding.

### Build order (sized)

| Phase | Work | Notes |
|---|---|---|
| 1 | Model + API: seven fields, validation, the three counted warnings, migration (defaults = today's behaviour) | Tests-first; every existing policy must normalize unchanged |
| 2 | Ad rules editor: three segs, the revealed fill cluster, spec-preview row | The disclosure rule is the review point |
| 3 | Bulk: fields into the break tabs + `BULK_POLICY_FIELDS` | `mixed` handling exists |
| 4 | Player contract: the seven walk rules above land in `API-SPEC.md` as the config consumer's spec | The panel stores; the player obeys |


---

## LEVERS-SCOPE — the integration as the product team's cockpit (24 Aug 2026)
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

### The diagnosis — why the rounds keep not landing

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

### The one new idea: the same ladder card at three altitudes

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

### The model addition that makes use case 3 legal: LOCAL OVERRIDES

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

#### The ops room sees the divergence, counted

A shared setup whose surfaces locally diverge must say so, or ops debug ghosts. Each family
in the setup editor gains a counted line — *"locally reordered on 4 of 12 · rungs muted on
7"* — and each rung row a chip — *"muted on 3 integrations"*. Counted from the integrations,
never estimated.

### The manager's three use cases, mapped

| Use case | One section | All sections of one integration | All sections of N integrations (bulk) |
|---|---|---|---|
| 1 · Post-roll off | the section's slot toggle *(exists)* | the strip's slot switch *(exists)* | bulk slot tab's On/Off *(exists)* |
| 2 · Pre-roll timing / break change | quick fields inline on the open slot row *(new placement)* | same fields on the expanded strip row *(new)* | bulk slot tab's fields *(exists)* |
| 3 · Reorder / mute waterfall rungs | drag + per-rung toggle on the section ladder *(new: local overrides)* | positional rows on the expanded strip *(new)* | positional rows on the bulk slot tab *(reinstated)* |

### What this reverses, and why it is not flip-flopping

The morning's build removed the positional bulk acts (`slotRungOn/Off/Move`, `slotPoolOn/Off`)
because a rung switch had become an act on the SHARED setup — an ops act. They return here
with a different target: they write **integration-local overrides** and never touch a setup.
The removed acts wrote shared demand; the reinstated ones write each surface's own use of it.
Same buttons, different (and now safe) blast radius. `slotPrimary`/`slotRung`/`slotReplace`
stay dead — bulk still never writes an ad unit (20 Aug, permanent).

### Out of scope

Product adding/changing tags anywhere (ops room only, unchanged) · un-killing an ops-killed
rung from the product room · per-section granularity in bulk (the manager's explicit call:
bulk reaches all sections, no sub-choice) · roles/enforcement · undo (OPS-SPEED-SCOPE).

### Open questions — his call

1. **May a local order also demote the primary?** Recommend yes — it is this surface's walk;
   the setup's order remains the default everywhere else. (No = order is "mute-and-append
   only", weaker but simpler.)
2. **Should the quick rule fields on the strip write ALL sections including own-rules ones**
   (recommended — matches bulk's one-rule), or Default only?
3. **Divergence guardrail:** when a section's local order has drifted from the setup's,
   surface a quiet chip only (recommended), or warn on every setup edit?

### Build order (sized)

| Phase | Work | Notes |
|---|---|---|
| 1 | Model + API: `muted`/`order` on slots, resolution, seam extension, setup divergence counts; bulk `slotRungOn/Off/Move` + `slotPoolOn/Off` reinstated as override-writers | Tests-first; ~10 new cases |
| 2 | The ladder card at section scope (names, drag, rung toggles, quick fields inline) | The screen he judges |
| 3 | The strip rows expand to integration scope (counted positional rows + quick fields) | Same component, wider counts |
| 4 | Bulk slot tabs regain the positional rows (same component again) | Parity complete |


---

## SECTIONED-SETUPS-SCOPE — one demand document per surface (25 Aug 2026)
**Status: BUILT, 25 Aug 2026** — and extended the same day: AD BEHAVIOUR moved into the
setup too, on the SLOT (see panel/PRODUCT-LOG.md, "AD BEHAVIOUR MOVED TO THE AD SETUP"). The
split that made it work: a field describes either the ADS (→ the setup's slot/placement)
or the PLAYER (→ the integration). Nothing was left over, so the third object stopped
existing rather than moving somewhere quieter, and the per-break field prefixes died with
it (15 pod fields → 5). A new placement clones Default. 25 Aug 2026, from the PM's proposal ("ad sections in the
ad setup itself, one ad setup per Integration").

### The itch is real

A multi-placement surface today needs MULTIPLE setup objects — TOI Mweb VideoShow runs on
"TOI VideoShow demand" *and* "TOI Shorts demand". Ops maintaining one surface juggle N
objects; nothing groups them. The proposal: the setup carries the placements.

### But strict 1:1 breaks the thing the manager liked best

One-setup-per-integration kills sharing — and the shared setup is the **2am one-act fix**
("rung off once → every attached surface stops calling the sick partner"), endorsed
explicitly (AD-SETUP-SCOPE, open question 1) and load-bearing in journey B. 1:1 also
re-creates the 19 Aug disease: thirty copies of the same backfill ladder, edited thirty
times.

### The synthesis: setups carry SECTIONS, and stay attachable 1..N

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

### Sizing

Comparable to the two-rooms rework: model + fixtures + suite rewrite (~half), both
editors' section plumbing re-keyed by name, bulk attach semantics. Not a same-day change.

### The question for the manager

Keep sections product-owned (today) or move them into the setup as ops-owned placements
(this scope)? Everything else — 10-rung ladders, IMA/GPT/SLike/CAN with protocol-implied
types — shipped 25 Aug independently of this call.


---

## DRIVING-SCOPE — quick decisions on Ad delivery, the workshop in the setup (26 Aug 2026)
**26 Aug 2026, manager review via the user.** The complaint, in the manager's own image: the
Ad delivery card had become a workshop. Driving a car you get two or three controls — a
switch, a preconfigured gear ("IMA only", "IMA then GPT", "depth till 3") — and anything
finer means stopping the car. Dragging waterfall positions, muting individual tags and
bending timing numbers are stopped-car work, and they were all sitting on the driving screen.

### The four decisions (user, 26 Aug — after two scoping rounds)

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

### What moved, what died

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

### What this deliberately does NOT do

- No preset objects, no preset vocabulary to own (closes AD-SETUP-SCOPE open question 4 by
  construction): the Who dropdown is GENERATED from the companies actually in the setup.
- No per-integration deep editing anywhere: the escape hatch is the setup itself, safe
  because it is yours alone.
- `only:`/`first:` per company, not "A then B" permutations — pairs explode when a third
  partner joins; only/first stays two options per company.


---

## AD-JSON-SCOPE — the player's ads JSON (31 Aug 2026)
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
one findable home. Phase 4 (the written player contract) stays open. PRODUCT-LOG.md is the spec of
record for what exists; this document remains the record of why.

Companions: `AD-SETUP-SCOPE.md` (two rooms), `DRIVING-SCOPE.md` (the drive + the 1:1 promise),
`POD-SCOPE.md` (pods), `WATERFALL-SCOPE.md` (ladders). `PRODUCT-LOG.md` stays the spec of record.

### What the JSON asks for that we do not have

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

### The one rule, extended

> **Ad ops supply WHAT can fill. The integration says WHETHER it runs. Its own settings say HOW
> it behaves.** A tier is a *what*, so it lives in the ad setup. A banner's four numbers describe
> one unit's own behaviour, so they live on that unit's row. Neither adds a screen.

### The model

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

### Where each control lands — and why nothing new appears

#### 1 · Direct is one collapsed row, above the placement tabs

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

#### 2 · A banner unit grows a sub-row. A video unit grows nothing.

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

#### 3 · Display slot is a dropdown of preconfigured positions

`Player bottom · L_50 · …` — a fixed vocabulary from the player, never free text. A typed
position is a dark ad nobody discovers until a revenue report.

> **Naming collision to settle:** Delivery settings already has **Display ad position**
> (`podBanner`: *Last position only / Any position*) — where a banner may sit **in the pod**. The
> new field is where it sits **on the page**. Two "positions" on one card is one too many.
> Recommend the new one is **Display slot**, hover *"where on the page this banner renders."*

**Sizes are out of scope, by your call.** Consequence, recorded: GPT cannot request a banner
without a size, so the size set belongs to the position on the player side. The panel names the
position; the player knows what fits there. That is a cleaner split than storing pixels twice.

#### 4 · A mid-roll is now BREAK GROUPS — up to 3, each with its own cadence and ladder

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

#### 5 · Out-stream is a fifth tab, with the squeeze-back's anatomy

Structurally it already exists: a rotation of banners with show times, a hold, and a per-session
cap. Out-stream is that, outside playback, plus one switch.

    BREAK   ⬤ Pre-roll   ⬤ Mid-roll   ⬤ Post-roll   ○ Squeeze-back   ⬤ Out-stream

    OUT-STREAM      1 banner · every 30s · up to 2 a session
      AD SOURCES    ⬤ GPT ▾  TOI Player Bottom 640x90   ·  Display slot [ Player bottom ▾ ]
      DELIVERY      Shows at        [ 0:00, 0:30, 1:30 ]
                    Each holds      [ 20 ] sec
                    Max a session   [ 2 ]
                    Hide during video ads   [◗]        hideOnInStream

*Amended 8 Sep (user call): the delivery rows are four, not five.* `Max a session` wears the
breaks' own words — **Total Target Impressions**, a typed number (a rotation runs all session
where a break picks 1/2/3) — and **Hide during video ads is CUT**: an in-stream ad owns the
screen while it runs and the player steps the banner aside on its own, so the switch had one
sane answer and no decision in it. Removed, not hidden: out of `SLOT_BEHAVIOUR_FIELDS`, out of
`normalizeSlotBehaviour`, out of `/panel/meta` and the wire, and into `DEAD_BEHAVIOUR_FIELDS`
where a payload still carrying it is refused by name.

The tabs already carry state dots and the whole grammar. Five tabs is one more tab, not one more
idea. **Direct does not reach out-stream** — Direct is break demand; out-stream is not a break.

#### 6 · The break's fill timeout sits in the row it argues with

Delivery settings already ends on **Tag timeout `1500 ms`** with its counted consequence beside
it — *"8 × 1500ms — up to 12s to fill"*. `totalTimeout` is a cap on exactly that number, so it is
the next row and nowhere else:

    Tag timeout          [ 1500 ] ms    8 × 1500ms — up to 12s to fill
    Break fill timeout   [ 20 ]   sec   the whole ladder gives up here

**New counted warning, never blocking:** when depth × tag timeout exceeds the fill timeout, the
tail is unreachable — *"10 tries × 1500ms is 15s, but this break gives up at 12s — the last 2
tries would never run."* Counted from the two numbers on screen, exactly as principle #1 requires.

#### 7 · Three player settings join the integration's Details

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

### Request templates come into the panel — reversing the 20 Aug call, on purpose

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

### The seam — new refusals, fail closed with names

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

### Counted facts, per principle #1

Nothing new is estimated. Every summary line is arithmetic over stored numbers:

- `Direct   2 tags · up to 2 a session · tried first at every break`
- `Out-stream   1 banner · every 30s · up to 2 a session`
- `Mid-roll   4 of 4 tags active · every 3:00, stop after 5 · 1500ms timeout`
- `10 tries × 1500ms is 15s, but this break gives up at 12s — the last 2 tries would never run`
- `5 breaks at 2 ads is 10 mid-roll ads` — the existing pod warning, now counting against the
  stop count instead of an unbounded cadence

### Bulk, and what "hierarchy" means now

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

### Where this contradicts existing decisions (deliberate, each with its force)

| Standing decision | What changes | Why the force differs |
|---|---|---|
| **Across the session is gone** (27 Aug) — every session-wide field refused by name | `Max ads a session` returns, for Direct only | It is a property of the *direct list*, not of a placement. A direct deal's promise is per session by nature. The other fourteen stay refused. |
| **"Adjacent slots are the page's display units — this panel does not serve them"** | The panel now names where a banner **it serves** renders | It still does not manage the page's own standing ad units, refresh them, or gate them on viewability. It says where its own fallback banner lands. Narrow, and the three `adjacent*` fields stay dead. |
| **Bulk reorder is not well-defined across integrations holding different tags** (19 Aug, open) | Bulk orders the fallback | Resolved rather than overridden: the thing being ordered is the **partner**, not the unit, and that is well-defined across fifty surfaces. |
| **Provider templates stay server-side, no interface** (20 Aug) | A template library in the ops room, picked per tag | The 20 Aug world had one template per provider, so there was nothing to choose. `unittpl` names several and `tpl` picks — a choice needs a home. Ops still cannot break a URL: the macro vocabulary is validated, fail closed. |
| **Ad partners orders the whole walk** (27 Aug, §14) | It orders the fallback only | Tiers now set the sequence. The control was never able to express Direct, so it was describing a walk it did not fully control. |

### Decisions of record (31 Aug 2026, the user's calls)

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

### Open questions — need a call before phase 1

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

### Build order (sized honestly)

| Phase | Work | Notes |
|---|---|---|
| 1 | **Model + API**: the Direct tier and its cap, mid-roll break groups (one group = today, normalize unchanged), banner fields on a rung, `pause` three-way, break fill timeout, out-stream as a fifth slot type, templates as objects, the new refusals and counted warnings | Tests-first. The walk resolution (`driveWalk`, `liveConfig`) is where tiering and groups actually bite — Direct prepends, depth counts the fallback only, each group resolves its own walk |
| 2 | **Ad setup editor**: the Direct row above the tabs, break-group rows inside Mid-roll, the banner sub-row, the out-stream tab, the two new delivery rows, the template row in the tag dialog + the Request templates list | The screen the taste is judged on. Renderers are reused whole — `behaviourRowsHtml`, the rung row, the collapsible slot anatomy, once per group |
| 3 | **Integration + bulk**: Fallback order relabelled, Direct and Primary in the resolved waterfall (one line per group), out-stream switch, Playback timing fold, the four bulk additions | Mostly copy and one field list |
| 4 | **The publish contract**: the emitted JSON, `unittpl` resolved from the tags' chosen templates, ms-vs-seconds, and the walk rules the player obeys — written down at last | Closes POD-SCOPE phase 4, open since 24 Aug |

Phase 1 rewrites a slice of the 92-case suite. `npm run test:panel` is the fast gate, as always,
and nothing starts until the six open questions above have calls.


---

## STORE-SPLIT — how api/store.js was split, and the rules it followed (3 Sep 2026)
> **7 Sep 2026:** `store/diff.js` was renamed `store/changes.js` (its name clashed with
> `validate.js`'s `diff()`); `FIELD_WORDS`/`fieldWord` moved to `store/state.js` and
> `unpublishedChanges`/`isDirty` to `store/publish.js`. The module map below is otherwise
> current; see `ARCHITECTURE.md` for the live layout.

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

### Why

`api/store.js` is one file of ~2,300 lines holding the entire model: every object, every
validation rule, the publish plane, and the change wording. Every server change lands in
the same file, so two people cannot work on it at once, reviews are slow, and a rule can
be duplicated far from its twin without anyone noticing. The stylesheet already taught us
that failure mode: three visual bugs traced to the same class being defined twice,
thousands of lines apart. The model file deserves the fix before the same thing happens
to a business rule.

### What it becomes

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

### The one rule

**A split is a move, not a rewrite.** Function bodies are not edited, renamed, or
"improved" in the same change. Any cleanup someone wants to do happens in a separate
change afterwards, where it can be reviewed on its own. This is how the front-end splits
were done, and why they shipped with zero regressions.

### What must not change — the rules the file currently enforces

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

### How to do it safely

1. Move `state.js` out first — everything else depends on it, it depends on nothing.
2. Then one module per change, in this order: validate, tags, setups, keys, publish,
   diff. One module, one review.
3. Run `npm test` (117 cases, ~1s) before and after every move. The suite talks to the
   server over HTTP, so it needs no edits — if it stays green, behaviour held.
4. Finish with the browser probe battery the repo carries (screenshots and console
   checks across every screen).

### Done when

- `store.js` is a re-export file; no module is longer than ~500 lines.
- `server.js`, the tests, and the mock world are untouched.
- 117/117 before, 117/117 after, and no probe reports a console error.
