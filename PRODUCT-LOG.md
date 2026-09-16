# Player Console — the Integrations Panel (StreamAds repo) — v1

**TWO ALIGNMENTS (16 Sep, user calls).**

- ***"The choose settings drop down to align with changes to apply block."*** The player sheet's
  face was 300 wide against the queue card's 252, so it began 46px to the card's left and overhung
  it by two — near enough to look like an attempt at alignment and far enough to read as a miss.
  The card's width is a NAMED COLUMN now (`--bqp-w` on `.dlg.bulk`) that both read, and the head
  pays the same 2px right inset the scrolling body below it already pays, so the two right edges
  are one edge rather than two numbers kept in step by hand. One trap on the way: the shared
  picker carries its own `min-width: 300px`, and a floor beats a basis — without `min-width: 0`
  only the right edge moved. Measured after: face and card both 872 → 1124.
- ***"Rather than the enable disable switch on the top right, place an Active/Inactive tab switch
  near the title."*** A bare toggle says nothing about what either end MEANS — it has to be
  hovered to learn that off sends players to the default — and parked in the opposite corner from
  the name it belongs to it read as a property of the dialog rather than of this config. It is the
  house segment now (`accSeg`), **Active │ Inactive**, sitting next to the key: two labelled
  positions that explain themselves, which is also why they need no tooltip. `.sh-t` stopped
  taking the slack so the pair follows the field, and the key's box came down from 320 to a
  MEASURED 272 — 24 characters of 17px mono need 254 of content box, and the cap the server
  enforces is 24. (One trap: `accSeg`'s sixth argument is a REASON AN OPTION IS REFUSED, not a
  tooltip — anything it returns disables the button, which is exactly what happened for a minute.)
- **183 passed**, `npm run check` ok, and all three step-1/step-2 journeys re-measured at 0 on
  every axis after the head change.

**STEP 1 AND STEP 2 ARE ONE OBJECT AGAIN (16 Sep, user call — *"the modal in step 1 and step 2 the
UI is disjointed, the header and the footer jerk when switching"*).** Measured all three cohort
journeys across the step change before touching anything. Every one of them moved, for three
different reasons.

| | frame | title | head top | foot bottom |
|---|---|---|---|---|
| Ad behaviour | 480 → 480 | 18 → 17 | 22 → 19 | −22 → 0 |
| Player behaviour | 480 → 480 | 18 → 17 | 28 → 19 | −22 → 0 |
| Custom configs | **620 → 480** | 18 → 17 | 22 → 19 | −22 → 0 |

- **The frame.** Custom configs borrowed `steady: 'player'` when it was given its own 620, so step
  2 came back at the player sheet's 480: the dialog shrank 140px, its top fell 70 and the footer
  jumped 79. It names its own frame now (`steady-configs`, 620) — and takes a FIXED height rather
  than the floor its siblings use, because a step 1 that is fixed and a step 2 free to grow is the
  same jerk measured from the other end.
- **The chrome.** The two screens were built on different padding models: the sheets let `.dlg`
  pay `22px 24px`; the review opted out so each of its parts could pay its own — and then paid 19
  at the head and ran its foot flush to the bottom edge with a rule the sheets did not have. So
  the head slid 3px and the foot rose 22 and grew a line. The review's head comes to the family's
  22, and the sheets' foot becomes the review's foot: a bar on the frame's bottom edge, full-bleed
  top rule, `13px 24px 17px`.
- **The title.** 18/650/-.1 on the sheets, 17/650/-.3 on the review — it changed size mid-act. The
  review's wins; it is what five other screens already use.
- **One sheet had its own 6px.** The player sheet's head is a BAND (title + the settings picker on
  one line) and centring both put the title 6px low: 2 from the band's top margin, 4 from being
  centred against a 30px control in a 22px row. The title is top-aligned now and the CONTROL is
  centred on its line — which is what optical alignment between a heading and a field beside it
  actually means.

**All three journeys now measure 0 on every axis** — width, height, dialog top, head top, head
left, foot top, foot bottom. **183 passed**; the standalone review (Save / Publish / Restore /
Delete) keeps its own width and content height and was re-checked.

**Not changed, and worth knowing:** the custom configs review has no audience column where the ad
and player reviews do — that act's audience is (integration, config) pairs rather than a flat
cohort, so un-ticking a surface there is a real design question, not a copy of the other two.

**THE SCOPE, READ AS JOURNEYS (16 Sep).** *"Can you update the product flow md file as well so
that it captures the product scope?"*

- **`docs/PRODUCT-FLOW.md` — the same product, along the other axis.** PRODUCT-SCOPE.md is
  organised by SURFACE: what each screen is, and why it is shaped the way it is. It answers
  every question except the one a new reader asks first — *what happens, and in what order?*
  The flow document walks the nine journeys the console exists to carry (getting in · a new
  surface · the demand behind it · the drive · custom configs · a cohort write · going on air
  and coming back off · what the player reads · housekeeping), each as numbered steps with
  what the person does, what the console does back, and **where it refuses** — the refusals
  are part of the flow here, not an appendix, because in this product they are what the
  screens are for. It ends on the caps, what is deliberately out of v1, and a flow → screen →
  code → cases table, so a reader can leave it for the code at the right line. No new scope:
  where the two documents disagree, the scope document is the one to fix.
- **Three things the scope document had gone stale on, found while writing it.** The custom
  config ceiling in *The numbers* still read `6` where the code (and the configs block, two
  pages above it) says twenty. The rough-edges list still opened on *the Unpublish endpoint
  has no button in the UI yet* — closed on 7 Sep, when `Deactivate` went onto the ⋯ of both
  editors; it now says so, dated, rather than disappearing. And the counted suite was written
  as 117 rules against a suite that is 183. A scope document that miscounts is worse than one
  that does not count, so the numbers are read off the code and the run from now on.

**THE PLAYER SHEET'S HEADER BAND, AND WHAT THE FOOT SAYS (16 Sep, four user calls).**
*"The Change settings should be Choose settings"* · *"can that be cleanly placed alongside the
header near the title Player behaviour"* · *"Applies to all 2 integrations should be Changes will
be applied to the player/ad behaviour of all 2 integrations — in both"* · *"Saved on each
integration · on air when it is published — remove this from step 2"*.

