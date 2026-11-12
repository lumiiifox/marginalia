"""Mastery: the collection earned by reading checked material. Run after changes to js/mastery.js, the verified lists or the
places that earn:  python3 tests/mastery.py

Made-up notes only, phone-sized screen. Checks that:
  1. the verified lists match the audit records, and only verified entries ever count;
  2. opening an entry meets it; a thinker's card meets its connections too, in one toast;
  3. a right answer in Quiz yourself, Guess the thinker or a step of Connect two thinkers answers it;
  4. a note that names a checked concept makes it used, and is celebrated once, by that note only;
  5. a station is read once a note falls in its passage, and the next station unlocks;
  6. locked items fold into one tile; the home card and the collection screen show the same count;
  7. a backup carries mastery; restoring merges the earlier time of each stage and never takes one away; bad records are skipped;
  8. a version 10 library upgrades to 11 with everything in it.
"""
import os
import asyncio, json, subprocess, sys, time
from pathlib import Path
from playwright.async_api import async_playwright

ROOT = Path(__file__).resolve().parent.parent
PORT = int(os.environ.get("MG_PORT", 8824))  # tests/run.py gives each test its own port
URL = f"http://localhost:{PORT}/index.html"
READY = "typeof idb !== 'undefined' && idb && S.mode === 'ready'"
failures = []
def check(ok, what):
    print(("ok   " if ok else "FAIL ") + what)
    if not ok: failures.append(what)

# A library as storage version 10 left it: one book and a note, before the mastery store existed.
OLD_LIBRARY = """new Promise((res, rej) => {
  const r = indexedDB.open("marginalia", 10);
  r.onupgradeneeded = () => { const d = r.result; for (const n of ["texts","notes","content","covers","terms","drafts","compares","files","trash","trashlist","paths","wishlist"]) d.createObjectStore(n); };
  r.onsuccess = () => { const d = r.result, t = d.transaction(["texts","notes"], "readwrite");
    t.objectStore("texts").put({ title: "Old book", hasContent: false, createdAt: 1, updatedAt: 1 }, "old");
    t.objectStore("notes").put({ textId: "old", gloss: "An old note", createdAt: 1, updatedAt: 1 }, "on");
    t.oncomplete = () => { d.close(); res(); }; t.onerror = () => rej(t.error); };
  r.onerror = () => rej(r.error);
})"""


def audit_lists():
    # every glossary audit (glossary-*.json) whose independent review passed
    terms = [t for f in sorted((ROOT / "tests/audit").glob("glossary-*.json")) for t in json.load(open(f))["terms"]]
    thinkers = list(json.load(open(ROOT / "tests/audit/thinkers-route.json"))["cards"].keys())
    return terms, thinkers


