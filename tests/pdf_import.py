"""PDF import test for Marginalia:  python3 tests/pdf_import.py [your-book.pdf ...]

With no arguments, makes its own small books (Chromium's print-to-PDF) and checks that the app's parser
finds exactly their headings, numbers their pages in order, and leaves no broken words:
  justified    typeset, hyphenated, chapter titles followed directly by section titles
  ragged       the same unjustified, with block quotes
  twoline      headings long enough to wrap onto two lines
  scanlike     every page set at a different size, as scans often are, with no headings inside chapters

With PDF paths, parses those instead and prints what the app would make of them (headings, page numbers,
paragraph count), so a badly imported book can be checked before and after a parser change.
Never commit real books: the repository is public.

PDF.js isn't committed; the first run downloads the version the app uses from its GitHub release into
tests/.cache (git-ignored).
Needs: pip install playwright && playwright install chromium
"""
import asyncio, io, json, re, subprocess, sys, tempfile, time, urllib.request, zipfile
from pathlib import Path
from playwright.async_api import async_playwright

ROOT = Path(__file__).resolve().parent.parent
CACHE = ROOT / "tests" / ".cache"
PORT = 8798

def pdfjs_dir():
    ver = re.search(r"pdf\.js/([\d.]+)/pdf\.min\.js", (ROOT / "index.html").read_text()).group(1)
    d = CACHE / f"pdfjs-{ver}"
    if not (d / "build" / "pdf.worker.js").exists():
        print(f"Downloading PDF.js {ver}…")
        url = f"https://github.com/mozilla/pdf.js/releases/download/v{ver}/pdfjs-{ver}-dist.zip"
        zipfile.ZipFile(io.BytesIO(urllib.request.urlopen(url).read())).extractall(d)
    return d / "build"

BODY = ("The question of method returns whenever philosophy examines the conditions under which its concepts become "
        "intelligible. Kant's critical project begins from the recognition that reason, left to itself, generates "
        "antinomies it cannot resolve. Hegel answers that the contradictions are moments in the self-development of "
        "the concept. Genealogy uncovers the contingent struggles sedimented in values that present themselves as eternal. ")
CSS = "@page { size: 5.5in 8.5in; margin: 0.8in 0.7in; } body { font: 11pt/1.45 Georgia, serif; } p { margin: 0; text-indent: 1.5em; } h1 { font-size: 20pt; break-before: page; margin: 1.4in 0 0.5in; } h2 { font-size: 13.5pt; margin: 1.2em 0 0.6em; } blockquote { font-size: 9.5pt; margin: 0.8em 2em; }"

def book(justify):
    heads, html = [], []
    for c, ch in enumerate(["Critique", "Genealogy", "Difference"], 1):
        heads.append(f"Chapter {c}: {ch}"); html.append(f"<h1>{heads[-1]}</h1>")
        for s, sec in enumerate(["Method and its limits", "The problem of origins", "Against negation"], 1):
            heads.append(f"{c}.{s} {sec}"); html.append(f"<h2>{heads[-1]}</h2>")
            html += [f"<p>{BODY * 2}</p>"] * 3 + [f"<blockquote>{BODY}</blockquote>", f"<p>{BODY * 2}</p>"]
    style = CSS + (" p { text-align: justify; hyphens: auto; }" if justify else "")
    return f'<html lang="en"><style>{style}</style>{"".join(html)}</html>', heads

def twoline():
    heads = ["The Long Title of a Chapter That Wraps Across Two Lines", "A Section Heading Long Enough That It Also Needs Two Lines Here"]
    return f'<html lang="en"><style>{CSS} p {{ text-align: justify; }} h1 {{ break-before: auto; }}</style><h1>{heads[0]}</h1><p>{BODY * 3}</p><h2>{heads[1]}</h2><p>{BODY * 3}</p></html>', heads

