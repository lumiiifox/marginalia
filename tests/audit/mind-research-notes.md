# Philosophy of mind: editorial research brief

Status: preliminary research notes, **not a completed article or independent review**. Target: `data/branches.js` entry `id: "mind"`.

## Article framework

Develop the current entry into a 5,000–8,000-word article under the repository's `frame-2026-10` rules: start with “Scope and central questions,” include 2–5 history sections, 3–7 substantive problem sections, “Beyond the European canon,” “Criticisms and debates,” “Connections and influence,” and “Open questions.” Preserve existing valuable claims and linkable thinkers and concepts.

## Research priorities

- Mind-body relations
- Consciousness and qualia
- Intentionality and mental content
- Functionalism and cognition
- Embodiment and extended mind

## Accuracy safeguards

Distinguish phenomenal consciousness, access consciousness, intentionality and self-consciousness. Do not treat dualism and physicalism as exhaustive of all mind-body positions. Avoid presenting the hard problem as a settled refutation of physicalism.

## Initial scholarly source lead

- Stanford Encyclopedia of Philosophy: https://plato.stanford.edu/entries/consciousness/

The linked entry is a **starting research lead**, not verification of the claims above. Confirm its author credits, current contents, relevant section locators, and supplement with specialist academic literature before using it as evidence in the final audit.

## Publication gate

- Build `tests/audit/mind.json` with a record for every sentence and source for every substantive claim.
- Obtain an independent second review, document disagreements and apply corrections.
- Generate `data/branches.js` article text and section-level `xs` citations from the audit record.
- Run `python3 tests/study_tools.py`, `python3 tests/links.py`, and `python3 tests/smoke.py`.
- Do not present these notes as a finished article or as evidence that tests passed.
