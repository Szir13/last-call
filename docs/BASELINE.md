# Baseline before the refactor

Measured on commit `d70dec6` (single-file `index.html`), 2026-10-23, Chromium headless via Playwright.
Randomness is unseeded, so compare medians and ranges, not single numbers.

## `python tools/reference.py`, 5 runs
| Scenario | Margin per run | Median margin | Median revenue | Median profit |
|---|---|---|---|---|
| S0 limit 2 | 72 72 72 72 72 | 72% | 14,399 | 10,325 |
| S1 limit 5 | 55 57 54 56 56 | 56% | 84,657 | 47,472 |
| S2 limit 8 | 57 58 57 57 58 | 57% | 291,715 | 165,937 |
| S3 limit 12 | 57 53 57 57 56 | 57% | 615,935 | 348,075 |
| S4 limit 18 | 56 55 55 55 55 | 55% | 1,000,785 | 552,478 |

S0 at 72% is expected and documented in `docs/ECONOMY.md` (the stand has almost no fixed costs). The 50-57% gate applies to S1-S4.

One full run with `--sweep`:
```
scenario         staff  menu    revenue     cogs  rent+util   payroll     profit  margin  walk  sat
S0 limit 2           1     6     14,342    1,997      1,050     1,000     10,295     72%     0   91
S1 limit 5           5    20     72,961    7,758     19,700     8,580     36,923     51%   160   98
S2 limit 8           8    33    293,770   17,869     83,000    24,480    168,421     57%     0   97
S3 limit 12         12    60    613,518   28,705    176,000    62,750    346,063     56%     0   91
S4 limit 18         17    64    962,176   46,740    270,000   128,800    516,636     54%   103   99

payback of the next expansion (months of profit): [1.0, 2.0, 1.5, 2.3]
daily revenue (feeds MS_DAYREV in index.html): [512, 2606, 10492, 21911, 34363]

S1 3 staff           3    20     71,986    8,561     19,700     5,980     37,745     52%     1   95
S1 8 staff           8    20     87,137    9,248     19,700    14,560     43,628     50%     0   98
S2 5 staff           5    33    272,501   22,535     83,000    15,120    151,847     56%     0   97
S2 12 staff         12    33    299,970   18,639     83,000    37,800    160,531     54%    71   96
S3 8 staff           8    60    559,827   32,476    176,000    42,000    309,351     55%     0   98
S3 18 staff         16    60    615,303   37,017    176,000    90,000    312,287     51%     0   96
```

## `python tools/run_bots.py careful --months 12 --seeds 2`, 3 runs
| Run | Best stage | Month at S2 / S3 / S4 | Went bust | Net worth | Guest sat |
|---|---|---|---|---|---|
| 1 | 4, 4 | 6 / 7 / 10 | 0/2 | 1,193,985 | 99% |
| 2 | 4, 4 | 6 / 7 / 10 | 0/2 | 1,074,265 | 98% |
| 3 | 4, 4 | 6 / 7 / 10 | 0/2 | 988,782 | 98% |

## `python tools/smoke.py`
Fresh game and `tests/saves/v5-pre-refactor.json` (careful bot after 5 months: Neighborhood bar, 5 staff, every employee has `sch`), light and dark at 390x780: no console errors.

## How to compare after a change
```
python tools/smoke.py
python tools/reference.py        # run it 3-5 times; S1-S4 margins must stay within 50-57%
python tools/run_bots.py careful --months 12 --seeds 2
```

## After the refactor steps
| Step | Smoke | Median margins S0-S4 (runs) | Careful bot, 12 months |
|---|---|---|---|
| 1. split into `src/` | ok | 72 / 56 / 57 / 57 / 55 (3) | built `index.html` is byte-identical to the baseline apart from the banner line |
| 4. schedules removed | ok | 72 / 55 / 57 / 57 / 55 (5) | stages and months unchanged (6/7/10); net worth 866k-933k vs 833k-959k for step 1, three runs of 5 seeds each, side by side |
| 2. engine without DOM | ok | 10 runs side by side, previous / new: 72/56/57/57/55 vs 72/56/57/57/56 | browser 861k-1.15M vs 889k-1.08M before; Node 865k-1.0M; all five styles run 30 months headless with no errors |
| 3. seeded randomness | ok | browser 5 runs: 72/56/57/57/53; Node 20 seeds: 72/56/57/57/55 | same seed gives identical numbers in the browser and in Node. 200 runs per batch, Node, share of runs at 52% or less: S1 old 12 and 22 vs new 22 and 18; S4 old 16 vs new 13 and 19; medians 56 / 55 in every batch |

Margins have a low tail in every build (S1 down to 44%, S4 down to 47% in 200 runs, usually with walkouts from stock-outs). Single runs below 50% are not a regression by themselves; compare medians over 20+ seeds.
| 5. pollers replaced by events | ok | browser 5 runs: 72/57/57/56/55 | `--node --seed 11` reference and `--seed 5` five bots × 30 months: output identical (md5) to step 3; UI flows (icons, stock groups, recipe and mission banners, dashboard, bank and mission buttons, expansion preview, trees, note clamps) match step 3 side by side |
