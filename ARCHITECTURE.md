# Player Console — architecture

A guide for anyone about to change the code. It says where things live, how a request
travels, what the model is, and the rules the code keeps. Product history and the reasons
behind decisions are in `PRODUCT-LOG.md` (the running log) and `docs/DECISION-RECORDS.md` (the
dated scope documents); `docs/PRODUCT-SCOPE.md` describes the product for any reader. This
file stays current and short.

> Last verified: 16 Sep 2026 against branch `Ui/UX_Changes`, **working tree dirty** — the
> TEMPLATES round: ad unit templates left the ad setup page, became the third room, and then
> joined the PUBLISH PLANE as a third publishable kind.
> Verified by reading the code, plus `npm test` (218 passed) and `npm run check` (syntax ok).
> Re-checked this pass: every path and symbol this file names resolves; §5's file table matches
> `web/js/` exactly; the nine routers in §4 match `api/server.js`; §11's gaps all still hold.
> Changed this pass: three rooms (§1, §5), `properties` and the template's own plane (§3, §6),
> the two new view files and `css/12` (§2, §5), the visibility invariant (§7), and the removal
> of the template `on` field in favour of on-air / off-air.

## At a glance

- **What** — a config panel for how a publisher's video player asks for ads. Three rooms:
  integrations (product), ad setups and templates (ad ops). **Nothing serves until it is
  published** — all three kinds, no exception (templates joined the plane 16 Sep).
- **Stack** — Node ≥ 20, Express 4, in-memory state, no database. No build step, no
  bundler, no framework: the web app is plain `<script>` tags and globals.
- **Processes** — one. `node api/server.js` serves both the API and `web/` on :4200.
- **Start reading** — `api/server.js` (assembly) → `api/store/state.js` (the model and every
  enum) → `api/store/publish.js` (the two planes) → `web/js/main.js` (the router).
- **The map is §2; the model is §3; the request path is §4; the screens are §5.**
- **Before you change anything** — `npm test` (183 HTTP cases, ~1 s) and, for UI work,
  `npm run ui:snapshot before` / `… after` / `… diff before after` (§10).

## 1. What it is

The Player Console lets two teams configure how a publisher's video player asks for ads:

- **Product** manages *integrations* (one per property × platform): which ad breaks are
  switched on, how the player starts, and a few per-break "quick decisions".
- **Ad ops** manage *ad setups*: the ad units (ladders of ad tags) behind each break and
  how each break behaves — and, in its own room since 16 Sep, *ad unit templates*: the named
  request URLs those units point at, each visible to one or more properties.

Nothing reaches a real player until it is **published** — integrations, ad setups and ad
unit templates alike. The player reads one JSON document per integration key from
`GET /panel/live/:apiKey`. A template publishes on its own plane, so ONE publish moves every
ad unit pointing at it and no ad setup has to republish; the setups are *told*, not
versioned (§6).

One process serves the API *and* the web app; the suite hosts its own. No build step:

| Part | Where | Run |
| --- | --- | --- |
| API (Express, in-memory) | `api/` | `npm start` → http://localhost:4200 |
| Web app (vanilla JS, served by the same process) | `web/` | open http://localhost:4200 |
| Rule suite (HTTP, self-hosting on :4299) | `test/` | `npm test` (~1 s, 183 cases) |

Everything is in memory. `POST /panel/mock/reset` rebuilds the demo world with the same ids
every time, so a polluted state is a one-line fix (`npm run demo`, `npm run scale`).

## 2. Directory map

```
panel/
├── api/
│   ├── server.js          assembles the app: middleware, static web/, one router per subject
│   ├── config.js          the knobs an operator turns: ports, NODE_ENV, the mock GAM delay (§9)
│   ├── error-handler.js   handle(): turns a thrown Refusal into { error, message, ...details }
│   ├── response-shapes.js what the API answers with: keyView, setupView, tagView, …
│   ├── routes/            one router per subject; a handler parses, calls the store, shapes
│   │   ├── meta.js        GET /panel/meta — enums, caps, presets the web app draws from
│   │   ├── session.js     /panel/session — who is signed in, sign in, sign out (the front door)
│   │   ├── keys.js        /panel/keys — integrations CRUD, player patch, duplicate
│   │   ├── keys-bulk.js   POST /panel/keys/bulk — the cohort acts over a selection
│   │   │                  (switches · publish · playerFields · driveFields · configFields)
│   │   ├── setups.js      /panel/setups — ad setups CRUD, behaviour patch, duplicate
│   │   ├── tags.js        /panel/tags, /panel/templates
│   │   ├── publish.js     publish / unpublish / versions / restore (both kinds) + /panel/live
│   │   ├── gam.js         /panel/gam — mock ad unit directory: search, sync
│   │   └── mock.js        POST /panel/mock/reset
│   ├── store.js           façade: re-exports every store/ module
│   ├── store/
│   │   ├── state.js       the Maps, every enum/cap/word, Refusal, ids, resetState, deepCopy
│   │   ├── validate.js    intIn, oneOf, str, uniqueName, mustGet, diff — the refusal helpers
│   │   ├── tags.js        ad tags + ad unit templates
│   │   ├── ladders.js     slot behaviour fields, drive fields, rungs, the walks
│   │   ├── setups.js      ad setups: placements, pods, deals, waterfall, header bidding, GAM dir
│   │   ├── keys.js        integrations: identity, player, custom configs, drive, the seam
│   │   ├── session.js     the accounts the console knows, the session, the sign-in refusals
│   │   ├── publish.js     THE PUBLISH PLANE: snapshots, versions, restore, liveConfig()
│   │   └── version-changes.js  versionChanges(): two snapshots → the changes, in words
│   └── mock/
│       ├── world.js       the seeded demo world + the `scale` scenario (all invented data)
│       └── gamunits.js    the mock GAM ad unit tree
├── web/
│   ├── index.html         the shell + the script tags, in dependency order
│   ├── login.html         THE FRONT DOOR — its own page: the whole cascade + 11, three scripts
│   ├── css/01–12-*.css    the stylesheet, split by subject; load order is the cascade
│   │                      (11 is the door's plate, loaded by login.html only; 12 is the
│   │                       templates room, loaded by index.html only)
│   └── js/                see §5
├── test/
│   ├── run.js             boots the API on :4299, runs every cases/*.spec.js, prints totals
│   ├── harness.js         req(), test(), eq(), assert(), fixtures shared by the cases
│   ├── cases/NN-*.spec.js one file per subject, in run order
│   └── ui-snapshot.mjs    the screens, captured and compared — the safety net for a
│                          change that is meant to be invisible (npm run ui:snapshot)
├── docs/
│   ├── PRODUCT-SCOPE.md   what the product does and where its edges are (any reader)
│   ├── DECISION-RECORDS.md  every dated scope document, merged, oldest first
│   ├── FAQ.md / .docx     the engineering hand-off FAQ
│   ├── PLAYER-CONFIG-FIELDS.xlsx  the field inventory the scope work was built from
│   ├── PLAYER-LEVERS.xlsx the player levers, as handed to the player team
│   ├── PRODUCT-FLOW.md    the product's flows, screen by screen
│   ├── REFACTOR-DECISIONS.md  engineering calls made in structural passes (15 Sep)
│   └── img/               the screenshots PRODUCT-SCOPE.md uses
├── .editorconfig          the only checked-in style tooling (utf-8, lf, 2-space)
├── README.md              the landing page: what it is, how to run it, where to read next
├── PRODUCT-LOG.md         the product log: every decision, dated, with the reason
└── ARCHITECTURE.md        this file — read it first
```

