# Aesthetics: editorial research brief

Status: preliminary research notes, **not a completed article or independent review**. Target: `data/branches.js` entry `id: "aesthetics"`.

## Article framework

Develop the current entry into a 5,000–8,000-word article under the repository's `frame-2026-10` rules: start with “Scope and central questions,” include 2–5 history sections, 3–7 substantive problem sections, “Beyond the European canon,” “Criticisms and debates,” “Connections and influence,” and “Open questions.” Preserve existing valuable claims and linkable thinkers and concepts.

## Research priorities

- Beauty, taste and judgment
- Theories of art
- Aesthetic experience
- Art and political economy
- Interpretation and criticism

## Accuracy safeguards

Separate aesthetic experience, judgments of taste, artistic value, and the definition of art. Do not treat Kant's disinterestedness as indifference. Distinguish Benjamin's technical reproducibility thesis from Adorno's culture-industry critique.

## Initial scholarly source lead

- Stanford Encyclopedia of Philosophy: https://plato.stanford.edu/entries/aesthetic-concept/

The linked entry is a **starting research lead**, not verification of the claims above. Confirm its author credits, current contents, relevant section locators, and supplement with specialist academic literature before using it as evidence in the final audit.

## Publication gate

- Build `tests/audit/aesthetics.json` with a record for every sentence and source for every substantive claim.
- Obtain an independent second review, document disagreements and apply corrections.
- Generate `data/branches.js` article text and section-level `xs` citations from the audit record.
- Run `python3 tests/study_tools.py`, `python3 tests/links.py`, and `python3 tests/smoke.py`.
- Do not present these notes as a finished article or as evidence that tests passed.
