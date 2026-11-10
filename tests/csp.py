"""The app under its own content security policy:  python3 tests/csp.py

Every other test turns the policy off (bypass_csp), since Playwright's waiting helpers run text as script, which the policy forbids.
This one keeps it on, waits from Python, and walks through what reaches outside the page, checking the policy refuses none of it:
  1. opening, every screen, an entry with its picture from Wikimedia Commons, a book in both reading modes;
  2. a PDF read through PDF.js and its worker (a script file, then the worker started from checked text, as on the phone);
  3. a Wiktionary lookup, a Wikisource search, a request to GitHub as automatic backups make, a backup file saved;
  4. and that the policy does refuse what it should: a script from another host, and script run from text.
  5. where cdnjs and Google Fonts can be reached (GitHub's runners), the real libraries, PDF.js's worker and the fonts all load under it.
"""
import asyncio, os, re, subprocess, sys, time
from pathlib import Path
from playwright.async_api import async_playwright

ROOT = Path(__file__).resolve().parent.parent
PORT = int(os.environ.get("MG_PORT", 8841))
URL = f"http://localhost:{PORT}/index.html"
LIB = ROOT / "tests" / ".cache"
failures = []
PNG = bytes.fromhex("89504e470d0a1a0a0000000d49484452000000010000000108060000001f15c4890000000d4944415478da63f8ffff3f0005fe02fea7d6a4a40000000049454e44ae426082")


def check(ok, msg):
    print(("ok   " if ok else "FAIL ") + msg)
    if not ok: failures.append(msg)


async def until(page, js, timeout=20):
    """Wait for a condition by asking the page (page.evaluate is allowed under the policy; wait_for_function is not)."""
    end = time.time() + timeout
    while time.time() < end:
        try:
            if await page.evaluate(js): return True
        except Exception: pass
        await asyncio.sleep(0.15)
    return False


async def outside(route):
    u = route.request.url
    if "wiktionary.org" in u: return await route.fulfill(status=200, content_type="application/json", headers={"access-control-allow-origin": "*"},
                                                          body='{"parse":{"title":"virtue","text":"<h2 id=\\"English\\">English</h2><h3>Noun</h3><ol><li>Moral excellence.</li></ol>"}}')
    if "wikisource.org" in u: return await route.fulfill(status=200, content_type="application/json", headers={"access-control-allow-origin": "*"},
                                                          body='{"query":{"search":[{"title":"Ethics (Spinoza)","snippet":"a work"}]}}')
    if "api.github.com" in u: return await route.fulfill(status=200, content_type="application/json", headers={"access-control-allow-origin": "*"},
                                                          body='{"id":1,"private":true,"visibility":"private","archived":false,"disabled":false}')
    if "wikimedia.org" in u: return await route.fulfill(status=200, content_type="image/png", body=PNG)
    if "/lib/" in u and "localhost" in u:
        f = PDFJS / u.split("/lib/")[1]
        return await route.fulfill(status=200, content_type="text/javascript", body=f.read_bytes())
    if "localhost" in u: return await route.continue_()
    return await route.abort()  # cdnjs and Google Fonts: nothing outside reached in tests


