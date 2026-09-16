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

**Player behaviour** is the second card, and the whole default player is SET on it — every
setting, visible at once, with no switch, no counted door and no modal in the way. It carries no
label of its own: the card is named `Player behaviour` and the rule below these columns is named
`Custom configs`, so what stands above that rule is the default by position, and a `DEFAULT
CONFIG` eyebrow over it was a third name for a thing already named twice. Where a surface is
being made, one quiet line says the preset or copy it started from, and where it is not, there
is no line at all. Then three columns, one per section:
**Playback** (how the video plays), **Appearance & controls** (what the viewer sees and can
touch) and **Measurement** (what is reported). Each column is its name under a single rule,
then its settings on a 40px rhythm with every answer on one lane at the column's right edge —
no box around the three, no divider between them, no hairline between rows, because a grid of
lines is what made an earlier cut of this same arrangement read as clutter. Columns end where
their content ends, the way columns of type do. A setting whose control is wider than the lane
puts its label above and runs the column's width beneath it: the colour
and logo fields, the nine player controls, and the chip sets. Each column keeps the catalogue's own order, the handful a surface
is really set up with first, so Appearance & controls still reads as the sentence it is — how
many controls at all, then what the player looks like, then which controls exactly. Answers land
in the page's draft like every other card here — Save is the gate, the change bar marks what has
moved, and the block's head counts it (`3 changed`, every field named on hover). The same block
stands while the integration is being made, where a blank one names its `Start from` preset and
measures against it, and once it exists, where it measures against the last save.

**Custom configs** are cards under the block: the key, its switch (`OFF` in words when it is
not serving), then the first four overrides as label/value lines — `Autoplay Off`, `Playback
mode Passive` — because what tells one config from another is what it CHANGES. The rest are
counted on a fifth line with all of them named on hover; a config that overrides nothing says
`Follows the default in everything`. A card's ⋯ holds its rare acts, and the one that makes
another is the same card drawn as a dashed outline, standing where the thing it makes will
appear.

Clicking a card opens the config's **sheet**, the one modal left on this card — because a
custom config is a bounded act: named by key, created or dropped whole. The sheet is the model,
and it is **two panes**: the catalogue standing open down the left, the config's own answers
filling the right. A **search** heads the rail — it is the rail's only chrome, because twenty-four
settings across three groups is past the point where scanning beats typing, and a column of the
player's settings standing beside the values those settings hold needs no label saying so. A box against every setting, and above
each group a box against the section itself that ticks everything under it, half-filled while only
some of it is ticked — suspended while a search is running, because *all of Playback* over a
filtered view would take thirteen settings when one is on screen. No counts: every box is visible
and the pane beside it lists exactly what is ticked, so a number would be a third telling.

The catalogue used to sit behind a dropdown. That is the right shape when a list is a detour —
go in, pick, come back — and the wrong one when choosing IS the work: the two lists a person
moves between, what this config has taken over and what it could, were never on screen together,
so every comparison cost an open, a scan and a shut. **It is on the left** because it is the
source rather than an outcome — the version rail and the changes card earn the right-hand side by
being what happened and what will happen — and because the sheet reads as a sentence left to
right: *these settings* → *these values*. Each pane scrolls on its own, and both section heads
pin, so neither list ever says nothing about where you are in it.

Ticking takes a setting onto the sheet and unticking takes it off, exactly as the row's × does; a
section's box gives back everything it took. **Each row also carries a switch**, and the two
controls answer different questions: the switch asks *is this config's own answer applying?* — off,
the row keeps its place and its value, greys, and the config follows the default, which is the
cheap way to see what the default would do without retyping what you had — while the × asks *does
this config have an opinion here at all?* and takes the setting off the sheet. Both end as the same
absence when the sheet closes, because the model has one state for "follows the default".

The config's own acts sit at the top right of the sheet, where the config is open in front of you:
an **Active │ Inactive** segment beside the key — two labelled positions rather than a switch that
has to be hovered to learn what either end does, and next to the name because it is that name's
state; a vertical ⋮ holding *Delete config* is the last thing in the act row, just right of the
primary — a rare, irreversible act kept one step off the path without being exiled to
the opposite corner. (Dropping every override was in that menu
for a day and left: unticking the three section boxes in the rail is the same act in plain sight,
and a menu item duplicating what is already on screen only makes the one item that isn't harder to
find.) The cards on the page keep the switch alone — on or off is the one decision worth making at a glance,
and the only one a 238px tile can honestly support.

