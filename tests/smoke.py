"""Smoke test for Marginalia. Run before pushing:  python3 tests/smoke.py

Uses made-up records only (never real books). Checks that:
  1. every screen renders at phone and desktop width without script errors or sideways scrolling;
  2. a book opens in the reader from its Read button;
  3. Save backup -> delete the database -> Restore gives back exactly the same library, and it survives a reload;
  4. a backup made to run script (markup in fields the app draws) is refused, and such records already stored draw as text;
  5. Quiz yourself: ten questions from the glossary (the term blanked out of its definition), from one area when one is
     chosen, and "Who wrote it?" from the thinkers' works with no co-author among the wrong answers; a score at the end.
Needs: pip install playwright && playwright install chromium
"""
import asyncio, json, subprocess, sys, time
from pathlib import Path
from playwright.async_api import async_playwright

ROOT = Path(__file__).resolve().parent.parent
PORT = 8799
URL = f"http://localhost:{PORT}/index.html"
STORES = ["texts", "notes", "content", "drafts", "compares", "terms"]

SEED = """async () => {
  const now = Date.now();
  await put("texts", "t1", { title: "Test Book", author: "Author, Test", sections: [{ id: "s1", label: "Ch. 1" }], bookmarks: [{ at: 1 }], summaries: { s1: "summary" }, source: { name: "test.pdf", kind: "PDF", pages: 12 }, pos: 0, hasContent: true, createdAt: now, updatedAt: now, readAt: now });
  await put("content", "t1", [{ k: "p", x: "First paragraph of the test text." }, { k: "p", x: "Second paragraph." },
    // structure marked in the reader (Edit): a hidden running head, a chapter title over two lines, a title glued to its paragraph
    { k: "pg", x: "2" }, { k: "p", x: "2 TEST BOOK", st: "hide" }, { k: "h", l: 2, x: "Chapter", st: "chapter", s: "s1" }, { k: "h", l: 2, x: "two", stj: true },
    { k: "p", x: "Part A Then the paragraph.", st: "heading", sth: 6 }, { k: "front", x: "A title page", st: "title" },
    { k: "front", x: "Front matter line", size: 1.4, space: 2.5, heading: true }]);
  await put("notes", "n1", { textId: "t1", kind: "passage", passage: "paragraph", gloss: "a gloss #tag", page: "12", links: [], at: 0, createdAt: now, updatedAt: now });
  await put("drafts", "d1", { title: "Draft", items: [{ t: "h", x: "Heading" }, { t: "note", id: "n1" }], createdAt: now, updatedAt: now });
  await put("compares", "c1", { title: "Comparison", q: "Question?", verdict: "Conclusion", cols: [{ id: "a", label: "A" }], rows: [{ id: "r1", q: "row" }], cells: { "r1:a": { x: "cell", notes: ["n1"] } }, createdAt: now, updatedAt: now });
  await put("terms", "g1", { t: "Test term", d: "a definition", createdAt: now, updatedAt: now });
}"""
DUMP = "async (st) => { const o = {}; for (const s of st) o[s] = Object.fromEntries(await idbAll(s)); return o; }"
READY = "typeof idb !== 'undefined' && idb"
SCREENS = [("library", {}), ("text", {"textId": "t1"}), ("glossary", {}), ("branches", {}), ("tag", {"tag": "tag"}),
           ("questions", {}), ("drafts", {}), ("draft", {"draftId": "d1"}), ("concord", {}), ("compares", {}), ("compare", {"cmpId": "c1"})]

failures = []
def check(ok, what):
    print(("ok   " if ok else "FAIL ") + what)
    if not ok: failures.append(what)

async def fresh_page(browser, w, h):
    page = await browser.new_page(viewport={"width": w, "height": h}, accept_downloads=True)
    errs = []
    page.on("pageerror", lambda e: errs.append(str(e)))
    # Fonts and libraries fail to load without network; only script errors from the app count.
    page.on("console", lambda m: m.type == "error" and "Failed to load resource" not in m.text and errs.append(m.text))
    await page.goto(URL); await page.wait_for_function(READY)
    await page.evaluate(SEED)
    return page, errs

