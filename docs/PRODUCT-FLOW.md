# Player Console — the product as a flow

[PRODUCT-SCOPE.md](PRODUCT-SCOPE.md) says what each surface **is** and why it is shaped that
way. This document says what **happens**: the journeys the console exists to carry, in the
order a person meets them — what they do, what the console does back, and where it refuses.
Same product, same scope, read along the other axis. Nothing here is new scope, and where the
two disagree the scope document is the one to fix.

Read this first if you are new to the product, if you are demoing it, or if you are about to
rebuild one of these journeys somewhere else.

## The whole thing in one diagram

```
   THE FRONT DOOR  ── sign in ──▶  the console  ── three rooms, one gate ──┐
                                                                          │
     ┌────────────────────────────────────────────────────────────────────┘
     ▼                                                   ▼
  INTEGRATIONS  (product team)                     AD SETUPS  (ad ops)
  one player surface — TOI · Mweb · VideoShow      the demand behind it
   · identity: property, platform, domains          · placements (up to 5)
   · the default player + its custom configs        · four breaks in each
   · which breaks are switched on                   · a ladder of ad units per break
   · per-break quick decisions (the drive)          · delivery settings, header bidding
     │                                                   │            ▲
     │──────── asks from exactly ONE setup ─────────────▶│            │ a unit points at
     │         (and one setup may fill MANY surfaces)    │            │ a template
     │                                                   │      TEMPLATES  (ad ops)
     │                                                   │      the request URL a unit fires
   Save → a draft                                    Save → a draft   · visible to 1…n properties
   Publish → an immutable, numbered version          Publish → …      · connected, counted
     └─────────────────────────┬─────────────────────────┘            · NO publish plane —
                               ▼                                        Save is on air
                  GET /panel/live/:apiKey  ──▶  the publisher's player
                  live integration + live setup, resolved into one walk
                  (+ every template its served units point at, by name)
```

Three sentences carry the rest of this document:

1. **One integration asks from exactly one ad setup.** A surface has one source of demand,
   never two. The other direction is open: one setup may fill many surfaces, and a shared
   setup is a *link* — edit it once and every surface asking from it moves. `Copy & use`
   is how a surface gets demand of its very own.
2. **Nothing reaches a player until it is published.** Save writes a draft; Publish stamps a
   version and swaps what the player's API serves. Drafts are invisible to the player no
   matter how many times they were saved.
3. **Everything refuses by name.** No silent drops, no silent clamps: a refusal names the
   field, the number found and the number required, and the UI puts it where the mistake
   was made.

## Who does what

| Room | Team | The decisions that live there |
| --- | --- | --- |
| **Integrations** | Product | identity · the default player and its custom configs · which breaks run · the per-break quick decisions · publish this surface |
| **Ad Setups** | Ad ops | placements · the ladder behind each break · pods and direct deals · the global waterfall · header bidding · timings · publish this demand |
| **Templates** | Ad ops | the request URL an ad unit fires · which properties may point at it · what it is already connected to · publish it, take it off air, roll it back. Its own plane: one publish moves every connected ad unit, and no ad setup republishes |
| *(no room)* | the player | reads one JSON document per key and does what it says |

The split is a **convention today, not a permission**: there are no roles yet, so either team
can open either room. Roles, an audit trail and a real identity exchange are named in
[ARCHITECTURE.md](../ARCHITECTURE.md) §11 as gaps to close before real traffic.

---

## Flow 0 — Getting in

1. **The door.** `/login.html` asks for one thing: an email address. Accounts the console
   remembers are offered as plates you can sign in as with one click, and `Request access`
   names who grants it.
2. **Signing in** puts the address in the session and lands you in the Integrations room.
   Any address *shaped* like an address gets in; one that no account claims is signed in as a
   visitor with a derived name. The only refusal is an address that is not an address.
3. **The gate.** A console screen opened without a session bounces to the door.
4. **Signing out really ends it** — the session is deleted, and the remembered plate goes
   with it.

**What is missing, deliberately:** nothing proves the person typing an address owns it — no
password, no token, no round trip — and requests themselves are unauthenticated. The rule
suite pins that, so closing the door again is an explicit act rather than an accident.

---

## Flow 1 — A new surface goes up  *(product)*

1. **Integrations → New.** One chooser, two ways in: **blank**, or a **photocopy** of a
   surface that already exists. There is no wizard — creation lands in the real editor and
   the page is where the surface takes shape.
