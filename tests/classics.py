"""The classics that come with the app. Run after changes to them, to data/books/ or to the reader:  python3 tests/classics.py

Checks that:
  1. the automated browser of the other tests gets no classics by itself;
  2. asked, the app adds every book in CLASSICS once, on the Queued shelf, with its text, chapters and cover, and says so;
  3. opening the app again adds nothing; a classic you delete stays deleted; a file that can't be fetched is tried again later;
  4. every classic opens in the reader at phone size, its chapters in Contents, its note numbers opening the right notes;
  5. a book's page names the edition (Standard Ebooks, the translator) and cites it;
  6. the book files hold only what the app accepts from a backup, and their covers are 400 x 600 JPEGs.
Needs: pip install playwright && playwright install chromium
"""
import os
import asyncio, json, re, subprocess, sys, time
from pathlib import Path
from playwright.async_api import async_playwright

ROOT = Path(__file__).resolve().parent.parent
PORT = int(os.environ.get("MG_PORT", 8807))  # tests/run.py gives each test its own port
URL = f"http://localhost:{PORT}/index.html"
READY = "typeof idb !== 'undefined' && idb && S.mode === 'ready'"
IDS = re.search(r"const CLASSICS = (\[[^\]]*\])", (ROOT / "js" / "boot.js").read_text(encoding="utf-8")).group(1)
IDS = json.loads(IDS)
failures = []
def check(ok, what):
    print(("ok   " if ok else "FAIL ") + what)
    if not ok: failures.append(what)

