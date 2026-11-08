"""The libraries from cdnjs (PDF.js, JSZip, Mammoth) are checked against their hashes. Run:  python3 tests/integrity.py

Checks that:
  1. every library file in LIBS has a SHA-384 hash in LIB_SRI;
  2. a changed copy of a library (bytes that don't match its hash) is refused: it never runs, and importing says it couldn't load;
  3. a changed copy of PDF.js's worker is refused too, and PDF.js is never left to fetch its worker unchecked;
  4. a library saved by the offline copy before the checks existed (an opaque copy) is fetched again, so importing keeps working;
  5. with cdnjs reachable, every real file loads and passes its hash (on GitHub's runners this must pass; elsewhere it is skipped
     when cdnjs can't be reached).
"""
import os, asyncio, base64, hashlib, re, subprocess, sys, time
from pathlib import Path
from playwright.async_api import async_playwright

ROOT = Path(__file__).resolve().parent.parent
PORT = int(os.environ.get("MG_PORT", 8833))
URL = f"http://localhost:{PORT}/index.html"
READY = "typeof S !== 'undefined' && S.mode === 'ready'"
failures = []
ON_CI = bool(os.environ.get("CI"))


def check(ok, msg):
    print(("ok   " if ok else "FAIL ") + msg)
    if not ok: failures.append(msg)


def sri(body: bytes):
    return "sha384-" + base64.b64encode(hashlib.sha384(body).digest()).decode()


CDN = re.compile(r"^https://cdnjs\.cloudflare\.com/")
CORS = {"access-control-allow-origin": "*"}


