"""PDF import test for Marginalia:  python3 tests/pdf_import.py [your-book.pdf ...]

With no arguments, makes its own small books (Chromium's print-to-PDF) and checks that the app's parser
finds exactly their headings, numbers their pages in order, and leaves no broken words:
  justified    typeset, hyphenated, chapter titles followed directly by section titles
  ragged       the same unjustified, with block quotes
  twoline      headings long enough to wrap onto two lines
  scanlike     every page set at a different size, as scans often are, with no headings inside chapters
  quotes       block quotes set at the body size, told from the text only by their indent
  front        a title page, a contents page and a one-line preface before the chapters, with the PDF's outline:
               front matter keeps its type sizes and spacing, and the outline's sections on those pages keep their headings
  philosophy   no outline: half-title, a title page with a subtitle at the body size, a copyright page in small type, dedication,
               a two-page contents, a short preface mentioning "contents" and "copyright", a chapter ending on a page of its own:
               the first six pages are front matter line by line, the preface and the chapter's end are prose
It also checks that a page that can't be read stops the PDF reader's worker.

With PDF paths, parses those instead and prints what the app would make of them (headings, page numbers,
paragraph count), so a badly imported book can be checked before and after a parser change.
Never commit real books: the repository is public.

PDF.js isn't committed; the first run downloads the version the app uses from its GitHub release into
tests/.cache (git-ignored).
Needs: pip install playwright && playwright install chromium
"""
import os
import asyncio, io, json, re, subprocess, sys, tempfile, time, urllib.request, zipfile
from pathlib import Path
from playwright.async_api import async_playwright

ROOT = Path(__file__).resolve().parent.parent
CACHE = ROOT / "tests" / ".cache"
PORT = int(os.environ.get("MG_PORT", 8798))  # tests/run.py gives each test its own port

def pdfjs_dir():
    ver = re.search(r"pdf\.js/([\d.]+)/pdf\.min\.js", (ROOT / "js" / "core.js").read_text()).group(1)
    d = CACHE / f"pdfjs-{ver}"
    if not (d / "build" / "pdf.worker.js").exists():
        print(f"Downloading PDF.js {ver}…")
        url = f"https://github.com/mozilla/pdf.js/releases/download/v{ver}/pdfjs-{ver}-dist.zip"
        zipfile.ZipFile(io.BytesIO(urllib.request.urlopen(url).read())).extractall(d)
    return d / "build"

BODY = ("The question of method returns whenever philosophy examines the conditions under which its concepts become "
        "intelligible. Kant's critical project begins from the recognition that reason, left to itself, generates "
        "antinomies it cannot resolve. Hegel answers that the contradictions are moments in the self-development of "
        "the concept. Genealogy uncovers the contingent struggles sedimented in values that present themselves as eternal. ")
CSS = "@page { size: 5.5in 8.5in; margin: 0.8in 0.7in; } body { font: 11pt/1.45 Georgia, serif; } p { margin: 0; text-indent: 1.5em; } h1 { font-size: 20pt; break-before: page; margin: 1.4in 0 0.5in; } h2 { font-size: 13.5pt; margin: 1.2em 0 0.6em; } blockquote { font-size: 9.5pt; margin: 0.8em 2em; }"

def book(justify):
    heads, html = [], []
    for c, ch in enumerate(["Critique", "Genealogy", "Difference"], 1):
        heads.append(f"Chapter {c}: {ch}"); html.append(f"<h1>{heads[-1]}</h1>")
        for s, sec in enumerate(["Method and its limits", "The problem of origins", "Against negation"], 1):
            heads.append(f"{c}.{s} {sec}"); html.append(f"<h2>{heads[-1]}</h2>")
            html += [f"<p>{BODY * 2}</p>"] * 3 + [f"<blockquote>{BODY}</blockquote>", f"<p>{BODY * 2}</p>"]
    style = CSS + (" p { text-align: justify; hyphens: auto; }" if justify else "")
    return f'<html lang="en"><style>{style}</style>{"".join(html)}</html>', heads

QUOTE = ("We must think of the unconscious as a factory and not a theater, a matter of production and not of "
         "representation; this is the point at which the whole argument turns, and it turns on nothing else. ")
def quotes():
    heads, html = ["Quoting"], ["<h1>Quoting</h1>"]
    for k in range(3):
        html += [f"<p>{BODY * 2}</p>", f"<blockquote>{QUOTE}</blockquote>", f"<p>{BODY}</p>", f"<p>A short paragraph {k}.</p>", f"<p>{BODY}</p>"]
    style = CSS + " blockquote { font-size: 11pt; margin: 0.8em 2.2em; } p { text-align: justify; }"
    return f'<html lang="en"><style>{style}</style>{"".join(html)}</html>', heads