Not in the tree and not architecture: `shots/` (scratch screenshots and one-off scripts)
and `test/snapshots/` (whatever `ui:snapshot` last captured) are both gitignored and
generated. Nothing in the app reads either.

## 3. The model

Four kinds of object live in `state` (see `api/store/state.js`):

```
 integration (key_N)  ──adSetupId──▶ ad setup (as_N)                ad tag (tag_N)
 ├─ name, property, platform         ├─ name, property              ├─ name, type video|display
 ├─ domains | packageName            ├─ waterfall (shared ladder)   ├─ provider ima|gpt|can
 ├─ key   "sak_toi_mweb_xxxxxx"      ├─ headerBidding (one answer)  ├─ value  ad unit path | URL
 ├─ player {autoplay, passiveVolume, ├─ sections[] = placements     └─ tplId ─▶ ad unit template (tpl_N)
 │                                   │                                          ├─ name, provider, url
 │                                   │                                          ├─ properties[] (visible to)
 │                                   │                                          └─ on (serving)
 │          playbackMode, playback,  │   ├─ name, isDefault
 │          expandInMini, …}         │   └─ slots{preroll,midroll,postroll,outstream}
 ├─ playerConfigs[] (named forks)    │        ├─ rungs[]   {tagId, on, pause, mute, displaySlot, …}
 ├─ sections[] overlays, by name     │        ├─ behaviour {start, podAds, headerBidding, …}
 │   └─ slots{t: {on}}               │        ├─ direct    {rungs:[one deal]}
 └─ drive {t: {ask, depth, start,    │        ├─ waterfallSource own|setup|none, ownRungs
            deferSec, podAds, …}}    │        └─ groups[]  (mid-roll pods: each a slot anatomy)
                                     └─ (an integration asks from ONE setup;
                                           a setup may fill MANY integrations)
```

Vocabulary, so the code reads the same as the UI:

| Word | Meaning |
| --- | --- |
| **integration / key** | one publisher surface (TOI · Mweb · VideoShow) and its API key string |
| **ad setup** | the demand behind an integration: placements, ladders, behaviour. One setup may fill several integrations; an edit there moves all of them |
| **ad unit template** | a named request URL an ad unit points at (`tag.tplId`), shared by every ad setup whose unit picks it. Its own room since 16 Sep (`#templates`) — a section at the head of the ad setup page until then, which said it belonged to the setup you happened to open — and its own **publish plane** since the same day: Save parks a draft, Publish moves every connected unit in one act, and an unpublished template is absent from `unittpl` so its units ask their provider's standard |
| **visible to** (`properties[]`) | which properties' ad setups may PICK a template. `[]` is every property — the answer said by absence, so a payload written when this was a single `property` string still reads as it did, and naming every property collapses back to `[]` (one shape per meaning). Visibility governs the pick, never the serving: a unit already pointing at a template keeps requesting through it, which is why narrowing that would strand a connected ad setup is refused by name (`strandedByVisibility`, store/tags.js) rather than silently applied |
| **the reach** | where a template actually lands — one hop past `usedBy`, and reported UNIT-FIRST (`units[]`: a row per ad unit, with the ad setups it sits in) so the rows and the head count are the same number. `usedBy` counts the TAGS that point at it (what the delete refusal counts); `setups` / `setupCount` / `propertiesInUse` count the AD SETUPS those tags sit in, walked from the real documents by `setupsUsingTemplate` → `setupTagIds`. The template page's Connected rail is drawn from exactly this |
| **placement / section** | a named area inside a surface (Default, Shorts feed). The setup defines them; the integration overlays a switch per break |
| **slot / break** | pre-roll, mid-roll, post-roll (ladders) and out-stream (a rotation of banners) |
| **rung / ad unit** | one tag in a ladder, with its own switch and its own facts — `RUNG_FACTS` in `store/state.js`, the ONE list every plane copies (the response shape, the publish snapshot, the player's JSON, the version diff, and — through `meta.rungFacts` since 16 Sep — the ad setup editor's save payload, which had hand-copied its own five and silently dropped `mute` and `headerBidding` for five days) |
| **`adProvider`** | whose demand fills the unit: `gam` · `taboola` · `colombia` · `slike` (`AD_PROVIDERS`), the ops team's own note on each unit (16 Sep). NOT the tag's `provider`, which says how the unit is *requested* (IMA/GPT/CAN) and is knowable from the config — who the demand comes *from* is not, so it is stated or it is absent. **Empty by default and sparse**: absence means nobody has said, `Not set` in the control clears back to it, and an unknown vendor is refused by name on the unit. It rides the player's JSON only where someone set it |
| **ladder / waterfall** | rung 1 is the primary — the break's own first ask, asked before anything else and never replaced by a source answer; rungs 2…10 are the fall, tried in order |
| **pod / break group** | a mid-roll may run up to three pods, each with its own cadence, ladder and direct deal |
| **direct** | the one sold deal a break tries before its primary |
| **global waterfall** | one ladder at the setup's head that any break may connect to instead of serving its own units; a break's own ladder is its **custom** waterfall. Named `Global waterfall` since 8 Sep — the word the breaks and every message use. `WF_WORD` holds it once **per side of HTTP**: `api/store/state.js` (`'global waterfall'`, lower-case, so it reads mid-sentence in a refusal) and `web/js/util.js` (`'Global waterfall'`, the screen's own capital). Change both or the two halves disagree. On the page it is the `Waterfall` zone of the folded **Global settings** head (11 Sep), beside header bidding. The wire key stays `waterfallSource: 'setup'` |
| **the two sections** | every ladder break's Ad sources zone is `PRIMARY` then `WATERFALL`, both always drawn (11 Sep) — so the anatomy reads on an empty break as it does on a full one. Each section is a HEADER (11px/700/`--ink-soft` on the section's own left edge, hairline right) and, for the waterfall, ONE control under it — a three-answer seg `[ Off │ Custom │ Global ]` on the same left edge as the header and the blocks, with no byline (what an answer serves is drawn under it); switched off, it keeps `N units kept`, the only trace of parked units. A refused answer greys where it sits with its own reason; every change confirms first in a small 440 whose body IS the move — `Custom waterfall → Global waterfall`, the break named above it, `Cancel` / `Yes, switch` (11 Sep). They decide the FALL only (rung 2 onward); the primary always serves. Off parks the fall (`waterfallSource: 'none'`) and the rule counts what is kept |
| **`waterfallSource`** | where a ladder break's **fall** comes from: `own` (rungs 2…N of its own), `setup` (the global waterfall's served units), `none` (no fall). **The primary — rung 1 — is the break's own in every answer and always serves**, so served `rungs` are `own`, `[primary, …global]`, or `[primary]`. All three keep every own unit in `ownRungs`, so every answer is reversible. `own` is the answer said by absence, so payloads and snapshots written before each answer existed still read as they always did |
| **header bidding** | who else bids for a slot before the ad server is asked: `off` · `amazon_prebid` · `amazon` · `prebid`, answered ONCE at the setup's head (`headerBidding`). Not a ladder — no order, no depth, no rung — so it is the setup's own field beside the waterfall, not a lever inside it (10 Sep) |
| **`behaviour.headerBidding`** | one slot's answer, on every slot including the out-stream: `auto` (the answer said by absence — borrow the setup's, so moving the global moves the slot) or one of the four above, `off` included. A LINK, never a copy: `auto` is stored, never resolved into the slot. `servedHeaderBidding(slot, global)` (store/setups.js, mirrored as `suHbServed` web-side) resolves it at the live boundary, so the player is never handed `auto`. `auto` is refused AT the global — the thing being borrowed cannot borrow |
| **waterfall depth** | how many of ONE partner's sources a break tries, `drive[t].depth` — a sparse map (`{ima: 2}`), so a partner left out is walked all the way down and `All` writes nothing. Counted down the resolved walk, which is why the **primary always survives**: it is the first rung of its own partner, so any cap of 1 or more keeps it. It sits beside `drive[t].tries`, a flat count over the **whole** walk, cut last, which keeps its own `Waterfall depth` row directly under the ladder — they were tried as one block for a round and read as one confusing control, so the partners are one row and the ceiling over all of them is the next. The GLOBAL waterfall's own `depth` is a different field on a different object — one flat number for one shared ladder |
| **drive** | the integration's per-break quick decisions, stored sparse as intent and resolved against the setup at read time. Since 11 Sep it carries `headerBidding` too (`As set up` = absence; the out-stream's only drive field), and `setup` as a value CLEARS any lever back to the ad setup |
| **player config** | a named fork of an integration's player settings (`playerConfigs[]`). The model is **default + sparse overrides**: a config stores ONLY the fields it changes and inherits the rest live, so moving the default moves every config that did not dissent. Since 13 Sep **any** player field may be overridden — `CONFIG_FORKABLE = PLAYER_FIELDS` in `store/state.js`, reversing the 11 Sep six-field rule — so what a fork may not do is no longer a refusal list but a visible one: every override is named on the row, in the editor and in the change review |
| **the seam** | the check, in both rooms, that never lets a switched-on break end up with nothing to ask |
| **Refusal** | a rule violation: HTTP 4xx with `{ error, message, errors:[{field, message}] }` that names the number found and the number required |

