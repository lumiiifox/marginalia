"""Note numbers and the dictionary. Run after changes to the reader or Look up:  python3 tests/notes_lookup.py

Made-up book only; Wiktionary is stood in for by a local reply shaped like its API's. Checks that:
  1. a note number in the text can be tapped (a tap on it doesn't turn the page) and shows its note:
     - an endnote in the run of notes under a heading naming the chapter;
     - an endnote for a chapter whose notes heading doesn't name it, by the chapter's place in order;
     - a footnote near the number;
     with Go to the note (and the way back) and the other notes with that number;
  2. Look up shows Wiktionary's definitions by language and part of speech, keeps them for offline use, and says so when
     there's no entry or Wiktionary can't be reached;
  3. the words looked up are listed in the glossary (Your words), one usable definition each, and quizzed on (the word
     blanked out of its definition); Remove takes one off.
Needs: pip install playwright && playwright install chromium
"""
import asyncio, json, subprocess, sys, time
from pathlib import Path
from playwright.async_api import async_playwright

ROOT = Path(__file__).resolve().parent.parent
PORT = 8803
URL = f"http://localhost:{PORT}/index.html"
READY = "typeof idb !== 'undefined' && idb && S.mode === 'ready'"
BOOK = """(async () => {
  const B = [], f = 'Everywhere it is machines, real ones, with all the necessary couplings and connections. ';
  B.push({ k: 'pg', x: '1' }, { k: 'h', l: 1, x: 'The Desiring-Machines', s: 'c1' });
  B.push({ k: 'p', x: 'It is at work everywhere.¹ ' + f }, { k: 'p', x: 'Desire produces the real.² ' + f.repeat(3) });
  B.push({ k: 'pg', x: '2' }, { k: 'h', l: 1, x: 'Psychoanalysis and Familialism', s: 'c2' });
  B.push({ k: 'p', x: 'The holy family.¹ ' + f }, { k: 'p', x: 'Oedipus everywhere.² ' + f.repeat(3) });
  B.push({ k: 'pg', x: '3' }, { k: 'h', l: 1, x: 'Savages', s: 'c3' });
  B.push({ k: 'p', x: 'The socius inscribes.³ ' + f }, { k: 'pg', x: '4' }, { k: 'fn', x: '3 A footnote at the foot of the page.' }, { k: 'p', x: 'More text. ' + f });
  for (let n = 0; n < 30; n++) B.push({ k: 'p', x: 'Filler ' + n + '. ' + f.repeat(2) });
  B.push({ k: 'pg', x: '383' }, { k: 'h', l: 1, x: 'Reference Notes', s: 'cn' });
  B.push({ k: 'h', l: 2, x: '1. The Desiring-Machines' }, { k: 'p', x: '1 Endnote one of the first chapter.' }, { k: 'p', x: '2 Endnote two of the first chapter.' });
  B.push({ k: 'h', l: 2, x: 'Chapter 2' }, { k: 'p', x: '1 Endnote one of the second chapter.' }, { k: 'p', x: '2 Endnote two of the second chapter.' });
  await put('content', 'n', B);
  await put('texts', 'n', { title: 'Anti', author: 'Test', hasContent: true, total: B.length, pos: 0, status: 'reading', createdAt: 1, updatedAt: 1,
    sections: [{ id: 'c1', label: 'The Desiring-Machines' }, { id: 'c2', label: 'Psychoanalysis and Familialism' }, { id: 'c3', label: 'Savages' }, { id: 'cn', label: 'Reference Notes' }] });
  localStorage.setItem('mg-reader', JSON.stringify({ fs: 18, flow: 'pages', turn: 'slide' }));
})()"""
WIKI = """<div class="mw-content-ltr mw-parser-output" lang="en" dir="ltr">
<div class="mw-heading mw-heading2"><h2 id="Latin">Latin</h2></div>
<div class="mw-heading mw-heading3"><h3 id="Etymology">Etymology</h3></div><p>From a root meaning to follow.</p>
<ol><li>not a definition list under Etymology</li></ol>
<div class="mw-heading mw-heading3"><h3 id="Noun">Noun</h3></div>
<p><strong class="Latn headword" lang="la">socius</strong> m (genitive sociī)</p>
<ol><li><a href="#">companion</a>, <a href="#">comrade</a><dl><dd><i>an example sentence</i></dd></dl></li><li><a href="#">partner</a>, <a href="#">ally</a><sup class="reference">[1]</sup></li></ol>
<div class="mw-heading mw-heading3"><h3 id="Adjective">Adjective</h3></div>
<ol><li>sharing, joint</li></ol>
<div class="mw-heading mw-heading3"><h3 id="References">References</h3></div><ol class="references"><li>a reference</li></ol>
</div>"""

