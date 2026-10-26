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