async def main():
    async with async_playwright() as p:
        browser = await p.chromium.launch()
        ctx = await browser.new_context(bypass_csp=True, viewport={"width": 390, "height": 820}, has_touch=True)
        await ctx.route("**/*", lambda r: r.abort() if "localhost" not in r.request.url else r.continue_())
        page = await ctx.new_page(); errs = []
        page.on("pageerror", lambda e: errs.append(str(e)))
        await page.goto(f"http://localhost:{PORT}/sw.js")
        await page.evaluate(OLD_LIBRARY)
        await page.goto(URL); await page.wait_for_function(READY)

        # 8 upgrade
        up = await page.evaluate("[idb.version, [...idb.objectStoreNames].includes('mastery'), S.texts.has('old'), S.notes.has('on'), S.mastery.size]")
        check(up == [11, True, True, True, 0], f"a version 10 library opens in version 11 with its book and note, nothing collected ({up})")

        # 1 verified lists
        terms, thinkers = audit_lists()
        lists = await page.evaluate("[VERIFIED_TERMS, VERIFIED_THINKERS, CONNECTIONS.length, masteryItems().length]")
        check(sorted(lists[0]) == sorted(terms), f"VERIFIED_TERMS are exactly the audited glossary entries ({sorted(set(lists[0]) ^ set(terms))})")
        reviewed = [f.name for f in sorted((ROOT / "tests/audit").glob("glossary-*.json")) if not json.load(open(f)).get("by", {}).get("review")]
        check(not reviewed, f"every glossary audit records its independent review ({reviewed})")
        def gaps_ok(d):
            u = d.get("unread")
            return isinstance(u, list) and all(isinstance(g, dict) and all(isinstance(g.get(k), str) and g[k] for k in ("source", "part", "why", "effect"))
                                               and isinstance(g.get("terms"), list) and set(g["terms"]) <= set(d["terms"]) for g in u)
        recent = {f.name: json.load(open(f)) for f in sorted((ROOT / "tests/audit").glob("glossary-*.json"))}
        missing = [n for n, d in recent.items() if (d.get("audited", "") >= "2026-11-12" or "unread" in d) and not gaps_ok(d)]
        check(not missing, f"every glossary audit since 2026-11-12 lists what it couldn't read, each gap with its part, reason, terms and effect ({missing})")
        check(sorted(lists[1]) == sorted(thinkers), "VERIFIED_THINKERS are exactly the audited thinker cards")
        conns = json.load(open(ROOT / "tests/audit/connections.json"))["connections"]
        check(lists[2] == len(conns), f"every connection in the app has its review ({lists[2]} and {len(conns)})")  # each one counts toward mastery
        await page.evaluate("openTerm('validity'); thinkerPanel('locke')"); await page.wait_for_timeout(300)
        check(await page.evaluate("S.mastery.size") == 0, "opening an entry that hasn't been audited counts for nothing")
        await page.evaluate("closeOverlay()")

        # checked and unchecked, as the reader sees them
        await page.evaluate("go({ screen: 'glossary', gs: { gOpen: ['univocity', 'validity'], gq: '', gArea: 'all' } })"); await page.wait_for_timeout(300)
        marks = await page.evaluate("['univocity', 'validity'].map((id) => document.querySelector(`details.term[data-term-id='${id}'] .ckmark`)?.className)")
        sumline = await page.evaluate("document.querySelector(\"details.term[data-term-id='validity'] .ta\").textContent")
        check(marks == ["ckmark ok", "ckmark un"] and "unchecked" in sumline, f"an audited entry says it's checked, and an unaudited one says it's unchecked, in its summary line too ({marks}, {sumline})")
        await page.evaluate("closeOverlay(); go({ screen: 'library' })"); await page.wait_for_timeout(300)
        cards = await page.evaluate("[...document.querySelectorAll('.refcard .rc-s')].map((e) => e.textContent).join(' | ')")
        check(f"{len(terms)} checked" in cards and f"{len(thinkers)} checked" in cards, f"the home screen's Glossary and Thinkers cards count the checked entries ({cards})")
        await page.evaluate("go({ screen: 'glossary', gs: { gOpen: [], gq: '', gArea: 'all' } })"); await page.wait_for_timeout(300)
        await page.click("#gchecked"); await page.wait_for_timeout(300)
        shown = await page.evaluate("[...document.querySelectorAll('details.term')].map((d) => d.dataset.termId)")
        check(sorted(shown) == sorted(terms), f"Checked only lists exactly the audited entries ({len(shown)} shown, {len(terms)} audited)")
        await page.click("#gchecked"); await page.wait_for_timeout(300)
        check(await page.evaluate("document.querySelectorAll('details.term').length") > len(terms), "and tapping it again lists them all")
        await page.evaluate("thinkerPanel('spinoza')"); await page.wait_for_timeout(200)
        sp = await page.evaluate("document.querySelector('.sheet .ckmark')?.className")
        await page.evaluate("closeOverlay()"); await page.evaluate("thinkerPanel('locke')"); await page.wait_for_timeout(200)
        lo = await page.evaluate("document.querySelector('.sheet .ckmark')?.className")
        check(sp == "ckmark ok" and lo == "ckmark un", f"thinker cards are marked the same way ({sp}, {lo})")
        await page.evaluate("closeOverlay()"); await page.evaluate("S.mastery.clear(); idbDo('mastery', (s) => s.clear())"); await page.wait_for_timeout(200)
        # 2 meeting
        await page.evaluate("openTerm('univocity')")
        await page.wait_for_function("/Univocity/.test(document.querySelector('#toast').textContent)", timeout=5000)
        m = await page.evaluate("[S.mastery.get('term:univocity')?.met > 0, document.querySelector('#toast').textContent, document.querySelector('#toast').classList.contains('earn')]")
        check(m[0] and m[1].startswith("Met: Univocity") and m[2], f"opening a checked term meets it, with a toast that pops ({m[1]})")
        await page.evaluate("openTerm('univocity')"); await page.wait_for_timeout(200)
        check(await page.evaluate("Object.keys(S.mastery.get('term:univocity'))") == ["met"], "meeting it again earns nothing more")
        await page.evaluate("thinkerPanel('spinoza')")
        await page.wait_for_function("/collected/.test(document.querySelector('#toast').textContent)", timeout=5000)  # earned things arrive together, a moment later
        t = await page.evaluate("[['thinker:spinoza', ...connectionsOf('spinoza').map((c) => 'conn:' + connId(c))].every((k) => S.mastery.get(k)?.met), document.querySelector('#toast').textContent, connectionsOf('spinoza').length + 1]")
        check(t[0] and t[1].startswith(f"{t[2]} collected"), f"a thinker's card meets the thinker and their connections, in one toast ({t[1]})")
        await page.evaluate("closeOverlay()")

        # 3 answering
        await page.evaluate("""quizPanel('all'); const g = termMap().get('rhizome'), u = termMap().get('validity');
          QZ.qs = [{ prompt: 'x', opts: ['a', 'b'], answer: 0, g }, { prompt: 'y', opts: ['a', 'b'], answer: 0, g: u }, { prompt: 'z', opts: ['a', 'b'], answer: 0, g: termMap().get('assemblage') }, { prompt: 'w', opts: ['a', 'b'], answer: 0, g }];
          QZ.k = 0; QZ.picked = -1; document.querySelector('#quizbox').innerHTML = quizHTML();""")
        await page.click("[data-qzans='0']"); await page.wait_for_timeout(200)
        await page.click("[data-qznext]"); await page.click("[data-qzans='0']"); await page.wait_for_timeout(200)
        await page.click("[data-qznext]"); await page.click("[data-qzans='1']"); await page.wait_for_timeout(200)
        q = await page.evaluate("[S.mastery.get('term:rhizome'), S.mastery.has('term:validity'), S.mastery.has('term:assemblage')]")
        check(q[0] and q[0].get("ans") and q[0].get("met"), "a right answer on a checked term answers it (and meets it)")
        check(q[1] is False and q[2] is False, "a right answer on an unchecked term, or a wrong one, earns nothing")
        await page.evaluate("closeOverlay()")
        await page.evaluate("""const p = THINKER.get('nietzsche'); guessOfDay = () => p; localStorage.removeItem('mg-guess'); guessPanel();""")
        await page.fill("#g-in", "Friedrich Nietzsche"); await page.click("[data-gtry]"); await page.wait_for_timeout(200)
        check(await page.evaluate("!!S.mastery.get('thinker:nietzsche')?.ans"), "solving Guess the thinker answers that thinker")
        await page.evaluate("closeOverlay()")
        await page.evaluate("""connectPanel(); CN.chain = ['spinoza']; CN.b = 'land'; CN.over = ''; CN.shortest = 3; document.querySelector('#cnbox').innerHTML = connectHTML();""")
        await page.evaluate("""const b = document.createElement('button'); b.dataset.keep = '1'; b.dataset.cngo = 'deleuze'; document.querySelector('#cnbox').append(b); b.click();""")
        await page.wait_for_timeout(200)
        check(await page.evaluate("!!S.mastery.get('conn:deleuze>spinoza')?.ans"), "a step of Connect two thinkers along a checked connection answers it")
        await page.evaluate("closeOverlay()")

        # 4 used, from notes
        await page.evaluate("put('texts', 'b1', { title: 'My book', hasContent: false, createdAt: 2, updatedAt: 2 })")
        await page.evaluate("put('notes', 'n-plain', { textId: 'b1', gloss: 'Nothing checked in here', createdAt: 3, updatedAt: 3 })"); await page.wait_for_timeout(200)
        before = await page.evaluate("document.querySelector('#toast').textContent")
        await page.evaluate("put('notes', 'n-rh', { textId: 'b1', gloss: 'A rhizome has no centre', createdAt: 4, updatedAt: 4 })")
        await page.wait_for_function("/Rhizome/.test(document.querySelector('#toast').textContent)", timeout=5000)  # an earlier toast may still be showing under load
        u = await page.evaluate("[document.querySelector('#toast').textContent, masteryStages(masteryItems().find((x) => x.id === 'rhizome'))]")
        check(u[0].startswith("Mastered: Rhizome") and u[1]["used"], f"a note naming a checked concept makes it used; met, answered and used, it's mastered ({u[0]})")
        await page.evaluate("document.querySelector('#toast').textContent = ''; put('notes', 'n-rh', { textId: 'b1', gloss: 'A rhizome has no centre, again', createdAt: 4, updatedAt: 5 })"); await page.wait_for_timeout(200)
        check(await page.evaluate("document.querySelector('#toast').textContent") == "", "editing that note again celebrates nothing twice")
        # a save works the collection out once, on the home screen too (its Study card needs it), and a note rewritten with the
        # same dates still counts what it now names
        got = await page.evaluate("""async () => {
          go({ screen: 'library' }); const real = masteryStateFresh; let n = 0; window.masteryStateFresh = (o) => { n++; return real(o); };
          const g = allTerms().find((x) => VERIFIED_TERMS.includes(x.id) && x.id !== 'rhizome' && /^[a-z ]+$/i.test(x.t) && !masteryStages(masteryItems().find((i) => i.id === x.id)).used);
          document.querySelector('#toast').textContent = '';
          await put('notes', 'n-plain', { textId: 'b1', gloss: 'Now about ' + g.t.toLowerCase(), createdAt: 3, updatedAt: 3 });
          await new Promise((r) => setTimeout(r, 200)); window.masteryStateFresh = real;
          return [n, masteryStages(masteryItems().find((i) => i.id === g.id)).used, document.querySelector('#toast').textContent.includes(g.t), g.t]; }""")
        check(got[:3] == [1, True, True], f"saving a note works mastery out once, and a note rewritten with the same dates still counts ({got})")

        # 5 a station, read through a note in its passage
        await page.evaluate("addClassics(true)"); await page.wait_for_function("S.texts.has('classic-spinoza-ethics')")
        await page.evaluate("loadContent('classic-spinoza-ethics')"); await page.wait_for_timeout(300)
        st = await page.evaluate("""(() => { const P = PATHS.find((x) => x.id === 'spinoza-deleuze'), s = closeState(P); return [s.out.get('in-itself').start, masteryState().items.filter((i) => i.kind === 'station' && i.reach).length]; })()""")
        await page.evaluate(f"put('notes', 'n-st', {{ textId: 'classic-spinoza-ethics', at: {st[0]}, gloss: 'In itself and conceived through itself', createdAt: 6, updatedAt: 6 }})"); await page.wait_for_timeout(300)
        st2 = await page.evaluate("[document.querySelector('#toast').textContent, masteryState().items.filter((i) => i.kind === 'station' && i.reach).length]")
        check(st[1] == 1 and st2[0].startswith("Read: In itself") and st2[1] == 2, f"a note in a station's passage reads it, and the next station unlocks ({st[1]} → {st2[1]}, {st2[0]})")

        # 6 the screens
        await page.evaluate("go({ screen: 'mastery' })"); await page.wait_for_timeout(300)
        scr = await page.evaluate("[document.querySelector('h1').textContent, document.querySelectorAll('.mtile.locked').length, document.querySelectorAll('.mtile:not(.locked)').length, masteryState().items.filter((i) => i.reach).length, document.querySelector('.gl-head .sub').textContent]")
        check(scr[0] == "Mastery" and scr[1] <= 4 and scr[2] == scr[3], f"the collection shows what's within reach and folds the locked ones, one tile a kind ({scr})")
        await page.evaluate("go({ screen: 'library' })"); await page.wait_for_timeout(300)
        home = await page.evaluate("[document.querySelector('#openstudy .rc-s').textContent, document.querySelector('#openstudy .rc-meter i').style.width]")
        check(scr[4].split("%")[0] == home[0].replace("Mastery ", "").split("%")[0] and home[1] == f"{home[0].replace('Mastery ', '').split('%')[0]}%",
              f"the home screen's Study card shows the collection's progress, meter and all ({home} / {scr[4]})")
        await page.click("#openstudy"); await page.wait_for_timeout(200)
        study = await page.evaluate("document.querySelector('#openmastery .rc-s').textContent")
        check(scr[4].split("%")[0] == study.split("%")[0], f"the Study screen's Mastery card and the collection agree ({study} / {scr[4]})")
        await page.click("#openmastery"); await page.wait_for_timeout(200)
        check(await page.evaluate("S.screen") == "mastery", "the Mastery card opens the collection")

        # 7 backup and restore
        data = await page.evaluate("(async () => { let out; const orig = saveFile; saveFile = async (n, t) => { out = JSON.parse(t); return true; }; await exportBackup(); saveFile = orig; return out; })()")
        check("term:rhizome" in data.get("mastery", {}), "a backup carries what you've collected")
        early = dict(data); early["mastery"] = {"term:rhizome": {"met": 1000}, "term:univocity": {"ans": 2000}, "thinker:land": {"met": 3000}, "bad": {"x": 1}, "term:assemblage": {"met": "soon"}}
        await page.evaluate("(d) => showRestore('b.json', d, '')", early); await page.wait_for_timeout(200)
        await page.click("#rs-merge"); await page.wait_for_timeout(400)
        r = await page.evaluate("[S.mastery.get('term:rhizome'), S.mastery.get('term:univocity'), S.mastery.get('thinker:land'), S.mastery.has('bad'), S.mastery.has('term:assemblage')]")
        check(r[0]["met"] == 1000 and r[0].get("ans"), "restoring keeps the earlier time of each stage, and keeps what this device earned")
        check(r[1]["ans"] == 2000 and r[1]["met"] > 2000, "a stage earned only in the backup is added")
        check(r[2] == {"met": 3000} and not r[3] and not r[4], "an item only in the backup comes back; bad records are skipped")
        stored = await page.evaluate("idbGet('mastery', 'thinker:land')")
        check(stored == {"met": 3000}, "restored mastery is saved on the device")

        # the first time Mastery is opened, before the close-reading path's book is loaded: the figures are redrawn once it is,
        # so they agree with the collection (stations read count only with the book's text at hand)
        ctx2 = await browser.new_context(bypass_csp=True, viewport={"width": 390, "height": 820})
        await ctx2.route("**/*", lambda r: r.abort() if "localhost" not in r.request.url else r.continue_())
        p2 = await ctx2.new_page(); p2.on("pageerror", lambda e: errs.append(str(e)))
        await p2.goto(URL); await p2.wait_for_function(READY)
        await p2.evaluate("""async () => { await addClassics(true); const P = PATHS.find((x) => x.kind === 'close'), B = await idbGet('content', P.book), st = closeStations(P)[0];
          const m = st.refs[0].match(PASSAGE_STYLES[P.style].item), i = PASSAGE_STYLES[P.style].find(B, m.slice(1).map((v) => v || ''));
          await put('notes', 'cs1', { textId: P.book, kind: 'gloss', gloss: 'read this station', at: i, links: [], createdAt: Date.now(), updatedAt: Date.now() }); }""")
        await p2.reload(); await p2.wait_for_function(READY)
        first = await p2.evaluate("(() => { const P = PATHS.find((x) => x.kind === 'close'); return !S.content.get(P.book); })()")
        await p2.evaluate("go({ screen: 'mastery' })"); await p2.wait_for_timeout(1500)
        got = await p2.evaluate("[document.querySelector('#main .sub').textContent, masteryState().pct, masteryState().items.filter((it) => it.kind === 'station' && it.s.read).length]")
        check(first and got[0].startswith(f"{got[1]}%") and got[2] >= 1, f"opened first, before its book loads, Mastery redraws to agree with the collection ({got})")
        await ctx2.close()
        check(not errs, "no script errors" + (f": {errs}" if errs else ""))
        await browser.close()

server = subprocess.Popen([sys.executable, "-m", "http.server", str(PORT), "-d", str(ROOT)], stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
try:
    time.sleep(1); asyncio.run(main())
finally:
    server.terminate()
print(f"\n{len(failures)} failed" if failures else "\nall passed")
sys.exit(1 if failures else 0)
