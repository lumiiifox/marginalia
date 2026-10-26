"""Highlights land on the words you selected. Run after changes to the reader or notes:  python3 tests/highlights.py

Made-up book only, phone-sized touch screen. Selects text as a reader does and checks that:
  1. a highlight of a phrase that occurs twice in a paragraph marks the occurrence selected, and keeps where it is;
  2. a passage running into the next paragraph, or across a printed-page join, is marked in both; its note shows once;
  3. an older note (no anchor, only a block and the passage) running into the next paragraph is now marked there too;
  4. after the paragraph is corrected with Edit, the highlight stays on its words; if its words are changed it is left
     unmarked and Your notes says so;
  5. Highlight's toast offers Question, Objection and Undo;
  6. Continue on next page carries a selection over a page turn into one passage;
  7. backups accept anchors and refuse broken ones; Scroll mode marks the same words.
Needs: pip install playwright && playwright install chromium
"""
import os
import asyncio, subprocess, sys, time
from pathlib import Path
from playwright.async_api import async_playwright

ROOT = Path(__file__).resolve().parent.parent
PORT = int(os.environ.get("MG_PORT", 8802))  # tests/run.py gives each test its own port
URL = f"http://localhost:{PORT}/index.html"
READY = "typeof idb !== 'undefined' && idb && S.mode === 'ready'"
BOOK = """(rs) => (async () => {
  const B = [], filler = 'Everywhere it is machines, real ones, with all the necessary couplings and connections. ';
  B.push({ k: 'pg', x: '1' }, { k: 'h', l: 1, x: 'Chapter 1', s: 'c1' });
  B.push({ k: 'p', x: 'First the desiring-machines run, then the \\u0001desiring-machines\\u0002 break down, and that is the point. ' + filler });
  B.push({ k: 'p', x: 'A passage begins at the end of this paragraph and the reader keeps going' });
  B.push({ k: 'p', x: 'into the next one without stopping. ' + filler });
  B.push({ k: 'p', x: 'Old note here: the body without organs is the ultimate residuum' });
  B.push({ k: 'p', x: 'of a deterritorialized socius. ' + filler });
  B.push({ k: 'p', x: 'Before the break, a profound love of' }, { k: 'pg', x: '2' }, { k: 'c', x: 'life, and often enormously amusing. ' + filler });
  for (let n = 0; n < 60; n++) B.push({ k: 'p', x: 'Paragraph ' + n + '. ' + filler.repeat(2 + n % 3) });
  await put('content', 'h', B);
  await put('texts', 'h', { title: 'Anti', author: 'Test', hasContent: true, total: B.length, pos: 0, status: 'reading', createdAt: 1, updatedAt: 1, sections: [{ id: 'c1', label: 'Chapter 1' }] });
  await put('notes', 'old', { textId: 'h', kind: 'passage', passage: 'the body without organs is the ultimate residuum of a deterritorialized socius.', at: 5, createdAt: 1, updatedAt: 1 });
  localStorage.setItem('mg-reader', JSON.stringify(rs));
})()"""
# select from (block i, char a) to (block j, char b), as the reader would
SELECT = """([i, a, j, b]) => { const r1 = rangeFor(i, a, a + 1), r2 = rangeFor(j, Math.max(0, b - 1), b), r = document.createRange();
  r.setStart(r1.startContainer, r1.startOffset); r.setEnd(r2.endContainer, r2.endOffset); getSelection().removeAllRanges(); getSelection().addRange(r); }"""
MARKS = "(id) => [...document.querySelectorAll(`#book mark[data-note='${id}']`)].map((m) => [+m.closest('[data-i]').dataset.i, m.textContent])"

failures = []
def check(ok, what):
    print(("ok   " if ok else "FAIL ") + what)
    if not ok: failures.append(what)

