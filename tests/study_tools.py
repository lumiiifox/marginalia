"""Study tools around the reference sections. Run after changes to them:  python3 tests/study_tools.py

Uses made-up records only. Checks that:
  1. the truth table: opened from Logic and from Validity; modus ponens is valid with its rows marked, affirming the consequent
     invalid with exactly its one counterexample; typed ASCII (~ & | -> <->, "v", words) reads the same as the symbols; brackets
     and the order of binding come out right; mistakes get a plain message; an inconsistent set of premises and a tautology are
     explained; more than six letters is refused; the symbol keys type into the field you were in; nothing is stored;
     the table scrolls inside its frame instead of the page at phone width.
  2. term of the day: one of the glossary's entries on the home screen, the same all day, every entry once before any repeats,
     your edit of it shown if you made one; tapping it opens it in the glossary; nothing is stored.
  3. Hear it: a glossary term and a thinker's card each have a button that has the phone's voice say the name (bracketed parts left
     out), without closing the card; with no voice on the device there is no button.
  4. flashcards for Anki: from Export, a tab-separated file with Anki's headers (deck, note type, tags column); your notes with the
     passage in front and your words, follow-ups and the place on the back; the terms you added or edited; the words you looked up;
     tabs, line breaks, quotes and markup can't break a row or a field; the whole glossary as its own file; with nothing of your
     own, a message instead of an empty file.
  5. a glossary term shows its thinkers on one time scale in order of birth, each opening their card (none for fewer than two
     dated thinkers); a thinker's card goes two steps along "drew on" both ways, without repeating the first step or the thinker,
     in order of birth, long rows folded after eight.
  6. a book's page shows where in the book your notes are: a bar per stretch with notes, as tall as its share, lines at chapters, a dot
     at your place, a line saying where they gather; a bar opens the reader at its first note; none for fewer than two placed notes.
  7. the fallacies: every one in the glossary marked formal or informal, with a definition, a longer note and a source; the Logic
     branch lists them, formal then informal, each opening its entry; a formal fallacy's entry opens the truth table on its example,
     which links back to the entry, however the argument is typed.
  8. reading paths: every step names a classic that comes with the app and chapters it has, in order, with glossary terms and
     branches that exist; the home screen and a branch's entry open them; a step opens the reader at its first chapter, or at your
     place when you're already inside its chapters; ticking its chapters as read marks it done; a classic you deleted can be
     added back from its step.
  9. from your margins: the home screen shows one of your notes made at least two weeks ago (none newer, none from the example
     book), the same one all day and a different one on other days; Another moves to the next without redrawing the screen;
     Follow up opens the note's follow-up, Show in text appears when the book's text is here; with no note old enough, no card.
  10. essay templates: New draft offers a blank draft or a template; a template gives its headings, each with a line of guidance
      drawn apart from your own paragraphs, named after the template unless you give a title; the draft is the usual kind a backup holds.
  11. argument puzzles: Name the fallacy asks about each fallacy's own examples, with four different fallacies to choose from and
      never two easily confused ones together; Valid or not? makes arguments whose answer the truth table confirms, about half
      valid, never with inconsistent premises or a tautology for a conclusion, and opens the truth table on the argument;
      both open from the Logic branch.
  12. guess the thinker: one thinker a day, the same all day; every thinker it can pick has at least four clues, none giving the
      name away; a wrong guess shows the next clue and is listed; a name not in the app is refused; a right guess or Show me ends
      the game, offering their card and a result to share; today's game survives closing the panel, and tomorrow starts afresh.
  13. connect two thinkers (Thinkers → Puzzles): a target exactly the chosen number of steps on; each choice is someone whose entry
      lists the current thinker as drawn on; following a shortest route arrives in the fewest steps; Hint marks a choice on one;
      Step back undoes; running out of steps or Show a way ends it with a real shortest route.
  14. order of birth: five thinkers with exact birth years at least twelve years apart (one period's, when asked); tapping them in
      order and Check scores them, a placed name can be taken back first, and the answer is drawn on one time scale.
  15. bookplates: worked out from the library; firsts dated by the earliest note, follow-up, draft or comparison that earns them; a book
      read through or summed up only when every chapter is (back matter like Notes left out) and it has two or more; Finished from its
      shelf; a reading path walked once every step is done; the example book never counts; the home screen's chip and a book's page
      show them, a plate opens its book, and what is still to come is listed apart.
  16. missing premise: four different options, only the right one makes the argument valid (the others each have a counterexample),
      and the remaining premises alone don't prove the conclusion; put the steps in order: a modus ponens chain, checked exactly,
      with the proof written out; both from the Logic branch.
  17. how to reconstruct an argument: the guide opens from the Logic branch with its steps, an example and its sources, and its steps
      fold out under an Argument note's premises.
  18. quiz sets: chosen in Make a quiz set (from Quiz yourself), at least four, your own terms included; the link holds them all; opening
      it in a fresh browser starts a quiz on just those terms and cleans up the address; markup in a link is drawn as text, a damaged
      link is refused; a reading path's Share link opens that path.
  19. disputations: each names a classic the app has, a chapter of it, and words found in that chapter, with glossary terms that exist and
      a source; from the home screen, each opens with its argument; Compare waits for an objection of some length, Just show me doesn't;
      what you write survives closing the panel; Save makes an Objection note on the book, in that chapter at that passage, tagged
      #disputation, and the list says so; Read the passage opens the reader there; a deleted classic can be added back.
  20. questions to read with: every path step has three, folded on the path; Add to my questions makes a Question note on the book at
      the step's first chapter, once; a book's Where you left off shows a step's questions only while your place is inside its chapters.
  21. primers: every classic has one, with words to know that are in the glossary and a source; a classic's page shows it open until
      you start reading or take a note, folded after; it links to the reading paths that use the book.
  22. sources: no glossary entry, thinker, branch, primer, disputation or reading path cites Wikipedia; every source link is https.
  23. a branch article's section sources (xs): each names a heading the article has, each source has a name, links are https;
      an article has them exactly when its audit record is in tests/audit, and every other article is marked Unchecked;
      Epistemology shows one quiet sources line under each of its sourced sections, links opening in a new tab.
  24. Mentioned in: a glossary entry lists the articles (by section), thinker cards and other entries that use its name, each with the
      sentence and the words marked, never itself; plurals count, other words built on it don't; tapping an article's row opens the
      article at that section; a thinker's card lists the same, by the names the articles link (accents ignored, short names in exact
      case, Said and Land only in full), and your notes that name them.
  25. a draft exported for critique: the draft with each quoted passage marked [E1], [E2]; the evidence with each passage's status
      (verbatim at its saved place, found word for word elsewhere, not found, or not checked when the text isn't here), its page and
      chapter from the book, a page the note gives that disagrees, and the paragraph around it; the glossary terms used in the writer's
      own words only, with the warning that a definition is no evidence; works cited; guide lines left out; offered from Export.
Needs: pip install playwright && playwright install chromium
"""
import asyncio, subprocess, sys, time
from pathlib import Path
from playwright.async_api import async_playwright

ROOT = Path(__file__).resolve().parent.parent
PORT = 8812
URL = f"http://localhost:{PORT}/index.html"
READY = "typeof idb !== 'undefined' && idb && S.mode === 'ready'"
failures = []
def check(ok, what):
    print(("ok   " if ok else "FAIL ") + what)
    if not ok: failures.append(what)

async def fresh(browser):
    ctx = await browser.new_context(viewport={"width": 390, "height": 844}, is_mobile=True, has_touch=True, accept_downloads=True)
    page = await ctx.new_page(); errs = []
    page.on("pageerror", lambda e: errs.append(str(e)))
    page.on("console", lambda m: m.type == "error" and "Failed to load resource" not in m.text and errs.append(m.text))
    await page.route("https://commons.wikimedia.org/**", lambda r: r.abort())
    await page.goto(URL); await page.wait_for_function(READY)
    return page, errs

TT = "([p, c]) => { const r = ttCheck(p, c); return r.err !== undefined ? { err: r.err } : { vars: r.vars, cx: r.cx, live: r.live, n: r.rows.length, prem: r.prem.map((x) => ttShow(x)), concl: ttShow(r.concl) }; }"

async def custom_paths(browser):
    page, errs = await fresh(browser)
    await page.evaluate("""async () => {
      await put('texts', 'own-a', { title: 'A research text', author: 'Author', hasContent: true, pos: 0,
        sections: [{id:'a',label:'First chapter'}, {id:'b',label:'Second chapter'}, {id:'c',label:'Third chapter'}] });
      await put('content', 'own-a', [{k:'h',l:2,s:'a',x:'First chapter'}, {k:'p',x:'First paragraph. '.repeat(300)},
        {k:'h',l:2,s:'b',x:'Second chapter'}, {k:'p',x:'Second paragraph.'}, {k:'h',l:2,s:'c',x:'Third chapter'}, {k:'p',x:'Third paragraph.'}]);
      await put('texts', 'own-b', {title:'B research text', sections:[], status:'finished'});
      go({screen:'paths'});
    }""")
    await page.click('#newpath')
    await page.fill('#pe-name', 'My inquiry <em>literal</em>')
    await page.fill('#pe-description', 'A question of method')
    await page.click('#pe-add')
    await page.select_option('#pe-start-0', 'b')
    await page.select_option('#pe-end-0', 'c')
    await page.fill('#pe-why-0', 'Read the argument carefully.')
    await page.fill('#pe-q-0', 'What is presupposed?\nWhat would refute it?')
    await page.click('#pe-add')
    await page.select_option('#pe-book-1', 'own-b')
    await page.click('[data-pe-move="1"][data-dir="-1"]')
    await page.click('#sheetroot button[type=submit]')
    await page.wait_for_function('S.paths.size === 1 && !NAV.overlay')
    key = await page.evaluate('[...S.paths.keys()][0]')
    path = await page.evaluate('[...S.paths.values()][0]')
    check(path['steps'][0]['book'] == 'own-b' and path['steps'][1]['secs'] == ['b','c'] and len(path['steps'][1]['q']) == 2,
          'custom path saves whole books, chapter ranges, order and questions')
    check(await page.locator(f'[data-path-id="{key}"] h2 em').count() == 0, 'custom path title renders as plain text')
    for width in [390, 1280]:
        await page.set_viewport_size({'width':width,'height':844})
        check(await page.evaluate('document.documentElement.scrollWidth <= innerWidth'), f'custom path fits {width}px')
    await page.click(f'[data-pathedit="{key}"]')
    await page.fill('#pe-name', 'Cancelled edit')
    await page.click('#cancel')
    check(await page.evaluate('[...S.paths.values()][0].n') == path['n'], 'Cancel leaves saved path intact')
    await page.click(f'[data-pathedit="{key}"]')
    await page.select_option('#pe-start-1', 'c')
    await page.select_option('#pe-end-1', 'b')
    await page.click('#sheetroot button[type=submit]')
    check('reading order' in await page.locator('#err').inner_text(), 'reversed chapter range is rejected')
    await page.select_option('#pe-start-1', 'b')
    await page.select_option('#pe-end-1', 'c')
    await page.fill('#pe-name', 'Revised inquiry')
    await page.click('#sheetroot button[type=submit]')
    await page.wait_for_function('!NAV.overlay')
    await page.click(f'[data-path-id="{key}"] [data-pathread="own-a|b,c"]')
    await page.wait_for_function("S.screen === 'reader' && !!R.blocks")
    await page.wait_for_timeout(300)
    check(await page.evaluate('pageForBlock(currentBlock()) === pageForBlock(2)'), 'custom chapter step opens at its first chapter')
    await page.evaluate("go({screen:'paths'})")
    await page.locator(f'[data-path-id="{key}"] .readqd summary').click()
    await page.locator(f'[data-path-id="{key}"] [data-askq]').first.click()
    await page.wait_for_function("[...S.notes.values()].some(n => n.gloss === 'What is presupposed?')")
    check(True, 'custom path question becomes a question note')
    async with page.expect_download() as dl:
        await page.click(f'[data-pathexport="{key}"]')
    import json
    data = json.loads(Path(await (await dl.value).path()).read_text())
    check(data['app'] == 'marginalia-path' and 'texts' not in data and 'notes' not in data, 'path export contains references only')
    await page.evaluate('(data) => importCustomPath(new File([JSON.stringify(data)], "path.json"))', data)
    await page.wait_for_selector('#pe-name')
    check(await page.evaluate('S.paths.size') == 1, 'import shows a review before saving')
    await page.click('#sheetroot button[type=submit]')
    await page.wait_for_function('S.paths.size === 2 && !NAV.overlay')
    check(await page.evaluate('S.notes.size') == 1, 'import creates a separate path without changing annotations')
    await page.reload(); await page.wait_for_function(READY)
    check(await page.evaluate('S.paths.size') == 2, 'custom paths survive reload')
    await page.evaluate("go({screen:'paths'})")
    await page.click(f'[data-pathdelete="{key}"]'); await page.click(f'[data-pathdelete="{key}"]')
    await page.wait_for_function('S.paths.size === 1')
    await page.click('#toast .toastbtn')
    await page.wait_for_function('S.paths.size === 2')
    check(True, 'deleted custom path is recoverable with Undo')
    result = await page.evaluate("""() => {
      const P = [...S.paths.values()][0], clone = () => JSON.parse(JSON.stringify(P));
      const bad = clone(); bad.steps[0].q = [3]; const unknown = clone(); unknown.html = '<script>';
      const future = clone(); future.version = 2; const large = clone(); large.steps = Array(101).fill(P.steps[0]);
      return [bad, unknown, future, large].every(p => !VALID.paths(p));
    }""")
    check(result, 'invalid types, unknown fields, versions and oversized paths are rejected')
    check(await page.evaluate("() => { const p = {...[...S.paths.values()][0], steps:[]}; S.paths.set('empty-test',p); const done = bookplates().paths.some(x => x.path === 'empty-test'); S.paths.delete('empty-test'); return !done; }"), 'an empty path is never counted as completed')
    await page.evaluate("""async () => { await del('texts','own-a'); go({screen:'paths'}); }""")
    check('Edit this path to choose a copy' in await page.locator('#main').inner_text(), 'missing imported book has an explicit way to reconnect it')
    check(not errs, f'custom paths without script errors: {errs}')
    await page.context.close()

    ctx = await browser.new_context(); pg = await ctx.new_page()
    await pg.goto(f'http://localhost:{PORT}/sw.js')
    await pg.evaluate("""() => new Promise((res,rej) => {
      const r = indexedDB.open('marginalia',8);
      r.onupgradeneeded = () => ['texts','notes','content','covers','terms','drafts','compares','files','trash','trashlist'].forEach(s => r.result.createObjectStore(s));
      r.onsuccess = () => { const db=r.result, tx=db.transaction(['texts','notes'],'readwrite');
        tx.objectStore('texts').put({title:'Existing book',pos:7},'old');
        tx.objectStore('notes').put({textId:'old',gloss:'Preserve my note'},'old-note');
        tx.oncomplete=() => {db.close();res()}; tx.onerror=() => rej(tx.error); }; r.onerror=() => rej(r.error);
    })""")
    await pg.goto(URL); await pg.wait_for_function(READY)
    check(await pg.evaluate("[idb.version, S.paths.size, S.texts.get('old').pos, S.notes.get('old-note').gloss]") == [9,0,7,'Preserve my note'],
          'version 8 upgrade preserves existing position and annotations')
    await ctx.close()

