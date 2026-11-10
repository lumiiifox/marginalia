"""How the reader sets verse, lists, dashes and long titles. Run after changes to the reader:  python3 tests/verse_lists.py

Made-up book only, phone-sized screen, Swipe pages. Checks that:
  1. verse stored with " / " between its lines is drawn line by line, never justified, the slashes hidden; a note on a line
     after a break is highlighted on exactly its words, and words chosen across lines are quoted with " / " at the right place;
  2. a prose paragraph with a slash in it, and a block whose parts are longer than a line, are drawn as they are;
  3. a short paragraph starting with a list's number or bullet hangs as a list item; a long numbered section stays a paragraph;
  4. a dash set close to its word never starts a line, and the joiner that keeps it there isn't counted as text;
  5. a chapter title of more than a line or two at heading size is set smaller;
  6. Justified pages are justified at the usual type size and set ragged right at a large one;
  7. a proposition in the geometric order is set apart, its label in small capitals; a proof's label in italics;
  8. a book's contents, one entry a line or run together, are drawn as rows, title and page;
  9. a table's rows (cells stored with " · " between them) are drawn as a grid, columns lined up, the text unchanged.
Needs: pip install playwright && playwright install chromium
"""
import os
import asyncio, subprocess, sys, time
from pathlib import Path
from playwright.async_api import async_playwright

ROOT = Path(__file__).resolve().parent.parent
PORT = int(os.environ.get("MG_PORT", 8813))
URL = f"http://localhost:{PORT}/index.html"
READY = "typeof idb !== 'undefined' && idb && S.mode === 'ready'"
VERSE = "O water, voice of my heart, crying in the sand, / All night long crying with a mournful cry, / As I lie and listen, and cannot understand"
BOOK = """(v) => (async () => {
  const P = 'Each thing, as far as it can by its own power, strives to persevere in its being; and the striving is nothing else than its essence. ';
  const B = [{ k: 'h', l: 1, x: 'VI. Of the Interior Beginnings of Voluntary Motions; Commonly Called the Passions; and the Speeches by Which They Are Expressed', s: 'c1' },
    { k: 'p', x: P.repeat(3) }, { k: 'q', x: v },
    { k: 'p', x: 'The relation of the virtual / actual pair is the subject of this paragraph, which is prose. ' + P.repeat(2) },
    { k: 'q', x: P + ' / ' + P },
    { k: 'p', x: '1. By that which is self-caused, I mean that of which the essence involves existence.' },
    { k: 'p', x: '2. A thing is called finite after its kind, when it can be limited by another thing of the same nature.' },
    { k: 'p', x: '1. A numbered section, long as a chapter section is: ' + P.repeat(5) },
    { k: 'p', x: 'A great hall—many guests whom we are receiving—among them Irma, whom I immediately take aside, as though to answer her letter, to reproach her—' + P.repeat(2) },
    { k: 'h', l: 1, x: 'A Short Title' },
    { k: 'p', x: 'PROP. XIII. Substance absolutely infinite is indivisible.' }, { k: 'p', x: 'Proof.—If it could be divided, the parts would retain its nature.' },
    { k: 'front', x: 'second sight 18 anna 1 23 gambling on the future 27 nets 46 digits 5 1 holes 55' }, { k: 'front', x: 'silicon 25 1' },
    { k: 'p', x: 'Config 1 · 0: move right, config 1 · 1: move right, config 2' }, { k: 'p', x: 'Config 2 · 0: write 1, move right, config 3 · 1: move right, \u0001config 2\u0002' },
    { k: 'p', x: 'A sentence with one middle dot · in it stays a paragraph.' }];
  for (let n = 0; n < 30; n++) B.push({ k: 'p', x: P.repeat(3) });
  await put('content', 'v', B);
  await put('texts', 'v', { title: 'Verse', author: 'Test', hasContent: true, total: B.length, pos: 0, status: 'reading', createdAt: 1, updatedAt: 1, sections: [{ id: 'c1', label: 'VI' }] });
  const at = v.indexOf('All night'), end = v.indexOf(' / As');
  await put('notes', 'nv', { textId: 'v', kind: 'passage', passage: v.slice(at, end), at: 2, anchor: { a: 2, ao: at, b: 2, bo: end, pre: v.slice(at - 12, at), suf: v.slice(end, end + 12) }, createdAt: 2, updatedAt: 2 });
  localStorage.setItem('mg-reader', JSON.stringify({ fs: 20, flow: 'pages', turn: 'slide', bars: 'show', align: 'justify' }));
})()"""

failures = []
def check(ok, what):
    print(("ok   " if ok else "FAIL ") + what)
    if not ok: failures.append(what)

