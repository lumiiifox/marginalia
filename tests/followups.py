"""Follow-ups on notes and the earlier wordings of a note. Run after changes to notes, backup or restore:  python3 tests/followups.py

Made-up notes only, phone-sized touch screen. Checks that:
  1. Follow up on a note's card opens its sheet at the follow-up box; saving adds a dated follow-up and changes nothing else;
  2. the card shows follow-ups under your note, oldest first, with their dates;
  3. changing your note keeps what it said before (Earlier wording), unless you wrote it in the last half hour;
     an argument's earlier premises and conclusion are kept the same way;
  4. a follow-up or an earlier wording removed in the sheet is gone once you save, and stays if you cancel;
  5. search finds words in follow-ups and earlier wordings; a #tag in a follow-up collects the note, one in an earlier wording doesn't;
  6. the Markdown export has the follow-ups, dated;
  7. restore keeps the follow-ups and earlier wordings of both copies of a note, whichever copy wins;
     a backup with a malformed follow-up is refused;
  8. tapping a highlighted note in the reader opens the same sheet, with its follow-ups.
Needs: pip install playwright && playwright install chromium
"""
import asyncio, subprocess, sys, time
from playwright.async_api import async_playwright

PORT = 8808
URL = f"http://localhost:{PORT}/index.html"
READY = "typeof idb !== 'undefined' && idb && S.mode === 'ready'"
DAY = 86400000
SEED = """(DAY) => (async () => {
  const now = Date.now();
  const B = [{ k: 'pg', x: '1' }, { k: 'h', l: 1, x: 'Chapter 1', s: 'c1' }];
  for (let n = 0; n < 30; n++) B.push({ k: 'p', x: 'Paragraph ' + n + ' says that freedom is the recognition of necessity, more or less.' });
  await put('content', 'b1', B);
  await put('texts', 'b1', { title: 'A made-up book', author: 'Nobody', hasContent: true, total: B.length, pos: 0, sections: [{ id: 'c1', label: 'Chapter 1' }], createdAt: now - 9 * DAY, updatedAt: now - 9 * DAY });
  await put('notes', 'old', { textId: 'b1', kind: 'passage', passage: 'freedom is the recognition of necessity', gloss: 'First reading: Spinoza. #freedom', page: '1', sectionId: 'c1', at: 3,
    anchor: { a: 3, ao: 14, b: 3, bo: 53, pre: '3 says that ', suf: ', more or less.' }, createdAt: now - 9 * DAY, updatedAt: now - 9 * DAY });
  await put('notes', 'fresh', { textId: 'b1', kind: 'passage', passage: 'Paragraph 5', gloss: 'Just wrote this', page: '1', sectionId: 'c1', at: 7, createdAt: now - 60000, updatedAt: now - 60000 });
  await put('notes', 'arg', { textId: 'b1', kind: 'argument', premises: ['Every cause is necessary.', 'Freedom is uncaused.'], conclusion: 'Nothing is free.', gloss: '', page: '1', sectionId: 'c1', createdAt: now - 3 * DAY, updatedAt: now - 3 * DAY });
})()"""

failures = []
def check(ok, what):
    print(("ok   " if ok else "FAIL ") + what)
    if not ok: failures.append(what)