async def truth_table(browser):
    page, errs = await fresh(browser)
    # from the Logic branch
    await page.evaluate("go({ screen: 'branches', focus: 'logic' })"); await page.wait_for_timeout(200)
    await page.click("details[data-branch-id='logic'] [data-truth]"); await page.wait_for_selector("#tt-p")
    check(await page.locator("#ttout").inner_text() == "Write a conclusion to see the table.", "the truth table opens from Logic, waiting for an argument")
    # an example: modus ponens
    await page.click("[data-ttex='0']"); await page.wait_for_timeout(100)
    out = await page.inner_text("#ttout")
    rows = await page.evaluate("[document.querySelectorAll('.tt tbody tr').length, document.querySelectorAll('.tt tr.ok').length, document.querySelectorAll('.tt tr.cx').length]")
    check(out.startswith("Valid.") and rows == [4, 1, 0], f"modus ponens is valid: four rows, the one with both premises true marked ✓ ({rows})")
    heads = await page.evaluate("[...document.querySelectorAll('.tt thead th')].map((x) => x.textContent)")
    check(heads == ["P", "Q", "P → Q", "P", "∴ Q", ""], f"the columns are the letters, each premise and the conclusion ({heads})")
    # affirming the consequent
    await page.click("[data-ttex='4']"); await page.wait_for_timeout(100)
    out = await page.inner_text("#ttout")
    cx = await page.evaluate("[...document.querySelectorAll('.tt tr.cx')].map((r) => [...r.cells].map((c) => c.textContent).join(''))")
    check(out.startswith("Not valid.") and "One row" in out and cx == ["FTTTF✗"], f"affirming the consequent is invalid, its one counterexample marked: P false, Q true ({cx})")
    # typing, live
    await page.fill("#tt-p", "p -> q\n~q"); await page.fill("#tt-c", "~p"); await page.wait_for_timeout(100)
    check((await page.inner_text("#ttout")).startswith("Valid."), "typing ASCII updates the table as you type (modus tollens, valid)")
    # the symbol keys type where the cursor is, in the field last used
    await page.fill("#tt-c", "P Q"); await page.focus("#tt-c")
    await page.evaluate("const f = document.querySelector('#tt-c'); f.setSelectionRange(2, 2)")
    await page.click("[data-ttsym='∧']")
    got = [await page.input_value("#tt-c"), await page.evaluate("document.activeElement.id")]
    check(got == ["P ∧ Q", "tt-c"], f"a symbol key types into the field you were in, at the cursor, and leaves you there ({got})")
    # sideways
    await page.evaluate("TT.prem = 'A ∧ B\\nC ∨ D\\nE → F'; TT.concl = '(A ∧ B) ↔ (C ∨ (D ∧ ¬E))'; document.querySelector('#ttout').innerHTML = ttHTML()")
    hs = await page.evaluate("[document.documentElement.scrollWidth > innerWidth, document.querySelector('.sheet').scrollWidth > document.querySelector('.sheet').clientWidth + 1, document.querySelectorAll('.tt tbody tr').length]")
    check(hs == [False, False, 64], f"six letters make 64 rows, and a wide table scrolls inside its frame, not the page ({hs})")
    # from the glossary's Validity
    await page.click("#pclose"); await page.wait_for_timeout(200)
    await page.evaluate("openTerm('validity')"); await page.wait_for_timeout(200)
    check(await page.locator("details[data-term-id='validity'] [data-truth]").count() == 1, "Validity in the glossary offers the truth table")
    store = await page.evaluate("Object.keys(localStorage).filter((k) => /tt|truth/i.test(k))")
    check(store == [], f"nothing is stored ({store})")

    # the logic itself
    same = await page.evaluate(f"[({TT})(['P → Q\\nQ', 'P']), ({TT})(['p -> q\\nq', 'p']), ({TT})(['P implies Q\\nQ', 'P']), ({TT})(['P => Q\\nQ', 'P'])]")
    same = [(x["cx"], x["live"], x["n"]) for x in same]
    check(all(x == same[0] for x in same) and same[0][0] == 1, f"symbols, ASCII and words read alike ({same})")
    v = await page.evaluate(f"[({TT})(['p v q\\n~p', 'q']), ({TT})(['P & Q', 'P | R']), ({TT})(['P <-> Q\\nP', 'Q']), ({TT})(['!(P & Q)', '!P | !Q'])]")
    check([x.get("cx") for x in v] == [0, 0, 0, 0], f"'v', &, |, <->, ! all work, and De Morgan's law checks out ({[x.get('cx') for x in v]})")
    shown = await page.evaluate("['P → Q → R', '(P → Q) → R', 'P ∧ Q ∨ R', 'P ∧ (Q ∨ R)', '¬(P ∧ Q)', '¬¬P', 'P ∨ Q ∨ R', 'P ↔ Q → R'].map((x) => ttShow(ttParse(x)))")
    check(shown == ["P → Q → R", "(P → Q) → R", "P ∧ Q ∨ R", "P ∧ (Q ∨ R)", "¬(P ∧ Q)", "¬¬P", "P ∨ Q ∨ R", "P ↔ Q → R"], f"→ groups to the right, ∧ binds before ∨, ¬ tightest, and only needed brackets are written ({shown})")
    arrow = await page.evaluate(f"[({TT})(['', '(P → Q) → R']).cx, ({TT})(['', 'P → (Q → R)']).cx, ({TT})(['P → Q → R', 'P → (Q → R)']).cx, ({TT})(['P → (Q → R)', 'P → Q → R']).cx]")
    check(arrow == [3, 1, 0, 0], f"P → Q → R means P → (Q → R) ({arrow})")
    errs_ = await page.evaluate(f"[({TT})(['P →', 'Q']).err, ({TT})(['(P ∧ Q', 'P']).err, ({TT})(['P ∧ Q)', 'P']).err, ({TT})(['P Q', 'P']).err, ({TT})(['Rain → Wet', 'P']).err, ({TT})(['P', 'Q %']).err, ({TT})(['P', 'Q ∧']).err]")
    ok = [e and e.startswith(w) for e, w in zip(errs_, ["Premise 1: It ends too soon", "Premise 1: A bracket is opened", "Premise 1: A closing bracket", "Premise 1: Something is missing before Q", "Premise 1: “Rain” isn't one sentence letter", "Conclusion: “%”", "Conclusion: It ends too soon"])]
    check(all(ok), f"mistakes get a plain message saying where ({errs_})")
    edge = await page.evaluate(f"[({TT})(['P\\n¬P', 'Q']), ({TT})(['', 'P ∨ ¬P']), ({TT})(['', 'P ∧ ¬P']), ({TT})(['A\\nB\\nC\\nD\\nE\\nF', 'G'])]")
    check(edge[0]["cx"] == 0 and edge[0]["live"] == 0 and edge[1]["cx"] == 0 and edge[2]["cx"] == 2 and "up to 6 sentence letters" in edge[3]["err"], f"inconsistent premises, a tautology, a contradiction, and seven letters ({edge})")
    await page.evaluate("TT.prem = 'P\\n¬P'; TT.concl = 'Q'; truthPanel()"); await page.wait_for_timeout(100)
    check("can never all be true together" in await page.inner_text("#ttout"), "inconsistent premises are explained: valid, and never sound")
    await page.evaluate("TT.prem = ''; TT.concl = 'P ∨ ¬P'; truthPanel()"); await page.wait_for_timeout(100)
    check("tautology" in await page.inner_text("#ttout"), "a conclusion with no premises is checked as a tautology")
    check(not errs, "no script errors in the truth table" + (f": {errs}" if errs else ""))
    await page.context.close()

async def term_of_day(browser):
    page, errs = await fresh(browser)
    r = await page.evaluate("""(() => { const n = GLOSSARY.length, d0 = dayNumber(new Date(2026, 9, 18));
      const ids = []; for (let d = d0 - (d0 % n); d < d0 - (d0 % n) + n; d++) ids.push(termOfDay(d).id);
      const next = []; for (let d = d0 - (d0 % n) + n; d < d0 - (d0 % n) + 2 * n; d++) next.push(termOfDay(d).id);
      return [n, new Set(ids).size, ids.every((id) => GLOSSARY.some((g) => g.id === id)), ids.join() !== next.join(), termOfDay(d0).id === termOfDay(dayNumber(new Date(2026, 9, 18, 23, 59))).id,
        termOfDay(d0).id !== termOfDay(d0 + 1).id]; })()""")
    check(r[1] == r[0] and r[2] and r[3] and r[4] and r[5], f"every glossary entry comes up once in each round of days, the same all day, a new order each round ({r})")
    await page.evaluate("go({ screen: 'library' })"); await page.wait_for_timeout(200)
    tod = await page.evaluate("[document.querySelector('.tod .rc-t')?.textContent, termOfDay().t, document.querySelector('.tod').nextElementSibling.className]")
    check(tod[0] == tod[1] and tod[2] == "refcards", f"the home screen shows today's term above the glossary, branches and thinkers ({tod})")
    tid = await page.evaluate("termOfDay().id")
    await page.click(".tod"); await page.wait_for_timeout(300)
    opened = await page.evaluate(f"[S.screen, document.querySelector(\"details[data-term-id='{tid}']\")?.open]")
    check(opened == ["glossary", True], f"tapping it opens that term in the glossary ({opened})")
    await page.evaluate(f"put('terms', '{tid}', {{ ...GLOSSARY.find((g) => g.id === '{tid}'), t: 'My wording', createdAt: 1, updatedAt: 1 }}).then(() => go({{ screen: 'library' }}))"); await page.wait_for_timeout(300)
    check(await page.evaluate("document.querySelector('.tod .rc-t').textContent") == "My wording", "your edit of the term is what it shows")
    store = await page.evaluate("Object.keys(localStorage).filter((k) => /tod|day/i.test(k))")
    check(store == [] and not errs, f"nothing is stored, and no script errors ({store}{errs})")
    await page.context.close()

SAYSTUB = """(() => { window.__said = []; const real = window.speechSynthesis;
  if (real) { real.speak = (u) => window.__said.push([u.text, u.lang, Math.round(u.rate * 100) / 100]); real.cancel = () => {}; } })()"""

async def hear_it(browser):
    ctx = await browser.new_context(viewport={"width": 390, "height": 844}, is_mobile=True, has_touch=True)
    await ctx.add_init_script(SAYSTUB)
    page = await ctx.new_page(); errs = []
    page.on("pageerror", lambda e: errs.append(str(e)))
    await page.route("https://commons.wikimedia.org/**", lambda r: r.abort())
    await page.goto(URL); await page.wait_for_function(READY)
    check(await page.evaluate("CAN_SAY"), "this browser has a voice")
    await page.evaluate("openTerm('dasein')"); await page.wait_for_timeout(200)
    await page.click("details[data-term-id='dasein'] .saybtn"); await page.wait_for_timeout(100)
    said = await page.evaluate("window.__said")
    check(said == [["Dasein", "en", 0.85]], f"a term's Hear it says the term ({said})")
    await page.evaluate("thinkerPanel('nietzsche')"); await page.wait_for_timeout(200)
    await page.click(".sheet .saybtn"); await page.wait_for_timeout(100)
    said = await page.evaluate("[window.__said.at(-1), !!document.querySelector('.sheet h2')]")
    check(said == [["Friedrich Nietzsche", "en", 0.85], True], f"a thinker's Hear it says the name and leaves the card open ({said})")
    paren = await page.evaluate("[sayText('Laozi (Lao Tzu)'), sayText('Śaṅkara')]")
    check(paren == ["Laozi", "Śaṅkara"], f"bracketed parts are left out ({paren})")
    check(not errs, "no script errors with Hear it" + (f": {errs}" if errs else ""))
    await ctx.close()
    ctx = await browser.new_context(viewport={"width": 390, "height": 844})
    await ctx.add_init_script("delete window.speechSynthesis; delete window.SpeechSynthesisUtterance; Object.defineProperty(window, 'speechSynthesis', { value: undefined }); ")
    page = await ctx.new_page()
    await page.goto(URL); await page.wait_for_function(READY)
    await page.evaluate("openTerm('dasein')"); await page.wait_for_timeout(200)
    check(await page.evaluate("[CAN_SAY, document.querySelectorAll('.saybtn').length]") == [False, 0], "with no voice on the device there is no Hear it button")
    await ctx.close()

ANKISEED = r"""async () => { const now = Date.now();
  await put('texts', 'b1', { title: 'A "Quoted" Book', author: 'Writer, Some', sections: [], createdAt: now, updatedAt: now, hasContent: false });
  await put('notes', 'n1', { textId: 'b1', kind: 'passage', passage: 'Line one\tand a tab\nline two <b>not bold</b> & "quoted"', gloss: 'my gloss #ethics-2', page: '12', links: [], at: 0, createdAt: now, updatedAt: now,
    followups: [{ id: 'f1', at: now, x: 'thought later' }] });
  await put('notes', 'n2', { textId: 'b1', kind: 'question', passage: '', gloss: 'Why does he say so?', page: '14', links: [], createdAt: now, updatedAt: now });
  await put('notes', 'n3', { textId: 'b1', kind: 'argument', passage: 'The argument text', gloss: '', premises: ['All A are B', 'x is A'], conclusion: 'x is B', page: '15', links: [], createdAt: now, updatedAt: now });
  await put('terms', 'u1', { t: 'My term', a: 'mine', d: 'my definition', createdAt: now, updatedAt: now });
  localStorage.setItem('mg-dict', JSON.stringify({ aporia: { title: 'aporia', defs: [{ lang: 'English', pos: 'Noun', senses: ['A puzzle or impasse.'] }], t: now } }));
}"""

async def anki(browser):
    page, errs = await fresh(browser)
    ctx2 = await browser.new_context(viewport={"width": 1000, "height": 800}, accept_downloads=True)  # no touch: the file downloads instead of the share sheet
    await page.context.close()
    page = await ctx2.new_page(); errs = []
    page.on("pageerror", lambda e: errs.append(str(e)))
    await page.goto(URL); await page.wait_for_function(READY)
    await page.evaluate("go({ screen: 'library' })"); await page.click("#exportbtn"); await page.wait_for_selector("#x-anki")
    await page.click("#x-anki"); await page.wait_for_timeout(300)
    t = await page.inner_text("#toast") if await page.locator("#toast").count() else await page.evaluate("document.body.innerText")
    check("no notes, terms of your own" in t, "with nothing of your own, the flashcards export says so instead of making an empty file")
    await page.evaluate(ANKISEED); await page.wait_for_timeout(200)
    await page.click("#exportbtn"); await page.wait_for_selector("#x-anki")
    async with page.expect_download() as dl: await page.click("#x-anki")
    d = await dl.value; name = d.suggested_filename; txt = Path(await d.path()).read_text(encoding="utf-8")
    lines = txt.rstrip("\n").split("\n")
    head = [l for l in lines if l.startswith("#")]; rows = [l.split("\t") for l in lines if not l.startswith("#")]
    check(name.startswith("marginalia-flashcards-") and name.endswith(".txt"), f"the file is named for what it is ({name})")
    check(head == ["#separator:tab", "#html:true", "#notetype:Basic", "#deck:Marginalia", "#tags column:3", "#columns:Front\tBack\tTags"], f"Anki's headers come first ({head})")
    check(len(rows) == 5 and all(len(r) == 3 for r in rows), f"five cards (three notes, a term, a word), each exactly three fields ({[len(r) for r in rows]})")
    n1 = rows[0]
    check(n1[0] == "Line one and a tab<br>line two &lt;b&gt;not bold&lt;/b&gt; &amp; &quot;quoted&quot;", f"the passage is on the front, its tab, line break, markup and quotes made safe ({n1[0]})")
    check(n1[1].startswith("my gloss #ethics-2<br><br><i>Later:</i> thought later<br><small>") and "12" in n1[1] and "<i>A &quot;Quoted&quot; Book</i>" in n1[1], f"the back has your words, the follow-up and where it is ({n1[1]})")
    check(n1[2] == "marginalia::note marginalia::kind::passage marginalia::book::a_quoted_book ethics_2", f"tags: kind, book and your own tags, with no spaces ({n1[2]})")
    q, a = rows[1], rows[2]
    check(q[0] == "Why does he say so?" and "marginalia::kind::question" in q[2], f"a note without a passage puts your words in front ({q})")
    check(a[0] == "The argument text" and a[1].startswith("<ol><li>All A are B</li><li>x is A</li></ol>Therefore: x is B"), f"an argument's premises and conclusion go on the back ({a[1][:80]})")
    check(rows[3] == ["My term", "my definition", "marginalia::term"] and rows[4] == ["aporia", "<i>Noun</i><br>A puzzle or impasse.", "marginalia::word"], f"your term and your looked-up word ({rows[3:]})")
    await page.click("#exportbtn"); await page.wait_for_selector("#x-ankigl")
    async with page.expect_download() as dl: await page.click("#x-ankigl")
    g = Path(await (await dl.value).path()).read_text(encoding="utf-8").rstrip("\n").split("\n")
    gr = [l.split("\t") for l in g if not l.startswith("#")]
    n = await page.evaluate("allTerms().filter((g) => g.d).length")
    check(len(gr) == n and all(len(r) == 3 and r[2].startswith("marginalia::glossary marginalia::area::") for r in gr), f"the whole glossary is its own file, a card per entry with its area ({len(gr)} of {n})")
    check(not errs, "no script errors exporting flashcards" + (f": {errs}" if errs else ""))
    await ctx2.close()

