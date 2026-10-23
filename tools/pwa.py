"""Installable and offline: serve www/ over http and check it as a phone would.

    python tools/pwa.py          (after node build.js)

Chromium: the service worker takes control, the browser reports no installability errors, the music
plays after a tap, then with the network cut the page reloads, the game starts with its fonts and icons,
and the music plays from the cache. Exit code 1 on any failure.
"""
import functools, http.server, pathlib, sys, threading
from playwright.sync_api import sync_playwright

ROOT = pathlib.Path(__file__).resolve().parent.parent
WWW = ROOT / "www"


class Quiet(http.server.SimpleHTTPRequestHandler):
    def log_message(self, *a):
        pass


def serve():
    srv = http.server.ThreadingHTTPServer(("127.0.0.1", 0), functools.partial(Quiet, directory=str(WWW)))
    threading.Thread(target=srv.serve_forever, daemon=True).start()
    return srv, "http://127.0.0.1:%d/" % srv.server_address[1]


MUSIC = "()=>{const a=[...document.querySelectorAll('audio')].concat(window.__aud||[])[0];return a?{playing:!a.paused,t:a.currentTime,src:a.src.split('/').pop(),err:a.error&&a.error.code}:null}"
CATCH = "(()=>{const A=window.Audio;window.__aud=[];window.Audio=function(){const a=new A(...arguments);window.__aud.push(a);return a};window.Audio.prototype=A.prototype})()"


def main():
    if not (WWW / "sw.js").exists():
        sys.exit("www/ is missing: run node build.js first")
    srv, url = serve()
    fails = []
    def check(ok, what):
        print(("ok    " if ok else "FAIL  ") + what)
        if not ok:
            fails.append(what)
    with sync_playwright() as pw:
        b = pw.chromium.launch()
        c = b.new_context(viewport={"width": 390, "height": 780})
        c.add_init_script(CATCH)
        p = c.new_page()
        errs = []
        p.on("pageerror", lambda e: errs.append(str(e)))
        p.goto(url)
        p.evaluate("()=>navigator.serviceWorker.ready")
        p.reload()
        p.wait_for_timeout(800)
        check(p.evaluate("()=>!!navigator.serviceWorker.controller"), "service worker controls the page")
        cdp = c.new_cdp_session(p)
        inst = cdp.send("Page.getInstallabilityErrors").get("installabilityErrors", [])
        check(not inst, "installable (Chromium reports no errors)" + ("" if not inst else ": " + str(inst)))
        man = cdp.send("Page.getAppManifest")
        check(not man.get("errors") and '"Last Call - Bar Simulation"' in (man.get("data") or ""), "manifest parsed, name is Last Call - Bar Simulation")
        p.click("#pxskip")
        p.wait_for_timeout(2500)
        m = p.evaluate(MUSIC)
        check(bool(m and m["playing"]), "music plays online after a tap: %s" % m)
        c.set_offline(True)
        p.reload()
        p.wait_for_timeout(1200)
        check(p.evaluate("()=>!!document.getElementById('dock')&&document.getElementById('dock').offsetHeight>0"), "offline: the game starts")
        check(p.evaluate("()=>document.fonts.check('700 16px \"Pixelify Sans\"')&&document.fonts.check('600 16px \"Hanken Grotesk\"')"), "offline: fonts load")
        check(p.evaluate("async()=>{const r=await fetch('icons/icon-192.png');return r.ok}"), "offline: icons load")
        p.click("#pxskip") if p.locator("#pxskip").is_visible() else p.click("#pxhide")
        p.wait_for_timeout(2500)
        m = p.evaluate(MUSIC)
        check(bool(m and m["playing"] and m["t"] > 0.5), "offline: music plays from the cache: %s" % m)
        check(not errs, "no page errors" + ("" if not errs else ": " + "; ".join(errs)))
        b.close()
    srv.shutdown()
    print("pwa: " + ("all good" if not fails else "%d failure(s)" % len(fails)))
    sys.exit(1 if fails else 0)


if __name__ == "__main__":
    main()
