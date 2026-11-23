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
A work Standard Ebooks hasn't produced comes from a Project Gutenberg EPUB of a public-domain translation (`epub_source`: kept in
tests/.cache/gutenberg, fetched from gutenberg.org when missing; its page numbers become page breaks and its footnotes endnotes),
or from a plain-text transcription of one (`text`: a git
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
    dict(id="classic-boethius-consolation", repo="boethius_the-consolation-of-philosophy_h-r-james", files=None,
         text=dict(title="The Consolation of Philosophy", author="Boethius", edition="trans. H. R. James (1897)", publisher="Standard Ebooks", year="2023", orig="")),
    dict(id="classic-berkeley-dialogues", text_source=dict(repo="https://github.com/GITenberg/Three-Dialogues-Between-Hylas-and-Philonous-in-Opposition-to-Sceptics-and-Atheists_4724", file="4724.txt", convert="berkeley_dialogues"),
         cover=dict(title="Three Dialogues Between Hylas and Philonous", size=30, art="stars"),
         text=dict(title="Three Dialogues Between Hylas and Philonous", author="George Berkeley", publisher="Project Gutenberg", edition="ebook 4724", orig="1713")),
    dict(id="classic-shelley-frankenstein", repo="mary-shelley_frankenstein", files=None,
         text=dict(title="Frankenstein", author="Mary Shelley", edition="revised 1831 text", publisher="Standard Ebooks", year="2015", orig="1818")),
    dict(id="classic-dostoevsky-underground", repo="fyodor-dostoevsky_notes-from-underground_constance-garnett", files=None, parts=True,
         text=dict(title="Notes from Underground", author="Fyodor Dostoevsky", edition="trans. Constance Garnett", publisher="Standard Ebooks", year="2019", orig="1864")),
    dict(id="classic-plato-socrates", repo="plato_dialogues_benjamin-jowett", files=["euthyphro", "apology", "crito", "phaedo"], cover=dict(title="Euthyphro, Apology, Crito, Phaedo", size=31),
         text=dict(title="Euthyphro, Apology, Crito, Phaedo", author="Plato", edition="trans. Benjamin Jowett", publisher="Standard Ebooks", year="2022", orig="")),
    dict(id="classic-aristotle-ethics", repo="aristotle_nicomachean-ethics_f-h-peters", files=None, skip={"foreword"},
         text=dict(title="Nicomachean Ethics", author="Aristotle", edition="trans. F. H. Peters", publisher="Standard Ebooks", year="2018", orig="")),
    dict(id="classic-hobbes-leviathan", repo="thomas-hobbes_leviathan", files=None, parts=True,
         text=dict(title="Leviathan", author="Thomas Hobbes", edition="", publisher="Standard Ebooks", year="2024", orig="1651")),
    dict(id="classic-descartes-meditations", repo="rene-descartes_philosophical-works_john-veitch", files=["discourse-on-the-method", "meditations-on-the-first-philosophy"], flatten=True, partOf="Discourse", cover=dict(title="Discourse on the Method and Meditations on First Philosophy", size=25),
         text=dict(title="Discourse on the Method and Meditations on First Philosophy", author="René Descartes", edition="trans. John Veitch", publisher="Standard Ebooks", year="2025", orig="1637–41")),
    dict(id="classic-spinoza-ethics", text_source=dict(repo="https://github.com/GITenberg/Ethics_3800", file="3800.txt", convert="spinoza_ethics"),
         cover=dict(title="Ethics", size=40, art="stars"),
         text=dict(title="Ethics", author="Benedict de Spinoza", edition="trans. R. H. M. Elwes", orig="1677")),
    dict(id="classic-hume-treatise", repo="david-hume_a-treatise-of-human-nature", files=None,
         text=dict(title="A Treatise of Human Nature", author="David Hume", edition="", publisher="Standard Ebooks", year="2026", orig="1739–40")),
    dict(id="classic-hume-enquiry", repo="david-hume_an-enquiry-concerning-human-understanding", files=None,
         text=dict(title="An Enquiry Concerning Human Understanding", author="David Hume", edition="", publisher="Standard Ebooks", year="2024", orig="1748")),
    dict(id="classic-kant-groundwork", text_source=dict(repo="https://github.com/GITenberg/Fundamental-Principles-of-the-Metaphysic-of-Morals_5682", file="5682.txt", convert="kant_groundwork"),
         cover=dict(title="Fundamental Principles of the Metaphysic of Morals", size=25, art="stars"),
         text=dict(title="Fundamental Principles of the Metaphysic of Morals", author="Immanuel Kant", edition="trans. Thomas Kingsmill Abbott", orig="1785")),
    dict(id="classic-kant-critique", text_source=dict(repo="https://github.com/GITenberg/The-Critique-of-Pure-Reason_4280", file="4280-0.txt", encoding="utf-8", convert="kant_critique"),
         cover=dict(title="Critique of Pure Reason", size=40, art="stars"),
         text=dict(title="Critique of Pure Reason", author="Immanuel Kant", edition="trans. J. M. D. Meiklejohn", orig="1781–87")),
    # Ross's translation (W. D. Ross died 1971) as the Internet Classics Archive transcribes it (classics.mit.edu, metaphysics.mb.txt), taken
    # from a git repository's first commit, which keeps that file's words, spelling and punctuation and only splits it by book. A later commit
    # of the same repository marks the verse quotations; it is read only to tell verse lines from prose (its own wording is edited, so unused).
    dict(id="classic-aristotle-metaphysics", text_source=dict(repo="https://github.com/jeonghyeon-net/metaphysics", commit="dd0af2399591ffd0be8e851a105d9d2b31775db6",
         files=[f"books/book-{i:02d}.md" for i in range(1, 15)], verse_commit="8dc2dc1", verse_dir="en/", encoding="utf-8", convert="aristotle_metaphysics"),
         cover=dict(title="Metaphysics", size=44, art="stars"),
         text=dict(title="Metaphysics", author="Aristotle", edition="trans. W. D. Ross", orig="")),
    # Dakyns's translation (The Works of Xenophon, vol. III, part 1, Macmillan, 1897; H. G. Dakyns died 1911), as Project Gutenberg
    # transcribes it (ebook 1177), from its GITenberg repository.
    dict(id="classic-xenophon-memorabilia", text_source=dict(repo="https://github.com/GITenberg/The-Memorabilia_1177", file="1177.txt", convert="xenophon_memorabilia"),
         cover=dict(title="Memorabilia", size=44, art="stars"),
         text=dict(title="Memorabilia", author="Xenophon", edition="trans. H. G. Dakyns", orig="")),
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
    dict(id="classic-freud-pleasure", epub_source=dict(file="pg76031-images-3.epub", url="https://www.gutenberg.org/cache/epub/76031/pg76031-images-3.epub", convert="gutenberg_epub"),
         cover=dict(title="Beyond the Pleasure Principle", size=36, art="stars"),
         text=dict(title="Beyond the Pleasure Principle", author="Sigmund Freud", edition="trans. C. J. M. Hubback, with an editorial preface by Ernest Jones", orig="1920")),
    dict(id="classic-freud-dreams", epub_source=dict(file="pg66048-images-3.epub", url="https://www.gutenberg.org/cache/epub/66048/pg66048-images-3.epub", convert="gutenberg_epub"),
         cover=dict(title="The Interpretation of Dreams", size=36, art="stars"),
         text=dict(title="The Interpretation of Dreams", author="Sigmund Freud", edition="trans. A. A. Brill", orig="1900")),
    dict(id="classic-nietzsche-beyond", repo="friedrich-nietzsche_beyond-good-and-evil_helen-zimmern", files=None,
         text=dict(title="Beyond Good and Evil", author="Friedrich Nietzsche", edition="trans. Helen Zimmern", publisher="Standard Ebooks", year="2014", orig="1886")),
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

HYPHEN_PREFIX = {"self", "non", "high", "first", "last", "over", "fellow", "house", "hunting", "well", "ill", "half", "long", "ever", "all", "free"}
HYPHEN_PAIRS = {("full", "flavored"), ("two", "footed"), ("not", "being"), ("above", "named"), ("weak", "minded"), ("grown", "up"), ("fault", "finding")}
ETHICS_PARTS = {"I": "Concerning God", "II": "On the Nature and Origin of the Mind", "III": "On the Origin and Nature of the Emotions",
                "IV": "Of Human Bondage, or the Strength of the Emotions", "V": "Of the Power of the Understanding, or of Human Freedom"}
ETHICS_HEADS = {"DEFINITIONS": "Definitions", "AXIOMS": "Axioms", "AXIOM": "Axiom", "PROPOSITIONS": "Propositions", "POSTULATES": "Postulates",
                "PREFACE": "Preface", "APPENDIX": "Appendix", "DEFINITIONS OF THE EMOTIONS": "Definitions of the Emotions",
                "GENERAL DEFINITION OF THE EMOTIONS": "General Definition of the Emotions"}
def spinoza_ethics(raw):
    """Elwes's translation of the Ethics (1883), from a plain-text transcription: one XHTML document. Each part is a chapter, its
    definitions, axioms, propositions, postulates, preface and appendix headings within it; every definition, axiom, proposition,
    proof, corollary and note stays its own paragraph, opening with its label (PROP. V., Corollary II., Note.), which is how the
    reference articles find it. The transcription's "--" is a dash, or the hyphen of a compound (self--evident); its bracketed
    endnotes become footnotes after the paragraph that cites them."""
    t = raw.replace("\r\n", "\n")
    t = t[t.index("\n", t.index("*** START")) + 1:t.index("*** END")]
    t = t[:t.rindex("End of the Project Gutenberg")] if "End of the Project Gutenberg" in t else t
    blocks = [" ".join(b.split()) for b in re.split(r"\n\s*\n", t) if b.strip()]
    start = next(k for k, b in enumerate(blocks) if b.startswith("PART I."))
    blocks = blocks[:next(k for k, b in enumerate(blocks) if b == "End of the Ethics by Benedict de Spinoza")]  # the endnotes repeat after it
    def dash(m):
        a, b = m.group(1), m.group(2)
        return f"{a}-{b}" if a.lower() in HYPHEN_PREFIX or (a.lower(), b) in HYPHEN_PAIRS else f"{a}—{b}"
    def fix(x):
        x = re.sub(r"(\w+)--(\w+)", dash, x)
        x = x.replace("----", "—").replace("--", "—")
        return typo(x)
    out, k, refs, notes = [], start, [], []
    while k < len(blocks):
        b = blocks[k]; k += 1
        m = re.fullmatch(r"PART ([IV]+)[.:] ?(CONCERNING GOD\.)?", b, re.I)
        if m:
            roman = m.group(1).upper()
            if not m.group(2) and k < len(blocks) and blocks[k].upper().rstrip(".") == ETHICS_PARTS[roman].upper().rstrip("."): k += 1
            out.append(f"<h2>Part {roman}: {esc(ETHICS_PARTS[roman])}</h2>"); continue
        h = ETHICS_HEADS.get(b.rstrip(".:"))
        if h: out.append(f"<h3>{h}</h3>"); continue
        m = re.match(r"\[(\d+)\] (.*)", b)
        if m:  # an endnote, printed after the paragraph citing it
            x = m.group(2)
            while k < len(blocks) and re.match(r'"?(Speremus|Ferreus) ', blocks[k]):  # note 9's two lines of Ovid
                x += " / " + blocks[k]; k += 1
            notes.append(int(m.group(1)))
            out.append(f'<aside epub:type="footnote"><p>{m.group(1)}. {esc(fix(x))}</p></aside>'); continue
        refs += [int(n) for n in re.findall(r"\[(\d+)\]", b)]
        out.append("<p>" + re.sub(r"\[(\d+)\]", lambda m: f"<sup>{m.group(1)}</sup>", esc(fix(b))) + "</p>")
    assert refs == notes == list(range(1, 18)), (refs, notes)
    return f'<?xml version="1.0" encoding="utf-8"?><html xmlns="http://www.w3.org/1999/xhtml" xmlns:epub="http://www.idpf.org/2007/ops"><head><title>Ethics</title></head><body>{"".join(out)}</body></html>'

# Kant's Critique of Pure Reason: Meiklejohn's headings as the app shows them, by level. Each entry: a test on the heading's text
# (its lines joined), the level, and the title shown. A heading the table doesn't name keeps its own words at the level of the
# headings around it (see kant_critique).
CPR_PARTS = [  # the chapters (level 2)
    (r"PREFACE TO THE FIRST EDITION", "Preface to the First Edition (1781)"), (r"PREFACE TO THE SECOND EDITION", "Preface to the Second Edition (1787)"),
    (r"Introduction$", "Introduction"), (r"FIRST PART\. TRANSCENDENTAL AESTHETIC", "Transcendental Aesthetic"),
    (r"INTRODUCTION\. Idea of a Transcendental Logic", "Transcendental Logic: Introduction"),
    (r"FIRST DIVISION\. TRANSCENDENTAL LOGIC\. TRANSCENDENTAL ANALYTIC", "Transcendental Analytic"),
    (r"BOOK I\. Analytic of Conceptions", "Transcendental Analytic, Book I: Analytic of Conceptions"),
    (r"BOOK II\. Analytic of Principles", "Transcendental Analytic, Book II: Analytic of Principles"),
    (r"TRANSCENDENTAL DIALECTIC\.$", "Transcendental Dialectic: Introduction"),
    (r"TRANSCENDENTAL DIALECTIC—BOOK I—", "Transcendental Dialectic, Book I: Of the Conceptions of Pure Reason"),
    (r"TRANSCENDENTAL DIALECTIC—BOOK II—", "Transcendental Dialectic, Book II: Of the Dialectical Procedure of Pure Reason"),
    (r"II\. Transcendental Doctrine of Method", "Transcendental Doctrine of Method")]
CPR_DROP = [r"I\. TRANSCENDENTAL DOCTRINE OF ELEMENTS", r"Second Part—TRANSCENDENTAL LOGIC", r"SECOND DIVISION—TRANSCENDENTAL LOGIC",
            r"TRANSCENDENTAL DOCTRINE OF THE FACULTY OF JUDGEMENT"]  # division titles the chapter headings above already carry
CPR_CAPS = {  # the edition's subheadings in capitals: level and title
    "1. AXIOMS OF INTUITION.": (5, "1. Axioms of Intuition"), "2. ANTICIPATIONS OF PERCEPTION.": (5, "2. Anticipations of Perception"),
    "3. ANALOGIES OF EXPERIENCE.": (5, "3. Analogies of Experience"), "A. FIRST ANALOGY.": (6, "A. First Analogy"), "B. SECOND ANALOGY.": (6, "B. Second Analogy"),
    "C. THIRD ANALOGY.": (6, "C. Third Analogy"), "4. THE POSTULATES OF EMPIRICAL THOUGHT.": (5, "4. The Postulates of Empirical Thought"),
    "REFUTATION OF IDEALISM.": (5, "Refutation of Idealism"), "GENERAL REMARK ON THE SYSTEM OF PRINCIPLES.": (5, "General Remark on the System of Principles"),
    "REMARK ON THE AMPHIBOLY OF THE CONCEPTIONS OF REFLECTION.": (4, "Remark on the Amphiboly of the Conceptions of Reflection"),
    "A. OF REASON IN GENERAL.": (4, "A. Of Reason in General"), "B. OF THE LOGICAL USE OF REASON.": (4, "B. Of the Logical Use of Reason"),
    "C. OF THE PURE USE OF REASON.": (4, "C. Of the Pure Use of Reason"),
    "FIRST CONFLICT OF THE TRANSCENDENTAL IDEAS. THESIS.": (5, "First Conflict of the Transcendental Ideas", "Thesis"),
    "SECOND CONFLICT OF TRANSCENDENTAL IDEAS. THESIS.": (5, "Second Conflict of Transcendental Ideas", "Thesis"),
    "THIRD CONFLICT OF THE TRANSCENDENTAL IDEAS. THESIS.": (5, "Third Conflict of the Transcendental Ideas", "Thesis"),
    "FOURTH CONFLICT OF THE TRANSCENDENTAL IDEAS. THESIS.": (5, "Fourth Conflict of the Transcendental Ideas", "Thesis"),
    "OBSERVATIONS ON THE FIRST ANTINOMY. ON THE THESIS.": (5, "Observations on the First Antinomy", "On the Thesis"),
    "OBSERVATIONS ON THE SECOND ANTINOMY. THESIS.": (5, "Observations on the Second Antinomy", "On the Thesis"),
    "OBSERVATIONS ON THE THIRD ANTINOMY. ON THE THESIS.": (5, "Observations on the Third Antinomy", "On the Thesis"),
    "OBSERVATIONS ON THE FOURTH ANTINOMY. ON THE THESIS.": (5, "Observations on the Fourth Antinomy", "On the Thesis"),
    "ANTITHESIS.": (6, "Antithesis"), "ON THE ANTITHESIS.": (6, "On the Antithesis")}
CPR_PARA_HEADS = {  # headings the transcription sets as paragraphs: level and title
    "Refutation of the Argument of Mendelssohn for the Substantiality or Permanence of the Soul.": (4, None),
    "GENERAL REMARK": (4, "General Remark on the Transition from Rational Psychology to Cosmology"), "On the Transition from Rational Psychology to Cosmology.": (0, None),
    "Concluding Remark on the Solution of the Transcendental Mathematical Ideas—and Introductory to the Solution of the Dynamical Ideas.": (5, None),
    "Possibility of Freedom in Harmony with the Universal Law of Natural Necessity.": (6, None),
    "Exposition of the Cosmological Idea of Freedom in Harmony with the Universal Law of Natural Necessity.": (6, None),
    "Concluding Remarks on the Antinomy of Pure Reason.": (4, None), "Of the Ultimate End of the Natural Dialectic of Human Reason.": (4, None),
    "Scepticism not a Permanent State for Human Reason.": (5, None)}  # level 0: folded into the heading before
CPR_KEEP_CAPS = {"SUBSTANCE", "SIMPLE", "UNITY", "COMPOSITION", "DIVISION", "ORIGINATION", "DEPENDENCE", "EXISTENCE", "NOTHING"}
# The transcription's tables, its columns run together; here each is a numbered list, its items in Meiklejohn's words, from the
# earlier Gutenberg transcription that kept the columns (4280.txt).
CPR_TABLES = [
    ["Quantity of judgements: Universal, Particular, Singular", "Quality: Affirmative, Negative, Infinite", "Relation: Categorical, Hypothetical, Disjunctive",
     "Modality: Problematical, Assertorical, Apodeictical"],
    ["Table of the Categories", "Of Quantity: Unity, Plurality, Totality", "Of Quality: Reality, Negation, Limitation",
     "Of Relation: Of Inherence and Subsistence (substantia et accidens); Of Causality and Dependence (cause and effect); Of Community (reciprocity between the agent and patient)",
     "Of Modality: Possibility—Impossibility; Existence—Non-existence; Necessity—Contingence"],
    ["Axioms of Intuition", "Anticipations of Perception", "Analogies of Experience", "Postulates of Empirical Thought in general"],
    ["Nothing as", "As Empty Conception without object, ens rationis", "Empty object of a conception, nihil privativum", "Empty intuition without object, ens imaginarium",
     "Empty object without conception, nihil negativum"],
    ["The Soul is SUBSTANCE", "As regards its quality it is SIMPLE", "As regards the different times in which it exists, it is numerically identical, that is UNITY, not Plurality",
     "It is in relation to possible objects in space*"],
    ["I think,", "as Subject,", "as simple Subject,", "as identical Subject, in every state of my thought."],
    ["The absolute Completeness of the COMPOSITION of the given totality of all phenomena.", "The absolute Completeness of the DIVISION of given totality in a phenomenon.",
     "The absolute Completeness of the ORIGINATION of a phenomenon.", "The absolute Completeness of the DEPENDENCE of the EXISTENCE of what is changeable in a phenomenon."]]
CPR_TITLED = {0: 0, 1: 1, 3: 1}  # tables whose first line is a title, not an item (the judgements' first item names its class)
def kant_critique(raw):
    """Meiklejohn's translation of the Critique of Pure Reason (1855), from Project Gutenberg's UTF-8 transcription (4280-0.txt): one
    XHTML document. Chapters are the Prefaces, the Introduction, the Aesthetic, the Logic's Introduction, the two books of the Analytic,
    the Dialectic's Introduction and its two books, and the Doctrine of Method; Meiklejohn's sections and numbered paragraphs (his own
    § numbers, which differ from Kant's) sit inside them. Footnotes ([*Footnote: …], and the bracketed notes inside a paragraph) follow
    the paragraph that cites them; a note with no mark in the text (one of Meiklejohn's) is marked at the end of the paragraph before."""
    t = raw.replace("\r\n", "\n")
    t = t[t.index("\n PREFACE TO THE FIRST EDITION 1781\n"):t.index("End of the Project Gutenberg")]
    blocks = [b.strip("\n") for b in re.split(r"\n\s*\n", t) if b.strip()]
    norm = lambda b: " ".join(b.split())
    def inline(x):
        x = esc(norm(x).replace('"', "”"))
        x = re.sub(r"_([^_]+)_", r"<i>\1</i>", x)
        return x
    out, notes, refs, tables, k = [], 0, 0, list(CPR_TABLES), 0
    level, prev_p, chapter = 3, None, ""
    def fn_ref(_):
        nonlocal refs
        refs += 1
        return f"<sup>{refs}</sup>"
    def para(x):
        nonlocal prev_p
        inl = []
        def take(m):
            nonlocal refs
            refs += 1; inl.append((refs, m.group(1)))
            return f"<sup>{refs}</sup>"
        x = re.sub(r" ?\[Footnote: ([^\]]+)\]", take, x)
        x = re.sub(r"(?<=[\w.,;:’”)])\*+(?:\[2\])?", fn_ref, x)
        out.append("<p>" + inline(x) + "</p>"); prev_p = len(out) - 1
        for n, body in inl:
            nonlocal_notes(n, body)
    def nonlocal_notes(n, body):
        nonlocal notes
        notes += 1; assert n == notes, (n, notes)
        out.append(f'<aside epub:type="footnote"><p>{n}. {inline(body)}</p></aside>')
    while k < len(blocks):
        b = blocks[k]; k += 1
        n = norm(b)
        if b.startswith(" ") and not b.startswith("  "):  # a heading
            part = next((title for pat, title in CPR_PARTS if re.match(pat, n)), None)
            if part: out.append(f"<h2>{esc(part)}</h2>"); level = 3; chapter = part; continue
            if any(re.match(pat, n) for pat in CPR_DROP): continue
            n = re.sub(r"\s*§ \d+\.?$", "", n).replace("theSolution", "the Solution").replace("Schematism at of", "Schematism of").rstrip(".")
            n = re.sub(r"^§ I\.", "§ 1.", n)
            if re.match(r"(Chapter|APPENDIX|INTRODUCTION\. Of the Transcendental Faculty)", n): lv = 3
            elif re.match(r"(Section|SECTION|Transition to)", n): lv = 3 if chapter.startswith("Transcendental Dialectic, Book I:") else 4
            elif re.match(r"(I|II|III|IV|V|VI|VII)\. ", n): lv = 3 if not out or "Introduction" in out[-1] or level == 3 else 5
            else: lv = 5
            if re.match(r"§ \d+", n): lv = 4 if re.match(r"§ (1|9|10)\.", n) else 5
            if n == "Introductory": lv = 4
            n = re.sub(r"^INTRODUCTION\. ", "Introduction: ", n)
            n = n.replace("APPENDIX. ", "Appendix: ") if n.startswith("APPENDIX. ") else ("Appendix: Of the Amphiboly of the Conceptions of Reflection" if n == "APPENDIX" else n)
            if n.startswith("SECTION "): n = "Section " + n[8:]
            if chapter == "Transcendental Aesthetic": lv -= 1  # no chapters inside it
            out.append(f"<h{lv}>{esc(n)}</h{lv}>"); level = lv; continue
        if re.fullmatch(r"§ \d+", n): out.append(f"<h5>{n}</h5>"); continue
        if n in CPR_PARA_HEADS:
            lv, h = CPR_PARA_HEADS[n]
            if lv: out.append(f"<h{lv}>{esc(h or n.rstrip('.'))}</h{lv}>")
            continue
        if n in CPR_CAPS:
            lv, h, *sub = CPR_CAPS[n]
            out.append(f"<h{lv}>{esc(h)}</h{lv}>" + "".join(f"<h{lv + 1}>{esc(x)}</h{lv + 1}>" for x in sub)); continue
        if b.startswith("          "):  # a table: its blocks run together, given as a list
            while k < len(blocks) and blocks[k].startswith("          "): k += 1
            rows, ti = tables.pop(0), len(CPR_TABLES) - len(tables) - 1
            head = rows[0] if ti in (1, 3) else None
            items = rows[1:] if head else rows
            if head: out.append(f"<p>{inline(head)}</p>")
            li = []
            for x in items:
                x = re.sub(r"(?<=[\w.,;:’”)])\*", fn_ref, x)
                li.append(f"<li><p>{inline(x)}</p></li>")
            out.append("<ol>" + "".join(li) + "</ol>"); prev_p = len(out) - 1; continue
        m = re.match(r"\[?\*{0,2}(?:\[2\])?Footnote: (.*?)\]?$", n)
        if m:  # a footnote, after the paragraph citing it
            if notes == refs:  # nothing in the text marks it: marked at the end of the paragraph before
                refs += 1; out[prev_p] = re.sub(r"</p>$", f"<sup>{refs}</sup></p>", out[prev_p])
            nonlocal_notes(notes + 1, m.group(1)); continue
        if b.count("\n") >= 2 and max(len(l) for l in b.split("\n")) < 45 and not b.startswith(" "):  # verse
            out.append("<p>" + " / ".join(inline(l) for l in b.split("\n") if l.strip()) + "</p>"); continue
        para(b)
    assert not tables and refs == notes, (len(tables), refs, notes)
    return f'<?xml version="1.0" encoding="utf-8"?><html xmlns="http://www.w3.org/1999/xhtml" xmlns:epub="http://www.idpf.org/2007/ops"><head><title>Critique of Pure Reason</title></head><body>{"".join(out)}</body></html>'

GUTENBERG = CACHE / "gutenberg"
MET_BOOKS = ["Alpha", "Little Alpha", "Beta", "Gamma", "Delta", "Epsilon", "Zeta", "Eta", "Theta", "Iota", "Kappa", "Lambda", "Mu", "Nu"]
def aristotle_metaphysics(raw, verse):
    """Ross's translation of the Metaphysics, from the Internet Classics Archive's transcription split by book ("# Metaphysics — Book V",
    "## Part 2", each paragraph a line opening with a stray double quote, a lone quote between paragraphs): one XHTML document, a chapter
    per book ("Book V (Delta)") and a heading per chapter ("Chapter 2"; the transcription's "Part"). Verse quotations (lines found in
    `verse`) become one quotation with " / " between lines. The transcription's "--" is a dash; its single hyphens, which stand for
    both hyphens and dashes, are left as they are. Each book's capitalised first word is set in lower case after its capital."""
    norm = lambda x: re.sub(r"[^a-z]", "", x.lower())
    vset = {norm(v) for v in verse if norm(v)}
    out, book, first, run = [], 0, False, []
    def flush():
        if run: out.append("<blockquote><p>" + " / ".join(esc(typo(x)) for x in run) + "</p></blockquote>"); run.clear()
    for line in raw.replace("\r\n", "\n").split("\n"):
        t = line.strip()
        if t.startswith("# "):
            flush(); book += 1; first = True
            out.append(f"<h2>Book {toRoman_py(book)} ({MET_BOOKS[book - 1]})</h2>"); continue
        m = re.fullmatch(r"## Part (\d+)", t)
        if m: flush(); out.append(f"<h3>Chapter {m.group(1)}</h3>"); continue
        t = re.sub(r'\s+"$', "", re.sub(r'^"\s*', "", t)).strip()  # the stray quote opening each line, and the one some lines end with
        if not t: continue
        if norm(t) in vset and len(t) < 120: run.append(t.rstrip()); continue
        flush()
        t = t.replace("--", "—").replace(":-", ":")
        if first:
            t = re.sub(r"^(['\"]?)([A-Z])([A-Z]+)\b", lambda m: m.group(1) + m.group(2) + m.group(3).lower(), t); first = False
        out.append(f"<p>{esc(typo(t))}</p>")
    flush()
    assert book == 14, book
    return f'<?xml version="1.0" encoding="utf-8"?><html xmlns="http://www.w3.org/1999/xhtml" xmlns:epub="http://www.idpf.org/2007/ops"><head><title>Metaphysics</title></head><body>{"".join(out)}</body></html>'

def xenophon_memorabilia(raw):
    """Dakyns's translation of the Memorabilia (1897), from a plain-text transcription: one XHTML document, a chapter per book
    ("Book IV") and a heading per chapter ("Chapter VI"; the transcription's bare Roman numeral). Dakyns prints no section numbers;
    the reference articles find a section by its words (XEN_MEM in js/reference.js). His notes, numbered from (1) in each chapter and
    printed after the paragraph that cites them, become footnotes numbered through the book; an indented block after a note goes on
    with that note, and anywhere else is a quotation, its lines joined by " / ". The transcription's {braces} mark transliterated
    Greek, set here in italics; its "--" is a dash."""
    t = raw.replace("\r\n", "\n")
    t = t[t.index("BOOK I\n"):t.index("End of the Project Gutenberg")]
    raw_blocks = [b for b in re.split(r"\n\s*\n", t) if b.strip()]
    def fix(x):
        x = " ".join(x.split()).replace("--", "—")
        return re.sub(r"\{([^{}]*)\}", lambda m: "\x01" + m.group(1) + "\x02", typo(x))
    def html(x): return esc(x).replace("\x01", "<i>").replace("\x02", "</i>")
    out, local, total, notes, books, in_note = [], {}, 0, 0, 0, False
    def refs(x):
        def ref(m):
            nonlocal total
            n = int(m.group(1))
            if n in local: return m.group(0)  # cited already: a number in the text itself
            total += 1; local[n] = total
            return f"<sup>{total}</sup>"
        return re.sub(r" ?\((\d+)\)", ref, x)
    for b in raw_blocks:
        n = " ".join(b.split())
        m = re.fullmatch(r"BOOK ([IV]+)", n)
        if m: books += 1; out.append(f"<h2>Book {m.group(1)}</h2>"); in_note = False; continue
        if re.fullmatch(r"[IVXL]+", n): out.append(f"<h3>Chapter {n}</h3>"); local.clear(); in_note = False; continue
        m = re.match(r" \((\d+)\)\s+(.*)", b, re.S)
        if m:
            k = local.pop(int(m.group(1)), None)  # a number is free again once its note is out (II.vi numbers two notes 14)
            assert k, ("note without a reference", b[:80])
            notes += 1; in_note = True
            out.append(f'<aside epub:type="footnote"><p>{k}. {html(fix(m.group(2)))}</p></aside>'); continue
        if b.startswith("    ") and in_note:
            out[-1] = out[-1].replace("</p></aside>", " " + html(fix(n)) + "</p></aside>"); continue
        if b.startswith("    "):
            lines = [fix(l) for l in b.split("\n") if l.strip()]
            out.append("<blockquote><p>" + refs(" / ".join(html(l) for l in lines)) + "</p></blockquote>"); continue
        in_note = False
        out.append(f"<p>{refs(html(fix(n)))}</p>")
    assert books == 4 and notes == total, (books, notes, total)
    return f'<?xml version="1.0" encoding="utf-8"?><html xmlns="http://www.w3.org/1999/xhtml" xmlns:epub="http://www.idpf.org/2007/ops"><head><title>Memorabilia</title></head><body>{"".join(out)}</body></html>'

def toRoman_py(n):
    out = ""
    for v, r in [(10, "X"), (9, "IX"), (5, "V"), (4, "IV"), (1, "I")]:
        while n >= v: out += r; n -= v
    return out

def heading_text(t):
    """A Gutenberg heading as the app shows it: "I   THE SCIENTIFIC LITERATURE ..." -> "I. The Scientific Literature ...",
    "( a )  Recent ..." -> "(a) Recent ...", "“ A Beautiful Dream ”" -> "“A Beautiful Dream”"."""
    t = " ".join(t.replace(" ", " ").split())
    t = re.sub(r"\(\s*([a-z])\s*\)", r"(\1)", t)
    t = re.sub(r"([“‘])\s+", r"\1", t); t = re.sub(r"\s+([”’])", r"\1", t)
    m = re.fullmatch(r"([IVXL]+)\.?\s+(.+)", t)
    if m and m.group(2).isupper(): return f"{m.group(1)}. {title_case(m.group(2))}"
    letters = [c for c in t if c.isalpha()]
    if letters and sum(c.isupper() for c in letters) / len(letters) > 0.8 and not re.fullmatch(r"[IVXL]+", t): return title_case(t)
    return t.rstrip(".")
def gutenberg_epub(folder):
    """A Project Gutenberg EPUB: the work's own files in spine order (not Gutenberg's header and licence, the title page, the
    contents or the general index), each as XHTML the build reads like a Standard Ebooks file. Its page-number markers become page
    breaks with the printed page, its lettered footnotes numbered endnotes, its headings set as the app shows headings."""
    from bs4 import BeautifulSoup
    oebps = next(folder.rglob("content.opf")).parent
    opf = (oebps / "content.opf").read_text(encoding="utf-8")
    man = {m.group(1): m.group(2) for m in re.finditer(r'<item\b[^>]*\bid="([^"]+)"[^>]*\bhref="([^"]+)"', opf)}
    man.update({m.group(2): m.group(1) for m in re.finditer(r'<item\b[^>]*\bhref="([^"]+)"[^>]*\bid="([^"]+)"', opf)})
    spine = [man[i] for i in re.findall(r'<itemref idref="([^"]+)"', opf) if i in man]
    notes, docs, seen_h2 = {}, [], False
    for href in spine:
        soup = BeautifulSoup((oebps / href).read_text(encoding="utf-8"), "xml")
        for fn in soup.select("div.footnote"):  # the notes, wherever Gutenberg put them
            a = fn.find("a"); nid = fn.get("id")
            if a is not None:
                nxt = a.next_sibling; a.decompose()
                if isinstance(nxt, str): nxt.replace_with(re.sub(r"^\s*\.\s*", "", nxt))
            notes[nid] = fn; fn.extract()
        heads = [" ".join(h.get_text(" ").split()) for h in soup.find_all(["h1", "h2"])]
        words = len(soup.body.get_text(" ").split()) if soup.body else 0
        if not soup.body or any(re.match(r"(The Project Gutenberg eBook|THE FULL PROJECT GUTENBERG|CONTENTS$|INDEX$)", h) for h in heads): continue
        if not soup.find("h2"):
            if not seen_h2 or words < 40: continue   # the title page, an empty divider
        seen_h2 = True
        for sp in soup.select("span.x-ebookmaker-pageno"):
            sp.attrs = {"epub:type": "pagebreak", "title": sp.get("title", "")}; sp.clear()
        for a in soup.find_all("a"):
            h = a.get("href", "")
            if "#f" in h and a.find("sup"):
                a.attrs = {"epub:type": "noteref", "href": "endnotes.xhtml#" + h.split("#")[1]}; a.string = h.split("#")[1][1:]
            elif not h and a.get("id") and not a.contents: a.decompose()
            else: a.unwrap()
        for r in soup.find_all("a", attrs={"epub:type": "noteref"}):  # two marks side by side would read as one number
            prev = r.previous_sibling
            if getattr(prev, "name", None) == "a" and prev.get("epub:type") == "noteref": r.insert_before("\u2009")
        for el in soup.find_all(["h1", "h2", "h3", "h4"]):
            refs = [r.extract() for r in el.find_all("a", attrs={"epub:type": "noteref"})]
            txt = heading_text(el.get_text(" "))
            el.clear(); el.append(txt)
            for r in refs: el.append(r)
        for sp in soup.find_all("span"):
            if sp.get("epub:type") != "pagebreak": sp.unwrap()
        docs.append(str(soup))
    ol = "".join(f'<li id="{nid}">{"".join(str(c) for c in fn.find_all("p", recursive=False)) or "<p>" + fn.get_text(" ") + "</p>"}</li>' for nid, fn in notes.items())
    endnotes = f'<?xml version="1.0" encoding="utf-8"?><html xmlns="http://www.w3.org/1999/xhtml" xmlns:epub="http://www.idpf.org/2007/ops"><head><title>Notes</title></head><body><section epub:type="endnotes"><h2>Notes</h2><ol>{ol}</ol></section></body></html>'
    return docs, endnotes

def berkeley_dialogues(raw):
    from html import escape
    start = raw.index("THE FIRST DIALOGUE")
    end = raw.index("End of the Project Gutenberg EBook", start)
    out = []
    for paragraph in re.split(r"\n\s*\n", raw[start:end].strip()):
        text = " ".join(paragraph.split())
        if re.fullmatch(r"THE (FIRST|SECOND|THIRD) DIALOGUE", text):
            out.append(f"<h2>{text.title()}</h2>")
        else:
            out.append(f"<p>{escape(text)}</p>")
    return '<html xmlns="http://www.w3.org/1999/xhtml"><head><title>Three Dialogues</title></head><body>' + "".join(out) + "</body></html>"


CONVERT = {"berkeley_dialogues": berkeley_dialogues, "kant_groundwork": kant_groundwork, "spinoza_ethics": spinoza_ethics, "kant_critique": kant_critique, "aristotle_metaphysics": aristotle_metaphysics, "xenophon_memorabilia": xenophon_memorabilia}

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
        elif bk.get("epub_source"):
            es = bk["epub_source"]; GUTENBERG.mkdir(parents=True, exist_ok=True); f = GUTENBERG / es["file"]
            if not f.exists():
                import urllib.request; urllib.request.urlretrieve(es["url"], f)
            dest = TEXTS / bk["id"]
            if not dest.exists():
                import zipfile; zipfile.ZipFile(f).extractall(dest)
        elif bk["text_source"].get("commit"):
            dest = TEXTS / bk["id"]
            if not dest.exists(): dest.parent.mkdir(parents=True, exist_ok=True); subprocess.run(["git", "clone", "-q", bk["text_source"]["repo"], str(dest)], check=True)
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
                elif bk.get("epub_source"):
                    names = []
                    files, endnotes = gutenberg_epub(TEXTS / bk["id"])
                else:
                    names = []
                    ts = bk["text_source"]
                    if ts.get("commit"):  # files at a pinned commit, and the verse lines marked ("> ") at another
                        show = lambda c, f: subprocess.run(["git", "-C", str(TEXTS / bk["id"]), "show", f"{c}:{f}"], capture_output=True, text=True, check=True).stdout
                        raw = "\n".join(show(ts["commit"], f) for f in ts["files"])
                        names_v = subprocess.run(["git", "-C", str(TEXTS / bk["id"]), "ls-tree", "--name-only", ts["verse_commit"], ts["verse_dir"]], capture_output=True, text=True, check=True).stdout.split()
                        verse = [l[2:] for f in names_v if f.endswith(".md") for l in show(ts["verse_commit"], f).split("\n") if l.startswith("> ")]
                        files, endnotes = [CONVERT[ts["convert"]](raw, verse)], None
                    else:
                        files, endnotes = [CONVERT[ts["convert"]]((TEXTS / bk["id"] / ts["file"]).read_text(encoding=ts.get("encoding", "latin-1")))], None
                r = await page.evaluate(BUILD, {"id": bk["id"], "flatten": bool(bk.get("flatten")), "files": files, "endnotes": endnotes, "drop": bk.get("drop") or [],
                                                "parts": [n.startswith("part-") for n in names] if bk.get("parts") else None})
                for s in r["sections"]:
                    if bk.get("partOf") and re.fullmatch(r"Part [IVX]+", s["label"]): s["label"] = f'{bk["partOf"]}, {s["label"]}'
                rec = {**{k: v for k, v in bk["text"].items() if v}, "lang": r["lang"], "sections": r["sections"],
                       "source": {"name": "Standard Ebooks", "kind": "EPUB", "pages": 0} if bk.get("repo") else {"name": "Project Gutenberg", "kind": "EPUB", "pages": 0} if bk.get("epub_source") else {"name": "a public-domain transcription", "kind": "Text", "pages": 0}}
                (OUT / f"{bk['id']}.json").write_text(json.dumps({"text": rec, "content": r["blocks"]}, ensure_ascii=False, separators=(",", ":")), encoding="utf-8")
                await cover(browser, bk, OUT / f"{bk['id']}.jpg")
                print(f"{bk['id']}: {len(r['blocks'])} blocks, {r['notes']} notes, {len(r['sections'])} chapters, {(OUT / (bk['id'] + '.json')).stat().st_size // 1024} KB")
            await browser.close()
    finally:
        srv.terminate()

asyncio.run(main(set(sys.argv[1:])))
