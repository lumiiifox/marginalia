"""Texts from Wikisource. Run after changes to the Wikisource import or the HTML importer:  python3 tests/wikisource.py

Uses a stand-in for Wikisource's API (the tests never reach the real site), shaped like its pages: a header template marked with
Wikisource's microformat (ws-title, ws-author, ws-translator, ws-year) and ws-noexport, a contents list (ws-summary), chapters as
subpages with page-number markers, references and edit links, a contents page of its own with deeper chapters, and a French title
with accents. Checks that:
  1. Add text → Or find a public-domain text on Wikisource searches, in the language chosen;
  2. choosing a work fetches it and its chapters in order, and the form fills in title, author, translator and year;
  3. the book has the chapters as headings, its page numbers, its notes, and none of the navigation, headers or edit links;
  4. a single-page work comes in as it is; an author's page with no text is refused with a message; offline says so;
  5. a reading path's Find it on Wikisource opens the sheet with the search done.
Needs: pip install playwright && playwright install chromium
"""
import asyncio, json, subprocess, sys, time
from pathlib import Path
from urllib.parse import urlparse, parse_qs
from playwright.async_api import async_playwright

ROOT = Path(__file__).resolve().parent.parent
PORT = 8815
URL = f"http://localhost:{PORT}/index.html"
READY = "typeof idb !== 'undefined' && idb && S.mode === 'ready'"
failures = []
def check(ok, what):
    print(("ok   " if ok else "FAIL ") + what)
    if not ok: failures.append(what)

HEADER = ('<div class="wst-header ws-noexport"><span id="ws-title">The Test Work</span><span class="ws-author">Ann Author</span>'
          '<span class="ws-translator">T. Translator</span><span class="ws-year">1888</span>'
          '<a href="/wiki/The_Test_Work/Chapter_2">Next</a> Header text that must not appear</div>')
def nav(prev, nxt): return f'<div class="ws-noexport wst-nav"><a href="/wiki/{prev}">Previous</a> <a href="/wiki/{nxt}">Next</a></div>'
def chapter(n, page):
    return (nav("The_Test_Work", "The_Test_Work") + f'<h2><span class="mw-headline">Chapter {n}</span><span class="mw-editsection">[edit]</span></h2>'
            f'<p><span><span class="pagenum ws-pagenum" id="{page}" data-page-number="{page}"></span></span>The words of chapter {n} begin here and go on at length about method.'
            f'<sup class="reference" id="cite_ref-{n}"><a href="#cite_note-{n}">[{n}]</a></sup></p>'
            f'<p><span><span class="pagenum ws-pagenum" id="{page + 1}" data-page-number="{page + 1}"></span></span>A second paragraph of chapter {n}.</p>'
            f'<div class="mw-references-wrap"><ol class="references"><li id="cite_note-{n}"><span class="mw-cite-backlink"><a href="#cite_ref-{n}">↑</a></span> <span class="reference-text">Note to chapter {n}.</span></li></ol></div>')
PAGES = {
    ("en", "The Test Work"): HEADER + '<p>Front matter on the main page.</p><div class="ws-summary"><ul>'
        '<li><a href="/wiki/The_Test_Work/Chapter_1">Chapter 1</a></li><li><a href="/wiki/The_Test_Work/Chapter_2">Chapter 2</a></li>'
        '<li><a href="/wiki/The_Test_Work/Book_II">Book II</a></li><li><a href="/wiki/The_Test_Work/Chapter_1#sec">Chapter 1 again</a></li></ul></div>'
        '<p><a href="/wiki/Another_Work/Chapter_1">another work</a></p>',
    ("en", "The Test Work/Chapter 1"): chapter(1, 10),
    ("en", "The Test Work/Chapter 2"): chapter(2, 20),
    ("en", "The Test Work/Book II"): nav("x", "y") + '<p>Contents of Book II:</p><ul><li><a href="/wiki/The_Test_Work/Book_II/Chapter_3">Chapter 3</a></li><li><a href="/wiki/The_Test_Work/Book_II/Chapter_4">Chapter 4</a></li></ul>',
    ("en", "The Test Work/Book II/Chapter 3"): chapter(3, 30),
    ("en", "The Test Work/Book II/Chapter 4"): chapter(4, 40),
    ("en", "A Short Essay"): '<div class="wst-header ws-noexport"><span id="ws-title">A Short Essay</span><span class="ws-author">Bea Writer</span></div><p>The whole essay is this paragraph, long enough to read on its own and to keep.</p><p>And a second paragraph.</p>',
    ("en", "Author:Ann Author"): '<div class="ws-noexport">Works</div><ul><li><a href="/wiki/The_Test_Work">The Test Work</a></li></ul>',
    ("fr", "Méditations métaphysiques"): '<div class="ws-noexport"><span id="ws-title">Méditations métaphysiques</span><span class="ws-author">René Descartes</span></div>'
        '<div class="ws-summary"><a href="/wiki/M%C3%A9ditations_m%C3%A9taphysiques/Premi%C3%A8re_M%C3%A9ditation">Première</a></div>',
    ("fr", "Méditations métaphysiques/Première Méditation"): '<p>Il y a déjà quelque temps que je me suis aperçu que, dès mes premières années, j’avais reçu quantité de fausses opinions pour véritables.</p>',
}
SEARCH = {("en", "test work"): ["The Test Work", "Author:Ann Author"], ("en", "short essay"): ["A Short Essay"], ("fr", "méditations"): ["Méditations métaphysiques"],
          ("en", "Critique of Pure Reason"): ["The Test Work"]}
