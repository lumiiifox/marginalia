"""Inline links in the branch and tradition articles. Run after changes to branchLinks or to names in data/:  python3 tests/links.py

Checks that:
  1. a four-letter name links only in its own case and as a whole word: Kant and Hume link, as do Kant's and "Kant,"; Kantian, kant
     and Hume-like words don't.
  2. accents don't matter: Ibn Sina finds Ibn Sīnā's entry, and so does Ibn Sīnā typed in decomposed Unicode (NFD); the linked words
     are the text's own, accents included.
  3. a short name that is also an English word links only by its full name: "Said differently" and "Land reform" stay plain,
     Edward Said and Nick Land link.
  4. sentence-initial capitals, possessives, quotation marks, brackets and dashes around a name don't stop or misplace a link;
     a name inside a longer word never links; each entry links once per paragraph, and the text around links is unchanged.
  6. citations to the Ethics in an article with xr "spinoza-ethics": every bracketed reference is a link, each finds the block that
     starts with its own label (a definition's numeral, PROP. XVII., Corollary II., Note), and tapping one opens the Ethics there;
     a bracket holding anything else stays text.
  5. across every article in data/branches.js: every link's words name the entry it opens (accents and case aside), Kant and Hume
     link somewhere, no link opens on "Said" or "Land" alone, and no paragraph's visible text changes.
"""
import asyncio, subprocess, sys, time
from pathlib import Path
from playwright.async_api import async_playwright

ROOT = Path(__file__).resolve().parent.parent
PORT = 8814
URL = f"http://localhost:{PORT}/index.html"
READY = "typeof idb !== 'undefined' && idb && S.mode === 'ready'"
failures = []
def check(ok, what):
    print(("ok   " if ok else "FAIL ") + what)
    if not ok: failures.append(what)

LINK = """(t) => { const d = document.createElement('div'); d.innerHTML = branchLinks(t, [], [...THINKER.values()]);
  return { text: d.textContent, links: [...d.querySelectorAll('[data-thinker]')].map((b) => [b.textContent, b.dataset.thinker]) }; }"""

CASES = [
    ("Kant's first Critique", [["Kant", "kant"]]),
    ('"Kant," she said, and Hume agreed.', [["Kant", "kant"], ["Hume", "hume"]]),
    ("Kantian ethics and humean worries", []),
    ("kant in lower case", []),
    ("Ibn Sina (Avicenna) argued", [["Ibn Sina (Avicenna)", "ibnsina"]]),
    ("Ibn Sīnā wrote in Arabic", [["Ibn Sīnā", "ibnsina"]]),
    ("al-Ghazali doubted", [["al-Ghazali", "ghazali"]]),
    ("Said differently, the point holds.", []),
    ("Land reform was debated.", []),
    ("Edward Said and Nick Land disagree.", [["Edward Said", "said"], ["Nick Land", "land"]]),
    ("(Marx) — and Marx again — wrote", [["Marx", "marx"]]),
    ("Marxism is a tradition", []),
    ("Hume. Hume's fork.", [["Hume", "hume"]]),
]

