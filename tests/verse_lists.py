"""How the reader sets verse, lists, dashes and long titles. Run after changes to the reader:  python3 tests/verse_lists.py

Made-up book only, phone-sized screen, Swipe pages. Checks that:
  1. verse stored with " / " between its lines is drawn line by line, never justified, the slashes hidden; a note on a line
     after a break is highlighted on exactly its words, and words chosen across lines are quoted with " / " at the right place;
  2. a prose paragraph with a slash in it, and a block whose parts are longer than a line, are drawn as they are;
  3. a short paragraph starting with a list's number or bullet hangs as a list item; a long numbered section stays a paragraph;
  4. a dash set close to its word never starts a line, and the joiner that keeps it there isn't counted as text;
  5. a chapter title of more than a line or two at heading size is set smaller;
  6. Justified pages are justified at the usual type size and set ragged right at a large one.
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
    { k: 'h', l: 1, x: 'A Short Title' }];
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
        ctx = await browser.new_context(viewport={"width": 412, "height": 915}, device_scale_factor=2, is_mobile=True, has_touch=True)
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