def twoline():
    heads = ["The Long Title of a Chapter That Wraps Across Two Lines", "A Section Heading Long Enough That It Also Needs Two Lines Here"]
    return f'<html lang="en"><style>{CSS} p {{ text-align: justify; }} h1 {{ break-before: auto; }}</style><h1>{heads[0]}</h1><p>{BODY * 3}</p><h2>{heads[1]}</h2><p>{BODY * 3}</p></html>', heads

def scanlike():
    # One chapter title, then pages each set 0-30% larger, the way a scan's pages differ in size.
    # Each page also carries a running head misread a little differently, as OCR does ("Chapten!", "(hapter 1").
    heads = ["Chapter 1", "Chapten!", "Chapter 1", "(hapter 1", "Chapter:I", "Chapter 1", "ChaptenI", "Chapter 1"]
    pages = "".join(f'<div style="height:7.15in;position:relative;font-size:{11 * k}pt;break-after:page"><div style="height:6.2in;overflow:hidden">{"<h1>Scanned Chapter</h1>" if i == 0 else ""}'
                    f'<p>{BODY * 3}</p></div><div style="position:absolute;bottom:0;left:0;font-size:7pt">{h}</div></div>'
                    for i, (k, h) in enumerate(zip([1, 1.18, 1.0, 1.25, 1.06, 1.3, 1.0, 1.2], heads)))
    return f'<html lang="en"><style>{CSS} @page {{ margin-bottom: 0.4in; }} p {{ text-align: justify; hyphens: auto; }} h1 {{ break-before: auto; margin: 0.3in 0 0.4in; }}</style>{pages}</html>', ["Scanned Chapter"]

def parttitle():
    # A part-title page: the part's name alone on its page in large type, as printed books open each part. The chapter after it
    # must still be a heading, though the line before it ("Torture") ends no sentence.
    heads = ["Preface", "PART ONE Torture", "1. The body of the condemned"]
    return (f'<html lang="en"><style>{CSS} p {{ text-align: justify; }} h1 {{ break-before: auto; }}</style><h1>Preface</h1><p>{BODY * 4}</p>'
            '<div style="break-before:page;break-after:page;font-size:16pt;line-height:1.6;padding-top:.2in">PART ONE<br>Torture</div>'
            f'<h1>1. The body of the condemned</h1><p>{BODY * 3}</p></html>', heads)

ITEMS = ["By that which is self-caused I mean that of which the essence involves existence, or that of which the nature is only conceivable as existent.",
         "A thing is called finite after its kind when it can be limited by another thing of the same nature; a body is called finite because we always conceive another greater body."]
def listbook():
    # numbered and bulleted items long enough to run over, their run-over lines hanging under the first
    items = "".join(f"<li>{t}</li>" for t in ITEMS)
    return (f'<html lang="en"><style>{CSS} p {{ text-align: justify; }} li {{ margin: 0.3em 0; }}</style><h1>Definitions</h1><p>{BODY * 2}</p>'
            f'<ol>{items}</ol><p>{BODY}</p><ul>{items}</ul><p>{BODY * 2}</p>'
            f'<blockquote style="font-size:0.9em;margin-left:2em">{"<br>".join(VERSE_LINES)}</blockquote><p>{BODY * 2}</p></html>')
VERSE_LINES = ["I met a traveller from an antique land,", "Who said: two vast and trunkless legs", "Stand in the desert; near them, on the sand,", "Half sunk, a shattered visage lies"]
BIO = ("The author was born in a small town in the north, lectured in universities throughout the world, and wrote often for "
       "newspapers and reviews in the years before this book.")
def biopage():
    # a title page with a short author's note whose printed lines run on in lowercase
    return (f'<html lang="en"><style>{CSS}</style><div style="break-after:page;padding-top:1in"><div style="font-size:26pt;font-weight:bold">A BOOK</div>'
            f'<div style="width:3.2in;margin-top:0.6in;font-size:11pt">{BIO}</div></div><h1>Chapter 1</h1>' + f"<p>{BODY * 2}</p>" * 6 + "</html>")

OPENS = "Chapter 2 takes up the question of genealogy where the first left off. "
def front():
    body = f"<p>{BODY * 2}</p>" * 6
    html = (f'<html lang="en"><style>{CSS} h1 {{ margin: 0.5in 0 0.3in; }}</style>'
            '<div style="text-align:center;padding-top:2in;break-after:page"><div style="font-size:30pt;font-weight:bold">THE BOOK OF METHOD</div>'
            '<div style="font-size:16pt;margin-top:.3in">Critique and Genealogy</div><div style="font-size:12pt;margin-top:1in">A. N. Author</div></div>'
            '<div style="break-after:page"><h2>Contents</h2><p>Preface</p><p>1 Critique</p><p>2 Genealogy</p></div>'
            '<h1>Preface</h1><p>A short preface.</p>' + "".join(f"<h1>Chapter {k}</h1>{f'<p>{OPENS}{BODY}</p>' if k == 2 else ''}{body}" for k in (1, 2)) + "</html>")
    return html, ["Contents", "Preface", "Chapter 1", "Chapter 2"]

