# Philosophy of mathematics: editorial research brief

Status: preparatory research, **not a completed or independently reviewed article**. Target: `data/branches.js` entry `id: "mathematics"` and the `frame-2026-10` specification in `CLAUDE.md`.

## Current-entry assessment

The existing philosophy of mathematics entry already addresses several of the core questions. Preserve useful material, but develop it into the prescribed 5,000–8,000-word article with 2–5 historical sections, 3–7 central-problem sections, cross-cultural encounters, criticisms, connections, and open questions.

## Research priorities

- Mathematical ontology and epistemology
- Logicism and foundations
- Formalism and incompleteness
- Constructivism and intuitionism
- Structuralism and mathematical explanation

## Conceptual safeguards

Distinguish the ontology of mathematical objects from epistemic access to mathematical truths. Contrast logicism, formalism, intuitionism and structuralism without treating them as exhaustive or unchanged schools. Gödel's incompleteness theorems require careful qualification about consistency, effective axiomatization and arithmetic strength.

## Starting reference

- Stanford Encyclopedia of Philosophy: https://plato.stanford.edu/entries/philosophy-mathematics/

This is a source lead, **not** proof that every proposed sentence has been verified. Check current entry authors, section locators, bibliographic details, and additional specialist scholarship before citing. Seek primary texts when attributing a distinctive thesis.

## Required acceptance criteria

1. Audit every sentence in `tests/audit/mathematics.json` with explicit claim types, source locators, evidence verdicts and quotation records.
2. Obtain independent second review and record corrections.
3. Generate the article and `xs` section citations from the audited text, preserving linkable thinker and concept names.
4. Run `python3 tests/study_tools.py`, `python3 tests/links.py` and `python3 tests/smoke.py`.
5. Keep the article changes separate from the research brief until the audit and tests pass.
