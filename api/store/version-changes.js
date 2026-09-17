// store/version-changes.js — WHAT CHANGED, in words. `versionChanges(kind, before, after)`
// compares two publish-plane snapshots (see publish.js) and returns the flat list
// `{ where, field, from, to }` that the version rail and THE CHANGE REVIEW render.
// Ladders are described by name (what joined, what left, what was switched) because a
// field-level diff of an array says nothing a person can read.
import { slotGroupDefs } from './ladders.js';
import { AD_PROVIDER_WORD, DISPLAY_SLOT_WORD, HB_WORD, MUTE_WORD, PAUSE_WORD, PLAYER_FIELDS, RUNG_FACTS, SLOT_TYPES, SLOT_WORD, state } from './state.js';

// ---------- what changed, in words ----------
// The rail's whole job is "what did this version do?", so a change is a WHERE and a
// WHAT, never a JSON blob. Ladders are the one thing a flat diff cannot say usefully,
// so they are described by name: what joined, what left, what was switched.

// A field whose VALUE IS A MAP is ONE decision, not one per key (16 Sep). Flattened,
// `preroll.depth` would break into `preroll.depth.ima` and print the partner key as if it
// were the field — so the map stops here and its own word says it: "IMA 2, GPT 1".
const FLAT_LEAVES = new Set(['depth']);

function flat(v, prefix, out) {
  const last = prefix.split('.').pop();
  if (v && typeof v === 'object' && !Array.isArray(v) && !FLAT_LEAVES.has(last)) {
    for (const [k, x] of Object.entries(v)) flat(x, prefix ? `${prefix}.${k}` : k, out);
  } else {
    out[prefix] = v;
  }
  return out;
}

function rungWords(rungs) {
  return (rungs || []).map(r => {
    const t = state.tags.get(r.tagId);
    return `${t ? t.name : '(missing tag)'}${r.on === false ? ' (off)' : ''}`;
  });
}

// Which fact speaks in words, and which word map says them. A fact with no entry here
// prints its stored value as it stands (the clocks: a number is already the word).
const RUNG_FACT_WORDS = {
  adProvider: AD_PROVIDER_WORD,
  displaySlot: DISPLAY_SLOT_WORD,
  pause: PAUSE_WORD,
  mute: MUTE_WORD,
  headerBidding: HB_WORD,
};

/** One rung fact's stored value, in the word the screen uses for it. */
function rungFactWord(field, value) {
  return RUNG_FACT_WORDS[field]?.[value] || value;
}

// A banner's own facts moving on a rung is a change the rail must say — the tags and
// their order can hold perfectly still while where-on-the-page or the pause answer moves.
function rungFactChanges(where, before, after) {
  const out = [];
  const byTag = arr => Object.fromEntries((arr || []).map(r => [r.tagId, r]));
  const bB = byTag(before);
  for (const r of after || []) {
    const prev = bB[r.tagId];
    if (!prev) continue;
    for (const f of RUNG_FACTS) {
      if (JSON.stringify(prev[f]) !== JSON.stringify(r[f])) {
        const t = state.tags.get(r.tagId);
        out.push({ where: `${where} · ${t ? t.name : r.tagId}`, field: f, from: rungFactWord(f, prev[f]), to: rungFactWord(f, r[f]) });
      }
    }
  }
  return out;
}

// A ladder's change, in the words a person used to make it (re-cut 6 Sep, user call —
// a rung TOGGLE read as remove-and-add): same units in the same order means only
// switches moved, so each flip is its own line, named by the unit. Otherwise the
// arrivals, departures and reorders read as before. Returns 0..n rows.
function ladderChanges(where, before, after) {
  const name = r => state.tags.get(r.tagId)?.name || '(missing tag)';
  const aSeq = (before || []).map(name);
  const bSeq = (after || []).map(name);
  if (JSON.stringify(aSeq) === JSON.stringify(bSeq)) {
    const out = [];
    (after || []).forEach((r, i) => {
      const was = (before || [])[i]?.on !== false;
      const is = r.on !== false;
      if (was !== is) out.push({ where, field: bSeq[i], from: was ? 'on' : 'off', to: is ? 'on' : 'off' });
    });
    return out;
  }
  const a = rungWords(before);
  const b = rungWords(after);
  if (JSON.stringify(a) === JSON.stringify(b)) return [];
  const gone = a.filter(x => !b.includes(x));
  const came = b.filter(x => !a.includes(x));
  const bits = [];
  if (came.length) bits.push(`+ ${came.join(', ')}`);
  if (gone.length) bits.push(`− ${gone.join(', ')}`);
  if (!bits.length) bits.push('reordered');
  return [{ where, field: 'Ladder', from: `${a.length} rung${a.length === 1 ? '' : 's'}`, to: `${b.length} — ${bits.join(' · ')}` }];
}

