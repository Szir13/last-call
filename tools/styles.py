"""Computed-style regression check for CSS work: did anything on screen change?

    python tools/styles.py snapshot OUT.json [PAGE.html]   # computed style of every element in every UI state (captured twice)
    python tools/styles.py compare A.json B.json            # list the states and elements whose style differs
    python tools/styles.py check BASE.json [PAGE.html]      # snapshot PAGE and compare with BASE; differing states are
                                                            # captured twice more and only repeatable differences count
    python tools/styles.py dead [PAGE.html]                 # declarations that never win in any captured state
    python tools/styles.py pairs [PAGE.html]                # rule pairs whose order decides a property somewhere:
                                                            # moving rules around must keep each pair's order

Each state is replayed with the game loop, clock, randomness and scene animation frozen, so two
snapshots of the same build are identical. States cover every tab, the venue, bank, missions, hire,
incident, notice and welcome-back windows, open cards, unfolded sections, order bubbles, the tutorial,
a toast and a banner, in light and dark, at 390 px and 768 px wide. Web fonts are blocked so text
metrics do not depend on the network (font-family declarations are still compared).
"""
import json, pathlib, sys
from playwright.sync_api import sync_playwright

ROOT = pathlib.Path(__file__).resolve().parent.parent
BUILD = ROOT / "tools" / ".build"
JS = (ROOT / "tools" / "js" / "styles.js").read_text()
NOW = 1790000000000
NAMES = "S update emit toast spawnOrder finishOrder showNotice showIncident openHire INCS unlockIng openExport openImport".split()
TABS = ["stock", "staff", "upg", "book", "brand", "cal"]


def hooked(page_html):
    html = pathlib.Path(page_html).read_text(encoding="utf-8")
    inj = "window.__lc={getS:function(){return S}};" + "".join("try{window.__lc.%s=%s}catch(e){}" % (n, n) for n in NAMES) + "setInterval(loop,100);"
    out = BUILD / ("styles-" + pathlib.Path(page_html).stem + ".html")
    BUILD.mkdir(parents=True, exist_ok=True)
    from harness import copy_assets
    copy_assets(BUILD)
    out.write_text(html.replace("setInterval(loop,100);", inj, 1), encoding="utf-8")
    return out.as_uri()


def init_script(save, prefs, away):
    s = json.loads(save)
    s["last"] = NOW - away * 1000
    data = {"last-call-orders-v5": json.dumps(s), "last-call-pixel-v1": json.dumps(prefs)}
    # no game loop, fixed clock, seeded Math.random, a fixed number of scene frames (window.__frames adds more)
    return """(()=>{const si=window.setInterval;window.setInterval=function(f,ms){return ms===100?0:si.apply(this,arguments)};
    Date.now=()=>%d;let x=7;Math.random=()=>((x=(x*16807)%%2147483647)/2147483647);
    const raf=window.requestAnimationFrame.bind(window);let t=0,budget=120,parked=[];
    window.__budget=()=>budget;window.__frames=n=>{budget+=n;const q=parked;parked=[];q.forEach(f=>window.requestAnimationFrame(f))};
    window.requestAnimationFrame=function(f){if(budget<=0){parked.push(f);return 0}budget--;return raf(function(){t+=16;f(t)})};
    if(!sessionStorage.x){sessionStorage.x=1;const d=%s;for(const k in d)localStorage.setItem(k,d[k])}})()""" % (NOW, json.dumps(data))


def fixture(name):
    d = json.loads((ROOT / "tests" / "saves" / name).read_text())
    return d["last-call-orders-v5"]


def settle(p):
    """Let transitions finish, freeze the scene, and pin positions the scene animates."""
    p.wait_for_timeout(450)
    p.wait_for_function("()=>window.__budget()<=0")
    # animations: start frame; transitions: end state, so timing never shows up in a snapshot
    p.evaluate("()=>document.getAnimations().forEach(a=>{if(a instanceof CSSTransition)a.finish();else{a.pause();a.currentTime=0}})")
    p.evaluate("""()=>{document.querySelectorAll('#pxov *').forEach(e=>{if(e.style.left)e.style.left='0px';if(e.style.top)e.style.top='0px';if(e.style.width&&e.tagName==='I')e.style.width='50%';if(e.style.getPropertyValue('--p'))e.style.setProperty('--p','50%')})}""")
    p.wait_for_timeout(50)


