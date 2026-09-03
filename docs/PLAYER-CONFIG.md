# Player Config — scope

**Working name.** Nothing here is built. This is the scope of record for the second surface:
a configuration panel for how ads render in our video players on publisher properties
(Times of India, Economic Times, Navbharat Times), handed to the central AdOps team and to
each publisher's product/ops team.

Scoped 13–14 Aug 2026. StreamAds v2 (the direct-deal booking platform) is described in
`v2/README.md` and is a **different product with a different audience** — see §3 and §11.

---

## 1. The ask

We own the video player across publisher properties. Today, how that player behaves around
ads — which slots exist, which VAST tags get called, in what order, how long we wait, whether
the preroll is deferred — is configured by engineering, per property, by hand.

The ask is to make that a product: a panel AdOps and publisher ops teams operate themselves,
including in the moment. The example that defined the requirement: *during an election, change
the ad timeout, or defer the preroll so content starts first* — and do it across the site in
seconds, not by editing forty sections by hand.

The constraint, stated: **it must be intuitive to people who work in ad tech, and bulk changes
across a site must be fast.**

## 2. What this is — and what it isn't

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

## 3. Who uses it, and the vocabulary rule

Users are ad ops and publisher product/ops teams. They already know *VAST*, *wrapper*, *pod*,
*cue point*, *no-fill*, *passback*, *macro*, *timeout*.

**This inverts the StreamAds language rule.** StreamAds is deliberately seller-facing with no
engineering vocabulary. Here, translating ad-tech terms into friendly language slows an expert
down and makes them distrust the tool, because they have to guess which of our words maps to
the thing they know.

So: their words. The raw tag URL visible and editable, not hidden behind a form. A hierarchy
that echoes GAM's own. **Familiar, not simplified.**

## 4. The object model

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

### Link, not copy

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

## 5. Inheritance and ownership

    Network default  →  Publisher (TOI / ET / NBT)  →  Section  →  Content type

Each level may override the one above, and every override displays the value it replaced.
Central AdOps owns the network layer; a publisher's ops team owns their publisher and below.

This is what lets us hand the panel to publisher teams without central AdOps approving every
change — and it is why history and revert must exist **per level**, not as one global log.

Permissions bound the selection set: an NBT operator's "select all" can never reach TOI. Not
hidden — genuinely unselectable.

## 6. The configuration catalogue

**P** = lives in the profile (reusable). **D** = lives with the demand line / placement.

### Break structure
| Setting | Scope |
|---|---|
| Which slots are on: preroll / midroll / postroll | P |
| Midroll cue points — fixed timestamps, every N minutes, or % of duration | P |
| Minimum content length before any ad is served (don't preroll a 25s clip) | P |
| Minimum gap between breaks | P |
| Max breaks per video; max breaks per session | P |
| Ads per break (pod size); max total pod duration | P |

### Timing and interruption
| Setting | Scope |
|---|---|
| **Preroll delay — deferred request**: content plays, the tag isn't called for N seconds. Cuts wasted requests on bouncers. | P |
| **Preroll delay — deferred playback**: call immediately, hold the ad, play at N seconds. Keeps fill, still lets content start. | P |
| Ad **request** timeout — how long we wait for a VAST response | P (per-line override: D) |
| Ad **load** timeout — VAST returned but the media won't start | P |
| **Total waterfall budget** — a wall-clock ceiling on the whole waterfall, independent of per-line timeouts. Six tags at 3s each is 18 seconds of black screen. | P |
| Skippable? Skip offset | P |
| Maximum accepted ad duration — reject a 60s creative in a 15s slot | P |

### Waterfall behaviour
| Setting | Scope |
|---|---|
| Order of lines | D |
| What advances to the next line: no-fill / VAST error / timeout — and which errors are terminal instead | P |
| Wrapper redirect depth limit (GAM tags chain; a runaway wrapper eats the whole budget) | P |
| What happens when the waterfall is exhausted: house promo, blank, or start content | P |

### Frequency and user experience
| Setting | Scope |
|---|---|
| Frequency cap per session / hour / day | P |
| Grace period — no ads in the first N seconds or first video of a session | P |
| Autoplay-muted behaviour; whether the ad inherits the mute state | P |

### Display, in and out of the player
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

### Plumbing passed into the tag
| Setting | Scope |
|---|---|
| Which macros go on the VAST URL — page URL, description URL, content ID, section, device id, consent string, cachebuster | P (per-line additions: D) |
| Viewability / OM SDK on-off | P |
| What to send when consent is absent | P |

### Editorial and emergency
| Setting | Scope |
|---|---|
| Kill switch — ads off for a section, a content ID, or a whole publisher | P |
| Blocked advertiser domains / categories passed through to GAM | P |
| **Scheduled change** — apply the Election profile at 18:00, revert at midnight, automatically | P |

That last one earns its place. "Tweak it in the moment" is really two needs: *change it now*,
and *change it at a known time and put it back*. The second is what stops someone forgetting to
revert on Wednesday morning.

### Live differs — it is not VOD with a flag

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

## 7. Bulk change

Three mechanisms, each right for a different situation:

| Mechanism | Use when | How it feels |
|---|---|---|
| **Edit the profile** | The policy itself changed — "all long-form news defers preroll by 8s" | Change one number, 42 placements move |
| **Select and apply** | An ad-hoc set that doesn't share a profile — "these 12 sections, whatever they're using" | Filter → select all → apply |
| **Find & replace on demand** | A tag changed — "swap this GAM tag for that one everywhere it appears" | Search by URL fragment, preview matches, replace |

The third is the one that gets forgotten and then needed constantly. Tags get re-issued,
partners change, passbacks are deprecated — today that's someone editing forty rows by hand at
11pm.

### The non-negotiable triad

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

## 8. Screens

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

## 9. Safety and trust

The panel's worst day is election night with a nervous operator.

1. **Test before publish** — fire the tag, show the VAST response and what would play.
2. **Draft vs published** — edits stage up; publishing is one deliberate action.
3. **History and revert** — who changed what, when, and one click to put it back.
4. **Guards on the dangerous values** — a 30-second timeout, a 12-ad pod, zero fallback. Same
   spirit as StreamAds' refusals: name the number entered next to the number that's normal.
5. **Crossing a publisher boundary asks once**, even for an admin. Within one publisher, it
   shouldn't nag.

## 10. Measurement — a waterfall you can't measure is tuned blind

Not a reporting engine. The minimum that makes reordering a decision rather than a guess:
**per line, over the last 24h/7d — fill rate, timeout rate, error rate**, shown in the waterfall
editor next to the line it describes.

    2  pubads.g.doubleclick.net/…/sports_preroll     fill 61%   timeout 3%   err 1%
    3  passback.partner.com/vast?…                   fill  2%   timeout 40%  err 6%   ⚠

Line 3 there is costing every viewer four seconds to serve almost nothing. Without the numbers
on the line, nobody finds that.

Consistent with the StreamAds principle: **counted, never invented.** These are measured
counts, labelled with their window, or the panel says there's no data yet.

## 11. Where StreamAds meets this

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

## 12. Open decisions

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

## 13. Scope slices

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