### Time
The UI speaks seconds everywhere. Two fields are stored in milliseconds because that is the
player's JSON contract: `waitMs` and `tagTimeoutMs`. `web/js/util.js` → `MS_FIELDS` is the
one list; `fmtMs` is the one converter.

## 4. How a request travels

```
 browser                          api/                                     store/
 ───────                          ────                                     ──────
 view calls API.updateSetup(id,  routes/setups.js                          setups.updateSetup()
 payload)  (web/js/api.js)   ──▶  r.patch('/panel/setups/:id',        ──▶   merge patch, normalizeSetup()
                                    handle(fn))                              (validate → Refusal on error)
                                          │                                  run the seam against live keys
                                          ▼                                  diff(before, after)
                     response-shapes.setupView(obj)  ◀──────────────────  { obj, changes, warnings }
                                  adds counted facts
                                          │
 res.json({ setup, changes,  ◀────────────┘
            warnings })
```

Rules of the road:

1. **No view writes a URL.** Every request is a named operation in `web/js/api.js`.
2. **Routes are thin.** A route parses params, calls one store function, shapes the answer
   with a `response-shapes.js` function. Rules never live in a route.
3. **Store functions validate, then mutate.** `normalize*` builds a clean object and
   collects `errors`; if any, it throws `Refusal` and nothing was touched. Writes return
   `{ obj, changes, warnings }` — `changes` are field-level (`validate.diff`), `warnings`
   are soft (levers, never walls).
4. **`handle()` is the only try/catch.** A `Refusal` becomes its own status and JSON; any
   other exception is a 500 and a bug.
5. **Views compute facts, never rules.** `keyView` adds walks and counts so a screen can
   say "3 rungs behind pre-roll" without holding a ladder.
6. **Copy before you patch.** The store hands out live references — the Maps hold the real
   objects — so anything building a patch by editing what it just read must copy first or it
   has already written. `deepCopy` (`store/state.js`) is that copy, and `web/js/util.js`
   spells the same helper under the same name: one per side of HTTP, the way `WF_WORD` is
   (§3). A raw `JSON.parse(JSON.stringify(…))` anywhere else is a missed call site.
7. **A cohort act reports per name.** Every act under `POST /panel/keys/bulk` runs through
   one `tallyCohort(units, applyOne, classifyRefusal)` in `routes/keys-bulk.js`, which owns
   the `{ changed, unchanged, refused, skipped }` answer. An act supplies only what it does
   to ONE integration. `getKey` stays outside its try on purpose: an id naming nothing is a
   caller's fault and must keep travelling as a 404, not become a per-name refusal.

### The HTTP surface
Everything is under `/panel`. One router per subject, registered in `api/server.js`; no two
routes overlap.

| Router | Routes |
| --- | --- |
| `routes/meta.js` | `GET /panel/meta` — every enum, cap, preset and per-slot field list the web app draws from, plus `me` (a fixture, see §11) |
| `routes/session.js` | `GET /panel/session` — who is signed in, the accounts the console remembers, the example domain, who grants access · `POST /panel/session` — sign an address in; **any address shaped like one enters** (8 Sep), and the only refusal is `bad_address` for something that is not an address · `DELETE /panel/session` — sign out. Nothing authenticates the address (§11) |
| `routes/keys.js` | `GET/POST /panel/keys` · `GET/PATCH/DELETE /panel/keys/:id` · `PATCH /panel/keys/:id/player` · `POST /panel/keys/:id/duplicate` |
| `routes/keys-bulk.js` | `POST /panel/keys/bulk` — every target validated before any is touched; the answer counts changed / already-so / refused / skipped, per name. `BULK_PLAYER_FIELDS` is what a cohort may set; `BULK_NEVER_FIELDS` is the four a single surface owns (Player type, Redirect URL, Quality, Fallback media), refused by name and carried to the sheet on `/panel/meta`. **`configFields`** (15 Sep) is the one act carrying a LIST rather than a value — `value: { edits: [{ id, config, fields?, on? }] }`, one entry per custom config, because an integration carries none or six of them; `null` in `fields` is the way back (the override drops and the config follows the default live), the never-four are refused here too, and an edit naming a key the integration does not carry is refused by name — this act never creates or removes a config. Values are dry-run through `normalizePlayerConfigs` up front and each integration's edits land in ONE `updateKey`, so a version reads one line per moved field |
| `routes/setups.js` | `GET/POST /panel/setups` · `GET/PATCH/DELETE /panel/setups/:id` · `PATCH /panel/setups/:id/sections/:index/behaviour` · `POST /panel/setups/:id/duplicate` |
| `routes/tags.js` | `GET/POST /panel/tags` · `GET/PATCH/DELETE /panel/tags/:id` · `GET/POST /panel/templates` · `PATCH/DELETE /panel/templates/:id` |
| `routes/publish.js` | for `keys` and `setups` alike: `POST …/:id/publish` · `POST …/:id/unpublish` · `GET …/:id/versions` · `GET …/:id/versions/:v/preview` · `POST …/:id/versions/:v/restore` — and `GET /panel/live/:apiKey`, the only door the player reads |
| `routes/gam.js` | `GET /panel/gam/units` · `POST /panel/gam/sync` (mocked — §11) |
| `routes/mock.js` | `POST /panel/mock/reset` |

