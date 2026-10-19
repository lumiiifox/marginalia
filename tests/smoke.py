"""Smoke test for Marginalia. Run before pushing:  python3 tests/smoke.py

Uses made-up records only (never real books). Checks that:
  1. every screen renders at phone and desktop width without script errors or sideways scrolling;
  2. a book opens in the reader from its Read button;
  3. Save backup -> delete the database -> Restore gives back exactly the same library, and it survives a reload;
  4. a backup made to run script (markup in fields the app draws) is refused, and such records already stored draw as text;
  5. Quiz yourself: ten questions from the glossary (the term blanked out of its definition), from one area when one is
     chosen, and "Who wrote it?" from the thinkers' works with no co-author among the wrong answers; a score at the end;
  6. the home screen has one button for the glossary, branches and thinkers, opening all three as one list: every entry,
     filters for each, search across them, rows that open their entry, and links to each full screen;
     Thinkers is its own screen (the glossary no longer lists thinkers as an area): in order of birth or on a timeline,
     every dated life read from its dates line, each period on its own scale; a period in the list opens the timeline
     there; search; its quiz asks who wrote what; a thinker's card lists who lived at the same time.
  7. every file index.html loads (css/, js/, data/) is in the service worker's list, and the app opens offline from it.
Needs: pip install playwright && playwright install chromium
"""
import asyncio, json, subprocess, sys, time
from pathlib import Path
from playwright.async_api import async_playwright

ROOT = Path(__file__).resolve().parent.parent
PORT = 8799
URL = f"http://localhost:{PORT}/index.html"
STORES = ["texts", "notes", "content", "drafts", "compares", "terms"]

SEED = """async () => {
  const now = Date.now();
  await put("texts", "t1", { title: "Test Book", author: "Author, Test", sections: [{ id: "s1", label: "Ch. 1" }], bookmarks: [{ at: 1 }], summaries: { s1: "summary" }, next: "Work out why the paragraph comes first", source: { name: "test.pdf", kind: "PDF", pages: 12 }, pos: 0, hasContent: true, conc: { label: "Minuit", pairs: [["2", "9"], ["12", "20"]] }, pair: "t2", days: { "2026-10-01": [600, 2400], "2026-10-02": [90, 300] }, createdAt: now, updatedAt: now, readAt: now });
  await put("content", "t1", [{ k: "p", x: "First paragraph of the test text." }, { k: "p", x: "Second paragraph." },
    // structure marked in the reader (Edit): a hidden running head, a chapter title over two lines, a title glued to its paragraph
    { k: "pg", x: "2" }, { k: "p", x: "2 TEST BOOK", st: "hide" }, { k: "h", l: 2, x: "Chapter", st: "chapter", s: "s1" }, { k: "h", l: 2, x: "two", stj: true },
    { k: "p", x: "Part A Then the paragraph.", st: "heading", sth: 6 }, { k: "front", x: "A title page", st: "title" },
    { k: "front", x: "Front matter line", size: 1.4, space: 2.5, heading: true }]);
  await put("notes", "n1", { textId: "t1", kind: "passage", passage: "paragraph", gloss: "a gloss #tag", page: "12", links: [], at: 0, createdAt: now, updatedAt: now,
    followups: [{ id: "f1", at: now, x: "A later thought" }], was: [{ at: now - 86400000, gloss: "an earlier gloss" }], wordAt: now });
  await put("drafts", "d1", { title: "Draft", items: [{ t: "h", x: "Heading" }, { t: "note", id: "n1" }], createdAt: now, updatedAt: now });
  await put("compares", "c1", { title: "Comparison", q: "Question?", verdict: "Conclusion", cols: [{ id: "a", label: "A" }], rows: [{ id: "r1", q: "row" }], cells: { "r1:a": { x: "cell", notes: ["n1"] } }, createdAt: now, updatedAt: now });
  await put("terms", "g1", { t: "Test term", d: "a definition", createdAt: now, updatedAt: now });
}"""
DUMP = "async (st) => { const o = {}; for (const s of st) o[s] = Object.fromEntries(await idbAll(s)); return o; }"
READY = "typeof idb !== 'undefined' && idb"
SCREENS = [("library", {}), ("text", {"textId": "t1"}), ("glossary", {}), ("branches", {}), ("thinkers", {}), ("reference", {}), ("tag", {"tag": "tag"}),
           ("questions", {}), ("drafts", {}), ("draft", {"draftId": "d1"}), ("concord", {}), ("compares", {}), ("compare", {"cmpId": "c1"}), ("paths", {}), ("plates", {}), ("disputes", {})]

failures = []
def check(ok, what):
    print(("ok   " if ok else "FAIL ") + what)
    if not ok: failures.append(what)

async def fresh_page(browser, w, h):
    page = await browser.new_page(viewport={"width": w, "height": h}, accept_downloads=True)
    errs = []
    page.on("pageerror", lambda e: errs.append(str(e)))
    # Fonts and libraries fail to load without network; only script errors from the app count.
    page.on("console", lambda m: m.type == "error" and "Failed to load resource" not in m.text and errs.append(m.text))
    await page.route("https://commons.wikimedia.org/**", lambda r: r.abort())  # entries' pictures: never fetched for real by the tests
    await page.goto(URL); await page.wait_for_function(READY)
    await page.evaluate(SEED)
    return page, errs

