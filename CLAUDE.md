# Working on Marginalia

Personal, single-user reading app (Lumiii's). Hosted on GitHub Pages from `main`: whatever lands on `main` is live on the owner's phone within about a minute.

## What Marginalia is for

A personal philosophical reading and research environment built around close reading, rigorous reference material and
traceable conceptual relationships. It grows with the texts and questions its owner chooses to pursue (now: Aristotle →
Spinoza → Deleuze → Land); it does not try to cover all of philosophy.

- **Depth before breadth.** An entry is worth having because its claims are accurate, attributed and sourced. Add thinkers,
  terms or texts when a reading needs them, never to fill out coverage.
- **Connections need evidence.** A link between thinkers or concepts says what kind it is (influence, critique,
  reinterpretation) and rests on a source or a passage. Shared vocabulary or chronology alone is not a connection.
- **The library sets the horizon.** Features work on whatever the owner imports, with the bundled classics as a foundation;
  new traditions should need new content, not new subsystems.
- **Contested readings are credited.** Interpretation of any thinker, Deleuze and Guattari included, rests on named
  academic scholarship (SEP, IEP, published scholars), never on forum posts or unsourced takes.

The test for any addition: does it deepen the owner's ability to read, investigate, compare or substantiate philosophical
ideas? If not, it waits.

## How changes ship

- **Pull request** (branch + PR, owner merges) for anything touching stored data:
  the IndexedDB schema or `idbOpen` upgrade code, the `STORES` list, the shape of records in any store,
  backup (`version` in the export), restore (`VALID`, `planRestore`, merging), or `sw.js` caching.
  A mistake there can stop the app from opening the owner's library.
- **Direct push to `main`** for everything else: interface, styling, reader behaviour, glossary and branches content, exports.
- One logical change per commit, with a plain message saying what changed for the reader.
- A pull request carries a finished change to the app: a working feature, a fix, or an audited article. No PRs for plans, research
  briefs, outlines or unaudited drafts; keep those in the chat until they are done. Work on several articles goes in one PR per finished
  article, never one per step.
- Articles still to audit, and their order, are in `tests/audit/QUEUE.md`. Take the next one from there; take its line off in the PR that
  ships its audit.
- Test before pushing: run `python3 tests/smoke.py` (every screen at phone and desktop width, the reader, and a full backup → wipe → restore round trip). Add a check to it when a change adds a screen or a stored field.
- After changes to storage or deleting, also run `python3 tests/trash.py` (Recently deleted, and the upgrade to version 8).
- After changes to PDF import or to highlights from a PDF, also run `python3 tests/pdf_highlights.py` (needs `pip install pypdf`; it marks up a
  generated book and imports it).
- After any change to PDF import, also run `python3 tests/pdf_import.py` (generated books: headings, page order, broken words, a scan-like book). `python3 tests/pdf_import.py some.pdf` shows what the parser makes of a real book, for checking a bad import; real books stay out of the repo.
- After any change to the reader, also run `python3 tests/paged_reader.py` (Swipe pages: gestures, alignment, flips, joined paragraphs, chapters) `python3 tests/structure.py` (marking chapters, headings, running heads and title pages with Edit) `python3 tests/comfort.py` (tap to turn, the hidden toolbar, the screen kept on, status-bar colours, Scroll mode on a long book) `python3 tests/navigate.py` (Find with marks and arrows, the slider and your notes marked above it, Go to page, pages left in the chapter, the Contents tabs) `python3 tests/highlights.py` (highlights on the exact words, across paragraphs and pages, after corrections; Continue on next page) `python3 tests/notes_lookup.py` (tapping note numbers for footnotes and endnotes; Wiktionary in Look up, with a stand-in for the API; glossary terms linked in the text) `python3 tests/quotes_language.py` (Edit → A block quote; a book's language for hyphenation) `python3 tests/pin.py` (the pinned passage: Pin, collapse, gestures, Go to it and back, notes, changed or removed sources) `python3 tests/followups.py` (follow-ups on notes and earlier wordings: the card, the sheet, search, tags, export, restore keeping both copies' ones) `python3 tests/classics.py` (the classics that come with the app: added once, deleted stays deleted, each opens with its chapters and notes; also after rebuilding them) and `python3 tests/printed_page.py` (keeping a book's PDF and showing its printed pages; the storage upgrade to version 7).
- After changes to the Wikisource import or the HTML importer, run `python3 tests/wikisource.py` (a stand-in for Wikisource's API).
- After changes to another edition's pages, a book paired with its original, or reading pace, run `python3 tests/editions.py`.
- After changes to a glossary term's In your books, `findNeedles`, `termNeedles` or `sectionIndex`, run `python3 tests/in_your_books.py`.
- After changes to a branch or tradition article, run `python3 tests/study_tools.py` (section sources and the article frame) and `python3 tests/links.py`.
- After changes to `branchLinks`, to thinkers' names or to `CLASSIC_NAMES`, run `python3 tests/links.py` (four-letter names in exact case, accents in either Unicode form,
  word-like names only in full, punctuation around names, and every link across the articles naming the entry it opens).
- After changes to colours or styles, run `python3 tests/contrast.py` (every screen and the main panels, light and dark, against WCAG AA).
- After changes to the study tools around the reference sections (Mentioned in, the truth table, term of the day, Hear it, the Anki export, a term's thinkers in time, two-step lineage, your notes through the book, the fallacies, reading paths, from your margins, essay templates, argument puzzles, guess the thinker, connect two thinkers, order of birth, bookplates, missing premise, steps in order, the reconstruction guide, quiz sets, disputations, questions to read with, primers), run `python3 tests/study_tools.py` (also after changes to the critique export).
- This session can't delete remote branches; the repo is set to delete merged PR branches automatically (if not, tell the owner).

## Save points

- A known-good version is kept as a branch `saved/working-YYYY-MM-DD`, pointing at a commit on `main` whose tests all passed. Nothing is ever
  pushed to these branches, and they are never merged. (This session can't create tags or GitHub releases; the owner can turn one into a
  release on GitHub if they like.) Make a new one when the owner asks, from a `main` commit whose CI run passed.
- To go back to one: bring its files back as one new commit on `main`, so the history in between stays (`git rm -rq . && git checkout
  saved/working-YYYY-MM-DD -- .`), run the full test list above, then push. Never force-push or reset `main`.
- Before restoring, check whether `indexedDB.open("marginalia", N)` has gone up since the save point. If it has, keep the newer N and its
  upgrade code (and the stores it added) in the restored version: the owner's phone has already upgraded its database, and older code asking
  for a lower version can't open it at all.

## Rules

- **Never commit books, PDFs or backup files.** The repository is public. The one exception is `data/books/`: the classics that come
  with the app, built by `tools/build_classics.py` from Standard Ebooks editions (or, for a work they lack, a public-domain
  transcription of a public-domain translation) and public domain in both the US and Canada
  (author and any translator died in 1971 or earlier). Nothing from the owner's library ever goes there.
- Changing the stored shape of a record: bump `indexedDB.open("marginalia", N)` only when a store is added or needs migration,
  keep old records readable, and update `VALID` so old backups still restore.
- Keep the app a single static site with no build step. Libraries load from cdnjs; fonts from Google Fonts (the service worker caches only those hosts).
- If `sw.js` changes in a way that needs old caches dropped, bump `CACHE`.
- Every file `index.html` loads must be in `SHELL` in `sw.js` (smoke.py checks), or the app can't open offline. A new file under `js/`, `css/`
  or `data/` needs both its tag in `index.html` and its line in `SHELL`, and a `CACHE` bump.

## Map of the code

`index.html` is only the page's skeleton: the reader's and sheets' fixed markup, then the stylesheet and the scripts. The styles are
`css/app.css`. The app is plain scripts in `js/`, loaded in this order and sharing one global scope, so a function or `const` in one is
visible to all the others once they've loaded. Code that runs while the page loads (outside a function) may only use what earlier files
and its own file define; everything else (event handlers, rendering) runs after `boot.js` and can use anything. Moving code between files
can break that order: keep new code in the file of its area, and check with a test.

| File | What's in it |
|---|---|
| `js/core.js` | the app's state (`S`, `R`), the libraries loaded from cdnjs (`LIBS`), small helpers (`$`, `esc`, `plain`, …) |
| `js/storage.js` | IndexedDB (`STORES`, `idbOpen`, `put`), Recently deleted, covers, toasts and `saveFile`, backup and restore (`VALID`, `planRestore`, `applyRestore`) |
| `js/cite.js` | citations, tags, the Markdown export of notes |
| `js/import.js` | parsing PDF (and highlights from a PDF), EPUB, Word, HTML, plain text and Markdown |
| `js/library.js` | the home screen and a book's page, with what's drawn on them (bookplates, from your margins, notes through the book, reading pace, where you left off), tags and open questions |
| `js/writing.js` | drafts, comparisons, the concordance, search across books, exports and Anki |
| `js/study.js` | the glossary and Quiz yourself, guess the thinker, puzzles, the reconstruction guide, quiz sets, truth tables |
| `js/reference.js` | Look up, thinkers and branches, reading paths, disputations |
| `js/sheets.js` | navigation and the back button, and the sheets (forms) |
| `js/wikisource.js` | the Wikisource search and import |
| `js/bookmenu.js` | a book's More menu (another edition's pages, the paired original), the book menu and arranging the shelf |
| `js/reader.js` | the reader: layout, swipe pages and the flip, your place and jumps, reading pace, highlights and notes in the text, the pinned passage |
| `js/structure.js` | Edit → marking a book's structure, and the reader's gestures and controls |
| `js/boot.js` | events for the whole app, the classics (`CLASSICS`) and starting up |

Each entry below names its functions; `grep -n` over `js/` finds them.

- Storage: `STORES`, `idbOpen`, `put`, `del`, `idbTx`. Backup export and restore follow. The `trash` and `trashlist` stores (version 8) are Recently deleted: every delete of a book, note, draft or comparison goes through `trashAndRemove`, filing the removed records as one entry in `trash` and its summary in `trashlist` (on a full device nothing is removed: `noRoom` asks, and only a confirmed Delete permanently runs `removeForGood`). Only `trashlist` is read at start (`loadTrash`, which also clears entries past `TRASH_DAYS`). `restoreTrash` puts back only records missing from the library (`putBackMissing`), never over one that came back another way. Neither store is backed up. The `files` store (version 7) holds
  original PDFs kept for the printed page, by text id; it is never loaded at start and never backed up (`keepPdf`, `pdfDoc`).
  A text's `pdfLabels` are its PDF pages' labels, used to find the PDF page for a printed page number.
- Highlights from a PDF (`readPdfMarks`, `marksOnPage`, `findMark`, `addMarks`; offered after a PDF import by `offerMarks`, and from a book's More →
  `marksSheet`): Highlight, Underline and Squiggly annotations become passage notes with the book's own words and an `anchor`, the comment as
  the gloss; `bookIndex` matches typographic variants, `findMark` prefers the mark's own page. `pdfOpen` starts PDF.js for both this and `parsePDF`.
- Wikisource (Add text → Or find a public-domain text on Wikisource; a reading path's `ws` search via `data-wsfind`): `wsSearch`, then `wsFile` fetches the
  work and its subpages (from `ws-summary`, else links under the title, in order; contents pages' own subpages in place, up to `WS_MAX`) through the
  MediaWiki API with `origin=*`, cleans each with `wsClean` (drops `ws-noexport`, page numbers to page breaks, references to notes) and hands one
  HTML file, with `marginalia:*` metas for translator, year and language, to the ordinary importer. Stored like any import, so it reads offline.
- Another edition's pages (`t.conc = { label, pairs: [[this page, other page]] }`, `CONC_MAX`; book's More → `concSheet`): `concPage` gives the other
  edition's page (exact at a pair, in proportion between and beyond, `back` for the reverse); `concLabel` in the reader's footer (`updatePg`),
  on note cards and in the Markdown export; Go to page takes "Minuit 34". Checked by `VALID.texts`.
- A book and its original (`t.pair`, the other book's id, kept on both by `setPair`, which unpairs an old partner; book's More → `pairSheet`): in the
  reader, `#rnav-pair` under the page number (`pairName`: "In the French") opens `pairPanel`, the matching passage by `pairSpot`: chapter by chapter
  when both have the same number of chapters (`chapterHeads`), else through `t.conc` pages, else in proportion (`textCum`), from the middle of
  your paragraph; Earlier and Later, then Open it there. A pair pointing at a missing book is simply ignored (`pairOf`).
- Reading pace (`t.days = { "YYYY-MM-DD": [seconds, words] }`, up to `DAYS_MAX` days): `savePos` counts time between turns or scrolls (`paceTick`,
  a pause over `PACE_GAP` counts as `PACE_GAP`, nothing while hidden) and words when your place moves on by up to `PACE_JUMP` (`paceRead`,
  `wordCum`); visits and jumps add none. `withPace` writes from `PACE`, this run's copy per book, so overlapping writes lose nothing; `savePos(true)`
  on leaving the reader or hiding the app writes the time even without a move. `days` is in `ACTIVITY`; a restore keeps the larger of each day's
  figures (`withDays`, inside `withReading`). The book's page shows it (`paceHTML`, `paceOf`): the last `PACE_SHOWN` days, words a minute and
  minutes a reading day over `PACE_RECENT` days, and the time to the end before the back matter.
- Citations: `CITE_STYLES`, `citeAt`, `bibEntry`, `bibtex`.
- Import/parsing: `linesOf` and `unmerge` (PDF lines; scans' merged words), `parsePDF` (per-page body size, page numbers, headings, lost hyphens; `GAP` marks words OCR left blank as "[…]"), `ocrRepair` (scans only, gated by `ocrSigns`: split and misread words corrected against the book's own vocabulary, dashes, note numbers, split numbers, "[illegible]"), `domToBlocks` / `parseHTML` (EPUB, DOCX), `parsePlain`.
- Views: `render` dispatches to `libraryView`, `textView`, `tagView`, `questionsView`, `draftsView`/`draftView`, `comparesView`/`compareView`, `concordView`, glossary, branches and `thinkersView`. The home screen reaches them through three buttons (`referenceHome`) that open
  `referenceView`: every term, branch or thinker as one list (`S.rk` picks the group, `S.rq` searches), each row opening its entry
  and each group linking to its full screen.
- Data: reference content lives in `data/`, loaded by plain `<script>` tags before the app script: `data/glossary.js` (`GLOSSARY`),
  `data/thinkers.js` (`THINKERS`), `data/branches.js` (`BRANCHES`). Edit entries there, not in `js/`. `LINKS`, `THINKER` and `BRANCH`
  are built from them in `js/`. A new data file needs its `<script>` tag in index.html and its path in `SHELL` in `sw.js`.
  An entry's optional `img` (`figHTML`) is a public-domain Wikimedia Commons file, loaded from Commons when online and not cached
  by the service worker; a picture that fails to load removes its figure, so offline the entry simply shows without it.
  A glossary term's optional `fig` names one of `FIGURES` (end of `data/glossary.js`): a diagram drawn as SVG, shown by `diaHTML` in the
  app's colours and offline. Give each marker id a per-figure suffix, since closed entries hide the SVG that defines it.
- A branch article's sources by section: `xs` on the entry, `{ "<heading>": [{ src, srcName }] }`, drawn by `sectionSources` as one line under
  that section (SEP and IEP shortened in the line, full name on hover). A heading key must match a heading in `x` (tested by `tests/study_tools.py`).
- Citation design (owner's decision, 2026-10-21): sources sit under each section, never between sentences; compact SEP/IEP labels with the
  full name behind the link; subdued but WCAG AA, 24px tap targets; a source may recur across sections it supports, never twice in one.
  Sections get sources only as part of an article's audit, aiming at full traceability: every verified claim's deciding source listed
  under its own section (unverified claims reported apart).
- Citations into a classic (`xr` on a branch entry names one style in `PASSAGE_STYLES`, or a list): each style has the classic's `book`, an
  `item` pattern for one reference and a `find(B, groups)` for its block. Now "spinoza-ethics" ("(I, Proposition 17, Corollary 2)", "(I, Appendix)", "(III, Preface)", found by the
  book's own labels in `spinozaBlock`), "nietzsche-genealogy" ("(GM II §12)"), "nietzsche-beyond" ("(BGE §260)"), "aristotle-ethics" ("(NE I.7)"), "rousseau-social-contract"
  ("(SC I.6)"), "hobbes-leviathan" ("(Lev. XIII)"), "hume-treatise" ("(T 1.4.6)"), "hume-enquiry" ("(EHU IV.2)"), "descartes-meditations" ("(Med. VI)", "(Disc. IV)"),
  "plato-republic" ("(Rep. V)"), "plato-socrates" ("(Apology)"), "kant-groundwork" ("(G II)"), "marx-engels-manifesto" ("(CM I)"), "du-bois-souls"
  ("(Souls I)") and "mill-liberty" ("(OL I)"), all but Spinoza's found by headings (`headPath`). `passageLinks` turns a bracket into links
  when every "; "-joined item matches one style; anything else stays text. `openPassage` opens the classic there, adding it back if deleted.
  A reference added to an audited article is checked against the bundled edition and logged in its audit record. Tested by `tests/links.py`.
- The classics named in the reference pages (`CLASSIC_NAMES`, `classicHits`, in reference.js): a bundled classic's title in an article
  (through `branchLinks`), a thinker card (`classicParas`, key works) or a glossary entry (its note and source line) links to the book
  (`data-classic`, `openClassic`, which adds a deleted classic back first). Full titles match anywhere in their own capitals; short ones
  (`own`: "the Ethics", "Meditations", "Groundwork") only on the author's card; `pre`/`post`/`notPost` guard look-alikes such as the Dutch
  Republic. A classic's page lists where it is named or cited (`classicMentions`, `classicMentionsHTML`, drawn by `mentionsHTML`). Tested by
  `tests/links.py`. A new classic needs its entry in `CLASSIC_NAMES`.
- A glossary entry's source line (`sourceLinks`, `SRC_LOCS`): each bundled classic's title links to its page, and each locator after it
  ("Ethics I, Def. 3", "III, Props. 6–9, 11 Schol.", "Leviathan (1651), ch. 13", "Treatise … I.iv.6", "§§13, 36") to that passage in the
  classic's citation style; a short title counts after its author's name ("Spinoza, Ethics"); a range links its first number; a locator the
  bundled edition can't be found by stays text. Tested by `tests/links.py`.
- Audits of the articles: `tests/audit/<id>.json`, one record per sentence with each claim's verdict and source (see `tests/audit/README.md`).
  An audit's fixes ship only after an independent second review.
- Audits in place (owner's decision, 2026-10-23): an audit corrects the article as it stands: it fixes what the sources contradict,
  cuts what no source supports (and empty or contrastive hedges), merges duplicate sections and adds section sources (`xs`). The
  record keeps a verdict on every old sentence (`sentences`) and the shipped text sentence by sentence (`new_text`). Fixes ship once
  the independent review passes, without waiting for the owner. Work in batches of about three articles, taking them from
  `tests/audit/QUEUE.md`. An article is rebuilt on the frame below only when a reading of the owner's needs it.
- Article frame (owner's decision, 2026-10-22; applies to rebuilt articles only): a rebuilt article opens with "Scope and central questions", then two to
  five history sections and three to seven sections on its central problems or doctrines (titled for the subject), then "Beyond the
  European canon" ("Encounters and comparisons" for the Indian, Chinese, Islamic and African articles), "Criticisms and debates",
  "Connections and influence" and "Open questions"; 5,000–8,000 words, academic sources only, every contested reading credited. A rebuilt
  article is exactly the sentences of its audit record (standard "frame-2026-10"), each claim with its source, and its `xs` are the
  sources those sentences cite. `article_frame` in `tests/study_tools.py` checks all of this, and the banned contrastive constructions, for
  every article on the frame. Entries in `BRANCHES` are separated by a blank line so that PRs rebuilding different articles merge cleanly;
  keep it that way.
- A branch written as an article: when any paragraph of its `x` starts with a heading line (heading, newline, text), `branchesView` draws
  each such paragraph as a section, and `branchLinks` links the first mention of each thinker, glossary term and classic (its candidates built
  once per array of terms and thinkers, `linkSet`). Glossary entries and thinker cards link the same way, never to themselves (`refParas`;
  an entry's text when it opens, `fillLinks`) (accents ignored; names under five
  letters in exact case; `LINK_FULL_ONLY` names, such as Said and Land, only in full; a name two entries share never links).
- Quiz yourself (`quizPanel`, from the glossary and the home screen's glossary section): questions made from `allTerms()` definitions
  (the term blanked out by `maskTerm`) and `THINKERS` key works (`worksOf` leaves out works by other authors); nothing is stored.
  Argument puzzles (from the Logic branch, `argModes`): Name the fallacy uses each fallacy's `ex` examples, never offering a `FAL_NEAR` pair
  together; Valid or not? (`validQuestion`) makes random arguments, checked by `ttCheck`, about half valid.
  Missing premise (`missingQuestion`): a valid argument less one premise; wrong options each have a counterexample. Put the steps in order
  (`stepsPanel`, `ST`): a shuffled modus ponens chain, checked exactly, with the proof written out.
  How to reconstruct an argument (`reconPanel`, from the Logic branch; `RECON_STEPS` also fold out under an Argument note's premises): steps, a worked
  example (`RECON_EXAMPLE`) and sources.
- Quiz sets to share (`setMaker`, from Quiz yourself; `setLink`, `readSet`): chosen terms travel in a `#set=` link as base64url JSON (built-in ids,
  and your own or edited terms in full, within `SET_LIMITS`); `openFromHash` at start and on `hashchange` opens the quiz with `QZ.set`, or a
  `#path=` link's reading path, then cleans the address. Nothing stored.
- Term of the day (`termOfDay`, `todHTML`, above the home screen's three buttons): one of `GLOSSARY` a day by `dayNumber`, in an order shuffled once per
  round so every entry comes up before any repeats; your edit of it if you made one. Nothing is stored.
- Hear it (`sayBtn`, `sayIt`, `CAN_SAY`): on a glossary term and a thinker's card, the phone's own voice (Web Speech API, English) says the name;
  no button where the device has no voice.
- Flashcards for Anki (Export → `ankiRows`, `ankiFile`): tab-separated text with Anki's import headers (2.1.54+), HTML fields made safe by
  `ankiCell`; "mine" is your notes, the terms you added or edited and your looked-up words, "glossary" every entry.
- Connections between thinkers (`CONNECTIONS` at the end of `data/thinkers.js`; `connectionsHTML` on both thinkers' cards, `CONN_KINDS`,
  `connectionsOf`): each has a kind (influence, critique, reinterpretation), a one-sentence claim, `text` (what the primary texts show: a
  reference into a bundled classic, opened like an article's, or where the words were checked) kept apart from `reading` (what named
  scholarship argues, with its source). Every connection has a reading and a passed independent review in `tests/audit/connections.json`;
  a "drew on" entry in `THINKERS` may rest on one. Tested by `tests/study_tools.py` (`connections`).
- A term's thinkers in time (`termTimeHTML`, in each glossary entry): the term's `p` on one scale, in order of birth. A thinker's card goes
  two steps along "drew on" (`lineageSteps`: Further back, Further on), long rows folded by `foldChips`.
- Your notes through the book (`spreadHTML`, on a book's page under Where you left off): notes by `at` in `SPREAD_BINS` stretches of `t.total`,
  chapter lines once the text is loaded, a dot at `t.pos`; a bar goes to its first note. Nothing stored.
- Fallacies: glossary entries with `fal` ("formal" or "informal"), listed in the Logic branch by `fallacyCatalogHTML`. A formal one's entry opens
  the truth table on its example (`TT_TERMS` maps an entry to one of `TT_EXAMPLES`), and `ttExampleOf` offers the entry back from the table.
- Reading paths (`PATHS` at the end of `data/branches.js`; `pathsView`, the `paths` screen, from the home screen and a branch's entry via `pathsFor`):
  steps through the classics by book id and section ids. `readStep` opens the reader at the step's first chapter (`stepRange`), or at your place
  when you're inside it; a step is done when its sections are ticked. A deleted classic comes back with `readdClassic`, which uses `putClassic`
  (also what `addClassics` uses). `CLASSIC_TITLES` names books not in the library; the tests check it against `data/books/`.
  Each step's `q` are questions to read it with (`readQsHTML`): folded on the path, and in Where you left off while your place is inside the
  step's chapters (`stepAt`); `askQuestion` turns one into an ordinary Question note on the book, once.
- Close readings (a `PATHS` entry with `kind: "close"`, a `book`, its citation `style` and `parts` of stations; `closePathHTML` on the paths
  screen, `bookPaths()` for the other paths): each station's `refs` open the book at its passages through `passageLinks` (so your place is kept
  as ← Your place), `says` gives the text's own words, `deleuze` what named scholarship says of Deleuze's reading (sources in `PATH_SRC`), with
  `terms`, questions (`askCloseQuestion`) and the path's typed `conns`. A station is read once a note of yours falls in one of its passages'
  blocks (`passageSpan`: a proposition with its proof, corollaries and notes; questions added from the path don't count; `closeState`).
  Nothing stored. Now "spinoza-deleuze", Parts I and III; every quotation is checked against the bundled text and each station's
  independent review is in `tests/audit/spinoza-deleuze.json`. Tested by `tests/study_tools.py` (`close_reading`).
- Bookplates (`platesView`, the `plates` screen, from the home screen's Across your library; a book's own on its page): `bookplates()` works them
  out each time from notes, follow-ups, summaries, ticked chapters, shelves, drafts, comparisons and `PATHS` (`FIRSTS`, `bookPlates`; `BACK_MATTER`
  sections don't count as chapters; example books never count). Nothing stored, nothing expires.
- Primers (`PRIMERS` at the end of `data/branches.js`, keyed by classic id; `primerHTML` on the book's page): what the book is, how it's built,
  words to know and its reading paths, with sources; open until you start reading or take a note. Every id in `CLASSICS` needs one (tested).
- Disputations (`DISPUTES` at the end of `data/branches.js`; `disputesView`, the `disputes` screen, from the home screen; `disputePanel`): an argument
  from a classic (book, section, `find` words to open the reader at), your objection (kept in `DSP` while the app is open), then the classic one,
  paraphrased from its sources. Save makes an ordinary Objection note on the book, tagged #disputation (`disputeNotes` finds them).
- From your margins (`resurfHTML`, `resurfaced`, on the home screen after the bookshelf): one note made `RESURF_DAYS` or more ago, picked by
  `dayNumber`; Another (`resurfSkip`) redraws only the card. Nothing stored.
- A draft for critique (a draft's Export → `exportMenu`: the essay as before, or For critique, saved or copied, `exportCritique`): `critiqueMarkdown`
  writes the draft (guide lines left out) with each quoted passage marked [E1]…, then the evidence: each passage checked against its book's
  text when it is here (`placeNote`: verbatim at its saved place, found elsewhere, not found, or not checked), the page and chapter at that
  place (`sectionIndex`) with the note's own page where it disagrees, the paragraph around it, the gloss and follow-ups; then the glossary terms
  found in the writer's own words only (`termNeedles`, `findNeedles`), with a warning that a definition is no evidence of a passage's sense;
  then works cited. Nothing stored. Tested by `tests/study_tools.py`.
- Essay templates (`ESSAY_TEMPLATES`, in New draft, `draftTitleSheet`): headings, each followed by a paragraph starting with `GUIDE`, drawn
  muted (`.dguide`); ordinary draft items, so backups need nothing new.
- Puzzles (Thinkers → Puzzles, `puzzlesMenu`): Guess the thinker, Connect two thinkers and Order of birth. Connect (`connectPanel`, state in `CN`):
  `tookMap` reads the "drew on" lists the other way, `lineFrom` finds distances and a shortest route; a target is `CN.k` steps on, with
  `CN_SLACK` steps to spare. Order of birth (`orderPanel`, `OB`): five exact births `ORDER_GAP` years apart, the answer drawn by `termTimeHTML`.
  Nothing stored.
- Guess the thinker (`guessPanel`, from Thinkers → Puzzles): `guessOfDay` picks from `guessPool` by `dayNumber`, every one once a round;
  `guessClues` builds up to `GUESS_MAX` clues from the entries with the name blanked out. Today's game is in `localStorage` as `mg-guess` (not in
  backups); `guessResult` is the text to share. No streaks or scores are kept.
- Truth table (`truthPanel`, from the Logic branch and the glossary's `TT_TERMS`): `ttLex`/`ttParse` read premises and a conclusion
  (¬ ∧ ∨ → ↔, ASCII or words; → groups right), `ttCheck` builds every row (up to `TT_MAX` letters) and finds counterexamples, `ttShow` writes a
  formula back with only the brackets it needs. Nothing is stored. Tested by `tests/study_tools.py`.
- Thinkers' timeline (Thinkers → Timeline, `S.tl`; a period on the home screen opens it there): `lifeSpan` reads a thinker's dates line (BCE, centuries, "b. 1929"),
  `timelineHTML` draws each period in `TL_ERAS` on its own scale; `contemporariesOf` (lives overlapping 20+ years) is on the thinker card.
- A chapter's end (`chapterEndCheck`, from `updatePg`): reading on from within about a page of a chapter's end into the next asks
  for a summary (`summarySheet`, saved in `t.summaries`), once a visit and only without one; `RS.sum` "off" stops it.
- Your words (`lookedUp`, `wordsPanel`; glossary): the `mg-dict` cache of Look up, one usable sense each; quiz mode "words".
- A book's menu (`bookMenu`, `moveBook`): holding a book on the shelf for half a second (`HOLD`, pointer events), right-clicking it or
  the keyboard's menu key opens Start/Continue reading, the book's page, Edit, Move to another shelf (its status, with Undo) and Delete
  (`confirmDelete(id)`, which stays on the shelf). The release after a hold is swallowed so it doesn't also open the book.
- Arranging the shelf (`startDrag`, `dragTo`, `dropBook`, `shelfList`): after the hold lifts a book, moving the finger puts the menu away
  and carries it (a mouse drags at once); `dragTo` marks the place beside the nearest book of the shelf under the finger, `edgeScroll`
  scrolls near the screen's edges. Setting it down saves the shelf's order as each book's `rank` (another shelf also changes its status),
  with Undo. `shelfList`: unranked books (new, or moved onto the shelf by status) first, newest first, then ranked ones in order; a shelf
  never arranged is in order of use. `rank` is in `ACTIVITY`, so a restore compares records without it and keeps this device's order.
- Classics (`CLASSICS`, `addClassics`, at start): public-domain books that come with the app, each added to the library once, queued,
  from `data/books/<id>.json` (`{ text, content }`, the shapes a backup holds) and its cover `<id>.jpg`. `mg-classics` lists those added,
  so a deleted classic stays deleted; one that can't be fetched is tried next time. Skipped in automated browsers unless a test passes
  `true`. `tools/build_classics.py` builds them from Standard Ebooks sources (Kant and Spinoza's Ethics from plain-text transcriptions, through their converters) with
  the app's own parser; add a new id to `CLASSICS`.
- Mentioned in (`mentionsOf`, `mentionsHTML`, in study.js): the article sections, thinker cards and glossary entries whose text uses a term's
  name (`termNeedles`: its name, the name in its brackets, a pair's halves listed in `k`) or a thinker's (`thinkerNeedles`: as `branchLinks`
  links them), each once with the sentence of its first mention marked (`mentionSnip`). A glossary entry fills it when it opens (`fillMentions`,
  from the toggle event); a thinker's card shows it with your notes that name them (`thinkerNotes`). An article row opens the article at its
  section (`go({ screen: "branches", focus, sec })`, sections carry `data-bsec`). `mentionSources` folds the built-in texts once. Nothing stored.
- A glossary term's "In your books" (`inBooksStart`, Search your books → `runInBooks`, `bookOccurrences`, `inBooksHTML`): searched only when asked,
  every book with its text read as Find reads it (`textRuns`, which `findRuns` also uses: a paragraph and its continuations past page breaks
  are one run), by `termNeedles` through `findNeedles` (whole words, accents ignored, plurals); every occurrence counts. Your links to the
  term (`t.termMarks`, placed by `placeNote`) are listed as Your link, and a name inside one counts as the link. Each book's count, its first
  `INBOOK_SHOWN` hits and `INBOOK_LISTED` more folded, in reading order, each with page and chapter from `sectionIndex` and its sentence; a hit
  (`data-inbook`) opens the reader there with the word in Find and ← Your place. Closing the entry or starting again stops a search
  (`INBOOK_RUN`); books that can't be read are counted apart. Texts are read from IndexedDB without being kept in `S.content`. Nothing
  stored. Tested by `tests/in_your_books.py`.
- A glossary term's "In your notes" (`termHitsHTML`, from `termNotes`): your notes using the term, grouped by author and then book, each book in
  reading order with your glosses, four shown and the rest folded. Only your own notes; nothing is written about the term for you.
- Where you left off (`briefHTML`, `placeIn`, on a book's page under Continue reading): page and chapter at `t.pos`, your summary of that
  chapter or the last one summarized, the book's open questions and latest notes. Nothing stored; it loads the book's text once for the chapter.
- The pinned passage (`PIN`, `drawPin`, `pinGo`): one passage or note kept at the foot of the reader, from Pin on a selection or a note's
  sheet. Stored in `localStorage` as `mg-pin`, outside the library; backups carry it as `pin` (`goodPin` checks it on restore); the pages are cut above it (`PINH` in `layoutPages`),
  and the reader's bottom buttons and toasts sit above it (`--pin-h`).
- Your notes on the slider (`drawNavNotes`, `navNoteGroups`, `navNotesOpen`): a mark per note above it, notes within `NAVNOTE_PX` sharing
  a numbered mark that lists them; going to one uses `jumpTo`, so the trail offers ← Your place.
- The icons (`icon-*.png`, `apple-touch-icon.png`) are drawn by `tools/build_icons.py`: a leaf carved in outline into oak. The home screen's
  mark (`LEAF_SVG`) is the same leaf path; change both together.
- Glossary terms in the text (Reading settings → Glossary terms in this book, or a book's More menu; `termsOn`, `setTermsOn`, the books
  listed in `localStorage` as `mg-terms`, not backed up): `termHits` finds each paragraph run's first mention of each term name of more
  than one word, and a one-word name's first in each chapter (`readerTermNames`, from `termNeedles`; shared names and `READER_SKIP` words never link) over `findRuns`, `paintTerms` underlines them with the
  CSS Highlight API (`::highlight(term)`, after each render), so the text's markup never changes; a tap is matched by `termAt` before
  tap-to-turn and opens `termPanel`, whose Open in the glossary leaves the reader with Back returning to your place.
- Terms you link yourself (Look up → Link to a glossary term, `linkTermPanel`, `addTermMark`; Unlink in `termPanel`, `removeTermMark`): kept on the
  book as `t.termMarks = [{ id, at, passage, anchor, createdAt }]`, placed like a note's passage (`placeNote`, in `markHits`) and underlined
  whether or not the book links terms by itself. Checked by `VALID.texts`; a restore keeps both copies' links (`withTermMarks`, in `withReading`).
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
- A note's follow-ups (`followups: [{id, at, x}]`, Follow up on the card or the note's sheet) are dated thoughts added later; changing
  your note's words keeps the old ones in `was: [{at, gloss, premises, conclusion}]` unless they were written within `REWORD_GRACE`
  (`wordAt` dates the current words). `laterHTML` draws both; follow-ups count for search, tags and export, earlier wordings for search
  only. Restore never drops either: `withThoughts` adds the other copy's to whichever copy wins.