async def main():
    async with async_playwright() as p:
        browser = await p.chromium.launch()
        page = await browser.new_page(viewport={"width": 390, "height": 844})
        errs = []; page.on("pageerror", lambda e: errs.append(str(e)))
        await page.route("https://commons.wikimedia.org/**", lambda r: r.abort())
        await page.goto(URL); await page.wait_for_function(READY)
        have = await page.evaluate("['kant','hume','marx','ibnsina','ghazali','said','land'].filter((id) => THINKER.has(id))")
        check(len(have) == 7, f"the thinkers these cases use exist ({have})")
        for text, want in CASES:
            got = await page.evaluate(LINK, text)
            check(got["links"] == want and got["text"] == text, f"{text!r} links {want}" + ("" if got["links"] == want else f" (got {got['links']})") + ("" if got["text"] == text else " (text changed)"))
        corpus = await page.evaluate("""() => {
          const fold = (s) => s.normalize('NFD').replace(/\\p{M}/gu, '').toLowerCase();
          const out = { bad: [], lone: [], changed: [], ids: new Set() };
          for (const b of BRANCHES) for (const part of (b.x || '').split(/\\n\\n/)) {
            const body = part.includes('\\n') ? part.slice(part.indexOf('\\n') + 1) : part;
            const d = document.createElement('div'); d.innerHTML = branchLinks(body, [], [...THINKER.values()]);
            if (d.textContent !== body) out.changed.push(b.id);
            for (const a of d.querySelectorAll('[data-thinker]')) {
              const p = THINKER.get(a.dataset.thinker), names = [p.n, p.sn].filter(Boolean).map(fold);
              out.ids.add(a.dataset.thinker);
              if (!names.includes(fold(a.textContent))) out.bad.push(b.id + ': ' + a.textContent + ' -> ' + a.dataset.thinker);
              if (/^(Said|Land)$/.test(a.textContent)) out.lone.push(b.id);
            }
          }
          return { bad: out.bad, lone: out.lone, changed: out.changed, kant: out.ids.has('kant'), hume: out.ids.has('hume') }; }""")
        check(not corpus["bad"], f"every link in the articles names the entry it opens ({corpus['bad'][:3]})")
        check(corpus["kant"] and corpus["hume"], "Kant and Hume link in the articles")
        check(not corpus["lone"], f"no link on Said or Land alone ({corpus['lone']})")
        check(not corpus["changed"], f"linking leaves every paragraph's text unchanged ({corpus['changed'][:3]})")

        # citations to the Ethics
        refs = await page.evaluate("""async () => {
          const r = await fetch('data/books/classic-spinoza-ethics.json'); const B = (await r.json()).content;
          const d = document.createElement('div'); d.innerHTML = articleHTML(BRANCH.get('metaphysics'), []);
          const bad = [], seen = [];
          for (const a of d.querySelectorAll('[data-passage]')) {
            const at = a.dataset.passageAt, [part, kind, num, sub, subNum] = at.split('|'), i = passageBlock(B, at), t = i >= 0 ? plain(B[i].x) : '';
            const R = toRoman(+num), want = sub === 'Corollary' ? new RegExp('^Corollary' + (subNum ? ' ' + toRoman(+subNum) + '\\\\.' : '\\\\b'))
              : sub === 'Note' ? /^Note\\b/ : kind === 'Proposition' ? new RegExp('^PROP\\\\. ' + R + '\\\\. ') : new RegExp('^(' + kind.toUpperCase() + ' )?' + R + '\\\\. ', 'i');
            seen.push(a.textContent);
            if (!want.test(t)) bad.push(a.textContent + ' -> ' + t.slice(0, 40));
            if (sub && i >= 0) { const prop = passageBlock(B, [part, kind, num, '', ''].join('|')); if (!(i > prop)) bad.push(a.textContent + ' not after its proposition'); }
          }
          const plainText = d.textContent.match(/\\((?:Part )?(?:I|II|III|IV|V), [^()]*\\)/g) || [];
          return { n: seen.length, bad, brackets: plainText.length, kept: articleHTML(BRANCH.get('logic'), []).includes('data-passage') };
        }""")
        check(refs["n"] == 17 and not refs["bad"], f"each of the {refs['n']} Ethics citations in Metaphysics finds its own passage ({refs['bad'][:3]})")
        check(not refs["kept"], "an article without xr gets no citation links")
        got = await page.evaluate("passageLinks('(I, Proposition 5) and (I, and then some) and (see Kant, Proposition 5)', 'spinoza-ethics')")
        check(got.count('data-passage="') == 1 and "(I, and then some)" in got and "(see Kant, Proposition 5)" in got, f"a bracket with anything that isn't a reference stays text ({got})")
        await page.evaluate("go({ screen: 'branches', focus: 'metaphysics' })"); await page.wait_for_timeout(200)
        await page.evaluate("document.querySelector(\"details[data-branch-id='metaphysics']\").open = true"); await page.wait_for_timeout(100)
        await page.click("details[data-branch-id='metaphysics'] [data-passage-at='I|Proposition|17|Corollary|2']")
        await page.wait_for_function("S.screen === 'reader' && R.tid === 'classic-spinoza-ethics'", timeout=20000); await page.wait_for_timeout(600)
        opened = await page.evaluate("(async () => { const B = await loadContent('classic-spinoza-ethics'); const want = passageBlock(B, 'I|Proposition|17|Corollary|2'), at = currentBlock(); return { near: Math.abs(at - want) <= 3, text: plain(B[want].x).slice(0, 30) }; })()")
        check(opened["near"] and opened["text"].startswith("Corollary II"), f"tapping (I, Proposition 17, Corollary 2) opens the Ethics at Corollary II ({opened})")
        # citations to the other classics: every reference in every article resolves to its own heading
        other = await page.evaluate("""async () => {
          const label = { 'nietzsche-genealogy': (p) => p[1], 'aristotle-ethics': (p) => toRoman(+p[1]), 'rousseau-social-contract': (p) => toRoman(+p[1]) + '. ', 'hobbes-leviathan': (p) => p[0] + '. ' };
          const out = { n: {}, bad: [] }, books = {};
          for (const b of BRANCHES.filter((b) => b.xr)) {
            const d = document.createElement('div'); d.innerHTML = articleHTML(b, []);
            for (const a of d.querySelectorAll('[data-passage]')) {
              const st = a.dataset.passage; if (st === 'spinoza-ethics') continue;
              if (!books[st]) books[st] = (await (await fetch('data/books/' + PASSAGE_STYLES[st].book + '.json')).json()).content;
              const B = books[st], at = a.dataset.passageAt, i = passageBlock(B, at, st), t = i >= 0 ? plain(B[i].x).trim() : '';
              out.n[st] = (out.n[st] || 0) + 1;
              if (i < 0 || B[i].k !== 'h' || !t.startsWith(label[st](at.split('|')))) out.bad.push(b.id + ': ' + a.textContent + ' -> ' + t.slice(0, 30));
            }
            d.querySelectorAll('.cite-nb').forEach((x) => x.remove()); const left = (d.textContent.match(/\\((?:NE|GM|SC|Lev\\.) [^()]*\\)/g) || []); if (left.length) out.bad.push(b.id + ' unlinked: ' + left.join(' '));
          }
          return out; }""")
        check(not other["bad"] and other["n"].get("nietzsche-genealogy", 0) >= 5 and other["n"].get("aristotle-ethics", 0) >= 6 and other["n"].get("rousseau-social-contract", 0) >= 2,
              f"every reference to the Genealogy, the Nicomachean Ethics and the Social Contract finds its own section ({other['n']}, {other['bad'][:3]})")
        styles = await page.evaluate("""async () => {
          const one = async (st, at) => { const B = (await (await fetch('data/books/' + PASSAGE_STYLES[st].book + '.json')).json()).content; const i = passageBlock(B, at, st); return i >= 0 ? plain(B[i].x).trim().slice(0, 24) : null; };
          return [await one('hobbes-leviathan', 'XIII'), await one('hobbes-leviathan', 'XLVI'), await one('nietzsche-genealogy', 'Preface|3'), await one('aristotle-ethics', 'X|7'), await one('rousseau-social-contract', 'IV|8'), await one('aristotle-ethics', 'I|99')]; }""")
        check(styles[0].startswith("XIII. ") and styles[1].startswith("XLVI. ") and styles[2] == "3" and styles[3] == "VII" and styles[4].startswith("VIII. ") and styles[5] is None,
              f"each style finds chapters across its book, and a chapter that doesn't exist finds nothing ({styles})")
        mixed = await page.evaluate("passageLinks('(NE I.7) and (GM II §4; GM III §28) and (NE I.7; GM I §10) and (eudaimonia)', ['aristotle-ethics', 'nietzsche-genealogy'])")
        check(mixed.count('data-passage="') == 3 and "(NE I.7; GM I §10)" in mixed and "(eudaimonia)" in mixed,
              f"an article can use several styles; a bracket mixing two books, or holding a word, stays text ({mixed})")
        await page.evaluate("go({ screen: 'branches', focus: 'ethics' })"); await page.wait_for_timeout(200)
        await page.evaluate("document.querySelector(\"details[data-branch-id='ethics']\").open = true"); await page.wait_for_timeout(100)
        await page.click("details[data-branch-id='ethics'] [data-passage='nietzsche-genealogy'][data-passage-at='II|4']")
        await page.wait_for_function("S.screen === 'reader' && R.tid === 'classic-nietzsche-genealogy'", timeout=20000); await page.wait_for_timeout(600)
        gm = await page.evaluate("(async () => { const B = await loadContent('classic-nietzsche-genealogy'); const want = passageBlock(B, 'II|4', 'nietzsche-genealogy'), at = currentBlock(); return { near: Math.abs(at - want) <= 3, essay: plain(B.slice(0, want).reverse().find((b) => b.k === 'h' && b.l === 2).x).slice(0, 12) }; })()")
        check(gm["near"] and gm["essay"].startswith("Second Essay"), f"tapping (GM II §4) in Ethics opens the Genealogy at the Second Essay, section 4 ({gm})")
        check(not errs, "no script errors" + (f": {errs}" if errs else ""))
        await browser.close()

server = subprocess.Popen([sys.executable, "-m", "http.server", str(PORT), "-d", str(ROOT)], stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
try:
    time.sleep(1); asyncio.run(main())
finally:
    server.terminate()
print(f"\n{len(failures)} failed" if failures else "\nall passed")
sys.exit(1 if failures else 0)
