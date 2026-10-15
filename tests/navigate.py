"""Finding and moving through a book. Run after changes to the reader:  python3 tests/navigate.py

Made-up book only, phone-sized touch screen. Checks that:
  1. Find catches a phrase the printed page split, ignores accents and capitals, marks every match in the text and the
     current one more strongly, and the arrows step through them, across sections, wrapping round; × stops it;
  2. the same in Scroll mode, the match a third of the way down the screen;
  3. the slider moves through the book by distance, shows chapters as ticks, and the jump can be undone with Back;
     Go to page takes a printed page number (roman too, or the nearest page before);
  4. the foot of the page counts the pages left in the chapter, down to its last page;
  5. Contents has tabs: the chapter you're in, your notes (this chapter or the whole book, tap to go there), bookmarks;
  6. Search all books finds the same phrase split by the printed page, and leaves out running heads marked hidden;
  7. reading on past a chapter's end asks for a summary of it (Write it opens the summary, saved with the book); a jump
     from the middle of a chapter, a chapter with a summary, a second time, or Reading settings' Don't ask, doesn't ask;
     the same in Scroll mode.
Needs: pip install playwright && playwright install chromium
"""
import asyncio, subprocess, sys, time
from pathlib import Path
from playwright.async_api import async_playwright

ROOT = Path(__file__).resolve().parent.parent
PORT = 8801
URL = f"http://localhost:{PORT}/index.html"
READY = "typeof idb !== 'undefined' && idb && S.mode === 'ready'"
BOOK = """(rs) => (async () => {
  const B = [], filler = 'The body without organs is not a projection; it has nothing to do with the body itself. ';
  B.push({ k: 'pg', x: 'xii' }, { k: 'p', x: 'Preface in roman pages. ' + filler });
  let pg = 1;
  for (let c = 0; c < 4; c++) {
    B.push({ k: 'pg', x: String(pg++) }, { k: 'h', l: 1, x: 'Chapter ' + (c + 1), s: 'c' + c });
    for (let n = 0; n < 100; n++) {
      if (n % 20 === 7) { B.push({ k: 'p', x: 'Paragraph ' + c + '/' + n + '. ' + filler + 'It is a matter of a profound love of' }, { k: 'pg', x: String(pg++) }, { k: 'c', x: 'life, and Être is not the word. ' + filler }); continue; }
      B.push({ k: 'p', x: 'Paragraph ' + c + '/' + n + '. ' + filler.repeat(1 + n % 3) });
      if (n % 6 === 5) B.push({ k: 'pg', x: String(pg++) });
    }
  }
  await put('content', 'v', B);
  await put('texts', 'v', { title: 'Plateaus', author: 'Test', hasContent: true, total: B.length, pos: 0, status: 'reading', createdAt: 1, updatedAt: 1,
    sections: [0, 1, 2, 3].map((c) => ({ id: 'c' + c, label: 'Chapter ' + (c + 1), done: false })) });
  const at = (x) => B.findIndex((b) => (b.x || '').startsWith(x));
  await put('notes', 'q1', { textId: 'v', kind: 'question', passage: 'Paragraph 0/3.', at: at('Paragraph 0/3.'), createdAt: 1, updatedAt: 1 });
  await put('notes', 'q2', { textId: 'v', kind: 'objection', passage: 'Paragraph 0/30.', at: at('Paragraph 0/30.'), createdAt: 2, updatedAt: 2 });
  await put('notes', 'q3', { textId: 'v', kind: 'passage', passage: 'Paragraph 2/10.', at: at('Paragraph 2/10.'), createdAt: 3, updatedAt: 3 });
  localStorage.setItem('mg-reader', JSON.stringify(rs));
})()"""
HL = "() => { const f = CSS.highlights.get('find'), n = CSS.highlights.get('find-now'); return { all: f ? f.size : 0, now: n ? [...n].map((r) => r.toString()).join('|') : '' }; }"
ON_PAGE = "(k) => { const h = FIND.hits[k], p = h.pieces[0], r = rangeFor(p.i, p.from, p.to); const q = r && r.getClientRects()[0]; return !!q && rectPage(q) === currentPage(); }"

failures = []
def check(ok, what):
    print(("ok   " if ok else "FAIL ") + what)
    if not ok: failures.append(what)

async def open_book(browser, rs):
    ctx = await browser.new_context(viewport={"width": 412, "height": 915}, device_scale_factor=2.625, is_mobile=True, has_touch=True)
    page = await ctx.new_page(); errs = []
    page.on("pageerror", lambda e: errs.append(str(e)))
    await page.goto(URL); await page.wait_for_function(READY)
    await page.evaluate(BOOK, rs); await page.reload(); await page.wait_for_function(READY)
    await page.evaluate("go({ screen: 'reader', textId: 'v' })"); await page.wait_for_selector(".book .bp"); await page.wait_for_timeout(700)
    return ctx, page, errs

