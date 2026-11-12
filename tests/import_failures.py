"""Imports that go wrong:  python3 tests/import_failures.py

Through the Add a text sheet, as you'd use it. Checks that:
  1. a damaged, cut-off, empty or mislabelled file (a PDF that isn't one, random bytes named .txt, an unknown type) says so in plain
     words and saves nothing;
  2. a save that fails partway (a write refused, as a full disk refuses one) leaves nothing behind, for a new book and for a
     replaced text, where the old version stays whole;
  3. closing the app in the middle of saving leaves either the whole book or none of it, never a text without its book;
  4. the same file imported again is pointed out when it is read and on Save, and a second Save adds the copy; a different file
     with as many paragraphs isn't taken for it, and a copy whose headings you've marked still is;
  5. where cdnjs can be reached (GitHub's runners), a damaged EPUB or Word file says so too.
"""
import asyncio, os, subprocess, sys, time
from pathlib import Path
from playwright.async_api import async_playwright

ROOT = Path(__file__).resolve().parent.parent
PORT = int(os.environ.get("MG_PORT", 8843))
URL = f"http://localhost:{PORT}/index.html"
READY = "typeof idb !== 'undefined' && idb && S.mode === 'ready'"
failures = []
PDFJS = None


def check(ok, msg):
    print(("ok   " if ok else "FAIL ") + msg)
    if not ok: failures.append(msg)


# what is stored, by store: the keys, so a part of a book left behind shows
STORED = """async () => { const out = {};
  for (const st of ['texts', 'content', 'covers', 'files']) out[st] = await new Promise((res) => { const r = idb.transaction(st).objectStore(st).getAllKeys(); r.onsuccess = () => res(r.result.map(String).sort()); });
  return out; }"""
# a book's parts without its book: what an interrupted save must never leave
ORPHANS = """async () => { const k = await (""" + STORED + """)(); const books = new Set(k.texts);
  return ['content', 'covers', 'files'].flatMap((st) => k[st].filter((id) => !books.has(id)).map((id) => st + ':' + id)); }"""


# the next write to the books' records refused, as a full disk refuses one; undone by RESTORE
REFUSE = "void (window.__put = IDBObjectStore.prototype.put, IDBObjectStore.prototype.put = function (v, k) { if (this.name === 'texts') throw new DOMException('The disk is full.', 'QuotaExceededError'); return window.__put.call(this, v, k); })"
CLOSE = "document.querySelector('#sheetroot').innerHTML = ''; NAV.overlay = false"  # shut the sheet without stepping back through history


def para(n, word):
    return "\n\n".join(f"Paragraph {i} of the {word} text, long enough to be read as prose and kept as a paragraph of its own." for i in range(n))


async def choose(page, name, data, mime="text/plain"):
    """Open Add a text and choose a file; returns the progress line once reading is done."""
    await page.evaluate(CLOSE + "; textSheet(null)")
    await page.wait_for_selector("#f-file", state="attached")
    await page.set_input_files("#f-file", files=[{"name": name, "mimeType": mime, "buffer": data}])
    await page.wait_for_function("(() => { const p = document.querySelector('#f-prog'); return p && !/Reading|Loading|Opening|Saving/.test(p.textContent) && p.textContent.length > 0; })()", timeout=30000)
    await page.wait_for_timeout(300)  # the duplicate check finishes after the summary
    return await page.evaluate("[document.querySelector('#f-prog').textContent, document.querySelector('#f-prog').classList.contains('bad')]")


async def reopen(page):
    """Close the app and open it again. A reload can be cut off by the step back the sheet takes as it closes (history.back), which
    happens on its own schedule; then the app is simply opened again."""
    for _ in range(3):
        try:
            await page.reload(); break
        except Exception as e:
            if "ERR_ABORTED" not in str(e): raise
            await page.wait_for_timeout(200)
    else:
        await page.goto(URL)
    await page.wait_for_function(READY)


async def save(page):
    await page.click("#sheetroot button[type=submit]")
    await page.wait_for_function("!document.querySelector('#sheetroot form[data-busy]')", timeout=30000)
    await page.wait_for_timeout(300)
    return await page.evaluate("document.querySelector('#sheetroot #err')?.textContent || ''")


