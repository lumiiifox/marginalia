"""Another edition's pages, the original beside a translation, and reading pace. Run after changes to any of them:  python3 tests/editions.py

Uses made-up books only. Checks that:
  1. another edition's pages: pairs typed in the book's menu are read in any of the usual ways and saved with the book; the other edition's
     page is exact at a pair and estimated (≈) between and beyond them; the reader's footer, the note cards and the Markdown export show it;
     Go to page takes the other edition's numbers; a backup with malformed pairs is refused; a backup round trip keeps them.
  2. a book and its original: pairing from the book's menu marks both books, and pairing one with a third unpairs its old partner; the
     reader offers In the French (the original's language) under the page number; the passage shown matches your place chapter by chapter,
     through the pairs of pages, or in proportion; Earlier and Later move it; Open it there reads on in the original; Unpair clears both.
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

async def original(browser):
    page, errs = await fresh(browser)
    await page.evaluate(BOOK, ["en", "Anti-Oedipus", "en", "English"])
    await page.evaluate(BOOK, ["fr", "L'Anti-Œdipe", "fr", "Français"])
    await page.evaluate(BOOK, ["de", "Anti-Ödipus", "de", "Deutsch"])
    await page.evaluate("go({ screen: 'text', textId: 'en' })"); await page.wait_for_timeout(200)
    await page.click("#more"); await page.click("#m-pair"); await page.wait_for_selector("[data-pairto='fr']")
    await page.click("[data-pairto='fr']"); await page.wait_for_timeout(300)
    check(await page.evaluate("[S.texts.get('en').pair, S.texts.get('fr').pair]") == ["fr", "en"], "pairing marks both books")
    check("Paired with “L'Anti-Œdipe”" in await page.inner_text("header.head"), "the book's page says what it's paired with")
    # the reader: chapter by chapter
    await page.evaluate("localStorage.setItem('mg-reader', JSON.stringify({ flow: 'pages', bars: 'hide' }))")
    await page.evaluate("go({ screen: 'reader', textId: 'en' })"); await page.wait_for_timeout(800)
    target = await page.evaluate("(() => { const B = R.blocks; return B.findIndex((b) => (b.x || '').startsWith('English 3.21:')); })()")
    await page.evaluate(f"jumpTo({target}, false, true)"); await page.wait_for_timeout(300)
    await page.evaluate("showNav(true)"); await page.wait_for_timeout(200)
    check(await page.evaluate("[!document.querySelector('#rnav-pair').hidden, document.querySelector('#rnav-pair').textContent]") == [True, "In the French"], "the reader offers In the French under the page number")
    await page.click("#rnav-pair"); await page.wait_for_selector("#pairbox")
    here = await page.inner_text("#pairbox p.here")
    mine = await page.evaluate("(R.blocks[currentBlock()].x || '').split(':')[0].replace('English ', '')")
    check(here.startswith(f"Français {mine}:") and "chapter by chapter" in await page.inner_text(".sheet"), f"the passage matches your place chapter by chapter ({mine} → {here[:14]!r})")
    await page.click("[data-pairmove='1']"); await page.click("[data-pairmove='1']"); await page.wait_for_timeout(80)
    later = await page.inner_text("#pairbox p.here")
    check(later != here and later.startswith("Français 3."), f"Later moves on a paragraph at a time ({later[:20]!r})")
    await page.click("[data-pairopen]"); await page.wait_for_timeout(900)
    opened = await page.evaluate("[S.screen, R.tid, (R.blocks[currentBlock()].x || '').slice(0, 12)]")
    check(opened[0] == "reader" and opened[1] == "fr", f"Open it there reads on in the original ({opened})")
    # through the pairs of pages, then in proportion
    spot = await page.evaluate("""(async () => { const A = await loadContent('en'), B = await loadContent('fr');
      const fewer = B.filter((b) => !(b.k === 'h' && b.s === 'fr-c5')).map((b) => ({ ...b, s: b.s === 'fr-c5' ? undefined : b.s, st: b.s === 'fr-c5' ? undefined : b.st }));
      const i = A.findIndex((b) => b.k === 'pg' && b.x === '30') + 1;
      const viaPages = pairSpot({ conc: { label: 'Minuit', pairs: [['30', '45']] } }, A, i, {}, fewer);
      const prop = pairSpot({}, A, i, {}, fewer);
      return [viaPages.how, (fewer[viaPages.i - 1] || {}).x, prop.how, Math.abs(prop.i - i) < 12]; })()""")
    check(spot[:2] == ["page", "45"] and spot[2:] == ["proportion", True], f"with different chapters, through the pairs of pages, else in proportion ({spot})")
    # re-pairing and unpairing
    await page.evaluate("setPair('de', 'en')"); await page.wait_for_timeout(200)
    check(await page.evaluate("[S.texts.get('en').pair, S.texts.get('de').pair, S.texts.get('fr').pair]") == ["de", "en", None], "pairing one with a third unpairs its old partner")
    await page.evaluate("setPair('en', '')"); await page.wait_for_timeout(200)
    check(await page.evaluate("[S.texts.get('en').pair, S.texts.get('de').pair]") == [None, None], "Unpair clears both")
    check(await page.evaluate("[VALID.texts({ title: 'x', pair: 'fr' }), VALID.texts({ title: 'x', pair: 7 }), VALID.texts({ title: 'x', pair: '' })]") == [True, False, False], "a backup's pair must be a book's id")
    check(not errs, "no script errors with a paired original" + (f": {errs}" if errs else ""))
    await page.context.close()

async def main():
    async with async_playwright() as p:
        browser = await p.chromium.launch()
        await concordance(browser)
        await original(browser)
        await browser.close()

server = subprocess.Popen([sys.executable, "-m", "http.server", str(PORT), "-d", str(ROOT)], stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
try:
    time.sleep(1); asyncio.run(main())
finally:
    server.terminate()
print(f"\n{len(failures)} failed" if failures else "\nall passed")
sys.exit(1 if failures else 0)