The sheet is a working copy, so Cancel puts all of it back — the ticks, the values, the parked
rows and the switch — which is what makes any of them safe to move.

**Every row is one row**, in the same grammar the integration page uses: the question on the left,
the answer on one lane, and on the right only the two things you can DO to the row — its switch and
its ×. What the default holds is not repeated there: the default's own values are the card behind
the sheet, and three different sentences about it in the place a row's controls live was three too
many. Rows are capped rather than stretched to the pane, so a switch never floats a hand's width
from the control it belongs to. The nine controls draw as the page's strip of glyphs
on their label's line rather than as a grid of labelled tiles — the same setting on the card behind
the sheet and inside it should not be two different things — and the only control that still takes
a line of its own is the three colours, which are half a form anywhere.

**A config with nothing set yet says what to do, not what it is** — and says it without the
model's own vocabulary. A mark, a heading and one line: *Nothing changed yet · Pick a setting on
the left to change it just for this config. Everything else stays the same as the default.* Two
earlier versions failed for opposite reasons. *Follows the default in everything* was true and
useless — a config with no overrides follows the default by definition, so it described the
emptiness rather than resolving it. *No settings overridden yet* resolved it in a word that names
a MECHANISM to somebody who only wants to know whether anything is different: `overridden` is how
the model stores this, not how a reader thinks about it. What stands now carries the whole of
sparse overrides — change one thing, everything else stays as it was — in words nobody has to be
taught.

**Up to twenty configs per integration**, and the block is built for it: eight cards show, the rest
sit behind a counted *Show all 20 configs*, and once there are five or more the head carries a
**key filter** — a config is asked for by key, so the key is what a person arrives knowing, and
typing it beats reading twenty tiles.

**A ticked setting arrives empty.** **Every one of them**, with no exceptions left (15 Sep). Four
controls have no drawable empty state — nine glyphs, speed chips, remember chips, a pair of
colours — and those four used to be stamped with the default's own answer and counted as answered
from that moment, which is the one thing this sheet had promised not to do. They now arrive on an
explicit empty slate: nothing lit, no colour set, the row receding until it is touched, and the
sheet refusing by name over anything still waiting when you try to apply. It is a question, not an
answer: the control stands with
nothing in it, and nothing else on the row says so, because an empty control is already the
state. A setting pre-filled with the value it is overriding is a decision that looks made before
anybody made it. Four kinds have no empty state
— the nine player controls, the colours, the speeds and the remembered set all have a resting
shape that IS an answer — so those are seeded from the default when picked and count as answered
at once. **Apply refuses over anything still unanswered**, naming it (`Passive volume and Loop
have no value yet — set them or take them off the sheet.`) and flagging the rows where they sit —
the one moment a waiting row says anything, because a refusal is news and a description is not;
the sheet stays open and nothing lands. On a sheet a Yes/No question is an explicit pair rather
than a switch, in both states, so no control changes shape at the moment it is answered.

Once answered, a row carries the default's answer at its right edge — `DEFAULT On` beside an
Autoplay set to Off, `same as default` when it has not been moved off it — and a × that takes the
setting back off the sheet. A new config is the same sheet with the key where the title goes and one line
under it — the rule that key must pass. An existing config's head is the key alone: counting how
many of the twenty-nine settings it owns only repeated the list below it. Emptying a config
in one act lives on its card's ⋯, not in the sheet: inside the sheet a row leaves the way it
arrived, one at a time. A row moved since the sheet opened wears the amber change bar, and the
act row states the position: `Close` when nothing moved, `Apply 3 changes` beside a `Cancel` when
something did.

**The three cards share one type scale** (15 Sep): labels at 12.5px in medium weight, values at
12.5px, every bordered control exactly 30px tall, segmented answers at 12px and chips at 11.5px.
Identity, player behaviour and ad behaviour had drifted to three different scales with a dozen
sizes between them; the page now sets five, in one place, and the custom config sheet reads from
the same set. A label is never the thing that gives: where a control cannot share a line with
its label — the preview fields, the nine player controls, Player type's three long answers — the
label takes the line above and the control runs the full width beneath it.

