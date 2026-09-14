# Player Console — what it is and where its edges are

The Player Console is the self-serve panel for ad delivery inside Slike's video players.
Today this work is spread across GAM screens, config files and requests to engineering;
the console puts it in one place, split into two rooms so two teams can work without
stepping on each other. The **product team** owns Integrations — one per player surface
(TOI Mweb VideoShow, NBT iOS MiniTV), holding the player's identity and behaviour and the
switches that say which ad breaks run. **Ad ops** own Ad Setups — the demand: which ad
units fill each break, in what order, on what schedule.

Everything here runs against an in-memory mock API, so the whole world can be rebuilt in
milliseconds and every number on screen is counted from real state, never estimated. It
is a working prototype of the product, not yet wired to production systems.

![The integrations list](img/integrations-list.png)

## The pieces, and the one promise that ties them

| Piece | Owned by | What it is |
| --- | --- | --- |
| **Integration** | Product | One player surface: name, property, platform, domains or package, the player fields, custom player configs, and per-break switches and quick decisions |
| **Ad setup** | Ad ops | The demand for one integration: placements, each with four breaks (pre-roll, mid-roll, post-roll, out-stream), each break a ladder of ad units |
| **Ad tag** | Ad ops | One ad unit or endpoint: IMA and GPT tags point at GAM ad-unit paths, CAN tags at a URL |
| **Request template** | Ad ops | A named request URL shared account-wide; its macros are a fixed list of five the player fills |
| **Custom player config** | Product | A named set of overrides a page asks for by key (`shorts`) — any of the player's fields, carried sparse, inheriting the rest live |

The rule that shapes everything: **one integration asks from exactly one ad setup** — a
surface has one source of demand, never two. The other direction is open (8 Sep): **one ad
setup may fill many integrations**, because the same ladder across mweb, desktop and app
is the ordinary case, and keeping it as a fleet of photocopies means it drifts the first
time anyone tunes one. A shared setup is a *link*: edited once, in one room, it moves
every surface that asks from it — so every door that maps one names who else already
does, and the setup's own page lists them. When a surface wants demand of its very own,
**Copy & use** takes a photocopy — placements, ad units, deals and settings whole — and
tuning that copy never moves the original.

## The integration page

One page, four cards. **Details** at the top is identity alone (platform decides what is
asked for — web platforms need at least one domain, app platforms a package name; the
other field greys out where it stands).

**Player config** is the second card, and it is ONE GRID: rows are the player's settings,
the first column is the **Default**, and every custom config a page can ask for by key is one
more column beside it. Three sections fold the rows — **Playback** (how the video plays),
**Controls & appearance** (what the viewer sees and can touch) and **Analytics &
measurement** (what is reported) — each one line at rest carrying the default's headline
values and, in each config's column, how many cells of that section it sets (`3 differ` /
`same`). Inside a fold, eight quiet row groups (Start, Source, Out of view, Completion │
Controls, Appearance │ Reporting, Vendors) chunk the rows. The header row sticks under the
page's fixed header while the card is in view, so deep in a fold the columns are still named.

A cell is a VALUE until it is clicked, and then it is its control, in place: a menu for a
choice, a typeable box for a number or a text, chips for a set, the OS colour wheel with a
typeable hex for a colour (the text colour previews the pair as `Aa`, with a contrast that
fails visible where it is chosen). A switch is drawn as a switch because it is its own value.
Enter commits, Escape reverts, Tab steps to the next cell, arrows move, and typing on a
focused cell starts editing it. Timings read in seconds and travel in milliseconds; a blank
timing is off. A value a column cannot apply right now greys where it sits with its reason
(Controls: None takes the three settings under it with it, in that column only).

A config's column says what a config IS without a sentence: a cell that follows the default
is faded read-through; a cell the config sets is full weight in the accent's ink, with × to
let it go (or Backspace on the cell, or `Default` at the top of its menu). Everything a config
never touched follows the default live. `+ Add config` adds a column with the cursor already
in its key, held to the same rule the server holds it to: one word, unique, never "default";
the column head carries the config's switch and its ⋯ (show only this config · follow the
default for everything · remove).