async def main():
    async with async_playwright() as p:
        browser = await p.chromium.launch()
        ctx = await browser.new_context(bypass_csp=True, viewport={"width": 412, "height": 915}, device_scale_factor=2, is_mobile=True, has_touch=True)
        page = await ctx.new_page(); errs = []
        page.on("pageerror", lambda e: errs.append(str(e)))
        await page.goto(URL); await page.wait_for_function(READY)
        await page.evaluate(BOOK, VERSE); await page.reload(); await page.wait_for_function(READY)
        await page.evaluate("go({ screen: 'reader', textId: 'v' })"); await page.wait_for_selector(".book .bp"); await page.wait_for_timeout(700)

        # 1 verse
        v = await page.evaluate("""() => { const el = R.els[2], st = getComputedStyle(el), lines = new Set();
          const w = document.createTreeWalker(el, NodeFilter.SHOW_TEXT); let t;
          while ((t = w.nextNode())) { if (!t.parentElement.closest('.vs')) { const r = document.createRange(); r.selectNodeContents(t); for (const q of r.getClientRects()) lines.add(Math.round(q.top)); } }
          return { cls: el.className, align: st.textAlign, brs: el.querySelectorAll('br').length, shown: el.innerText.includes(' / '), lines: lines.size,
                   mark: (el.querySelector('mark') || {}).textContent || '' }; }""")
        check("verse" in v["cls"] and v["brs"] == 2 and v["lines"] >= 3 and not v["shown"] and v["align"] in ("left", "start"),
              f"verse is drawn line by line, its slashes hidden, never justified ({v})")
        check(v["mark"] == "All night long crying with a mournful cry,", f"a note on a line after a break is highlighted on exactly its words ({v['mark']!r})")
        sel = await page.evaluate("""() => { const el = R.els[2], texts = []; const w = document.createTreeWalker(el, NodeFilter.SHOW_TEXT); let t; while ((t = w.nextNode())) texts.push(t);
          const first = texts[0], last = texts[texts.length - 1], r = document.createRange(); r.setStart(first, 9); r.setEnd(last, 6);
          return { text: selectionText(r), si: offsetIn(2, first, 9), ej: offsetIn(2, last, 6) }; }""")
        want = VERSE[9:VERSE.index("As I lie") + 6]
        check(sel["text"] == want and sel["si"] == 9 and sel["ej"] == VERSE.index("As I lie") + 6, f"words chosen across verse lines are quoted with \" / \" and keep their place ({sel})")

        # 2 a slash in prose, and long parts
        pr = await page.evaluate("[R.els[3].className, R.els[3].querySelectorAll('br').length, R.els[4].className, R.els[4].querySelectorAll('br').length]")
        check(pr == ["bp", 0, "bq", 0], f"a prose paragraph with a slash and a block of long parts are drawn as they are ({pr})")

        # 3 list items
        li = await page.evaluate("[5, 6, 7].map((i) => [R.els[i].className, parseFloat(getComputedStyle(R.els[i]).textIndent)])")
        check("li" in li[0][0] and "li" in li[1][0] and li[0][1] < 0 and "li" not in li[2][0] and li[2][1] >= 0, f"short numbered paragraphs hang as list items; a long numbered section stays a paragraph ({li})")

        # 4 dashes
        d = await page.evaluate("""() => { const el = R.els[8], rx = el.querySelectorAll('.rx').length;
          const starts = []; const w = document.createTreeWalker(el, NodeFilter.SHOW_TEXT); let t, prevTop = null;
          while ((t = w.nextNode())) for (let k = 0; k < t.data.length; k++) { const r = document.createRange(); r.setStart(t, k); r.setEnd(t, k + 1); const q = r.getClientRects()[0]; if (!q) continue; const top = Math.round(q.top);
            if (prevTop !== null && top > prevTop + 2) starts.push(t.data[k]); prevTop = top; }
          const last = [...el.childNodes].filter((n) => n.nodeType === 3).pop();
          return { rx, dashStarts: starts.filter((c) => c === '—').length, lines: starts.length, off: offsetIn(8, last, last.data.length), len: plain(R.blocks[8].x).length,
                   find: findRuns().length > 0 }; }""")
        check(d["rx"] == 3 and d["dashStarts"] == 0 and d["lines"] > 3, f"a dash set close to its word never starts a line ({d})")
        check(d["off"] == d["len"], f"the joiner before a dash isn't counted as text: positions after it are the stored text's ({d['off']} of {d['len']})")

        # 5 long titles
        h = await page.evaluate("[R.els[0].className, parseFloat(getComputedStyle(R.els[0]).fontSize), R.els[9].className, parseFloat(getComputedStyle(R.els[9]).fontSize)]")
        check("long" in h[0] and "long" not in h[2] and h[1] < h[3], f"a chapter title of several lines is set smaller than a short one ({h})")

        # 6 justified, and ragged at a large size
        j20 = await page.evaluate("[document.querySelector('#reader').classList.contains('short-lines'), getComputedStyle(R.els[1]).textAlign]")
        await page.evaluate("setRS({ fs: 26 })"); await page.wait_for_timeout(400)
        j26 = await page.evaluate("[document.querySelector('#reader').classList.contains('short-lines'), getComputedStyle(R.els[1]).textAlign, getComputedStyle(R.els[1]).hyphens]")
        check(j20 == [False, "justify"] and j26[0] and j26[1] in ("left", "start") and j26[2] == "auto", f"Justified pages justify at 20 px and are set ragged right, hyphenated, at 26 ({j20}, {j26})")
        # 7 the geometric order
        await page.evaluate("setRS({ fs: 20 })"); await page.wait_for_timeout(300)
        g = await page.evaluate("[R.els[10].className, getComputedStyle(R.els[10]).fontStyle, R.els[10].querySelector('.lead')?.textContent, R.els[11].querySelector('.lead2')?.textContent, getComputedStyle(R.els[11].querySelector('.lead2') || R.els[11]).fontStyle, offsetIn(11, R.els[11].lastChild, R.els[11].lastChild.data.length), plain(R.blocks[11].x).length]")
        check("stmt" in g[0] and g[1] == "italic" and g[2] == "PROP. XIII." and g[3] == "Proof.\u2060—" and g[4] == "italic" and g[5] == g[6],
              f"a proposition is set apart, its label in small capitals, its statement in italics; a proof's label in italics, its text's places unchanged ({g})")
        # 8 a book's contents: rows, a page number split by OCR read in the contents' order, the text unchanged
        await page.evaluate("goTo(12)"); await page.wait_for_timeout(300)
        t = await page.evaluate("[[...R.els[12].querySelectorAll('.tocrow')].map((r) => r.querySelector('.toct').textContent.trim() + '=' + r.dataset.tocpage), R.els[12].textContent === R.blocks[12].x, [...R.els[13].querySelectorAll('.tocrow')].map((r) => r.dataset.tocpage)]")
        check(t[0] == ["second sight=18", "anna 1=23", "gambling on the future=27", "nets=46", "digits=51", "holes=55"] and t[1] and t[2] == ["251"],
              f"a book's contents are rows, a split page number read in the contents' order, the text as stored ({t})")
        # 9 a table's rows: a grid, columns lined up, separators hidden but kept in the text
        await page.evaluate("goTo(14)"); await page.wait_for_timeout(300)
        tb = await page.evaluate("""() => { const a = R.els[14], b = R.els[15], c = R.els[16];
          const xs = (el) => [...el.querySelectorAll('.tc')].map((t) => Math.round(t.getBoundingClientRect().left));
          const last = [...b.querySelectorAll('.tc')].pop(), tn = last.lastChild.nodeType === 3 ? last.lastChild : last.lastChild.lastChild;
          const r = document.createRange(); r.setStart(a.querySelector('.tc').firstChild, 0); r.setEnd(a.querySelectorAll('.tc')[1].firstChild, 2);
          return { cls: [a.className, b.className, c.className], grid: getComputedStyle(a).display, xa: xs(a), xb: xs(b), seps: a.querySelectorAll('.tsep').length,
                   sepShown: getComputedStyle(a.querySelector('.tsep')).display, em: !!b.querySelector('.tc em'),
                   end: offsetIn(15, tn, tn.data.length), len: plain(R.blocks[15].x).length, sel: selectionText(r) }; }""")
        check("trow" in tb["cls"][0] and "trow" in tb["cls"][1] and "trow" not in tb["cls"][2] and tb["grid"] == "grid" and tb["xa"] == tb["xb"] and len(tb["xa"]) == 3,
              f"a table's rows are drawn as a grid, their columns lined up; a sentence with one middle dot stays a paragraph ({tb['cls']}, {tb['xa']}, {tb['xb']})")
        check(tb["seps"] == 2 and tb["sepShown"] == "none" and tb["em"] and tb["end"] == tb["len"] and tb["sel"] == "Config 1 · 0:",
              f"a row's separators are hidden yet kept: italics stay, places are the stored text's, a passage across cells is quoted as stored ({tb})")
        check(not errs, f"no script errors ({errs[:2]})")
        await browser.close()

if __name__ == "__main__":
    server = subprocess.Popen([sys.executable, "-m", "http.server", str(PORT), "-d", str(ROOT)], stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
    try:
        time.sleep(1); asyncio.run(main())
    finally:
        server.terminate()
    if failures: print(f"\n{len(failures)} failed"); sys.exit(1)
    print("\nall passed")
