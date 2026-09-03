# Player Console — the Integrations Panel (StreamAds repo) — v1

**LAST CALLS BEFORE HANDOFF (3 Sep, user — twelve, in order):**

1. **"Ad delivery" is "Ad behaviour"** on the integration page — the same word the bulk act uses,
   one name for one concept. (The ops room keeps "Ad setups": the object, not the section.)
2. **Custom configs are KEYS, one row each — in a table.** A config is a single word a player
   types to ask for it (`shorts`, not "Shorts feed") — held to `[A-Za-z0-9_-]{1,24}` at the
   prompt, on blur, and by the server, refused by name otherwise. The tabs are gone, and the
   first one-row cut failed because the key sat baseline-level with the controls and read as an
   unlabelled fourth field. Settled shape: ONE heading row (KEY · PLAYBACK MODE · EXPAND MINITV ·
   AUTOPLAY), the key in its own fixed identity column — mono, on a quiet tint, a rule dividing
   it from the facts it names — and bare controls under their permanent headings.
3. **Autoplay behaviour is On / Off / Auto** (was Off/Muted/Unmuted). Whether the player starts by
   itself is one decision; loudness is another —
4. **Passive volume (0–100%)** is the player's ONE volume, a Details field (JSON: `passiveVolume`,
   replacing `startVolume`, which is now refused by name). Custom configs never carry a volume;
   the Default player behaviour bulk sheet gained it as a fourth lever, and the Custom player
   behaviour sheet shows it on the Default block only.
5. **Creating an integration maps existing demand only** — the "+ New ad setup" blank card is gone
   from create mode (in-section cards and the change modal both); it remains on the edit page,
   where the stash-and-return flow lives.
6. **Details is two rows: short answers, then the three forkable facts.** Playback, Fallback media
   and Passive volume are all short answers (a mode, a media id, a number), so they share one row
   at their natural widths like Property · Platform above them — growing them split the row 50/50
   and left a select adrift in half a row of nothing. Playback mode · Expand MiniTV · Autoplay
   behaviour then own the row below, an even share each: the same three facts, in the same order,
   as the columns of the configs table under them.
7. **The mapped setup rides the Ad behaviour TITLE ROW, at the right edge.** `FILLS FROM` eyebrow ·
   a prominent accent chip with the setup's name (click = the open-and-return trip, edits kept;
   hover = the demand summary) · the quiet meta (`who · when`, plus "becomes this integration's
   own copy at create" while held) · `change`. It briefly sat on its own line under the title and
   read as a second heading. Unmapped still says "nothing yet — every break fills from ONE ad
   setup; pick it below". `.ads-fills` / `.st-chip` survive so the probes' reads stay honest.
8. **Custom player configs carries no byline** ("a player asking by key gets that row…"): the KEY
   heading over a mono key column says it, and the panel's rule is that facts wear micro-labels,
   not sentences.
9. **Adding a custom config is typing a row, not answering a dialog.** `+ Add config key` is a
   real add-row button in the ladder's grammar, at the FOOT of the table where the row it makes
   appears — it used to be a pale link up in the section title, naming the section again. Clicking
   it inserts the row with the caret already in its key and the three facts born a photocopy of the
   default's, so the row is finished the moment the key is typed. An unnamed row disables the next
   add (`Key the row above first`) rather than a dialog disabling the page, typing never repaints
   the table (`.wants` and the button are toggled by hand), the key's three refusals moved to blur
   (one word · not `default` · not a key already here), an abandoned row is dropped by `keyPayload`
   instead of earning a server refusal, and its `×` asks nothing. `askName` had no callers left
   and is gone, with its CSS.
10. **A map card offers two acts on hover: `Use` and `Duplicate & use`** — in the card's TOP-RIGHT
   corner (3 Sep, second cut), where an "in use / free" pill used to sit saying what the foot
   already says in words ("fills X"). `Use` is the small solid button, `Duplicate & use` the
   outlined one beside it; they are absolutely placed and faded in, so the title never reflows,
   with a short white ramp carrying them over the tail of a long name instead of clipping it.
   The cards were widened to make room — three across in the section (`minmax(430px, 1fr)`) and
   the chooser dialogs went to the house 860px sheet width, since a 330px card cannot hold a name
   and two acts at once.
   `use` maps that very setup (photocopying it if someone else already fills it, as before);
   `duplicate & use` takes a photocopy — placements, ad units, deals, settings — and maps that,
   leaving the original alone. On a SAVED integration the copy is made immediately; while an
   integration is still being created it is made at Create (`FORM.data.copyAtCreate`, read from the
   form because `keyPayload` rightly strips it), so cancelling leaves no orphan setup behind —
   the same discipline the held-setup copy has always followed.
11. **Two CSS collisions fixed in the New request template dialog** (reported as "UI is breaking",
   both older than this round). The house `.select` carries `min-width: 210px` for page rows, but
   the Provider field in a 440px dialog is 150px — the control spilled out through the dialog's
   right edge; `.frow.tpl-form .select` now fits the column it was given. And `.dlg-note` was
   defined twice: the later rule zeroed the margin of the earlier one but left its `border-top`
   and `padding-top`, so the separator hairline sat 11px under the URL field and read as a doubled
   input border. One definition now: a quiet hint with air above it and no rule line.
12. **Every break can be cleared, and the whole setup at once.** `Clear` sits in the break's right
   gutter and shows itself when the row is yours (the ad unit's gear grammar), greying where it
   sits — not vanishing — when there is nothing to clear. `Clear all ad units` is in the setup's
   `⋯` menu, which now renders while creating too. Clear means the DEMAND: the indirect ladder, the
   direct deal, and on a mid-roll the extra pods, which collapse back to Pod 1. Placements, their
   names and every delivery setting stay. Both confirms count first and name what goes ("Removes 15
   ad units from 5 breaks across 2 placements (Default, Shorts feed)"), and nothing leaves the page
   until Save.


## Layout (production handoff, 3 Sep 2026)

Self-contained: `npm install && npm start` (port 4200), `npm test` (117 cases, ~1s,
self-hosting on :4299). No build step — plain scripts in dependency order (`web/index.html`
documents the order). Everything invented lives in `api/mock/`; `POST /panel/mock/reset`
rebuilds the world with the same ids.

    api/server.js            HTTP surface (routes, views/serializers, bulk actions)
    api/store.js             the model's front door — re-exports api/store/ whole
    api/store/state.js       the in-memory maps, vocabulary constants, ids, reset
    api/store/validate.js    shared refusal helpers (refused-by-name lives here)
    api/store/tags.js        ad tags + request templates
    api/store/ladders.js     slot behaviour, cue points, rungs, the walks
    api/store/setups.js      ad setups: placements, pods, deals, CRUD, GAM directory
    api/store/keys.js        integrations: identity, player, custom configs, the drive
    api/store/publish.js     THE PUBLISH PLANE + the seam checked at the boundary
    api/store/diff.js        what changed, in words
    api/mock/world.js        the seeded world + named scenarios
    web/js/util.js           escaping, LABELS vocabulary, toasts, house dialogs
    web/js/api.js            every request as a named operation — no view writes a URL
    web/js/controls.js       shared form machinery (FORM session, selects, lookup, drag, segs)
    web/js/publish.js        THE PUBLISH PLANE (rail, versions, restore)
    web/js/review.js         THE CHANGE REVIEW (one screen every write ends on)
    web/js/views-tags.js     the ad-tag lookup control
    web/js/views-setups-list.js  Ad Setups list + the new-setup chooser
    web/js/views-setups.js       the ad setup EDITOR (ops room)
    web/js/views-keys-list.js    Integrations list, filters, selection, bulk bar
    web/js/views-keys-bulk.js    the three bulk acts (ad / custom player / default player)
    web/js/views-keys-form.js    one integration's page 1/4: load, accessors, setup mapping + return flow
    web/js/views-keys-drive.js   2/4: Ad behaviour — the walk mirror, the drive, break tabs, the card
    web/js/views-keys-player.js  3/4: the player fields + the custom-config table
    web/js/views-keys-shell.js   4/4: page frame, payload/diff, save/create/delete, the chooser
    web/js/main.js           hash router
    web/css/                 the stylesheet, split 01–10 (pure partition of app.css — numeric
                             load order IS the original cascade; later rules still win)
    test/run.js              the 117-case suite
    docs/                    Player-Config scope documents + STORE-SPLIT.md (the planned
                             api/store.js split: module map, pinned rules, method)

The four views-keys-form parts and the ten css files are PURE PARTITIONS (3 Sep): cut at
section seams, byte-exact reassembly asserted before writing, nothing edited in the move.
A computed-style snapshot of every element on seven screens (2,602 rows × 42 properties)
was taken before and after the CSS split and is identical. api/store.js was split the
same day under docs/STORE-SPLIT.md's rules — eight subject modules behind a re-export
façade, so server.js, the tests and the mock world import exactly what they always did;
verified by 117/117, the probe battery, and a 44-check end-to-end UAT (list filters and
search, both editors' full journeys, the inline config row, pods, the lookup, clears,
save→review→publish, all three bulk acts, zero console errors, no native dialogs).

**THE DEAD-CODE SWEEP (3 Sep, pre-push).** An exact audit (word-boundary references across
all JS/HTML — onclick strings count) plus a 21-agent adversarial verification pass, then
count-asserted removal: 478 CSS rules (283 orphaned classes from deleted eras — the
wizard, the walk plan, the old config cards), five identifiers with zero references
(`SUGGEST_SEQ`, `SU_DIRECT_OPEN`, `effectiveWalk`, `APP_PLATFORMS`, `getTemplate`), the
comment-only views-behaviours.js and a vestigial empty block in the GAM sync route. The
verification pass is what made it safe: it caught nine classes built dynamically
(`p-${property}`, `t-${type}`) that a grep audit had wrongly condemned, and the removal
uncovered one more pre-existing fused selector (`.rung-row.off .lookup input, … /*…*/
.rung-standby`) — repaired, and all ten CSS files now pass a parse validator so that
disease cannot hide again. Proof of harmlessness: a 2,602-element computed-style snapshot
across seven screens is byte-identical before and after, plus 117/117 and the 44-check
UAT. `docs/SCOPE.md` is the product's scope document — written for engineering and
non-engineering readers, screenshots in `docs/img/`, covering the edges (seconds vs
milliseconds, the GAM sync flow, the publish seam, every cap and refusal family).


**THE BULK SHEET IS A CLEAN SLATE (3 Sep, user call).** The ad-behaviour sheet used to draw every
control live with a value already standing in it — a Waterfall depth reading "Full" before anyone
touched it read as a decision when it was only a default, and the whole sheet looked pre-answered.
Now a lever has three states in one grammar:

1. **Closed** (the resting sheet): label · the cohort's counted **today-word** ("full waterfall",
   "on", "as set up", or the honest spread "Muted · Unmuted") · a quiet `Set` that shows on hover.
   The today-word is information, never a suggestion — it sits in the value's place but cannot be
   mistaken for a choice because there is no control.
2. **Open** (the lever is chosen): the control appears **unset** — segments with nothing selected,
   Direct as an explicit On/Off pair (a toggle has to stand somewhere, and where it stood read as
   the value), the delay box empty with its default as a placeholder. An `×` folds it back to a
   label, nothing queued.
3. **Queued** (a value picked): the accent bar and the pending card, exactly as before.

Dropping a change — from the row or the pending card — folds the lever all the way back to closed.
`Review N changes` and THE CHANGE REVIEW are unchanged.

**THE THIRD BULK ACT: DEFAULT PLAYER BEHAVIOUR (3 Sep, user call; renamed + made ONE STEP the
same day).** The bulk bar reads `Change · Ad behaviour · Default player behaviour · Custom player
behaviour · Clear` — the blanket act and the per-integration walk named as the pair they are.
**Default player behaviour** sets the default player's three facts — Playback mode, Expand MiniTV
for ads, Autoplay behaviour (+ volume when Unmuted) — across the whole selection, in the
clean-slate rows. **It is one step (user call): three levers never earn a second screen.** The
read-back the review would have given lives on the sheet itself — a set row shows *was <today>*
beside its value — and the foot counts `N changes · M integrations` next to a direct Apply.
Applied through the existing `playerFields` bulk action, which writes each integration's default
player and never its named forks. Verified: three selected keys changed, an unselected key and a
custom config untouched, no second screen. (The AD sheet keeps its review — many levers across
four breaks on a cohort is exactly what THE CHANGE REVIEW is for.)

**THE SETUP IS SEEN IN ITS OWN EDITOR (3 Sep, user call — the preview modal is deleted).** The
read-only preview was a second, poorer rendering of a screen that already exists. The integration
page's Ad delivery section now has exactly three doors, one behaviour each:

- **`open`** (on the mapped chip and on every card) **navigates to the ad setup's real editor** —
  ladders, versions, the truth. Before leaving, the integration draft (create or edit mode, all
  unsaved edits, the open break tab) is **stashed** (`KEY_RETURN`); the setup editor's ← becomes
  "Back to “<integration>” — your edits there are kept" and **restores the draft exactly**
  (`KEY_RESTORE`, consumed by `viewKeyForm`). Verified: name+domains typed on an unsaved create
  page survive the round trip; so do unsaved edits on an existing integration.
- **`change`** opens **the same card modal the New-ad-setup door uses**: `+ New ad setup` first,
  then every setup as a card (in use/free · counted demand · who touched it · its own `open`).
  One grammar for picking a setup, everywhere. `pickSetup`/`cardPickDialog` (the two-step picker
  with the preview pane) are deleted.
- **The blank card opens the setup's real creation editor**, prefilled with "<integration> demand"
  and the integration's property, its header reading *for “X” — mapped there on Create*. Its
  Create runs the normal review, then **returns to the integration page with the new setup
  mapped** and the draft intact. Cancel/← returns with nothing changed anywhere.

Safety in the seam: a return ticket is **stale-guarded** — it names its expected destination, and
arriving at any list or a different setup drops it, so a detour never leaves a wrong "back to" on
a header. `viewSetupReadOnly`, `setupPreviewHtml`, `setupReadOnlyHtml` and the `.spv-*` anatomy
are deleted with their callers.

**UNIT SETTINGS: BELOW THE FOLD, SETTLED (3 Sep, user call — fourth cut; supersedes "the
waterfall is a table" below, kept for its lessons).** The full table put fifty controls on screen —
the cognitive load moved, it didn't leave. The user's call: settings go back below the fold, but
with clean IA and *intuitive discovery*. The settled anatomy:

- **The row is the waterfall, only**: order · switch · provider · unit name. A ladder is read far
  more often than a unit is tuned, so reading is what the resting state optimises for.
- **The door is a GEAR that shows itself when the row is yours (3 Sep, user call — the repeated
  word was the same noise the read-only facts were).** It appears on the row's hover, while the
  caret is in that unit's field, and stays lit while its panel is open — the exact reveal the
  remove ✕ beside it has always used, so the row's two actions arrive together. Unlike fold v1's
  anonymous chevron, a gear names what it opens; the tooltip and aria-label say it in words, and a
  **freshly picked unit still opens its own panel**, so the first thing a new rung teaches is where
  its settings live.
- **The panel speaks the page's own grammar**: a bounded soft card, starting exactly on the unit
  column (measured 0px off), whose rows are the Delivery-settings rows — label column · one
  control · one height. Fold v1's other killer was its dialect (a 2-col 11.5px grid the page spoke
  nowhere else); now one settings language covers the whole page.
- **What the table taught survives**: values need permanent labels — in a one-unit panel the label
  column *is* that, without ten rows of repeated chrome. One panel open at a time; switching
  placement, break or pod closes it. `not in GAM` stays on the row (a warning, not a setting).

**THE WATERFALL IS A TABLE (3 Sep, superseded same day — kept for the lessons).**

Two attempts at per-unit settings failed for the same reason, and naming that reason produced the
answer. **When many things share the same fields, enterprise software does not give each one a
little form — it makes a table.** One row per ad unit, one column per setting, one heading row,
every value editable where it sits. That is what GAM does with line items and what every ops
console does with resources, and it fixes all three complaints at their root:

- **A value in a column has a permanent label above it.** `at player bottom · pauses video` was
  unreadable because the value carried no heading — the reader had to remember what each one meant.
  A column heading is that label, on every row, permanently.
- **Repeated identical values are cheap in a column and expensive as prose.** Ten rows reading
  "pauses video" align and the eye skips them; ten prose fragments get parsed ten times. That is
  why the read-only facts "were not helping".
- **One settings language, not two.** The fold was a 2-column grid at 11.5px sitting above a
  full-width row list at normal scale. Now the per-unit facts are a table and Delivery settings is
  a row list — and that difference is *correct* IA, because one describes a list of units and the
  other describes the break.

What went: the fold (`suRungSettingsHtml`), the read-only glimpse (`suRungGlimpseHtml`), the
open/close state (`SU_RUNG_OPEN`, `suToggleRungSettings`), the chevron, and the `tpl` chip (the
template is a column now). What stayed on the row: the `not in GAM` warning, inside the unit's own
cell — it is a fact about the unit, not a setting.

Details that matter: **one widget vocabulary** — a select for anything with a named answer, a small
number box for anything in seconds, both 30px. **The Clocks column appears only where the ladder
holds a banner** (`suHasBanner`), so an all-video ladder gets nine columns and a wider Ad unit
instead of a column of dashes. An absent delay reads **`now`**, because absence means the request
fires the moment its turn comes. **The heading and the rows are separate grids**, so they share one
`--rung-cols` variable *and* one width wrapper — a stray 2px of padding on the heading was enough to
knock the flexible column out of line, and the base `.select`'s `min-width: 210px` was overflowing
104px cells and painting over the Delay column, which is what made it look empty.

**PODS, AD PLACEMENT, AND THE FOLD (3 Sep, user call — three of these were the user's call to
make, and were put to them directly).**

- **A mid-roll runs PODS, and every pod owns its direct deal** (`group` → `pod` throughout;
  `DRIVE_FIELDS`-style model change in `normalizeSection`). The reasoning the user chose: a pod is
  a break with its own cadence and its own ladder, so the deal sold against it is its own too.
  Pod 1's deal doubles as the slot's, so every single-pod path and every fixture written before
  this reads unchanged; the published JSON carries each pod's deal under `groups[n].direct`. A new
  pod clones the one on screen but **never its deal** — two pods running one deal would be the same
  inventory promised twice.
- **The pods strip stands even at one pod**, above Direct, because it is the container everything
  else sits inside: `Pods · Pod 1 · + Add pod`. The old "Groups" zone row — whose only job was to
  hold an add link — is gone, which is what makes "everything is in pod 1" visible.
- **Ad placement (was "Ad slot") belongs to every unit in a break**, IMA and CAN included: a banner
  renders at the position, a video unit's companion renders alongside it. `displaySlot` used to be
  refused by name on a video rung; now it is accepted and defaults from the same vocabulary. Two
  test cases were re-encoded for the new rule (the close clocks stay the banner's alone).
- **Two facts ride each unit's row** (user's choice of three options): ad placement and content
  pause, read-only, so they can be compared straight down a ladder without opening anything. The
  rest stay behind the fold, and the pause chip that used to sit on the row retired — the row states
  pause outright now, and a chip repeating it was the same fact twice on one line.
- **Those two facts say themselves (3 Sep, second cut).** The first cut printed `Player bottom ·
  Yes` and failed: a bare position and a bare "Yes" give the reader nothing to attach them to —
  *Yes to what?* A fact on a row has to read as a sentence fragment about the unit, not as two
  cells from a table whose header is somewhere else. So the values speak: **`at player bottom ·
  pauses video`**, and a display unit reads `at player bottom · plays over video`. No labels, and
  the one row that differs is now the one you notice.
- **One height for every control in the fold**: a select was 48px next to a 34px segment and a 30px
  number box. All four are 32px with one corner radius, because in a settings grid they have to read
  as one row of answers rather than three different widgets.

**A PLACEMENT IS NAMED IN ITS OWN TAB (3 Sep, user call).** The name lived behind a rename dialog,
and under the tabs sat a byline — "a placement inside TOI Mweb VideoShow · switched on there" —
that said what the page already says twice over. Both are gone. The tab you are standing on **is**
its own input: `+ Add placement` makes a tab called **Untitled** with the caret already in it and
the text selected, so naming it is the act rather than a prompt to get through first. Typing never
repaints (the caret rule) and the tab grows with the name; leaving it empty puts "Untitled" back,
and a clash says so instead of saving two placements a surface could not tell apart. Remove is the
`×` on the tab, still behind its confirm. `suRenameSection` is deleted.

**THE PLACEMENTS LABEL MOVED ABOVE ITS STRIP (3 Sep, user call).** Inline, it pushed `Default` off
the card's left edge, so the first tab lined up with nothing under it. The label now names the strip
from above and every tab starts where the rows below start — measured: the label, `Default`, the
Pre-roll row and the Name field all sit at x=47. (`PODS` stays inline: it sits in the slot's own
left gutter, where it lines up with DIRECT, INDIRECT and DELIVERY SETTINGS beneath it — that gutter
is the map, and it now aligns to the pixel.)

**THE TWO HEADERS, REBALANCED (3 Sep, user call).** Request templates was a tinted, bordered box
while PLACEMENTS — the page's actual structure — was a pale eyebrow, so the shared plumbing shouted
and the structure whispered. The templates line lost its box and fill; PLACEMENTS took the ink it
gave up (`--ink-soft` against the templates line's `--ink-faint`).

**PLAINER NAMES AND FEWER BYLINES (3 Sep, user call):**

- **"Max wait" → "Hold video for the ad"**, options `No hold · Whole waterfall · Timed`. The old row
  named itself *and* one of its own three answers, so it read as an option of itself. What the field
  decides is how long the video is held back waiting for the ad — so it says that.
- **Min content playback is disabled unless the video is not being held** (`wait === 'immediate'`),
  greyed in place with the reason. It can only be honoured while content is actually playing.
- **The ladder arithmetic lost its bylines**: `2 × 1.5s — up to 3s to fill` and `the whole ladder
  gives up here` are gone. A sentence of sums beside a number field is noise while you set the
  number. What survives is the one fact worth interrupting for, and only when it is true: *the last
  N tries would never run*.
- **Opening a request template is the same screen as making one.** The old dialog bolted a "Carries"
  list of every tag onto the form — a second way to do what each unit's own Request template row
  already does, and the reason the dialog was tall and cluttered. Now: three fields, Save, and
  Delete when nothing requests through it.
- **"+ Add placement" sits beside the last placement tab**, not mid-row. It had claimed the strip's
  auto margin, and the GAM sync line then sat further right — so the add floated in the middle. The
  sync is the thing that belongs at the far edge.

**NEW AD SETUP: THE CHOOSER, THEN THE REAL EDITOR (3 Sep, user call — the 4-step wizard is gone).**
The ad setup creation journey now mirrors the integration one exactly, because they are the same
act. The decisions:

1. **One modal, one question — start from what?** `+ Start blank` first, then every existing setup
   as a card wearing the LISTING's own columns (property badge · the integration it fills · the
   PRE/MID/POST/OUT demand chips · who touched it when). Reusing the list's vocabulary means the
   card needs no new grammar to learn. `#setups/new` deep-links to it; Cancel walks the address back.
2. **Picking lands in the editor ad ops actually work in** (`viewSetupForm(null)` seeded via
   `SETUP_CREATE_SEED`), not a stepper. The shape you are handed is the shape you keep tuning, and
   the create-mode editor that already existed became reachable again instead of being replaced.
3. **A copy brings everything — ad units included** (3 Sep, user call; it used to arrive with empty
   ladders on the argument that units are trafficked per surface). A copy you have to re-traffic by
   hand is not a copy, and the same unit running on two surfaces was never abnormal here — an ad
   setup is what a surface *asks*, not what it owns. It stays a PHOTOCOPY, deep-copied object by
   object, so tuning the new setup moves nothing on the source; the head says `copied from X — its
   own from here` and the create review counts what came ("26 copied — this setup's own"). Verified
   against the server: 26 units in, 26 units out, source untouched.
4. **Create is reviewed** like every other write (`setupCreateChangeList` through `reviewChanges`,
   keepOrder), and **lands IN the new setup's editor** rather than back on the list — what happens
   next, filling ladders or tuning the ones the copy brought, happens on that page.
5. **The integration page's inline "+ New ad setup" card lost the wizard too**: it now names the
   setup, creates it bare (one placement, platform delivery settings) and maps it without leaving
   the page. The ladders are ad ops' work and happen in their room.

**REQUEST TEMPLATES ARE NOT A FIFTH BREAK (3 Sep, user call — "unrecognisable at the bottom").**
They sat *under* Pre/Mid/Post/Out wearing a break row's exact clothing — same label column, same
glimpse, same chevron — so the eye read them as another break and slid past. They are a different
KIND of thing: named request URLs shared by every ad setup on the account, not a property of this
one. So they moved to the **top of the card, above the placement tabs**, and lost the accordion
entirely: a label, the templates as chips (provider badge · name · how many tags request through
it), and one `+ New template`. A chip opens its own editor; there is no open/closed state left to
be in, and `SU_TPL_OPEN` is gone.

**BOTH LISTS, PRUNED AND SQUARED UP (3 Sep, user call).**

- **Filters cut**: integrations lose On air, Player configs and Modified; ad setups lose On air
  and Modified. What is left is what people actually filter by — Properties · Platforms · Breaks ·
  Ad setup, and Properties · Integrations · Demand.
- **The Breaks filter is a GRID now**, not a list of every combination. It used to be eight flat
  options (Pre-roll on, Pre-roll off, Mid-roll on, …) that could only answer about ONE break at a
  time — a shape that gets worse with every break added, and that cannot ask the question ops
  actually ask ("running mid-roll but *no* post-roll"). It is now one pill holding four rows —
  Pre-roll · Mid-roll · Post-roll · Out-stream, each **Any / On / Off** — plus a Clear. Every break
  asked about must answer (AND), the pill names what it is filtering without being opened
  (`Mid on, Out on`, then `3 breaks set`), and the rows wear the Active-breaks column's own words.
- **`Assignment` became `Integrations`**: a yes/no pair became a picker of integrations by name,
  plus "Not mapped yet" — the mirror of the integrations list's own Ad setup filter.
- **Demand wears the Active-breaks chips**: `setupChipsHtml` lights PRE · MID · POST · OUT when the
  placements carry something for that break, with the count on the chip's hover. One vocabulary
  answers "which breaks run here" on both screens.
- **"Assigned to X" is a column**, not a byline under the name; the domain/package line under an
  integration's name is gone. Both tables pin the same column widths, and the setups name column
  carries the width of the keys list's checkbox column too — so **Property lands on the same x
  (370px) on both screens**.
- **Platform is a column (3 Sep), and every column takes a share.** When only some columns were
  sized the last one absorbed all the slack, so the row's ink stopped ~550px short of the card's
  right edge and the table read as broken. Now the two name columns and Property stay pinned (that
  is what keeps Property beside the name), the middle columns are proportional, and the trailing
  metadata column is right-aligned to close the row off — measured dead space at the right edge is
  15px (one cell's padding) at both 1440px and 1024px. Platform having its own column also emptied
  the line under an integration's name, so the name row is a single line now. The two lists are
  structurally the same object: name · property · one relationship column · break chips · modified.

**SEARCH IS A PREFIX SEARCH OVER WHAT YOU CAN SEE (user: "search is not working").** It filtered in
realtime all along; the problem was *what* it matched — a substring anywhere in a blob of hidden
fields (section names, key strings, domains), so typing "feed" returned a row whose visible name has
no "feed" in it and the result looked arbitrary. `matchesPrefix(q, ...texts)` in `util.js` now
requires **every word typed to start a word** in the text: "mweb art" finds "TOI Mweb ArticleShow",
"feed" finds nothing, and no match is ever mid-word. Integrations search their name; ad setups
search their name and the integration they fill — both columns on screen.

**THE PLAYER-BEHAVIOUR SHEET, RE-CUT FROM FIRST PRINCIPLES (3 Sep, user call).** The queue strip
above the form is gone. Three things were wrong with it, and they were the same thing:

1. **It said everything twice.** A change was already visible in its control; the strip repeated it
   in different words a screen away, so the reader had to map between two vocabularies for one fact.
2. **It grew as you worked**, pushing the form down and making the dialog resize — breaking the
   panel's oldest rule (nothing moves under the cursor) and the user's own "size changes are bad".
3. **The queue metaphor was wrong.** You are not staging tasks; you are editing a set of objects.
   "Everything about to happen" already has a home — THE CHANGE REVIEW, one click away.

What replaces it: **the change lives where the change was made.** A moved field wears an accent bar
in its own row, the value it held (`was Muted`), and an × that puts it back. The **rail is the
change map** — each integration carries a count of its own changes, so "what have I touched, and
where" is answered without a second list. The foot counts the total; Review reads every one before
anything lands. The state gutter is reserved whether a row has changed or not, so a control never
shifts sideways the moment you change it.

**Fixed footprint (the same 860×529 every other sheet measures).** `.dlg.bulk .dlg-body` carries
`flex: 1`, whose `flex-basis: 0%` overrides any height set on the body — so the height lives on
`.dlg.pb` itself and the body's floor/ceiling are released; the rail and detail scroll inside it.
Measured stable across every interaction: at rest, after edits, on a surface with fewer configs,
with six integrations selected, and back from the review.

**Bylines cut (user call):** the rail's `platform · N configs` sub-line (the names already carry the
platform), the Default block's "answers every player that doesn't ask by name", and the kicker's
"every config, Default first". The kicker is a count now; the block header is a config name.

**CUE POINTS JOIN THE DRIVE + SECONDS EVERYWHERE (3 Sep evening, user call):**

- **Where the mid-roll breaks fall is a surface decision now.** `mode`, `cuepoints` and `every`
  joined `DRIVE_FIELDS.midroll`, and `effectiveBehaviour` merges them the way it already merged
  `start`/`deferSec`/`podAds`: stored sparse as intent, resolved over whatever the placement
  holds, so an ops change next week still arrives. The reasoning: with the 1:1 promise a setup IS
  one integration's, so "this surface breaks at 2:00 and 8:00" is that surface's answer to give.
  The editor's mid-roll gets a **Cue points** row (the setups editor's own word) beside Waterfall
  depth, and the bulk ad-behaviour sheet gets the same field. Empty follows the ad setup; a list
  overrides it on every placement, and "use the setup's" puts it back.
- **Two shapes it refuses rather than flatten**, both greyed in place with the reason and refused
  by name server-side: an **interval** cadence (the positions are not a list then), and a mid-roll
  running **several break groups** (each has its own cadence — one answer cannot stand for all of
  them). Placements that merely *disagree* are not flattened silently either: the row says
  "N placements differ — set one for all" instead of showing one placement's answer as the value.
- **No milliseconds anywhere a person reads or types (user call).** `waitMs` and `tagTimeoutMs`
  keep their millisecond keys — that is the player's JSON contract — but every surface speaks
  seconds: the inputs take seconds and accept decimals (1.2 → 1200), `fmtMs` formats every diff
  and warning ("8 rungs × 1.5s is a 12s wait"), and `Max wait (ms)` lost its suffix. `MS_FIELDS`
  in `util.js` is the single list; `suBNumSec` is the one converter.

**THE PLAYER'S OWN GRID + CONFIG TABS (3 Sep, user call):** the three player facts used to bunch
into the left third of Details under a 240px select and a 1100px text box — "odd and immature",
and the Fallback media bar read as broken. Every player field now takes an even share of its row
(`.frow.pfacts`), Autoplay takes a wider share so its volume box stays on the line, and the
identity rows above are the grid they land on. **Custom player configs are TABS** (`.pc-tabs`,
reusing `.stab`): six stacked cards were a scroll, not a comparison. The selected fork draws its
name (a 340px field, not a full-width bar) with Remove on its own baseline, then the same three
facts in the same grid. `PC_SEL` holds the tab; adding opens the new fork, removing clamps.

**PLAYER BEHAVIOUR, ONE INTEGRATION WHOLE (3 Sep, user call):** the bulk sheet's rail listed every
config of every surface (six surfaces = thirty rows, and one integration's configs were never on
screen together). The rail is now one row per **integration** (`platform · N configs`), and the
right side is that integration's configs stacked — Default first, then each named fork, each a
bounded block of the same three rows. `PB_SEL` is `{ ki }`; a queue row still names its config and
now selects the integration and scrolls that block into view.

**THREE TAB STATES (3 Sep, user call).** Every tab strip in the panel (`.stab` — the
integration's break tabs, the setups editor's placements, mid-roll groups — and `.btab`, the
bulk ad-behaviour sheet's breaks) now separates two axes that used to be fused:

| | weight | colour | indicator |
|---|---|---|---|
| **Active** (current tab) | 700 bold | normal ink | accent underline |
| **Inactive** (enabled) | 500 | normal ink | none |
| **Disabled** (break switched off) | 500 | grey | none |

Selection is carried by WEIGHT + the accent indicator; COLOUR is free to mean one thing only —
this break is switched off. Before this, grey meant "not the tab you're on", so a running break
you weren't looking at was pixel-identical to one that was switched off. The tab you are ON never
vanishes: an off + selected tab stays bold and only softens to `--ink-soft`. The `off` class
follows the same truth the tab's own mini toggle shows (`anyOn` in the editor, the queued-or-
cohort state in the bulk sheet, so queueing a break ON un-greys its tab live). `vacant` (nothing
behind the break) no longer paints the label — `off` owns grey, and a vacant break is off by
definition.

**A switch on a tab you are not standing on is a STATUS LIGHT**: `.stab .toggle.mini.dead` lost
its `opacity: .35` (it keeps `cursor: default`, and the title still says "Open this tab first").
Dimming an accurate ON state was the same lie the grey labels told. Only a switch that genuinely
cannot move dims: `.stab.vacant .toggle.mini`, and `.toggle.tiny.dead` (no direct deals behind
the break) — both with their reason on hover.

**CREATE FLOW RE-CUT + SETUP PREVIEW (3 Sep evening, user call):** the integration wizard
(5 pages, born that morning) is **gone** — "create should not be a wizard". In its place:

- **The chooser**: New integration opens ONE modal of cards — `+ Start blank` first, then every
  existing integration wearing counted facts (platform · property · setup name · N breaks on ·
  N player configs). Picking a card opens **the edit page itself** in create mode
  (`viewKeyForm(null)`, seeded via `KEY_CREATE_SEED`): blank, or a photocopy (name = "X copy" to
  retype, player/configs/switches/drive/setup mapping carried; `copiedFrom` shown as a quiet chip
  by the page name). `#keys/new` deep-links to it; open/cancel walk the address with
  `history.replaceState` so ← and refresh keep meaning what they say. Create lands on the new
  integration's page, not the list.
- **Ad delivery with nothing mapped IS the picker**: instead of an "attach…" link, the section
  body is a card grid — `+ New ad setup` first (opens ops' own 4-step setup wizard INLINE via
  `openNewSetupWizard({ onCreated, property, nameHint })`; its create lands back on this page
  already mapped), then every setup as a card (name · in use/free · counted per-break summary ·
  `view` → read-only preview · foot names the holder). Card click maps it; the break tabs take
  the section over. `pickSetup()` (the two-step card dialog) survives only as "change" once one
  is mapped.
- **Create is reviewed** like every other write: the Create button opens THE CHANGE REVIEW
  (keepOrder — identity first, `reviewChanges` learned a `keepOrder` opt) with the birth
  certificate from `createChangeList()`. A HELD setup is attached as the integration's **own
  copy resolved between Confirm and create** (duplicate → create → on refusal the copy is
  deleted again); on an EXISTING integration mapping a held setup still photocopies at pick
  time. The ads-fills strip says "becomes this integration's own copy at create" while deferred.
- **The setup preview grew up**: `setupReadOnlyHtml` no longer prints flat text lines — it
  renders the review anatomy (`.spv-*`): a counted facts strip (property · N placements · N ad
  sources · fills "X" · by/when), then one bounded card per break (placement in the header when
  there are several, mid-roll cadence per group), rows = the walk in serving order
  (`DIRECT/PRIMARY/FALLBACK n` · source · provider) with `inactive` and `not in GAM` worn on the
  row. Shared by the read-only modal and pickSetup's step 2.

**Naming (19 Aug, user decision):** the object formerly called "API key" is an **Integration**
everywhere in the UI — product/ops teams' word for one property × platform surface's ad setup.
The credential string itself is still the API key (shown mono on the detail page). Routes/ids
keep the `key` names internally.

**Renamed again (3 Sep, user call): the panel is “Player Console”** — the user's own framing: a
config panel for player behaviour and ad behaviour across every site the player runs on, so the
name says the object, not a mascot. AdPilot lasted a day. The mark stays.

**The brand (2 Sep, user call):** the panel is **AdPilot** — the user asked for a new name to go
with their logo, and AdPilot fits the product's own driving vocabulary (THE DRIVE, delivery
controls: a pilot's few deliberate decisions over a machine ops keeps tuned). The mark is the
user's angular two-tone "A" recreated as an INLINE SVG in the header band (two rounded strokes,
gold `#F3A63A` left limb, orange `#E96A2A` right limb with the foot) — transparent by nature,
never a boxed image with a white background. Repo, routes and internals keep the StreamAds name.