async def route(r):
    u = r.request.url
    if "/lib/" in u and "localhost" in u:
        return await r.fulfill(status=200, content_type="text/javascript", body=(PDFJS / u.split("/lib/")[1]).read_bytes())
    if "localhost" in u or (LIVE and "cdnjs.cloudflare.com" in u): return await r.continue_()
    return await r.abort()

LIVE = bool(os.environ.get("CI"))  # GitHub's runners reach cdnjs; elsewhere it may not be reachable


async def main():
    async with async_playwright() as p:
        browser = await p.chromium.launch()
        ctx = await browser.new_context(bypass_csp=True, viewport={"width": 390, "height": 844})
        await ctx.route("**/*", route)
        page = await ctx.new_page(); errs = []
        page.on("pageerror", lambda e: errs.append(str(e)))
        await page.goto(URL); await page.wait_for_function(READY)
        await page.evaluate("LIBS.pdf = [location.origin + '/lib/pdf.js']; LIBS.pdfw = [location.origin + '/lib/pdf.worker.js']")
        maker = await browser.new_page(); await maker.set_content("<h1>Chapter One</h1><p>" + "The question of method returns. " * 120 + "</p>")
        good_pdf = await maker.pdf(); await maker.close()
        before = await page.evaluate(STORED)

        # 1 damaged and mislabelled files
        cases = [("damaged.pdf", os.urandom(5000), "application/pdf", "damaged or incomplete"),
                 ("cut-off.pdf", good_pdf[: len(good_pdf) // 3], "application/pdf", "damaged or incomplete"),
                 ("web-page.pdf", b"<html><body>Not a PDF at all</body></html>", "application/pdf", "damaged or incomplete"),
                 ("empty.pdf", b"", "application/pdf", "empty"),
                 ("image.txt", os.urandom(6000), "text/plain", "doesn't contain readable text"),
                 ("empty.txt", b"", "text/plain", "No readable text"),
                 ("song.mp3", b"ID3" + os.urandom(3000), "audio/mpeg", "isn't supported")]
        for name, data, mime, says in cases:
            msg, bad = await choose(page, name, data, mime)
            out = await save(page)
            check(bad and says in msg and not msg.startswith("Couldn't read this file (") and await page.evaluate(STORED) == before,
                  f"{name}: says so in plain words, and nothing is saved ({msg!r}; on Save: {out!r})")
        await page.evaluate(CLOSE)

        # 2 a write refused partway: nothing of the new book is left
        text = para(30, "first").encode()
        await choose(page, "Refused.txt", text)
        await page.evaluate(REFUSE)
        out = await save(page)
        await page.evaluate("void (IDBObjectStore.prototype.put = window.__put)")
        check(out != "" and await page.evaluate(STORED) == before and await page.evaluate("S.texts.size") == len(before["texts"]),
              f"a save refused at its last write leaves no text, cover or PDF behind, and says why ({out!r})")
        await page.evaluate(CLOSE)

        # 4 the same file again (the first copy goes in normally)
        await choose(page, "Ethics notes.txt", text)
        await save(page)
        first = await page.evaluate("[...S.texts.keys()].filter((id) => S.texts.get(id).title === 'Ethics notes')")
        check(len(first) == 1, f"a file is added ({first})")
        msg, _ = await choose(page, "Ethics notes.txt", text)
        check("already have this file" in msg and "Ethics notes" in msg, f"read a second time, it says you already have it, and as what ({msg!r})")
        out = await save(page)
        n = await page.evaluate("[...S.texts.values()].filter((t) => t.title === 'Ethics notes').length")
        check("already have this file" in out and n == 1, f"Save says so once and adds nothing yet ({out!r}, {n})")
        out = await save(page)
        n = await page.evaluate("[...S.texts.values()].filter((t) => t.title === 'Ethics notes').length")
        check(out == "" and n == 2, f"Save again adds the second copy ({n})")
        msg, _ = await choose(page, "Other notes.txt", para(30, "second").encode())
        check("already have" not in msg, f"a different file with as many paragraphs isn't taken for it ({msg!r})")
        await page.evaluate(f"(async () => {{ const c = await loadContent('{first[0]}'); await put('content', '{first[0]}', c.map((b, i) => i === 2 ? {{ ...b, st: 'heading' }} : b)); }})()")
        await page.evaluate("[...S.texts.keys()].filter((id) => S.texts.get(id).title === 'Ethics notes').slice(1).forEach((id) => deleteText(id))")
        await page.wait_for_timeout(300)
        msg, _ = await choose(page, "Ethics notes.txt", text)
        check("already have this file" in msg, f"a copy whose headings you've marked is still recognised ({msg!r})")
        await page.evaluate(CLOSE); await page.wait_for_timeout(200)

        # 2b replacing a book's text, refused partway: the old version stays whole
        tid = first[0]
        old = await page.evaluate(f"(async () => [JSON.stringify(await idbGet('content', '{tid}')), JSON.stringify(await idbGet('texts', '{tid}'))])()")
        await page.evaluate(f"fileSheet('{tid}')"); await page.wait_for_selector("#f-file", state="attached")
        await page.set_input_files("#f-file", files=[{"name": "new.txt", "mimeType": "text/plain", "buffer": para(12, "replacement").encode()}])
        await page.wait_for_function("(() => { const p = document.querySelector('#f-prog'); return p && !/Reading/.test(p.textContent) && p.textContent.length > 0; })()")
        await page.evaluate(REFUSE)
        out = await save(page)
        await page.evaluate("void (IDBObjectStore.prototype.put = window.__put)")
        now = await page.evaluate(f"(async () => [JSON.stringify(await idbGet('content', '{tid}')), JSON.stringify(await idbGet('texts', '{tid}'))])()")
        check(out != "" and now == old, f"a replaced text refused partway leaves the old text and its record as they were ({out!r})")
        await page.evaluate(CLOSE); await page.wait_for_timeout(200)

        # 3 the app closed in the middle of saving: the whole book or none of it
        outcomes = []
        for delay in [0, 15, 40, 80, 160, 400]:
            await choose(page, f"Closed {delay}.txt", para(4000, f"long {delay}").encode())  # each its own text, so none is a repeat
            await page.click("#sheetroot button[type=submit]")
            await page.wait_for_timeout(delay)
            await reopen(page)
            orphans = await page.evaluate(ORPHANS)
            whole = await page.evaluate(f"""(async () => {{ const t = [...S.texts.values()].find((x) => x.title === 'Closed {delay}'); if (!t) return 'none';
              const id = [...S.texts.keys()].find((k) => S.texts.get(k) === t); const c = await idbGet('content', id); return c && c.length === t.total ? 'whole' : 'broken'; }})()""")
            outcomes.append((delay, whole, orphans))
            await page.evaluate("LIBS.pdf = [location.origin + '/lib/pdf.js']; LIBS.pdfw = [location.origin + '/lib/pdf.worker.js']")
        check(all(w in ("whole", "none") and not o for _, w, o in outcomes),
              f"closed mid-save, the library holds the whole book or none of it, and no text without its book ({outcomes})")

        # 5 damaged EPUB and Word files, with the real libraries
        if LIVE:
            for name, says in [("damaged.epub", "EPUB is damaged"), ("damaged.docx", "Word file is damaged")]:
                msg, bad = await choose(page, name, os.urandom(4000), "application/octet-stream")
                check(bad and says in msg, f"{name}: says so in plain words ({msg!r})")
            await page.evaluate(CLOSE)
        else:
            print("skip damaged EPUB and Word files: cdnjs is only reached on GitHub's runners")

        check(not errs, f"no script errors ({errs[:3]})")
        await browser.close()


if __name__ == "__main__":
    sys.path.insert(0, str(Path(__file__).parent))
    d = sorted((ROOT / "tests" / ".cache").glob("pdfjs-*/build"))
    if not d:
        import pdf_import; d = [pdf_import.pdfjs_dir()]
    PDFJS = d[-1]
    server = subprocess.Popen([sys.executable, "-m", "http.server", str(PORT), "-d", str(ROOT)], stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
    try:
        time.sleep(1); asyncio.run(main())
    finally:
        server.terminate()
    print("\nall passed" if not failures else f"\n{len(failures)} failed")
    sys.exit(1 if failures else 0)
