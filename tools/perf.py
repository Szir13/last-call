"""CPU cost of the running game, per second of real time: how much work the page does while you play.

    python tools/perf.py [PAGE.html] [--secs 8] [--runs 3]

Plays the late-game save (tests/saves/v0-late.json) at 390x780 and reads Chromium's performance
counters over a few seconds, in four situations: the scene on screen, the scene scrolled out of
view, the scene hidden with "Hide scene", and another tab open. Prints medians of several runs:
busy ms per second (all main-thread tasks), script, style recalculation and layout ms per second,
and scene draws per second. Lower is better for battery.
"""
import json, pathlib, statistics as st, sys
from playwright.sync_api import sync_playwright

ROOT = pathlib.Path(__file__).resolve().parent.parent
METRICS = ["TaskDuration", "ScriptDuration", "RecalcStyleDuration", "LayoutDuration"]
# count scene draws: every render() starts by clearing the scene canvas (#pxcv)
COUNT = ("window.__frames=0;(function(){const c=CanvasRenderingContext2D.prototype.clearRect;"
         "CanvasRenderingContext2D.prototype.clearRect=function(){if(this.canvas.id==='pxcv')window.__frames++;return c.apply(this,arguments)}})()")


def seed_script():
    d = json.loads((ROOT / "tests" / "saves" / "v0-late.json").read_text())
    s = json.loads(d["last-call-orders-v5"])
    s["last"] = None   # filled in at load: no offline catch-up
    prefs = {"done": 1, "tabs": {t: 1 for t in ["stock", "staff", "upg", "book", "brand", "cal"]}}
    return ("(()=>{if(sessionStorage.x)return;sessionStorage.x=1;const s=%s;s.last=Date.now();"
            "localStorage.setItem('last-call-orders-v5',JSON.stringify(s));localStorage.setItem('last-call-pixel-v1',%s)})()"
            % (json.dumps(s), json.dumps(json.dumps(prefs))))


SITUATIONS = {
    "scene on screen": "()=>{}",
    "scene scrolled away": "()=>{const m=document.getElementById('main');m.scrollTop=m.scrollHeight}",
    "scene hidden": "()=>document.getElementById('pxhide').click()",
    "other tab (Team)": "()=>{document.querySelector('nav [data-tab=staff]').click();const m=document.getElementById('main');m.scrollTop=m.scrollHeight}",
}


def measure(page_html, secs, situation):
    with sync_playwright() as pw:
        b = pw.chromium.launch()
        c = b.new_context(viewport={"width": 390, "height": 780})
        c.add_init_script(seed_script())
        c.add_init_script(COUNT)
        p = c.new_page()
        cdp = c.new_cdp_session(p)
        cdp.send("Performance.enable")
        p.goto(pathlib.Path(page_html).resolve().as_uri())
        p.wait_for_timeout(1500)
        p.evaluate("()=>{const o=document.getElementById('ov');if(o)o.classList.remove('on')}")
        p.evaluate(SITUATIONS[situation])
        p.wait_for_timeout(1000)
        def snap():
            m = {x["name"]: x["value"] for x in cdp.send("Performance.getMetrics")["metrics"]}
            return [m.get(k, 0) for k in METRICS] + [p.evaluate("()=>window.__frames")]
        a = snap()
        p.wait_for_timeout(secs * 1000)
        z = snap()
        b.close()
    d = [(z[i] - a[i]) for i in range(len(a))]
    return [1000 * x / secs for x in d[:4]] + [d[4] / secs]


def run(page_html, secs=8, runs=3):
    out = {}
    for name in SITUATIONS:
        rs = [measure(page_html, secs, name) for _ in range(runs)]
        out[name] = [st.median(r[i] for r in rs) for i in range(5)]
    return out


def show(res):
    print(f"{'situation':22}{'busy ms/s':>11}{'script':>9}{'style':>8}{'layout':>8}{'draws/s':>10}")
    for k, v in res.items():
        print(f"{k:22}{v[0]:>11.1f}{v[1]:>9.1f}{v[2]:>8.1f}{v[3]:>8.1f}{v[4]:>10.1f}")


if __name__ == "__main__":
    args = [a for a in sys.argv[1:] if not a.startswith("--")]
    secs = int(sys.argv[sys.argv.index("--secs") + 1]) if "--secs" in sys.argv else 8
    runs = int(sys.argv[sys.argv.index("--runs") + 1]) if "--runs" in sys.argv else 3
    page = args[0] if args and args[0].endswith(".html") else ROOT / "index.html"
    show(run(page, secs, runs))