**Brand re-cut (3 Sep):** the mark redrawn as a rounded gradient ribbon (gold `#F6B33D` →
orange `#E8622C`), favicon matching; the Config Panel sub-line left the band.

**Fixed editor header (2 Sep, user call):** on both editors the `.ehead` (back · name · status ·
Save/Publish) is sticky under the 56px band — full-bleed inside `main` via negative margins, its
own background and hairline, z-index 40 (below the topbar's 50 and every dialog veil). The
version rail rides up into the band (`margin-top: -64px`) and sticks at the very offset it rests
at (`top: 71px`, z 41 so it draws over the band's background), so **Version history and its
All/Published tab sit on the page name's own line and never move** — verified aligned within 1px
on both editors, at rest and scrolled; the band's hairline passes through the gap under the
rail's head row, never through a version. The setups editor's "Assigned to …" line moved inside
the form column so both editors share the exact geometry the alignment depends on.

**Global property scope (19 Aug):** a **dropdown** at the sidebar top (workspace-switcher pattern:
brand → scope → nav), rendered from `meta.propertyScopes` so it scales past 10 properties (menu
scrolls; chips were replaced for that reason). Selection persists in localStorage and scopes the
whole panel: integration lists (property pill hides when scoped), shared
object lists (All-scoped objects show for every property), attach pickers, bulk pickers, nav
counts, and new-object property defaults. A TOI ops person flips to TOI once and the panel is
theirs.

The second StreamAds surface: a self-serve panel where ad ops / publisher ops change player and
ad configuration in real time, without engineering. Built fresh 17 Aug 2026 (the earlier `player/`
prototype was deleted the same day — do not rebuild toward it). The `v2/` direct-deal platform is
untouched and unrelated.

**Run:** `npm run panel` → http://localhost:4200 (API + panel on one port, in-memory).
**The player's door:** `GET /panel/live/:apiKey` — the PUBLISHED configuration and nothing else
(27 Aug). Every other route serves drafts, which no viewer ever sees.
**Test:** `npm run test:panel` (112 rule cases over HTTP, ~1s — rewritten whole for the 24 Aug
two-rooms model, re-cut 26 Aug for the drive and the 1:1 promise, again 27 Aug for the
publish plane, and grown 31 Aug for the player's-JSON build: fifteen new cases pin Direct,
break groups, banner facts, out-stream, the fill timeout, templates and playback timing;
the cases that pinned local overrides, `status`, and the primary-displacing `ask` died with
their features).
**Reset:** `POST /panel/mock/reset` or the "Reset demo data" button — same ids and key strings
every time (seeded RNG).

## THE CHANGE REVIEW (2 Sep, user call) — one screen, three doors

Nothing reaches a cohort or the air without being read back first. `web/js/review.js` owns the
screen; **bulk Apply, Save and Publish all end on it**, and they end on it identically, because
they all hand it the same flat list the version rail already speaks — `{where, field, from, to}`.
The list is bucketed by WHERE in the order the product reads (the four breaks, then the player,
then the surface's own details), with a count per group, `from → to` per row on a hairline table,
and the counted caveats sitting right-aligned on the row they qualify. Values are the panel's
words, not the payload's: `reviewValue` knows the delivery vocabulary (absence is "as set up", a
full walk is "Full"), and a caller already holding words passes `fromText`/`toText`.

**Groups are bounded objects (2 Sep, UX pass — "the cards are not differentiable"):** flat
hairlines running edge to edge made Pre-roll and Mid-roll one continuous grey mass, the eye
reading headings to find seams. Each group is now a bordered block with a tinted header band —
standard table anatomy, far lighter than a filled card — so the breaks chunk by shape before a
word is read; row rules inside sit a shade lighter than the group's border, keeping group over
row in the hierarchy.

**NO PROSE, AND NO RESIZE (2 Sep review).** The first cut carried a scope box and a closing note;
both restated the title and the button, and a reviewer in a hurry read neither — cut. What is
left is the list, a counted foot, and the two acts; the only words that survive are the `kicker`
(whose changes these are, "draft only — v1 stays on air", "replaces v1 on air") and the per-row
note. And **step 2 is the same object as step 1**: the review wears the bulk sheet's exact
footprint, 860×529, held by one body height on both (`340px` on the sheet, `411px` on the review
= the same total, the difference being the tab strip the review has no equivalent of). The sheet
itself stopped growing and shrinking between tabs in the same change.

- **Save is reviewed too** — the draft is where a mistake starts. `keyChangeList` diffs the open
  form against the last save at FIELD level (the old `formDiff` works in whole groups like
  `drive`, which is fine as a "nothing changed" gate and useless as a review). It mirrors the
  server's vocabulary exactly, so a save and a publish describe the same change identically.
- Two server-side diff corrections came out of that: a **drive change is grouped by its BREAK**
  (`Pre-roll`, not one undifferentiated "Ad delivery" pile — which break a decision moved on is
  the first thing anyone asks), and a **switch is grouped by its break too**, with the placement
  in the field name (`Post-roll · Default — runs`). Both improve the version rail for free.
- Still on plain confirms, deliberately: the cohort publish/take-off-air bar (N drafts, no client
  change list) and the AD SETUP editor's Save (a ladder-shaped diff is its own build). The screen
  is generic, so extending it there is wiring, not design.

### THE BULK SHEET IS THE QUEUE (same call, re-cut on review)

"It is not clear what we have changed." The old sheet drew every field of every break at once and
highlighted the touched ones, so the answer was a hunt across five tabs. Now every tab leads with
what it is changing: a **Changing list at the top of the tab's own panel**, then the fields it has
not touched underneath, hairline between. Each queued row is the field, the value it is leaving
(quiet and struck) and the value it becomes (in the accent), an × to drop it, and one click to
reopen the control that set it — in place. A field moves out of the quiet list and into the
Changing list the moment it is set; the quiet rows show what the cohort answers today, or a
`mixed today` chip, collapsed until clicked.

The first cut put that card ABOVE the tab strip, holding every break's changes at once, filled
grey. On review: **it belongs inside the tab** — it broke the sheet in half, read heavier than the
decisions it summarised, and the cross-break view is the review screen's job (and the tab dots').
It is now a list, not a panel: no fill, no box. A break switched off dims the fields it would
decide but **never the Changing list** — the switch is usually one of those rows, and a change you
cannot read is a change you cannot check.

**The UX pass (2 Sep, fourth round — "too cluttered, no differentiation"):** two lists answering
two different questions must not share an anatomy. CHANGING rows are the loud ones — an accent
bar down the left edge (the version rail's dot language, stretched), full-ink labels, the new
value in the accent. NOT CHANGING rows recede to a menu — lighter weight, no per-row rules, the
chevron invisible until hover — under their own micro-label, and the label pair appears only once
something is queued (until then there is nothing to tell apart). **"mixed today" is DEAD** (user:
"I'm unable to understand it"): a chip that names the situation instead of answering the question,
repeated on half the rows. A field the cohort disagrees on now shows THE VALUES THEMSELVES
("Unmuted · Muted"), the count taking over past three ("5 different values") — same words on the
review's struck left-hand side. Absence of a decision reads "as set up", never `undefined`.

**The bulk bar re-cut (2 Sep, user call):** cohort **Publish and Take off air left the bar** —
going on or off air is each integration's own deliberate act, from its page. What remains is one
verb with two objects: **Change · Ad behaviour · Player behaviour** (never two buttons both
starting with "Change"). Ad behaviour is this sheet, now breaks-only — its Player tab moved out
whole. **Player behaviour** is its own sheet: every selected integration's configs — Default
first, then each named fork — one bordered group per integration (the review's anatomy), one row
per config, the three facts as columns under one header strip; a row that moved wears the
pending-changes accent bar, typing a volume never repaints (the foot's count follows the caret),
and Review reads the queue back grouped `Integration · Config` before any draft is written
(per-integration PATCH, publish untouched). List headers settled at **Pending changes / Other
settings** ("Changing / Not changing" read un-enterprise); the queued row dropped its
struck-through old value for the review's own `from → to` grammar — a crossed-out "as set up"
read as an unmade rule, not a leaving value.

The foot reads **Review N changes** (counted across every tab) and leads to the change review;
**Back returns to the sheet with the queue intact** — a review that costs you your work is a
review nobody opens twice. `bulkFieldDefs` / `bulkPlayerDefs` are one definition per field
(control, label, hover) so the list, the queue and the review cannot drift apart. The per-break
"Reset to setup" and the sheet-wide "Clear all" are both gone: a tab clears its own queue, a
single change is dropped by its ×, and Cancel drops the lot.

## TWO CREATION WIZARDS (3 Sep, user call — decided together, two questions each)

**New Ad Setup is a wizard** (`#setups/new` opens it over the list; the cold create-mode editor
is unreachable): **Source › Placements › Ad sources › Review**, four pages, ONE create. The user
chose 4-pages-by-concern over a page per break (empty breaks cost nothing) and chose SKELETON
depth: the Ad sources page is the four breaks as tabs, and per placement it attaches only the
DIRECT DEAL and the PRIMARY tag (selects over the tag directory — hand-typed units and pasted
endpoints stay the editor's doors). Source is blank / preset (stamps delivery-settings values) /
copy (photocopies the source whole; the placements and sources pages then show read-only
summaries). Review is `reviewBodyHtml` in the wizard's own step order (`keepOrder`); Create lands
IN THE EDITOR ("fallbacks and settings are tuned here"), off air; refusals map their errors back
onto the step they belong to.

**The Integration wizard grew to five pages**: **Source › Identity › Player › Ad delivery ›
Review**. The Player page surfaces what a template dropdown used to decide silently — the
template pick plus the Default config's three facts, editable (a copied source's player arrives
editable the same way). The Ad delivery page gained **break switches with counted demand**
("8 tags behind it across 2 placements"): an integration is born RUNNING what you switch on —
sections mirror the picked setup's placements, each break on only where that placement carries
demand (the seam's skip-and-name rule applied at build). Review reads all five pages back in
order; Create stays one act, off air, cleanup-on-refusal as before.

## AD SETUP POLISH (3 Sep, user call) — the ladder starts where the settings start

Two refinements from review: (a) **the ladder lost its 92px right-aligned leading gutter** — the
PRIMARY label and the fall numbers are a narrow left-aligned 52px column now, so every unit row
begins on the same left edge as the Delivery settings rows instead of floating ~80px right of
them (the input fields gained the width); the dialogs keep their own wider column. (b) **No more
hairlines between settings rows**: the base `.lr + .lr` border drew a line wherever two rows
touched and none across a cluster gap — lines between SOME settings, which read as arbitrary.
The cluster gaps alone carry the rhythm now.

## THE AD SETUP UX PASS (2–3 Sep, user call) — compact, one grammar, less scroll

- **Ad audio is CUT from Delivery settings** — removed from the model, refused by name
  (`DEAD_BEHAVIOUR_FIELDS.adSound`): how a player starts, muted or unmuted, is the
  integration's Player config now, per placement. Fixtures and presets shed it.
- **Content pause reads Yes / No / Auto** — "By player size" renamed on the user's call
  (`PAUSE_WORD.size = 'Auto'`), panel and refusals both.
- **Request delay (was "Render delay") rides EVERY ladder rung**, video included — behind each
  unit's own settings fold, where it always was for banners. A banner defaults to 1s as before; a
  video rung is SPARSE (absent = fires immediately), so every rung saved before the widening
  behaves exactly as it did. The remaining close clocks (skip offset, auto-hide) stay banner-only,
  refused by name on a video rung.
- **The unit fold is a two-column grid** across the ladder's width — the dead left gutter works
  now; a video unit's facts sit on one line, a banner's five on three.
- **The per-row "all placements" CTA is GONE** (it sat on every settings row, hover-revealed, and
  read as noise): ONE act at the Delivery settings foot — *Apply to all placements* — copies the
  whole break's settings, read back field by field on the change review (`suSlotToAll`), placement
  by placement. `suFieldToAll` and `.lr-all` died with it.
- **Size harmony**: inside the settings rows every control sits at the segs' 28px — the number
  fields and selects came down to meet them and widths stopped wandering (`.bhv-grid` overrides).

## THE LISTS SHARE ONE GRAMMAR (3 Sep, user call)

Both lists are five columns now: **name (with its facts as the sub-line) · Property · what it
carries · Modified · Status**. Integrations dropped the Platform and Ad setup columns (platform
joined the name's sub-line); Ad Setups dropped Assigned to (it joined the name's sub-line, and
became a filter). **Ad Setups grew the same toolbar as Integrations** — search (name, demand,
assignment) plus Property / On air / Assignment pills — through one generalised pill helper
(`FILTER_CTX`: the pills read and write whichever list is on screen; the toolbar still paints
once so the caret survives). Integrations' toolbar shed the Ad setups and Units pills, which were
engineering-flavoured facets stacked into the left edge. **Status stays**: it is the publish
plane's face, and its whole vocabulary is *On air (vN)* / *Off air* plus the amber
unpublished-changes count — `status` the FIELD died 27 Aug; this column derives from the plane.

## THE PLAYER BEHAVIOUR SHEET — MASTER-DETAIL (3 Sep, third cut on user review)

Cut one drew three segments on every row (a wall of widgets); cut two made rows quiet values that
opened inline — and both kept a COLUMN PER FIELD, which cannot scale: the user's call is that a
config may grow n fields. So the sheet is **master-detail** now: the left rail is every selected
integration's configs, grouped, Default first — a changed config wears the accent bar and dot —
and the right pane is the SELECTED config's whole form, the same rows the integration page
draws. **A new player-config fact is one more form row here and nowhere else** — never a new
column, never a wider dialog. Selection survives edits, the counted foot and the change review
are unchanged, and the dialog keeps the shared 860×529 footprint.

**Fourth cut (3 Sep, user call — "same logic as the ad sheet"):** the sheet now leads with a
**Pending changes strip above the split**, the ad sheet's exact anatomy: one row per change —
`Integration · Config`, the field, `from → to` — an × that drops it, a Clear for the lot, and
clicking a row jumps the rail to that config. The strip caps its height and scrolls inside the
fixed footprint; Review (step 2) reads the same list; Back keeps the queue. The two bulk sheets
now share one grammar end to end: quiet fields, a queue on top, review, confirm.

**The ad sheet's RHS is GONE (same day, two user pushes apart):** "Selected integrations" first
showed the FIRST ACTIVE section's resolved walk standing in for the whole surface (the forbidden
blend — recut per-section for one round), and then fell to the platform question: the cohort was
chosen on the LIST, the kicker names it, each field row states what the cohort answers today, and
the review counts every caveat before a write. The per-section walks are each ad setup's own
depth — nothing a cohort sheet can act on. The sheet is one readable column now (`.bulk-one`,
680px measure inside the shared footprint).

**Quiet values (same day):** the queue's and the review's `from → to` dropped the mono code chips
and the saturated accent — the accent already marks a changed row (the bar, the count), so the
words are neutral ink: old value faint, new value firm, a light arrow between. One value grammar,
both sheets, both steps.

**SEVENTH CUT (3 Sep, user: tab-scoped, "still feels ai slop") — the card grew up.** Pending
changes shows ONLY the open break's changes (the tab dots already say where else changes wait;
cross-break reading is Review's job — sixth-cut me showed every break's groups in nested boxes,
which was the slop). One bounded card: tinted header ("PENDING CHANGES · N" + a quiet Clear,
tab-scoped), hairline rows of field-name over `from → to`, the × surfacing on hover only, and a
five-word empty state ("No changes on this break") in place of the dashed box of copy.

**SIXTH CUT (3 Sep, user: "we need cards to show the changes — this is how enterprise software
is built") — TWO CARDS.** The settled shape: the FORM on the left (the fifth cut's fixed list —
controls always live, nothing teleports, a changed row keeps just the accent bar and a mixed row
its spread), and beside it a live **Pending changes card** in the review screen's own bounded
anatomy (`.rvw-g` groups per break, tinted headers) — so step 1's card IS step 2, growing as you
work. Every break's changes at once, each row `field · from → to · ×`; a row click opens its
break's tab (the rows ACT, which is what earns a changes-area its place); Clear all empties the
queue; the empty state is a quiet dashed frame so the space holds still. This is the AWS/GAM
"changes to be applied" panel pattern, and it replaces the fifth cut's in-row "was … ×" state.

**FIFTH CUT (3 Sep, user: "think again from scratch") — ONE FIXED LIST, change-state in place.**
The user floated Pending changes | Other settings side by side; the from-scratch answer was that
the SPLIT was the flaw: a touched field teleported between the halves — the one thing this panel
never lets a control do — and five fields never needed click-to-open disclosure. The tab is now a
single settings list wearing the integration page's own delivery-panel anatomy: **label · live
control · the row's state**. Untouched-and-agreed rows carry no state text (the control shows the
value); untouched-and-mixed rows state today's spread on the right; a changed row says so in
place — accent bar, a soft wash, "was …", an × that puts it back. A queued break-switch flip
appears as one state row ("Runs · Off everywhere · was on everywhere") so it is droppable where
the other changes are; **Reset this break** sits in the foot; the count stays on Review. A break
queued OFF dims its untouched rows one by one — never a queued row. The Pending-changes-as-a-
PLACE grammar survives only where it earns its keep: the player sheet's cross-config queue, which
navigates.

## STATUS LEFT THE TABLES (3 Sep, user call — asked twice, which was the answer)

A column reading "On air" on nine rows in ten is noise, not information. Both lists dropped the
Status column; the EXCEPTIONS ride the row's name as small chips — **Off air**, and the amber
**N unpublished** count — so a clean row costs no ink and a wrong one is impossible to miss. The
On air filter still queries all three states; the editors' header chips still state the full
truth. (Why the states exist at all: the publish plane. On air = a published version is being
served; Off air = the player is served nothing; unpublished = the draft is ahead of the air.)

## THE TOOLBARS GREW UP (3 Sep, user call)

Search widened to 340px — it is the toolbar's anchor, not an afterthought. Integrations filters:
**Properties · Platforms · Breaks (per break, on/off) · Ad setup · On air · Player configs (with
custom / default only) · Modified (24h / 7d)**. Ad Setups filters: **Properties · On air ·
Assignment · Demand (with direct deals / no direct deals / with out-stream) · Modified**. The
Breaks and Ad setup facets return from the earlier trim — the columns stayed dead, the QUESTIONS
("who runs mid-roll?", "who stands on this setup?") turned out to be the filters' whole point.

## CUSTOM PLAYER CONFIGS — DEFAULT LIVES IN DETAILS, FORKS ARE CARDS (3 Sep, user call)

The "Default" label is gone: the default player's facts are simply DETAILS FIELDS — the playback
surface and fallback media, then the three forkable facts (Playback mode, Expand MiniTV for ads,
Autoplay behaviour + volume) as one more row of the Details card. Below sits **Custom player
configs**: "+ Add custom config" in the title row, and ONE BOUNDED CARD PER FORK — the name in
its tinted header beside Remove, the three facts as the card's row. The section always stands;
empty it is five words ("None — players follow the fields in Details"). The tabbed Player config
card (below) is retired; the model, the JSON, the wizard's Player page and the bulk Player
behaviour sheet are unchanged.

## RETIRED: the tabbed player card (2 Sep; superseded 3 Sep) — one tab strip, Default first

The player split by altitude. What is the SURFACE's — autoplay, playback, fallback media —
**stayed in Details** (the user's call on review; the first cut moved them out). What genuinely
varies per placement is the **Player config** card between Details and Ad delivery: a pure tab
view — **Default** is the first tab (drawn flat, with no strip, while no forks exist), and a tab
per NAMED fork once someone customizes. Every tab shows the same three facts. **+ Add custom
config** sits top-right — the `.stab.add` slot at the tab strip's right end, and the card's
title row while there is no strip yet. Adding is naming (`askName`), and the fork is born a
photocopy of the default's values — a copy, never a link. Removing a fork (the row's last, far-
right act) lands back on Default. **No bylines anywhere in the card** (2 Sep review): the tabs
say what is default and what is a fork, so the three lines explaining it were noise.

- **A fork carries the per-placement facts** (field set re-cut same day, user's vocabulary
  verbatim): **Playback mode** (Active / Passive — replacing the day-old engagement mode),
  **Expand MiniTV for ads** (True / False), and **Autoplay behaviour** (Off / Muted / Unmuted,
  the volume % riding it where a player starts Unmuted — Autoplay left Details for the config
  card the same day). Everything else — playback surface, fallback media — follows the default.
- **Playback mode is also a DEFAULT player field** (`playback`, absent reads `active` so every
  player saved before the field existed behaves exactly as it did).
- **The model:** `key.playerConfigs` — up to 6 of `{ id, name, playback, expandInMini,
  autoplay, startVolume }`. Names are required and unique per surface (players ask by name; `Default` is
  reserved); ids (`pc_n`) are issued by the server and hold across saves, so a rename is a
  rename. Refusals name the rule: no name, a shared name, a value outside the vocabulary, the
  counted cap.
- **The publish plane carries the forks** like everything else: Save is a draft, Publish snapshots
  them, and the rail says what moved — a config appearing or leaving is one line
  (`Player configs · added/removed`), a moved field is named where it lives
  (`Player configs · Shorts feed · startVolume`).
- **The player's JSON** grows `playerConfigs` only when the surface has any — the common
  integration's JSON does not grow a field. Each entry is the three facts plus id and name;
  the player resolves a config by name and falls back to `player` for the rest.

**Same day: the switch knobs, and THE SIDEBAR IS GONE.** The break tabs' knobs sat mid-track
(the base toggle's `flex: 0 0 34px` beat the mini track's `width: 26px`; every narrowed track
now pins its own flex-basis) — they sit flush like the Direct switch now.

The sidebar was made collapsible first, and that lasted one review round: folding a 232px rail
only moved the empty space to the other side of the page. So **the nav moved into a HEADER
BAND** and the column is gone — `navMin` with it (the stored preference is cleared on load;
a header has no collapsed state to remember). The band is brand · the two rooms as tabs (icon,
name, count, accent underline for the room you are in) · the property scope, sticky at the top,
and it carries **no primary act**: each room's own lives in its page head (New integration /
New ad setup), where it stays correct without the header tracking the route. The page then gets
the full width — `main` fills it and centres past 1760px, and on the detail pages **the form no
longer caps at 860px**: it grows into the row the 260px history rail leaves, so the cards fill
the page at every width. The rail keeps `margin-left: auto` from the collapsible round, so it
stays pinned right whatever the form does. Verified: no sideways scroll at 1440 or 1024 across
both lists and both editors.

## THE TRIM (31 Aug evening, user call) — four removals, refused by name

- **The SQUEEZE-BACK SLOT IS GONE.** Its two jobs were already elsewhere: a banner over
  playing content is a break's display FALLBACK (a rung, with its own four facts), and
  the idle player's rotation is OUT-STREAM. Every former squeeze-back rotation in the
  fixtures reseeded as out-stream demand. A payload still carrying the slot — section,
  setup, or drive — is refused naming both homes. `refresh` (the rotation's own cadence)
  died with it; out-stream's schedule is its show times.
- **Max pod duration (`breakSec`) and Duration enforcement (`overrun`) are CUT** — a pod
  plays its target impressions count, and each ad runs its own length. The budget pair
  was POD-SCOPE's; the JSON never asked for it.
- **Max waterfall depth (`walkDepth`) is CUT** — one concept, one control: how deep a
  walk goes is the SURFACE's Waterfall depth (`tries`), in Ad delivery. The ops-side
  positional cut (dead rungs holding seats) died with it; the seam refusal that named
  "stops after N" went too.
- All four land in `DEAD_BEHAVIOUR_FIELDS` / the section normalizers: removed from the
  model, refused by name with where the answer lives now, from every door.

## THE PLAYER'S JSON (31 Aug, AD-JSON-SCOPE.md is the record of why) — BUILT, phases 1–3

The player team's target `ads` JSON, folded into both rooms without a new screen. Eight
additions; the scope doc carries the reasoning, this is what exists:

- **DIRECT** — each break's own deal (1 Sep, twice reshaped on user call: global → per
  break, then list+cap → ONE deal, uncapped). It leads the break's zones on screen because
  it leads the walk: tried before the primary each time the break fires. A second deal and
  the old session cap are refused by name; with nothing set, the zone is one quiet add
  link. The integration sees a counted fact leading the resolved waterfall — never an
  editor — `tries` never cuts it, and the break's Direct switch (drive) turns it off per
  surface. Direct does not reach out-stream: it is break demand, and out-stream is not
  a break.
- **TIERS settle the ask.** The PRIMARY is a position, not a preference: the drive's `ask`
  now filters and orders the FALLBACK only, and the control is relabelled **Fallback
  order**. Waterfall depth and tries keep their meaning (counts over the walk, primary
  included — a try is a try).
- **MID-ROLL BREAK GROUPS** — up to 3 per placement, each its own cadence AND its own
  ladder (`slots.midroll.groups`; group 1 doubles as the slot's own rungs/behaviour, so
  every single-group path reads what it always read and old snapshots normalize
  unchanged). At ONE group no group chrome renders at all; at two+, tabs in the
  placements' own grammar, each wearing its cadence. (The interval shape briefly carried
  a **Break cap** (`stopAfter`) — cut 1 Sep, user call: a cadence runs the video out, and
  at set positions the positions are the cap; refused by name now.) Every group
  answers the seam for itself: one dark group is one dark break, refused naming the group.
  Cross-group warnings are counted (total ads a stream; two groups landing breaks under a
  minute apart).
