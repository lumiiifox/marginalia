"""Typing in a search box while its results are drawn again. Run:  python3 tests/search_box.py

Synthetic data only. Checks that, in each of the five search boxes (home, a book's notes, glossary, thinkers, the reference list):
  1. correcting a word in the middle and pausing leaves the cursor where you typed, so the next letters go there too;
  2. the box stays the same element while the results change, so the phone keyboard keeps its place;
  3. a word the keyboard is still composing (Android's suggestions) survives a redraw and commits as typed;
  4. a save landing while you type (any redraw) keeps the box and the cursor;
  5. tapping away before the results are drawn doesn't pull the cursor back into the box;
  6. a long list of matching notes shows the newest 12, then all of them on request.
"""
import os, asyncio, subprocess, sys, time
from pathlib import Path
from playwright.async_api import async_playwright

ROOT = Path(__file__).resolve().parent.parent
PORT = int(os.environ.get("MG_PORT", 8831))
URL = f"http://localhost:{PORT}/index.html"
failures = []


def check(ok, msg):
    print(("ok   " if ok else "FAIL ") + msg)
    if not ok: failures.append(msg)


SEED = """async () => {
  const now = Date.now();
  await put("texts", "t1", { title: "Test Book", author: "Author, Test", sections: [], pos: 0, createdAt: now, updatedAt: now });
  await put("notes", "n1", { textId: "t1", kind: "passage", passage: "substance and its modes", gloss: "on substance", page: "3", links: [], createdAt: now, updatedAt: now });
}"""
# where each box lives, and a word with a letter missing in the middle (the cursor goes back to put it in)
BOXES = [("q", "go({ screen: 'library' })"), ("tq", "go({ screen: 'text', textId: 't1' })"), ("gq", "go({ screen: 'glossary' })"),
         ("pq", "go({ screen: 'thinkers' })"), ("rq", "go({ screen: 'reference' })")]


async def main():
    async with async_playwright() as p:
        browser = await p.chromium.launch()
        ctx = await browser.new_context(bypass_csp=True, viewport={"width": 390, "height": 844}, service_workers="block")
        await ctx.route("**/*", lambda r: r.continue_() if r.request.url.startswith(f"http://localhost:{PORT}") else r.abort())
        page = await ctx.new_page(); errs = []
        page.on("pageerror", lambda e: errs.append(str(e)))
        await page.goto(URL); await page.wait_for_function("S.mode === 'ready'")
        await page.evaluate(SEED)
        cdp = await ctx.new_cdp_session(page)
        for box, there in BOXES:
            await page.evaluate(there); await page.wait_for_timeout(100)
            sel = f"#{box}"
            await page.click(sel); await page.keyboard.type("substnce"); await page.wait_for_timeout(350)
            await page.evaluate(f"window.__box = document.querySelector('{sel}'); window.__box.setSelectionRange(5, 5)")
            await page.keyboard.type("a"); await page.wait_for_timeout(350)  # the results are drawn again here
            await page.keyboard.type("n"); await page.wait_for_timeout(350)
            st = await page.evaluate(f"(() => {{ const b = document.querySelector('{sel}'); return [b.value, b.selectionStart, b === window.__box, document.activeElement === b]; }})()")
            check(st[0] == "substannce" and st[1] == 7, f"{box}: after a pause the cursor stays where you typed ({st[:2]})")
            check(st[2] and st[3], f"{box}: the box stays the same element, still focused, while its results change")
            # a save while typing redraws the screen
            await page.evaluate(f"document.querySelector('{sel}').setSelectionRange(3, 3)")
            await page.evaluate("put('notes', 'n2', { textId: 't1', kind: 'gloss', gloss: 'later', links: [], createdAt: Date.now(), updatedAt: Date.now() })")
            await page.wait_for_timeout(100)
            st = await page.evaluate(f"(() => {{ const b = document.querySelector('{sel}'); return [b === window.__box, b.selectionStart, document.activeElement === b]; }})()")
            check(st == [True, 3, True], f"{box}: a save landing while you type keeps the box and the cursor ({st})")
            await page.evaluate("del('notes', 'n2')")
            await page.fill(sel, ""); await page.wait_for_timeout(300)

        # a word the keyboard is still composing survives a redraw
        await page.evaluate("go({ screen: 'library' })"); await page.wait_for_timeout(100)
        await page.click("#q"); await page.evaluate("window.__box = document.querySelector('#q')")
        await cdp.send("Input.imeSetComposition", {"text": "subst", "selectionStart": 5, "selectionEnd": 5})
        await page.wait_for_timeout(350)
        await page.evaluate("render()")
        await cdp.send("Input.imeSetComposition", {"text": "substance", "selectionStart": 9, "selectionEnd": 9})
        await cdp.send("Input.insertText", {"text": "substance"})
        await page.wait_for_timeout(350)
        st = await page.evaluate("[document.querySelector('#q').value, document.querySelector('#q') === window.__box, S.q]")
        check(st == ["substance", True, "substance"], f"a word the keyboard is composing survives a redraw and commits as typed ({st})")
        check(await page.locator(".noteslist .note").count() >= 1, "the results are drawn for what was typed")

        # tapping away before the results are drawn leaves the cursor where you tapped
        await page.fill("#q", ""); await page.wait_for_timeout(300)
        await page.click("#q"); await page.keyboard.type("mode")
        await page.evaluate("document.activeElement.blur()"); await page.wait_for_timeout(350)
        check(await page.evaluate("document.activeElement !== document.querySelector('#q')"), "tapping away before the results are drawn doesn't pull the cursor back")

        # a long result list shows the newest 12 notes, then the rest on request; a new search starts short again
        await page.evaluate("""(async () => { const now = Date.now(); for (let i = 0; i < 14; i++) await put('notes', 'm' + i, { textId: 't1', kind: 'gloss', gloss: 'attribute number ' + i, links: [], createdAt: now + i, updatedAt: now }); })()""")
        await page.fill("#q", "attribute"); await page.wait_for_timeout(400)
        st = await page.evaluate("[document.querySelectorAll('.noteslist .note').length, !!document.querySelector('#allhits'), document.querySelector('.noteslist .note').dataset.nid]")
        check(st == [12, True, "m13"], f"a long result list shows its newest 12 notes and a button for the rest ({st})")
        await page.click("#allhits"); await page.wait_for_timeout(200)
        st = await page.evaluate("[document.querySelectorAll('.noteslist .note').length, !!document.querySelector('#allhits')]")
        check(st == [14, False], f"Show all shows every match ({st})")
        await page.fill("#q", "attribute number"); await page.wait_for_timeout(400)
        check(await page.evaluate("document.querySelectorAll('.noteslist .note').length") == 12, "a new search starts with 12 again")
        check(not errs, f"no script errors ({errs[:2]})")
        await browser.close()


server = subprocess.Popen([sys.executable, "-m", "http.server", str(PORT), "-d", str(ROOT)], stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
try:
    time.sleep(0.8)
    asyncio.run(main())
finally:
    server.terminate()
print("\n" + ("all passed" if not failures else f"{len(failures)} failed"))
sys.exit(1 if failures else 0)
