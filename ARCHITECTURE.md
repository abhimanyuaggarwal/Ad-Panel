# Player Console — architecture

A guide for anyone about to change the code. It says where things live, how a request
travels, what the model is, and the rules the code keeps. Product history and the reasons
behind decisions are in `PRODUCT-LOG.md` (the running log) and `docs/DECISION-RECORDS.md` (the
dated scope documents); `docs/PRODUCT-SCOPE.md` describes the product for any reader. This
file stays current and short.

> Last verified: 8 Sep 2026 against branch `Ui/UX_Changes` @ `2b6f8b6` (with a large
> uncommitted working tree — HEAD predates the routes/store split). Verified by reading
> the code, plus `npm test` (145 passed) and `npm run check` (syntax ok).

## At a glance

- **What** — a config panel for how a publisher's video player asks for ads. Two rooms:
  integrations (product) and ad setups (ad ops). Nothing serves until it is **published**.
- **Stack** — Node ≥ 20, Express 4, in-memory state, no database. No build step, no
  bundler, no framework: the web app is plain `<script>` tags and globals.
- **Processes** — one. `node api/server.js` serves both the API and `web/` on :4200.
- **Start reading** — `api/server.js` (assembly) → `api/store/state.js` (the model and every
  enum) → `api/store/publish.js` (the two planes) → `web/js/main.js` (the router).
- **The map is §2; the model is §3; the request path is §4; the screens are §5.**
- **Before you change anything** — `npm test` (145 HTTP cases, ~1 s) and, for UI work,
  `npm run ui:snapshot before` / `… after` / `… diff before after` (§10).

## 1. What it is

The Player Console lets two teams configure how a publisher's video player asks for ads:

- **Product** manages *integrations* (one per property × platform): which ad breaks are
  switched on, how the player starts, and a few per-break "quick decisions".
- **Ad ops** manage *ad setups*: the ad units (ladders of ad tags) behind each break and
  how each break behaves.

Nothing reaches a real player until it is **published**. The player reads one JSON
document per integration key from `GET /panel/live/:apiKey`.

Two processes, no build step:

| Part | Where | Run |
| --- | --- | --- |
| API (Express, in-memory) | `api/` | `npm start` → http://localhost:4200 |
| Web app (vanilla JS, served by the API) | `web/` | open http://localhost:4200 |
| Rule suite (HTTP, self-hosting on :4299) | `test/` | `npm test` (~1 s, 145 cases) |

Everything is in memory. `POST /panel/mock/reset` rebuilds the demo world with the same ids
every time, so a polluted state is a one-line fix (`npm run demo`, `npm run scale`).

## 2. Directory map

```
panel/
├── api/
│   ├── server.js          assembles the app: middleware, static web/, one router per subject
│   ├── error-handler.js   handle(): turns a thrown Refusal into { error, message, ...details }
│   ├── response-shapes.js what the API answers with: keyView, setupView, tagView, …
│   ├── routes/            one router per subject; a handler parses, calls the store, shapes
│   │   ├── meta.js        GET /panel/meta — enums, caps, presets the web app draws from
│   │   ├── session.js     /panel/session — who is signed in, sign in, sign out (the front door)
│   │   ├── keys.js        /panel/keys — integrations CRUD, player patch, duplicate
│   │   ├── keys-bulk.js   POST /panel/keys/bulk — the cohort acts over a selection
│   │   ├── setups.js      /panel/setups — ad setups CRUD, behaviour patch, duplicate
│   │   ├── tags.js        /panel/tags, /panel/templates
│   │   ├── publish.js     publish / unpublish / versions / restore (both kinds) + /panel/live
│   │   ├── gam.js         /panel/gam — mock ad unit directory: search, sync
│   │   └── mock.js        POST /panel/mock/reset
│   ├── store.js           façade: re-exports every store/ module
│   ├── store/
│   │   ├── state.js       the Maps, every enum/cap/word, Refusal, ids, resetState
│   │   ├── validate.js    intIn, oneOf, str, uniqueName, mustGet, diff — the refusal helpers
│   │   ├── tags.js        ad tags + ad unit templates
│   │   ├── ladders.js     slot behaviour fields, drive fields, rungs, the walks
│   │   ├── setups.js      ad setups: placements, pods, direct deals, the waterfall, GAM dir
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
│   ├── css/01–11-*.css    the stylesheet, split by subject; load order is the cascade
│   │                      (11 is the door's plate, loaded by login.html only)
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
 integration (key_N)  ──adSetupId──▶  ad setup (as_N)            ad tag (tag_N)
 ├─ name, property, platform          ├─ name, property           ├─ name, type video|display
 ├─ domains | packageName             ├─ waterfall (shared ladder)├─ provider ima|gpt|can
 ├─ key   "sak_toi_mweb_xxxxxx"       ├─ sections[] = placements  ├─ value  ad unit path | URL
 ├─ player {autoplay, passiveVolume,  │   ├─ name, isDefault      └─ tplId ─▶ ad unit template (tpl_N)
 │          playbackMode, playback,   │   └─ slots{preroll,midroll,postroll,outstream}
 │          expandInMini, …}          │        ├─ rungs[]   {tagId, on, pause, displaySlot, …}
 ├─ playerConfigs[] (named forks)     │        ├─ behaviour {start, podAds, tagTimeoutMs, …}
 ├─ sections[] overlays, by name      │        ├─ direct    {rungs:[one deal]}
 │   └─ slots{t: {on}}                │        ├─ waterfallSource own|setup|none, ownRungs
 └─ drive {t: {ask, tries, start,     │        └─ groups[]  (mid-roll pods: each a slot anatomy)
            deferSec, podAds, …}}     └─ (an integration asks from ONE setup;
                                              a setup may fill MANY integrations)
```

