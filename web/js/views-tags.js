// views-tags.js — the ad tag control. A tag carries TWO independent facts:
//   TYPE     video or display — decides WHERE it may sit (video units / display units)
//   PROVIDER IMA, GPT or CAN — decides WHO answers the call
// Both are shown as one mark wherever a tag appears, because both change what you would
// do next and neither is guessable from the name. Naming a tag is what makes a bulk
// write safe — ops pushes "TOI Video Backfill", a thing they previewed, never a raw
// path onto 30 surfaces.

const OTHER_TYPE = { video: 'display', display: 'video' };
const TYPE_FITS = {
  video: 'pre-roll, mid-roll, post-roll',
  display: 'the squeeze-back, or as a break falls back',
};

// Both of a tag's facts are WORDS. The type used to be a 15px glyph at 58% opacity, and
// it read as lint rather than as "video" — an icon that needs a legend is a legend too
// many. So: VIDEO / DISPLAY beside IMA / GPT / CAN, nothing to decode.
function tagTypeIcon(type, title, flag) {
  if (!type) return '';
  return `<span class="ttype ${flag ? `flag t-${esc(type)}` : 'quiet'}" title="${esc(title || `${label('tagType', type)} tag — fits ${TYPE_FITS[type]}`)}">${esc(label('tagType', type))}</span>`;
}

function providerBadge(provider) {
  if (!provider) return '';
  return `<span class="pvd p-${esc(provider)}" title="Answered by ${esc(label('tagProvider', provider))}">${esc(label('tagProvider', provider))}</span>`;
}

// VIDEO/DISPLAY beside a provider badge is the SAME FACT TWICE (25 Aug, user call):
// IMA answers with video by construction, GPT with display. Only CAN serves both, so
// only a CAN tag needs to say which — everywhere a provider is shown.
function typeChipIfUnknowable(provider, type) {
  if (!type || !provider) return '';
  const implied = (window.KL_PROVIDER_TYPES || {})[provider];
  return implied ? '' : tagTypeIcon(type, `A CAN endpoint can answer either way — this one returns ${label('tagType', type)}`);
}

// Who answers it, and — for CAN alone — what it answers with.
function tagMark(type, provider) {
  return `<span class="tmark">${typeChipIfUnknowable(provider, type)}${providerBadge(provider)}</span>`;
}

// ONE control on the search: the PROVIDER — a small dropdown ON the field, left of the
// text, like a country code. It changes what the text means, so it belongs to the input.
// The video/display segment above the results was REMOVED (25 Aug, user call): the type
// is not ops' question to answer at search time — the SLOT already decides what fits,
// and where the protocol knows the answer (IMA video, GPT display) the provider
// dropdown has said it; only CAN declares. Nothing is silently filtered:
// a wrong-family match still shows greyed, its reason on the row.

// Only providers that CAN answer this family are offered — the preemptive-typing win:
// a video slot never even shows GPT, a squeeze-back never shows IMA.
function tagPickers(family) {
  const compat = window.KL_PROVIDER_TYPES || {};
  return window.KL_PROVIDERS
    .filter(v => !family || !compat[v] || compat[v] === family)
    .map(v => ({ v, label: label('tagProvider', v) }));
}

// MANUAL ENTRY (27 Aug, user call). The synced directory is a CONVENIENCE, not a gate:
// a unit trafficked in GAM ten minutes ago is real whether or not our copy has caught
// up, and being stuck behind a sync is the one thing ops cannot work around. So when
// what you typed is a well-formed ad unit (or, under IMA, a VAST URL) and the directory
// does not have it, ONE more row appears — the same row shape as a directory hit, said
// plainly. No second control, no toggle, nothing at all when the directory does have it.
function manualRow(q, provider, family, known, units) {
  const typed = (q || '').trim();
  if (!typed || known.has(typed) || units.includes(typed)) return null;
  const url = looksLikeUrl(typed);
  // GPT asks GAM for a unit; it has no URL form, so pasting one there is not offered.
  if (url && provider !== 'ima') return null;
  if (!url && !looksLikeAdUnit(typed)) return null;
  // Terse on purpose: the row IS the value, the badge is the act. Anything longer is a
  // sentence explaining a row you have already understood.
  return {
    kind: 'new', v: typed, provider,
    title: clip(typed, 44),
    sub: url ? 'VAST URL' : 'not in GAM',
    icon: tagMark(family, provider),
    badge: 'add', badgeKind: 'manual',
  };
}

