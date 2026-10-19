"""Builds the classics that come with Marginalia (data/books/<id>.json and <id>.jpg), mostly from Standard Ebooks editions.

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
A work Standard Ebooks hasn't produced comes from a plain-text transcription of a public-domain translation (`text`: a git
repository and file, with a converter here that drops the transcription's license header and footer, finds the headings,
turns its starred footnotes into numbered ones and straight quotes and spaced hyphens into curly quotes and dashes), and
gets a cover drawn here. After building, add a new book's id to CLASSICS in js/boot.js.
"""
import asyncio, base64, json, re, subprocess, sys, time
from pathlib import Path
from playwright.async_api import async_playwright

APP = Path(__file__).resolve().parent.parent
CACHE = APP / "tests" / ".cache"
SE = CACHE / "se"
TEXTS = CACHE / "texts"
FONT = CACHE / "league-spartan" / "fonts" / "webfonts"
OUT = APP / "data" / "books"
PORT = 8821

# repo: github.com/standardebooks/<repo>. files: the XHTML files to take, in order (default: the whole spine but the
# front and back matter). cover: a title for a cover drawn here, when the edition's own cover names the larger volume.
# drop: CSS selectors for parts of those files left out (the Republic leaves out Jowett's book-length Introduction and Analysis,
# and with it the heading that only told the dialogue from the introduction).
BOOKS = [
    dict(id="classic-plato-socrates", repo="plato_dialogues_benjamin-jowett", files=["euthyphro", "apology", "crito", "phaedo"], cover=dict(title="Euthyphro, Apology, Crito, Phaedo", size=31),
         text=dict(title="Euthyphro, Apology, Crito, Phaedo", author="Plato", edition="trans. Benjamin Jowett", publisher="Standard Ebooks", year="2022", orig="")),
    dict(id="classic-aristotle-ethics", repo="aristotle_nicomachean-ethics_f-h-peters", files=None, skip={"foreword"},
         text=dict(title="Nicomachean Ethics", author="Aristotle", edition="trans. F. H. Peters", publisher="Standard Ebooks", year="2018", orig="")),
    dict(id="classic-hobbes-leviathan", repo="thomas-hobbes_leviathan", files=None, parts=True,
         text=dict(title="Leviathan", author="Thomas Hobbes", edition="", publisher="Standard Ebooks", year="2024", orig="1651")),
    dict(id="classic-descartes-meditations", repo="rene-descartes_philosophical-works_john-veitch", files=["discourse-on-the-method", "meditations-on-the-first-philosophy"], flatten=True, partOf="Discourse", cover=dict(title="Discourse on the Method and Meditations on First Philosophy", size=25),
         text=dict(title="Discourse on the Method and Meditations on First Philosophy", author="René Descartes", edition="trans. John Veitch", publisher="Standard Ebooks", year="2025", orig="1637–41")),
    dict(id="classic-hume-enquiry", repo="david-hume_an-enquiry-concerning-human-understanding", files=None,
         text=dict(title="An Enquiry Concerning Human Understanding", author="David Hume", edition="", publisher="Standard Ebooks", year="2024", orig="1748")),
    dict(id="classic-kant-groundwork", text_source=dict(repo="https://github.com/GITenberg/Fundamental-Principles-of-the-Metaphysic-of-Morals_5682", file="5682.txt", convert="kant_groundwork"),
         cover=dict(title="Fundamental Principles of the Metaphysic of Morals", size=25, art="stars"),
         text=dict(title="Fundamental Principles of the Metaphysic of Morals", author="Immanuel Kant", edition="trans. Thomas Kingsmill Abbott", orig="1785")),
    dict(id="classic-rousseau-social-contract", repo="jean-jacques-rousseau_the-social-contract_g-d-h-cole", files=None,
         text=dict(title="The Social Contract", author="Jean-Jacques Rousseau", edition="trans. G. D. H. Cole", publisher="Standard Ebooks", year="2024", orig="1762")),
    dict(id="classic-wollstonecraft-vindication", repo="mary-wollstonecraft_a-vindication-of-the-rights-of-woman", files=None,
         text=dict(title="A Vindication of the Rights of Woman", author="Mary Wollstonecraft", edition="", publisher="Standard Ebooks", year="2024", orig="1792")),
    dict(id="classic-marx-engels-manifesto", repo="karl-marx_friedrich-engels_the-communist-manifesto_samuel-moore", files=None,
         text=dict(title="The Communist Manifesto", author="Karl Marx and Friedrich Engels", edition="trans. Samuel Moore", publisher="Standard Ebooks", year="2017", orig="1848")),
    dict(id="classic-cooper-voice", repo="anna-julia-cooper_a-voice-from-the-south", files=None, parts=True,
         text=dict(title="A Voice from the South", author="Anna Julia Cooper", edition="", publisher="Standard Ebooks", year="2024", orig="1892")),
    dict(id="classic-du-bois-souls", repo="w-e-b-du-bois_the-souls-of-black-folk", files=None,
         text=dict(title="The Souls of Black Folk", author="W. E. B. Du Bois", edition="", publisher="Standard Ebooks", year="2021", orig="1903")),
    dict(id="classic-plato-republic", repo="plato_dialogues_benjamin-jowett", files=["republic"], drop=["[id='republic-introduction']", "[id='republic-text'] > h3"], cover=dict(title="The Republic", size=44),
         text=dict(title="The Republic", author="Plato", edition="trans. Benjamin Jowett", publisher="Standard Ebooks", year="2022", orig="")),
    dict(id="classic-mill-liberty", repo="john-stuart-mill_on-liberty", files=None,
         text=dict(title="On Liberty", author="John Stuart Mill", edition="with an introduction by W. L. Courtney", publisher="Standard Ebooks", year="2017", orig="1859")),
    dict(id="classic-russell-problems", repo="bertrand-russell_the-problems-of-philosophy", files=None,
         text=dict(title="The Problems of Philosophy", author="Bertrand Russell", edition="", publisher="Standard Ebooks", year="2019", orig="1912")),
    dict(id="classic-nietzsche-genealogy", repo="friedrich-nietzsche_the-genealogy-of-morals_horace-b-samuel", files=None,
         text=dict(title="The Genealogy of Morals", author="Friedrich Nietzsche", edition="trans. Horace B. Samuel", publisher="Standard Ebooks", year="2023", orig="1887")),
]
SKIP = {"titlepage", "imprint", "halftitlepage", "colophon", "uncopyright", "endnotes", "loi"}