# The app is split into files (css/, js/, data/): every one of them must be in the service worker's SHELL, or the app can't open offline.
async def offline(browser):
    import re
    html = (ROOT / "index.html").read_text(encoding="utf-8")
    local = sorted(set(re.findall(r'<(?:script src|link rel="stylesheet" href)="((?:js|css|data)/[^"]+)"', html)))
    shell = re.search(r"const SHELL = (\[[^\]]*\])", (ROOT / "sw.js").read_text(encoding="utf-8")).group(1)
    listed = set(re.findall(r'"\./([^"]+)"', shell))
    check(local and all(f in listed for f in local) and all((ROOT / f).exists() for f in listed), f"every file index.html loads is kept for offline ({[f for f in local if f not in listed]} missing)")
    ctx = await browser.new_context(viewport={"width": 390, "height": 844}); page = await ctx.new_page(); errs = []
    page.on("pageerror", lambda e: errs.append(str(e)))
    await page.goto(URL); await page.wait_for_function(READY)
    await page.evaluate("navigator.serviceWorker.register('sw.js').then(() => navigator.serviceWorker.ready)")
    await page.reload(); await page.wait_for_function(READY)
    controlled = await page.evaluate("!!navigator.serviceWorker.controller")
    await ctx.set_offline(True)
    await page.reload(); ok = True
    try: await page.wait_for_function(READY, timeout=10000)
    except Exception: ok = False
    shown = await page.evaluate("document.querySelector('#main').innerText.length > 50") if ok else False
    check(controlled and ok and shown and not errs, f"offline, the app opens from the service worker's copy ({controlled}, {ok}, {shown}, {errs})")
    await ctx.close()

