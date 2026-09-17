# Player Console — FAQ

| | |
|---|---|
| **Status** | For circulation after the demo call (6 Sep 2026) |
| **Owner** | Abhimanyu Aggarwal (Product) |
| **Scope** | The Player Console only (`panel/`). The StreamAds direct-partner platform in `v2/` is a separate product and is not covered by this document. "v1" below means the console's first production release. |
| **Audience** | Player engineering · platform engineering · ad ops · product |
| **Read with** | `panel/ARCHITECTURE.md` (engineering map) · `panel/PRODUCT-LOG.md` (decision record) · `panel/docs/PRODUCT-SCOPE.md` (product overview) · `panel/docs/DECISION-RECORDS.md` (the scope documents, one chapter each) · `panel/test/run.js` (129 rules — the executable spec) |
| **Version** | v5 · 10 Sep 2026 |

**Change log**

| Version | Date | What changed |
|---|---|---|
| v5 | 10 Sep | Header bidding added (Q21b, the node table, Open Item 11) |
| v4 | 7 Sep | Senior PM review applied: section F for ad ops and product, Open Items with owners, serving-layer answers (caching, failure mode, draft preview), migration and roles, prototype vs proposed labelled, one word per concept |
| v3 | 7 Sep | Rewritten in a junior developer's voice, answers as pointers, appendices and glossary added |
| v2 | 7 Sep | Restructured as numbered questions with a header block and index |
| v1 | 6 Sep | First draft |

**How to read this.** Anything marked **[prototype]** is built and tested today. Anything marked **[proposed]** is the agreed production shape that does not exist in the prototype yet. Decisions carry their date; open items carry an owner (see Open Items before the appendices).

---

## Index

| Section | Questions |
|---|---|
| **A · Getting started** | Q1 what is this · Q2 the two screens · Q3 what's an integration · Q4 can surfaces share a setup · Q5 do we deploy this repo · Q6 how do I run it |
| **B · The JSON** | Q7 where does the player get it · Q8 do I change player code · Q9 why did the demo JSON look different · Q10 multiple placements · Q11 what happened to `repeat` · Q12 what happened to `totalImpression` · Q13 timeouts: conf or per break · Q14 where are the `sizes` · Q15 what is `unittpl` / `tpl` · Q16 seconds or milliseconds · Q17 what's still undecided |
| **C · Screens → JSON** | Q18 new integration, when can I fetch it · Q19 which screen writes which node · Q20 the quick decisions · Q21 the waterfall · Q21b header bidding · Q22 custom config vs placement |
| **D · What happens when…** | Q23 break on, no demand · Q24 Save vs Publish · Q25 what does restore do · Q26 can ops delete something live · Q27 "not in GAM" · Q28 refuse vs warn · Q29 two people edit at once · Q30 the limits · Q31 how often does the player fetch · Q32 what if `/live` fails · Q33 can I preview a draft |
| **E · Working with the API** | Q34 what endpoints exist · Q35 what do errors look like · Q36 what do I read first · Q37 what is NOT in v1 · Q38 how do existing surfaces get in · Q39 who can publish |
| **F · For ad ops and product** | Q40 pause mid-rolls tonight · Q41 what "on air" means · Q42 a refusal names another team's object · Q43 will my copy change when the original does · Q44 when will viewers see my change |
| **Open Items** | Owners and due dates for everything not yet decided |
| **Appendices** | 1 API routes · 2 error payloads · 3 key mapping · 4 the original JSON, annotated · 5 glossary |

---

## A · Getting started

### Q1. What is this project, in simple words?

- A console where our teams configure video-player ads, instead of hand-editing config files and raising tickets.
- Product sets up the **player surface** (identity, behaviour, which ad breaks run).
- Ad ops set up the **demand** (which ad units fill each break, in what order).
- The two joined together become the **ads JSON** the player already reads today.

### Q2. There are two screens — Integrations and Ad Setups. Which one do I care about?

- **Integrations** = the player surface. Owned by product. Identity, player settings, break on/off switches, quick decisions.
- **Ad Setups** = the demand. Owned by ad ops. Waterfalls, direct deals, delivery settings.
- One rule decides where any field lives: ops say **what** can fill, the integration says **whether** it runs, player settings say **how** the player behaves.
- If you're building the serving side, you care about both: the served JSON is the join of the two.

### Q3. What exactly is an "integration"? Is it the same as a player?

- One integration = one player **surface**: "TOI Mweb VideoShow", "NBT iOS MiniTV".
- It holds: name, property, platform, domains (web) or package name (app), the player fields, custom configs, break switches, and quick decisions.
- It carries one **API key**, the string the embed sends to fetch its config.
- One surface can have several **placements** (Default, Shorts feed). Those live in its ad setup, not as separate integrations.

### Q4. Can two surfaces share one ad setup?

- **Yes, since 8 Sep.** One integration still asks from exactly one ad setup, but a setup may fill as many integrations as you map it to. (Until 8 Sep the server refused the second holder by name; that refusal is gone.)
- Sharing is a **link, not a copy**: edit the setup once and every surface asking from it moves — no republish per surface, no drift.
- Because of that, every door names the company. The change modal's foot says *also fills "X"*, the confirm screen states *an edit there moves both*, the setup's page lists its holders, deleting one is refused naming them all, and a publish warns *"A", "B" pick this up*.
- Want demand of your very own instead? **Copy & use** takes a full deep copy (placements, ad units, deals, settings) and maps that. Editing the copy never touches the original.
- Duplicating an *integration* still copies its setup rather than linking: a duplicate is a scratch surface, and an experiment must not move demand the original is serving from.
- The other linked thing is the waterfall *inside* one setup (Q21).

### Q5. Is this the final code? Do we deploy this repo?

