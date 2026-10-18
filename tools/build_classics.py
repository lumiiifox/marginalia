"""Builds the classics that come with Marginalia (data/books/<id>.json and <id>.jpg) from Standard Ebooks editions.

    python3 tools/build_classics.py            # every book in BOOKS
    python3 tools/build_classics.py ID ...     # only these

Standard Ebooks editions are public domain in the US, and their editors' work is dedicated to the public domain (CC0). Only
works that are also public domain in Canada go here: the author and any translator died in 1971 or earlier. The source
repositories (github.com/standardebooks/...) and the League Spartan font for covers (SIL Open Font License) are cloned into
tests/.cache, which git ignores. Needs git and Playwright with Chromium.

For each book: takes the XHTML of the work itself (no title page, imprint, colophon or uncopyright), keeps only the endnotes
those files refer to and numbers them from 1, makes note references superscript numbers, dialogue tables "Speaker: words"
paragraphs, a chapter's number and title one heading, and verse line breaks " / ". Then runs the app's own domToBlocks,
finalize, makeSections and guessLang in a browser, as importing an EPUB does. The cover is the edition's own, drawn at the size
the app keeps covers; a book taken from a larger volume gets the volume's art with its own title, set as Standard Ebooks sets it.
After building, add a new book's id to CLASSICS in index.html.
"""
import asyncio, base64, json, re, subprocess, sys, time
from pathlib import Path
from playwright.async_api import async_playwright

APP = Path(__file__).resolve().parent.parent
CACHE = APP / "tests" / ".cache"
SE = CACHE / "se"
FONT = CACHE / "league-spartan" / "fonts" / "webfonts"
OUT = APP / "data" / "books"
PORT = 8821

# repo: github.com/standardebooks/<repo>. files: the XHTML files to take, in order (default: the whole spine but the
# front and back matter). cover: a title for a cover drawn here, when the edition's own cover names the larger volume.
BOOKS = [
    dict(id="classic-plato-socrates", repo="plato_dialogues_benjamin-jowett", files=["euthyphro", "apology", "crito", "phaedo"], cover=dict(title="Euthyphro, Apology, Crito, Phaedo", size=31),
         text=dict(title="Euthyphro, Apology, Crito, Phaedo", author="Plato", edition="trans. Benjamin Jowett", publisher="Standard Ebooks", year="2022", orig="")),
    dict(id="classic-descartes-meditations", repo="rene-descartes_philosophical-works_john-veitch", files=["discourse-on-the-method", "meditations-on-the-first-philosophy"], flatten=True, partOf="Discourse", cover=dict(title="Discourse on the Method and Meditations on First Philosophy", size=25),
         text=dict(title="Discourse on the Method and Meditations on First Philosophy", author="René Descartes", edition="trans. John Veitch", publisher="Standard Ebooks", year="2025", orig="1637–41")),
    dict(id="classic-wollstonecraft-vindication", repo="mary-wollstonecraft_a-vindication-of-the-rights-of-woman", files=None,
         text=dict(title="A Vindication of the Rights of Woman", author="Mary Wollstonecraft", edition="", publisher="Standard Ebooks", year="2024", orig="1792")),
    dict(id="classic-marx-engels-manifesto", repo="karl-marx_friedrich-engels_the-communist-manifesto_samuel-moore", files=None,
         text=dict(title="The Communist Manifesto", author="Karl Marx and Friedrich Engels", edition="trans. Samuel Moore", publisher="Standard Ebooks", year="2017", orig="1848")),
    dict(id="classic-du-bois-souls", repo="w-e-b-du-bois_the-souls-of-black-folk", files=None,
         text=dict(title="The Souls of Black Folk", author="W. E. B. Du Bois", edition="", publisher="Standard Ebooks", year="2021", orig="1903")),
    dict(id="classic-nietzsche-genealogy", repo="friedrich-nietzsche_the-genealogy-of-morals_horace-b-samuel", files=None,
         text=dict(title="The Genealogy of Morals", author="Friedrich Nietzsche", edition="trans. Horace B. Samuel", publisher="Standard Ebooks", year="2023", orig="1887")),
]
SKIP = {"titlepage", "imprint", "halftitlepage", "colophon", "uncopyright", "endnotes", "loi"}

