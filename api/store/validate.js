// store/validate.js — shared refusal helpers: numbers in range, enums, names, URLs,
// `mustGet`, and the field-level `diff` a save reports back.
import { Refusal, fieldWord } from './state.js';


export function str(v) {
  return typeof v === 'string' ? v.trim() : '';
}

export function intIn(v, field, min, max, errors) {
  const n = Number(v);
  if (!Number.isFinite(n) || !Number.isInteger(n) || n < min || n > max) {
    errors.push({ field, message: `${fieldWord(field)} must be a whole number between ${min} and ${max} (got ${v})` });
    return min;
  }
  return n;
}

export function oneOf(v, field, allowed, errors) {
  if (!allowed.includes(v)) {
    errors.push({ field, message: `${fieldWord(field)} must be one of ${allowed.join(', ')} (got ${v})` });
    return allowed[0];
  }
  return v;
}

export function bool(v) {
  return v === true || v === 'true';
}

export function httpUrl(v) {
  try {
    const u = new URL(v);
    return u.protocol === 'https:' || u.protocol === 'http:';
  } catch {
    return false;
  }
}

export const DOMAIN_RE = /^(\*\.)?[a-z0-9]([a-z0-9-]*[a-z0-9])?(\.[a-z0-9]([a-z0-9-]*[a-z0-9])?)+$/i;
export const PACKAGE_RE = /^[a-zA-Z][a-zA-Z0-9_]*(\.[a-zA-Z][a-zA-Z0-9_]*)+$/;

export function uniqueName(map, name, exceptId) {
  for (const obj of map.values()) {
    if (obj.id !== exceptId && obj.name.toLowerCase() === name.toLowerCase()) return false;
  }
  return true;
}

export function fmtSecs(ms) {
  const s = ms / 1000;
  return `${Number.isInteger(s) ? s : s.toFixed(1)}s`;
}

// ---------- shared ----------

export function mustGet(map, id, label) {
  const obj = map.get(id);
  if (!obj) throw new Refusal(404, 'not_found', `No such ${label}: ${id}`);
  return obj;
}

// Field-level diff, prior value and new value — what a save reports back to the editor.
export function diff(before, after) {
  const changes = [];
  for (const field of Object.keys(after)) {
    if (field === 'updatedAt' || field === 'id') continue;
    const a = JSON.stringify(before[field]);
    const b = JSON.stringify(after[field]);
    if (a !== b) changes.push({ field, from: before[field], to: after[field] });
  }
  return changes;
}
