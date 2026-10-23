"""Shared helpers: drive the engine through Playwright, or headless in Node.

Browser: the game keeps everything inside one closure, so the tools build a copy of
index.html (tools/.build/index.hooked.html) that exposes engine internals on
window.__lc. The shipped index.html is never modified.
Node (node=True): tools/engine.js loads only the engine files from src/ and runs the
same tools/js scripts against it, several times faster and with no DOM at all.
"""
import json, pathlib, subprocess, time
from playwright.sync_api import sync_playwright

ROOT = pathlib.Path(__file__).resolve().parent.parent
SRC = ROOT / "index.html"
BUILD = ROOT / "tools" / ".build" / "index.hooked.html"
JS = ROOT / "tools" / "js"

# Anything the scenarios or bots call goes here. Missing names are skipped silently.
HOOK_NAMES = """def beginRun simulate tick syncStaff STAFFM EXPS ING INGM ITEMS skillNames autoAssignClerk payroll
buyStock skey cap collect mi UT expCost staffCap roleLimit buyExp wk WAGEK STAFFCAP SLOTBASE SEATINC LINGER maxSlots gDay
genCand hireCand save monthEnd repossess bankBorrow bankLimit repayDebt monthlyFixed msInit msAccept msDay msGenerate addStock
fireEmp dailyCost ingLock unlockIng NODEMAP nBuy nLevel nMax nReqMet canPay nCost roleUnlocked ROLES bookNight buyDecor setTheme
DECOR decorCost supSet openBranch CITIES retire canRetire guideStars guideUpdate guideCalc checkUnlocks applyPrices weatherOf
seasonOf fxNow fxFor shiftCounts spawnOrder finishOrder reorderChance rowdyStep calmRowdy escortRowdy rollIncident resolveInc
INCS showIncident showNotice NIGHTS stylePts supMode unitCost regAfterServe pickRegular legacyPoints buyLeg legLvl regOf bondOf
branchIncome dateOf setEnv""".split()


def build_hook():
    html = SRC.read_text(encoding="utf-8")
    anchor = "setInterval(loop,100);"
    assert html.count(anchor) == 1, "anchor for the hook was not found exactly once"
    lines = ["window.__lc={getS:function(){return S},resetMI:function(){MI=null}};"]
    lines += ["try{window.__lc.%s=%s}catch(e){}" % (n, n) for n in HOOK_NAMES]
    lines.append("window.__loopId=setInterval(loop,100);")
    BUILD.parent.mkdir(parents=True, exist_ok=True)
    BUILD.write_text(html.replace(anchor, "\n".join(lines), 1), encoding="utf-8")
    return BUILD


def new_game(pw, headless=True):
    """Open the hooked build, skip the tutorial and name the bar."""
    browser = pw.chromium.launch(headless=headless)
    page = browser.new_page(viewport={"width": 390, "height": 780})
    page.set_default_timeout(0)
    page.on("pageerror", lambda e: print("PAGE ERROR:", e))
    page.goto(build_hook().as_uri())
    page.wait_for_timeout(900)
    page.click("#pxskip")
    page.fill("#pxin", "Test")
    page.click("#pxok")
    page.wait_for_timeout(300)
    return browser, page


def js(name):
    return (JS / name).read_text(encoding="utf-8")


def run_node(script, calls, seed=None):
    """Run a tools/js script headless once per argument in calls. Call i uses seed + i."""
    job = json.dumps({"script": script, "calls": calls, "seed": seed})
    res = subprocess.run(["node", str(ROOT / "tools" / "engine.js")], input=job, capture_output=True, text=True, check=True)
    return json.loads(res.stdout)


def set_seed(page, seed):
    """The next new game in the page starts from this seed (None keeps them random)."""
    if seed is not None:
        page.evaluate("s=>window.__lc.setEnv({seed:function(){return s}})", seed)


def run_scenarios(scenarios, node=False, seed=None):
    """scenarios: list of (name, config dict). Returns a list of result dicts. Scenario i uses seed + i."""
    if node:
        out = run_node("scenario.js", [cfg for _, cfg in scenarios], seed)
        for (name, _), r in zip(scenarios, out):
            r["name"] = name
        return out
    out = []
    with sync_playwright() as pw:
        browser, page = new_game(pw)
        code = js("scenario.js")
        for i, (name, cfg) in enumerate(scenarios):
            set_seed(page, None if seed is None else seed + i)
            r = page.evaluate(code, cfg)
            r["name"] = name
            out.append(r)
        browser.close()
    return out


def run_bot(style, months=30, seeds=1, node=False, seed=None):
    """Run a bot style several times. With seed, run i uses seed + i."""
    if node:
        return run_node("bot.js", [[style, months]] * seeds, seed)
    out = []
    with sync_playwright() as pw:
        browser, page = new_game(pw)
        code = js("bot.js")
        for i in range(seeds):
            set_seed(page, None if seed is None else seed + i)
            t0 = time.time()
            r = page.evaluate(code, [style, months])
            r["secs"] = round(time.time() - t0)
            out.append(r)
        browser.close()
    return out
