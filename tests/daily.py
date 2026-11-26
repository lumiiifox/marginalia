"""Today's question (js/daily.js), with the river question as its acceptance test:
  1. a library stored by the previous storage version (11) opens in version 12 with everything in it and gains the daily store;
  2. Monday: the river question shows on the home screen, under Continue reading, and is recorded as seen without a tap;
  3. Friday: searching "river" finds it, dated Monday and unanswered; Write an answer saves it with Friday's date;
  4. searching "current holds" (words of the answer) reopens the same entry; reopening it that day resumes the same words;
  5. a month later, Answer again folds the earlier answer, saves a dated follow-up and shows both;
  6. a backup holds both answers and Monday's date; restoring after losing the record brings back both, joined to Monday;
     restoring into a copy that saw other days joins the days and keeps the later answers of both, and two first answers both survive;
  7. Keep for later puts a question in Open questions; Study → Daily questions lists every one seen, dated and marked;
  8. the backup check refuses malformed records;
  9. every passage a daily question or the Socratic path cites opens its book there, and the path shows whose Socrates speaks.
Synthetic library; the bundled classics only where a passage is opened."""
import asyncio, datetime, os, subprocess, sys, time
from pathlib import Path
from playwright.async_api import async_playwright
ROOT = Path(__file__).resolve().parent.parent
PORT = int(os.environ.get("MG_PORT", 8831))  # run.py gives each test its own port when they run side by side
failures = []
def check(ok, msg):
    print(("ok   " if ok else "FAIL ") + msg)
    if not ok: failures.append(msg)

OLD = ["texts", "notes", "content", "covers", "terms", "drafts", "compares", "files", "trash", "trashlist", "paths", "wishlist", "mastery"]

