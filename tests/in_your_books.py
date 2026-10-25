"""In your books: where a glossary term occurs in the texts of your library. Run after changes to it, to findNeedles or termNeedles,
or to sectionIndex:  python3 tests/in_your_books.py

Made-up books only, phone-sized touch screen. Checks that:
  1. a glossary entry offers Search your books, counting only books with their text loaded, and searches nothing until asked;
  2. matching is by whole words, accents ignored in either Unicode form (NFC and NFD), plurals included, longer words left out;
  3. every occurrence counts: three in one paragraph count three;
  4. each hit shows the printed page and the chapter that sectionIndex gives for its block, and its sentence with the word marked;
  5. a book with many hits lists the first INBOOK_SHOWN + INBOOK_LISTED and says how many more Find will step through;
  6. tapping a hit opens the reader at that block with the word in Find, keeping your place as ← Your place, and Back returns to it;
  7. searching stores nothing: books, notes and positions are unchanged, and no book's text is kept in memory by it;
  8. passages you linked to the term yourself are listed as Your link, even without its name, and a name inside one counts once;
  9. a name split by a printed-page break (a paragraph continued on the next page) is found, at the page it starts on;
 10. a book whose text can't be read is reported apart, and the summary counts only the books searched;
 11. closing the entry stops the search and leaves the button ready again.
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
  await put('texts', 'b1', { title: 'Alpha', author: 'Aardvark', hasContent: true, total: A.length, pos: 7, termMarks: [{ id: 'differance', at: 3, passage: 'Derrida writes differance', createdAt: now }], sections: [{ id: 'a0', label: 'Alpha' }, { id: 'a1', label: 'Chapter One' }, { id: 'a2', label: 'Chapter Two' }], createdAt: now, updatedAt: now });
  const B = [{ k: 'h', l: 1, x: 'Omega', s: 'o1' }, { k: 'p', x: 'Difference and repetition, but not the other word.' }];
  await put('content', 'b2', B);
  await put('texts', 'b2', { title: 'Omega', author: 'Zed', hasContent: true, termMarks: [{ id: 'differance', at: 1, passage: 'Difference and repetition', createdAt: now }], total: B.length, sections: [{ id: 'o1', label: 'Omega' }], createdAt: now, updatedAt: now });
  await put('texts', 'b3', { title: 'Not loaded', author: 'Nobody', hasContent: false, createdAt: now, updatedAt: now });
  const C = [{ k: 'h', l: 1, x: 'Many', s: 'm1' }];
  for (let n = 0; n < 60; n++) C.push({ k: 'p', x: 'Paragraph ' + n + ' mentions différance once.' });
  await put('content', 'b4', C);
  await put('texts', 'b4', { title: 'Many', author: 'Middle', hasContent: true, total: C.length, sections: [{ id: 'm1', label: 'Many' }], createdAt: now, updatedAt: now });
  await put('texts', 'b5', { title: 'Lost text', author: 'Kappa', hasContent: true, sections: [], createdAt: now, updatedAt: now });
  const D = [{ k: 'h', l: 1, x: 'Breaks', s: 'k1' }, { k: 'pg', x: '20' }, { k: 'p', x: 'He calls it the expression of the will' }, { k: 'pg', x: '21' }, { k: 'c', x: 'to power, and comes back to it later.' }];
  await put('content', 'b6', D);
  await put('texts', 'b6', { title: 'Breaks', author: 'Beta', hasContent: true, total: D.length, sections: [{ id: 'k1', label: 'Breaks' }], createdAt: now, updatedAt: now });
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
        check("Search your books" in start and "your 5 books" in start, f"the entry offers Search your books over the 5 books with their text ({start!r})")
        check(await page.evaluate("S.content.size") == 0, "opening the entry reads no book's text")

        # 2-3 matching and counting
        await page.click(f"{box} [data-inbooks]")
        await page.wait_for_function(f"!document.querySelector(\"{box} [data-inbooks]\")", timeout=20000)
        res = await page.evaluate(f"""() => {{ const box = document.querySelector("{box}");
          return {{ head: box.querySelector('[role=status]').textContent,
            books: [...box.querySelectorAll('.tbook')].map((g) => ({{ title: g.querySelector('.tbh .src').textContent, cnt: g.querySelector('.cnt').textContent,
              rows: [...g.querySelectorAll('.mention')].map((r) => ({{ meta: [...r.querySelectorAll('.mn span')].map((s) => s.textContent), mark: [...r.querySelectorAll('mark')].map((m) => m.textContent), at: +r.dataset.at, find: r.dataset.find }})),
              more: (g.querySelector(':scope details summary') || {{}}).textContent || '', over: (g.querySelector(':scope details .hint') || {{}}).textContent || '' }})) }}; }}""")
        check(res["head"] == "65 times in 3 of the 4 books that could be read. 1 book couldn't be read, so it wasn't searched.", f"the summary counts every occurrence, and only the books searched ({res['head']!r})")
        titles = [b["title"] for b in res["books"]]
        check(titles == ["Alpha", "Many", "Omega"], f"books with hits or your links are listed by author, books without neither ({titles})")
        alpha = res["books"][0]
        check(alpha["cnt"] == "4 times, 1 your link", f"three in one paragraph count three, one of them inside your link counting once as it, plus one elsewhere: 4 ({alpha['cnt']})")
        marks = [m for r in alpha["rows"] for m in r["mark"]]
        check(marks[:3] == ["Différance", "Derrida writes differance", "différances"] and alpha["rows"][1]["meta"][0] == "Your link" and not alpha["rows"][1]["find"],
              f"accents ignored, plurals included, each occurrence its own hit, the name inside your link shown as Your link ({marks})")
        allrows = alpha["rows"]
        check(not any("indiff" in m.lower() or m.lower().endswith("ced") for m in marks), "longer words containing the term (indifférance, differanced) don't match")

        # 4 page and chapter from sectionIndex, for the NFD hit too
        idx = await page.evaluate("""(async () => { const B = await idbGet('content', 'b1'), ix = sectionIndex(B); return B.map((b, i) => [ix.pageAt[i], ix.secAt[i]]); })()""")
        labels = {"a0": "Alpha", "a1": "Chapter One", "a2": "Chapter Two"}
        ok_meta = all([m for m in r["meta"] if m != "Your link"] == [f"p. {idx[r['at']][0]}", labels[idx[r["at"]][1]]] for r in allrows[:3])
        check(ok_meta and allrows[0]["meta"] == ["p. 12", "Chapter One"], f"each hit shows the page and chapter sectionIndex gives its block ({[r['meta'] for r in allrows[:3]]})")
        nfd = alpha["more"]
        check("1 more from this book" in nfd, f"the fourth hit is folded under the first three ({nfd!r})")
        fourth = await page.evaluate(f"""() => {{ const r = document.querySelectorAll("{box} .tbook")[0].querySelectorAll(':scope details .mention')[0];
          return {{ meta: [...r.querySelectorAll('.mn span')].map((s) => s.textContent), mark: r.querySelector('mark').textContent.normalize('NFC') }}; }}""")
        check(fourth == {"meta": ["p. 13", "Chapter Two"], "mark": "Différance"}, f"a decomposed (NFD) accent matches too, on its own page and chapter ({fourth})")

        # 5 many hits
        many = res["books"][1]
        omega = res["books"][2]
        check(omega["cnt"] == "1 time, 1 your link" and omega["rows"][0]["meta"][0] == "Your link" and omega["rows"][0]["mark"] == ["Difference and repetition"],
              f"a passage you linked to the term is listed even without its name ({omega['cnt']}, {omega['rows']})")
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
        fh = await page.evaluate("findHits(findQ).length")
        check(fh == 6, f"...and Find steps through it (its 4 whole-word places, plus the 2 longer words, since Find matches parts of words) ({fh})")
        check(st["visiting"] and st["home"] == 7 and st["back"].startswith("← Your place"), f"...and your place kept as ← Your place ({st})")
        await page.click("#rtback"); await page.wait_for_timeout(500)
        back = await page.evaluate("({ at: currentBlock(), visiting: R.visiting })")
        check(abs(back["at"] - 7) <= 1 and not back["visiting"], f"← Your place goes back to where you were reading ({back})")
        await page.evaluate("back()"); await page.wait_for_timeout(300)
        pos = await page.evaluate("S.texts.get('b1').pos")
        check(pos == 7, f"your saved place is unchanged ({pos})")

        # 9 a name split by a printed-page break
        await page.evaluate("S.gOpen = new Set(); go({ screen: 'glossary' })"); await page.wait_for_timeout(300)
        await page.evaluate("openTerm('will-to-power')"); await page.wait_for_timeout(300)
        wbox = "details.term[data-term-id='will-to-power'] [data-inbooks-box]"
        await page.click(f"{wbox} [data-inbooks]")
        await page.wait_for_function(f"!document.querySelector(\"{wbox} [data-inbooks]\")", timeout=20000)
        brk = await page.evaluate(f"""() => [...document.querySelectorAll("{wbox} .tbook")].map((g) => ({{ title: g.querySelector('.tbh .src').textContent, cnt: g.querySelector('.cnt').textContent,
          rows: [...g.querySelectorAll('.mention')].map((r) => ({{ meta: [...r.querySelectorAll('.mn span')].map((s) => s.textContent), mark: r.querySelector('mark').textContent, at: +r.dataset.at }})) }}))""")
        check(brk == [{"title": "Breaks", "cnt": "1 time", "rows": [{"meta": ["p. 20", "Breaks"], "mark": "will to power", "at": 2}]}],
              f"a name split by a printed-page break is found, at the page and block it starts in ({brk})")

        # 11 closing the entry stops the search
        await page.evaluate("S.gOpen = new Set(); go({ screen: 'glossary' })"); await page.wait_for_timeout(300)
        await page.evaluate("openTerm('differance')"); await page.wait_for_timeout(300)
        await page.evaluate(f"""() => {{ document.querySelector("{box} [data-inbooks]").click(); document.querySelector("details.term[data-term-id='differance']").open = false; }}""")
        await page.wait_for_timeout(1500)
        stopped = await page.evaluate(f"""() => {{ const b = document.querySelector("{box} [data-inbooks]"); return {{ ready: !!b && !b.disabled && b.textContent === 'Search your books', results: !!document.querySelector("{box} .tbook") }}; }}""")
        check(stopped == {"ready": True, "results": False}, f"closing the entry stops the search and leaves the button ready ({stopped})")

        check(not errs, f"no errors in the console ({errs[:3]})")
        await browser.close()

if __name__ == "__main__":
    srv = subprocess.Popen([sys.executable, "-m", "http.server", str(PORT)], stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL, cwd=str(__import__("pathlib").Path(__file__).resolve().parent.parent))
    time.sleep(1)
    try: asyncio.run(main())
    finally: srv.terminate()
    print("all passed" if not failures else f"{len(failures)} failed"); sys.exit(1 if failures else 0)
