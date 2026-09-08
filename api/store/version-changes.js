// store/version-changes.js — WHAT CHANGED, in words. `versionChanges(kind, before, after)`
// compares two publish-plane snapshots (see publish.js) and returns the flat list
// `{ where, field, from, to }` that the version rail and THE CHANGE REVIEW render.
// Ladders are described by name (what joined, what left, what was switched) because a
// field-level diff of an array says nothing a person can read.
import { slotGroupDefs } from './ladders.js';
import { DISPLAY_SLOT_WORD, PAUSE_WORD, SLOT_TYPES, SLOT_WORD, state } from './state.js';

// ---------- what changed, in words ----------
// The rail's whole job is "what did this version do?", so a change is a WHERE and a
// WHAT, never a JSON blob. Ladders are the one thing a flat diff cannot say usefully,
// so they are described by name: what joined, what left, what was switched.

function flat(v, prefix, out) {
  if (v && typeof v === 'object' && !Array.isArray(v)) {
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

// A banner's own facts moving on a rung is a change the rail must say — the tags and
// their order can hold perfectly still while where-on-the-page or the pause answer moves.
function rungFactChanges(where, before, after) {
  const out = [];
  const byTag = arr => Object.fromEntries((arr || []).map(r => [r.tagId, r]));
  const bB = byTag(before);
  for (const r of after || []) {
    const prev = bB[r.tagId];
    if (!prev) continue;
    for (const f of ['displaySlot', 'pause', 'showAfterSec', 'closeAfterSec', 'hideAfterSec']) {
      if (JSON.stringify(prev[f]) !== JSON.stringify(r[f])) {
        const t = state.tags.get(r.tagId);
        const word = v => f === 'displaySlot' ? (DISPLAY_SLOT_WORD[v] || v) : f === 'pause' ? (PAUSE_WORD[v] || v) : v;
        out.push({ where: `${where} · ${t ? t.name : r.tagId}`, field: f, from: word(prev[f]), to: word(r[f]) });
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

// Every field a version moved, said where it lives. Placements added or removed are one
// line each rather than forty — a new placement is one decision, not forty of them.
export function versionChanges(kind, before, after) {
  const out = [];
  const b = before || null;
  if (!b) return [{ where: '', field: 'First publish', from: '—', to: 'live' }];

  for (const f of Object.keys(after)) {
    if (f === 'sections' || f === 'waterfall') continue;
    const x = JSON.stringify(b[f]);
    const y = JSON.stringify(after[f]);
    if (x === y) continue;
    if (f === 'player' || f === 'drive') {
      const fb = flat(b[f] || {}, '', {});
      const fa = flat(after[f] || {}, '', {});
      for (const k of new Set([...Object.keys(fb), ...Object.keys(fa)])) {
        if (JSON.stringify(fb[k]) !== JSON.stringify(fa[k])) {
          // A drive field is keyed by BREAK (`preroll.tries`), so the break is the
          // where — "Ad delivery" for all four read as one undifferentiated pile, and
          // which break a decision moved on is the first thing anyone asks.
          const seg = f === 'drive' ? k.split('.')[0] : null;
          out.push({
            where: seg ? (SLOT_WORD[seg] || seg) : 'Player',
            field: k.split('.').pop(), from: fb[k], to: fa[k],
          });
        }
      }
    } else if (f === 'playerConfigs') {
      // A custom config appearing or leaving is one decision, one line; a field moving
      // inside one is named where it lives — matched by name, like placements.
      const byName = arr => Object.fromEntries((arr || []).map(c => [c.name, c]));
      const cb = byName(b[f]);
      const ca = byName(after[f]);
      for (const name of Object.keys(cb)) {
        if (!ca[name]) out.push({ where: 'Player configs', field: name, from: 'custom config', to: 'removed' });
      }
      for (const name of Object.keys(ca)) {
        if (!cb[name]) { out.push({ where: 'Player configs', field: name, from: '—', to: 'added' }); continue; }
        // The switch, in words — absence is on, like a rung's.
        if ((cb[name].on !== false) !== (ca[name].on !== false)) {
          out.push({ where: 'Player configs', field: name, from: cb[name].on !== false ? 'on' : 'off', to: ca[name].on !== false ? 'on' : 'off' });
        }
        for (const g of ['playback', 'expandInMini', 'autoplay']) {
          if (JSON.stringify(cb[name][g]) !== JSON.stringify(ca[name][g])) {
            out.push({ where: `Player configs · ${name}`, field: g, from: cb[name][g], to: ca[name][g] });
          }
        }
      }
    } else {
      out.push({ where: '', field: f, from: b[f], to: after[f] });
    }
  }

  // THE SHARED WATERFALL is diffed ONCE, by name (5 Sep): the breaks that follow it
  // change with it, but their lines would say the same thing N more times — the link
  // itself is what a linked break's diff reads (below).
  {
    const wb = b.waterfall || { rungs: [] };
    const wa = after.waterfall || { rungs: [] };
    const wWhere = 'Waterfall';
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
      const ga = slA.rungs || slA.groups ? slotGroupDefs(slA) : null;
      const gb = slotGroupDefs(slB);
      if (ga) {
        const n = Math.max(ga.length, gb.length);
        for (let gi = 0; gi < n; gi++) {
          const gWhere = n > 1 ? `${where} group ${gi + 1}` : where;
          const a = ga[gi];
          const bg = gb[gi];
          if (!a) { out.push({ where: gWhere, field: 'Break group', from: 'there', to: 'removed' }); continue; }
          if (!bg) { out.push({ where: gWhere, field: 'Break group', from: '—', to: 'added' }); }
          // A break FOLLOWING the waterfall (5 Sep): the link moving is the
          // change; its rungs merely mirror the waterfall, which is diffed once above.
          const followsA = (a.waterfallSource ?? slA.waterfallSource) === 'setup';
          const followsB = bg ? (bg.waterfallSource ?? slB.waterfallSource) === 'setup' : false;
          if (followsA !== followsB) {
            const word = x => (x ? 'waterfall' : 'its own units');
            out.push({ where: gWhere, field: 'indirect', from: word(followsB), to: word(followsA) });
          }
          if (a.rungs && !followsA && !followsB) {
            out.push(...ladderChanges(gWhere, bg?.rungs, a.rungs));
            out.push(...rungFactChanges(gWhere, bg?.rungs, a.rungs));
          }
          for (const f of Object.keys(a.behaviour || {})) {
            if (JSON.stringify(bg?.behaviour?.[f]) !== JSON.stringify(a.behaviour[f])) {
              out.push({ where: gWhere, field: f, from: bg?.behaviour?.[f], to: a.behaviour[f] });
            }
          }
          // A pod's OWN deal (6 Sep, user bug — it never diffed): pod 1's doubles as
          // the slot's and is covered above; every later pod answers for itself here.
          if (gi > 0 && (a.direct || bg?.direct)) {
            const pWhere = `${gWhere} · Direct`;
            out.push(...ladderChanges(pWhere, bg?.direct?.rungs, a.direct?.rungs || []));
            out.push(...rungFactChanges(pWhere, bg?.direct?.rungs, a.direct?.rungs));
          }
        }
      }
    }
  }
  return out;
}