CALLS = []

async def api(route):
    u = urlparse(route.request.url); q = {k: v[0] for k, v in parse_qs(u.query).items()}; lang = u.hostname.split(".")[0]
    CALLS.append((lang, q.get("action"), q.get("page") or q.get("srsearch")))
    if q.get("origin") != "*" or q.get("formatversion") != "2": return await route.fulfill(status=400, body="bad")
    if q.get("list") == "search":
        hits = SEARCH.get((lang, q["srsearch"]), [])
        body = {"query": {"search": [{"title": t, "snippet": f'… <span class="searchmatch">{t}</span> …'} for t in hits]}}
    else:
        html = PAGES.get((lang, q["page"]))
        body = {"error": {"code": "missingtitle", "info": "no page"}} if html is None else {"parse": {"title": q["page"], "displaytitle": q["page"], "text": f'<div class="mw-parser-output">{html}</div>'}}
    await route.fulfill(status=200, content_type="application/json", headers={"Access-Control-Allow-Origin": "*"}, body=json.dumps(body))

async def import_from(page, lang, query, pick):
    await page.evaluate("textSheet(null)"); await page.wait_for_selector("#f-wsbtn")
    await page.click("#f-wsbtn"); await page.select_option("#f-wslang", lang); await page.fill("#f-wsq", query); await page.press("#f-wsq", "Enter")
    await page.wait_for_selector(f".wshit[data-wspage='{pick}']")
    await page.click(f".wshit[data-wspage='{pick}']")

