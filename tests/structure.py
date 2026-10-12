"""Marking a book's structure in the reader. Run after changes to the reader or to Edit:  python3 tests/structure.py

Uses a made-up book shaped like a scanned PDF: a title page, running heads at the top of printed pages (with the page
number on either side), a chapter title glued to the start of its paragraph, and a chapter title broken over two
headings that the import took for two sections. Selects text the way a reader does, taps Edit, and checks that:
  1. hiding a running head offers the other lines like it (only those), hides them, and joins the paragraphs they split;
  2. a title glued to its paragraph becomes a chapter: drawn as a heading above the rest, starting a fresh page, in Sections;
  3. a title broken over two lines becomes one chapter with the name you give it; the extra section goes and its
     notes move with their passages; a note you filed yourself stays;
  4. a title page is centred and what follows it starts on a fresh page;
  5. Plain text takes a chapter off, and Undo puts everything back, notes included; Contents shows hidden lines again;
  6. a selection that can't be a title says why; marks survive a reload and show in Scroll mode; backups accept them;
  7. Edit text → Sections: renaming a line keeps its section; removing one stops it being a chapter in the text.
Needs: pip install playwright && playwright install chromium
"""
import asyncio, subprocess, sys, time
from pathlib import Path
from playwright.async_api import async_playwright

ROOT = Path(__file__).resolve().parent.parent
PORT = 8799
URL = f"http://localhost:{PORT}/index.html"
READY = "typeof idb !== 'undefined' && idb && S.mode === 'ready'"

BOOK = """(async () => {
  const B = [], long = 'Everywhere it is machines, real ones, not figurative ones, with all the necessary couplings and connections. ';
  B.push({ k: 'front', x: 'ANTI-OEDIPUS', size: 1.6, heading: true, space: 3 }, { k: 'front', x: 'Capitalism and Schizophrenia', size: 1.2 }, { k: 'front', x: 'Gilles Deleuze and Félix Guattari' });
  for (let n = 0; n < 3; n++) B.push({ k: 'p', x: 'Preface paragraph ' + n + '. ' + long.repeat(2) });
  let pg = 1;
  const page = () => { B.push({ k: 'pg', x: String(pg) }); B.push({ k: 'p', x: pg % 2 ? 'DESIRING-PRODUCTION ' + pg : pg + ' ANTI-OEDIPUS' }); pg++; };
  B.push({ k: 'pg', x: String(pg++) });
  B.push({ k: 'p', x: '1 Desiring-Production It is at work everywhere, functioning smoothly at times, at other times in fits and starts. ' + long });
  for (let n = 0; n < 8; n++) { B.push({ k: 'p', x: 'One/' + n + '. ' + long.repeat(1 + n % 2) + 'and a profound love of' }); page(); B.push({ k: 'c', x: 'life, and often enormously amusing (one/' + n + ').' }); }
  B.push({ k: 'pg', x: String(pg++) });
  B.push({ k: 'h', l: 2, x: '2 SAVAGES,', s: 's2a' }, { k: 'h', l: 2, x: 'BARBARIANS, CIVILIZED MEN', s: 's2b' });
  for (let n = 0; n < 8; n++) { B.push({ k: 'p', x: 'Two/' + n + '. ' + long.repeat(1 + n % 2) }); page(); }
  const at = (x) => B.findIndex((b) => (b.x || '').startsWith(x));
  await put('content', 's', B);
  await put('texts', 's', { title: 'Anti-Oedipus', author: 'Test', hasContent: true, total: B.length, pos: 0, status: 'reading', createdAt: 1, updatedAt: 1,
    sections: [{ id: 's2a', label: '2 SAVAGES,', done: false }, { id: 's2b', label: 'BARBARIANS, CIVILIZED MEN', done: true }] });
  await put('notes', 'n1', { textId: 's', kind: 'passage', passage: 'One/2', at: at('One/2'), sectionId: '', createdAt: 1, updatedAt: 1 });
  await put('notes', 'n2', { textId: 's', kind: 'passage', passage: 'Two/3', at: at('Two/3'), sectionId: 's2b', createdAt: 1, updatedAt: 1 });
  await put('notes', 'n3', { textId: 's', kind: 'passage', passage: 'Two/5', at: at('Two/5'), sectionId: 's2a', createdAt: 1, updatedAt: 1 });
  localStorage.setItem('mg-reader', JSON.stringify({ fs: 20, lh: 'normal', w: 'medium', tone: 'app', mn: 'show', flow: 'pages', turn: 'slide' }));
})()"""
AT = "(x) => R.blocks.findIndex((b) => (b.x || '').startsWith(x))"