2. **A copy carries everything**: the player, its named configs, the switches and quick
   decisions, and the setup mapping. A setup someone else holds becomes the copy's own at the
   moment of Create, so cancelling leaves nothing behind.
3. **Details** is identity alone — name, property, platform, and then what the platform asks
   for: a web platform needs at least one domain, an app platform a package name, and the
   other field greys out where it stands rather than disappearing.
4. **Player behaviour** is the whole default player, set on the page: three columns —
   *Playback*, *Appearance & controls*, *Measurement* — every one of the 29 settings visible
   at once, no modal in the way. A blank surface starts from a preset picked as `Start from`
   (MiniTV · ArticleShow · VideoShow); every setting moved off that seed wears the change bar
   and the block counts them. Re-picking the preset asks first when it would discard those
   changes.
5. **Custom configs** (optional, → Flow 4) are the named forks of that player, added as cards
   under it.
6. **Ad behaviour** maps the demand: pick the ad setup this surface asks from — a chip that
   opens the setup's own editor and brings you back with unsaved edits intact. A door that
   maps a setup someone else already uses names who else uses it. If this surface needs its
   own, `Copy & use` takes a photocopy and tuning it never moves the original.
7. **Switch on the breaks** you want and answer the per-break quick decisions (→ Flow 3).
8. **Create** is one write, and it is read **field by field on the change review** — the same
   screen every write in this product ends on. The create review states the preset once and
   lists only the settings that moved off it.
9. The surface now exists as a **draft**. It is `Unpublished` until Flow 6.

**Where it refuses:** a name that collides (names are unique case-insensitively per object
type) · a web platform with no domain, an app platform with no package · a value outside its
bounds, named with the bound · at most 5 ad sections per integration.

---

## Flow 2 — The demand behind it  *(ad ops)*

1. **Ad Setups → New**, the same chooser: blank or a photocopy. A setup copy brings
   everything, ad units included.
2. **Placements are tabs** — up to five per setup, one of them the default; the active tab is
   its own rename field.
3. **Pick a break.** Every placement has four: **pre-roll**, **mid-roll**, **post-roll**
   (ladders) and **out-stream** (a rotation of banners, up to five).