// ---------- ONE SLOT'S BREAK GROUPS ----------
// Break groups diff group by group — group 1 doubles as the slot itself, so a slot with no
// `groups` reads as one group and the line reads exactly as it did before pods existed.

function slotPodChanges(slA, slB, where) {
  if (!(slA.rungs || slA.groups)) return [];
  const ga = slotGroupDefs(slA);
  const gb = slotGroupDefs(slB);
  const n = Math.max(ga.length, gb.length);
  const out = [];
  for (let gi = 0; gi < n; gi++) {
    const gWhere = n > 1 ? `${where} group ${gi + 1}` : where;
    out.push(...onePodChanges(ga[gi], gb[gi], gWhere, gi, slA, slB));
  }
  return out;
}

function onePodChanges(a, bg, gWhere, gi, slA, slB) {
  if (!a) return [{ where: gWhere, field: 'Break group', from: 'there', to: 'removed' }];
  const out = [];
  if (!bg) out.push({ where: gWhere, field: 'Break group', from: '—', to: 'added' });
  out.push(...adSourceChanges(a, bg, gWhere, slA, slB));
  out.push(...ownLadderChanges(a, bg, gWhere, slA, slB));
  out.push(...podBehaviourChanges(a, bg, gWhere));
  // A pod's OWN deal (6 Sep, user bug — it never diffed): pod 1's doubles as the slot's
  // and is diffed by the caller; every later pod answers for itself here.
  if (gi > 0 && (a.direct || bg?.direct)) {
    const pWhere = `${gWhere} · Direct`;
    out.push(...ladderChanges(pWhere, bg?.direct?.rungs, a.direct?.rungs || []));
    out.push(...rungFactChanges(pWhere, bg?.direct?.rungs, a.direct?.rungs));
  }
  return out;
}

// WHERE THE BREAK'S ADS COME FROM (5 Sep as a link; three answers 8 Sep): the source
// moving IS the change — a following break's rungs merely mirror the waterfall (diffed
// once at the head) and a switched-off break serves none at all, so the ladder diff runs
// only while both versions served their own.
function adSourceChanges(a, bg, gWhere, slA, slB) {
  const srcOf = (g, sl) => (g?.waterfallSource ?? sl.waterfallSource) || 'own';
  const srcA = srcOf(a, slA);
  const srcB = bg ? srcOf(bg, slB) : 'own';
  if (srcA === srcB) return [];
  const word = x => (x === 'setup' ? 'the waterfall' : x === 'none' ? 'no ads' : 'its own units');
  return [{ where: gWhere, field: 'ad sources', from: word(srcB), to: word(srcA) }];
}

// THE LADDER DIFF READS WHAT THE BREAK OWNS (8 Sep). `rungs` is the SERVED walk, and for a
// break taking its fall from the global waterfall — or with no fall at all — that array is
// derived: its own primary plus the waterfall's units, which are diffed once at the head.
// `ownRungs` is what this break actually holds, in every answer, so diffing that says
// exactly what a person changed here (an old snapshot has no `ownRungs` and its `rungs`
// ARE its own units). `slotGroupDefs` hands back a bare { rungs, behaviour } for a
// single-group slot, so `ownRungs` is read off the slot itself there — the same fallback
// the source above uses. A real mid-roll pod carries its own.
function ownLadderChanges(a, bg, gWhere, slA, slB) {
  const ladderOf = (g, sl) => (g && (g.ownRungs ?? sl?.ownRungs ?? g.rungs)) || null;
  const ladA = ladderOf(a, slA);
  if (!ladA) return [];
  const ladB = ladderOf(bg, slB);
  return [...ladderChanges(gWhere, ladB, ladA), ...rungFactChanges(gWhere, ladB, ladA)];
}