async def main():
    async with async_playwright() as p:
        browser = await p.chromium.launch()
        ctx = await browser.new_context(viewport={"width": 390, "height": 844}, is_mobile=True, has_touch=True)
        page = await ctx.new_page(); errs = []
        page.on("pageerror", lambda e: errs.append(str(e)))
        await page.route("https://*.wikisource.org/w/api.php**", api)
        await page.goto(URL); await page.wait_for_function(READY)

        # 1–2 search and fetch
        await import_from(page, "en", "test work", "The Test Work")
        hits = await page.evaluate("[...document.querySelectorAll('.wshit')].map((b) => b.dataset.wspage)")
        check(hits == ["The Test Work", "Author:Ann Author"] and ("en", "query", "test work") in CALLS, f"searching Wikisource lists its works ({hits})")
        await page.wait_for_function("document.querySelector('#f-title').value === 'The Test Work'", timeout=10000)
        form = await page.evaluate("['#f-title', '#f-author', '#f-edition', '#f-year', '#f-secs'].map((s) => document.querySelector(s).value)")
        check(form[:4] == ["The Test Work", "Ann Author", "trans. T. Translator", "1888"], f"the form fills in title, author, translator and year ({form[:4]})")
        fetched = [c[2] for c in CALLS if c[1] == "parse"]
        check(fetched == ["The Test Work", "The Test Work/Chapter 1", "The Test Work/Chapter 2", "The Test Work/Book II", "The Test Work/Book II/Chapter 3", "The Test Work/Book II/Chapter 4"],
              f"the work and its chapters are fetched in order, a contents page's own chapters in place, each once ({fetched})")
        await page.click("button[type=submit]"); await page.wait_for_function("S.screen === 'text'", timeout=10000)
        tid = await page.evaluate("S.textId")
        r = await page.evaluate(f"""(async () => {{ const t = S.texts.get('{tid}'), B = await loadContent('{tid}');
          return {{ t: [t.title, t.author, t.edition, t.year, t.lang, t.source.name], secs: t.sections.map((x) => x.label), heads: B.filter((b) => b.k === 'h').map((b) => b.x),
            pages: B.filter((b) => b.k === 'pg').map((b) => b.x), text: B.filter((b) => b.k !== 'pg').map((b) => b.x).join(' | '), fn: B.filter((b) => b.k === 'fn').map((b) => b.x) }}; }})()""")
        check(r["t"] == ["The Test Work", "Ann Author", "trans. T. Translator", "1888", "en", "The Test Work (Wikisource en).html"], f"the book keeps its details ({r['t']})")
        check(r["secs"] == ["Chapter 1", "Chapter 2", "Book II"] and r["heads"] == ["Chapter 1", "Chapter 2", "Book II", "Chapter 3", "Chapter 4"], f"its chapters are the work's, Book II's own under it, each heading once ({r['secs']}, {r['heads']})")
        check(r["pages"] == ["10", "11", "20", "21", "30", "31", "40", "41"], f"its page numbers come through ({r['pages']})")
        bad = [w for w in ["Previous", "Header text", "[edit]", "↑", "Front matter", "Contents of Book II"] if w in r["text"]]
        check(not bad, f"no navigation, headers, edit links, backlinks or contents lists in the text ({bad})")
        check("chapter 1 begin here and go on at length about method.¹" in r["text"] and any("Note to chapter 1." in x for x in r["fn"]), f"references become note numbers with their notes ({r['fn'][:1]})")

        # 4 a single page, an author's page, French, offline
        await import_from(page, "en", "short essay", "A Short Essay")
        await page.wait_for_function("document.querySelector('#f-title').value === 'A Short Essay'", timeout=10000)
        check(await page.evaluate("document.querySelector('#f-author').value") == "Bea Writer" and "1 chapter" not in await page.inner_text("#f-prog"), "a single-page work comes in as it is")
        await page.evaluate("closeOverlay()"); await page.wait_for_timeout(300)
        await import_from(page, "en", "test work", "Author:Ann Author")
        await page.wait_for_function("document.querySelector('#f-prog').classList.contains('bad')", timeout=10000)
        check("no text to read" in await page.inner_text("#f-prog"), "an author's page, with no text, is refused with a message")
        await page.evaluate("closeOverlay()"); await page.wait_for_timeout(300)
        await import_from(page, "fr", "méditations", "Méditations métaphysiques")
        await page.wait_for_function("document.querySelector('#f-title').value === 'Méditations métaphysiques'", timeout=10000)
        check(("fr", "parse", "Méditations métaphysiques/Première Méditation") in CALLS and await page.evaluate("document.querySelector('#f-author').value") == "René Descartes", "a French work, its accented chapter links followed")
        await page.evaluate("closeOverlay()"); await page.wait_for_timeout(300)
        await ctx.set_offline(True)
        await page.evaluate("textSheet(null)"); await page.click("#f-wsbtn"); await page.fill("#f-wsq", "anything"); await page.click("#f-wsgo"); await page.wait_for_timeout(200)
        check("offline" in await page.inner_text("#f-wsres"), "offline, it says Wikisource needs a connection")
        await ctx.set_offline(False); await page.evaluate("closeOverlay()"); await page.wait_for_timeout(300)

        # 5 from a reading path
        await page.evaluate("go({ screen: 'paths' })"); await page.wait_for_timeout(200)
        await page.click("section.path-entry[data-path-id='what-can-we-know'] button.linkbtn[data-path]"); await page.wait_for_timeout(200)
        await page.click("section.syllabus[data-path-id='what-can-we-know'] [data-wsfind]"); await page.wait_for_selector(".wshit", timeout=5000)
        check(await page.evaluate("[!document.querySelector('#f-wsbox').hidden, document.querySelector('#f-wsq').value]") == [True, "Critique of Pure Reason"], "a reading path's Find it on Wikisource opens the sheet with its search done")
        check(not errs, "no script errors" + (f": {errs}" if errs else ""))
        await browser.close()

server = subprocess.Popen([sys.executable, "-m", "http.server", str(PORT), "-d", str(ROOT)], stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
try:
    time.sleep(1); asyncio.run(main())
finally:
    server.terminate()
print(f"\n{len(failures)} failed" if failures else "\nall passed")
sys.exit(1 if failures else 0)