- **THE GUTTER IS THE MAP (31 Aug, user call).** An open slot is a stack of zone rows,
  each zone's name set in the once-empty left column under the break's own name —
  GROUPS · AD SOURCES · DELIVERY SETTINGS as a fixed rail the eye scans, dashed
  hairlines between zones, the inline eyebrow rows gone. Direct reads the same way
  (AD SOURCES · SESSION CAP). Same content, one grammar, no dead space.
- **EVERY UNIT'S OWN SETTINGS, one fold per rung (reworked 31 Aug on user review).**
  Every filled rung wears a quiet chevron; open = that unit's panel, one decision per
  line: **Pause content** (Yes / No / By player size — EVERY unit's answer now, video
  defaulting Yes, banner No, exactly the JSON's per-unit `pause`), **Requests through**
  (the tag's template, attachable right where the unit sits — a tag fact, so the toast
  counts every setup it reaches), and for banners **Display slot** plus three clocks in
  layman words: **Appears after · Close button after · Auto-hides after** (close greys
  when content pauses — the one conditional the player's own contract names;
  hide-before-close refused). One fold open at a time; a fresh pick opens its own panel;
  a closed rung wears a chip only for what differs from its default (`pauses video` /
  `over video` / `tpl GAM_2`). The page slot and clocks stay banner-only — a video ad
  runs its own length in the player's frame, refused by name otherwise. **Enterprise
  vocabulary since 1 Sep (user call, settled in two passes — raw JSON keys were tried
  and overruled within the hour):** the unit fold reads Content pause · Ad slot ·
  Render delay · Skip offset · Auto-hide · Request template; delivery settings read
  Start offset · Max wait · Min content playback · Impressions per break · Request
  timeout · Total timeout · Impression cap (out-stream) · Prefetch · Hide during
  in-stream. **Every JSON-mapped row names its key in the hover** ("…(JSON: skip)"),
  so the panel↔player mapping survives without code-words on screen; panel-native
  fields keep their words — they have no JSON key to wear.
- **OUT-STREAM** — a fifth slot, the squeeze-back's rotation anatomy outside playback,
  plus one switch of its own (`hideOnInStream` — step aside while a video ad has the
  screen). No refresh (its show times are its own schedule), no depth, nothing to drive
  beyond its switch.
- **BREAK FILL TIMEOUT** (`fillTimeoutSec`) — a cap on the whole ladder's asking, one row
  under the Tag timeout it argues with. The unreachable tail warns, counted: "10 tries ×
  1500ms is 15s, but the break gives up at 12s — the last 2 tries would never run."
- **REQUEST TEMPLATES** — authored in the panel now (reverses the 20 Aug "no interface"
  call, on the user's word: the JSON names several and a unit's `tpl` picks, so the choice
  needs a home). One collapsed row at the FOOT OF THE SETUP EDITOR (re-homed 31 Aug, user
  call — a card under the listing was disjoint): name · provider · macro URL · used-by
  counted, still global objects, said so in the row's own words. The macro vocabulary is the player team's, validated fail closed
  ("`[REFERER]` is not a macro the player fills"). Assignment is template-first ("assign
  tags…"); **Standard is absence** — a tag that never chose stores nothing, and a rung
  wears a small `tpl` flag only when its choice is news. Tags resolve live, so a template
  edit reaches traffic with no republish.
- **PLAYBACK TIMING, re-homed twice on user review (31 Aug):** `minContentSec` (the
  JSON's minPreRenderTime) is the PRE-ROLL's own head start — a slot behaviour, drawn as
  **Video plays first [n] sec** in the when-cluster; `prefetchSec` readies a break that
  arrives mid-playback — a MID-/POST-ROLL behaviour (**Prefetch [n] sec early**); the
  player keeps only `expandInMini` (since 2 Sep **Expand MiniTV for ads**, a per-config
  fact in the Player config card). The first cut had all three on the player behind a
  fold — wrong owner and a foreign widget; both corrected.

- **THE CREATION WIZARD (1 Sep, user call).** New integration is a three-step modal —
  **Source › Details › Ad demand**, the YouTube-upload grammar (stepper, Back/Next,
  visited steps are doors) — and the old `#keys/new` page-form is gone (the route lands
  on the list with the wizard open). Source is *start fresh* or *copy an existing
  integration* (player, break switches and drive decisions come along); Details is the
  identity card (name, property, platform, domains/package, player template when fresh);
  Ad demand only PICKS the source — *copy an existing ad setup* (photocopied when held,
  honouring 1:1; attached directly when free; a copied integration preselects the
  source's own) or *start empty* for ops to arrange. Ladders are never edited in the
  wizard: two rooms stay two rooms. **Nothing exists until Create** — one POST carries
  the whole shape; a held-setup photocopy made just before is deleted again if the create
  is refused, so cancel and refusal both leave the world untouched. Born off air, landing
  back on the list with a named toast; refusals jump the wizard to the offending step.

**The player's door grew the same shapes:** `GET /panel/live/:key` now carries a `direct`
block on each ladder slot (`{walk}`, absent when empty or switched off), a `unittpl` map resolved from the tags'
chosen templates (walk entries name theirs as `tpl`), banner facts on display walk
entries, and `groups` on a multi-group mid-roll (group 1 stays the slot's own
`behaviour`/`walk`, so a one-group player reads nothing new).

Phase 4 — the written player contract (the walk rules a config consumer must obey) — is
still open, as it has been since POD-SCOPE.

**Scenarios** — `POST /panel/mock/reset {scenario}`, or `npm run panel:demo` / `npm run panel:scale`
with the server up:

| scenario | integrations | what it is for |
| --- | --- | --- |
| _(none)_ — `demo` | 7 | the walkthrough world: one of every shape, small enough to read whole |
| `scale` | 67 | the demo seven **unchanged**, plus 60 generated on top |

`scale` exists because paging, select-all-matching and "does this filter actually narrow anything"
cannot be judged at seven rows. It is additive on purpose: `key_1`–`key_7` keep their ids, names and
slots, so a bug found at scale reproduces in the demo world. The 60 cycle five recognisable slot
shapes across property × platform × surface, so every bulk action has a real cohort to act on.
Deterministic — same names and ids every rebuild. In `demo`, six surfaces are seeded **on air** and
ET Desktop ArticleShow is deliberately off, so both states are on screen from the first load.

## Bylines: facts on screen, explanations on hover (24 Aug night, platform-wide)

The panel had accumulated explanatory prose beside controls that already said their own
name — zone headers restating who owns what, "how it behaves" bylines, page subtitles
explaining the model. **The rule, applied across every surface and to be held in every
future change:** a control carries its label and its counted fact; the *why* lives in its
`title` hover; nothing is explained twice on one screen. So zone headers are bare nouns
(**Direct** / **Indirect** / **Delivery settings** in the ops room — *Indirect* since
1 Sep, the word that pairs with Direct; a rotation keeps **Ad sources**, having no Direct
to pair with; the integration's Ad delivery
card dropped both headers entirely on 25 Aug), the demand reference is a chip
plus who-and-when, dialog notes are one clause, and page subtitles state what a list is,
never how the model works. Measured after the sweep: the integration editor's all-lens
view reads 205 words (was ~380), the ad setup editor 128.

## How a break behaves: ONE FIXED LIST (25 Aug night, user call + scope audit)

Asked to handle a slot's behaviour and timing "in a more mature and clean way", starting
with an audit of the model against the scope. **Coverage is complete**: every field
POD-SCOPE names (its fifteen, per break type), LEVERS-SCOPE's local-override set and
AD-SETUP-SCOPE's split are in the model — 12 fields per break × 3 break types, 5 for the
rotation, 15 session rules per placement. What the audit did turn up:

**One real defect, caused by the disclosure itself.** `breakSec` and `overrun` were hidden
whenever `Ads in a row = 1`, on the assumption that every fill field is inert at one ad.
They are not: POD-SCOPE §4 gives `'strict'` asks a "nothing longer than what's left"
hint and discards an oversize arrival unplayed, so a 60s budget caps a **single** ad and
falls to the next rung. A live length cap on nearly every break in the system was
unreachable in both rooms. Both fields are now always live; `nextAd` and `podBanner`
genuinely need two ads and only those two grey out.

**Three gaps against scope, none of them UI — recorded, not fixed:**
1. **The player contract was never written.** POD-SCOPE phase 4 said its seven walk rules
   land in a spec the config consumer obeys. There is no panel API spec at all
   (`API-SPEC.md` is the v2 direct-deal platform), so the panel stores `nextAd` /
   `overrun` / `podBanner` and nothing documents what a player must do with them.
2. **The pod's viewer half is gone.** POD-SCOPE leaned on `podPosition` ("Ad 1 of N") as
   the viewer's cue that a break holds N ads, plus a warning when pods ran with the
   countdown hidden. Both died with the Player card on 25 Aug. A 3-ad pod now has no
   viewer affordance anywhere in the product.
3. **AD-SETUP-SCOPE open question 4** — who owns the preset vocabulary — still has no
   answer, and the presets ship unowned.

### TWO SELECTORS AND ONE BREAK (26 Aug — the card's settled shape)

Three user calls in one sitting, each removing a layer: **no modal** ("keep it in the ad
delivery only"), **no chips** ("not intuitive — do something like a dropdown"), **no
stacked breaks** ("only one slot visible at once… less clutter"). What is left is a card
that asks two questions in one row and then shows the answer to them.

> **Editing [ Default | All sections ] · Break [ Pre-roll · on ]** — and everything below
> belongs to that pair. Save is the commit, as it is everywhere else on this page.

That last clause is what removed the machinery. There is no Apply, no Cancel, no tick
boxes, no "leave as is" state: the card is a form, edits are form-local until **Save
changes**, and the save dialog's counted diff is the review it always was. The scope IS
the change list.

- **A scope is one choice, so it is one control.** `selectHtml`, the same select every
  other choice uses, listing the sections plus `All sections (N)`. A section that differs
  from Default carries a dot in its option. On the **64 of 67 integrations that have one
  section** the Editing selector does not render at all.
- **AN INTEGRATION OPENS ON ALL ITS SECTIONS** (26 Aug, user call). The surface is what
  someone came to see, not one placement of it, so the landing view is every section's
  real walk side by side under **What runs today**. `'all'` resolves to the single section
  on a one-section key, so nothing changes for the 64.
- **The plan seeds from what the sections in scope ALREADY SHARE** — their longest common
  run of companies, not one of their walks. On `as_1` that is `IMA · CAN · GPT`: three
  rows rather than six, true of both sections, and the natural starting point for "make
  these the same". Changing the scope re-seeds a plan nobody has touched, because until it
  is touched it was only ever a suggestion — pinned by measurement: landing on a
  multi-section key writes no `order` and no `bhv` anywhere.
- **The break picker carries its own overview.** Choosing one break used to mean losing
  sight of the other three, so each option states its state —
  *Pre-roll · on · Mid-roll · on in 1 of 2 · Squeeze-back · nothing to run*. Opening the
  picker IS the summary of the whole surface, and the fold machinery
  (`KEY_SLOT_OPEN`, `toggleSlotOpen`, the chevron) went with it: the selection is the
  disclosure.
- **The card has two honest states, chosen by the scope — never by a value.**
  - **One section** → the resolved walk itself: real positions, drag, per-position
    switches, the stop line. The only view that says what actually runs.
  - **All sections** → positions stop lining up across different ladders, so the walk is
    a list of COMPANIES on the left and **what each section runs on the right**
    (user call: "what runs today can be shown on the right side since we have space").
    With the answer beside the control instead of under it, the fold that hid the plan
    stopped earning its place.
- **It answers before it offers.** A seeded plan is a starting point, not a diagnosis:
  until a step is edited nothing is written and no shortfall is warned about, and the
  right-hand heading reads **What runs today**. The first edit flips it to **Where it
  lands** and writes through to every section in scope.
- **Timing is common to the scope.** Agreed values show; disagreed ones show **mixed**
  with an empty control, and setting one gives them all the same value. `local` counts how
  many bent it; the pace note counts the scope as a range (*"5–8 tries × 1500ms"*),
  because one section's number can never stand for several.
- **One switch, whole scope.** Mixed goes ON, all-on goes OFF, and a section with nothing
  live to run is passed over and named rather than lit into darkness.
- **What was argued against and kept anyway, on the evidence**: deleting the inline walk.
  The resolved walk is the only place a position, an ops-locked rung or the stop line can
  be seen or touched, and a dialog round-trip for a one-section change would have made the
  common journey slower. The two-state card is what fell out of that argument.
- Gone with the three passes: `secAcrossOpen`/`renderSecAcross`/`secAcrossApply` and the
  whole modal, `KEY_SECS`/`keySecPick`/`secChipsHtml`, `KEY_SEC`/`keySecSet`/`secTabsHtml`,
  `KEY_SLOT_OPEN`/`toggleSlotOpen`/`unitRowHtml`/`secOpenPanelHtml`. Arrived:
  `KEY_SCOPE`/`keyScopeSet`, `KEY_SLOT`/`keySlotSet`/`slotPickLabel`,
  `cardControlsHtml`/`breakPanelHtml`, `planFor`/`planLanding`/`planApply`/`planRowsHtml`,
  `secCommon`/`secBhvSetAll`/`secBhvResetAll`.

### BULK TAKES THE SAME CHANGE LIST — and a rule that had expired (26 Aug)

`policyFields` returned 400 by name — *"how ads behave lives in the ad setup now"* —
pinned by a passing test. **That rule was written on 24 Aug, when behaviour lived only in
the ad setup and one edit there really did reach every attached integration. Local
overrides (25 Aug) ended that**: when a break falls, ads in a row, ad sound, the per-try
wait and the walk depth are the SURFACE's to bend, and no ops edit reaches them. The
refusal was therefore blocking the only behaviour bulk should ever have been allowed to
write.

- **Lifted for `SLOT_LOCAL_FIELDS` only.** Yield mechanics are still the placement's,
  still refused, still by name (*"“where the next ad comes from” belongs to the ad
  setup"*), and a bad value is one refusal **before anything is touched** rather than N
  identical per-integration ones — a bulk write never half-lands.
- **The cohort screen draws the same ticked rows** the section modal does
  (`bulkBhvAdapter` → `behaviourRowsHtml`), so there is one grammar at both scales. Each
  write is a sparse local override on every section of every selected integration; the
  review names it, and the shared ad setups never move. Measured: pacing two integrations
  left the third and `as_1` itself untouched.
- Three cases replace the one that was pinned (`79 passed`, was 77).

**Named divergence, to be closed next:** the ops room still has the per-field
`all placements` push. Its twin of this modal — across *placements*, writing the baseline
rather than an override — is the next step; until then that room would otherwise have no
cross-placement act at all. **And undo still does not exist** (`OPS-SPEED-SCOPE` scoped
it, nothing was built): this change multiplies blast radius to sections × fields ×
integrations, and the only brakes today are the pre-apply table here and the bulk sheet's
review screen.

### The rule the screens now hold

> **The layout is fixed by BREAK TYPE and never by a value.** A control that cannot apply
> right now stays in its row, greyed, saying why on hover. Nothing appears, nothing
> vanishes, nothing moves under the cursor.

This **reverses POD-SCOPE's progressive disclosure** ("the whole trick is progressive
disclosure, and scope is position") on the user's call. Four different reveal grammars had
grown around one idea — hide whole rows (`podAds`), reveal a number inline (`start`,
`wait`), reveal extra segments on the same row (`companions`, `adjacentRefresh`), swap a
row's control type outright (`mode`) — and one of them was hiding a live control. Type-based
variation stays and is not a reveal: a mid-roll has no "plays at start" because that is what
the break IS, and it is stable.

- **One flat list, one deliberate order, no group headings** (user call over a three-group
  IA): when it interrupts → what the viewer hears → what it takes of their time → how hard
  we work to fill it. A break is one idea, not three.
- **Mid-roll cadence is one decision in two shapes, so both shapes are always on screen**
  and the unchosen one greys — where the editor used to swap one row's control type.
- **ONE RENDERER, BOTH ROOMS, restored.** The integration's Timing fold was a parallel bar
  of four `<select>`s ("everything cannot be dropdown"); it now calls `behaviourRowsHtml`
  with `only` set to the locally-overridable fields, so both rooms draw identical rows with
  the right control per field — segments for two or three choices, number fields with units
  for numbers, text for cue lists. `qkOpts` and the `qk` bar are deleted.
- **`walkDepth` is excluded from the fold on purpose** — the walk list's stop line already
  owns it, and one concept never gets two controls on one card. For the same reason the
  integration's pace row prints the arithmetic alone (`8 tries × 1500ms`) while the walk
  foot carries the counted total; the ops room, which has no walk foot, keeps both.
- **"Tag" is gone from pacing vocabulary** — `Each try waits`, `1500ms a try`, `8 tries ×
  1500ms`. "Try" is true in both rooms and matches what the walk list already counts.
- **The session group took the same rule**: companions' backfill/persist and adjacent
  slots' interval/viewability are always drawn, greyed with their reason when off.
- Storage, validation and every rule case are untouched: this is presentation only
  (`77 passed`).

## THE DRIVE + THE 1:1 PROMISE (26 Aug, DRIVING-SCOPE.md is the record of why)

**Manager review, via the user, in the manager's own image:** driving a car you get two or
three controls — a switch and preconfigured gears; anything finer means stopping the car.
Ad delivery had become a workshop (drag positions, mute tags, bend numbers). Two decisions
rebuilt it, and **where this section conflicts with anything below, this section wins**:

1. **One integration, one ad setup — enforced both ways.** The setup is a surface's own
   workshop now: attaching a setup another integration holds is refused naming the holder,
   the picker offers **attach a copy** (`POST /panel/setups/:id/duplicate`), duplicating an
   integration copies its setup, and every fixture — demo and scale — is 1:1. With one
   consumer per setup, "muted here" and "off in the setup" collapsed into one act, done in
   the setup's own ladder.
2. **Ad delivery is the DRIVE: per break, a switch and preconfigured decisions.** The
   on/off switch (writes every section, skip-and-name) · **Ad partners** — a CHIP STRIP
   (27 Aug, §14: numbered by ask position, drag to reorder, each with a switch; it
   replaced the generated dropdown, whose two shapes were a dropdown's limits rather than
   the model's) · **Waterfall depth** 1/2/3/Full · pre-roll **Ad start** right away /
   after `[n]` seconds the surface sets · **Target impressions count** 1/2/3. A
   squeeze-back takes turns: switch only. `use for every break` stamps the first two
   across breaks (both speeds); the bulk sheet's `driveFields` writes the same across a
   cohort. The Editing-sections scope picker died: a decision applies to all sections.
   - **The labels took three passes, all user-called (26 Aug).** First `Tries` / `All` —
     the user asked *"what is Tries here?"*, then said `All` was not communicative. A
     layman pass gave `How many to ask` / `Everyone`; the user's final call is the word
     their team and the industry actually use: **`Waterfall depth`** with **`Full`** as
     its open end. The stored field stays `tries`, and the counted FACT still reads
     "3 tries · up to 4.5s" — a number with its consequence beside it needs no
     relabelling; a bare column header did. Every row carries its explanation on hover
     (`accRow(l, c, why)`) rather than as a byline, per the bylines rule.
   - **The switch wears a two-word eyebrow, `RUNS`** (user: *"the switch on the top left
     is not at all clear what it means, don't add too much text as byline"*). It was the
     only control on the card with no label while every row under it had one; the eyebrow
     borrows the `Break` selector's own grammar one line above, and the *why* stays on
     hover. No byline was added.
   - **A stranded decision stays READABLE in the control.** The Who menu was generated
     from the companies present, so a saved `only:gpt` on a break that lost its GPT
     matched no option and rendered as "Choose…" — hiding what was set. It was listed as
     *"GPT only — none here"* instead. *(Superseded 27 Aug: the chip strip draws every
     partner, so a stranded one is simply a chip greyed in place with the reason on it —
     the failure mode cannot recur.)*
   - **A rotation is not a waterfall**: the squeeze-back's What-runs line reads
     "3 banners · taking turns" with `·` separators, never "N tries · up to Xs" — that
     arithmetic does not exist for banners that take turns, and inventing it would break
     principle #1.
   - **THE BREAKS ARE TABS, not a dropdown (26 Aug, user call — this reverses the
     dropdown decision recorded below).** The select made the card's own subject a value
     inside a control, and cost an open-and-read to see the other three. Four is few
     enough to sit side by side, and **the ops room already tabs its placements** — so
     both rooms now pick a subject with one grammar (`scope-tabs`/`stab`) instead of a
     tab in one room and a select in the other. The dropdown's one virtue was that each
     option carried its own state ("Mid-roll · on in 1 of 2"); tabs keep that and drop
     the opening — every break wears a **state dot** (filled = running, half = on in
     some sections, hollow = off here, dotted+dim = nothing to run) with the words on
     hover. `slotPickLabel` gave way to `slotState`/`slotStateWords`/`breakTabsHtml`.
     Note the earlier "no chips — do something like a dropdown" call was about the
     SECTIONS scope, which no longer exists as a control at all.

- **Stored as INTENT, resolved live**: `key.drive`, per break, sparse —
  `{ ask: ['gpt','ima','can'], tries, start, deferSec, podAds }` (`ask` replaced `who`
  on 27 Aug — see §14). Ops adding a tag next week joins the walk the decision already
  describes, and the control never reverse-engineers a ladder — no `ask` (absence) is
  always true, so there is no Custom state.
- **Resolution** (`driveWalk`, mirrored client-side): no `ask`/`tries` → exactly the old
  walk (the setup's positional `walkDepth` cut first, dead rungs holding their seats —
  still pinned). An `ask` reorders, so positions lose meaning and the setup's depth applies
  as a COUNT; `tries` is always a count of real tries, cut last.
- **Impossible decisions fail loud, never dark** (user call — an empty break is silent
  lost money): a `who` NO section can honour refuses the save that makes it, by name; one
  SOME sections cannot honour falls back there to the setup's own arrangement — warned by
  section name on save, flagged `fellBack` in every view, with the `add GPT →` door. An
  ops edit that strands a saved decision warns on the OPS save ("…falls back to your
  arrangement") and the break keeps serving the arrangement; an unrelated later save of
  the stranded key warns rather than blocks (`driveTouched`).
- **Local overrides are REMOVED, not hidden** — `muted`, `order`, `bhv`,
  `SLOT_LOCAL_FIELDS`, the locked-toggle rendering, divergence counts, and the bulk
  positional/override acts (`slotRungOn/Off/Move`, `policyFields`, cohort `setup` attach)
  all 400 by name. The ops room instead names the surface's decision on each slot
  ("asks GPT only · 3 tries") — nobody debugs a ghost.
- Gone by name: `partnerLadder`, `walkRowsHtml`, `locToggleRung`, `secSetDepth`, the plan
  machinery (`planFor/planApply/planRowsHtml`), the timing fold (`bhvReadHtml`,
  `secBhvAdapter`, `secCommon`, `secBhv*`), `KEY_SCOPE`/`keyScopeSet`, `TAIL_START`,
  `bulkSecLadders`/`bulkLadderRowsHtml`, `setupTabHtml`. Arrived: `driveOf/driveSet`,
  `whoOptions`, `driveStampAll`, `clientDriveWalk`, `driveControlsHtml`/`driveConsHtml`,
  `bulkDriveRowsHtml`, server `DRIVE_FIELDS`/`normalizeDrive`/`driveWalk`/`duplicateSetup`.
- This closes AD-SETUP-SCOPE open question 4 (who owns the preset vocabulary) by
  construction: the menu is generated, so nobody owns a preset list.

## TWO ROOMS — the model (24 Aug rework, AD-SETUP-SCOPE.md is the record of why)

Two teams work this platform, so the panel is two rooms. **Product teams live in
Integrations** and control everything about their surface; **ad ops live in Ad Setups** and
own everything that touches demand. The one rule, now in three parts:

> **Ad ops own THE ADS** — what can fill each break and how that break behaves (the Ad
> Setup) · **the integration says WHETHER it runs** (its switches), **how much of the
> ladder it uses** (local mutes and order) and **when its breaks fall** (local behaviour
> overrides) · **its PLAYER says what the viewer sees**, ad chrome included.

```
Integration =  identity + ONE player + ONE Ad Setup
               + an overlay per placement                            [product-owned]
Player      =  how this surface starts a video: autoplay (+ volume),
               playback mode, fallback media — 3 fields, key-level,
               living in the Identity card
Overlay     =  4 slot SWITCHES + local use (muted rungs, own order,
                 and a SPARSE behaviour override per slot)
Ad Setup    =  one surface's demand WITH its placements (25 Aug): up to 5 named
               sections — Default first — attachable to 1..N integrations,
               each placement holding                                [ops-owned]
                 · per slot: a ladder (or squeeze-back rotation) of Ad Tags
                 · per slot: HOW THAT BREAK BEHAVES — when it falls, how many
                   ads, its budget and walk, how long each tag waits
                 · once: what a whole SESSION may take — caps, overlay
                   schedule, delivery
Ad Tag      =  name + type (video | display) + provider + a GAM ad unit or endpoint
```

- **AD BEHAVIOUR MOVED TO THE AD SETUP, ON THE SLOT (25 Aug, user call: "move the ad
  behaviour to the ad setup itself… every slot in a section can have its behaviour
  locally, so no need for a separate ad behaviour at a global level").** The split that
  makes this work is one question per field: **does it describe the ADS or the PLAYER?**
  When a break falls, how many ads fill it, its budget, its walk, how long each tag waits
  → the ad setup, on the slot. What the viewer sees while an ad runs — countdown,
  "Ad 1 of N", ad sound, click target, pause ad, seek-past-a-break → the **Player**, in
  the integration. Nothing is left over, so the third object ("Ad behaviour") stopped
  existing rather than being moved somewhere quieter.
  - **The prefixes died with it.** One object describing four units needed
    `preRollPodAds` / `midrollPodAds` / `postRollPodAds`; behaviour living ON the slot
    needs `podAds`. Fifteen pod fields became five, four times over, and a slot only ever
    shows the fields it can have — a mid-roll has no "plays at start", a rotation has no
    pod. The full field map is `SLOT_BEHAVIOUR_FIELDS` + `PLACEMENT_RULE_FIELDS`.
  - **A new placement is a CLONE of Default** — its behaviour and its ladders — so it
    starts from something that works and what differs is an edit you can see. Enforced
    server-side too: a placement that arrives without behaviour inherits Default's, and a
    partial patch never resets what it did not mention.
  - **A cross-room check stays counted:** pods are the setup's and the countdown is the
    player's, so "3 ads in a row with the countdown hidden" can only be seen by the
    integration — and that is where it warns, on save.
  - **Cohort rule-editing is gone and needs no replacement:** one setup edit already
    reaches every attached integration, which is the whole point of the ops room. The
    bulk sheet's rule tabs became a **Player** tab; `policyFields` is refused by name
    (*"how ads behave lives in the ad setup now"*). What remains per-integration in bulk:
    publishing, setup attach, slot switches, positional acts, and the player.

- **SECTIONED SETUPS (25 Aug, user call: "ad sections in the ad setup itself, one ad
  setup per integration").** The placements moved INTO the setup: ops define the shape
  (Default + named placements like a Shorts feed), and an integration attaches exactly
  ONE setup at the key level — its placements become the page's sections, each overlaid
  with this surface's own switches, forks and local use, **matched by placement name**.
  Sharing 1..N survives as a union: two surfaces of one shape attach the same setup and
  each runs the subset it wants (Desktop simply never switches Shorts on) — the 2am
  one-act fix reaches both. The honest trade, named in SECTIONED-SETUPS-SCOPE.md: adding
  a placement is now the ops team's act (a placement without demand can do nothing);
  product's "+ Section" is gone. Renaming a placement migrates every attached overlay
  with it; removing one that still runs live anywhere is refused naming the surface
  (`"Shorts feed" still runs live on TOI Mweb VideoShow — switch it off there first`);
  attaching a setup keeps overlays whose names match, drops the rest, named; an overlay
  naming a placement the setup lacks is refused with where to fix it (*"placements live
  in the ad setup now; ad ops add them there"*).

- **LOCAL BEHAVIOUR OVERRIDES (25 Aug, user call).** The setup's placement sets the
  baseline; a surface may bend the **"when and how much"** fields on any slot —
  pre-roll at start/deferred (+ seconds), mid-roll cadence, ads in a row, per-tag wait
  (`SLOT_LOCAL_FIELDS`). Everything else on a slot is yield mechanics (break budget and
  overrun, the next-ad walk, banner position) or session-wide, and stays ops': override
  those everywhere and the shared setup stops meaning anything, which is the reason the
  ops room exists. An ops-only field sent from a key is **refused by name, in the UI's
  words** (*"“Default” cannot set where the next ad comes from on its midroll — that one
  belongs to the ad setup"*).
  - **Sparse, keyed by field** — only what was deliberately bent is stored, so a later
    ops edit to anything else still lands. Exactly how muted rungs and walk order already
    work. Pinned by test: bend `podAds`, then ops change the cadence and the pace, and
    the surface takes both while keeping its pod.
  - **Held to the same bounds, in the same words** — a local value runs through the same
    normalizer merged against its baseline, so `podAds: 4` is refused here as it is there,
    and an empty cadence is as incomplete on a surface as in the setup.
  - **Dropping an override is not "setting it back"** — the field starts following the
    setup again (`use the setup's`), and a cadence drops with its partner fields because
    it is one decision in two.
  - **Ops see it counted, per field**: `divergence.bentSecs` and `bentByField` alongside
    the existing reordered/muted counts — nobody debugs a ghost.
  - The counted wait follows the LOCAL pace: *"6 rungs × 2500ms is a 15s wait"* warns
    from what this surface really does, not from what the setup says.
- **NO AGGREGATE LENS (25 Aug, user call).** The old "All sections" lens is **removed for
  good**: it was a second complete rendering of one concept — counted segs instead of
  toggles, its own writers, its own mental model — and at scale only **3 integrations in
  67** had more than one placement to aggregate. Its writers went with it
  (`stripSlotSet`, `stripRungSet`, `stripRungMove`, `stripTailSet`, `stripPosStats`).
  Cross-integration cohort work lives in the bulk sheet, which is where "change many
  things at once" belongs. Sections are TABS (see the card above) — an editing scope,
  never an aggregation.
- **Player setups and ad rules are no longer identities** — no list, no name, no used-by.
  The old three shapes live on as creation **presets** that stamp values once (a
  photocopy, never a link): the **rule presets now stamp a new ad setup's placement
  behaviour**, the **player presets stamp a new integration's player**. Both edit in
  place with field-level diffs in the confirm and in the activity log — behaviour on the
  placement (`PATCH /panel/setups/:id/sections/:index/behaviour`, logged on the setup with
  its counted blast radius), the player on the integration
  (`PATCH /panel/keys/:id/sections/:index/player`). The matching `…/sections/:index/rules`
  route on a key is **removed, not hidden** — 404, pinned by test. Editing an inheriting
  placement's player forks it; Default stays untouched.
- **THE PLAYER CARD IS GONE (25 Aug, user call — the last of three moves in one day).**
  It was a card with a live frame, then a card with a state strip, and now **no card at
  all**: the panel configures ADS, and most of what sat there belonged to the publisher's
  own player. **Removed from the model, not hidden** — preload, cellular quality cap,
  controls/seek, out-of-view docking, end-of-video, ad countdown, "Ad 1 of N", ad click
  target, pause ads, seek-past-a-break, and their vocabularies (`PRELOAD`, `CONTROLS`,
  `OFF_VIEW`, `END_OF_VIDEO`, `QUALITY_CAP`, `CLICK_TARGETS`). Two survivors, by the same
  question the whole model turns on:
  - **AD SOUND describes the AD, so it went to the SLOT** — `adSound`
    (muted / "tap for sound" / with sound) is now a slot behaviour field in the ad setup,
    on pre/mid/post-roll (a squeeze-back is a banner: no sound to decide), **and it is
    locally overridable**, so it also appears in Ad delivery's quick bar — one dropdown to
    flip one break's loudness on one surface, without opening the setup.
  - **The rest describes the SURFACE, so it went to IDENTITY** — autoplay (+ start volume),
    playback mode, fallback media, as three fields on the row under Domains. So the player
    stopped being per-placement too: what genuinely varied by placement was ad sound, and
    a slot field is more precise than a forked player ever was. `PATCH /panel/keys/:id/player`
    replaces `…/sections/:index/player` (404 now, pinned by test), the fork/inherit
    machinery for player is deleted, and the cross-room "countdown hidden with pods"
    warning retired with the countdown.

  An integration page is now **TWO cards: Identity → Ad delivery.**
- **The strip** heads every integration: each unit's switch counted across all sections
  ("on in 2 of 3"), one act reaching every section with each touched section named; the
  **"Fills from"** reference line (setup name, counted demand, who last changed it, a
  read-only View, a Change picker); and a one-line rules summary naming which sections
  differ.
- **The integration never holds a ladder.** Every demand fact on it is counted from the
  setup the section resolves to ("3 rungs behind it"), and the ladder is one read-only
  click away — transparency without control.
- **The seam fails closed, with names, both directions.** A slot cannot switch on without
  an attached setup carrying live demand for that family (the refusal names the setup and
  slot); a setup cannot be deleted while attached, nor have a family emptied — or its last
  live rung switched off — while a live section runs that slot (the refusal names the
  sections). Attaching re-runs the check for every switched-on slot. Ops edits that pass
  apply immediately, warned with the counted blast radius ("Applies immediately to 12 live
  integrations").
- **A shared setup is the ops team's one-act fix**: switch a rung off in it and every
  attached integration stops calling that partner instantly. This deliberately reinstates
  a shared demand object (shared waterfalls were removed 20 Aug) — the force is org
  ownership now, not control dedup.
- **A live integration's Default needs one unit on; a paused one may sit fully off** — the
  draft state a new surface lives in until ops attach demand. New integrations start
  paused, stamped from a preset, everything off.
- **LOCAL OVERRIDES (24 Aug late, LEVERS-SCOPE.md is the record of why):** ops own the
  ladder's *content* and its *kill switch*; each section owns its *local use* — `muted`
  (rungs this surface skips, here only) and `order` (this surface's walk), keyed by tag,
  never by index. A rung ops kill in the setup is off everywhere and untouchable from the
  product room; a rung ops add later joins at the end of a local order. The pool stays
  terminal by construction; a rotation takes mute only. Fail-closed extends: a switched-on
  slot whose local walk is empty is refused naming what did it, and the ops seam checks
  each attached live section's own walk — an edit that darkens one locally-muted surface
  is refused naming exactly that surface. The setup editor counts the divergence
  ("locally reordered on 4 · rungs muted on 7", per-rung "muted on N").
- **AD DELIVERY IS THE WALK, DRAWN AS IT FALLS (25 Aug night — the card's final shape,
  arrived at over three user calls in one evening).** The review that started it:
  *"the actual quick decisioning is not being reflected due to all this clutter"*. This
  room asks two questions about a break — **who runs here** and **who is asked first** —
  and the card had been answering a third nobody asked: *which of these seven ad slots?*
  Ad ops hand out slots, and seven of the ten on `as_1` Default's pre-roll all belong to
  IMA, so a row-per-slot drew ten rows, two zone headers, a five-fact byline and two link
  acts around a decision it made undoable. **Named ad units are gone from this room for
  good** — they are the ops room's vocabulary and this room cannot act on one.
  - **The route there is worth keeping, because two shapes were tried and rejected.**
    First **one row per company** (IMA · GPT · SLike · CAN, four rows, drag to reorder):
    it made "put GPT first" one act, but it could not say *which* waterfall each company
    held, and "switch off everything past 4" had no expression at all — the cut runs
    straight through IMA's seven. Adding a horizontal **walk strip** to answer that put
    two views of one ladder on one card, and the user called both problems: *"the ladder
    is best seen as vertical"* and *"I'm not sure the colour is how intuitive"*. Both
    right. A waterfall falls, so drawing it sideways fights the thing it depicts; and
    colour as the SOLE signal is a legend to decode, which is why the provider badges
    work (they carry text) and the cells did not.
  - **So: ONE VERTICAL LIST, and it is the waterfall.** Position, switch, company —
    straight down the page, in the order the player really asks. No colour language is
    introduced at all: the badges keep the names they carry everywhere else. Three acts,
    one list: switch a position off (here only), drag a position up or down, or move the
    stop. Never a fourth control fighting for the same line.
  - **A SWITCH THAT ISN'T YOURS STILL LOOKS LIKE A SWITCH (25 Aug night, user ask:
    "what is this off by ad ops?").** Two different "off" states share this list — *your*
    toggle (this surface skips it; every other surface keeps the slot) and *ad ops'* kill
    switch in the shared setup (nobody calls it; this room cannot lift it, which is the
    whole point of a kill switch). The second was drawn as a bare text chip beside an
    empty gap where the control would be, **inert to click** — a state with no
    explanation rather than a switch someone else owns, and the user asked what it was,
    which is the answer. Now every row carries a switch in the same column: an ops-killed
    one renders **locked** — a dashed, empty track with a small lock, the row dimmed like
    any other off row — and clicking it names the owner and the room
    (*"Off for everyone on “TOI VideoShow demand” — ad ops lift this one, in their
    room"*). Three states, one shape, told by the control instead of by prose: solid blue
    (running), solid grey with its knob (off here, yours to flip), dashed with a lock
    (off for everyone, theirs). `rung-chip ops` and `toggle-ph` went with it.
  - **The company altitude survives where it belongs — the CLOSED row**, which reads
    `IMA › CAN › GPT`: the live companies in walk order, the cut respected, one glance,
    no sentence. It disappears when the row opens, because the list below is the same
    fact and nothing is said twice on one screen.
  - **What it cost, stated plainly:** "switch off ALL of IMA" is now seven clicks rather
    than one. That is the trade for a list that never lies about order and needs no
    legend — and the stop line covers the bulk case anyone actually reaches for.
  - **THE TAIL IS GONE from this card.** "Waterfall 3+" existed because a position past
    the head meant different things at different depths; the stop line answers that
    directly instead of folding it away. `TAIL_START` survives for the bulk sheet alone,
    where many integrations of many depths genuinely do need it.
  - **Timing folds.** The four dropdowns (Plays · Ad sound · Ads in a row · Each try
    waits) sit behind one `Timing` line carrying its own summary (*"at start · with
    sound"*) and the `N local` chip. The "the rest is set in <setup>" clause went: the
    setup is already named, linked and dated in the card header one inch above.
  - **HOW DEEP THE WALK GOES IS A COUNT, NOT SIX MUTES (user ask: "what if I want to
    switch off all the waterfall post 4?").** There was no depth concept anywhere in the
    model — `tagTimeoutMs` is the per-try wait, `waitMs` an ops-owned time budget — so
    the only way to say it was to mute six rungs one at a time. `walkDepth` is now a real
    field: server-validated 1..`MAX_RUNGS`, an ops baseline on the placement ("Stops
    after N rungs · walks the whole ladder"), locally overridable like every other "when
    and how much" field. The default IS the ceiling, which reads as no stop, so every
    placement that never sets one behaves exactly as it always did.
    - **It stores the intent, not its consequences.** Six mutes would silently become
      "stops after 5" the day ad ops add an eleventh rung. A count still means four.
    - **The stop is a POSITION, taken before the dead rungs are dropped** — so a rung ad
      ops killed holds its seat instead of pulling a deeper one up past the line. Pinned:
      `walkDepth: 5` over a ladder whose 5th is ops-killed walks **four**, never five.
    - **It is a LINE ACROSS THE FALL**, labelled `STOPS HERE` and carrying the counted
      consequence (*"4 tries · up to 6s to fill"*), with `local` + `reset` when this
      surface bent it. Rows under it dim but keep their real switch state: a position
      below the line is UNREACHED, not switched off, and a toggle that flipped itself
      would be reporting a state nobody set. Moving the line is a hover-revealed
      `stop after` on each row — the same grammar as drag, never as the switch. Asking
      the row that already holds the line (`walk on`) undoes it; asking the last row
      stores the ceiling, so "walk it all" survives ad ops adding demand.
    - **Fail closed names the stop when the stop is the cause**: *"switched on but stops
      after 1, and nothing live sits that high — move one up, or let it walk deeper"*,
      distinct from the all-muted refusal. Six cases pin it (`77 passed`, was 71).
    - **A rotation has no depth** — squeeze-back banners take turns, they do not fall
      through to one another, so the field does not exist there and the list drops its
      position column entirely.
  - **`Reset` replaced "Reset to the setup's order"** and shows only once something is
    bent. Storage never moved: slot-keyed mutes and a slot-id `order`, plus one sparse
    behaviour field, so the ops room, the bulk sheet and every rule case see one object.
  - What went, by name: `localPositionLabel`, `applyWalkToAll`, `tailStatsOf`,
    `toggleTailOpen`, `secTailSet`, `KEY_TAIL_OPEN`, and the two shapes tried on the way
    (`partnerRowsHtml`, `locTogglePartner`, `locMovePartner`, `walkStripHtml`). What
    stayed or arrived: `walkRowsHtml`, `locToggleRung`, `secSetDepth`, `clientDepth`,
    `clientWalk`, `partnerLadder` (now only the closed row's summary and the
    cross-section match), `timingSummary`, `toggleTimingOpen`. `copySectionToAll` was
    itself retired on 26 Aug — see the walk plan above.
  - **ONE cross-section act, at the card's altitude:** `Copy to all sections`, beside the
    tabs, replacing the per-break `Apply this walk to all sections`. It is one decision
    made once for all four breaks instead of the same link under each. Matched **by
    COMPANY** now, not by ad slot — two sections of one shape rarely carry identical
    slots but they carry the same partners, so "GPT first everywhere" lands where the old
    seat-matching quietly missed. A section's own companies trail in their existing
    order, ad ops' switches win, a break that would be left with nothing is passed over
    and named (*"Left alone: Shorts feed pre-roll — nothing would be left to run"*), and
    the shared setup plus every other integration stay untouched.
  - **`Reset` replaced "Reset to the setup's order"** and shows only once something is
    bent. Storage did not move an inch — still slot-keyed mutes and a slot-id `order`, so
    the server, the ops room, the bulk sheet and all 71 rule cases see the same object.
  - What went with the rewrite, by name: `localLadderRowsHtml`, `localPositionLabel`,
    `locToggleRung`, `applyWalkToAll`, `tailStatsOf`, `toggleTailOpen`, `secTailSet`,
    `KEY_TAIL_OPEN`. What arrived: `partnerLadder`, `partnerRowsHtml`,
    `locTogglePartner`, `locMovePartner`, `timingSummary`,
    `toggleTimingOpen`.
  The demand reference sits once in the card header, and an integration page is TWO
  cards: **Identity → Ad delivery** (the Player card is gone — see below). The
  section-preview dialog died with the
  lens — the open row IS the resolved view. The byline pass that came with all this
  killed the "muted here" chip (the rung's toggle and dimming already say it) and moved
  every remaining explanation onto hover.
- **Inherit-then-fork, one object now (25 Aug).** A placement's overlay carries
  `player: null` = **follows Default**; `give it its own` forks it (its own copy, Default
  untouched) and `use Default's` drops the copy again. Inheritance is a state, so it
  wears a chip (`follows Default` / `own player` / `Default + N own`), never a sentence.
  There is no second forkable object to conflict with it: how ads behave has one home per
  placement in the ad setup, and what a surface bends there is a *sparse override*, not a
  fork — the difference being that an override keeps following the setup for everything it
  did not name.
- **The ops editor keeps the SLOT-level ladder — deliberately, since 25 Aug night.** Its
  four slots share the integration's collapsible-row anatomy: closed, counted facts
  (*"6 of 6 tags active · delayed 7s · 1500ms timeout"*); open, **Ad sources** (the
  ladder, drag, per-tag kill switch, counted "muted on N") then **Delivery settings**
  (that slot's own fields, ending in "Tag timeout" with the counted consequence —
  *"6 × 1500ms — up to 9s to fill"* — beside the number that causes it). Both zone
  headers were renamed in the 27 Aug nomenclature pass, §16 — they read "What plays" and
  "How it behaves" before it. There is nothing below the placement: **Across the session was cut
  whole on 27 Aug** (see below), so a placement is its name and its four slots. The two rooms diverged here on purpose when Ad delivery went
  company-per-row: **ad ops author the slots, so ad ops are the only people who can see
  them.** Product decides which companies run and who is asked first; which of IMA's seven
  slots sits where is a question only the room that created them can answer.
- **Ladders, 25 Aug (user calls):** the "Waterfall N" pool is REMOVED — with **up to 10
  plain rungs** (one primary, nine waterfalls; was 4) there is nothing left for a
  terminal set to do that a position cannot. A group rung is refused by name; stale
  'pool' override keys drop harmlessly. The hypothetical full-ladder warning died with
  the small cap; the ACTUAL per-slot arithmetic still warns on save, counted.
- **THE LADDER READS AS TWO PIECES (27 Aug, user call).** One **Primary** — the ask that
  happens first, every time — then a rule saying what the rest is *for* (*"if it doesn't
  fill · 7 of 9 on"*), then the fall as plain numbers `1..9`. Before this the ten rows
  were one undifferentiated wall: the row that decides most of the revenue looked exactly
  like the ninth fallback, and a stale `.slot-edit .rung-n { flex: 0 0 20px }` left behind
  by the deleted walk view had clipped every label to *"P…"/"W…"*, so they literally read
  the same. The words follow the split — *"+ Add the primary tag"* on an empty ladder,
  *"+ Add a fallback"* under a filled one. **A rotation is not a fall**: its banners take
  turns, so squeeze-back stays one flat list with no row wearing the primary's colour.
  The read-only ladder in the product room weights its first row the same way.
- **ACROSS THE SESSION IS GONE (27 Aug, two user calls the same day).** Fifteen fields in
  the morning, three after the scope audit, none by the evening — the user cut the
  remainder outright. A placement now has **no session-wide settings at all**: it is a
  name and its four slots, and `sec.rules` is off the model along with
  `normalizePlacementRules`, `sectionWarnings`, `NO_FILL_ACTIONS`, the `adRules` field on
  the integration view, the `placementRuleFields` / `noFillActions` meta keys, and the
  `rules` half of every preset. All fifteen are refused by name from every door
  (`refuseDeadRules`), and a `rules` patch with no recognised field is refused too:
  *"A placement has no session-wide settings — every answer lives on a slot."*
  The three that survived the audit went with their own reasons — **Most ads a session**
  (a break plays what its own slot says, and the ladder behind it is the only cap),
  **Quiet after a break** (the mid-roll cadence already says how far apart breaks fall),
  **When nothing fills** (nothing fills means the content plays; there was never a second
  answer). One thing went with them and is worth naming: the cross-level warning
  *"a full 3-ad pre-roll leaves 1 ad for every later break"* had no session cap left to
  count against. The per-slot warnings that never needed one are untouched.

  The twelve cut that morning, for the record — each failed the panel's own test, *does
  our ad delivery control it, and is there demand behind it?*:

  | Cut | Why | Where it lives now |
  |---|---|---|
  | `bannerTimes` `bannerStay` `bannerDismissible` | an overlay no ladder can fill | the **squeeze-back slot IS the banner** — its own show times, hold, rotation |
  | `overlayGap` | nothing left to gap | the squeeze-back's own `refresh` / `perSession` |
  | `requestTimeoutMs` | a second, unarbitrable copy of the per-try wait | the slot's `tagTimeoutMs`, with the counted worst case beside it |
  | `retries` | the waterfall **is** the retry | add a rung |
  | `companions` `companionBackfill` `companionPersist` | they arrive with the ad | the VAST response |
  | `adjacentRefresh` `adjacentInterval` `adjacentViewability` | the page's display units | not ours to serve |

  `ADJACENT_MODES` and the `adjacentModes` meta key went with those fields.
- **The 1:1 promise, spoken (27 Aug).** A setup fills ONE integration (enforced since
  26 Aug), so the plural apparatus that survived it is gone: the amber *"Fills N
  integrations — applies to all of them immediately"* banner is a quiet line naming the
  one surface, the save dialog asks *"Apply to 'TOI Mweb VideoShow'?"*, the list's Fills
  column names it, and the blast-radius warning reads *"Applies immediately to 'TOI Mweb
  VideoShow' — live"*. A name beats a count of one. Syncing GAM units moved out of the
  setup's identity row (where it read as part of the setup) into the ladder footer, where
  a unit you cannot find is what sends you looking.
  Screenshots: `panel/shots/refine-*.png` and `panel/shots/manual-*.png`.
 12. **THE PUBLISH PLANE (27 Aug, user call — scoped in four questions, then built).**
     Save writes the DRAFT; **Publish** stamps an immutable snapshot and swaps what the
     player is served. `GET /panel/live/:apiKey` is the frontend/player door and reads the
     PUBLISHED snapshots only — a draft is invisible there no matter how many times it was
     saved. Per object: `versions[]` append-only (`{v, ts, actor, snapshot, changes}`),
     plus `live` (absent = never published / taken down). Both views carry `live`,
     `liveVersion`, `unpublishedCount`.
     - **Two objects publish SEPARATELY (user's call over my recommendation).** Ad ops ship
       ladders on their cadence, product ships switches on theirs. The gap that opens is
       closed at the BOUNDARY, not by a state machine: publishing an integration whose
       switched-on break has no *published* demand behind it is refused naming the other
       room (*"publish 'Shorts demand' first"*), and publishing (or taking down) a setup
       that would leave a *live* break with nothing to ask is refused naming the surface.
     - **`status` (live/paused) is REMOVED FROM THE MODEL** — it was the one field that
       reached a viewer without going through the plane. Everything it did, **Unpublish**
       does, as a publish-plane act with no exception to explain: the draft is untouched,
       so publishing again brings back exactly what you had. `status` in a payload is
       refused by name; `POST /keys/:id/status` is 404; the bulk act is now
       `publish` / `unpublish` (N publishes reporting per name, never an all-or-nothing
       swap); the list column and filter read **On air / Off air / Unpublished changes**.
     - **THE DRAFT PLANE IS FREE; the publish plane fails closed.** Emptying a live
       integration's last break is a perfectly good draft edit — *publishing* it is what
       is refused (*"every break switched off"*). An edit is never the moment traffic
       changes any more, so the old edit-time refusal moved rather than disappeared.
     - **The blast-radius warning moved with it.** *"'TOI Mweb VideoShow' picks this up on
       its next request"* fires on **publish**, where it is true; on Save it would have
       been a lie every time.
     - **The rail is the feature's face** (`web/js/publish.js`, one implementation for both
       rooms). One timeline, three states of dot — hollow amber *Saved, not published*,
       filled green *on air*, dashed *taken off air* — a **two-way filter (All · Published)**
       (the third, *Saved*, was cut 31 Aug on user review: it isolated the single pending
       row that is always first in All and already counted in the header chip and on the
       Publish button), and each entry folds open to its field-level diff. Changes are a WHERE and a
       WHAT (*`DEFAULT` · Max ads per session 8 → 12*), never a JSON blob; a ladder is
       described by name (*"3 rungs → 4 — + TOI Video Backfill"*) because a flat diff of an
       array of rungs says nothing.
     - **Restore is forward-only, like a spreadsheet's.** An old version is published again
       as a NEW version, so the one you reverted away from is still there to go back to.
       It goes through the ordinary update path, so a version that is no longer legal
       refuses by name instead of landing broken; the draft follows, because leaving the
       editor showing something other than what is live is how people publish an accident.
     - The mock world seeds six surfaces on air (setups first) and leaves ET Desktop
       ArticleShow deliberately off, with as_1 published three times so restore is
       demonstrable rather than theoretical.

     - **RESTORE, RE-CUT FROM THE USER'S SEAT (27 Aug, same day, on review of the first
       version).** The first dialog showed the version's OWN change list — what v2 did the
       day it went out. Going back to v2 from v5 is a completely different diff, and
       showing the first in place of the second is exactly how somebody restores the wrong
       thing. `GET …/versions/:v/preview` now answers the four questions actually being
       asked: *where am I going* (v3 → **v2**, whose, when) · *what changes on the surface*
       (counted from what is **on air**, not from history) · *what do I lose* (a restore
       overwrites the draft — unpublished work is named in an amber block before it is
       thrown away, and the OK button turns danger) · *can I undo it* (lands as v4, v3
       stays). A version already identical to what is on air says so in one line instead
       of offering a button the seam would refuse a second later.
     - **THE GLOBAL ACTIVITY LOG IS CUT (27 Aug, user call — "why is it needed?").** It
       predated the rail, was reachable only from a link at the bottom of the rail, was
       subtitled with objects deleted days earlier, and mixed saves with publishes as if
       both changed traffic. Removed, not hidden: the page, `#activity`, `GET
       /panel/activity` (404), `logActivity`, `state.activity`, the seeded log, and
       `railHtml`/`timelineHtml`/`actGlimpse` with their CSS. **Every history in the panel
       is now a version history**, per object, on the right of the thing it describes.
       What is lost with it: the cross-object *"who touched what this morning"* view — if
       that turns out to matter at 67 integrations it comes back as a purpose-built
       screen, not as a survivor.

 14. **THE PARTNER CHIPS, AND THREE RENAMES (27 Aug, user call).**
     - **`who` → `ask`, a dropdown → a chip strip.** The generated Who menu could only
       offer the two shapes a dropdown holds — *"X only"* and *"X first"* — and both are
       special cases of the sentence product actually wants: **these partners, in this
       order**. So the control became the sentence: one chip per partner, numbered by ask
       position, dragged to reorder, each with a switch. *"IMA only"* is now IMA on and
       the rest off; *"GPT first"* is GPT dragged to the front. The model followed:
       `drive[t].who` (`'only:gpt'`) is replaced by `drive[t].ask` (`['gpt','ima','can']`)
       — an ordered list of who is asked, absent entries not asked at all, no `ask` at all
       meaning the setup's own arrangement. `driveWalk` filters to the list and
       **stable**-sorts by its index, so two rungs of one partner keep the order ad ops
       gave them. Everything built on the old shape survives unchanged: an impossible
       decision refuses by name, a partial miss falls back loudly per section, ops see the
       surface's decision on the slot, and bulk writes the same list across a cohort.
     - **The strip is still generated, and still shows all three.** Partners behind this
       break come first, in the setup's order; one with no demand anywhere is drawn
       greyed, in place, with the reason on it — because a control that has two chips on
       one break and three on another teaches nothing. Switching the last one off is
       refused (a break that asks nobody would go dark), on the client and at the seam.
     - **Renames:** *Who fills it* → **Ad partners** · *Ads in a row* → **Target
       impressions count** (everywhere the field appears, ops room included) · *Starts* →
       **Ad start**.
     - **The pre-roll seconds are the surface's now** — reversing 26 Aug's "seconds stay
       ops'". `deferSec` joined `DRIVE_FIELDS.preroll`, so *Ad start* is
       `[Right away | After] [n] sec` with the number typed, not a fixed 7 read off the
       setup. Bounds 1–60, refused by name; dropping it follows the setup again. The ad
       setup never moves, and the field is marked as the surface's own in `behaviourDrive`.

 15. **ACROSS THE SESSION REMOVED WHOLE (27 Aug, user call)** — see the bullet of that
     name above. A placement is a name and its four slots; `sec.rules` is off the model.
 16. **NOMENCLATURE PASS (27 Aug, manager review: *"too abstract — what plays, shows
     at"*).** Every user-facing label moved from descriptive phrasing to the vocabulary an
     ad-ops team already uses. No byline text was added to compensate; two existing
     explanatory lines were cut instead (the Ad Setups page-sub, the bulk sheet's "tick
     what you want to set"), and the version rail's "what this version changed" sub-label
     went with them. Explanations stay on hover, as the house rule has always said.

     | was | now |
     |---|---|
     | What plays | **Ad sources** |
     | How it behaves | **Delivery settings** |
     | if it doesn't fill · N on | **Fallback order · N active** |
     | Waterfall N *(read-only view)* | **Fallback N** |
     | Plays · At start / Deferred | **Ad start** · Immediate / Delayed |
     | Video starts · Right away / After the ad chain / After at most | **Content start** · No wait / After waterfall / Max wait |
     | Breaks · At set positions / Every so often | **Scheduling** · Cue points / Fixed interval |
     | At · First break at · then every | **Cue points** · **First break offset** · interval |
     | Ad sound · + "Tap for sound" / With sound | **Ad audio** · Muted + unmute prompt / Unmuted |
     | Break lasts | **Max pod duration** |
     | If an ad runs over · Play it / Keep to time | **Duration enforcement** · Allow overflow / Enforce |
     | Stops after (rungs) | **Max waterfall depth** (tags) |
     | Each try waits | **Tag timeout** |
     | Next ad from · Top of the ladder / Next rung down | **Pod fill order** · Restart from top / Continue in order |
     | Banner may · Last slot only / Any slot | **Display ad position** · Last position only / Any position |
     | Shows at · Each one · Most per session | **Schedule** · **Display duration** · **Frequency cap** |
     | Runs *(eyebrow)* · What runs | **Status** · **Resolved waterfall** |
     | Identity · Starts from | **Details** · **Template** |
     | Quick decisions | **Delivery controls** |
     | use for every break · as set up · skipped | **Apply to all breaks** · **Use setup order** · **excluded** |
     | Units live · Fills from · Fills · Last updated · On air *(columns)* | **Active breaks** · **Ad setup** · **Assigned to** · **Modified** · **Status** |
     | History | **Version history** |
     | N tries · up to Xs | **depth N · up to Xs** |
     | 8 of 10 rungs on · at start · 1500ms a try | **8 of 10 tags active · immediate · 1500ms timeout** |

     **"Rung" is gone from the interface** — a waterfall entry is a **tag** — though the
     word survives in code and in `rungs[]` on the wire, where it is precise and costs a
     rename nothing buys. `SLOT_WORD` was added server-side so a version's change list
     reads *"Default · Pre-roll"* rather than *"Default · preroll"*. Two names the user
     had already chosen are untouched: **Ad partners** and **Target impressions count**.

     92 API cases. Screenshots: `panel/shots/publish-*.png`, `panel/shots/restore-*.png`,
     `panel/shots/chips-*.png`.
- **THREE PROVIDERS — IMA · GPT · CAN (27 Aug, user call).** SLike is removed from the
  model, not hidden: it was a fourth name that behaved *exactly* like CAN — a pasted VAST
  URL answering with video — so it bought a vocabulary entry and no decision. `slike` is
  refused by name from every door (*"…is not a provider — IMA, GPT or CAN"*), its fixtures
  moved to CAN, and `URL_PROVIDERS` is now the single-element list it always meant.
  Everything below about four libraries reads as three.
- **MANUAL ENTRY — the synced directory is a CONVENIENCE, not a gate (27 Aug, user call).**
  A unit trafficked in GAM ten minutes ago is real whether or not our copy has caught up,
  and being stuck behind a sync was the one thing ops could not work around. So typing an
  ad unit the directory lacks now offers **one more row**, the same shape as a directory
  hit: *`IMA` **/7176/toi/mweb/liveblog/preroll** `ADD` / not in GAM*. Under IMA a pasted
  VAST URL is offered the same way (sub reads *VAST URL*) — a direct VAST tag is an
  ordinary IMA request; GPT has no URL form, so it is not offered there and a URL saved
  under GPT is refused by name. **No new control**: zero extra UI when the directory has
  the unit, one row when it doesn't. **The row is terse on purpose (27 Aug, user note on
  the first cut):** the row IS the value and the badge IS the act — a sentence explaining
  a row you have already understood is a sentence too many. Same for the empty state:
  *"No match — type the full unit path to add it."*
  - **What is still refused is the SHAPE.** `AD_UNIT_PATH` — network code, then the path —
    so a typo fails here rather than silently at ad time: *"'videoshow/preroll' is not an
    ad unit — a GAM ad unit starts with the network code, like /7176/…"*.
  - **The mark is DERIVED, never stored.** `tagOffDirectory(t)` is computed on every read
    and surfaced as `offDirectory` on the tag and on every `rungView`, so the next sync
    that pulls the unit in clears the `NOT IN GAM` chip by itself, with nothing to
    remember and nothing to clean up. It shows on the ops ladder row and in the product
    room's read-only ladder — the one rung whose existence the panel cannot vouch for.
- **Providers were the four real libraries — IMA · GPT · SLike · CAN — and the TYPE is
  implied by the protocol wherever it can be** (25 Aug): an IMA request is a VAST call
  and answers with **video** by construction; a GPT slot answers with **display**; SLike
  is the house video network (video). Only CAN serves both, so **only CAN asks** for a
  type; a contradiction ("a display IMA tag") is refused by name, never silently
  corrected. IMA and GPT are two libraries on one GAM account, so both draw from the
  synced ad-unit directory; a bare unit path picks its library from the declared type.
  Config-time knowledge, not a guess about responses — at runtime a mismatch is a named
  error, not a reclassification.
- **A section is a placement inside the surface** — a Shorts feed inside VideoShow, with
  its own demand or its own timing. Since 25 Aug the placement is the AD SETUP's to
  declare: **+ Placement lives in the ops room** (a guided ask-the-name act), and the
  setup editor carries one tab per placement with the same ladder grammar under each,
  per-placement divergence and live counts, rename (overlays follow) and remove (live
  use refuses, named). **Any section previews on demand** — the eye beside its tab opens a read-only spec of what actually
  plays there: each unit's resolved walk *after* this section's local order and mutes
  (the one view neither room can otherwise give), its timing, what it fills from, and
  its player.
- **Bulk re-homed by owner**: the integrations bulk keeps switches, publishing, rule fields
  (pod counts included), attach-setup — and the positional acts (`slotRungOn/Off/Move`,
  `slotPoolOn/Off`), reinstated 24 Aug late as **override-writers**: they change each
  integration's own use of its ladder and never touch a shared setup. The authoring acts
  (`slotPrimary`, `slotRung`, `slotReplace`, `slotType*`, `policy`, `behaviour`) stay
  **removed, not hidden** — 400, pinned by test. Bulk never writes an ad unit, permanently.

---

**Everything below this line predates the 24 Aug two-rooms rework** and is kept as the
record of why. Where it conflicts with the model above, the model above wins. The old
surfaces it describes — ladders inside integrations, shared Player Setups / Ad Rules pages,
the settings modal, the cohort ladder screens — no longer exist.

### Every rung has a switch (19 Aug)

A rung that is **switched off keeps its place, its number and its tag**, and is simply skipped when
the ladder is walked. That is the difference between *"this partner is having a bad night"* and
*"delete their tag from fifty integrations and type it back in tomorrow"* — the second is not an
operation anyone should have to perform, and it is what the panel used to require. In bulk it is one
act: pick the unit, pick the rung, `Off`, Apply.

- `rungCount` is what the player would **walk**; `rungCountConfigured` is what is **stored**. The two
  differ exactly by the switched-off rungs, and the worst-case wait counts only the first — a rung
  that is never called costs no time.
- **Fail closed.** A live unit whose ladder has *every* rung switched off is refused with the same
  force as one with no tags at all — it is exactly as dark, and much easier to reach by accident.
  Switching off the **last live rung** of a live unit is refused per section and the section is
  named, rather than quietly going dark.
- Both the per-integration editor and the bulk screen show the switch on the rung itself. The save
  payload carries `on` (it was silently dropped at first — the payload is built field by field so it
  never ships view-only keys, which means every real field has to be listed), and the confirm diff
  says *"— 1 rung switched off"* so a change that alters what runs without altering which units are
  on is still visible.

### The ladder, every position at once (20 Aug)

`Rung by rung` is the **default mode of the bulk unit screen for every ladder cohort**, and it shows
the whole ladder — Primary, Waterfall 1, Waterfall 2, Waterfall 3 — one row each, plus a row for
**Waterfall N**:

    ⠿ PRIMARY      [On |Off]  ET Desktop ArticleSho… 15  8 others                  ✎
    ⠿ WATERFALL 1  [On |Off]  TOI Mweb VideoShow Pr… 1   4 others · 8 end at Waterfall N · 12 …  ✎
    ⠿ WATERFALL 2  [On |Off]  TOI Mweb VideoShow Di… 7   1 other  · 10 end at Waterfall N · 31 … ✎
      WATERFALL 3  [   —   ]  51 empty                                             ✎
      WATERFALL N  [On |Off]  NBT Mweb VideoShow Mi…  36 other sets · 33 have none

**All four numbered positions, always.** They are drawn whether or not anything occupies them — an
empty position is exactly the place you want to put something.

**The row says HOW MANY, never WHAT (20 Aug, PM call).** The first cut named the commonest tag at
each position, with a chip per tag and an `N others` count. The call was blunt and right: *nobody
needs to know which ad unit sits in each key's slot.* Every act here is structural — swap what is at a
position, put a display unit at a waterfall, switch a position off — and a column of tag names is an
**inventory pretending to be a control**. So each row carries a count and nothing else:
`in all 51` · `in 31 · 8 end at Waterfall N` · `in none of them` · `· 4 off`.

**Three ways to name the thing an act is about**, because ops arrive with all three:

| | Addressed by | Reads | Control |
| --- | --- | --- | --- |
| Row drag, row `On/Off` | **position** | *"waterfall 2, whatever is in it"* | the grip and the segment |
| Row `✎` | **position** | *"they all run this at waterfall 2"* — this is the swap | the pencil |
| The Display unit row | **type** | *"the display unit, wherever each keeps it"* | its own row, below the ladder |

A cohort's display rung is a **different tag in every integration** *and* sits at a different depth in
each — so neither a position nor a tag id can name it. Only its **type** can, and a ladder holds at
most one display rung, so it is exact. That is the whole reason the row exists, and why the earlier
by-tag-id ops (`slotTagMove/Swap/On/Off`) were **removed** rather than kept alongside: they could not
express the job, and two ways to do one thing is the thing we keep deleting.

    DISPLAY UNIT  [On |Off]  in 12 · at waterfall 1 and 2 · 39 have none          ⋯
      ┌ Display unit                                            ✕
      │ Move to                            [ P ][ W1 ][ W2 ][ W3 ]
      │ Switch off wherever it sits
      │ Give the other 39 one…

**"What about the ones that have not got one?" (PM question, 20 Aug).** Three possible answers, and
only one of them is honest:

- *Refuse the whole act* — wrong. 12 sections have a display unit and there is nothing wrong with
  moving them.
- *Silently give them one* — worse. Which tag? A move is not an add, and inventing a rung is not
  something a Move button may do.
- **Skip and name them, and make "give them one" its own act** — what is built. `slotTypeMove` counts
  them (*"39 have not got a display unit — left alone"*), and `Give the other 39 one…` is a separate
  op (`slotTypeAdd`) that touches **only** the sections lacking one, at a position ops picks, and
  leaves every section that already has one running exactly its own tag. Both can be queued in the
  same Apply, and the preview counts them separately:

      10  move their display unit to waterfall 1 — from waterfall 2 ×10
       2  already run their display unit at waterfall 1
      39  have not got a display unit — left alone
      39  gain TOI Mweb VideoShow Di… at waterfall 3 — or the deepest free rung

  Verified end to end on the scale world: display units at waterfall 1 **and** 2, 39 sections with
  none — one Apply moved 12 to waterfall 1, gave 39 one, and all 12 that had one **kept exactly their
  own tag**. No ladder exceeded 4 rungs and no pool stopped being terminal.

**Two warnings the screen used not to give (20 Aug, PM call).** Both are *named, never blocked* —
each is sometimes exactly what ops meant:

- **The pencil swaps by POSITION, and on a mixed cohort waterfall 2 is a video rung in some
  integrations and the display unit in others.** Pushing a video tag there silently removed a display
  unit. Now: *"10 would lose their display unit here — it is the only one they have (TOI Mweb
  VideoShow · Default, …)"*. Only counted when it is their **only** unit of that family, because
  replacing one of two is not a surprise.
- **With the switcher on "All properties", a TOI tag can be pushed onto NBT integrations.** Now:
  *"32 are ET/NBT integrations and this is a TOI tag"*. Not refused — a shared backfill tag really
  does span properties, and the fixtures have one.

**Warnings take the visible slots in the preview.** The list caps at four rows so the frame cannot
grow; it used to cap in apply order, which pushed a warning into `+1 more`. A warning ops cannot see
is not a warning, so warn rows fill the visible four first and each group keeps its own relative
order. The confirm still lists every row.

**Every act greys with its reason rather than doing nothing.** `Move to` and `Switch off` are dead
when no section has a display unit; `Give the other N one…` is dead when every one already has one,
and dead with the arithmetic when the ones without already run 4 rungs (*"there is no room"*). A full
ladder is **named, never truncated** — making room by dropping a rung nobody was told about is exactly
the silent data loss this screen exists to prevent.

**Waterfall N is a row, not a number.** It is the terminal pool, and because ladders differ in depth
it sits at waterfall 2 in one integration and waterfall 3 in the next. Numbering it would give ops a
row that means something different in every integration under it — so it gets its own row, switched
as a whole (`slotPoolOn/Off`), with no grip (it is always last) and described by the **set** inside it
rather than by a size. Before this it rendered as *"Waterfall 3 — (missing tag)"* and clicking it
would have replaced the whole pool with one tag.

**Numbered rows count TAG rungs only.** A section whose pool sits at that depth is counted separately
(*"12 end at Waterfall N"*) and **stepped over** by every positional act — `slotRung`, `slotRungOn/Off`
and `slotRungMove` all skip a pool and name the section, so a numbered row can never overwrite, switch
or drag a set of tags nobody was looking at. A tag move clamps to the deepest position **above** the
pool, because nothing may follow it.

**Each row is also the way in.** The `✎` sets what everyone runs at that position — one row at a time,
because five search fields on screen is five ways to lose track of which one you were filling in.
Every intent is recorded and they land together on one Apply, in the order the screen reads: positional
moves (they renumber the positions), tags typed in, positional switches, then the tag-addressed acts.

**The preview says where a tag will really land.** A ladder cannot have a hole, so setting
`Waterfall 3` on a section with two rungs *appends* — and the preview says *"44 gain it at the end —
their ladder is shorter than that"* rather than claiming a waterfall 3 it will not create.

**Naming (user call, 20 Aug).** The positions are **Primary, Waterfall 1, Waterfall 2, Waterfall 3,
Waterfall N** — not "Backup N". I pushed back once, because the reusable object in the sidebar was
also called a waterfall; the PM's call stands, and shared waterfalls have since gone out of scope
entirely, so the collision no longer exists.

- **Queued moves are shown, not just remembered.** A `Move to` click re-counts and redraws the ladder
  in its new order, because a control that appears to do nothing is worse than no control.
- **Each move is counted against the ladder the previous moves left**, not the original order —
  otherwise the second move's number is a fiction. A move's *own* preview reads the ladder as it was
  **before that move**; computing it from the fully-moved ladder made every move report itself as
  already done.
- Every preview row is **one line, ellipsised, full text on hover**, so the frame cannot grow with the
  wording.

### The display rung (19 Aug, relaxed 20 Aug)

A video ladder may carry **one display tag, at any position**. It does not count against `MAX_RUNGS`
— "one primary and three waterfall rungs" is about the video chain — so the shape ops described is exactly
representable:

    primary + up to 3 video waterfall rungs + a display rung

**The first cut pinned it to the end** and called it the display *fallback*, by analogy with the house
promo. That was wrong. The house promo is terminal because it **always fills** — arithmetic, not
taste: nothing below it could ever be reached. A display tag can no-fill exactly like a video one, so
putting it last is a *preference*. Pinning it there made **"promote the display unit and switch the
video rungs off"** impossible, which is a thing ops legitimately want. Now only the house promo is
terminal, and a display rung sitting first is simply the primary — the position label says the
position, and its type glyph says what it is.

A display slot gets no reciprocal licence: there is no other family for it to reach for.

### The integration editor, cut down (20 Aug)

Measured before touching it: the **Ad sections** block on a two-section integration held **63
interactive elements and 82 lines of text**. Ten slot rows of six parts each; *"take video tags"*
printed four times; the words **On/Off printed ten times next to toggles that already show their own
state**; `worst case 3s` on every row whether or not it was a problem; `no tags yet` five times. It is
now **17 interactive elements and 32 lines**, and the whole page fits without scrolling.

What went, and why:

| Cut | Reason |
| --- | --- |
| the words "On"/"Off" beside each toggle | the toggle already says it, in the same 40px |
| `worst case 3s` on every row | it is a **warning**, so it appears when it is one — over the threshold, reading *"9s before anything plays"* |
| `take video tags` × 4 | the family rule is a heading; it does not need restating per section. Kept as the heading's hover |
| `+1 more` → `+1` | at rest the primary is the fact; depth is one hover away and fully visible when open |
| `no tags yet` → `—` | an empty unit should read as empty, not as a sentence |
| the `⋯` menu on ten closed rows | rare actions belong in the open state |
| sections past Default drawn in full | one section is the norm; the second doubled the page for the exception. Collapsed to one line — *"Shorts feed · Pre · MiniTV setup · MiniTV rules"* — with `Open` |

Two things were **added**, not cut, because they were invisible when they mattered:

- **A rung's switch is no longer hover-only.** Reorder and remove still reveal on hover; the switch
  never does — a switched-off rung changes what serves, so hiding it until the mouse arrives was
  wrong.
- **A closed slot says when a rung is off** — a `1 OFF` chip beside the summary. Previously you had
  to open the slot to find out that what it advertises is not what it runs.

**The dead `↗` is gone.** Every rung carried an "open this ad tag" button that navigated to
`#tags/<id>` — a page that was never built, so it landed on *"Couldn't load this view"*. The button
and the route are removed; unknown hashes fall back to `#keys`. Repointing a tag from the rung it
fills is still a real want and is unbuilt, not forgotten.

### Slots — a switch plus a waterfall
- **Five slots per section:** pre-roll / mid-roll / post-roll / display / L-band. Each carries
  `{ on, mode: own | common, waterfallId, rungs }`.
- **Switching a slot off KEEPS its tags** (user call, 19 Aug) — greyed in place, not wiped. Staging
  demand ahead of a launch survives, and switching back on is one click with nothing re-typed.
- **On with no tags is a refusal**, named. Fail closed: no demand, no ads.
- **The Default section needs at least one slot switched on.**
- **Max 4 rungs — one primary and three waterfall rungs** (user call, 19 Aug). Rung 1 is *the primary*, a
  nameable thing, so "change the primary tag" is a real operation and not "edit row one".
- **A house rung is terminal** — house always fills, so nothing below it could run.
- **Worst-case wait is shown as arithmetic**, never a guess: `rungs × the policy's per-tag timeout`,
  on the slot row and next to the timeout field, warning past 6s. Four rungs at 2500 ms is a
  10-second black player; the guardrail exists because the four-rung shape makes that reachable.
  It warns, never blocks — levers, not walls.

### Shared waterfalls — out of scope (20 Aug, PM call)

**Removed, not hidden.** A slot is now simply **a switch plus its own ladder**: `{ on, rungs }`. Gone
with it: the sidebar entry and its route, the editor, the `Waterfalls` filter, the `Shared` mode on the
unit screen, the `slotWaterfall` bulk action, `mode`/`waterfallId` on every slot, the whole waterfall
object in the store and its five routes, and ~2.2KB of CSS that only those surfaces used. Leaving the
model behind a hidden nav entry would have left exactly the kind of dead affordance this panel keeps
having to clean up.

The one thing worth keeping was the **ladder row renderer**, which every ladder in the product uses —
it moved into `views-keys.js` before the file was deleted.

What the fixtures did instead: every slot that followed a waterfall now carries those tags directly,
so the demo world reads the same and nothing lost its demand.

### "Waterfall N" is configured like any other rung (20 Aug, PM call)

The pool held its tags as chips with their own picker dialog — a second way to do a thing the panel
already had one way to do. It is now **up to three of the same tag field**, stacked, with the same
scope switch and the same provider dropdown:

    PRIMARY      [ ▶ GAM ▾ │ TOI Mweb VideoShow Mid-roll ]
    WATERFALL 1  [ ▶ CAN ▾ │ TOI Video Backfill          ]
    WATERFALL N  ┌ [ ▶ GAM ▾ │ TOI Mweb VideoShow Pre-roll ] ✕ ┐
                 │ [ ▶ GAM ▾ │ search video tags or ad units… ] ✕ │
                 │ [ ▶ GAM ▾ │ search video tags or ad units… ] ✕ │
                 └ 3 of 3                                        ┘

Nothing new to learn: the only thing marking it out is the dashed frame saying these three sit at one
position. `+ Add one more` up to the cap, then `3 of 3`.

### The slot row, and filling a ladder in order (20 Aug, PM feedback)

**The tag name is gone from beside the switch.** It was the longest string on the row and the one
thing you open the row to read anyway — cost without use. The switch's complement is **how much is
behind it**, so the row now reads:

    Pre-roll      [on ]  3 rungs                              ›
    Mid-roll      [on ]  2 rungs                              ›
    Squeeze-back  [off]  nothing set up                       ›

with `1 OFF` when a rung is switched off, `N tried` when a pool opens up into more than the positions
shown, and the worst-case warning only when it is one.

**Both bylines are gone** — *"catch-all — serves whenever no section matches"* and *"A unit runs when
it is switched on here and has a tag…"*. The Ad sections block is down to **15 interactive elements
and 26 lines** (it was 63 and 82 before this pass began).

**A ladder is filled in order, and the buttons follow.**

- `+ Add waterfall` is **disabled while a rung is still blank** — that is how a hole appears, and a
  hole is not a ladder.
- **`+ Waterfall N` only exists once the chain is full and every rung in it has a tag.** It is the
  pool tried after everything above comes back empty, so offering it while there is nothing above is
  offering a fallback with nothing to fall back from. Measured: it appears at a chain of four and not
  before, and the handler refuses the same way so a stale click cannot slip through.
- `+ House promo` waits for the primary too, but not for a full chain: *primary then house* is a
  legitimate two-rung ladder.

### House promos — out of scope (20 Aug, PM call)

Removed from the model entirely, not hidden: the `house` rung type, `HOUSE_CATEGORIES`, its category
and creative fields, both `+ House promo` buttons, its row rendering, its terminal rule, and ~1KB of
CSS. **They come under the house network's scope**, so a house promo is a pasted CAN endpoint like any other
and the panel does not need a second way to express one. The only terminal left is the "Waterfall N"
pool.

One preview case went with it: appending past a house promo used to be refused and counted, and that
whole branch is gone.

### A squeeze-back is a ROTATION, not a ladder (20 Aug, PM call)

A break is a **ladder**: ordered, tried one after another until something fills. A squeeze-back is a
**rotation**: several banners that take turns, and the turn-taking is set in the ad rules rather than
by their order. Same `rungs` array, different meaning — so the ideas that only make sense for a ladder
do not apply to it:

    BANNER 1  [◗]  GAM ▾   TOI Mweb VideoShow Display
    BANNER 2  [◗]  GAM ▾   TOI Mweb ArticleShow Display
    BANNER 3  [◗]  GAM ▾   TOI Desktop VideoShow Display
    + Add banner     they take turns — how often and how many is in the ad rules

- Labels are **Banner 1…n**, not Primary/Waterfall — there is no primary in a rotation.
- **No house promo, no Waterfall N.** Both are refused server-side too (*"a squeeze-back is a
  rotation, not a ladder — it takes ad tags only"*), not merely hidden.
- Up to **5** banners, and the footer says where the timing lives rather than repeating it.

**The cohort screen said the same thing and then contradicted it (20 Aug, PM feedback).** The model
had known this since the four-slot rework, but the bulk screen still drew a squeeze-back as a ladder:
numbered positions, a drag grip, a switch per position. Every one of those asked ops to care about an
order that has no effect. A rotation now gets its own cohort view — a **set**, with one additive act:

    Squeeze-back            50 integrations · 51 sections
    LIVE   ▭▭▭▭  0/51   33 have no squeeze-back tag yet, so they stay off   [On |Off]
    TAGS   add to what each already rotates            [Add to theirs][Same for all]

    TOI Display Backfill                    in 12   [On |Off]
    ET Desktop ArticleShow Display          in 6    [On |Off]
    + Add a banner to all    they take turns — up to 5; how often and how long is in the ad rules

- **Additive by default (PM call).** *"Put the sponsor banner on all of these"* almost never means
  *"and drop the ones they already run"*, so `slotRotationAdd` joins the banner to each rotation and
  keeps theirs. It is idempotent, and a section already rotating 5 is named rather than truncated.
  `Same for all` still replaces the whole rotation, but it has to be asked for.
- **Nothing to write, either.** A common banner across many integrations is exactly the act that
  never makes sense, so `slotRotationAdd` is gone. The whole cohort screen for a squeeze-back is the
  slot switch and one line saying where the turn-taking lives. Which banners each one rotates is the
  integration's own screen.
- `slotTypeMove`, `slotTypeAdd` and `slotPoolOn/Off` are all **refused** on a rotation server-side
  (*"a squeeze-back is a rotation — it has no Waterfall N"*), and `slotRotationAdd` is refused on a
  ladder. The screen never shows a control the server would refuse.

**What the ad rules were missing.** Checked before building: `squeezebackTimes` (when it shows),
`squeezebackHold` (how long each holds) and `overlayGap` already existed. The two the rotation needs
did **not** — `adjacentInterval` is for adjacent slots (itself cut 27 Aug) and `maxAdsPerSession`
counts every ad, not this one. So:

    Squeeze-back      8:00
      Holds for       20 sec
      Rotates every   45 sec     ← new
      Most per session 4 shows   ← new

And one arithmetic refusal, because the pair can contradict: rotating every 20s while each one holds
for 40s means the next is due before this one finished, so it is refused naming the field.

### `WATERFALL 1` stopped wrapping (20 Aug)

The label column was 64px for a 78px word, so every ladder row was two lines deep. It is now 92px,
9.5px type with tighter tracking, and **right-aligned** — which does more than fit the text: the
ordinals now line up in a column, so the eye reads `1 · 2 · 3 · N` straight down instead of hunting
for the number at the end of each label.

### Symmetry: every field starts at the same x (20 Aug, PM feedback)

Showing the type chip **only** for display tags meant the search field stepped right wherever a
display rung appeared — asymmetric, and it read as sloppy. Presence was carrying the meaning; now
**emphasis** does:

    PRIMARY      [◗]  [ VIDEO ][GAM ▾]  TOI Mweb VideoShow Pre-roll     ← quiet: the expected family
    WATERFALL 1  [◗]  [ VIDEO ][CAN ▾]  TOI Video Backfill
    WATERFALL 2  [◗]  [DISPLAY][GAM ▾]  TOI Mweb VideoShow Display      ← loud: the exception

The chip is always there, so the rows align; the *expected* family sits grey and the *unexpected* one
is coloured, so the exception still pops. Min-widths on the chips got close but kerning between
`GAM`/`CAN`/`SLike` and `VIDEO`/`DISPLAY` still moved the field a few pixels a row, so the prefix has
a **fixed width**. Measured across every slot of three integrations: **one** distinct field edge.

### The rung row, calmed down (20 Aug, PM feedback)

The row had `ON` then `DISPLAY` then `GAM ▾` — **three bordered pills of the same shape and size**,
which read as one undifferentiated block before you reached the field. Two changes, and the count is
not the interesting one:

**1 · The switch is a switch shape.** It was a text pill (`ON`) sitting between two fact pills. It is
now the same **toggle** the slot rows use, at rung scale. A toggle beside a chip reads as *a control
beside a fact*; three pills read as noise. Nothing was removed to achieve it — the row just stopped
pretending a control was a label.

**2 · The type is a FLAG, not a label.** It shows **only when the attached tag is not the family the
slot leads with**:

    PRIMARY      [◗]  GAM ▾      TOI Mweb VideoShow Pre-roll
    WATERFALL 1  [◗]  CAN ▾      TOI Video Backfill
    WATERFALL 2  [◗]  DISPLAY GAM ▾   TOI Mweb VideoShow Display

So `DISPLAY` appears exactly where it is news — a banner inside a break — and every ordinary row
carries **one** chip instead of two. In a squeeze-back, where every tag is display by definition, it
never appears at all. The full type stays in the chip's hover, and in the search results, where both
families are on screen together and the distinction is doing real work.

`WATERFALL 1` also stopped wrapping onto two lines (the label column was 64px for an 78px word).

### A tag's two facts are words, not a glyph (20 Aug)

    DISPLAY  GAM ▾   TOI Mweb VideoShow Display

The type used to be a 15px SVG at 58% opacity. It read as lint, and an icon that needs a legend is a
legend too many — so both facts are now words: `VIDEO`/`DISPLAY` beside `GAM`/`CAN`/`SLike`. Display
and SLike also had the same coloured ground; they no longer do.

**Two bugs fixed with it.** The provider dropdown **rendered behind the rows below it** — an open menu
has to outrank its *siblings*, not just its own children, so the open lookup takes a stacking context.
And the prefix was an absolute overlay with a hand-picked `padding-left`, so the moment the words got
wider than the guess it **clipped the tag name**. It is a real flex child now, with no magic number.

### Four ad slots (20 Aug, PM call)

    Pre-roll · Mid-roll · Post-roll · Squeeze-back

**The separate `display` slot is gone.** A display ad is not a placement of its own — it is what a
break falls back to when no video filled. So a display tag is now an **ordinary rung inside
pre/mid/post, at any position**, and the one heading over the list is simply **Ad slots**. Splitting
the list into "Video units" and "Display units" was describing the *tag rules*, not the placements,
and once a display tag can sit in a break the split had stopped being true.

`lband` → **`squeezeback`**: the same thing under the word the industry uses, and the one slot that is
display by nature.

The typed rule is now stated as two facts rather than one:

    SLOT_FAMILY      preroll/midroll/postroll → video,  squeezeback → display
    SLOT_ALSO_TAKES  preroll/midroll/postroll → display

A break takes video **and** display; a squeeze-back takes display and only display, because it has
nothing to fall back to. Both halves are enforced in `normalizeRungs`, in the pool, and in the bulk
pre-checks — the last one mattered: bulk was refusing what the editor accepted until it learned the
second fact. The tag search opens on **All** in a break (scoping to one family would hide half of
what the slot accepts) and offers the other family as *pickable*, headed *"what a break falls back
to"*, rather than greyed.

### Mid-rolls: named positions or a cadence (20 Aug)

    Mid-rolls   [ At set positions | Every so often ]
      At               2:00, 6:00, 9:30
      First break at   240 sec
      Then every       480 sec

Both exist in the wild: episodic content has natural breaks to name, a live stream does not. The mode
is a segment; the fields below it **grey in place** rather than swapping out, so the row never jumps.
Only the chosen mode has to be complete — naming cue points you do not use is busywork — and the
warnings follow the mode too (`4+ breaks is heavy` for positions, `a break every 2 min is heavy` for
a cadence).

**The display-behaviour fields the question was really about** were already there, and they govern a
display rung wherever it sits: `bannerTimes`, `bannerStay`, `bannerDismissible`, `squeezebackTimes`,
`squeezebackHold`, `overlayGap`. So *"video primary, display at waterfall 1"* is fully specified today
— the video side by the break timing above, the display side by those six.

> **Superseded 27 Aug (scope audit).** Four of those six are cut: the squeeze-back slot became the
> overlay and carries its own `times` / `hold` / `refresh` / `perSession`, so `bannerTimes`,
> `bannerStay`, `bannerDismissible` and `overlayGap` described an overlay no ladder could fill.
> *"Video primary, display at waterfall 1"* is still fully specified — the display rung's own
> squeeze-back fields now say all of it.

### Pods — a break may play up to N ads in a row (24 Aug, phases 1–2: model + API + editor)

`POD-SCOPE.md` is the record of why. Fifteen policy fields and nothing else — and **everything
is per break type** (PM IA review, 24 Aug evening, superseding the morning's shared fill
fields): a pre-roll blocks content from starting while a mid-roll interrupts it, so budget,
overrun, walk and banner are each break's own call. Defaults are exactly today's behaviour, so
every existing policy normalizes unchanged and a break's fill fields stay inert while its own
count is 1:

    {preRoll,midroll,postRoll}PodAds      1–3 · default 1        ads in a row, per break
    {…}BreakSec   10–180 · default 60     {…}Overrun     play (default) | strict
    {…}NextAd     top (default) | next    {…}PodBanner   last (default) | any

- **The budget gates by mode.** `play` never rejects an ad that arrived — it only stops the
  break *asking again* once spent (60s budget, 30s + 35s both play, no third ask); `strict`
  sends "nothing longer than what's left" where the seller supports it and discards oversize
  arrivals unplayed. In both modes an ad that has started is never trimmed.
- **`podNextAd` is named by consequence in the UI** — "first choice", never "best payer". The
  ladder is preference order, not a per-ad price ranking (PM pushback, 24 Aug); `next` exists
  chiefly as v1's only repeat protection and is revisited when dedupe ships.
- **Warnings, counted, never blocking:** the session arithmetic ("a full 3-ad pre-roll leaves
  1 ad for every later break" — the cap counts ads, not breaks), the heavy-cadence warnings
  multiplied by the pod (480s alone is fine; 480s at 3 ads is one ad every 160s), and pods
  with the countdown hidden — `podPosition` ("Ad 1 of N") is the viewer half and already
  existed. A squeeze-back is a rotation, not a break — by construction none of this touches it.
- **The editor (phase 2, 24 Aug — IA reworked the same evening).** Each break row carries a
  quiet `ads in a row [1|2|3]` seg — post-roll gains its first rule field — and **a break's pod
  rows live under that break** as child rows, present only while THAT break's count is above 1.
  Scope is position: the first cut floated one shared "How a break fills" card below all the
  breaks, which governed at a distance and forced one answer on all three — deleted on PM
  review. The rows read as sentences — *"Break lasts [30] sec, if an ad runs over [Play it |
  Keep to time]"*, *"Next ad from [Top of the ladder | Next rung down]"* with its consequence
  line swapping live, *"Banner may [Last slot only | Any slot] — one banner per break"* — and
  each break's counted warnings render live in an amber note under its own rows, then again as
  server toasts on save. Reveal is by the seg's click: the one deliberate exception to
  fields-grey-in-place (a click has no caret to lose; the property select already repaints the
  same way). The save diff names fields per break ("Mid-roll next ad comes from: Top of the
  ladder → Next rung down"), the list summary appends "up to 3 ads a break", and the
  integration-side spec preview gains one row per podded break.
- Duplicates are deliberately out of v1. Bulk (phase 3) and the player contract in
  `API-SPEC.md` (phase 4) are unbuilt.

### Provider template URLs — deliberately not in the panel

Each provider (GAM, CAN, SLike) has its own request template that the selected id is injected into.
**That stays server-side and gets no interface** (user call, 20 Aug): ops chooses *who answers* and
*which unit*, and the shape of the URL that carries it is not a decision they make or should be able
to break. The panel therefore stores a provider and a value, and nothing about templating.

### An ad tag has two facts (20 Aug)

    TYPE      video | display          decides WHERE it may sit
    PROVIDER  GAM | CAN | SLike        decides WHO answers the call

They are **independent**, and neither is guessable from the name, so both are shown wherever a tag
appears — as **one mark**, not two labels:

    ▶ GAM   TOI Mweb VideoShow Pre-roll
    ▭ CAN   TOI Display Backfill
    ▶ SLike ET Video Backfill

Type is a **glyph**, because a shape is recognised without being read. Provider is **letters**,
because there is no icon anyone knows for CAN. Together they occupy one ~56px block and replace what
would otherwise be a sentence. Three quiet grounds tell the providers apart — green, blue, warm —
none of them shouting. The mark appears in the closed slot summary, inside the field once a tag is
attached, on every search result, and on the bulk ladder rows.

**One control on the search (25 Aug, user call — supersedes the 20 Aug two-axes anatomy).** The
`All · Video · Display` segment above the results is **REMOVED**: video-or-display is not ops'
question to answer at search time. The slot already decides what fits, and since the 25 Aug
provider rework the type rides the protocol wherever it can be known at all — an IMA pick is
video by construction, a GPT pick display, SLike video; only CAN declares. A second type filter
was asking ops to pre-sort by an answer the response owns. The field's own type chip went with
it (same call): VIDEO sitting next to IMA was the same fact twice. What remains:

    ┌────────┬──────────────────────────────┐
    │ IMA ▾  │ TOI Mweb VideoShow Pre-roll  │   ← provider ON the field, the one control
    └────────┴──────────────────────────────┘
      │ results…              │

- **PROVIDER — a small dropdown inside the field's left edge**, like a country code on a phone
  input. It belongs to the *input* because it changes what the text means: under IMA or GPT the
  field searches the synced ad-unit directory; under CAN or SLike there is no directory, so the
  field takes a pasted endpoint and offers one row, *"save as a SLike tag"*. It opens on the
  attached tag's own provider, so it reads as a statement before it reads as a control. It is
  already family-filtered — a video slot never offers GPT, a squeeze-back never IMA or SLike.
- **The type shows ONLY where the provider cannot imply it (25 Aug, final trim).** VIDEO
  next to GPT was the same fact twice — GPT answers with display by construction, IMA and
  SLike with video. So `typeChipIfUnknowable()` renders a type mark for **CAN tags alone**
  (the one provider that serves both), everywhere a provider badge appears: ladder rows in
  both rooms, and search results. Nothing is silently dropped either — a wrong-family match
  still shows greyed with its reason on the row (*"only fits pre-roll, mid-roll,
  post-roll"*), and a break's display fallbacks stay pickable where the slot takes them.

Nothing fails silently: *"3 under CAN — switch to see it."* — counted, one line, and it
**replaces** the empty-state message rather than sitting under it, because a note explaining the
emptiness plus a message restating it is the same sentence twice.

The API still refuses a provider-less endpoint (*"An endpoint could be CAN or SLike — say which one
answers it"*), a GAM tag naming a unit the directory does not know, and a CAN or SLike tag whose
value is not a full URL.

> **Superseded 27 Aug.** SLike is gone (three providers), so a pasted endpoint with no provider is
> CAN by construction and no longer asks. A GAM tag naming a unit the directory does not know is
> now **accepted and marked**, not refused — see *Manual entry* above; what is refused there is a
> value that could not be an ad unit at all. A CAN tag whose value is not a full URL is still
> refused, unchanged.

### Drag to reorder, and space reclaimed (20 Aug)

**The `↑ ↓` buttons are gone from every ladder in the product, and so is the `Edit` button on every
slot row.** Two arrows cost **40px on every row, always**, whether or not anyone ever pressed them;
five identical `Edit` buttons per section were 52px each of the same word about a row that is
obviously a row. **The row opens itself now** — the chevron is the affordance, at 16px, and the
toggle stops propagation so switching a unit never expands it. A **grip (`⠿`) costs 14px and only appears on
hover**, and the insertion point is drawn as a line between rows, so where a row will land is shown
rather than inferred. Dragging in the cohort ladder queues the same positional move the arrows did.

Also removed on the way: a **24px placeholder** on every rung holding the width of the `↗` button
that had already been deleted. Between the two, a rung row's chrome went from ~98px to 34px and the
tag field grew from 443px to 457px on the same row.

### "Waterfall N" — a pool of 1–3 tags at the end (20 Aug)

The last position is a **pool configured in place**: one to three ad tags, tried in order once
everything above has come back empty. Not a reference to a shared waterfall — the first cut made it
one, and that was wrong: ops configures the set *here*.

    PRIMARY      ▶ GAM  TOI Mweb VideoShow Pre-roll
    WATERFALL 1  ▶ CAN  TOI Video Backfill
    WATERFALL N  [GAM TOI Mweb Vide… ×] [GAM TOI Mweb Vide… ×] [GAM TOI Mweb Arti… ×]  3 OF 3

- **Chips on one row, however many are inside** — that is the point of grouping them instead of
  giving each its own position. The `+` disappears at the cap and is replaced by `3 of 3`.
- It wears **N**, not a number, because it stands for however many it holds.
- **Terminal**, for the same reason house is: a position after a pool of three is not something
  anyone can reason about. Anything below it is refused, naming the pool.
- **Typed, bounded, no repeats**: display tags refused in a video pool, a fourth tag refused, a tag
  already above in the ladder refused, an empty pool refused.
- It does **not** count against `MAX_RUNGS`; its contents **do** count toward the walk. A ladder of
  2 tags + a 3-tag pool reports `rungCount: 5` and `rungCountConfigured: 3`, and the worst-case wait
  opens the pool up rather than charging it as one call.
- Switching the pool **off** drops all of its tags from the walk in one click, and keeps them.
- The chips carry the **provider badge only** — every tag in the pool is the slot's own family by
  rule, so a type glyph there would add nothing but width.

### The display rung, removed (20 Aug)

A video ladder briefly allowed one display tag at any position. That is gone: **display is its own
slot** (Display and L-band), so a display tag never belongs in a video ladder, and the exception made
nothing possible that the Display unit does not already do. The strict typed rule is back — a display
tag in a video ladder is refused by name, including as the primary.

**While you are typing a replacement the affix stands back** (28% opacity) — it describes what is
*attached*, not what is in the box, and leaving it bright would mislabel the text you just typed.

### Ad tags

**The tag search (19 Aug, third pass).** One control, used identically by a slot rung and a shared
waterfall rung. Three things make the type rule visible instead of implied:

- ~~A scope switch — `All · Video · Display`~~ — **removed 25 Aug (user call)**: the slot decides
  the family and the provider implies the type wherever it is knowable, so a type filter on the
  search asked ops to pre-sort by the response. Greyed wrong-family rows carry the rule instead
  (see "One control on the search" above).
- **A type mark on every result row** — words now, not glyphs — inheriting the row's colour, so
  a greyed row greys its mark too. The mark **on the field** went with the scope switch (25 Aug):
  the provider dropdown beside the text already carries the type wherever it is knowable.
- **A counted line when a scope comes up empty** — *"2 display tags match — they only fit display
  and L-band."* Silently finding nothing is what makes a search feel broken; this says where the
  thing you are looking for actually lives, without listing it as if it were pickable.

Wrong-family tags are never hidden — in `All` they sit greyed with their ad unit as the reason.

**A field the screen focused for you still opens on click.** The unit screen focuses the primary
field on arrival (caret only, menu shut). Because focus never fired, clicking that field did
nothing at all — a dead click on the one control ops came for. It now opens on click as well.

Every tag is a **video tag or a display tag**. Video fits pre/mid/post-roll; display fits display
and L-band; crossing is refused by name. The value decides the source — a full URL is a manual VAST
tag, anything else must be a GAM ad unit the synced directory knows. Naming tags is what makes a
bulk write safe: ops pushes "TOI Video Backfill", a thing they previewed, never a raw path onto 30
surfaces. A tag in use cannot be deleted *or retyped* (the refusal names where it sits). Tags are
created inline from the slot row's picker — **"+ New ad tag" opens a small dialog, not another
page**, so building a ladder never loses your place; the type is fixed by the slot family that
asked, so there is nothing to get wrong.

**The video/display split is structural, not a rule you discover (19 Aug review).** Which tags fit
where was enforced everywhere and shown nowhere: the search silently filtered to one family, so a
tag you knew existed simply was not there, and nothing in the layout said pre/mid/post-roll are
video units while display and L-band are display units. Now the split is a heading wherever units
are listed — **Video units · take video tags** / **Display units · take display tags** in the
integration editor and in the bulk unit picker, a hairline between the two families in the list's
"Units live" chips, and the family named on a shared waterfall's line. In the tag search it is a
**group header**, and the *other* family stays visible, greyed, with its reason
(*"Display tags — only fit display and L-band"*) rather than being filtered away. Silent filtering
is what makes a search feel broken; showing what was excluded, and why, teaches the rule once.

**Tags are filled by searching, never by browsing (19 Aug review).** Every rung — in the slot
editor, the waterfall editor, and the bulk screen — is one **search field** with the same two-line
anatomy as the ad-unit lookup ops already knows: what it is on top, where it points underneath.
Existing tags rank first; **ad units that are not tags yet come next and are registered on pick**,
so the library fills itself and ops never has to know it exists. Pasting a VAST URL works the same
way. A card grid was built first and removed on review — ops search, they do not browse. A filled
rung carries a small ↗ to open that tag when it needs repointing. Focusing a filled search field
selects its text, so typing replaces the current tag rather than appending to its name.

**Not a sidebar destination (19 Aug review).** The tag *object* is load-bearing — it carries the
type, it is the stable referent a bulk write needs, it is what lets a changed GAM path be repointed
in one place instead of thirty, and it is what makes "where is this used?" answerable. The tag
*page* is a different question, and it did not earn a nav slot: nothing in the panel linked to it,
and it is the only one of the shared objects that is a **registry of external references** (18 of
23 seeded tags are just GAM ad units mirroring a directory we already sync) rather than config
someone deliberately authored. Sitting it beside behaviours, policies, and waterfalls made it a
peer of things it is not a peer of, and made Common Waterfalls compete with a list nobody starts a
task from. So the library stays, reachable from **wherever a tag actually appears** — the ↗ on
any filled rung opens it (confirming first, since it leaves an unsaved form), and `#tags` still
routes. You notice a tag points at the wrong place while looking at that tag;
that is where the way in belongs.

### Bulk editing — one guided journey (19 Aug, second pass)

**Bulk never writes an ad unit (20 Aug, PM call).** The call, verbatim: *"no one will put a common
ad unit across multiple integrations so dont give that option."* It is right, and it is the single
biggest thing that shaped this surface. A tag belongs to a property, a surface and a deal — pushing
one onto fifty is never the act. So five ops are **gone from the server**, not hidden behind a flag:

| Removed | What it did |
| --- | --- |
| `slotPrimary` | promote one tag to primary across a cohort |
| `slotRung` | write one tag at one position across a cohort |
| `slotReplace` | write a whole ladder of tags across a cohort |
| `slotTypeAdd` | give the sections without a display unit one |
| `slotRotationAdd` | add a common banner to every squeeze-back |
| `copyFrom` (21 Aug) | copy one integration's slots onto the rest |

A test pins it: every one of those five now returns `400 Unknown bulk action`, and the ladder they
would have written is checked untouched — so wiring a new screen to an old action name fails loudly
instead of quietly reaching live traffic. Tests that needed a ladder set up now go through
`PATCH /panel/keys/:id`, the same path ops uses on one integration.

**What is left is switches and order** — the things that genuinely have the same answer for fifty
integrations at once:

| Act | Server action | Addressed by |
| --- | --- | --- |
| Switch a slot on / off | `slotOn` `slotOff` | the slot |
| Switch a position on / off | `slotRungOn` `slotRungOff` | position |
| Drag a position up or down | `slotRungMove` | position |
| Move the display unit, wherever it sits | `slotTypeMove` | type |
| Switch the display unit on / off, wherever it sits | `slotTypeOn` `slotTypeOff` | type |
| Switch Waterfall N on / off, at whatever depth | `slotPoolOn` `slotPoolOff` | the pool |
| Attach ad rules / a player setup | `policy` `behaviour` | the object |
| Change a few ad-rule settings | `policyFields` | the settings |
| Take on / off air | `publish` `unpublish` | the integration (was `status`, cut 27 Aug) |

Every one of them **skips and names** rather than half-landing.

**One dialog, the slots as tabs (21 Aug, PM design review).** Reworked again the same day after a
second design pass — see **The sheet** below for the layout that stuck.

 Three shapes came before this one: a
cartesian menu of verbs, then a menu of destinations — which left a five-row step-1 screen floating in
~300px of dead white, because the constant frame was padded to the tallest sibling. Now the **tab bar
is the slot menu**, so that screen stops existing, and the frame is fixed **by construction** (a
680×614 flex box whose body fills and scrolls) rather than measured and padded to:

    Bulk edit                                      50 integrations · 51 sections
    [ Pre-roll ]  Mid-roll ·  Post-roll   Squeeze-back   Player setup
    LIVE      ▰▰▰▰  51/51                                            [On |Off]
    ⠿ PRIMARY / WATERFALL 1 / 2 / 3 / N                              [On |Off] each
      DISPLAY UNIT     [On |Off]   move to [P][W1][W2][W3]
    HOW IT BEHAVES · overrides the ad rules on every section
      Plays   [At start | Deferred]  by [5 sec]
                                              [Cancel]  [Review changes]

- **Switching tabs keeps every unsaved edit** — a tab with pending changes wears a dot — so ops can
  flip the pre-roll off, set the mid-roll cadence and attach a player setup in one visit, one review,
  one apply. Player setup is the fifth tab: pick one, it lands with everything else.
- Related rule numbers share a row and read as a sentence — *"first break at [240] sec, then every
  [480]"* — because four stacked label-field rows were most of a screen's height for one thought.
- Post-roll has no rule fields of its own, so its tab has no behaviour section rather than an empty one.
- Untouched fields write nothing; a field the cohort's rule sets disagree on says `mixed`. A rule set
  shared outside the selection is copied and only the selection repointed.

**The sheet (21 Aug, second and third design passes).** The first tabbed cut had three alignment
systems on one screen — the LIVE card right-aligned its switch, the ladder rows left-aligned theirs,
the rules controls started at a third x. The second pass gave every row one grid (label edge left,
control edge right) — and still read as **dry**: a wall of identical switches, all-caps labels, and
nothing between label and control. The third pass is the one that stuck:

    ┌ Pre-roll runs   ▰▰▰▰ 51/51                              [ On |Off] ┐
    │ Primary         (all 51 on)                              [ On |Off] │
    │ Waterfall 1     (31 on · 20 off)  runs [Video|Display]   [ On |Off] │
    │ Waterfall 3     none of them has one                          —     │
    │ Display unit    (all 12 on)                               [ On |Off] │
    └──────────────────────────────────────────────────────────────────────┘
    ┌ How it behaves  overrides the ad rules on every section             ┐
    │ Plays           (mixed today)     [At start|Deferred] by [7] sec    │
    │ Video starts    [Right away|After the ad chain|After at most] [ms]  │
    └──────────────────────────────────────────────────────────────────────┘

- **Two cards, parent above child**: the slot's master switch heads the ladder card, and switching it
  Off dims the rows it governs — the hierarchy is shown, not implied.
- **Every switch carries its position as a tiny counted chip** (`31 on · 20 off`). A bare On|Off next
  to a mixed cohort is a mystery, not minimalism — the chip is the switch's own state, which is a
  different thing from the read-only inventory this screen shed earlier.
- **Sentence-case labels**; caps survive only on section headers. `mixed today` is a quiet chip, not
  an amber sentence — differing is a state, not a warning.
- The frame is 780×652, fixed flex; every tab fits without a scroll.

**The banner question has ONE home (21 Aug evening — superseding the per-row ask below).** The
enable-time `runs [Video|Display]` seg was right as an idea and wrong as a placement: the banner can
sit at only one position, yet the question rendered on every row being enabled — three enables put
twelve buttons on screen for one decision, on top of the strip's move-to chips asking it again. The
per-row seg is deleted. **The Display strip is the single home** for the banner's position (move-to
chips) and its power (On/Off); enabling an empty position simply asks for video units in the review
(the slot's own family), and the row says so in its middle text. The historical note below records
the superseded design.

**Enabling a position asks what runs there (21 Aug, PM call — superseded same day, see above).** The old shape had a separate
"Display unit" row with move-to chips — model-shaped, not task-shaped. Now the question hangs off the
enable itself: flip Waterfall 1 to On and the row asks, inline:

    ⠿ WATERFALL 1        runs [ Video | Display ]      [ On |Off]

- **Video** (preselected — the slot's own family): ops who just wants "on" does nothing extra;
  sections with nothing there are asked for a video unit in the review.
- **Display**: each integration's display unit **moves to this position, wherever it currently
  sits** (`slotTypeMove`), and the ones without one are asked for theirs in the review. A ladder
  holds one display rung, so Display can be the answer at one position — choosing it elsewhere
  returns the previous row to Video.
- The Display unit's master switch lives in **its own dashed strip between the two cards** (21 Aug,
  PM call): it is not a position — it acts on the banner wherever each integration keeps it — and
  below Waterfall N it read as a rung tried after the end of the chain. The strip cross-references a
  queued move: *"moves to waterfall 1 — set on that row"*.
- **The fill-rate framing, decided 21 Aug:** a ladder holds ONE display rung — the settle point,
  "after this many video tries, take the banner money" — and the one legitimate two-banner setup
  (premium banner with a price floor first, catch-all banner second) is expressed as the display
  rung plus a display tag **inside Waterfall N**. Pinned by test.
- **The strip also carries the MOVE chips** (`move to [P][W1][W2][W3]`): when every position is
  already on, the enable-time Video/Display question never appears, so this is where "put the
  banner at waterfall 1" lives for an already-running cohort. Both paths write the same single
  intent, so they cannot disagree, and the strip's label starts at exactly the same x as the
  ladder labels above it.
- **Explaining:** tooltips are one line each; the full rule ("banner moves to X — whatever is there
  slides down a step; one banner per ladder, a catch-all can sit inside Waterfall N") appears as a
  **subscript note in the modal footer only while a banner move is queued** — said when it matters,
  gone when it does not.

**The viewer wait (21 Aug, PM request).** How long the viewer waits before content starts,
whether or not the ad chain has finished — `preRollWait`: **Right away** / **After the ad chain**
(default) / **After at most [N] ms** (`preRollWaitMs`, 100–15000). Lives in the ad rules, edited in
the Ad Rules editor and on the pre-roll tab in bulk. Warned with the arithmetic on both sides: a wait
shorter than one tag's timeout usually cuts even the primary off; a wait past 8s is a black player.

**Review is always the next step (PM call, 21 Aug) — and it reviews ONE INTEGRATION AT A TIME
(overhauled same day).** The first review was an aggregate — *"31 already on · 20 have nothing"* —
which asked ops to do arithmetic across fifty integrations in their head. The natural question is the
other one: *what happens to THIS one?* So the review is a master-detail:

    Review changes            50 integrations · 51 sections · 0 of 41 units added
    ┌─────────────────────────┬──────────────────────────────────────────────────┐
    │ ● TOI Mweb VideoShow    │  ET Android Astrology   ET · Android · 1 section │
    │   2 units to add        │  WHAT CHANGES HERE                               │
    │ ● ET Android Astrology  │   waterfall 1 takes a display unit — type below  │
    │   2 units to add        │   nothing at waterfall 2 — type its unit below   │
    │ ○ TOI Mweb Live TV      │   pre-roll rules: video starts … updated         │
    │   ready                 │   player setup → MiniTV, every section           │
    │ ✓ NBT Mweb Cricket      │   its ad rules (VideoShow) are shared with       │
    │   added                 │   integrations you did not select — its own copy │
    │  …scrolls…              │  ADD ITS AD UNITS                                │
    │                         │   Video unit at waterfall 2   [search……………]     │
    │                         │   Display unit at waterfall 1 [search……………]     │
    └─────────────────────────┴──────────────────────────────────────────────────┘

- **The integrations are a fixed left rail** (~30% of the width) with a state dot and one-line
  status: `2 units to add` (amber) / `added` (green) / `ready` (grey). The selection order is kept
  and the selected row scrolls into view.
- **The right side is that integration's own plan**, line by line, computed per section from the
  same drafts the apply reads: its switches, its display-unit move (with "already there" when it
  is), its rule updates, its player setup, and — when its rules are shared with unselected
  integrations — that *it* gets its own copy. An integration nothing touches says so in one line.
- **The plan is grouped by slot (21 Aug):** when more than one slot was actioned, each gets its own
  accent-tinted block — that slot's unit fields first, then what changes there — so pre-roll's plan
  and mid-roll's cannot run together, and the per-line slot prefixes/suffixes are gone because the
  boundary is the identification. Single-slot edits stay flat. Player setup is its own block; the
  shared-rules copy note stays one quiet line at the end.
- **The rail is a worklist (21 Aug):** integrations still needing a unit sort to the top, added ones
  next, ready ones beneath — alphabetical inside each band. The RHS leads with the actionable
  (the unit fields, immediately under the name) and the read-only plan is trimmed to **only what
  actually changes** under "Also changes here": no-op dims are dropped, and the "type it below"
  warns are dropped too because the fields sitting right above them ARE that statement.
- **Apply is fail-closed (21 Aug, PM call):** it stays disabled — with the count in the footer —
  until every integration needing a unit has one. Half-applied-with-skips is gone; shrinking the
  worklist means going Back and dropping the change that created it. The commit guards the same
  rule, so the disabled button is UI and the guard is the law.
- Picking a unit walks the rail to the next integration still needing one; the kicker carries the
  running `N of M units added`.
- There is no aggregate section at all — the per-integration plan replaced the counted rows, and
  the five aggregate-preview builders were deleted with it.

**The one gap-aware flow serves every enable:** a position, Waterfall N (the typed unit becomes its
pool), the display unit (typed straight into the target position), and the slot's own Live switch (the
typed unit is the primary — or the banner, on a squeeze-back).

**Copy a setup — removed (21 Aug, PM call).** It was the one act left that pushed the same ad units
onto many integrations; `copyFrom` is refused as an unknown action like the other five.

**Per-cohort rule settings (20 Aug, folded into the slots 21 Aug).** `policyFields` is the server
act; `BULK_POLICY_FIELDS` is its allow-list (pre-roll timing, the mid-roll spec, the squeeze-back's
turn-taking) — anything else is refused naming what the act *does* set. The two standalone dialogs
that fronted it are gone; the fields live on each slot's screen.

**Applying clears the selection.** Existing behaviour, and worth knowing: a second act on the same
cohort means re-selecting. Fine for one change; friction for *"switch waterfall 2 off, then add the
squeeze-back banner"*. Not changed here — flagged.

**Two rung bugs found while adding position targeting (19 Aug), both silent data loss:**

- **Writing one position over a slot that followed a shared waterfall dropped the rest.** A slot
  following a two-rung backfill (a tag *and* a house terminal that always fills) came out with a
  single rung and nothing under it — while the confirm promised *"each slot keeps its own waterfall rungs"*.
  The rungs a slot follows live on the waterfall, not on the slot, so they now get **materialised
  onto the slot** before one position is written. Nothing a section was running is lost because one
  rung was overwritten.
- **Placing a tag where it already sat elsewhere silently moved it.** A ladder cannot try the same
  tag twice, so asking for tag X at waterfall 1 in a section where X was already the *primary* had to
  move something — and what moved was the primary, the one position the screen promised not to
  touch. Those sections are now **skipped and named** (*"Left alone — already running that tag
  elsewhere in the ladder: ET Android MiniTV · Default"*) rather than quietly reordered.

**Filtering by which units run (19 Aug).** The list's headline fact is the `PRE MID POST DISP L-BAND`
chips per row, so it filters on exactly that: a **Units** pill with `Pre-roll on / Pre-roll off` for
each of the five. "On" means **at least one section** runs it — the same rule the row's chips use, so
the filter and the row can never disagree. Each option carries a **facet count** computed against
whatever else is already filtered ("if I click this, what do I get"), recomputed when the menu opens
rather than painted with the toolbar, because a bulk change in the same view moves those numbers. An
option that would return nothing **greys where it sits** and cannot be picked — every count was
cross-checked against the API, including the two that are structurally empty in the demo world
(`Pre-roll off`, `L-band on`).

**Object names (19 Aug, PM call).** `Player Behaviour` → **Player Setup**, `Monetization Policy` →
**Ad Rules**, and `Common waterfall` → **Shared waterfall** everywhere (the sidebar already said
"Shared Waterfalls" while every refusal message still said "common"). "Monetization" oversold what
that object does — it sets no price and books no demand, it only says how ads behave once they run.
"Ad rules" is a **mass noun**: one object *is* a set of ad rules, so copy reads "New ad rules",
"Ad rules named X already exist", never "an ad rules". Field names (`monetizationPolicyId`,
`playerBehaviourId`), routes (`/panel/policies`) and ids are **unchanged** — this was a vocabulary
change, not a data-model one.

**Paging and select-all-matching (19 Aug, Gmail pattern).** The list pages at 50 with a
`1–50 of 342 ‹ ›` range in the toolbar. The header checkbox selects **this page only**; when the
page is full and more rows match, the selection bar offers the rest as one explicit act. Bulk
changes reach live traffic, so a 342-integration selection is never something you arrive at by
accident. **Changing a filter or the search clears the selection and returns to page 1**, so a bulk
change can never reach integrations the current filters no longer show.

**One bar, not two (19 Aug).** The offer first shipped as a second strip below the selection bar.
Two stacked lines about the same selection, each stating its own count — *"50 integrations
selected"* over *"All 50 integrations on this page are selected"* — which is the same fact twice in
different words, and made the eye hop between rows to assemble one thought. It is now a single line:

    50 integrations selected  [Edit a unit] [Change attachment ▾]  Select all 67 that match these filters      [Clear]

The count is stated **once**, and widening it is a link on the same line rather than a paragraph on
the next one. Taking it changes the count to 67 and the link to *"Select just this page"* — no
second sentence needed, because the count already moved. The link sits **after** the action buttons
so those never shift position when it appears or disappears, and the bar is painted once with the
span toggled imperatively (the toolbar-stability rule). The bar wears the **notice yellow** the
banner used to: a selection is a temporary, consequential state, and colouring it like the brand
made it read as chrome.

The list has checkboxes; the filters carve the cohort and the header checkbox selects the page. **Every bulk change reaches every section** of each selected integration (user call,
19 Aug) — one rule, no sub-choice, and the activity log names each section it touched.

**Why it was rebuilt.** The first pass split the bar into a **Switch slots ▾** menu and a
**Waterfall ▾** menu. That is a *system*-shaped division, not a task-shaped one: it made ops
classify their intent ("is this a switching job or a laddering job?") before they had even named
the unit they were touching, and it produced a ten-item cartesian menu (five units × on/off). Ops
think noun-first — *"the mid-roll on these twenty needs something."* So the bar now has one entry
point, **Edit a unit**, and the unit comes first.

**One frame for the whole journey (19 Aug).** Step 1 was 600×462 and step 2 was 700×342 — the modal
changed size *and* shape between two screens of the same task, so the eye had to re-find the footer
every time and it read as two unrelated dialogs. Both steps are now **680×453 in every state**: the
width is fixed, the body carries a floor, and the one genuinely unbounded list (*Primary today*) is
bounded by construction rather than by a scroller. Verified across all five units at both a
50-integration mixed cohort and a single integration — twelve states, one rectangle.

**The journey — one decision per screen, each with a Back:**

1. **Which unit?** — five rows, each with **one** counted fact: how many sections run it, as a
   fraction and a small bar. Nothing else.

   | | Live |
   | --- | --- |
   | Pre-roll | ▓▓▓▓▓▓ **51**/51 |
   | Mid-roll | ▓▓▓░░░ **31**/51 |
   | Post-roll | ▓░░░░░ **9**/51 |

   Two earlier cuts got this wrong in the same way. The first gave each unit a prose line —
   *"live in 51 of 51 sections · 41 with their own tags · 4 sharing 'ET video backfill' · 3 sharing
   'NBT video backfill'"* — five clauses per row that nobody in a hurry reads. The second turned
   that into a tidy **Tags from** column (`41 own · 10 shared · 24 none`), which was more scannable
   but still answered a question ops never asked: *where the platform files each section's tags*.
   Own-versus-shared is storage. It changes nothing about which unit you came here to touch, and
   putting it on the picker made people decode a data model before making a choice.

   So the picker asks one thing and shows one number. The breakdown still exists on the row's hover
   for anyone who wants it, and the one part of it that changes an outcome — *some of these have no
   tag, so they cannot be switched on* — is stated on step 2 next to the switch, where it is
   actionable, instead of as a column two screens earlier.
2. **The unit's own screen** — not a menu. The first cut listed four "options": build a ladder /
   follow a waterfall / set the primary / edit the shared one. They were never peers — two of them
   are *the same question* ("where do these tags come from — their own ladder, or a shared one?")
   and two are shortcuts *inside* those answers. Four rows for one decision plus two shortcuts is a
   menu of the system's internals, not a journey. So the screen shows the unit's configuration as
   it stands across the cohort and lets you edit it in place:

   - **One state row, then the field.** `Live 31/51` with the `On | Off` segment beside it —
     whether a unit runs is a **state**, not a pair of choices — and, where it applies, the single
     line that explains the gap: *"12 have no mid-roll tag yet, so they stay off"*. That is the fact
     that predicts which integrations a switch-on will skip, said at the switch.
   - **The primary field is next, and it already has the caret.** Setting a primary is: pick the
     unit, type, Apply. The field is focused on arrival but its menu stays shut until you type —
     landing on a form with a full-height dropdown already covering it is not a head start.
   - **Any position, not just the primary** (19 Aug). *"Swap the second one, keep the first and the
     third"* is an ordinary request, and the screen used to hard-code the primary. The rung label is
     now the control: **Primary / Waterfall 1 / Waterfall 2 / Waterfall 3**, and the line under it says what
     survives — *"Only waterfall 1 changes — every other position stays as each section has it."*
   - **`Primary` and `Waterfall n` are different operations, deliberately.** Setting the **primary**
     *promotes*: whatever was first drops to waterfall 1, so nothing is lost. Setting a **waterfall rung**
     *swaps* that one position and leaves the rest alone. Each matches what the words mean.
   - **"When you apply" — what this will *do*, counted per section** (19 Aug, replacing a ranked
     inventory of what sat at that position). The inventory was accurate and useless: by the time
     ops are on this screen they have already decided what they want, and a league table of what is
     currently there does not change that decision. In a hurry the open question is the other one —
     *"I am about to touch 51 live sections, what exactly happens to them?"* — and above all,
     **which ones will not do what the button says**, because that is otherwise the thing you find
     out afterwards. So:

     ```
     WHEN YOU APPLY
      33  take it at waterfall 1 — what is there now is replaced
      17  gain a waterfall 1 — nothing was at that position
       1  left alone — already in their ladder (TOI Mweb VideoShow · Shorts feed)
      10  also stop following a shared waterfall, keeping the tags it gave them
     ```

     Number first, because the number is what gets scanned; the sentence is there for the one row
     that surprises you. The first rows always sum to the cohort. Skips are **named**, not counted
     away. It recomputes as the position or the tag changes, and before a tag is picked it says so
     rather than showing an empty box.

     **The same rows are the confirm.** `outcomeRows()` is one function feeding both the live
     preview and the dialog that commits it, so they cannot drift and do not describe the same act
     in two different vocabularies. Verified end to end: the preview predicted *50 changed, 1 left
     alone*, and the server returned exactly that, naming the same section.
   - **One control for where the tags come from** (19 Aug, replacing two footer links). *"Write the
     whole ladder"* and *"Follow a shared waterfall"* were two links that each swapped the screen
     for a different one. They are two answers to a single question, so they are one segment on a
     **Tags** row that mirrors the Live row above it — same micro-label, same place, same shape:

     ```
     LIVE  ▓▓▓ 51/51                                          [ On | Off ]
     TAGS  write primary only          [ One rung | Own ladder | Shared ]
     ```

     `One rung` writes a single position and leaves the rest as each section has it; `Own ladder`
     writes every rung here; `Shared` follows a waterfall. The answer is **preselected from what the
     cohort already does**, so nothing has to be decided before work starts, and switching changes
     the editor *in place* rather than replacing the screen. `One rung` only appears on a mixed
     cohort — when every section already runs the same ladder there is one to show, so editing a
     single rung is just editing it.
   - **Choosing `Shared` with nothing picked yet shows the waterfall search in that same space** —
     the search is the state, not a separate screen. Backing out of it with nothing ever chosen
     falls back to where it came from rather than leaving "Shared" describing nothing.
   - **Sharing is available, not in the way.** A followed waterfall shows one line — *"Follows
     **TOI video backfill**"* — with `Change` and `Open →`, and beneath it the same one-line summary
     the picker used to describe it (*"TOI Video Backfill +2 backups → house"*), so the two views
     say the same thing. Editing a shared object reaches everything pointing at it, so it stays
     visible; it does not stand between ops and the field they came to type in.
   - **`Shared` gets the same counted preview.** *"48 start following it · 3 already follow it · 41
     set their own rungs aside — kept, and used again if you unlink · 4 stop following 'ET video
     backfill'"*. The store keeps a slot's own rungs while it follows, so this says **set aside**,
     not lost — the difference matters when it is about to happen to 51 live sections. Verified end
     to end: the preview said 48 + 3 = 51, and the store went from 13 following to 54 (the 51
     selected plus the 3 outside the selection). **Not** a mode toggle: the
     first cut asked `Its own ladder | A shared waterfall` up front, which made people classify
     storage before seeing a single tag. Sharing is a property of the waterfall, shown as a badge.
   - Under it, **the thing itself**: the rungs (a search field each, ↑↓✕, add waterfall, house promo).
     Nothing is hidden behind another click.
   - **One Apply** at the end, however many of those were changed. Each change still lands as its
     own bulk call, so every integration keeps its own activity entry.

   **When the cohort's ladders differ** there is no shared list to show, so it edits **only the
   primary and leaves each slot's own lower rungs alone** — the safe default — with an explicit
   *"Replace them too"* to take the destructive path. Moving from a shared waterfall to an own
   ladder says, in the confirm, that they stop following it.

**Impossible choices grey out where they sit, carrying the reason** — the same principle the v2
platform uses, applied here. *Reorder* is only live when every selected slot follows one common
waterfall; otherwise it sits greyed saying *"they follow 3 different waterfalls, and 2 hold their
own tags — no single one to edit"*. The `On` segment greys when no section has a tag to run. Nothing fails after the click.
Greyed rows lose their border and background so they recede rather than competing with the live
ones — present and explained, but never mistaken for a choice.

**Cancelling a picker returns to the action list**, not out of the whole journey — a wrong turn
costs one click, not the whole flow.

**A switch-only change never has to satisfy the tag rules.** The screen tracks whether the tags
were actually touched; switching a unit off across a mixed cohort — the single most common bulk
act — was briefly blocked by a "search for the primary tag first" guard meant for the tag editor.

**Refusals name the right reason.** Fail-closed still applies: an integration whose Default section
would be left with nothing live is skipped. The message distinguishes the two cases — switch-on
refusals say "nothing there to switch on", switch-off refusals say "it is the only unit they run".

**Switch-on is per section, not per integration.** It lights only the sections that have demand; a
section with no tag for that slot **stays off and is named**, rather than failing the whole
integration. (That was a real defect found while running it: one follower section without a
mid-roll tag would have failed all of its siblings.) An integration with nothing to switch on
anywhere is reported as skipped, by name.

**Change attachment ▾** stays a separate menu — policy and behaviour are a different object, not a
unit. Default is repointed **and section overrides are cleared**, so "all sections" really means all
sections; the dialog says so.

Unchanged: every option opens the **two-step preview** (card grid → full spec → apply, affected
integrations named), and **every changed integration gets its own activity entry** — never a vague
"bulk op". No-ops report "already there". `POST /panel/keys/bulk {ids, action, value}`, actions:
`policy` · `behaviour` · `status` · `slotOn` · `slotOff` · `slotWaterfall` · `slotPrimary` ·
`slotReplace`. Type mismatches are refused **before anything is touched** — a display waterfall can
never half-land on a video slot.

### What the policy lost, and what replaced it
Removed: `preRoll: 'off'` (the enum is now **at start / deferred** — timing only), `midRoll`,
`postRoll`, `bannerEnabled`, `lbandEnabled`, `fallbackEnabled`, `fallbackMaxAttempts` (a waterfall's
length *is* the attempt count). `fallbackTimeoutMs` became **`perTagTimeoutMs`** — how long each
rung waits before the ladder falls through.

Because nothing switches units on or off any more, a policy is a **complete behaviour spec**: break
positions and both overlay moments are now always required, whether or not a given integration runs
them. The obvious objection — "is this even used?" — is answered by counting instead of implying:
each unit carries a **"live on N of M"** micro-label, counted from the integrations using that
policy. An L-band nobody runs reads "live on 0 of 3" rather than hiding behind an off switch.

### Player setup
A **lifecycle editor** (19 Aug redesign) — one card, four numbered groups **stacked in the order
a viewer experiences the player** (user call: stacked over side-by-side, some scroll is fine): **1 · It loads** (preload, cellular cap) ·
**2 · It starts** (autoplay, playback mode + redirect URL, start volume, fallback media) ·
**3 · While watching** (controls, seeking, **scrolled out of view: docks to corner / pauses /
keeps playing** + docked-player dismissible) · **4 · It ends** (loop / play next + countdown /
replay + related). Compact label-left rows (`hfield`), no scrolling. The old sticky on/off pair
was consolidated into the richer off-view choice — "sticky" was just one of its three answers.
Rules: redirect URL required only for inline + redirect (dropped otherwise); controls "none"
forces seeking off; dismissible applies only when docking.

### Ad rules
Behaviour only — see "What the policy lost" above for what the 19 Aug rework removed.
Breaks, laid out in timeline order (pre → mid → post): pre-roll as a **timing choice** — at start /
deferred until the video reaches N seconds (3–60, warns past 15) · mid-rolls at
**fixed positions only** (comma-separated, "6:00" or "360", parsed/deduped/sorted server-side,
junk refused by name, sub-60s gaps warn, **always required**; 4+ positions warns) ·
**snapback** (viewer seeks past a break: play it first / let them pass — defaults to play) ·
post-roll (nothing of its own to set — it plays at the end, under the shared ad experience) ·
(cut 17 Aug on review, not needed for v1: placement modes — markers/interval —,
first-break offset, last-break buffer, min video duration, max breaks, pod size/length caps) ·
overlays take **multiple show times** (comma-separated, same parser as break positions; always
required) with one duration each, coordinated by a single **overlay gap** (10–600s,
default 60): one overlay at a time across banners and L-bands, anything due sooner waits its
turn, L-band wins ties; moments inside the gap warn on save ·
ad experience (countdown — hidden / shown / shown + "Ad 1 of N"; ad sound — muted / muted +
"Tap for sound" / with sound; **no skip control** — skippability arrives in the VAST response
with the creative that was sold, the player only honors it; cut 17 Aug) · overlays as **two independent units that can run
together** — banner (a strip over the video: appears at / stays for / dismissible) and **L-band
squeeze** (video shrinks into the corner, ad fills the L: squeezes at / holds for; valid on VOD;
no close button) — with a fixed precedence rule, deliberately not a knob: they never show at
once, the L-band goes first and the banner waits (due within 30s of each other warns) · pause ad
(+ delay so tap-pauses never flash an ad) · frequency (max ads/session, cooldown) · **Advanced, collapsed by default** (**per-tag timeout**
— how long each waterfall rung waits, carrying the counted worst-case line — request timeout,
hard cap 8000 ms, retries, no-fill action, click target, companion ads with backfill/persist,
adjacent slot refresh: off / at break boundary / timed, min interval, viewability gate).

**Layout (19 Aug):** same dense lifecycle grammar as the behaviour editor — four numbered groups
(1 · Breaks → 2 · Ad experience → 3 · Overlays & pause → 4 · Frequency) of compact label-left
`hfield` rows in one card, plus the collapsed Advanced block. Related numbers share a row
(shows-at + duration + dismissible on one line). Roughly 40% shorter than the fieldset-per-group
version it replaced.

The editor aggregates paired settings into single decisions — skip (not skippable / skippable
after Ns), countdown (hidden / shown / shown + "Ad 1 of N"), ad sound (muted / muted + unmute
prompt / with sound) are one segmented control each; the stored model stays granular. The
collapsed Advanced header carries a one-line summary so nothing is invisible. Dependent fields
are normalized server-side (no companions → no backfill/persist; refresh off → no viewability
gate).

**Guardrails:** playback-breaking values are refused with the number named; merely-heavy values
(4+ breaks, 12+ ads/session, <60s first break, ≥6s timeout, a full ladder waiting over 6s) save
with a logged warning — levers, never walls.

## Settings, not references (21 Aug, PM call)

The integration editor stopped showing WHICH ad rules a section is linked to and shows THE SETTINGS
instead — the effective values, however they got there: copied from a template, bulk-edited, or
changed by hand right here. After a bulk change to the pre-roll, the row now shows the new timing;
the old name-reference showed nothing.

    AD RULES        Pre-roll at start · breaks at 4:00, 11:00, 18:00 · 8/session   View · edit
    PLAYER SETUP    Autoplay muted · docks on scroll · preload metadata            View · edit

- **Click → the settings modal**: the operational fields editable (pre-roll timing + viewer wait,
  mid-roll spec, squeeze-back turn-taking; for the player setup: autoplay, preload, controls,
  out-of-view), and below them **"Everything it does"** — the full value spec. No template name
  appears anywhere.
- **Copy-on-write on save**: the first manual edit gives this integration its OWN copy (the pointer
  moves in the form draft, so the key's Save confirm still names the change); later edits hit that
  copy in place — verified: no fork chains. Anything shared — with another integration, or with
  another section of this one — is never edited from here.
- **A template is copy-paste, never a live link.** "Copy from a template…" copies the settings and
  the trail ends there; editing the template later cannot reach an integration that started from it
  (pinned by test). Bulk attach makes ONE copy for the cohort — they were set together, so a bulk
  change still moves them together, and any narrower edit forks again.
- The template library (Ad Rules / Player Setups pages) is unchanged — names live there, where
  templates are made and maintained. Copies appear in it as "<name> copy", visible and deletable.
- The section summary line dropped the names too: `PRE · MID · own rules` instead of naming objects.
- Known cost, accepted: copies accumulate in the library as integrations diverge — the same
  trade-off the PM chose for bulk rule edits, made visible rather than hidden.

## Rules the tests pin down
1. Integration creation fails closed: no behaviour, no policy, no slot switched on, or a slot
   switched on with no tags → machine-readable refusal naming each field.
2. Demand and behaviour stay separated: a policy carries no on/off switch for any unit, and its
   break positions and overlay moments are always required.
3. Typed demand holds: video tags lead pre/mid/post-roll and display tags may sit at any rung in
   them, display tags only in a squeeze-back, one primary + three waterfall rungs, no repeated tag,
   the pool terminal and capped at 3.
4. Switching a slot off keeps its tags; bulk switch-on lights only sections with demand and names
   the rest.
8. Bulk acts addressed **by type** land wherever each section keeps its display unit — a different tag
   in each — and name the sections that have not got one; nothing ever moves past Waterfall N.
   **A break falls back to ONE display unit** — a second display rung is refused naming both tags
   (found 21 Aug: the rule lived on a deleted bulk action and the editor had quietly stopped
   enforcing it, which would have made every by-type act ambiguous). Moving the display INTO an
   occupied position never replaces the incumbent — the ladder reorders around it, everything
   keeping its relative order. A full ladder is never offered a display field that would no-op:
   the plan says "no room" instead.
   Giving those sections one is a separate act that touches only them, never truncates a full ladder,
   and leaves every section that already has one running exactly its own tag.
9. Bulk acts addressed **by position** step over Waterfall N — they cannot overwrite, switch or drag
   the pool, which has its own switch.
10. A rotation refuses ladder ideas (a pool, a position to move to) and a ladder refuses the
   additive rotation act; a common banner joins a rotation without discarding what is there.
11. A cohort ad-rule setting changes a rule set in place only when nothing outside the selection uses
   it, otherwise it copies and repoints only the selection; the field allow-list is enforced.
12. Bulk never fans one ad unit out: `slotPrimary`, `slotRung`, `slotReplace`, `slotTypeAdd`,
   `slotRotationAdd` and `copyFrom` are refused as unknown actions, and the ladder they would have
   written is checked untouched. The fix-up step writes ad units, but one integration at a time,
   through each key's own `PATCH` — a typed unit per integration, never one tag across fifty.
5. In-use behaviours/policies/tags/waterfalls cannot be deleted; tags and waterfalls cannot be
   retyped while in use; every refusal names what holds them.
6. Every change is recorded with actor + prior value → new value, in the object's own version history (the rail). Nothing is silent. *(The global Activity view it used to name was cut 27 Aug.)*
   Each editor shows a **History rail** on the right: a per-object timeline (latest 8) with a
   one-line glimpse per change — `Field old → new`, or `Field updated` when values are too long
   (URLs) to read as a diff. There is no sign-in yet, so live changes are recorded as **"You"**;
   the named actors in the demo world are seeded mock data.
7. Reset is deterministic: same ids, same key strings, every rebuild.

## Web code layout (no build, plain scripts, everything global)
`web/js/` in load order: `util.js` (labels, toasts, `ask` dialog — never native confirm),
`api.js` (every request is a named operation — no view writes a URL), `controls.js` (segmented
enums, toggles, number+unit fields, domain chips, attach-picker cards, form diff),
`cardPickDialog` (a card grid then a spec preview — the editors' attach flow; the `stepDialog`
control was deleted 21 Aug when the bulk tabs made it callerless),
`publish.js` (the version rail and the publish plane, one implementation for both rooms),
`review.js` (THE CHANGE REVIEW — the one screen bulk Apply, Save and Publish all confirm on),
`views-keys.js`, `views-behaviours.js`, `views-policies.js`, `views-tags.js`,
`views-waterfalls.js`, `views-activity.js`, `main.js` (hash router + nav counts). `rungRowHtml`
lives in `views-waterfalls.js` and is drawn by both ladder editors, so a waterfall reads
identically wherever it appears. List toolbars paint once; filters repaint rows only, so the
search caret survives.

**Visual language (19 Aug review):** the grammar stays a dense console — the refresh added weight,
not chrome. A deeper neutral ramp and real elevation tokens (`--shadow-1..3`); a sidebar that is
**grouped** ("Shared configuration"), iconed, and carries an accent bar on the active row; sticky
uppercase micro table headers with a hairline separator and an accent edge on row hover; buttons
with a press state; a bulk bar that reads as an action band; dialogs over a blurred, deeper veil.
The sidebar widened 232 → 256px because "Ad Rules" was truncating, and a nav that
hides its own labels is not an enterprise nav.

**Nav & list design (19 Aug review):** the sidebar is a tree — Integrations parent, the three
authored shared objects indented as children (they exist to serve integrations; Ad Tags is
deliberately not among them — see above); Activity had no nav item and was cut 27 Aug (it was reachable from
History rails); the sidebar footer is "New API key" (Reset demo data removed from UI — the
endpoint and `npm run scenario` remain). Tables are flat console grids: sentence-case headers,
dense rows, accent-blue row names, plain mono key strings, sections as plain text, status as a
colored dot+word (still click-to-toggle) — deliberately not the rounded-card/uppercase-header/
chip-everywhere template look.

**Route transition (19 Aug):** every view switch runs through `route()`, which shows a 2px accent
progress bar pinned to the top of the window and fades the new view in (180ms, opacity only so
sticky rails/footers never jitter). The bar is **delayed 90ms** so instant local navigations never
flash it, and a sequence guard drops stale renders when a newer navigation wins the race. Honors
`prefers-reduced-motion`.

**Editor header (`ehead`, 19 Aug):** every editor opens with a **single 28px line** — back arrow ·
property badge · name · status · (integrations only) the API key string, copy-on-click, right
aligned. The stacked crumb + big title + meta byline block was removed; content now starts 72px
down on all four editors. Explanatory bylines under identity fields were cut too — the labels
carry the meaning.

**Dependent rows (`hf-child`):** in the dense editors, a row that depends on the one above it
indents under a thin rail with a lighter label, while its control stays in the same column as
every other row — hierarchy without nesting boxes, single-line density preserved. This replaced
the earlier `.unit`/`.unit-body` blocks in the policy and behaviour editors (those remain the
pattern where a toggle owns a whole sub-block, e.g. the key's ad sections).

**Hierarchical units — the IA pattern for BOTH editors:** wherever a control owns dependent
settings, the form uses the `.unit` pattern — parent control (toggle *or* segmented choice) on
top, children indented beneath it under a left rail, greyed as a group when the parent makes them
irrelevant. Independent decisions stay as flat fields in a row. Policy units: pre-roll → defer
time · mid-rolls → positions + snapback · banner/L-band/pause ad · fallback → attempts/timeout ·
companions → backfill/persist · adjacent → interval/viewability. Behaviour units: playback mode →
redirect URL · end of video → up-next countdown · controls → seeking · sticky → dismiss. Fixed
rules between units render as a `.rule-note` statement, not a control.

**Fixed control widths:** fields never stretch their controls — number+unit boxes are one fixed
width everywhere (150px), non-grow text inputs one width (260px), hints wrap inside a cap instead
of widening the box; only `.grow` fields fill the row.

**Every state-changing button confirms** (user rule, 19 Aug): Save/Create/Duplicate/Sync/Remove
all ask first, with minimal text. One dialog per action, never two — where a richer dialog
already exists (live-traffic diff, applies-to-N-keys diff, bulk confirm), that IS the
confirmation; the minimal one appears only otherwise. Edits always show the field diff.

**Form stability contract:** forms paint once per view. Every field is always in the DOM —
inapplicable ones grey out in place via `data-dep` (a per-form dependency map), never inserted or
removed, so toggling never shifts the layout. Controls update their own classes/labels
imperatively (`segClick`/`toggleClick`/`pickClick`); a full repaint happens only on a failed save,
to draw inline errors. A timeline preview was built and removed on review (17 Aug) — don't
reintroduce without asking.

## Live streams — scoped 18 Aug, not built

Live gets its **own block** on the policy (not a preset), because live breaks don't work like
VOD breaks. The scope, agreed with the user:

- **Content type flag** on the policy: VOD (today's model) / Live. Live swaps the Breaks block:
  - Pre-roll on joining the stream: on/off only — no deferred (a live viewer joined for *now*).
  - Mid-rolls are **signalled by the stream** (SCTE-35 cue from the encoder), never at fixed
    times. Policy controls: honor signals on/off · max break length to cover · return-early
    behaviour when the ad pod is shorter than the signalled window (slate vs rejoin).
  - No post-roll, no snapback (nothing to seek past; the stream doesn't end).
- **Overlays**: banner, L-band squeeze, and **ticker** all valid — live is where they earn their
  keep. (Banner + L-band already exist for VOD; ticker is live-only.)
- **Delivery**: tight timeout (~2500 ms), 0 retries, fallback off, no-fill returns to stream
  immediately — live cannot absorb latency, and these should not be ops-editable.
- **Frequency**: per-hour caps instead of per-session (live sessions run for hours).
- Open questions: do live streams get their own API keys or share the property's key? · is the
  SCTE signal trusted as-is or gated by the panel? · pause ads during DVR/pause-behind-live?

## Out of scope for v1 (deliberate)
Rotation on display slots (the 19 Aug call: display ladders mean *fallback*; rotation returns later
as an explicit per-slot switch, and the rung shape is kept rotation-compatible so it stays a flag,
not a re-model) · arbitrary bulk reorder across integrations holding different tags (only defined
via a shared shared waterfall) · versioning + one-click rollback, approval workflow, environments (test/live slices),
per-video overrides, pre-roll failure-rescue retry (deferred timing is in; the retry-on-no-fill
variant was considered and dropped). Version history per object is the v1 audit story (the global activity log it replaced was cut 27 Aug).
