# Architecture

## Shape of the file
`index.html` = head + CSS + HTML skeleton + one `<script>`. Inside the script there is **one IIFE** holding everything, and near the end an **inner IIFE** (`pixel scene`) that owns the canvas, the NPCs, the tutorial and a second UI layer. There is no module system, so ordering and scoping are load-bearing.

`index.html` is generated: `build.js` concatenates `src/styles/*.css` into the `<style>` and `src/js/**/*.js` into the `<script>` of `src/index.html`, in the order listed in `build.js`. The script files are plain slices of the IIFE, not modules: `js/main-open.js` and `js/main-close.js` open and close the main IIFE, `js/scene/scene-open.js` and `js/scene/scene-close.js` the scene IIFE. Everything between shares one scope, exactly as before the split. The build compiles the result with `vm.Script` to catch syntax errors, and `node build.js --check` fails when `index.html` is stale.

```
main IIFE
  data (ING, REC, STAFF, EXPS, CUST, calendar events, trees, achievements)
  state: def() load() save()  ->  S
  engine: calendar, payroll, monthEnd, dayChange, tick, spawnOrder, finishOrder, collect
  engine: missions, long-term systems (weather, nights, guide, regulars, decor, suppliers, incidents, rowdy, branches, legacy)
  actions: buy, hire, upgrade, expand
  UI build (once) and UI update (every tick, by id and cached refs)
  start: load -> build -> beginRun if new -> update
  inner IIFE "pixel scene": scene render, bubbles, tutorial, dock, cards, venue/bank/mission windows
  setInterval(loop,100)
```

## Time and the main loop
- `loop()` runs every 100 ms. If more than 5 s passed since the last call (tab was hidden, app closed) it calls `simulate(min(dt, offlineCap()))`, else `tick(dt,false)`.
- `simulate(secs)` calls `tick(2,true)` repeatedly. `quiet=true` suppresses toasts and overlays, and incidents auto-resolve.
- `tick(dt,quiet)` in order: market drift, clock (`S.gt` advances 1 per second open, 12 per second closed), `dayChange()` when the day number changes (which calls `monthEnd()` every 28 days), arrivals, seated customers who ask for another round, patience and rowdy guests, workers advance jobs, cashiers collect, prep chef, clerks restock.
- A day is about 13 real minutes open-and-closed together. A month is about 6 hours of real play.

## Orders (the heart of the game)
1. `tick` decrements `S.arrive`; at zero and while a seat is free (`freeSlot()` counts `S.orders` and `S.hold`) calls `spawnOrder()`.
2. `spawnOrder(re)` picks a customer type (`CUST`, weighted by period, `fxFor` modifiers, theme, Bar Guide), a wealth class, items (weighted by popularity, family modifiers, willingness to pay), patience, and may mark the order `rowdy`. `re` is an optional object `{slot,cust,cls,cid,n,rid,fav}` for repeat orders and regular visits.
3. Jobs are created per item and advanced by `workers()` (you plus staff on shift, speed doubles per training level). Missing ingredients stall a job.
4. `finishOrder(o)` computes satisfaction (`o.sat`), reward and tip, when every item is done. The order becomes `ready`.
5. `collect(o)` is called by the player's tap or a cashier. It pays, updates missions and regulars, rolls a repeat order (`reorderChance`), and pushes a `S.hold` entry: the guest stays seated for `lingerTime()`.
6. When the hold expires it either spawns the next round (same `cid`) or frees the seat.

Customer identity across rounds is `o.cid || o.id`. Regulars carry `o.rid`.

## State `S`
Created by `def()`, which lists every field (`v` is the save version); `src/js/data/types.js` describes each one (`State`). Important groups:
- Money and score: `money totalEarned served walkouts sat rep pts`.
- Venue: `exp` (0 stand .. 4 global chain), `expAt` (month of last expansion, drives the lease ramp), `upg`, `ing ql brand stock`, `price act`, `hours`.
- People: `team[] {id name role lvl xp sk[] wage cl starter?}`, `staff{role:n}` (derived by `syncStaff`), `maxStaff`, `train`, `picks`, `cands`.
- Finance: `month` (`rev cogs rent util pay waste interest gs gn gp`), `lastMonth`, `debt`, `late`, `notice`.
- Orders: `orders[] jobs[] hold[]`.
- Long-term: `ms` missions, `reg` regulars, `guide`, `deco`, `sup`, `nights`, `mods`, `ban`, `inc`, `br`, `leg`, `legacy`.

