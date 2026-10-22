# Features and where they live

Search the function names in `index.html`.

## Core loop
- Orders, jobs, satisfaction, tips: `spawnOrder finishOrder collect tick`.
- Repeat orders (up to `MAXRE`=3, chance from satisfaction, hospitality, cashier charm, regular bond): `reorderChance`, `S.hold`.
- Seats per stage and upgrades: `SLOTBASE SEATINC maxSlots`. Served guests linger: `LINGER lingerTime`.
- Prices: fair price from costs, willingness to pay by wealth class (`WTP`), pending price changes apply at next opening.

## Money
- Month end: `monthEnd` (payroll, rent and utilities, interest, auto-repay surplus, guide update, branch income).
- Bank: `bankBorrow bankLimit repayDebt`. Limit is twice last month's profit (min $2,000). You cannot expand while debt exceeds 25% of the expansion price. Three months in a row without paying the bills triggers `repossess()`: sale at 50% of the expansion price, one stage back, staff above the new limit let go, fittings, unlocked ingredients, stock and training lost, recipes kept (they show in the Menu as "known"). At the stand the bank restructures the debt (halves it). UI: Bank window, `showNotice`.
- Lease ramp after each expansion: 40%, 65%, 85%, 100% over three months (`rampK`).

## People
- Roles `STAFF` (apprentice, bartender, head, mixologist, manager, ambassador) and `SUPPORT` (cashier, clerk, prep chef, controller, security). Hiring: `genCand hireCand`. Staff limit per stage `STAFFCAP`; wages scale with the venue `WAGEK`/`wk()`; expanding raises everyone's wage.
- Starter deal: first cashier and first clerk at the stand work for half wage until you expand.
- Training (tree `TT`) doubles speed per level and earns ingredient picks (`TIERS`, `picksTotal`). Rare ingredients need a trained role plus reputation.
- Weekly schedules were removed: the team works whenever the bar is open. The code remains as stubs.

## Menu
- 23 ingredients in groups unlocked with picks, 15+ recipes plus solos, quality tiers (standard, premium, ultra). Recipes you discover stay known. Ingredient hints were removed on purpose: the player buys, then discovers.

## Progression
- Venue stages `EXPS`. Upgrade trees (`UT`, `PT`). Reputation level and perks. Achievements `ACH`.
- Special missions `ms*` (2 at once, 3 offers a day, rewards about 25% of a day's revenue).
- Tutorial: Joe, 8 steps, ends by naming the bar (`S.barName`).

## Venue window (inner IIFE) and long-term systems
- Bar Guide stars: `guideCalc guideUpdate guideStars`. Each star above 2: +3% guests, richer guests, more critics.
- Regulars: `pickRegular regAfterServe`, bond affects tips and repeat chance, cap `regCap()`.
- Decor and themes: `DECOR THEMES buyDecor setTheme stylePts`. Style adds satisfaction and arrivals. Drawn in `drawDecor`.
- Themed nights (live, quiz, cocktail): `NIGHTS bookNight`, applied in `fxFor`.
- Suppliers (spot, 3-month contract, volume, premium): `SUPS supSet`, hooked into `mkt()`.
- Incidents (fridge, inspection, review, shortage, power, viral): `INCS rollIncident resolveInc showIncident`.
- Rowdy guests and security role: `rowdyChance rowdyStep rowdyEscalate calmRowdy escortRowdy`.
- Seasons and weather (no state): `seasonOf weatherOf`, applied in `fxFor`, drawn in `drawWeather`.
- Branches and legacy (after the global chain): `CITIES openBranch branchIncome retire legacyPoints LEGP`.

## UI specifics
- Fixed dock + fixed nav, scrollable `#main`. Tabs appear as the bar grows (`TABRULE`). Sections fold (`applyFolds`). Ingredient and recipe cards open on tap. Upgrade trees show only the next nodes (`updNext`). Scene can be hidden; a strip keeps "waiting / Collect" visible.