async def lineage(browser):
    page, errs = await fresh(browser)
    await page.evaluate("openTerm('ontology')"); await page.wait_for_timeout(200)
    rows = await page.evaluate("[...document.querySelectorAll(\"[data-term-id='ontology'] .ttime .tl-row\")].map((r) => r.dataset.thinker)")
    want = await page.evaluate("GLOSSARY.find((g) => g.id === 'ontology').p.filter((id) => lifeSpan(THINKER.get(id).y)).sort((a, b) => lifeSpan(THINKER.get(a).y).a - lifeSpan(THINKER.get(b).y).a)")
    check(rows == want and len(rows) >= 2, f"a term's thinkers are on one scale in order of birth ({rows})")
    left = await page.evaluate("[...document.querySelectorAll(\"[data-term-id='ontology'] .ttime .tl-bar\")].map((b) => parseFloat(b.style.marginLeft))")
    check(left == sorted(left) and all(0 <= x <= 100 for x in left), f"the bars run left to right in time ({left})")
    await page.click("[data-term-id='ontology'] .ttime .tl-row >> nth=1"); await page.wait_for_timeout(200)
    check(await page.evaluate("document.querySelector('.sheet h2')?.textContent") == await page.evaluate(f"THINKER.get('{want[1]}').n"), "tapping one opens their card")
    await page.click("#pclose"); await page.wait_for_timeout(200)
    none = await page.evaluate("[termTimeHTML([]), termTimeHTML(['kant']), termTimeHTML(['nobody', 'kant'])]")
    check(none == ["", "", ""], "fewer than two dated thinkers: no time scale")
    ok = await page.evaluate("""(() => { const bad = [];
      for (const t of THINKERS) { const s = lineageSteps(t.id), back1 = new Set(t.i), on1 = new Set(THINKERS.filter((x) => x.i.includes(t.id)).map((x) => x.id));
        for (const x of s.back) if (x === t.id || back1.has(x) || ![...back1].some((b) => (THINKER.get(b)?.i || []).includes(x))) bad.push(t.id + ' back ' + x);
        for (const x of s.on) if (x === t.id || on1.has(x) || !THINKER.get(x).i.some((o) => on1.has(o))) bad.push(t.id + ' on ' + x);
        for (const l of [s.back, s.on]) for (let k = 1; k < l.length; k++) if (birthYear(THINKER.get(l[k - 1]).y) > birthYear(THINKER.get(l[k]).y)) bad.push(t.id + ' order');
        if (new Set(s.back).size !== s.back.length || new Set(s.on).size !== s.on.length) bad.push(t.id + ' twice'); }
      return bad; })()""")
    check(ok == [], f"two steps back and on: each reached through the first step, never the thinker or the first step again, in order of birth ({ok[:5]})")
    await page.evaluate("thinkerPanel('aristotle')"); await page.wait_for_timeout(200)
    fold = await page.evaluate("""(() => { const rows = [...document.querySelectorAll('.sheet .crow')].filter((r) => r.querySelector('.clabel').textContent === 'Further on');
      const r = rows[0]; return r ? [r.querySelectorAll(':scope > .chips .chip').length, r.querySelector('.cfold summary')?.textContent, r.querySelectorAll('.chip').length, lineageSteps('aristotle').on.length] : null; })()""")
    check(fold and fold[0] == 8 and fold[1] == f"{fold[3] - 8} more" and fold[2] == fold[3], f"a long row shows eight names and folds the rest ({fold})")
    check(not errs, "no script errors in time scales and lineage" + (f": {errs}" if errs else ""))
    await page.context.close()

SPREAD = r"""async () => { const now = Date.now(); const B = [];
  for (let i = 0; i < 600; i++) B.push(i % 100 === 0 ? { k: "h", l: 2, x: "Chapter " + (i / 100 + 1), st: "chapter", s: "c" + i } : { k: "p", x: "Words " + i });
  await put("content", "sp", B);
  await put("texts", "sp", { title: "Spread Book", author: "Writer, A", sections: [0,100,200,300,400,500].map((i) => ({ id: "c" + i, label: "Chapter " + (i / 100 + 1) })), hasContent: true, total: 600, pos: 260, createdAt: now, updatedAt: now, readAt: now });
  const ats = [3, 5, 8, 12, 40, 41, 42, 44, 45, 47, 130, 150, 151, 220, 255, 256, 257, 258];
  for (const [k, a] of ats.entries()) await put("notes", "sn" + k, { textId: "sp", kind: "passage", passage: "p" + a, gloss: "", page: String(a), at: a, links: [], createdAt: now + k, updatedAt: now + k });
  await put("texts", "s1", { title: "One note", sections: [], hasContent: true, total: 100, pos: 0, createdAt: now, updatedAt: now });
  await put("notes", "on1", { textId: "s1", kind: "passage", passage: "x", at: 5, links: [], createdAt: now, updatedAt: now });
}"""

async def spread(browser):
    page, errs = await fresh(browser)
    await page.evaluate(SPREAD)
    await page.evaluate("go({ screen: 'text', textId: 'sp' })"); await page.wait_for_timeout(500)
    bins = await page.evaluate("[...document.querySelectorAll('.sp-bin')].map((b) => [Math.round(parseFloat(b.style.left) * 48 / 100), parseFloat(b.style.height), +b.dataset.gotoNote])")
    check([b[0] for b in bins] == [0, 3, 10, 12, 17, 20] and [b[2] for b in bins] == [3, 40, 130, 150, 220, 255], f"a bar for each stretch with notes, going to its first note ({bins})")
    hs = [b[1] for b in bins]
    check(hs[1] == 100 and hs[0] == 67 and hs[2] == max(14, round(100 / 6)) and hs[3] == 33, f"each as tall as its share of the busiest stretch ({hs})")
    marks = await page.evaluate("[[...document.querySelectorAll('.sp-ch')].map((x) => parseFloat(x.style.left)), parseFloat(document.querySelector('.sp-pos').style.left).toFixed(1), document.querySelector('.spread .hint').textContent]")
    check(marks[0] == [0, 100 / 6, 200 / 6, 50, 400 / 6, 500 / 6] or [round(x, 3) for x in marks[0]] == [round(x, 3) for x in [0, 100 / 6, 200 / 6, 50, 400 / 6, 500 / 6]], f"a line at each chapter ({marks[0]})")
    check(marks[1] == f"{100 * 260 / 600:.1f}" and marks[2].startswith("18 notes; the most around 6% of the way through, most in the first half."), f"a dot at your place, and a line saying where the notes gather ({marks[1:]})")
    await page.click(".sp-bin >> nth=2"); await page.wait_for_timeout(700)
    check(await page.evaluate("[S.screen, R.tid]") == ["reader", "sp"], "a bar opens the reader at its notes")
    await page.evaluate("go({ screen: 'text', textId: 's1' })"); await page.wait_for_timeout(300)
    check(await page.locator(".spread").count() == 0, "a book with fewer than two placed notes has no strip")
    check(not errs, "no script errors in the strip" + (f": {errs}" if errs else ""))
    await page.context.close()

async def fallacies(browser):
    page, errs = await fresh(browser)
    data = await page.evaluate("GLOSSARY.filter((g) => g.fal).map((g) => [g.id, g.fal, !!(g.d && g.x && g.src && g.srcName && g.a === 'logic' && (g.br || []).includes('logic'))])")
    check(len(data) >= 17 and all(x[1] in ("formal", "informal") and x[2] for x in data), f"every fallacy is marked formal or informal, with a definition, a note and a source ({[x for x in data if not x[2]]})")
    await page.evaluate("go({ screen: 'branches', focus: 'logic' })"); await page.wait_for_timeout(200)
    cat = await page.evaluate("[...document.querySelectorAll(\"details[data-branch-id='logic'] .falgroup\")].map((g) => [g.querySelector('.clabel').textContent, [...g.querySelectorAll('.refrow')].map((r) => r.dataset.term)])")
    formal = sorted(x[0] for x in data if x[1] == "formal"); informal = [x[0] for x in data if x[1] == "informal"]
    check(len(cat) == 2 and cat[0][0].startswith("Formal fallacies") and sorted(cat[0][1]) == formal and sorted(cat[1][1]) == sorted(informal), f"the Logic branch lists them, formal then informal ({[(c[0], len(c[1])) for c in cat]})")
    await page.click("details[data-branch-id='logic'] .falgroup .refrow[data-term='straw-man']"); await page.wait_for_timeout(300)
    check(await page.evaluate("[S.screen, document.querySelector(\"details[data-term-id='straw-man']\")?.open]") == ["glossary", True], "a fallacy in the list opens its entry")
    await page.evaluate("openTerm('affirming-consequent')"); await page.wait_for_timeout(200)
    await page.click("details[data-term-id='affirming-consequent'] [data-truth]"); await page.wait_for_selector("#tt-p")
    t = [await page.input_value("#tt-p"), await page.input_value("#tt-c"), await page.inner_text("#ttout")]
    check(t[0] == "P → Q\nQ" and t[1] == "P" and t[2].startswith("Not valid.") and "Affirming the consequent in the glossary" in t[2], f"its entry opens the truth table on its example, with a way back to the entry ({t[:2]})")
    await page.fill("#tt-p", "if p then q".replace("if ", "").replace(" then ", " -> ") + "\n~p"); await page.fill("#tt-c", "not q"); await page.wait_for_timeout(100)
    check("Denying the antecedent in the glossary" in await page.inner_text("#ttout"), "typed another way (p -> q, ~p, not q) it is still recognized")
    await page.click("#ttout [data-term]"); await page.wait_for_timeout(300)
    check(await page.evaluate("document.querySelector(\"details[data-term-id='denying-antecedent']\")?.open"), "the link opens the entry")
    check(not errs, "no script errors with the fallacies" + (f": {errs}" if errs else ""))
    await page.context.close()

async def paths(browser):
    page, errs = await fresh(browser)
    bad = await page.evaluate("""(async () => { const bad = [], ids = new Set(GLOSSARY.map((g) => g.id));
      for (const P of PATHS.filter((P) => P.steps)) {
        for (const b of P.br) if (!BRANCH.has(b)) bad.push(P.id + ' branch ' + b);
        for (const t of P.terms || []) if (!ids.has(t)) bad.push(P.id + ' term ' + t);
        for (const st of P.steps) {
          if (!CLASSICS.includes(st.book)) { bad.push(P.id + ' book ' + st.book); continue; }
          const b = await (await fetch('data/books/' + st.book + '.json')).json(), order = b.text.sections.map((x) => x.id);
          const at = st.secs.map((x) => order.indexOf(x));
          if (at.some((k) => k < 0) || at.some((k, i) => i && k <= at[i - 1])) bad.push(P.id + ' chapters ' + st.book);
          if (CLASSIC_TITLES[st.book] !== b.text.title) bad.push(P.id + ' title ' + st.book);
          if (!st.why) bad.push(P.id + ' why');
        } }
      for (const id of CLASSICS) { const b = await (await fetch('data/books/' + id + '.json')).json(); if (CLASSIC_TITLES[id] !== b.text.title) bad.push('title ' + id); }
      return bad; })()""")
    check(bad == [], f"every step is a classic the app has, its chapters exist and are in order, and the terms, branches and titles match ({bad})")
    await page.evaluate("addClassics(true)"); await page.wait_for_timeout(300)
    await page.evaluate("go({ screen: 'library' })"); await page.click("#openpaths"); await page.wait_for_timeout(200)
    shown = await page.evaluate("[S.screen, [...document.querySelectorAll('section.path')].map((x) => x.dataset.pathId), document.querySelectorAll('section.path:not(.close) .pstep').length, PATHS.filter((P) => P.steps).reduce((k, P) => k + P.steps.length, 0)]")
    check(shown[0] == "paths" and shown[1] == await page.evaluate("PATHS.map((P) => P.id)") and shown[2] == shown[3], f"the home screen opens the paths, every step listed ({shown})")
    await page.evaluate("go({ screen: 'branches', focus: 'ethics' })"); await page.wait_for_timeout(200)
    await page.click("details[data-branch-id='ethics'] [data-path='how-to-live']"); await page.wait_for_timeout(300)
    top = await page.evaluate("Math.round(document.querySelector('section.path[data-path-id=\"how-to-live\"]').getBoundingClientRect().top)")
    check(await page.evaluate("S.screen") == "paths" and abs(top) < 40, f"a branch's entry offers its path and opens it there ({top})")
    # reading a step
    await page.click("[data-pathread^='classic-aristotle-ethics']"); await page.wait_for_timeout(900)
    where = await page.evaluate("(() => { const B = S.content.get('classic-aristotle-ethics'), r = stepRange(B, ['classic-aristotle-ethics-s2', 'classic-aristotle-ethics-s3']); return [S.screen, R.tid, contentAt(currentBlock()), r, isPaged() ? pageForBlock(currentBlock()) === pageForBlock(r[0]) : (() => { const y = R.els[r[0]].getBoundingClientRect().top; return y >= 0 && y < innerHeight / 2; })()]; })()")
    check(where[0] == "reader" and where[1] == "classic-aristotle-ethics" and where[3] and where[4], f"a step opens the reader at its first chapter, its heading in the top half of the screen ({where})")
    await page.evaluate("go({ screen: 'paths' })"); await page.wait_for_timeout(300) # leaving the reader saves its place, so set the new one after
    await page.evaluate("(() => { const B = S.content.get('classic-aristotle-ethics'), r = stepRange(B, ['classic-aristotle-ethics-s2', 'classic-aristotle-ethics-s3']); const t = S.texts.get('classic-aristotle-ethics'); return put('texts', 'classic-aristotle-ethics', { ...t, pos: r[0] + 120, posF: 0 }); })()")
    await page.wait_for_timeout(300)
    label = await page.evaluate("document.querySelector(\"[data-pathread^='classic-aristotle-ethics']\").textContent")
    await page.click("[data-pathread^='classic-aristotle-ethics']"); await page.wait_for_timeout(900)
    pos = await page.evaluate("[contentAt(currentBlock()), S.texts.get('classic-aristotle-ethics').pos]")
    check(label == "Continue" and abs(pos[0] - pos[1]) <= 3, f"inside its chapters, it says Continue and carries on from your place ({label}, {pos})")
    # done
    await page.evaluate("(() => { const id = 'classic-kant-groundwork', t = S.texts.get(id); return put('texts', id, { ...t, sections: t.sections.map((x) => ['classic-kant-groundwork-s2', 'classic-kant-groundwork-s3'].includes(x.id) ? { ...x, done: true } : x) }); })()")
    await page.evaluate("go({ screen: 'paths' })"); await page.wait_for_timeout(300)
    d = await page.evaluate("(() => { const s = document.querySelector('section.path[data-path-id=\"how-to-live\"]'); return [s.querySelector('.sub').textContent, [...s.querySelectorAll('.pstep')].map((x) => x.classList.contains('done')), s.querySelectorAll('.pbar i.on').length]; })()")
    check(d == ["5 steps, 1 done", [False, False, False, True, False], 1], f"ticking a step's chapters as read marks it done ({d})")
    # deleted, then added back
    await page.evaluate("deleteText('classic-cooper-voice')"); await page.wait_for_timeout(300)
    await page.evaluate("go({ screen: 'paths' })"); await page.wait_for_timeout(300)
    check(await page.locator("[data-pathadd='classic-cooper-voice']").count() == 1 and "A Voice from the South" in await page.inner_text("section.path[data-path-id='who-counts']"), "a classic you deleted shows by its title, with Add it back")
    await page.click("[data-pathadd='classic-cooper-voice']"); await page.wait_for_timeout(700)
    back = await page.evaluate("[S.texts.has('classic-cooper-voice'), S.texts.get('classic-cooper-voice')?.status, document.querySelectorAll(\"[data-pathadd]\").length, !!S.content.get('classic-cooper-voice') || null]")
    check(back[:3] == [True, "queued", 0], f"...and Add it back puts it on the Queued shelf ({back})")
    check(not errs, "no script errors in reading paths" + (f": {errs}" if errs else ""))
    await page.context.close()

RSEED = r"""async () => { const now = Date.now(), D = 86400000;
  await put("texts", "rb", { title: "Old Book", author: "Writer, A", sections: [], hasContent: true, total: 10, pos: 0, createdAt: now - 200 * D, updatedAt: now });
  await put("content", "rb", Array.from({ length: 10 }, (_, i) => ({ k: "p", x: "Paragraph " + i })));
  await put("texts", "ex", { title: "Example", example: true, sections: [], createdAt: now - 300 * D, updatedAt: now });
  await put("notes", "r1", { textId: "rb", kind: "passage", passage: "Kept long ago", gloss: "then", page: "26", at: 3, links: [], createdAt: now - 95 * D, updatedAt: now - 95 * D });
  await put("notes", "r2", { textId: "rb", kind: "gloss", passage: "", gloss: "A newer thought", page: "30", links: [], createdAt: now - 2 * D, updatedAt: now - 2 * D });
  await put("notes", "r3", { textId: "rb", kind: "question", passage: "", gloss: "Why production?", page: "40", links: [], createdAt: now - 40 * D, updatedAt: now - 40 * D });
  await put("notes", "r4", { textId: "ex", kind: "passage", passage: "example passage", links: [], createdAt: now - 99 * D, updatedAt: now });
}"""

