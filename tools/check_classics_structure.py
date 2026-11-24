"""On demand:  python3 tools/check_classics_structure.py [ID ...]

Structural audit of every bundled classic, in the app itself: characters and markup, sections and contents, and every note
reference resolved by the reader's own findNote."""
import asyncio, json, subprocess, sys, time
from playwright.async_api import async_playwright
from pathlib import Path
ROOT = str(Path(__file__).resolve().parent.parent); PORT = 8831
CHECK = r"""async (id) => {
  const t = S.texts.get(id), B = await loadContent(id), out = { id, title: t.title, blocks: B.length, issues: [] };
  const bad = (what, i, x) => out.issues.push(`${what} @${i}: ${String(x).replace(/[\u0001\u0002]/g, "").slice(0, 90)}`);
  // characters and leftover markup
  B.forEach((b, i) => { const x = b.x || "";
    if (/�/.test(x)) bad("replacement char", i, x);
    if (/[\u0000\u0003-\u0008\u000B-\u001F\u007F]/.test(x)) bad("control char", i, JSON.stringify(x.slice(0, 60)));
    if (/Ã[\u0080-¿]|â€|Â /.test(x)) bad("mojibake", i, x);
    if (/<\/?[a-zA-Z][^>]{0,40}>/.test(x)) bad("tag", i, x);
    if (/&(?:[a-z]{2,8}|#\d{2,5});/.test(x)) bad("entity", i, x);
    if (/\[(?:Footnote|Illustration|Sidenote|Transcriber|Greek:|Hebrew:)/i.test(x)) bad("transcription mark", i, x);
    if (/(?<![\w-])--(?![\w-]*--)|\w--\w/.test(x)) bad("double hyphen", i, x);
    if (/(?:^|\s)_[^_\s][^_]{0,60}_(?=[\s.,;:!?)]|$)/.test(x)) bad("underscore italics", i, x);
    const o = (x.match(/\u0001/g) || []).length, c = (x.match(/\u0002/g) || []).length; if (o !== c) bad("unbalanced italics", i, x);
    if (b.k !== "pg" && !plain(x).trim()) bad("empty block", i, b.k);
  });
  // sections: unique ids, each with one chapter heading, in order, a matching label, and text before the next
  const secs = t.sections || [], ids = secs.map((s) => s.id);
  if (new Set(ids).size !== ids.length) out.issues.push("duplicate section ids");
  const heads = B.map((b, i) => [b, i]).filter(([b]) => b.s && !b.stj && roleOf(b) === "chapter");
  if (heads.length !== secs.length) out.issues.push(`sections ${secs.length} vs chapter headings ${heads.length}`);
  let last = -1;
  secs.forEach((s, k) => {
    const r = stepRange(B, [s.id]);
    if (!r) return out.issues.push(`section not found: ${s.label}`);
    if (r[0] <= last) out.issues.push(`section out of order: ${s.label}`); last = r[0];
    const head = plain(B[r[0]].x || ""), lab = s.label.replace(/…$/, "");
    if (!norm(head).startsWith(norm(lab).slice(0, 40))) out.issues.push(`label/heading differ: "${s.label}" vs "${head.slice(0, 60)}"`);
    const body = B.slice(r[0] + 1, r[1]).filter((b) => b.k !== "pg" && b.k !== "h" && plain(b.x || "").trim()).length;
    if (!body && k < secs.length - 1 && !/^(?:part|book)\b/i.test(s.label)) out.issues.push(`empty section: ${s.label}`);
  });
  const labels = secs.map((s) => norm(s.label)); labels.forEach((l, k) => { if (k && l === labels[k - 1]) out.issues.push(`repeated section label: ${secs[k].label}`); });
  // consecutive duplicated paragraphs (a section taken twice)
  for (let i = 1; i < B.length; i++) if (B[i].k !== "pg" && (B[i].x || "").length > 80 && B[i].x === B[i - 1].x) bad("duplicate paragraph", i, B[i].x);
  const seen = new Map(); B.forEach((b, i) => { if (b.k === "p" && (b.x || "").length > 200) { if (seen.has(b.x)) bad(`paragraph repeated from @${seen.get(b.x)}`, i, b.x); else seen.set(b.x, i); } });
  out.sections = secs.length; out.fns = B.filter((b) => b.k === "fn").length;
  return out;
}"""
NOTES = r"""async (id) => {
  go({ screen: "reader", textId: id }); for (let k = 0; k < 100 && !(R.blocks && R.tid === id); k++) await new Promise((r) => setTimeout(r, 100));
  const B = R.blocks, res = { refs: 0, missing: [], before: [], notNearest: [] }; if (!B) return { error: "reader did not open" };
  const { starts } = noteRuns(), num = (m) => +[...m].map((c) => "⁰¹²³⁴⁵⁶⁷⁸⁹".indexOf(c)).join("");
  B.forEach((b, i) => { if (b.k === "fn" || b.k === "pg") return; for (const m of (b.x || "").match(/[⁰¹²³⁴⁵⁶⁷⁸⁹]{1,4}/g) || []) {
    const n = num(m); res.refs++; const [k, all] = findNote(i, n);
    if (k < 0) { res.missing.push(`${n}@${i}: ${plain(b.x).slice(0, 60)}`); continue; }
    const nextAfter = all.find((j) => j > i);
    if (k < i && nextAfter !== undefined) res.before.push(`${n}@${i}->${k}`);
    // a footnote book: the note should be the next one with that number
    if (B[k].k === "fn" && nextAfter !== undefined && k !== nextAfter) res.notNearest.push(`${n}@${i}->${k} (next ${nextAfter})`);
  } });
  // notes nobody refers to
  const refd = new Set(); B.forEach((b) => { if (b.k !== "fn") for (const m of (b.x || "").match(/[⁰¹²³⁴⁵⁶⁷⁸⁹]{1,4}/g) || []) refd.add(num(m)); });
  res.orphans = starts.filter((s) => !refd.has(s.n)).map((s) => `${s.n}@${s.k}`).slice(0, 8);
  res.notes = starts.length;
  return res;
}"""
async def main():
    srv = subprocess.Popen([sys.executable, "-m", "http.server", str(PORT), "-d", ROOT], stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL); time.sleep(1)
    try:
        async with async_playwright() as p:
            b = await p.chromium.launch(); ctx = await b.new_context(viewport={"width": 390, "height": 844}, is_mobile=True, has_touch=True, bypass_csp=True)
            pg = await ctx.new_page(); errs = []; pg.on("pageerror", lambda e: errs.append(str(e)))
            await pg.route("https://commons.wikimedia.org/**", lambda r: r.abort())
            await pg.goto(f"http://localhost:{PORT}/index.html"); await pg.wait_for_function("S.mode === 'ready'")
            await pg.evaluate("addClassics(true)"); await pg.wait_for_function("CLASSICS.every((id) => S.texts.has(id))", timeout=180000)
            ids = await pg.evaluate("CLASSICS"); report = []
            for id in (sys.argv[1:] or ids):
                r = await pg.evaluate(CHECK, id); r["notes"] = await pg.evaluate(NOTES, id); await pg.evaluate("go({ screen: 'library' })")
                report.append(r)
                n = r["notes"]; print(f"{id}: {r['blocks']} blocks, {r['sections']} sections, {n.get('refs')} refs / {n.get('notes')} notes; issues {len(r['issues'])}; missing {len(n.get('missing', []))} before {len(n.get('before', []))} notNearest {len(n.get('notNearest', []))} orphans {len(n.get('orphans', []))}")
            out = Path(ROOT) / "tests/.cache/audit"; out.mkdir(parents=True, exist_ok=True); json.dump(report, open(out / "structure.json", "w"), ensure_ascii=False, indent=1)
            print("page errors", errs)
    finally: srv.terminate()
asyncio.run(main())
