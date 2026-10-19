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

async def main():
    async with async_playwright() as p:
        browser = await p.chromium.launch()
        await truth_table(browser)
        await term_of_day(browser)
        await hear_it(browser)
        await anki(browser)
        await browser.close()

server = subprocess.Popen([sys.executable, "-m", "http.server", str(PORT), "-d", str(ROOT)], stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
try:
    time.sleep(1); asyncio.run(main())
finally:
    server.terminate()
print(f"\n{len(failures)} failed" if failures else "\nall passed")
sys.exit(1 if failures else 0)