4. **The zones down the left rail** are the same four words on every break:
   - **Special** — the one direct deal tried before everything else (one per break or pod).
   - **Pods** — a mid-roll may run up to three, each owning its own deal, ladder and cadence.
   - **Ad sources** — the ladder itself, always drawn as two sections: `PRIMARY` (rung 1, the
     break's own first ask, which always serves) and `WATERFALL` (the fall, rungs 2…10). The
     fall is answered by one three-way control — `Off │ Custom │ Global` — and switching it
     confirms in a small dialog whose body *is* the move (`Custom waterfall → Global
     waterfall`). Off parks the fall and keeps every own unit (`N units kept`), so every
     answer is reversible.
   - **Delivery settings** — led by **header bidding** (`Auto`, `Off`, or `Custom` with
     `Amazon+Prebid │ Amazon │ Prebid`), then the timings.
5. **Fill the ladder.** Each ad unit is one block: the unit, its counted fact line, and its
   settings; the caret at the block's end opens and closes them, and so does putting the caret
   in the unit's field. Up to ten rungs — one primary and nine fallbacks — dragged to reorder.
6. **Finding a unit.** The lookup offers existing tags and units from the GAM directory. A
   well-formed unit path that is not in the directory yet is **accepted** and wears a
   `not in GAM` mark, recomputed on every read, so the next sync clears it by itself. The only
   hard check is the shape of the path, because a stale directory is normal and a malformed
   path never is. `Sync GAM units` lives once, on the setup editor.
7. **The global waterfall** stands at the setup's head, in the folded `Global settings` row
   beside header bidding: one ladder any break may connect to instead of serving its own
   units. Connecting is a link, not a copy.
8. **Clearing.** Every break clears with a counted confirmation, and the whole setup at once
   from the ⋯ menu — demand only; delivery settings stay.
9. **Save**, then **Publish** — separately from the integration (→ Flow 6).

**Where it refuses:** the caps (5 placements · 3 mid-roll pods · 10 rungs · 5 tags in a
rotation · 3 ads in a pod · 1 direct deal per break or pod) · a tag still in a ladder, or a
template still on a tag, cannot be deleted, and the refusal names or counts its users · an
edit that would leave a **live** switched-on break with nothing to ask is refused with the
surface named.

---

## Flow 3 — Tuning one surface without touching the setup  *(the drive)*

The integration's Ad behaviour card is where a product owner answers, per break and without
ad ops: which breaks are on · who is asked and in what order · how deep the waterfall goes ·
where mid-roll breaks fall · when the pre-roll starts · header bidding (`As set up` by
default, the out-stream's only quick decision).

- **Every answer is stored as sparse intent.** Absence means "follow the ad setup", so
  dropping a decision hands the break back to the setup, and `setup` as a value clears any
  lever. Moving the setup moves every surface that did not dissent.
- **The right-hand panel shows the resolved waterfall** — the exact walk the player would
  run, computed the way the server computes it, not a description of it.
- **The seam holds both ways.** A switch may only light where every pod has live demand
  behind it, and an ops edit that would darken a live break is refused with the surface named.
- **Heavy configurations warn, they do not block**: *"4 tries × 2.5s is a 10s wait before
  anything plays"*. Warnings are levers; refusals are walls; the difference is deliberate.

---

## Flow 4 — One player, several behaviours  *(custom configs)*

A custom config is a named fork of the default player that a page asks for by key (`shorts`).
The model is **default + sparse overrides**: a config stores only what it changes and inherits
the rest live, so moving the default moves every config that did not dissent. Up to twenty per
integration; any player field may be overridden, held to the same rules as the default.

1. **Add one** from the dashed card standing where the new config will appear. It is named by
   its key — one word, unique, never `default` — refused in place.
2. **The sheet is the model, in two panes.** The catalogue of settings stands open down the
   left with its own search and tri-state section boxes; the config's own answers fill the
   right. Ticking a setting takes it onto the sheet, unticking takes it off.
3. **A ticked setting arrives empty** — nothing lit, no value, the row receding until it is
   touched. A setting pre-filled with the value it is overriding is a decision that looks made
   before anybody made it. (Four kinds have no drawable empty state — the nine player
   controls, the colours, the speeds, the remembered set — and are seeded from the default.)
4. **Apply refuses over anything still unanswered**, names it, and flags the rows where it
   sits. The sheet stays open and nothing lands.
5. **Two controls, two questions.** A row's **switch** asks *is this config's own answer
   applying?* — off, the row keeps its place and its value, greys, and the config follows the
   default. The row's **×** asks *does this config have an opinion here at all?* and takes the
   setting off the sheet.
6. **The sheet is a working copy.** Cancel puts all of it back — ticks, values, parked rows,
   the switch. The act row states the position: `Close` when nothing moved, `Apply 3 changes`
   beside `Cancel` when something did.
7. **On the page**, each config is a card: its key, its on/off switch, and the first four
   overrides as label/value lines, the rest counted. A config that overrides nothing says
   `Follows the default in everything`. Rare acts (empty it, delete it) live on the card's ⋯.
8. Then the ordinary gates: **Save**, and **Publish** (→ Flow 6).

---

## Flow 5 — Changing many surfaces at once

1. **Select** integrations in the list. The selection is pinned to the top of the table and
   survives filtering, so it is never lost to a search.
2. **The bulk bar offers two acts**: **Ad behaviour** and **Player behaviour**. (Custom
   configs came off this bar: a config is keyed and per-surface — a surface carries none or
   many — so "one answer for forty" was usually the wrong instrument.)
3. **Step 1 — the sheet.** Both share one row grammar, three states deep: a field starts
   closed showing the cohort's counted today-word (`3 different values`, `full waterfall`),
   opens with its control **unset**, and queues once a value is actually picked.
   - **Ad behaviour prints its levers** — a break has about six.
   - **Player behaviour folds its levers into a checklist** riding the title row — a cohort
     may answer twenty-five of the player's settings, and a printed list that long is a form
     for a whole estate rather than a decision. The four a single surface owns (Player type ·
     Redirect URL · Quality · Fallback media) are greyed in place carrying the reason they are
     refused, in the server's own words.
   - Answering a picked field is mandatory: Apply refuses by name and **opens every row it
     names**. An answer every selected integration already holds says so where it stands and
     never reaches the review.
4. **Step 2 — the change review, in two columns.** Left: the changes, read `FIELD · ANSWER`
   with no arrow, because a cohort has no single prior value to be changed *from*. Right:
   **Integrations** — a count that is always on, a search at the head, one name per line.
   Take a surface out and it stays where it was, faint and counted (`· 2 of 3`), one click
   from being back; `All` puts every one of them back. Add a surface that was never ticked by
   searching for it under the names. Everything counted re-counts as the audience moves, and
   a change that moves nothing for the cohort you leave with drops off the list. The last
   integration cannot be taken out. `Back` carries the audience to step 1.
5. **The foot states the whole act**: *Changes will be applied to the player behaviour of all
   3 integrations*.
6. **Applying** validates every target before touching any. The answer counts changed /
   already-so / refused / skipped, **per name** — a surface the change cannot apply to is
   skipped and named, never silently included.
7. **A bulk write is a SAVE on each integration.** Going on air stays each surface's own
   deliberate act from its own page, so the list now reads `Changes not on air` against each
   one it touched.

---

## Flow 6 — Going on air, and coming back off

1. **Save never changes what viewers see.** It writes the draft, and that is all.
2. **Publish** saves any unsaved edits quietly first — a draft reaches no viewer, so it needs
   no confirmation of its own, and a refused save stops the flow with its own message. Then
   **the change review** reads the whole saved session, grouped, with an optional note in the
   person's own words: `Publish` on a live surface, `Go on air` on its first version.
3. **The seam runs against what is actually live**, and asks one question: *would this leave a
   switched-on break with nothing published behind it?* Publishing an integration whose break
   has no live demand is refused naming each dark break; publishing or deactivating a setup
   that would darken a live surface is refused naming the surface. Belt and braces: the served
   JSON simply omits any break whose demand is not live.
4. **A version is immutable and numbered**, stamped with who, when and the note. History is
   append-only.
5. **Where a surface stands is three answers, and the gap is a fourth**: `● v3` (on air,
   counted), `● v5 · from v2` (on air, and the live version is a restore), `Off air`
   (published once, taken down), `Unpublished` (never published — the player is served
   nothing). Underneath, as its own amber fact, `Changes not on air`.
6. **The rail is a timeline.** `Saved, not published` stands first; every version follows as
   one quiet row — version · note · who and when. Clicking one opens the change review
   read-only, with **Restore** as its single further door.
7. **Restore answers four questions**: what changes (counted from what is on air *now*, not
   what that version did the day it went out) · what it would discard (unpublished draft work,
   read last, as change rows) · whose version and from when · and whether it can be undone —
   it goes on air as a **new** version, so every restore is itself undoable.
8. **Deactivate is the act; `Off air` is the state.** The player stops being served; the draft
   and every version stay; Publish puts it back. Delete is gated on it — a live thing cannot
   be deleted, and the refusal says so.

---

## Flow 7 — What the player actually does

The player knows one URL: `GET /panel/live/:apiKey`. The console answers by joining the
**live** integration with its **live** setup and resolving everything the player should not
have to work out for itself:

- the drive is resolved over the ladders, so the answer is the **walk** — who is asked, in
  what order, how deep;
- request templates come from their own published snapshot, with their fixed list of five macros left for the player
  to fill;
- header bidding is handed over **resolved**, per break and per unit — the player is never
  given `auto`;
- a break whose demand is not published is simply **absent** from the answer;
- the player's settings arrive in five namespaces (`pref`, `playback`, `theme`, `controls`,
  `analytics`) at the one wire boundary that translates the console's vocabulary into the
  player's — including every legacy encoding the player team owns, and milliseconds on the
  wire though the console says seconds on screen.

Drafts are invisible here no matter how many times they were saved. That separation is the
point of the whole product.

---

## Flow 8 — Housekeeping

- **Ad tags** are the units and endpoints themselves: IMA and GPT tags point at GAM ad-unit
  paths, CAN tags at a URL.
- **Templates** are the third room (16 Sep): named request URLs an ad unit points at, each
  saying which properties' ad setups may pick it (**Visible to** — no property named is every
  property) and shown where it already lands (**Connected**, grouped by property, counted).
  They have **their own publish plane** (16 Sep): Save parks a draft and moves nothing, Publish
  moves every connected ad unit in one act and names the count it is about to move, and an
  unpublished template's units ask their provider's standard. The ad setups under it are told
  that it went out — at the head of their card, with the version and who — but are not
  versioned by it, because they did not change. Visibility
  governs the PICK, never the serving: narrowing it away from a connected ad setup is refused
  by name, and in a ladder an out-of-scope template greys in place with its reason rather than
  disappearing.
