// api/response-shapes.js — response shapes. The store holds raw objects; these functions turn
// them into what the web app reads, adding the COUNTED facts a screen needs (rung
// counts, walks, where an object stands on the publish plane) so no view ever
// recomputes a rule client-side.
//
//   keyView(k)       one integration, with its effective sections and per-slot facts
//   setupView(s)     one ad setup, with per-slot ladders, pods and the holder's drive
//   tagView(t)       one ad tag, with its use count and template name
//   templateView(t)  one ad unit template, with its use count
//   publicVersion(v) one version entry, without its snapshot
//   accountView(a)   one person, as the door and the header band read them
//   sessionView()    whether anyone is signed in, and the accounts the console remembers
import * as store from './store.js';


// WHERE AN OBJECT STANDS ON THE PUBLISH PLANE — the same facts on every view, so a
// list row and an editor never disagree about whether something is on air. The lists'
// Status column (4 Sep) needs two more: whether it was EVER published (an unpublished
// draft and a taken-down surface are different states), and the live version's
// provenance when it was a restore (v5 republishing v2 says so).
export function publishView(kind, obj) {
  const pending = store.isDirty(kind, obj.id) ? store.unpublishedChanges(kind, obj.id) : [];
  const versions = store.versionsOf(obj.id);
  const lv = store.liveVersion(obj.id);
  return {
    live: store.isPublished(obj.id),
    liveVersion: lv,
    liveRestoredFrom: lv ? (versions.find(x => x.v === lv)?.restoredFrom ?? null) : null,
    everPublished: versions.length > 0,
    unpublishedCount: pending.length,
  };
}

// ---------- rung rendering ----------
// A rung reads as a name, never a raw path.
export function rungView(r) {
  const tag = store.listTags().find(t => t.id === r.tagId);
  const tpl = tag && tag.tplId ? store.listTemplates().find(x => x.id === tag.tplId) : null;
  const out = {
    type: 'tag', tagId: r.tagId, on: r.on !== false,
    label: tag ? tag.name : '(missing tag)',
    value: tag ? tag.value : '',
    provider: tag ? tag.provider : '',
    tagType: tag ? tag.type : '',
    // A non-default template is a flag, not a label — the row shows it only when it is news.
    tplName: tpl ? tpl.name : null,
    // Typed in by hand and GAM has not caught up — the one fact about a rung that a
    // later sync can change on its own, so it is derived here every time.
    offDirectory: store.tagOffDirectory(tag),
  };
  // A unit's own facts ride the rung (31 Aug, AD-JSON-SCOPE; one list since 11 Sep).
  for (const f of store.RUNG_FACTS) {
    if (r[f] !== undefined) out[f] = r[f];
  }
  return out;
}

export function ladderView(slot) {
  const live = store.liveRungs(slot.rungs);
  return {
    rungs: slot.rungs,
    rungView: slot.rungs.map(rungView),
    rungCount: live.length,
    rungCountConfigured: slot.rungs.length,
  };
}

// ---------- integrations (the product room) ----------
// A section's slot is a switch; the counted facts beside it come from the setup the
// section resolves to, so the strip can say "3 rungs behind pre-roll" without the
// product room ever holding a ladder.
export function tagName(id) {
  return store.getTagOrNull(id)?.name || '(missing tag)';
}

