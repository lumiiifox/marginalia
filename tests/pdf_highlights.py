"""Highlights from a PDF. Run after changes to PDF import or to how highlights come in:  python3 tests/pdf_highlights.py

Makes a small book (Chromium's print-to-PDF), marks it up the way another app would (pypdf adds a Highlight inside a line, a
Highlight running over two lines, an Underline with a comment, and a sticky note that isn't a mark), then checks that:
  1. adding the marked-up PDF says how many highlights it has and offers to add them; adding them makes one passage note each, with
     the book's own words, the right page and chapter, the comment as your note, and each placed exactly in the reader;
  2. the sticky note isn't taken for a highlight;
  3. bringing in the same PDF again from the book's menu adds nothing ("already in your notes"), and a PDF without marks says so;
  4. matching: words broken across lines, ligatures and curly quotes are found, a repeated phrase goes to the nearest place, both
     shapes PDF.js gives quad points in are read, and a mark ending inside a word takes the whole word.
Uses PDF.js from tests/.cache, as tests/pdf_import.py does (run that once first). Needs: pip install playwright pypdf
"""
import asyncio, subprocess, sys, tempfile, time
from pathlib import Path
from playwright.async_api import async_playwright
from pypdf import PdfReader, PdfWriter
from pypdf.generic import ArrayObject, DictionaryObject, FloatObject, NameObject, TextStringObject

ROOT = Path(__file__).resolve().parent.parent
PORT = 8814
READY = "typeof idb !== 'undefined' && idb && S.mode === 'ready'"

def pdfjs_build():
    import re
    ver = re.search(r"pdf\.js/([\d.]+)/pdf\.min\.js", (ROOT / "index.html").read_text()).group(1)
    d = ROOT / "tests" / ".cache" / f"pdfjs-{ver}" / "build"
    if not (d / "pdf.worker.js").exists(): sys.exit("PDF.js isn't in tests/.cache yet: run python3 tests/pdf_import.py once first.")
    return d

SENT = ["Every chapter here begins with a question about method and ends with a question about origins.",
        "The reader is asked to follow the argument slowly, sentence by sentence, without skipping ahead.",
        "Critique examines the conditions under which concepts become possible and the limits they cannot pass.",
        "Genealogy traces the struggles sedimented in values that present themselves as timeless and given.",
        "Difference is thought for itself, not as the negative of an identity assumed in advance."]
def book():
    body = "".join(f'<div style="break-after:page"><h1 style="font-size:16pt">Chapter {k + 1}</h1><p>{" ".join(SENT[(k + j) % 5] for j in range(9))}</p></div>' for k in range(3))
    return f'<html lang="en"><style>@page {{ size: 5.5in 8.5in; }} body {{ font: 11pt/1.5 serif; }} p {{ margin: 0; }}</style>{body}</html>'

failures = []
def check(ok, what):
    print(("ok   " if ok else "FAIL ") + what)
    if not ok: failures.append(what)

ITEMS = """async (url) => { const { pdf, stop } = await pdfOpen(await (await fetch(url)).arrayBuffer()); const out = [];
  for (let p = 1; p <= pdf.numPages; p++) { const pg = await pdf.getPage(p); out.push((await pg.getTextContent()).items.filter((i) => i.str.trim()).map((i) => ({ s: i.str, t: i.transform, w: i.width, h: i.height }))); }
  await pdf.destroy(); stop(); return out; }"""

def span(it, i0, i1):
    """A quad over characters i0..i1 of a text item, inset a little so the app has to round to whole words."""
    e, f, w, h, n = it["t"][4], it["t"][5], it["w"], it["h"] or 11, len(it["s"])
    x0, x1 = e + w * i0 / n + 1.2, e + w * i1 / n - 1.2
    y0, y1 = f - 0.2 * h, f + 0.8 * h
    return [x0, y1, x1, y1, x0, y0, x1, y0]

def words_at(s, a, b):
    """Character range of words a..b (exclusive) of s."""
    import re
    ws = [m.span() for m in re.finditer(r"\S+", s)]
    return ws[a][0], ws[b - 1][1], s[ws[a][0]:ws[b - 1][1]]