### The store modules import each other
`keys.js` reads setups (the seam), `setups.js` reads keys (the other side of the seam),
`publish.js` reads both. That is a deliberate cycle and safe because every cross-module
reference happens inside a function at call time. **Never add a top-level statement that
calls into another store module** — it would run before that module finished loading.
`state.js` imports nothing; add new enums, caps and words there.

## 5. The web app

No bundler, no framework. `index.html` lists plain scripts in dependency order and every
function is a global. It works because files only *define* things at load time; every
cross-file call happens later, at runtime, after all scripts have loaded.

| File | Owns |
| --- | --- |
| `util.js` | `esc`, `deepCopy`, `LABELS` (every UI word for a stored value), `FIELD_NAMES`, `hbAnswers`/`hbPartners` (the header-bidding answers a control draws), toasts, the three house dialogs `ask`/`pickDialog`/`askForm` (with `paintDialogRefusal` — a refusal worn where it was typed) and the plumbing every dialog shares (`dialogRoot`, `closeDialog`, `wireDialogExit`, `wireVeilDismiss`/`isVeilClick`), formatting, the prefix search |
| `api.js` | `API.*` — one named function per HTTP operation; also fills the tag lookups (`TAG_TYPE`, `TAG_PROVIDER`, …) |
| `controls.js` | the form session (`FORM`, `startForm`, `clearErr`, `applyServerErrors`), the house select, `pickerHtml` (the shared checklist — `opts.inline` drops its face and drop so the identical rows can stand open as a rail, `opts.cta` wears the act while a sheet is empty, `pickerCount`/`pickerCountWord` phrase every count once and `opts.quiet` drops them where the list stands open, `g.flat` suspends a section's box while a search filters it; its registry sweep is DEFERRED to the next frame, because a screen may draw several pickers in one innerHTML string and an inline sweep unwires all but the last), lookup typeahead, drag-to-reorder, row menus, `accSeg`/`accRow`, `behaviourRowsHtml`, `slotChipRowHtml`, `changesCardHtml` (the CHANGES TO APPLY card every bulk sheet draws) |
| `publish.js` | the version rail, publish / restore flows (`PUB`) |
| `review.js` | THE CHANGE REVIEW — the one dialog every write (save, publish, bulk, restore) confirms on. Rows are `WHAT · WAS → NOW`, except under `noFrom` (the two cohort sheets, 15 Sep user call), where a row is `FIELD · ANSWER`: forty surfaces have no single previous value, so there is no was-side to print, and the field and the answer are told apart by treatment — the field light and grey, the answer dark and heavy. As STEP 2 of a cohort act it is pixel-identical to step 1 by construction (16 Sep): the journey names one `--frame` both screens read (`steady-ads`/`steady-player` 480, `steady-configs` 620 — fixed rather than floored, because step 1 is), both wear the dialog family's 22px head inset, both carry the same title (17/650/-.3) and both end on the same foot bar (full-bleed top rule, `13px 24px 17px`, on the frame's bottom edge) |
| `views-tag-lookup.js` | the ad-tag lookup control and its search |
| `views-setups-list.js` | Ad Setups list and the new-setup chooser |
| `views-setups-waterfall.js` | the waterfall's zone of Global settings and its glimpse, the Apply-on-ad-slots grid, the per-break **source band** (its three states: no waterfall · custom waterfall · connected), and a connected break's shared levers |
| `views-setups-headerbidding.js` | header bidding's zone of Global settings and its glimpse, and its Apply-on-ad-slots grid; each slot's own row (`Auto │ Off │ Custom`, then the partners) is the first row `behaviourRowsHtml` draws in that slot's delivery settings |
| `views-setups-rungs.js` | one ad-unit block: the rung writers, walk positions, its head row, its facts tier, its settings tier, its collapsed off line |
| `views-setups-placements.js` | placement tabs, mid-roll pods, Clear, the closed row's glimpse |
| `views-setups-editor.js` | the ad setup editor itself: load, the head sections' fold and the **Global settings** head (`suGlobalsHtml`), slot addressing, delivery settings, the slot row, save, and the READ-ONLY TEMPLATE SHELF (`suTplRefHtml`, 16 Sep) — the templates visible to this setup's property, folded beside the other head sections, every row a door into `#templates` and nothing on it editable |
| `views-templates-list.js` | **Templates list** — the third room's table, wearing the other two lists' grammar (one search, filter pills, one pager). FIVE columns, one fact each: what it is (name + `Request URL`), who MAY point at it (`Visible to`), who DOES (`Connected` — the ad setups, one number, the units on its hover), and who last moved it — plus a 44px acts column carrying the one act a row has, **Turn on / Turn off** (`tplToggleActive`), which writes immediately (there is no draft plane to save into) and asks first whenever anything is connected, naming the count it moves. **No Status column**: it would have read `Live` on nearly every row, and templates have no version for it to name — off is the news, so off is what shows, on the name. Two filter pills (Properties, Use); provider is read off the badge |
| `views-templates-editor.js` | **One template's page**, in the INTEGRATION PAGE'S OWN SHAPE (16 Sep, user call): `.ehead.with-rail` → `.detail` → **two `.form.keyform` cards on the left, `.rail` on the right**. `keyform` is the class the console's ONE TYPE SCALE is scoped to, so the fields are the same objects as an integration's, not lookalikes at a fourth scale. Card one is `Details` in two rows — Name · Provider · Visible to (the `Name · Property · Platform` rhythm next door), then the Request URL with its macro chips. Card two is `Connected`, **unit-first**: one row per ad unit (what `usedBy` counts and what actually fires the URL), with the ad setups it sits in as chip-doors beside it. Setup-first could not reconcile — a unit in three setups made the rows exceed the head count. The rail is **Version history and nothing else**, exactly as on the other two editors — Connected shared it for one round, which made this the only page whose right column meant two things. Provider wears `.pvd`, the chip every ladder and list marks a provider with (one chip + `fixed` where units already request through it). Visible to is the house `pickerHtml` checklist — `[]` is every row ticked and the section box IS the All control; the connected-property lock is NOT an `off` row (the picker draws those greyed *and unticked*) but a refusal on the click that would drop it. Macros insert at the remembered caret and APPEND when the field has not been touched — `selectionStart` is `0`, not null, on an unfocused input, which is what put the first macro at position zero. The page carries the shared publish plane whole: `pubStateChipHtml`, Save, Publish, `pubRailHtml`, and `Take off air` in its ⋯ beside Delete, where `Deactivate integration` sits |
| `views-keys-list.js` | Integrations list, filters, paging, selection, bulk bar (**Ad behaviour · Player behaviour** — two acts, 15 Sep user call: the `Custom configs` button came off the bar, and with it the imperative greying it needed. Both remaining acts write one answer every integration has exactly one of; a config is keyed and per-surface, so it is edited on its own page) |
| `views-keys-bulk-ads.js` | the bulk AD BEHAVIOUR sheet: levers per break on the left, CHANGES TO APPLY on the right, review, apply. A row at rest prints a value only when the cohort has one — "as set up" is the absence of an answer, so it prints nothing |
| `views-keys-bulk-player.js` | **Player behaviour** — the one cohort player act, PICKED not printed (15 Sep): one `Change a setting` strip over the server's own catalogue — its face takes the queue card's own column (`--bqp-w`, stated once on `.dlg.bulk`) so the two stand on one pair of edges — (`KL_META.bulkPlayerFields`, with `bulkNever` greyed in the menu carrying its reason), each option a plain checklist row (the cohort's today-word came off the strip, then off the review — `pbTodayWord`/`pbRowTodayWord` are retired, 15 Sep); a picked row is the ad sheet's row drawn with the page's `cfgCtlHtml()` and this sheet's receiver, and MUST be answered — Apply refuses in place, by name. A value they all already hold reads `already this everywhere` and never reaches the review. A custom config belongs to the surface that owns it and is edited on the integration page (see COHORT-SHORTLIST, 14 Sep) |
| `views-keys-bulk-configs.js` | **Custom configs** — NO LONGER REACHED (15 Sep, user call: the CTA came off the bulk bar; `configsJourney` has no caller and the file is loaded but dead — delete it or give it a door, do not leave it as a third state nobody can see). It was the third cohort act, and the only one that is a LIST rather than a form (15 Sep, user call): a block per selected integration, its named configs one under another, and each config's SETTINGS THEMSELVES open as the content — the integration page's own rows (`.sh-row cfg` + `cfgCtlHtml`, never a lookalike). WHICH settings a config overrides is a counted fact in its header that doubles as the door — `Overrides 3 settings ▾` opens the shared `pickerHtml` checklist (`ccOverridesHtml`), reported open or shut, and opening it scrolls that config to the top of the list so the menu is not clipped by the scroller. Each integration header carries the list's own property monogram (`propBadge`) at title weight, and pins while you scroll. Three things were built and cut over the same day for clutter (user calls), all named in the file header so nobody rebuilds them: the `Change a setting on [ scope ]` shortcut strip, the read-only glance line beside each config key, and the `+ Override a setting` link under each config's rows. Nothing on this screen is a read-only copy of something editable. The never-four never appear; the sheet neither creates nor removes a config; the bar button greys with its reason when nothing selected carries one. `ccWireEdits()` resolves the queue into `configFields` edits |
| `views-keys-editor-load.js` | the integration page: load, save-state, which ad setup fills it |
| `views-keys-editor-ad-behaviour.js` | its Ad behaviour card: the walk mirror, the drive, break tabs |
| `views-keys-editor-player.js` | its **Player behaviour** card: the whole default set IN PLACE on the page (`pcDefaultHtml` + `pcColHtml` — three columns, one per section, no box/divider/row rules, `PG_H` writing straight to `FORM.data.player`; no view switch, no modal), custom configs as **cards** carrying their first four overrides (`pcCardHtml` — key left, on/off switch alone on the right; the ⋯ moved into the sheet 15 Sep, so a card offers the one act it can honestly support at a glance). The ceiling is **20** (was 6), so the block grew what a shelf never needed: `pcGridHtml` shows `PCC_SHOW` (8) with a counted `Show all N configs` door, and the head carries a key filter once five or more exist (`pcFindHtml`/`pcFind` — the grid repaints, never the field), and the one sheet left — a config's "tick it, then answer it" body, now **two panes** (`shCfgBodyHtml`, 15 Sep user call): the catalogue standing open down a 206px left rail (`.sh-rail` — the search field IS its head, a filled well with no border at rest, its 6px inset and full width matched to the list beneath so field and rows start and end on the same two lines, then `pickerHtml`'s `inline` shell + `SH_PICK_H`, section heads pinned at 10.5/700 with their box the SAME 14px as the options' (it was smaller, so a parent read smaller than its children), **no counts and no eyebrow**) and the config's own rows filling `.sh-pane`. LEFT because a catalogue is a SOURCE — the version rail and the changes card earn the right by being outcomes — and because the sheet reads *these settings* → *these values*. `shSearch`/`shRailSync` rewrite the list alone, never the sheet, so typing keeps the caret; a live query sets `flat` on each group, which suspends the section boxes ("all of Playback" over a filtered view is a trap). Each pane scrolls on its own; the frame is 700. Head acts sit BESIDE THE KEY (`shHeadActsHtml`, 16 Sep): an **Active │ Inactive** segment (`accSeg`, working copy, counted by `shChangeCount`) rather than a bare toggle in the far corner — two labelled positions say what either end means without being hovered, and standing next to the name they read as the state of the thing that is named. The key field is measured to the 24-character cap (272px). A **vertical** ⋮ carrying **Delete config** is the LAST thing in the act row, right of the primary, opening upward and right-aligned (`shFootMenuHtml`, `.rmenu.up`); it shuts the sheet to hand off to the page's own `pcRemove`. An empty pane draws `.sh-blank` — mark, heading, one line — not a statement of fact about the default. Every ticked setting arrives EMPTY — ALL of them since 15 Sep (`shNeedsSeed` retired): the four kinds with no drawable empty state get an explicit slate from `shRowEff` (nothing lit, no colour), `shCur` hands the first click that same slate so screen and click cannot disagree, `.sh-row.unset` dims until touched, and `shPut` clears `SH.pending` BY ROW so the two composite rows answer from any of their fields. `shDone` refuses by name over anything still waiting. Rows follow the PAGE's grammar — `SH_STACK` is `['look']`, so the nine controls draw as the page's 24px strip on their label's line and only the three colours stack (`.sh-row.cfg` is `150px 1fr auto`, measured against strip 232 + tail ~161). A row fills its pane on a `170px 1fr auto` grid: label lane fixed so the question and its answer read together, the two acts on the right edge, the slack between them (capping the row, and letting the label take the slack, were both tried and reverted — see the log). The tail holds one width whether or not it draws a switch (`.toggle.void` holds the slot on an unanswered row), so the ×, the switch and every control's right edge each stand on a true lane. The tail carries **only its two controls** (15 Sep: `DEFAULT x` / `same as default` / `following the default` all retired — three sentences about the default in the place a row's own acts live). Each row's tail carries a **park switch** and the `×`: off parks the override (row and value kept, control inert, tail reads `following the default`) and `shDone` drops parked fields, the same absence an untick leaves; `×` takes the setting off the sheet. `cfgCtlHtml`'s `compact` option is the page's cut of the two controls taller than a line |
| `views-keys-editor-frame.js` | its frame: header, payload, save / create / duplicate / delete, the chooser The form carries `keyform`, the class the page's ONE type scale is scoped to (10-surfaces.css, end of file): label 12.5/500 · value 12.5 · box 30px · seg 12 · chip 11.5, covering all three cards and the config sheet |
| `login.js` | THE FRONT DOOR (`login.html`): the remembered-account row and its picker (the primary act), the address field under it, which of the two carries the accent, the three refusals painted in place, Request access |
| `main.js` | THE GATE (the session, read once before anything paints — no session lands on `login.html`), the hash router (`#keys`, `#keys/:id`, `#setups`, `#setups/:id`, `#templates`, `#templates/:id`), nav counts, `getMeta()`. A template has no chooser — a copy of one is a second name for the same URL, which is the thing the room exists to stop — so `#templates/new` goes straight to the page |