async def main():
    async with async_playwright() as p:
        browser = await p.chromium.launch()
        for w, h in [(390, 844), (1280, 800)]:
            page, errs = await fresh_page(browser, w, h)
            for name, extra in SCREENS:
                n = len(errs)
                r = await page.evaluate("""([s, x]) => { try { Object.assign(S, x, { screen: s }); render();
                    return { ok: true, hs: document.documentElement.scrollWidth > innerWidth }; } catch (e) { return { ok: false, err: String(e) }; } }""", [name, extra])
                check(r["ok"] and not r["hs"] and len(errs) == n, f"{w}px {name}" + ("" if r["ok"] else f": {r['err']}") + (" (scrolls sideways)" if r.get("hs") else "") + (f" {errs[n:]}" if len(errs) > n else ""))
            await page.evaluate("S.screen = 'text'; S.textId = 't1'; render()")
            await page.click("#read"); await page.wait_for_timeout(500)
            check("First paragraph" in await page.inner_text("#reader") and not errs, f"{w}px reader opens the book")
            await page.close()

        page, errs = await fresh_page(browser, 390, 844)
        before = await page.evaluate(DUMP, STORES)
        async with page.expect_download() as dl: await page.evaluate("exportBackup()")
        backup = await (await dl.value).path()
        await page.evaluate("new Promise((r) => { idb.close(); const q = indexedDB.deleteDatabase('marginalia'); q.onsuccess = q.onerror = q.onblocked = () => r(); })")
        await page.reload(); await page.wait_for_function(READY)
        empty = await page.evaluate(DUMP, STORES)
        check(all(not v for v in empty.values()), "database wiped before restore")
        await page.evaluate("(txt) => importBackup(new File([txt], 'backup.json'))", Path(backup).read_text())
        await page.click("#rs-merge"); await page.wait_for_timeout(500)
        check(await page.evaluate(DUMP, STORES) == before, "restore gives back the same library")
        await page.reload(); await page.wait_for_function(READY)
        check(await page.evaluate(DUMP, STORES) == before, "restored library survives a reload")
        check(not errs, "no script errors during backup and restore" + (f": {errs}" if errs else ""))

        # 4 markup in a crafted backup
        bad = {"app": "marginalia", "version": 5, "texts": {"x1": {"title": "X", "source": {"name": "a.pdf", "pages": "<img src=x onerror=\"window.__xss=1\">"}}},
               "content": {"x1": [{"k": "p", "x": "Words here.", "st": "hide", "sth": "\"><img src=x onerror=\"window.__xss=1\">"}]}}
        plan = await page.evaluate("(d) => { const p = planRestore(d); return [p.skipped, p.rows.texts.length, p.content.length]; }", bad)
        check(plan == [2, 0, 0], f"a backup with markup where a number belongs is refused ({plan})")
        await page.evaluate("""async () => {
          await put('content', 'x1', [{ k: 'pg', x: '1' }, { k: 'p', x: 'Head words and the paragraph go on.', st: 'hide', sth: '"><img src=x onerror="window.__xss=1">' }, { k: 'p', x: 'More.' }]);
          await put('texts', 'x1', { title: 'X', hasContent: true, total: 3, pos: 0, createdAt: 1, updatedAt: 1, source: { name: 'a.pdf', pages: '<img src=x onerror="window.__xss=1">' } });
        }""")
        await page.evaluate("go({ screen: 'text', textId: 'x1' })"); await page.wait_for_timeout(300)
        await page.evaluate("go({ screen: 'reader', textId: 'x1' })"); await page.wait_for_timeout(600)
        check(not await page.evaluate("!!window.__xss") and not await page.evaluate("!!document.querySelector('#reader img, .srcline img')"), "markup already stored in those fields is drawn as text")

        # 5 the quiz
        page, errs = await fresh_page(browser, 390, 844)
        await page.evaluate("go({ screen: 'glossary' })"); await page.wait_for_timeout(200)
        await page.click("#quiz"); await page.wait_for_selector(".qz-opt")
        for k in range(10):
            await page.click(".qz-opt >> nth=0"); await page.wait_for_selector("[data-qznext]")
            if k == 0: check(await page.locator(".qz-opt.right").count() == 1, "an answer shows which option was right")
            await page.click("[data-qznext]"); await page.wait_for_timeout(50)
        txt = await page.inner_text("#quizbox")
        check(" of 10" in txt and "right" in txt and "Another ten" in txt, f"ten questions end in a score ({txt.splitlines()[3:4]})")
        leaks = await page.evaluate("""() => { quizStart('def', 'all'); let bad = []; for (let r = 0; r < 20; r++) { quizStart('def', 'all');
            for (const q of QZ.qs) { const t = q.g.t.replace(/\\s*\\(.*?\\)\\s*/g, ' ').trim(); if (t.length > 4 && q.prompt.toLowerCase().includes(t.toLowerCase())) bad.push(t); } } return bad; }""")
        check(not leaks, f"a definition never names its own term ({leaks[:3]})")
        area = await page.evaluate("() => { quizStart('def', 'ethics'); return [...new Set(QZ.qs.map((q) => q.g.a))]; }")
        check(area == ["ethics"], f"a quiz from one area asks only about its terms ({area})")
        work = await page.evaluate("""() => { const bad = []; for (let r = 0; r < 40; r++) { quizStart('work', 'all'); for (const q of QZ.qs) {
            if (q.opts.length !== 4 || !q.opts[q.answer]) bad.push('shape'); if (/^Plato,|^Aristotle,/.test(q.prompt.replace(/<[^>]+>/g, '').replace('Who wrote ', ''))) bad.push(q.prompt);
            const wrong = q.opts.filter((_, i) => i !== q.answer);
            for (const o of wrong) { const x = THINKERS.find((p) => esc(p.n) === o); const t = q.prompt.replace(/<[^>]+>/g, '').replace(/^Who wrote /, '').replace(/ \\(\\d+\\)\\?$|\\?$/, '').toLowerCase();
              if (x && x.w.some((w) => w.replace(/\\s*\\(.*$/, '').trim().toLowerCase() === t)) bad.push(o + ' also wrote ' + t); } } } return bad; }""")
        check(not work, f"Who wrote it? has one right answer and no co-author among the others ({work[:3]})")
        await page.evaluate("go({ screen: 'library' })"); await page.wait_for_timeout(200)
        await page.click("#pclose") if await page.locator("#pclose").count() else None
        await page.click("#quiz"); await page.wait_for_selector(".qz-opt")
        check(await page.locator(".qz-opt").count() == 4, "the glossary section of the home screen opens the quiz too")
        check(not errs, "no script errors in the quiz" + (f": {errs}" if errs else ""))
        await browser.close()

server = subprocess.Popen([sys.executable, "-m", "http.server", str(PORT), "-d", str(ROOT)], stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
try:
    time.sleep(1); asyncio.run(main())
finally:
    server.terminate()
print(f"\n{len(failures)} failed" if failures else "\nall passed")
sys.exit(1 if failures else 0)