Vocabulary, so the code reads the same as the UI:

| Word | Meaning |
| --- | --- |
| **integration / key** | one publisher surface (TOI · Mweb · VideoShow) and its API key string |
| **ad setup** | the demand behind an integration: placements, ladders, behaviour. One setup may fill several integrations; an edit there moves all of them |
| **placement / section** | a named area inside a surface (Default, Shorts feed). The setup defines them; the integration overlays a switch per break |
| **slot / break** | pre-roll, mid-roll, post-roll (ladders) and out-stream (a rotation of banners) |
| **rung / ad unit** | one tag in a ladder, with its own switch and banner facts |
| **ladder / waterfall** | rung 1 is the primary — the break's own first ask, asked before anything else and never replaced by a source answer; rungs 2…10 are the fall, tried in order |
| **pod / break group** | a mid-roll may run up to three pods, each with its own cadence, ladder and direct deal |
| **direct** | the one sold deal a break tries before its primary |
| **global waterfall** | one ladder at the setup's head that any break may connect to instead of serving its own units; a break's own ladder is its **custom** waterfall. Named `Global waterfall` on screen since 8 Sep (`WF_WORD` in `web/js/util.js`, spelled once) — the wire key stays `waterfallSource: 'setup'` |
| **the source row** | the two controls in every break's Ad sources zone, under the primary where there is one: a `Waterfall` on/off switch, and — only while it is on — `Custom │ Global`. They decide the FALL only; the primary above them always serves. No state name and no byline: the ladder around them is the state. Off parks the fall (`waterfallSource: 'none'`) |
| **`waterfallSource`** | where a ladder break's **fall** comes from: `own` (rungs 2…N of its own), `setup` (the global waterfall's served units), `none` (no fall). **The primary — rung 1 — is the break's own in every answer and always serves**, so served `rungs` are `own`, `[primary, …global]`, or `[primary]`. All three keep every own unit in `ownRungs`, so every answer is reversible. `own` is the answer said by absence, so payloads and snapshots written before each answer existed still read as they always did |
| **drive** | the integration's per-break quick decisions, stored sparse as intent and resolved against the setup at read time |
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

### The HTTP surface
Everything is under `/panel`. One router per subject, registered in `api/server.js`; no two
routes overlap.

| Router | Routes |
| --- | --- |
| `routes/meta.js` | `GET /panel/meta` — every enum, cap, preset and per-slot field list the web app draws from, plus `me` (a fixture, see §11) |
| `routes/session.js` | `GET /panel/session` — who is signed in, the accounts the console remembers, the example domain, who grants access · `POST /panel/session` — sign an address in; **any address shaped like one enters** (8 Sep), and the only refusal is `bad_address` for something that is not an address · `DELETE /panel/session` — sign out. Nothing authenticates the address (§11) |
| `routes/keys.js` | `GET/POST /panel/keys` · `GET/PATCH/DELETE /panel/keys/:id` · `PATCH /panel/keys/:id/player` · `POST /panel/keys/:id/duplicate` |
| `routes/keys-bulk.js` | `POST /panel/keys/bulk` — every target validated before any is touched; the answer counts changed / already-so / refused / skipped, per name |
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
| `util.js` | `esc`, `LABELS` (every UI word for a stored value), `FIELD_NAMES`, toasts, the house dialogs `ask`/`pickDialog`, formatting, the prefix search |
| `api.js` | `API.*` — one named function per HTTP operation; also fills the tag lookups (`TAG_TYPE`, `TAG_PROVIDER`, …) |
| `controls.js` | the form session (`FORM`, `startForm`, `clearErr`, `applyServerErrors`), the house select, lookup typeahead, drag-to-reorder, row menus, `accSeg`/`accRow`, `behaviourRowsHtml`, `slotChipRowHtml` |
| `publish.js` | the version rail, publish / restore flows (`PUB`) |
| `review.js` | THE CHANGE REVIEW — the one dialog every write (save, publish, bulk, restore) confirms on |
| `views-tag-lookup.js` | the ad-tag lookup control and its search |
| `views-setups-list.js` | Ad Setups list, the new-setup chooser, ad unit templates UI |
| `views-setups-waterfall.js` | the waterfall section, the Apply-on-ad-slots grid, the per-break **source band** (its three states: no waterfall · custom waterfall · connected), and a connected break's shared levers |
| `views-setups-rungs.js` | one ad-unit block: the rung writers, walk positions, its head row, its facts tier, its settings tier, its collapsed off line |
| `views-setups-placements.js` | placement tabs, mid-roll pods, Clear, the closed row's glimpse |
| `views-setups-editor.js` | the ad setup editor itself: load, slot addressing, delivery settings, the slot row, save |
| `views-keys-list.js` | Integrations list, filters, paging, selection, bulk bar |
| `views-keys-bulk-ads.js` | the bulk AD BEHAVIOUR sheet: levers per break, the queue, apply |
| `views-keys-bulk-player.js` | the two bulk player sheets: custom configs, default player |
| `views-keys-editor-load.js` | the integration page: load, save-state, which ad setup fills it |
| `views-keys-editor-ad-behaviour.js` | its Ad behaviour card: the walk mirror, the drive, break tabs |
| `views-keys-editor-player.js` | its player fields and the custom config table |
| `views-keys-editor-frame.js` | its frame: header, payload, save / create / duplicate / delete, the chooser |
| `login.js` | THE FRONT DOOR (`login.html`): the remembered-account row and its picker (the primary act), the address field under it, which of the two carries the accent, the three refusals painted in place, Request access |
| `main.js` | THE GATE (the session, read once before anything paints — no session lands on `login.html`), the hash router (`#keys`, `#keys/:id`, `#setups`, `#setups/:id`), nav counts, `getMeta()` |

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
- **Inline handlers are strings.** Markup is built with template literals and
  `onclick="fn(args)"`; a handler must be a global, and any user text inside must go
  through `esc`. Callbacks that cannot be a string are held in a registry keyed by a
  generated id (`SELECT_REGISTRY`, `LOOKUP_REGISTRY`, `DRAG_HANDLERS`).