Timings read in seconds and travel in milliseconds; a zero that means "off" is drawn as a
switch. A value that cannot apply right now greys where it sits with its reason (Controls: None
takes the three settings under it with it). A refused value is said on the card it was set on.

**Appearance & controls reads as one sentence:** how many controls at all → what the player
looks like → which controls exactly. The nine player
controls are asked as what the viewer GETS, not as what is taken away, and in the sheet they are
a GRID of equal tiles three to a line — one glyph column, one label, one state — so nine controls read
as nine rows of a checklist rather than as nine pills wrapping raggedly across two. On is a filled tick and full ink, off an empty ring
and receded ink — and nothing counts them underneath, because nine glyphs lit or unlit are the
count. The store and the wire still carry the hidden list; the inversion happens at one seam. On the page the same control is a strip of the nine glyphs, lit when
the viewer gets that control and named on hover — the grid earns its labels in a modal, a column
has no room for them. Both this and the colour fields take the whole width of
whatever holds them: a control taller than its label is not a value in a column.

Brand colour and text colour **share a line** — they are one decision, a brand's pair — and the
logo takes the line under them, because a URL is a different kind of answer and a much longer
value. Each field is the same height as every other box on the page. A colour is ONE field: the swatch sits inside it at the left edge
and opens the operating system's own picker, and the hex beside it is typeable so a brand value
can be pasted rather than hunted for; the swatch follows the wheel live without the field being
redrawn under it. Two things stood here and were removed on review (15 Sep): a drawn preview of
the player — a frame for the video, the logo in its corner, a play button in the two colours and
a bar of the controls served — which was the biggest object on the card and a rehearsal of what
the publisher's own page shows for real; and the WCAG contrast ratio under it, which was the last
arithmetic on this card nobody had asked for, over a pair a brand team settles elsewhere.
A config sheet's title is its own rename field, held to the same three
rules the server holds a key to — one word, unique, never "default" — refused in place, and
Done will not close over a key the server would reject.

**A config's sheet is a transaction, and its act row is the journey.** It opens a WORKING COPY of
whatever it is editing, and every row moved since it opened wears the amber change bar. The act
row then states the position it is in: nothing moved and there is one way out, called **Close**,
because nothing is being kept; something moved and there are two, the one that lands naming
what it lands — **Apply 3 changes** — beside a **Cancel** that is now worth having. Escape and a
click on the veil ask first, and only when there is something to lose. A NEW config always has
the pair (`Create config`), because nothing exists until it is named and valid. It matters most
on the DEFAULT, where no row can ever be an "override": without this, a sheet that was in fact
writing every keystroke had nothing on screen to say so, and read as a sheet that could not be
written to at all. Save and Publish are still the only gates to the wire; this changes
neither.

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

Selecting integrations in the list opens three bulk acts. All three end the same way — a
**Changes to apply** card, then the whole list read on the change review before anything is
written — but the first two are FORMS and the third is an EDITOR, and that difference is the
point rather than an inconsistency.

**The review answers WHO as well as WHAT, in two columns.** `Apply to 12 integrations?` used to
print its answer as a byline you could not touch. The changes are the left column now and
**Integrations** is the right, divided by one rule — two siblings built the same way, a
micro-label on one baseline over a list, because this screen has no boxes in it.

The column holds the cohort and nothing else: a counted head, a search, and one name per line,
each a tick. The search heads the column so that its place and the direction its results open
never depend on how long the list is. **Rows never
leave it** — take a surface out and it stays where it was with an empty box, faint, counted
(`· 2 of 3`), one click from being back in; `All` beside the count puts every one of them back
while there is one to put back. To add a surface that was never ticked on the list you search for
it in the field under the names — type, pick, and it joins the list directly above the field,
which clears itself for the next one — and the new name is scrolled to, however far down the
list it lands. An empty field offers nothing; the results lead with what can be added and carry
what is already in the change greyed beneath, saying so.

Everything counted re-counts as the audience moves — the title, the change list, the spreads
inside it (`3 different values`), the caveats beside them (`2 carry no special deals`), the
button's own label — and a change that moves nothing for the cohort you leave with drops off the
list. The last integration cannot be taken out; an act with nobody in it is refused where it is
clicked. The list's own selection is untouched: this is the ACT's audience, and Back carries it
to step 1, where the sheet re-counts against it.