async def margins(browser):
    page, errs = await fresh(browser)
    await page.evaluate("put('texts', 'nb', { title: 'New', sections: [], createdAt: Date.now(), updatedAt: Date.now() }).then(() => put('notes', 'n0', { textId: 'nb', kind: 'gloss', gloss: 'fresh', links: [], createdAt: Date.now(), updatedAt: Date.now() })).then(() => go({ screen: 'library' }))")
    await page.wait_for_timeout(200)
    check(await page.locator("#resurf").count() == 0, "with no note two weeks old, there is no card")
    await page.evaluate(RSEED); await page.evaluate("go({ screen: 'library' })"); await page.wait_for_timeout(300)
    pool = await page.evaluate("resurfPool().map(([id]) => id)")
    check(pool == ["r1", "r3"], f"only notes two weeks old or more, never the example book's ({pool})")
    days = await page.evaluate("(() => { const d = dayNumber(); return [resurfaced(d)[0], resurfaced(d)[0], [...Array(10).keys()].map((k) => resurfaced(d + k)[0])]; })()")
    check(days[0] == days[1] and len(set(days[2])) == 2, f"the same note all day, and both come up over ten days ({days})")
    first = await page.evaluate("[document.querySelector('#resurf .gloss').textContent, document.querySelectorAll('#resurf [data-goto-note]').length]")
    want = await page.evaluate("S.notes.get(resurfaced()[0]).gloss")
    check(first[0] == want, f"the card shows today's note ({first})")
    await page.evaluate("window.__mark = document.querySelector('.refcards')")
    await page.click("#resurfnext"); await page.wait_for_timeout(150)
    after = await page.evaluate("[document.querySelector('#resurf .gloss').textContent, window.__mark === document.querySelector('.refcards')]")
    check(after[0] != first[0] and after[1], f"Another shows the other note without redrawing the screen ({after})")
    shown = await page.evaluate("document.querySelector('#resurf .gloss').textContent")
    if shown != "then": await page.click("#resurfnext"); await page.wait_for_timeout(150)
    check(await page.locator("#resurf [data-goto-note='3']").count() == 1 and "p. 26" in await page.inner_text("#resurf") and "3 months ago" in await page.inner_text("#resurf"), "a note in a book whose text is here offers Show in text, with its page and how long ago")
    await page.click("#resurf [data-followup]"); await page.wait_for_timeout(300)
    check(await page.locator("#sheetroot form").count() == 1, "Follow up opens the note's sheet")
    ago = await page.evaluate("[agoLabel(Date.now() - 15 * DAY), agoLabel(Date.now() - 40 * DAY), agoLabel(Date.now() - 400 * DAY), agoLabel(Date.now() - 800 * DAY)]")
    check(ago == ["2 weeks ago", "6 weeks ago", "a year ago", "2 years ago"], f"how long ago, in words ({ago})")
    check(not errs, "no script errors in From your margins" + (f": {errs}" if errs else ""))
    await page.context.close()

async def templates(browser):
    page, errs = await fresh(browser)
    await page.evaluate("go({ screen: 'drafts' })"); await page.click("#newdraft"); await page.wait_for_selector(".tplopt")
    opts = await page.evaluate("[...document.querySelectorAll('.tplopt input')].map((x) => [x.value, x.checked])")
    check(opts[0] == ["", True] and [o[0] for o in opts[1:]] == await page.evaluate("ESSAY_TEMPLATES.map((t) => t.id)"), f"New draft starts blank, with each template to pick ({opts})")
    await page.click(".tplopt input[value='reconstruct']"); await page.click("#sheetroot button[type=submit]"); await page.wait_for_timeout(400)
    d = await page.evaluate("(() => { const d = S.drafts.get(S.draftId); return [S.screen, d.title, d.items.map((x) => x.t).join(''), d.items.filter((x) => x.t === 'p').every((x) => x.x.startsWith(GUIDE)), VALID.drafts(d), document.querySelectorAll('.ditem.dguide').length, document.querySelectorAll('.ditem.dh').length]; })()")
    n = await page.evaluate("ESSAY_TEMPLATES.find((t) => t.id === 'reconstruct').s.length")
    check(d[0] == "draft" and d[1] == "Reconstruct an argument" and d[2] == "hp" * n and d[3] and d[4] and d[5] == n and d[6] == n, f"a template's draft has its headings, each with a line of guidance shown apart, named after it, and a backup accepts it ({d})")
    await page.evaluate("go({ screen: 'drafts' })"); await page.click("#newdraft"); await page.wait_for_selector(".tplopt")
    await page.fill("#d-title", "Blank one"); await page.click("#sheetroot button[type=submit]"); await page.wait_for_timeout(400)
    check(await page.evaluate("[S.drafts.get(S.draftId).title, S.drafts.get(S.draftId).items.length]") == ["Blank one", 0], "a blank draft is still empty")
    await page.evaluate("draftTitleSheet(S.draftId)"); await page.wait_for_timeout(200)
    check(await page.locator(".tplopt").count() == 0, "renaming a draft doesn't offer templates")
    check(not errs, "no script errors with templates" + (f": {errs}" if errs else ""))
    await page.context.close()

async def puzzles(browser):
    page, errs = await fresh(browser)
    f = await page.evaluate("""(() => { const bad = []; for (let k = 0; k < 20; k++) for (const q of quizQuestions('fallacy')) {
        const names = q.opts, right = q.g, picked = allTerms().filter((g) => g.fal && names.includes(esc(g.t)));
        if (names.length !== 4 || new Set(names).size !== 4 || names[q.answer] !== esc(right.t)) bad.push('options ' + right.id);
        if (!right.ex.some((x) => q.prompt.includes(esc(x)))) bad.push('example ' + right.id);
        for (const o of picked) if (o.id !== right.id && falNear(o.id, right.id)) bad.push('near ' + right.id + '/' + o.id);
      } return [bad.slice(0, 5), quizQuestions('fallacy').length]; })()""")
    check(f[0] == [] and f[1] == 10, f"Name the fallacy: ten questions from the fallacies' examples, four different answers, no confusable pair ({f})")
    v = await page.evaluate("""(() => { const out = { n: 0, ok: 0, bad: [] }; for (let k = 0; k < 300; k++) { const q = validQuestion(), r = ttCheck(q.prem.join('\\n'), q.concl);
        out.n++; if (q.ok) out.ok++;
        if ((r.cx === 0) !== q.ok) out.bad.push('answer ' + q.prem + ' / ' + q.concl);
        if (!r.live) out.bad.push('inconsistent ' + q.prem);
        if (r.rows.every((x) => x.cv)) out.bad.push('tautology ' + q.concl); } return out; })()""")
    check(not v["bad"] and 0.35 < v["ok"] / v["n"] < 0.65, f"Valid or not? answers agree with the truth table, about half are valid, none trivial ({v['ok']}/{v['n']}, {v['bad'][:3]})")
    await page.evaluate("go({ screen: 'branches', focus: 'logic' })"); await page.wait_for_timeout(200)
    await page.click("details[data-branch-id='logic'] [data-argquiz='valid']"); await page.wait_for_selector(".qz-opt")
    check(await page.evaluate("QZ.mode") == "valid" and await page.locator(".qz-arg").count() == 1, "Valid or not? opens from the Logic branch, the argument set out line by line")
    await page.click(".qz-opt >> nth=0"); await page.wait_for_selector("[data-qztt]")
    want = await page.evaluate("[QZ.qs[0].v.ok, QZ.qs[0].v.prem.join('\\n'), QZ.qs[0].v.concl]")
    said = await page.inner_text(".qz-say")
    check(("It's valid" in said) == want[0] and ("It's not valid: with" in said) == (not want[0]), f"the answer explains itself, with the counterexample when there is one ({said[:90]})")
    await page.click("[data-qztt]"); await page.wait_for_selector("#tt-p")
    tt = [await page.input_value("#tt-p"), await page.input_value("#tt-c"), (await page.inner_text("#ttout")).startswith("Valid")]
    check(tt == [want[1], want[2], want[0]], f"See its truth table opens the table on that argument, with the same verdict ({tt})")
    await page.click("#pclose"); await page.wait_for_timeout(200)
    await page.click("details[data-branch-id='logic'] [data-argquiz='fallacy']"); await page.wait_for_selector(".qz-opt")
    check(await page.evaluate("QZ.mode") == "fallacy", "Name the fallacy opens from the Logic branch")
    for k in range(10):
        await page.click(".qz-opt >> nth=0"); await page.wait_for_selector("[data-qznext]"); await page.click("[data-qznext]"); await page.wait_for_timeout(40)
    check(" of 10" in await page.inner_text("#quizbox"), "ten fallacies end in a score")
    check(not errs, "no script errors in the argument puzzles" + (f": {errs}" if errs else ""))
    await page.context.close()

async def guess(browser):
    page, errs = await fresh(browser)
    pool = await page.evaluate("""(() => { const bad = []; for (const p of guessPool()) { const c = guessClues(p), all = c.join(' ').toLowerCase();
        if (c.length < 4) bad.push(p.id + ' clues'); for (const w of [p.sn, ...p.n.split(/\\s+/)].filter((w) => w.length > 3 && !/^(the|of|de|von|van)$/i.test(w))) if (new RegExp(`(^|[^\\p{L}])${reEsc(w.toLowerCase())}($|[^\\p{L}])`, 'u').test(all)) bad.push(p.id + ' names ' + w); }
      const d = dayNumber(), n = guessPool().length, d0 = d - (d % n); return [n, bad.slice(0, 6), guessOfDay(d).id === guessOfDay(d).id, new Set([...Array(n).keys()].map((k) => guessOfDay(d0 + k).id)).size === n]; })()""")
    check(pool[0] > 50 and pool[1] == [] and pool[2] and pool[3], f"a thinker a day, the same all day, every one once before any repeats, each with four clues or more and none naming them ({pool[:1]}, {pool[1]}, {pool[3]})")
    await page.evaluate("go({ screen: 'thinkers' })"); await page.click("#puzzles"); await page.click("#pz-guess"); await page.wait_for_selector(".gclues")
    check(await page.locator(".gclues li").count() == 1, "it starts with one clue")
    ans = await page.evaluate("guessOfDay().id"); other = await page.evaluate(f"THINKERS.find((p) => p.id !== '{ans}').n")
    await page.fill("#g-in", "Nobody Atall"); await page.click("[data-gtry]"); await page.wait_for_timeout(100)
    check("isn't one of the app's thinkers" in await page.inner_text("#g-err") and await page.locator(".gclues li").count() == 1, "a name not in the app is refused, and costs nothing")
    await page.fill("#g-in", other); await page.press("#g-in", "Enter"); await page.wait_for_timeout(100)
    st = await page.evaluate("[document.querySelectorAll('.gclues li').length, document.querySelector('#gbox .hint')?.textContent || '']")
    check(st[0] == 2 and st[1].startswith("Not "), f"a wrong guess (Enter works) shows the next clue and is listed ({st})")
    await page.click("#pclose"); await page.wait_for_timeout(200); await page.evaluate("guessPanel()"); await page.wait_for_selector(".gclues")
    check(await page.locator(".gclues li").count() == 2, "closing and opening again keeps today's game")
    name = await page.evaluate(f"THINKER.get('{ans}').n")
    await page.fill("#g-in", name.lower()); await page.click("[data-gtry]"); await page.wait_for_timeout(100)
    done = await page.evaluate("[!!document.querySelector('.gdone'), document.querySelector('.gdone .qz-q').textContent, document.querySelectorAll('.gclues li').length, guessClues(guessOfDay()).length]")
    check(done[0] and done[1].startswith("Right:") and done[2] == done[3], f"the right name, in any case, ends the game and shows every clue ({done[:3]})")
    res = await page.evaluate("guessResult(guessState(), guessClues(guessOfDay()))")
    check(res.startswith("Marginalia · Guess the thinker · ") and "Got it with 2 of" in res and "1 wrong guess" in res, f"the result to share says how it went ({res!r})")
    await page.click(".gdone [data-thinker]"); await page.wait_for_timeout(300)
    check(await page.evaluate("document.querySelector('.sheet h2').textContent") == name, "it offers their card")
    await page.evaluate("(() => { const s = guessState(); s.day -= 1; localStorage.setItem(GUESS_KEY, JSON.stringify(s)); })()")
    check(await page.evaluate("[guessState().shown, guessState().wrong.length, guessState().done]") == [1, 0, ""], "a new day starts afresh")
    await page.evaluate("guessPanel()"); await page.wait_for_selector("[data-ggive]"); await page.click("[data-ggive]"); await page.wait_for_timeout(100)
    check((await page.inner_text(".gdone .qz-q")).startswith("It was") and "Didn't get it" in await page.evaluate("guessResult(guessState(), guessClues(guessOfDay()))"), "Show me ends it and names them")
    check(not errs, "no script errors in Guess the thinker" + (f": {errs}" if errs else ""))
    await page.context.close()

async def connect(browser):
    page, errs = await fresh(browser)
    ok = await page.evaluate("""(() => { const bad = []; for (const k of [2, 3, 4]) for (let n = 0; n < 15; n++) { connectNew(k);
        if (lineFrom(CN.a).dist.get(CN.b) !== k || CN.shortest !== k) bad.push(k + ' ' + CN.a + '>' + CN.b); } return bad; })()""")
    check(ok == [], f"the target is exactly the chosen number of steps on ({ok[:3]})")
    await page.evaluate("go({ screen: 'thinkers' })"); await page.click("#puzzles"); await page.click("#pz-connect"); await page.wait_for_selector("#cnbox")
    opts = await page.evaluate("(() => { const cur = CN.chain.at(-1); return [[...document.querySelectorAll('[data-cngo]')].map((b) => b.dataset.cngo).sort(), THINKERS.filter((p) => p.i.includes(cur)).map((p) => p.id).sort()]; })()")
    check(opts[0] == opts[1] and len(opts[0]) > 0, f"the choices are exactly those who took up the current thinker ({len(opts[0])})")
    route = await page.evaluate("lineFrom(CN.a).route(CN.b)")
    await page.click("[data-cnhint]"); await page.wait_for_timeout(80)
    hinted = await page.evaluate("[document.querySelector('[data-cngo].hinted')?.dataset.cngo, lineFrom(CN.chain.at(-1)).dist.get(CN.b)]")
    check(hinted[0] and await page.evaluate(f"lineFrom('{hinted[0]}').dist.get(CN.b)") == hinted[1] - 1, f"Hint marks a choice that is one step nearer ({hinted})")
    await page.click(f"[data-cngo='{route[1]}']"); await page.click("[data-cnback]"); await page.wait_for_timeout(60)
    check(await page.evaluate("CN.chain.length") == 1, "Step back undoes a step")
    for id in route[1:]:
        await page.click(f"[data-cngo='{id}']"); await page.wait_for_timeout(50)
    done = await page.inner_text("#cnbox")
    check(await page.evaluate("CN.over") == "solved" and "That's the shortest way." in done, f"following a shortest route arrives in the fewest steps ({done.splitlines()[-3:]})")
    await page.click("[data-cnnew]"); await page.wait_for_timeout(60)
    await page.evaluate("(() => { while (CN.chain.length - 1 < CN.shortest + CN_SLACK - 1) CN.chain.push('x' + CN.chain.length); CN.chain.push(CN.a); document.querySelector('#cnbox').innerHTML = connectHTML(); })()")
    await page.evaluate("(() => { CN.chain.pop(); CN.chain.pop(); CN.chain.push(CN.a); document.querySelector('#cnbox').innerHTML = connectHTML(); })()")
    c = await page.evaluate("document.querySelector('[data-cngo]:not([disabled])')?.dataset.cngo")
    if c and c != await page.evaluate("CN.b"):
        await page.click(f"[data-cngo='{c}']"); await page.wait_for_timeout(60)
        check(await page.evaluate("CN.over") == "out" and "Out of steps." in await page.inner_text("#cnbox"), "running out of steps ends it")
    await page.click("[data-cnnew]"); await page.click("[data-cngive]"); await page.wait_for_timeout(60)
    shown = await page.evaluate("""(() => { const t = document.querySelector('#cnbox .qz-say').textContent, r = lineFrom(CN.a).route(CN.b);
      return [t.includes('One shortest route: ' + r.map((id) => THINKER.get(id).sn || THINKER.get(id).n).join(' → ')), r.every((id, k) => !k || THINKER.get(id).i.includes(r[k - 1])), r.length - 1 === CN.shortest]; })()""")
    check(shown == [True, True, True], f"Show a way gives a real shortest route, each step a 'drew on' link ({shown})")
    check(not errs, "no script errors connecting thinkers" + (f": {errs}" if errs else ""))
    await page.context.close()