## Engine and UI
The engine (`data/`, `engine/`, `state.js`) has no DOM, storage or wall-clock access:
- **Out**: `emit(name,data)`, heard by `onEv(name,fn)`. Engine events: `toast`, `unlock` (new drinks), `menu` (ingredients changed), `stage` (venue changed), `hired`, `fired`, `save`. UI events: `render` (end of every `loop()`), `tab` (tab switched). The UI registers its listeners in `ui/overlay.js` and `app/storage.js`.
- **In**: `now()` reads `ENV.now`; `random()` is mulberry32 over `S.rng`, seeded by `def()` from `ENV.seed()`. `setEnv({now,seed})` replaces them (tests; `--seed` in the tools). The same seed gives identical results in the browser and in Node.
- Windows that only show engine state (`openHire`, `showNotice`, `showIncident`) live in `ui/windows.js`; `S.notice` and `S.inc` are still picked up by `loop()`.
- `tools/engine.js` loads only the engine files (the list comes from `build.js`) into an empty Node `vm` context and runs `tools/js/scenario.js` and `bot.js` against it. `reference.py --node` and `run_bots.py --node` use it.

## UI layers
1. **Engine UI** (original): panels `#p-stock #p-staff #p-upg #p-book #p-brand #p-cal`, built in `build()`, refreshed in `update()` using `setT/setC` and `ref.*`.
2. **Skin**: CSS only, one file per component (`src/styles/`). Cards and grids are applied with CSS to the same DOM: an ingredient row (`.row.ing`) becomes a card inside the `.cards` grid panels. Rows get their kind class from `mkRow(name, withBtn, kind)`, and every `setC` on a row starts from `r.cls`, so the kind survives updates.
3. **Scene module** adds: dock and strip, scene canvas, bubbles over the canvas (DOM, positioned by logical coordinates times `Z`), tutorial dialog, tab visibility, row decorations (`decorate()`), team dashboard, next-node cards for the upgrade tree, stock grouping (`groupStock()`), fold sections, and the Venue, Missions and Bank windows.
4. Layer 3 has no timers. `scene/ui/refresh.js` runs its updates on events: `menu` (recipe banner, stock groups), `stage` (expansion preview), structural changes inside the panels (a `MutationObserver`: row icons, folds; its own edits are discarded), and the `render` event from `loop()`, where values that change all the time refresh every 500 ms (dashboard and trees only while their tab is open). The only timers left are `loop()` (100 ms) and the scene's `requestAnimationFrame`.

## Scene
The scene draws at about 30 fps while it is on screen (`frame()` in `scene/layout.js`); scrolled away or with the page hidden it only moves the guests 4 times a second (`sync`) and draws nothing. Sprites are painted pixel by pixel once per palette and then copied (`spr()` in `scene/sprites.js`); the sound context is suspended 1.5 s after the last sound. Measure with `python tools/perf.py`.

Canvas is 160x140 logical pixels scaled by `Z` (fractional, snapped to device pixels). Layers: sky (dynamic) -> `LA` back (cached per stage and shelf contents) -> weather -> crew behind counter -> `LB` counter (cached) -> decor -> customers sorted by y -> weather in front -> day/night tint. Customers are NPCs derived each frame from `S.orders` and `S.hold` (`sync()`), never stored. Seats: up to 15 in three rows (`SLOTX/SLOTY`).

## Persistence
`localStorage`: engine state under `last-call-orders-v5` (every 5 s and on hide), scene preferences under `last-call-pixel-v1` (`done`, `hide`, `tabs`, `fold`, `mute`). `load()` calls `fromSave()`: the saved JSON is merged over `def()`, then every `MIGRATIONS` step from the save's `v` (0 when missing) to the current version runs, then small repairs and `syncStaff()`. Fixtures for each past version live in `tests/saves/` and are checked by `tests/unit/saves.test.js` (Node) and `tools/smoke.py` (browser). `retire()` rebuilds `S` and the page reloads.

## Test hook
`tools/harness.py` injects `window.__lc` before `setInterval(loop,100)`. Inner-IIFE functions are not reachable from the hook; test them through the DOM. With `node=True` the same scripts run against `tools/engine.js`, where `window.__lc` resolves any engine name.

## Tests
- `tests/unit/*.test.js` (`node:test`): each test builds a fresh headless engine with a fixed seed (`tests/unit/game.js`) and checks one rule. Engine objects come from another `vm` realm, so compare them through `JSON`.
- `tools/reference.py --check`: the design targets as a gate, on medians of 10 seeded runs (deterministic). `--golden`: the exact seed-1 numbers, plus short seeded `reckless` and `idle` bot runs for the loan and repossession paths, so any change to the economy is a deliberate, reviewed update of `tests/golden/reference.txt`.
- `tools/smoke.py`: the browser, for what Node cannot see (DOM, CSS, both color schemes, old saves on screen).