BUILD = r"""async ({ id, files, endnotes, flatten, parts, drop }) => {
  const XH = "http://www.w3.org/1999/xhtml", P = new DOMParser();
  const parse = (s) => P.parseFromString(s.replace(/\u2060/g, ""), "application/xhtml+xml");
  const et = (el) => (el && el.getAttribute && el.getAttribute("epub:type")) || "";
  const docs = files.map(parse), EN = endnotes ? parse(endnotes) : null;
  for (const d of docs) for (const sel of drop || []) d.querySelectorAll(sel).forEach((el) => el.remove()); // parts left out (an editor's long introduction)
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
  // a book in parts whose chapters are the units (Hobbes, Cooper): each part's title above, its chapters as the chapters
  if (parts) docs.forEach((d, k) => {
    for (const h of [...d.getElementsByTagName("*")].filter((el) => /^h[2-5]$/.test(el.localName))) {
      const lv = +h.localName[1], to = parts[k] ? (lv === 2 ? 1 : lv) : lv >= 3 ? lv - 1 : lv;
      if (to === lv) continue;
      const n = d.createElementNS(XH, "h" + to); while (h.firstChild) n.appendChild(h.firstChild); h.replaceWith(n);
    }
  });
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
  const fin = finalize(blocks);
  // in parts, the chapters (now the second level) are the chapters, though there are fewer than three parts above them
  if (parts) fin.forEach((b, k) => { if (b.k === "h" && (b.l || 2) === 2) b.s = "c" + k; });
  const secs = makeSections(fin);
  // stable section ids, so a rebuilt book keeps them
  const ids = new Map(secs.map((s, k) => [s.id, `${id}-s${k + 1}`]));
  fin.forEach((b) => { if (b.s && ids.has(b.s)) b.s = ids.get(b.s); });
  // a chapter's name in the list: no note numbers, and cut at a word if it is long
  const label = (x) => { x = x.replace(/[⁰¹²³⁴⁵⁶⁷⁸⁹]+/g, "").replace(/\s+/g, " ").trim(); if (x.length <= 90) return x; const c = x.lastIndexOf(" ", 86); return x.slice(0, c > 40 ? c : 86).replace(/[,;:.]$/, "") + "…"; };
  const sections = secs.map((s) => { const b = fin.find((x) => x.s === ids.get(s.id)); return { id: ids.get(s.id), label: label(b ? plain(b.x) : s.label), done: false }; });
  return { blocks: fin, sections, lang: guessLang(fin), notes: num.size };
}"""

def typo(x):
    """Curly quotes and dashes for a plain ASCII transcription ("word- word" was its dash)."""
    x = re.sub(r"(?<=\S)- (?=\S)", "—", x)
    x = re.sub(r'(^|[\s(\[—])"', r"\1“", x).replace('"', "”")
    x = re.sub(r"(?<=\w)'(?=\w)", "’", x)
    x = re.sub(r"(^|[\s(\[—“])'", r"\1‘", x).replace("'", "’")
    return x

