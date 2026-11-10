"""Importing HTML (the path EPUB and Word files take too), Markdown and plain text. Run after changes to those importers:
python3 tests/text_import.py

Made-up files only, parsed in the page by the app's own parseFile. Checks that:
  1. a list keeps its numbers and bullets (start, value, type, nested lists, items with paragraphs), never doubled, none where
     the list is styled without them;
  2. a line break inside verse, an address or a two-line title is kept as " / " (as verse is quoted); one inside a prose
     paragraph (an e-book that kept a printed page's lines) and one in a heading is a space;
  3. a note reference set as a link (epub:type="noteref", doc-noteref) is a superscript; a note's link back is dropped, unless
     it is the note's number;
  4. a table's row is one line, its cells apart;
  5. Markdown: list markers, hard line breaks, footnotes ([^1], [^name]), front matter's title and author, pipe tables, curly
     quotes and dashes (code left alone), a quote's paragraphs;
  6. plain text: verse in a hard-wrapped file keeps its lines, prose is joined, a list is split into its items, table rules go,
     quotes curl;
  7. a text file saved as Windows-1252 or UTF-16 reads as written.
Needs: pip install playwright && playwright install chromium
"""
import asyncio, os, subprocess, sys, time
from pathlib import Path
from playwright.async_api import async_playwright

ROOT = Path(__file__).resolve().parent.parent
PORT = int(os.environ.get("MG_PORT", 8812))
URL = f"http://localhost:{PORT}/index.html"

failures = []
def check(ok, what):
    print(("ok   " if ok else "FAIL ") + what)
    if not ok: failures.append(what)

PARSE = """async ([name, text]) => {
  const r = await parseFile(new File([text], name, { type: name.endsWith('.txt') ? 'text/plain' : '' }), () => {});
  return { title: r.title, author: r.author, blocks: r.blocks.map((b) => [b.k, plain(b.x || '')]) };
}"""

HTML = """<html><body>
<h1>Book One<br/>The Beginning</h1>
<ol start="3"><li>Third item</li><li>Fourth item</li><li value="9">Ninth item</li></ol>
<ul><li>Outer item<ul><li>Inner item</li></ul></li></ul>
<ol type="i"><li>First roman</li><li>Second roman</li></ol>
<ol><li><p>An item with a paragraph</p></li><li>1. Already numbered</li></ol>
<ul style="list-style: none"><li>No marker here</li></ul>
<blockquote><p>O water, voice of my heart, crying in the sand,<br/>All night long crying with a mournful cry,<br/>As I lie and listen</p></blockquote>
<p>This paragraph was converted from a printed page and kept every line break the page had, which makes<br/>each of its lines about as long as the printed line was, so the breaks are only where the page ran<br/>out of room and the words should simply run on together as one paragraph of prose does.</p>
<p>A claim with a note<a epub:type="noteref" href="#n1">1</a> and another<a role="doc-noteref" href="#n2">[2]</a>.</p>
<table><tr><th>Term</th><th>Greek</th></tr><tr><td>virtue</td><td><i>aretē</i></td></tr></table>
<aside epub:type="footnote" id="n1"><p>The first note. <a role="doc-backlink" href="#r1">↩︎</a></p></aside>
<aside epub:type="footnote" id="n2"><p><a class="footnote-back" href="#r2">2</a>. The second note.</p></aside>
</body></html>"""

MD = """---
title: "A Test of Markdown"
author: A. N. Author
---

# Chapter One

1. First definition
2) Second definition

- a bullet
* another bullet

A claim with a note[^1] and a named one[^why].

> I met a traveller from an antique land,\\
> Who said—"Two vast and trunkless legs of stone\u0020\u0020
> Stand in the desert."
>
> — Shelley

Shelley's "Ozymandias" -- and the 'single' quotes, with `code's "quotes"` left alone; a dash---here.

| Term | Greek |
|------|-------|
| virtue | aretē |

[^1]: The first note.
[^why]: The named note,
    which runs on.
"""

TXT = """Chapter One

The prose of this file is wrapped at about seventy characters a line, the
way plain text files from a typewriter or an old archive usually are, so
these lines must run on together as one paragraph and never break apart.

Unresting water, there shall never be rest
Till the last moon droop and the last tide fail,
And the fire of the end begin to burn in the west;

1. By that which is self-caused, I mean that of which the
   essence involves existence.
2. A thing is called finite after its kind.

--------- ---------
Term      Greek
--------- ---------

He said "it's here" -- and left.
"""