failures = []
def check(ok, what):
    print(("ok   " if ok else "FAIL ") + what)
    if not ok: failures.append(what)

async def main():
    async with async_playwright() as p:
        browser = await p.chromium.launch()
        ctx = await browser.new_context(viewport={"width": 412, "height": 915}, device_scale_factor=2.625, is_mobile=True, has_touch=True)
        calls = []
        async def wiki(route):
            u = route.request.url; calls.append(u)
            if "Nonword" in u or "nonword" in u: await route.fulfill(status=200, content_type="application/json", body=json.dumps({"error": {"code": "missingtitle"}}), headers={"access-control-allow-origin": "*"}); return
            if "Broken" in u or "broken" in u: await route.abort(); return
            await route.fulfill(status=200, content_type="application/json", body=json.dumps({"parse": {"title": "socius", "text": WIKI}}), headers={"access-control-allow-origin": "*"})
        await ctx.route("https://en.wiktionary.org/**", wiki)
        page = await ctx.new_page(); errs = []
        page.on("pageerror", lambda e: errs.append(str(e)))
        await page.goto(URL); await page.wait_for_function(READY)
        await page.evaluate(BOOK); await page.reload(); await page.wait_for_function(READY)
        await page.evaluate("go({ screen: 'reader', textId: 'n' })"); await page.wait_for_selector(".book .bp"); await page.wait_for_timeout(700)

        async def tap_note(block, n):
            box = await page.evaluate(f"(() => {{ const r = R.els[{block}].querySelector('[data-fn=\"{n}\"]').getBoundingClientRect(); return [r.left + r.width / 2, r.top + r.height / 2]; }})()")
            pg0 = await page.evaluate("currentPage()")
            await page.touchscreen.tap(box[0], box[1]); await page.wait_for_timeout(400)
            return pg0
        # 1 notes
        pg0 = await tap_note(2, 1)
        txt = await page.inner_text(".sheet")
        check("Endnote one of the first chapter." in txt and "from the notes at the back" in txt and await page.evaluate("currentPage()") == pg0, f"tapping ¹ shows the endnote under the heading naming the chapter, and turns nothing ({txt.splitlines()[1][:50]!r})")
        check("1 other note numbered 1" in txt, "and offers the other note with that number")
        await page.click("#pclose"); await page.wait_for_timeout(300)
        await page.evaluate("goTo(6)"); await page.wait_for_timeout(300)
        await tap_note(7, 2)
        txt = await page.inner_text(".sheet")
        check("Endnote two of the second chapter." in txt, "a chapter whose notes heading doesn't name it gets its notes by its place in order")
        await page.click("[data-goto]"); await page.wait_for_timeout(500)
        at = await page.evaluate("R.blocks.findIndex((b) => (b.x || '').startsWith('2 Endnote two of the second'))")
        check(await page.evaluate(f"spotPage({{ i: {at}, f: 0 }}) === currentPage()") and await page.evaluate("R.visiting"), "Go to the note goes there, with the way back")
        await page.evaluate("trailBack()"); await page.wait_for_timeout(300)
        await page.evaluate("goTo(10)"); await page.wait_for_timeout(300)
        await tap_note(10, 3)
        txt = await page.inner_text(".sheet")
        check("A footnote at the foot of the page." in txt and "a footnote" in txt, "a footnote is found near its number")
        await page.click("#pclose"); await page.wait_for_timeout(300)

        # 2 the dictionary
        async def lookup(word):
            await page.evaluate(f"R.sel = {{ text: '{word}', i: 10, page: '3', sec: 'c3' }}; lookupPanel(R.sel)"); await page.wait_for_timeout(600)
            return await page.inner_text("#lk-dict")
        d = await lookup("socius")
        check("Latin" in d and "Noun" in d and "companion, comrade" in d and "partner, ally" in d and "Adjective" in d, f"Look up shows the definitions by language and part of speech ({d[:80]!r})")
        check("example sentence" not in d and "[1]" not in d and "Etymology" not in d and "a reference" not in d, "without examples, reference marks, etymology or references")
        check("action=parse" in calls[-1] and "origin=*" in calls[-1].replace("%2A", "*"), "it asks the MediaWiki API, from this page (origin=*)")
        await page.click("#pclose"); await page.wait_for_timeout(300)
        n0 = len(calls)
        await ctx.set_offline(True)
        d2 = await lookup("socius")
        check("companion, comrade" in d2 and len(calls) == n0, "a word looked up before is shown again offline")
        d3 = await lookup("other")
        check("offline" in d3, "a new word offline says so")
        await ctx.set_offline(False); await page.click("#pclose"); await page.wait_for_timeout(300)
        d4 = await lookup("Nonword"); check("no entry" in d4, f"a word Wiktionary doesn't have says so ({d4!r})")
        await page.click("#pclose"); await page.wait_for_timeout(300)
        d5 = await lookup("Broken"); check("Couldn't reach" in d5, f"a failed request says so ({d5!r})")

        # 3 your words
        await page.evaluate("""() => { const c = JSON.parse(localStorage.getItem('mg-dict') || '{}'), d = (pos, s) => ({ defs: [{ lang: 'English', pos, senses: s }], t: Date.now() });
          c.immanence = { title: 'immanence', ...d('Noun', ['The quality of being immanent; inherence.']) };
          c.rhizome = { title: 'rhizome', ...d('Noun', ['A horizontal stem of a plant that sends out roots and shoots from its nodes.']) };
          c.aporia = { title: 'aporia', ...d('Noun', ['An expression of doubt; a puzzle or impasse in an argument.']) };
          c.plateaus = { title: 'plateaus', ...d('Noun', ['plural of plateau']) };
          localStorage.setItem('mg-dict', JSON.stringify(c)); }""")
        await page.click("#pclose"); await page.wait_for_timeout(300)
        await page.evaluate("go({ screen: 'glossary' })"); await page.wait_for_timeout(300)
        await page.click("#mywords"); await page.wait_for_selector("#wbox")
        w = await page.inner_text("#wbox")
        check("socius" in w and "companion, comrade" in w and "rhizome" in w and "plateaus" not in w, f"Your words lists the words looked up with a definition each, leaving out ones that only point at another word ({w[:80]!r})")
        await page.click("[data-wquiz]"); await page.wait_for_selector(".qz-opt")
        q = await page.evaluate("[QZ.mode, QZ.qs.length, QZ.qs.every((x) => !x.prompt.toLowerCase().includes(x.wd.word.toLowerCase()))]")
        check(q == ["words", 4, True], f"Quiz on these words asks about each, the word blanked out ({q})")
        check(await page.locator("[data-qzmode=words].on").count() == 1, "the quiz shows Words you looked up as a kind of question")
        await page.click("#pclose"); await page.wait_for_timeout(200)
        await page.click("#mywords"); await page.wait_for_selector("#wbox")
        await page.click("[data-wforget=aporia]"); await page.wait_for_timeout(200)
        check("aporia" not in await page.inner_text("#wbox") and "aporia" not in await page.evaluate("Object.keys(dictCache())"), "Remove takes a word off the list")
        check(await page.locator("[data-wquiz]").count() == 0, "with fewer than four words there's no quiz on them")
        check(not errs, "no script errors" + (f": {errs[:3]}" if errs else ""))
        await ctx.close(); await browser.close()

server = subprocess.Popen([sys.executable, "-m", "http.server", str(PORT), "-d", str(ROOT)], stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
try:
    time.sleep(1); asyncio.run(main())
finally:
    server.terminate()
print(f"\n{len(failures)} failed" if failures else "\nall passed")
sys.exit(1 if failures else 0)
