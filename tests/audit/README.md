# Audits of the reference articles

One JSON file per audited branch or tradition article (`data/branches.js`). Each sentence of the audited text has a record, and each
claim in it an assessment:

- `type`: historical, conceptual, interpretive, editorial or question.
- `evidence`: does the article's cited source support the claim? yes, partly, no or not-retrieved.
- `accuracy`: supported, overstated, contested (a disputed reading stated as settled), wrong, unverified, editorial (an aside
  with nothing to check) or non-assertive (a question). Non-assertive claims stay out of the counts.
- `by` and `excerpt`: the source that settles it, its section, and a few words from it (under 15, since the repository is public).
- `fix`: what the correction does.

Every audit gets an independent second review before its fixes ship; `by` at the top says who did each pass.
Print sources (the Concise Routledge Encyclopedia of Philosophy, 2000) are cited by entry and author; the book itself is never committed. Sentences an audit adds carry `origin: "added"`.