### Conventions that keep the UI stable

- **One form session at a time.** `startForm(data, rerender)` sets `FORM`; controls mutate
  `FORM.data` and call `FORM.rerender()` (full repaint of `#main`). `FORM.saved` is the
  last-saved copy used for the "changed this session" tint.
- **Typing never repaints.** Text inputs write `FORM.data` and, where a value needs
  reformatting, keep the typed text in a `*_TEXT` buffer (`QF_TEXT`, `BULK_TEXT`, …) until
  blur. Repainting while typing loses the caret. Toolbars and tables paint once; their
  stateful bits (counts, pills, the add button) are toggled imperatively.
- **Every field is always in the DOM.** Inapplicable fields grey out in place (`.off`,
  `.dim`, a `title` saying why); nothing appears or vanishes under the cursor.
- **One control per concept.** Our own select (`selectHtml`), dialogs (`ask`,
  `reviewChanges`), segmented control (`accSeg`), typeahead (`lookupHtml`), drag
  (`registerDrag` + `dragAttrs`). Never a native `<select>`, `confirm` or `prompt`.
  **One way out, too**: `dialogRoot()` is the only place the element is named,
  `closeDialog()` the only thing that clears it, `wireDialogExit()` wires Cancel and the
  veil, and `isVeilClick()` — inside `wireVeilDismiss()` — is the only place the test for
  "beside the card, not on it" is spelled. The four dialogs each room paints for itself go
  through it too (15 Sep); before that they each wired their own veil, and three reached for
  it with `document.querySelector` rather than their own root. So the day Escape closes a
  dialog, it really does close all of them.