# Front matter without an outline, as a philosophy book has it: half-title, a title page with a subtitle set at the body size,
# a copyright page in small type, dedication and epigraph, a contents page running onto a second full page, a short preface whose prose mentions "contents"
# and "copyright", and a first chapter whose last few lines fall on a page of their own, all within the first ten pages.
CHAPTER_END = "And so the first chapter ends here, on a page of its own."
def philosophy():
    small = "".join(f"<div>{x}</div>" for x in ["Copyright © 2026 by the Author", "All rights reserved.", "Library of Congress Cataloging-in-Publication Data",
        "Author, A. N.", "Essays on method / A. N. Author.", "p. cm.", "Includes bibliographical references and index.", "ISBN 978-0-00-000000-0 (pbk.)",
        "1. Philosophy. 2. Method. I. Title.", "B000 .A00 2026", "100—dc23", "British Library Cataloguing in Publication Data is available.",
        "Printed in the United States of America", "Designed by A. Designer", "Set in Georgia", "First edition", "10 9 8 7 6 5 4 3 2 1",
        "The paper in this book meets the guidelines for permanence.", "Published by a press", "www.example.org"])
    toc = "".join(f'<div style="display:flex;justify-content:space-between"><span>{k} {t}</span><span>{3 + 2 * k}</span></div>'
                  for k, t in enumerate(["Critique", "Genealogy", "Difference", "Method", "Origins", "Negation", "Immanence", "Expression", "Univocity", "Repetition",
                                         "Sense", "Event", "Series", "Structure", "Multiplicity", "Assemblage", "Strata", "Plateau", "Refrain", "Smooth space", "Nomadology", "Capture"] * 2
                                        + ["Notes", "Bibliography", "Index", "Afterword", "Appendix", "Glossary", "Chronology", "Abbreviations"], 1))
    pre = ("The contents of experience are never simply given; this book asks how they come to seem so. Copyright law, as much as "
           "logic, decides what counts as an author's own, and the essays that follow return to that question from several sides.")
    html = (f'<html lang="en"><style>{CSS} h1 {{ margin: 0.5in 0 0.3in; }} h2 {{ font-size: 15pt; }} p {{ text-align: justify; }}</style>'
            '<div style="text-align:center;padding-top:2.4in;font-size:14pt;break-after:page">Essays on Method</div>'
            '<div style="text-align:center;break-after:page"><div style="font-size:26pt;margin-top:1.2in">ESSAYS ON METHOD</div>'
            '<div style="font-size:11pt;margin-top:.3in">being an inquiry into the conditions under which concepts become intelligible, with some remarks on genealogy</div>'
            '<div style="font-size:12pt;margin-top:1.2in">A. N. AUTHOR</div><div style="font-size:10pt;margin-top:.2in">Example Press · 2026</div></div>'
            f'<div style="font-size:7.5pt;line-height:1.35;break-after:page;padding-top:1in">{small}</div>'
            '<div style="text-align:center;font-style:italic;break-after:page;padding-top:2in">For R.<div style="margin-top:1.5in;font-size:9.5pt">“Philosophy is a battle against the bewitchment of our intelligence.”</div></div>'
            f'<div style="break-after:page"><h2>Contents</h2>{toc}</div>'
            f'<div style="break-after:page"><h2>Preface</h2><p>{pre}</p><p>{pre}</p></div>'
            f'<h1>Chapter 1: Critique</h1><p>{BODY * 2}</p><p>{BODY * 2}</p><p>{CHAPTER_END}</p>'
            f'<h1>Chapter 2: Genealogy</h1>' + f"<p>{BODY * 2}</p>" * 8 + "</html>")
    return html

PHIL = """async ([url, base]) => {
  LIBS.pdf = [base + "/pdf.js"]; LIBS.pdfw = [base + "/pdf.worker.js"];
  const r = await parseFile(new File([await (await fetch(url)).arrayBuffer()], url.split("/").pop()), () => {});
  let pg = ""; const at = [];
  r.blocks.forEach((b) => { if (b.k === "pg") pg = b.x; else at.push([b.k, b.x, pg]); });
  return at;
}"""

# A scanned book's OCR layer as some scanners write it (found in a real scan of a translated monograph): invisible text over the
# page image, every word its own text object with its space after it, set in a stand-in font wider than the print, so each word's
# box overlaps the next; a quotation mark read a few points high; a title in letter-spaced capitals (character spacing, Tc).
# PDF.js reads such words as run together ("closertranslation"); the importer must put back the spaces the PDF itself holds.
OCR_WORDS = ("Any closer translation of the French title of this book has proved unsatisfactory on various counts. To begin with, "
             "the author uses the infinitive, which, as here, may have the effect of an 'impersonal imperative'. Such a nuance is "
             "denied us in English. More seriously the verb has no adequate English equivalent.")