With several configs the grid grows wide, and most work happens in one config at a time, so
**a column can be focused**: the count on any closed section row (`3 differ`, `same`) shows
that config beside the default with that section open, and the column's ⋯ says the same in
words. The default never leaves, because a config IS its differences from the default. The
header's own leading cell then carries the way back, counted (`‹ All 6 configs`). Escape
unwinds the narrowest thing first: the open cell, then the open section, then the focus.

Ad behaviour fills the rest: which setup this surface fills from (a chip that opens the
setup's own editor and brings you back with unsaved edits intact), four break tabs, and
per-break quick decisions — who is asked and in what order, how deep the waterfall goes,
where mid-roll breaks fall, when the pre-roll starts. Every decision is stored as sparse
intent: drop it and the break follows the ad setup again. The right-hand panel shows the
resolved waterfall — the exact walk the player would run, computed the same way the
server computes it.

![The integration editor](img/integration-editor.png)

## The ad setup page

Placements are tabs (the active tab is its own rename field). Each break opens into
zones down a left rail: **Pods** (a mid-roll may run up to three, each owning its own
special deal, ladder and cadence), **Special** (one uncapped deal per break or pod, tried
before everything else), **Ad sources** (the ladder — one primary, up to nine fallbacks,
drag to reorder; the word covers a break's own units and the shared waterfall alike), and
**Delivery settings** — led by **Header bidding**: `Auto` (the setup's own answer, named
beside it), `Off`, or `Custom` with `Amazon+Prebid │ Amazon │ Prebid` under it; then the
timings. Each ad unit is ONE BLOCK — the unit, its counted fact line and its
settings as three tiers of one soft shape; the caret at the block's end opens and closes
the settings, and so does putting the caret in the unit's field. Every break can be cleared with a
counted confirmation, and the whole setup at once from the ⋯ menu — demand only,
delivery settings stay.

![The ad setup editor](img/ad-setup-editor.png)

## Editing many surfaces at once

Selecting integrations in the list opens three bulk acts. **Ad behaviour** is a clean
slate: every lever starts closed showing only the cohort's counted today-word ("full
waterfall", "3 different values"); opening one draws the control unset, and only a
deliberate pick queues a change. **Default player behaviour** sets the player's four
facts across the cohort in one step. **Custom player behaviour** walks each selected
integration whole, forks included. Bulk writes are per-integration: a surface the change
cannot apply to is skipped and named, never silently included.

![The bulk ad-behaviour sheet](img/bulk-ad-sheet.png)

## Creating things

New integrations and new setups start from one chooser: blank, or a photocopy of an
existing one. An integration copy carries the player, its named configs, the switches and
quick decisions, and the setup mapping — a setup someone else holds becomes the copy's
own at the moment of Create, so cancelling leaves nothing behind. A setup copy brings
everything, ad units included. Creation always lands in the real editor, and the one
write is reviewed field by field on the same change-review screen every write ends on.

![The new-integration chooser](img/new-integration-chooser.png)

## Going on air — the publish plane

**Save never changes what viewers see.** Save writes a draft; Publish stamps an
immutable, numbered version and swaps what the player's API serves. History is
append-only — restoring an old version publishes it again as a new one, so every restore
is itself undoable, and the restore dialog names any unpublished draft work it would
overwrite before it does. Taking a surface down is Unpublish, a deliberate act, never a
hidden status field.

Because an integration and its setup publish separately, every publish answers one
question against what is actually live: *would this leave a switched-on break with
nothing published behind it?* Publishing an integration whose break has no live demand is
refused naming each dark break; publishing or unpublishing a setup that would darken a
live surface is refused naming the surface. And belt-and-braces, the served JSON simply
omits any break whose demand is not live.

## The details that bite (read this before building against it)

**Seconds on screen, milliseconds in the store.** The UI never shows milliseconds — every
duration is typed and read in seconds. Exactly two fields are *stored* in milliseconds
because the player's JSON contract wants them that way: `waitMs` (shown as "Hold video
for the ad", served as `maxWait`) and `tagTimeoutMs` ("Request timeout", served as
`timeout`). The conversion happens at one seam on each side of HTTP — `fmtMs` in the web,
`fmtSecs` in the API — and every other numeric field is stored in the unit it displays.

**Time is written two ways.** Cue points and out-stream show times accept plain seconds
("360") or minutes:seconds ("6:00"), up to four hours; the list is deduplicated and
sorted, and a token that isn't a time is refused by name, not dropped. You type 480 and
read it back as 8:00.

**GAM ad units: the directory is a convenience, not a gate.** "Sync GAM units" pulls
newly trafficked units into the console's directory (one directory, one sync — the CTA
lives once, on the setup editor). Searching offers at most 8 directory matches; the rung
lookup shows up to 6 existing tags plus 4 unseen units. A well-formed unit path that
isn't in the directory yet is *accepted* and wears a "not in GAM" mark — a unit
trafficked ten minutes ago is real whether or not our copy caught up — and the mark is
computed fresh on every read, so the next sync clears it by itself. The only hard check
on a hand-typed unit is its shape (`/7176/toi/mweb/videoshow/preroll`: network code,
then path segments), because a stale directory is normal and a malformed path never is.

