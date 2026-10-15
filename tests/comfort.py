"""Reading comfort. Run after changes to the reader:  python3 tests/comfort.py

Made-up book only, phone-sized touch screen. Checks that:
  1. Swipe pages put the toolbar away by default: the page runs from the top of the screen, the printed page shows at its foot;
  2. a tap near the right edge turns forward, near the left edge back, in the middle shows the toolbar over the page (the
     text doesn't move) and a turn puts it away; a tap on a highlight opens its note, a tap that ends a selection only ends it;
     "Always shown" brings the old toolbar back;
  3. the screen is kept on while reading, asked for again when the app comes back, and let go on leaving or with Phone's setting;
  4. the phone's status bar takes the page colour while reading (Night too) and the app's colour elsewhere; the manifest has the
     new colours;
  5. Scroll mode on a long book keeps the place exactly: opening deep inside it, type size, jumps, Scroll <-> Swipe pages;
  6. the book's fonts arriving late (a slow connection) don't take you back to where the book opened once you've moved.
Needs: pip install playwright && playwright install chromium
"""
import asyncio, json, subprocess, sys, time
from pathlib import Path
from playwright.async_api import async_playwright

ROOT = Path(__file__).resolve().parent.parent
PORT = 8800
URL = f"http://localhost:{PORT}/index.html"
READY = "typeof idb !== 'undefined' && idb && S.mode === 'ready'"
WAKE_MOCK = """
window.__wake = { req: 0, rel: 0, live: 0, cur: null };
Object.defineProperty(navigator, 'wakeLock', { configurable: true, value: { request: async () => {
  __wake.req++; __wake.live++; const s = new EventTarget(); s.released = false;
  s.release = async () => { if (s.released) return; s.released = true; __wake.rel++; __wake.live--; s.dispatchEvent(new Event('release')); };
  __wake.cur = s; return s; } } });
Object.defineProperty(document, 'visibilityState', { configurable: true, get: () => window.__vis || 'visible' });
"""
BOOK = """(a) => (async () => {
  const [n, rs] = a, blocks = [];
  for (let i = 0; i < n; i++) {
    if (i % 8 === 0) blocks.push({ k: 'pg', x: String(i / 8 + 1) });
    if (i % 200 === 0) blocks.push({ k: 'h', l: 2, x: 'Part ' + (i / 200 + 1) });
    blocks.push({ k: 'p', x: 'Paragraph ' + i + '. ' + 'Each thing, as far as it can by its own power, strives to persevere in its being. '.repeat(1 + i % 5) });
  }
  await put('content', 'b', blocks);
  await put('texts', 'b', { title: 'Ethics', author: 'Spinoza', hasContent: true, total: blocks.length, pos: 0, sections: [], status: 'reading', createdAt: 1, updatedAt: 1 });
  await put('notes', 'hn', { textId: 'b', kind: 'passage', passage: 'Paragraph 2.', page: '1', at: 4, createdAt: 1, updatedAt: 1 });
  localStorage.setItem('mg-reader', JSON.stringify(rs));
})()"""

# document.fonts.ready held back until the test lets it go, as on a slow connection
FONTS_LATE = """if (typeof document !== 'undefined') { let go; const p = new Promise((r) => { go = r; }); window.__fontsGo = go;
  Object.defineProperty(document.fonts, 'ready', { configurable: true, get: () => p }); }"""

failures = []
def check(ok, what):
    print(("ok   " if ok else "FAIL ") + what)
    if not ok: failures.append(what)

async def open_book(browser, n, rs, init=""):
    ctx = await browser.new_context(viewport={"width": 412, "height": 915}, device_scale_factor=2.625, is_mobile=True, has_touch=True)
    await ctx.add_init_script(WAKE_MOCK + init)
    page = await ctx.new_page(); errs = []
    page.on("pageerror", lambda e: errs.append(str(e)))
    await page.goto(URL); await page.wait_for_function(READY)
    await page.evaluate(BOOK, [n, rs]); await page.reload(); await page.wait_for_function(READY)
    await page.evaluate("go({ screen: 'reader', textId: 'b' })"); await page.wait_for_selector(".book .bp"); await page.wait_for_timeout(700)
    return ctx, page, errs