- **Sync GAM units** pulls newly trafficked units into the console's directory — one
  directory, one sync, one CTA, on the setup editor.
- **Copies are photocopies.** Duplicating an integration or a setup copies everything and
  links nothing, so tuning a copy never moves the original. Sharing happens only where it is
  chosen: mapping the same setup to another surface.
- **Anything in use cannot be deleted** — a tag in a ladder, a template on a tag, a setup an
  integration asks from, a live surface — and the refusal names or counts its users.
- **Resetting the world** rebuilds the same integrations with the same ids and the same seeded
  key strings, so a polluted demo is a one-line fix and counted history never shifts
  underneath a test.

---

## The rules every flow obeys

- **Counted, never estimated.** Every number on screen is arithmetic over real state.
- **Refused by name.** The number found next to the number required; a removed field refused
  with where its answer lives now. Every refusal is machine-readable, so the reason lands
  where the mistake was made.
- **Warnings are levers, refusals are walls.** Heavy configurations warn with counted
  arithmetic and never block a save.
- **Absence is the default.** Sparse intent everywhere — the drive, custom configs, per-slot
  header bidding — so dropping an answer is the way back, and moving the thing above it moves
  everything that did not dissent.
- **Links move together; photocopies never do.** A shared setup, a connected global waterfall
  and an `auto` header-bidding answer are links. A duplicate is not.