def states():
    """(name, save, prefs, away_seconds, actions). Actions run in order on a fresh page."""
    late, fresh = fixture("v0-late.json"), fixture("v0-fresh.json")
    done = {"done": 1, "tabs": {t: 1 for t in TABS}}
    out = []
    for t in TABS:
        out.append(("late-" + t, late, done, 0, [("tab", t)]))
    out.append(("late-open-cards", late, done, 0, [("tab", "stock"), ("click", "#p-stock>.row"), ("click", "#p-stock>.row.cl,#p-stock>.row.tier"),
                                                    ("tab", "book"), ("click", "#p-book>.row")]))
    out.append(("late-open-staff", late, done, 0, [("tab", "staff"), ("click", "#p-staff>.row:not(.locked)"), ("unfold", "#p-staff")]))
    out.append(("late-unfold-all", late, done, 0, [("tab", "stock"), ("unfold", "#p-stock"), ("tab", "brand"), ("unfold", "#p-brand")]))
    for i in range(1, 7):
        out.append(("venue-%d" % i, late, done, 0, [("click", "#pxven"), ("click", ".vtabs button:nth-child(%d)" % i)]))
    out.append(("bank", late, done, 0, [("eval", "S.debt=5000"), ("update",), ("click", "#pxbank")]))
    out.append(("missions", late, done, 0, [("click", "#pxmis")]))
    out.append(("hire", late, done, 0, [("eval", "S.money=1e7;S.team.length=4;TV=1"), ("update",), ("tab", "staff"), ("eval", "L.openHire('cashier')")]))
    out.append(("incident", late, done, 0, [("eval", "S.inc={id:L.INCS[0].id}"), ("eval", "L.showIncident()")]))
    out.append(("notice", late, done, 0, [("eval", "S.notice={type:'repo',from:'Hotel bar',to:'Neighborhood bar',sale:1,toDebt:1,cash:0,debtLeft:5,fired:1}"), ("eval", "L.showNotice()")]))
    out.append(("welcome-back", late, done, 3600, []))
    out.append(("export", late, done, 0, [("eval", "L.openExport()")]))
    out.append(("import", late, done, 0, [("eval", "L.openImport()")]))
    out.append(("bubbles", late, done, 0, [("eval", "S.orders=[];S.hold=[];for(let i=0;i<6;i++)L.spawnOrder();L.finishOrder(S.orders[0]);if(S.orders[1])S.orders[1].rowdy=true"),
                                           ("frames",), ("eval", "L.toast('Hello')")]))
    out.append(("compact-dock", late, done, 0, [("tab", "stock"), ("scroll",)]))
    out.append(("closed-bar", late, done, 0, [("eval", "S.gt=Math.floor(S.gt/1440)*1440+180"), ("update",)]))
    out.append(("collect-coins", late, done, 0, [("eval", "S.orders=[];S.hold=[];for(let i=0;i<4;i++)L.spawnOrder();S.orders.forEach(o=>L.finishOrder(o))"),
                                                 ("frames",), ("update",), ("click", "#pxcol"), ("frames",)]))
    out.append(("note-open", late, done, 0, [("tab", "stock"), ("click", ".panel.on .clamp")]))
    out.append(("fresh", fresh, {}, 0, []))
    out.append(("fresh-name-form", fresh, {}, 0, [("eval", "S.barName=''"), ("click", "#pxskip"), ("frames",)]))
    out.append(("staff-debt", late, done, 0, [("eval", "S.debt=5000;S.late=1"), ("update",), ("tab", "staff")]))
    out.append(("fresh-stock", fresh, done, 0, [("tab", "stock"), ("eval", "S.money=1e4;L.unlockIng('soda')"), ("update",)]))
    out.append(("fresh-upg", fresh, done, 0, [("eval", "S.money=1e4"), ("update",), ("tab", "upg")]))
    out.append(("fresh-staff", fresh, done, 0, [("tab", "staff")]))
    return out


def act(p, a):
    k = a[0]
    if k == "tab":
        p.evaluate("t=>{const b=document.querySelector('nav [data-tab=\"'+t+'\"]');b.classList.remove('pxgone');b.click()}", a[1])
    elif k == "click":
        p.evaluate("s=>{const all=[...document.querySelectorAll(s)];const e=all.find(x=>x.offsetParent)||all[0];if(e)e.click()}", a[1])
    elif k == "unfold":
        p.evaluate("s=>document.querySelectorAll(s+'>.h.fh.folded').forEach(h=>h.click())", a[1])
    elif k == "eval":
        p.evaluate("()=>{const L=window.__lc,S=L.getS();" + a[1] + "}")
    elif k == "update":
        p.evaluate("()=>{window.__lc.update();window.__lc.emit('render')}")
    elif k == "frames":
        p.evaluate("()=>window.__frames(45)")
        p.wait_for_function("()=>window.__budget()<=0")
    elif k == "scroll":
        p.evaluate("()=>{const m=document.getElementById('main');m.scrollTop=600;m.dispatchEvent(new Event('scroll'))}")
    p.wait_for_timeout(120)