- **No, we rebuild.** The prototype is the spec, not the product.
- It runs an in-memory mock API so everything is fast and repeatable; there is no database and no persistence. There is a front door and a session since 8 Sep (`/login.html`, `/panel/session`), but **no authentication behind it**: any address shaped like an address gets in, nothing proves it belongs to the person typing it, and no request is checked — the identity provider is mocked, like the GAM directory. Port the door's IA; replace `signIn` with the real exchange and give it refusals of its own.
- What you copy is the **behaviour**: the served JSON, the refusal rules, the publish semantics, the caps.
- The safest way to carry the behaviour over: port the 145 test cases first (Q36).

### Q6. How do I run it locally?

```bash
cd panel
npm install
npm start        # API + web on http://localhost:4200
npm test         # 128 API cases, ~1 second
```

- Polluted the data while exploring? `POST /panel/mock/reset` rebuilds the whole world in milliseconds, **with the same ids**. No restart needed.
- The web app is plain JS, no build step. Scripts load in dependency order from `web/index.html`.

---

## B · The JSON

### Q7. Where does the player get its JSON from?

- One endpoint, published state only **[prototype]**:

```
GET /panel/live/:apiKey   →  200  the published config
                          →  404  never published, or taken off air
```

- **Drafts never appear here.** Saving in the console changes nothing for players (Q24).
- If a break's demand isn't published, that break is simply missing from the answer (Q23).
- In production the same endpoint also takes the placement name (Q10) and sits behind a short cache (Q31).

### Q8. Do I need to change anything in the player code?

- **No.** Settled on the 6 Sep call.
- The production server emits the **exact contract the player reads today**: same keys (`init`, `maxWait`, `timeout`, `delay`, `skip`, `hide`, `slot`…), same milliseconds.
- The console's internal shape is translated at one serialization boundary; the player never sees it.
- Six small encoding details are still open, each with a recommendation (Q17). One player-side behaviour needs confirming: what it does when the config fails to load (Q32).

### Q9. The JSON in the demo looked different from our ads JSON. Why?

- The demo showed the **prototype's internal shape**: different key names, seconds instead of milliseconds, all placements in one payload.
- That shape is internal only. Production translates it to the original contract before it leaves the server.
- Appendix 3 is the full key-to-key mapping; Appendix 4 is our original JSON annotated line by line.

### Q10. We run several placements on one surface. How does the player get the right one?

- The embed **names its placement** in the request, the same way it asks for a config fork by key **[proposed]**:

```
GET /live?key=sak_toi_mweb_…&placement=shorts_feed
```

- The server answers with **one complete ads block** in the original contract for that placement alone.
- Two placements = two requests = two independent blocks. The block's shape never changes.
- Still to fix at kickoff: the exact parameter name, and what the server does with a placement name it doesn't know (recommendation: serve Default and log it). Open Items #10.

### Q11. What happened to `repeat: [10000, 0]`?

- The array shape **does not ship**: the trailing `0` was a magic "no repeat" and the meaning was ambiguous.
- The console stores cadence as one of two explicit shapes:
  - **Interval**: "first at 2:00, then every 3:00" → emits `init: 120000, repeat: [180000]`. Same as today.
  - **Cue points**: "at 4:00, 11:00, 18:00" → emits **one mid pod per position**, same ad units in each, no `repeat`:

```jsonc
{ "type": "mid", "init": 240000,  "impression": 1, "units": [ /* A */ ] },
{ "type": "mid", "init": 660000,  "impression": 1, "units": [ /* A */ ] },
{ "type": "mid", "init": 1080000, "impression": 1, "units": [ /* A */ ] }
```

- The player already reads multiple mid pods, so this costs nothing on the player side.
- Edge case: a mid-roll with two or three pods emits each pod's own cadence separately. A cue-point pod fans out into its positions; an interval pod stays one entry. Cue points from the surface's quick decisions are refused when a mid-roll runs several pods (Q20).

### Q12. What happened to `totalImpression`?

- **Cut on breaks** (pods). Reasoning: a repeating cadence runs until the video ends, and with fixed positions the positions *are* the cap.
- Sending it for a pod is refused by name: *"Break cap is not a setting any more."*
- It **survives on out-stream**, wearing the breaks' own words since 8 Sep: **Total Target Impressions**, typed rather than picked from a fixed set, because a rotation runs all session where a break plays 1, 2 or 3.
- **The out-stream's in-stream switch is BACK (16 Sep), as `hideOnInStreamAd`.** It was cut on 8 Sep on the reasoning that an in-stream ad owns the screen and the player steps the banner aside on its own — true of the players we had then, and not a call the console gets to make for the ones publishers bring now. The row is **Hide during in-stream ads** (Yes/No), the default is `true` (exactly the behaviour the cut assumed), and the answer rides the published payload like every other rotation fact. The **short spelling `hideOnInStream` stays refused by name** — a payload carrying it would otherwise drop on the floor and read as a switch that was set: *"Hide during in-stream is not a setting any more — the switch is back under its full name, 'Hide during in-stream ads'."*
- **The out-stream also gained a repeat count the same day: `perShow`.** How many banners ONE entry in the Schedule is worth, back to back, each held for `hold` — 1 to 10, defaulting to 1. It is deliberately not the session total: `perShow` × the number of show times is what the schedule asks for, `perSession` is what it is aiming at, and the row counts the first against the second ("9 banners a session") and flags the overshoot rather than blocking it. **Named `perShow`, never `repeat`**, because the ads JSON already spends `repeat` on the out-stream's list of moments (Appendix 3, flag B) — which is this console's `times`. On the wire it is the JSON's `impression`, which the contract has always carried pinned at 1.

### Q13. `timeout`, `totalTimeout`, `prefetch`: one value in `conf`, or per break?

- **`conf` wins: one value per placement.** Settled 6 Sep, so the wire keeps the shape the player parses.
- The demo showed them per break. That was finer than the contract can say, so the **console** takes the follow-up (those fields become one answer per placement), not the player. Open Items #5.
- Until that lands, treat per-break values in the prototype as display detail; the boundary emits one per placement.

