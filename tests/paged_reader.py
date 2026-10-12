"""Swipe-page reader test. Run after any change to the reader:  python3 tests/paged_reader.py

Uses a made-up book only. Simulates real touch input on a phone-sized screen (412 x 915, the
Samsung/Pixel class) and checks that:
  1. every page starts exactly on a page edge, also on a screen a fraction of a pixel wide, after hundreds of turns;
  2. one swipe turns exactly one page; short drags, vertical moves and long presses turn none; quick swipes in a row each count;
  3. anything that shifts the page sideways is snapped back;
  4. turning stays fast deep inside a very long book, and crossing from one section of the book to the next is seamless;
  5. type size, line spacing, width, Scroll <-> Swipe pages and rotation keep the reader on the same passage, mid-paragraph too;
  6. the page fills the screen below the toolbar; the saved place survives a reload; jumps and the way back work in pages;
  7. selection still offers its toolbar, and reduced motion turns pages without animating;
  8. Page turn: Flip follows the finger, carries a turn through or lets the page fall back, works both ways and across
     sections, leaves nothing on screen afterwards, keeps frames short in a very long book, and shows the right page while turning;
  9. book-like pages: a paragraph the printed page split is joined again with a small page marker inside it, that page's
     footnotes follow the paragraph, a paragraph starting a printed page carries the marker at its start; selections,
     highlights, Edit text and sections all respect the join; Scroll mode is unchanged; Justified / Ragged right.
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
  localStorage.setItem('mg-reader', JSON.stringify({ fs: 20, lh: 'normal', w: 'medium', tone: 'app', mn: 'show', flow: 'pages', turn: localStorage.getItem('test-turn') || 'slide' }));
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

async def open_book(browser, n, w=412, h=915, reduced=False, turn="slide"):
    ctx = await browser.new_context(viewport={"width": w, "height": h}, device_scale_factor=2.625, is_mobile=True, has_touch=True, reduced_motion="reduce" if reduced else "no-preference")
    page = await ctx.new_page(); errs = []
    page.on("pageerror", lambda e: errs.append(str(e)))
    page.on("console", lambda m: m.type == "error" and "Failed to load resource" not in m.text and errs.append(m.text))
    await page.goto(URL); await page.wait_for_function(READY)
    await page.evaluate("(t) => localStorage.setItem('test-turn', t)", turn)
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

        # 8 page flip
        ctx, page, errs = await open_book(browser, 3000, turn="flip")
        cdp = await ctx.new_cdp_session(page)
        await page.evaluate("goTo(60); pageSettled()"); await page.wait_for_timeout(600)
        pt = lambda x, y: [{"x": x, "y": y, "id": 1}]
        top_text = "() => { const el = R.els[pagedBlock()]; const top = el && el.closest('#book > *'); return top ? top.textContent.slice(0, 40) : ''; }"
        before_text = await page.evaluate(top_text); p0 = await page.evaluate("currentPage()"); t0 = await page.evaluate("R.turns")
        await cdp.send("Input.dispatchTouchEvent", {"type": "touchStart", "touchPoints": pt(330, 450)})
        for k in range(1, 7):
            await asyncio.sleep(0.03); await cdp.send("Input.dispatchTouchEvent", {"type": "touchMove", "touchPoints": pt(330 - 25 * k, 450)})
        mid = await page.evaluate("""() => { const f = document.querySelector('#flip'), tw = document.querySelector('#flipbook');
          const W = pageStride(), p = Math.round(tw.scrollLeft / W), x0 = tw.getBoundingClientRect().left - tw.scrollLeft + 24;
          const first = [...tw.children].find((el) => [...el.getClientRects()].some((q) => Math.round((q.left - x0) / W) === p && q.width > 0));
          return { on: f.classList.contains('on'), transform: f.style.transform, p: R.flip && R.flip.p, twinText: first ? first.textContent.slice(0, 40) : '', bookPage: currentPage() }; }""")
        await page.screenshot(path="/tmp/flip-mid.png")
        check(mid["on"] and 0.3 < (mid["p"] or 0) < 0.55 and "rotateY(-" in mid["transform"], f"mid-swipe, the page is partly turned and follows the finger ({mid['p']:.2f}, {mid['transform']})")
        check(mid["twinText"] == before_text and mid["bookPage"] == p0 + 1, "the turning page shows the page you were on; the next page is already underneath")
        await cdp.send("Input.dispatchTouchEvent", {"type": "touchEnd", "touchPoints": []}); await page.wait_for_timeout(700)
        check(await page.evaluate("R.turns") == t0 + 1 and await page.evaluate("currentPage()") == p0 + 1 and not await page.evaluate("document.querySelector('#flip').classList.contains('on')"), "released, the page turns over and the turning copy disappears")
        check(await page.evaluate(MISALIGN) == 0 and await page.evaluate("document.querySelector('#book').style.transform") == "", "the page underneath sits on its edge, unshifted")
        # lift a little, let it fall back
        await cdp.send("Input.dispatchTouchEvent", {"type": "touchStart", "touchPoints": pt(330, 450)})
        for k in range(1, 9):
            await asyncio.sleep(0.12); await cdp.send("Input.dispatchTouchEvent", {"type": "touchMove", "touchPoints": pt(330 - 6 * k, 450)})
        await cdp.send("Input.dispatchTouchEvent", {"type": "touchEnd", "touchPoints": []}); await page.wait_for_timeout(700)
        check(await page.evaluate("R.turns") == t0 + 1 and await page.evaluate("currentPage()") == p0 + 1 and not await page.evaluate("R.flip"), "lifting a page a little and letting go lets it fall back: same page")
        # back
        await swipe(cdp, 170, x0=60); await page.wait_for_timeout(700)
        check(await page.evaluate("R.turns") == t0 and await page.evaluate("currentPage()") == p0 and await page.evaluate(top_text) == before_text, "a swipe to the right brings the previous page over: back where you started")
        # quick turns, keyboard, both ways, across a section boundary
        await page.evaluate("goTo(R.win[1] - 1); setPage(lastPage()); pageSettled()"); b0 = await page.evaluate("R.win[1]"); tt = await page.evaluate("R.turns")
        for key in ["ArrowRight", "ArrowRight", "ArrowLeft"]: await page.keyboard.press(key); await page.wait_for_timeout(60)
        await page.wait_for_timeout(700)
        check(await page.evaluate("R.turns") == tt + 1 and await page.evaluate("R.win[0]") == b0 and await page.evaluate("currentPage()") == 0, "quick key presses each turn a page, across into the next section and back")
        await page.keyboard.press("ArrowLeft"); await page.wait_for_timeout(700)
        check(await page.evaluate("R.win[1]") == b0 and await page.evaluate("currentPage() === lastPage()"), "flipping back from a section's first page lands on the previous section's last page")
        check(not errs, "no script errors while flipping" + (f": {errs[:3]}" if errs else ""))
        # the setting
        await page.evaluate("setRS({ turn: 'none' })"); tt = await page.evaluate("R.turns"); await page.evaluate("turnPage(1)")
        check(await page.evaluate("R.turns") == tt + 1 and not await page.evaluate("R.flip") and await page.evaluate("document.querySelector('#book').getAnimations().length") == 0, "Page turn: None turns instantly")
        await page.evaluate("setRS({ turn: 'slide' })"); await page.evaluate("turnPage(1)")
        check(not await page.evaluate("R.flip") and await page.evaluate("document.querySelector('#book').getAnimations().length") == 1, "Page turn: Slide slides")
        await ctx.close()
        # frames while flipping deep in a very long book
        ctx, page, errs = await open_book(browser, 27000, turn="flip")
        await page.evaluate("goTo(Math.round(R.blocks.length * 0.6))"); await page.wait_for_timeout(800)
        gaps = await page.evaluate("""() => new Promise((res) => { const g = []; let last = performance.now(); turnPage(1);
          const tick = (now) => { g.push(now - last); last = now; if (R.flip) requestAnimationFrame(tick); else res(g); }; requestAnimationFrame(tick); })""")
        check(len(gaps) >= 10 and max(gaps[1:]) < 34, f"27,000-paragraph book: a flip runs {len(gaps)} frames, the longest {round(max(gaps[1:]))} ms after the first ({round(gaps[0])} ms)")
        check(not errs, "no script errors flipping in the long book")
        await ctx.close()

        # 9 book-like pages
        ctx, page, errs = await open_book(browser, 400)
        await page.evaluate("""(async () => {
          const B = [{ k: 'h', l: 1, x: 'Introduction' }];
          for (let n = 0; n < 300; n++) {
            B.push({ k: 'p', x: 'Paragraph ' + n + ' begins here and runs on, full of a profound love of' });
            B.push({ k: 'fn', x: '*Reference notes begin on page 383 (' + n + ').' });
            B.push({ k: 'pg', x: 'x' + n });
            B.push({ k: 'c', x: 'life, and often enormously amusing (' + n + '). An attack on the ego.' });
            B.push({ k: 'pg', x: 'y' + n });
            B.push({ k: 'p', x: 'A new paragraph ' + n + ' at the top of a printed page, constituting the tyrannical bitterness of everyday lives.' });
          }
          await put('content', 'j', B);
          await put('texts', 'j', { title: 'Anti-Oedipus', author: 'Test', hasContent: true, total: B.length, pos: 0, sections: [], status: 'reading', createdAt: 1, updatedAt: 1 });
        })()""")
        await page.evaluate("go({ screen: 'library' })"); await page.evaluate("go({ screen: 'reader', textId: 'j' })"); await page.wait_for_selector(".book .bp"); await page.wait_for_timeout(600)
        j = await page.evaluate("""() => { const p = R.els[1], kids = [...document.querySelector('#book').children];
          return { text: p.textContent, tag: p.tagName, cIn: p.contains(R.els[4]), pgIn: p.contains(R.els[3]) && R.els[3].className, fnAfter: kids.indexOf(R.els[2]) === kids.indexOf(p) + 1,
                   preMark: R.els[6].contains(R.els[5]) && R.els[6].firstElementChild === R.els[5], top: R.els[1].parentElement.id }; }""")
        check(j["tag"] == "P" and j["cIn"] and "love of" in j["text"] and "life, and often" in j["text"], f"a paragraph split by the printed page reads as one: “…love of [x0] life, and often…”")
        check(j["pgIn"] == "pgm" and j["fnAfter"], "the printed page number sits inside it as a small marker; that page's footnote follows the paragraph")
        check(j["preMark"], "a paragraph that begins a printed page carries the page marker at its start")
        sel = await page.evaluate("""() => { const p = R.els[1], r = document.createRange(); r.setStart(p.firstChild, 0); r.setEndAfter(R.els[4]); getSelection().removeAllRanges(); getSelection().addRange(r); return selectionText(r); }""")
        check("x0" not in sel and "love of" in sel and "life, and" in sel, f"selecting across the join leaves the page number out ({sel[-60:]!r})")
        await page.evaluate("getSelection().removeAllRanges()")
        await page.evaluate("put('notes', 'jn', { textId: 'j', kind: 'passage', passage: 'enormously amusing', at: 4, createdAt: 1, updatedAt: 1 })"); await page.wait_for_timeout(300)
        h = await page.evaluate("() => ({ joined: R.els[1].contains(R.els[4]), mark: !!R.els[4].querySelector('mark'), cnt: document.querySelectorAll(`#book [data-i='4']`).length })")
        check(h["joined"] and h["mark"] and h["cnt"] == 1, "a highlight on the continuation redraws the joined paragraph, still joined")
        sp = await page.evaluate("currentSpot()")
        await page.evaluate("R.sel = { text: 'life', i: 4, page: 'x0', sec: '' }; editSelectedParagraph()"); await page.wait_for_selector("#edit-paragraph")
        await page.fill("#edit-paragraph", "life, and often enormously amusing (0). An attack on the ego, edited."); await page.click("button[type=submit]"); await page.wait_for_timeout(500)
        e = await page.evaluate("() => ({ joined: R.els[1].contains(R.els[4]), text: R.els[1].textContent })")
        check(e["joined"] and "edited." in e["text"], "Edit text on the continuation keeps it joined")
        cuts = await page.evaluate("R.chunks.slice(1).map((i) => R.blocks[i].k + ':' + (R.blocks[i + 1] || {}).k)")
        check(all(not c.startswith("c") and c != "fn:pg" for c in cuts), f"sections never start inside a joined paragraph ({cuts[:4]})")
        await page.evaluate("goTo(R.win[1] - 1); setPage(lastPage())"); await page.evaluate("turnPage(1)")
        first = await page.evaluate("(() => { const f = document.querySelector('#book').firstElementChild; return { k: R.blocks[+f.dataset.i].k, hasStart: f.contains(R.els[R.win[0]]) }; })()")
        check(first["k"] == "p" and first["hasStart"], f"crossing into the next section starts with a whole paragraph, its page marker inside ({first})")
        seq = []
        await page.evaluate("goTo(0)")
        for _ in range(25): seq.append(await page.evaluate("currentSpot().i")); await page.evaluate("turnPage(1)")
        pos = await page.evaluate("(seq) => seq.map((i) => R.order.indexOf(i))", seq)
        check(len(set(seq)) > 5 and pos == sorted(pos), f"turning through joined paragraphs finds the paragraph at the top of each page, always moving forward in reading order")
        al = await page.evaluate("getComputedStyle(R.els[R.win[0] + 1] || R.els[1]).textAlign")
        await page.evaluate("setRS({ align: 'left' })"); al2 = await page.evaluate("getComputedStyle(document.querySelector('#book .bp')).textAlign")
        check(al == "justify" and al2 in ("start", "left"), f"Text in pages: Justified ({al}) / Ragged right ({al2})")
        await page.evaluate("setRS({ flow: 'scroll' })"); await page.wait_for_timeout(300)
        sc = await page.evaluate("() => ({ sep: !R.els[1].contains(R.els[4]) && R.els[3].className === 'bpg', fnPlace: R.els[2].previousElementSibling === R.els[1], mark: !!R.els[4].querySelector('mark'), align: getComputedStyle(R.els[1]).textAlign })")
        check(sc["sep"] and sc["fnPlace"] and sc["mark"] and sc["align"] in ("start", "left"), f"Scroll mode is unchanged: separate blocks, page lines, footnotes in place ({sc})")
        check(not errs, "no script errors in book-like pages" + (f": {errs[:3]}" if errs else ""))
        await page.screenshot(path="/tmp/joined-scroll.png")
        await page.evaluate("setRS({ flow: 'pages', align: 'justify' }); goTo(1)"); await page.wait_for_timeout(300)
        await page.screenshot(path="/tmp/joined-pages.png")
        await ctx.close()

        # 10 chapters start on a fresh page
        ctx, page, errs = await open_book(browser, 400)
        await page.evaluate("""(async () => {
          const B = [];
          for (let c = 0; c < 6; c++) {
            B.push({ k: 'pg', x: String(100 + c) }); B.push({ k: 'h', l: 1, x: 'Chapter ' + (c + 1), s: 'sec' + c });
            for (let n = 0; n < 7 + c * 3; n++) B.push({ k: 'p', x: 'Chapter ' + (c + 1) + ', paragraph ' + n + '. ' + 'Everywhere it is machines, real ones, with all the necessary couplings and connections. '.repeat(2) });
          }
          await put('content', 'ch', B);
          await put('texts', 'ch', { title: 'Chapters', author: 'Test', hasContent: true, total: B.length, pos: 0, sections: [0,1,2,3,4,5].map((c) => ({ id: 'sec' + c, label: 'Chapter ' + (c + 1) })), status: 'reading', createdAt: 1, updatedAt: 1 });
        })()""")
        await page.evaluate("go({ screen: 'library' })"); await page.evaluate("go({ screen: 'reader', textId: 'ch' })"); await page.wait_for_selector(".book .bp"); await page.wait_for_timeout(600)
        ch = await page.evaluate("""() => { const book = document.querySelector('#book'), W = pageStride(), x0 = book.getBoundingClientRect().left - book.scrollLeft + 24, top0 = book.getBoundingClientRect().top + 18;
          const out = [];
          for (let i = 0; i < R.blocks.length; i++) { if (R.blocks[i].k !== 'h') continue;
            const h = R.els[i].getBoundingClientRect(), mk = R.els[i - 1].getBoundingClientRect(), page = Math.round((mk.left - x0) / W);
            const prevLast = i > 2 ? screenPagesOf(i - 2)[1] : -1;
            out.push({ page, prevLast, dTop: Math.round(mk.top - top0), markerAtTop: mk.top - top0 < 16, withHeading: Math.round((h.left - x0) / W) === page }); }
          return { out, pages: lastPage() + 1 }; }""")
        o = ch["out"]
        check(all(x["markerAtTop"] and x["withHeading"] for x in o), f"every chapter starts at the top of a page, its page marker with it (pages {[x['page'] for x in o]}, offset from the top {[x['dTop'] for x in o]} px)")
        check(all(x["page"] == x["prevLast"] + 1 for x in o[1:]), "the chapter before ends on the page just before: blank space, no blank pages")
        await page.evaluate("put('notes', 'cn', { textId: 'ch', kind: 'passage', passage: 'Chapter 3', at: [...R.blocks.keys()].find((i) => R.blocks[i].x === 'Chapter 3'), createdAt: 1, updatedAt: 1 })"); await page.wait_for_timeout(300)
        check(await page.evaluate("document.querySelectorAll('#book .chap').length") == 6, "a highlight on a chapter title keeps its fresh page")
        await page.evaluate("setRS({ flow: 'scroll' })"); await page.wait_for_timeout(200)
        check(await page.evaluate("document.querySelectorAll('#book .chap').length") == 0, "Scroll mode is unchanged")
        check(not errs, "no script errors with chapters")
        await ctx.close()

        # 7 reduced motion
        ctx, page, errs = await open_book(browser, 500, reduced=True, turn="flip")
        await page.evaluate("turnPage(1)")
        check(await page.evaluate("document.querySelector('#book').getAnimations().length") == 0 and not await page.evaluate("R.flip") and await page.evaluate("currentPage()") == 1, "with reduced motion, pages turn without animating, Flip included")
        await ctx.close()
        await browser.close()

server = subprocess.Popen([sys.executable, "-m", "http.server", str(PORT), "-d", str(ROOT)], stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
try:
    time.sleep(1); asyncio.run(main())
finally:
    server.terminate()
print(f"\n{len(failures)} failed" if failures else "\nall passed")
sys.exit(1 if failures else 0)
