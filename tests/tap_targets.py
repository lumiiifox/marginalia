"""Tap areas on a small phone. Run:  python3 tests/tap_targets.py

Synthetic data only, at 360px wide. For the small controls (chips, text links such as a note's book, the toast's button, the
summaries that open a section), measures the area a tap actually reaches, by asking the browser which element sits at each point
around the control, and checks it is at least MIN px tall and wide, and that a tap a few pixels outside a chip still lands on that
chip, never on its neighbour.
"""
import os, asyncio, subprocess, sys, time
from pathlib import Path
from playwright.async_api import async_playwright

ROOT = Path(__file__).resolve().parent.parent
PORT = int(os.environ.get("MG_PORT", 8834))
URL = f"http://localhost:{PORT}/index.html"
MIN = 32
failures = []


def check(ok, msg):
    print(("ok   " if ok else "FAIL ") + msg)
    if not ok: failures.append(msg)


SEED = """async () => {
  const now = Date.now();
  await put('texts', 't1', { title: 'Test Book', author: 'Author, Test', hasContent: true, status: 'reading', sections: [], pos: 0, createdAt: now, updatedAt: now });
  await put('content', 't1', [{ k: 'p', x: 'Substance is what is in itself and is conceived through itself.' }]);
  for (let i = 0; i < 3; i++) await put('notes', 'n' + i, { textId: 't1', kind: 'question', passage: 'Substance is what is in itself', gloss: 'Why itself? substance', page: String(i + 1), at: 0, links: [], createdAt: now - i, updatedAt: now });
}"""
# the area a tap reaches: from the control's centre, how far up, down, left and right the browser still finds it there
MEASURE = """(sel) => {
  const own = (el, at) => at && (at === el || el.contains(at));
  const out = [];
  for (const el of [...document.querySelectorAll(sel)].slice(0, 6)) {
    const r = el.getBoundingClientRect(); if (!r.width || !r.height || r.bottom < 0 || r.top > innerHeight) continue;
    const cx = Math.min(r.left + r.width / 2, innerWidth - 2), cy = r.top + r.height / 2;
    if (!own(el, document.elementFromPoint(cx, cy))) continue; // covered by something else here (a sheet): skip
    const reach = (dx, dy) => { let k = 0; while (k < 60 && own(el, document.elementFromPoint(cx + dx * (k + 1), cy + dy * (k + 1)))) k++; return k; };
    out.push({ name: (el.textContent || '').trim().slice(0, 24), drawn: [Math.round(r.width), Math.round(r.height)], h: reach(0, -1) + reach(0, 1) + 1, w: Math.min(reach(-1, 0) + reach(1, 0) + 1, 999) });
  }
  return out; }"""
PLACES = [
    ("home", "go({ screen: 'library' })", ["button.chip", "button.src"]),
    ("search", "S.q = 'substance'; go({ screen: 'library' })", [".note button.src", "button.chip"]),
    ("glossary", "S.q = ''; go({ screen: 'glossary' })", ["button.chip"]),
    ("book page", "go({ screen: 'text', textId: 't1' })", ["button.src", "button.chip", ".primer > summary"]),
    ("recommendations", "go({ screen: 'recommendations' })", [".discovery-source"]),
    ("quiz", "go({ screen: 'study' }); quizPanel('all')", ["button.chip"]),
]


async def main():
    async with async_playwright() as p:
        browser = await p.chromium.launch()
        ctx = await browser.new_context(bypass_csp=True, viewport={"width": 360, "height": 780}, service_workers="block")
        await ctx.route("**/*", lambda r: r.continue_() if r.request.url.startswith(f"http://localhost:{PORT}") else r.abort())
        page = await ctx.new_page(); errs = []
        page.on("pageerror", lambda e: errs.append(str(e)))
        await page.goto(URL); await page.wait_for_function("S.mode === 'ready'")
        await page.evaluate(SEED)
        for label, there, sels in PLACES:
            await page.evaluate(f"(async () => {{ if (NAV.overlay) stepBack(); {there}; $('#toast').hidden = true; }})()"); await page.wait_for_timeout(250)  # a toast from the seed would cover the bottom
            for sel in sels:
                got = await page.evaluate(MEASURE, sel)
                if not got: continue
                small = [g for g in got if g["h"] < MIN or g["w"] < MIN]
                check(not small, f"{label}: a tap reaches {MIN}px or more around each {sel} ({small[:2] or got[:1]})")
        # the toast's button, shown on purpose
        await page.evaluate("if (NAV.overlay) stepBack(); go({ screen: 'library' }); toast('Saved.', { label: 'Undo', run: () => {} })"); await page.wait_for_timeout(150)
        got = await page.evaluate(MEASURE, ".toastbtn")
        check(got and all(g["h"] >= MIN and g["w"] >= MIN for g in got), f"the toast's button can be tapped without aiming ({got})")
        # a tap just outside a chip lands on it, and the gap between two chips never belongs to the wrong one
        await page.evaluate("go({ screen: 'glossary' })"); await page.wait_for_timeout(200)
        ok = await page.evaluate("""() => { const cs = [...document.querySelectorAll('.chips .chip')].slice(0, 4); const bad = [];
          for (let i = 0; i + 1 < cs.length; i++) { const a = cs[i].getBoundingClientRect(), b = cs[i + 1].getBoundingClientRect(); if (Math.abs(a.top - b.top) > 2) continue;
            const mid = (a.right + b.left) / 2, y = a.top + a.height / 2, left = document.elementFromPoint(mid - 1, y), right = document.elementFromPoint(mid + 1, y);
            if (!(cs[i].contains(left) || left === cs[i] || left === cs[i].parentNode) || !(cs[i + 1].contains(right) || right === cs[i + 1] || right === cs[i + 1].parentNode)) bad.push(i); }
          const c = cs[1], r = c.getBoundingClientRect(), above = document.elementFromPoint(r.left + r.width / 2, r.top - 3);
          return [bad, above === c]; }""")
        check(ok == [[], True], f"a tap just above a chip lands on it, and the gap between two chips splits fairly ({ok})")
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