def capture(page_html, mode="hash", only=None, paths=None):
    url, out = hooked(page_html), {}
    with sync_playwright() as pw:
        b = pw.chromium.launch()
        for scheme in ("light", "dark"):
            for width in (390, 768):
                for name, save, prefs, away, actions in states():
                    if width == 768 and not name.startswith("late-"):
                        continue
                    key = "%s/%s/%d" % (name, scheme, width)
                    if only and key not in only:
                        continue
                    c = b.new_context(viewport={"width": width, "height": 780}, color_scheme=scheme)
                    c.route("**/fonts.{googleapis,gstatic}.com/**", lambda r: r.abort())   # web fonts load at random times: use fallbacks
                    c.add_init_script(init_script(save, prefs, away))
                    p = c.new_page()
                    p.goto(url)
                    p.wait_for_timeout(300)
                    p.wait_for_function("()=>window.__budget()<=0")
                    for a in actions:
                        act(p, a)
                    p.evaluate("()=>{window.__lc.update();window.__lc.emit('render')}")
                    settle(p)
                    arg = {"mode": mode}
                    if paths is not None:
                        arg["paths"] = paths.get(key, [])
                    out[key] = p.evaluate(JS, arg)
                    c.close()
        b.close()
    return out


def compare(a, b, page_a=None, page_b=None):
    diffs = {}
    for k in a:
        if k not in b:
            diffs[k] = ["(state missing)"]
            continue
        bad = sorted(set(p for p in set(a[k]) | set(b[k]) if a[k].get(p) != b[k].get(p)))
        if bad:
            diffs[k] = bad
    return diffs


def dead(page_html):
    """Declarations (rule, longhand) that never win in any state, for rules whose every selector matched something."""
    res = capture(page_html, "cascade")
    first = next(iter(res.values()))
    rules, sels = first["rules"], first["sels"]
    matched, wins, media_seen = set(), set(), set()
    for r in res.values():
        matched |= set(r["matched"])
        wins |= set(r["wins"])
        media_seen |= {s["media"] for s in r["sels"] if s["media"] and s["mediaOn"]}
    report = []
    for ri, rule in enumerate(rules):
        rs = [s for s in sels if s["ri"] == ri]
        if any(s["dyn"] for s in rs) or (rule["media"] and rule["media"] not in media_seen):
            continue
        unmatched = [s["si"] for s in rs if "%d:%d" % (ri, s["si"]) not in matched]
        dead_props = [p for p in rule["props"] if not any("%d:%d:%s" % (ri, s["si"], p) in wins for s in rs)]
        if dead_props or unmatched:
            report.append({"ri": ri, "sel": rule["sel"], "media": rule["media"], "dead": dead_props,
                           "all_dead": len(dead_props) == len(rule["props"]), "unmatched_selectors": unmatched})
    return report


if __name__ == "__main__":
    cmd = sys.argv[1]
    if cmd == "snapshot":
        page = sys.argv[3] if len(sys.argv) > 3 else ROOT / "index.html"
        snap, second = capture(page), capture(page)
        flaky = compare(snap, second)
        if flaky:   # rare timing hiccups under load: a third capture breaks the tie
            third = capture(page, only=set(flaky))
            for k in flaky:
                snap[k] = third[k] if third[k] == second[k] else snap[k]
            print("re-captured", len(flaky), "state(s) that differed between two runs")
        pathlib.Path(sys.argv[2]).write_text(json.dumps(snap))
        print("states:", len(snap), " elements:", sum(len(v) for v in snap.values()))
    elif cmd == "compare":
        a, b = (json.loads(pathlib.Path(x).read_text()) for x in sys.argv[2:4])
        d = compare(a, b)
        for k, v in d.items():
            print("%-32s %4d element(s): %s" % (k, len(v), ", ".join(v[:4]) + (" ..." if len(v) > 4 else "")))
        print("identical" if not d else "%d state(s) differ" % len(d))
        sys.exit(1 if d else 0)
    elif cmd == "check":
        base = json.loads(pathlib.Path(sys.argv[2]).read_text())
        page = sys.argv[3] if len(sys.argv) > 3 else ROOT / "index.html"
        d = compare(base, capture(page))
        for _ in range(2):
            if not d:
                break
            again = capture(page, only=set(d))
            d = {k: v for k, v in compare({k: base[k] for k in again}, again).items()}
        for k, v in d.items():
            print("%-32s %4d element(s): %s" % (k, len(v), ", ".join(v[:4]) + (" ..." if len(v) > 4 else "")))
        print("identical in every state" if not d else "%d state(s) differ" % len(d))
        sys.exit(1 if d else 0)
    elif cmd == "pairs":
        res = capture(sys.argv[2] if len(sys.argv) > 2 else ROOT / "index.html", "cascade")
        rules = next(iter(res.values()))["rules"]
        pairs = sorted({tuple(map(int, p.split(">"))) for r in res.values() for p in r["pairs"]})
        print(json.dumps({"rules": rules, "pairs": pairs}))
    elif cmd == "dead":
        rep = dead(sys.argv[2] if len(sys.argv) > 2 else ROOT / "index.html")
        print(json.dumps(rep, indent=1))