def annot(subtype, quads, comment=""):
    xs, ys = [q for quad in quads for q in quad[0::2]] or [60, 80], [q for quad in quads for q in quad[1::2]] or [500, 520]
    d = DictionaryObject({NameObject("/Type"): NameObject("/Annot"), NameObject("/Subtype"): NameObject(subtype),
        NameObject("/Rect"): ArrayObject([FloatObject(min(xs)), FloatObject(min(ys)), FloatObject(max(xs)), FloatObject(max(ys))]),
        NameObject("/C"): ArrayObject([FloatObject(1), FloatObject(0.9), FloatObject(0)])})
    if quads: d[NameObject("/QuadPoints")] = ArrayObject([FloatObject(v) for quad in quads for v in quad])
    if comment: d[NameObject("/Contents")] = TextStringObject(comment)
    return d

async def main():
    tmp = Path(tempfile.mkdtemp())
    (tmp / "index.html").symlink_to(ROOT / "index.html"); (tmp / "data").symlink_to(ROOT / "data"); (tmp / "lib").symlink_to(pdfjs_build())
    server = subprocess.Popen([sys.executable, "-m", "http.server", str(PORT), "-d", str(tmp)], stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
    try:
        time.sleep(1)
        async with async_playwright() as p:
            browser = await p.chromium.launch()
            maker = await browser.new_page(); await maker.set_content(book())
            await maker.pdf(path=str(tmp / "plain.pdf"), prefer_css_page_size=True, display_header_footer=True, header_template="<span></span>",
                footer_template='<div style="font-size:9px;width:100%;text-align:center"><span class="pageNumber"></span></div>', margin={"top": "0.8in", "bottom": "0.8in", "left": "0.7in", "right": "0.7in"})
            ctx = await browser.new_context(viewport={"width": 412, "height": 915}, is_mobile=True, has_touch=True)
            page = await ctx.new_page(); errs = []
            page.on("pageerror", lambda e: errs.append(str(e)))
            await page.goto(f"http://localhost:{PORT}/index.html"); await page.wait_for_function(READY)
            base = f"http://localhost:{PORT}/lib"
            await page.evaluate(f"LIBS.pdf = ['{base}/pdf.js']; LIBS.pdfw = ['{base}/pdf.worker.js']")

            # mark it up: lines long enough to cut into, on each page
            pages = await page.evaluate(ITEMS, "/plain.pdf")
            body = [[it for it in pg if len(it["s"].split()) >= 7] for pg in pages]
            a0, a1, one = words_at(body[0][1]["s"], 1, 5)                       # page 1: four words inside a line
            L, M = body[1][2], body[1][3]                                          # page 2: the last three words of a line, the first three of the next
            nl = len(L["s"].split()); b0, b1, end = words_at(L["s"], nl - 3, nl); c0, c1, start = words_at(M["s"], 0, 3)
            d0, d1, under = words_at(body[2][1]["s"], 0, 4)                        # page 3: an underline, with a comment
            w = PdfWriter(clone_from=PdfReader(str(tmp / "plain.pdf")))
            w.add_annotation(0, annot("/Highlight", [span(body[0][1], a0, a1)]))
            w.add_annotation(1, annot("/Highlight", [span(L, b0, b1), span(M, c0, c1)]))
            w.add_annotation(2, annot("/Underline", [span(body[2][1], d0, d1)], "Compare with chapter 1."))
            w.add_annotation(0, annot("/Text", [], "A sticky note, not a highlight"))
            w.write(str(tmp / "marked.pdf"))
            want = [one, f"{end} {start}", under]

            # 1 adding the PDF
            await page.evaluate("textSheet(null)"); await page.wait_for_selector("#f-file")
            await page.set_input_files("#f-file", str(tmp / "marked.pdf")); await page.wait_for_function("!document.querySelector('#f-keepwrap').hidden", timeout=60000)
            await page.click("button[type=submit]"); await page.wait_for_function("S.screen === 'text'", timeout=30000)
            await page.wait_for_function("!document.querySelector('#toast').hidden", timeout=5000)
            said = await page.inner_text("#toast")
            check(said.startswith("This PDF has 3 highlights.") and "Add as notes" in said, f"adding a marked-up PDF says how many highlights, the sticky note not counted ({said!r})")
            await page.click("#toast .toastbtn"); await page.wait_for_function("S.notes.size === 3", timeout=10000)
            tid = await page.evaluate("S.textId")
            notes = await page.evaluate(f"""(async () => {{ const B = await loadContent('{tid}');
              return notesFor('{tid}').map(([, n]) => ({{ passage: n.passage, gloss: n.gloss, page: n.page, kind: n.kind, sec: (S.texts.get('{tid}').sections.find((x) => x.id === n.sectionId) || {{}}).label || '',
                placed: (() => {{ const A = placeNote(n, B); return !!A && unspace(quoteOf(B, A)) === unspace(n.passage) && A.a === n.anchor.a && A.ao === n.anchor.ao; }})() }})).sort((a, b) => a.page.localeCompare(b.page)); }})()""")
            got = [" ".join(n["passage"].split()) for n in notes]
            check(got == want, f"one passage note each, in the book's own words ({got} / {want})")
            check([n["page"] for n in notes] == ["1", "2", "3"] and [n["sec"] for n in notes] == ["Chapter 1", "Chapter 2", "Chapter 3"], f"each on its page and in its chapter ({[(n['page'], n['sec']) for n in notes]})")
            check([n["gloss"] for n in notes] == ["", "", "Compare with chapter 1."] and all(n["kind"] == "passage" for n in notes), "the underline's comment becomes your note")
            check(all(n["placed"] for n in notes), "each is placed exactly in the reader")
            await page.wait_for_timeout(400)
            check("Added 3 highlights as notes." in await page.inner_text("#toast"), "and says so")

            # 3 again, from the book's menu; and a PDF without marks
            await page.evaluate("moreMenu()"); await page.click("#m-marks"); await page.wait_for_selector("#h-file")
            await page.set_input_files("#h-file", str(tmp / "marked.pdf")); await page.click("button[type=submit]")
            await page.wait_for_function("!document.querySelector('#toast').hidden && /already/.test(document.querySelector('#toast').textContent)", timeout=30000)
            check(await page.inner_text("#toast") == "No new highlights to add. 3 were already in your notes." and await page.evaluate("S.notes.size") == 3, "bringing in the same PDF again adds nothing")
            await page.evaluate("marksSheet(S.textId)"); await page.wait_for_selector("#h-file")
            await page.set_input_files("#h-file", str(tmp / "plain.pdf")); await page.click("button[type=submit]")
            await page.wait_for_function("/no highlights/.test(document.querySelector('#err')?.textContent || '')", timeout=30000)
            check(True, "a PDF without marks says it has none")

            # 4 matching
            r = await page.evaluate("""(() => {
              const B = [{ k: 'pg', x: '1' }, { k: 'p', x: 'The self-development of the concept is what he calls its life.' }, { k: 'p', x: 'A ﬁnal word on “difference” in itself.' },
                { k: 'pg', x: '2' }, { k: 'p', x: 'Repeated phrase here.' }, { k: 'p', x: 'Filler.' }, { k: 'pg', x: '3' }, { k: 'p', x: 'Repeated phrase here.' }];
              const I = bookIndex(B), q = (t, near) => { const A = findMark(I, t, near); return A ? [A.a, quoteOf(B, A)] : null; };
              return [q('self-devel-\\nopment of the', 1), q('the con-\\ncept', 1), q('A final word on "difference"', 2), q('Repeated phrase', 7), q('Repeated phrase', 3), q('nowhere in it', 1),
                quadsOf({ quadPoints: [1, 9, 5, 9, 1, 2, 5, 2] }), quadsOf({ quadPoints: [[{ x: 1, y: 9 }, { x: 5, y: 9 }, { x: 1, y: 2 }, { x: 5, y: 2 }]] }),
                marksOnPage([{ subtype: 'Highlight', quadPoints: [42, 112, 130, 112, 42, 98, 130, 98] }], [{ str: 'philosophy of difference', transform: [10, 0, 0, 10, 10, 100], width: 240, height: 10 }])]; })()""")
            check(r[0] == [1, "self-development of the"] and r[1] == [1, "the concept"], f"a word broken across lines is found ({r[0]}, {r[1]})")
            check(r[2] == [2, "A ﬁnal word on “difference”"], f"ligatures and curly quotes are found ({r[2]})")
            check(r[3][0] == 7 and r[4][0] == 4, f"a repeated phrase goes to the place nearest its page ({r[3]}, {r[4]})")
            check(r[5] is None, "words that aren't in the book aren't placed")
            check(r[6] == [[1, 2, 5, 9]] and r[7] == [[1, 2, 5, 9]], "both shapes of quad points are read")
            check(r[8] == [{"text": "philosophy of", "comment": ""}], f"a mark ending inside a word takes the whole word ({r[8]})")
            check(not errs, "no script errors" + (f": {errs}" if errs else ""))
            await browser.close()
    finally:
        server.terminate()

asyncio.run(main())
print(f"\n{len(failures)} failed" if failures else "\nall passed")
sys.exit(1 if failures else 0)