// Every behaviour field the newer pod carries, compared with what the older one said.
function podBehaviourChanges(a, bg, gWhere) {
  const out = [];
  for (const f of Object.keys(a.behaviour || {})) {
    if (JSON.stringify(bg?.behaviour?.[f]) === JSON.stringify(a.behaviour[f])) continue;
    out.push({ where: gWhere, field: f, from: bg?.behaviour?.[f], to: a.behaviour[f] });
  }
  return out;
}

// ---------- HOW A TOP-LEVEL FIELD IS SAID ----------
// Most fields are one line: the field moved, here is what it was and what it is. Two are
// nested and get their own reader, because a single line saying "Player" or "Player
// configs" for a change buried three levels down is the pile this review exists to avoid.
// A field with no entry here takes the plain one-liner.
const TOP_FIELD_READERS = {
  player: (was, now) => leafChanges(was, now, () => 'Player'),
  drive: (was, now) => leafChanges(was, now, driveWhere),
  playerConfigs: (was, now) => playerConfigChanges(was, now),
};

function topFieldChanges(field, was, now) {
  const read = TOP_FIELD_READERS[field];
  return read ? read(was, now) : [{ where: '', field, from: was, to: now }];
}

// A drive field is keyed by BREAK (`preroll.tries`), so the break is the where — "Ad
// delivery" for all four reads as one undifferentiated pile, and which break a decision
// moved on is the first thing anyone asks.
function driveWhere(key) {
  const seg = key.split('.')[0];
  return SLOT_WORD[seg] || seg;
}

// A nested object's leaves, compared one by one. `whereOf` names the zone a leaf sits in.
function leafChanges(was, now, whereOf) {
  const fb = flat(was || {}, '', {});
  const fa = flat(now || {}, '', {});
  const out = [];
  for (const k of new Set([...Object.keys(fb), ...Object.keys(fa)])) {
    if (JSON.stringify(fb[k]) === JSON.stringify(fa[k])) continue;
    out.push({ where: whereOf(k), field: k.split('.').pop(), from: fb[k], to: fa[k] });
  }
  return out;
}

// A custom config appearing or leaving is one decision, one line; a field moving inside
// one is named where it lives — matched by name, like placements.
function playerConfigChanges(was, now) {
  const byName = arr => Object.fromEntries((arr || []).map(c => [c.name, c]));
  const before = byName(was);
  const after = byName(now);
  const out = [];
  for (const name of Object.keys(before)) {
    if (!after[name]) out.push({ where: 'Player configs', field: name, from: 'custom config', to: 'removed' });
  }
  for (const name of Object.keys(after)) out.push(...oneConfigChanges(name, before[name], after[name]));
  return out;
}

// One named config: it arrived, its switch moved, or one of the fields it overrides did.
function oneConfigChanges(name, was, now) {
  if (!was) return [{ where: 'Player configs', field: name, from: '—', to: 'added' }];
  const out = [];
  // The switch, in words — absence is on, like a rung's.
  const onWord = c => (c.on !== false ? 'on' : 'off');
  if (onWord(was) !== onWord(now)) {
    out.push({ where: 'Player configs', field: name, from: onWord(was), to: onWord(now) });
  }
  // EVERY FIELD A CONFIG MAY OVERRIDE (13 Sep) — the one list, not a copy of three. A
  // config is sparse, so an absent side is "follows default", said in words: the review's
  // whole point is that a new override on an existing config is one line.
  const word = v => (v === undefined ? 'follows default' : v);
  for (const g of PLAYER_FIELDS) {
    if (JSON.stringify(was[g]) === JSON.stringify(now[g])) continue;
    out.push({ where: `Player configs · ${name}`, field: g, from: word(was[g]), to: word(now[g]) });
  }
  return out;
}