BUILD = r"""async ({ id, files, endnotes, flatten }) => {
  const XH = "http://www.w3.org/1999/xhtml", P = new DOMParser();
  const parse = (s) => P.parseFromString(s.replace(/⁠/g, ""), "application/xhtml+xml");
  const et = (el) => (el && el.getAttribute && el.getAttribute("epub:type")) || "";
  const docs = files.map(parse), EN = endnotes ? parse(endnotes) : null;
  const notes = new Map(); if (EN) for (const li of EN.getElementsByTagName("li")) if (li.getAttribute("id")) notes.set(li.getAttribute("id"), li);
  const num = new Map();
  const isTitlePart = (el) => el.localName === "p" && /(^|\s)(title|subtitle|se:bridgehead)(\s|$)/.test(et(el));
  // a heading and the title lines grouped with it become one heading: "I. Of Our Spiritual Strivings", "First Essay: ..."
  const merge = (d, h, parts) => {
    for (const p of parts) {
      const extra = p.textContent.replace(/\s+/g, " ").trim(), base = h.textContent.replace(/\s+/g, " ").trim();
      if (!extra) { p.remove(); continue; }
      if (base.length + extra.length > 220) continue; // too long for one heading: the line stays below it
      const tail = h.lastChild; if (tail && tail.nodeType === 3) tail.nodeValue = tail.nodeValue.replace(/\s+$/, "");
      h.appendChild(d.createTextNode(/\)$/.test(base) ? " " : /ordinal/.test(et(h)) ? ". " : ": "));
      while (p.firstChild) h.appendChild(p.firstChild);
      p.remove();
    }
    const last = h.lastChild; if (last && last.nodeType === 3) last.nodeValue = last.nodeValue.replace(/\.\s*$/, "");
  };
  for (const d of docs) {
    for (const a of [...d.getElementsByTagName("a")]) {
      if (!/noteref/.test(et(a))) continue;
      const nid = (a.getAttribute("href") || "").split("#")[1];
      if (!nid || !notes.has(nid)) { a.remove(); continue; }
      if (!num.has(nid)) num.set(nid, num.size + 1);
      const sup = d.createElementNS(XH, "sup"); sup.textContent = String(num.get(nid)); a.replaceWith(sup);
    }
    for (const table of [...d.getElementsByTagName("table")]) {
      const rows = [...table.getElementsByTagName("tr")];
      if (!rows.some((tr) => [...tr.children].some((td) => /persona/.test(et(td))))) continue;
      const out = [];
      for (const tr of rows) {
        const tds = [...tr.children], who = tds.find((td) => /persona/.test(et(td))), say = tds.find((td) => td !== who);
        const name = who ? who.textContent.replace(/\s+/g, " ").trim() : "";
        const lead = (p) => { if (!name) return; const i = d.createElementNS(XH, "i"); i.textContent = name + ":"; p.insertBefore(d.createTextNode(" "), p.firstChild); p.insertBefore(i, p.firstChild); };
        const paras = say ? [...say.children].filter((c) => c.localName === "p" || c.localName === "blockquote") : [];
        if (paras.length) paras.forEach((p, k) => { if (k === 0 && p.localName === "p") lead(p); out.push(p); });
        else if (say) { const p = d.createElementNS(XH, "p"); while (say.firstChild) p.appendChild(say.firstChild); lead(p); out.push(p); }
      }
      table.replaceWith(...out);
    }
    for (const g of [...d.getElementsByTagName("hgroup")]) {
      const h = [...g.children].find((c) => /^h[1-6]$/.test(c.localName));
      if (h) merge(d, h, [...g.children].filter(isTitlePart));
      g.replaceWith(...g.childNodes);
    }
    for (const g of [...d.getElementsByTagName("header")]) {
      const h = [...g.children].find((c) => /^h[1-6]$/.test(c.localName));
      if (h) merge(d, h, [...g.children].filter(isTitlePart));
      g.replaceWith(...g.childNodes);
    }
    for (const el of [...d.getElementsByTagName("*")]) {
      if (!/z3998:(verse|poem|song|hymn|lyrics)/.test(et(el))) continue;
      for (const br of [...el.getElementsByTagName("br")]) br.replaceWith(d.createTextNode(" / "));
    }
    for (const f of [...d.getElementsByTagName("figure")]) {
      const cap = f.getElementsByTagName("figcaption")[0];
      if (cap && cap.textContent.trim()) { const p = d.createElementNS(XH, "p"); while (cap.firstChild) p.appendChild(cap.firstChild); f.replaceWith(p); } else f.remove();
    }
  }
  // works collected in one book (Descartes): each work's title above its parts, and the parts as the chapters
  if (flatten) for (const d of docs) {
    const hs = [...d.getElementsByTagName("*")].filter((el) => /^h[1-6]$/.test(el.localName));
    const top = hs.find((h) => h.localName === "h2"), name = top ? top.textContent.replace(/\s+/g, " ").trim() : "";
    for (const h of hs) {
      const lv = h.localName === "h2" ? 1 : 2, txt = h.textContent.replace(/\s+/g, " ").trim();
      if (h !== top && name.startsWith(txt)) { h.remove(); continue; } // the work's title repeated over its text
      if (+h.localName[1] === lv) continue;
      const n = d.createElementNS(XH, "h" + lv); while (h.firstChild) n.appendChild(h.firstChild); h.replaceWith(n);
    }
  }
  // the notes this book refers to, in order, numbered from 1
  const all = [...docs];
  if (EN && num.size) {
    const ol = EN.getElementsByTagName("ol")[0], keep = [...num.entries()].sort((a, b) => a[1] - b[1]);
    for (const li of [...ol.children]) li.remove();
    for (const [nid, k] of keep) {
      const li = notes.get(nid);
      for (const a of [...li.getElementsByTagName("a")]) if (/backlink/.test(et(a))) a.remove();
      li.setAttribute("epub:type", "endnote"); // a few notes lack it; every note is read as one
      for (const q of [...li.getElementsByTagName("blockquote")]) q.replaceWith(...q.childNodes); // a note that quotes: still a note
      const p = li.getElementsByTagName("p")[0] || li;
      p.insertBefore(EN.createTextNode(`${k}. `), p.firstChild);
      ol.appendChild(li);
    }
    const h = EN.getElementsByTagName("h2")[0]; if (h) h.textContent = "Notes";
    all.push(EN);
  }
  const blocks = [];
  for (const d of all) { const b = d.getElementsByTagName("body")[0]; if (b) domToBlocks(b, blocks); }
  const fin = finalize(blocks), secs = makeSections(fin);
  // stable section ids, so a rebuilt book keeps them
  const ids = new Map(secs.map((s, k) => [s.id, `${id}-s${k + 1}`]));
  fin.forEach((b) => { if (b.s && ids.has(b.s)) b.s = ids.get(b.s); });
  // a chapter's name in the list: no note numbers, and cut at a word if it is long
  const label = (x) => { x = x.replace(/[⁰¹²³⁴⁵⁶⁷⁸⁹]+/g, "").replace(/\s+/g, " ").trim(); if (x.length <= 90) return x; const c = x.lastIndexOf(" ", 86); return x.slice(0, c > 40 ? c : 86).replace(/[,;:.]$/, "") + "…"; };
  const sections = secs.map((s) => { const b = fin.find((x) => x.s === ids.get(s.id)); return { id: ids.get(s.id), label: label(b ? plain(b.x) : s.label), done: false }; });
  return { blocks: fin, sections, lang: guessLang(fin), notes: num.size };
}"""