export function slotFacts(k, s, t) {
  const setup = store.resolvedSetup(k);
  const secDef = setup ? store.setupSection(setup, s.name) : null;
  const drive = k.drive?.[t] || null;
  // Every break group's own facts, resolved the same way (31 Aug: a mid-roll is up to
  // three groups; every other slot is one). Group 1 doubles as the slot's own facts, so
  // a single-group surface reads exactly what it always read.
  const gdefs = secDef ? store.slotGroupDefs(secDef.slots[t]) : [{ rungs: [], behaviour: null }];
  const gFacts = gdefs.map(g => {
    const ladder = secDef ? store.localLadder(g.rungs) : [];
    const r = secDef ? store.driveWalkRungs(g.rungs, g.behaviour, drive, t) : { walk: [], fellBack: false };
    const eff = secDef ? store.effectiveBehaviour(t, g.behaviour, drive) : { values: null, driveKeys: [] };
    return {
      hasDemand: r.walk.length > 0,
      rungCount: r.walk.length,
      rungCountConfigured: ladder.length,
      fellBack: r.fellBack,
      behaviour: eff.values,
      behaviourDrive: eff.driveKeys,
      behaviourBase: g.behaviour || null,
      walk: r.walk.map(x => ({
        key: x.key,
        label: tagName(x.tagId),
        provider: store.getTagOrNull(x.tagId)?.provider || '',
      })),
      providers: [...new Set(ladder.filter(x => !x.opsOff).map(x => store.getTagOrNull(x.tagId)?.provider || ''))].filter(Boolean),
    };
  });
  // The break's own direct tier, as the product room sees it: counted facts and the
  // per-break switch's state — never an editor.
  const dWalk = secDef ? store.directWalkOf(secDef.slots[t]) : [];
  return {
    ...gFacts[0],
    on: s.slots[t].on,
    // The switch may only light where EVERY group has something to ask.
    hasDemand: gFacts.every(g => g.hasDemand),
    // The drive decision found none of its partners here — this section runs the
    // setup's own arrangement instead, and every view says so.
    fellBack: gFacts.some(g => g.fellBack),
    groups: gFacts.length > 1 ? gFacts : null,
    direct: dWalk.length ? {
      on: drive?.direct !== false,
      rungCount: dWalk.length,
      walk: dWalk.map(r => ({ label: tagName(r.tagId), provider: store.getTagOrNull(r.tagId)?.provider || '' })),
    } : null,
  };
}

export function keyView(k) {
  // The sections shown are the EFFECTIVE ones: the setup's placements in the setup's
  // order, each joined with this integration's overlay of the same name.
  const setup = store.resolvedSetup(k);
  const eff = store.effectiveSections(k);
  const slotsOn = {};
  for (const t of store.SLOT_TYPES) slotsOn[t] = eff.some(s => s.slots[t].on);
  return {
    ...k,
    sections: eff.map(s => ({
      ...s,
      setupId: k.adSetupId,
      setupName: setup?.name ?? null,
      setupUpdatedAt: setup?.updatedAt ?? null,
      setupUpdatedBy: setup?.updatedBy ?? null,
      slots: Object.fromEntries(store.SLOT_TYPES.map(t => [t, slotFacts(k, s, t)])),
    })),
    setupName: setup?.name ?? null,
    slotsOn,
    ...publishView('key', k),
  };
}

export function publicVersion(v) {
  return { v: v.v, ts: v.ts, actor: v.actor, changes: v.changes, restoredFrom: v.restoredFrom ?? null, offAir: !v.snapshot, note: v.note ?? null };
}

// ---------- ad setups (the ops room) ----------

export function setupView(s) {
  const used = store.keysUsingSetup(s.id);
  // Under the 1:1 promise there is at most one attached surface — its drive decision
  // is named on each slot, so ops never debug a ghost ("why does it only try three?").
  const holder = used[0] || null;
  return {
    ...s,
    sections: s.sections.map(sec => ({
      name: sec.name,
      isDefault: sec.isDefault,
      slots: Object.fromEntries(store.SLOT_TYPES.map(t => {
        const lv = ladderView(sec.slots[t]);
        const drive = holder?.drive?.[t] || null;
        const gdefs = store.slotGroupDefs(sec.slots[t]);
        // The indirect source (5 Sep): `rungs` stays the SERVING truth; the kept own
        // units and the link ride beside it so the editor can restore them exactly.
        const src = g => ({
          waterfallSource: g.waterfallSource || 'own',
          ownRungs: g.ownRungs ?? g.rungs,
        });
        return [t, {
          ...lv,
          ...src(sec.slots[t]),
          behaviour: sec.slots[t].behaviour,
          // A mid-roll's break groups, each the whole slot anatomy (31 Aug). Always
          // present on a mid-roll so the editor draws one grammar; single elsewhere.
          groups: t === 'midroll'
            // Each pod carries its OWN direct deal now (3 Sep) — the editor draws one
            // pod anatomy: a deal, a ladder, a cadence.
            ? gdefs.map(g => ({
              ...ladderView(g),
              ...src(g),
              behaviour: g.behaviour,
              direct: g.direct ? ladderView(g.direct) : null,
            }))
            : null,
          // The break's own direct tier (1 Sep) — ladder slots only.
          direct: sec.slots[t].direct ? ladderView(sec.slots[t].direct) : null,
          drive: drive ? { keyName: holder.name, ...drive } : null,
        }];
      })),
    })),
    usedBy: used.length,
    usedByNames: used.map(k => k.name),
    usedByLive: used.filter(k => store.isPublished(k.id)).length,
    liveCounts: store.setupLiveCounts(s.id),
    // WHAT MOVED UNDERNEATH IT (16 Sep, user call). A setup's own versions are about its
    // own content, and a template publishing is not that — so this does NOT bump a version.
    // But the setup must not pretend nothing happened either: every template its units
    // point at that has gone out since this setup last published, newest first, named.
    templateNews: store.templateNewsFor(s.id),
    ...publishView('setup', s),
  };
}