// Every field a version moved, said where it lives. Placements added or removed are one
// line each rather than forty — a new placement is one decision, not forty of them.
export function versionChanges(kind, before, after) {
  const out = [];
  const b = before || null;
  if (!b) return [{ where: '', field: 'First publish', from: '—', to: 'live' }];

  // A TEMPLATE IS FLAT — four fields and no ladder — so it never reaches the section walk
  // below, which would read `after.sections` and find nothing. `Visible to` says its list
  // in the words the page uses; everything else is the value as it stands.
  if (kind === 'template') {
    const word = v => ((v || []).length ? v.join(', ') : 'All properties');
    for (const f of ['name', 'provider', 'url']) {
      if (b[f] !== after[f]) out.push({ where: '', field: f, from: b[f], to: after[f] });
    }
    if (JSON.stringify(b.properties || []) !== JSON.stringify(after.properties || [])) {
      out.push({ where: '', field: 'properties', from: word(b.properties), to: word(after.properties) });
    }
    return out;
  }

  for (const f of Object.keys(after)) {
    if (f === 'sections' || f === 'waterfall') continue;
    if (JSON.stringify(b[f]) === JSON.stringify(after[f])) continue;
    out.push(...topFieldChanges(f, b[f], after[f]));
  }

  // THE SHARED WATERFALL is diffed ONCE, by name (5 Sep): the breaks that follow it
  // change with it, but their lines would say the same thing N more times — the link
  // itself is what a linked break's diff reads (below).
  {
    const wb = b.waterfall || { rungs: [] };
    const wa = after.waterfall || { rungs: [] };
    const wWhere = 'Global waterfall';
    out.push(...ladderChanges(wWhere, wb.rungs, wa.rungs));
    out.push(...rungFactChanges(wWhere, wb.rungs, wa.rungs));
    if ((wb.depth ?? null) !== (wa.depth ?? null)) {
      out.push({ where: wWhere, field: 'tries', from: wb.depth ?? 'Full', to: wa.depth ?? 'Full' });
    }
    if ((wb.pauseAll ?? null) !== (wa.pauseAll ?? null)) {
      const word = v => (v ? `${PAUSE_WORD[v] || v} for every unit` : 'each unit’s own');
      out.push({ where: wWhere, field: 'pause', from: word(wb.pauseAll ?? null), to: word(wa.pauseAll ?? null) });
    }
  }

  const byName = arr => Object.fromEntries((arr || []).map(s => [s.name, s]));
  const sb = byName(b.sections);
  const sa = byName(after.sections);
  for (const name of Object.keys(sb)) {
    if (!sa[name]) out.push({ where: name, field: 'Placement', from: 'there', to: 'removed' });
  }
  for (const [name, secA] of Object.entries(sa)) {
    const secB = sb[name];
    if (!secB) { out.push({ where: name, field: 'Placement', from: '—', to: 'added' }); continue; }
    for (const t of SLOT_TYPES) {
      const slA = secA.slots[t] || {};
      const slB = secB.slots[t] || {};
      const where = `${name} · ${SLOT_WORD[t] || t}`;
      if (slA.on !== undefined && !!slA.on !== !!slB.on) {
        // A switch groups by BREAK, with the placement in the field name — so every
        // change to the pre-roll reads together, whichever placement it landed on.
        out.push({
          where: SLOT_WORD[t] || t, field: `${name} — runs`,
          from: slB.on ? 'active' : 'inactive', to: slA.on ? 'active' : 'inactive',
        });
      }
      // Break groups diff group by group — group 1 doubles as the slot itself, so a
      // slot with no `groups` reads as one group and the line reads exactly as before.
      // The slot's own direct tier, diffed by name.
      if (slA.direct || slB.direct) {
        const dWhere = `${where} · Direct`;
        out.push(...ladderChanges(dWhere, slB.direct?.rungs, slA.direct?.rungs || []));
        out.push(...rungFactChanges(dWhere, slB.direct?.rungs, slA.direct?.rungs));
      }
      out.push(...slotPodChanges(slA, slB, where));
    }
  }
  return out;
}
