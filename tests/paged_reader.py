"""Swipe-page reader test. Run after any change to the reader:  python3 tests/paged_reader.py

Uses a made-up book only. Simulates real touch input on a phone-sized screen (412 x 915, the
Samsung/Pixel class) and checks that:
  1. every page starts exactly on a page edge, also on a screen a fraction of a pixel wide, after hundreds of turns;
  2. one swipe turns exactly one page; short drags, vertical moves and long presses turn none; quick swipes in a row each count;
  3. anything that shifts the page sideways is snapped back;
  4. turning stays fast deep inside a very long book, and crossing from one section of the book to the next is seamless;
  5. type size, line spacing, width, Scroll <-> Swipe pages and rotation keep the reader on the same passage, mid-paragraph too;
  6. the page fills the screen below the toolbar; the saved place survives a reload; jumps and the way back work in pages;
  7. selection still offers its toolbar, and reduced motion turns pages without animating.
Needs: pip install playwright && playwright install chromium
"""
import asyncio, subprocess, sys, time
from pathlib import Path
from playwright.async_api import async_playwright

ROOT = Path(__file__).resolve().parent.parent
PORT = 8798
URL = f"http://localhost:{PORT}/index.html"
READY = "typeof idb !== 'undefined' && idb && S.mode === 'ready'"

BOOK = """(n) => (async () => {
  const blocks = [], long = 'In the Scholium the demonstration turns back on itself and runs on, clause after clause, so that a reader who leaves it halfway must find the line again. ';
  for (let i = 0; i < n; i++) {
    if (i % 8 === 0) blocks.push({ k: 'pg', x: String(i / 8 + 1) });
    if (i % 200 === 0) blocks.push({ k: 'h', l: 2, x: 'Part ' + (i / 200 + 1) });
    blocks.push({ k: 'p', x: (i === 150 ? 'PROPOSITION SIX. ' : '') + (i % 50 === 7 ? long.repeat(18) : 'Paragraph ' + i + '. ' + 'Each thing, as far as it can by its own power, strives to persevere in its being. '.repeat(1 + i % 3)) });
  }
  await put('content', 'b', blocks);
  await put('texts', 'b', { title: 'Ethics', author: 'Spinoza', hasContent: true, total: blocks.length, pos: 0, sections: [], status: 'reading', createdAt: 1, updatedAt: 1 });
  await put('notes', 'n1', { textId: 'b', kind: 'passage', passage: 'Paragraph 3', page: '1', at: 5, createdAt: 1, updatedAt: 1 });
  localStorage.setItem('mg-reader', JSON.stringify({ fs: 20, lh: 'normal', w: 'medium', tone: 'app', mn: 'show', flow: 'pages' }));
})()"""
# Distance between where the text on screen starts and where a page should start (0 = on the edge).
MISALIGN = """() => { const book = document.querySelector('#book'), r = book.getBoundingClientRect(), x0 = r.left + 24;
  let best = null; for (const el of R.els) if (el) for (const q of el.getClientRects()) { if (q.width < 1) continue; const off = q.left - x0;
    if (off > -r.width / 2 && off < r.width / 2 && (best === null || Math.abs(off) < Math.abs(best))) best = off; }
  return best === null ? 0 : Math.round(best * 100) / 100; }"""

failures = []
def check(ok, what):
    print(("ok   " if ok else "FAIL ") + what)
    if not ok: failures.append(what)

async def swipe(cdp, dx, dy=0, ms=180, hold=0, x0=300, y0=450):
    """A one-finger gesture: press, optionally hold still, move by (dx, dy) over ms, release."""
    pt = lambda x, y: [{"x": x, "y": y, "id": 1}]
    await cdp.send("Input.dispatchTouchEvent", {"type": "touchStart", "touchPoints": pt(x0, y0)})
    if hold: await asyncio.sleep(hold / 1000)
    steps = 6
    for k in range(1, steps + 1):
        await asyncio.sleep(ms / 1000 / steps)
        await cdp.send("Input.dispatchTouchEvent", {"type": "touchMove", "touchPoints": pt(x0 + dx * k / steps, y0 + dy * k / steps)})
    await cdp.send("Input.dispatchTouchEvent", {"type": "touchEnd", "touchPoints": []})
    await asyncio.sleep(0.05)