def esc(x):
    return x.replace("&", "&amp;").replace("<", "&lt;").replace(">", "&gt;")

SMALL = {"a", "an", "and", "as", "at", "by", "for", "from", "in", "of", "on", "or", "the", "to", "which", "is", "be", "can", "all"}
def title_case(x):
    words = x.lower().split()
    return " ".join(w if k and w in SMALL else w[:1].upper() + w[1:] for k, w in enumerate(words))

def kant_groundwork(raw):
    """Abbott's translation of the Groundwork, from a plain-text transcription: one XHTML document."""
    t = raw.replace("\r\n", "\n")
    t = t[t.index("\n", t.index("*** START")) + 1:t.index("*** END")]
    blocks = [b for b in re.split(r"\n\s*\n", t) if b.strip()]
    norm = lambda b: " ".join(b.split())
    start = next(k for k, b in enumerate(blocks) if norm(b) == "PREFACE")
    sections = {"FIRST SECTION": "First Section", "SECOND SECTION": "Second Section", "THIRD SECTION": "Third Section"}
    subheads = ["The Autonomy of the Will as the Supreme Principle of Morality", "Heteronomy of the Will as the Source of all spurious Principles of Morality",
                "Classification of all Principles of Morality which can be founded on the Conception of Heteronomy",
                "The Concept of Freedom is the Key that explains the Autonomy of the Will", "Freedom must be presupposed as a Property of the Will of all Rational Beings",
                "Of the Interest attaching to the Ideas of Morality", "How is a Categorical Imperative Possible?", "Of the Extreme Limits of all Practical Philosophy", "Concluding Remark"]
    out, refs, notes, k, items = [], 0, 0, start, []
    def flush_items():
        if items: out.append("<ol>" + "".join(f"<li><p>{esc(typo(x))}</p></li>" for x in items) + "</ol>"); items.clear()
    while k < len(blocks):
        b, n = blocks[k], norm(blocks[k]); k += 1
        if re.fullmatch(r"SEC_\d", n) or n == "THE END": continue
        m = re.fullmatch(r"(\d) (FIRST|SECOND|THIRD) SECTION\. (.*)", n)
        if m: items.append(f"{sections[m.group(2) + ' SECTION']}. {m.group(3)}"); continue
        flush_items()
        if n == "PREFACE": out.append("<h2>Preface</h2>"); continue
        if n in sections:
            sub = []
            while k < len(blocks) and blocks[k].startswith(" ") and norm(blocks[k]).isupper(): sub.append(norm(blocks[k])); k += 1
            out.append(f"<h2>{sections[n]}: {esc(title_case(' '.join(sub)))}</h2>"); continue
        head = next((h for h in subheads for j in range(3) if " ".join(norm(x) for x in blocks[k - 1:k - 1 + j + 1]).rstrip(".") == h), None)
        if head:
            for j in range(3):  # the heading's other lines
                if " ".join(norm(x) for x in blocks[k - 1:k + j]).rstrip(".") == head: k += j; break
            out.append(f"<h3>{esc(head)}</h3>"); continue
        if n.startswith("* "):
            notes += 1
            out.append(f'<aside epub:type="footnote"><p>{notes}. {esc(typo(n[2:]))}</p></aside>'); continue
        def ref(_):
            nonlocal refs
            refs += 1
            return f"<sup>{refs}</sup>"
        out.append("<p>" + re.sub(r" \*(?=[\s.,;:)]|$)", ref, esc(typo(n))) + "</p>")
    flush_items()
    assert refs == notes, (refs, notes)
    return f'<?xml version="1.0" encoding="utf-8"?><html xmlns="http://www.w3.org/1999/xhtml" xmlns:epub="http://www.idpf.org/2007/ops"><head><title>Groundwork</title></head><body>{"".join(out)}</body></html>'

CONVERT = {"kant_groundwork": kant_groundwork}

def clone(url, dest):
    if not dest.exists():
        dest.parent.mkdir(parents=True, exist_ok=True)
        subprocess.run(["git", "clone", "-q", "--depth", "1", url, str(dest)], check=True)

def spine(repo):
    opf = (SE / repo / "src/epub/content.opf").read_text(encoding="utf-8")
    return [re.sub(r"\.xhtml$", "", m) for m in re.findall(r'<itemref idref="([^"]+)"', opf)]