### Q14. Why are there no `sizes` on GPT units any more?

- The console never asks for sizes. The **display slot owns its size set on the player side**.
- The console names the position (`slot`, from a fixed dropdown); the player knows what fits there.
- Reason: storing pixels in two systems is how they drift apart. Decided 31 Aug.

### Q15. What is `unittpl` / `tpl`? Can ops break our request URLs?

- A **template** = a named request URL with macros, created by ops in the console. An ad unit picks one ("Requests through"); no pick = the provider's standard.
- `unittpl` in the JSON is built automatically from the templates the block's ad units actually chose. Unused templates never appear.
- Ops **cannot break URLs**: macros are validated against a fixed list the player team owns, and an unknown macro is refused at save (*"`[REFERER]` is not a macro the player fills — did you mean `[REFERRER_URL]`?"*).
- Templates resolve **live**: a template edit reaches players without a republish, within the cache window (Q31).

### Q16. Seconds or milliseconds: what's stored, what's sent?

- **People see seconds, the wire gets milliseconds.** No ms anywhere in the UI.
- The console stores almost everything in seconds; the boundary multiplies by 1000 on the way out.
- Exactly two fields are stored in ms already (`tagTimeoutMs`, `waitMs`); they pass through unchanged.
- The conversion lives in **one place on each side** (`MS_FIELDS` in `web/js/util.js`), never scattered through views.

### Q17. What's still not decided on the contract?

Six encodings, each with a recommendation. Owners and dates are in Open Items #1–#4, #12 and #13.

| Flag | Open question | Recommendation |
|---|---|---|
| A | `maxWait` for the "Whole waterfall" hold option | Emit the break's `totalTimeout`; the ladder gives up there anyway |
| B | Out-stream `repeat` array semantics | One `outStream` entry per show time (mirrors Q11) |
| C | Out-stream hold ("each banner holds 20s") has no key | Emit as each unit's `hide` |
| D | The full macro vocabulary | Player team hands over the complete list, owns additions |
| E | Whose sound is quiet while content plays under an ad — no key today (11 Sep) | Emit per unit as `mute`: `"ad"` (default) · `"content"`; the player reads it only when `pause ≠ 1` |
| F | Who bids for ONE unit, where it differs from its break — no key today (11 Sep) | Emit per unit as `headerBidding`, RESOLVED like the break's (`off` · `amazon_prebid` · `amazon` · `prebid`, never `auto`); a pasted-URL unit is always `off` |

Everything else on the contract is settled.

---

## C · Screens → JSON

### Q18. Someone creates a new integration. When can I fetch its JSON?

- **Not until the first Publish.** Create mints the object off air: the key exists, but `GET /live/:key` is 404.
- The flow: create (reviewed field by field) → map an ad setup → set switches and quick decisions → Save (still a draft) → **Publish** (now fetchable).
- Copies carry the player, configs, switches, quick decisions and the setup mapping. Cancelling a create midway leaves nothing behind.

### Q19. Which screen writes which part of the JSON?

| You do this in the console | It becomes this in the JSON |
|---|---|
| Details card (name, property, platform, domains) | Identity. **[proposed]** In production the domain / package gates the request; it does not ride the block. The prototype stores it and does not enforce it. |
| Player fields + custom config rows | The player's own config section; forks asked by key |
| Placement tab in the setup editor | One servable block per placement |
| A break's ladder (primary + waterfall units, drag to order) | `units.primary`, `units.waterfall` |
| The SPECIAL zone in a break (named DIRECT until 7 Sep) | `units.direct`: one deal, tried first |
| Mid-roll pods (up to 3) | Multiple `mid` pods |
| Delivery settings rows | `conf` values + pod timing (`init`, `impression`) |
| `Header bidding` on a slot, on an integration's break, or the setup's own answer | the break's resolved `headerBidding`: `off` · `amazon_prebid` · `amazon` · `prebid` — **never `auto`**, which is a console-side inheritance (see Q21b) |
| An ad unit's settings (the block's second tier) | That unit's `pause`, `tpl`, and for banners `slot`, `delay`, `skip`, `hide` |
| The out-stream tab | `outStream` |

- The three banner clocks all count **from the moment the banner appears**: `delay` = appears after, `skip` = close button after, `hide` = auto-hides after.
- Video units never carry the clocks; `delay` is always `0` for them.

### Q20. What are the "quick decisions" on the integration page?

