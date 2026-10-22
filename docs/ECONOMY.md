# Economy

## Design targets (a month = 28 game days)
- Profit margin of a fully equipped, attentive player: **50-57%** at every stage.
- Payback of the next expansion: **1.5-2.5 months** of current profit.
- Extra staff beyond the stage limit should earn less than they cost.
- Engaged play (decor, themed nights, volume supplier, missions) earns roughly **+3% to +10% revenue** over plain play. It must never double income.
- A new venue must be survivable before it is fully equipped: lease ramp 40/65/85/100%.

## The knobs (all in `index.html`)
| Constant | Meaning | Current |
|---|---|---|
| `EXPS[]` | name, expansion price `c`, seconds between arrivals `int`, items per order `k`, `rent`, `util` per month | stand 0 / 9.6 s / 900+150; bar 10,000 / 7.8 s / 17,000+2,700; hotel 75,000 / 6.9 s / 71,000+12,000; rooftop 260,000 / 5.9 s / 150,000+26,000; chain 780,000 / 4.5 s / 232,000+38,000 |
| `STAFFCAP` | max team size per stage | 2, 5, 8, 12, 18 |
| `WAGEK` | wage level per stage (new hires, market rate; expanding raises everyone) | 1, 1.3, 1.8, 2.5, 2.8 |
| `STAFF[].w`, `SUPPORT[].w` | base monthly wage | apprentice 1000, bartender 1800, head 2800, mixologist 3800, manager 4800, ambassador 6500, cashier 1000, clerk 1000, prep chef 2400, controller 3500, security 2200 |
| `SLOTBASE`, `SEATINC` | seats before upgrades, seats per seat upgrade | base 3,4,5,7,9; +1,+1,+2,+2,+3 each (max 5, 6, 9, 11, 15) |
| `LINGER` | seconds a served guest stays seated | 8, 12, 16, 18, 20 |
| `MAXRE` | repeat rounds per guest | 3 |
| `MS_DAYREV` | typical daily revenue per stage, scales mission rewards, incident costs, decor and night prices (`ic()`) | 505, 3000, 10400, 22300, 34000 |
| `MS_MAX` | missions held at once | 2 |
| `LATE_MAX`, `bankLimit()` | months behind before repossession; loan limit | 3; 2 x last month's profit (min 2,000) |
| `rampK()` | lease ramp after expansion | 0.4, 0.65, 0.85, 1 |
| `TIERS`, `FREEP`, `TRAIN_COST` | ingredient picks from training, free picks, training price in months of wage | see source |
| `HQP`, `CITIES[].cost` | branches: share of a chain's profit, opening prices | 455,000; 2.7M to 13.5M |

## Recalibrating (in this order)
1. Change rent/util or arrival `int` in `EXPS`.
2. `python tools/reference.py`. Check margin, payback and `daily revenue`.
3. Copy the printed daily revenue into `MS_DAYREV`.
4. If you changed `LINGER`, seats or `int`, run `python tools/reference.py --sweep` to see whether larger teams still lose money.
5. `python tools/run_bots.py` to check pacing and failure modes.

## Measured on the current build
Reference teams, two game months, attentive player (`tools/reference.py`):

| Stage | Staff | Revenue | Rent+util | Payroll | Profit | Margin | Payback of next |
|---|---|---|---|---|---|---|---|
| Stand | 1 | 14,300 | 1,050 | 1,000 | 10,300 | 72% | 1.0 mo |
| Neighborhood | 5 | 81,100 | 19,700 | 8,600 | 44,200 | 55% | 1.7 mo |
| Hotel | 8 | 294,900 | 83,000 | 24,500 | 168,700 | 57% | 1.5 mo |
| Rooftop | 12 | 623,600 | 176,000 | 62,800 | 356,900 | 57% | 2.2 mo |
| Global chain | 17 | 1,009,000 | 270,000 | 128,800 | 561,500 | 56% | - |

Bots, 5 runs each of 30 game months (`tools/run_bots.py`):

| Bot | Best stage | Month at hotel / rooftop / chain | Went bust | Net worth at month 30 |
|---|---|---|---|---|
| Careful builder | chain 5/5 | 6 / 7 / 10 | 0/5 | about 7.5M |
| Staff-heavy | chain 5/5 | 7 / 8 / 10 | 0/5 | about 7.3M |
| Optimizer (decor, nights, branches) | chain 5/5 | 6 / 8 / 10 | 0/5 | about 3.9M (invests in branches) |
| Reckless (loans, no preparation) | rooftop (1 run reaches the chain) | 11 / 17 / 21 | 0/5 | about 123k |
| Idle (taps rarely) | neighborhood bar, then repossessed | - | repossessed 1-2 times each | about -2k to -8k |

## Bugs the bots found (already fixed, keep as regression tests)
- Loans could finance every expansion, reaching the chain in two months. Fix: limit from profit, no expansion with debt over 25% of the price.
- Rent jumped from 1,050 to 19,700 on the first expansion and bankrupted anyone not yet equipped. Fix: lease ramp.
- First automation (cashier, clerk) cost more than the stand earns. Fixes: base wage 1,000 and the starter deal (half wage until you expand).

## Known weak spots
- **Low-attention play**: at the stand, orders are only collected by taps or by a cashier (one slot per cashier). Players who check in rarely earn little and, if they expand early, get repossessed. Options: show last month's profit next to the new rent in the expansion text; let the stand earn part of its sales offline (a tip jar); warn before expanding without enough profit.
- Hotel and above rely on the player hiring clerks for restocking; without them stock-outs lower satisfaction, arrivals and revenue in a spiral.
- Cost of goods is only 6-15% of revenue and falls with stage; supplier choices therefore move profit by about 1%. Raise ingredient costs per stage if suppliers should matter more.
- The sim assumes an attentive player; automation (cashiers, clerks) is therefore undervalued in the margin numbers.