async def main():
    async with async_playwright() as p:
        browser = await p.chromium.launch()
        ctx = await browser.new_context(viewport={"width": 390, "height": 844}, has_touch=True, accept_downloads=True)  # the policy on
        await ctx.route("**/*", outside)
        await ctx.add_init_script("window.__csp = []; document.addEventListener('securitypolicyviolation', (e) => window.__csp.push(e.violatedDirective + ' ' + e.blockedURI));")
        page = await ctx.new_page()
        errs = []
        page.on("pageerror", lambda e: errs.append(str(e)))
        page.on("console", lambda m: errs.append(m.text) if "Content Security Policy" in m.text else None)
        await page.goto(URL)
        check(await until(page, "typeof S !== 'undefined' && S.mode === 'ready'"), "the app opens under its policy")
        check(await page.evaluate("!!document.querySelector('meta[http-equiv=Content-Security-Policy]')"), "the policy is on the page")

        # 1 every screen, a picture, a book
        await page.evaluate("addClassics(true)"); await until(page, "S.texts.has('classic-hume-enquiry')", 60)
        for screen in ["library", "glossary", "branches", "thinkers", "reference", "mastery", "paths", "drafts", "compares", "questions", "wishlist", "recommendations", "trash"]:
            await page.evaluate(f"go({{ screen: '{screen}' }})"); await asyncio.sleep(0.25)
        await page.evaluate("go({ screen: 'glossary', gs: { gOpen: ['will-to-power', 'signifier'], gq: '', gArea: 'all' } })"); await asyncio.sleep(0.4)
        await page.evaluate("thinkerPanel('nietzsche')"); await asyncio.sleep(0.6)
        check(await until(page, "[...document.querySelectorAll('.efig img')].some((i) => i.complete && i.naturalWidth > 0)", 10), "a thinker's picture loads from Wikimedia Commons")
        await page.evaluate("closeOverlay()"); await asyncio.sleep(0.2)
        await page.evaluate("go({ screen: 'text', textId: 'classic-hume-enquiry' })"); await asyncio.sleep(0.4)
        await page.evaluate("go({ screen: 'reader', textId: 'classic-hume-enquiry' })")
        check(await until(page, "R.blocks && R.blocks.length > 50 && document.querySelectorAll('#book [data-i]').length > 0"), "a book opens in the reader")
        await page.evaluate("RS.flow = RS.flow === 'pages' ? 'scroll' : 'pages'; renderBook(0); layoutPages()"); await asyncio.sleep(0.6)
        await page.evaluate("back()"); await asyncio.sleep(0.3)

        # 2 a PDF through PDF.js and its worker started from checked text (a blob), as on the phone
        maker = await browser.new_page()
        await maker.set_content("<html><body style='font:12pt Georgia'><h1>Chapter 1</h1><p>" + "The question of method returns. " * 80 + "</p></body></html>")
        pdf = await maker.pdf(); await maker.close()
        got = await page.evaluate("""async (bytes) => {
          LIBS.pdf = [location.origin + '/lib/pdf.js']; LIBS.pdfw = [location.origin + '/lib/pdf.worker.js'];
          const r = await parseFile(new File([new Uint8Array(bytes)], 'csp.pdf', { type: 'application/pdf' }), () => {});
          return r.blocks.filter((b) => b.k !== 'pg').map((b) => b.x).join(' ').slice(0, 60); }""", list(pdf))
        check("question of method" in got, f"a PDF is read through PDF.js and its worker ({got[:40]})")

        # 3 the outside services the app talks to
        d = await page.evaluate("dictFetch('virtue').then((r) => JSON.stringify(r).length, (e) => 'failed: ' + e)")
        check(isinstance(d, int), f"a Wiktionary lookup goes through ({d})")
        w = await page.evaluate("wsSearch('en', 'Ethics').then(() => 'ok', (e) => 'failed: ' + e)")
        check(w == "ok", f"a Wikisource search goes through ({w})")
        g = await page.evaluate("cloudRequest({ repo: 'me/backups', token: 'github_pat_x' }).then((r) => r.status, (e) => 'failed: ' + e)")
        check(g == 200, f"a request to GitHub, as automatic backups make, goes through ({g})")
        async with page.expect_download(timeout=20000) as dl:
            await page.evaluate("go({ screen: 'library' })"); await asyncio.sleep(0.3)
            await page.click("#backup")
        check((await dl.value).suggested_filename.endswith(".json"), "a backup file is saved")

        found = await page.evaluate("window.__csp")
        check(not found and not errs, f"the policy refused nothing the app does ({found}, {errs[:3]})")

        # 4 and it refuses what it should
        await page.evaluate("""() => { const s = document.createElement('script'); s.src = 'https://example.com/x.js'; document.head.appendChild(s);
          const t = document.createElement('script'); t.textContent = 'window.__inline = true'; document.head.appendChild(t); }""")
        await asyncio.sleep(0.5)
        found = await page.evaluate("window.__csp")
        check(any("example.com" in v for v in found) and not await page.evaluate("!!window.__inline"),
              f"a script from another host, or written into the page as text, is refused ({found})")

        # 5 the real libraries and fonts, where they can be reached (on GitHub's runners this must pass; elsewhere it is skipped)
        ctx2 = await browser.new_context(viewport={"width": 390, "height": 844})
        await ctx2.add_init_script("window.__csp = []; document.addEventListener('securitypolicyviolation', (e) => window.__csp.push(e.violatedDirective + ' ' + e.blockedURI));")
        live = await ctx2.new_page()
        await live.goto(URL); await until(live, "typeof S !== 'undefined' && S.mode === 'ready'")
        got = await live.evaluate("""async () => {
          const out = {};
          for (const [k, ok] of [['zip', () => !!window.JSZip], ['docx', () => !!window.mammoth], ['pdf', () => !!window.pdfjsLib]])
            out[k] = await need(k, ok).then(() => 'loaded', () => 'unreachable');
          if (out.pdf === 'loaded') { const w = await pdfWorker(window.pdfjsLib).catch(() => null); out.worker = w && w.wk ? 'checked blob' : 'unreachable'; }
          await document.fonts.ready; out.fonts = [...document.fonts].some((f) => f.family.includes('Alegreya') && f.status === 'loaded');
          return out; }""")
        found = await live.evaluate("window.__csp")
        if all(v == "loaded" for k, v in got.items() if k in ("zip", "docx", "pdf")):
            check(got.get("worker") == "checked blob" and got["fonts"] and not found,
                  f"from cdnjs and Google Fonts: every library, PDF.js's worker as a checked blob, and the fonts, all allowed ({got}, {found})")
        elif os.environ.get("CI"):
            check(False, f"cdnjs reachable on GitHub's runners ({got})")
        else:
            print(f"skip the real libraries: cdnjs can't be reached from here ({got})")
            check(not found, f"and nothing refused on the way ({found})")
        await browser.close()


PDFJS = None
if __name__ == "__main__":
    sys.path.insert(0, str(Path(__file__).parent))
    d = sorted(LIB.glob("pdfjs-*/build"))
    if not d:  # pdf_import.py downloads it; run.py runs that first
        import pdf_import; d = [pdf_import.pdfjs_dir()]
    PDFJS = d[-1]
    server = subprocess.Popen([sys.executable, "-m", "http.server", str(PORT), "-d", str(ROOT)], stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
    try:
        time.sleep(1); asyncio.run(main())
    finally:
        server.terminate()
    print("\nall passed" if not failures else f"\n{len(failures)} failed")
    sys.exit(1 if failures else 0)
