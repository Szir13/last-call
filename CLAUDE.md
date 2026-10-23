# Last Call: project guide for Claude Code

Single-file idle bar-management game, pixel-art styled, built to run in a phone browser and later be wrapped as a mobile app.
Source of truth: `src/` (styles, HTML shell, 39 script slices). `node build.js` concatenates them into a single `index.html` (no dependencies, no transpiling); open that in a browser to play. **Never edit `index.html` by hand**: edit `src/`, then rebuild.

## Working with the owner
- The owner writes in Portuguese (PT-PT). **Reply in Portuguese. Game UI text and code comments stay in English.**
- Keep answers short and result-first. When asked to improve something, apply it and show what changed rather than proposing.
- Mobile first (390 px wide). Dark and light themes must both work. Pixel font only for big, short labels; all numbers and body text use the clean font (see "UI rules").
- The game will become a mobile app (PWA or Capacitor). Prefer changes that keep logic separable from the DOM.

## Run and test
```
node build.js                                # src/ -> index.html (also syntax-checks the script)
node build.js --check                        # fail if index.html is stale
open index.html                              # play (needs fonts/ and audio/ next to it; no network)
pip install -r tools/requirements.txt && playwright install chromium
python tools/reference.py [--sweep] [--node] # economy check, one equipped team per stage, ~20 s (~4 s with --node)
python tools/run_bots.py [styles] --months 30 --seeds 5 [--node]   # five bot play styles, ~3 min
python tools/smoke.py                        # fresh game + tests/saves/*.json, 390x780, light and dark, fails on console errors
npm run test:unit                            # Node unit tests (tests/unit/*.test.js), under a second; includes every save in tests/saves/
python tools/reference.py --check            # economy gate: medians of 10 seeded runs within 50-57% margin, 1.3-2.6 month payback
python tools/reference.py --golden check     # exact seed-1 numbers vs tests/golden/reference.txt (--golden update after an intended change)
npm run typecheck                            # TypeScript over the engine's JSDoc types (src/js/data/types.js), no build output
npm run test:fast                            # build check + unit tests + golden, ~10 s
python tools/a11y.py                         # accessibility audit (names, 44 px targets, contrast, keyboard, dialogs, reduced motion); part of npm test
python tools/perf.py                         # CPU cost per second while playing (scene on/off screen, hidden, other tab)
python tools/styles.py snapshot BASE.json     # computed style of every element in 84 UI states (~25 min); then after a CSS change:
python tools/styles.py check BASE.json        # must print "identical in every state" unless the change was meant to be visible
npm test                                     # everything, ~2 min: the same gate CI runs (.github/workflows/test.yml); activate .venv first
```
The tools build `tools/.build/index.hooked.html` (a copy with `window.__lc` exposing engine internals) and drive it with Playwright.
**Economy numbers live only in `src/js/data/balance.js`. After changing any of them, run both tools and compare with `docs/ECONOMY.md`.** With `--seed N` the same build always prints the same numbers, so a refactor that should not touch the economy must keep `reference.py --node --seed N` identical.
For anything visual, take Playwright screenshots at 390x780 in both color schemes before calling it done.

## Map of src/ (order is fixed in `build.js`)
All scripts are slices of **one** IIFE and share its scope: `js/main-open.js` opens it, `js/main-close.js` closes it, and `js/scene/scene-open.js` ... `scene-close.js` is the inner scene IIFE. A file is not a module: moving code between files changes nothing, moving it across the scene boundary changes scope.

