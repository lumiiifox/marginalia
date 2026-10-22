# Philosophy of language: editorial research brief

**Status:** Preliminary research planning, not a finished article, sentence-level audit or independent scholarly review. Target: `data/branches.js`, `id: "language"` (`branch`).

## Expansion architecture

Follow `frame-2026-10` and preserve the existing entry's useful claims. Aim for 5,000–8,000 words with opening “Scope and central questions,” 2–5 historical sections, 3–7 problem/doctrine sections, “Beyond the European canon,” “Criticisms and debates,” “Connections and influence,” and “Open questions.” For cross-cultural comparisons, avoid asserting direct historical influence without evidence.

## Priority topics

- Ancient and medieval theories of signification
- Frege, Russell and analytic semantics
- Meaning and reference
- Context and pragmatics
- Speech acts and social language

## Accuracy cautions

Distinguish meaning, reference, truth conditions, pragmatics and speech acts. Do not equate Fregean sense with reference or Wittgenstein's later philosophy with a single universal theory of meaning.

## Source lead

- Stanford Encyclopedia of Philosophy: https://plato.stanford.edu/entries/meaning/

This link is an **initial lead, not verified sentence-level support**. Before citing it, verify the URL, article authorship, publication/revision date and relevant section locators. Collect additional specialist secondary and primary sources, including non-European scholarship where relevant.

## Requirements before an article PR

1. Complete `tests/audit/language.json`, recording each sentence, claims, precise sources and quotation checks.
2. Arrange independent second review and incorporate justified corrections.
3. Generate the article text and section-level `xs` citations from the audited record. Preserve valid cross-links to thinkers and concepts.
4. Run `python3 tests/study_tools.py`, `python3 tests/links.py` and `python3 tests/smoke.py`.
5. Keep the published entry unchanged until the article passes those gates.