async def main():
    async with async_playwright() as p:
        browser = await p.chromium.launch()
        for w, h in [(390, 844), (1280, 800)]:
            page, errs = await fresh_page(browser, w, h)
            for name, extra in SCREENS:
                n = len(errs)
                r = await page.evaluate("""([s, x]) => { try { Object.assign(S, x, { screen: s }); render();
                    return { ok: true, hs: document.documentElement.scrollWidth > innerWidth }; } catch (e) { return { ok: false, err: String(e) }; } }""", [name, extra])
                check(r["ok"] and not r["hs"] and len(errs) == n, f"{w}px {name}" + ("" if r["ok"] else f": {r['err']}") + (" (scrolls sideways)" if r.get("hs") else "") + (f" {errs[n:]}" if len(errs) > n else ""))
            if w == 390:
                figs = await page.evaluate("[GLOSSARY.filter((g) => g.fig && !FIGURES[g.fig]).map((g) => g.id), Object.keys(FIGURES).filter((k) => !GLOSSARY.some((g) => g.fig === k)), (() => { S.gOpen = new Set(GLOSSARY.filter((g) => g.fig).map((g) => g.id)); go({ screen: 'glossary' }); return document.querySelectorAll('.dsvg svg').length; })()]")
                check(figs[0] == [] and figs[1] == [] and figs[2] == len(await page.evaluate("Object.keys(FIGURES)")), f"every glossary diagram belongs to a term and draws ({figs})")
                await page.evaluate("S.gOpen = new Set()")
                home = await page.evaluate("(() => { go({ screen: 'library' }); return [!!document.querySelector('.nudge'), !!document.querySelector('#backup')]; })()")
                check(home == [False, True], f"the home screen has no backup reminder, and Save backup stays in Backups and exports ({home})")
            await page.evaluate("S.screen = 'text'; S.textId = 't1'; render()")
            await page.click("#read"); await page.wait_for_timeout(500)
            check("First paragraph" in await page.inner_text("#reader") and not errs, f"{w}px reader opens the book")
            await page.close()

        page, errs = await fresh_page(browser, 390, 844)
        await page.evaluate("put('texts', 't1', { ...S.texts.get('t1'), rank: 2 })") # a book's place on its arranged shelf travels with the backup
        before = await page.evaluate(DUMP, STORES)
        async with page.expect_download() as dl: await page.evaluate("exportBackup()")
        backup = await (await dl.value).path()
        await page.evaluate("new Promise((r) => { idb.close(); const q = indexedDB.deleteDatabase('marginalia'); q.onsuccess = q.onerror = q.onblocked = () => r(); })")
        await page.reload(); await page.wait_for_function(READY)
        empty = await page.evaluate(DUMP, STORES)
        check(all(not v for v in empty.values()), "database wiped before restore")
        await page.evaluate("(txt) => importBackup(new File([txt], 'backup.json'))", Path(backup).read_text())
        await page.click("#rs-merge"); await page.wait_for_timeout(500)
        check(await page.evaluate(DUMP, STORES) == before, "restore gives back the same library")
        await page.reload(); await page.wait_for_function(READY)
        check(await page.evaluate(DUMP, STORES) == before, "restored library survives a reload")
        check(not errs, "no script errors during backup and restore" + (f": {errs}" if errs else ""))

        # 4 markup in a crafted backup
        bad = {"app": "marginalia", "version": 5, "texts": {"x1": {"title": "X", "source": {"name": "a.pdf", "pages": "<img src=x onerror=\"window.__xss=1\">"}}},
               "content": {"x1": [{"k": "p", "x": "Words here.", "st": "hide", "sth": "\"><img src=x onerror=\"window.__xss=1\">"}]}}
        plan = await page.evaluate("(d) => { const p = planRestore(d); return [p.skipped, p.rows.texts.length, p.content.length]; }", bad)
        check(plan == [2, 0, 0], f"a backup with markup where a number belongs is refused ({plan})")
        await page.evaluate("""async () => {
          await put('content', 'x1', [{ k: 'pg', x: '1' }, { k: 'p', x: 'Head words and the paragraph go on.', st: 'hide', sth: '"><img src=x onerror="window.__xss=1">' }, { k: 'p', x: 'More.' }]);
          await put('texts', 'x1', { title: 'X', hasContent: true, total: 3, pos: 0, createdAt: 1, updatedAt: 1, source: { name: 'a.pdf', pages: '<img src=x onerror="window.__xss=1">' } });
        }""")
        await page.evaluate("go({ screen: 'text', textId: 'x1' })"); await page.wait_for_timeout(300)
        await page.evaluate("go({ screen: 'reader', textId: 'x1' })"); await page.wait_for_timeout(600)
        check(not await page.evaluate("!!window.__xss") and not await page.evaluate("!!document.querySelector('#reader img, .srcline img')"), "markup already stored in those fields is drawn as text")

        # 5 the quiz
        page, errs = await fresh_page(browser, 390, 844)
        await page.evaluate("go({ screen: 'glossary' })"); await page.wait_for_timeout(200)
        await page.click("#quiz"); await page.wait_for_selector(".qz-opt")
        for k in range(10):
            await page.click(".qz-opt >> nth=0"); await page.wait_for_selector("[data-qznext]")
            if k == 0: check(await page.locator(".qz-opt.right").count() == 1, "an answer shows which option was right")
            await page.click("[data-qznext]"); await page.wait_for_timeout(50)
        txt = await page.inner_text("#quizbox")
        check(" of 10" in txt and "right" in txt and "Another ten" in txt, f"ten questions end in a score ({txt.splitlines()[3:4]})")
        leaks = await page.evaluate("""() => { quizStart('def', 'all'); let bad = []; for (let r = 0; r < 20; r++) { quizStart('def', 'all');
            for (const q of QZ.qs) { const t = q.g.t.replace(/\\s*\\(.*?\\)\\s*/g, ' ').trim(); if (t.length > 4 && q.prompt.toLowerCase().includes(t.toLowerCase())) bad.push(t); } } return bad; }""")
        check(not leaks, f"a definition never names its own term ({leaks[:3]})")
        area = await page.evaluate("() => { quizStart('def', 'ethics'); return [...new Set(QZ.qs.map((q) => q.g.a))]; }")
        check(area == ["ethics"], f"a quiz from one area asks only about its terms ({area})")
        work = await page.evaluate("""() => { const bad = []; for (let r = 0; r < 40; r++) { quizStart('work', 'all'); for (const q of QZ.qs) {
            if (q.opts.length !== 4 || !q.opts[q.answer]) bad.push('shape'); if (/^Plato,|^Aristotle,/.test(q.prompt.replace(/<[^>]+>/g, '').replace('Who wrote ', ''))) bad.push(q.prompt);
            const wrong = q.opts.filter((_, i) => i !== q.answer);
            for (const o of wrong) { const x = THINKERS.find((p) => esc(p.n) === o); const t = q.prompt.replace(/<[^>]+>/g, '').replace(/^Who wrote /, '').replace(/ \\(\\d+\\)\\?$|\\?$/, '').toLowerCase();
              if (x && x.w.some((w) => w.replace(/\\s*\\(.*$/, '').trim().toLowerCase() === t)) bad.push(o + ' also wrote ' + t); } } } return bad; }""")
        check(not work, f"Who wrote it? has one right answer and no co-author among the others ({work[:3]})")
        await page.click("#pclose"); await page.wait_for_timeout(200)
        await page.evaluate("go({ screen: 'reference' })"); await page.wait_for_timeout(200)
        await page.click("#quiz"); await page.wait_for_selector(".qz-opt")
        check(await page.locator(".qz-opt").count() == 4, "the glossary, branches and thinkers list opens the quiz too")
        check(not errs, "no script errors in the quiz" + (f": {errs}" if errs else ""))

        # 6 the timeline
        await page.evaluate("document.querySelector('#pclose') && document.querySelector('#pclose').click()"); await page.wait_for_timeout(200)
        spans = await page.evaluate("""() => { const bad = [], none = []; for (const p of THINKERS) { const s = lifeSpan(p.y);
            if (!s) { none.push(p.y); continue; } if (!(s.a < s.b) || s.b - s.a > (s.approx ? 200 : 130) || s.a < -700 || s.b > 2100) bad.push(p.y + ' ' + JSON.stringify(s)); } return { bad, none: none.filter(Boolean) }; }""")
        check(not spans["bad"] and not spans["none"], f"every dates line reads as a life ({spans})")
        got = await page.evaluate("[lifeSpan('c. 428–348 BCE'), lifeSpan('2nd–3rd c. CE'), lifeSpan('early 5th c. BCE'), lifeSpan('b. 1929').open, lifeSpan('1724–1804')]")
        check(got[0] == {"a": -428, "b": -348, "approx": True, "open": False} and got[1]["a"] == 100 and got[1]["b"] == 300 and got[2]["a"] == -500 and got[2]["b"] == -460 and got[3] and got[4]["a"] == 1724,
              f"BCE dates, centuries and living thinkers are read right ({got[:3]})")
        await page.evaluate("go({ screen: 'library' })"); await page.wait_for_timeout(200)
        heads = await page.evaluate("[...document.querySelectorAll('.home-sec h2')].map((h) => h.textContent)")
        cards = await page.evaluate("[...document.querySelectorAll('.refcard[data-ref]')].map((c) => [c.dataset.ref, c.querySelector('.rc-t').textContent])")
        check(not any(h in heads for h in ("Glossary", "Branches", "Thinkers")) and cards == [["glossary", "Glossary"], ["branches", "Branches"], ["thinkers", "Thinkers"]],
              f"the home screen has three buttons: Glossary, Branches, Thinkers ({cards})")
        rows = "[document.querySelectorAll('.refrow[data-term]').length, document.querySelectorAll('.refrow[data-branch]').length, document.querySelectorAll('.refrow[data-thinker]').length]"
        n = await page.evaluate("[allTerms().length, BRANCHES.length, THINKERS.length]")
        for k, want, title in (("glossary", [n[0], 0, 0], "Glossary"), ("branches", [0, n[1], 0], "Branches"), ("thinkers", [0, 0, n[2]], "Thinkers")):
            await page.evaluate("go({ screen: 'library' })"); await page.wait_for_timeout(200)
            await page.click(f".refcard[data-ref={k}]"); await page.wait_for_selector(".refrow")
            got = await page.evaluate(rows)
            check(got == want and await page.inner_text("h1") == title, f"{title} opens all of its entries as a list, and only those ({got})")
        await page.click("[data-rk=all]"); await page.fill("#rq", "kant"); await page.wait_for_timeout(400)
        kinds = await page.evaluate("['term', 'branch', 'thinker'].map((k) => document.querySelectorAll(`.refrow[data-${k}]`).length)")
        check(all(kinds), f"searching finds terms, branches and thinkers together ({kinds})")
        await page.click(".refrow[data-thinker=kant]"); await page.wait_for_selector(".sheet")
        check("Critique of Pure Reason" in await page.inner_text(".sheet"), "a thinker's row opens their card")
        await page.click("#pclose"); await page.wait_for_timeout(200)
        await page.click(".refrow[data-term] >> nth=0"); await page.wait_for_timeout(300)
        check(await page.evaluate("S.screen") == "glossary" and await page.locator("details.term[open]").count() == 1, "a term's row opens it in the glossary")
        await page.evaluate("back()"); await page.wait_for_timeout(300)
        check(await page.evaluate("S.screen") == "reference" and await page.input_value("#rq") == "kant", "Back returns to the list as it was")
        await page.fill("#rq", ""); await page.wait_for_timeout(400)
        await page.click("#openthinkers"); await page.wait_for_selector("#pq")
        check(await page.evaluate("S.screen") == "thinkers", "each group opens its full screen")
        await page.evaluate("go({ screen: 'glossary' })"); await page.wait_for_timeout(200)
        check(await page.locator("[data-area=thinkers]").count() == 0, "the glossary no longer has Thinkers among its areas")
        await page.evaluate("go({ screen: 'reference' })"); await page.wait_for_timeout(200)
        await page.click("[data-era='Medieval']"); await page.wait_for_selector(".tl-row"); await page.wait_for_timeout(200)
        top = await page.evaluate("Math.round(document.querySelector('section.tl-era[data-era=\"Medieval\"]').getBoundingClientRect().top)")
        check(await page.evaluate("S.screen") == "thinkers" and abs(top) < 5, f"a period in the list opens the timeline at that period ({top})")
        await page.click("[data-tl='0']"); await page.wait_for_selector(".thinkrow")
        await page.fill("#pq", "critique of pure"); await page.wait_for_timeout(400)
        check(await page.evaluate("[...document.querySelectorAll('.thinkrow')].map((r) => r.dataset.thinker)") == ["kant"], "searching Thinkers finds a thinker by a work's title")
        await page.fill("#pq", ""); await page.wait_for_timeout(400)
        await page.click("#quiz"); await page.wait_for_selector(".qz-opt")
        check(await page.evaluate("QZ.mode") == "work", "Who wrote it? on Thinkers starts that quiz")
        await page.click("#pclose"); await page.wait_for_timeout(200)
        await page.click("[data-tl='1']"); await page.wait_for_selector(".tl-row")
        tl = await page.evaluate("""() => ({ rows: document.querySelectorAll('.tl-row').length, eras: [...document.querySelectorAll('.tl-era h3')].map((h) => h.textContent),
            dated: THINKERS.filter((p) => lifeSpan(p.y)).length, wide: document.documentElement.scrollWidth > innerWidth })""")
        check(tl["rows"] == tl["dated"] and tl["eras"][0].startswith("Ancient") and "Contemporary" in tl["eras"] and not tl["wide"], f"Timeline shows every dated thinker by period, without sideways scrolling ({tl['rows']} of {tl['dated']}, {tl['eras']})")
        await page.click(".tl-row[data-thinker='kant']"); await page.wait_for_selector(".sheet")
        card = (await page.inner_text(".sheet")).lower()
        check("lived at the same time" in card and "hume" in card.split("lived at the same time")[1], "Kant's card lists Hume among those who lived at the same time")
        await page.click("#pclose"); await page.wait_for_timeout(200)
        # every longer account: drawn as its paragraphs, no stray backslash-n, its sources linked
        bios = await page.evaluate("""() => THINKERS.filter((p) => p.x).map((p) => { thinkerPanel(p.id); const sh = document.querySelector('.sheet'), paras = sh.querySelectorAll('.tmore');
            const links = [...sh.querySelectorAll('.tsrc a')].map((a) => a.href); const r = { id: p.id, paras: paras.length, want: p.x.split(/\\n\\s*\\n/).filter((x) => x.trim()).length,
            slash: /\\\\n|\\n/.test([...paras].map((x) => x.textContent).join('')) || p.x.includes('\\\\n'), links: links.length, ok: links.every((h) => /^https:\\/\\//.test(h)) };
            document.querySelector('#pclose').click(); return r; })""")
        bad = [b for b in bios if b["paras"] != b["want"] or b["slash"] or not b["links"] or not b["ok"]]
        check(len(bios) >= 18 and not bad, f"all {len(bios)} longer accounts show as paragraphs with no stray \\n, and link their sources ({bad[:3]})")
        sina = await page.evaluate("(() => { thinkerPanel('ibnsina'); const h = [...document.querySelectorAll('.sheet .tsrc a')].map((a) => a.href); document.querySelector('#pclose').click(); return h; })()")
        check(len(sina) == 2 and "self-consciousness" in sina[1], f"Ibn Sīnā's card lists the second source for the flying man ({sina})")
        await page.wait_for_timeout(300); await page.click(".tl-row[data-thinker='kant']"); await page.wait_for_selector(".sheet")
        src = await page.evaluate("(() => { const a = document.querySelector('.sheet .tsrc a'); return [!!document.querySelector('.sheet .tmore'), a && a.href, a && a.target]; })()")
        check(src == [True, "https://plato.stanford.edu/entries/kant/", "_blank"], f"a thinker with a longer account shows it, with its source linked ({src})")
        check(not errs, "no script errors on the timeline" + (f": {errs}" if errs else ""))
        # where you left off: page, chapter, summary, open questions, latest notes; a book not started yet has no brief
        await page.evaluate("""(async () => { const t = S.texts.get('t1'); await put('texts', 't1', { ...t, pos: 7 });
          await put('notes', 'q1', { textId: 't1', kind: 'question', passage: 'Then the paragraph', gloss: 'Why this?', page: '2', at: 6, createdAt: Date.now() + 5, updatedAt: Date.now() + 5 });
          S.content.delete('t1'); go({ screen: 'text', textId: 't1' }); })()""")
        await page.wait_for_function("!!document.querySelector('#bsum')", timeout=5000)
        brief = await page.evaluate("""(() => { const b = document.querySelector('.brief'); return [b.querySelector('.bwhere').textContent, b.querySelector('#bsum').textContent,
          [...b.querySelectorAll('.blab')].map((x) => x.textContent), b.querySelector('.brow').textContent, !!b.querySelector('.brow[data-goto-note="6"][data-tid="t1"]')]; })()""")
        check(brief[0].startswith("p. 2 in Ch. 1") and brief[1] == "summary" and brief[2] == ["Next time", "Your summary of this chapter", "Open questions in this book", "Your latest notes"] and "Why this?" in brief[3] and brief[4],
              f"a book's page says where you left off: page, chapter, your summary, open questions and latest notes, each opening the text ({brief})")
        await page.evaluate("(async () => { await put('texts', 'tnew', { title: 'Unread', hasContent: false, pos: 0, createdAt: 1, updatedAt: 1 }); go({ screen: 'text', textId: 'tnew' }); })()"); await page.wait_for_timeout(300)
        check(await page.evaluate("!document.querySelector('.brief')"), "a book not started and without notes has no brief")
        # next time: shown in the brief, asked for in a sheet, shown on continuing, cleared from the toast
        await page.evaluate("(async () => { if (NAV.overlay) await closeOverlay(); go({ screen: 'text', textId: 't1' }); })()"); await page.wait_for_selector(".brief .bnext")
        check("Work out why the paragraph comes first" in await page.inner_text(".brief .bnext"), "the brief shows the line left for next time")
        await page.click("#editnext"); await page.fill("#nx-text", "Check the second paragraph"); await page.click("#sheetroot button[type=submit]"); await page.wait_for_timeout(500)
        check(await page.evaluate("S.texts.get('t1').next") == "Check the second paragraph" and "Check the second paragraph" in await page.inner_text(".brief .bnext"), "Next time can be changed from the book's page")
        await page.click("#read"); await page.wait_for_timeout(900)
        check("Next time: Check the second paragraph" in await page.inner_text("#toast"), "continuing to read shows the line")
        await page.click("#toast .toastbtn"); await page.wait_for_timeout(500)
        check(await page.evaluate("S.texts.get('t1').next === undefined"), "Done with it clears it")
        await page.evaluate("back()"); await page.wait_for_timeout(400)
        # a glossary term's notes, grouped by author and book, each book in reading order, five or more folded
        await page.evaluate("""(async () => { if (NAV.overlay) await closeOverlay();
          await put('texts', 'sp', { title: 'Ethics', author: 'Spinoza, Baruch', hasContent: false, createdAt: 1, updatedAt: 1 });
          await put('texts', 'ar', { title: 'Categories', author: 'Aristotle', hasContent: false, createdAt: 1, updatedAt: 1 });
          for (let k = 0; k < 6; k++) await put('notes', 'sp' + k, { textId: 'sp', kind: 'passage', passage: 'By substance I understand ' + k, gloss: k === 0 ? 'Conceived through itself.' : '', page: String(10 - k), createdAt: k, updatedAt: k });
          await put('notes', 'ar0', { textId: 'ar', kind: 'question', passage: 'A substance is neither said of a subject', gloss: 'Primary or secondary?', page: '2a11', createdAt: 9, updatedAt: 9 });
          openTerm('substance'); })()"""); await page.wait_for_timeout(600)
        grp = await page.evaluate("""(() => { const d = document.querySelector('[data-term-id="substance"]'); return [d.querySelector('.thits .hint')?.textContent,
          [...d.querySelectorAll('.tbook')].map((b) => [b.querySelector('.tbh .src').textContent, b.querySelector('.tbh .cnt').textContent, b.querySelectorAll(':scope > .thit').length, b.querySelector('summary')?.textContent || '', b.querySelector('.thit p')?.textContent]),
          d.querySelector('.tgl')?.textContent]; })()""")
        check(grp[0] == "In 2 books by 2 authors, grouped by author, to compare how each uses it." and grp[1] == [["Categories", "1", 1, "", "A substance is neither said of a subject"], ["Ethics", "6", 4, "2 more from this book", "By substance I understand 5"]] and grp[2] == "Primary or secondary?",
              f"a term's notes are grouped by author and book, in reading order, with your glosses and the rest folded ({grp})")
        # pictures: Wikimedia Commons stood in for (Kant's loads, every other one fails as it would offline); this route takes precedence over fresh_page's
        async def commons(route):
            if "Immanuel_Kant" in route.request.url:
                await route.fulfill(status=200, content_type="image/svg+xml", body='<svg xmlns="http://www.w3.org/2000/svg" width="400" height="500"><rect width="100%" height="100%" fill="#876"/></svg>')
            else: await route.abort()
        await page.route("https://commons.wikimedia.org/**", commons)
        imgs = await page.evaluate("""() => [...GLOSSARY, ...THINKERS, ...BRANCHES].filter((e) => e.img).map((e) => [e.id, !!(e.img.file && e.img.alt && /via$/.test(e.img.cap))])""")
        check(len(imgs) >= 10 and all(ok for _, ok in imgs), f"{len(imgs)} entries have a picture with a file, a description and a credit ({[i for i, ok in imgs if not ok]})")
        n = len(errs)
        await page.evaluate("document.querySelector('#pclose') && document.querySelector('#pclose').click(); thinkerPanel('kant')")
        await page.wait_for_function("document.querySelector('.sheet .efig img') && document.querySelector('.sheet .efig img').complete")
        fig = await page.evaluate("(() => { const f = document.querySelector('.sheet .efig'), a = f.querySelector('figcaption a'); return [f.querySelector('img').naturalWidth, f.querySelector('img').alt, a.href, a.target]; })()")
        check(fig == [400, "Painted portrait of Immanuel Kant", "https://commons.wikimedia.org/wiki/File:Immanuel_Kant_-_Gemaelde_1.jpg", "_blank"], f"Kant's card shows his portrait, credited and linked to its Commons page ({fig})")
        await page.evaluate("document.querySelector('#pclose').click(); thinkerPanel('hegel')"); await page.wait_for_timeout(600)
        gone = await page.evaluate("[!!document.querySelector('.sheet .tdef'), document.querySelectorAll('.sheet .efig').length]")
        check(gone == [True, 0] and len(errs) == n, f"a picture that can't load leaves the card without a gap or an error ({gone}, {errs[n:]})")

        # holding a book on the shelf (a phone's touch screen): its menu; right-click on a computer
        ctx = await browser.new_context(viewport={"width": 390, "height": 844}, is_mobile=True, has_touch=True)
        page = await ctx.new_page(); errs = []
        page.on("pageerror", lambda e: errs.append(str(e)))
        await page.route("https://commons.wikimedia.org/**", lambda r: r.abort())
        await page.goto(URL); await page.wait_for_function(READY); await page.evaluate(SEED)
        await page.evaluate("put('texts', 'tdel', { title: 'To Delete', author: 'Nobody', createdAt: 1, updatedAt: 1 })")
        await page.evaluate("go({ screen: 'library' })"); await page.wait_for_timeout(300)
        cdp = await ctx.new_cdp_session(page)
        async def touch(sel, hold_ms, dy=0):
            box = await page.evaluate(f"(() => {{ const r = document.querySelector(`{sel}`).getBoundingClientRect(); return [r.left + r.width / 2, r.top + r.height / 3]; }})()")
            pt = lambda y: [{"x": box[0], "y": y, "id": 1}]
            await cdp.send("Input.dispatchTouchEvent", {"type": "touchStart", "touchPoints": pt(box[1])})
            if dy:
                for k in range(1, 5): await asyncio.sleep(0.03); await cdp.send("Input.dispatchTouchEvent", {"type": "touchMove", "touchPoints": pt(box[1] + dy * k / 4)})
            await asyncio.sleep(hold_ms / 1000)
            await cdp.send("Input.dispatchTouchEvent", {"type": "touchEnd", "touchPoints": []})
            await page.wait_for_timeout(500)
        await touch(".shelfbook[data-open='t1']", 750)
        menu = await page.evaluate("[S.screen, [...document.querySelectorAll('.sheet .menuitem')].map((b) => b.textContent.trim()), document.querySelector('.sheet .hint')?.textContent]")
        check(menu[0] == "library" and menu[1] == ["Start reading", "Open the book's page", "Edit details and cover", "Move to Queued", "Move to Finished", "Delete this text"] and "Reading shelf" in (menu[2] or ""),
              f"holding a book opens its menu: read, open, edit, move to another shelf, delete; letting go doesn't open the book ({menu})")
        await page.click(".sheet [data-move='finished']"); await page.wait_for_timeout(400)
        moved = await page.evaluate("[S.texts.get('t1').status, document.querySelector('#toast').textContent, [...document.querySelectorAll('.shelf')].map((s) => s.querySelector('.label').textContent + ':' + [...s.querySelectorAll('.shelfbook')].map((b) => b.dataset.open).join(','))]")
        check(moved[0] == "finished" and moved[1].startswith("Moved to Finished.") and any(s.startswith("Finished") and "t1" in s for s in moved[2]), f"Move to Finished puts it on that shelf ({moved})")
        await page.click("#toast .toastbtn"); await page.wait_for_timeout(400)
        check(await page.evaluate("(S.texts.get('t1').status || 'reading') === 'reading'"), "Undo puts it back on its shelf")
        await touch(".shelfbook[data-open='t1']", 600, dy=60)
        check(await page.evaluate("!document.querySelector('.sheet') && S.screen === 'library'"), "a finger that moves while held scrolls, and opens nothing")
        await touch(".shelfbook[data-open='t1']", 750)
        await page.click("#bm-edit"); await page.wait_for_timeout(400)
        check(await page.evaluate("document.querySelector('#f-title')?.value") == "Test Book", "Edit opens the book's details")
        await page.evaluate("closeOverlay()"); await page.wait_for_timeout(300)
        await touch(".shelfbook[data-open='tdel']", 750)
        await page.click("#bm-delete"); await page.wait_for_timeout(300)
        await page.click("#m-delete-yes"); await page.wait_for_timeout(500)
        check(await page.evaluate("!S.texts.has('tdel') && S.screen === 'library' && !document.querySelector(\".shelfbook[data-open='tdel']\")"), "Delete, once confirmed, removes the book and stays on the shelf")
        await touch(".shelfbook[data-open='t1']", 60)
        check(await page.evaluate("S.screen === 'text' && S.textId === 't1'"), "a quick tap still opens the book's page")

        # carrying a book: hold, then move; set it down beside another, or on another shelf
        await page.evaluate("""(async () => { for (const [id, k] of [['r1', 4], ['r2', 3], ['r3', 2], ['r4', 1]]) await put('texts', id, { title: 'Book ' + id, createdAt: k, updatedAt: k });
          await put('texts', 'q1', { title: 'Queued one', status: 'queued', createdAt: 1, updatedAt: 1 }); go({ screen: 'library' }); })()"""); await page.wait_for_timeout(400)
        SHELF = "(st) => shelfList(st).map(([x]) => x)"
        async def spot(sel, fx=0.5):
            return await page.evaluate(f"(() => {{ const r = document.querySelector(`{sel} .cover`).getBoundingClientRect(); return [r.left + r.width * {fx}, r.top + r.height / 2]; }})()")
        async def carry(src, dst, fx, mid=None):
            a, b = await spot(src), await spot(dst, fx)
            pt = lambda x, y: [{"x": x, "y": y, "id": 1}]
            await cdp.send("Input.dispatchTouchEvent", {"type": "touchStart", "touchPoints": pt(*a)}); await asyncio.sleep(0.65)
            seen = None
            for k in range(1, 13):
                await cdp.send("Input.dispatchTouchEvent", {"type": "touchMove", "touchPoints": pt(a[0] + (b[0] - a[0]) * k / 12, a[1] + (b[1] - a[1]) * k / 12)}); await asyncio.sleep(0.03)
                if k == 6 and mid: seen = await page.evaluate(mid)
            await cdp.send("Input.dispatchTouchEvent", {"type": "touchEnd", "touchPoints": []}); await page.wait_for_timeout(600)
            return seen
        before = await page.evaluate(SHELF, "reading")
        mid = await carry(".shelfbook[data-open='r3']", ".shelfbook[data-open='t1']", 0.25, "[!!document.querySelector('.sheet'), !!document.querySelector('.dragghost'), !document.querySelector('.dropmark').hidden]")
        after = await page.evaluate(SHELF, "reading")
        check(before == ["t1", "r1", "r2", "r3", "r4"] and mid == [False, True, True] and after == ["r3", "t1", "r1", "r2", "r4"],
              f"holding a book then moving it puts the menu away, carries it with a marker where it will go, and sets it down there ({before} → {after}, {mid})")
        check(await page.evaluate("[S.screen, document.querySelector('#toast').textContent, ['r3', 't1', 'r1', 'r2', 'r4'].map((x) => S.texts.get(x).rank)]") == ["library", "Moved.Undo", [0, 1, 2, 3, 4]], "the shelf keeps that order (each book's place is saved), and letting go opens nothing")
        await page.click("#toast .toastbtn"); await page.wait_for_timeout(400)
        check(await page.evaluate(SHELF, "reading") == before and await page.evaluate("['r3', 't1', 'r1'].every((x) => S.texts.get(x).rank === undefined)"), "Undo puts the shelf back as it was, in order of use")
        await carry(".shelfbook[data-open='r1']", ".shelfbook[data-open='t1']", 0.75)
        check(await page.evaluate(SHELF, "reading") == before and await page.evaluate("S.texts.get('r1').rank === undefined && document.querySelector('#toast').hidden"), "set down where it was, nothing changes")
        await page.evaluate("document.querySelector(\".shelfbook[data-open='r4']\").scrollIntoView({ block: 'start' })"); await page.wait_for_timeout(200)
        await carry(".shelfbook[data-open='r4']", ".shelfbook[data-open='q1']", 0.25)
        cross = await page.evaluate("[S.texts.get('r4').status, shelfList('queued').map(([x]) => x), document.querySelector('#toast').textContent]")
        check(cross == ["queued", ["r4", "q1"], "Moved to Queued.Undo"], f"carried onto another shelf, it moves there, in the place it was set down ({cross})")
        await page.evaluate("window.scrollTo(0, 0)"); await page.wait_for_timeout(200)
        await carry(".shelfbook[data-open='r2']", ".shelfbook[data-open='t1']", 0.25)
        await page.reload(); await page.wait_for_function(READY); await page.evaluate("go({ screen: 'library' })"); await page.wait_for_timeout(300)
        check(await page.evaluate(SHELF, "reading") == ["r2", "t1", "r1", "r3"], "the order is still there after closing and opening the app")
        await page.evaluate("(async () => { await put('texts', 'new1', { title: 'Just added', createdAt: Date.now(), updatedAt: Date.now() }); await put('texts', 'r1', { ...S.texts.get('r1'), readAt: Date.now() + 5 }); })()"); await page.wait_for_timeout(300)
        check(await page.evaluate(SHELF, "reading") == ["new1", "r2", "t1", "r1", "r3"], "on an arranged shelf a new book arrives at the front, and reading a book doesn't move it")
        await page.evaluate("moveBook('r3', 'finished')"); await page.wait_for_timeout(300); await page.evaluate("moveBook('r3', 'reading')"); await page.wait_for_timeout(300)
        check(await page.evaluate(SHELF, "reading") == ["r3", "new1", "r2", "t1", "r1"] or await page.evaluate(SHELF, "reading") == ["new1", "r3", "r2", "t1", "r1"], "moved onto a shelf from the menu, a book goes to its front")
        check(not errs, "no script errors holding books" + (f": {errs}" if errs else ""))
        await ctx.close()
        page, errs = await fresh_page(browser, 1280, 800)
        await page.evaluate("go({ screen: 'library' })"); await page.wait_for_timeout(300)
        await page.click(".shelfbook[data-open='t1']", button="right"); await page.wait_for_timeout(400)
        check(await page.evaluate("S.screen === 'library' && !!document.querySelector('#bm-open')"), "on a computer, right-clicking a book opens the same menu")
        await page.click("#bm-open"); await page.wait_for_timeout(400)
        check(await page.evaluate("S.screen === 'text' && S.textId === 't1'"), "Open the book's page opens it")
        # with a mouse, dragging a book carries it straight away
        await page.evaluate("(async () => { await put('texts', 'm1', { title: 'Mouse one', createdAt: 2, updatedAt: 2 }); await put('texts', 'm2', { title: 'Mouse two', createdAt: 1, updatedAt: 1 }); go({ screen: 'library' }); })()"); await page.wait_for_timeout(400)
        box = lambda sel, fx: page.evaluate(f"(() => {{ const r = document.querySelector(`{sel} .cover`).getBoundingClientRect(); return [r.left + r.width * {fx}, r.top + r.height / 2]; }})()")
        a, b = await box(".shelfbook[data-open='m2']", 0.5), await box(".shelfbook[data-open='t1']", 0.2)
        await page.mouse.move(*a); await page.mouse.down()
        for k in range(1, 11): await page.mouse.move(a[0] + (b[0] - a[0]) * k / 10, a[1] + (b[1] - a[1]) * k / 10); await page.wait_for_timeout(20)
        await page.mouse.up(); await page.wait_for_timeout(500)
        check(await page.evaluate("[S.screen, shelfList('reading').map(([x]) => x)]") == ["library", ["m2", "t1", "m1"]], "with a mouse, dragging a book moves it, and the drag doesn't open it")
        await offline(browser)
        await browser.close()

server = subprocess.Popen([sys.executable, "-m", "http.server", str(PORT), "-d", str(ROOT)], stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
try:
    time.sleep(1); asyncio.run(main())
finally:
    server.terminate()
print(f"\n{len(failures)} failed" if failures else "\nall passed")
sys.exit(1 if failures else 0)