async function tagSearchItems(family, q, excludeIds = [], provider = 'ima', alsoTakes = null) {
  const { tags } = await API.listTags();
  const needle = q.toLowerCase();
  const known = new Set(tags.map(t => t.value));
  const matches = t => !needle || `${t.name} ${t.value}`.toLowerCase().includes(needle);
  const here = t => inScope(t.property) && matches(t) && t.provider === provider;
  const other = OTHER_TYPE[family];

  const out = [];
  out.push(...tags
    .filter(t => t.type === family && here(t) && !excludeIds.includes(t.id))
    .slice(0, 6)
    .map(t => ({
      kind: 'tag', v: t.id, title: t.name, sub: t.value,
      icon: tagMark(family, t.provider), badge: t.usedBy ? `in ${t.usedBy}` : 'unused',
    })));

  // Creating one depends on the provider: GAM is a directory you pick from, CAN is an
  // endpoint you paste. Either way the provider is already chosen on the field, so there
  // is one row and no second question.
  if (window.KL_DIR_PROVIDERS.includes(provider)) {
    const { units } = await API.gamUnits(q);
    for (const u of units.filter(x => !known.has(x)).slice(0, 4)) {
      out.push({ kind: 'new', v: u, provider, title: gamUnitTitle(u), sub: u, icon: tagMark(family, provider), badge: 'new', badgeKind: 'new' });
    }
    const manual = manualRow(q, provider, family, known, units);
    if (manual) out.push(manual);
  } else if (/^https?:/i.test(q)) {
    out.push({
      kind: 'new', v: q, provider, title: clip(q, 40),
      sub: `save as a ${label('tagProvider', provider)} tag`,
      icon: tagMark(family, provider), badge: 'new', badgeKind: 'new',
    });
  }

  // The other family, without a filter to hide behind: pickable when this slot also
  // takes it (a break falls back to a banner), and once something is typed a match is
  // never silently dropped — it shows greyed, its reason on the row.
  const ok = other === alsoTakes;
  if (ok || needle) {
    out.push(...tags
      .filter(t => t.type === other && here(t) && !(ok && excludeIds.includes(t.id)))
      .slice(0, ok ? 3 : 4)
      .map(t => ok
        ? { kind: 'tag', v: t.id, title: t.name, sub: t.value,
            icon: tagMark(other, t.provider), badge: t.usedBy ? `in ${t.usedBy}` : 'unused' }
        : { disabled: true, title: t.name, why: `only fits ${TYPE_FITS[other]}`, icon: tagMark(other, t.provider) }));
  }

  // Empty? Say where the thing actually lives — counted, one line.
  if (!out.length) {
    const bits = [];
    for (const x of window.KL_PROVIDERS) {
      if (x === provider) continue;
      const n = tags.filter(t => t.provider === x && inScope(t.property) && matches(t)).length;
      if (n) bits.push(`${n} under ${label('tagProvider', x)}`);
    }
    if (bits.length) out.note = `${bits.join(' · ')} — switch to see ${bits.length > 1 ? 'them' : 'it'}.`;
    else if (window.KL_URL_PROVIDERS.includes(provider)) out.note = `Paste a ${label('tagProvider', provider)} endpoint (https://…) to add one.`;
    else out.note = 'Type the full unit path to add one.';
  }
  return out;
}

// Returns the tag object, registering it first when an unknown ad unit or URL was picked.
async function resolveTagPick(item, family) {
  if (item.kind === 'tag') {
    const { tags } = await API.listTags();
    return tags.find(t => t.id === item.v) || null;
  }
  const provider = item.provider || (family === 'display' ? 'gpt' : 'ima');
  const base = /^https?:/i.test(item.v)
    ? `${new URL(item.v).hostname} · ${label('tagProvider', provider)}`
    : gamUnitTitle(item.v);
  for (let n = 0; n < 6; n++) {
    try {
      const { tag } = await API.createTag({ name: n ? `${base} ${n + 1}` : base, type: family, provider, value: item.v, property: 'All' });
      toast(`“${tag.name}” added to the ad tags`);
      return tag;
    } catch (e) {
      // Only a name clash is worth retrying; anything else is a real refusal.
      if (!(e.errors || []).some(x => x.field === 'name')) { toast(e.message, 'bad'); return null; }
    }
  }
  return null;
}

function tagLookupHtml(opts) {
  const family = opts.family;
  return `
    <div class="rung-ctl">
      ${lookupHtml({
        value: opts.value || '',
        // No type mark on the field (25 Aug, user call): the provider dropdown beside
        // the text already says it wherever it is knowable — VIDEO next to IMA was the
        // same fact twice. A cross-family rung still flags itself on its ladder row.
        placeholder: `search ${family} tags or ad units…`,
        pickers: tagPickers(opts.alsoTakes ? null : family),
        picked: (opts.tagId && window.TAG_PROVIDER[opts.tagId]) || opts.preferProvider
          || (family === 'display' ? 'gpt' : 'ima'),

        search: (q, _scope, provider) => tagSearchItems(family, q, opts.exclude || [], provider, opts.alsoTakes),
        emptyText: (q, provider) => window.KL_DIR_PROVIDERS.includes(provider)
          ? (q ? 'No match — type the full unit path to add it' : 'Search a tag, or type an ad unit')
          : `Paste a ${label('tagProvider', provider)} endpoint (https://…)`,
        onPick: async item => {
          const tag = await resolveTagPick(item, family);
          if (tag) opts.onPick(tag);
        },
      })}
    </div>`;
}

