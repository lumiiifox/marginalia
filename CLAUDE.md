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
- After changes to storage or deleting, also run `python3 tests/trash.py` (Recently deleted, and the upgrade to version 8).
- After changes to PDF import or to highlights from a PDF, also run `python3 tests/pdf_highlights.py` (needs `pip install pypdf`; it marks up a
  generated book and imports it).
- After any change to PDF import, also run `python3 tests/pdf_import.py` (generated books: headings, page order, broken words, a scan-like book). `python3 tests/pdf_import.py some.pdf` shows what the parser makes of a real book, for checking a bad import; real books stay out of the repo.
- After any change to the reader, also run `python3 tests/paged_reader.py` (Swipe pages: gestures, alignment, flips, joined paragraphs, chapters) `python3 tests/structure.py` (marking chapters, headings, running heads and title pages with Edit) `python3 tests/comfort.py` (tap to turn, the hidden toolbar, the screen kept on, status-bar colours, Scroll mode on a long book) `python3 tests/navigate.py` (Find with marks and arrows, the slider and your notes marked above it, Go to page, pages left in the chapter, the Contents tabs) `python3 tests/highlights.py` (highlights on the exact words, across paragraphs and pages, after corrections; Continue on next page) `python3 tests/notes_lookup.py` (tapping note numbers for footnotes and endnotes; Wiktionary in Look up, with a stand-in for the API) `python3 tests/quotes_language.py` (Edit → A block quote; a book's language for hyphenation) `python3 tests/pin.py` (the pinned passage: Pin, collapse, gestures, Go to it and back, notes, changed or removed sources) `python3 tests/followups.py` (follow-ups on notes and earlier wordings: the card, the sheet, search, tags, export, restore keeping both copies' ones) `python3 tests/classics.py` (the classics that come with the app: added once, deleted stays deleted, each opens with its chapters and notes; also after rebuilding them) and `python3 tests/printed_page.py` (keeping a book's PDF and showing its printed pages; the storage upgrade to version 7).
- After changes to colours or styles, run `python3 tests/contrast.py` (every screen and the main panels, light and dark, against WCAG AA).
- After changes to the study tools around the reference sections (the truth table, term of the day, Hear it, the Anki export, a term's thinkers in time, two-step lineage, your notes through the book, the fallacies, reading paths, from your margins, essay templates, argument puzzles, guess the thinker, connect two thinkers, order of birth, bookplates, missing premise, steps in order, the reconstruction guide, quiz sets, disputations, questions to read with, primers), run `python3 tests/study_tools.py`.
- This session can't delete remote branches; the repo is set to delete merged PR branches automatically (if not, tell the owner).

## Rules

- **Never commit books, PDFs or backup files.** The repository is public. The one exception is `data/books/`: the classics that come
  with the app, built by `tools/build_classics.py` from Standard Ebooks editions (or, for a work they lack, a public-domain
  transcription of a public-domain translation) and public domain in both the US and Canada
  (author and any translator died in 1971 or earlier). Nothing from the owner's library ever goes there.
- Changing the stored shape of a record: bump `indexedDB.open("marginalia", N)` only when a store is added or needs migration,
  keep old records readable, and update `VALID` so old backups still restore.
- Keep the app a single static site with no build step. Libraries load from cdnjs; fonts from Google Fonts (the service worker caches only those hosts).
- If `sw.js` changes in a way that needs old caches dropped, bump `CACHE`.

## Map of index.html

- `<style>` near the top; one `<script>` holds the whole app, after the data scripts.
- Storage: `STORES`, `idbOpen`, `put`, `del`, `idbTx`. Backup export and restore follow. The `trash` and `trashlist` stores (version 8) are Recently deleted: every delete of a book, note, draft or comparison goes through `trashAndRemove`, filing the removed records as one entry in `trash` and its summary in `trashlist` (on a full device nothing is removed: `noRoom` asks, and only a confirmed Delete permanently runs `removeForGood`). Only `trashlist` is read at start (`loadTrash`, which also clears entries past `TRASH_DAYS`). `restoreTrash` puts back only records missing from the library (`putBackMissing`), never over one that came back another way. Neither store is backed up. The `files` store (version 7) holds
  original PDFs kept for the printed page, by text id; it is never loaded at start and never backed up (`keepPdf`, `pdfDoc`).
  A text's `pdfLabels` are its PDF pages' labels, used to find the PDF page for a printed page number.
- Highlights from a PDF (`readPdfMarks`, `marksOnPage`, `findMark`, `addMarks`; offered after a PDF import by `offerMarks`, and from a book's More →
  `marksSheet`): Highlight, Underline and Squiggly annotations become passage notes with the book's own words and an `anchor`, the comment as
  the gloss; `bookIndex` matches typographic variants, `findMark` prefers the mark's own page. `pdfOpen` starts PDF.js for both this and `parsePDF`.
- Citations: `CITE_STYLES`, `citeAt`, `bibEntry`, `bibtex`.
- Import/parsing: `linesOf` and `unmerge` (PDF lines; scans' merged words), `parsePDF` (per-page body size, page numbers, headings, lost hyphens; `GAP` marks words OCR left blank as "[…]"), `ocrRepair` (scans only, gated by `ocrSigns`: split and misread words corrected against the book's own vocabulary, dashes, note numbers, split numbers, "[illegible]"), `domToBlocks` / `parseHTML` (EPUB, DOCX), `parsePlain`.
- Views: `render` dispatches to `libraryView`, `textView`, `tagView`, `questionsView`, `draftsView`/`draftView`, `comparesView`/`compareView`, `concordView`, glossary, branches and `thinkersView`. The home screen reaches them through three buttons (`referenceHome`) that open
  `referenceView`: every term, branch or thinker as one list (`S.rk` picks the group, `S.rq` searches), each row opening its entry
  and each group linking to its full screen.
- Data: reference content lives in `data/`, loaded by plain `<script>` tags before the app script: `data/glossary.js` (`GLOSSARY`),
  `data/thinkers.js` (`THINKERS`), `data/branches.js` (`BRANCHES`). Edit entries there, not in index.html. `LINKS`, `THINKER` and `BRANCH`
  are built from them in index.html. A new data file needs its `<script>` tag in index.html and its path in `SHELL` in `sw.js`.
  An entry's optional `img` (`figHTML`) is a public-domain Wikimedia Commons file, loaded from Commons when online and not cached
  by the service worker; a picture that fails to load removes its figure, so offline the entry simply shows without it.
  A glossary term's optional `fig` names one of `FIGURES` (end of `data/glossary.js`): a diagram drawn as SVG, shown by `diaHTML` in the
  app's colours and offline. Give each marker id a per-figure suffix, since closed entries hide the SVG that defines it.
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
  `true`. `tools/build_classics.py` builds them from Standard Ebooks sources (Kant from a plain-text transcription, through its converter) with
  the app's own parser; add a new id to `CLASSICS`.
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
