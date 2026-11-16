"""Page links and disputes in glossary entries read in the books. Run after changes to pageLinks, disputesHTML, TERM_PAGES or
TERM_DISPUTES, or to the text of an entry they cover:  python3 tests/page_links.py

Made-up books only, phone-sized touch screen. Checks that:
  1. every entry in TERM_PAGES has one book (or null) for each bare "(p. …)" or "(pp. …)" in its text, and names only known books;
     every entry in TERM_DISPUTES is a built-in entry with at least one dispute;
  2. with no matching book in the library, an entry's page references stay plain text;
  3. with a book whose title names A Thousand Plateaus, exactly that book's references in Deterritorialization become links, the
     Anti-Oedipus and What Is Philosophy? ones stay text, and the visible text of the entry is unchanged;
  4. tapping "(p. 56)" opens the reader at the block where printed page 56 starts; a page the copy lacks opens the book with a note;
  5. a book whose text isn't loaded, or whose title names another book, gets no links;
  6. Plane of immanence shows "Where readers disagree" with its four disputes, and Assemblage, which has none, shows no such box;
  7. an entry you edited shows neither links nor disputes.
Needs: pip install playwright && playwright install chromium
"""
import os
import asyncio, subprocess, sys, time
from pathlib import Path
from playwright.async_api import async_playwright

PORT = int(os.environ.get("MG_PORT", 8851))  # tests/run.py gives each test its own port
URL = f"http://localhost:{PORT}/index.html"
READY = "typeof idb !== 'undefined' && idb && S.mode === 'ready'"
failures = []
def check(ok, what):
    print(("ok   " if ok else "FAIL ") + what)
    if not ok: failures.append(what)

SEED = r"""(title) => (async () => {
  const now = Date.now();
  const A = [{ k: 'h', l: 1, x: 'Plateaus', s: 'a0' }, { k: 'pg', x: '55' }];
  for (let i = 0; i < 120; i++) A.push({ k: 'p', x: `Page fifty-five, paragraph ${i + 1}, which fills the screen several times over before page fifty-six begins.` });
  A.push({ k: 'pg', x: '56' }, { k: 'p', x: 'Page fifty-six, where the geology of morals speaks of absolute deterritorialization.' },
    { k: 'pg', x: '57' }, { k: 'p', x: 'Page fifty-seven.' });
  await put('content', 'atp', A);
  await put('texts', 'atp', { title, author: 'Deleuze and Guattari', hasContent: true, total: A.length, pos: 0, sections: [{ id: 'a0', label: 'Plateaus' }], createdAt: now, updatedAt: now });
  await put('texts', 'wip', { title: 'What Is Philosophy?', author: 'Deleuze and Guattari', hasContent: false, createdAt: now, updatedAt: now });
})()"""

ENTRY = """(id) => { const d = document.querySelector(`details.term[data-term-id="${id}"]`); const box = d && d.querySelector('[data-gx]');
  return box ? { text: box.textContent, links: [...box.querySelectorAll('[data-bookpage]')].map((b) => [b.textContent, b.dataset.bookpage, b.dataset.page]),
    disp: [...d.querySelectorAll('.tdisp .tmore')].map((p) => p.textContent) } : null; }"""

async def openEntry(page, id):
    await page.evaluate(f"S.gOpen = new Set(); go({{ screen: 'glossary' }})"); await page.wait_for_timeout(200)
    await page.evaluate(f"openTerm('{id}')"); await page.wait_for_timeout(400)
    return await page.evaluate(ENTRY, id)