async def main():
    async with async_playwright() as p:
        browser = await p.chromium.launch()

        # 1, 2, 3: changed copies are refused (cdnjs stood in for, so this runs anywhere)
        ctx = await browser.new_context(viewport={"width": 390, "height": 844}, service_workers="block")
        await ctx.route(re.compile(r"^https://fonts\."), lambda r: r.abort())
        served = []
        async def tampered(route):
            served.append(route.request.url)
            await route.fulfill(status=200, content_type="text/javascript", headers=CORS,
                                body="window.pdfjsLib = window.JSZip = window.mammoth = window.pdfjsWorker = { changed: true }; window.__ran = true;")
        await ctx.route(CDN, tampered)
        page = await ctx.new_page(); errs = []
        page.on("pageerror", lambda e: errs.append(str(e)))
        await page.goto(URL); await page.wait_for_function(READY)
        missing = await page.evaluate("Object.values(LIBS).flat().filter((u) => !/^sha384-[A-Za-z0-9+/]{64}$/.test(LIB_SRI[u] || ''))")
        check(not missing, f"every library file has its hash ({missing})")
        for key, ok in [("pdf", "!!window.pdfjsLib"), ("zip", "!!window.JSZip"), ("docx", "!!window.mammoth")]:
            got = await page.evaluate(f"need('{key}', () => {ok}).then(() => 'loaded', (e) => e instanceof UErr ? 'refused' : String(e))")
            check(got == "refused", f"a changed copy of {key} is refused, with the couldn't-load message ({got})")
        check(not await page.evaluate("!!window.__ran"), "no changed copy ever ran")
        check(len(served) >= 6, f"each fallback version was tried and refused ({len(served)} requests)")
        # the worker: a changed copy is refused by pdfWorker, and opening a PDF stops instead of PDF.js fetching the worker itself
        got = await page.evaluate("""async () => {
          const fake = { PDFWorker: { fromPort: () => ({ destroy() {} }) }, GlobalWorkerOptions: {} };
          try { await pdfWorker(fake); return 'opened'; } catch (e) { return e instanceof UErr ? 'refused:' + (fake.GlobalWorkerOptions.workerSrc || '') : String(e); }
        }""")
        check(got == "refused:", f"a changed copy of PDF.js's worker is refused, and PDF.js isn't pointed at it ({got})")
        check(not errs, f"no script errors ({errs[:2]})")
        await ctx.close()

        # 4: a library the offline copy saved before the checks (opaque) is fetched again with CORS
        good = b"window.JSZip = function JSZip() {}; window.__zipLoads = (window.__zipLoads || 0) + 1;"
        ctx = await browser.new_context(viewport={"width": 390, "height": 844})
        await ctx.route(re.compile(r"^https://fonts\."), lambda r: r.abort())
        hits = []
        async def zipfile(route):
            hits.append(route.request.url)
            await route.fulfill(status=200, content_type="text/javascript", headers=CORS, body=good)
        await ctx.route(CDN, zipfile)
        page = await ctx.new_page()
        await page.goto(URL); await page.wait_for_function(READY)
        await page.evaluate("navigator.serviceWorker.register('sw.js').then(() => navigator.serviceWorker.ready)")
        await page.reload(); await page.wait_for_function(READY)
        zu = await page.evaluate("LIBS.zip[0]")
        # as the app loaded it before: a plain script tag, saved by the offline copy as opaque
        await page.evaluate("(u) => new Promise((res, rej) => { const s = document.createElement('script'); s.src = u; s.onload = res; s.onerror = rej; document.head.appendChild(s); })", zu)
        opaque = await page.evaluate("(u) => caches.open('marginalia-v7').then((c) => c.match(u)).then((r) => r ? r.type : 'none')", zu)
        if opaque != "opaque" or not hits:
            print(f"skip the saved-copy check: the offline copy didn't see the stand-in ({opaque}, {len(hits)} requests)")
        else:
            await page.reload(); await page.wait_for_function(READY)
            got = await page.evaluate(f"(u) => {{ LIB_SRI[u] = '{sri(good)}'; return need('zip', () => !!window.JSZip).then(() => 'loaded', (e) => String(e)); }}", zu)
            kind = await page.evaluate("(u) => caches.open('marginalia-v7').then((c) => c.match(u)).then((r) => r ? r.type : 'none')", zu)
            check(got == "loaded" and kind in ("cors", "basic"), f"a library saved before the checks is fetched again and passes ({got}, now {kind})")
        await ctx.close()

        # 5: the real files, from cdnjs
        ctx = await browser.new_context(viewport={"width": 390, "height": 844}, service_workers="block")
        await ctx.route(re.compile(r"^https://fonts\."), lambda r: r.abort())
        page = await ctx.new_page()
        await page.goto(URL); await page.wait_for_function(READY)
        reach = await page.evaluate("fetch(LIBS.zip[0], { mode: 'cors' }).then((r) => r.ok, () => false)")
        if not reach and not ON_CI:
            print("skip the real files: cdnjs can't be reached from here (GitHub's runners check them)")
        else:
            bad = await page.evaluate("""async () => {
              const bad = [];
              for (const u of Object.values(LIBS).flat()) {
                try { const r = await fetch(u, { integrity: LIB_SRI[u], mode: 'cors', credentials: 'omit' }); if (!r.ok) bad.push(u + ' ' + r.status); }
                catch (e) { bad.push(u + ' ' + e.message); }
              }
              return bad; }""")
            check(not bad, f"every real library file passes its hash ({bad})")
            got = await page.evaluate("""async () => { await need('pdf', () => !!window.pdfjsLib); const { wk, pw } = await pdfWorker(window.pdfjsLib);
              const ok = !!wk && !!pw; try { pw.destroy(); wk.terminate(); } catch {} await need('zip', () => !!window.JSZip); await need('docx', () => !!window.mammoth);
              return ok && !!window.JSZip && !!window.mammoth; }""")
            check(got, "PDF.js, its worker, JSZip and Mammoth all load checked")
        await browser.close()


server = subprocess.Popen([sys.executable, "-m", "http.server", str(PORT), "-d", str(ROOT)], stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
try:
    time.sleep(0.8)
    asyncio.run(main())
finally:
    server.terminate()
print("\n" + ("all passed" if not failures else f"{len(failures)} failed"))
sys.exit(1 if failures else 0)
