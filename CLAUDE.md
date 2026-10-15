# Working on Marginalia

Personal, single-user reading app (Lumiii's). Hosted on GitHub Pages from `main`: whatever lands on `main` is live on the owner's phone within about a minute.

## How changes ship

- **Pull request** (branch + PR, owner merges) for anything touching stored data:
  the IndexedDB schema or `idbOpen` upgrade code, the `STORES` list, the shape of records in any store,
  backup (`version` in the export), restore (`VALID`, `planRestore`, merging), or `sw.js` caching.
  A mistake there can stop the app from opening the owner's library.
- **Direct push to `main`** for everything else: interface, styling, reader behaviour, glossary and branches content, exports.
- One logical change per commit, with a plain message saying what changed for the reader.
- Test before pushing: run `python3 tests/smoke.py` (every screen at phone and desktop width, the reader, and a full backup → wipe → restore round trip). Add a check to it when a change adds a screen or a stored field.
- After any change to PDF import, also run `python3 tests/pdf_import.py` (generated books: headings, page order, broken words, a scan-like book). `python3 tests/pdf_import.py some.pdf` shows what the parser makes of a real book, for checking a bad import; real books stay out of the repo.
- After any change to the reader, also run `python3 tests/paged_reader.py` (Swipe pages: gestures, alignment, flips, joined paragraphs, chapters) `python3 tests/structure.py` (marking chapters, headings, running heads and title pages with Edit) `python3 tests/comfort.py` (tap to turn, the hidden toolbar, the screen kept on, status-bar colours, Scroll mode on a long book) `python3 tests/navigate.py` (Find with marks and arrows, the slider, Go to page, pages left in the chapter, the Contents tabs) `python3 tests/highlights.py` (highlights on the exact words, across paragraphs and pages, after corrections; Continue on next page) `python3 tests/notes_lookup.py` (tapping note numbers for footnotes and endnotes; Wiktionary in Look up, with a stand-in for the API) `python3 tests/quotes_language.py` (Edit → A block quote; a book's language for hyphenation) and `python3 tests/printed_page.py` (keeping a book's PDF and showing its printed pages; the storage upgrade to version 7).
- This session can't delete remote branches; the repo is set to delete merged PR branches automatically (if not, tell the owner).

## Rules

- **Never commit books, PDFs or backup files.** The repository is public.
- Changing the stored shape of a record: bump `indexedDB.open("marginalia", N)` only when a store is added or needs migration,
  keep old records readable, and update `VALID` so old backups still restore.
- Keep the app a single static site with no build step. Libraries load from cdnjs; fonts from Google Fonts (the service worker caches only those hosts).
- If `sw.js` changes in a way that needs old caches dropped, bump `CACHE`.

## Map of index.html

- `<style>` near the top; one `<script>` holds the whole app.
- Storage: `STORES`, `idbOpen`, `put`, `del`, `idbTx`. Backup export and restore follow. The `files` store (version 7) holds
  original PDFs kept for the printed page, by text id; it is never loaded at start and never backed up (`keepPdf`, `pdfDoc`).
  A text's `pdfLabels` are its PDF pages' labels, used to find the PDF page for a printed page number.
- Citations: `CITE_STYLES`, `citeAt`, `bibEntry`, `bibtex`.
- Import/parsing: `linesOf` and `unmerge` (PDF lines; scans' merged words), `parsePDF` (per-page body size, page numbers, headings, lost hyphens; `GAP` marks words OCR left blank as "[…]"), `ocrRepair` (scans only, gated by `ocrSigns`: split and misread words corrected against the book's own vocabulary, dashes, note numbers, split numbers, "[illegible]"), `domToBlocks` / `parseHTML` (EPUB, DOCX), `parsePlain`.
- Views: `render` dispatches to `libraryView`, `textView`, `tagView`, `questionsView`, `draftsView`/`draftView`, `comparesView`/`compareView`, `concordView`, glossary and branches.
- Data: `GLOSSARY` (large), `BRANCHES`, `LINKS`.
- Quiz yourself (`quizPanel`, from the glossary and the home screen's glossary section): questions made from `allTerms()` definitions
  (the term blanked out by `maskTerm`) and `THINKERS` key works (`worksOf` leaves out works by other authors); nothing is stored.
- Thinkers' timeline (glossary → Thinkers → Timeline, `S.tl`): `lifeSpan` reads a thinker's dates line (BCE, centuries, "b. 1929"),
  `timelineHTML` draws each period in `TL_ERAS` on its own scale; `contemporariesOf` (lives overlapping 20+ years) is on the thinker card.
- Reader settings live in `localStorage` under `mg-reader`; other small preferences use `mg-*` keys (`mg-dict`: Wiktionary definitions kept for offline).
- A text's `lang` (optional, e.g. "fr") sets the reader's `lang` for hyphenation; without it the language is guessed from the text (`guessLang`).
- Book structure the owner marks in the reader (Edit → chapter title, heading, running head, title page, block quote, plain text) is stored on
  content blocks: `st` (the role), `sth` (only the first sth characters are the title or running head), `stj` (continues the
  title above). `roleOf(b)` reads it; a chapter keeps its section id in `b.s`, and `t.sections` follows the chapter blocks in
  order (`sectionsFor`). Block indices never change, since notes, bookmarks and reading positions point at them.
- A note made from a selection keeps `anchor: {a, ao, b, bo, pre, suf}`: start block and character, end block and character
  (exclusive), and the words either side; characters are counted in the block's text without italics markers. `placeNote`
  checks the anchor still reads as the passage and otherwise finds the passage near `at` (older notes have no anchor and are
  placed the same way). `marksByBlock` turns placed notes into per-block ranges.
