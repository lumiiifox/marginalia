"""A deploy while the app is installed:  python3 tests/deploy.py

A deploy while the phone has a fresh HTTP-cached index.html (GitHub Pages sends Cache-Control: max-age=600).
Serves a copy of the app with that header and ETag/Last-Modified revalidation, opens it with the service worker, changes
index.html and a script (as a deploy would), then opens the app again within the 10 minutes."""
import asyncio, sys, shutil, threading, os, time, tempfile
from pathlib import Path
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from functools import partial
from playwright.async_api import async_playwright
SRC = Path(__file__).resolve().parent.parent; COPY = Path(tempfile.mkdtemp()) / "site"
PORT = int(os.environ.get("MG_PORT", 8850)); URL = f"http://localhost:{PORT}/index.html"
READY = "typeof idb !== 'undefined' && idb && S.mode === 'ready'"
LOG = []
failures = []
def check(ok, msg):
    print(("ok   " if ok else "FAIL ") + msg)
    if not ok: failures.append(msg)
class H(SimpleHTTPRequestHandler):
    def end_headers(self):
        self.send_header("Cache-Control", "max-age=600"); super().end_headers()
    def log_message(self, fmt, *a): LOG.append(self.path + " " + (a[1] if len(a) > 1 else ""))
async def main():
    if COPY.exists(): shutil.rmtree(COPY)
    shutil.copytree(SRC, COPY, ignore=shutil.ignore_patterns(".git", "tests", "tools", "data/books"))
    srv = ThreadingHTTPServer(("localhost", PORT), partial(H, directory=str(COPY)))
    threading.Thread(target=srv.serve_forever, daemon=True).start()
    try:
        async with async_playwright() as p:
            br = await p.chromium.launch()
            ctx = await br.new_context(bypass_csp=True, viewport={"width": 390, "height": 844}, is_mobile=True, has_touch=True)
            page = await ctx.new_page(); errs = []
            page.on("pageerror", lambda e: errs.append(str(e)))
            await page.goto(URL); await page.wait_for_function(READY)
            await page.evaluate("navigator.serviceWorker.register('sw.js').then(() => navigator.serviceWorker.ready)")
            await page.reload(); await page.wait_for_function(READY)
            check(await page.evaluate("!!navigator.serviceWorker.controller"), "the service worker controls the app")
            await page.close()
            # the deploy: index.html gets a new element and a new script; core.js (an existing script) changes and uses it
            html = (COPY / "index.html").read_text()
            html = html.replace('<div class="wrap" id="main"></div>', '<div class="wrap" id="main"></div><div id="deploy-marker" hidden></div>')
            html = html.replace('<script src="js/core.js" defer></script>', '<script src="js/core.js" defer></script><script src="js/newfile.js" defer></script>')
            assert 'js/newfile.js' in html, "script tag pattern not found"
            (COPY / "index.html").write_text(html)
            (COPY / "js" / "newfile.js").write_text("window.NEW_FILE = true;\n")
            core = (COPY / "js" / "core.js").read_text()
            (COPY / "js" / "core.js").write_text(core + "\nwindow.CORE_V2 = true; setTimeout(() => { if (!document.querySelector('#deploy-marker')) throw new Error('new core.js running with the old index.html'); }, 0);\n")
            sw = (COPY / "sw.js").read_text(); (COPY / "sw.js").write_text(sw.replace('"./js/core.js",', '"./js/core.js", "./js/newfile.js",').replace('marginalia-v7', 'marginalia-v8'))
            time.sleep(1.1)  # Last-Modified changes
            LOG.clear()
            page = await ctx.new_page(); page.on("pageerror", lambda e: errs.append(str(e)))
            await page.goto(URL)
            try: await page.wait_for_function(READY, timeout=8000); ok = True
            except Exception: ok = False
            r = await page.evaluate("({ marker: !!document.querySelector('#deploy-marker'), newfile: !!window.NEW_FILE, core2: !!window.CORE_V2 })")
            check(ok and r == {"marker": True, "newfile": True, "core2": True}, f"opened within the ten minutes the browser may keep a page, the app runs the new page with the new scripts ({ok}, {r})")
            check(any(l.startswith("/index.html") for l in LOG), f"the page itself is checked with the server ({LOG[:4]})")
            check(not errs, f"no script errors ({errs[:3]})")
            await br.close()
    finally:
        srv.shutdown(); shutil.rmtree(COPY.parent, ignore_errors=True)
asyncio.run(main())
print("\nall passed" if not failures else f"\n{len(failures)} failed")
sys.exit(1 if failures else 0)
