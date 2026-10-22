# Philosophy of law: editorial research brief

Status: preparatory research, **not a completed or independently reviewed article**. Target: `data/branches.js` entry `id: "law"` and the `frame-2026-10` specification in `CLAUDE.md`.

## Current-entry assessment

The existing philosophy of law entry already addresses several of the core questions. Preserve useful material, but develop it into the prescribed 5,000–8,000-word article with 2–5 historical sections, 3–7 central-problem sections, cross-cultural encounters, criticisms, connections, and open questions.

## Research priorities

- Legal positivism
- Natural law and interpretivism
- Legal authority and obligation
- Rights and adjudication
- Punishment and legal institutions

## Conceptual safeguards

Distinguish the concept of legal validity from the moral legitimacy of a law. Hart's rule of recognition is not Austin's command theory; inclusive and exclusive positivists disagree about moral criteria. Differentiate Dworkin's interpretivism from natural-law theories. Treat adjudication, coercion and legal obligation separately.

## Starting reference

- Stanford Encyclopedia of Philosophy: https://plato.stanford.edu/entries/lawphil-nature/

This is a source lead, **not** proof that every proposed sentence has been verified. Check current entry authors, section locators, bibliographic details, and additional specialist scholarship before citing. Seek primary texts when attributing a distinctive thesis.

## Required acceptance criteria

1. Audit every sentence in `tests/audit/law.json` with explicit claim types, source locators, evidence verdicts and quotation records.
2. Obtain independent second review and record corrections.
3. Generate the article and `xs` section citations from the audited text, preserving linkable thinker and concept names.
4. Run `python3 tests/study_tools.py`, `python3 tests/links.py` and `python3 tests/smoke.py`.
5. Keep the article changes separate from the research brief until the audit and tests pass.
