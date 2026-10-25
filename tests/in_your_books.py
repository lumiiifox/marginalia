"""In your books: where a glossary term occurs in the texts of your library. Run after changes to it, to findNeedles or termNeedles,
or to sectionIndex:  python3 tests/in_your_books.py

Made-up books only, phone-sized touch screen. Checks that:
  1. a glossary entry offers Search your books, counting only books with their text loaded, and searches nothing until asked;
  2. matching is by whole words, accents ignored in either Unicode form (NFC and NFD), plurals included, longer words left out;
  3. every occurrence counts: three in one paragraph count three;
  4. each hit shows the printed page and the chapter that sectionIndex gives for its block, and its sentence with the word marked;
  5. a book with many hits lists the first INBOOK_SHOWN + INBOOK_LISTED and says how many more Find will step through;
  6. tapping a hit opens the reader at that block with the word in Find, keeping your place as ← Your place, and Back returns to it;
  7. searching stores nothing: books, notes and positions are unchanged, and no book's text is kept in memory by it.
Needs: pip install playwright && playwright install chromium
"""
import asyncio, json, unicodedata, subprocess, sys, time
from playwright.async_api import async_playwright

PORT = 8823
URL = f"http://localhost:{PORT}/index.html"
READY = "typeof idb !== 'undefined' && idb && S.mode === 'ready'"
SEED = r"""() => (async () => {
  const now = Date.now();
  const A = [{ k: 'h', l: 1, x: 'Alpha', s: 'a0' }, { k: 'pg', x: '12' }, { k: 'h', l: 2, x: 'Chapter One', s: 'a1' },
    { k: 'p', x: 'Différance is no word. Derrida writes differance with an *a*; différances multiply.' },
    { k: 'p', x: 'Nothing here but indifférance and differanced things.' }];
  for (let n = 0; n < 80; n++) A.push({ k: 'p', x: 'A plain paragraph, number ' + n + ', about something else, long enough to take up a few lines of the page on a phone.' });
  A.push({ k: 'pg', x: '13' }, { k: 'h', l: 2, x: 'Chapter Two', s: 'a2' }, { k: 'p', x: 'Later, the word returns: Différance, spelt in decomposed form.' });
  for (let n = 0; n < 80; n++) A.push({ k: 'p', x: 'More filler, paragraph ' + n + ', after the second chapter begins, again a few lines long on a phone.' });
  await put('content', 'b1', A);
  await put('texts', 'b1', { title: 'Alpha', author: 'Aardvark', hasContent: true, total: A.length, pos: 7, sections: [{ id: 'a0', label: 'Alpha' }, { id: 'a1', label: 'Chapter One' }, { id: 'a2', label: 'Chapter Two' }], createdAt: now, updatedAt: now });
  const B = [{ k: 'h', l: 1, x: 'Omega', s: 'o1' }, { k: 'p', x: 'Difference and repetition, but not the other word.' }];
  await put('content', 'b2', B);
  await put('texts', 'b2', { title: 'Omega', author: 'Zed', hasContent: true, total: B.length, sections: [{ id: 'o1', label: 'Omega' }], createdAt: now, updatedAt: now });
  await put('texts', 'b3', { title: 'Not loaded', author: 'Nobody', hasContent: false, createdAt: now, updatedAt: now });
  const C = [{ k: 'h', l: 1, x: 'Many', s: 'm1' }];
  for (let n = 0; n < 60; n++) C.push({ k: 'p', x: 'Paragraph ' + n + ' mentions différance once.' });
  await put('content', 'b4', C);
  await put('texts', 'b4', { title: 'Many', author: 'Middle', hasContent: true, total: C.length, sections: [{ id: 'm1', label: 'Many' }], createdAt: now, updatedAt: now });
  await put('notes', 'n1', { textId: 'b1', kind: 'passage', passage: 'Derrida writes differance', gloss: 'with an a', page: '12', sectionId: 'a1', at: 3, createdAt: now, updatedAt: now });
  S.content.clear();
})()"""
SNAP = "(async () => JSON.stringify({ t: await idbAll('texts'), n: await idbAll('notes') }))()"

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
        await page.route("https://commons.wikimedia.org/**", lambda r: r.abort())
        await page.goto(URL); await page.wait_for_function(READY)
        await page.evaluate("() => { window.idbAll = (store) => new Promise((ok, no) => { const out = {}; const r = idb.transaction(store).objectStore(store).openCursor(); r.onsuccess = () => { const c = r.result; if (!c) return ok(out); out[c.key] = c.value; c.continue(); }; r.onerror = () => no(r.error); }); }")
        await page.evaluate(SEED)
        await page.reload(); await page.wait_for_function(READY)
        await page.evaluate("() => { window.idbAll = (store) => new Promise((ok, no) => { const out = {}; const r = idb.transaction(store).objectStore(store).openCursor(); r.onsuccess = () => { const c = r.result; if (!c) return ok(out); out[c.key] = c.value; c.continue(); }; r.onerror = () => no(r.error); }); }")
        before = await page.evaluate(SNAP)

        # 1 the entry offers the search, and nothing is searched until asked
        await page.evaluate("openTerm('differance')"); await page.wait_for_timeout(300)
        box = "details.term[data-term-id='differance'] [data-inbooks-box]"
        start = await page.inner_text(box)
        check("Search your books" in start and "your 3 books" in start, f"the entry offers Search your books over the 3 books with their text ({start!r})")
        check(await page.evaluate("S.content.size") == 0, "opening the entry reads no book's text")

        # 2-3 matching and counting
        await page.click(f"{box} [data-inbooks]")
        await page.wait_for_function(f"!document.querySelector(\"{box} [data-inbooks]\")", timeout=20000)
        res = await page.evaluate(f"""() => {{ const box = document.querySelector("{box}");
          return {{ head: box.querySelector('[role=status]').textContent,
            books: [...box.querySelectorAll('.tbook')].map((g) => ({{ title: g.querySelector('.tbh .src').textContent, cnt: g.querySelector('.cnt').textContent,
              rows: [...g.querySelectorAll('.mention')].map((r) => ({{ meta: [...r.querySelectorAll('.mn span')].map((s) => s.textContent), mark: [...r.querySelectorAll('mark')].map((m) => m.textContent), at: +r.dataset.at, find: r.dataset.find }})),
              more: (g.querySelector(':scope details summary') || {{}}).textContent || '', over: (g.querySelector(':scope details .hint') || {{}}).textContent || '' }})) }}; }}""")
        check(res["head"].startswith("64 times in 2 of your 3 books."), f"the summary counts every occurrence across the books that have it ({res['head']!r})")
        titles = [b["title"] for b in res["books"]]
        check(titles == ["Alpha", "Many"], f"books with hits are listed by author, books without none ({titles})")
        alpha = res["books"][0]
        check(alpha["cnt"] == "4 times", f"three in one paragraph count three, plus one elsewhere: 4 ({alpha['cnt']})")
        marks = [m for r in alpha["rows"] for m in r["mark"]]
        check(marks[:3] == ["Différance", "differance", "différances"], f"accents ignored, plurals included, each occurrence its own hit ({marks})")
        allrows = alpha["rows"]
        check(not any("indiff" in m.lower() or m.lower().endswith("ced") for m in marks), "longer words containing the term (indifférance, differanced) don't match")

        # 4 page and chapter from sectionIndex, for the NFD hit too
        idx = await page.evaluate("""(async () => { const B = await idbGet('content', 'b1'), ix = sectionIndex(B); return B.map((b, i) => [ix.pageAt[i], ix.secAt[i]]); })()""")
        labels = {"a0": "Alpha", "a1": "Chapter One", "a2": "Chapter Two"}
        ok_meta = all(r["meta"] == [f"p. {idx[r['at']][0]}", labels[idx[r["at"]][1]]] for r in allrows[:3])
        check(ok_meta and allrows[0]["meta"] == ["p. 12", "Chapter One"], f"each hit shows the page and chapter sectionIndex gives its block ({[r['meta'] for r in allrows[:3]]})")
        nfd = alpha["more"]
        check("1 more from this book" in nfd, f"the fourth hit is folded under the first three ({nfd!r})")
        fourth = await page.evaluate(f"""() => {{ const r = document.querySelectorAll("{box} .tbook")[0].querySelectorAll(':scope details .mention')[0];
          return {{ meta: [...r.querySelectorAll('.mn span')].map((s) => s.textContent), mark: r.querySelector('mark').textContent.normalize('NFC') }}; }}""")
        check(fourth == {"meta": ["p. 13", "Chapter Two"], "mark": "Différance"}, f"a decomposed (NFD) accent matches too, on its own page and chapter ({fourth})")

        # 5 many hits
        many = res["books"][1]
        check(many["cnt"] == "60 times" and len(many["rows"]) == 43 and many["more"] == "40 more of 57 from this book" and many["over"].startswith("17 more not listed"),
              f"a book with many hits lists 43 and says Find steps through the other 17 ({many['cnt']}, {len(many['rows'])}, {many['more']!r}, {many['over']!r})")
        check(await page.evaluate("S.content.size") == 0, "searching keeps no book's text in memory")
        after = await page.evaluate(SNAP)
        check(after == before, "searching stores nothing: books, notes and positions are as they were")

        # 6 open a hit: the reader at that block, the word in Find, your place kept
        nfd_at = await page.evaluate(f"""() => +document.querySelectorAll("{box} .tbook")[0].querySelectorAll(':scope details .mention')[0].dataset.at""")
        await page.evaluate(f"""() => document.querySelectorAll("{box} .tbook")[0].querySelector(':scope details').open = true""")
        await page.click(f"{box} .tbook >> nth=0 >> details .mention >> nth=0")
        await page.wait_for_function("S.screen === 'reader' && R.tid === 'b1' && R.blocks", timeout=20000); await page.wait_for_timeout(800)
        st = await page.evaluate("""(at) => ({ shown: (() => { const el = document.querySelector('#book [data-i="' + at + '"]'); if (!el) return false; const r = el.getBoundingClientRect(); return r.bottom > 0 && r.top < innerHeight && r.right > 0 && r.left < innerWidth; })(), at: currentBlock(), visiting: R.visiting, home: R.home, find: findQ, back: ($('#rtback') || {}).textContent || '' })""", nfd_at)
        check(st["shown"], f"the reader opens with the hit's block on screen (block {nfd_at}; top of screen {st['at']})")
        check(unicodedata.normalize("NFC", st["find"]) == "Différance", f"...with the word ready in Find ({st['find']!r})")
        check(st["visiting"] and st["home"] == 7 and st["back"].startswith("← Your place"), f"...and your place kept as ← Your place ({st})")
        await page.click("#rtback"); await page.wait_for_timeout(500)
        back = await page.evaluate("({ at: currentBlock(), visiting: R.visiting })")
        check(abs(back["at"] - 7) <= 1 and not back["visiting"], f"← Your place goes back to where you were reading ({back})")
        await page.evaluate("back()"); await page.wait_for_timeout(300)
        pos = await page.evaluate("S.texts.get('b1').pos")
        check(pos == 7, f"your saved place is unchanged ({pos})")

        check(not errs, f"no errors in the console ({errs[:3]})")
        await browser.close()

if __name__ == "__main__":
    srv = subprocess.Popen([sys.executable, "-m", "http.server", str(PORT)], stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL, cwd=str(__import__("pathlib").Path(__file__).resolve().parent.parent))
    time.sleep(1)
    try: asyncio.run(main())
    finally: srv.terminate()
    print("all passed" if not failures else f"{len(failures)} failed"); sys.exit(1 if failures else 0)