On the two forms the card lists the field and the ANSWER, not a transition — and so does the
review behind it: a cohort has no single prior value to be changed *from*, so a row reading
"3 different values → Muted", or "on → on", described a move nobody is in a position to make.
Both screens read FIELD · ANSWER, and because the arrow is gone the two halves are told apart
by treatment rather than by position — the field light and grey, the answer dark and heavy.
What the cohort holds today stays where it is genuinely the context for a decision: beside the
lever on the ad sheet, while you are choosing. (A save, a publish or a version still reads
`was → now` — there the was-side is one surface's real, counted value.)

**Every cohort act says who it lands on at the button's shoulder** — `Applies to all 12
selected`, five words, counted off the act's own audience. The title says it too, but a title is
read on the way in, and the moment that matters is the one before the last button, when a write
over forty surfaces stops being an idea.

The two forms pick a lever and answer it once for everyone. What differs between them is only
how a lever is reached, and that follows from how many there are.

Both sheets are titled for the act they are, in the bulk bar's own two words — **Ad behaviour**
and **Player behaviour** — and both state the whole act once, at the button's shoulder: *Changes
will be applied to the player behaviour of all 3 integrations*, with the count in the page's own
weight. Neither title carries the count or the names; the review's own column lists every one of
them a screen on. On the player sheet the one control that decides what is on the sheet rides
that title row, so both sheets open on a name, a rule, and a way in.

**Both sheets share one row grammar**, and it is three states deep: a field starts CLOSED (its
name, with `Set` arriving under the cursor), opens with its control UNSET, and queues once a
value is actually picked. What differs between them is only how a field reaches the sheet, and
that follows from how many there are.

**Ad behaviour** prints its levers, because a break has about six: each starts closed showing
the cohort's counted today-word ("full waterfall", "3 different values").

**Player behaviour** folds its levers into one checklist, because a cohort may answer
twenty-five of them — a printed list that long is a form for a whole estate rather than a
decision. It is the same control the custom config sheet uses to choose what it overrides:
a box per setting, a box
per section that takes everything under it, and a menu that stays open while you work. It
offers the settings the server itself accepts, grouped as the player card groups them, with
the four a single surface owns greyed in place carrying the reason they are refused. The sheet says what it writes on the line beside its title — that these set
the **default player** on every selected integration. A picked setting arrives with nothing chosen and
answering it is mandatory: Apply refuses by name over anything still waiting — and opens every
row it names, because a row the sheet is complaining about cannot be one whose control is folded
out of sight. An answer every selected integration already holds says so where it stands and
never reaches the review.

On both forms an unanswered field looks the same, and says nothing: the empty control IS the
state, so no caption describes it — the same rule the custom config sheet follows. A field
only earns words when it has news — the flag a refusal puts on it, or "already this
everywhere".

**An empty sheet shows the sheet, not a sentence.** Player behaviour and the custom config
sheet both open on a body with nothing in it, and what stands there is the map: the sections a
pick can land in, in the order they will appear, each with how many settings it holds, greyed
until something arrives. The first pick lands under a heading that was already on screen and
does not move — the heading simply goes live. While the body is empty the one control that
fills it wears the act (accent, a leading `+`); it recedes to an ordinary field the moment
there is a row.

**Custom configs is no longer a cohort act.** It stood as a third button on the bar and came off
it — a config is keyed and per-surface (a surface carries none, or six), so unlike the other two
it was never one answer every integration has exactly one of. It is edited where the surface is,
on the integration's own page. What follows describes the sheet as it was built, kept because the
code is still there and the reasoning still holds if it is ever given a door again: it is a list
rather than a form — because a custom config
is not something every integration has one of. A surface carries none, or up to twenty, each
addressed by the key a player asks for it by, so "one answer for forty" is usually the wrong
instrument. The sheet gathers them instead: a block per selected integration, its configs one
under another, and each config's settings open as the content — the same rows the integration's
own page draws, with the same controls, the same `default` answer beside each override and the
same × back to following it. So the sheet replaces twelve visits rather than imitating them.
Which settings a config overrides is stated in its header as a count — `Overrides 3 settings` —
and that count is the control: opening it gives the checklist that changes which. Each
integration header wears the property monogram the list itself uses, and pins while you scroll,
so a row always says whose config it is.

**Nothing on this screen is read-only.** Every value shown is a control that can be moved. An
earlier cut printed each config's fields a second time in grey beside its key, and put a
blanket *Change a setting on…* filler above the list, and a `+ Override a setting` link under
every config; all three were cut the day they were built, because a list of forty configs cannot
afford a value printed twice, a second way to do the same thing, or a verb repeated forty times. A decision is queued once and counted —
the same answer on seven configs reads with its from-side counted (`4 different values → On`),
never blended.

What this sheet will not do: it never creates a config and never removes one — both are keyed,
named acts with a six-per-integration ceiling, and they belong on the one surface being changed
— and the four settings a single surface owns (Plays as · Redirect URL · Quality · Fallback
media) are absent from it entirely, at both scopes. A selection where nobody carries a config
greys the act on the bar with that reason rather than opening an empty sheet.

**Step 2 is the same object as step 1.** Each cohort act names one height, and its sheet and its
review both take it — same width, same title, same head inset, same foot bar on the same bottom
edge. Nothing about the frame moves when you cross from the work to the confirmation, because a
dialog that resizes under a decision reads as a different dialog.

Bulk writes are per-integration: a surface the change cannot apply to is skipped and named,
never silently included.

![The bulk ad-behaviour sheet](img/bulk-ad-sheet.png)

## Creating things

New integrations and new setups start from one chooser: blank, or a photocopy of an
existing one. An integration copy carries the player, its named configs, the switches and
quick decisions, and the setup mapping — a setup someone else holds becomes the copy's
own at the moment of Create, so cancelling leaves nothing behind. A setup copy brings
everything, ad units included. A new integration's default player is read right on the
page (the Player behaviour card's block of facts; a fact opens the sheet at that setting); a
blank one starts from a preset (MiniTV · ArticleShow · VideoShow) picked as `Start from` in
that card's head, every setting moved off the seed wears the change bar and the block counts
them, re-picking the preset asks first when it would discard those changes, and the create
review states the preset once and lists only the settings that moved. Creation always lands in the real editor, and
the one write is reviewed field by field on the same change-review screen every write ends
on.

![The new-integration chooser](img/new-integration-chooser.png)

## Going on air — the publish plane

**Save never changes what viewers see.** Save writes a draft; Publish stamps an
immutable, numbered version and swaps what the player's API serves. History is
append-only — restoring an old version publishes it again as a new one, so every restore
is itself undoable, and the restore dialog names any unpublished draft work it would
overwrite before it does. Taking a surface down is Unpublish, a deliberate act, never a
hidden status field.

**Where a surface stands is three answers, and the gap is a fourth.** A status cell reads
`● v3` (on air, the version counted), `Off air` (published once, taken down) or `Unpublished`
(never published — the player is served nothing). Saved work that has not gone out rides
underneath as its own amber line, **`Changes not on air`** — it is a different fact from the
state word above it, and until 15 Sep it wore the same word, so a live v1 with one saved change
said the same thing as a surface serving nothing. Every cohort act lands there: a bulk write
SAVES on each integration it reaches, and the review says so before you confirm it (`Saved on
each integration · on air when it is published`), because going on air is each integration's
own deliberate act from its own page.

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
(1 primary + 9 fallbacks), 5 tags in an out-stream rotation, 20 custom configs per
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
client-side where the setup editor correctly lets the server refuse it by name. Each is a
one-line fix; none changes scope. (The one that used to head this list — an Unpublish
endpoint no button reached — closed on 7 Sep: `Deactivate` sits on the ⋯ of both editors,
and Delete is gated on it.)

## Where the code lives

`api/` is the model behind an Express server (port 4200): `store/` holds eight subject
modules behind a re-export façade, `mock/` holds every invented fixture. `web/` is a
no-build vanilla-JS app: plain scripts in dependency order, styles split across ten
cascade-ordered files. `test/run.js` pins 183 rules over real HTTP in about a second,
and the repo carries a 44-check browser UAT. The deeper design record — every decision
and the reasoning behind it — is `PRODUCT-LOG.md`; the structural pass over `api/` is
`docs/REFACTOR-DECISIONS.md`. The same product read as journeys is
`docs/PRODUCT-FLOW.md`.