async def order(browser):
    page, errs = await fresh(browser)
    ok = await page.evaluate("""(() => { const bad = []; for (const era of [false, true]) for (let n = 0; n < 25; n++) { orderNew(era);
        const b = OB.ids.map((id) => lifeSpan(THINKER.get(id).y)); if (OB.ids.length !== 5 || new Set(OB.ids).size !== 5) bad.push('five');
        if (b.some((s) => !s || s.approx || s.open)) bad.push('exact');
        for (let i = 0; i < 5; i++) for (let j = i + 1; j < 5; j++) if (Math.abs(b[i].a - b[j].a) < ORDER_GAP) bad.push('gap');
        if (era && new Set(b.map((s) => TL_ERAS.findIndex(([, lo, hi]) => s.a >= lo && s.a < hi))).size !== 1) bad.push('era'); } return [...new Set(bad)]; })()""")
    check(ok == [], f"five thinkers with exact births at least {12} years apart, from one period when asked ({ok})")
    await page.evaluate("go({ screen: 'thinkers' })"); await page.click("#puzzles"); await page.click("#pz-order"); await page.wait_for_selector("#obbox")
    right = await page.evaluate("obRight()")
    await page.click(f"[data-obin='{right[1]}']"); await page.click(f"[data-obout='{right[1]}']"); await page.wait_for_timeout(50)
    check(await page.evaluate("OB.placed.length") == 0, "a placed name can be taken back")
    for id in right: await page.click(f"[data-obin='{id}']"); await page.wait_for_timeout(30)
    await page.click("[data-obcheck]"); await page.wait_for_timeout(80)
    t = await page.inner_text("#obbox")
    check(t.find("5 of 5") >= 0 and await page.locator("#obbox .oblist li.ok").count() == 5 and await page.locator("#obbox .ttime .tl-row").count() == 5, "in the right order, Check scores five of five and draws them on one time scale")
    await page.click("[data-obnew]"); await page.wait_for_timeout(50)
    right = await page.evaluate("obRight()")
    for id in [right[1], right[0]] + right[2:]: await page.click(f"[data-obin='{id}']"); await page.wait_for_timeout(30)
    await page.click("[data-obcheck]"); await page.wait_for_timeout(80)
    marks = await page.evaluate("[...document.querySelectorAll('#obbox .oblist li')].map((x) => x.className)")
    check(marks == ["no", "no", "ok", "ok", "ok"] and "3 of 5" in await page.inner_text("#obbox"), f"two swapped are marked, the rest right ({marks})")
    check(not errs, "no script errors in Order of birth" + (f": {errs}" if errs else ""))
    await page.context.close()

PLSEED = r"""async () => { const now = Date.now(), D = 86400000;
  await put("texts", "b1", { title: "Anti-Oedipus", author: "Deleuze, Gilles and Guattari, Félix", status: "finished", sections: [{ id: "a", label: "Chapter 1", done: true }, { id: "b", label: "Chapter 2", done: true }, { id: "n", label: "Notes" }], summaries: { a: "Desire produces.", b: "Psychoanalysis and familialism." }, hasContent: false, createdAt: now - 90 * D, updatedAt: now });
  await put("texts", "b2", { title: "Leviathan", status: "reading", sections: [{ id: "x", label: "I" }, { id: "y", label: "II" }], createdAt: now - 20 * D, updatedAt: now });
  await put("notes", "n1", { textId: "b1", kind: "passage", passage: "p", gloss: "mine", links: [], createdAt: now - 80 * D, updatedAt: now - 80 * D, followups: [{ id: "f", at: now - 30 * D, x: "later" }] });
  await put("notes", "n2", { textId: "b2", kind: "question", gloss: "Why fear?", links: [], createdAt: now - 10 * D, updatedAt: now - 10 * D });
  await put("drafts", "d1", { title: "Desire and lack", items: [], createdAt: now - 5 * D, updatedAt: now });
}"""

async def plates(browser):
    page, errs = await fresh(browser)
    await page.evaluate("go({ screen: 'plates' })"); await page.wait_for_timeout(150)
    e = await page.evaluate("[bookplates().count, bookplates().todo.length, !!document.querySelector('.empty')]")
    check(e == [0, 10, True], f"an empty library has no plates, and everything still to come ({e})")
    await page.evaluate(PLSEED)
    await page.evaluate("put('texts', 'ex', { title: 'Example', example: true, status: 'finished', sections: [{ id: 'a', label: 'A', done: true }, { id: 'b', label: 'B', done: true }], createdAt: 1, updatedAt: 1 }).then(() => put('notes', 'ex1', { textId: 'ex', kind: 'objection', gloss: 'not mine', links: [], createdAt: 1, updatedAt: 1 }))")
    P = await page.evaluate("(() => { const P = bookplates(); return { firsts: P.firsts.map((x) => [x.id, x.sub]), books: P.books.map((x) => x.id), paths: P.paths.length, todo: P.todo.map((x) => x[0]), count: P.count }; })()")
    check(P["firsts"] == [["gloss", "Anti-Oedipus"], ["question", "Leviathan"], ["followup", "Anti-Oedipus"], ["summary", "Anti-Oedipus"], ["draft", "Desire and lack"]], f"firsts, each from what earned it, the example book left out ({P['firsts']})")
    check(P["books"] == ["read:b1", "sum:b1", "fin:b1"], f"a book with every chapter ticked and summed up (its Notes left out) and on the Finished shelf; the example book never ({P['books']})")
    check("First objection" in P["todo"] and "First comparison" in P["todo"] and "A path walked" in P["todo"], f"what isn't earned yet is still to come ({P['todo']})")
    one = await page.evaluate("(() => { const t = { title: 'One', sections: [{ id: 'a', label: 'All of it', done: true }], summaries: { a: 'x' } }; return bookPlates('z', t).length; })()")
    check(one == 0, "a book with a single chapter doesn't count as read through or summed up")
    await page.evaluate("go({ screen: 'library' })"); await page.wait_for_timeout(200)
    chip = await page.evaluate("document.querySelector('#openplates')?.textContent")
    check(chip == f"Bookplates{P['count']}", f"the home screen's chip shows how many ({chip})")
    await page.click("#openplates"); await page.wait_for_timeout(200)
    check(await page.locator(".plate").count() == P["count"], "the chip opens them all")
    await page.click(".plate[data-open='b2']"); await page.wait_for_timeout(200)
    check(await page.evaluate("[S.screen, S.textId]") == ["text", "b2"], "a plate opens its book")
    check(await page.locator(".plate").count() == 0, "a book with no plates of its own shows none on its page")
    await page.evaluate("go({ screen: 'text', textId: 'b1' })"); await page.wait_for_timeout(200)
    check(await page.evaluate("[...document.querySelectorAll('.plate .pl-n')].map((x) => x.textContent)") == ["Read through", "Every chapter summed up", "Finished"], "a book's page shows its own plates")
    await page.evaluate("addClassics(true)"); await page.wait_for_timeout(300)
    await page.evaluate("""(async () => { const P = PATHS.find((x) => x.id === 'what-can-we-know');
      for (const st of P.steps) { const t = S.texts.get(st.book); await put('texts', st.book, { ...t, sections: t.sections.map((x) => st.secs.includes(x.id) ? { ...x, done: true } : x) }); } })()""")
    paths = await page.evaluate("bookplates().paths.map((x) => [x.n, x.sub])")
    check(paths == [["A path walked", "What can we know?"]], f"a reading path walked, once every step is done ({paths})")
    check(not errs, "no script errors in bookplates" + (f": {errs}" if errs else ""))
    await page.context.close()

async def more_puzzles(browser):
    page, errs = await fresh(browser)
    bad = await page.evaluate("""(() => { const bad = []; for (let k = 0; k < 150; k++) { const m = missingQuestion();
        if (new Set(m.opts).size !== 4) bad.push('dup');
        m.opts.forEach((o, i) => { const r = ttCheck([...m.rest, o].join('\\n'), m.concl);
          if (i === m.answer ? !(r.cx === 0 && r.live > 0) : r.cx === 0) bad.push((i === m.answer ? 'right ' : 'wrong ') + m.rest + ' + ' + o + ' / ' + m.concl); });
        if (ttCheck(m.rest.join('\\n'), m.concl).cx === 0) bad.push('rest alone'); } return bad.slice(0, 4); })()""")
    check(bad == [], f"Missing premise: only the right option makes it valid, each wrong one has a counterexample, the rest alone don't prove it ({bad})")
    await page.evaluate("go({ screen: 'branches', focus: 'logic' })"); await page.wait_for_timeout(200)
    await page.click("details[data-branch-id='logic'] [data-argquiz='missing']"); await page.wait_for_selector(".qz-gap")
    a = await page.evaluate("QZ.qs[0].answer"); wrong = (a + 1) % 4
    await page.click(f".qz-opt >> nth={wrong}"); await page.wait_for_selector("[data-qzmt]")
    check("there is such a row" in await page.inner_text(".qz-say"), "a wrong pick is told there's a counterexample")
    await page.click("[data-qzmt]"); await page.wait_for_selector("#tt-p")
    check((await page.inner_text("#ttout")).startswith("Not valid."), "See it in a truth table shows the counterexample for what you picked")
    await page.click("#pclose"); await page.wait_for_timeout(200)
    ok = await page.evaluate("""(() => { const bad = []; for (let k = 0; k < 50; k++) { stepsNew();
        if (ST.prem.join() === ST.order.join() || [...ST.prem].sort().join() !== [...ST.order].sort().join()) bad.push('shuffle');
        if (ttCheck(ST.order.join('\\n'), ST.concl).cx !== 0) bad.push('valid'); } return bad; })()""")
    check(ok == [], f"the steps are a valid chain, always shuffled ({ok[:3]})")
    await page.click("details[data-branch-id='logic'] [data-steps]"); await page.wait_for_selector("#stbox")
    order = await page.evaluate("ST.order")
    await page.click(f"[data-stin='{order[1]}']"); await page.click(f"[data-stout='{order[1]}']")
    for x in order: await page.click(f"[data-stin='{x}']"); await page.wait_for_timeout(20)
    await page.click("[data-stcheck]"); await page.wait_for_timeout(60)
    t = await page.inner_text("#stbox")
    check(t.startswith("Right.") and await page.locator(".stproof li").count() == len(order) and "by modus ponens" in t, "in order, Check says so and writes out the proof")
    await page.click("[data-stnew]"); order = await page.evaluate("ST.order")
    for x in [order[1], order[0]] + order[2:]: await page.click(f"[data-stin='{x}']"); await page.wait_for_timeout(20)
    await page.click("[data-stcheck]"); await page.wait_for_timeout(60)
    check((await page.inner_text("#stbox")).startswith("Not this order.") and await page.locator("#stbox .oblist li.no").count() == 2, "out of order, the misplaced ones are marked")
    check(not errs, "no script errors in the new puzzles" + (f": {errs}" if errs else ""))
    await page.context.close()

async def recon(browser):
    page, errs = await fresh(browser)
    await page.evaluate("go({ screen: 'branches', focus: 'logic' })"); await page.wait_for_timeout(200)
    await page.click("details[data-branch-id='logic'] [data-recon]"); await page.wait_for_selector(".sheet .recon")
    g = await page.evaluate("[document.querySelectorAll('.sheet .recon li').length, RECON_STEPS.length, document.querySelectorAll('.sheet .qz-arg').length, document.querySelectorAll('.sheet .srclist a').length]")
    check(g[0] == g[1] == 8 and g[2] == 2 and g[3] == 2, f"the guide opens from the Logic branch: its steps, a worked example in two versions, two sources ({g})")
    await page.click(".sheet [data-term='genetic-fallacy']"); await page.wait_for_timeout(300)
    check(await page.evaluate("document.querySelector(\"details[data-term-id='genetic-fallacy']\")?.open"), "it links to the fallacy its example turns on")
    await page.evaluate("put('texts', 'r1', { title: 'R', sections: [], createdAt: 1, updatedAt: 1 }).then(() => go({ screen: 'text', textId: 'r1' }))"); await page.wait_for_timeout(200)
    await page.evaluate("noteSheet(null)"); await page.wait_for_selector("#n-arg", state="attached")
    check(await page.locator("#n-arg .reconfold .recon li").count() == 8, "an Argument note's premises have the steps to fold out")
    check(not errs, "no script errors in the guide" + (f": {errs}" if errs else ""))
    await page.context.close()

async def quizsets(browser):
    page, errs = await fresh(browser)
    await page.evaluate("put('terms', 'u1', { t: 'My own term', a: 'mine', d: 'A definition I wrote for my class.', createdAt: 1, updatedAt: 1 })")
    await page.evaluate("go({ screen: 'glossary' })"); await page.click("#quiz"); await page.click("[data-mkset]"); await page.wait_for_selector("#mk-t")
    await page.fill("#mk-t", "Week 3 <b>ethics</b>")
    for q in ["deontology", "eudaimonia", "categorical imperative", "autonomy", "my own term"]:
        await page.fill("#mk-q", q); await page.wait_for_timeout(60); await page.check(".mkrow input >> nth=0")
    await page.click("[data-mklink]"); await page.wait_for_selector("#mk-link")
    link = await page.input_value("#mk-link")
    check(link.startswith("http://localhost:") and "#set=" in link and await page.inner_text(".mkcount") == "5 chosen", f"five chosen terms make a link ({len(link)} characters)")
    await page.evaluate("MK.picked = new Set(['deontology']); document.querySelector('#mkbox').innerHTML = ''"); await page.click("[data-mklink]"); await page.wait_for_timeout(50)
    check("at least four" in await page.inner_text("#mkout"), "fewer than four is refused")
    ctx = await browser.new_context(viewport={"width": 390, "height": 844}); p2 = await ctx.new_page(); e2 = []
    p2.on("pageerror", lambda e: e2.append(str(e)))
    await p2.goto(link); await p2.wait_for_function(READY); await p2.wait_for_selector("#quizbox .qz-opt")
    got = await p2.evaluate("[document.querySelector('.sheet h2').textContent, location.hash, QZ.set.terms.map((g) => g.t).sort(), QZ.qs.length, QZ.qs.every((q) => QZ.set.terms.includes(q.g)), document.querySelectorAll('[data-qzmode]').length]")
    check(got[0] == "Week 3 <b>ethics</b>" and got[1] == "" and got[2] == ["Autonomy", "Categorical imperative", "Deontology", "Eudaimonia", "My own term"] and got[3] == 5 and got[4] and got[5] == 2, f"the link opens a quiz on just those terms, title as text, address cleaned up ({got})")
    for k in range(5):
        await p2.click(".qz-opt >> nth=0"); await p2.wait_for_selector("[data-qznext]"); await p2.click("[data-qznext]"); await p2.wait_for_timeout(40)
    check("of 5" in await p2.inner_text("#quizbox") and not e2, "the set's quiz ends in a score" + (f" {e2}" if e2 else ""))
    await p2.goto(link.split("#")[0] + "#set=" + await page.evaluate("b64u(JSON.stringify({ v: 1, t: '<img src=x onerror=\"window.__xss=1\">', ids: ['ontology', 'validity', 'dasein', 'eudaimonia'], own: [['<b>x</b>', '<img src=x onerror=\"window.__xss=1\">']] }))"))
    await p2.wait_for_function(READY); await p2.wait_for_selector("#quizbox"); await p2.wait_for_timeout(300)
    check(not await p2.evaluate("!!window.__xss") and await p2.evaluate("!document.querySelector('.sheet img')"), "markup in a link is drawn as text")
    await p2.goto(link.split("#")[0] + "#set=bm90IGpzb24"); await p2.wait_for_function(READY); await p2.wait_for_timeout(300)
    check(await p2.evaluate("!document.querySelector('#quizbox') && !document.querySelector('#toast').hidden && document.querySelector('#toast').textContent.includes('damaged')"), "a damaged link is refused with a message")
    await p2.goto(link.split("#")[0] + "#path=who-counts"); await p2.wait_for_function(READY); await p2.wait_for_timeout(300)
    check(await p2.evaluate("[S.screen, location.hash]") == ["paths", ""], "a reading path's link opens the paths")
    await ctx.close()
    check(not errs, "no script errors making a set" + (f": {errs}" if errs else ""))
    await page.context.close()

