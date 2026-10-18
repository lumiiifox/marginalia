"""The classics that come with the app. Run after changes to them, to data/books/ or to the reader:  python3 tests/classics.py

Checks that:
  1. the automated browser of the other tests gets no classics by itself;
  2. asked, the app adds every book in CLASSICS once, on the Queued shelf, with its text, chapters and cover, and says so;
  3. opening the app again adds nothing; a classic you delete stays deleted; a file that can't be fetched is tried again later;
  4. every classic opens in the reader at phone size, its chapters in Contents, its note numbers opening the right notes;
  5. a book's page names the edition (Standard Ebooks, the translator) and cites it;
  6. the book files hold only what the app accepts from a backup, and their covers are 400 x 600 JPEGs.
Needs: pip install playwright && playwright install chromium
"""
import asyncio, json, re, subprocess, sys, time
from pathlib import Path
from playwright.async_api import async_playwright

ROOT = Path(__file__).resolve().parent.parent
PORT = 8807
URL = f"http://localhost:{PORT}/index.html"
READY = "typeof idb !== 'undefined' && idb && S.mode === 'ready'"
IDS = re.search(r"const CLASSICS = (\[[^\]]*\])", (ROOT / "index.html").read_text(encoding="utf-8")).group(1)
IDS = json.loads(IDS)
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
        page.on("console", lambda m: m.type == "error" and "Failed to load resource" not in m.text and errs.append(m.text))
        await page.route(re.compile(r"^https://(fonts|cdnjs|commons)\."), lambda r: r.abort())
        await page.goto(URL); await page.wait_for_function(READY); await page.wait_for_timeout(800)

        # 1 nothing by itself in an automated browser
        check(await page.evaluate("CLASSICS.every((id) => !S.texts.has(id))"), "the tests' browser gets no classics unless a test asks")

        # 3 (first) a file that can't be fetched is tried again later
        await page.route("**/data/books/classic-du-bois-souls.json", lambda r: r.abort())
        added = await page.evaluate("addClassics(true)")
        check(len(added) == len(IDS) - 1 and "The Souls of Black Folk" not in added, f"a classic whose file can't be fetched is left for next time ({len(added)} added)")
        await page.unroute("**/data/books/classic-du-bois-souls.json")
        again = await page.evaluate("addClassics(true)")
        check(again == ["The Souls of Black Folk"], f"...and added the next time ({again})")

        # 2 all of them, queued, with text, chapters and cover
        recs = await page.evaluate("""(async () => { const out = {}; for (const id of CLASSICS) { const t = S.texts.get(id), c = await idbGet('content', id), cv = await idbGet('covers', id);
          out[id] = { title: t && t.title, status: t && t.status, has: t && t.hasContent, total: t && t.total, blocks: c && c.length, secs: (t && t.sections || []).length,
            tied: c ? c.filter((b) => b.s).length : 0, cover: cv ? cv.type + ' ' + cv.size : null }; } return out; })()""")
        bad = {k: v for k, v in recs.items() if not (v["status"] == "queued" and v["has"] and v["total"] == v["blocks"] and v["blocks"] > 50 and v["secs"] >= 4 and v["tied"] == v["secs"] and v["cover"] and v["cover"].startswith("image/jpeg"))}
        check(len(recs) == len(IDS) and not bad, f"every classic is in the library, queued, with its text, chapters and cover ({bad or len(recs)})")
        await page.evaluate("go({ screen: 'library' })"); await page.wait_for_timeout(300)
        lib = await page.inner_text("#main")
        check(all(t in lib for t in ["The Communist Manifesto", "A Vindication of the Rights of Woman", "The Genealogy of Morals"]), "they show on the home screen")

        # 3 opening again adds nothing; deleting one keeps it deleted
        await page.reload(); await page.wait_for_function(READY)
        check(await page.evaluate("addClassics(true)") == [], "opening the app again adds nothing")
        await page.evaluate("(async () => { await idbTx(['content', 'texts', 'covers'], (st) => { st('content').delete('classic-nietzsche-genealogy'); st('texts').delete('classic-nietzsche-genealogy'); st('covers').delete('classic-nietzsche-genealogy'); }); S.texts.delete('classic-nietzsche-genealogy'); })()")
        check(await page.evaluate("addClassics(true)") == [] and await page.evaluate("!S.texts.has('classic-nietzsche-genealogy')"), "a classic you delete stays deleted")
        await page.evaluate("localStorage.setItem('mg-classics', JSON.stringify(CLASSICS.filter((x) => x !== 'classic-nietzsche-genealogy')))")
        check(await page.evaluate("addClassics(true)") == ["The Genealogy of Morals"], "on a new phone (no record of what was added) it comes back")

        # 4 every classic in the reader
        for bid in IDS:
            await page.evaluate(f"go({{ screen: 'reader', textId: '{bid}' }})"); await page.wait_for_selector("#book .bp", timeout=15000); await page.wait_for_timeout(500)
            info = await page.evaluate("""(() => ({ paras: document.querySelectorAll('#book .bp').length, wide: document.documentElement.scrollWidth > innerWidth,
              chapters: (S.texts.get(R.tid).sections || []).length, tied: R.blocks.filter((b) => b.s && roleOf(b) === 'chapter').length,
              refs: R.blocks.filter((b) => b.k !== 'fn' && /[⁰¹²³⁴⁵⁶⁷⁸⁹]/.test(b.x || '')).length, notes: R.blocks.filter((b) => b.k === 'fn').length }))()""")
            check(info["paras"] > 0 and not info["wide"] and info["tied"] == info["chapters"], f"{bid} opens in the reader with its {info['chapters']} chapters ({info})")
            if info["refs"]:
                # every note number finds a note that starts with that number
                res = await page.evaluate("""(() => { const out = []; const B = R.blocks;
                  B.forEach((b, i) => { if (b.k === 'fn') return; for (const m of (b.x || '').matchAll(/[⁰¹²³⁴⁵⁶⁷⁸⁹]+/g)) { const n = supNum(m[0]); const [k] = findNote(i, n); out.push([n, k >= 0 && new RegExp('^\\\\s*' + n + '\\\\.').test(plain(B[k].x))]); } });
                  return out; })()""")
                miss = [n for n, ok in res if not ok]
                check(not miss, f"{bid}: each of its {len(res)} note numbers opens its note ({miss[:5]})")
        q, words = "history of all hitherto existing society", "written history"
        await page.evaluate("go({ screen: 'reader', textId: 'classic-marx-engels-manifesto' })"); await page.wait_for_selector("#book .bp"); await page.wait_for_timeout(500)
        k = await page.evaluate(f"R.blocks.findIndex((b) => plain(b.x || '').includes('{q}'))")
        await page.evaluate(f"jumpTo({k}, true, true)"); await page.wait_for_timeout(400)
        await page.evaluate(f"document.querySelector('#book [data-i=\"{k}\"] .fnref').click()"); await page.wait_for_timeout(400)
        panel = await page.evaluate("document.querySelector('.sheet') ? document.querySelector('.sheet').innerText : ''")
        check("Note 4" in panel and words in panel, f"tapping a note number in the Manifesto shows its note ({panel[:120]!r})")
        await page.evaluate("document.querySelector('#pclose') && document.querySelector('#pclose').click()"); await page.wait_for_timeout(300)

        # 5 the book's page: edition and citation
        await page.evaluate("go({ screen: 'text', textId: 'classic-plato-socrates' })"); await page.wait_for_timeout(400)
        head = await page.inner_text("#main header")
        cite = await page.evaluate("bibEntry(S.texts.get('classic-plato-socrates'), 'mla', 'plain')")
        check("From Standard Ebooks" in head and "Plato" in head, f"the book's page says where the text is from ({head[:160]!r})")
        check("Jowett" in cite and "Standard Ebooks" in cite and "2022" in cite, f"it cites the translation and the edition ({cite})")
        check(not errs, "no script errors" + (f": {errs}" if errs else ""))

        # 6 the files themselves
        ok = await page.evaluate("""(async () => { const bad = []; for (const id of CLASSICS) { const b = await (await fetch('data/books/' + id + '.json')).json();
          if (!VALID.texts(b.text) || !VALID.content(b.content) || Object.keys(b).sort().join() !== 'content,text') bad.push(id);
          const img = new Image(); img.src = 'data/books/' + id + '.jpg'; await img.decode(); if (img.naturalWidth !== 400 || img.naturalHeight !== 600) bad.push(id + ' cover'); } return bad; })()""")
        check(ok == [], f"the book files are what a backup may hold, and the covers are 400 x 600 ({ok})")
        await browser.close()

server = subprocess.Popen([sys.executable, "-m", "http.server", str(PORT), "-d", str(ROOT)], stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
try:
    time.sleep(1); asyncio.run(main())
finally:
    server.terminate()
print(f"\n{len(failures)} failed" if failures else "\nall passed")
sys.exit(1 if failures else 0)