failures = []
def check(ok, what):
    print(("ok   " if ok else "FAIL ") + what)
    if not ok: failures.append(what)

async def select(page, js):
    """Select text as a reader would (js builds a Range), then wait for the toolbar."""
    await page.evaluate(f"() => {{ const r = ({js})(); getSelection().removeAllRanges(); getSelection().addRange(r); }}")
    await page.wait_for_timeout(300)

async def edit_as(page, role):
    await page.click("#seledit"); await page.wait_for_selector(".fixopt")
    await page.click(f".fixopt[data-role={role}]"); await page.wait_for_timeout(250)

async def main():
    async with async_playwright() as p:
        browser = await p.chromium.launch()
        ctx = await browser.new_context(viewport={"width": 412, "height": 915}, device_scale_factor=2.625, is_mobile=True, has_touch=True)
        page = await ctx.new_page(); errs = []
        page.on("pageerror", lambda e: errs.append(str(e)))
        page.on("console", lambda m: m.type == "error" and "Failed to load resource" not in m.text and errs.append(m.text))
        await page.goto(URL); await page.wait_for_function(READY)
        await page.evaluate(BOOK); await page.reload(); await page.wait_for_function(READY)
        await page.evaluate("go({ screen: 'reader', textId: 's' })"); await page.wait_for_selector(".book .bp"); await page.wait_for_timeout(700)
        at = lambda x: page.evaluate(f"({AT})({x!r})")

        # 1 running heads
        rh = await page.evaluate("R.blocks.map((b, i) => [b, i]).filter(([b]) => b.k === 'p' && /^\\d+ ANTI-OEDIPUS$/.test(b.x)).map(([, i]) => i)")
        cut = await page.evaluate("(rh) => { const k = rh[1]; return { p: k - 2, c: k + 1, joined: R.els[k - 2].contains(R.els[k + 1]) }; }", rh)
        await select(page, f"() => {{ const r = document.createRange(); r.selectNodeContents(R.els[{rh[0]}]); return r; }}")
        check(await page.locator("#seledit").is_visible() and await page.locator("#seledit").inner_text() == "Edit", "selecting a line shows Edit in the toolbar")
        await page.click("#seledit"); await page.wait_for_selector(".fixopt")
        panel = await page.evaluate("() => ({ opts: [...document.querySelectorAll('.fixopt')].map((b) => b.dataset.role), now: document.querySelector('.fixopt.on')?.dataset.role })")
        check(panel["opts"] == ["chapter", "heading", "hide", "title", "text", "words"] and panel["now"] == "text", f"Edit offers chapter, heading, running head, title page, plain text and the wording ({panel})")
        await page.click(".fixopt[data-role=hide]"); await page.wait_for_selector(".likelist")
        offer = await page.inner_text(".sheet")
        check(f"other {len(rh) - 1} lines" in offer.replace("the ", "") or f"the {len(rh) - 1} other lines" in offer, f"hiding a running head offers the {len(rh) - 1} other lines like it")
        await page.click("button[type=submit]"); await page.wait_for_timeout(500)
        hid = await page.evaluate("""(rh) => ({ all: rh.every((k) => { const r = R.els[k].getBoundingClientRect(); return R.blocks[k].st === 'hide' && !R.els[k].textContent && r.width * r.height === 0; }),
            others: R.blocks.filter((b) => b.st === 'hide').length, odd: R.blocks.filter((b) => /^DESIRING-PRODUCTION \\d+$/.test(b.x || '') && b.st).length,
            stored: S.content.get('s').filter((b) => b.st === 'hide').length })""", rh)
        check(hid["all"] and hid["others"] == len(rh) and hid["odd"] == 0 and hid["stored"] == len(rh), f"all {len(rh)} '… ANTI-OEDIPUS' heads are hidden and saved; the other running head is left alone ({hid})")
        joined = await page.evaluate("(c) => R.els[c.p].contains(R.els[c.c]) && R.els[c.p].tagName === 'P'", cut)
        check(not cut["joined"] and joined, "the paragraph a hidden running head interrupted is joined up again")
        check("hidden" in await page.inner_text("#toast") and await page.locator(".toastbtn").inner_text() == "Undo", "a toast says so, with Undo")

        # 2 a chapter title glued to its paragraph
        g = await at("1 Desiring-Production")
        await select(page, f"() => {{ const t = R.els[{g}].querySelector('.pgm') ? [...R.els[{g}].childNodes].find((n) => n.nodeType === 3) : R.els[{g}].firstChild; const r = document.createRange(); r.setStart(t, 0); r.setEnd(t, '1 Desiring-Production'.length); return r; }}")
        await edit_as(page, "chapter"); await page.wait_for_selector("#ch-name")
        check(await page.input_value("#ch-name") == "1 Desiring-Production", "a chapter title starts with its words as its name in Sections")
        await page.click("button[type=submit]"); await page.wait_for_timeout(500)
        gl = await page.evaluate(f"""() => {{ const b = R.blocks[{g}], el = R.els[{g}], t = S.texts.get('s');
            return {{ st: b.st, sth: b.sth, cls: el.className, head: el.querySelector('h2')?.textContent, rest: el.querySelector('p')?.textContent.slice(0, 9),
              secs: t.sections.map((s) => s.label), first: t.sections[0].id === b.s, n1: S.notes.get('n1').sectionId === b.s, chap: R.chap.has({g}) || R.chap.has({g} - 1) }}; }}""")
        check(gl["st"] == "chapter" and gl["sth"] == 21 and gl["head"] == "1 Desiring-Production" and gl["rest"].strip().startswith("It is at"), f"it is drawn as a heading above the rest of the paragraph ({gl['head']!r} / {gl['rest']!r})")
        check(gl["secs"] == ["1 Desiring-Production", "2 SAVAGES,", "BARBARIANS, CIVILIZED MEN"] and gl["first"], f"Sections lists it first, in reading order ({gl['secs']})")
        check(gl["n1"], "a note in that chapter is filed under it")
        top = await page.evaluate(f"""() => {{ const el = R.els[{g}], book = document.querySelector('#book'), W = pageStride(), x0 = book.getBoundingClientRect().left - book.scrollLeft + 24;
            const r = el.getClientRects()[0], prev = screenPagesOf({g} - 2); return {{ page: Math.round((r.left - x0) / W), prevLast: prev[1], dTop: Math.round(r.top - book.getBoundingClientRect().top), mark: Math.round(R.els[{g} - 1].getBoundingClientRect().top - book.getBoundingClientRect().top) }}; }}""")
        check(gl["chap"] and top["page"] == top["prevLast"] + 1 and top["mark"] < 30 and top["dTop"] < 60, f"in Swipe pages the chapter starts on a fresh page, its page marker with it ({top})")
        off = await page.evaluate(f"() => {{ const p = R.els[{g}].querySelector('p'); return offsetIn({g}, p.firstChild, 0); }}")
        check(off == 21, f"a selection in the rest of the paragraph is measured from the start of the block ({off})")

        # 3 a chapter title broken over two headings
        a, b = await at("2 SAVAGES"), await at("BARBARIANS")
        await select(page, f"() => {{ const r = document.createRange(); r.setStart(R.els[{a}].firstChild, 0); r.setEnd(R.els[{b}].firstChild, 'BARBARIANS, CIVILIZED MEN'.length); return r; }}")
        await edit_as(page, "chapter"); await page.wait_for_selector("#ch-name")
        check(await page.input_value("#ch-name") == "2 SAVAGES,", "a title already in Sections keeps its name there")
        await page.fill("#ch-name", "2 Savages, Barbarians, Civilized Men"); await page.click("button[type=submit]"); await page.wait_for_timeout(500)
        two = await page.evaluate(f"""() => {{ const t = S.texts.get('s'), el = R.els[{a}];
            return {{ secs: t.sections.map((s) => [s.id === 's2a' ? 's2a' : '·', s.label]), one: el.tagName === 'H2' && el.contains(R.els[{b}]), text: el.textContent,
              n2: S.notes.get('n2').sectionId, n3: S.notes.get('n3').sectionId, stj: R.blocks[{b}].stj === true && !R.blocks[{b}].s }}; }}""")
        check(two["secs"] == [["·", "1 Desiring-Production"], ["s2a", "2 Savages, Barbarians, Civilized Men"]], f"Sections: the two lines are one chapter with the name given; the extra section is gone ({two['secs']})")
        check(two["one"] and two["stj"] and two["text"] == "2 SAVAGES, BARBARIANS, CIVILIZED MEN", f"the two lines are drawn as one title ({two['text']!r})")
        check(two["n2"] == "s2a" and two["n3"] == "s2a", f"notes from the section that went move to the chapter their passage is in ({two['n2']}, {two['n3']})")
        await page.click("#rtoc"); await page.wait_for_selector(".tocitem")
        toc = await page.evaluate("[...document.querySelectorAll('.toc .tocitem:not(.bm) span:first-child')].map((x) => x.textContent)")
        check(toc == ["1 Desiring-Production", "2 Savages, Barbarians, Civilized Men"], f"Contents follows the chapters ({toc})")
        await page.click("#pclose"); await page.wait_for_timeout(300)

        # 4 title page
        await select(page, "() => { const r = document.createRange(); r.setStart(R.els[0].firstChild, 0); r.setEnd(R.els[2].firstChild, 5); return r; }")
        await edit_as(page, "title"); await page.wait_for_timeout(400)
        tp = await page.evaluate("""() => { const book = document.querySelector('#book'), W = pageStride(), x0 = book.getBoundingClientRect().left - book.scrollLeft + 24, p = R.els[3].getClientRects()[0];
            return { st: [0, 1, 2].map((k) => R.blocks[k].st), centred: getComputedStyle(R.els[0]).textAlign, page: Math.round((p.left - x0) / W), dTop: Math.round(p.top - book.getBoundingClientRect().top), chap: R.chap.has(3) }; }""")
        check(tp["st"] == ["title"] * 3 and tp["centred"] == "center", f"the title page lines are centred ({tp['centred']})")
        check(tp["chap"] and tp["page"] == 1 and tp["dTop"] < 40, f"the preface starts on the page after the title page ({tp})")

        # 5 plain text, then Undo
        before = await page.evaluate("() => ({ secs: JSON.stringify(S.texts.get('s').sections), notes: ['n1', 'n2', 'n3'].map((k) => S.notes.get(k).sectionId) })")
        await select(page, f"() => {{ const r = document.createRange(); r.setStart(R.els[{a}].firstChild, 0); r.setEnd(R.els[{a}].firstChild, 4); return r; }}")
        await page.click("#seledit"); await page.wait_for_selector(".fixopt.on")
        check(await page.get_attribute(".fixopt.on", "data-role") == "chapter", "Edit shows what the words are now")
        await page.click(".fixopt[data-role=text]"); await page.wait_for_timeout(500)
        pl = await page.evaluate(f"() => ({{ secs: S.texts.get('s').sections.length, tag: R.els[{a}].tagName, two: R.els[{b}].tagName, n2: S.notes.get('n2').sectionId === S.texts.get('s').sections[0].id }})")
        check(pl["secs"] == 1 and pl["tag"] == "P" and pl["n2"], f"Plain text takes the chapter off: one section left, its notes go to the chapter before ({pl})")
        await page.click(".toastbtn"); await page.wait_for_timeout(500)
        after = await page.evaluate("() => ({ secs: JSON.stringify(S.texts.get('s').sections), notes: ['n1', 'n2', 'n3'].map((k) => S.notes.get(k).sectionId) })")
        stored = await page.evaluate(f"idbGet('content', 's').then((B) => [B[{a}].st, B[{b}].stj])")
        check(after == before and stored == ["chapter", True], "Undo puts the chapter, its section and its notes back, also in storage")

        # 6 what can't be a title; reload; Scroll mode; backups
        await select(page, f"() => {{ const el = R.els[{await at('Two/2')}], t = [...el.childNodes].find((n) => n.nodeType === 3); const r = document.createRange(); r.setStart(t, 10); r.setEnd(t, 30); return r; }}")
        await edit_as(page, "chapter")
        check("first word" in await page.inner_text("#toast"), "words from the middle of a paragraph can't be a chapter title, and the toast says why")
        await page.click("#rtoc"); await page.wait_for_selector("#toc-unhide")
        check(f"{len(rh)} running heads are hidden" in await page.inner_text(".sheet"), "Contents says how many running heads are hidden")
        await page.click("#toc-unhide"); await page.wait_for_timeout(500)
        shown = await page.evaluate("(rh) => rh.every((k) => !R.blocks[k].st && R.els[k].textContent.includes('ANTI-OEDIPUS'))", rh)
        await page.click(".toastbtn"); await page.wait_for_timeout(500)
        back = await page.evaluate("(rh) => rh.every((k) => R.blocks[k].st === 'hide')", rh)
        check(shown and back, "…and can show them all again, with Undo (a hidden line can't be selected)")
        await page.reload(); await page.wait_for_function(READY)
        await page.evaluate("go({ screen: 'reader', textId: 's' })"); await page.wait_for_selector(".book .bp"); await page.wait_for_timeout(600)
        rl = await page.evaluate(f"() => ({{ hidden: R.blocks.filter((b) => b.st === 'hide').length, split: R.els[{g}].className, title: R.els[{a}].contains(R.els[{b}]), page: R.els[0].className }})")
        check(rl["hidden"] == len(rh) and rl["split"].startswith("bsplit") and rl["title"] and "btitle" in rl["page"], f"everything marked is still there after a reload ({rl})")
        await page.evaluate("setRS({ flow: 'scroll' })"); await page.wait_for_timeout(400)
        sc = await page.evaluate(f"""(rh) => ({{ hidden: rh.every((k) => R.els[k].offsetHeight === 0), split: !!R.els[{g}].querySelector('h2'), title: R.els[{a}].contains(R.els[{b}]),
            order: R.tops.length === R.blocks.length && R.els.every(Boolean), chap: document.querySelectorAll('#book .chap').length }})""", rh)
        check(sc["hidden"] and sc["split"] and sc["title"] and sc["order"] and sc["chap"] == 0, f"Scroll mode shows the same structure, without page breaks ({sc})")
        sp = await page.evaluate(f"goTo({rh[2]}); currentSpot().i")
        check(abs(sp - rh[2]) <= 2, f"going to a hidden line lands where it was ({sp} for {rh[2]})")
        check(await page.evaluate("VALID.content(S.content.get('s'))"), "a backup with marked structure passes the restore check")
        await page.evaluate("setRS({ flow: 'pages' })"); await page.wait_for_timeout(300)

        # 7 Edit text → Sections
        await page.evaluate("go({ screen: 'text', textId: 's' })"); await page.wait_for_timeout(300)
        await page.evaluate("textSheet('s')"); await page.wait_for_selector("#f-secs")
        ids = await page.evaluate("S.texts.get('s').sections.map((s) => s.id)")
        await page.fill("#f-secs", "Desiring-Production\n2 Savages, Barbarians, Civilized Men"); await page.click("button[type=submit]"); await page.wait_for_timeout(400)
        ren = await page.evaluate("S.texts.get('s').sections.map((s) => [s.id, s.label])")
        check([x[0] for x in ren] == ids and ren[0][1] == "Desiring-Production", f"renaming a line in Sections keeps the section, so the chapter in the text keeps its name ({ren})")
        await page.evaluate("textSheet('s')"); await page.wait_for_selector("#f-secs")
        await page.fill("#f-secs", "2 Savages, Barbarians, Civilized Men"); await page.click("button[type=submit]"); await page.wait_for_timeout(400)
        rm = await page.evaluate(f"idbGet('content', 's').then((B) => ({{ s: B[{g}].s || null, st: B[{g}].st, secs: S.texts.get('s').sections.length }}))")
        check(rm == {"s": None, "st": "heading", "secs": 1}, f"removing a line stops that chapter being a section in the text; its title stays as a heading ({rm})")

        check(not errs, "no script errors" + (f": {errs[:3]}" if errs else ""))
        await page.evaluate("go({ screen: 'reader', textId: 's' })"); await page.wait_for_timeout(600)
        await page.evaluate(f"goTo({g})"); await page.wait_for_timeout(300); await page.screenshot(path="/tmp/structure-chapter.png")
        await page.evaluate("goTo(0)"); await page.wait_for_timeout(300); await page.screenshot(path="/tmp/structure-title.png")
        await ctx.close(); await browser.close()

server = subprocess.Popen([sys.executable, "-m", "http.server", str(PORT), "-d", str(ROOT)], stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
try:
    time.sleep(1); asyncio.run(main())
finally:
    server.terminate()
print(f"\n{len(failures)} failed" if failures else "\nall passed")
sys.exit(1 if failures else 0)