async def disputes(browser):
    page, errs = await fresh(browser)
    await page.evaluate("addClassics(true)"); await page.wait_for_timeout(300)
    bad = await page.evaluate("""(async () => { const bad = [], ids = new Set(GLOSSARY.map((g) => g.id));
      for (const d of DISPUTES) {
        if (!CLASSICS.includes(d.book)) { bad.push(d.id + ' book'); continue; }
        if (!S.texts.get(d.book).sections.some((x) => x.id === d.sec)) bad.push(d.id + ' chapter');
        const at = await disputeBlock(d), B = S.content.get(d.book), r = stepRange(B, [d.sec]);
        if (at < 0 || !r || at < r[0] || at >= r[1]) bad.push(d.id + ' passage ' + at + ' ' + r);
        for (const t of d.terms || []) if (!ids.has(t)) bad.push(d.id + ' term ' + t);
        if (!d.src || !d.srcName || !d.x || d.prem.length < 2 || !d.concl || !d.who) bad.push(d.id + ' fields');
      } return bad; })()""")
    check(bad == [], f"every disputation's book, chapter, passage, terms and source check out ({bad})")
    await page.evaluate("go({ screen: 'library' })"); await page.click("#opendisputes"); await page.wait_for_timeout(200)
    check(await page.locator("[data-dispute]").count() == await page.evaluate("DISPUTES.length"), "the home screen opens the list")
    await page.click("[data-dispute='false-promise']"); await page.wait_for_selector("#dsp-x")
    cmp = page.locator("#dspbox [data-dspshow]:not(.ghost)")
    check(await cmp.is_disabled(), "Compare waits for an objection")
    await page.fill("#dsp-x", "The test only finds a contradiction if promising is assumed to exist.")
    check(not await cmp.is_disabled() and await page.locator("[data-dspsave]").count() == 1, "with one written, Compare and Save are offered")
    await page.click("#pclose"); await page.wait_for_timeout(200); await page.click("[data-dispute='false-promise']"); await page.wait_for_selector("#dsp-x")
    check(await page.input_value("#dsp-x") == "The test only finds a contradiction if promising is assumed to exist.", "what you wrote survives closing the panel")
    await page.click("#dspbox [data-dspshow]:not(.ghost)"); await page.wait_for_timeout(80)
    check("Hegel" in await page.inner_text(".dspclassic") and await page.locator(".dspclassic .tsrc a").count() >= 1, "Compare shows the classic objection with its source")
    await page.click("[data-dspsave]"); await page.wait_for_timeout(400)
    n = await page.evaluate("""(async () => { const d = DISPUTES.find((x) => x.id === 'false-promise'), [id, n] = disputeNotes(d)[0] || [];
      return n && [n.kind, n.sectionId === d.sec, n.at === await disputeBlock(d), /#disputation/.test(n.gloss), n.gloss.startsWith('The test only'), tagsOf(n).includes('disputation')]; })()""")
    check(n == ["objection", True, True, True, True, True], f"Save makes an Objection note on the book, at the passage, tagged #disputation ({n})")
    check("Your objection saved: 1." in await page.inner_text("[data-dispute='false-promise']"), "the list says it's answered")
    await page.click("[data-dispute='induction']"); await page.wait_for_selector("#dsp-x")
    await page.click("#dspbox [data-dspshow].ghost"); await page.wait_for_timeout(80)
    check("Strawson" in await page.inner_text(".dspclassic"), "Just show me shows it without writing")
    await page.click("[data-dspread]"); await page.wait_for_timeout(900)
    where = await page.evaluate("(async () => { const d = DISPUTES.find((x) => x.id === 'induction'), at = await disputeBlock(d); return [S.screen, R.tid, Math.abs(currentBlock() - at) <= 3]; })()")
    check(where == ["reader", "classic-hume-enquiry", True], f"Read the passage opens the reader there ({where})")
    await page.evaluate("go({ screen: 'disputes' })"); await page.evaluate("deleteText('classic-plato-socrates')"); await page.wait_for_timeout(300)
    await page.click("[data-dispute='euthyphro']"); await page.wait_for_selector("[data-pathadd]")
    check(await page.locator("[data-dspread]").count() == 0 and await page.locator("[data-dspsave]").count() == 0, "a deleted classic offers Add the book back, and nothing to read or save into")
    check(not errs, "no script errors in disputations" + (f": {errs}" if errs else ""))
    await page.context.close()

async def readqs(browser):
    page, errs = await fresh(browser)
    await page.evaluate("addClassics(true)"); await page.wait_for_timeout(300)
    bad = await page.evaluate("PATHS.filter((P) => P.steps).flatMap((P) => P.steps.filter((st) => !Array.isArray(st.q) || st.q.length !== 3 || st.q.some((q) => typeof q !== 'string' || q.length < 20)).map((st) => P.id + ' ' + st.book))")
    check(bad == [], f"every path step has three questions to read with ({bad})")
    await page.evaluate("go({ screen: 'paths' })"); await page.wait_for_timeout(200)
    n = await page.evaluate("[document.querySelectorAll('section.path:not(.close) .readqd').length, PATHS.filter((P) => P.steps).reduce((k, P) => k + P.steps.length, 0), [...document.querySelectorAll('section.path:not(.close) .readqd')].every((d) => !d.open && d.querySelectorAll('li').length === 3)]")
    check(n[0] == n[1] and n[2], f"each step folds its three questions ({n})")
    await page.evaluate("document.querySelector('[data-askq=\"why-obey|2|1\"]').closest('details').open = true")
    await page.click("[data-askq='why-obey|2|1']"); await page.wait_for_timeout(400)
    note = await page.evaluate("""(async () => { const B = await loadContent('classic-mill-liberty'), r = stepRange(B, ['classic-mill-liberty-s2']);
      const ns = notesFor('classic-mill-liberty').filter(([, n]) => n.kind === 'question'); const n = ns[0] && ns[0][1];
      return [ns.length, n && n.gloss === PATHS[2].steps[2].q[1], n && n.sectionId === 'classic-mill-liberty-s2', n && n.at === r[0]]; })()""")
    check(note == [1, True, True, True], f"Add to my questions makes a Question note at the step's first chapter ({note})")
    shown = await page.evaluate("[...document.querySelectorAll('section.path[data-path-id=\"why-obey\"] .readqs')[2].querySelectorAll('li')].map((li) => !!li.querySelector('small'))")
    check(shown == [False, True, False], f"...and the path then says it's in your questions ({shown})")
    await page.evaluate("askQuestion('why-obey|2|1')"); await page.wait_for_timeout(200)
    check(await page.evaluate("notesFor('classic-mill-liberty').filter(([, n]) => n.kind === 'question').length") == 1 and "already" in await page.inner_text("#toast"), "asking twice adds nothing")
    brief = await page.evaluate("""(async () => { const id = 'classic-mill-liberty', B = await loadContent(id), r = stepRange(B, ['classic-mill-liberty-s2']), t = S.texts.get(id), out = [];
      for (const pos of [r[0] + 3, 2]) { await put('texts', id, { ...S.texts.get(id), pos }); go({ screen: 'text', textId: id }); await new Promise((z) => setTimeout(z, 150)); out.push(document.querySelectorAll('.brief .readqs li').length); }
      const w = 'classic-wollstonecraft-vindication', BW = await loadContent(w), rw = stepRange(BW, ['classic-wollstonecraft-vindication-s2']);
      await put('texts', w, { ...S.texts.get(w), pos: rw[0] + 1 }); go({ screen: 'text', textId: w }); await new Promise((z) => setTimeout(z, 150));
      out.push(document.querySelector('.brief .bmore:last-child')?.textContent || ''); return out; })()""")
    check(brief[:2] == [3, 0], f"Where you left off shows a step's questions inside its chapters only ({brief[:2]})")
    check("Why obey the state?" in brief[2], f"where two paths share a chapter, the first path's questions show ({brief[2]!r})")
    check(not errs, "no script errors with reading questions" + (f": {errs}" if errs else ""))
    await page.context.close()

async def primers(browser):
    page, errs = await fresh(browser)
    bad = await page.evaluate("""(() => { const ids = new Set(GLOSSARY.map((g) => g.id)), bad = [];
      for (const id of CLASSICS) { const p = PRIMERS[id]; if (!p) { bad.push(id + ' none'); continue; }
        if (!p.about || p.about.length < 120 || !p.built || !p.src || !p.srcName) bad.push(id + ' fields');
        for (const t of p.terms || []) if (!ids.has(t)) bad.push(id + ' term ' + t); }
      for (const id of Object.keys(PRIMERS)) if (!CLASSICS.includes(id)) bad.push(id + ' not a classic');
      return bad; })()""")
    check(bad == [], f"every classic has a primer, its words in the glossary, with a source ({bad})")
    await page.evaluate("addClassics(true)"); await page.wait_for_timeout(300)
    await page.evaluate("go({ screen: 'text', textId: 'classic-hume-enquiry' })"); await page.wait_for_timeout(200)
    st = await page.evaluate("[document.querySelector('details.primer')?.open, [...document.querySelectorAll('.primer [data-path]')].map((b) => b.dataset.path), document.querySelectorAll('.primer .tchip').length]")
    check(st == [True, ["what-can-we-know"], 3], f"a classic you haven't started shows its primer open, with its path and words ({st})")
    await page.evaluate("put('texts', 'classic-hume-enquiry', { ...S.texts.get('classic-hume-enquiry'), pos: 40 })"); await page.wait_for_timeout(200)
    check(await page.evaluate("document.querySelector('details.primer').open") is False, "once you've started, it's folded")
    await page.click(".primer summary"); await page.click(".primer [data-path]"); await page.wait_for_timeout(300)
    check(await page.evaluate("S.screen") == "paths", "its path chip opens the path")
    await page.evaluate("put('texts', 'own', { title: 'Own', sections: [], createdAt: 1, updatedAt: 1 }).then(() => go({ screen: 'text', textId: 'own' }))"); await page.wait_for_timeout(200)
    check(await page.locator("details.primer").count() == 0, "a book of your own has no primer")
    check(not errs, "no script errors with primers" + (f": {errs}" if errs else ""))
    await page.context.close()

def sources():
    import re
    for f in ("glossary", "thinkers", "branches"):
        text = (ROOT / "data" / f"{f}.js").read_text(encoding="utf-8")
        wiki = re.findall(r"https?://[a-z.]*wikipedia\.org[^\"]*", text)
        check(not wiki, f"data/{f}.js cites no Wikipedia ({wiki[:3]})")
        plain = [u for u in re.findall(r'src: "([^"]*)"', text) if not u.startswith("https://")]
        check(not plain, f"data/{f}.js: every source link is https ({plain[:3]})")

def section_sources():
    import json, subprocess
    js = ("global.window=global;eval(require('fs').readFileSync('data/branches.js','utf8')+';process.stdout.write(JSON.stringify(BRANCHES.map(b=>({id:b.id,x:b.x||\\'\\',xs:b.xs||null}))))')")
    data = json.loads(subprocess.run(["node", "-e", js], cwd=ROOT, capture_output=True, text=True, check=True).stdout)
    audited = {f.stem for f in (ROOT / "tests" / "audit").glob("*.json")}
    for b in data:
        check(bool(b["xs"]) == (b["id"] in audited), f"{b['id']}: has section sources exactly when its audit record is in tests/audit")
        if not b["xs"]: continue
        heads = [part.split("\n")[0] for part in b["x"].split("\n\n") if "\n" in part]
        stray = [k for k in b["xs"] if k not in heads]
        check(not stray, f"{b['id']}: every section source names one of its headings ({stray})")
        bad = [x for v in b["xs"].values() for x in v if not x.get("srcName") or (x.get("src") and not x["src"].startswith("https://"))]
        check(not bad, f"{b['id']}: every section source has a name and an https link ({bad[:2]})")
        dup = [k for k, v in b["xs"].items() if len({x.get("src") or x.get("srcName") for x in v}) < len(v)]
        check(not dup, f"{b['id']}: no source is listed twice under one section ({dup})")

# The shared frame of a rebuilt article (owner's decision, 2026-10-22). An article is on the frame once its first section is
# "Scope and central questions"; from then on all of this holds for it. Its text is exactly the sentences of its audit record,
# so no sentence reaches the app without its sources.
FRAME_FIRST = "Scope and central questions"
FRAME_CLOSE = ["Criticisms and debates", "Connections and influence", "Open questions"]
FRAME_ENCOUNTERS = {"indian", "chinese", "islamic", "african"}
FRAME_WORDS = (5000, 8000)
CONTRASTIVE = [r"\bnot\s+(merely|simply|just|only|so much)\b", r"\brather than\b", r"\binstead of\b", r"\bmore than\b",
               r"\bgo(es|ing)? beyond\b|\bwent beyond\b", r"\bless\s+\w+\s+than\b", r"\bfar from\b", r"\bin place of\b",
               r",\s+not\s+(a|an|the|as|to|by|in|on|for|from|with|of|its|his|her|their|merely)\b", r"\bnot\b[^.;:?!]{1,60}\bbut\b"]

def article_frame():
    import json, re, subprocess
    js = ("global.window=global;eval(require('fs').readFileSync('data/branches.js','utf8')+';process.stdout.write(JSON.stringify(BRANCHES.map(b=>({id:b.id,x:b.x||\\'\\',xs:b.xs||null}))))')")
    data = json.loads(subprocess.run(["node", "-e", js], cwd=ROOT, capture_output=True, text=True, check=True).stdout)
    framed = []
    for b in data:
        heads = [part.split("\n")[0] for part in b["x"].split("\n\n") if "\n" in part]
        if not heads or heads[0] != FRAME_FIRST: continue
        bid = b["id"]; framed.append(bid)
        slot = "Encounters and comparisons" if bid in FRAME_ENCOUNTERS else "Beyond the European canon"
        check(heads[-4:] == [slot] + FRAME_CLOSE and len(heads) >= 10 and len(set(heads)) == len(heads),
              f"{bid}: the shared frame, with at least five sections between the first and '{slot}'")
        n = len(b["x"].split())
        check(FRAME_WORDS[0] <= n <= FRAME_WORDS[1], f"{bid}: {n} words, within {FRAME_WORDS[0]:,}–{FRAME_WORDS[1]:,}")
        check(b["xs"] is not None and sorted(b["xs"]) == sorted(heads) and all(b["xs"].values()), f"{bid}: every section has its sources")
        plain = re.sub(r"“[^”]*”", "", b["x"])
        hits = [m.group(0) for pat in CONTRASTIVE for m in re.finditer(pat, plain, flags=re.I)]
        check(not hits, f"{bid}: no contrastive constructions ({hits[:3]})")
        path = ROOT / "tests" / "audit" / f"{bid}.json"
        if not path.exists():
            check(False, f"{bid}: has its audit record"); continue
        a = json.loads(path.read_text(encoding="utf-8"))
        check(a.get("standard") == "frame-2026-10", f"{bid}: its audit record is on the frame standard")
        parts = []
        for para in a.get("paragraphs", []):
            text = " ".join(s["text"] for s in para["sentences"])
            parts.append(para["heading"] + "\n" + text if para.get("heading") else text)
        check("\n\n".join(parts) == b["x"], f"{bid}: the article is exactly the sentences of its audit record")
        sents = [s for p in a.get("paragraphs", []) for s in p["sentences"]]
        claims = [c for s in sents for c in s.get("claims", [])]
        unsourced = [s["text"][:50] for s in sents if not s.get("claims")]
        bad = [c.get("review") or c.get("first_pass") for c in claims if (c.get("review") or c.get("first_pass")) not in ("supported", "editorial")]
        nosrc = [c for c in claims if c.get("type") != "editorial" and not c.get("by")]
        check(not unsourced and not bad and not nosrc, f"{bid}: every sentence's claims are supported by a cited source ({len(unsourced)} unrecorded, {len(bad)} not supported, {len(nosrc)} without a source)")
        long = [c["excerpt"] for c in claims if len(c.get("excerpt", "").split()) >= 15] + \
               [q["q"] for s in sents for q in s.get("quotes", []) if len(q.get("q", "").split()) >= 15 and not q.get("public_domain")]
        check(not long, f"{bid}: quotations and excerpts from copyrighted sources stay under 15 words ({long[:1]})")
        unrecorded = []
        for s in sents:
            listed = [q.get("q", "") for q in s.get("quotes", [])]
            for m in re.finditer(r"“([^”]+)”", s["text"]):
                inner = m.group(1).strip().rstrip(",.;:")
                if len(inner.split()) >= 3 and not any(inner in l or l in inner for l in listed if l): unrecorded.append(inner[:40])
        check(not unrecorded, f"{bid}: every quotation is recorded with its source ({unrecorded[:2]})")
    print(f"  {len(framed)} of {len(data)} articles on the shared frame" + (f": {', '.join(framed)}" if framed else ""))

async def branch_sources(browser):
    page, errs = await fresh(browser)
    await page.evaluate("go({ screen: 'branches', focus: 'epistemology' })"); await page.wait_for_timeout(200)
    await page.evaluate("document.querySelector(\"details[data-branch-id='epistemology']\").open = true"); await page.wait_for_timeout(100)
    got = await page.evaluate("""(() => { const d = document.querySelector("details[data-branch-id='epistemology']");
      const secs = [...d.querySelectorAll('.branch-article-section')];
      return { secs: secs.length, src: secs.filter((s) => s.querySelector('p.ssrc')).length,
               last: secs.length ? !!secs[secs.length - 1].querySelector('p.ssrc') : null,
               blank: [...d.querySelectorAll('p.ssrc a')].filter((a) => a.target !== '_blank').length }; })()""")
    want = await page.evaluate("Object.keys(BRANCH.get('epistemology').xs).length")
    check(got["src"] == want and got["secs"] == want + 1 and got["last"] is False, f"Epistemology: a sources line under each of its {want} sourced sections, none under the questions ({got})")
    check(got["blank"] == 0, "section source links open in a new tab")
    for bid in await page.evaluate("BRANCHES.filter((b) => b.xs).map((b) => b.id)"):
        await page.evaluate(f"go({{ screen: 'branches', focus: '{bid}' }})"); await page.wait_for_timeout(150)
        last = await page.evaluate(f"""(() => {{ const d = document.querySelector("details[data-branch-id='{bid}']"); d.open = true;
          const secs = [...d.querySelectorAll('.branch-article-section')];
          return secs.filter((s) => s.querySelector('p.ssrc')).map((s) => s.lastElementChild.classList.contains('ssrc') && s.querySelectorAll('p.ssrc').length === 1); }})()""")
        check(last and all(last), f"{bid}: each sources line sits once, at the end of its section, after all its paragraphs ({last.count(False)} misplaced)")
    marks = await page.evaluate("""(() => { go({ screen: 'branches' }); return BRANCHES.map((b) => { const d = document.querySelector(`details[data-branch-id='${b.id}']`);
      return [!!b.xs, !!d.querySelector('p.unchecked'), d.querySelector('summary .ta').textContent.startsWith('Unchecked')]; }); })()""")
    check(all(m[0] != m[1] and m[0] != m[2] for m in marks), f"every unaudited article, and only those, is marked Unchecked ({sum(1 for m in marks if not m[0])} unaudited)")
    check(not errs, "no script errors with section sources" + (f": {errs}" if errs else ""))
    await page.context.close()

