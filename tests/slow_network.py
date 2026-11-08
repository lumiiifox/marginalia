"""Opening the app on a weak connection. Run:  python3 tests/slow_network.py

The server here can be made to hold every answer for SLOW seconds, as a phone on one bar of signal does. With the service worker
installed, checks that:
  1. on a stalled connection the app opens from its saved copy within a few seconds, and draws the library;
  2. that opening uses the saved copy throughout, so it never runs a mix of new and old scripts, and the next opening on a good
     connection runs the new version throughout;
  3. on a good connection the app's files are still fetched from the server (so an update shows up on the next open);
  4. with no saved copy yet (first visit) a slow connection is waited for, since there is nothing else to show;
  5. offline (the server gone) the app still opens.
"""
import os, asyncio, sys, threading, time
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from functools import partial
from pathlib import Path
from playwright.async_api import async_playwright

ROOT = Path(__file__).resolve().parent.parent
PORT = int(os.environ.get("MG_PORT", 8832))
URL = f"http://localhost:{PORT}/index.html"
READY = "typeof S !== 'undefined' && S.mode === 'ready'"
SLOW = 25  # seconds the server holds each answer when slow: far longer than anyone waits for an app to open
failures = []
STATE = {"slow": 0.0, "hits": [], "down": False, "v": 1}


def check(ok, msg):
    print(("ok   " if ok else "FAIL ") + msg)
    if not ok: failures.append(msg)


class Handler(SimpleHTTPRequestHandler):
    def log_message(self, *a): pass

    def handle_one_request(self):
        try: super().handle_one_request()
        except (BrokenPipeError, ConnectionResetError): pass

    def do_GET(self):
        if STATE["down"]: self.close_connection = True; return
        STATE["hits"].append(self.path.split("?")[0])
        if STATE["slow"]:
            end = time.time() + STATE["slow"]
            while time.time() < end and STATE["slow"]: time.sleep(0.05)
        if self.path.split("?")[0].endswith(".js") and "/data/books/" not in self.path and not self.path.startswith("/sw.js"):
            f = ROOT / self.path.split("?")[0].lstrip("/")
            if f.is_file():  # each script says which version it came from
                body = f.read_bytes() + f'\n;(window.__v = window.__v || {{}})["{f.name}"] = {STATE["v"]};\n'.encode()
                self.send_response(200); self.send_header("Content-Type", "text/javascript"); self.send_header("Content-Length", str(len(body)))
                self.send_header("ETag", f'"v{STATE["v"]}-{f.stat().st_mtime_ns}"'); self.end_headers(); self.wfile.write(body); return
        return super().do_GET()


async def main():
    async with async_playwright() as p:
        browser = await p.chromium.launch()

        # 4 first visit: no saved copy, so a slow answer is waited for (here 3 s)
        ctx = await browser.new_context(viewport={"width": 390, "height": 844}); page = await ctx.new_page()
        await page.route("**/*", lambda r: r.continue_() if r.request.url.startswith(f"http://localhost:{PORT}") else r.abort())
        STATE["slow"] = 3
        t0 = time.time(); await page.goto(URL, timeout=60000); await page.wait_for_function(READY, timeout=60000)
        check(time.time() - t0 >= 3, f"a first visit with nothing saved waits for the slow server ({time.time() - t0:.1f}s)")
        STATE["slow"] = 0
        await page.evaluate("navigator.serviceWorker.register('sw.js').then(() => navigator.serviceWorker.ready)")
        await page.reload(); await page.wait_for_function(READY)
        check(await page.evaluate("!!navigator.serviceWorker.controller"), "the service worker is in charge after a reload")
        await page.wait_for_timeout(500)

        # 3 a good connection: the app's own files come from the server
        STATE["hits"].clear()
        await page.reload(); await page.wait_for_function(READY)
        got = set(STATE["hits"])
        check({"/js/core.js", "/js/boot.js", "/css/app.css"} <= got, f"on a good connection the app's files are fetched fresh ({len(got)} files)")

        # 1, 2 a stalled connection: the saved copy, quickly
        errs = []; page.on("pageerror", lambda e: errs.append(str(e)))
        STATE["slow"] = SLOW; STATE["v"] = 2  # an update was published, and the signal is bad
        t0 = time.time()
        try:
            await page.reload(timeout=60000); await page.wait_for_function(READY, timeout=60000); opened = time.time() - t0
        except Exception: opened = 99
        shown = await page.evaluate("document.querySelector('#main').innerText.length > 50") if opened < 99 else False
        check(opened < 8 and shown, f"on a stalled connection the app opens from its saved copy within seconds ({opened:.1f}s)")
        vs = await page.evaluate("Object.values(window.__v || {})") if opened < 99 else []
        check(vs and set(vs) == {1} and not errs, f"that opening runs one version of every file, without script errors ({sorted(set(vs))}, {errs[:2]})")
        STATE["slow"] = 0
        # the next opening on a good connection gets the new version whole
        await page.reload(); await page.wait_for_function(READY)
        vs = await page.evaluate("Object.values(window.__v || {})")
        check(vs and set(vs) == {2}, f"the next opening on a good connection runs the new version throughout ({sorted(set(vs))})")
        await ctx.close()

        # 5 offline: the server gone
        ctx = await browser.new_context(viewport={"width": 390, "height": 844}); page = await ctx.new_page()
        await page.route("**/*", lambda r: r.continue_() if r.request.url.startswith(f"http://localhost:{PORT}") else r.abort())
        await page.goto(URL); await page.wait_for_function(READY)
        await page.evaluate("navigator.serviceWorker.register('sw.js').then(() => navigator.serviceWorker.ready)")
        await page.reload(); await page.wait_for_function(READY); await page.wait_for_timeout(500)
        await ctx.set_offline(True)
        try: await page.reload(); await page.wait_for_function(READY, timeout=10000); ok = True
        except Exception: ok = False
        check(ok, "offline, the app still opens from its saved copy")
        await browser.close()


server = ThreadingHTTPServer(("localhost", PORT), partial(Handler, directory=str(ROOT)))
server.daemon_threads = True
threading.Thread(target=server.serve_forever, daemon=True).start()
try:
    asyncio.run(main())
finally:
    STATE["slow"] = 0; server.shutdown()
print("\n" + ("all passed" if not failures else f"{len(failures)} failed"))
sys.exit(1 if failures else 0)
