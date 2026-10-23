"""Economy check: one fully equipped team per stage, a simulated attentive player, two game months.

    python tools/reference.py            # reference teams at each stage's staff limit
    python tools/reference.py --sweep    # also show smaller and larger teams around the limit
    python tools/reference.py --node     # headless engine in Node, a few seconds, no browser
    python tools/reference.py --seed 1   # reproducible: the same seed gives the same numbers
    python tools/reference.py --check    # regression gate: medians of 10 seeded runs within the design targets
    python tools/reference.py --golden check|update   # exact seed-1 numbers vs tests/golden/reference.txt

Look at: margin % (target 50-56), payback of the next expansion (target 1.5-2.5 months),
and whether the team at the limit still earns more than a smaller one.
"""
import argparse, json, pathlib, subprocess
from harness import run_scenarios, run_bot

# game numbers come from src/js/data/balance.js through the engine, never copied here
BAL = json.loads(subprocess.check_output(["node", str(pathlib.Path(__file__).with_name("balance.js")), "WAGEK", "EXPS"]))

BASE = ["lemonjuice", "syrup", "soda", "orangejuice", "mint", "cranberry"]
G1 = ["limejuice", "tonic", "cola", "gin", "rum", "vodka", "cachaca", "beer"]
G2 = ["cucumber", "coffee", "gingerbeer", "pineapple", "coconut", "angostura", "amaretto", "prosecco", "triple", "tequila", "whiskey", "wine"]
G3 = ["pisco", "cognac", "vermouth", "campari", "aperol"]
G4 = ["elderflower", "mezcal", "chartreuse"]
SPIRITS = ["gin", "rum", "vodka", "cachaca", "whiskey", "tequila", "beer", "wine"]
WK = BAL["WAGEK"]
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
EXPANSION_COST = [e["c"] for e in BAL["EXPS"][1:]]   # price of the next stage


def table(rows):
    out = [f"{'scenario':16}{'staff':>6}{'menu':>6}{'revenue':>11}{'cogs':>9}{'rent+util':>11}{'payroll':>10}{'profit':>11}{'margin':>8}{'walk':>6}{'sat':>5}"]
    for r in rows:
        out.append(f"{r['name']:16}{r['staff']:>6}{r['menu']:>6}{r['rev']:>11,}{r['cogs']:>9,}{r['rent'] + r['util']:>11,}{r['pay']:>10,}{r['profit']:>11,}"
                   f"{round(100 * r['profit'] / max(1, r['rev'])):>7}%{r['walk']:>6}{r['sat']:>5}")
    return "\n".join(out)


def show(rows):
    print(table(rows))


def margin(r):
    return 100 * r["profit"] / max(1, r["rev"])


def payback(rows):
    return [round(EXPANSION_COST[i] / max(1, rows[i]["profit"]), 1) for i in range(4)]


def report(rows):
    return (table(rows) + "\n\npayback of the next expansion (months of profit): " + str(payback(rows)) +
            "\ndaily revenue (feeds MS_DAYREV in src/js/data/balance.js): " + str([round(r["rev"] / 28) for r in rows]))


# Regression gate (--check): medians of seeded headless runs must meet the design targets in docs/ECONOMY.md.
# The stand (S0) is exempt: it has almost no fixed costs (72% margin, 1-month payback by design).
MARGIN, PAYBACK, GATE_SEEDS = (50, 57), (1.3, 2.6), 10
GOLDEN = pathlib.Path(__file__).resolve().parent.parent / "tests" / "golden" / "reference.txt"


def check():
    import statistics as st
    runs = [run_scenarios(REFERENCE, True, 1000 * s) for s in range(1, GATE_SEEDS + 1)]
    ok = True
    print(f"median of {GATE_SEEDS} seeded runs (Node):")
    for i, (name, _) in enumerate(REFERENCE):
        m = st.median(round(margin(r[i])) for r in runs)          # whole percent per run, as reference.py prints them
        exact = st.median(margin(r[i]) for r in runs)
        good = i == 0 or MARGIN[0] <= m <= MARGIN[1]
        ok &= good
        print(f"  {name:14} margin {m:3.0f}% ({exact:.1f})  {'ok' if good else 'OUT OF ' + str(MARGIN)}" + ("  (stand, exempt)" if i == 0 else ""))
    for i in range(1, 4):
        pb = st.median(payback(r)[i] for r in runs)
        good = PAYBACK[0] <= pb <= PAYBACK[1]
        ok &= good
        print(f"  payback S{i}->S{i + 1}  {pb:4.1f} months  {'ok' if good else 'OUT OF ' + str(PAYBACK)}")
    return ok


def bots_line():
    """Seeded short bot runs that borrow, fall behind and get repossessed: the bank paths the scenarios never touch."""
    out = []
    for style in ("reckless", "idle"):
        r = run_bot(style, 12, 1, True, 1)[0]
        out.append(f"{style}: stage {r['final']}, net worth {r['networth']}, debt {r['debt']}, repossessed {r['repo']}, late {r['late']}")
    return "\n".join(out)


def golden(mode):
    text = report(run_scenarios(REFERENCE, True, 1)) + "\n\n" + bots_line() + "\n"
    if mode == "update":
        GOLDEN.parent.mkdir(parents=True, exist_ok=True)
        GOLDEN.write_text(text)
        print("golden updated:", GOLDEN)
        return True
    if GOLDEN.exists() and GOLDEN.read_text() == text:
        print("golden: identical to", GOLDEN.name)
        return True
    print("golden: the economy changed. If that was intended, run: python tools/reference.py --golden update\n--- expected\n"
          + (GOLDEN.read_text() if GOLDEN.exists() else "(missing)") + "--- got\n" + text)
    return False


if __name__ == "__main__":
    ap = argparse.ArgumentParser()
    ap.add_argument("--sweep", action="store_true")
    ap.add_argument("--node", action="store_true", help="run the engine headless in Node instead of a browser")
    ap.add_argument("--seed", type=int, help="seed for scenario 1 (scenario i uses seed + i); random if omitted")
    ap.add_argument("--check", action="store_true", help="regression gate: medians of seeded Node runs must meet the design targets")
    ap.add_argument("--golden", choices=["check", "update"], help="compare (or replace) the exact seed-1 numbers and bank-path bot runs in tests/golden/reference.txt")
    a = ap.parse_args()
    if a.check or a.golden:
        ok = (check() if a.check else True) and (golden(a.golden) if a.golden else True)
        raise SystemExit(0 if ok else 1)
    rows = run_scenarios(REFERENCE, a.node, a.seed)
    print(report(rows))
    if a.sweep:
        print()
        show(run_scenarios(SWEEP, a.node, a.seed))