STARS = """<canvas id="sky" width="400" height="600" style="position:absolute;inset:0"></canvas><script>
  const c = document.getElementById("sky").getContext("2d"), g = c.createRadialGradient(200, 170, 30, 200, 300, 460);
  g.addColorStop(0, "#2a3c63"); g.addColorStop(1, "#090d1a"); c.fillStyle = g; c.fillRect(0, 0, 400, 600);
  let seed = 1785; const rnd = () => (seed = (seed * 16807) % 2147483647) / 2147483647;
  for (let i = 0; i < 300; i++) { const x = rnd() * 400, y = rnd() * 600, z = rnd(); c.globalAlpha = 0.3 + 0.7 * z * z; c.fillStyle = "#fff"; c.beginPath(); c.arc(x, y, 0.35 + 1.4 * z * z * z, 0, 7); c.fill(); }
</script>"""

async def cover(browser, bk, path):
    svg = (SE / bk["repo"] / "src/epub/images/cover.svg").read_text(encoding="utf-8") if bk.get("repo") else ""
    page = await browser.new_page(viewport={"width": 400, "height": 600})
    if bk.get("cover"):
        art = "none" if bk["cover"].get("art") == "stars" else "url(" + re.search(r'xlink:href="(data:image/jpeg;base64,[^"]+)"', svg).group(1) + ") center/cover"
        font = lambda w: "data:font/woff2;base64," + base64.b64encode((FONT / f"LeagueSpartan-{w}.woff2").read_bytes()).decode()
        c = bk["cover"]
        await page.set_content(f"""<style>@font-face{{font-family:LS;font-weight:700;src:url({font('Bold')})}}@font-face{{font-family:LS;font-weight:600;src:url({font('SemiBold')})}}
          body{{margin:0;width:400px;height:600px;position:relative;background:{art}}}
          .box{{position:absolute;left:15px;right:15px;bottom:15px;background:rgba(0,0,0,.75);color:#fff;text-align:center;padding:20px 18px 22px}}
          h1{{margin:0;font:700 {c['size']}px/1.08 LS;text-transform:uppercase;letter-spacing:.01em}} p{{margin:12px 0 0;font:600 14px/1 LS;text-transform:uppercase;letter-spacing:.06em}}</style>
          <body>{STARS if c.get('art') == 'stars' else ''}<div class="box"><h1>{c['title']}</h1><p>{bk['text']['author']}</p></div></body>""")
        await page.evaluate("document.fonts.ready")
    else:
        await page.set_content(f'<body style="margin:0"><img style="width:400px;height:600px;display:block" src="data:image/svg+xml;base64,{base64.b64encode(svg.encode()).decode()}"></body>')
    await page.wait_for_timeout(400)
    await page.screenshot(path=str(path), type="jpeg", quality=82)
    await page.close()

async def main(only):
    books = [b for b in BOOKS if not only or b["id"] in only]
    for bk in books:
        if bk.get("repo"): clone(f"https://github.com/standardebooks/{bk['repo']}", SE / bk["repo"])
        else: clone(bk["text_source"]["repo"], TEXTS / bk["id"])
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
                if bk.get("repo"):
                    text_dir = SE / bk["repo"] / "src/epub/text"
                    names = bk.get("files") or [n for n in spine(bk["repo"]) if n not in SKIP | bk.get("skip", set())]
                    files = [(text_dir / f"{n}.xhtml").read_text(encoding="utf-8") for n in names]
                    en = text_dir / "endnotes.xhtml"; endnotes = en.read_text(encoding="utf-8") if en.exists() else None
                else:
                    names = []
                    ts = bk["text_source"]
                    files, endnotes = [CONVERT[ts["convert"]]((TEXTS / bk["id"] / ts["file"]).read_text(encoding="latin-1"))], None
                r = await page.evaluate(BUILD, {"id": bk["id"], "flatten": bool(bk.get("flatten")), "files": files, "endnotes": endnotes, "drop": bk.get("drop") or [],
                                                "parts": [n.startswith("part-") for n in names] if bk.get("parts") else None})
                for s in r["sections"]:
                    if bk.get("partOf") and re.fullmatch(r"Part [IVX]+", s["label"]): s["label"] = f'{bk["partOf"]}, {s["label"]}'
                rec = {**{k: v for k, v in bk["text"].items() if v}, "lang": r["lang"], "sections": r["sections"],
                       "source": {"name": "Standard Ebooks", "kind": "EPUB", "pages": 0} if bk.get("repo") else {"name": "a public-domain transcription", "kind": "Text", "pages": 0}}
                (OUT / f"{bk['id']}.json").write_text(json.dumps({"text": rec, "content": r["blocks"]}, ensure_ascii=False, separators=(",", ":")), encoding="utf-8")
                await cover(browser, bk, OUT / f"{bk['id']}.jpg")
                print(f"{bk['id']}: {len(r['blocks'])} blocks, {r['notes']} notes, {len(r['sections'])} chapters, {(OUT / (bk['id'] + '.json')).stat().st_size // 1024} KB")
            await browser.close()
    finally:
        srv.terminate()

asyncio.run(main(set(sys.argv[1:])))