def scanlike():
    # One chapter title, then pages each set 0-30% larger, the way a scan's pages differ in size.
    # Each page also carries a running head misread a little differently, as OCR does ("Chapten!", "(hapter 1").
    heads = ["Chapter 1", "Chapten!", "Chapter 1", "(hapter 1", "Chapter:I", "Chapter 1", "ChaptenI", "Chapter 1"]
    pages = "".join(f'<div style="height:7.15in;position:relative;font-size:{11 * k}pt;break-after:page"><div style="height:6.2in;overflow:hidden">{"<h1>Scanned Chapter</h1>" if i == 0 else ""}'
                    f'<p>{BODY * 3}</p></div><div style="position:absolute;bottom:0;left:0;font-size:7pt">{h}</div></div>'
                    for i, (k, h) in enumerate(zip([1, 1.18, 1.0, 1.25, 1.06, 1.3, 1.0, 1.2], heads)))
    return f'<html lang="en"><style>{CSS} @page {{ margin-bottom: 0.4in; }} p {{ text-align: justify; hyphens: auto; }} h1 {{ break-before: auto; margin: 0.3in 0 0.4in; }}</style>{pages}</html>', ["Scanned Chapter"]

PARSE = """async ([url, base]) => {
  LIBS.pdf = [base + "/pdf.js"]; LIBS.pdfw = [base + "/pdf.worker.js"];
  const r = await parseFile(new File([await (await fetch(url)).arrayBuffer()], url.split("/").pop()), () => {});
  return { heads: r.blocks.filter((b) => b.k === "h").map((b) => b.x), labels: r.blocks.filter((b) => b.k === "pg").map((b) => b.x),
           text: r.blocks.filter((b) => b.k !== "pg" && b.k !== "h").map((b) => b.x).join("\\n"), source: r.pageSource, paras: r.blocks.filter((b) => b.k === "p").length };
}"""

# Lines as OCR read them in a scanned book, and what the repairs should make of them. The last cases
# must come through unchanged: real compounds, names with odd letters, numbers side by side, clean prose.
OCR_CASES = [
    ["We must thus make co;mections, ever more connections.", "We must thus make connections, ever more connections."],
    ["But this pragmatism-this And-is not an instrumentalism", "But this pragmatism—this And—is not an instrumentalism"],
    ["a kind of trust or confidence--a belief-in-the-world.", "a kind of trust or confidence—a belief-in-the-world."],
    ['knocking at the door,"3 The "machines" Kafka set up', 'knocking at the door,"³ The "machines" Kafka set up'],
    ["W hat is supposed by such crossing. T hus he asks", "What is supposed by such crossing. Thus he asks"],
    ["not a generality but a si ngularity of the highest degree", "not a generality but a singularity of the highest degree"],
    ["fr�m t�eir rela,tions and fic,tions, as DeleU2e says", "from their relations and fictions, as Deleuze says"],
    ["he wanted to explore.l1 The problems.s Then", "he wanted to explore.¹¹ The problems.⁵ Then"],
    ["(Minuit, 1 998); see pp. 1 2 2-1 24 and 1 42ft'.", "(Minuit, 1998); see pp. 122-124 and 142ff."],
    ["free affect from f.'''l.�VJ'''''' percept", "free affect from [illegible] percept"],
    ["Jean-Franc;ois Lyotard and Fran<;ois Chatelet", "Jean-Franc;ois Lyotard and Fran<;ois Chatelet"],
    ["state-of-the-art, face-to-face, a well-known man", "state-of-the-art, face-to-face, a well-known man"],
    ["chapters 15 31 49 and the year 1998 (e.g., here)", "chapters 15 31 49 and the year 1998 (e.g., here)"],
    ["The concept of immanence is a plane, not a transcendence.", "The concept of immanence is a plane, not a transcendence."],
]

failures = []
def check(ok, what):
    print(("ok   " if ok else "FAIL ") + what)
    if not ok: failures.append(what)

