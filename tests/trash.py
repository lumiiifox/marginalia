"""Recently deleted keeps what you delete for 30 days. Run after changes to storage or deleting:  python3 tests/trash.py

Made-up records only, phone-sized screen. Checks that:
  1. a library saved by the previous storage version (7) opens in version 10 with everything in it;
  2. deleting a book moves it, its notes, text, cover and PDF to Recently deleted in one entry, and Undo puts them all back;
  3. deleting a note, a draft or a comparison files it there too; Restore puts each back;
  4. a note whose book was deleted after it can't be restored until the book is;
  5. Delete now and Empty remove entries for good; entries older than 30 days are cleared when the app opens;
  6. backups leave Recently deleted out, and the home screen links to it only when something is there;
  7. restoring never writes over a record that came back another way (a backup), and puts back only what is missing;
  8. opening the app reads only the list of summaries, never the deleted records;
  9. with no room to keep a copy, nothing is deleted until you choose Delete permanently and confirm it.
Needs: pip install playwright && playwright install chromium
"""
import asyncio, subprocess, sys, time
from pathlib import Path
from playwright.async_api import async_playwright

ROOT = Path(__file__).resolve().parent.parent
PORT = 8811
URL = f"http://localhost:{PORT}/index.html"
READY = "typeof idb !== 'undefined' && idb && S.mode === 'ready'"

failures = []
def check(ok, what):
    print(("ok   " if ok else "FAIL ") + what)
    if not ok: failures.append(what)

OLD_LIBRARY = """() => new Promise((res, rej) => { const r = indexedDB.open('marginalia', 7);
  r.onupgradeneeded = () => { const d = r.result; ['texts', 'notes', 'content', 'covers', 'terms', 'drafts', 'compares', 'files'].forEach((n) => d.createObjectStore(n)); };
  r.onsuccess = () => { const d = r.result, t = d.transaction(['texts', 'notes', 'content', 'covers', 'files'], 'readwrite');
    t.objectStore('texts').put({ title: 'Ethics', author: 'Spinoza', hasContent: true, status: 'reading', createdAt: 1, updatedAt: 1, sections: [] }, 'e');
    t.objectStore('content').put([{ k: 'p', x: 'Each thing strives to persevere in its being.' }], 'e');
    t.objectStore('covers').put(new Blob(['cover'], { type: 'image/png' }), 'e');
    t.objectStore('files').put(new Blob(['%PDF-1.4'], { type: 'application/pdf' }), 'e');
    t.objectStore('notes').put({ textId: 'e', kind: 'passage', passage: 'Each thing strives', gloss: 'conatus', page: '3', createdAt: 2 }, 'n1');
    t.objectStore('notes').put({ textId: 'e', kind: 'gloss', gloss: 'second note', page: '4', createdAt: 3 }, 'n2');
    t.oncomplete = () => { d.close(); res(); }; t.onerror = () => rej(t.error); };
  r.onerror = () => rej(r.error); })"""