async def open_book(browser, n, w=412, h=915, reduced=False):
    ctx = await browser.new_context(viewport={"width": w, "height": h}, device_scale_factor=2.625, is_mobile=True, has_touch=True, reduced_motion="reduce" if reduced else "no-preference")
    page = await ctx.new_page(); errs = []
    page.on("pageerror", lambda e: errs.append(str(e)))
    page.on("console", lambda m: m.type == "error" and "Failed to load resource" not in m.text and errs.append(m.text))
    await page.goto(URL); await page.wait_for_function(READY)
    await page.evaluate(BOOK, n); await page.reload(); await page.wait_for_function(READY)
    await page.evaluate("go({ screen: 'reader', textId: 'b' })"); await page.wait_for_selector(".book .bp"); await page.wait_for_timeout(700)
    return ctx, page, errs

async def main():
    async with async_playwright() as p:
        browser = await p.chromium.launch()

        # 1, 2, 3, 6, 7 on a normal book
        ctx, page, errs = await open_book(browser, 3000)
        cdp = await ctx.new_cdp_session(page)
        geo = await page.evaluate("(() => { const b = document.querySelector('#book').getBoundingClientRect(); return { bottom: b.bottom, ih: innerHeight, w: b.width, iw: innerWidth }; })()")
        check(abs(geo["bottom"] - geo["ih"]) <= 1 and geo["w"] == geo["iw"], f"the page fills the screen below the toolbar ({geo})")
        await page.evaluate("goTo(60); pageSettled()"); await page.wait_for_timeout(100)
        async def turned(dx, **kw):
            before = await page.evaluate("R.turns || 0"); await swipe(cdp, dx, **kw); return await page.evaluate("R.turns || 0") - before
        check(await turned(-160) == 1, "a swipe to the left turns one page")
        check(await turned(160) == -1, "a swipe to the right turns back one page")
        check(await turned(-60, ms=40) == 1, f"a quick short flick turns one page {await page.evaluate('R.lastSwipe')}")
        check(await turned(-55, ms=900) == 0, f"the same distance dragged slowly turns nothing {await page.evaluate('R.lastSwipe')}")
        check(await turned(-35, ms=500) == 0, "a slow short drag turns nothing")
        check(await turned(-20, dy=-220) == 0, "a vertical move turns nothing")
        check(await turned(-160, hold=600) == 0, "a long press then a drag (selecting) turns nothing")
        check(await turned(300, ms=150, x0=60) == -1, f"a very long swipe still turns only one page {await page.evaluate('R.lastSwipe')}")
        before = await page.evaluate("R.turns || 0")
        for _ in range(6): await swipe(cdp, -150, ms=90)
        check(await page.evaluate("R.turns || 0") - before == 6, "six quick swipes in a row turn six pages")
        check(await page.evaluate("document.querySelector('#book').style.transform") == "", "nothing is left shifted after the swipes")
        await page.evaluate("document.querySelector('#book').scrollLeft += 37"); await page.wait_for_timeout(400)
        check(await page.evaluate(MISALIGN) == 0, "a stray sideways shift snaps back to the page edge")
        # settings keep the passage
        await page.evaluate("setPage(30); pageSettled()"); await page.wait_for_timeout(100)
        sp = await page.evaluate("currentSpot()"); start_page = await page.evaluate("currentPage()")
        for change in ["{ fs: 24 }", "{ lh: 'airy' }", "{ w: 'narrow' }", "{ fs: 20, lh: 'normal', w: 'medium' }"]:
            await page.evaluate(f"setRS({change})"); await page.wait_for_timeout(150)
            shown = await page.evaluate("(sp) => spotPage(sp) === currentPage()", sp)
            check(shown and await page.evaluate(MISALIGN) == 0, f"setting {change} keeps the line you were reading on screen, on the page edge")
        check(await page.evaluate("currentPage()") == start_page and await page.evaluate("currentSpot()") == sp, "after changing settings back, the same page as before: no creeping")
        # mid-paragraph, both ways between Scroll and Swipe pages
        mid = await page.evaluate("(() => { const i = R.blocks.findIndex((b, k) => k > 300 && (b.x || '').length > 2000); goTo(i); const p = screenPagesOf(i); setPage(p[0] + 1); pageSettled(); return { i, pages: p }; })()")
        sp = await page.evaluate("currentSpot()")
        check(sp["i"] == mid["i"] and sp["f"] > 0, f"inside a long paragraph the spot records how far through it ({sp}, spans {mid['pages']})")
        await page.evaluate("setRS({ flow: 'scroll' })"); await page.wait_for_timeout(300)
        s2 = await page.evaluate("currentSpot()")
        check(s2["i"] == sp["i"] and abs(s2["f"] - sp["f"]) < 0.08, f"switching to Scroll keeps the paragraph and the line ({sp} -> {s2})")
        await page.evaluate("setRS({ flow: 'pages' })"); await page.wait_for_timeout(300)
        s3 = await page.evaluate("currentSpot()")
        check(s3["i"] == sp["i"] and await page.evaluate("currentPage()") == mid["pages"][0] + 1, f"and back to Swipe pages lands on the same page ({s3})")
        # rotation
        before = await page.evaluate("R.pagedSpot"); bp = await page.evaluate("currentPage()")
        await page.set_viewport_size({"width": 915, "height": 412}); await page.wait_for_timeout(500)
        check(await page.evaluate("(sp) => spotPage(sp) === currentPage()", before) and await page.evaluate(MISALIGN) == 0 and await page.evaluate("R.pageW") == 915, "rotating keeps the line you were reading on screen and re-cuts the pages")
        await page.set_viewport_size({"width": 412, "height": 915}); await page.wait_for_timeout(500)
        check(await page.evaluate("currentPage()") == bp, "rotating back returns to exactly the same page")
        # saved place survives a reload
        await page.evaluate("setPage(77)"); await page.evaluate("pageSettled()"); await page.wait_for_timeout(900)
        saved = await page.evaluate("[S.texts.get('b').pos, currentPage()]")
        await page.reload(); await page.wait_for_function(READY)
        await page.evaluate("go({ screen: 'reader', textId: 'b' })"); await page.wait_for_selector(".book .bp"); await page.wait_for_timeout(800)
        check(await page.evaluate("currentPage()") == saved[1], f"Continue reading after a reload opens the same page ({saved[1]})")
        # a jump and the way back
        await page.click("#rfind"); await page.fill("#findq", "proposition six"); await page.wait_for_timeout(400); await page.click(".findhit >> nth=0"); await page.wait_for_timeout(400)
        jumped = await page.evaluate("currentPage()")
        await page.click("#rtback"); await page.wait_for_timeout(300)
        check(jumped != saved[1] and await page.evaluate("currentPage()") == saved[1] and await page.evaluate("S.texts.get('b').pos") == saved[0], "Find jumps away and the way-back button returns to the same page, place unchanged")
        # selection toolbar
        await page.evaluate("""() => { const el = R.els[pagedBlock()]; const tn = document.createTreeWalker(el, NodeFilter.SHOW_TEXT).nextNode(); const r = document.createRange(); r.setStart(tn, 0); r.setEnd(tn, 9); getSelection().removeAllRanges(); getSelection().addRange(r); }""")
        await page.wait_for_timeout(400)
        check(await page.locator("#selbar").is_visible() and await page.locator("#seledit").is_visible(), "selecting text in pages shows the toolbar with Edit text")
        await page.evaluate("getSelection().removeAllRanges()")
        # alignment over many turns
        await page.evaluate("goTo(0); R.turns = 0")
        blocks = []
        for _ in range(200):
            await page.evaluate("turnPage(1)"); blocks.append(await page.evaluate("currentBlock()"))
        check(await page.evaluate("R.turns") == 200 and await page.evaluate(MISALIGN) == 0 and blocks == sorted(blocks), f"200 turns, through {await page.evaluate('R.chunks.indexOf(R.win[0])')} sections, always on the edge and always forward")
        # crossing between sections, both ways
        b0 = await page.evaluate("R.win[1]")
        await page.evaluate("goTo(R.win[1] - 1); setPage(lastPage())"); last_blocks = await page.evaluate("currentBlock()")
        await page.evaluate("turnPage(1)")
        check(await page.evaluate("R.win[0]") == b0 and await page.evaluate("currentPage()") == 0 and await page.evaluate("currentBlock()") == b0, f"the last page of a section turns onto the first page of the next (paragraph {b0})")
        await page.evaluate("turnPage(-1)")
        check(await page.evaluate("R.win[1]") == b0 and await page.evaluate("currentPage() === lastPage()") and await page.evaluate("currentBlock()") == last_blocks, "and turning back returns to the last page of the previous one")
        heads = await page.evaluate("R.chunks.slice(1, 6).map((i) => R.blocks[i].k)")
        check(heads.count("h") >= 3, f"sections start at headings where there are any ({heads})")
        sec_count = await page.evaluate("[R.chunks.length, R.blocks.length]")
        check(await page.evaluate("document.querySelector('#book').children.length") <= 520, f"only one section is laid out ({sec_count[0]} sections for {sec_count[1]} paragraphs)")
        check(not errs, "no script errors" + (f": {errs[:3]}" if errs else ""))
        await ctx.close()

        # 1 on a screen a fraction of a pixel wide (411.43 px, as on many Android phones)
        ctx, page, errs = await open_book(browser, 3000)
        await page.add_style_tag(content="#reader { width: 411.43px !important; }")
        await page.evaluate("layoutPages(); goTo(0); R.turns = 0")
        for _ in range(300): await page.evaluate("turnPage(1)")
        check(await page.evaluate("R.turns") == 300 and await page.evaluate(MISALIGN) == 0, f"411.43 px screen: 300 turns, still on the edge (page width {await page.evaluate('R.pageW')})")
        await ctx.close()

        # 4 deep inside a very long book
        ctx, page, errs = await open_book(browser, 27000)
        await page.evaluate("goTo(Math.round(R.blocks.length * 0.6))"); await page.wait_for_timeout(300)
        TURN = "(async () => { const t0 = performance.now(); turnPage(1); await new Promise(r => requestAnimationFrame(() => requestAnimationFrame(r))); return performance.now() - t0; })()"
        ts = [await page.evaluate(TURN) for _ in range(8)]
        u = await page.evaluate("(() => { const t0 = performance.now(); currentSpot(); updatePg(); return performance.now() - t0; })()")
        check(max(ts) < 60 and u < 15, f"27,000-paragraph book, 60% in: each turn reaches the screen in {[round(x) for x in ts]} ms (two frames included), finding the paragraph {round(u, 1)} ms")
        far = await page.evaluate("(() => { const t0 = performance.now(); goTo(100); const a = performance.now() - t0; goTo(26000); return [a, performance.now() - t0 - a]; })()")
        check(max(far) < 250, f"jumping to a distant part of the long book lays out its section in {[round(x) for x in far]} ms")
        check(not errs, "no script errors in the long book")
        await ctx.close()

        # 7 reduced motion
        ctx, page, errs = await open_book(browser, 500, reduced=True)
        await page.evaluate("turnPage(1)")
        check(await page.evaluate("document.querySelector('#book').getAnimations().length") == 0 and await page.evaluate("currentPage()") == 1, "with reduced motion, pages turn without animating")
        await ctx.close()
        await browser.close()

server = subprocess.Popen([sys.executable, "-m", "http.server", str(PORT), "-d", str(ROOT)], stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
try:
    time.sleep(1); asyncio.run(main())
finally:
    server.terminate()
print(f"\n{len(failures)} failed" if failures else "\nall passed")
sys.exit(1 if failures else 0)