// ---------- ad tags ----------
export function tagView(t) {
  const inSetups = store.setupsUsingTag(t.id);
  const tpl = t.tplId ? store.listTemplates().find(x => x.id === t.tplId) : null;
  return {
    ...t,
    usedBy: inSetups.length,
    usedByNames: inSetups.map(s => s.name),
    // Standard is absence — the name shows only where the choice is news.
    tplName: tpl ? tpl.name : null,
    offDirectory: store.tagOffDirectory(t),
  };
}

// ---------- ad unit templates ----------
// A ROOM OF ITS OWN since 16 Sep (it was "plumbing behind a tag, a small list beside the
// tag library" from 31 Aug). A template's page asks two questions — where MAY this be
// picked (`properties`, the author's decision) and where IS it picked (the reach below,
// counted) — so the view carries the second one whole rather than a bare number.
//
// The reach is one hop deeper than `usedBy` ever went: a template is picked by a TAG,
// and a tag sits in ad setups. `usedBy` keeps its old meaning (the tags, what the
// delete refusal counts); `setups` and `propertiesInUse` are the reach the page draws.
export function templateView(t) {
  const inTags = store.tagsUsingTemplate(t.id);
  const inSetups = store.setupsUsingTemplate(t.id);
  return {
    ...t,
    // `properties: []` is every property — absence is the answer, on the wire as in the store.
    properties: t.properties || [],
    // A template publishes like an integration or an ad setup (16 Sep): live, its version,
    // whether a draft is waiting. The list's Status column and the page's rail read this.
    ...publishView('template', t),
    usedBy: inTags.length,
    usedByNames: inTags.map(x => x.name),
    // THE AD UNITS ARE THE SUBJECT, AND THE AD SETUPS ARE WHERE THEY SIT (16 Sep, second
    // pass on the Connected IA). A template is picked BY a unit, and the unit is what fires
    // the URL — so `usedBy` counts units, and a list that counts setups instead can never
    // reconcile with it: one unit deployed in three setups makes the rows add to more than
    // the head. (Measured on the seeded world: head 3, rows 2+1+1+1 = 5.) Unit-first, the
    // rows ARE the count, and where each one sits rides along as its address.
    units: inTags.map(t => ({
      id: t.id,
      name: t.name,
      setups: inSetups.filter(s => store.setupTagIds(s).has(t.id))
        .map(s => ({ id: s.id, name: s.name, property: s.property })),
    })),
    // The ad setups a change here reaches — still counted, because the visibility refusal
    // and the list's Connected column are both about setups, not units.
    setups: inSetups.map(s => {
      const held = store.setupTagIds(s);
      const units = inTags.filter(t => held.has(t.id));
      return {
        id: s.id, name: s.name, property: s.property,
        units: units.length, unitNames: units.map(t => t.name),
      };
    }),
    setupCount: inSetups.length,
    propertiesInUse: [...new Set(inSetups.map(s => s.property))],
  };
}


// ---------- the front door (8 Sep) ----------
// An account never leaves the server whole: `provider` says who remembers it and is the
// door's business alone, and nothing else on an account is secret — but shaping it here
// keeps the rule that no view reads a raw store object.
export function accountView(a) {
  return a ? { name: a.name, initials: a.initials, role: a.role, email: a.email } : null;
}

// The door reads all three facts; the header band reads only `account`.
export function sessionView() {
  const { account, remembered, workDomain, accessOwner } = store.sessionFacts();
  return {
    signedIn: !!account,
    account: accountView(account),
    // The "Continue as …" rows, in the order the console saw them.
    remembered: remembered.map(a => ({ ...accountView(a), via: a.provider })),
    // The door says which addresses it signs in, so the placeholder and the refusal are
    // never two different strings (the adUnitExample arrangement, for people).
    workDomain,
    // Who Request access goes to — named, so the door is never a dead end.
    accessOwner: accessOwner ? { name: accessOwner.name, role: accessOwner.role, email: accessOwner.email } : null,
  };
}
