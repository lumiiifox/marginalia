"""Block quotes and a book's language. Run after changes to the reader or Edit:  python3 tests/quotes_language.py

Made-up books only. Checks that:
  1. Edit → A block quote sets selected paragraphs off as a quote, saved; Edit shows an imported quote as one;
     Plain text turns an imported quote back into a paragraph;
  2. a book's language is worked out from its text (French here) and given to the page, so justified pages break words by
     that language's rules; Edit text can set it (German) or leave it to the text again; backups check it is text.
(Block quotes found at import are checked in tests/pdf_import.py.)
Needs: pip install playwright && playwright install chromium
"""
import os
import asyncio, subprocess, sys, time
from pathlib import Path
from playwright.async_api import async_playwright

ROOT = Path(__file__).resolve().parent.parent
PORT = int(os.environ.get("MG_PORT", 8804))  # tests/run.py gives each test its own port
URL = f"http://localhost:{PORT}/index.html"
READY = "typeof idb !== 'undefined' && idb && S.mode === 'ready'"
BOOK = """(async () => {
  const fr = "Le désir n'est pas un manque, et la machine ne se trouve pas dans une représentation. Il est dans le réel, et les flux qui le traversent sont des productions. ";
  const B = [{ k: 'pg', x: '1' }, { k: 'h', l: 1, x: 'Chapitre premier', s: 'c1' }];
  for (let n = 0; n < 40; n++) B.push({ k: 'p', x: 'Paragraphe ' + n + '. ' + fr.repeat(2) });
  B.push({ k: 'q', x: 'Une citation importée du fichier, déjà mise en retrait.' });
  B.push({ k: 'p', x: 'La suite du texte. ' + fr });
  await put('content', 'f', B);
  await put('texts', 'f', { title: "L'Anti-Œdipe", author: 'Test', hasContent: true, total: B.length, pos: 0, status: 'reading', createdAt: 1, updatedAt: 1, sections: [{ id: 'c1', label: 'Chapitre premier' }] });
  localStorage.setItem('mg-reader', JSON.stringify({ fs: 18, flow: 'pages', turn: 'slide', bars: 'show' }));
})()"""

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
        await page.evaluate(BOOK); await page.reload(); await page.wait_for_function(READY)
        await page.evaluate("go({ screen: 'reader', textId: 'f' })"); await page.wait_for_selector(".book .bp"); await page.wait_for_timeout(700)

        # 1 block quotes
        await page.evaluate("() => { const r = document.createRange(); r.setStart(R.els[3].firstChild, 0); r.setEnd(R.els[4].firstChild, 12); getSelection().removeAllRanges(); getSelection().addRange(r); }")
        await page.wait_for_timeout(300)
        await page.click("#seledit"); await page.wait_for_selector(".fixopt[data-role=quote]")
        await page.click(".fixopt[data-role=quote]"); await page.wait_for_timeout(500)
        q = await page.evaluate("() => ({ cls: [R.els[3].className, R.els[4].className], st: [R.blocks[3].st, R.blocks[4].st], saved: S.content.get('f')[3].st, ind: parseFloat(getComputedStyle(R.els[3]).marginLeft) })")
        check(q["cls"] == ["bq", "bq"] and q["st"] == ["quote", "quote"] and q["saved"] == "quote" and q["ind"] > 10, f"Edit → A block quote sets the paragraphs off, indented, and saves it ({q})")
        qi = await page.evaluate("R.blocks.findIndex((b) => b.k === 'q')")
        await page.evaluate(f"goTo({qi})"); await page.wait_for_timeout(300)
        await page.evaluate(f"() => {{ const r = document.createRange(); r.selectNodeContents(R.els[{qi}]); getSelection().removeAllRanges(); getSelection().addRange(r); }}"); await page.wait_for_timeout(300)
        await page.click("#seledit"); await page.wait_for_selector(".fixopt.on")
        check(await page.get_attribute(".fixopt.on", "data-role") == "quote", "Edit shows an imported quote as a block quote")
        await page.click(".fixopt[data-role=text]"); await page.wait_for_timeout(500)
        check(await page.evaluate(f"R.els[{qi}].className") == "bp" and await page.evaluate(f"R.blocks[{qi}].st") == "text", "Plain text makes it an ordinary paragraph")

        # 2 the book's language
        lang = await page.evaluate("() => ({ guess: guessLang(R.blocks), page: document.querySelector('#book').lang, twin: document.querySelector('#flipbook').lang, hy: getComputedStyle(R.els[5]).hyphens })")
        check(lang == {"guess": "fr", "page": "fr", "twin": "fr", "hy": "auto"}, f"the language is worked out from the text and given to the page, hyphenated by its rules ({lang})")
        await page.evaluate("go({ screen: 'text', textId: 'f' })"); await page.wait_for_timeout(300)
        await page.evaluate("textSheet('f')"); await page.wait_for_selector("#f-lang")
        check(await page.input_value("#f-lang") == "", "Edit text leaves it to the text until you choose")
        await page.select_option("#f-lang", "de"); await page.click("button[type=submit]"); await page.wait_for_timeout(400)
        await page.evaluate("go({ screen: 'reader', textId: 'f' })"); await page.wait_for_timeout(600)
        check(await page.evaluate("[S.texts.get('f').lang, document.querySelector('#book').lang]") == ["de", "de"], "choosing German saves it and the page uses it")
        await page.evaluate("go({ screen: 'text', textId: 'f' })"); await page.wait_for_timeout(300)
        await page.evaluate("textSheet('f')"); await page.wait_for_selector("#f-lang")
        check(await page.input_value("#f-lang") == "de", "Edit text shows the language chosen")
        await page.select_option("#f-lang", ""); await page.click("button[type=submit]"); await page.wait_for_timeout(400)
        await page.evaluate("go({ screen: 'reader', textId: 'f' })"); await page.wait_for_timeout(600)
        check(await page.evaluate("['lang' in S.texts.get('f'), document.querySelector('#book').lang]") == [False, "fr"], "Worked out from the text goes back to French")
        ok = await page.evaluate("[VALID.texts({ title: 'x', lang: 'fr' }), VALID.texts({ title: 'x', lang: 4 })]")
        check(ok == [True, False], "backups accept a language and refuse one that isn't text")
        en = await page.evaluate("guessLang([{ k: 'p', x: 'The question of method returns whenever philosophy examines the conditions under which its concepts become intelligible, and it is in this that the problem of the subject is posed for us.'.repeat(4) }])")
        check(en == "en", "an English text is English")
        check(not errs, "no script errors" + (f": {errs[:3]}" if errs else ""))
        await ctx.close(); await browser.close()

server = subprocess.Popen([sys.executable, "-m", "http.server", str(PORT), "-d", str(ROOT)], stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
try:
    time.sleep(1); asyncio.run(main())
finally:
    server.terminate()
print(f"\n{len(failures)} failed" if failures else "\nall passed")
sys.exit(1 if failures else 0)