- **Seconds on screen, milliseconds in the store** — two fields only, because the player's
  contract wants them that way, converted at one seam on each side of HTTP.
- **Time is written two ways.** Cue points and out-stream show times take `360` or `6:00`, up
  to four hours; the list is deduplicated and sorted, and a token that is not a time is
  refused by name rather than dropped.
- **Save is the gate; Publish is the door.** Every write in every flow ends on the same change
  review screen.

## The caps every flow is held to

| Thing | Ceiling |
| --- | --- |
| placements per ad setup | 5 |
| mid-roll pods per break | 3 |
| ads in a pod | 3 |
| rungs in a ladder | 10 (1 primary + 9 fallbacks) |
| tags in an out-stream rotation | 5 |
| custom player configs per integration | 20 |
| direct deals per break or pod | 1 |
| gap between mid-roll breaks | 3600 s |

Names are unique case-insensitively per object type. Autoplay is On/Off/Auto; passive volume
is 0–100; pause-below-visibility is 0 or 10–100, and 1–9 is refused by name because below 10%
the player cannot tell.

## Where a flow stops short today

Honest, documented, and each a one-line fix rather than a change of scope:

- clearing "Hold video" or "Request timeout" reverts silently to the default instead of
  saying so, and an out-of-range value there is refused in raw milliseconds despite the
  seconds-only rule;
- the drive and bulk cue-point editors drop an unparsable token client-side, where the setup
  editor correctly lets the server refuse it by name;
- nothing authenticates anybody (Flow 0), nothing persists across a restart, and GAM is
  mocked — see [ARCHITECTURE.md](../ARCHITECTURE.md) §11 for the full list before real
  traffic.

## Not in any flow, on purpose (v1)

Approval workflows between the two teams (publishing is direct, with history and revert) ·
roles and an audit trail beyond version history · environments (test/live slices) ·
per-video overrides · rotation on display slots · arbitrary bulk reorder across integrations
holding different tags · pre-roll failure-rescue retry (deferred timing is in; retry-on-no-fill
was considered and dropped).

## Flow → screen → code → the rule that pins it

| Flow | Screen | Code | Cases |
| --- | --- | --- | --- |
| 0 Getting in | `web/login.html` | `web/js/login.js` · `api/routes/session.js` | `13-session` |
| 1 A new surface | Integrations list + editor | `views-keys-list.js` · `views-keys-editor-frame.js` · `routes/keys.js` | `02-two-rooms` |
| 2 The demand | Ad setup editor | `views-setups-*.js` · `routes/setups.js` | `05-ladders` · `11-waterfall` · `14-header-bidding` |
| 3 The drive | Ad behaviour card | `views-keys-editor-ad-behaviour.js` · `store/keys.js` | `03-drive` · `04-behaviour` |
| 4 Custom configs | Player behaviour card + sheet | `views-keys-editor-player.js` · `store/keys.js` | `10-player-configs` · `15-player-levers` |
| 5 Many at once | Bulk bar → sheet → review | `views-keys-bulk-*.js` · `review.js` · `routes/keys-bulk.js` | `07-bulk` |
| 6 Going on air | Publish rail + change review | `web/js/publish.js` · `store/publish.js` · `store/version-changes.js` | `08-publish` · `12-version-notes` |
| 7 The player | — | `liveConfig` / `playerBlock` in `store/publish.js` | `09-player-json` |
| 8 Housekeeping | Tag lookup · GAM sync | `views-tag-lookup.js` · `routes/tags.js` · `routes/gam.js` | `06-tags` |

`npm test` walks all of it over real HTTP in about a second — 183 cases, and they are the
executable version of this document.
