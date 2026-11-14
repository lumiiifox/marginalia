"""A PDF set like a printed philosophy book:  python3 tests/pdf_book.py

Made-up pages in a book's shape (running heads, page numbers at the foot, roman-numbered front matter, footnotes), printed
by Chromium and read by the app's own parseFile. Checks that:
  1. hyphenated compounds broken at a line's end keep their hyphen (self-/understanding, Being-in-the-/world, 1670-/1677),
     a suspended hyphen keeps its space ("pre- and post-war"), and an ordinary word broken over a line is joined;
  2. a footnote that recurs word for word ("Ibid., 30.") stays a footnote, never taken for a running foot;
  3. a page between roman-numbered pages gets its roman number, and its running head leaves the text;
  4. a book of long paragraphs is rebuilt quickly (the line joining once cost the square of a paragraph's length).
"""
import os, asyncio, subprocess, sys, tempfile, time
from pathlib import Path
from playwright.async_api import async_playwright

ROOT = Path(__file__).resolve().parent.parent
PORT = int(os.environ.get("MG_PORT", 8870))
failures = []
def check(ok, what):
    print(("ok   " if ok else "FAIL ") + what)
    if not ok: failures.append(what)

CSS = """@page { size: 5.5in 8.5in; margin: 0; } body { margin: 0; font: 10.5pt/1.42 Georgia, 'DejaVu Serif', serif; }
.pg { width: 5.5in; height: 8.5in; box-sizing: border-box; padding: 0.55in 0.75in 0.6in; position: relative; break-after: page; overflow: hidden; }
.rh { position: absolute; top: 0.38in; left: 0.75in; right: 0.75in; font-size: 8.5pt; letter-spacing: 0.06em; display: flex; justify-content: space-between; }
.fo { position: absolute; bottom: 0.32in; left: 0; right: 0; text-align: center; font-size: 9pt; }
.txt { margin-top: 0.15in; } p { margin: 0; text-indent: 1.4em; text-align: left; }
.fns { position: absolute; bottom: 0.6in; left: 0.75in; right: 0.75in; font-size: 8pt; line-height: 1.3; border-top: 0.5pt solid #000; padding-top: 4pt; }
sup { font-size: 6.5pt; }"""
FILL = ("The question of method returns whenever a reader asks what a definition is for, and how a proof can begin from words "
        "whose sense it has not yet shown. Each answer leaves something over, and the remainder is where the next chapter starts. ")

def page(rh=None, fo=None, body="", fns=()):
    h = '<div class="pg">' + (f'<div class="rh"><span>{rh[0]}</span><span>{rh[1]}</span></div>' if rh else "") + f'<div class="txt">{body}</div>'
    if fns: h += '<div class="fns">' + "".join(f"<div>{f}</div>" for f in fns) + "</div>"
    return h + (f'<div class="fo">{fo}</div>' if fo else "") + "</div>"

def book():
    pages = [page(fo="v", body=f"<p>{FILL * 3}</p>"), page(fo="vi", body=f"<p>{FILL * 3}</p>"),
             page(rh=("vii", "PREFACE"), body=f"<p>{FILL * 3}</p>"), page(fo="viii", body=f"<p>{FILL * 3}</p>")]
    breaks = ("Spinoza's argument for self-<br>understanding begins in the second part. Heidegger's Being-in-the-<br>world "
              "is a different thing. The Ethics was written in 1670-<br>1677, and pre-<br>and post-war readers took it up. "
              "A long word that is simply broken is philo-<br>sophical in the ordinary way. ")
    for k in range(8):
        body = f'<p>{breaks if k == 2 else ""}{FILL * 2}<sup>{k + 1}</sup></p><p>{FILL}</p>'
        pages.append(page(rh=("THE ATTRIBUTES", "") if k % 2 else ("", "SPINOZA AND EXPRESSION"), fo=str(k + 1), body=body, fns=[f"{k + 1}. Ibid., {30 + k}."]))
    return f'<html><head><meta charset="utf-8"><style>{CSS}</style></head><body>{"".join(pages)}</body></html>'

def long_book():
    para = FILL * 30  # a paragraph of about 6,000 characters, as Kant's or Hegel's run
    return f'<html><head><meta charset="utf-8"><style>@page {{ size: 5.5in 8.5in; margin: 0.7in; }} body {{ font: 10.5pt/1.4 Georgia, serif; }} p {{ margin: 0 0 0.6em; }}</style></head><body>{"".join(f"<p>{k}. {para}</p>" for k in range(60))}</body></html>'

PARSE = """async (name) => {
  const buf = await (await fetch(name)).arrayBuffer(), t0 = performance.now();
  const r = await parseFile(new File([buf], name, { type: 'application/pdf' }), () => {});
  return { ms: Math.round(performance.now() - t0), labels: r.labels, blocks: r.blocks.map((b) => [b.k, plain(b.x || '')]) };
}"""

async def main():
    tmp = Path(tempfile.mkdtemp())
    for n in ("index.html", "data", "js", "css"): (tmp / n).symlink_to(ROOT / n)
    (tmp / "lib").symlink_to(PDFJS)
    server = subprocess.Popen([sys.executable, "-m", "http.server", str(PORT), "-d", str(tmp)], stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
    try:
        time.sleep(1)
        async with async_playwright() as p:
            browser = await p.chromium.launch()
            maker = await browser.new_page()
            for name, html in (("book", book()), ("long", long_book())):
                await maker.set_content(html); await maker.pdf(path=str(tmp / f"{name}.pdf"), prefer_css_page_size=True)
            page = await browser.new_page(bypass_csp=True); errs = []
            page.on("pageerror", lambda e: errs.append(str(e)))
            await page.goto(f"http://localhost:{PORT}/index.html"); await page.wait_for_function("typeof idb !== 'undefined' && idb && S.mode === 'ready'")
            await page.evaluate(f"LIBS.pdf = ['http://localhost:{PORT}/lib/pdf.js']; LIBS.pdfw = ['http://localhost:{PORT}/lib/pdf.worker.js']")
            r = await page.evaluate(PARSE, "book.pdf")
            text = " ".join(x for k, x in r["blocks"] if k != "pg")
            for want in ["self-understanding", "Being-in-the-world", "1670-1677", "pre- and post-war", "philosophical in the ordinary way"]:
                check(want in text, f"a line's end: {want!r}")
            fns = [x for k, x in r["blocks"] if k == "fn" and "Ibid." in x]
            check(len(fns) == 8, f"recurring footnotes (Ibid.) stay footnotes, all eight ({len(fns)})")
            check(r["labels"][:4] == ["v", "vi", "vii", "viii"], f"a roman-numbered page with its number in its running head is numbered ({r['labels'][:5]})")
            check("PREFACE" not in text, "and its running head leaves the text")
            r = await page.evaluate(PARSE, "long.pdf")
            check(r["ms"] < 15000 and len([b for b in r["blocks"] if b[0] == "p"]) >= 55, f"60 paragraphs of 6,000 characters are rebuilt in reasonable time ({r['ms']} ms)")
            check(not errs, f"no script errors ({errs[:2]})")
            await browser.close()
    finally:
        server.terminate()

# PDF.js, as tests/pdf_import.py downloads it (run.py runs that first)
_d = sorted((ROOT / "tests" / ".cache").glob("pdfjs-*/build"))
if not _d:
    sys.path.insert(0, str(Path(__file__).parent)); import pdf_import; _d = [pdf_import.pdfjs_dir()]
PDFJS = _d[-1]
asyncio.run(main())
print("\nall passed" if not failures else f"\n{len(failures)} failed")
sys.exit(1 if failures else 0)
