# Player Config v2 — a proposal

**Status: v1 not approved.** The prototype in `player/` did its job — it found the shape of the
problem — and what it found is that the screens were designed around the wrong thing. This is what
I would build instead, and what I would cut to get there.

Written 14 Aug 2026, after four attempts to make the v1 screens readable. Four rearrangements of
the same page is a signal about the page, not about the arrangement.

---

## 1. The verdict

**v1 is a good prototype of the object model and a poor prototype of the product.**

The model held up under every change we threw at it — link-not-copy, change sets, policy separated
from demand. The screens did not, because they were built around **the data model** (placements,
positions, lines, companions, profiles, overrides) rather than around **what someone came to do**.

And one gap disqualifies it on its own: **there is no delivery data in it.** Not one counted
number. So every decision it asks an operator to make is blind.

---

## 2. What v1 got wrong

### 2.1 A config panel with no numbers is a text editor with opinions

Fill rate, timeout rate, latency, revenue — none of it exists. An operator looks at a waterfall and
cannot answer the only question that matters: *is this line earning anything?*

The "Worth a look" panel is arithmetic on the configuration, which is honest but thin. A yield
manager reads *"one line means one chance to fill"* and asks "so what **is** the fill rate?" — and
the tool has no answer. Everything downstream of that is guesswork with a nice interface.

**This is the single most important thing to fix, and it changes the product rather than improving
it.** A waterfall line with a number beside it stops being a form field and becomes a decision.

### 2.2 The screens are organised by object, not by task

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

### 2.3 Seven concepts before you have done anything

Placements, positions, lines, companions, profiles, overrides, change sets. Each one was added
because it is real — and each was added to the same screen instead of being sequenced.

**That is my error, not a change of requirements.** The right answer to "can a break play a video
then a display?" was *"yes, and it belongs in v2"*, not another section on an already-full page.

### 2.4 Everything typed is live

`draft` / `published` exists in the data model and never appears in the interface. Every keystroke
is live immediately across three publishers. For a revenue-carrying tool that is not a gap, it is a
defect.

---

## 3. What survives

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

## 4. The five jobs, and the screens that serve them

The product should have one screen per job, not one screen per object.

### Today *(new — replaces the 33-row table as home)*

Not an inventory. A list of **exceptions**, in the order they matter:

- **Off right now** — every active kill switch, with who set it, why, and how long ago
- **Changed in the last 24 hours** — each change set, with Revert on it
- **Underperforming** — lines whose fill has dropped against their own last 7 days *(needs §5)*
- **Due** — scheduled changes about to apply or about to revert
- **Search**, front and centre, because half of all visits are "find this one thing"

If nothing is wrong, this screen is nearly empty and says so. That is the point.

### Change *(new — bulk as a front door)*

The biggest structural fix. **A change becomes a first-class object you compose**, rather than a
mode you enter by selecting rows:

    What        →  Preroll delay = Content first, hold the ad, 8s
    Where       →  publisher NBT · section /news/* · slot preroll     (42 placements)
    When        →  now  ·  or from 18:00 until midnight, then put it back
    Preview     →  the diff: every placement, old value, new value, who is skipped and why
    Apply       →  one change set, one Revert

One flow covers single edits, bulk edits, immediate and scheduled. It is also the natural home for
**find and replace on a tag**, which is the operation that gets forgotten and then needed weekly.

### Placements

Still needed — browsing and finding is real. But **read-first**: the row says what the placement
does, not what fields it has. Filters that match how people think: *"everything using this GAM
tag"*, *"everything with refresh on"*, *"everything overriding its policy"* — not "linear vs
display".

### A placement

**Read-only by default, with an Edit button.** Roughly 90% of visits are "check what this does".
The page shows the plain-language read, the strip, the numbers per line, and the policy it runs on.
Editing is a deliberate act, and it stages into a draft.

### Policies · History

Broadly as they are. Policies keeps its blast-radius view; History keeps change sets and Revert.

---

## 5. The data layer — the missing half

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

## 6. Scope

The instinct to cut hard is the main thing I got wrong the first time.

### v1 — one surface, one loop, end to end

**Video only. One publisher.** Prove the loop — *see a number → make a change → watch the number
move* — on the smallest surface that can carry it.

- Placement · Policy · **one** waterfall per placement
- Fill / timeout / error per line, counted
- Today, Change, Placements, A placement, History
- Kill switch, draft vs published, change sets with Revert

**Deliberately not in v1:** composed breaks (positions), companions, display slots, sticky and
interstitial, scheduled changes, the overlay surface.

### v2 — the rest of the surfaces

Display slots and their loading/refresh behaviour · composed breaks · companions · scheduled
changes · find-and-replace across tags · CSV in and out.

### Later

Per-line revenue joined from GAM · overlay/non-linear · live and SSAI · StreamAds tag emission with
sold-line labelling.

---

## 7. What to validate before building any of it

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

## 8. Open decisions

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

## 9. What happens to the v1 code

Keep `player/api/` — the model, the catalogue, the change sets and the mock world are all reusable,
and the settings catalogue is the accumulated thinking about what this thing configures.

Rebuild `player/web/` around the five screens above. The API seam (`web/js/api.js`) means the
screens can be replaced without touching the server.

**Nothing here is built. This is a proposal to react to.**