- **The picker rides the title row, and loses its label there.** Renaming `Change settings` to
  `Choose settings` would have put the same two words on screen a hand's width apart — the strip's
  label beside a face already reading `Choose settings…`. Up beside the heading the control has
  the title row for context and needs no label at all: the FACE says it, once. (`.pb-add-l`
  retired — the same subtraction the config sheet's rail made when `Overrides` came off it.) The
  two cohort sheets now open the same way: a name, a rule, and the one control that decides what
  is on the sheet. The 15 Sep reason for bringing the picker DOWN is unharmed — it was hoisted
  above the BODY then, floating over both columns with the queue card's head 110px lower; in the
  title row it IS the header, the columns start level, and the menu still escapes because the
  body is not the scroller.
- **The foot says what is being written, not just who to.** `Changes will be applied to the
  player behaviour of all 3 integrations` — each sheet passes its own subject, so the line
  standing beside the button is the whole act in one place. `Applies to all 3 integrations` left
  the other half of the sentence to a title at the far end of the dialog.
- **Step 2 gives back its consequence line.** `Saved on each integration · on air when it is
  published` was there for one day to answer *"why are they in unpublished state"* — and what
  actually answered that was the WORD: the status line reads `Changes not on air` now instead of
  borrowing `Unpublished` from a different state, and the receipt says `not on air yet`. With
  those two true, a sentence on the review was the third telling, on the one screen whose whole
  job is the list.

**THE AUDIENCE COLUMN: THE COUNT IS ALWAYS ON, AND THE SEARCH HEADS IT (16 Sep, two more).**
*"In step 2, in the RHS where we show the integrations and search, always show the count of
integrations selected"* · *"what if we had 20 integrations already selected — how will the search
bar be placed and its results be shown when typing? Think of this edge case as well."*

- **`INTEGRATIONS · 3`, always.** The count came off for a day because with every row ticked it
  repeats the figure in the title; the call is that a column of names should say how many it is
  holding without anybody counting them, and that is right — the title is a question about the
  ACT, this is the list's own report, and a list that reports only sometimes is one you have to
  check. It still says `2 of 3` the moment one is out. `All` is the part that stays conditional:
  it is a way back, and it is there for as long as there is something to come back from.
- **The edge case was real, and it had two halves.** Under the names, the field rode down the
  column as the cohort grew: at twenty it was pinned against the dialog's floor with its results
  forced to open UPWARD over the very list they add to — a control whose position AND whose
  direction both depended on how many surfaces you had picked. It heads the column now. Measured
  at twenty: the field sits at a fixed y whatever the count, the menu opens downward and lands
  99px INSIDE the dialog's floor rather than over the names, ten hits with the addable ones
  leading, the list scrolls under it, and a picked name still lands at the end and is scrolled
  into view — `20` → `21` in the head as it goes. The flip logic is deleted, not configured.

Verified: `npm test` 183 passed · `npm run check` syntax ok · the snapshot walk 86 screens, no
console errors · headless drives at 3 and at 20 selected, and the whole journey through to a
write.

**THE CONFIG SHEET, FIFTH CUT — an empty state, a flush search, and the ⋮ where a hand expects it
(16 Sep, three user calls).**

- **`Follows the default in everything` is gone**, and what replaced it is an EMPTY STATE rather
  than a fact: a mark (two sliders — settings is what the left column holds), a heading and one
  line. The old line was true and useless; a config with no overrides follows the default BY
  DEFINITION, so it described the emptiness instead of resolving it.
  **Then the replacement was rewritten too** (16 Sep — *"`No settings overridden yet` change this
  it is not understood by layman user who are non technical"*). `Overridden` names a MECHANISM — a
  sparse value laid over a default — to somebody who only wants to know whether anything is
  different yet. It reads **Nothing changed yet · Pick a setting on the left to change it just for
  this config. Everything else stays the same as the default.** That is the whole of sparse
  overrides, in words nobody has to be taught, and the measure is set so the two sentences break
  over two lines rather than three with one word stranded.
- **The search spans the rail and lines up with the list under it.** It was a filled pill whose own
  10px inset started its glyph 4px right of the section boxes and whose right edge stopped 4px
  short of the rows' — a box visible on all four sides sitting in a column of transparent rows and
  agreeing with none of them. Its inset is the list's own now (6px), and the list gave up the
  gutter it kept on the right: field and rows start and end on the same two lines (measured: icon
  321 / box 320, both right edges 519).
- **The ⋮ moved right of the primary and turned vertical.** The foot's hard left is where a
  dialog's rare act often goes, but a lone glyph in the opposite corner from every other control
  reads as orphaned. It is the last thing in the act row now, and VERTICAL — a horizontal ellipsis
  beside a row of horizontal buttons is one more dash in a line of them, where the vertical reads
  as a handle. The menu opens upward, hanging from its right edge.
- **183 passed.** Delete re-checked end to end from the new position; the empty state checked on
  both a new config and an existing one with nothing overridden.

**THE TWO COHORT SHEETS BECOME ONE PRODUCT (15 Sep, three user calls in a row).**
*"Sets the default player on all 3 selected integrations — remove this"* · *"Applies to all 3
selected — make this more prominent and more clear, currently it is not clear"* (*"same goes for
ad behaviour as well"*) · *"Ad behaviour has a Set CTA but Player behaviour has no such Set CTA;
these two should be uniform for a mature platform"*.

- **The audience sentence leaves the title.** It had walked the whole player sheet — a block
  under the heading, then a kicker beside it — and it was wrong in both seats for the same
  reason: it qualifies the BUTTON, and it was sitting at the far end of the dialog from it, read
  once on the way in and never again while the audience moved underneath it. `pb-says` is retired.
- **It is stated once, at the button's shoulder, and it is not a footnote.** `Applies to all
  3 integrations`, in body ink at body size with the COUNT in the page's own weight — the number
  is the fact, the rest is the sentence around it. `all N integrations`, not `all N selected`:
  `selected` names where they came from, which is not the question standing at the button.
  Counted off the journey's own audience, so it can never say a number the apply will not write
  to — including after the review's second step has moved it.
- **Both titles are the door you came through.** The ad sheet read `Edit 3 integrations` over a
  byline of two names and `+1 more`: a count the foot now states beside the act, and a name list
  the 15 Sep call had already taken off the sibling sheet. They are `Ad behaviour` and
  `Player behaviour` now — the bulk bar's own two words.
- **ONE ROW GRAMMAR, ALL THE WAY DOWN.** The last thing that was not the same on these two sheets
  was the way INTO a row: a break's lever sat closed with `Set` under the cursor, a player's
  setting arrived with its control already open. One screen asked to be opened and the other did
  not, which is two products. A picked setting now lands closed exactly as a lever does — its
  name, and the door on hover — so both read closed → open/unanswered → queued. It costs one
  click and buys the thing the picker could not: the list of what you are about to change,
  readable as a list before you start answering any of it. (`PB.open` is the ad sheet's `d.open`
  under another name.)
- **A refusal opens what it names.** Naming `Passive volume and Starts muted have no value yet`
  and then leaving both controls behind a `Set` is a refusal you cannot act on where you are
  standing, so `pbApply` unfolds every row it flags.
- **The walk learnt the new grammar** — one extra click in the player leg, 86 screens.

Verified: `npm test` 183 passed · `npm run check` syntax ok · the snapshot walk 86 screens, no
console errors · driven headless (both titles, both feet reading `Applies to all 3 integrations`
· three picked settings landing closed · `Set` on hover · one opened and answered · Apply refusing
over the other two AND opening them · the whole journey through to a write that lands on the
surface added at step 2).

**NOTHING IS SEEDED, AND THE CEILING IS TWENTY (15 Sep, two user calls).**

**1. *"The fields selected in custom config should not carry any default value; it should be set if
selected and a validation should be there."*** Four kinds were the standing exception — the nine
glyphs, the speed chips, the remember chips and the colours — because none has a drawable empty
state: an unlit strip is not *nothing chosen*, it is *hide everything*. So they were stamped with
the default's own answer and counted as answered from that moment, which is precisely what this
sheet had promised not to do: a setting somebody chose to OVERRIDE sitting there already agreeing
with the thing it overrides, and landing whether or not anyone touched it.

The ambiguity is real and is not solved by pretending — it is solved by the **refusal**. Every pick
now lands in `SH.pending` whatever its kind; `shRowEff` hands the row an explicit EMPTY SLATE
(nothing lit, no colour — for `hiddenControls`, whose list is what is HIDDEN, that means every
glyph in it); `shCur` hands the first click that same slate, so what the screen shows and what the
click computes from cannot disagree; `.sh-row.unset` recedes until touched; and `shDone` names
everything still waiting. Three things had to be fixed under it: `cfgCtlHtml`'s unset branch was
dropping those four into its `default:` text box (four rich controls drawn as four empty inputs),
`shPut` was clearing `SH.pending` by FIELD so the two composite rows could never be answered, and
the guard that kept the four out of the unset path went with `shNeedsSeed`. **The cohort sheets
keep their own seeding** — they seed from what a SELECTION agrees on, a different question with a
different honest answer.

**2. *"There should be no upper limit … it can be say 20; just see how to accommodate."*** The
ceiling is **20**. Raising it is one number on the server; what it costs is the BLOCK. Six cards is
a shelf, twenty is a wall — five rows, ~900px of page, each tile carrying four override lines
nobody reads while hunting for `shorts`. So the block grew two things a shelf never needed: a
**counted door** (`PCC_SHOW` = 8 show, the rest behind `Show all 20 configs` — the carried-block
grammar the Integrations list already uses) and a **key filter** once five or more exist, because a
config is asked for BY KEY and that is what a person arrives knowing. The filter opens the door
while it filters, since a search that only searched the first eight would be a search that lies.
The cap case in `10-player-configs.spec.js` now pins 20 accepted / 21 refused.

**183 passed**, `npm run check` ok. Cohort config sheet, cohort player sheet and the page's own
default block all re-checked against the changed `cfgCtlHtml`.

**ONE WORD CANNOT MEAN TWO THINGS IN ONE COLUMN (15 Sep, user call).** *"When we apply, why are
they in unpublished state? It is not the correct communication — please see the UX."*

They were not in an unpublished state. They were on air at v1 with a saved change waiting — but
the line that said so read `Unpublished`, which is also the STATE word three rows down the same
column for a surface that was never published at all. So a cohort write looked like it had
knocked three integrations off the air, and the one act on this bar that does the most damage if
misread was the one saying it most confusingly.

- **The gap has its own words now.** `Changes not on air`, in the vocabulary the column already
  speaks (`On air · v3` / `Off air` / `Unpublished`), everywhere it is drawn: the list cell
  (`statusCellHtml`), the setup map card (`scStatusHtml`), and the editor's header chip
  (`N changes not on air`). `Unpublished` is left to mean exactly one thing — never published,
  the player is served nothing.
- **And it is said BEFORE the button, not after it.** Somebody who has just confirmed `Apply to
  12 integrations?` has every reason to think it is live; a screen that only reveals otherwise in
  a status column two clicks later has already misled them. The review's caption carries it while
  the act is still a question: `Saved on each integration · on air when it is published`. It is
  one step less faint than the slot's other users, because it is the only line on the screen that
  corrects a wrong expectation rather than describing the evidence.
- **The receipt says the half the rows cannot.** `2 changed · not on air yet` — the selection
  clears on refresh, so the toast is the last thing that can name what just happened, and what
  did not.
- **What did NOT change: publishing stays each integration's own act**, from its own page (the
  2 Sep call that took cohort publish off this bar). This is a communication fix, not a new act —
  if the answer should instead be a cohort publish, that is a different decision and a bigger one.

**THE RIGHT-HAND COLUMN, POLISHED (same call — *"the RHS still needs polishing, the spacing text
and all"*).**

- **The count says nothing until it says something.** `INTEGRATIONS · 3` was printing the figure
  already standing in the title forty pixels above it (`Apply to 3 integrations?`). The label
  stands alone now; `2 of 3` appears the moment one is out, which is a fact the title does not
  carry — and `All` keeps it company, for exactly as long as it would do something.
- **A count is a number, not a heading.** It sheds the label's caps and tracking and sits in
  tabular figures, so it reads `2 of 3` rather than shouting `2 OF 3`.
- **Rhythm.** Rows 6→7px with a stated line-height, the gap after the label 7→8, the list's own
  4px top pad, the field 6/10→7/11 at the rows' own 12.5px with an 8px radius — and the field's
  placeholder lost half its length (`Search to add an integration…` → `Add an integration…`),
  because the field sits under a list of integrations and had been saying so twice.

Verified: `npm test` 183 passed · `npm run check` syntax ok · the snapshot walk 85 screens, no
console errors · driven end to end (the caption reads before the act, the toast after it, and
the two changed rows read `● v1` over `Changes not on air` while the one that was never published
still reads `Unpublished` — three states, three words).

**THE BRAND PAIR SHARES ITS LINE EVENLY (15 Sep, user call — *"brand and text can be uniformly
placed currently both are together in the left side leaving the right side empty"*).** The two
colour fields sized to their own content (`flex: 0 1 auto`, an 86px hex box each), so they huddled
at the left of a 540px row while the logo under them ran the full width — three fields, two
different measures, a block that looked half-filled. They take an equal share now (`flex: 1 1 0`,
the field and its hex growing with it), which puts their right edge on the logo's and makes the
three read as one block. The page's 320px column keeps the same rule with a smaller floor under
the hex (52px rather than 62), or the split would wrap instead of splitting. Checked on all four
surfaces that draw `.cfg-look` — the page column, the config modal, the cohort config sheet and
the cohort player sheet — the pair holds one line on every one. **183 passed.**

**FOUR SUBTRACTIONS AND ONE SENTENCE — the cohort acts, and the label that named a thing twice
(15 Sep).**

- **`Default config` off the player card** (*"remove this Default config text in integration edit
  page under player behaviour"*). The card is titled `Player behaviour`; the rule under the three
  columns is titled `Custom configs`. What stands above that rule is the default BY POSITION, and
  the eyebrow was a third name for a thing already named twice — the same argument that took the
  `Used unless a config overrides it` byline off it earlier the same day. The head keeps only what
  cannot be deduced (the seed a surface is being made from, and what has moved off it) and now
  carries no height at all when it has neither: `.pcd-head.bare`, toggled on paint and again by
  `pgMark` while somebody types, because the count is written into that head in place and the
  element has to stay put for it.
- **`Custom configs` off the bulk bar** (*"in bulk edit integrations remove the custom config
  CTA"*). It never had the shape of the two beside it: Ad behaviour and Player behaviour each
  write one answer every integration has exactly one of, where a config is keyed and per-surface —
  none, or six — so the act belongs on the page that owns it. The bar's third state went with the
  button (the imperative greying + its reason, which existed only because that act could have
  nothing to work on). `views-keys-bulk-configs.js` is now loaded and unreachable: it is named as
  dead in ARCHITECTURE.md rather than left as a room with no door.
- **No was-side on a cohort review** (*"in the step 2 of both change player behaviour and ad
  behaviour dont show the values that were previous since we dont have any previous value show the
  field and the value"*). Forty surfaces do not share one prior answer, so the left-hand column was
  either a spread of other surfaces' values or a dash — a non-answer standing exactly where the
  diff grammar promises a fact. `reviewChanges` grew `noFrom`: the row becomes FIELD · ANSWER on
  two lanes, and the two are told apart by TREATMENT rather than position — the field 400 weight
  in `--ink-faint`, the answer 650 in `--ink` — because with the arrow gone a reader needs some
  other signal for which half is the question. Every other caller (save, publish, a version) keeps
  the three-part spine: there the was-side is one surface's real, counted value. The value clips
  at 46 rather than 30, since it inherits the column the arrow used to sit in.
- **The same treatment on the step-1 card** (*"the same is true for rhs in step 1 changes to
  apply"*). CHANGES TO APPLY already listed field over answer with no from-side; both lines were
  set at the same size, weight and colour, so four queued changes read as eight equal lines. The
  field steps back (11.5px/500/faint), the answer is the figure (12.5px/650/ink).
- **`Applies to all 2 selected` at the button's shoulder** (*"there should be a text max of 4-5
  words conveying that this will change across all the integrations selected... near the button at
  the bottom"*). One `bulkAppliesNote()` shared by both sheets, counted off the journey's own
  audience, so it can never name a number the apply will not write to. The player sheet's foot
  count gave up its `· 12 integrations` half to it — the audience is said once, and it is said
  last, against the buttons.
- **Two dead functions retired.** `pbTodayWord` and `pbRowTodayWord` counted what a cohort holds
  for a field; both existed to fill a from-side, first on the sheet's row (dropped earlier today)
  and then in the review. Nothing reads a cohort's prior value any more, so nothing computes one.
  `pbWordOf` stays — it answers for ONE surface, which is a different question. The walk's four
  `.shpick-face` clicks went too: the config sheet's picker has been inline since the rail cut, so
  those clicks had been missing on every run, and a walk that reports four false problems is a
  walk whose problems nobody reads.
- **183 passed**, `npm run check` ok, 85 screens captured with no console errors and identical
  across two runs.


**THE CONFIG SHEET, FOURTH CUT — the rail made whole, and the row reduced to its acts (15 Sep).**

- **The rail looked broken, and one thing made it so** (*"this looks broken and not mature"*): the
  section's checkbox was **13px** and the options' **15px**, so a parent read SMALLER than its
  children — the hierarchy upside down. Both are 14px now; the nesting is said by indent and type,
  which is what says it everywhere else in this product. With it: the search stopped being an
  outlined ghost (a hairline in `--line` over an almost-white fill, sitting directly above the most
  saturated mark in the column) and became a **filled well with no border at rest**, the border
  arriving on focus where it means something; and the section name took its weight back — at 10px
  faint it lost to a solid accent square beside it.
- **`Appearance & controls` stopped wrapping**, which had left its box floating between two lines.
  Tracking gave back the 12px it needed, and the head now aligns to its first line so a longer name
  added later breaks gracefully instead of detaching its box.
- **The row tail lost its default words** (*"dont show the default value on the right side near the
  switch"*): `DEFAULT x`, `same as default` and `following the default` — three different sentences
  about the default, in the one place a row's own controls live, all of them said better elsewhere
  (the default's values ARE the card behind the sheet; a parked row is legible from its greyed
  control and its off switch). What is left is what a tail is for.
- **The row's slack, put where it costs nothing** (*"why is space left in right side in the
  modal?"* → *"it is making the UI broken and immature"*). With the tail down to two small controls
  the slack had to go somewhere, and two arrangements were tried and reverted before the right one:
  **capping** the row at 500 closed the gap inside it by leaving 82px of dead pane beside every
  row, with the band ending in one place and the rows in another — which is what prompted the
  question; letting the **label take the slack** (`1fr` first, answer packed right) opened a 370px
  canyon between `Autoplay` and its own control, which is worse, because a label and its answer are
  the pair that has to read together. Settled: the label keeps a fixed 170px lane, the control sits
  right after it, and the row's two ACTS keep the right edge — where a settings row has put its
  switch since the first phone. The row reaches the pane's edge, so the band above it agrees.
- **And the tail holds one width** whether or not the switch is in it. A row ticked and not yet
  answered has nothing to park, so it draws no switch — and without its slot the control ran 44px
  further right than every answered row's. The slot is held by the control itself, hidden
  (`.toggle.void`), rather than by a `min-width` kept true by hand against three numbers.
- **The ⋯ moved to the foot** (*"near the button where it is ideally placed across platforms"*),
  hard left and opening upward, with a real 32×30 target instead of a bare ellipsis. **The header
  centres** (*"the title and all are not properly aligned"*): `flex-start` was right while the title
  carried a second line; with that line retired it left the switch pinned above its own baseline.
- **183 passed**, `npm run check` ok. Search, park, Cancel and the cohort sheet all re-checked.

**THE CONFIG SHEET, THIRD CUT — three small subtractions (15 Sep).**

- **`Overrides` off the rail** (*"remove this text from the lhs"*). It was the last label on a
  column that had stopped needing one: a search field over a checklist of the player's settings,
  standing beside the values those settings hold, is not a thing anyone has to be told the name of.
  The search is the rail's head now, and it lines up with the pane's first band across the rule.
- **`Follow the default for everything` off the ⋯** (*"remove it from 3 dot"*). Written when the
  catalogue was a dropdown and dropping every override meant hunting each row's × behind a face.
  The rail makes it three clicks in plain sight — one section box each — and a menu item that
  duplicates what is on screen only makes the one item that ISN'T (Delete) harder to find.
  `pcFollowAll` retired with it.
- **Every row is one row, and it is the PAGE's row** (*"the controls and all the UI should be
  similar like in a single row the way it is being done on the integration edit page"*). The nine
  controls were the sheet's one exception — a grid of labelled tiles under a stacked question,
  because a modal has width for labels. But the page draws them as a strip on their label's line,
  and a setting that is one row on the card behind the sheet and half a form inside it is the same
  setting drawn as two different things. `SH_STACK` is `['look']` now: the strip takes the page's
  24px cut, and only the three colours still stack, because they are half a form anywhere.
  Measured, not guessed — strip 9×24 + 8×2 = **232**, tail **~161**, so the label lane gave the
  30px: `.sh-row.cfg` is **150px 1fr auto**, and `flex: none` holds the glyphs at 24 rather than
  letting them compress to whatever the longest word in the tail leaves. Checked across all
  twenty-four settings: no clipped label, no row past its pane.
- **183 passed**, `npm run check` ok. The cohort config sheet keeps the tile grid: its pane is
  narrower and has no room for the strip.

**THE CONFIG SHEET, SECOND CUT — A SEARCHABLE RAIL, THE CONFIG'S ACTS IN ITS HEAD, AND A SWITCH
PER ROW (15 Sep, four user calls in one pass).**

- **The last line under the title went** (*"remove this text"*): `A player asks for this config by
  its key — one word, unique on this integration`. It explained a monospace key box with
  `e.g. shorts` in it, on a sheet called Custom configs; the rule it stated is enforced where it
  is broken, by name, in the field itself. `shSubText` is retired — that line is a REFUSAL now and
  nothing else, which is the only thing it ever said that was news.
- **The rail's counts went** (*"remove this 24 settings etc"*). A count earns its place on a
  CLOSED control, where it is the only report a face can make — which is why the two cohort
  sheets' drops keep theirs (`opts.quiet` is the rail's). Standing open, every box is on screen
  and the pane beside it lists exactly what is ticked.
- **A SEARCH heads the rail** (*"polished sleek and modern easy to use with a search maybe"*),
  with the section names dropped to the micro-label register and a neutral hover so the accent is
  kept for the tick. Typing rewrites the list alone (`shRailSync`) — never the sheet — so the
  caret survives, the panel's own rule. **A live query suspends the section boxes**: *all of
  Playback* over a filtered view takes thirteen settings when one is on screen, which is a trap,
  not a shortcut.
- **244 → 206, gutter 28 → 22** (*"reduce a bit of space from lhs and give it to rhs"*): the
  rail's widest line is `Appearance & controls` at ~135px plus a box, so 206 clears it and hands
  44px to the pane, which is where the controls are.
- **The config's own acts moved into its sheet** (*"give a delete option on the modal in 3 dot and
  remove 3 dot from the cards … move the enable disable to right side"*). The card carried a
  switch AND a ⋯, which made a 238px tile the home of two acts you can only judge with the config
  open. The ⋯ is in the sheet's head now — **Follow the default for everything**, **Delete
  config**, both shutting the sheet and handing off to `pcFollowAll`/`pcRemove`, which ask first —
  with the config's on/off switch beside it on the same right-hand edge. The card keeps the switch
  alone. (`Remove` → `Delete` in the confirm too: one word for one act.)
- **A PARK SWITCH ON EVERY ROW** (*"apart from x … give option to enable disable switch as well"*).
  The two controls answer different questions, which is the only reason to have two: the switch
  asks *is this config's own answer applying?* — off, the row keeps its place and its value, greys,
  and the config follows the default, so you can see what the default does without retyping what
  you had — and the × asks *does this config have an opinion here at all?* Both resolve to the
  same absence at `shDone`, because the model has one state for "follows the default" and the wire
  has no second one for "overridden but ignored". `shChangeCount` counts a parked row only where
  it will cost something. It also fixes a real discoverability gap: the × is hover-only.
- **183 passed**, `npm run check` ok. Re-checked: the cards, Cancel (ticks, values, parked rows and
  the switch all restored), new-config mode, and both cohort sheets against the changed picker.

**THE REVIEW ANSWERS WHO (15 Sep, user call).** *"In the bulk integration screen's 2nd step, in
both Player behaviour and Ad behaviour, we need an option to show all the selected integrations
which we can check/uncheck and search — and in the flow the user should be able to search and add
another integration as well."*

Step 2 has always asked `Apply to 12 integrations?` and then printed the answer as a grey byline.
Half the question was unanswerable on the screen that asked it: dropping one surface from the act
meant cancelling out, un-ticking a row in the table, and rebuilding the sheet.

- **The byline becomes a COLUMN** (user's second call the same hour — *"can we show the
  integrations in a dedicated RHS?"*). It spent one round as a dropdown hanging off the head;
  it is now the right-hand card of a two-column body — WHAT on the left, WHO on the right, both
  standing, neither behind a face. That is the anatomy of the sheet one step back (a form and a
  bounded card), so the journey keeps one shape across both of its screens.
- **THE COLUMN HOLDS THE COHORT AND NOTHING ELSE** (third call — *"refine the RHS, make it
  mature and intuitive and easy on the eyes; don't show all the non-selected integrations — if
  the user wants to add another he should search and select and it gets added to the listing"*).
  It spent one round as a checklist over the whole estate in two blocks, `In this change` over
  the other fifty-three, which is a BROWSER rather than an answer: the column was mostly surfaces
  this act has nothing to do with, and the one list you came to read was a third of it. What
  stands there now is the cohort itself, one name per line.
- **A ROW IS A TICK, AND ROWS NEVER LEAVE** (fourth call — *"the current integrations can be
  checked/unchecked, can NEVER be removed"*). For one round the row carried an ×, and an × is the
  wrong promise: it says GONE, and a cohort you are still deciding about is not a thing you delete
  from — take one out by mistake and the only way back was to remember its name and search for it.
  Take a surface out now and it stays exactly where it was with an empty box: visible, counted
  (`· 2 of 3`), one click from being back in. That is what splits the screen's ROSTER — who is on
  the column — from the act's AUDIENCE, who is in it: the audience shrinks, the roster only grows.
  `All` sits beside the count for exactly as long as it would do something, because clearing four
  boxes to try a smaller cohort should not cost four clicks to undo.
- **A COLUMN, NOT A CARD.** It arrived as a bordered box with a tinted head band — which is the
  one visual language this screen threw out on 11 Sep (*"a section is a label and a hairline, not
  a bordered box with a filled band"*), so it read as a widget pasted onto a document. It is built
  the way the evidence beside it is built now: the same micro-label in the same register on the
  same baseline (`.rvw-sh`, measured — `PRE-ROLL` and `INTEGRATIONS · 3` sit on one line), a
  hairline, the rows, a hairline, the way in. One rule divides the two columns and it runs their
  full height, because a divider that stops two names down leaves the two halves looking like one
  half and an afterthought. 276px = the queue card's 252 plus the 24 the checkbox column costs, so
  the NAME lane is the width it has on both screens.
- **Adding is a search, not a list.** Under the names sits the house typeahead (`lookupHtml`,
  the same control ops use to find an ad unit): type, pick, and the name joins the list directly
  above the field you typed in — where you are already looking — and the field clears itself for
  the next one. An empty box offers nothing, only `Type a name, property or platform`; the
  results lead with what you can add and carry the ones already in the act greyed beneath, saying
  so, because a result that silently vanishes reads as a search that failed. Ten at a time, with
  the remainder counted.
- **The content hugs the top and the results stand where there is room.** None of the column's
  three parts grows, so with three names the search sits directly under them and the rest is air —
  stretched, it was a box with two names at the top of 250px of white, the hollow look this
  journey spent the morning getting rid of. The results open DOWNWARD into that air and cover
  nothing, flipping up only when the list has grown tall enough that below would mean outside the
  dialog. Picking closes them rather than re-opening on the hint, which was covering the row that
  had just landed.
- **A name is not printed twice.** Integrations are usually named for their property and
  platform — `TOI Mweb VideoShow` is both — so the tail beside a row prints only the words the
  name does not already carry. With them repeated, a third of a 252px column went to saying the
  same thing again and `ET Desktop ArticleSh…` ran out of room; without them, every name in the
  demo world and the scale world fits whole.
- **The whole row is the target**, not the 14px box — a box is a target for a mouse, not for
  somebody deciding about forty surfaces — and it carries the checkbox role, so the keyboard reads
  and works it. Hover is NEUTRAL, leaving the accent to mean one thing in this column: the tick.
- **Step 2 takes step 1's frame exactly.** The review is `min-height` everywhere else, which is
  right when the thing that grows is evidence — but a card of sixty-seven integrations is a
  listbox, and left alone it dragged the dialog to 820px and walked the footer down the screen.
  A review carrying an audience is fixed at the sheet's own number instead: measured 860×480 at
  y=210 for step 1 and step 2, in both journeys, in both worlds.
- **One seam, and everything recounts.** A journey now carries its own audience
  (`BULK_WHO`, `bulkWhoOpen/Close/Toggle/Has/All` in views-keys-list.js) and `selectedKeys()`
  answers with it. Because both sheets derive every counted word from that one function, a tick
  re-counts the lot: `1 carry no special deals` → `2 carry no special deals`, `full waterfall`
  → a spread, the title, the act's label, and — on the player sheet — whether a row is a change
  at all. Nothing else had to be taught.
- **Two caches had to be told.** A break's cohort facts (`d.st`, `runs0`) are computed once
  because the sheet reads them per keystroke, so `bulkRecount()` re-counts them on every tick; a
  switch queued against the old truth stays the person's decision, one that now matches what
  every selected surface already does drops itself. And `pbApply` counts WHICH answers are worth
  writing *after* the review rather than before it — a row that moved nothing for the cohort you
  started with can move something for the one you leave with. (`PB` therefore lives through step
  2 instead of being nulled and rebuilt from `back`.)
- **Nothing jumps under the cursor.** The card's rows are written by hand — appended or removed
  one at a time — rather than by repainting it, because the field you are typing in lives in the
  card: a repaint would take its caret and the list's scroll while you add three surfaces in a
  row. Everything outside the card (the title, the caption, the change list, the button) is
  written in place from `recount()`.
- **The last integration cannot be un-ticked** — `One integration must stay in the change`,
  refused where it was clicked, the same answer the waterfall gives for its last partner. It is
  what keeps `0 changes over 0 surfaces` from being a state anything has to model.
- **The list's own selection is not touched.** Cancel leaves the table exactly as it was; Back
  carries the audience to step 1, where the sheet re-counts against it; after an Apply
  `refreshKeysList` clears the selection as it always did. Adding a surface here adds it to THIS
  act, not to the table behind the veil.
- **Seam:** `reviewChanges` gained one opt-in, `audience: { all, has, toggle, recount }`. Without
  it the screen is byte-for-byte the one Save, Publish and Restore have always opened.

Verified: `npm test` 183 passed · `npm run check` syntax ok · the snapshot walk 85 screens, no
console errors · headless drives on both journeys (untick → the row stays, faint, `· 2 of 3`, and
the title, caption and button recount · `All` puts it back · focus offers nothing but the hint ·
`nbt` offers two · picking lands the name at the end of the list, recounts the caveat
`1 carry no special deals` → `2`, and clears the field with focus held · typing it again shows it
greyed `already in this change` · unticking an added one and picking it again re-ticks it IN PLACE
rather than repeating it · unticking the last is refused by name · Back lands on a step 1 counted
against the new cohort · Cancel leaves the table's two ticks alone · Apply writes to the surface
that was added — `ET Android MiniTV: autoplay="off"` — and the toast counts 3) · the `scale`
world, 14 of 67, the names scrolling under the fade with the label and the field held either side
· frames measured 860×480 at y=210 for step 1 and step 2, both journeys, both worlds.

**THE CONFIG MODAL IS TWO PANES (15 Sep, user call — *"can we show the fields upfront taking 30%
of the space in the lhs or rhs whichever is better rather than selection from drop down"*).** The
catalogue was behind a dropdown. That is the right shape when a list is a DETOUR — go in, pick,
come back — and the wrong one when choosing IS the work: the two lists a person moves between,
what this config has taken over and what it could, were never on screen together, so every
comparison cost an open, a scan and a shut, and a face has no room to report twenty-four states.

- **The left, and why.** The panel's existing rails are on the right — version history, CHANGES
  TO APPLY — and both are OUTCOMES: what happened, what will happen. A catalogue you pick from is
  neither; it is the source, and the sheet reads left to right as *these settings* → *these
  values*. The wider pane is the work surface and takes the right, where the answers also keep
  the change bar in their own left gutter.
- **30% measured:** 244px of the 812 inside the frame's padding, then a 1px rule and a 28px
  gutter, leaving 540 for the rows — more than the 200px label lane plus the widest control, and
  enough for the nine tiles to fall to two columns instead of three.
- **Shared, not forked.** `pickerHtml` gained `opts.inline`: identical rows, identical tri-state
  boxes, identical receiver, no face and no drop. The dropdown form is untouched and still serves
  the two cohort sheets, so the three cannot drift.
- **Two scrollers, on purpose.** This file has argued against that before — and the argument
  stands where it was made: a queue card beside the rows that filled it is two views of ONE thing,
  and `changesCardHtml` still folds rather than scrolls. A source list beside the work it feeds is
  two different things, said so by a rule between them. Both section heads pin; both panes carry
  their scroll across the repaint a tick causes.
- **Counted once.** `pickerCount` / `pickerCountWord` / `pickerTotalWord` — the rail's head
  (`Overrides · 3 of 24`) and each section line (`Playback · 3 of 13`) read one function, so they
  cannot disagree. Frame 660 → **700**, which is what takes the rail from fifteen rows visible to
  twenty.
- **The empty state lost its last words.** `sheetAnatomyHtml` was drawn here because the
  catalogue was hidden; with it standing open the pane says only what the rail cannot — *Follows
  the default in everything*. (The block stays: it is still the cohort player sheet's.)
- **183 passed**, `npm run check` ok; the cohort player sheet and the cohort config sheet both
  re-checked against the changed `pickerSecHtml`.

**CONTROLS, THE TWO GRAINS — AND THE NINE GLYPHS BACK ON ONE LINE (15 Sep, user call —
*"Which controls can be renamed controls and it can be in a single row in the integration edit
page"*).** The rename collided: `controlsMode` was already `Controls`. Settled by naming each row
for what it actually decides —

- **`Controls`** is the nine-glyph row. They ARE the controls a viewer sees, so they take the
  plain name. (`Hidden controls` in the two field-word catalogues named the field's STORAGE —
  what is taken away — rather than the decision anyone makes.)
- **`Control bar`** is the mode above it, because Full / Minimal / None is what that describes.
- Renamed in all three catalogues at once — `cfgDefs()` (the card and both sheets),
  `web/js/util.js` `FIELD_NAMES` (diffs) and `api/store/state.js` `FIELD_WORDS` (refusals and the
  version rail) — so the screen and the wire cannot spell it differently.

**ONE ROW, MEASURED.** The glyphs were stacked because at the shared 28px the strip is 284px and
the column is 320 with a 12px gutter — no room for a label beside it. At **24px with a 3px gap
it is 240px**, leaving 68 for `Controls`, which fits with slack. `.pcd-c .cfg-strip`, page only:
the config sheet and the cohort sheet are wider and keep the labelled tile grid they have room
for. `PCD_STACK` is down to `['look']` — the colours are three fields and genuinely half a form.

**One thing fixed next door.** The SAVE diff printed `Controls — → quality`: the raw control id.
`pbWord`'s own comment has always said a line in the change review reads it, and the publish diff
does, but `showVal` did not — so the two list-valued player fields are routed through it now
(`PLAYER_LIST_FIELDS`). It reads `all → without Quality`. **183 passed**, `npm run check` ok.

**AN EMPTY SHEET IS THE SHEET, NOT A SENTENCE (15 Sep, user call).** *"When we open the create
new custom config or a bulk change in Player behaviour the modal looks empty — how can we in a
clean way communicate to the user how to initiate the flow without putting up too much text
which no one will read?"*

Both pick-then-answer sheets open on one small strip above 430px of white, and the two of them
explained that white differently: the config sheet with a full sentence — *"Follows the default
in everything — pick a setting above to give this config its own answer"* — and the cohort sheet
with nothing at all. One is the text nobody reads; the other is a screen that looks broken.

- **What stands there now is the map** (`sheetAnatomyHtml`, `controls.js`, one block, two
  callers): the sections a pick can land in, in the order they will appear, each with how many
  settings it holds, greyed until something arrives. It is not a caption ABOUT the screen — it
  is the screen with nothing in it yet, which is why it needs no instruction.
- **The heading does not move when it goes live.** The map is drawn in each sheet's OWN section
  header — plain type on the cohort sheet (`.pb-sh h4`), the tinted band on the config sheet
  (`.sh-sh`) — and measured to the pixel: `PLAYBACK` sits at 321/320 on one and 278/278 (band
  267/267) on the other, before and after the first pick. So the first row lands under a heading
  the reader has already looked at, rather than one block replacing another.
- **Counted from the same list the menu is built from.** `pbPickGroups()` / `shPickGroups()` are
  built once and read twice, so the map and the checklist can never name or count a section
  differently, and a section whose rows are all refused is not counted (it is not the section's
  to give).
- **The way in wears the act while the sheet is empty** (`pickerHtml`'s `cta`): accent border,
  accent ink, a leading `+`. On a sheet with rows it is a field among fields and recedes to grey.
  Same box, same place — only the colour and the `+` change, so nothing moves.
- **Retired:** `.sh-empty` and its sentence, in both stylesheets. A config that overrides
  nothing still says so on its CARD, where it is a fact about the config rather than a caption
  on a modal.

Verified: `npm test` 183 passed · `npm run check` syntax ok · the snapshot walk 85 screens, no
console errors · headless drives on all four states (new config · a config stripped of every
override · the cohort sheet empty · each of them one pick later).

**A COHORT IS SET, NOT CHANGED — AND AN UNANSWERED FIELD LOOKS THE SAME ON BOTH FORMS
(15 Sep, two user calls).** *"In Changes to apply, in both Player behaviour and Ad behaviour in
bulk, we don't have a pre value since we are setting it up, so we don't need that it is changed
from this to that — make it clean and readable and intuitive."* · *"The Set CTA is there in Ad
behaviour while Not set yet label in the Player behaviour — make it uniform; maybe the Set CTA
shows on hover of the selected fields."*

- **The queue card lists the field and the ANSWER.** `changesCardHtml` printed `from → to` for
  every caller. On the two cohort sheets the from-side was never a value: forty integrations hold
  forty answers, so the row read `3 different values → Muted` — or, when the pick happened to
  match, `on → on`, a transition that transits nowhere. `from` is optional now and the two
  cohort sheets stop passing it. **The custom config sheet still passes it**, and should: a
  config is one object with one current answer, and that answer is the thing an override
  replaces (`Off → Auto`).
- **What they hold today did not go anywhere.** It stands beside the lever on the ad sheet
  (where the cohort has a value), and the change review still reads `was → now` for all three
  acts. That is the screen whose job is the comparison; the card's job is the list of answers
  about to be written, and it now reads as one.
- **`Not set yet` is gone from the Player behaviour sheet**, which leaves the morning's config
  sheet call applied everywhere it belongs: **an empty control IS the unanswered state**, and a
  caption describing it is words on something already legible. A waiting row is the control and
  its ×. What it still says is the news — the flag once Apply has refused over it, and `already
  this everywhere` for an answer that lands on nothing.
- **`Set` goes back to being the door.** It is the ad sheet's alone (the player sheet has no
  closed row — picking a setting opens it) and it surfaces on hover, where the act is about to
  happen, instead of standing on all six levers at once. It keeps its seat while invisible
  (opacity, never `display`), so nothing on the row moves as it arrives.
- **This reopens 7 Sep UAT P2 by the user's own call** — *a resting row must not read as an
  inert grey fact*. What answers it now is the row rather than the chip: pointer cursor, a lit
  ground on hover, and the cohort's counted today-word where it has one.
- **One in-place bug went with it.** `pbMark` writes the row's state while somebody types (a
  repaint would take the caret). It removed the waiting caption on the way to an answer and
  never put anything back when the box was emptied again — so a cleared number left a row that
  had stopped reporting. It now rewrites the one slot from the state, in both directions.

Verified: `npm test` 183 passed · `npm run check` syntax ok · the snapshot walk 85 screens, no
console errors · headless drives (type 55 → the card reads `Passive volume · 55%` and the row
queues; clear it → the card empties and the row is a question again; answer with the value they
all hold → `already this everywhere` and nothing reaches the card; the config sheet's card still
reads `shorts · Autoplay  Off→Auto`).

**CUSTOM CONFIGS ACROSS A COHORT (15 Sep, user call).** *"Introduce a custom config bulk change
as well in the Integration listing page which will show the custom config of all the selected
Integrations one under another in a clean manner for user to tweak and change."* The third act on
the bulk bar — and deliberately NOT a third blanket form. Ad behaviour and Player behaviour can
carry one answer for forty surfaces because each writes a thing every integration has exactly one
of; a custom config is not that shape (none, or up to six, each addressed by its key), so the
sheet is an **editor with one accelerator**. Full record: `docs/DECISION-RECORDS.md` §COHORT-CONFIGS.

- **A block per integration** (user's call over grouping by key), its configs one under another,
  and each config's SETTINGS THEMSELVES open as the content — the integration page's OWN rows
  (`.sh-row cfg`, `cfgCtlHtml`, the shared `pickerHtml` checklist, the `default` tail, the ×
  back to following), with `+ Override a setting` below them as a link rather than a box.
  Nothing is a lookalike, so no two surfaces can drift on a control or a word.
- **THE COUNT IS THE CONTROL** (user call — *"this override a setting can it be handled more
  maturely"*). `Overrides 3 settings ▾` sits in each config's header: it REPORTS at rest, opens
  the checklist when clicked, and reads whether the config is open or shut. One control wearing a
  micro-label, where a label and a blue link had been two things in two places. Opening it
  scrolls that config to the top of the list, so a ten-row menu is not clipped by the scroller.
- **THE INTEGRATION HEADER CARRIES THE LIST'S OWN MONOGRAM** (user call — *"the header for each
  integration can it be more prominent"*): `propBadge` + the name at 13.5/700 + a firmer rule +
  real air between blocks. Prominence by the device the reader already knows, not by size alone —
  and the property WORD went with it, since the badge already says TOI.
- **THREE THINGS WERE BUILT AND CUT OVER THE DAY, all for clutter** (user call — *"dont give this
  change a setting on and which setting dropdown on top no need for it… dont show the fields in
  read only mode along side it"*): the `Change a setting on [ scope ]` shortcut strip above the
  list, the read-only glance line beside each config key, and the `+ Override a setting` link
  under each config's rows. All three are named in the file header so nobody rebuilds them. The rule they leave behind: **on this sheet nothing is a read-only
  copy of something editable.** A shut config says how many settings it holds — a count, not a
  second rendering of them.
- **The four a single surface owns are out entirely** (user's call) — not offered, not greyed, at
  either scope. The sheet also never creates or removes a config; `configFields` refuses both.
- **Counted throughout.** A config's from-side is its own and says `(default)` where it was
  following one; a shortcut's is counted across what it reaches (`4 different values → On`).
- **Seam:** `configFields` is the one bulk action carrying a LIST — `{ edits: [{ id, config,
  fields?, on? }] }`. `null` is the way back. Every target and value is dry-run before any
  integration is touched, and one integration's edits land in one `updateKey` (one version line
  per moved field). Nine cases in `07-bulk.spec.js`; **183 passed**, `npm run check` syntax ok.
- **Two states named:** a selection carrying no config greys the bar act with its reason rather
  than opening an empty room, and the integration name pins while you scroll (one sticky layer —
  the config key pinned too for a round and was dropped for the seam it cost).
- **One shared-code bug surfaced and fixed:** `pickerHtml` swept its receiver registry inline,
  which is correct for one picker per screen and wrong for several drawn in one `innerHTML`
  string — none is in the document yet when the next asks for markup, so every picker but the
  last was silently unwired. The sweep is deferred to the next frame. The config sheet and the
  Player behaviour sheet were re-checked: both unchanged.
- **The frame is 620, not the family's 480** — the other two sheets are bounded forms; this one
  lists a cohort, and at 480 it showed three integrations of twelve.
- **Mock:** custom configs seeded across the demo seven (`key_2` stays clean — a case depends on
  it) and across `scale` (shorts on every third, amp_stories every fifth, live_blog one in
  twelve), deliberately not spelled the same way twice, because a sheet that only ever shows
  agreement teaches nothing.

**THE VEIL IS ONE TEST AGAIN (15 Sep, refactor — no behaviour change).** ARCHITECTURE.md
promised that `wireDialogExit()` owned the way out of every dialog, "so the day Escape closes a
dialog, it closes all of them". It did not: six places spelled
`e.target.classList.contains('dlg-veil')` for themselves, and three of them reached for the veil
with `document.querySelector` rather than their own root — a scoping bug waiting for a second
veil to exist.

- **What went:** the hand-rolled veil handler in `review.js`, both create choosers
  (`views-setups-list.js`, `views-keys-editor-frame.js`) and the change-setup journey
  (`views-keys-editor-load.js`). **What arrived:** `isVeilClick(e)` and `wireVeilDismiss(root,
  bail)` in `util.js`, under `wireDialogExit`, which now calls them itself.
- **`bail` decides what dismissing MEANS, including whether it closes.** That is why this is a
  new helper rather than a fourth caller of `wireDialogExit`: the change review must read its own
  note field *before* the root is cleared, and the two choosers walk the address back on the way
  out. `wireDialogExit` stays what it was — Cancel plus the veil, both closing first.
- **The config sheet keeps its attribute handler** (`onclick="shVeil(event)"`). It repaints the
  whole root on every render, so a wired listener would not survive; only the duplicated test
  moved.
- **`askForm` came home.** It is a house dialog — five files across both rooms call it — and it
  was living in `views-setups-list.js`, the Ad Setups *list* screen, with `paintDialogRefusal`
  and `paintFieldRefusal` beside it. `util.js`'s own comment admitted it ("and in `askForm`, one
  room over"). Moved verbatim, 61 lines, so `ask` / `pickDialog` / `askForm` finally sit together.
- **Proven, not asserted.** A probe opens all eight dialogs, clicks the card (must stay) and the
  veil (must close): byte-identical before and after. `npm test` 174 passed, `npm run check`
  syntax ok.
- **Not merged, on purpose:** the three house dialogs still each paint their own
  `Promise`/`dialogRoot`/`innerHTML` opening. They are a confirm, a list and a form-with-submit —
  different bodies, different foots, different resolution contracts. One dialog factory with an
  option per variation would be the wrong abstraction; adjacency in one file is the whole win.

**THE ARITHMETIC SWEEP (15 Sep, refactor — no behaviour change).** Five small things the rules
already said, said once instead of three times.

- **Two dead exports deleted**, both with zero callers: `signedInAccount()` (`store/session.js`;
  `session.signedIn` is read directly everywhere) and `headerBiddingWord()` (`store/setups.js`) —
  whose one job, `HB_WORD[v] || v`, was spelled inline in `version-changes.js` anyway. That was
  also the only reason `setups.js` imported `HB_WORD`.
- **A four-deep ternary became a dispatch table.** `rungFactChanges` picked a word map by field
  name in one line, rebuilt inside the innermost loop on every changed fact. Now `RUNG_FACT_WORDS`
  maps field → word map once, and `rungFactWord(field, value)` reads it. A fact with no entry
  prints its stored value, which is what the old `: v` tail meant.
- **`normalizeRungs` says its refusals once.** The three-line "collect into the unit's own list,
  then re-word each with the unit's name" appeared three times verbatim; it is now `refuseOnUnit`.
  The banner's two clocks moved into `normalizeBannerClocks(r, rung)` — the house `normalize*`
  shape, writing the rung and returning its refusals — which took the display branch from five
  levels of nesting to three. The cap check asks "which kind?" once now, not twice.
- **`liveConfig` builds a walk once.** `.map(x => walkEntry(x, hb)).filter(Boolean)` appeared
  three times; it is `walkOf(rungs, hb)`.
- **The capture's port comes from `config.js`.** `test/ui-snapshot.mjs` hardcoded `4300` beside
  `PORTS.snapshot`, which exists for exactly that and is documented in §9. And `npm run check`'s
  glob gained `test/*.mjs`, closing the §11 hole that left the repo's one `.mjs` file never parsed.
- **Left alone deliberately:** `liveConfig`'s section→slot→group nesting stays at four levels. The
  only extraction available needs five parameters — the slot, the drive, the type, the walk
  emitter and the global answer — which is the data model asking to be reshaped, not a helper
  asking to be written. It is the player's wire boundary; it is not worth reshaping for a level.

**THE CHECKLIST IS ONE CONTROL AGAIN (15 Sep, refactor — no behaviour change).** The cohort
sheet adopted this sheet's checklist the same day it was built, and the other session extracted
the generic half into `controls.js` as `pickerHtml(groups, h, opts)` without touching this file —
leaving the render logic duplicated by their hand rather than editing mine. This collapses ours
onto it.

- **What went:** `shPickSecHtml`, `shPickClick`, `shPickKey` and this sheet's own click-away
  listener. **What stayed:** `shPickToggle` (the all-or-nothing rule is ours), `shPick` /
  `shUnpick`, and `SH.pickOpen` — the state was never the control's business.
- **`SH_PICK_H` is the receiver**, the same shape `cfgCtlHtml` already takes: `has`, `off`,
  `toggle`, `toggleAll`, `open`, `setOpen`. Nothing on a config sheet is ever refused — a config
  may override any of the player's settings — so `off` answers with no reason at all, and the
  shared control's greyed-and-why path simply never fires here.
- **Proven, not asserted.** A behavioural fingerprint of the picker (its height, its open state,
  every section head with its count and box state, every option with its classes, then tick /
  section-tick / section-untick / Escape / click-away and what each did to the sheet) is
  byte-identical before and after. The snapshot walk's ten config-sheet screens differ only by
  the generated `id="pick_N"` and the inline handler names; with those normalised away the markup
  is identical. `npm test` 174 passed, `npm run check` syntax ok, walk 85 screens no console
  errors.
- One thing to watch in the shared control, measured rather than guessed: `PICKER_REGISTRY` gains
  an entry per render and never loses one — five ticks left seven entries with one live element.
  It is small and it is the other session's file, so it is flagged there rather than patched
  here.

**THE CONFIG SHEET'S HEAD IS ITS KEY (15 Sep, user call).** *"`2 of 29 settings are this
config's own · the rest follow the default` — remove this text."*

- It counted what the body below it lists. The rows on the sheet ARE the settings this config
  owns, and everything not on it follows the default by definition — that is the model, read back
  as though it were news. An existing config's head is now the key and nothing else.
- **What survives is what is not a description**: the rule a NEW key must pass (one word, unique,
  a player asks for it by that), and a refusal, which replaces whichever line stands. `shCount`
  went with the sentence — its last reader.
- **The picker now carries its own height** (30px, on `.shpick` itself) rather than taking it
  from the integration editor's type scale. A shared control that is only the right size on the
  page whose scale happens to cover it has a hidden dependency: the cohort sheet adopted this
  picker the same day and drew it 21px tall and squashed, for exactly that reason. Both sheets
  measure 30 now.

Verified: `npm test` 174 passed · `npm run check` syntax ok · headless drive of all four head
states (an existing config: empty and hidden; a refusal: named, head in the refusal colour;
answered: back to empty; a new config: its key rule) · both pickers measured at 30px · the
snapshot walk: 85 screens, no console errors.

**ONE SIZE, ONE SCROLLBAR, ONE PICKER (15 Sep, three user calls).** *"keep the ad sheet and
player sheet both fixed to a particular size"* · *"why two different scroll for lhs and rhs isnt
it confusing"* · *"use the same drop down override settings as used in custom config modal here."*

- **Both bulk sheets are fixed, and the frame moved to 480 because of it.** `.steady` was a
  min-height: each sheet held the number until its content disagreed, which is not what a frame
  is for. Now it is a height on both. The number had to move with it — 428 was the ad sheet's
  tab bar plus its shut levers, but its pre-roll tab reaches 480 with every lever open, and a
  fixed 428 would have made it scroll levers it has always shown at once. 480 is the tallest
  state any of the four screens actually reaches, so no sheet scrolls what it used to show, and
  the player sheet gained 52px of rows. The cost is 52px of air on a shut ad tab, which is the
  price of the sheet not resizing under the person using it.
- **The card folds where it used to scroll.** A queue card that scrolled beside a row list that
  scrolled put two scrollbars an inch apart, moving different things, on a 480px dialog. The
  card never scrolls now: past four changes it shows a counted line — `+4 more — every one of
  them on the next screen` — pointing at the change review, which is one button away and exists
  to be read in full. Nothing is stranded: a folded change is still dropped by its own row's ×.
  `changesCardHtml` takes an optional `max`; the ad sheet passes none and is unchanged.
- **The strip is the config sheet's checklist, shared outright.** Not a lookalike — the same
  control. The generic half is `pickerHtml` in controls.js (markup, the boxes, the open menu,
  the keyboard) with a receiver for state, exactly as `cfgCtlHtml` takes one; the CSS is the
  `.shpick` / `.shp-*` block the config sheet already had. A box per setting, a box per section
  that takes everything under it and gives it all back, and the menu stays open while you work,
  because choosing five settings is one act and not five. The cohort's own concern is the one
  thing added to it: the four the platform refuses sit in the list greyed with the server's
  reason on hover, and a section's box neither counts nor takes them — they are not the
  section's to give.
- **Two scroll positions are now carried across the repaint, and neither is the one that used
  to be.** `.dlg-body` stopped scrolling when the strip came down into the column, so the rows
  keep their place — and so does the picker's own menu, without which ticking something under
  Measurement threw you back to Playback on every tick.
- **A refusal no longer flashes the row it flags.** The arrival highlight means "this is the
  row you just added"; on the refusal path it was firing on a row already wearing the warning,
  putting two signals on one state — one of them in the colour this app uses for "changed".
  (Caught by the other session on their own sheet; the same line was wrong here.)

**A WAITING ROW SAYS NOTHING (15 Sep, user call).** *"Remove this `Not set yet`."*

- The caption sat where an answered row shows what the default holds. It was a description of
  something already legible: a row whose control stands empty is not mistakable for one that has
  an answer. It is gone, and a waiting row is now an empty control and its × — nothing else.
- **What the row keeps is the one thing that is news**: once Apply has refused over it, the row
  flags itself (soft tint, label in the refusal colour) while the head names every field. State
  earns words when it changes something; until then the control is the state.
- **The arrival flash no longer fires on a refusal.** `shGoTo` gained a second argument, and the
  refusal path scrolls without lighting: a row flagged red and pulsed amber in the same instant
  is two signals for one state, and amber means something else everywhere else in this app.

Verified: `npm test` 174 passed · `npm run check` syntax ok · headless drive (two ticked rows
carry `×` alone and the phrase appears nowhere in the DOM; Apply still refuses naming both and
flags both; answering one clears its flag) · the snapshot walk: 85 screens, no console errors.

**THE PICKER BECOMES A CHECKLIST (15 Sep, user call).** *"Rather than this All of Playback, all
of this — shall we introduce a checkbox against each field, and a checkbox against Playback which
selects all its fields? Also Playback, Measurement: those sections are headers, currently it is
not communicated properly here in the dropdown."*

- **Two faults, one cause: the control was the wrong SHAPE.** A single-pick menu can only ADD, so
  "everything in this section" had to be smuggled in as a pseudo-option (`All of Playback`)
  sitting among real settings and reading like one — and the section names, having no job but to
  sit above their group, were a faint line of type the eye skipped. But the question this control
  answers is not "which setting do I want next"; it is "which settings does this config
  override", and that is a list you TICK.
- **So it is a checklist.** A box against every setting, and above each group a box against the
  section itself (`Playback · 4 of 13`) that ticks everything under it — full when all of them
  are, half-filled when some. The header now carries the section's own weight, its count and the
  state of its contents, which is what the old caption could never do.
- **The menu stays open while you work**, because choosing five settings is one act and not five.
  It survives the sheet's repaint (every tick repaints), keeps its own scroll across it, shuts on
  a click away or on Escape — which is the picker's before it is the sheet's.
- **Unticking is the row's × by another route**, including on a setting that already had a value,
  and a section's box gives back everything it took. That is safe because the sheet is a working
  copy: Cancel puts all of it back. Nothing new was invented to protect it.
- Unchanged: a ticked setting still arrives EMPTY and Apply still refuses by name over anything
  unanswered (`shPick` / `shDone`). `shAddHtml` and `shAddRow` are gone; `selectHtml`'s `tail`
  option, used for one day by the counted `All of…` row, now has no call site here — it stays for
  the cohort sheet, which uses it for what it was built for.

Verified: `npm test` 174 passed · `npm run check` syntax ok · headless drive (the menu lists 3
headers and 24 settings with the config's own three already ticked and Playback reading `3 of 13`
half-filled; ticking one keeps the menu open and lands an empty row; the section box fills to
`13 of 13` with twelve waiting and `Remember` seeded; unticking it returns every row including
the three that had values; a click away shuts it) · the snapshot walk: 85 screens, no console
errors — and it caught one real thing, a step that clicked a Cancel which correctly no longer
exists once a tick and an untick net to nothing.

**THE PLAYER COHORT SHEET IS ONE SIZE (15 Sep, user call).** *"as i keep adding the fields dont
increase the size of the modal keep it fixed introduce scroll in that case."*

- **`.steady` was a floor; on this sheet it is now the height.** A floor is right for the ad
  sheet, whose content is fixed per tab and known — its pre-roll tab measures 428 shut and 480
  with every lever open, and growing to fit that is honest. This sheet has nothing to bound it:
  one pick at a time, up to twenty-one, so the dialog grew a row at a time and walked its own
  footer down the screen while you worked — the thing you were reading moved because of the
  thing you were doing. Fixed at the same 428 the ad sheet rests at: the frame, the strip, the
  card and the foot hold their pixel at 0 rows and at 21, and the rows scroll from the sixth on.
- **The ad sheet is untouched** and still grows with its levers. Two different answers for two
  different situations, not an inconsistency: one sheet knows how much content it can have and
  the other does not.
- **The flex chain had to be finished for the scroll to exist at all.** `.bulk-split` carries
  `align-items: flex-start`, so the fields column was sizing to its content and simply
  overflowing a dialog that was, correctly, 428px tall — the height was pinned and nothing
  scrolled. The columns stretch on this sheet now, and the queue card is put back on
  `flex-start` alone so it still hugs what it holds, with its own scroll past the frame.
- **The body still does not scroll — the rows do.** That has been true since the strip came
  down into the column and is what lets the twenty-one-deep menu escape: the menu is the one
  box the scroller is not around.

**FOUR CUTS ON THE APPEARANCE COLUMN AND TWO LABELS (15 Sep, user calls).** *"`All 9 controls
shown` — remove this text."* · *"`Remembered` — rename it to something easy to understand by
user."* · *"Can brand and text come in the same line."* · *"Rename `Player type` to a cleaner text
which is understood by everyone, and can they come in the same row, its value tabs."*

- **The counted line under the controls is gone.** Nine glyphs, lit or not, ARE the count;
  reading it back underneath in words was the screen describing itself. Gone from the strip and
  from the modal's tile grid alike, so the two states of one control stay one control.
- **Brand and Text share a line, the logo takes the one under it.** The two colours are one
  decision — a brand's pair — so they read as a pair; a URL is a different kind of answer and a
  much longer value, so it gets the width. The Appearance & controls column lost another 40px.
- **`Remembered` → `Remember`.** Third-person `Remembers` read as a stray verb; the participle
  was closer but still stood on its own. With its three values on the same line the row reads as
  the instruction it is — Remember: Volume, Language, Captions — and the hover still carries
  "What a returning viewer keeps from last time".
- **`Player type` → `Plays as`, back on one row.** The old label asked the reader to know what a
  player *type* is; the new one says the same thing as a sentence with its own answers — Plays as
  Inline, Plays as YouTube. At 49px against the old 68 it also fits beside its three answers, so
  `wide: true` came off and the row is inline again. Measured at 1280, 1440 and 1680: nothing
  clipped, both rows on one line at every width.
- **`o.onValue` added to `cfgCtlHtml`** for the other session's collapse onto the shared
  renderer: the value an unanswered Off│On pair writes when switched On, defaulting to the
  field's own default. On one surface the default is right; on a cohort already holding 3s
  everywhere, proposing 5s would be the platform inventing a number. Nothing here passes it.

Verified: `npm test` 174 passed · `npm run check` syntax ok · headless drives at three widths
(above) · the snapshot walk: 84 screens, no console errors.

**THE COHORT SHEET SAYS WHAT IT WRITES, AND STOPS SHOWING WHAT IT DOESN'T (15 Sep, four user
calls on the re-cut).** *"the UI is completely distorted and looks immature"* · *"we dont need
text like Nothing on the sheet yet"* · *"the default values of the fields need not be shown
anywhere"* · *"Change a setting could come down aligned with changes to apply and the size of
the modal to be same as that of the modal of change ad behaviour"* · *"Add a mature and
prominent message that these will change the default Player config of the Integrations
Selected."*

- **What this act writes rides the title, and nothing else does.** `Sets the default player on
  all 7 selected integrations` — the one line beside the heading, in body ink. It reached that
  shape in two moves on the same day: first out of the kicker, where the most consequential
  fact on the screen had been set in the same grey as a byline, into a ruled block under the
  title with a counted caveat about custom configs beneath it — then back up to the heading,
  the caveat deleted and the integration names with it (user call: *"this message can be shown
  on the right side of the Player behaviour heading remove the names of the selected
  Integrations"*). The block had bought prominence with 60px and a second sentence, and the
  second sentence was not this sheet's news: that a config keeps its own answer is the config's
  own rule, true whoever writes the default. The names were never the subject either — the
  selection was chosen on the list a moment ago, and the count is the part that matters. With
  the block gone the two columns start level with the heading's own gap, which is what the same
  call asked for: *"align the change settings and changes to apply a bit more to the top"*.
- **A row no longer prints what the field holds today.** `Not set yet` over `No · Yes today`
  was two lines answering two different questions, and on a long value — three media ids
  across seven surfaces — the second overflowed its column and printed ON TOP of the input.
  The menu's tails went with it: a tail is for a REFUSAL now (`each integration's own`,
  reason on hover), never for a value. What a field holds today survives in the one place
  that is about a change: the queue card's from-side, and the review's.
- **The empty sheet says nothing at all.** The `Nothing on the sheet yet — pick a setting
  above…` sentence explained a strip that is already labelled `Change a setting` and already
  sits beside an empty `Changes to apply` card. Two empty states and an instruction, for a
  screen whose one control is self-evident.
- **The strip came down into the column.** It had been hoisted above the body so its
  twenty-one-deep menu would not be clipped by the body's scroller; that left it floating
  above both columns with the card's header starting 110px lower. It sits at the top of the
  left column now, its top edge level with `CHANGES TO APPLY`, and the clipping is solved the
  other way round: the body stopped scrolling, the ROWS scroll, and the menu is the one box
  the scroller is not around. At all twenty-one settings the rows scroll, the strip and the
  card hold their place, and the foot stays on screen.
- **One frame for all four screens.** The player sheet had its own measured floor (369) beside
  the ad sheet's (409) — but the ad sheet's step 1 actually measures 428 with its tab bar, so
  the AD journey was itself jumping 428 → 409 between its two steps. All four now rest on 428:
  ad sheet, ad review, player sheet, player review. Nothing moves, in either journey.
- **A refused field is refused twice.** `Fallback media` reached a sheet in the field, which
  should be impossible — the menu greys the four the server owns. `pbPick` now refuses on its
  own before the row is ever created, naming the field and the server's reason: the greyed
  option is one renderer's courtesy, and the refusal is not.

**A PICKED SETTING IS A QUESTION, NOT AN ANSWER (15 Sep, user call).** *"Remove this follow
default from everything in the modal of custom config. Also add an option in the dropdown to
select all the fields pertaining to playback or appearance or measurement, and once selected
don't show any default value — they are meant to be configured; if not configured run a
validation and ask the user to fill before applying."*

- **A whole section in one pick.** Each group in the `Override a setting` menu now opens with
  `All of Playback · 10 settings` (the count is the peer's new `tail` on `selectHtml`, used here
  for the first time), taking only what is not already on the sheet. A config that overrides a
  section usually overrides most of it, and picking fourteen settings one at a time is the same
  decision typed fourteen times.
- **Picked ≠ answered.** The cut before this one dropped the DEFAULT's own value into a picked
  row, so a setting somebody had chosen to override sat there already agreeing with the thing it
  was overriding — a decision that looks made before it is made, and one that lands on the config
  whether or not anybody touches it. A picked row is now empty and says `Not set yet`. The four
  kinds with no empty state (`shown`, `multi`, `set`, `look` — nine controls, speeds, the
  remembered set, the colours) still seed from the default, because their resting shape IS an
  answer: nothing lit means "hide everything", not "unanswered".
- **Apply refuses, by name, in place.** `Passive volume and Loop have no value yet — set them or
  take them off the sheet.` The head carries the sentence, every waiting row is flagged where it
  sits, the first is scrolled to, and nothing lands — on a new config either, which is not created
  until every picked setting has an answer.
- **A sheet gets a pair, not a switch** (`o.pair`). A switch has to stand somewhere, and where it
  stands reads as an answer — fine on the page, where every row has one, wrong on a sheet where a
  row can be an open question. Yes/No is an explicit pair in BOTH states now, so no control
  changes shape at the moment it is answered.
- **`Follow the default for everything` is gone from the sheet** (`shFollowAll` with it).
  Dropping every override in one click is a rare act on a sheet whose entire body is the
  overrides, and the row's own × already takes one off — the way it was put on. The act stays on
  the card's ⋯, where a config can be emptied without opening it.
- **One renderer still.** The unanswered states live in `cfgCtlHtml` behind `o.unset`, built from
  the same primitives as the answered ones, so the config sheet and the cohort sheet cannot drift
  into looking like two products. `shCtl` went with the change (the row calls the renderer
  directly). This also settles the difference flagged on 15 Sep between the two sheets: both now
  make answering mandatory after a pick, for the same reason.

Verified: `npm test` 174 passed · `npm run check` syntax ok · headless drives (a single pick
arrives empty and out of the draft; Apply refuses naming it and the sheet stays open; answering
clears the flag and the foot turns to `Apply 1 change`; `All of Playback` adds ten with nine
waiting and `Remembered` seeded; the colours seed and count as answered; a new config refuses the
same way and is not created; the page still draws a real switch where the sheet draws a pair) ·
the snapshot walk, three new screens: 84, no console errors.

**ONE TYPE SCALE, AND FOUR SMALLER CUTS (15 Sep, user calls).** *"The font size and type for
every field in identity, player behaviour and ad behaviour seems different — check all these and
make it uniform, that doesn't feel cluttered and looks easy on the eyes."* · *"`Text on brand
5.8:1` — remove this text."* · *"The appearance, can it be more refined."* · *"Default: rename it
to Default Config."* · *"`A view counts after` — remove A from here."* · *"Remembers: can this
label be better renamed, from an enterprise platform — and its values also in the same row."*

- **ONE SCALE.** Three cards built in three different months had drifted to three scales:
  identity at 13.5px text in 37px boxes, player behaviour at 12–12.5px in 28px, ad behaviour at
  12.5px in 28px — and inside each of them a seg, a chip and a unit had their own sizes again.
  Twelve sizes were doing the work of five. The page now has one, set in ONE place and nowhere
  else: label 12.5px/500/ink-soft · value 12.5px · box 30px · seg 12px · chip 11.5px. It is
  scoped by a new `keyform` class on the editor's form, and covers the custom config sheet too
  (`.dlg.sh`, which draws the same settings and would otherwise read as a fourth scale). The ad
  setup editor shares `.form` but not `.keyform`, so it is untouched. Every per-card size that
  contradicted the scale is deleted; the per-card rules that remain set WIDTHS only. Measured
  after: 35 labels at 12.5/500, every value at 12.5, 31 segs at 12px, 8 chips at 11.5px, and all
  19 bordered boxes at exactly 30px.
- **The contrast ratio is gone** (`pbContrast`, `cfgContrastHtml`, `.cfg-look-note`) — the last
  thing on this card doing arithmetic nobody asked for, over a pair a brand team settles
  elsewhere.
- **One colour, one field.** The swatch and the hex were two controls side by side — six
  rectangles for three settings, the heaviest block in its column. The swatch sits INSIDE the
  field now, at its left edge, so Brand, Text and Logo are three fields of one height on one
  lane. Their heights are set rather than inferred: a box built from a swatch and a box built
  from a text input land 3px apart otherwise, which is exactly what reads as unfinished.
- **`Default` → `Default config`**, which pairs with `Custom configs` below it, and
  **`A view counts after` → `View counts after`** (the article was the only one on the card).
- **`Remembers` → `Remembered`, with its values on the row.** A verb with no subject in a column
  of noun phrases read as a stray word. The chip for the audio track is cut to `Language` so the
  label and its three values hold one line at the column's width; the change review keeps the
  full `Remembers audio language`, which is where precision counts. `set` left the stacking list
  to make that possible — and `Player type`, whose three long answers are wider than any answer
  lane, joined it by name (`wide: true`). The rule is the one this card already had, now
  measured rather than guessed: a control that cannot share a line with its label takes the line
  under it, and the LABEL is never the thing that gives.
- **`BULK_ROWS` deleted** — the cohort sheet reads the server's own catalogue now (its own
  re-cut, another session), so the constant and the prose that explained it moved out.

Verified: `npm test` 174 passed · `npm run check` syntax ok · headless audit of every label,
value, seg, chip and box on the page (above) · no label clipped at 1280, 1440 or 1680px, with
`Remembered` and its three chips on one line at all three · the snapshot walk: 81 screens, no
console errors.

**PLAYER BEHAVIOUR: PICK THE SETTING, THEN ANSWER IT (15 Sep, user call).** *"the bulk change
player behaviour needs to be rethinked can we make it like the custom config wherein we select
the field first to apply change bulk and then set its value."*

- **Five became twenty-one, because the picker is what made twenty-one possible.** The sheet
  printed five levers and kept its own `BULK_ROWS` shortlist, while the server had accepted the
  whole player behaviour card since 11 Sep — twenty-five fields, four refused by name — and
  carried both lists on `/panel/meta` where nothing read them. The sheet reads them now, so the
  catalogue has exactly one source and the screen cannot spell it differently from the server.
  The four a single surface owns (Player type, Redirect URL, Quality, Fallback media) sit in the
  menu greyed, carrying the server's own sentence, rather than being quietly absent.
- **Why a picker here and a printed list on the ad sheet.** A break offers six levers, so its
  shut list IS its menu and every row doubles as a report. A player offers twenty-five, and a
  printed list of twenty-five blanket levers is a form for a whole estate — the thing the config
  sheet stopped being on 14 Sep. So the levers fold into one strip, and the report folds with
  them: every option carries what the selection holds for it TODAY (`Autoplay · On · Auto`,
  `Passive volume · 3 different values`), read at the one moment it matters. `selectHtml` gained
  an option `tail` and refusable options for this, additively; ten existing call sites unchanged.
- **Everything after the pick is the ad sheet, untouched** — the same row (label · control ·
  what they hold today · ×), the same CHANGES TO APPLY card, the same counted foot, the same
  CHANGE REVIEW. One cohort screen learnt once; only the way a lever is reached differs, and it
  differs because the counts differ. The ad sheet keeps its printed list and is not touched.
- **Answering is mandatory after a pick, and that is deliberately NOT what the config sheet
  does.** A picked row lands with nothing chosen and Apply refuses in place, by name — *"Starts
  muted has no value yet — set it or take it off the sheet"* — rather than silently ignoring it.
  The config sheet seeds a picked setting at the default's value and lets it stand as `same as
  default`, because a single surface HAS a current value to seed from; a cohort does not, and
  seeding one integration's answer would be the platform inventing a number for forty players.
  The difference is correct — do not unify them.
- **An answer nobody has to make is not a change.** A value every selected integration already
  holds says `already this everywhere` where it stands, stays out of the queue and out of the
  review, and still counts as answered. The review never reports `Auto → Auto`.
- **What a control shows when there is nothing honest to show.** Enums land with no segment lit,
  numbers empty with the counted spread as the placeholder, a timing as an Off│On pair that opens
  its box at what the selection agrees on. The four controls that cannot draw "nothing" — the
  nine controls, the speeds, the three remembers, the three colours — take the resting position
  they draw anyway (all shown, every speed, everything remembered, no colour), and are still
  unanswered until moved. Those two take `compact` and the full row width, as on the page.
- **The strip sits above the scroller and the queue card is sticky.** The strip is the sheet's
  one permanent instrument, and its menu is twenty-one deep — inside the body's scroller it was
  clipped to four options. The card follows the same reasoning at the other end: a list of
  changes you must scroll back up to read is not a check on anything.

**THE PREVIEW GOES, AND THE BYLINE WITH IT (15 Sep, two user calls).** *"Remove the player
preview from appearance."* · *"`Used unless a config overrides it` — remove this byline."*

- **The drawn player is gone.** The stage under Appearance was a frame standing in for the
  video, the logo in its corner, a play button carrying the text colour on the brand, and a bar
  of exactly the controls being served. It was the biggest object on the card, and it was a
  rehearsal of something the publisher's own page will show for real. The one thing it said that
  nothing else does is whether text on brand can be READ — and that is a number, not a picture:
  `Text on brand 5.8:1` stays as a line under the two colours that set it, warned and never
  blocked, and it still follows the colours live while the wheel is dragged (`pgLookSync` /
  `shLookSync`, which replace the two stage syncs). `cfgStageHtml`, `CFG_BAR_RIGHT` and every
  `.cfg-stage*` style are deleted; `cfgIcon` stays, because the nine glyphs still draw the
  controls strip. Appearance is three fields and one check now, in the sheet as on the page, and
  the Appearance & controls column dropped from 549px to 410 — the three columns are 583 / 410 /
  271, the most balanced this card has been.
- **The byline is gone.** `Used unless a config overrides it` stood on every existing surface,
  never varied, and therefore never informed — the word DEFAULT above a list of custom configs
  already says what a default is for. What replaces it is nothing. The line still appears while
  a surface is being MADE, where it carries a fact instead of a definition: `VideoShow preset`,
  or `Copy of “TOI Mweb VideoShow”`.
- Everything else stands: three columns without box, dividers or row rules; every setting
  visible; the default set in place; configs as cards. Nothing moved on the wire or in the store.

Verified: `npm test` 174 passed · `npm run check` syntax ok · headless drive (no `.cfg-stage` in
the DOM anywhere; the contrast line reads 5.8:1 and flips to `1.6:1 · low` in place as a hex is
typed, with the caret kept; an existing key's head is `DEFAULT` alone, a blank one's reads
`DEFAULT · VideoShow preset`; no label clipped) · the snapshot walk: 79 screens, no console
errors.

**THE COLUMNS COME BACK, WITHOUT THE FURNITURE (15 Sep, seventh cut, user call).** *"No no, the
column-like arrangement was better than this for default — please revert back to it, but make it
more breathable and clean, not cluttered, and make it more mature."*

- **What was wrong with the columns was never the arrangement.** It was the FURNITURE around
  them: a tinted box holding all three, a full-height divider between each pair, and a hairline
  over every one of twenty-five rows — a grid of lines, which is what reads as clutter — plus a
  hard bottom edge under the shortest column, which made three columns of honestly different
  lengths look broken rather than finished. This morning's bands fixed the clutter by destroying
  the arrangement; this fixes it by removing the lines.
- **So: no box, no dividers, no row rules.** Each column is its name under a single rule, then
  its settings on a 40px rhythm with every answer on one lane at the column's right edge. The
  gutter is 48px, wide enough that nothing has to be drawn between two columns. Columns end
  where their content ends (Playback 583px, Appearance & controls 549, Measurement 271) and the
  card's own white carries the difference. One rule runs the card's full width — above CUSTOM
  CONFIGS — because that is the one real boundary: what every player gets, then the named
  exceptions.
- **A control wider than the lane stacks instead of squeezing its label.** `Remembers` had been
  ellipsed to `Rememb…` to make room for its three chips: truncating the QUESTION to fit the
  answer is exactly backwards, so `look`, `shown` and `set` controls (`PCD_STACK`) put their
  label above and run the column's width beneath it.
- **Nothing is re-sorted for looks any more.** Each column keeps the catalogue's order — `lead`
  first, then the rest — so Appearance & controls reads again as the sentence it was written to
  be: how many controls at all → what the player LOOKS like → which controls exactly.
- **Everything else stands:** every setting visible with no view switch (15 Sep), the default set
  in place with no modal (14 Sep), custom configs as cards carrying their first four overrides
  (15 Sep), and the names that stuttered — `Appearance & controls`, `Measurement`, `Which
  controls`. Nothing moved on the wire or in the store.

Verified: `npm test` 174 passed · `npm run check` syntax ok · headless drives at 1120, 1440 and
1680px (three columns at the editor's width, two in a narrow pane with Measurement flowing under
Playback; no label clipped anywhere — measured, not eyeballed; Controls → None greys Which
controls, Speeds and Hide controls after in place and the preview draws no bar; a seg and a
control glyph still write and mark) · the snapshot walk: 79 screens, no console errors.

**THREE BANDS, NO SWITCH, AND THE CONFIGS ARE CARDS AGAIN (15 Sep, sixth cut, user call).*
*"Custom config could be cards rather than rows with some 3-4 fields shown upfront in a sleek
manner. And don't you feel the default config feels a bit cluttered — we should remove the
Essentials and All settings switch, and Controls and measurement is sounding odd in the middle."*

- **THE COLUMNS WERE BOTH FAULTS AT ONCE.** Three sections side by side made the look — the one
  section with a preview in it — a wedge in the MIDDLE, left Playback and Measurement half empty
  beside it, and made the card so deep in that one lane that a switch had to exist to cut it
  down. So the columns go: each section is a full-width BAND whose rows run three to a line.
  Playback's fourteen settings are five calm lines, the preview sits in a band where nothing has
  to stand beside it, and Measurement ends the card. The block is 649px with every one of the
  twenty-nine settings on screen — shorter than the switched version's Essentials view was tall
  in its deepest lane, and there is nothing left to switch.
- **The switch is gone.** A control that decides how much of a form you may see is about the UI,
  not about the player; this panel has now removed three of those (the per-section counted doors
  14 Sep, `Essentials│All settings` today). `PG_ALL`, `pgSetAll`, `.pcd-scope` and the reset in
  `views-keys-editor-load.js` went with it. Within a band the essentials still come FIRST — the
  order `lead` has always carried — so the top line of each band is what a surface is really set
  up with, without hiding the rest behind anything.
- **Two names stopped stuttering.** A band headed `Controls & appearance` stood directly above a
  row labelled `Controls`: it is **Appearance & controls** now, and the nine-glyph row is
  **Which controls**. `Analytics & measurement` said one thing twice: it is **Measurement**.
  (Section names ride the change review — `Player · <band>` — so the review reads them too.)
- **Custom configs are CARDS.** A config is picked out of a small set, which is what a card is
  for, and what tells one from another is what it OVERRIDES — so the card is its key, its switch
  and its first four overrides as label/value lines, the rest counted on a fifth with every one
  named on hover (`+2 more`); a config that overrides nothing says `Follows the default in
  everything`. The dashed `+ New config` card returns, standing where the thing it makes will
  appear, and the head keeps only the count. The rows (`.pcr*`) and the head's add button are
  retired.
- **Model unchanged.** Nothing moved on the wire or in the store; the config sheet, the create
  review, the preset stamp and the cohort sheet are untouched.

Verified: `npm test` 174 passed · `npm run check` syntax ok · headless drives (a seg, a switch
and a control glyph each write and mark — `3 changed`, bars on their three rows; Controls → None
greys Speeds, Hide controls after and Which controls in place, each naming its reason, and the
preview draws no bar; the config sheet, the new-config sheet and the blank-create page all draw
the same three bands; at 1120px the bands fall to two columns and the preview's fields fall under
it) · the snapshot walk: 79 screens, no console errors.

**THE DEFAULT LEAVES THE MODAL — IT IS SET WHERE IT IS READ (14 Sep, fifth cut, user call).**
*"Don't want default config to be inside a modal — it should be there upfront present in a clean
and concise way on the integration edit page."* Three cuts circled this one. Cards hid the
default behind a click; the page-drawn form that replaced them showed it as twenty-nine controls
two to a line, which is where "too scrollable" came from; the block of FACTS that replaced THAT
was concise but read-only, so every answer still cost a modal — on the one card whose whole job
is to be set up. The block keeps its shape and gains its controls.

- **Three columns, one per section, each row a label and the control that answers it**, the
  answers right-aligned at the column's edge so they line up down the column. Every control is
  the panel's own, one size smaller (`.pcd-c` cuts the segs, the number boxes, the selects), and
  the two that are taller than a line take the column's whole width: `cfgCtlHtml` gained ONE
  option, `compact`, so the same data operations draw a smaller stage for the look and a STRIP
  OF NINE GLYPHS for the player's controls (lit = the viewer gets it, named on hover) instead of
  the modal's grid of labelled tiles. One renderer still, one vocabulary, two cuts.
- **Writes land in the page's draft**, which is how every other card here already works: `PG_H`
  points the sheet's verbs at `FORM.data.player`, a discrete pick repaints the page and typing
  marks its row and the head's count in place (`pgMark`), the colour pair and the logo sync the
  stage in place (`pgStageSync`) so the picker is never destroyed mid-drag. Save is the gate.
  The change bar marks every row that has moved (seed while creating, last save once it exists —
  `pcMovedAgainst`, the one comparator the create review also reads), the head counts them, and
  a refused value is said in the card's own banner where it was set.
- **`Essentials│All settings` stays on the block head** and a row somebody has moved is never
  hidden by it. Twelve settings on Essentials, the catalogue on All settings, same order as ever.
- **THE MODAL IS NOW THE CONFIG'S ALONE.** A sheet earns its veil when the act is bounded and
  separable — a custom config is named by key, created and dropped whole, and is a handful of
  overrides picked from a list. Setting a surface up is not that act. So `SH` has two modes
  instead of three: every `SH.mode === 'default'` branch is gone, and with it `shOpenDefault`,
  `shSecHtml`, `shAll` / `shSetAll` / `shRowShown` / `SH.all` (the switch went to the page with
  the catalogue it answers for) and `.sh-scope`. `shGoTo` stays — the strip still scrolls to and
  lights the row it just added. The config sheet is otherwise untouched.
- **Model unchanged.** Nothing moved on the wire or in the store; the create review, the
  preset stamp and its confirm, and the cohort sheet all read the same helpers as before.

Verified: `npm test` 174 passed · `npm run check` syntax ok · headless drives on key_1 and both
create paths (a seg, a switch and a control glyph each write and mark — `3 changed`, bars on the
three rows; typing a number keeps the caret and moves the count with it; Controls → None greys
its three dependents in place, each naming its reason, and the stage draws no bar; a refused
Passive volume of 900 comes back as the card's banner; the config sheet still picks, adds, moves
and drops an override; a blank surface's `1 changed` and the create review agree) · the snapshot
walk: 81 screens, no console errors.

**THE DEFAULT IS READ ON THE PAGE, AND A CONFIG IS ITS OVERRIDES (14 Sep, fourth cut, user
call).** *"We need to show the default configuration upfront in a clean and concise manner
without making the page too scrollable but also not cluttering things out, and the new custom
config to be an option where user first selects which field he/she wants to customize from a
drop down of fields and once selected alters its value as the custom config."* Two asks that are
one model — DEFAULT + SPARSE OVERRIDES — drawn as itself at last, on the page and on the sheet.

- **The default is a block of FACTS — not a card, not a form.** The morning's card hid the
  default behind a click (`Used unless a config overrides it` says nothing about WHAT it is);
  the afternoon's page-drawn form showed it as twelve controls two to a line, then twenty-nine —
  a sheet's worth of controls on a page that also has to hold the ad behaviour. A fact is one
  word. The block is the tinted ground the configs sit on, its three columns the sheet's three
  sections: six playback facts, the look on the sheet's own stage at seven tenths with the
  controls under it, three measurement facts. `Essentials│All settings` is the sheet's switch
  brought up to the page (`PG_ALL`, reset per page load), and a fact somebody has moved is never
  hidden by it. Nothing on the block is a control: every fact is a DOOR that opens the default's
  sheet AT that setting (a `more` row brings All settings with it, then scrolls to and lights the
  row), and `Edit` opens it at the top. The same block while creating and once the surface
  exists — only the baseline differs (the seed, then the last save): `DEFAULT · VideoShow
  preset · 1 changed` on a blank surface, the count of unsaved moves on a live one, each moved
  fact wearing the bar. Twelve essentials in six lines; All settings is the playback column's
  fourteen. `Start from` stays in the title row. Superseded: the page-drawn control form
  (`pgPlayerHtml`, `PG_H` and its receiver, gone) and the card grid (`.pc-card`, gone).
- **Custom configs are rows of their overrides.** Key, switch (`OFF` in words), then the
  overrides as facts — `Autoplay Off · Playback mode Passive · Expand MiniTV for ads No` — four,
  then `+N more` with the rest named on hover; none reads `Follows the default`. The sentence
  (`Changes playback`) is gone: a config IS its overrides, so the row says WHICH. `+ New config`
  is the head's button, disabled with its reason at the cap of six.
- **A config's sheet is "pick the setting, then answer it".** `Override a setting` at the top is
  our own select — `selectHtml` gained option GROUPS (`{ group }` rows are headings, not choices)
  and a placeholder (`opts.ph`), both additive — listing every setting the config does not yet
  own, under the three section names. Picking one makes it the config's own AT THE DEFAULT'S
  VALUE (`shAddRow`), lands it lit under its section band, and it stops following from there:
  the row's tail says `same as default` until it is moved, then `DEFAULT On` beside the config's
  own answer — WAS → NOW where the override is made. A `×` on the row (quiet until hover) returns
  it to following (`shDropRow`). The Essentials / All settings switch is the default's sheet's
  alone now; the twenty-nine-row form with receded rows is gone, and the `N own` pips with it.
  `Follow the default for everything` stays in the act row. A NEW config is the same sheet with
  one line under the strip until a setting is picked.
- **The bar means one thing on every sheet: moved since it opened.** On a config every row on
  screen is already its own, so the bar no longer has to double as "is an override".
- **Model unchanged.** Nothing moved on the wire or in the store; the create review
  (`pcMovedFields`, `CFG_SECTIONS`, `cfgFieldLabel`, `pbWord`) and `stampPreset` are untouched.

Verified: `npm test` 174 passed · `npm run check` syntax ok · headless drives on key_1 and a blank
create (a fact opens the sheet at its row, a `more` fact on All settings; Apply lands and the page
counts and bars it; the strip adds Passive volume at 100% `same as default`, Autoplay → Auto reads
`DEFAULT On`, `Apply 2 changes`; Appearance and Player controls as tall override rows; a new
config's empty body; Start from asks over a change) · the snapshot walk: 83 screens, no console
errors (five new — the page on All settings, the sheet at a row, the pick, the added row, the
dropped row).

**THE DEFAULT PLAYER IS THE PAGE WHILE THE SURFACE IS BEING MADE, AND THE CARD IS PLAYER
BEHAVIOUR (14 Sep, user call).** *"What is this preset here in the new integration? Also, in the
new integration can we show the default player config fields upfront in a clean manner for the
user to configure. Also rename player config to player behaviour."* Three asks, one page.

- **The default's settings are drawn on the New integration page.** Creating is the one moment
  somebody decides the whole player, so the Player behaviour card IS the form there: the three
  sections as quiet bands, their essential rows two to a line (twelve essentials in six lines; the
  preview and the controls grid take the whole width), every control the sheet draws, writing
  straight into the page's draft — Create is the gate, the way the rest of the page already works.
  The card's head keeps the sheet's one view switch, Essentials / All settings, and a row somebody
  has moved is never hidden by it. A row wears the change bar when it no longer reads as the seed
  does, and the head counts them (`4 changed`, every field named on hover). Custom configs are the
  card's last band, over the same card grid as before. Once the surface EXISTS the default goes
  back to being a card that opens a transaction — a targeted edit with a way back — because the
  question changes from "set this up" to "change this one thing". The morning's Default-card seed
  line and count are superseded by this; the create review and the restamp confirm are unchanged.
- **`pgPlayerHtml` is the sheet's rows with a page receiver.** `cfgCtlHtml` gained its fourth
  receiver, `PG_H`: discrete picks repaint the page, typing marks its row and the head's count in
  place (`pgMark`), the colour pair and the logo sync the preview in place (`pgStageSync`) — the
  sheet's own rules, pointed at `FORM.data.player`. `PG_ALL` is the page's one piece of view
  state and a fresh page opens on Essentials. Nothing moved on the wire or in the store.
- **What the preset is, in one line on the page.** A blank surface's default player is a photocopy
  of one of three starting shapes the mock world seeds (MiniTV · ArticleShow · VideoShow). The
  head's strip says so in the words that answer the question — `START FROM · [VideoShow ▾]` — and
  it exists only while creating blank; a copy is seeded by its source, and an existing surface has
  no preset left to pick. A preset stamps, it never links (unchanged since 3 Sep).
- **Player config → Player behaviour.** The card, the default card's hover, and the two server
  messages that named the card (`keys.js`, `ladders.js`; the pinned test moved with them).
  The named forks stay **configs** — the word a player asks for one by, and the wire's own — and
  the chooser's card fact reads `2 custom configs`. The create review's seed row is `Starts from
  → VideoShow preset`.

Verified: `npm test` 174 passed · `npm run check` syntax ok · headless drives on both create
paths (a seg pick marks its row and counts; typing a number keeps the caret and marks in place; a
control tile, a typed hex and the preview all move together; All settings shows 24 rows, Essentials
12, a moved `more` row stays; Start from asks over changes and restamps quietly over none; the
review reads `Starts from → MiniTV preset` plus two moves; a copy draws the same rows with no
Start from; an existing integration keeps its cards) · the snapshot walk, with three new screens.

**A NEW INTEGRATION'S DEFAULT PLAYER SAYS WHERE IT STARTED (14 Sep, user call).** *"Accommodate
this default player config when user creates a new integration in a clean and intuitive and
mature way."* A blank integration's default player has always been a photocopy of one of three
starting shapes (MiniTV · ArticleShow · VideoShow), but the page hid the fact four ways: the
select that picked the shape sat in DETAILS between Platform and Domains — an identity row
deciding a player fact, two cards away from the card it decided; the Default card said the same
sentence on a fresh surface as on a live one, and an edit landed from its sheet left no trace on
it; picking another preset silently threw that edit away; and the create review copied the preset
out as twenty-eight rows, under which the one setting somebody had actually decided was
indistinguishable from the twenty-seven nobody typed.

- **The preset rides the card it seeds.** It is the Player config card's title-row strip now —
  `PRESET · [VideoShow ▾]` — the grammar the Ad behaviour card below already uses for its ad
  setup (eyebrow, then the decision as a control), so the two cards' heads read alike. It exists
  only while creating BLANK: a copy is seeded by its source, and an existing surface has no
  preset left to pick — a preset stamps, it never links (unchanged). Details is identity again.
- **The Default card names its seed and counts what moved.** `VideoShow preset` on a blank
  surface, `Copy of “TOI Mweb VideoShow”` on a photocopy; once the sheet has landed a change,
  `· 2 changed` in the change amber with every field named on hover, and the card wears the
  panel's change bar — the same mark the sheet head uses, measured against the only baseline a
  surface that does not exist yet has. Lists compare as sets (the controls grid toggles
  membership; a different order is not a different answer). On an existing surface the card is
  untouched: its baseline is the last save.
- **Re-picking a preset asks first when it would discard work** — `Start from MiniTV instead?`
  / `Your 2 changes to the default are replaced by MiniTV's settings.` / `Start from MiniTV`.
  A No paints the shape still standing back into the select; an untouched default restamps
  quietly; the same preset over no changes does nothing. The seed moves with the stamp.
- **The create review reads the seed, then only what moved.** One `PLAYER` section:
  `Default config — → MiniTV preset`, then each moved setting as WAS → NOW against the seed
  (`Autoplay · Auto → On`) under the card's own section words and in the sheet's own labels.
  A copy's seed is already its `Copied from` line, so only its moves are listed. This
  supersedes the 11 Sep "player, section by section" birth certificate: that list was chosen
  when the review could not name the preset; naming it makes the twenty-five copied rows noise.
- **Model unchanged.** `playerSeed` and `presetName` are page facts, never payload fields;
  nothing on the wire or in the store moved. `npm test` 174 passed.

**THE TWO COHORT SHEETS ARE ONE SCREEN, LEARNT ONCE (14 Sep, third cut, user call).** *"Can we
have them the same way as the change ad behaviour pending changes on the right side section — I
think the pending changes can be renamed to something clear and communicative, easy to
understand. Also don't show the values as set up … that are not needed."*

- **Player behaviour takes the ad sheet's anatomy**: levers on the left, the queue card on the
  right, the same 860 frame, the same three-state row (closed → open → queued). Two cohort acts
  that looked like two different products are now one screen with two contents.
- **`Pending changes` → `CHANGES TO APPLY`** (user's pick), and the card is a shared component —
  `changesCardHtml(rows, opts)` in `controls.js` — rather than the same markup written twice. The
  ad sheet's version became six lines of mapping.
- **A ROW AT REST PRINTS A VALUE ONLY WHEN THERE IS ONE.** "as set up" is the ABSENCE of an
  answer on this surface, not an answer, and four rows of it down one column is a phrase
  repeating "nothing here" — so the row prints nothing and the eye goes to `Special · on`, which
  is real. A mixed spread still names it, because there some surfaces have dissented and some
  have not. The queue card is untouched: there "as set up" is the from-side of a change, and the
  answer to *what is this replacing*.
- **A queued row stops saying it twice.** Its from → to is on the card a hand's width away; the
  row's own "was …" tail said the same thing in a second vocabulary. Gone. An UNSET open row
  keeps today's value, because there is nothing on the card yet for it to repeat.
- **One measured frame per journey, as the 8 Sep rule asks.** Player behaviour: 341px at rest,
  355 with every lever open, 369 for its review — `--frame: 369px` on both steps. Four or five
  queued changes grow the card past it and the sheet grows with them: a floor is worth 28px of
  air, not the 114 that matching the tallest possible state would cost.

**ONE SWITCH INSTEAD OF THREE DOORS · THE ACT ROW BECOMES THE JOURNEY · THE CARDS LOSE THEIR
COUNTS (14 Sep, third cut, user call).** *"The more-settings UX/UI is totally non-intuitive,
think of something else. The cards are sounding a bit odd now — can we mature it, and what is
this count in them? That's totally not needed and is making the user confused. Also when a user
changes anything there is no clear journey; currently there is only a Done button
irrespective."*

- **`7 more playback settings` is gone, and so are its two siblings.** Three counted links were
  wrong three ways at once: they looked like FOOTNOTES at the bottom of a list rather than
  containers holding a third of the form; they made you carry a per-section open/shut state
  across a scroll; and they asked you to care about a split that is ours, not yours — nobody
  arrives wanting "the other seven playback settings", they arrive wanting one named setting,
  and a door that counts what it hides cannot tell you whether yours is behind it. The question
  under all three is ONE question — *am I setting this surface up, or looking for something
  specific?* — so it is now one `Essentials │ All settings` seg in the sheet's head, where
  sheet-wide controls belong. No per-section state, no counts to decode, and the sticky section
  bands are the body's only structure. **A row this config has answered is never hidden on
  either side of the switch** — a deliberate answer may not sit behind a control somebody has
  to find first.
- **The act row states its position.** One button that reads the same whether you have moved
  nothing or nine things is a lid, not a decision — and a Cancel standing beside it on an
  untouched sheet is an offer to undo nothing. Now: nothing moved → one way out, **`Close`**;
  something moved → **`Cancel`** + **`Apply 2 changes`**, the count on the button that lands
  it; a new config → always the pair, `Create config`. The `2 changed` pill that briefly sat in
  the head is gone with it — the foot is always in view, so the count is told once.
- **The cards' counts are gone.** `Playback 2 · Controls 1` is a number with an invisible
  denominator — two out of what? — so it reads as a score, and a score invites comparing cards
  that are not in competition. A card is picked, not measured: it says what KIND of thing it is
  in words (`Changes playback and controls`, `Follows the default`, and on the default `Used
  unless a config overrides it`), with the exact fields still on hover. `OFF` stays, because
  "is this one live" is the first thing a list of configs is scanned for.

Verified: `npm test` 174 passed / 0 failed · `npm run ui:snapshot` 74 screens, no console
errors · field audit 29/29 reachable, 28 rendering (Redirect URL conditional by design) ·
headless drives — Essentials shows 12 rows and All settings 24; a config's override that lives
in `more` (Expand MiniTV for ads) shows in Essentials as designed; the act row walks
`Close` → `Cancel` + `Apply 1 change` → `Apply 2 changes`, and Cancel leaves `FORM.data.player`
untouched.

**THE PLAYER SHEET BECOMES A TRANSACTION, AND THE DEFAULT ANSWERS BACK (14 Sep, user call).**
*"The modal has no cancel button, only Done — what if I change something? Plus I'm unable to
change anything in the default config. Please relook at the complete UX journey and fill in
the gaps from the lens of a senior product designer."* Those are one fault seen from two
sides. The sheet wrote every answer straight into the page's draft, so there was no way back
short of undoing each move by hand — and on the DEFAULT, where no row can ever be an
"override", nothing on screen acknowledged an answer at all: no bar, no count, no way back,
one button. A sheet that was in fact writing every keystroke read as one that could not be
written to.

- **A working copy, Done and Cancel.** Opening a card clones what it edits. Done lands it on
  the page's draft, Cancel drops it, and Escape or the veil ask first — and only when there is
  something to lose. Save and Publish are still the only gates to the wire.
- **Every moved row wears the amber bar, in every mode**, and the head counts them
  (`2 changed`). On a config the bar still means "an override"; on the default it means "you
  moved this and have not landed it" — one mark, one colour, measured against the only
  baseline each mode has.
- **Section headers are a different register, and they stick.** A 13px bold `h4` two pixels
  above a 12.5px row label is not a header, it is a heavier row. Uppercase and tracked on a
  tinted full-bleed band now — the page's own PLACEMENTS voice — pinned to the top of the
  scrolling body, so the group you are in names itself the whole time you are in it. Opening a
  counted door scrolls its first row CLEAR of the band (`scroll-margin-top`) and hands it the
  cursor.
- **`Every player on this surface, unless it asks for a config by key` is gone**, as asked.
  The card said it, the title said it, and then a sentence said it again before a single
  setting appeared. Only the two lines that carry FACTS remain (how much of a config is its
  own; the rule a new key must pass).

**CONTROLS & APPEARANCE, THIRD CUT — A CHECKED GRID (14 Sep, same call).** *"The controls and
appearance still won't look mature and clean and sleek and intuitive."* The cut before this
got the POLARITY right (a lit chip means the viewer GETS the control) and the form wrong: nine
pills of nine different widths wrapping raggedly across two lines, the off ones dashed and
struck through. Ragged is why it read as dry — there is no column to scan, the eye re-measures
every item, and strike-through is a proofreading mark, not a state.

- **A grid of equal tiles, three to a line** — one glyph column, one label, one state — so
  nine controls read as nine ROWS of a checklist. On is a filled tick and full ink; off is an
  empty ring and receded ink. The 210px column floor is measured, not guessed: at the sheet's
  806px it resolves to exactly three columns, so nine controls land as a 3×3 block instead of
  4/4/1 with a lone orphan.
- **The preview and the grid take the whole width.** A control taller than its label is not a
  value in a column — squeezed into the 200px-indented value column both wrapped into rags.
  The preview is 300×169 now, big enough that the control bar inside it is legible while it is
  being changed.
- **The section reads as one sentence**: how many controls at all → what the player looks like
  → which controls exactly, with the preview between the two so every answer under it is
  visible the moment it is given.

**THE CARDS LOSE THE FACT DUMP (14 Sep, same call).** *"I don't find any value in showing those
4 rows, autoplay, passive volume etc — remove them, make the cards more clean and sleek, and
add some other meta which could be relevant for the user to see at first glance."* Four raw
lever values were a card answering a question nobody asks a LIST: nobody picks between configs
by comparing their passive volume, and four identical labels repeated down a row of cards read
as a table that had lost its header.

- **One meta line, the only thing that card can say.** A custom config shows WHERE its
  overrides land — `Playback 2 · Controls 1`, counted pips, every field named on hover. The
  default shows how many configs build on it, which is the blast radius of opening the thing
  every player falls back to.
- **`OFF` in words** beside a switched-off config's switch: a dimmed toggle is easy to miss
  across six cards, and "is this one live" is the first thing a list of them is scanned for.

Verified: `npm test` 174 passed / 0 failed · `npm run ui:snapshot` 74 screens, no console
errors · field audit 29/29 reachable, 28 rendering (Redirect URL conditional by design), all
25 wire keys present · headless drives on the transaction (change → `1 changed` + bar, live
data untouched; Cancel restores; Done lands; Escape-with-changes asks and a No returns the
sheet intact), on the control grid (9 lit → hiding two gives 7 lit, `7 of 9 controls shown`,
two icons fewer in the preview bar, stored `["share","quality"]`), on Controls: None (no bar
drawn, nine tiles disabled) and on both counted doors landing clear of the sticky band.

**ONE PLAYER ACT ON THE BULK BAR — FIVE ROWS, FLAT (14 Sep, second cut, user call).**
*"Let's drop Change default player behaviour, Custom player behaviour, and have a Player
behaviour which will have options to control a few fields that are Autoplay, Passive Volume,
Playback Mode, Loop, Expand MiniTV for ads."* The morning's cut sorted all twenty-nine player
settings into a front row, a counted door and a refusal list. The answer is simpler than the
sort: a cohort act is for the handful of things a team really does decide for a whole estate
at once, and everything else belongs to the surface that owns it — where the integration page
already draws the whole catalogue, default and custom configs alike, with a working copy,
Cancel and Done.

- **Two acts on the bar, not three** — `Ad behaviour` and `Player behaviour`.
- **Five rows, flat.** Autoplay · Passive volume · Playback mode · Loop · Expand MiniTV for
  ads. No fold to open, and no section headings: they are all Playback facts, and one list of
  five is not three groups of two.
- **The master-detail sheet is deleted** — the rail, the per-config folds, the 529px frame
  and ~110 lines of CSS with it. Walking every custom config of every selected surface from a
  cohort bar was capability nobody asked for, standing where the one simple act should be.
- **The seam stays wider than the sheet, on purpose.** `BULK_PLAYER_FIELDS` still accepts the
  whole player behaviour card, and the four a single surface owns are still refused BY NAME
  (`BULK_NEVER_FIELDS`, carried on `/panel/meta`, pinned by a test). A sixth row is a line of
  code rather than a release, and a wrong blanket write is refused whatever draws it.
- **What the sheet keeps:** opening a row never queues it (a number seeds from the selection
  when it agrees, from the field's default when it does not — counted, never a suggestion),
  the row says what it is replacing, × leaves the field alone, and Apply still ends on THE
  CHANGE REVIEW.

**A COHORT SHORTLIST — WHAT A BULK CHANGE MAY ANSWER, AND WHAT ONE SURFACE OWNS (14 Sep,
user call).** *"Can we define which fields are relevant for the bulk changes that the team may
want to do across integrations and only give those options upfront."* The curation already
existed and was the wrong one: the Default-player sheet offered **six** fields, the seam
accepted **twenty-seven**, and the six were never chosen for a cohort at all — they were the
six a fork could carry under the 11 Sep rule, which was reversed on 13 Sep while the cap
stayed behind.

- **Two questions decide a field's tier, in order.** *Would a team ever answer this the same
  way for many surfaces?* No → one surface owns it, and a blanket write is not blunt but
  wrong. *Would a wrong blanket answer show itself?* Yes → the front row; no → behind the
  counted door. The second question does the work and was already the panel's rule:
  measurement is "the one group where a wrong answer is otherwise invisible".
- **The front row is seven rows** — Autoplay, Passive volume, Starts muted, End screen,
  Controls, Appearance (the three look fields on their one preview stage) and Events
  reported. These are the occasions a player-ops room has: a brand refresh, a sound policy,
  a controls lockdown, a reporting level, every one of them visible at the next page load.
- **Fourteen rows behind the door**, named after their own section as everywhere else. The
  three vendor ids and the two timings live there — not because stamping a Nielsen id across
  an estate is rare, but because a mistake costs a month before anyone sees it, and the fold
  says so in a line above them.
- **Four are never offered** — Player type, Redirect URL, Quality, Fallback media — refused
  BY NAME at the seam (and the seam's list, with the sentence the row prints, now travels on
  `/panel/meta` so the screen cannot spell it differently) and drawn greyed IN PLACE, so
  "why can't I set the fallback video for all of them?" is answered where it is asked.
- **The other sheet went the opposite way.** Custom player behaviour edits one surface at a
  time, so it has no cohort argument to make: it now draws the integration page's own form —
  every field, its sections, its counted doors, its follow-the-default grammar — and the
  six-field cap is gone. A fork could carry a logo that sheet could not show it.
- **One control renderer, three receivers.** `shCtl` became `cfgCtlHtml(r, def, eff, na, h)`,
  `h` being the receiver: one verb per way a control is written to. The page's sheet passes
  `SH_H` and did not move a byte; the two bulk sheets pass their own, which is how they can
  draw colours, chips, timings and text at all, having only ever drawn segments.
- **Opening a row never queues one.** A segment can say "nothing chosen"; a number, a timing
  and a colour cannot, so those are seeded — from what the cohort holds when it agrees, from
  the field's own default when it does not. Counted, never a suggestion.
- **A kicker that had stopped being true.** "Custom configs keep their own values" predates
  sparse forks: a config stores only its dissent and resolves the rest live, so a blanket
  write DOES move every fork that never spoke about that field. It now says "custom configs
  follow unless they overrode it".

**THE PLAYER CONFIG GRID — VALUES AT REST, A COLUMN PER CONFIG (13 Sep, third cut, user
call).** *"Improve the UI/UX of the default config, make it less cluttered and more intuitive —
think from first principles of design, how does a user think, show user empathy … can we make the
controls more fluid like how it's done in Google Docs or Sheets … the custom config is sounding
disjointed from the default; the understanding is not clearly communicated."* Three findings,
one answer.

- **Reading comes before editing.** A PM opens this card to CHECK far more often than to change,
  and the fold drew twenty-nine controls that each had to be decoded — which option is lit, is
  that switch on. A word is simply read. So a cell is its VALUE at rest and becomes its control
  only when clicked: a menu for a choice, a typeable box for a number or a text, chips for a set,
  the OS colour wheel plus a hex for a colour. The one widget drawn at rest is a switch, because a
  switch is its own value. Enter commits, Escape reverts (from a snapshot taken when the cell
  opened), Tab steps, arrows move, typing on a focused cell starts editing — a spreadsheet's
  grammar, which nobody has to learn.
- **A custom config is the same settings with a few cells different — so it is a COLUMN.** The
  morning's cut said that one idea in three languages (a card, a chip row, a modal) and left the
  reader to connect them; that is the "disjointed" the user named. Now: one grid, rows are
  settings, the first column is the Default, each config is a column beside it. A config's cell
  that follows the default is faded read-through; a cell it sets is full weight in the accent's
  ink with × to let go. Nothing else says "override" — the contrast IS the concept. Two cards
  became one, the modal editor is gone, and the lede is one sentence because the columns carry
  the rest.
- **The closed row keeps the columns real.** Each section at rest shows the default's four
  headline facts in its column (four, so the row stays one line beside two configs) and, per
  config, `3 differ` or `same` — "how is shorts different" is one look before any fold opens. The
  header row (Default · shorts · amp_stories) sticks under the page's fixed header while the card
  is in view: a sheet's frozen row, for the same reason.
- **Every keystroke writes the model** — the panel's standing rule — so closing an editor is only
  a repaint and nothing is lost whichever way it closes: Enter, Tab, a click elsewhere, or a
  repaint another control caused. The card lets a stale editor go when it draws (`playerCardHtml`
  nulls `PG_EDIT`), which is what makes click-away safe without a mousedown dance. The colour
  picker's `input` stream still updates in place and never repaints — the 13 Sep fix, kept.
- **What did not change:** the model (default + sparse overrides, resolved live at the wire), the
  seam, the wire, the change review and the version rail. `pbWord` still spells every value once
  for the cell, the bulk sheet and the review.
- **Retired:** `.pblk-*` (the folded card), `.pce-*` (the modal editor), the `.pcfg-*` rows (the
  templates table keeps `.pcfg-acts` / `.pcc-*`), and the `PCE` indirection — one renderer,
  `pgCellHtml`, draws the default's cell and a config's cell from the column it is given.
- **ONE CONFIG AT A TIME (14 Sep, user call — *"what if I want to see only a single player
  config, currently I have no option to do that"*).** At the six-config maximum the grid is eight
  columns wide and most work is done in ONE config, so a column can be FOCUSED: the others are not
  drawn and the two that remain take the whole card. The door is the count the closed section row
  already shows — `3 differ` answers "how is shorts different" by showing shorts beside the
  default with that section open — and the column's ⋯ names the same act in words. THE DEFAULT
  NEVER LEAVES: a config is its differences from the default, and a column of overrides with
  nothing to differ from says nothing. The way back is counted (`‹ All 6 configs`) and stands in
  the header's own leading cell, the row that names the columns being where "which columns"
  belongs; nothing narrates that one config is showing, because the header already shows it.
  Escape unwinds the narrowest thing first — open cell, open section, focused column.
- **THE CONTROLS ARE ASKED THE RIGHT WAY UP, AND DRAWN (14 Sep, user call — *"controls and
appearance can be treated in a more clean, intuitive and sleek way; the hide controls options
look too dry and it is not intuitive"*).**

- **A lit chip meant the control was GONE.** The field is `hideControls`, so the row inherited
  the wire's polarity and a person had to invert it in their head on every glance. It is asked
  as `Player controls` now, lit when the viewer GETS it, struck through and dashed when it does
  not, with `7 of 9 shown` counted underneath. The store and the wire are untouched: the
  inversion lives at one seam, and since toggling a member is the same operation either way up,
  it rides the existing `chip` verb and works in all three sheets.
- **Nine identical word-chips were the dry part.** A player's controls are things a viewer SEES,
  so each one now carries its own line glyph — play, progress, volume, fullscreen, HD, captions,
  speed, picture-in-picture, share — drawn once and used in both places they appear.
- **The preview became the section's answer.** The stage already held the logo and the colour
  pair; it now also draws the CONTROL BAR that will actually be served, so hiding a control is
  visible the instant it is hidden. The brand colour moved to the centre play button with the
  text colour on it — the exact pair the contrast line measures — and `Controls: None` draws no
  bar at all, which is the honest preview of that answer.
- **The disclosure was lying about what it held.** With the controls promoted into the section's
  lead, the two rows left behind it are Speeds and Hide-controls-after — control settings, not
  appearance ones — so the door says `2 more control settings`.
- **Merged cleanly with a peer session's refactor found mid-pass:** `shCtl` had been generalised
  into `cfgCtlHtml(r, def, eff, na, h)` with a per-sheet receiver, so the two new kinds were
  rewired to the shared verbs rather than left pointing at this page's own draft.

**ONE RESET, THE APP'S OWN CHANGE BAR, AND A DISCLOSURE THAT TAKES YOU THERE (14 Sep, user
call).** *"We don't need follow default at each line, we can have one global reset button. Also
the change state is different from how we do on the ad setup — the brown subtle bar, use that
only. And clicking on more settings should take the scroll and cursor to the required
destination; currently it scrolls to the top, which is too confusing."* Plus, mid-pass:
*"brand colour, text colour and logo can be shown as a preview in a single view."*

- **The per-row way back is one button.** `Follow default` stood in a third column on
  twenty-nine rows to serve the few that ever needed it. It is now `Follow the default for
  everything` in the act row, counted, asked first, and dead while there is nothing to undo —
  and every row is two columns. The confirm takes the dialog root for a moment (every dialog
  here shares one), so the sheet is drawn again on the way out whichever way it was answered,
  and Escape is guarded to belong to whichever dialog is actually on screen.
- **An override wears the app's own change bar.** 2px of amber, out of flow, exactly as this
  panel marks anything that has been moved — replacing a blue rule AND a blue bold label, two
  more signals for one state. The scrolling box now reaches 10px further left than its content
  so the bar has a gutter instead of being clipped away by the scroller.
- **A repaint no longer loses your place.** The sheet redraws as one block, so `shRender`
  carries the body's scroll position across by hand. Without it, *choosing an option* halfway
  down threw you back to the title — the same defect that made `more` feel like a jump to the
  top. Opening a disclosure now also brings the first setting it revealed into view and gives
  it the cursor.
- **A section that opened itself could not be closed** — a real bug, found while fixing the
  above. `open` was a Set, which cannot say "closed on purpose", so a config whose override
  lived under `more` was stuck open. It is a Map of explicit decisions now.
- **THE LOOK IS ONE ROW WITH A STAGE.** A hex beside a hex beside a URL tells nobody what a
  player will look like. One frame does: the logo where it will sit, a progress bar in the
  brand colour, a button carrying the text colour ON the brand — the pair the contrast rule is
  about — with the ratio under it, amber below 3:1. The three fields sit beside it, and the
  stage follows every `input` the colour wheel fires, in place, because a repaint there would
  destroy the input the picker is anchored to and shut it mid-drag.

**SLEEKER CARDS, A SHEET THAT SAYS EACH THING ONCE (14 Sep, user call — *"the cards can be
more sleek and more mature; the modal still feels cluttered and disjointed"*).** Every cut here
is a deletion, and each one removes a repetition rather than a fact.

- **The cards lost their eyebrow.** `CUSTOM CONFIG` stood over every custom card, which is a
  label that never varies and therefore never informs; the name and the card's own ground say
  which kind it is. The name moved up to the first line beside the switch, the long sentence
  under it became two or three words (`Every player on this surface` · `3 overrides` ·
  `Follows the default`), and every card now carries FOUR facts, so a row of them is even
  instead of six-against-three.
- **The sheet's head was one idea said three times** — `DEFAULT PLAYER CONFIG` over
  `Every player` over a sentence beginning *"what this surface serves"*. The eyebrow is gone.
  What is left is a title and ONE line: what this is for, what it has taken over, or the rule
  a new key must pass — and a refusal REPLACES that line, so the head never grows a third.
- **The sheet opens with the name that was clicked.** The card said `Default` and the sheet
  said `Every player`; a title that renames itself between the two is two objects, not one.
- **The section hints went.** *"How the video plays"* under `Playback` is a gloss on a word
  that does not need one, three times down one sheet.
- **THE WORD `default` DOWN TWENTY ROWS WAS THE CLUTTER.** A receded row already IS the
  default's answer, and the line under the title says so once. The tail column now carries
  only `Follow default` — the one thing in it that is an action — and the default's own sheet
  has no third column at all.
- **The `more` doors are ink, not accent.** Three blue links down one sheet read as three
  invitations; they are a way to see the rest, and they go accent on hover like any link here.
- **Verified, not asserted:** a probe walks the server's own `PLAYER_FIELDS` against the
  sheet's sections and against what actually renders. 29 of 29 reachable, no duplicates, no
  orphans, every one with a definition; 28 render on a normal integration and the 29th
  (`redirectUrl`) appears only for an Inline + redirect player, by design. The live document
  still carries all 25 of the player team's keys in their five namespaces.

**CARDS AND THREE LEVELS — THE PLAYER CONFIG, RE-CUT (14 Sep, user call).** *"Let's not have
this column-like approach; clean cards, clicking on which opens the preview … limited fields
upfront, then at level 2 we have some fields, and so on, so that we are not bombarded with too
many fields upfront. Also the modal needs to be redesigned in a mature way."*

- **The two surfaces before this failed the same way from opposite ends.** The folded card put
  eight groups of CONTROLS on the page; the comparison grid put every config on screen at once
  in columns. Both answered "show me everything" when the question a person actually arrives
  with is *which config, and what does it do*. Three levels answer that one.
- **LEVEL 1 — CARDS.** The default first, then one per config, then the card that makes
  another. A card is identity and a few facts: on the default what a player gets, on a config
  WHAT IT OVERRIDES. Nothing on a card is a control except the switch, which is state, and the
  ⋯ that holds the rare acts. Four across at the editor's width, so the default and all six
  configs are two calm rows and nothing scrolls sideways.
- **LEVEL 2 — THE SHEET.** Clicking a card opens it: the three sections, each showing the
  handful of settings a surface is actually set up with (6 · 4 · 3 rows). **LEVEL 3 — MORE**,
  counted on its own door ("7 more playback settings"), opening in place — never a second
  dialog and never a tab. A section whose `more` holds an override opens ITSELF, because a
  setting somebody deliberately chose may never sit behind a disclosure. On the DEFAULT
  nothing opens itself, since "set" has no meaning there and level 3 would collapse into
  level 2 — which it did, and the walk caught it.
- **ONE SHEET, THREE MODES** — default, existing config, new — so the "mature, enterprise"
  modal is not a fourth thing to learn: it is the same sheet with the key where the title goes.
  The first two write straight to the page draft and close with Done; a NEW config is the one
  genuinely modal act and alone carries Cancel and Create.
- **The title is its own rename field** (the shape the ad setup's placement tabs already use),
  restoring the rename the grid's column head used to own. Done will not close over a key the
  server would refuse — a sheet that closes hides the problem — and the pre-save guard now
  reads the three key rules straight off the data rather than a `PC_BAD` map that the walk
  caught dangling after the rewrite.
- **Retired:** the whole `.pg-*` grid and its spreadsheet machinery (cell editing, popovers,
  Tab/arrow walking, column focus `PG_ONLY`, the sticky header band) and the `.ncf-*` create
  form. What survived is what was never about layout: `cfgDefs()` — one description of every
  field, read by the cards, the sheet and the change review alike — `pbWord`, the colour pair
  with its contrast preview, and the sparse-override model underneath, which has not moved.

**CREATING A CONFIG IS A FORM, IN A MODAL (14 Sep, user call — *"let's open the fields in a
  clean form in a modal while creating a custom config"*).** Creating and editing want different
  surfaces, and collapsing them was the mistake. EDITING is a hundred small corrections against
  what the other columns say — the grid's whole job. CREATING is one deliberate act with nothing
  to compare against yet, so a new column of faded inherited values gave a person nothing to work
  with; and it is the one genuinely modal moment, because the config does not exist until it is
  named. The `+` no longer pushes a half-born unnamed column the server would refuse — which is
  why the add button had to disable itself, why callers had to know about a column "waiting for
  its key", and why `pcAdd` / `pcFocusEmpty` / `pcSyncAdd` / `.wants` existed. All four are gone.
- **The form is a LEFT RAIL AND A PANE** — the ad setup's own shape for "one subject at a time",
  so twenty-nine fields are never twenty-nine fields on screen. The rail counts what has been
  changed in the sections you are not looking at, so nothing hides behind a tab. Every row starts
  at the default's answer RECEDED with `default` beside it — the grid's own faded-means-inherited
  language, taught at the moment a person first meets the model — and touching one makes it this
  config's own (accent rule, `Follow default` back). The foot counts the whole form. One control
  renderer reads the SAME `pgDefs()` the grid reads, so the two surfaces cannot drift on a
  vocabulary, a default or a refusal.
- **The key is refused in place**, by `pcKeyWhy`, the same three rules the server holds it to, with
  what was typed still in the field. An empty key is now one of them (it could only ever have been
  a transient birth state, and births no longer happen on the page). The veil closes an untouched
  form and is ignored once there is work in it, so a stray click cannot cost a filled-in form;
  Escape and Cancel always close, and Escape reaches the form before the grid's own stack.
- **THE CARD EXPLAINS ITSELF, SO THE PARAGRAPH ABOVE IT IS GONE (14 Sep, user call —
  *"remove this byline"*, and *"make it feel like an enterprise platform"*).** The lede said
  *"a custom config changes only the cells you set — faded cells follow the default"*, which is
  a card asking to be read before it can be used. The words moved into the STRUCTURE, where they
  survive a reader who does not read: the header band is now a TABLE HEAD of two lines — the
  column's NAME (`Default`, or the key, typeable in place) over its STATE against the default
  beside it, counted (`every player` · `3 overrides` · `follows default`), with the switch and
  the ⋯ on the state line. One sentence deleted, the same idea said by the thing itself.
- **The add is a COLUMN.** `+ Add config` left the card's title row for a `+` at the end of the
  header row — the panel's own rule for an add (it lives where the thing it makes will appear),
  applied to a grid whose new thing is a column. Its refusals ride its hover, as everywhere.
- **One word for one concept: OVERRIDE.** A section's per-config count read `3 differ` while the
  model, the menu and the review all said override; it reads `3 overrides` now (and `1 override`,
  which also fixes the `1 differs` the old wording produced).
- **A column boundary at its faintest, and a header that is a header.** Six columns of the word
  "same" with nothing between them read as scattered text, so each column edge from the first
  config on carries a hairline, drawn in the GAP so it changes no size and follows no radius; the
  header band takes its own quiet ground and a rule under it. With no config beside it the
  default's column is capped rather than stretched — a lone value column spread over the whole
  card strands its values from their labels.
- **The switch moved to the state line for a measured reason:** on the name line it held 34px of
  a 98px column at the six-config maximum, and the KEY — the column's whole identity — clipped to
  five characters. Both head lines are capped to the key's own measure, so in a focused column
  270px wide the key, its state and its switch stay one object instead of drifting apart.
- **`PG_ONLY` holds the config OBJECT, never an index**, so a removal or a reorder can never leave
  the view pointing at the wrong column: if the object is gone the focus is gone, healed in
  `pgCols()`. Cell ids stay TRUE indices, so hiding a column changes what is drawn and nothing
  about what a cell addresses. Adding a config clears the focus, or the column just made would be
  the one column not drawn.
- **Two defects found while testing it, both fixed.** The whole `N differ` CELL was the door, so a
  click aimed at the section row landed on a column focus — the door is the WORDS now, and the
  cell belongs to the row. And at six configs the grid was 9px wider than its card (29px at
  1280): the column head's ⋯ was holding 34px of a 103px column, so it now rides above the head's
  right edge over a short fade instead of sitting in its flow. Measured 0px overflow at both
  widths; the page itself never scrolled sideways.

**DEFAULT + SPARSE OVERRIDES — A CUSTOM CONFIG MAY OVERRIDE ANYTHING, AND SAYS SO (13 Sep, user
call).** *"We need a concept wherein we have default values configured for all these keys as the
default config, and further the option to create custom config using all these fields as well —
maybe in a form opened in a modal."* Three asks answered together: the model, the editor, and a
broken colour picker.

- **The model reverses two of this panel's own rules, on the user's call.** The 11 Sep six-field
  fork rule and the 7 Sep "one Passive volume" refusal are gone: a custom config may override ANY
  of the player's 29 fields. What replaced the refusal list is not permission — it is **sparseness
  and visibility**. A config carries ONLY what it overrides (`{ id, name, on, ...overrides }`),
  inherits the rest LIVE (resolved at the wire boundary, so moving a lever on the default moves
  every config that never spoke about it — the Q12 the 11 Sep cut left open, answered yes), and
  every override is named at three altitudes: a chip on its row, an accent rule in its editor, a
  line in the change review. Measurement may be overridden; the review is where that is caught.
- **One normalizer, no second copy.** A config's overrides are laid over the default and the whole
  is run through `normalizePlayer`; only the override keys are kept. So a config obeys every rule the
  default does — hex colours, the visibility floor, the control vocabulary — with nothing to drift.
  What was sent is what is held: an override equal to today's default is still an override, because
  it says "stay here when the default moves", and equality would erase that intent. `startVolume`
  is the one key still refused by name (a payload built against a dead contract).
- **On the wire a config is WHOLE, in the root's own shape.** `playerConfigs[i]` is now
  `{ name, player, pref, playback, theme, controls, analytics }` — the default laid under the
  overrides, then the same five namespaces the root carries — so the player reads one grammar
  twice. This moves `playerConfigs[i].playback` (a string) to `playerConfigs[i].player.playback`;
  the old flat shape collided with the `playback` namespace. **Wire change for the player team.**
- **The cards say what they are.** *Player behaviour* → **Default player config**; *Player
  configs* → **Custom player configs**. The 3 Sep "Default label is gone" call was right when the
  default was three facts in a table; a default that a dozen configs inherit from live has to be
  named as the thing they inherit from.
- **A CONFIG ROW IS ITS OVERRIDES.** Key · a chip per override (four, then `+n`) · switch · `⋯`
  (with `Follow the default for everything`, asked first) · **Edit**. The inline fold is gone —
  with every field overridable it would have been a twenty-nine-row page inside a page; a modal is
  the honest shape for "edit this whole thing, then come back". Empty reads *Follows the default*.
- **THE EDITOR is the default card, drawn again.** `pbSections()` gained one indirection —
  `pbView()` / `pbPut()` / `pbKey()` / `pbRepaint()` — so the SAME three sections, eight row groups
  and two-stack folds draw both the page and the modal; a config's editor is the default's card over
  a DRAFT of its overrides. The one thing the editor adds is a fourth column saying WHOSE ANSWER a
  row shows: `inh` (the default's, receded at .55 and back to full ink under the pointer, because
  it is live) or `bent` (this config's own — the accent rule a dissenting slot already wears in the
  ad setup — with `Follow default` beside it as the one way an override leaves). Touching a receded
  row IS overriding it: there is no separate "override this" step, because deciding a value is
  deciding to override. Done writes the draft to the page, Save writes the page, Publish airs it —
  the three planes, unchanged. Escape cancels; the veil does nothing (a form with edits does not
  die to a stray click).
- **THE COLOUR PICKER WAS BROKEN BY ITS OWN REPAINT** (*"unable to pick a color by moving the
  cursor"*). The native picker fires `input` continuously as the pointer moves, and every one of
  those repainted the card — destroying the `<input type=color>` the picker was anchored to and
  shutting it mid-drag. `input` now updates in place (swatch, hex box, the preview) and only
  `change` — the picker closing — repaints. Verified headless: five `input` events, the same
  element still in the DOM, hex and swatch moved with it. The hex box beside it updates the swatch
  the same way; a three-digit hex is widened to six for the picker, which only accepts six.
- **The pair is previewed together**: `Aa` in text colour on brand colour, beside Text colour, with
  the contrast ratio on hover and a quiet *low contrast* under 3:1 — warned, never blocked. Two
  colours are one decision seen once, and a contrast that fails is visible where it is chosen
  rather than on a player at a publisher.
- **The version rail walks every field** (`version-changes.js` had a hard-coded three), wording an
  absent side as `follows default`; so does the page's save review. Both bulk player sheets show a
  sparse config's INHERITED answer where it has none of its own, instead of a type default; they
  still edit the six quick facts — a cohort act is a blunt instrument, and the narrow sheet is the
  deliberate choice.
- **Nothing was invented** (asked twice, checked programmatically): 25 keys in the block, 25
  mapped, 4 pre-existing panel fields alongside, 0 added.

**HEADER BIDDING JOINS THE DRIVE — THE SURFACE ANSWERS IT TOO (11 Sep, user call).** *"In the
integration screen, in the ad behaviour section, now give this header bidding switch too — as well
as in the bulk integration editing while changing ad behaviour."*

- **It was ops policy only**: the ad setup's own answer, dissented from per slot. It is a QUICK
  DECISION now as well — stored sparse on each integration's `drive`, resolved over whatever the
  setup holds that day, exactly like every other decision on that page. Absence means *follow the
  setup*, so nothing about the ops room changed and nobody has to answer it twice.
- **One control, three tiers, both rooms.** `As set up │ Off │ Custom`, and — while Custom stands —
  the partners. Identical in shape to the ad setup's own row, differing only in what the inherited
  answer is called and what it borrows: the setup's slot borrows the setup's global (`Auto`), the
  surface's break borrows whatever the setup resolves to (`As set up`, which names that value
  beside it, so leaving it alone is never leaving it unknown).
- **In the bulk sheet it is a lever like any other** — clean slate, `Set` to open, the cohort's
  today-word beside it, one `×` to drop it, and one row on THE CHANGE REVIEW (`Header bidding ·
  as set up → Prebid`) before it lands on every selected surface.
- **THE OUT-STREAM GETS ITS FIRST QUICK DECISION**, reversing *"a rotation takes turns — nothing to
  decide beyond its switch"* (26 Aug) for this one field only. What that line refused was pod, walk
  and order semantics, which a rotation genuinely has none of; who bids for a banner slot is not one
  of those — it is exactly what Prebid was built for. Every other drive field is still refused there
  by name.
- **A REAL BUG FELL OUT OF IT.** The bulk sheet says "follow the ad setup" by sending the word
  `setup`, and the drive normalizer read that word **only inside `ask`** — so the sheet's own
  `Waterfall depth · Full` came back `400 "must be a whole number between 1 and 10 (got setup)"`.
  The clear is now read once, before the per-field branches, for every lever. Pinned by a case.
- 5 new cases (171 in the suite), covering the per-break answer, the `auto` refusal on a surface,
  the out-stream's one decision, what the player is handed under each layer, and the cohort write.

**HEADER BIDDING ANSWERS ON THE AD UNIT TOO (11 Sep, user call).** *"Also add header bidding
settings under each ad unit as well."*

- **The third tier of the one grammar.** The setup answers once; every break borrows it by default
  (`Auto`) or dissents; now every UNIT does the same one tier down, in its own settings: `Auto │ Off │
  Custom`, the borrowed answer named beside `Auto`, the partners under `Custom` — the break row's
  control exactly, so the page teaches it once. `Auto` borrows the BREAK's served answer (which may
  itself be borrowed), so one act at the head still reaches every unit that has not spoken. The
  global waterfall's units run in whichever break follows them, so their `Auto` reads "each break's
  own" rather than naming one.
- **A pasted URL has no bidders to ask.** Header bidding decorates a GAM request; a CAN unit makes
  none. Its row greys where it sits with that one-line reason, it stores no answer, and a named one
  is refused by name — the option the platform would refuse, greyed in place (principle 5).
- **The player is handed every unit RESOLVED.** Each walk entry now carries its own `headerBidding`
  — the unit's, its break's while it borrows, `off` on a pasted URL — never `auto`; the break's own
  resolved answer stays where it was. FAQ flag F names the new key.
- **In the fold, not the glance.** `Header bidding` sits in the left column under `Ad unit
  template`, and on the fact line it folds with the rest behind `+N more`, its served word in the
  cue's hover (`Prebid · custom` when the unit dissents). The glance was fixed at four the same
  afternoon; a fifth fact on every row would have undone that call. If a dissenting unit should be
  visible at a glance, that is a flag on the head row, not a fifth column — open.
- Wire: `headerBidding` joined `RUNG_FACTS` (seven now), so the response shape, the snapshot, the
  version diff (`Auto → Prebid` in words) and the JSON all carry it; `servedUnitHeaderBidding` in
  `setups.js` is the one resolver, `suRungHbServedWord` its web mirror. The suite stands at 166.

**THE PLAYER'S 25 LEVERS, PLACED — THREE SECTIONS AND A SIX-FACT FORK (11 Sep, user call).**
The player team handed over its config block — `pref` · `playback` · `theme` · `controls` ·
`analytics`, 25 keys — with the question asked the right way round: *"study them and segment them
first so the IA is very intuitive and the user is not cognitively overloaded, and which of them
should go inside custom config."* Placement first, fields second. `docs/PLAYER-LEVERS.xlsx` is the
record: an inventory of all 29 rows (the 25 plus the 4 panel fields with no key in the block), the
override policy, and 11 decisions the player team owns.

- **THREE DRAFTS, AND THE THIRD IS THE ONE.** Draft 1 named the sections for the viewer's moment —
  *It loads · It starts · While watching · It ends*. Reads well, names badly, and the user said so:
  *"these are not how naming can be done."* Draft 2 renamed them as noun phrases, which also fixed
  two real misplacements — the persistence switches are not part of startup, the scroll-away pair is
  not part of the controls — and grew the count to eight. Draft 3 cut that to **three**, on the
  user's call: *"we need maximum 3 sections, not these much — think meticulously here."*
- **Why three is right and eight was not.** A SECTION IS NAVIGATION. Eight of them is eight
  decisions before the first field: the card becomes its own table of contents, which is exactly the
  load the whole exercise existed to remove. Draft 2's analysis was not wrong — it was at the wrong
  ALTITUDE. Grouping is LAYOUT, so it moved down a level: eleven distinctions survive intact as
  quiet row groups INSIDE the folds, where they cost a reader nothing until they are already in the
  right section. Nothing was lost by cutting five sections; the finder just stopped paying for them.
- **The three, and the test that settles every argument.** **Playback** · **Controls & appearance**
  · **Analytics & measurement** — how does it play, what does it look like, what do we count. Every
  one of the 25 answers exactly one, which is what makes the split defensible rather than tidy:
  `pref.*` is playback (a viewer's remembered volume is how it plays, not how it looks), `theme.*`
  is appearance, and measurement stands alone because it is the one group where a wrong answer is
  invisible until a reporting argument months later. Row groups: Source · Start · Viewer memory ·
  Out of view · Completion │ Controls · Appearance │ Reporting · Vendors.
- **The card is THREE LINES.** The block grammar is the ad unit's, unchanged (7–8 Sep): no fill at
  rest with a 4.5% inset hairline, fill on hover and while open, a fact line that IS the summary so
  reading the card never needs a fold, and a 26×26 caret standing at rest. Three ways back out of a
  fold — the caret, the head row, Escape — because the 7 Sep lesson (*"I still cannot find any way
  to close it"*) was paid for once already. Written as its own `.pblk` rather than borrowed from
  `.ad-unit`: that block carries a rail for a grip, a position and a switch, and a settings section
  has none of the three.
- **THE FIELDS ARE THE PAGE'S FIELDS** (*"the UI of the fields look a bit different from the
  other fields on the page"* — right, and the diagnosis is precise). The folds were drawn on
  `.up-r`, the ad unit's COMPACT SUB-PANEL grammar: 28px rows, 11.5px pale labels, 26px controls,
  a bespoke 12px text box. Correct inside a rung's fold; wrong for a top-level card sitting beside
  Ad behaviour. They are `.lr.rule` now — the page's own settings row — so row height (38), label
  (12.5px/500/`--ink`), dividers, `.seg`, `.num-wrap` (96px) and `.rule-text` all arrive with it,
  MEASURED equal to an Ad behaviour row rather than eyeballed. The chips follow `.pchip`. The
  `.pblk-panel` block now says only what genuinely differs: a 176px label measure, because
  `Remember audio language` is longer than anything Ad behaviour has to fit. A control that is
  NEARLY the house style is worse than one that simply is it.
- **NOTHING WAS INVENTED.** The card carries 29 fields: the 25 the player's config block defines,
  plus the 4 the panel already had and already serves (Player type, its Redirect URL, Fallback
  media, Expand MiniTV for ads). Those four are Q4 — they are live today with no key in the block,
  so they are shown in grey on the inventory sheet and the player team owes them a home. Zero
  fields were added beyond the two sources.
- **AND THEN PLAYBACK WAS DECLUTTERED** (*"the playback section looks too cluttered — can we
  organize them better"*). Sixteen rows in five groups was a wall, and two of the five were paying
  rent they could not afford. **Three `Remember` switches were one decision** — what a returning
  viewer keeps — so they are one chip row under `Start`, where a remembered preference is actually
  applied; the `Viewer memory` heading went with them. **The Redirect URL rides its own answer**
  again (its behaviour in Details before the card existed): a permanently dashed dead box on the
  two player types out of three that never redirect is noise, and the house grey-in-place rule is
  about an OPTION the platform would refuse, not a sub-field belonging to one answer of the control
  beside it. **13 rows in 4 groups**, and the fold is 431px where it was ~530.
- **A FOLD IS TWO STACKS, NOT A GRID.** Auto-flowing groups into a grid aligned their ROWS, so a
  short group beside a tall one left a hole in the middle of the fold — with five groups Playback
  had two. Each fold now holds exactly two children: the LEADING group on the left (the one anyone
  opened the section for), the rest stacked on the right. Stacks end where they end, so no hole is
  possible, and one rule balances all three sections as they stand — 6│7, 4│3, 3│3.
- **A section of sixteen fields cannot print sixteen facts**, so each line carries its HEADLINE
  facts — the four or five anyone actually scans for (Playback says autoplay, volume, mode, loop,
  end screen; the source fields and the memory switches are set once and never scanned). The fold
  carries everything. A fact nobody changes does not earn a place on the line.
- **Details went back to being IDENTITY.** The player's fields had lodged there since the 25 Aug
  trim left them homeless; 25 levers of them could not stay. The page is four cards now —
  Details · Player behaviour · Player configs · Ad behaviour. `.prow2` retired with the move.
- **THE FORK RULE, written down at last.** A lever may fork only where two placements on ONE
  surface can legitimately disagree, AND the disagreement belongs to the placement rather than to
  the property, the brand or the measurement. That takes a config from three facts to **six** —
  `loop`, `endScreen` and `controlsMode` join: a shorts feed loops, shows no end screen and carries
  minimal controls, while the same surface's article player does the opposite. The other nineteen
  are refused BY NAME with the reason (`CONFIG_REFUSED`), the 7 Sep volume refusal generalised.
  **Measurement is the one that matters**: a fork that changed what is counted would split every
  reported number silently, and nobody would find it until a reporting argument months later.
- **Six facts made the fork a FOLD, and killed row zero.** Three facts fitted as three columns; six
  do not at the card's width — the wall the bulk sheet hit on 3 Sep, answered the same way. A fork
  row now shows its key and **a chip per DIFFERENCE** (four words when there is none), and opens
  into the card's own rows under the card's own section names (two of the three — a fork touches
  Playback and Controls & appearance, never measurement), each with `follow the player` beside
  it. *Difference is measured by VALUE, not by storage* — which matters, because a fork resolves
  its absent facts from the player at normalize time and therefore SNAPSHOTS them on the next write
  (the model the original three have had since 2 Sep, inherited unchanged). So moving a lever on
  the card makes every fork that held the old value light up as differing, which is the truth: they
  really do disagree now, and the player really will honour the fork. **Q12 for the player team:
  should a fork instead stay sparse and inherit LIVE?** Live inheritance is the more useful model
  and a bigger change — it is not being made quietly as a side effect of this one. The heading row went with the columns and **the Default row went with it**: the card above IS
  the default, and printing it twice was the 7 Sep problem in new clothes. *(Supersedes "the default
  player config became row zero, literally", 7 Sep — same reasoning, opposite conclusion, because
  the field count moved.)*
- **ONE LIST, DRAWN IN THREE PLACES.** `pcFields()` feeds the integration page, the master-detail
  bulk sheet and the Default-player bulk sheet; the seam holds the same list as `CONFIG_FORKABLE`.
  The master-detail sheet's own promise — *"a new player-config fact is one more form row here and
  nowhere else"* — only holds if it reads the list rather than repeating it, and it had already
  drifted to a hard-coded three in four separate places.
- **ONE SERIALIZATION BOUNDARY** (`playerBlock` in store/publish.js). The panel holds the levers
  FLAT — one object, one normalizer, one diff, so the change review can name any of them without
  walking a tree — and the player reads them NESTED. `player` is untouched, so nothing the player
  parses today moves; the three keys that appear in both are derived from one internal field each
  and cannot disagree. They collapse into one node once Q1 and Q4 land.
- **Four encodings honoured rather than argued with**: `0` means off for every timing (drawn as a
  switch, kept as 0 on the wire), `pip` is the empty string when docking is off, milliseconds
  travel and seconds are shown, and `pref.*` is 0/1 rather than a boolean.
- **Two of the eleven questions were answerable here and are answered**: Q10 — `pip` mixed four
  corners with a bare top/bottom, which cannot be one control, so the panel offers corners + Off;
  Q11 — `autoPause` documented 0 or 10–100, so 1–9 is refused by name (*"below 10% the player
  cannot tell — pick 10 or more, or switch it off"*). Q1 is answered AT THE BOUNDARY only
  (`auto` → `mutedOnScroll`): changing the panel's own vocabulary is the player team's call. The
  workbook's eleven grew to twelve with Q12 above, found by building it.
- **Presets stamp the whole card.** A new integration landing on raw defaults would wear a red
  brand colour and full controls on a feed, and the first act would be correcting three sections by
  hand. MiniTV is a feed (passive, loops, minimal chrome, docks); ArticleShow is quiet with full
  chrome and related at the end; VideoShow is a destination.
- **One test was strengthened, not weakened.** `10-player-configs` asserted the absence rule
  (*"every player saved before the field existed runs active"*) through key_2's seeded player — so
  the moment a preset said what an ArticleShow surface actually IS (passive), a product decision
  read as a rule break. The case now sends absence, which is what the rule is about. **166 cases**;
  `15-player-levers.spec.js` adds nine.
- **This reverses the 25 Aug trim, deliberately.** Controls, end screens and docking went then as
  *"the publisher's own player"*. The 3 Sep rename to **Player Console** already undid that
  reasoning; this is the panel finishing the job its name started.

**ONE CONTROL, THREE ANSWERS, ONE CONFIRM — THE BREAK'S SOURCE, FOURTH AND FINAL CUT (11 Sep,
user call).** *"The switch, the CTA for switch enable/disable, on/off — everything is not getting
connected in a clean user journey; it is too disjointed, it feels everything is just placed with no
thought of a UX."* And: *"the modal for confirmation is too immature and too cluttered."*

- **The fault was real.** A break's fall has exactly three answers — nothing, its own units, the
  shared ladder — and they had been split across two controls a thousand pixels apart: a switch at
  the left of the row for one, a text link at the far right for the other two. Nothing tied them
  together, so there was no journey: you had to already know the model to know they were one
  question. Each earlier shape (floating band → switch + two-tab seg → switch + stated fact + CTA)
  answered the last complaint and kept the split.
- **Now the three answers stand together in one seg**, directly under the WATERFALL header and on
  its own left edge — the same x the header and the blocks use: `[ Off │ Custom │ Global ]`. It
  carries NO byline (user call, same review — *"3 units · 2 breaks follow it — remove this
  byline"*, the call the waterfall's own foot took on 7 Sep): what an answer serves is drawn
  under it — its own rows, or the global's levers and the door to its ladder — so a count beside
  the control said twice what the section shows once. The one exception is not a count of
  anything visible: a fall switched OFF keeps `N units kept`, the only trace of units nobody can
  see and the only hint that the way back returns something. It reads identically to the
  `Header bidding [ Auto │ Off │ Custom ]` row a few centimetres below, so the page now has ONE
  grammar for "where does this setting come from".
- **A refused answer greys where it sits, with its own reason** — `Custom` while there is no primary
  to fall through from, `Global` while the shared ladder is empty, `Off` while a live break would go
  dark. That is strictly more capable than the held switch it replaces: a break with no primary can
  still follow the global waterfall, which is a legal arrangement the switch blocked outright.
- **The confirm is the house's SMALL 440, and its body is the move** (same review, one more
  pointer — *"a small confirmation modal with not much text, just convey do you really want to
  switch, and show the switch in a clean manner down, with two CTAs — yes or cancel"*):

      Switch this break’s waterfall?
      DEFAULT · POST-ROLL
      Custom waterfall  →  Global waterfall
                              [ Cancel ]  [ Yes, switch ]

  Two shapes were tried before it in one hour — a hand-written prose paragraph (*"immature,
  cluttered"*), then THE CHANGE REVIEW itself. The review is the right screen for a save or a
  publish, which carry dozens of changes under section labels; for ONE answer moving it was a
  section header, a change count and two counted rows to say a thing an arrow says. What stays
  from it is the from → to spine, at the size of one decision. The break is named quietly above
  the move, because a page of twenty breaks must never leave you wondering which one you changed.
- **Splice discipline, again:** the rewrite's range swallowed `suSrcDarkWhy` (the live-break
  darkness refusal). Caught by a render, restored, and now checked by a sweep — every `su*` callee
  and every inline `onclick` handler in `web/js` resolves to a definition.

**"WORTH A LOOK" IS GONE, AND PUBLISH *IS* THE VERSION SHEET (11 Sep, user call, same
review).** *"Remove this Worth a look section — and can this be similar to the version
switching modal design, can we use the same modal in fact."*

- **It already is the same modal.** Publish, the version sheet, Restore, Save, bulk Apply
  and every read-back all run through `reviewChanges` — one component, one frame, one row
  grammar. What made publish *look* like a different object was the amber block sitting
  between its list and its act: the only thing on that screen that was not a change.
- **So the block went.** A save's soft flags (*"Default pre-roll: up to 10.5s before an
  ad"*) moved onto THE CHANGE REVIEW on 7 Sep to get them out of a two-second pill. Four
  days of use says the cure cost more than the disease: they are levers nobody acts on at
  the moment of publishing, and they bought that irrelevance with a coloured box in the
  one place a person is reading what is about to move. `pubFlagsHtml` and the whole
  `saveWarnings` capture are deleted. The API still returns `warnings` and the savers
  still hand them back; nothing reads them.
- **One aside remains, and it is the destructive one** — *"4 unpublished draft changes will
  be discarded"*, on restore. It is red, it is counted, and it renders through
  `reviewBodyHtml` itself, so the work about to be destroyed is sectioned and columned
  exactly like the work about to go out. `reviewAsideHtml` lost its `tone` and its `lines`
  branch with the amber twin; `.rvw-aside.soft` / `.rvw-al` went with them.
- **What the three doors now differ by is only their words.** Head (title · lede · the
  author's quote) → caption (total · scope) → the list → the acts. Publish and Restore add
  one note line; the version sheet puts Restore beside Close. Nothing else.

**WORDS AT A GLANCE, SECONDS ON CLICK (11 Sep, user call — the same afternoon).** *"Move
Content pause to the right column and the left column fields to the left … identify some 3-4 keys
that should be shown in read-only mode and the rest can only be seen by clicking on it — a see-more
like intuitive text on hover or something else — this will remove the clutter a bit at a glance."*

- **The fold's columns swapped.** Left is now the column that never moves — `Request delay · Ad unit
  template · Auto-hide` — so the block is anchored on its left edge; right is `Content pause` with
  its children indented beneath it, the one column that grows and shrinks with the answer. A
  rotation keeps the same sides (template left, placement right).
- **The fact line carries the unit's four DECISIONS and folds its three CLOCKS.** At a glance:
  `Content pause · Ad unit template`, and while content plays `Ad placement · Mute`. Behind one
  counted cue, `+3 more` in the label's own voice: `Request delay · Close button · Auto-hide`, whose
  exact values ride the cue's hover (the one hover the panel keeps — an exact value), and which the
  click opens like the rest of the line. The rule is one sentence: a decision is a WORD you chose, a
  clock is a NUMBER you tuned, and a ladder is read for its words. This retires the 4 Sep promise
  that "reading a ladder never needs a fold opened" for exactly the clocks — the user's call, made
  for exactly the reason the promise was: what the eye has to skip.
- A default video unit's row reads `Content pause Yes · Ad unit template Standard · +1 more`; a banner
  over content, the fullest row, went from seven facts to four and a cue. Columns keep their measured
  widths; the `delay`/`hide`/`close` columns are gone from the line, so their CSS went too.

**THE WATERFALL'S SOURCE IS A STATED FACT AND ONE CONFIRMED ACT — THE `CUSTOM │ GLOBAL` SEG IS
GONE (11 Sep, user call).** *"The waterfall custom and global is a decision tab, is not the clear
way of communicating it — and a dialog confirmation should always show while switching."*

- **A seg says "pick a view"; this decides what SERVES.** The same objection retired a seg here once
  before (7 Sep); behind a switch it read better for three days, but it was still two tabs standing
  for one fact plus one decision, and it let the source change on a click that named no consequence.
- **The row now states the source, counted, with the one act that changes it at the far end** —
  where every other act in this zone sits:
  `⬤ Custom waterfall · 2 of 2 active … Use the global waterfall` ·
  `⬤ Global waterfall · 2 breaks follow it … Use a custom waterfall` ·
  `○ No waterfall · 2 units kept`. The global's NAME is the door up to it, because the thing to
  look at is the thing being named.
- **Every source change confirms first, and the confirm is counted, not prose** — where it lands,
  what starts serving, what is kept: *"Default · Post-roll. Its 3 units serve under this break's
  primary, and this break's own 2 units are kept, switched off."* All four transitions have one
  (on, off, custom, global), each naming its own numbers; Cancel and the veil leave the break
  exactly as it stood.
- **This is not the 8 Sep dialog returning.** That one EXPLAINED three states in cards — prose
  standing in for controls — and was opened by a button that was itself a second control for the
  same question. This one is a plain confirm on a named act, in the same `ask()` grammar as Clear,
  Remove placement and Take off air, under the 19 Aug house rule that every state-changing act
  confirms with its counted consequence.

**THE CHANGE REVIEW, REDRAWN (11 Sep, user call).** *"The modal opened on publish of
integration and ad setup is too ugly immature and visually cluttered with too much text and no
clean IA — redesign it completely."*

- **It had three visual languages for one kind of fact.** The list wore bordered cards with
  filled header bands; a caution wore the version rail's `.vc` prose lines; the note wore a
  text field wedged between Cancel and Publish. A 21-change publish was a stack of six nested
  boxes, and `Restore — on air as v4` left the note half a field wide.
- **Nothing lined up.** `from`, the arrow and `to` flowed inline inside ONE cell, so
  `immediate → immediate` and `7s → 3s` started at different x. A diff you cannot sweep with
  your eye is a diff nobody checks. And a value over 28 characters silently dropped its
  `from` and printed only where the change landed — the one row you most need both halves of.
- **Now: four zones, in the order a person decides.** THE HEAD (act · consequence · the
  author's quote, three lines at three weights, not three facts on one baseline) · THE CAPTION
  (`21 changes` — the total the screen never used to state — and, opposite it, what they were
  counted against, which used to sit in the FOOT beside the buttons) · THE EVIDENCE · THE ACT
  (the note on its own line, then the two doors, alone; no note at all when there is nothing
  to publish).
- **One row grammar, and a spine.** A change is WHAT · WAS → NOW on a four-column grid shared
  by the whole dialog, so the arrow column is a seam the eye follows from the first change to
  the last. Both sides are always shown — a long value is clipped to its column with the exact
  string on hover — so every row says the same three things in the same three places.
- **A caution is that same grammar.** `.rvw-warn` and its `.vc` lines are gone: a restore's
  discarded draft changes are CHANGES, so they render through `reviewBodyHtml` itself, sections
  and all (`Pre-roll` · `Mid-roll` · `Player` — the where the old block kept but the new one
  would have lost). A save's flags stay words, because that is what they are.
- **No cards.** A section is a sticky label and some air. Six groups used to mean six nested
  containers; the breaks now chunk by whitespace before a word is read. The per-group count is
  gone with them — one total in the caption is the number being agreed to.
- **THE SCOPE IS THE GROUP.** `Pre-roll`, `Pre-roll · TOI Mweb VideoShow Display`,
  `Default · Pre-roll` and `Shorts feed · Pre-roll` opened four top-level boxes side by side,
  so *"what did I change on the mid-roll"* — the question this screen exists to answer — took
  four looks. The known break/zone word is now the SECTION; whatever else the `where` carries
  becomes a quiet sub-label inside it. A setup's publish reads: PRE-ROLL → Default, Shorts feed
  → MID-ROLL → Default → DETAILS.
- A list cut off mid-row now says so on purpose (a scroll-local white cap over a pinned
  shadow), `pubChangeLine` went with the prose lines it drew, and the standalone 620 frame and
  both `.steady` journey frames are untouched — step 2 still measures the same as step 1.
  156 cases pass; the 69-screen walk is clean.

**A BREAK IS TWO NAMED SECTIONS, AND THE WATERFALL'S SWITCH IS ITS SECTION RULE (11 Sep,
user call).** *"In a newly created placement, in every slot, primary should always show it is on
top of waterfall — currently it only shows if the waterfall switch is enabled. Also the waterfall
switch is non symmetrical and not aligned with other switches, plus it is not cleanly discoverable
— too much cognition."* Then: *"There is no clear demarcation of primary and the waterfall section,
it is not getting communicated correctly."*

- **The zone drew what happened to exist.** An empty break showed a bare switch and an `+ Add ad
  unit` button, so the anatomy every break has — ONE first ask, then a fall — was invisible until
  you had already built it: learned by accident rather than read. A filled break showed three
  floating rows between its blocks (the `Primary` rule, the source switch at its own x, then
  `WATERFALL ORDER · N active`) — two headers for one section, and a control aligned to nothing.
- **Now: `PRIMARY` and `WATERFALL`, always both, in the order they are asked.** The primary section
  holds the block or, when there is none yet, its own `+ Add ad unit`. The waterfall section holds
  its own rows, the global's levers, or nothing — and its rule carries the switch, `Custom │ Global`
  and the counted note (`2 of 2 active` · `2 breaks follow it` · `2 kept`).
- **The header is a header; the controls are the row under it** (same review, third pointer —
  *"the primary and waterfall header are not communicating as a header"*). For an hour the word and
  the switch shared one line, which made the word a LABEL FOR THE SWITCH rather than a heading, and
  pushed it 90px off the left edge of everything it heads — at 9.5px faint, *smaller and paler than
  the `AD SOURCES` gutter label beside it*. That is the exact fault the head sections fixed on
  4 Sep (*"the 10px eyebrow sat visually below the + Add template button"* → `.pl-head`), so it takes
  the same cure one notch down: **11px / 700 / `--ink-soft`, on the section's own left edge (x=149,
  where its blocks and its add button start), hairline to the right**. A stale `.fall-w` rule later
  in the sheet had been quietly overriding the first attempt — the reason the type looked unchanged.
- **The waterfall's controls take the row beneath, wearing the UNIT RAIL** — the same grip /
  position / switch cells its blocks wear, from the same markup, so the columns cannot drift.
  Measured: the switch moved from x=194 to **x=202, the exact column every unit switch stands in**.
  A section switch sitting over its items' switches is the oldest pattern in list UI (a parent
  checkbox over its children) and the one that makes "this governs those" readable without a word.
  The row carries no word of its own: the header above already named the section, and a section
  wearing its name twice was the shape this replaced. The primary needs no such row at all —
  its first ask always serves.
- **The fall begins at rung 2.** `suSrcState` now reads `own` only when something sits under the
  primary, so a break with just a first ask correctly reads "no fall". Switching the waterfall on
  opens one empty FALL row and never touches the primary; with no filled primary to fall from the
  switch is **held** (greyed, reason on hover: *Add the primary ad unit first — a waterfall is what
  it falls through to*) instead of accepting a click that would visibly do nothing. The exotic
  legal case — a break serving the global waterfall with no primary of its own — is still reachable
  from `Apply on ad slots` upstairs, and still renders.
- A connected break's levers lost their own `Global waterfall` header: the section rule above names
  the section, carries its switch and counts its followers, so the second header was one break
  wearing two.

**CONTENT PAUSE IS THE PARENT OF THE FACTS THAT ONLY EXIST WHILE CONTENT PLAYS (11 Sep, user
call).** *"In each ad unit there is a settings field named Content pause … if No then the Ad placement
one will become active … so don't show the Ad placement key-value in the read-only preview [while
content pauses]; similarly if Content pause is No another field will come — since we will be rendering
both content and ad, which one to mute: Content mute or Ad mute. Think on the IA cleanly and
accommodate these settings in a clean and decluttered way across ad units in ad setup."*

- **One parent, three children.** `Yes` takes the whole player, so nothing sits over the content.
  `No` and `Auto` (the player may not pause) leave two things rendering, and THAT is when three
  questions exist: where the ad sits (`Ad placement`), whose sound is quiet (`Mute` — Ad · Content,
  Ad by default: the viewer came for the content) and when the viewer may close it (`Close button`,
  a banner's). `Request delay`, `Ad unit template` and `Auto-hide` are true whatever the answer.
- **Shown, not dimmed — and only while they apply.** This reverses the 4 Sep "type-based, never
  value-based" rule for exactly these three (the Close button used to dim with "Content pauses —
  no close button"). A dim row with a reason is for a pick the platform would REFUSE; a fact with
  no meaning right now is clutter. A default video unit shows three facts; flip it to No and the
  children appear directly under the switch you just moved, indented beneath it.
- **The settings are two columns by MEANING now, not by count**: left, `Content pause` with its
  children stepped in under it; right, the three that hold regardless — so the right column never
  moves when the answer changes. The 7 Sep grid paired rows by position, and a row that comes and
  goes would have re-shuffled every pair.
- **The fact line keeps its columns.** The facts every unit always has come first (`Content pause ·
  Request delay · Ad unit template · Auto-hide`), so each lands on one x down the ladder whatever
  its neighbours answer; the over-content facts ride as a tail (`Ad placement · Mute · Close
  button`) that exists only while content plays — a Yes row is simply shorter, with no hole. The
  fold orders by meaning, the line by stability; same words, same values either way. Column widths
  are measured, not rounded, so the fullest row (a banner over content, seven facts) stays one line.
- **Wire.** `mute` (`ad` · `content`) is a break unit's own fact like `pause` — kept while content
  pauses, so the answer returns when the switch flips back; a rotation refuses it by name (an idle
  player has nothing playing to mute against). It rides the response shape, the snapshot, the
  player's JSON and the version diff through one `RUNG_FACTS` list in `state.js`, which also
  replaced the four hand-copied lists that had carried the other five. `/panel/meta` gains
  `muteModes` / `muteWords`. FAQ: the per-unit table names it (flag E). 156 cases.

**HEADER BIDDING LEADS DELIVERY SETTINGS, INLINE: `Auto │ Off │ Custom`, THEN THE PARTNERS (11 Sep,
user call — the dialog reversed within the hour).** *"Move header bidding to the top in delivery
settings; there should be 3 options upfront — auto, off, customize — if clicked on customize then
ask for Amazon+Prebid, Amazon or Prebid. No need of the modal or dialog box here."*

- **First row of every break's Delivery settings**, its own cluster above the pacing rows: who else
  is in the auction is decided before how the break is paced.
- **Three states upfront** — `Auto` (the setup's answer, named in a quiet note beside the seg so
  nobody scrolls up to learn what Auto means today), `Off`, `Custom` — and **while Custom stands, a
  second seg under it** with `Amazon+Prebid │ Amazon │ Prebid`, on the same left edge. Choosing
  Custom starts from the setup's own partners when it has some, so "make it mine" is one click.
- **`Custom`, not "Customize"**: the page already says `Custom │ Global` about every break's
  waterfall; a slot's own answer wears one word everywhere, and a seg of states reads better
  without a verb among them.
- **The dialog is gone.** The row-as-fact + decision-dialog cut lasted an hour: the user's read was
  that two segs are the decision, and two segs belong on the row. Nothing underneath moved — the
  stored answer, the resolved value the player gets, the differs dot, the tint, `Apply to all
  placements` and the version diff all read as before. The second seg appearing on Custom is the
  one deliberate exception to "nothing appears" in this grid: it is asked for by a click on the
  very control it appears under, and it is a whole seg, not a field worth parking greyed on every
  break that will never use it.

**THE SLOT'S HEADER BIDDING IS A FACT ON THE ROW AND A DECISION IN A DIALOG (11 Sep, user
call).** *"In each ad slot of every ad section we need an option to either switch on/off header
bidding; if on, use the global one configured above or custom, i.e. select the value here — such a
thing was done for the waterfall too. Switching should be a confirmation activity, via a dialog, and
the switch should be in the dialog. See how mature platforms do the UX for this."*

- **The row at rest is the effective answer and where it comes from** — `Amazon+Prebid GLOBAL`,
  `Prebid CUSTOM`, `Off` — with a chevron. That is the settings-row idiom every mature
  inherit-or-override surface uses (Workspace Admin's per-OU overrides, GAM's ad-unit overrides,
  Chrome's per-site settings, a phone's settings rows): the value you would actually run is always
  on screen, and so is whether it is yours or borrowed. The day-old five-answer seg put an inherited
  answer and three concrete ones in one row and left "on or off?" implicit.
- **The chevron opens ONE dialog where the whole decision is made**, in the grammar every break on
  the page already teaches for its waterfall: `⬤ Header bidding` switch → `Custom │ Global` → the
  partners. A step that does not apply greys where it sits with its reason on hover — off greys both
  segs; Global greys the partners and shows the setup's current answer pressed-but-dim in them, so
  the borrowed value is visible without a word of prose. **Apply names the outcome**
  (`Apply — Global · Amazon+Prebid`) and stays unavailable until something changed; Cancel and the
  veil leave the slot untouched.
- **Why a dialog is right here and was wrong for the waterfall's source (8 Sep).** The waterfall's
  dialog EXPLAINED three states in cards — prose standing in for controls — while the row itself
  stayed inline and stateful. This dialog holds no prose: it IS the controls, and the row it comes
  from holds only a fact. The user's word "confirmation" is honoured as *the decision is committed
  in one place*, not as a second "are you sure?" — the platform's real gate is still Save → Publish
  through THE CHANGE REVIEW, and the dialog writes the draft form like every other control.
- Stored answer unchanged (`behaviour.headerBidding`: `off` · `auto` · a partner); the resolved
  value the player is handed is unchanged; `Apply to all placements`, the differs dot, the version
  diff and the Global settings grid all read exactly what they read before.

**HEADER BIDDING: ONE ANSWER AT THE SETUP'S HEAD, BORROWED BY EVERY AD SLOT (10 Sep, user
call).** *"In the ad setup we need another option which is a header bidding option which could
have 4 values — Off, Amazon+Prebid, Amazon, Prebid; this will be available in every ad section at
every ad slot as well, wherein the user can either choose auto — which means borrowed from the
above global one — or on it with custom, or off it. It has to have somewhat like the global
waterfall journey, not exactly, but the user intuition is this."*

- **The journey is the global waterfall's; the control deliberately is not.** What it takes from
  the waterfall: a global answer folded at the setup's head (`HEADER BIDDING`, beside
  `GLOBAL WATERFALL`), a counted line saying how many ad slots follow it (*6 of 8 ad slots follow
  it*), one bulk act over the same ad-section × ad-slot grid, and a `View` door from any slot up to
  the head. What it does **not** take is the waterfall's two-step `Waterfall` switch +
  `Custom │ Global` seg: there, the custom answer is a whole LADDER, which cannot fit in a seg and
  so needs a mode control above it. Here the custom answer is ONE value out of three, so the
  borrowed answer sits in the SAME seg as the concrete ones — the grammar `Content pause` has used
  since 5 Sep for `Auto · Yes · No`, where Auto means "each unit's own". A switch on top would have
  dressed one question as two, and made `Auto` while the global is Off read as "on, bidding nobody".
- **The slot's control is the global's control with `Auto` prepended**:
  `Auto │ Off │ Amazon+Prebid │ Amazon │ Prebid`, in the user's own order and spelling. Five
  answers, 332px of the 404px control column — no wrap, no reveal, nothing that moves under the
  cursor.
- **It lives with DELIVERY SETTINGS, not in Ad sources.** Bidders are asked alongside the ad
  server, not tried in turn: header bidding has no order, no depth and no place in a ladder, so it
  is not a rung and not a lever on the waterfall. As a slot behaviour field it also inherits, for
  free, the label edge and rhythm of the rows around it, the unsaved-change tint, the
  "set differently on another placement" dot, `Apply to all placements`, per-pod addressing, and
  the field-by-field version diff. It opens the *how hard we fill it* cluster — who else is asked,
  before how long each try waits.
- **The borrow is a LINK, never a copy** (the waterfall's own promise, made about one value):
  a slot on `Auto` stores `auto`, so moving the global moves every borrowing slot with it, and a
  slot that dissents keeps its answer. `auto` is **refused at the global by name** — the thing
  being borrowed cannot borrow.
- **The player is handed it resolved.** `servedHeaderBidding` (one rule, mirrored web-side as
  `suHbServed`) turns `auto` into the setup's answer at the live boundary, so the JSON never
  carries a panel-side inheritance for the client to join up itself. It is on the setup's publish
  snapshot, so it moves only on Publish, like everything else.
- **Counted, never claimed.** *Bidding* is counted where a slot *actually bids* — an
  `Amazon+Prebid` answer on a slot with no ad units is asking nobody — so an answer no slot takes
  says so as a warning (*no ad slot takes it*) rather than sitting there looking placed. The
  folded line is the answer badge alone (11 Sep, user call — the break chips it first wore belong
  to Placements, one line down); followers and who is bidding ride its hover.
- **ONE SECTION, `GLOBAL SETTINGS`** (11 Sep, user call — *"can we make one section which is global
  settings and move header bidding and global waterfall there only?"*). The two setup-wide answers
  share one folded head; each is a zone row down its left rail — `Header bidding`, then
  `Waterfall` (the one-line answer above the ladder; user call, same day) — the exact anatomy
  every break row has (Special · Ad sources · Delivery settings), one page up. Two sibling sections for two facts were two heads, two hairlines and two
  chevrons saying "shared plumbing" twice. The head's glimpse is the two facts as marks in the zones'
  order — the answer badge, a hairline, the walk — and `View` from a break or a slot lands on the zone it names and
  flashes that zone, not the whole section. The head-open key is `globals`; a refused save in
  either zone forces it open.
- **ONE LINE when open** (11 Sep, user call — *"we only have this tab and apply on ad slots; keep
  it clean while retaining the symmetry of the page"*): `PARTNERS` on the rail, the seg at the
  zone's left edge, `Apply on ad slots` at the right edge the waterfall foot's act ends on. The
  routine *6 of 8 ad slots follow it* line went the way the waterfall's own count went on 7 Sep —
  the grid names every follower, and the count rides the folded line's hover; only the warning
  stays.
- **Off by default, everywhere.** A new setup starts `Off` with every slot on `Auto`, so switching
  a surface on is one act at the head; the out-stream is in (a banner slot is what Prebid was built
  for) where the waterfall's grid leaves rotations out. 9 new cases (155 in the suite).

**THE IN-PAGE AD SETUP PICKER RESTS AT SIX AND SEARCHES ALL OF THEM (8 Sep, user call).**
*"While we create a new integration, in case of mapping an ad setup in the Ad behaviour section we
should have a search there, since we only show 6 recent ad setups there — but what if there are
more than 6 for that property?"*

- **Measured first, in the `scale` world: 24 ad setups on TOI.** The in-section picker had no cap
  at all — it painted every one of them, ~1600px of cards below the form, so `Create integration`
  and everything under Ad behaviour left the screen (page height 2192px on a 1000px viewport). And
  the shared card search only appears past EIGHT (`dlgSearchHtml`, 7 Sep), so between six and eight
  setups the only way to reach one was to scroll a page-length grid.
- **The grid rests at six** (`SP_CAP` — two rows of three at 1440), newest work first, which is the
  order it already sorted in. Beside the field, a counted line says exactly what is held back:
  *newest 6 of 24 — search to reach the rest*. Page height at scale: **2192px → 1124px**, and the
  whole create form fits one screen again.
- **The search reaches EVERY setup on the property, not the six on screen.** All the cards are in
  the DOM; the ones past the cap are painted `hidden` (`setupMapCardHtml(s, mine, acts, held)`), and
  `spFilter` re-decides which are shown on every keystroke — no query shows the newest six, a query
  shows every match (*2 of 24 match*), nothing matching says so in place. The bar paints once and
  `.sp-count` is written by hand, so the caret survives typing (the toolbar rule).
- **THE FIELD IS ALWAYS DRAWN, AT THE TOP RIGHT** (same day, second pointer — *"I can't see the
  search; it should be there on the top right, and even if ad setup cards are less than 6"*). A
  control that only appears past a threshold has to be discovered twice — once the day a property
  has five setups and again the day it has seven — and by then the reader has learned the door has
  no search. So **one bar serves both doors** (`spBarHtml` / `spFilter`, replacing this section's
  private pair and the shared `dlgSearchHtml` in the modal): the counted fact hard left, the field
  hard right, drawn whenever there is at least one card to search — with none, the empty line is
  the whole answer and a search box would be furniture. The bar carries its own `data-cap`, six in
  the page and none in the modal (which owns its scroll and can list all 24), so ONE filter reads
  both, and the count says the right thing in each state: *4 ad setups on TOI* · *newest 6 of 24 —
  search to reach the rest* · *2 of 24 match* · *Nothing matches*.
- **The modal's frame was re-measured, not nudged** (the 7 Sep rule): the bar costs 45px, which
  pushed the second row of cards into a scroll. Head 18 + 10 · body 426 (bar 33 + 12, two rows of
  184px cards + the 10px gap) + its 16 · foot 36 · 44 of dialog padding = **550**, and the overflow
  is 0 at exactly that number. Step two's reading is 298 and still centres in what is left, so the
  two steps measure the same from the outside. `dlgSearchHtml`'s `min` argument was reverted with
  its last caller — the other choosers still search past eight, untouched.

**THE AD SETUP CARDS ARE THE LISTING, STOOD UP — AND THE SWAP IS ONE FRAME (8 Sep, user call —
three pointers).** *"The cards opened are looking pretty ugly and immature — make them refined and
polished, maybe use the metadata present on the listing page of ad setup; the one selected should
be shown as selected with a border and a tick mark on the top right, how you see on many
enterprise products. The next step: the size of the modal should not change, it should remain the
same, and improve the IA and visuals of the second step to make it clean and easy to understand.
The `open` CTA is quite immature — make it Preview and improve the weight, make it clean and more
mature."*

- **The card wears the Ad Setups row's own columns.** It used to say a name, a property monogram
  and `pre 2 · mid 2 · post — · out —` — engineering shorthand in a sentence — with its acts
  hidden until hover. It is the listing row now, in four tiers read top to bottom: **who**
  (monogram + name, `Current` where it applies), **the counted marks** (the SAME break chips the
  list lights, the extra-placement count, the live version and any waiting work), **the facts**
  down a label column (`FILLS` — this integration, the others that ask from it, or *not mapped
  yet* — and `UPDATED` — who touched it last, when), and **the acts** on a rule of their own. One
  reading learned on the list answers the same questions at the door: `scStatusHtml` restates the
  listing's three version answers, `setupChipsHtml`/`relWhen` are the list's own.
- **Selection is a border and a tick, not a tint.** The 2px accent frame stays, but the mark that
  says *this one* is a filled tick in the **top-right corner** — the enterprise convention the
  user named. Its well is reserved on every selectable card and the mark scales into it, so
  nothing reflows when it appears; the cards are a real `role="radiogroup"` and each carries
  `aria-checked`. The ground went from `--accent-soft` to the faintest blue, because a 2px frame
  plus a tick plus a tinted card is three marks for one fact.
- **Nothing fades in on hover any more.** The two acts left the top-right corner (where the tick
  now lives) for the card's foot, at rest, right-aligned and ordered by reach: `Preview` → `Use a
  copy` → `Use`. A card that hides something under the cursor cannot be scanned, and the corner
  ramp that carried the buttons over the tail of a long name is gone with them.
- **`open ↗` is `Preview`, at button weight.** An 11.5px accent link with a typed arrow read as a
  footnote on the card it was the main way out of — and next to a chip that also opens something,
  "Open" said nothing about which of the two took you elsewhere. It is a labelled button now
  (`.sc-act.reads`) with the external-tab icon **drawn** (`EXT_ICON`), and the Ad behaviour title
  row's own act says the same word at the same weight, so one act looks the same in both rooms.
  `AD SETUP  [ TOI VideoShow demand ⌄ ]  [ Preview ↗ ]`. No hover explains it — the word and the
  icon are the explanation (the 7 Sep tooltip policy); the two `title=`s a card does carry are
  exact values, the placement count and the full list of holders behind *+2 more*.
- **BOTH STEPS OF THE SWAP NOW LIVE IN ONE FRAME.** Step two was an `ask()` at 440 (Use) or an
  `askForm()` sheet at 620 (Copy & use) thrown over the 860 picker: the dialog appeared to be
  REPLACED mid-journey and the foot the eye had just learned moved twice. The head, the body and
  the foot swap inside a fixed **860 × 520** `.dlg.wide.chgdlg` — one dialog turning a page —
  which is exactly the case the 7 Sep frame ladder wrote its opt-in floor for. `CHG_STEP`
  ('pick' | 'use' | 'copy') is the only new state; `Back` returns to the cards with the selection
  AND the filter intact, and the copy's name survives the trip both ways (`CHG_NAME`).
  *(The class is `chgdlg`, not `chg`: the bare word is the unsaved-change rule in 03-controls.css,
  which drew a 2px amber bar down the dialog's edge — caught in the first screenshot.)*
- **Step two answers three questions in the order they are asked.** WHAT replaces WHAT — two
  plates and an arrow, each wearing the property monogram, the break chips, the counted demand
  (`pre 10 · mid 4 · post 3` → `pre 2 · mid 2 · post —`, so a break about to go quieter is
  visible, not described) and who touched it last. Then what it COSTS — `WHAT CHANGES`, one clause
  a line, with the one consequence that costs something (a section whose breaks switch off) still
  wearing its warn banner at the foot of the reading. Then, for a copy, what the new thing is
  CALLED — the field, echoing live into the After plate as it is typed. A short reading sits
  centred in the frame (`margin: auto`, so a long one still scrolls whole) rather than leaving the
  air in one lump under it.
- **The copy still refuses in place**, in the same words, from the same write: `makeSetupCopy` +
  `finishSetupCopy` are shared by the change journey's second step and the in-section picker's own
  button, so a name already taken reddens the field with nothing retyped, and the dialog stands.
  145 cases pass; the UI walk now drives the chip and both steps.

**A SETTINGS KEY IS NOT A HEADING (8 Sep, user call — *"the delivery settings keys should
not be bold i feel in the ad setup"*).** `.lr-l` carried **600** because the class does
double duty: it is also the label on a `.lr.head` band, where it governs the rows beneath
it. In a settings row it governs nothing — the control beside it is the figure — so
`Start offset` · `Total Target Impressions` · `Total timeout` were reading a tier ABOVE
the ad units' own setting labels three rows up, which sit at 400/11.5px/`--ink-soft`.
**`.lr.rule .lr-l` is 500 now**: still a label, no longer a heading voice. Ink and size
are untouched — the row stays scannable, and the segment's chosen option is still the
boldest thing in it, which is the hierarchy we want.

One rule for the whole family, deliberately: delivery settings, the waterfall's shared
settings and the integration's Ad behaviour card are the SAME row drawn by three
renderers (`behaviourRowsHtml`, `accRow`, `suWfMirrorHtml`), and every live `.lr` in the
app is a `.lr.rule` — so a delivery-only override would have left the row above it heavy.
`.lr.tail`'s 750 (the bulk sheet's folds) still wins on cascade order. The bulk sheet's
own `.bqf-l` keeps 600: at rest those rows have no control, so the label IS the row.
Checked at 600 / 500 / 400 side by side at 2× before choosing — 400 lost the label
entirely, and the difference from 600 is exactly the heading voice going away.

**THE BULK SHEET'S FRAME IS ONE NUMBER, MEASURED (8 Sep, user call — *"a lot of empty
space here in the bottom … make it clean and more compact and mature"*).** Measured
before touching anything, as the 7 Sep frame ladder demands: the ad sheet's body was
pinned at **340px** by `.steady` while the tallest tab holds **199px** of levers at rest
and **220px** with every lever open — so every break tab floated in 120px of air, and the
out-stream tab, whose whole body is one line, in 300px. The number was a guess from
before three fields were cut (Break cap, Display ad position, and 8 Sep's out-stream
switch); nothing had re-measured it since.

- **The frame moved from the body to the DIALOG, and each journey states its own.**
  There used to be two floors kept in step by hand — 340 on the sheet's body, 411 on the
  review's, the 71px between them being the tab strip the review has no equivalent of, so
  that both dialogs measured 529 from the outside. That arithmetic is gone: a journey
  declares `--frame` once and both steps read it (`min-height: min(var(--frame), calc(100vh
  - 80px))`, so a short window shrinks the frame instead of overflowing it — the old body
  floor fought its own `max-height` there). The ad sheet is **409px** (220 + its chrome);
  the player sheet keeps **529px**, because its master-detail content genuinely fills
  388px. `reviewChanges` takes `steady: 'ads' | 'player'` instead of `true` — **the
  journey names its frame**, `.dlg.rvw.steady-ads` / `-player` — so step 2 measures the
  same as step 1 by construction rather than by two people remembering to add 71.
- **The row that wrapped, fixed rather than budgeted for.** The pre-roll's Start offset
  stacked its `7 sec` field UNDER the Immediate│Delayed segment: a 36px field beside a
  27px segment, 259px of controls in a 240px column. The number now matches the
  segment's height (they are one decision, and looked like two kinds of control), and the
  Pending-changes card gives the form column 16px back (268 → 252, split gap 22 → 20).
  That row: **86px → 44px**, which is what let the frame be 409 and not 445.
- **The out-stream tab says what it can do.** A rotation has no lever to bulk-edit, so
  its body was one stray sentence in a 340px void. It now names the decision that IS
  there — *"Banners take turns — the switch above is the only bulk decision here.
  Schedule, display duration and impressions are set in each ad setup."*

**Result, measured on all four tabs and both steps:** the sheet is **409px, and holds
still** — 199 at rest, 214/220/170 with every lever open, 33 on the out-stream, all
inside the frame, so nothing resizes under the cursor while you work; step 2 comes back
409 too. 120px off a 529px dialog, and the player journey is untouched.

**THE OUT-STREAM LOSES A SWITCH AND GAINS THE BREAKS' OWN WORDS (8 Sep, user call).** Two moves
on one row-set, both in the direction the rest of the delivery settings already went.

- **`Hide during in-stream` is GONE.** The switch asked whether the idle-player banner steps
  aside while a video ad has the screen — and there was never a second answer: an in-stream ad
  **owns** the screen while it runs, and the player steps the banner aside on its own. A control
  with one sane setting is a question with no decision in it, so it goes. **Removed, not hidden**,
  the house rule: out of `SLOT_BEHAVIOUR_FIELDS.outstream`, out of `normalizeSlotBehaviour`, off
  `/panel/meta`, off the wire (`hideOnInStream` is never emitted now), and into
  `DEAD_BEHAVIOUR_FIELDS`, where a payload still carrying it is **refused by name** — *"Hide
  during in-stream is not a setting any more — an in-stream ad owns the screen while it runs, the
  player steps the out-stream aside on its own."* The label and its two words (`Hide it` /
  `Keep showing`) left `web/js/util.js` with it, and `bool` left the ladders' imports as the last
  reader of it. Out-stream delivery is four rows now: Schedule · Display duration · Total Target
  Impressions · Request timeout.
- **`Impression cap` is `Total Target Impressions`, typed.** The same words the breaks got on
  8 Sep, because it is the same idea — how many impressions this slot is aiming for — and the
  out-stream had been saying it in a second dialect (`Impression cap`, suffixed `/session`). It
  reads `fieldName('perSession')` rather than a hard-coded string, like `podAds` and `nextAd`
  before it, so the next rename is one line and the review, the version rail and the row cannot
  drift apart. **Where the shapes differ, deliberately:** a break picks from a fixed 1 / 2 / 3
  segment; a rotation runs the whole session, so out-stream **takes a typed number** (0–20, the
  bounds it always had, refused by name past them — the server's words are *the total target
  impressions* now, not *how many a session*). The `/session` suffix is gone with the old name:
  the row already says impressions, and `num()` now omits the suffix span entirely when a field
  passes none, rather than leaving 13px of dead space beside the value.

The wire key does not move — out-stream still emits `totalImpression`, per the panel's key
policy (legacy keys on the wire, words only in the console). 142 cases: the two out-stream
pins now read the switch as absent, and one new case earns the refusal, saves a typed 12 and
gets refused at 99 with the ceiling named.

**TWO STEPS, NO WORDS: WHERE THIS BREAK'S ADS COME FROM (8 Sep, user call — three cuts in
one review).** *"In the ad setup, in every slot there is not a clear demarcation of three state
— no waterfall, custom waterfall and the global waterfall connected. It is very unclear; it
should be very clear the journey to a layman user."* → *"There are too many switches and CTAs
here… when I come on an ad slot I have the option — do I want a waterfall or no? If yes, custom
or global."* → *"It has to be more simplified, in 2 steps and no text or byline."* → *"This should
be below the primary ad unit."*

**Where it landed.** The question is two questions, and each is its own control, under the primary
ad unit:

```
  ○ Waterfall                                 → nothing serves this break
  ⬤ Waterfall   [ Custom │ Global ]   View     → step two exists only while step one says yes
```

No state name, no counted byline, no dialog. The state is the LADDER under the controls, which
is already on screen, and the closed break row carries the walk.

- **What the words used to carry, the shape carries now.** The consequence of switching off was
  spelled out in a dialog before the act (*"its 10 units are kept, switched off"*). It is now
  three things, none of them prose: the act is instantly reversible (flip it back and the units
  return), the unsaved-change rail marks it like any other edit, and the count rides the one
  hover the tooltip policy still keeps a `title=` for.
- **Switching back on returns the answer you left** (`SU_SRC_BACK`, session-scoped, per break).
  Nothing is stored for it — the server has one answer per break, and inventing a second field to
  remember a discarded one would be a lie in the payload — but inside one editing session an off
  is usually a slip. A fresh load lands on its own units. With nothing at all to come back to,
  switching on opens a first empty row: the answer was "give this break a waterfall".
- **The two refusals grey the direction they refuse, never the control.** `Global` greys while the
  global waterfall is empty. The switch's OFF direction greys while a live integration plays the
  break — the store refuses that save outright (*"Default" post-roll would go dark…*), so
  `suSrcDarkWhy` says so in the same words on hover. That switch is drawn **held, not dead**: it
  keeps the paint that says ON and gives up only a little of it plus the cursor. (Draining the
  accent from its track was tried first and made an on switch read as off, which is worse than
  either.)
- **A seg, after all.** A seg was refused for this decision on 7 Sep, when it stood alone and had
  to carry the whole question — *"pick a view"* is what a seg says, and the source decides what
  serves. Behind a switch it is not the whole question: the switch answers WHETHER, the seg
  answers WHICH, and which-of-two is exactly what a seg is for.
- **`waterfallSource` gained a third value, `none`** (`AD_SOURCES` in `store/state.js`). Stored,
  not inferred from an empty ladder, because *emptying a ladder* and *switching a break off* are
  different acts with different ways back: the first has nothing to come back to, the second has
  everything. All three answers keep the break's own units in `ownRungs` — only served `rungs`
  differ (`[]` for `none`) — and `own` is still the answer said by ABSENCE, so every payload and
  snapshot written before either answer existed reads exactly as it always did. The publish
  snapshot carries any non-`own` answer; the change review calls the move **Where ads come from**.
- **Every count now reads what SERVES, not what is parked** (`suSrcServed`): the closed row's
  glimpse, the placement's unit totals, the dark-pod guard. A switched-off pod is dark like an
  empty one — it keeps its units and serves none of them.
- **What went away**: the `Follow the waterfall` switch and `suWfAsk`; the `+ Add custom waterfall`
  fork of the ladder foot (a ladder break with nothing has no foot at all — its one act is the
  switch); the second cut's whole vocabulary — the stated band (`.src-dot` / `.src-now` /
  `.src-fact`, three tinted skins) and the three-card dialog (`suSrcOpen`, `.src-card`,
  `.chg-why` reasons); `No tags` under an empty ladder (a rotation, which has no source to state,
  keeps `No banner tags yet`); and the closed row's `no demand`, which named the market rather
  than the break — those words stay in the server's refusal.
- **145 cases** (three new in `11-waterfall.spec.js`: nothing serves and nothing is deleted, the
  way back restores exactly what stood, and both refusals by name); the screen walk drives the
  switch and the seg. *(Also cut on review: the second band read `8 of 10 units asked` above a
  ladder whose own rule said `7 of 9 active` and whose foot said `10 of 10` — three true "x of y"
  pairs at three scales, which is how a page teaches a reader to trust none of them.)*

**THE PRIMARY IS THE BREAK'S OWN, IN EVERY ANSWER (8 Sep, user call — two bugs, one root
cause).** *"First of all the enable/disable switch is not working here, and when switched to
global why is primary ad unit being removed? It should stay."* Both traced to the same wrong
model: the switch was made to govern the WHOLE ladder, when what it governs is the fall under
the primary.

- **`setup` and `none` now keep rung 1.** Served rungs are `own`, `[primary, …global waterfall]`,
  or `[primary]`. The primary is this break's own headline demand; a link to a shared ladder is
  not a reason to lose it, and the switch sitting *under* the primary said as much. Over
  `MAX_RUNGS` the overflow is **named in a warning** rather than truncated in silence, and the
  primary is never the unit that goes.
- **That is why the switch was dead.** Switching off used to leave nothing serving, so on every
  break a published integration plays, the store refused the save and the switch greyed itself —
  which on a live setup is most breaks. With the primary carrying the break, switching the fall
  off darkens nothing: the switch is live everywhere except a break with no primary serving at
  all (`suSrcDarkWhy`, narrowed, in the server's own words).
- **The zone draws the primary in all three answers.** `suLadderHtml` gained `ctx.fallHtml` — the
  caller puts the global waterfall's shared settings, or nothing, where the fall's own rows would
  go, and the PRIMARY block above is drawn exactly as it always is. A break with no primary yet
  keeps the controls at the head and offers `+ Add ad unit`; with a primary and its own fall the
  foot adds the next fall rung; with a fall that is not its own there is nothing to add.
- **Two things the change exposed, both fixed.** The publish snapshot stored only SERVED rungs,
  so a linked break's own primary was invisible to the diff (`nothing_to_publish` on a real
  edit) and a restore rebuilt its stash from a frozen copy of the waterfall. The snapshot carries
  `ownRungs` for any non-`own` answer now, and the change review diffs **what the break owns**
  rather than what it serves — the served array is derived, and the waterfall is diffed once at
  the top. (`slotGroupDefs` hands back a bare `{rungs, behaviour}` for a single-group slot, so
  `ownRungs` is read off the slot there, the same fallback the source diff uses.)
- **`asked first, every time` is gone from the PRIMARY rule** (user call, same review): the word
  already names the row it labels.
- The closed break row shows a linked break's own primary badge beside the `GLOBAL` mark — the
  7 Sep rule that hid the walk on a linked break was about not repeating the *waterfall's* story
  on four breaks, and rung 1 is not the waterfall's. **146 cases**: the eight that encoded "a
  linked break serves the waterfall's units" now pin the primary riding first, plus the walk the
  player is handed with and without one, and the fail-closed case narrowed to a break with no
  primary at all.

**THE GLOBAL WATERFALL, NAMED (8 Sep, same review).** *"Rename the top waterfall as global
waterfall or suggest any better name for it."* The bare word collided with the one every break's
own ladder wears: a break said `Waterfall order` about its own fall a centimetre from a switch
reading `Follow the waterfall` about the shared one. It is **Global waterfall** now — the head
section, the connected break's rule, the review's group, the Apply-on-ad-slots dialog and the
server's own refusals — spelled once as `WF_WORD` in `util.js`, and paired on every break with
`Custom`, which is the pair a seller actually chooses between. `Global` beat **Shared** (what it
was called until 7 Sep: co-owned, not one-for-everything), **House** (already means house ads
and promos in this product) and **Default** (implies a fallback that applies when nothing else is
set, where this is a link a break opts into). The closed break row's mark is now `global`. **The
wire key is untouched** — `waterfallSource: 'setup'`, `setup.waterfall`, `ownRungs` — because a
rename that reaches the payload is a migration, and this is a word.

**THE FRONT DOOR (8 Sep, user call).** *"Keeping the design philosophy of the panel in mind
design the login page as well… the IA and fields should be like the one shared."* The panel grew
a real **Log out** on 7 Sep and had nowhere to go: it cleared the page and offered a reload. It
has a way back in now — `web/login.html`, the eleventh stylesheet, and a session the server
actually holds.

- **The reference's IA, kept exactly**: mark and product name · *Welcome back* · *Sign in to your
  account to continue* · one card holding **Email address** (a leading envelope glyph, the
  placeholder speaking the domain the console signs in) · **Continue with email →** full width ·
  `OR CONTINUE WITH` · **Continue as *first name*** with the address under it, a chevron, and the
  provider's mark at the far edge · a hairline · *Don't have an account? **Request access***.
- **Dressed in the panel's own controls, not new ones.** The field is `.field.grow`, so a refusal
  looks like every other refusal; the act is the accent `.btn`; the divider wears the group
  header's micro-label; the account picker is `.eh-menu` / `.eh-item`, the menu every room reads;
  Request access is the house `ask` dialog. The plate takes the frame ladder's first rung (440 —
  it asks one question and offers two answers, which is a confirm). The door loads **01–10 then
  11**: on a subset, the shared dialog would have drifted from the console's (05 refines its
  radius and veil, 08 refines `.dlg-note`), and nothing shared is restated in 11.
- **Two shapes the panel did not already own**: the leading glyph inside the box, and the
  remembered-account row. The row is a *fact* wearing a control — the console has seen this
  person — so the name and address come from `/panel/session`, never from the view (the 7 Sep ME
  rule). Its chevron is a **different act** (choose somebody else) and therefore a second
  control, sitting on the address's own line; the provider's mark is a fact and not pressable.
- **No password field, because there is no password to check.** The door promises nothing it
  cannot do: it never says a link is on its way and never shows a spinner over a check that is
  not happening. What is mocked is the identity provider, exactly as GAM's directory is — written
  down in ARCHITECTURE §11, not dressed up on screen. One quiet line under the plate says the
  only thing a person standing there needs: *your work address signs you in — there is no
  password.*
- **Three refusals, each naming what it read** (`store/session.js`, painted under the field and
  never in the receipt pill): `bad_address` (not shaped like one), `not_work_address` — *Work
  addresses only — x@gmail.com is on gmail.com, not example.com* — and `no_account`, which is the
  Request access door rather than a complaint. The act greys with its reason until the address is
  shaped like one. **Request access names a person** (`ACCESS_OWNER`) and hands over their
  address: a door that says *ask someone* without saying who is a dead end.
- **The loop is closed at both ends.** `POST/GET/DELETE /panel/session` is the one seam the typed
  address, the remembered row and the profile menu's Log out all go through. `main.js` grew **the
  gate**: the session is read once before anything paints, and no session lands on the door — so
  Back cannot walk into the rooms. A reset signs the fixture's first account in, which is the
  world the console has always opened onto, so nothing else moved. A server that does not answer
  is *not* a missing session: the rooms paint and the banner says what failed, because bouncing
  someone to a door that also cannot reach the server would strand them.
- **What went away**: the logged-out plate and `window.SIGNED_OUT` (Log out has somewhere to go
  now), and with them the `.signed-out` rules in 01-base. *(First cut: a sign-out that did not
  reach the server changed nothing and said so. Reversed the same day — see below.)*
- Ten cases in `test/cases/13-session.spec.js` (**139** now), and the door joined the screen walk
  — which also stopped clicking the property switcher the profile menu replaced on 7 Sep, and
  stopped counting a deliberately-earned 403 as a console error.

**GOOGLE LEADS, THE ADDRESS FOLLOWS (8 Sep, same review).** *"Can we swap the google login with
email login… most people will tend to login with google."* The reference put the address first
and the account second; the traffic is the other way round, so the order is too. The remembered
account is now the plate's first object and its only accent; the address sits under the divider,
which stopped saying `OR CONTINUE WITH` and started saying `OR CONTINUE WITH EMAIL` — it names
what follows it.

- **One accent per plate, decided from a fact, once.** With an account to continue as, the row
  wears it and the email act turns `.btn.ghost`. With nobody remembered there is no Google act at
  all — no account to continue AS and no chooser behind it — the row and its divider are not
  drawn, and the email act takes the accent back. The accent never follows the cursor or the
  caret; `doorPaintAlt` settles it at paint and nothing moves after.
- **Why the primary row is not a filled blue button.** The provider's mark is multicolour and
  belongs on white; filling the row accent would either fight it or force a recolour that is not
  ours to make. So the weight comes from the panel's own *this is the one that applies now*
  treatment — `.dlg-card.current`'s accent-tinted hairline on near-white paper, a little more
  air, the accent proper on hover.
- **Two things the swap exposed, both fixed in place**: the ghost act stood 44px under a 38px
  input and read as a second empty box waiting for something (it sits at the field's height
  now), and the row's inner hover fill became a smaller tinted block inside an already-tinted
  row (on the primary the whole row is the hover; the plain row keeps the inner fill, where it
  is the only thing saying the name is pressable).
- The caret no longer opens in the address box unless that box is the primary act, and the line
  under the plate speaks to both paths: *either way there is no password — your work address is
  the sign-in.*

**THE DOOR IS OPEN, AND LEAVING ALWAYS WORKS (8 Sep, same review).** *"It should work when a
user clicks on logout, and for now let it enter based on any email."* Two asks, one story: the
reviewer logged out, landed on the door, and was refused by their own address. Both halves are
reversals of things written hours earlier, and both were wrong for the same reason — a lock is
only honest if there is a key.

- **Any address shaped like an address gets in.** The wrong-domain and no-account refusals are
  deleted. They were a lock with no key: there is no exchange behind this door — no password, no
  token, no OAuth — so *no account here for you* turned away the very people meant to walk around
  the prototype, which is what a prototype is for. **One refusal survives** and it is not about
  permission: `bad_address`, for something that is not an address at all — the server refusing
  what the door's own greyed act already refuses. Fail closed, and the server is the authority.
- **A known address keeps its identity; a stranger gets only what they typed.** The fixture
  accounts carry a name, initials and a role the band and the version history read. An address
  nobody knows is read as a person — the local part's words, capitalised (`asha.rao-nair@…` →
  *Asha Rao Nair*, mark `AR`) — and its **role stays null rather than invented**: the band draws
  no role where there is none, which is the honest shape for a visitor. A visitor is not added to
  the remembered rows either; those are accounts a provider vouched for.
- **Log out is now unconditional.** The first cut refused to move when the sign-out call did not
  reach the server, reasoning that a door you could walk back through is a lie. The way it failed
  proved the trade wrong: against a server that had not been restarted (a pre-change process has
  no `/panel/session`) the act did nothing but drop a pill, and somebody leaving a shared machine
  was left standing in the console. **You leave every time**, and the part we are not sure of is
  the part that gets said: the door carries an amber banner — *you have left the console, but the
  server never confirmed it — it may still hold your session* — passed in the one store that
  survives the navigation (`DOOR_UNCONFIRMED`), read once and cleared. Nobody can use the console
  without a server anyway; being left signed in on screen is the worse failure.
- **A nameless failure got a name.** `api.js` answered any non-envelope error with *Request
  failed*, which is what the stale-server Log out showed — nothing a person can act on. It now
  names the commonest real cause: *the server did not recognise that request — it may be running
  an older version of the console.* No status code and no URL; neither belongs on screen.
- Twelve cases now (**141**), pinning that any shaped address enters, that a known one keeps its
  record, that a visitor is not remembered, and that shape is still refused. The screen walk's
  refused-door step drives `doorSubmit` directly, because the door's own greyed act means that
  refusal is no longer reachable by clicking — and a refusal is a normal answer here, so the walk
  stopped counting the 400 it deliberately earns as a console error.

**AN AD SETUP MAY FILL MANY INTEGRATIONS (8 Sep, user call).** *"Allow the ad setup to be
configured in multiple integrations."* The 26 Aug promise ran one setup ↔ one integration and
the server enforced it by name. It reversed the real case: the same ladder across mweb, desktop
and app is ordinary, and keeping it as a fleet of photocopies means it drifts the first time
anyone tunes one. **Half the rule stands and half is gone:** an integration still asks from
exactly ONE ad setup — a surface has one source of demand — but a setup may now fill as many
integrations as anyone maps it to.

- **The refusal is deleted** (`normalizeKey`): attaching a setup another integration already
  fills is an ordinary attach. Nothing else in the store moved — `usedBy`, `usedByNames`,
  `usedByLive`, `setupLiveCounts` and the delete refusal were always written over the SET of
  holders and had simply been reduced to one by the promise.
- **What replaces the refusal is COUNTING, at every door.** The change modal's foot says *also
  fills “X”* beside the acts; the `Use` screen carries a `SHARED` line — *also fills “X” — an
  edit there moves both*; a card's foot names the holders instead of naming a reason it cannot
  be used; the setup's own page already said *Assigned to A, B*; deleting is refused naming
  every holder; and a publish now agrees with itself — *“A” picks this up* · *“A”, “B” pick this
  up*. Inside the setup editor the singular copy went plural where a count is now real:
  *switched on in 2 of 3 integrations*, *2 integrations play this mid-roll live*.
- **Both acts, on every card.** `Use` and `Copy & use` no longer depend on who holds what — only
  the setup already filling THIS integration has nothing to press. The client's own detour is
  gone too: `mapSetup` used to hand a held setup to the copy door behind the click.
- **A copy is now an intent, never an inference.** Create used to photocopy the mapped setup
  whenever `usedBy` was non-zero — the only legal ending under 1:1. It now copies only when
  someone asked (`copyAtCreate`, set by `Use a copy` and by the chooser's photocopy seed), so
  mapping a shared setup on a new integration means what it says.
- **Duplicating an INTEGRATION still copies its setup** rather than linking (`duplicateKey`): a
  duplicate is a scratch surface, and an experiment that edits demand the original is serving
  from is not an experiment. A surface that wants the shared ladder maps it in one click.
- Re-pinned in the suite: *an ad setup can fill several integrations — the link is allowed, and
  every holder is counted* (two surfaces born on one setup, one ladder edit reaching both with
  no republish of their own, the delete refusal naming them both). 129 cases pass.
  `PRODUCT-SCOPE.md`, `FAQ.md` Q4 + glossary and `ARCHITECTURE.md`'s diagram note now say so.

**THE CHIP IS THE CHANGE DOOR, AND `Open ↗` STANDS BESIDE IT (8 Sep, user call).** *"Swap the
click — clicking the ad setup name chip should open the change modal — and rather than 3 dots
use a preview that opens in a new tab: a mature icon with a name, clean, understood by a
layman."* The strip had it backwards: clicking the NAME of the thing you want to swap opened a
second tab, while the swap hid behind a `⋯`. Now **the chip opens `Change ad setup`** (a `⌄`
where the `↗` was, because a picker sits behind it), and **reading the setup is its own labelled
button — `Open ↗`** — the word plus the arrow that means "elsewhere", the same `open ↗` every
card in the picker wears. The kebab and its one-item menu are gone: nothing hides, and nothing
is a bare glyph. `AD SETUP  [ TOI VideoShow demand ⌄ ]  Open ↗`. *(Later the same day: the word
is `Preview`, the arrow is drawn, and it sits at button weight — see the head of this file.)*

**ONE COLOUR FOR EVERY FACT VALUE (8 Sep, user call).** *"The settings read-only beneath the ad
unit — in it the colour of the value should be same; currently text fields are different colour and
the integer keys are different colour. Use the integer key colour in text values as well."*

- **What was actually two colours was default vs SET**, not text vs number: a fact sitting at its
  default receded (`--ink-faint`, weight 400) and a fact somebody had set stood at
  `--ink-soft`/500 — the under-layer from the 7 Sep UAT round, so ten units would not read as
  forty chips of identical noise. The call is the report of how that lands when you are READING
  rather than auditing: the units in the world happen to have their clocks set and their words
  left alone, so the split reads as *numbers are dark, words are pale* — an inconsistency in the
  value's TYPE, which is not something this line means. Every value is one weight and one colour
  now, and the line still lifts as a whole on hover.
- **What it costs, named:** you can no longer tell at a glance which facts were deliberately set
  and which are simply the defaults — the fold is where that lives now. `.uf.dflt` is still
  emitted (it is a true fact about the value) and deliberately unstyled, so restoring the
  under-layer is one CSS rule, not a re-derivation.
- **`.uf.na` keeps its dim** — a fact that CANNOT apply right now (`Close button` while the content
  pauses) with its reason on hover. That is a refusal, not a default, and it is the one thing on
  the line that has to look different from the rest.

**THE UNIT BLOCK, CALMED (8 Sep, user call — four pointers over three passes).** *"The background
colour of the ad unit is quite distracting and cluttery feeling — can we make it easy on the eyes,
maybe 2–3% black, very light and calm, and an outline that too light and calm … not visually
cognitive on the mind and eyes of the user"*, then, on the first pass, *"tone down the background
more, it is still visually distracting when seeing too many ad units on screen"*; plus *"remove the
space between the drag and the number in the ad unit — maybe the number can be centre aligned"* and
*"the drag & drop icon, the count nos and the switch should be vertically aligned for the ad unit
card; currently it is on top, it should be vertically in the middle so that the card feels as
one"*.

- **NO FILL AT REST — the block is the page, plus a hairline.** It wore `#eff2f7`: a ~5% BLUE-grey,
  which is two problems compounding on a ten-unit ladder. It is a HUE (so it reads as a state — the
  `wants` row is that same move in accent), and a fill REPEATS: one block is calm, ten stacked are
  ten grey bands the eye counts on its way to the name it wants. The first pass took it to ~2.4% of
  a neutral near-black; the second took it to **nothing**. At rest the block is `transparent` with
  a `~4.5%` inset hairline, and the FILL is what it does when touched (hover ~3%) or opened (~2.4%
  under a firmer hairline) — the only two moments it has something to say. One hairline per block
  is cheaper to the eye than one band per block, because hairlines do not stack into a texture.
  This is the exact **opposite trade to the 7 Sep cut**, which dropped the outline *because* the
  fill was heavy enough to carry the shape: with no fill at all, the outline is the only thing that
  says "one unit". The ring is an inset box-shadow, not a border, so the block's box does not grow
  (the drop-line states carry it in their own shadow list, and the collapsed off line takes a third
  lighter ring so it still recedes in a stack). **The field wears a hairline at rest now** — on a
  fill-free block a bare white field stops reading as typeable, and an input has to look like one.
- **The position sits ON the handle.** The number was right-aligned in a 22px column with the row's
  7px gap in front of it, so a `1` floated between handle and switch with space on both sides and
  belonged to neither. No gap at all between those two now, and the digit is **centred in its own
  column**: they read as one leading group.
- **TWO COLUMNS, AND THE LEADING GROUP CENTRES ON THE CARD.** The handle, the position and the
  switch answer for the WHOLE unit — its order, where it is asked, whether it serves — but they
  were the head row's first three cells, so on a two-tier block they sat at the TOP, level with one
  of the two tiers they govern, and the card read as a row with something hanging under it. The
  block is a two-column **grid** now: `.unit-rail` in column 1 spanning every row (so it centres
  against the block's full height), the three tiers stacked in column 2. While the fold is OPEN the
  rail's area narrows to the head row (`grid-row: 1`) and centres on that — centred against a
  250px settings panel it would strand the switch beside `Ad placement`, four rows from the unit it
  switches. **The grid is what makes both exact without a magic number**: measured in the browser,
  the rail's centre lands on 30.5 of a 61px closed block and on 20.5 — the field's own centre line
  — while open.
- **`--unit-x` is retired.** The lower tiers hang off the body column, so the x they share with the
  unit's field is structural; it was a hand-measured `90px` (re-measured twice today) that any
  change to a gap could silently invalidate. The fact line and the settings still land on the
  field's left edge — now by construction rather than by arithmetic.
- **A dead selector found on the way:** `renderSetupForm`'s "scroll to the rung you were sent to
  fill" used `.rung-row.wants`, but `ctx.rowClass` has landed on the BLOCK since the frame landed
  (7 Sep) — so a visitor arriving from an integration's *add a tag here* got no scroll and no
  caret. It reads `.ad-unit.wants` now. The snapshot walk's own `.rung-row .toggle` step moved to
  `.unit-rail .toggle` for the same reason.

**AN OFF UNIT IS OUT OF THE WALK (8 Sep, user call — three pointers on the ad setup).**
*"In the ad setup, in the waterfall, the count should be counted for only the enabled ones. The
follow waterfall should be moved down the primary one. The ad unit which is disabled is technically
made inactive — it should be treated in an intuitive manner, i.e. maybe by tweaking the row by
collapsing it and only showing a sleek minimal info about it so that we can read it to enable it."*
Two of the three are the same finding: a switched-off unit was still drawn, numbered and counted as
if it were serving. It is not asked, so it now holds no number, no columns and no height.

- **Positions are WALK positions** (`livePos` / `posLabel` in views-setups-rungs.js, used by the
  waterfall's ladder, a break's fall, its special tier and a rotation's banners). A nine-rung
  waterfall with units 4 and 6 off used to read `1…9`, so two of its numbers named nobody and the
  third partner actually asked wore a `5`. The numbers now run `1…N` over the units that would
  serve; an off unit wears none at all. Nothing renumbers when a unit is switched back on beyond
  what actually changed — the count is derived per read, never stored.
- **A ladder's counted rule counts real rungs both sides.** `N of M active` on the `WATERFALL
  ORDER` rule now takes M from the FILLED rungs, not the rows: an empty rung waiting to be filled
  used to inflate the total, so a ladder could read *7 of 8 active* with nothing switched off.
- **The `Waterfall order` chips name only the partners ASKED** (`suWfOrderProviders(asked)`). A
  partner whose every unit is off is no longer numbered into the walk. The DRAG still knows about
  it: `suWfOrderSet` permutes the asked partners among the slots they already hold, so an off-only
  partner keeps its place instead of being swept to the tail by a re-order it was not part of.
- **A SWITCHED-OFF UNIT COLLAPSES** (`suUnitOffHtml`, `.ad-unit.off.collapsed`). The dim was the
  whole problem: a full three-tier block at 60% opacity spent a live unit's worth of ink on a unit
  that serves nobody, and made the one line you actually need — *which unit is this?* — the
  faintest on the ladder. It stands down to ONE 28px line at full contrast: handle, switch,
  provider badge, name, and the word `off`, on a tint a shade below the live blocks so the units
  that serve stay the figure. The field goes with the fold — an off unit is not being re-targeted,
  you turn it on first — which is what keeps the line thin. Nothing is lost: every fact stays on
  the rung underneath and the block opens back out, settings and all, the moment the switch goes
  on. No hover explainer on the switch (the room's tooltip policy): the badge is the state.
- **`Follow the waterfall` moved DOWN the primary.** At the head of the AD SOURCES zone the source
  switch was the first thing read on every break, sitting above the row that decides most of the
  revenue. The break's own first ask opens its zone now, and the switch sits where the FALL begins
  — the part of the ladder anyone comes here to swap (`ctx.midHtml`, injected by `suLadderHtml`
  between the lead block and the `WATERFALL ORDER` rule). A break with nothing in its ladder keeps
  the switch at the head: there is nothing above it to sit under, and following the waterfall is
  that break's one act. What the switch DOES is unchanged — following still serves the waterfall
  in place of the break's whole own ladder, primary included, and the dialog still names what
  stops serving, what starts and what is parked.

**CHANGING THE AD SETUP IS A SWAP BETWEEN KNOWN THINGS (8 Sep, user call — three pointers).**
*"Clicking on change should not have the option to select blank, only predefined ad setups mapped
to the same property as the integration; why is Use disabled — Use and Duplicate & use should be
maturely handled, the buttons are sounding immature; and clicking the connected ad setup should
open it in a new tab."*

- **`Change ad setup` lists what exists, on THIS property, and nothing else.** The `+ New ad setup`
  blank card is gone from the change modal — an integration already wired and serving is not the
  place to start a setup from nothing, and the room that owns setups is one click away in the nav.
  The list narrows to `s.property === FORM.data.property`: another property's demand could never
  legitimately fill this surface, so it is not offered and then refused. The kicker names the
  scope (*TOI ad setups — one fills every break*), and a property with none says so in place
  (*No ad setup on TOI yet — one is built in Ad setups*) rather than showing an empty grid.
  **The in-section picker (nothing mapped yet) narrows to the same one property**, since demand
  on another property could never legitimately fill this surface either — one rule, both doors.
  What it keeps is the `+ New ad setup` card: that state has no setup to swap, so building one
  from there is exactly right, and it is the only door that still opens the create trip.
- **A map card only wears acts it can actually perform.** The greyed `Use` is deleted. A disabled
  button whose reason lives in a tooltip makes the reader hunt for what they did wrong, and the
  pair `Use` / `Duplicate & use` read like two function names. In the picker's *acting* mood
  (below), three states, three grammars: *free* — `Use` (solid) and `Use a copy` (outlined);
  *held by another integration* — `Use a copy` alone, the holder named in the foot; *current* —
  no act at all, because it is already the answer: it wears `current` and opens. Both labels now
  start with the same verb, so the choice is between *this setup* and *a copy of it*, not between
  two vocabularies.
- **A copy is a new object, so only its own button makes one.** The card body carries the plain
  pick and nothing else; on the two states with no plain pick it carries no click at all
  (`.sc-read` — hover border kept, cursor and lift dropped). Clicking a held card used to
  photocopy it silently.
- **`Use a copy` STATES ITSELF BEFORE IT RUNS** (same day, second pointer — *"it just abruptly
  attaches with the user having no clue what has happened"*). It was the one act on this page
  that made a new object IN ANOTHER ROOM and announced it with a two-word pill afterwards: a
  setup nobody had named appeared in Ad setups and the chip here quietly became something else.
  Now it opens a 620 sheet that says, in a label column, **`COPIED FROM` <name> · <counted
  demand>** and **`THEN FILLS` every break on “<this integration>”, in place of “<current>”**,
  with a closing line that the source *is left exactly as it is*. Between them sits the field
  that matters: **the person names the copy** — they are the one who will have to find it in the
  setups room next week — prefilled with this integration's own demand, stepped past any name
  already in use. **A name already taken refuses IN the dialog** (`An ad setup is already called
  that`, on the field, nothing retyped) because the server would otherwise suffix it silently.
  The button says what it does in each mode: `Copy and use` on a saved integration, `Copy at
  create` on one still being made — where the note adds that cancelling leaves nothing behind
  and the strip's pill now names it: *becomes “Shorts Rail demand” at create*.
- **Cancel goes back to the cards**, not to nothing: the person is still mid-decision, so
  `changePickCopy` reopens the change modal. And **there is no success toast** — they named the
  copy a second ago and the chip now wears that name; the pill is left free for the one thing the
  swap can genuinely cost, the `N dropped` warning for sections the new setup has no placement
  for (toast policy: silent when the result is visible in place).
- **One door for copies, so nothing photocopies behind a click.** `mapSetup`'s old
  "held setup → duplicate first" branch is gone; it hands the whole case to `mapSetupCopy`,
  which asks. The copy TIMING is unchanged — made immediately on a saved integration, at Create
  on one still being created (`FORM.data.copyAtCreate`, plus the typed `FORM.data.copyName`;
  both are page facts `keyPayload` rightly strips).
- **THE CHANGE MODAL SELECTS; ITS FOOT ACTS** (same day, third pointer — *"let's have the Use or
  Copy & use as CTA on the bottom when changing, and accordingly the second screen shows up with
  clean communication, not too much text, and once the user confirms it attaches"*). Picking and
  acting used to be one click on an 11px button that only appeared on hover, so a swap on a LIVE
  integration happened the instant a name was clicked. Now a card in this modal **selects** — one
  at a time, the selection visible (`.dlg-card.sel`) — and the acts sit where a dialog's acts
  belong: **`Cancel` · `Copy & use` · `Use`**, full size, in the foot. They are drawn only once
  something is selected (an act with no object is a question, not a button), and the foot **says
  in one line why an act is missing** instead of showing it dead: *Pick an ad setup* · *Already
  fills this integration* · *“X” fills from it — take a copy* (that last one leaving `Copy & use`
  as the single, solid act). Selection repaints **the cards' class and the foot by hand** — the
  search box above them is a live input, and a repaint would swallow what was typed.
- **Then the second screen, and only then does it attach.** `Use` — no new object, but on a live
  integration it re-points every break — now confirms too: **`NOW` <current>**, **`AFTER` <new> ·
  <counted demand>**, and, in amber, **what the swap costs**: *“Shorts feed” has no placement in
  it — that section's breaks switch off*. That warning used to arrive as a four-word pill AFTER
  the fact (`1 dropped`); it is now read before it is paid, where a lever still exists
  (`droppedBySetup` / `droppedWords`, one reading shared by both screens and the attach).
  `Copy & use` shows the same shape plus the name field, trimmed to **`COPY OF` · `REPLACES` ·
  Name the copy · *The original is untouched.*** Both foots read **`Back` · the act**, and Back
  returns to the cards **with the selection and the search text still there** — the person is
  still choosing. A screen that carried the warning suppresses the pill afterwards
  (`attachSetupToForm(target, warned)`); the doors without a second screen keep their receipt.
- **…and the demo world had nothing to `Use`** (same day, fourth pointer — *"there is only Copy
  & use, I can't see the Use CTA"*). Not a bug in the foot: the seeded world was seven ad setups
  for seven integrations, **every one of them held**, so `Use` — which the server refuses on a
  setup another integration fills (*"X" already fills "Y" — one integration, one ad setup*) —
  could never legitimately appear, and the setups room's own `Not mapped yet` filter matched
  nothing either. That is not what the room looks like in life, where ad ops build a setup and
  someone maps it later. **Every property now seeds one unmapped setup** — `TOI Shorts demand`,
  `ET Markets Live demand`, `NBT ArticleShow demand` (`api/mock/world.js`, created last so every
  id above them holds) — so every integration opens the change modal with at least one setup it
  can simply use. The seed spec pins it: 10 setups, three unmapped, one per property.
- **The picker keeps the acting mood.** Filling an EMPTY integration displaces nothing, so a card
  there still acts on hover and attaches straight away; `Use a copy` there still opens the copy
  screen, because that one makes an object. One card renderer, two moods
  (`setupMapCardHtml(s, mine, acts | null)`).
- **The connected chip opens the setup in a NEW TAB** (`openSetupTab`, `↗` in place of `›`), and so
  does every card's `open ↗`. The integration you are editing never leaves the screen, so there is
  nothing to stash and nothing to carry home — `openSetupFromKey` and its stash are deleted.
  `KEY_RETURN`/`KEY_RESTORE` stay for the ONE trip that still has to leave: building a new setup
  from the integration page, which must come back here with the new setup mapped.

**SPECIAL · AD SOURCES — the two zone names (7 Sep, user call).** *"Rename Direct to Special, and
Indirect to something relevant, since it will have both direct and indirect — what can we name it
so that it is understood by a layman and works in the context of ads too?"*

- **Direct → `Special`.** The zone holds the ONE deal that jumps the queue and is asked first,
  every time; `Special` says that to anyone, where `Direct` named a sales channel only ad ops
  reads. One label map (`label('slotType', 'direct')`) now feeds the zone head, the integration's
  read-only break row and the bulk sheet's lever, so those three can no longer disagree. The
  server's own word follows (`FIELD_WORDS.direct` → *special campaigns*), and so do the list
  filter (`With special deals` / `No special deals`), the empty CTA (`+ Add the special deal`) and
  the dead-switch reason (`No special deals yet — ad ops add them`).
- **Indirect → `Ad sources`.** `Indirect` named the demand's KIND, and the zone stopped being one
  kind the moment a direct deal could sit in its ladder. What it always is, is where the ads come
  from — which is the word a ROTATION's ladder has worn since 1 Sep. So the rename UNIFIES the two
  instead of adding a fourth word to the gutter rail: every break and every rotation now reads
  `Special · Pods · Ad sources · Delivery settings`. `FIELD_NAMES.indirect` becomes *Ad source
  units* for the diffs, and the server's refusal for a bad `waterfallSource` says *is not an ad
  source* (re-pinned in `test/cases/11-waterfall.spec.js`).
- **THE WIRE DOES NOT MOVE.** `direct`, `indirect` and `waterfallSource` stay exactly as they are
  in the store, the API and the player's JSON — the panel's standing rule that legacy keys keep
  their names and only the WORDS change. Nothing to migrate, nothing to re-publish.
- **The connected count left the waterfall foot** (same call — *"6 ad slots connected — remove
  this text"*), the same call the folded heads' count chips lost to: a number you cannot act on is
  not worth the ink, and `Apply on ad slots` shows every connection by name the moment it opens.
  What stays is the WARNING — `no ad slots yet`, in amber — because that is not a count: a
  waterfall with units that reaches nothing serves nobody, and silence there would read as placed.


**THE AD UNIT IS ONE BLOCK (7 Sep, user call — four pointers, then a review and a question).** *"The ad unit and its
read only settings have to be treated as a single block — it needs to feel as a single block, and
once the settings are opened it should be aligned with the ad unit; currently it passes over the ad
unit in the right side. Remove settings logo and open the settings whenever the ad unit is in focus.
Also try moving the ad unit a bit to the left close to the drag and drop icon, and make the drag and
drop more prominent — currently it is hardly discoverable there."* All four are the same finding:
an ad unit was drawn as a ROW WITH STRAYS — a row, a fact line under it at a hand-measured 126px
indent, a gear at its right edge, and a settings panel that started on the field's left edge and
ran **60px past its right edge** into the row's own `⋯` gutter. Three things asked to be read as
one thing while nothing framed them as one. Reviewed on screenshots the same day — *"the one
block can be improved and made better so that it is intuitive and easy on the eyes and on the page
does not feel cluttered"*, plus the question that found a real hole: *"if the settings block is
opened how to close it?"* The settled shape, after both:

- **One shape, three tiers.** `.ad-unit` is the block — it carries the ground, the hover, the
  drag and the switched-off dim — and the head row, the fact line and the settings are TIERS
  INSIDE IT. Both lower tiers hang off the block's own body column (`--unit-x`, a measured 97px,
  was retired 8 Sep when the block became a two-column grid), so the summary and the editor open on
  the same x as the name they belong to and can never drift apart by a hand-typed indent again — the fact line used to carry a literal 126px,
  and the panel a `margin-right: -60px` that put it 60px PAST the field, over the row's own `⋯`
  gutter. `suUnitHtml` composes the three; every ladder in the room goes through it
  (`suLadderHtml`, and the direct tier's own list). It is `.ad-unit`, not `.unit` — that class
  was already a number field's suffix (`<span class="unit">sec</span>`) and a dialog section's
  spacer, and the block was silently inheriting an 18px margin from it.
- **THE BLOCK IS A SOFT SURFACE, THE UNIT'S FIELD IS THE FIGURE (re-cut, same day — "the one
  block can be improved … easy on the eyes and on the page does not feel cluttered").** The
  first shape was an outlined white card with a tinted, hairline-topped footer. On a nine-unit
  ladder that is nine outlines plus eighteen internal hairlines, on a card that already has
  borders and zone rules — every unit shouting its own edges. Inverted: the block is one tinted
  ground (`#eff2f7`, deepening on hover and while open) with **no outline and no internal
  divider**, and the unit's field is the one WHITE thing on it — bordered only where the caret
  is. *(Re-traded 8 Sep — see the entry at the top: the fill went away entirely and a hairline
  came back to hold the shape, because at 5% ten blocks read as ten bands. The internal divider is
  still gone, and the field is still the figure.)* Figure and ground do what eighteen hairlines were doing, the ad unit's NAME is the
  brightest thing in its own block, and a ladder reads as a stack of soft shapes.
- **THE WAY BACK (user question — "if the settings block is opened how to close it?").** It was
  missing, and the question found the hole: focus and the fact line both OPENED the fold, and the
  fact line is hidden while it is open, so the only exit was opening a different unit. A fold
  needs a visible state and a way out, so there are three now — the **head row is the toggle**
  (`suUnitHeadClick`, which stands down for the row's own controls: the field, the switch, the
  handle, the remove ✕, because each of those already answers for itself and a second click on
  the field must open its search, not close the fold), a **caret at the head row's end** says
  which way it will go (the room's own `.slot-chev` glyph, rotating and turning accent while
  open — a DISCLOSURE, not the gear that went: it names the fold's state, not a room called
  Settings), and **Escape** closes innermost-first — a tag search over the fold, then the fold.
- **Focus is the door; the gear is gone.** The gear stood next to a door — the fact line already
  opened the settings — and putting the caret in a unit's field is what someone does the moment
  they mean to work on that unit. So the fold now opens on `focusin` anywhere inside a filled
  block (one delegated listener, like the click-away that closes the selects), and the fact line
  stays clickable both ways. This is why **both tiers are always painted** and the block's `open`
  class picks which one shows: opening through `FORM.rerender()` would repaint the field the caret
  just landed in and throw the caret away — the toolbar's own lesson. The switch is pure DOM
  (`suUnitOpen` / `suUnitClose`), one unit open at a time, and focus LEAVING the ladder leaves the
  fold as it stands — a panel that closed itself the moment you reached for a control elsewhere
  would be a flicker, not a behaviour. An empty rung has no settings, so focusing it opens nothing.
- **A real handle.** The grip was 14px of braille glyph at `opacity: 0` until its row was hovered:
  a 4px speck, invisible to anyone who had not already found it. It is now six drawn dots at the
  block's leading edge, standing at rest, answering to the pointer like a button, and dragging the
  whole BLOCK (tiers and all) rather than the head row. A ladder's order is its most consequential
  fact; the control that changes it has to look grabbable before it is tried.
- **The unit moved left, and the words that were holding it out there moved up.** 52px of
  right-aligned position column put 42px of void between the grip and the unit's field on every
  numbered row — and the only thing paying for that width was the word `Primary`. The word moved
  to a **rule above its block**, in the exact grammar the fall has always used (`WATERFALL ORDER ·
  6 of 9 active` gains `PRIMARY · asked first, every time`): same distinction, said once instead
  of per row, which is the pattern this room already chose for the fall. The column now holds a
  POSITION — two digits' worth — the field rides ~44px further left with its handle beside it, and
  every unit in a ladder starts on the same x. A rotation still NAMES its rows (`Banner 3`) and
  keeps the wide column (`.rung-list.rot`).
- **A filled unit's field opens QUIET.** With focus as the door, clicking a unit's name used
  to land a one-row search menu on top of the settings it had just opened — naming the unit you
  already picked. `lookupHtml` grew a `quiet` opt (the dead `data-quiet` seam, now earning its
  keep): a rung that already holds its unit still SELECTS its value on focus but does not open
  the menu, and the click that caused the focus cannot reopen it (stamped, 500ms, so a Tab that
  never clicks does not swallow the next one). Typing replaces the selection and opens the search
  on the first keystroke; a second click opens it outright. An empty rung is not quiet — its
  field's whole job is the search.
- **The fact line kept its content and became COLUMNS.** Every fact of the unit's type, fixed
  order, defaults included, dimming in place when one cannot apply — all unchanged. What changed
  is the clutter: the tinted pills went (chips on a tint = two grounds saying one thing), and
  each fact now names its column (`data-f`, a `min-width` per fact in CSS) so `Content pause`
  sits at ONE x down the whole ladder. Nine rows of repeated labels read as a column the eye
  learns once; nine ragged lines read as noise. To make that hold across types, **the two
  banner-only facts moved to the end** of both the fact line and the settings (`… Ad placement ·
  Ad unit template · Close button · Auto-hide`): the four facts EVERY unit has now fill the
  first four columns on every row, so a video row and a banner row line up all the way across
  and the banner simply carries two more — no holes, no jumps.
- **The settings PAIR UP.** Six one-per-line rows made an open block 440px tall against a 100px
  closed one, with the right two-thirds empty — the fold shoved the rest of the ladder off
  screen to show six short answers. `auto-fit` columns pair them (93px at 1440/1760, falling back
  to one column at 1280, measured), and the pairs fall out honestly row-major: the two clocks
  that decide WHEN, the two facts that decide WHERE and THROUGH WHAT, and on a banner the two
  that decide how it leaves. The row grammar is untouched — there are simply two per line.

*Pinned:* `npm test` (128 cases) and the full `test/ui-snapshot.mjs` walk — 60 screens, no console
errors, the two pre-existing `.ps-btn` misses unchanged. Checked in headless runs: drag-reorder, the
empty rung, a switched-off unit, "an edit keeps the panel open", all three ways to close (caret /
head row / Escape, and that the row's own controls are not swallowed by the head-row toggle), the
quiet-focus field in all four of its states, and the block at 1280 / 1440 / 1760 (the fact line
never wraps or overflows its block at any of them).


**PLAYER CONFIGS, PASSIVE VOLUME AND THE FRAME LADDER (7 Sep, user call — three pointers).**

- **The default player config became row zero, literally.** The Details card's last row used to
  be drawn on the config table's grid *in a different card* — near-alignment with the real table
  below, and the same three labels printed twice (sentence-case field labels floating over that
  row, uppercase column heads over this one, 90px apart). Two half-tables reading as one broken
  table, which is what "too disoriented, not pleasing to the eyes" was pointing at. The row now
  lives **inside** the configs table as its first row, under the ONE heading row: identity
  `Default` (a word, not a typed key), the three facts in the columns, and no switch or `⋯` —
  the default cannot be switched off or removed, so those cells stay empty rather than offering
  dead controls. The fieldset is **Player configs** now, not *Custom* player configs, and it
  never shows an empty state (the default row is always there). Details keeps only what is the
  PLAYER's rather than a config's: type, fallback media, passive volume. `pcFactsHtml` is gone.
- **Passive volume left both bulk player sheets.** *"Why do we have the passive volume — that is
  not part of the default or custom player config?"* — exactly right, and the server already
  agreed: `PATCH` a config carrying `passiveVolume` and it is refused (`test/cases/10-player-configs`
  — *"a fork carries no volume — the player has ONE Passive volume"*). A player config IS playback
  mode, MiniTV expansion and autoplay; passive volume is the player's own, like its type and its
  fallback media, and it is edited in Details. Gone from `Default player behaviour` (four rows to
  three) and from the `DEFAULT` block of `Custom player behaviour`, along with its caret caches
  (`PB_TEXT`, `DC_TEXT`) and `pbNum`/`dcVol`. **Trade-off accepted:** passive volume can no longer
  be set across a cohort in one act — it is a per-integration field again. `BULK_PLAYER_FIELDS`
  still accepts it, so the capability is one row away if it is ever wanted back.
- **THE FRAME LADDER — three modal frames, and the height floor is opt-in.** Measured first,
  because "the modal is big to carry this less info" was true of two dialogs and false of the
  rest: a confirm and the ad-slots grid already fitted exactly, and the card choosers and the
  master-detail sheet genuinely FILL their 860. The two offenders both had a hard-coded
  `min-height`, applied at the 860 house width to content three rows tall:

  | dialog | was | now |
  |---|---|---|
  | Default player behaviour | 860×481 (221px dead) | **620×245** |
  | THE CHANGE REVIEW, standalone | 860×529 (278px dead) | **620×267** |
  | Custom player behaviour (master-detail) | 860×529 | 860×529 — fills it |
  | New integration / ad setup chooser | 860×505 / 860×609 | unchanged — cards fill them |
  | `ask()` confirm · Apply on ad slots | 440×146 · 620×(content) | unchanged — already exact |

  So: `.dlg` **440** for a confirm, `.dlg.sheet` **620** for a form or a list (content height,
  scrolls past the viewport), `.dlg.wide` **860** for cards and master-detail, which need the
  width for their columns. And **`.steady`** carries the floor instead of every sheet wearing it.
  The floor was never about size — a journey that resizes between its steps reads as a different
  dialog arriving and the eye re-finds the footer, which is real, but only where there IS a next
  step in the same dialog. The tabbed ad sheet and the master-detail player sheet earn it and
  keep it (their reviews pass `steady: true`, so step 2 measures the same from the outside);
  a single-screen sheet was paying for stability against nothing. THE CHANGE REVIEW is the
  interesting case — it is step 2 of a bulk sheet *and* a standalone confirm from Save / Publish /
  Restore / Delete, so it wears both footprints: `.dlg.rvw` 620 natural, `.dlg.rvw.steady` 860
  with the 411px floor. Retired with the ladder: **`.dlg.step`**, the dead guided-journey frame
  (680px, a 530px body floor) whose two wizards died on 3 Sep — nothing had rendered `dlg step`
  since. One consequence of 620: a long from→to line in the review (a renamed setup) now wraps to
  two lines where 860 held it on one — compactness bought with a wrap, deliberately.

**THE BAND, THE GAP AND THE PILL (7 Sep, user call — three pointers in one review).**

- **The profile menu took the property switcher's seat.** The header band's right seat held
  a global property scope (`window.GLOBAL_PROP`, persisted in localStorage) that every list,
  picker and count filtered through; it holds WHO IS SIGNED IN now — initials in a soft
  circle, first name, role under it, one chevron — opening the **platform-standard dropdown
  the user asked for**: the identity at its head (whole name + email, the one place they
  belong on screen), then **View profile** and **Log out**. The menu borrows the header ⋯
  menu's grammar whole (`.eh-menu`/`.eh-item`) so it reads like every other menu here, and
  its open state is pure DOM closed by the same global click-away. *View profile* is the
  identity read-only in a one-button dialog, saying once at its foot that sign-in and access
  are managed outside the console — no fields that would refuse. *Log out* is confirmed
  (it clears the page you are standing on), then clears what the console holds locally and
  paints the signed-out plate with a **Log back in**; `route()` stands down behind
  `window.SIGNED_OUT` so browser Back cannot paint the rooms again. **`meLogOut()` is the one
  seam tech swaps** for the real sign-out call and its redirect. (The first cut of this seat
  had no menu at all, on the reasoning that a Sign out with no session to end is worse than
  none — the user's call stands over it, so the act is real and ends what the console
  actually holds.) The identity is invented data, so it comes from the fixture through
  **`meta.me`** (`api/mock/world.js` `ME`) — the view layer never makes up a name, and when
  auth lands the session answers there instead. Consequences of the switcher's removal:
  **both lists always offer the Properties filter** (it used to hide itself whenever the
  switcher was already narrowing, which is now the only way to narrow), a new ad setup starts
  with an empty property either way, and **`inScope()` survives as the one seam property
  scope ever came through** — it answers "yes" for every object today, and the properties a
  session grants will answer there without a call site moving.
- **Demand and Modified were touching in the ad setups list.** Demand was a fixed 190px
  holding 203px of chips, so the chips overflowed their own cell padding and sat ~18px off
  the Modified label while every other gap in the row was ~100px — and the fix was in the
  columns either side, not in Modified: Integration was spending 305px on 147px of names.
  Demand now takes the **same 22% share as the keys list's Active breaks** (identical chips,
  identical share — the two lists breathe alike, and the gap measures 130px against the keys
  list's 131px), Integration takes the **16%** its longest name actually needs, and the name
  column keeps 30.5% so Property still lands on the same x in both rooms.
- **The receipt says the act and nothing else — 3 to 5 words, one line** (asked three times,
  so it is now enforced in `toast()`: a newline and anything after it is dropped). What a
  pill IS decided the rule: two seconds, bottom of the screen, nowhere near where you are
  looking, so nothing that has to be READ goes in it. Everything that was riding it moved to
  a home that already existed: **a save's soft warnings** ("Shorts feed mid-roll: 4 breaks —
  a lot") now read on THE CHANGE REVIEW under a quiet amber `Worth a look` (`pubFlagsHtml`),
  before the act rather than chasing it; **skipped and left-alone lists** went back to the
  rows, which show their own state (a bulk sweep says `28 changed · 4 skipped` and stops);
  **consequence clauses** went to the confirm that already carried them (`Off air —
  the ad setup serves nothing until…` is just `Off air`, because the dialog above it said
  the rest and the person agreed to it); **exact values** went to `title=`. A dead break
  switch keeps its whole reason on hover and says the short one on click. The one text the
  pill still carries whole is a **refusal with no home** (`'bad'`): a seam error we could not
  place in the page, where the sentence IS the information.

**THE WATERFALL (6 Sep, user call; re-cut twice on 7 Sep).** One indirect ladder at the
AD SETUP's head — beside the other shared plumbing, under AD UNIT TEMPLATES — that any
pre-, mid- or post-roll break, per placement and per pod, can be CONNECTED to instead of
holding its own units. A LINK, never a copy: edit it once and every break connected to it
moves together. **It is called `Waterfall`, one word** (7 Sep, user call — *"rename shared
waterfall to waterfall only"*): the setup has exactly one of them, and the alternative
already wears its own name — a break's `Custom` waterfall — so `shared` was a qualifier
against nothing. The rename runs through the head section, the folded glimpse, the closed
row's mark, every diff and refusal label (`Waterfall: …`), the review's group order and
the test file (`11-waterfall.spec.js`). The grammar, in order:

- **The section** (`views-setups-waterfall.js`, the pseudo-slot `'shared'` in `suSlot`,
  so every rung helper — add, toggle, remove, drag, tag search, fact line, settings tier —
  works on it unchanged): UNITS is the ladder in the page's exact rung grammar, but in
  plain positions `1…N` over the units that would be ASKED (8 Sep — a switched-off unit holds
  no number; see the entry at the top) — **a waterfall has no primary rung** (7 Sep, user call), so no
  lead row, no Waterfall-order rule splitting it, and the one add act is `+ Add
  waterfall tag` from the first unit on — and the cap is not a NOTE (`10 of 10` removed
  7 Sep, user call): the add greys in place with the cap as its reason, which is what
  every other refused option here does.
  The head's folded line SHOWS the waterfall instead of describing it (7 Sep, user
  call — counted prose was distraction): the provider walk in badges, off/depth-cut units
  dimmed in place; nothing when empty. **The count chips are gone from all three folded
  heads** — AD UNIT TEMPLATES, WATERFALL and PLACEMENTS (7 Sep, user call): a
  number you cannot act on is not worth a chip, so templates fold to the title alone and
  Placements keeps only its break chips.
- **AD SLOTS — `Apply on ad slots`, THE GRID** (7 Sep, user call, third cut — *"rather
  than having a place on section let's have a CTA … it opens up a modal which contains a
  grid, i.e. rows have the ad section and columns have pre, mid pod 1, pod 2, pod 3,
  post, and we can enable/disable whichever slots we want this waterfall connected to"*).
  It opens the whole two-dimensional truth at once: **ad
  sections down the side, the breaks across the top** — `Pre-roll │ Pod 1 · Pod 2 · Pod 3
  │ Post-roll`, the pods under a floating `MID-ROLL` band, vertical hairlines bracketing
  the family — and **one tick per cell**. What it replaced (`Place on`: one button per
  break KIND, then a sheet of rows to untick) could only ever ADD, said nothing about which
  placement a break belonged to until you opened it, and spent three buttons on a fact with
  two axes. The grid **connects and takes off in the same pass**, and its foot names the
  delta both ways (`Apply — connect 4, take off 1`), staying unavailable with its reason
  while there is nothing to change. A cell whose break does not exist sits out with **its
  reason on hover** (`“Default” holds one pod`); the out-stream never appears at all — a
  rotation takes turns, so it has no waterfall to follow. The two AXES are the
  bulk acts and cost no extra control — a column header answers that break for every ad
  section, a section name answers every break of that row. One quiet merged receipt after
  the write (`Waterfall connected to 4 slots, taken off 1`) — the act reaches breaks
  across placements you cannot see from the section.
- **THE GRID, CRAFTED (7 Sep, fourth cut on user review — *"this is too badly designed and
  not at all looking clean and intuitive; we don't need count and all here and it should
  be crafted very thoughtfully since it will bulk apply"*).** Four things were wrong and
  all four were the same mistake — ink that was not an answer. (1) **The per-cell unit
  count is gone.** It was a second data dimension nobody was deciding about, and it pushed
  every tick off its column's centre, so five columns of answers read as ten columns of
  something. A cell now holds ONE thing — ticked, unticked, or a faint dash where there is
  no break — dead centre, and the tick is the only ink that moves. (2) **The console's
  global `thead th` chrome is stood down inside the grid** (`position: static`, no tinted
  band, no 10px uppercase tracking): this is a grid of answers in a dialog, not one of the
  data tables, and the inherited slab was painting grey behind the header and fighting the
  column names. Both axis labels share ONE baseline (`vertical-align: baseline` — the
  corner micro-label reads a size down, so bottom-aligning their boxes staggered the
  text), and every answer column is **the same width** (86px): it is a matrix, and
  content-sizing made `Pre-roll` half again as wide as `Pod 1` for no reason a reader
  could use. The band's own underline went too — the vertical hairlines already bracket
  the pods, so a third line only thickened the header. (3) **A bulk act shows its reach
  before it lands**: hovering either axis lights the cells that axis would answer
  (`.reach`, painted imperatively — one class on the cells, not a `:has()` chain per
  column), and the generic `tbody tr:hover` tint is stood down so a highlight means
  exactly one thing. (4) Everything the pass would move wears the session's own tint
  (`.chg`), so the foot's counted delta is legible **in the grid itself**.
- **THE ACT SITS IN THE UNITS FOOT (7 Sep, user review — *"we don't need an ad slot
  section, we can have this CTA at the bottom right of the Units itself"*).** A whole
  `AD SLOTS` zone row with its own label, holding one button, was a section standing for a
  control. The ladder's foot already carries the section's other act, so this one takes
  the far end of it: **`+ Add waterfall tag` left, `Apply on ad slots` right**, with the
  counted fact of where the waterfall stands between them — and **emptiness is a fact, not
  a silence**: a waterfall with units and no slots serves nobody, so the foot says
  `no ad slots yet` in the warn amber rather than letting a blank space imply it is placed.
  (Fixed on the way through: `.slot-add` had **no `:disabled` style** — only the retired
  `.wf-follow` carried its own — so every `disabled title="…"` add button on the page
  looked exactly like a live one. It greys now, which is the house rule.)
- **The levers live AT THE LINK (re-cut 6 Sep, user call — settings in the section were
  settings for nobody until something followed it)**: the head section holds ONLY the
  ladder; every connected break carries the levers, and they stay ONE
  set of global answers on the waterfall itself — setting them at any connected break IS
  the bulk edit. *Waterfall depth* is the bulk sheet's own seg (`1 · 2 · 3 · Full`),
  counted over live units; *Content pause* is a plain `Auto · Yes · No` seg — Auto (the
  default) is each unit's own answer, Yes/No one answer for every unit, their own kept
  underneath. *Waterfall
  order* is the integration page's OWN chip control, standing first in the levers
  (re-cut 7 Sep, user call — the Tweak-order switch went first, then row-drag followed
  it out: a connected slot never reorders units by hand): one numbered chip per partner
  behind the waterfall, in walk order, dragged into the order they are asked
  (`suWfOrderChipsHtml`) — a drop re-arranges THE waterfall's units, stable within a
  partner, for every break connected to it (per-unit fine ordering stays the head
  section's own drag).
- **A CONNECTED BREAK SHOWS THE SETTINGS, NOT THE LADDER** (7 Sep, user call — *"the view
  should show the waterfall order, waterfall depth and content pause to be precise, while
  the actual waterfall can be previewed by scroll spy taking to the waterfall section"*):
  the three answers that are precise to this break. The read-only
  MIRROR of every rung went out with this cut: it retold the waterfall's own story on
  every connected break, four times over, in the one place none of it could be changed,
  and the order chips already say who is asked in what order.
  **STACKED, in the page's own settings grammar** (re-cut same day, user review — *"one
  under the other, not in one row"*): the three are `.lr.rule` rows on a `.bhv-grid`
  column, which puts them on the SAME label edge and control edge as the DELIVERY SETTINGS
  zone directly below — one edge running top to bottom through the break. Strung across
  one line they read as a toolbar and started a draggable chip control, a four-way seg and
  a three-way seg at three different x's; stacked, each is a setting with a name, which is
  what it is.
- **The door rides the SOURCE row** (7 Sep, user review — *"remove this text 'this break
  walks 3 of 3 units' and 'view this waterfall' can be more appropriately placed"*).
  `View the waterfall` used to sit under the levers behind a dashed rule, wearing a
  counted line that repeated the depth lever back at you. It belongs on the row that says
  WHICH waterfall is serving — you read the source, you go and look — so it takes the far
  end of that row (`suWfJump` still walks the scroll up and flashes the section once:
  found, not hunted for), and the settings below are left as settings, nothing else. The
  source row shares the settings column's width, so the link's right edge lands on the
  same x as the delivery controls'.
- **THE SOURCE IS ONE SWITCH, BOTH WAYS, LOSING NOTHING** (7 Sep, user call — *"there
  should be an option to switch to a shared waterfall if a custom waterfall is
  configured, while the vice versa is also needed, i.e. there should be an option to
  switch off the custom waterfall but it stays so you can anytime come back to it"*).
  Every ladder break opens its INDIRECT zone with a two-answer seg — **`Waterfall │
  Custom`** (`suWfSourceRowHtml` → `suWfUse`) — standing whichever answer is lit, with
  the **unlit answer's stash counted beside it** (`custom waterfall kept · 3 units, off`
  / `3 units in the waterfall`), so the switch never hides work it is holding. Switching
  **deletes nothing**: the break's own rungs stay exactly where they are while the
  waterfall serves it (the server has always kept them as `ownRungs`; the form used to
  wipe `slot.rungs` on connect, which shipped `ownRungs: []` and gutted the stash on the
  next save — that is fixed here), so coming back is one click with nothing re-typed. The
  seg greys as a whole, never half-lit, while the waterfall has no unit AND the break is
  not on it: there is nothing to decide until the head of the page has something in it.
  **Two controls went out with this cut**, both because there is no consequence left to
  confirm: the empty-break-only fork (`+ Add custom waterfall` *or* `+ Shared waterfall`,
  offered only while there was nothing to lose) and the confirmed `Remove the shared
  waterfall?` on the mirror's rule line — with it, the published row's `⋯` (a published
  setup now has no break menu at all: its one door is the seg in the row). A break with
  nothing parked lands on `+ Add custom waterfall`, empty. **Clear still means clear**:
  it takes the demand, the parked custom units AND the link, and names all three, counted,
  before anybody confirms (`suSlotClearWhy`, `suSlotUnits().parked`) — the gentle way off
  the waterfall is the seg, which keeps them.
- **…AND THAT SWITCH NOW ASKS — THE SEG WAS THE WRONG SHAPE** (7 Sep, user call —
  *"the tab in ad sources i.e waterfall or custom should not be tabs since the idea is to
  switch from one to another so it should be a switch with a dialog and confirmation a tab
  just does not communicate this flow"*). The two-answer seg above is gone. A seg is how
  this app says **pick a view** — it is the version rail's `All │ Published` — and the ad
  source is not a view: it decides which ladder actually serves. So the row wears the
  house switch now, reading **`Follow the waterfall`** (`suWfSourceRowHtml` → **`suWfAsk`**
  → `suWfUse`), and it **asks before it moves**. The dialog is where the flow is finally
  legible: it names what stops serving, what starts, and — counted — what is kept for the
  way back (*"Its 3 units are kept, switched off — turn this back off and they return
  exactly as they stand"*; the empty case says it starts with nothing to ask). That last
  line is the point — the act is still non-destructive both ways, so a confirm that only
  said "are you sure?" would be a nag; **naming the stash is what makes it safe to try**.
  The grey narrowed with it: only the **unlit** direction is ever blocked (following an
  empty waterfall), because a break already following is always free to come back — it
  greys where it sits, reason on hover, never a control that vanishes. `suWfUse` stays the
  plain writer, so the Apply-on-ad-slots grid and restore are untouched. The house
  `.toggle` finally uses the `gap` it always carried for a label nobody had
  (`.toggle.tiny.wf-src-sw`). The snapshot walk gained both dialogs as screens of their
  own — and **lost a dead step**: it used to click `Custom` while Custom was already lit
  (`suWfUse` early-returns, so it captured the same screen twice) and then called landing
  ON the waterfall "back". It now round-trips own → follow → own, and says so.
- **The closed row of a connected break wears the `waterfall` mark AND NOTHING ELSE**
  (7 Sep, user call — *"if it is a shared waterfall only show that icon, don't show the
  IMA › CAN › GPT too"*): the walk is the waterfall's story, told once at the head of the
  page where it can be changed — repeated on four connected breaks it read as four
  different ladders. An unconnected break keeps its own walk. Out-stream takes turns — a
  rotation has no waterfall to follow, so it never offers the seg (and the server refuses
  the link by name).
- **Model — materialized, one truth**: `setup.waterfall = { rungs, depth, pauseAll }`;
  a slot/pod carries `waterfallSource: 'own'|'setup'` (absence = own, so everything
  saved before the field existed keeps serving) and `ownRungs` (the kept arrangement),
  while `rungs` stays the SERVING truth — `servedWaterfallRungs` stamps it on every
  normalize, so the walks, the drive decisions over them, the seam, the publish plane
  and the player's JSON are all unchanged code reading one truth. Fail closed both ways:
  gutting the waterfall a LIVE connected break stands on refuses naming the surface, and a
  connected break over an empty waterfall is "no demand" everywhere a switch could light.
- **The diff reads the link, not the echo**: the waterfall diffs ONCE by name (ladder,
  depth as Waterfall depth, pause as Content pause); a connected break's rung changes are
  skipped (they mirror the waterfall) and only its link moving is a line (`its own
  units → waterfall`). Restore puts the LINK back, never a frozen copy — and a
  snapshot's own-by-absence is made explicit so restoring an own-units version unlinks.
- **Waterfall in place of fallback, project-wide (user call)**: `Fallback order` is
  **Waterfall order** (drive row, bulk sheet, diffs), the setups ladder rule line and
  `+ Add waterfall tag` with it, and every refusal that said "display fallback" now says
  the waterfall settles on one display unit. The one deliberate exception: **Fallback
  media** (the player's backup CONTENT, not an ad ladder) keeps its name.
- The demo world seeds it on `TOI VideoShow demand` — three units, the Shorts feed
  post-roll following them with its own unit kept, parked — so the link, the levers and
  the switch's way back are visible on day one. 8 API tests (128 total); the UI-snapshot
  walk covers the grid, its two bulk axes and the switch in both directions.

**WHAT THIS SESSION TOUCHED WEARS A QUIET TINT (7 Sep, user call — asked earlier,
delivered only in the review sheet; now in BOTH editors).** Every key changed since the
last save carries a soft background (`.chg`, one tint, figure-ground) exactly where it
is edited: a rung row (toggled, swapped, refacted), a delivery-settings row, a drive
row, a player fact, a custom-config cell, an identity field, a waterfall lever,
a new placement's tab, a moved link. HONEST, not sticky: the mark compares against the
last-saved baseline (`FORM.saved`, set at load and after every save), so typing a value
back to what it was clears its tint, and Save clears them all — the rail's pending
block owns saved-vs-air from there. Mechanics: `chgIf` + a generic `paintChg` pass over
`data-field` wrappers (dot paths reach `player.*`), render-time predicates for rows
(`suBhvDirty`/`suRungDirty`/`suSavedSlot`, `driveDirty`, per-config index compare), and
live toggles from the typing writers so a keystroke tints without a repaint. A create
page has no baseline and tints nothing. 14-check tint probe + the 62-check UAT.

**…AND THAT TINT IS GONE — THE MARK IS A RULE NOW (8 Sep, user call — *"the fields which
are modified its background is changed but its getting too cluttered and confusing with
the background change we do something more clean and mature here"*).** The diagnosis was
that **the app had four near-identical pale blues meaning four different things**: an ad
unit's hover/open (`#e8ecf4`), the apply grid's reach (`#f3f6fd`), a rung someone was
sent to fill (`.wants`, `--accent-soft`) and the change tint itself (`#ecf3fe` /
`#e4edfe` / `#e6eefb`). So a changed unit read as a hovered unit, and a config row whose
four cells each tinted read as **five loose blocks instead of one changed row** — the
clutter, precisely. **BACKGROUND IS FOR INTERACTION**; a change is provenance, not a
state you are pointing at, so it took its own channel: a **2px rule down the leading
edge** in `--chg` — the amber this app already meant unsaved by, the break tab's
`.edot`, which now reads the same token. One hue, one meaning, at every scale, and it
never argues with a control's own colour again. Two shapes, by host: **a rule where
there is an edge to run it down** (field, settings row, ad unit, source row, placement
tab) and **a dot where there is not** — the apply grid, where a full-height rule down a
cell edge read as a column divider rather than a mark. The marks are drawn out of flow
(`::before`), so they move nothing: every `padding`/`margin` compensation the fills
needed (`.field.chg`, `.wf-src.chg`, and the three `.pcfg-*` cells) went with them.
**And the player-config row is marked once, not four times** — the rule says which row
holds unsaved work, THE CHANGE REVIEW says which field and from what to what; that
division is why one mark is enough.

**`Impressions per break` is `Total Target Impressions` (8 Sep, user call).** Renamed
where words live — `FIELD_NAMES.podAds` in `web/js/util.js` — and the three screens that
had each hard-coded the same string (`controls.js` → `behaviourRowsHtml`, the bulk AD
BEHAVIOUR sheet, the integration's Ad behaviour card) now read `fieldName('podAds')`
instead, so the next rename is one line and the diffs, the version rail and the review
cannot drift from the label. The server's own refusal words already said *target
impressions count*, so they needed nothing.

**`Pod fill order` is `Waterfall fill order`; `Display ad position` is GONE (8 Sep, user
call).** The rename is the same one-line move as above (`FIELD_NAMES.nextAd`, the screen
reading `fieldName`) — what it names is the walk down the *waterfall*, so the pod was
never the right noun. The removal is the house rule, not a hidden field: **`Display ad
position` said "position" about the POD (`Last position only` / `Any position`) while an
ad unit's own `Ad placement` says "position" about the SCREEN (`Player bottom`, `L-band
50`)** — two settings, one word, and the guessable reading was the wrong one. So it is
**removed, not hidden**: out of `SLOT_BEHAVIOUR_FIELDS` on all three ladders, out of
`normalizeSlotBehaviour`, out of `/panel/meta`, and into `DEAD_BEHAVIOUR_FIELDS`, where
a payload still carrying it is **refused by name** with where the answer lives now. A
display unit settles the break, exactly as it always did on the default. **Two
consequences worth stating: `podBanner` leaves the player's JSON, and a break that had
been set to `any` settles to `last`.** 129 cases (the refusal is the new one).

**THE INTEGRATION KEY IS ON THE LISTING, ONE CLICK TO COPY (8 Sep, user call).** The list
is where someone goes to fetch a key for a colleague, and the only copy in the product
was inside one integration's ⋯ menu — open the row, open the menu, copy, go back. It is
the row's second line now, under the name: the key in mono, quiet, with the copy glyph
**always drawn** (a control that waits for a hover is a control nobody finds — the same
call as the drag grips). Its click is stopped before the row's, so reading a key never
navigates away. It reuses the house `copyText` and the same receipt the ⋯ gives (*API
key copied*) — and `copyText` **stopped failing silently** while we were in it: a
clipboard write is refused outright in an insecure context and by some permission
settings, and saying nothing there leaves someone believing they copied a key they did
not, so the failure now gets the pill too.

**THE LISTING'S STATUS DROPPED THE COUNT (8 Sep, user call — *"just unpublished is
enough"*).** `3 unpublished` is now `Unpublished`: **how many** changes wait is a fact
for the page that can act on them, where the rail already counts them; a list is scanned,
and all it owes the reader is whether this one has work waiting. It is also **suppressed
where the state word already says it** — a never-published draft used to read
`Unpublished` and then `1 unpublished` directly under it, the same word twice down one
cell, which was the noise. A live object with a saved-but-unpublished draft reads
`v1` then `Unpublished`.

**`Take off air` is `Deactivate` (8 Sep, user call).** The ⋯ item names its subject —
**Deactivate integration** / **Deactivate ad setup** — and the confirm behind it follows
(*Deactivate "name"?*, the red `Deactivate`, the receipt *Deactivated*). **The ACT was
renamed; the STATE was not.** `Off air` is this app's own word for where the thing lands
and it stays that everywhere it is read back — the status chip, the version rail's
*Taken off air*, the delete refusal's *On air — take it off air first*. Two words on
purpose: you deactivate a thing, and then it is off air.

**THE COUNTS LEFT THE REVIEW, AND THE HEADERS BECAME HEADERS (6 Sep, user).** The foot's
`N changes` said what the list already shows; in its place a sheet may state what the
list IS — the one fact the count never carried: `compared with v3 on air` (an old
version), `what it changed when it went out` (the live one). And the titles name their
OBJECT the way a header should: `Version 2` (kicker: who · when; the note quoted under
it), `Publish “TOI VideoShow demand”` (kicker: `replaces v3 on air`) — never a count, a
question mark, or a dash-chain doing a sentence's work in a title's place. (7 Sep, user
call: the RAIL's per-version `N changes` followed the review's counts out — a version
row is `v3 · on air · note · who/when`, and the sheet behind the click says the rest.
The pending row keeps its count: how much goes out next IS that row's one fact.)

**THE VERSIONING SURFACES, SQUARED UP (6 Sep, user — "badly placed IA, stacked one
over another"):** (1) **The rail sits on ONE grid** — a row's head, note and who·when
share a single left edge (the note had drifted 22px off it). (2) **The sheet's head is
three things in three places**: the title names the comparison (`v2 — vs v3 on air`),
the kicker carries provenance alone (`Rohit (monetization) · 1d ago`), and the person's
note stands as its own quoted line under the title on the dialog's grid — the
dash-chained four-fact kicker is gone, and `restoring lands as vN` left for the restore
screen, which is where the act's facts belong. (3) **The note field joined the foot** —
`1 change · [Add a note — optional] · Cancel · Publish`, one composed line; the
floating full-width bar over the body's void is gone.

**A VERSION'S SHEET IS THE DELTA FROM THE AIR, ONLY (6 Sep, user — two calls: "on v10,
how do I know WHY I'd restore v7 when I can't visualize what would change?", then "don't
show what it changed — only vs the current on air").** The two-view seg lasted an hour:
the deciding question has one answer, so an old version's sheet opens straight on it —
`v7 — vs v10 on air`, the counted delta restoring would move (prefetched from the same
read-only preview the restore flow reads), kicker carrying who · when · the note ·
`restoring lands as v11`. The version's own story survives where it belongs: the rail
row's counted size, and the live/off-air rows' sheets (they have no delta to show). A
version identical to the air says so in place of a list and offers NO restore door (it
would only meet a refusal). Restore stays one further click, taken with the delta seen.

**THE SESSION IS CAPTURED WHOLE, AND THE RAIL BECAME A TIMELINE (6 Sep, user — three
calls in one round):**

1. **Publish fails closed on unsaved edits.** The review reads what is SAVED, so edits
   made after the last save were silently absent from it — the exact dishonesty the
   review exists to prevent. Publish saves them itself (re-cut 7 Sep, user call: the
   `Save your edits first?` dialog was a toll booth — a save writes only the draft, which
   reaches no viewer, so it needs no confirmation of its own): one click saves quietly
   and opens the review of the whole session; a cancelled review still receipts
   `Saved — not published`, and a refused save stops the flow with its own message.
   The Publish button is always live while editing (the count and the greyed state went
   with the dialog — a disabled button can't see unsaved edits, since typing never
   repaints the header); with nothing to ship, the review itself says
   `Nothing to publish` and offers no act.
   Both editors provide the seam (`PUB.dirty` / `PUB.saveNow({quiet})`); `pubReload` keeps it.
   And a genuine diff hole closed with it: a POD's OWN deal never diffed (pod 1's
   doubles as the slot's and was covered; later pods' weren't) — every pod's Direct now
   answers for itself (`Default · Mid-roll group 2 · Direct`).
2. **The changed KEY wears a quiet tint** in every review row (`.rvw-f`, the fact-pill
   grammar) — scanning what moved is figure-ground, never weight.
3. **The rail is a timeline; the sheet is the reader.** Inline diffs in a 260px column
   were heavy at three changes and unreadable at ten. A rail row is one quiet entry —
   version · counted size · the person's note · who and when — and clicking it opens
   THE CHANGE REVIEW read-only: the same grouped room every change list is read in, at
   any size, with `Restore this version…` as the sheet's one further door (and the
   pending block opens the same way: `Saved, not published — goes out on the next
   publish`). The chevron, the inline `.v-changes`, and the in-rail restore link died
   with the old shape.

**PUBLISH AND RESTORE ARE ONE SCREEN, AND A VERSION CAN CARRY YOUR OWN LINE (6 Sep,
user call).** Restore's bespoke dialog (`.rst-*`) is deleted: both acts end on THE
CHANGE REVIEW, identically — restore's list is what going back CHANGES, counted from
what is on air now; its kicker carries provenance and destination in one line
(`Rohit's v2, 1d ago — goes on air as v5; v4 stays in history`); the one warning worth
a block is the counted draft work a restore would discard, read last (`.rvw-warn`).
Between the evidence and the act sits ONE quiet line — `Note for the version history —
optional` — written at the exact moment the person has re-read the session's changes
and can name it. The note travels with the version (`entry.note`, clipped at 200, never
refused; a note alone mints nothing) and reads back under it in the rail like a commit
log: `v4 · ON AIR / "CAN paused while their endpoint flaps" / You · just now`. The
review reads MORE like the session now too: `Waterfall` leads the group order,
a setup's `Default · Pre-roll` groups sort break-first instead of alphabetically, a
rung TOGGLE diffs as the one fact a person did (`TOI Video Backfill · off → on`, never
remove-and-add), and the diffs speak seconds, never milliseconds (`1.5s → 2s`). The
demo world seeds notes on as_1's history so the rail shows the grammar on day one.
+1 API test (128).

**THE JOURNEY OUT MIRRORS THE JOURNEY IN (6 Sep, user call — the mirror's foot stacked
a fact and two acts into one mumble, and leaving skipped the ceremony entering has).**
Both directions are now stepwise, in the confirm grammar every destructive act here
already speaks: FOLLOWING from a filled break ASKS first, counting the own units it
replaces (`Removes 3 own ad units — it asks the waterfall’s 3 units instead`); from an
empty break it stays one click — nothing to lose. LEAVING is the break's own **Clear** —
one concept, no second door: on a linked break it is active, titled `Stops following
the shared waterfall`, its confirm says the waterfall itself is untouched, and
confirming empties the break so the journey restarts exactly where it began — the fork.
The foot sentence died with the second door: the mirror now opens with ONE header in
the ladder's own rule-line idiom — `SHARED WATERFALL · walks 2 of 3 units ——— view` —
then the rows, then the levers. Nothing else. (The kept-units stash left the UI with
this: what Clear removes, Clear says — nothing is silently remembered.) `Clear all ad
units` detaches followers too, counted in its confirm.

**THE LEVER STANDS IN EVERY BREAK, AND THE HOVERS WENT ON A DIET (6 Sep, user — two
calls):** (1) `or Follow the shared waterfall (3)` was offered only on an EMPTY break —
strictly the fork's decision moment, but nobody could find it in a world where every
break has units. It now stands quietly in EVERY ladder break's foot, beside the add
button: safe on a filled break because following keeps the break's own units, so it is
always one click back. The fork principle survives — only one road ever SHOWS (ladder or
mirror); the foot's lever is the road sign, not a mode tab. (2) **Hover titles, project
pass**: a hover earns its place in the journey and says it in ≤5–6 words — counted facts
and refusal reasons stay (`Removes 3 ad units`, `2 ad units still request through it`),
restated visible text and paragraph-long explanations went, and the `(JSON: x)` tails
left the hovers (the player-contract mapping lives in docs/PRODUCT-SCOPE.md). Swept: the setup
editor whole (rung switches, the unit block's tiers, zones, Clear, pods,
placements), both head sections, the templates table, and the drive's rows.

**THREE POLISH CALLS (6 Sep, user):** (1) **Modified and Status swapped on both lists**
— Modified sits mid-table on the pinned 190px the `who · when` pair actually needs, and
Status closes the row at the right edge on the slack (the trailing-column treatment
travels with the position). (2) **The unit fact line steps further back (fourth pass)**:
full-ink values still pulled the eye off the unit names, so the whole line is an
UNDER-LAYER now — values in soft ink at plain weight, pills a step smaller, and hovering
the line lifts it back to readable-first. The ladder reads top-to-bottom by unit name;
the facts are noticed in passing, attended at will. Prominence via figure-ground, never
weight — the panel's own rule, applied once more. (3) **The head-row glimpses grew up**:
the counted facts moved to the RIGHT edge beside the chevron — the break rows' own
glimpse position — and dropped their prose tails (`none`, `none yet`; the explanation
lives on the hover title). `AD UNIT TEMPLATES … 2 templates · 1 off ›`.

**THE UAT'S SIXTEEN P2s (7 Sep, night, user call — "work on fixing these"):**
*Consistency.* (1) The DEFAULT PLAYER BEHAVIOUR bulk act now ends on THE CHANGE REVIEW
like its two siblings (`dcChanges`/`dcApply`) — this reverses the 3 Sep "one step" call,
because SCOPE promises every cohort write is read field by field and this was the only
one nobody read first; Back restores the sheet with its levers still set. (2) The
Details card's two Playbacks are `Player type` (inline / redirect / YouTube) and
`Playback mode` (Active / Passive). (3) "Template" meant three things: the create pages
now say `Player preset`, the setup says `Delivery preset`, and only the request template
is an `Ad unit template` — the closed unit line uses the settings tier's exact words, so
`Companion position` → `Ad placement` and `Skip offset` → `Close button`. (4) The Ad
Setups list pages at 50 with the Integrations pager's own control (`SPAGE`,
`paintSetupPager`, `resetSetupPage`).
*Text.* (5) Booleans say Yes / No, never True / False. (6) The unit fact line keeps its
fixed set (4 Sep: nothing appears or vanishes) but a fact AT ITS DEFAULT is an
under-layer (`.uf.dflt`) — ten units stopped reading as forty chips of noise, and a bent
value is the one that carries ink. (7) Refusals speak the UI's words everywhere:
`fieldWord` now covers the player's own fields (no more "passiveVolume must be…"), the
publish refusal names breaks and pods rather than raw slot keys and "group N", and the
resolved rows say pod. (8) The rotation row is `Banners take turns`, not two sentences.
(9) The header slot says `none yet — pick one below`. (10) The last explainer hovers are
gone (bulk Direct, cue points, the without-deals chip, Reset to setup trimmed to its
consequence).
*Honesty.* (11) Every seeded object carries an author — five setups (66 at scale) used to
read `You · just now` out of a reset, which reads as a broken Modified column; as_1 is
re-stamped after its seeded version history, which used to overwrite it. (12) An ad
setup belongs to ONE property: the picker offers real properties only and Save refuses
`Pick the property this setup belongs to` in the field, so "All properties" is never
stored as a setup's property.
*Missing.* (13) A closed break row shows its walk — four provider badges, `+N`, the pod
named when a mid-roll has several — the grammar the list rows and the resolved rows
already used. (14) A cue point the panel cannot read is refused by name where it was
typed (`driveCueBadWhy`) and blocks Save; it used to drop silently. (15) TAKE OFF AIR
exists (`takeOffAirClicked`, in publish.js beside its inverse) on both editors' ⋯ menus,
so Delete's "take it off air first" finally points at a door; the seam still refuses a
setup feeding a live surface. (16) The bulk sheet's `Set` is visible at rest — hidden
until hover, five levers read as five grey facts beside a disabled button.
128 green; every screen clean at 1440 and 1280 in both scenarios.

**REFUSE IN PLACE — THE UAT'S SEVEN P1s (7 Sep, evening, user call after a PM-lens
UAT of the panel):** (1) A refused template save stays in its dialog: `askForm` takes
`submit`, runs the write while the form stands, and a refused field wears its reason
under it (`data-dfield`); nothing is re-typed. (2) A setup another surface fills greys
USE with the holder named ("“X” fills from it — one integration, one ad setup") and
makes DUPLICATE & USE the card's act; the setup filling this integration wears
`current`. No silent photocopy. (3) An empty pod a live mid-roll would go dark on says
so ON ITS TAB the moment it is empty (`suPodDarkWhy`, `.stab.err`), and Save/Publish
stop on the page with the placements open and the pod selected — before any review or
request; the seam's own refusal lands in the same banner, in the UI's words ("Pod 2 in
“Default” is empty — TOI Mweb VideoShow plays its mid-roll live, so every pod needs an
ad unit"). (4) Every card picker past eight cards wears a search that filters in place
(`dlgSearchHtml`/`dlgCardsFilter`), and honours the property scope — 67 cards is a
list, not a wall. (5) What the page already knows is refused on the page BEFORE THE
CHANGE REVIEW (`keyClientErrors`: name, domains for web platforms, package name for
apps, a bad config key); `applyServerErrors` is silent when the refusal landed in its
field (toast policy). (6) A break switch that cannot move is dead in place with the
reason — "No out-stream demand for Default, Shorts feed — ad ops add it in “…”" — the
same test `secSlotToggle` applies, so it never flips nothing and toasts "Left off".
(7) A reserved or duplicate config key goes red where it was typed with the reason under
it (`PC_BAD`), a duplicate placement name goes red on its tab (`SU_SEC_BAD`), and Save
stops on the page while either stands. Server refusals say Mweb/Desktop, not the enum.
128 green; verified headless.

**THE PLACEMENTS GLIMPSE TALKS IN MARKS (7 Sep, later, user call — the counted prose
`2 placements · 25 ad units · 1 break follows the shared waterfall` read as clutter):**
the head row now wears the listing's own break chips (`PRE MID POST | OUT`, lit where a
break carries demand) with a connected break in the waterfall's blue, and a quiet
number chip when there is more than one placement (`suPlacementsGlimpse`, `.pl-glimpse`,
`.uchip.linked`). The exact story rides the hover — the templates chip's own grammar.
Nothing else on the line.

**CLEAR IS A BUILD-TIME TOOL, AND PLACEMENTS JOINS THE FOLD (7 Sep, user — two calls):**
(1) The break's `Clear` and the header's `Clear all ad units` exist only while the setup
has NEVER been published (`suClearable`: no versions yet). Once a version has gone on
air both are GONE — not greyed: emptying a live surface's demand wholesale is not an act
this page offers; a published setup is changed unit by unit, deliberately. While they
stand, the break's Clear left the gutter — a bare word floating at the row's edge was a
second dialect — and sits behind the row's `⋯` (the templates rows' kebab grammar),
dimmed when there is nothing to clear. One door survived publishing at the time — a
LINKED break's `⋯` offering `Remove the shared waterfall`, because a one-way fork is a
trap — **superseded later the same day**: the source seg stands in every break's INDIRECT
zone whatever the publish state, so a published setup has NO break menu at all and the
way off the waterfall is right there in the row, costing nothing. (2) PLACEMENTS wears
the head sections' exact fold: `PLACEMENTS · PRE MID POST | OUT ⌄`
— one disclosure grammar for the whole card. It differs in one deliberate way: it is the
room's work area, so it OPENS on load where the shared plumbing rests closed; a refused
save forces it open (fail visible), and the strip's standalone label died — the section
head names it now.

**THE HEAD SECTIONS FOLD (6 Sep, user call — open, AD UNIT TEMPLATES and the shared
waterfall pushed PLACEMENTS below the fold).** Shared plumbing is read far less often
than placements are worked in, so each head section rests as ONE line wearing its
counted facts — `AD UNIT TEMPLATES · 2 templates · 1 off ›`, `SHARED WATERFALL ·
3 units · followed by 1 break · 2 deep · pause Yes ›` — and opens in place: the break
rows' own disclosure grammar, one page up (`SU_HEAD_OPEN`, `suHeadRowHtml`, `.shead`).
Closed on every load; a refused save forces the section open (fail visible), and the
mirror's `edit at the head of this page` door opens it before travelling. The whole
editor — head, placements, all four breaks — now rests inside one 900px viewport.

**THE POD STRIP WEARS THE PLACEMENTS STRIP'S GRAMMAR (6 Sep, user call).** The `Pods`
eyebrow, the one-size-down tabs (`.grp-tabs`) and the right-edge `Remove pod N` link
were a second dialect for the idea the placements strip already speaks. Now: full-size
tabs, `+ Add pod` beside the last one, and remove is the × on the pod you are standing
on (behind its confirm; never offered at one pod). The dead dialect's CSS
(`.scope-eyebrow`, `.grp-tabs`) went with it — zero references verified before removal.

**POST-HANDOFF CALLS (4 Sep, user — three, in order):**

1. **Custom config rows carry a SWITCH, and Remove moved behind a ⋯.** Each row's right edge is
   now a toggle (state — always visible) and a ⋯ menu holding `Remove config` (the rare act; the
   hover-only `×` it replaces put the destructive act closer to hand than the reversible one).
   The switch is a rung's grammar server-side: `on` on the config, absence = on, so every config
   saved before the field existed keeps serving. Off keeps the row, its key and its facts — dimmed
   in place, switch and ⋯ at full strength — and players asking for it follow the default player.
   A switched-off config is NOT in the player's JSON (and the emitted shape never grows the `on`
   field; all off = the field leaves the JSON entirely, like a surface with none). The rail and
   the save review read the move in words: `amp_stories: off → on`, one line, named by key. The
   demo world seeds `amp_stories` off so the switch is visible on day one; +1 API test (118).
2. **The Ad behaviour title row says AD SETUP, chip only.** The `FILLS FROM` eyebrow renamed to
   what the chip IS; clicking the chip still opens the setup's real editor (← keeps your edits).
   The `who · when` byline is gone — the setup's own page carries its history — and `change`, the
   rare act, stepped back into a ⋯ beside the chip (`Change ad setup…`, same modal as before).
   "Becomes this integration's own copy at create" still shows while creating over a held setup.
   Unmapped is unchanged ("nothing yet — … pick it below", cards in the section).
3. **Request templates are AD UNIT TEMPLATES, drawn as the config table.** The chips strip is
   gone; the section (still at the head of the ad setup editor) speaks the custom-config table's
   grammar: eyebrow title, ONE heading row (`TEMPLATE · REQUEST URL · IN USE`), the name as a
   fixed identity column with the provider badge, the URL it fires in mono, the counted use, a
   per-row ⋯ holding `Delete template` (dimmed with the counted reason while ad units request
   through it), and `+ Add template` at the FOOT. A row opens its own editor dialog (unchanged
   inside; titled `New ad unit template` on create). The unit panel's row and the LABELS
   vocabulary say `Ad unit template` too, and the server's refusals renamed with them
   (`An ad unit template named … already exists`). The `⋯` row-menu machinery is shared:
   `rmenuToggle`/`rmenuShut` in controls.js, `.row-kebab`/`.rmenu-list` in 03-controls.css,
   items in the header menu's `.eh-item` grammar, closed by the existing global click-away.
4. **The GAM sync lives IN the ad-unit search** — the `sync GAM units` CTA left the placements
   line (a page-level act for a search-level problem). The moment the directory answers nothing
   for what you typed, ONE action row appears at the menu's foot: a refresh icon, `Sync ad units
   from GAM`, and the counted staleness that explains it (`directory synced 2h ago`). The real
   pull takes 10–20 seconds, so it runs IN PLACE: the row becomes its own progress line (spinner,
   `usually 10–20 seconds — results refresh when it lands`), the field keeps its focus and its
   query, typing on is fine (the in-flight row stays while a pull runs, so progress never
   vanishes under a narrowing query), and when it lands the same search re-runs — a unit
   trafficked this morning simply appears where you were looking for it, the row dissolves, and
   the toast counts what arrived. A menu closed before it lands still gets the toast; no confirm
   dialog (a read-only, idempotent pull). Machinery: `lookupGamRowHtml`/`lookupGamSync` +
   `GAM_SYNCING` in controls.js, `items.gam` attached by `tagSearchItems` when GAM returns zero
   units for the query, `.lk-sync`/`.lk-spin` in 05-tag-forms.css; the mock's `/panel/gam/sync`
   answers after ~1.8s (instant under test) so the in-flight state is real. Removed with the CTA:
   `syncGamClicked`, the strip markup + `.gam-sync` CSS, the now-dead `GAM_LAST_SYNC` global (the
   row reads `lastSync` fresh from `gamUnits` per query), and the never-instantiated `.suggest`
   component (`suggestInput`/`suggestSyncRetry`/`suggestPick`/`SUGGEST_REGISTRY`/`slotSourceBadge`
   + its `.sug-*` CSS) whose empty-state "Sync GAM & retry" button this feature supersedes. Also
   unfused an orphaned `.lk-scope button.on` selector head that had left `.lk-note` unstyled.
5. **The default player's three facts are ROW ZERO of the configs.** *(Superseded 7 Sep — see
   the head of this file: the row moved INTO the configs table, because drawing it on that
   table's grid from a different card only approximated the columns and printed the three labels
   twice.)* The Details card's last row was drawn on the config table's own grid (`.pcfg-t` /
   `--pcfg-cols`, one source of truth): a `Default player config` identity label where the table
   keeps its keys — bottom-aligned to the control line, the same divider rule running through
   both cards — and Playback mode / Expand MiniTV / Autoplay behaviour in the columns their forks
   take in the card below. The older `.frow.pfacts` even-share flex row approximated even less;
   its CSS is gone too. A fork reads, visibly, as "this row, under a key".
6. **Save/Publish/⋯ end exactly where the cards end.** `.ehead.with-rail` reserved
   `290px` (260 rail + 30 gap) but forgot the 26px its own full-bleed negative margin swallows,
   so the header actions overhung the form column's right edge by exactly 26px — now `316px`,
   and the ≤1100px media query (rail hidden) drops the reservation to the base 26px so the
   buttons keep ending on the card edge at every width, on both editors.
7. **Ad unit templates carry the row switch too** — the config rows' exact grammar: an
   always-visible toggle anchors the corner, the ⋯ (Delete) reveals on hover, an off row dims
   in place keeping its name, URL and counted use. Model: `on` on the template (absence = on,
   `normalizeTemplate`); a switched-off template's units request through their provider's
   STANDARD — `walkEntry` skips it, so the unit's `tpl` flag and the `unittpl` map never name
   it, and all-off/unused behaves like no template at all. THE HONESTY POINT: templates resolve
   LIVE (no publish plane), so the switch reaches players on their next request — the toggle's
   hover and the counted toast both say "from the next request" (`“X” off — its 3 ad units
   request through the provider's standard, from the next request`); no confirm, no review,
   exactly like every other template edit. The unit panel's template select keeps off templates
   pickable (legal, just inert) wearing a `· off` micro-suffix. The world seeds `GAM
   low-latency` off so the state is visible on day one. +1 API test (119).
8. **The lists' slack is split evenly — the Active breaks → Modified void is gone.** Pinning
   the name at 300px sent every spare pixel to the last column, so ~450px pooled between the
   break chips and the right-aligned Modified while every other gap was ~100px. The name column
   is proportional now (keys 28%, the one column whose content can use the room — Off air /
   unpublished chips fit inline beside the name again), and the tables run `table-layout:
   fixed` because auto layout treats widths as hints and re-deals slack by content (the setups
   name landed 70px wide of its ask; `calc(% + px)` on a th is also dropped under fixed layout
   in Chrome, so the setups name is a plain 30.5% ≈ keys checkbox+name, within ~7px across
   1200–1760 — Property still lands on the same x when switching screens, Δ1px at 1440). The
   checkbox column is pinned at 36px so nothing depends on layout-quirk leftovers. Modified
   still right-aligns to close the row; verified at 1200/1440/1760 and on the scale scenario.

**BRANCH `Ui/UX_Changes` (4 Sep, user call — under review against main):**

9. **Every ad unit is TWO rows: the unit, then its values as a quiet fact line.** The unit's
   settings used to live only below the fold (the ⚙ panel, one at a time) — reading a ladder's
   values meant opening ten folds. Row two now carries EVERY fact of the unit's TYPE upfront
   (user picked this over a curated subset and over news-only): fixed order, defaults included,
   FULL labels in plain case (re-cut on review — 9px label stubs read as noise; "complete
   context" won), each fact a QUIET TINTED PILL (third pass — bold values read heavy, and the
   free line ran past the unit's field): label faint, value medium ink, prominence from
   figure-ground not weight, and the line ends where the ad unit's field ends (66px right
   gutter), wrapping cleanly when a type's six facts need it — video: `Content pause · Request
   delay · Companion position · Template`; display adds `Ad placement · Skip offset ·
   Auto-hide`; a rotation banner is `Ad placement · Template` only. Type-based, never value-based: a fact that cannot apply right
   now (Skip while content pauses) dims in place with the reason on hover; a switched-off rung
   dims its line whole. The line is the SUMMARY, the ⚙ panel stays the EDITOR (user picked this
   over inline row-2 controls): clicking the line or the gear opens it, and while open the line
   hides — the panel IS that row, expanded, on the same 126px left edge. *(7 Sep: the gear and the
   126px indent are both gone — the line and the panel are tiers inside one `.ad-unit` frame, and
   focus opens the fold. See "THE AD UNIT IS ONE BLOCK" at the top.)* Words are the panel's
   exactly (`label('pause')`, `label('displaySlot')`, the template's name with its `· off`
   suffix), so glance and editor can never disagree. Applies to the indirect ladder AND the
   direct-deal tier. `suRungFactsHtml` in views-setups-rungs.js, `.ad-unit-facts` in
   10-surfaces.css.

10. **Templates table lost its In use column; the unit panel tightened.** The counted use
   still speaks where it acts (row hover, switch toast, ⋯ Delete's reason, dialog foot).
   The ⚙ panel runs 30px rows with compact controls scoped to the panel alone — six fields
   as one sleek block, and the wider number box stops the placeholder clipping.
11. **A STATUS column on both lists** — the round-28 cut reversed with richer content (user
   call): `Unpublished` (never published) · `● v3` (on air, counted) · `● v5 · from v2` (the
   live version is a restore — provenance named) · `Off air` (taken down), with the amber
   `N unpublished` gap as its own quiet line under the state. Same `.stat` grammar as the
   editor header chip, so a row and its editor never disagree; the name-side chips died with
   it (one fact, one place). `publishView` grew `liveRestoredFrom` + `everPublished`; Demand
   went fixed-width (chips never grow), Status 118px, both tables still fixed-layout.
12. **The setup editor's hierarchy, restated** (user call — headers read weaker than the
   buttons under them): AD UNIT TEMPLATES and PLACEMENTS step up to 12px headers; the
   templates section closes with a hairline so the two sections read apart; the break names
   (Pre-roll…) are 13px ink — the row's own header over its DIRECT/INDIRECT zone labels; and
   rung labels right-align to HUG their switch (a bare `1` no longer strands 40px of void).

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
6. **Details is ONE row of short answers** (re-cut 7 Sep — the forkable-facts row below it went
   into the configs table; see the head of this file). Player type, Fallback media and Passive
   volume are all short answers (a mode, a media id, a number), so they share one row at their
   natural widths like Property · Platform above them — growing them split the row 50/50 and left
   a select adrift in half a row of nothing.
7. **The mapped setup rides the Ad behaviour TITLE ROW, at the right edge.** `FILLS FROM` eyebrow ·
   a prominent accent chip with the setup's name (click = the open-and-return trip, edits kept;
   hover = the demand summary) · the quiet meta (`who · when`, plus "becomes this integration's
   own copy at create" while held) · `change`. It briefly sat on its own line under the title and
   read as a second heading. Unmapped still says "nothing yet — every break fills from ONE ad
   setup; pick it below". `.ads-fills` / `.st-chip` survive so the probes' reads stay honest.
8. **Player configs carries no byline** ("a player asking by key gets that row…"): the KEY
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
10. **A map card offers two acts on hover** (*8 Sep, first: `Use` and `Use a copy`, and never a
   disabled one. 8 Sep, later — SUPERSEDED: the acts left the corner for the card's foot, at rest
   and right-aligned; the corner belongs to the selection tick. See the head of this file.*) —
   in the card's TOP-RIGHT
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
12. **Every break can be cleared, and the whole setup at once — while it is being built.** The
   break's `Clear` sits behind a `⋯` at the row's right edge (the templates rows' grammar — 7 Sep,
   the bare gutter word was a second dialect), dimmed when there is nothing to clear. `Clear all ad
   units` is in the setup's `⋯` menu, which renders while creating too. BOTH ARE BUILD-TIME TOOLS
   (7 Sep, user call): once a version has been published they are GONE — not greyed — because a
   setup that has gone on air is emptied unit by unit, deliberately, never by one sweep. Clear
   means the DEMAND: the indirect ladder, the direct deal, and on a mid-roll the extra pods, which
   collapse back to Pod 1. Placements, their names and every delivery setting stay. Both confirms
   count first and name what goes ("Removes 15 ad units from 5 breaks across 2 placements (Default,
   Shorts feed)"), and nothing leaves the page until Save.


## Layout (production handoff, 3 Sep 2026; api/ and test/ re-cut 7 Sep)

**`ARCHITECTURE.md` is the current map** — directory layout, the model, request flow, the
two planes, web conventions, how-tos and the production gaps. The dated `*-SCOPE.md` decision
records are now chapters of `docs/DECISION-RECORDS.md` (twelve scope documents merged into
one), and `docs/SCOPE.md` is now `docs/PRODUCT-SCOPE.md`. The block below is kept as the
handoff record; where it and ARCHITECTURE.md disagree, ARCHITECTURE.md is right.

Self-contained: `npm install && npm start` (port 4200), `npm test` (128 cases, ~1s,
self-hosting on :4299; `test/run.js` runs `test/cases/*.spec.js` over `test/harness.js`). No build step — plain scripts in dependency order (`web/index.html`
documents the order). Everything invented lives in `api/mock/`; `POST /panel/mock/reset`
rebuilds the world with the same ids.

    api/server.js            assembles the app: middleware, static web/, one router per subject
    api/error-handler.js     handle(): a thrown Refusal → { error, message, ...details }
    api/response-shapes.js   what the API answers with (keyView, setupView, tagView, …)
    api/bulk.js              POST /panel/keys/bulk — the cohort acts
    api/routes/*.js          meta · keys · setups · tags · publish (+ /panel/live) · gam · mock
    api/store.js             the model's front door — re-exports api/store/ whole
    api/store/state.js       the in-memory maps, vocabulary constants, ids, reset
    api/store/validate.js    shared refusal helpers (refused-by-name lives here)
    api/store/tags.js        ad tags + request templates
    api/store/ladders.js     slot behaviour, cue points, rungs, the walks
    api/store/setups.js      ad setups: placements, pods, deals, CRUD, GAM directory
    api/store/keys.js        integrations: identity, player, custom configs, the drive
    api/store/publish.js     THE PUBLISH PLANE + the seam checked at the boundary
    api/store/version-changes.js  what changed, in words (was store/diff.js until 7 Sep)
    api/mock/world.js        the seeded world + named scenarios
    web/js/util.js           escaping, LABELS vocabulary, toasts, house dialogs
    web/js/api.js            every request as a named operation — no view writes a URL
    web/js/controls.js       shared form machinery (FORM session, selects, lookup, drag, segs)
    web/js/publish.js        THE PUBLISH PLANE (rail, versions, restore)
    web/js/review.js         THE CHANGE REVIEW (one screen every write ends on)
    web/js/views-tag-lookup.js     the ad-tag lookup control
    web/js/views-setups-list.js  Ad Setups list + the new-setup chooser
    web/js/views-setups-editor.js       the ad setup EDITOR (ops room)
    web/js/views-keys-list.js    Integrations list, filters, selection, bulk bar
    web/js/views-keys-bulk-ads.js    the three bulk acts (ad / custom player / default player)
    web/js/views-keys-editor-load.js    one integration's page 1/4: load, accessors, setup mapping + return flow
    web/js/views-keys-editor-ad-behaviour.js   2/4: Ad behaviour — the walk mirror, the drive, break tabs, the card
    web/js/views-keys-editor-player.js  3/4: the player fields + the custom-config table
    web/js/views-keys-editor-frame.js   4/4: page frame, payload/diff, save/create/delete, the chooser
    web/js/main.js           hash router
    web/css/                 the stylesheet, split 01–10 (pure partition of app.css — numeric
                             load order IS the original cascade; later rules still win)
    test/run.js              the runner: boots the API, runs test/cases/*.spec.js (128 cases)
    test/harness.js          req/test/eq/assert + shared fixtures
    docs/PRODUCT-SCOPE.md    what the product does, for engineering and non-engineering readers
    docs/DECISION-RECORDS.md every dated scope document, merged (incl. the store split's rules)
    docs/FAQ.md              the engineering hand-off FAQ

The four parts of the integration page and the ten css files are PURE PARTITIONS (3 Sep): cut at
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
UAT. `docs/PRODUCT-SCOPE.md` is the product's scope document — written for engineering and
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

- **`open`** (on the mapped chip and on every card) **went to the ad setup's real editor**, with
  the integration draft stashed (`KEY_RETURN`) and restored on the ← (`KEY_RESTORE`). *Superseded
  8 Sep: `open ↗` opens the setup in a new tab, so nothing is stashed for a read; the stash now
  serves only the create-a-setup trip.*
- **`change`** opened **the same card modal the New-ad-setup door uses**: `+ New ad setup` first,
  then every setup as a card (in use/free · counted demand · who touched it · its own `open`).
  `pickSetup`/`cardPickDialog` (the two-step picker with the preview pane) are deleted.
  *Superseded 8 Sep: no blank card, and same-property setups only — see the head of this file.*
- **The blank card opens the setup's real creation editor**, prefilled with "<integration> demand"
  and the integration's property, its header reading *for “X” — mapped there on Create*. Its
  Create runs the normal review, then **returns to the integration page with the new setup
  mapped** and the draft intact. Cancel/← returns with nothing changed anywhere.

Safety in the seam: a return ticket is **stale-guarded** — it names its expected destination, and
arriving at any list or a different setup drops it, so a detour never leaves a wrong "back to" on
a header. `viewSetupReadOnly`, `setupPreviewHtml`, `setupReadOnlyHtml` and the `.spv-*` anatomy
are deleted with their callers.

**UNIT SETTINGS: BELOW THE FOLD, SETTLED (3 Sep, user call — fourth cut; supersedes "the
waterfall is a table" below, kept for its lessons. The FOLD and its grammar stand; its GEAR and
its bounds were re-cut 7 Sep — see "THE AD UNIT IS ONE BLOCK" at the top: the door is focus now,
and the panel is a tier inside the unit's own frame.)** The full table put fifty controls on screen —
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

**RETIRED: the global property scope (19 Aug; removed 7 Sep, user call).** A **dropdown** at the
sidebar top and later the header band's right seat (workspace-switcher pattern: brand → scope →
nav), rendered from `meta.propertyScopes`, persisted in localStorage, scoping the whole panel:
integration lists (the property pill hid itself when scoped), shared object lists, attach pickers,
bulk pickers, nav counts, and new-object property defaults. **The profile mark holds that seat now**
— whose properties these are is a question auth answers, not a switcher — so nothing narrows
globally, both lists always offer the Properties filter, and `inScope()` stays as the seam the
session's grant will answer through. The seat now holds the profile menu (View profile · Log out).
See the head of this file.

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

> *Half superseded 8 Sep: an integration still asks from ONE ad setup, but a setup may now fill
> MANY integrations — see the head of this file. The drive is untouched.*

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
  - **A new placement is a CLONE of Default's SETTINGS, never its demand** (amended
    7 Sep, user call — every break must open at the fork). Behaviour, cadence and pod
    structure carry over so it starts from something that works; ladders, links and
    direct deals start EMPTY (`suBareSlots`), so each break opens on the source seg
    (`Waterfall │ Custom`) with `+ Add custom waterfall` under it — units are trafficked
    per placement.
    Server-side inheritance unchanged: a placement that arrives without behaviour
    inherits Default's, and a partial patch never resets what it did not mention.
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
- **The 1:1 promise, spoken (27 Aug)** — *reversed 8 Sep in the direction that mattered: a
  setup fills as many integrations as it is mapped to, and the plural apparatus below came back
  as counts.* A setup fills ONE integration (enforced since
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
- **A bulk push can reach integrations of another property.** Now:
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
accident. Changing a filter or the search returns to page 1.

**A selection survives its filter (8 Sep, user call).** Changing a filter used to **clear** the
selection — the fail-closed reading, so a bulk change could never reach rows the current filters no
longer showed. In use it was the wrong trade twice over: a cohort that lives in two searches ("these
three TOI surfaces and that one NBT one") could not be assembled at all, and the work vanished
without a word — the one thing a control plane must never do quietly. The selection now **carries**,
and carrying it is what makes it safe: on every filter, search and Breaks-grid change, everything
selected is **pinned to the top of the table** in its own block, ticked, above the new matches —

    SELECTED  3
    ☑ TOI Mweb VideoShow …
    ☑ TOI Mweb ArticleShow …
    ☑ NBT iOS MiniTV …
    Show all 67 selected            ← only when the block is longer than 8
    MATCHING  12
    ☐ ET Desktop ArticleShow …

Nothing is off-screen, nothing is counted twice (a pinned row leaves the paged list, and the pager
counts what is left), and the bulk bar's count is the whole cohort. Three rules keep it from
surprising anyone: the block is snapshotted **on filter changes only**, so ticking a row never makes
it jump away from under the cursor; **unticking a pinned row drops it out of the block**, which is
the way back for one row — untick them all and the block closes and the table is plain again; and
**Clear** empties both the selection and the block. The header checkbox governs the **Matching**
block only, in the ticks it writes as much as in the ids it holds (8 Sep: it first wrote every
checkbox in the table, so switching it off emptied the carried rows' boxes while the bar still
counted them — and the next click on one re-ticked it instead of releasing it). Each group line
counts **its own rows**; the bar counts the whole cohort, which is why a row ticked in place under
`MATCHING` shows in the bar's count before it shows in the block. Above eight
carried rows the block shows its head and offers the rest — a cohort of 342 does not get to push the
table off the screen. The carried rows wear the faintest wash of the bulk bar's notice yellow, so
the block and the bar read as one temporary state.

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
**The file list in this paragraph is history** — several of the files named below were merged
or deleted between 21 Aug and 7 Sep. For the current one, see ARCHITECTURE.md §5.
As of 19 Aug the load order was: `util.js` (labels, toasts, `ask` dialog — never native
confirm), `api.js` (every request is a named operation — no view writes a URL),
`controls.js` (segmented enums, toggles, number+unit fields, domain chips, attach-picker
cards, form diff), `cardPickDialog` (a card grid then a spec preview — the editors' attach
flow; the `stepDialog` control was deleted 21 Aug when the bulk tabs made it callerless),
`publish.js` (the version rail and the publish plane, one implementation for both rooms),
`review.js` (THE CHANGE REVIEW — the one screen bulk Apply, Save and Publish all confirm
on), `views-keys.js`, `views-behaviours.js`, `views-policies.js`, `views-tags.js`,
`views-waterfalls.js`, `views-activity.js`, `main.js` (hash router + nav counts).
`rungRowHtml` then lived in `views-waterfalls.js` and was drawn by both ladder editors, so a
waterfall reads identically wherever it appears (today it is in `views-setups-rungs.js`).
List toolbars paint once; filters repaint rows only, so the search caret survives.

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
