"""Small things the reader must get right:  python3 tests/reader_details.py

A made-up book with a list item, verse and a proposition that each run over a printed page, a passage in italics opened on one
page and closed on the next, a footnote after a paragraph, and number headings. Checks that:
  1. in Swipe pages a paragraph running over a printed page keeps what kind it is (list item, verse, proposition);
  2. italics opened on one page and closed on the next are drawn in both, also when one of the paragraphs is redrawn alone;
  3. Whole sentence passes over a footnote to the next paragraph, and at the very end says it is the end of the book;
  4. Scroll mode keeps the place when the phone turns, and a height change (the toolbar) leaves it alone;
  5. in Swipe pages the last line clears the page count and the phone's gesture bar;
  6. a heading that is only a number takes little room; a long unbroken title never widens the screen;
  7. a citation leaves out a year with no digits.
"""
import os, asyncio, subprocess, sys, time
from pathlib import Path
from playwright.async_api import async_playwright

ROOT = Path(__file__).resolve().parent.parent
PORT = int(os.environ.get("MG_PORT", 8860))
URL = f"http://localhost:{PORT}/index.html"
READY = "typeof idb !== 'undefined' && idb && S.mode === 'ready' && S.texts"
failures = []
def check(ok, what):
    print(("ok   " if ok else "FAIL ") + what)
    if not ok: failures.append(what)

BOOK = """async (flow) => {
  const long = 'Everywhere it is machines, real ones, with all the necessary couplings and connections. ', B = [];
  B.push({ k: 'h', l: 2, x: 'Chapter One', s: 'c1' });
  for (let n = 0; n < 6; n++) B.push({ k: 'p', x: 'Opening ' + n + '. ' + long.repeat(3) });
  B.push({ k: 'p', x: '1. A first item that runs on ' + long + 'and over the' }, { k: 'pg', x: '2' }, { k: 'c', x: 'printed page to its end.' });
  B.push({ k: 'p', x: 'A line of verse / and another line / and a third' }, { k: 'pg', x: '3' }, { k: 'c', x: 'and the fourth line / the fifth' });
  B.push({ k: 'p', x: 'PROP. IV. Nothing can be destroyed except by a cause' }, { k: 'pg', x: '4' }, { k: 'c', x: 'external to itself.' });
  B.push({ k: 'p', x: 'He dreamt: \\u0001I was walking along a road' }, { k: 'pg', x: '5' }, { k: 'c', x: 'and came to the sea.\\u0002 Then he woke.' });
  B.push({ k: 'p', x: 'The last sentence before a note.¹' }, { k: 'fn', x: '¹ See the Scholium to Proposition 9.' }, { k: 'p', x: 'A new paragraph begins here. It goes on.' });
  B.push({ k: 'h', l: 3, x: '12' }, { k: 'p', x: 'An aphorism of one line.' }, { k: 'h', l: 3, x: '13' }, { k: 'p', x: 'Another aphorism.' });
  for (let n = 0; n < 60; n++) B.push({ k: 'p', x: 'Later ' + n + '. ' + long.repeat(2) });
  B.push({ k: 'p', x: 'The very last sentence of the book.' });
  await put('content', 'd', B);
  await put('texts', 'd', { title: 'Details', author: 'Test', year: 'YEAR', publisher: 'Press', hasContent: true, total: B.length, pos: 0, status: 'reading', createdAt: 1, updatedAt: 1, sections: [{ id: 'c1', label: 'Chapter One' }] });
  localStorage.setItem('mg-reader', JSON.stringify({ fs: 20, lh: 'normal', w: 'medium', tone: 'app', mn: 'show', flow, bars: 'show', turn: 'slide' }));
}"""
AT = "(x) => R.blocks.findIndex((b) => (b.x || '').startsWith(x))"

async def open_book(page, flow):
    await page.evaluate(BOOK, flow); await page.reload(); await page.wait_for_function(READY)
    await page.evaluate("go({ screen: 'reader', textId: 'd' })"); await page.wait_for_selector("#book [data-i]"); await page.wait_for_timeout(700)

