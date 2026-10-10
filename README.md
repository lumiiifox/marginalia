# Marginalia

A personal reading log and reader. Load a PDF, EPUB, Word (.docx), plain text or Markdown file, read it in the app's own typography, and save selected passages as notes with their page numbers.

## Where things are stored

Everything (book text, notes, reading positions) is stored in the browser's own storage on the device you use it on. Nothing is uploaded, and nothing from your library is ever committed to this repository. **Never commit books or PDFs here: the repository is public.**

Use **Save backup** on the library screen now and then. The backup file is also how you move your library to another device (**Restore from backup**).

On iPhone, add the app to the Home Screen (Share → Add to Home Screen). Safari deletes a website's storage after 7 days without a visit; Home Screen apps are exempt.

## Files

- `index.html`: the whole app
- `sw.js`: service worker for offline use
- `manifest.webmanifest`, `icon-*.png`, `apple-touch-icon.png`: Home Screen install

Libraries (PDF.js, JSZip, Mammoth) and fonts load from cdnjs and Google Fonts the first time they're needed, and are cached after that.
