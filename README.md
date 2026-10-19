# Marginalia

A personal reading log and reader. Load a PDF, EPUB, Word (.docx), plain text or Markdown file, read it in the app's own typography, and save selected passages as notes with their page numbers.

## Where things are stored

Everything (book text, notes, reading positions) is stored in the browser's own storage on the device you use it on. Nothing is uploaded, and nothing from your library is ever committed to this repository. **Never commit books or PDFs here: the repository is public.** The one exception is `data/books/`: a few public-domain classics that come with the app and are added to the library the first time it opens with them.

Use **Save backup** on the library screen now and then. The backup file is also how you move your library to another device (**Restore from backup**).

On iPhone, add the app to the Home Screen (Share → Add to Home Screen). Safari deletes a website's storage after 7 days without a visit; Home Screen apps are exempt.

## Files

- `index.html`: the page itself, which loads the rest
- `css/app.css`: the styles
- `js/`: the app, in fourteen plain scripts by area (storage, importing, the reader, study tools and so on), listed in `CLAUDE.md`
- `sw.js`: service worker for offline use
- `data/`: the glossary, thinkers and branches; `data/books/`: the classics that come with the app (Standard Ebooks editions, public domain), built by `tools/build_classics.py`
- `manifest.webmanifest`, `icon-*.png`, `apple-touch-icon.png`: Home Screen install

Libraries (PDF.js, JSZip, Mammoth) and fonts load from cdnjs and Google Fonts the first time they're needed, and are cached after that.
