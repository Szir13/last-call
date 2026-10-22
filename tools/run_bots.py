"""Play the whole game with rule-based bots and print a compact comparison.

    python tools/run_bots.py                       # all five styles, 5 runs of 30 game months
    python tools/run_bots.py careful --months 12 --seeds 3

Each run takes about 10 to 60 seconds. Styles run in parallel processes.
"""
import argparse, statistics as st
from concurrent.futures import ProcessPoolExecutor
from harness import run_bot

STYLES = {"careful": "Careful builder", "idle": "Idle (checks rarely)", "reckless": "Reckless (loans, no prep)",
          "heavy": "Staff-heavy", "optimizer": "Optimizer (uses everything)"}


def job(args):
    return args[0], run_bot(*args)


if __name__ == "__main__":
    ap = argparse.ArgumentParser()
    ap.add_argument("styles", nargs="*", default=list(STYLES))
    ap.add_argument("--months", type=int, default=30)
    ap.add_argument("--seeds", type=int, default=5)
    a = ap.parse_args()
    with ProcessPoolExecutor(max_workers=len(a.styles)) as ex:
        results = dict(ex.map(job, [(s, a.months, a.seeds) for s in a.styles]))
    print(f"{'bot':28}{'best stage':>14}{'month at S2 / S3 / S4':>26}{'went bust':>11}{'net worth':>14}{'guest sat':>11}")
    for s in a.styles:
        d = results[s]
        def month(stage):
            got = [r["reach"].get(str(stage)) for r in d if r["reach"].get(str(stage)) is not None]
            return (str(round(st.median(got))) if got else "-") + f" ({len(got)}/{len(d)})"
        print(f"{STYLES[s]:28}{str(sorted(r['peak'] for r in d)):>14}{month(2) + '  ' + month(3) + '  ' + month(4):>26}"
              f"{str(sum(1 for r in d if r['repo'] > 0)) + '/' + str(len(d)):>11}{int(st.median(r['networth'] for r in d)):>14,}{int(st.median(r['sat'] for r in d)):>10}%")