| File(s) | What lives there |
|---|---|
| `src/index.html` | HTML shell with `@@styles` and `@@script` markers |
| `styles/` | one file per component, in this order: `tokens`, `base`, `layout`, `controls`, `panels`, `team`, `trees`, `calendar`, `windows`, `scene`, `shared` (rules that span components: pixel frame, fonts, reduced motion) |
| `js/data/` | `types` (JSDoc typedefs: State, Employee, Order, Item, Venue...), `balance` (every economy number, with its design target), `catalog` (ingredients, recipes, market news), `people` (staff roles, `EXPS`, `CUST`), `calendar`, `trees` (+ achievements) |
| `js/state.js` | `def()` (every field), `MIGRATIONS`, `fromSave()`, `migrate()` |
| `js/engine/` | `events` (`emit`, `onEv`, `now()`, `random()`, `toast`), `helpers` (menu, market, prices, caps), `calendar` (dates, hours, events, `fxFor`), `shifts` (`shiftCounts`: the whole team is on shift), `money` (payroll, `monthEnd`, `dayChange`), `orders` (`tick`, `spawnOrder`, `simulate`...), `actions`, `missions`, `longterm` |
| `js/ui/` | `dom` (`$`, `el`, `clear`, `setT`, `setC`), `overlay` (toast, `showOv`, event listeners), `windows` (hire, bank notice, incident), `build`, `update` |
| `js/app/` | `storage` (`load`, `save`, `storeGet`/`storeSet` over localStorage or a native store, `replaceGame` for imports), `loop` (the 100 ms heartbeat), `start` (boot) |
| `js/scene/` | `sprites`, `stages`, `customers`, `render`, `tutorial`, `layout`; `scene/ui/` is the second UI layer: `icons`, `effects`, `tabs`, `rows`, `expansion`, `trees`, `stock`, `missions`, `bank`, `decor`, `venue` |

The table below is the same map by section comment (search for it in `src/js`).

| Area | What lives there |
|---|---|
| `<style>` | CSS by component (see `src/styles/`); each rule lives once, in the file of its leftmost selector |
| `/* data */` ... `/* state */` | Static data: ingredients, recipes, staff roles, venue stages (`EXPS`), customers (`CUST`), calendar events, skill trees (`UT`, `TT`, `PT`), achievements |
| `/* state */` | `def()`, `load()`, `save()`, global state `S` |
| `calendar engine`, `who is on shift` | Dates, hours, `fxFor(day)` (all demand modifiers), `shiftCounts()` |
| `people, fixed costs, month end and day change` | Payroll, `monthEnd()`, `dayChange()`, bank and debt, repossession |
| `the order engine` | `tick()`, `spawnOrder()`, `finishOrder()`, `collect()`, seats, repeat orders, rowdy guests |
| `actions` | Buying, hiring, upgrading, expanding |
| `UI: build` / `UI: update` | DOM built once, updated every tick by id and cached refs (`ref`) |
| `special missions`, `long-term systems` | Missions, weather, themed nights, Bar Guide, regulars, decor, suppliers, incidents, branches, legacy |
| `start` | Boot sequence |
| `pixel scene` (inner IIFE) | Canvas scene, NPCs, bubbles, tutorial, and a UI layer: icons, cards, dock, venue window, bank and mission windows |

Details: `docs/ARCHITECTURE.md`. Mobile app shell, storage and iOS sound: `docs/MOBILE.md`. Features and where they live: `docs/FEATURES.md`. Numbers and calibration: `docs/ECONOMY.md`. What to improve: `docs/REFACTOR.md` and `docs/BACKLOG.md`.

## Rules that will bite you
1. **`S` is reassigned** by `load()` and `retire()` (`S=Object.assign(def(),...)`). Never cache `S` or its sub-objects across ticks. The test hook uses `getS()`.
2. **The engine (`data/`, `engine/`, `state.js`) never touches the DOM, storage or `Date.now`/`Math.random`.** It uses `now()`, `random()`, `toast()` and `emit(name,data)`; the UI listens with `onEv` (see `ui/overlay.js`). State changes belong in engine functions, not in click handlers. `tools/engine.js` runs the engine in Node with no DOM, so a slip shows up as a ReferenceError there. The pixel scene is an inner IIFE: nothing outside it can call scene functions (`openVenue`, `drawDecor`...); it reacts to events in `scene/ui/refresh.js`. Do not add `setInterval` pollers: the only timer is `loop()`.
3. **`setC(el,cls)` and `setT(el,text)` overwrite className and textContent** and cache the last value. Do not add classes to engine-managed nodes; use `data-*` attributes (done for `data-open`, `data-exp`).
4. **Caches to invalidate**: `menuChanged()` after the menu changes (ingredients; it clears `MI` and tells the UI); `FXC.day=-1` after changing anything `fxFor` reads (nights, `S.mods`); `TV++` when the team changes.
5. **One global overlay** (`showOv`, `hideOv`), a modal dialog: focus moves in and returns to the opener on `hideOv`. Notices (`S.notice`) and incidents (`S.inc`) are shown from `loop()` when the overlay is free.
6. **Old saves must keep loading.** Every field lives in `def()` with the value it has before the feature is used; a save is merged over `def()` by `fromSave()`. To change the save format, append a step to `MIGRATIONS` in `state.js` (never edit an old step) and add a fixture to `tests/saves/`; `tests/unit/saves.test.js` loads every fixture, migrates it and plays a week. Save keys: engine `last-call-orders-v5`, scene prefs `last-call-pixel-v1`. Read and write them only through `storeGet`/`storeSet` (never `localStorage` directly), so an app shell can swap the store (`docs/MOBILE.md`).
7. **Randomness is seeded.** The engine's `random()` is mulberry32 with its state in `S.rng` (`S.seed` records the start), so a save replays the same dice. New games get a random seed: compare balance with medians over many seeds (`--node` makes 20+ runs cheap), and use `--seed N` to reproduce a run exactly or to diff two builds. Cosmetic randomness in the scene still uses `Math.random`.
8. Money is shown in dollars. Month = 28 days, year = 12 months. One game minute is about one real second while open, and time runs 12x faster while closed.
9. Offline progress calls `simulate()`; orders are only collected automatically by cashiers.