async def main():
    async with async_playwright() as p:
        browser = await p.chromium.launch()
        ctx = await browser.new_context(viewport={"width": 412, "height": 915}, device_scale_factor=2.625, is_mobile=True, has_touch=True)
        page = await ctx.new_page(); errs = []
        page.on("pageerror", lambda e: errs.append(str(e)))
        await page.goto(URL); await page.wait_for_function(READY)
        await page.evaluate(BOOK, {"fs": 18, "flow": "pages", "turn": "slide", "bars": "show"}); await page.reload(); await page.wait_for_function(READY)
        await page.evaluate("go({ screen: 'reader', textId: 'h' })"); await page.wait_for_selector(".book .bp"); await page.wait_for_timeout(700)
        newest = "() => [...S.notes.entries()].filter(([, n]) => n.textId === 'h').sort((a, b) => b[1].createdAt - a[1].createdAt)[0][0]"

        async def highlight(i, a, j, b):
            await page.evaluate(SELECT, [i, a, j, b]); await page.wait_for_timeout(300)
            await page.click("#selhl"); await page.wait_for_timeout(400)
            return await page.evaluate(newest)

        # 1 the second of two occurrences
        x = await page.evaluate("plain(R.blocks[2].x)"); second = x.index("desiring-machines", x.index("desiring-machines") + 1)
        nid = await highlight(2, second, 2, second + len("desiring-machines"))
        m = await page.evaluate(MARKS, nid); n = await page.evaluate(f"S.notes.get('{nid}')")
        before = await page.evaluate(f"(() => {{ const mk = document.querySelector(`#book mark[data-note='{nid}']`), r = document.createRange(); r.setStart(mk.closest('p'), 0); r.setEndBefore(mk); return r.toString(); }})()")
        check(m == [[2, "desiring-machines"]] and n["anchor"]["ao"] == second and before == "First the desiring-machines run, then the ", f"the occurrence selected is marked, the second of two, in italics ({before!r})")

        # 2 a passage running into the next paragraph; across a printed-page join
        a3 = await page.evaluate("plain(R.blocks[3].x).indexOf('the reader')")
        nid2 = await highlight(3, a3, 4, len("into the next one"))
        m2 = await page.evaluate(MARKS, nid2)
        check(m2 == [[3, "the reader keeps going"], [4, "into the next one"]], f"a passage running into the next paragraph is marked in both ({m2})")
        await page.evaluate(f"(async () => {{ const n = S.notes.get('{nid2}'); await put('notes', '{nid2}', {{ ...n, gloss: 'Keeps going.' }}); }})()"); await page.wait_for_timeout(300)
        check(await page.evaluate(f"document.querySelectorAll(`.mnote[data-note='{nid2}']`).length") == 1, "its note shows once, under the paragraph where it starts")
        a7 = await page.evaluate("plain(R.blocks[7].x).indexOf('profound')")
        nid3 = await highlight(7, a7, 9, len("life, and often"))
        m3 = await page.evaluate(MARKS, nid3)
        check(m3 == [[7, "profound love of"], [9, "life, and often"]], f"across a printed-page join, both halves are marked ({m3})")

        # 3 an older note, kept with only its block and passage
        m4 = await page.evaluate(MARKS, "old")
        check([k for k, _ in m4] == [5, 6] and m4[1][1] == "of a deterritorialized socius.", f"an older note running into the next paragraph is marked there too ({m4})")

        # 4 correcting the paragraph
        async def edit(i, txt):
            await page.evaluate(f"R.sel = {{ text: 'x', i: {i}, page: '1', sec: '' }}; editSelectedParagraph()"); await page.wait_for_selector("#edit-paragraph")
            await page.fill("#edit-paragraph", txt); await page.click("button[type=submit]"); await page.wait_for_timeout(500)
        await edit(2, "Corrected: first the desiring-machines run, then the desiring-machines break down, and that is the point. " + "Everywhere it is machines.")
        m5 = await page.evaluate(MARKS, nid); pre5 = await page.evaluate(f"(() => {{ const mk = document.querySelector(`#book mark[data-note='{nid}']`), r = document.createRange(); r.setStart(mk.closest('p'), 0); r.setEndBefore(mk); return r.toString(); }})()")
        check(m5 == [[2, "desiring-machines"]] and pre5 == "Corrected: first the desiring-machines run, then the ", f"after a correction earlier in the paragraph, the highlight stays on the same occurrence ({m5})")
        await edit(2, "Corrected: first the machines run, then the engines break down, and that is the point.")
        await page.wait_for_timeout(200)
        m6 = await page.evaluate(MARKS, nid)
        await page.evaluate("tocPanel()"); await page.click("[data-toctab=notes]"); await page.wait_for_timeout(200)
        lost = await page.inner_text("#tocbody")
        check(m6 == [] and "not found in the text" in lost, "when its words are corrected away, it is left unmarked and Your notes says so")
        await page.click("#pclose"); await page.wait_for_timeout(300)

        # 5 the Highlight toast
        await page.evaluate("goTo(10)"); await page.wait_for_timeout(200)
        nid4 = await highlight(10, 0, 10, 12)
        btns = await page.evaluate("[...document.querySelectorAll('#toast .toastbtn')].map((b) => b.textContent)")
        check(btns == ["Question", "Objection", "Undo"], f"Highlight's toast offers {btns}")
        await page.click("#toast .toastbtn >> text=Question"); await page.wait_for_timeout(300)
        check(await page.evaluate(f"S.notes.get('{nid4}').kind") == "question", "Question marks it as a question")
        await page.evaluate(f"del('notes', '{nid4}')"); await page.click("#toast .toastbtn >> text=Undo"); await page.wait_for_timeout(300)
        check(not await page.evaluate(f"S.notes.has('{nid4}') || idbGet('notes', '{nid4}').then((n) => !!n)"), "its Undo after the note was deleted doesn't bring back a broken note")
        nid5 = await highlight(11, 0, 11, 12)
        await page.click("#toast .toastbtn >> text=Undo"); await page.wait_for_timeout(400)
        check(not await page.evaluate(f"S.notes.has('{nid5}')") and await page.evaluate(MARKS, nid5) == [], "Undo takes the highlight away")

        # 6 Continue on next page
        await page.evaluate("goTo(12)"); await page.wait_for_timeout(300)
        last = await page.evaluate("""() => { const pg = currentPage(); let best = null;
          for (let k = R.win[0]; k < R.win[1]; k++) { const p = screenPagesOf(k); if (p && p[0] === pg && p[1] > pg && R.blocks[k].k === 'p') { best = k; break; } } return best; }""")
        check(last is not None, f"a paragraph runs over the page edge ({last})")
        await page.evaluate(SELECT, [last, 0, last, 9]); await page.wait_for_timeout(300)
        check(await page.locator("#selmore").is_visible(), "Swipe pages offer Continue on next page")
        p0 = await page.evaluate("currentPage()")
        await page.click("#selmore"); await page.wait_for_timeout(400)
        check(await page.evaluate("currentPage()") == p0 + 1 and await page.locator("#selcarry").is_visible(), "it turns the page and says to select where the passage ends")
        endb = last + 1
        await page.evaluate(SELECT, [endb, 0, endb, 14]); await page.wait_for_timeout(300)
        sel = await page.evaluate("({ i: R.sel.i, text: R.sel.text, a: R.sel.anchor })")
        check(sel["i"] == last and sel["text"].startswith("Paragraph") and sel["text"].endswith(await page.evaluate(f"plain(R.blocks[{endb}].x).slice(0, 14)")), f"the selection runs from the earlier page ({sel['text'][:40]!r}…{sel['text'][-20:]!r})")
        await page.click("#selhl"); await page.wait_for_timeout(400)
        nid6 = await page.evaluate(newest); n6 = await page.evaluate(f"S.notes.get('{nid6}')")
        check(n6["anchor"]["a"] == last and n6["anchor"]["b"] == endb and [k for k, _ in await page.evaluate(MARKS, nid6)] == [last, endb], "Highlight saves one passage over both pages, marked on both")
        check(not await page.locator("#selcarry").is_visible(), "and the carried selection is done")
        await page.evaluate(SELECT, [endb + 2, 0, endb + 2, 9]); await page.wait_for_timeout(300)
        await page.click("#selmore"); await page.wait_for_timeout(300); await page.click("#selcarryx"); await page.wait_for_timeout(200)
        check(await page.evaluate("R.selCarry") is None and not await page.locator("#selcarry").is_visible(), "Cancel drops a carried selection")

        # 7 backups; Scroll mode
        ok = await page.evaluate("VALID.notes(S.notes.get('" + nid6 + "'))")
        bad = await page.evaluate("VALID.notes({ textId: 'h', passage: 'x', at: 1, anchor: { a: 1, ao: 'x', b: 1, bo: 2 } })")
        check(ok and not bad, "a backup accepts anchors and refuses a broken one")
        await page.evaluate("setRS({ flow: 'scroll' })"); await page.wait_for_timeout(400)
        sm = [await page.evaluate(MARKS, x) for x in (nid2, nid3, "old")]
        check([[k for k, _ in m] for m in sm] == [[3, 4], [7, 9], [5, 6]], f"Scroll mode marks the same words ({sm})")
        check(not errs, "no script errors" + (f": {errs[:3]}" if errs else ""))
        await ctx.close(); await browser.close()

server = subprocess.Popen([sys.executable, "-m", "http.server", str(PORT), "-d", str(ROOT)], stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
try:
    time.sleep(1); asyncio.run(main())
finally:
    server.terminate()
print(f"\n{len(failures)} failed" if failures else "\nall passed")
sys.exit(1 if failures else 0)