- The **Ad behaviour** section of an integration: the surface's own per-break answers. Who is asked and in what order, waterfall depth, Direct on/off, pre-roll start, where mid-roll breaks fall.
- Stored **sparse**, only what the surface actually decided. Drop a decision and the break follows the setup again.
- Resolved at serve time over **whatever the setup holds that day**: an ad unit ops add next week automatically joins the walk.
- Hard boundaries: a quick decision can order and cut the waterfall but can **never move an ad unit between tiers**, and cue points are refused when a mid-roll runs several pods (one cadence can't stand for several).

### Q21. What is the waterfall?

- One indirect ladder at the head of a setup that any break can **connect** instead of holding its own ad units. (It was called the *shared* waterfall until 7 Sep; the setup has exactly one, so the qualifier went.)
- It's a **link, not a copy**: edit it once, every break connected to it moves together.
- You connect it in one place: **Apply on ad slots** at the head of the setup opens a grid — ad sections down the side, `Pre-roll · Pod 1 · Pod 2 · Pod 3 · Post-roll` across the top — and you tick the slots it should serve. The same grid takes it off them.
- A break can hold **both**: its AD SOURCES zone carries a `Waterfall │ Custom` switch, and the answer you switch away from keeps every ad unit it had, switched off, one click from coming back. Nothing is deleted by switching — only **Clear** deletes, and it says what it will take.
- On the wire it's invisible: the ad units are materialized into each connected break at save, so serving code reads one truth.
- Fails closed both ways: you can't gut a waterfall a live connected break stands on (refused, names the surface), and a connected break over an empty waterfall counts as "no demand".

### Q21b. What is header bidding here, and what does the player get?

- **One answer per ad setup** — `Off` · `Amazon+Prebid` · `Amazon` · `Prebid` — set in the
  `Header bidding` row of the setup's **Global settings** section, right above the waterfall
  (added 10 Sep; the two share one folded head since 11 Sep).
- **Every ad slot answers too**, as the first row of its DELIVERY SETTINGS: `Auto │ Off │ Custom`,
  and while Custom stands a second seg with `Amazon+Prebid │ Amazon │ Prebid`. `Auto` is the default
  and means *borrow the setup's answer* (named beside the seg), so one act at the head reaches every
  slot that has not dissented. Mid-roll pods answer per pod; the out-stream is included (a banner
  slot is what Prebid was built for).
- **Every ad unit answers too** (11 Sep), one tier down in the same grammar, in its own settings:
  `Auto │ Off │ Custom` + partners. `Auto` borrows the BREAK's served answer (named beside it), so
  one act at the head still reaches every unit that has not dissented. A pasted-URL (CAN) unit
  makes no GAM request for bidders to decorate, so its row greys with that reason and a named
  answer is refused.
- **It is a link, not a copy.** A borrowing slot stores `auto`, so changing the setup's answer
  changes what every borrowing slot runs, and a dissenting slot keeps its own. `auto` is refused as
  the setup's own answer — the thing being borrowed cannot borrow.
- **A surface can answer it too** (11 Sep): `Header bidding` is a quick decision on the
  integration's Ad behaviour section and in the bulk sheet — `As set up │ Off │ Custom` — stored
  sparse on its drive and resolved over the ad setup, so absence means *follow the setup*. It is
  the out-stream's only quick decision.
- **The player is handed it RESOLVED**, on each break's `behaviour`/`conf` and (11 Sep) on every
  walk entry as the unit's own `headerBidding`: the console does the join, so the client never sees
  `auto` and never has to read two places to know who bids.
  It rides the publish plane like everything else — the draft answer reaches nobody until Publish.
- **[proposed]** The panel says WHO bids, not HOW: bidder ids, slot params, price granularity and
  the auction timeout live in the player's own Amazon/Prebid wiring. If the player team needs any of
  those per slot, that is a new field and a new decision — it is not implied by this one.

### Q22. Custom player config vs placement: I keep mixing them up.

- **Placement** = demand-side. A named spot in the surface (Default, Shorts feed) with its own breaks and waterfalls. Decides *what ads run where*.
- **Custom config** = player-side. A named set of OVERRIDES a page asks for by key. It may override ANY of the player's 29 fields and carries only the ones it overrides; everything else follows the default live. Decides *how the player behaves* for that key.
- **What stops a bad override?** The same rules as the default — a config's overrides are laid over the default and run through the one normalizer, so a bad hex, a visibility threshold under 10 or an unknown control name is refused by name exactly as it would be on the default. And VISIBILITY: every override is a fact on the config's card, an accent row in its sheet, a count on its section (`3 own`), and a line in the change review. Measurement overrides are legal and are named like any other; the review is where a wrong one is caught.
- **How is one made?** The `New config` card opens a sheet: the key where the title will be, then the three sections. Every row starts at the default's answer, receded; change the ones this config should differ on. Nothing is created until the key passes the same three rules the server applies.
- **Where is it edited?** Its card on the integration page opens the same sheet. A receded row follows the default; change it and it is the config's own, with `Follow default` as the way back. The three sections show the settings a surface is usually set up with, and a counted door in each opens the rest. Save and Publish are unchanged.
- Both are asked for by name in the request; they answer different questions.

---

## D · What happens when…

### Q23. A break is switched on but ops haven't published demand for it. What does the player see?

- **Nothing. The break is missing from the JSON entirely.**
- The publish step refuses the states that would cause this, naming each dark break or surface.
- The serializer's omission is the safety net under those refusals.
- Worst case is always "a surface that asks for nothing", never "a surface running a half-built walk".

### Q24. When do my changes actually go live? What's Save vs Publish?

- **Save = draft.** Players see nothing.
- **Publish = live.** Stamps an immutable numbered version and swaps what `/live` serves.
- Integration and setup publish **separately** and version independently.
- One deliberate exception: **templates resolve live**. A template edit or on/off flip reaches players without a republish, and the UI says so right where you do it.
- Everything else (player fields, configs, switches, quick decisions, waterfalls) waits for Publish. In production, add the cache window on top (Q31).

### Q25. What does restoring an old version do? Can I lose data?

- Restore **publishes the old content as a new version**. History is append-only, nothing rewinds, so every restore is itself undoable.
- The restore screen shows the diff against **what is on air now**, not what that version changed back then.
- The only thing it will block on: unpublished draft work the restore would overwrite. It counts it and warns before anything happens.
- History reads back with provenance (`v5 · from v2`) plus an optional note per version, like a commit message.

### Q26. Can ops delete something a live surface depends on?

- **No.** Everything in use refuses deletion, and the refusal names or counts its users:
  - a template carrying tags → *"“GAM_2” carries 4 tags and cannot be deleted"*
  - a setup filling a surface → refused, names the surface
  - the last live demand behind a switched-on break → refused
- A live integration can't be deleted either. It must be **taken off air first**, so traffic stops on purpose, not by surprise.

### Q27. I typed a GAM unit path and it shows "not in GAM". Did I break something?

- **No, that's expected.** The synced directory is a convenience, not a gate.
- A well-formed path not yet in our directory copy is accepted and just wears the mark; the next sync clears it automatically.
- The only hard check on a typed unit is its **shape**: network code, then path segments (`/7176/toi/mweb/videoshow/preroll`).
- If search finds nothing, a "Sync ad units from GAM" action appears inside the search itself and runs in place (about 10–20s; results refresh when it lands).

### Q28. When does the API refuse, and when does it just warn?

- **Refusals are walls** (the save fails): bad or out-of-range values, cut fields, caps exceeded, deleting things in use, publishes that would darken a live surface, a second display unit in one break, unknown macros.
- **Warnings are levers** (the save goes through): heavy but legal configurations, always with counted arithmetic, e.g. *"4 tries × 2.5s is a 10s wait before anything plays"*.
- Every refusal names the thing and the numbers: what was found, next to what is allowed.
- Nothing is ever silently dropped or defaulted on write. A dead field is refused **by name**, with where its answer lives now.

### Q29. Two people edit the same object at the same time. What happens?

- In the prototype: **last save wins.** There's no locking or version check on Save.
- Known gap, owned for production (Open Items #6). Optimistic concurrency on a draft revision is the natural fix.
- The blast radius today is bounded: Save only touches drafts (players unaffected), and every write ends on the change review, which reads back the full diff before it lands.

### Q30. What are the limits?

| Thing | Cap |
|---|---|
| Placements per setup | 5 |
| Mid-roll pods per placement | 3 |
| Ad units per ladder | 10 (1 primary + 9 waterfall units) |
| Display units per break | 1 |
| Direct deals per break or pod | 1 deal, no session cap |
| Out-stream rotation | 5 ad units |
| Custom configs per integration | 6 |
| Config / template key | one word, `[A-Za-z0-9_-]{1,24}`, unique, never `default` |
| Passive volume | 0–100 on the default; a custom config may override it |
| Fields a custom config may override | any of the 29 — stored sparse, resolved live |
| Controls (which the viewer gets) | from a fixed vocabulary the player team owns; stored as the ones HIDDEN |
| Pause below visibility | 0 (off) or 10–100 — 1–9 refused by name |

- Every cap refuses by name, counting what was found against what's allowed: *"A mid-roll holds at most 3 break groups (got 4)."*

### Q31. How often does the player fetch its config? Is `/live` cached?

- **Once per page load, behind a short edge cache** **[proposed, decided 7 Sep]**.
- `/live` is cached at the CDN for about **60 seconds**. Publish **purges** that key's cache, so a publish is visible on the next page load.
- Consequence for Q15 and Q24: a template edit reaches players **within about a minute**, not literally the next request. The console copy should say "within a minute".
- Exact TTL and the purge mechanism are confirmed at kickoff (Open Items #7).

### Q32. If `/live` is down, slow, or returns 404, what does the player do?

- **The video plays without ads** **[proposed, decided 7 Sep]**. Fail open: an unreachable config means no ad breaks for that session.
- Viewer experience is protected; revenue for the outage is lost silently, so the serving tier needs alerting on `/live` error rates.
- 404 is a legitimate answer (never published, or taken off air) and gets the same treatment: play, no ads.
- The player team confirms the player already behaves this way, or builds it (Open Items #8).

### Q33. Can I see the JSON my draft would produce before I publish?

- **Yes, in v1** **[proposed, decided 7 Sep]**. The prototype has no draft preview today; `versions/:v/preview` is a restore diff, not a served-JSON preview.
- Proposed shape: a "Preview JSON" door on the change review that shows the block the current draft would serve, per placement, in the original contract.
- Until it's built, the resolved-waterfall panel in the editor is the closest thing: it runs the same walk code the server uses, so what it shows is what would serve.
- Shape and endpoint are designed before build (Open Items #9).

---

## E · Working with the API

### Q34. What endpoints exist?

- 34 routes, all under `/panel`. The full table is **Appendix 1**.
- The pattern to remember:
  - every object type gets the same verbs: list · read · create · patch · duplicate · delete
  - the publish plane is the same 5 routes for integrations and setups: `publish` · `unpublish` · `versions` · `versions/:v/preview` · `versions/:v/restore`
  - serving is one read-only route: `GET /live/:apiKey`
  - `POST /mock/reset` rebuilds the world with the same ids, so demos and tests stay repeatable

### Q35. What does an error response look like?

- Always the same envelope: HTTP status for the class, a stable `error` code, a human `message` safe to show verbatim. Real payloads in **Appendix 2**.
- Field validation adds an `errors` array naming each field, which is what lets the UI put the reason exactly where the mistake was made:

```json
{
  "error": "invalid_rules",
  "message": "Ad behaviour was refused",
  "errors": [
    { "field": "deferSec", "message": "deferSec must be a whole number between 3 and 60 (got 300)" }
  ]
}
```

- Status classes: `400` invalid input · `404` not found · `409` in use or live conflict.

### Q36. Where are the exact rules written? What do I read first?

1. **`test/run.js`**: 128 cases over real HTTP. If a behaviour matters, a test names it. Port these into the production suite first.
2. **`ARCHITECTURE.md`**: the engineering map. Directory layout, the model, the request flow, the two planes, web conventions, how-tos, and the known production gaps.
3. **`PRODUCT-LOG.md`**: every decision with its date and reasoning, including the reversed ones and why. The older scope documents (e.g. `AD-JSON-SCOPE.md`) live as chapters in `docs/DECISION-RECORDS.md`.
4. **`docs/PRODUCT-SCOPE.md`**: the product overview with the sharp edges called out (seconds vs ms, the GAM sync, the publish seam).
5. This FAQ sits on top and cites into all four.

### Q37. What is NOT in v1? (So I don't build it.)

- The page's own standing display units: `adjacent*` stays dead. The console places only banners **it** serves.
- Banner `sizes`: player-side, per slot (Q14).
- A mid-way break cap: `totalImpression` on pods (Q12).
- Per-pod quick decisions from the surface: the mid-roll switch covers all pods.
- Pod duration enforcement (`breakSec`, `overrun`): a pod plays its count, ads run their length.
- The squeeze-back as its own slot: a banner in a break is a waterfall unit; the idle player is out-stream.
- **Roles and permissions** (Q39), a **cross-object audit log** (Q39), and a **shadow period** before cutover (Q38): decided out of v1 on 7 Sep, each with its reason under its question.
- Each of the contract fields above is refused **by name** if sent, with the message saying where the answer lives now.

### Q38. How do our existing surfaces get into the console?

- **One surface at a time, by hand, then a per-surface cutover.** There is no bulk importer in v1.
- For each surface: product creates the integration (or copies a similar one), ops build its demand in the setup editor (or copy a similar setup), both publish, and the embed switches to the console's API key and placement name.
- **No shadow period in v1** (decided 7 Sep): the safeguards are the change review before every publish, the resolved-waterfall panel (and draft preview once built, Q33), and one-click restore if a cutover goes wrong.
- v1 is done when every existing surface is served from the console and no hand-edited config is still read by a player.

### Q39. Who is allowed to publish? Is it logged?

- **In v1, anyone with console access can edit and publish either room.** Role-based permissions (ops cannot flip break switches, product cannot edit waterfalls) are **not in v1**, decided 7 Sep: the two-rooms split is a product boundary today, not an enforced one.
- **No approval step.** Publish is deliberate (its own button, after the change review) but not gated on a second person.
- **Logging is per object**: every version records who published it, when, and an optional note; the change review shows what changed. A cross-object audit log queryable by user is **not in v1**.
- Both are candidates for a later release of the console, once real usage shows the need.

---

## F · For ad ops and product

### Q40. Mid-rolls are hurting a surface tonight. How do I pause them fast?

- **One surface:** open the integration → Ad behaviour → Mid-roll tab → switch the break off → Publish (Publish folds the save in). Mid-rolls stop on the next page load, within the cache window (Q31).
- **Many surfaces:** select them in the Integrations list → **Ad behaviour** → switch Mid-roll off → Review → Apply. That writes drafts on every selected surface; then select them again → **Publish** in the bulk bar.
- The demand is untouched. Ops' waterfall stays exactly as it was; switching the break back on restores everything.
- Bulk never silently includes a surface the change can't apply to: it is skipped and named.

### Q41. What does "on air" / "off air" mean for me?

- **On air** = published and serving. The version number on the list (`● v3`) is what players receive right now.
- **Off air** = taken down deliberately; `/live` answers 404 and the player runs without ads (Q32).
- **Unpublished** = never published yet. **`N unpublished`** under a status = draft changes sitting behind the live version, not yet visible to viewers.
- A surface with a break switched **off** is still on air; only that break is missing from its JSON.

### Q42. A refusal names an object another team owns. What do I do?

- Read the message: it names the holder and what stands in the way, e.g. *"“TOI VideoShow demand” fills TOI Mweb VideoShow — take that surface down first"*, or *"1 live surface fills their mid-roll from this — switch them off first"*.
- **The console never overrides another team's live state.** You talk to the named owner; they switch off or take down, then your action goes through.
- If you only need the object for yourself, take the **copy** the console offers instead (Q43).

### Q43. I copied a setup. If the original changes later, does mine change too?

- **No.** A copy is a deep copy; the two are independent from the moment of creation, both ways.
- The **one** linked thing in the product is the waterfall inside one setup (Q21): breaks that connect to it move together when it is edited. The console tells you which breaks are connected before you edit it.
- If you want breaks across a setup to move together, connect them to the waterfall. If you want independence, copy.

### Q44. I published. When will viewers actually see the change?

- **On the next page load, within about a minute** (Q31). Publish purges the cache for that surface; sessions already playing keep the config they loaded.
- Templates are the exception in the other direction: a template edit needs **no publish** and reaches players within the same minute.
- If viewers still see the old behaviour after that, the first check is which **version** the list says is on air, and whether the change is sitting as `N unpublished`.

---

## Open Items

Everything in this document that is agreed in direction but not yet closed. Owners are roles until kickoff assigns names. Tracking: Jira tickets raised at kickoff and back-linked here.

| # | Item | Owner | Due | Where it's mentioned |
|---|---|---|---|---|
| 1 | Flag A: `maxWait` encoding for "Whole waterfall" | Player team lead | Kickoff | Q17 |
| 2 | Flag B: out-stream `repeat` semantics | Player team lead | Kickoff | Q17 |
| 3 | Flag C: out-stream hold → `hide` | Player team lead | Kickoff | Q17 |
| 4 | Flag D: complete macro vocabulary handed over | Player team lead | Before the first template goes live | Q15, Q17 |
| 5 | Console: `timeout` / `totalTimeout` / `prefetch` become one answer per placement | Abhimanyu Aggarwal | Before build starts | Q13 |
| 6 | Optimistic concurrency on Save | Platform eng lead | Kickoff | Q29 |
| 7 | CDN TTL (~60s) and purge-on-publish: confirm numbers and mechanism | Platform eng lead | Kickoff | Q31 |
| 8 | Player plays without ads when `/live` fails: confirm or build | Player team lead | Kickoff | Q32 |
| 9 | Draft JSON preview: design the door and endpoint | Platform eng lead + Abhimanyu Aggarwal | Design before build | Q33 |
| 10 | Placement parameter name, and behaviour on an unknown placement | Player team lead + Platform eng lead | Kickoff | Q10 |
| 11 | Header bidding: the player-side Amazon/Prebid wiring the console's answer switches on — bidder ids, slot params, auction timeout — and whether any of it must be per slot | Player team lead + Abhimanyu Aggarwal | Kickoff | Q21b |
| 12 | Flag E: per-unit `mute` (Ad / Content) while content plays | Player team lead | Kickoff | Q17 |
| 13 | Flag F: per-unit `headerBidding`, resolved, on every walk entry | Player team lead | Kickoff | Q17, Q21b |

---

## Appendix 1 — API routes

`{kind}` = `keys` (integrations) or `setups`. All under `/panel`. **[prototype]**

| Area | Routes |
|---|---|
| Integrations | `GET /keys` · `GET /keys/:id` · `POST /keys` · `PATCH /keys/:id` · `PATCH /keys/:id/player` · `POST /keys/:id/duplicate` · `POST /keys/bulk` · `DELETE /keys/:id` |
| Ad setups | `GET /setups` · `GET /setups/:id` · `POST /setups` · `PATCH /setups/:id` · `PATCH /setups/:id/sections/:index/behaviour` · `POST /setups/:id/duplicate` · `DELETE /setups/:id` |
| Ad tags | `GET /tags` · `GET /tags/:id` · `POST /tags` · `PATCH /tags/:id` · `DELETE /tags/:id` |
| Ad unit templates | `GET /templates` · `POST /templates` · `PATCH /templates/:id` · `DELETE /templates/:id` |
| GAM directory | `GET /gam/units` · `POST /gam/sync` |
| Publish plane | `POST /{kind}/:id/publish` · `POST /{kind}/:id/unpublish` · `GET /{kind}/:id/versions` · `GET /{kind}/:id/versions/:v/preview` · `POST /{kind}/:id/versions/:v/restore` |
| Serving | `GET /live/:apiKey` |
| Meta / mock | `GET /meta` · `POST /mock/reset` |

Bulk actions on `POST /keys/bulk`: `publish` · `unpublish` · `slotOn` · `slotOff` · `playerFields` · `configFields` (custom configs, one edit per config) · the ad-behaviour levers.

## Appendix 2 — Error payloads

Field validation, `400`:

```json
{
  "error": "invalid_rules",
  "message": "Ad behaviour was refused",
  "errors": [
    { "field": "deferSec", "message": "deferSec must be a whole number between 3 and 60 (got 300)" },
    { "field": "wait",     "message": "wait must be one of immediate, chain, timed (got forever)" }
  ]
}
```

In use, `409`:

```json
{
  "error": "template_in_use",
  "message": "“GAM_2” carries 4 tags and cannot be deleted."
}
```

Live guard, `409`:

```json
{
  "error": "key_live",
  "message": "“TOI Mweb VideoShow” is on air — take it down first, so traffic stops on purpose, not by surprise"
}
```

Not found, `404`: same envelope, `"error": "not_found"`.

## Appendix 3 — Key mapping, original ↔ console

Seconds ×1000 at the boundary; `tagTimeoutMs` and `waitMs` are already ms and pass through.

**`conf`**

| Original key | Console control | Wire rule |
|---|---|---|
| `unittpl` | Ad unit templates (setup editor head) | Map of templates this block's ad units chose, switched-on only |
| `timeout` | Request timeout | As-is (ms) · one per placement (Q13) |
| `totalTimeout` | Total timeout | `fillTimeoutSec × 1000` · one per placement |
| `prefetch` | Prefetch (mid/post) | `prefetchSec × 1000` · one per placement |
| `minPreRenderTime` | Min content playback (pre-roll) | `minContentSec × 1000` |
| `maxWait` | Max wait / "Hold video for the ad" | No hold → `0` · Timed → `waitMs` · Whole waterfall → flag A |
| `expandInMiniTVForAds` | Expand MiniTV for ads (per config) | `expandInMini` of the config asked by |

**`pod[]`**

| Original key | Console control | Wire rule |
|---|---|---|
| `type` | Break tabs | `pre` / `mid` / `post` |
| `init` (pre) | Start offset (quick decision) | start → `0` · defer → `deferSec × 1000` |
| `init` + `repeat` (mid) | Cue points, or first + every | interval: `firstAt×1000` + `[every×1000]` · cue points: one pod per position (Q11) |
| `impression` | Impressions per break | `podAds`, as-is |
| `totalImpression` | Cut on breaks (Q12) | never emitted for pods |
| `units.direct` | SPECIAL zone | one-entry array; omitted when empty or switched off |
| `units.primary` | The ladder's first ad unit | the resolved walk's first entry |
| `units.waterfall` | The waterfall units | rest of the walk: partner order applied, depth cut, off units removed |

**Per ad unit**

| Original key | Console control | Wire rule |
|---|---|---|
| `adsdk` | Provider chip (IMA / GPT / CAN / Slike) | uppercased provider |
| `unit.id` | The ad unit (picked or typed) | the tag's value, as-is |
| `unit.tpl` | Requests through (the unit's settings) | template name when chosen and on; otherwise omitted |
| `unit.sizes` | Not authored (Q14) | never emitted; slot owns sizes player-side |
| `delay` | Appears after (banners) | `showAfterSec × 1000` · always `0` for video |
| `pause` | Content pause: Yes / No / Auto — the parent of `slot`, `mute` and `skip`, which are asked only while content plays (No, Auto) | `yes → 1` · `no → 0` · `size → -1` |
| `skip` | Close button (only while content plays; not shown when pause = Yes) | `closeAfterSec × 1000` |
| `hide` | Auto-hides after | `hideAfterSec × 1000` |
| `slot` | Ad placement (only while content plays; not shown when pause = Yes) | as-is |
| (no key) | **Mute** — Ad / Content: whose sound is quiet while both render (only while content plays) | flag E: recommend a per-unit `mute`: `"ad"` · `"content"`; read only when `pause ≠ 1` |
| (no key) | **Header bidding** on the unit — Auto (the break's) / Off / Custom + partners; greyed on a pasted URL | flag F: per-unit `headerBidding`, resolved — the unit's own, else the break's; `off` on a pasted URL |

**`outStream[]`**

| Original key | Console control | Wire rule |
|---|---|---|
| `init` + `repeat` | Shows at (list of moments) | flag B: recommend one entry per show time — this console's `times` |
| `totalImpression` | **Total Target Impressions** (typed) | `perSession`, as-is |
| `impression` | **Repeats per show** (typed, 1–10) | `perShow` — was pinned at `1`, set from 16 Sep (Q12) |
| `hideOnInStream` | **Hide during in-stream ads** (Yes/No, default Yes) | `hideOnInStreamAd`; the short key is refused by name (Q12) |
| (no key) | Each holds [n] sec | flag C: recommend emitting as each unit's `hide` |

## Appendix 4 — The original ads JSON, annotated

Each key points to the question that covers it.

```js
ads: {
  conf: {
    unittpl: {                                  // Q15 — built from chosen templates
      GAM:   "https://ads.slike.example/vast?cb=[CACHEBUSTER]&ref=[REFERRER_URL]",
      GAM_1: "https://ads.slike.example/vast?cb=[CACHEBUSTER]&ref=[REFERRER_URL]",
      GAM_2: "https://ads.slike.example/vast?cb=[CACHEBUSTER]&ref=[REFERRER_URL]",
    },
    timeout: 8000,             // Q13 — Request timeout, one per placement
    totalTimeout: 20000,       // Q13 — Total timeout
    prefetch: 5000,            // Q13 — Prefetch (mid/post only in the console)
    minPreRenderTime: 1000,    // Q19 — pre-roll's Min content playback
    maxWait: 0,                // Q17 flag A — Max wait / hold
    expandInMiniTVForAds: true // Q22 — per player config now
  },
  pod: [
    {
      type: "pre",
      init: 0,                 // Q20 — Start offset (quick decision)
      impression: 2,           // Q19 — Impressions per break
      units: {
        direct: [                              // Q19 — the SPECIAL zone
          { adsdk: "IMA", unit: { id: "", tpl: "" }, delay: 0, pause: 1 }
        ],
        primary: [                             // Q19 — the ladder's first ad unit
          { adsdk: "IMA", unit: { id: "", tpl: "" }, delay: 0, pause: 1 }
        ],
        waterfall: [                           // Q19 — the waterfall units
          { adsdk: "IMA", unit: { id: "", tpl: "" }, delay: 0, pause: 1 },
          {
            adsdk: "GPT",
            unit: { id: "", tpl: "", sizes: [[640, 90], [300, 250]] }, // Q14 — sizes not emitted
            delay: 1000,       // Q19 — Appears after
            pause: 0,          // Q19 — 1 yes · 0 no · -1 by player size
            skip: 5000,        // Q19 — Close button after
            hide: 10000,       // Q19 — Auto-hides after
            slot: "L_50"       // Q19 — Display slot, fixed vocabulary
          }
        ]
      }
    },
    {
      type: "mid",
      init: 30000,             // Q11 — cadence
      impression: 1,
      repeat: [10000, 0],      // Q11 — the array shape does not ship
      totalImpression: 2,      // Q12 — cut on breaks
      units: [ /* … */ ]
    },
    {
      type: "mid",
      init: 120000,
      impression: 1,
      totalImpression: 5,      // Q12
      repeat: [180000],        // Q11 — interval: init + one interval
      units: [ /* … */ ]
    }
  ],
  outStream: [
    {
      init: 0,
      impression: 1,           // Q12 — Repeats per show (`perShow`), no longer pinned at 1
      totalImpression: 2,      // Q12 — Total Target Impressions (survives here)
      repeat: [30000, 90000],  // Q17 flag B — the moments list (this console's `times`)
      hideOnInStream: true,    // Q12 — back 16 Sep as `hideOnInStreamAd`
      units: [
        {
          slot: "PLAYER_BOTTOM",
          adsdk: "GPT",
          unit: { id: "", tpl: "", sizes: [[640, 90], [300, 250]] },
          delay: 1000
        }
      ]
    }
  ]
}
```

## Appendix 5 — Glossary

One word per concept. Where the code uses a different name, it is given in brackets.

| Word | Meaning |
|---|---|
| **Integration** | One player surface. Product's object. Carries the API key. |
| **Surface** | The same thing, seen from the player's side: one place a player is embedded. |
| **Ad setup** | A surface's demand. Ops' object. An integration has one; a setup may fill several (8 Sep). |
| **Placement** | A named spot inside a surface (Default, Shorts feed). What the embed asks for. |
| **Break** | Pre-roll, mid-roll, post-roll, or out-stream. Each has a switch on the integration. |
| **Pod** | One mid-roll break group: its own cadence, ladder and deal. Up to 3. |
| **Ladder** | A break's ordered ad units: the primary, then the waterfall. |
| **Primary** | The ladder's first ad unit. A fixed position. |
| **Waterfall** | The ordered ad units tried after the primary. The only order anyone rearranges. |
| **Ad unit** (code: rung, tag) | One block in a ladder: a GAM path or a CAN URL, its counted fact line, and its own settings. |
| **Walk** | The resolved order a break asks its ad units. What the player actually receives. |
| **Quick decisions** (code: drive) | The surface's sparse per-break overrides in Ad behaviour, resolved over the setup at serve time. |
| **Direct** | One deal per break or pod, no session cap, tried before everything else. |
| **Template** | A named macro request URL, global, picked per ad unit. |
| **Waterfall** | One ladder at the head of a setup that breaks can connect to (called the *shared* waterfall until 7 Sep). The product's only link. A break's own ladder is its **custom** waterfall. |
| **Copy** (code: photocopy) | A deep copy that never links back to its source. |
| **On air / off air** | Published and serving / unpublished (the live endpoint answers 404). |
| **Original contract** | The ads JSON the player reads today. What production emits. |

---

*Maintained with the code: when behaviour changes, this file changes with `PRODUCT-LOG.md` and
`docs/PRODUCT-SCOPE.md`. Doubts raised on calls get added as new numbered questions. Open Items
get their Jira links the day the tickets exist.*