def ocr_layer_pdf():
    ops = ["3 Tr"]
    # the title: letter-spaced capitals, written as one string with its spaces
    # (Tc is in text space, scaled by the font size, as in the scan: 0.218 at 11 points)
    for wx, w in ((41.04, "DISCIPLINE "), (133.44, "AND "), (172.56, "PUNISH")):
        ops.append(f"BT 0.218 Tc 11 0 0 11 {wx} 520 Tm /F1 1 Tf ({w}) Tj 0 Tc ET")
    x, y, line_w = 40.0, 480.0, 270.0
    for w in OCR_WORDS.split(" "):
        adv = 4.1 * len(w) + 2.2          # where the next word starts: narrower than Helvetica sets it, so the boxes overlap
        if x + adv > 40 + line_w: x, y = 40.0, y - 12
        yy = y + (4.4 if w.startswith("'") else 0)   # a quotation mark read high, as OCR does
        word = w.replace("\\", "\\\\").replace("(", "\\(").replace(")", "\\)")
        ops.append(f"BT 9 0 0 9 {x:.2f} {yy:.2f} Tm /F1 1 Tf ({word} ) Tj ET")
        x += adv
    content = "\n".join(ops).encode("latin-1")
    objs = [b"<< /Type /Catalog /Pages 2 0 R >>", b"<< /Type /Pages /Kids [3 0 R] /Count 1 >>",
            b"<< /Type /Page /Parent 2 0 R /MediaBox [0 0 357 576] /Contents 4 0 R /Resources << /Font << /F1 5 0 R >> >> >>",
            b"<< /Length %d >>\nstream\n" % len(content) + content + b"\nendstream",
            b"<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica /Encoding /WinAnsiEncoding >>"]
    out, offs = bytearray(b"%PDF-1.4\n"), []
    for i, o in enumerate(objs, 1): offs.append(len(out)); out += b"%d 0 obj\n" % i + o + b"\nendobj\n"
    xref = len(out); out += b"xref\n0 %d\n0000000000 65535 f \n" % (len(objs) + 1)
    for o in offs: out += b"%010d 00000 n \n" % o
    out += b"trailer\n<< /Size %d /Root 1 0 R >>\nstartxref\n%d\n%%%%EOF\n" % (len(objs) + 1, xref)
    return bytes(out)

# Line ends in justified text, written word by word in Courier so each line ends exactly where it should: a hyphenated
# fragment at the margin ("A"), a whole word a little short of it ("B", where a typeset PDF's word-ending lines stop: 0.16
# of the type size short of the hyphen-ending ones), and one hyphen's width short with the hyphen missing from the text
# ("C", a lost hyphen). Only the C line's word may be joined to the next line's; every B line ends a word.
ENDS_LINES = [("B", "Eighty years later the warden drew up his"), ("B", "rules for the house of young prisoners in"),
              ("A", "the capital. The prisoners rose at six, consid-"), ("B", "ered the bell an order and worked; a dog"),
              ("C", "had lain the day before on the grass, philoso"), ("B", "phy was nowhere taught, and an ornamental"),
              ("B", "crepe hung over the chapel door, warmer"), ("B", "than the yard where the archers waited by"),
              ("A", "the fire until nearly eleven; then a sen-"), ("B", "tinel called the names of the inmates who"),
              ("B", "had worked well and those who had shirked"), ("B", "their tasks, and the clerk wrote both lists"),
              ("A", "into the ledger kept for it by the superin-"), ("B", "tendent of the house, who signed it nightly"),
              ("B", "before the lamps were put out in the yard"), ("E", "and the doors were locked on the street.")]
ENDS_TEXT = ("Eighty years later the warden drew up his rules for the house of young prisoners in the capital. The prisoners rose "
             "at six, considered the bell an order and worked; a dog had lain the day before on the grass, philosophy was nowhere "
             "taught, and an ornamental crepe hung over the chapel door, warmer than the yard where the archers waited by the fire "
             "until nearly eleven; then a sentinel called the names of the inmates who had worked well and those who had shirked "
             "their tasks, and the clerk wrote both lists into the ledger kept for it by the superintendent of the house, who "
             "signed it nightly before the lamps were put out in the yard and the doors were locked on the street.")
