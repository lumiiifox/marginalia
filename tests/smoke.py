"""Smoke test for Marginalia. Run before pushing:  python3 tests/smoke.py

Uses made-up records only (never real books). Checks that:
  1. every screen renders at phone and desktop width without script errors or sideways scrolling;
  2. a book opens in the reader from its Read button;
  3. Save backup -> delete the database -> Restore gives back exactly the same library, and it survives a reload;
  4. a backup made to run script (markup in fields the app draws) is refused, and such records already stored draw as text.
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
        await browser.close()

server = subprocess.Popen([sys.executable, "-m", "http.server", str(PORT), "-d", str(ROOT)], stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
try:
    time.sleep(1); asyncio.run(main())
finally:
    server.terminate()
print(f"\n{len(failures)} failed" if failures else "\nall passed")
sys.exit(1 if failures else 0)
