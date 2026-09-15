// store/session.js — WHO IS AT THE DOOR (8 Sep, user call: the console got a front door).
//
// The panel had a profile menu with a real Log out and no way back in — meLogOut cleared
// the page and offered a reload. This module is the other half: the accounts the console
// knows, the one session it holds, and what happens to an address at the door.
//
// WHAT IS REAL AND WHAT IS A STAND-IN. The session is real for the prototype: it lives
// here, sign-out clears it, and a reload with no session lands on the front door. What is
// mocked is the IDENTITY PROVIDER — nothing verifies that the person typing an address
// owns it, there is no password, no token, and no OAuth round trip. That is exactly the
// GAM arrangement (api/mock/gamunits.js stands in for the directory), and it is written
// down in ARCHITECTURE.md §11 rather than dressed up on screen. When auth lands, the real
// exchange answers `signIn` and the two refusals below keep their words.
//
// The accounts are INVENTED DATA, so they live in mock/world.js and are pushed in here by
// resetWorld — the store never reaches into the mock (that would be a cycle: the mock
// imports the store).
import { Refusal } from './state.js';

// One `@`, something either side, a dot in the domain. Deliberately not the RFC: this
// check exists so a typo is caught before the address is looked up, and its refusal names
// what was typed. Anything shaped like an address gets to be looked up and refused BY NAME.
export const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const session = {
  accounts: [],
  workDomain: '',
  accessOwner: null,
  signedIn: null,
};

/**
 * The mock's seam: the accounts the console knows, and the domain it shows as the EXAMPLE of
 * one (it was the gate until 8 Sep — see signIn; it now only shapes the placeholder and the
 * one refusal left).
 * Called by resetWorld, exactly as setGamUnits is.
 *
 * The seeded world is a world someone is already STANDING IN — the console has always
 * opened onto the rooms and the whole rule suite reads it that way — so a reset signs the
 * first account in. Sign-out is what makes the front door appear.
 * @param {Array<object>} accounts  fixture accounts, most senior first
 * @param {string} workDomain       the domain the console signs in
 * @param {object} [accessOwner]    who Request access goes to
 */
export function setAccounts(accounts, workDomain, accessOwner) {
  session.accounts = (accounts || []).map(a => ({ ...a }));
  session.workDomain = workDomain || '';
  session.accessOwner = accessOwner ? { ...accessOwner } : null;
  session.signedIn = session.accounts[0] || null;
}


/**
 * What the front door and the header band both read: whether anyone is signed in, and
 * the accounts this console has seen before — the "Continue as …" row's whole content.
 * A remembered account is a FACT the door states, never a name the view invents.
 */
export function sessionFacts() {
  return {
    account: session.signedIn,
    remembered: session.accounts.filter(a => a.provider),
    workDomain: session.workDomain,
    accessOwner: session.accessOwner,
  };
}

/**
 * Sign in an address.
 *
 * THE DOOR IS OPEN (8 Sep, user call: *"for now let it enter based on any email"*). Until this
 * cut the console signed in two fixture accounts and refused everything else by name — a
 * wrong-domain refusal and a no-account one. Both are gone, and deliberately: there is no
 * exchange behind this door yet (no password, no token, no OAuth), so a refusal saying *no
 * account here for you* was a lock with no key — it turned away the very people meant to walk
 * around the prototype, which is what a prototype is for. Anyone whose address is SHAPED like
 * an address gets in.
 *
 * ONE REFUSAL SURVIVES, because it is not about permission: `bad_address`, for something that
 * is not an address at all. The door disables its own act until the shape passes, so this is
 * the server refusing what the client already would — fail closed, and the server is the
 * authority. (See PRODUCT-LOG for the two refusals this replaced; when the real exchange lands
 * it answers HERE, and the words it turns people away with are its own.)
 *
 * A KNOWN ADDRESS KEEPS ITS IDENTITY. The fixture accounts carry a name, initials and a role
 * that the header band and the version history read; an address nobody knows carries only
 * itself, so the name is derived from it and the role is left NULL rather than invented — the
 * band draws no role where there is none, which is the honest shape for a visitor.
 * @param {string} email
 * @returns {object} the account now signed in
 */
export function signIn(email) {
  const typed = String(email ?? '').trim();
  if (!EMAIL_RE.test(typed)) {
    throw new Refusal(400, 'bad_address',
      `That is not an email address — it should look like name@${session.workDomain || 'company.com'}.`,
      { field: 'email' });
  }
  const addr = typed.toLowerCase();
  const known = session.accounts.find(a => a.email.toLowerCase() === addr);
  session.signedIn = known || visitorFrom(addr);
  return session.signedIn;
}

// An address nobody knows, read as a person: the local part's words, capitalised. It is a
// display name and nothing else — `role` stays null (we were not told one) and the account is
// NOT added to the remembered rows, because those are accounts a provider vouched for and a
// typed address has nobody behind it. Refresh the door and it is a stranger again.
function visitorFrom(addr) {
  const local = addr.slice(0, addr.indexOf('@'));
  const words = local.split(/[._+-]+/).filter(Boolean)
    .map(w => w[0].toUpperCase() + w.slice(1));
  const name = words.join(' ') || local;
  const initials = words.length > 1
    ? words.slice(0, 2).map(w => w[0]).join('')
    : name.slice(0, 2).toUpperCase();
  return { name, initials, role: null, email: addr };
}

/** Drop the session. Nothing else in the console is per-person, so this is the whole act. */
export function signOut() {
  session.signedIn = null;
}
