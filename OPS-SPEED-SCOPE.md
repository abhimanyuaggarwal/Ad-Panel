# Scope — ops changes, quickly and confidently

**Status: SCOPE, nothing built.** 20 Aug 2026.

Objective, plainly: **an ops person should be able to make a change across many integrations quickly,
and not be afraid of it.** Everything below serves that and nothing else.

## What we have, and what it misses

Everything built so far optimises **the act of changing** — pick a cohort, pick a unit, pick a rung,
apply. That act is now fast, counted, and hard to get wrong.

Two things are missing, and neither is about the act:

**1. There is no reverse gear.** Nowhere in the panel can a change be put back. The only place the
word "undo" appears is on delete dialogs, saying it cannot be. Every change is forever.

**2. The journey starts in the wrong place for the most urgent job.** The panel asks *which unit* 
first. When a partner is timing out, ops are thinking *"partner X is broken"* — and the panel makes
them work out which units X's tag sits in before they can do anything about it.

The first one matters more than any remaining click:

> A six-click change you can undo in one is faster **to attempt** than a three-click change that is
> permanent — because the permanent one needs thinking about, checking, and often someone else's
> agreement, before anyone dares.

And the panel's posture currently says *be careful* everywhere: every state-changing button confirms,
the bulk confirm is titled **"Apply to live traffic?"**, deletes say **"This cannot be undone."**
Right for a system where mistakes stick. Wrong for one where ops are meant to move.

## The jobs, and how we do against them

| | Job | Today |
| --- | --- | --- |
| **J1** | *"Partner X is timing out — get them out of the ladder everywhere, now."* | Units filter → select → rung Off is strong. But you must first guess which units their tag is in. |
| **J2** | *"Swap the waterfall 1 tag across all mweb integrations."* | **Good.** This is the path we built. |
| **J3** | *"That was wrong. Put it back."* | **Not supported.** Reconstruct by hand from the activity log. |
| **J4** | *"Do 5 first, then the rest."* | Possible by selecting carefully. Nothing tracks that 5 are done and 62 are not. |
| **J5** | *"What changed last night, and who did it?"* | Activity log is decent — but one bulk act shows up as 50 unrelated entries. |
| **J6** | *"Where is this tag used?"* | Not supported. `usedBy` is counted on the tag; the list cannot be filtered by it. |
| **J7** | *"Set up a new property × platform surface."* | Fine. Not a speed problem. |

## Two root causes

**A bulk act is not a thing.** Applying to 50 integrations writes 50 independent activity entries
with nothing tying them together. So there is nothing to put back, and nothing to read — J3 and J5
both come from this.

**The entry point assumes you know the unit.** J1 and J6 both come from this.

## Proposal, in the order I would build it

### 1 · Group a bulk apply into one change (foundation)

One apply becomes one record: who, when, what, which integrations, and **the prior value of every
slot it touched**. Every activity entry from that apply carries its id.

Two immediate wins on its own, before any undo exists:
- the activity log collapses 50 lines into one that expands — J5;
- there is now something a revert could grab hold of.

### 2 · Undo

- **Immediately after applying** — the success toast gains it: `Pre-roll — 33 changed · Undo`, alive
  about ten seconds. Catches the ordinary slip, which is the common case.
- **Later** — `Revert` on any grouped change in Activity, however old. A revert is itself a recorded
  change, so it shows up in the log and can itself be reverted.

Reverting uses the stored prior values, so it puts back exactly what was there — including rungs that
were switched off, and sections that were skipped and therefore should not move.

### 3 · Stop confirming reversible changes

Today: Apply → confirm dialog → done. Once undo exists, that confirm is a tax on the common path —
and a wall of text people click through is weaker protection than a real second chance. So apply
immediately and offer undo. Keep the confirm **only** where the act genuinely cannot be put back:
deletes, and anything that discards configuration rather than changing it.

Biggest single speed gain available, and the panel gets safer, not looser.

### 4 · Start from the tag

- A **Tags** filter on the list — cheap, and answers J6 by itself.
- A **tag-first journey**: find the tag → *"switched on at 34 rungs across 19 integrations"* → switch
  it off everywhere, or everywhere on one property. This is J1 in three clicks instead of a guessing
  game, and J1 is the job with a clock on it.

### 5 · Repeat the last change on another cohort

*"Do that again"* — reopen the unit screen prefilled from a previous change. Today *"I did it for
TOI, now do ET"* means walking the whole journey again from memory.

## Open questions

- **J4 (staged rollout).** Is *"filter, select, apply, then widen the filter"* actually enough? It
  works, it just isn't tracked. I would leave it alone unless ops say they lose their place.
- **Undo window.** Ten seconds for the toast is a guess. If ops typically notice a mistake when the
  next dashboard refreshes, the toast is the wrong mechanism and Activity revert is the real one —
  worth asking them.
- **Undo across people.** If two people change the same slot, whose undo wins? Simplest honest
  answer: a revert that would overwrite someone else's later change refuses and says so, the same way
  bulk refusals already name what they skipped.

## Out of scope

- Performance, revenue or fill data in the panel — v2 owns reporting.
- Scheduling: nothing in the panel runs on a clock, and adding one for this is not justified.
- Splitting a cohort into test and control.

## Unchanged

Counted arithmetic, the fail-closed rules, the typed-tag rule, and the outcome previews all stay as
they are. Undo is not a licence to be vaguer about what a change will do — it is what makes being
precise cheap enough to do every time.