async def main():
    async with async_playwright() as p:
        browser = await p.chromium.launch()
        ctx = await browser.new_context(bypass_csp=True, viewport={"width": 390, "height": 844}, is_mobile=True, has_touch=True)
        page = await ctx.new_page(); errs = []
        page.on("pageerror", lambda e: errs.append(str(e)))
        await page.goto(URL); await page.wait_for_function(READY)

        # 1, 2 Swipe pages
        await open_book(page, "pages")
        cls = await page.evaluate(f"""(() => {{ const at = {AT}; return ['1. A first', 'A line of verse', 'PROP. IV'].map((x) => R.els[at(x)].className); }})()""")
        check("li" in cls[0].split() and "verse" in cls[1].split() and "stmt" in cls[2].split(), f"a paragraph running over a printed page keeps its kind: list item, verse, proposition ({cls})")
        it = await page.evaluate(f"""(() => {{ const at = {AT}, i = at('He dreamt'), j = at('and came'); const ems = (k) => [...document.querySelectorAll(`[data-i="${{k}}"] em`)].map((e) => e.textContent).join('|');
          const before = [ems(i), ems(j)]; rerenderBlock(i, marksByBlock(R.tid)); return [before, ems(i), ems(j)]; }})()""")
        check("I was walking" in it[0][0] and "and came to the sea." in it[0][1] and "and came to the sea." in it[2], f"italics running over a printed page are italic on both sides, also after a redraw ({it})")
        await page.evaluate("document.body.dataset.x = 1")

        # 3 Whole sentence over a footnote, and at the end of the book
        k = await page.evaluate(f"({AT})('The last sentence')")
        await page.evaluate(f"""(() => {{ const el = R.els[{k}], t = el.firstChild, r = document.createRange(); r.setStart(t, 4); r.setEnd(t, 8); getSelection().removeAllRanges(); getSelection().addRange(r); }})()""")
        await page.wait_for_timeout(300)
        await page.evaluate("selectSentence()"); await page.wait_for_timeout(200); await page.evaluate("selectSentence()"); await page.wait_for_timeout(200)
        got = await page.evaluate("getSelection().toString().replace(/\\s+/g, ' ').trim()")
        check(got == "A new paragraph begins here.", f"Whole sentence passes over a footnote: the next sentence is selected on its own, without the note's words ({got!r})")
        await page.evaluate("getSelection().removeAllRanges()")

        # 6 number headings take little room
        hs = await page.evaluate(f"""(() => {{ const el = R.els[({AT})('12')]; const cs = getComputedStyle(el); return [el.className, parseFloat(cs.marginTop) / parseFloat(getComputedStyle(document.querySelector('#book')).fontSize)]; }})()""")
        check("num" in hs[0].split() and hs[1] < 1.5, f"a heading that is only a number has a line's room above it ({hs})")

        # 5 the page's last line clears the page count and a gesture bar
        cdp = await ctx.new_cdp_session(page)
        try:
            await cdp.send("Emulation.setSafeAreaInsetsOverride", {"insets": {"top": 30, "topMax": 30, "bottom": 34, "bottomMax": 34, "left": 0, "right": 0}})
            await page.evaluate("setRS({ bars: 'hide' })"); await page.wait_for_timeout(600)
            sa = await page.evaluate("""(() => { const f = document.querySelector('#rfoot').getBoundingClientRect(); let last = 0;
              for (const el of document.querySelectorAll('#book [data-i]')) for (const q of el.getClientRects()) if (q.left >= 0 && q.right <= innerWidth && q.width > 1) last = Math.max(last, q.bottom);
              return [last, f.top, innerHeight - 34]; })()""")
            check(sa[0] <= sa[1] and sa[0] <= sa[2], f"in Swipe pages the last line clears the page count and the gesture bar ({sa})")
            await cdp.send("Emulation.setSafeAreaInsetsOverride", {"insets": {}})
            await page.evaluate("setRS({ bars: 'show' })")
        except Exception as e:
            print(f"skip the gesture-bar check: this browser can't emulate one ({str(e)[:60]})")

        # 4 Scroll mode and turning the phone
        await open_book(page, "scroll")
        k = await page.evaluate(f"({AT})('Later 30')")
        await page.evaluate(f"goTo({k})"); await page.wait_for_timeout(600)
        before = await page.evaluate("currentSpot()")
        for _ in range(3):
            await page.set_viewport_size({"width": 844, "height": 390}); await page.wait_for_timeout(500)
            await page.set_viewport_size({"width": 390, "height": 844}); await page.wait_for_timeout(500)
        after = await page.evaluate("currentSpot()")
        check(after["i"] == before["i"] and abs(after["f"] - before["f"]) < 0.15, f"Scroll mode keeps the place through three turns of the phone ({before} → {after})")
        await page.set_viewport_size({"width": 390, "height": 760}); await page.wait_for_timeout(400)
        await page.evaluate("scrollBy(0, 300)"); await page.wait_for_timeout(200)
        moved = await page.evaluate("currentSpot()")
        await page.set_viewport_size({"width": 390, "height": 844}); await page.wait_for_timeout(500)
        check(await page.evaluate("currentSpot().i") == moved["i"], "a height change (the toolbar coming and going) leaves the place where you scrolled it")
        # the end of the book
        k = await page.evaluate(f"({AT})('The very last')")
        await page.evaluate(f"goTo({k})"); await page.wait_for_timeout(400)
        await page.evaluate(f"""(() => {{ const t = R.els[{k}].firstChild, r = document.createRange(); r.setStart(t, 0); r.setEnd(t, t.length); getSelection().removeAllRanges(); getSelection().addRange(r); }})()""")
        await page.wait_for_timeout(300); await page.evaluate("selectSentence()"); await page.wait_for_timeout(200)
        check("end of the book" in await page.inner_text("#toast"), "Whole sentence at the end of the book says so")

        # 6 a long unbroken title; 7 a placeholder year
        await page.evaluate("getSelection().removeAllRanges(); back()"); await page.wait_for_timeout(300)
        await page.evaluate("put('texts', 'd', { ...S.texts.get('d'), title: 'A_title_with_no_spaces_at_all_from_a_file_name_or_a_web_address_that_goes_on', readAt: Date.now() })"); await page.wait_for_timeout(300)
        await page.evaluate("go({ screen: 'library' })"); await page.wait_for_timeout(400)
        w = await page.evaluate("document.documentElement.scrollWidth")
        check(w <= 390, f"a long unbroken title never widens the screen ({w}px)")
        yr = await page.evaluate("(() => { const t = S.texts.get('d'); return [Object.keys(CITE_STYLES).map((k) => bibEntry(t, k)).join(' ')] })()")
        check("YEAR" not in yr[0], f"a year with no digits is left out of citations ({yr[0][:140]})")
        # 8 a sheet you typed in survives one Back; the browser's Forward doesn't swallow the next Back
        await page.evaluate("go({ screen: 'text', textId: 'd' })"); await page.wait_for_timeout(300)
        await page.evaluate("put('notes', 'nd', { textId: 'd', kind: 'passage', passage: 'Opening 1', gloss: 'first', at: 2, createdAt: 1, updatedAt: 1 }).then(() => noteSheet('nd'))"); await page.wait_for_timeout(400)
        await page.locator("#sheetroot textarea").last.fill("A thought I was in the middle of writing")
        await page.evaluate("history.back()"); await page.wait_for_timeout(500)
        kept = await page.evaluate("[!!document.querySelector('#sheetroot form'), document.querySelector('#toast').textContent]")
        check(kept[0] and "aren't saved" in kept[1], f"Back on a sheet you typed in keeps it open and says your words aren't saved ({kept[1]!r})")
        await page.evaluate("history.back()"); await page.wait_for_timeout(500)
        check(not await page.evaluate("!!document.querySelector('#sheetroot form')") and await page.evaluate("S.notes.get('nd').gloss") == "first", "Back again leaves it, unsaved")
        await page.evaluate("go({ screen: 'glossary' })"); await page.wait_for_timeout(300)
        await page.evaluate("history.back()"); await page.wait_for_timeout(400)
        await page.evaluate("history.forward()"); await page.wait_for_timeout(500)
        await page.evaluate("history.back()"); await page.wait_for_timeout(500)
        check(await page.evaluate("S.screen") == "library", f"after the browser's Forward, the next Back still steps back ({await page.evaluate('S.screen')})")

        check(not errs, f"no script errors ({errs[:3]})")
        await browser.close()

server = subprocess.Popen([sys.executable, "-m", "http.server", str(PORT), "-d", str(ROOT)], stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
try:
    time.sleep(1); asyncio.run(main())
finally:
    server.terminate()
print("\nall passed" if not failures else f"\n{len(failures)} failed")
sys.exit(1 if failures else 0)
