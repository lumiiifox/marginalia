"""Another edition's pages, the original beside a translation, and reading pace. Run after changes to any of them:  python3 tests/editions.py

Uses made-up books only. Checks that:
  1. another edition's pages: pairs typed in the book's menu are read in any of the usual ways and saved with the book; the other edition's
     page is exact at a pair and estimated (≈) between and beyond them; the reader's footer, the note cards and the Markdown export show it;
     Go to page takes the other edition's numbers; a backup with malformed pairs is refused; a backup round trip keeps them.
Needs: pip install playwright && playwright install chromium
"""
import asyncio, json, subprocess, sys, time
from pathlib import Path
from playwright.async_api import async_playwright

ROOT = Path(__file__).resolve().parent.parent
PORT = 8816
URL = f"http://localhost:{PORT}/index.html"
READY = "typeof idb !== 'undefined' && idb && S.mode === 'ready'"
failures = []
def check(ok, what):
    print(("ok   " if ok else "FAIL ") + what)
    if not ok: failures.append(what)

# a book of 6 chapters, a page marker every 4 paragraphs, pages 1 to 60
BOOK = r"""async ([id, title, lang, word]) => { const now = Date.now(), B = [], secs = []; let pg = 1;
  for (let c = 0; c < 6; c++) { const s = id + "-c" + c; secs.push({ id: s, label: "Chapter " + (c + 1) }); B.push({ k: "h", l: 2, x: "Chapter " + (c + 1), s, st: "chapter" });
    for (let k = 0; k < 40; k++) { if (k % 4 === 0) B.push({ k: "pg", x: String(pg++) }); B.push({ k: "p", x: `${word} ${c + 1}.${k + 1}: ` + "the words of this paragraph go on for a while, ".repeat(3 + (k % 3)) }); } }
  await put("content", id, B);
  await put("texts", id, { title, sections: secs, hasContent: true, total: B.length, pos: 0, lang, createdAt: now, updatedAt: now });
  return B.length; }"""

async def fresh(browser):
    ctx = await browser.new_context(viewport={"width": 390, "height": 844}, is_mobile=True, has_touch=True, accept_downloads=True)
    page = await ctx.new_page(); errs = []
    page.on("pageerror", lambda e: errs.append(str(e)))
    page.on("console", lambda m: m.type == "error" and "Failed to load resource" not in m.text and errs.append(m.text))
    await page.goto(URL); await page.wait_for_function(READY)
    return page, errs

async def concordance(browser):
    page, errs = await fresh(browser)
    await page.evaluate(BOOK, ["en", "Anti-Oedipus", "en", "English"])
    await page.evaluate("go({ screen: 'text', textId: 'en' })"); await page.wait_for_timeout(200)
    await page.click("#more"); await page.click("#m-conc"); await page.wait_for_selector("#cc-pairs")
    await page.fill("#cc-pairs", "10 = 20\n30: 50; 2 4\n40 → 70")
    await page.click("#sheetroot button[type=submit]"); await page.wait_for_timeout(200)
    check("Name the other edition" in await page.inner_text("#err"), "pairs without a name for the other edition are refused")
    await page.fill("#cc-label", "Minuit"); await page.click("#sheetroot button[type=submit]"); await page.wait_for_timeout(300)
    c = await page.evaluate("S.texts.get('en').conc")
    check(c == {"label": "Minuit", "pairs": [["10", "20"], ["30", "50"], ["2", "4"], ["40", "70"]]}, f"pairs are read however they're written, and saved with the book ({c})")
    est = await page.evaluate("['10', '20', '35', '1', '50', 'xii'].map((p) => concPage(S.texts.get('en'), p)).concat([concPage(S.texts.get('en'), '50', true), concPage(S.texts.get('en'), '60', true)])")
    want = [{"p": "20", "exact": True}, {"p": "35", "exact": False}, {"p": "60", "exact": False}, {"p": "2", "exact": False}, {"p": "90", "exact": False}, None, {"p": "30", "exact": True}, {"p": "35", "exact": False}]
    check(est == want, f"exact at a pair, in proportion between and beyond them, and back again ({est})")
    one = await page.evaluate("concPage({ conc: { label: 'X', pairs: [['10', '15']] } }, '12')")
    check(one == {"p": "17", "exact": False}, f"with a single pair, the same offset ({one})")
    # the reader's footer and Go to page
    await page.evaluate("localStorage.setItem('mg-reader', JSON.stringify({ flow: 'pages', bars: 'hide' }))")
    await page.evaluate("go({ screen: 'reader', textId: 'en' })"); await page.wait_for_timeout(800)
    await page.evaluate("jumpTo(blockForPage('20'), false, true)"); await page.wait_for_timeout(300)
    foot = await page.inner_text("#rfoot")
    check("p. 20" in foot and "Minuit ≈ 35" in foot, f"the reader's footer shows the other edition's page ({foot!r})")
    await page.evaluate("showNav(true)"); await page.wait_for_timeout(200)
    await page.fill("#rnav-pg", "Minuit 50"); await page.press("#rnav-pg", "Enter"); await page.wait_for_timeout(400)
    check(await page.evaluate("R.pageAt[currentBlock()]") == "30", "Go to page takes the other edition's page: Minuit 50 is p. 30")
    await page.fill("#rnav-pg", "m 999999"); await page.press("#rnav-pg", "Enter"); await page.wait_for_timeout(300)
    last = await page.evaluate("R.pageAt[currentBlock()]")
    check(last in ("59", "60"), f"an other-edition page beyond this book goes to its last pages, as Go to page does ({last})")
    # notes and export
    await page.evaluate("put('notes', 'n1', { textId: 'en', kind: 'passage', passage: 'p', gloss: 'g', page: '30', links: [], createdAt: 1, updatedAt: 1 })")
    await page.evaluate("go({ screen: 'text', textId: 'en' })"); await page.wait_for_timeout(300)
    card = await page.inner_text("[data-nid='n1'] .meta")
    md = await page.evaluate("notesMarkdown('en')")
    check("Minuit 50" in card and "p. 30, Minuit 50, Passage" in md, f"note cards and the Markdown export show it ({card!r})")
    # backups
    bad = await page.evaluate("[VALID.texts({ title: 'x', conc: { label: 'M', pairs: [['1', '<img src=x>'.repeat(3)]] } }), VALID.texts({ title: 'x', conc: { label: 'M', pairs: [['1']] } }), VALID.texts({ title: 'x', conc: { label: 'M', pairs: [[1, 2]] } }), VALID.texts({ title: 'x', conc: { label: 'M', pairs: [['1', '2']] } })]")
    check(bad == [False, False, False, True], f"a backup's pairs must be short page labels in twos ({bad})")
    await page.evaluate("S.texts.get('en').conc && concSheet('en')"); await page.wait_for_selector("#cc-pairs")
    await page.fill("#cc-label", ""); await page.fill("#cc-pairs", ""); await page.click("#sheetroot button[type=submit]"); await page.wait_for_timeout(300)
    check(await page.evaluate("S.texts.get('en').conc === undefined"), "emptied, the pairs are removed")
    check(not errs, "no script errors with another edition's pages" + (f": {errs}" if errs else ""))
    await page.context.close()

async def main():
    async with async_playwright() as p:
        browser = await p.chromium.launch()
        await concordance(browser)
        await browser.close()

server = subprocess.Popen([sys.executable, "-m", "http.server", str(PORT), "-d", str(ROOT)], stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
try:
    time.sleep(1); asyncio.run(main())
finally:
    server.terminate()
print(f"\n{len(failures)} failed" if failures else "\nall passed")
sys.exit(1 if failures else 0)
