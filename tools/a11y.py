"""Accessibility audit: names, tap targets, contrast, keyboard reach, dialogs and reduced motion.

    python tools/a11y.py [PAGE.html] [--json OUT.json]

Replays the UI states of tools/styles.py (light and dark, 390 px) and reports, grouped by element:
  name      a control a screen reader cannot announce (no text, label or aria-label)
  target    a tap target under 24 px, or under 44 px for primary actions (buy, nav, dock, dialogs)
  contrast  text below WCAG AA (4.5:1, or 3:1 for large text); disabled controls are exempt.
            contrast-halo: the same for text drawn with a dark outline (pixel labels), shown as a warning
  keyboard  something clickable that the keyboard cannot reach
  dialog    a window that does not take focus, lets Tab escape, ignores Escape or loses the opener
  motion    an animation still running when the system asks for reduced motion
Exit code 1 when anything is found.
"""
import json, pathlib, sys
from playwright.sync_api import sync_playwright
sys.path.insert(0, str(pathlib.Path(__file__).resolve().parent))
import styles

ROOT = pathlib.Path(__file__).resolve().parent.parent
JS = (ROOT / "tools" / "js" / "a11y.js").read_text()
DIALOGS = [("venue", "#pxven"), ("bank", "#pxbank"), ("missions", "#pxmis")]


def page_for(b, url, scheme, save, prefs, away, motion="no-preference"):
    c = b.new_context(viewport={"width": 390, "height": 780}, color_scheme=scheme, reduced_motion=motion)
    c.route("**/fonts.{googleapis,gstatic}.com/**", lambda r: r.abort())
    c.add_init_script(styles.init_script(save, prefs, away))
    p = c.new_page()
    p.goto(url)
    p.wait_for_timeout(300)
    p.wait_for_function("()=>window.__budget()<=0")
    return c, p


def audit(page_html):
    url, issues = styles.hooked(page_html), {}
    def add(rule, sel, detail, where):
        k = (rule, sel)
        if k not in issues:
            issues[k] = {"rule": rule, "sel": sel, "detail": detail, "where": []}
        if where not in issues[k]["where"]:
            issues[k]["where"].append(where)
    late = styles.fixture("v0-late.json")
    done = {"done": 1, "tabs": {t: 1 for t in styles.TABS}}
    with sync_playwright() as pw:
        b = pw.chromium.launch()
        for scheme in ("light", "dark"):
            for name, save, prefs, away, actions in styles.states():
                c, p = page_for(b, url, scheme, save, prefs, away)
                for a in actions:
                    styles.act(p, a)
                p.evaluate("()=>{window.__lc.update();window.__lc.emit('render')}")
                p.wait_for_timeout(200)
                for i in p.evaluate(JS):
                    add(i["rule"], i["sel"], i["detail"], name + "/" + scheme)
                c.close()
        # dialogs: focus moves in, Tab stays in, Escape closes and focus goes back to the button that opened it
        for dname, opener in DIALOGS:
            c, p = page_for(b, url, "light", late, done, 0)
            if not p.locator(opener).count() or not p.locator(opener).is_visible():
                c.close(); continue
            p.focus(opener)
            p.keyboard.press("Enter")
            p.wait_for_timeout(200)
            inside = p.evaluate("()=>!!document.activeElement.closest('#ov')")
            if not inside:
                add("dialog", dname, "focus does not move into the window", "keyboard")
            escaped = False
            for _ in range(25):
                p.keyboard.press("Tab")
                if not p.evaluate("()=>!!document.activeElement.closest('#ov')"):
                    escaped = True; break
            if escaped:
                add("dialog", dname, "Tab moves focus out of the open window", "keyboard")
            p.keyboard.press("Escape")
            p.wait_for_timeout(150)
            if p.evaluate("()=>document.getElementById('ov').classList.contains('on')"):
                add("dialog", dname, "Escape does not close the window", "keyboard")
            elif p.evaluate("o=>document.activeElement!==document.querySelector(o)", opener):
                add("dialog", dname, "focus does not return to " + opener + " after closing", "keyboard")
            c.close()
        # reduced motion: nothing should keep animating
        for name in ("bubbles", "collect-coins", "fresh-stock", "fresh"):
            st = [s for s in styles.states() if s[0] == name][0]
            c, p = page_for(b, url, "light", st[1], st[2], st[3], motion="reduce")
            for a in st[4]:
                styles.act(p, a)
            p.wait_for_timeout(200)
            for an in p.evaluate("()=>document.getAnimations().filter(a=>a.playState==='running'&&a.animationName).map(a=>a.animationName+' on '+(a.effect.target.id||a.effect.target.className))"):
                add("motion", an.split(" on ")[0], an, name)
            c.close()
        b.close()
    return sorted(issues.values(), key=lambda x: (x["rule"], x["sel"]))


if __name__ == "__main__":
    args = [a for a in sys.argv[1:] if not a.startswith("--")]
    page = args[0] if args and args[0].endswith(".html") else ROOT / "index.html"
    res = audit(page)
    if "--json" in sys.argv:
        pathlib.Path(sys.argv[sys.argv.index("--json") + 1]).write_text(json.dumps(res, indent=1))
    counts = {}
    for i in res:
        counts[i["rule"]] = counts.get(i["rule"], 0) + 1
    for i in res:
        print("%-9s %-58s %s   [%d state(s), e.g. %s]" % (i["rule"], i["sel"][:58], i["detail"][:60], len(i["where"]), i["where"][0]))
    print("issues:", counts or "none")
    sys.exit(1 if any(i["rule"] != "contrast-halo" for i in res) else 0)