- **Inline handlers are strings.** Markup is built with template literals and
  `onclick="fn(args)"`; a handler must be a global, and any user text inside must go
  through `esc`. Callbacks that cannot be a string are held in a registry keyed by a
  generated id (`SELECT_REGISTRY`, `LOOKUP_REGISTRY`, `DRAG_HANDLERS`).
- **Words come from one place.** `label(kind, value)` and `fieldName(field)` read
  `LABELS`/`FIELD_NAMES` in `util.js`; the server sends seller-facing words in refusals.
  No engineering vocabulary reaches the screen.
- **The change review is the confirm.** Anything that writes to a cohort or to the air goes
  through `reviewChanges({ changes })` with the same `{ where, field, from, to }` rows the
  version rail shows. Four zones (head · caption · evidence · act); one row grammar —
  WHAT · WAS → NOW on a grid shared by the whole dialog, cautions included, so nothing on this
  screen describes a change twice. A `where` splits into its known break/zone word (the
  section) and the rest (a sub-label inside it), so one break reads in one place. Publish,
  the version sheet and Restore differ only in their words and which buttons stand in the
  foot; the single aside (`reviewAsideHtml`) is the restore's counted, destructive one.
  One opt-in, `audience: { chosen, all, has, toggle, recount }`, makes the WHO editable on the
  screen that asks about it (the two cohort journeys): the body becomes two columns — the
  changes, and an **Integrations** column holding the cohort as ticks over a `lookupHtml` search
  that adds. The screen keeps its own ROSTER (who is on the column) apart from the audience (who
  is in the act), so an unticked surface stays put instead of vanishing. A tick calls `recount()`
  and writes the head, caption, change list and act label in place, adding the row by hand so the
  search keeps its caret. Such a review is fixed at the sheet's frame
  (`.dlg.rvw.steady.has-who`), because the list would otherwise size the dialog. A journey's audience is `BULK_WHO` in `views-keys-list.js` — `selectedKeys()` answers
  with it, which is the one seam every counted word on both sheets recounts through.

### Shared client state (globals)
`window.ME` (the signed-in person — from `/panel/session` since 8 Sep, not `meta.me`),
`DOOR` (the front door's own state; `login.html` only), `KL_META` (the `/panel/meta` answer),
`KEYS_CACHE`/`SETUPS_CACHE`/`SETUPS_LIST` (last list answers), `TAG_TYPE`/`TAG_PROVIDER`/
`TAG_PROPERTY`/`TAG_OFFDIR`/`TAG_TPL` (filled by `API.listTags`), `KEY_RETURN`/`KEY_RESTORE`
(stash-and-return between the two editors), `SU_PENDING` (a rung the other room sent you to
fill). Treat them as caches: re-read from the API after any write.

## 6. The two planes

Every integration and ad setup has a **draft** (what the editors edit; Save writes it) and,
once published, an immutable **snapshot** on air. Only snapshots reach the player.

- `publishObject(kind, id)` snapshots the draft (`PUBLISHABLE[kind]` in `store/publish.js`),
  refuses if a switched-on break would have no *published* demand behind it, refuses if
  nothing changed, appends a version, and swaps `state.live`.
- `unpublishObject` takes it off air without touching the draft.
- `restoreVersion` writes an old snapshot back onto the draft *through the ordinary update
  path* (so every rule still applies) and publishes it as a **new** version. History is
  append-only.
- **A template is the third publishable kind** (16 Sep). Same plane, same routes, same rail.
  `liveConfig` reads its SNAPSHOT, so a draft template is absent from `unittpl` and its units
  ask their provider's standard — which is the whole of what the old `on: false` meant, and
  why that field went rather than becoming a second way to say "off air". Publishing one
  refuses nothing: whatever it does, its units always have somewhere to ask.
- **A template publishing does NOT version the ad setups under it.** They did not change. But
  they are told: `templateNewsFor(setupId)` lists every template beneath a setup that has gone
  on air since that setup last published — version, person, moment — drawn at the head of the
  setup's card. Silence there was the one hole in the plane's promise; a version bump would
  have been a second bug (ten publishes for one typo, ten histories full of a change nobody
  made in them).
- `liveConfig(apiKey)` joins the live integration with its live setup, resolves the drive
  over the ladders and returns the walk the player should make. Templates are read from
  their own published SNAPSHOT, so a draft one is simply absent from `unittpl`.
  Header bidding is handed over **resolved** — per break and per unit — so the player is
  never given `auto` to work out for itself. A break whose demand is not published is
  simply absent from the answer.
- `playerBlock(P)` is **the wire boundary** — the one place the panel's vocabulary becomes
  the player's. It emits five namespaces (`pref`, `playback`, `theme`, `controls`,
  `analytics`) and holds every legacy encoding the player team owns rather than arguing
  with it: `autoplay` on/off/auto becomes `always`/`off`/`mutedOnScroll`, a sentinel `0`
  means off for every timing, `pip` is the empty string when docking is off, and timings
  go out in milliseconds though the panel says seconds on screen (§3, *Time*). Renaming a
  field on screen must not touch this function; changing what it emits is the player
  team's call.
