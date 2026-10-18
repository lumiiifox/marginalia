"""A pinned passage stays at the foot of the reader. Run after changes to the reader or notes:  python3 tests/pin.py

Made-up books only, phone-sized touch screen, Swipe pages. Checks that:
  1. Pin on a selection pins those words (with their anchor), opens the pin and keeps it in mg-pin, not in the library;
  2. the pages are cut above the pin, collapsing or opening it keeps your place, and the page number stays visible;
  3. swipes and taps on the pin never turn the book's page, and the open pin scrolls on its own;
  4. Go to it shows the words, keeps your place and offers the way back;
  5. pinning again replaces the pin, with Undo; × unpins, with Undo; the pin survives a reload;
  6. a pinned note shows its current words, and says so when the note is deleted;
  7. words changed in the book, or a book removed, are reported, and Go to it still finds the place;
  8. Go to it from another book opens the pinned one, and Back returns to the first;
  9. Scroll mode leaves room for it at the end of the book.
Needs: pip install playwright && playwright install chromium
"""
import asyncio, json, subprocess, sys, time
from pathlib import Path
from playwright.async_api import async_playwright

ROOT = Path(__file__).resolve().parent.parent
PORT = 8806
URL = f"http://localhost:{PORT}/index.html"
READY = "typeof idb !== 'undefined' && idb && S.mode === 'ready'"
BOOKS = """(rs) => (async () => {
  const filler = 'Everywhere it is machines, real ones, with all the necessary couplings and connections. ';
  for (const [id, title] of [['a', 'First book'], ['b', 'Second book']]) {
    const B = [{ k: 'pg', x: '1' }, { k: 'h', l: 1, x: 'Chapter 1', s: 'c1' }];
    B.push({ k: 'p', x: 'The pinned claim is that ' + title.toLowerCase() + ' depends on what was said much earlier. ' + filler });
    for (let n = 0; n < 80; n++) { if (n % 10 === 0) B.push({ k: 'pg', x: String(2 + n / 10) }); B.push({ k: 'p', x: 'Paragraph ' + n + ' of ' + title + '. ' + filler.repeat(2 + n % 3) }); }
    await put('content', id, B);
    await put('texts', id, { title, author: 'Test', hasContent: true, total: B.length, pos: 0, status: 'reading', createdAt: 1, updatedAt: 1, sections: [{ id: 'c1', label: 'Chapter 1' }] });
  }
  localStorage.setItem('mg-reader', JSON.stringify(rs));
})()"""
SELECT = """([i, a, b]) => { const r1 = rangeFor(i, a, a + 1), r2 = rangeFor(i, b - 1, b), r = document.createRange();
  r.setStart(r1.startContainer, r1.startOffset); r.setEnd(r2.endContainer, r2.endOffset); getSelection().removeAllRanges(); getSelection().addRange(r); }"""
GEOM = """() => { const b = document.querySelector('#book').getBoundingClientRect(), p = document.querySelector('#pin'), f = document.querySelector('#rfoot');
  const pr = p.hidden ? null : p.getBoundingClientRect(), fr = f.getBoundingClientRect();
  return { bookBottom: Math.round(b.bottom), pinTop: pr ? Math.round(pr.top) : null, pinH: pr ? Math.round(pr.height) : 0, footBottom: Math.round(fr.bottom), vh: innerHeight }; }"""
# the first block shown on the current page
SPOT = "(() => currentSpot().i)()"
ON_PAGE = """(i) => { const el = R.els[i]; if (!el) return false; const r = el.getBoundingClientRect(); return r.right > 0 && r.left < innerWidth && r.bottom > 0; }"""

failures = []
def check(ok, what):
    print(("ok   " if ok else "FAIL ") + what)
    if not ok: failures.append(what)

