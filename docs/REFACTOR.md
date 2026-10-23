# What to improve in the code (prioritised)

Every item has the symptom, why it matters, and a suggested first step. Do them in this order; each step should leave the game playable and `tools/reference.py` unchanged.

## 1. Split the file into modules with a tiny build (highest value)
**Done (first cut).** `src/` + `build.js` (concat, no dependencies) + `npm run build|check|test`. The files are slices of the existing IIFEs, not real modules yet: scope is unchanged. Turning them into ES modules belongs with step 2, once the engine no longer reaches into the DOM.
- **Symptom**: 4,450 lines in one closure plus an inner closure. Engine code cannot reach scene functions, tests need a hook injected by string replace, and every feature added a new block at the end.
- **Why**: reading, reviewing and testing are slow; mobile packaging wants real assets and modules.
- **Step**: `src/` with `data/*.js` (ING, REC, STAFF, EXPS, CUST, calendar, trees), `state.js`, `engine/*.js` (orders, money, people, calendar, missions, longterm), `ui/*.js` (build, update, skin, venue, bank), `scene/*.js` (sprites, stages, customers, render, tutorial), `styles/*.css`. Build to a single `index.html` with esbuild or a 30-line Node concat script. Keep `npm run build` and `npm test` working. Keep ES5-compatible syntax or confirm the target browsers first.

## 2. Make the simulation independent from the DOM
**Done.** Event bus (`engine/events.js`), injected `now()`/`random()`, DOM helpers, windows, storage and the loop moved out of the engine; the engine runs headless in Node (`tools/engine.js`, `--node` in the tools). Playwright stays for the smoke test and UI checks. Not done yet: Node unit tests (step 9).
- **Symptom**: engine functions call `toast()`, `showOv()`, `$()`, read `ref.*`, and the UI layer reads engine state through polling. `simulate()` works headless only through a browser.
- **Why**: Node unit tests, faster balance sims (minutes become seconds), and a clean port to a native shell.
- **Step**: engine emits events (`served`, `walkout`, `monthEnd`, `dayChange`, `incident`, `notice`, `unlock`) through a tiny bus; UI subscribes. Pass `now()` and `random()` into the engine. Then run the engine in Node and keep Playwright for UI only.

## 3. Seeded randomness
- 35 `Math.random()` calls make sims noisy; failures are not reproducible.
- **Step**: one `rng()` (mulberry32) injected into the engine, seed settable from tests. Save the seed in `S` for debugging.

## 4. Delete the dead schedule system
**Done.** Schedule code, overtime, the hidden editor, the calendar staff strip and the week strip in the scene are gone; `load()` migrates old saves (`tests/saves/v5-pre-refactor.json`).
- 16 leftovers: `autoSched`, `OFFSTART`, `MAXLEN`, `MAXDAYS`, `LEAD`, `e.sch`, `schedStats`, `otHoursOn`, `empWorksAt` (now always true), the hidden schedule editor in the employee card, calendar coverage strips that now draw flat bars.
- **Step**: remove the code and the editor DOM, add a save migration that drops `e.sch`, simplify `shiftCounts`, `staffAt`, `daysWorking`. Run the tools to confirm no change.

## 5. Replace polling with events or direct calls
- 13 `setInterval` pollers (500 to 1500 ms) keep the UI layer in sync: `updTabs`, `decorate`, `updDash`, `groupStock`, `applyFolds`, `clampNotes`, `updNext`, `watchRecipes`, buttons.
- **Step**: after step 2, update only when the relevant event fires. Keep one `requestAnimationFrame` for the scene.

## 6. One DOM helper, no `innerHTML` with data
- Two helpers (`h` uses `innerHTML`, `el` uses `textContent`) and 12 `innerHTML` sites. Today all strings are static, but names and user input (bar name, regular names) are one change away from injection.
- **Step**: standardise on `el(tag, attrs, children)` with `textContent`; keep `innerHTML` only for static icons.

## 7. State schema and migrations
- `def()` plus ad hoc `if(!S.x)S.x=...` and lazily created fields (`S.ms`, `S.reg`, `S.deco`, `S.sup`, `S.nights`, `S.mods`, `S.hold`, `S.guide`, `S.leg`, `S.br`...).
- **Step**: add `S.v`, move every field into `def()`, write `migrate(S)` with numbered steps, test loading saves from each past version (keep fixture JSONs in `tests/saves/`).

## 8. Separate data from rules; one balance file
- Numbers are spread across 20 places (`EXPS`, `WAGEK`, `STAFFCAP`, `LINGER`, `MS_DAYREV`, `MENUREF`, reward factors inside functions...).
- **Step**: `data/balance.js` (or JSON) with every tunable and a comment of its design target; engine reads from it; `tools/reference.py` reads the same file so numbers cannot drift (today `WK` and `EXPANSION_COST` are duplicated in Python).

## 9. Automated tests and a regression gate
- Unit tests (Node): `spawnOrder` weights, `finishOrder` reward, `monthEnd`, `repossess`, `reorderChance`, missions, supplier pricing, `fxFor`.
- Golden economy test: `tools/reference.py` margins within 50-57% and paybacks within 1.3-2.6 months.
- Smoke test: fresh game and old save load with zero console errors at 390x780 in both color schemes.
- Wire into CI.

## 10. CSS hygiene
- 630 lines in layers where later blocks override earlier ones (`pixel skin`, `compact layout`, `pixel UI layer`, `app layout`); several rules are dead after later overrides; selectors depend on engine-generated structure (`#p-stock>.row`).
- **Step**: merge into one ordered stylesheet by component, delete overridden rules, give the engine's rows stable class names instead of structure selectors, and keep `data-*` for state.

## 11. Performance and battery (matters for the mobile app)
- `render()` redraws the whole scene every frame, including weather and decor; the scene is mostly static. `workers()` and `shiftCounts()` are recomputed often.
- **Step**: render at 30 fps (or on dirty), pause when hidden, cache per-frame derived data, avoid per-frame `Array.sort` on customers.

## 12. Accessibility and input
- Overlay has no focus trap or Escape; the bubble skip "x" is 20 px; canvas has no text alternative beyond `aria-label`; colour-only status in places.
- **Step**: focus management for `showOv`, 44 px targets, live region for toasts (exists), labels for icon-only controls.

## 13. Types and naming
- Short global names (`S`, `h`, `el`, `cl`, `h2`, `ic`, `pg`) and two clamp helpers (`clamp` in the engine, `cl` in the scene).
- **Step**: `// @ts-check` with JSDoc typedefs for `State`, `Employee`, `Order`, `Item`, then rename gradually.

## 14. Mobile packaging prerequisites
- Fonts load from Google Fonts: bundle the two font files locally.
- `localStorage` only: add export/import of the save and a storage abstraction so Capacitor Preferences or cloud save can replace it.
- Audio is created on first tap; test on iOS.

## Quick bug watch-list
- `S.hold` entries survive reload; verify scene recreates seated guests and that stale `rid` entries cannot block seats.
- `repossess()` clears many fields by hand: add a test that asserts every field it should reset.
- `showNotice` and `showIncident` wait for a free overlay; make sure a long-running overlay (Venue) cannot starve them.
- Offline `simulate()` auto-resolves incidents with the first free option; decide if that is the intended experience.
- Branch income uses a constant `HQP`, not the player's real profit; income can exceed what the chain actually makes.
