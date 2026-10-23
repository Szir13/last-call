"""Smoke test: a fresh game and an old save, at 390x780, in light and dark.

    python tools/smoke.py                  # tests index.html
    python tools/smoke.py path/to/page.html

Fails on any console error or page error. Screenshots of every tab go to
tools/.build/shots/ (fresh-light-stock.png, save-dark-cal.png, ...).
Old saves live in tests/saves/*.json as {localStorage key: value}.
"""
import json, pathlib, sys
from playwright.sync_api import sync_playwright

ROOT = pathlib.Path(__file__).resolve().parent.parent
SHOTS = ROOT / "tools" / ".build" / "shots"
TABS = ["stock", "staff", "upg", "book", "brand", "cal"]
# Seed localStorage once per context (the init script also runs on reloads). The save is dated
# one minute ago, so it always replays the same short offline catch-up however old the fixture is.
SEED = """(d)=>{if(sessionStorage.getItem('__seeded'))return;sessionStorage.setItem('__seeded','1');
for(const k in d){if(d[k]===null||k[0]==='_')continue;let v=d[k];
if(k==='last-call-orders-v5'){const s=JSON.parse(v);s.last=Date.now()-60e3;v=JSON.stringify(s)}
localStorage.setItem(k,v)}}"""


def visit(browser, url, scheme, label, save=None):
    errors = []
    ctx = browser.new_context(viewport={"width": 390, "height": 780}, color_scheme=scheme)
    if save:
        ctx.add_init_script("(%s)(%s)" % (SEED, json.dumps(save)))
    page = ctx.new_page()
    page.on("console", lambda m: m.type == "error" and errors.append("console: " + m.text))
    page.on("pageerror", lambda e: errors.append("pageerror: %s" % e))
    page.goto(url)
    page.wait_for_timeout(1200)
    if not save:
        page.click("#pxskip")
        page.fill("#pxin", "Smoke")
        page.click("#pxok")
    page.wait_for_timeout(2500)
    n = 0
    while page.locator("#ov.on").count() and n < 5:  # offline report, notices, incidents
        page.screenshot(path=str(SHOTS / ("%s-%s-overlay%d.png" % (label, scheme, n))))
        page.locator("#ov button:visible").last.click()
        page.wait_for_timeout(400)
        n += 1
    for t in TABS:
        tab = page.locator('nav [data-tab="%s"]' % t)
        if not tab.is_visible():
            continue  # locked tabs are hidden early in the game
        tab.click()
        page.evaluate("t=>{var p=document.getElementById('p-'+t);if(p)p.scrollIntoView()}", t)
        page.wait_for_timeout(350)
        page.screenshot(path=str(SHOTS / ("%s-%s-%s.png" % (label, scheme, t))))
    page.wait_for_timeout(1500)
    ctx.close()
    return errors


def main():
    src = pathlib.Path(sys.argv[1]).resolve() if len(sys.argv) > 1 else ROOT / "index.html"
    SHOTS.mkdir(parents=True, exist_ok=True)
    saves = sorted((ROOT / "tests" / "saves").glob("*.json"))
    failed = 0
    with sync_playwright() as pw:
        browser = pw.chromium.launch()
        for scheme in ("light", "dark"):
            runs = [("fresh", None)] + [(f.stem, json.loads(f.read_text())) for f in saves]
            for label, save in runs:
                errs = visit(browser, src.as_uri(), scheme, label, save)
                failed += len(errs)
                print("%-6s %-24s %s" % (scheme, label, "ok" if not errs else "FAIL"))
                for e in errs:
                    print("    " + e)
        browser.close()
    print("screenshots:", SHOTS)
    sys.exit(1 if failed else 0)


if __name__ == "__main__":
    main()