async def mentions(browser):
    page, errs = await fresh(browser)
    await page.evaluate("openTerm('substance')"); await page.wait_for_timeout(300)
    box = "details[data-term-id='substance'] .mentions"
    got = await page.evaluate(f"""(() => {{ const b = document.querySelector("{box}"); if (!b) return null;
      return {{ marks: [...b.querySelectorAll('mark')].map((m) => m.textContent.toLowerCase()), arts: [...b.querySelectorAll('.mention[data-branch]')].map((x) => [x.dataset.branch, x.dataset.bsec]),
        self: b.querySelectorAll('.mention[data-term="substance"]').length, terms: b.querySelectorAll('.mention[data-term]').length, thinkers: b.querySelectorAll('.mention[data-thinker]').length }}; }})()""")
    check(got is not None, "an open glossary entry shows Mentioned in")
    if got:
        check(set(got["marks"]) <= {"substance", "substances"} and got["marks"], f"each mention marks the term's own words, plurals included ({set(got['marks'])})")
        check(["metaphysics", "Substance and composition"] in got["arts"], f"the articles are listed by section ({got['arts'][:3]})")
        check(got["self"] == 0 and got["terms"] >= 4 and got["thinkers"] >= 4, f"other entries and thinker cards are listed, never the entry itself ({got})")
    fold = await page.evaluate("[findNeedles(linkFold('the substantial and the substances'), termNeedles(allTerms().find((g) => g.id === 'substance'))).length]")
    check(fold == [1], f"a word built on the term doesn't count, its plural does ({fold})")
    pair = await page.evaluate("termNeedles(allTerms().find((g) => g.id === 'assemblage')).map((n) => n.s)")
    check(pair == ["assemblage", "agencement"], f"a term matches by the name in its brackets too ({pair})")
    await page.click(f"{box} .mention[data-branch='metaphysics'][data-bsec='Substance and composition']"); await page.wait_for_timeout(300)
    sec = await page.evaluate("""(() => { const s = [...document.querySelectorAll("details[data-branch-id='metaphysics'] section[data-bsec]")].find((x) => x.dataset.bsec === 'Substance and composition');
      return s ? [S.screen, s.classList.contains('flash'), Math.round(s.getBoundingClientRect().top)] : null; })()""")
    check(sec and sec[0] == "branches" and sec[1] and -2 <= sec[2] < 120, f"tapping an article's row opens the article at that section ({sec})")
    await page.go_back(); await page.wait_for_timeout(300)
    check(await page.evaluate("S.screen") == "glossary", "Back returns to the glossary")
    names = await page.evaluate("""[
      findNeedles(linkFold('Nagarjuna argued'), thinkerNeedles(THINKER.get('nagarjuna'))).length,
      findNeedles(linkFold('kantian ethics and Kantian ones'), thinkerNeedles(THINKER.get('kant'))).length,
      findNeedles(linkFold('as Kant said'), thinkerNeedles(THINKER.get('kant'))).length,
      findNeedles(linkFold('as he said, and as Said said'), thinkerNeedles(THINKER.get('said'))).length,
      findNeedles(linkFold('Edward Said wrote'), thinkerNeedles(THINKER.get('said'))).length,
      findNeedles(linkFold('on land and Land'), thinkerNeedles(THINKER.get('land'))).length]""")
    check(names == [1, 0, 1, 0, 1, 0], f"thinkers match as the articles link them: accents ignored, short names whole and in exact case, Said and Land only in full ({names})")
    await page.evaluate("put('texts', 'mb', { title: 'Mine', sections: [], createdAt: Date.now(), updatedAt: Date.now() }).then(() => put('notes', 'mn1', { textId: 'mb', kind: 'gloss', passage: 'Nature, or God', gloss: 'Compare Spinoza on substance', links: [], createdAt: Date.now(), updatedAt: Date.now() }))")
    await page.evaluate("thinkerPanel('spinoza')"); await page.wait_for_timeout(300)
    card = await page.evaluate("""(() => { const m = document.querySelector('.sheet .mentions'); return m && { deleuze: !!m.querySelector('.mention[data-thinker="deleuze"]'), self: m.querySelectorAll('.mention[data-thinker="spinoza"]').length,
      arts: m.querySelectorAll('.mention[data-branch]').length, terms: m.querySelectorAll('.mention[data-term]').length, notes: document.querySelectorAll('.sheet .thits .thit').length }; })()""")
    check(card and card["deleuze"] and card["self"] == 0 and card["arts"] >= 2 and card["terms"] >= 4, f"a thinker's card lists the articles, cards and entries that name them, never their own ({card})")
    check(card and card["notes"] == 1, f"and your notes that name them ({card and card['notes']})")
    await page.click(".sheet .mention[data-thinker='deleuze']"); await page.wait_for_timeout(300)
    check(await page.evaluate("document.querySelector('.sheet h2')?.textContent") == "Gilles Deleuze", "tapping a card's row opens that card")
    check(not errs, "no script errors in Mentioned in" + (f": {errs}" if errs else ""))
    await page.context.close()

async def connections(browser):
    import re, json
    page, errs = await fresh(browser)
    data = await page.evaluate("""CONNECTIONS.map((c) => ({ from: c.from, to: connTo(c), kind: c.kind, claim: c.claim, text: c.text || [], reading: c.reading || [],
      ok: !!THINKER.get(c.from) && connTo(c).every((x) => THINKER.get(x)) && !!CONN_KINDS[c.kind] }))""")
    check(len(data) >= 4 and all(c["ok"] for c in data), f"every connection names known thinkers and a known kind ({[(c['from'], c['to'], c['kind']) for c in data if not c['ok']]})")
    check(all(c["reading"] and all(r.get("src", "").startswith("https://") and r.get("srcName") and r.get("says") for r in c["reading"]) for c in data),
          "every connection rests on at least one scholarly reading with its source")
    check(all(all(t.get("says") and (t.get("ref") or t.get("cite")) for t in c["text"]) for c in data),
          "every primary-text line says where its words are: a bundled classic's reference, or where they were checked")
    words = " ".join(" ".join([c["claim"]] + [t["says"] for t in c["text"]] + [r["says"] for r in c["reading"]]) for c in data)
    plain = re.sub(r"“[^”]*”", "", words)
    hits = [m.group(0) for pat in CONTRASTIVE for m in re.finditer(pat, plain, flags=re.I)]
    check(not hits, f"connections: no contrastive constructions ({hits[:3]})")
    audit = json.loads((ROOT / "tests" / "audit" / "connections.json").read_text())
    keys = {(c["from"], ",".join(c["to"]), c["kind"]) for c in data}
    rec = {(r["from"], ",".join(r["to"] if isinstance(r["to"], list) else [r["to"]]), r["kind"]): r for r in audit["connections"]}
    check(keys == set(rec) and all(r.get("review", {}).get("verdict") == "pass" for r in rec.values()),
          f"every connection has its audit record with a passed independent review ({sorted(keys ^ set(rec))})")
    refs = await page.evaluate("""(async () => { const out = [];
      for (const c of CONNECTIONS) for (const t of c.text || []) if (t.ref) {
        const html = passageLinks(esc(t.ref), t.style), m = html.match(/data-passage="([^"]+)" data-passage-at="([^"]*)"/);
        if (!m) { out.push([t.ref, null]); continue; }
        const B = (await (await fetch('data/books/' + PASSAGE_STYLES[m[1]].book + '.json')).json()).content, i = passageBlock(B, m[2], m[1]);
        out.push([t.ref, i >= 0 ? plain(B[i].x) : null]); }
      return out; })()""")
    check(refs and all(x[1] for x in refs), f"every reference into a bundled classic links and finds its passage ({refs})")
    # both sides of the card
    await page.evaluate("thinkerPanel('spinoza')"); await page.wait_for_timeout(300)
    sp = await page.evaluate("""[...document.querySelectorAll('.sheet .conn')].map((c) => ({ kind: c.dataset.connKind, head: c.querySelector('.conn-h').textContent, lines: [...c.querySelectorAll('.ck')].map((k) => k.textContent) }))""")
    heads = sorted(c["head"] for c in sp)
    check(heads == ["Criticized by Nietzsche", "Reinterpreted by Deleuze"], f"Spinoza's card words each connection from Spinoza's side ({heads})")
    nz = [c for c in sp if c["kind"] == "critique"]
    check(nz and nz[0]["lines"][:1] == ["In the text"] and "Scholarship" in nz[0]["lines"], f"the primary text comes first, then the scholarship, each labelled ({nz})")
    await page.evaluate("thinkerPanel('land')"); await page.wait_for_timeout(300)
    land = await page.evaluate("[...document.querySelectorAll('.sheet .conn-h')].map((h) => h.textContent)")
    check(land == ["Reinterprets Deleuze and Guattari"], f"a connection to co-authors names both, from Land's side ({land})")
    await page.evaluate("thinkerPanel('guattari')"); await page.wait_for_timeout(300)
    gu = await page.evaluate("[...document.querySelectorAll('.sheet .conn-h')].map((h) => h.textContent)")
    check(gu == ["Reinterpreted by Land"], f"and from each co-author's ({gu})")
    check(await page.evaluate("connectionsHTML('aristotle')") == "", "a thinker without connections shows no Connections row")
    # the primary reference opens the classic there
    await page.evaluate("addClassics(true)"); await page.wait_for_function("S.texts.has('classic-nietzsche-beyond')", timeout=60000)
    await page.evaluate("thinkerPanel('nietzsche')"); await page.wait_for_timeout(300)
    await page.click(".sheet .conn [data-passage='nietzsche-beyond']")
    await page.wait_for_function("S.screen === 'reader' && R.tid === 'classic-nietzsche-beyond' && R.blocks", timeout=20000); await page.wait_for_timeout(600)
    at = await page.evaluate("(() => { const want = passageBlock(R.blocks, '§13', 'nietzsche-beyond'); return [want, currentBlock(), plain(R.blocks[want].x)]; })()")
    check(at[2] == "13" and abs(at[1] - at[0]) <= 3, f"tapping (BGE §13) on a card opens Beyond Good and Evil at section 13 ({at})")
    check(not errs, "no script errors in connections" + (f": {errs}" if errs else ""))
    await page.context.close()

async def close_reading(browser):
    import re, json
    page, errs = await fresh(browser)
    await page.evaluate("addClassics(true)"); await page.wait_for_function("S.texts.has('classic-spinoza-ethics')", timeout=60000)
    # every station: its passages exist, its quotations are the bundled text's words, its sources and terms are real
    chk = await page.evaluate("""(async () => { const out = { bad: [], n: 0, quotes: 0 }, ids = new Set(GLOSSARY.map((g) => g.id));
      for (const P of PATHS.filter((P) => P.kind === 'close')) {
        const B = await loadContent(P.book), whole = B.map((b) => plain(b.x || '')).join(' ').replace(/[¹²³⁴⁵⁶⁷⁸⁹⁰]/g, '').replace(/\\s+/g, ' ');
        const st = PASSAGE_STYLES[P.style];
        for (const s of closeStations(P)) {
          out.n++;
          for (const r of s.refs) { const m = r.match(st.item); if (!m || st.find(B, m.slice(1).map((v) => v || '')) < 0) out.bad.push(s.id + ' ref ' + r); }
          // each quotation must be in the station's own passages (each ref's span: a proposition with its proof, corollaries and notes)
          const own = s.refs.map((r) => { const m = r.match(st.item), i = m ? st.find(B, m.slice(1).map((v) => v || '')) : -1; if (i < 0) return ''; const [a, b] = passageSpan(B, i); return B.slice(a, b).map((x) => plain(x.x || '')).join(' '); }).join(' ').replace(/[¹²³⁴⁵⁶⁷⁸⁹⁰]/g, '').replace(/\\s+/g, ' ');
          for (const q of (s.says.match(/“[^”]*”/g) || [])) { out.quotes++; const w = q.slice(1, -1).replace(/\\s+/g, ' '); if (!own.includes(w)) out.bad.push(s.id + (whole.includes(w) ? ' quote from outside its passages ' : ' quote ') + q); }
          for (const t of s.terms || []) if (!ids.has(t)) out.bad.push(s.id + ' term ' + t);
          for (const d of s.deleuze || []) if (!/^https:\\/\\//.test(d.src) || !d.srcName || !d.says) out.bad.push(s.id + ' source');
          if (!(s.q || []).length) out.bad.push(s.id + ' questions');
        } }
      return out; })()""")
    check(chk["n"] >= 12 and chk["quotes"] >= 25 and chk["bad"] == [], f"every station's passages exist in the bundled Ethics, its {chk['quotes']} quotations are words of those very passages, its terms and sources real ({chk['bad'][:4]})")
    words = await page.evaluate("PATHS.filter((P) => P.kind === 'close').flatMap((P) => [P.d, ...closeStations(P).flatMap((s) => [s.says, ...(s.q || []), ...(s.deleuze || []).map((d) => d.says)])]).join(' ')")
    hits = [m.group(0) for pat in CONTRASTIVE for m in re.finditer(pat, re.sub(r"“[^”]*”", "", words), flags=re.I)]
    check(not hits, f"the close reading: no contrastive constructions ({hits[:3]})")
    audit = json.loads((ROOT / "tests" / "audit" / "spinoza-deleuze.json").read_text())
    ids = await page.evaluate("closeStations(PATHS.find((P) => P.id === 'spinoza-deleuze')).map((s) => s.id)")
    check(sorted(audit["stations"]) == sorted(ids) and all(v.get("review", {}).get("verdict") == "pass" for v in audit["stations"].values()),
          "every station has its audit record with a passed independent review")
    # the path on screen
    await page.evaluate("(async () => { const t = S.texts.get('classic-spinoza-ethics'); await put('texts', t.id || 'classic-spinoza-ethics', { ...t, pos: 300 }); })()")
    await page.evaluate("go({ screen: 'paths', path: 'spinoza-deleuze' })"); await page.wait_for_timeout(800)
    ui = await page.evaluate("""(() => { const sec = document.querySelector('section.path.close[data-path-id="spinoza-deleuze"]');
      return sec && { stations: sec.querySelectorAll('.pstep').length, links: sec.querySelectorAll('[data-passage="spinoza-ethics"]').length, parts: [...sec.querySelectorAll('.ph')].map((h) => h.textContent),
        labels: [...new Set([...sec.querySelectorAll('.ck')].map((k) => k.textContent))], conns: [...sec.querySelectorAll('.crow .chip[data-thinker]')].map((c) => c.textContent), done: sec.querySelectorAll('.pstep.done').length }; })()""")
    want = await page.evaluate("(() => { const P = PATHS.find((x) => x.id === 'spinoza-deleuze'); return [closeStations(P).length, closeStations(P).reduce((n, s) => n + s.refs.length, 0)]; })()")
    check(ui and ui["stations"] == want[0] == 30 and ui["links"] == want[1] and len(ui["parts"]) == 5 and ui["done"] == 0, f"the path lists its 30 stations under Parts I to V, every passage a link ({ui}, {want})")
    check(ui and ui["labels"] == ["In the text", "Deleuze, through scholarship", "Deleuze, in his lectures"], f"Spinoza's text comes first and Deleuze's reading apart, scholarship and his own lectures each labelled ({ui and ui['labels']})")
    check(ui and ui["conns"] == ["Deleuze reinterprets Spinoza", "Nietzsche criticizes Spinoza"], f"the path shows its typed connections ({ui and ui['conns']})")
    nodel = await page.evaluate("[...document.querySelectorAll('section.path.close .pstep')].filter((s) => s.querySelector('.nodel')).map((s) => s.dataset.station)")
    nodel_want = await page.evaluate("closeStations(PATHS.find((x) => x.id === 'spinoza-deleuze')).filter((s) => !(s.deleuze || []).length).map((s) => s.id)")
    check(nodel == nodel_want and "kingdom" in nodel and "conatus" in nodel, f"each station without a sourced Deleuze reading says so ({nodel})")
    # a passage opens the Ethics there, keeping your place; Back returns to the path
    await page.click("[data-station='immanent-cause'] [data-passage-at='I|Proposition|18||']")
    await page.wait_for_function("S.screen === 'reader' && R.tid === 'classic-spinoza-ethics' && R.blocks", timeout=20000); await page.wait_for_timeout(700)
    rd = await page.evaluate("({ want: passageBlock(R.blocks, 'I|Proposition|18|'), at: currentBlock(), visiting: R.visiting, home: R.home })")
    check(abs(rd["at"] - rd["want"]) <= 3 and rd["visiting"] and rd["home"] == 300, f"a station's passage opens the Ethics there, with your place kept as ← Your place ({rd})")
    await page.evaluate("back()"); await page.wait_for_timeout(500)
    check(await page.evaluate("S.screen") == "paths", "Back returns to the path")
    check(await page.evaluate("S.texts.get('classic-spinoza-ethics').pos") == 300, "your place in the book is unchanged")
    # a question added from the path doesn't count; a note of your own on the passage does
    await page.evaluate("document.querySelector(`[data-station='conatus'] details.readqd`).open = true")
    await page.click("[data-askcq='spinoza-deleuze|conatus|0']"); await page.wait_for_timeout(500)
    q = await page.evaluate("(() => { const n = [...S.notes.values()].find((n) => n.kind === 'question' && n.textId === 'classic-spinoza-ethics'); return n && [n.at, n.gloss.slice(0, 30)]; })()")
    want6 = await page.evaluate("passageBlock(S.content.get('classic-spinoza-ethics'), 'III|Proposition|6|')")
    check(q and q[0] == want6, f"Add to my questions makes a Question note at the station's first passage ({q}, {want6})")
    st = await page.evaluate("document.querySelector(`[data-station='conatus']`).classList.contains('done')")
    check(not st, "a question added from the path doesn't mark the station read")
    await page.evaluate("(async () => { const B = S.content.get('classic-spinoza-ethics'), i = passageBlock(B, 'III|Proposition|7|'); await put('notes', 'cn1', { textId: 'classic-spinoza-ethics', kind: 'gloss', passage: 'nothing else but the actual essence', gloss: 'Essence as effort.', at: i + 1, links: [], createdAt: Date.now(), updatedAt: Date.now() }); render(); })()")
    await page.wait_for_timeout(400)
    st2 = await page.evaluate("""(() => { const s = document.querySelector("[data-station='conatus']"); return { done: s.classList.contains('done'), mine: [...s.querySelectorAll('.mgroup .mention')].map((m) => m.dataset.gotoNote), sub: document.querySelector('section.path.close .sub').textContent }; })()""")
    check(st2["done"] and len(st2["mine"]) == 1 and st2["sub"] == "30 stations, 1 with your notes", f"a note of your own on a station's passage (here in a proposition's proof) marks it read and is listed there ({st2})")
    # notes at the edges: just past a station's passages, or just before them, mark nothing; the passage's last block does
    edge = await page.evaluate("""(async () => {
      const B = S.content.get('classic-spinoza-ethics'), P = PATHS.find((x) => x.id === 'spinoza-deleuze'), sts = closeStations(P);
      const spans = new Map(sts.map((st) => [st.id, st.refs.map((r) => { const m = r.match(PASSAGE_STYLES[P.style].item); return passageSpan(B, PASSAGE_STYLES[P.style].find(B, m.slice(1).map((v) => v || ''))); })]));
      const inAny = (at) => sts.filter((st) => spans.get(st.id).some(([a, b]) => at >= a && at < b)).map((st) => st.id);
      const [a, b] = passageSpan(B, passageBlock(B, 'I|Proposition|18||'));
      const out = { after: [], before: [], last: [] };
      for (const [k, at] of [['after', b], ['before', a - 1], ['last', b - 1]]) {
        await put('notes', 'edge', { textId: 'classic-spinoza-ethics', kind: 'gloss', passage: '', gloss: 'edge', at, links: [], createdAt: Date.now(), updatedAt: Date.now() });
        const st = closeState(P); out[k] = sts.filter((s) => st.out.get(s.id).notes.some(([id]) => id === 'edge')).map((s) => s.id); out[k + 'Expect'] = inAny(at);
      }
      await del('notes', 'edge'); return out; })()""")
    check(edge["after"] == [] and edge["before"] == [] and edge["last"] == ["immanent-cause"] and edge["after"] == edge["afterExpect"],
          f"a note just past a station's passages, or just before them, marks no station; one in the passage's last block marks its own ({edge})")
    overlap = await page.evaluate("""(() => { const B = S.content.get('classic-spinoza-ethics'), P = PATHS.find((x) => x.id === 'spinoza-deleuze'), seen = new Map(), clash = [];
      for (const st of closeStations(P)) for (const r of st.refs) { const m = r.match(PASSAGE_STYLES[P.style].item), [a, b] = passageSpan(B, PASSAGE_STYLES[P.style].find(B, m.slice(1).map((v) => v || '')));
        for (let i = a; i < b; i++) { if (seen.has(i) && seen.get(i) !== st.id) clash.push(i + ' ' + seen.get(i) + '/' + st.id); seen.set(i, st.id); } }
      return clash; })()""")
    check(overlap == [], f"no block belongs to two stations' passages, so one note never marks two stations ({overlap[:4]})")
    await page.evaluate("go({ screen: 'text', textId: 'classic-spinoza-ethics' })"); await page.wait_for_timeout(400)
    chip = await page.evaluate("[...document.querySelectorAll('.primer .chip[data-path]')].map((c) => c.textContent)")
    check("Spinoza's Ethics, toward Deleuze" in chip, f"the Ethics' primer offers the path ({chip})")
    check(not errs, "no script errors in the close reading" + (f": {errs}" if errs else ""))
    await page.context.close()