async def find(page, q):
    await page.evaluate("findPanel()"); await page.fill("#findq", q); await page.wait_for_timeout(400)
    return await page.inner_text("#findsum")

async def main():
    async with async_playwright() as p:
        browser = await p.chromium.launch()
        ctx, page, errs = await open_book(browser, {"fs": 20, "flow": "pages", "turn": "slide"})

        # 1 Find in Swipe pages
        summ = await find(page, "LOVE OF LIFE")
        check(summ.startswith("20 matches"), f"a phrase the printed page split is found, capitals ignored ({summ!r})")
        await page.click(".findhit >> nth=0"); await page.wait_for_timeout(500)
        hl = await page.evaluate(HL)
        check(hl["now"] == "love of|life" and hl["all"] >= 2, f"the match is marked in the text, across the join ({hl})")
        check(await page.evaluate(ON_PAGE, 0), "and its page is the one on screen")
        check(await page.locator(".findbar").is_visible() and "1 of 20" in await page.inner_text(".findbar"), "a bar shows where you are among the matches")
        await page.click("#fnext"); await page.wait_for_timeout(300)
        check(await page.evaluate("FIND.k") == 1 and await page.evaluate(ON_PAGE, 1) and "2 of 20" in await page.inner_text(".findbar"), "› goes to the next match")
        await page.click("#fprev"); await page.wait_for_timeout(200)
        check(await page.evaluate("FIND.k") == 0 and await page.evaluate(ON_PAGE, 0), "‹ goes back")
        win0 = await page.evaluate("R.win[0]")
        await page.click("#fprev"); await page.wait_for_timeout(300)
        check(await page.evaluate("FIND.k") == 19 and await page.evaluate(ON_PAGE, 19) and await page.evaluate("R.win[0]") != win0, "and wraps round from the first to the last, in another section of the book")
        summ = await find(page, "etre"); check(summ.startswith("20 matches"), f"accents are ignored ({summ!r})")
        await page.click(".findhit >> nth=2"); await page.wait_for_timeout(400)
        check((await page.evaluate(HL))["now"] == "Être", "the match keeps its accent in the text")
        await page.click("#fclose"); await page.wait_for_timeout(200)
        check(await page.evaluate(HL) == {"all": 0, "now": ""} and await page.locator(".findbar").count() == 0, "× stops finding and clears the marks")
        check(await page.locator("#rtback").count() == 1, "Back to where you were reading is still offered")

        # 3 the slider and Go to page
        await page.evaluate("trailBack()"); await page.wait_for_timeout(300)
        await page.touchscreen.tap(206, 450); await page.wait_for_timeout(300)
        nav = await page.evaluate("() => ({ shown: !document.querySelector('#rnav').hidden, ticks: document.querySelectorAll('#rnav-ticks i').length, where: document.querySelector('#rnav-where').textContent })")
        check(nav["shown"] and nav["ticks"] == 4, f"tapping the middle shows the slider, chapters marked ({nav})")
        await page.evaluate("() => { const r = document.querySelector('#rnav-r'); r.value = 600; r.dispatchEvent(new Event('input')); }")
        lab = await page.inner_text("#rnav-where")
        await page.evaluate("() => { const r = document.querySelector('#rnav-r'); r.dispatchEvent(new Event('change')); }"); await page.wait_for_timeout(400)
        mv = await page.evaluate("() => ({ frac: R.cum[currentBlock()] / R.cum[R.blocks.length], trail: R.trail.length, sec: R.secAt[currentBlock()] })")
        check(abs(mv["frac"] - 0.6) < 0.04 and mv["trail"] >= 1 and "Chapter 3" in lab, f"dragging to 60% shows where you'd land ({lab!r}) and goes there ({mv})")
        p37 = "() => { const i = R.blocks.findIndex((b) => b.k === 'pg' && b.x === '37'); return spotPage({ i, f: 0 }) === currentPage(); }"
        await page.fill("#rnav-pg", "37"); await page.press("#rnav-pg", "Enter"); await page.wait_for_timeout(400)
        check(await page.evaluate(p37), "Go to page 37: the screen page where printed page 37 begins")
        await page.fill("#rnav-pg", "xii"); await page.press("#rnav-pg", "Enter"); await page.wait_for_timeout(400)
        check(await page.evaluate("R.pageAt[currentBlock()]") == "xii", "Go to page xii (roman numerals)")
        await page.evaluate("trailBack()"); await page.wait_for_timeout(300)
        check(await page.evaluate(p37), "Back undoes a jump")
        await page.click("#rnav-close"); await page.wait_for_timeout(200)
        check(await page.evaluate("document.querySelector('#rnav').hidden"), "Done puts the slider away")

        # 4 pages left in the chapter
        await page.evaluate("goTo(" + str(await page.evaluate("R.blocks.findIndex((b) => b.x === 'Chapter 2')")) + ")"); await page.wait_for_timeout(300)
        foot = await page.inner_text("#rfoot")
        import re
        m = re.search(r"(\d+) pages left in the chapter", foot)
        check(bool(m), f"the foot of the page counts the pages left in the chapter ({foot!r})")
        n = int(m.group(1)) if m else 0
        for _ in range(n): await page.evaluate("turnPage(1)")
        await page.wait_for_timeout(300); last = await page.inner_text("#rfoot")
        await page.evaluate("turnPage(1)"); await page.wait_for_timeout(300); nxt = await page.evaluate("R.secAt[currentBlock()]")
        check("last page of the chapter" in last and nxt == "c2", f"…down to its last page, and the next turn starts the next chapter ({last!r}, {nxt})")

        # 5 Contents tabs
        await page.evaluate("goTo(" + str(await page.evaluate("R.blocks.findIndex((b) => (b.x || '').startsWith('Paragraph 0/10.'))")) + ")"); await page.wait_for_timeout(300)
        await page.evaluate("tocPanel()"); await page.wait_for_selector(".toctabs")
        check(await page.inner_text(".tocitem.here") == "Chapter 1\n1" or "Chapter 1" in await page.inner_text(".tocitem.here"), "Contents marks the chapter you're in")
        await page.click("[data-toctab=notes]"); await page.wait_for_timeout(200)
        ch = await page.evaluate("[...document.querySelectorAll('.nitem')].map((x) => x.querySelector('.nk').textContent)")
        check(ch == ["Question", "Objection"], f"Your notes: this chapter's notes, in reading order, with their kinds ({ch})")
        await page.click("[data-nscope=book]"); await page.wait_for_timeout(200)
        check(await page.locator(".nitem").count() == 3, "Whole book shows them all")
        target = await page.evaluate("R.blocks.findIndex((b) => (b.x || '').startsWith('Paragraph 2/10.'))")
        await page.click(".nitem >> nth=2"); await page.wait_for_timeout(500)
        check(await page.evaluate(f"spotPage({{ i: {target}, f: 0 }}) === currentPage()") and await page.evaluate("R.visiting"), "tapping a note goes to its passage, with the way back")
        await page.evaluate("tocPanel()"); await page.wait_for_selector(".toctabs")
        check(await page.get_attribute(".toctabs .segb.on", "data-toctab") == "notes", "the panel opens on the tab used last")
        await page.click("[data-toctab=marks]"); await page.wait_for_timeout(200)
        check("No bookmarks yet" in await page.inner_text("#tocbody"), "Bookmarks says how to add one when there are none")
        await page.click("#pclose"); await page.wait_for_timeout(200)
        await page.evaluate("toggleBookmark()"); await page.wait_for_timeout(300)
        await page.evaluate("tocPanel()"); await page.wait_for_selector(".toctabs")
        check(await page.locator("#tocbody .tocitem.bm").count() == 1, "and lists a bookmark once there is one")
        await page.click("#pclose")
        check(not errs, "no script errors in Swipe pages" + (f": {errs[:3]}" if errs else ""))
        await ctx.close()

        # 2 Find in Scroll mode
        ctx, page, errs = await open_book(browser, {"fs": 20, "flow": "scroll"})
        await find(page, "love of life"); await page.click(".findhit >> nth=4"); await page.wait_for_timeout(500)
        y = await page.evaluate("() => { const h = FIND.hits[FIND.k], p = h.pieces[0]; return [Math.round(rangeFor(p.i, p.from, p.to).getClientRects()[0].top), Math.round(innerHeight * 0.3)]; }")
        check(abs(y[0] - y[1]) < 40 and (await page.evaluate(HL))["now"] == "love of|life", f"in Scroll mode the match sits a third of the way down, marked ({y})")
        await page.click("#fnext"); await page.wait_for_timeout(400)
        y2 = await page.evaluate("() => { const h = FIND.hits[FIND.k], p = h.pieces[0]; return Math.round(rangeFor(p.i, p.from, p.to).getClientRects()[0].top); }")
        check(await page.evaluate("FIND.k") == 5 and abs(y2 - y[1]) < 40, f"› scrolls to the next one ({y2})")
        await page.evaluate("showNav(true)"); await page.wait_for_timeout(200)
        check(not await page.evaluate("document.querySelector('#rnav').hidden"), "the page number in the toolbar opens the slider in Scroll mode")
        check(not errs, "no script errors in Scroll mode" + (f": {errs[:3]}" if errs else ""))

        # 6 Search all books
        await page.evaluate("""() => { const B = S.content.get('v'); B.splice(2, 0, { k: 'p', x: 'PLATEAUS LOVE OF LIFE', st: 'hide' }); return put('content', 'v', B); }""")
        await page.evaluate("go({ screen: 'concord' })"); await page.fill("#cq", "love of life"); await page.wait_for_timeout(1200)
        res = await page.evaluate("() => { const r = CONC.results.find((x) => x.tid === 'v'); return r ? { count: r.count, snip: r.hits[0].snip, at: r.hits[0].i } : null; }")
        check(res and res["count"] == 20 and "<b>love of life</b>" in res["snip"], f"Search all books finds the phrase across the page break, as Find does ({res and res['count']}, {res and res['snip'][-60:]!r})")
        await page.fill("#cq", "etre is not"); await page.wait_for_timeout(1200)
        check(await page.evaluate("CONC.results.find((x) => x.tid === 'v').count") == 20, "and still ignores accents and capitals")
        await page.fill("#cq", "plateaus love"); await page.wait_for_timeout(1200)
        check(not await page.evaluate("CONC.results.some((x) => x.tid === 'v')"), "a running head marked hidden isn't searched")
        check(not errs, "no script errors in Search all books" + (f": {errs[:3]}" if errs else ""))
        await ctx.close()

        # 7 a summary at a chapter's end
        async def read_past(page, c):
            # from about a page before chapter c's end, on through the next chapter's opening
            end = await page.evaluate(f"R.blocks.findIndex((b) => b.s === 'c{c + 1}')")
            await page.evaluate(f"goTo({end - 3})"); await page.wait_for_timeout(300)
            await page.evaluate("document.querySelector('#toast').hidden = true")
            for _ in range(6):
                if await page.evaluate(f"contentAt(currentBlock()) >= {end}"): break
                if await page.evaluate("isPaged()"): await page.evaluate("stepPage(1)")
                else: await page.evaluate("scrollBy(0, innerHeight * 0.8)")
                await page.wait_for_timeout(350)
            await page.wait_for_timeout(200)
            return await page.evaluate("document.querySelector('#toast').hidden ? '' : document.querySelector('#toast').textContent")
        for flow in ("pages", "scroll"):
            ctx, page, errs = await open_book(browser, {"fs": 20, "flow": flow, "turn": "none"})
            t1 = await read_past(page, 0)
            check("End of “Chapter 1”" in t1 and "Write it" in t1, f"{flow}: reading on past Chapter 1's end asks for a summary of it ({t1!r})")
            if flow == "pages":
                await page.click("#toast .toastbtn >> text=Write it"); await page.wait_for_selector("#s-text")
                await page.fill("#s-text", "Desire produces; it lacks nothing."); await page.click("button[type=submit]"); await page.wait_for_timeout(400)
                check(await page.evaluate("S.texts.get('v').summaries.c0") == "Desire produces; it lacks nothing.", "Write it opens the chapter's summary and saves it with the book")
                await page.evaluate("document.querySelector('#toast').hidden = true; goTo(R.blocks.findIndex((b) => b.s === 'c2') + 40)"); await page.wait_for_timeout(300)
                await page.evaluate("goTo(R.blocks.findIndex((b) => b.s === 'c3') + 2)"); await page.wait_for_timeout(400)
                check(await page.evaluate("document.querySelector('#toast').hidden"), "a jump from the middle of a chapter into the next doesn't ask")
                await page.evaluate("(() => { const t = S.texts.get('v'); return put('texts', 'v', { ...t, summaries: { ...t.summaries, c2: 'Already summed up.' } }); })()")
                check(not await read_past(page, 2), "a chapter that has a summary doesn't ask")
                t2 = await read_past(page, 1)
                check("Chapter 2" in t2, "the next chapter asks for its own")
                check(not await read_past(page, 1), "and only once a visit")
            else:
                await page.evaluate("readerSettings()"); await page.wait_for_selector("[data-rs=sum]")
                await page.click("[data-rs=sum][data-v=off]"); await page.click("#pclose"); await page.wait_for_timeout(200)
                check(not await read_past(page, 1) and await page.evaluate("JSON.parse(localStorage.getItem('mg-reader')).sum") == "off", "Reading settings' Don't ask turns it off, and it stays off")
            check(not errs, f"{flow}: no script errors with the summary prompt" + (f": {errs[:3]}" if errs else ""))
            await ctx.close()
        await browser.close()

server = subprocess.Popen([sys.executable, "-m", "http.server", str(PORT), "-d", str(ROOT)], stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
try:
    time.sleep(1); asyncio.run(main())
finally:
    server.terminate()
print(f"\n{len(failures)} failed" if failures else "\nall passed")
sys.exit(1 if failures else 0)
