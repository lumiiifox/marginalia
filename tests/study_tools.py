"""Study tools around the reference sections. Run after changes to them:  python3 tests/study_tools.py

Uses made-up records only. Checks that:
  1. the truth table: opened from Logic and from Validity; modus ponens is valid with its rows marked, affirming the consequent
     invalid with exactly its one counterexample; typed ASCII (~ & | -> <->, "v", words) reads the same as the symbols; brackets
     and the order of binding come out right; mistakes get a plain message; an inconsistent set of premises and a tautology are
     explained; more than six letters is refused; the symbol keys type into the field you were in; nothing is stored;
     the table scrolls inside its frame instead of the page at phone width.
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

async def main():
    async with async_playwright() as p:
        browser = await p.chromium.launch()
        await truth_table(browser)
        await browser.close()

server = subprocess.Popen([sys.executable, "-m", "http.server", str(PORT), "-d", str(ROOT)], stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
try:
    time.sleep(1); asyncio.run(main())
finally:
    server.terminate()
print(f"\n{len(failures)} failed" if failures else "\nall passed")
sys.exit(1 if failures else 0)