async def main():
    async with async_playwright() as p:
        browser = await p.chromium.launch()
        ctx = await browser.new_context(viewport={"width": 390, "height": 820}, has_touch=True)
        await ctx.route("**/*", lambda r: r.abort() if "localhost" not in r.request.url else r.continue_())
        page = await ctx.new_page()
        errs = []
        page.on("pageerror", lambda e: errs.append(str(e)))
        await page.goto(f"http://localhost:{PORT}/sw.js") # same origin, without the app opening storage first
        await page.evaluate(OLD_LIBRARY)
        await page.goto(URL); await page.wait_for_function(READY)

        # 1 upgrade
        up = await page.evaluate("[idb.version, ['trash', 'trashlist'].every((n) => [...idb.objectStoreNames].includes(n)), S.texts.has('e'), S.notes.size, S.trash.size]")
        check(up == [10, True, True, 2, 0], f"a version 7 library opens in version 10 with its book and notes ({up})")
        check(await page.query_selector("#opentrash") is None, "with nothing deleted, the home screen shows no Recently deleted link")

        # 2 a book
        await page.evaluate("confirmDelete('e')"); await page.wait_for_timeout(200)
        hint = await page.evaluate("document.querySelector('#sheetroot .hint').textContent")
        check("Recently deleted" in hint and "2 notes" in hint, f"the confirmation says where the book goes ({hint})")
        await page.click("#m-delete-yes"); await page.wait_for_timeout(400)
        gone = await page.evaluate("""(async () => [S.texts.has('e'), S.notes.size, !!(await idbGet('content', 'e')), !!(await idbGet('covers', 'e')), !!(await idbGet('files', 'e')), S.trash.size,
          (await idbAll('trash')).values().next().value.items.map((x) => x[0]).sort().join(','), document.querySelector('#toast .toastbtn')?.textContent])()""")
        check(gone == [False, 0, False, False, False, 1, "content,covers,files,notes,notes,texts", "Undo"],
              f"deleting a book removes it with its notes, text, cover and PDF, keeps them as one entry, and offers Undo ({gone})")
        await page.click("#toast .toastbtn"); await page.wait_for_timeout(400)
        back = await page.evaluate("""(async () => [S.texts.has('e'), S.notes.size, (await idbGet('content', 'e'))[0].x, (await idbGet('files', 'e')).size, S.trash.size, (await idbAll('trash')).size])()""")
        check(back == [True, 2, "Each thing strives to persevere in its being.", 8, 0, 0], f"Undo puts the book, its notes, text and PDF back and empties the entry ({back})")

        # 3 a note, a draft, a comparison
        await page.evaluate("""(async () => {
          await put('drafts', 'd1', { title: 'Essay on conatus', items: [{ t: 'note', id: 'n1' }], createdAt: 1, updatedAt: 1 });
          await put('compares', 'c1', { title: 'Spinoza and Hobbes', cols: [], rows: [], cells: {}, createdAt: 1, updatedAt: 1 });
          await trashAndRemove('note', 'Ethics', [['notes', 'n2', S.notes.get('n2')]]);
          await trashAndRemove('draft', 'Essay on conatus', [['drafts', 'd1', S.drafts.get('d1')]]);
          await trashAndRemove('comparison', 'Spinoza and Hobbes', [['compares', 'c1', S.compares.get('c1')]]);
          render(); })()""")
        await page.evaluate("go({ screen: 'library' })"); await page.wait_for_timeout(200)
        link = await page.evaluate("document.querySelector('#opentrash')?.textContent")
        check(link == "Recently deleted (3)", f"the home screen links to Recently deleted with a count ({link})")
        await page.click("#opentrash"); await page.wait_for_timeout(300)
        rows = await page.evaluate("[...document.querySelectorAll('.trashrow b')].map((b) => b.textContent)")
        check(sorted(rows) == sorted(["A note in “Ethics”", "Draft “Essay on conatus”", "Comparison “Spinoza and Hobbes”"]), f"each deleted thing is listed by what it was ({rows})")
        left = await page.evaluate("document.querySelector('.trashrow').textContent")
        check("30 days left" in left, "each shows how long it will be kept")
        await page.evaluate("(async () => { for (const [id, e] of [...S.trash]) if (e.kind !== 'note') await restoreTrash(id); })()"); await page.wait_for_timeout(200)
        check(await page.evaluate("[S.drafts.has('d1'), S.compares.has('c1'), S.trash.size]") == [True, True, 1], "Restore brings back a draft and a comparison")

        # 4 a note whose book went after it
        await page.evaluate("(async () => { await deleteText('e'); render(); })()"); await page.wait_for_timeout(200)
        noteId = await page.evaluate("[...S.trash].find(([, e]) => e.kind === 'note')[0]")
        ok = await page.evaluate(f"restoreTrash('{noteId}')"); await page.wait_for_timeout(200)
        msg = await page.evaluate("document.querySelector('#toast').textContent")
        check(ok is False and "Restore the book first" in msg and not await page.evaluate("S.notes.has('n2')"), f"a note can't come back before its book ({msg})")
        bookId = await page.evaluate("[...S.trash].find(([, e]) => e.kind === 'text')[0]")
        await page.evaluate(f"restoreTrash('{bookId}')"); await page.evaluate(f"restoreTrash('{noteId}')"); await page.wait_for_timeout(200)
        check(await page.evaluate("[S.texts.has('e'), S.notes.has('n1'), S.notes.has('n2'), S.trash.size]") == [True, True, True, 0], "once the book is back, so can its note be")

        # 5 for good, and after 30 days
        await page.evaluate("(async () => { await trashAndRemove('note', 'Ethics', [['notes', 'n2', S.notes.get('n2')]]); await trashAndRemove('draft', 'Essay', [['drafts', 'd1', S.drafts.get('d1')]]); render(); })()")
        await page.evaluate("go({ screen: 'trash' })"); await page.wait_for_timeout(200)
        b = page.locator("[data-purge]").first
        await b.click(); await b.click(); await page.wait_for_timeout(300)
        check(await page.evaluate("(async () => [S.trash.size, (await idbAll('trash')).size])()") == [1, 1], "Delete now, tapped twice, removes one entry for good")
        await page.evaluate("purgeTrash([...S.trash.keys()])"); await page.wait_for_timeout(200)
        check(await page.evaluate("(async () => (await idbAll('trash')).size)()") == 0, "Empty clears everything left")
        await page.evaluate("""(async () => { await trashAndRemove('draft', 'Old', [['drafts', 'd9', { title: 'Old', items: [], createdAt: 1, updatedAt: 1 }]]);
          const all = await idbAll('trashlist'); for (const [k, e] of all) { e.at = Date.now() - 31 * 86400000; await idbDo('trashlist', (st) => st.put(e, k)); }
          await trashAndRemove('draft', 'Recent', [['drafts', 'd8', { title: 'Recent', items: [], createdAt: 1, updatedAt: 1 }]]); })()""")
        await page.reload(); await page.wait_for_function(READY)
        kept = await page.evaluate("(async () => [[...(await idbAll('trash')).values()].map((e) => e.title), [...(await idbAll('trashlist')).values()].map((e) => e.title)])()")
        check(kept == [["Recent"], ["Recent"]], f"entries older than 30 days are cleared from both stores when the app opens ({kept})")

        # the buttons themselves: a note's Delete note, a draft's and a comparison's menus
        await page.evaluate("""(async () => { await put('notes', 'n7', { textId: 'e', kind: 'gloss', gloss: 'to be deleted by hand', page: '9', createdAt: 9 });
          await put('drafts', 'd7', { title: 'Hand draft', items: [], createdAt: 1, updatedAt: 1 });
          await put('compares', 'c7', { title: 'Hand comparison', cols: [], rows: [], cells: {}, createdAt: 1, updatedAt: 1 }); go({ screen: 'library' }); })()""")
        await page.evaluate("noteSheet('n7')"); await page.wait_for_selector("#n-del")
        await page.click("#n-del"); await page.click("#n-del"); await page.wait_for_timeout(500)
        await page.evaluate("draftMore('d7')"); await page.click("#dm-delete"); await page.click("#dm-delete-yes"); await page.wait_for_timeout(500)
        await page.evaluate("cmpMore('c7')"); await page.click("#cm-delete"); await page.click("#cm-delete-yes"); await page.wait_for_timeout(500)
        hand = await page.evaluate("[S.notes.has('n7'), S.drafts.has('d7'), S.compares.has('c7'), [...S.trash.values()].map((e) => e.kind + ':' + (e.snip || e.title)).sort()]")
        check(hand[:3] == [False, False, False] and hand[3] == sorted(["comparison:Hand comparison", "draft:Hand draft", "draft:Recent", "note:to be deleted by hand"]),
              f"Delete note and the draft and comparison menus move them to Recently deleted ({hand})")

        # 7 a book back from a backup, then edited, then its old entry restored
        r7 = await page.evaluate("""(async () => {
          await purgeTrash([...S.trash.keys()]);
          await put('notes', 'n2', { textId: 'e', kind: 'gloss', gloss: 'second note', page: '4', createdAt: 3 });
          const before = { t: S.texts.get('e'), n1: S.notes.get('n1'), n2: S.notes.get('n2') };
          const tid = await deleteText('e');
          await put('texts', 'e', { ...before.t, title: 'Ethics (from backup)' });
          await put('notes', 'n1', { ...before.n1, gloss: 'edited after the backup', updatedAt: Date.now() });
          await restoreTrash(tid);
          return [S.texts.get('e').title, S.notes.get('n1').gloss, (await idbGet('notes', 'n1')).gloss, S.notes.has('n2'), !!(await idbGet('content', 'e')),
            (await idbAll('trash')).size, (await idbAll('trashlist')).size, document.querySelector('#toast').textContent]; })()""")
        check(r7[:7] == ["Ethics (from backup)", "edited after the backup", "edited after the backup", True, True, 0, 0] and "left as" in r7[7],
              f"restoring an old entry keeps the book and note that came back from a backup, with their edits, and puts back only the missing note and text ({r7})")

        # 8 opening reads only the summaries
        r8 = await page.evaluate("""(async () => {
          await trashAndRemove('draft', 'Read check', [['drafts', 'd6', { title: 'Read check', items: [], createdAt: 1, updatedAt: 1 }]]);
          const seen = [], orig = idbAll; idbAll = (st) => { seen.push(st); return orig(st); };
          await loadTrash(); idbAll = orig;
          return [seen, [...S.trash.values()].some((e) => e.title === 'Read check')]; })()""")
        check(r8 == [["trashlist"], True], f"opening the app reads only the summaries, not the deleted records ({r8})")

        # 9 no room: nothing goes until you choose to delete for good
        await page.evaluate("""(async () => { await put('notes', 'n8', { textId: 'e', kind: 'gloss', gloss: 'no room for me', page: '1', createdAt: 1 });
          window.__idbTx = idbTx; idbTx = (stores, fn) => stores.includes('trash') ? Promise.reject(new DOMException('full', 'QuotaExceededError')) : __idbTx(stores, fn); })()""")
        n0 = await page.evaluate("S.trash.size")
        await page.evaluate("noteSheet('n8')"); await page.wait_for_selector("#n-del")
        await page.click("#n-del"); await page.click("#n-del"); await page.wait_for_timeout(500)
        r9 = await page.evaluate("""(async () => [S.notes.has('n8'), !!(await idbGet('notes', 'n8')), document.querySelector('#sheetroot h2')?.textContent, document.querySelector('#sheetroot .hint')?.textContent || '',
          !!document.querySelector('#nr-keep'), !!document.querySelector('#nr-trash'), !!document.querySelector('#nr-final')])()""")
        check(r9[0] and r9[1] and r9[2] == "No room to keep it" and "Nothing has been deleted" in r9[3] and all(r9[4:7]),
              f"with no room for a copy, the note is kept and you're offered Cancel, Recently deleted, or deleting for good ({r9})")
        await page.click("#nr-keep"); await page.wait_for_timeout(300)
        check(await page.evaluate("(async () => [S.notes.has('n8'), !!(await idbGet('notes', 'n8')), !!document.querySelector('#sheetroot .sheet')])()") == [True, True, False], "Cancel keeps it and closes the question")
        await page.evaluate("confirmDelete('e')"); await page.click("#m-delete-yes"); await page.wait_for_timeout(500)
        kept_book = await page.evaluate("(async () => [S.texts.has('e'), !!(await idbGet('content', 'e')), !!(await idbGet('files', 'e')), S.notes.has('n1'), document.querySelector('#sheetroot h2')?.textContent, document.querySelector('#toast').hidden || !/Couldn|Deleted/.test(document.querySelector('#toast').textContent)])()")
        check(kept_book == [True, True, True, True, "No room to keep it", True], f"a book is kept whole too, with its text, PDF and notes, and no other message ({kept_book})")
        await page.click("#nr-final"); await page.wait_for_timeout(200)
        check(await page.evaluate("S.texts.has('e')"), "one tap on Delete permanently only asks again")
        await page.click("#nr-final"); await page.wait_for_timeout(500)
        gone9 = await page.evaluate("(async () => [S.texts.has('e'), !!(await idbGet('content', 'e')), !!(await idbGet('files', 'e')), S.notes.has('n1'), S.trash.size, document.querySelector('#toast').textContent])()")
        check(gone9 == [False, False, False, False, n0, "Deleted for good."], f"tapped again, it is deleted for good, with nothing added to Recently deleted ({gone9})")
        await page.evaluate("void (idbTx = __idbTx)") # void: a function result would be called
        full = await page.evaluate("failMsg(new DOMException('full', 'QuotaExceededError'))")
        check("Empty Recently deleted" in full and "Delete a text" not in full, f"the out-of-space message points to Recently deleted ({full})")

        # 6 backups
        bk = await page.evaluate("""(async () => { let out; const orig = saveFile; saveFile = async (n, t) => { out = JSON.parse(t); return true; }; await exportBackup(); saveFile = orig; return Object.keys(out); })()""")
        check("trash" not in bk, "backups leave Recently deleted out")

        check(not errs, "no script errors" + (f": {errs}" if errs else ""))
        await browser.close()

server = subprocess.Popen([sys.executable, "-m", "http.server", str(PORT), "-d", str(ROOT)], stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
try:
    time.sleep(1); asyncio.run(main())
finally:
    server.terminate()
print(f"\n{len(failures)} failed" if failures else "\nall passed")
sys.exit(1 if failures else 0)