async def main():
    async with async_playwright() as p:
        browser = await p.chromium.launch()
        ctx = await browser.new_context(viewport={"width": 412, "height": 915}, device_scale_factor=2.625, is_mobile=True, has_touch=True, accept_downloads=True)
        page = await ctx.new_page(); errs = []
        page.on("pageerror", lambda e: errs.append(str(e)))
        page.on("console", lambda m: m.type == "error" and "Failed to load resource" not in m.text and errs.append(m.text))
        await page.route("https://commons.wikimedia.org/**", lambda r: r.abort())
        await page.goto(URL); await page.wait_for_function(READY)
        await page.evaluate(SEED, DAY)
        note = lambda nid: page.evaluate(f"JSON.parse(JSON.stringify(S.notes.get('{nid}')))")

        # 1 Follow up from the card
        await page.evaluate("go({ screen: 'text', textId: 'b1' })"); await page.wait_for_timeout(300)
        await page.click("[data-nid='old'] [data-followup]"); await page.wait_for_selector("#n-fu")
        check(await page.evaluate("document.activeElement && document.activeElement.id === 'n-fu'"), "Follow up opens the note's sheet with the follow-up box ready")
        before = await note("old")
        await page.fill("#n-fu", "After Hume: necessity is a habit of mind, so this needs rethinking."); await page.click("button[type=submit]"); await page.wait_for_timeout(400)
        after = await note("old")
        fu = after.get("followups") or []
        same = {k: v for k, v in after.items() if k not in ("followups", "updatedAt")} == {k: v for k, v in before.items() if k != "updatedAt"}
        check(len(fu) == 1 and fu[0]["x"].startswith("After Hume") and abs(fu[0]["at"] - await page.evaluate("Date.now()")) < 60000 and fu[0]["id"],
              f"saving adds one follow-up, dated now ({fu})")
        check(same and not after.get("was"), "...and leaves the note's passage, words, anchor and place as they were")
        # a second one
        await page.click("[data-nid='old'] [data-followup]"); await page.wait_for_selector("#n-fu")
        await page.fill("#n-fu", "Reconsidered: Kant's spontaneity."); await page.click("button[type=submit]"); await page.wait_for_timeout(400)

        # 2 the card
        card = await page.inner_text("[data-nid='old']")
        check(card.index("First reading") < card.index("After Hume") < card.index("Reconsidered") and card.count("Follow-up, ") == 2,
              f"the card shows the follow-ups under the note, oldest first, dated ({card[:300]!r})")

        # 3 changing your note keeps the earlier wording (written 9 days ago), not for one written a minute ago
        await page.click("[data-nid='old'] [data-editnote]"); await page.wait_for_selector("#n-gloss")
        await page.fill("#n-gloss", "Second reading: Spinoza, against Kant. #freedom"); await page.click("button[type=submit]"); await page.wait_for_timeout(400)
        n = await note("old")
        was = n.get("was") or []
        check(n["gloss"].startswith("Second reading") and len(was) == 1 and was[0]["gloss"] == "First reading: Spinoza. #freedom" and was[0]["at"] < await page.evaluate("Date.now()") - 8 * 86400000,
              f"changing your note keeps what it said before, with the date it was written ({was})")
        check(len(n.get("followups") or []) == 2, "...and keeps its follow-ups")
        await page.click("[data-nid='old'] [data-editnote]"); await page.wait_for_selector("#n-gloss")
        await page.fill("#n-gloss", "Second reading: Spinoza, against Kant (fixed a typo). #freedom"); await page.click("button[type=submit]"); await page.wait_for_timeout(400)
        check(len((await note("old")).get("was") or []) == 1, "changing it again within half an hour keeps no extra wording")
        await page.click("[data-nid='fresh'] [data-editnote]"); await page.wait_for_selector("#n-gloss")
        await page.fill("#n-gloss", "Just wrote this, corrected"); await page.click("button[type=submit]"); await page.wait_for_timeout(400)
        check(not (await note("fresh")).get("was"), "a note written a minute ago is simply corrected")
        await page.click("[data-nid='arg'] [data-editnote]"); await page.wait_for_selector("#n-conc")
        await page.fill("#n-conc", "Freedom is a kind of necessity."); await page.click("button[type=submit]"); await page.wait_for_timeout(400)
        w = (await note("arg")).get("was") or []
        check(len(w) == 1 and w[0].get("conclusion") == "Nothing is free." and w[0].get("premises") == ["Every cause is necessary.", "Freedom is uncaused."],
              f"an argument's earlier premises and conclusion are kept ({w})")
        card = await page.inner_text("[data-nid='old']")
        check("Earlier wording" in card, "the card offers the earlier wording, folded")

        # 4 removing in the sheet: cancel keeps, save removes
        await page.click("[data-nid='old'] [data-editnote]"); await page.wait_for_selector("#n-fus [data-unfu]")
        await page.click("#n-fus [data-unfu] >> nth=0"); await page.click("#cancel"); await page.wait_for_timeout(300)
        check(len((await note("old")).get("followups") or []) == 2, "removing a follow-up and cancelling keeps it")
        await page.click("[data-nid='old'] [data-editnote]"); await page.wait_for_selector("#n-fus [data-unfu]")
        await page.click("#n-fus [data-unfu] >> nth=0")
        await page.click("#n-was summary"); await page.click("#n-was [data-unwas] >> nth=0")
        await page.click("button[type=submit]"); await page.wait_for_timeout(400)
        n = await note("old")
        check([f["x"][:12] for f in n.get("followups") or []] == ["Reconsidered"] and not n.get("was"), f"removed ones are gone once you save ({n.get('followups')}, {n.get('was')})")
        # put an earlier wording back for the next checks
        await page.evaluate("(DAY) => put('notes', 'old', { ...S.notes.get('old'), was: [{ at: Date.now() - 9 * DAY, gloss: 'First reading: Spinoza. #determinism' }] })", DAY)

        # 5 search and tags
        await page.evaluate("go({ screen: 'text', textId: 'b1' }); S.tq = 'spontaneity'; render()"); await page.wait_for_timeout(300)
        ids = await page.evaluate("[...document.querySelectorAll('#main .note')].map((e) => e.dataset.nid)")
        check(ids == ["old"], f"the book's note search finds words in a follow-up ({ids})")
        await page.evaluate("S.tq = 'first reading'; render()"); await page.wait_for_timeout(200)
        ids = await page.evaluate("[...document.querySelectorAll('#main .note')].map((e) => e.dataset.nid)")
        check(ids == ["old"], f"...and in an earlier wording ({ids})")
        await page.evaluate("S.tq = ''")
        await page.evaluate("(async () => { const n = S.notes.get('old'); await put('notes', 'old', { ...n, followups: [...n.followups, { id: 'fx', at: Date.now(), x: 'Compare #spontaneity in Kant.' }] }); })()")
        tags = await page.evaluate("[tagsOf(S.notes.get('old')).includes('spontaneity'), tagsOf(S.notes.get('old')).includes('determinism')]")
        check(tags == [True, False], f"a #tag in a follow-up collects the note; one in an earlier wording doesn't ({tags})")

        # 6 export
        md = await page.evaluate("notesMarkdown('b1')")
        check("*Follow-up, " in md and "Reconsidered: Kant" in md and md.index("Second reading") < md.index("Reconsidered"), "the Markdown export has the follow-ups, dated, after your note")

        # 7 restore: both copies' follow-ups are kept
        data = await page.evaluate("""(async () => { const notes = Object.fromEntries(S.notes); return JSON.parse(JSON.stringify({ app: 'marginalia', version: 5, texts: Object.fromEntries(S.texts), notes })); })()""")
        data["notes"]["old"]["followups"].append({"id": "fromphone", "at": 1700000000000, "x": "Written on the phone."})
        data["notes"]["old"]["updatedAt"] = 1  # the backup's copy is older: this device's copy wins
        await page.evaluate("(async () => { const n = S.notes.get('old'); await put('notes', 'old', { ...n, gloss: n.gloss + ' Edited here.', updatedAt: Date.now() }); })()")
        await page.evaluate("(d) => applyRestore(planRestore(d), false)", data); await page.wait_for_timeout(300)
        n = await note("old")
        xs = [f["x"] for f in n["followups"]]
        check("Written on the phone." in xs and len(xs) == 3 and xs[0] == "Written on the phone." and n["gloss"].endswith("Edited here."),
              f"restoring keeps this device's newer note and adds the backup's follow-up, in date order ({xs})")
        data["notes"]["old"]["updatedAt"] = 9e12; data["notes"]["old"]["followups"] = [{"id": "only-in-backup", "at": 1, "x": "Old one."}]; data["notes"]["old"].pop("was", None)
        await page.evaluate("(d) => applyRestore(planRestore(d), false)", data); await page.wait_for_timeout(300)
        n = await note("old")
        check(len(n["followups"]) == 4 and n.get("was"), f"when the backup's copy wins, this device's follow-ups and earlier wordings stay ({len(n['followups'])}, {bool(n.get('was'))})")
        bad = {"app": "marginalia", "version": 5, "texts": {}, "notes": {"z": {"textId": "b1", "kind": "passage", "followups": [{"id": "q", "at": "<img>", "x": "x"}]}}}
        check(await page.evaluate("(d) => planRestore(d).skipped", bad) == 1, "a backup with a malformed follow-up is refused")

        # 8 the reader
        await page.evaluate("go({ screen: 'reader', textId: 'b1', at: 3 })"); await page.wait_for_selector("#book mark[data-note='old']"); await page.wait_for_timeout(500)
        await page.evaluate("document.querySelector(\"#book mark[data-note='old']\").click()"); await page.wait_for_selector("#n-fu")
        sheet = await page.inner_text("#sheetroot")
        check("Reconsidered" in sheet and "Follow up" in sheet, "tapping a highlighted note in the reader opens its sheet, with its follow-ups")
        await page.fill("#n-fu", "Added while reading."); await page.click("button[type=submit]"); await page.wait_for_timeout(400)
        check((await note("old"))["followups"][-1]["x"] == "Added while reading." and await page.evaluate("S.screen") == "reader", "a follow-up added while reading is saved, and you stay in the book")
        check(not errs, "no script errors" + (f": {errs}" if errs else ""))
        await browser.close()

server = subprocess.Popen([sys.executable, "-m", "http.server", str(PORT), "-d", str(__import__('pathlib').Path(__file__).resolve().parent.parent)], stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
try:
    time.sleep(1); asyncio.run(main())
finally:
    server.terminate()
print(f"\n{len(failures)} failed" if failures else "\nall passed")
sys.exit(1 if failures else 0)