def line_ends_pdf():
    size, cw, left, right = 9, 5.4, 40.0, 330.0   # Courier: every glyph 0.6 of the type size wide
    ops, y = [], 520.0
    for kind, line in ENDS_LINES:
        words = line.split(" ")
        end = {"A": right, "B": right - 0.16 * size, "C": right - 0.6 * size, "E": None}[kind]
        letters = sum(len(w) for w in words) * cw
        gap = cw if end is None else (end - left - letters) / (len(words) - 1)
        assert gap >= 3, (line, gap)
        x = left
        for w in words:
            ops.append(f"BT /F1 {size} Tf {x:.2f} {y:.2f} Td ({w}) Tj ET")
            x += len(w) * cw + gap
        y -= 12
    content = "\n".join(ops).encode("latin-1")
    objs = [b"<< /Type /Catalog /Pages 2 0 R >>", b"<< /Type /Pages /Kids [3 0 R] /Count 1 >>",
            b"<< /Type /Page /Parent 2 0 R /MediaBox [0 0 370 576] /Contents 4 0 R /Resources << /Font << /F1 5 0 R >> >> >>",
            b"<< /Length %d >>\nstream\n" % len(content) + content + b"\nendstream",
            b"<< /Type /Font /Subtype /Type1 /BaseFont /Courier /Encoding /WinAnsiEncoding >>"]
    out, offs = bytearray(b"%PDF-1.4\n"), []
    for i, o in enumerate(objs, 1): offs.append(len(out)); out += b"%d 0 obj\n" % i + o + b"\nendobj\n"
    xref = len(out); out += b"xref\n0 %d\n0000000000 65535 f \n" % (len(objs) + 1)
    for o in offs: out += b"%010d 00000 n \n" % o
    out += b"trailer\n<< /Size %d /Root 1 0 R >>\nstartxref\n%d\n%%%%EOF\n" % (len(objs) + 1, xref)
    return bytes(out)

FRONT = """async ([url, base]) => {
  LIBS.pdf = [base + "/pdf.js"]; LIBS.pdfw = [base + "/pdf.worker.js"];
  const r = await parseFile(new File([await (await fetch(url)).arrayBuffer()], url.split("/").pop()), () => {});
  const fr = r.blocks.filter((b) => b.k === "front");
  return { heads: r.blocks.filter((b) => b.k === "h").map((b) => b.x), sections: r.sections.map((s) => s.label),
           title: fr.find((b) => b.x.startsWith("THE BOOK")) || null, author: fr.find((b) => b.x === "A. N. Author") || null,
           repeated: [fr.filter((b) => b.x === "Contents").length, fr.filter((b) => b.x === "Preface").length], lines: fr.map((b) => b.x) };
}"""
FRONT_KINDS = """async ([url, base]) => {
  LIBS.pdf = [base + "/pdf.js"]; LIBS.pdfw = [base + "/pdf.worker.js"];
  const r = await parseFile(new File([await (await fetch(url)).arrayBuffer()], url.split("/").pop()), () => {});
  return { preface: r.blocks.filter((b) => (b.x || "").startsWith("A short preface")).map((b) => b.k), opens: r.blocks.filter((b) => (b.x || "").startsWith("Chapter 2 takes up")).map((b) => b.k),
           printed: r.blocks.filter((b) => b.k !== "h" && /^(chapter \\d|preface)$/i.test((b.x || "").trim())).map((b) => b.x) };
}"""
# A page that can't be read: parsing stops with an error and the worker is let go.
BADPAGE = """async ([url, base]) => {
  LIBS.pdf = [base + "/pdf.js"]; LIBS.pdfw = [base + "/pdf.worker.js"];
  const W = window.Worker, count = { made: 0, ended: 0 }, keep = linesOf;
  window.Worker = class extends W { constructor(...a) { super(...a); count.made++; } terminate() { count.ended++; return super.terminate(); } };
  linesOf = () => { throw new Error("unreadable page"); };
  let err = "";
  try { await parseFile(new File([await (await fetch(url)).arrayBuffer()], url.split("/").pop()), () => {}); }
  catch (e) { err = String(e && e.message); }
  finally { linesOf = keep; window.Worker = W; }
  return { err, ...count };
}"""

PARSE = """async ([url, base]) => {
  LIBS.pdf = [base + "/pdf.js"]; LIBS.pdfw = [base + "/pdf.worker.js"];
  const r = await parseFile(new File([await (await fetch(url)).arrayBuffer()], url.split("/").pop()), () => {});
  return { heads: r.blocks.filter((b) => b.k === "h").map((b) => b.x), labels: r.blocks.filter((b) => b.k === "pg").map((b) => b.x),
           text: r.blocks.filter((b) => b.k !== "pg" && b.k !== "h").map((b) => b.x).join("\\n"), source: r.pageSource, paras: r.blocks.filter((b) => b.k === "p").length,
           quotes: r.blocks.filter((b) => b.k === "q").map((b) => b.x), lang: r.lang, front: r.blocks.filter((b) => b.k === "front").map((b) => b.x) };
}"""

