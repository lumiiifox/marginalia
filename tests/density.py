"""Chapter density on a book's page. Run after changes to it, to chapterHeads, readerTermNames or reading pace:  python3 tests/density.py

Checks that, on the bundled classics:
  1. each chapter gets words a sentence and glossary terms per 1,000 words, the back matter and tiny chapters left out;
  2. the numbers make sense: Spinoza's Part I (substance, attribute) has the most terms of the Ethics, Kant's sentences run longer than Spinoza's;
  3. everyday-sense names (DENSITY_SKIP) are never counted, and a term's plural counts as the term;
  4. the panel shows a summary, folds the chapter rows, and a chapter opens the reader at its heading;
  5. times use your measured pace once there is one, and DENSITY_WPM before;
  6. a book with one chapter or none shows no panel; it fits a phone with no script errors.
Needs: pip install playwright && playwright install chromium
"""
import asyncio, re, subprocess, sys, time
from pathlib import Path
from playwright.async_api import async_playwright

ROOT = Path(__file__).resolve().parent.parent
PORT = 8811
URL = f"http://localhost:{PORT}/index.html"
READY = "typeof idb !== 'undefined' && idb && S.mode === 'ready'"
failures = []
def check(ok, what):
    print(("ok   " if ok else "FAIL ") + what)
    if not ok: failures.append(what)

async def book_page(page, tid):
    await page.evaluate(f"go({{ screen: 'text', textId: '{tid}' }})")
    await page.wait_for_function(f"S.content.has('{tid}') && document.querySelector('.density')", timeout=30000)