**Everything refuses by name.** No silent drops: a removed field is refused with where
its answer lives now ("startVolume is gone — the volume is passiveVolume (Passive
volume)"); a limit names the number found next to the number allowed; anything in use
cannot be deleted, and the refusal names or counts its users. Every refusal is
machine-readable (`status`, `code`, `message`, field-level details), so the UI can put
the reason exactly where the mistake was made.

**The numbers.** At most: 5 placements per setup, 3 mid-roll pods, 10 rungs per ladder
(1 primary + 9 fallbacks), 5 tags in an out-stream rotation, 6 custom configs per
integration, 1 direct deal per break or pod. Names are unique case-insensitively per
object type. Autoplay is On/Off/Auto; Passive volume is 0–100 and is the player's only
volume on the default; a custom config may override it, or any other field, and is held
to the same rules. Pause below visibility is 0 or 10–100, and 1–9 is refused by name —
below 10% the player cannot tell. Heavy configurations warn with counted
arithmetic ("4 tries × 2.5s is a 10s wait before anything plays") but never block a save
— warnings are levers, refusals are walls, and the difference is deliberate.

**The mock world is deterministic.** Reset rebuilds the same integrations with the same
ids and the same seeded key strings, so counted history never shifts underneath a demo
or a test.

## Known rough edges (found in review, left as-is on purpose)

Small, documented honestly rather than patched quietly: clearing the "Hold video" or
"Request timeout" box reverts silently to the default instead of saying so; an
out-of-range value there is refused in raw milliseconds ("waitMs… got 50") despite the
seconds-only rule; the drive and bulk cue-point editors drop an unparsable token
client-side where the setup editor correctly lets the server refuse it by name; and the
Unpublish endpoint has no button in the UI yet — Delete is gated on it, so a live
integration currently cannot be taken down from the screen. Each is a one-line fix;
none changes scope.

## Where the code lives

`api/` is the model behind an Express server (port 4200): `store/` holds eight subject
modules behind a re-export façade, `mock/` holds every invented fixture. `web/` is a
no-build vanilla-JS app: plain scripts in dependency order, styles split across ten
cascade-ordered files. `test/run.js` pins 117 rules over real HTTP in about a second,
and the repo carries a 44-check browser UAT. The deeper design record — every decision
and the reasoning behind it — is `PRODUCT-LOG.md`; the store split's method is
`docs/STORE-SPLIT.md`.