def clone(url, dest):
    if not dest.exists():
        dest.parent.mkdir(parents=True, exist_ok=True)
        subprocess.run(["git", "clone", "-q", "--depth", "1", url, str(dest)], check=True)

def spine(repo):
    opf = (SE / repo / "src/epub/content.opf").read_text(encoding="utf-8")
    return [re.sub(r"\.xhtml$", "", m) for m in re.findall(r'<itemref idref="([^"]+)"', opf)]

async def cover(browser, bk, path):
    svg = (SE / bk["repo"] / "src/epub/images/cover.svg").read_text(encoding="utf-8")
    page = await browser.new_page(viewport={"width": 400, "height": 600})
    if bk.get("cover"):
        art = re.search(r'xlink:href="(data:image/jpeg;base64,[^"]+)"', svg).group(1)
        font = lambda w: "data:font/woff2;base64," + base64.b64encode((FONT / f"LeagueSpartan-{w}.woff2").read_bytes()).decode()
        c = bk["cover"]
        await page.set_content(f"""<style>@font-face{{font-family:LS;font-weight:700;src:url({font('Bold')})}}@font-face{{font-family:LS;font-weight:600;src:url({font('SemiBold')})}}
          body{{margin:0;width:400px;height:600px;position:relative;background:url({art}) center/cover}}
          .box{{position:absolute;left:15px;right:15px;bottom:15px;background:rgba(0,0,0,.75);color:#fff;text-align:center;padding:20px 18px 22px}}
          h1{{margin:0;font:700 {c['size']}px/1.08 LS;text-transform:uppercase;letter-spacing:.01em}} p{{margin:12px 0 0;font:600 14px/1 LS;text-transform:uppercase;letter-spacing:.06em}}</style>
          <body><div class="box"><h1>{c['title']}</h1><p>{bk['text']['author']}</p></div></body>""")
        await page.evaluate("document.fonts.ready")
    else:
        await page.set_content(f'<body style="margin:0"><img style="width:400px;height:600px;display:block" src="data:image/svg+xml;base64,{base64.b64encode(svg.encode()).decode()}"></body>')
    await page.wait_for_timeout(400)
    await page.screenshot(path=str(path), type="jpeg", quality=82)
    await page.close()