async def main():
    async with async_playwright() as p:
        b = await p.chromium.launch()
        ctx = await b.new_context(bypass_csp=True, viewport={"width": 390, "height": 844}, timezone_id="America/Toronto")
        await ctx.route("**/*", lambda r: r.continue_() if r.request.url.startswith(f"http://localhost:{PORT}") else r.abort())
        page = await ctx.new_page(); errs = []; page.on("pageerror", lambda e: errs.append(str(e)))
        await page.goto(f"http://localhost:{PORT}/manifest.webmanifest")
        # 1 a version 11 library
        await page.evaluate("""(stores) => new Promise((resolve, reject) => { const r = indexedDB.open('marginalia', 11);
          r.onupgradeneeded = () => { for (const s of stores) r.result.createObjectStore(s); };
          r.onsuccess = () => { const d = r.result, t = d.transaction(['texts', 'notes'], 'readwrite');
            t.objectStore('texts').put({ title: 'Kept from before', status: 'reading' }, 'old');
            t.objectStore('notes').put({ textId: 'old', kind: 'gloss', gloss: 'An old note', createdAt: 1, updatedAt: 1 }, 'old-note');
            t.oncomplete = () => { d.close(); resolve(); }; t.onerror = () => reject(t.error); }; })""", OLD)
        # Booting the library already records today's question. Give that first visit the fixture's date too.
        await page.clock.set_fixed_time(datetime.datetime(2026, 11, 23, 14, tzinfo=datetime.timezone.utc))
        await page.evaluate("localStorage.setItem('mg-classics', '[]')")
        await page.goto(f"http://localhost:{PORT}/index.html"); await page.wait_for_function("S.mode === 'ready'")
        up = await page.evaluate("[idb.version === DB_VERSION, DB_VERSION, [...idb.objectStoreNames].includes('daily'), S.texts.get('old').title, S.notes.get('old-note').gloss]")
        check(up == [True, 12, True, "Kept from before", "An old note"], f"a version 11 library opens in version 12 with its book and note, and gains the daily store ({up})")
        # the Monday on which the river question comes round
        monday = await page.evaluate("""(() => { const k = DAILY_QUESTIONS.findIndex((x) => x.id === 'river');
          for (let i = 0; ; i++) { const d = new Date(2026, 10, 23 + i, 9); if (d.getDay() === 1 && dayNumber(d) % DAILY_QUESTIONS.length === k) return [d.getFullYear(), d.getMonth() + 1, d.getDate()]; } })()""")
        mon = datetime.datetime(*monday, 9, 0)
        async def at(dt):
            await page.clock.set_fixed_time(dt)
            await page.goto(f"http://localhost:{PORT}/index.html"); await page.wait_for_function("S.mode === 'ready'")
        key = lambda dt: dt.strftime("%Y-%m-%d")
        # 2 Monday: seen, untouched
        await at(mon)
        card = await page.evaluate("(() => { const c = document.querySelector('.dqcard'); return c && [c.dataset.dqcard, c.querySelector('.dq-q').textContent, !!c.querySelector('[data-dqwrite]'), !!c.querySelector('[data-dqkeep]')]; })()")
        check(card and card[0] == "river" and "river" in card[1] and card[2] and card[3], f"Monday: the river question is on the home screen with Write an answer and Keep for later ({card})")
        check(await page.evaluate("S.screen === 'library' && !!document.querySelector('#main > .dqcard')"), "it is on Home, with the book you're reading")
        await page.wait_for_function("S.daily.has('river')")
        rec = await page.evaluate("S.daily.get('river')")
        check(rec["first"] == key(mon) and rec["seen"] == [key(mon)] and "answer" not in rec, f"seen without a tap: recorded as first shown on Monday ({rec['first']}, {rec['seen']})")
        # 3 Friday: search finds it, unanswered; write an answer
        fri = mon + datetime.timedelta(days=4)
        await at(fri)
        await page.fill("#q", "river"); await page.wait_for_selector(".dqhit")
        hit = await page.evaluate("(() => { const h = document.querySelector('.dqhit'); return [h.dataset.dqopen, h.textContent]; })()")
        check(hit[0] == "river" and "Unanswered" in hit[1], f"Friday: searching river finds Monday's unanswered question ({hit[1][:120]})")
        await page.click(".dqhit"); await page.wait_for_selector(".dqentry")
        check("First shown" in await page.inner_text(".dqentry"), "its entry says when it was first shown")
        await page.click(".dqentry [data-dqwrite]"); await page.wait_for_selector("#dq-x")
        await page.fill("#dq-x", "the current holds it together"); await page.click("#sheetroot button[type=submit]")
        await page.wait_for_selector(".dqentry")
        rec = await page.evaluate("S.daily.get('river')")
        check(rec.get("answer", {}).get("x") == "the current holds it together" and rec["answer"]["day"] == key(fri) and rec["first"] == key(mon),
              "the answer is saved with Friday's date, on the record first shown Monday")
        check("the current holds it together" in await page.inner_text(".dqentry"), "after saving, the entry shows the answer")
        await page.click("#pclose"); await page.wait_for_timeout(200)
        # 4 search the answer's words; reopening the same day resumes them
        await page.fill("#q", ""); await page.fill("#q", "current holds"); await page.wait_for_selector(".dqhit .dq-ex")
        hit = await page.evaluate("(() => { const h = document.querySelectorAll('.dqhit'); return [h.length, h[0].dataset.dqopen, h[0].querySelector('.dq-ex') && h[0].querySelector('.dq-ex').textContent]; })()")
        check(hit[0] == 1 and hit[1] == "river" and hit[2] and "current holds" in hit[2], f"searching “current holds” finds the same entry, with the matching words ({hit})")
        await page.click(".dqhit"); await page.wait_for_selector(".dqentry")
        await page.click(".dqentry [data-dqwrite]"); await page.wait_for_selector("#dq-x")
        check(await page.input_value("#dq-x") == "the current holds it together", "reopened the same day, the answer resumes with its words")
        await page.fill("#dq-x", "the current holds it together, as the banks do"); await page.click("#sheetroot button[type=submit]"); await page.wait_for_selector(".dqentry")
        rec = await page.evaluate("S.daily.get('river')")
        check(rec["answer"]["x"].endswith("as the banks do") and not rec.get("followups"), "a second visit that day changes that day's answer and adds nothing")
        await page.click("#pclose"); await page.wait_for_timeout(200)
        # 5 a month later: Answer again
        later = fri + datetime.timedelta(days=31)
        await at(later)
        await page.evaluate("dqWrite('river')"); await page.wait_for_selector("#dq-x")
        sheet = await page.evaluate("(() => { const s = document.querySelector('#sheetroot'); const d = s.querySelector('details.dq-prev'); return [s.querySelector('h2').textContent, !!d, d && d.open, s.querySelector('#dq-x').value]; })()")
        check(sheet == ["Answer again", True, False, ""], f"a month later: Answer again, with the earlier answer folded and an empty box ({sheet})")
        await page.fill("#dq-x", "nothing holds it: it is the flowing"); await page.click("#sheetroot button[type=submit]"); await page.wait_for_selector(".dqentry")
        rec = await page.evaluate("S.daily.get('river')")
        fus = rec.get("followups") or []
        check(len(fus) == 1 and fus[0]["x"] == "nothing holds it: it is the flowing" and rec["answer"]["day"] == key(fri), "the new answer is a dated follow-up; the first stays as it was")
        both = await page.evaluate("[...document.querySelectorAll('.dqentry .later .fu')].map((x) => x.textContent)")
        check(len(both) == 2 and "banks" in both[0] and "flowing" in both[1], f"both answers are shown, in order, to compare ({len(both)})")
        check(await page.evaluate("!!document.querySelector('.dqentry .dq-again')"), "once answered, the entry says what to look at on a second attempt")
        await page.click("#pclose"); await page.wait_for_timeout(200)
        # 6 backup and restore
        data = await page.evaluate("backupData()")
        dr = data.get("daily", {}).get("river", {})
        check(dr.get("first") == key(mon) and dr.get("answer", {}).get("x", "").endswith("banks do") and len(dr.get("followups", [])) == 1, "the backup holds both answers and Monday's date")
        restored = await page.evaluate("""async (data) => { await del('daily', 'river'); const plan = planRestore(data); await applyRestore(plan, false);
          const r = S.daily.get('river'), back = await idbGet('daily', 'river'); return [r && r.first, r && r.answer.x, r && r.followups.length, !!back]; }""", data)
        check(restored == [key(mon), "the current holds it together, as the banks do", 1, True], f"restoring brings back both answers joined to Monday's question ({restored})")
        merged = await page.evaluate("""async (data) => { const cur = S.daily.get('river');
          await put('daily', 'river', { ...cur, seen: [...cur.seen, '2030-01-01'], followups: [...cur.followups, { id: 'here', at: Date.now() + 5, x: 'only on this device' }], updatedAt: Date.now() + 5 });
          const theirs = structuredClone(data); theirs.daily.river.seen = ['2020-02-02', ...theirs.daily.river.seen]; theirs.daily.river.first = '2020-02-02';
          theirs.daily.river.followups = [...theirs.daily.river.followups, { id: 'there', at: 5, x: 'only in the backup' }];
          await applyRestore(planRestore(theirs), false); const r = S.daily.get('river');
          return [r.seen.includes('2030-01-01') && r.seen.includes('2020-02-02'), r.first, r.followups.map((f) => f.id).sort().join()]; }""", data)
        check(merged[0] and merged[1] == "2020-02-02" and "here" in merged[2] and "there" in merged[2], f"restoring into a copy that changed joins both copies' days and later answers ({merged})")
        two = await page.evaluate("""() => { const a = { q: 'Q', first: '2026-01-01', seen: ['2026-01-01'], answer: { at: 100, day: '2026-01-01', x: 'on the phone' }, followups: [] };
          const b = { ...a, answer: { at: 200, day: '2026-01-02', x: 'on the laptop' } };
          const m1 = withDaily(b, a), m2 = withDaily(a, b), m3 = withDaily(withDaily(a, b), b);
          return [m1.answer.x, m1.followups.map((f) => f.x).join(), m2.answer.x, m2.followups.map((f) => f.x).join(), m3.followups.length]; }""")
        check(two == ["on the phone", "on the laptop", "on the phone", "on the laptop", 1], f"two first answers written on two devices both survive a restore, the later as a later answer, once ({two})")
        # 7 keep for later, Open questions, Study
        other = await page.evaluate("DAILY_QUESTIONS.find((x) => x.id !== 'river').id")
        await page.evaluate("(id) => dqKeep(id)", other); await page.wait_for_function("(id) => S.daily.get(id) && S.daily.get(id).kept", arg=other)
        await page.evaluate("go({ screen: 'questions' })"); await page.wait_for_timeout(150)
        check(await page.evaluate("(id) => !!document.querySelector(`#main [data-dqopen=\"${id}\"]`)", other), "a kept question waits in Open questions")
        await page.evaluate("go({ screen: 'study' })"); await page.wait_for_selector("#opendaily"); await page.click("#opendaily"); await page.wait_for_selector(".dqrow")
        rows = await page.evaluate("[...document.querySelectorAll('.dqrow')].map((r) => [r.dataset.dqopen, r.querySelector('.ty').textContent])")
        ids = [r[0] for r in rows]
        check("river" in ids and other in ids and any(r[0] == other and "Kept" in r[1] for r in rows) and any(r[0] == "river" and "Answered" in r[1] for r in rows),
              f"Study → Daily questions lists each one, dated and marked ({rows})")
        # 8 the backup check
        v = await page.evaluate("""(() => { const r = S.daily.get('river'); return [validDaily(r), validDaily({ ...r, extra: 1 }), validDaily({ ...r, first: 'Monday' }), validDaily({ ...r, q: '' }),
          validDaily({ ...r, answer: { at: 1, day: '2026-1-1', x: 'x' } }), validDaily({ ...r, followups: [{ id: 'a', at: 'x', x: 'y' }] }), validDaily({ ...r, seen: ['2026-01-01', 3] })]; })()""")
        check(v == [True, False, False, False, False, False, False], f"the backup check refuses malformed daily records ({v})")
        # 9 passages open where they say
        await page.evaluate("addClassics(true)"); await page.wait_for_function("S.texts.has('classic-xenophon-memorabilia') && S.texts.has('classic-plato-socrates') && S.texts.has('classic-aristotle-metaphysics')", timeout=60000)
        bad = await page.evaluate("""async () => { const bad = [], html = [];
          for (const d of DAILY_QUESTIONS) html.push(passageLinks(esc(d.text), d.xr));
          const P = PATHS.find((x) => x.id === 'socratic-piety');
          for (const st of P.steps) if (st.xr) html.push(passageLinks(esc(st.why), st.xr));
          const box = document.createElement('div'); box.innerHTML = html.join(' ');
          const links = [...box.querySelectorAll('[data-passage]')];
          for (const l of links) { const style = PASSAGE_STYLES[l.dataset.passage], B = await loadContent(style.book); if (passageBlock(B, l.dataset.passageAt, l.dataset.passage) < 0) bad.push(l.textContent); }
          for (const [k] of Object.entries(XEN_MEM)) { const B = await loadContent('classic-xenophon-memorabilia'); if (PASSAGE_STYLES['xenophon-memorabilia'].find(B, k.split('.').concat([]).map(String)) < 0) bad.push('XEN_MEM ' + k); }
          return [links.length, bad]; }""")
        check(bad[0] >= 12 and not bad[1], f"every cited passage opens its book there ({bad[0]} links; missing: {bad[1]})")
        await page.evaluate("go({ screen: 'paths', path: 'socratic-piety' })"); await page.wait_for_selector(".syllabus")
        for k in range(3):
            await page.evaluate("(k) => selectPathStep('socratic-piety', k)", k); await page.wait_for_timeout(100)
            who = await page.evaluate("(document.querySelector('.syllabus-reading.selected .syllabus-who') || {}).textContent || ''")
            check(("Plato" if k == 0 else "Xenophon") in who, f"step {k + 1} says whose Socrates speaks ({who})")
        await page.evaluate("selectPathStep('socratic-piety', 0)"); await page.wait_for_timeout(100)
        await page.click(".syllabus-reading.selected [data-dispute='euthyphro']"); await page.wait_for_selector("#dsp-x")
        check(True, "the first step opens the Euthyphro disputation")
        await page.click("#pclose"); await page.wait_for_timeout(200)
        await page.evaluate("selectPathStep('socratic-piety', 1)"); await page.wait_for_timeout(100)
        await page.click(".syllabus-reading.selected [data-passage='xenophon-memorabilia']")
        await page.wait_for_function("S.screen === 'reader' && S.textId === 'classic-xenophon-memorabilia'")
        check(await page.evaluate("plain(S.content.get('classic-xenophon-memorabilia')[R.at !== undefined ? R.at : currentBlock()].x || '').includes('what each reality was') || document.querySelector('.flash') !== null"), "a Memorabilia reference opens the reader at its passage")
        for w in (320, 390):
            await page.set_viewport_size({"width": w, "height": 800})
            for scr in ["library", "daily", "questions"]:
                await page.evaluate("(s) => go({ screen: s })", scr); await page.wait_for_timeout(100)
                fit = await page.evaluate("[document.documentElement.scrollWidth <= innerWidth, [...document.querySelectorAll('body *')].filter((e) => e.getBoundingClientRect().right > innerWidth + 1).slice(0, 12).map((e) => e.tagName + '.' + e.className + ':' + Math.round(e.getBoundingClientRect().width) + ':' + (e.textContent||'').slice(0,40))]")
                check(fit[0], f"{scr} fits {w}px {fit[1] if not fit[0] else ''}")
        check(not errs, f"no script errors: {errs}")
        await ctx.close(); await b.close()

srv = subprocess.Popen([sys.executable, "-m", "http.server", str(PORT), "-d", str(ROOT)], stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
try: time.sleep(1); asyncio.run(main())
finally: srv.terminate()
print(f"{len(failures)} failed" if failures else "all passed")
sys.exit(bool(failures))