async def main():
    async with async_playwright() as p:
        browser = await p.chromium.launch()
        ctx = await browser.new_context(viewport={"width": 412, "height": 915}, device_scale_factor=2.625, is_mobile=True, has_touch=True)
        page = await ctx.new_page(); errs = []
        page.on("pageerror", lambda e: errs.append(str(e)))
        page.on("console", lambda m: m.type == "error" and "Failed to load resource" not in m.text and errs.append(m.text))
        await page.route(re.compile(r"^https://(fonts|cdnjs|commons)\."), lambda r: r.abort())
        await page.goto(URL); await page.wait_for_function(READY); await page.wait_for_timeout(500)
        await page.evaluate("addClassics(true)")
        await page.wait_for_function("['classic-spinoza-ethics', 'classic-kant-groundwork'].every((id) => S.texts.has(id))", timeout=60000)

        # 1, 2 the numbers
        await book_page(page, "classic-spinoza-ethics")
        sp = await page.evaluate("densityOf(S.content.get('classic-spinoza-ethics'), S.texts.get('classic-spinoza-ethics'))")
        check([c["label"].split(":")[0] for c in sp] == ["Part I", "Part II", "Part III", "Part IV", "Part V"], f"the Ethics' five parts, each measured ({[c['label'] for c in sp]})")
        check(all(c["words"] >= 200 and 5 < c["perSentence"] < 60 for c in sp), "each part has its words and a plausible sentence length")
        check(max(sp, key=lambda c: c["perK"])["label"].startswith("Part I:") and {"substance", "attribute"} <= set(sp[0]["top"]), f"Part I has the most terms, substance and attribute among them ({sp[0]['top']})")
        await book_page(page, "classic-kant-groundwork")
        kt = await page.evaluate("densityOf(S.content.get('classic-kant-groundwork'), S.texts.get('classic-kant-groundwork'))")
        avg = lambda L: sum(c["perSentence"] for c in L) / len(L)
        check(avg(kt) > avg(sp) * 1.5, f"Kant's sentences run longer than Spinoza's ({avg(kt):.0f} vs {avg(sp):.0f} words)")

        # 3 skipped names, plurals
        skipped = await page.evaluate("[...DENSITY_SKIP].filter((s) => readerTermNames().some((n) => n.s === s))")
        counted = await page.evaluate("densityOf(S.content.get('classic-kant-groundwork'), S.texts.get('classic-kant-groundwork')).flatMap((c) => c.top)")
        skip_ids = await page.evaluate("readerTermNames().filter((n) => DENSITY_SKIP.has(n.s)).map((n) => n.id)")
        check(skipped and not set(counted) & set(skip_ids), f"everyday-sense names are never counted ({skipped})")
        plural = await page.evaluate("""(() => { const B = [{ k: 'h', x: 'One', s: 's1', st: 'chapter' }, { k: 'p', x: ('Substances and attributes. ').repeat(120) },
          { k: 'h', x: 'Two', s: 's2', st: 'chapter' }, { k: 'p', x: ('A plain sentence here. ').repeat(80) }];
          return densityOf(B, { sections: [{ id: 's1', label: 'One' }, { id: 's2', label: 'Two' }] }).map((c) => [c.label, c.top, Math.round(c.perK)]); })()""")
        check(len(plural) == 2 and "substance" in plural[0][1] and "attribute" in plural[0][1] and plural[1][2] == 0, f"a plural counts as its term, plain prose as none ({plural})")

        # 4 the panel
        await book_page(page, "classic-spinoza-ethics")
        panel = await page.evaluate("""(() => { const d = document.querySelector('.density'); return { sum: d.querySelector('.dn-sum').textContent, open: d.querySelector('details').open,
          rows: d.querySelectorAll('.dn-row').length, chips: d.querySelectorAll('.dn-terms .tchip').length, bars: [...d.querySelectorAll('.dn-bar i')].map((i) => parseInt(i.style.width)) }; })()""")
        check("Most glossary terms: Part I" in panel["sum"] and "Longest sentences: Part I" in panel["sum"] and not panel["open"], f"a summary line, the chapter rows folded ({panel['sum']})")
        check(panel["rows"] == 5 and panel["chips"] >= 5 and all(4 <= b <= 100 for b in panel["bars"]), f"a row per part, with term chips and bars on a fixed scale ({panel['bars']})")
        await page.click(".density summary")
        head = await page.evaluate("+document.querySelector('.dn-ch').dataset.gotoNote")
        await page.click(".dn-ch"); await page.wait_for_timeout(800)
        check(await page.evaluate(f"S.screen === 'reader' && S.textId === 'classic-spinoza-ethics' && Math.abs((S.at ?? R.at ?? {head}) - {head}) < 5"), "a chapter opens the reader at its heading")

        # 5 times at your pace
        await book_page(page, "classic-spinoza-ethics")
        before = await page.inner_text(".density .hint")
        await page.evaluate("""(async () => { const t = S.texts.get('classic-spinoza-ethics'), d = {}; const k = dayKey(new Date()); d[k] = [1800, 9000];
          await put('texts', t.id || 'classic-spinoza-ethics', { ...t, days: d }); render(); })()""")
        await page.wait_for_timeout(400)
        after = await page.inner_text(".density .hint")
        first = await page.evaluate("document.querySelector('.density .dn-time').textContent")
        check("200 words a minute" in before and "300 words a minute" in after, f"times at 200 words a minute, then at your pace ({after[:70]}…)")
        check(re.fullmatch(r"\d+ (min|h( \d+ min)?)", first.strip()) is not None, f"a chapter's time ({first})")

        # 6 no panel without chapters; phone width; errors
        one = await page.evaluate("densityOf([{ k: 'p', x: 'Just a paragraph. '.repeat(300) }], { sections: [] }).length")
        check(one == 0, "a book without chapters gets no panel")
        await book_page(page, "classic-kant-groundwork"); await page.click(".density summary")
        check(await page.evaluate("document.documentElement.scrollWidth <= innerWidth"), "the panel fits a phone")
        check(not errs, "no script errors" + (f": {errs}" if errs else ""))
        await browser.close()

server = subprocess.Popen([sys.executable, "-m", "http.server", str(PORT), "-d", str(ROOT)], stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
try:
    time.sleep(1); asyncio.run(main())
finally:
    server.terminate()
print(f"\n{len(failures)} failed" if failures else "\nall passed")
sys.exit(1 if failures else 0)