async def main(only):
    books = [b for b in BOOKS if not only or b["id"] in only]
    for bk in books: clone(f"https://github.com/standardebooks/{bk['repo']}", SE / bk["repo"])
    if any(b.get("cover") for b in books): clone("https://github.com/theleagueof/league-spartan", FONT.parent.parent)
    OUT.mkdir(parents=True, exist_ok=True)
    srv = subprocess.Popen([sys.executable, "-m", "http.server", str(PORT), "-d", str(APP)], stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
    time.sleep(1)
    try:
        async with async_playwright() as p:
            browser = await p.chromium.launch()
            page = await browser.new_page()
            await page.route(re.compile(r"^https://(fonts|cdnjs|commons)\."), lambda r: r.abort())
            await page.goto(f"http://localhost:{PORT}/index.html"); await page.wait_for_function("typeof domToBlocks === 'function'")
            for bk in books:
                text_dir = SE / bk["repo"] / "src/epub/text"
                names = bk.get("files") or [n for n in spine(bk["repo"]) if n not in SKIP]
                files = [(text_dir / f"{n}.xhtml").read_text(encoding="utf-8") for n in names]
                en = text_dir / "endnotes.xhtml"
                r = await page.evaluate(BUILD, {"id": bk["id"], "flatten": bool(bk.get("flatten")), "files": files, "endnotes": en.read_text(encoding="utf-8") if en.exists() else None})
                for s in r["sections"]:
                    if bk.get("partOf") and re.fullmatch(r"Part [IVX]+", s["label"]): s["label"] = f'{bk["partOf"]}, {s["label"]}'
                rec = {**{k: v for k, v in bk["text"].items() if v}, "lang": r["lang"], "sections": r["sections"],
                       "source": {"name": "Standard Ebooks", "kind": "EPUB", "pages": 0}}
                (OUT / f"{bk['id']}.json").write_text(json.dumps({"text": rec, "content": r["blocks"]}, ensure_ascii=False, separators=(",", ":")), encoding="utf-8")
                await cover(browser, bk, OUT / f"{bk['id']}.jpg")
                print(f"{bk['id']}: {len(r['blocks'])} blocks, {r['notes']} notes, {len(r['sections'])} chapters, {(OUT / (bk['id'] + '.json')).stat().st_size // 1024} KB")
            await browser.close()
    finally:
        srv.terminate()

asyncio.run(main(set(sys.argv[1:])))
