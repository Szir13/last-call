# Last Call: project guide for Claude Code

Single-file idle bar-management game, pixel-art styled, built to run in a phone browser and later be wrapped as a mobile app.
Source of truth: `index.html` (about 4,450 lines, no build step, no dependencies). Open it in a browser to play.

## Working with the owner
- The owner writes in Portuguese (PT-PT). **Reply in Portuguese. Game UI text and code comments stay in English.**
- Keep answers short and result-first. When asked to improve something, apply it and show what changed rather than proposing.
- Mobile first (390 px wide). Dark and light themes must both work. Pixel font only for big, short labels; all numbers and body text use the clean font (see "UI rules").
- The game will become a mobile app (PWA or Capacitor). Prefer changes that keep logic separable from the DOM.

## Run and test
```
open index.html                              # play
pip install -r tools/requirements.txt && playwright install chromium
python tools/reference.py [--sweep]          # economy check, one equipped team per stage, ~20 s
python tools/run_bots.py [styles] --months 30 --seeds 5   # five bot play styles, ~3 min
```
The tools build `tools/.build/index.hooked.html` (a copy with `window.__lc` exposing engine internals) and drive it with Playwright.
**After any change to numbers in the economy, run both tools and compare with `docs/ECONOMY.md`.**
For anything visual, take Playwright screenshots at 390x780 in both color schemes before calling it done.

## Map of index.html (search for the section comment)
| Area | What lives there |
|---|---|
| `<style>` | CSS in layers, later layers override earlier ones: base tokens, `pixel scene`, `pixel skin`, `compact layout`, `pixel UI layer`, `app layout`, then small appended blocks |
| `/* data */` ... `/* state */` | Static data: ingredients, recipes, staff roles, venue stages (`EXPS`), customers (`CUST`), calendar events, skill trees (`UT`, `TT`, `PT`), achievements |
| `/* state */` | `def()`, `load()`, `save()`, global state `S` |
| `calendar engine`, `schedules` | Dates, hours, `fxFor(day)` (all demand modifiers). Schedules are dead code, see `docs/REFACTOR.md` |
| `people, fixed costs, month end and day change` | Payroll, `monthEnd()`, `dayChange()`, bank and debt, repossession |
| `the order engine` | `tick()`, `spawnOrder()`, `finishOrder()`, `collect()`, seats, repeat orders, rowdy guests |
| `actions` | Buying, hiring, upgrading, expanding |
| `UI: build` / `UI: update` | DOM built once, updated every tick by id and cached refs (`ref`) |
| `special missions`, `long-term systems` | Missions, weather, themed nights, Bar Guide, regulars, decor, suppliers, incidents, branches, legacy |
| `start` | Boot sequence |
| `pixel scene` (inner IIFE) | Canvas scene, NPCs, bubbles, tutorial, and a UI layer: icons, cards, dock, venue window, bank and mission windows |

Details: `docs/ARCHITECTURE.md`. Features and where they live: `docs/FEATURES.md`. Numbers and calibration: `docs/ECONOMY.md`. What to improve: `docs/REFACTOR.md` and `docs/BACKLOG.md`.

## Rules that will bite you
1. **`S` is reassigned** by `load()` and `retire()` (`S=Object.assign(def(),...)`). Never cache `S` or its sub-objects across ticks. The test hook uses `getS()`.
2. **Engine functions are in one IIFE; the pixel scene is an inner IIFE.** Engine code cannot call scene functions (`openVenue`, `drawDecor`...). Put anything the engine must call at the top level of the main IIFE, before `/* start */`.
3. **`setC(el,cls)` and `setT(el,text)` overwrite className and textContent** and cache the last value. Do not add classes to engine-managed nodes; use `data-*` attributes (done for `data-open`, `data-exp`).
4. **Caches to invalidate**: `MI=null` after the menu changes (ingredients); `FXC.day=-1` after changing anything `fxFor` reads (nights, `S.mods`); `TV++` when the team changes.
5. **One global overlay** (`showOv`, `hideOv`). Notices (`S.notice`) and incidents (`S.inc`) are shown from `loop()` when the overlay is free.
6. **Old saves must keep loading.** New fields are created lazily (`S.ms`, `S.reg`, `S.deco`, `S.sup`...). Save keys: engine `last-call-orders-v5`, scene prefs `last-call-pixel-v1`. Add migrations next to `load()`.
7. **Randomness is unseeded** (`Math.random`), so sims vary run to run. Use 5 runs and medians.
8. Money is shown in dollars. Month = 28 days, year = 12 months. One game minute is about one real second while open, and time runs 12x faster while closed.
9. Offline progress calls `simulate()`; orders are only collected automatically by cashiers.

## UI rules
- Pixel font (`--px`, Pixelify Sans): money, section titles, nav labels, buy buttons. Everything with digits at body size uses `--sans` (Hanken Grotesk). Pixel digits at small sizes are unreadable (8 looks like S).
- Colors are tokens on `:root` with dark overrides (`--bg --surface --ink --muted --line --accent --edge --edge2 --gold`). The scene art uses fixed palettes.
- App layout: fixed `#dock` on top, `<nav>` fixed at the bottom, only `#main` scrolls. Do not reintroduce body scroll.
- Minimum tap target 44 px for primary actions. Respect `prefers-reduced-motion`.

## Definition of done for a change
Syntax check (`node --check` on the extracted script), no console errors on a fresh game and on an old save, `tools/reference.py` margins still 50-57% if economy was touched, screenshots in dark and light if UI was touched.