# Lines as OCR read them in a scanned book, and what the repairs should make of them. The last cases
# must come through unchanged: real compounds, names with odd letters, numbers side by side, clean prose.
OCR_CASES = [
    ["We must thus make co;mections, ever more connections.", "We must thus make connections, ever more connections."],
    ["But this pragmatism-this And-is not an instrumentalism", "But this pragmatism—this And—is not an instrumentalism"],
    ["a kind of trust or confidence--a belief-in-the-world.", "a kind of trust or confidence—a belief-in-the-world."],
    ['knocking at the door,"3 The "machines" Kafka set up', 'knocking at the door,"³ The "machines" Kafka set up'],
    ["W hat is supposed by such crossing. T hus he asks", "What is supposed by such crossing. Thus he asks"],
    ["not a generality but a si ngularity of the highest degree", "not a generality but a singularity of the highest degree"],
    ["fr�m t�eir rela,tions and fic,tions, as DeleU2e says", "from their relations and fictions, as Deleuze says"],
    ["he wanted to explore.l1 The problems.s Then", "he wanted to explore.¹¹ The problems.⁵ Then"],
    ["(Minuit, 1 998); see pp. 1 2 2-1 24 and 1 42ft'.", "(Minuit, 1998); see pp. 122-124 and 142ff."],
    ["free affect from f.'''l.�VJ'''''' percept", "free affect from [illegible] percept"],
    ["that of Hobbes, public professor;16 and even", "that of Hobbes, public professor;¹⁶ and even"],
    ["would remain miredY", "would remain mired."],
    ["the encyclopedia that still haunted HegeL More generally, thought itselP Flaubert", "the encyclopedia that still haunted Hegel More generally, thought itself Flaubert"],
    ["a view that might be contr�sted with that of Hobbes", "a view that might be contrasted with that of Hobbes"],
    ['affinities lie more pyj"lll�lrl with the stones brought r"c,"rlh"r temporally', "affinities lie more [illegible] with the stones brought [illegible] temporally"],
    ["Jean-Franc;ois Lyotard and Fran<;ois Chatelet", "Jean-Franc;ois Lyotard and Fran<;ois Chatelet"],
    ["as Spinoza�r said", "as Spinoza�r said"],
    ["state-of-the-art, face-to-face, a well-known man", "state-of-the-art, face-to-face, a well-known man"],
    ["chapters 15 31 49 and the year 1998 (e.g., here)", "chapters 15 31 49 and the year 1998 (e.g., here)"],
    ["The concept of immanence is a plane, not a transcendence.", "The concept of immanence is a plane, not a transcendence."],
]

failures = []
def check(ok, what):
    print(("ok   " if ok else "FAIL ") + what)
    if not ok: failures.append(what)