async def main(paths):
    build = pdfjs_dir()
    tmp = Path(tempfile.mkdtemp())
    (tmp / "index.html").symlink_to(ROOT / "index.html"); (tmp / "lib").symlink_to(build)
    server = subprocess.Popen([sys.executable, "-m", "http.server", str(PORT), "-d", str(tmp)], stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
    try:
        time.sleep(1)
        async with async_playwright() as p:
            browser = await p.chromium.launch()
            page = await browser.new_page(); errs = []
            page.on("pageerror", lambda e: errs.append(str(e)))
            await page.goto(f"http://localhost:{PORT}/index.html"); await page.wait_for_function("typeof idb !== 'undefined' && idb")
            base = f"http://localhost:{PORT}/lib"
            if paths:
                for i, path in enumerate(paths):
                    (tmp / f"book{i}.pdf").symlink_to(Path(path).resolve())
                    r = await page.evaluate(PARSE, [f"/book{i}.pdf", base])
                    print(f"\n{path}\n  page numbers ({r['source']}): {' '.join(r['labels'][:40])}{' …' if len(r['labels']) > 40 else ''}\n  paragraphs: {r['paras']}\n  headings ({len(r['heads'])}):")
                    for h in r["heads"]: print("    " + h[:100])
            else:
                maker = await browser.new_page()
                for name, (html, heads) in {"justified": book(True), "ragged": book(False), "twoline": twoline(), "scanlike": scanlike()}.items():
                    await maker.set_content(html)
                    await maker.pdf(path=str(tmp / f"{name}.pdf"), prefer_css_page_size=True, display_header_footer=True, header_template="<span></span>",
                        footer_template='<div style="font-size:9px;width:100%;text-align:center"><span class="pageNumber"></span></div>',
                        margin={"top": "0.8in", "bottom": "0.4in" if name == "scanlike" else "0.8in", "left": "0.7in", "right": "0.7in"})
                    r = await page.evaluate(PARSE, [f"/{name}.pdf", base])
                    check(r["heads"] == heads, f"{name}: headings exactly as typeset" + ("" if r["heads"] == heads else f" (got {r['heads']})"))
                    check(r["labels"] == [str(i + 1) for i in range(len(r["labels"]))], f"{name}: pages numbered 1 to {len(r['labels'])} in order" + ("" if r["labels"] == [str(i + 1) for i in range(len(r["labels"]))] else f" (got {r['labels']})"))
                    bad = re.findall(r"\b\w+- \w+|\b\w+­\w*", r["text"])
                    check(not bad, f"{name}: no words left broken across lines" + (f" (e.g. {bad[:3]})" if bad else ""))
                    if name == "scanlike":
                        left = re.findall(r"\S*hapte\S*", r["text"])
                        check(not left, "scanlike: misread running heads removed" + (f" (left: {left})" if left else ""))
                    marks = re.findall(r"\[…\]|\[illegible\]", r["text"])
                    check(not marks, f"{name}: no OCR repairs on a typeset book" + (f" (found {marks[:3]})" if marks else ""))
                # The OCR repairs, on lines from a real scan, with the book's vocabulary they rely on.
                vocab = ("connections deleuze immanence singularity from their relations fictions what thus the question precisely "
                         "explore problems machine machines minuit year state art face known man would plane concept transcendence ") * 3
                for got, want in await page.evaluate("""([cases, vocab]) => {
                    const counts = new Map(); for (const w of vocab.toLowerCase().match(/\\p{L}+/gu)) counts.set(w, (counts.get(w) || 0) + 1);
                    return cases.map(([inp, want]) => [ocrRepair([{ k: "p", x: inp }], counts)[0].x, want]); }""", [OCR_CASES, vocab]):
                    check(got == want, f"OCR repair: {want!r}" + ("" if got == want else f" (got {got!r})"))
            check(not errs, "no script errors" + (f": {errs}" if errs else ""))
            await browser.close()
    finally:
        server.terminate()

asyncio.run(main(sys.argv[1:]))
if failures: print(f"\n{len(failures)} failed"); sys.exit(1)
if len(sys.argv) == 1: print("\nall passed")
