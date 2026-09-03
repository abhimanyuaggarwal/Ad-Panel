// views-policies.js — ad-rules helpers. The rules are neither an identity (24 Aug,
// AD-SETUP-SCOPE) nor a page of their own (24 Aug night): break-specific rules live on
// each unit's row, and everything cross-break edits in place as the collapsed
// "Ad behaviour" section on the integration. What remains here is shared parsing and
// the pods' consequence line.

// "6:00" or "360" -> seconds; unparsable tokens pass through for the server to refuse by name.
function parseCuepointsText(text) {
  return String(text || '').split(',').map(s => s.trim()).filter(Boolean).map(s => {
    if (/^\d+$/.test(s)) return parseInt(s, 10);
    const m = s.match(/^(\d+):([0-5]?\d)$/);
    return m ? parseInt(m[1], 10) * 60 + parseInt(m[2], 10) : s;
  });
}

// The consequence sits where the choice is made — both sides of the trade, swapped live.
function podWalkNote(v) {
  return v === 'next'
    ? 'Each position continues down the waterfall — no partner repeats in a pod.'
    : 'Each position restarts at the top — the same partner may fill more than once.';
}