- **Words come from one place.** `label(kind, value)` and `fieldName(field)` read
  `LABELS`/`FIELD_NAMES` in `util.js`; the server sends seller-facing words in refusals.
  No engineering vocabulary reaches the screen.
- **The change review is the confirm.** Anything that writes to a cohort or to the air goes
  through `reviewChanges({ changes })` with the same `{ where, field, from, to }` rows the
  version rail shows.

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
- `liveConfig(apiKey)` joins the live integration with its live setup, resolves the drive
  over the ladders and returns the walk the player should make. Templates resolve live.
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
  live integrations.

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
`express.static('../web')` → the eight routers → `resetWorld()` (so the process is never up
with an empty world) → `app.listen`. The listen is skipped when `NODE_ENV === 'test'`,
which is how `test/run.js` imports the same app and hosts it itself.

There is no config file and no `.env`. Four environment variables are read anywhere in the
repo, all with defaults:

| Variable | Read in | Default | Controls |
| --- | --- | --- | --- |
| `PANEL_PORT` | `api/server.js`, `test/run.js` | `4200` | the port the API and web app serve on |
| `NODE_ENV` | `api/server.js`, `routes/gam.js` | unset | `test` suppresses `app.listen` and drops the mock GAM sync's 1.8 s delay to 0 |
| `CHROME` | `test/ui-snapshot.mjs` | the macOS Google Chrome path | which browser the screen capture drives |
| `PUPPETEER` | `test/ui-snapshot.mjs` | `../node_modules/puppeteer-core/…` | where `puppeteer-core` is resolved from (see §11) |

Everything else that could look like configuration — enums, caps, defaults, the seller-facing
words — is code in `store/state.js` and `store/ladders.js` on purpose, because each one is a
rule the suite pins rather than a knob an operator turns.

## 10. Verifying a change

| Command | What it proves |
| --- | --- |
| `npm run check` | every JS file parses |
| `npm test` | the 145 HTTP cases (rules, refusals, the publish plane, the player's JSON, the front door) |
| `npm run ui:snapshot <label>` | the screens: walks 65 states in headless Chrome at 1440×900 (the console's, then the front door's), writes their markup and a PNG each, and fails on any console error |
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
  Authorship is the same story: `updatedBy` is the literal `'You'` in `store/keys.js`,
  `store/setups.js` and `store/tags.js`, and the publish actor is that literal passed from
  `routes/publish.js`. Needs the real exchange behind `signIn`, request-level checks, roles
  (product vs ad ops), and an audit trail.
- **CORS is wide open** and there is no rate limiting or request size limit beyond
  Express defaults.
- **GAM is mocked.** `api/mock/gamunits.js` stands in for the ad unit directory;
  `gamSync` needs a real GAM client (10–20 s pulls).
- **The player's JSON contract** (`liveConfig`) is versioned only by the two version
  numbers it carries; a schema and a compatibility test with the player team are missing.
- **Single process.** The publish plane assumes one writer; a multi-instance deploy needs
  the versions and live maps in shared storage with a transaction per publish.
- **No lint/format tooling** is checked in beyond `.editorconfig` and `npm run check`.
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