## Types and names
- `src/js/data/types.js` documents every shape (`State` lists every field of `S`). Annotate new engine tables and functions with JSDoc (`/** @type {Role[]} */`, `/** @param {Order} o */`); `npm run typecheck` checks the engine as one file. A field missing from `State` is a type error, so add it to `def()` and to the typedef together.
- One helper per job: `clamp` (no scene copy), `el` for DOM, `dayPrice(f)` for prices that scale with the venue's daily revenue. `S`, `el`, `mi`, `wk` stay short: they are used everywhere and documented here.

## UI rules
- Pixel font (`--px`, Pixelify Sans): money, section titles, nav labels, buy buttons. Everything with digits at body size uses `--sans` (Hanken Grotesk). Pixel digits at small sizes are unreadable (8 looks like S).
- Colors are tokens on `:root` with dark overrides (`--bg --surface --ink --muted --line --accent --edge --edge2 --gold`). The scene art uses fixed palettes.
- App layout: fixed `#dock` on top, `<nav>` fixed at the bottom, only `#main` scrolls. Do not reintroduce body scroll.
- Minimum tap target 44 px for primary actions, 24 px for everything else; where the look must stay compact, widen the hit area with an invisible `::before` (see `#dock .pxstrip .ghost`). Respect `prefers-reduced-motion` for every animation.
- Text colours come from `--ink`, `--muted`, `--accent-ink` and `--warn`, which pass WCAG AA in both themes; `--accent` is for fills and borders only.
- Anything clickable that is not a `<button>` gets `role="button"` and `tabindex=0` (Enter and Space press it, see `ui/dom.js`). Windows go through `showOv`: it focuses the card, keeps Tab inside, and Escape presses the button marked `data-close` (or the one whose `onclick` is `hideOv`).
- CSS: put a rule in the component file of its context, never append an override block at the end. Style engine rows by their kind class (`.row.ing`, `.row.tier`, `.row.rec`, `.row.role`, `.row.emp`, `.row.exp`, `.row.ach`; set by `mkRow` and kept by `setC(r.row, r.cls + ...)`), not by structure (`#p-stock>.row`). State goes in `data-*` or a state class next to the kind.
- After any CSS change: `python tools/styles.py check BASE.json` against a snapshot taken before the change (`python tools/styles.py snapshot BASE.json`) proves nothing else moved; it compares the computed style of every element in 84 UI states.
- Build DOM with `el(tag, cls, content)` (`ui/dom.js`): content is text, or an array of nodes and strings for rich lines (`["Points: ", el("b",null,n)]`). Never use `innerHTML`; `clear(node)` empties a container. Names and saves are untrusted text.

## Definition of done for a change
`node build.js` and `index.html` committed with `src/`; `npm test` passes (unit tests, economy gate, golden numbers, smoke test on a fresh game and every old save). If you changed the economy on purpose, the golden fails: check the new numbers against `docs/ECONOMY.md`, then `python tools/reference.py --golden update` and commit it. New engine behaviour gets a unit test in `tests/unit/`; a save format change gets a `MIGRATIONS` step and a fixture. Look at the screenshots in `tools/.build/shots/` if UI was touched.