async def main():
    async with async_playwright() as p:
        browser = await p.chromium.launch()
        ctx = await browser.new_context(bypass_csp=True, viewport={"width": 412, "height": 915}, device_scale_factor=2.625, is_mobile=True, has_touch=True)
        page = await ctx.new_page(); errs = []
        page.on("pageerror", lambda e: errs.append(str(e)))
        page.on("console", lambda m: m.type == "error" and "Failed to load resource" not in m.text and errs.append(m.text))
        await page.route("https://commons.wikimedia.org/**", lambda r: r.abort())
        await page.goto(URL); await page.wait_for_function(READY)

        # 1 the data lines up with the entries' text
        data = await page.evaluate("""() => { const bad = [], keys = new Set(Object.keys(PAGE_BOOKS));
          for (const [id, pb] of Object.entries(TERM_PAGES)) { const g = GLOSSARY.find((x) => x.id === id);
            if (!g) { bad.push(id + ': no entry'); continue; }
            const n = (g.x.match(PAGE_REF) || []).length; if (n !== pb.length) bad.push(`${id}: ${n} references, ${pb.length} books`);
            if (pb.some((k) => k !== null && !keys.has(k))) bad.push(id + ': unknown book'); }
          for (const [id, pb] of Object.entries(TERM_PAGES)) { const g = allTerms().find((x) => x.id === id); if (!g) continue;
            for (const html of [refParas(g.x, { kind: 'term', id }), classicParas(g.x)]) { const d = document.createElement('div'); d.innerHTML = html;
              const n = (d.textContent.match(PAGE_REF) || []).length; if (n !== pb.length) bad.push(`${id}: ${n} references once linked`); } }
          for (const [id, list] of Object.entries(TERM_DISPUTES)) if (!GLOSSARY.some((x) => x.id === id) || !list.length) bad.push(id + ': disputes');
          return { bad, pages: Object.keys(TERM_PAGES).length, disputes: Object.keys(TERM_DISPUTES).length }; }""")
        check(not data["bad"] and data["pages"] >= 16 and data["disputes"] >= 7, f"TERM_PAGES and TERM_DISPUTES line up with the entries, before and after their links are drawn ({data})")

        # 2 no book: references stay text
        plain = await openEntry(page, "deterritorialization")
        check(plain and not plain["links"] and "(p. 56)" in plain["text"], f"with no matching book, page references stay text ({plain and plain['links']})")

        # 3 a book titled A Thousand Plateaus: its references link, the others don't
        await page.evaluate(SEED, "A Thousand Plateaus"); await page.reload(); await page.wait_for_function(READY)
        e = await openEntry(page, "deterritorialization")
        want = await page.evaluate("TERM_PAGES['deterritorialization'].filter((k) => k === 'ATP').length")
        check(e and len(e["links"]) == want and all(l[1] == "atp" for l in e["links"]), f"exactly the A Thousand Plateaus references link to that book ({len(e['links'])} of {want})")
        check(e and e["text"] == plain["text"], "the entry's visible text is unchanged by the links")
        check(e and ["p. 56", "atp", "56"] in e["links"] and ["pp. 508–510", "atp", "508"] in e["links"], f"a range links its first page ({[l for l in e['links'] if l[0] in ('p. 56', 'pp. 508–510')]})")
        check(e and "(p. 33)" in e["text"] and not any(l[0] == "p. 33" for l in e["links"]), "an Anti-Oedipus reference stays text with no Anti-Oedipus in the library")

        # 4 tap (p. 56): the reader at page 56; a missing page opens the book with a note
        await page.click('details.term[data-term-id="deterritorialization"] [data-bookpage][data-page="56"]')
        await page.wait_for_function("S.screen === 'reader' && R.tid === 'atp' && R.blocks", timeout=20000); await page.wait_for_timeout(800)
        st = await page.evaluate("""() => { const want = R.blocks.findIndex((b) => b.k === 'pg' && b.x === '56'); const el = document.querySelector('#book [data-i="' + (want + 1) + '"]') || document.querySelector('#book [data-i="' + want + '"]');
          const r = el && el.getBoundingClientRect(); return { want, at: currentBlock(), shown: !!r && r.bottom > 0 && r.top < innerHeight }; }""")
        check(st["want"] > 100 and st["shown"] and 0 <= st["want"] - st["at"] < 15, f"tapping (p. 56) opens the reader at printed page 56 ({st})")
        await page.evaluate("back()"); await page.wait_for_timeout(300)
        await page.evaluate("() => { window._toasts = []; const t0 = toast; toast = (m, ...r) => { _toasts.push(m); return t0(m, ...r); }; }")
        await page.evaluate("openBookPage('atp', 'ix')"); await page.wait_for_timeout(800)
        miss = await page.evaluate("({ screen: S.screen, tid: R.tid, toasts: _toasts })")
        check(miss["screen"] == "reader" and miss["tid"] == "atp", f"a page the copy lacks still opens the book ({miss})")
        check(any("no page ix" in m for m in miss["toasts"]), f"...and says the copy has no such page ({miss['toasts']})")
        await page.evaluate("back()"); await page.wait_for_timeout(300)
        await page.evaluate("_toasts.length = 0; openBookPage('atp', '60')"); await page.wait_for_timeout(800)
        near = await page.evaluate("({ at: currentBlock(), want: R.blocks.findIndex((b) => b.k === 'pg' && b.x === '57'), toasts: _toasts })")
        check(any("no page 60" in m and "page 57" in m for m in near["toasts"]), f"a numbered page the copy lacks opens the nearest before it and says so ({near['toasts']})")
        await page.evaluate("back()"); await page.wait_for_timeout(300)

        # roman numerals and the Kafka book
        rz = await openEntry(page, "rhizome")
        check(rz and ["p. xx", "atp", "xx"] in rz["links"], f"a page in roman numerals links too (rhizome's p. xx) ({[l for l in rz['links'] if not l[2].isdigit()]})")
        await page.evaluate("() => (async () => { const now = Date.now(); await put('content', 'kaf', [{ k: 'pg', x: '16' }, { k: 'p', x: 'Minor.' }]); await put('texts', 'kaf', { title: 'Kafka: Toward a Minor Literature', author: 'Gilles Deleuze and Félix Guattari', hasContent: true, total: 2, sections: [], createdAt: now, updatedAt: now }); await put('content', 'hug', [{ k: 'pg', x: '83' }, { k: 'p', x: 'Guide.' }]); await put('texts', 'hug', { title: \"Deleuze's Difference and Repetition: A Reader's Guide\", author: 'Joe Hughes', hasContent: true, total: 2, sections: [], createdAt: now, updatedAt: now }); })()")
        await page.reload(); await page.wait_for_function(READY)
        ml = await openEntry(page, "minor-literature")
        check(ml and ["p. 16", "kaf", "16"] in ml["links"], f"Kafka: Toward a Minor Literature's pages link to it ({[l for l in ml['links'] if l[1] == 'kaf'][:3]})")
        rp = await openEntry(page, "repetition")
        check(rp and not rp["links"], f"a guide to a book by another author gets none of the book's links ({rp and rp['links'][:3]})")

        # 5 another title, or a book without its text, gets no links
        await page.evaluate(SEED, "Mille plateaux"); await page.reload(); await page.wait_for_function(READY)
        other = await openEntry(page, "deterritorialization")
        check(other and not any(l[1] == "atp" for l in other["links"]), f"a book whose title names another book gets no links ({[l for l in other['links'] if l[1] == 'atp'][:3]})")
        e2 = await openEntry(page, "plane-of-immanence")
        check(e2 and not e2["links"], "a book whose text isn't loaded gets no links (What Is Philosophy?, not loaded)")

        # 6 disputes
        check(e2 and len(e2["disp"]) == 4 and e2["disp"][0].startswith("One plane for each philosopher?"), f"Plane of immanence shows its four disputes ({e2 and len(e2['disp'])})")
        hdr = await page.evaluate("""() => (document.querySelector('details.term[data-term-id="plane-of-immanence"] .tdisp .label') || {}).textContent""")
        check(hdr == "Where readers disagree", f"...under 'Where readers disagree' ({hdr!r})")
        a = await openEntry(page, "assemblage")
        check(a and not a["disp"] and not await page.evaluate("""() => !!document.querySelector('details.term[data-term-id="assemblage"] .tdisp')"""), "an entry with no disputes shows no box")

        # 7 an entry you edited: no links, no disputes
        await page.evaluate(SEED, "A Thousand Plateaus"); await page.reload(); await page.wait_for_function(READY)
        ed = await page.evaluate("""() => { const g = { ...allTerms().find((x) => x.id === 'plane-of-immanence'), edited: true };
          const d = document.createElement('div'); d.innerHTML = pageLinks(g.x, g) + disputesHTML(g);
          const t = { ...allTerms().find((x) => x.id === 'deterritorialization'), edited: true }; const d2 = document.createElement('div'); d2.innerHTML = pageLinks(t.x, t);
          return { links: d.querySelectorAll('[data-bookpage]').length + d2.querySelectorAll('[data-bookpage]').length, disp: !!d.querySelector('.tdisp') }; }""")
        check(ed == {"links": 0, "disp": False}, f"an entry you edited shows neither links nor disputes ({ed})")

        check(not errs, f"no errors in the console ({errs[:3]})")
        await browser.close()

if __name__ == "__main__":
    srv = subprocess.Popen([sys.executable, "-m", "http.server", str(PORT)], stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL, cwd=str(Path(__file__).resolve().parent.parent))
    time.sleep(1)
    try: asyncio.run(main())
    finally: srv.terminate()
    print("all passed" if not failures else f"{len(failures)} failed"); sys.exit(1 if failures else 0)
