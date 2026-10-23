"""Economy check: one fully equipped team per stage, a simulated attentive player, two game months.

    python tools/reference.py            # reference teams at each stage's staff limit
    python tools/reference.py --sweep    # also show smaller and larger teams around the limit
    python tools/reference.py --node     # headless engine in Node, a few seconds, no browser

Look at: margin % (target 50-56), payback of the next expansion (target 1.5-2.5 months),
and whether the team at the limit still earns more than a smaller one.
"""
import argparse
from harness import run_scenarios

BASE = ["lemonjuice", "syrup", "soda", "orangejuice", "mint", "cranberry"]
G1 = ["limejuice", "tonic", "cola", "gin", "rum", "vodka", "cachaca", "beer"]
G2 = ["cucumber", "coffee", "gingerbeer", "pineapple", "coconut", "angostura", "amaretto", "prosecco", "triple", "tequila", "whiskey", "wine"]
G3 = ["pisco", "cognac", "vermouth", "campari", "aperol"]
G4 = ["elderflower", "mezcal", "chartreuse"]
SPIRITS = ["gin", "rum", "vodka", "cachaca", "whiskey", "tequila", "beer", "wine"]
WK = [1, 1.3, 1.8, 2.5, 2.8]                      # keep in sync with WAGEK in index.html
INGS = [BASE, BASE + G1, BASE + G1 + G2[:8], BASE + G1 + G2 + G3, BASE + G1 + G2 + G3 + G4]
UP = [{}, {"cashier": 1, "clerk": 1, "counter4": 1}]
UP.append(dict(UP[1], counter5=1, seats=1, table=1, kitchen=1))
UP.append(dict(UP[2], glass=1, music=1))
UP.append(dict(UP[3], lights=1))


def scenario(stage, team, train=None, **kw):
    cfg = {"stage": stage, "wmul": WK[stage], "ings": INGS[stage], "upg": UP[stage], "team": team, "train": train or {}}
    if stage >= 2:
        cfg.update({"ql": SPIRITS, "qlv": 1 if stage == 2 else 2})
    cfg.update(kw)
    return cfg


REFERENCE = [
    ("S0 limit 2", scenario(0, {"apprentice": 1})),
    ("S1 limit 5", scenario(1, {"bartender": 2, "cashier": 1, "clerk": 2}, {"bartender": 1})),
    ("S2 limit 8", scenario(2, {"bartender": 3, "head": 1, "cashier": 2, "clerk": 1, "prepchef": 1}, {"bartender": 1, "head": 1})),
    ("S3 limit 12", scenario(3, {"head": 2, "mixologist": 2, "cashier": 3, "clerk": 3, "prepchef": 1, "controller": 1}, {"head": 2, "mixologist": 1})),
    ("S4 limit 18", scenario(4, {"head": 2, "mixologist": 3, "manager": 2, "ambassador": 1, "cashier": 4, "clerk": 3, "prepchef": 1, "controller": 1},
                              {"head": 3, "mixologist": 2, "manager": 1, "ambassador": 1})),
]
SWEEP = [
    ("S1 3 staff", scenario(1, {"bartender": 2, "cashier": 1})),
    ("S1 8 staff", scenario(1, {"bartender": 4, "cashier": 1, "clerk": 3}, {"bartender": 1})),
    ("S2 5 staff", scenario(2, {"bartender": 2, "head": 1, "cashier": 1, "clerk": 1}, {"bartender": 1, "head": 1})),
    ("S2 12 staff", scenario(2, {"bartender": 5, "head": 2, "cashier": 2, "clerk": 2, "prepchef": 1}, {"bartender": 2, "head": 1})),
    ("S3 8 staff", scenario(3, {"head": 1, "mixologist": 2, "cashier": 2, "clerk": 2, "prepchef": 1}, {"head": 1, "mixologist": 1})),
    ("S3 18 staff", scenario(3, {"bartender": 3, "head": 3, "mixologist": 3, "manager": 1, "cashier": 3, "clerk": 3}, {"head": 2, "mixologist": 2, "manager": 1})),
]
EXPANSION_COST = [10000, 75000, 260000, 780000]    # to the next stage; keep in sync with EXPS[].c


def show(rows):
    print(f"{'scenario':16}{'staff':>6}{'menu':>6}{'revenue':>11}{'cogs':>9}{'rent+util':>11}{'payroll':>10}{'profit':>11}{'margin':>8}{'walk':>6}{'sat':>5}")
    for r in rows:
        print(f"{r['name']:16}{r['staff']:>6}{r['menu']:>6}{r['rev']:>11,}{r['cogs']:>9,}{r['rent'] + r['util']:>11,}{r['pay']:>10,}{r['profit']:>11,}"
              f"{round(100 * r['profit'] / max(1, r['rev'])):>7}%{r['walk']:>6}{r['sat']:>5}")


if __name__ == "__main__":
    ap = argparse.ArgumentParser()
    ap.add_argument("--sweep", action="store_true")
    ap.add_argument("--node", action="store_true", help="run the engine headless in Node instead of a browser")
    a = ap.parse_args()
    rows = run_scenarios(REFERENCE, a.node)
    show(rows)
    prof = [r["profit"] for r in rows]
    print("\npayback of the next expansion (months of profit):", [round(EXPANSION_COST[i] / max(1, prof[i]), 1) for i in range(4)])
    print("daily revenue (feeds MS_DAYREV in index.html):", [round(r["rev"] / 28) for r in rows])
    if a.sweep:
        print()
        show(run_scenarios(SWEEP, a.node))