async def main(paths):
    build = pdfjs_dir()
    tmp = Path(tempfile.mkdtemp())
    (tmp / "index.html").symlink_to(ROOT / "index.html"); (tmp / "data").symlink_to(ROOT / "data"); (tmp / "js").symlink_to(ROOT / "js"); (tmp / "css").symlink_to(ROOT / "css"); (tmp / "lib").symlink_to(build)
    server = subprocess.Popen([sys.executable, "-m", "http.server", str(PORT), "-d", str(tmp)], stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
    try:
        time.sleep(1)
        async with async_playwright() as p:
            browser = await p.chromium.launch()
            page = await browser.new_page(); errs = []
            page.on("pageerror", lambda e: errs.append(str(e)))
            await page.goto(f"http://localhost:{PORT}/index.html"); await page.wait_for_function("typeof idb !== 'undefined' && idb")
            base = f"http://localhost:{PORT}/lib"
            if paths:
                for i, path in enumerate(paths):
                    (tmp / f"book{i}.pdf").symlink_to(Path(path).resolve())
                    r = await page.evaluate(PARSE, [f"/book{i}.pdf", base])
                    print(f"\n{path}\n  page numbers ({r['source']}): {' '.join(r['labels'][:40])}{' …' if len(r['labels']) > 40 else ''}\n  paragraphs: {r['paras']}\n  headings ({len(r['heads'])}):")
                    for h in r["heads"]: print("    " + h[:100])
            else:
                maker = await browser.new_page()
                for name, (html, heads) in {"justified": book(True), "ragged": book(False), "twoline": twoline(), "parttitle": parttitle(), "scanlike": scanlike(), "quotes": quotes()}.items():
                    await maker.set_content(html)
                    await maker.pdf(path=str(tmp / f"{name}.pdf"), prefer_css_page_size=True, display_header_footer=True, header_template="<span></span>",
                        footer_template='<div style="font-size:9px;width:100%;text-align:center"><span class="pageNumber"></span></div>',
                        margin={"top": "0.8in", "bottom": "0.4in" if name == "scanlike" else "0.8in", "left": "0.7in", "right": "0.7in"})
                    r = await page.evaluate(PARSE, [f"/{name}.pdf", base])
                    check(r["heads"] == heads, f"{name}: headings exactly as typeset" + ("" if r["heads"] == heads else f" (got {r['heads']})"))
                    check(r["labels"] == [str(i + 1) for i in range(len(r["labels"]))], f"{name}: pages numbered 1 to {len(r['labels'])} in order" + ("" if r["labels"] == [str(i + 1) for i in range(len(r["labels"]))] else f" (got {r['labels']})"))
                    bad = re.findall(r"\b\w+- \w+|\b\w+­\w*", r["text"])
                    check(not bad, f"{name}: no words left broken across lines" + (f" (e.g. {bad[:3]})" if bad else ""))
                    if name == "scanlike":
                        left = re.findall(r"\S*hapte\S*", r["text"])
                        check(not left, "scanlike: misread running heads removed" + (f" (left: {left})" if left else ""))
                    if name in ("justified", "ragged"):
                        # (a quote broken by a page comes in two pieces; a paragraph is twice as long as a quote, so none is mistaken for one)
                        check(len(r["quotes"]) >= 9 and all(q[:40] in BODY and len(q) <= len(BODY) + 5 for q in r["quotes"]), f"{name}: block quotes in smaller type are quotes, and no paragraph is ({len(r['quotes'])} pieces)")
                    if name == "quotes":
                        check(len(r["quotes"]) == 3 and all(q.startswith("We must think") and q.endswith("nothing else.") for q in r["quotes"]), f"quotes: the 3 block quotes at body size are quotes, whole ({[q[:30] for q in r['quotes']]})")
                        check(not any("short paragraph" in q or q.startswith("The question") for q in r["quotes"]), "quotes: ordinary and one-line paragraphs stay paragraphs")
                    check(not r["front"], f"{name}: a book that starts with its text has no front matter, short pages at a chapter's end included" + (f" (got {r['front'][:3]})" if r["front"] else ""))
                    check(r["lang"] == "en", f"{name}: the language is worked out as English ({r['lang']})")
                    marks = re.findall(r"\[…\]|\[illegible\]", r["text"])
                    check(not marks, f"{name}: no OCR repairs on a typeset book" + (f" (found {marks[:3]})" if marks else ""))
                await maker.set_content(listbook())
                await maker.pdf(path=str(tmp / "listbook.pdf"), prefer_css_page_size=True, margin={"top": "0.8in", "bottom": "0.8in", "left": "0.7in", "right": "0.7in"})
                r = await page.evaluate(PARSE, ["/listbook.pdf", base])
                paras = r["text"].split("\n")
                whole = [x for x in paras if any(x.endswith(t) for t in ITEMS)]
                # (Chrome draws a bullet as a shape, so the bulleted items have no marker to keep)
                want = [f"1. {ITEMS[0]}", f"2. {ITEMS[1]}", ITEMS[0], ITEMS[1]]
                check(whole == want, f"listbook: a list item runs on under its number as one paragraph, its number kept ({[x[:30] for x in whole]})")
                check(" / ".join(VERSE_LINES) in r["text"], f"listbook: verse quoted in short lines keeps them, as \" / \" ({[x[:90] for x in paras if 'traveller' in x]})")
                await maker.set_content(f'<html lang="en"><style>{CSS}</style><p>{BODY * 3}</p><p>{BODY * 3}</p></html>')
                await maker.pdf(path=str(tmp / "headed.pdf"), prefer_css_page_size=True, display_header_footer=True,
                    header_template='<div style="font-size:9px;width:100%;padding-left:0.7in"><span class="pageNumber"></span> ON METHOD IN SHORT ESSAYS</div>', footer_template="<span></span>",
                    margin={"top": "0.8in", "bottom": "0.8in", "left": "0.7in", "right": "0.7in"})
                r = await page.evaluate(PARSE, ["/headed.pdf", base])
                check(len(r["labels"]) == 2 and "ON METHOD" not in r["text"], f"headed: a running head carrying the page's number goes, though two pages are too few to know it by repeating ({r['labels']}, {r['text'][:80]!r})")
                await maker.set_content(biopage())
                await maker.pdf(path=str(tmp / "bio.pdf"), prefer_css_page_size=True, margin={"top": "0.8in", "bottom": "0.8in", "left": "0.7in", "right": "0.7in"})
                r = await page.evaluate(PARSE, ["/bio.pdf", base])
                check(BIO in r["front"], f"bio: an author's note on the title page runs on as one paragraph, its printed lines joined ({r['front']})")
                html, heads = front()
                await maker.set_content(html)
                await maker.pdf(path=str(tmp / "front.pdf"), prefer_css_page_size=True, outline=True, tagged=True)
                r = await page.evaluate(FRONT, ["/front.pdf", base])
                check(r["heads"] == heads and r["sections"] == heads, f"front: the outline's sections on front pages keep their headings ({r['heads']})")
                check(r["repeated"] == [0, 1], f"front: a title given as a heading isn't repeated as a line (only the contents entry for Preface stays: {r['repeated']})")
                t, a = r["title"] or {}, r["author"] or {}
                check(t.get("size", 0) > 1.3 and t.get("heading") is True and a.get("space", 0) > 1 and a.get("size", 0) > 1, f"front: the title page keeps its type sizes and spacing (title {t}, author {a}, lines {r['lines'][:4]})")
                r = await page.evaluate(FRONT_KINDS, ["/front.pdf", base])
                check(r["preface"] == ["p"], f"front: the one-line preface under its outline heading is prose, though its words include the title ({r['preface']})")
                check(r["opens"] == ["p"], f"front: a chapter's first line that uses its title's words is kept ({r['opens']})")
                check(r["printed"] == ["Preface"], f"front: the printed chapter titles go with their headings (only the contents entry \"Preface\" stays: {r['printed']})")
                await maker.set_content(philosophy())
                await maker.pdf(path=str(tmp / "philosophy.pdf"), prefer_css_page_size=True, display_header_footer=True, header_template="<span></span>",
                    footer_template='<div style="font-size:9px;width:100%;text-align:center"><span class="pageNumber"></span></div>', margin={"top": "0.8in", "bottom": "0.8in", "left": "0.7in", "right": "0.7in"})
                at = await page.evaluate(PHIL, ["/philosophy.pdf", base])
                opening = [(k, x) for k, x, pg in at if pg in ("1", "2", "3", "4", "5", "6")]
                check(opening and all(k == "front" for k, x in opening) and any(x == "Contents" for k, x in opening) and any(x.startswith("ISBN") for k, x in opening) and any(x.startswith("being an inquiry") for k, x in opening),
                      f"philosophy: half-title, title page, copyright, dedication and contents are front matter, line by line ({[k for k, x in opening if k != 'front'][:5]})")
                later = [(k, x[:40], pg) for k, x, pg in at if pg not in ("1", "2", "3", "4", "5", "6") and k == "front"]
                check(not later, f"philosophy: nothing after the contents is front matter ({later[:4]})")
                pre = [k for k, x, pg in at if x.startswith("The contents of experience")]
                check(pre == ["p", "p"] and ("h", "Preface") in [(k, x) for k, x, pg in at], f"philosophy: the short preface is a heading and prose, though it mentions contents and copyright ({pre})")
                end = [k for k, x, pg in at if CHAPTER_END in x]
                check(end in (["p"], ["c"]), f"philosophy: the chapter's last lines, on a page of their own, are prose ({end})")
                (tmp / "ocrlayer.pdf").write_bytes(ocr_layer_pdf())
                raw = await page.evaluate("""async ([url, base]) => { LIBS.pdf = [base + "/pdf.js"]; LIBS.pdfw = [base + "/pdf.worker.js"];
                  const { pdf, stop } = await pdfOpen(await (await fetch(url)).arrayBuffer()); const tc = await (await pdf.getPage(1)).getTextContent();
                  await pdf.destroy(); stop(); return tc.items.map((i) => i.str).join("|"); }""", ["/ocrlayer.pdf", base])
                check("anycloser" in raw.lower().replace("|", ""), f"ocrlayer: the generated page reproduces the fault, words run together as PDF.js reads them ({raw[:80]!r})")
                r = await page.evaluate(PARSE, ["/ocrlayer.pdf", base])
                body = re.sub(r"\s+", " ", r["text"] + " " + " ".join(r["heads"]))
                check(OCR_WORDS in body, f"ocrlayer: every space the PDF holds comes back, in order, quotation mark and all ({body[:160]!r})")
                check("DISCIPLINE AND PUNISH" in body, f"ocrlayer: a letter-spaced title reads as its words ({body[:60]!r})")
                check("[…]" not in body, "ocrlayer: a word read a few points high doesn't split its line or leave a false gap")
                (tmp / "lineends.pdf").write_bytes(line_ends_pdf())
                r = await page.evaluate(PARSE, ["/lineends.pdf", base])
                body = " ".join(r["text"].split())
                glued = [w for w in ("doghad", "warmerthan", "ornamentalcrepe", "inthe", "upthe") if w in body.replace(" ", "|").replace("|", " ") and w in body]
                check(ENDS_TEXT in body, f"lineends: a line ending a little short of the margin ends its word; a hyphen lost from the text is still joined ({body[:200]!r})")
                check(not glued, f"lineends: no two words glued at a line's end ({glued})")
                r = await page.evaluate(BADPAGE, ["/justified.pdf", base])
                check("unreadable page" in r["err"] and r["made"] >= 1 and r["ended"] == r["made"], f"a page that can't be read stops the import and its worker ({r})")
                # The OCR repairs, on lines from a real scan, with the book's vocabulary they rely on.
                vocab = ("connections deleuze immanence singularity from their relations fictions what thus the question precisely "
                         "explore problems machine machines minuit year state art face known man would plane concept transcendence "
                         "contrast hobbes itself spinoza ") * 3
                for got, want in await page.evaluate("""([cases, vocab]) => {
                    const counts = new Map(); for (const w of vocab.toLowerCase().match(/\\p{L}+/gu)) counts.set(w, (counts.get(w) || 0) + 1);
                    return cases.map(([inp, want]) => [ocrRepair([{ k: "p", x: inp }], counts)[0].x, want]); }""", [OCR_CASES, vocab]):
                    check(got == want, f"OCR repair: {want!r}" + ("" if got == want else f" (got {got!r})"))
            check(not errs, "no script errors" + (f": {errs}" if errs else ""))
            await browser.close()
    finally:
        server.terminate()

asyncio.run(main(sys.argv[1:]))
if failures: print(f"\n{len(failures)} failed"); sys.exit(1)
if len(sys.argv) == 1: print("\nall passed")
