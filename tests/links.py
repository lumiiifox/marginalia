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
        check(not errs, "no script errors" + (f": {errs}" if errs else ""))
        await browser.close()

server = subprocess.Popen([sys.executable, "-m", "http.server", str(PORT), "-d", str(ROOT)], stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
try:
    time.sleep(1); asyncio.run(main())
finally:
    server.terminate()
print(f"\n{len(failures)} failed" if failures else "\nall passed")
sys.exit(1 if failures else 0)