async def main():
    server = subprocess.Popen([sys.executable, "-m", "http.server", str(PORT), "-d", str(ROOT)], stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
    try:
        time.sleep(1)
        async with async_playwright() as p:
            browser = await p.chromium.launch(); ctx = await browser.new_context(bypass_csp=True, service_workers="block")
            page = await ctx.new_page(); errs = []
            page.on("pageerror", lambda e: errs.append(str(e)))
            await page.goto(URL); await page.wait_for_function("typeof idb !== 'undefined' && idb")
            has = lambda bl, k, x: any(b == [k, x] for b in bl)

            r = await page.evaluate(PARSE, ["test.html", HTML]); bl = r["blocks"]; xs = [x for _, x in bl]
            check(has(bl, "h", "Book One The Beginning"), f"html: a line break in a heading is a space ({[b for b in bl if b[0] == 'h']})")
            check(all(x in xs for x in ["3. Third item", "4. Fourth item", "9. Ninth item"]), f"html: a numbered list keeps its numbers, from its start and an item's value ({xs[:4]})")
            check("• Outer item" in xs and "◦ Inner item" in xs, "html: bullets kept, a nested list's marked apart")
            check("i. First roman" in xs and "ii. Second roman" in xs, "html: a list of type i is numbered in roman numerals")
            check("1. An item with a paragraph" in xs and "2. 1. Already numbered" not in xs and "1. Already numbered" in xs, "html: an item made of a paragraph gets its number; an item that begins with one keeps only that")
            check("No marker here" in xs, "html: a list styled without markers gets none")
            check(has(bl, "q", "O water, voice of my heart, crying in the sand, / All night long crying with a mournful cry, / As I lie and listen"), "html: line breaks in verse are kept as \" / \"")
            prose = next((x for x in xs if x.startswith("This paragraph was converted")), "")
            check(" / " not in prose and "makes each of its lines" in prose, f"html: line breaks a prose paragraph kept from its printed page are spaces ({prose[:90]!r})")
            check("A claim with a note¹ and another²." in xs, f"html: note references set as links are superscripts ({[x for x in xs if x.startswith('A claim')]})")
            check("Term · Greek" in xs and "virtue · aretē" in xs, "html: a table's row is one line, its cells apart")
            check(has(bl, "fn", "The first note.") and has(bl, "fn", "2. The second note."), f"html: a note's link back is dropped, unless it is the note's number ({[b for b in bl if b[0] == 'fn']})")

            r = await page.evaluate(PARSE, ["test.md", MD]); bl = r["blocks"]; xs = [x for _, x in bl]
            check(r["title"] == "A Test of Markdown" and r["author"] == "A. N. Author" and not any("title:" in x for x in xs), f"markdown: front matter gives the title and author and isn't text ({r['title']!r}, {r['author']!r})")
            check("1. First definition" in xs and "2. Second definition" in xs and "• a bullet" in xs and "• another bullet" in xs, "markdown: list items keep their numbers and bullets")
            check("A claim with a note¹ and a named one²." in xs, f"markdown: footnote references are superscript numbers ({[x for x in xs if x.startswith('A claim')]})")
            check(has(bl, "fn", "1. The first note.") and has(bl, "fn", "2. The named note, which runs on."), f"markdown: footnotes are notes, numbered, their run-over lines joined ({[b for b in bl if b[0] == 'fn']})")
            check(has(bl, "q", "I met a traveller from an antique land, / Who said—“Two vast and trunkless legs of stone / Stand in the desert.”") and has(bl, "q", "— Shelley"),
                  f"markdown: hard line breaks (backslash, two spaces) are kept as \" / \", and an empty quoted line starts the quote's next paragraph ({[b for b in bl if b[0] == 'q']})")
            sq = next((x for x in xs if x.startswith("Shelley")), "")
            check(sq == "Shelley’s “Ozymandias” — and the ‘single’ quotes, with code's \"quotes\" left alone; a dash—here.", f"markdown: quotes curl and hyphens become dashes, code left alone ({sq!r})")
            check("Term · Greek" in xs and "virtue · aretē" in xs and not any("---" in x or "—|" in x for x in xs), "markdown: a pipe table's rows are lines, its rule left out")

            r = await page.evaluate(PARSE, ["test.txt", TXT]); bl = r["blocks"]; xs = [x for _, x in bl]
            check(any(x.startswith("The prose of this file is wrapped") and x.endswith("never break apart.") and " / " not in x for x in xs), "text: wrapped prose runs on as one paragraph")
            check(has(bl, "q", "Unresting water, there shall never be rest / Till the last moon droop and the last tide fail, / And the fire of the end begin to burn in the west;"), f"text: a paragraph of lines much shorter than the file's keeps them, as verse ({[b for b in bl if b[0] == 'q']})")
            check("1. By that which is self-caused, I mean that of which the essence involves existence." in xs and "2. A thing is called finite after its kind." in xs, f"text: a list is split into its items, run-over lines joined ({[x for x in xs if x[:1].isdigit()]})")
            check(not any("----" in x or "—-" in x for x in xs), "text: a table's rules are left out")
            check("He said “it’s here” — and left." in xs, f"text: quotes curl and a double hyphen is a dash ({[x for x in xs if x.startswith('He said')]})")
            # 7 encodings: a Windows-encoded file and a UTF-16 one read as they were saved
            src = "Déjà vu — “the eternal return” of the same, Nietzsche’s thought.\n"
            for enc, raw in (("windows-1252", list(src.encode("cp1252"))), ("utf-16", list(b"\xff\xfe" + src.encode("utf-16-le")))):
                got = await page.evaluate("""async ([bytes]) => { const r = await parseFile(new File([new Uint8Array(bytes)], 'old.txt', { type: 'text/plain' }), () => {}); return plain(r.blocks[0].x); }""", [raw])
                check(got == src.strip(), f"text: a file saved as {enc} reads as written ({got!r})")
            check(not errs, f"no script errors ({errs[:2]})")
            await browser.close()
    finally:
        server.terminate()
    if failures: print(f"\n{len(failures)} failed"); sys.exit(1)
    print("\nall passed")

asyncio.run(main())