- `versionChanges(kind, before, after)` in `store/version-changes.js` produces the rail's rows.

Integrations and setups publish separately; the gap is closed by the checks above, not by
a state machine.

## 7. Invariants the code keeps (and the suite pins)

- **Refused by name.** A field that was removed from the model is refused with a message
  saying where the answer lives now (`DEAD_BEHAVIOUR_FIELDS`, `DEAD_RULE_FIELDS`), never
  silently dropped.
- **Counted, never estimated.** Every number on screen is arithmetic over the data.
- **Fail closed at the seam.** A switch may only light where every pod has live demand; an
  ops edit that would darken a live break is refused with the surface named.
- **Copies are photocopies.** Duplicating a setup or an integration copies everything and
  links nothing — a duplicate is never a shared reference.
- **An integration asks from ONE setup; a setup may fill MANY** (8 Sep, reversing the 26 Aug
  1:1 promise). Sharing is ordinary, so nothing refuses it — what replaces the old refusal is
  counting at every door: `usedBy`, `usedByNames`, `usedByLive` and `setupLiveCounts` are all
  written over the SET of holders, and deleting a setup is refused naming every one of them.
- **Deterministic mock.** `resetWorld()` reissues the same ids and key strings (seeded RNG).
- **Anything in use cannot be deleted.** Tags in ladders, templates on tags, setups on keys,
  live integrations. "In use" is ONE walk — `setupTagIds(setup)` (`store/tags.js`) — and it
  counts the global waterfall at the setup's head and the units a break PARKED in `ownRungs`
  as well as what is serving today. It did neither before 16 Sep, so a tag that lived only in
  a global waterfall, or only in a parked ladder, could be deleted out from under it.
- **Everything connected stays visible** (16 Sep). A template's `properties` may always
  widen; it may narrow only where nothing is stranded, so no ad setup ever holds a template
  its own room can no longer show. Refused by name, naming the property, the count of ad
  setups on it, and the two ways out (`updateTemplate` → `strandedByVisibility`).

## 8. How to…

**Add a field to a break's behaviour**
1. `store/state.js` — add any enum or word it needs.
2. `store/ladders.js` — add it to `SLOT_BEHAVIOUR_FIELDS[type]` and normalize it in
   `normalizeSlotBehaviour` (bounds → `intIn`/`oneOf`, default → `??`).
3. `store/publish.js` — it rides `behaviour: { ...sec.slots[t].behaviour }` automatically;
   check `liveConfig` if the player needs it under another name.
4. `web/js/util.js` — add its `FIELD_NAMES` entry (and `LABELS` if it is an enum).
5. `web/js/controls.js` → `behaviourRowsHtml` — add its row in the fixed order.
6. `test/cases/04-behaviour.spec.js` — pin the default, the bounds and the refusal.

**Add a quick decision (a drive field)**
1. `store/ladders.js` — add it to `DRIVE_FIELDS[slot]`, which decides *which* breaks may
   carry it.
2. `store/keys.js` — add one entry to `DRIVE_WRITERS`, the table keyed by the field's own
   name. A writer takes `(v, errs, out)` and writes its own key on `out`, or writes nothing
   (that is how `direct` says "absence is on"). A field with no writer is ignored.
3. Bounds shared with the ad setup's own answer go in `store/state.js`, not at both sites —
   see §9.
4. `web/js/util.js` → `FIELD_NAMES`, `store/state.js` → `FIELD_WORDS` (the words a REFUSAL
   uses — a refusal must never print a JSON key), and a case in `test/cases/03-drive.spec.js`.
5. If it lands on a screen, mirror any walk arithmetic client-side too — `clientDriveWalk` in
   `views-keys-editor-ad-behaviour.js` must resolve exactly as `driveWalkRungs` does, or the
   number on screen is not the number that serves. A field whose VALUE IS A MAP also needs its
   own name in `FLAT_LEAVES` (`store/version-changes.js`), or a diff prints one line per key.

**Add a route**: a function in the owning `store/` module, a thin handler in the matching
`api/routes/*.js`, a shape in `api/response-shapes.js` if the answer is a new object, a named
operation in `web/js/api.js`, and a case in `test/cases/`.

**Add a screen**: a `views-*.js` file with one `viewX()` entry that paints `#main`, a
script tag in `index.html` before `main.js`, a branch in `route()`. Name it for what is on
it (`views-<room>-<thing>.js`); if it passes ~600 lines, split it at a subject seam the way
the setup editor is split.

**Add a test**: `await test('what it pins', async () => { … })` in the `cases/` file for
that subject; the harness resets the world before every case.

## 9. Startup, ports and configuration

`api/server.js` is the only entry point. It runs, in order: `cors()` → `express.json()` →
`express.static('../web')` → the nine routers → `resetWorld()` (so the process is never up
with an empty world) → `app.listen`. The listen is skipped when `NODE_ENV === 'test'`,
which is how `test/run.js` imports the same app and hosts it itself.

**`api/config.js` is the knobs an operator turns**, and the only place the *application*
reads `process.env`. There is still no `.env` and no config *format* — it is a plain module
with committed defaults that environment variables override, in that order (the precedence is
documented at the top of the file). Ports are not spelled anywhere else.

Two files outside the app touch the environment, both in `test/`, and both are in the table
below: `test/run.js` **sets** `NODE_ENV` and `PANEL_PORT` before importing the server (which is
why that import is dynamic), and `test/ui-snapshot.mjs` **reads** `CHROME` and `PUPPETEER` to
find a browser. Nothing under `api/` or `web/` reads `process.env` at all.

| Name | Source | Default | Controls |
| --- | --- | --- | --- |
| `PORTS.app` | `PANEL_PORT` env, else the default | `4200` | the port the API and web app serve on |
| `PORTS.test` | fixed | `4299` | where `npm test` hosts its own server (`TEST_BASE` is its URL) |
| `PORTS.snapshot` | fixed | `4300` | where `ui:snapshot` hosts its own, never your :4200 |
| `isTestEnv()` | `NODE_ENV` env | unset | `test` suppresses `app.listen` and drops the mock GAM sync's delay to 0 |
| `GAM_SYNC_DELAY_MS` | fixed | `1800` | how long the mocked GAM sync pretends to take |
| `CHROME` | env, read in `test/ui-snapshot.mjs` | the macOS Google Chrome path | which browser the screen capture drives |
| `PUPPETEER` | env, read in `test/ui-snapshot.mjs` | `../node_modules/puppeteer-core/…` | where `puppeteer-core` is resolved from (see §11) |

