"""The printed page: keeping a book's PDF and showing its pages. Run after changes to it:  python3 tests/printed_page.py

Makes its own small PDFs (Chromium's print-to-PDF) and uses PDF.js from tests/.cache, as tests/pdf_import.py does
(run that once first if the cache is empty). Checks that:
  1. adding a PDF offers to keep it (with its size), keeps it in its own store and remembers its pages' labels;
  2. the reader shows the printed page you're on, steps to the next and zooms; Correct the words shows it too;
  3. a backup leaves the PDF out; deleting the book deletes the PDF;
  4. a book added earlier can keep its PDF afterwards; a PDF that doesn't match the book is refused;
     the kept PDF can be removed; replacing the book's file without keeping drops the old PDF; a kept PDF that has been
     damaged says it couldn't be opened and doesn't leave the PDF reader's worker running;
  5. a library stored before this (storage version 6) opens with everything in it and gains the store for PDFs.
Needs: pip install playwright && playwright install chromium
"""
import asyncio, json, re, subprocess, sys, tempfile, time
from pathlib import Path
from playwright.async_api import async_playwright

ROOT = Path(__file__).resolve().parent.parent
PORT = 8805
READY = "typeof idb !== 'undefined' && idb && S.mode === 'ready'"
BODY = ("The question of method returns whenever philosophy examines the conditions under which its concepts become "
        "intelligible. Genealogy uncovers the contingent struggles sedimented in values that present themselves as eternal. ")

def pdfjs_build():
    ver = re.search(r"pdf\.js/([\d.]+)/pdf\.min\.js", (ROOT / "js" / "core.js").read_text()).group(1)
    d = ROOT / "tests" / ".cache" / f"pdfjs-{ver}" / "build"
    if not (d / "pdf.worker.js").exists(): sys.exit("PDF.js isn't in tests/.cache yet: run python3 tests/pdf_import.py once first.")
    return d

def html(pages, word):
    # Leave room for font-metric differences so each declared page fits on one printed page.
    body = "".join(f'<div style="break-after:page"><h1 style="font-size:16pt">{word} {k + 1}</h1><p>{BODY * 3}</p></div>' for k in range(pages))
    return f'<html lang="en"><style>@page {{ size: 5.5in 8.5in; }} body {{ font: 11pt/1.45 Georgia, serif; }}</style>{body}</html>'

failures = []
def check(ok, what):
    print(("ok   " if ok else "FAIL ") + what)
    if not ok: failures.append(what)