async def swipe(cdp, dx, dy=0, x0=300, y0=450, ms=180):
    pt = lambda x, y: [{"x": x, "y": y, "id": 1}]
    await cdp.send("Input.dispatchTouchEvent", {"type": "touchStart", "touchPoints": pt(x0, y0)})
    for k in range(1, 7):
        await asyncio.sleep(ms / 1000 / 6)
        await cdp.send("Input.dispatchTouchEvent", {"type": "touchMove", "touchPoints": pt(x0 + dx * k / 6, y0 + dy * k / 6)})
    await cdp.send("Input.dispatchTouchEvent", {"type": "touchEnd", "touchPoints": []})
    await asyncio.sleep(0.3)

async def main():
    async with async_playwright() as p:
        browser = await p.chromium.launch()
        ctx = await browser.new_context(viewport={"width": 412, "height": 915}, device_scale_factor=2.625, is_mobile=True, has_touch=True)
        page = await ctx.new_page(); errs = []
        page.on("pageerror", lambda e: errs.append(str(e)))
        page.on("console", lambda m: m.type == "error" and "Failed to load resource" not in m.text and errs.append(m.text))
        await page.goto(URL); await page.wait_for_function(READY)
        await page.evaluate(BOOKS, {"fs": 18, "flow": "pages", "turn": "slide", "bars": "hide"}); await page.reload(); await page.wait_for_function(READY)
        await page.evaluate("go({ screen: 'reader', textId: 'a' })"); await page.wait_for_selector(".book .bp"); await page.wait_for_timeout(700)
        cdp = await ctx.new_cdp_session(page)
        full = await page.evaluate(GEOM)

        # 1 pin a selection
        x = await page.evaluate("plain(R.blocks[2].x)"); a = x.index("depends on"); b = a + len("depends on what was said")
        await page.evaluate(SELECT, [2, a, b]); await page.wait_for_timeout(300)
        check(await page.is_visible("#selpin"), "a selection offers Pin")
        await page.click("#selpin"); await page.wait_for_timeout(400)
        stored = await page.evaluate("JSON.parse(localStorage.getItem('mg-pin') || 'null')")
        check(stored and stored["tid"] == "a" and stored["at"] == 2 and stored["text"] == "depends on what was said" and stored["anchor"]["ao"] == a and stored["open"],
              f"Pin keeps the selected words, their book, block and anchor ({stored})")
        shown = await page.evaluate("[!document.querySelector('#pin').hidden, document.querySelector('#pin .pin-q')?.textContent, document.querySelector('#pin-tog').textContent, getSelection().isCollapsed, document.querySelector('#toast').textContent]")
        check(shown[0] and shown[1] == "depends on what was said" and "First book" in shown[2] and shown[3] and "Pinned" in shown[4], f"the pin opens with the words and their book, the selection is cleared ({shown})")
        check(await page.evaluate("S.notes.size") == 0, "pinning saves no note in the library")

        # 2 the pages are cut above it; collapsing keeps your place
        await page.evaluate("turnPage(1); turnPage(1)"); await page.wait_for_timeout(600)
        g = await page.evaluate(GEOM); spot = await page.evaluate(SPOT)
        check(g["pinTop"] is not None and g["bookBottom"] <= g["pinTop"] + 1 and g["footBottom"] <= g["pinTop"] + 1, f"the page and its number end above the open pin ({g})")
        await page.click("#pin-tog"); await page.wait_for_timeout(500)
        g2 = await page.evaluate(GEOM); spot2 = await page.evaluate(SPOT)
        peek = await page.evaluate("[document.querySelector('#pin-tog').getAttribute('aria-expanded'), document.querySelector('#pin .pin-peek')?.textContent, !!document.querySelector('#pin-body')]")
        check(peek == ["false", "depends on what was said", False] and g2["pinH"] < g["pinH"] and g2["bookBottom"] <= g2["pinTop"] + 1, f"collapsed, it is one line with the start of the words, and the page grows to meet it ({peek}, {g2['pinH']}px)")
        check(await page.evaluate(ON_PAGE, spot), f"collapsing the pin keeps your place on the page, though the page is cut longer ({spot} → {spot2})")
        await page.click("#pin-tog"); await page.wait_for_timeout(500)
        check(await page.evaluate(ON_PAGE, spot), "opening it again keeps your place too")

        # 3 gestures on the pin never turn the page
        pg = await page.evaluate("currentPage()"); box = await page.evaluate("(() => { const r = document.querySelector('#pin-body').getBoundingClientRect(); return [r.left + r.width / 2, r.top + r.height / 2]; })()")
        await swipe(cdp, -200, x0=box[0] + 80, y0=box[1]); await swipe(cdp, 200, x0=box[0] - 80, y0=box[1])
        await page.tap("#pin-body"); await page.wait_for_timeout(300)
        check(await page.evaluate("currentPage()") == pg, "swipes and taps on the pin leave the book's page where it was")
        await swipe(cdp, -200); await page.wait_for_timeout(500)
        check(await page.evaluate("currentPage()") == pg + 1, "a swipe on the page still turns it")
        await page.evaluate("(() => { const q = document.querySelector('#pin .pin-q'); q.textContent = q.textContent.repeat(60); })()")
        sc = await page.evaluate("(() => { const b = document.querySelector('#pin-body'); b.scrollTop = 200; return [b.scrollHeight > b.clientHeight, b.scrollTop > 0, getComputedStyle(b).overflowY, getComputedStyle(b).overscrollBehaviorY]; })()")
        check(sc == [True, True, "auto", "contain"], f"long words scroll inside the pin, without pulling the page ({sc})")
        await page.evaluate("document.querySelector('#pin').dataset.html = ''; drawPin()")

        # 4 Go to it: the words, your place kept, a way back
        here = await page.evaluate(SPOT)
        await page.click("#pin-tog"); await page.wait_for_timeout(300)
        if await page.evaluate("document.querySelector('#pin-tog').getAttribute('aria-expanded')") != "true": await page.click("#pin-tog"); await page.wait_for_timeout(300)
        await page.click("#pin-go"); await page.wait_for_timeout(800)
        st = await page.evaluate("[R.visiting, !!document.querySelector('#rtback'), document.querySelector('#pin-tog').getAttribute('aria-expanded')]")
        check(await page.evaluate(ON_PAGE, 2) and st == [True, True, "false"], f"Go to it shows the pinned words, collapses the pin and offers the way back ({st})")
        kept = await page.evaluate("[S.texts.get('a').pos, R.home]")
        check(kept == [here, here], f"your place stays where you were reading, not at the pinned words ({kept}, {here})")
        await page.click("#rtback"); await page.wait_for_timeout(700)
        check(await page.evaluate(ON_PAGE, here) and not await page.evaluate("R.visiting"), f"Back returns to where you were reading ({here})")

        # 5 replace, unpin, undo, reload
        y = await page.evaluate(f"plain(R.blocks[{here}].x)"); await page.evaluate(SELECT, [here, 0, min(20, len(y))]); await page.wait_for_timeout(300)
        await page.click("#selpin"); await page.wait_for_timeout(300)
        rep = await page.evaluate("[JSON.parse(localStorage.getItem('mg-pin')).at, document.querySelector('#toast').textContent]")
        check(rep[0] == here and "replaces" in rep[1], f"pinning again replaces the pin and says so ({rep})")
        await page.click("#toast .toastbtn"); await page.wait_for_timeout(300)
        check(await page.evaluate("JSON.parse(localStorage.getItem('mg-pin')).at") == 2, "Undo brings back the passage pinned before")
        await page.click("#pin-x"); await page.wait_for_timeout(400)
        gone = await page.evaluate("[document.querySelector('#pin').hidden, localStorage.getItem('mg-pin'), document.querySelector('#reader').classList.contains('pinned')]")
        g3 = await page.evaluate(GEOM)
        check(gone == [True, None, False] and g3["bookBottom"] == full["bookBottom"], f"× unpins, and the page takes its full height again ({gone}, {g3['bookBottom']} vs {full['bookBottom']})")
        await page.click("#toast .toastbtn"); await page.wait_for_timeout(300)
        check(await page.evaluate("!!localStorage.getItem('mg-pin') && !document.querySelector('#pin').hidden"), "Undo puts the pin back")
        await page.reload(); await page.wait_for_function(READY)
        await page.evaluate("go({ screen: 'reader', textId: 'a' })"); await page.wait_for_selector(".book .bp"); await page.wait_for_timeout(700)
        check(await page.evaluate("!document.querySelector('#pin').hidden && document.querySelector('#pin').textContent.includes('depends on what was said')"), "the pin is still there after closing and reopening the app")
        await page.evaluate("go({ screen: 'library' })"); await page.wait_for_timeout(300)
        check(await page.evaluate("document.querySelector('#pin').offsetParent === null && getComputedStyle(document.documentElement).getPropertyValue('--pin-h').trim() === '0px'"), "outside the reader the pin is out of the way")
        await page.evaluate("go({ screen: 'reader', textId: 'a' })"); await page.wait_for_selector(".book .bp"); await page.wait_for_timeout(600)

        # 6 a pinned note: its current words; deleted
        await page.evaluate("put('notes', 'n1', { textId: 'a', kind: 'passage', passage: 'depends on what was said much earlier', gloss: 'First thought.', at: 2, page: '1', createdAt: 1, updatedAt: 1 })"); await page.wait_for_timeout(300)
        await page.evaluate("noteSheet('n1')"); await page.wait_for_selector("#n-pin")
        await page.click("#n-pin"); await page.wait_for_timeout(600)
        check(await page.evaluate("JSON.parse(localStorage.getItem('mg-pin')).noteId") == "n1" and await page.evaluate("document.querySelector('#pin .pin-g')?.textContent") == "First thought.", "a note's sheet offers Pin, and the pin shows the note's words and gloss")
        await page.evaluate("put('notes', 'n1', { ...S.notes.get('n1'), gloss: 'Second thought.', updatedAt: 2 })"); await page.wait_for_timeout(400)
        check(await page.evaluate("document.querySelector('#pin .pin-g')?.textContent") == "Second thought.", "editing the note changes what the pin shows")
        await page.evaluate("del('notes', 'n1')"); await page.wait_for_timeout(400)
        d = await page.evaluate("[document.querySelector('#pin .pin-q')?.textContent, document.querySelector('#pin .pin-gone')?.textContent || '']")
        check(d[0] == "depends on what was said much earlier" and "deleted" in d[1], f"when the note is deleted, the pin keeps the words and says so ({d})")

        # 7 words changed in the book; a book removed
        await page.evaluate("setPin({ tid: 'a', at: 2, text: 'depends on what was said', page: '1', title: 'First book', open: true })"); await page.wait_for_timeout(300)
        await page.evaluate("R.blocks[2] = { ...R.blocks[2], x: 'The pinned claim was rewritten entirely. ' + R.blocks[2].x.slice(80) }; document.querySelector('#pin').dataset.html = ''; drawPin()"); await page.wait_for_timeout(200)
        ch = await page.evaluate("document.querySelector('#pin .pin-gone')?.textContent || ''")
        check("changed" in ch, f"words changed in the book are reported in the pin ({ch!r})")
        await page.evaluate("turnPage(1); turnPage(1); turnPage(1)"); await page.wait_for_timeout(500)
        await page.click("#pin-go"); await page.wait_for_timeout(800)
        check(await page.evaluate(ON_PAGE, 2) and "changed" in await page.evaluate("document.querySelector('#toast').textContent"), "Go to it still goes where they were, and says they changed")
        await page.evaluate("setPin({ tid: 'zz', at: 4, text: 'words from a book since removed', page: '9', title: 'Removed book', open: true })"); await page.wait_for_timeout(300)
        rm = await page.evaluate("[document.querySelector('#pin .pin-q')?.textContent, document.querySelector('#pin .pin-gone')?.textContent || '', !!document.querySelector('#pin-go'), document.querySelector('#pin-tog').textContent]")
        check(rm[0] == "words from a book since removed" and "no longer in your library" in rm[1] and not rm[2] and "Removed book" in rm[3], f"a pin from a removed book keeps its words, says so, and offers no Go to it ({rm})")

        # 8 from another book
        await page.evaluate("setPin({ tid: 'a', at: 40, text: 'Paragraph', page: '5', title: 'First book', open: true })"); await page.wait_for_timeout(200)
        await page.evaluate("go({ screen: 'reader', textId: 'b' })"); await page.wait_for_selector(".book .bp"); await page.wait_for_timeout(700)
        bspot = await page.evaluate(SPOT)
        await page.click("#pin-go"); await page.wait_for_timeout(1000)
        cross = await page.evaluate("[R.tid, document.querySelector('#toast').textContent]")
        check(cross[0] == "a" and await page.evaluate(ON_PAGE, 40) and "Second book" in cross[1], f"Go to it from another book opens the pinned one at the words, and offers Back ({cross})")
        await page.click("#toast .toastbtn"); await page.wait_for_timeout(1000)
        check(await page.evaluate("R.tid") == "b" and await page.evaluate(SPOT) == bspot, "Back returns to the other book where you were")

        # 9 Scroll mode
        await page.evaluate("setRS({ flow: 'scroll' })"); await page.wait_for_timeout(500)
        pad = await page.evaluate("[parseFloat(getComputedStyle(document.querySelector('#book')).paddingBottom), document.querySelector('#pin').getBoundingClientRect().height]")
        check(pad[0] >= 160 + pad[1] - 1, f"in Scroll mode the end of the book can be scrolled clear of the pin ({pad})")

        # 10 backups carry the pin
        await page.evaluate("setPin({ tid: 'a', at: 40, text: 'Paragraph', page: '5', title: 'First book', open: true })"); await page.wait_for_timeout(200)
        bk = await page.evaluate("""(async () => {
          let out; const orig = saveFile; saveFile = async (n, txt) => { out = JSON.parse(txt); return true; };
          await exportBackup(); saveFile = orig; return out; })()""")
        check(bk.get("pin", {}).get("text") == "Paragraph", "a backup includes the pinned passage")
        back = await page.evaluate("""async (bk) => {
          PIN = null; savePin();
          const sum = restoreSummary(planRestore(bk));
          await applyRestore(planRestore(bk), false);
          const p = JSON.parse(localStorage.getItem('mg-pin') || 'null');
          setPin({ tid: 'b', at: 1, text: 'Other words', page: '1', title: 'Second book', open: false });
          await applyRestore(planRestore(bk), false); const kept = JSON.parse(localStorage.getItem('mg-pin')).text;
          await applyRestore(planRestore(bk), true); const theirs = JSON.parse(localStorage.getItem('mg-pin')).text;
          const bad = planRestore({ ...bk, pin: { tid: 'a', text: 5 } });
          return [p && p.text, p && p.open, sum.includes('Pinned passage'), kept, theirs, bad.pin === undefined && bad.skipped > 0];
        }""", bk)
        check(back == ["Paragraph", False, True, "Other words", "Paragraph", True], f"restoring brings the pin back when none is pinned, keeps this device's otherwise, takes the backup's when asked, and skips a malformed one ({back})")

        check(not errs, "no script errors" + (f": {errs}" if errs else ""))
        await browser.close()

server = subprocess.Popen([sys.executable, "-m", "http.server", str(PORT), "-d", str(ROOT)], stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
try:
    time.sleep(1); asyncio.run(main())
finally:
    server.terminate()
print(f"\n{len(failures)} failed" if failures else "\nall passed")
sys.exit(1 if failures else 0)
