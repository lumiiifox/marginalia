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
- This session can't delete remote branches; the repo is set to delete merged PR branches automatically (if not, tell the owner).

## Rules

- **Never commit books, PDFs or backup files.** The repository is public.
- Changing the stored shape of a record: bump `indexedDB.open("marginalia", N)` only when a store is added or needs migration,
  keep old records readable, and update `VALID` so old backups still restore.
- Keep the app a single static site with no build step. Libraries load from cdnjs; fonts from Google Fonts (the service worker caches only those hosts).
- If `sw.js` changes in a way that needs old caches dropped, bump `CACHE`.

## Map of index.html

- `<style>` near the top; one `<script>` holds the whole app.
- Storage: `STORES`, `idbOpen`, `put`, `delMany`, `idbTx`. Backup export and restore follow.
- Citations: `CITE_STYLES`, `citeAt`, `bibEntry`, `bibtex`.
- Import/parsing: `linesOf` and `unmerge` (PDF lines; scans' merged words), `parsePDF` (per-page body size, page numbers, headings, lost hyphens; `GAP` marks words OCR left blank as "[…]"), `ocrRepair` (scans only, gated by `ocrSigns`: split and misread words corrected against the book's own vocabulary, dashes, note numbers, split numbers, "[illegible]"), `domToBlocks` / `parseHTML` (EPUB, DOCX), `parsePlain`.
- Views: `render` dispatches to `libraryView`, `textView`, `tagView`, `questionsView`, `draftsView`/`draftView`, `comparesView`/`compareView`, `concordView`, glossary and branches.
- Data: `GLOSSARY` (large), `BRANCHES`, `LINKS`.
- Reader settings live in `localStorage` under `mg-reader`; other small preferences use `mg-*` keys.