async def main():
    async with async_playwright() as p:
        browser = await p.chromium.launch()
        ctx = await browser.new_context(bypass_csp=True, viewport={"width": 412, "height": 915}, device_scale_factor=2.625, is_mobile=True, has_touch=True)
        page = await ctx.new_page(); errs = []
        page.on("pageerror", lambda e: errs.append(str(e)))
        page.on("console", lambda m: m.type == "error" and "Failed to load resource" not in m.text and errs.append(m.text))
        await page.route(re.compile(r"^https://(fonts|cdnjs|commons)\."), lambda r: r.abort())
        await page.goto(URL); await page.wait_for_function(READY); await page.wait_for_timeout(800)

        # 1 nothing by itself in an automated browser
        check(await page.evaluate("CLASSICS.every((id) => !S.texts.has(id))"), "the tests' browser gets no classics unless a test asks")

        # 3 (first) a file that can't be fetched is tried again later
        await page.route("**/data/books/classic-du-bois-souls.json", lambda r: r.abort())
        added = await page.evaluate("addClassics(true)")
        check(len(added) == len(IDS) - 1 and "The Souls of Black Folk" not in added, f"a classic whose file can't be fetched is left for next time ({len(added)} added)")
        await page.unroute("**/data/books/classic-du-bois-souls.json")
        again = await page.evaluate("addClassics(true)")
        check(again == ["The Souls of Black Folk"], f"...and added the next time ({again})")

        # 2 all of them, queued, with text, chapters and cover
        recs = await page.evaluate("""(async () => { const out = {}; for (const id of CLASSICS) { const t = S.texts.get(id), c = await idbGet('content', id), cv = await idbGet('covers', id);
          out[id] = { title: t && t.title, status: t && t.status, has: t && t.hasContent, total: t && t.total, blocks: c && c.length, secs: (t && t.sections || []).length,
            tied: c ? c.filter((b) => b.s).length : 0, cover: cv ? cv.type + ' ' + cv.size : null }; } return out; })()""")
        bad = {k: v for k, v in recs.items() if not (v["status"] == "queued" and v["has"] and v["total"] == v["blocks"] and v["blocks"] > 50 and (v["secs"] == 1 if k == "classic-gilman-wallpaper" else v["secs"] == 3 if k in ("classic-berkeley-dialogues", "classic-sophocles-antigone", "classic-lovecraft-cthulhu") else v["secs"] >= 4) and v["tied"] == v["secs"] and v["cover"] and v["cover"].startswith("image/jpeg"))}
        check(len(recs) == len(IDS) and not bad, f"every classic is in the library, queued, with its text, chapters and cover ({bad or len(recs)})")
        await page.evaluate("go({ screen: 'shelf' })"); await page.wait_for_timeout(300)
        # two books with one title say which each is; a title of its own says nothing more
        await page.evaluate("""async () => { await put('texts', 'dup-a', { title: 'The Ethics', author: 'Spinoza', edition: 'tr. Elwes', status: 'reading', createdAt: 5, updatedAt: 5 });
          await put('texts', 'dup-b', { title: 'The Ethics', author: 'Spinoza', edition: 'tr. Curley', status: 'reading', createdAt: 6, updatedAt: 6 }); render(); }""")
        await page.wait_for_timeout(300)
        whichs = await page.evaluate("['dup-a', 'dup-b', 'classic-kant-groundwork'].map((id) => document.querySelector(`.shelfbook[data-open='${id}'] .sb-which`)?.textContent || '')")
        check(whichs == ["Spinoza, tr. Elwes", "Spinoza, tr. Curley", ""], f"two books with one title say which each is on the shelf; others don't ({whichs})")
        await page.evaluate("async () => { for (const id of ['dup-a', 'dup-b']) { await del('texts', id); S.texts.delete(id); } render(); }"); await page.wait_for_timeout(200)
        lib = await page.inner_text("#main")
        shelf = await page.evaluate("[...document.querySelectorAll('.shelf[data-st=\"queued\"] .shelfbook')].map((b) => b.dataset.open)")
        more = await page.evaluate("document.querySelector('.shelf[data-st=\"queued\"] .shelfmore')?.textContent || ''")
        late = "classic-du-bois-souls" # added on the second try above, so it arrived last and stands first
        want = [late] + [x for x in IDS if x != late]
        check(shelf == want[:len(shelf)] and len(shelf) >= 6 and (len(shelf) == len(IDS) or more == f"Show all {len(IDS)}"), f"they show on the Queued shelf, newest arrival first, the rest in historical order ({shelf}, {more!r})")

        # 3 opening again adds nothing; deleting one keeps it deleted
        await page.reload(); await page.wait_for_function(READY)
        check(await page.evaluate("addClassics(true)") == [], "opening the app again adds nothing")
        await page.evaluate("(async () => { await idbTx(['content', 'texts', 'covers'], (st) => { st('content').delete('classic-nietzsche-genealogy'); st('texts').delete('classic-nietzsche-genealogy'); st('covers').delete('classic-nietzsche-genealogy'); }); S.texts.delete('classic-nietzsche-genealogy'); })()")
        check(await page.evaluate("addClassics(true)") == [] and await page.evaluate("!S.texts.has('classic-nietzsche-genealogy')"), "a classic you delete stays deleted")
        await page.evaluate("localStorage.setItem('mg-classics', JSON.stringify(CLASSICS.filter((x) => x !== 'classic-nietzsche-genealogy')))")
        check(await page.evaluate("addClassics(true)") == ["The Genealogy of Morals"], "on a new phone (no record of what was added) it comes back")

        # 4 every classic in the reader
        for bid in IDS:
            await page.evaluate(f"go({{ screen: 'reader', textId: '{bid}' }})"); await page.wait_for_selector("#book .bp", timeout=15000); await page.wait_for_timeout(500)
            info = await page.evaluate("""(() => ({ paras: document.querySelectorAll('#book .bp').length, wide: document.documentElement.scrollWidth > innerWidth,
              chapters: (S.texts.get(R.tid).sections || []).length, tied: R.blocks.filter((b) => b.s && roleOf(b) === 'chapter').length,
              refs: R.blocks.filter((b) => b.k !== 'fn' && /[⁰¹²³⁴⁵⁶⁷⁸⁹]/.test(b.x || '')).length, notes: R.blocks.filter((b) => b.k === 'fn').length }))()""")
            check(info["paras"] > 0 and not info["wide"] and info["tied"] == info["chapters"], f"{bid} opens in the reader with its {info['chapters']} chapters ({info})")
            if info["refs"]:
                # every note number finds a note that starts with that number
                res = await page.evaluate("""(() => { const out = []; const B = R.blocks;
                  B.forEach((b, i) => { if (b.k === 'fn') return; for (const m of (b.x || '').matchAll(/[⁰¹²³⁴⁵⁶⁷⁸⁹]+/g)) { const n = supNum(m[0]); const [k] = findNote(i, n); out.push([n, k >= 0 && new RegExp('^\\\\s*' + n + '\\\\.').test(plain(B[k].x))]); } });
                  return out; })()""")
                miss = [n for n, ok in res if not ok]
                check(not miss, f"{bid}: each of its {len(res)} note numbers opens its note ({miss[:5]})")
        q, words = "history of all hitherto existing society", "written history"
        await page.evaluate("go({ screen: 'reader', textId: 'classic-marx-engels-manifesto' })"); await page.wait_for_selector("#book .bp"); await page.wait_for_timeout(500)
        k = await page.evaluate(f"R.blocks.findIndex((b) => plain(b.x || '').includes('{q}'))")
        await page.evaluate(f"jumpTo({k}, true, true)"); await page.wait_for_timeout(400)
        await page.evaluate(f"document.querySelector('#book [data-i=\"{k}\"] .fnref').click()"); await page.wait_for_timeout(400)
        panel = await page.evaluate("document.querySelector('.sheet') ? document.querySelector('.sheet').innerText : ''")
        check("Note 4" in panel and words in panel, f"tapping a note number in the Manifesto shows its note ({panel[:120]!r})")
        await page.evaluate("document.querySelector('#pclose') && document.querySelector('#pclose').click()"); await page.wait_for_timeout(300)

        # Harlem Shadows: a poem's stanzas are set apart; a stanza's lines and its continuation over a page are not
        await page.evaluate("go({ screen: 'reader', textId: 'classic-mckay-harlem' })"); await page.wait_for_selector("#book .bp"); await page.wait_for_timeout(500)
        k = await page.evaluate("R.blocks.findIndex((b) => b.k === 'h' && plain(b.x) === 'AFTER THE WINTER')")
        await page.evaluate(f"jumpTo({k + 1}, true, true)"); await page.wait_for_timeout(500)
        gap = await page.evaluate(f"""(() => {{ const a = document.querySelector('#book [data-i="{k + 1}"]'), b = document.querySelector('#book [data-i="{k + 2}"]');
          return [a.className, b.className, parseFloat(getComputedStyle(a).marginTop), parseFloat(getComputedStyle(b).marginTop), b.innerText.split('\\n').length]; }})()""")
        check("verse" in gap[0] and "verse" in gap[1] and gap[3] > 8 and gap[4] >= 8, f"Harlem Shadows: the second stanza of “After the Winter” starts a line's space below the first, its lines kept ({gap})")

        # an old bundled cover is replaced by the new one; a cover of your own stays; a missing one is filled in
        cv = await page.evaluate("""(async () => {
          const hex = (buf) => [...new Uint8Array(buf)].map((x) => x.toString(16).padStart(2, '0')).join('');
          const old = new Blob([new Uint8Array([1, 2, 3, 4])], { type: 'image/jpeg' }), mine = new Blob([new Uint8Array([9, 9, 9])], { type: 'image/jpeg' });
          OLD_CLASSIC_COVERS['classic-kant-critique'] = hex(await crypto.subtle.digest('SHA-256', await old.arrayBuffer()));
          await put('covers', 'classic-kant-critique', old); await put('covers', 'classic-spinoza-ethics', mine); await del('covers', 'classic-mill-liberty');
          const done = await refreshClassicCovers(true), size = async (id) => (await idbGet('covers', id))?.size ?? 0;
          const want = async (id) => (await (await fetch('data/books/' + id + '.jpg')).blob()).size;
          return [done.sort(), await size('classic-kant-critique') === await want('classic-kant-critique'), await size('classic-spinoza-ethics'), await size('classic-mill-liberty') === await want('classic-mill-liberty')]; })()""")
        check(cv == [["classic-kant-critique", "classic-mill-liberty"], True, 3, True], f"an old bundled cover is replaced, your own cover stays, a missing one is filled in ({cv})")

        # 5 the book's page: edition and citation
        await page.evaluate("go({ screen: 'text', textId: 'classic-plato-socrates' })"); await page.wait_for_timeout(400)
        head = await page.inner_text("#main header")
        two = await page.evaluate("['mla', 'note', 'ad'].map((st) => bibEntry({ title: 'Anti-Oedipus', author: 'Deleuze and Guattari', year: '1972' }, st, 'plain').split('.')[0]).concat(bibEntry({ title: 'Anti-Oedipus', author: 'Gilles Deleuze and Félix Guattari' }, 'mla', 'plain').split('. ')[0])")
        check(two == ["Deleuze and Guattari"] * 3 + ["Deleuze, Gilles, and Félix Guattari"], f"two authors given by surname alone take no comma; full names keep the inverted first name's ({two})")
        cite = await page.evaluate("bibEntry(S.texts.get('classic-plato-socrates'), 'mla', 'plain')")
        check("From Standard Ebooks" in head and "Plato" in head, f"the book's page says where the text is from ({head[:160]!r})")
        check("Jowett" in cite and "Standard Ebooks" in cite and "2022" in cite, f"it cites the translation and the edition ({cite})")
        check(not errs, "no script errors" + (f": {errs}" if errs else ""))

        # 6 the files themselves
        ok = await page.evaluate("""(async () => { const bad = []; for (const id of CLASSICS) { const b = await (await fetch('data/books/' + id + '.json')).json();
          if (!VALID.texts(b.text) || !VALID.content(b.content) || Object.keys(b).sort().join() !== 'content,text') bad.push(id);
          const img = new Image(); img.src = 'data/books/' + id + '.jpg'; await img.decode(); if (img.naturalWidth !== 400 || img.naturalHeight !== 600) bad.push(id + ' cover'); } return bad; })()""")
        check(ok == [], f"the book files are what a backup may hold, and the covers are 400 x 600 ({ok})")
        # The main course uses exact passages and saves written responses as normal drafts.
        missing = await page.evaluate("""async () => {
          const bad = [];
          for (const l of LEARNING) for (const [slug, sec, label, phrase] of l.readings) {
            const id = 'classic-' + slug, B = await loadContent(id), r = stepRange(B, [id + '-s' + sec]);
            if (!r || B.slice(...r).filter(b => plain(b.x).includes(phrase)).length !== 1) bad.push(label);
          } return bad;
        }""")
        check(not missing, f"all course readings identify one passage in the assigned section ({missing})")
        await page.evaluate("go({screen:'study'})")
        check(await page.locator('.studycards button').first.get_attribute('id') == 'opencourse', "Learning leads the Study screen")
        await page.click('#opencourse')
        check(await page.locator('[data-course-module="milesians"]').is_disabled(), "Ancient begins locked")
        await page.click('[data-course-module="foundations"]')
        # the lesson ends in lesson notes: an outline with a prompt per section and questions whose right answers join the notes
        await page.click('[data-course-act="notes"]')
        outline = await page.evaluate("[[...document.querySelectorAll('.course-page section:not(.cloze) h3')].map((h) => h.textContent), COURSE[0].sections.map((s) => s[0]), document.querySelectorAll('textarea[data-notes-sec]').length, document.querySelectorAll('.nq').length, document.querySelector('[data-course-act=learn]').disabled]")
        check(outline[0] == outline[1] and outline[2] == len(outline[1]) and outline[3] == 10 and outline[4], f"lesson notes: the lesson's outline, a prompt per section, ten questions, Finish closed until they're answered ({outline[2:]})")
        await page.fill('textarea[data-notes-sec="0"]', "Philosophy asks what entitles us to what we rely on.")
        await page.click('[data-notes-q="1"][data-notes-opt="1"]'); await page.wait_for_selector('.nq-hint')
        wrong = await page.evaluate("[!!document.querySelector('[data-notes-q=\"1\"][data-notes-opt=\"1\"]:disabled'), document.querySelector('.nq-hint')?.textContent || '', courseHas(COURSE[0], 'n1')]")
        check(wrong[0] and COURSE_SEC0 in wrong[1] and not wrong[2] if (COURSE_SEC0 := await page.evaluate("COURSE[0].sections[0][0]")) else False, f"a wrong answer is set aside and the section to reread is named ({wrong})")
        for k, qi in enumerate(range(1, 20, 2)):
            await page.click(f'[data-notes-q="{qi}"][data-notes-opt="0"]'); await page.wait_for_function(f"document.querySelectorAll('.nq.done').length === {k + 1}")
        await page.wait_for_function("(S.drafts.get('course-notes-foundations')?.items || []).filter((i) => i.x.startsWith('✓ ')).length === 10")
        check(await page.evaluate("document.querySelector('[data-course-act=learn]').disabled"), "with the blanks still to fill, Finish stays closed")
        # fill in the blanks: every blank is the lesson's own words, once in its paragraph; a wrong word is marked, a right one turns to text
        bad = await page.evaluate("""COURSE.flatMap((m) => (COURSE_CLOZE[m.id] || []).flatMap((c, k) => { const para = m.sections[c.s]?.[c.p + 1] || '';
          return c.blanks.filter((b) => para.split(b).length !== 2).map((b) => m.id + ' ' + k + ': ' + b); })).concat(COURSE.filter((m) => !(COURSE_CLOZE[m.id] || []).length).map((m) => m.id + ' has none'))""")
        check(not bad, f"every module has blanks, each the lesson's own words, once in its paragraph ({bad[:4]})")
        await page.fill('input.cz[data-cz="0:0"]', "ontology"); await page.press('input.cz[data-cz="0:0"]', "Enter")
        check(await page.evaluate("document.querySelector('input.cz[data-cz=\"0:0\"]').getAttribute('aria-invalid')") == "true", "a wrong word in a blank is marked")
        answers = await page.evaluate("COURSE_CLOZE.foundations.flatMap((c, k) => c.blanks.map((b, j) => [k + ':' + j, b]))")
        for key, word in answers:
            await page.fill(f'input.cz[data-cz="{key}"]', word.upper() if key == "0:1" else word)
        await page.wait_for_function("COURSE_CLOZE.foundations.every((_, k) => courseHas(COURSE[0], 'c' + k))")
        await page.wait_for_function("(S.drafts.get('course-notes-foundations')?.items || []).filter((i) => i.x.startsWith('✓ ')).length === 12")
        cz = await page.evaluate("""(() => { const c = COURSE_CLOZE.foundations[0], para = COURSE[0].sections[c.s][c.p + 1], d = S.drafts.get('course-notes-foundations');
          const at = d.items.findIndex((i) => i.x === '✓ ' + para), head = d.items.slice(0, at).reverse().find((i) => i.t === 'h'); return [at > 0, head?.x === COURSE[0].sections[c.s][0], document.querySelectorAll('input.cz').length]; })()""")
        check(cz == [True, True, 0], f"right words (in any case) fill the blanks, and each finished paragraph joins the notes under its section ({cz})")
        notes = await page.evaluate("""(() => { const d = S.drafts.get('course-notes-foundations'), q = COURSE_BANK.foundations[1];
          return [d?.title, d?.items[0], d?.items[1]?.x, d?.items.filter((i) => i.x.startsWith('✓ ') && !COURSE_CLOZE.foundations.some((c) => i.x === '✓ ' + COURSE[0].sections[c.s][c.p + 1])).length, d?.items.some((i) => i.x === '✓ ' + q.q + ' ' + q.options[0]), VALID.drafts(d)]; })()""")
        check(notes[0] == "Lesson notes · What is philosophy?" and notes[1] == {"t": "h", "x": outline[1][0]} and notes[2] == "Philosophy asks what entitles us to what we rely on." and notes[3] == 10 and notes[4] and notes[5],
              f"each right answer is added to the notes under its heading, after your own words; the notes are an ordinary draft ({notes[:4]})")
        await page.click('[data-course-act="learn"]'); await page.wait_for_function("courseRoute().step === 'passage'")
        check(await page.evaluate("courseHas(COURSE[0], 'learn')"), "answering every question finishes the lesson")
        await page.click('[data-course-act="test"]')
        await page.click('[data-course-act="start"]')
        first = await page.evaluate("courseAttempt(COURSE[0]).order.slice()")
        check(all(i % 2 == 0 for i in first), f"the first test asks the questions the notes didn't ({first})")
        for i in range(10):
            await page.click(f'[data-course-answer="{1 if i < 3 else 0}"]')
            if i == 0:
                await page.click('[data-course-act="evidence"]')
                check(await page.locator('#course-evidence').is_visible(), "incorrect answer opens a supporting sentence")
                await page.evaluate("back()")
            await page.click('[data-course-act="advance"]')
        check(await page.locator('[data-course-act="next"]').is_disabled(), "seven correct keeps Next closed")
        await page.click('[data-course-act="start"]')
        second = await page.evaluate("courseAttempt(COURSE[0]).order.slice()")
        check(not set(first).intersection(second), "retake draws ten different questions")
        for i in range(10):
            await page.click(f'[data-course-answer="{1 if i < 2 else 0}"]')
            await page.click('[data-course-act="advance"]')
        await page.click('[data-course-act="next"]')
        check(await page.locator('h1').inner_text() == 'Where philosophy began', "eight correct opens the Milesians")
        check(await page.evaluate("COURSE_BANK.foundations.filter((_,i)=>courseHas(COURSE[0],'q'+i)).length") == 15, "Mastery records distinct correct answers")
        await page.evaluate("go({screen:'course'})")
        await page.click('summary:has-text("Previous learning portfolio")')
        await page.click('#openlearning')
        await page.click('button.btn.primary[data-lesson]')
        await page.click('[data-learning-read="0"]')
        await page.wait_for_selector('#book .bp')
        check(await page.evaluate("R.tid") == "classic-russell-problems", "the first lesson opens Russell in the reader")
        await page.evaluate("back()")
        await page.click('#learning-answer')
        await page.fill('#learning-text', 'The reflection changes when the observer moves.')
        await page.click('#sheetroot button[type=submit]')
        await page.wait_for_selector('[data-draft="learning-appearance"]')
        await page.wait_for_function("!NAV.overlay && !popWaiter")
        await page.click('#learning-feedback')
        await page.fill('#c-by', 'Reading partner')
        await page.fill('#c-x', 'Explain which observation supports your inference.')
        await page.click('#sheetroot button[type=submit]')
        await page.wait_for_function("!NAV.overlay && !popWaiter")
        await page.reload(); await page.wait_for_function(READY)
        await page.evaluate("go({screen:'learning'})")
        check(await page.locator('[data-lesson="appearance"]').inner_text() and
              "Feedback recorded" in await page.locator('[data-lesson="appearance"]').inner_text(),
              "the overview distinguishes saved work from recorded feedback")
        check(await page.locator('button.btn.primary[data-lesson]').get_attribute('data-lesson') == 'definition',
              "a saved response survives reload and the course resumes with the next exercise")

        await browser.close()

server = subprocess.Popen([sys.executable, "-m", "http.server", str(PORT), "-d", str(ROOT)], stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
try:
    time.sleep(1); asyncio.run(main())
finally:
    server.terminate()
print(f"\n{len(failures)} failed" if failures else "\nall passed")
sys.exit(1 if failures else 0)
