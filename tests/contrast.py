"""Text contrast in light and dark mode. Run after changes to colours or styles:  python3 tests/contrast.py

Every screen of the smoke test, the reader (also in its Night tone), open glossary and branch entries, the timeline and the main
panels, at phone width in both colour schemes: each piece of visible text against what is actually behind it (backgrounds and
opacity blended) must reach WCAG AA, 4.5:1, or 3:1 for large text. Disabled controls are exempt, as in WCAG.
Needs: pip install playwright && playwright install chromium
"""
import os
import asyncio, subprocess, sys, time, re
from pathlib import Path
from playwright.async_api import async_playwright
ROOT = Path(__file__).resolve().parent.parent
PORT = int(os.environ.get("MG_PORT", 8813))  # tests/run.py gives each test its own port
src = (ROOT / "tests" / "smoke.py").read_text(encoding="utf-8")
SEED = re.search(r'SEED = """(.*?)"""', src, re.S).group(1)
SCREENS = eval(re.search(r"SCREENS = (\[.*?\])\n", src, re.S).group(1))
CHECK = r"""() => {
  const parse = (c) => { const m = c.match(/rgba?\(([^)]+)\)/); if (!m) return null; const p = m[1].split(/[ ,/]+/).filter(Boolean).map(Number); return { r: p[0], g: p[1], b: p[2], a: p.length > 3 ? p[3] : 1 }; };
  const lum = ({ r, g, b }) => { const f = (v) => { v /= 255; return v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4; }; return 0.2126 * f(r) + 0.7152 * f(g) + 0.0722 * f(b); };
  const blend = (top, bot) => ({ r: top.r * top.a + bot.r * (1 - top.a), g: top.g * top.a + bot.g * (1 - top.a), b: top.b * top.a + bot.b * (1 - top.a), a: 1 });
  const bgOf = (el) => { const stack = []; for (let e = el; e; e = e.parentElement) { const cs = getComputedStyle(e); const c = parse(cs.backgroundColor); if (c && c.a > 0) { stack.push(c); if (c.a >= 1) break; } }
    let base = stack.length && stack[stack.length - 1].a >= 1 ? stack.pop() : parse(getComputedStyle(document.body).backgroundColor) || { r: 0, g: 0, b: 0, a: 1 };
    for (let k = stack.length - 1; k >= 0; k--) base = blend(stack[k], base); return base; };
  const out = [];
  const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
  const seen = new Set();
  for (let n; (n = walker.nextNode());) {
    if (!n.textContent.trim()) continue; const el = n.parentElement; if (!el || seen.has(el)) continue; seen.add(el);
    if (el.closest(':disabled')) continue;
    const r = el.getBoundingClientRect(); if (!r.width || !r.height) continue;
    const cs = getComputedStyle(el); if (cs.visibility === "hidden" || +cs.opacity === 0) continue;
    let op = 1; for (let e = el; e; e = e.parentElement) op *= +getComputedStyle(e).opacity;
    const fg0 = parse(cs.color); if (!fg0) continue; const bg = bgOf(el); const fg = blend({ ...fg0, a: fg0.a * op }, bg);
    const L1 = lum(fg), L2 = lum(bg), ratio = (Math.max(L1, L2) + 0.05) / (Math.min(L1, L2) + 0.05);
    const size = parseFloat(cs.fontSize), bold = +cs.fontWeight >= 700, large = size >= 24 || (bold && size >= 18.66);
    if (ratio < (large ? 3 : 4.5)) out.push([ratio.toFixed(2), el.tagName.toLowerCase() + "." + [...el.classList].join("."), n.textContent.trim().slice(0, 40), cs.color, size]);
  }
  return out;
}"""
async def main():
    async with async_playwright() as p:
        b = await p.chromium.launch()
        for scheme in ["light", "dark"]:
            ctx = await b.new_context(viewport={"width": 390, "height": 844}, color_scheme=scheme, reduced_motion="reduce")  # colours at rest: a panel caught mid-rise reads faint
            pg = await ctx.new_page()
            await pg.route("https://commons.wikimedia.org/**", lambda r: r.abort())
            await pg.goto(f"http://localhost:{PORT}/index.html"); await pg.wait_for_function("typeof idb !== 'undefined' && idb")
            await pg.evaluate(SEED)
            extra = [("panel:thinker", "thinkerPanel('kant')"), ("panel:quiz", "quizPanel('all')"), ("panel:truth", "TT.prem='P → Q\\nQ'; TT.concl='P'; truthPanel()"), ("panel:export", "exportPanel()"), ("panel:connect", "connectPanel(); document.querySelector('[data-cnhint]')?.click()"), ("panel:order", "orderPanel(); OB.placed = [...OB.ids]; OB.checked = true; document.querySelector('#obbox').innerHTML = orderHTML()"), ("panel:guess", "guessPanel()"), ("panel:recon", "reconPanel()"), ("panel:wikisource", "textSheet(null); document.querySelector('#f-wsbox').hidden = false; document.querySelector('#f-wsres').innerHTML = '<button type=button class=wshit><b>A work</b><span>a snippet</span></button>'"), ("primer", "addClassics(true).then(() => go({ screen: 'text', textId: 'classic-du-bois-souls' }))"), ("paths-open", "addClassics(true).then(() => { go({ screen: 'paths', path: 'how-to-live' }); document.querySelectorAll('.readqd').forEach((d) => d.open = true); })"), ("panel:dispute", "DSP.shown.add('elisabeth'); disputePanel('elisabeth')"), ("panel:mkset", "MK.q = 'ethics'; setMaker()"), ("panel:missing", "quizPanel('missing'); document.querySelector('.qz-opt').click()"), ("panel:steps", "stepsPanel(); ST.placed = [...ST.prem]; ST.checked = true; document.querySelector('#stbox').innerHTML = stepsHTML()"), ("glossary-open", "S.gOpen=new Set(['ontology','validity']); go({screen:'glossary'})"), ("branches-open", "S.bOpen=new Set(['logic','metaphysics']); go({screen:'branches'})"), ("thinkers-tl", "S.tl=true; go({screen:'thinkers'})"), ("reader", "go({screen:'reader', textId:'t1'})"), ("reader-night", "go({screen:'reader', textId:'t1'}); setTimeout(()=>document.querySelector('#reader').classList.add('tone-night'),300)")]
            for name, extra_s in [(n, e) for n, e in SCREENS] + extra:
                if isinstance(extra_s, dict):
                    await pg.evaluate("([s, x]) => { closeOverlay && document.querySelector('#sheetroot').innerHTML && closeOverlay(); Object.assign(S, x, { screen: s }); render(); }", [name, extra_s])
                else:
                    await pg.evaluate("document.querySelector('#sheetroot').innerHTML = ''"); await pg.evaluate(extra_s)
                await pg.wait_for_timeout(250)
                bad = await pg.evaluate(CHECK)
                check(not bad, f"{scheme} {name}" + (f": {bad[:4]}" if bad else ""))
            await ctx.close()
        await b.close()
failures = []
def check(ok, what):
    print(("ok   " if ok else "FAIL ") + what)
    if not ok: failures.append(what)
srv = subprocess.Popen([sys.executable, "-m", "http.server", str(PORT), "-d", str(ROOT)], stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
try: time.sleep(1); asyncio.run(main())
finally: srv.terminate()
print(f"\n{len(failures)} failed" if failures else "\nall passed")
sys.exit(1 if failures else 0)
