// api/store.js — the model's front door. Every rule lives in one of the store/ modules
// below, grouped by subject; this file re-exports them whole so callers (routes, tests,
// the mock world) import one module. Add a rule in the module that owns the subject.
//
// The modules import each other freely (an integration's seam reads its setup; a setup's
// seam reads its integrations). That is safe because every cross-module reference is
// made inside a function, at call time — never at module top level. Keep it that way.
export * from './store/state.js';
export * from './store/validate.js';
export * from './store/tags.js';
export * from './store/ladders.js';
export * from './store/setups.js';
export * from './store/keys.js';
export * from './store/publish.js';
export * from './store/version-changes.js';
