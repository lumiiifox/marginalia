# Audits of the reference articles

One JSON file per audited branch or tradition article (`data/branches.js`), and a few for groups of other entries:
`glossary-dg.json` (the glossary entries on Deleuze and Guattari's concepts, and Structuralism: `old` sentence verdicts, `new_text`
with each sentence's sources) and `thinkers-route.json` (the thinker cards on the reading route: what was checked, fixed, or not
re-read). Each sentence of the audited text has a record, and each
claim in it an assessment:

- `type`: historical, conceptual, interpretive, editorial or question.
- `evidence`: does the article's cited source support the claim? yes, partly, no or not-retrieved.
- `accuracy`: supported, overstated, contested (a disputed reading stated as settled), wrong, unverified, editorial (an aside
  with nothing to check) or non-assertive (a question). Non-assertive claims stay out of the counts.
- `by` and `excerpt`: the source that settles it, its section, and a few words from it (under 15, since the repository is public).
- `fix`: what the correction does.

Every audit gets an independent second review before its fixes ship; `by` at the top says who did each pass.

## Rebuilt articles (standard `frame-2026-10`)

An article rebuilt on the shared frame (see CLAUDE.md) is written and audited at once, and its record *is* the article: the text in
`data/branches.js` is exactly these sentences, and the section sources (`xs`) are the sources they cite. `tests/study_tools.py`
(`article_frame`) checks both.

- `sources`: a table of every source consulted, `S1`, `S2`, …, each with `name` (in the forms the articles use; a Stanford
  Encyclopedia entry names all its current authors), `src` where there is a link, `consulted` (how it was read) and `general` for
  the reference entries on the subject as a whole.
- `paragraphs`: in order; a paragraph with a `heading` opens a section, `heading: null` continues it. Each sentence has its `text`,
  its `claims` (`type`, `by`: source ids with a locator such as `S3 §2.1`, `excerpt`, `first_pass` by the drafter, `review` by the
  independent reviewer, `note`, `fix`) and its `quotes` (every quotation, with its source and how it was confirmed verbatim; titles
  of essays are marked `kind: "title"`). Only `supported` and `editorial` claims ship.
- `old_text`: the problems found in the article it replaces. `review`: the independent specialist review, its verdict and what it
  changed.
Print sources (the Concise Routledge Encyclopedia of Philosophy, 2000) are cited by entry and author; the book itself is never committed. Sentences an audit adds carry `origin: "added"`.