async def critique_import(browser):
    page, errs = await fresh(browser)
    await page.evaluate("""(async () => {
      const B = [{ k: 'pg', x: '3' }, { k: 'h', l: 1, x: 'One', s: 'c1' }, { k: 'p', x: 'First passage words here.' }, { k: 'p', x: 'Second passage words here.' }];
      await put('content', 'kb', B);
      await put('texts', 'kb', { title: 'A Book', author: 'Someone', hasContent: true, total: B.length, sections: [{ id: 'c1', label: 'One' }], createdAt: 1, updatedAt: 1 });
      await put('notes', 'k1', { textId: 'kb', kind: 'passage', passage: 'First passage', at: 2, links: [], createdAt: 1, updatedAt: 1 });
      await put('notes', 'k2', { textId: 'kb', kind: 'gloss', passage: '', gloss: 'A thought of mine.', links: [], createdAt: 1, updatedAt: 1 });
      await put('notes', 'k3', { textId: 'kb', kind: 'passage', passage: 'Second passage', at: 3, links: [], createdAt: 1, updatedAt: 1 });
      await put('drafts', 'kd', { title: 'Essay', items: [{ t: 'h', x: 'Intro' }, { t: 'note', id: 'k1' }, { t: 'p', x: 'Guide: write here' }, { t: 'note', id: 'k2' }, { t: 'note', id: 'k3' }], createdAt: 1, updatedAt: 1 });
    })()""")
    await page.evaluate("go({ screen: 'draft', draftId: 'kd' })"); await page.wait_for_timeout(300)
    await page.click("#d-more"); await page.click("#dm-crit"); await page.wait_for_selector("#c-x")
    await page.fill("#c-by", "My tutor")
    await page.fill("#c-x", "## Overall\n\nThe reading of [E2] is too quick, and **[E1]** needs context.\n\n> a quoted line\n\n[E9] doesn't exist.")
    await page.click("button[type=submit]"); await page.wait_for_timeout(400)
    d = await page.evaluate("JSON.parse(JSON.stringify(S.drafts.get('kd')))")
    c = (d.get("critiques") or [{}])[0]
    check(len(d.get("critiques") or []) == 1 and c.get("by") == "My tutor" and c.get("x", "").startswith("## Overall") and c.get("id") and c.get("at"), f"a critique you paste in is kept with the draft, dated and credited ({d.get('critiques')})")
    check(d["items"] == [{"t": "h", "x": "Intro"}, {"t": "note", "id": "k1"}, {"t": "p", "x": "Guide: write here"}, {"t": "note", "id": "k2"}, {"t": "note", "id": "k3"}], "and the draft's own text is left as it was")
    view = await page.evaluate("""(() => { const c = document.querySelector('.crits .crit'); return c && { head: c.querySelector('summary').textContent, jumps: [...c.querySelectorAll('[data-ejump]')].map((b) => [b.textContent, +b.dataset.ejump]),
      bold: !!c.querySelector('b [data-ejump], b'), quote: (c.querySelector('blockquote') || {}).textContent, dead: c.textContent.includes('[E9]') && !c.querySelector('[data-ejump="9"]') }; })()""")
    check(view and view["head"].startswith("My tutor") and view["jumps"] == [["[E2]", 4], ["[E1]", 1]] and view["quote"] == "a quoted line" and view["dead"],
          f"it's shown under the draft, its [E1], [E2] opening the passages the export numbered, an [E9] with no passage left as text ({view})")
    md = await page.evaluate("critiqueMarkdown('kd')")
    check("## 5. Earlier critiques" in md and "### My tutor," in md and "> The reading of [E2] is too quick" in md and md.count("[E1]") >= 2,
          "the next export For critique carries the earlier critiques, quoted, so a critic sees what was said before")
    await page.click("[data-ejump='4']"); await page.wait_for_timeout(500)
    fl = await page.evaluate("[...document.querySelectorAll('.dlist .ditem')].findIndex((e) => e.classList.contains('flash'))")
    check(fl == 4, f"tapping [E2] goes to the draft's second quoted passage ({fl})")
    ok = await page.evaluate("""[VALID.drafts({ title: 'x', items: [], critiques: [{ id: 'a', at: 1, by: '', x: 'y' }] }), VALID.drafts({ title: 'x', items: [] }),
      VALID.drafts({ title: 'x', items: [], critiques: [{ id: 'a', at: 'soon', x: 'y' }] }), VALID.drafts({ title: 'x', items: [], critiques: 'none' })]""")
    check(ok == [True, True, False, False], f"a backup's critiques are checked: well-formed ones restore, malformed ones are refused ({ok})")
    merged = await page.evaluate("""(() => { const a = { title: 'x', items: [], critiques: [{ id: 'a', at: 1, x: 'one' }] }, b = { title: 'x', items: [], critiques: [{ id: 'b', at: 2, x: 'two' }, { id: 'a', at: 1, x: 'one' }] };
      return [withCritiques(a, b).critiques.map((c) => c.id), withCritiques(b, a) === b, withCritiques(a, { title: 'x', items: [] }) === a]; })()""")
    check(merged == [["a", "b"], True, True], f"a restore keeps both copies' critiques, whichever copy wins ({merged})")
    await page.click(".crit [data-critdel]"); await page.click(".crit [data-critdel]"); await page.wait_for_timeout(400)
    check(await page.evaluate("(S.drafts.get('kd').critiques || []).length") == 0 and not await page.evaluate("!!document.querySelector('.crits')"), "Remove, tapped twice, takes the critique off the draft")
    check(not errs, "no script errors in critiques" + (f": {errs}" if errs else ""))
    await page.context.close()

async def critique(browser):
    page, errs = await fresh(browser)
    await page.evaluate("""(async () => {
      const B = [{ k: 'pg', x: '10' }, { k: 'h', l: 1, x: 'On Roots', s: 'c1' }, { k: 'p', x: 'The tree is filiation, but the rhizome is alliance, uniquely alliance, and nothing else.' },
        { k: 'pg', x: '11' }, { k: 'p', x: 'A second paragraph about maps and tracings, with more words after it.' }];
      await put('content', 'cb', B);
      await put('texts', 'cb', { title: 'Plateaus', author: 'Deleuze and Guattari', year: '1980', hasContent: true, total: B.length, pos: 0, status: 'reading', createdAt: 1, updatedAt: 1, sections: [{ id: 'c1', label: 'On Roots' }] });
      await put('texts', 'cx', { title: 'Elsewhere', author: 'Someone', createdAt: 1, updatedAt: 1 });
      const p1 = 'the rhizome is alliance', a = B[2].x.indexOf(p1);
      await put('notes', 'e1', { textId: 'cb', kind: 'passage', passage: p1, at: 2, page: '10', anchor: { a: 2, ao: a, b: 2, bo: a + p1.length, pre: '', suf: '' }, gloss: 'Alliance against filiation.', links: [], createdAt: 1, updatedAt: 1, followups: [{ id: 'f', at: 2, x: 'Compare the burrow.' }] });
      await put('notes', 'e2', { textId: 'cb', kind: 'passage', passage: 'maps and tracings', at: 4, page: '12', links: [], createdAt: 1, updatedAt: 1 });
      await put('notes', 'e3', { textId: 'cb', kind: 'passage', passage: 'words never written in it', at: 2, links: [], createdAt: 1, updatedAt: 1 });
      await put('notes', 'e4', { textId: 'cx', kind: 'passage', passage: 'a typed quotation', page: '5', links: [], createdAt: 1, updatedAt: 1 });
      await put('drafts', 'dc', { title: 'Roots and maps', items: [{ t: 'h', x: 'Thesis' }, { t: 'p', x: GUIDE + 'Say what you argue.' }, { t: 'p', x: 'Genealogy, I argue, works like a map.' },
        { t: 'note', id: 'e1' }, { t: 'note', id: 'e2' }, { t: 'note', id: 'e3' }, { t: 'note', id: 'e4' }], createdAt: 1, updatedAt: 1 });
    })()""")
    md = await page.evaluate("critiqueMarkdown('dc')")
    part = lambda a, b: md.split(a, 1)[1].split(b, 1)[0] if a in md else ""
    draft, ev, terms = part("## 1. The draft", "## 2."), part("## 2. The evidence", "## 3."), part("## 3. Glossary terms", "## 4.")
    check("### Thesis" in draft and "Genealogy, I argue" in draft and "Say what you argue" not in md, "the draft comes first, its guide lines left out")
    check("> the rhizome is alliance [E1]" in draft and "[E4]" in draft and "[E5]" not in md, "each quoted passage is marked in the draft")
    e = [ev.split(f"### E{k}.")[1].split("### E")[0] if f"### E{k}." in ev else "" for k in (1, 2, 3, 4)]
    check("Verbatim: selected in the book and still reads the same" in e[0] and "p. 10, chapter “On Roots”" in e[0] and "**the rhizome is alliance**" in e[0] and "Compare the burrow" in e[0],
          f"a selected passage is verbatim at its saved place, with page, chapter, context and follow-ups ({e[0][:300]!r})")
    check("Verbatim: found word for word" in e[1] and "p. 11" in e[1] and "the note gives p. 12" in e[1], f"a typed passage found in the text gets the book's page, and the note's own page where it disagrees ({e[1][:200]!r})")
    check("Not found" in e[2] and "Not checked" in e[3] and "p. 5 (as the note gives it)" in e[3], f"a passage not in the text, and one whose text isn't here, are flagged ({e[2][:120]!r} / {e[3][:160]!r})")
    check("**Genealogy**" in terms and "Rhizome" not in terms and "no evidence that a quoted passage uses the word" in md, f"terms come from the writer's own words only, with the warning ({terms[:200]!r})")
    check("## 4. Works cited" in md and "Plateaus" in part("## 4. Works cited", "\u0000"), "the works cited are listed")
    await page.evaluate("go({ screen: 'draft', draftId: 'dc' })"); await page.wait_for_timeout(300)
    await page.click("#d-export"); await page.wait_for_selector("#dx-crit")
    async with page.expect_download() as dl: await page.click("#dx-crit")
    name = (await dl.value).suggested_filename
    check(name.endswith("-for-critique.md"), f"Export offers the critique file ({name})")
    check(not errs, "no script errors in the critique export" + (f": {errs}" if errs else ""))
    await page.context.close()

async def main():
    sources()
    section_sources()
    article_frame()
    async with async_playwright() as p:
        browser = await p.chromium.launch()
        await truth_table(browser)
        await term_of_day(browser)
        await hear_it(browser)
        await anki(browser)
        await lineage(browser)
        await spread(browser)
        await fallacies(browser)
        await paths(browser)
        await custom_paths(browser)
        await margins(browser)
        await templates(browser)
        await puzzles(browser)
        await guess(browser)
        await connect(browser)
        await order(browser)
        await plates(browser)
        await more_puzzles(browser)
        await recon(browser)
        await quizsets(browser)
        await disputes(browser)
        await readqs(browser)
        await primers(browser)
        await branch_sources(browser)
        await mentions(browser)
        await critique_import(browser)
        await connections(browser)
        await close_reading(browser)
        await critique(browser)
        await browser.close()

server = subprocess.Popen([sys.executable, "-m", "http.server", str(PORT), "-d", str(ROOT)], stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
try:
    time.sleep(1); asyncio.run(main())
finally:
    server.terminate()
print(f"\n{len(failures)} failed" if failures else "\nall passed")
sys.exit(1 if failures else 0)