`PANEL_PORT` is **validated at boot**: a value that is not a whole number from 1 to 65535
throws before the server starts. It used to fall through to `app.listen('notaport')`, which
happily bound a unix socket of that name and logged a success line no browser could reach.

The env-derived values are functions (`appPort()`, `isTestEnv()`), not constants, because
`test/run.js` sets `NODE_ENV`/`PANEL_PORT` in its module body — which runs *after* its
static imports. Reading them at call time is what keeps that working; that is also why
`run.js` imports the server dynamically. Don't turn them into top-level constants.

**Secrets are not configuration** and have no place in that file or its precedence chain.
There are none today (§11); when the identity exchange lands, its credentials come from a
secrets manager or deploy-time injection, and `config.js` may name a secret but never hold
one.

Everything else that could look like configuration — enums, caps, defaults, the seller-facing
words — is code in `store/state.js` and `store/ladders.js` on purpose, because each one is a
rule the suite pins rather than a knob an operator turns. A new cap belongs there, not in
`config.js`.

**A cap answered on both sides is spelled once.** Three bounds are answered twice — by the ad
setup (`normalizeSlotBehaviour`, `store/ladders.js`) and again by a surface overriding it
(`DRIVE_WRITERS`, `store/keys.js`). Two of them, `MAX_POD_ADS` and
`MIDROLL_EVERY_MIN`/`MIDROLL_EVERY_MAX`, now live in `store/state.js` and both sides read
them. The third, `deferSec`, is **deliberately still split**: the setup's floor is 3 s and a
surface's is 1 s. Whether that is a licence or an old typo is not something the code answers,
so it was left as found rather than unified — unifying it would move a rule, not tidy one.
Each site carries a comment saying so; the reasoning is in `docs/REFACTOR-DECISIONS.md`
(ADR-4). *(Verified — the split is real, its intent is Unclear.)*

## 10. Verifying a change

| Command | What it proves |
| --- | --- |
| `npm run check` | every JS file parses |
| `npm test` | the 183 HTTP cases (rules, refusals, the publish plane, the player's JSON, the front door) |
| `npm run ui:snapshot <label>` | the screens: walks 85 states in headless Chrome at 1440×900 (81 in the console, then the front door's 4), writes their markup and a PNG each, and fails on any console error |
| `npm run ui:snapshot diff a b` | that two captures are identical |

`ui:snapshot` boots its own server on **:4300**, never your :4200, so a capture cannot be
polluted by whatever you were clicking. It needs a local Chrome and `puppeteer-core`, which
is the one thing `panel/` does not carry itself — see §11.

The HTTP suite talks to the server over the wire only, so it pins behaviour, not
internals: a refactor that keeps it green kept the rules. It says nothing about the
screens, which is what `ui:snapshot` is for — capture `before`, make the change, capture
`after`, diff. That pair is how the 7 Sep restructure was proven to change nothing.
Run both constantly while editing.

## 11. Known gaps before production

These are deliberate for the prototype and must be closed before real traffic:

- **No persistence.** Everything is in memory; a restart is a reset. Needs a database
  behind `store/state.js`'s Maps (the store's function surface is the seam to keep).
- **A session, but no authentication — and the door is deliberately open.** There IS a session
  since 8 Sep: `store/session.js` holds it, the front door (`web/login.html`) signs an address
  in, sign-out empties it, and `main.js`'s gate sends a browser with no session to the door.
  What is missing is the **identity exchange**: nothing proves the person typing an address owns
  it — no password, no token, no OAuth round trip — so **any address shaped like an address gets
  in**, and one that no fixture account claims is signed in as a visitor with a derived name and
  no role. That is a deliberate prototype call (a lock with no key only turns away the people
  meant to try the thing); the suite pins it, so re-closing the door is an explicit act, and the
  real exchange answers at `signIn` with refusals of its own. Nothing authenticates any REQUEST
  either: `/panel/keys` answers a signed-out client, and the suite pins that too, so the day
  those become 401s is a deliberate change.
  Authorship is the same story, but it is now spelled **once**: `ACTOR` in
  `store/state.js` is the literal `'You'`, `updateStamp()` beside it is the
  `{ updatedAt, updatedBy }` every write puts on an object, and `routes/publish.js` passes
  `store.ACTOR` as the version's actor. Needs the real exchange behind `signIn`,
  request-level checks, roles (product vs ad ops), and an audit trail — at which point
  `updateStamp()` starts reading the session and the fifteen call sites this used to be
  spelled at stay untouched.
- **CORS is wide open** and there is no rate limiting or request size limit beyond
  Express defaults.
- **GAM is mocked.** `api/mock/gamunits.js` stands in for the ad unit directory;
  `gamSync` needs a real GAM client (10–20 s pulls).
- **The player's JSON contract** (`liveConfig`) is versioned only by the two version
  numbers it carries; a schema and a compatibility test with the player team are missing.
- **Single process.** The publish plane assumes one writer; a multi-instance deploy needs
  the versions and live maps in shared storage with a transaction per publish.
- **Two cohort counters are pinned by nothing.** `skipped` and `unchanged` — two of the four
  numbers every `POST /panel/keys/bulk` answer carries — are asserted in no case anywhere in
  `test/cases/`. The 15 Sep refactor of that route proved them unchanged with a differential
  probe rather than the suite, which is a one-off, not a net: today nothing would catch a
  regression in either. A case in `07-bulk.spec.js` pinning a non-empty `skipped` and
  publish's `nothing_to_publish → unchanged` would close it. *(Gap.)*
- **No lint/format tooling** is checked in beyond `.editorconfig` and `npm run check`.
  `check`'s glob covers `test/*.mjs` since 15 Sep, so `test/ui-snapshot.mjs` — the one `.mjs`
  file in the repo — is no longer the one source file that never parsed. A real linter would
  still catch what review catches today, depth and dead code included.
- **`ui:snapshot` is not self-contained.** `package.json` declares only `express` and
  `cors` and has no `devDependencies`, but `test/ui-snapshot.mjs` resolves `puppeteer-core`
  from the *parent* repo's `node_modules` by default. The API, the web app and `npm test`
  do run from `panel/` alone; the screen capture does not, unless `PUPPETEER` is pointed
  at an install. Declaring `puppeteer-core` as a devDependency here would close it.
- **The route surface is documented only here.** Unlike its sibling `v2/`, `panel/` has no
  API-SPEC; §4's table and `test/cases/` are the only description of the HTTP contract.
- **The web app is unbundled globals.** That is deliberate for a prototype (no build, one
  file to open, one grammar to learn) and is the first thing to revisit for production:
  modules and a bundler would let the tooling above catch what review catches today.