async def main():
    async with async_playwright() as p:
        browser = await p.chromium.launch()

        # 1, 2 Swipe pages with the default settings
        ctx, page, errs = await open_book(browser, 600, {"fs": 20, "flow": "pages", "turn": "slide"})
        g = await page.evaluate("""() => { const b = document.querySelector('#book').getBoundingClientRect(), bar = document.querySelector('.rbar').getBoundingClientRect();
            return { imm: document.querySelector('#reader').classList.contains('immersive'), barBottom: Math.round(bar.bottom), top: Math.round(b.top), h: Math.round(b.height), H: innerHeight, foot: document.querySelector('#rfoot').textContent }; }""")
        check(g["imm"] and g["barBottom"] <= 0 and g["top"] == 0 and abs(g["h"] - g["H"]) <= 1, f"the toolbar is put away and the page fills the screen ({g})")
        check(g["foot"] == "p. 1", f"the printed page shows at the foot of the page ({g['foot']!r})")
        tap = lambda x, y=450: page.touchscreen.tap(x, y)
        await tap(380); await page.wait_for_timeout(350); p1 = await page.evaluate("currentPage()")
        await tap(380); await page.wait_for_timeout(350); p2 = await page.evaluate("currentPage()")
        await tap(30); await page.wait_for_timeout(350); p3 = await page.evaluate("currentPage()")
        check((p1, p2, p3) == (1, 2, 1), f"a tap at the right edge turns forward, at the left edge back ({p1}, {p2}, {p3})")
        text0 = await page.evaluate("currentSpot()")
        await tap(206); await page.wait_for_timeout(300)
        on = await page.evaluate("() => ({ on: document.querySelector('#reader').classList.contains('bars-on'), bar: Math.round(document.querySelector('.rbar').getBoundingClientRect().top), spot: currentSpot(), page: currentPage() })")
        check(on["on"] and on["bar"] >= 0 and on["spot"] == text0 and on["page"] == 1, f"a tap in the middle brings the toolbar down over the page; the text stays put ({on})")
        await page.click("#rfind"); await page.wait_for_selector("#findq"); await page.click("#pclose"); await page.wait_for_timeout(300)
        check(True, "the toolbar's buttons work from there")
        await tap(380); await page.wait_for_timeout(350)
        check(not await page.evaluate("document.querySelector('#reader').classList.contains('bars-on')") and await page.evaluate("currentPage()") == 2, "turning the page puts the toolbar away")
        await page.evaluate("goTo(0)"); await page.wait_for_timeout(200)
        mk = await page.evaluate("(() => { const r = document.querySelector('#book mark').getBoundingClientRect(); return [r.left + 4, r.top + r.height / 2]; })()")
        await tap(mk[0] if mk[0] > 300 else mk[0], mk[1]); await page.wait_for_timeout(400)
        check(await page.locator("#sheetroot form").count() == 1 and await page.evaluate("currentPage()") == 0, "a tap on a highlight opens its note and turns nothing")
        await page.evaluate("closeOverlay()"); await page.wait_for_timeout(300)
        await page.evaluate("() => { const r = document.createRange(); r.selectNodeContents(R.els[5]); getSelection().removeAllRanges(); getSelection().addRange(r); }"); await page.wait_for_timeout(300)
        await tap(380); await page.wait_for_timeout(350)
        check(await page.evaluate("currentPage()") == 0, "a tap that ends a selection turns nothing")
        await page.evaluate("getSelection().removeAllRanges()")
        await page.evaluate("setRS({ turn: 'flip' })"); await tap(380); await page.wait_for_timeout(700)
        check(await page.evaluate("currentPage()") == 1 and not await page.evaluate("R.flip"), "tapping turns with Flip too")
        await page.evaluate("setRS({ bars: 'show' })"); await page.wait_for_timeout(300)
        sh = await page.evaluate("() => ({ imm: document.querySelector('#reader').classList.contains('immersive'), top: Math.round(document.querySelector('#book').getBoundingClientRect().top), bar: Math.round(document.querySelector('.rbar').getBoundingClientRect().bottom), spot: currentSpot().i })")
        check(not sh["imm"] and sh["top"] == sh["bar"], f"Always shown puts the toolbar back above the page ({sh})")
        await page.evaluate("setRS({ bars: 'hide' })")

        # 3 the screen stays on
        w = await page.evaluate("({ ...__wake, cur: undefined })")
        check(w["req"] >= 1 and w["live"] == 1, f"the screen is kept on while reading ({w})")
        await page.evaluate("() => { window.__vis = 'hidden'; __wake.cur.release(); document.dispatchEvent(new Event('visibilitychange')); window.__vis = 'visible'; document.dispatchEvent(new Event('visibilitychange')); }"); await page.wait_for_timeout(200)
        check(await page.evaluate("__wake.live") == 1, "asked for again when the app comes back")
        await page.evaluate("go({ screen: 'library' })"); await page.wait_for_timeout(200)
        check(await page.evaluate("__wake.live") == 0, "let go when you leave the reader")
        await page.evaluate("go({ screen: 'reader', textId: 'b' })"); await page.wait_for_timeout(600)
        await page.evaluate("setRS({ awake: 'off' }); wakeOff()"); await page.touchscreen.tap(380, 450); await page.wait_for_timeout(300)
        check(await page.evaluate("__wake.live") == 0, "Screen: Phone's setting leaves the phone to decide")
        await page.evaluate("setRS({ awake: 'on' })")

        # 4 status bar colour
        meta = "[...document.querySelectorAll('meta[name=theme-color]')].map((m) => m.content)"
        await page.evaluate("setRS({ tone: 'night' })"); night = await page.evaluate(meta)
        await page.evaluate("setRS({ tone: 'app' })"); app = await page.evaluate(meta)
        await page.evaluate("go({ screen: 'library' })"); await page.wait_for_timeout(200); lib = await page.evaluate(meta)
        check(night == ["#14110e"] * 2 and app == ["#fbf7ef"] * 2 and lib == ["#e4d8c4", "#2a2019"], f"the status bar takes the page colour while reading ({night}, {app}) and the app's elsewhere ({lib})")
        man = json.loads((ROOT / "manifest.webmanifest").read_text())
        check(man["background_color"] == man["theme_color"] == "#e4d8c4", "the launch screen uses the new colours")
        check(not errs, "no script errors" + (f": {errs[:3]}" if errs else ""))
        await ctx.close()

        # 5 Scroll mode on a long book
        ctx, page, errs = await open_book(browser, 9000, {"fs": 20, "flow": "scroll"})
        await page.evaluate("go({ screen: 'library' })")
        await page.evaluate("(async () => { const t = S.texts.get('b'); await put('texts', 'b', { ...t, pos: 7000, posF: 0.5 }); })()")
        await page.evaluate("go({ screen: 'reader', textId: 'b' })"); await page.wait_for_timeout(1200)
        sp = await page.evaluate("currentSpot()")
        check(sp["i"] == 7000 and abs(sp["f"] - 0.5) < 0.05, f"opening deep in a long book lands on the saved line ({sp})")
        lazy = await page.evaluate("getComputedStyle(R.els[100]).contentVisibility")
        check(lazy == "auto", "paragraphs off screen are left for later")
        await page.evaluate("setRS({ fs: 24 })"); await page.wait_for_timeout(300); sp2 = await page.evaluate("currentSpot()")
        await page.evaluate("setRS({ fs: 20 })"); await page.wait_for_timeout(300); sp3 = await page.evaluate("currentSpot()")
        check(sp2["i"] == 7000 and sp3["i"] == 7000 and abs(sp3["f"] - 0.5) < 0.06, f"type size keeps the line ({sp2}, {sp3})")
        await page.evaluate("jumpTo(2000)"); await page.wait_for_timeout(500)
        top = await page.evaluate("() => { const r = R.els[2000].getBoundingClientRect(); return [Math.round(r.top), Math.round(innerHeight * 0.3)]; }")
        check(abs(top[0] - top[1]) < 30, f"a jump far back puts the passage where it should be ({top})")
        await page.evaluate("trailBack()"); await page.wait_for_timeout(500); sp4 = await page.evaluate("currentSpot()")
        check(sp4["i"] == 7000, f"and Back returns to the line ({sp4})")
        await page.evaluate("setRS({ flow: 'pages' })"); await page.wait_for_timeout(500); sp5 = await page.evaluate("spotPage({ i: 7000, f: 0.5 }) === currentPage() ? 7000 : currentSpot().i")
        await page.evaluate("setRS({ flow: 'scroll' })"); await page.wait_for_timeout(500); sp6 = await page.evaluate("currentSpot().i")
        check(sp5 == 7000 and sp6 == 7000, f"Scroll <-> Swipe pages keeps the line on screen ({sp5}, {sp6})")
        t = await page.evaluate("(() => { const t0 = performance.now(); setRS({ fs: 22 }); currentBlock(); return Math.round(performance.now() - t0); })()")
        print(f"     (type size change in a 9,000-paragraph book: {t} ms on this machine)")
        check(not errs, "no script errors in Scroll mode" + (f": {errs[:3]}" if errs else ""))
        await ctx.close()

        # 6 fonts arriving late
        ctx, page, errs = await open_book(browser, 300, {"fs": 18, "flow": "pages", "turn": "slide"}, FONTS_LATE)
        await page.evaluate("stepPage(1)"); await page.wait_for_timeout(200); await page.evaluate("stepPage(1)"); await page.wait_for_timeout(400)
        sp = await page.evaluate("currentSpot()")
        await page.evaluate("window.__fontsGo()"); await page.wait_for_timeout(500)
        check(await page.evaluate("currentPage()") > 0 and await page.evaluate(f"spotPage({json.dumps(sp)}) === currentPage()"), "pages turned before the fonts arrive stay turned")
        await page.evaluate("go({ screen: 'library' })"); await page.wait_for_timeout(200)
        await page.reload(); await page.wait_for_function(READY)
        await page.evaluate("go({ screen: 'reader', textId: 'b' })"); await page.wait_for_selector(".book .bp"); await page.wait_for_timeout(600)
        await page.evaluate("goTo(200)"); await page.wait_for_timeout(400)
        await page.evaluate("window.__fontsGo()"); await page.wait_for_timeout(500)
        check(await page.evaluate("spotPage({ i: 200, f: 0 }) === currentPage()"), "a place chosen before the fonts arrive is kept")
        await page.reload(); await page.wait_for_function(READY)
        await page.evaluate("go({ screen: 'reader', textId: 'b' })"); await page.wait_for_selector(".book .bp"); await page.wait_for_timeout(600)
        open_at = await page.evaluate("currentSpot()")
        await page.evaluate("window.__fontsGo()"); await page.wait_for_timeout(500)
        check(await page.evaluate(f"spotPage({json.dumps(open_at)}) === currentPage()"), "not moved: the book is placed again where it opened")
        check(not errs, "no script errors with late fonts" + (f": {errs[:3]}" if errs else ""))
        await ctx.close()
        await browser.close()

server = subprocess.Popen([sys.executable, "-m", "http.server", str(PORT), "-d", str(ROOT)], stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
try:
    time.sleep(1); asyncio.run(main())
finally:
    server.terminate()
print(f"\n{len(failures)} failed" if failures else "\nall passed")
sys.exit(1 if failures else 0)