async def main():
    tmp = Path(tempfile.mkdtemp())
    (tmp / "index.html").symlink_to(ROOT / "index.html"); (tmp / "data").symlink_to(ROOT / "data"); (tmp / "js").symlink_to(ROOT / "js"); (tmp / "css").symlink_to(ROOT / "css"); (tmp / "lib").symlink_to(pdfjs_build())
    server = subprocess.Popen([sys.executable, "-m", "http.server", str(PORT), "-d", str(tmp)], stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
    try:
        time.sleep(1)
        async with async_playwright() as p:
            browser = await p.chromium.launch()
            maker = await browser.new_page()
            for name, pages, word in (("book", 6, "Part"), ("other", 3, "Other")):
                await maker.set_content(html(pages, word))
                await maker.pdf(path=str(tmp / f"{name}.pdf"), prefer_css_page_size=True, display_header_footer=True, header_template="<span></span>",
                    footer_template='<div style="font-size:9px;width:100%;text-align:center"><span class="pageNumber"></span></div>', margin={"top": "0.8in", "bottom": "0.8in", "left": "0.7in", "right": "0.7in"})
            ctx = await browser.new_context(viewport={"width": 412, "height": 915}, device_scale_factor=2, is_mobile=True, has_touch=True, accept_downloads=True)
            page = await ctx.new_page(); errs = []
            page.on("pageerror", lambda e: errs.append(str(e)))
            await page.goto(f"http://localhost:{PORT}/index.html"); await page.wait_for_function(READY)
            base = f"http://localhost:{PORT}/lib"
            await page.evaluate(f"LIBS.pdf = ['{base}/pdf.js']; LIBS.pdfw = ['{base}/pdf.worker.js']")

            # 1 adding a PDF keeps it
            await page.evaluate("textSheet(null)"); await page.wait_for_selector("#f-file")
            await page.set_input_files("#f-file", str(tmp / "book.pdf")); await page.wait_for_function("!document.querySelector('#f-keepwrap').hidden", timeout=60000)
            lab = await page.inner_text("#f-keeplab")
            check(await page.is_checked("#f-keep") and "KB" in lab or "MB" in lab, f"adding a PDF offers to keep it, with its size ({lab!r})")
            await page.click("button[type=submit]"); await page.wait_for_function("S.screen === 'text'", timeout=30000)
            tid = await page.evaluate("S.textId")
            kept = await page.evaluate(f"(async () => {{ const f = await idbGet('files', '{tid}'); return {{ blob: f instanceof Blob, size: f && f.size, labels: S.texts.get('{tid}').pdfLabels }}; }})()")
            check(kept["blob"] and kept["size"] > 1000 and kept["labels"] == ["1", "2", "3", "4", "5", "6"], f"the PDF is kept in its own store, with its pages' labels ({kept['labels']})")

            # 2 the printed page in the reader
            await page.evaluate("localStorage.setItem('mg-reader', JSON.stringify({ fs: 18, flow: 'pages', turn: 'slide', bars: 'show' }))")
            await page.evaluate(f"go({{ screen: 'reader', textId: '{tid}' }})"); await page.wait_for_selector(".book .bp"); await page.wait_for_timeout(700)
            await page.evaluate("jumpTo(blockForPage('4'), false)"); await page.wait_for_timeout(300)
            await page.evaluate("showNav(true)"); await page.wait_for_timeout(200)
            check(await page.locator("#rnav-pp").is_visible(), "the slider bar offers the printed page for a PDF book")
            await page.click("#rnav-pp"); await page.wait_for_selector("#ppbox canvas", timeout=20000); await page.wait_for_timeout(800)
            pp = await page.evaluate("""() => { const c = document.querySelector('#ppbox canvas'), d = c.getContext('2d').getImageData(0, 0, c.width, c.height).data; let dark = 0;
                for (let k = 0; k < d.length; k += 4 * 50) if (d[k] < 100) dark++; return { w: c.width, h: c.height, cssW: parseFloat(c.style.width), dark, where: document.querySelector('.ppwhere').textContent }; }""")
            check(pp["where"] == "p. 4 · page 4 of 6 in the PDF" and pp["dark"] > 50 and pp["h"] > pp["w"], f"it shows the PDF page you're on, drawn ({pp['where']!r}, {pp['w']}×{pp['h']})")
            await page.click("#pp-next"); await page.wait_for_timeout(800)
            check(await page.inner_text(".ppwhere") == "p. 5 · page 5 of 6 in the PDF", "› shows the next page")
            await page.click("#pp-zoom"); await page.wait_for_timeout(800)
            w2 = await page.evaluate("parseFloat(document.querySelector('#ppbox canvas').style.width)")
            check(abs(w2 - 2 * pp["cssW"]) < 4 and await page.inner_text(".ppwhere") == "p. 5 · page 5 of 6 in the PDF", "Zoom in doubles it, on the same page")
            await page.click("#pclose"); await page.wait_for_timeout(300)
            i4 = await page.evaluate("blockForPage('4') + 1")
            await page.evaluate(f"R.sel = {{ text: 'x', i: {i4}, page: '4', sec: '' }}; editSelectedParagraph()"); await page.wait_for_selector("#ed-pp")
            await page.click("#ed-pp summary"); await page.wait_for_selector("#ed-ppbox canvas", timeout=20000); await page.wait_for_timeout(500)
            check(await page.inner_text("#ed-ppbox .ppwhere") == "p. 4 · page 4 of 6 in the PDF", "Correct the words shows the printed page of the paragraph")
            await page.click("#cancel"); await page.wait_for_timeout(300)

            # 3 backups leave it out; deleting the book deletes it
            await page.evaluate("go({ screen: 'library' })"); await page.wait_for_timeout(300)
            async with page.expect_download() as d:
                await page.evaluate("exportBackup()")
            data = json.load(open(await (await d.value).path(), encoding="utf-8"))
            check("files" not in data and data["texts"][tid]["pdfLabels"] == ["1", "2", "3", "4", "5", "6"], "a backup leaves the PDF out (and keeps the page labels)")
            await page.evaluate(f"deleteText('{tid}')"); await page.wait_for_timeout(300)
            check(await page.evaluate(f"idbGet('files', '{tid}').then((f) => f === undefined)"), "deleting the book deletes its PDF")

            # 4 a book added earlier
            await page.evaluate("textSheet(null)"); await page.wait_for_selector("#f-file")
            await page.set_input_files("#f-file", str(tmp / "book.pdf")); await page.wait_for_function("!document.querySelector('#f-keepwrap').hidden", timeout=60000)
            await page.uncheck("#f-keep"); await page.click("button[type=submit]"); await page.wait_for_function("S.screen === 'text'", timeout=30000)
            old = await page.evaluate("S.textId")
            check(await page.evaluate(f"idbGet('files', '{old}').then((f) => f === undefined)") and not await page.evaluate(f"'pdfLabels' in S.texts.get('{old}')"), "adding a PDF without keeping it keeps nothing")
            await page.evaluate(f"go({{ screen: 'reader', textId: '{old}' }})"); await page.wait_for_selector(".book .bp"); await page.wait_for_timeout(600)
            await page.evaluate("printedPagePanel()"); await page.wait_for_selector("#pp-keep", timeout=10000)
            check("isn't kept" in await page.inner_text("#ppbox"), "a book added earlier says its PDF isn't kept, and offers to keep it")
            await page.click("#pp-keep"); await page.wait_for_selector("#k-file")
            await page.set_input_files("#k-file", str(tmp / "other.pdf")); await page.wait_for_function("/Ready/.test(document.querySelector('#k-prog').textContent)", timeout=60000)
            await page.click("button[type=submit]"); await page.wait_for_timeout(500)
            check("doesn't match" in await page.inner_text("#err"), "a PDF that doesn't match the book (pages and text) is refused")
            await page.set_input_files("#k-file", str(tmp / "book.pdf")); await page.wait_for_function("/Ready: 6 pages/.test(document.querySelector('#k-prog').textContent)", timeout=60000)
            await page.click("button[type=submit]"); await page.wait_for_timeout(800)
            check(await page.evaluate(f"idbGet('files', '{old}').then((f) => f instanceof Blob)") and await page.evaluate(f"S.texts.get('{old}').pdfLabels.length") == 6, "the right PDF is kept")
            await page.evaluate("jumpTo(blockForPage('2'), false)"); await page.wait_for_timeout(300)
            await page.evaluate("printedPagePanel()"); await page.wait_for_selector("#ppbox canvas", timeout=20000); await page.wait_for_timeout(500)
            check(await page.inner_text(".ppwhere") == "p. 2 · page 2 of 6 in the PDF", "and its pages show")
            await page.click("#pclose"); await page.wait_for_timeout(300)
            await page.evaluate(f"go({{ screen: 'text', textId: '{old}' }})"); await page.wait_for_timeout(300)
            await page.evaluate(f"keepPdfSheet('{old}')"); await page.wait_for_selector("#k-drop-pdf")
            await page.click("#k-drop-pdf"); await page.wait_for_timeout(500)
            check(await page.evaluate(f"idbGet('files', '{old}').then((f) => f === undefined)") and not await page.evaluate(f"'pdfLabels' in S.texts.get('{old}')"), "the kept PDF can be removed")
            await page.evaluate(f"keepPdfSheet('{old}')"); await page.wait_for_selector("#k-file")
            await page.set_input_files("#k-file", str(tmp / "book.pdf")); await page.wait_for_function("/Ready: 6 pages/.test(document.querySelector('#k-prog').textContent)", timeout=60000)
            await page.click("button[type=submit]"); await page.wait_for_timeout(800)
            await page.evaluate(f"fileSheet('{old}')"); await page.wait_for_selector("#f-file")
            await page.set_input_files("#f-file", str(tmp / "book.pdf")); await page.wait_for_function("!document.querySelector('#f-keepwrap').hidden", timeout=60000)
            await page.uncheck("#f-keep"); await page.click("button[type=submit]"); await page.wait_for_timeout(800)
            check(await page.evaluate(f"idbGet('files', '{old}').then((f) => f === undefined)") and not await page.evaluate(f"'pdfLabels' in S.texts.get('{old}')"), "replacing the book's file without keeping it drops the old PDF")
            bad = await page.evaluate(f"""async () => {{
              await keepPdf('{old}', new Blob(['%PDF-1.4 damaged'], {{ type: 'application/pdf' }}));
              const W = window.Worker, count = {{ made: 0, ended: 0 }};
              window.Worker = class extends W {{ constructor(...a) {{ super(...a); count.made++; }} terminate() {{ count.ended++; return super.terminate(); }} }};
              const box = document.createElement('div'); document.body.append(box);
              try {{ await printedInto(box, '{old}', 0); }} finally {{ window.Worker = W; }}
              const said = box.textContent; box.remove(); await dropPdf('{old}'); return {{ said, ...count }};
            }}""")
            check("Couldn't open the kept PDF" in bad["said"] and bad["made"] >= 1 and bad["ended"] == bad["made"], f"a damaged kept PDF says so and lets its worker go ({bad})")
            check(not errs, "no script errors" + (f": {errs[:3]}" if errs else ""))
            # 5 a library from before (storage version 6) opens with everything in it, and gains the store for PDFs
            ctx2 = await browser.new_context()
            await ctx2.route(f"http://localhost:{PORT}/blank.html", lambda r: r.fulfill(status=200, content_type="text/html", body="<p>blank</p>"))
            pg2 = await ctx2.new_page(); await pg2.goto(f"http://localhost:{PORT}/blank.html")
            await pg2.evaluate("""() => new Promise((res, rej) => { const r = indexedDB.open('marginalia', 6);
              r.onupgradeneeded = () => { const d = r.result; ['texts', 'notes', 'content', 'covers', 'terms', 'drafts', 'compares'].forEach((n) => d.createObjectStore(n)); };
              r.onsuccess = () => { const d = r.result, t = d.transaction(['texts', 'notes'], 'readwrite');
                t.objectStore('texts').put({ title: 'Kept from before', author: 'A', createdAt: 1, updatedAt: 1, sections: [] }, 'k1');
                t.objectStore('notes').put({ textId: 'k1', kind: 'passage', passage: 'p', createdAt: 1, updatedAt: 1 }, 'n1');
                t.oncomplete = () => { d.close(); res(); }; t.onerror = () => rej(t.error); }; r.onerror = () => rej(r.error); })""")
            await pg2.goto(f"http://localhost:{PORT}/index.html"); await pg2.wait_for_function(READY)
            up = await pg2.evaluate("() => ({ v: idb.version, stores: [...idb.objectStoreNames], text: S.texts.get('k1') && S.texts.get('k1').title, note: S.notes.has('n1') })")
            check(up["v"] == 10 and "files" in up["stores"] and "trash" in up["stores"] and up["text"] == "Kept from before" and up["note"], f"a library from storage version 6 opens with its books and notes, and gains the PDF and Recently deleted stores ({up['stores']})")
            await ctx2.close()
            await browser.close()
    finally:
        server.terminate()

asyncio.run(main())
print(f"\n{len(failures)} failed" if failures else "\nall passed")
sys.exit(1 if failures else 0)
